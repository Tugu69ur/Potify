import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatMnt } from "../lib/money";

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          customer_name,
          phone,
          email,
          address,
          note,
          status,
          payment_method,
          payment_status,
          total_mnt,
          created_at,
          order_items (
            id,
            kind,
            title,
            quantity,
            unit_price_mnt,
            design_url,
            print_config
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setOrders(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    navigate("/");
  }

  if (loading) {
    return (
      <div className="minimal-account-loading">
        LOADING ACCOUNT...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "CUSTOMER";

  return (
    <div className="minimal-account">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="account-header">

        <div>
          <span className="account-eyebrow">
            YOUR ACCOUNT
          </span>

          <h1>
            HELLO,
            <br />
            {displayName.toUpperCase()}.
          </h1>
        </div>

        <button
          className="account-logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "SIGNING OUT..." : "SIGN OUT"}
        </button>

      </section>


      {/* =================================================
          PROFILE
      ================================================= */}

      <section className="account-profile">

        <div className="account-section-label">
          PROFILE
        </div>

        <div className="account-profile-grid">

          <div>
            <span>NAME</span>
            <p>{displayName}</p>
          </div>

          <div>
            <span>EMAIL</span>
            <p>{user.email}</p>
          </div>

        </div>

      </section>


      {/* =================================================
          ORDERS
      ================================================= */}

      <section className="account-orders">

        <div className="account-orders-heading">

          <div>
            <span className="account-section-label">
              ORDER HISTORY
            </span>

            <h2>
              YOUR ORDERS
            </h2>
          </div>

          <span>
            {orders.length}{" "}
            {orders.length === 1 ? "ORDER" : "ORDERS"}
          </span>

        </div>


        {orders.length === 0 ? (

          <div className="account-empty">

            <p>
              You haven't placed any orders yet.
            </p>

            <Link to="/">
              EXPLORE THE COLLECTION →
            </Link>

          </div>

        ) : (

          <div className="account-order-list">

            {orders.map((order) => (

              <article
                key={order.id}
                className="account-order"
              >

                <div className="account-order-top">

                  <div>
                    <span>ORDER</span>

                    <strong>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </strong>
                  </div>

                  <div>
                    <span>DATE</span>

                    <strong>
                      {new Date(
                        order.created_at
                      ).toLocaleDateString()}
                    </strong>
                  </div>

                  <div>
                    <span>STATUS</span>

                    <strong className="order-status">
                      {order.status.toUpperCase()}
                    </strong>
                  </div>

                  <div>
                    <span>PAYMENT</span>

                    <strong className={`payment-status payment-${order.payment_status || "unpaid"}`}>
                      {order.payment_method === "qpay" ? "QPAY" : "COD"} / {(order.payment_status || "unpaid").toUpperCase()}
                    </strong>
                  </div>

                  <div>
                    <span>TOTAL</span>

                    <strong>
                      {formatMnt(order.total_mnt)}
                    </strong>
                  </div>

                </div>


                <div className="account-order-items">

                  {order.order_items?.map((item) => (

                    <div
                      key={item.id}
                      className="account-order-item"
                    >

                      <div>
                        <span>
                          {item.kind === "custom_print"
                            ? "CUSTOM PRINT"
                            : "READY MADE"}
                        </span>

                        <h3>
                          {item.title}
                        </h3>
                      </div>

                      <div>
                        ×{item.quantity}
                      </div>

                    </div>

                  ))}

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}
