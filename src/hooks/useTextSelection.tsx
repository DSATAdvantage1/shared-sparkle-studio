import * as React from "react";

export type TextSelection = {
  text: string;
  rangeText: string;
};

export type ToolbarPosition = {
  left: number;
  top: number;
};

export type TextSelectionContextValue = {
  selection: TextSelection | null;
  toolbarPosition: ToolbarPosition | null;
  isOpen: boolean;
  clearSelection: () => void;
  deleteSelection: () => void;
  meaningOpen: boolean;
  setMeaningOpen: (open: boolean) => void;
  setMeaningWord: (word: string) => void;
};

const TextSelectionContext =
  React.createContext<TextSelectionContextValue | null>(null);

function getClientRectsForRange(range: Range): DOMRect[] {
  const rects = Array.from(range.getClientRects?.() ?? []);
  return rects.filter((r) => r && (r.width > 0 || r.height > 0));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function TextSelectionProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const [selection, setSelection] = React.useState<TextSelection | null>(null);
  const [toolbarPosition, setToolbarPosition] =
    React.useState<ToolbarPosition | null>(null);
  const [meaningOpen, setMeaningOpen] = React.useState(false);
  const [meaningWord, setMeaningWord] = React.useState<string>("");
  const [isOpen, setIsOpen] = React.useState(false);

  const clearSelection = React.useCallback(() => {
    setSelection(null);
    setToolbarPosition(null);
    setIsOpen(false);
    setMeaningOpen(false);
    setMeaningWord("");
  }, []);

  const deleteSelection = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    sel.removeAllRanges();
    clearSelection();
  }, [clearSelection]);

  React.useEffect(() => {
    if (!enabled) {
      clearSelection();
      return;
    }

    // Selection requirements:
    // - single word only
    // - ignore selections inside inputs/textarea/contenteditable and any data-vocab-ignore element
    const singleWordRegex = /^[A-Za-z][A-Za-z'-]{1,39}$/;

    function isSelectionIgnoredTarget(target: Element | null) {
      if (!target) return false;
      const el = target as HTMLElement;
      if (!el) return false;

      if (el.closest("input, textarea")) return true;
      if (el.closest("[contenteditable='true']")) return true;

      // Allow authors to opt-out with either boolean or presence.
      if (el.closest("[data-vocab-ignore='true']")) return true;
      if (el.closest("[data-vocab-ignore]")) return true;

      return false;
    }

    function extractSingleWordToken(selText: string): string | null {
      const trimmed = selText.trim();
      if (!trimmed) return null;

      // Multi-token selection => reject.
      if (/\s/.test(trimmed)) return null;

      // Must match strict regex.
      if (!singleWordRegex.test(trimmed)) {
        // Fallback: attempt to extract a token inside larger selected text.
        const match = trimmed.match(/^[A-Za-z][A-Za-z'-]{1,39}$/);
        if (!match) return null;
        return match[0];
      }

      return trimmed;
    }

    function updateFromSelection() {
      const sel = window.getSelection?.();
      if (!sel || sel.rangeCount === 0) {
        clearSelection();
        return;
      }

      const activeTarget = document.activeElement;
      if (isSelectionIgnoredTarget(activeTarget)) {
        clearSelection();
        return;
      }

      const rawText = sel.toString();
      const token = extractSingleWordToken(rawText);
      if (!token) {
        clearSelection();
        return;
      }

      const range = sel.getRangeAt(0);
      const rects = getClientRectsForRange(range);
      if (!rects.length) {
        clearSelection();
        return;
      }

      // Compute anchor position from top-most rect.
      const topRect = rects.reduce(
        (acc, r) => (r.top < acc.top ? r : acc),
        rects[0],
      );
      const leftRect = rects.reduce(
        (acc, r) => (r.left < acc.left ? r : acc),
        rects[0],
      );

      const paddingTop = 10;
      const left = clamp(
        leftRect.left + leftRect.width / 2,
        16,
        window.innerWidth - 16,
      );
      const top = clamp(topRect.top - paddingTop, 16, window.innerHeight - 16);

      setSelection({ text: token, rangeText: rawText });
      setToolbarPosition({ left, top });
      setIsOpen(true);
    }

    function onSelectionChange() {
      updateFromSelection();
    }

    function onPointerDown(e: PointerEvent) {
      // Click outside: close.
      const toolbarEl = document.querySelector(
        "[data-text-selection-toolbar='true']",
      );
      const popoverEl = document.querySelector(
        "[data-word-meaning-popover='true']",
      );
      const t = e.target as Node;
      const insideToolbar = toolbarEl?.contains(t);
      const insidePopover = popoverEl?.contains(t);

      if (!insideToolbar && !insidePopover) {
        // Allow native selection clearing.
      }
    }

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [clearSelection, enabled]);

  const value = React.useMemo(
    () => ({
      selection,
      toolbarPosition,
      isOpen,
      clearSelection,
      deleteSelection,
      meaningOpen,
      setMeaningOpen,
      setMeaningWord,
    }),
    [
      selection,
      toolbarPosition,
      isOpen,
      clearSelection,
      deleteSelection,
      meaningOpen,
    ],
  );

  return (
    <TextSelectionContext.Provider value={value}>
      {children}
    </TextSelectionContext.Provider>
  );
}

export function useTextSelection(): TextSelectionContextValue {
  const ctx = React.useContext(TextSelectionContext);
  if (!ctx) {
    throw new Error(
      "useTextSelection must be used within TextSelectionProvider",
    );
  }
  return ctx;
}
