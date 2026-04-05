import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { supabase } from '../supabase';

/**
 * Reliable admin role hook.
 * Fetches role independently so it isn't blocked by AuthContext's profile
 * loading timing (which resolves loading before profile is fetched).
 */
export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (!cancelled) {
          setIsAdmin(data?.role === 'admin');
        }
      } catch {
        // Role check failed — treat as non-admin
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { isAdmin, loading };
}
