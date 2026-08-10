import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const DESMOS_SRC =
  "https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";

let desmosLoader: Promise<void> | null = null;

function loadDesmos(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // @ts-expect-error global Desmos
  if (window.Desmos) return Promise.resolve();
  if (desmosLoader) return desmosLoader;
  desmosLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${DESMOS_SRC}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const s = document.createElement("script");
    s.src = DESMOS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });
  return desmosLoader;
}

export function DesmosCalculator({ onClose }: { onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<{ destroy: () => void; resize: () => void } | null>(
    null,
  );

  const [size, setSize] = useState({
    width: Math.min(
      900,
      typeof window !== "undefined" ? window.innerWidth - 80 : 900,
    ),
    height: Math.min(
      560,
      typeof window !== "undefined" ? window.innerHeight - 160 : 560,
    ),
  });
  const [pos, setPos] = useState(() => ({
    x:
      typeof window !== "undefined"
        ? Math.max(20, (window.innerWidth - 900) / 2)
        : 40,
    y:
      typeof window !== "undefined"
        ? Math.max(20, (window.innerHeight - 560) / 2)
        : 40,
  }));

  // mount Desmos
  useEffect(() => {
    let cancelled = false;
    loadDesmos()
      .then(() => {
        if (cancelled || !mountRef.current) return;
        // @ts-expect-error global Desmos
        const Desmos = window.Desmos;
        if (!Desmos) return;
        calcRef.current = Desmos.GraphingCalculator(mountRef.current, {
          expressions: true,
          keypad: true,
          settingsMenu: true,
          border: false,
        });
      })
      .catch(() => {
        /* network blocked — iframe fallback handled below */
      });
    return () => {
      cancelled = true;
      try {
        calcRef.current?.destroy();
      } catch {
        /* noop */
      }
      calcRef.current = null;
    };
  }, []);

  // resize Desmos when size changes
  useEffect(() => {
    calcRef.current?.resize();
  }, [size]);

  // dragging
  const dragRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
  } | null>(null);
  function onHeaderMouseDown(e: React.MouseEvent) {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: pos.x,
      oy: pos.y,
    };
    function onMove(ev: MouseEvent) {
      const d = dragRef.current;
      if (!d) return;
      setPos({
        x: Math.max(
          0,
          Math.min(window.innerWidth - 100, d.ox + ev.clientX - d.startX),
        ),
        y: Math.max(
          0,
          Math.min(window.innerHeight - 60, d.oy + ev.clientY - d.startY),
        ),
      });
    }
    function onUp() {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // resizing (bottom-right)
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    w: number;
    h: number;
  } | null>(null);
  function onResizeMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      w: size.width,
      h: size.height,
    };
    function onMove(ev: MouseEvent) {
      const r = resizeRef.current;
      if (!r) return;
      setSize({
        width: Math.max(
          360,
          Math.min(window.innerWidth - 40, r.w + ev.clientX - r.startX),
        ),
        height: Math.max(
          280,
          Math.min(window.innerHeight - 40, r.h + ev.clientY - r.startY),
        ),
      });
    }
    function onUp() {
      resizeRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      className="fixed z-50 flex flex-col overflow-hidden rounded-lg border border-foreground/25 bg-background shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div
        onMouseDown={onHeaderMouseDown}
        className="flex cursor-move items-center justify-between border-b border-foreground/15 bg-muted/40 px-3 py-2 select-none"
      >
        <p className="text-[13px] font-semibold text-foreground">
          Desmos Calculator
        </p>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="text-foreground/70 hover:text-foreground"
          aria-label="Close calculator"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={mountRef} className="relative h-full w-full" />
      <div
        onMouseDown={onResizeMouseDown}
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
        style={{
          background:
            "linear-gradient(135deg, transparent 0 50%, color-mix(in oklab, var(--foreground) 50%, transparent) 50% 60%, transparent 60% 70%, color-mix(in oklab, var(--foreground) 50%, transparent) 70% 80%, transparent 80%)",
        }}
        aria-label="Resize"
      />
    </div>
  );
}
