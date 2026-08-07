import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { user, ready, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!ready) return <div className="auth-page loading-screen"><div className="loader" /><p>Checking your secure session...</p></div>;
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page professional-auth registration-auth">
      <section className="auth-intro">
        <img className="auth-logo" src="/brand/drilldeck-logo.svg" alt="DrillDeck" />
        <span className="auth-kicker">Create your training profile</span>
        <h1>Start building confident, evidence-based decisions.</h1>
        <p>Your account stores completed attempts, performance trends and progress across all three training modes.</p>
        <ul className="registration-points">
          <li><CheckCircle2 size={18} /> Secure password hashing and JWT authentication</li>
          <li><CheckCircle2 size={18} /> Personal attempt history and scoring analytics</li>
          <li><CheckCircle2 size={18} /> Complete scenario-based training experiences</li>
        </ul>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <div className="auth-card-symbol"><img src="/brand/drilldeck-symbol.svg" alt="" /></div>
        <span className="eyebrow">Trainee registration</span>
        <h2>Create an account</h2>
        <p className="auth-card-copy">Use a password containing at least eight characters.</p>
        {error && <div className="alert error">{error}</div>}
        <label>Full name<input minLength="2" maxLength="80" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required /></label>
        <label>Email address<input type="email" maxLength="120" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required /></label>
        <label>Password<input type="password" minLength="8" maxLength="128" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required /></label>
        <label>Confirm password<input type="password" minLength="8" maxLength="128" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} autoComplete="new-password" required /></label>
        <button className="primary-button auth-submit" disabled={loading}>{loading ? "Creating account..." : "Create trainee account"}</button>
        <p className="form-foot">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
