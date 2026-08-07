import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import ModeCard from "../components/ModeCard";
import ScenarioCard from "../components/ScenarioCard";

const emptySummary = {
  scenarioCount: 0,
  decisionCount: 0,
  difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
  categories: [],
};

export default function ScenarioListPage() {
  const [searchParams] = useSearchParams();
  const initialDifficulty = searchParams.get("difficulty") || "";
  const [scenarios, setScenarios] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [filters, setFilters] = useState({ q: "", category: "", difficulty: initialDifficulty, sortBy: "difficulty", order: "ASC" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api.get("/scenarios/summary", { signal: controller.signal })
      .then((response) => setSummary(response.data))
      .catch((err) => {
        if (err.code !== "ERR_CANCELED") setError(err.response?.data?.message || "Unable to load scenario summary");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      api.get("/scenarios", { params: filters, signal: controller.signal })
        .then((response) => setScenarios(response.data))
        .catch((err) => {
          if (err.code !== "ERR_CANCELED") setError(err.response?.data?.message || "Unable to load scenarios");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters]);

  const categories = ["", ...(summary.categories || [])];

  function clearFilters() {
    setFilters({ q: "", category: "", difficulty: "", sortBy: "difficulty", order: "ASC" });
  }

  return (
    <div className="page-content library-page">
      <header className="library-hero">
        <div>
          <span className="eyebrow">Interactive scenario library</span>
          <h1>Choose the pressure. Build the response.</h1>
          <p>Each drill contains structured decisions, immediate coaching and a saved SQL performance record.</p>
        </div>
        <div className="library-summary">
          <strong>{summary.scenarioCount}</strong><span>published scenarios</span>
          <strong>{summary.decisionCount}</strong><span>decision points</span>
        </div>
      </header>

      <section className="mode-grid library-modes">
        {["Easy", "Medium", "Hard"].map((difficulty) => (
          <ModeCard
            key={difficulty}
            difficulty={difficulty}
            count={summary.difficultyCounts?.[difficulty] || 0}
            active={filters.difficulty === difficulty}
            onClick={() => setFilters({ ...filters, difficulty: filters.difficulty === difficulty ? "" : difficulty })}
          />
        ))}
      </section>

      <section className="filter-panel">
        <div className="search-box"><Search size={19} /><input placeholder="Search by title, skill or category" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></div>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>{categories.map((category) => <option key={category || "all"} value={category}>{category || "All categories"}</option>)}</select>
        <select value={`${filters.sortBy}:${filters.order}`} onChange={(e) => { const [sortBy, order] = e.target.value.split(":"); setFilters({ ...filters, sortBy, order }); }}><option value="difficulty:ASC">Level: Easy to Hard</option><option value="difficulty:DESC">Level: Hard to Easy</option><option value="title:ASC">Title A–Z</option><option value="durationMinutes:ASC">Shortest first</option><option value="createdAt:DESC">Newest first</option></select>
        <button type="button" className="filter-clear" onClick={clearFilters}><X size={17} /> Reset</button>
      </section>

      <div className="result-summary"><span><SlidersHorizontal size={17} /> {scenarios.length} scenarios found</span>{filters.difficulty && <strong className={`difficulty ${filters.difficulty.toLowerCase()}`}>{filters.difficulty} mode</strong>}</div>
      {error && <div className="alert error">{error}</div>}
      {loading ? <div className="loading-screen"><div className="loader" /><p>Loading scenario deck...</p></div> : <section className="card-grid enhanced-grid">{scenarios.length ? scenarios.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} />) : <div className="empty-state full"><Search size={42} /><h3>No scenarios match</h3><p>Try clearing one of the filters.</p></div>}</section>}
    </div>
  );
}
