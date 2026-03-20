import { METRIC_CARDS } from "../../constants/analyticsMetricCards";
import MessageDistribution from "../analyticsCharts/MessageDistribution";
import ErrorSuccess from "../analyticsCharts/ErrorSuccess";
import TotalDataChart from "../analyticsCharts/TotalDataChart";

export default function AnalyticsSection({
  analytics,
  year,
  month,
  setYear,
  setMonth
}) {
  const successCount = Math.max(
    (analytics.messages ?? 0) - (analytics.errors ?? 0),
    0
  );
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
      <div className="d-flex  justify-content-end gap-2 mb-4 flex-wrap">

        <select
          className="form-select w-auto"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          <option value="">All Years</option>
          <option value="2026">2026</option>
        </select>

        <select
          className="form-select w-auto"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option value="">All Months</option>
          <option value="1">Jan</option>
          <option value="2">Feb</option>
          <option value="3">Mar</option>
          <option value="4">Apr</option>
          <option value="5">May</option>
          <option value="6">Jun</option>
          <option value="7">Jul</option>
          <option value="8">Aug</option>
          <option value="9">Sep</option>
          <option value="10">Oct</option>
          <option value="11">Nov</option>
          <option value="12">Dec</option>
        </select>

      </div>

      {/* Metric Cards */}
      <div className="admin-card-grid row g-3 mb-4">

        {METRIC_CARDS.map((card) => (
          <div className="col-12 col-sm-6 col-lg-3" key={card.key}>
            <div className="admin-card h-100">
              <div className="card-label">{card.title}</div>

              <div className="card-value">
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
