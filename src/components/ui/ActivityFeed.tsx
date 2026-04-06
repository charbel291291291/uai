import { motion } from 'motion/react';
import { Eye, MousePointerClick, MessageCircle, Nfc, Users, TrendingUp } from 'lucide-react';

export type ActivityEventType =
  | 'profile_view'
  | 'cta_click'
  | 'chat_started'
  | 'nfc_tap'
  | 'lead_captured'
  | 'link_click';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  label: string;
  time: string;
  meta?: string;
}

const EVENT_META: Record<ActivityEventType, { icon: React.ComponentType<{ size?: number; className?: string }>, color: string, bg: string }> = {
  profile_view:  { icon: Eye,              color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  cta_click:     { icon: MousePointerClick, color: 'text-green-400',  bg: 'bg-green-500/10' },
  chat_started:  { icon: MessageCircle,    color: 'text-purple-400', bg: 'bg-purple-500/10' },
  nfc_tap:       { icon: Nfc,              color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  lead_captured: { icon: Users,            color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  link_click:    { icon: TrendingUp,       color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

interface ActivityFeedProps {
  events: ActivityEvent[];
  loading?: boolean;
  maxItems?: number;
}

export function ActivityFeed({ events, loading = false, maxItems = 8 }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/5" />
              <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 text-4xl">📊</div>
        <p className="text-sm font-medium text-white/40">No activity yet</p>
        <p className="mt-1 text-xs text-white/25">Events will appear here as visitors interact with your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.slice(0, maxItems).map((event, i) => {
        const meta = EVENT_META[event.type];
        const Icon = meta.icon;
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 transition-colors hover:border-white/10"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
              <Icon size={15} className={meta.color} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white/80">{event.label}</p>
              {event.meta && (
                <p className="truncate text-xs text-white/35">{event.meta}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-white/30">{event.time}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
