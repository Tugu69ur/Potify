import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, Empty, Input, message } from "antd";
import {
  CloseOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { formatMnt } from "../lib/money";
import "./Cart.css";

const MONGOLIAN_PHONE = /^(?:\+976\s?)?[0-9]{8}$/;

export default function Cart({
  cart,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout,
  visible = false,
  onClose = () => {},
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );
  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  function updateQuantity(item, nextQuantity) {
    if (nextQuantity < 1) return onRemoveFromCart(item.id);
    onUpdateQuantity(item.id, nextQuantity);
  }

  async function handleCheckout() {
    const normalizedPhone = phone.replace(/\s/g, "");
    if (!name.trim() || !phone.trim() || !address.trim()) {
      message.warning("Enter your name, phone number, and delivery address.");
      return;
    }
    if (!MONGOLIAN_PHONE.test(normalizedPhone)) {
      message.warning("Enter a valid 8-digit Mongolian phone number.");
      return;
    }
    setSubmitting(true);
    try {
      const orderId = await onCheckout({
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim(),
        address: address.trim(),
      });
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      onClose();
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error(error);
      message.error(error.message || "Could not send order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      placement="right"
      open={visible}
      onClose={onClose}
      closable={false}
      width={Math.min(460, window.innerWidth)}
      styles={{ body: { padding: 0 } }}
    >
      <div className="cart-drawer">
        <header className="cart-header">
          <div>
            <span className="cart-eyebrow">MINIMAL / BAG</span>
            <h2>YOUR CART</h2>
            <p>
              {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"}
            </p>
          </div>
          <button
            className="cart-close"
            onClick={onClose}
            aria-label="Close cart"
          >
            <CloseOutlined />
          </button>
        </header>
        {cart.length === 0 ? (
          <div className="cart-empty">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
            <h3>YOUR CART IS EMPTY</h3>
            <p>Add something from the collection to get started.</p>
            <button className="cart-continue" onClick={onClose}>
              CONTINUE SHOPPING
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <ShoppingCartOutlined />
                    )}
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-topline">
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.category || "Custom order"}</p>
                      </div>
                      <button
                        className="cart-remove"
                        onClick={() => onRemoveFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                    <div className="cart-item-bottomline">
                      <div
                        className="cart-quantity"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          onClick={() =>
                            updateQuantity(item, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                        >
                          <MinusOutlined />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          <PlusOutlined />
                        </button>
                      </div>
                      <strong>{formatMnt(item.price * item.quantity)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <section className="cart-summary">
              <div>
                <span>SUBTOTAL</span>
                <strong>{formatMnt(total)}</strong>
              </div>
              <div>
                <span>DELIVERY</span>
                <span>CONFIRMED LATER</span>
              </div>
              <div className="cart-total">
                <span>TOTAL</span>
                <strong>{formatMnt(total)}</strong>
              </div>
            </section>
            <section className="cart-checkout">
              <div className="cart-section-heading">
                <span>01</span>
                <h3>DELIVERY DETAILS</h3>
              </div>
              <div className="cart-form-grid">
                <Input
                  placeholder="Full name *"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <Input
                  placeholder="Phone number *"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <Input
                  className="cart-full-field"
                  placeholder="Email (optional)"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Input.TextArea
                  className="cart-full-field"
                  placeholder="District, khoroo, building and apartment *"
                  rows={3}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>
              <div className="cart-section-heading cart-payment-heading">
                <span>02</span>
                <h3>PAYMENT</h3>
              </div>
              <div className="cart-payment-option cart-payment-selected">
                <span className="cart-payment-radio" aria-hidden="true" />
                <div>
                  <strong>CASH ON DELIVERY</strong>
                  <p>We will confirm your order and delivery cost by phone.</p>
                </div>
              </div>
              <div className="cart-payment-option cart-payment-disabled">
                <span className="cart-payment-radio" aria-hidden="true" />
                <div>
                  <strong>QPAY</strong>
                  <p>
                    Online payment will be available once merchant approval is
                    complete.
                  </p>
                </div>
              </div>
              <button
                className="cart-checkout-button"
                onClick={handleCheckout}
                disabled={submitting}
              >
                {submitting
                  ? "SENDING ORDER..."
                  : "PLACE CASH-ON-DELIVERY ORDER"}
                <span>→</span>
              </button>
            </section>
          </>
        )}
      </div>
    </Drawer>
  );
}
