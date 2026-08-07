import { ArrowRight, CheckCircle2, Gauge, ShieldAlert } from "lucide-react";
import { difficultyMeta } from "../utils";

const icons = { Easy: CheckCircle2, Medium: Gauge, Hard: ShieldAlert };

export default function ModeCard({ difficulty, count = 0, active, onClick, progress }) {
  const meta = difficultyMeta[difficulty];
  const Icon = icons[difficulty];
  return (
    <button type="button" onClick={onClick} className={`mode-card ${meta.className} ${active ? "active" : ""}`}>
      <div className="mode-icon"><Icon size={25} /></div>
      <div className="mode-copy">
        <span>{difficulty} mode</span>
        <strong>{meta.label}</strong>
        <p>{meta.description}</p>
      </div>
      <div className="mode-foot">
        <span>{progress ? `${progress.completed}/${progress.total} completed` : `${count} scenarios`}</span>
        <ArrowRight size={18} />
      </div>
    </button>
  );
}
