import Navbar from "../Pages/Shared/Navbar/Navbar";
import Footer from "../Pages/Shared/Footer/Footer";
import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/utils/scrollToTop"; // Adjust this path if your ScrollToTop.jsx is in a different directory

const Main = () => {
  return (
    <>
      {/* Place ScrollToTop here, it will listen to route changes and scroll */}
      <ScrollToTop />

      <Navbar />
      {/* Increased padding-top to 'pt-24' (6rem / 96px) to ensure content clears the sticky navbar.
          You might need to fine-tune this value (e.g., pt-20, pt-28) based on your Navbar's exact height
          and any potential responsive height changes.
      */}
      <div className="pt-3 px-4 min-h-[calc(100vh-80px)]"> {/* Adjusted min-h-screen for better footer placement */}
        <Outlet /> {/* This is where your page content (Home, AllData, etc.) renders */}
      </div>
      <Footer />
    </>
  );
};

export default Main;
