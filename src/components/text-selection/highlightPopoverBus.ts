// Shared bus so the "Look up" button can sit next to the highlight toolbar
// instead of overlapping it when both target the same selection.

export type HighlightPopoverRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  height: number;
} | null;

type Listener = (rect: HighlightPopoverRect) => void;

let current: HighlightPopoverRect = null;
const listeners = new Set<Listener>();

export function setHighlightPopoverRect(rect: HighlightPopoverRect) {
  current = rect;
  listeners.forEach((listener) => listener(rect));
}

export function subscribeHighlightPopoverRect(listener: Listener) {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}
