import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { ArrowRight, BookOpen, Calculator } from "lucide-react";
import logo from "@/assets/dsat-advantage-logo.png";
import "./questions-bank.css";
import { useQuestionBankData } from "./questions-bank.reading-writing";

export const Route = createFileRoute("/questions-bank")({
  head: () => ({
    meta: [
      { title: "Question Bank — DSAT Advantage" },
      {
        name: "description",
        content:
          "Browse the full DSAT Advantage question bank across Reading & Writing and Math sets.",
      },
    ],
  }),
  component: QuestionBank,
});

function QuestionBank() {
  const location = useLocation();
  const isRoot = location.pathname === "/questions-bank";
  const questions = useQuestionBankData();

  const totalCount = questions.length;
  const rwCount = questions.filter(
    (question) => question.module === "rw",
  ).length;
  const mathCount = questions.filter(
    (question) => question.module === "math",
  ).length;

  if (!isRoot) {
    return <Outlet />;
  }

  return (
    <div className="qbank-page-container">
      <div className="qbank-bg-grid" />
      <div className="qbank-glow" />
      
      <main className="qbank-main">
        <div className="qbank-logo-box">
          <img
            src={logo}
            alt="DSAT Advantage"
            className="h-12 w-12 rounded-xl object-cover"
          />
        </div>

        <h1 className="qbank-title">
          Question Bank
        </h1>
        <p className="qbank-subtitle">
          Choose a section to start practicing.
        </p>

        <div className="qbank-grid">
          <Link
            to="/questions-bank/reading-writing"
            className="qbank-card rw"
          >
            <span className="qbank-card-content">
              <span className="qbank-icon-box">
                <BookOpen className="h-6 w-6" />
              </span>
              <span className="qbank-card-title">
                Reading &amp; Writing
              </span>
            </span>
            <ArrowRight className="h-5 w-5 qbank-arrow" />
          </Link>

          <Link
            to="/questions-bank/math"
            className="qbank-card math"
          >
            <span className="qbank-card-content">
              <span className="qbank-icon-box">
                <Calculator className="h-6 w-6" />
              </span>
              <span className="qbank-card-title">
                Math
              </span>
            </span>
            <ArrowRight className="h-5 w-5 qbank-arrow" />
          </Link>
        </div>
      </main>
    </div>
  );
}
