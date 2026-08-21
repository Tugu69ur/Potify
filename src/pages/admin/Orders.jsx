import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatMnt } from "../../lib/money";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "printing",
  "shipped",
  "done",
  "cancelled",
];

const PAYMENT_STATUS_OPTIONS = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "expired",
  "refunded",
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError("");

    try {
      const { data, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            kind,
            product_id,
            title,
            quantity,
            unit_price_mnt,
            print_config,
            design_url
          )
        `)
        .order("created_at", { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      setOrders(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId, status) {
    setUpdatingId(orderId);

    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (updateError) {
        throw updateError;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status }
            : order,
        ),
      );

      setSelectedOrder((current) =>
        current?.id === orderId
          ? { ...current, status }
          : current,
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not update order.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function updatePaymentStatus(orderId, payment_status) {
    setUpdatingId(orderId);

    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status,
          paid_at: payment_status === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      const update = (order) =>
        order.id === orderId
          ? {
              ...order,
              payment_status,
              paid_at: payment_status === "paid" ? new Date().toISOString() : null,
            }
          : order;

      setOrders((current) => current.map(update));
      setSelectedOrder((current) => (current ? update(current) : current));
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not update payment status.");
    } finally {
      setUpdatingId(null);
    }
  }

  function getDesignUrl(designPath) {
    if (!designPath) return null;

    const { data } = supabase.storage
      .from("print-designs")
      .getPublicUrl(designPath);

    return data?.publicUrl || null;
  }

  async function getPrivateDesignUrl(designPath) {
    if (!designPath) return null;

    const { data, error } = await supabase.storage
      .from("print-designs")
      .createSignedUrl(designPath, 60 * 60);

    if (error) {
      console.error(error);
      return null;
    }

    return data?.signedUrl || null;
  }

  async function openDesign(designPath) {
    const url = await getPrivateDesignUrl(designPath);

    if (!url) {
      setError("Could not open design file.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function formatDate(date) {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusClass(status) {
    return `admin-order-status status-${status}`;
  }

  function paymentStatusClass(status) {
    return `admin-payment-status payment-${status || "unpaid"}`;
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          LOADING ORDERS...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* HEADER */}

      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            MINIMAL / ADMIN
          </span>

          <h1>ORDERS</h1>

          <p>
            Manage customer orders and custom printing requests.
          </p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={fetchOrders}
        >
          REFRESH
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {/* STATS */}

      <div className="admin-order-stats">

        <div className="admin-stat">
          <span>TOTAL ORDERS</span>
          <strong>{orders.length}</strong>
        </div>

        <div className="admin-stat">
          <span>PENDING</span>
          <strong>
            {
              orders.filter(
                (order) => order.status === "pending",
              ).length
            }
          </strong>
        </div>

        <div className="admin-stat">
          <span>PRINTING</span>
          <strong>
            {
              orders.filter(
                (order) => order.status === "printing",
              ).length
            }
          </strong>
        </div>

        <div className="admin-stat">
          <span>COMPLETED</span>
          <strong>
            {
              orders.filter(
                (order) => order.status === "done",
              ).length
            }
          </strong>
        </div>

      </div>

      {/* ORDERS */}

      {orders.length === 0 ? (
        <div className="admin-empty">
          <h2>NO ORDERS YET.</h2>
          <p>
            Customer orders will appear here.
          </p>
        </div>
      ) : (
        <div className="admin-orders">

          {orders.map((order) => (

            <div
              className="admin-order"
              key={order.id}
            >

              {/* ORDER TOP */}

              <div className="admin-order-top">

                <div>
                  <span className="admin-order-number">
                    ORDER
                  </span>

                  <h2>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </h2>

                  <p className="admin-order-date">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <div className="admin-order-status-wrapper">

                  <span className={statusClass(order.status)}>
                    {order.status.toUpperCase()}
                  </span>

                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) =>
                      updateStatus(
                        order.id,
                        e.target.value,
                      )
                    }
                    className="admin-status-select"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status.toUpperCase()}
                      </option>
                    ))}
                  </select>

                </div>

                <div className="admin-payment-status-wrapper">
                  <span className={paymentStatusClass(order.payment_status)}>
                    {order.payment_method === "qpay" ? "QPAY" : "COD"} / {order.payment_status || "unpaid"}
                  </span>
                  <select
                    value={order.payment_status || "unpaid"}
                    disabled={updatingId === order.id}
                    onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                    className="admin-status-select"
                    aria-label="Payment status"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* CUSTOMER */}

              <div className="admin-order-customer">

                <div>
                  <span>NAME</span>
                  <strong>
                    {order.customer_name}
                  </strong>
                </div>

                <div>
                  <span>PHONE</span>
                  <strong>
                    {order.phone}
                  </strong>
                </div>

                <div>
                  <span>EMAIL</span>
                  <strong>
                    {order.email || "—"}
                  </strong>
                </div>

                <div>
                  <span>ADDRESS</span>
                  <strong>
                    {order.address || "—"}
                  </strong>
                </div>

              </div>

              {/* ITEMS */}

              <div className="admin-order-items">

                <div className="admin-items-heading">
                  <span>ITEMS</span>
                </div>

                {order.order_items?.map((item) => {

                  const config = item.print_config;

                  return (
                    <div
                      className="admin-order-item"
                      key={item.id}
                    >

                      <div className="admin-item-main">

                        <div className="admin-item-kind">
                          {item.kind === "custom_print"
                            ? "CUSTOM"
                            : "SHOP"}
                        </div>

                        <div>
                          <h3>
                            {item.title}
                          </h3>

                          <p>
                            QTY {item.quantity}
                            {" · "}
                            {formatMnt(item.unit_price_mnt)}
                          </p>
                        </div>

                      </div>

                      {/* CUSTOM PRINT */}

                      {item.kind === "custom_print" && (
                        <div className="admin-custom-print">

                          <div className="admin-print-config">

                            <div>
                              <span>PIECE</span>
                              <strong>
                                {config?.product || "—"}
                              </strong>
                            </div>

                            <div>
                              <span>COLOR</span>
                              <strong>
                                {config?.color || "—"}
                              </strong>
                            </div>

                            <div>
                              <span>SIZE</span>
                              <strong>
                                {config?.size || "—"}
                              </strong>
                            </div>

                            <div>
                              <span>SCALE</span>
                              <strong>
                                {config?.scale
                                  ? `${Math.round(
                                      config.scale * 100,
                                    )}%`
                                  : "—"}
                              </strong>
                            </div>

                            <div>
                              <span>POSITION</span>
                              <strong>
                                {config?.position
                                  ? `${Math.round(
                                      config.position.x,
                                    )}% / ${Math.round(
                                      config.position.y,
                                    )}%`
                                  : "—"}
                              </strong>
                            </div>

                          </div>

                          {item.design_url && (
                            <button
                              className="admin-design-button"
                              onClick={() =>
                                openDesign(
                                  item.design_url,
                                )
                              }
                            >
                              VIEW DESIGN →
                            </button>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })}

              </div>

              {/* ORDER FOOTER */}

              <div className="admin-order-bottom">

                <div>
                  {order.note && (
                    <p className="admin-order-note">
                      <span>NOTE</span>
                      {order.note}
                    </p>
                  )}
                </div>

                <div className="admin-order-total">
                  <span>TOTAL</span>

                  <strong>
                    {formatMnt(order.total_mnt)}
                  </strong>
                </div>

              </div>

              {/* SELECT */}

              <button
                className="admin-view-button"
                onClick={() =>
                  setSelectedOrder(order)
                }
              >
                VIEW ORDER DETAILS
                <span>→</span>
              </button>

            </div>

          ))}

        </div>
      )}

      {/* DETAIL MODAL */}

      {selectedOrder && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >

          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="admin-modal-header">

              <div>
                <span>ORDER</span>

                <h2>
                  #{selectedOrder.id
                    .slice(0, 8)
                    .toUpperCase()}
                </h2>
              </div>

              <button
                className="admin-modal-close"
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                ×
              </button>

            </div>

            <div className="admin-modal-content">

              <div className="admin-modal-section">
                <span>STATUS</span>

                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    updateStatus(
                      selectedOrder.id,
                      e.target.value,
                    )
                  }
                  className="admin-status-select large"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-modal-section">
                <span>PAYMENT</span>
                <h3>{selectedOrder.payment_method === "qpay" ? "QPAY" : "CASH ON DELIVERY"}</h3>
                <select
                  value={selectedOrder.payment_status || "unpaid"}
                  onChange={(e) => updatePaymentStatus(selectedOrder.id, e.target.value)}
                  className="admin-status-select large"
                >
                  {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="admin-modal-section">
                <span>CUSTOMER</span>

                <h3>
                  {selectedOrder.customer_name}
                </h3>

                <p>
                  {selectedOrder.phone}
                </p>

                {selectedOrder.email && (
                  <p>
                    {selectedOrder.email}
                  </p>
                )}

                {selectedOrder.address && (
                  <p>
                    {selectedOrder.address}
                  </p>
                )}
              </div>

              <div className="admin-modal-section">

                <span>ORDER ITEMS</span>

                {selectedOrder.order_items?.map(
                  (item) => {

                    const config =
                      item.print_config;

                    return (
                      <div
                        className="admin-modal-item"
                        key={item.id}
                      >

                        <strong>
                          {item.title}
                        </strong>

                        <p>
                          Quantity: {item.quantity}
                        </p>

                        {item.kind ===
                          "custom_print" && (
                          <>
                            <p>
                              Piece:{" "}
                              {config?.product}
                            </p>

                            <p>
                              Color:{" "}
                              {config?.color}
                            </p>

                            <p>
                              Size:{" "}
                              {config?.size}
                            </p>

                            {item.design_url && (
                              <button
                                className="admin-design-button"
                                onClick={() =>
                                  openDesign(
                                    item.design_url,
                                  )
                                }
                              >
                                OPEN DESIGN →
                              </button>
                            )}
                          </>
                        )}

                      </div>
                    );
                  },
                )}

              </div>

              <div className="admin-modal-total">

                <span>TOTAL</span>

                <strong>
                  {formatMnt(
                    selectedOrder.total_mnt,
                  )}
                </strong>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
