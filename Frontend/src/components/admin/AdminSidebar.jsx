import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { logoutAdmin } from "../../services/adminService";

export default function AdminSidebar({
  navItems,
  activeTab,
  onTabChange,
  isOpen,
  onRequestClose
}) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleTabClick = (tabKey) => {
    onTabChange(tabKey);
    onRequestClose?.();
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const token = localStorage.getItem("adminToken");
    try {
      if (token) {
        await logoutAdmin({ Authorization: `Bearer ${token}` });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("adminToken");
      setLoggingOut(false);
    }
    navigate("/login");
    onRequestClose?.();
  };

  return (
    <aside className={`admin-sidebar d-flex flex-column flex-shrink-0 ${isOpen ? "open" : ""}`}>
      <div className="sidebar-brand d-flex align-items-center gap-3">
        <div className="brand-mark d-flex align-items-center justify-content-center">
          <i className="bi bi-building" />
        </div>
        <div className="brand-text">
          <h2 className="m-0">UNIDO</h2>
          <p>Careers Admin</p>
        </div>
        <button
          type="button"
          className="sidebar-close-btn ms-auto d-flex align-items-center justify-content-center d-lg-none"
          onClick={onRequestClose}
          aria-label="Close sidebar"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="sidebar-section-label">Navigation</div>

      <nav className="sidebar-nav d-flex flex-column gap-1 flex-grow-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleTabClick(item.key)}
            className={`d-flex align-items-center gap-2 ${activeTab === item.key ? "active" : ""}`}
          >
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
            {activeTab === item.key && <span className="nav-active-dot" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-divider" />

      <button
        className="sidebar-logout-btn d-flex align-items-center gap-2"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <i className="bi bi-box-arrow-left" />
        <span>{loggingOut ? "Logging out..." : "Logout"}</span>
      </button>

      <div className="sidebar-footer mt-auto pt-3 text-center">
        <span className="sidebar-footer-version d-block">v1.0</span>
        <span className="sidebar-footer-env d-inline-block mt-1">
          {process.env.NODE_ENV === "production" ? "Production" : "Development"}
        </span>
      </div>
    </aside>
  );
}
