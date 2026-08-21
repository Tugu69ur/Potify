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
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import Custom from "./pages/Custom";
import Contact from "./pages/Contact";
import Printing from "./pages/Printing";
import DeliveryReturns from "./pages/DeliveryReturns";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Wishlist from "./pages/Wishlist";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Orders from "./pages/admin/Orders";
import Products from "./pages/admin/Products";
import Messages from "./pages/admin/Messages";
import { supabase } from "./lib/supabase";

import "./App.css";
import "./styles/home.css";
import "./styles/storefront.css";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];
const DEFAULT_COLORS = ["Black"];

function normalizeCartItem(product, quantity) {
  const size = product.size || product.sizes?.[0] || DEFAULT_SIZES[2];
  const color = product.color || product.colors?.[0] || DEFAULT_COLORS[0];

  return {
    ...product,
    size,
    color,
    quantity,
    cartItemId: `${product.id}:${size}:${color}`,
  };
}

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
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist") || "[]");
    } catch {
      return [];
    }
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

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
          sku: row.sku,
          sizes: row.sizes,
          colors: row.colors,
          stockQuantity: row.stock_quantity,
        })),
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product, quantity = 1) {
    const cartItem = normalizeCartItem(product, quantity);
    const existingItem = cart.find(
      (item) => item.cartItemId === cartItem.cartItemId,
    );

    let newCart;

    if (existingItem) {
      newCart = cart.map((item) =>
        item.cartItemId === cartItem.cartItemId
          ? {
              ...item,
          quantity: item.quantity + cartItem.quantity,
            }
          : item,
      );
    } else {
      newCart = [
        ...cart,
        {
          ...cartItem,
        },
      ];
    }

    setCart(newCart);
  }

  function removeFromCart(cartItemId) {
    setCart(cart.filter((item) => item.cartItemId !== cartItemId));
  }

  function updateCartQuantity(cartItemId, quantity) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item,
      ),
    );
  }

  function toggleWishlist(productId) {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
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
        size: item.size,
        color: item.color,
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

        <div className="store-announcement">COMPLIMENTARY DELIVERY IN ULAANBAATAR ON ORDERS OVER 150,000 MNT</div>
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
              ATELIER
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
            <Link to="/wishlist" className="store-nav-link">
              SAVED ({wishlist.length})
            </Link>
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
                    wishlist={wishlist}
                    onToggleWishlist={toggleWishlist}
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
                    wishlist={wishlist}
                    onToggleWishlist={toggleWishlist}
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
              <Route path="/delivery-returns" element={<DeliveryReturns />} />
              <Route path="/account" element={<Account />} />
              <Route
                path="/wishlist"
                element={<Wishlist products={products} wishlist={wishlist} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} />}
              />
              <Route
                path="*"
                element={
                  <Home
                    products={products}
                    loading={loading}
                    onAddToCart={addToCart}
                    filters={filters}
                    searchQuery={searchQuery}
                    wishlist={wishlist}
                    onToggleWishlist={toggleWishlist}
                  />
                }
              />
            </Routes>
          </main>
        </div>
        {isShop && <Footer />}
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
