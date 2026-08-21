import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/admin/login");
      return;
    }

    setUser(user);
    setChecking(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  if (checking) {
    return (
      <div className="admin-loading">
        LOADING...
      </div>
    );
  }

  return (
    <div className="admin-page">

      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">
            MINIMAL
          </span>

          <h1>
            ADMINISTRATION
          </h1>
        </div>

        <button
          className="admin-logout"
          onClick={handleLogout}
        >
          LOG OUT
        </button>
      </header>


      <main className="admin-content">

        <section className="admin-welcome">
          <span className="admin-label">
            DASHBOARD
          </span>

          <h2>
            WELCOME BACK.
          </h2>

          <p>
            {user?.email}
          </p>
        </section>


        <section className="admin-grid">

          <button
            className="admin-card"
            onClick={() => navigate("/admin/orders")}
          >
            <span>01</span>

            <h3>
              ORDERS
            </h3>

            <p>
              View and manage customer orders.
            </p>

            <strong>
              →
            </strong>
          </button>


          <button
            className="admin-card"
            onClick={() => navigate("/admin/products")}
          >
            <span>02</span>

            <h3>
              PRODUCTS
            </h3>

            <p>
              Add, edit and manage products.
            </p>

            <strong>
              →
            </strong>
          </button>


          <button
            className="admin-card"
            onClick={() => navigate("/admin/messages")}
          >
            <span>03</span>

            <h3>
              MESSAGES
            </h3>

            <p>
              View messages sent from Contact.
            </p>

            <strong>
              →
            </strong>
          </button>

        </section>

      </main>

    </div>
  );
}