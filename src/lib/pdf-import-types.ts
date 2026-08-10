export type BankQuestionDraft = {
  /** If available in PDF, otherwise client-generated */
  id?: number;
  section: "RW" | "MATH";
  domain: string;
  skill: string;
  difficulty: "easy" | "medium" | "hard" | string;
  passage: string;
  prompt: string;
  choices: [string, string, string, string];
  correct: "A" | "B" | "C" | "D" | string;
  explanation: string;
  /** Optional raw fields for later debugging */
  warnings?: string[];
};

export type PdfExtractionProgress =
  | { state: "idle" }
  | { state: "reading" }
  | { state: "uploading" }
  | { state: "extracting"; message?: string; percent?: number }
  | { state: "done" }
  | { state: "error"; message: string };
