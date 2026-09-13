import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Create Your Free Account — DSAT Advantage" },
      {
        name: "description",
        content:
          "Register free to unlock full-length Digital SAT practice tests, an 1800+ question bank, vocabulary drills and score analytics.",
      },
      { property: "og:title", content: "Create Your Free Account — DSAT Advantage" },
      {
        property: "og:description",
        content:
          "Register free to unlock full-length Digital SAT practice tests, an 1800+ question bank and score analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomePage,
});

const PERKS = [
  { n: "1,800+", t: "Real-style question bank items" },
  { n: "Full-length", t: "Digital SAT practice tests" },
  { n: "Category", t: "Scoring and weak-spot analytics" },
  { n: "Vocabulary", t: "Flashcards built from your reading" },
];

function WelcomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/" });
    });
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -right-32 h-[34rem] w-[34rem] rounded-full bg-indigo-600/20 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
          Members only
        </span>

        <div className="space-y-5">
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Aim higher.
            <span className="block bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Score higher.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-300 sm:text-lg">
            DSAT Advantage is free, but you need an account to get in. Register once
            and your progress, answers and score history follow you everywhere.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-900/40 transition hover:scale-[1.03]"
          >
            Create free account
          </Link>
          <Link
            to="/auth"
            className="rounded-xl border border-slate-700 bg-slate-900/60 px-8 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            I already have an account
          </Link>
        </div>

        <ul className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map((p) => (
            <li
              key={p.t}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-left backdrop-blur"
            >
              <div className="text-lg font-bold text-sky-300">{p.n}</div>
              <div className="mt-1 text-sm text-slate-400">{p.t}</div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
