// Browser-side PDF extraction + heuristic SAT question parser.
// pdfjs-dist runs entirely in the browser. No OCR, no math rendering — admin
// is expected to fix mistakes in the editor.

import type { Question } from "./test-data";
import { parseSATStructuredQuestionBankExport } from "./sat-structured-parser";
import { BANK_TAXONOMY } from "./bank-taxonomy";

// Configure worker via CDN to avoid bundling issues.
async function loadPdfjs(): Promise<any> {
  const pdfjsMod = await import("pdfjs-dist");
  const pdfjs = pdfjsMod as any;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Reconstruct lines from text items using their y position.
    // Tolerance increased from 3 to 6 to handle PDFs where same-line
    // items have slightly different y-coordinates (e.g. bold/regular mixed).
    const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
    for (const it of content.items as Array<{
      str: string;
      transform: number[];
    }>) {
      if (!it.str) continue;
      const x = it.transform[4];
      const y = Math.round(it.transform[5]);
      let line = lines.find((l) => Math.abs(l.y - y) < 6);
      if (!line) {
        line = { y, parts: [] };
        lines.push(line);
      }
      line.parts.push({ x, str: it.str });
    }
    lines.sort((a, b) => b.y - a.y);
    const pageText = lines
      .map((l) =>
        l.parts
          .sort((a, b) => a.x - b.x)
          .map((p) => p.str)
          .join(" "),
      )
      .join("\n");
    pages.push(pageText);
  }
  return pages.join("\n\n");
}

const questionStartRegex = /(?:^|\n)\s*(\d{1,3})[\.)][\s]+/g;

export function chunkTextForQuestionExtraction(
  raw: string,
  opts?: { questionsPerChunk?: number; maxCharsPerChunk?: number },
): string[] {
  const questionsPerChunk = opts?.questionsPerChunk ?? 50;
  const maxCharsPerChunk = opts?.maxCharsPerChunk ?? 18000;

  const text = raw.replace(/\r/g, "").replace(/[ \t]+/g, " ");

  const indices: number[] = [];
  let m: RegExpExecArray | null;

  questionStartRegex.lastIndex = 0;
  while ((m = questionStartRegex.exec(text)) !== null) {
    indices.push(m.index);
  }

  if (indices.length < 2) {
    const altRegex = /(?:^|\n)\s*(Question(?:\s+ID)?\s*[:\s])/gi;
    let altMatch: RegExpExecArray | null;
    while ((altMatch = altRegex.exec(text)) !== null) {
      indices.push(altMatch.index);
    }
  }

  if (indices.length < 2) return [text.trim()];

  const chunks: string[] = [];
  let current = "";
  let currentQCount = 0;

  for (let i = 0; i < indices.length; i++) {
    const start = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1] : text.length;
    const qBody = text.slice(start, end).trim();
    if (!qBody) continue;

    const projected = current
      ? current.length + 2 + qBody.length
      : qBody.length;
    const shouldFlushByCount = currentQCount >= questionsPerChunk;
    const shouldFlushByChars = projected > maxCharsPerChunk;

    if (current && (shouldFlushByCount || shouldFlushByChars)) {
      chunks.push(current);
      current = "";
      currentQCount = 0;
    }

    current = current ? `${current}\n\n${qBody}` : qBody;
    currentQCount++;
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Scans text for a separate answer-key section such as:
 *   1. A   2. C   3. B   4. D
 * or:
 *   1) A   2) B   3) C
 * Returns a Map from question number → correct letter.
 * Only entries with clear number+letter pairs are added.
 */
export function extractAnswerKey(text: string): Map<number, string> {
  const result = new Map<number, string>();
  // Match: number followed by . or ) then optional whitespace then A-D
  const pattern = /(\d{1,3})[.)]\s*([A-D])(?:\s|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const num = parseInt(m[1], 10);
    const letter = m[2].toUpperCase();
    // First occurrence wins (answer key usually comes after questions)
    if (!result.has(num)) {
      result.set(num, letter);
    }
  }
  return result;
}

function normalizeQuestionBankMetadata(
  metaBlock: string,
  defaultModule: "rw" | "math",
) {
  const meta: {
    domain?: string;
    skill?: string;
    difficulty?: string;
    module?: "rw" | "math";
    questionType?: string;
  } = {};

  const lines = metaBlock
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return { module: defaultModule };

  // ── NEW: Handle single-line table-header format ──────────────────────────
  // College Board PDFs often extract as:
  //   Line 0: "Assessment Test Domain Skill Difficulty"
  //   Line 1: "SAT Reading and Writing Standard English Conventions Boundaries Hard"
  // Detect by checking if the first line consists only of metadata keywords.
  const metaHeaderWords = /^((?:(?:Assessment|Test|Domain|Skill|Difficulty)\s*){2,})$/i;
  if (lines.length >= 2 && metaHeaderWords.test(lines[0])) {
    const headers = lines[0].split(/\s+/).map((h) => h.toLowerCase());
    // Value line may be split across lines[1] and lines[2]
    const valueLine = lines.slice(1, 4).join(" ").replace(/\s+/g, " ").trim();
    const tokens = valueLine.split(/\s+/);
    const difficultyRe = /^(easy|medium|hard)$/i;

    // Pull difficulty from the end
    let diffIdx = tokens.length - 1;
    while (diffIdx >= 0 && !difficultyRe.test(tokens[diffIdx])) diffIdx--;
    if (diffIdx >= 0) {
      meta.difficulty = tokens[diffIdx].toLowerCase();
    }
    const coreTokens = tokens.slice(0, diffIdx >= 0 ? diffIdx : undefined);

    // Detect module from Assessment/Test
    let cursor = 0;
    if (headers.includes("assessment") && /^SAT$/i.test(coreTokens[0])) {
      cursor = 1; // skip "SAT"
    }
    if (headers.includes("test")) {
      if (/^math$/i.test(coreTokens[cursor])) {
        meta.module = "math";
        cursor++;
      } else if (
        /^reading$/i.test(coreTokens[cursor]) &&
        /^and$/i.test(coreTokens[cursor + 1]) &&
        /^writing$/i.test(coreTokens[cursor + 2])
      ) {
        meta.module = "rw";
        cursor += 3;
      } else {
        // unknown test, skip 1 token
        cursor++;
      }
    }

    const remaining = coreTokens.slice(cursor);
    const hasD = headers.includes("domain");
    const hasS = headers.includes("skill");
    if (hasD && hasS && remaining.length >= 2) {
      // Use taxonomy to find the best split point between domain and skill.
      // Try every possible split and score against known names.
      const section = meta.module === "math" ? "MATH" : "RW";
      const taxonomy = BANK_TAXONOMY[section] ?? BANK_TAXONOMY.RW;
      const allDomainNames = taxonomy.map((d) => d.name.toLowerCase());
      const allSkillNames = taxonomy.flatMap((d) =>
        d.skills.map((s) => s.name.toLowerCase()),
      );

      let bestSplit = Math.max(1, Math.floor(remaining.length / 2));
      let bestScore = -1;

      for (let splitAt = 1; splitAt < remaining.length; splitAt++) {
        const domCandidate = remaining.slice(0, splitAt).join(" ").toLowerCase();
        const sklCandidate = remaining.slice(splitAt).join(" ").toLowerCase();

        let score = 0;
        // Exact match gets highest score
        if (allDomainNames.includes(domCandidate)) score += 10;
        if (allSkillNames.includes(sklCandidate)) score += 10;
        // Substring/contains match
        if (
          !allDomainNames.includes(domCandidate) &&
          allDomainNames.some(
            (d) => d.includes(domCandidate) || domCandidate.includes(d),
          )
        )
          score += 5;
        if (
          !allSkillNames.includes(sklCandidate) &&
          allSkillNames.some(
            (s) => s.includes(sklCandidate) || sklCandidate.includes(s),
          )
        )
          score += 5;

        if (score > bestScore) {
          bestScore = score;
          bestSplit = splitAt;
        }
      }

      meta.domain = remaining.slice(0, bestSplit).join(" ");
      meta.skill = remaining.slice(bestSplit).join(" ");
    } else if (hasD) {
      meta.domain = remaining.join(" ");
    } else if (hasS) {
      meta.skill = remaining.join(" ");
    }

    if (!meta.module) meta.module = defaultModule;
    return meta;
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Try to parse as table format first (Assessment | Test | Domain | Skill | Difficulty)
  // followed by: SAT | Reading and Writing | ... | ... | Medium
  if (lines.length >= 2) {
    const firstLine = lines[0];
    const secondLine = lines[1];

    // Check if first line looks like a header (contains common metadata keys)
    const headerHasKeys = /assessment|test|domain|skill|difficulty|type/i.test(
      firstLine,
    );

    if (headerHasKeys) {
      // Split by multiple spaces, pipes, or tabs (table delimiters)
      const headers = firstLine
        .split(/[\s|]+/)
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);
      const values = secondLine
        .split(/[\s|]+/)
        .map((v) => v.trim())
        .filter(Boolean);

      // Merge multi-word values back (e.g., "Reading and Writing", "Standard English Conventions")
      // If we have fewer values than headers after split, try pipe or tab split
      if (values.length < headers.length) {
        const headerMatch = firstLine.match(/\w+[\s&]*\w*/g);
        const valueMatch =
          secondLine.match(/[^\t\|]+/g) || secondLine.match(/\S+(?:\s+\S+)*/g);

        if (headerMatch && valueMatch) {
          for (
            let i = 0;
            i < Math.min(headerMatch.length, valueMatch.length);
            i++
          ) {
            const header = headerMatch[i]?.toLowerCase() || "";
            const value = valueMatch[i]?.trim() || "";

            if (header.includes("domain")) {
              meta.domain = value;
            } else if (header.includes("skill")) {
              meta.skill = value;
            } else if (header.includes("difficulty")) {
              meta.difficulty = value.toLowerCase();
            } else if (
              header.includes("test") ||
              header.includes("assessment")
            ) {
              if (/math/i.test(value)) {
                meta.module = "math";
              } else if (/reading|writing|rw/i.test(value)) {
                meta.module = "rw";
              }
            } else if (header.includes("type")) {
              meta.questionType = value;
            }
          }
        }
      } else {
        // Standard column matching
        for (let i = 0; i < headers.length && i < values.length; i++) {
          const header = headers[i];
          const value = values[i];

          if (!value) continue;

          if (header.includes("domain")) {
            meta.domain = value;
          } else if (header.includes("skill")) {
            meta.skill = value;
          } else if (header.includes("difficulty")) {
            meta.difficulty = value.toLowerCase();
          } else if (header.includes("test") || header.includes("assessment")) {
            if (/math/i.test(value)) {
              meta.module = "math";
            } else if (/reading|writing|rw/i.test(value)) {
              meta.module = "rw";
            }
          } else if (header.includes("type")) {
            meta.questionType = value;
          }
        }
      }
    }
  }

  // Fall back to key:value format parsing
  for (const line of lines) {
    const m = line.match(
      /^(Assessment|Test|Domain|Skill|Difficulty|Question\s+Type|Type)\s*[:\-]?\s*(.+)$/i,
    );
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();

    if (key === "domain") {
      meta.domain = value;
    } else if (key === "skill") {
      meta.skill = value;
    } else if (key === "difficulty") {
      meta.difficulty = value.toLowerCase();
    } else if (key === "question type" || key === "type") {
      meta.questionType = value;
    } else if (key === "test" || key === "assessment") {
      if (/math/i.test(value)) {
        meta.module = "math";
      } else if (/reading|writing|rw|reading\s*&\s*writing/i.test(value)) {
        meta.module = "rw";
      }
    }
  }

  if (!meta.module) {
    meta.module = defaultModule;
  }

  return meta;
}

function detectQuestionType(
  prompt: string,
  skill?: string,
): string | undefined {
  const lowerPrompt = prompt.toLowerCase();
  const lowerSkill = skill?.toLowerCase() || "";

  // Words in context
  if (lowerPrompt.includes("word") || lowerSkill.includes("words in context")) {
    return "words in context";
  }

  // Grammar/syntax
  if (
    lowerSkill.includes("grammar") ||
    lowerSkill.includes("syntax") ||
    lowerSkill.includes("pronouns")
  ) {
    return "grammar";
  }

  // Reading comprehension
  if (lowerSkill.includes("reading") || lowerPrompt.includes("passage")) {
    return "reading comprehension";
  }

  // Algebra
  if (lowerSkill.includes("algebra") || lowerSkill.includes("equations")) {
    return "algebra";
  }

  // Geometry
  if (
    lowerSkill.includes("geometry") ||
    lowerSkill.includes("circle") ||
    lowerSkill.includes("triangle")
  ) {
    return "geometry";
  }

  // Trigonometry
  if (
    lowerSkill.includes("trigonometry") ||
    lowerSkill.includes("sine") ||
    lowerSkill.includes("cosine")
  ) {
    return "trigonometry";
  }

  return undefined;
}

function extractBankQuestionChoices(text: string) {
  const matches: { letter: string; text: string; pos: number }[] = [];
  const choiceRegex =
    /(?:^|\n)\s*([A-D])\s*[\.)\-:]\s*([^\n]+(?:\n(?!\s*[A-D]\s*[\.)\-:])[^\n]+)*)/gi;
  let m: RegExpExecArray | null;
  while ((m = choiceRegex.exec(text)) !== null) {
    matches.push({
      letter: m[1].toUpperCase(),
      text: m[2].trim().replace(/\s+/g, " "),
      pos: m.index,
    });
  }
  return matches;
}

function extractBankQuestionCorrectAnswer(text: string) {
  const correctAnswerMatch = text.match(/Correct\s+Answer\s*[:\-]?\s*([A-D])/i);
  if (correctAnswerMatch) return correctAnswerMatch[1].toUpperCase();

  const answerLetterMatch = text.match(/(?:^|\n)\s*Answer\s*[:\-]?\s*([A-D])/i);
  if (answerLetterMatch) return answerLetterMatch[1].toUpperCase();

  return undefined;
}

export function parseQuestionBankExport(
  raw: string,
  defaultModule: "rw" | "math" = "rw",
): Question[] {
  const text = raw.replace(/\r/g, "");

  // Split by "Question ID:" which is the consistent marker in bank exports
  const questionIdRegex = /Question\s+ID\s*[:\-]?\s*([^\n]+)/gi;
  const blocks: string[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  questionIdRegex.lastIndex = 0;
  while ((m = questionIdRegex.exec(text)) !== null) {
    if (lastIndex > 0) {
      blocks.push(text.slice(lastIndex, m.index));
    }
    lastIndex = m.index;
  }
  if (lastIndex > 0) {
    blocks.push(text.slice(lastIndex));
  }

  // If no "Question ID:" found, fall back to old regex
  if (blocks.length === 0) {
    const blockRegex =
      /(?:^|\n)((?:Assessment|Test|Domain|Skill|Difficulty|Question\s+Type).*(?:\n[^\n]*?(?:Assessment|Test|Domain|Skill|Difficulty|Easy|Medium|Hard|SAT|Math|Reading|Writing).*)*?)\n\s*Question\b[\s\S]*?(?=(?:\n(?:Assessment|Test|Domain|Skill|Difficulty|Question)\b)|$)/gi;

    while ((m = blockRegex.exec(text)) !== null) {
      blocks.push(m[0]);
    }
  }

  const out: Question[] = [];

  for (const fullBlock of blocks) {
    if (!fullBlock.trim()) continue;

    // Extract metadata block - everything before the first choice line (A., B., etc.)
    const firstChoiceIndex = fullBlock.search(/(?:^|\n)\s*[A-D]\s*[\.)\-:]/i);
    const metadataAndQuestion =
      firstChoiceIndex >= 0
        ? fullBlock.slice(0, firstChoiceIndex).trim()
        : fullBlock;
    const choicesBlock =
      firstChoiceIndex >= 0 ? fullBlock.slice(firstChoiceIndex).trim() : "";

    // Split metadata and question prompt
    // Metadata typically ends at "Question" or first paragraph of content
    const metaEndMatch = metadataAndQuestion.match(
      /^[\s\S]*?(?:Question|Which|What|Why|How|This|If|The|A\s+study)\b/i,
    );
    let metaBlock = "";
    let promptText = "";

    if (metaEndMatch) {
      const metaEndIndex = metaEndMatch[0].lastIndexOf("\n");
      if (metaEndIndex > 0) {
        metaBlock = metadataAndQuestion.slice(0, metaEndIndex).trim();
        promptText = metadataAndQuestion.slice(metaEndIndex).trim();
      } else {
        promptText = metadataAndQuestion.trim();
      }
    } else {
      promptText = metadataAndQuestion.trim();
    }

    // Remove "Question" header if present
    promptText = promptText.replace(/^\s*Question\s*\n/i, "").trim();
    if (!promptText && choicesBlock) {
      promptText =
        choicesBlock.split(/\n\s*[A-D]\s*[\.)\-:]/i)[0]?.trim() || "";
    }

    // Strip any leaked metadata table lines from the prompt
    // (handles cases where metaBlock/prompt boundary was mis-detected)
    promptText = promptText
      // Remove labeled key:value metadata lines
      .replace(
        /^(Question\s+ID|Assessment|Test|Domain|Skill|Difficulty)\s*[:\-]\s*[^\n]*\n?/gim,
        "",
      )
      // Remove bare metadata header lines (all words are keywords)
      .replace(
        /^(?:(?:Assessment|Test|Domain|Skill|Difficulty)\s*){2,}$/gim,
        "",
      )
      // Remove lines that are purely the table value row starting with "SAT"
      .replace(/^SAT\s+(?:Reading\s+and\s+Writing|Math)\s+.+$/gim, "")
      .replace(/^\s*\n/gm, "")
      .trim();

    const metadata = normalizeQuestionBankMetadata(metaBlock, defaultModule);

    if (!promptText) continue;

    const explanationSplit = choicesBlock.split(/\n\s*Rationale\s*\n/i);
    const choicesText = explanationSplit[0].trim();
    const explanation =
      explanationSplit.length > 1
        ? explanationSplit.slice(1).join("\nRationale\n").trim()
        : "";

    const choices = extractBankQuestionChoices(choicesText);
    if (choices.length < 2) continue;

    const correctLetter =
      extractBankQuestionCorrectAnswer(fullBlock) ||
      (choices.length > 0 ? choices[0].letter : "A");
    const letters = ["A", "B", "C", "D"];
    const correct = Math.max(0, letters.indexOf(correctLetter));

    const sorted = [...choices]
      .filter((mm) => ["A", "B", "C", "D"].includes(mm.letter))
      .sort(
        (a, b) =>
          ["A", "B", "C", "D"].indexOf(a.letter) -
          ["A", "B", "C", "D"].indexOf(b.letter),
      );
    const parsedChoices = sorted.slice(0, 4).map((s) => s.text);
    if (parsedChoices.length < 2) continue;

    out.push({
      id: Date.now() + out.length,
      module: metadata.module ?? defaultModule,
      passage: "",
      prompt: promptText,
      choices: parsedChoices,
      correct,
      explanation,
      domain: metadata.domain,
      skill: metadata.skill,
      difficulty: metadata.difficulty ?? "medium",
      questionType:
        metadata.questionType || detectQuestionType(promptText, metadata.skill),
    });
  }

  return out;
}

export function parseCBQuestions(
  text: string,
  defaultModule: "rw" | "math" = "rw",
): Question[] {
  // Structured College Board export parser (heading-driven).
  try {
    const structured = parseSATStructuredQuestionBankExport(text);
    if (structured.length > 0) {
      return structured.map((q: any, idx: number) => {
        const letters = ["A", "B", "C", "D"];
        const correctIndex = letters.indexOf(q.correct as any);
        return {
          id: Date.now() + idx,
          module: /math/i.test(q.test || "") ? "math" : defaultModule,
          passage: q.passage ?? "",
          prompt: q.prompt,
          choices: q.choices,
          correct: correctIndex >= 0 ? correctIndex : 0,
          explanation: q.explanation,
          domain: q.domain,
          skill: q.skill,
          difficulty: q.difficulty,
          questionType: undefined,
        };
      });
    }
  } catch {
    // ignore and fallback
  }

  const bankQuestions = parseQuestionBankExport(text, defaultModule);
  if (bankQuestions.length > 0) {
    return bankQuestions;
  }

  const out: Question[] = [];
  let id = Date.now();

  // Split by "Question\n" or "Question \n"
  const chunks = text.split(/(?:^|\n)\s*Question\s*\n/);

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;

    // We look for parts: Prompt... Answer... Correct Answer:... Rationale...
    const answerSplit = chunk.split(/\n\s*Answer\s*\n/i);
    if (answerSplit.length < 2) continue;

    const promptText = answerSplit[0].trim();
    const remainingAfterAnswer = answerSplit.slice(1).join("\nAnswer\n");

    const correctAnswerSplit = remainingAfterAnswer.split(
      /\n\s*Correct Answer:\s*/i,
    );
    if (correctAnswerSplit.length < 2) continue;

    const choicesText = correctAnswerSplit[0].trim();
    const remainingAfterCorrect = correctAnswerSplit
      .slice(1)
      .join("\nCorrect Answer:\n");

    // The correct letter is the first character
    const correctLetterStr =
      remainingAfterCorrect.trim()[0]?.toUpperCase() || "A";

    // Rationale split
    const rationaleSplit = remainingAfterCorrect.split(/\n\s*Rationale\s*\n/i);
    const explanation =
      rationaleSplit.length > 1
        ? rationaleSplit.slice(1).join("\nRationale\n").trim()
        : "";

    // Parse choices A, B, C, D from choicesText
    const choiceRegex =
      /(?:^|\n)\s*([A-D])[.)]\s+([^\n]+(?:\n(?!\s*[A-D][.)])[^\n]+)*)/g;
    const matches: { letter: string; text: string }[] = [];
    let cm: RegExpExecArray | null;
    while ((cm = choiceRegex.exec(choicesText)) !== null) {
      matches.push({ letter: cm[1], text: cm[2].trim() });
    }

    if (matches.length < 2) continue;

    const letters = ["A", "B", "C", "D"];
    const correct = Math.max(0, letters.indexOf(correctLetterStr));

    const sorted = [...matches]
      .filter((mm) => letters.includes(mm.letter))
      .sort((a, b) => letters.indexOf(a.letter) - letters.indexOf(b.letter));

    const choices = sorted.slice(0, 4).map((s) => s.text);
    if (choices.length < 2) continue;

    out.push({
      id: id++,
      module: defaultModule,
      prompt: promptText,
      choices,
      correct,
      explanation,
    });
  }

  return out;
}

// Very forgiving SAT-style parser. Looks for:
//   1. <prompt text...>
//   A) ...  or  (A) ...  or  A. ...
//   B) ...
//   C) ...
//   D) ...
// Optionally an "Answer: X" line afterwards.
export function parseSatQuestions(
  raw: string,
  defaultModule: "rw" | "math" = "rw",
): Question[] {
  // Normalize whitespace
  const text = raw.replace(/\r/g, "").replace(/[ \t]+/g, " ");

  // 1. Try to parse using the strict College Board / question-bank export format
  const cbQuestions = parseCBQuestions(text, defaultModule);
  if (cbQuestions.length > 0) {
    return cbQuestions;
  }

  // Extract answer key if present (from a separate answer section)
  const answerKey = extractAnswerKey(text);

  // Split into question chunks on a leading "<digits>. " or "<digits>) " at line start.
  const chunks: { num: number; body: string }[] = [];
  const splitRegex = /(?:^|\n)\s*(\d{1,3})[.)]\s+/g;
  let m: RegExpExecArray | null;
  const indices: { num: number; start: number }[] = [];
  while ((m = splitRegex.exec(text)) !== null) {
    indices.push({ num: parseInt(m[1], 10), start: m.index + m[0].length });
  }
  for (let i = 0; i < indices.length; i++) {
    const end = i + 1 < indices.length ? indices[i + 1].start - 1 : text.length;
    chunks.push({
      num: indices[i].num,
      body: text.slice(indices[i].start, end).trim(),
    });
  }

  // Improved choice regex: handles A. A) (A) formats
  const choiceRegex =
    /(?:^|\n)\s*\(?([A-D])\)?[.)]\s+([^\n]+(?:\n(?![\s]*\(?[A-D]\)?[.)])[^\n]+)*)/g;

  const out: Question[] = [];
  let id = Date.now();

  for (const c of chunks) {
    const matches: { letter: string; text: string; pos: number }[] = [];
    let cm: RegExpExecArray | null;
    const re = new RegExp(choiceRegex.source, "g");
    while ((cm = re.exec(c.body)) !== null) {
      matches.push({ letter: cm[1], text: cm[2].trim(), pos: cm.index });
    }
    if (matches.length < 2) continue; // not a multiple-choice question
    const firstChoicePos = matches[0].pos;
    const prompt = c.body.slice(0, firstChoicePos).trim();
    if (!prompt) continue;

    // Look for an inline answer hint after the last choice
    const afterChoices = c.body.slice(matches[matches.length - 1].pos);
    const ansMatch = afterChoices.match(/answer\s*[:=\-]?\s*\(?([A-D])\)?/i);
    const letters = ["A", "B", "C", "D"];

    // Priority: inline answer hint > answer key table > default A
    let correctLetter: string;
    if (ansMatch) {
      correctLetter = ansMatch[1].toUpperCase();
    } else if (answerKey.has(c.num)) {
      correctLetter = answerKey.get(c.num)!;
    } else {
      correctLetter = "A";
    }

    const correct = Math.max(0, letters.indexOf(correctLetter));

    // Take first 4 choices in alphabetical order
    const sorted = [...matches]
      .filter((mm) => letters.includes(mm.letter))
      .sort((a, b) => letters.indexOf(a.letter) - letters.indexOf(b.letter));
    const choices = sorted.slice(0, 4).map((s) => s.text);
    if (choices.length < 2) continue;

    out.push({
      id: id++,
      module: defaultModule,
      prompt,
      choices,
      correct,
      explanation: "",
    });
  }
  return out;
}
