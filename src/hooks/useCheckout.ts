import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { addressService, cartService, deliveryService, type Address, type CartItem } from '../services/ecommerceService';

type PaymentMethod = 'cod' | 'omt' | 'wish' | 'bank_transfer';

export interface BuyNowItemState {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

export interface CheckoutDisplayItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

interface CheckoutLocationState {
  buyNowItem?: BuyNowItemState;
}

interface UseCheckoutParams {
  user: { id: string } | null;
  paymentMethods: Array<{ id: PaymentMethod; requiresProof: boolean }>;
}

const PENDING_BUY_NOW_KEY = 'buy_now_item';
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

const debugCheckoutLog = (message: string, payload?: unknown) => {
  if (!isDev) return;
  console.log(`[CheckoutHook] ${message}`, payload);
};

export const savePendingBuyNowItem = (item: BuyNowItemState) => {
  window.localStorage.setItem(PENDING_BUY_NOW_KEY, JSON.stringify(item));
};

export const clearPendingBuyNowItem = () => window.localStorage.removeItem(PENDING_BUY_NOW_KEY);

const normalizeCheckoutError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Something went wrong while placing your order.';

  if (/out of stock/i.test(message)) return 'One of the selected items is out of stock.';
  if (/invalid delivery address/i.test(message)) return 'Please select a valid delivery address.';
  if (/authentication required|unauthorized/i.test(message)) return 'Please sign in again and retry checkout.';
  if (/order items are required|no items/i.test(message)) return 'Your checkout is empty.';
  if (/payment proof/i.test(message)) return 'Payment proof is required for the selected payment method.';
  if (/network/i.test(message)) return 'Network error. Please check your connection and try again.';

  return message;
};

export function useCheckout({ user, paymentMethods }: UseCheckoutParams) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as CheckoutLocationState | null;
  const buyNowFromState = locationState?.buyNowItem ?? null;
  const activeOrderRef = useRef<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    city: '',
    area: '',
    address_details: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isBuyNowCheckout = !!buyNowFromState;
  const safeCartItems = isBuyNowCheckout ? [] : cartItems;

  const itemsToCheckout = useMemo<CheckoutDisplayItem[]>(
    () => {
      if (isBuyNowCheckout && buyNowFromState) {
        return [buyNowFromState];
      }

      return safeCartItems.map((item) => ({
        product_id: item.product_id,
        name: item.product?.name || 'Product',
        price: item.product?.price_cents || 0,
        quantity: item.quantity,
        image_url: item.product?.image_url,
      }));
    },
    [buyNowFromState, isBuyNowCheckout, safeCartItems]
  );

  const selectedPaymentMethod = paymentMethods.find((method) => method.id === paymentMethod);
  const canUseNewAddress =
    !selectedAddress &&
    newAddress.full_name.trim() !== '' &&
    newAddress.phone.trim() !== '' &&
    newAddress.city.trim() !== '';

  const subtotal = useMemo(
    () => itemsToCheckout.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [itemsToCheckout]
  );
  const total = subtotal + deliveryFee;


  useEffect(() => {
    if (isBuyNowCheckout) {
      clearPendingBuyNowItem();
      window.localStorage.removeItem('cart');
    }
  }, [isBuyNowCheckout]);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    void initializeCheckout();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedAddress) {
      setDeliveryFee(0);
      return;
    }

    const activeAddress = addresses.find((address) => address.id === selectedAddress);
    if (!activeAddress) return;

    void (async () => {
      const { fee } = await deliveryService.getDeliveryFee(activeAddress.city, activeAddress.area || undefined);
      setDeliveryFee(fee);
    })();
  }, [selectedAddress, addresses]);

  const reportError = (message: string) => {
    setError(message);
  };

  const initializeCheckout = async () => {
    if (!user) return;

    setPageLoading(true);
    setError(null);

    try {
      const { data: addressesData, error: addressesError } = await addressService.getUserAddresses(user.id);

      if (addressesError) {
        throw addressesError;
      }

      if (addressesData) {
        setAddresses(addressesData);
        const defaultAddress = addressesData.find((address) => address.is_default) || addressesData[0];
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        }
      }

      if (isBuyNowCheckout) {
        setCartItems([]);
        return;
      }

      if (!isBuyNowCheckout) {
        const cartResult = await cartService.getCart(user.id);
        if (cartResult.error) {
          throw cartResult.error;
        }

        const nextCartItems = cartResult.data || [];
        setCartItems(nextCartItems);

        if (nextCartItems.length === 0) {
          setError('Your cart is empty.');
        }
      }
    } catch (err) {
      console.error('Error initializing checkout:', err);
      setError('Failed to load checkout. Please try again.');
    } finally {
      setPageLoading(false);
    }
  };

  const handleProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      reportError('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reportError('File size must be less than 5MB.');
      return;
    }

    setError(null);
    setProofFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeProof = () => {
    setProofFile(null);
    setProofPreview(null);
  };

  const uploadPaymentProof = async (): Promise<string | null> => {
    if (!user || !proofFile) return null;

    const { data, error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(`${user.id}/${Date.now()}_${proofFile.name}`, proofFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from('payment_proofs').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const ensureAddressId = async (): Promise<string> => {
    if (!user) {
      throw new Error('You need to sign in before placing an order.');
    }

    if (selectedAddress) {
      return selectedAddress;
    }

    if (!canUseNewAddress) {
      throw new Error('Please select or create a delivery address.');
    }

    const { data, error: addressError } = await addressService.saveAddress(user.id, {
      ...newAddress,
      area: newAddress.area || null,
      address_details: newAddress.address_details || null,
      is_default: addresses.length === 0,
    });

    if (addressError || !data) {
      throw addressError || new Error('Failed to save delivery address.');
    }

    setAddresses((current) => [data, ...current]);
    setSelectedAddress(data.id);
    return data.id;
  };

  const handlePlaceOrder = async () => {
    if (loading || activeOrderRef.current) return;

    setError(null);

    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (itemsToCheckout.length === 0) {
      reportError('There are no items to checkout.');
      return;
    }

    if (selectedPaymentMethod?.requiresProof && !proofFile) {
      reportError('Please upload payment proof before placing your order.');
      return;
    }

    const clientOrderId = crypto.randomUUID();
    activeOrderRef.current = clientOrderId;
    setLoading(true);

    try {
      const addressId = await ensureAddressId();
      const proofImageUrl = selectedPaymentMethod?.requiresProof
        ? await uploadPaymentProof()
        : null;

      const normalizedItems = itemsToCheckout.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity || 1,
      }));

      const rpcItems = normalizedItems
        .map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }))
        .filter((item) => item.product_id && item.quantity > 0);

      if (rpcItems.length === 0) {
        throw new Error('Invalid items: missing product_id or quantity');
      }

      debugCheckoutLog('place order input', {
        clientOrderId,
        rpcItems,
        addressId,
        paymentMethod,
        deliveryFee,
        proofImageUrl,
      });

      const { data, error: orderError } = await supabase.rpc('create_order_full', {
        p_user_id: user.id,
        p_items: rpcItems,
        p_address_id: addressId,
        p_payment_method: paymentMethod,
        p_reference_number: null,
        p_delivery_fee_cents: deliveryFee,
        p_proof_image_url: proofImageUrl,
        p_client_order_id: clientOrderId,
      });

      if (orderError) {
        throw orderError;
      }

      if (!data) {
        throw new Error('Failed to create order.');
      }

      debugCheckoutLog('place order success', data);

      if (!isBuyNowCheckout) {
        await cartService.clearCart(user.id);
      }

      clearPendingBuyNowItem();
      navigate('/checkout/success', {
        replace: true,
        state: {
          orderId: Array.isArray(data) ? data[0]?.id : data.id,
          itemCount: itemsToCheckout.length,
          mode: isBuyNowCheckout ? 'buy-now' : 'cart',
        },
      });
    } catch (err) {
      debugCheckoutLog('place order failure', err);
      const message = normalizeCheckoutError(err);
      console.error('Checkout error:', err);
      reportError(message);
    } finally {
      activeOrderRef.current = null;
      setLoading(false);
    }
  };

  return {
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
    selectedAddress,
    selectedPaymentMethod,
    setNewAddress,
    setPaymentMethod,
    setSelectedAddress,
    removeProof,
    subtotal,
    total,
  };
}
