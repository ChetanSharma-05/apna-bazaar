import { useEffect, useMemo, useState } from "react";
import "./MarketPrices.css";

const categories = ["All items", "Vegetables", "Staples", "Dairy", "Other"];

function distanceInKm(from, to) {
  if (
    from.latitude == null ||
    from.longitude == null ||
    to.latitude == null ||
    to.longitude == null ||
    to.latitude === "" ||
    to.longitude === ""
  ) {
    return null;
  }

  const radians = (degrees) => (degrees * Math.PI) / 180;
  const lat1 = Number(from.latitude);
  const lon1 = Number(from.longitude);
  const lat2 = Number(to.latitude);
  const lon2 = Number(to.longitude);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MarketPrices({
  prices = [],
  onNavigate,
  onOpenMap,
  location,
  onLocationChange,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All items");
  const [sortBy, setSortBy] = useState("name");
  const [photoViewer, setPhotoViewer] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [nearbyOnly, setNearbyOnly] = useState(Boolean(location));
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (location) setNearbyOnly(true);
  }, [location]);

  function useCurrentLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onLocationChange?.({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setNearbyOnly(true);
        setLocating(false);
      },
      (error) => {
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Allow location access in your browser, then try again."
            : "Could not get your location. Please try again.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  const visiblePrices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...prices]
      .filter((price) => {
        if (nearbyOnly && location) {
          const distance = distanceInKm(location, price);
          if (distance === null || distance > radiusKm) return false;
        }

        const matchesSearch =
          !query ||
          price.item_name.toLowerCase().includes(query) ||
          price.shop_name.toLowerCase().includes(query);

        const matchesCategory =
          category === "All items" ||
          (category === "Other"
            ? price.category_group === "Other"
            : price.category === category);

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "low") return Number(a.price) - Number(b.price);
        if (sortBy === "high") return Number(b.price) - Number(a.price);
        return a.item_name.localeCompare(b.item_name);
      });
  }, [prices, search, category, sortBy, location, nearbyOnly, radiusKm]);

  return (
    <>
      <section className="market-page">
        <header className="market-page-heading">
          <div>
            <p className="market-kicker">THE NEIGHBOURHOOD BOARD</p>
            <h1>Market prices</h1>
            <p>Compare local prices, photos and shop locations.</p>
          </div>
          <button
            className="market-add-button"
            type="button"
            onClick={() => onNavigate("share")}
          >
            + Share a price
          </button>
        </header>

        <div className="market-controls">
          <label className="market-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search an item or shop..."
              aria-label="Search prices"
            />
          </label>

          <label className="market-sort">
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="name">Name A–Z</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>

        <section className="nearby-toolbar" aria-label="Nearby shop filter">
          <div className="nearby-copy">
            <strong>{nearbyOnly && location ? "Showing shops near you" : "Find shops near you"}</strong>
            <small>
              {nearbyOnly && location
                ? `Within ${radiusKm} km of your current location`
                : "Use your location to find nearby items and shops"}
            </small>
          </div>

          {location && (
            <div className="nearby-radius" aria-label="Nearby search radius">
              {[5, 8].map((radius) => (
                <button
                  key={radius}
                  type="button"
                  className={radiusKm === radius ? "selected" : ""}
                  onClick={() => {
                    setRadiusKm(radius);
                    setNearbyOnly(true);
                  }}
                  aria-pressed={radiusKm === radius}
                >
                  {radius} km
                </button>
              ))}
            </div>
          )}

          <button
            className="nearby-location-button"
            type="button"
            onClick={location && nearbyOnly ? () => setNearbyOnly(false) : useCurrentLocation}
            disabled={locating}
          >
            {locating
              ? "Finding location…"
              : location && nearbyOnly
                ? "Show all prices"
                : location
                  ? "Show nearby"
                  : "◎ Use my location"}
          </button>
          {locationError && <p className="nearby-error" role="alert">{locationError}</p>}
        </section>

        <nav className="market-categories" aria-label="Filter by category">
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              className={
                category === name
                  ? "category-filter selected"
                  : "category-filter"
              }
              onClick={() => setCategory(name)}
            >
              {name}
              {name === "All items" && <span>{prices.length}</span>}
            </button>
          ))}
        </nav>

        <div className="market-results-heading">
          <h2>{nearbyOnly && location ? `Prices within ${radiusKm} km` : "Prices near you"}</h2>
          <span>
            {visiblePrices.length}{" "}
            {visiblePrices.length === 1 ? "price" : "prices"}
          </span>
        </div>

        {visiblePrices.length === 0 ? (
          <div className="market-empty">
            <span>🥬</span>
            <h3>{nearbyOnly && location ? `No shops found within ${radiusKm} km` : "No matching prices"}</h3>
            <p>
              {nearbyOnly && location
                ? "Try an 8 km radius or show all prices. Shops need a saved map pin to appear nearby."
                : "Try another search or share the first price for this item."}
            </p>
            {nearbyOnly && location && radiusKm === 5 && (
              <button type="button" onClick={() => setRadiusKm(8)}>
                Search within 8 km →
              </button>
            )}
            <button type="button" onClick={() => onNavigate("share")}>
              Share a price →
            </button>
          </div>
        ) : (
          <div className="market-price-grid">
            {visiblePrices.map((price) => (
              <article className="market-price-card" key={price.id}>
                <div className="market-image-gallery">
                  {price.product_image ? (
                    <button
                      className="market-photo-button market-item-photo-button"
                      type="button"
                      onClick={() =>
                        setPhotoViewer({
                          src: price.product_image,
                          alt: `${price.item_name} photo`,
                        })
                      }
                      aria-label={`View photo of ${price.item_name}`}
                    >
                      <img
                        className="market-item-photo"
                        src={price.product_image}
                        alt={price.item_name}
                        loading="lazy"
                      />
                      <span>View</span>
                    </button>
                  ) : (
                    <div className="market-item-photo-placeholder">🥬</div>
                  )}

                  <div className="market-shop-photo-wrap">
                    {price.shop_image ? (
                      <button
                        className="market-photo-button market-shop-photo-button"
                        type="button"
                        onClick={() =>
                          setPhotoViewer({
                            src: price.shop_image,
                            alt: `${price.shop_name} shop photo`,
                          })
                        }
                        aria-label={`View photo of ${price.shop_name}`}
                      >
                        <img
                          className="market-shop-photo"
                          src={price.shop_image}
                          alt={price.shop_name}
                          loading="lazy"
                        />
                        <span>View</span>
                      </button>
                    ) : (
                      <div className="market-shop-photo-placeholder">⌂</div>
                    )}
                    <span>Shop</span>
                  </div>
                </div>

                <div className="market-card-top">
                  <span className="market-category-pill">{price.category}</span>
                  <time>{price.date}</time>
                </div>

                <h3>{price.item_name}</h3>
                <p className="market-shop">⌖ {price.shop_name}</p>

                <div className="market-price-value">
                  ₹{price.price}<small> / {price.unit}</small>
                </div>

                <div className="market-card-footer">
                  <span>
                    {price.area}
                    {nearbyOnly && location
                      ? ` · ${distanceInKm(location, price)?.toFixed(1)} km away`
                      : ""}
                  </span>
                  <button
                    className="market-map-link"
                    type="button"
                    onClick={() => onOpenMap(price.id)}
                  >
                    ⌖ Open map
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {photoViewer && (
        <div
          className="photo-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={photoViewer.alt}
          onClick={() => setPhotoViewer(null)}
        >
          <button
            className="photo-viewer-close"
            type="button"
            onClick={() => setPhotoViewer(null)}
            aria-label="Close photo"
          >
            ×
          </button>
          <img
            src={photoViewer.src}
            alt={photoViewer.alt}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default MarketPrices;
