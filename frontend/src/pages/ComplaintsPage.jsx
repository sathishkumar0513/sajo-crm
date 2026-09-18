import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import Icon from "../components/Icon";

const EMPTY = { subject: "", customer: "", contact: "", assigned_to: "", job_activity: "", department: "", tags: "", cc: "", name: "", email: "", priority: "medium", status: "open", body: "" };
const items = (response) => response.data.results || response.data;
const statusLabels = [["open", "Open"], ["in_progress", "In Progress"], ["answered", "Answered"], ["on_hold", "On Hold"], ["closed", "Closed"]];

function ComplaintForm({ customers, contacts, staff, activities, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  async function save(event) {
    event.preventDefault();
    try {
      await api.post("/complaints/", form);
      onSaved();
    } catch {
      setError("The complaint could not be created.");
    }
  }
  return <main className="complaint-editor-page">
    {error && <p className="error-message">{error}</p>}
    <form onSubmit={save}>
      <section className="panel complaint-top-form">
        <div className="complaint-form-column">
          <button type="button" className="compact-outline-button" onClick={() => update("customer", "")}>Complaint without contact</button>
          <label>Subject<input required value={form.subject} onChange={(event) => update("subject", event.target.value)} /></label>
          <label>Contact<select value={form.contact} onChange={(event) => update("contact", event.target.value)}><option value="">Nothing selected</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.full_name}</option>)}</select></label>
          <div className="complaint-two-column"><label>Name<input value={form.name} onChange={(event) => update("name", event.target.value)} /></label><label>Email address<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></label></div>
          <div className="complaint-two-column"><label>Department<select value={form.department} onChange={(event) => update("department", event.target.value)}><option value="">Nothing selected</option><option>Support</option><option>Sales</option><option>Technical</option></select></label><label>CC<input value={form.cc} onChange={(event) => update("cc", event.target.value)} /></label></div>
        </div>
        <div className="complaint-form-column">
          <label className="complaint-label-with-icon"><Icon name="tag" /> Tags<input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="Tag" /></label>
          <label>Assign complaint (default is current user)<select value={form.assigned_to} onChange={(event) => update("assigned_to", event.target.value)}><option value="">Sajo Technologies</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
          <div className="complaint-two-column"><label>Priority<select value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label>Job Activity<select value={form.job_activity} onChange={(event) => update("job_activity", event.target.value)}><option value="">Nothing selected</option>{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title}</option>)}</select></label></div>
        </div>
      </section>
      <section className="panel complaint-body-form">
        <h2>Complaint Body</h2>
        <div className="complaint-body-tools"><select><option>Insert predefined reply</option></select><select><option>Insert knowledge base link</option></select></div>
        <textarea className="complaint-rich-text" value={form.body} onChange={(event) => update("body", event.target.value)} placeholder="Write the complaint details..." />
      </section>
      <div className="complaint-form-footer"><button type="button" className="secondary-button" onClick={() => navigate("/complaints")}>Cancel</button><button className="primary-button">Open Complaint</button></div>
    </form>
  </main>;
}

export default function ComplaintsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  function load() {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    Promise.all([api.get(`/complaints/${query}`), api.get("/complaints/summary/"), api.get("/customers/"), api.get("/contacts/"), api.get("/staff/"), api.get("/job-activities/")])
      .then(([complaints, summaryResponse, customersResponse, contactsResponse, staffResponse, activitiesResponse]) => {
        setRecords(items(complaints)); setSummary(summaryResponse.data.by_status || []); setCustomers(items(customersResponse)); setContacts(items(contactsResponse)); setStaff(items(staffResponse)); setActivities(items(activitiesResponse)); setError("");
      }).catch(() => setError("Unable to load complaints."));
  }
  useEffect(load, [search]);
  if (location.pathname.endsWith("/add")) return <ComplaintForm customers={customers} contacts={contacts} staff={staff} activities={activities} onSaved={() => navigate("/complaints")} />;
  async function remove(record) {
    if (!window.confirm(`Delete complaint "${record.subject}"?`)) return;
    try { await api.delete(`/complaints/${record.id}/`); load(); } catch { setError("The complaint could not be deleted."); }
  }
  const count = (status) => summary.find((item) => item.status === status)?.total || 0;
  return <section className="complaints-page">
    <div className="page-heading"><div><p className="eyebrow">Support</p><h1>Complaints</h1></div><button className="staff-new-button" onClick={() => navigate("/complaints/add")}>New Complaint</button></div>
    {error && <p className="error-message">{error}</p>}
    <div className="panel complaint-summary"><h2>Complaints Summary</h2>{statusLabels.map(([value, label]) => <article key={value}><strong>{count(value)}</strong><span className={`complaint-${value}`}>{label}</span></article>)}</div>
    <div className="panel complaint-list-panel">
      <div className="referral-toolbar"><div className="staff-list-controls"><select><option>25</option><option>50</option><option>100</option></select><button className="toolbar-icon-button">EXPORT</button><button className="toolbar-icon-button">BULK ACTIONS</button><button className="toolbar-icon-button" onClick={load}>↻</button></div><label className="staff-search">Search<input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <table className="complaint-table"><thead><tr><th></th><th>#</th><th>Subject</th><th>Tags</th><th>Department</th><th>Job Activity</th><th>Contact</th><th>Status</th><th>Priority</th><th>Last Reply</th><th>Created</th><th></th></tr></thead><tbody>{records.length ? records.map((record) => <tr key={record.id}><td><input type="checkbox" /></td><td>{record.id}</td><td><strong>{record.subject}</strong></td><td>{record.tags || "—"}</td><td>{record.department || "—"}</td><td>{record.job_activity_title || "—"}</td><td>{record.contact_name || record.name || "—"}</td><td><span className={`complaint-status complaint-${record.status}`}>{record.status.replaceAll("_", " ")}</span></td><td>{record.priority}</td><td>{record.last_reply_at ? new Date(record.last_reply_at).toLocaleDateString() : "—"}</td><td>{new Date(record.created_at).toLocaleDateString()}</td><td><button className="table-action" onClick={() => remove(record)}>Delete</button></td></tr>) : <tr><td colSpan="12" className="complaint-empty">No entries found</td></tr>}</tbody></table>
    </div>
  </section>;
}
