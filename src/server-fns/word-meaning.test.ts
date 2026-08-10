import { getWordMeaning } from "@/server-fns/word-meaning.functions";

const TEST_WORDS = [
  "furnishings",
  "gather",
  "acknowledge",
  "proceed",
  "implicit",
  "nuance",
  "concise",
  "infer",
];

function assertNonEmptyDefinition(payload: any, word: string) {
  if (!payload || typeof payload !== "object") {
    throw new Error(`[test] ${word}: payload missing`);
  }
  const def = payload.definition;
  if (typeof def !== "string" || def.trim().length === 0) {
    throw new Error(`[test] ${word}: definition is empty`);
  }
}

async function main() {
  const results: any[] = [];
  for (const w of TEST_WORDS) {
    const res = await getWordMeaning({ data: { word: w } } as any);
    assertNonEmptyDefinition(res, w);
    results.push(res);
  }

  // Helpful verification for the specific word you care about.
  const furnishings = results.find(
    (r) => String(r.word).toLowerCase() === "furnishings",
  );
  if (!furnishings) throw new Error("[test] furnishings result missing");

  // eslint-disable-next-line no-console
  console.log("[test] furnishings payload:", furnishings);

  // eslint-disable-next-line no-console
  console.log("[test] All word-meaning tests passed.");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
