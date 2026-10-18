import { useEffect, useState } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./App.css";

const ownerRoutes = [
  ["", "overview"],
  ["/shop-setup", "shopSetup"],
  ["/staff-management", "staffManagement"],
  ["/time-off", "timeOff"],
  ["/ai-shift-planner", "aiShiftPlanner"],
  ["/schedule", "schedule"],
  ["/reports", "reports"],
  ["/settings", "settings"],
];
const staffRoutes = [
  ["", "overview"],
  ["/shop-discovery", "shopDiscovery"],
  ["/my-shifts", "myShifts"],
  ["/availability", "availability"],
  ["/time-off", "timeOff"],
  ["/notifications", "notifications"],
  ["/settings", "settings"],
];

function LoadingScreen() {
  return (
    <div className="not-found" role="status">
      <p>Restoring your session…</p>
    </div>
  );
}

function AuthError({ message }) {
  return (
    <div className="not-found" role="alert">
      <h1>We couldn’t load your account.</h1>
      <p>{message}</p>
      <Link className="button button-primary" to="/">
        Return to sign in
      </Link>
    </div>
  );
}

function ProtectedRoute({ role, children }) {
  const location = useLocation();
  const [state, setState] = useState({
    loading: true,
    allowed: false,
    error: "",
  });

  useEffect(() => {
    let mounted = true;
    let request = 0;

    const checkAccess = async (session) => {
      const currentRequest = ++request;
      if (!session?.user) {
        if (mounted) {
          setState({ loading: false, allowed: false, error: "" });
        }
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!mounted || currentRequest !== request) return;
      if (error || !profile) {
        setState({
          loading: false,
          allowed: false,
          error: error?.message || "Your account profile could not be found.",
        });
        return;
      }
      setState({
        loading: false,
        allowed: profile.user_type === role,
        error: "",
      });
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (mounted) {
          setState({ loading: false, allowed: false, error: error.message });
        }
        return;
      }
      checkAccess(data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAccess(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [role]);

  if (state.loading) return <LoadingScreen />;
  if (state.error) return <AuthError message={state.error} />;
  if (!state.allowed) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/" element={<AuthPage />} />

      {/* Dashboards */}
      {ownerRoutes.map(([suffix]) => (
        <Route
          key={`owner${suffix}`}
          path={`/owner-dashboard${suffix}`}
          element={
            <ProtectedRoute role="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
      ))}
      {staffRoutes.map(([suffix]) => (
        <Route
          key={`staff${suffix}`}
          path={`/staff-dashboard${suffix}`}
          element={
            <ProtectedRoute role="staff">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
      ))}

      {/* Info Pages */}
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Catch-all 404 */}
      <Route
        path="*"
        element={
          <div className="not-found">
            <span className="eyebrow">404</span>
            <h1>That page took a wrong turn.</h1>
            <p>We couldn’t find what you were looking for.</p>
            <Link className="button button-primary" to="/">
              Back to home
            </Link>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
