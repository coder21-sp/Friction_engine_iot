'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('admin@hfme.io');
  const [password, setPassword] = useState('hfme_admin_2024');
  const [error, setError] = useState('');
  const autoTriggered = useRef(false);

  const nextUrl = searchParams.get('next') || '/';
  const shouldAutoLogin = searchParams.get('auto') === '1';

  async function performLogin() {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error || 'Unable to sign in.');
      return;
    }

    router.push(nextUrl);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    startTransition(async () => {
      await performLogin();
    });
  }

  useEffect(() => {
    if (!shouldAutoLogin || autoTriggered.current) {
      return;
    }

    autoTriggered.current = true;
    startTransition(async () => {
      await performLogin();
    });
  }, [nextUrl, password, shouldAutoLogin, email, router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-8">
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
                Understand where work gets stuck.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Review workflow activity, investigate delays, and manage monitoring settings.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                'Live behavioral events and friction shifts every second',
                'Streaming anomaly detection, prediction, and explainability',
                'Protected admin controls for retraining and sensitivity tuning',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-sm border border-border bg-secondary p-4 text-sm text-muted-foreground "
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-sm border border-border bg-card p-8   ">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-primary">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wider text-primary">Secure Access</p>
                <h2 className="text-2xl font-semibold">HFME Control Plane</h2>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm text-muted-foreground">Admin email</span>
                <div className="flex items-center gap-3 rounded-sm border border-border bg-secondary px-4 py-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@hfme.io"
                    type="email"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-muted-foreground">Password</span>
                <div className="flex items-center gap-3 rounded-sm border border-border bg-secondary px-4 py-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="hfme_admin_2024"
                    type="password"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-sm border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                className="w-full rounded-sm bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isPending}
              >
                {isPending ? 'Signing in...' : 'Enter HFME'}
              </button>
            </form>

            <div className="mt-6 rounded-sm border border-border bg-secondary p-4 text-sm text-muted-foreground">
              Default seeded credentials are prefilled so local verification is fast.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
