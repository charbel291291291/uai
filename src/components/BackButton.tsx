import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Home } from 'lucide-react';

/**
 * BackButton - Global navigation back button with Home option
 * - Appears on all pages EXCEPT home page ("/")
 * - Uses React Router navigation with history fallback
 * - Floating button with 3D effects
 * - Compact, modern design
 */
export default function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on home page
  if (location.pathname === '/') {
    return null;
  }

  const handleBack = () => {
    // Navigate back, fallback to home if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="fixed z-50 flex flex-col gap-3" style={{ top: 'clamp(5rem, 10vh, 6.5rem)', left: 'clamp(1rem, 3vw, 1.5rem)' }}>
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ 
          scale: 1.1,
          rotateY: 10,
          rotateX: -5,
        }}
        whileTap={{ 
          scale: 0.9,
          rotateY: 0,
          rotateX: 0,
        }}
        onClick={handleBack}
        className="group perspective-1000 touch-manipulation"
        aria-label="Go back to previous page"
      >
        {/* 3D Container - Responsive sizing */}
        <div 
          className="relative flex items-center justify-center transition-all duration-300"
          style={{
            width: 'clamp(44px, 10vw, 48px)',
            height: 'clamp(44px, 10vw, 48px)',
            borderRadius: 'clamp(12px, 3vw, 16px)',
            background: 'linear-gradient(135deg, rgba(58, 134, 255, 0.15) 0%, rgba(0, 198, 255, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1),
              0 0 20px rgba(58, 134, 255, 0.2)
            `,
          }}
        >
          {/* Glow effect */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
            style={{
              background: 'radial-gradient(circle at center, rgba(58, 134, 255, 0.3) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            aria-hidden="true"
          />
          
          {/* Icon container with 3D effect */}
          <div 
            className="relative flex items-center justify-center"
            style={{
              width: 'clamp(18px, 4vw, 20px)',
              height: 'clamp(18px, 4vw, 20px)',
              transform: 'translateZ(10px)',
              textShadow: '0 2px 8px rgba(58, 134, 255, 0.5)',
            }}
          >
            <ArrowLeft 
              size={20} 
              className="text-[#3A86FF] group-hover:-translate-x-0.5 transition-transform rtl:group-hover:translate-x-0.5"
              style={{
                width: 'clamp(18px, 4vw, 20px)',
                height: 'clamp(18px, 4vw, 20px)',
                filter: 'drop-shadow(0 2px 4px rgba(58, 134, 255, 0.4))',
              }}
              aria-hidden="true"
            />
          </div>

          {/* Highlight reflection */}
          <div 
            className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-4 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent)',
              filter: 'blur(2px)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Tooltip - Hide on small screens, show on larger */}
        <div 
          className="hidden sm:block absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#020617] border border-white/10 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          Back
          <div 
            className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#020617] border-l border-b border-white/10 rotate-45"
            aria-hidden="true"
          />
        </div>

        {/* Mobile-friendly touch indicator */}
        <div 
          className="sm:hidden absolute -inset-2 rounded-full border-2 border-[#3A86FF]/30 opacity-0 group-active:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </motion.button>

      {/* Home Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ 
          scale: 1.1,
          rotateY: 10,
          rotateX: -5,
        }}
        whileTap={{ 
          scale: 0.9,
          rotateY: 0,
          rotateX: 0,
        }}
        onClick={handleHome}
        className="group perspective-1000 touch-manipulation"
        aria-label="Go to home page"
      >
        {/* 3D Container - Responsive sizing */}
        <div 
          className="relative flex items-center justify-center transition-all duration-300"
          style={{
            width: 'clamp(44px, 10vw, 48px)',
            height: 'clamp(44px, 10vw, 48px)',
            borderRadius: 'clamp(12px, 3vw, 16px)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1),
              0 0 20px rgba(16, 185, 129, 0.2)
            `,
          }}
        >
          {/* Glow effect */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
            style={{
              background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            aria-hidden="true"
          />
          
          {/* Icon container with 3D effect */}
          <div 
            className="relative flex items-center justify-center"
            style={{
              width: 'clamp(18px, 4vw, 20px)',
              height: 'clamp(18px, 4vw, 20px)',
              transform: 'translateZ(10px)',
              textShadow: '0 2px 8px rgba(16, 185, 129, 0.5)',
            }}
          >
            <Home 
              size={20} 
              className="text-[#10B981] group-hover:scale-110 transition-transform"
              style={{
                width: 'clamp(18px, 4vw, 20px)',
                height: 'clamp(18px, 4vw, 20px)',
                filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))',
              }}
              aria-hidden="true"
            />
          </div>

          {/* Highlight reflection */}
          <div 
            className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-4 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent)',
              filter: 'blur(2px)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Tooltip - Hide on small screens, show on larger */}
        <div 
          className="hidden sm:block absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#020617] border border-white/10 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          Home
          <div 
            className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#020617] border-l border-b border-white/10 rotate-45"
            aria-hidden="true"
          />
        </div>

        {/* Mobile-friendly touch indicator */}
        <div 
          className="sm:hidden absolute -inset-2 rounded-full border-2 border-[#10B981]/30 opacity-0 group-active:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </motion.button>
    </div>
  );
}
