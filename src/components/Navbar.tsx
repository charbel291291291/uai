import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User, LayoutDashboard, Globe, ChevronRight } from 'lucide-react';
import { NEON_THEMES } from '../constants';
import { useLang } from '../hooks/useLang';

export default function Navbar() {
  const { user, profile, theme, setTheme } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const cycleTheme = () => {
    const idx = NEON_THEMES.findIndex(t => t.id === theme);
    setTheme(NEON_THEMES[(idx + 1) % NEON_THEMES.length].id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const activeTheme = NEON_THEMES.find(t => t.id === theme) || NEON_THEMES[0];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 h-16 flex items-center justify-between glass-neon border-b border-white/5">

      {/* ── Logo ─────────────────────────────────────────── */}
      <div
        onClick={cycleTheme}
        className="group flex flex-col items-start leading-none cursor-pointer active:scale-95 transition-transform shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_var(--accent-glow)] transition-all duration-500">
            U
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tighter text-uai-gradient glow-neon">UAi</span>
        </div>
        <span className="text-[9px] font-bold tracking-[0.2em] text-brand-text-muted uppercase ms-10 mt-0.5">by eyedeaz</span>
      </div>

      {/* ── Right controls ───────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">

        {/* Theme switcher */}
        <motion.div
          onHoverStart={() => setIsExpanded(true)}
          onHoverEnd={() => setIsExpanded(false)}
          onClick={() => setIsExpanded(v => !v)}
          animate={{ width: isExpanded ? 'auto' : '40px' }}
          className="relative flex items-center h-9 bg-black/60 rounded-full border border-white/10 overflow-hidden cursor-pointer shrink-0"
        >
          <div className="flex items-center px-1">
            <AnimatePresence mode="popLayout">
              {isExpanded ? (
                <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-0.5 px-1">
                  {NEON_THEMES.map((t) => (
                    <button key={t.id} onClick={(e) => { e.stopPropagation(); setTheme(t.id); }}
                      className="relative w-7 h-7 flex items-center justify-center rounded-full transition-all" title={t.label}>
                      <div className="w-2 h-2 rounded-full transition-transform duration-300"
                        style={{ backgroundColor: t.color, boxShadow: theme === t.id ? `0 0 10px ${t.color}` : 'none', transform: theme === t.id ? 'scale(1.5)' : 'scale(1)' }} />
                      {theme === t.id && (
                        <motion.div layoutId="active-pill" className="absolute inset-0 rounded-full -z-10"
                          style={{ backgroundColor: t.color }} transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}>
                          <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ backgroundColor: t.color }} />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="w-8 h-8 flex items-center justify-center gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeTheme.color, boxShadow: `0 0 10px ${activeTheme.color}` }} />
                  <ChevronRight size={10} className="text-white/30" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="h-9 px-2.5 rounded-full bg-black/60 border border-white/10 flex items-center gap-1 text-xs font-black tracking-wider hover:bg-white/10 transition-all shrink-0"
          title="Switch language"
        >
          <span className={lang === 'en' ? 'text-brand-accent' : 'text-white/30'}>EN</span>
          <span className="text-white/15">|</span>
          <span className={lang === 'ar' ? 'text-brand-accent' : 'text-white/30'}>AR</span>
        </button>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-2">
          <Link to="/explore"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white/50 hover:text-white">
            <Globe size={14} className="text-brand-accent" />
            {t('nav.explore')}
          </Link>

          {user ? (
            <>
              <Link to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white/50 hover:text-white">
                <LayoutDashboard size={14} className="text-brand-accent" />
                {t('nav.dashboard')}
              </Link>
              {profile?.username && (
                <Link to={`/${profile.username}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white/50 hover:text-white">
                  <User size={14} className="text-brand-accent" />
                  {t('nav.profile')}
                </Link>
              )}
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-red-400/70 hover:text-red-400">
                <LogOut size={14} />
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-neon text-black text-sm font-bold py-2 px-5">
              {t('nav.getStarted')}
            </Link>
          )}
        </div>

        {/* Mobile login button (only when logged out) */}
        {!user && (
          <Link to="/login"
            className="sm:hidden btn-neon text-black text-xs font-bold py-2 px-4">
            {t('nav.getStarted')}
          </Link>
        )}
      </div>
    </nav>
  );
}
