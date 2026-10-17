import { createElement, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiCalendar,
  FiGrid,
  FiMenu,
  FiSettings,
  FiUsers,
  FiX,
  FiZap,
  FiLogOut,
  FiBell,
} from "react-icons/fi";
import "./DashboardLayout.css";

const ownerNav = [
  ["overview", "Overview", FiGrid],
  ["shopSetup", "Shop setup", FiSettings],
  ["staffManagement", "Staff management", FiUsers],
  ["aiShiftPlanner", "AI shift planner", FiZap],
  ["schedule", "Schedule calendar", FiCalendar],
  ["reports", "Reports & payroll", FiBarChart2],
  ["settings", "Settings", FiSettings],
];
const staffNav = [
  ["overview", "Overview", FiGrid],
  ["myShifts", "My shifts", FiCalendar],
  ["availability", "Availability", FiUsers],
  ["notifications", "Notifications", FiBell],
];

export default function DashboardLayout({
  role,
  name,
  email,
  activeSection,
  setActiveSection,
  onLogout,
  children,
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const nav = role === "owner" ? ownerNav : staffNav;
  const title = nav.find(([id]) => id === activeSection)?.[1] || "Overview";
  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">K</span>
          <span>
            Kaam<span className="brand-accent">Setu</span>
          </span>
          <button
            className="sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>
        <p className="sidebar-label">
          {role === "owner" ? "Workspace" : "My workspace"}
        </p>
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={activeSection === id ? "active" : ""}
              onClick={() => {
                setActiveSection(id);
                setOpen(false);
                navigate(
                  `/${role}-dashboard${
                    id === "overview"
                      ? ""
                      : `/${id.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
                  }`,
                );
              }}
            >
              {createElement(Icon)}
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to={{ pathname: "/about", search: `?from=/${role}-dashboard` }}>
            About KaamSetu
          </Link>
          <Link to={{ pathname: "/contact", search: `?from=/${role}-dashboard` }}>
            Help & contact
          </Link>
          <button onClick={onLogout}>
            <FiLogOut /> Log out
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="menu-button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
          <div>
            <p className="eyebrow">
              {role === "owner" ? "Owner workspace" : "Staff portal"}
            </p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-user">
            <span className="topbar-bell">
              <FiBell />
            </span>
            <span className="avatar">
              {(name || "U").charAt(0).toUpperCase()}
            </span>
            <div className="topbar-user-copy">
              <strong>{name || "User"}</strong>
              <small>{email || "Demo account"}</small>
            </div>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
