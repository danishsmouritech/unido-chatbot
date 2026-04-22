import { useEffect, useState } from "react";

const UNKNOWN_IP = "Unknown IP";

function LoadingSkeleton() {
  return (
    <div className="loading-skeleton">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-cell short" />
          <div className="skeleton-cell medium" />
          <div className="skeleton-cell medium" />
          <div className="skeleton-cell short" />
          <div className="skeleton-cell long" />
          <div className="skeleton-cell long" />
          <div className="skeleton-cell short" />
        </div>
      ))}
    </div>
  );
}

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
      onQueryChange({ ...query, page: 1, search: normalizedSearch });
    }, 400);
    return () => clearTimeout(timer);
  }, [onQueryChange, query, searchText]);

  function renderPagination(current, total) {
    const buttons = [];
    let startPage = Math.max(current - 1, 1);
    let endPage = Math.min(startPage + 2, total);
    if (endPage - startPage + 1 < 3) startPage = Math.max(endPage - 2, 1);

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`page-btn ${i === current ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    if (endPage < total) {
      buttons.push(<span key="dots" className="page-dots">...</span>);
      buttons.push(
        <button key={total} className="page-btn" onClick={() => handlePageChange(total)}>
          {total}
        </button>
      );
    }
    return buttons;
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) return;
    onQueryChange({ ...query, page });
  }

  const truncate = (text = "", limit = 20) => {
    const words = text.split(" ");
    return words.length <= limit ? text : words.slice(0, limit).join(" ") + "...";
  };

  const getStatusConfig = (status) => {
    if (status === "success") return { class: "status-success", icon: "bi-check-circle-fill" };
    if (status === "fallback") return { class: "status-warning", icon: "bi-exclamation-circle-fill" };
    return { class: "status-error", icon: "bi-x-circle-fill" };
  };

  return (
    <div className="allinfo-section">
      {/* Header bar */}
      <div className="allinfo-toolbar">
        <div className="allinfo-count">
          <i className="bi bi-chat-square-text" />
          <span>
            <strong>{totalCount}</strong> conversations
          </span>
        </div>
        <div className="allinfo-search">
          <i className="bi bi-search" />
          <input
            type="text"
            placeholder="Search questions, answers, IPs..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button className="search-clear" onClick={() => setSearchText("")}>
              <i className="bi bi-x" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="table-responsive">
          <table className="info-table">
            <thead>
              <tr>
                <th style={{ width: "54px" }}>#</th>
                <th style={{ width: "120px" }}>IP Address</th>
                <th style={{ width: "100px" }}>Date</th>
                <th style={{ width: "90px" }}>Status</th>
                <th>Question</th>
                <th>Answer</th>
                <th style={{ width: "70px" }} className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {information.length > 0 ? (
                information.map((log, i) => {
                  const statusCfg = getStatusConfig(log.status);
                  return (
                    <tr key={log._id}>
                      <td className="row-num">{rowOffset + i + 1}</td>
                      <td className="ip-cell">{log.requestMeta?.ip || UNKNOWN_IP}</td>
                      <td className="date-cell">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "2-digit", year: "numeric"
                            })
                          : "-"}
                      </td>
                      <td>
                        <span className={`status-pill ${statusCfg.class}`}>
                          <i className={`bi ${statusCfg.icon}`} />
                          {log.status}
                        </span>
                      </td>
                      <td className="text-cell" title={log.question}>{truncate(log.question, 4)}</td>
                      <td className="text-cell" title={log.answer}>{truncate(log.answer, 4)}</td>
                      <td className="text-end">
                        <button className="view-btn" onClick={() => setSelectedLog(log)}>
                          <i className="bi bi-eye" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <i className="bi bi-inbox" />
                    <span>No conversations found</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {information.length > 0 && (
        <div className="allinfo-pagination">
          <span className="page-info">
            {rowOffset + 1}–{Math.min(rowOffset + pageSize, totalCount)} of {totalCount}
          </span>
          <div className="page-controls">
            <button className="page-nav" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
              <i className="bi bi-chevron-left" />
            </button>
            {renderPagination(currentPage, totalPages)}
            <button className="page-nav" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <>
          <div className="detail-modal-overlay" onClick={() => setSelectedLog(null)} />
          <div className="detail-modal">
            <div className="detail-modal-header">
              <h4><i className="bi bi-journal-text" /> Conversation Detail</h4>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="detail-modal-body">
              <div className="detail-meta-grid">
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Timestamp</span>
                  <span className="detail-meta-value">{selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : "-"}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Session ID</span>
                  <span className="detail-meta-value mono">{selectedLog.sessionId || "-"}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Status</span>
                  <span className={`status-pill ${getStatusConfig(selectedLog.status).class}`}>
                    <i className={`bi ${getStatusConfig(selectedLog.status).icon}`} />
                    {selectedLog.status}
                  </span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">IP Address</span>
                  <span className="detail-meta-value mono">{selectedLog?.requestMeta?.ip || UNKNOWN_IP}</span>
                </div>
              </div>

              <div className="detail-conversation">
                <div className="detail-msg user-msg">
                  <div className="detail-msg-label"><i className="bi bi-person" /> User</div>
                  <p>{selectedLog.question || "-"}</p>
                </div>
                <div className="detail-msg bot-msg">
                  <div className="detail-msg-label"><i className="bi bi-robot" /> Assistant</div>
                  <p>{selectedLog.answer || "-"}</p>
                </div>
              </div>

              <details className="detail-json-section">
                <summary>Raw JSON</summary>
                <pre className="detail-json">{JSON.stringify(selectedLog, null, 2)}</pre>
              </details>
            </div>
            <div className="detail-modal-footer">
              <button className="modal-btn secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2))}>
                <i className="bi bi-clipboard" /> Copy JSON
              </button>
              <button className="modal-btn primary" onClick={() => setSelectedLog(null)}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
