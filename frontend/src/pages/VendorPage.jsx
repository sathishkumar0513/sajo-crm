import { useEffect, useState } from "react";
import api from "../api";
import Icon from "../components/Icon";

const EMPTY_VENDOR = {
  company: "",
  gst_number: "",
  phone: "",
  email: "",
  product: "",
  address: "",
  country: "India",
  state: "Tamil Nadu",
  city: "",
  zip_code: "",
  is_active: true,
};

export default function VendorPage() {
  const [vendors, setVendors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadVendors() {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const [{ data: vendorData }, { data: summaryData }] = await Promise.all([
        api.get(`/vendors/${query}`),
        api.get("/vendors/summary/"),
      ]);
      setVendors(vendorData.results || vendorData);
      setSummary(summaryData);
      setError("");
    } catch {
      setError("Unable to load vendors. Please verify the API connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, [search]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_VENDOR);
    setShowForm(true);
  }

  function openEdit(vendor) {
    setEditingId(vendor.id);
    setForm(Object.fromEntries(Object.keys(EMPTY_VENDOR).map((key) => [key, vendor[key] ?? ""])));
    setShowForm(true);
  }

  async function saveVendor(event) {
    event.preventDefault();
    try {
      if (editingId) await api.patch(`/vendors/${editingId}/`, form);
      else await api.post("/vendors/", form);
      setShowForm(false);
      setEditingId(null);
      await loadVendors();
    } catch {
      setError("The vendor could not be saved. Check the required fields.");
    }
  }

  async function deleteVendor(vendor) {
    if (!window.confirm(`Delete vendor "${vendor.company}"?`)) return;
    try {
      await api.delete(`/vendors/${vendor.id}/`);
      loadVendors();
    } catch {
      setError("The vendor could not be deleted.");
    }
  }

  async function toggleStatus(vendor) {
    try {
      await api.post(`/vendors/${vendor.id}/toggle_status/`);
      loadVendors();
    } catch {
      setError("The vendor status could not be updated.");
    }
  }

  function exportVendors() {
    const headers = ["ID", "Company", "Product", "Phone", "Email", "Country", "State", "City", "Active"];
    const rows = vendors.map((vendor) => [vendor.id, vendor.company, vendor.product, vendor.phone, vendor.email, vendor.country, vendor.state, vendor.city, vendor.is_active ? "Yes" : "No"]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vendors.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="vendor-page">
      <div className="page-heading">
        <div><p className="eyebrow">Purchase</p><h1>Vendors</h1></div>
        <button className="staff-new-button" onClick={openCreate}>New Vendor</button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="panel vendor-form" onSubmit={saveVendor}>
          <div className="vendor-form-heading"><div><p className="eyebrow">Profile</p><h2>Vendor Details</h2></div><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Close</button></div>
          <div className="vendor-form-grid">
            <label className="required">Company<input required value={form.company} onChange={(event) => updateField("company", event.target.value)} /></label>
            <label>Address<textarea rows="3" value={form.address} onChange={(event) => updateField("address", event.target.value)} /></label>
            <label>GST Number<input value={form.gst_number} onChange={(event) => updateField("gst_number", event.target.value)} /></label>
            <label>Country<select value={form.country} onChange={(event) => updateField("country", event.target.value)}><option>India</option><option>United Arab Emirates</option><option>United States</option></select></label>
            <label>Phone<input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} /></label>
            <label>State<input value={form.state} onChange={(event) => updateField("state", event.target.value)} /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} /></label>
            <label>City<input value={form.city} onChange={(event) => updateField("city", event.target.value)} /></label>
            <label>Product<input value={form.product} onChange={(event) => updateField("product", event.target.value)} placeholder="Product or service supplied" /></label>
            <label>Zip Code<input value={form.zip_code} onChange={(event) => updateField("zip_code", event.target.value)} /></label>
          </div>
          <div className="vendor-form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button">{editingId ? "Save Changes" : "Save"}</button></div>
        </form>
      )}

      <div className="vendor-summary panel">
        <h2>Vendors Summary</h2>
        <div className="vendor-summary-value"><strong>{summary?.total_vendors ?? 0}</strong><span>Total Vendors</span></div>
      </div>

      <div className="panel vendor-toolbar">
        <select aria-label="Rows per page"><option>25</option><option>50</option><option>100</option></select>
        <button className="toolbar-icon-button" onClick={exportVendors} disabled={!vendors.length}><Icon name="download" /> EXPORT</button>
        <button className="toolbar-icon-button" onClick={loadVendors}><Icon name="refresh" /></button>
        <label className="vendor-search">Search<input placeholder="Search company, phone, email..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      </div>

      <div className="panel table-wrap">
        <table className="vendors-table">
          <thead><tr><th><input type="checkbox" aria-label="Select all vendors" /></th><th>#</th><th>Company</th><th>Product</th><th>Phone</th><th>Created By</th><th>Created At</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="8" className="empty-state">Loading vendors...</td></tr> : vendors.length ? vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td><input type="checkbox" aria-label={`Select ${vendor.company}`} /></td>
                <td>{vendor.id}</td>
                <td><strong>{vendor.company}</strong></td>
                <td>{vendor.product || "—"}</td>
                <td>{vendor.phone || "—"}</td>
                <td>Admin / Admin</td>
                <td>{vendor.created_at ? new Date(vendor.created_at).toLocaleString("en-IN") : "—"}</td>
                <td><div className="row-actions"><button className="compact-button secondary-button" onClick={() => openEdit(vendor)}>Edit</button><button className="compact-button secondary-button" onClick={() => toggleStatus(vendor)}>{vendor.is_active ? "Active" : "Inactive"}</button><button className="compact-button danger-button" onClick={() => deleteVendor(vendor)}>Delete</button></div></td>
              </tr>
            )) : <tr><td colSpan="8" className="empty-state">No vendors found.</td></tr>}
          </tbody>
        </table>
        <p className="vendor-entry-count">Showing {vendors.length ? 1 : 0} to {vendors.length} of {vendors.length} entries</p>
      </div>
    </section>
  );
}
