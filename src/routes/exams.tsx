import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

function formatMs(ms: number) {
  if (!Number.isFinite(ms)) return "?";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
import { listPublishedTests } from "@/server-fns/admin.functions";
import { usePrefersReducedMotion } from "./exams.animations";
import { requestTransition } from "./pageTransitionStore";
import "./exams.css";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "Exams — DSAT Advantage" },
      {
        name: "description",
        content:
          "Browse all official-style Digital SAT practice exams from March 2023 through March 2026 on DSAT Advantage.",
      },
      { property: "og:title", content: "Exams — DSAT Advantage" },
      {
        property: "og:description",
        content:
          "All Digital SAT practice exams from March 2023 to March 2026, filterable by year and section.",
      },
    ],
  }),
  component: Index,
});

type Section = "RW" | "MATH" | "MIXED"; // backend supports MIXED; UI filter will hide explicit MIXED button
type Exam = {
  id: string;
  section: Section;
  month: string;
  year: number;
  questions: number;
  status: "start" | "resume";
  dbId?: string;
  title?: string;
};

const MONTHS = [
  "March",
  "May",
  "June",
  "August",
  "October",
  "November",
  "December",
] as const;

const MONTH_INDEX: Record<(typeof MONTHS)[number], number> = {
  March: 3,
  May: 5,
  June: 6,
  August: 8,
  October: 10,
  November: 11,
  December: 12,
};

function qcount(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 15 + (h % 46);
}

function buildExams(): Exam[] {
  const list: Exam[] = [];

  for (let y = 2023; y <= 2026; y++) {
    for (const m of MONTHS) {
      const mi = MONTH_INDEX[m];
      if (y === 2023 && mi < 3) continue;
      if (y === 2026 && mi > 3) continue;

      for (const section of ["RW", "MATH"] as Section[]) {
        const id = `${section.toLowerCase()}-${m.toLowerCase()}-${y}`;
        list.push({
          id,
          section,
          month: m,
          year: y,
          questions: qcount(id),
          status: "start",
        });
      }
    }
  }

  list
    .slice()
    .sort(
      (a, b) =>
        b.year - a.year ||
        MONTH_INDEX[b.month as (typeof MONTHS)[number]] -
          MONTH_INDEX[a.month as (typeof MONTHS)[number]],
    )
    .slice(0, 2)
    .forEach((e) => (e.status = "resume"));
  return list;
}

const EXAMS = buildExams();

type YearFilter = "ALL" | 2023 | 2024 | 2025 | 2026;
type SectionFilter = "ALL" | Section;

function Index() {
  const reduced = usePrefersReducedMotion();
  const [year, setYear] = useState<YearFilter>("ALL");
  const [section, setSection] = useState<SectionFilter>("ALL");
  const [dbExams, setDbExams] = useState<Exam[]>([]);

  useEffect(() => {
    let cancelled = false;

    const startedAt = performance.now();
    let dbResolvedAt = 0;

    (async () => {
      setIsLoading(true);
      const fetchStart = performance.now();

      let data;
      try {
        const serverFnStart = performance.now();
        data = await listPublishedTests();
        dbResolvedAt = performance.now();

        // Log: client->server + serverFn resolution time
        console.log(
          "[exams] serverFn listPublishedTests resolved:",
          formatMs(dbResolvedAt - serverFnStart),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load published tests", error);
        }
        setIsLoading(false);
        return;
      }

      if (cancelled) return;

      const mappedStart = performance.now();
      const mapped: Exam[] = data
        .filter(
          (t) =>
            t.section === "RW" || t.section === "MATH" || t.section === "MIXED",
        )
        .map((t) => {
          const qs = Array.isArray(t.questions)
            ? t.questions.length
            : typeof t.questions === "string"
              ? 0
              : 0;
          return {
            id: `db-${t.id}`,
            dbId: t.id,
            section: t.section as Section,
            month: t.month ?? "",
            year: t.year ?? new Date().getFullYear(),
            questions: qs,
            status: "start" as const,
            title: t.title,
          };
        });
      const mappedDone = performance.now();

      // Log: total client fetch time + client mapping time
      console.log(
        "[exams] client fetch->resolve:",
        formatMs(dbResolvedAt - fetchStart),
      );
      console.log(
        "[exams] client mapping:",
        formatMs(mappedDone - mappedStart),
      );
      console.log(
        "[exams] total until setDbExams:",
        formatMs(mappedDone - startedAt),
      );

      setDbExams(mapped);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return dbExams
      .filter(
        (e) =>
          (year === "ALL" || e.year === year) &&
          (section === "ALL" || e.section === section),
      )
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        const mb = MONTH_INDEX[b.month as (typeof MONTHS)[number]] ?? 0;
        const ma = MONTH_INDEX[a.month as (typeof MONTHS)[number]] ?? 0;
        if (mb !== ma) return mb - ma;
        return a.section.localeCompare(b.section);
      });
  }, [year, section, dbExams]);

  const yearOptions: YearFilter[] = ["ALL", 2026, 2025, 2024, 2023];
  const sectionOptions: SectionFilter[] = ["ALL", "RW", "MATH"];

  const [isLoading, setIsLoading] = useState(true);

  const skeletonCount = 6;

  return (
    <div className="exams-page-container">
      <div className="exams-bg-grid" />
      <div className="exams-glow-1" />
      <div className="exams-glow-2" />
      
      <main className="exams-main" style={reduced ? undefined : { animation: "practice-page-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both" }}>
        
        <header className="exams-header">
          <h1 className="exams-title">Practice Exams</h1>
          <p className="exams-subtitle">
            Browse all official-style Digital SAT practice exams from March 2023 through March 2026.
          </p>
        </header>

        <div className="exams-controls-bar">
          <div className="exams-filter-group">
            <span className="exams-filter-label">Year</span>
            <div className="exams-filter-buttons">
              {yearOptions.map((o) => (
                <button
                  key={String(o)}
                  onClick={() => setYear(o)}
                  className={`exams-filter-btn ${year === o ? 'active' : ''}`}
                >
                  {String(o)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="exams-filter-group">
            <span className="exams-filter-label">Section</span>
            <div className="exams-filter-buttons">
              {sectionOptions.map((o) => (
                <button
                  key={o}
                  onClick={() => setSection(o)}
                  className={`exams-filter-btn ${section === o ? 'active' : ''}`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="exams-grid">
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, idx) => (
                <div key={`sk-${idx}`} className="exams-skeleton">
                  <div className="flex justify-between mb-4">
                    <div className="h-6 w-24 rounded-full bg-slate-200/50 skeleton-pulse" />
                    <div className="h-8 w-8 rounded-xl bg-slate-200/50 skeleton-pulse" />
                  </div>
                  <div className="h-8 w-3/4 rounded-lg bg-slate-200/50 skeleton-pulse mb-6" />
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="h-16 rounded-xl bg-slate-100/50 skeleton-pulse" />
                    <div className="h-16 rounded-xl bg-slate-100/50 skeleton-pulse" />
                  </div>
                  <div className="h-12 w-full rounded-full bg-slate-200/50 skeleton-pulse mt-auto" />
                </div>
              ))
            : (() => {
                const examsToRender = filtered;
                if (examsToRender.length === 0) {
                  return (
                    <div className="col-span-full py-16 text-center">
                      <p className="text-lg font-semibold text-slate-500">
                        No exams match your filters.
                      </p>
                    </div>
                  );
                }
                return examsToRender.map((exam) => (
                  <div key={exam.id} data-practice-card-index={exam.id}>
                    <ExamCard exam={exam} reduced={reduced} />
                  </div>
                ));
              })()}
        </div>
      </main>
    </div>
  );
}

function FilterGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full bg-slate-100 p-1 shadow-sm">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-sky-600 text-white shadow-[0_0_0_1px_rgba(2,132,199,0.15),0_10px_30px_-18px_rgba(2,132,199,0.7)]"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ExamCard({
  exam,
  reduced: reducedProp,
}: {
  exam: Exam;
  reduced: boolean;
}) {
  const reduced = reducedProp;
  const title = exam.title ?? `${exam.month} ${exam.year} — ${exam.section}`;
  const search = exam.dbId
    ? { testId: exam.dbId }
    : exam.month === "November" && exam.year === 2025
      ? { set: "nov-2025" }
      : {};

  return (
    <article className="exams-card">
      <div className="exams-card-header">
        <span className="exams-card-badge">
          {exam.questions} Qs
        </span>
        <div className="exams-card-icon">
          <CalendarDays className="h-5 w-5" />
        </div>
      </div>
      
      <h2 className="exams-card-title">
        {title}
      </h2>
      
      <div className="exams-card-details">
        <div className="exams-detail-box">
          <p className="exams-detail-label">Section</p>
          <p className="exams-detail-value">{exam.section}</p>
        </div>
        <div className="exams-detail-box">
          <p className="exams-detail-label">Duration</p>
          <p className="exams-detail-value">2h 14m</p>
        </div>
      </div>
      
      <Link
        to="/test"
        search={search}
        onClick={() => requestTransition("practice-exam")}
        className="exams-start-btn"
        style={
          reduced
            ? undefined
            : {
                opacity: 1,
                transform: "none",
                transition: "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                transitionDelay: "60ms",
              }
        }
      >
        Start Exam
      </Link>
    </article>
  );
}
