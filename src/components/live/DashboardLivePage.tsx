'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';


import { AIInsightCard } from '@/components/AIInsightCard';
import { AppShell } from '@/components/AppShell';
import { ClientErrorBoundary } from '@/components/ClientErrorBoundary';
import DashboardWithIntro from '@/components/DashboardWithIntro';
import { FrictionChart3D } from '@/components/FrictionChart3D';
import { HeatmapGrid } from '@/components/live/HeatmapGrid';
import { LoadingPanel } from '@/components/live/LoadingPanel';
import { Sparkline } from '@/components/live/Sparkline';
import { useLiveSnapshot } from '@/hooks/use-live-snapshot';
import type { LiveSnapshot } from '@/lib/live-types';
import { getFrictionLevel } from '@/lib/utils';

export function DashboardLivePage({ initialSnapshot = null }: { initialSnapshot?: LiveSnapshot | null }) {
  const { data, error, isLoading, connectionStatus, refetch } = useLiveSnapshot(initialSnapshot);

  return (
    <DashboardWithIntro>
      <AppShell connectionStatus={connectionStatus} connectionTimestamp={data?.generatedAt}>
        <ClientErrorBoundary>
          {error ? (
            <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-8 text-sm text-red-800 dark:text-red-200">
              <p className="mb-4 text-base font-semibold">Live AI data could not be loaded.</p>
              <button
                className="rounded-sm bg-white px-4 py-2 text-sm font-medium text-slate-950"
                onClick={() => refetch()}
                type="button"
              >
                Retry live sync
              </button>
            </div>
          ) : isLoading || !data ? (
            <LoadingPanel />
          ) : (
            <DashboardContent snapshot={data} />
          )}
        </ClientErrorBoundary>
      </AppShell>
    </DashboardWithIntro>
  );
}

function DashboardContent({ snapshot }: { snapshot: LiveSnapshot }) {
  const level = getFrictionLevel(snapshot.dashboard.averageFriction);
  const topHeat = [...snapshot.dashboard.heatmap]
    .sort((left, right) => right.frictionScore - left.frictionScore)
    .slice(0, 8);
  const topWorkflows = [...snapshot.workflows]
    .sort((left, right) => right.overallFriction - left.overallFriction)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-sm border border-border bg-secondary p-8   ">

          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Find where workflows slow down.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Track completion, drop-off, and unusual activity across your workflows.
            The figures below update as new events arrive.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/iot-security"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-secondary px-4 py-2 text-xs font-medium text-primary transition hover:bg-secondary"
            >

              Open IoT Security Dashboard

            </Link>
            <Link
              href="/workflows"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-secondary px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >

              View Workflows

            </Link>
          </div>

          <div className="mt-8 divide-y divide-border border-y border-border">
            <MetricCard
              label="Average friction"
              value={`${Math.round(snapshot.dashboard.averageFriction * 100)}`}
              meta={level.label}
              accent={level.color}
            />
            <MetricCard
              label="Total sessions"
              value={snapshot.dashboard.totalSessions.toLocaleString()}
              meta="Streaming"
              accent="#38bdf8"
            />
            <MetricCard
              label="Active alerts"
              value={`${snapshot.dashboard.alerts.length}`}
              meta="AI anomaly watch"
              accent="#fb7185"
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-sm border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Live KPIs</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SimpleStat label="Active workflows" value={snapshot.dashboard.activeWorkflows} />
              <SimpleStat
                label="Average drop-off"
                value={`${Math.round(snapshot.dashboard.averageDropOffRate * 100)}%`}
              />
              <SimpleStat label="AI anomalies" value={snapshot.dashboard.anomalyCount} />
              <SimpleStat label="Last tick" value={`#${snapshot.tick}`} />
            </div>
          </div>

          <div className="rounded-sm border border-border     p-6">
            <div className="flex items-center gap-2 text-primary">

              <p className="text-xs uppercase tracking-wider">Latest recommendation</p>
            </div>
            <p className="mt-4 text-xl font-semibold text-foreground">
              {snapshot.dashboard.insights[0]?.detectedIssue || 'Realtime insight warming up'}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {snapshot.dashboard.insights[0]?.recommendation ||
                'Waiting for the next live pass across the monitored workflows.'}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Suggested fix: {snapshot.dashboard.insights[0]?.suggestedFix || 'Stand by for AI recommendation.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-muted-foreground">Live friction heatmap</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">Workflow hotspots updating every second</h2>
          </div>
          <div className="rounded-sm border border-border bg-secondary px-4 py-2 text-xs text-muted-foreground">
            {snapshot.dashboard.heatmap.length} monitored step surfaces
          </div>
        </div>
        <HeatmapGrid
          items={snapshot.dashboard.heatmap.map((item) => ({
            id: `${item.workflowId}-${item.stepId}`,
            label: item.stepName,
            value: item.frictionScore,
            sublabel: item.workflowName,
          }))}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-sm border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Landscape</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Realtime friction topology</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Live step-by-step friction scores updated at{' '}
                {new Date(snapshot.generatedAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-sm border border-border bg-secondary px-3 py-1 text-xs text-primary">

              Live 3D surface
            </div>
          </div>
          <div className="h-[360px] rounded-sm bg-background p-4">
            <FrictionChart3D
              data={topHeat.map((item) => ({
                label: item.stepName,
                frictionScore: item.frictionScore,
                avgTime: 0,
                dropOff: 0,
                color: '#38bdf8',
              }))}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-card p-6">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">AI anomaly alerts</p>
            <div className="mt-4 space-y-4">
              {snapshot.dashboard.alerts.slice(0, 4).map((alert) => (
                <div key={`${alert.workflowId}-${alert.stepId}`} className="rounded-sm border border-rose-500/20 bg-rose-500/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{alert.issue}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {alert.workflowName} / {alert.stepName}
                      </p>
                    </div>
                    <div className="rounded-sm bg-secondary px-3 py-1 text-xs text-foreground">
                      {(alert.score * 100).toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
              {!snapshot.dashboard.alerts.length ? (
                <p className="rounded-sm border border-border bg-secondary p-4 text-sm text-muted-foreground">
                  No active anomaly alerts on this tick.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card p-6">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">Watchlist</p>
            <div className="mt-4 space-y-4">
              {topWorkflows.map((workflow) => (
                <Link
                  key={workflow.id}
                  href={`/workflows/${workflow.id}`}
                  className="block rounded-sm border border-border bg-secondary p-4 transition hover:border-border hover:bg-secondary"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">{workflow.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {workflow.activeUsers} active users • {workflow.sessionCount} sessions
                      </p>
                    </div>

                  </div>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold text-foreground">
                        {Math.round(workflow.overallFriction * 100)}
                      </p>
                      <p className="text-xs text-muted-foreground">{workflow.trend} trend</p>
                    </div>
                    <div className="w-40">
                      <Sparkline
                        values={workflow.timeline.map((point) => point.frictionScore)}
                        stroke="#67e8f9"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center gap-3">

          <div>
            <p className="text-sm uppercase tracking-wider text-muted-foreground">Latest AI insights</p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">Recommended changes</h2>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {snapshot.dashboard.insights.slice(0, 3).map((insight) => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  meta,
  accent,
}: {
  label: string;
  value: string;
  meta: string;
  accent: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5 transition ">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{meta}</span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SimpleStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-sm border border-border bg-secondary p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
