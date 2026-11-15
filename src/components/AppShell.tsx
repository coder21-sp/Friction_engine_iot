'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';


import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectionBadge } from '@/components/live/ConnectionBadge';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/iot-security', label: 'IoT Security' },
  { href: '/admin', label: 'Admin' },
];

export function AppShell({
  connectionStatus,
  connectionTimestamp,
  children,
}: {
  connectionStatus?: 'connecting' | 'live' | 'reconnecting' | 'error';
  connectionTimestamp?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card ">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm uppercase tracking-wider text-primary">HFME 2.0</p>
              <p className="text-sm text-muted-foreground">Workflow monitoring</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-sm px-4 py-2 text-sm transition ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {connectionStatus ? (
              <ConnectionBadge status={connectionStatus} timestamp={connectionTimestamp} />
            ) : null}
            <ThemeToggle />
            <button
              className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-border hover:bg-secondary disabled:opacity-60"
              disabled={isPending}
              onClick={signOut}
              type="button"
            >

              Sign out
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 sm:px-6 md:hidden">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
