import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiHeart,
  FiSend,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DashboardLayout from "../components/DashboardLayout";
import "./StaffDashboard.css";

const demoShifts = [
  {
    day: "Monday",
    date: "14 Oct",
    role: "Cashier",
    time: "09:00 – 14:00",
    shop: "Sunrise Market",
    state: "upcoming",
  },
  {
    day: "Tuesday",
    date: "15 Oct",
    role: "Floor assistant",
    time: "12:00 – 18:00",
    shop: "Sunrise Market",
    state: "upcoming",
  },
  {
    day: "Saturday",
    date: "19 Oct",
    role: "Cashier",
    time: "10:00 – 15:00",
    shop: "Sunrise Market",
    state: "upcoming",
  },
];

export default function StaffDashboard() {
  const [name, setName] = useState(
    localStorage.getItem("userFullName") || "Staff member",
  );
  const [email, setEmail] = useState("");
  const [active, setActive] = useState("overview");
  const [days, setDays] = useState(["Monday", "Tuesday", "Friday"]);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
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
  }, []);
  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const saveProfile = async (event) => {
    event.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", user.id);
    localStorage.setItem("userFullName", name);
    setNotice(error ? error.message : "Profile updated.");
  };
  const savePassword = async (event) => {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    setNotice(error ? error.message : "Password updated.");
    setPassword("");
  };
  const toggleDay = (day) =>
    setDays(
      days.includes(day) ? days.filter((item) => item !== day) : [...days, day],
    );
  return (
    <DashboardLayout
      role="staff"
      name={name}
      email={email}
      activeSection={active}
      setActiveSection={setActive}
      onLogout={logout}
    >
      <div className="page-intro">
        <div>
          <span className="eyebrow">Your workspace</span>
          <h2>
            {active === "overview"
              ? `Hi ${name.split(" ")[0]}, you’re all set.`
              : active === "myShifts"
                ? "My shifts"
                : active === "availability"
                  ? "Your availability"
                  : active === "notifications"
                    ? "Notifications"
                    : "Profile settings"}
          </h2>
          <p className="muted">
            Your schedule at a glance, without the busywork.
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
          <div className="staff-hero-card">
            <div>
              <span className="badge badge-success">Next shift · Tomorrow</span>
              <h3>Cashier shift</h3>
              <p>
                <FiCalendar /> Monday, 14 October · <FiClock /> 09:00 – 14:00
              </p>
              <small>Sunrise Market · Main floor</small>
            </div>
            <span className="staff-hero-icon">
              <FiCalendar />
            </span>
          </div>
          <div className="staff-stat-grid">
            <div>
              <FiClock />
              <strong>16h</strong>
              <span>Scheduled this week</span>
            </div>
            <div>
              <FiHeart />
              <strong>3</strong>
              <span>Upcoming shifts</span>
            </div>
            <div>
              <FiSend />
              <strong>1</strong>
              <span>Open request</span>
            </div>
          </div>
          <section className="panel staff-shifts">
            <div className="panel-title">
              <h3>Coming up</h3>
              <button
                className="text-button"
                onClick={() => setActive("myShifts")}
              >
                See all <FiCalendar />
              </button>
            </div>
            {demoShifts.slice(0, 2).map((shift) => (
              <StaffShift key={shift.date} shift={shift} />
            ))}
          </section>
        </>
      )}
      {active === "myShifts" && (
        <section className="panel staff-shifts">
          <div className="panel-title">
            <h3>Weekly schedule</h3>
            <span className="badge badge-neutral">16 hours planned</span>
          </div>
          {demoShifts.map((shift) => (
            <StaffShift key={shift.date} shift={shift} />
          ))}
        </section>
      )}
      {active === "availability" && (
        <section className="panel availability-panel">
          <div className="panel-title">
            <div>
              <h3>When can you work?</h3>
              <p className="muted">
                This preference is a demo and is not saved yet.
              </p>
            </div>
          </div>
          <div className="availability-days">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <button
                className={days.includes(day) ? "selected" : ""}
                onClick={() => toggleDay(day)}
                key={day}
              >
                <FiCheck />
                {day}
              </button>
            ))}
          </div>
          <button
            className="button button-primary"
            onClick={() =>
              setNotice("Availability updated locally for this demo.")
            }
          >
            Save availability
          </button>
          <hr />
          <h3>Request a day off</h3>
          <div className="day-off-row">
            <label className="field">
              Date
              <input type="date" />
            </label>
            <label className="field">
              Reason
              <input placeholder="Optional note" />
            </label>
            <button
              className="button button-secondary"
              onClick={() =>
                setNotice("Day-off request saved locally for this demo.")
              }
            >
              Request day off
            </button>
          </div>
        </section>
      )}
      {active === "notifications" && (
        <section className="panel notifications">
          <div className="notification-item">
            <span className="notification-dot" />
            <div>
              <strong>Schedule updated</strong>
              <p>Your Monday shift is confirmed for 09:00 – 14:00.</p>
              <small>Yesterday</small>
            </div>
          </div>
          <div className="notification-item">
            <span className="notification-dot muted-dot" />
            <div>
              <strong>Welcome to KaamSetu</strong>
              <p>Your owner can share schedules and updates here.</p>
              <small>3 days ago</small>
            </div>
          </div>
        </section>
      )}
      {active === "settings" && (
        <section className="panel settings-panel">
          <div className="panel-title">
            <h3>Profile settings</h3>
          </div>
          <form onSubmit={saveProfile} className="form-row">
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
          <form onSubmit={savePassword} className="form-row">
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
function StaffShift({ shift }) {
  return (
    <div className="staff-shift">
      <div className="staff-shift-date">
        <strong>{shift.date.split(" ")[0]}</strong>
        <small>{shift.date.split(" ")[1]}</small>
      </div>
      <div>
        <strong>{shift.role}</strong>
        <span>{shift.shop}</span>
      </div>
      <b>{shift.time}</b>
      <span className="badge badge-success">Confirmed</span>
    </div>
  );
}
