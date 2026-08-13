import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import {
  BookOpen,
  Filter,
  ChevronDown,
  ChevronRight,
  Puzzle,
  Feather,
  Lightbulb,
  Quote,
  FileText,
  BarChart3,
  Edit3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { questionBank20260812 } from "@/lib/questionbank-2026-8-12";
import { type Question } from "@/lib/test-data";

export const Route = createFileRoute("/questions-bank/reading-writing")({
  head: () => ({
    meta: [
      { title: "Reading & Writing Question Bank — DSAT Advantage" },
      {
        name: "description",
        content:
          "Browse Reading & Writing topics and skills in the DSAT Advantage question bank.",
      },
    ],
  }),
  component: ReadingWritingBank,
});

export type Skill = { name: string; count: number };
export type Domain = {
  name: string;
  count: number;
  icon: React.ReactNode;
  skills: Skill[];
};

export function normalizeBankQuestion(row: any, index = 0): Question {
  const choices = Array.isArray(row?.choices)
    ? row.choices
        .filter((choice: unknown) => typeof choice === "string")
        .map((choice: string) => choice.trim())
    : [];

  const answerValue = String(row?.correct_answer ?? row?.correct ?? "A");
  const answerIndex = ["A", "B", "C", "D"].indexOf(answerValue.toUpperCase());

  return {
    id:
      typeof row?.id === "number"
        ? row.id
        : Number.isFinite(Number(row?.id))
          ? Number(row.id)
          : Date.now() + index,
    module: row?.section === "MATH" ? "math" : "rw",
    passage: row?.passage ?? "",
    prompt: row?.prompt ?? "",
    choices: choices.length ? choices : ["", "", "", ""],
    correct: answerIndex >= 0 ? answerIndex : 0,
    explanation: row?.explanation ?? "",
    domain: row?.domain ?? "",
    skill: row?.skill ?? "",
    difficulty: String(row?.difficulty ?? "medium").toLowerCase(),
    questionType: row?.question_type ?? row?.questionType ?? "",
    graph: row?.graph && typeof row.graph === "object" ? row.graph : undefined,
  };
}

export function useQuestionBankData() {
  const [liveQuestions, setLiveQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("bank_questions")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(500);

        if (!mounted || error) {
          if (mounted) setLiveQuestions([]);
          return;
        }

        setLiveQuestions(
          (data ?? []).map((row: any, index: number) => normalizeBankQuestion(row, index)),
        );
      } catch {
        if (mounted) setLiveQuestions([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(
    () => [...questionBank20260812, ...liveQuestions],
    [liveQuestions],
  );
}

const domains: Domain[] = [
  {
    name: "Craft and Structure",
    count: 1240,
    icon: <Puzzle className="h-6 w-6" />,
    skills: [
      { name: "Words in Context", count: 690 },
      { name: "Text Structure and Purpose", count: 392 },
      { name: "Cross-Text Connections", count: 158 },
    ],
  },
  {
    name: "Expression of Ideas",
    count: 1049,
    icon: <Feather className="h-6 w-6" />,
    skills: [
      { name: "Rhetorical Synthesis", count: 550 },
      { name: "Transitions", count: 499 },
    ],
  },
  {
    name: "Information and Ideas",
    count: 1438,
    icon: <Lightbulb className="h-6 w-6" />,
    skills: [
      { name: "Command of Evidence", count: 736 },
      { name: "Central Ideas and Details", count: 355 },
      { name: "Inferences", count: 347 },
    ],
  },
  {
    name: "Standard English Conventions",
    count: 1098,
    icon: <Quote className="h-6 w-6" />,
    skills: [
      { name: "Form, Structure, and Sense", count: 553 },
      { name: "Boundaries", count: 545 },
    ],
  },
];

function ReadingWritingBank() {
  const questions = useQuestionBankData();
  const sectionCount = questions.filter(
    (question) => question.module === "rw",
  ).length;
  const totalCount = questions.length;

  return (
    <BankPage
      sectionTitle="Reading & Writing"
      sectionCount={sectionCount}
      totalCount={totalCount}
      description="Improve your reading comprehension and writing skills."
      accent="pink"
      icon={<BookOpen className="h-8 w-8" />}
      domains={domains}
      questionSource={questions}
    />
  );
}

type Difficulty = "all" | "easy" | "medium" | "hard";

export function BankPage({
  sectionTitle,
  sectionCount,
  totalCount,
  description,
  accent,
  icon,
  domains,
  questionSource,
}: {
  sectionTitle: string;
  sectionCount: number;
  totalCount: number;
  description: string;
  accent: "pink" | "blue";
  icon: React.ReactNode;
  domains: Domain[];
  questionSource: Question[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(domains.map((d) => [d.name, true])),
  );

  const sectionModule = sectionTitle === "Math" ? "math" : "rw";

  const storageKey = `qb:${sectionModule}:difficulty`;

  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [difficultyOpen, setDifficultyOpen] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    if (raw === "all" || raw === "easy" || raw === "medium" || raw === "hard") {
      setDifficulty(raw);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, difficulty);
  }, [difficulty, storageKey]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(storageKey);
    };
  }, [storageKey]);

  const filteredQuestions = useMemo(() => {
    if (difficulty === "all")
      return questionSource.filter((q) => q.module === sectionModule);
    return questionSource.filter(
      (q) => q.module === sectionModule && q.difficulty === difficulty,
    );
  }, [difficulty, questionSource, sectionModule]);

  const difficultySectionCount = filteredQuestions.length;
  const difficultyTotalCount =
    difficulty === "all"
      ? totalCount
      : questionSource.filter((q) => q.difficulty === difficulty).length;

  const domainCounts = useMemo(() => {
    const map = new Map<string, Map<string, number>>();

    for (const q of filteredQuestions) {
      const domainName = q.domain ?? "Uncategorized";
      const skillName = q.skill ?? "Uncategorized";
      if (!map.has(domainName)) map.set(domainName, new Map());
      const inner = map.get(domainName)!;
      inner.set(skillName, (inner.get(skillName) ?? 0) + 1);
    }

    return map;
  }, [filteredQuestions]);

  const displayedDomains: Domain[] = useMemo(() => {
    return domains.map((d) => {
      const inner = domainCounts.get(d.name) ?? new Map();
      const skills = d.skills.map((s) => {
        const count = inner.get(s.name) ?? 0;
        return { ...s, count };
      });

      const count = skills.reduce((sum, s) => sum + s.count, 0);
      return {
        ...d,
        count,
        skills,
      };
    });
  }, [domains, domainCounts]);

  // Placeholder for future progress integration.
  // If/when we add progress tracking to the Question Bank section,
  // this memo should derive from `filteredQuestions`.
  const progressAccuracyText = "0% accuracy";
  const progressErrorsText = "0 errors";

  const palette =
    accent === "pink"
      ? {
          bg: "bg-[linear-gradient(180deg,#fde6ee_0%,#fce7f3_50%,#fff1f6_100%)]",
          accentText: "text-rose-500",
          accentBg: "bg-rose-500",
          accentSoft: "bg-rose-100",
          accentRing: "border-rose-200/70",
          iconTile: "bg-gradient-to-br from-rose-400 to-pink-500 text-white",
          dotBg: "bg-rose-500",
          btn: "bg-gradient-to-r from-rose-400 to-pink-500 text-white",
          chipBg: "bg-white/70",
        }
      : {
          bg: "bg-[linear-gradient(180deg,#eef2ff_0%,#e0e7ff_50%,#f5f7ff_100%)]",
          accentText: "text-blue-600",
          accentBg: "bg-blue-600",
          accentSoft: "bg-blue-100",
          accentRing: "border-blue-200/70",
          iconTile: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
          dotBg: "bg-blue-500",
          btn: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
          chipBg: "bg-white/70",
        };

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${palette.bg} animate-fade-in`}
    >
      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-3xl ${palette.iconTile} shadow-xl`}
            >
              {icon}
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                {sectionTitle}
              </h1>
              <p className={`mt-1 text-base font-bold ${palette.accentText}`}>
                {sectionCount.toLocaleString()} questions
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatPill
              icon={<FileText className={`h-5 w-5 ${palette.accentText}`} />}
              soft={palette.accentSoft}
              value={difficultySectionCount.toLocaleString()}
              label="questions"
            />
            <StatPill
              icon={<BarChart3 className={`h-5 w-5 ${palette.accentText}`} />}
              soft={palette.accentSoft}
              value={difficultyTotalCount.toLocaleString()}
              label="total"
            />
          </div>
        </div>

        {/* Filter row */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDifficultyOpen((v) => !v)}
              className={`inline-flex items-center gap-3 rounded-2xl border border-white/70 ${palette.chipBg} px-5 py-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur hover:bg-white`}
              aria-haspopup="listbox"
              aria-expanded={difficultyOpen}
            >
              <Filter className="h-4 w-4 text-muted-foreground" />
              Difficulty: {difficulty[0].toUpperCase() + difficulty.slice(1)}
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${difficultyOpen ? "rotate-180" : ""}`}
              />
            </button>

            {difficultyOpen && (
              <div
                className={`absolute left-0 mt-2 w-56 rounded-2xl border ${palette.accentRing} bg-white/80 shadow-xl backdrop-blur-xl p-2 z-20 animate-fade-in`}
                role="listbox"
              >
                {(["all", "easy", "medium", "hard"] as Difficulty[]).map(
                  (d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDifficulty(d);
                        setDifficultyOpen(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-white/80 ${
                        difficulty === d
                          ? accent === "pink"
                            ? "text-rose-700"
                            : "text-blue-700"
                          : "text-foreground"
                      }`}
                    >
                      {d[0].toUpperCase() + d.slice(1)}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          <button
            className={`inline-flex items-center gap-2 rounded-2xl ${palette.btn} px-6 py-3 text-sm font-bold shadow-lg transition hover:translate-x-0.5`}
          >
            Browse Section
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Domain cards */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {displayedDomains.map((d) => {
            const isOpen = open[d.name];
            return (
              <div
                key={d.name}
                className={`rounded-3xl border ${palette.accentRing} bg-white/70 p-6 shadow-xl shadow-rose-500/5 backdrop-blur-xl`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${palette.accentSoft} ${palette.accentText} shadow-sm`}
                  >
                    {d.icon}
                  </div>
                  <button
                    onClick={() =>
                      setOpen((p) => ({ ...p, [d.name]: !p[d.name] }))
                    }
                    className="flex flex-1 items-center justify-between"
                    aria-label={`Toggle ${d.name}`}
                  >
                    <h3 className="text-lg font-extrabold text-foreground">
                      {d.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{d.count.toLocaleString()} questions</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-5 rounded-2xl bg-white/60 p-4">
                    <ul className="space-y-3">
                      {d.skills.map((s) => (
                        <li
                          key={s.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="flex items-center gap-3 text-foreground">
                            <span
                              className={`h-2 w-2 rounded-full ${palette.dotBg}`}
                            />
                            <Link
                              to="/questions-bank/practice"
                              search={{
                                section:
                                  sectionTitle === "Math" ? "MATH" : "RW",
                                domain: d.name,
                                skill: s.name,
                              }}
                              className="underline-offset-4 hover:underline"
                            >
                              {s.name}
                            </Link>
                          </span>
                          <span className="text-muted-foreground">
                            {s.count.toLocaleString()} questions
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/80">
                    <div className={`h-full w-[2%] ${palette.accentBg}`} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={`font-semibold ${palette.accentText}`}>
                      {progressAccuracyText}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${palette.accentText}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {progressErrorsText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/questions-bank"
            className={`text-sm font-semibold ${palette.accentText} hover:underline`}
          >
            ← Back to Question Bank
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatPill({
  icon,
  soft,
  value,
  label,
}: {
  icon: React.ReactNode;
  soft: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${soft}`}
      >
        {icon}
      </div>
      <div className="text-right">
        <div className="text-lg font-black leading-none text-foreground">
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
