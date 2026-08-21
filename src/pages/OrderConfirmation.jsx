import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatMnt } from "../lib/money";

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      const { data } = await supabase
        .from("orders")
        .select(`id, customer_name, address, status, total_mnt, payment_method, payment_status, order_items (id, title, quantity, unit_price_mnt)`)
        .eq("id", id)
        .single();
      setOrder(data);
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  if (loading) return <div className="order-confirmation-loading">LOADING YOUR ORDER...</div>;
  if (!order) return <div className="order-confirmation-error"><h1>ORDER NOT FOUND.</h1><p>We could not find this order.</p><Link to="/account">VIEW YOUR ORDERS →</Link></div>;

  return (
    <main className="order-confirmation">
      <span className="order-confirmation-eyebrow">MINIMAL / ORDER CONFIRMED</span>
      <h1>THANK YOU,<br />{order.customer_name.toUpperCase()}.</h1>
      <p className="order-confirmation-intro">Your order has been received. We will contact you to confirm the delivery details.</p>
      <section className="order-confirmation-card">
        <div className="order-confirmation-meta">
          <div><span>ORDER NUMBER</span><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></div>
          <div><span>ORDER STATUS</span><strong>{order.status.toUpperCase()}</strong></div>
          <div><span>PAYMENT</span><strong>{order.payment_method === "qpay" ? "QPAY" : "CASH ON DELIVERY"}</strong></div>
        </div>
        <div className="order-confirmation-items">
          {order.order_items.map((item) => <div key={item.id}><span>{item.quantity} × {item.title}</span><strong>{formatMnt(item.quantity * item.unit_price_mnt)}</strong></div>)}
        </div>
        <div className="order-confirmation-total"><span>TOTAL</span><strong>{formatMnt(order.total_mnt)}</strong></div>
      </section>
      {order.address && <p className="order-confirmation-address"><span>DELIVERY ADDRESS</span>{order.address}</p>}
      <div className="order-confirmation-actions"><Link to="/account">VIEW MY ORDERS</Link><Link to="/">CONTINUE SHOPPING →</Link></div>
    </main>
  );
}
