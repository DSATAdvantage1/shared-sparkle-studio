import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/routes/exams.animations";
import logoBadge from "@/assets/logo-dsat-badge.svg";
import logoWordmark from "@/assets/logo-dsat-wordmark.svg";

const NAVY = "#081426";

type OverlayProps = {
  /** Total time the overlay stays on screen (ms). */
  durationMs?: number;
  /** Called once when the overlay finishes. */
  onDone?: () => void;
};

/**
 * Full-screen animated logo overlay. Covers the whole viewport with the
 * platform's navy surface, animates the DSAT Advantage badge + wordmark in,
 * plays a light sweep, then fades away.
 */
export function LogoTransitionOverlay({ durationMs = 1200, onDone }: OverlayProps) {
  const reduced = usePrefersReducedMotion();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const ms = reduced ? 250 : durationMs;
    const t = window.setTimeout(() => {
      setGone(true);
      onDone?.();
    }, ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: NAVY,
        animation: reduced
          ? "dsatlogo-fadeout 250ms ease both"
          : `dsatlogo-fadeout 300ms ease ${durationMs - 300}ms both`,
      }}
    >
      {/* ambient glow */}
      <div className="dsatlogo-glow" />

      {/* logo stack */}
      <div className="relative flex flex-col items-center gap-5">
        <img
          src={logoBadge}
          alt=""
          className="dsatlogo-badge h-24 w-auto sm:h-28"
          draggable={false}
        />
        <img
          src={logoWordmark}
          alt="DSAT Advantage"
          className="dsatlogo-wordmark h-14 w-auto sm:h-16"
          draggable={false}
        />
        <div className="dsatlogo-bar" />
      </div>

      {/* light sweep */}
      {!reduced && <div className="dsatlogo-sweep" />}

      <style>{logoTransitionCss}</style>
    </div>
  );
}

/**
 * Wrapper that plays the logo transition over its children once, then
 * reveals them.
 */
export function LogoTransition({
  children,
  durationMs,
}: {
  children: React.ReactNode;
  durationMs?: number;
}) {
  const [done, setDone] = useState(false);
  return (
    <div className="relative">
      {children}
      {!done && (
        <LogoTransitionOverlay durationMs={durationMs} onDone={() => setDone(true)} />
      )}
    </div>
  );
}

const logoTransitionCss = `
@keyframes dsatlogo-fadeout {
  from { opacity: 1; }
  to { opacity: 0; }
}

.dsatlogo-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: min(70vw, 560px);
  height: min(70vw, 560px);
  transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(56,189,248,0.22), rgba(10,76,255,0.10) 55%, rgba(8,20,38,0) 75%);
  filter: blur(6px);
  animation: dsatlogo-glow 1200ms ease both;
}

@keyframes dsatlogo-glow {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  35% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.05); }
}

.dsatlogo-badge {
  animation: dsatlogo-badge-in 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
  filter: drop-shadow(0 0 24px rgba(56,189,248,0.45));
}

@keyframes dsatlogo-badge-in {
  0% { opacity: 0; transform: scale(0.6) translateY(14px); filter: blur(6px) drop-shadow(0 0 24px rgba(56,189,248,0.45)); }
  60% { opacity: 1; transform: scale(1.06) translateY(0); filter: blur(0) drop-shadow(0 0 24px rgba(56,189,248,0.45)); }
  100% { opacity: 1; transform: scale(1); }
}

.dsatlogo-wordmark {
  animation: dsatlogo-word-in 700ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
}

@keyframes dsatlogo-word-in {
  0% { opacity: 0; transform: translateY(16px); filter: blur(4px); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}

.dsatlogo-bar {
  height: 3px;
  width: 180px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(56,189,248,0), rgba(56,189,248,0.9), rgba(56,189,248,0));
  transform-origin: center;
  animation: dsatlogo-bar 800ms cubic-bezier(0.22, 1, 0.36, 1) 300ms both;
}

@keyframes dsatlogo-bar {
  0% { opacity: 0; transform: scaleX(0); }
  100% { opacity: 1; transform: scaleX(1); }
}

.dsatlogo-sweep {
  position: absolute;
  left: -20%;
  top: 50%;
  width: 55%;
  height: 200px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.35) 50%, rgba(56,189,248,0) 100%);
  filter: blur(3px);
  opacity: 0;
  animation: dsatlogo-sweep 500ms ease 550ms both;
}

@keyframes dsatlogo-sweep {
  0% { opacity: 0; left: -20%; }
  25% { opacity: 0.8; }
  100% { opacity: 0; left: 110%; }
}
`;
