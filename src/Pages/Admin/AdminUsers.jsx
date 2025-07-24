// src/pages/admin/AdminUsers.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Ensure useNavigate is imported
import { useAuth } from '../../Context/AuthContext'; // Corrected path to contexts
import AllUsersTab from './AllUsersTab';
import AllAdminsTab from './AllAdminsTab';
import PendingUsersTab from './PendingUsersTab';

const AdminUsers = () => {
    const [activeTab, setActiveTab] = useState('pendingUsers'); // Default to pending users for immediate action
    const { userRole, loading } = useAuth();
    const navigate = useNavigate(); // Initialize useNavigate hook

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center text-gray-700 text-lg">Loading admin panel...</div>
        </div>;
    }

    if (userRole !== 'admin' && userRole !== 'superadmin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-red-300">
                    <h3 className="text-3xl font-bold text-red-700 mb-4">Access Denied</h3>
                    <p className="text-gray-700 text-lg mb-6">You do not have sufficient privileges to view this page.</p>
                    <p className="text-gray-600 text-md">Please log in with an administrator account.</p>
                </div>
            </div>
        );
    }

    const handleTrashReportsClick = () => {
        navigate('/trash-reports');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-8 drop-shadow-lg">
                Admin Panel
            </h1>

            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8 border border-blue-200">
                {/* Tab Navigation Buttons - MODIFIED */}
                <div className="flex flex-wrap justify-center sm:justify-start border-b border-gray-200 mb-6">
                    <button
                        className={`flex-1 sm:flex-none py-3 px-4 sm:px-6 text-base sm:text-lg font-semibold transition-all duration-200 rounded-t-lg ${
                            activeTab === 'pendingUsers'
                                ? 'border-b-4 border-orange-500 text-orange-700 bg-orange-50'
                                : 'text-gray-500 hover:text-orange-500 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTab('pendingUsers')}
                    >
                        Pending Users
                    </button>
                    <button
                        className={`flex-1 sm:flex-none py-3 px-4 sm:px-6 text-base sm:text-lg font-semibold transition-all duration-200 rounded-t-lg ${
                            activeTab === 'allUsers'
                                ? 'border-b-4 border-blue-500 text-blue-700 bg-blue-50'
                                : 'text-gray-500 hover:text-blue-500 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTab('allUsers')}
                    >
                        Approved Users
                    </button>
                    <button
                        className={`flex-1 sm:flex-none py-3 px-4 sm:px-6 text-base sm:text-lg font-semibold transition-all duration-200 rounded-t-lg ${
                            activeTab === 'allAdmins'
                                ? 'border-b-4 border-purple-500 text-purple-700 bg-purple-50'
                                : 'text-gray-500 hover:text-purple-500 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTab('allAdmins')}
                    >
                        All Admins
                    </button>

                    {/* NEW: Trash Reports Button (Admin/Superadmin only) */}
                    {(userRole === 'admin' || userRole === 'superadmin') && (
                        <button
                            className={`flex-1 sm:flex-none py-3 px-4 sm:px-6 text-base sm:text-lg font-semibold transition-all duration-200 rounded-t-lg ${
                                location.pathname === '/trash-reports' // Highlight if on trash reports page
                                    ? 'border-b-4 border-red-500 text-red-700 bg-red-50'
                                    : 'text-gray-500 hover:text-red-500 hover:bg-gray-50'
                            }`}
                            onClick={handleTrashReportsClick}
                        >
                            Trash Reports
                        </button>
                    )}
                </div>

                {/* Conditional Rendering of Tabs */}
                {activeTab === 'pendingUsers' && <PendingUsersTab />}
                {activeTab === 'allUsers' && <AllUsersTab />}
                {activeTab === 'allAdmins' && <AllAdminsTab />}
                {/* Note: TrashReportsPage is a full page, not a tab within AdminUsers.
                     Navigation handles going to it. */}
            </div>
        </div>
    );
};

export default AdminUsers;
