import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Package, ShoppingBag, DollarSign, Clock } from 'lucide-react';
import { SEO } from '../../components/SEO';

type Stats = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-white/5 bg-white/[0.02] p-5">
      {loading ? (
        <div className="space-y-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-white/5" />
          <div className="h-8 w-20 animate-pulse rounded-xl bg-white/5" />
          <div className="h-4 w-28 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : (
        <>
          <div className={`mb-4 w-fit rounded-xl bg-white/5 p-2.5 ${color}`}>
            <Icon size={18} />
          </div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-sm text-white/40">{label}</p>
        </>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes, ordersRes, paymentsRes] = await Promise.all([
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('orders')
            .select('total_cents'),
          supabase
            .from('payment_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
        ]);

        const totalRevenue = ((ordersRes.data as { total_cents: number }[] | null) || [])
          .reduce((sum, o) => sum + (o.total_cents || 0), 0);

        setStats({
          totalProducts: productsRes.count ?? 0,
          totalOrders: ordersRes.data?.length ?? 0,
          totalRevenue: totalRevenue / 100,
          pendingPayments: paymentsRes.count ?? 0,
        });
      } catch {
        // Stats are best-effort; silently handle errors
      } finally {
        setLoading(false);
      }
    }

    void fetchStats();
  }, []);

  const cards = [
    {
      label: 'Active Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-400',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-emerald-400',
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-400',
    },
    {
      label: 'Pending Payments',
      value: stats.pendingPayments,
      icon: Clock,
      color: 'text-orange-400',
    },
  ];

  return (
    <>
      <SEO title="Admin Dashboard" description="Store overview and key metrics." type="website" />

      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
            Overview
          </p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Dashboard</h1>
          <p className="text-sm leading-6 text-white/42">
            A quick snapshot of your store's performance.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard key={card.label} loading={loading} {...card} />
          ))}
        </div>
      </div>
    </>
  );
}
