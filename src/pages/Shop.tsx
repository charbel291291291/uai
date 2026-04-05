import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';
import { productService, type Product } from '../services/monetizationService';
import { cartService } from '../services/ecommerceService';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import { SEO } from '../components/SEO';
import { useAuth } from '../App';
import { savePendingBuyNowItem } from '../hooks/useCheckout';

export default function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [buyingNow, setBuyingNow] = useState<string | null>(null);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  const uniqueProducts = useMemo(
    () => Array.from(new Map(products.map((product) => [product.id, product])).values()),
    [products],
  );

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await productService.getProducts();

      if (error) {
        console.error('Failed to load products:', error);
        setLoadError('We could not load the store right now. Please try again.');
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoadError('We could not load the store right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (uniqueProducts.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');

    if (!highlight) return;

    const timer = window.setTimeout(() => {
      const element = document.getElementById(`product-${highlight}`);

      if (!element) return;

      setHighlightedProductId(highlight);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      window.setTimeout(() => {
        setHighlightedProductId((current) => (current === highlight ? null : current));
      }, 2000);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [uniqueProducts]);

  const handleAddToCart = async (productId: string) => {
    try {
      setActionError(null);
      setAddingToCart(productId);

      if (!user) {
        navigate('/login?redirect=/shop');
        return;
      }

      if (addedProducts.has(productId)) {
        return;
      }

      const { error } = await cartService.addToCart(user.id, productId, 1);

      if (error) {
        console.error('Error adding to cart:', error);
        setActionError('We could not add this item to your cart. Please try again.');
        return;
      }

      setAddedProducts((prev) => new Set([...prev, productId]));

      window.setTimeout(() => {
        setAddedProducts((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setActionError('We could not add this item to your cart. Please try again.');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleBuyNow = (product: Product) => {
    setActionError(null);

    const buyNowItem = {
      product_id: product.id,
      name: product.name,
      price: product.price_cents,
      quantity: 1,
      image_url: product.image_url,
    };

    localStorage.setItem('buy_now_item', JSON.stringify(buyNowItem));
    savePendingBuyNowItem(buyNowItem);

    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    setBuyingNow(product.id);
    navigate('/checkout', { state: { buyNowItem } });
  };

  return (
    <>
      <SEO
        title="Shop - UAi Products"
        description="Browse and purchase NFC products and accessories."
        type="product"
      />

      <div className="min-h-screen px-4 pb-20 pt-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <section className="mb-12 flex flex-col gap-6 border-b border-white/5 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-brand-accent">
                <ShoppingCart size={16} />
                UAi Store
              </div>

              <div className="space-y-3 text-left">
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Products for your digital presence
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/45 sm:text-base">
                  Explore NFC products and accessories designed to make your profile easier to share, tap, and remember.
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCartOpen(true)}
              className="self-start rounded-full border border-white/10 bg-white/10 p-3 shadow-[0_0_20px_rgba(0,255,255,0.15)] transition-all hover:bg-white/20 sm:self-auto"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6 text-white" />
            </motion.button>
          </section>

          {actionError && (
            <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="h-[420px] animate-pulse rounded-[28px] border border-white/5 bg-white/[0.02]"
                />
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03]">
                <AlertCircle className="text-white/35" size={26} />
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-white">Store unavailable</h2>
              <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-white/42">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white px-6 py-3 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5"
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          ) : uniqueProducts.length === 0 ? (
            <div className="rounded-[32px] border border-white/5 bg-white/[0.02] px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03]">
                <ShoppingCart className="text-white/35" size={24} />
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-white">No products yet</h2>
              <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-white/42">
                The store is being prepared. Reload to check again in a moment.
              </p>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white px-6 py-3 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5"
              >
                <RefreshCw size={16} />
                Reload store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {uniqueProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  id={`product-${product.id}`}
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className={`rounded-[28px] transition-all duration-300 ${
                    highlightedProductId === product.id ? 'ring-2 ring-brand-cyan' : ''
                  }`}
                >
                  <div className="rounded-[28px] border border-white/5 bg-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-brand-cyan/40">
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNow}
                      isAdding={addingToCart === product.id}
                      added={addedProducts.has(product.id)}
                      isBuyingNow={buyingNow === product.id}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} userId={user?.id} />
    </>
  );
}
