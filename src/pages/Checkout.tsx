import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CreditCard, MapPin, Truck, Check, Upload, X } from 'lucide-react';
import { useAuth } from '../App';
import { supabase } from '../supabase';
import { cartService, addressService, deliveryService, ecommerceCheckoutService } from '../services/ecommerceService';
import { productService } from '../services/monetizationService';
import type { CartItem, Address } from '../services/ecommerceService';
import type { Product } from '../services/monetizationService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { SEO } from '../components/SEO';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', fee: 0, requiresProof: false },
  { id: 'omt', label: 'OMT Payment', icon: '🏦', requiresProof: true },
  { id: 'wish', label: 'Whish Money', icon: '💳', requiresProof: true },
  { id: 'bank', label: 'Bank Transfer', icon: '🏛️', requiresProof: true },
];

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [directProduct, setDirectProduct] = useState<Product | null>(null);
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
  
  // Payment proof upload state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    
    const productId = searchParams.get('product');
    
    if (productId) {
      // Direct product purchase flow
      loadDirectProduct(productId);
    } else {
      // Cart-based checkout flow
      loadCart();
    }
    
    loadAddresses();
  }, [user, searchParams]);

  const loadDirectProduct = async (productId: string) => {
    try {
      const { data, error } = await productService.getProductById(productId);
      
      if (error || !data) {
        setError('Product not found. Please try again.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }
      
      setDirectProduct(data);
      
      // Auto-add to cart with quantity 1
      const { error: cartError } = await cartService.addToCart(user!.id, data.id, 1);
      if (cartError) {
        console.error('Failed to add to cart:', cartError);
      }
      
      // Refresh cart to include the product
      await loadCart();
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Failed to load product. Please try again.');
    }
  };

  const loadCart = async () => {
    if (!user) return;
    const { data } = await cartService.getCart(user.id);
    if (data && data.length > 0) {
      setCart(data);
    } else if (!directProduct) {
      // Only redirect if not a direct product purchase
      navigate('/'); // Redirect to home if cart is empty and no direct product
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

  // Payment proof upload handlers
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    setProofFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeProof = () => {
    setProofFile(null);
    setProofPreview(null);
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddress) return;
    
    // Validate proof upload for OMT/Wish/Bank transfer
    const selectedPayment = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    if (selectedPayment?.requiresProof && !proofFile) {
      alert('Please upload payment proof before placing order');
      return;
    }
    
    setLoading(true);
    try {
      let proofUrl = '';
      
      // Upload proof if required
      if (proofFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment_proofs')
          .upload(`${user.id}/${Date.now()}_${proofFile.name}`, proofFile);
        
        if (uploadError) {
          throw new Error('Failed to upload payment proof');
        }
        
        const { data: urlData } = supabase.storage
          .from('payment_proofs')
          .getPublicUrl(uploadData.path);
        
        proofUrl = urlData.publicUrl;
      }
      
      const { data, error } = await ecommerceCheckoutService.checkout(
        user.id,
        paymentMethod as any,
        selectedAddress,
        undefined, // referenceNumber (optional)
        proofUrl || undefined
      );

      if (error) {
        setError('Error placing order: ' + error.message);
        return;
      }

      setOrderSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.message || 'Failed to place order. Please try again.');
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

                {/* Payment Proof Upload (for OMT/Wish/Bank) */}
                {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.requiresProof && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Upload size={16} className="text-brand-accent" />
                      Upload Payment Proof <span className="text-red-400">*</span>
                    </h3>
                    
                    {!proofPreview ? (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofUpload}
                          className="sr-only"
                        />
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
                        <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                          <Check size={16} />
                          Proof uploaded successfully
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-300">
                        <strong>Instructions:</strong> After making the payment via {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}, 
                        take a screenshot/photo of the receipt and upload it here. Your order will be verified within 24 hours.
                      </p>
                    </div>
                  </div>
                )}
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
                  disabled={loading || (PAYMENT_METHODS.find(m => m.id === paymentMethod)?.requiresProof && !proofFile)}
                  onClick={handlePlaceOrder}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

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
