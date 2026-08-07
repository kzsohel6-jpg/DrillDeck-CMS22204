import { useEffect, useState } from "react";
import { PlusCircle, Save, Trash2 } from "lucide-react";
import api from "../api";
import ScenarioCard from "../components/ScenarioCard";

const imageOptions = ["phishing-email","password-reset","slip-hazard","data-request","suspicious-bag","fire-alarm","deescalation","crowd-pressure","ransomware","mass-incident","severe-weather","system-failure"];
const emptyChoice = () => ({ text: "", score: 0, feedback: "" });
const emptyStep = () => ({ situation: "", question: "", choices: [emptyChoice(), emptyChoice(), emptyChoice(), emptyChoice()] });
const emptyForm = () => ({ title: "", category: "", difficulty: "Medium", description: "", imageKey: "phishing-email", durationMinutes: 8, learningOutcome: "", skillFocus: "Decision-making, Communication, Risk awareness", isPublished: false, steps: [emptyStep(), emptyStep(), emptyStep()] });

function cloneSteps(steps) {
  return steps.map((step) => ({ ...step, choices: step.choices.map((choice) => ({ ...choice })) }));
}

export default function ScenarioManagerPage() {
  const [scenarios, setScenarios] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await api.get("/scenarios");
      setScenarios(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scenarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function updateStep(index, field, value) {
    const steps = cloneSteps(form.steps);
    steps[index][field] = value;
    setForm({ ...form, steps });
  }

  function updateChoice(stepIndex, choiceIndex, field, value) {
    const steps = cloneSteps(form.steps);
    steps[stepIndex].choices[choiceIndex][field] = field === "score" ? Number(value) : value;
    setForm({ ...form, steps });
  }

  function addChoice(stepIndex) {
    const steps = cloneSteps(form.steps);
    if (steps[stepIndex].choices.length < 8) steps[stepIndex].choices.push(emptyChoice());
    setForm({ ...form, steps });
  }

  function removeChoice(stepIndex, choiceIndex) {
    const steps = cloneSteps(form.steps);
    if (steps[stepIndex].choices.length > 4) steps[stepIndex].choices.splice(choiceIndex, 1);
    setForm({ ...form, steps });
  }

  function addStep() {
    if (form.steps.length < 12) setForm({ ...form, steps: [...form.steps, emptyStep()] });
  }

  function removeStep(index) {
    if (form.steps.length > 3) setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) });
  }

  async function editScenario(id) {
    setError("");
    setMessage("");
    try {
      const { data } = await api.get(`/scenarios/${id}`);
      setEditingId(id);
      setForm({
        title: data.title,
        category: data.category,
        difficulty: data.difficulty,
        description: data.description,
        imageKey: data.imageKey,
        durationMinutes: data.durationMinutes,
        learningOutcome: data.learningOutcome,
        skillFocus: data.skillFocus,
        isPublished: data.isPublished,
        steps: data.steps.map((step) => ({
          situation: step.situation,
          question: step.question,
          choices: step.choices.map((choice) => ({ text: choice.text, score: choice.score, feedback: choice.feedback })),
        })),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to open this scenario for editing");
    }
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (editingId) await api.put(`/scenarios/${editingId}`, form);
      else await api.post("/scenarios", form);
      setMessage(editingId ? "Scenario updated successfully" : "Scenario created successfully");
      setForm(emptyForm());
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save scenario");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this scenario? Scenarios with saved trainee attempts cannot be deleted; they can be unpublished instead.")) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/scenarios/${id}`);
      setMessage("Scenario deleted successfully");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm());
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete scenario");
    }
  }

  return (
    <div className="page-content studio-page">
      <header className="page-header"><span className="eyebrow">Advanced scenario studio</span><h1>{editingId ? "Edit scenario" : "Build a new scenario"}</h1><p>Create and update complete training experiences with imagery, flexible decision flows, scoring and immediate feedback. Administrator changes remain saved after restart.</p></header>
      {message && <div className="alert success">{message}</div>}{error && <div className="alert error">{error}</div>}
      <form className="builder enhanced-builder" onSubmit={save}>
        <section className="builder-section"><div className="builder-section-title"><span>01</span><div><h2>Scenario identity</h2><p>Define how the drill appears in the library.</p></div></div>
          <div className="form-grid expanded"><label>Title<input maxLength="150" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label><label>Category<input maxLength="80" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></label><label>Difficulty<select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label>Duration (minutes)<input type="number" min="3" max="60" step="1" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} required /></label></div>
          <label>Description<textarea rows="3" maxLength="3000" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label>
          <div className="form-grid two"><label>Learning outcome<textarea rows="3" maxLength="1500" value={form.learningOutcome} onChange={(e) => setForm({ ...form, learningOutcome: e.target.value })} required /></label><label>Skill focus (comma separated)<textarea rows="3" maxLength="220" value={form.skillFocus} onChange={(e) => setForm({ ...form, skillFocus: e.target.value })} /></label></div>
          <div className="image-picker"><label>Scenario artwork<select value={form.imageKey} onChange={(e) => setForm({ ...form, imageKey: e.target.value })}>{imageOptions.map((option) => <option key={option} value={option}>{option.replaceAll("-"," ")}</option>)}</select></label><img src={`/scenarios/${form.imageKey}.svg`} alt="Selected scenario artwork" /></div>
        </section>

        <section className="builder-section"><div className="builder-section-title"><span>02</span><div><h2>Decision flow</h2><p>Each scenario contains 3–12 decisions, with 4–8 scored choices per decision.</p></div></div>
          {form.steps.map((step, stepIndex) => <section className="step-builder" key={stepIndex}><div className="panel-heading"><h3>Decision {stepIndex + 1}</h3>{form.steps.length > 3 && <button type="button" className="text-button danger" onClick={() => removeStep(stepIndex)}><Trash2 size={16} /> Remove step</button>}</div><label>Situation<textarea rows="2" maxLength="2500" value={step.situation} onChange={(e) => updateStep(stepIndex, "situation", e.target.value)} required /></label><label>Question<input maxLength="1000" value={step.question} onChange={(e) => updateStep(stepIndex, "question", e.target.value)} required /></label><div className="choice-editor">{step.choices.map((choice, choiceIndex) => <div className="choice-edit" key={choiceIndex}><span className="choice-letter">{String.fromCharCode(65 + choiceIndex)}</span><input maxLength="1200" placeholder={`Choice ${choiceIndex + 1}`} value={choice.text} onChange={(e) => updateChoice(stepIndex, choiceIndex, "text", e.target.value)} required /><input className="score-input" type="number" min="0" max="10" step="1" value={choice.score} onChange={(e) => updateChoice(stepIndex, choiceIndex, "score", e.target.value)} required /><textarea maxLength="2000" placeholder="Feedback shown after this decision" value={choice.feedback} onChange={(e) => updateChoice(stepIndex, choiceIndex, "feedback", e.target.value)} required />{step.choices.length > 4 && <button type="button" className="text-button danger" onClick={() => removeChoice(stepIndex, choiceIndex)}>Remove</button>}</div>)}</div><button type="button" className="secondary-button compact" disabled={step.choices.length >= 8} onClick={() => addChoice(stepIndex)}><PlusCircle size={16} /> {step.choices.length >= 8 ? "Maximum 8 choices" : "Add choice"}</button></section>)}
          <button type="button" className="secondary-button" disabled={form.steps.length >= 12} onClick={addStep}><PlusCircle size={17} /> {form.steps.length >= 12 ? "Maximum 12 decisions" : "Add decision step"}</button>
        </section>

        <div className="publish-bar"><label className="check-label"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publish scenario to trainee library</label><div className="button-row"><button className="primary-button" disabled={saving}><Save size={17} /> {saving ? "Saving..." : editingId ? "Save changes" : "Create scenario"}</button>{editingId && <button type="button" className="text-button" disabled={saving} onClick={() => { setEditingId(null); setForm(emptyForm()); setError(""); }}>Cancel edit</button>}</div></div>
      </form>
      <header className="section-heading"><div><span className="eyebrow">Content library</span><h2>Existing scenarios</h2></div><span>{scenarios.length} total</span></header>
      {loading ? <div className="loading-screen"><div className="loader" /><p>Loading scenario library...</p></div> : <section className="card-grid enhanced-grid">{scenarios.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} adminActions={<div className="button-row"><button className="secondary-button compact" onClick={() => editScenario(scenario.id)}>Edit</button><button className="text-button danger" onClick={() => remove(scenario.id)}>Delete</button><span className={scenario.isPublished ? "status published" : "status draft"}>{scenario.isPublished ? "Published" : "Draft"}</span></div>} />)}</section>}
    </div>
  );
}
