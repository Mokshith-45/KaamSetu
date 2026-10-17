import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowUpRight,
  FiCheck,
  FiDownload,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DashboardLayout from "../components/DashboardLayout";
import "./OwnerDashboard.css";

const demoStaff = [
  {
    id: 1,
    name: "Ananya Kapoor",
    role: "Cashier",
    rate: 140,
    availability: "Mon – Fri",
    status: "Active",
  },
  {
    id: 2,
    name: "Rahul Mehta",
    role: "Stock lead",
    rate: 160,
    availability: "Tue – Sat",
    status: "Active",
  },
  {
    id: 3,
    name: "Maya Joseph",
    role: "Floor assistant",
    rate: 130,
    availability: "Weekends",
    status: "Active",
  },
];
const demoShifts = [
  {
    day: "Monday",
    date: "14",
    staff: "Ananya Kapoor",
    role: "Cashier",
    time: "09:00 – 14:00",
    color: "purple",
  },
  {
    day: "Monday",
    date: "14",
    staff: "Rahul Mehta",
    role: "Stock lead",
    time: "10:00 – 16:00",
    color: "green",
  },
  {
    day: "Tuesday",
    date: "15",
    staff: "Maya Joseph",
    role: "Floor assistant",
    time: "12:00 – 18:00",
    color: "orange",
  },
  {
    day: "Wednesday",
    date: "16",
    staff: "Ananya Kapoor",
    role: "Cashier",
    time: "09:00 – 14:00",
    color: "purple",
  },
];
const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function OwnerDashboard() {
  const [name, setName] = useState("Owner");
  const [email, setEmail] = useState("");
  const [staff] = useState(demoStaff);
  const [active, setActive] = useState("overview");
  const [shop, setShop] = useState({
    name: "Sunrise Market",
    address: "12 Market Street",
    open: "09:00",
    close: "18:00",
  });
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(demoShifts);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState("");
  const noticeTimeoutRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.full_name) setName(data.full_name);
    })();
    return () => {
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);
  const filteredStaff = useMemo(
    () =>
      staff.filter((person) =>
        `${person.name} ${person.role}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [staff, query],
  );
  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const updateProfile = async (event) => {
    event.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", user.id);
    setNotice(error ? error.message : "Profile updated in Supabase.");
  };
  const updatePassword = async (event) => {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    setNotice(error ? error.message : "Password updated.");
    setPassword("");
  };
  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      setDraft(demoShifts);
      setGenerating(false);
      setNotice("Demo draft generated. Nothing has been saved.");
      noticeTimeoutRef.current = window.setTimeout(() => {
        setNotice("");
        noticeTimeoutRef.current = null;
      }, 2500);
    }, 550);
  };
  const saveShop = (event) => {
    event.preventDefault();
    setNotice("Shop details saved locally for this demo.");
  };
  return (
    <DashboardLayout
      role="owner"
      name={name}
      email={email}
      activeSection={active}
      setActiveSection={setActive}
      onLogout={logout}
    >
      <div className="page-intro">
        <div>
          <span className="eyebrow">Monday, October 14, 2026</span>
          <h2>
            {active === "overview"
              ? `Good morning, ${name.split(" ")[0]}.`
              : active === "shopSetup"
                ? "Set up your shop"
                : active === "staffManagement"
                  ? "Your team"
                  : active === "aiShiftPlanner"
                    ? "AI shift planner"
                    : active === "schedule"
                      ? "Schedule calendar"
                      : active === "reports"
                        ? "Reports & payroll"
                        : "Settings"}
          </h2>
          <p className="muted">
            {active === "overview"
              ? "Here’s what’s happening with your workforce this week."
              : "Mock workspace data is clearly marked and ready to connect to your backend."}
          </p>
        </div>
        {notice && (
          <div className="inline-notice">
            <FiCheck />
            {notice}
            <button onClick={() => setNotice("")}>
              <FiX />
            </button>
          </div>
        )}
      </div>
      {active === "overview" && (
        <>
          <div className="stat-grid">
            <Stat
              label="Total staff"
              value={staff.length}
              detail="+1 this month"
              tone="purple"
            />
            <Stat
              label="Shifts this week"
              value="18"
              detail="94% coverage"
              tone="green"
            />
            <Stat
              label="Planned hours"
              value="86.5h"
              detail="Within budget"
              tone="orange"
            />
            <Stat
              label="Open shift gaps"
              value="2"
              detail="Needs attention"
              tone="red"
            />
          </div>
          <div className="owner-grid">
            <section className="panel schedule-panel">
              <PanelTitle
                title="This week’s schedule"
                action="View calendar"
                onClick={() => setActive("schedule")}
              />
              <div className="week-strip">
                {["M 14", "T 15", "W 16", "T 17", "F 18", "S 19", "S 20"].map(
                  (day, i) => (
                    <div
                      className={i === 0 ? "selected" : ""}
                      key={`${day}-${i}`}
                    >
                      <b>{day.split(" ")[0]}</b>
                      <span>{day.split(" ")[1]}</span>
                    </div>
                  ),
                )}
              </div>
              {draft.slice(0, 3).map((shift) => (
                <Shift key={`${shift.day}-${shift.staff}`} shift={shift} />
              ))}
            </section>
            <section className="panel">
              <PanelTitle title="Quick actions" />
              <div className="quick-actions">
                <button onClick={() => setActive("aiShiftPlanner")}>
                  <FiRefreshCw />
                  <span>
                    <b>Generate a draft</b>
                    <small>Let AI balance next week</small>
                  </span>
                  <FiArrowUpRight />
                </button>
                <button onClick={() => setActive("staffManagement")}>
                  <FiPlus />
                  <span>
                    <b>Add a team member</b>
                    <small>Invite someone to your workspace</small>
                  </span>
                  <FiArrowUpRight />
                </button>
                <button onClick={() => setActive("shopSetup")}>
                  <FiCheck />
                  <span>
                    <b>Complete shop setup</b>
                    <small>Review your business details</small>
                  </span>
                  <FiArrowUpRight />
                </button>
              </div>
            </section>
          </div>
        </>
      )}
      {active === "shopSetup" && (
        <section className="panel form-panel">
          <PanelTitle title="Business details" />
          <p className="muted">
            This demo form stores changes in local component state only.
          </p>
          <form className="form-grid" onSubmit={saveShop}>
            <label className="field">
              Shop name
              <input
                value={shop.name}
                onChange={(e) => setShop({ ...shop, name: e.target.value })}
              />
            </label>
            <label className="field">
              Address
              <input
                value={shop.address}
                onChange={(e) => setShop({ ...shop, address: e.target.value })}
              />
            </label>
            <label className="field">
              Opening time
              <input
                type="time"
                value={shop.open}
                onChange={(e) => setShop({ ...shop, open: e.target.value })}
              />
            </label>
            <label className="field">
              Closing time
              <input
                type="time"
                value={shop.close}
                onChange={(e) => setShop({ ...shop, close: e.target.value })}
              />
            </label>
            <label className="field full">
              Required roles
              <input defaultValue="Cashier, Stock lead, Floor assistant" />
            </label>
            <div className="form-actions">
              <button className="button button-primary">Save details</button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setActive("overview")}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
      {active === "staffManagement" && (
        <section className="panel">
          <PanelTitle
            title="Staff management"
            action={
              <button className="button button-primary">
                <FiPlus /> Add staff
              </button>
            }
          />
          <div className="table-toolbar">
            <div className="search-box">
              <FiSearch />
              <input
                placeholder="Search your team"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="badge badge-neutral">
              {filteredStaff.length} members
            </span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Team member</th>
                  <th>Role</th>
                  <th>Rate</th>
                  <th>Availability</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <span className="table-avatar">
                        {person.name.charAt(0)}
                      </span>
                      <strong>{person.name}</strong>
                    </td>
                    <td>{person.role}</td>
                    <td>{formatINR(person.rate)}/hr</td>
                    <td>{person.availability}</td>
                    <td>
                      <span className="badge badge-success">
                        {person.status}
                      </span>
                    </td>
                    <td>
                      <button className="button button-ghost">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {(active === "aiShiftPlanner" || active === "schedule") && (
        <section className="panel">
          <PanelTitle
            title={
              active === "aiShiftPlanner"
                ? "AI shift planner"
                : "Schedule calendar"
            }
            action={
              <button className="button button-primary" onClick={generate}>
                {generating ? (
                  "Generating…"
                ) : (
                  <>
                    <FiRefreshCw />{" "}
                    {active === "aiShiftPlanner"
                      ? "Generate demo draft"
                      : "Regenerate"}
                  </>
                )}
              </button>
            }
          />
          <div className="planner-banner">
            <FiZap />
            <span>
              <strong>Demo draft</strong> This schedule is generated locally and
              is not saved to Supabase. Review it before connecting a scheduling
              service.
            </span>
          </div>
          {active === "aiShiftPlanner" && (
            <div className="planner-controls">
              <label className="field">
                Week starting
                <input type="date" defaultValue="2026-10-14" />
              </label>
              <label className="field">
                Max hours per person
                <input type="number" defaultValue="40" />
              </label>
              <span className="badge badge-warning">2 uncovered periods</span>
            </div>
          )}
          <div className="draft-list">
            {draft.map((shift) => (
              <Shift
                key={`${shift.day}-${shift.staff}`}
                shift={shift}
                editable
                onRemove={() =>
                  setDraft(draft.filter((item) => item !== shift))
                }
              />
            ))}
          </div>
        </section>
      )}
      {active === "reports" && (
        <section className="panel">
          <PanelTitle
            title="Reports & payroll"
            action={
              <button className="button button-secondary">
                <FiDownload /> Export CSV
              </button>
            }
          />
          <div className="stat-grid compact">
            <Stat
              label="Scheduled hours"
              value="86.5h"
              detail="Oct 14 – 20"
              tone="purple"
            />
            <Stat
              label="Estimated payroll"
              value={formatINR(12440)}
              detail="Hours × hourly rate"
              tone="green"
            />
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Team member</th>
                  <th>Hours</th>
                  <th>Rate</th>
                  <th>Estimated pay</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((person, index) => (
                  <tr key={person.id}>
                    <td>
                      <strong>{person.name}</strong>
                    </td>
                    <td>{[25, 31.5, 30][index]}h</td>
                    <td>{formatINR(person.rate)}/hr</td>
                    <td>
                      <strong>
                        {formatINR([3500, 5040, 3900][index])}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {active === "settings" && (
        <section className="panel settings-panel">
          <PanelTitle title="Profile & settings" />
          <form onSubmit={updateProfile} className="form-row">
            <label className="field">
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              Email
              <input value={email} disabled />
            </label>
            <button className="button button-primary">Update profile</button>
          </form>
          <hr />
          <form onSubmit={updatePassword} className="form-row">
            <label className="field">
              New password
              <input
                type="password"
                minLength="6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </label>
            <button className="button button-secondary">Change password</button>
          </form>
        </section>
      )}
    </DashboardLayout>
  );
}
function Stat({ label, value, detail, tone }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function PanelTitle({ title, action, onClick }) {
  return (
    <div className="panel-title">
      <h3>{title}</h3>
      {action &&
        (typeof action === "string" ? (
          <button className="text-button" onClick={onClick}>
            {action} <FiArrowUpRight />
          </button>
        ) : (
          action
        ))}
    </div>
  );
}
function Shift({ shift, editable, onRemove }) {
  return (
    <div className={`shift-item shift-${shift.color}`}>
      <span className="shift-date">
        <b>{shift.date}</b>
        <small>{shift.day.slice(0, 3)}</small>
      </span>
      <div>
        <strong>{shift.staff}</strong>
        <small>{shift.role}</small>
      </div>
      <span className="shift-time">{shift.time}</span>
      {editable && (
        <button
          className="button button-ghost"
          onClick={onRemove}
          aria-label={`Remove ${shift.staff} shift`}
        >
          <FiX />
        </button>
      )}
    </div>
  );
}
