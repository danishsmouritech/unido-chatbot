import { METRIC_CARDS } from "../../constants/analyticsMetricCards";
import MessageDistribution from "../analyticsCharts/MessageDistribution";
import ErrorSuccess from "../analyticsCharts/ErrorSuccess";
import TotalDataChart from "../analyticsCharts/TotalDataChart";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AnalyticsSection({
  analytics,
  fromDate,
  toDate,
  setFromDate,
  setToDate
}) {
  const successCount = Math.max(
    (analytics.messages ?? 0) - (analytics.errors ?? 0),
    0
  );
  const todayValue = getLocalDateString();
  const pieTotalData = [
    { name: "User Messages", value: analytics.userMessages ?? 0 },
    { name: "Assistant Messages", value: analytics.assistantMessages ?? 0 },
    { name: "Errors", value: analytics.errors ?? 0 },
    { name: "Success", value: successCount }
  ];
  const pieMessageData = [
    { name: "User Messages", value: analytics.userMessages ?? 0 },
    { name: "Assistant Messages", value: analytics.assistantMessages ?? 0 }
  ];
  const pieErrorData = [
    { name: "Errors", value: analytics.errors ?? 0 },
    { name: "Success", value: successCount }
  ];

  const COLORS = ["#0066b3", "#059669", "#dc3545", "#d97706"];

  return (
    <div className="analytics-section">

      {/* Section Header + Filters */}
      <div className="analytics-header">
        <div className="analytics-header-left">
          <h3 className="analytics-title">
            <i className="bi bi-graph-up" />
            Overview
          </h3>
          <p className="analytics-subtitle">Real-time chatbot performance metrics</p>
        </div>
        <div className="analytics-filters">
          <div className="filter-field">
            <label className="filter-label">From</label>
            <input
              type="date"
              className="filter-input"
              value={fromDate}
              min="2026-02-12"
              max={todayValue}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <label className="filter-label">To</label>
            <input
              type="date"
              className="filter-input"
              value={toDate}
              min={fromDate || undefined}
              max={todayValue}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metric-cards-grid">
        {METRIC_CARDS.map((card) => (
          <div className="metric-card" key={card.key}>
            <div className="metric-card-icon" style={{ background: `${card.color}14`, color: card.color }}>
              <i className={`bi ${card.icon}`} />
            </div>
            <div className="metric-card-body">
              <span className="metric-card-label">{card.title}</span>
              <span className="metric-card-value" style={{ color: card.color }}>
                {analytics[card.key] ?? 0}
                {card.suffix ? <small className="metric-suffix">{card.suffix}</small> : null}
              </span>
              <span className="metric-card-subtitle">{card.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-full">
          <TotalDataChart pieTotalData={pieTotalData} COLORS={COLORS} />
        </div>
        <div className="chart-half">
          <MessageDistribution pieMessageData={pieMessageData} COLORS={COLORS} />
        </div>
        <div className="chart-half">
          <ErrorSuccess pieErrorData={pieErrorData} COLORS={COLORS} />
        </div>
      </div>
    </div>
  );
}
