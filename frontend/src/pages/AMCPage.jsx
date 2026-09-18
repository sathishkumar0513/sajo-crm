import { useEffect, useState } from "react";
import api from "../api";
import Icon from "../components/Icon";

const TYPES = ["Regular Service & Quality Check", "Special AMC"];
const EMPTY = { customer: "", project: "", subject: "", amc_type: "", amc_value: "0", start_date: new Date().toISOString().slice(0, 10), end_date: "", description: "", status: "active", signature_status: "not_signed", hide_from_customer: false };
const items = (response) => response.data.results || response.data;

export default function AMCPage() {
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({ by_status: [], by_type: [] });
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    Promise.all([api.get(`/amc-contracts/${query}`), api.get("/amc-contracts/summary/"), api.get("/customers/"), api.get("/projects/")])
      .then(([contracts, summaryResponse, customerResponse, projectResponse]) => { setRecords(items(contracts)); setSummary(summaryResponse.data); setCustomers(items(customerResponse)); setProjects(items(projectResponse)); setError(""); })
      .catch(() => setError("Unable to load AMC contracts."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [search]);
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  function openCreate() { setEditingId(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(record) { setEditingId(record.id); setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, record[key] ?? ""]))); setShowForm(true); }
  async function save(event) {
    event.preventDefault();
    try { if (editingId) await api.patch(`/amc-contracts/${editingId}/`, form); else await api.post("/amc-contracts/", form); setShowForm(false); load(); }
    catch { setError("The AMC contract could not be saved."); }
  }
  async function remove(record) {
    if (!window.confirm(`Delete AMC "${record.subject}"?`)) return;
    try { await api.delete(`/amc-contracts/${record.id}/`); load(); } catch { setError("The AMC contract could not be deleted."); }
  }
  const statusCount = (status) => summary.by_status?.find((item) => item.status === status)?.total || 0;
  const maxCount = Math.max(...(summary.by_type || []).map((item) => Number(item.total || 0)), 1);
  const maxValue = Math.max(...(summary.by_type || []).map((item) => Number(item.value || 0)), 1);
  return (
    <section className="amc-page">
      <div className="page-heading"><div><p className="eyebrow">Contracts</p><h1>AMC</h1></div><button className="staff-new-button" onClick={openCreate}><Icon name="plus" /> New AMC</button></div>
      {error && <p className="error-message">{error}</p>}
      <div className="panel amc-summary"><h2>AMC Summary</h2>{[["active", "Active"], ["expired", "Expired"], ["about_to_expire", "About to Expire"], ["recently_added", "Recently Added"], ["trash", "Trash"]].map(([value, text]) => <article key={value}><strong>{statusCount(value)}</strong><span className={`amc-${value}`}>{text}</span></article>)}</div>
      <div className="amc-charts">
        <article className="panel amc-chart">
          <h2>Amc by Type</h2>
          {(summary.by_type || []).length ? <div className="amc-column-chart" aria-label="AMC count by type">
            {summary.by_type.map((item) => <div className="amc-column" key={item.amc_type || "Unspecified"}>
              <strong>{item.total}</strong>
              <div className="amc-column-track"><i style={{ height: `${(Number(item.total || 0) / maxCount) * 100}%` }} /></div>
              <span>{item.amc_type || "Unspecified"}</span>
            </div>)}
          </div> : <p className="empty-state">No AMC data yet.</p>}
        </article>
        <article className="panel amc-chart">
          <h2>Amc Value by Type (INR)</h2>
          {(summary.by_type || []).length ? <div className="amc-column-chart" aria-label="AMC value by type">
            {summary.by_type.map((item) => <div className="amc-column amc-value-column" key={item.amc_type || "Unspecified"}>
              <strong>₹{Number(item.value || 0).toLocaleString("en-IN")}</strong>
              <div className="amc-column-track"><i style={{ height: `${(Number(item.value || 0) / maxValue) * 100}%` }} /></div>
              <span>{item.amc_type || "Unspecified"}</span>
            </div>)}
          </div> : <p className="empty-state">No AMC values yet.</p>}
        </article>
      </div>
      {showForm && <div className="amc-editor"><form className="panel amc-form" onSubmit={save}><div className="amc-form-top"><label><input type="checkbox" checked={form.status === "trash"} onChange={(event) => setField("status", event.target.checked ? "trash" : "active")} /> Trash</label><label><input type="checkbox" checked={form.hide_from_customer} onChange={(event) => setField("hide_from_customer", event.target.checked)} /> Hide from customer</label></div><label className="required">Customer<select required value={form.customer} onChange={(event) => setField("customer", event.target.value)}><option value="">Select and begin typing</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label><label>Project<select value={form.project} onChange={(event) => setField("project", event.target.value)}><option value="">No project</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label className="required">Subject<input required value={form.subject} onChange={(event) => setField("subject", event.target.value)} /></label><label>AMC Value<input type="number" min="0" step="0.01" value={form.amc_value} onChange={(event) => setField("amc_value", event.target.value)} /></label><label>Amc type<select required value={form.amc_type} onChange={(event) => setField("amc_type", event.target.value)}><option value="">Nothing selected</option>{TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><div className="amc-date-grid"><label className="required">Start Date<input required type="date" value={form.start_date} onChange={(event) => setField("start_date", event.target.value)} /></label><label>End Date<input type="date" value={form.end_date || ""} onChange={(event) => setField("end_date", event.target.value)} /></label></div><label>Description<textarea rows="6" value={form.description} onChange={(event) => setField("description", event.target.value)} /></label><div className="project-form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button"><Icon name="save" /> Save</button></div></form></div>}
      <div className="panel referral-toolbar amc-toolbar"><div className="staff-list-controls"><select><option>25</option><option>50</option><option>100</option></select><button className="toolbar-icon-button"><Icon name="download" /> Export</button><button className="toolbar-icon-button" onClick={load} aria-label="Refresh AMC"><Icon name="refresh" /></button></div><label className="staff-search">Search<input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <div className="panel table-wrap"><table className="amc-table"><thead><tr><th>#</th><th>Subject</th><th>Customer</th><th>Amc Type</th><th>Amc Value</th><th>Start Date</th><th>End Date</th><th>Project</th><th>Signature</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="10" className="empty-state">Loading AMC contracts...</td></tr> : records.length === 0 ? <tr><td colSpan="10" className="empty-state">No AMC contracts found.</td></tr> : records.map((record) => <tr key={record.id}><td>{record.id}</td><td><strong>{record.subject}</strong></td><td>{record.customer_name}</td><td>{record.amc_type || "—"}</td><td>₹{Number(record.amc_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td><td>{record.start_date}</td><td>{record.end_date || "—"}</td><td>{record.project_name || "—"}</td><td>{record.signature_status === "signed" ? "Signed" : "Not Signed"}</td><td><div className="activity-actions"><button onClick={() => openEdit(record)}>Edit</button><button onClick={() => remove(record)}>Delete</button></div></td></tr>)}</tbody></table></div>
      <div className="table-footer">Showing 1 to {records.length} of {records.length} entries <span>Previous&nbsp;&nbsp; <strong>1</strong> &nbsp;&nbsp;Next</span></div>
    </section>
  );
}
