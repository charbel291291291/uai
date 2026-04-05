import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { supabase } from './supabase';
import { cartService } from './services/ecommerceService';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import InstallBanner from './components/InstallBanner';
import { LangProvider } from './hooks/useLang';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { UserProfile } from './types';
import LazyPageWrapper, { PageLoadingFallback } from './pages/LazyPages';

// ============================================================================
// LAZY LOADED PAGES (Code Splitting)
// Each page is loaded on-demand when route is accessed
// ============================================================================

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/DashboardNew'));
const Profile = lazy(() => import('./pages/ProfileNew'));
const Explore = lazy(() => import('./pages/Explore'));
const Login = lazy(() => import('./pages/Login'));
const Shop = lazy(() => import('./pages/Shop'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminNFC = lazy(() => import('./pages/AdminNFC'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));

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

// ============================================================================
// OPTIMIZED APP SHELL WITH SUSPENSE
// ============================================================================

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
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shop" element={<Shop />} />
            
            {/* Protected routes with lazy loading */}
            <Route
              path="/checkout"
              element={
                <AuthGate>
                  <Checkout />
                </AuthGate>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <AuthGate>
                  <CheckoutSuccess />
                </AuthGate>
              }
            />
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
            <Route
              path="/admin/orders"
              element={
                <AuthGate>
                  <AdminOrders />
                </AuthGate>
              }
            />
            <Route path="/p/:username" element={<Profile />} />
            <Route path="/:username" element={<Profile />} />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
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

// ============================================================================
// AUTH GUARD WITH OPTIMIZED LOADING
// ============================================================================

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Suspense>
    );
  }
  if (user) {
    return <>{children}</>;
  }

  const redirectPath = `${location.pathname}${location.search}${location.hash}`;

  return <Navigate to={`/login?redirect=${encodeURIComponent(redirectPath)}`} replace />;
}

// ============================================================================
// ROOT APP COMPONENT
// ============================================================================

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

  // Initialize Supabase and session
  useEffect(() => {
    const url  = import.meta.env.VITE_SUPABASE_URL;
    const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key) { 
      setIsConfigured(false); 
      setLoading(false); 
      return; 
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await cartService.syncCartAfterLogin(session.user.id);
      }
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile
  useEffect(() => {
    if (!user || !isConfigured) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (error) {
          console.warn('[AppOptimized] Failed to fetch profile:', error);
          return;
        }
        if (data) setProfile(data as UserProfile);
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

  // Configuration error state
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
