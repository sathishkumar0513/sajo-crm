import { useEffect, useMemo, useState } from "react";
import api from "../api";

const unwrap = (response) => response.data.results || response.data;
const colors = ["#2bb4cf", "#159fe0", "#c13eb0", "#777", "#8b20ae", "#d91d68", "#0c83c5"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function LeadsReportPage() {
  const [leads, setLeads] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffMode, setStaffMode] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth());
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([api.get("/leads/"), api.get("/staff/?is_active=true")]).then(([leadResponse, staffResponse]) => { setLeads(unwrap(leadResponse)); setStaff(unwrap(staffResponse)); }).catch(() => setError("Unable to load lead report.")); }, []);
  const converted = (lead) => Boolean(lead.converted_customer || lead.converted_enquiry || lead.status === "customer" || lead.status === "enquiry_created");
  const weekly = useMemo(() => staffMode
    ? staff.map((member) => ({ day: member.name, total: leads.filter((lead) => lead.assigned_to === member.id && converted(lead)).length }))
    : days.map((day, index) => ({ day, total: leads.filter((lead) => new Date(lead.created_at).getDay() === (index + 1) % 7 && converted(lead)).length })), [leads, staff, staffMode]);
  const sourceRows = useMemo(() => Object.entries(leads.reduce((result, lead) => { const source = lead.source || "Unknown"; result[source] = (result[source] || 0) + (converted(lead) ? 1 : 0); return result; }, {})), [leads]);
  const monthly = useMemo(() => Array.from({ length: 30 }, (_, index) => leads.filter((lead) => { const date = new Date(lead.created_at); return date.getMonth() === month && date.getDate() === index + 1; }).length), [leads, month]);
  const max = Math.max(...weekly.map((row) => row.total), ...sourceRows.map(([, total]) => total), ...monthly, 1);
  return <section className="leads-report-page"><button className="primary-button leads-switch" onClick={() => setStaffMode(!staffMode)}>{staffMode ? "SWITCH TO LEAD REPORT" : "SWITCH TO STAFF REPORT"}</button>{error && <p className="error-message">{error}</p>}<div className="leads-report-grid"><article className="panel leads-report-card"><h2>{staffMode ? "This Week Staff Conversions" : "This Week Leads Conversions"}</h2><div className="chart-legend">{weekly.map((row, index) => <span key={row.day}><i style={{ background: colors[index] }} />{row.day}</span>)}</div><div className="lead-bars">{weekly.map((row, index) => <div className="lead-bar-column" key={row.day}><span style={{ height: `${row.total / max * 100}%`, background: colors[index] }} /><small>{row.total}</small></div>)}</div></article><article className="panel leads-report-card"><h2>Sources Conversion</h2><div className="source-chart">{sourceRows.length ? sourceRows.map(([source, total]) => <div className="source-column" key={source}><span style={{ height: `${total / max * 100}%` }} /><small>{source}</small></div>) : <p className="report-empty">No conversion data</p>}</div></article></div><article className="panel leads-monthly-card"><h2>Monthly</h2><select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option value={index} key={index}>{new Date(2000, index, 1).toLocaleString("en-US", { month: "long" })}</option>)}</select><div className="monthly-lead-chart">{monthly.map((total, index) => <span key={index} title={`${index + 1}: ${total}`} style={{ height: `${total / max * 100}%` }} />)}</div></article></section>;
}
