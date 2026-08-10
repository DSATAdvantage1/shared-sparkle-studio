import { useEffect, useMemo, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(!!mq.matches);
    onChange();

    // Safari support
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return reduced;
}

export function useIntersectionList<T extends HTMLElement>(opts: {
  count: number;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
}) {
  const { count, rootMargin = "80px", threshold = 0.15, enabled = true } = opts;

  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState<boolean[]>(() =>
    Array.from({ length: count }, () => false),
  );

  useEffect(() => {
    if (!enabled || reduced) {
      setVisible(Array.from({ length: count }, () => true));
      return;
    }

    const els: (HTMLElement | null)[] = Array.from(
      { length: count },
      () => null,
    );
    const io = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = prev.slice();
          for (const e of entries) {
            const idx = Number(
              (e.target as HTMLElement).dataset.animIndex ?? "-1",
            );
            if (idx >= 0 && idx < count && e.isIntersecting) next[idx] = true;
          }
          return next;
        });
      },
      { rootMargin, threshold },
    );

    for (let i = 0; i < count; i++) {
      const el = document.querySelector<HTMLElement>(
        `[data-practice-card-index="${i}"]`,
      );
      els[i] = el;
      if (el) io.observe(el);
    }

    return () => {
      io.disconnect();
    };
  }, [count, rootMargin, threshold, enabled, reduced]);

  return useMemo(() => visible, [visible]);
}
