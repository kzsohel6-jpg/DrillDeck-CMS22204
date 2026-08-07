import { ArrowRight, Clock3, Layers3, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { difficultyMeta, imageUrl } from "../utils";

export default function ScenarioCard({ scenario, adminActions }) {
  const mode = difficultyMeta[scenario.difficulty] || difficultyMeta.Medium;
  const skills = scenario.skills || String(scenario.skillFocus || "Decision-making").split(",").map((item) => item.trim()).filter(Boolean);

  return (
    <article className={`scenario-card scenario-${mode.className}`}>
      <div className="scenario-image-wrap">
        <img className="scenario-image" src={imageUrl(scenario)} alt="" />
        <div className="scenario-image-overlay" />
        <span className={`difficulty ${mode.className}`}>{scenario.difficulty} · {mode.label}</span>
      </div>
      <div className="scenario-body">
        <span className="pill">{scenario.category}</span>
        <h3>{scenario.title}</h3>
        <p>{scenario.description}</p>
        <div className="skill-row">
          {skills.slice(0, 3).map((skill) => <span key={skill}><Target size={13} /> {skill}</span>)}
        </div>
        <div className="scenario-meta">
          <span><Layers3 size={16} /> {scenario.stepCount ?? scenario.steps?.length ?? 0} decisions</span>
          <span><Clock3 size={16} /> {scenario.durationMinutes || 8} min</span>
        </div>
        {adminActions || (
          <Link className={`primary-button mode-button ${mode.className}`} to={`/scenarios/${scenario.id}`}>
            Begin scenario <ArrowRight size={17} />
          </Link>
        )}
      </div>
    </article>
  );
}
