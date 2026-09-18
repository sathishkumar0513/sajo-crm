import { useEffect, useState } from "react";
import api from "../api";

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const load = () => api.get("/expense-categories/").then(({ data }) => setCategories(data.results || data)).catch(() => setError("Unable to load expense categories."));
  useEffect(() => { load(); }, []);
  async function addCategory(event) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post("/expense-categories/", { name: name.trim() });
      setName("");
      load();
    } catch {
      setError("Unable to create this expense category.");
    }
  }
  async function removeCategory(id) {
    if (!window.confirm("Delete this expense category?")) return;
    try { await api.delete(`/expense-categories/${id}/`); load(); } catch { setError("This category may be in use and cannot be deleted."); }
  }
  return <section className="setup-detail-page"><div className="setup-detail-header"><div><p className="eyebrow">Setup / Finance</p><h1>Expense Categories</h1></div><button className="primary-button" onClick={() => document.getElementById("expense-category-name")?.focus()}>+ New Category</button></div><div className="panel setup-detail-panel"><form className="setup-create-form" onSubmit={addCategory}><input id="expense-category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" /><button className="primary-button" type="submit">Save</button></form>{error && <p className="error-message">{error}</p>}<table className="setup-table"><thead><tr><th>Name</th><th>Created</th><th>Options</th></tr></thead><tbody>{categories.length ? categories.map((category) => <tr key={category.id}><td>{category.name}</td><td>{category.created_at ? new Date(category.created_at).toLocaleDateString() : "—"}</td><td><button className="table-action danger" onClick={() => removeCategory(category.id)}>Delete</button></td></tr>) : <tr><td colSpan="3" className="report-empty">No entries found</td></tr>}</tbody></table></div></section>;
}
