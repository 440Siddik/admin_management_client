import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext'; // Corrected path to contexts
import { SERVER_URL } from '../../utils/api';

const TrashReportsPage = () => {
  const [trashedReports, setTrashedReports] = useState([]);
  const [loading, setLoading] = useState(true); // Overall loading state for data fetch
  const [actionInProgress, setActionInProgress] = useState(false); // Specific loading for modal actions
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedReports, setSelectedReports] = useState([]);

  const [actionMessage, setActionMessage] = useState(null);

  // States for the custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirmText, setModalConfirmText] = useState('');
  const [modalAction, setModalAction] = useState(null); // 'restore' or 'permanent_delete'
  const [modalReportIds, setModalReportIds] = useState([]); // IDs for the action

  const location = useLocation();
  const navigate = useNavigate();

  const { idToken, userRole, loading: authLoading } = useAuth();

  const backendUrl = SERVER_URL;

  // Function to fetch trashed reports
  const fetchTrashedReports = async () => {
    console.log("DEBUG: TrashReportsPage: fetchTrashedReports called.");
    if (authLoading) {
      setLoading(false);
      return;
    }
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      setError("Access Denied: You do not have permission to view trashed reports.");
      setLoading(false);
      return;
    }
    if (!idToken) {
        setError("Authentication required: Please log in as an admin.");
        setLoading(false);
        return;
    }

    try {
      setLoading(true); // Start loading for data fetch
      setError(null);
      setActionMessage(null); // Clear previous action messages

      const queryParams = new URLSearchParams(location.search);
      const pageFromUrl = parseInt(queryParams.get('page')) || 1;

      // Only update currentPage if it's different to avoid infinite loops with useEffect
      if (pageFromUrl !== currentPage) {
        setCurrentPage(pageFromUrl);
        // The useEffect will re-run when currentPage changes, so we return here
        return;
      }

      const url = `${backendUrl}/api/trashedReports?page=${pageFromUrl}&limit=${itemsPerPage}`;
      console.log("DEBUG: TrashReportsPage: Attempting to fetch trashed reports from URL:", url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      console.log("DEBUG: TrashReportsPage: Received fetch response status:", response.status);
      const responseText = await response.text(); // Read body once
      let result;
      try {
        result = JSON.parse(responseText);
        console.log("DEBUG: TrashReportsPage: Fetched data JSON:", result);
      } catch (jsonParseError) {
        console.error("ERROR: TrashReportsPage: Fetch response was not JSON. Raw text:", responseText);
        throw new Error(`Server responded with non-JSON content (Status: ${response.status}). Raw: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        console.error("ERROR: TrashReportsPage: Fetch failed with non-OK status. Message:", result.message);
        throw new Error(result.message || `Failed to fetch trashed reports. Status: ${response.status}`);
      }

      setTrashedReports(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
      setSelectedReports([]); // Clear selections after re-fetching

    } catch (err) {
      console.error("ERROR: TrashReportsPage: Error fetching trashed reports:", err);
      setError(err.message || 'Could not load trashed reports. Check network and backend CORS configuration.');
    } finally {
      setLoading(false); // End loading for data fetch
    }
  };

  // Effect hook to trigger data fetch when dependencies change
  useEffect(() => {
    // This ensures fetchData runs only when auth state is stable and relevant changes occur
    if (!authLoading && idToken && (userRole === 'admin' || userRole === 'superadmin')) {
      fetchTrashedReports();
    } else if (!authLoading && (!idToken || (userRole !== 'admin' && userRole !== 'superadmin'))) {
      // If auth is ready but user is not admin or not logged in, set error
      setError("Access Denied: You do not have permission to view this page or are not logged in as an admin.");
      setLoading(false);
    }
  }, [location.search, itemsPerPage, backendUrl, currentPage, idToken, userRole, authLoading]);


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      navigate(`/trash-reports?page=${newPage}&limit=${itemsPerPage}`);
    }
  };

  const handleSelectReport = (reportId, isChecked) => {
    setSelectedReports(prev =>
      isChecked ? [...prev, reportId] : prev.filter(id => id !== reportId)
    );
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedReports(trashedReports.map(report => report._id));
    } else {
      setSelectedReports([]);
    }
  };

  const showConfirmationModal = (action, ids) => {
    setModalAction(action);
    setModalReportIds(ids);
    if (action === 'restore') {
      setModalTitle(`Confirm Restore ${ids.length > 1 ? 'Reports' : 'Report'}`);
      setModalMessage(`Are you sure you want to restore ${ids.length > 1 ? `${ids.length} selected reports` : `this report`} from trash?`);
      setModalConfirmText('Restore');
    } else if (action === 'permanent_delete') {
      setModalTitle(`Confirm Permanent Delete ${ids.length > 1 ? 'Reports' : 'Report'}`);
      setModalMessage(`Are you absolutely sure you want to PERMANENTLY DELETE ${ids.length > 1 ? `${ids.length} selected reports` : `this report`}? This action cannot be undone.`);
      setModalConfirmText('Delete Permanently');
    }
    setShowConfirmModal(true);
  };

  const executeModalAction = async () => {
    setShowConfirmModal(false);
    setActionInProgress(true);
    setActionMessage(null);

    console.log(`DEBUG: TrashReportsPage: executeModalAction called for action: ${modalAction} with IDs:`, modalReportIds);

    try {
      let response;
      if (modalAction === 'restore') {
        if (modalReportIds.length === 1) {
          console.log(`DEBUG: Calling single restore API: ${backendUrl}/api/trashedReports/${modalReportIds[0]}/restore`);
          response = await fetch(`${backendUrl}/api/trashedReports/${modalReportIds[0]}/restore`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
        } else {
          console.log(`DEBUG: Calling bulk restore API: ${backendUrl}/api/trashedReports/bulk-action`);
          response = await fetch(`${backendUrl}/api/trashedReports/bulk-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ ids: modalReportIds, action: 'restore' })
          });
        }
      } else if (modalAction === 'permanent_delete') {
        if (modalReportIds.length === 1) {
          console.log(`DEBUG: Calling single permanent delete API: ${backendUrl}/api/trashedReports/${modalReportIds[0]}/permanent`);
          response = await fetch(`${backendUrl}/api/trashedReports/${modalReportIds[0]}/permanent`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
        } else {
          console.log(`DEBUG: Calling bulk permanent delete API: ${backendUrl}/api/trashedReports/bulk-action`);
          response = await fetch(`${backendUrl}/api/trashedReports/bulk-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ ids: modalReportIds, action: 'permanent_delete' })
          });
        }
      } else {
        throw new Error('Invalid action type for modal.');
      }

      console.log(`DEBUG: Action '${modalAction}' response status:`, response.status);

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
        console.log(`DEBUG: Action '${modalAction}' response JSON:`, result);
      } catch (jsonError) {
        console.error(`ERROR: Action '${modalAction}' response was not JSON. Raw text:`, responseText);
        throw new Error(`Server responded with non-JSON content for action (Status: ${response.status}). Raw: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        console.error(`ERROR: Action '${modalAction}' failed with non-OK status. Message:`, result.message);
        throw new Error(result.message || `Failed to perform ${modalAction} action. Status: ${response.status}`);
      }

      setActionMessage({ type: 'success', message: result.message });
      fetchTrashedReports();

    } catch (err) {
      console.error(`ERROR: TrashReportsPage: Error performing ${modalAction} action:`, err);
      setActionMessage({ type: 'error', message: err.message || `Failed to perform ${modalAction} action.` });
    } finally {
      setActionInProgress(false);
      setModalAction(null);
      setModalReportIds([]);
    }
  };

  const cancelModalAction = () => {
    setShowConfirmModal(false);
    setModalAction(null);
    setModalReportIds([]);
  };

  const handleRestoreClick = (reportId) => {
    showConfirmationModal('restore', [reportId]);
  };

  const handlePermanentDeleteClick = (reportId) => {
    showConfirmationModal('permanent_delete', [reportId]);
  };

  const handleBulkRestore = () => {
    showConfirmationModal('restore', selectedReports);
  };

  const handleBulkPermanentDelete = () => {
    showConfirmationModal('permanent_delete', selectedReports);
  };

  const overallLoading = loading || authLoading || actionInProgress;

  if (overallLoading && !trashedReports.length && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-6 rounded-lg shadow-lg bg-white">
          <p className="text-xl text-gray-700 font-semibold mb-4">Loading trashed reports...</p>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="text-center p-6 rounded-lg shadow-lg bg-white">
          <p className="text-xl text-red-700 font-semibold">Error: {error}</p>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="text-center p-6 rounded-lg shadow-lg bg-white">
          <p className="text-xl text-red-700 font-semibold">Access Denied: You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 lg:p-10 max-w-screen-2xl min-h-screen bg-gray-50 font-inter antialiased">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-800 flex-grow">
          Trashed Reports ({totalItems} total)
        </h1>
        <button
          onClick={fetchTrashedReports}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={overallLoading}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0020 13a8 8 0 01-15.356 2m0-2v-5h-.582m15.356 2H21"></path>
          </svg>
          Refresh
        </button>
      </div>

      {actionMessage && (
        <div className={`bg-${actionMessage.type === 'success' ? 'green' : 'red'}-100 border border-${actionMessage.type === 'success' ? 'green' : 'red'}-400 text-${actionMessage.type === 'success' ? 'green' : 'red'}-700 px-4 py-3 rounded-lg relative mb-6 shadow-md transition-all duration-300`} role="alert">
          <strong className="font-bold">{actionMessage.type === 'success' ? 'Success!' : 'Error!'}</strong>
          <span className="block sm:inline"> {actionMessage.message}</span>
        </div>
      )}

      {trashedReports.length === 0 && !overallLoading ? (
        <p className="text-center text-gray-700 text-lg sm:text-xl md:text-2xl mt-16 p-6 bg-white rounded-lg shadow-md">
          No reports in trash at the moment.
        </p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <label className="inline-flex items-center text-lg sm:text-xl font-medium text-gray-800">
              <input
                type="checkbox"
                className="form-checkbox h-6 w-6 text-blue-600 rounded-md focus:ring-blue-500"
                checked={selectedReports.length === trashedReports.length && trashedReports.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                disabled={overallLoading}
              />
              <span className="ml-3">Select All</span>
            </label>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={handleBulkRestore}
                disabled={selectedReports.length === 0 || overallLoading}
                className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 text-base sm:text-lg font-semibold"
              >
                Restore Selected ({selectedReports.length})
              </button>
              <button
                onClick={handleBulkPermanentDelete}
                disabled={selectedReports.length === 0 || overallLoading}
                className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 text-base sm:text-lg font-semibold"
              >
                Delete Selected Permanently ({selectedReports.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {trashedReports.map((report) => (
              <div
                key={report._id}
                className="bg-white rounded-xl shadow-lg border border-yellow-300 p-6 flex flex-col justify-between overflow-hidden" // Added overflow-hidden
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{report.name}</h2>
                  <div className="text-sm text-gray-700 space-y-2">
                    {/* Status */}
                    <div className="flex items-baseline">
                      <span className="font-semibold w-24 flex-shrink-0">Status:</span>
                      <span
                        className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          report.status === "suspended"
                            ? "bg-yellow-600 text-white"
                            : report.status === "banned"
                            ? "bg-red-600 text-white"
                            : "bg-blue-600 text-white"
                        } flex-1 min-w-0 break-words`}
                      >
                        {report.status}
                      </span>
                    </div>
                    {/* Phone */}
                    <div className="flex items-baseline">
                      <span className="font-semibold w-24 flex-shrink-0">Phone:</span>
                      <a
                        href={`tel:${report.phone}`}
                        className="text-blue-600 hover:underline ml-2 flex-1 min-w-0 break-words"
                      >
                        {report.phone}
                      </a>
                    </div>
                    {/* Facebook */}
                    <div className="flex items-baseline">
                      <span className="font-semibold w-24 flex-shrink-0">Facebook:</span>
                      <a
                        href={report.facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-2 flex-1 min-w-0 break-all" // Changed to break-all for URLs
                      >
                        {report.facebookLink}
                      </a>
                    </div>
                    {/* Reported On */}
                    <div className="flex items-baseline mt-3">
                      <span className="font-semibold w-24 flex-shrink-0">Reported On:</span>
                      <span className="ml-2 text-gray-700 flex-1 min-w-0 break-words"> {/* Added break-words */}
                        {report.timestamp ? new Date(report.timestamp).toLocaleString() : "N/A"}
                      </span>
                    </div>
                    {/* Reported By */}
                    {report.reporterName && (
                      <div className="flex items-baseline mt-3">
                        <span className="font-semibold w-24 flex-shrink-0">Reported By:</span>
                        <span className="ml-2 text-orange-700 font-bold flex-1 min-w-0 break-words"> {/* Added break-words */}
                          {report.reporterName}
                        </span>
                      </div>
                    )}
                    {/* Trashed On */}
                    {report.deletedAt && (
                      <div className="flex items-baseline mt-3 text-red-600">
                        <span className="font-semibold w-24 flex-shrink-0">Trashed On:</span>
                        <span className="ml-2 flex-1 min-w-0 break-words"> {/* Added break-words */}
                          {new Date(report.deletedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">Reason:</p>
                    <p className="text-gray-700 leading-relaxed break-words text-sm"> {/* Ensured break-words */}
                      {report.reason}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => handleRestoreClick(report._id)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-base font-medium text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
                    disabled={overallLoading}
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDeleteClick(report._id)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-base font-medium text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
                    disabled={overallLoading}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || overallLoading}
                className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-base sm:text-lg font-semibold"
              >
                Previous
              </button>
              <span className="text-lg sm:text-xl font-semibold text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || overallLoading}
                className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-base sm:text-lg font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-lg w-full transform transition-all duration-300 ease-out animate-modal-in">
            <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 border-b pb-4 border-gray-200">
              {modalTitle}
            </h3>
            <p className="text-base sm:text-lg text-gray-700 text-center mb-8 leading-relaxed">
              {modalMessage}
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={cancelModalAction}
                className="w-full sm:w-auto px-6 py-3 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 text-base sm:text-lg font-semibold"
                disabled={overallLoading}
              >
                Cancel
              </button>
              <button
                onClick={executeModalAction}
                className={`w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-semibold text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  modalAction === 'restore'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-600 disabled:bg-gray-300'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-600 disabled:bg-gray-300'
                }`}
                disabled={overallLoading}
              >
                {overallLoading ? 'Processing...' : modalConfirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashReportsPage;
