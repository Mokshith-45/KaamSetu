import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowUpRight,
  FiCheck,
  FiCopy,
  FiDownload,
  FiClock,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiShoppingBag,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DashboardLayout from "../components/DashboardLayout";
import { useCurrentDateLabel } from "../utils/currentDate";
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

const invitationAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const normalizeInvitationCode = (value) =>
  value.toUpperCase().replace(/[\s-]/g, "");
const createInvitationCode = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const raw = Array.from(
    bytes,
    (byte) => invitationAlphabet[byte % invitationAlphabet.length],
  ).join("");
  return `KS-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
};
const hashInvitationCode = async (code) => {
  const encoded = new TextEncoder().encode(normalizeInvitationCode(code));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

const businessDays = [
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
];

const fallbackTimeZones = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const indianTimeZoneAliases = [
  "India",
  "Indian Standard Time",
  "IST",
  "Mumbai",
  "Bombay",
  "Delhi",
  "New Delhi",
  "Bengaluru",
  "Bangalore",
  "Chennai",
  "Madras",
  "Hyderabad",
  "Pune",
  "Kolkata",
];

const timeZoneOptions = (() => {
  let supported = [];
  try {
    supported = Intl.supportedValuesOf?.("timeZone") || [];
  } catch {
    supported = [];
  }
  return [...new Set(["UTC", ...fallbackTimeZones, ...supported])]
    .sort()
    .map((identifier) => ({
      identifier,
      aliases:
        identifier === "Asia/Kolkata"
          ? indianTimeZoneAliases
          : [identifier.replaceAll("_", " ").replaceAll("/", " ")],
    }));
})();

const timeZones = timeZoneOptions.map(({ identifier }) => identifier);

const createEmptyBusinessHours = () =>
  Object.fromEntries(
    businessDays.map(([day]) => [
      day,
      { open: "", close: "", closed: true },
    ]),
  );

const createInitialShop = () => ({
  name: "",
  address: "",
  timezone: "Asia/Kolkata",
  businessHours: createEmptyBusinessHours(),
});

const normalizeBusinessHours = (businessHours) => {
  const normalized = createEmptyBusinessHours();
  if (!businessHours || typeof businessHours !== "object") return normalized;

  businessDays.forEach(([day]) => {
    const value = businessHours[day];
    if (!value || typeof value !== "object") return;
    normalized[day] = {
      open: typeof value.open === "string" ? value.open : "",
      close: typeof value.close === "string" ? value.close : "",
      closed:
        typeof value.closed === "boolean"
          ? value.closed
          : !value.open || !value.close,
    };
  });

  return normalized;
};

export default function OwnerDashboard() {
  const currentDateLabel = useCurrentDateLabel();
  const [name, setName] = useState("Owner");
  const [email, setEmail] = useState("");
  const [staff] = useState(demoStaff);
  const [active, setActive] = useState("overview");
  const [shop, setShop] = useState(createInitialShop);
  const [shopId, setShopId] = useState(null);
  const [savedShop, setSavedShop] = useState(null);
  const [editingShop, setEditingShop] = useState(false);
  const [shopLoading, setShopLoading] = useState(true);
  const [savingShop, setSavingShop] = useState(false);
  const [draft, setDraft] = useState(demoShifts);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [timezoneQuery, setTimezoneQuery] = useState("");
  const [timezoneOptionsOpen, setTimezoneOptionsOpen] = useState(false);
  const [timezoneHighlight, setTimezoneHighlight] = useState(0);
  const [password, setPassword] = useState("");
  const [staffMembers, setStaffMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [workforceLoading, setWorkforceLoading] = useState(false);
  const [workforceAction, setWorkforceAction] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [timeOffAction, setTimeOffAction] = useState("");
  const [timeOffHistoryClearing, setTimeOffHistoryClearing] = useState(false);
  const noticeTimeoutRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const routeSection =
    {
      "/owner-dashboard": "overview",
      "/owner-dashboard/shop-setup": "shopSetup",
      "/owner-dashboard/staff-management": "staffManagement",
      "/owner-dashboard/time-off": "timeOff",
      "/owner-dashboard/ai-shift-planner": "aiShiftPlanner",
      "/owner-dashboard/schedule": "schedule",
      "/owner-dashboard/reports": "reports",
      "/owner-dashboard/settings": "settings",
    }[location.pathname] || "overview";
  const filteredTimeZones = useMemo(() => {
    const query = timezoneQuery.trim().toLowerCase();
    if (!query) return timeZoneOptions;
    return timeZoneOptions.filter(({ identifier, aliases }) =>
      [identifier, ...aliases].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [timezoneQuery]);

  const clearNotice = () => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
      noticeTimeoutRef.current = null;
    }
    setNotice("");
    setNoticeIsError(false);
  };

  const showNotice = (message, isError = false) => {
    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
    setNotice(message);
    setNoticeIsError(isError);
    noticeTimeoutRef.current = window.setTimeout(() => {
      setNotice("");
      setNoticeIsError(false);
      noticeTimeoutRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    let isMounted = true;
    let loadSequence = 0;

    const resetUserState = () => {
      if (!isMounted) return;
      setEmail("");
      setName("Owner");
      setShop(createInitialShop());
      setShopId(null);
      setSavedShop(null);
      setEditingShop(false);
      setShopLoading(false);
    };

    const loadUser = async (session) => {
      const requestSequence = ++loadSequence;
      if (!session?.user) {
        resetUserState();
        return;
      }

      const user = session.user;
      setShopLoading(true);
      setEmail(user.email || "");

      const [{ data: profile, error: profileError }, { data: ownedShop, error: shopError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("shops")
            .select("id, name, address, timezone, business_hours")
            .eq("owner_id", user.id)
            .maybeSingle(),
        ]);

      if (!isMounted || requestSequence !== loadSequence) return;
      if (profileError) {
        showNotice(`Could not load your profile: ${profileError.message}`, true);
      } else if (profile?.full_name) {
        setName(profile.full_name);
      }
      if (shopError) {
        setShop(createInitialShop());
        setShopId(null);
        showNotice(`Could not load your shop: ${shopError.message}`, true);
      } else if (ownedShop) {
        setShopId(ownedShop.id);
        const loadedShop = {
          name: ownedShop.name || "",
          address: ownedShop.address || "",
          timezone: timeZones.includes(ownedShop.timezone)
            ? ownedShop.timezone
            : ownedShop.timezone || "Asia/Kolkata",
          businessHours: normalizeBusinessHours(ownedShop.business_hours),
        };
        setSavedShop(loadedShop);
        setShop(loadedShop);
        setTimezoneQuery(loadedShop.timezone);
        setEditingShop(false);
      } else {
        setShop(createInitialShop());
        setShopId(null);
        setSavedShop(null);
        setTimezoneQuery("");
        setEditingShop(true);
      }
      setShopLoading(false);
    };

    const loadCurrentSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (isMounted) {
          setShopLoading(false);
          showNotice(`Could not read your session: ${error.message}`, true);
        }
        return;
      }
      await loadUser(data.session);
    };

    loadCurrentSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    setActive(routeSection);
  }, [routeSection]);
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showNotice(`Could not log out: ${error.message}`, true);
      return;
    }
    setShop(createInitialShop());
    setShopId(null);
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
    showNotice(error ? error.message : "Profile updated in Supabase.", Boolean(error));
  };
  const updatePassword = async (event) => {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    showNotice(error ? error.message : "Password updated.", Boolean(error));
    setPassword("");
  };
  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      setDraft(demoShifts);
      setGenerating(false);
      showNotice("Demo draft generated. Nothing has been saved.");
    }, 550);
  };
  const changeActiveSection = (section) => {
    clearNotice();
    setActive(section);
    navigate(
      `/owner-dashboard${
        section === "overview"
          ? ""
          : `/${section.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
      }`,
    );
  };
  const updateBusinessDay = (day, key, value) => {
    setShop((current) => ({
      ...current,
      businessHours: {
        ...current.businessHours,
        [day]: {
          ...current.businessHours[day],
          [key]: value,
          ...(key === "closed" && value
            ? { open: "", close: "" }
            : {}),
        },
      },
    }));
  };

  const copyMondayToAllDays = () => {
    setShop((current) => {
      const monday = current.businessHours.monday;
      return {
        ...current,
        businessHours: Object.fromEntries(
          businessDays.map(([day]) => [day, { ...monday }]),
        ),
      };
    });
  };

  const selectTimeZone = (identifier) => {
    setShop((current) => ({ ...current, timezone: identifier }));
    setTimezoneQuery(identifier);
    setTimezoneOptionsOpen(false);
    setTimezoneHighlight(0);
  };

  const handleTimezoneKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setTimezoneOptionsOpen(true);
      setTimezoneHighlight((current) =>
        Math.min(current + 1, Math.max(filteredTimeZones.length - 1, 0)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setTimezoneHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && timezoneOptionsOpen) {
      event.preventDefault();
      const option = filteredTimeZones[timezoneHighlight];
      if (option) selectTimeZone(option.identifier);
    } else if (event.key === "Escape") {
      setTimezoneOptionsOpen(false);
    }
  };

  const loadWorkforceData = useCallback(async () => {
    if (!shopId) return;
    setWorkforceLoading(true);
    const [staffResult, requestResult, invitationResult] = await Promise.all([
      supabase.rpc("list_shop_staff", { p_shop_id: shopId }),
      supabase.rpc("list_shop_join_requests", { p_shop_id: shopId }),
      supabase.rpc("list_shop_invitations", { p_shop_id: shopId }),
    ]);
    setWorkforceLoading(false);
    if (staffResult.error) {
      setNotice(`Could not load staff: ${staffResult.error.message}`);
      setNoticeIsError(true);
    } else {
      setStaffMembers(staffResult.data || []);
    }
    if (requestResult.error) {
      setNotice(`Could not load join requests: ${requestResult.error.message}`);
      setNoticeIsError(true);
    } else {
      setJoinRequests(requestResult.data || []);
    }
    if (invitationResult.error) {
      setNotice(`Could not load invitations: ${invitationResult.error.message}`);
      setNoticeIsError(true);
    } else {
      setInvitations(invitationResult.data || []);
    }
    const { data: members, error: membersError } = await supabase
      .from("shop_members")
      .select("id, user_id, job_title, created_at, is_active")
      .eq("shop_id", shopId)
      .eq("is_active", true);
    if (membersError) {
      setTimeOffRequests([]);
      setNotice(`Could not load shop memberships for time-off requests: ${membersError.message}`);
      setNoticeIsError(true);
      return;
    }
    const memberIds = (members || []).map((member) => member.id).filter(Boolean);
    if (!memberIds.length) {
      setTimeOffRequests([]);
      return;
    }
    const { data: requestData, error: timeOffError } = await supabase
      .from("time_off_requests")
      .select("id, shop_member_id, start_date, end_date, reason, status, created_at")
      .in("shop_member_id", memberIds)
      .order("created_at", { ascending: false });
    if (timeOffError) {
      setNotice(`Could not load time-off requests: ${timeOffError.message}`);
      setNoticeIsError(true);
    } else {
      const profilesByUserId = new Map();
      const userIds = (members || []).map((member) => member.user_id).filter(Boolean);
      if (userIds.length) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        if (profilesError) {
          setNotice(`Could not load staff names: ${profilesError.message}`);
          setNoticeIsError(true);
        }
        (profiles || []).forEach((profile) =>
          profilesByUserId.set(profile.id, profile),
        );
      }
      const staffByMemberId = new Map(
        (members || []).map((member) => [
          member.id,
          {
            ...member,
            full_name: profilesByUserId.get(member.user_id)?.full_name,
          },
        ]),
      );
      setTimeOffRequests(
        (requestData || []).map((request) => ({
          ...request,
          staff: staffByMemberId.get(request.shop_member_id),
        })),
      );
    }
  }, [shopId]);
  useEffect(() => {
    if (["staffManagement", "timeOff"].includes(active) && shopId) {
      loadWorkforceData();
    }
  }, [active, shopId, loadWorkforceData]);
  useEffect(() => {
    if (!shopId) return undefined;
    const channel = supabase
      .channel(`owner-workforce-${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shop_join_requests", filter: `shop_id=eq.${shopId}` },
        () => loadWorkforceData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shop_members", filter: `shop_id=eq.${shopId}` },
        () => loadWorkforceData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_off_requests" },
        () => loadWorkforceData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, loadWorkforceData]);

  const reviewJoinRequest = async (requestId, decision) => {
    setWorkforceAction(`${decision}-${requestId}`);
    const { error } = await supabase.rpc("review_shop_join_request", {
      p_request_id: requestId,
      p_decision: decision,
    });
    setWorkforceAction("");
    showNotice(
      error
        ? `Could not ${decision} request: ${error.message}`
        : `Join request ${decision}.`,
      Boolean(error),
    );
    if (!error) loadWorkforceData();
  };

  const generateInvitation = async () => {
    if (!shopId) return;
    setWorkforceAction("generate-invitation");
    const plaintextCode = createInvitationCode();
    const codeHash = await hashInvitationCode(plaintextCode);
    const normalizedCode = normalizeInvitationCode(plaintextCode);
    const { data, error } = await supabase.rpc("create_shop_invitation", {
      p_shop_id: shopId,
      p_code_hash: codeHash,
      p_code_hint: normalizedCode.slice(-4),
      p_expires_in_days: 7,
      p_max_uses: 20,
    });
    setWorkforceAction("");
    if (error) {
      showNotice(`Could not create invitation: ${error.message}`, true);
      return;
    }
    const invitation = Array.isArray(data) ? data[0] : data;
    if (!invitation) {
      showNotice("The invitation was created without metadata.", true);
      return;
    }
    setInvitationCode(plaintextCode);
    setInvitations((current) => [invitation, ...current]);
    showNotice("Invitation code generated. Copy it before leaving this screen.");
  };

  const copyInvitation = async () => {
    if (!invitationCode) return;
    try {
      await navigator.clipboard.writeText(invitationCode);
      showNotice("Invitation code copied.");
    } catch (error) {
      showNotice(`Could not copy invitation link: ${error.message}`, true);
    }
  };

  const revokeInvitation = async (invitationId) => {
    setWorkforceAction(`revoke-${invitationId}`);
    const { error } = await supabase.rpc("revoke_shop_invitation", {
      p_invitation_id: invitationId,
    });
    setWorkforceAction("");
    showNotice(
      error
        ? `Could not revoke invitation: ${error.message}`
        : "Invitation revoked.",
      Boolean(error),
    );
    if (!error) loadWorkforceData();
  };
  const deleteInvitation = async (invitationId) => {
    if (!shopId || !window.confirm("Permanently delete this revoked invitation?")) {
      return;
    }
    setWorkforceAction(`delete-invitation-${invitationId}`);
    const { error } = await supabase.rpc("delete_shop_invitation", {
      p_invitation_id: invitationId,
      p_shop_id: shopId,
    });
    setWorkforceAction("");
    if (error) {
      showNotice(`Could not delete invitation: ${error.message}`, true);
      return;
    }
    setInvitations((current) =>
      current.filter((invitation) => (invitation.invitation_id || invitation.id) !== invitationId),
    );
    showNotice("Revoked invitation permanently deleted.");
  };
  const clearJoinRequestHistory = async () => {
    if (!shopId || !window.confirm("Clear all approved and rejected join requests for this shop?")) {
      return;
    }
    setWorkforceAction("clear-request-history");
    const { error } = await supabase.rpc("clear_shop_join_request_history", {
      p_shop_id: shopId,
    });
    setWorkforceAction("");
    if (error) {
      showNotice(`Could not clear request history: ${error.message}`, true);
      return;
    }
    setJoinRequests((current) =>
      current.filter((request) => String(request.request_status || request.status).toLowerCase() === "pending"),
    );
    showNotice("Completed join-request history cleared.");
  };
  const removeStaff = async (staffUserId) => {
    if (!shopId || !window.confirm("Remove this staff member from your shop?")) {
      return;
    }
    setWorkforceAction(`remove-${staffUserId}`);
    const { error } = await supabase.rpc("remove_shop_staff", {
      p_shop_id: shopId,
      p_staff_user_id: staffUserId,
    });
    setWorkforceAction("");
    if (error) {
      showNotice(`Could not remove staff member: ${error.message}`, true);
      return;
    }
    setStaffMembers((current) =>
      current.filter((member) => (member.user_id || member.staff_id) !== staffUserId),
    );
    showNotice("Staff member removed.");
    loadWorkforceData();
  };
  const reviewTimeOffRequest = async (requestId, decision) => {
    setTimeOffAction(`${decision}-${requestId}`);
    const { error } = await supabase.rpc("review_time_off_request", {
      p_request_id: requestId,
      p_decision: decision,
    });
    setTimeOffAction("");
    if (error) {
      showNotice(`Could not ${decision} time-off request: ${error.message}`, true);
      return;
    }
    setTimeOffRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? { ...request, status: decision }
          : request,
      ),
    );
    showNotice(`Time-off request ${decision}.`);
    loadWorkforceData();
  };
  const clearTimeOffHistory = async () => {
    if (
      !shopId ||
      !window.confirm(
        "Permanently delete approved and rejected time-off requests for this shop? Pending and cancelled requests will remain.",
      )
    ) {
      return;
    }
    setTimeOffHistoryClearing(true);
    const { data, error } = await supabase.rpc(
      "clear_shop_completed_time_off_history",
      { p_shop_id: shopId },
    );
    setTimeOffHistoryClearing(false);
    if (error) {
      showNotice(`Could not clear time-off history: ${error.message}`, true);
      return;
    }
    const deletedCount = Number(Array.isArray(data) ? data[0] : data) || 0;
    await loadWorkforceData();
    showNotice(`${deletedCount} completed time-off request${deletedCount === 1 ? "" : "s"} deleted.`);
  };

  const cancelShopEdit = () => {
    if (savedShop) {
      setShop({
        ...savedShop,
        businessHours: normalizeBusinessHours(savedShop.businessHours),
      });
      setEditingShop(false);
      return;
    }
    setShop(createInitialShop());
  };

  const saveShop = async (event) => {
    event.preventDefault();
    const trimmedName = shop.name.trim();
    const trimmedAddress = shop.address.trim();
    if (!timeZones.includes(shop.timezone)) {
      showNotice("Choose a valid IANA time zone from the suggestions.", true);
      return;
    }
    if (!trimmedName || !trimmedAddress) {
      showNotice("Enter both a shop name and address.", true);
      return;
    }
    const hasOpenDay = businessDays.some(
      ([day]) => !shop.businessHours[day].closed,
    );
    if (!hasOpenDay) {
      showNotice("Open at least one day before saving your shop.", true);
      return;
    }
    for (const [day, label] of businessDays) {
      const hours = shop.businessHours[day];
      if (hours.closed) continue;
      if (!hours.open || !hours.close) {
        showNotice(`Enter opening and closing times for ${label}.`, true);
        return;
      }
      if (hours.open >= hours.close) {
        showNotice(`Closing time must be after opening time on ${label}.`, true);
        return;
      }
    }

    setSavingShop(true);
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      setSavingShop(false);
      showNotice(
        sessionError?.message || "Your session has expired. Please sign in again.",
        true,
      );
      return;
    }

    let savedRecord;
    let saveError;
    if (shopId) {
      const { data, error } = await supabase
        .from("shops")
        .update({
          name: trimmedName,
          address: trimmedAddress,
          timezone: shop.timezone,
          business_hours: shop.businessHours,
        })
        .eq("id", shopId)
        .eq("owner_id", sessionData.session.user.id)
        .select("id, name, address, timezone, business_hours")
        .maybeSingle();
      savedRecord = data;
      saveError = error;
      if (!saveError && !savedRecord) {
        saveError = new Error("The shop could not be updated or is no longer owned by this account.");
      }
    } else {
      const { error } = await supabase.rpc("create_shop_for_current_user", {
        p_name: trimmedName,
        p_business_hours: shop.businessHours,
        p_address: trimmedAddress,
      });
      saveError = error;
    }
    if (saveError) {
      setSavingShop(false);
      showNotice(`Could not save your shop: ${saveError.message}`, true);
      return;
    }

    let reloadError;
    if (!savedRecord) {
      const result = await supabase
        .from("shops")
        .select("id, name, address, timezone, business_hours")
        .eq("owner_id", sessionData.session.user.id)
        .maybeSingle();
      savedRecord = result.data;
      reloadError = result.error;
    }
    if (!reloadError && savedRecord && !shopId && savedRecord.timezone !== shop.timezone) {
      const { data: updatedRecord, error: timezoneError } = await supabase
        .from("shops")
        .update({ timezone: shop.timezone })
        .eq("id", savedRecord.id)
        .eq("owner_id", sessionData.session.user.id)
        .select("id, name, address, timezone, business_hours")
        .maybeSingle();
      if (timezoneError || !updatedRecord) {
        setSavingShop(false);
        showNotice(
          timezoneError
            ? `Shop was created, but its time zone could not be saved: ${timezoneError.message}`
            : "Shop was created, but its time zone could not be saved.",
          true,
        );
        return;
      }
      savedRecord = updatedRecord;
    }
    setSavingShop(false);
    if (reloadError || !savedRecord) {
      showNotice(
        reloadError
          ? `Shop was created, but could not be reloaded: ${reloadError.message}`
          : "Shop was created, but could not be reloaded.",
        true,
      );
      return;
    }
    const refreshedShop = {
      name: savedRecord.name || trimmedName,
      address: savedRecord.address || trimmedAddress,
      timezone: savedRecord.timezone || shop.timezone,
      businessHours: normalizeBusinessHours(savedRecord.business_hours),
    };
    setShopId(savedRecord.id);
    setSavedShop(refreshedShop);
    setShop(refreshedShop);
    setEditingShop(false);
    showNotice(shopId ? "Shop details updated in Supabase." : "Shop details saved to Supabase.");
  };
  return (
    <DashboardLayout
      role="owner"
      name={name}
      email={email}
      activeSection={active}
      setActiveSection={changeActiveSection}
      onLogout={logout}
    >
      <div className="page-intro">
        <div>
          <span className="eyebrow">{currentDateLabel}</span>
          <h2>
            {active === "overview"
              ? `Good morning, ${name.split(" ")[0]}.`
              : active === "shopSetup"
                ? "Set up your shop"
                : active === "staffManagement"
                  ? "Your team"
                  : active === "timeOff"
                    ? "Time-off requests"
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
              : active === "shopSetup"
                ? "Keep your shop details and opening hours ready for scheduling."
              : "Ready to manage your team, generate shifts, and review reports? Use the sections below to get started."}
          </p>
        </div>
        {notice && (
          <div className={`inline-notice ${noticeIsError ? "inline-notice-error" : ""}`} role="status">
            {noticeIsError ? <FiX /> : <FiCheck />}
            {notice}
            <button onClick={clearNotice}>
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
                onClick={() => changeActiveSection("schedule")}
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
                <button onClick={() => changeActiveSection("aiShiftPlanner")}>
                  <FiRefreshCw />
                  <span>
                    <b>Generate a draft</b>
                    <small>Let AI balance next week</small>
                  </span>
                  <FiArrowUpRight />
                </button>
                <button onClick={() => changeActiveSection("staffManagement")}>
                  <FiPlus />
                  <span>
                    <b>Add a team member</b>
                    <small>Invite someone to your workspace</small>
                  </span>
                  <FiArrowUpRight />
                </button>
                <button onClick={() => changeActiveSection("shopSetup")}>
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
        <div className="shop-setup-stack">
          {shopLoading ? (
            <section className="panel form-panel">
              <p className="form-status" role="status">Loading shop details…</p>
            </section>
          ) : (
            <>
              {savedShop && !editingShop && (
                <section className="shop-summary-card">
                  <div className="shop-summary-icon" aria-hidden="true">
                    <FiShoppingBag />
                  </div>
                  <div className="shop-summary-copy">
                    <span className="eyebrow">Saved shop</span>
                    <h3>{savedShop.name || "Unnamed shop"}</h3>
                    <p><FiMapPin /> {savedShop.address || "No address provided"}</p>
                    <p><FiClock /> {savedShop.timezone || "Asia/Kolkata"}</p>
                  </div>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => setEditingShop(true)}
                  >
                    Edit details
                  </button>
                </section>
              )}
              {!savedShop && !editingShop && (
                <section className="shop-empty-state">
                  <FiShoppingBag />
                  <h3>Set up your shop</h3>
                  <p>Add your shop details and opening hours to get started.</p>
                  <button className="button button-primary" type="button" onClick={() => setEditingShop(true)}>
                    Add shop details
                  </button>
                </section>
              )}
              {editingShop && (
                <section className="panel form-panel">
                  <PanelTitle title={shopId ? "Edit shop details" : "Business details"} />
                  <p className="muted">
                    {shopId
                      ? "Update the saved details for your shop."
                      : "Set your shop hours so future schedules can use the right opening window."}
                  </p>
                  <form className="form-grid" onSubmit={saveShop}>
                    <label className="field">
                      Shop name
                      <input
                        required
                        value={shop.name}
                        onChange={(e) => setShop((current) => ({ ...current, name: e.target.value }))}
                        disabled={savingShop}
                      />
                    </label>
                    <label className="field">
                      Address
                      <input
                        required
                        value={shop.address}
                        onChange={(e) => setShop((current) => ({ ...current, address: e.target.value }))}
                        disabled={savingShop}
                      />
                    </label>
                    <label className="field full">
                      <span>Time zone</span>
                      <div className="timezone-picker">
                        <input
                          value={timezoneQuery || shop.timezone}
                          onChange={(e) => {
                            setTimezoneQuery(e.target.value);
                            setTimezoneOptionsOpen(true);
                          }}
                          onFocus={(event) => {
                            setTimezoneQuery(shop.timezone);
                            setTimezoneOptionsOpen(true);
                            event.currentTarget.select();
                          }}
                          onKeyDown={handleTimezoneKeyDown}
                          onBlur={() => window.setTimeout(() => setTimezoneOptionsOpen(false), 0)}
                          aria-autocomplete="list"
                          aria-controls="shop-time-zones"
                          aria-expanded={timezoneOptionsOpen}
                          role="combobox"
                          required
                          disabled={savingShop}
                        />
                        {timezoneOptionsOpen && (
                          <div className="timezone-options" id="shop-time-zones" role="listbox">
                            {filteredTimeZones.length ? (
                              filteredTimeZones.map(({ identifier }, index) => (
                                <button
                                  key={identifier}
                                  type="button"
                                  role="option"
                                  aria-selected={identifier === shop.timezone}
                                  className={index === timezoneHighlight ? "is-highlighted" : ""}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => selectTimeZone(identifier)}
                                >
                                  {identifier}
                                </button>
                              ))
                            ) : (
                              <span className="timezone-no-results">No matching time zones</span>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                    <div className="business-hours-heading full">
                      <div>
                        <h4>Business hours</h4>
                        <p className="muted">Choose which days your shop is open.</p>
                      </div>
                      <button className="text-button" type="button" onClick={copyMondayToAllDays} disabled={savingShop}>
                        Copy Monday to all days
                      </button>
                    </div>
                    <div className="business-hours full">
                      {businessDays.map(([day, label]) => {
                        const hours = shop.businessHours[day];
                        return (
                          <div className="business-day" key={day}>
                            <label className="business-day-name">
                              <input
                                type="checkbox"
                                checked={!hours.closed}
                                onChange={(e) => updateBusinessDay(day, "closed", !e.target.checked)}
                                disabled={savingShop}
                              />
                              {label}
                            </label>
                            <input
                              aria-label={`${label} opening time`}
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateBusinessDay(day, "open", e.target.value)}
                              disabled={hours.closed || savingShop}
                            />
                            <span aria-hidden="true">to</span>
                            <input
                              aria-label={`${label} closing time`}
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateBusinessDay(day, "close", e.target.value)}
                              disabled={hours.closed || savingShop}
                            />
                            <span className="business-day-status">
                              {hours.closed ? "Closed" : "Open"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="form-actions">
                      <button className="button button-primary" disabled={savingShop}>
                        {savingShop ? "Saving…" : shopId ? "Save changes" : "Save details"}
                      </button>
                      {shopId && (
                        <button type="button" className="button button-ghost" onClick={cancelShopEdit} disabled={savingShop}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </section>
              )}
            </>
          )}
        </div>
      )}
      {active === "staffManagement" && (
        <div className="workforce-grid">
          {!shopId ? (
            <section className="panel empty-state-panel">
              <FiShoppingBag />
              <h3>Create your shop first</h3>
              <p>Staff requests and invitations will appear here after shop setup.</p>
            </section>
          ) : workforceLoading ? (
            <section className="panel"><p className="form-status" role="status">Loading staff management…</p></section>
          ) : (
            <>
              <section className="panel workforce-section">
                <PanelTitle title="My staff" action={`${staffMembers.length} approved`} />
                {staffMembers.length ? staffMembers.map((member) => (
                  <div className="onboarding-row" key={member.user_id || member.id}>
                    <div><strong>{member.full_name || member.staff_name || member.name}</strong><small>{member.job_title || "Team member"} · Joined {new Date(member.joined_at || member.created_at).toLocaleDateString()}</small></div>
                    <div className="inline-actions">
                      <span className="badge badge-success">Approved</span>
                      <button
                        className="button button-ghost"
                        onClick={() => removeStaff(member.user_id || member.staff_id)}
                        disabled={Boolean(workforceAction)}
                      >
                        {workforceAction === `remove-${member.user_id || member.staff_id}` ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                )) : <p className="empty-state">No approved staff members yet.</p>}
              </section>
              <section className="panel workforce-section">
                <PanelTitle title="Join requests" action={joinRequests.filter((request) => String(request.request_status || request.status).toLowerCase() === "pending").length ? `${joinRequests.filter((request) => String(request.request_status || request.status).toLowerCase() === "pending").length} pending` : "No pending requests"} />
                {joinRequests.some((request) => ["approved", "rejected"].includes(String(request.request_status || request.status).toLowerCase())) && (
                  <button className="button button-ghost" onClick={clearJoinRequestHistory} disabled={Boolean(workforceAction)}>
                    <FiTrash2 /> {workforceAction === "clear-request-history" ? "Clearing…" : "Clear history"}
                  </button>
                )}
                {joinRequests.length ? joinRequests.map((request) => {
                  const status = String(request.request_status || request.status).toLowerCase();
                  return (
                    <div className="onboarding-row" key={request.request_id || request.id}>
                      <div><strong>{request.applicant_name || request.full_name || "Applicant"}</strong><small>Requested {new Date(request.requested_at || request.created_at).toLocaleDateString()}</small></div>
                      {status === "pending" ? (
                        <div className="inline-actions">
                          <button className="button button-primary" onClick={() => reviewJoinRequest(request.request_id, "approved")} disabled={Boolean(workforceAction)}><FiUserCheck /> Approve</button>
                          <button className="button button-ghost" onClick={() => reviewJoinRequest(request.request_id, "rejected")} disabled={Boolean(workforceAction)}><FiUserX /> Reject</button>
                        </div>
                      ) : <span className={`request-status request-${status}`}>{request.request_status || request.status}</span>}
                    </div>
                  );
                }) : <p className="empty-state">No join requests yet.</p>}
              </section>
              <section className="panel workforce-section">
                <PanelTitle title="Invite staff" />
                <p className="muted">Generate a code that creates a pending request. New staff still require your approval.</p>
                <button className="button button-primary" onClick={generateInvitation} disabled={Boolean(workforceAction)}>
                  <FiPlus /> {workforceAction === "generate-invitation" ? "Generating…" : "Generate invitation code"}
                </button>
                {invitationCode && (
                  <div className="invitation-link">
                    <input value={invitationCode} readOnly aria-label="Generated invitation code" />
                    <button className="button button-secondary" onClick={copyInvitation}><FiCopy /> Copy code</button>
                  </div>
                )}
                {invitationCode && <p className="form-status">Copy this code before leaving the screen. It cannot be retrieved later.</p>}
                <div className="invitation-list">
                  {invitations.length ? invitations.map((invitation) => {
                    const invitationId = invitation.invitation_id || invitation.id;
                    const revoked = invitation.is_revoked || invitation.revoked_at;
                    return (
                      <div className="onboarding-row" key={invitationId}>
                        <div><strong>{revoked ? "Revoked invitation" : invitation.expires_at && new Date(invitation.expires_at) < new Date() ? "Expired invitation" : "Active invitation"}</strong><small>Created {new Date(invitation.created_at).toLocaleDateString()} · Expires {new Date(invitation.expires_at).toLocaleDateString()} · {invitation.uses_count || 0}/{invitation.max_uses || 0} uses · Hint KS-****-{invitation.code_hint || "????"}</small></div>
                        <div className="inline-actions">
                          {!revoked && <button className="button button-ghost" onClick={() => revokeInvitation(invitationId)} disabled={Boolean(workforceAction)}>{workforceAction === `revoke-${invitationId}` ? "Revoking…" : "Revoke"}</button>}
                          {revoked && <button className="button button-ghost" onClick={() => deleteInvitation(invitationId)} disabled={Boolean(workforceAction)}><FiTrash2 /> {workforceAction === `delete-invitation-${invitationId}` ? "Deleting…" : "Delete"}</button>}
                        </div>
                      </div>
                    );
                  }) : <p className="empty-state">No invitations generated yet.</p>}
                </div>
              </section>
            </>
          )}
        </div>
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
      {active === "timeOff" && (
        <section className="panel workforce-section">
          <PanelTitle
            title="Time-off requests"
            action={
              <div className="inline-actions">
                <span>{timeOffRequests.length ? `${timeOffRequests.length} requests` : "No requests"}</span>
                {timeOffRequests.some((request) =>
                  ["approved", "rejected"].includes(String(request.status).toLowerCase()),
                ) && (
                  <button
                    className="button button-ghost"
                    onClick={clearTimeOffHistory}
                    disabled={timeOffHistoryClearing}
                  >
                    {timeOffHistoryClearing ? "Clearing…" : "Clear completed history"}
                  </button>
                )}
              </div>
            }
          />
          {workforceLoading ? (
            <p className="form-status">Loading time-off requests…</p>
          ) : timeOffRequests.length ? (
            timeOffRequests.map((request) => {
              const status = String(request.status || "pending").toLowerCase();
              return (
                <div className="onboarding-row" key={request.id}>
                  <div>
                    <strong>{request.staff?.full_name || request.staff?.staff_name || "Staff member"}</strong>
                    <small>
                      {shop.name || "Shop"} · {request.start_date} – {request.end_date} · Submitted {new Date(request.created_at).toLocaleDateString()}
                    </small>
                    <small>{request.reason || "No reason provided"}</small>
                  </div>
                  {status === "pending" ? (
                    <div className="inline-actions">
                      <button className="button button-primary" onClick={() => reviewTimeOffRequest(request.id, "approved")} disabled={Boolean(timeOffAction)}>
                        {timeOffAction === `approved-${request.id}` ? "Approving…" : "Approve"}
                      </button>
                      <button className="button button-ghost" onClick={() => reviewTimeOffRequest(request.id, "rejected")} disabled={Boolean(timeOffAction)}>
                        {timeOffAction === `rejected-${request.id}` ? "Rejecting…" : "Reject"}
                      </button>
                    </div>
                  ) : (
                    <span className={`request-status request-${status}`}>{status}</span>
                  )}
                </div>
              );
            })
          ) : (
            <p className="empty-state">No time-off requests for this shop.</p>
          )}
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
