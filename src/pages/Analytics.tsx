import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, MousePointerClick, MessageCircle, Nfc, Users, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../App';
import { supabase } from '../supabase';
import { StatCard } from '../components/ui/Card';
import { AreaChartCard, BarChartCard, InsightCard } from '../components/ui/ChartCard';
import { ActivityFeed, type ActivityEvent } from '../components/ui/ActivityFeed';
import { SEO } from '../components/SEO';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalyticsSummary {
  total_events: number;
  profile_views: number;
  cta_clicks: number;
  chat_starts: number;
  nfc_taps: number;
  link_clicks: number;
  unique_visitors: number;
}

interface TimeseriesRow {
  day: string;
  count: number;
}

const PERIOD_OPTIONS = [
  { label: '7 days',  value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Analytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(30);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [viewsTs, setViewsTs] = useState<Record<string, string | number>[]>([]);
  const [ctaTs, setCtaTs] = useState<Record<string, string | number>[]>([]);
  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const run = async () => {
      try {
        const [summaryRes, viewsRes, ctaRes, eventsRes] = await Promise.all([
          // Server-side aggregate — no row limit
          supabase.rpc('get_profile_analytics_summary', {
            p_profile_id: user.id,
            p_days: period,
          }),
          supabase.rpc('get_profile_analytics_timeseries', {
            p_profile_id: user.id,
            p_days: period,
            p_event_type: 'profile_view',
          }),
          supabase.rpc('get_profile_analytics_timeseries', {
            p_profile_id: user.id,
            p_days: period,
            p_event_type: 'cta_click',
          }),
          // Recent raw events for the activity feed
          supabase
            .from('analytics_events')
            .select('id, event_type, created_at, metadata')
            .eq('profile_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        if (summaryRes.data) setSummary(summaryRes.data as AnalyticsSummary);

        const fmt = (rows: TimeseriesRow[] | null) =>
          (rows || []).map((r) => ({
            day: new Date(r.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count: Number(r.count),
          }));

        setViewsTs(fmt(viewsRes.data || []));
        setCtaTs(fmt(ctaRes.data || []));

        // Map raw events → ActivityEvent
        const mapped: ActivityEvent[] = ((eventsRes.data as any[] | null) || []).map((e) => ({
          id: e.id,
          type: e.event_type as ActivityEvent['type'],
          label: eventLabel(e.event_type, e.metadata),
          time: timeAgo(e.created_at),
          meta: e.metadata?.source || undefined,
        }));
        setRecentEvents(mapped);
      } catch {
        // Non-fatal — analytics are best-effort
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [user?.id, period]);

  const conversionRate =
    summary && summary.profile_views > 0
      ? ((summary.cta_clicks / summary.profile_views) * 100).toFixed(1)
      : '0.0';

  const insights = buildInsights(summary, conversionRate);

  return (
    <>
      <SEO title="Analytics | eyedeaz" description="Profile performance insights." type="website" />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
              Performance
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Analytics
            </h1>
          </motion.div>

          {/* Period selector */}
          <div className="flex gap-1.5 rounded-2xl border border-white/8 bg-white/[0.02] p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  period === opt.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Profile Views"
            value={loading ? '—' : (summary?.profile_views ?? 0).toLocaleString()}
            icon={<Eye size={16} />}
          />
          <StatCard
            label="Unique Visitors"
            value={loading ? '—' : (summary?.unique_visitors ?? 0).toLocaleString()}
            icon={<Users size={16} />}
          />
          <StatCard
            label="CTA Clicks"
            value={loading ? '—' : (summary?.cta_clicks ?? 0).toLocaleString()}
            icon={<MousePointerClick size={16} />}
          />
          <StatCard
            label="Conversion"
            value={loading ? '—' : `${conversionRate}%`}
            icon={<TrendingUp size={16} />}
            trend={
              summary
                ? { value: parseFloat(conversionRate), isPositive: parseFloat(conversionRate) >= 5 }
                : undefined
            }
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
              <MessageCircle size={15} className="text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{loading ? '—' : summary?.chat_starts ?? 0}</p>
              <p className="text-xs text-white/35">Chats</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10">
              <Nfc size={15} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{loading ? '—' : summary?.nfc_taps ?? 0}</p>
              <p className="text-xs text-white/35">NFC Taps</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10">
              <Zap size={15} className="text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{loading ? '—' : summary?.link_clicks ?? 0}</p>
              <p className="text-xs text-white/35">Link Clicks</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <AreaChartCard
            title="Profile Views"
            subtitle={`Last ${period} days`}
            data={viewsTs}
            dataKey="count"
            xKey="day"
            color="#3A86FF"
            height={180}
          />
          <BarChartCard
            title="CTA Clicks"
            subtitle={`Last ${period} days`}
            data={ctaTs}
            dataKey="count"
            xKey="day"
            color="#10B981"
            height={180}
          />
        </div>

        {/* Insights + Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* AI Insights */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/35">
              Insights
            </h2>
            {insights.length > 0 ? (
              insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-white/35">
                Insights appear after you collect more data.
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/35">
              Recent Activity
            </h2>
            <ActivityFeed events={recentEvents} loading={loading} maxItems={8} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function eventLabel(type: string, meta: Record<string, unknown>): string {
  const labels: Record<string, string> = {
    profile_view:  'Someone viewed your profile',
    cta_click:     `CTA clicked${meta?.cta_type ? `: ${meta.cta_type}` : ''}`,
    chat_started:  'New AI chat started',
    nfc_tap:       'NFC card tapped',
    link_click:    `Link clicked${meta?.title ? `: ${meta.title}` : ''}`,
    lead_captured: 'Lead captured',
  };
  return labels[type] || type.replace(/_/g, ' ');
}

function timeAgo(dateStr: string): string {
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function buildInsights(s: AnalyticsSummary | null, rate: string): string[] {
  if (!s || s.profile_views === 0) return [];
  const out: string[] = [];
  const r = parseFloat(rate);

  if (r >= 10) out.push(`🔥 Your conversion rate is ${rate}% — well above the 5% average. Your CTAs are working.`);
  else if (r < 2) out.push(`📢 Conversion rate is ${rate}%. Try making your primary CTA more prominent.`);

  if (s.nfc_taps > s.profile_views * 0.3)
    out.push(`📲 ${Math.round((s.nfc_taps / s.profile_views) * 100)}% of views come from NFC taps — your card is performing well.`);

  if (s.chat_starts > 0)
    out.push(`💬 ${s.chat_starts} people started a chat — your AI twin is engaging visitors.`);

  if (s.unique_visitors > 0 && s.profile_views > s.unique_visitors * 1.5)
    out.push(`🔁 Returning visitors: some people are coming back to your profile.`);

  return out;
}
