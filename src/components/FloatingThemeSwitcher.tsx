import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

export interface Theme {
  id: string;
  color: string;
  gradient: string;
  label: string;
}

export const THEMES: Theme[] = [
  { 
    id: 'cyber-purple', 
    color: '#A855F7',
    gradient: 'from-purple-500 to-purple-600',
    label: 'Purple' 
  },
  { 
    id: 'electric-blue', 
    color: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600',
    label: 'Blue' 
  },
  { 
    id: 'gold-glow', 
    color: '#F59E0B',
    gradient: 'from-amber-400 to-amber-500',
    label: 'Gold' 
  },
  { 
    id: 'cyber-green', 
    color: '#10B981',
    gradient: 'from-emerald-500 to-emerald-600',
    label: 'Green' 
  },
];

// ============================================================================
// FLOATING THEME SWITCHER (Premium Design)
// ============================================================================

export default function FloatingThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'electric-blue';
    return localStorage.getItem('theme') || 'electric-blue';
  });

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem('theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
      {/* Subtle glassmorphism container */}
      <div className="relative p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="flex flex-col gap-3">
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            
            return (
              <motion.button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                aria-label={`Switch to ${theme.label} theme`}
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  opacity: isActive ? 1 : 0.6,
                }}
                whileHover={{
                  scale: 1.2,
                  opacity: 1,
                  transition: { duration: 0.2, ease: 'easeOut' },
                }}
                whileTap={{
                  scale: 0.95,
                  transition: { duration: 0.1 },
                }}
                className={`
                  relative w-4 h-4 rounded-full
                  transition-all duration-300 ease-out
                  focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent
                `}
                style={{
                  backgroundColor: theme.color,
                  boxShadow: isActive 
                    ? `0 0 20px ${theme.color}60, 0 0 40px ${theme.color}30`
                    : '0 0 0 transparent',
                }}
              >
                {/* Active indicator ring */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: `inset 0 0 0 2px rgba(255, 255, 255, 0.4)`,
                    }}
                  />
                )}
                
                {/* Subtle highlight for depth */}
                <div 
                  className="absolute inset-0 rounded-full opacity-0 hover:opacity-30 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)`,
                  }}
                />
              </motion.button>
            );
          })}
        </div>
        
        {/* Optional: Very subtle separator line between dots */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {/* Ambient glow behind the switcher */}
      <div 
        className="absolute inset-0 -z-10 blur-2xl opacity-0 hover:opacity-30 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${THEMES.find(t => t.id === activeTheme)?.color || '#3B82F6'}40 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
