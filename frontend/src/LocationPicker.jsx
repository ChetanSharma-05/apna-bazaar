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
  const [searching, setSearching] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");

  async function searchLocations(event) {
    event.preventDefault();
    setError("");
    setSearchResults([]);

    const query = locationQuery.trim();
    if (query.length < 3) {
      setError("Enter at least 3 characters to search for a place.");
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`/api/locations/search/?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Location search is unavailable.");
      }

      if (!data.locations?.length) {
        setError("No matching places found. Try an area, city, or landmark.");
        return;
      }

      setSearchResults(data.locations);
    } catch (searchError) {
      setError(searchError.message || "Could not search for that location.");
    } finally {
      setSearching(false);
    }
  }

  function selectSearchResult(result) {
    onLocationChange({
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
      label: result.name,
    });
    setLocationQuery(result.name.split(",").slice(0, 2).join(","));
    setSearchResults([]);
    setError("");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "Your current location",
        });
        setLocating(false);
      },
      () => {
        setError("Could not get your location. Allow browser location access and try again.");
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
          <h3>Set the shop pin on the map</h3>
          <p>Search for a place, use GPS, or click the map.</p>
        </div>

        <button
          className="location-button"
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
        >
          {locating ? "Finding location…" : "◎ Use my location"}
        </button>
      </div>

      <form className="location-search-form" onSubmit={searchLocations}>
        <label className="location-search-input">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={locationQuery}
            onChange={(event) => setLocationQuery(event.target.value)}
            placeholder="Search an area, city, or landmark..."
            aria-label="Search for the shop location"
          />
        </label>
        <button
          className="location-search-button"
          type="submit"
          disabled={searching}
        >
          {searching ? "Searching…" : "Search location"}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="location-search-results" aria-label="Location search results">
          {searchResults.map((result, index) => (
            <button
              key={`${result.latitude}-${result.longitude}-${index}`}
              type="button"
              onClick={() => selectSearchResult(result)}
            >
              <span aria-hidden="true">⌖</span>
              {result.name}
            </button>
          ))}
        </div>
      )}

      <div className="location-map">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom
          className="location-map-canvas"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · style by <a href="https://www.openstreetmap.de/">OpenStreetMap Deutschland</a>'
            url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
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
          Click the map, search for a place, or use your current location.
        </p>
      )}

      <small className="location-search-attribution">
        Location search results © OpenStreetMap contributors
      </small>

      {error && <p className="location-error">{error}</p>}
    </section>
  );
}

export default LocationPicker;
