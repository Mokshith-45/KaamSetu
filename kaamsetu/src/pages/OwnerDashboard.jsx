import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { FiBell, FiUser } from "react-icons/fi";
import "./OwnerDashboard.css";

const OwnerDashboard = () => {
  const [ownerName, setOwnerName] = useState("Owner");
  const [userEmail, setUserEmail] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editedName, setEditedName] = useState("");
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setLogs(data);
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchOwnerAndStaff = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          setOwnerName(profile.full_name);
          setEditedName(profile.full_name);
        }

        const { data: staffData } = await supabase
          .from("profiles")
          .select("id, full_name, user_type, staff_roles(role)")
          .eq("user_type", "staff");
        if (staffData) {
          const formattedStaff = staffData.map(s => ({
            id: s.id,
            name: s.full_name,
            role: s.staff_roles?.[0]?.role || "N/A",
            contact: "N/A",
            status: "Active"
          }));
          setStaffList(formattedStaff);
        }

        setShifts([
          { day: "Monday", staff: "Alice", role: "Cashier", time: "9AM-2PM" },
          { day: "Monday", staff: "Bob", role: "Stock", time: "10AM-4PM" },
        ]);
      }
    };
    fetchOwnerAndStaff();
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
  };

  const handleNameChange = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editedName })
      .eq("id", user.id);

    if (error) alert(error.message);
    else setOwnerName(editedName);
  };

  const sidebarItems = [
    { id: "overview", label: "Overview" },
    { id: "shopSetup", label: "Shop Setup" },
    { id: "staffManagement", label: "Staff Management" },
    { id: "aiShiftPlanner", label: "AI Shift Planner" },
    { id: "reports", label: "Reports / Payroll" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="dashboard-wrapper d-flex">
      {/* Sidebar */}
      <aside className="dashboard-sidebar bg-light p-3">
        <div className="sidebar-logo mb-4 text-primary fw-bold fs-4">Workforce Planner</div>
        <nav className="sidebar-nav d-flex flex-column gap-2">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`btn ${activeSection === item.id ? "btn-primary" : "btn-outline-primary"} text-start`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="dashboard-main flex-grow-1">
        {/* Topbar */}
        <header className="dashboard-topbar d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
          <div className="topbar-left">
            <h2 className="m-0">{sidebarItems.find(i => i.id === activeSection)?.label}</h2>
          </div>
          <div className="topbar-right d-flex align-items-center gap-3 position-relative">
            <FiBell className="icon fs-4 text-secondary" />
            <div className={`profile-dropdown dropdown ${dropdownOpen ? "show" : ""}`} onClick={toggleDropdown}>
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <FiUser /> {ownerName}
              </button>
              <div className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}>
                <button className="dropdown-item" onClick={() => setActiveSection("settings")}>Profile</button>
                <button className="dropdown-item" onClick={() => setActiveSection("settings")}>Settings</button>
                <button className="dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Sections */}
        <main className="dashboard-content p-3">
          {activeSection === "overview" && (
            <div className="row g-3">
              <div className="col-md-3">
                <div className="card p-3 shadow-sm">
                  <h5>Total Staff</h5>
                  <span className="fs-4 fw-bold">{staffList.length}</span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card p-3 shadow-sm">
                  <h5>Scheduled Shifts Today</h5>
                  <span className="fs-4 fw-bold">{shifts.length}</span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card p-3 shadow-sm">
                  <h5>Pending Requests</h5>
                  <span className="fs-4 fw-bold">2</span>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card p-3 shadow-sm">
                  <h5>AI Suggestion</h5>
                  <span className="fs-4 fw-bold">+1 Staff Needed</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === "shopSetup" && (
            <section className="shop-setup card-section p-3 shadow-sm bg-white">
              <h4>Shop Setup</h4>
              <form className="d-flex flex-column gap-2 mt-3">
                <input className="form-control" type="text" placeholder="Shop Name" />
                <input className="form-control" type="text" placeholder="Business Hours" />
                <input className="form-control" type="text" placeholder="Roles (Comma separated)" />
                <button className="btn btn-primary mt-2" type="submit">Save Shop Info</button>
              </form>
            </section>
          )}

          {activeSection === "staffManagement" && (
            <section className="staff-management card-section p-3 shadow-sm bg-white">
              <h4>Staff Management</h4>
              <button className="btn btn-success mb-2">+ Add Staff</button>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((staff, idx) => (
                      <tr key={idx}>
                        <td>{staff.name}</td>
                        <td>{staff.role}</td>
                        <td>{staff.contact}</td>
                        <td>{staff.status}</td>
                        <td>
                          <button className="btn btn-outline-primary btn-sm me-1">Edit</button>
                          <button className="btn btn-outline-danger btn-sm">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === "aiShiftPlanner" && (
            <section className="ai-shift card-section p-3 shadow-sm bg-white">
              <h4>AI Shift Planner</h4>
              <button className="btn btn-warning mb-3">Generate Draft Schedule</button>
              <div className="row g-2">
                {shifts.map((shift, idx) => (
                  <div key={idx} className="col-md-4">
                    <div className="card p-2">
                      <strong>{shift.day}</strong>: {shift.staff} ({shift.role}) <br /> {shift.time}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "reports" && (
            <section className="reports card-section p-3 shadow-sm bg-white">
              <h4>Reports / Payroll Summary</h4>
              <p>Attendance logs loaded: {logs.length}</p>
              <p>Staff hours and wages will be displayed here.</p>
            </section>
          )}

          {activeSection === "settings" && (
            <section className="settings card-section p-3 shadow-sm bg-white">
              <h4>Profile Settings</h4>
              <form onSubmit={handleNameChange} className="d-flex flex-column gap-2">
                <label>Edit Name:</label>
                <input className="form-control" type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                <button className="btn btn-primary" type="submit">Update Name</button>
              </form>
              <p className="mt-3"><strong>Email:</strong> {userEmail}</p>
              <form onSubmit={handlePasswordChange} className="d-flex flex-column gap-2 mt-2">
                <label>Change Password:</label>
                <input className="form-control" type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <button className="btn btn-primary" type="submit">Update Password</button>
              </form>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="dashboard-footer bg-light p-3 mt-3 border-top d-flex justify-content-between">
          <div>© 2025 Workforce Planner | <Link to="/about">About Us</Link> | <Link to="/contact">Contact</Link></div>
          <div>Logged in as: <strong>{ownerName}</strong></div>
        </footer>
      </div>
    </div>
  );
};

export default OwnerDashboard;
