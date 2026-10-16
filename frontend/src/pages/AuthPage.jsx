import React, { useState, useEffect } from "react";
import "./AuthPage.css";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import kaamVideo from "../assets/kaam.mp4";

const texts = [
  "Welcome to KaamSetu",
  "AI-Powered Smart Scheduling for Staff",
];

const AuthPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState("owner");
  const [staffRole, setStaffRole] = useState("Cashier");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Typewriter effect
  useEffect(() => {
    const currentText = texts[textIndex];
    if (charIndex < currentText.length) {
      const timeout = setTimeout(() => {
        setTypedText((prev) => prev + currentText[charIndex]);
        setCharIndex(charIndex + 1);
      }, 80);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setCharIndex(0);
        setTypedText("");
        setTextIndex((prev) => (prev + 1) % texts.length);
      }, 1800);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, textIndex]);

  // Generate bubbles dynamically
  useEffect(() => {
    const bubbleArray = [];
    for (let i = 0; i < 30; i++) {
      bubbleArray.push({
        id: i,
        size: Math.random() * 15 + 10,
        left: Math.random() * 100,
        duration: Math.random() * 30 + 20,
        delay: Math.random() * 5,
      });
    }
    setBubbles(bubbleArray);

    // Simulate loading preloader
    const loaderTimeout = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(loaderTimeout);
  }, []);

  const handleSignUp = async () => {
    setMessage("Creating your account...");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Failed to create user.");

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          { id: data.user.id, full_name: fullName, user_type: userType },
        ]);
      if (profileError) throw new Error("Failed to save profile");

      if (userType === "staff") {
        const { error: roleError } = await supabase
          .from("staff_roles")
          .insert([{ staff_id: data.user.id, role: staffRole }]);
        if (roleError) throw new Error("Failed to save staff role");
      }

      setMessage("Account created! Please login.");
      setIsSignUp(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setStaffRole("Cashier");
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
    }
  };

  const handleLogin = async () => {
    setMessage("Logging in...");
    try {
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (loginError) throw new Error("Invalid email or password");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, user_type")
        .eq("id", loginData.user.id)
        .maybeSingle();
      if (profileError || !profileData) throw new Error("Profile not found!");

      localStorage.setItem("userFullName", profileData.full_name);

      if (profileData.user_type === "owner") navigate("/owner-dashboard");
      else navigate("/staff-dashboard");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <>
      {loading && (
        <div className="preloader">
          {/* motion.dev placeholder */}
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
        </div>
      )}
      <div className="authpage-wrapper">
        {/* Dynamic Bubbles */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="bubble"
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.left}%`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          ></div>
        ))}

        <section className="hero-section">
          <div className="hero-left">
            <h1 className="glow-text">KaamSetu</h1>
            <p className="typed-text">{typedText}</p>
            <p className="hero-info">
              Effortlessly manage staff schedules, communicate in real-time, and
              track analytics. Designed for owners and staff to streamline work.
            </p>
            <button
              className="get-started-btn"
              onClick={() => setShowModal(true)}
            >
              Get Started
            </button>
          </div>
          <div className="hero-right">
            <video
              src={kaamVideo}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: "100%", maxWidth: "400px", borderRadius: "15px" }}
            />
          </div>
        </section>

        {/* Feature Cards */}
        <section className="feature-cards-section">
          <div className="feature-card glow-card">
            <iframe src="https://lottie.host/embed/9676637b-a07d-4ec2-8725-2add98e10c43/XwlXmKlbUF.lottie"></iframe>
            <h3>Smart Scheduling</h3>
            <p>Auto-generate schedules based on availability.</p>
          </div>
          <div className="feature-card glow-card">
            <iframe src="https://lottie.host/embed/2363c2be-6c17-45dc-8c6f-cf4f03c35381/eIyUuM7E1y.lottie"></iframe>
            <h3>Real-time Updates</h3>
            <p>Instant notifications on shift changes.</p>
          </div>
          <div className="feature-card glow-card">
            <iframe src="https://lottie.host/embed/d8960129-9e7c-454e-980e-d7c2ae3e4f6b/428m8fzbQ0.lottie"></iframe>
            <h3>Staff Analytics</h3>
            <p>Track performance and attendance trends.</p>
          </div>
          <div className="feature-card glow-card">
            <iframe src="https://lottie.host/embed/05ccfa62-967b-4086-8992-023384b54bfc/WkQaVMwQUN.lottie"></iframe>
            <h3>Easy Communication</h3>
            <p>Send messages directly to your team.</p>
          </div>
        </section>

        {/* Login Modal */}
        {showModal && (
          <div className="login-modal-wrapper">
            <div className="login-modal floating-blur">
              <button
                className="close-modal-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>

              <h2 className="modal-typed-text">{typedText}</h2>

              {isSignUp && (
                <>
                  <div className="input-group">
                    <span className="input-icon">
                      <i className="fas fa-user"></i>
                    </span>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="custom-select"
                  >
                    <option value="owner">Shop Owner</option>
                    <option value="staff">Staff</option>
                  </select>

                  {userType === "staff" && (
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="custom-select"
                    >
                      <option value="Cashier">Cashier</option>
                      <option value="Stock">Stock</option>
                      <option value="Deliverer">Deliverer</option>
                      <option value="Other">Other</option>
                    </select>
                  )}
                </>
              )}

              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-envelope"></i>
                </span>
<input
  type="email"
  name="email"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  autoComplete="email"
/>
              </div>

              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>

              <button
                className="auth-btn"
                onClick={isSignUp ? handleSignUp : handleLogin}
              >
                {isSignUp ? "Sign Up" : "Login"}
              </button>

              <p className="switch-auth">
                {isSignUp ? "Already have an account?" : "New user?"}{" "}
                <span onClick={() => setIsSignUp(!isSignUp)}>
                  {isSignUp ? "Login" : "Sign Up"}
                </span>
              </p>

              {message && <p className="message">{message}</p>}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AuthPage;
