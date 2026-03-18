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
    } catch {
    } finally {
      localStorage.removeItem("adminToken");
      setLoggingOut(false);
    }
    navigate("/login");
    onRequestClose?.();
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">UN</div>
        <div>
          <h2>UNIDO</h2>
          <p>Careers Admin</p>
        </div>
        <button
          type="button"
          className="sidebar-close-btn d-lg-none"
          onClick={onRequestClose}
          aria-label="Close sidebar"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleTabClick(item.key)}
            className={`btn btn-sm w-100 ${activeTab === item.key ? "active" : ""}`}
          >
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <i className="bi bi-box-arrow-left" /> {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </nav>
    </aside>
  );
}
