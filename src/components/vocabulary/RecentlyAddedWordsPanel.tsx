import * as React from "react";
import { Clock, Sparkles } from "lucide-react";

import type { VocabularyFlashItem } from "@/lib/vocabulary-flash";

export function RecentlyAddedWordsPanel({
  items,
}: {
  items: VocabularyFlashItem[];
}) {
  const recent = React.useMemo(() => items.slice(0, 5), [items]);

  return (
    <div className="rounded-3xl border border-foreground/10 bg-white/70 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 text-blue-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-extrabold text-foreground">
            Recent words
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Added lately
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-foreground/10 bg-background/60 p-4 text-sm text-muted-foreground">
            No recent words yet.
          </div>
        ) : (
          recent.map((it) => (
            <div
              key={it.word.toLowerCase()}
              className="flex items-start justify-between gap-3 rounded-2xl border border-foreground/10 bg-background/50 p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-base font-extrabold text-foreground">
                  {it.word}
                </div>
                <div className="mt-1 line-clamp-2 text-sm text-foreground/90">
                  {it.definition}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelative(it.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatRelative(ts: number) {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
