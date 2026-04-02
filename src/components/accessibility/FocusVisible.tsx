import { useEffect, useState } from 'react';

// Global style for focus-visible
export function FocusVisibleStyles() {
  const [focusVisible, setFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <style>{`
      /* Default focus styles - hidden for mouse users */
      *:focus {
        outline: none;
      }
      
      /* Visible focus styles for keyboard users */
      ${focusVisible ? `
        *:focus-visible {
          outline: 2px solid #3A86FF;
          outline-offset: 2px;
        }
        
        button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible,
        [tabindex]:not([tabindex="-1"]):focus-visible {
          outline: 2px solid #3A86FF;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(58, 134, 255, 0.2);
        }
      ` : ''}
      
      /* Reduced motion preferences */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        *:focus-visible {
          outline: 3px solid currentColor;
          outline-offset: 2px;
        }
      }
      
      /* Screen reader only text */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .sr-only-focusable:not(:focus) {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        padding: inherit;
        margin: inherit;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }
    `}</style>
  );
}
