import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Context/AuthContext'; // Corrected path to contexts

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState(""); // State for search input
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu toggle
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Get currentUser, logout function, userRole, and loading state from AuthContext
  const { currentUser, logout, loading: authLoading, userRole } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)

    if (searchQuery.trim()) {
      // Navigate to the /all-data page with the search term as a query parameter
      navigate(`/all-data?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // If search query is empty, navigate to /all-data without search parameter
      navigate("/all-data");
    }
    // Close the mobile menu after search, if it's open
    setIsMenuOpen(false);
    // Optionally, clear the search input after submission
    // setSearchQuery('');
  };

  const handleLogout = async () => {
    try {
      await logout(); // Call the logout function from AuthContext
      navigate('/login'); // Redirect to login page after successful logout
      setIsMenuOpen(false); // Close mobile menu after logout
    } catch (error) {
      console.error("Failed to log out:", error);
      // Optionally, display an error message to the user (e.g., using a toast notification)
    }
  };

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Helper to check if the current user has admin privileges
  const isAdmin = currentUser && (userRole === 'admin' || userRole === 'superadmin');

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Brand - Now also serves as the Home link */}
        <Link to="/" className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center space-x-2">
          <span>Admin Management</span>
        </Link>

        {/* Desktop Navigation Links and Search */}
        {/* Changed space-x-6 to gap-x-4 and added flex-wrap for better responsiveness */}
        <div className="hidden md:flex items-center flex-wrap gap-x-4">
          <Link to="/all-data" className="hover:text-blue-200 transition-colors duration-200 text-lg font-medium py-2 px-3">All Reports</Link>
          <Link to="/suspended-users" className="hover:text-blue-200 transition-colors duration-200 text-lg font-medium py-2 px-3">Suspended</Link>
          <Link to="/banned-users" className="hover:text-blue-200 transition-colors duration-200 text-lg font-medium py-2 px-3">Banned</Link>

          {/* Admin Panel Link (Desktop) */}
          {!authLoading && isAdmin && (
            <Link to="/admin/users" className="hover:text-blue-200 transition-colors duration-200 text-lg font-medium bg-blue-600 px-3 py-2 rounded-md shadow-sm">
              Admin Panel
            </Link>
          )}

          {/* Search Form for Desktop */}
          <form onSubmit={handleSearch} className="flex items-center gap-x-2"> {/* Changed space-x-2 to gap-x-2 */}
            <input
              type="text"
              placeholder="Search..."
              // Adjusted width for better responsiveness across desktop sizes
              className="px-3 py-2 rounded-lg border border-blue-400 bg-blue-800 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 w-full max-w-[150px] lg:max-w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-lg font-medium shadow-md"
            >
              Search
            </button>
          </form>

          {/* Conditional Login/Logout Button for Desktop */}
          {!authLoading && (
            currentUser ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 text-lg font-medium shadow-md"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-lg font-medium shadow-md">
                Login
              </Link>
            )
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button onClick={toggleMobileMenu} className="text-white focus:outline-none">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-800 pb-4 px-4"> {/* Added px-4 for consistent padding */}
          <div className="flex flex-col items-center space-y-4">
            <Link to="/all-data" className="block py-2 px-4 text-lg hover:bg-blue-700 w-full text-center transition-colors duration-200" onClick={toggleMobileMenu}>All Reports</Link>
            <Link to="/suspended-users" className="block py-2 px-4 text-lg hover:bg-blue-700 w-full text-center transition-colors duration-200" onClick={toggleMobileMenu}>Suspended</Link>
            <Link to="/banned-users" className="block py-2 px-4 text-lg hover:bg-blue-700 w-full text-center transition-colors duration-200" onClick={toggleMobileMenu}>Banned</Link>

            {/* Admin Panel Link (Mobile) */}
            {!authLoading && isAdmin && (
              <Link to="/admin/users" className="block py-2 px-4 text-lg hover:bg-blue-700 w-full text-center transition-colors duration-200 bg-blue-600 rounded-lg shadow-sm" onClick={toggleMobileMenu}>
                Admin Panel
              </Link>
            )}

            {/* Search Form for Mobile */}
            <form onSubmit={handleSearch} className="flex items-center gap-x-2 w-full"> {/* Changed space-x-2 to gap-x-2 and added w-full */}
              <input
                type="text"
                placeholder="Search..."
                className="flex-grow px-3 py-2 rounded-lg border border-blue-400 bg-blue-700 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-lg font-medium shadow-md"
              >
                Search
              </button>
            </form>

            {/* Conditional Login/Logout Button for Mobile */}
            {!authLoading && (
              currentUser ? (
                <button
                  onClick={handleLogout} // Calls handleLogout which also closes menu
                  className="w-full px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 text-lg font-medium shadow-md"
                >
                  Logout
                </button>
              ) : (
                <Link to="/login" className="w-full px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-lg font-medium shadow-md" onClick={toggleMobileMenu}>
                  Login
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
