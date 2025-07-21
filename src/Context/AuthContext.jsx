import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../Firebase/firebase'; // Import auth and db from your firebase.js
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth'; // NEW: Import signOut and sendPasswordResetEmail
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Firestore operations

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase User object
  const [userProfile, setUserProfile] = useState(null); // Custom user profile (e.g., fbName)
  const [loading, setLoading] = useState(true); // Loading state for initial auth check

  // Effect to listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // Set the Firebase User object
      if (user) {
        // If a user is logged in, try to fetch their profile from Firestore
        const userProfileRef = doc(db, 'userProfiles', user.uid);
        try {
          const docSnap = await getDoc(userProfileRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data()); // Set the user's custom profile (e.g., { fbName: "..." })
          } else {
            console.warn("No user profile found for UID:", user.uid, ". Attempting to create a default profile.");
            // If profile doesn't exist (e.g., new user from another auth method), create a basic one
            const defaultProfile = { fbName: user.email ? user.email.split('@')[0] : 'Unknown User', email: user.email || '' };
            await setDoc(userProfileRef, defaultProfile, { merge: true });
            setUserProfile(defaultProfile);
          }
        } catch (profileError) {
          console.error("Error fetching or creating user profile:", profileError);
          setUserProfile(null); // Ensure profile is null on error
        }
      } else {
        // No user logged in
        setUserProfile(null);
      }
      setLoading(false); // Auth state check is complete
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Run only once on component mount

  // Function to save user profile to Firestore (e.g., after registration)
  const saveUserProfile = async (uid, profileData) => {
    const userProfileRef = doc(db, 'userProfiles', uid);
    try {
      await setDoc(userProfileRef, profileData, { merge: true }); // Use merge to avoid overwriting other fields
      setUserProfile(profileData); // Update local state immediately
      console.log("User profile saved to Firestore:", profileData);
    } catch (error) {
      console.error("Error saving user profile:", error);
      throw error; // Re-throw to be caught by calling component
    }
  };

  // NEW: Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged listener will handle clearing currentUser and userProfile
      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Error logging out:", error);
      throw error; // Re-throw to be caught by calling component
    }
  };

  // NEW: Send Password Reset Email function
  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent to:", email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error; // Re-throw to be caught by calling component
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    auth, // Expose the auth object for direct Firebase operations (login, register, logout)
    db,   // Expose the db object for direct Firestore operations
    saveUserProfile, // Expose the function to save user profile
    logout, // NEW: Expose logout function
    sendPasswordReset // NEW: Expose sendPasswordReset function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Render children only after initial auth check */}
    </AuthContext.Provider>
  );
};
