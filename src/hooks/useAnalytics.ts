import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services';
import type { AnalyticsEvent, AnalyticsDailySummary, AnalyticsEventType } from '../types';

// ============================================================================
// USE ANALYTICS HOOK
// ============================================================================

interface UseAnalyticsReturn {
  events: AnalyticsEvent[];
  loading: boolean;
  error: string | null;
  trackEvent: (eventType: AnalyticsEventType, data?: Record<string, any>) => Promise<void>;
  trackPageView: (page: string, metadata?: Record<string, any>) => Promise<void>;
  trackProfileView: (profileId: string, source?: string) => Promise<void>;
  trackChatStarted: (profileId: string) => Promise<void>;
  trackCTAClick: (profileId: string, ctaType: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAnalytics(
  profileId?: string,
  visitorId?: string,
  userId?: string
): UseAnalyticsReturn {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await analyticsService.getProfileAnalytics(profileId, 30);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setEvents(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const trackEvent = useCallback(async (eventType: AnalyticsEventType, data?: Record<string, any>) => {
    try {
      await analyticsService.trackEvent({
        eventType,
        profileId,
        userId,
        visitorId,
        data,
      });
    } catch (err) {
      // Silently fail for analytics
      console.error('Track event error:', err);
    }
  }, [profileId, userId, visitorId]);

  const trackPageView = useCallback(async (page: string, metadata?: Record<string, any>) => {
    await analyticsService.trackPageView(page, visitorId || 'anonymous', userId, metadata);
  }, [visitorId, userId]);

  const trackProfileView = useCallback(async (targetProfileId: string, source?: string) => {
    await analyticsService.trackProfileView(targetProfileId, visitorId || 'anonymous', userId, source);
  }, [visitorId, userId]);

  const trackChatStarted = useCallback(async (targetProfileId: string) => {
    await analyticsService.trackChatStarted(targetProfileId, visitorId || 'anonymous', userId);
  }, [visitorId, userId]);

  const trackCTAClick = useCallback(async (targetProfileId: string, ctaType: string) => {
    await analyticsService.trackCTAClick(targetProfileId, ctaType, visitorId || 'anonymous', userId);
  }, [visitorId, userId]);

  return {
    events,
    loading,
    error,
    trackEvent,
    trackPageView,
    trackProfileView,
    trackChatStarted,
    trackCTAClick,
    refetch: fetchEvents,
  };
}

// ============================================================================
// USE ANALYTICS SUMMARY HOOK
// ============================================================================

interface UseAnalyticsSummaryReturn {
  summary: {
    total_events: number;
    page_views: number;
    profile_views: number;
    chat_starts: number;
    cta_clicks: number;
    nfc_taps: number;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAnalyticsSummary(profileId: string, days: number = 30): UseAnalyticsSummaryReturn {
  const [summary, setSummary] = useState<{
    total_events: number;
    page_views: number;
    profile_views: number;
    chat_starts: number;
    cta_clicks: number;
    nfc_taps: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await analyticsService.getAnalyticsSummary(profileId, days);

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId, days]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}

// ============================================================================
// USE DAILY ANALYTICS HOOK
// ============================================================================

interface UseDailyAnalyticsReturn {
  dailyData: AnalyticsDailySummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDailyAnalytics(
  profileId: string,
  startDate: string,
  endDate: string
): UseDailyAnalyticsReturn {
  const [dailyData, setDailyData] = useState<AnalyticsDailySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: serviceError } = await analyticsService.getDailySummary(
        profileId,
        startDate,
        endDate
      );

      if (serviceError) {
        throw new Error(serviceError.message);
      }

      setDailyData(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId, startDate, endDate]);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  return {
    dailyData,
    loading,
    error,
    refetch: fetchDailyData,
  };
}
