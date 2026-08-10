const KEY = "dsat_vocab_flash_v2";

export type VocabularyFlashItem = {
  word: string;
  definition: string;

  // English-only enrichment fields (no RU/AR)
  partOfSpeech?: string | null;
  pronunciation?: string | null;
  synonyms?: string[];
  memoryTip?: string | null;

  exampleSentence?: string | null;
  createdAt: number;
  mastered: boolean;

  // Review scheduling (Anki/SM-2 inspired)
  lastReviewedAt?: number | null;
  nextReviewAt?: number | null;
  reviewCount?: number;
  easeFactor?: number; // typically >= 1.3
  interval?: number; // in days
};

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

function safeJsonParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readAll(): VocabularyFlashItem[] {
  const parsed = safeJsonParse(localStorage.getItem(KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(
      (x): x is VocabularyFlashItem =>
        !!x &&
        typeof x.word === "string" &&
        typeof x.definition === "string" &&
        typeof x.createdAt === "number" &&
        typeof x.mastered === "boolean",
    )
    .slice(-500);
}

function writeAll(items: VocabularyFlashItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(-500)));
}

function announceSync() {
  try {
    const bc = new BroadcastChannel("dsat_vocab_flash_sync_v2");
    bc.postMessage({ type: "vocab_updated" });
    bc.close();
  } catch {
    // ignore
  }
}

function withMasteredFlag(
  item: Omit<VocabularyFlashItem, "mastered"> & { mastered?: boolean },
): VocabularyFlashItem {
  return {
    ...item,
    mastered: typeof item.mastered === "boolean" ? item.mastered : false,
  };
}

export function getVocabularyItems(): VocabularyFlashItem[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function hasVocabularyWord(word: string): boolean {
  const n = normalizeWord(word);
  return readAll().some((x) => normalizeWord(x.word) === n);
}

export function addVocabularyItem(input: {
  word: string;
  definition: string;

  // Optional RU/AR kept for backward-compat with older callers.
  // They will NOT be displayed on the vocabulary page.
  russianTranslation?: string;
  arabicTranslation?: string;

  partOfSpeech?: string | null;
  pronunciation?: string | null;
  synonyms?: string[];
  memoryTip?: string | null;

  exampleSentence?: string | null;
}): { status: "added" | "duplicate" } {
  const word = input.word.trim();
  if (!word) return { status: "duplicate" };

  const items = readAll();
  const n = normalizeWord(word);
  if (items.some((x) => normalizeWord(x.word) === n))
    return { status: "duplicate" };

  const now = Date.now();
  const nextItem = withMasteredFlag({
    word,
    definition: input.definition,
    partOfSpeech: input.partOfSpeech ?? null,
    pronunciation: input.pronunciation ?? null,
    synonyms: Array.isArray(input.synonyms)
      ? input.synonyms.filter(
          (s) => typeof s === "string" && s.trim().length > 0,
        )
      : [],
    memoryTip: input.memoryTip ?? null,
    exampleSentence: input.exampleSentence ?? null,
    createdAt: now,
    mastered: false,
  });

  writeAll([...items, nextItem]);
  announceSync();
  return { status: "added" };
}

export function deleteVocabularyItem(word: string): boolean {
  const n = normalizeWord(word);
  const items = readAll();
  const before = items.length;
  const next = items.filter((x) => normalizeWord(x.word) !== n);
  if (next.length === before) return false;
  writeAll(next);
  announceSync();
  return true;
}

export function setVocabularyMastered(
  word: string,
  mastered: boolean,
): boolean {
  const n = normalizeWord(word);
  const items = readAll();
  let changed = false;
  const next = items.map((x) => {
    if (normalizeWord(x.word) !== n) return x;
    changed = true;
    return { ...x, mastered };
  });
  if (!changed) return false;
  writeAll(next);
  announceSync();
  return true;
}

export function migrateLegacyV1IfAny() {
  // legacy key: dsat_vocab_flash_v1
  const legacyKey = "dsat_vocab_flash_v1";
  const raw = safeJsonParse(localStorage.getItem(legacyKey));
  if (!Array.isArray(raw) || raw.length === 0) return;

  const items: VocabularyFlashItem[] = raw
    .filter(
      (x) => !!x && typeof x.word === "string" && typeof x.meaning === "string",
    )
    .map((x) =>
      withMasteredFlag({
        word: x.word,
        definition: x.meaning,
        partOfSpeech: null,
        pronunciation: null,
        synonyms: [],
        memoryTip: null,
        exampleSentence: null,
        createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
        mastered: false,
      }),
    );

  if (!items.length) return;

  const current = readAll();
  const currentWords = new Set(current.map((x) => normalizeWord(x.word)));
  const toAdd = items.filter((x) => !currentWords.has(normalizeWord(x.word)));
  if (!toAdd.length) return;

  writeAll([...current, ...toAdd]);
  announceSync();
}

// placeholder for future: could integrate sonner/toast.
// legacy export (kept for compatibility)
export function flashToast(message: string) {
  console.log("VOCAB_FLASH", message);
}

// Back-compat helpers for older code paths
export function getFlashVocabulary() {
  return getVocabularyItems().map((x) => ({
    word: x.word,
    meaning: x.definition,
    createdAt: x.createdAt,
  }));
}

export function addFlashVocabulary(word: string, meaning: string) {
  addVocabularyItem({
    word,
    definition: meaning,
    exampleSentence: null,
  });
}

export function clearFlashVocabulary() {
  localStorage.removeItem(KEY);
  try {
    const bc = new BroadcastChannel("dsat_vocab_flash_sync_v2");
    bc.postMessage({ type: "vocab_updated" });
    bc.close();
  } catch {
    // ignore
  }
}

// Auto-run legacy v1 migration on first load (browser only).
// Migrates words saved with old key "dsat_vocab_flash_v1" into v2 store.
if (typeof window !== "undefined") {
  try {
    migrateLegacyV1IfAny();
  } catch {
    // ignore migration errors
  }
}
