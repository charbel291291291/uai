import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './supabase';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Navbar from './components/Navbar';
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
  setTheme: () => {} 
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [theme, setThemeState] = useState<NeonTheme>('electric-blue');

  const setTheme = (newTheme: NeonTheme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setIsConfigured(false);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('Supabase Auth Error:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isConfigured) {
      // Fetch profile
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
          } else {
            setProfile(data as UserProfile);
          }
        } catch (err) {
          console.error('Profile Fetch Error:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();

      // Subscribe to profile changes
      const channel = supabase
        .channel(`profile:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setProfile(payload.new as UserProfile);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isConfigured]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-brand-bg text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Supabase Not Configured</h1>
          <p className="text-brand-gray-light mb-8">
            Please set the <code className="bg-white/10 px-1.5 py-0.5 rounded text-brand-cyan">VITE_SUPABASE_URL</code> and <code className="bg-white/10 px-1.5 py-0.5 rounded text-brand-cyan">VITE_SUPABASE_ANON_KEY</code> environment variables in the Settings menu to continue.
          </p>
          <div className="text-sm text-brand-gray-soft italic">
            Note: You can find these in your Supabase Project Settings under API.
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, theme, setTheme }}>
      <Router>
        <div className="min-h-screen transition-colors duration-500 bg-brand-bg text-brand-text selection:bg-brand-accent/30">
          <Navbar />
          <main className="pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  loading ? (
                    <div className="flex items-center justify-center h-[60vh]">
                      <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : user ? <Dashboard /> : <Navigate to="/login" />
                } 
              />
              <Route path="/p/:username" element={<Profile />} />
              <Route path="/:username" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
