import "./MobileNav.css";

const pages = [
  { id: "dashboard", icon: "⌂", label: "Home" },
  { id: "prices", icon: "◉", label: "Prices" },
  { id: "compare", icon: "⇄", label: "Compare" },
  { id: "share", icon: "+", label: "Share" },
];

const adminPage = { id: "admin", icon: "⚙", label: "Admin" };

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
            className={`mobile-nav-item ${page.id === "share" ? "mobile-nav-share" : ""} ${active ? "active" : ""}`}
            onClick={() => onNavigate(page.id)}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-nav-icon" aria-hidden="true">
              {page.icon}
            </span>
            <span className="mobile-nav-label">{page.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileNav;