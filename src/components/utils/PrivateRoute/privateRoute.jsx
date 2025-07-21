import React from 'react';
import { Navigate } from 'react-router-dom';
// --- FIX: Corrected import path to go up three levels ---
import { useAuth } from '../../../Context/AuthContext'; // Corrected path

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

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

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
