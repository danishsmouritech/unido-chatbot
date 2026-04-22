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

  const COLORS = ["#0d6efd", "#198754", "#dc3545", "#ffc107"];

  return (
    <div className="analytics-section">

      {/* Filters */}
      <div className="row g-3 justify-content-end mb-4">
        <div className="col-12 col-md-4 col-lg-3">
          <label className="form-label mb-1">From date</label>
          <input
            type="date"
            className="form-control"
            value={fromDate}
            min="2026-02-12"
            max={todayValue}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="col-12 col-md-4 col-lg-3">
          <label className="form-label mb-1">To date</label>
          <input
            type="date"
            className="form-control"
            value={toDate}
            min={fromDate || undefined}
            max={todayValue}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="admin-card-grid row g-3 mb-4">

        {METRIC_CARDS.map((card,i) => (
          <div className="col-12 col-sm-6 col-lg-3" key={card.key}>
            <div className="admin-card h-100">
              <div className="card-label">{card.title}</div> <hr />
              <div className={`card-value ${(i == METRIC_CARDS.length - 1 || i == 0 ? "text-primary" : "")}`}>
                {analytics[card.key] ?? 0}
                {card.suffix || ""}
              </div>

              <div className="card-subtitle">
                {card.subtitle}
              </div>
            </div>
          </div>
        ))}

      </div>

      {/* Pie Charts */}
      <div className="row g-4">
         {/* Total Data Chart */}
        <div className="col-md-12">
        <TotalDataChart pieTotalData={pieTotalData} COLORS={COLORS}/>
        </div>
        {/* Message Distribution */}
        <div className="col-md-6">
        <MessageDistribution pieMessageData={pieMessageData} COLORS={COLORS}/>
        </div>

        {/* Errors vs Success */}
        <div className="col-md-6">

          <ErrorSuccess pieErrorData={pieErrorData} COLORS={COLORS} />

        </div>

      </div>

    </div>
  );
}
