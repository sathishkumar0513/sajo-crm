import { useEffect, useState } from "react";
import api from "../api";
import Icon from "../components/Icon";

const unwrap = (response) => response.data.results || response.data;
const formatSize = (size) => size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;

export default function DatabaseBackupPage() {
  const [backups, setBackups] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  function load() { api.get("/database-backups/").then((response) => setBackups(unwrap(response))).catch(() => setError("Unable to load database backups.")); }
  useEffect(() => { load(); }, []);
  async function createBackup() { try { await api.post("/database-backups/"); load(); } catch { setError("Unable to create database backup."); } }
  async function remove(backup) { if (!window.confirm(`Delete ${backup.name}?`)) return; try { await api.delete(`/database-backups/${backup.id}/`); load(); } catch { setError("Unable to delete database backup."); } }
  const filtered = backups.filter((backup) => backup.name.toLowerCase().includes(search.toLowerCase()));
  async function download(backup) {
    try {
      const response = await api.get(`/database-backups/${backup.id}/download/`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = backup.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Unable to download database backup.");
    }
  }
  function exportBackups() {
    const rows = [["Backup", "Size", "Created At"], ...filtered.map((backup) => [backup.name, backup.size, backup.created_at])];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "database-backups.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return <section className="backup-page"><div className="panel backup-header"><div><h1>Database Backup</h1><p>Note: Automatic backup scheduling is not configured. Use manual backup creation or configure an external scheduler before deployment.</p></div><div><button className="secondary-button" disabled title="Automatic scheduling is not configured"><Icon name="refresh" /> AUTO BACKUP</button><button className="primary-button" onClick={createBackup}><Icon name="plus" /> CREATE DATABASE BACKUP</button></div></div>{error && <p className="error-message">{error}</p>}<div className="panel backup-list"><div className="referral-toolbar"><div className="staff-list-controls"><select><option>25</option><option>50</option></select><button className="toolbar-icon-button" onClick={exportBackups} disabled={!filtered.length}><Icon name="download" /> EXPORT</button><button className="toolbar-icon-button" onClick={load}><Icon name="refresh" /> Refresh</button></div><label className="staff-search"><Icon name="search" /> <input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><table><thead><tr><th>Backup</th><th>Backup Size</th><th>Date</th><th>Options</th></tr></thead><tbody>{filtered.length ? filtered.map((backup) => <tr key={backup.id}><td>{backup.name}</td><td>{formatSize(backup.size)}</td><td>{new Date(backup.created_at).toLocaleString()}</td><td><button className="backup-download" onClick={() => download(backup)}><Icon name="download" /> Download</button><button className="table-action" onClick={() => remove(backup)}><Icon name="trash" /> Delete</button></td></tr>) : <tr><td colSpan="4" className="backup-empty">No entries found  <div className="empty-upload-icon"><Icon name="upload" /></div></td></tr>}</tbody></table></div></section>;
}
