import { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

const AllData = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24); // Set to 24 as per your code
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // IMPORTANT: Use environment variable for backend URL.
  // When deployed on Vercel, REACT_APP_BACKEND_URL will be provided by Vercel.
  // For local development, it will fall back to the deployed backend URL or your local backend URL.
  // Ensure the environment variable in Vercel for the frontend project DOES NOT have a trailing slash.
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://admin-management-server.vercel.app"; 
  // If your local backend runs on port 5000 and you want to test locally with it, change the fallback:
  // const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";


  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams(location.search);
      const searchTerm = queryParams.get('search');
      const pageFromUrl = parseInt(queryParams.get('page')) || 1;

      if (pageFromUrl !== currentPage) {
          setCurrentPage(pageFromUrl);
          return;
      }

      // Construct URL without a trailing slash on backendUrl to avoid double slashes
      let url = `${backendUrl}/api/userReports?page=${pageFromUrl}&limit=${itemsPerPage}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      console.log("Fetching from URL:", url);

      const response = await fetch(url);

      if (!response.ok) {
        // Attempt to parse error response from backend for more details
        const errorData = await response.json().catch(() => ({ message: 'Unknown error or non-JSON response from server.' }));
        throw new Error(
          errorData.message || `Failed to fetch all user data. Status: ${response.status}`
        );
      }

      const result = await response.json();
      setAllUsers(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (err) {
      console.error("Error fetching all user data:", err);
      // More specific error message for network/CORS issues
      setError(err.message || "Could not load all user data. Check network and backend CORS configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.search, itemsPerPage, backendUrl, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const queryParams = new URLSearchParams(location.search);
      const searchTerm = queryParams.get('search');

      let newUrl = `/all-data?page=${newPage}&limit=${itemsPerPage}`;
      if (searchTerm) {
        newUrl += `&search=${encodeURIComponent(searchTerm)}`;
      }
      navigate(newUrl);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const response = await fetch(`${backendUrl}/api/userReports/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error or non-JSON response from server.' }));
        throw new Error(errorData.message || `Failed to delete user report. Status: ${response.status}`);
      }

      const result = await response.json();
      setDeleteSuccess(result.message || 'User report deleted successfully!');

      fetchData();

    } catch (err) {
      console.error("Deletion error:", err);
      setDeleteError(err.message || 'Could not delete user report. Check network and backend CORS configuration.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setUserToDelete(null);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const queryParams = new URLSearchParams(location.search);
  const currentSearchTerm = queryParams.get('search');

  if (loading && !deleteSuccess && !deleteError) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl text-gray-600">Loading all user data...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mt-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-extrabold text-center text-blue-800 mb-8">
        {currentSearchTerm ? `Search Results for "${currentSearchTerm}"` : "All Reports"} ({totalItems} total)
      </h1>

      {deleteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {deleteError}</span>
        </div>
      )}
      {deleteSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {deleteSuccess}</span>
        </div>
      )}

      {allUsers.length === 0 ? (
        <p className="text-center text-gray-700 text-lg">
          {currentSearchTerm ? `No results found for "${currentSearchTerm}".` : "No user reports found at the moment."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allUsers.map((user) => (
              <div
                key={user._id}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-300 transform hover:-translate-y-1 hover:scale-105"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {user.name}
                    </h2>
                    <div className="text-sm text-gray-600 mb-4 space-y-1">
                      <p className="flex items-center">
                        <span className="font-semibold w-24 flex-shrink-0">Status:</span>
                        <span
                          className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                            user.status === "suspended"
                              ? "bg-yellow-600 text-white"
                              : user.status === "banned"
                              ? "bg-red-600 text-white"
                              : "bg-blue-600 text-white"
                          } flex-grow min-w-0`}
                        >
                          {user.status}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="font-semibold w-24 flex-shrink-0">Phone:</span>
                        <a
                          href={`tel:${user.phone}`}
                          className="text-blue-600 hover:underline ml-2 flex-grow min-w-0"
                        >
                          {user.phone}
                        </a>
                      </p>
                      <p className="flex items-center">
                        <span className="font-semibold w-24 flex-shrink-0">Facebook:</span>
                        <a
                          href={user.facebookLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate ml-2 flex-grow min-w-0"
                        >
                          {user.facebookLink}
                        </a>
                      </p>
                      <p className="flex items-center mt-3">
                        <span className="font-semibold w-24 flex-shrink-0">Reported On:</span>
                        <span className="ml-2 text-gray-700 flex-grow min-w-0">
                          {user.timestamp
                            ? new Date(user.timestamp).toLocaleString()
                            : "N/A"}
                        </span>
                      </p>
                      {user.reporterName && (
                        <p className="flex items-center mt-3">
                          <span className="font-semibold w-24 flex-shrink-0">Reported By:</span>
                          <span className="ml-2 text-blue-700 font-bold flex-grow min-w-0">
                            {user.reporterName}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="font-semibold text-gray-800 mb-2">Reason:</p>
                      <p className="text-gray-700 leading-relaxed whitespace-normal break-words">
                        {user.reason}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 text-right mt-auto">
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-base font-medium text-white bg-gradient-to-r from-red-500 to-red-700 rounded-lg shadow-md hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-600"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              <span className="text-lg font-semibold text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showConfirmModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the report for "
              <span className="font-semibold">{userToDelete.name}</span>"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex items-center justify-center px-5 py-2.5 text-base font-medium text-white bg-gradient-to-r from-red-500 to-red-700 rounded-lg shadow-md hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-600"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllData;
