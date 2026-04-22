export default function ScrapingSection({
  scrapeStatus,
  settings,
  onTriggerScrape
}) {
  const isRunning = scrapeStatus.lastStatus === "running";

  const statusConfig = {
    running: { text: "In Progress", badge: "in-progress", icon: "bi-arrow-clockwise", iconClass: "spin" },
    success: { text: "Completed", badge: "success", icon: "bi-check-circle-fill", iconClass: "" },
    error: { text: "Failed", badge: "error", icon: "bi-x-circle-fill", iconClass: "" },
    idle: { text: "Idle", badge: "idle", icon: "bi-pause-circle", iconClass: "" }
  };

  const status = statusConfig[scrapeStatus.lastStatus] || statusConfig.idle;

  const lastScrapeDate = settings.lastScrapeAt
    ? new Date(settings.lastScrapeAt)
    : null;

  const lastScrapeText = lastScrapeDate
    ? lastScrapeDate.toLocaleString()
    : "Never run";

  const timeSinceLastScrape = lastScrapeDate
    ? Math.round((Date.now() - lastScrapeDate.getTime()) / (1000 * 60 * 60))
    : null;

  return (
    <div className="scraping-section">
      <div className="section-header">
        <div className="section-icon" style={{ background: "#f5f0ff", color: "#7c3aed" }}>
          <i className="bi bi-arrow-repeat" />
        </div>
        <div>
          <h3 className="section-title">Data Pipeline</h3>
          <p className="section-subtitle">Manage content scraping and reindexing</p>
        </div>
      </div>

      <div className="scraping-status-grid">
        <div className="scraping-stat-card">
          <span className="scraping-stat-label">Current Status</span>
          <div className={`scraping-badge ${status.badge}`}>
            <i className={`bi ${status.icon} ${status.iconClass}`} />
            {status.text}
          </div>
        </div>

        <div className="scraping-stat-card">
          <span className="scraping-stat-label">Last Execution</span>
          <span className="scraping-stat-value">{lastScrapeText}</span>
          {timeSinceLastScrape !== null && (
            <span className="scraping-stat-meta">
              {timeSinceLastScrape < 1 ? "Less than an hour ago" : `${timeSinceLastScrape}h ago`}
            </span>
          )}
        </div>
      </div>

      {scrapeStatus.lastError && (
        <div className="scraping-error-banner">
          <i className="bi bi-exclamation-triangle-fill" />
          <div>
            <strong>Last error</strong>
            <p>{scrapeStatus.lastError}</p>
          </div>
        </div>
      )}

      <button
        className="scraping-trigger-btn"
        disabled={isRunning}
        onClick={onTriggerScrape}
      >
        <i className={`bi bi-arrow-repeat ${isRunning ? "spin" : ""}`} />
        {isRunning ? "Scraping in progress..." : "Run Full Scrape & Reindex"}
      </button>
    </div>
  );
}
