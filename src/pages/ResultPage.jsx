import { Award, BookOpenCheck, ChevronDown, RotateCcw, Sparkles, Trophy, Zap } from "lucide-react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { resultTone } from "../utils";

export default function ResultPage() {
  const { state } = useLocation();
  if (!state) return <Navigate to="/history" replace />;
  const tone = resultTone(state.percentage);
  const strongDecisions = state.review?.filter((item) => item.score >= item.maxScore * 0.8).length || 0;

  return (
    <div className={`result-page result-${tone}`}>
      <section className="result-hero-card">
        <div className="result-celebration"><Sparkles size={22} /><span>Scenario complete</span></div>
        <h1>{state.scenarioTitle}</h1>
        <p className="result-mode">{state.difficulty} mode performance report</p>
        <div className="result-ring"><strong>{state.percentage}%</strong><span>{state.resultLevel}</span></div>
        <div className="result-metrics">
          <div><Trophy size={21} /><strong>{state.totalScore}/{state.maxScore}</strong><span>decision points</span></div>
          <div><Award size={21} /><strong>{strongDecisions}/{state.review?.length || 0}</strong><span>strong decisions</span></div>
          <div><Zap size={21} /><strong>+{state.xpEarned} XP</strong><span>experience earned</span></div>
        </div>
        <div className="button-row result-buttons"><Link className="primary-button" to="/scenarios">Choose next scenario <BookOpenCheck size={18} /></Link><Link className="secondary-button" to="/history">View full history</Link></div>
      </section>

      <section className="decision-review-section">
        <div className="section-heading"><div><span className="eyebrow">Decision review</span><h2>What your choices showed</h2></div></div>
        <div className="review-list">
          {state.review?.map((item) => (
            <details key={item.stepNumber} className={`review-item ${item.score >= item.maxScore * .8 ? "good" : item.score >= item.maxScore * .5 ? "okay" : "weak"}`}>
              <summary><span className="review-number">{item.stepNumber}</span><div><strong>{item.question}</strong><span>{item.score}/{item.maxScore} points</span></div><ChevronDown size={19} /></summary>
              <div className="review-body"><p><b>Your decision:</b> {item.selectedText}</p><p>{item.feedback}</p></div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
