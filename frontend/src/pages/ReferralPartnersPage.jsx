import { useEffect, useState } from "react";
import api from "../api";

const EMPTY_FORM = { name: "", company: "", position: "", profession: "", phone: "", email: "", city: "", description: "" };
const items = (response) => response.data.results || response.data;

export default function ReferralPartnersPage() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function loadRecords() {
    setLoading(true);
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    api.get(`/referral-partners/${query}`)
      .then(({ data }) => { setRecords(items({ data })); setError(""); })
      .catch(() => setError("Unable to load referral partners."))
      .finally(() => setLoading(false));
  }

  useEffect(loadRecords, [search]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(record) {
    setEditingId(record.id);
    setForm(Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, record[key] ?? ""])));
    setShowForm(true);
  }

  async function savePartner(event) {
    event.preventDefault();
    try {
      if (editingId) await api.patch(`/referral-partners/${editingId}/`, form);
      else await api.post("/referral-partners/", form);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      loadRecords();
    } catch {
      setError("The referral partner could not be saved. Check the required fields.");
    }
  }

  async function deletePartner(record) {
    if (!window.confirm(`Delete referral partner "${record.name}"?`)) return;
    try {
      await api.delete(`/referral-partners/${record.id}/`);
      loadRecords();
    } catch {
      setError("The referral partner could not be deleted.");
    }
  }

  return (
    <section className="referral-partners-page">
      <div className="page-heading">
        <div><p className="eyebrow">CRM</p><h1>Referral Partners</h1></div>
        <button className="staff-new-button" onClick={openCreate}>New Referral Partner</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {showForm && (
        <div className="modal-overlay">
          <form className="modal-card referral-modal" onSubmit={savePartner}>
            <div className="modal-header"><h2>{editingId ? "Edit Referral Partner" : "Add Referral Partner"}</h2><button type="button" className="modal-close" onClick={() => setShowForm(false)}>×</button></div>
            <div className="modal-body referral-modal-body">
              <label className="required">Referral Partner<input required value={form.name} onChange={(event) => updateField("name", event.target.value)} /></label>
              <label>Company<input value={form.company} onChange={(event) => updateField("company", event.target.value)} /></label>
              <label>Position<input value={form.position} onChange={(event) => updateField("position", event.target.value)} /></label>
              <label>Profession<input value={form.profession} onChange={(event) => updateField("profession", event.target.value)} /></label>
              <label>Phone Number<input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} /></label>
              <label>Email<input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} /></label>
              <label>City<input value={form.city} onChange={(event) => updateField("city", event.target.value)} /></label>
              <label>Description<textarea rows="4" value={form.description} onChange={(event) => updateField("description", event.target.value)} /></label>
            </div>
            <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Close</button><button className="primary-button">Save</button></div>
          </form>
        </div>
      )}
      <div className="panel referral-toolbar">
        <div className="staff-list-controls"><select aria-label="Rows per page"><option>25</option><option>50</option><option>100</option></select><button className="toolbar-icon-button">Export</button><button className="toolbar-icon-button" onClick={loadRecords}>↻</button></div>
        <label className="staff-search">Search<input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      </div>
      <div className="panel table-wrap">
        <table className="referral-table">
          <thead><tr><th>ID</th><th>Name</th><th>Company</th><th>Profession</th><th>Phone Number</th><th>No. of Leads</th><th>Lead Conversions</th><th>No. of Enquiries</th><th>Enquiries Won</th><th>Created By</th><th>Created At</th><th>Updated At</th><th>Actions</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="13" className="empty-state">Loading referral partners...</td></tr> : records.length === 0 ? <tr><td colSpan="13" className="empty-state">No referral partners found.</td></tr> : records.map((record) => <tr key={record.id}><td>{record.id}</td><td><strong>{record.name}</strong></td><td>{record.company || "—"}</td><td>{record.profession || "—"}</td><td>{record.phone || "—"}</td><td>{record.leads_count ?? 0}</td><td>{record.lead_conversions ?? 0}</td><td>{record.enquiries_count ?? 0}</td><td>{record.enquiries_won ?? 0}</td><td>Admin</td><td>{record.created_at ? new Date(record.created_at).toLocaleString() : "—"}</td><td>{record.updated_at ? new Date(record.updated_at).toLocaleString() : "—"}</td><td><div className="referral-actions"><button onClick={() => openEdit(record)} aria-label={`Edit ${record.name}`}>✎</button><button onClick={() => deletePartner(record)} aria-label={`Delete ${record.name}`}>?</button></div></td></tr>)}</tbody>
        </table>
      </div>
      <div className="table-footer">Showing 1 to {records.length} of {records.length} entries <span>Previous&nbsp;&nbsp; <strong>1</strong> &nbsp;&nbsp;Next</span></div>
    </section>
  );
}
