import { Link } from "react-router-dom";
import { HeartFilled, ShoppingCartOutlined } from "@ant-design/icons";
import { formatMnt } from "../lib/money";

export default function Wishlist({ products, wishlist, onToggleWishlist, onAddToCart }) {
  const savedProducts = products.filter((product) => wishlist.includes(product.id));

  return (
    <div className="wishlist-page">
      <section className="wishlist-heading">
        <span>MINIMAL / PRIVATE EDIT</span>
        <h1>SAVED<br />PIECES.</h1>
        <p>{savedProducts.length} {savedProducts.length === 1 ? "piece" : "pieces"} held for later.</p>
      </section>

      {savedProducts.length > 0 ? (
        <div className="wishlist-grid">
          {savedProducts.map((product) => (
            <article className="wishlist-item" key={product.id}>
              <Link to={`/products/${product.id}`} className="wishlist-image">
                {product.image && <img src={product.image} alt={product.name} />}
              </Link>
              <div className="wishlist-item-info">
                <div>
                  <span>{product.category}</span>
                  <Link to={`/products/${product.id}`}><h2>{product.name}</h2></Link>
                  <strong>{formatMnt(product.price)}</strong>
                </div>
                <div className="wishlist-actions">
                  <button type="button" onClick={() => onAddToCart(product)}>
                    <ShoppingCartOutlined /> ADD TO BAG
                  </button>
                  <button type="button" aria-label={`Remove ${product.name} from saved pieces`} onClick={() => onToggleWishlist(product.id)}>
                    <HeartFilled />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="wishlist-empty">
          <HeartFilled />
          <h2>NOTHING SAVED YET.</h2>
          <p>Keep track of the pieces that catch your eye.</p>
          <Link to="/">EXPLORE COLLECTION <span>→</span></Link>
        </section>
      )}
    </div>
  );
}
