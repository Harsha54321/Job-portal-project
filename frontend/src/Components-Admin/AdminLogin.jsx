import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import manSitting from '../assets/Illustration_1.png';
import eye from '../assets/show_password.png';
import eyeHide from '../assets/eye-hide.png';
import './AdminLogin.css'
import api from '../api/axios';

export const AdminLogin = () => {
    const navigate = useNavigate();
    const [passwordShow, setPasswordShow] = useState(true);
    const [formValues, setFormValues] = useState({ adminID: "", password: "" });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const togglePasswordView = () => {
        setPasswordShow((prev) => !prev);
    };

    const handleForm = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
        setErrors({ ...errors, [name]: "" });
        setServerError("");
    };

    useEffect(() => {
        const savedRemember = sessionStorage.getItem("admin_remember_me") === "true";
        if (savedRemember) {
            const savedAdminID = sessionStorage.getItem("admin_saved_id") || "";
            const savedPassword = sessionStorage.getItem("admin_saved_password") || "";
            setFormValues({ adminID: savedAdminID, password: savedPassword });
            setRememberMe(true);
        }
    }, []);

    const handleRememberMe = (e) => {
        const checked = e.target.checked;
        setRememberMe(checked);
        if (!checked) {
            sessionStorage.removeItem("admin_remember_me");
            sessionStorage.removeItem("admin_saved_id");
            sessionStorage.removeItem("admin_saved_password");
        }
    };

    // Email validation regex
    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    // Password validation - at least 6 characters
    const validatePassword = (password) => {
        return password && password.trim().length >= 6;
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Admin ID/Email validation
        if (!formValues.adminID.trim()) {
            newErrors.adminID = "Admin ID or Email is required";
        } else if (!validateEmail(formValues.adminID)) {
            newErrors.adminID = "Please enter a valid email address";
        }
        
        // Password validation
        if (!formValues.password.trim()) {
            newErrors.password = "Password is required";
        } else if (!validatePassword(formValues.password)) {
            newErrors.password = "Password must be at least 6 characters";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setServerError("");
        setErrors({});

        try {
            const response = await api.post('admin-login/', {
                email: formValues.adminID,
                password: formValues.password
            });

            if (response.data.access) {
                sessionStorage.setItem("access", response.data.access);
                sessionStorage.setItem("refresh", response.data.refresh);
                sessionStorage.setItem("user_type", response.data.user?.user_type || "admin");
                sessionStorage.setItem("admin_id", response.data.user?.id || formValues.adminID);
                sessionStorage.setItem('token', response.data.access);
                sessionStorage.setItem('access_token', response.data.access);

                if (rememberMe) {
                    sessionStorage.setItem("admin_remember_me", "true");
                    sessionStorage.setItem("admin_saved_id", formValues.adminID);
                    sessionStorage.setItem("admin_saved_password", formValues.password);
                } else {
                    sessionStorage.removeItem("admin_remember_me");
                    sessionStorage.removeItem("admin_saved_id");
                    sessionStorage.removeItem("admin_saved_password");
                }
                navigate("/Job-portal/admin/dashboard");
            } else {
                setServerError(response.data.message || "Login failed");
            }
        } catch (error) {
            console.error("Admin login error:", error);
            
            if (!error.response) {
                setServerError("Network error. Please check your connection.");
            } else {
                const status = error.response.status;
                const errorData = error.response?.data;
                
                // Check if it's a non-admin user trying to login
                if (errorData?.errors?.email && errorData.errors.email.includes("does not have admin access")) {
                    setErrors({
                        adminID: "Invalid credentials. This login is only for Admin users."
                    });
                }
                // Check for "No account found" error
                else if (errorData?.errors?.email && errorData.errors.email.includes("No account found")) {
                    setErrors({
                        adminID: "No account found with this email address."
                    });
                }
                // Check for incorrect password
                else if (errorData?.errors?.password && errorData.errors.password.includes("Incorrect password")) {
                    setErrors({
                        password: "Incorrect password. Please try again."
                    });
                }
                // Check for account disabled
                else if (errorData?.errors?.email && errorData.errors.email.includes("disabled")) {
                    setErrors({
                        adminID: "This account is disabled. Please contact support."
                    });
                }
                // Handle other error formats
                else {
                    const message = errorData?.detail ||
                        errorData?.message ||
                        errorData?.non_field_errors?.[0] ||
                        errorData?.username?.[0] ||
                        errorData?.password?.[0] ||
                        errorData?.email?.[0] ||
                        null;
                    
                    if (message) {
                        // Try to determine which field the error belongs to
                        if (message.toLowerCase().includes('password')) {
                            setErrors({ password: message });
                        } else if (message.toLowerCase().includes('email') || message.toLowerCase().includes('account') || message.toLowerCase().includes('found')) {
                            setErrors({ adminID: message });
                        } else {
                            setErrors({ adminID: message });
                        }
                    } else if (status === 400) {
                        setErrors({ adminID: "Invalid input. Please check your credentials." });
                    } else if (status === 401) {
                        setErrors({ password: "Invalid Admin ID or Password." });
                    } else if (status === 403) {
                        setErrors({ adminID: "Access denied. You are not authorized." });
                    } else if (status === 404) {
                        setServerError("Login service not found. Contact support.");
                    } else if (status === 500) {
                        setServerError("Server error. Please try again later.");
                    } else {
                        setErrors({ adminID: message || "Something went wrong. Please try again." });
                    }
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <header className="login-header">
                <Link to="/" className="logo">
                    <span className="logo-text">Job portal</span>
                    <span className='subtext'> For Administrator</span>
                </Link>
                <div className="login-header-actions">
                    <Link to="/Job-portal/role-selection" className="login-header-back-btn">
                        ← Back
                    </Link>
                </div>
            </header>

            <div className="Admin-Login-Module">
                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="admin-login-title-row">
                        <h2>Login as Administrator</h2>
                    </div>

                    <p style={{ color: '#666', textAlign: "center", fontSize: '14px' }}>Login to manage users and postings</p>
                    
                    {serverError && (
                        <div className="server-error" style={{
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            padding: '10px',
                            borderRadius: '4px',
                            marginBottom: '15px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {serverError}
                        </div>
                    )}
                    
                    <label>Admin ID / Email</label>
                    <input
                        type="text"
                        name="adminID"
                        placeholder="Enter Admin ID or Email"
                        value={formValues.adminID}
                        onChange={handleForm}
                        className={errors.adminID ? "input-error" : ""}
                    />
                    {errors.adminID && <span className="error-msg">{errors.adminID}</span>}

                    <label>Password</label>
                    <div className="password-wrapper">
                        <input
                            type={passwordShow ? "password" : "text"}
                            placeholder="Enter your password"
                            name='password'
                            value={formValues.password}
                            onChange={handleForm}
                            className={errors.password ? "input-error" : ""}
                        />
                        <span className="eye-icon" onClick={togglePasswordView}>
                            <img src={passwordShow ? eyeHide : eye} className='show-icon' alt='toggle' />
                        </span>
                    </div>
                    {errors.password && <span className="error-msg">{errors.password}</span>}

                    <div className="form-options">
                        <label className="remember-me-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={handleRememberMe}
                            />
                            <span>Remember me</span>
                            
                        </label>
                        <Link to="/Job-portal/admin/login/forgotpassword" className="forgot-password">
                            Forgot Password?
                        </Link>
                    </div>

                    <button type="submit" className="j-login-btn" disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Admin Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};