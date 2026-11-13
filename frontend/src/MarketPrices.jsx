import { useMemo, useState } from "react";
import "./MarketPrices.css";

const categories = ["All items", "Vegetables", "Staples", "Dairy", "Other"];

function MarketPrices({ prices = [], onNavigate, onOpenMap }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All items");
  const [sortBy, setSortBy] = useState("name");
  const [photoViewer, setPhotoViewer] = useState(null);

  const visiblePrices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...prices]
      .filter((price) => {
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
  }, [prices, search, category, sortBy]);

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
          <h2>Prices near you</h2>
          <span>
            {visiblePrices.length}{" "}
            {visiblePrices.length === 1 ? "price" : "prices"}
          </span>
        </div>

        {visiblePrices.length === 0 ? (
          <div className="market-empty">
            <span>🥬</span>
            <h3>No matching prices</h3>
            <p>Try another search or share the first price for this item.</p>
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
                  <span>{price.area}</span>
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