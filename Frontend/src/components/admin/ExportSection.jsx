export default function ExportSection({ onExport }) {
  return (
    <div className="admin-panel-block">
      <p>Download latest chat logs in CSV format.</p>
      <div className="d-grid d-sm-block">
        <button className="download-btn btn btn-primary" onClick={onExport}>
          Download CSV Report
        </button>
      </div>
    </div>
  );
}
