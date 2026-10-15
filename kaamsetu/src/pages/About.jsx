import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-hero">
        <h1>About Workforce Planner</h1>
        <p>Smart, AI-powered scheduling for small shops & part-time staff.</p>
      </div>

      <div className="about-content">
        <div className="about-text">
          <h2>Our Mission</h2>
          <p>
            Workforce Planner helps small businesses manage their part-time staff efficiently using AI-driven shift scheduling. 
            Say goodbye to manual spreadsheets and hello to smart automation!
          </p>
          <h2>Why Choose Us?</h2>
          <ul>
            <li>Optimized AI-generated schedules</li>
            <li>Staff portal for easy access to shifts</li>
            <li>Owner dashboard to manage employees</li>
            <li>Responsive & modern web interface</li>
          </ul>
        </div>

        <div className="about-video">
          <div className="video-placeholder">
            <p>Video / Image Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
