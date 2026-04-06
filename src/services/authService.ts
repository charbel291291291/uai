import { apiClient } from './apiClient';
import type { User, AuthError } from '@supabase/supabase-js';
import { isValidEmail, isPasswordStrong, isValidUsername } from '../utils/security';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
  success: boolean;
  rateLimit?: {
    remaining: number;
    resetTime: number | null;
  };
}

export interface SignUpData {
  email: string;
  password: string;
  metadata?: {
    displayName?: string;
    username?: string;
  };
}

export interface SignInData {
  email: string;
  password: string;
}

export interface OAuthProvider {
  provider: 'google' | 'github' | 'twitter' | 'discord';
  redirectTo?: string;
}

// ============================================================================
// AUTH SERVICE - With security enhancements
// ============================================================================

class AuthService {
  private supabase = apiClient.supabase;

  /**
   * Generate unique identifier for rate limiting
   */
  private getIdentifier(email?: string): string {
    if (email) {
      return `auth:${email.toLowerCase().trim()}`;
    }
    // Fallback to IP + user agent hash (client-side approximation)
    const fingerprint = typeof navigator !== 'undefined' 
      ? `${navigator.userAgent}${navigator.language}`
      : 'unknown';
    return `auth:${fingerprint}`;
  }

  // --------------------------------------------------------------------------
  // Sign Up - With validation and rate limiting
  // --------------------------------------------------------------------------
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const identifier = this.getIdentifier(data.email);

    const result = await apiClient.executeWithSecurity(
      async () => {
        if (!isValidEmail(data.email)) {
          throw new Error('Invalid email address');
        }

        const passwordCheck = isPasswordStrong(data.password);
        if (!passwordCheck.valid) {
          throw new Error(passwordCheck.issues.join('. '));
        }

        if (data.metadata?.username && !isValidUsername(data.metadata.username)) {
          throw new Error('Username must be 3-20 characters, alphanumeric and underscores only');
        }

        const sanitizedMetadata = data.metadata ? apiClient.sanitizeInput(data.metadata) : undefined;

        const { data: authData, error } = await this.supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: sanitizedMetadata },
        });

        if (error) throw error;
        return { user: authData.user };
      },
      { identifier, endpointType: 'auth', validateInput: { email: data.email }, isSensitive: true }
    );

    return {
      user: result.data?.user ?? null,
      error: result.error as AuthError | null,
      success: result.success,
      rateLimit: result.rateLimit,
    };
  }

  // --------------------------------------------------------------------------
  // Sign In with Email/Password - With brute force protection
  // --------------------------------------------------------------------------
  async signIn(data: SignInData): Promise<AuthResponse> {
    const identifier = this.getIdentifier(data.email);

    const result = await apiClient.executeWithSecurity(
      async () => {
        if (!isValidEmail(data.email)) {
          throw new Error('Invalid email address');
        }

        const { data: authData, error } = await this.supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;
        return { user: authData.user };
      },
      { identifier, endpointType: 'auth', validateInput: { email: data.email }, isSensitive: true }
    );

    return {
      user: result.data?.user ?? null,
      error: result.error as AuthError | null,
      success: result.success,
      rateLimit: result.rateLimit,
    };
  }

  // --------------------------------------------------------------------------
  // Sign In with OAuth - Lighter security (OAuth provider handles protection)
  // --------------------------------------------------------------------------
  async signInWithOAuth(provider: OAuthProvider): Promise<{ url: string | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: provider.provider,
        options: {
          // Use origin only — AppShell reads auth_redirect from localStorage to restore destination
      redirectTo: provider.redirectTo || window.location.origin,
        },
      });

      if (error) throw error;

      return {
        url: data.url,
        error: null,
      };
    } catch (error: any) {
      return {
        url: null,
        error,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Sign Out
  // --------------------------------------------------------------------------
  async signOut(): Promise<{ error: AuthError | null; success: boolean }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      return {
        error: null,
        success: true,
      };
    } catch (error: any) {
      return {
        error,
        success: false,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Get Current Session
  // --------------------------------------------------------------------------
  async getSession(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) throw error;

      return {
        user: session?.user || null,
        error: null,
      };
    } catch (error: any) {
      return {
        user: null,
        error,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Get Current User
  // --------------------------------------------------------------------------
  async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;

      return {
        user,
        error: null,
      };
    } catch (error: any) {
      return {
        user: null,
        error,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Reset Password - Very strict rate limiting
  // --------------------------------------------------------------------------
  async resetPassword(email: string): Promise<{ error: AuthError | null; success: boolean }> {
    const identifier = this.getIdentifier(email);

    const result = await apiClient.executeWithSecurity(
      async () => {
        if (!isValidEmail(email)) {
          throw new Error('Invalid email address');
        }

        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        return { success: true };
      },
      {
        identifier,
        endpointType: 'passwordReset',
        validateInput: { email },
        isSensitive: true,
      }
    );

    return {
      error: result.error as AuthError | null,
      success: result.success,
    };
  }

  // --------------------------------------------------------------------------
  // Update Password - Protected operation
  // --------------------------------------------------------------------------
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null; success: boolean }> {
    try {
      // Validate password strength
      const passwordCheck = isPasswordStrong(newPassword);
      if (!passwordCheck.valid) {
        throw new Error(passwordCheck.issues.join('. '));
      }

      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        error: null,
        success: true,
      };
    } catch (error: any) {
      return {
        error,
        success: false,
      };
    }
  }

  // --------------------------------------------------------------------------
  // Update User Metadata
  // --------------------------------------------------------------------------
  async updateMetadata(metadata: Record<string, any>): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      // Sanitize metadata
      const sanitizedMetadata = apiClient.sanitizeInput(metadata);

      const { data: { user }, error } = await this.supabase.auth.updateUser({
        data: sanitizedMetadata,
      });

      if (error) throw error;

      return {
        user,
        error: null,
      };
    } catch (error: any) {
      return {
        user: null,
        error,
      };
    }
  }

  // --------------------------------------------------------------------------
  // On Auth State Change
  // --------------------------------------------------------------------------
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(callback);
    return subscription;
  }

  // --------------------------------------------------------------------------
  // Refresh Session
  // --------------------------------------------------------------------------
  async refreshSession(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession();
      if (error) throw error;

      return {
        user: session?.user || null,
        error: null,
      };
    } catch (error: any) {
      return {
        user: null,
        error,
      };
    }
  }
}

// Singleton instance
const authService = new AuthService();
export default authService;

// Export individual functions for convenience
export const {
  signUp,
  signIn,
  signInWithOAuth,
  signOut,
  getSession,
  getCurrentUser,
  resetPassword,
  updatePassword,
  updateMetadata,
  onAuthStateChange,
  refreshSession,
} = authService;
