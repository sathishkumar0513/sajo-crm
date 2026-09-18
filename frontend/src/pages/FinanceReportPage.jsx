import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../components/Icon";

const unwrap = (response) => response.data.results || response.data;
const reports = ["Proforma Invoices Report", "Items Report", "Payments Received", "Credit Notes Report", "Quotations Report", "Customers Report", "Stock Report", "Finance Tax Report", "Purchase Tax Report", "Proforma Invoice Payments Report", "Purchase Invoice Payments Report"];
const charts = ["Total Income", "Payment Modes (Transactions)", "Total Value By Customer Group"];

export default function FinanceReportPage() {
  const [report, setReport] = useState(reports[0]);
  const [chart, setChart] = useState("");
  const [period, setPeriod] = useState("This Month");
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const endpoint = report === "Proforma Invoices Report" ? "/proforma-invoices/" : report === "Items Report" || report === "Stock Report" ? "/items/" : report === "Payments Received" || report === "Proforma Invoice Payments Report" ? "/payments/" : report === "Credit Notes Report" ? "/credit-notes/" : report === "Quotations Report" ? "/quotations/" : report === "Customers Report" ? "/customers/" : "/expenses/";
    api.get(endpoint).then((response) => setRecords(unwrap(response))).catch(() => setError("Unable to load report data."));
  }, [report]);
  const filtered = useMemo(() => {
    const statusFiltered = status === "All" ? records : records.filter((record) => record.status === status.toLowerCase());
    const term = search.trim().toLowerCase();
    return term ? statusFiltered.filter((record) => JSON.stringify(record).toLowerCase().includes(term)) : statusFiltered;
  }, [records, search, status]);
  const total = filtered.reduce((sum, record) => sum + Number(record.amount || record.total || record.selling_rate || 0), 0);
  function exportCsv() {
    const headers = ["Reference", "Customer", "Date", "Due Date", "Amount", "Amount With Tax", "Total Tax", "Amount Open", "Status"];
    const rows = filtered.map((record) => [record.number || record.name || record.subject || "", record.customer_name || "", record.invoice_date || record.created_at?.slice(0, 10) || "", record.due_date || "", record.amount || record.total || record.selling_rate || 0, record.amount_with_tax || record.amount || 0, record.tax_amount || 0, Math.max(0, Number(record.amount || 0) - Number(record.amount_paid || 0)), record.status || ""]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `${report.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return <section className="finance-report-page"><div className="report-workspace panel"><div className="report-selection"><div><h2>Finance Report</h2>{reports.map((item) => <button key={item} className={report === item ? "selected" : ""} onClick={() => setReport(item)}><Icon name="report" /> {item}</button>)}</div><div><h2>Charts Based Report</h2>{charts.map((item) => <button key={item} className={chart === item ? "selected" : ""} onClick={() => setChart(item)}><Icon name="chart" /> {item}</button>)}</div>{chart && <label>Period<select value={period} onChange={(event) => setPeriod(event.target.value)}><option>This Month</option><option>This Year</option><option>Last Month</option><option>Last Year</option></select></label>}</div></div>{error && <p className="error-message">{error}</p>}{chart ? <div className="panel finance-chart-panel"><h2>{chart}</h2><div className="finance-chart"><span style={{ height: `${Math.max(8, Math.min(total / 10, 90))}%` }} /></div><p>{period}</p></div> : <div className="panel generated-report"><h2>Generated Report</h2><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>Draft</option><option>Paid</option><option>Unpaid</option><option>Partially Paid</option></select></label><div className="referral-toolbar"><div className="staff-list-controls"><select><option>25</option><option>50</option></select><button className="toolbar-icon-button" onClick={exportCsv}><Icon name="download" /> EXPORT</button><button className="toolbar-icon-button"><Icon name="refresh" /></button></div><label className="staff-search"><Icon name="search" /> <input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><table><thead><tr><th>{report === "Proforma Invoices Report" ? "Proforma Invoice #" : report}</th><th>Customer</th><th>Date</th><th>Due Date</th><th>Amount</th><th>Amount With Tax</th><th>Total Tax</th><th>Amount Open</th><th>Status</th></tr></thead><tbody>{filtered.length ? filtered.map((record) => <tr key={record.id}><td>{record.number || record.name || record.subject}</td><td>{record.customer_name || "—"}</td><td>{record.invoice_date || record.created_at?.slice(0, 10) || "—"}</td><td>{record.due_date || "—"}</td><td>₹{Number(record.amount || record.total || record.selling_rate || 0).toFixed(2)}</td><td>₹{Number(record.amount_with_tax || record.amount || 0).toFixed(2)}</td><td>₹{Number(record.tax_amount || 0).toFixed(2)}</td><td>₹{Math.max(0, Number(record.amount || 0) - Number(record.amount_paid || 0)).toFixed(2)}</td><td>{record.status || "—"}</td></tr>) : <tr><td colSpan="9" className="report-empty">No entries found</td></tr>}</tbody></table><p>Showing 1 to {filtered.length} of {filtered.length} entries</p></div>}</section>;
}
