import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  chunkTextForQuestionExtraction,
  parseSatQuestions,
} from "@/lib/pdf-extract";
import { aiExtractQuestionsFromPdf } from "@/server-fns/ai-extract.functions";

const pdfImportInputSchema = z.object({
  text: z.string().min(1),
  defaultModule: z.enum(["rw", "math", "mixed"]).default("rw"),
  /** Prefer AI extraction (slower / may fail); fallback to heuristic parser. */
  mode: z.enum(["ai", "heuristic", "hybrid"]).default("hybrid"),
  /** AI extraction chunking controls */
  chunkQuestions: z.number().int().positive().default(50),
  maxCharsPerChunk: z.number().int().positive().default(18000),
  /** Sequential retry controls for failed chunks */
  maxChunkRetries: z.number().int().min(0).default(2),
});

export type PdfImportQuestion = {
  id?: number | string;
  section: "RW" | "MATH";
  domain: string;
  skill: string;
  difficulty: "easy" | "medium" | "hard" | string;
  passage: string;
  prompt: string;
  choices: [string, string, string, string];
  correct: string;
  explanation: string;
  questionType?: string;
  warnings?: string[];
};

export type PdfImportResult = {
  section: "RW" | "MATH" | "MIXED";
  questions: PdfImportQuestion[];
  warnings: string[];
};

function mapHeuristicToBankQuestions(
  qs: ReturnType<typeof parseSatQuestions>,
  _defaultModule: "rw" | "math",
): PdfImportQuestion[] {
  const warningsBase: string[] = [
    "PDF heuristic parser may have missed metadata fields.",
    "Please review and edit domain/skill/difficulty manually.",
  ];

  const sectionFor = (m: "rw" | "math") => (m === "math" ? "MATH" : "RW");

  return qs.map((q, idx) => {
    const section = sectionFor(q.module);

    const choices: [string, string, string, string] = [
      q.choices[0] ?? "",
      q.choices[1] ?? "",
      q.choices[2] ?? "",
      q.choices[3] ?? "",
    ];

    const correctIndex = typeof q.correct === "number" ? q.correct : 0;
    const correctLetters = ["A", "B", "C", "D"];
    const correct = correctLetters[Math.max(0, Math.min(3, correctIndex))];

    return {
      id: Number.isFinite(q.id) ? q.id : Date.now() + idx,
      section,
      domain: q.domain ?? "Unknown",
      skill: q.skill ?? "Unknown",
      difficulty: (q.difficulty as string | undefined) ?? "medium",
      passage: q.passage ?? "",
      prompt: q.prompt,
      choices,
      correct,
      explanation: q.explanation ?? "",
      questionType: q.questionType,
      warnings: warningsBase,
    };
  });
}

function mapAiToBankQuestions(ai: {
  section?: string;
  questions?: Array<{
    id?: number;
    module?: "rw" | "math" | string;
    passage?: string | null;
    prompt?: string;
    choices?: string[];
    correct?: number;
    explanation?: string | null;
    domain?: string;
    skill?: string;
    difficulty?: string;
    questionType?: string;
  }>;
}): { section: PdfImportResult["section"]; questions: PdfImportQuestion[] } {
  const aiQuestions = Array.isArray(ai.questions) ? ai.questions : [];

  const questions: PdfImportQuestion[] = aiQuestions
    .filter(
      (q) => q && typeof q.prompt === "string" && Array.isArray(q.choices),
    )
    .map((q, idx) => {
      const section: "RW" | "MATH" = q.module === "math" ? "MATH" : "RW";
      const correctLetters = ["A", "B", "C", "D"];
      const correct =
        correctLetters[Math.max(0, Math.min(3, Number(q.correct) || 0))];

      const choices = [
        q.choices?.[0] ?? "",
        q.choices?.[1] ?? "",
        q.choices?.[2] ?? "",
        q.choices?.[3] ?? "",
      ];

      const rawDifficulty = typeof q.difficulty === "string" ? q.difficulty.trim().toLowerCase() : "";
      return {
        id: Number.isFinite(q.id as any) ? (q.id as number) : Date.now() + idx,
        section,
        domain: (typeof q.domain === "string" ? q.domain.trim() : "Unknown") || "Unknown",
        skill: (typeof q.skill === "string" ? q.skill.trim() : "Unknown") || "Unknown",
        difficulty:
          rawDifficulty === "easy" || rawDifficulty === "medium" || rawDifficulty === "hard"
            ? rawDifficulty
            : "medium",
        passage: (typeof q.passage === "string" ? q.passage.trim() : "") as string,
        prompt: (q.prompt ?? "").toString().trim(),
        choices: choices as [string, string, string, string],
        correct,
        explanation: (typeof q.explanation === "string" ? q.explanation.trim() : "") as string,
        questionType:
          typeof q.questionType === "string" ? q.questionType.trim() : undefined,
      };
    });

  const sectionRaw = (ai.section ?? "").toLowerCase();
  const section: PdfImportResult["section"] =
    sectionRaw === "math" ? "MATH" : sectionRaw === "mixed" ? "MIXED" : "RW";

  return { section, questions };
}

async function extractChunkWithAiOrHeuristic(opts: {
  chunkText: string;
  chunkIndex: number;
  aiEnabled: boolean;
  mode: "ai" | "heuristic" | "hybrid";
  effectiveDefault: "rw" | "math";
  maxChunkRetries: number;
}): Promise<{
  aiUsed: boolean;
  mapped: PdfImportQuestion[];
  warning?: string;
}> {
  const {
    chunkText,
    chunkIndex,
    aiEnabled,
    mode,
    effectiveDefault,
    maxChunkRetries,
  } = opts;

  // Heuristic-only mode
  if (!aiEnabled) {
    const qs = parseSatQuestions(chunkText, effectiveDefault);
    return {
      aiUsed: false,
      mapped: mapHeuristicToBankQuestions(qs, effectiveDefault),
    };
  }

  let lastAiError: string | undefined;
  for (let attempt = 0; attempt <= maxChunkRetries; attempt++) {
    try {
      const ai = await aiExtractQuestionsFromPdf({
        data: {
          text: chunkText,
          defaultModule: effectiveDefault,
        },
      });

      const mapped = mapAiToBankQuestions(ai as any);
      if (mapped.questions.length > 0) {
        return {
          aiUsed: true,
          mapped: mapped.questions,
        };
      }

      lastAiError = "AI returned no valid questions";
    } catch (e) {
      lastAiError = e instanceof Error ? e.message : "unknown";
    }

    if (attempt < maxChunkRetries) {
      // basic backoff
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }

  // AI failed for this chunk: fallback to heuristic unless even that yields nothing.
  const qs = parseSatQuestions(chunkText, effectiveDefault);
  const mapped = mapHeuristicToBankQuestions(qs, effectiveDefault);

  // If even heuristic is empty, we still return empty mapped; the caller can decide overall behavior.
  const warning =
    mode === "ai"
      ? `AI failed for chunk ${chunkIndex + 1} after retries (${lastAiError}); used heuristic fallback.`
      : `AI failed for chunk ${chunkIndex + 1} after retries (${lastAiError}); used heuristic fallback.`;

  return {
    aiUsed: false,
    mapped,
    warning,
  };
}

export const importQuestionsFromPdfText = createServerFn({ method: "POST" })
  .inputValidator((input) => pdfImportInputSchema.parse(input))
  .handler(async ({ data }): Promise<PdfImportResult> => {
    // IMPORTANT: never return undefined from this handler.
    const warnings: string[] = [];

    const defaultModule = data.defaultModule;
    const effectiveDefault = defaultModule === "mixed" ? "rw" : defaultModule;

    const chunks = chunkTextForQuestionExtraction(data.text, {
      questionsPerChunk: data.chunkQuestions,
      maxCharsPerChunk: data.maxCharsPerChunk,
    });

    const aiEnabled = data.mode === "ai" || data.mode === "hybrid";

    const all: PdfImportQuestion[] = [];

    // Larger PDFs (many chunks) benefit from batching so we can control request/loop cadence.
    // We still process sequentially (one chunk at a time) to avoid gateway bursts.
    const batchSize = Math.max(
      1,
      Math.min(10, Math.floor((data.chunkQuestions ?? 50) / 5)),
    );
    for (let start = 0; start < chunks.length; start += batchSize) {
      const end = Math.min(chunks.length, start + batchSize);

      for (let i = start; i < end; i++) {
        const chunkText = chunks[i];
        if (!chunkText || !chunkText.trim()) continue;

        const { mapped, warning } = await extractChunkWithAiOrHeuristic({
          chunkText,
          chunkIndex: i,
          aiEnabled,
          mode: data.mode,
          effectiveDefault,
          maxChunkRetries: data.maxChunkRetries,
        });

        if (mapped.length > 0) {
          all.push(...mapped);
          continue;
        }

        // mapped empty: still record warning if AI was attempted.
        if (warning) warnings.push(warning);
      }
    }

    if (all.length === 0) {
      // Hard failure only if absolutely nothing could be extracted.
      throw new Error("No questions detected in the PDF.");
    }

    const section: PdfImportResult["section"] =
      all.some((m) => m.section === "MATH") &&
      all.some((m) => m.section === "RW")
        ? "MIXED"
        : all.some((m) => m.section === "MATH")
          ? "MATH"
          : "RW";

    return {
      section,
      questions: all,
      warnings,
    };
  });
