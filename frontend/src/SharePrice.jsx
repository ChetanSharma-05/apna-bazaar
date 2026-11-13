import PriceForm from "./PriceForm";
import "./SharePrice.css";

function SharePrice({ onCreated, onNavigate }) {
  return (
    <section className="share-page">
      <header className="share-page-heading">
        <div>
          <p className="share-kicker">COMMUNITY CONTRIBUTION</p>
          <h1>Share a price</h1>
          <p>
            Apne local bazaar ka daam, shop name aur location neighbours ke saath share karo.
          </p>
        </div>

        <button
          className="share-back-button"
          type="button"
          onClick={() => onNavigate("prices")}
        >
          View market prices →
        </button>
      </header>

      <div className="share-intro-card">
        <span className="share-spark">✳</span>
        <div>
          <strong>Har shared price kaam aata hai</strong>
          <p>
            Item, price, shop name aur date bharo. Map par shop ka pin bhi set karo.
          </p>
        </div>
      </div>

      <PriceForm onCreated={onCreated} />
    </section>
  );
}

export default SharePrice;