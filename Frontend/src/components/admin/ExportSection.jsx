import { useState } from "react";

export default function ExportSection({ onExport }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("all");

  const handleDownload = () => {
    onExport({
      startDate,
      endDate,
      type,
    });
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
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="col">
          <label>To</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
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
