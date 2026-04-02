import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User, LayoutDashboard, Globe, ChevronRight, Crown, Zap } from 'lucide-react';
import { NEON_THEMES } from '../constants';
import { useLang } from '../hooks/useLang';
import { useSubscription } from '../hooks/useSubscription';
import Notifications from './Notifications';

export default function Navbar() {
  const { user, profile, theme, setTheme } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [langExpanded, setLangExpanded] = useState(false);
  const { subscription, isExpired } = useSubscription(user?.id);

  const currentPlan = subscription?.plan || 'free';
  const planIcon = currentPlan === 'elite' ? Crown : currentPlan === 'pro' ? Zap : null;

  const cycleTheme = () => {
    const idx = NEON_THEMES.findIndex(t => t.id === theme);
    setTheme(NEON_THEMES[(idx + 1) % NEON_THEMES.length].id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 h-16 flex items-center justify-between glass-neon border-b border-white/5">

      {/* ── Logo — click cycles theme ─────────────────────── */}
      <button
        onClick={cycleTheme}
        className="group shrink-0 cursor-pointer outline-none active:scale-95 transition-transform duration-150"
        aria-label="Switch theme"
        title="Switch theme"
      >
        <img
          src="/logo.png"
          alt="UAi by eyedeaz"
          width={144}
          height={87}
          className="h-7 sm:h-9 w-auto object-contain select-none transition-all duration-200 ease-out group-hover:scale-105"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(0,198,255,0.35)) drop-shadow(0 0 14px rgba(37,99,235,0.20))',
          }}
          draggable={false}
          decoding="async"
          loading="eager"
        />
      </button>

      {/* ── Right controls ───────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">

        {/* ── Foldable language switcher ── */}
        <motion.div
          onHoverStart={() => setLangExpanded(true)}
          onHoverEnd={() => setLangExpanded(false)}
          onClick={() => setLangExpanded(v => !v)}
          animate={{ width: langExpanded ? 'auto' : '40px' }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="relative flex items-center h-9 bg-black/60 rounded-full border border-white/10 overflow-hidden cursor-pointer shrink-0"
        >
          <div className="flex items-center px-1">
            <AnimatePresence mode="popLayout">
              {langExpanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-0.5 px-1"
                >
                  {(['en', 'ar'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={e => { e.stopPropagation(); setLang(l); }}
                      className={`relative w-9 h-7 flex items-center justify-center rounded-full text-xs font-black tracking-wider transition-all duration-200 ${
                        lang === l ? 'text-black' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {lang === l && (
                        <motion.div
                          layoutId="lang-active-pill"
                          className="absolute inset-0 rounded-full -z-10"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                          transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                        >
                          <div className="absolute inset-0 rounded-full blur-md opacity-40"
                            style={{ backgroundColor: 'var(--accent-primary)' }} />
                        </motion.div>
                      )}
                      {l.toUpperCase()}
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.12 }}
                  className="w-9 h-8 flex items-center justify-center gap-0.5"
                >
                  <span className="text-xs font-black tracking-wider text-brand-accent">
                    {lang.toUpperCase()}
                  </span>
                  <ChevronRight size={10} className="text-white/30" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-2">
          <Link to="/explore"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white/50 hover:text-white">
            <Globe size={14} className="text-brand-accent" />
            {t('nav.explore')}
          </Link>

          {user ? (
            <>
              {/* Notifications */}
              <Notifications />

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
              {/* Plan Badge & Upgrade Button */}
              {currentPlan === 'free' ? (
                <Link to="/upgrade"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-brand-accent to-purple-500 text-black text-sm font-bold hover:opacity-90 transition-opacity">
                  <Crown size={14} />
                  Upgrade
                </Link>
              ) : (
                <Link to="/upgrade"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold ${
                    isExpired
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : currentPlan === 'elite'
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gradient-to-r from-brand-accent/20 to-blue-500/20 text-brand-accent border border-brand-accent/30'
                  }`}>
                  {planIcon && <planIcon size={14} />}
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  {isExpired && ' (Expired)'}
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
          <Link to="/login" className="sm:hidden btn-neon text-black text-xs font-bold py-2 px-4">
            {t('nav.getStarted')}
          </Link>
        )}
      </div>
    </nav>
  );
}
