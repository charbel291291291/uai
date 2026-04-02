import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { motion } from 'motion/react';
import { supabase } from './supabase';
import Home from './pages/Home';
import Dashboard from './pages/DashboardNew';
import Profile from './pages/ProfileNew';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import InstallBanner from './components/InstallBanner';
import { LangProvider } from './hooks/useLang';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { UserProfile } from './types';

export type NeonTheme = 'cyber-purple' | 'electric-blue' | 'gold-glow' | 'cyber-green';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  theme: NeonTheme;
  setTheme: (theme: NeonTheme) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  theme: 'electric-blue',
  setTheme: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── Inner shell (needs Router context for useLocation) ─────────────────────
function AppShell() {
  const location = useLocation();
  const { isInstallable, justInstalled, install, dismiss } = useInstallPrompt();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text selection:bg-brand-accent/30 transition-colors duration-500">
      <Navbar />

      {/* Page transition wrapper */}
      <motion.main
        key={location.pathname}
        className="pt-16 pb-20 md:pb-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/"          element={<Home />} />
          <Route path="/explore"   element={<Explore />} />
          <Route path="/login"     element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <AuthGate>
                <Dashboard />
              </AuthGate>
            }
          />
          <Route path="/p/:username" element={<Profile />} />
          <Route path="/:username"   element={<Profile />} />
        </Routes>
      </motion.main>

      <BottomNav />
      <InstallBanner
        isInstallable={isInstallable}
        justInstalled={justInstalled}
        onInstall={install}
        onDismiss={dismiss}
      />
    </div>
  );
}

// ── Auth guard ──────────────────────────────────────────────────────────────
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" />;
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [theme, setThemeState] = useState<NeonTheme>('electric-blue');

  const setTheme = (newTheme: NeonTheme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    const url  = import.meta.env.VITE_SUPABASE_URL;
    const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) { setIsConfigured(false); setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isConfigured) return;

    (async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (!error) setProfile(data as UserProfile);
      } catch {
        // Silently handle error
      } finally {
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => setProfile(payload.new as UserProfile))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isConfigured]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-brand-bg text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card border border-white/10 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Supabase Not Configured</h1>
          <p className="text-white/60 text-sm">
            Set <code className="bg-white/10 px-1.5 py-0.5 rounded text-brand-accent">VITE_SUPABASE_URL</code> and{' '}
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-brand-accent">VITE_SUPABASE_ANON_KEY</code> to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, theme, setTheme }}>
      <LangProvider>
        <Router>
          <AppShell />
        </Router>
      </LangProvider>
    </AuthContext.Provider>
  );
}
