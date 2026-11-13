import { useEffect, useState } from "react";
import "./AdminDashboard.css";

const emptyDashboard = {
  stats: {
    total_users: 0,
    total_prices: 0,
    total_shops: 0,
  },
  prices: [],
  total_matching: 0,
};

const categoryOptions = ["Vegetables", "Staples", "Dairy", "Other"];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

function getErrorMessage(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return "Kuchh galat ho gaya.";
}

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewAll, setViewAll] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const debounce = window.setTimeout(() => {
      async function loadDashboard() {
        setLoading(true);
        setError("");

        try {
          const query = new URLSearchParams();

          if (viewAll) query.set("all", "1");
          if (search.trim()) query.set("search", search.trim());
          if (category !== "All") query.set("category", category);

          const suffix = query.toString();
          const response = await fetch(
            `/api/admin/dashboard/${suffix ? `?${suffix}` : ""}`,
            {
              credentials: "same-origin",
              signal: controller.signal,
            },
          );

          if (response.status === 401) {
            throw new Error("Admin dashboard dekhne ke liye login karein.");
          }

          if (response.status === 403) {
            throw new Error("Is dashboard ko sirf admin access kar sakta hai.");
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Dashboard data load nahi ho paaya.");
          }

          setDashboard({
            stats: {
              ...emptyDashboard.stats,
              ...data.stats,
            },
            prices: data.prices || [],
            total_matching: data.total_matching || 0,
          });
        } catch (loadError) {
          if (loadError.name !== "AbortError") {
            setError(loadError.message || "Dashboard data load nahi ho paaya.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }

      loadDashboard();
    }, 250);

    return () => {
      window.clearTimeout(debounce);
      controller.abort();
    };
  }, [search, category, viewAll, refresh]);

  const availableCategories = [
    ...new Set(
      dashboard.prices
        .map((entry) => entry.category)
        .filter(Boolean),
    ),
  ];

  const categories = [
    ...new Set([...categoryOptions, ...availableCategories]),
  ];

  function openEditForm(entry) {
    setEditingEntry(entry);
    setEditError("");
    setEditForm({
      item_name: entry.item_name || "",
      category: entry.category || "Vegetables",
      custom_category: entry.custom_category || "",
      price: entry.price || "",
      unit: entry.unit || "",
      shop_name: entry.shop_name || "",
      area: entry.area || "",
      date: entry.date || "",
    });
  }

  function closeEditForm() {
    if (savingEdit) return;

    setEditingEntry(null);
    setEditForm(null);
    setEditError("");
  }

  function updateEditField(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editingEntry || !editForm) return;

    setSavingEdit(true);
    setEditError("");
    setMessage("");

    try {
      await fetch("/api/csrf/", {
        credentials: "same-origin",
      });

      const response = await fetch(
        `/api/admin/prices/${editingEntry.id}/edit/`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify(editForm),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result.error));
      }

      setMessage(result.message || "Price entry updated.");
      setEditingEntry(null);
      setEditForm(null);
      setRefresh((value) => value + 1);
    } catch (saveError) {
      setEditError(saveError.message || "Price entry not updated..");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deletePrice(entry) {
    const confirmed = window.confirm(
      `Delete the price entry for "${entry.item_name}"?`,
    );

    if (!confirmed) return;

    setDeletingId(entry.id);
    setError("");
    setMessage("");

    try {
      await fetch("/api/csrf/", {
        credentials: "same-origin",
      });

      const response = await fetch(
        `/api/admin/prices/${entry.id}/delete/`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Price entry delete nahi ho paayi.");
      }

      setMessage(result.message || "Price entry delete ho gayi.");
      setRefresh((value) => value + 1);
    } catch (deleteError) {
      setError(deleteError.message || "Price entry delete nahi ho paayi.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-heading">
        <div>
          <p className="admin-kicker">APNA BAZAAR · ADMIN</p>
          <h1>Admin dashboard</h1>
          <p className="admin-subtitle">
            Community prices aur shops ka overview.
          </p>
        </div>

        <button
          className="admin-refresh-button"
          type="button"
          onClick={() => {
            setMessage("");
            setRefresh((value) => value + 1);
          }}
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="admin-message admin-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-message admin-success" role="status">
          {message}
        </div>
      )}

      <section className="admin-stat-grid" aria-label="Dashboard summary">
        <article className="admin-stat-card">
          <span className="admin-stat-label">TOTAL USERS</span>
          <strong>
            {loading ? "…" : dashboard.stats.total_users.toLocaleString("en-IN")}
          </strong>
          <small>Registered community members</small>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-label">PRICE ENTRIES</span>
          <strong>
            {loading ? "…" : dashboard.stats.total_prices.toLocaleString("en-IN")}
          </strong>
          <small>Prices shared by users</small>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-label">SHOPS</span>
          <strong>
            {loading ? "…" : dashboard.stats.total_shops.toLocaleString("en-IN")}
          </strong>
          <small>Unique shops in the listings</small>
        </article>
      </section>

      <section className="admin-recent-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-kicker">PRICE MANAGEMENT</p>
            <h2>{viewAll ? "All price entries" : "Recent price entries"}</h2>
          </div>

          <span>
            {loading ? "Loading…" : `${dashboard.total_matching} entries`}
          </span>
        </div>

        <div className="admin-price-controls">
          <label className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item, shop, or area..."
              aria-label="Search price entries"
            />
          </label>

          <label className="admin-category-filter">
            <span>Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="All">All categories</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            className="admin-view-all-button"
            type="button"
            onClick={() => setViewAll((current) => !current)}
          >
            {viewAll ? "Show recent" : "View all"}
          </button>
        </div>

        {error ? null : loading ? (
          <p className="admin-message">Price entries load ho rahi hain…</p>
        ) : dashboard.prices.length === 0 ? (
          <div className="admin-empty">
            <span aria-hidden="true">🥬</span>
            <h3>Koi matching price entry nahi mili</h3>
            <p>Search ya category filter badal kar dekhein.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Shop</th>
                  <th>Area</th>
                  <th>Price</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.prices.map((entry) => (
                  <tr key={entry.id}>
                    <td className="admin-item-name">{entry.item_name}</td>
                    <td>{entry.display_category || entry.category || "—"}</td>
                    <td>{entry.shop_name || "—"}</td>
                    <td>{entry.area || "—"}</td>
                    <td className="admin-price">
                      ₹{entry.price}
                      <small> / {entry.unit}</small>
                    </td>
                    <td>{formatDate(entry.date)}</td>
                    <td className="admin-actions">
                      <button
                        className="admin-edit-button"
                        type="button"
                        onClick={() => openEditForm(entry)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-delete-button"
                        type="button"
                        onClick={() => deletePrice(entry)}
                        disabled={deletingId === entry.id}
                        aria-label={`Delete ${entry.item_name} price entry`}
                      >
                        {deletingId === entry.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingEntry && editForm && (
        <div
          className="admin-edit-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditForm();
          }}
        >
          <section
            className="admin-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-edit-title"
          >
            <button
              className="admin-edit-close"
              type="button"
              onClick={closeEditForm}
              disabled={savingEdit}
              aria-label="Close edit form"
            >
              ×
            </button>

            <p className="admin-kicker">PRICE MANAGEMENT</p>
            <h2 id="admin-edit-title">Edit price entry</h2>

            <form className="admin-edit-form" onSubmit={saveEdit}>
              <label>
                <span>Item name</span>
                <input
                  name="item_name"
                  value={editForm.item_name}
                  onChange={updateEditField}
                  required
                />
              </label>

              <label>
                <span>Category</span>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={updateEditField}
                >
                  {categories
                    .filter((option) => option !== "All")
                    .map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                </select>
              </label>

              {editForm.category.toLowerCase() === "other" && (
                <label>
                  <span>Custom category</span>
                  <input
                    name="custom_category"
                    value={editForm.custom_category}
                    onChange={updateEditField}
                    placeholder="Enter category"
                  />
                </label>
              )}

              <label>
                <span>Price (₹)</span>
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editForm.price}
                  onChange={updateEditField}
                  required
                />
              </label>

              <label>
                <span>Unit</span>
                <input
                  name="unit"
                  value={editForm.unit}
                  onChange={updateEditField}
                  required
                />
              </label>

              <label>
                <span>Shop name</span>
                <input
                  name="shop_name"
                  value={editForm.shop_name}
                  onChange={updateEditField}
                />
              </label>

              <label>
                <span>Area</span>
                <input
                  name="area"
                  value={editForm.area}
                  onChange={updateEditField}
                />
              </label>

              <label>
                <span>Date</span>
                <input
                  name="date"
                  type="date"
                  value={editForm.date}
                  onChange={updateEditField}
                  required
                />
              </label>

              {editError && (
                <p className="admin-edit-error" role="alert">
                  {editError}
                </p>
              )}

              <div className="admin-edit-actions">
                <button
                  className="admin-edit-cancel"
                  type="button"
                  onClick={closeEditForm}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  className="admin-edit-save"
                  type="submit"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default AdminDashboard;