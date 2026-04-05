import { useEffect, useMemo, useState } from 'react';
import { PackageSearch, Search } from 'lucide-react';
import { supabase } from '../supabase';
import { SEO } from '../components/SEO';

type Product = {
  name: string;
};

type OrderItem = {
  quantity: number;
  products: Product | Product[] | null;
};

type Profile = {
  display_name?: string;
};

type Order = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  profiles: Profile | Profile[] | null;
  order_items: OrderItem[];
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(*),
        order_items(
          *,
          products(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      console.log(JSON.stringify(data, null, 2));
      setOrders((data || []) as Order[]);
    }

    setLoading(false);
  };

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const query = search.toLowerCase();
    return orders.filter((order) => order.id.toLowerCase().includes(query));
  }, [orders, search]);

  const getProfileName = (profiles: Order['profiles']) => {
    if (Array.isArray(profiles)) return profiles[0]?.display_name || 'Unknown';
    return profiles?.display_name || 'Unknown';
  };

  return (
    <>
      <SEO title="Admin Orders" description="Review customer orders from the admin panel." type="website" />

      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Orders</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Order overview</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/42 sm:text-base">
            Review recent orders, scan purchased items, and keep fulfillment visibility in one place.
          </p>
        </header>

        <section className="rounded-[28px] border border-white/5 bg-white/[0.02] p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">All orders</h2>
              <p className="text-sm text-white/38">Search by order ID and inspect purchased products quickly.</p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order ID"
                className="w-full rounded-2xl border border-white/5 bg-white/[0.02] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/10"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/[0.02]" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <PackageSearch className="mb-4 text-white/25" size={36} />
              <h3 className="text-lg font-semibold text-white">No orders found</h3>
              <p className="mt-2 max-w-sm text-sm text-white/40">Try another ID or come back when new orders arrive.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <article key={order.id} className="rounded-[24px] border border-white/5 bg-white/[0.02] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/30">Order ID</p>
                      <h3 className="break-all text-base font-semibold text-white">{order.id}</h3>
                      <p className="text-sm text-white/40">User: {getProfileName(order.profiles)}</p>
                    </div>

                    <div className="space-y-2 text-left lg:text-right">
                      <span className="inline-flex rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-white/65">
                        {order.status}
                      </span>
                      <p className="text-sm text-white/40">{new Date(order.created_at).toLocaleString()}</p>
                      <p className="text-lg font-semibold text-white">${(order.total_cents / 100).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/5 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {order.order_items?.map((item, index) => {
                        const name = Array.isArray(item.products)
                          ? item.products.map((product) => product.name).join(', ')
                          : item.products?.name || 'Product';

                        return (
                          <span key={`${order.id}-${index}`} className="rounded-full bg-white/[0.03] px-3 py-1.5 text-xs text-white/55">
                            {name} x {item.quantity}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
