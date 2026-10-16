import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import { Link } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/" element={<AuthPage />} />

      {/* Dashboards */}
      <Route path="/owner-dashboard" element={<OwnerDashboard />} />
      <Route path="/staff-dashboard" element={<StaffDashboard />} />

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
