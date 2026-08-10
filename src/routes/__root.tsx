import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BarChart3,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BookOpen,
  ClipboardList,
  Home,
  Layers,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/dsat-advantage-logo.png";
import { TextSelectionProvider } from "@/hooks/useTextSelection";
import { ViewMeaningButton } from "@/components/text-selection/ViewMeaningButton";
import { WordMeaningPopup } from "@/components/text-selection/WordMeaningPopup";

import appCss from "../styles.css?url";

// ─── Battery Hook ──────────────────────────────────────────────────────────────
type BatteryState = {
  supported: boolean;
  level: number;       // 0–1
  charging: boolean;
};

function useBattery(): BatteryState {
  const [state, setState] = useState<BatteryState>({
    supported: false,
    level: 1,
    charging: false,
  });

  useEffect(() => {
    const nav = navigator as any;
    if (!nav.getBattery) return;
    let battery: any = null;

    function update() {
      if (!battery) return;
      setState({
        supported: true,
        level: battery.level,
        charging: battery.charging,
      });
    }

    nav.getBattery().then((b: any) => {
      battery = b;
      update();
      b.addEventListener("levelchange", update);
      b.addEventListener("chargingchange", update);
    }).catch(() => {});

    return () => {
      if (battery) {
        battery.removeEventListener("levelchange", update);
        battery.removeEventListener("chargingchange", update);
      }
    };
  }, []);

  return state;
}

// ─── Battery Indicator Component ───────────────────────────────────────────────
function BatteryIndicator() {
  const { supported, level, charging } = useBattery();
  if (!supported) return null;

  const pct = Math.round(level * 100);

  // Pick color based on level
  const color =
    charging ? "text-emerald-400" :
    pct <= 15 ? "text-red-400" :
    pct <= 35 ? "text-amber-400" :
    "text-slate-400";

  const BattIcon =
    charging ? BatteryCharging :
    pct <= 15 ? BatteryLow :
    pct <= 50 ? BatteryMedium :
    BatteryFull;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-md text-xs font-semibold tabular-nums ${color}`}
      title={`Battery: ${pct}%${charging ? " (charging)" : ""}`}
    >
      <BattIcon className="h-3.5 w-3.5 shrink-0" />
      <span>{pct}%</span>
      {charging && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 ml-0.5">CHG</span>
      )}
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DSAT Advantage — Master the Digital SAT" },
      {
        name: "description",
        content:
          "Modern Digital SAT prep with adaptive practice, full-length tests, and detailed analytics.",
      },
      { name: "author", content: "DSAT Advantage" },
      {
        property: "og:title",
        content: "DSAT Advantage — Master the Digital SAT",
      },
      {
        property: "og:description",
        content:
          "Modern Digital SAT prep with adaptive practice, full-length tests, and detailed analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@dsatadvantage" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      // Favicon / app icons
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function isNavItemActive(currentPathname: string, itemTo: string) {
  const normalize = (p: string) =>
    p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;

  const current = normalize(currentPathname);
  const to = normalize(itemTo);

  if (to === "/admin/tests" || to.startsWith("/admin")) {
    return current === "/admin" || current.startsWith("/admin/");
  }

  if (to === "/questions-bank") {
    return (
      current === "/questions-bank" || current.startsWith("/questions-bank/")
    );
  }

  if (to === "/vocabulary") {
    return current === "/vocabulary";
  }

  return current === to;
}

const SIDEBAR_COLLAPSED_KEY = "dsat_sidebar_collapsed";

function SidebarNavItem({
  to = "/",
  icon,
  label,
  active,
  collapsed,
}: {
  to?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 ${
        active
          ? "bg-slate-900 border border-slate-800/80 text-sky-400 shadow-md shadow-slate-950/40"
          : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-105 hover:translate-x-1"
      } ${collapsed ? "justify-center px-3 hover:translate-x-0" : ""}`}
    >
      {/* Left indicator bar for active route */}
      {active && (
        <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full bg-gradient-to-b from-sky-400 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.7)]" />
      )}

      <span className={`shrink-0 transition-colors duration-250 ${active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-355"}`}>
        {icon}
      </span>

      {/* Label with slide animation */}
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        {label}
      </span>

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-xl group-hover:block whitespace-nowrap border border-slate-800/80 backdrop-blur-md">
          {label}
        </span>
      )}
    </Link>
  );
}

function RootComponent() {
  const { user, isAdmin } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  // Sync fullscreen state with browser events
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  const userName = user
    ? ((user?.user_metadata as any)?.full_name as string | undefined) ||
      user?.email?.split("@")?.[0]
    : "Guest";
  const userInitial = userName?.[0]?.toUpperCase() || "G";

  const navItems = [
    { to: "/", label: "Dashboard", icon: <Home className="h-4 w-4" /> },
    {
      to: "/exams",
      label: "Practice Tests",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      to: "/questions-bank",
      label: "Question Bank",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      to: "/score-estimator",
      label: "Score Estimator",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      to: "/vocabulary",
      label: "Vocabulary",
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  if (isAdmin) {
    navItems.push({
      to: "/admin/tests",
      label: "Admin Panel",
      icon: <Shield className="h-4 w-4" />,
    });
  }

  const shouldHideSidebar =
    location.pathname.startsWith("/test") ||
    location.pathname.startsWith("/questions-bank/practice");

  const sidebarWidth = collapsed ? "72px" : "280px";

  return (
    <TextSelectionProvider>
      <div className="relative min-h-screen bg-slate-100 text-slate-900">
        <div
          className={`min-h-screen lg:grid`}
          style={{
            gridTemplateColumns: shouldHideSidebar
              ? "1fr"
              : `${sidebarWidth} 1fr`,
            transition: "grid-template-columns 250ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {!shouldHideSidebar ? (
            <aside
              className="sticky top-0 h-screen flex flex-col justify-between rounded-none border-r border-slate-800 bg-slate-950/95 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.45)] overflow-hidden"
              style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
                transition: "width 250ms cubic-bezier(0.4,0,0.2,1), min-width 250ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {/* Top section */}
              <div className="flex flex-col gap-5 p-4 overflow-hidden">
                {/* Logo header */}
                <div
                  className="flex items-center gap-3 rounded-[1.75rem] bg-slate-900 shadow-sm overflow-hidden px-3 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-inner">
                    <img
                      src={logo}
                      alt="DSAT"
                      className="h-full w-full object-contain p-0"
                      style={{
                        display: "block",
                        transform: "translateX(-1px)",
                      }}
                      draggable={false}
                    />
                  </div>
                  <div
                    style={{
                      maxWidth: collapsed ? "0px" : "200px",
                      opacity: collapsed ? 0 : 1,
                      overflow: "hidden",
                      transition: "max-width 300ms cubic-bezier(0.4,0,0.2,1), opacity 200ms",
                      pointerEvents: collapsed ? "none" : "auto",
                      flexShrink: 0,
                    }}
                  >
                    <p className="text-base font-bold text-white whitespace-nowrap">DSAT</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-300 whitespace-nowrap">
                      ADVANTAGE
                    </p>
                  </div>
                </div>

                {/* Nav items */}
                <nav className="flex flex-col gap-1.5">
                  {navItems.map((item) => (
                    <SidebarNavItem
                      key={item.label}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      active={isNavItemActive(location.pathname, item.to)}
                      collapsed={collapsed}
                    />
                  ))}
                </nav>
              </div>

              {/* Bottom: user card + toggle button */}
              <div className="p-4 flex flex-col gap-3">
                {/* Fullscreen button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  className={`flex items-center gap-2.5 rounded-xl border border-slate-900 bg-slate-950/40 p-3 text-slate-400 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/50 hover:text-white ${
                    collapsed ? "justify-center" : ""
                  }`}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <Maximize2 className="h-4 w-4 shrink-0" />
                  )}
                  <span
                    className={`overflow-hidden whitespace-nowrap text-xs font-semibold tracking-wide transition-all duration-300 ${
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}
                  >
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  </span>
                </button>

                {/* Collapse button */}
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => !c)}
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className={`flex items-center gap-2.5 rounded-xl border border-slate-900 bg-slate-950/40 p-3 text-slate-400 transition-all duration-300 hover:border-slate-800 hover:bg-slate-900/50 hover:text-white ${
                    collapsed ? "justify-center" : ""
                  }`}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4 shrink-0" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4 shrink-0" />
                  )}
                  <span
                    className={`overflow-hidden whitespace-nowrap text-xs font-semibold tracking-wide transition-all duration-300 ${
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}
                  >
                    Collapse
                  </span>
                </button>

                {/* User profile card */}
                <div className="rounded-[1.75rem] border border-slate-900/80 bg-slate-950/60 p-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((open) => !open)}
                    aria-expanded={accountOpen}
                    className={`flex w-full items-center gap-3 rounded-[1.25rem] border border-slate-900 bg-slate-950/90 p-2.5 text-left transition-all duration-300 hover:border-slate-800 hover:bg-slate-900/40 ${
                      collapsed ? "justify-center" : ""
                    }`}
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 p-[1.5px] shadow-md">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                        {userInitial}
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-100 whitespace-nowrap">
                        {userName}
                      </p>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap mt-0.5">
                        {user ? "Basic Plan" : "Guest"}
                      </p>
                    </div>
                  </button>

                  {accountOpen && !collapsed ? (
                    <div className="mt-3 space-y-2">
                      {user ? (
                        <>
                          {isAdmin ? (
                            <Link
                              to="/admin/tests"
                              className="block rounded-full bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                              Admin
                            </Link>
                          ) : null}
                          <button
                            onClick={() => {
                              setAccountOpen(false);
                              supabase.auth.signOut();
                            }}
                            className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                          >
                            Log Out
                          </button>
                        </>
                      ) : (
                        <Link
                          to="/auth"
                          className="block rounded-full bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-500"
                          onClick={() => setAccountOpen(false)}
                        >
                          Sign In
                        </Link>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          ) : null}

          <main className="min-h-screen bg-slate-100">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global word selection popup — works on all pages via position:fixed */}
      <ViewMeaningButton />
      <WordMeaningPopup />

      {/* Battery indicator — fixed top-right, visible on every page */}
      <div className="pointer-events-none fixed top-0 right-0 z-[9998] flex items-start justify-end p-3">
        <div className="pointer-events-auto">
          <BatteryIndicator />
        </div>
      </div>
    </TextSelectionProvider>
  );
}
