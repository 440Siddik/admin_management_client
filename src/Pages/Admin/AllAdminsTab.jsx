// src/pages/admin/AllAdminsTab.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { SERVER_URL } from '../../utils/api';
import ConfirmationModal from '../../components/utils/common/ConfirmationModal'; // Import the modal

const AllAdminsTab = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userRole, getIdToken, currentUser } = useAuth();

    // State for the confirmation modal
    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState(null); // Stores details for the current modal action

    // Function to fetch all admins from the backend
    const fetchAdmins = async () => {
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
            // Filter to show only 'admin' and 'superadmin' roles
            setAdmins(response.data.data.filter(u => u.role === 'admin' || u.role === 'superadmin'));
        } catch (err) {
            console.error("Error fetching admins:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Failed to load administrators.");
        } finally {
            setLoading(false);
        }
    };

    // Generic handler to open the confirmation modal for role changes or deletion
    const openConfirmationModal = (action, adminUser, newRole = null) => {
        let config = {};
        switch (action) {
            case 'demote':
                config = {
                    title: 'Demote Administrator?',
                    message: `Are you sure you want to demote ${adminUser.email} to a regular user role? They will lose admin panel access.`,
                    confirmButtonText: 'Yes, Demote',
                    confirmButtonClass: 'bg-orange-600 hover:bg-orange-700 text-white', // Orange for demotion
                    onConfirm: () => handleActionConfirm(adminUser.uid, 'demote', newRole),
                    onCancel: () => setShowModal(false),
                    icon: <svg className="mx-auto h-16 w-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg> // Down arrow icon
                };
                break;
            case 'changeRole': // For changing to 'admin' or 'superadmin'
                config = {
                    title: `Change Role to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}?`,
                    message: `Are you sure you want to change ${adminUser.email}'s role to '${newRole}'?`,
                    confirmButtonText: 'Confirm Change',
                    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
                    onConfirm: () => handleActionConfirm(adminUser.uid, 'changeRole', newRole),
                    onCancel: () => setShowModal(false),
                    icon: <svg className="mx-auto h-16 w-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2"></path></svg>
                };
                break;
            case 'delete':
                config = {
                    title: 'Delete Administrator Permanently?',
                    message: `Are you sure you want to permanently delete ${adminUser.email}'s account? This action is irreversible and will remove them from the system.`,
                    confirmButtonText: 'Yes, Delete',
                    confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
                    onConfirm: () => handleActionConfirm(adminUser.uid, 'delete'),
                    onCancel: () => setShowModal(false),
                    icon: <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                };
                break;
            default:
                return;
        }
        setModalConfig(config);
        setShowModal(true);
    };

    // Handler for confirmed actions from the modal
    const handleActionConfirm = async (uid, actionType, newRole = null) => {
        setShowModal(false); // Close modal immediately
        try {
            const idToken = await getIdToken();
            if (!idToken) throw new Error("Authentication token missing.");

            // Prevent an admin from deleting or demoting themselves
            if ((actionType === 'delete' || actionType === 'demote' || (actionType === 'changeRole' && newRole === 'user')) && uid === currentUser.uid) {
                alert("You cannot perform this action on your own account.");
                return;
            }

            // Get the target admin's profile to check their role before deletion/demotion
            const targetAdmin = admins.find(a => a.uid === uid);
            if (targetAdmin) {
                // Prevent 'admin' from deleting other 'admin' or 'superadmin' roles
                if (userRole === 'admin' && (targetAdmin.role === 'admin' || targetAdmin.role === 'superadmin') && actionType === 'delete') {
                    alert("You cannot delete other administrators if you are not a superadmin.");
                    return;
                }
                // Prevent 'admin' from changing other 'admin' or 'superadmin' roles
                if (userRole === 'admin' && (targetAdmin.role === 'admin' || targetAdmin.role === 'superadmin') && actionType === 'changeRole') {
                    alert("You cannot change the role of other administrators if you are not a superadmin.");
                    return;
                }
            }


            if (actionType === 'delete') {
                await axios.delete(`${SERVER_URL}/api/users/${uid}`, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                alert(`Administrator ${admins.find(a => a.uid === uid)?.email} permanently deleted successfully.`);
            } else if (actionType === 'demote' || actionType === 'changeRole') {
                await axios.patch(`${SERVER_URL}/api/users/${uid}/role`, { role: newRole || 'user' }, { // Default to 'user' for demote
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                alert(`Administrator role updated to '${newRole || 'user'}' successfully.`);
            }
            fetchAdmins(); // Refresh the list after successful update
        } catch (err) {
            console.error(`Error performing action (${actionType}) for admin ${uid}:`, err.response?.data?.message || err.message);
            alert(`Failed to perform action: ${err.response?.data?.message || err.message}`);
        }
    };


    useEffect(() => {
        if (userRole === 'admin' || userRole === 'superadmin') {
            fetchAdmins();
        } else if (userRole !== null) {
            setError("You do not have permission to view this page.");
            setLoading(false);
        }
    }, [userRole]);

    if (loading) return <div className="text-center py-10 text-gray-700">Loading administrators...</div>;
    if (error) return <div className="text-center py-10 text-red-600">{error}</div>;

    if (userRole !== 'admin' && userRole !== 'superadmin') {
        return <div className="text-center py-10 text-red-600">Access Denied: You must be an administrator to view this page.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg shadow-inner border border-blue-100">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-4 sm:mb-0">All Administrators</h2>
                <button
                    onClick={fetchAdmins}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-base"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5m0 0h5m-5 0l-1 1m1 1v5m0 0h5m-5 0l1 1m-1-1h-5m5-5v-5m0 0h-5m5 0l1-1m-1-1v-5m0 0h-5m5 0l-1 1m1 1h5m-5-5v-5m0 0h-5m5 0l1-1m-1-1v-5m0 0h-5m5 0l-1 1"></path></svg>
                    Refresh List
                </button>
            </div>
            {admins.length === 0 ? (
                <p className="text-gray-600 text-center py-8 text-lg bg-white rounded-lg shadow-md">No administrators found.</p>
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
                            {admins.map((adminUser) => (
                                <tr key={adminUser.uid} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150 ease-in-out">
                                    <td className="px-5 py-4 text-sm text-gray-900">{adminUser.email}</td>
                                    <td className="px-5 py-4 text-sm text-gray-900">{adminUser.fbName}</td>
                                    <td className="px-5 py-4 text-sm">
                                        <span className={`inline-block px-3 py-1 font-semibold text-xs rounded-full shadow-sm ${
                                            adminUser.status === 'approved' ? 'text-green-800 bg-green-100' :
                                            adminUser.status === 'pending' ? 'text-yellow-800 bg-yellow-100' :
                                            'text-red-800 bg-red-100'
                                        }`}>
                                            {adminUser.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        <span className={`inline-block px-3 py-1 font-semibold text-xs rounded-full shadow-sm ${
                                            adminUser.role === 'admin' ? 'text-purple-800 bg-purple-100' :
                                            adminUser.role === 'superadmin' ? 'text-blue-800 bg-blue-100' :
                                            'text-gray-800 bg-gray-100'
                                        }`}>
                                            {adminUser.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                                        <div className="flex flex-wrap gap-2">
                                            {/* Role Change Dropdown (Only if current user is superadmin AND NOT editing self) */}
                                            {(userRole === 'superadmin' && adminUser.uid !== currentUser.uid) && (
                                                <select
                                                    value={adminUser.role}
                                                    onChange={(e) => {
                                                        // If demoting to 'user', open demote confirmation modal
                                                        if (e.target.value === 'user') {
                                                            openConfirmationModal('demote', adminUser, 'user');
                                                        } else {
                                                            // Otherwise, open general role change modal
                                                            openConfirmationModal('changeRole', adminUser, e.target.value);
                                                        }
                                                    }}
                                                    className="border border-gray-300 rounded-md py-1.5 px-2 text-xs shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="superadmin">Superadmin</option>
                                                </select>
                                            )}
                                            {/* Delete Admin Button (only if current user is superadmin AND NOT editing self) */}
                                            {(userRole === 'superadmin' && adminUser.uid !== currentUser.uid) && (
                                                <button
                                                    onClick={() => openConfirmationModal('delete', adminUser)}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1.5 px-3 rounded-md text-xs shadow-sm transition duration-150 ease-in-out transform hover:scale-105"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                            {/* If current user is 'admin' and not 'superadmin', they can't manage other admins */}
                                            {(userRole === 'admin' && adminUser.uid !== currentUser.uid) && (
                                                <span className="text-gray-500 text-xs px-2 py-1">Cannot manage other admins</span>
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

export default AllAdminsTab;
