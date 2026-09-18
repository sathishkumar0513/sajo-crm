import { useEffect, useState } from "react";
import api from "../api";

const unwrap = (response) => response.data.results || response.data;

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  function load() {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (search) params.set("search", search);
    api.get(`/activity-logs/?${params}`).then((response) => setLogs(unwrap(response))).catch(() => setError("Unable to load activity log."));
  }
  useEffect(() => { load(); }, [date, search]);
  async function clear() {
    if (!window.confirm("Clear all activity log entries?")) return;
    try { await api.delete("/activity-logs/clear/"); load(); } catch { setError("Unable to clear activity log."); }
  }
  return <section className="activity-log-page"><div className="panel activity-log-filter"><label>Filter by date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button className="danger-button" onClick={clear}>CLEAR LOG</button></div>{error && <p className="error-message">{error}</p>}<div className="panel activity-log-list"><div className="referral-toolbar"><div className="staff-list-controls"><select><option>25</option><option>50</option><option>100</option></select><button className="toolbar-icon-button">EXPORT</button><button className="toolbar-icon-button" onClick={load}>↻</button></div><label className="staff-search">⌕ <input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><table><thead><tr><th>Description</th><th>Date</th><th>Staff</th></tr></thead><tbody>{logs.length ? logs.map((log) => <tr key={log.id}><td>{log.description}</td><td>{new Date(log.date).toLocaleString()}</td><td>{log.staff || "Admin"}</td></tr>) : <tr><td colSpan="3" className="activity-log-empty">No entries found</td></tr>}</tbody></table><div className="activity-log-pagination"><span>Showing 1 to {logs.length} of {logs.length} entries</span><div><button>Previous</button><button className="active">1</button><button>Next</button></div></div></div></section>;
}
