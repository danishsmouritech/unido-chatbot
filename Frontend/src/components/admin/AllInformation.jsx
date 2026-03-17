import { useEffect, useState } from "react";

export default function AllInformation({
  information,
  pagination,
  loading,
  query,
  onQueryChange
}) {
  const [searchText, setSearchText] = useState(query?.search || "");
  const [selectedLog, setSelectedLog] = useState(null);

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

  }, [searchText]);

function renderSlidingPagesWithDots(currentPage, totalPages, visibleCount = 3) {
  const buttons = [];

  let startPage = Math.max(currentPage - 1, 1);
  let endPage = Math.min(startPage + visibleCount - 1, totalPages);

  if (endPage - startPage + 1 < visibleCount) {
    startPage = Math.max(endPage - visibleCount + 1, 1);
  }
  // if (startPage > 1) {
  //   buttons.push(
  //     <span key="start-ellipsis" className="mx-2">
  //       . . .
  //     </span>
  //   );
  // }

  for (let i = startPage; i <= endPage; i++) {
    buttons.push(
      <button
        key={i}
        className={`btn btn-sm mx-1 ${
          i === currentPage ? "btn-outline-warning" : "btn-outline-primary"
        }`}
        onClick={() => handlePageChange(i)}
      >
        {i}
      </button>
    );
  }

  if (endPage < totalPages) {
    buttons.push(
      <span key="end-ellipsis" className="mx-2">
        . . .
      </span>
    );
  }

  return buttons;
}
  function handlePageChange(page) {

    if (page < 1 || page > pagination.totalPages) return;

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

      <div className="d-flex justify-content-between align-items-center mb-3 ">
       <p className="mb-0 fs-5 fw-bolder">Total Conversations:  <badge className="bg-primary px-2 text-white rounded">{pagination.total}</badge></p>
        <div className="d-flex align-items-center">
            <input
          type="text"
          className="form-control w-20" 
          placeholder="Search question or answer..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
         <button className="btn  btn-primary ms-2" onClick={() => setSearchText("")} > Clear </button>
        </div>
      </div>

      {loading ? (

        <p>Loading...</p>

      ) : (

        <table className="table table-hover align-middle mb-0 all-info-table ">

          <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">IP</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">Question</th> 
                <th scope="col">Answer</th>
                <th scope="col" className="text-end">Action</th>
            </tr>
          </thead>

          <tbody className="overflow-auto ">
            {information.length>0?information.map((log,i) => (
              <tr key={log._id}>
                <td className="col">{i+1}</td>
                <td className="col">{log.requestMeta?.ip}</td>
                <td className="col">
                  {new Date(log.createdAt).toLocaleString().split(",")[0]}
                </td>
                <td className="col">
                  <span
                    className={`badge ${log.status === "success"
                      ? "bg-success"
                      : log.status === "fallback"   
                        ? "bg-warning text-dark"
                        : "bg-danger"
                      }`}
                  >
                    {log.status}
                  </span>
                </td>
               <td className="col" title={log.question}>{truncateWords(log.question, 3)}</td>
                <td className="col" title={log.answer}>{truncateWords(log.answer, 3)}</td>
                <td className="col text-end">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSelectedLog(log)} > View </button>
                </td>
              </tr>

            )):(
              <tr>
                <td colSpan="7" className="text-center py-4 m-auto" style={{height:"300px"}}>No information available</td>
                </tr>
            )}
          </tbody>
        </table>
      )}
      {information.length > 0 && (
        <div className="pagination d-flex justify-content-center align-items-center my-3">

         <button
    className="btn btn-sm btn-outline-primary"
    disabled={pagination.page === 1}
    onClick={() => handlePageChange(pagination.page - 1)}
  >
    Previous
  </button>

  <div className="mx-2 d-flex align-items-center">
    {renderSlidingPagesWithDots(pagination.page, pagination.totalPages, 3)}
  </div>

  {/* Next Button */}
  <button
    className="btn btn-sm btn-outline-primary"
    disabled={pagination.page === pagination.totalPages}
    onClick={() => handlePageChange(pagination.page + 1)}
  >
    Next
  </button>
      </div>)}
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
                    <div><strong>Time:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</div>
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