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
    formState: { errors ,isValid },
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
            <span className="admin-login-badge">UNIDO Secure Access</span>
            <h1>Admin Control Center</h1>
            <p>
              Monitor chatbot operations, manage system prompts, and export reports from one secure workspace.
            </p>
          </div>
        </section>

        <section className="admin-login-right">
          <div className="admin-login-card">
            <h2>Sign in</h2>
            <p>Use your admin credentials to continue.</p>

            {error ? <div className="alert alert-danger mt-3 mb-3">{error}</div> : null}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="mb-3">
                <label htmlFor="admin-email" className="form-label">
                  Email address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
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
                  <div className="invalid-feedback d-block">{errors.email.message}</div>
                ) : null}
              </div>

              <div className="mb-4">
                <label htmlFor="admin-password" className="form-label">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
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
                  <div className="invalid-feedback d-block">{errors.password.message}</div>
                ) : null}
              </div>

              <button className="btn btn-primary w-100" disabled={!isValid}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
