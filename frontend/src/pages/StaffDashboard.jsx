import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiHeart,
  FiKey,
  FiMapPin,
  FiSearch,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DashboardLayout from "../components/DashboardLayout";
import { useCurrentDateLabel } from "../utils/currentDate";
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
const weekDays = [
  { label: "Monday", dbDay: 1 },
  { label: "Tuesday", dbDay: 2 },
  { label: "Wednesday", dbDay: 3 },
  { label: "Thursday", dbDay: 4 },
  { label: "Friday", dbDay: 5 },
  { label: "Saturday", dbDay: 6 },
  { label: "Sunday", dbDay: 0 },
];
const emptyAvailability = () =>
  weekDays.map(({ label, dbDay }) => ({
    label,
    dbDay,
    windows: [],
  }));
const timeToMinutes = (value) => {
  const [hours, minutes] = String(value || "")
    .trim()
    .split(":")
    .map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : null;
};
const statusLabel = (status) =>
  String(status || "pending").charAt(0).toUpperCase() +
  String(status || "pending").slice(1);
const getDateInTimeZone = (timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => ["year", "month", "day"].includes(type))
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};

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
  const currentDateLabel = useCurrentDateLabel();
  const [name, setName] = useState(
    localStorage.getItem("userFullName") || "Staff member",
  );
  const [email, setEmail] = useState("");
  const [active, setActive] = useState("overview");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [discoveries, setDiscoveries] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myShops, setMyShops] = useState([]);
  const [userId, setUserId] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState("");
  const [availability, setAvailability] = useState(emptyAvailability);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [removedAvailabilityIds, setRemovedAvailabilityIds] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [timeOffLoading, setTimeOffLoading] = useState(false);
  const [timeOffSaving, setTimeOffSaving] = useState(false);
  const [timeOffAction, setTimeOffAction] = useState("");
  const [timeOffHistoryClearing, setTimeOffHistoryClearing] = useState(false);
  const [timeOffForm, setTimeOffForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [staffDataLoading, setStaffDataLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [historyClearing, setHistoryClearing] = useState(false);
  const realtimeChannelRef = useRef(null);
  const noticeTimeoutRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const routeSection =
    {
      "/staff-dashboard": "overview",
      "/staff-dashboard/shop-discovery": "shopDiscovery",
      "/staff-dashboard/my-shifts": "myShifts",
      "/staff-dashboard/availability": "availability",
      "/staff-dashboard/time-off": "timeOff",
      "/staff-dashboard/notifications": "notifications",
      "/staff-dashboard/settings": "settings",
    }[location.pathname] || "overview";
  const activeShops = useMemo(
    () =>
      myShops.filter((shop) =>
        ["joined", "active"].includes(
          String(shop.membership_status).toLowerCase(),
        ),
      ),
    [myShops],
  );
  const selectedShop = activeShops.find(
    (shop) => (shop.shop_id || shop.id) === selectedShopId,
  );
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
      setUserId(user.id);
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
    if (!["shopDiscovery", "availability", "timeOff"].includes(active)) return;
    loadStaffData();
  }, [active, loadStaffData]);
  useEffect(() => {
    if (
      selectedShopId &&
      activeShops.some((shop) => (shop.shop_id || shop.id) === selectedShopId)
    ) {
      return;
    }
    setSelectedShopId(activeShops[0] ? activeShops[0].shop_id || activeShops[0].id : "");
  }, [activeShops, selectedShopId]);
  useEffect(() => {
    let cancelled = false;
    const loadMembership = async () => {
      if (!userId || !selectedShopId) {
        setSelectedMemberId("");
        setMembershipError("");
        setMembershipLoading(false);
        return;
      }
      setMembershipLoading(true);
      setMembershipError("");
      const selectedMembership = myShops.find(
        (shop) => (shop.shop_id || shop.id) === selectedShopId,
      );
      const listedMemberId =
        selectedMembership?.shop_member_id ||
        selectedMembership?.member_id ||
        selectedMembership?.membership_id;
      let membershipQuery = supabase
        .from("shop_members")
        .select("id, is_active, removed_at")
        .eq("is_active", true)
        .is("removed_at", null)
        .limit(1);
      membershipQuery = listedMemberId
        ? membershipQuery.eq("id", listedMemberId)
        : membershipQuery.eq("user_id", userId).eq("shop_id", selectedShopId);
      const { data, error } = await membershipQuery.maybeSingle();
      if (cancelled) return;
      setMembershipLoading(false);
      if (error) {
        setSelectedMemberId("");
        setMembershipError(`Could not load shop membership: ${error.message}`);
        return;
      }
      setSelectedMemberId(data?.id || "");
    };
    loadMembership();
    return () => {
      cancelled = true;
    };
  }, [myShops, selectedShopId, userId]);
  useEffect(() => {
    setActive(routeSection);
  }, [routeSection]);
  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);
  const showSuccessNotice = (message) => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
    setNotice(message);
    noticeTimeoutRef.current = window.setTimeout(() => {
      setNotice("");
      noticeTimeoutRef.current = null;
    }, 2500);
  };
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
      showSuccessNotice("Code accepted. Your join request is pending owner approval.");
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
    if (error) {
      setNotice(`Could not request to join: ${error.message}`);
    } else {
      showSuccessNotice(
        "Join request sent. The owner must approve it before you can join.",
      );
    }
    if (!error) loadStaffData();
  };
  const getShopMembership = (shopId) =>
    myShops.find((shop) => (shop.shop_id || shop.id) === shopId);
  const getLatestShopRequest = (shopId) =>
    requests
      .filter((request) => (request.shop_id || request.shop?.id) === shopId)
      .sort(
        (left, right) =>
          new Date(right.requested_at || right.created_at || 0) -
          new Date(left.requested_at || left.created_at || 0),
      )[0];
  const getDiscoveryAction = (shopId) => {
    const membership = getShopMembership(shopId);
    const membershipStatus = String(membership?.membership_status || "").toLowerCase();
    if (["joined", "active"].includes(membershipStatus)) {
      return { label: "Joined", disabled: true };
    }
    const requestStatus = String(getLatestShopRequest(shopId)?.request_status || "").toLowerCase();
    if (requestStatus === "pending") {
      return { label: "Pending approval", disabled: true };
    }
    if (membershipStatus === "removed") {
      return { label: "Request to join again", disabled: false };
    }
    return { label: "Request to join", disabled: false };
  };
  const clearMyRequestHistory = async () => {
    if (!window.confirm("Clear your approved and rejected join-request history?")) {
      return;
    }
    setHistoryClearing(true);
    const { error } = await supabase.rpc("clear_my_shop_request_history");
    setHistoryClearing(false);
    if (error) {
      setNotice(`Could not clear request history: ${error.message}`);
      return;
    }
    setRequests((current) =>
      current.filter(
        (request) =>
          !["approved", "rejected"].includes(
            String(request.request_status || request.status).toLowerCase(),
          ),
      ),
    );
    showSuccessNotice("Your completed request history was cleared.");
  };
  const loadAvailability = useCallback(async () => {
    if (!selectedMemberId) {
      setAvailability(emptyAvailability());
      return;
    }
    setAvailabilityLoading(true);
    const { data, error } = await supabase
      .from("staff_availability")
      .select("id, day_of_week, start_time, end_time, is_available")
      .eq("shop_member_id", selectedMemberId)
      .order("day_of_week")
      .order("start_time");
    setAvailabilityLoading(false);
    if (error) {
      setNotice(`Could not load availability: ${error.message}`);
      return;
    }
    const next = emptyAvailability();
    (data || []).forEach((row) => {
      const day = next.find((item) => item.dbDay === row.day_of_week);
      if (day) {
        day.windows.push({
          id: row.id,
          startTime: String(row.start_time).slice(0, 5),
          endTime: String(row.end_time).slice(0, 5),
          isAvailable: row.is_available,
        });
      }
    });
    setRemovedAvailabilityIds([]);
    setAvailability(next);
  }, [selectedMemberId]);
  const loadTimeOffRequests = useCallback(async () => {
    if (!selectedMemberId) {
      setTimeOffRequests([]);
      return;
    }
    setTimeOffLoading(true);
    const { data, error } = await supabase
      .from("time_off_requests")
      .select("id, start_date, end_date, reason, status, created_at")
      .eq("shop_member_id", selectedMemberId)
      .order("created_at", { ascending: false });
    setTimeOffLoading(false);
    if (error) {
      setNotice(`Could not load time-off requests: ${error.message}`);
      return;
    }
    setTimeOffRequests(data || []);
  }, [selectedMemberId]);
  useEffect(() => {
    if (active === "availability") loadAvailability();
    if (active === "timeOff") loadTimeOffRequests();
  }, [active, loadAvailability, loadTimeOffRequests]);
  useEffect(() => {
    if (!selectedMemberId) return undefined;
    const channel = supabase
      .channel(`staff-time-off-${selectedMemberId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_off_requests",
          filter: `shop_member_id=eq.${selectedMemberId}`,
        },
        () => loadTimeOffRequests(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTimeOffRequests, selectedMemberId]);
  const updateAvailabilityWindow = (dayIndex, windowIndex, field, value) => {
    setAvailability((current) =>
      current.map((day, index) =>
        index !== dayIndex
          ? day
          : {
              ...day,
              windows: day.windows.map((item, itemIndex) =>
                itemIndex === windowIndex ? { ...item, [field]: value } : item,
              ),
            },
      ),
    );
  };
  const addAvailabilityWindow = (dayIndex) => {
    setAvailability((current) =>
      current.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              windows: [
                ...day.windows,
                { startTime: "", endTime: "", isAvailable: true },
              ],
            }
          : day,
      ),
    );
  };
  const removeAvailabilityWindow = (dayIndex, windowIndex) => {
    setAvailability((current) =>
      current.map((day, index) => {
        if (index !== dayIndex) return day;
        const removed = day.windows[windowIndex];
        if (removed?.id) setRemovedAvailabilityIds((ids) => [...ids, removed.id]);
        return { ...day, windows: day.windows.filter((_, i) => i !== windowIndex) };
      }),
    );
  };
  const copyMondayToAllDays = () => {
    const monday = availability[0];
    const removedIds = availability
      .slice(1)
      .flatMap((day) => day.windows.map((window) => window.id).filter(Boolean));
    setRemovedAvailabilityIds((ids) => [
      ...new Set([...ids, ...removedIds]),
    ]);
    setAvailability((current) =>
      current.map((day, index) => {
        if (index === 0) return day;
        return {
          ...day,
          windows: monday.windows.map((window) => ({
            startTime: window.startTime,
            endTime: window.endTime,
            isAvailable: window.isAvailable,
          })),
        };
      }),
    );
  };
  const saveAvailability = async () => {
    if (!selectedMemberId) {
      setNotice("Select an active shop membership before editing availability.");
      return;
    }
    const keys = new Set();
    for (const day of availability) {
      for (const [windowIndex, window] of day.windows.entries()) {
        if (!window.startTime || !window.endTime) {
          setNotice(`Enter both times for ${day.label}, window ${windowIndex + 1}.`);
          return;
        }
        const startMinutes = timeToMinutes(window.startTime);
        const endMinutes = timeToMinutes(window.endTime);
        if (
          startMinutes === null ||
          endMinutes === null ||
          endMinutes <= startMinutes
        ) {
          setNotice(
            `End time must be after start time on ${day.label}, window ${windowIndex + 1}.`,
          );
          return;
        }
        const key = `${day.dbDay}-${String(window.startTime).trim()}-${String(window.endTime).trim()}`;
        if (keys.has(key)) {
          setNotice(`Duplicate availability window on ${day.label}.`);
          return;
        }
        keys.add(key);
      }
    }
    setAvailabilitySaving(true);
    const existingRows = [];
    const newRows = [];
    availability.forEach((day) => {
      day.windows.forEach((window) => {
        const row = {
          shop_member_id: selectedMemberId,
          day_of_week: day.dbDay,
          start_time: window.startTime,
          end_time: window.endTime,
          is_available: window.isAvailable,
        };
        if (window.id) {
          existingRows.push({ id: window.id, ...row });
        } else {
          newRows.push(row);
        }
      });
    });
    const operations = [];
    existingRows.forEach(({ id, ...row }) => {
      operations.push(
        supabase.from("staff_availability").update(row).eq("id", id),
      );
    });
    if (newRows.length) {
      operations.push(supabase.from("staff_availability").insert(newRows));
    }
    if (removedAvailabilityIds.length) {
      operations.push(
        supabase
          .from("staff_availability")
          .delete()
          .in("id", removedAvailabilityIds),
      );
    }
    try {
      const results = await Promise.all(operations);
      const error = results.find((result) => result.error)?.error;
      if (error) {
        setNotice(`Could not save availability: ${error.message}`);
        return;
      }
      await loadAvailability();
      showSuccessNotice("Availability saved.");
    } catch (error) {
      setNotice(`Could not save availability: ${error.message}`);
    } finally {
      setAvailabilitySaving(false);
    }
  };
  const submitTimeOffRequest = async (event) => {
    event.preventDefault();
    if (!selectedMemberId) {
      setNotice("Select an active shop membership before requesting time off.");
      return;
    }
    if (!timeOffForm.startDate || !timeOffForm.endDate || timeOffForm.endDate < timeOffForm.startDate) {
      setNotice("Choose a valid start and end date.");
      return;
    }
    setTimeOffSaving(true);
    const today = getDateInTimeZone(selectedShop?.timezone || "UTC");
    if (timeOffForm.startDate < today) {
      setTimeOffSaving(false);
      setNotice(`Start date cannot be earlier than today (${today}).`);
      return;
    }
    const { error } = await supabase.rpc("submit_time_off_request", {
      p_shop_member_id: selectedMemberId,
      p_start_date: timeOffForm.startDate,
      p_end_date: timeOffForm.endDate,
      p_reason: timeOffForm.reason.trim() || null,
    });
    setTimeOffSaving(false);
    if (error) {
      setNotice(`Could not submit time-off request: ${error.message}`);
      return;
    }
    setTimeOffForm({ startDate: "", endDate: "", reason: "" });
    await loadTimeOffRequests();
    showSuccessNotice("Time-off request submitted.");
  };
  const cancelTimeOffRequest = async (requestId) => {
    setTimeOffAction(`cancel-${requestId}`);
    const { error } = await supabase.rpc("cancel_my_time_off_request", {
      p_request_id: requestId,
    });
    setTimeOffAction("");
    if (error) {
      setNotice(`Could not cancel request: ${error.message}`);
      return;
    }
    setTimeOffRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, status: "cancelled" } : request,
      ),
    );
    showSuccessNotice("Time-off request cancelled.");
  };
  const clearTimeOffHistory = async () => {
    if (
      !window.confirm(
        "Permanently delete approved and rejected time-off requests for this shop? Pending and cancelled requests will remain.",
      )
    ) {
      return;
    }
    setTimeOffHistoryClearing(true);
    const { data, error } = await supabase.rpc(
      "clear_my_completed_time_off_history",
      { p_shop_member_id: selectedMemberId },
    );
    setTimeOffHistoryClearing(false);
    if (error) {
      setNotice(`Could not clear time-off history: ${error.message}`);
      return;
    }
    const deletedCount = Number(Array.isArray(data) ? data[0] : data) || 0;
    await loadTimeOffRequests();
    showSuccessNotice(`${deletedCount} completed time-off request${deletedCount === 1 ? "" : "s"} deleted.`);
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
    if (error) {
      setNotice(error.message);
    } else {
      showSuccessNotice("Profile updated.");
    }
  };
  const savePassword = async (event) => {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setNotice(error.message);
    } else {
      showSuccessNotice("Password updated.");
    }
    setPassword("");
  };
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
          <span className="eyebrow">{currentDateLabel}</span>
          <h2>
            {active === "overview"
              ? `Hi ${name.split(" ")[0]}, you’re all set.`
              : active === "myShifts"
                ? "My shifts"
                : active === "availability"
                  ? "Your availability"
                    : active === "timeOff"
                      ? "Time off"
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
                    {(() => {
                      const action = getDiscoveryAction(shop.id);
                      return <button
                      className="button button-secondary"
                      onClick={() => requestToJoin(shop.id)}
                      disabled={action.disabled || joinLoading === shop.id}
                    >
                      {joinLoading === shop.id ? "Sending…" : action.label}
                    </button>;
                    })()}
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
            <div className="panel-title">
              <h3>My requests</h3>
              {requests.some((request) =>
                ["approved", "rejected"].includes(
                  String(request.request_status || request.status).toLowerCase(),
                ),
              ) && (
                <button
                  className="button button-ghost"
                  onClick={clearMyRequestHistory}
                  disabled={historyClearing}
                >
                  <FiTrash2 />
                  {historyClearing ? "Clearing…" : "Clear history"}
                </button>
              )}
            </div>
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
                <span className={`request-status ${["joined", "active"].includes(String(shop.membership_status).toLowerCase()) ? "request-approved" : "request-removed"}`}>
                  {["joined", "active"].includes(String(shop.membership_status).toLowerCase()) ? "Joined" : "Removed"}
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
              <h3>Weekly availability</h3>
              <p className="muted">Set one or more work windows for each day.</p>
            </div>
          </div>
          <ShopContext
            shops={activeShops}
            selectedShopId={selectedShopId}
            onChange={setSelectedShopId}
          />
          {!activeShops.length ? (
            <p className="empty-state">Join an approved shop before editing availability.</p>
          ) : availabilityLoading ? (
            <p className="form-status" role="status">Loading availability…</p>
          ) : membershipLoading ? (
            <p className="form-status" role="status">Checking your membership…</p>
          ) : membershipError ? (
            <p className="inline-notice inline-notice-error" role="alert">{membershipError}</p>
          ) : !selectedMemberId ? (
            <p className="empty-state">Availability cannot be edited because this shop membership is inactive.</p>
          ) : (
            <div className="availability-window-list">
              <button
                type="button"
                className="button button-secondary"
                onClick={copyMondayToAllDays}
              >
                Copy Monday to all days
              </button>
              {availability.map((day, dayIndex) => (
                <div className="availability-day-card" key={day.dbDay}>
                  <div className="availability-day-heading">
                    <strong>{day.label}</strong>
                    <button
                      type="button"
                      className={`button button-ghost ${day.windows.some((item) => item.isAvailable) ? "selected" : ""}`}
                      onClick={() =>
                        setAvailability((current) =>
                          current.map((item, index) =>
                            index === dayIndex
                              ? {
                                  ...item,
                                  windows: item.windows.map((window) => ({
                                    ...window,
                                    isAvailable: !item.windows.some((entry) => entry.isAvailable),
                                  })),
                                }
                              : item,
                          ),
                        )
                      }
                    >
                      {day.windows.some((item) => item.isAvailable) ? "Available" : "Unavailable"}
                    </button>
                  </div>
                  {day.windows.map((window, windowIndex) => (
                    <div className="availability-window" key={window.id || `${day.dbDay}-${windowIndex}`}>
                      <label className="field">
                        Start
                        <input
                          type="time"
                          value={window.startTime}
                          onChange={(event) =>
                            updateAvailabilityWindow(dayIndex, windowIndex, "startTime", event.target.value)
                          }
                        />
                      </label>
                      <label className="field">
                        End
                        <input
                          type="time"
                          value={window.endTime}
                          onChange={(event) =>
                            updateAvailabilityWindow(dayIndex, windowIndex, "endTime", event.target.value)
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="button button-ghost"
                        onClick={() => removeAvailabilityWindow(dayIndex, windowIndex)}
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  ))}
                  <button type="button" className="text-button" onClick={() => addAvailabilityWindow(dayIndex)}>
                    + Add time window
                  </button>
                </div>
              ))}
            </div>
          )}
          {selectedMemberId && (
            <button
              className="button button-primary"
              onClick={saveAvailability}
              disabled={availabilitySaving || availabilityLoading || membershipLoading}
              aria-busy={availabilitySaving}
            >
              {availabilitySaving ? "Saving availability…" : "Save availability"}
            </button>
          )}
        </section>
      )}
      {active === "timeOff" && (
        <div className="staff-time-off-grid">
          <section className="panel">
            <div className="panel-title">
              <div>
                <h3>Request time off</h3>
                <p className="muted">Requests are reviewed by the shop owner.</p>
              </div>
            </div>
            <ShopContext
              shops={activeShops}
              selectedShopId={selectedShopId}
              onChange={setSelectedShopId}
            />
            <form className="time-off-form" onSubmit={submitTimeOffRequest}>
              <label className="field">
                Start date
                <input
                  type="date"
                  min={getDateInTimeZone(selectedShop?.timezone || "UTC")}
                  value={timeOffForm.startDate}
                  onChange={(event) => setTimeOffForm((form) => ({ ...form, startDate: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                End date
                <input
                  type="date"
                  min={timeOffForm.startDate || getDateInTimeZone(selectedShop?.timezone || "UTC")}
                  value={timeOffForm.endDate}
                  onChange={(event) => setTimeOffForm((form) => ({ ...form, endDate: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                Reason
                <textarea
                  value={timeOffForm.reason}
                  onChange={(event) => setTimeOffForm((form) => ({ ...form, reason: event.target.value }))}
                  placeholder="Optional note"
                  rows="3"
                />
              </label>
              <button className="button button-primary" disabled={timeOffSaving || !selectedMemberId}>
                {timeOffSaving ? "Submitting…" : "Submit request"}
              </button>
            </form>
          </section>
          <section className="panel">
            <div className="panel-title">
              <h3>My time-off requests</h3>
              {selectedMemberId &&
                timeOffRequests.some((request) =>
                  ["approved", "rejected"].includes(
                    String(request.status).toLowerCase(),
                  ),
                ) && (
                  <button
                    className="button button-ghost"
                    onClick={clearTimeOffHistory}
                    disabled={timeOffHistoryClearing}
                  >
                    {timeOffHistoryClearing
                      ? "Clearing…"
                      : "Clear completed history"}
                  </button>
                )}
            </div>
            {timeOffLoading ? (
              <p className="form-status">Loading requests…</p>
            ) : timeOffRequests.length ? (
              timeOffRequests.map((request) => (
                <div className="onboarding-row" key={request.id}>
                  <div>
                    <strong>{request.start_date} – {request.end_date}</strong>
                    <small>{request.reason || "No reason provided"} · Submitted {new Date(request.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="inline-actions">
                    <span className={`request-status request-${request.status}`}>{statusLabel(request.status)}</span>
                    {request.status === "pending" && (
                      <button
                        className="button button-ghost"
                        onClick={() => cancelTimeOffRequest(request.id)}
                        disabled={Boolean(timeOffAction)}
                      >
                        {timeOffAction === `cancel-${request.id}` ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No time-off requests yet.</p>
            )}
          </section>
        </div>
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

function ShopContext({ shops, selectedShopId, onChange }) {
  if (!shops.length) return null;
  return (
    <label className="field shop-context-field">
      Shop
      <select value={selectedShopId} onChange={(event) => onChange(event.target.value)}>
        {shops.map((shop) => {
          const id = shop.shop_id || shop.id;
          return <option key={id} value={id}>{shop.shop_name || shop.name || "Shop"}</option>;
        })}
      </select>
    </label>
  );
}
