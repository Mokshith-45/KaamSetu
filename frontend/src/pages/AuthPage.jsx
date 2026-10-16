import { createElement, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiUsers,
  FiZap,
  FiCalendar,
} from "react-icons/fi";
import { supabase } from "../supabaseClient";
import "./AuthPage.css";

const features = [
  {
    icon: FiZap,
    title: "Plan in minutes",
    text: "Turn availability and staffing needs into a clear weekly draft.",
  },
  {
    icon: FiUsers,
    title: "One team view",
    text: "Keep owners and staff aligned with the same source of truth.",
  },
  {
    icon: FiCalendar,
    title: "Built for real life",
    text: "Make changes quickly when shifts, people, or priorities change.",
  },
];

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    userType: "owner",
    staffRole: "Cashier",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const update = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      if (isSignUp) {
        if (!form.fullName.trim())
          throw new Error("Please enter your full name.");
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        if (!data.user) throw new Error("We could not create your account.");
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            full_name: form.fullName.trim(),
            user_type: form.userType,
          },
        ]);
        if (profileError)
          throw new Error(
            "Your account was created, but the profile could not be saved.",
          );
        if (form.userType === "staff") {
          const { error: roleError } = await supabase
            .from("staff_roles")
            .insert([{ staff_id: data.user.id, role: form.staffRole }]);
          if (roleError)
            throw new Error(
              "Your account was created, but the staff role could not be saved.",
            );
        }
        setMessage(
          "Account created. Check your email if confirmation is required, then sign in.",
        );
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw new Error("Invalid email or password.");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, user_type")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profileError || !profile)
          throw new Error("Profile not found. Please contact support.");
        localStorage.setItem("userFullName", profile.full_name);
        navigate(
          profile.user_type === "owner"
            ? "/owner-dashboard"
            : "/staff-dashboard",
        );
      }
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">K</span>Kaam<span>Setu</span>
        </Link>
        <nav>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <button
            className="button button-ghost"
            onClick={() => {
              setIsSignUp(false);
              setShowAuth(true);
            }}
          >
            Sign in
          </button>
          <button
            className="button button-primary"
            onClick={() => {
              setIsSignUp(true);
              setShowAuth(true);
            }}
          >
            Get started <FiArrowRight />
          </button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Workforce management, made human</span>
            <h1>
              Make every shift <em>work better.</em>
            </h1>
            <p>
              KaamSetu helps small businesses build reliable schedules, keep
              teams informed, and spend less time chasing spreadsheets.
            </p>
            <div className="hero-actions">
              <button
                className="button button-primary"
                onClick={() => {
                  setIsSignUp(true);
                  setShowAuth(true);
                }}
              >
                Start for free <FiArrowRight />
              </button>
              <button
                className="button button-ghost"
                onClick={() =>
                  document
                    .getElementById("features")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                See how it works
              </button>
            </div>
            <div className="trust-line">
              <span>
                <FiCheck /> No credit card required
              </span>
              <span>
                <FiCheck /> Designed for small teams
              </span>
            </div>
          </div>
          <div className="hero-preview">
            <div className="preview-window">
              <div className="preview-head">
                <span className="preview-dots">● ● ●</span>
                <span>Weekly schedule</span>
                <span className="preview-status">● Live draft</span>
              </div>
              <div className="preview-title">
                <div>
                  <small>MON, OCT 14 — SUN, OCT 20</small>
                  <strong>Your team this week</strong>
                </div>
                <span className="mini-avatar">AK</span>
              </div>
              <div className="schedule-row schedule-header">
                <span>TEAM</span>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
              </div>
              {["Ananya · Cashier", "Rahul · Stock", "Maya · Floor"].map(
                (person, index) => (
                  <div className="schedule-row" key={person}>
                    <strong>{person}</strong>
                    {[0, 1, 2, 3].map((day) => (
                      <span
                        className={`shift-chip chip-${(index + day) % 3}`}
                        key={day}
                      >
                        {day === 1 && index === 1
                          ? "OFF"
                          : day % 2
                            ? "12–5"
                            : "9–2"}
                      </span>
                    ))}
                  </div>
                ),
              )}
              <div className="preview-foot">
                <FiZap /> AI draft is balanced across availability and coverage
              </div>
            </div>
          </div>
        </section>
        <section className="feature-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">Everything in one place</span>
            <h2>Less admin. More time for your team.</h2>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <article className="feature-card" key={title}>
                <span className="feature-icon">{createElement(Icon)}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="steps-section">
          <div>
            <span className="eyebrow">How KaamSetu works</span>
            <h2>A calmer way to run your week.</h2>
          </div>
          <div className="steps">
            {[
              "Set up your shop and team",
              "Add availability and requirements",
              "Review, adjust, and share",
            ].map((step, index) => (
              <div className="step" key={step}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{step}</h3>
                  <p>
                    {
                      [
                        "Start with the details that make your business unique.",
                        "Everyone’s preferences stay visible and easy to update.",
                        "Keep the final call with you, while your team stays in sync.",
                      ][index]
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">K</span>Kaam<span>Setu</span>
        </Link>
        <span>Simple scheduling for ambitious small teams.</span>
        <span>
          © 2026 KaamSetu · <Link to="/about">About</Link> ·{" "}
          <Link to="/contact">Contact</Link>
        </span>
      </footer>
      {showAuth && (
        <div className="auth-overlay" role="dialog" aria-modal="true">
          <div className="auth-card">
            <button
              className="auth-close"
              onClick={() => setShowAuth(false)}
              aria-label="Close"
            >
              ×
            </button>
            <span className="eyebrow">
              {isSignUp ? "Create your workspace" : "Welcome back"}
            </span>
            <h2>{isSignUp ? "Build a better week." : "Sign in to KaamSetu"}</h2>
            <p className="muted">
              {isSignUp
                ? "Start managing your team in a few minutes."
                : "Your team’s next shift is waiting."}
            </p>
            <form onSubmit={submit}>
              {isSignUp && (
                <>
                  <label className="field">
                    Full name
                    <input
                      value={form.fullName}
                      onChange={update("fullName")}
                      placeholder="e.g. Priya Sharma"
                    />
                  </label>
                  <label className="field">
                    I am a
                    <select value={form.userType} onChange={update("userType")}>
                      <option value="owner">Shop owner</option>
                      <option value="staff">Staff member</option>
                    </select>
                  </label>
                  {form.userType === "staff" && (
                    <label className="field">
                      Staff role
                      <select
                        value={form.staffRole}
                        onChange={update("staffRole")}
                      >
                        <option>Cashier</option>
                        <option>Stock</option>
                        <option>Deliverer</option>
                        <option>Other</option>
                      </select>
                    </label>
                  )}
                </>
              )}
              <label className="field">
                Email
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@company.com"
                />
              </label>
              <label className="field">
                Password
                <div className="password-field">
                  <input
                    required
                    minLength="6"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={update("password")}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>
              <button
                className="button button-primary auth-submit"
                disabled={busy}
              >
                {busy ? "Working…" : isSignUp ? "Create account" : "Sign in"}{" "}
                <FiArrowRight />
              </button>
            </form>
            {message && (
              <p
                className={`auth-message ${message.startsWith("Account") ? "success" : ""}`}
              >
                {message}
              </p>
            )}
            <p className="auth-switch">
              {isSignUp ? "Already have an account?" : "New to KaamSetu?"}{" "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage("");
                }}
              >
                {isSignUp ? "Sign in" : "Create an account"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
