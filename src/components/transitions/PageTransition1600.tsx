import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/routes/exams.animations";

export type PageTransitionKind = "practice-exam" | "question-bank";

type Props = {
  /** What animation to play (currently same visuals, kept for future). */
  kind: PageTransitionKind;
  /** Route destination ReactNode (the page to reveal underneath). */
  children: React.ReactNode;
  /** Called when transition completes or is skipped. */
  onDone?: () => void;
};

const NAVY = "#081426";
const ELECTRIC = "#38bdf8"; // electric-ish blue
// (ELECTRIC kept for future variants; visuals are inline in CSS)

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function useStableSeed(key: string) {
  return useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }, [key]);
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function PageTransition1600({ kind, children, onDone }: Props) {
  // TEMP DEBUG
  console.log("[1600] Transition mounted", { kind });
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<"enter" | "done">("enter");
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Skip: instant 150ms fade.
  useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(() => {
        setPhase("done");
        onDone?.();
      }, 150);
      return () => window.clearTimeout(t);
    }

    // Total duration ~ 800ms. We keep some safety for slow devices.
    const totalMs = 850;
    const t = window.setTimeout(() => {
      setPhase("done");
      onDone?.();
    }, totalMs);
    return () => window.clearTimeout(t);
  }, [reduced, onDone]);

  const seed = useStableSeed(kind);

  const particles = useMemo(() => {
    const rand = mulberry32(seed);
    const count = 26;
    const arr = Array.from({ length: count }).map((_, i) => {
      const angle = rand() * Math.PI * 2;
      const r = clamp(rand(), 0.2, 1) * 0.42;
      return {
        id: `${kind}-p-${i}`,
        x: 50 + Math.cos(angle) * r * 100,
        y: 50 + Math.sin(angle) * r * 100,
        delayMs: Math.round(rand() * 150),
        sizePx: Math.round(4 + rand() * 6),
        alpha: 0.35 + rand() * 0.55,
      };
    });
    return arr;
  }, [kind, seed]);

  // When done, remove overlay. Keep destination mounted.
  const overlayVisible = phase === "enter";

  return (
    <div className="relative">
      {children}

      {overlayVisible ? (
        <div
          ref={overlayRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[9999]"
        >
          <TransitionOverlay
            particles={particles}
            reduced={reduced}
            kind={kind}
          />
        </div>
      ) : null}
    </div>
  );
}

function TransitionOverlay({
  particles,
  reduced,
  kind,
}: {
  particles: {
    id: string;
    x: number;
    y: number;
    delayMs: number;
    sizePx: number;
    alpha: number;
  }[];
  reduced: boolean;
  kind: PageTransitionKind;
}) {
  // Reduced motion: simple fade.
  if (reduced) {
    return (
      <div
        className="h-full w-full"
        style={{
          background: NAVY,
          opacity: 0,
          animation:
            "page1600-fadeonly 150ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      />
    );
  }

  return (
    <div className="h-full w-full" style={{ background: NAVY }}>
      {/* Step 1: quick fade into navy */}
      <div
        className="h-full w-full"
        style={{
          opacity: 0,
          animation: "page1600-step1 150ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      />

      {/* Step 2: 1600 glow + glass + float particles */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          animation:
            "page1600-step2-wrap 250ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        <div
          className="relative"
          style={{
            padding: 0,
            transform: "translateZ(0)",
          }}
        >
          <div className="page1600-glass" />
          <div className="page1600-number">1600</div>
          <div className="page1600-number-sub" />

          {/* soft floating particles around number */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((p) => (
              <span
                key={p.id}
                className="page1600-orb"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.sizePx}px`,
                  height: `${p.sizePx}px`,
                  opacity: p.alpha,
                  animationDelay: `${p.delayMs}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: sweep + stronger glow + particles break away */}
      <div className="absolute inset-0">
        <div className="page1600-sweep" />
        <div className="page1600-break" />
      </div>

      {/* Step 4: dissolve into particles */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="page1600-dissolve" />
      </div>

      {/* Step 5: destination fades in underneath */}
      <div
        className="absolute inset-0"
        style={{
          background: NAVY,
          animation:
            "page1600-step5-fade 150ms cubic-bezier(0.22, 1, 0.36, 1) both",
          animationDelay: "700ms",
        }}
      />

      <style>{pageTransition1600Css}</style>
    </div>
  );
}

const pageTransition1600Css = `
@keyframes page1600-fadeonly {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes page1600-step1 {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes page1600-step2-wrap {
  0% { opacity: 0; transform: scale(0.98); }
  60% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}

.page1600-glass {
  position: absolute;
  inset: -42px -80px -42px -80px;
  background: radial-gradient(closest-side, rgba(56,189,248,0.16), rgba(8,20,38,0) 70%),
    linear-gradient(135deg, rgba(56,189,248,0.18), rgba(255,255,255,0.04));
  border-radius: 32px;
  filter: blur(0px);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 0 0 1px rgba(56,189,248,0.20), 0 0 60px rgba(56,189,248,0.12);
  opacity: 0.9;
}

.page1600-number {
  position: relative;
  font-size: clamp(56px, 10vw, 104px);
  font-weight: 900;
  letter-spacing: -0.06em;
  color: rgba(255,255,255,0.96);
  text-shadow:
    0 0 2px rgba(56,189,248,0.55),
    0 0 14px rgba(56,189,248,0.55),
    0 0 36px rgba(56,189,248,0.35);
  transform-origin: 50% 50%;
  animation: page1600-number-scale 250ms cubic-bezier(0.22,1,0.36,1) both;
}

.page1600-number-sub {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -40%);
  width: 240px;
  height: 64px;
  background: radial-gradient(closest-side, rgba(56,189,248,0.45), rgba(56,189,248,0) 70%);
  filter: blur(12px);
  opacity: 0.55;
}

@keyframes page1600-number-scale {
  from { transform: scale(0.9); filter: blur(1px); }
  to { transform: scale(1); filter: blur(0); }
}

.page1600-orb {
  position: absolute;
  border-radius: 9999px;
  background: rgba(56,189,248,0.95);
  box-shadow: 0 0 18px rgba(56,189,248,0.65);
  transform: translate(-50%, -50%);
  animation: page1600-orb-float 900ms ease-in-out both;
}

@keyframes page1600-orb-float {
  0% { transform: translate(-50%, -50%) scale(0.75); }
  40% { transform: translate(-50%, -50%) translateY(-10px) scale(1); opacity: 0.95; }
  100% { transform: translate(-50%, -50%) translateY(4px) scale(0.9); opacity: 0; }
}

.page1600-sweep {
  position: absolute;
  left: -20%;
  top: 50%;
  width: 60%;
  height: 160px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.65) 50%, rgba(56,189,248,0) 100%);
  filter: blur(2px);
  opacity: 0;
  animation: page1600-sweep 150ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 400ms;
}

@keyframes page1600-sweep {
  0% { opacity: 0; left: -20%; }
  20% { opacity: 0.95; }
  100% { opacity: 0; left: 110%; }
}

.page1600-break {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 220px;
  height: 120px;
  transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(56,189,248,0.55), rgba(56,189,248,0) 68%);
  opacity: 0;
  filter: blur(0px);
  animation: page1600-break 150ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 450ms;
}

@keyframes page1600-break {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1.02); }
}

.page1600-dissolve {
  width: 380px;
  height: 170px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 20% 50%, rgba(56,189,248,0.95) 0 2px, rgba(56,189,248,0) 3px),
    radial-gradient(circle at 40% 50%, rgba(56,189,248,0.95) 0 2px, rgba(56,189,248,0) 3px),
    radial-gradient(circle at 60% 50%, rgba(56,189,248,0.95) 0 2px, rgba(56,189,248,0) 3px),
    radial-gradient(circle at 80% 50%, rgba(56,189,248,0.95) 0 2px, rgba(56,189,248,0) 3px);
  opacity: 0;
  filter: blur(0px);
  transform: scale(0.85);
  animation: page1600-dissolve 200ms cubic-bezier(0.22,1,0.36,1) both;
  animation-delay: 550ms;
}

@keyframes page1600-dissolve {
  0% { opacity: 0; transform: scale(0.85); filter: blur(2px); }
  35% { opacity: 1; filter: blur(1px); }
  100% { opacity: 0; transform: scale(1.25); filter: blur(0px); }
}

@keyframes page1600-step5-fade {
  from { opacity: 1; }
  to { opacity: 0; }
}
`;
