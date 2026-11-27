import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import "./Dashboard.css";

function FloatingProduce({ position, color, size, speed = 1, shape = "sphere" }) {
  const object = useRef();

  useFrame(({ clock }) => {
    if (!object.current) return;
    const time = clock.getElapsedTime() * speed;
    object.current.position.y = position[1] + Math.sin(time) * 0.14;
    object.current.rotation.y = time * 0.25;
    object.current.rotation.z = Math.sin(time * 0.6) * 0.08;
  });

  return (
    <mesh ref={object} position={position} castShadow>
      {shape === "carrot" ? (
        <coneGeometry args={[size * 0.55, size * 1.8, 24]} />
      ) : (
        <sphereGeometry args={[size, 32, 32]} />
      )}
      <meshStandardMaterial color={color} roughness={0.32} />
    </mesh>
  );
}

function ProduceScene() {
  const group = useRef();

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.18) * 0.16;
    }
  });

  return (
    <group ref={group}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow />
      <FloatingProduce position={[-0.85, 0.1, 0]} color="#e56e45" size={0.66} />
      <FloatingProduce position={[0.6, 0.35, 0.25]} color="#7ba45a" size={0.55} />
      <FloatingProduce position={[1.2, -0.55, -0.2]} color="#f0b64f" size={0.42} />
      <FloatingProduce position={[-0.15, -0.8, 0.35]} color="#d77d3c" size={0.35} shape="carrot" />
      <FloatingProduce position={[-1.35, -0.8, -0.35]} color="#9fbd74" size={0.3} />
    </group>
  );
}

function getMapUrl(price) {
  const latitude = Number(price.latitude);
  const longitude = Number(price.longitude);

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function Dashboard({ prices = [], onNavigate }) {
  const today = new Date().toISOString().slice(0, 10);
  const sharedToday = prices.filter((price) => price.date === today).length;
  const cheapest = [...prices].sort(
    (a, b) => Number(a.price) - Number(b.price),
  )[0];

  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="dashboard-page">
      <header className="page-heading">
        <div>
          <p className="dashboard-kicker">{dateLabel.toUpperCase()}</p>
          <h1>Good morning, neighbour <span>✳</span></h1>
          <p className="dashboard-subtitle">
            Here’s what’s happening in your local market.
          </p>
        </div>
        <button
          className="dashboard-share-button"
          onClick={() => onNavigate("share")}
        >
          + Share a price
        </button>
      </header>

      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-tag">YOUR COMMUNITY MARKET</span>
          <h2>Good prices<br /><em>grow together.</em></h2>
          <p>See what your neighbours are paying around Indiranagar today.</p>
          <button
            className="hero-link"
            onClick={() => onNavigate("prices")}
          >
            Explore market prices <span>→</span>
          </button>
        </div>

        <div className="hero-scene" aria-label="Floating 3D vegetables">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ProduceScene />
          </Canvas>
          <span className="scene-orbit orbit-one" />
          <span className="scene-orbit orbit-two" />
        </div>
      </section>

      <section className="dashboard-stats">
        <article className="stat-card">
          <span className="stat-icon green">▦</span>
          <p>PRICES ON THE BOARD</p>
          <strong>{prices.length}</strong>
          <small>shared by your community</small>
        </article>

        <article className="stat-card">
          <span className="stat-icon orange">↗</span>
          <p>SHARED TODAY</p>
          <strong>{sharedToday}</strong>
          <small>fresh local updates</small>
        </article>

        <article className="stat-card best-deal">
          <span className="stat-icon yellow">✳</span>
          <p>LOWEST PRICE LISTED</p>
          <strong>{cheapest ? `₹${cheapest.price}` : "—"}</strong>
          <small>
            {cheapest
              ? `${cheapest.item_name} · ${cheapest.shop_name}`
              : "Add the first price"}
          </small>
        </article>
      </section>

      <section className="dashboard-recent">
        <div className="recent-heading">
          <div>
            <p className="dashboard-kicker">FROM YOUR NEIGHBOURS</p>
            <h2>Recently shared</h2>
          </div>
          <button
            className="recent-link"
            onClick={() => onNavigate("prices")}
          >
            View all prices →
          </button>
        </div>

        {prices.length === 0 ? (
          <p className="dashboard-empty">
            No prices yet. Share the first one with your neighbourhood.
          </p>
        ) : (
          <div className="recent-list">
            {prices.slice(0, 4).map((price) => {
              const hasLocation =
                price.latitude !== null &&
                price.longitude !== null &&
                price.latitude !== "" &&
                price.longitude !== "";

              return (
                <article className="recent-row" key={price.id}>
                  <span className="recent-item-icon">✿</span>

                  <span className="recent-item-name">
                    <strong>{price.item_name}</strong>
                    <small>{price.shop_name} · {price.area}</small>
                  </span>

                  {hasLocation && (
                    <a
                      className="recent-map-link"
                      href={getMapUrl(price)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${price.shop_name} on map`}
                    >
                      ⌖ <span>Map</span>
                    </a>
                  )}

                  <strong className="recent-price">
                    ₹{price.price}<small> / {price.unit}</small>
                  </strong>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
 