import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Database,
  Eye,
  KeyRound,
  Pencil,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import api from "../api";
import StatCard from "../components/StatCard";

function dateTime(value) {
  return value ? new Date(value).toLocaleString() : "No activity yet";
}

export default function AdminTraineesPage() {
  const [trainees, setTrainees] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [query, setQuery] = useState("");
  const [traineeFilter, setTraineeFilter] = useState("all");
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [editing, setEditing] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [traineeResponse, attemptResponse] = await Promise.all([
        api.get("/admin/trainees"),
        api.get("/attempts/all"),
      ]);
      setTrainees(traineeResponse.data);
      setAttempts(attemptResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load trainee records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filteredAttempts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return attempts.filter((attempt) => {
      const matchesTrainee = traineeFilter === "all" || String(attempt.user.id) === traineeFilter;
      const haystack = `${attempt.user.name} ${attempt.user.email} ${attempt.scenario.title} ${attempt.scenario.category} ${attempt.resultLevel}`.toLowerCase();
      return matchesTrainee && (!term || haystack.includes(term));
    });
  }, [attempts, query, traineeFilter]);

  async function openAttempt(id) {
    setError("");
    try {
      const { data } = await api.get(`/attempts/${id}`);
      setSelectedAttempt(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load the saved answers");
    }
  }

  async function saveTrainee(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.put(`/admin/trainees/${editing.id}`, {
        name: editing.name,
        email: editing.email,
        password,
      });
      setMessage("Trainee account updated successfully");
      setEditing(null);
      setPassword("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update trainee account");
    }
  }

  async function deleteTrainee(trainee) {
    const confirmed = confirm(
      `Delete ${trainee.name}? This permanently removes the account and all saved attempts.`
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      await api.delete(`/admin/trainees/${trainee.id}`);
      setMessage("Trainee account and its saved records were deleted");
      if (traineeFilter === String(trainee.id)) setTraineeFilter("all");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete trainee account");
    }
  }

  if (loading) {
    return <div className="page-content loading-screen"><div className="loader" /><p>Loading SQL trainee records...</p></div>;
  }

  const activeTrainees = trainees.filter((item) => item.totalAttempts > 0).length;

  return (
    <div className="page-content admin-records-page">
      <header className="page-header split">
        <div>
          <span className="eyebrow">Administrator access</span>
          <h1>Trainee records and saved answers</h1>
          <p>Review every registered account, persistent attempt and decision-level response stored in SQLite.</p>
        </div>
        <button className="secondary-button" onClick={load}>Refresh records</button>
      </header>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="stat-grid dashboard-stats">
        <StatCard label="Registered trainees" value={trainees.length} hint="administrator-managed accounts" icon={Users} tone="blue" />
        <StatCard label="Active trainees" value={activeTrainees} hint="completed at least one drill" icon={Activity} tone="mint" />
        <StatCard label="Saved attempts" value={attempts.length} hint="remain after sign out" icon={Database} tone="purple" />
        <StatCard label="Answer access" value="Full" hint="decision-level SQL review" icon={KeyRound} tone="gold" />
      </section>

      <article className="panel records-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Account control</span><h2>Registered trainees</h2></div>
          <span>{trainees.length} accounts</span>
        </div>
        <div className="table-wrap enhanced-table admin-table">
          <table>
            <thead><tr><th>Trainee</th><th>Attempts</th><th>Completed</th><th>Average</th><th>Best</th><th>Last activity</th><th>Actions</th></tr></thead>
            <tbody>
              {trainees.map((trainee) => (
                <tr key={trainee.id}>
                  <td><strong>{trainee.name}</strong><small>{trainee.email}</small></td>
                  <td>{trainee.totalAttempts}</td>
                  <td>{trainee.completedScenarios}</td>
                  <td><span className="score-badge">{trainee.averageScore}%</span></td>
                  <td>{trainee.bestScore}%</td>
                  <td>{dateTime(trainee.lastActivity)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" title="Show this trainee's attempts" onClick={() => setTraineeFilter(String(trainee.id))}><Eye size={16} /></button>
                      <button className="icon-button" title="Edit account or reset password" onClick={() => { setEditing({ ...trainee }); setPassword(""); }}><Pencil size={16} /></button>
                      <button className="icon-button danger" title="Delete trainee" onClick={() => deleteTrainee(trainee)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!trainees.length && <div className="empty-state full padded"><Users size={42} /><h3>No trainee accounts</h3><p>New registrations will appear here automatically.</p></div>}
        </div>
      </article>

      <article className="panel records-panel">
        <div className="panel-heading records-heading">
          <div><span className="eyebrow">Persistent progress</span><h2>All completed attempts</h2></div>
          <div className="records-filters">
            <label className="search-control"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trainee or scenario" /></label>
            <select value={traineeFilter} onChange={(event) => setTraineeFilter(event.target.value)}>
              <option value="all">All trainees</option>
              {trainees.map((trainee) => <option key={trainee.id} value={trainee.id}>{trainee.name}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap enhanced-table admin-table">
          <table>
            <thead><tr><th>Trainee</th><th>Scenario</th><th>Mode</th><th>Completed</th><th>Score</th><th>Outcome</th><th>Answers</th></tr></thead>
            <tbody>
              {filteredAttempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td><strong>{attempt.user.name}</strong><small>{attempt.user.email}</small></td>
                  <td>{attempt.scenario.title}</td>
                  <td><span className={`difficulty ${attempt.scenario.difficulty.toLowerCase()}`}>{attempt.scenario.difficulty}</span></td>
                  <td>{dateTime(attempt.completedAt)}</td>
                  <td><span className="score-badge">{attempt.percentage}%</span></td>
                  <td>{attempt.resultLevel}</td>
                  <td><button className="secondary-button compact" onClick={() => openAttempt(attempt.id)}><Eye size={15} /> View details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredAttempts.length && <div className="empty-state full padded"><Database size={42} /><h3>No matching attempts</h3><p>Completed trainee work will remain visible here after logout and restart.</p></div>}
        </div>
      </article>

      {selectedAttempt && (
        <div className="modal-backdrop" onMouseDown={() => setSelectedAttempt(null)}>
          <section className="record-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedAttempt(null)}><X size={20} /></button>
            <span className="eyebrow">Saved SQL attempt #{selectedAttempt.id}</span>
            <h2>{selectedAttempt.scenario.title}</h2>
            <p>{selectedAttempt.user.name} · {selectedAttempt.user.email} · {dateTime(selectedAttempt.completedAt)}</p>
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
                  <p><b>Selected:</b> {answer.selectedText}</p>
                  <p className="answer-feedback">{answer.feedback}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onMouseDown={() => setEditing(null)}>
          <form className="record-modal account-modal" onSubmit={saveTrainee} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setEditing(null)}><X size={20} /></button>
            <span className="eyebrow">Administrator account controls</span>
            <h2>Edit trainee</h2>
            <label>Full name<input minLength="2" maxLength="80" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required /></label>
            <label>Email address<input type="email" maxLength="120" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} required /></label>
            <label>New password (optional)<input type="password" minLength={password ? 8 : undefined} maxLength="128" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Leave blank to keep current password" /></label>
            <button className="primary-button"><KeyRound size={17} /> Save account changes</button>
          </form>
        </div>
      )}
    </div>
  );
}
