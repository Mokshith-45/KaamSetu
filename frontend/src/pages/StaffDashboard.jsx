import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiHeart,
  FiKey,
  FiMapPin,
  FiSearch,
  FiSend,
  FiX,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
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

const normalizeInvitationCode = (value) =>
  value.toUpperCase().replace(/[\s-]/g, "");
const hashInvitationCode = async (code) => {
  const encoded = new TextEncoder().encode(normalizeInvitationCode(code));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

export default function StaffDashboard() {
  const [name, setName] = useState(
    localStorage.getItem("userFullName") || "Staff member",
  );
  const [email, setEmail] = useState("");
  const [active, setActive] = useState("overview");
  const [days, setDays] = useState(["Monday", "Tuesday", "Friday"]);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [discoveries, setDiscoveries] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myShops, setMyShops] = useState([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [staffDataLoading, setStaffDataLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const realtimeChannelRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const routeSection =
    {
      "/staff-dashboard": "overview",
      "/staff-dashboard/shop-discovery": "shopDiscovery",
      "/staff-dashboard/my-shifts": "myShifts",
      "/staff-dashboard/availability": "availability",
      "/staff-dashboard/notifications": "notifications",
      "/staff-dashboard/settings": "settings",
    }[location.pathname] || "overview";
  const loadStaffData = useCallback(async () => {
    setStaffDataLoading(true);
    const [requestResult, shopResult] = await Promise.all([
      supabase.rpc("list_my_shop_requests"),
      supabase.rpc("list_my_shops"),
    ]);
    setStaffDataLoading(false);
    if (requestResult.error) {
      setNotice(`Could not load your requests: ${requestResult.error.message}`);
    } else {
      setRequests(requestResult.data || []);
    }
    if (shopResult.error) {
      setNotice(`Could not load your shops: ${shopResult.error.message}`);
    } else {
      setMyShops(shopResult.data || []);
    }
  }, []);
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
  useEffect(() => {
    if (active !== "shopDiscovery") return undefined;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setDiscoveryLoading(true);
      const { data, error } = await supabase.rpc("discover_shops", {
        p_search: shopSearch.trim(),
        p_limit: 20,
      });
      if (cancelled) return;
      setDiscoveryLoading(false);
      if (error) {
        setNotice(`Could not find shops: ${error.message}`);
        return;
      }
      setDiscoveries(data || []);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, shopSearch]);
  useEffect(() => {
    if (active !== "shopDiscovery") return;
    loadStaffData();
  }, [active, loadStaffData]);
  useEffect(() => {
    setActive(routeSection);
  }, [routeSection]);
  const changeActiveSection = (section) => {
    setActive(section);
    navigate(
      `/staff-dashboard${
        section === "overview"
          ? ""
          : `/${section.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
      }`,
    );
  };
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || cancelled) return;
      const channel = supabase
        .channel(`staff-workforce-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shop_join_requests", filter: `user_id=eq.${userId}` },
          () => loadStaffData(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shop_members", filter: `user_id=eq.${userId}` },
          () => loadStaffData(),
        )
        .subscribe();
      realtimeChannelRef.current = channel;
    });
    return () => {
      cancelled = true;
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [loadStaffData]);
  const submitInvitationCode = async (event) => {
    event.preventDefault();
    const normalized = normalizeInvitationCode(invitationCode);
    if (!/^KS[A-Z0-9]{12}$/.test(normalized)) {
      setNotice("Enter a valid invitation code such as KS-ABCD-EFGH-JKLM.");
      return;
    }
    setCodeSubmitting(true);
    try {
      const codeHash = await hashInvitationCode(normalized);
      const { error } = await supabase.rpc("redeem_shop_invitation", {
        p_code_hash: codeHash,
      });
      if (error) {
        setNotice(`Could not redeem invitation code: ${error.message}`);
        return;
      }
      setInvitationCode("");
      setNotice("Code accepted. Your join request is pending owner approval.");
      loadStaffData();
    } catch (error) {
      setNotice(`Could not redeem invitation code: ${error.message}`);
    } finally {
      setCodeSubmitting(false);
    }
  };
  const requestToJoin = async (shopId) => {
    setJoinLoading(shopId);
    const { error } = await supabase.rpc("request_to_join_shop", {
      p_shop_id: shopId,
    });
    setJoinLoading("");
    setNotice(
      error
        ? `Could not request to join: ${error.message}`
        : "Join request sent. The owner must approve it before you can join.",
    );
    if (!error) loadStaffData();
  };
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
                onClick={() => changeActiveSection("myShifts")}
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
      {active === "shopDiscovery" && (
        <div className="staff-onboarding-grid">
          <section className="panel shop-discovery-panel">
            <div className="panel-title">
              <div>
                <h3>Find a shop</h3>
                <p className="muted">Search discoverable shops and request to join.</p>
              </div>
            </div>
            <div className="search-box staff-shop-search">
              <FiSearch />
              <input
                placeholder="Search by shop name or address"
                value={shopSearch}
                onChange={(event) => setShopSearch(event.target.value)}
                aria-label="Search discoverable shops"
              />
            </div>
            {discoveryLoading ? (
              <p className="form-status" role="status">Searching shops…</p>
            ) : discoveries.length ? (
              <div className="shop-result-list">
                {discoveries.map((shop) => (
                  <article className="shop-result-card" key={shop.id}>
                    <div>
                      <strong>{shop.shop_name}</strong>
                      <span><FiMapPin /> {shop.address || "Address not provided"}</span>
                      <small>{shop.timezone || "Asia/Kolkata"}</small>
                    </div>
                    <button
                      className="button button-secondary"
                      onClick={() => requestToJoin(shop.id)}
                      disabled={joinLoading === shop.id}
                    >
                      {joinLoading === shop.id ? "Sending…" : "Request to join"}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">No discoverable shops match your search.</p>
            )}
          </section>
          <section className="panel">
            <div className="panel-title"><h3>Join with code</h3></div>
            <p className="muted">Enter the invitation code shared by a shop owner. Approval is still required.</p>
            <form className="code-entry-form" onSubmit={submitInvitationCode}>
              <label className="field">
                Invitation code
                <input
                  value={invitationCode}
                  onChange={(event) => setInvitationCode(event.target.value)}
                  placeholder="KS-ABCD-EFGH-JKLM"
                  autoComplete="off"
                  disabled={codeSubmitting}
                />
              </label>
              <button className="button button-primary" disabled={codeSubmitting}>
                <FiKey /> {codeSubmitting ? "Submitting…" : "Join with code"}
              </button>
            </form>
          </section>
          <section className="panel">
            <div className="panel-title"><h3>My requests</h3></div>
            {staffDataLoading ? <p className="form-status">Loading requests…</p> : requests.length ? requests.map((request) => (
              <div className="onboarding-row" key={request.request_id || request.id}>
                <div><strong>{request.shop_name || request.name}</strong><small>{new Date(request.requested_at || request.created_at).toLocaleDateString()}</small></div>
                <span className={`request-status request-${String(request.request_status || request.status).toLowerCase()}`}>{request.request_status || request.status}</span>
              </div>
            )) : <p className="empty-state">You have not requested to join a shop yet.</p>}
          </section>
          <section className="panel">
            <div className="panel-title"><h3>My shops</h3></div>
            {staffDataLoading ? <p className="form-status">Loading shops…</p> : myShops.length ? myShops.map((shop) => (
              <div className="onboarding-row" key={shop.id}>
                <div><strong>{shop.shop_name || shop.name}</strong><small>{shop.address || "Address not provided"}</small></div>
                <span className={`request-status ${String(shop.membership_status).toLowerCase() === "active" ? "request-approved" : "request-removed"}`}>
                  {String(shop.membership_status).toLowerCase() === "active" ? "Joined" : "Removed"}
                </span>
              </div>
            )) : <p className="empty-state">No approved shops yet.</p>}
          </section>
        </div>
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
