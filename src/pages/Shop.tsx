import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    void loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await productService.getProducts();

      if (data && !error) {
        setProducts(data);
      } else if (error) {
        console.error('Failed to load products:', error);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCart(productId);

      if (addedProducts.has(productId)) {
        return;
      }

      const { error } = await cartService.addToCart(user?.id, productId, 1);

      if (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart');
        return;
      }

      setAddedProducts((prev) => new Set([...prev, productId]));

      setTimeout(() => {
        setAddedProducts((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('An unexpected error occurred');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleBuyNow = (product: Product) => {
    const buyNowItem = {
      product_id: product.id,
      name: product.name,
      price: product.price_cents,
      quantity: 1,
      image_url: product.image_url
    };

    localStorage.setItem('buy_now_item', JSON.stringify(buyNowItem));
    savePendingBuyNowItem(buyNowItem);

    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    navigate('/checkout', { state: { buyNowItem } });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
          <span className="ml-2 text-white/60">Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Shop - UAi Products"
        description="Browse and purchase NFC products and accessories."
        type="product"
      />

      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="text-center flex-1">
              <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-neon text-brand-accent text-sm font-bold mb-6">
                <ShoppingCart size={16} />
                UAi Store
              </motion.div>

              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
                NFC <span className="text-gradient">Products</span>
              </h1>

              <p className="text-white/50 max-w-xl mx-auto">
                Enhance your digital twin experience
              </p>
            </div>

            <motion.button
              onClick={() => setCartOpen(true)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
            >
              <ShoppingCart className="w-6 h-6 text-white" />
            </motion.button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              No products available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  isAdding={addingToCart === product.id}
                  added={addedProducts.has(product.id)}
                  isBuyingNow={buyingNow === product.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        userId={user?.id}
      />
    </>
  );
}
