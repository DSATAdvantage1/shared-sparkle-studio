import * as React from "react";

import type { VocabularyFlashItem } from "@/lib/vocabulary-flash";

export function VocabularyToastRow({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-foreground/15 bg-background/80 px-4 py-2 text-sm text-foreground shadow-sm">
      {message}
    </div>
  );
}

export function VocabularyCardList({
  items,
  onDelete,
  onToggleMastered,
  onToggleFlipped,
}: {
  items: VocabularyFlashItem[];
  onDelete: (word: string) => void;
  onToggleMastered: (word: string, mastered: boolean) => void;
  onToggleFlipped: (word: string) => void;
}) {
  const flippedSet = React.useRef<Set<string>>(new Set());

  return (
    <div className="grid gap-4 sm:grid-cols-1">
      {items.map((it) => {
        const isFlipped = flippedSet.current.has(it.word.toLowerCase());
        return (
          <div
            key={it.word.toLowerCase()}
            className="group relative rounded-3xl border border-foreground/10 bg-white/70 p-4 shadow-sm transition hover:shadow"
          >
            <button
              type="button"
              onClick={() => onToggleFlipped(it.word)}
              className="w-full text-left"
              aria-label="Flip"
            >
              {!isFlipped ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Front
                    </div>
                    <div className="mt-1 text-2xl font-extrabold text-foreground">
                      {it.word}
                    </div>
                  </div>
                  <div className="rounded-full border border-foreground/10 bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {it.mastered ? "Mastered" : "New"}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Back
                      </div>
                      <div className="mt-2 text-base font-bold text-foreground">
                        {it.definition}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-foreground/10 bg-background/70 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Part of speech
                      </div>
                      <div className="mt-1 break-words text-sm font-medium text-foreground">
                        {it.partOfSpeech ?? "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-foreground/10 bg-background/70 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Pronunciation
                      </div>
                      <div className="mt-1 break-words text-sm font-medium text-foreground">
                        {it.pronunciation ?? "—"}
                      </div>
                    </div>
                  </div>

                  {it.exampleSentence ? (
                    <div className="mt-3 rounded-2xl border border-foreground/10 bg-background/70 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Example
                      </div>
                      <div className="mt-1 text-sm text-foreground/90">
                        {it.exampleSentence}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </button>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onToggleMastered(it.word, !it.mastered)}
                className="rounded-full border border-foreground/20 bg-background px-4 py-2 text-sm font-semibold text-foreground/90 hover:bg-muted"
              >
                {it.mastered ? "Mark as not mastered" : "Mark as mastered"}
              </button>

              <button
                type="button"
                onClick={() => onDelete(it.word)}
                className="rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
