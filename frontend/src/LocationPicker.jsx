import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LocationPicker.css";

const defaultCenter = [12.9784, 77.6408];

const shopPin = L.divIcon({
  className: "shop-map-pin",
  html: "<span>⌖</span>",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(event) {
      onLocationChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapCenterUpdater({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], 16, {
        duration: 0.8,
      });
    }
  }, [location, map]);

  return null;
}

function LocationPicker({ location, onLocationChange }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Is browser mein location support nahi hai.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setError("Location nahi mil saki. Browser location permission allow karo.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  const center = location
    ? [location.latitude, location.longitude]
    : defaultCenter;

  return (
    <section className="location-picker">
      <div className="location-picker-heading">
        <div>
          <span className="location-eyebrow">SHOP LOCATION</span>
          <h3>Map par shop ka pin set karo</h3>
          <p>GPS use karo ya sahi jagah par map click karo.</p>
        </div>

        <button
          className="location-button"
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
        >
          {locating ? "Location dhoondh rahe hain…" : "◎ Use my location"}
        </button>
      </div>

      <div className="location-map">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom
          className="location-map-canvas"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onLocationChange={onLocationChange} />
          <MapCenterUpdater location={location} />

          {location && (
            <Marker
              position={[location.latitude, location.longitude]}
              icon={shopPin}
            />
          )}
        </MapContainer>
      </div>

      {location ? (
        <p className="location-coordinates">
          <span>✓ Pin selected</span>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </p>
      ) : (
        <p className="location-hint">
          Map par click karo ya current location use karo.
        </p>
      )}

      {error && <p className="location-error">{error}</p>}
    </section>
  );
}

export default LocationPicker;