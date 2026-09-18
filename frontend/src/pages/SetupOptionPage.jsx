import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

const definitions = {
  "customer-groups": ["Customer Groups", "customer-groups", ["name"]],
  "staff-designations": ["Designations", "staff-designations", ["name", "description"]],
  "complaint-departments": ["Complaint Departments", "complaint-departments", ["name", "description"]],
  "predefined-replies": ["Predefined Replies", "predefined-replies", ["name", "description"]],
  "complaint-priorities": ["Complaint Priorities", "complaint-priorities", ["name"]],
  "complaint-services": ["Job Activities", null, ["name"]],
  "spam-filters": ["Spam Filters", null, ["name"]],
  "job-activity-templates": ["Job Activity Templates", "job-activity-templates", ["name", "description"]],
  "job-activity-checklists": ["Job Activity Checklists", "job-activity-checklists", ["name", "description"]],
  "lead-sources": ["Lead Sources", "lead-sources", ["name", "description"]],
  "lead-statuses": ["Lead Statuses", "lead-statuses", ["name", "description"]],
  "lead-hotness-levels": ["Heatness Levels", "lead-hotness-levels", ["name", "description"]],
  campaigns: ["Campaigns", "campaigns", ["name", "description"]],
  "email-integrations": ["Email Integration", "email-integrations", ["name", "description"]],
  "web-to-lead-forms": ["Web to Lead", "web-to-lead-forms", ["name", "description"]],
  "lead-reasons": ["Lead Reasons", "lead-reasons", ["name", "description"]],
  "tax-rates": ["Tax Rates", "tax-rates", ["name", "description"]],
  currencies: ["Currencies", "currencies", ["name", "description"]],
  "payment-modes": ["Payment Modes", "payment-modes", ["name", "description"]],
  products: ["Products", "items", ["name", "description"]],
  units: ["Units", "units", ["name", "description"]],
  "amc-types": ["AMC Types", "amc-types", ["name", "description"]],
  "email-templates": ["Email Templates", "email-templates", ["name", "description"]],
  roles: ["Roles", "roles", ["name"]],
  "main-menu": ["Main Menu", "main-menu", ["name", "description"]],
  "setup-menu": ["Setup Menu", "setup-menu", ["name", "description"]],
  "theme-style": ["Theme Style", "theme-styles", ["name", "description"]],
  settings: ["Settings", "settings", ["key", "value", "description"]],
};

export default function SetupOptionPage() {
  const { option } = useParams();
  const [title, endpoint, fields] = definitions[option] || ["Setup Option", null, ["name"]];
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const load = () => endpoint && api.get(`/${endpoint}/`).then(({ data }) => setRows(data.results || data)).catch(() => setError(`Unable to load ${title.toLowerCase()}.`));
  useEffect(() => { load(); }, [endpoint]);
  async function submit(event) {
    event.preventDefault();
    try {
      if (editing) await api.patch(`/${endpoint}/${editing}/`, form);
      else await api.post(`/${endpoint}/`, form);
      setForm({}); setEditing(null); load();
    } catch { setError(`Unable to save ${title.toLowerCase()}.`); }
  }
  async function remove(id) {
    if (!window.confirm(`Delete this ${title.toLowerCase().replace(/s$/, "")}?`)) return;
    try { await api.delete(`/${endpoint}/${id}/`); load(); } catch { setError("This entry may be in use and cannot be deleted."); }
  }
  if (!endpoint) return <section className="panel"><h1>{title}</h1><p>Setup endpoint is not available.</p></section>;
  return <section className="setup-detail-page"><div className="setup-detail-header"><div><p className="eyebrow">Setup</p><h1>{title}</h1></div></div><div className="panel setup-detail-panel"><form className="setup-create-form setup-config-form" onSubmit={submit}>{fields.map((field) => <input key={field} required={field !== "description"} value={form[field] || ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field.replace(/_/g, " ")} />)}<button className="primary-button" type="submit">{editing ? "Update" : "Add"}</button>{editing && <button type="button" className="secondary-button" onClick={() => { setEditing(null); setForm({}); }}>Cancel</button>}</form>{error && <p className="error-message">{error}</p>}<table className="setup-table"><thead><tr>{fields.map((field) => <th key={field}>{field}</th>)}<th>Options</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id}>{fields.map((field) => <td key={field}>{row[field] || "—"}</td>)}<td><button className="table-action" onClick={() => { setEditing(row.id); setForm(Object.fromEntries(fields.map((field) => [field, row[field] || ""]))); }}>Edit</button><button className="table-action danger" onClick={() => remove(row.id)}>Delete</button></td></tr>) : <tr><td colSpan={fields.length + 1} className="report-empty">No entries found</td></tr>}</tbody></table></div></section>;
}
