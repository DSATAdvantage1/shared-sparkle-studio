import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/routes/exams.animations";
import logoAsset from "@/assets/dsat-advantage-transition-logo.jpg.asset.json";

const NAVY = "#0b1f4d";
const LOGO_URL = logoAsset.url;

type OverlayProps = {
  durationMs?: number;
  onDone?: () => void;
};

/**
 * Full-screen overlay that animates only the uploaded DSAT Advantage logo:
 * the logo rises in, a soft light shine passes across it, then everything fades.
 */
export function LogoTransitionOverlay({ durationMs = 1400, onDone }: OverlayProps) {
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
          : `dsatlogo-fadeout 350ms ease ${durationMs - 350}ms both`,
      }}
    >
      <div className="dsatlogo-frame">
        <img src={LOGO_URL} alt="DSAT Advantage" className="dsatlogo-img" draggable={false} />
        {!reduced && <div className="dsatlogo-shine" />}
      </div>
      <style>{css}</style>
    </div>
  );
}

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
      {!done && <LogoTransitionOverlay durationMs={durationMs} onDone={() => setDone(true)} />}
    </div>
  );
}

const css = `
@keyframes dsatlogo-fadeout { from { opacity: 1; } to { opacity: 0; } }
.dsatlogo-frame {
  position: relative; overflow: hidden;
  width: min(78vw, 520px);
  animation: dsatlogo-in 800ms cubic-bezier(0.22, 1, 0.36, 1) both,
             dsatlogo-breathe 1600ms ease-in-out 800ms infinite;
}
.dsatlogo-img { display: block; width: 100%; height: auto; }
@keyframes dsatlogo-in {
  0% { opacity: 0; transform: translateY(18px) scale(0.92); filter: blur(8px); }
  100% { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes dsatlogo-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.025); }
}
.dsatlogo-shine {
  position: absolute; top: 0; bottom: 0; left: -40%; width: 35%;
  background: linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%);
  mix-blend-mode: screen;
  animation: dsatlogo-shine 700ms ease 600ms both;
}
@keyframes dsatlogo-shine {
  0% { left: -40%; opacity: 0; }
  20% { opacity: 1; }
  100% { left: 120%; opacity: 0; }
}
`;
