import { useEffect, useMemo, useState } from "react";
import api from "../api";

const ITEM = { product: "", hsn_code: "", brand: "", quantity: 1, unit: "Unit", rate: 0, tax: 0 };
const INITIAL = { number: "", vendor: "", purchase_order: "", reference: "", currency: "INR", payment_method: "ICICI Bank", status: "draft", invoice_date: new Date().toISOString().slice(0, 10), assigned_to: "", loading_charges: 0, freight_charges: 0, payment_terms: "", delivery_terms: "", project_notes: "", items: [{ ...ITEM }] };

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function PurchaseInvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const [invoiceResponse, vendorResponse, orderResponse, staffResponse] = await Promise.all([api.get(`/purchase-invoices/${query}`), api.get("/vendors/"), api.get("/purchase-orders/"), api.get("/staff/?is_active=true")]);
      setInvoices(invoiceResponse.data.results || invoiceResponse.data);
      setVendors(vendorResponse.data.results || vendorResponse.data);
      setOrders(orderResponse.data.results || orderResponse.data);
      setStaff(staffResponse.data.results || staffResponse.data);
    } catch { setError("Unable to load purchase invoices."); }
  }
  useEffect(() => { load(); }, [search]);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0);
    const tax = form.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0) * Number(item.tax || 0)) / 100, 0);
    return { subtotal, tax, total: subtotal + tax + Number(form.loading_charges || 0) + Number(form.freight_charges || 0) };
  }, [form.items, form.loading_charges, form.freight_charges]);

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const setItem = (index, name, value) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: value } : item) }));
  const addItem = () => setForm((current) => ({ ...current, items: [...current.items, { ...ITEM }] }));
  const removeItem = (index) => setForm((current) => ({ ...current, items: current.items.length > 1 ? current.items.filter((_, itemIndex) => itemIndex !== index) : current.items }));

  function create() {
    setEditingId(null);
    setForm({ ...INITIAL, number: `PI-${String(Date.now()).slice(-6)}`, items: [{ ...ITEM }] });
    setShowForm(true);
  }
  function edit(invoice) {
    setEditingId(invoice.id);
    setForm({ ...invoice, vendor: invoice.vendor || "", purchase_order: invoice.purchase_order || "", assigned_to: invoice.assigned_to || "", items: invoice.items?.length ? invoice.items : [{ ...ITEM }] });
    setShowForm(true);
  }
  async function save(event) {
    event.preventDefault();
    const payload = { ...form, vendor: form.vendor || null, purchase_order: form.purchase_order || null, assigned_to: form.assigned_to || null, items: form.items.filter((item) => item.product.trim()) };
    try {
      if (editingId) await api.patch(`/purchase-invoices/${editingId}/`, payload);
      else await api.post("/purchase-invoices/", payload);
      setShowForm(false);
      load();
    } catch { setError("The purchase invoice could not be saved. Select a vendor and add an item."); }
  }
  async function remove(invoice) {
    if (!window.confirm(`Delete invoice "${invoice.number}"?`)) return;
    try { await api.delete(`/purchase-invoices/${invoice.id}/`); load(); } catch { setError("The purchase invoice could not be deleted."); }
  }

  return <section className="purchase-invoice-page">
    <div className="page-heading"><div><p className="eyebrow">Purchase</p><h1>Purchase Invoices</h1></div><button className="staff-new-button" onClick={create}>Create Purchase Invoice</button></div>
    {error && <p className="error-message">{error}</p>}
    {showForm && <form className="panel purchase-order-form" onSubmit={save}>
      <div className="purchase-order-form-heading"><div><p className="eyebrow">Purchase Invoice</p><h2>{editingId ? "Edit Purchase Invoice" : "Create Purchase Invoice"}</h2></div><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Close</button></div>
      <div className="purchase-order-header-grid">
        <label className="required">Vendor<select required value={form.vendor} onChange={(event) => setField("vendor", event.target.value)}><option value="">Select and begin typing</option>{vendors.map((vendor) => <option value={vendor.id} key={vendor.id}>{vendor.company}</option>)}</select></label>
        <label>GST Number<input readOnly value={vendors.find((vendor) => String(vendor.id) === String(form.vendor))?.gst_number || ""} placeholder="N/A" /></label>
        <label>Invoice To<textarea rows="2" readOnly value={vendors.find((vendor) => String(vendor.id) === String(form.vendor))?.address || ""} /></label>
        <label>Allowed payment method<select value={form.payment_method} onChange={(event) => setField("payment_method", event.target.value)}><option>ICICI Bank</option><option>Cash</option><option>Bank Transfer</option><option>UPI</option></select></label>
        <label>Purchase Invoice Number<input required value={form.number} onChange={(event) => setField("number", event.target.value)} /></label>
        <label>Currency<select value={form.currency} onChange={(event) => setField("currency", event.target.value)}><option>INR</option><option>USD</option><option>EUR</option></select></label>
        <label>Invoice Date<input type="date" required value={form.invoice_date} onChange={(event) => setField("invoice_date", event.target.value)} /></label>
        <label>Sales Agent<select value={form.assigned_to} onChange={(event) => setField("assigned_to", event.target.value)}><option value="">Nothing selected</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
        <label>Purchase Order<select value={form.purchase_order} onChange={(event) => setField("purchase_order", event.target.value)}><option value="">Nothing selected</option>{orders.map((order) => <option value={order.id} key={order.id}>{order.number}</option>)}</select></label>
        <label>Reference #<input value={form.reference} onChange={(event) => setField("reference", event.target.value)} /></label>
      </div>
      <div className="purchase-items-section"><div className="purchase-items-toolbar"><button type="button" className="secondary-button" onClick={addItem}>Add Item</button></div><div className="table-wrap"><table className="purchase-items-table"><thead><tr><th>Product</th><th>HSN Code</th><th>Brand</th><th>Qty / Unit</th><th>Rate</th><th>Tax</th><th>Amount</th><th>Action</th></tr></thead><tbody>{form.items.map((item, index) => <tr key={index}><td><input required value={item.product} placeholder="Product Name" onChange={(event) => setItem(index, "product", event.target.value)} /></td><td><input value={item.hsn_code} onChange={(event) => setItem(index, "hsn_code", event.target.value)} /></td><td><input value={item.brand} onChange={(event) => setItem(index, "brand", event.target.value)} /></td><td><div className="quantity-cell"><input type="number" min="0.01" value={item.quantity} onChange={(event) => setItem(index, "quantity", event.target.value)} /><input value={item.unit} onChange={(event) => setItem(index, "unit", event.target.value)} /></div></td><td><input type="number" min="0" value={item.rate} onChange={(event) => setItem(index, "rate", event.target.value)} /></td><td><input type="number" min="0" value={item.tax} onChange={(event) => setItem(index, "tax", event.target.value)} /></td><td>{money(Number(item.quantity || 0) * Number(item.rate || 0))}</td><td><div className="purchase-item-actions"><button type="button" className="purchase-item-confirm">✓</button><button type="button" className="purchase-item-remove" onClick={() => removeItem(index)} disabled={form.items.length === 1}>×</button></div></td></tr>)}</tbody></table></div><div className="purchase-totals"><div>Subtotal: <strong>{money(totals.subtotal)}</strong></div><label>Loading Charges<input type="number" value={form.loading_charges} onChange={(event) => setField("loading_charges", event.target.value)} /></label><label>Freight Charges<input type="number" value={form.freight_charges} onChange={(event) => setField("freight_charges", event.target.value)} /></label><div>Tax: <strong>{money(totals.tax)}</strong></div><div className="purchase-total">Total: <strong>{money(totals.total)}</strong></div></div></div>
      <div className="purchase-terms-grid"><label>Payment Terms<textarea rows="3" value={form.payment_terms} onChange={(event) => setField("payment_terms", event.target.value)} /></label><label>Delivery Terms<textarea rows="3" value={form.delivery_terms} onChange={(event) => setField("delivery_terms", event.target.value)} /></label><label className="full-width">Project Notes<textarea rows="3" value={form.project_notes} onChange={(event) => setField("project_notes", event.target.value)} /></label></div>
      <div className="purchase-form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button">Save</button></div>
    </form>}
    <div className="panel purchase-order-toolbar"><select><option>25</option><option>50</option></select><button className="toolbar-icon-button" onClick={load}>EXPORT</button><button className="toolbar-icon-button" onClick={load}>↻</button><label className="purchase-search">Search<input placeholder="Search purchase invoice..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
    <div className="panel table-wrap"><table className="purchase-orders-table"><thead><tr><th><input type="checkbox" /></th><th>Purchase Invoice #</th><th>Vendor</th><th>Amount</th><th>Amount Due</th><th>Date</th><th>Purchase Order</th><th>Approval</th><th>Status</th><th>Actions</th></tr></thead><tbody>{invoices.length ? invoices.map((invoice) => <tr key={invoice.id}><td><input type="checkbox" /></td><td><strong>{invoice.number}</strong></td><td>{invoice.vendor_name || "—"}</td><td>{money(invoice.total)}</td><td>{money(Number(invoice.total || 0) - Number(invoice.amount_paid || 0))}</td><td>{invoice.invoice_date}</td><td>{invoice.purchase_order_number || "—"}</td><td>Pending</td><td><span className={`purchase-status status-${invoice.status}`}>{invoice.status}</span></td><td><button className="compact-button secondary-button" onClick={() => edit(invoice)}>Edit</button><button className="compact-button danger-button" onClick={() => remove(invoice)}>Delete</button></td></tr>) : <tr><td colSpan="10" className="empty-state">No entries found.</td></tr>}</tbody></table></div>
  </section>;
}
