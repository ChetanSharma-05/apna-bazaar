import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import MarketPrices from "./MarketPrices";
import CompareShops from "./CompareShops";
import SharePrice from "./SharePrice";
import AuthPage from "./AuthPage";
import AdminDashboard from "./AdminDashboard";
import "./App.css";

const pageTitles = {
  dashboard: "Dashboard",
  prices: "Market prices",
  compare: "Compare shops",
  share: "Share a price",
  admin: "Admin dashboard",
};

function getResetRoute() {
  const match = window.location.pathname.match(
    /^\/reset-password\/([^/]+)\/([^/]+)\/?$/,
  );

  return match ? { uid: match[1], token: match[2] } : null;
}

function App() {
  const resetRoute = useMemo(() => getResetRoute(), []);
  const [activePage, setActivePage] = useState(
    resetRoute ? "auth" : "dashboard",
  );
  const [authMode, setAuthMode] = useState(resetRoute ? "reset" : "login");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prices, setPrices] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [mapDestination, setMapDestination] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me/", {
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (response.ok) {
          const result = await response.json();
          setUser(result.user);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Could not check sign-in status:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setAuthReady(true);
        }
      }
    }

    loadSession();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPrices() {
      try {
        const response = await fetch("/api/prices/", {
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Prices load nahi ho paaye.");
        }

        const data = await response.json();
        setPrices(data.prices);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Could not load market prices:", error);
        }
      }
    }

    loadPrices();
    return () => controller.abort();
  }, [refresh]);

  function openAuth(mode = "login") {
    setAuthMode(mode);
    setActivePage("auth");
    setSidebarOpen(false);
    setMapDestination(null);
  }

  function changeAuthMode(mode) {
    if (resetRoute) {
      window.history.replaceState({}, "", "/");
    }

    setAuthMode(mode);
    setActivePage("auth");
  }

  function navigateTo(page) {
    if (page === "share" && !user) {
      sessionStorage.setItem("afterLoginPage", "share");
      openAuth("login");
      return;
    }

    if (page === "admin") {
      if (!user) {
        sessionStorage.setItem("afterLoginPage", "admin");
        openAuth("login");
        return;
      }

      if (!user.is_admin) {
        setActivePage("dashboard");
        setSidebarOpen(false);
        return;
      }
    }

    setActivePage(page);
    setSidebarOpen(false);
  }

  async function openProtectedShopMap(priceId) {
    setMapDestination(null);

    try {
      const response = await fetch(`/api/shops/${priceId}/location/`, {
        credentials: "same-origin",
      });

      if (response.status === 401) {
        sessionStorage.setItem("pendingMapPriceId", String(priceId));
        openAuth("login");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Shop location load nahi hui.");
      }

      const { latitude, longitude, shop_name } = result;
      const url =
        `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}` +
        `#map=17/${latitude}/${longitude}`;

      setMapDestination({ shopName: shop_name, url });
    } catch (error) {
      setMapDestination({ error: error.message });
    }
  }

  async function handleAuthSuccess(authenticatedUser) {
    setUser(authenticatedUser);

    if (resetRoute) {
      window.history.replaceState({}, "", "/");
    }

    const pendingMapId = sessionStorage.getItem("pendingMapPriceId");
    sessionStorage.removeItem("pendingMapPriceId");

    if (pendingMapId) {
      setActivePage("prices");
      await openProtectedShopMap(pendingMapId);
      return;
    }

    let nextPage = sessionStorage.getItem("afterLoginPage") || "dashboard";
    sessionStorage.removeItem("afterLoginPage");

    if (nextPage === "admin" && !authenticatedUser?.is_admin) {
      nextPage = "dashboard";
    }

    setActivePage(nextPage);
  }

  async function handleLogout() {
    try {
      await fetch("/api/csrf/", { credentials: "same-origin" });

      await fetch("/api/auth/logout/", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
    } finally {
      setUser(null);
      setMapDestination(null);
      setActivePage("dashboard");
    }
  }

  function handlePriceCreated() {
    setRefresh((value) => value + 1);
  }

  if (activePage === "auth") {
    return (
      <AuthPage
        mode={authMode}
        onModeChange={changeAuthMode}
        onSuccess={handleAuthSuccess}
        onBack={() => {
          if (resetRoute) {
            window.history.replaceState({}, "", "/");
          }

          setActivePage("dashboard");
        }}
        resetUid={resetRoute?.uid}
        resetToken={resetRoute?.token}
      />
    );
  }

  if (!authReady) {
    return <div className="app-loading">Apna Bazaar load ho raha hai…</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={navigateTo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={Boolean(user?.is_admin)}
      />

      <main className="app-main">
        <header className="app-topbar">
          <button
            className="menu-toggle"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>

          <div className="topbar-page-name">
            {pageTitles[activePage] || "Apna Bazaar"}
          </div>

          <div className="topbar-auth">
            {user ? (
              <>
                <span>{user.username}</span>
                <button type="button" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => openAuth("login")}>
                  Log in
                </button>
                <button type="button" onClick={() => openAuth("register")}>
                  Register
                </button>
              </>
            )}
          </div>
        </header>

        <div className="app-content">
          {activePage === "dashboard" && (
            <Dashboard prices={prices} onNavigate={navigateTo} />
          )}

          {activePage === "prices" && (
            <MarketPrices
              prices={prices}
              onNavigate={navigateTo}
              onOpenMap={openProtectedShopMap}
            />
          )}

          {activePage === "compare" && (
            <CompareShops prices={prices} onNavigate={navigateTo} />
          )}

          {activePage === "share" && user && (
            <SharePrice
              onCreated={handlePriceCreated}
              onNavigate={navigateTo}
            />
          )}

          {activePage === "admin" && user?.is_admin && <AdminDashboard />}
        </div>

        {mapDestination && (
          <div
            className="map-access-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => setMapDestination(null)}
          >
            <section
              className="map-access-card"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="map-access-close"
                type="button"
                onClick={() => setMapDestination(null)}
                aria-label="Close"
              >
                ×
              </button>

              {mapDestination.error ? (
                <p>{mapDestination.error}</p>
              ) : (
                <>
                  <h2>{mapDestination.shopName}</h2>
                  <p>Location access confirmed.</p>
                  <a href={mapDestination.url} target="_blank" rel="noreferrer">
                    Open shop map →
                  </a>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

export default App;