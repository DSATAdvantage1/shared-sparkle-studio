import React from "react";

import type { PdfImportQuestion } from "@/server-fns/pdf-import.functions";

export function PdfImportQuestionPreview({
  questions,
  activeIndex,
  onSelect,
}: {
  questions: PdfImportQuestion[];
  activeIndex: number;
  onSelect: (idx: number) => void;
}) {
  const q = questions[activeIndex];
  if (!q) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Extracted questions</div>
        <div className="text-xs text-muted-foreground">
          {questions.length} detected
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {questions.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(idx)}
            className={
              "rounded-full border px-3 py-1 text-xs font-semibold transition " +
              (idx === activeIndex
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground")
            }
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-2 sm:grid-cols-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground">
              Section
            </div>
            <div className="text-sm font-bold text-foreground">{q.section}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground">
              Domain
            </div>
            <div className="text-sm font-semibold">{q.domain}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground">
              Skill
            </div>
            <div className="text-sm font-semibold">{q.skill}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground">
              Difficulty
            </div>
            <div className="text-sm font-semibold">{q.difficulty}</div>
          </div>
        </div>

        {q.passage?.trim() ? (
          <div className="mt-3">
            <div className="text-xs font-semibold text-muted-foreground">
              Passage
            </div>
            <div className="whitespace-pre-line text-sm">{q.passage}</div>
          </div>
        ) : null}

        <div className="mt-3">
          <div className="text-xs font-semibold text-muted-foreground">
            Prompt
          </div>
          <div className="whitespace-pre-line text-sm font-normal">
            {q.prompt}
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {q.choices.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <div className="w-6 shrink-0 text-xs font-bold text-muted-foreground">
                {String.fromCharCode(65 + i)}
              </div>
              <div className={"flex-1 " + (q.correct === c ? "" : "")}>{c}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-xs">
          <span className="font-semibold text-muted-foreground">Correct:</span>{" "}
          <span className="font-semibold">{q.correct}</span>
        </div>

        {q.explanation?.trim() ? (
          <div className="mt-3">
            <div className="text-xs font-semibold text-muted-foreground">
              Explanation / Rationale
            </div>
            <div className="whitespace-pre-line text-sm">{q.explanation}</div>
          </div>
        ) : null}

        {q.warnings?.length ? (
          <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
            <div className="font-semibold">Warnings</div>
            <ul className="mt-1 list-disc pl-5">
              {q.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
