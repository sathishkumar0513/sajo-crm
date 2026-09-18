import { useEffect, useState } from "react";
import api from "../api";

const ACTIVITY_TYPES = [
  ["installation", "Installation"],
  ["service", "Service"],
  ["maintenance", "Maintenance"],
  ["inspection", "Inspection"],
  ["follow_up", "Follow Up"],
  ["other", "Other"],
];
const STATUSES = [["planned", "Created"], ["in_progress", "Follow Up"], ["completed", "Complete"], ["cancelled", "Declined"]];
const SUMMARY_STATUSES = [["planned", "Created"], ["in_progress", "Follow Up"], ["cancelled", "Declined"], ["postpone", "Postpone"], ["completed", "Complete"], ["cancelled", "Postpone by Client"]];
const PRIORITIES = [["low", "Low"], ["medium", "Medium"], ["high", "High"], ["urgent", "Urgent"]];
const EMPTY_FORM = {
  title: "", activity_type: "other", customer: "", enquiry: "", project: "", assigned_to: "", followers: [],
  start_date: "", due_date: "", status: "planned", priority: "medium", notes: "",
  billable: true, charge: "0", repeat_every: "",
};

const labelFor = (options, value) => options.find(([key]) => key === value)?.[1] || value || "—";
const responseItems = (response) => response.data.results || response.data;

export default function JobActivitiesPage() {
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [staff, setStaff] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function loadData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    const query = params.toString() ? `?${params}` : "";
    Promise.all([
      api.get(`/job-activities/${query}`),
      api.get("/customers/"),
      api.get("/enquiries/"),
      api.get("/staff/?is_active=true"),
      api.get("/projects/"),
    ])
      .then(([activities, customerResponse, enquiryResponse, staffResponse, projectResponse]) => {
        setRecords(responseItems(activities));
        setCustomers(responseItems(customerResponse));
        setEnquiries(responseItems(enquiryResponse));
        setStaff(responseItems(staffResponse));
        setProjects(responseItems(projectResponse));
        setError("");
      })
      .catch(() => setError("Unable to load job activities. Please verify the API connection."))
      .finally(() => setLoading(false));
  }

  useEffect(loadData, [search, statusFilter, priorityFilter]);

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
    setForm(Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, record[key] ?? (key === "followers" ? [] : "")])));
    setShowForm(true);
  }

  async function saveActivity(event) {
    event.preventDefault();
    const payload = { ...form };
    ["customer", "enquiry", "project", "assigned_to", "start_date", "due_date"].forEach((key) => {
      if (!payload[key]) payload[key] = null;
    });
    try {
      if (editingId) await api.patch(`/job-activities/${editingId}/`, payload);
      else await api.post("/job-activities/", payload);
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      loadData();
    } catch {
      setError("The job activity could not be saved. Check the required fields.");
    }
  }

  async function deleteActivity(record) {
    if (!window.confirm(`Delete job activity "${record.title}"?`)) return;
    try {
      await api.delete(`/job-activities/${record.id}/`);
      loadData();
    } catch {
      setError("The job activity could not be deleted.");
    }
  }

  async function updateActivity(record, field, value) {
    try {
      await api.patch(`/job-activities/${record.id}/`, { [field]: value });
      setRecords((current) => current.map((item) => item.id === record.id ? { ...item, [field]: value } : item));
    } catch {
      setError(`The activity ${field.replace("_", " ")} could not be updated.`);
    }
  }

  return (
    <section className="job-activities-page">
      <div className="page-heading">
        <div><p className="eyebrow">Operations</p><h1>Job Activities</h1></div>
        <div className="heading-actions"><button className="staff-new-button" onClick={openCreate}>New Job Activity</button><button className="toolbar-icon-button" onClick={loadData}>Job Activity History</button></div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="job-activity-summary">
        {SUMMARY_STATUSES.map(([value, label], index) => <article className={`job-activity-summary-card status-${value}`} key={`${value}-${index}`}><strong>{value === "postpone" ? 0 : records.filter((record) => record.status === value).length}</strong><span>{label}</span><small>Job Activity assigned to me: 0</small></article>)}
      </div>
      {showForm && (
        <div className="modal-overlay">
          <form className="modal-card modal-large job-activity-modal" onSubmit={saveActivity}>
            <div className="modal-header"><h2>{editingId ? "Edit Job Activity" : "Add New Job Activity"}</h2><button type="button" className="modal-close" onClick={() => setShowForm(false)}>×</button></div>
            <div className="modal-body">
              <div className="job-activity-type-row"><label><input type="radio" checked={form.billable} onChange={() => updateField("billable", true)} /> Billable</label><label><input type="radio" checked={!form.billable} onChange={() => updateField("billable", false)} /> Not Billable</label><label><input type="radio" checked={false} readOnly /> AMC</label><span>Attach Files</span></div>
              <div className="form-grid-2"><label className="full-width">Job Activity Entry<input required value={form.title} onChange={(event) => updateField("title", event.target.value)} /></label><label>Job Activity Date<input type="date" value={form.start_date || ""} onChange={(event) => updateField("start_date", event.target.value)} /></label><label>Job Activity Charge<input type="number" min="0" step="0.01" value={form.charge} onChange={(event) => updateField("charge", event.target.value)} /></label></div>
              <div className="form-grid-2"><label>Assignees<select value={form.assigned_to || ""} onChange={(event) => updateField("assigned_to", event.target.value)}><option value="">Nothing selected</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label><label>Followers<select multiple value={form.followers || []} onChange={(event) => updateField("followers", [...event.target.selectedOptions].map((option) => option.value))}>{staff.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label><label>Priority<select value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>{PRIORITIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Repeat every<select value={form.repeat_every} onChange={(event) => updateField("repeat_every", event.target.value)}><option value="">Nothing selected</option><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label><label>Related To<select value={form.customer || ""} onChange={(event) => updateField("customer", event.target.value)}><option value="">Nothing selected</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label><label>Project<select value={form.project || ""} onChange={(event) => updateField("project", event.target.value)}><option value="">Nothing selected</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.number} - {project.name}</option>)}</select></label><label>Status<select value={form.status} onChange={(event) => updateField("status", event.target.value)}>{STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
              <label>Job Activity Type<select value={form.activity_type} onChange={(event) => updateField("activity_type", event.target.value)}>{ACTIVITY_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label className="modal-description">Job Activity Description<textarea rows="4" placeholder="Add Description" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} /></label>
            </div>
            <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Close</button><button className="primary-button">Save</button></div>
          </form>
        </div>
      )}
      <div className="panel enquiry-filters">
        <label>Search<input placeholder="Search title, customer, notes..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option>{STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Priority<select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="">All priorities</option>{PRIORITIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <button className="secondary-button" onClick={loadData}>Refresh</button>
      </div>
      <div className="panel table-wrap">
        <table className="job-activities-table">
          <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Job Activity Entry</th><th>Job Activity Date</th><th>Status</th><th>Type</th><th>Billable Status</th><th>Assigned To</th><th>Options</th><th>Created At</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="11" className="empty-state">Loading job activities...</td></tr> : records.length === 0 ? <tr><td colSpan="11" className="empty-state">No job activities found.</td></tr> : records.map((record, index) => (
              <tr key={record.id}>
                <td>{record.id || index + 1}</td><td>{record.customer_name || "—"}</td><td>—</td><td><strong>{record.title}</strong>{record.notes && <small className="activity-notes">{record.notes}</small>}</td><td>{record.start_date || "—"}</td>
                <td><select className="inline-control" value={record.status} onChange={(event) => updateActivity(record, "status", event.target.value)}>{STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td>
                <td>{labelFor(ACTIVITY_TYPES, record.activity_type)}</td><td><span className={`billable-badge ${record.billable ? "is-billable" : ""}`}>{record.billable ? "Billable" : "Not Billable"}</span></td><td>{record.assigned_to_name || "—"}</td><td><div className="activity-actions"><button onClick={() => openEdit(record)}>Edit</button><button onClick={() => deleteActivity(record)}>Delete</button></div></td><td>{record.created_at ? new Date(record.created_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
