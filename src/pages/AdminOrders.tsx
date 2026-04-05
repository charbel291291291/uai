import { useEffect, useState } from "react";
import { supabase } from "../supabase";

type Product = {
  name: string;
};

type OrderItem = {
  quantity: number;
  products: Product | Product[];
};

type Profile = {
  display_name: string;
};

type Order = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  profiles: Profile[];
  order_items: OrderItem[];
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles(*),
        order_items (
          *,
          products(*)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      console.log(JSON.stringify(data, null, 2));
      setOrders(data as Order[]);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Orders</h1>

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: "1px solid #ccc",
            marginBottom: 10,
            padding: 10,
          }}
        >
          <p><strong>ID:</strong> {order.id}</p>
          <p><strong>User:</strong> {order.profiles?.[0]?.display_name}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Total:</strong> ${order.total_cents / 100}</p>

          <div>
            {order.order_items?.map((item, i) => (
              <p key={i}>
                {Array.isArray(item.products) 
                  ? item.products.map(p => p.name).join(", ")
                  : item.products?.name} x {item.quantity}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
