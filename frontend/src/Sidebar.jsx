import { useState } from "react";
import "./Sidebar.css";

const pages = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "prices", icon: "◉", label: "Market prices" },
  { id: "compare", icon: "⌁", label: "Compare shops" },
  { id: "share", icon: "＋", label: "Share a price" },
];

const adminPage = {
  id: "admin",
  icon: "⚙",
  label: "Admin dashboard",
};

function Sidebar({ activePage, onNavigate, isAdmin }) {
  const [area, setArea] = useState("Use my location");
  const [city, setCity] = useState("Tap to find your area");
  const [locating, setLocating] = useState(false);

  const visiblePages = isAdmin
    ? [...pages.slice(0, 3), adminPage, pages[3]]
    : pages;

  function updateLocation() {
    if (!navigator.geolocation) {
      setArea("Location unavailable");
      setCity("This browser does not support GPS");
      return;
    }

    setLocating(true);
    setArea("Finding location…");
    setCity("Please allow location access");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;

        setArea(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setCity("Looking up nearby area…");

        try {
          const query = new URLSearchParams({
            format: "jsonv2",
            lat: String(latitude),
            lon: String(longitude),
            zoom: "14",
            addressdetails: "1",
          });

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${query}`,
            { headers: { Accept: "application/json" } },
          );

          if (!response.ok) {
            throw new Error("Area lookup failed");
          }

          const result = await response.json();
          const address = result.address || {};

          const neighbourhood =
            address.neighbourhood ||
            address.suburb ||
            address.quarter ||
            address.city_district ||
            address.village ||
            address.town ||
            address.city ||
            "Current location";

          const cityName =
            address.city ||
            address.town ||
            address.village ||
            address.county ||
            address.state_district ||
            "";

          const region = address.state || address.country || "";
          const details = [cityName, region]
            .filter(
              (value, index, values) =>
                value && values.indexOf(value) === index,
            )
            .join(", ");

          setArea(neighbourhood);
          setCity(
            details || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          );
        } catch {
          setArea(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setCity("Nearby area name unavailable");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setArea("Location not available");
        setCity("Allow location access and try again");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function handleNavigate(pageId) {
    onNavigate(pageId);
  }

  return (
      <aside className="sidebar">
        <a
          className="sidebar-brand"
          href="#dashboard"
          onClick={(event) => {
            event.preventDefault();
            handleNavigate("dashboard");
          }}
        >
          <span className="brand-mark">a</span>
          apna bazaar<span className="brand-dot">.</span>
        </a>

        <div className="sidebar-area">
          <span className="sidebar-label">YOUR AREA</span>

          <button
            className="area-card"
            type="button"
            onClick={updateLocation}
            disabled={locating}
            aria-label="Get current location"
          >
            <span className="area-pin">⌖</span>
            <span className="area-copy">
              <strong>{area}</strong>
              <small>{city}</small>
            </span>
            <span className="area-chevron">{locating ? "…" : "⌄"}</span>
          </button>

          <small className="location-attribution">
            Location lookup © OpenStreetMap
          </small>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="sidebar-label">MENU</span>

          {visiblePages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={`nav-link ${activePage === page.id ? "active" : ""}`}
              onClick={() => handleNavigate(page.id)}
              aria-current={activePage === page.id ? "page" : undefined}
            >
              <span className="nav-icon">{page.icon}</span>
              {page.label}
              {page.id === "share" && (
                <span className="nav-plus">↗</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-tip">
          <span className="tip-spark">✳</span>
          <strong>Good prices travel.</strong>
          <p>Share what you find and help your neighbours save.</p>
          <button type="button" onClick={() => handleNavigate("share")}>
            Share a price <span>→</span>
          </button>
        </div>

        <div className="sidebar-profile">
          <span className="profile-avatar">N</span>
          <span className="profile-copy">
            <strong>Neighbour</strong>
            <small>Community shopper</small>
          </span>
          <span className="profile-menu">···</span>
        </div>
      </aside>
  );
}

export default Sidebar;
