import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import offlineSatVocab from "@/lib/offline-sat-vocab.json";

const inputSchema = z.object({
  word: z.string().min(1),
  context: z.string().optional(),
});

export const outputSchema = z.object({
  word: z.string().min(1),
  definition: z.string().min(1),
  partOfSpeech: z.string(),
  pronunciation: z.string(),
  synonyms: z.array(z.string()),
  examples: z.array(z.string()),
  satExplanation: z.string(),
  memoryTip: z.string(),
  source: z.string(),
  cached: z.boolean(),
});
export type Output = z.infer<typeof outputSchema>;

const WORD_MEANING_CACHE_TABLE = "word_meaning_cache";
const WORD_MEANING_CACHE_PAYLOAD_FIELD = "payload";

// In-memory acceleration (fast path) + request de-dupe.
const MEMORY_CACHE = new Map<string, Output>();
const IN_FLIGHT = new Map<string, Promise<Output>>();

// Offline SAT dictionary (local JSON)
const OFFLINE_SAT_DICT = offlineSatVocab as Record<
  string,
  {
    definition: string;
    partOfSpeech: string;
    pronunciation: string;
    synonyms: string[];
    examples: string[];
    satExplanation: string;
    memoryTip: string;
  }
>;

function normalizeWord(raw: string) {
  const trimmed = raw.trim();
  const match = trimmed.match(/[A-Za-z]+/);
  const token = match ? match[0] : trimmed;
  return token.toLowerCase();
}

function safeText(s: unknown) {
  return typeof s === "string" ? s : "";
}

function uniqNonEmpty(arr: string[]) {
  const out = new Set<string>();
  for (const x of arr) {
    const t = x.trim();
    if (t) out.add(t);
  }
  return Array.from(out).slice(0, 12);
}

function punctuationClean(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function dictionaryEntryToOutput(args: {
  word: string;
  entry: any;
}): Output | null {
  const entry = args.entry;
  const meanings = Array.isArray(entry?.meanings) ? entry.meanings : [];
  const firstMeaning = meanings[0];
  const definitions = Array.isArray(firstMeaning?.definitions)
    ? firstMeaning.definitions
    : [];
  const firstDef = definitions[0];

  const definition = safeText(firstDef?.definition).trim();
  if (!definition) return null;

  const partOfSpeech = safeText(firstMeaning?.partOfSpeech).trim();

  const pronunciationCandidates: string[] = Array.isArray(entry?.phonetics)
    ? entry.phonetics
        .map((p: any) => safeText(p?.text))
        .filter((x: string) => x.trim().length > 0)
    : [];

  const pronunciation = pronunciationCandidates[0] ?? "";

  const synonymsRaw: string[] = Array.isArray(firstDef?.synonyms)
    ? firstDef.synonyms
    : [];
  const synonyms = uniqNonEmpty(synonymsRaw);

  // dictionaryapi.dev returns `example` (singular) on definitions; normalize to `examples`
  const example = safeText(firstDef?.example).trim();
  const examples = example ? [example] : [];

  const memoryTip = example
    ? `Remember it by connecting the definition to the example: ${punctuationClean(example)}`
    : `Associate “${args.word}” with this definition: ${punctuationClean(definition)}`;

  return outputSchema.parse({
    word: args.word,
    definition,
    partOfSpeech,
    pronunciation,
    synonyms,
    examples,
    satExplanation: "",
    memoryTip,
    source: "dictionary",
    cached: false,
  });
}

async function enrichWithAI(args: {
  base: Output;
  context?: string;
}): Promise<Output> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return args.base;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are a SAT vocabulary tutor. You ONLY enrich the meaning using the provided dictionary definition. Do NOT alter or replace the definition. Return JSON only.",
            },
            {
              role: "user",
              content: [
                "Return ONLY valid JSON with keys:",
                "satExplanation (string), memoryTip (string), easierDefinition (string), additionalExample (string).",
                "Do not include markdown.",
                "",
                `Word: ${args.base.word}`,
                `Definition: ${args.base.definition}`,
                args.context ? `Context: ${args.context}` : "",
              ]
                .filter(Boolean)
                .join("\n"),
            },
          ],
        }),
      },
    );

    clearTimeout(timeoutId);
    if (!res.ok) return args.base;

    const json = (await res.json()) as any;
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return args.base;

    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace)
      return args.base;

    let obj: any;
    try {
      obj = JSON.parse(content.slice(firstBrace, lastBrace + 1));
    } catch {
      return args.base;
    }

    const satExplanation =
      typeof obj?.satExplanation === "string" ? obj.satExplanation.trim() : "";
    const memoryTip =
      typeof obj?.memoryTip === "string" ? obj.memoryTip.trim() : "";
    const easierDefinition =
      typeof obj?.easierDefinition === "string"
        ? obj.easierDefinition.trim()
        : "";
    const additionalExample =
      typeof obj?.additionalExample === "string"
        ? obj.additionalExample.trim()
        : "";

    const hasAny =
      !!satExplanation ||
      !!memoryTip ||
      !!easierDefinition ||
      !!additionalExample;
    if (!hasAny) return args.base;

    const baseSat = args.base.satExplanation || "";
    const nextSat =
      easierDefinition && satExplanation
        ? `${satExplanation}\n\nSimplified definition: ${easierDefinition}`.trim()
        : easierDefinition
          ? `${satExplanation || baseSat}\n\nSimplified definition: ${easierDefinition}`.trim()
          : (satExplanation || baseSat).trim();

    const nextExamples = uniqNonEmpty(
      [...args.base.examples, additionalExample].filter(Boolean),
    ).slice(0, 3);

    return outputSchema.parse({
      ...args.base,
      satExplanation: nextSat || args.base.satExplanation,
      memoryTip: memoryTip || args.base.memoryTip,
      examples: nextExamples.length ? nextExamples : args.base.examples,
      source: "ai-enriched",
      cached: false,
    });
  } catch {
    return args.base;
  }
}

async function readPersistentCache(
  normalizedWord: string,
): Promise<Output | null> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from(WORD_MEANING_CACHE_TABLE)
      .select(WORD_MEANING_CACHE_PAYLOAD_FIELD)
      .eq("word", normalizedWord)
      .limit(1)
      .single();

    if (error || !data) return null;
    const payload = (data as any)?.[WORD_MEANING_CACHE_PAYLOAD_FIELD];
    if (!payload) return null;

    const parsed = outputSchema.safeParse(payload);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writePersistentCache(
  normalizedWord: string,
  value: Output,
): Promise<void> {
  try {
    if (!value.definition?.trim()) return;

    await (supabaseAdmin as any).from(WORD_MEANING_CACHE_TABLE).upsert({
      word: normalizedWord,
      payload: value,
      source: value.source,
      cached: true,
    });
  } catch {
    // ignore
  }
}

function offlineSatFor(lower: string): Output | null {
  const hit = OFFLINE_SAT_DICT[lower];
  if (!hit) return null;

  return outputSchema.parse({
    word: lower,
    definition: hit.definition,
    partOfSpeech: hit.partOfSpeech,
    pronunciation: hit.pronunciation,
    synonyms: uniqNonEmpty(hit.synonyms),
    examples: (hit.examples ?? []).slice(0, 3),
    satExplanation: hit.satExplanation,
    memoryTip: hit.memoryTip,
    source: "offline-sat-dict",
    cached: false,
  });
}

export const getWordMeaning = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<Output> => {
    const normalized = normalizeWord(data.word);

    if (!normalized) {
      return outputSchema.parse({
        word: "",
        definition: "Meaning unavailable.",
        partOfSpeech: "",
        pronunciation: "",
        synonyms: [],
        examples: [],
        satExplanation: "",
        memoryTip: "",
        source: "invalid-input",
        cached: false,
      });
    }

    const inFlight = IN_FLIGHT.get(normalized);
    if (inFlight) return inFlight;

    const cachedMem = MEMORY_CACHE.get(normalized);
    if (cachedMem) {
      return outputSchema.parse({
        ...cachedMem,
        cached: true,
        source: "cache",
      });
    }

    const promise = (async (): Promise<Output> => {
      // 1) persistent cache
      const persistent = await readPersistentCache(normalized);
      if (persistent) {
        const next = outputSchema.parse({
          ...persistent,
          cached: true,
          source: persistent.source || "cache",
        });
        MEMORY_CACHE.set(normalized, next);
        return next;
      }

      // 2) DictionaryAPI primary
      const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`;
      let dictOut: Output | null = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch(apiUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const json = (await res.json()) as unknown;
          const arr = Array.isArray(json) ? json : [];
          const entry = arr[0] as any;
          if (entry)
            dictOut = dictionaryEntryToOutput({ word: normalized, entry });
        }
      } catch {
        // fall through
      }

      // 3) secondary free provider (lightweight fallback)
      // TODO: swap this with a true secondary provider once identified for consistent schema.
      if (!dictOut) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10_000);

          const res = await fetch(apiUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (res.ok) {
            const json = (await res.json()) as unknown;
            const arr = Array.isArray(json) ? json : [];
            const entry = arr[0] as any;
            if (entry)
              dictOut = dictionaryEntryToOutput({ word: normalized, entry });
          }
        } catch {
          // ignore secondary errors
        }
      }

      if (dictOut) {
        const enriched = await enrichWithAI({
          base: dictOut,
          context: data.context,
        });
        await writePersistentCache(normalized, enriched);
        MEMORY_CACHE.set(normalized, enriched);
        return outputSchema.parse({
          ...enriched,
          cached: false,
          source: enriched.source || "dictionary",
        });
      }

      // 4) offline SAT fallback
      const offline = offlineSatFor(normalized);
      if (offline) {
        await writePersistentCache(normalized, offline);
        MEMORY_CACHE.set(normalized, offline);
        return offline;
      }

      // 5) final safety
      return outputSchema.parse({
        word: normalized,
        definition: `Meaning unavailable offline for “${normalized}”.`,
        partOfSpeech: "",
        pronunciation: "",
        synonyms: [],
        examples: [],
        satExplanation: "",
        memoryTip: "",
        source: "offline-sat-dict-miss",
        cached: false,
      });
    })();

    IN_FLIGHT.set(normalized, promise);
    try {
      return await promise;
    } finally {
      IN_FLIGHT.delete(normalized);
    }
  });
