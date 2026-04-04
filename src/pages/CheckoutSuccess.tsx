import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { SEO } from '../components/SEO';

interface CheckoutSuccessState {
  orderId?: string;
  itemCount?: number;
  mode?: 'buy-now' | 'cart';
}

export default function CheckoutSuccess() {
  const location = useLocation();
  const state = (location.state as CheckoutSuccessState | null) ?? null;

  return (
    <>
      <SEO title="Order Success" description="Your order was placed successfully." />
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full glass-card border border-white/10 rounded-3xl p-8 text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-white mb-4">Order Placed</h1>
          <p className="text-white/60 mb-3">
            Your {state?.mode === 'buy-now' ? 'Buy Now' : 'cart'} checkout was completed successfully.
          </p>
          {state?.itemCount ? <p className="text-white/40 mb-2">Items: {state.itemCount}</p> : null}
          {state?.orderId ? <p className="text-white/40 mb-8">Order ID: {state.orderId}</p> : null}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard" className="btn-neon text-black font-bold py-3 px-6 rounded-xl">
              Go to Dashboard
            </Link>
            <Link to="/shop" className="py-3 px-6 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
