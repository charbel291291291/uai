import { motion } from 'motion/react';
import { ShoppingCart, Check } from 'lucide-react';
import type { Product } from '../services/monetizationService';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  onBuyNow: (product: Product) => void;
  isAdding?: boolean;
  added?: boolean;
  isBuyingNow?: boolean;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onBuyNow,
  isAdding = false,
  added = false,
  isBuyingNow = false,
}: ProductCardProps) {
  const price = product.price_cents / 100;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl"
    >
      {/* Product Image */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-brand-primary/20 to-brand-accent/20">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">
            <span className="text-6xl">📱</span>
          </div>
        )}

        {/* Stock Badge */}
        {product.stock_quantity !== null && (
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
            product.stock_quantity > 0
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}>
            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of Stock'}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
        
        {product.description && (
          <p className="text-white/60 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-3xl font-black text-brand-accent">
              ${price.toFixed(2)}
            </span>
          </div>
          
          {/* Bundle Discount Badge */}
          {product.bundle_discount_percent && product.bundle_discount_percent > 0 && (
            <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full font-bold">
              Save {product.bundle_discount_percent}% in bundles
            </span>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onAddToCart(product.id)}
            disabled={isAdding || added || (product.stock_quantity === 0)}
            className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              added
                ? 'bg-green-500 text-white'
                : product.stock_quantity === 0
                ? 'bg-gray-500/50 text-white/50 cursor-not-allowed'
                : 'btn-neon'
            }`}
          >
            {isAdding ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </>
            ) : added ? (
              <>
                <Check className="w-5 h-5" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </>
            )}
          </button>

          <button
            onClick={(event) => {
              event.stopPropagation();
              onBuyNow(product);
            }}
            disabled={isBuyingNow || (product.stock_quantity === 0)}
            className="w-full py-3 rounded-lg font-bold border border-white/15 bg-white/5 text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBuyingNow ? 'Loading...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
