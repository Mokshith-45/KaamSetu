import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";

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
      <Route path="*" element={<h1>404 | Page Not Found</h1>} />
    </Routes>
  );
}

export default App;
