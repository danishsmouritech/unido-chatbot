import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/adminService";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(formData) {
    setError("");
    setLoading(true);

    try {
      const res = await loginAdmin(formData);
      localStorage.setItem("adminToken", res.token);
      navigate("/admin");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-shell">
      <div className="admin-login-layout">
        <section className="admin-login-left">
          <div className="admin-login-overlay" />
          <div className="admin-login-left-content">
            <span className="admin-login-badge">
              <i className="bi bi-shield-lock-fill me-1" />
              UNIDO Secure Access
            </span>
            <h1>Admin Control Center</h1>
            <p>
              Monitor chatbot operations, manage system prompts, and export reports from one secure workspace.
            </p>
            <div className="login-features">
              <div className="login-feature-item">
                <i className="bi bi-bar-chart-line" />
                <span>Real-time analytics</span>
              </div>
              <div className="login-feature-item">
                <i className="bi bi-robot" />
                <span>AI-powered chatbot management</span>
              </div>
              <div className="login-feature-item">
                <i className="bi bi-shield-check" />
                <span>Enterprise security</span>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-login-right">
          <div className="admin-login-card">
            <div className="login-card-header">
              <div className="login-logo-mark">
                <i className="bi bi-building" />
              </div>
              <h2>Welcome back</h2>
              <p>Sign in to your admin dashboard</p>
            </div>

            {error ? (
              <div className="login-error-banner">
                <i className="bi bi-exclamation-triangle-fill" />
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="login-field">
                <label htmlFor="admin-email" className="login-label">
                  <i className="bi bi-envelope" />
                  Email address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className={`login-input ${errors.email ? "has-error" : ""}`}
                  placeholder="you@unido.org"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email is required.",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address.",
                    },
                  })}
                />
                {errors.email ? (
                  <span className="login-field-error">{errors.email.message}</span>
                ) : null}
              </div>

              <div className="login-field">
                <label htmlFor="admin-password" className="login-label">
                  <i className="bi bi-lock" />
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className={`login-input ${errors.password ? "has-error" : ""}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required.",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters.",
                    },
                  })}
                />
                {errors.password ? (
                  <span className="login-field-error">{errors.password.message}</span>
                ) : null}
              </div>

              <button className="login-submit-btn" type="submit" disabled={!isValid || loading}>
                {loading ? (
                  <>
                    <span className="login-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <i className="bi bi-arrow-right" />
                  </>
                )}
              </button>
            </form>

            <div className="login-footer-text">
              Protected by enterprise-grade encryption
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
