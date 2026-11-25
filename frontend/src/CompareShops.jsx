import { useMemo, useState } from "react";
import "./CompareShops.css";

function getMapUrl(offer) {
  const latitude = Number(offer.latitude);
  const longitude = Number(offer.longitude);

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function CompareShops({ prices = [], onNavigate }) {
  const [selectedItem, setSelectedItem] = useState("");

  const itemNames = useMemo(
    () => [...new Set(prices.map((price) => price.item_name))].sort(),
    [prices],
  );

  const currentItem = itemNames.includes(selectedItem)
    ? selectedItem
    : itemNames[0] || "";

  const offers = useMemo(
    () =>
      prices
        .filter((price) => price.item_name === currentItem)
        .sort((a, b) => Number(a.price) - Number(b.price)),
    [prices, currentItem],
  );

  const cheapest = offers[0];
  const highestPrice = Math.max(
    ...offers.map((offer) => Number(offer.price)),
    0,
  );

  const savings =
    offers.length > 1
      ? (
          Number(offers[offers.length - 1].price) -
          Number(cheapest.price)
        ).toFixed(2)
      : "0.00";

  return (
    <section className="compare-page">
      <header className="compare-page-heading">
        <div>
          <p className="compare-kicker">SHOP SMARTER</p>
          <h1>Compare nearby shops</h1>
          <p>Find the best price for an item in your neighbourhood.</p>
        </div>

        <label className="compare-item-select">
          <span>Choose item</span>
          <select
            value={currentItem}
            onChange={(event) => setSelectedItem(event.target.value)}
            disabled={itemNames.length === 0}
          >
            {itemNames.length === 0 && <option value="">No items yet</option>}
            {itemNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </header>

      {!cheapest ? (
        <div className="compare-empty">
          <span>⌁</span>
          <h2>No shop prices to compare yet</h2>
          <p>Share a local price and it will appear here.</p>
          <button onClick={() => onNavigate("share")}>Share a price →</button>
        </div>
      ) : (
        <>
          <section className="compare-highlight">
            <div>
              <span className="compare-deal-tag">BEST DEAL · {currentItem}</span>
              <h2>{cheapest.shop_name}</h2>
              <p>{cheapest.area} · shared on {cheapest.date}</p>

              {cheapest.latitude && cheapest.longitude && (
                <a
                  className="compare-highlight-map"
                  href={getMapUrl(cheapest)}
                  target="_blank"
                  rel="noreferrer"
                >
                  ⌖ View shop location
                </a>
              )}
            </div>

            <strong>
              ₹{cheapest.price}<small> / {cheapest.unit}</small>
            </strong>
          </section>

          <section className="compare-offers">
            <div className="compare-offers-heading">
              <div>
                <p className="compare-kicker">LOCAL PRICE CHECK</p>
                <h2>Prices by shop</h2>
              </div>
              <span>{offers.length} {offers.length === 1 ? "offer" : "offers"}</span>
            </div>

            <div className="offer-list">
              {offers.map((offer, index) => {
                const width = highestPrice
                  ? Math.max((Number(offer.price) / highestPrice) * 100, 8)
                  : 8;

                const hasLocation =
                  offer.latitude !== null &&
                  offer.longitude !== null &&
                  offer.latitude !== "" &&
                  offer.longitude !== "";

                return (
                  <article
                    className={`offer-row ${index === 0 ? "offer-best" : ""}`}
                    key={offer.id}
                  >
                    <div className="offer-info">
                      <span className="offer-rank">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="offer-shop">
                        <strong>{offer.shop_name}</strong>
                        <small>{offer.area} · shared {offer.date}</small>
                        {hasLocation && (
                          <a
                            className="offer-map-link"
                            href={getMapUrl(offer)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            ⌖ View map
                          </a>
                        )}
                      </span>

                      {index === 0 && <span className="best-badge">Lowest</span>}

                      <strong className="offer-price">
                        ₹{offer.price}<small> / {offer.unit}</small>
                      </strong>
                    </div>

                    <div className="offer-track">
                      <span style={{ width: `${width}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="compare-savings">
            <span>✳</span>
            <p>
              Lowest aur highest listing ka price difference:
              <strong> ₹{savings}</strong> per {cheapest.unit}.
            </p>
          </aside>
        </>
      )}
    </section>
  );
}

export default CompareShops;
