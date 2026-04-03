import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CreditCard, MapPin, Truck, Check } from 'lucide-react';
import { useAuth } from '../App';
import { cartService, addressService, deliveryService, ecommerceCheckoutService } from '../services/ecommerceService';
import type { CartItem, Address } from '../services/ecommerceService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { SEO } from '../components/SEO';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', fee: 0 },
  { id: 'omt', label: 'OMT Payment', icon: '🏦', requiresProof: true },
  { id: 'wish', label: 'Whish Money', icon: '💳', requiresProof: true },
  { id: 'bank', label: 'Bank Transfer', icon: '🏛️', requiresProof: true },
];

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'review' | 'address' | 'payment' | 'confirm'>('review');
  
  // Form state for new address
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    city: '',
    area: '',
    address_details: '',
  });
  
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    
    loadCart();
    loadAddresses();
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    const { data } = await cartService.getCart(user.id);
    if (data && data.length > 0) {
      setCart(data);
    } else {
      navigate('/shop'); // Redirect to shop if cart is empty
    }
  };

  const loadAddresses = async () => {
    if (!user) return;
    const { data } = await addressService.getUserAddresses(user.id);
    if (data) {
      setAddresses(data);
      if (data.length > 0 && !selectedAddress) {
        const defaultAddr = data.find(a => a.is_default) || data[0];
        setSelectedAddress(defaultAddr.id);
      }
    }
  };

  const subtotal = cart.reduce((sum, item) => 
    sum + (item.product?.price_cents || 0) * item.quantity, 0
  );

  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddress) return;
    
    setLoading(true);
    try {
      const { data, error } = await ecommerceCheckoutService.checkout(
        user.id,
        paymentMethod as any,
        selectedAddress
      );

      if (error) {
        alert('Error placing order: ' + error.message);
        return;
      }

      setOrderSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4">Order Placed!</h1>
          <p className="text-white/60 mb-8">
            Your order has been successfully placed. We'll contact you soon.
          </p>
          <p className="text-sm text-white/40">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Checkout" description="Complete your purchase" />
      
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm font-medium border border-white/10 mb-8"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Items Review */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="text-brand-accent" size={20} />
                  Order Summary
                </h2>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-white/10">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{item.product?.name}</h3>
                        <p className="text-sm text-white/50">Qty: {item.quantity}</p>
                        <p className="text-brand-accent font-bold mt-1">
                          ${((item.product?.price_cents || 0) * item.quantity / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Delivery Address */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="text-brand-accent" size={20} />
                  Delivery Address
                </h2>
                
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedAddress === addr.id
                            ? 'border-brand-accent bg-brand-accent/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddress === addr.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            selectedAddress === addr.id ? 'border-brand-accent' : 'border-white/30'
                          }`}>
                            {selectedAddress === addr.id && (
                              <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{addr.full_name}</p>
                            <p className="text-sm text-white/60">{addr.phone}</p>
                            <p className="text-sm text-white/60">
                              {addr.address_details}, {addr.area}, {addr.city}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input
                      placeholder="Full Name"
                      value={newAddress.full_name}
                      onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    />
                    <Input
                      placeholder="Phone Number"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    />
                    <Input
                      placeholder="City (e.g., Beirut)"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                    <Input
                      placeholder="Area (optional)"
                      value={newAddress.area}
                      onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                    />
                    <Input
                      placeholder="Address Details (building, floor, etc.)"
                      value={newAddress.address_details}
                      onChange={(e) => setNewAddress({ ...newAddress, address_details: e.target.value })}
                    />
                  </div>
                )}
              </Card>

              {/* Payment Method */}
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
                        onChange={(e) => setPaymentMethod(e.target.value)}
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
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === method.id ? 'border-brand-accent' : 'border-white/30'
                        }`}>
                          {paymentMethod === method.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Order Total */}
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

                <Button
                  variant="primary"
                  className="w-full"
                  disabled={!selectedAddress || loading}
                  onClick={handlePlaceOrder}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>

                <p className="text-xs text-white/40 mt-4 text-center">
                  By placing this order, you agree to our Terms of Service
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
