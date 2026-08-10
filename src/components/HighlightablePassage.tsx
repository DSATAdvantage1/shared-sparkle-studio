import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

type HighlightColor = "yellow" | "blue" | "pink";
type UnderlineStyle = "solid" | "dotted" | "dashed" | null;

export type Highlight = {
  id: string;
  start: number;
  end: number;
  color: HighlightColor;
  underline: UnderlineStyle;
};

const COLOR_BG: Record<HighlightColor, string> = {
  yellow: "oklch(0.92 0.13 95)",
  blue: "oklch(0.85 0.10 230)",
  pink: "oklch(0.88 0.08 5)",
};

const COLOR_SWATCH: Record<HighlightColor, string> = {
  yellow: "oklch(0.86 0.16 95)",
  blue: "oklch(0.78 0.13 230)",
  pink: "oklch(0.82 0.11 5)",
};

type Segment = {
  text: string;
  start: number;
  end: number;
  highlights: Highlight[];
};

function buildSegments(text: string, highlights: Highlight[]): Segment[] {
  const points = new Set<number>([0, text.length]);
  highlights.forEach((h) => {
    points.add(Math.max(0, Math.min(text.length, h.start)));
    points.add(Math.max(0, Math.min(text.length, h.end)));
  });
  const sorted = [...points].sort((a, b) => a - b);
  const segs: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start === end) continue;
    const overlapping = highlights.filter(
      (h) => h.start <= start && h.end >= end,
    );
    segs.push({
      text: text.slice(start, end),
      start,
      end,
      highlights: overlapping,
    });
  }
  return segs;
}

export function HighlightablePassage({
  text,
  highlights,
  onChange,
  enabled = true,
}: {
  text: string;
  highlights: Highlight[];
  onChange: (next: Highlight[]) => void;
  enabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<
    | {
        x: number;
        y: number;
        mode: "create";
        range: { start: number; end: number };
      }
    | { x: number; y: number; mode: "edit"; id: string }
    | null
  >(null);

  function getOffset(node: Node, offsetInNode: number): number | null {
    const root = containerRef.current;
    if (!root) return null;
    let total = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n: Node | null = walker.nextNode();
    while (n) {
      if (n === node) return total + offsetInNode;
      total += (n.textContent ?? "").length;
      n = walker.nextNode();
    }
    return null;
  }

  function handleMouseUp() {
    if (!enabled) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const root = containerRef.current;
    if (
      !root ||
      !root.contains(range.startContainer) ||
      !root.contains(range.endContainer)
    )
      return;
    const startOffset = getOffset(range.startContainer, range.startOffset);
    const endOffset = getOffset(range.endContainer, range.endOffset);
    if (startOffset == null || endOffset == null) return;
    const s = Math.min(startOffset, endOffset);
    const e = Math.max(startOffset, endOffset);
    if (e - s < 1) return;
    const rect = range.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    setPopover({
      mode: "create",
      range: { start: s, end: e },
      x: rect.left + rect.width / 2 - rootRect.left,
      y: rect.top - rootRect.top - 8,
    });
  }

  function handleHighlightClick(e: React.MouseEvent, id: string) {
    if (!enabled) return;
    e.stopPropagation();
    const root = containerRef.current;
    if (!root) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    setPopover({
      mode: "edit",
      id,
      x: rect.left + rect.width / 2 - rootRect.left,
      y: rect.top - rootRect.top - 8,
    });
    window.getSelection()?.removeAllRanges();
  }

  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const root = containerRef.current;
      if (!root) return;
      if (!(ev.target instanceof Node) || !root.contains(ev.target)) {
        setPopover(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function applyColor(color: HighlightColor) {
    if (!popover) return;
    if (popover.mode === "create") {
      const next: Highlight = {
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        start: popover.range.start,
        end: popover.range.end,
        color,
        underline: null,
      };
      onChange([...highlights, next]);
    } else {
      onChange(
        highlights.map((h) => (h.id === popover.id ? { ...h, color } : h)),
      );
    }
    setPopover(null);
    window.getSelection()?.removeAllRanges();
  }

  function applyUnderline(style: NonNullable<UnderlineStyle>) {
    if (!popover) return;
    if (popover.mode === "create") {
      const next: Highlight = {
        id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        start: popover.range.start,
        end: popover.range.end,
        color: "yellow",
        underline: style,
      };
      onChange([...highlights, next]);
    } else {
      onChange(
        highlights.map((h) =>
          h.id === popover.id ? { ...h, underline: style } : h,
        ),
      );
    }
    setPopover(null);
    window.getSelection()?.removeAllRanges();
  }

  function removeHighlight() {
    if (!popover || popover.mode !== "edit") return;
    onChange(highlights.filter((h) => h.id !== popover.id));
    setPopover(null);
  }

  const segments = buildSegments(text, highlights);

  return (
    <div ref={containerRef} className="relative" onMouseUp={handleMouseUp}>
      <p className="font-[Georgia,Times_New_Roman,serif] whitespace-pre-line text-[17px] leading-[1.42] text-foreground">
        {segments.map((seg, idx) => {
          if (seg.highlights.length === 0)
            return <span key={idx}>{seg.text}</span>;
          const top = seg.highlights[seg.highlights.length - 1];
          const style: React.CSSProperties = {
            backgroundColor: COLOR_BG[top.color],
            borderRadius: "2px",
            cursor: "pointer",
            display: "inline",
            padding: "0.06em 0.14em",
            verticalAlign: "baseline",
            boxDecorationBreak: "clone",
            lineHeight: "normal",
            // Never allow the highlight background to escape its own box.
            // This is important when the word is near the edge of a clipped/scroll container.
            overflow: "hidden",
          };
          if (top.underline) {
            style.textDecoration = "underline";
            style.textDecorationStyle = top.underline;
            style.textDecorationThickness = "1.5px";
            style.textUnderlineOffset = "3px";
          }
          return (
            <span
              key={idx}
              style={style}
              onClick={(e) => handleHighlightClick(e, top.id)}
            >
              {seg.text}
            </span>
          );
        })}
      </p>

      {popover && (
        <div
          className="absolute z-50 -translate-x-1/2 -translate-y-full"
          style={{ left: popover.x, top: popover.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 rounded-full border border-foreground/20 bg-background px-3 py-2 shadow-[0_6px_20px_rgba(0,0,0,0.18)]">
            {(["yellow", "blue", "pink"] as HighlightColor[]).map((c) => (
              <button
                key={c}
                onClick={() => applyColor(c)}
                title={`Highlight ${c}`}
                className="h-5 w-5 rounded-full border border-foreground/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: COLOR_SWATCH[c] }}
              />
            ))}
            <span className="mx-1 h-5 w-px bg-foreground/15" />
            <button
              onClick={() => applyUnderline("solid")}
              title="Underline solid"
              className="flex h-6 w-7 items-center justify-center rounded hover:bg-muted"
            >
              <span className="block h-[2px] w-5 bg-foreground" />
            </button>
            <button
              onClick={() => applyUnderline("dotted")}
              title="Underline dotted"
              className="flex h-6 w-7 items-center justify-center rounded hover:bg-muted"
            >
              <span
                className="block h-[2px] w-5"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, currentColor 40%, transparent 40%)",
                  backgroundSize: "3px 2px",
                  backgroundRepeat: "repeat-x",
                  color: "var(--color-foreground)",
                }}
              />
            </button>
            <button
              onClick={() => applyUnderline("dashed")}
              title="Underline dashed"
              className="flex h-6 w-7 items-center justify-center rounded hover:bg-muted"
            >
              <span
                className="block h-[2px] w-5"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, currentColor 60%, transparent 40%)",
                  backgroundSize: "6px 2px",
                  backgroundRepeat: "repeat-x",
                  color: "var(--color-foreground)",
                }}
              />
            </button>
            {popover.mode === "edit" && (
              <>
                <span className="mx-1 h-5 w-px bg-foreground/15" />
                <button
                  onClick={removeHighlight}
                  title="Remove highlight"
                  className="flex h-6 w-6 items-center justify-center rounded text-foreground/70 hover:bg-muted hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                </button>
              </>
            )}
          </div>
          <div className="mx-auto h-2 w-2 -translate-y-1 rotate-45 border-b border-r border-foreground/20 bg-background" />
        </div>
      )}
    </div>
  );
}
