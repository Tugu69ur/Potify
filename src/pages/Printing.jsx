import { useEffect, useRef, useState } from "react";
import { Upload, Plus, Minus, RotateCcw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatMnt } from "../lib/money";

const PRINT_PRICES = {
  "T-Shirt": 45000,
  Hoodie: 89000,
  Hat: 35000,
};

export default function Printing() {
  const fileInputRef = useRef(null);

  const [product, setProduct] = useState("T-Shirt");
  const [color, setColor] = useState("White");
  const [size, setSize] = useState("M");

  const [designPreview, setDesignPreview] = useState(null);
  const [designFile, setDesignFile] = useState(null);

  const [designScale, setDesignScale] = useState(1);

  const [designPosition, setDesignPosition] = useState({
    x: 50,
    y: 42,
  });

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderSent, setOrderSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const products = {
    "T-Shirt": {
      colors: {
        White: "/mockups/whitetshirt1.jpg",
        Black: "/mockups/blacktshirt1.jpg",
        Grey: "/mockups/greytshirt1.jpg",
      },
    },

    Hoodie: {
      colors: {
        White: "/mockups/whitehoodie1.jpg",
        Black: "/mockups/blackhoodie1.jpg",
        Grey: "/mockups/greyhoodie1.jpg",
      },
    },

    Hat: {
      colors: {
        White: "/mockups/whitehat1.jpg",
        Black: "/mockups/blackhat1.jpg",
        Beige: "/mockups/greyhat1.jpg",
      },
    },
  };
  const currentProduct = products[product];

  const currentImage = currentProduct.colors[color];

  const handleUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (designPreview) {
      URL.revokeObjectURL(designPreview);
    }

    setDesignFile(file);
    setDesignPreview(URL.createObjectURL(file));
    setOrderSent(false);
    setError("");
  };

  useEffect(() => {
    return () => {
      if (designPreview) {
        URL.revokeObjectURL(designPreview);
      }
    };
  }, [designPreview]);

  const increaseScale = () => {
    setDesignScale((value) => Math.min(value + 0.1, 2));
  };

  const decreaseScale = () => {
    setDesignScale((value) => Math.max(value - 0.1, 0.3));
  };

  const resetDesign = () => {
    setDesignScale(1);

    setDesignPosition({
      x: 50,
      y: 42,
    });
  };

  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e) => {
    if (!designPreview) return;

    e.preventDefault();

    const stage = e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - stage.left) / stage.width) * 100;

    const y = ((e.clientY - stage.top) / stage.height) * 100;

    setDesignPosition({
      x,
      y,
    });

    setIsDragging(true);

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !designPreview) return;

    const stage = e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - stage.left) / stage.width) * 100;

    const y = ((e.clientY - stage.top) / stage.height) * 100;

    setDesignPosition({
      x: Math.max(15, Math.min(85, x)),
      y: Math.max(15, Math.min(80, y)),
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleOrder = async () => {
    if (!designFile) {
      setError("Please upload your design first.");
      return;
    }

    if (!customerName.trim() || !phone.trim()) {
      setError("Enter your name and phone number.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // =====================================================
      // GET CURRENT USER
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("Please sign in before placing an order.");
        setSubmitting(false);
        return;
      }

      // =====================================================
      // CREATE ORDER ID
      // =====================================================

      const uploadId = crypto.randomUUID();

      const fileExt = designFile.name.split(".").pop()?.toLowerCase() || "png";

      const filePath = `${user.id}/${uploadId}.${fileExt}`;

      // =====================================================
      // UPLOAD DESIGN
      // =====================================================

      const { error: uploadError } = await supabase.storage
        .from("print-designs")
        .upload(filePath, designFile, {
          contentType: designFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: orderError } = await supabase.rpc(
        "create_custom_print_order",
        {
          p_customer_name: customerName.trim(),
          p_phone: phone.trim(),
          p_product: product,
          p_color: color,
          p_size: size,
          p_scale: designScale,
          p_position: designPosition,
          p_design_path: filePath,
        },
      );

      if (orderError) throw orderError;

      setOrderSent(true);
    } catch (err) {
      console.error(err);

      setError(err.message || "Could not send this design.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="printing-page">
      {/* HEADER */}

      <div className="printing-header">
        <div>
          <span className="printing-eyebrow">PRINTED BY MINIMAL</span>

          <h1>
            MAKE IT
            <br />
            YOURS.
          </h1>
        </div>
      </div>

      {/* CONFIGURATOR */}

      <div className="printing-layout">
        {/* LEFT — PRODUCT PREVIEW */}

        <div className="printing-preview">
          <div className="preview-label">
            <span>PREVIEW</span>
            <span>01 / 02</span>
          </div>

          <div
            className={`mockup-stage ${isDragging ? "dragging" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              src={currentImage}
              alt={`${color} ${product}`}
              className="mockup-product"
            />

            {designPreview && (
              <img
                src={designPreview}
                alt="Your design"
                className="mockup-design"
                draggable={false}
                style={{
                  left: `${designPosition.x}%`,
                  top: `${designPosition.y}%`,
                  transform: `
        translate(-50%, -50%)
        scale(${designScale})
      `,
                }}
              />
            )}

            {!designPreview && (
              <div className="upload-placeholder">
                <span>YOUR DESIGN</span>
              </div>
            )}
          </div>

          {/* DESIGN CONTROLS */}

          {designPreview && (
            <div className="design-controls">
              <button onClick={decreaseScale} aria-label="Decrease size">
                <Minus size={15} />
              </button>

              <span>{Math.round(designScale * 100)}%</span>

              <button onClick={increaseScale} aria-label="Increase size">
                <Plus size={15} />
              </button>

              <button onClick={resetDesign} aria-label="Reset">
                <RotateCcw size={15} />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — OPTIONS */}

        <div className="printing-options">
          {/* PRODUCT */}

          <div className="option-section">
            <div className="option-heading">
              <span>01</span>
              <h3>SELECT PIECE</h3>
            </div>

            <div className="product-options">
              {Object.keys(products).map((item) => (
                <button
                  key={item}
                  className={
                    product === item ? "option-button active" : "option-button"
                  }
                  onClick={() => {
                    setProduct(item);

                    setColor(Object.keys(products[item].colors)[0]);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* COLOR */}

          <div className="option-section">
            <div className="option-heading">
              <span>02</span>
              <h3>COLOR</h3>
            </div>

            <div className="color-options">
              {Object.keys(currentProduct.colors).map((item) => (
                <button
                  key={item}
                  className={
                    color === item ? "color-option active" : "color-option"
                  }
                  onClick={() => setColor(item)}
                >
                  <span className={`color-dot color-${item.toLowerCase()}`} />

                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* SIZE */}

          <div className="option-section">
            <div className="option-heading">
              <span>03</span>
              <h3>SIZE</h3>
            </div>

            <div className="size-options">
              {["XS", "S", "M", "L", "XL", "XXL"].map((item) => (
                <button
                  key={item}
                  className={
                    size === item ? "size-button active" : "size-button"
                  }
                  onClick={() => setSize(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* UPLOAD */}

          <div className="option-section">
            <div className="option-heading">
              <span>04</span>
              <h3>YOUR DESIGN</h3>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleUpload}
              hidden
            />

            <button
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={17} />

              <span>{designPreview ? "CHANGE DESIGN" : "UPLOAD IMAGE"}</span>

              <span className="upload-arrow">→</span>
            </button>

            <p className="upload-note">
              PNG, JPG or WEBP · Transparent PNG recommended
            </p>
          </div>

          {/* ORDER */}

          <div className="printing-order">
            <div className="option-section">
              <div className="option-heading">
                <span>05</span>
                <h3>YOUR DETAILS</h3>
              </div>

              <input
                className="printing-input"
                type="text"
                placeholder="Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <input
                className="printing-input"
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="order-summary">
              <span>
                {color} {product}
              </span>

              <span>{formatMnt(PRINT_PRICES[product])}</span>
            </div>

            <button
              className="order-button"
              onClick={handleOrder}
              disabled={submitting}
            >
              {submitting
                ? "SENDING..."
                : orderSent
                  ? "REQUEST SENT"
                  : "CONTINUE WITH THIS DESIGN"}

              <span>→</span>
            </button>

            {error && <p className="order-message">{error}</p>}

            {orderSent && (
              <p className="order-message">
                Your design has been saved. We will contact you to confirm the
                details.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
  