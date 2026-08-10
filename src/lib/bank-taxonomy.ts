export type BankSkill = { name: string; count?: number };
export type BankDomain = { name: string; skills: BankSkill[] };

export const BANK_TAXONOMY: Record<"RW" | "MATH", BankDomain[]> = {
  RW: [
    {
      name: "Craft and Structure",
      skills: [
        { name: "Words in Context" },
        { name: "Text Structure and Purpose" },
        { name: "Cross-Text Connections" },
      ],
    },
    {
      name: "Expression of Ideas",
      skills: [{ name: "Rhetorical Synthesis" }, { name: "Transitions" }],
    },
    {
      name: "Information and Ideas",
      skills: [
        { name: "Command of Evidence" },
        { name: "Central Ideas and Details" },
        { name: "Inferences" },
      ],
    },
    {
      name: "Standard English Conventions",
      skills: [{ name: "Form, Structure, and Sense" }, { name: "Boundaries" }],
    },
  ],
  MATH: [
    {
      name: "Advanced Math",
      skills: [
        { name: "Nonlinear functions" },
        {
          name: "Nonlinear equations in one variable and systems of equations in two variables",
        },
        { name: "Equivalent expressions" },
      ],
    },
    {
      name: "Algebra",
      skills: [
        { name: "Linear functions" },
        { name: "Linear equations in two variables" },
        { name: "Systems of two linear equations in two variables" },
        { name: "Linear equations in one variable" },
        { name: "Linear inequalities in one or two variables" },
      ],
    },
    {
      name: "Geometry and Trigonometry",
      skills: [
        { name: "Area and volume" },
        { name: "Lines, angles, and triangles" },
        { name: "Right triangles and trigonometry" },
        { name: "Circles" },
      ],
    },
    {
      name: "Problem-Solving and Data Analysis",
      skills: [
        { name: "Ratios, rates, proportional relationships, and units" },
        { name: "Percentages" },
        {
          name: "One-variable data: Distributions and measures of center and spread",
        },
        { name: "Two-variable data: Models and scatterplots" },
        { name: "Probability and conditional probability" },
      ],
    },
  ],
};
