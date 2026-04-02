import { apiClient } from './apiClient';
import type { UserProfile, Service, Testimonial, UserLink } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateProfileData {
  uid: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  themeColor?: string;
  mode?: 'ai' | 'landing' | 'sales';
}

export interface UpdateProfileData {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  themeColor?: string;
  mode?: 'ai' | 'landing' | 'sales';
  services?: Service[];
  testimonials?: Testimonial[];
  links?: UserLink[];
  qaPairs?: Array<{ question: string; answer: string }>;
  aiPersona?: string;
  whatsapp?: string;
  phone?: string;
  isPrivate?: boolean;
}

export interface ProfileFilters {
  isPrivate?: boolean;
  mode?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// PROFILE SERVICE
// ============================================================================

class ProfileService {
  private supabase = apiClient.supabase;

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Create Profile
  // --------------------------------------------------------------------------
  async createProfile(data: CreateProfileData) {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .insert({
          id: data.uid,
          username: data.username.toLowerCase(),
          display_name: data.displayName,
          bio: data.bio || '',
          avatar_url: data.avatarUrl,
          theme_color: data.themeColor || '#3A86FF',
          mode: data.mode || 'ai',
          is_private: false,
        })
        .select()
        .single();

      if (error) throw error;

      return apiClient.createResponse<UserProfile>(profile, null);
    } catch (error: any) {
      return apiClient.createResponse<UserProfile>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Profile by ID
  // --------------------------------------------------------------------------
  async getProfileById(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return apiClient.createResponse<UserProfile>(data, null);
    } catch (error: any) {
      return apiClient.createResponse<UserProfile>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Profile by Username
  // --------------------------------------------------------------------------
  async getProfileByUsername(username: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (error) throw error;

      return apiClient.createResponse<UserProfile>(data, null);
    } catch (error: any) {
      return apiClient.createResponse<UserProfile>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Update Profile
  // --------------------------------------------------------------------------
  async updateProfile(userId: string, data: UpdateProfileData) {
    try {
      const updateData: any = {};

      if (data.username !== undefined) updateData.username = data.username.toLowerCase();
      if (data.displayName !== undefined) updateData.display_name = data.displayName;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.themeColor !== undefined) updateData.theme_color = data.themeColor;
      if (data.mode !== undefined) updateData.mode = data.mode;
      if (data.services !== undefined) updateData.services = data.services;
      if (data.testimonials !== undefined) updateData.testimonials = data.testimonials;
      if (data.links !== undefined) updateData.links = data.links;
      if (data.qaPairs !== undefined) updateData.qa_pairs = data.qaPairs;
      if (data.aiPersona !== undefined) updateData.ai_persona = data.aiPersona;
      if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.isPrivate !== undefined) updateData.is_private = data.isPrivate;

      const { data: profile, error } = await this.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return apiClient.createResponse<UserProfile>(profile, null);
    } catch (error: any) {
      return apiClient.createResponse<UserProfile>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Delete Profile
  // --------------------------------------------------------------------------
  async deleteProfile(userId: string) {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      return apiClient.createResponse<boolean>(true, null);
    } catch (error: any) {
      return apiClient.createResponse<boolean>(false, error);
    }
  }

  // ==========================================================================
  // LIST & SEARCH
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Get All Profiles
  // --------------------------------------------------------------------------
  async getAllProfiles(filters?: ProfileFilters) {
    try {
      let query = this.supabase
        .from('profiles')
        .select('*');

      if (filters?.isPrivate !== undefined) {
        query = query.eq('is_private', filters.isPrivate);
      }

      if (filters?.mode) {
        query = query.eq('mode', filters.mode);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return apiClient.createResponse<UserProfile[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<UserProfile[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Search Profiles
  // --------------------------------------------------------------------------
  async searchProfiles(searchTerm: string, limit: number = 20) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
        .eq('is_private', false)
        .limit(limit);

      if (error) throw error;

      return apiClient.createResponse<UserProfile[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<UserProfile[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Check Username Availability
  // --------------------------------------------------------------------------
  async checkUsernameAvailability(username: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (error) throw error;

      return apiClient.createResponse<boolean>(!data, null);
    } catch (error: any) {
      return apiClient.createResponse<boolean>(false, error);
    }
  }

  // ==========================================================================
  // PROFILE COMPONENTS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Add Service
  // --------------------------------------------------------------------------
  async addService(userId: string, service: Service) {
    try {
      const { data: profile, error: fetchError } = await this.supabase
        .from('profiles')
        .select('services')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const services = [...(profile.services || []), service];

      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ services })
        .eq('id', userId);

      if (updateError) throw updateError;

      return apiClient.createResponse<Service[]>(services, null);
    } catch (error: any) {
      return apiClient.createResponse<Service[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Remove Service
  // --------------------------------------------------------------------------
  async removeService(userId: string, serviceIndex: number) {
    try {
      const { data: profile, error: fetchError } = await this.supabase
        .from('profiles')
        .select('services')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const services = (profile.services || []).filter((_, i) => i !== serviceIndex);

      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ services })
        .eq('id', userId);

      if (updateError) throw updateError;

      return apiClient.createResponse<Service[]>(services, null);
    } catch (error: any) {
      return apiClient.createResponse<Service[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Add Link
  // --------------------------------------------------------------------------
  async addLink(userId: string, link: UserLink) {
    try {
      const { data: profile, error: fetchError } = await this.supabase
        .from('profiles')
        .select('links')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const links = [...(profile.links || []), link];

      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ links })
        .eq('id', userId);

      if (updateError) throw updateError;

      return apiClient.createResponse<UserLink[]>(links, null);
    } catch (error: any) {
      return apiClient.createResponse<UserLink[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Remove Link
  // --------------------------------------------------------------------------
  async removeLink(userId: string, linkIndex: number) {
    try {
      const { data: profile, error: fetchError } = await this.supabase
        .from('profiles')
        .select('links')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const links = (profile.links || []).filter((_, i) => i !== linkIndex);

      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ links })
        .eq('id', userId);

      if (updateError) throw updateError;

      return apiClient.createResponse<UserLink[]>(links, null);
    } catch (error: any) {
      return apiClient.createResponse<UserLink[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Add Testimonial
  // --------------------------------------------------------------------------
  async addTestimonial(userId: string, testimonial: Testimonial) {
    try {
      const { data: profile, error: fetchError } = await this.supabase
        .from('profiles')
        .select('testimonials')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const testimonials = [...(profile.testimonials || []), testimonial];

      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ testimonials })
        .eq('id', userId);

      if (updateError) throw updateError;

      return apiClient.createResponse<Testimonial[]>(testimonials, null);
    } catch (error: any) {
      return apiClient.createResponse<Testimonial[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Upload Avatar
  // --------------------------------------------------------------------------
  async uploadAvatar(userId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return apiClient.createResponse<string>(publicUrl, null);
    } catch (error: any) {
      return apiClient.createResponse<string>(null, error);
    }
  }

  // ==========================================================================
  // STATS & ANALYTICS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Get Profile Stats
  // --------------------------------------------------------------------------
  async getProfileStats(userId: string) {
    try {
      // Get message count
      const { count: messageCount, error: messageError } = await this.supabase
        .from('messages')
        .select('count', { count: 'exact' })
        .eq('profile_id', userId);

      // Get leads count
      const { count: leadsCount, error: leadsError } = await this.supabase
        .from('leads')
        .select('count', { count: 'exact' })
        .eq('profile_id', userId);

      if (messageError || leadsError) {
        throw messageError || leadsError;
      }

      const stats = {
        messages: messageCount || 0,
        leads: leadsCount || 0,
      };

      return apiClient.createResponse(stats, null);
    } catch (error: any) {
      return apiClient.createResponse(null, error);
    }
  }
}

// Singleton instance
const profileService = new ProfileService();
export default profileService;

// Export individual functions for convenience
export const {
  createProfile,
  getProfileById,
  getProfileByUsername,
  updateProfile,
  deleteProfile,
  getAllProfiles,
  searchProfiles,
  checkUsernameAvailability,
  addService,
  removeService,
  addLink,
  removeLink,
  addTestimonial,
  uploadAvatar,
  getProfileStats,
} = profileService;
