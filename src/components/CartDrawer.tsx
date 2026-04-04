import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cartService, type CartItem } from '../services/ecommerceService';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export default function CartDrawer({ isOpen, onClose, userId }: CartDrawerProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) loadCart();
  }, [isOpen, userId]);

  useEffect(() => {
    const handleCartUpdated = () => {
      if (isOpen) {
        loadCart();
      }
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, [isOpen, userId]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const { data } = await cartService.getCart(userId);
      if (data) {
        setCart(data);
        const subtotal = data.reduce((sum, item) => 
          sum + (item.product?.price_cents || 0) * item.quantity, 0
        );
        setTotal(subtotal);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      await removeItem(itemId);
      return;
    }

    await cartService.updateQuantity(itemId, newQty, userId);
    loadCart(); // Refresh
  };

  const removeItem = async (itemId: string) => {
    await cartService.removeFromCart(itemId, userId);
    loadCart();
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-white/10 z-50 overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-white/10 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-brand-accent" />
                Cart ({itemCount})
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close cart"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="p-4 space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/60">Loading cart...</p>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">Your cart is empty</p>
                  <p className="text-sm">Browse our NFC products and add them to your cart</p>
                  <Link 
                    to="/shop" 
                    onClick={onClose}
                    className="inline-block mt-6 px-6 py-3 bg-brand-accent text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    {/* Product Image */}
                    {item.product?.image_url && (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{item.product?.name}</h3>
                      <p className="text-brand-accent font-bold mt-1">
                        ${((item.product?.price_cents || 0) / 100).toFixed(2)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        <span className="text-white font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-auto p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur border-t border-white/10 p-4 space-y-4">
                <div className="flex justify-between items-center text-white">
                  <span className="text-lg font-medium">Subtotal:</span>
                  <span className="text-2xl font-black text-brand-accent">
                    ${(total / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-white/40">Shipping & taxes calculated at checkout</p>
                
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="w-full btn-neon py-3 font-bold flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </Link>
                
                <button
                  onClick={onClose}
                  className="w-full py-3 text-white/60 hover:text-white font-medium transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
