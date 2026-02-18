import { useState } from "react";
import { loginAdmin } from "../services/adminService";

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      setLoading(true);
      setError("");
      const payload = await loginAdmin({ email, password });
      localStorage.setItem("adminToken", payload.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <h2>UNIDO Admin Login</h2>
        <p>Sign in to manage chatbot settings and analytics.</p>
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        <form onSubmit={handleSubmit} className="d-grid gap-3">
          <input
            className="form-control"
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="form-control"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
