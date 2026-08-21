import { Link } from 'react-router-dom'
import fashionImage from "../assets/fashion4.jpg";
import tshirtImage from "../assets/tshirt1.jpg";
import hoodieImage from "../assets/hoodie1.jpg";

export default function Custom() {
  return (
    <div className="custom-page">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="custom-hero">
        <div className="custom-hero-content">
          <span className="custom-eyebrow">CUSTOM PRINTING</span>

          <h1>
            MORE THAN
            <br />
            JUST CLOTHING.
          </h1>
        </div>

        <div className="custom-hero-number">01 / 03</div>
      </section>

      {/* =====================================================
          HERO IMAGE
      ===================================================== */}
      {/* 
      <section className="custom-image-section">

        <div className="custom-large-image">

          <img
            src="../assets/print.jpg"
            alt="MINIMAL custom printed clothing"
          />

        </div>

      </section> */}

      {/* =====================================================
          INTRODUCTION
      ===================================================== */}

      <section className="custom-intro">
        <div className="custom-section-label">DTF PRINTING</div>

        <div className="custom-intro-content">
          <div className="custom-intro-image">
            <img src={fashionImage} alt="MINIMAL DTF printing" />
          </div>

          <div className="custom-intro-text">
            <h2>
              A DIFFERENT WAY
              <br />
              TO WEAR YOUR IDEAS.
            </h2>

            <p>
              Direct-to-Film printing allows us to create detailed and vibrant
              graphics while keeping the clean look and feel of the garment.
            </p>

            <p>
              From typography and illustrations to logos and original artwork,
              DTF gives us the freedom to bring different ideas onto everyday
              pieces.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <section className="custom-products">
        <div className="custom-section-heading">
          <span>WHAT WE PRINT</span>

          <p>02 / 03</p>
        </div>

        <div className="custom-product-grid">
          {/* T-SHIRT */}

          <div className="custom-product">
            <div className="custom-product-image">
              <img src={tshirtImage} alt="Custom printed T-shirt" />

              <span className="custom-product-number">01</span>
            </div>

            <div className="custom-product-info">
              <h3>T-SHIRTS</h3>

              <p>
                Custom graphics, typography and artwork printed on everyday
                T-shirts.
              </p>
            </div>
          </div>

          {/* HOODIE */}

          <div className="custom-product">
            <div className="custom-product-image">
              <img src={hoodieImage} alt="Custom printed hoodie" />

              <span className="custom-product-number">02</span>
            </div>

            <div className="custom-product-info">
              <h3>HOODIES</h3>

              <p>
                Bold graphics and detailed prints applied to comfortable premium
                hoodies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL STATEMENT
      ===================================================== */}

      <section className="custom-final">
        <span className="custom-eyebrow">PRINTED BY MINIMAL</span>

        <h2>
          WEAR SOMETHING
          <br />
          <Link to="/printing" className="custom-different-link">
            DIFFERENT.
          </Link>
        </h2>

        <p>Clothing is only the beginning.</p>

        <span className="custom-final-number">03 / 03</span>
      </section>
    </div>
  );
}
