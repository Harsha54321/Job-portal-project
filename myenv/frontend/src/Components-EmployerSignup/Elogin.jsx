
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import manSitting from "../assets/Illustration_1.png";
import eye from "../assets/show_password.png";
import eyeHide from "../assets/eye-hide.png";
import "./Elogin.css";

export const Elogin = () => {
  const navigate = useNavigate();
  const savedEmail = localStorage.getItem("rememberedEmail");
  const savedPassword = localStorage.getItem("rememberedPassword");
  const [rememberMe, setRememberMe] = useState(false);

  const [passwordShow, setPasswordShow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // const [formValues, setFormValues] = useState({
  //   username: localStorage.getItem("rememberedEmail") || "",
  //   password: "",
  // });

  const [formValues, setFormValues] = useState({
    username: savedEmail || "",
    password: savedPassword || "",
  });

  useEffect(() => {
    if (localStorage.getItem("rememberedEmail")) {
      setRememberMe(true);
    }
  }, []);

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };


  const togglePasswordView = () => {
    setPasswordShow((prev) => !prev);
  };

  const handleForm = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formValues.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formValues.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await api.post("/login/", {
        email: formValues.username,
        password: formValues.password,
      });

      console.log(" Login response:", res.data); // Debug: see what data comes back


      if (rememberMe) {
        localStorage.setItem("rememberedEmail", formValues.username);
        localStorage.setItem("rememberedPassword", formValues.password); // Saves password
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }
      //  Save ALL necessary data to localStorage
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("userRole", "Employer");

      //  IMPORTANT: Save user_id (this was missing!)
      // Check where user_id is in the response
      if (res.data.user_id) {
        localStorage.setItem("user_id", res.data.user_id);
      } else if (res.data.user && res.data.user.id) {
        localStorage.setItem("user_id", res.data.user.id);
      } else if (res.data.id) {
        localStorage.setItem("user_id", res.data.id);
      }

      // Save user type
      localStorage.setItem("user_type", res.data.user.user_type);

      // Optional: Save profile_id if available
      if (res.data.profile_id) {
        localStorage.setItem("profile_id", res.data.profile_id);
      }

      console.log("Saved to localStorage:", {
        user_id: localStorage.getItem("user_id"),
        user_type: localStorage.getItem("user_type"),
        access: localStorage.getItem("access") ? "present" : "missing"
      });

      // ✅ Redirect after login
      navigate("/Job-portal/employer/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrors({
        general: "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/Job-portal" className="logo">
          <span className="logo-text">Job portal</span>
          <span className="subtext">For Employers</span>
        </Link>
        <div className="header-links">
          <span className="no-account">Don’t have an account?</span>
          <Link to="/Job-portal/employer/signup" className="signup-btn">
            Create
          </Link>
          <div className="separator"></div>
          <Link
            to="/Job-portal/jobseeker/login"
            className="employer-redirect-link"
          >
            Job seekers Login
          </Link>
        </div>
      </header>

      <div className="login-body">
        <div className="login-illustration">
          <img src={manSitting} alt="Login Illustration" />
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>Login to continue</h2>

          {errors.general && (
            <span className="error-msg">{errors.general}</span>
          )}

          <label>Email ID</label>
          <input
            type="email"
            name="username"
            placeholder="Enter your email address"
            value={formValues.username}
            onChange={handleForm}
            className={errors.username ? "input-error" : ""}
          />
          {errors.username && (
            <span className="error-msg">{errors.username}</span>
          )}

          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={passwordShow ? "password" : "text"}
              name="password"
              placeholder="Enter your password"
              value={formValues.password}
              onChange={handleForm}
              className={errors.password ? "input-error" : ""}
            />
            <span className="eye-icon" onClick={togglePasswordView}>
              <img
                src={passwordShow ? eyeHide : eye}
                className="show-icon"
                alt="toggle"
              />
            </span>
          </div>
          {errors.password && (
            <span className="error-msg">{errors.password}</span>
          )}

          <div className="form-options">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              Remember me
            </label>
            <Link
              to="/Job-portal/employer/login/forgotpassword"
              className="forgot-password"
            >
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="j-login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};



