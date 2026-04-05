import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../App';
import { supabase } from '../supabase';
import { useNFCOrdersAdmin } from '../hooks/useNFCOrders';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SEO } from '../components/SEO';
import { checkIsAdmin } from '../config/admin';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'orange';
    case 'confirmed':
      return 'blue';
    case 'shipped':
      return 'purple';
    case 'delivered':
      return 'green';
    default:
      return 'gray';
  }
};

interface AdminOrderItemProduct {
  name?: string;
}

interface AdminOrderItem {
  quantity: number;
  products?: AdminOrderItemProduct | null;
}

interface AdminOrderProfile {
  display_name?: string;
}

interface AdminOrderUser {
  display_name?: string;
}

interface AdminOrder {
  id: string;
  status: string;
  total_cents?: number;
  profiles?: AdminOrderProfile | null;
  user?: AdminOrderUser;
  order_items?: AdminOrderItem[];
}

export default function AdminNFC() {
  const { user, profile } = useAuth();
  const { orders, loading, error, fetchOrders } = useNFCOrdersAdmin();
  const [search, setSearch] = useState('');

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const userIsAdmin = checkIsAdmin(profile?.username, user?.email);

  if (!userIsAdmin) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/50">You don't have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) =>
    order.id?.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: string) => {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error(updateError);
    } else {
      await fetchOrders();
    }
  };

  return (
    <>
      <SEO
        title="Orders Dashboard"
        description="Manage customer orders from the admin dashboard."
        type="website"
      />

      <div className="min-h-screen bg-black text-white p-6 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm font-medium border border-white/10"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>

            <Button variant="secondary" onClick={() => fetchOrders()} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>

          <h1 className="text-3xl font-black mb-6">
            Orders Dashboard
          </h1>

          <input
            className="w-full mb-6 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500"
            placeholder="Search orders..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-white/50">{error}</p>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-white/50">No orders found</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const typedOrder = order as unknown as AdminOrder;

                return (
                <div
                  key={typedOrder.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-white/40">Order ID</p>
                      <p className="font-bold">{typedOrder.id}</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      typedOrder.status === 'pending' && 'bg-yellow-500/20 text-yellow-400'
                    } ${
                      typedOrder.status === 'confirmed' && 'bg-blue-500/20 text-blue-400'
                    } ${
                      typedOrder.status === 'shipped' && 'bg-purple-500/20 text-purple-400'
                    } ${
                      typedOrder.status === 'delivered' && 'bg-green-500/20 text-green-400'
                    }`}>
                      {typedOrder.status}
                    </span>
                  </div>

                  <p style={{ color: getStatusColor(typedOrder.status || 'pending') }}>
                    {typedOrder.status}
                  </p>

                  <p className="text-white/60 mb-2">
                    User: {typedOrder.profiles?.display_name || typedOrder.user?.display_name || 'Unknown'}
                  </p>

                  <p className="mb-3 font-semibold">
                    Total: ${(typedOrder.total_cents || 0) / 100}
                  </p>

                  <div className="mb-4">
                    {typedOrder.order_items?.map((item, index) => (
                      <p key={index} className="text-sm text-white/70">
                        • {item.products?.name} x {item.quantity}
                      </p>
                    ))}
                  </div>

                  <select
                    value={typedOrder.status}
                    onChange={(event) => void updateStatus(typedOrder.id, event.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg p-2"
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                  </select>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
