import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bookmark,
  BookmarkCheck,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Highlighter,
  MoreVertical,
  Calculator,
  SquareFunction,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { questions, moduleInfo, type Question } from "@/lib/test-data";
import {
  HighlightablePassage,
  type Highlight,
} from "@/components/HighlightablePassage";
import { DesmosCalculator } from "@/components/DesmosCalculator";

import { novemberQuestions } from "@/lib/test-data-nov-2025";
import { getPublishedTestQuestions } from "@/server-fns/admin.functions";
import { consumeTransition } from "@/routes/pageTransitionStore";
import { PageTransition1600 } from "@/components/transitions/PageTransition1600";
import "./test.css";

export const Route = createFileRoute("/test")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { set?: string; testId?: string } => ({
    set: search.set as string | undefined,
    testId: search.testId as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Practice Test — DSAT Advantage" },
      {
        name: "description",
        content:
          "Take a Bluebook-style Digital SAT practice test on DSAT Advantage with timer, mark for review, and instant scoring.",
      },
      { property: "og:title", content: "Practice Test — DSAT Advantage" },
      {
        property: "og:description",
        content: "A free Bluebook-style Digital SAT practice test.",
      },
    ],
  }),
  component: TestPage,
});

type ModuleKey = "rw" | "math";

function normalizeQuestions(value: unknown): Question[] {
  if (Array.isArray(value)) {
    return value as Question[];
  }

  if (value && typeof value === "object") {
    const rawValues = Object.values(value);
    if (
      rawValues.length > 0 &&
      rawValues.every((item) => item && typeof item === "object")
    ) {
      return rawValues as Question[];
    }
  }

  return [];
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function TestPage() {
  const getPublishedTestQuestionsFn = useServerFn(getPublishedTestQuestions);

  const transitionReq = consumeTransition();

  const [stage, setStage] = useState<"intro" | "test" | "results">("test");
  const [moduleKey, setModuleKey] = useState<ModuleKey>("rw");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string | number, number | undefined>>(
    {},
  );
  const [marked, setMarked] = useState<Record<string | number, boolean>>({});
  const [eliminated, setEliminated] = useState<Record<string | number, Set<number>>>({});
  const [timeLeft, setTimeLeft] = useState(26 * 60 + 17);
  const [eliminatorOn, setEliminatorOn] = useState(false);
  const [highlights, setHighlights] = useState<Record<string | number, Highlight[]>>({});
  const [highlightingOn, setHighlightingOn] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === mainRef.current);
    }

    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.max(20, Math.min(80, pct)));
    }

    function onUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const search = Route.useSearch();

  const [dbQuestions, setDbQuestions] = useState<Question[] | null>(null);
  const [dbQuestionsLoading, setDbQuestionsLoading] = useState(
    Boolean(search.testId),
  );

  useEffect(() => {
    if (!search.testId) {
      setDbQuestions(null);
      setDbQuestionsLoading(false);
      return;
    }

    let cancelled = false;
    setDbQuestionsLoading(true);

    (async () => {
      let data;
      try {
        data = await getPublishedTestQuestionsFn({
          data: { id: search.testId! },
        });
      } catch {
        if (!cancelled) {
          toast.error("Couldn't load this test");
          setDbQuestionsLoading(false);
        }
        return;
      }

      if (cancelled) return;
      setDbQuestions(normalizeQuestions(data.questions));
      setDbQuestionsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [search.testId]);

  const activeQuestions = search.testId
    ? (dbQuestions ?? [])
    : search.set === "nov-2025"
      ? novemberQuestions
      : questions;

  const navigate = useNavigate();
  const storageKey = `dsat-test-progress:${search.testId ?? search.set ?? "default"}`;

  // Load saved progress on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.moduleKey) setModuleKey(saved.moduleKey);
      if (typeof saved.index === "number") setIndex(saved.index);
      if (saved.answers) setAnswers(saved.answers);
      if (saved.marked) setMarked(saved.marked);
      if (typeof saved.timeLeft === "number") setTimeLeft(saved.timeLeft);
      toast.success("Resumed your saved test");
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveProgress() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ moduleKey, index, answers, marked, timeLeft }),
      );
      return true;
    } catch {
      return false;
    }
  }

  function handleSaveAndExit() {
    if (saveProgress()) {
      toast.success("Progress saved. You can resume later.");
      navigate({ to: "/" });
    } else {
      toast.error("Couldn't save progress.");
    }
  }

  const moduleQuestions = useMemo(
    () => activeQuestions.filter((q) => q.module === moduleKey),
    [moduleKey, activeQuestions],
  );

  const availableModules = useMemo(() => {
    const modules = new Set(activeQuestions.map((q) => q.module));
    return {
      rw: modules.has("rw"),
      math: modules.has("math"),
    };
  }, [activeQuestions]);

  const current: Question | undefined = moduleQuestions[index];

  useEffect(() => {
    if (activeQuestions.length === 0) return;

    if (!availableModules[moduleKey]) {
      setModuleKey(availableModules.rw ? "rw" : "math");
      setIndex(0);
      return;
    }

    if (index > Math.max(moduleQuestions.length - 1, 0)) {
      setIndex(0);
    }
  }, [
    activeQuestions.length,
    availableModules,
    index,
    moduleKey,
    moduleQuestions.length,
  ]);

  useEffect(() => {
    if (stage !== "test") return;
    if (timeLeft <= 0) {
      handleFinishModule();
      return;
    }

    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, timeLeft]);

  function startTest() {
    setStage("test");
    setModuleKey("rw");
    setIndex(0);
    setTimeLeft(26 * 60 + 17);
  }

  function handleFinishModule() {
    if (moduleKey === "rw" && availableModules.math) {
      setModuleKey("math");
      setIndex(0);
      setTimeLeft(moduleInfo.math.durationSec);
    } else {
      setStage("results");
    }
  }

  function selectChoice(i: number) {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current.id]: i }));
  }

  function toggleMark() {
    if (!current) return;
    setMarked((m) => ({ ...m, [current.id]: !m[current.id] }));
  }

  function toggleEliminate(i: number) {
    if (!current) return;
    setEliminated((e) => {
      const set = new Set(e[current.id] ?? []);
      if (set.has(i)) set.delete(i);
      else set.add(i);
      return { ...e, [current.id]: set };
    });
  }

  function next() {
    if (index < moduleQuestions.length - 1) setIndex((i) => i + 1);
    else handleFinishModule();
  }

  function prev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  if (stage === "intro") {
    const introUi = (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 test-page-container flex flex-col">
        <div className="test-bg-grid" />
        <div className="test-glow-radial" />
        <TestHeader />
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-16 sm:px-6">
          <Card className="max-w-2xl w-full p-10 test-card-premium">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 shadow-md">
                <Star className="h-7 w-7 fill-white text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Digital SAT Practice Test
                </h1>
                <p className="text-sm font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 mt-1">
                  Bluebook™-Style Adaptive Practice
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-4 text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>
                This adaptive practice test contains <strong>2 complete modules</strong> designed to replicate the official testing software environment:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  <strong>Reading &amp; Writing</strong> — 4 adaptive questions, 8 minutes
                </li>
                <li>
                  <strong>Math Section</strong> — 4 adaptive questions, 10 minutes
                </li>
              </ul>
              <p>
                You can mark questions for review, cross out incorrect options, highlight text sections, and use the built-in Desmos Calculator.
              </p>
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/25 px-8 font-semibold rounded-full h-12"
                onClick={startTest}
              >
                Start Test
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-12 px-6 font-semibold" asChild>
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );

    if (transitionReq) {
      return (
        <PageTransition1600 kind={transitionReq.kind} onDone={() => {}}>
          {introUi}
        </PageTransition1600>
      );
    }

    return introUi;
  }

  if (stage === "results") {
    const score = activeQuestions.reduce(
      (acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0),
      0,
    );

    const pct = activeQuestions.length
      ? Math.round((score / activeQuestions.length) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 test-page-container flex flex-col">
        <div className="test-bg-grid" />
        <div className="test-glow-radial" />
        <TestHeader />
        <div className="relative z-10 mx-auto max-w-3xl w-full px-4 py-16 sm:px-6">
          <Card className="overflow-hidden test-card-premium">
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-8 py-12 text-center text-white shadow-inner">
              <p className="text-sm font-bold uppercase tracking-widest text-sky-200">Your practice score</p>
              <p className="mt-3 text-7xl font-extrabold tracking-tight">
                {score}
                <span className="text-3xl font-medium opacity-70">
                  /{activeQuestions.length}
                </span>
              </p>
              <p className="mt-3 text-lg font-medium text-sky-100">{pct}% of questions correct</p>
            </div>

            <div className="space-y-6 p-8">
              {activeQuestions.map((q, i) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correct;
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Question {i + 1} · {moduleInfo[q.module].short}
                      </div>
                      {isCorrect ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4.5 w-4.5" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          <XCircle className="h-4.5 w-4.5" /> Incorrect
                        </span>
                      )}
                    </div>
                    {q.passage && (
                      <p className="mt-4 whitespace-pre-line text-sm italic font-serif leading-relaxed text-slate-500 dark:text-slate-400 border-l-2 border-sky-500/25 pl-4">
                        {q.passage}
                      </p>
                    )}
                    <p className="mt-4 whitespace-pre-line text-[15px] font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                      {q.prompt}
                    </p>

                    <div className="mt-4 space-y-2 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                      <p className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Your choice:</span>
                        {userAns !== undefined ? (
                          <span
                            className={`font-semibold ${
                              isCorrect ? "text-emerald-600 dark:text-emerald-450" : "text-rose-650 dark:text-rose-400"
                            }`}
                          >
                            {String.fromCharCode(65 + userAns)}. {q.choices[userAns]}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">— left blank</span>
                        )}
                      </p>
                      {!isCorrect && (
                        <p className="flex items-center gap-2">
                          <span className="text-slate-400 dark:text-slate-500 font-medium">Correct answer:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-450">
                            {String.fromCharCode(65 + q.correct)}. {q.choices[q.correct]}
                          </span>
                        </p>
                      )}
                    </div>

                    <p className="mt-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/10 border border-sky-100/30 p-4 text-[14px] leading-relaxed text-slate-700 dark:text-slate-350">
                      <strong className="font-bold text-sky-800 dark:text-sky-400 block mb-1">Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 p-6 sm:flex-row sm:justify-end">
              <Button variant="outline" className="rounded-full h-11 px-6 font-semibold" asChild>
                <Link to="/">Back to home</Link>
              </Button>
              <Button
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-md shadow-sky-500/15 rounded-full h-11 px-8 font-semibold"
                onClick={() => {
                  setAnswers({});
                  setMarked({});
                  setEliminated({});
                  setStage("test");
                  setModuleKey("rw");
                  setIndex(0);
                  setTimeLeft(26 * 60 + 17);
                }}
              >
                Retake Test
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (search.testId && dbQuestionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading test…</p>
      </div>
    );
  }

  if (activeQuestions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">
            This test has no questions yet
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Finish extraction in the editor, then publish the test to open it
            here.
          </p>
          <Button asChild className="mt-4">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const userChoice = answers[current.id];
  const isMarked = !!marked[current.id];
  const elimSet = eliminated[current.id] ?? new Set<number>();

  return (
    <div
      ref={containerRef}
      className="flex h-screen flex-col overflow-hidden bg-background animate-fade-in"
    >
      <header className="grid grid-cols-[1fr_auto_1fr] items-start px-7 pt-4 pb-1">
        <div>
          <p className="text-[15px] font-semibold leading-none text-foreground">
            Section 1, Module 2: Reading and Writing
          </p>
          <button className="mt-3 inline-flex items-center gap-1 text-[13px] text-foreground hover:underline">
            Directions{" "}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-[18px] font-semibold leading-none text-foreground">
            {formatTime(timeLeft)}
          </p>
          <button className="rounded-full border border-foreground/70 bg-background px-2 py-[1px] text-[11px] leading-none text-foreground">
            Hide
          </button>
        </div>

        <div className="flex items-start justify-end gap-7 pt-0.5 text-[11px] text-foreground">
          <button className="flex flex-col items-center gap-0.5">
            <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <span>Report</span>
          </button>

          {moduleKey === "math" ? (
            <>
              <button
                onClick={() => setCalcOpen((v) => !v)}
                className={`flex flex-col items-center gap-0.5 ${calcOpen ? "text-primary" : ""}`}
                aria-pressed={calcOpen}
              >
                <Calculator className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span>Calculator</span>
              </button>
              <button
                onClick={() => setRefOpen((v) => !v)}
                className={`flex flex-col items-center gap-0.5 ${refOpen ? "text-primary" : ""}`}
                aria-pressed={refOpen}
              >
                <SquareFunction
                  className="h-[18px] w-[18px]"
                  strokeWidth={1.8}
                />
                <span>Reference</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setHighlightingOn((v) => !v)}
              className={`flex flex-col items-center gap-0.5 ${highlightingOn ? "text-primary" : ""}`}
              aria-pressed={highlightingOn}
            >
              <Highlighter className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span>Highlights &amp; Notes</span>
            </button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <button className="flex flex-col items-center gap-0.5">
                <MoreVertical className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span>More</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1">
              <button
                onClick={() => {
                  if (containerRef.current?.requestFullscreen) {
                    if (document.fullscreenElement) document.exitFullscreen();
                    else containerRef.current.requestFullscreen();
                  }
                }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span>{isFullscreen ? "Exit Full Screen" : "Full Screen"}</span>
              </button>
              <button
                onClick={handleSaveAndExit}
                className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
              >
                Save &amp; Exit
              </button>
              <button
                onClick={() => {
                  if (saveProgress()) toast.success("Progress saved");
                }}
                className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
              >
                Save Progress
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <div className="dsat-accent-strip" />

      <main
        ref={mainRef}
        className="relative flex min-h-0 flex-1 overflow-auto px-7 pt-10 pb-5"
      >
        {moduleKey !== "math" && (
          <>
            <div
              key={`p-${current.id}`}
              className="pr-10 animate-fade-in"
              style={{ width: `calc(${splitPct}% - 21px)` }}
            >
              {current.passage ? (
                <HighlightablePassage
                  text={current.passage}
                  highlights={highlights[current.id] ?? []}
                  enabled={highlightingOn}
                  onChange={(next) =>
                    setHighlights((h) => ({ ...h, [current.id]: next }))
                  }
                />
              ) : null}
            </div>

            <div
              onMouseDown={(e) => {
                e.preventDefault();
                draggingRef.current = true;
                document.body.style.cursor = "col-resize";
                document.body.style.userSelect = "none";
              }}
              className="group relative mx-[18px] w-[3px] cursor-col-resize self-stretch bg-foreground/45"
            >
              <div className="absolute top-[112px] left-1/2 flex h-7 w-[14px] -translate-x-1/2 items-center justify-center rounded-[2px] bg-foreground">
                <span className="absolute left-[2px] top-1/2 h-0 w-0 -translate-y-1/2 border-y-[4px] border-y-transparent border-r-[4px] border-r-background" />
                <span className="absolute right-[2px] top-1/2 h-0 w-0 -translate-y-1/2 border-y-[4px] border-y-transparent border-l-[4px] border-l-background" />
              </div>
            </div>
          </>
        )}

        <div
          key={`q-${current.id}`}
          className={
            moduleKey === "math"
              ? "mx-auto w-full max-w-[760px] animate-fade-in"
              : "flex-1 pl-7 animate-fade-in"
          }
          style={
            moduleKey === "math"
              ? undefined
              : { width: `calc(${100 - splitPct}% - 21px)` }
          }
        >
          <div className="mb-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-[30px] w-[30px] items-center justify-center bg-slate-900 dark:bg-slate-200 text-[17px] font-bold leading-none text-white dark:text-slate-900 rounded-[3px]">
                {index + 1}
              </span>
              <button
                onClick={toggleMark}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300"
              >
                {isMarked ? (
                  <BookmarkCheck
                    className="h-[15px] w-[15px] fill-amber-500 text-amber-500"
                    strokeWidth={1.6}
                  />
                ) : (
                  <Bookmark
                    className="h-[15px] w-[15px] text-slate-500 dark:text-slate-400"
                    strokeWidth={1.6}
                  />
                )}
                Mark for Review
              </button>
            </div>
            <button
              onClick={() => setEliminatorOn((e) => !e)}
              title="Cross out answer choices"
              className="my-[3px] mr-[3px] flex h-[26px] min-w-[36px] items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
            >
              <span className="line-through">ABC</span>
            </button>
          </div>

          <div className="mb-5 dsat-accent-strip" />

          <p className="font-[Georgia,Times_New_Roman,serif] whitespace-pre-line text-[17px] leading-[1.42] text-foreground">
            <strong className="font-extrabold">[@DSAT_Advantage]</strong>{" "}
            {current.prompt}
          </p>

          <div className="mt-5 space-y-[10px]">
            {current.choices.map((choice, i) => {
              const isSelected = userChoice === i;
              const isElim = elimSet.has(i);
              return (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => !isElim && selectChoice(i)}
                    disabled={isElim}
                    className={`test-choice-button relative flex min-h-[44px] flex-1 items-stretch text-left transition-all ${
                      isSelected
                        ? "selected border-sky-500 ring-1 ring-sky-500/50"
                        : "border-slate-300 dark:border-slate-800"
                    } ${isElim ? "opacity-45" : ""}`}
                  >
                    <span className="flex w-[44px] shrink-0 items-center justify-center">
                      <span
                        className={`flex h-[22px] w-[22px] items-center justify-center rounded-full font-sans text-[13px] font-bold leading-none ${
                          isSelected
                            ? "bg-sky-600 text-white"
                            : "border border-slate-400 dark:border-slate-650 text-slate-750 dark:text-slate-300 font-normal"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                    </span>
                    <span
                      className={`flex flex-1 items-center py-2 pr-4 font-[Georgia,Times_New_Roman,serif] text-[16px] leading-[1.35] text-foreground ${isElim ? "line-through" : ""}`}
                    >
                      {choice}
                    </span>
                  </button>

                  {eliminatorOn && (
                    <button
                      onClick={() => toggleEliminate(i)}
                      title="Eliminate this answer"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/45 bg-background text-[10px] font-bold text-foreground"
                    >
                      {isElim ? (
                        "×"
                      ) : (
                        <X className="h-3 w-3" strokeWidth={1.8} />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <div className="dsat-accent-strip" />

      <footer className="grid grid-cols-[1fr_auto_1fr] items-center px-8 pt-3 pb-4">
        <p className="text-[16px] font-semibold text-foreground">
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
                    {moduleKey === "rw" ? "Reading and Writing" : "Math"}
                  </p>
                  <button
                    onClick={() => setNavigatorOpen(false)}
                    className="text-foreground/70 hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 border-b border-foreground/10 px-4 py-1.5 text-[11px] text-foreground/70">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-[2px] border border-dashed border-foreground/60" />
                    Unanswered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-[2px] bg-[oklch(0.48_0.22_264)]" />
                    Current
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookmarkCheck className="h-3 w-3 fill-[oklch(0.65_0.2_25)] text-[oklch(0.65_0.2_25)]" />
                    For Review
                  </span>
                </div>

                <div className="grid grid-cols-10 gap-2 p-4">
                  {moduleQuestions.map((q, i) => {
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
                            ? "bg-[oklch(0.48_0.22_264)] text-background"
                            : answered
                              ? "bg-[oklch(0.48_0.22_264)]/15 text-foreground border border-[oklch(0.48_0.22_264)]/40"
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

                <div className="flex justify-center border-t border-foreground/15 p-3">
                  <button
                    onClick={() => {
                      setNavigatorOpen(false);
                      handleFinishModule();
                    }}
                    className="rounded-full border border-[oklch(0.48_0.22_264)] px-5 py-1.5 text-[13px] font-semibold text-[oklch(0.48_0.22_264)] hover:bg-[oklch(0.48_0.22_264)]/10"
                  >
                    Go to Review Page
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => setNavigatorOpen((o) => !o)}
            className="flex h-[34px] items-center gap-1 rounded-[12px] bg-foreground px-5 text-[14px] font-semibold text-background shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
          >
            Question {index + 1} of {moduleQuestions.length}
            <ChevronUp
              className={`h-4 w-4 transition-transform ${navigatorOpen ? "rotate-180" : ""}`}
              strokeWidth={2.3}
            />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          {index > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={prev}
              className="h-[34px] rounded-full border-foreground/35 px-4 text-[14px]"
            >
              Back
            </Button>
          ) : null}

          <Button
            size="sm"
            onClick={next}
            className="h-[34px] rounded-full bg-[oklch(0.56_0.2_264)] px-8 text-[14px] font-semibold text-primary-foreground hover:opacity-95"
          >
            {index === moduleQuestions.length - 1
              ? moduleKey === "rw"
                ? "Next"
                : "Finish"
              : "Next"}
          </Button>
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
              className="text-foreground/70 hover:text-foreground"
              aria-label="Close reference"
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
}

function TestHeader() {
  return (
    <header className="border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 shadow-sm">
            <Star className="h-4.5 w-4.5 fill-white text-white" />
          </div>
          <span className="font-extrabold text-[17px] tracking-tight text-slate-800 dark:text-slate-100">
            dsat<span className="text-sky-500 dark:text-sky-400">uz</span>
          </span>
        </Link>
        <Link
          to="/"
          className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-405 dark:hover:text-slate-100 transition-colors"
        >
          Exit Test
        </Link>
      </div>
    </header>
  );
}
