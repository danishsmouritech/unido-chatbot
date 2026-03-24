import { useEffect, useState } from "react";

const UNKNOWN_IP = "Unknown IP";

export default function AllInformation({
  information,
  pagination,
  loading,
  query,
  onQueryChange
}) {
  const [searchText, setSearchText] = useState(query?.search || "");
  const [selectedLog, setSelectedLog] = useState(null);

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total ?? 0;
  const pageSize = pagination?.limit ?? query?.limit ?? 25;
  const rowOffset = (currentPage - 1) * pageSize;

  useEffect(() => {
    setSearchText(query?.search || "");
  }, [query?.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const normalizedSearch = searchText.trim();

      if (normalizedSearch === (query?.search || "")) return;

      onQueryChange({
        ...query,
        page: 1,
        search: normalizedSearch
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [onQueryChange, query, searchText]);

  function renderSlidingPagesWithDots(current, total, visibleCount = 3) {
    const buttons = [];

    let startPage = Math.max(current - 1, 1);
    let endPage = Math.min(startPage + visibleCount - 1, total);

    if (endPage - startPage + 1 < visibleCount) {
      startPage = Math.max(endPage - visibleCount + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`btn btn-sm mx-1 ${
            i === current ? "btn-outline-warning" : "btn-outline-primary"
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < total) {
      buttons.push(
        <span key="end-ellipsis" className="mx-2">
          . . .
        </span>
      );
    }

    return buttons;
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) return;

    onQueryChange({
      ...query,
      page
    });
  }

  const truncateWords = (text = "", limit = 20) => {
    const words = text.split(" ");
    if (words.length <= limit) return text;
    return words.slice(0, limit).join(" ") + "...";
  };

  return (

    <div className="p-2">

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
        <p className="mb-2 mb-md-0  fw-bolder">
          Total Conversations:
          <span className="badge bg-primary px-2 text-white rounded ms-1">
            {totalCount}
          </span>
        </p>

        <div className="d-flex w-md-auto">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Search question or answer..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <button
            className="btn btn-primary"
            onClick={() => setSearchText("")}
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (

        <p>Loading...</p>

      ) : (
        <div className="table-responsive">
  <table className="table table-hover align-middle mb-0 all-info-table">

    <thead>
      <tr>
        <th>ID</th>
        <th>IP</th>
        <th>Date</th>
        <th>Status</th>
        <th>Question</th>
        <th>Answer</th>
        <th className="text-end">Action</th>
      </tr>
    </thead>

    <tbody>
      {information.length > 0 ? (
        information.map((log, i) => (
          <tr key={log._id}>
            <td>{rowOffset + i + 1}</td>
            <td>{log.requestMeta?.ip || UNKNOWN_IP}</td>

            <td>
              {log.createdAt ? new Date(log.createdAt)
                .toLocaleString()
                .split(",")[0] : "-"}
            </td>

            <td>
              <span
                className={`badge ${
                  log.status === "success"
                    ? "bg-success"
                    : log.status === "fallback"
                    ? "bg-warning text-dark"
                    : "bg-danger"
                }`}
              >
                {log.status}
              </span>
            </td>

            <td title={log.question}>
              {truncateWords(log.question, 3)}
            </td>

            <td title={log.answer}>
              {truncateWords(log.answer, 3)}
            </td>

            <td className="text-end">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setSelectedLog(log)}
              >
                View
              </button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="7" className="text-center py-4">
            No information available
          </td>
        </tr>
      )}
    </tbody>

  </table>
</div>
      )}
      {
        information.length > 0 && (
          <div className="allinfo-footer">

         <div className="result-count">
       Showing {rowOffset + 1}–{Math.min(rowOffset + pageSize, totalCount)} of {totalCount} results
      </div>

  <div className="pagination-controls">

    <button
      disabled={currentPage === 1}
      onClick={() => handlePageChange(currentPage - 1)}
    >
      Previous
    </button>

    {renderSlidingPagesWithDots(currentPage, totalPages)}

    <button
      disabled={currentPage === totalPages}
      onClick={() => handlePageChange(currentPage + 1)}
    >
      Next
    </button>

  </div>
</div>)
      }
      {selectedLog && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                <h5 className="modal-title">Log Details</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setSelectedLog(null)} />
              </div>
                <div className="modal-body">
                  <div className="mb-3">
                  <div><strong>Time:</strong> {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : "-"}</div>
                  <div><strong>Session:</strong> {selectedLog.sessionId || "-"}</div>
                  <div><strong>Status:</strong> {selectedLog.status || "-"}</div>
                  <div><strong>IP:</strong> {selectedLog?.requestMeta?.ip || UNKNOWN_IP}</div>
                </div>
                  <h6>Question</h6>
                  <p className="mb-3">{selectedLog.question || "-"}</p>
                  <h6>Answer</h6>
                  <p className="mb-3">{selectedLog.answer || "-"}</p>
                  <h6>Raw JSON</h6>
                  <pre className="all-info-json mb-0"> {JSON.stringify(selectedLog, null, 2)} </pre>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2))} > Copy JSON </button>
                  <button type="button" className="btn btn-primary" onClick={() => setSelectedLog(null)}> Close </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setSelectedLog(null)} />
        </>)}
    </div>
  );
}
