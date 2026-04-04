import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, Truck, Upload, X } from 'lucide-react';
import { useAuth } from '../App';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { SEO } from '../components/SEO';
import { useCheckout } from '../hooks/useCheckout';

const PAYMENT_METHODS = [
  { id: 'cod' as const, label: 'Cash on Delivery', icon: '💵', requiresProof: false },
  { id: 'omt' as const, label: 'OMT Payment', icon: '🏦', requiresProof: true },
  { id: 'wish' as const, label: 'Whish Money', icon: '💳', requiresProof: true },
  { id: 'bank_transfer' as const, label: 'Bank Transfer', icon: '🏛️', requiresProof: true },
];

export default function Checkout() {
  const { user } = useAuth();
  const {
    addresses,
    canUseNewAddress,
    deliveryFee,
    error,
    handlePlaceOrder,
    handleProofUpload,
    isBuyNowCheckout,
    itemsToCheckout,
    loading,
    newAddress,
    pageLoading,
    paymentMethod,
    proofFile,
    proofPreview,
    removeProof,
    selectedAddress,
    selectedPaymentMethod,
    setNewAddress,
    setPaymentMethod,
    setSelectedAddress,
    subtotal,
    total,
  } = useCheckout({ user, paymentMethods: PAYMENT_METHODS });

  const isLoading = loading;
  const isEmpty = itemsToCheckout.length === 0;
  const missingAddress = !selectedAddress && !canUseNewAddress;
  const missingProof = Boolean(selectedPaymentMethod?.requiresProof && !proofFile);
  const isDisabled = isLoading || isEmpty || missingAddress || missingProof;
  const finalDisabled = isDisabled;

  if (pageLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Checkout" description="Complete your purchase" />

      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm font-medium border border-white/10 mb-8"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Checkout</h1>
          <p className="text-white/50 mb-8">{isBuyNowCheckout ? 'Buy Now Checkout' : 'Cart Checkout'}</p>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="text-brand-accent" size={20} />
                  Order Summary
                </h2>
                <div className="space-y-4">
                  {itemsToCheckout.map((item) => (
                    <div key={`${item.product_id}-${item.quantity}`} className="flex gap-4 pb-4 border-b border-white/10 last:border-b-0 last:pb-0">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{item.name}</h3>
                        <p className="text-sm text-white/50">Qty: {item.quantity}</p>
                        <p className="text-brand-accent font-bold mt-1">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="text-brand-accent" size={20} />
                  Delivery Address
                </h2>

                {addresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedAddress === address.id
                            ? 'border-brand-accent bg-brand-accent/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddress === address.id}
                          onChange={(event) => setSelectedAddress(event.target.value)}
                          className="sr-only"
                        />
                        <div>
                          <p className="font-medium text-white">{address.full_name}</p>
                          <p className="text-sm text-white/60">{address.phone}</p>
                          <p className="text-sm text-white/60">
                            {address.address_details}, {address.area}, {address.city}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {!selectedAddress && (
                  <div className="space-y-4">
                    <Input
                      placeholder="Full Name"
                      value={newAddress.full_name}
                      onChange={(event) => setNewAddress({ ...newAddress, full_name: event.target.value })}
                    />
                    <Input
                      placeholder="Phone Number"
                      value={newAddress.phone}
                      onChange={(event) => setNewAddress({ ...newAddress, phone: event.target.value })}
                    />
                    <Input
                      placeholder="City (e.g., Beirut)"
                      value={newAddress.city}
                      onChange={(event) => setNewAddress({ ...newAddress, city: event.target.value })}
                    />
                    <Input
                      placeholder="Area (optional)"
                      value={newAddress.area}
                      onChange={(event) => setNewAddress({ ...newAddress, area: event.target.value })}
                    />
                    <Input
                      placeholder="Address Details (building, floor, etc.)"
                      value={newAddress.address_details}
                      onChange={(event) => setNewAddress({ ...newAddress, address_details: event.target.value })}
                    />
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="text-brand-accent" size={20} />
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'border-brand-accent bg-brand-accent/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(event) => setPaymentMethod(event.target.value as typeof method.id)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-white">{method.label}</p>
                          {method.requiresProof && (
                            <p className="text-xs text-yellow-400">Payment proof required</p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedPaymentMethod?.requiresProof && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Upload size={16} className="text-brand-accent" />
                      Upload Payment Proof
                    </h3>

                    {!proofPreview ? (
                      <label className="block">
                        <input type="file" accept="image/*" onChange={handleProofUpload} className="sr-only" />
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-brand-accent/50 transition-colors">
                          <Upload className="mx-auto mb-3 text-white/40" size={32} />
                          <p className="text-sm text-white/60 mb-1">Click to upload payment proof</p>
                          <p className="text-xs text-white/40">JPG, PNG up to 5MB</p>
                        </div>
                      </label>
                    ) : (
                      <div className="relative">
                        <img
                          src={proofPreview}
                          alt="Payment proof preview"
                          className="w-full h-48 object-cover rounded-xl border border-white/20"
                        />
                        <button
                          onClick={removeProof}
                          className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                          aria-label="Remove proof"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">Order Total</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal</span>
                    <span>${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span className="flex items-center gap-2">
                      <Truck size={16} />
                      Delivery
                    </span>
                    <span>${(deliveryFee / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span className="text-brand-accent">${(total / 100).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-sm gap-2 rounded-2xl bg-gradient-to-r from-[#00C6FF] to-[#3A86FF] text-black font-semibold shadow-[0_0_20px_rgba(0,198,255,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,198,255,0.5)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                  disabled={finalDisabled}
                  onClick={handlePlaceOrder}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
