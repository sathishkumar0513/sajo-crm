import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";

const today = new Date().toISOString().slice(0, 10);
const blankItem = () => ({ item: "", description: "", quantity: 1, unit: "Unit", rate: 0, tax: 0 });
const blank = { number: `QUO-${Date.now().toString().slice(-6)}`, title: "", customer: "", enquiry: "", assigned_to: "", quotation_date: today, open_till: today, currency: "INR", discount: 0, adjustment: 0, shipping_charge: 0, client_note: "", terms: "", status: "draft", items: [blankItem()] };
const items = (response) => response.data.results || response.data;

function QuotationEditor({ customers, enquiries, staff, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const updateItem = (index, name, value) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: value } : item) }));
  const subtotal = useMemo(() => form.items.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.rate || 0), 0), [form.items]);
  const taxTotal = useMemo(() => form.items.reduce((total, item) => total + (Number(item.quantity || 0) * Number(item.rate || 0) * Number(item.tax || 0) / 100), 0), [form.items]);
  const total = subtotal + taxTotal - Number(form.discount || 0) + Number(form.adjustment || 0) + Number(form.shipping_charge || 0);
  async function save(event) {
    event.preventDefault();
    try {
      await api.post("/quotations/", { ...form, amount: total });
      onSaved();
    } catch {
      setError("The quotation could not be saved.");
    }
  }
  return <main className="quotation-editor-page"><form onSubmit={save}>
    {error && <p className="error-message">{error}</p>}
    <section className="panel quotation-header-form"><div><label>Subject<input required value={form.title} onChange={(event) => update("title", event.target.value)} /></label><label>Customer<select required value={form.customer} onChange={(event) => update("customer", event.target.value)}><option value="">Nothing selected</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label>Enquiry<select value={form.enquiry} onChange={(event) => update("enquiry", event.target.value)}><option value="">Nothing selected</option>{enquiries.map((enquiry) => <option key={enquiry.id} value={enquiry.id}>{enquiry.title}</option>)}</select></label><div className="quotation-two-column"><label>Quotation Date<input type="date" value={form.quotation_date || ""} onChange={(event) => update("quotation_date", event.target.value)} /></label><label>Open Till<input type="date" value={form.open_till || ""} onChange={(event) => update("open_till", event.target.value)} /></label></div><div className="quotation-two-column"><label>Currency<select value={form.currency} onChange={(event) => update("currency", event.target.value)}><option>INR</option><option>USD</option><option>EUR</option></select></label><label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label></div></div><div><label>Quotation #<input required value={form.number} onChange={(event) => update("number", event.target.value)} /></label><label>Assigned to<select value={form.assigned_to} onChange={(event) => update("assigned_to", event.target.value)}><option value="">Nothing selected</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label>Billing address<textarea rows="3" placeholder="Customer billing address" /></label><label>Shipping address<textarea rows="3" placeholder="Customer shipping address" /></label></div></section>
    <section className="panel quotation-items-panel"><div className="quotation-items-toolbar"><select><option>Add item</option></select><button type="button" className="secondary-button" onClick={() => setForm((current) => ({ ...current, items: [...current.items, blankItem()] }))}>+ Add Item</button></div><table className="quotation-items-table"><thead><tr><th>Item</th><th>Description</th><th>Qty</th><th>Rate</th><th>Tax %</th><th>Amount</th><th></th></tr></thead><tbody>{form.items.map((item, index) => <tr key={index}><td><input required value={item.item} placeholder="Description" onChange={(event) => updateItem(index, "item", event.target.value)} /></td><td><textarea value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} /></td><td><input type="number" min="0" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} /></td><td><input type="number" min="0" value={item.rate} onChange={(event) => updateItem(index, "rate", event.target.value)} /></td><td><input type="number" min="0" value={item.tax} onChange={(event) => updateItem(index, "tax", event.target.value)} /></td><td>{(Number(item.quantity || 0) * Number(item.rate || 0)).toFixed(2)}</td><td><button type="button" className="table-action" onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}>×</button></td></tr>)}</tbody></table><div className="quotation-totals"><label>Discount<input type="number" value={form.discount} onChange={(event) => update("discount", event.target.value)} /></label><label>Shipping Charge<input type="number" value={form.shipping_charge} onChange={(event) => update("shipping_charge", event.target.value)} /></label><label>Adjustment<input type="number" value={form.adjustment} onChange={(event) => update("adjustment", event.target.value)} /></label><p>Subtotal <strong>₹{subtotal.toFixed(2)}</strong></p><p>Total Tax <strong>₹{taxTotal.toFixed(2)}</strong></p><p>Total <strong>₹{total.toFixed(2)}</strong></p></div></section>
    <section className="panel quotation-notes"><label>Client Note<textarea rows="3" value={form.client_note} onChange={(event) => update("client_note", event.target.value)} /></label><label>Terms & Conditions<textarea rows="3" value={form.terms} onChange={(event) => update("terms", event.target.value)} /></label></section>
    <div className="quotation-footer"><button type="button" className="secondary-button" onClick={() => navigate("/finance/quotations")}>Cancel</button><button className="primary-button" onClick={() => update("status", "draft")}>Save Draft</button><button className="primary-button">Save & Send</button></div>
  </form></main>;
}

export default function QuotationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  function load() {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    Promise.all([api.get(`/quotations/${query}`), api.get("/customers/"), api.get("/enquiries/"), api.get("/staff/")]).then(([quotes, customerResponse, enquiryResponse, staffResponse]) => { setRecords(items(quotes)); setCustomers(items(customerResponse)); setEnquiries(items(enquiryResponse)); setStaff(items(staffResponse)); }).catch(() => setError("Unable to load quotations."));
  }
  useEffect(load, [search]);
  if (location.pathname.endsWith("/add")) return <QuotationEditor customers={customers} enquiries={enquiries} staff={staff} onSaved={() => navigate("/finance/quotations")} />;
  async function remove(record) { if (!window.confirm(`Delete quotation "${record.number}"?`)) return; try { await api.delete(`/quotations/${record.id}/`); load(); } catch { setError("The quotation could not be deleted."); } }
  return <section className="quotations-page"><div className="page-heading"><div><p className="eyebrow">Finance</p><h1>Quotations</h1></div><div className="quotation-heading-actions"><button className="secondary-button">Switch to Pipeline</button><button className="staff-new-button" onClick={() => navigate("/finance/quotations/add")}>New Quotation</button></div></div>{error && <p className="error-message">{error}</p>}<div className="panel quotation-list-panel"><div className="referral-toolbar"><div className="staff-list-controls"><select><option>25</option><option>50</option><option>100</option></select><button className="toolbar-icon-button">EXPORT</button><button className="toolbar-icon-button" onClick={load}>↻</button></div><label className="staff-search">Search<input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><table className="quotation-table"><thead><tr><th>Quotation #</th><th>Subject</th><th>To</th><th>Total</th><th>Date</th><th>Open Till</th><th>Date Created</th><th>Status</th><th></th></tr></thead><tbody>{records.length ? records.map((record) => <tr key={record.id}><td>{record.number}</td><td>{record.title}</td><td>{record.customer_name || "—"}</td><td>₹{Number(record.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td><td>{record.quotation_date || "—"}</td><td>{record.open_till || "—"}</td><td>{new Date(record.created_at).toLocaleDateString()}</td><td><span className={`quotation-status quotation-${record.status}`}>{record.status}</span></td><td><button className="table-action" onClick={() => remove(record)}>Delete</button></td></tr>) : <tr><td colSpan="9" className="quotation-empty">No entries found</td></tr>}</tbody></table></div></section>;
}
