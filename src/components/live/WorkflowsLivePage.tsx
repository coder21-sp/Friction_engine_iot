'use client';

import Link from 'next/link';


import { AppShell } from '@/components/AppShell';
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary';
import { LoadingPanel } from '@/components/live/LoadingPanel';
import { Sparkline } from '@/components/live/Sparkline';
import { useLiveSnapshot } from '@/hooks/use-live-snapshot';
import type { LiveSnapshot } from '@/lib/live-types';
import { getFrictionLevel } from '@/lib/utils';

export function WorkflowsLivePage({
  initialSnapshot = null,
}: {
  initialSnapshot?: LiveSnapshot | null;
}) {
  const { data, error, isLoading, connectionStatus, refetch } = useLiveSnapshot(initialSnapshot);

  return (
    <AppShell connectionStatus={connectionStatus} connectionTimestamp={data?.generatedAt}>
      <ClientErrorBoundary>
        {isLoading || !data ? (
          <LoadingPanel label="Loading live workflows..." />
        ) : error ? (
          <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-8 text-red-800 dark:text-red-200">
            <p className="mb-4 text-base font-semibold">Live workflow data is unavailable.</p>
            <button
              className="rounded-sm bg-white px-4 py-2 text-sm font-medium text-slate-950"
              onClick={() => refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-sm border border-border bg-secondary p-8 ">
              <p className="text-sm uppercase tracking-wider text-primary">Workflow Control</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
                Every workflow is now running on the same live AI backbone.
              </h1>
              <p className="mt-3 max-w-3xl text-base text-muted-foreground">
                These cards update every second with fresh friction metrics, AI predictions, anomaly
                counts, and natural-language recommendations from the backend stream.
              </p>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              {data.workflows.map((workflow) => {
                const level = getFrictionLevel(workflow.overallFriction);
                return (
                  <Link
                    key={workflow.id}
                    href={`/workflows/${workflow.id}`}
                    className="group rounded-sm border border-border bg-card p-6 transition  hover:border-border"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-muted-foreground">Workflow</p>
                        <h2 className="mt-2 text-2xl font-semibold text-foreground">{workflow.name}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">{workflow.description}</p>
                      </div>

                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-4">
                      <StatBlock label="Friction" value={`${Math.round(workflow.overallFriction * 100)}`} accent={level.color} />
                      <StatBlock label="Sessions" value={`${workflow.sessionCount}`} />
                      <StatBlock label="Active users" value={`${workflow.activeUsers}`} />
                      <StatBlock label="Anomalies" value={`${workflow.anomalyCount}`} />
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="rounded-sm border border-border bg-secondary p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">

                          <p className="text-sm">Realtime trend</p>
                        </div>
                        <div className="mt-4">
                          <Sparkline
                            values={workflow.timeline.map((point) => point.frictionScore)}
                            stroke="#22d3ee"
                          />
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                          {workflow.trend}
                        </p>
                      </div>

                      <div className="rounded-sm border border-border bg-secondary p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">

                          <p className="text-sm">Latest AI insight</p>
                        </div>
                        <p className="mt-4 text-lg font-semibold text-foreground">
                          {workflow.latestInsight?.detectedIssue || 'AI insight warming up'}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {workflow.latestInsight?.recommendation ||
                            'Insight content will appear after the next analysis cycle.'}
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Suggested fix: {workflow.latestInsight?.suggestedFix || 'Pending'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {workflow.steps.map((step) => {
                        const stepLevel = getFrictionLevel(step.current.frictionScore);
                        return (
                          <div
                            key={step.id}
                            className="rounded-[1.25rem] border border-border bg-card p-4"
                          >
                            <p className="text-sm font-semibold text-foreground">{step.name}</p>
                            <div className="mt-3 flex items-end justify-between gap-3">
                              <div>
                                <p className="text-3xl font-semibold text-foreground">
                                  {Math.round(step.current.frictionScore * 100)}
                                </p>
                                <p className="text-xs text-muted-foreground">{step.status}</p>
                              </div>
                              <span
                                className="rounded-sm px-3 py-1 text-xs font-medium"
                                style={{
                                  backgroundColor: `${stepLevel.color}20`,
                                  color: stepLevel.color,
                                }}
                              >
                                {stepLevel.label}
                              </span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">

                              {Math.round(step.current.dropOffRate * 100)}% drop-off
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                );
              })}
            </section>
          </div>
        )}
      </ClientErrorBoundary>
    </AppShell>
  );
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-secondary p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold" style={{ color: accent || 'hsl(var(--foreground))' }}>
        {value}
      </p>
    </div>
  );
}
