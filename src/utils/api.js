// src/utils/api.js
// This file centralizes your backend server URL.
// IMPORTANT: You need to set VITE_SERVER_URL in your frontend's .env file (e.g., .env.local or .env)
// Example: VITE_SERVER_URL=https://admin-management-server.vercel.app (for local development)
// For Vercel deployment, this would be your deployed backend URL.
export const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'https://admin-management-server.vercel.app';
