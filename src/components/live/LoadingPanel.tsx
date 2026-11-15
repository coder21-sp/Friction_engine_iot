'use client';

export function LoadingPanel({ label = 'Connecting to live AI stream...' }: { label?: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-sm border-2 border-border border-t-cyan-300" />
      {label}
    </div>
  );
}
