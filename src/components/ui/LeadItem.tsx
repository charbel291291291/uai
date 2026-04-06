import { Phone, MessageCircle, Clock, User } from 'lucide-react';

export type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  message?: string;
  status: LeadStatus;
  created_at: string;
  profile_id: string;
}

const STATUS_STYLES: Record<LeadStatus, { label: string; className: string }> = {
  new:       { label: 'New',       className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  contacted: { label: 'Contacted', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  converted: { label: 'Converted', className: 'bg-green-500/15 text-green-400 border-green-500/20' },
  lost:      { label: 'Lost',      className: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

interface LeadItemProps {
  lead: Lead;
  onStatusChange?: (id: string, status: LeadStatus) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function LeadItem({ lead, onStatusChange }: LeadItemProps) {
  const statusStyle = STATUS_STYLES[lead.status];

  return (
    <div className="group flex flex-col gap-3 rounded-[20px] border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 sm:flex-row sm:items-start">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8 text-white/50">
        <User size={18} />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white">{lead.name}</span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle.className}`}
          >
            {statusStyle.label}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-3 text-sm text-white/45">
          <span className="flex items-center gap-1">
            <Phone size={12} />
            {lead.phone}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {timeAgo(lead.created_at)}
          </span>
        </div>

        {lead.message && (
          <p className="mt-2 line-clamp-2 text-sm text-white/50">{lead.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <a
          href={`tel:${lead.phone}`}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-colors hover:text-white"
          aria-label={`Call ${lead.name}`}
        >
          <Phone size={14} />
        </a>
        <a
          href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-colors hover:text-[#25D366]"
          aria-label={`WhatsApp ${lead.name}`}
        >
          <MessageCircle size={14} />
        </a>

        {onStatusChange && (
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
            className="h-8 rounded-xl border border-white/10 bg-[#0a0f1e] px-2 text-xs text-white/60 focus:outline-none focus:border-white/20"
            aria-label="Change lead status"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        )}
      </div>
    </div>
  );
}

// ─── Lead list with filter tabs ──────────────────────────────────────────────
interface LeadListProps {
  leads: Lead[];
  loading?: boolean;
  onStatusChange?: (id: string, status: LeadStatus) => void;
}

const ALL_STATUSES: Array<{ value: LeadStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
];

export function LeadList({ leads, loading = false, onStatusChange }: LeadListProps) {
  const [activeFilter, setActiveFilter] = React.useState<LeadStatus | 'all'>('all');

  const filtered = activeFilter === 'all' ? leads : leads.filter((l) => l.status === activeFilter);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-[20px] bg-white/[0.02]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ALL_STATUSES.map((s) => {
          const count = s.value === 'all' ? leads.length : leads.filter((l) => l.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setActiveFilter(s.value)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeFilter === s.value
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {s.label}
              <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 text-3xl">👥</div>
          <p className="text-sm text-white/40">No leads in this category</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <LeadItem key={lead.id} lead={lead} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

// Need React import for useState
import React from 'react';
