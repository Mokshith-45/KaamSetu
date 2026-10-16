import { useState } from "react";
import { FiArrowLeft, FiCheck, FiMail } from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";
import "./Contact.css";

export default function Contact() {
  const [searchParams] = useSearchParams();
  const requestedReturnPath = searchParams.get("from");
  const returnPath = ["/owner-dashboard", "/staff-dashboard"].includes(
    requestedReturnPath,
  )
    ? requestedReturnPath
    : "/";
  const returnLabel = returnPath === "/" ? "Back to home" : "Back to dashboard";
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const update = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  const submit = (event) => {
    event.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", message: "" });
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
                Your message is ready for the KaamSetu team. This frontend demo
                does not send messages to a server.
              </p>
              <button
                className="button button-secondary"
                onClick={() => setSent(false)}
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label className="field">
                Name
                <input
                  required
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
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@company.com"
                />
              </label>
              <label className="field">
                Message
                <textarea
                  required
                  value={form.message}
                  onChange={update("message")}
                  placeholder="How can we help?"
                />
              </label>
              <button className="button button-primary">Send message</button>
              <small className="muted">
                Demo only — no message is delivered or stored.
              </small>
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
