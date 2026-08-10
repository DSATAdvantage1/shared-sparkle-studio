// Structured SAT question-bank export parser.
// This parser is heading-driven (Question ID / Assessment / Test / Domain / Skill / Difficulty / Question / Answer / Correct Answer / Rationale)
// and prevents metadata from leaking into passage/prompt/choices/explanation.

export type SatSectionedQuestion = {
  questionId: string;
  assessment: string;
  test: string;
  domain: string;
  skill: string;
  difficulty: string;
  passage: string;
  prompt: string;
  choices: [string, string, string, string];
  correct: "A" | "B" | "C" | "D" | string;
  explanation: string;
};

const QUESTION_ID_BLOCK_RE = /\n?\s*Question\s+ID\s*[:\-]?\s*[^\n]+/gi;

function normHeading(h: string) {
  return h.toLowerCase().replace(/\s+/g, " ").trim();
}

const letterOrder = ["A", "B", "C", "D"] as const;

function normalizeBrokenPdfMetadataText(raw: string): string {
  return (raw || "")
    .replace(/\bSA\s+T\b/gi, "SAT")
    .replace(/\bS\s+A\s+T\b/gi, "SAT")
    .replace(/\bT\s+est\b/gi, "Test")
    .replace(/\bD\s+omain\b/gi, "Domain")
    .replace(/\bS\s+kill\b/gi, "Skill")
    .replace(/\bD\s+ifficulty\b/gi, "Difficulty")
    .replace(/\bQ\s+uestion\s+ID\b/gi, "Question ID")
    .replace(/\bC\s+orrect\s+Answer\b/gi, "Correct Answer")
    .replace(/\bR\s+ationale\b/gi, "Rationale")
    .replace(/\bA\s+ssessment\b/gi, "Assessment")
    .replace(/\bI\s+n\s+ferences\b/gi, "Inferences")
    .replace(/\bC\s+entr\s+al\s+Ideas\s+and\s+Details\b/gi, "Central Ideas and Details")
    .replace(/\bI\s+nformation\s+and\s+Ideas\b/gi, "Information and Ideas")
    .replace(/\bS\s+tandard\s+English\s+Conventions\b/gi, "Standard English Conventions")
    .replace(/\bC\s+raft\s+and\s+Structure\b/gi, "Craft and Structure")
    .replace(/\bT\s+h\s+e\s+m\s+e\s+s\b/gi, "Themes");
}

// Metadata keywords that should never appear in prompt / choices / explanation
const metadataLeakIndicators: RegExp[] = [
  /\bquestion\s+id\b\s*[:\-]?/i,
  /\bassessment\b\s*[:\-]?/i,
  /\bcorrect\s+answer\b\s*[:\-]?/i,
  /\brationale\b\s*[:\-]?/i,
];

/**
 * The CB question bank PDF often renders the metadata as a TWO-LINE TABLE:
 *
 *   Assessment  Test        Domain              Skill                     Difficulty
 *   SAT         Math        Algebra             Linear equations          Hard
 *
 * After PDF extraction both rows are each a single line (spaces collapsed).
 * This function detects that pattern and converts it to labeled key:value lines
 * so the heading regex can find them individually.
 *
 * Also handles the single-line merged case:
 *   "Assessment Test Domain Skill Difficulty\nSAT Reading and Writing Standard English Boundaries Hard\nConventions"
 */
function normalizeMetadataTable(block: string): string {
  // Pattern: a line that contains ONLY the header keywords in some order
  const headerLineRe =
    /^((?:(?:Assessment|Test|Domain|Skill|Difficulty)\s*){2,})$/im;
  const headerLineMatch = headerLineRe.exec(block);

  if (!headerLineMatch) return block;

  const headerLine = headerLineMatch[0].trim();
  const headerStart = headerLineMatch.index;

  // Figure out which keywords are present and their order
  const headerKeywords: string[] = [];
  const headerKwRe =
    /\b(Assessment|Test|Domain|Skill|Difficulty)\b/gi;
  let kwm: RegExpExecArray | null;
  while ((kwm = headerKwRe.exec(headerLine)) !== null) {
    headerKeywords.push(kwm[1]);
  }
  if (headerKeywords.length < 2) return block;

  // The value line immediately follows the header line
  const afterHeader = block.slice(headerStart + headerLine.length).trimStart();
  // Collect lines until we hit a known heading or empty
  const valueLines: string[] = [];
  for (const ln of afterHeader.split("\n")) {
    // Stop at a known section heading
    if (
      /^\s*(Question|Answer|Correct\s+Answer|Rationale)\s*[:\-]?\s*$/i.test(ln)
    )
      break;
    // Stop if this looks like a metadata header line again
    if (headerLineRe.test(ln.trim())) break;
    valueLines.push(ln);
    // Two value lines at most (some PDFs split the row)
    if (valueLines.length >= 3) break;
  }

  const valueLine = valueLines.join(" ").replace(/\s+/g, " ").trim();
  if (!valueLine) return block;

  // Now try to map header keywords to value tokens.
  // The tricky part: "Reading and Writing" is 3 tokens for one "Test" value.
  // Strategy: use known fixed-length values to anchor the mapping.
  //   - "SAT" → Assessment
  //   - last token is Difficulty (easy|medium|hard)
  //   - remaining tokens split by keyword count
  const tokens = valueLine.split(/\s+/);
  const mapped: Record<string, string> = {};

  // Known difficulty values
  const difficultyRe = /^(easy|medium|hard)$/i;

  // Find difficulty at the end
  let diffIdx = tokens.length - 1;
  while (diffIdx >= 0 && !difficultyRe.test(tokens[diffIdx])) diffIdx--;

  if (diffIdx >= 0) {
    mapped["Difficulty"] = tokens[diffIdx];
  }

  // Check if Assessment = "SAT" is present
  let remainStart = 0;
  if (headerKeywords.includes("Assessment") && /^SAT$/i.test(tokens[0])) {
    mapped["Assessment"] = "SAT";
    remainStart = 1;
  }

  // Test column: "Reading and Writing" or "Math"
  const remainTokens = tokens.slice(
    remainStart,
    diffIdx >= 0 ? diffIdx : undefined,
  );

  if (headerKeywords.includes("Test")) {
    if (/^math$/i.test(remainTokens[0])) {
      mapped["Test"] = "Math";
      remainTokens.shift();
    } else if (
      remainTokens.length >= 3 &&
      /^reading$/i.test(remainTokens[0]) &&
      /^and$/i.test(remainTokens[1]) &&
      /^writing$/i.test(remainTokens[2])
    ) {
      mapped["Test"] = "Reading and Writing";
      remainTokens.splice(0, 3);
    } else {
      // Guess: take 1 token
      mapped["Test"] = remainTokens.shift() ?? "";
    }
  }

  // Whatever is left splits between Domain and Skill
  // Domain is usually shorter (1-3 words), Skill is the rest
  if (
    headerKeywords.includes("Domain") &&
    headerKeywords.includes("Skill")
  ) {
    const domainIdx = headerKeywords.indexOf("Domain");
    const skillIdx = headerKeywords.indexOf("Skill");

    if (domainIdx < skillIdx) {
      // Domain comes before Skill — take half
      const half = Math.max(1, Math.floor(remainTokens.length / 2));
      mapped["Domain"] = remainTokens.slice(0, half).join(" ");
      mapped["Skill"] = remainTokens.slice(half).join(" ");
    } else {
      const half = Math.max(1, Math.floor(remainTokens.length / 2));
      mapped["Skill"] = remainTokens.slice(0, half).join(" ");
      mapped["Domain"] = remainTokens.slice(half).join(" ");
    }
  } else if (headerKeywords.includes("Domain")) {
    mapped["Domain"] = remainTokens.join(" ");
  } else if (headerKeywords.includes("Skill")) {
    mapped["Skill"] = remainTokens.join(" ");
  }

  // Build replacement: turn mapped values into labeled lines
  const labeledLines = Object.entries(mapped)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v.trim()}`)
    .join("\n");

  // Replace the header + value region in the block
  const endOfValueLines =
    headerStart +
    headerLine.length +
    (afterHeader.length - afterHeader.replace(valueLines.join("\n"), "").length);

  // Simpler: just replace from headerStart to after all value lines consumed
  const headerAndValueLen =
    headerLine.length +
    valueLines.reduce((acc, l) => acc + l.length + 1, 0) +
    1; // +1 for newline before header

  return (
    block.slice(0, headerStart).trimEnd() +
    "\n" +
    labeledLines +
    "\n" +
    block.slice(headerStart + headerLine.length).replace(
      // Remove the value lines we consumed
      valueLines.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(
        "\\s*\\n\\s*",
      ),
      "",
    )
  );
}

/**
 * Strip any remaining metadata-table artifacts from the Question prompt.
 * Handles both labeled ("Domain: X") and unlabeled header-row leaks.
 */
function stripMetadataFromPrompt(prompt: string): string {
  let cleaned = prompt;

  // Remove labeled key:value metadata lines at the start
  const labeledMetaRe =
    /^(Question\s+ID|Assessment|Test|Domain|Skill|Difficulty)\s*[:\-]\s*[^\n]*\n?/gim;
  cleaned = cleaned.replace(labeledMetaRe, "");

  // Remove lines that look like the table header
  const tableHeaderRe =
    /^(?:(?:Assessment|Test|Domain|Skill|Difficulty)\s*){2,}$/gim;
  cleaned = cleaned.replace(tableHeaderRe, "");

  // Remove lines that look like "Question ID: xxxxxx"
  cleaned = cleaned.replace(/^Question\s+ID\s*[:\-]?\s*\S+\s*$/gim, "");

  // Remove orphaned single-line metadata blobs (all words are meta keywords)
  // e.g. "SA T Reading and Writing Standard English Boundaries Hard Conventions"
  // These are hard to detect generically; strip lines that start with "SAT " followed by RW/Math
  cleaned = cleaned.replace(
    /^SAT\s+(?:Reading\s+and\s+Writing|Math)\s+.+$/gim,
    "",
  );

  return cleaned.replace(/^\s*\n/gm, "").trim();
}

/**
 * Parse choices from an answer block string.
 * Handles formats:
 *   A. text        A) text        A: text
 *   Multi-line choices with continuations (lines not starting with B-D)
 */
function parseChoicesFromBlock(answerBlock: string): Map<string, string> {
  const choicesMap = new Map<string, string>();
  const cleaned = answerBlock
    .replace(/\n\s*Correct\s+Answer\s*[:\-]?\s*[A-D].*$/gis, "")
    .replace(/\n\s*Rationale\s*[:\-]?\s*.*$/gis, "")
    .trim();

  const lineChoiceRegex =
    /(?:^|\n)\s*([A-D])\s*[.)\-:]*\s*([^\n]+(?:\n(?!\s*[A-D]\s*[.)\-:]).+)*)/gi;
  let cm: RegExpExecArray | null;
  while ((cm = lineChoiceRegex.exec(cleaned)) !== null) {
    const letter = cm[1].toUpperCase();
    const txt = cm[2].trim().replace(/\s+/g, " ");
    if (txt && !choicesMap.has(letter)) {
      choicesMap.set(letter, txt);
    }
  }

  if (choicesMap.size < 2) {
    choicesMap.clear();
    const simpleRegex = /\b([A-D])\s*[.)\-:]\s*([^\nA-D][^\n]*)/g;
    while ((cm = simpleRegex.exec(cleaned)) !== null) {
      const letter = cm[1].toUpperCase();
      const txt = cm[2].trim().replace(/\s+/g, " ");
      if (txt && !choicesMap.has(letter)) {
        choicesMap.set(letter, txt);
      }
    }
  }

  return choicesMap;
}

export function parseSATStructuredQuestionBankExport(
  raw: string,
): SatSectionedQuestion[] {
  const text = normalizeBrokenPdfMetadataText((raw || "").replace(/\r/g, ""));

  QUESTION_ID_BLOCK_RE.lastIndex = 0;
  const idMatches = [...text.matchAll(QUESTION_ID_BLOCK_RE)];
  if (idMatches.length === 0) return [];

  const out: SatSectionedQuestion[] = [];

  for (let i = 0; i < idMatches.length; i++) {
    const start = idMatches[i].index ?? 0;
    const end =
      i + 1 < idMatches.length
        ? (idMatches[i + 1].index ?? text.length)
        : text.length;

    // Normalize the block: convert table-format metadata into labeled lines
    let block = text.slice(start, end).trim();
    block = normalizeMetadataTable(block);

    if (!block) continue;

    const sections: Record<string, string> = {};
    const locs: { heading: string; idx: number }[] = [];

    // Create a fresh regex per block to avoid lastIndex contamination
    const headingRe = new RegExp(
      `(?:^|\\n)\\s*(Question\\s+ID|Assessment|Test|Domain|Skill|Difficulty|Question|Answer|Correct\\s+Answer|Rationale)\\s*[:\\-]?\\s*`,
      "gi",
    );

    let hm: RegExpExecArray | null;
    while ((hm = headingRe.exec(block)) !== null) {
      locs.push({ heading: hm[1], idx: hm.index + hm[0].length });
    }

    if (locs.length === 0) continue;

    for (let j = 0; j < locs.length; j++) {
      const curr = locs[j];
      const next = j + 1 < locs.length ? locs[j + 1].idx : block.length;
      const headingKey = normHeading(curr.heading);
      if (!(headingKey in sections)) {
        sections[headingKey] = block.slice(curr.idx, next).trim();
      }
    }

    const questionId = (sections[normHeading("Question ID")] || "").trim();
    const assessment = (sections[normHeading("Assessment")] || "").trim();
    const test = (sections[normHeading("Test")] || "").trim();
    const domain = (sections[normHeading("Domain")] || "").trim();
    const skill = (sections[normHeading("Skill")] || "").trim();
    const difficulty = (
      (sections[normHeading("Difficulty")] || "medium").trim() || "medium"
    ).toLowerCase();

    // Strip any leaked metadata from the prompt
    const rawPrompt = (sections[normHeading("Question")] || "").trim();
    const cleanedPrompt = stripMetadataFromPrompt(rawPrompt);

    const answerBlock = (sections[normHeading("Answer")] || "").trim();
    const correctAnswerBlock = (
      sections[normHeading("Correct Answer")] || ""
    ).trim();
    const explanation = (sections[normHeading("Rationale")] || "").trim();

    // Parse choices A-D from answerBlock
    const choicesMap = parseChoicesFromBlock(answerBlock);

    const choices: [string, string, string, string] = [
      choicesMap.get("A") ?? "",
      choicesMap.get("B") ?? "",
      choicesMap.get("C") ?? "",
      choicesMap.get("D") ?? "",
    ];

    if (choices.filter(Boolean).length < 2) continue;

    // Correct letter from "Correct Answer" heading.
    const correctLetter = (
      correctAnswerBlock.match(/([A-D])/i)?.[1] || "A"
    ).toUpperCase();

    // Extract passage from prompt (text before the question stem)
    let passage = "";
    let finalPrompt = cleanedPrompt;
    const passageSplit = cleanedPrompt.split(/\n{2,}/);
    if (passageSplit.length >= 2) {
      const lastPart = passageSplit[passageSplit.length - 1];
      if (
        /\?$/.test(lastPart.trim()) ||
        /which|what|how|why|select|choose/i.test(lastPart.slice(0, 60))
      ) {
        passage = passageSplit.slice(0, -1).join("\n\n").trim();
        finalPrompt = lastPart.trim();
      }
    }

    const validate = () => {
      if (!finalPrompt) return false;
      if (metadataLeakIndicators.some((r) => r.test(finalPrompt))) return false;
      if (
        /^\s*(Question\s+ID|Assessment|Test|Domain|Skill|Difficulty)\b/i.test(
          finalPrompt,
        )
      )
        return false;
      return true;
    };

    if (!validate()) continue;

    out.push({
      questionId,
      assessment,
      test,
      domain,
      skill,
      difficulty: difficulty || "medium",
      passage,
      prompt: finalPrompt,
      choices,
      correct: (letterOrder.includes(correctLetter as any)
        ? correctLetter
        : "A") as any,
      explanation,
    });
  }

  return out;
}
