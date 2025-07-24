import { createBrowserRouter } from "react-router-dom";
import Main from "../Layout/Main"; // Ensure this path is correct
import Home from "../Pages/Home/Home";
import BannedUser from "../Pages/BannedUser/BannedUser";
import SuspendUser from "../Pages/SuspendUser/SuspendUser"; // Assuming this is correct
import AllData from "../Pages/AllData/AllData"; // Assuming this is correct
import Login from "../Pages/Login/Login";
import Register from "../Pages/Register/Register";
import ForgotPassword from "../ForgotPass/ForgotPass"; // Assuming this path is correct
import PrivateRoute from "../components/utils/PrivateRoute/privateRoute"; // Ensure this path is correct

// Import the main AdminUsers component
import AdminUsers from "../Pages/Admin/AdminUsers";

// NEW: Import the TrashReportsPage component (adjusted path based on your previous input)
import TrashReportsPage from "../Pages/Admin/TrashReports"; // Assuming this path is correct

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    children: [
      {
        path: "/",
        // --- PROTECTED ROUTE: Wrap Home with PrivateRoute ---
        element: <PrivateRoute><Home /></PrivateRoute>,
      },
      {
        path: "/suspended-users",
        // --- PROTECTED ROUTE: Wrap SuspendUser with PrivateRoute ---
        element: <PrivateRoute><SuspendUser /></PrivateRoute>,
      },
      {
        path: "/banned-users",
        // --- PROTECTED ROUTE: Wrap BannedUser with PrivateRoute ---
        element: <PrivateRoute><BannedUser /></PrivateRoute>,
      },
      {
        path: "/all-data",
        // --- PROTECTED ROUTE: Wrap AllData with PrivateRoute ---
        element: <PrivateRoute><AllData /></PrivateRoute>,
      },
      {
        path: "/login",
        element: <Login />, // Login page is NOT protected
      },
      {
        path: "/register",
        element: <Register />, // Register page is NOT protected
      },
      {
        path: "/forgot-password", // Add this route
        element: <ForgotPassword />, // ForgotPassword page is NOT protected
      },
      // NEW ROUTE: Admin Panel for Users
      {
        path: "/admin/users", // The URL for your admin panel
        element: (
          <PrivateRoute requiredRole="admin"> {/* This route requires 'admin' or 'superadmin' role */}
            <AdminUsers />
          </PrivateRoute>
        ),
      },
      // NEW ROUTE: Trash Reports Section (Admin Only)
      {
        path: "/trash-reports",
        element: (
          <PrivateRoute requiredRole="admin"> {/* This route requires 'admin' or 'superadmin' role */}
            <TrashReportsPage />
          </PrivateRoute>
        ),
      },
    ],
  },
]);

export default router;
