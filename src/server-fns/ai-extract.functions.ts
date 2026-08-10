import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  text: z.string().min(1, "No text was extracted from the PDF."),
  defaultModule: z.enum(["rw", "math"]).default("rw"),
});

type ExtractedQuestion = {
  module: "rw" | "math";
  passage?: string;
  prompt: string;
  choices: string[];
  correct: number;
  explanation?: string;
  domain?: string;
  skill?: string;
  difficulty?: string;
  questionType?: string;
};

export type ExtractionResult = {
  section: "Math" | "RW" | "Mixed";
  questions: Array<{
    id: number;
    module: "rw" | "math";
    passage?: string;
    prompt: string;
    choices: string[];
    correct: number;
    explanation: string;
    domain?: string;
    skill?: string;
    difficulty?: string;
    questionType?: string;
  }>;
};

function compactPdfText(str: string): string {
  return str
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+\./g, ".")
    .replace(/\s+([,;:!?])/g, "$1")
    .trim();
}

function parseJsonCandidate(
  candidate: unknown,
): Record<string, unknown> | null {
  if (candidate === undefined || candidate === null) {
    return null;
  }

  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (!trimmed) {
      return null;
    }

    const repaired = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(repaired);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      const firstObject = repaired.match(/\{[\s\S]*\}/);
      if (!firstObject) {
        return null;
      }
      try {
        const parsed = JSON.parse(firstObject[0]);
        return typeof parsed === "object" && parsed !== null
          ? (parsed as Record<string, unknown>)
          : null;
      } catch {
        return null;
      }
    }
  }

  if (typeof candidate === "object") {
    return candidate as Record<string, unknown>;
  }

  return null;
}

function fallbackExtractBankQuestions(
  text: string,
  defaultSection: "rw" | "math",
): { section: ExtractionResult["section"]; questions: ExtractedQuestion[] } {
  const normalizedText = compactPdfText(text);
  const blocks = normalizedText
    .split(/(?=\n?\s*Question\s+ID\s*:\s*[A-Za-z0-9-]+)/gi)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return {
      section: defaultSection === "math" ? "Math" : "RW",
      questions: [],
    };
  }

  const questions: ExtractedQuestion[] = [];

  for (const block of blocks) {
    const idMatch = block.match(/Question\s+ID\s*:\s*([A-Za-z0-9-]+)/i);
    const stemMatch =
      block.match(
        /Question\s*(?:Stem)?\s*:\s*(.+?)(?=\n\s*(?:A\.|B\.|C\.|D\.|Correct\s+Answer))/is,
      ) ??
      block.match(/^\s*(.+?)(?=\n\s*(?:A\.|B\.|C\.|D\.|Correct\s+Answer))/is);

    const choiceMatches = [
      ...block.matchAll(
        /\b([A-D])\s*[.):-]\s*(.+?)(?=(?:\n\s*[A-D]\s*[.):-]|\n\s*Correct\s+Answer|$))/gis,
      ),
    ];
    const choices = choiceMatches
      .map((match) =>
        match[2].replace(/\s+/g, " ").replace(/\s+\./g, ".").trim(),
      )
      .slice(0, 4);

    const correctMatch = block.match(/Correct\s+Answer\s*:\s*([A-D])/i);
    const correct = correctMatch
      ? "ABCD".indexOf(correctMatch[1].toUpperCase())
      : 0;
    const prompt = (stemMatch?.[1] ?? idMatch?.[1] ?? "")
      .replace(/\s+/g, " ")
      .replace(/\s+\./g, ".")
      .trim();

    if (prompt && choices.length >= 2) {
      questions.push({
        module: defaultSection,
        prompt,
        choices,
        correct: Math.max(0, Math.min(correct, 3)),
        explanation: "",
      });
    }
  }

  return {
    section: defaultSection === "math" ? "Math" : "RW",
    questions,
  };
}

function toExtractionResult(
  payload: unknown,
  defaultModule: "rw" | "math",
): { section: ExtractionResult["section"]; questions: ExtractedQuestion[] } {
  const parsed = parseJsonCandidate(payload);
  if (!parsed) {
    return fallbackExtractBankQuestions("", defaultModule);
  }

  const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
  const normalizedQuestions = rawQuestions
    .filter(
      (q): q is Record<string, unknown> => Boolean(q) && typeof q === "object",
    )
    .map((q) => {
      const prompt = typeof q.prompt === "string" ? q.prompt.trim() : "";
      const choices = Array.isArray(q.choices)
        ? q.choices.slice(0, 4).map((choice) => String(choice).trim())
        : [];
      const correct = typeof q.correct === "number" ? q.correct : 0;
      const moduleValue =
        typeof q.module === "string" ? q.module.toLowerCase() : defaultModule;

      return {
        module: moduleValue === "math" ? "math" : "rw",
        passage: typeof q.passage === "string" ? q.passage.trim() : undefined,
        prompt,
        choices,
        correct: Math.max(0, Math.min(correct, 3)),
        explanation:
          typeof q.explanation === "string" ? q.explanation.trim() : "",
        domain: typeof q.domain === "string" ? q.domain.trim() : undefined,
        skill: typeof q.skill === "string" ? q.skill.trim() : undefined,
        difficulty:
          typeof q.difficulty === "string"
            ? q.difficulty.trim().toLowerCase()
            : undefined,
        questionType:
          typeof q.questionType === "string"
            ? q.questionType.trim()
            : undefined,
      } satisfies ExtractedQuestion;
    })
    .filter((q) => q.prompt && q.choices.length >= 2);

  const sectionRaw =
    typeof parsed.section === "string" ? parsed.section.toLowerCase() : "";
  const section: ExtractionResult["section"] =
    sectionRaw === "math" ? "Math" : sectionRaw === "mixed" ? "Mixed" : "RW";

  return { section, questions: normalizedQuestions };
}

export const aiExtractQuestionsFromPdf = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<ExtractionResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      console.warn(
        "[ai-extract] LOVABLE_API_KEY not set; skipping AI extraction.",
      );
      return { section: "RW" as const, questions: [] };
    }

    const trimmed = data.text.trim();
    if (!trimmed) {
      throw new Error(
        "Empty extraction chunk. Scanned PDFs are not supported.",
      );
    }

    const defaultModule = data.defaultModule === "math" ? "math" : "rw";
    const compactedInput = compactPdfText(trimmed);
    const cappedInput =
      compactedInput.length > 200000
        ? `${compactedInput.slice(0, 200000)}\n\n[truncated for model input]`
        : compactedInput;

    const systemPrompt = `You are extracting SAT-style questions from a PDF bank text chunk.
Return ONLY valid JSON with this exact shape:
{"section":"Math"|"RW"|"Mixed","questions":[{"module":"rw"|"math","passage":"","prompt":"","choices":["A","B","C","D"],"correct":0,"explanation":"","domain":"","skill":"","difficulty":"","questionType":""}]}

Rules:
- Use the same order as the source text.
- Each question must have 4 plain-text choices in order.
- "module" is "rw" for Reading & Writing or "math" for Math. Default to "${defaultModule}" if ambiguous.
- "passage" should contain shared context only when present; otherwise use an empty string.
- "prompt" must be only the question stem, without choice letters or answer text.
- "correct" is the 0-based index of the correct answer. Use 0 if unknown.
- If available, also extract question metadata: "domain", "skill", "difficulty", and "questionType".
- If metadata is not available for a question, return an empty string for that field rather than omitting it.
- Use lowercase for difficulty values such as "easy", "medium", or "hard" when present.
- For "questionType", use standard SAT categories like "words in context", "grammar", "reading comprehension", "algebra", "geometry", "trigonometry", etc.
- If the PDF row contains Assessment/Test/Domain/Skill/Difficulty information, map those values into the corresponding metadata fields for each question.
- Extract every question you can find, and preserve the original ordering.
- Set "section" to "Math", "RW", or "Mixed" based on the content.
- Do not wrap the output in markdown or code fences.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          max_tokens: 32000,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Extract data from this chunk:\n\n${cappedInput}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("AI extraction timed out. Please try again.");
      }
      throw error;
    }
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text();
      console.error("AI extraction error", res.status, body);
      throw new Error(
        res.status === 429
          ? "AI rate limit exceeded. Please try again in a minute."
          : res.status === 402
            ? "AI credits exhausted. Add credits in Settings → Workspace → Usage."
            : `AI parsing failed (${res.status}).`,
      );
    }

    const json = await res.json();
    const rawAiPreview = (() => {
      try {
        return JSON.stringify(json).slice(0, 2000);
      } catch {
        return "<unserializable json>";
      }
    })();

    const messageContent = json?.choices?.[0]?.message?.content;
    const toolArguments =
      json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

    const parsedByContent = parseJsonCandidate(messageContent);
    const parsedByTool = parseJsonCandidate(toolArguments);

    const parsedAny = parsedByContent ?? parsedByTool;

    let parsedResult = toExtractionResult(parsedAny, defaultModule);

    if (parsedResult.questions.length === 0) {
      const fallbackResult = fallbackExtractBankQuestions(
        trimmed,
        defaultModule,
      );
      parsedResult = fallbackResult;
    }

    if (parsedResult.questions.length === 0) {
      console.error(
        "AI returned no structured payload. raw preview:",
        rawAiPreview,
      );
      throw new Error("no valid questions detected");
    }

    let id = Date.now();
    const questions = parsedResult.questions.map((q) => ({
      id: id++,
      module: q.module === "math" ? ("math" as const) : ("rw" as const),
      passage: q.passage?.trim() || undefined,
      prompt: q.prompt.trim(),
      choices: q.choices.slice(0, 4).map((choice) => String(choice).trim()),
      correct: Math.max(0, Math.min(Number(q.correct) || 0, 3)),
      explanation: (q.explanation ?? "").trim(),
      domain: typeof q.domain === "string" ? q.domain.trim() : undefined,
      skill: typeof q.skill === "string" ? q.skill.trim() : undefined,
      difficulty:
        typeof q.difficulty === "string" ? q.difficulty.trim().toLowerCase() : undefined,
      questionType:
        typeof q.questionType === "string" ? q.questionType.trim() : undefined,
    }));

    return { section: parsedResult.section, questions };
  });
