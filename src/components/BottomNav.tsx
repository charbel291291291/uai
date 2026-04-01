import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, LayoutDashboard, User, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { useLang } from '../hooks/useLang';
import { useAuth } from '../App';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useLang();
  const { user, profile } = useAuth();

  const items = user
    ? [
        { to: '/',           icon: Home,            label: t('bottomNav.home') },
        { to: '/explore',    icon: Compass,         label: t('bottomNav.explore') },
        { to: '/dashboard',  icon: LayoutDashboard, label: t('bottomNav.dashboard') },
        { to: profile?.username ? `/${profile.username}` : '/dashboard',
          icon: User, label: t('bottomNav.profile') },
      ]
    : [
        { to: '/',        icon: Home,    label: t('bottomNav.home') },
        { to: '/explore', icon: Compass, label: t('bottomNav.explore') },
        { to: '/login',   icon: LogIn,   label: t('nav.getStarted') },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-neon border-t border-white/8 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-all active:scale-90"
            >
              <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                active ? 'bg-brand-accent/15' : ''
              }`}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'text-brand-accent' : 'text-white/35'}
                />
                {active && (
                  <motion.span
                    layoutId="bottom-indicator"
                    className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-brand-accent"
                    style={{ boxShadow: '0 0 8px var(--accent-glow)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[9px] font-bold tracking-wide leading-none ${
                active ? 'text-brand-accent' : 'text-white/25'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
