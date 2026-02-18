export default function ScrapingSection({ scrapeStatus, settings, onTriggerScrape }) {
  const statusText = scrapeStatus.running
    ? "In Progress"
    : scrapeStatus.lastStatus === "success"
      ? "Completed"
      : scrapeStatus.lastStatus === "error"
        ? "Failed"
        : "Idle";

  const lastScrapeDate = settings.lastScrapeAt ? new Date(settings.lastScrapeAt) : null;
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

      <div className="scraping-status-card row g-3">
        <div className="scraping-status-col col-12 col-md-6">
          <div className="scraping-label">Current Status</div>
          <div className={`scraping-badge ${scrapeStatus.running ? "in-progress" : "idle"}`}>
            <span className="scraping-badge-dot" />
            {statusText}
          </div>
        </div>

        <div className="scraping-status-col scraping-last-col col-12 col-md-6">
          <div className="scraping-label">Last Scrape</div>
          <div className="scraping-last-text">{lastScrapeText}</div>
        </div>
      </div>

      {scrapeStatus.lastError ? (
        <div className="status-error">Last error: {scrapeStatus.lastError}</div>
      ) : null}

      <button
        className="scraping-trigger-btn btn btn-primary"
        disabled={scrapeStatus.running}
        onClick={onTriggerScrape}
      >
        <i className="bi bi-arrow-repeat" />
        Trigger Re-Scraping
      </button>
    </div>
  );
}
