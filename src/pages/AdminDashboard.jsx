import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, BarChart3, BookOpenCheck, CheckCircle2, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api";
import StatCard from "../components/StatCard";

const modeColours = { Easy: "#32d39a", Medium: "#ffb547", Hard: "#ff6584" };

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/admin").then((response) => setData(response.data)).catch((err) => setError(err.response?.data?.message || "Unable to load dashboard"));
  }, []);

  if (error) return <div className="page-content"><div className="alert error">{error}</div></div>;
  if (!data) return <div className="page-content loading-screen"><div className="loader" /><p>Loading administrator dashboard...</p></div>;

  return (
    <div className="page-content admin-page">
      <header className="admin-hero">
        <div><span className="eyebrow">Trainer control centre</span><h1>DrillDeck platform overview</h1><p>Manage the complete training library, trainee accounts and persistent decision records across every level.</p></div>
        <div className="button-row"><Link className="primary-button" to="/admin/scenarios">Open scenario studio <BookOpenCheck size={18} /></Link><Link className="secondary-button" to="/admin/trainees">View trainee records <Users size={18} /></Link></div>
      </header>
      <section className="stat-grid dashboard-stats">
        <StatCard label="Registered trainees" value={data.traineeCount} hint="active learner accounts" icon={Users} tone="blue" />
        <StatCard label="Scenario library" value={data.scenarioCount} hint={`${data.publishedCount} published`} icon={BookOpenCheck} tone="mint" />
        <StatCard label="Completed attempts" value={data.totalAttempts} hint="stored in SQLite" icon={Activity} tone="purple" />
        <StatCard label="Platform average" value={`${data.averageScore}%`} hint="all completed attempts" icon={BarChart3} tone="gold" />
      </section>

      <section className="admin-analytics-grid">
        <article className="panel chart-panel">
          <div className="panel-heading"><div><span className="eyebrow">Content balance</span><h2>Scenarios by difficulty</h2></div></div>
          <div className="pie-layout">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={data.difficultyDistribution} dataKey="count" nameKey="difficulty" innerRadius={66} outerRadius={98} paddingAngle={5}>{data.difficultyDistribution.map((item) => <Cell key={item.difficulty} fill={modeColours[item.difficulty]} />)}</Pie><Tooltip contentStyle={{ background: "#111d2a", border: "1px solid #2b3c52", borderRadius: 12 }} /></PieChart>
            </ResponsiveContainer>
            <div className="mode-legend">{data.difficultyDistribution.map((item) => <div key={item.difficulty}><span style={{ background: modeColours[item.difficulty] }} /><strong>{item.difficulty}</strong><b>{item.count}</b></div>)}</div>
          </div>
        </article>
        <article className="panel chart-panel wide-chart">
          <div className="panel-heading"><div><span className="eyebrow">Learning analytics</span><h2>Most attempted scenario performance</h2></div></div>
          {data.scenarioPerformance.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={data.scenarioPerformance} layout="vertical" margin={{ left: 10, right: 15 }}><CartesianGrid stroke="#263448" strokeDasharray="4 4" horizontal={false} /><XAxis type="number" domain={[0,100]} stroke="#8ea0b5" /><YAxis type="category" dataKey="scenario" width={145} tick={{ fontSize: 11, fill: "#a9b7c8" }} /><Tooltip contentStyle={{ background: "#111d2a", border: "1px solid #2b3c52", borderRadius: 12 }} /><Bar dataKey="average" fill="#7c9cff" radius={[0,9,9,0]} /></BarChart></ResponsiveContainer> : <div className="empty-state"><Activity size={40} /><h3>No attempts yet</h3><p>Trainee performance will appear after the first completed scenario.</p></div>}
        </article>
      </section>

      <article className="panel admin-activity">
        <div className="panel-heading"><div><span className="eyebrow">Live record</span><h2>Recent training activity</h2></div></div>
        <div className="list-stack">{data.recentAttempts.length ? data.recentAttempts.map((attempt) => <div className="history-row rich" key={attempt.id}><span className={`history-dot ${attempt.scenario.difficulty.toLowerCase()}`} /><div><strong>{attempt.user.name}</strong><span>{attempt.scenario.title} · {attempt.scenario.difficulty}</span></div><span className="score-badge">{attempt.percentage}%</span></div>) : <div className="empty-state small"><CheckCircle2 size={36} /><h3>No activity yet</h3><p>The system is ready for trainee attempts.</p></div>}</div>
      </article>
    </div>
  );
}
