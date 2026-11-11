"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Cpu,
  Database,
  Filter,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Moon,
  Sun,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  X,
  Zap,
} from "lucide-react";

type IoTEvent = {
  event_id: string;
  timestamp: string;
  device_id: string;
  event_type: string;
  technical_threat_score: number;
  human_friction_score: number;
  combined_risk_score: number;
  severity: "low" | "medium" | "high";
  reasons: string[];
  source: string;
  risk_note: string;
};

type Device = {
  device_id: string;
  name: string;
  device_type: string;
  location: string;
};

type Snapshot = {
  prototype_mode: string;
  disclaimer: string;
  devices: Device[];
  events: IoTEvent[];
  summary: {
    device_count: number;
    event_count: number;
    high_severity_count: number;
    medium_severity_count: number;
  };
};

type SeverityFilter = "all" | "low" | "medium" | "high";

const panel =
  "rounded-2xl border border-[#D8D3C8] bg-[#EAE6DD] shadow-[0_8px_24px_rgba(36,37,34,0.07)]";
const muted = "text-[#686963]";
const severityStyle: Record<IoTEvent["severity"], string> = {
  low: "border-[#4F5B45]/30 bg-[#4F5B45]/10 text-[#4F5B45]",
  medium: "border-[#A47A35]/30 bg-[#A47A35]/10 text-[#A47A35]",
  high: "border-[#9B3932]/30 bg-[#9B3932]/10 text-[#9B3932]",
};

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}

function SeverityBadge({ severity }: { severity: IoTEvent["severity"] }) {
  const Icon =
    severity === "high"
      ? ShieldAlert
      : severity === "medium"
        ? AlertTriangle
        : ShieldCheck;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${severityStyle[severity]}`}
    >
      <Icon size={13} />
      {severity}
    </span>
  );
}

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "cyan" | "violet" | "rose";
}) {
  const colors = {
    cyan: "bg-[#8F4937]",
    violet: "bg-[#596B70]",
    rose: "bg-[#9B3932]",
  };
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-[#686963]">{label}</span>
        <span className="font-mono font-semibold text-[#242522]">
          {safeValue.toFixed(safeValue % 1 ? 1 : 0)}
          <span className="text-[#686963]"> / 100</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E3DFD5]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors[color]}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  detail,
  icon,
  tone,
}: {
  title: string;
  value: number | string;
  detail: string;
  icon: React.ReactNode;
  tone: "cyan" | "rose" | "amber" | "emerald";
}) {
  const tones = {
    cyan: "bg-[#8F4937]/10 text-[#8F4937] ring-[#8F4937]/20",
    rose: "bg-[#9B3932]/10 text-[#9B3932] ring-rose-400/20",
    amber: "bg-[#A47A35]/10 text-[#A47A35] ring-[#A47A35]/20",
    emerald: "bg-[#4F5B45]/10 text-[#4F5B45] ring-[#4F5B45]/20",
  };

  return (
    <div
      className={`${panel} p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#BDB8AC]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#686963]">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#242522]">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ring-1 ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs text-[#686963]">{detail}</p>
    </div>
  );
}

export function IoTSecurityDashboard() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  async function handleSignOut() {
    try {
      await fetch('/api/iot/reset', { method: 'POST' });
    } catch {
      // Ignore network errors on signout
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/iot-login';
  }

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/iot/snapshot", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/iot-login";
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Could not load IoT snapshot");
      }
      setData(body as Snapshot);
      setError("");
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load IoT snapshot");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function simulate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/iot/simulate", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/iot-login";
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Simulation failed");
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setBusy(false);
    }
  }

  const filteredEvents = useMemo(() => {
    const events = data?.events ?? [];
    const needle = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSeverity =
        severityFilter === "all" || event.severity === severityFilter;
      const matchesQuery =
        !needle ||
        [
          event.event_id,
          event.device_id,
          event.event_type,
          event.source,
          ...(event.reasons ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return matchesSeverity && matchesQuery;
    });
  }, [data?.events, query, severityFilter]);

  const selectedEvent =
    filteredEvents.find((event) => event.event_id === selectedEventId) ??
    data?.events.find((event) => event.event_id === selectedEventId) ??
    null;

  const averageRisk = useMemo(() => {
    const events = data?.events ?? [];
    if (!events.length) return 0;
    return Math.round(
      events.reduce((sum, event) => sum + event.combined_risk_score, 0) /
        events.length,
    );
  }, [data?.events]);

  return (
    <main
      data-theme={darkMode ? "dark" : "light"}
      className="min-h-screen bg-[#DCD7CC] text-[#242522]"
    >
      <style>{`
        main[data-theme="dark"] { background: #171815 !important; color: #F5F3ED !important; color-scheme: dark; }
        main[data-theme="dark"] [class*="bg-[#DCD7CC]"] { background-color: #20221E !important; }
        main[data-theme="dark"] [class*="bg-[#EAE6DD]"] { background-color: #292B26 !important; }
        main[data-theme="dark"] [class*="bg-[#F0EDE5]"] { background-color: #30322C !important; }
        main[data-theme="dark"] [class*="border-[#D8D3C8]"] { border-color: #484A41 !important; }
        main[data-theme="dark"] [class*="text-[#242522]"], main[data-theme="dark"] [class*="text-[#34352F]"], main[data-theme="dark"] [class*="text-[#4E4F48]"] { color: #F5F3ED !important; }
        main[data-theme="dark"] [class*="text-[#686963]"], main[data-theme="dark"] [class*="text-[#817F76]"] { color: #B8B8AC !important; }
        main[data-theme="dark"] input, main[data-theme="dark"] select { background-color: #20221E !important; color: #F5F3ED !important; border-color: #484A41 !important; }
        main[data-theme="dark"] input::placeholder { color: #A5A69A !important; }
        main[data-theme="dark"] header { background-color: rgba(41,43,38,.96) !important; border-color: #484A41 !important; }
        main[data-theme="dark"] aside { background-color: #22241F !important; border-color: #484A41 !important; }
        main[data-theme="dark"] table tr, main[data-theme="dark"] [class*="border-b"] { border-color: #484A41 !important; }
      `}</style>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[#D8D3C8] bg-[#EAE6DD] p-5 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8F4937]/10 text-[#8F4937] ring-1 ring-[#8F4937]/20">
              <Shield size={22} />
            </div>
            <div>
              <p className="font-semibold tracking-wide text-[#242522]">
                HFME <span className="text-[#8F4937]">2.0</span>
              </p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#686963]">
                Security console
              </p>
            </div>
          </div>

          <div className="mt-10">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#817F76]">
              Workspace
            </p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#8F4937]/35 bg-[#8F4937]/10 px-3 py-3 text-sm font-medium text-[#8F4937]">
              <LayoutDashboard size={17} /> Security overview
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#686963]">
              <Cpu size={17} /> Device inventory
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#686963]">
              <Activity size={17} /> Event investigation
            </div>
            <Link
              href="/"
              className="mt-4 flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-[#686963] transition hover:border-[#D8D3C8] hover:bg-[#DCD7CC] hover:text-[#242522]"
            >
              <ArrowLeft size={17} /> Back to Dashboard
            </Link>
          </div>

          <div className="mt-auto rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A47A35]">
              <CircleHelp size={15} /> Research mode
            </div>
            <p className="mt-2 text-xs leading-5 text-[#686963]">
              Synthetic events only. This console is a research prototype, not a
              live SOC.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#D8D3C8] bg-[#EAE6DD]/95 px-4 py-4 backdrop-blur-xl sm:px-7">
            <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8F4937]/10 text-[#8F4937] lg:hidden">
                  <Shield size={21} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-[#242522] sm:text-2xl">
                      IoT Security Monitoring
                    </h1>
                    <span className="rounded-md border border-[#A47A35]/30 bg-[#A47A35]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A47A35]">
                      Demo environment
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#686963]">
                    HFME 2.0 / Fixed 70:30 Technical Threat &amp; HFS Risk Correlation
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 flex items-center gap-2 text-xs text-[#686963]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4F5B45] opacity-30" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4F5B45]" />
                  </span>
                  Local API
                  {lastUpdated && (
                    <span className="hidden xl:inline">
                      · Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] px-3.5 py-2.5 text-sm font-medium text-[#34352F] transition hover:border-[#BDB8AC] hover:bg-[#DCD7CC]"
                >
                  <ArrowLeft size={15} />
                  <span>Main Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setDarkMode((current) => !current)}
                  aria-label={
                    darkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                  aria-pressed={darkMode}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] px-3.5 py-2.5 text-sm font-medium text-[#34352F] transition hover:border-[#BDB8AC] hover:bg-[#DCD7CC]"
                >
                  {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                  <span>{darkMode ? "Light mode" : "Dark mode"}</span>
                </button>
                <button
                  onClick={() => void refresh()}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] px-3.5 py-2.5 text-sm font-medium text-[#34352F] transition hover:border-[#BDB8AC] hover:bg-[#DCD7CC] disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
                <button
                  onClick={() => void simulate()}
                  disabled={busy || refreshing}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#8F4937] px-3.5 py-2.5 text-sm font-semibold text-[#FBFAF6] transition hover:bg-[#A9634E] disabled:cursor-wait disabled:opacity-50"
                >
                  <Zap size={15} className={busy ? "animate-pulse" : ""} />
                  {busy ? "Generating…" : "Simulate event"}
                </button>
                <button
                  onClick={() => void handleSignOut()}
                  title="Sign out of IoT Console"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D8D3C8] bg-[#EAE6DD] px-3 py-2.5 text-sm font-medium text-[#9B3932] transition hover:bg-[#9B3932]/10"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-7">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-[#9B3932]/30 bg-[#9B3932]/10 p-4 text-sm text-[#9B3932]"
              >
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <div className="flex-1">{error}</div>
                <button onClick={() => setError("")} aria-label="Dismiss error">
                  <X size={16} />
                </button>
              </div>
            )}

            {loading && !data ? (
              <div
                className={`${panel} flex items-center gap-3 p-8 text-[#686963]`}
              >
                <RefreshCw size={18} className="animate-spin text-[#8F4937]" />
                Loading prototype telemetry…
              </div>
            ) : data ? (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    title="Registered devices"
                    value={data.summary.device_count}
                    detail="Devices in the demo inventory"
                    icon={<Cpu size={20} />}
                    tone="cyan"
                  />
                  <Metric
                    title="Recorded events"
                    value={data.summary.event_count}
                    detail="Events retained by the prototype"
                    icon={<Database size={20} />}
                    tone="emerald"
                  />
                  <Metric
                    title="High severity"
                    value={data.summary.high_severity_count}
                    detail="Events classified as high"
                    icon={<ShieldAlert size={20} />}
                    tone="rose"
                  />
                  <Metric
                    title="Average combined risk"
                    value={`${averageRisk}/100`}
                    detail="Average of events currently returned"
                    icon={<Gauge size={20} />}
                    tone="amber"
                  />
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
                  <div className={`${panel} overflow-hidden`}>
                    <div className="flex flex-col justify-between gap-3 border-b border-[#D8D3C8] p-5 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="font-semibold text-[#242522]">
                          Security event stream
                        </h2>
                        <p className={`mt-1 text-xs ${muted}`}>
                          Inspect synthetic telemetry and risk classifications
                        </p>
                      </div>
                      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8D3C8] px-3 py-1.5 text-xs text-[#686963]">
                        <Activity size={13} className="text-[#8F4937]" />
                        {filteredEvents.length} visible
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 border-b border-[#D8D3C8] p-4 sm:flex-row">
                      <label className="relative flex-1">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686963]"
                        />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search device, event, reason…"
                          className="w-full rounded-xl border border-[#D8D3C8] bg-[#F0EDE5] py-2.5 pl-9 pr-3 text-sm text-[#34352F] outline-none placeholder:text-[#817F76] focus:border-[#8F4937]/70"
                        />
                      </label>
                      <label className="flex items-center gap-2 rounded-xl border border-[#D8D3C8] bg-[#F0EDE5] px-3">
                        <Filter size={15} className="text-[#686963]" />
                        <select
                          value={severityFilter}
                          onChange={(e) =>
                            setSeverityFilter(e.target.value as SeverityFilter)
                          }
                          className="bg-transparent py-2.5 text-sm text-[#242522] outline-none"
                          aria-label="Filter by severity"
                        >
                          <option value="all" className="bg-[#F0EDE5]">
                            All severity
                          </option>
                          <option value="low" className="bg-[#F0EDE5]">
                            Low
                          </option>
                          <option value="medium" className="bg-[#F0EDE5]">
                            Medium
                          </option>
                          <option value="high" className="bg-[#F0EDE5]">
                            High
                          </option>
                        </select>
                      </label>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-[#EAE6DD] text-[10px] uppercase tracking-[0.15em] text-[#686963]">
                          <tr>
                            <th className="px-5 py-3 font-semibold">
                              Event / time
                            </th>
                            <th className="px-4 py-3 font-semibold">Device</th>
                            <th className="px-4 py-3 font-semibold">
                              Severity
                            </th>
                            <th className="px-4 py-3 font-semibold">Threat</th>
                            <th className="px-4 py-3 font-semibold">HFS</th>
                            <th className="px-5 py-3 text-right font-semibold">
                              Risk
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D8D3C8]">
                          {filteredEvents.map((event) => (
                            <tr
                              key={event.event_id}
                              onClick={() => setSelectedEventId(event.event_id)}
                              className={`cursor-pointer transition hover:bg-[#8F4937]/[0.04] ${selectedEventId === event.event_id ? "bg-[#8F4937]/[0.07]" : ""}`}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`mt-0.5 rounded-lg p-2 ${event.severity === "high" ? "bg-[#9B3932]/10 text-[#9B3932]" : event.severity === "medium" ? "bg-[#A47A35]/10 text-[#A47A35]" : "bg-[#4F5B45]/10 text-[#4F5B45]"}`}
                                  >
                                    <Activity size={15} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-[#34352F]">
                                      {event.event_type.replaceAll("_", " ")}
                                    </p>
                                    <p className="mt-1 text-xs text-[#686963]">
                                      {formatTime(event.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-mono text-xs text-[#686963]">
                                {event.device_id}
                              </td>
                              <td className="px-4 py-4">
                                <SeverityBadge severity={event.severity} />
                              </td>
                              <td className="px-4 py-4 font-mono text-[#4E4F48]">
                                {event.technical_threat_score}
                              </td>
                              <td className="px-4 py-4 font-mono text-[#4E4F48]">
                                {event.human_friction_score}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span
                                  className={`font-mono text-base font-semibold ${event.combined_risk_score >= 60 ? "text-[#9B3932]" : event.combined_risk_score >= 30 ? "text-[#A47A35]" : "text-[#4F5B45]"}`}
                                >
                                  {event.combined_risk_score.toFixed(1)}
                                </span>
                                <span className="ml-1 text-xs text-[#817F76]">
                                  /100
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredEvents.length === 0 && (
                        <div className="p-10 text-center">
                          <Search
                            size={22}
                            className="mx-auto text-[#817F76]"
                          />
                          <p className="mt-3 text-sm text-[#686963]">
                            No matching events
                          </p>
                          <p className="mt-1 text-xs text-[#817F76]">
                            Try another search term or severity filter.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-[#D8D3C8] px-5 py-3 text-xs text-[#686963]">
                      <span>Showing events returned by the API</span>
                      <span className="flex items-center gap-1.5">
                        <Clock3 size={13} /> Most recent first
                      </span>
                    </div>
                  </div>

                  <aside className="space-y-6">
                    <div className={`${panel} p-5`}>
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-[#242522]">
                          Alert investigation
                        </h2>
                        <LockKeyhole size={17} className="text-[#686963]" />
                      </div>
                      {selectedEvent ? (
                        <div className="mt-5 space-y-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-xs text-[#686963]">
                              #{selectedEvent.event_id}
                            </span>
                            <SeverityBadge severity={selectedEvent.severity} />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-[#242522]">
                              {selectedEvent.event_type.replaceAll("_", " ")}
                            </p>
                            <p className="mt-1 text-xs text-[#686963]">
                              {selectedEvent.device_id} ·{" "}
                              {formatTime(selectedEvent.timestamp)}
                            </p>
                          </div>
                          <div className="space-y-4 rounded-xl border border-[#D8D3C8] bg-[#F0EDE5] p-4">
                            <ScoreBar
                              label="Technical threat (70% weight)"
                              value={selectedEvent.technical_threat_score}
                              color="cyan"
                            />
                            <ScoreBar
                              label="Human friction - HFS (30% weight)"
                              value={selectedEvent.human_friction_score}
                              color="violet"
                            />
                            <ScoreBar
                              label="Combined risk (0.70 × Threat + 0.30 × HFS)"
                              value={selectedEvent.combined_risk_score}
                              color="rose"
                            />
                          </div>
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#686963]">
                              Triggered reasons
                            </p>
                            <ul className="space-y-2">
                              {(selectedEvent.reasons?.length
                                ? selectedEvent.reasons
                                : ["No reason details provided"]
                              ).map((reason, i) => (
                                <li
                                  key={`${reason}-${i}`}
                                  className="flex gap-2 text-sm leading-5 text-[#4E4F48]"
                                >
                                  <ChevronRight
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[#8F4937]"
                                  />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-lg border border-[#D8D3C8] bg-[#DCD7CC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#686963]">
                              Source
                            </p>
                            <p className="mt-1 text-sm text-[#4E4F48]">
                              {selectedEvent.source || "Not provided"}
                            </p>
                            {selectedEvent.risk_note && (
                              <p className="mt-2 text-xs leading-5 text-[#686963]">
                                {selectedEvent.risk_note}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <ShieldCheck
                            size={28}
                            className="mx-auto text-[#817F76]"
                          />
                          <p className="mt-3 text-sm text-[#4E4F48]">
                            Select an event to investigate
                          </p>
                          <p className="mt-1 text-xs text-[#686963]">
                            Scores and triggered reasons will appear here.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className={`${panel} p-5`}>
                      <div className="flex items-center gap-2">
                        <Server size={17} className="text-[#8F4937]" />
                        <h2 className="font-semibold text-[#242522]">
                          Device inventory
                        </h2>
                      </div>
                      <p className="mt-1 text-xs text-[#686963]">
                        Registered prototype devices
                      </p>
                      <div className="mt-4 space-y-3">
                        {data.devices.map((device) => (
                          <div
                            key={device.device_id}
                            className="flex items-start gap-3 rounded-xl border border-[#D8D3C8] bg-[#F0EDE5] p-3"
                          >
                            <div className="rounded-lg bg-[#8F4937]/10 p-2 text-[#8F4937]">
                              <Wifi size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[#34352F]">
                                {device.name}
                              </p>
                              <p className="mt-1 text-xs text-[#686963]">
                                {device.device_type} · {device.location}
                              </p>
                              <p className="mt-1 font-mono text-[10px] text-[#817F76]">
                                {device.device_id}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>
                </section>

                <div className="flex flex-col gap-2 rounded-xl border border-[#A47A35]/30 bg-[#A47A35]/[0.08] p-4 sm:flex-row sm:items-start">
                  <AlertTriangle
                    size={17}
                    className="mt-0.5 shrink-0 text-[#A47A35]"
                  />
                  <p className="text-xs leading-5 text-[#775A2D]">
                    <strong className="text-[#8B6428]">
                      Research prototype limitation:
                    </strong>{" "}
                    {data.disclaimer} Combined risk uses the prototype weighting
                    of 70% technical threat and 30% HFS. It is not a validated
                    probability of attack. HFS is a demo input in this version
                    and is not automatically extracted from live HFME events.
                  </p>
                </div>
              </>
            ) : (
              <div className={`${panel} p-8 text-sm text-[#686963]`}>
                No snapshot data is available. Check that the FastAPI backend is
                running, then refresh.
              </div>
            )}

            <footer className="flex flex-col justify-between gap-2 border-t border-[#D8D3C8] pt-4 text-xs text-[#817F76] sm:flex-row">
              <span>HFME 2.0 · IoT Security Research Prototype</span>
              <span>Local development environment · Synthetic telemetry</span>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
