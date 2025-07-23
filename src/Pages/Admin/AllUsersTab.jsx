// src/pages/admin/AllUsersTab.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { SERVER_URL } from '../../utils/api';
import ConfirmationModal from '../../components/utils/common/ConfirmationModal'; // Import the modal

const AllUsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userRole, getIdToken, currentUser } = useAuth();

    // State for the confirmation modal
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState(null);

    // Function to fetch only APPROVED, REGULAR users from the backend
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const idToken = await getIdToken();
            if (!idToken) {
                setError("Authentication token missing. Please log in.");
                setLoading(false);
                return;
            }

            const response = await axios.get(`${SERVER_URL}/api/users`, {
                headers: { Authorization: `Bearer ${idToken}` }
            });

            // MODIFIED FILTER: Only show users with 'approved' status AND 'user' role
            setUsers(response.data.data.filter(u => u.status === 'approved' && u.role === 'user'));
        } catch (err) {
            console.error("Error fetching approved users:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Failed to load approved users.");
        } finally {
            setLoading(false);
        }
    };

    // Generic handler to open the confirmation modal
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
            // No 'approve', 'reject', 'setPending' cases here as they are for PendingUsersTab
            default:
                return;
        }
        setModalConfig(config);
        setShowModal(true);
    };

    // Handler for confirmed actions from the modal
    const handleActionConfirm = async (uid, actionType) => {
        setShowModal(false); // Close modal immediately
        try {
            const idToken = await getIdToken();
            if (!idToken) throw new Error("Authentication token missing.");

            // Prevent an admin from deleting their own account (safety measure)
            if (actionType === 'delete' && uid === currentUser.uid) {
                alert("You cannot delete your own account from here.");
                return;
            }

            if (actionType === 'delete') {
                // Call the DELETE endpoint
                await axios.delete(`${SERVER_URL}/api/users/${uid}`, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                alert(`User ${users.find(u => u.uid === uid)?.email} permanently deleted successfully.`);
            } else if (actionType === 'promote') {
                // Call the PATCH /role endpoint
                await axios.patch(`${SERVER_URL}/api/users/${uid}/role`, { role: 'admin' }, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                alert(`User promoted to 'admin' successfully.`);
            }
            fetchUsers(); // Refresh the list after successful update
        } catch (err) {
            console.error(`Error performing action (${actionType}) for user ${uid}:`, err.response?.data?.message || err.message);
            alert(`Failed to perform action: ${err.response?.data?.message || err.message}`);
        }
    };

    useEffect(() => {
        if (userRole === 'admin' || userRole === 'superadmin') {
            fetchUsers();
        } else if (userRole !== null) {
            setError("You do not have permission to view this page.");
            setLoading(false);
        }
    }, [userRole]);

    if (loading) return <div className="text-center py-10 text-gray-700">Loading users...</div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

    if (userRole !== 'admin' && userRole !== 'superadmin') {
        return <div className="text-center py-10 text-red-600">Access Denied: You must be an administrator to view this page.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow-inner border border-blue-100">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4 sm:mb-0">Approved Regular Users</h2>
                <button
                    onClick={fetchUsers} // Call fetchUsers to refresh
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-base"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5m0 0h5m-5 0l-1 1m1 1v5m0 0h5m-5 0l1 1m-1-1h-5m5-5v-5m0 0h-5m5 0l1-1m-1-1v-5m0 0h-5m5 0l-1 1m1 1h5m-5-5v-5m0 0h-5m5 0l1-1m-1-1v-5m0 0h-5m5 0l-1 1"></path></svg>
                    Refresh List
                </button>
            </div>
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
                                        <div className="flex flex-wrap gap-2"> {/* Use flex-wrap for responsiveness */}
                                            {/* Only Promote and Delete actions for approved regular users */}
                                            {(user.role === 'user' && (userRole === 'admin' || userRole === 'superadmin')) && (
                                                <button
                                                    onClick={() => openConfirmationModal('promote', user)}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded-md text-xs shadow-sm transition duration-150 ease-in-out transform hover:scale-105"
                                                >
                                                    Make Admin
                                                </button>
                                            )}
                                            
                                            {(user.uid !== currentUser.uid) && (
                                                <button
                                                    onClick={() => openConfirmationModal('delete', user)}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1.5 px-3 rounded-md text-xs shadow-sm transition duration-150 ease-in-out transform hover:scale-105"
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

            {/* Render the Confirmation Modal if showModal is true */}
            {showModal && modalConfig && (
                <ConfirmationModal {...modalConfig} />
            )}
        </div>
    );
};

export default AllUsersTab;
