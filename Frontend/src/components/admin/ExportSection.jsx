import { useState } from "react";

export default function ExportSection({ onExport }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("all");
  const [errors, setErrors] = useState({});

  const today = new Date().toISOString().split("T")[0];

  const validate = () => {
    const newErrors = {};
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownload = () => {
    if (!validate()) return;
    onExport({ startDate, endDate, type });
    setStartDate("");
    setEndDate("");
    setType("all");
  };

  return (
    <div className="export-section">
      <div className="section-header">
        <div className="section-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
          <i className="bi bi-download" />
        </div>
        <div>
          <h3 className="section-title">Export Reports</h3>
          <p className="section-subtitle">Download conversation logs in CSV format</p>
        </div>
      </div>

      <div className="export-form-card">
        <div className="export-fields">
          <div className="export-field">
            <label className="export-label">
              <i className="bi bi-calendar-event" />
              From date
            </label>
            <input
              type="date"
              min="2026-02-12"
              max={today}
              className={`export-input ${errors.startDate ? "has-error" : ""}`}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setErrors({}); }}
            />
            {errors.startDate && <span className="export-field-error">{errors.startDate}</span>}
          </div>

          <div className="export-field">
            <label className="export-label">
              <i className="bi bi-calendar-event" />
              To date
            </label>
            <input
              type="date"
              min={startDate || "2026-02-12"}
              max={today}
              className={`export-input ${errors.endDate ? "has-error" : ""}`}
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setErrors({}); }}
            />
            {errors.endDate && <span className="export-field-error">{errors.endDate}</span>}
          </div>

          <div className="export-field">
            <label className="export-label">
              <i className="bi bi-funnel" />
              Export type
            </label>
            <select
              className="export-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="conversations">Conversations Only</option>
            </select>
          </div>
        </div>

        <button className="export-download-btn" onClick={handleDownload}>
          <i className="bi bi-file-earmark-arrow-down" />
          Download CSV Report
        </button>
      </div>
    </div>
  );
}
