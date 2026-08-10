import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Home,
  Layers,
  Send,
  Sparkles,
  Sun,
  Target,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { DSATGlassAchievementIllustration } from "@/components/hero/DSATGlassAchievementIllustration";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/dsat-advantage-logo.png";
import "./index.css";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  getUserExamCountdown,
  setUserExamCountdown,
} from "@/server-fns/user-exam-countdown.functions";

type GetUserExamCountdownInput = Parameters<typeof getUserExamCountdown>[0];
type SetUserExamCountdownInput = Parameters<typeof setUserExamCountdown>[0];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DSAT Advantage — Prep Smart. Score Higher." },
      {
        name: "description",
        content:
          "Ace the DSAT with high-quality questions, smart practice, and accurate score insights.",
      },
      {
        property: "og:title",
        content: "DSAT Advantage — Prep Smart. Score Higher.",
      },
      {
        property: "og:description",
        content:
          "Ace the DSAT with high-quality questions, smart practice, and accurate score insights.",
      },
    ],
  }),
  component: Landing,
});

function GlassHeader({ userInitial }: { userInitial: string }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[84px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-sm">
              <img src={logo} alt="DSAT" className="h-8 w-8" />
            </div>
            <div className="hidden flex-col leading-tight md:flex">
              <span className="text-base font-extrabold tracking-tight text-slate-950">
                DSAT
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-blue-600">
                ADVANTAGE
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 xl:flex">
            <HeaderNavItem
              active
              icon={<Home className="h-4 w-4" />}
              label="Home"
            />
            <HeaderNavItem
              to="/exams"
              icon={<ClipboardList className="h-4 w-4" />}
              label="Practice Tests"
            />
            <HeaderNavItem
              to="/questions-bank"
              icon={<Layers className="h-4 w-4" />}
              label="Question Bank"
            />
            <HeaderNavItem
              to="/score-estimator"
              icon={<BarChart3 className="h-4 w-4" />}
              label="Score Estimator"
            />
            <HeaderNavItem
              to="/questions-bank"
              icon={<BookOpen className="h-4 w-4" />}
              label="Vocabulary"
              badge="New"
            />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200">
            <Sun className="h-5 w-5" />
          </button>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white shadow-sm">
            {userInitial}
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderNavItem({
  to = "/",
  icon,
  label,
  badge,
  active,
}: {
  to?: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span className="text-current">{icon}</span>
      <span>{label}</span>
      {badge ? (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarNavItem({
  to = "/",
  icon,
  label,
  active,
}: {
  to?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-[1.5rem] px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-[0_12px_30px_-18px_rgba(10,76,255,0.6)]"
          : "text-slate-300 hover:bg-slate-900/90 hover:text-white"
      }`}
    >
      <span className="text-current">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function Landing() {
  const { user, session, loading } = useAuth() as any;
  const userName =
    (user?.user_metadata as any)?.full_name ||
    user?.email?.split("@")[0] ||
    "Codeprodigy";
  const userInitial = userName?.[0]?.toUpperCase() || "C";

  const accessToken = session?.access_token as string | undefined;

  const [examDate, setExamDate] = useState<string>(""); // YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const examDateStorageKey = "dsatExamDate";

  // Target score widget (hero right-side)
  const targetScoreStorageKey = "targetScore";
  const [targetScore, setTargetScore] = useState<number>(0);

  // Animated/visible score (counts up smoothly from 0)
  const [animatedTargetScore, setAnimatedTargetScore] = useState<number>(0);

  useEffect(() => {
    // Restore persisted target score
    try {
      const raw = localStorage.getItem(targetScoreStorageKey);
      if (raw) {
        const next = Number(raw);
        if (!Number.isNaN(next)) {
          const clamped = Math.max(
            400,
            Math.min(1600, Math.round(next / 10) * 10),
          );
          setTargetScore(clamped);
        }
      }
    } catch {
      // ignore
    }

    // Animate entrance on every page load/refresh
    const final = (() => {
      try {
        const raw = localStorage.getItem(targetScoreStorageKey);
        const next = raw ? Number(raw) : NaN;
        if (Number.isNaN(next)) return 0;
        return Math.max(400, Math.min(1600, Math.round(next / 10) * 10));
      } catch {
        return 0;
      }
    })();

    setAnimatedTargetScore(0);
    let raf = 0;
    const start = performance.now();
    const durationMs = 700;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(eased * final);
      setAnimatedTargetScore(val);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep animated value in sync if targetScore is changed after mount (e.g. user picks a new one)
  useEffect(() => {
    if (!targetScore) return;
    setAnimatedTargetScore((prev) => {
      // immediate update for subsequent selections; animations are triggered on mount
      return prev === targetScore ? prev : targetScore;
    });
  }, [targetScore]);

  // Restore previously selected date immediately so refresh doesn't reset the UI.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(examDateStorageKey);
      if (!raw) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return;

      const [y, m, d] = raw.split("-").map((x: string) => Number(x));
      setExamDate(raw);
      setSelectedDate(new Date(Date.UTC(y, m - 1, d)));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  function utcPlus5FromExamDateYMD(ymd: string) {
    const [y, m, d] = ymd.split("-").map((x: string) => Number(x));
    // Make a UTC timestamp, then shift by UTC+5.
    // 08:00 at UTC+5 == 03:00 UTC.
    const utcYear = y;
    const utcMonth = m - 1;
    const utcDay = d;
    const utcHours = 3; // 08:00 in UTC+5 => 03:00 UTC
    return Date.UTC(utcYear, utcMonth, utcDay, utcHours, 0, 0);
  }

  function computeCountdown(ymd: string) {
    const targetMsUtc = utcPlus5FromExamDateYMD(ymd);
    const now = new Date();
    const nowMsUtc = Date.now();

    const diff = Math.max(0, targetMsUtc - nowMsUtc);
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    return { days, hours, minutes, seconds };
  }

  useEffect(() => {
    // Ensure we wait until auth finishes loading; otherwise session may be null briefly on refresh.
    if (loading) return;
    if (!accessToken) return;

    // If we already have a locally restored date, keep it as-is until the
    // user selects a new one (prevents the UI from forcing a re-select after refresh).
    // We'll still let the server reconcile in the background if needed.
    try {
      const raw = localStorage.getItem(examDateStorageKey);
      if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return;
    } catch {
      // ignore
    }

    let mounted = true;

    (async () => {
      try {
        const res = await (
          getUserExamCountdown as unknown as (
            input: GetUserExamCountdownInput,
          ) => Promise<any>
        )({
          accessToken,
        } as GetUserExamCountdownInput);
        if (!mounted) return;

        setExamDate(res.examDate);
        const [y, m, d] = res.examDate
          .split("-")
          .map((part: string) => Number(part));
        setSelectedDate(new Date(Date.UTC(y, m - 1, d)));

        try {
          localStorage.setItem(examDateStorageKey, res.examDate);
        } catch {
          // ignore
        }
      } catch {
        // fall back to default so selection doesn't "disappear"
        const fallbackDate = (() => {
          const now = new Date();
          const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
          const utcPlus5Ms = utcMs + 5 * 60 * 60_000;
          const d = new Date(utcPlus5Ms);
          const yyyy = d.getUTCFullYear();
          const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
          const dd = String(d.getUTCDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        })();

        if (!mounted) return;
        setExamDate(fallbackDate);
        const [y, m, d] = fallbackDate.split("-").map((part) => Number(part));
        setSelectedDate(new Date(Date.UTC(y, m - 1, d)));

        try {
          localStorage.setItem(examDateStorageKey, fallbackDate);
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [accessToken, loading]);

  useEffect(() => {
    if (!examDate) return;

    setCountdown(computeCountdown(examDate));

    const id = window.setInterval(() => {
      setCountdown(computeCountdown(examDate));
    }, 1000);

    return () => window.clearInterval(id);
  }, [examDate]);

  return (
    <div className="dashboard-page-container">
      <div className="dashboard-bg-grid" />
      <div className="dashboard-glow-1" />
      <div className="dashboard-glow-2" />
      
      <main className="dashboard-main">
        <div className="dashboard-welcome-card">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
              Welcome back, <span className="text-slate-950">{userName}</span>!
              👋
            </p>
            <p className="text-sm text-slate-500">
              Let's continue your DSAT prep journey.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <a
              href="https://t.me/DSAT_Advantage"
              target="_blank"
              rel="noreferrer"
              className="dashboard-btn-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M22.2 3.2c.4-.2.9.1.8.6l-3.8 18.4c-.1.5-.7.8-1.1.5l-5.1-3.8-2.5 2.4c-.3.3-.8.1-.9-.3l-.4-5.7 10.8-9.8c.4-.3.8-.9.2-1-.3-.1-.8.2-1.1.4L6.2 13c-.4.2-.9.1-1.2-.1l-2.7-1.8c-.4-.3-.4-.9 0-1.2.2-.2.4-.3.7-.4L22.2 3.2z" />
              </svg>
              <span>Join Telegram</span>
            </a>
          </div>
        </div>

        <div className="dashboard-hero-card">
          <div className="dashboard-hero-content space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-white/70 font-semibold">
              Your goal, your plan, your advantage.
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Stay consistent and ace the DSAT.
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-white/80">
              Build momentum with every practice session and see your progress
              clearly across every section.
            </p>
            <button className="dashboard-btn-primary mt-4 bg-white text-slate-900 shadow-none hover:bg-slate-100">
              Continue Learning <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
          
          <div className="dashboard-hero-widget">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60 mb-2">
              Target Score
            </p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-black tracking-tight text-white drop-shadow-md">
                {animatedTargetScore}
              </span>
              <span className="text-sm font-semibold text-white/60">
                /1600
              </span>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={400}
                  max={1600}
                  step={10}
                  value={targetScore}
                  onChange={(e) => {
                    const clamped = Math.max(400, Math.min(1600, Math.round(Number(e.target.value) / 10) * 10));
                    setTargetScore(clamped);
                    try { localStorage.setItem(targetScoreStorageKey, String(clamped)); } catch {}
                    setAnimatedTargetScore(0);
                    const start = performance.now();
                    const durationMs = 450;
                    let raf = 0;
                    const tick = (now: number) => {
                      const t = Math.min(1, (now - start) / durationMs);
                      const eased = 1 - Math.pow(1 - t, 3);
                      setAnimatedTargetScore(Math.round(eased * clamped));
                      if (t < 1) raf = requestAnimationFrame(tick);
                    };
                    raf = requestAnimationFrame(tick);
                  }}
                  className="w-full accent-white"
                  aria-label="Select target score"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3 mt-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-red-300">400–900</span>
                  <span className="text-yellow-300">900–1300</span>
                  <span className="text-blue-200">1300–1600</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${((targetScore - 400) / (1600 - 400)) * 100}%`,
                      background: targetScore < 900 ? "#fca5a5" : targetScore < 1300 ? "#fde047" : "#93c5fd",
                      transition: "width 200ms ease, background-color 200ms ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-glass-panel">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                  DSAT Exam Countdown
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  Your exam is closer than you think!
                </h3>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="rounded-xl bg-blue-50 p-3 text-blue-700 shadow-sm transition hover:bg-blue-100"
                  >
                    <CalendarDays className="h-5 w-5" />
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-fit">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      if (!d) return;
                      const y = d.getUTCFullYear();
                      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
                      const dd = String(d.getUTCDate()).padStart(2, "0");
                      const next = `${y}-${m}-${dd}`;
                      setSelectedDate(d);
                      setExamDate(next);
                      try { localStorage.setItem(examDateStorageKey, next); } catch {}
                      if (!accessToken) return;
                      void (setUserExamCountdown as any)({ accessToken, examDate: next }).catch(() => {});
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Days", value: String(countdown.days) },
                { label: "Hours", value: String(countdown.hours).padStart(2, "0") },
                { label: "Minutes", value: String(countdown.minutes).padStart(2, "0") },
                { label: "Seconds", value: String(countdown.seconds).padStart(2, "0") },
              ].map((item) => (
                <div key={item.label} className="dashboard-stat-box">
                  <p className="text-3xl font-bold text-slate-950">{item.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Digital SAT (DSAT)</p>
                <p className="text-sm font-medium text-slate-500">
                  Target Date: {examDate ? new Date(Date.UTC(Number(examDate.slice(0,4)), Number(examDate.slice(5,7))-1, Number(examDate.slice(8,10)))).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="dashboard-glass-panel">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Upcoming Activity
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-950">
                    Full-Length Mock Test
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Adaptive • 2h 14m • 3 Sections
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <CalendarDays className="h-4 w-4" /> Tomorrow, 10:00 AM
                </div>
                <Link to="/exams" search={{ daily: true } as any} className="dashboard-btn-primary whitespace-nowrap">
                  Start Test
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-100 text-slate-900">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-950">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
