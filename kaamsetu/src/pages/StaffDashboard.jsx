import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FiBell, FiUser } from "react-icons/fi";
import "./StaffDashboard.css";
import { Link } from "react-router-dom";


const StaffDashboard = () => {
  const [staffName, setStaffName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [shifts, setShifts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [newPassword, setNewPassword] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);

  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const name = localStorage.getItem("userFullName");
    setStaffName(name || "Staff");

    const fetchShifts = async () => {
      setShifts([
        { day: "Monday", role: "Cashier", time: "9AM-2PM" },
        { day: "Tuesday", role: "Helper", time: "12PM-5PM" },
      ]);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);
    };
    fetchShifts();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert(error.message);
    else alert("Password updated successfully!");
    setNewPassword("");
  };

  const handleNameChange = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: staffName })
        .eq("id", user.id);
      if (error) throw error;
      localStorage.setItem("userFullName", staffName);
      alert("Name updated successfully!");
    } catch (err) {
      alert("Error updating name: " + err.message);
    }
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const sidebarItems = [
    { id: "overview", label: "Overview" },
    { id: "myShifts", label: "My Shifts" },
    { id: "notifications", label: "Notifications" },
    { id: "availability", label: "Availability" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="staff-dashboard-wrapper">
      {/* Sidebar */}
      <aside className="staff-dashboard-sidebar">
        <div className="staff-sidebar-logo">Workforce Planner</div>
        <nav className="staff-sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-btn ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h2>{sidebarItems.find(i => i.id === activeSection)?.label}</h2>
          </div>
          <div className="topbar-right">
            <FiBell className="icon" />
            <div className={`profile-dropdown ${dropdownOpen ? "show" : ""}`} onClick={toggleDropdown}>
              <FiUser className="icon" />
              <span>{staffName}</span>
              <div className="dropdown-content">
                <button onClick={() => setActiveSection("settings")}>Profile</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Sections */}
        <main className="dashboard-content">
          {activeSection === "overview" && (
            <div className="overview-cards">
              <div className="card total-shifts">
                <h3>Upcoming Shifts</h3>
                <span>{shifts.length}</span>
              </div>
            </div>
          )}

          {activeSection === "myShifts" && (
            <section className="card-section">
              <h3>My Shifts</h3>
              {shifts.map((shift, idx) => (
                <div key={idx} className="shift-card">
                  <strong>{shift.day}</strong>: {shift.role} ({shift.time})
                </div>
              ))}
            </section>
          )}

          {activeSection === "notifications" && (
            <section className="card-section">
              <h3>Notifications</h3>
              <p>No new notifications</p>
            </section>
          )}

          {activeSection === "availability" && (
            <section className="card-section">
              <h3>Availability</h3>
              <div className="availability-days">
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => (
                  <button
                    key={day}
                    className={`day-btn ${selectedDays.includes(day) ? "selected" : ""}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <button className="save-availability-btn" onClick={() => alert(`Saved: ${selectedDays.join(", ")}`)}>
                Save Availability
              </button>
            </section>
          )}

          {activeSection === "settings" && (
            <section className="card-section">
              <h3>Profile Settings</h3>
              <form onSubmit={handleNameChange}>
                <label>Name:</label>
                <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
                <button type="submit">Update Name</button>
              </form>
              <p><strong>Email:</strong> {userEmail}</p>

              <form onSubmit={handlePasswordChange}>
                <label>Change Password:</label>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="submit">Update Password</button>
              </form>
            </section>
          )}
        </main>

        {/* Footer */}
  <footer className="dashboard-footer">
  <div className="footer-left">
    © 2025 Workforce Planner | <Link to="/about">About Us</Link> | <Link to="/contact">Contact</Link>
  </div>
</footer>

      </div>
    </div>
  );
};

export default StaffDashboard;
