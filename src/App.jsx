import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Input, ConfigProvider } from "antd";

import Sidebar from "./components/Sidebar";
import Cart from "./components/Cart";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import Custom from "./pages/Custom";
import Contact from "./pages/Contact";
import Printing from "./pages/Printing";
import Login from "./pages/Login";
import Account from "./pages/Account";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Orders from "./pages/admin/Orders";
import Products from "./pages/admin/Products";
import Messages from "./pages/admin/Messages";
import { supabase } from "./lib/supabase";

import "./App.css";

function isAdminUser(user) {
  return user?.app_metadata?.role === "admin";
}

function AdminRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdminAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setAllowed(isAdminUser(user));
        setChecking(false);
      }
    }

    checkAdminAccess();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return <div className="admin-loading">LOADING...</div>;
  }

  return allowed ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#000000",
          borderRadius: 0,
        },
      }}
    >
      <BrowserRouter>
        <StoreApp />
      </BrowserRouter>
    </ConfigProvider>
  );
}

function StoreApp() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const isAdmin = location.pathname.startsWith("/admin");
  const isShop = location.pathname === "/";

  useEffect(() => {
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    subCategories: [],
    masterCategories: [],
    genders: [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [cartVisible, setCartVisible] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      setProducts(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          masterCategory: row.master_category,
          gender: row.gender,
          price: row.price_mnt,
          image: row.image_url,
          description: row.description,
        })),
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product, quantity = 1) {
    const existingItem = cart.find((item) => item.id === product.id);

    let newCart;

    if (existingItem) {
      newCart = cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + quantity,
            }
          : item,
      );
    } else {
      newCart = [
        ...cart,
        {
          ...product,
          quantity,
        },
      ];
    }

    setCart(newCart);
  }

  function removeFromCart(productId) {
    setCart(cart.filter((item) => item.id !== productId));
  }

  function updateCartQuantity(productId, quantity) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  }

  async function checkoutCart({ name, phone, email, address }) {
    const { data, error } = await supabase.rpc("create_checkout_order", {
      p_customer_name: name,
      p_phone: phone,
      p_email: email,
      p_address: address,
      p_items: cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
    });

    if (error) throw error;

    setCart([]);
    return data;
  }

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <Orders />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <Products />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <AdminRoute>
              <Messages />
            </AdminRoute>
          }
        />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        {/* =================================================
                STORE HEADER
            ================================================= */}

        <header className="store-header">
          {/* LOGO */}

          <Link to="/" className="store-brand">
            <span className="store-brand-name">MINIMAL</span>
          </Link>

          {/* NAVIGATION */}

          <nav className="store-navigation" aria-label="Main navigation">
            <Link to="/" className="store-nav-link">
              SHOP
            </Link>

            <Link to="/custom" className="store-nav-link">
              CUSTOM
            </Link>

            <Link to="/contact" className="store-nav-link">
              CONTACT
            </Link>

            {user ? (
              <Link to="/account" className="store-nav-link">
                ACCOUNT
              </Link>
            ) : (
              <Link to="/login" className="store-nav-link">
                LOGIN
              </Link>
            )}
          </nav>

          {/* SEARCH */}

          <div className="store-search">
            <Input
              placeholder="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="store-search-input"
              allowClear
            />
          </div>

          {/* CART */}

          <button
            className="store-cart-button"
            onClick={() => setCartVisible(true)}
          >
            CART
            <span>({cartCount})</span>
          </button>
        </header>

        {/* =================================================
                MAIN CONTENT
            ================================================= */}

        <div className="store-content">
          {isShop && <Sidebar filters={filters} onFiltersChange={setFilters} />}

          <main className="store-main">
            <Routes>
              <Route
                path="/"
                element={
                  <Home
                    products={products}
                    loading={loading}
                    onAddToCart={addToCart}
                    filters={filters}
                    searchQuery={searchQuery}
                  />
                }
              />
              <Route
                path="/products/:id"
                element={
                  <ProductDetail
                    products={products}
                    loading={loading}
                    onAddToCart={addToCart}
                  />
                }
              />
              <Route
                path="/order-confirmation/:id"
                element={<OrderConfirmation />}
              />
              <Route path="/custom" element={<Custom />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/printing" element={<Printing />} />
              <Route path="/account" element={<Account />} />
              <Route
                path="*"
                element={
                  <Home
                    products={products}
                    loading={loading}
                    onAddToCart={addToCart}
                    filters={filters}
                    searchQuery={searchQuery}
                  />
                }
              />
            </Routes>
          </main>
        </div>
      </div>

      {/* =================================================
              CART
          ================================================= */}

      <Cart
        cart={cart}
        onRemoveFromCart={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        onCheckout={checkoutCart}
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
      />
    </div>
  );
}
