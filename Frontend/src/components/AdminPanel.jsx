import { useEffect, useState } from "react";
import "../styles/adminPanel.css";
import { ADMIN_TABS } from "../constants/adminDashboard";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import AdminSidebar from "./admin/AdminSidebar";
import AnalyticsSection from "./admin/AnalyticsSection";
import SettingsSection from "./admin/SettingsSection";
import ScrapingSection from "./admin/ScrapingSection";
import ExportSection from "./admin/ExportSection";
import { toast } from "react-toastify";
function ActiveSection({
  activeTab,
  analytics,
  settings,
  setSettings,
  scrapeStatus,
  saveSettings,
  triggerScrape,
  exportCsv
}) {
  if (activeTab === "analytics") {
    return <AnalyticsSection analytics={analytics} />;
  }

  if (activeTab === "settings") {
    return (
      <SettingsSection
        settings={settings}
        onSettingsChange={setSettings}
        onSaveSettings={saveSettings}
      />
    );
  }

  if (activeTab === "scraping") {
    return (
      <ScrapingSection
        scrapeStatus={scrapeStatus}
        settings={settings}
        onTriggerScrape={triggerScrape}
      />
    );
  }

  return <ExportSection onExport={exportCsv} />;
}

export default function AdminPanel() {
  const {
    activeTab,
    setActiveTab,
    analytics,
    settings,
    setSettings,
    scrapeStatus,
    notification,
    saveSettings,
    triggerScrape,
    exportCsv,
  } = useAdminDashboard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  useEffect(() => {
  if (!notification) return;

  const { type, text } = notification;

  if (type === "success") toast.success(text);
  else if (type === "error") toast.error(text);
  else if (type === "warning") toast.warning(text);
  else toast.info(text);

}, [notification]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 992) {
      document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const activeLabel = ADMIN_TABS.find((tab) => tab.key === activeTab)?.label || "Dashboard";

  return (
    <div className="admin-layout container-fluid g-0">
      <div
        className={`admin-sidebar-overlay ${isSidebarOpen ? "show" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <AdminSidebar
        navItems={ADMIN_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onRequestClose={() => setIsSidebarOpen(false)}
      />

      <main className="admin-content">
        <div className="admin-shell container-xxl">
        <div className="admin-header">
          <div className="admin-topbar">
            <button
              type="button"
              className="sidebar-toggle-btn d-lg-none"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <i className="bi bi-list" />
            </button>
            <div className="admin-title-wrap">
              <h1 className="d-none d-sm-block">Admin Dashboard</h1>
              <p className="d-none d-sm-block">
                Manage chatbot behavior, review analytics, and run operational tasks.
              </p>
              <div className="admin-mobile-hero d-sm-none">
                <span className="admin-mobile-brand">UNIDO Careers</span>
              </div>
            </div>
            <span className="admin-active-pill">{activeLabel}</span>
          </div>
        </div>
        <section className="admin-body-card">
          <div className="admin-section-title fs-3 fw-bolder over">
            <span>{activeLabel}</span>
          </div>
          <div className="hide-scrollbar">
            <ActiveSection
              activeTab={activeTab}
              analytics={analytics}
              settings={settings}
              setSettings={setSettings}
              scrapeStatus={scrapeStatus}
              saveSettings={saveSettings}
              triggerScrape={triggerScrape}
              exportCsv={exportCsv}
            />
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}
