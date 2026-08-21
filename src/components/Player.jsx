export default function Cart({ cart, onRemoveFromCart }) {
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <div className="cart-panel">
      <div className="cart-header">
        <h2 className="cart-title">Shopping Cart</h2>
      </div>

      {cart.length === 0 ? (
        <div className="cart-content">
          <div className="cart-empty">
            <p>Your cart is empty</p>
          </div>
        </div>
      ) : (
        <>
          <div className="cart-content">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img
                  src={item.image}
                  alt={item.name}
                  className="cart-item-image"
                  onError={(e) => {
                    e.target.style.backgroundColor = '#e5e5e5'
                  }}
                />

                <div className="cart-item-details">
                  <p className="cart-item-name">
                    {item.name}
                  </p>
                  <p className="cart-item-price">
                    ${item.price}
                  </p>
                  <p className="cart-item-quantity">
                    Qty: {item.quantity}
                  </p>
                </div>

                <button
                  className="cart-remove-btn"
                  onClick={() =>
                    onRemoveFromCart(item.id)
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <span className="cart-total-label">
                Total:
              </span>
              <span className="cart-total-amount">
                ${total.toFixed(2)}
              </span>
            </div>

            <button className="checkout-btn">
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
