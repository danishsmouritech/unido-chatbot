import "../styles/adminPanel.css";
import { ADMIN_TABS } from "../constants/adminDashboard";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import AdminSidebar from "./admin/AdminSidebar";
import AnalyticsSection from "./admin/AnalyticsSection";
import SettingsSection from "./admin/SettingsSection";
import ScrapingSection from "./admin/ScrapingSection";
import ExportSection from "./admin/ExportSection";
import {useNavigate } from "react-router-dom";
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
   const navigate = useNavigate();
  const {
    activeTab,
    setActiveTab,
    analytics,
    settings,
    setSettings,
    scrapeStatus,
    message,
    saveSettings,
    triggerScrape,
    exportCsv,
  } = useAdminDashboard();

  const activeLabel = ADMIN_TABS.find((tab) => tab.key === activeTab)?.label || "Dashboard";

  return (
    <div className="admin-layout container-fluid g-0">
      <AdminSidebar
        navItems={ADMIN_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="admin-content container-xxl">
        <div className="admin-header">
          <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-start gap-2">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Manage chatbot behavior, review analytics, and run operational tasks.</p>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => {
              // localStorage.removeItem("adminToken");
              navigate("/admin/login");
            }}>
              Logout
            </button>
          </div>
        </div>

        <div className="admin-section-title">
          <span>{activeLabel}</span>
        </div>

        {message ? <div className="admin-message alert alert-info mb-0">{message}</div> : null}

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
      </main>
    </div>
  );
}
