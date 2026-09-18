import { useEffect, useState } from "react";
import api from "../api";

const today = new Date().toISOString().slice(0, 10);
const unwrap = (response) => response.data.results || response.data;

export default function AdvancePaymentsPage() {
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", amount: "", payment_date: today, payment_method: "", reference: "", note: "" });
  const [error, setError] = useState("");
  function load() {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    Promise.all([api.get(`/advance-payments/${query}`), api.get("/customers/")]).then(([payments, customerResponse]) => { setRecords(unwrap(payments)); setCustomers(unwrap(customerResponse)); }).catch(() => setError("Unable to load advance payments."));
  }
  useEffect(load, [search]);
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function save(event) {
    event.preventDefault();
    try { await api.post("/advance-payments/", form); setOpen(false); setForm({ customer: "", amount: "", payment_date: today, payment_method: "", reference: "", note: "" }); load(); } catch { setError("The advance payment could not be saved."); }
  }
  async function remove(id) {
    if (!window.confirm("Delete this advance payment?")) return;
    try { await api.delete(`/advance-payments/${id}/`); load(); } catch { setError("The advance payment could not be deleted."); }
  }
  return <section className="advance-payments-page"><div className="page-heading"><div><p className="eyebrow">Finance</p><h1>Advance Payments</h1></div><button className="primary-button" onClick={() => setOpen(true)}>NEW PAYMENT</button></div>{error && <p className="error-message">{error}</p>}<div className="panel advance-payments-list"><div className="referral-toolbar"><div className="staff-list-controls"><select><option>25</option><option>50</option><option>100</option></select><button className="toolbar-icon-button">EXPORT</button><button className="toolbar-icon-button" onClick={load}>↻</button></div><label className="staff-search">⌕ <input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><table className="advance-payments-table"><thead><tr><th>Payment #</th><th>Payment Mode</th><th>Transaction ID</th><th>Customer</th><th>Amount</th><th>Date</th><th></th></tr></thead><tbody>{records.length ? records.map((record) => <tr key={record.id}><td>{record.id}<div className="advance-row-actions"><button onClick={() => remove(record.id)}>Delete</button></div></td><td>{record.payment_method || "—"}</td><td>{record.reference || "—"}</td><td>{record.customer_name}</td><td>₹{Number(record.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td><td>{record.payment_date}</td><td /></tr>) : <tr><td colSpan="7" className="advance-empty">No entries found<div className="empty-upload-icon">↥</div></td></tr>}</tbody></table></div>{open && <div className="modal-backdrop"><div className="advance-payment-modal"><header><h2>Add Payment</h2><button onClick={() => setOpen(false)}>×</button></header><form onSubmit={save}><label className="required">Customer<select required value={form.customer} onChange={(event) => update("customer", event.target.value)}><option value="">Nothing selected</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label className="required">Amount Received<input required type="number" min="0" step="0.01" value={form.amount} onChange={(event) => update("amount", event.target.value)} /></label><label className="required">Payment Date<input required type="date" value={form.payment_date} onChange={(event) => update("payment_date", event.target.value)} /></label><label className="required">Payment Mode<select required value={form.payment_method} onChange={(event) => update("payment_method", event.target.value)}><option value="">Nothing selected</option><option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option><option value="upi">UPI</option><option value="card">Card</option></select></label><label>Transaction ID<input value={form.reference} onChange={(event) => update("reference", event.target.value)} /></label><label>Leave a note<textarea placeholder="Admin Note" rows="4" value={form.note} onChange={(event) => update("note", event.target.value)} /></label><footer><button type="button" className="secondary-button" onClick={() => setOpen(false)}>CLOSE</button><button className="primary-button">SAVE</button></footer></form></div></div>}</section>;
}
