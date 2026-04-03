import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { motion } from 'motion/react';
import { supabase } from './supabase';
import Home from './pages/Home';
import Dashboard from './pages/DashboardNew';
import Profile from './pages/ProfileNew';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Upgrade from './pages/Upgrade';
import Admin from './pages/Admin';
import AdminNFC from './pages/AdminNFC';
import Shop from './pages/Shop';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import InstallBanner from './components/InstallBanner';
import { LangProvider } from './hooks/useLang';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { UserProfile } from './types';
import { SkipLink, AnnouncerRegions, FocusVisibleStyles } from './components/accessibility';
import FloatingThemeSwitcher from './components/FloatingThemeSwitcher';
import BackButton from './components/BackButton';
import SecureLogger from './utils/SecureLogger';

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
      <FocusVisibleStyles />
      <SkipLink targetId="main-content" />
      <AnnouncerRegions />
      
      {/* Global UI Components */}
      <FloatingThemeSwitcher />
      <BackButton />
      
      <Navbar />

      {/* Page transition wrapper */}
      <motion.main
        id="main-content"
        key={location.pathname}
        className="pt-16 pb-20 md:pb-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        tabIndex={-1}
      >
        <Routes location={location}>
          <Route path="/"          element={<Home />} />
          <Route path="/explore"   element={<Explore />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/shop"      element={<Shop />} />
          <Route
            path="/dashboard"
            element={
              <AuthGate>
                <Dashboard />
              </AuthGate>
            }
          />
          <Route
            path="/upgrade"
            element={
              <AuthGate>
                <Upgrade />
              </AuthGate>
            }
          />
          <Route
            path="/admin"
            element={
              <AuthGate>
                <Admin />
              </AuthGate>
            }
          />
          <Route
            path="/admin/nfc"
            element={
              <AuthGate>
                <AdminNFC />
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
    // Save to localStorage for persistence
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'electric-blue';
    setThemeState(savedTheme as NeonTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Re-apply theme after user login to ensure it persists
  useEffect(() => {
    if (user) {
      const savedTheme = localStorage.getItem('theme') || 'electric-blue';
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [user]);

  // Initialize Supabase and session with proper validation
  useEffect(() => {
    const url  = import.meta.env.VITE_SUPABASE_URL;
    const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) { setIsConfigured(false); setLoading(false); return; }

    // Validate session on mount - CRITICAL for security
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only set user if session is valid
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('[App] Session validation error:', error);
      setUser(null);
      setLoading(false);
    });

    // Subscribe to auth state changes with validation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      SecureLogger.logAuthEvent(event, session?.user?.id);
      
      switch (event) {
        case 'SIGNED_IN':
          // Validate the new session
          if (session?.user) {
            setUser(session.user);
            // Store session timestamp for additional security
            localStorage.setItem('last_auth_check', Date.now().toString());
          }
          break;
          
        case 'SIGNED_OUT':
        case 'TOKEN_REFRESHED':
          if (!session) {
            setUser(null);
            setProfile(null);
            // Clear sensitive data but keep preferences
            localStorage.removeItem('last_auth_check');
          } else if (session.user) {
            setUser(session.user);
          }
          break;
          
        case 'USER_UPDATED':
        case 'PASSWORD_RECOVERY':
          // Force re-authentication for sensitive changes
          if (session?.user) {
            setUser(session.user);
          }
          break;
          
        default:
          setUser(session?.user ?? null);
          if (!session?.user) setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodic session validation - prevents ghost sessions
  useEffect(() => {
    if (!user) return;

    const validateSession = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          SecureLogger.warn('Session invalid, forcing logout', { namespace: 'Security' });
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          window.location.href = '/login?reason=session_expired';
        }
        
        // Update last check timestamp
        localStorage.setItem('last_auth_check', Date.now().toString());
      } catch (err) {
        SecureLogger.error('Session validation failed', err as Error, { namespace: 'Security' });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(validateSession);
  }, [user]);

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
