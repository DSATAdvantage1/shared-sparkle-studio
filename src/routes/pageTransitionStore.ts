export type TransitionKind = "practice-exam" | "question-bank";

const KEY = "dsat:transition1600";

export function requestTransition(kind: TransitionKind) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ kind, at: Date.now() }));
  } catch {
    // ignore
  }
}

export function consumeTransition(): { kind: TransitionKind } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
