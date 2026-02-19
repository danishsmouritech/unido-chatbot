export default function ScrapingSection({
  scrapeStatus,
  settings,
  onTriggerScrape
}) {
  const isRunning = scrapeStatus.lastStatus === "running";

  const statusText =
    scrapeStatus.lastStatus === "running"
      ? "In Progress"
      : scrapeStatus.lastStatus === "success"
      ? "Completed"
      : scrapeStatus.lastStatus === "error"
      ? "Failed"
      : "Idle";

  const badgeClass =
    scrapeStatus.lastStatus === "running"
      ? "in-progress"
      : scrapeStatus.lastStatus === "success"
      ? "success"
      : scrapeStatus.lastStatus === "error"
      ? "error"
      : "idle";

  const lastScrapeDate = settings.lastScrapeAt
    ? new Date(settings.lastScrapeAt)
    : null;

  const lastScrapeText = lastScrapeDate
    ? lastScrapeDate.toLocaleString()
    : "Not available";

  return (
    <div className="admin-panel-block scraping-panel">
      <div className="scraping-header">
        <div className="scraping-icon-wrap">
          <i className="bi bi-arrow-repeat" />
        </div>
        <h3>Scraping Control</h3>
      </div>

      <div className="scraping-status-card">
        <div className="scraping-status-col">
          <div className="scraping-label">Current Status</div>
          <div className={`scraping-badge ${badgeClass}`}>
            <span className="scraping-badge-dot" />
            {statusText}
          </div>
        </div>

        <div className="scraping-status-col">
          <div className="scraping-label">Last Scrape</div>
          <div className="scraping-last-text">
            {lastScrapeText}
          </div>
        </div>
      </div>

      {scrapeStatus.lastError && (
        <div className="status-error">
          Last error: {scrapeStatus.lastError}
        </div>
      )}

      <button
        className="scraping-trigger-btn"
        disabled={isRunning}
        onClick={onTriggerScrape}
      >
        <i className="bi bi-arrow-repeat" />
        {isRunning ? "Scraping..." : "Trigger Re-Scraping"}
      </button>
    </div>
  );
}
