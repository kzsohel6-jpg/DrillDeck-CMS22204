import { useEffect, useState } from "react";
import { CalendarDays, Database, Eye, Trophy, X } from "lucide-react";
import api from "../api";

export default function HistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/attempts/my")
      .then((response) => setAttempts(response.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load history"));
  }, []);

  async function openAttempt(id) {
    setError("");
    try {
      const { data } = await api.get(`/attempts/${id}`);
      setSelectedAttempt(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load saved answers");
    }
  }

  const best = attempts.length ? Math.max(...attempts.map((item) => item.percentage)) : 0;

  return (
    <div className="page-content history-page">
      <header className="page-header split">
        <div><span className="eyebrow">SQL performance record</span><h1>Your decision history</h1><p>Every completed drill and selected answer remains stored after you sign out.</p></div>
        <div className="history-highlight"><Trophy size={25} /><div><span>Personal best</span><strong>{best}%</strong></div></div>
      </header>
      {error && <div className="alert error">{error}</div>}
      <div className="table-wrap enhanced-table">
        <table>
          <thead><tr><th>Scenario</th><th>Mode</th><th>Category</th><th>Completed</th><th>Score</th><th>Outcome</th><th>Review</th></tr></thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id}>
                <td><div className="scenario-table-title"><img src={`/scenarios/${attempt.scenario.imageKey}.svg`} alt="" /><strong>{attempt.scenario.title}</strong></div></td>
                <td><span className={`difficulty ${attempt.scenario.difficulty.toLowerCase()}`}>{attempt.scenario.difficulty}</span></td>
                <td>{attempt.scenario.category}</td>
                <td><span className="table-date"><CalendarDays size={15} /> {new Date(attempt.completedAt).toLocaleString()}</span></td>
                <td><span className="score-badge">{attempt.percentage}%</span></td>
                <td>{attempt.resultLevel}</td>
                <td><button className="secondary-button compact" onClick={() => openAttempt(attempt.id)}><Eye size={15} /> Answers</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!attempts.length && <div className="empty-state full padded"><Database size={42} /><h3>Your SQL history is empty</h3><p>Complete a drill and your result will appear here automatically.</p></div>}
      </div>

      {selectedAttempt && (
        <div className="modal-backdrop" onMouseDown={() => setSelectedAttempt(null)}>
          <section className="record-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedAttempt(null)}><X size={20} /></button>
            <span className="eyebrow">Saved attempt #{selectedAttempt.id}</span>
            <h2>{selectedAttempt.scenario.title}</h2>
            <p>Completed {new Date(selectedAttempt.completedAt).toLocaleString()}</p>
            <div className="attempt-summary-strip">
              <div><span>Score</span><strong>{selectedAttempt.percentage}%</strong></div>
              <div><span>Points</span><strong>{selectedAttempt.totalScore}/{selectedAttempt.maxScore}</strong></div>
              <div><span>Outcome</span><strong>{selectedAttempt.resultLevel}</strong></div>
            </div>
            <div className="saved-answer-list">
              {selectedAttempt.answers.map((answer) => (
                <article key={answer.id} className="saved-answer-card">
                  <div><span>Decision {answer.stepNumber}</span><strong>{answer.score}/{answer.maxScore}</strong></div>
                  <h3>{answer.question}</h3>
                  <p><b>Your answer:</b> {answer.selectedText}</p>
                  <p className="answer-feedback">{answer.feedback}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
