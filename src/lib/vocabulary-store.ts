export type VocabularyItem = {
  id?: string;
  word: string;
  meaning: string;
  examples?: string[] | null;
  part_of_speech?: string | null;
  created_at?: string | null;
};

// Simple client-side store for now.
// If/when you add a dedicated "vocabulary" table, this can be replaced with Supabase persistence.
const KEY = "dsat_vocab_flash_v1";

type FlashEntry = {
  word: string;
  meaning: string;
  createdAt: number;
};

function readFlash(): FlashEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x) => x && typeof x.word === "string" && typeof x.meaning === "string",
      )
      .slice(-100);
  } catch {
    return [];
  }
}

function writeFlash(items: FlashEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(-100)));
}

export function addFlashVocabulary(word: string, meaning: string) {
  const now = Date.now();
  const items = readFlash();
  const filtered = items.filter(
    (x) => x.word.toLowerCase() !== word.toLowerCase(),
  );
  writeFlash([
    ...filtered,
    {
      word,
      meaning,
      createdAt: now,
    },
  ]);
}

export function getFlashVocabulary(): FlashEntry[] {
  return readFlash().sort((a, b) => b.createdAt - a.createdAt);
}

export function clearFlashVocabulary() {
  localStorage.removeItem(KEY);
}
