import { useRef, useState } from "react";
import LocationPicker from "./LocationPicker";

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

function PriceForm({ onCreated }) {
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState("Vegetables");
  const [unitChoice, setUnitChoice] = useState("kg");
  const [photoFiles, setPhotoFiles] = useState({
    product_image: null,
    shop_image: null,
  });
  const [previews, setPreviews] = useState({
    product_image: "",
    shop_image: "",
  });
  const [photoViewer, setPhotoViewer] = useState("");
  const [successDetails, setSuccessDetails] = useState(null);

  const productFileRef = useRef(null);
  const productCameraRef = useRef(null);
  const shopFileRef = useRef(null);
  const shopCameraRef = useRef(null);

  function handlePhotoChange(event, fieldName, label) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage(`${label} must be 5 MB or smaller.`);
      return;
    }

    setMessage("");
    setPhotoFiles((current) => ({ ...current, [fieldName]: file }));

    const reader = new FileReader();
    reader.onload = () => {
      setPreviews((current) => ({
        ...current,
        [fieldName]: String(reader.result),
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!location) {
      setMessage("Select the shop location on the map.");
      return;
    }

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const selectedUnit =
      unitChoice === "Other"
        ? String(formData.get("unit_custom") || "").trim()
        : unitChoice;

    formData.set("latitude", String(location.latitude));
    formData.set("longitude", String(location.longitude));
    // Keep the legacy field for deployments that still read `unit` directly.
    formData.set("unit", selectedUnit);

    if (photoFiles.product_image) {
      formData.set("product_image", photoFiles.product_image);
    }

    if (photoFiles.shop_image) {
      formData.set("shop_image", photoFiles.shop_image);
    }

    try {
      setSaving(true);

      await fetch("/api/csrf/", { credentials: "same-origin" });

      const response = await fetch("/api/prices/", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "The price could not be shared.");
      }

      const itemName = String(formData.get("item_name") || "").trim();
      const shopName = String(formData.get("shop_name") || "").trim();
      const price = String(formData.get("price") || "");
      const unit =
        unitChoice === "Other"
          ? String(formData.get("unit_custom") || "").trim()
          : unitChoice;
      const categoryName =
        category === "Other"
          ? String(formData.get("custom_category") || "").trim()
          : category;

      formElement.reset();
      setLocation(null);
      setCategory("Vegetables");
      setUnitChoice("kg");
      setPhotoFiles({ product_image: null, shop_image: null });
      setPreviews({ product_image: "", shop_image: "" });

      setSuccessDetails({
        itemName,
        shopName,
        price,
        unit,
        categoryName,
      });

      onCreated?.();
    } catch (error) {
      setMessage(error.message || "The price could not be shared.");
    } finally {
      setSaving(false);
    }
  }

  function photoUploadField({ fieldName, label, fileRef, cameraRef }) {
    const preview = previews[fieldName];

    return (
      <section className="photo-upload-card">
        <div className="photo-upload-heading">
          <strong>{label}</strong>
          <span>Optional</span>
        </div>

        {preview ? (
          <button
            className="photo-preview-button"
            type="button"
            onClick={() => setPhotoViewer(preview)}
            aria-label={`View ${label.toLowerCase()}`}
          >
            <img src={preview} alt={`${label} preview`} />
            <span>Click to view</span>
          </button>
        ) : (
          <div className="photo-empty-preview">
            <span>＋</span>
            <small>Add a photo</small>
          </div>
        )}

        <div className="photo-actions">
          <button
            className="photo-action-button"
            type="button"
            onClick={() => fileRef.current?.click()}
          >
            Choose file
          </button>

          <button
            className="photo-action-button camera"
            type="button"
            onClick={() => cameraRef.current?.click()}
          >
            Take photo
          </button>
        </div>

        <small className="photo-upload-hint">
          JPG, PNG or WebP · max 5 MB
        </small>

        <input
          ref={fileRef}
          className="photo-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => handlePhotoChange(event, fieldName, label)}
          tabIndex={-1}
          aria-hidden="true"
        />

        <input
          ref={cameraRef}
          className="photo-file-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => handlePhotoChange(event, fieldName, label)}
          tabIndex={-1}
          aria-hidden="true"
        />
      </section>
    );
  }

  return (
    <>
      <form className="price-form" onSubmit={handleSubmit}>
        <h3>Price details</h3>

        <div className="form-grid">
          <label className="form-field">
            <span>Item name</span>
            <input name="item_name" placeholder="e.g. Potato" required />
          </label>

          <label className="form-field">
            <span>Category</span>
            <select
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="Vegetables">Vegetables</option>
              <option value="Staples">Staples</option>
              <option value="Dairy">Dairy</option>
              <option value="Other">Other</option>
            </select>
          </label>

          {category === "Other" && (
            <label className="form-field form-field-wide">
              <span>Enter category</span>
              <input
                name="custom_category"
                placeholder="e.g. Household"
                maxLength={50}
                required
              />
            </label>
          )}

          <label className="form-field">
            <span>Price</span>
            <div className="price-input-wrap">
              <span>₹</span>
              <input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 40"
                required
              />
            </div>
          </label>

          <label className="form-field">
            <span>Unit</span>
            <select
              name="unit_choice"
              value={unitChoice}
              onChange={(event) => setUnitChoice(event.target.value)}
            >
              <option value="kg">per kg</option>
              <option value="piece">per piece</option>
              <option value="litre">per litre</option>
              <option value="dozen">per dozen</option>
              <option value="Other">Other</option>
            </select>
          </label>

          {unitChoice === "Other" && (
            <label className="form-field form-field-wide">
              <span>Enter unit</span>
              <input
                name="unit_custom"
                placeholder="e.g. per bunch"
                maxLength={20}
                required
              />
            </label>
          )}

          <label className="form-field form-field-wide">
            <span>Shop name</span>
            <input
              name="shop_name"
              placeholder="Enter the shop name"
              autoComplete="organization"
              required
            />
          </label>

          <label className="form-field">
            <span>Area</span>
            <input
              name="area"
              defaultValue="Indiranagar"
              placeholder="e.g. Indiranagar"
              required
            />
          </label>

          <label className="form-field">
            <span>Price date</span>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </label>
        </div>

        <div className="photo-upload-grid">
          {photoUploadField({
            fieldName: "product_image",
            label: "Item photo",
            fileRef: productFileRef,
            cameraRef: productCameraRef,
          })}

          {photoUploadField({
            fieldName: "shop_image",
            label: "Shop photo",
            fileRef: shopFileRef,
            cameraRef: shopCameraRef,
          })}
        </div>

        <LocationPicker location={location} onLocationChange={setLocation} />

        <div className="form-submit-row">
          <button className="submit-button" type="submit" disabled={saving}>
            {saving ? "Saving price…" : "Add price"}
          </button>

          {message && (
            <p className="form-message" role="alert">
              {message}
            </p>
          )}
        </div>
      </form>

      {successDetails && (
        <div
          className="price-success-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSuccessDetails(null);
            }
          }}
        >
          <section
            className="price-success-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="price-success-title"
          >
            <button
              className="price-success-close"
              type="button"
              onClick={() => setSuccessDetails(null)}
              aria-label="Close success message"
            >
              ×
            </button>

            <span className="price-success-icon" aria-hidden="true">
              ✓
            </span>

            <p className="price-success-kicker">PRICE SHARED</p>
            <h2 id="price-success-title">Price shared successfully!</h2>
            <p className="price-success-copy">
              Thanks for helping your neighbours shop smarter.
            </p>

            <div className="price-success-summary">
              <strong>{successDetails.itemName}</strong>
              <span>
                ₹{successDetails.price}
                {successDetails.unit ? ` / ${successDetails.unit}` : ""}
              </span>
              {successDetails.shopName && (
                <small>{successDetails.shopName}</small>
              )}
              {successDetails.categoryName && (
                <small>{successDetails.categoryName}</small>
              )}
            </div>

            <button
              className="price-success-done"
              type="button"
              onClick={() => setSuccessDetails(null)}
            >
              Done
            </button>
          </section>
        </div>
      )}

      {photoViewer && (
        <div
          className="photo-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={() => setPhotoViewer("")}
        >
          <button
            className="photo-viewer-close"
            type="button"
            onClick={() => setPhotoViewer("")}
            aria-label="Close photo"
          >
            ×
          </button>

          <img
            src={photoViewer}
            alt="Selected photo enlarged"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default PriceForm;
