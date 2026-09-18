import { useEffect, useMemo, useState } from "react";
import api from "../api";

const EMPTY_ITEM = { product: "", hsn_code: "", brand: "", quantity: 1, unit: "Unit", rate: 0, tax: 0 };
const EMPTY_FORM = {
  number: "",
  vendor: "",
  reference: "",
  currency: "INR",
  status: "draft",
  purchase_order_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  assigned_to: "",
  loading_charges: 0,
  freight_charges: 0,
  payment_terms: "",
  delivery_terms: "",
  project_notes: "",
  items: [{ ...EMPTY_ITEM }],
};

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function PurchaseOrderPage() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const [ordersResponse, vendorsResponse, staffResponse] = await Promise.all([
        api.get(`/purchase-orders/${query}`),
        api.get("/vendors/"),
        api.get("/staff/?is_active=true"),
      ]);
      setOrders(ordersResponse.data.results || ordersResponse.data);
      setVendors(vendorsResponse.data.results || vendorsResponse.data);
      setStaff(staffResponse.data.results || staffResponse.data);
      setError("");
    } catch {
      setError("Unable to load purchase orders. Please verify the API connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [search]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateItem(index, name, value) {
    setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: value } : item) }));
  }

  function openCreate() {
    setEditingId(null);
    setConfirmedItems([]);
    setForm({ ...EMPTY_FORM, number: `PO-${String(Date.now()).slice(-6)}`, items: [{ ...EMPTY_ITEM }] });
    setShowForm(true);
  }

  function openEdit(order) {
    setEditingId(order.id);
    setConfirmedItems([]);
    setForm({ ...order, vendor: order.vendor || "", assigned_to: order.assigned_to || "", due_date: order.due_date || "", items: order.items?.length ? order.items : [{ ...EMPTY_ITEM }] });
    setShowForm(true);
  }

  function addItem() {
    setForm((current) => ({ ...current, items: [...current.items, { ...EMPTY_ITEM }] }));
  }

  function removeItem(index) {
    setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0);
    const tax = form.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0) * Number(item.tax || 0)) / 100, 0);
    return { subtotal, tax, total: subtotal + tax + Number(form.loading_charges || 0) + Number(form.freight_charges || 0) };
  }, [form.items, form.loading_charges, form.freight_charges]);

  async function saveOrder(event, saveAndSend = false) {
    event.preventDefault();
    const payload = { ...form, vendor: form.vendor || null, assigned_to: form.assigned_to || null, due_date: form.due_date || null, items: form.items.filter((item) => item.product.trim()) };
    if (saveAndSend) payload.status = "sent";
    try {
      if (editingId) await api.patch(`/purchase-orders/${editingId}/`, payload);
      else await api.post("/purchase-orders/", payload);
      setShowForm(false);
      await loadData();
    } catch {
      setError("The purchase order could not be saved. Add a vendor, number, and at least one product.");
    }
  }

  async function deleteOrder(order) {
    if (!window.confirm(`Delete purchase order "${order.number}"?`)) return;
    try { await api.delete(`/purchase-orders/${order.id}/`); loadData(); } catch { setError("The purchase order could not be deleted."); }
  }

  return (
    <section className="purchase-order-page">
      <div className="page-heading">
        <div><p className="eyebrow">Purchase</p><h1>Purchase Orders</h1></div>
        <button className="staff-new-button" onClick={openCreate}>Create Purchase Order</button>
      </div>
      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="panel purchase-order-form" onSubmit={(event) => saveOrder(event, false)}>
          <div className="purchase-order-form-heading"><div><p className="eyebrow">Purchase</p><h2>{editingId ? "Edit Purchase Order" : "Create Purchase Order"}</h2></div><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Close</button></div>
          <div className="purchase-order-header-grid">
            <label className="required">Vendor<select required value={form.vendor} onChange={(event) => updateField("vendor", event.target.value)}><option value="">Select and begin typing</option>{vendors.map((vendor) => <option value={vendor.id} key={vendor.id}>{vendor.company}</option>)}</select></label>
            <label>GST Number<input value={vendors.find((vendor) => String(vendor.id) === String(form.vendor))?.gst_number || ""} readOnly placeholder="N/A" /></label>
            <label>Invoice To<textarea rows="2" value={vendors.find((vendor) => String(vendor.id) === String(form.vendor))?.address || ""} readOnly /></label>
            <label>Currency<select value={form.currency} onChange={(event) => updateField("currency", event.target.value)}><option>INR</option><option>USD</option><option>EUR</option></select></label>
            <label>Vendor Number<input value={form.number} onChange={(event) => updateField("number", event.target.value)} required /></label>
            <label>Status<select value={form.status} onChange={(event) => updateField("status", event.target.value)}><option value="draft">Draft</option><option value="sent">Sent</option><option value="approved">Approved</option><option value="received">Received</option><option value="cancelled">Cancelled</option></select></label>
            <label>Reference #<input value={form.reference} onChange={(event) => updateField("reference", event.target.value)} /></label>
            <label>Sales Agent<select value={form.assigned_to || ""} onChange={(event) => updateField("assigned_to", event.target.value)}><option value="">Nothing selected</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
            <label>Purchase Order Date<input type="date" required value={form.purchase_order_date} onChange={(event) => updateField("purchase_order_date", event.target.value)} /></label>
            <label>Due Date<input type="date" value={form.due_date || ""} onChange={(event) => updateField("due_date", event.target.value)} /></label>
          </div>

          <div className="purchase-items-section">
            <div className="purchase-items-toolbar"><button type="button" className="secondary-button" onClick={addItem}>Add Item</button></div>
            <div className="table-wrap"><table className="purchase-items-table"><thead><tr><th>Product</th><th>HSN Code</th><th>Brand</th><th>Qty / Unit</th><th>Rate</th><th>Tax %</th><th>Amount</th><th>Action</th></tr></thead><tbody>{form.items.map((item, index) => <tr key={index}><td><input required value={item.product} placeholder="Product Name" onChange={(event) => updateItem(index, "product", event.target.value)} /></td><td><input value={item.hsn_code} onChange={(event) => updateItem(index, "hsn_code", event.target.value)} /></td><td><input value={item.brand} onChange={(event) => updateItem(index, "brand", event.target.value)} /></td><td><div className="quantity-cell"><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} /><input value={item.unit} onChange={(event) => updateItem(index, "unit", event.target.value)} /></div></td><td><input type="number" min="0" step="0.01" value={item.rate} onChange={(event) => updateItem(index, "rate", event.target.value)} /></td><td><input type="number" min="0" step="0.01" value={item.tax} onChange={(event) => updateItem(index, "tax", event.target.value)} /></td><td>{money(Number(item.quantity || 0) * Number(item.rate || 0))}</td><td><div className="purchase-item-actions"><button type="button" className={`purchase-item-confirm ${confirmedItems.includes(index) ? "is-confirmed" : ""}`} aria-label={`Confirm item ${index + 1}`} title="Confirm item" onClick={() => setConfirmedItems((current) => current.includes(index) ? current : [...current, index])}>✓</button><button type="button" className="purchase-item-remove" aria-label={`Remove item ${index + 1}`} title="Remove item" onClick={() => { if (form.items.length > 1) { removeItem(index); setConfirmedItems([]); } }} disabled={form.items.length === 1}>×</button></div></td></tr>)}</tbody></table></div>
            <div className="purchase-totals"><div>Total Quantity: <strong>{form.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0).toFixed(2)}</strong></div><div>Subtotal: <strong>{money(totals.subtotal)}</strong></div><label>Loading Charges<input type="number" min="0" value={form.loading_charges} onChange={(event) => updateField("loading_charges", event.target.value)} /></label><label>Freight Charges<input type="number" min="0" value={form.freight_charges} onChange={(event) => updateField("freight_charges", event.target.value)} /></label><div>Tax: <strong>{money(totals.tax)}</strong></div><div className="purchase-total">Total: <strong>{money(totals.total)}</strong></div></div>
          </div>
          <div className="purchase-terms-grid"><label>Payment Terms<textarea rows="3" value={form.payment_terms} onChange={(event) => updateField("payment_terms", event.target.value)} /></label><label>Delivery Terms<textarea rows="3" value={form.delivery_terms} onChange={(event) => updateField("delivery_terms", event.target.value)} /></label><label className="full-width">Project Notes<textarea rows="3" value={form.project_notes} onChange={(event) => updateField("project_notes", event.target.value)} /></label></div>
          <div className="purchase-form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button type="button" className="secondary-button" onClick={(event) => saveOrder(event, true)}>Save &amp; Send</button><button className="primary-button">Save</button></div>
        </form>
      )}

      <div className="panel purchase-order-toolbar"><select><option>25</option><option>50</option><option>100</option></select><button className="toolbar-icon-button">EXPORT</button><button className="toolbar-icon-button" onClick={loadData}>↻</button><label className="purchase-search">Search<input placeholder="Search purchase order..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <div className="panel table-wrap"><table className="purchase-orders-table"><thead><tr><th><input type="checkbox" aria-label="Select all purchase orders" /></th><th>Purchase Order #</th><th>Vendor</th><th>Total Quantity</th><th>Date</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="8" className="empty-state">Loading purchase orders...</td></tr> : orders.length ? orders.map((order) => <tr key={order.id}><td><input type="checkbox" /></td><td><strong>{order.number}</strong></td><td>{order.vendor_name || "—"}</td><td>{(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0).toFixed(2)}</td><td>{order.purchase_order_date || "—"}</td><td>{order.due_date || "—"}</td><td><span className={`purchase-status status-${order.status}`}>{order.status}</span></td><td><button className="compact-button secondary-button" onClick={() => openEdit(order)}>Edit</button><button className="compact-button danger-button" onClick={() => deleteOrder(order)}>Delete</button></td></tr>) : <tr><td colSpan="8" className="empty-state">No entries found.</td></tr>}</tbody></table></div>
    </section>
  );
}
