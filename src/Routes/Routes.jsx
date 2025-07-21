import { createBrowserRouter } from "react-router-dom";
import Main from "../Layout/Main";
import Home from "../Pages/Home/Home";
import BannedUser from "../Pages/BannedUser/BannedUser";
import SuspendUser from "../Pages/SuspendUser/SuspendUser";
import AllData from "../Pages/AllData/AllData";
import Login from "../Pages/Login/Login";
import Register from "../Pages/Register/Register";
import ForgotPassword from ".././ForgotPass/ForgotPass"; // NEW: Import ForgotPassword
import PrivateRoute from "../components/utils/PrivateRoute/privateRoute"; // <--- IMPORTANT: Import PrivateRoute

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
        path: "/forgot-password", // NEW: Add this route
        element: <ForgotPassword />, // ForgotPassword page is NOT protected
      },
    ],
  },
]);

export default router;
