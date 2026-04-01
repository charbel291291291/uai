import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User, LayoutDashboard, Globe, ChevronRight } from 'lucide-react';
import { NEON_THEMES } from '../constants';

export default function Navbar() {
  const { user, profile, theme, setTheme } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const cycleTheme = () => {
    const currentIndex = NEON_THEMES.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % NEON_THEMES.length;
    setTheme(NEON_THEMES[nextIndex].id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const activeTheme = NEON_THEMES.find(t => t.id === theme) || NEON_THEMES[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between glass-neon border-b border-white/5">
      <div 
        onClick={cycleTheme}
        className="group flex flex-col items-start leading-none cursor-pointer active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_var(--accent-glow)] transition-all duration-500">
            U
          </div>
          <span className="text-2xl font-black tracking-tighter text-uai-gradient glow-neon transition-all duration-500">UAi</span>
        </div>
        <span className="text-[10px] font-bold tracking-[0.2em] text-brand-text-muted uppercase ml-10 mt-0.5 group-hover:text-[#D4D4D8] transition-colors">by eyedeaz</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Premium Foldable Theme Switcher */}
        <motion.div 
          onHoverStart={() => setIsExpanded(true)}
          onHoverEnd={() => setIsExpanded(false)}
          onClick={() => setIsExpanded(!isExpanded)}
          animate={{ width: isExpanded ? 'auto' : '44px' }}
          className="relative flex items-center h-10 bg-black/60 rounded-full border border-white/10 shadow-inner overflow-hidden cursor-pointer group"
        >
          <div className="flex items-center px-1">
            <AnimatePresence mode="popLayout">
              {isExpanded ? (
                <motion.div 
                  key="expanded"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-1 px-1"
                >
                  {NEON_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheme(t.id);
                      }}
                      className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-500 ${
                        theme === t.id ? 'text-black' : 'text-brand-text-muted hover:text-brand-text'
                      }`}
                      title={t.label}
                    >
                      <div 
                        className="w-2 h-2 rounded-full transition-transform duration-500"
                        style={{ 
                          backgroundColor: t.color,
                          boxShadow: theme === t.id ? `0 0 10px ${t.color}` : 'none',
                          transform: theme === t.id ? 'scale(1.5)' : 'scale(1)'
                        }} 
                      />
                      
                      {theme === t.id && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute inset-0 rounded-full z-[-1]"
                          style={{ backgroundColor: t.color }}
                          transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                        >
                          <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ backgroundColor: t.color }} />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-8 h-8 flex items-center justify-center"
                >
                  <div 
                    className="w-3 h-3 rounded-full shadow-[0_0_15px_var(--accent-glow)]"
                    style={{ backgroundColor: activeTheme.color }}
                  />
                  <ChevronRight size={12} className="text-brand-text-muted ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
          <Link 
            to="/explore" 
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-brand-text-muted hover:text-brand-text"
          >
            <Globe size={16} className="text-brand-accent" />
            Explore
          </Link>
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-brand-text-muted hover:text-brand-text"
              >
                <LayoutDashboard size={16} className="text-brand-accent" />
                Dashboard
              </Link>
              {profile?.username && (
                <Link 
                  to={`/${profile.username}`} 
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-brand-text-muted hover:text-brand-text"
                >
                  <User size={16} className="text-brand-accent" />
                  Profile
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-red-400/80 hover:text-red-400"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="btn-neon text-black text-sm font-bold"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
