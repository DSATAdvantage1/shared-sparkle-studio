import * as React from "react";
import { BadgeCheck, BookOpen, ChevronDown, Trash2 } from "lucide-react";

import type { VocabularyFlashItem } from "@/lib/vocabulary-flash";

export function VocabularyDashboardCard({
  item,
  isFlipped,
  onFlip,
  onToggleMastered,
  onDelete,
}: {
  item: VocabularyFlashItem;
  isFlipped: boolean;
  onFlip: () => void;
  onToggleMastered: (next: boolean) => void;
  onDelete: () => void;
}) {
  const difficulty = getDifficultyBadge(item.word);

  return (
    <div className="group relative h-full" style={{ perspective: "1200px" }}>
      <button
        type="button"
        onClick={onFlip}
        className="relative h-full w-full rounded-3xl border border-foreground/10 bg-white/80 p-0 shadow-sm transition-all duration-300 hover:shadow-lg"
        style={{ transformStyle: "preserve-3d" }}
        aria-label={isFlipped ? "Flip card to front" : "Flip card to back"}
      >
        <div
          className="relative h-full w-full rounded-3xl"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-3xl border border-transparent bg-white/80 p-5"
            style={{
              backfaceVisibility: "hidden",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Word
                </div>
                <div className="mt-2 line-clamp-2 text-2xl font-extrabold text-foreground">
                  {item.word}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {item.partOfSpeech ? (
                    <span className="rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs font-semibold text-foreground/90">
                      {item.partOfSpeech}
                    </span>
                  ) : null}
                  {item.pronunciation ? (
                    <span className="rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs font-semibold text-foreground/90">
                      <span className="mr-2 text-muted-foreground">/</span>
                      {stripSlashes(item.pronunciation)}
                      <span className="ml-2 text-muted-foreground">/</span>
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      difficulty.variant === "easy"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                        : difficulty.variant === "medium"
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-700"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-700"
                    }`}
                  >
                    {difficulty.label}
                  </span>
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 text-blue-700">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  Tap to flip
                </span>
              </div>

              <div className="flex items-center gap-2">
                {item.mastered ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Mastered
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-foreground/20 bg-background px-3 py-1 text-xs font-semibold text-foreground/80">
                    New
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-3xl bg-gradient-to-b from-blue-600/[0.03] to-white/90 p-5"
            style={{
              backfaceVisibility: "hidden",
              transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Definition
                </div>
                <div className="mt-2 text-base font-bold text-foreground">
                  {item.definition}
                </div>

                {item.synonyms?.length ? (
                  <div className="mt-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Synonyms
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.synonyms.slice(0, 5).map((s, idx) => (
                        <span
                          key={`${s}-${idx}`}
                          className="rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs font-semibold text-foreground/90"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {item.exampleSentence ? (
                  <div className="mt-4 rounded-2xl border border-foreground/10 bg-background/60 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Example
                    </div>
                    <div className="mt-1 text-sm text-foreground/90">
                      {item.exampleSentence}
                    </div>
                  </div>
                ) : null}

                {item.memoryTip ? (
                  <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                      Memory tip
                    </div>
                    <div className="mt-1 text-sm text-foreground/90">
                      {item.memoryTip}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleMastered(!item.mastered);
                }}
                className="flex items-center justify-center gap-2 rounded-full border border-foreground/20 bg-background px-4 py-2 text-sm font-semibold text-foreground/90 hover:bg-muted transition"
              >
                {item.mastered ? "Unmaster" : "Mark mastered"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex items-center justify-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-500/20 transition"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>

            <div className="mt-4 text-xs font-semibold text-muted-foreground">
              Added: {formatAddedDate(item.createdAt)}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

function stripSlashes(s: string) {
  const t = s.trim();
  return t.replace(/^\/+|\/+$/g, "");
}

function getDifficultyBadge(word: string): {
  label: string;
  variant: "easy" | "medium" | "hard";
} {
  const letters = word.replace(/[^a-zA-Z]/g, "").length;
  if (letters <= 6) return { label: "Easy", variant: "easy" };
  if (letters <= 10) return { label: "Medium", variant: "medium" };
  return { label: "Hard", variant: "hard" };
}

function formatAddedDate(ts: number) {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
