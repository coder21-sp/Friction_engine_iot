'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-card text-foreground">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
          <div className="w-full rounded-sm border border-red-500/20 bg-red-500/10 p-8">
            <p className="text-sm uppercase tracking-wider text-red-800 dark:text-red-200">HFME error boundary</p>
            <h1 className="mt-4 text-3xl font-semibold">A runtime error interrupted the live dashboard.</h1>
            <p className="mt-3 text-sm text-red-800 dark:text-red-200">
              Reset the route to reconnect to the stream and reload the latest AI state.
            </p>
            <button
              className="mt-6 rounded-sm bg-white px-5 py-3 font-semibold text-slate-950"
              onClick={() => reset()}
              type="button"
            >
              Reset route
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
