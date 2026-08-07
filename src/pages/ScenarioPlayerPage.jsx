import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Shuffle, Target } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { difficultyMeta, imageUrl, shuffleChoices } from "../utils";

export default function ScenarioPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingChoice, setCheckingChoice] = useState(false);
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    api.get(`/scenarios/${id}`)
      .then((response) => {
        const prepared = {
          ...response.data,
          steps: response.data.steps.map((step) => ({
            ...step,
            choices: shuffleChoices(step.choices),
          })),
        };
        setScenario(prepared);
      })
      .catch((err) => setError(err.response?.data?.message || "Unable to load scenario"));
  }, [id]);

  if (error && !scenario) {
    return <div className="player-page"><div className="alert error">{error}</div><Link className="secondary-button" to="/scenarios">Back to library</Link></div>;
  }
  if (!scenario) {
    return <div className="player-page loading-screen"><div className="loader" /><p>Preparing your decision environment...</p></div>;
  }

  const step = scenario.steps[stepIndex];
  const progress = ((stepIndex + 1) / scenario.steps.length) * 100;
  const mode = difficultyMeta[scenario.difficulty];

  async function selectChoice(choiceId) {
    if (selected || checkingChoice) return;
    setCheckingChoice(true);
    setError("");

    try {
      const { data } = await api.post(`/scenarios/${scenario.id}/feedback`, {
        stepId: step.id,
        choiceId,
      });
      setSelected(choiceId);
      setFeedback(data);
      setEarned((current) => current + data.score);
      setAnswers((current) => [...current, { stepId: step.id, choiceId }]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to check this choice");
    } finally {
      setCheckingChoice(false);
    }
  }

  async function next() {
    if (!selected) return;
    if (stepIndex < scenario.steps.length - 1) {
      setStepIndex((current) => current + 1);
      setSelected(null);
      setFeedback(null);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/attempts", {
        scenarioId: scenario.id,
        answers,
      });
      navigate("/result", { state: data, replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save attempt");
      setSubmitting(false);
    }
  }

  return (
    <div className={`player-page player-${mode.className}`}>
      <Link className="back-link" to="/scenarios"><ArrowLeft size={17} /> Leave scenario</Link>

      <section className="player-banner">
        <img src={imageUrl(scenario)} alt={`${scenario.title} scenario illustration`} />
        <div className="player-banner-overlay" />
        <div className="player-banner-copy">
          <div className="card-topline">
            <span className="pill">{scenario.category}</span>
            <span className={`difficulty ${mode.className}`}>{scenario.difficulty} · {mode.label}</span>
          </div>
          <h1>{scenario.title}</h1>
          <div className="banner-meta">
            <span><Clock3 size={16} /> {scenario.durationMinutes} min</span>
            <span><Target size={16} /> {scenario.skills?.join(" · ")}</span>
            <span><Shuffle size={16} /> Answer order randomised</span>
          </div>
        </div>
      </section>

      <div className="player-status">
        <div><span>Decision {stepIndex + 1} of {scenario.steps.length}</span><strong>{Math.round(progress)}% complete</strong></div>
        <div className="live-score"><span>Points earned</span><strong>{earned}</strong></div>
      </div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>

      {error && <div className="alert error">{error}</div>}

      <article className="decision-panel enhanced-decision">
        <div className="decision-number">{String(stepIndex + 1).padStart(2, "0")}</div>
        <span className="eyebrow">Current situation</span>
        <p className="situation">{step.situation}</p>
        <h2>{step.question}</h2>

        <div className="choice-list">
          {step.choices.map((choice, index) => (
            <button
              key={choice.id}
              className={selected === choice.id ? "choice selected" : "choice"}
              onClick={() => selectChoice(choice.id)}
              disabled={Boolean(selected) || checkingChoice}
            >
              <span className="choice-letter">{String.fromCharCode(65 + index)}</span>
              <span>{choice.text}</span>
              {selected === choice.id && <CheckCircle2 size={20} />}
            </button>
          ))}
        </div>

        {feedback && (
          <div className={`feedback ${feedback.score >= feedback.maxScore * .8 ? "positive" : feedback.score >= feedback.maxScore * .5 ? "neutral" : "negative"}`}>
            <div className="feedback-head"><strong>Decision coaching</strong><span>{feedback.score}/{feedback.maxScore} points</span></div>
            <p>{feedback.feedback}</p>
          </div>
        )}

        <div className="decision-actions">
          <span>{checkingChoice ? "Checking your decision securely..." : feedback ? "Feedback unlocked. Continue when ready." : "Choose the action you would take."}</span>
          <button className={`primary-button mode-button ${mode.className}`} disabled={!selected || submitting} onClick={next}>
            {submitting ? "Saving result..." : stepIndex === scenario.steps.length - 1 ? "Complete scenario" : "Next decision"}
          </button>
        </div>
      </article>
    </div>
  );
}
