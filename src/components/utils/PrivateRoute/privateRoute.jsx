import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../Context/AuthContext'; // Corrected path

// MODIFIED: PrivateRoute now accepts a 'requiredRole' prop
const PrivateRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth(); // NEW: Destructure userRole

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Checking authentication...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  // 1. Check if user is logged in
  if (!currentUser) {
    // If not logged in, redirect to login page
    return <Navigate to="/register" replace />;
  }

  // 2. If user is logged in, check their role if a requiredRole is specified
  if (requiredRole) {
    // If requiredRole is 'admin', allow both 'admin' and 'superadmin'
    // If requiredRole is 'superadmin', only allow 'superadmin'
    const isAuthorized = (requiredRole === 'admin' && (userRole === 'admin' || userRole === 'superadmin')) ||
                         (requiredRole === 'superadmin' && userRole === 'superadmin');

    if (!isAuthorized) {
      // If user does not have the required role, display an access denied message
      // Note: For a real app, you might redirect to a generic "Access Denied" page
      // or the dashboard, but for now, we'll render a message directly.
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-red-300">
            <h3 className="text-3xl font-bold text-red-700 mb-4">Access Denied</h3>
            <p className="text-gray-700 text-lg mb-6">You do not have the necessary permissions to view this page.</p>
            <p className="text-gray-600 text-md">Please contact an administrator if you believe this is an error.</p>
          </div>
        </div>
      );
    }
  }

  // If authenticated and authorized, render the children (the protected component)
  return children;
};

export default PrivateRoute;
