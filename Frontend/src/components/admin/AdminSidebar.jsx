import { useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../services/adminService";

export default function AdminSidebar({
  navItems,
  activeTab,
  onTabChange,
  isOpen,
  onRequestClose
}) {
  const navigate = useNavigate();

  const handleTabClick = (tabKey) => {
    onTabChange(tabKey);
    onRequestClose?.();
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      if (token) {
        await logoutAdmin({ Authorization: `Bearer ${token}` });
      }
    } catch {
      // best-effort logout
    } finally {
      localStorage.removeItem("adminToken");
    }
    navigate("/admin/login");
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
        <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
          <i className="bi bi-box-arrow-left" /> Logout
        </button>
      </nav>
    </aside>
  );
}
