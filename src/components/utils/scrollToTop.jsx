import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const location = useLocation(); // Get the entire location object

  useEffect(() => {
    // Whenever the location object changes (pathname, search, hash),
    // scroll the window to the top.
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Optional: makes the scroll animated
    });
  }, [location]); // Dependency array: re-run effect when the location object changes

  return null; // This component doesn't render anything itself
}

export default ScrollToTop;
