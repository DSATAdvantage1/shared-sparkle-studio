import * as React from "react";

import { getWordMeaning } from "@/server-fns/word-meaning.functions";

export type WordMeaning = {
  word: string;
  definition: string;
  partOfSpeech: string;
  pronunciation: string;
  synonyms: string[];
  examples: string[];
  satExplanation: string;
  memoryTip: string;
  source?: string;
  cached?: boolean;
};

export function useWordMeaning() {
  const [loading, setLoading] = React.useState(false);
  const [meaning, setMeaning] = React.useState<WordMeaning | null>(null);

  const fetchMeaning = React.useCallback(
    async (word: string, context?: string) => {
      const trimmed = word.trim();
      const match = trimmed.match(/[A-Za-z]+/);
      const firstToken = match ? match[0] : trimmed;
      const lookupKey = firstToken.toLowerCase();
      if (!lookupKey)
        return { meaning: null as WordMeaning | null, loading: false };

      const cachedRaw = window.localStorage.getItem(`wordMeaning:${lookupKey}`);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as WordMeaning;
          return { meaning: cached, loading: false };
        } catch {
          // ignore
        }
      }

      setLoading(true);
      setMeaning(null);
      try {
        // Debug: trace the full word meaning lookup payload
        console.debug("[useWordMeaning] request", { word, context });
        const res = await getWordMeaning({ data: { word, context } } as any);
        const next = res as WordMeaning;

        console.debug("[useWordMeaning] response (parsed server result)", {
          word: next?.word,
          definition: next?.definition,
          partOfSpeech: next?.partOfSpeech,
          synonymsCount: next?.synonyms?.length,
          cached: next?.cached,
          memoryTip: next?.memoryTip,
        });

        // Consider the payload valid if the definition is populated.
        const hasRenderablePayload =
          !!next &&
          typeof next.definition === "string" &&
          next.definition.trim().length > 0;

        if (!hasRenderablePayload) {
          setMeaning(null);
          return { meaning: null as WordMeaning | null, loading: false };
        }

        setMeaning(next);

        // Cache only non-empty definitions.
        window.localStorage.setItem(
          `wordMeaning:${lookupKey}`,
          JSON.stringify(next),
        );

        return { meaning: next, loading: false };
      } catch {
        // Hard failure: keep meaning as null and let UI render its error/empty state.
        setMeaning(null);
        return { meaning: null as WordMeaning | null, loading: false };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { loading, meaning, fetchMeaning };
}
