import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Empty, Spin, Card, Row, Col, message } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { formatMnt } from "../lib/money";

import fashion1 from "../assets/fashion1.jpg";
import fashion2 from "../assets/fashion2.jpg";
import fashion3 from "../assets/fashion3.jpg";

const fashionSlides = [
  {
    image: fashion1,
    number: "01 / 03",
    season: "2026 / AUTUMN",
    title: (
      <>
        ESSENTIAL
        <br />
        FORMS
      </>
    ),
    description: "Carefully considered pieces designed for a modern wardrobe.",
  },
  {
    image: fashion2,
    number: "02 / 03",
    season: "2026 / AUTUMN",
    title: (
      <>
        QUIET
        <br />
        LUXURY
      </>
    ),
    description: "Refined silhouettes made for effortless everyday dressing.",
  },
  {
    image: fashion3,
    number: "03 / 03",
    season: "2026 / AUTUMN",
    title: (
      <>
        MODERN
        <br />
        ESSENTIALS
      </>
    ),
    description: "Minimal pieces. Strong details. Timeless character.",
  },
];

export default function Home({
  products = [],
  loading,
  onAddToCart,
  filters = {
    subCategories: [],
    masterCategories: [],
    genders: [],
  },
  searchQuery = "",
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  /*
   * Fashion hero automatically changes every 5 seconds
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((current) =>
        current === fashionSlides.length - 1 ? 0 : current + 1,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /*
   * Filter products
   */
  const filteredProducts = products.filter((product) => {
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      product.name?.toLowerCase().includes(search) ||
      product.category?.toLowerCase().includes(search);

    const matchesSubCategory =
      filters.subCategories.length === 0 ||
      filters.subCategories.includes(product.category);

    const matchesMasterCategory =
      filters.masterCategories.length === 0 ||
      filters.masterCategories.includes(product.masterCategory);

    const matchesGender =
      filters.genders.length === 0 || filters.genders.includes(product.gender);

    return (
      matchesSearch &&
      matchesSubCategory &&
      matchesMasterCategory &&
      matchesGender
    );
  });

  /*
   * Add product to cart
   */
  const handleAddToCart = (product) => {
    onAddToCart(product);

    message.success(`${product.name} added to cart!`, 1);
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="loading">
        <Spin size="large" description="Loading collection..." />
      </div>
    );
  }

  const activeSlide = fashionSlides[currentSlide];

  return (
    <div className="home-page">
      {/* =========================================
          FASHION HERO
      ========================================= */}

      <section className="fashion-hero">
        {/* IMAGE SIDE */}
        <div className="fashion-hero-image">
          {fashionSlides.map((slide, index) => (
            <img
              key={slide.image}
              src={slide.image}
              alt={`Fashion collection ${index + 1}`}
              className={`fashion-image ${
                index === currentSlide ? "active" : ""
              }`}
            />
          ))}
        </div>

        {/* CONTENT SIDE */}
        <div className="fashion-hero-content">
          {/* TOP */}
          <div className="fashion-hero-top">
            <span className="fashion-label">NEW COLLECTION</span>

            <span className="fashion-number">{activeSlide.number}</span>
          </div>

          {/* CENTER */}
          <div className="fashion-hero-middle">
            <span className="fashion-season">{activeSlide.season}</span>

            <h2 key={currentSlide}>{activeSlide.title}</h2>

            <p key={`description-${currentSlide}`}>{activeSlide.description}</p>

            <button
              className="fashion-explore"
              onClick={() => {
                document.querySelector(".collection-section")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              EXPLORE COLLECTION
              <span>→</span>
            </button>
          </div>

          {/* PROGRESS */}
          <div className="fashion-progress">
            <div className="fashion-progress-track">
              <div key={currentSlide} className="fashion-progress-bar" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          COLLECTION
      ========================================= */}

      <section className="collection-section">
        <div className="collection-header page-header">
          <div>
            <h1>COLLECTION</h1>
            <p>{filteredProducts.length} pieces</p>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <Row gutter={[24, 45]} className="products-grid">
            {filteredProducts.map((product) => (
              <Col xs={24} sm={12} md={12} lg={8} xl={6} key={product.id}>
                <Card
                  hoverable
                  className="product-card-antd"
                  styles={{
                    body: {
                      padding: "16px",
                    },
                  }}
                  cover={
                    <Link to={`/products/${product.id}`} className="product-image-wrapper">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="product-image"
                          onError={(e) => {
                            e.currentTarget.style.opacity = "0";
                          }}
                        />
                      ) : null}
                    </Link>
                  }
                >
                  <div className="collection-product-info">
                    <p className="collection-product-category product-category">
                      {product.category}
                    </p>

                    <Link to={`/products/${product.id}`} className="product-name-link">
                      <h3 className="product-name">{product.name}</h3>
                    </Link>

                    <div className="product-bottom">
                      <p className="product-price">
                        {formatMnt(product.price)}
                      </p>

                      <Button
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => handleAddToCart(product)}
                      >
                        ADD TO CART
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="empty-products">
            <Empty description="No products match your filters" />
          </div>
        )}
      </section>
    </div>
  );
}
