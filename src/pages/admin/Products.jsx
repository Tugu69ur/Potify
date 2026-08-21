import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatMnt } from "../../lib/money";
import "./Products.css";
const EMPTY_FORM = {
  name: "",
  category: "",
  master_category: "",
  gender: "",
  price_mnt: "",
  sku: "",
  sizes: "XS, S, M, L, XL",
  colors: "Black",
  stock_quantity: "",
  description: "",
  image_url: "",
  is_active: true,
};
const { data } = await supabase.auth.getSession();  

export default function Products() {
  const fileInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM });

    setEditingProduct(null);
    setImageFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openAddModal() {
    clearMessages();
    resetForm();
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function editProduct(product) {
    clearMessages();

    setEditingProduct(product);

    setForm({
      name: product.name || "",
      category: product.category || "",
      master_category: product.master_category || "",
      gender: product.gender || "",
      price_mnt: product.price_mnt ?? "",
      sku: product.sku || "",
      sizes: product.sizes?.join(", ") || "XS, S, M, L, XL",
      colors: product.colors?.join(", ") || "Black",
      stock_quantity: product.stock_quantity ?? "",
      description: product.description || "",
      image_url: product.image_url || "",
      is_active: product.is_active,
    });

    setImageFile(null);
    setImagePreview(product.image_url || "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setModalOpen(true);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    clearMessages();

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  async function uploadProductImage(file, productId) {
    if (!file) return null;

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `${productId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function saveProduct(e) {
    e.preventDefault();

    clearMessages();

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }

    if (
      form.price_mnt === "" ||
      Number(form.price_mnt) < 0
    ) {
      setError("Enter a valid price.");
      return;
    }

    setSaving(true);

    try {
      let productId = editingProduct?.id;

      /*
       * Create product first if this is a new product.
       * We need the UUID before uploading the image.
       */
      if (!editingProduct) {
        productId = crypto.randomUUID();
      }

      let imageUrl = form.image_url.trim() || null;

      /*
       * Upload new image if selected.
       */
      if (imageFile) {
        imageUrl = await uploadProductImage(
          imageFile,
          productId
        );
      }

      const productData = {
        name: form.name.trim(),
        category: form.category.trim(),
        master_category:
          form.master_category.trim() || null,
        gender: form.gender.trim() || null,
        price_mnt: Number(form.price_mnt),
        sku: form.sku.trim() || null,
        sizes: form.sizes.split(",").map((value) => value.trim()).filter(Boolean),
        colors: form.colors.split(",").map((value) => value.trim()).filter(Boolean),
        stock_quantity: form.stock_quantity === "" ? null : Number(form.stock_quantity),
        description:
          form.description.trim() || null,
        image_url: imageUrl,
        is_active: form.is_active,
      };

      let result;

      if (editingProduct) {
        result = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
      } else {
        result = await supabase
          .from("products")
          .insert({
            id: productId,
            ...productData,
          });
      }

      if (result.error) {
        throw result.error;
      }

      setSuccess(
        editingProduct
          ? "Product updated successfully."
          : "Product added successfully."
      );

      closeModal();
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Could not save the product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product) {
    clearMessages();

    const { error: updateError } = await supabase
      .from("products")
      .update({
        is_active: !product.is_active,
      })
      .eq("id", product.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(
      product.is_active
        ? `${product.name} is now hidden.`
        : `${product.name} is now active.`
    );

    await fetchProducts();
  }

  async function deleteProduct(product) {
    clearMessages();

    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    /*
     * Delete image from storage too.
     */
    if (product.image_url) {
      try {
        const url = new URL(product.image_url);
        const pathParts = url.pathname.split("/");

        const bucketIndex =
          pathParts.indexOf("product-images");

        if (bucketIndex !== -1) {
          const storagePath = pathParts
            .slice(bucketIndex + 1)
            .join("/");

          if (storagePath) {
            await supabase.storage
              .from("product-images")
              .remove([storagePath]);
          }
        }
      } catch {
        // Product is already deleted.
      }
    }

    setSuccess("Product deleted successfully.");

    await fetchProducts();
  }

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      product.name?.toLowerCase().includes(searchText) ||
      product.category?.toLowerCase().includes(searchText) ||
      product.master_category
        ?.toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "hidden" && !product.is_active);

    return matchesSearch && matchesStatus;
  });

  const activeCount = products.filter(
    (product) => product.is_active
  ).length;

  const hiddenCount = products.filter(
    (product) => !product.is_active
  ).length;

  const totalValue = products.reduce(
    (sum, product) =>
      sum + Number(product.price_mnt || 0),
    0
  );

  return (
    <div className="admin-products-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="admin-products-header">
        <div>
          <span className="admin-products-eyebrow">
            STORE MANAGEMENT
          </span>

          <h1>PRODUCTS</h1>

          <p>
            Add, edit and manage everything available
            in your MINIMAL collection.
          </p>
        </div>

        <button
          className="admin-add-product-button"
          onClick={openAddModal}
        >
          + ADD PRODUCT
        </button>
      </header>


      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {error && (
        <div className="admin-product-alert error">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="admin-product-alert success">
          <span>{success}</span>

          <button
            onClick={() => setSuccess("")}
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}


      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="admin-product-stats">

        <div className="admin-product-stat">
          <span>TOTAL PRODUCTS</span>
          <strong>{products.length}</strong>
        </div>

        <div className="admin-product-stat">
          <span>ACTIVE</span>
          <strong>{activeCount}</strong>
        </div>

        <div className="admin-product-stat">
          <span>HIDDEN</span>
          <strong>{hiddenCount}</strong>
        </div>

        <div className="admin-product-stat">
          <span>CATALOG VALUE</span>
          <strong>
            {formatMnt(totalValue)}
          </strong>
        </div>

      </section>


      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="admin-products-toolbar">

        <div className="admin-products-search">
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="admin-products-filter">

          <button
            className={
              statusFilter === "all"
                ? "active"
                : ""
            }
            onClick={() => setStatusFilter("all")}
          >
            ALL
          </button>

          <button
            className={
              statusFilter === "active"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter("active")
            }
          >
            ACTIVE
          </button>

          <button
            className={
              statusFilter === "hidden"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter("hidden")
            }
          >
            HIDDEN
          </button>

        </div>

      </div>


      {/* =====================================================
          PRODUCT TABLE
      ===================================================== */}

      <section className="admin-products-table">

        <div className="admin-product-row header">

          <div>IMAGE</div>
          <div>PRODUCT</div>
          <div>CATEGORY</div>
          <div>PRICE</div>
          <div>STATUS</div>
          <div>ACTIONS</div>

        </div>


        {loading ? (
          <div className="admin-products-loading">
            LOADING PRODUCTS...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-products-empty">
            <h2>NO PRODUCTS</h2>

            <p>
              {search || statusFilter !== "all"
                ? "No products match your filters."
                : "Add your first product to the store."}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              className="admin-product-row"
              key={product.id}
            >

              {/* IMAGE */}

              <div>

                <div className="admin-product-thumbnail">

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                    />
                  ) : (
                    <span>
                      NO IMAGE
                    </span>
                  )}

                </div>

              </div>


              {/* PRODUCT */}

              <div>

                <h3 className="admin-product-name">
                  {product.name}
                </h3>

                {product.description && (
                  <p className="admin-product-description">
                    {product.description}
                  </p>
                )}

                <span className="admin-product-gender">
                  {product.gender || "Unisex"}
                </span>

              </div>


              {/* CATEGORY */}

              <div className="admin-product-category">

                <strong>
                  {product.category}
                </strong>

                {product.master_category && (
                  <small>
                    {product.master_category}
                  </small>
                )}

              </div>


              {/* PRICE */}

              <div className="admin-product-price">
                {formatMnt(product.price_mnt)}
              </div>


              {/* STATUS */}

              <div>

                <button
                  className={`admin-product-status ${
                    product.is_active
                      ? "active"
                      : "inactive"
                  }`}
                  onClick={() =>
                    toggleProduct(product)
                  }
                >
                  {product.is_active
                    ? "ACTIVE"
                    : "HIDDEN"}
                </button>

              </div>


              {/* ACTIONS */}

              <div className="admin-product-actions">

                <button
                  className="admin-product-action"
                  onClick={() =>
                    editProduct(product)
                  }
                >
                  EDIT
                </button>

                <button
                  className="admin-product-action danger"
                  onClick={() =>
                    deleteProduct(product)
                  }
                >
                  DELETE
                </button>

              </div>

            </div>
          ))
        )}

      </section>


      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {modalOpen && (
        <div
          className="admin-product-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >

          <div className="admin-product-modal">

            {/* MODAL HEADER */}

            <div className="admin-product-modal-header">

              <div>
                <span>
                  {editingProduct
                    ? "PRODUCT EDITOR"
                    : "NEW PRODUCT"}
                </span>

                <h2>
                  {editingProduct
                    ? "EDIT PRODUCT"
                    : "ADD PRODUCT"}
                </h2>
              </div>

              <button
                className="admin-product-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              className="admin-product-form"
              onSubmit={saveProduct}
            >

              <div className="admin-product-form-grid">

                {/* NAME */}

                <div className="admin-product-field">

                  <label>
                    PRODUCT NAME
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Essential Tee"
                    required
                  />

                </div>


                {/* CATEGORY */}

                <div className="admin-product-field">

                  <label>
                    CATEGORY
                  </label>

                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="T-Shirts"
                    required
                  />

                </div>


                {/* MASTER CATEGORY */}

                <div className="admin-product-field">

                  <label>
                    MASTER CATEGORY
                  </label>

                  <input
                    name="master_category"
                    value={form.master_category}
                    onChange={handleChange}
                    placeholder="Tops"
                  />

                </div>


                {/* GENDER */}

                <div className="admin-product-field">

                  <label>
                    GENDER
                  </label>

                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select gender
                    </option>

                    <option value="Unisex">
                      Unisex
                    </option>

                    <option value="Men">
                      Men
                    </option>

                    <option value="Women">
                      Women
                    </option>
                  </select>

                </div>


                {/* PRICE */}

                <div className="admin-product-field">

                  <label>
                    PRICE (MNT)
                  </label>

                  <input
                    name="price_mnt"
                    type="number"
                    min="0"
                    value={form.price_mnt}
                    onChange={handleChange}
                    placeholder="45000"
                    required
                  />

                </div>


                {/* ACTIVE */}

                <div className="admin-product-field">

                  <label>
                    STATUS
                  </label>

                  <label className="admin-product-checkbox">

                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />

                    <span>
                      PRODUCT IS ACTIVE
                    </span>

                  </label>

                </div>


                {/* IMAGE */}

                <div className="admin-product-field full">

                  <label>
                    PRODUCT IMAGE
                  </label>

                  <div className="admin-product-image-upload">

                    <div className="admin-product-image-preview">

                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Product preview"
                        />
                      ) : (
                        <span>
                          NO IMAGE
                        </span>
                      )}

                    </div>

                    <div className="admin-product-upload-controls">

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        hidden
                      />

                      <button
                        type="button"
                        className="admin-product-upload-button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                      >
                        CHOOSE IMAGE
                      </button>

                      <p className="admin-product-upload-note">
                        JPG, PNG or WEBP.
                        Maximum 5MB.
                        <br />
                        Recommended: high-resolution
                        product photography.
                      </p>

                    </div>

                  </div>

                </div>


                {/* DESCRIPTION */}

                <div className="admin-product-field full">

                  <label>
                    DESCRIPTION
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Product description..."
                    rows="5"
                  />

                </div>

              </div>


              {/* ERROR */}

              {error && (
                <div className="admin-product-form-error">
                  {error}
                </div>
              )}


              {/* FOOTER */}

              <div className="admin-product-form-footer">

                <span>
                  {editingProduct
                    ? "UPDATING EXISTING PRODUCT"
                    : "ADDING NEW PRODUCT"}
                </span>

                <div className="admin-product-form-actions">

                  <button
                    type="button"
                    className="admin-product-cancel-button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    className="admin-product-save-button"
                    disabled={saving}
                  >
                    {saving
                      ? "SAVING..."
                      : editingProduct
                        ? "UPDATE PRODUCT"
                        : "ADD PRODUCT"}

                    <span>→</span>
                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
