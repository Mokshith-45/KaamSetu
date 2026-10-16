import { createElement } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiHeart,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";
import "./About.css";

export default function About() {
  const [searchParams] = useSearchParams();
  const requestedReturnPath = searchParams.get("from");
  const returnPath = ["/owner-dashboard", "/staff-dashboard"].includes(
    requestedReturnPath,
  )
    ? requestedReturnPath
    : "/";
  const returnLabel = returnPath === "/" ? "Back to home" : "Back to dashboard";

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
      <main className="about-main">
        <section className="about-hero">
          <span className="eyebrow">About KaamSetu</span>
          <h1>Good work starts with a better plan.</h1>
          <p>
            KaamSetu is a simple workforce-management tool for the people who
            keep local businesses moving: owners, managers, and part-time teams.
          </p>
        </section>
        <section className="about-story">
          <div>
            <span className="eyebrow">Why we exist</span>
            <h2>Small teams deserve thoughtful tools.</h2>
          </div>
          <p>
            Scheduling should not require a spreadsheet maze or a group chat
            full of “who can cover?”. We are building KaamSetu to make the
            weekly rhythm of work clear, fair, and easier to change.
          </p>
        </section>
        <div className="about-values">
          {[
            [
              FiTarget,
              "Clarity first",
              "See coverage, availability, and changes without digging.",
            ],
            [
              FiUsers,
              "Made for teams",
              "Give owners control and staff a calm, focused experience.",
            ],
            [
              FiHeart,
              "People over process",
              "Automation should support better decisions, not replace them.",
            ],
          ].map(([Icon, title, text]) => (
            <article key={title}>
              {createElement(Icon)}
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <section className="about-promise">
          <div>
            <span className="eyebrow">Our promise</span>
            <h2>Keep the human in workforce management.</h2>
          </div>
          <ul>
            {[
              "Clear schedules everyone can understand",
              "Flexible tools for changing real-world needs",
              "A foundation that grows with your business",
            ].map((item) => (
              <li key={item}>
                <FiCheck />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="info-footer">
        <span>© 2026 KaamSetu</span>
        <span>
          <Link to={`/contact?from=${encodeURIComponent(returnPath)}`}>
            Contact us
          </Link>{" "}
          · <Link to={returnPath}>{returnLabel}</Link>
        </span>
      </footer>
    </div>
  );
}
