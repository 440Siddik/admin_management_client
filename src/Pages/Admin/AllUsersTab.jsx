// src/pages/admin/AllUsersTab.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext'; // Corrected path to contexts
import { SERVER_URL } from '../../utils/api';
import ConfirmationModal from '../../components/utils/common/ConfirmationModal';

const AllUsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(24);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();

    // Get authentication states from AuthContext
    const { idToken, userRole, loading: authLoading, currentUser } = useAuth();

    const backendUrl = SERVER_URL || "https://admin-management-server.vercel.app";

    // Function to fetch only APPROVED, REGULAR users from the backend
    const fetchUsers = async () => {
        if (authLoading) {
            setLoading(false);
            return;
        }
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            setError("Access Denied: You do not have permission to view this user list.");
            setLoading(false);
            return;
        }
        if (!idToken) {
            setError("Authentication token missing. Please log in as an admin.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setActionMessage(null);

        try {
            const queryParams = new URLSearchParams(location.search);
            const pageFromUrl = parseInt(queryParams.get('page')) || 1;

            if (pageFromUrl !== currentPage) {
                setCurrentPage(pageFromUrl);
                return;
            }

            // MODIFIED: Fetch users with status 'approved' and role 'user' directly from the backend
            // The backend's fetchPaginatedData now handles 'status' and 'role' query parameters.
            const url = `${backendUrl}/api/users?status=approved&role=user&page=${pageFromUrl}&limit=${itemsPerPage}`;
            
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${idToken}` }
            });

            setUsers(response.data.data); // No client-side filter needed anymore
            setTotalItems(response.data.totalItems); // These totals are now for the filtered data
            setTotalPages(response.data.totalPages);

        } catch (err) {
            console.error("Error fetching approved users:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Failed to load approved users.");
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            navigate(`${location.pathname}?page=${newPage}&limit=${itemsPerPage}`);
        }
    };

    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState(null);

    const openConfirmationModal = (action, user) => {
        let config = {};
        switch (action) {
            case 'promote':
                config = {
                    title: 'Promote to Admin?',
                    message: `Are you sure you want to promote ${user.email} to an administrator role? They will gain access to the admin panel.`,
                    confirmButtonText: 'Yes, Promote',
                    confirmButtonClass: 'bg-purple-600 hover:bg-purple-700',
                    onConfirm: () => handleActionConfirm(user.uid, 'promote'),
                    onCancel: () => setShowModal(false),
                    icon: <svg className="mx-auto h-16 w-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                };
                break;
            case 'delete':
                config = {
                    title: 'Delete User Permanently?',
                    message: `Are you sure you want to permanently delete ${user.email}'s account? This action is irreversible and will remove them from the system.`,
                    confirmButtonText: 'Yes, Delete',
                    confirmButtonClass: 'bg-gray-600 hover:bg-gray-700',
                    onConfirm: () => handleActionConfirm(user.uid, 'delete'),
                    onCancel: () => setShowModal(false),
                    icon: <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                };
                break;
            default:
                return;
        }
        setModalConfig(config);
        setShowModal(true);
    };

    const handleActionConfirm = async (uid, actionType) => {
        setShowModal(false);
        setLoading(true);
        setActionMessage(null);

        try {
            if (actionType === 'delete' && uid === currentUser.uid) {
                setActionMessage({ type: 'error', message: "You cannot delete your own account from here." });
                setLoading(false);
                return;
            }

            if (actionType === 'delete') {
                await axios.delete(`${backendUrl}/api/users/${uid}`, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                setActionMessage({ type: 'success', message: `User ${users.find(u => u.uid === uid)?.email} permanently deleted successfully.` });
            } else if (actionType === 'promote') {
                await axios.patch(`${backendUrl}/api/users/${uid}/role`, { role: 'admin' }, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                setActionMessage({ type: 'success', message: `User promoted to 'admin' successfully.` });
            }
            fetchUsers();
        } catch (err) {
            console.error(`Error performing action (${actionType}) for user ${uid}:`, err.response?.data?.message || err.message);
            setActionMessage({ type: 'error', message: `Failed to perform action: ${err.response?.data?.message || err.message}` });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && (userRole === 'admin' || userRole === 'superadmin')) {
            fetchUsers();
        } else if (!authLoading && userRole !== null) {
            setError("You do not have permission to view this page.");
            setLoading(false);
        }
    }, [userRole, idToken, authLoading, currentPage, itemsPerPage, location.search]);

    const overallLoading = loading || authLoading;

    if (overallLoading) return <div className="text-center py-10 text-gray-700">Loading users...</div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

    if (userRole !== 'admin' && userRole !== 'superadmin') {
        return <div className="text-center py-10 text-red-600">Access Denied: You must be an administrator to view this page.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow-inner border border-blue-100">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4 sm:mb-0">Approved Regular Users ({totalItems} total)</h2>
                <button
                    onClick={fetchUsers}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-base"
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

            {users.length === 0 ? (
                <p className="text-gray-600 text-center py-8 text-lg bg-white rounded-lg shadow-md">No approved regular users found.</p>
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
                            {users.map((user) => (
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
                                            {(user.role === 'user' && (userRole === 'admin' || userRole === 'superadmin')) && (
                                                <button
                                                    onClick={() => openConfirmationModal('promote', user)}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded-md text-xs shadow-sm transition duration-150 ease-in-out transform hover:scale-105"
                                                    disabled={overallLoading}
                                                >
                                                    Make Admin
                                                </button>
                                            )}
                                            
                                            {((userRole === 'admin' || userRole === 'superadmin') && user.uid !== currentUser?.uid) && (
                                                <button
                                                    onClick={() => openConfirmationModal('delete', user)}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1.5 px-3 rounded-md text-xs shadow-sm transition duration-150 ease-in-out transform hover:scale-105"
                                                    disabled={overallLoading}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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

            {showModal && modalConfig && (
                <ConfirmationModal {...modalConfig} />
            )}
        </div>
    );
};

export default AllUsersTab;
