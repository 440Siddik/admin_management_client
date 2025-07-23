import { createContext, useContext, useEffect, useState } from 'react';
// MODIFIED: Removed 'db' as Firestore is no longer used directly in AuthContext for user profiles
import { auth } from '../Firebase/firebase'; // Assuming this path is correct for your Firebase auth instance
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';

// Import your server URL utility
import { SERVER_URL } from '../utils/api'; // Adjust path if you put api.js in src/components/utils/api.js

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase User object
  const [userProfile, setUserProfile] = useState(null); // Custom user profile (e.g., fbName, status, role)
  const [userRole, setUserRole] = useState(null); // State to store the user's role from MongoDB
  const [loading, setLoading] = useState(true); // Keep loading true initially

  // Function to fetch user profile from your MongoDB backend
  const fetchUserProfile = async (uid) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/users/${uid}`);
      const data = await response.json();
      if (!response.ok) {
        // If 404, it means profile not found, which is fine, just return null
        if (response.status === 404) {
          return null;
        }
        throw new Error(data.message || 'Failed to fetch user profile from backend.');
      }
      return data; // Returns the user profile from MongoDB (including status and role)
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error; // Re-throw to be caught by the calling component
    }
  };

  // Function to save user profile to your MongoDB backend (instead of Firestore)
  const saveUserProfile = async (uid, profileData) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, ...profileData }), // Send uid, email, fbName
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save user profile to backend.');
      }
      console.log('User profile saved/updated in MongoDB:', data);
      // When a user registers, their profile is 'pending' and 'user' by default.
      // We don't immediately set userProfile/userRole here, as they're not approved yet.
      return data;
    } catch (error) {
      console.error('Error saving user profile to backend:', error);
      throw error;
    }
  };

  // Function to check user approval status and role
  const checkUserApproval = async (uid) => {
    try {
      const profile = await fetchUserProfile(uid);
      if (profile && profile.status === 'approved') {
        return { approved: true, status: 'approved', role: profile.role };
      } else if (profile) {
        // User profile found but not approved (or rejected)
        return { approved: false, status: profile.status, role: profile.role };
      }
      // User profile not found in MongoDB (shouldn't happen if registration worked)
      return { approved: false, status: 'not_found', role: null };
    } catch (error) {
      console.error('Error checking user approval:', error);
      return { approved: false, status: 'error', role: null };
    }
  };

  // Function to get Firebase ID token for authenticated requests to backend
  // This function is also used to force a token refresh by passing 'true'
  const getIdToken = async (forceRefresh = false) => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(forceRefresh);
        if (forceRefresh) {
            console.log("Firebase ID token refreshed.");
        }
        return token;
      } catch (error) {
        console.error("Error getting/refreshing Firebase ID token:", error);
        // If token refresh fails, it might indicate a serious auth issue, consider logging out
        await logout();
        return null;
      }
    }
    return null;
  };

  // MODIFIED: Effect to listen for Firebase Auth state changes - ensures loading is accurate
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // Set the Firebase User object
      if (user) {
        // If a user is logged in, try to fetch their profile from your MongoDB backend
        try {
          const profile = await fetchUserProfile(user.uid);
          setUserProfile(profile); // Set the user's custom profile
          setUserRole(profile ? profile.role : null); // Set the user's role

          // IMPORTANT: Force a token refresh here to ensure custom claims (like role)
          // are immediately available on the client-side for subsequent backend calls.
          // This addresses the "User role not found in custom claims" log.
          await getIdToken(true); // Call getIdToken with forceRefresh = true

        } catch (profileError) {
          console.error("Error fetching user profile from MongoDB:", profileError);
          setUserProfile(null);
          setUserRole(null);
        } finally {
          // This ensures loading is set to false ONLY after the profile fetch attempt completes
          setLoading(false);
        }
      } else {
        // If no user, clear states and set loading to false immediately
        setUserProfile(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Run only once on component mount

  // Logout function (remains the same)
  const logout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully.");
      // Clear states immediately on logout
      setCurrentUser(null);
      setUserProfile(null);
      setUserRole(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  // Send Password Reset Email function (remains the same)
  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent to:", email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    userRole,
    loading,
    auth, // Provide the auth instance
    saveUserProfile,
    fetchUserProfile,
    checkUserApproval,
    getIdToken, // Expose the getIdToken function (which can also refresh)
    logout,
    sendPasswordReset
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only when loading is false */}
      {!loading && children}
    </AuthContext.Provider>
  );
};