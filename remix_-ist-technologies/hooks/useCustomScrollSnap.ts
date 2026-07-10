import { useEffect } from 'react';

export const useCustomScrollSnap = () => {
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isSnapping = false;

    const handleScroll = () => {
      if (isSnapping) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        handleScrollEnd();
      }, 150);
    };

    const handleScrollEnd = () => {
      // Don't snap if we are at the very top or bottom
      if (window.scrollY <= 0) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) return;

      // If footer is visible, don't snap back to hide it
      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        if (footerRect.top < window.innerHeight) {
          return; 
        }
      }

      const snapElements = Array.from(document.querySelectorAll('section'));
      if (!snapElements.length) return;

      const viewportHeight = window.innerHeight;
      
      let targetElement: HTMLElement | null = null;
      let maxVisibleRatio = 0;

      for (const el of snapElements) {
        const rect = el.getBoundingClientRect();
        const elHeight = rect.height;
        
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        const visibleRatio = visibleHeight / viewportHeight;

        // If element is much taller than viewport, only snap if near boundaries
        if (elHeight > viewportHeight * 1.2) {
            if (rect.top < -viewportHeight * 0.2 && rect.bottom > viewportHeight * 1.2) {
                return; 
            }
        }

        // >= ensures that if two sections are exactly 50% visible, 
        // the later one (next section) takes precedence (snap forward)
        if (visibleRatio >= maxVisibleRatio) {
          maxVisibleRatio = visibleRatio;
          targetElement = el;
        }
      }

      if (targetElement && maxVisibleRatio > 0.1) {
        const rect = targetElement.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(targetElement);
        const scrollMarginTop = parseFloat(computedStyle.scrollMarginTop) || 0;
        
        const distanceToTarget = rect.top - scrollMarginTop;
        
        // Only snap if we are not already aligned (allow 5px threshold)
        // And prevent violent snapping across tall sections by limiting snap distance
        if (Math.abs(distanceToTarget) > 5 && Math.abs(distanceToTarget) < viewportHeight * 0.6) {
          isSnapping = true;
          window.scrollTo({
            top: window.scrollY + distanceToTarget,
            behavior: 'smooth'
          });
          
          // Reset snapping flag after animation completes
          setTimeout(() => {
            isSnapping = false;
          }, 800);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    }, { passive: true });
    window.addEventListener('orientationchange', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    }, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScrollEnd);
      window.removeEventListener('orientationchange', handleScrollEnd);
      clearTimeout(scrollTimeout);
    };
  }, []);
};
