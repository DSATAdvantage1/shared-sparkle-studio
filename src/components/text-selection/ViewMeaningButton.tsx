import * as React from "react";
import { BookOpen } from "lucide-react";

import { useTextSelection } from "@/hooks/useTextSelection";

export function ViewMeaningButton() {
  const {
    selection,
    toolbarPosition,
    meaningOpen,
    setMeaningOpen,
    setMeaningWord,
  } = useTextSelection();

  if (!selection?.text || !toolbarPosition) return null;
  if (meaningOpen) return null;
  // Only show for a single validated word
  const singleWordRegex = /^[A-Za-z][A-Za-z'-]{1,39}$/;
  if (!singleWordRegex.test(selection.text.trim())) return null;

  // Position safely within viewport
  const left =
    typeof window !== "undefined"
      ? Math.min(Math.max(toolbarPosition.left, 12), window.innerWidth - 160)
      : toolbarPosition.left;

  const style: React.CSSProperties = {
    position: "fixed",
    left,
    top:
      toolbarPosition.top < 80 ? toolbarPosition.top + 36 : toolbarPosition.top,
    zIndex: 9999,
    transform: toolbarPosition.top < 80 ? "none" : "translateY(-100%)",
  };

  return (
    <button
      type="button"
      data-text-selection-toolbar="true"
      style={style}
      onClick={() => {
        setMeaningWord(selection.text);
        setMeaningOpen(true);
      }}
      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-lg backdrop-blur transition hover:bg-slate-50"
      aria-label="View meaning"
    >
      <BookOpen className="h-3.5 w-3.5 text-blue-600" />
      Look up
    </button>
  );
}
