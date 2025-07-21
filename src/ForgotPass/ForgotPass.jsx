import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '.././Context/AuthContext'; // Import useAuth

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { sendPasswordReset } = useAuth(); // Get sendPasswordReset from useAuth

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await sendPasswordReset(email);
      setMessage('Password reset email sent! Check your inbox (and spam folder).');
    } catch (err) {
      console.error("Forgot password error:", err.message);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No user found with that email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 md:p-10 border border-purple-200 transform transition-all duration-300 hover:shadow-xl hover:scale-[1.005]">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-purple-700 mb-8 drop-shadow-lg">
          Forgot Password
        </h2>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6 shadow-md" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> {message}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 shadow-md" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-lg font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-sm outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="inline-flex items-center justify-center w-full px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl shadow-lg hover:from-purple-700 hover:to-purple-900 focus:outline-none focus:ring-3 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Reset Password
                </>
              )}
            </button>
          </div>
        </form>

        {/* Back to Login Link */}
        <p className="mt-8 text-center text-gray-700">
          Remember your password?{' '}
          <Link to="/login" className="text-purple-600 hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
