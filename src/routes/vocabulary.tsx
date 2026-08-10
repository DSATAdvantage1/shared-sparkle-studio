import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import {
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  CheckCircle2,
  Circle,
  BookOpen,
  Sparkles,
  Lightbulb,
  Filter,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Star,
  Layers,
} from "lucide-react";
import {
  getVocabularyItems,
  deleteVocabularyItem,
  setVocabularyMastered,
  type VocabularyFlashItem,
} from "@/lib/vocabulary-flash";
import "./vocabulary.css";

export const Route = createFileRoute("/vocabulary")({
  head: () => ({
    meta: [
      { title: "Vocabulary — DSAT Advantage" },
      {
        name: "description",
        content: "Your saved vocabulary words for SAT prep.",
      },
    ],
  }),
  component: VocabularyPage,
});

type FilterMode = "all" | "mastered" | "unmastered";
type SortMode = "newest" | "az" | "za";
type ViewMode = "packages" | "allwords";

/** Format a timestamp to a date key like "2026-08-01" */
function toDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Format a date key to a human-readable label like "August 1, 2026" */
function formatPackageLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Returns "Today", "Yesterday", or the formatted label */
function formatPackageLabelSmart(dateKey: string): string {
  const todayKey = toDateKey(Date.now());
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const yesterday = new Date(ty, tm - 1, td - 1);
  const yesterdayKey = toDateKey(yesterday.getTime());
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  return formatPackageLabel(dateKey);
}

type DailyPackage = {
  dateKey: string;
  label: string;
  words: VocabularyFlashItem[];
};

function buildDailyPackages(items: VocabularyFlashItem[]): DailyPackage[] {
  const map = new Map<string, VocabularyFlashItem[]>();
  for (const item of items) {
    const key = toDateKey(item.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  // Sort by date descending (most recent first)
  const sorted = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  return sorted.map(([dateKey, words]) => ({
    dateKey,
    label: formatPackageLabelSmart(dateKey),
    words: words.sort((a, b) => a.word.localeCompare(b.word)),
  }));
}

// ─── Flashcard Modal ──────────────────────────────────────────────────────────

function FlashcardSession({
  pkg,
  onClose,
  onMarkMastered,
}: {
  pkg: DailyPackage;
  onClose: () => void;
  onMarkMastered: (word: string, mastered: boolean) => void;
}) {
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [masteredSet, setMasteredSet] = React.useState<Set<string>>(
    () => new Set(pkg.words.filter((w) => w.mastered).map((w) => w.word))
  );

  const total = pkg.words.length;
  const card = pkg.words[idx];

  function next() {
    if (idx >= total - 1) {
      setDone(true);
    } else {
      setFlipped(false);
      setTimeout(() => setIdx((i) => i + 1), 150);
    }
  }

  function prev() {
    if (idx <= 0) return;
    setFlipped(false);
    setTimeout(() => setIdx((i) => i - 1), 150);
  }

  function toggleMastered() {
    const newMastered = !masteredSet.has(card.word);
    const next = new Set(masteredSet);
    if (newMastered) next.add(card.word);
    else next.delete(card.word);
    setMasteredSet(next);
    onMarkMastered(card.word, newMastered);
  }

  function restart() {
    setIdx(0);
    setFlipped(false);
    setDone(false);
  }

  // Keyboard navigation
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (!flipped) setFlipped(true);
        else next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, idx]);

  const masteredCount = masteredSet.size;

  return (
    <div className="flashcard-overlay">
      {/* Header */}
      <div className="flashcard-header">
        <div className="flashcard-header-left">
          <button onClick={onClose} className="flashcard-close-btn" title="Close (Esc)">
            <X className="h-5 w-5" />
          </button>
          <div>
            <div className="flashcard-pkg-label">{pkg.label}</div>
            <div className="flashcard-pkg-sublabel">{total} words · {masteredCount} mastered</div>
          </div>
        </div>

        <div className="flashcard-progress-bar-wrap">
          <div
            className="flashcard-progress-bar-fill"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>

        <div className="flashcard-counter">
          {idx + 1} / {total}
        </div>
      </div>

      {/* Main area */}
      {done ? (
        <div className="flashcard-done">
          <div className="flashcard-done-icon">🎉</div>
          <h2 className="flashcard-done-title">Session Complete!</h2>
          <p className="flashcard-done-sub">
            You reviewed all {total} words from {pkg.label}.
            <br />
            <strong>{masteredCount}</strong> of {total} marked as mastered.
          </p>
          <div className="flashcard-done-actions">
            <button onClick={restart} className="flashcard-action-btn primary">
              <RotateCcw className="h-4 w-4" /> Restart
            </button>
            <button onClick={onClose} className="flashcard-action-btn ghost">
              <X className="h-4 w-4" /> Close
            </button>
          </div>
        </div>
      ) : (
        <div className="flashcard-stage">
          {/* Flashcard */}
          <div
            className={`flashcard-card ${flipped ? "is-flipped" : ""}`}
            onClick={() => setFlipped((f) => !f)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFlipped((f) => !f); }}
            aria-label={flipped ? "Card flipped — showing definition" : "Click to reveal definition"}
          >
            <div className="flashcard-inner">
              {/* Front */}
              <div className="flashcard-face flashcard-front">
                <div className="flashcard-front-hint">
                  Click to reveal definition
                </div>
                <div className="flashcard-word">{card.word}</div>
                {card.partOfSpeech && (
                  <div className="flashcard-pos">{card.partOfSpeech}</div>
                )}
                {card.pronunciation && (
                  <div className="flashcard-pronunciation">/{card.pronunciation}/</div>
                )}
              </div>

              {/* Back */}
              <div className="flashcard-face flashcard-back">
                <div className="flashcard-word flashcard-word-sm">{card.word}</div>
                <div className="flashcard-definition">{card.definition}</div>

                {card.exampleSentence && (
                  <div className="flashcard-example">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>"{card.exampleSentence}"</span>
                  </div>
                )}

                {card.memoryTip && (
                  <div className="flashcard-tip">
                    <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                    <span>{card.memoryTip}</span>
                  </div>
                )}

                {card.synonyms && card.synonyms.length > 0 && (
                  <div className="flashcard-synonyms">
                    {card.synonyms.slice(0, 5).map((s) => (
                      <span key={s} className="flashcard-synonym-tag">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flashcard-controls">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="flashcard-nav-btn"
              title="Previous (←)"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              onClick={toggleMastered}
              className={`flashcard-master-btn ${masteredSet.has(card.word) ? "is-mastered" : ""}`}
              title={masteredSet.has(card.word) ? "Unmark mastered" : "Mark as mastered"}
            >
              <Star className="h-4 w-4" />
              {masteredSet.has(card.word) ? "Mastered" : "Mark Mastered"}
            </button>

            <button
              onClick={next}
              className="flashcard-nav-btn"
              title={idx === total - 1 ? "Finish" : "Next (→)"}
            >
              {idx === total - 1 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flashcard-hint-row">
            Press <kbd>Space</kbd> to flip · <kbd>→</kbd> next · <kbd>←</kbd> prev · <kbd>Esc</kbd> close
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Daily Package Card ───────────────────────────────────────────────────────

function PackageCard({
  pkg,
  onStart,
}: {
  pkg: DailyPackage;
  onStart: () => void;
}) {
  const masteredCount = pkg.words.filter((w) => w.mastered).length;
  const progress = pkg.words.length > 0 ? (masteredCount / pkg.words.length) * 100 : 0;

  // Format date key for month ordinal display
  const [year, month, day] = pkg.dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const dayLabel = d.toLocaleDateString("en-US", { day: "numeric" });
  const monthLabel = d.toLocaleDateString("en-US", { month: "short" });

  return (
    <div className="pkg-card" onClick={onStart} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onStart(); }}>
      <div className="pkg-card-date">
        <div className="pkg-card-day">{dayLabel}</div>
        <div className="pkg-card-month">{monthLabel}</div>
      </div>

      <div className="pkg-card-info">
        <div className="pkg-card-title">{pkg.label}</div>
        <div className="pkg-card-meta">
          <span>{pkg.words.length} word{pkg.words.length !== 1 ? "s" : ""}</span>
          {masteredCount > 0 && (
            <span className="pkg-card-mastered-badge">{masteredCount} mastered</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="pkg-card-progress-track">
          <div
            className="pkg-card-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="pkg-card-cta">
        <Layers className="h-4 w-4" />
        <span>Study</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function VocabularyPage() {
  const [items, setItems] = React.useState<VocabularyFlashItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<FilterMode>("all");
  const [sort, setSort] = React.useState<SortMode>("newest");
  const [expandedWord, setExpandedWord] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("packages");
  const [activeSession, setActiveSession] = React.useState<DailyPackage | null>(null);

  function reload() {
    try {
      setItems(getVocabularyItems());
    } catch {
      setItems([]);
    }
  }

  React.useEffect(() => {
    reload();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("dsat_vocab_flash_sync_v2");
      bc.addEventListener("message", (e) => {
        if (e.data?.type === "vocab_updated") reload();
      });
    } catch {}

    function onStorage(e: StorageEvent) {
      if (e.key === "dsat_vocab_flash_v2") reload();
    }
    window.addEventListener("storage", onStorage);

    return () => {
      bc?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function handleDelete(word: string) {
    deleteVocabularyItem(word);
    reload();
    toast.success(`"${word}" removed from Vocabulary.`);
  }

  function handleToggleMastered(word: string, mastered: boolean) {
    setVocabularyMastered(word, mastered);
    reload();
  }

  const filtered = React.useMemo(() => {
    let result = [...items];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (x) =>
          x.word.toLowerCase().includes(q) ||
          x.definition.toLowerCase().includes(q),
      );
    }
    if (filter === "mastered") result = result.filter((x) => x.mastered);
    if (filter === "unmastered") result = result.filter((x) => !x.mastered);

    if (sort === "az")
      result = result.sort((a, b) => a.word.localeCompare(b.word));
    else if (sort === "za")
      result = result.sort((a, b) => b.word.localeCompare(a.word));

    return result;
  }, [items, search, filter, sort]);

  const masteredCount = items.filter((x) => x.mastered).length;
  const dailyPackages = React.useMemo(() => buildDailyPackages(items), [items]);

  return (
    <>
      {/* Flashcard session overlay */}
      {activeSession && (
        <FlashcardSession
          pkg={activeSession}
          onClose={() => setActiveSession(null)}
          onMarkMastered={(word, mastered) => {
            handleToggleMastered(word, mastered);
          }}
        />
      )}

      <div className="vocab-page-container">
        <div className="vocab-bg-grid" />

        {/* Header */}
        <div className="vocab-hero">
          <div className="vocab-hero-content">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur shadow-[0_10px_30px_-10px_rgba(255,255,255,0.2)]">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md">
                  My Vocabulary
                </h1>
                <p className="mt-1 text-sm text-white/80 font-medium">
                  Words saved during your SAT prep
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <StatBadge value={items.length} label="Total words" />
              <StatBadge value={masteredCount} label="Mastered" />
              <StatBadge value={items.length - masteredCount} label="Learning" />
              <StatBadge value={dailyPackages.length} label="Day packages" />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="vocab-tab-bar">
          <div className="vocab-tabs">
            <button
              onClick={() => setViewMode("packages")}
              className={`vocab-tab ${viewMode === "packages" ? "is-active" : ""}`}
            >
              <Package className="h-4 w-4" />
              Daily Packages
            </button>
            <button
              onClick={() => setViewMode("allwords")}
              className={`vocab-tab ${viewMode === "allwords" ? "is-active" : ""}`}
            >
              <BookOpen className="h-4 w-4" />
              All Words
            </button>
          </div>
        </div>

        {/* Packages View */}
        {viewMode === "packages" && (
          <main className="vocab-main">
            {dailyPackages.length === 0 ? (
              <EmptyState hasWords={false} />
            ) : (
              <div className="pkg-grid">
                {dailyPackages.map((pkg) => (
                  <PackageCard
                    key={pkg.dateKey}
                    pkg={pkg}
                    onStart={() => setActiveSession(pkg)}
                  />
                ))}
              </div>
            )}
          </main>
        )}

        {/* All Words View */}
        {viewMode === "allwords" && (
          <>
            {/* Controls bar */}
            <div className="vocab-controls">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
                <div className="relative min-w-[240px] flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="vocab-search"
                    type="text"
                    placeholder="Search words or definitions…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/50 p-1 shadow-sm">
                    <Filter className="ml-2 mr-1 h-3.5 w-3.5 text-slate-400" />
                    {(["all", "mastered", "unmastered"] as FilterMode[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition ${
                          filter === f
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/50 p-1 shadow-sm">
                    <button
                      onClick={() => setSort("newest")}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                        sort === "newest"
                          ? "bg-slate-900 text-white shadow-md"
                          : "text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      Newest
                    </button>
                    <button
                      onClick={() => setSort(sort === "az" ? "za" : "az")}
                      className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                        sort === "az" || sort === "za"
                          ? "bg-slate-900 text-white shadow-md"
                          : "text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {sort === "za" ? (
                        <SortDesc className="h-3.5 w-3.5" />
                      ) : (
                        <SortAsc className="h-3.5 w-3.5" />
                      )}
                      A–Z
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <main className="vocab-main">
              {filtered.length === 0 && <EmptyState hasWords={items.length > 0} />}

              <div className="grid gap-4">
                {filtered.map((item) => (
                  <WordCard
                    key={item.word}
                    item={item}
                    expanded={expandedWord === item.word}
                    onToggleExpand={() =>
                      setExpandedWord((w) => (w === item.word ? null : item.word))
                    }
                    onDelete={handleDelete}
                    onToggleMastered={handleToggleMastered}
                  />
                ))}
              </div>
            </main>
          </>
        )}
      </div>
    </>
  );
}

function StatBadge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/20 px-6 py-3 text-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/70 mt-1">
        {label}
      </div>
    </div>
  );
}

function WordCard({
  item,
  expanded,
  onToggleExpand,
  onDelete,
  onToggleMastered,
}: {
  item: VocabularyFlashItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: (word: string) => void;
  onToggleMastered: (word: string, mastered: boolean) => void;
}) {
  const dateAdded = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={`vocab-card ${item.mastered ? "is-mastered" : ""}`}>
      <button
        type="button"
        onClick={onToggleExpand}
        className="vocab-card-header"
      >
        <div
          className={`shrink-0 ${item.mastered ? "text-emerald-500 drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]" : "text-slate-300"}`}
        >
          {item.mastered ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <Circle className="h-6 w-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-[Georgia,serif] text-2xl font-bold text-slate-900">
              {item.word}
            </span>
            {item.partOfSpeech && (
              <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 shadow-sm">
                {item.partOfSpeech}
              </span>
            )}
            {item.mastered && (
              <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">
                Mastered
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-slate-500 font-medium">
            {item.definition}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] font-medium text-slate-400">{dateAdded}</div>
          <div
            className={`mt-1 text-[10px] font-bold uppercase tracking-widest transition ${
              expanded ? "text-blue-600" : "text-slate-400"
            }`}
          >
            {expanded ? "Less ▲" : "More ▼"}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="vocab-card-body">
          <div className="grid gap-4 sm:grid-cols-2">
            {item.synonyms && item.synonyms.length > 0 && (
              <InfoBlock label="Synonyms">
                <div className="flex flex-wrap gap-2">
                  {item.synonyms.slice(0, 8).map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </InfoBlock>
            )}

            {item.pronunciation && (
              <InfoBlock label="Pronunciation">
                <span className="font-mono text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  {item.pronunciation}
                </span>
              </InfoBlock>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {item.memoryTip && (
              <div className="vocab-tip-box bg-amber-50/80 border border-amber-100">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                    Memory Tip
                  </div>
                  <p className="mt-1 text-sm font-medium text-amber-900 leading-relaxed">
                    {item.memoryTip}
                  </p>
                </div>
              </div>
            )}

            {item.exampleSentence && (
              <div className="vocab-tip-box bg-blue-50/80 border border-blue-100">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                    Example Usage
                  </div>
                  <p className="mt-1 text-sm italic font-medium text-blue-900 leading-relaxed">
                    "{item.exampleSentence}"
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onToggleMastered(item.word, !item.mastered)}
              className={`vocab-btn ${item.mastered ? "unmaster" : "master"}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {item.mastered ? "Unmark Mastered" : "Mark as Mastered"}
            </button>

            <button
              onClick={() => onDelete(item.word)}
              className="vocab-btn delete"
            >
              <Trash2 className="h-4 w-4" />
              Remove Word
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function EmptyState({ hasWords }: { hasWords: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 shadow-inner">
        <BookOpen className="h-10 w-10 text-blue-600" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-slate-800 tracking-tight">
        {hasWords ? "No words match your search" : "No vocabulary words yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500 leading-relaxed font-medium">
        {hasWords
          ? "Try adjusting your search terms or filter settings."
          : "Whenever you highlight a difficult word while taking a practice test, it will automatically save here so you can master it."}
      </p>
    </div>
  );
}
