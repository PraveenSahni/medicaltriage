import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Prevent browser from restoring scroll position on back/forward
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Force scroll to top on any route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' 
    });
    
    // Fallback for some mobile browsers that might delay rendering
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.key]);

  return null;
}
