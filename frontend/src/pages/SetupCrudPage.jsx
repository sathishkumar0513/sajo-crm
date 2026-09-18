import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import api from "../api";
import Icon from "../components/Icon";

const text = (key, label, placeholder = "") => ({ key, label, type: "text", placeholder });
const textarea = (key, label, placeholder = "") => ({ key, label, type: "textarea", placeholder });
const number = (key, label, step = "1") => ({ key, label, type: "number", step });
const select = (key, label, options) => ({ key, label, type: "select", options });
const checkbox = (key, label) => ({ key, label, type: "checkbox" });

export const setupDefinitions = {
  "customer-groups": { title: "Customer Groups", section: "Customers", endpoint: "/customer-groups/", description: "Organise customers into reusable groups.", fields: [text("name", "Group name", "Residential customers"), textarea("description", "Description")], columns: [["name", "Group name"], ["description", "Description"]] },
  designations: { title: "Designations", section: "Staff", endpoint: "/staff-designations/", description: "Manage staff designations used across the CRM.", fields: [text("name", "Designation", "Service Manager"), textarea("description", "Description")], columns: [["name", "Designation"], ["description", "Description"]] },
  "complaint-departments": { title: "Complaint Departments", section: "Complaints", endpoint: "/complaint-departments/", description: "Route complaints to the right department.", fields: [text("name", "Department", "Technical Support"), text("email", "Email", "support@example.com")], columns: [["name", "Department"], ["email", "Email"]] },
  "predefined-replies": { title: "Predefined Replies", section: "Complaints", endpoint: "/predefined-replies/", description: "Keep frequently used complaint responses ready for agents.", fields: [text("name", "Reply name", "Visit scheduled"), textarea("body", "Reply", "Thanks for contacting us...")], columns: [["name", "Reply name"], ["body", "Reply"]] },
  "complaint-priorities": { title: "Complaint Priorities", section: "Complaints", endpoint: "/complaint-priorities/", description: "Define complaint priority levels and their display order.", fields: [text("name", "Priority", "Urgent"), number("level", "Level"), select("color", "Color", ["red", "orange", "yellow", "green"])], columns: [["name", "Priority"], ["level", "Level"], ["color", "Color"]] },
  "job-activity-templates": { title: "Job Activity Templates", section: "Job Activities", endpoint: "/job-activity-templates/", description: "Create reusable activity templates for field teams.", fields: [text("name", "Template name", "Camera installation"), textarea("description", "Description"), checkbox("active", "Active")], columns: [["name", "Template"], ["description", "Description"], ["active", "Active"]] },
  "job-activity-checklists": { title: "Job Activity Checklists", section: "Job Activities", endpoint: "/job-activity-checklists/", description: "Manage checklist items used by job activity templates.", fields: [select("template", "Template", []), text("name", "Checklist item", "Verify cable termination"), textarea("description", "Description"), number("position", "Display order"), checkbox("is_required", "Required")], columns: [["template_name", "Template"], ["name", "Checklist item"], ["position", "Order"], ["is_required", "Required"]] },
  "lead-sources": { title: "Lead Sources", section: "Leads", endpoint: "/lead-sources/", description: "Track where new leads originate.", fields: [text("name", "Source", "Website"), textarea("description", "Description")], columns: [["name", "Source"], ["description", "Description"]] },
  "lead-statuses": { title: "Lead Statuses", section: "Leads", endpoint: "/lead-statuses/", description: "Configure the lead pipeline statuses.", fields: [text("name", "Status", "Qualified"), number("position", "Position"), checkbox("is_default", "Default"), checkbox("is_closed", "Closed")], columns: [["name", "Status"], ["position", "Position"], ["is_default", "Default"], ["is_closed", "Closed"]] },
  "lead-hotness-levels": { title: "Lead Hotness", section: "Leads", endpoint: "/lead-hotness-levels/", description: "Define lead temperature levels for prioritisation.", fields: [text("name", "Level", "Hot"), number("score", "Score"), select("color", "Color", ["red", "orange", "yellow", "blue"])], columns: [["name", "Level"], ["score", "Score"], ["color", "Color"]] },
  campaigns: { title: "Campaigns", section: "Leads", endpoint: "/campaigns/", description: "Manage marketing campaigns used by lead capture.", fields: [text("name", "Campaign", "Summer Security Offer"), text("code", "Campaign code", "SUMMER26"), text("start_date", "Start date"), text("end_date", "End date")], columns: [["name", "Campaign"], ["code", "Code"], ["start_date", "Start date"], ["end_date", "End date"]] },
  "email-integrations": { title: "Lead Email Integration", section: "Leads", endpoint: "/email-integrations/", description: "Configure inboxes that create leads automatically.", fields: [text("name", "Integration name", "Website inbox"), text("host", "IMAP/SMTP host"), number("port", "Port"), text("username", "Username"), text("from_email", "From email"), checkbox("use_tls", "Use TLS")], columns: [["name", "Integration"], ["host", "Host"], ["port", "Port"], ["from_email", "From email"], ["use_tls", "TLS"]] },
  "web-to-lead-forms": { title: "Web to Lead", section: "Leads", endpoint: "/web-to-lead-forms/", description: "Manage public lead capture forms and their routing.", fields: [text("name", "Form name", "Website enquiry"), text("slug", "Form slug", "website-enquiry"), text("success_message", "Success message")], columns: [["name", "Form"], ["slug", "Slug"], ["success_message", "Success message"]] },
  "lead-reasons": { title: "Lead Reasons", section: "Leads", endpoint: "/lead-reasons/", description: "Capture why leads are won, lost, or paused.", fields: [text("name", "Reason", "Budget unavailable"), select("reason_type", "Type", ["won", "lost", "paused"])], columns: [["name", "Reason"], ["reason_type", "Type"]] },
  "tax-rates": { title: "Tax Rates", section: "Finance", endpoint: "/tax-rates/", description: "Manage reusable tax percentages for invoices and expenses.", fields: [text("name", "Tax name", "GST 18%"), number("rate", "Rate (%)", "0.01"), checkbox("is_compound", "Compound")], columns: [["name", "Tax name"], ["rate", "Rate (%)"], ["is_compound", "Compound"]] },
  currencies: { title: "Currencies", section: "Finance", endpoint: "/currencies/", description: "Manage currencies available across finance modules.", fields: [text("name", "Currency", "Indian Rupee"), text("code", "Code", "INR"), text("symbol", "Symbol", "₹"), number("exchange_rate", "Exchange rate", "0.000001"), checkbox("is_default", "Default")], columns: [["name", "Currency"], ["code", "Code"], ["symbol", "Symbol"], ["exchange_rate", "Exchange rate"], ["is_default", "Default"]] },
  "payment-modes": { title: "Payment Modes", section: "Finance", endpoint: "/payment-modes/", description: "Manage payment methods shown on finance forms.", fields: [text("name", "Payment mode", "Bank Transfer"), textarea("description", "Description")], columns: [["name", "Payment mode"], ["description", "Description"]] },
  "expense-categories": { title: "Expense Categories", section: "Finance", endpoint: "/expense-categories/", description: "Classify expenses for reporting and approvals.", fields: [text("name", "Category name", "Transport"), textarea("description", "Description")], columns: [["name", "Category"], ["description", "Description"]] },
  products: { title: "Products", section: "Items", endpoint: "/item-groups/", description: "Manage product groups used by the item catalogue.", fields: [text("name", "Product group", "CCTV Equipment"), textarea("description", "Description")], columns: [["name", "Product group"], ["description", "Description"]] },
  units: { title: "Units", section: "Items", endpoint: "/units/", description: "Manage units of measure for products.", fields: [text("name", "Unit", "Piece"), text("abbreviation", "Abbreviation", "pc")], columns: [["name", "Unit"], ["abbreviation", "Abbreviation"]] },
  "amc-types": { title: "AMC Types", section: "AMC", endpoint: "/amc-types/", description: "Define annual maintenance contract types and pricing.", fields: [text("name", "AMC type", "Comprehensive"), number("default_value", "Default value", "0.01")], columns: [["name", "AMC type"], ["default_value", "Default value"]] },
  "email-templates": { title: "Email Templates", section: "Administration", endpoint: "/email-templates/", description: "Manage reusable email templates for CRM communication.", fields: [text("name", "Template name", "Invoice Reminder"), text("subject", "Subject", "Your invoice is due"), textarea("body", "Message body")], columns: [["name", "Template"], ["subject", "Subject"], ["body", "Message body"]] },
  roles: { title: "Roles", section: "Administration", endpoint: "/roles/", description: "Manage role names used by staff accounts.", fields: [text("name", "Role", "Sales Manager"), textarea("description", "Description")], columns: [["name", "Role"], ["description", "Description"]] },
  "main-menu": { title: "Main Menu", section: "Administration", endpoint: "/main-menu/", description: "Configure labels and visibility for the main navigation.", fields: [text("name", "Menu label", "Dashboard"), text("path", "Path", "/"), number("order", "Display order"), checkbox("visible", "Visible")], columns: [["name", "Label"], ["path", "Path"], ["order", "Order"], ["visible", "Visible"]] },
  "setup-menu": { title: "Setup Menu", section: "Administration", endpoint: "/setup-menu/", description: "Configure the Setup navigation groups.", fields: [text("name", "Menu label", "Finance"), text("path", "Path", "/setup/tax-rates"), number("order", "Display order"), checkbox("visible", "Visible")], columns: [["name", "Label"], ["path", "Path"], ["order", "Order"], ["visible", "Visible"]] },
  "theme-style": { title: "Theme Style", section: "Administration", endpoint: "/theme-styles/", description: "Save workspace theme presets for your team.", fields: [text("name", "Theme name", "Default Light"), textarea("config", "Configuration JSON"), checkbox("is_default", "Default")], columns: [["name", "Theme"], ["config", "Configuration"], ["is_default", "Default"]] },
  settings: { title: "Settings", section: "Administration", endpoint: "/settings/", description: "Manage CRM configuration preferences.", fields: [text("key", "Setting key", "company_timezone"), text("value", "Value", "Asia/Kolkata"), textarea("description", "Description"), checkbox("is_public", "Public")], columns: [["key", "Setting"], ["value", "Value"], ["description", "Description"], ["is_public", "Public"]] },
};

const unwrap = ({ data }) => data?.results || data || [];
const initialValue = (definition) => definition.fields.reduce((result, field) => ({ ...result, [field.key]: field.type === "checkbox" ? true : "" }), {});

export default function SetupCrudPage({ module }) {
  const { option } = useParams();
  const location = useLocation();
  const key = module || option || location.pathname.split("/").filter(Boolean).pop();
  const definition = setupDefinitions[key] || setupDefinitions["tax-rates"];
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(() => initialValue(definition));
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);

  const load = () => {
    setLoading(true);
    setError("");
    api.get(definition.endpoint).then((response) => setItems(unwrap(response))).catch(() => setError(`Unable to load ${definition.title.toLowerCase()}.`)).finally(() => setLoading(false));
  };
  useEffect(() => {
    setForm(initialValue(definition));
    setEditing(null);
    if (key === "job-activity-checklists") api.get("/job-activity-templates/").then((response) => setTemplates(unwrap(response))).catch(() => setTemplates([]));
    load();
  }, [key]);
  const title = editing ? `Edit ${definition.title}` : `Add ${definition.title}`;
  const fields = useMemo(() => definition.fields, [definition]);

  function startEdit(item) {
    setEditing(item.id);
    setForm({ ...initialValue(definition), ...item });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() { setEditing(null); setForm(initialValue(definition)); }
  async function save(event) {
    event.preventDefault();
    setError("");
    try {
      if (editing) await api.patch(`${definition.endpoint}${editing}/`, form);
      else await api.post(definition.endpoint, form);
      cancelEdit();
      load();
    } catch (requestError) {
      setError(requestError.response?.data ? "The server rejected this setup record." : "Unable to save this setup record.");
    }
  }
  async function remove(item) {
    if (!window.confirm(`Delete ${item.name || "this record"}?`)) return;
    try { await api.delete(`${definition.endpoint}${item.id}/`); load(); } catch { setError("This record could not be deleted."); }
  }
  function display(item, field) {
    const value = item[field];
    if (field === "active" || field === "required" || field === "visible") return value ? "Yes" : "No";
    if (field === "template_name") return item.template_name || "—";
    return value === null || value === undefined || value === "" ? "—" : String(value);
  }

  return <section className="setup-detail-page">
    <div className="setup-detail-header"><div><p className="eyebrow">Setup / {definition.section}</p><h1>{definition.title}</h1><p className="page-copy">{definition.description}</p></div><button className="primary-button" onClick={() => { cancelEdit(); document.getElementById("setup-form")?.scrollIntoView({ behavior: "smooth" }); }}><Icon name="plus" /> New</button></div>
    <div className="panel setup-detail-panel">
      <form id="setup-form" className="setup-crud-form" onSubmit={save}><div className="setup-form-heading"><h2>{title}</h2>{editing && <button type="button" className="secondary-button" onClick={cancelEdit}>Cancel</button>}</div><div className="setup-form-grid">{fields.map((field) => <label key={field.key} className={field.type === "checkbox" ? "setup-checkbox" : ""}>{field.type === "checkbox" ? <><input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })} />{field.label}</> : <>{field.label}{field.type === "textarea" ? <textarea value={form[field.key] || ""} placeholder={field.placeholder} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} /> : field.type === "select" ? <select required={field.key === "template"} value={form[field.key] || ""} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}><option value="">Select</option>{(field.key === "template" ? templates : field.options).map((option) => <option key={option.id || option} value={option.id || option}>{option.name || option}</option>)}</select> : <input required={field.key === "name"} type={field.type} step={field.step} value={form[field.key] ?? ""} placeholder={field.placeholder} onChange={(event) => setForm({ ...form, [field.key]: field.type === "number" ? Number(event.target.value) : event.target.value })} />}</>}</label>)}</div><button className="primary-button" type="submit"><Icon name={editing ? "edit" : "save"} />{editing ? "Update" : "Save"}</button></form>
      {error && <p className="error-message">{error}</p>}
      <div className="setup-table-wrap"><table className="setup-table"><thead><tr>{definition.columns.map(([, label]) => <th key={label}>{label}</th>)}<th>Options</th></tr></thead><tbody>{loading ? <tr><td colSpan={definition.columns.length + 1} className="report-empty">Loading...</td></tr> : items.length ? items.map((item) => <tr key={item.id}>{definition.columns.map(([field]) => <td key={field}>{display(item, field)}</td>)}<td><button className="table-action" onClick={() => startEdit(item)}><Icon name="edit" /> Edit</button><button className="table-action danger" onClick={() => remove(item)}><Icon name="trash" /> Delete</button></td></tr>) : <tr><td colSpan={definition.columns.length + 1} className="report-empty">No entries found</td></tr>}</tbody></table></div>
    </div>
  </section>;
}
