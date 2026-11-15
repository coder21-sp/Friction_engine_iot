import asyncio
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from live_runtime import LiveRuntime
from models.anomaly_detector import AnomalyDetector
from models.friction_predictor import FrictionPredictor
from models.insight_generator import InsightGenerator


class ExplanationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.detector = AnomalyDetector()
        self.detector.model_path = Path(self.directory.name)
        self.features = np.random.default_rng(42).random((40, 6))
        self.detector.train(self.features)

    def test_latest_explanation_reuses_tree_and_invalidates_after_training(self):
        calls = []
        class Tree:
            def __init__(self, model):
                calls.append('tree')
            def shap_values(self, rows):
                calls.append(len(rows))
                return np.ones_like(rows)
        with patch.dict(sys.modules, {'shap': SimpleNamespace(TreeExplainer=Tree)}):
            for _ in range(2):
                explanation = self.detector.explain(self.features, latest_only=True)
                self.assertEqual(len(explanation), 1)
                self.assertEqual(explanation[0][0]['value'], self.features[-1, 0])
            self.assertEqual(calls, ['tree', 1, 1])
            self.detector.train(self.features)
            self.detector.explain(self.features, latest_only=True)
            self.assertEqual(calls, ['tree', 1, 1, 'tree', 1])

    def test_latest_fallback_keeps_history_baseline(self):
        with patch.dict(sys.modules, {'shap': None}):
            full = self.detector.explain(self.features)
            latest = self.detector.explain(self.features, latest_only=True)
        self.assertEqual(latest, full[-1:])
        self.assertGreater(latest[0][0]['impact'], 0)


class ResponsivenessTests(unittest.IsolatedAsyncioTestCase):
    async def test_snapshot_remains_available_during_slow_explanation(self):
        with tempfile.TemporaryDirectory() as directory:
            detector = AnomalyDetector()
            predictor = FrictionPredictor()
            detector.model_path = predictor.model_path = Path(directory)
            runtime = LiveRuntime(detector, predictor, InsightGenerator())
            # Do not require a Redis process for this regression check.
            async def no_redis():
                runtime.redis_connected = False
            runtime._connect_redis = no_redis
            entered = threading.Event()
            original = detector.explain
            def slow_explanation(*args, **kwargs):
                entered.set()
                time.sleep(0.3)
                return original(*args, **kwargs)
            detector.explain = slow_explanation
            with patch.dict(sys.modules, {'shap': None}):
                await runtime.start()
                try:
                    scheduled = time.monotonic()
                    async with asyncio.timeout(5):
                        while not entered.is_set():
                            await asyncio.sleep(0.01)
                    self.assertLess(time.monotonic() - scheduled, 0.25)
                    started = time.monotonic()
                    # The event loop must serve reads while the worker is busy.
                    snapshot = await runtime.get_snapshot()
                    await asyncio.sleep(0.02)
                    self.assertLess(time.monotonic() - started, 0.2)
                    self.assertGreater(len(snapshot['workflows']), 0)
                finally:
                    await runtime.stop()
                    # Let the in-flight worker finish before removing its files.
                    await asyncio.sleep(0.35)


if __name__ == '__main__':
    unittest.main()
