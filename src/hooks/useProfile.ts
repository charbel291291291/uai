import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services';
import type { UserProfile, Service, Testimonial, UserLink } from '../types';

// ============================================================================
// USE PROFILE HOOK
// ============================================================================

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string | null>;
}

export function useProfile(userId: string | undefined): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await profileService.getProfileById(userId);
      
      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error: serviceError } = await profileService.updateProfile(userId, {
        username: data.username,
        displayName: data.displayName,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        themeColor: data.themeColor,
        mode: data.mode,
        services: data.services,
        testimonials: data.testimonials,
        links: data.links,
        qaPairs: data.qaPairs,
        aiPersona: data.aiPersona,
        whatsapp: data.whatsapp,
        phone: data.phone,
        isPrivate: data.isPrivate,
      });

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      await fetchProfile();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [userId, fetchProfile]);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!userId) return null;

    try {
      const { data, error: serviceError } = await profileService.uploadAvatar(userId, file);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [userId]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
    uploadAvatar,
  };
}

// ============================================================================
// USE PUBLIC PROFILE HOOK - For viewing other users' profiles
// ============================================================================

interface UsePublicProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePublicProfile(username: string | undefined): UsePublicProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await profileService.getProfileByUsername(username);
      
      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}

// ============================================================================
// USE PROFILE SEARCH HOOK
// ============================================================================

interface UseProfileSearchReturn {
  profiles: UserProfile[];
  loading: boolean;
  error: string | null;
  search: (term: string) => Promise<void>;
}

export function useProfileSearch(): UseProfileSearchReturn {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setProfiles([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await profileService.searchProfiles(term);
      
      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setProfiles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profiles,
    loading,
    error,
    search,
  };
}

// ============================================================================
// USE USERNAME AVAILABILITY HOOK
// ============================================================================

interface UseUsernameAvailabilityReturn {
  isAvailable: boolean | null;
  checking: boolean;
  checkAvailability: (username: string) => Promise<void>;
}

export function useUsernameAvailability(): UseUsernameAvailabilityReturn {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkAvailability = useCallback(async (username: string) => {
    if (!username.trim()) {
      setIsAvailable(null);
      return;
    }

    try {
      setChecking(true);
      const { data, error } = await profileService.checkUsernameAvailability(username);
      
      if (error) {
        setIsAvailable(false);
        return;
      }

      setIsAvailable(data);
    } finally {
      setChecking(false);
    }
  }, []);

  return {
    isAvailable,
    checking,
    checkAvailability,
  };
}
