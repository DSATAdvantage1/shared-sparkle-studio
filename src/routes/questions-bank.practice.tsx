import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronUp,
  X,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  Calculator,
  SquareFunction,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesmosCalculator } from "@/components/DesmosCalculator";

import {
  HighlightablePassage,
  type Highlight,
} from "@/components/HighlightablePassage";

import { consumeTransition } from "@/routes/pageTransitionStore";
import { PageTransition1600 } from "@/components/transitions/PageTransition1600";
import { useQuestionBankData } from "./questions-bank.reading-writing";

const searchSchema = z.object({
  section: z.enum(["RW", "MATH"]).default("RW"),
  skill: z.string().optional(),
  domain: z.string().optional(),
});

export const Route = createFileRoute("/questions-bank/practice")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Practice — Question Bank" }],
  }),
  component: PracticePage,
});

type Choice = { letter: string; text: string };

type BankQuestion = {
  id: string;
  section: "RW" | "MATH";
  domain: string;
  skill: string;
  difficulty: string;
  passage: string | null;
  prompt: string;
  choices: Choice[];
  correct_answer: string;
  explanation: string | null;
};

function PracticePage() {
  const transitionReq = consumeTransition();
  const transitionKind = transitionReq?.kind;
  const shouldPlay1600 = transitionKind === "question-bank";

  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === mainRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const { section, skill, domain } = Route.useSearch() as any;
  const allQuestions = useQuestionBankData();

  const questions = useMemo(() => {
    const sectionKey = section === "MATH" ? "math" : "rw";
    const skillFilter = typeof skill === "string" ? skill.trim().toLowerCase() : "";
    const domainFilter = typeof domain === "string" ? domain.trim().toLowerCase() : "";

    const letters = ["A", "B", "C", "D"];

    return allQuestions
      .filter((q) => {
        if (q.module !== sectionKey) return false;
        if (skillFilter && (q.skill ?? "").toLowerCase() !== skillFilter) return false;
        if (domainFilter && (q.domain ?? "").toLowerCase() !== domainFilter) return false;
        return true;
      })
      .map((q) => ({
        id: String(q.id),
        section: q.module === "math" ? ("MATH" as const) : ("RW" as const),
        domain: q.domain ?? "",
        skill: q.skill ?? "",
        difficulty: q.difficulty ?? "medium",
        passage: q.passage ?? null,
        prompt: q.prompt,
        choices: (q.choices ?? []).map((text, i) => ({
          letter: letters[i] ?? String(i + 1),
          text,
        })),
        correct_answer: letters[q.correct] ?? "A",
        explanation: q.explanation ?? null,
        graph: q.graph,
      }));
  }, [allQuestions, section, skill, domain]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const [eliminatorOn, setEliminatorOn] = useState(false);
  const [eliminated, setEliminated] = useState<Record<string, Set<string>>>({});

  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, Highlight[]>>({});

  const isMath = section === "MATH";

  const progressKey = `qb-progress:${section}:${domain ?? ""}:${skill ?? ""}`;

  useEffect(() => {
    setIndex(0);
    setEliminated({});
    let saved: any = null;
    try {
      const raw = localStorage.getItem(progressKey);
      if (raw) saved = JSON.parse(raw);
    } catch {
      saved = null;
    }
    setAnswers(saved?.answers ?? {});
    setMarked(saved?.marked ?? {});
    setRevealed(saved?.revealed ?? {});
  }, [progressKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        progressKey,
        JSON.stringify({ answers, marked, revealed }),
      );
    } catch {
      // ignore
    }
  }, [progressKey, answers, marked, revealed]);


  const current = questions[index] as any;

  const surfaceClass = useMemo(
    () =>
      isMath
        ? "bg-[linear-gradient(180deg,#eef2ff_0%,#e0e7ff_50%,#f5f7ff_100%)]"
        : "bg-[linear-gradient(180deg,#fde6ee_0%,#fce7f3_50%,#fff1f6_100%)]",
    [isMath],
  );

  const backLink = isMath
    ? ("/questions-bank/math" as const)
    : ("/questions-bank/reading-writing" as const);

  const wrap = (node: React.ReactNode) =>
    shouldPlay1600 ? (
      <PageTransition1600 kind="question-bank">{node}</PageTransition1600>
    ) : (
      node
    );

  if (!current) {
    return wrap(
      <div
        className={`flex min-h-screen items-center justify-center ${surfaceClass} px-6`}
      >
        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 text-center shadow-xl backdrop-blur-xl">
          <h2 className="text-xl font-bold text-foreground">
            No questions yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No questions for{" "}
            <span className="font-semibold">{skill ?? section}</span>. Admins
            can upload a PDF in the admin panel.
          </p>
          <Link
            to={backLink}
            className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background"
          >
            Back to topics
          </Link>
        </div>
      </div>,
    );
  }

  const qid = current.id;
  const userChoice = answers[qid];
  const isMarked = !!marked[qid];
  const isRevealed = !!revealed[qid];
  const elimSet = eliminated[qid] ?? new Set<string>();

  function selectChoice(letter: string) {
    setAnswers((a) => ({ ...a, [qid]: letter }));
  }
  function toggleMark() {
    setMarked((m) => ({ ...m, [qid]: !m[qid] }));
  }
  function toggleEliminate(letter: string) {
    setEliminated((e) => {
      const set = new Set(e[qid] ?? []);
      if (set.has(letter)) set.delete(letter);
      else set.add(letter);
      return { ...e, [qid]: set };
    });
  }
  function next() {
    if (index < questions.length - 1) setIndex((i) => i + 1);
  }
  function prev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  const page = (
    <div
      ref={containerRef}
      className={`flex h-screen flex-col overflow-hidden ${surfaceClass} animate-fade-in`}
    >
      <header className="grid grid-cols-[1fr_auto_1fr] items-start px-7 pt-4 pb-2 bg-white/70 backdrop-blur-xl border-b border-white/60">
        <div>
          <Link
            to={backLink}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-foreground/80 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <p className="mt-1 text-[15px] font-semibold leading-none text-foreground">
            {isMath ? "Math" : "Reading and Writing"} · {current.skill}
          </p>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[11px] uppercase tracking-wide text-foreground/60">
            Difficulty
          </p>
          <p className="text-[14px] font-semibold capitalize text-foreground">
            {current.difficulty}
          </p>
        </div>

        <div className="flex items-start justify-end gap-7 pt-0.5 text-[11px] text-foreground">
          <button
            onClick={() => {
              if (containerRef.current?.requestFullscreen) {
                if (document.fullscreenElement) document.exitFullscreen();
                else containerRef.current.requestFullscreen();
              }
            }}
            className="flex flex-col items-center gap-0.5"
          >
            {isFullscreen ? (
              <Minimize2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
            ) : (
              <Maximize2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
            )}
            <span>{isFullscreen ? "Exit Full Screen" : "Full Screen"}</span>
          </button>

          {isMath && (
            <>
              <button
                onClick={() => setCalcOpen((v) => !v)}
                className={`flex flex-col items-center gap-0.5 ${calcOpen ? "text-blue-600" : ""}`}
              >
                <Calculator className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span>Calculator</span>
              </button>
              <button
                onClick={() => setRefOpen((v) => !v)}
                className={`flex flex-col items-center gap-0.5 ${refOpen ? "text-blue-600" : ""}`}
              >
                <SquareFunction
                  className="h-[18px] w-[18px]"
                  strokeWidth={1.8}
                />
                <span>Reference</span>
              </button>
            </>
          )}
        </div>
      </header>

      <main
        ref={mainRef}
        className="relative flex min-h-0 flex-1 overflow-auto px-7 pt-8 pb-5"
      >
        {!isMath && current.passage && (
          <>
            <div
              key={`p-${qid}`}
              className="pr-10 animate-fade-in"
              style={{ width: "calc(50% - 21px)" }}
            >
              <HighlightablePassage
                text={current.passage ?? ""}
                highlights={highlights[qid] ?? []}
                onChange={(nextHighlights) =>
                  setHighlights((h) => ({ ...h, [qid]: nextHighlights }))
                }
                enabled={true}
              />
            </div>

            <div className="mx-[18px] w-[3px] self-stretch bg-foreground/30" />
          </>
        )}

        <div
          key={`q-${qid}`}
          className={
            isMath || !current.passage
              ? "mx-auto w-full max-w-[760px] animate-fade-in"
              : "flex-1 pl-7 animate-fade-in"
          }
          style={
            isMath || !current.passage
              ? undefined
              : { width: "calc(50% - 21px)" }
          }
        >
          <div className="mb-0 flex items-stretch justify-between bg-white/70">
            <div className="flex items-stretch gap-3">
              <span className="flex h-[32px] w-[28px] items-center justify-center bg-foreground text-[17px] font-bold leading-none text-background">
                {index + 1}
              </span>

              <button
                onClick={toggleMark}
                className="flex items-center gap-1.5 text-[13px] font-medium text-foreground"
              >
                {isMarked ? (
                  <BookmarkCheck className="h-[15px] w-[15px] fill-foreground text-foreground" />
                ) : (
                  <Bookmark className="h-[15px] w-[15px]" />
                )}
                Mark for Review
              </button>
            </div>

            <button
              onClick={() => setEliminatorOn((e) => !e)}
              className="my-[3px] mr-[3px] flex h-[26px] min-w-[36px] items-center justify-center rounded-full border border-foreground/55 bg-background px-2 text-[10px] font-semibold text-foreground"
            >
              <span className="line-through">ABC</span>
            </button>
          </div>

          <div className="mb-5 h-[2px] w-full bg-foreground/20" />

          {isMath && current.passage && (
            <div className="relative">
              <p className="mb-4 whitespace-pre-line font-[Georgia,Times_New_Roman,serif] text-[16px] leading-[1.5] text-foreground">
                {current.passage}
              </p>
            </div>
          )}

          {current.graph?.imageUrl && (
            <figure className="mb-5">
              <img
                src={current.graph.imageUrl}
                alt={current.graph.description ?? "Figure for this question"}
                loading="lazy"
                className="mx-auto max-h-[420px] w-auto max-w-full rounded-lg border border-foreground/15 bg-background p-2"
              />
            </figure>
          )}

          <p className="whitespace-pre-line font-[Georgia,Times_New_Roman,serif] text-[17px] leading-[1.42] text-foreground">
            <strong className="font-extrabold">[DSATAdvantage.com]</strong>{" "}
            {current.prompt}
          </p>

          <div className="mt-5 space-y-[10px]">
            {current.choices.map((c: any) => {
              const isSelected = userChoice === c.letter;
              const isElim = elimSet.has(c.letter);
              const isCorrectChoice =
                isRevealed && c.letter === current.correct_answer;
              const isWrongPick =
                isRevealed && isSelected && c.letter !== current.correct_answer;

              return (
                <div key={c.letter} className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      !isElim && !isRevealed && selectChoice(c.letter)
                    }
                    disabled={isElim || isRevealed}
                    className={`relative flex min-h-[44px] flex-1 items-stretch rounded-[6px] border bg-background text-left transition-colors ${
                      isCorrectChoice
                        ? "border-emerald-500 ring-1 ring-emerald-400"
                        : isWrongPick
                          ? "border-rose-500 ring-1 ring-rose-400"
                          : isSelected
                            ? isMath
                              ? "border-blue-600 ring-1 ring-blue-500"
                              : "border-rose-500 ring-1 ring-rose-400"
                            : "border-foreground/40"
                    } ${isElim ? "opacity-45" : ""}`}
                  >
                    <span className="flex w-[44px] shrink-0 items-center justify-center">
                      <span
                        className={`flex h-[22px] w-[22px] items-center justify-center rounded-full font-sans text-[13px] font-bold leading-none ${
                          isSelected || isCorrectChoice
                            ? isCorrectChoice
                              ? "bg-emerald-500 text-white border border-emerald-500"
                              : isWrongPick
                                ? "bg-rose-500 text-white border border-rose-500"
                                : isMath
                                  ? "bg-blue-600 text-white border border-blue-600"
                                  : "bg-rose-500 text-white border border-rose-500"
                            : "border border-foreground/55 text-foreground/80 font-normal"
                        }`}
                      >
                        {c.letter}
                      </span>
                    </span>

                    <span className="flex flex-1 items-center py-2 pr-4 font-[Georgia,Times_New_Roman,serif] text-[16px] leading-[1.35] text-foreground">
                      {c.text}
                    </span>

                    {isCorrectChoice && (
                      <CheckCircle2 className="mr-3 self-center h-5 w-5 text-emerald-500" />
                    )}
                    {isWrongPick && (
                      <XCircle className="mr-3 self-center h-5 w-5 text-rose-500" />
                    )}
                  </button>

                  {eliminatorOn && !isRevealed && (
                    <button
                      onClick={() => toggleEliminate(c.letter)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/45 bg-background text-[10px] font-bold text-foreground"
                    >
                      {isElim ? "×" : <X className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {isRevealed && current.explanation && (
            <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-foreground">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Rationale
              </div>
              <p className="whitespace-pre-line">{current.explanation}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="grid grid-cols-[1fr_auto_1fr] items-center bg-white/70 backdrop-blur-xl border-t border-white/60 px-8 py-3">
        <p className="text-[14px] font-semibold text-foreground">
          DSAT Advantage
        </p>

        <div className="relative flex justify-center">
          {navigatorOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNavigatorOpen(false)}
              />
              <div className="absolute bottom-[44px] left-1/2 z-50 w-[560px] max-w-[92vw] -translate-x-1/2 rounded-[10px] border border-foreground/25 bg-background shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between border-b border-foreground/15 px-4 py-2">
                  <p className="text-[14px] font-semibold text-foreground">
                    {isMath ? "Math" : "Reading and Writing"}
                  </p>
                  <button
                    onClick={() => setNavigatorOpen(false)}
                    className="text-foreground/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-10 gap-2 p-4">
                  {questions.map((q, i) => {
                    const answered = answers[q.id] !== undefined;
                    const isCurrent = i === index;
                    const isReview = !!marked[q.id];

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setIndex(i);
                          setNavigatorOpen(false);
                        }}
                        className={`relative flex h-8 w-8 items-center justify-center rounded-[4px] text-[13px] font-semibold ${
                          isCurrent
                            ? isMath
                              ? "bg-blue-600 text-background"
                              : "bg-rose-500 text-background"
                            : answered
                              ? "bg-foreground/10 text-foreground border border-foreground/30"
                              : "border border-dashed border-foreground/55 text-foreground"
                        }`}
                      >
                        {i + 1}
                        {isReview && (
                          <BookmarkCheck className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 fill-[oklch(0.65_0.2_25)] text-[oklch(0.65_0.2_25)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => setNavigatorOpen((o) => !o)}
            className="flex h-[34px] items-center gap-1 rounded-[12px] bg-foreground px-5 text-[14px] font-semibold text-background shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
          >
            Question {index + 1} of {questions.length}
            <ChevronUp
              className={`h-4 w-4 transition-transform ${navigatorOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          {index > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={prev}
              className="h-[34px] rounded-full border-foreground/35 px-4 text-[14px]"
            >
              Back
            </Button>
          )}

          {!isRevealed ? (
            <>
              <Button
                size="sm"
                onClick={() => setRevealed((r) => ({ ...r, [qid]: true }))}
                disabled={!userChoice}
                className={`h-[34px] rounded-full px-6 text-[14px] font-semibold text-white ${isMath ? "bg-blue-600 hover:bg-blue-700" : "bg-rose-500 hover:bg-rose-600"}`}
              >
                Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={next}
                disabled={index >= questions.length - 1}
                className="h-[34px] rounded-full border-foreground/35 px-4 text-[14px]"
              >
                Next
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={next}
              disabled={index >= questions.length - 1}
              className={`h-[34px] rounded-full px-8 text-[14px] font-semibold text-white ${isMath ? "bg-blue-600 hover:bg-blue-700" : "bg-rose-500 hover:bg-rose-600"}`}
            >
              Next
            </Button>
          )}
        </div>
      </footer>

      {calcOpen && <DesmosCalculator onClose={() => setCalcOpen(false)} />}

      {refOpen && (
        <div className="fixed bottom-20 right-6 z-50 flex max-h-[520px] w-[380px] flex-col overflow-hidden rounded-lg border border-foreground/25 bg-background shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between border-b border-foreground/15 bg-muted/40 px-3 py-2">
            <p className="text-[13px] font-semibold text-foreground">
              Reference Sheet
            </p>
            <button
              onClick={() => setRefOpen(false)}
              className="text-foreground/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto p-4 text-[13px] text-foreground">
            <div>
              <strong>Area of a circle:</strong> A = πr²
            </div>
            <div>
              <strong>Circumference:</strong> C = 2πr
            </div>
            <div>
              <strong>Area of a rectangle:</strong> A = lw
            </div>
            <div>
              <strong>Area of a triangle:</strong> A = ½bh
            </div>
            <div>
              <strong>Pythagorean theorem:</strong> a² + b² = c²
            </div>
            <div>
              <strong>Special right triangles:</strong> 30°-60°-90° → 1, √3, 2 ;
              45°-45°-90° → 1, 1, √2
            </div>
            <div>
              <strong>Volume of a rectangular solid:</strong> V = lwh
            </div>
            <div>
              <strong>Volume of a cylinder:</strong> V = πr²h
            </div>
            <div>
              <strong>Volume of a sphere:</strong> V = (4/3)πr³
            </div>
            <div>
              <strong>Volume of a cone:</strong> V = (1/3)πr²h
            </div>
            <div>
              <strong>Volume of a pyramid:</strong> V = (1/3)lwh
            </div>
            <div className="pt-2 text-muted-foreground">
              The number of degrees of arc in a circle is 360. The sum of the
              measures in degrees of the angles of a triangle is 180.
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return wrap(page);
}
