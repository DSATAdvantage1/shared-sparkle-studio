export const RW_MODULE_MAX = 27;
export const MATH_MODULE_MAX = 22;
export const SECTION_MAX = 800;
export const TOTAL_MAX = 1600;
export const TOTAL_MIN = 400;
export const PENALTY_PER_MISTAKE = 10;

export type ScoreInputs = {
  rwModule1: number;
  rwModule2: number;
  mathModule1: number;
  mathModule2: number;
  adaptiveScoring: boolean;
};

export type ScoreResult = {
  rwScore: number;
  mathScore: number;
  total: number;
  rwMistakes: number;
  mathMistakes: number;
  percentile: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function estimatePercentile(total: number) {
  if (total >= 1570) return 99;
  if (total >= 1500) return 98;
  if (total >= 1450) return 96;
  if (total >= 1400) return 94;
  if (total >= 1350) return 90;
  if (total >= 1300) return 87;
  if (total >= 1250) return 82;
  if (total >= 1200) return 75;
  if (total >= 1150) return 68;
  if (total >= 1100) return 60;
  if (total >= 1050) return 52;
  if (total >= 1000) return 45;
  if (total >= 950) return 38;
  if (total >= 900) return 30;
  if (total >= 850) return 22;
  if (total >= 800) return 15;
  if (total >= 700) return 8;
  return 3;
}

export function calculateScores(input: ScoreInputs): ScoreResult {
  const rwMistakes =
    RW_MODULE_MAX - input.rwModule1 + (RW_MODULE_MAX - input.rwModule2);
  const mathMistakes =
    MATH_MODULE_MAX - input.mathModule1 + (MATH_MODULE_MAX - input.mathModule2);

  let rwScore = SECTION_MAX - rwMistakes * PENALTY_PER_MISTAKE;
  let mathScore = SECTION_MAX - mathMistakes * PENALTY_PER_MISTAKE;

  if (input.adaptiveScoring) {
    if (input.rwModule1 < 17) rwScore = Math.min(rwScore, 630);
    if (input.mathModule1 < 12) mathScore = Math.min(mathScore, 640);
  }

  rwScore = clamp(rwScore, 200, SECTION_MAX);
  mathScore = clamp(mathScore, 200, SECTION_MAX);
  const total = clamp(rwScore + mathScore, TOTAL_MIN, TOTAL_MAX);

  return {
    rwScore,
    mathScore,
    total,
    rwMistakes,
    mathMistakes,
    percentile: estimatePercentile(total),
  };
}
