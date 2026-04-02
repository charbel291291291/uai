import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Package, Truck, CheckCircle, Clock, XCircle, RefreshCw,
  Search, Filter, ExternalLink, MessageSquare, Loader2,
  MapPin, Phone, User, Calendar, AlertCircle, ChevronDown,
  Send, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../App';
import { useNFCOrdersAdmin } from '../hooks/useNFCOrders';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SEO } from '../components/SEO';
import type { NFCOrder } from '../types';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'yellow', icon: Clock },
  processing: { label: 'Processing', color: 'blue', icon: Package },
  shipped: { label: 'Shipped', color: 'purple', icon: Truck },
  delivered: { label: 'Delivered', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'red', icon: XCircle },
};

const PRODUCT_LABELS: Record<string, string> = {
  card: 'NFC Card',
  keychain: 'NFC Keychain',
  bracelet: 'NFC Bracelet',
  sticker: 'NFC Sticker',
};

export default function AdminNFC() {
  const { profile } = useAuth();
  const { orders, loading, error, fetchOrders, updateOrderStatus } = useNFCOrdersAdmin();

  const [selectedOrder, setSelectedOrder] = useState<NFCOrder | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form state for status update
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchOrders(filter === 'all' ? undefined : filter);
  }, [filter, fetchOrders]);

  // Check if user is admin
  const isAdmin = profile?.username === 'admin' || profile?.username === 'eyedeaz';

  if (!isAdmin) {
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

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.user?.username?.toLowerCase().includes(query) ||
      order.user?.display_name?.toLowerCase().includes(query) ||
      order.name?.toLowerCase().includes(query) ||
      order.phone?.includes(query) ||
      order.id?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    setActionLoading(true);
    const success = await updateOrderStatus(
      selectedOrder.id!,
      newStatus,
      trackingNumber,
      carrier,
      adminNotes
    );
    setActionLoading(false);

    if (success) {
      setSelectedOrder(null);
      setNewStatus('');
      setTrackingNumber('');
      setCarrier('');
      setAdminNotes('');
    }
  };

  const openOrderModal = (order: NFCOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status || 'pending');
    setTrackingNumber(order.tracking_number || '');
    setCarrier(order.shipping_carrier || '');
    setAdminNotes(order.admin_notes || '');
  };

  return (
    <>
      <SEO
        title="NFC Orders Admin"
        description="Manage NFC product orders and shipping for UAi digital twin platform."
        type="website"
      />
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
        {/* ─── Back Button ── */}
        <div className="max-w-7xl mx-auto mb-8">
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm font-medium border border-white/10 hover:border-white/20 backdrop-blur-sm"
            aria-label="Back to dashboard">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-white">NFC Orders</h1>
              <p className="text-white/50">Manage NFC product orders and shipping</p>
            </div>
          <Button variant="secondary" onClick={() => fetchOrders()} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-5">
            <p className="text-2xl font-black text-white">{stats.total}</p>
            <p className="text-sm text-white/50">Total Orders</p>
          </Card>
          <Card className="p-5 border-yellow-500/30">
            <p className="text-2xl font-black text-yellow-400">{stats.pending}</p>
            <p className="text-sm text-white/50">Pending</p>
          </Card>
          <Card className="p-5 border-blue-500/30">
            <p className="text-2xl font-black text-blue-400">{stats.processing}</p>
            <p className="text-sm text-white/50">Processing</p>
          </Card>
          <Card className="p-5 border-purple-500/30">
            <p className="text-2xl font-black text-purple-400">{stats.shipped}</p>
            <p className="text-sm text-white/50">Shipped</p>
          </Card>
          <Card className="p-5 border-green-500/30">
            <p className="text-2xl font-black text-green-400">{stats.delivered}</p>
            <p className="text-sm text-white/50">Delivered</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <Input
                placeholder="Search by user, name, phone, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filter === s
                      ? 'bg-brand-accent text-black'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Orders Table */}
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
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No orders found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className="p-5 cursor-pointer hover:border-white/20 transition-all"
                    onClick={() => openOrderModal(order)}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${status.color}-500/20`}>
                          <StatusIcon className={`text-${status.color}-400`} size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{PRODUCT_LABELS[order.product_type]}</p>
                            <Badge
                              variant={
                                order.status === 'delivered' ? 'success' :
                                order.status === 'cancelled' ? 'error' :
                                order.status === 'shipped' ? 'info' :
                                'warning'
                              }
                              size="sm"
                            >
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-white/50">
                            {order.user?.display_name || 'Unknown'} (@{order.user?.username || 'unknown'})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-sm text-white/50">Order ID</p>
                          <p className="font-mono text-white/70">#{order.id?.slice(0, 8)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/50">Date</p>
                          <p className="text-white">
                            {new Date(order.created_at!).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/50">Price</p>
                          <p className="font-bold text-white">${order.price}</p>
                        </div>
                        {order.tracking_number && (
                          <div>
                            <p className="text-sm text-white/50">Tracking</p>
                            <p className="font-mono text-brand-accent">{order.tracking_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl max-h-[90vh] overflow-auto"
          >
            <Card className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-white">
                    Order #{selectedOrder.id?.slice(0, 8)}
                  </h2>
                  <p className="text-white/50">
                    Placed on {new Date(selectedOrder.created_at!).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-white/50" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-sm font-medium text-white/50 mb-3 flex items-center gap-2">
                    <User size={16} />
                    Customer
                  </h3>
                  <div className="p-4 rounded-xl bg-white/5 space-y-2">
                    <p className="text-white font-medium">
                      {selectedOrder.user?.display_name || 'Unknown'}
                    </p>
                    <p className="text-white/50 text-sm">
                      @{selectedOrder.user?.username || 'unknown'}
                    </p>
                    <p className="text-white/50 text-sm flex items-center gap-2">
                      <Phone size={14} />
                      {selectedOrder.phone}
                    </p>
                  </div>

                  <h3 className="text-sm font-medium text-white/50 mb-3 mt-6 flex items-center gap-2">
                    <MapPin size={16} />
                    Shipping Address
                  </h3>
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-white whitespace-pre-wrap">{selectedOrder.address}</p>
                  </div>

                  {selectedOrder.notes && (
                    <>
                      <h3 className="text-sm font-medium text-white/50 mb-3 mt-6 flex items-center gap-2">
                        <MessageSquare size={16} />
                        Customer Notes
                      </h3>
                      <div className="p-4 rounded-xl bg-white/5">
                        <p className="text-white/70">{selectedOrder.notes}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Order Management */}
                <div>
                  <h3 className="text-sm font-medium text-white/50 mb-3 flex items-center gap-2">
                    <Package size={16} />
                    Order Details
                  </h3>
                  <div className="p-4 rounded-xl bg-white/5 space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-white/50">Product</span>
                      <span className="text-white font-medium">
                        {PRODUCT_LABELS[selectedOrder.product_type]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Price</span>
                      <span className="text-white font-medium">${selectedOrder.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Current Status</span>
                      <Badge
                        variant={
                          selectedOrder.status === 'delivered' ? 'success' :
                          selectedOrder.status === 'cancelled' ? 'error' :
                          selectedOrder.status === 'shipped' ? 'info' :
                          'warning'
                        }
                      >
                        {STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG]?.label || 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-white/50 mb-3 flex items-center gap-2">
                    <Truck size={16} />
                    Update Status
                  </h3>
                  <div className="space-y-4">
                    {/* Status Select */}
                    <div>
                      <label className="text-sm text-white/50 mb-2 block">New Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-accent"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Tracking Info (show for shipped/delivered) */}
                    {(newStatus === 'shipped' || newStatus === 'delivered') && (
                      <>
                        <div>
                          <label className="text-sm text-white/50 mb-2 block">Tracking Number</label>
                          <Input
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking number"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-white/50 mb-2 block">Carrier</label>
                          <Input
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            placeholder="e.g., Aramex, DHL, LibanPost"
                          />
                        </div>
                      </>
                    )}

                    {/* Admin Notes */}
                    <div>
                      <label className="text-sm text-white/50 mb-2 block">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Internal notes about this order..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-accent"
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setSelectedOrder(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        disabled={actionLoading || newStatus === selectedOrder.status}
                        onClick={handleStatusUpdate}
                      >
                        {actionLoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Send size={18} />
                            Update Order
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
    </>
  );
}
