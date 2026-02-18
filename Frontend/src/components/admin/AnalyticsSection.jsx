import {METRIC_CARDS} from "../../constants/analyticsMetricCards"
export default function AnalyticsSection({ analytics }) {

  const eventData = [
    { label: "conversation started", value: analytics.conversations ?? 0 },
    { label: "message sent", value: analytics.userMessages ?? 0 },
    { label: "message received", value: analytics.assistantMessages ?? 0 },
    { label: "session ended", value: analytics.conversations ?? 0 },
    { label: "error", value: analytics.errors ?? 0 }
  ];

  const maxValue = Math.max(...eventData.map(e => e.value), 1);

  return (
    <div className="analytics-section">
      <div className="admin-card-grid row g-3">
        {METRIC_CARDS.map((card) => (
          <div className="col-12 col-sm-6" key={card.key}>
            <div className="admin-card h-100">
              <div className="card-label">{card.title}</div>
              <div className="card-value">
                {analytics[card.key] ?? 0}
                {card.suffix || ""}
              </div>
              <div className="card-subtitle">{card.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="event-breakdown">
        <div className="event-title">Event Breakdown</div>
        <div className="event-chart">
          {eventData.map((event) => (
            <div className="event-row row g-2 align-items-center" key={event.label}>
              <div className="event-label col-12 col-md-3">{event.label}</div>
              <div className="event-bar-track col-10 col-md-8">
                <div
                  className="event-bar-fill"
                  style={{ width: `${(event.value / maxValue) * 100}%` }}
                />
              </div>
              <div className="event-value col-2 col-md-1">
                {event.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
