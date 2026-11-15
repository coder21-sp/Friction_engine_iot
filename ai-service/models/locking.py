from functools import wraps


def model_operation(method):
    """Keep training, scaling, and inference atomic across worker threads."""
    @wraps(method)
    def wrapped(self, *args, **kwargs):
        with self._model_lock:
            return method(self, *args, **kwargs)
    return wrapped
