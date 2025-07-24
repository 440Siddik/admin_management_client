import { useState, useRef } from "react";
import { useAuth } from "../../Context/AuthContext"; // Import useAuth hook

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const formRef = useRef(null);
  // Get currentUser, userProfile, and authLoading from AuthContext
  const { currentUser, userProfile, loading: authLoading } = useAuth(); 

  // IMPORTANT: Use environment variable for backend URL.
  // When deployed on Vercel, REACT_APP_BACKEND_URL will be provided by Vercel.
  // For local development, it will fall back to your deployed backend URL.
  // Ensure the environment variable in Vercel for the frontend project DOES NOT have a trailing slash.
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://admin-management-server.vercel.app"; 
  // If your local backend runs on port 5000 and you want to test locally with it, change the fallback:
  // const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://admin-management-server.vercel.app";


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    // Frontend validation: Ensure user is logged in and profile is loaded
    if (!currentUser || !userProfile || !userProfile.fbName) {
      setError("You must be logged in and your profile loaded to submit a report.");
      setLoading(false);
      return;
    }

    const form = e.target;
    const userData = { // This object will be sent to your Express backend
      name: form.name.value,
      facebookLink: form.facebookLink.value,
      phone: form.phone.value,
      status: form.status.value,
      reason: form.reason.value,
      // --- IMPORTANT: Provide fallback values for reporterId and reporterName ---
      // This ensures they are always strings, even if currentUser/userProfile
      // are momentarily null/undefined during a quick submission attempt.
      reporterId: currentUser.uid || 'anonymous_user_id', // Fallback ID
      reporterName: userProfile.fbName || 'Anonymous Reporter', // Fallback name
      // --- END IMPORTANT ---
    };

    console.log("User Data to be submitted to Express backend:", userData);

    try {
      const response = await fetch(`${backendUrl}/api/userReports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData), // Send the data as JSON
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error or non-JSON response from server.' }));
        throw new Error(errorData.message || "Failed to submit report.");
      }

      const result = await response.json();
      console.log("Form submitted successfully to Express:", result);
      setSuccessMessage(result.message || "Report submitted successfully!");
      form.reset();

      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (err) {
      console.error("Submission error to Express backend:", err);
      setError(err.message || "Failed to submit report. Please try again.");
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneInput = (e) => {
    const charCode = e.charCode;
    if (
      (charCode > 31 && (charCode < 48 || charCode > 57)) &&
      charCode !== 43 &&
      charCode !== 45 &&
      charCode !== 40 &&
      charCode !== 41
    ) {
      e.preventDefault();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-3xl font-extrabold text-center text-blue-700 mb-6 md:mb-7 drop-shadow-lg">
          Submit A Report
        </h1>

        {/* Message Display Area */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 shadow-md" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6 shadow-md" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> {successMessage}</span>
          </div>
        )}

        {/* Display current logged-in user's name if available, or loading/login prompt */}
        {authLoading ? (
            <p className="text-center text-gray-600 text-lg mb-6">Loading user info...</p>
        ) : currentUser && userProfile && userProfile.fbName ? (
          <p className="text-center font-semibold text-gray-700 text-lg mb-6">
            Logged in as: <span className="font-bold text-blue-600">{userProfile.fbName}</span>
          </p>
        ) : (
            <p className="text-center text-red-500 text-lg mb-6 font-semibold">
                Please log in to submit a report.
            </p>
        )}

        {/* Fancy Form Card */}
        <form
          onSubmit={handleSubmit}
          ref={formRef}
          className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl p-6 md:p-10 border border-blue-200 transform transition-all duration-300 hover:shadow-xl hover:scale-[1.005]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6"> {/* Increased gap-y for more vertical space */}
            {/* Name Input */}
            <div className="w-full"> {/* Use w-full directly on the div */}
              <label htmlFor="name" className="block text-lg font-semibold text-gray-700 mb-2">Name</label> {/* block for proper stacking */}
              <input
                type="text"
                id="name" // Added ID for label association
                name="name"
                placeholder="Enter name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm outline-none" // Removed DaisyUI classes, added outline-none
                required
              />
            </div>
            {/* Facebook Link Input */}
            <div className="w-full">
              <label htmlFor="facebookLink" className="block text-lg font-semibold text-gray-700 mb-2">Facebook Link</label>
              <input
                type="url"
                id="facebookLink"
                name="facebookLink"
                placeholder="Enter Facebook profile link"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm outline-none"
                required
              />
            </div>
            {/* Phone Input */}
            <div className="w-full">
              <label htmlFor="phone" className="block text-lg font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter phone number"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm outline-none"
                required
                onKeyPress={handlePhoneInput}
                pattern="^[+]?[0-9\\s()-]*$"
                title="Phone number must contain only digits, optionally starting with +, and may include spaces, hyphens, or parentheses."
              />
            </div>
            {/* Status Select */}
            <div className="w-full">
              <label htmlFor="status" className="block text-lg font-semibold text-gray-700 mb-2">Status</label>
              <select
                id="status"
                name="status"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm bg-white appearance-none pr-8" // Removed DaisyUI classes, added appearance-none and pr-8 for custom arrow space
                required
              >
                <option value="">Select status</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
              {/* Custom arrow for select element */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
              </div>
            </div>
            {/* Reason Textarea - Now correctly aligned and takes full width */}
            <div className="col-span-full w-full"> {/* Ensures it always spans full width */}
              <label htmlFor="reason" className="block text-lg font-semibold text-gray-700 mb-2">Reason</label>
              <textarea
                id="reason"
                name="reason"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm resize-y h-32 outline-none" // Removed DaisyUI classes, set h-32 explicitly
                placeholder="Enter reason for report"
                required
              ></textarea>
            </div>
          </div>

          {/* Submit Button */}
          <div className="w-full mt-8"> {/* Use w-full directly on the div */}
            <button
              type="submit"
              className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-600 w-full"
              // Disable if loading, auth is loading, or user/profile data is not fully available
              disabled={loading || authLoading || !currentUser || !userProfile || !userProfile.fbName} 
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;
