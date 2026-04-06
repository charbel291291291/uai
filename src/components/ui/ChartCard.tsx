import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Shared tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({
  active, payload, label, prefix = '', suffix = '',
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0f1e]/95 px-4 py-3 backdrop-blur-xl shadow-xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
          {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

// ─── Area Chart Card ─────────────────────────────────────────────────────────
interface AreaChartCardProps {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  xKey: string;
  color?: string;
  prefix?: string;
  suffix?: string;
  height?: number;
}

export function AreaChartCard({
  title, subtitle, data, dataKey, xKey,
  color = '#3A86FF', prefix = '', suffix = '', height = 200,
}: AreaChartCardProps) {
  const gradientId = `grad-${dataKey}`;
  return (
    <div className="rounded-[28px] border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">{subtitle}</p>
        <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip prefix={prefix} suffix={suffix} />}
            cursor={{ stroke: 'rgba(255,255,255,0.06)' }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: 'rgba(0,0,0,0.5)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Bar Chart Card ──────────────────────────────────────────────────────────
interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  xKey: string;
  color?: string;
  prefix?: string;
  suffix?: string;
  height?: number;
}

export function BarChartCard({
  title, subtitle, data, dataKey, xKey,
  color = '#3A86FF', prefix = '', suffix = '', height = 200,
}: BarChartCardProps) {
  return (
    <div className="rounded-[28px] border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">{subtitle}</p>
        <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip prefix={prefix} suffix={suffix} />}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[6, 6, 0, 0]}
            fillOpacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────
interface InsightCardProps {
  insight: string;
  icon?: React.ReactNode;
}

export function InsightCard({ insight, icon }: InsightCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#3A86FF]/15 bg-[#3A86FF]/5 px-4 py-3">
      <div className="mt-0.5 shrink-0 text-[#3A86FF]">{icon ?? '💡'}</div>
      <p className="text-sm leading-6 text-white/70">{insight}</p>
    </div>
  );
}
