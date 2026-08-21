import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { message } from "antd";
import {
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { formatMnt } from "../lib/money";

export default function ProductDetail({
  products,
  loading,
  onAddToCart,
}) {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  // React Router params are strings, while Supabase IDs
  // can sometimes be numbers.
  const product = products.find(
    (item) => String(item.id) === String(id)
  );

  /*
   * Find products that belong to the same category.
   *
   * Priority:
   * 1. Same category
   * 2. Same master category
   *
   * The current product is excluded.
   */
  const relatedProducts = product
    ? products
        .filter((item) => {
          if (String(item.id) === String(product.id)) {
            return false;
          }

          return (
            item.category === product.category ||
            item.masterCategory === product.masterCategory
          );
        })
        .slice(0, 4)
    : [];

  if (loading) {
    return (
      <div className="product-detail-loading">
        LOADING PRODUCT...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <span>MINIMAL / COLLECTION</span>

        <h1>PRODUCT NOT FOUND.</h1>

        <p>
          This product may no longer be available.
        </p>

        <Link to="/">
          BACK TO SHOP →
        </Link>
      </div>
    );
  }

  function addToCart() {
    onAddToCart(product, quantity);

    message.success(
      `${quantity} × ${product.name} added to cart.`,
      1.5
    );
  }

  return (
    <div className="product-detail-page">
      {/* Back navigation */}
      <Link className="product-back" to="/">
        ← BACK TO COLLECTION
      </Link>

      {/* =========================
          PRODUCT
      ========================= */}
      <div className="product-detail-layout">
        {/* Product image */}
        <div className="product-detail-image">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
            />
          ) : (
            <ShoppingCartOutlined />
          )}
        </div>

        {/* Product information */}
        <section className="product-detail-info">
          <span className="product-detail-category">
            {product.masterCategory || product.category}
          </span>

          <h1>{product.name}</h1>

          <p className="product-detail-price">
            {formatMnt(product.price)}
          </p>

          <div className="product-detail-rule" />

          {/* Description */}
          <div className="product-detail-description">
            <span>DESCRIPTION</span>

            <p>
              {product.description ||
                "A considered everyday piece from the MINIMAL collection."}
            </p>
          </div>

          {/* Product specs */}
          <div className="product-detail-specs">
            {product.gender && (
              <div>
                <span>FIT</span>
                <strong>{product.gender}</strong>
              </div>
            )}

            <div>
              <span>CATEGORY</span>
              <strong>{product.category}</strong>
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="product-detail-actions">
            <div className="product-detail-quantity">
              <button
                type="button"
                onClick={() =>
                  setQuantity((value) =>
                    Math.max(1, value - 1)
                  )
                }
                aria-label="Decrease quantity"
              >
                <MinusOutlined />
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((value) =>
                    Math.min(20, value + 1)
                  )
                }
                aria-label="Increase quantity"
              >
                <PlusOutlined />
              </button>
            </div>

            <button
              type="button"
              className="product-detail-add"
              onClick={addToCart}
            >
              ADD TO CART <span>→</span>
            </button>
          </div>

          <p className="product-detail-note">
            Delivery cost is confirmed after you place the order.
          </p>
        </section>
      </div>

      {/* =========================
          RELATED PRODUCTS
      ========================= */}
      {relatedProducts.length > 0 && (
        <section className="related-products">
          <div className="related-products-heading">
            <span>MINIMAL / COLLECTION</span>

            <h2>YOU MAY ALSO LIKE</h2>
          </div>

          <div className="related-products-grid">
            {relatedProducts.map((item) => (
              <Link
                className="related-product"
                to={`/products/${item.id}`}
                key={item.id}
              >
                {/* Image */}
                <div className="related-product-image">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                    />
                  ) : (
                    <ShoppingCartOutlined />
                  )}
                </div>

                {/* Category */}
                <span>
                  {item.category || item.masterCategory}
                </span>

                {/* Name */}
                <h3>{item.name}</h3>

                {/* Price */}
                <strong>
                  {formatMnt(item.price)}
                </strong>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}