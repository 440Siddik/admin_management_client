import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../Context/AuthContext"; // Corrected path to AuthContext

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fbName, setFbName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility: false = hidden, true = visible

  const { auth, saveUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password || !fbName) {
        throw new Error("All fields are required.");
      }
      if (password.length < 6) {
        throw new Error("Password should be at least 6 characters.");
      }

      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("Firebase user registered:", user);

      // 2. Save user profile to your MongoDB backend with initial 'pending' status
      await saveUserProfile(user.uid, { fbName: fbName, email: email });

      console.log("User profile saved to MongoDB with pending status.");
      setShowSuccessModal(true); // Show success modal
    } catch (err) {
      console.error("Registration error:", err.message);
      let errorMessage = "Failed to register. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please login or use a different email.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      } else if (err.message.includes("Failed to save user profile to backend")) {
        // Specific error for backend save failure
        errorMessage = "Account created, but failed to save profile for approval. Please contact support.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate("/login"); // Direct to login after successful registration (pending approval)
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 md:p-10 border border-purple-200 transform transition-all duration-300 hover:shadow-xl hover:scale-[1.005]">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-purple-700 mb-8 drop-shadow-lg">
          Register
        </h2>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 shadow-md"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FB Name Input */}
          <div>
            <label
              htmlFor="fbName"
              className="block text-lg font-semibold text-gray-700 mb-2"
            >
              Facebook Name
            </label>
            <input
              type="text"
              id="fbName"
              name="fbName"
              placeholder="Your Facebook display name"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-sm outline-none"
              value={fbName}
              onChange={(e) => setFbName(e.target.value)}
              required
            />
          </div>

          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-lg font-semibold text-gray-700 mb-2"
            >
              Email
            </label>
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

          {/* Password Input with Toggle - Corrected Icon Logic */}
          <div>
            <label
              htmlFor="password"
              className="block text-lg font-semibold text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // Correctly switches input type
                id="password"
                name="password"
                placeholder="Enter a strong password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-sm outline-none pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                // aria-label describes the *action* the button will perform
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {/* ICON LOGIC:
                    If showPassword is TRUE (password is visible), show the OPEN eye icon.
                    If showPassword is FALSE (password is hidden), show the SLASHED eye icon.
                */}
                {showPassword ? (
                  // Password is VISIBLE, so show the OPEN eye icon (click to hide)
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    ></path>
                  </svg>
                ) : (
                  // Password is HIDDEN, so show the SLASHED eye icon (click to show)
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.5 6.5m14.5 10a10.05 10.05 0 01-2.029 1.563m-5.858-.908a3 3 0 10-4.243-4.243M12 19c4.478 0 8.268-2.943 9.543-7a9.97 9.97 0 00-1.563-3.029m-5.858-.908l-4.242-4.242"
                    ></path>
                  </svg>
                )}
              </button>
            </div>
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
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registering...
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    ></path>
                  </svg>
                  Register
                </>
              )}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <p className="mt-8 text-center text-gray-700">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-purple-600 hover:underline font-semibold"
          >
            Login here
          </Link>
        </p>
      </div>

      {/* Success Modal - MODIFIED MESSAGE */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all duration-300 scale-100 opacity-100">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Registration Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              Your account has been created and is awaiting admin approval. You will be able to log in once your account is approved.
            </p>
            <button
              onClick={handleModalClose}
              className="inline-flex items-center justify-center px-6 py-2.5 text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
