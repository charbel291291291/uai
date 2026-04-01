import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../supabase';
import { LogOut, User, LayoutDashboard, Globe } from 'lucide-react';
import { useLang } from '../hooks/useLang';

export default function Navbar() {
  const { user, profile } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 h-16 flex items-center justify-between glass-neon border-b border-white/5">

      {/* ── Logo ─────────────────────────────────────────── */}
      <Link
        to="/"
        className="group shrink-0 cursor-pointer outline-none"
        aria-label="UAi — Home"
      >
        <img
          src="/logo.png"
          alt="UAi by eyedeaz"
          width={320}
          height={193}
          className="
            h-7 sm:h-9 w-auto
            object-contain
            select-none
            transition-all duration-250 ease-out
            group-hover:scale-105
          "
          style={{
            filter: 'drop-shadow(0 0 6px rgba(0,198,255,0.35)) drop-shadow(0 0 14px rgba(37,99,235,0.20))',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLImageElement).style.filter =
              'drop-shadow(0 0 8px rgba(0,198,255,0.55)) drop-shadow(0 0 20px rgba(37,99,235,0.30))';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLImageElement).style.filter =
              'drop-shadow(0 0 6px rgba(0,198,255,0.35)) drop-shadow(0 0 14px rgba(37,99,235,0.20))';
          }}
          draggable={false}
        />
      </Link>

      {/* ── Right controls ───────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">

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
