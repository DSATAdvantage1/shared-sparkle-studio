import { createFileRoute } from "@tanstack/react-router";

import {
  Calculator,
  FunctionSquare,
  Superscript,
  Triangle,
  BarChart3,
} from "lucide-react";

import {
  BankPage,
  type Domain,
  useQuestionBankData,
} from "./questions-bank.reading-writing";

export const Route = createFileRoute("/questions-bank/math")({
  head: () => ({
    meta: [
      { title: "Math Question Bank — DSAT Advantage" },
      {
        name: "description",
        content:
          "Browse Math topics and skills in the DSAT Advantage question bank.",
      },
    ],
  }),
  component: MathBank,
});

const mathDomains: Domain[] = [
  {
    name: "Advanced Math",
    count: 1319,
    icon: <FunctionSquare className="h-6 w-6" />,
    skills: [
      { name: "Nonlinear functions", count: 609 },
      {
        name: "Nonlinear equations in one variable and systems of equations in two variables",
        count: 431,
      },
      { name: "Equivalent expressions", count: 279 },
    ],
  },
  {
    name: "Algebra",
    count: 1705,
    icon: <Superscript className="h-6 w-6" />,
    skills: [
      { name: "Linear functions", count: 471 },
      { name: "Linear equations in two variables", count: 384 },
      { name: "Systems of two linear equations in two variables", count: 354 },
      { name: "Linear equations in one variable", count: 303 },
      { name: "Linear inequalities in one or two variables", count: 213 },
    ],
  },
  {
    name: "Geometry and Trigonometry",
    count: 666,
    icon: <Triangle className="h-6 w-6" />,
    skills: [
      { name: "Area and volume", count: 267 },
      { name: "Lines, angles, and triangles", count: 212 },
      { name: "Right triangles and trigonometry", count: 134 },
      { name: "Circles", count: 53 },
    ],
  },
  {
    name: "Problem-Solving and Data Analysis",
    count: 1086,
    icon: <BarChart3 className="h-6 w-6" />,
    skills: [
      {
        name: "Ratios, rates, proportional relationships, and units",
        count: 255,
      },
      { name: "Percentages", count: 234 },
      {
        name: "One-variable data: Distributions and measures of center and spread",
        count: 226,
      },
      { name: "Two-variable data: Models and scatterplots", count: 183 },
      { name: "Probability and conditional probability", count: 152 },
    ],
  },
];

function MathBank() {
  const questions = useQuestionBankData();
  const sectionCount = questions.filter(
    (question) => question.module === "math",
  ).length;
  const totalCount = questions.length;

  return (
    <BankPage
      sectionTitle="Math"
      sectionCount={sectionCount}
      totalCount={totalCount}
      description="Practice algebra, problem solving, and math concepts."
      accent="blue"
      icon={<Calculator className="h-8 w-8" />}
      domains={mathDomains}
      questionSource={questions}
    />
  );
}
