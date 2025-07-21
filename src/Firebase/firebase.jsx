// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Analytics is optional, not needed for auth/firestore
import { getAuth } from "firebase/auth"; // <--- IMPORTANT: Import getAuth for authentication
import { getFirestore } from "firebase/firestore"; // <--- IMPORTANT: Import getFirestore for database

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0zMYviN_c2YaIxfFPzoVwiJS2BdEvVI8",
  authDomain: "admin-management-644af.firebaseapp.com",
  projectId: "admin-management-644af",
  storageBucket: "admin-management-644af.firebasestorage.app",
  messagingSenderId: "803432967851",
  appId: "1:803432967851:web:fd02a105e1bb9f299fd1ee",
  measurementId: "G-6BS9V8TVQC" // Keep if you need analytics
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app); // Get the authentication instance
const db = getFirestore(app); // Get the Firestore database instance

// Export auth and db so you can use them throughout your application
export { auth, db };

// If you still want analytics, you can keep this line, but it's not essential for auth/firestore
// const analytics = getAnalytics(app);
