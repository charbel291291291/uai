import { apiClient } from './apiClient';
import type { AnalyticsEvent, AnalyticsDailySummary, AnalyticsEventType } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface TrackEventData {
  eventType: AnalyticsEventType;
  userId?: string;
  profileId?: string;
  sessionId?: string;
  visitorId?: string;
  data?: Record<string, any>;
  source?: string;
  referrer?: string;
}

export interface AnalyticsFilters {
  eventType?: AnalyticsEventType;
  profileId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

class AnalyticsService {
  private supabase = apiClient.supabase;

  // ==========================================================================
  // EVENT TRACKING
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Track Event
  // --------------------------------------------------------------------------
  async trackEvent(eventData: TrackEventData) {
    try {
      const { data, error } = await this.supabase
        .rpc('track_analytics_event', {
          p_event_type: eventData.eventType,
          p_user_id: eventData.userId || null,
          p_profile_id: eventData.profileId || null,
          p_session_id: eventData.sessionId || null,
          p_visitor_id: eventData.visitorId || null,
          p_data: eventData.data || {},
          p_source: eventData.source || null,
          p_referrer: eventData.referrer || null,
        });

      if (error) throw error;

      return apiClient.createResponse<string>(data, null);
    } catch (error: any) {
      // Silently fail for analytics - don't break user experience
      console.error('Analytics tracking error:', error);
      return apiClient.createResponse<string>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Track Page View
  // --------------------------------------------------------------------------
  async trackPageView(
    page: string,
    visitorId: string,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    return this.trackEvent({
      eventType: 'page_view',
      userId,
      visitorId,
      data: { page, ...metadata },
    });
  }

  // --------------------------------------------------------------------------
  // Track Profile View
  // --------------------------------------------------------------------------
  async trackProfileView(
    profileId: string,
    visitorId: string,
    userId?: string,
    source?: string
  ) {
    return this.trackEvent({
      eventType: 'profile_view',
      profileId,
      userId,
      visitorId,
      source,
    });
  }

  // --------------------------------------------------------------------------
  // Track Chat Started
  // --------------------------------------------------------------------------
  async trackChatStarted(
    profileId: string,
    visitorId: string,
    userId?: string
  ) {
    return this.trackEvent({
      eventType: 'chat_started',
      profileId,
      userId,
      visitorId,
    });
  }

  // --------------------------------------------------------------------------
  // Track CTA Click
  // --------------------------------------------------------------------------
  async trackCTAClick(
    profileId: string,
    ctaType: string,
    visitorId: string,
    userId?: string
  ) {
    return this.trackEvent({
      eventType: 'cta_click',
      profileId,
      userId,
      visitorId,
      data: { cta_type: ctaType },
    });
  }

  // --------------------------------------------------------------------------
  // Track NFC Tap
  // --------------------------------------------------------------------------
  async trackNFCTap(
    profileId: string,
    productType: string,
    visitorId: string
  ) {
    return this.trackEvent({
      eventType: 'nfc_tap',
      profileId,
      visitorId,
      data: { product_type: productType },
    });
  }

  // ==========================================================================
  // ANALYTICS QUERIES
  // ==========================================================================

  // --------------------------------------------------------------------------
  // Get Events
  // --------------------------------------------------------------------------
  async getEvents(filters?: AnalyticsFilters) {
    try {
      let query = this.supabase
        .from('analytics_events')
        .select('*');

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters?.profileId) {
        query = query.eq('profile_id', filters.profileId);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      query = query.order('created_at', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return apiClient.createResponse<AnalyticsEvent[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<AnalyticsEvent[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Profile Analytics
  // --------------------------------------------------------------------------
  async getProfileAnalytics(profileId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('profile_id', profileId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return apiClient.createResponse<AnalyticsEvent[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<AnalyticsEvent[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Daily Summary
  // --------------------------------------------------------------------------
  async getDailySummary(profileId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await this.supabase
        .from('analytics_daily_summary')
        .select('*')
        .eq('profile_id', profileId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      return apiClient.createResponse<AnalyticsDailySummary[]>(data || [], null);
    } catch (error: any) {
      return apiClient.createResponse<AnalyticsDailySummary[]>(null, error);
    }
  }

  // --------------------------------------------------------------------------
  // Aggregate Daily Analytics
  // --------------------------------------------------------------------------
  async aggregateDailyAnalytics(profileId: string, date: string) {
    try {
      const { error } = await this.supabase
        .rpc('aggregate_daily_analytics', {
          p_profile_id: profileId,
          p_date: date,
        });

      if (error) throw error;

      return apiClient.createResponse<boolean>(true, null);
    } catch (error: any) {
      return apiClient.createResponse<boolean>(false, error);
    }
  }

  // --------------------------------------------------------------------------
  // Get Analytics Summary
  // --------------------------------------------------------------------------
  async getAnalyticsSummary(profileId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Use server-side aggregation via RPC to avoid 1000-row Supabase client limit
      const { data, error } = await this.supabase
        .rpc('get_analytics_summary', {
          p_profile_id: profileId,
          p_start_date: startDate.toISOString(),
        });

      if (error) {
        // Fallback: fetch with explicit high limit if RPC not available
        const { data: events, error: fallbackError } = await this.supabase
          .from('analytics_events')
          .select('event_type')
          .eq('profile_id', profileId)
          .gte('created_at', startDate.toISOString())
          .limit(10000);

        if (fallbackError) throw fallbackError;

        const summary = {
          total_events: events?.length || 0,
          page_views: events?.filter(e => e.event_type === 'page_view').length || 0,
          profile_views: events?.filter(e => e.event_type === 'profile_view').length || 0,
          chat_starts: events?.filter(e => e.event_type === 'chat_started').length || 0,
          cta_clicks: events?.filter(e => e.event_type === 'cta_click').length || 0,
          nfc_taps: events?.filter(e => e.event_type === 'nfc_tap').length || 0,
        };
        return apiClient.createResponse(summary, null);
      }

      return apiClient.createResponse(data, null);
    } catch (error: any) {
      return apiClient.createResponse(null, error);
    }
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;

// Export individual functions for convenience
export const {
  trackEvent,
  trackPageView,
  trackProfileView,
  trackChatStarted,
  trackCTAClick,
  trackNFCTap,
  getEvents,
  getProfileAnalytics,
  getDailySummary,
  aggregateDailyAnalytics,
  getAnalyticsSummary,
} = analyticsService;
