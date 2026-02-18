export default function AdminSidebar({ navItems, activeTab, onTabChange }) {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">UN</div>
        <div>
          <h2>UNIDO</h2>
          <p>Careers Admin</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`btn btn-sm w-100 ${activeTab === item.key ? "active" : ""}`}
          >
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
