import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import { 
  authService, 
  profileService,
  signInWithOAuth as signInWithOAuthService,
  signOut as signOutService,
  getSession as getSessionService,
  onAuthStateChange,
} from '../services';
import type { UserProfile } from '../types';

// ============================================================================
// AUTH CONTEXT
// ============================================================================

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithOAuth: (provider: 'google' | 'github' | 'twitter' | 'discord') => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// AUTH PROVIDER HOOK
// ============================================================================

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await profileService.getProfileById(userId);
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    setProfile(data);
  }, []);

  // Initial session check
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const { user: currentUser, error: sessionError } = await getSessionService();
        
        if (sessionError) {
          throw sessionError;
        }

        setUser(currentUser);
        
        if (currentUser?.id) {
          await fetchProfile(currentUser.id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  // Listen for auth state changes
  useEffect(() => {
    const subscription = onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser?.id) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in with OAuth
  const signInWithOAuth = useCallback(async (provider: 'google' | 'github' | 'twitter' | 'discord') => {
    try {
      setError(null);
      const { url, error: oauthError } = await signInWithOAuthService({ 
        provider,
        redirectTo: `${window.location.origin}/dashboard`,
      });
      
      if (oauthError) throw oauthError;
      if (url) window.location.href = url;
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setError(null);
      const { error: signOutError } = await signOutService();
      if (signOutError) throw signOutError;
      
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Refresh profile manually
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  return {
    user,
    profile,
    loading,
    error,
    signInWithOAuth,
    signOut,
    refreshProfile,
  };
}

// ============================================================================
// USE AUTH HOOK
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// AUTH PROVIDER COMPONENT
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// ============================================================================
// AUTHENTICATED HOOK - For protected routes
// ============================================================================

export function useAuthenticated() {
  const { user, loading } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  };
}
