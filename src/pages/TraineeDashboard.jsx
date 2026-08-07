import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, BarChart3, BookOpenCheck, Flame, Trophy, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api";
import ModeCard from "../components/ModeCard";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { difficultyMeta } from "../utils";

export default function TraineeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/trainee").then((response) => setData(response.data)).catch((err) => setError(err.response?.data?.message || "Unable to load dashboard"));
  }, []);

  if (error) return <div className="page-content"><div className="alert error">{error}</div></div>;
  if (!data) return <div className="page-content loading-screen"><div className="loader" /><p>Preparing your training dashboard...</p></div>;

  const completion = data.totalScenarios ? Math.round((data.completedScenarios / data.totalScenarios) * 100) : 0;
  const xpInLevel = data.xp % 250;
  const xpToNext = xpInLevel === 0 ? 250 : 250 - xpInLevel;

  return (
    <div className="page-content">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow">Trainee command deck</span>
          <h1>Welcome back, {user.name.split(" ")[0]}.</h1>
          <p>Build confidence through realistic decisions, instant coaching and measurable progress across three training levels.</p>
          <div className="button-row">
            <Link to="/scenarios" className="primary-button">Explore all scenarios <BookOpenCheck size={18} /></Link>
            <Link to="/history" className="secondary-button">Review performance</Link>
          </div>
          <div className="level-strip">
            <div><span>Level {data.level}</span><strong>{data.xp} XP</strong></div>
            <div className="level-progress"><span style={{ width: `${Math.min(100, xpInLevel / 2.5)}%` }} /></div>
            <small>{xpToNext} XP to next level</small>
          </div>
        </div>
        {data.recommended && (
          <Link to={`/scenarios/${data.recommended.id}`} className={`recommended-card ${data.recommended.difficulty.toLowerCase()}`}>
            <img src={data.recommended.imageUrl} alt="" />
            <div className="recommended-overlay" />
            <div className="recommended-content">
              <span>Recommended next</span>
              <h2>{data.recommended.title}</h2>
              <p>{data.recommended.category} · {data.recommended.durationMinutes} min</p>
              <strong>Start {data.recommended.difficulty.toLowerCase()} drill →</strong>
            </div>
          </Link>
        )}
      </section>

      <section className="stat-grid dashboard-stats">
        <StatCard label="Training progress" value={`${completion}%`} hint={`${data.completedScenarios} of ${data.totalScenarios} scenarios`} icon={BookOpenCheck} tone="mint" />
        <StatCard label="Average score" value={`${data.averageScore}%`} hint="across completed drills" icon={BarChart3} tone="blue" />
        <StatCard label="Personal best" value={`${data.bestScore}%`} hint="highest recorded result" icon={Trophy} tone="gold" />
        <StatCard label="Experience" value={`${data.xp} XP`} hint={`current level ${data.level}`} icon={Zap} tone="purple" />
      </section>

      <header className="section-heading mode-heading">
        <div><span className="eyebrow">Training journey</span><h2>Progress through the modes</h2></div>
        <Link to="/scenarios">Open library →</Link>
      </header>
      <section className="mode-grid">
        {data.difficultyProgress.map((progress) => (
          <ModeCard key={progress.difficulty} difficulty={progress.difficulty} progress={progress} onClick={() => navigate(`/scenarios?difficulty=${progress.difficulty}`)} />
        ))}
      </section>

      <section className="dashboard-grid lower-dashboard">
        <article className="panel chart-panel">
          <div className="panel-heading"><div><span className="eyebrow">Analytics</span><h2>Performance by category</h2></div><Award size={22} /></div>
          {data.categoryPerformance.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.categoryPerformance} margin={{ top: 16, right: 10, left: -20, bottom: 8 }}>
                <CartesianGrid stroke="#263448" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="category" stroke="#8ea0b5" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={58} />
                <YAxis domain={[0, 100]} stroke="#8ea0b5" />
                <Tooltip contentStyle={{ background: "#111d2a", border: "1px solid #2b3c52", borderRadius: 12 }} />
                <Bar dataKey="average" fill="#63a4ff" radius={[9, 9, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><Flame size={38} /><h3>Your analytics will appear here</h3><p>Complete a scenario to unlock category insights and training recommendations.</p></div>}
        </article>
        <article className="panel recent-panel">
          <div className="panel-heading"><div><span className="eyebrow">Latest activity</span><h2>Recent attempts</h2></div><Link to="/history">View all</Link></div>
          <div className="list-stack">
            {data.recentAttempts.length ? data.recentAttempts.map((attempt) => (
              <div className="history-row rich" key={attempt.id}>
                <span className={`history-dot ${attempt.scenario.difficulty.toLowerCase()}`} />
                <div><strong>{attempt.scenario.title}</strong><span>{attempt.scenario.difficulty} · {new Date(attempt.completedAt).toLocaleDateString()}</span></div>
                <span className="score-badge">{attempt.percentage}%</span>
              </div>
            )) : <div className="empty-state small"><BookOpenCheck size={34} /><h3>No attempts yet</h3><p>Choose a scenario and make your first decisions.</p></div>}
          </div>
        </article>
      </section>
    </div>
  );
}
