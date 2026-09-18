import { useEffect, useState } from "react";
import api from "../api";

const STAGES = [["supply", "Supply"], ["installation", "Installation"], ["service", "Service"], ["completed", "Completed"]];
const STATUSES = [["not_started", "Not Started"], ["in_progress", "In Progress"], ["on_hold", "On Hold"], ["cancelled", "Cancelled"], ["closed", "Closed"]];
const TABS = ["Job Activities", "Milestones", "Files", "Discussions", "Gantt", "Complaints", "Notes", "Activity"];
const EMPTY = { number: "", name: "", customer: "", stage: "supply", tags: "", start_date: new Date().toISOString().slice(0, 10), estimated_delivery_date: "", billing_type: "fixed_rate", total_rate: "0", status: "in_progress", assigned_to: "", progress: 0, description: "", visible_tabs: TABS, customer_can_view_job_activities: true, customer_can_create_job_activities: true, customer_can_edit_job_activities: true };
const data = (response) => response.data.results || response.data;
const label = (options, value) => options.find(([key]) => key === value)?.[1] || value || "—";

export default function ProjectsPage() {
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [stageFilter, setStageFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (stageFilter) params.set("stage", stageFilter);
    if (search) params.set("search", search);
    Promise.all([api.get(`/projects/${params.toString() ? `?${params}` : ""}`), api.get("/customers/"), api.get("/staff/?is_active=true")])
      .then(([projects, customerResponse, staffResponse]) => { setRecords(data(projects)); setCustomers(data(customerResponse)); setStaff(data(staffResponse)); setError(""); })
      .catch(() => setError("Unable to load projects."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [stageFilter, search]);
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  function openCreate() { setEditingId(null); setForm({ ...EMPTY, number: `ORD-${String(records.length + 1).padStart(6, "0")}` }); setShowForm(true); }
  function openEdit(record) { setEditingId(record.id); setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, record[key] ?? EMPTY[key]]))); setShowForm(true); }
  async function save(event) {
    event.preventDefault();
    try { if (editingId) await api.patch(`/projects/${editingId}/`, form); else await api.post("/projects/", form); setShowForm(false); load(); }
    catch { setError("The project could not be saved. Check the required fields."); }
  }
  async function remove(record) {
    if (!window.confirm(`Delete project "${record.name}"?`)) return;
    try { await api.delete(`/projects/${record.id}/`); load(); } catch { setError("The project could not be deleted."); }
  }
  const count = (status) => records.filter((record) => record.status === status).length;
  return (
    <section className="projects-page">
      <div className="page-heading"><div><p className="eyebrow">Operations</p><h1>Projects</h1></div><div className="heading-actions"><button className="staff-new-button" onClick={openCreate}>New Project</button><button className="toolbar-icon-button">☷</button><button className="toolbar-icon-button">▥</button></div></div>
      {error && <p className="error-message">{error}</p>}
      <div className="panel project-filter"><label>Filter by<select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="">Stage</option>{STAGES.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label></div>
      <div className="project-summary"><h2>Projects Summary</h2>{STATUSES.map(([value, text]) => <article key={value}><strong>{count(value)}</strong><span className={`project-status-${value}`}>{text}</span></article>)}</div>
      {showForm && <div className="project-editor">
        <form className="panel project-form" onSubmit={save}>
          <h2>{editingId ? "Edit project" : "Add new project"}</h2>
          <div className="project-form-grid">
            <label className="full-width required">Project Number<input required value={form.number} onChange={(event) => setField("number", event.target.value)} /></label>
            <label>Project Name<input required value={form.name} onChange={(event) => setField("name", event.target.value)} /></label>
            <label className="full-width required">Customer<select required value={form.customer} onChange={(event) => setField("customer", event.target.value)}><option value="">Select and begin typing</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label>
            <label>Stage<select value={form.stage} onChange={(event) => setField("stage", event.target.value)}>{STAGES.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>
            <label>Billing Type<select value={form.billing_type} onChange={(event) => setField("billing_type", event.target.value)}><option value="fixed_rate">Fixed Rate</option><option value="hourly">Hourly</option></select></label>
            <label>Status<select value={form.status} onChange={(event) => setField("status", event.target.value)}>{STATUSES.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>
            <label>Total Rate<input type="number" min="0" step="0.01" value={form.total_rate} onChange={(event) => setField("total_rate", event.target.value)} /></label>
            <label>Assigned To<select value={form.assigned_to || ""} onChange={(event) => setField("assigned_to", event.target.value)}><option value="">Unassigned</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
            <label>Start Date<input required type="date" value={form.start_date} onChange={(event) => setField("start_date", event.target.value)} /></label>
            <label>Estimated Delivery Date<input type="date" value={form.estimated_delivery_date || ""} onChange={(event) => setField("estimated_delivery_date", event.target.value)} /></label>
            <label>Tags<input value={form.tags} onChange={(event) => setField("tags", event.target.value)} /></label>
            <label>Progress {form.progress}%<input type="range" min="0" max="100" value={form.progress} onChange={(event) => setField("progress", Number(event.target.value))} /></label>
            <label className="full-width">Description<textarea rows="5" value={form.description} onChange={(event) => setField("description", event.target.value)} /></label>
          </div>
          <div className="project-form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button">Save</button></div>
        </form>
        <aside className="panel project-settings"><h2>Project settings</h2><label>Visible Tabs<select multiple value={form.visible_tabs || []} onChange={(event) => setField("visible_tabs", [...event.target.selectedOptions].map((option) => option.value))}>{TABS.map((tab) => <option key={tab}>{tab}</option>)}</select></label>{[["customer_can_view_job_activities", "Allow customer to view job activities"], ["customer_can_create_job_activities", "Allow customer to create job activities"], ["customer_can_edit_job_activities", "Allow customer to edit job activities"]].map(([key, text]) => <label className="project-check" key={key}><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => setField(key, event.target.checked)} />{text}</label>)}</aside>
      </div>}
      <div className="panel referral-toolbar project-toolbar"><div className="staff-list-controls"><select><option>25</option><option>50</option><option>100</option></select><button className="toolbar-icon-button">Export</button><button className="toolbar-icon-button" onClick={load}>↻</button></div><label className="staff-search">Search<input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <div className="panel table-wrap"><table className="project-table"><thead><tr><th>#</th><th>Project Name</th><th>Customer</th><th>Stage</th><th>Tags</th><th>Start Date</th><th>Estimated Delivery Date</th><th>Assigned To</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="10" className="empty-state">Loading projects...</td></tr> : records.length === 0 ? <tr><td colSpan="10" className="empty-state">No projects found.</td></tr> : records.map((record) => <tr key={record.id}><td>{record.number}</td><td><strong>{record.name}</strong></td><td>{record.customer_name}</td><td><select value={record.stage} onChange={async (event) => { await api.patch(`/projects/${record.id}/`, { stage: event.target.value }); load(); }}>{STAGES.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></td><td>{record.tags || "—"}</td><td>{record.start_date}</td><td>{record.estimated_delivery_date || "—"}</td><td>{record.assigned_to_name || "—"}</td><td><span className="project-status-badge">{label(STATUSES, record.status)}</span></td><td><div className="activity-actions"><button onClick={() => openEdit(record)}>Edit</button><button onClick={() => remove(record)}>Delete</button></div></td></tr>)}</tbody></table></div>
      <div className="table-footer">Showing 1 to {records.length} of {records.length} entries <span>Previous&nbsp;&nbsp; <strong>1</strong> &nbsp;&nbsp;Next</span></div>
    </section>
  );
}
