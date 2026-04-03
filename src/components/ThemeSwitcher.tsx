import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, X } from 'lucide-react';
import { useAuth, NeonTheme } from '../App';
import { NEON_THEMES } from '../constants';

/**
 * ThemeSwitcher - Global floating theme selector
 * - Appears on all pages
 * - Shows current theme with color indicator
 * - Dropdown to select from 4 neon themes
 * - Persists selection via localStorage (handled by App.tsx)
 */
export default function ThemeSwitcher() {
  const { theme, setTheme } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = NEON_THEMES.find((t) => t.id === theme);

  const handleThemeSelect = (selectedTheme: NeonTheme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  return (
    <div className="fixed z-50" style={{
      top: 'clamp(5rem, 10vh, 6.5rem)',
      right: 'clamp(1rem, 3vw, 1.5rem)',
    }}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close - full screen coverage */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
              aria-hidden="true"
            />

            {/* Dropdown menu - Responsive positioning and sizing */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] glass-elevated rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
              role="menu"
              aria-label="Theme selection menu"
              style={{
                maxHeight: 'min(400px, 80vh)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div className="p-2">
                <div className="text-xs font-bold text-white/60 px-3 py-2 uppercase tracking-wider">
                  Select Theme
                </div>
                {NEON_THEMES.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => handleThemeSelect(themeOption.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl transition-all touch-manipulation ${
                      theme === themeOption.id
                        ? 'bg-white/10 border border-white/20'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                    role="menuitem"
                    aria-current={theme === themeOption.id ? 'true' : undefined}
                  >
                    {/* Color indicator - larger on mobile */}
                    <span
                      className="w-6 h-6 sm:w-5 sm:h-5 rounded-full ring-2 ring-white/20 shadow-lg shrink-0"
                      style={{ 
                        backgroundColor: themeOption.color,
                        boxShadow: `0 0 12px ${themeOption.color}66`
                      }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-white flex-1 text-left">
                      {themeOption.label}
                    </span>
                    {theme === themeOption.id && (
                      <span className="ml-auto text-xs text-white/60 shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toggle button - Responsive sizing and positioning */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative glass-elevated p-3 sm:p-3.5 rounded-2xl border border-white/10 shadow-lg hover:border-white/20 transition-all group touch-manipulation"
        aria-label="Change theme"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        style={{
          width: 'clamp(44px, 10vw, 48px)',
          height: 'clamp(44px, 10vw, 48px)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Palette 
          size={20} 
          className="text-brand-accent transition-transform group-hover:rotate-12 mx-auto"
          aria-hidden="true"
        />
        
        {/* Current theme indicator dot */}
        <span
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full ring-2 ring-brand-bg shadow-md"
          style={{ 
            backgroundColor: currentTheme?.color,
            boxShadow: `0 0 8px ${currentTheme?.color}`
          }}
          aria-hidden="true"
        />

        {/* Close icon when open */}
        {isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-brand-bg">
            <X size={12} className="text-white" aria-hidden="true" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
