import { useEffect, useState } from "react";
import api from "../api";

const STATUSES = [
  ["new", "New Enquiry"],
  ["contacted", "Contacted"],
  ["visit_scheduled", "Visit Scheduled"],
  ["postpone", "Postpone"],
  ["drop", "Drop"],
  ["visited", "Visited"],
  ["quoted", "Quoted"],
  ["follow_up", "Follow Up"],
  ["won", "Won"],
  ["lost", "Lost"],
];

const EMPTY_FORM = {
  title: "",
  enquiry_type: "",
  customer: "",
  lead: "",
  email: "",
  phone: "",
  contacted_person: "",
  site_location: "",
  assigned_to: "",
  date_of_visit: "",
  conversion_percentage: "",
  referred_by: "",
  quote_value: "",
  status: "new",
  description: "",
};

function displayStatus(value) {
  return STATUSES.find(([status]) => status === value)?.[1] || value || "—";
}

export default function EnquiryPage() {
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function loadData() {
    setLoading(true);
    const enquiryParams = new URLSearchParams();
    if (search) enquiryParams.set("search", search);
    if (statusFilter) enquiryParams.set("status", statusFilter);
    const enquiryQuery = enquiryParams.toString() ? `?${enquiryParams}` : "";

    Promise.all([
      api.get(`/enquiries/${enquiryQuery}`),
      api.get("/customers/"),
      api.get("/leads/"),
      api.get("/staff/"),
    ])
      .then(([enquiriesResponse, customersResponse, leadsResponse, staffResponse]) => {
        setRecords(enquiriesResponse.data.results || enquiriesResponse.data);
        setCustomers(customersResponse.data.results || customersResponse.data);
        setLeads(leadsResponse.data.results || leadsResponse.data);
        setStaff(staffResponse.data.results || staffResponse.data);
        setError("");
      })
      .catch(() => setError("Unable to load enquiries. Please verify the API connection."))
      .finally(() => setLoading(false));
  }

  useEffect(loadData, [search, statusFilter]);

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

  async function saveEnquiry(event) {
    event.preventDefault();
    const payload = { ...form };
    ["customer", "lead", "assigned_to", "date_of_visit", "conversion_percentage", "quote_value"].forEach((key) => {
      if (!payload[key]) payload[key] = null;
    });
    try {
      if (editingId) await api.patch(`/enquiries/${editingId}/`, payload);
      else await api.post("/enquiries/", payload);
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      loadData();
    } catch {
      setError("The enquiry could not be saved. Check the required fields.");
    }
  }

  async function deleteEnquiry(record) {
    if (!window.confirm(`Delete enquiry "${record.title}"?`)) return;
    try {
      await api.delete(`/enquiries/${record.id}/`);
      loadData();
    } catch {
      setError("The enquiry could not be deleted.");
    }
  }

  async function changeStatus(record, status) {
    try {
      await api.patch(`/enquiries/${record.id}/`, { status });
      loadData();
    } catch {
      setError("The enquiry status could not be updated.");
    }
  }

  return (
    <section className="enquiry-page">
      <div className="page-heading">
        <div><p className="eyebrow">CRM</p><h1>Enquiries</h1></div>
        <button className="primary-button" onClick={openCreate}>New Enquiry</button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="panel enquiry-form" onSubmit={saveEnquiry}>
          <div className="enquiry-form-grid">
            <label className="required">Subject<input required value={form.title} onChange={(event) => updateField("title", event.target.value)} /></label>
            <label className="required">Enquiry Type<select required value={form.enquiry_type} onChange={(event) => updateField("enquiry_type", event.target.value)}><option value="">Nothing selected</option><option>Commercial</option><option>Residential</option><option>AMC</option><option>Installation</option><option>Service</option></select></label>
            <label className="full-width required">Related To<select required value={form.customer ? `customer:${form.customer}` : form.lead ? `lead:${form.lead}` : ""} onChange={(event) => { const [type, id] = event.target.value.split(":"); updateField("customer", type === "customer" ? id : ""); updateField("lead", type === "lead" ? id : ""); }}><option value="">Nothing selected</option><optgroup label="Customers">{customers.map((customer) => <option value={`customer:${customer.id}`} key={`customer-${customer.id}`}>{customer.name}</option>)}</optgroup><optgroup label="Leads">{leads.map((lead) => <option value={`lead:${lead.id}`} key={`lead-${lead.id}`}>{lead.name}</option>)}</optgroup></select></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} /></label>
            <label className="required">Phone<input required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} /></label>
            <label>Contacted Person<input value={form.contacted_person} onChange={(event) => updateField("contacted_person", event.target.value)} /></label>
            <label>Site Location<input value={form.site_location} onChange={(event) => updateField("site_location", event.target.value)} /></label>
            <label className="full-width required">Assignees<select required value={form.assigned_to || ""} onChange={(event) => updateField("assigned_to", event.target.value)}><option value="">Nothing selected</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
            <label className="full-width">Description<textarea rows="4" value={form.description} onChange={(event) => updateField("description", event.target.value)} /></label>
          </div>
          <div className="enquiry-form-actions">
            <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="primary-button">{editingId ? "Save" : "Save"}</button>
          </div>
        </form>
      )}

      <div className="panel enquiry-filters">
        <label>Search<input placeholder="Search subject, phone, email..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option>{STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <button className="secondary-button" onClick={loadData}>Refresh</button>
      </div>

      <div className="panel table-wrap">
        <table className="enquiries-table">
          <thead><tr><th>Subject</th><th>Phone</th><th>Related To</th><th>Enquiry Type</th><th>Date of Visit</th><th>Quote Value</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="9" className="empty-state">Loading enquiries...</td></tr> : records.length === 0 ? <tr><td colSpan="9" className="empty-state">No enquiries found.</td></tr> : records.map((record) => (
              <tr key={record.id}>
                <td><strong>{record.title}</strong></td>
                <td>{record.phone || "—"}</td>
                <td>{customers.find((customer) => customer.id === record.customer)?.name || leads.find((lead) => lead.id === record.lead)?.name || "—"}</td>
                <td>{record.enquiry_type || "—"}</td>
                <td>{record.date_of_visit || "—"}</td>
                <td>{record.quote_value ? `₹${Number(record.quote_value).toFixed(2)}` : "—"}</td>
                <td><select className={`status-badge status-${record.status}`} value={record.status} aria-label={`Status for ${record.title}`} onChange={(event) => changeStatus(record, event.target.value)}>{STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td>
                <td>{record.updated_at ? new Date(record.updated_at).toLocaleDateString("en-IN") : "—"}</td>
                <td><div className="row-actions"><button className="compact-button secondary-button" onClick={() => openEdit(record)}>Edit</button><button className="compact-button danger-button" onClick={() => deleteEnquiry(record)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
