import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Check, X, Clock, ExternalLink, RefreshCw, Loader2,
  Shield, Users, DollarSign, TrendingUp, Search, Filter,
  Image as ImageIcon, MessageSquare, AlertCircle, Package, ArrowLeft,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../App';
import { useAdminPayments } from '../hooks/useSubscription';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { SEO } from '../components/SEO';
import type { PaymentRequest } from '../types';
import { isAdmin, ADMIN_ROUTES } from '../config/admin';

interface PaymentWithUser extends PaymentRequest {
  user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export default function Admin() {
  const { user, profile } = useAuth();
  const {
    paymentRequests,
    loading,
    error,
    fetchPendingPayments,
    approvePayment,
    rejectPayment,
  } = useAdminPayments();

  const [selectedPayment, setSelectedPayment] = useState<PaymentWithUser | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPendingPayments();
  }, [fetchPendingPayments]);

  // Check if user is admin using centralized config
  const userIsAdmin = isAdmin(profile?.username);

  if (!userIsAdmin) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/50">You don't have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    const success = await approvePayment(selectedPayment.id, adminNotes);
    setActionLoading(false);
    if (success) {
      setSelectedPayment(null);
      setAdminNotes('');
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !adminNotes) return;
    setActionLoading(true);
    const success = await rejectPayment(selectedPayment.id, adminNotes);
    setActionLoading(false);
    if (success) {
      setSelectedPayment(null);
      setAdminNotes('');
    }
  };

  const filteredPayments = paymentRequests.filter((payment: PaymentWithUser) => {
    const matchesFilter = filter === 'all' || payment.status === filter;
    const matchesSearch =
      !searchQuery ||
      payment.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: paymentRequests.length,
    pending: paymentRequests.filter((p: PaymentRequest) => p.status === 'pending').length,
    approved: paymentRequests.filter((p: PaymentRequest) => p.status === 'approved').length,
    rejected: paymentRequests.filter((p: PaymentRequest) => p.status === 'rejected').length,
    revenue: paymentRequests
      .filter((p: PaymentRequest) => p.status === 'approved')
      .reduce((sum: number, p: PaymentRequest) => sum + p.amount, 0),
  };

  return (
    <>
      <SEO
        title="Admin Dashboard"
        description="Admin dashboard for managing payments, subscriptions, and user orders on UAi."
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
              <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
              <p className="text-white/50">Manage payments, subscriptions, and orders</p>
            </div>
          <div className="flex gap-2">
            <Link to="/admin/nfc">
              <Button variant="secondary">
                <Package size={18} />
                NFC Orders
              </Button>
            </Link>
            <Button variant="secondary" onClick={fetchPendingPayments} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                <DollarSign className="text-brand-accent" size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">${stats.revenue}</p>
                <p className="text-sm text-white/50">Total Revenue</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="text-yellow-500" size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.pending}</p>
                <p className="text-sm text-white/50">Pending</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Check className="text-green-500" size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.approved}</p>
                <p className="text-sm text-white/50">Approved</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Users className="text-purple-500" size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.total}</p>
                <p className="text-sm text-white/50">Total Requests</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to={ADMIN_ROUTES.NFC_ORDERS}>
            <Card className="p-6 cursor-pointer hover:border-brand-accent/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <Package className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">Manage NFC Orders</h3>
                  <p className="text-sm text-white/50">Track and update deliveries</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/shop">
            <Card className="p-6 cursor-pointer hover:border-brand-accent/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <TrendingUp className="text-green-400" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">View Shop</h3>
                  <p className="text-sm text-white/50">Browse products</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/dashboard">
            <Card className="p-6 cursor-pointer hover:border-brand-accent/50 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <LayoutDashboard className="text-purple-400" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">User Dashboard</h3>
                  <p className="text-sm text-white/50">View as regular user</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <Input
                placeholder="Search by username, name, or payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filter === f
                      ? 'bg-brand-accent text-black'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Payment Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white/50">{error}</p>
          </Card>
        ) : filteredPayments.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Filter className="text-white/30" size={32} />
            </div>
            <p className="text-white/50">No payment requests found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment: PaymentWithUser) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className="p-6 cursor-pointer hover:border-white/20 transition-all"
                  onClick={() => setSelectedPayment(payment)}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden">
                        {payment.user?.avatar_url ? (
                          <img
                            src={payment.user.avatar_url}
                            alt={payment.user.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 font-bold">
                            {payment.user?.display_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{payment.user?.display_name || 'Unknown'}</p>
                        <p className="text-sm text-white/50">@{payment.user?.username || 'unknown'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold text-white capitalize">{payment.plan} Plan</p>
                        <p className="text-sm text-white/50">${payment.amount} • {payment.payment_method.toUpperCase()}</p>
                      </div>

                      <Badge
                        variant={
                          payment.status === 'approved' ? 'success' :
                          payment.status === 'rejected' ? 'error' :
                          'warning'
                        }
                      >
                        {payment.status}
                      </Badge>

                      <Button variant="ghost" size="sm">
                        <ExternalLink size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-auto"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">Payment Details</h2>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/50" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* User Info */}
                <div>
                  <h3 className="text-sm font-medium text-white/50 mb-3">User</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden">
                      {selectedPayment.user?.avatar_url ? (
                        <img
                          src={selectedPayment.user.avatar_url}
                          alt={selectedPayment.user.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 font-bold">
                          {selectedPayment.user?.display_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">{selectedPayment.user?.display_name}</p>
                      <p className="text-sm text-white/50">@{selectedPayment.user?.username}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-sm font-medium text-white/50 mb-3">Payment</h3>
                  <div className="space-y-2">
                    <p className="text-white">
                      <span className="text-white/50">Plan:</span>{' '}
                      <span className="font-bold capitalize">{selectedPayment.plan}</span>
                    </p>
                    <p className="text-white">
                      <span className="text-white/50">Amount:</span>{' '}
                      <span className="font-bold">${selectedPayment.amount}</span>
                    </p>
                    <p className="text-white">
                      <span className="text-white/50">Method:</span>{' '}
                      <span className="font-bold uppercase">{selectedPayment.payment_method}</span>
                    </p>
                    <p className="text-white">
                      <span className="text-white/50">Date:</span>{' '}
                      {new Date(selectedPayment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proof Image */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-white/50 mb-3">Payment Proof</h3>
                <a
                  href={selectedPayment.proof_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative group rounded-xl overflow-hidden"
                >
                  <img
                    src={selectedPayment.proof_image_url}
                    alt="Payment proof"
                    className="w-full max-h-64 object-contain bg-black"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="text-white" size={32} />
                  </div>
                </a>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-white/50 mb-3">
                  {selectedPayment.status === 'pending' ? 'Admin Notes' : 'Review Notes'}
                </h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={selectedPayment.status === 'pending' ? 'Add notes before approving/rejecting...' : 'No notes'}
                  disabled={selectedPayment.status !== 'pending'}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-accent disabled:opacity-50"
                  rows={3}
                />
              </div>

              {/* Actions */}
              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    className="flex-1"
                    disabled={actionLoading || !adminNotes}
                    onClick={handleReject}
                  >
                    <X size={18} />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={actionLoading}
                    onClick={handleApprove}
                  >
                    {actionLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}
                    Approve
                  </Button>
                </div>
              )}

              {selectedPayment.status !== 'pending' && (
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-white/50 text-sm">
                    Reviewed by {selectedPayment.reviewed_by ? 'Admin' : 'System'} on{' '}
                    {selectedPayment.reviewed_at
                      ? new Date(selectedPayment.reviewed_at).toLocaleString()
                      : 'Unknown'}
                  </p>
                  {selectedPayment.admin_notes && (
                    <p className="text-white mt-2">{selectedPayment.admin_notes}</p>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      )}
    </div>
    </>
  );
}
