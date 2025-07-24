// src/pages/admin/PendingUsersTab.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom'; // Import for pagination
import { useAuth } from '../../Context/AuthContext'; // Corrected path to contexts
import { SERVER_URL } from '../../utils/api';
import ConfirmationModal from '../../components/utils/common/ConfirmationModal'; // Import the modal

const PendingUsersTab = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true); // Local loading state for this component's data fetch
    const [error, setError] = useState(null); // Local error state
    const [actionMessage, setActionMessage] = useState(null); // For success/error messages after actions

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(24); // Consistent pagination limit
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();

    // Get authentication states from AuthContext
    const { idToken, userRole, loading: authLoading, currentUser } = useAuth();

    const backendUrl = SERVER_URL || "https://admin-management-server.vercel.app";

    // Function to fetch only pending users from the backend
    const fetchPendingUsers = async () => {
        // CRITICAL: Wait for authentication to finish loading
        // and ensure the user has the required role before attempting to fetch.
        if (authLoading) {
            setLoading(false); // Set local loading to false if auth is still loading
            return;
        }
        // Client-side access control: If not admin/superadmin, set error and stop.
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            setError("Access Denied: You do not have permission to view this user list.");
            setLoading(false);
            return;
        }
        // If no token (shouldn't happen if requiredRole="admin" in PrivateRoute works, but good safeguard)
        if (!idToken) {
            setError("Authentication token missing. Please log in as an admin.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setActionMessage(null); // Clear previous action messages

        try {
            const queryParams = new URLSearchParams(location.search);
            const pageFromUrl = parseInt(queryParams.get('page')) || 1;

            if (pageFromUrl !== currentPage) {
                setCurrentPage(pageFromUrl);
                return; // Return here, useEffect will re-run with the updated currentPage
            }

            // Fetch users with status 'pending' directly from the backend for efficiency
            const response = await axios.get(`${backendUrl}/api/users?status=pending&page=${pageFromUrl}&limit=${itemsPerPage}`, {
                headers: { Authorization: `Bearer ${idToken}` }
            });

            setPendingUsers(response.data.data); // Backend should already filter by status=pending
            setTotalItems(response.data.totalItems);
            setTotalPages(response.data.totalPages);

        } catch (err) {
            console.error("Error fetching pending users:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Failed to load pending users.");
        } finally {
            setLoading(false);
        }
    };

    // Pagination handler
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            // Ensure navigation preserves other query params if any, though not currently used here
            navigate(`${location.pathname}?page=${newPage}&limit=${itemsPerPage}`);
        }
    };

    // State for the confirmation modal (moved here, as it's specific to this component's actions)
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState(null);

    // Generic handler to open the confirmation modal
    const openConfirmationModal = (action, user) => {
        let config = {};
        switch (action) {
            case 'approve':
                config = {
                    title: 'Approve User?',
                    message: `Are you sure you want to approve ${user.email}'s account? They will be able to log in.`,
                    confirmButtonText: 'Yes, Approve',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700',
                    onConfirm: () => handleActionConfirm(user.uid, 'approved'), // 'approved' is the new status
                    onCancel: () => setShowModal(false),
                    icon: <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                };
                break;
            case 'reject':
                config = {
                    title: 'Reject & Delete User?',
                    message: `Are you sure you want to reject and permanently remove ${user.email}'s account? This action is irreversible.`,
                    confirmButtonText: 'Yes, Delete',
                    confirmButtonClass: 'bg-red-600 hover:bg-red-700',
                    onConfirm: () => handleActionConfirm(user.uid, 'reject'), // 'reject' implies deletion
                    onCancel: () => setShowModal(false),
                    icon: <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2A9 9 0 111 12a9 9 0 0118 0z"></path></svg>
                };
                break;
            // The 'promote' case is not relevant here as pending users should not be promoted directly
            default:
                return;
        }
        setModalConfig(config);
        setShowModal(true);
    };

    // Handler for confirmed actions from the modal
    const handleActionConfirm = async (uid, actionType) => {
        setShowModal(false); // Close modal immediately
        setLoading(true); // Indicate action is in progress
        setActionMessage(null); // Clear previous messages

        try {
            // Prevent an admin from deleting themselves (safety measure)
            if ((actionType === 'reject') && uid === currentUser.uid) {
                setActionMessage({ type: 'error', message: "You cannot delete your own account from here." });
                setLoading(false);
                return;
            }

            if (actionType === 'reject') {
                // For 'reject', call the DELETE endpoint
                await axios.delete(`${backendUrl}/api/users/${uid}`, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                setActionMessage({ type: 'success', message: `User ${pendingUsers.find(u => u.uid === uid)?.email} rejected and deleted successfully.` });
            } else if (actionType === 'approved') { // Changed 'promote' to 'approved' for clarity
                // For 'approved', call the PATCH /status endpoint
                await axios.patch(`${backendUrl}/api/users/${uid}/status`, { status: actionType }, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                setActionMessage({ type: 'success', message: `User status updated to ${actionType}.` });
            }
            fetchPendingUsers(); // Refresh the list after successful update
        } catch (err) {
            console.error(`Error performing action (${actionType}) for user ${uid}:`, err.response?.data?.message || err.message);
            setActionMessage({ type: 'error', message: `Failed to perform action: ${err.response?.data?.message || err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if authentication state has resolved and user has appropriate role
        if (!authLoading && (userRole === 'admin' || userRole === 'superadmin')) {
            fetchPendingUsers();
        } else if (!authLoading && userRole !== null) { // Auth loaded, but not admin
            setError("You do not have permission to view this page.");
            setLoading(false);
        }
    }, [userRole, idToken, authLoading, currentPage, itemsPerPage, location.search]); // Added dependencies for re-fetch

    // Combined loading state for initial load and actions
    const overallLoading = loading || authLoading;

    if (overallLoading) return <div className="text-center py-10 text-gray-700">Loading pending users...</div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

    // This check is redundant if PrivateRoute works, but harmless.
    if (userRole !== 'admin' && userRole !== 'superadmin') {
        return <div className="text-center py-10 text-red-600">Access Denied: You must be an administrator to view this page.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg shadow-inner border border-orange-100">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4 sm:mb-0">Pending Users ({totalItems} total)</h2>
                <button
                    onClick={fetchPendingUsers}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-base"
                    disabled={overallLoading}
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5m0 0h5m-5 0l-1 1m1 1v5m0 0h5m-5 0l1 1m-1-1h-5m5-5v-5m0 0h-5m5 0l1-1m-1-1v-5m0 0h-5m5 0l-1 1m1 1h5m-5-5v-5m0 0h-5m5 0l1-1m-1-1v-5m0 0h-5m5 0l-1 1"></path></svg>
                    Refresh List
                </button>
            </div>

            {actionMessage && (
                <div className={`bg-${actionMessage.type === 'success' ? 'green' : 'red'}-100 border border-${actionMessage.type === 'success' ? 'green' : 'red'}-400 text-${actionMessage.type === 'success' ? 'green' : 'red'}-700 px-4 py-3 rounded relative mb-4`} role="alert">
                    <strong className="font-bold">{actionMessage.type === 'success' ? 'Success!' : 'Error!'}</strong>
                    <span className="block sm:inline"> {actionMessage.message}</span>
                </div>
            )}

            {pendingUsers.length === 0 ? (
                <p className="text-gray-600 text-center py-8 text-lg bg-white rounded-lg shadow-md">No pending user registrations found.</p>
            ) : (
                <div className="overflow-x-auto bg-white shadow-xl rounded-lg border border-gray-100">
                    <table className="min-w-full leading-normal table-auto">
                        <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                                <th className="px-5 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Facebook Name</th>
                                <th className="px-5 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                                <th className="px-5 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingUsers.map((user) => (
                                <tr key={user.uid} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150 ease-in-out">
                                    <td className="px-5 py-4 text-sm text-gray-900">{user.email}</td>
                                    <td className="px-5 py-4 text-sm text-gray-900">{user.fbName}</td>
                                    <td className="px-5 py-4 text-sm">
                                        <span className={`inline-block px-3 py-1 font-semibold text-xs rounded-full shadow-sm ${
                                            user.status === 'approved' ? 'text-green-800 bg-green-100' :
                                            user.status === 'pending' ? 'text-yellow-800 bg-yellow-100' :
                                            'text-red-800 bg-red-100'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        <span className={`inline-block px-3 py-1 font-semibold text-xs rounded-full shadow-sm ${
                                            user.role === 'admin' ? 'text-purple-800 bg-purple-100' :
                                            user.role === 'superadmin' ? 'text-blue-800 bg-blue-100' :
                                            'text-gray-800 bg-gray-100'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                                        <div className="flex flex-wrap gap-2">
                                            {/* Approve and Reject are the primary actions for pending users */}
                                            <button
                                                onClick={() => openConfirmationModal('approve', user)}
                                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-3 rounded-md text-xs shadow-sm transition duration-150 ease-in-out transform hover:scale-105"
                                                disabled={overallLoading} // Disable during loading
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => openConfirmationModal('reject', user)}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-md text-xs shadow-sm transition duration-150 ease-in-out transform hover:scale-105"
                                                disabled={overallLoading} // Disable during loading
                                            >
                                                Reject
                                            </button>
                                            
                                            {/* "Make Admin" button is intentionally hidden here as pending users should first be approved */}
                                            {/* and then promoted from the AllUsersTab if needed. */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || overallLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        Previous
                    </button>
                    <span className="text-lg font-semibold text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || overallLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Render the Confirmation Modal if showModal is true */}
            {showModal && modalConfig && (
                <ConfirmationModal {...modalConfig} />
            )}
        </div>
    );
};

export default PendingUsersTab;
