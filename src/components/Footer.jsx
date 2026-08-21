import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="store-footer">
      <div className="store-footer-top">
        <div className="footer-statement">
          <span className="footer-eyebrow">MINIMAL / ULAANBAATAR</span>
          <h2>MADE FOR<br />THE EVERYDAY.</h2>
        </div>
        <div className="footer-newsletter">
          <span className="footer-eyebrow">PRIVATE LIST</span>
          <p>New releases, limited objects and studio notes. No noise.</p>
          <form onSubmit={(event) => event.preventDefault()}>
            <input aria-label="Email address" placeholder="YOUR EMAIL ADDRESS" type="email" />
            <button type="submit">JOIN <span>→</span></button>
          </form>
        </div>
      </div>
      <div className="store-footer-links">
        <div>
          <span>SHOP</span>
          <Link to="/">Collection</Link>
          <Link to="/custom">Custom printing</Link>
        </div>
        <div>
          <span>HELP</span>
          <Link to="/contact">Contact</Link>
          <Link to="/delivery-returns">Delivery & returns</Link>
        </div>
        <div>
          <span>FOLLOW</span>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
        </div>
      </div>
      <div className="store-footer-bottom">
        <strong>MINIMAL</strong>
        <span>© {new Date().getFullYear()} MINIMAL STUDIO. ALL RIGHTS RESERVED.</span>
        <span>ULN, MONGOLIA</span>
      </div>
    </footer>
  );
}
