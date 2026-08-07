import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BarChart3, CheckCircle2, Layers3, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!ready) return <div className="auth-page loading-screen"><div className="loader" /><p>Checking your secure session...</p></div>;
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const signedIn = await login(form.email, form.password);
      navigate(signedIn.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page professional-auth">
      <section className="auth-intro">
        <img className="auth-logo" src="/brand/drilldeck-logo.svg" alt="DrillDeck" />
        <span className="auth-kicker">Scenario-based professional learning</span>
        <h1>Practise difficult decisions before they happen.</h1>
        <p>DrillDeck combines realistic scenarios, immediate coaching and SQL-backed analytics in one focused training environment.</p>
        <div className="auth-feature-grid">
          <div><Layers3 size={21} /><span><strong>Structured scenario library</strong><small>Easy, applied and expert modes</small></span></div>
          <div><CheckCircle2 size={21} /><span><strong>Decision coaching</strong><small>Feedback after every action</small></span></div>
          <div><BarChart3 size={21} /><span><strong>Measurable progress</strong><small>Scores, history and analytics</small></span></div>
          <div><ShieldCheck size={21} /><span><strong>Role-based access</strong><small>Separate trainee and trainer tools</small></span></div>
        </div>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <div className="auth-card-symbol"><img src="/brand/drilldeck-symbol.svg" alt="" /></div>
        <span className="eyebrow">Secure access</span>
        <h2>Sign in to DrillDeck</h2>
        <p className="auth-card-copy">Enter your registered account details to continue.</p>
        {error && <div className="alert error">{error}</div>}
        <label>Email address<input type="email" maxLength="120" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required /></label>
        <label>Password<input type="password" maxLength="128" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" required /></label>
        <button className="primary-button auth-submit" disabled={loading}>{loading ? "Signing in..." : "Sign in securely"}</button>
        <p className="form-foot">New trainee? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
