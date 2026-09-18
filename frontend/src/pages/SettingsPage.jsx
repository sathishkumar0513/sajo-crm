import { useEffect, useMemo, useState } from "react";
import api from "../api";

const groups = [
  ["General", [["Company Information", "company"], ["Bank Information", "bank"], ["Localization", "localization"], ["WhatsApp", "whatsapp"], ["Email", "email"], ["Customers", "customers"], ["Vendors", "vendors"], ["Job Activities", "job-activities"], ["Leads", "leads"], ["Calendar", "calendar"], ["PDF", "pdf"], ["ReCaptcha", "recaptcha"], ["Cron Job", "cron"], ["Tags", "tags"], ["Google", "google"], ["Misc", "misc"]]],
];

const fields = {
  company: [["company_name", "Company Name"], ["company_main_domain", "Company Main Domain"], ["company_address", "Address"], ["company_city", "City"], ["company_state", "State"], ["company_country", "Country"], ["company_zip", "Zip Code"], ["company_phone", "Phone"], ["company_gst_number", "GST Number"], ["company_allowed_file_types", "Allowed file types"]],
  bank: [["bank_name", "Bank Name"], ["bank_account_number", "Account Number"], ["bank_ifsc", "IFSC"], ["bank_branch", "Branch"]],
  localization: [["timezone", "Timezone"], ["date_format", "Date Format"], ["currency", "Default Currency"], ["language", "Language"]],
  email: [["smtp_host", "SMTP Host"], ["smtp_port", "SMTP Port"], ["smtp_username", "SMTP Username"], ["smtp_from_email", "From Email"]],
  calendar: [["calendar_first_day", "First Day of Week"], ["calendar_default_view", "Default Calendar View"], ["calendar_event_limit", "Events Limit"]],
};

export default function SettingsPage() {
  const [active, setActive] = useState("company");
  const [settings, setSettings] = useState([]);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [logo, setLogo] = useState(() => localStorage.getItem("crm_logo") || "");
  const activeFields = useMemo(() => fields[active] || [["value", `${active} configuration`]], [active]);
  useEffect(() => { api.get("/settings/").then(({ data }) => { const rows = data.results || data; setSettings(rows); const values = Object.fromEntries(rows.map((row) => [row.key, row.value?.value ?? row.value ?? ""])); setForm(values); }).catch(() => setError("Unable to load settings.")); }, []);
  function selectGroup(key) { setActive(key); setSaved(false); }
  function chooseLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      setError("Please choose a PNG, JPG, WEBP, or SVG logo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo image must be smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      setLogo(value);
      localStorage.setItem("crm_logo", value);
      window.dispatchEvent(new Event("crm:logo-updated"));
      setError("");
      setSaved(true);
    };
    reader.readAsDataURL(file);
  }
  function removeLogo() {
    setLogo("");
    localStorage.removeItem("crm_logo");
    window.dispatchEvent(new Event("crm:logo-updated"));
  }
  async function save() {
    setError(""); setSaved(false);
    try {
      await Promise.all(activeFields.map(async ([key, label]) => {
        const current = settings.find((item) => item.key === key);
        const payload = { key, value: form[key] || "", description: label, is_public: false };
        if (current) await api.patch(`/settings/${current.id}/`, payload);
        else await api.post("/settings/", payload);
      }));
      const { data } = await api.get("/settings/");
      setSettings(data.results || data);
      setSaved(true);
    } catch { setError("Unable to save these settings."); }
  }
  return <section className="settings-page"><div className="settings-layout"><aside className="settings-groups panel">{groups.map(([heading, items]) => <div key={heading}><h3>{heading}</h3>{items.map(([label, key]) => <button type="button" className={active === key ? "active" : ""} onClick={() => selectGroup(key)} key={key}>{label}</button>)}</div>)}</aside><div className="settings-content panel"><div className="settings-branding"><div className="settings-logo-preview">{logo ? <img src={logo} alt="CRM logo preview" /> : <div className="settings-logo-placeholder">SAJO<br /><small>CRM</small></div>}</div><div className="settings-logo-controls"><strong>Company Logo</strong><p>Upload a clear PNG, JPG, WEBP, or SVG logo. It will appear in the top-left CRM navigation.</p><label className="secondary-button settings-upload-button">UPLOAD LOGO<input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" onChange={chooseLogo} /></label>{logo && <button type="button" className="text-button" onClick={removeLogo}>Remove logo</button>}</div></div><div className="settings-form"><h2>{activeFields[0]?.[1] || active}</h2>{activeFields.map(([key, label]) => <label key={key}>{label}{key.includes("allowed") || key.includes("address") ? <textarea value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /> : <input value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />}</label>)}</div>{error && <p className="error-message">{error}</p>}{saved && <p className="success-message">Settings saved successfully.</p>}<div className="settings-actions"><button className="primary-button" onClick={save}>SAVE SETTINGS</button></div></div></div></section>;
}
