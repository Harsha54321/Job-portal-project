import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import manSitting from '../assets/Illustration_1.png';
import eye from '../assets/show_password.png';
import eyeHide from '../assets/eye-hide.png';
import Email from '../assets/icon_email_id.png';
import Google from '../assets/GOOG.png';
import mobile from '../assets/icon_mobile_otp.png';
import './Jlogin.css';
import api from '../api/axios';
import { useJobs } from '../JobContext';
import { requestAndRegisterNotificationPermission, registerFCMAfterLogin, isFCMReady } from "../firebaseTokenHandler";

export const Jlogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchAllJobs } = useJobs();

  const redirectTo = location.state?.redirectTo || "/Job-portal/jobseeker/";

  const [view, setView] = useState('default');
  const [passwordShow, setPasswordShow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [fcmRegistered, setFcmRegistered] = useState(false);

  const initialValues = {
    username: "",
    password: "",
    phone: "",
    email: ""
  };

  const [formValues, setFormValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const[underDevEffect, setUnderDevEffect] = useState(false);

  const togglePasswordView = () => {
    setPasswordShow((prev) => !prev);
  };

  // Function to handle FCM registration after login
  const handleFCMRegistration = async () => {
    console.log("Checking FCM registration after login...");

    try {
      // Check if FCM is ready (authenticated and permission granted)
      if (isFCMReady()) {
        console.log("FCM is ready. Registering token...");
        const result = await registerFCMAfterLogin();
        console.log("📊 FCM Registration Result:", result);
        setFcmRegistered(result.success);
        return result;
      } else {
        // If not ready, check if we need to request permission
        const permission = Notification.permission;
        console.log(` FCM not ready. Permission: ${permission}, Authenticated: ${!!sessionStorage.getItem("access")}`);

        if (permission === 'default') {
          console.log(" Notification permission not yet requested. Will request when user interacts.");
          // Optionally, you could request permission here but better to wait for user interaction
        }
        return null;
      }
    } catch (error) {
      console.error("❌ FCM registration failed:", error);
      return null;
    }
  };

  useEffect(() => {
    console.log(" Jlogin component mounted - checking for saved credentials...");

    const savedUsername = localStorage.getItem("rememberedUsername");
    const savedPassword = localStorage.getItem("rememberedPassword");

    if (savedUsername && savedPassword) {
      console.log("🔑 Saved credentials found");
      setFormValues((prev) => ({
        ...prev,
        username: savedUsername,
        password: savedPassword
      }));
      setRememberMe(true);
    } else if (savedUsername) {
      console.log("🔑 Saved username found");
      setFormValues((prev) => ({
        ...prev,
        username: savedUsername
      }));
      setRememberMe(true);
    }

    // Check for redirect from sessionStorage (from footer before login)
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    const redirectTab = sessionStorage.getItem("redirectTab");

    console.log("🔍 Redirect check:", { redirectPath, redirectTab });

    if (redirectPath && redirectTab) {
      // Store in location state for after login
      window.history.replaceState(
        {
          ...location.state,
          intendedPath: redirectPath,
          targetTab: redirectTab
        },
        ''
      );
    }

    //  REMOVED: requestAndRegisterNotificationPermission() - This was causing the error
    // We'll now call it only after successful login

    // Check FCM status but don't register yet
    console.log(" FCM Status:", {
      permission: Notification.permission,
      authenticated: !!sessionStorage.getItem("access")
    });

  }, []); // Empty dependency array - runs only once on mount

  const handleForm = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 10) {
        setFormValues({ ...formValues, [name]: onlyNums });
        setErrors({ ...errors, [name]: "" });
      }
      return;
    }

    setFormValues({ ...formValues, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const underDevEffectHandler = () => {
    setUnderDevEffect(true);
    setInterval(() => {
      setUnderDevEffect(false);
    }, 5000);
  }

  const validateForm = () => {
    const newErrors = {};

    if (!formValues.username.trim()) {
      newErrors.username = "Username or Email is required";
    }

    if (!formValues.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendEmailOTP = async () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formValues.username.trim()) {
      newErrors.username = "Email ID is required";
    } else if (!emailRegex.test(formValues.username)) {
      newErrors.username = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      console.log('Sending OTP to email:', formValues.username);

      const response = await api.post('send-login-otp/', {
        email: formValues.username,
        purpose: 'login',
        user_type: 'jobseeker'
      });

       console.log('OTP Response:', response.data);

      // Block right here if the backend tells us this isn't a jobseeker account
      // (requires the backend to include "user_type" in the send-login-otp/ response)
      if (response.data.user_type && response.data.user_type !== 'jobseeker') {
        setErrors({ username: "This login is only for Jobseeker accounts. Please use the Employer login." });
        setLoading(false);
        return;
      }

      console.log('OTP Response:', response.data);
      setOtpData(response.data);
      setOtpSent(true);
      alert(`OTP sent to ${formValues.username}. Please check your email.`);

      navigate('/Job-portal/login/otpverification', {
        state: {
          email: formValues.username,
          purpose: 'login',
          otpId: response.data.otp_id,
          otpToken: response.data.token,
          redirectTo,
          fromSearch: location.state?.fromSearch || false,
          searchQuery: location.state?.searchQuery || "",
          searchLocation: location.state?.searchLocation || "",
          searchExperience: location.state?.searchExperience || "",
          intendedPath: location.state?.intendedPath || sessionStorage.getItem("redirectAfterLogin"),
          targetTab: location.state?.targetTab || sessionStorage.getItem("redirectTab")
        }
      });
    } catch (error) {
      console.error('❌ Error sending OTP:', error);

      if (error.response) {
        if (error.response.status === 400) {
          const errorData = error.response.data;

          if (errorData.email) {
            setErrors({
              username: Array.isArray(errorData.email)
                ? errorData.email[0]
                : errorData.email
            });
          } else if (errorData.detail) {
            setErrors({ username: errorData.detail });
          } else if (errorData.error) {
            setErrors({ username: errorData.error });
          } else {
            setErrors({ username: "Invalid email address" });
          }
        } else if (error.response.status === 404) {
          setErrors({ username: "Email not registered. Please sign up first." });
        } else if (error.response.status === 429) {
          setErrors({ username: "Too many attempts. Please try again later." });
        } else {
          setErrors({
            username: error.response.data?.error || "Failed to send OTP"
          });
        }
      } else {
        setErrors({ username: "Network error. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMobileOTP = () => {
    const newErrors = {};
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!formValues.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (!mobileRegex.test(formValues.phone)) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      alert(`Mock OTP sent to ${formValues.phone}. For demo, use OTP: 123456`);
      navigate('/Job-portal/login/otpverification', {
        state: {
          phone: formValues.phone,
          purpose: 'login_mobile',
          isMock: true,
          redirectTo,
          fromSearch: location.state?.fromSearch || false,
          searchQuery: location.state?.searchQuery || "",
          searchLocation: location.state?.searchLocation || "",
          searchExperience: location.state?.searchExperience || "",
          intendedPath: location.state?.intendedPath || sessionStorage.getItem("redirectAfterLogin"),
          targetTab: location.state?.targetTab || sessionStorage.getItem("redirectTab")
        }
      });

      setLoading(false);
    }, 1000);
  };

  const handleGetOtp = () => {
    if (view === 'email-otp') {
      handleSendEmailOTP();
    } else if (view === 'mobile-otp') {
      handleSendMobileOTP();
    }
  };

  const getRedirectAfterLogin = () => {
    // First priority: Check for intendedPath from footer click
    if (location.state?.intendedPath) {
      return {
        type: "redirect",
        path: location.state.intendedPath,
        targetTab: location.state.targetTab || "saved"
      };
    }

    // Second priority: Check sessionStorage (from footer before login)
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    const redirectTab = sessionStorage.getItem("redirectTab");

    if (redirectPath) {
      // Clear sessionStorage after reading
      sessionStorage.removeItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectTab");

      return {
        type: "redirect",
        path: redirectPath,
        targetTab: redirectTab || "saved"
      };
    }

    // Third priority: Check from search
    if (location.state?.fromSearch) {
      return {
        type: "search",
        data: {
          query: location.state?.searchQuery || "",
          location: location.state?.searchLocation || "",
          experience: location.state?.searchExperience || ""
        }
      };
    }

    // Default redirect
    return {
      type: "redirect",
      path: redirectTo,
      targetTab: "Profile"
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation before API call
    const isEmail = formValues.username.includes('@');

    // Frontend validations
    if (!formValues.username.trim()) {
      setErrors({ username: "Username or Email is required" });
      setLoading(false);
      return;
    }

    if (isEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formValues.username)) {
        setErrors({ username: "Please enter a valid email address" });
        setLoading(false);
        return;
      }
    }

    if (!formValues.password.trim()) {
      setErrors({ password: "Password is required" });
      setLoading(false);
      return;
    }

    if (formValues.password.trim().length < 6) {
      setErrors({ password: "Password must be at least 6 characters" });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 Attempting login...");
      const loginData = isEmail
        ? { email: formValues.username, password: formValues.password }
        : { username: formValues.username, password: formValues.password };

      const response = await api.post('login/', loginData);

      // Check if user type is jobseeker
      if (response.data.user.user_type !== 'jobseeker') {
        setErrors({
          username: "Invalid credentials. This login is only for Jobseeker users."
        });
        setLoading(false);
        return;
      }

      if (response.data.access && response.data.refresh) {
        console.log("✅ Login successful. Storing tokens...");
        sessionStorage.setItem('access', response.data.access);
        sessionStorage.setItem('refresh', response.data.refresh);
        sessionStorage.setItem('user_type', 'jobseeker');

        if (response.data.user) {
          sessionStorage.setItem('user_data', JSON.stringify(response.data.user));
          sessionStorage.setItem('user_id', response.data.user.id);
        }

        sessionStorage.setItem("userRole", "jobseeker");

        if (rememberMe) {
          localStorage.setItem("rememberedUsername", formValues.username);
          localStorage.setItem("rememberedPassword", formValues.password);
        } else {
          localStorage.removeItem("rememberedUsername");
          localStorage.removeItem("rememberedPassword");
        }

        //  REGISTER FCM TOKEN AFTER SUCCESSFUL LOGIN
        console.log(" Registering FCM token after login...");
        try {
          const fcmResult = await handleFCMRegistration();
          console.log(" FCM registration completed:", fcmResult);
        } catch (fcmError) {
          // Non-critical error - don't block login flow
          console.warn("⚠️ FCM registration failed but login successful:", fcmError);
        }

        await fetchAllJobs();

        const nextStep = getRedirectAfterLogin();

        if (nextStep.type === "search") {
          sessionStorage.removeItem('pendingSearch');
          sessionStorage.removeItem('savedSearch');
          sessionStorage.removeItem("redirectAfterLogin");
          sessionStorage.removeItem("redirectTab");

          navigate('/Job-portal/jobseeker/searchresults', {
            replace: true,
            state: {
              query: nextStep.data.query,
              location: nextStep.data.location,
              experience: nextStep.data.experience
            }
          });
        } else {
          sessionStorage.removeItem("redirectAfterLogin");
          sessionStorage.removeItem("redirectTab");

          navigate(nextStep.path, {
            replace: true,
            state: {
              activeTab: nextStep.targetTab
            }
          });
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Login Error:', error);

      const newErrors = {};
      const errorData = error.response?.data;

      // Handle incorrect password - primary priority
      if (errorData?.detail) {
        const detail = errorData.detail;
        const detailStr = Array.isArray(detail) ? detail[0] : detail;

        if (detailStr && detailStr.toLowerCase().includes("password") && detailStr.toLowerCase().includes("incorrect")) {
          newErrors.password = "Incorrect password. Please try again.";
        }
        else if (detailStr && (detailStr.toLowerCase().includes("no account") || detailStr.toLowerCase().includes("not found"))) {
          newErrors.username = "No account found with this email address.";
        }
        else if (detailStr && detailStr.toLowerCase().includes("employer")) {
          newErrors.username = "Invalid credentials. This login is only for Jobseeker users.";
        }
        else {
          newErrors.general = detailStr;
        }
      }
      // Handle non_field_errors
      else if (errorData?.non_field_errors) {
        const errorMsg = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
        if (errorMsg && errorMsg.toLowerCase().includes("password")) {
          newErrors.password = "Incorrect password. Please try again.";
        } else if (errorMsg && (errorMsg.toLowerCase().includes("account") || errorMsg.toLowerCase().includes("found"))) {
          newErrors.username = "No account found with this email address.";
        } else {
          newErrors.general = errorMsg;
        }
      }
      // Handle field-specific errors
      else if (errorData?.email) {
        const emailError = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        if (emailError && emailError.toLowerCase().includes("no account")) {
          newErrors.username = "No account found with this email address.";
        } else {
          newErrors.username = emailError;
        }
      }
      else if (errorData?.username) {
        const usernameError = Array.isArray(errorData.username) ? errorData.username[0] : errorData.username;
        if (usernameError && usernameError.toLowerCase().includes("no account")) {
          newErrors.username = "No account found with this email address.";
        } else {
          newErrors.username = usernameError;
        }
      }
      else if (errorData?.password) {
        const passwordError = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
        newErrors.password = passwordError;
      }
      // Handle HTTP status codes
      else if (error.response?.status === 401) {
        newErrors.password = "Incorrect password. Please try again.";
      }
      else if (error.response?.status === 404) {
        newErrors.username = "No account found with this email address.";
      }
      else {
        newErrors.general = "Invalid email or password";
      }

      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="logo">
          <span className="logo-text">Job portal</span>
          <span className="subtext">For Jobseekers</span>
        </Link>

        <div className="login-header-actions">
          <span className="no-account">Don't have an account?</span>

          <Link
            to="/Job-portal/jobseeker/signup"
            state={{
              redirectTo,
              fromSearch: location.state?.fromSearch || false,
              searchQuery: location.state?.searchQuery || "",
              searchLocation: location.state?.searchLocation || "",
              searchExperience: location.state?.searchExperience || ""
            }}
            className="signup-btn"
          >
            Sign up
          </Link>

          <Link to="/Job-portal/role-selection" className="login-header-back-btn">
            ← Back
          </Link>
        </div>
      </header>

      <div className="login-body">
        <div className="login-illustration">
          <img src={manSitting} alt="Login Illustration" />
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {view !== 'default' && (
            <button
              type="button"
              className="back-to-login"
              onClick={() => {
                setView('default');
                setErrors({});
                setOtpSent(false);
                setFormValues((prev) => ({
                  ...prev,
                  username: '',
                  phone: ''
                }));
              }}
            >
              ← Back
            </button>
          )}

          <h2>Login to continue</h2>

          {errors.general && (
            <span className="error-msg" style={{ color: 'red', marginBottom: '10px', display: 'block' }}>
              {errors.general}
            </span>
          )}

          {/* VIEW 1: DEFAULT USERNAME & PASSWORD */}
          {view === 'default' && (
            <>
              <label>Username / Email</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username or email"
                value={formValues.username}
                onChange={handleForm}
                className={errors.username ? "input-error" : ""}
                disabled={loading}
                autoComplete="username"
              />
              {errors.username && <span className="error-msg">{errors.username}</span>}

              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={passwordShow ? "password" : "text"}
                  placeholder="Enter your password"
                  name="password"
                  value={formValues.password}
                  onChange={handleForm}
                  className={errors.password ? "input-error" : ""}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                    type="button"
                    className="eye-icon"
                    onClick={togglePasswordView}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        togglePasswordView();
                      }
                    }}
                    aria-label={passwordShow ? "Show password" : "Hide password"}
                    disabled={loading}
                  >
                    <img
                      src={passwordShow ? eyeHide : eye}
                      className="show-icon"
                      alt=""
                    />
                  </button>
              </div>
              {errors.password && <span className="error-msg">{errors.password}</span>}

              <div className="form-options">
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // stop form submit
                        setRememberMe(prev => !prev);
                      }
                    }}
                    disabled={loading}
                  />
                  Remember me
                </label>

                <Link
                  to="/Job-portal/jobseeker/login/forgotpassword"
                  className="forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" className="j-login-btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="divider">Or Continue with</div>

              <button
                type="button"
                className="google-btn-outline"
                onClick={() => setView('email-otp')}
                disabled={loading}
              >
                <img src={Email} alt="Email" /> Email ID
              </button>

              <div className="divider"> Or </div>

              <button
                type="button"
                className="mobile-btn-outline mobile-login-btn"
                onClick={underDevEffectHandler}
              >
                <img src={mobile} alt="mobile" />{underDevEffect ? "Under Development" : "Mobile number"}
              </button>
            </>
          )}

          {view === 'email-otp' && (
            <>
              <label>Email ID</label>
              <input
                type="email"
                name="username"
                placeholder="johnsmith@gmail.com"
                value={formValues.username}
                onChange={handleForm}
                className={errors.username ? "input-error" : ""}
                disabled={loading}
                autoComplete="email"
              />
              {errors.username && <span className="error-msg">{errors.username}</span>}

              <button
                type="button"
                className="j-login-btn"
                onClick={handleGetOtp}
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Get OTP'}
              </button>

              <div className="divider">Or Continue with</div>

              <button
                type="button"
                className="mobile-btn-outline"
                onClick={() => setView('mobile-otp')}
                disabled={loading}
              >
                <img src={mobile} alt="mobile" /> Phone number
              </button>
            </>
          )}

          {view === 'mobile-otp' && (
            <>
              <label>Mobile number</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter your Mobile number"
                value={formValues.phone}
                onChange={handleForm}
                inputMode="numeric"
                maxLength="10"
                className={errors.phone ? "input-error" : ""}
                disabled={loading}
                autoComplete="tel"
              />
              {errors.phone && <span className="error-msg">{errors.phone}</span>}

              <button
                type="button"
                className="j-login-btn"
                onClick={handleGetOtp}
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Get OTP'}
              </button>

              <div className="divider">Or Continue with</div>

              <button
                type="button"
                className="google-btn-outline"
                onClick={() => setView('email-otp')}
                disabled={loading}
              >
                <img src={Email} alt="Email" /> Email ID
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};