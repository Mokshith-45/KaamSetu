import { useState } from "react";
import { FiArrowLeft, FiCheck, FiMail } from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Contact.css";

const initialForm = { name: "", email: "", message: "" };
const MAX_LENGTHS = { name: 120, email: 254, message: 5000 };

export default function Contact() {
  const [searchParams] = useSearchParams();
  const requestedReturnPath = searchParams.get("from");
  const returnPath = ["/owner-dashboard", "/staff-dashboard"].includes(
    requestedReturnPath,
  )
    ? requestedReturnPath
    : "/";
  const returnLabel = returnPath === "/" ? "Back to home" : "Back to dashboard";
  const [form, setForm] = useState(initialForm);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !message) {
      setError("Please complete your name, email, and message.");
      return;
    }
    if (
      name.length > MAX_LENGTHS.name ||
      email.length > MAX_LENGTHS.email ||
      message.length > MAX_LENGTHS.message
    ) {
      setError("Please shorten your message or one of the other fields.");
      return;
    }
    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setSaving(true);
    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert([{ name, email, message }]);

    if (insertError) {
      setError(
        "We could not save your message right now. Please try again shortly.",
      );
      setSaving(false);
      return;
    }

    setForm(initialForm);
    setSent(true);
    setSaving(false);
  };
  return (
    <div className="info-page">
      <header className="info-nav">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">K</span>Kaam<span>Setu</span>
        </Link>
        <Link to={returnPath} className="back-link">
          <FiArrowLeft /> {returnLabel}
        </Link>
      </header>
      <main className="contact-main">
        <div className="contact-copy">
          <span className="eyebrow">We’re here to help</span>
          <h1>Let’s talk about your team.</h1>
          <p>
            Have a question, an idea, or want to see how KaamSetu could fit your
            shop? Send us a note.
          </p>
          <div className="contact-method">
            <span>
              <FiMail />
            </span>
            <div>
              <strong>Email us</strong>
              <a href="mailto:hello@kaamsetu.example">hello@kaamsetu.example</a>
            </div>
          </div>
          <div className="contact-method">
            <span>
              <FiCheck />
            </span>
            <div>
              <strong>Typical response</strong>
              <p>Within one business day</p>
            </div>
          </div>
        </div>
        <section className="contact-card">
          <h2>Send a message</h2>
          {sent ? (
            <div className="contact-success">
              <FiCheck />
              <h3>Thanks for reaching out.</h3>
              <p>
                Your message has been received. The KaamSetu team will review
                it and get back to you.
              </p>
              <button
                className="button button-secondary"
                onClick={() => setSent(false)}
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <label className="field">
                Name
                <input
                  required
                  maxLength={MAX_LENGTHS.name}
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Your name"
                />
              </label>
              <label className="field">
                Email
                <input
                  type="email"
                  required
                  maxLength={MAX_LENGTHS.email}
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@company.com"
                />
              </label>
              <label className="field">
                Message
                <textarea
                  required
                  maxLength={MAX_LENGTHS.message}
                  value={form.message}
                  onChange={update("message")}
                  placeholder="How can we help?"
                />
              </label>
              <button className="button button-primary" disabled={saving}>
                {saving ? "Sending…" : "Send message"}
              </button>
              {error && <p className="contact-error" role="alert">{error}</p>}
              <small className="muted">We’ll only use your details to respond to your message.</small>
            </form>
          )}
        </section>
      </main>
      <footer className="info-footer">
        <span>© 2026 KaamSetu</span>
        <span>
          <Link to={`/about?from=${encodeURIComponent(returnPath)}`}>
            About us
          </Link>{" "}
          · <Link to={returnPath}>{returnLabel}</Link>
        </span>
      </footer>
    </div>
  );
}
