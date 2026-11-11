'use client';

import { Suspense, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Radio,
  Server,
  Shield,
  ShieldAlert,
  Sun,
  Wifi,
} from 'lucide-react';

function IoTLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('admin@hfme.io');
  const [password, setPassword] = useState('hfme_admin_2024');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const autoTriggered = useRef(false);

  const nextUrl = searchParams.get('next') || '/iot-security';
  const shouldAutoLogin = searchParams.get('auto') === '1';

  async function performLogin() {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error || 'Authentication failed. Please verify credentials.');
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
    <main
      data-theme={darkMode ? 'dark' : 'light'}
      className="min-h-screen bg-[#DCD7CC] text-[#242522] transition-colors"
    >
      <style>{`
        main[data-theme="dark"] { background: #171815 !important; color: #F5F3ED !important; color-scheme: dark; }
        main[data-theme="dark"] [class*="bg-[#DCD7CC]"] { background-color: #20221E !important; }
        main[data-theme="dark"] [class*="bg-[#EAE6DD]"] { background-color: #292B26 !important; }
        main[data-theme="dark"] [class*="bg-[#F0EDE5]"] { background-color: #30322C !important; }
        main[data-theme="dark"] [class*="border-[#D8D3C8]"] { border-color: #484A41 !important; }
        main[data-theme="dark"] [class*="text-[#242522]"], main[data-theme="dark"] [class*="text-[#34352F]"], main[data-theme="dark"] [class*="text-[#4E4F48]"] { color: #F5F3ED !important; }
        main[data-theme="dark"] [class*="text-[#686963]"], main[data-theme="dark"] [class*="text-[#817F76]"] { color: #B8B8AC !important; }
        main[data-theme="dark"] input { background-color: #20221E !important; color: #F5F3ED !important; border-color: #484A41 !important; }
        main[data-theme="dark"] input::placeholder { color: #A5A69A !important; }
      `}</style>

      {/* Top bar */}
      <header className="border-b border-[#D8D3C8] bg-[#EAE6DD]/95 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8F4937]/10 text-[#8F4937] ring-1 ring-[#8F4937]/20">
              <Shield size={22} />
            </div>
            <div>
              <p className="font-semibold tracking-wide text-[#242522]">
                HFME <span className="text-[#8F4937]">2.0</span>
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#686963]">
                IoT Security Operations Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle theme"
              className="inline-flex items-center gap-2 rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] px-3.5 py-2 text-xs font-medium text-[#34352F] transition hover:bg-[#DCD7CC]"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] px-3.5 py-2 text-xs font-medium text-[#34352F] transition hover:bg-[#DCD7CC]"
            >
              <ArrowLeft size={14} />
              <span>Main App Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Area */}
      <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Info Panel */}
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8F4937]/30 bg-[#8F4937]/10 px-3.5 py-1.5 text-xs font-semibold text-[#8F4937]">
              <Radio size={14} className="animate-pulse" />
              RESTRICTED ACCESS · SOC TELEMETRY NODE
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-[#242522] sm:text-5xl">
                IoT Threat Intelligence & Security Console
              </h1>
              <p className="text-base text-[#686963]">
                Authenticate with administrative credentials to access live IoT telemetry, device
                fleet triage, behavioral friction correlation, and synthetic threat injection.
              </p>
            </div>

            {/* Monitored fleet cards */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#817F76]">
                Connected Hardware Nodes
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#8F4937]">
                    <Cpu size={15} /> iot-cam-01
                  </div>
                  <p className="mt-1 text-xs text-[#686963]">Campus IP Camera</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[#4F5B45]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4F5B45]" /> Lab A · Active
                  </span>
                </div>

                <div className="rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#8F4937]">
                    <Wifi size={15} /> iot-sensor-02
                  </div>
                  <p className="mt-1 text-xs text-[#686963]">Environmental Sensor</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[#4F5B45]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4F5B45]" /> Lab A · Active
                  </span>
                </div>

                <div className="rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#8F4937]">
                    <Server size={15} /> iot-lock-03
                  </div>
                  <p className="mt-1 text-xs text-[#686963]">Smart Door Lock</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[#4F5B45]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4F5B45]" /> Main Gate · Active
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#D8D3C8] bg-[#EAE6DD]/70 p-4 text-xs text-[#686963]">
              <span className="font-semibold text-[#8F4937]">Research Prototype:</span> Real-time
              correlation between technical telemetry (packet bursts, auth failures) and Human
              Friction Scores (HFS).
            </div>
          </section>

          {/* Right Login Form */}
          <section className="rounded-2xl border border-[#D8D3C8] bg-[#EAE6DD] p-8 shadow-[0_12px_32px_rgba(36,37,34,0.08)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8F4937] text-white shadow-md shadow-[#8F4937]/20">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8F4937] font-bold">
                  Operator Login
                </p>
                <h2 className="text-xl font-bold text-[#242522]">Sign in to IoT Console</h2>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#686963]">
                  Security Officer Email
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-[#D8D3C8] bg-[#F0EDE5] px-4 py-3">
                  <Mail className="h-4 w-4 text-[#817F76]" />
                  <input
                    className="w-full bg-transparent text-sm text-[#242522] outline-none placeholder:text-[#A5A69A]"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@hfme.io"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#686963]">
                  Access Password
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-[#D8D3C8] bg-[#F0EDE5] px-4 py-3">
                  <Lock className="h-4 w-4 text-[#817F76]" />
                  <input
                    className="w-full bg-transparent text-sm text-[#242522] outline-none placeholder:text-[#A5A69A]"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="hfme_admin_2024"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-[#817F76] hover:text-[#242522]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-[#9B3932]/30 bg-[#9B3932]/10 px-4 py-3 text-xs font-medium text-[#9B3932]">
                  {error}
                </div>
              )}

              <button
                className="w-full rounded-xl bg-[#8F4937] px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#8F4937]/25 transition hover:bg-[#A9634E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isPending}
              >
                {isPending ? 'Authenticating Operator...' : 'Access IoT Security Console'}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-[#D8D3C8] bg-[#F0EDE5] p-3.5 text-xs text-[#686963]">
              <div className="flex items-center gap-2 font-semibold text-[#4F5B45]">
                <CheckCircle2 size={15} /> Demo Credentials Ready
              </div>
              <p className="mt-1">
                Default operator credentials (<code className="font-mono text-[#8F4937]">admin@hfme.io</code> /{' '}
                <code className="font-mono text-[#8F4937]">hfme_admin_2024</code>) are pre-filled.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function IoTLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#DCD7CC] text-sm text-[#686963]">
          Loading IoT Security Login...
        </div>
      }
    >
      <IoTLoginForm />
    </Suspense>
  );
}
