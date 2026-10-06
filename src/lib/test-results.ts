// Saved results for completed practice tests (browser localStorage).
export type SavedTestResult = {
  answers: Record<string, number | undefined>;
  textAnswers: Record<string, string>;
  score: number;
  total: number;
  scaled: number;
  completedAt: string;
};

const resultKey = (testKey: string) => `dsat-test-result:${testKey}`;
const progressKey = (testKey: string) => `dsat-test-progress:${testKey}`;

export function getTestResult(testKey: string): SavedTestResult | null {
  try {
    const raw = localStorage.getItem(resultKey(testKey));
    return raw ? (JSON.parse(raw) as SavedTestResult) : null;
  } catch {
    return null;
  }
}

export function saveTestResult(testKey: string, result: SavedTestResult) {
  try {
    localStorage.setItem(resultKey(testKey), JSON.stringify(result));
    localStorage.removeItem(progressKey(testKey));
  } catch {
    // ignore
  }
}

export function deleteTestResult(testKey: string) {
  try {
    localStorage.removeItem(resultKey(testKey));
    localStorage.removeItem(progressKey(testKey));
  } catch {
    // ignore
  }
}

export function hasTestProgress(testKey: string) {
  try {
    return !!localStorage.getItem(progressKey(testKey));
  } catch {
    return false;
  }
}
