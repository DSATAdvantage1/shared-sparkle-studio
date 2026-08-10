import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Calculator, Info, SquareRadical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  calculateScores,
  MATH_MODULE_MAX,
  RW_MODULE_MAX,
  TOTAL_MAX,
  TOTAL_MIN,
} from "@/lib/score-estimator";
import "./score-estimator.css";

export const Route = createFileRoute("/score-estimator")({
  head: () => ({
    meta: [
      { title: "SAT Score Estimator — DSAT Advantage" },
      {
        name: "description",
        content:
          "Estimate your Digital SAT score from module-by-module correct answers with adaptive scoring support.",
      },
    ],
  }),
  component: ScoreEstimatorPage,
});

function ScoreEstimatorPage() {
  const [rwModule1, setRwModule1] = useState(RW_MODULE_MAX);
  const [rwModule2, setRwModule2] = useState(RW_MODULE_MAX);
  const [mathModule1, setMathModule1] = useState(MATH_MODULE_MAX);
  const [mathModule2, setMathModule2] = useState(MATH_MODULE_MAX);
  const [adaptiveScoring, setAdaptiveScoring] = useState(true);

  const scores = useMemo(
    () =>
      calculateScores({
        rwModule1,
        rwModule2,
        mathModule1,
        mathModule2,
        adaptiveScoring,
      }),
    [rwModule1, rwModule2, mathModule1, mathModule2, adaptiveScoring],
  );

  const totalProgress =
    ((scores.total - TOTAL_MIN) / (TOTAL_MAX - TOTAL_MIN)) * 100;
  const rwProgress = ((scores.rwScore - 200) / 600) * 100;
  const mathProgress = ((scores.mathScore - 200) / 600) * 100;

  return (
    <div className="estimator-page-container">
      <div className="estimator-bg-grid" />
      <div className="estimator-glow-1" />
      <div className="estimator-glow-2" />

      <main className="estimator-content">
        <header className="estimator-header">
          <h1 className="estimator-title">Score Estimator</h1>
          <p className="estimator-subtitle">
            Calculate your projected Digital SAT score based on your module performance. Enable Adaptive Scoring for real-world simulation.
          </p>
        </header>

        <div className="estimator-dashboard">
          {/* Controls Column */}
          <div className="estimator-controls-col">
            <div className="estimator-card">
              <div className="estimator-info-box">
                <div className="estimator-info-icon">
                  <Calculator className="h-5 w-5" />
                </div>
                <div className="estimator-info-content">
                  <h3>Configuration</h3>
                  <p>
                    Adjust the sliders to input your correct answers for each module. The College Board deducts points dynamically, but this estimator safely averages a ~10 point penalty per mistake.
                  </p>
                  
                  {adaptiveScoring && (
                    <div className="estimator-rules-box">
                      <div className="estimator-rules-title">Adaptive Logic Active</div>
                      <ul className="estimator-rules-list">
                        <li><strong>R&W:</strong> Module 1 &lt; 17 correct triggers the easier Module 2 (score cap ~630).</li>
                        <li><strong>Math:</strong> Module 1 &lt; 12 correct triggers the easier Module 2 (score cap ~640).</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="estimator-toggle-row">
                <Checkbox
                  id="adaptive"
                  checked={adaptiveScoring}
                  onCheckedChange={(checked) => setAdaptiveScoring(checked === true)}
                />
                <label htmlFor="adaptive" className="estimator-toggle-label">
                  Enable Adaptive Scoring
                </label>
              </div>

              <div className="estimator-sliders">
                <ModuleSlider
                  label="Reading & Writing — Module 1"
                  value={rwModule1}
                  max={RW_MODULE_MAX}
                  onChange={setRwModule1}
                />
                <ModuleSlider
                  label="Reading & Writing — Module 2"
                  value={rwModule2}
                  max={RW_MODULE_MAX}
                  onChange={setRwModule2}
                />
                <ModuleSlider
                  label="Math — Module 1"
                  value={mathModule1}
                  max={MATH_MODULE_MAX}
                  onChange={setMathModule1}
                />
                <ModuleSlider
                  label="Math — Module 2"
                  value={mathModule2}
                  max={MATH_MODULE_MAX}
                  onChange={setMathModule2}
                />
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="estimator-results-col">
            <div className="estimator-total-card">
              <div className="estimator-total-label">Total Score</div>
              <div className="estimator-total-score">{scores.total}</div>
              <div className="estimator-total-range">
                Possible Range: {TOTAL_MIN} — {TOTAL_MAX}
              </div>
              
              <div className="estimator-progress-bg">
                <div 
                  className="estimator-progress-fill" 
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <div className="estimator-percentile">
                Estimated Percentile: ~{scores.percentile}%
              </div>
            </div>

            <div className="estimator-section-card">
              <div className="est-sec-header">
                <div className="est-sec-info">
                  <div className="est-sec-icon rw">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="est-sec-title">Reading & Writing</div>
                    <div className="est-sec-range">200 - 800 Points</div>
                  </div>
                </div>
                <div className="est-sec-score">{scores.rwScore}</div>
              </div>
              <div className="est-sec-progress-bg">
                <div 
                  className="est-sec-progress-fill rw"
                  style={{ width: `${rwProgress}%` }}
                />
              </div>
            </div>

            <div className="estimator-section-card">
              <div className="est-sec-header">
                <div className="est-sec-info">
                  <div className="est-sec-icon math">
                    <SquareRadical className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="est-sec-title">Mathematics</div>
                    <div className="est-sec-range">200 - 800 Points</div>
                  </div>
                </div>
                <div className="est-sec-score">{scores.mathScore}</div>
              </div>
              <div className="est-sec-progress-bg">
                <div 
                  className="est-sec-progress-fill math"
                  style={{ width: `${mathProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ModuleSlider({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const percent = (value / max) * 100;

  return (
    <div className="est-slider-group">
      <div className="est-slider-header">
        <div className="est-slider-label">{label}</div>
        <div className="est-slider-value-pill">
          {value} / {max}
        </div>
      </div>
      <div className="est-slider-wrap">
        <div className="est-slider-track">
          <div
            className="est-slider-fill"
            style={{ width: `${percent}%`, background: "var(--color-primary)" }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="est-slider-input"
          aria-label={label}
        />
      </div>
    </div>
  );
}
