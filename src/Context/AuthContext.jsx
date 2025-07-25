import { createContext, useContext, useEffect, useState } from 'react';
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
  const [idToken, setIdToken] = useState(null); // State to store the Firebase ID token

  // Function to fetch user profile from your MongoDB backend
  const fetchUserProfile = async (uid) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/users/${uid}`);
      const data = await response.json();
      if (!response.ok) {
        // If the server returns a 403 with a specific message, handle it
        if (response.status === 403 && data.message.includes('pending admin approval')) {
          // This is a valid state for a pending user, don't throw an error, just return the data
          return data;
        }
        // For other 4xx or 5xx errors, throw an error
        throw new Error(data.message || `Failed to fetch user profile from backend. Status: ${response.status}`);
      }
      return data; // Returns the user profile from MongoDB (including status and role)
    } catch (error) {
      console.error('AuthContext: Error fetching user profile:', error);
      throw error; // Re-throw to be caught by the calling component
    }
  };

  // Function to save user profile to your MongoDB backend (remains unchanged)
  const saveUserProfile = async (uid, profileData) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, ...profileData }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save user profile to backend.');
      }
      return data;
    } catch (error) {
      console.error('AuthContext: Error saving user profile to backend:', error);
      throw error;
    }
  };

  // Function to check user approval status and role (remains unchanged)
  const checkUserApproval = async (uid) => {
    try {
      const profile = await fetchUserProfile(uid);
      if (profile && profile.status === 'approved') {
        return { approved: true, status: 'approved', role: profile.role };
      } else if (profile) {
        return { approved: false, status: profile.status, role: profile.role };
      }
      return { approved: false, status: 'not_found', role: null };
    } catch (error) {
      console.error('AuthContext: Error checking user approval:', error);
      return { approved: false, status: 'error', role: null };
    }
  };

  // Function to get Firebase ID token
  const getIdToken = async (user, forceRefresh = false) => {
    if (user) {
      try {
        const token = await user.getIdToken(forceRefresh);
        // console.log("AuthContext: Token fetched:", token ? token.substring(0, 20) + '...' : 'null'); // Debug token fetch
        return token;
      } catch (error) {
        console.error("AuthContext: Error getting/refreshing Firebase ID token:", error);
        return null;
      }
    }
    return null;
  };

  // Effect to listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // Set the Firebase User object

      if (user) {
        let token = null;
        let profile = null;
        let role = null;

        try {
          // 1. Get ID Token first
          token = await getIdToken(user, true); // Force refresh to get latest claims
          setIdToken(token); // Update idToken state immediately
          if (token) {
            localStorage.setItem('adminToken', token); // Persist token
          } else {
            localStorage.removeItem('adminToken');
          }

          // 2. If token is available, fetch user profile
          if (token) {
            profile = await fetchUserProfile(user.uid);
            setUserProfile(profile); // Set the user's custom profile
            role = profile ? profile.role : null;
            setUserRole(role); // Set the user's role
          } else {
            // If no token, ensure profile and role are null
            setUserProfile(null);
            setUserRole(null);
          }

        } catch (profileError) {
          console.error("AuthContext: Error fetching user profile or processing token:", profileError);
          // If any error during profile fetch, clear related states
          setUserProfile(null);
          setUserRole(null);
          setIdToken(null);
          localStorage.removeItem('adminToken');
        } finally {
          // Set loading to false ONLY after all asynchronous operations are attempted
          // This ensures children components don't render until all auth data is processed.
          setLoading(false);
        }
      } else {
        // If no user, clear all states and set loading to false immediately
        setUserProfile(null);
        setUserRole(null);
        setIdToken(null);
        localStorage.removeItem('adminToken');
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Run only once on component mount

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      // States will be cleared by onAuthStateChanged listener
    } catch (error) {
      console.error("AuthContext: Error logging out:", error);
      throw error;
    }
  };

  // Send Password Reset Email function (remains the same)
  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("AuthContext: Error sending password reset email:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    userRole,
    loading, // auth loading state
    idToken, // Expose the idToken state
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
