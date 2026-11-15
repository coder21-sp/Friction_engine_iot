export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-card px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl rounded-sm border border-border bg-secondary p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-sm border-2 border-border border-t-cyan-300" />
        Loading the HFME live control plane...
      </div>
    </div>
  );
}
