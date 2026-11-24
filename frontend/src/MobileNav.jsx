import "./MobileNav.css";

const pages = [
  { id: "dashboard", label: "Home" },
  { id: "prices", label: "Prices" },
  { id: "compare", label: "Compare" },
  { id: "share", label: "Share" },
];

const adminPage = { id: "admin", label: "Admin" };

function NavIcon({ page }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
      {page === "dashboard" && (
        <>
          <path d="m3.5 10 8.5-7 8.5 7" />
          <path d="M5.5 9v11h13V9M9 20v-6h6v6" />
        </>
      )}
      {page === "prices" && (
        <>
          <path d="M4 5.5h16v13H4z" />
          <path d="M8 9h8M8 12h8M8 15h5" />
        </>
      )}
      {page === "compare" && (
        <>
          <path d="M4 7h15l-3-3M20 17H5l3 3" />
          <path d="M19 7v4M5 13v4" />
        </>
      )}
      {page === "share" && (
        <>
          <path d="M12 5v14M5 12h14" />
        </>
      )}
      {page === "admin" && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="m19.4 15 .1.1 1.1.9-1.2 2.1-1.4-.5a7.9 7.9 0 0 1-1.6.9l-.3 1.5h-2.4l-.3-1.5a7.9 7.9 0 0 1-1.6-.9l-1.4.5-1.2-2.1 1.1-.9a7 7 0 0 1 0-1.9l-1.1-.9 1.2-2.1 1.4.5a7.9 7.9 0 0 1 1.6-.9l.3-1.5h2.4l.3 1.5a7.9 7.9 0 0 1 1.6.9l1.4-.5 1.2 2.1-1.1.9a7 7 0 0 1 0 1.8Z" />
        </>
      )}
    </svg>
  );
}

function MobileNav({ activePage, onNavigate, isAdmin }) {
  const visiblePages = isAdmin
    ? [...pages.slice(0, 3), adminPage, pages[3]]
    : pages;

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {visiblePages.map((page) => {
        const active = activePage === page.id;

        return (
          <button
            key={page.id}
            type="button"
            className={`mobile-nav-item ${active ? "active" : ""}`}
            onClick={() => onNavigate(page.id)}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-nav-icon">
              <NavIcon page={page.id} />
            </span>
            <span className="mobile-nav-label">{page.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileNav;
