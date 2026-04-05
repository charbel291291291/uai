import { useEffect, useMemo, useState } from 'react';
import { Loader2, PackageSearch, Plus, Save, Search, Trash2 } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { adminProductService, type AdminProductPayload } from '../services/adminProductService';
import type { Product } from '../services/monetizationService';

type ToastState =
  | { type: 'success' | 'error'; title: string; message?: string }
  | null;

const initialForm = {
  name: '',
  sku: '',
  price: '',
  stock: '',
  description: '',
  imageUrl: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastState>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    void fetchProducts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await adminProductService.getProducts();

      if (error) {
        console.error('Failed to fetch products:', error);
        setToast({
          type: 'error',
          title: 'Unable to load products',
          message: 'Please refresh and try again.',
        });
        return;
      }

      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;

    const query = search.toLowerCase();
    return products.filter((product) => product.sku?.toLowerCase().includes(query));
  }, [products, search]);

  const resetForm = () => {
    setEditingProduct(null);
    setFormError(null);
    setForm(initialForm);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormError(null);
    setForm({
      name: product.name,
      sku: product.sku || '',
      price: String(product.price_cents / 100),
      stock: String(product.stock_quantity ?? 0),
      description: product.description || '',
      imageUrl: product.image_url || '',
    });
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.sku.trim()) return 'SKU is required.';
    if (!form.price.trim() || Number.isNaN(Number(form.price)) || Number(form.price) < 0) return 'Price must be valid.';
    if (!form.stock.trim() || Number.isNaN(Number(form.stock)) || Number(form.stock) < 0) return 'Stock must be valid.';
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload: AdminProductPayload = {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        price_cents: Math.round(Number(form.price) * 100),
        stock_quantity: Number(form.stock),
        description: form.description.trim() || null,
        image_url: form.imageUrl.trim() || null,
      };

      if (!editingProduct) {
        const { data: existingProduct } = await adminProductService.getProductBySku(payload.sku);
        if (existingProduct) {
          setFormError('This SKU already exists. Please use a unique SKU.');
          setSaving(false);
          return;
        }
      }

      if (editingProduct) {
        const { error } = await adminProductService.updateProduct(editingProduct.id, {
          name: payload.name,
          price_cents: payload.price_cents,
          stock_quantity: payload.stock_quantity,
          description: payload.description,
          image_url: payload.image_url,
        });

        if (error) {
          console.error('Failed to update product:', error);
          setFormError('We could not update this product.');
          return;
        }

        setToast({ type: 'success', title: 'Product updated', message: `${payload.name} is now up to date.` });
      } else {
        const { error } = await adminProductService.createProduct(payload);

        if (error) {
          console.error('Failed to create product:', error);
          setFormError(error.code === '23505' ? 'This SKU already exists.' : 'We could not create this product.');
          return;
        }

        setToast({ type: 'success', title: 'Product added', message: `${payload.name} is now live in the catalog.` });
      }

      resetForm();
      await fetchProducts();
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!productToArchive) return;

    const { error } = await adminProductService.softDeleteProduct(productToArchive.id);

    if (error) {
      console.error('Failed to archive product:', error);
      setToast({
        type: 'error',
        title: 'Unable to archive product',
        message: 'Please try again in a moment.',
      });
      return;
    }

    setToast({
      type: 'success',
      title: 'Product archived',
      message: `${productToArchive.name} is now inactive.`,
    });
    setProductToArchive(null);
    if (editingProduct?.id === productToArchive.id) {
      resetForm();
    }
    await fetchProducts();
  };

  return (
    <>
      <SEO title="Admin Products" description="Manage store products from the admin panel." type="website" />

      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Products</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Manage store catalog</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/42 sm:text-base">
            Create, update, and archive products safely without exposing admin tooling to regular users.
          </p>
        </header>

        {toast && (
          <div
            className={`fixed right-4 top-20 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border px-4 py-3 shadow-2xl ${
              toast.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                : 'border-red-500/20 bg-red-500/10 text-red-100'
            }`}
          >
            <p className="font-semibold">{toast.title}</p>
            {toast.message && <p className="mt-1 text-sm opacity-80">{toast.message}</p>}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
          <section className="rounded-[28px] border border-white/5 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Product list</h2>
                <p className="text-sm text-white/38">Search by SKU, review stock, and manage status.</p>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25" size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by SKU"
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.02] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/10"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/[0.02]" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <PackageSearch className="mb-4 text-white/25" size={36} />
                <h3 className="text-lg font-semibold text-white">No products found</h3>
                <p className="mt-2 max-w-sm text-sm text-white/40">Try another SKU or add your first product from the form.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-white/30">
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">SKU</th>
                      <th className="px-4 py-2 font-medium">Price</th>
                      <th className="px-4 py-2 font-medium">Stock</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="rounded-2xl bg-white/[0.02] text-sm text-white">
                        <td className="rounded-l-2xl px-4 py-4">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.description && <p className="mt-1 line-clamp-1 text-xs text-white/35">{product.description}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-white/60">{product.sku || 'No SKU'}</td>
                        <td className="px-4 py-4">${(product.price_cents / 100).toFixed(2)}</td>
                        <td className="px-4 py-4">{product.stock_quantity ?? 0}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              product.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/8 text-white/45'
                            }`}
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(product)}
                              className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs font-medium text-white/65 transition-colors hover:text-white"
                            >
                              Edit
                            </button>
                            {product.is_active && (
                              <button
                                type="button"
                                onClick={() => setProductToArchive(product)}
                                className="rounded-xl border border-red-500/15 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/15"
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/5 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{editingProduct ? 'Edit product' : 'Add product'}</h2>
                <p className="text-sm text-white/38">
                  {editingProduct ? 'Update details safely. SKU stays locked after creation.' : 'Add a new product to the store catalog.'}
                </p>
              </div>
              {editingProduct && (
                <button type="button" onClick={resetForm} className="text-sm text-white/40 transition-colors hover:text-white/70">
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="NFC Smart Card"
                required
              />

              <Input
                label="SKU"
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="NFC-CARD-001"
                required
                disabled={Boolean(editingProduct)}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="12.99"
                  required
                />

                <Input
                  label="Stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                  placeholder="100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional product description"
                  rows={4}
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/10"
                />
              </div>

              <Input
                label="Image URL"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />

              {formError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {formError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={saving}
                leftIcon={saving ? <Loader2 size={16} className="animate-spin" /> : editingProduct ? <Save size={16} /> : <Plus size={16} />}
              >
                {editingProduct ? 'Save changes' : 'Add product'}
              </Button>
            </form>
          </section>
        </div>

        <ConfirmationModal
          isOpen={Boolean(productToArchive)}
          onClose={() => setProductToArchive(null)}
          onConfirm={handleArchive}
          title="Archive product"
          description={
            productToArchive
              ? `${productToArchive.name} will be marked inactive and removed from the shop without deleting its data.`
              : ''
          }
          confirmText="Archive product"
          cancelText="Keep product"
          variant="warning"
          isDestructive
          icon={<Trash2 className="h-6 w-6" />}
        />
      </div>
    </>
  );
}
