import { useState } from "react";

export default function ExportSection({ onExport }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("all");
  const [errors, setErrors] = useState({});

  const today = new Date().toISOString().split("T")[0];

  const validate = () => {
    const newErrors = {};

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!endDate) {
      newErrors.endDate = "End date is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownload = () => {
    if (!validate()) return;

    onExport({
      startDate,
      endDate,
      type,
    });
    setStartDate("");
    setEndDate("");
    setType("all");
  };

  return (
    <div className="admin-panel-block">
      <h5>Export Chat Logs (CSV)</h5>

      {/* Date Range */}
      <div className="row mb-3">
        <div className="col">
          <label>From</label>
          <input
            type="date"
            min="2026-02-12"
            max={today}
            className="form-control"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setErrors({});
            }}
          />
          {errors.startDate && (
            <small className="text-danger">{errors.startDate}</small>
          )}
        </div>

        <div className="col">
          <label>To</label>
          <input
            type="date"
            min={startDate || "2026-02-12"}
            max={today}
            className="form-control"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setErrors({});
            }}
          />
          {errors.endDate && (
            <small className="text-danger">{errors.endDate}</small>
          )}
        </div>
      </div>

      {/* Type */}
      <div className="mb-3">
        <label>Export Type</label>
        <select
          className="form-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">All Events</option>
          <option value="conversations">Conversations Only</option>
        </select>
      </div>

      <button
        className="download-btn btn btn-primary"
        onClick={handleDownload}
      >
        Download CSV Report
      </button>
    </div>
  );
}
