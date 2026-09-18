import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import api from "./api";
import CustomerPage from "./pages/CustomerPage";
import EnquiryPage from "./pages/EnquiryPage";
import VendorPage from "./pages/VendorPage";
import PurchaseOrderPage from "./pages/PurchaseOrderPage";
import PurchaseInvoicePage from "./pages/PurchaseInvoicePage";
import JobActivitiesPage from "./pages/JobActivitiesPage";
import ReferralPartnersPage from "./pages/ReferralPartnersPage";
import ProjectsPage from "./pages/ProjectsPage";
import AMCPage from "./pages/AMCPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import QuotationsPage from "./pages/QuotationsPage";
import ProformaInvoicesPage from "./pages/ProformaInvoicesPage";
import GSTInvoicesPage from "./pages/GSTInvoicesPage";
import PaymentsPage from "./pages/PaymentsPage";
import AdvancePaymentsPage from "./pages/AdvancePaymentsPage";
import CreditNotesPage from "./pages/CreditNotesPage";
import ItemsPage from "./pages/ItemsPage";
import ExpensesPage from "./pages/ExpensesPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import GoalsPage from "./pages/GoalsPage";
import DatabaseBackupPage from "./pages/DatabaseBackupPage";
import FinanceReportPage from "./pages/FinanceReportPage";
import ExpensesVsIncomePage from "./pages/ExpensesVsIncomePage";
import LeadsReportPage from "./pages/LeadsReportPage";
import ExpensesReportPage from "./pages/ExpensesReportPage";
import SetupPage from "./pages/SetupPage";
import SetupCrudPage from "./pages/SetupCrudPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import AuthenticatedImage from "./components/AuthenticatedImage";
import Icon from "./components/Icon";

const API_ORIGIN = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000/api" : `${window.location.origin}/api`)).replace(/\/api\/?$/, "");
const moduleIcons = {
  Dashboard: "dashboard", Staff: "users", Leads: "leads", Customers: "customers", Enquiries: "report",
  "Referral Partners": "users", AMC: "briefcase", Projects: "briefcase", "Job Activities": "tools",
  Complaints: "report", Calendar: "calendar", Purchase: "shopping", Finance: "finance", Utilities: "tools",
  Reports: "report", Setup: "settings", Vendors: "shopping", "Purchase Orders": "shopping",
  "Purchase Invoices": "shopping", Quotations: "finance", "Proforma Invoices": "finance",
  "GST Invoices": "finance", Payments: "finance", "Advance Payments": "finance", "Credit Notes": "finance",
  Items: "shopping", Expenses: "finance", "Activity Log": "report", Goals: "report",
  "Database Backup": "save",
};
const navigation = [
  { label: "Dashboard", path: "/" },
  { label: "Staff", path: "/staff" },
  { label: "Leads", path: "/leads" },
  { label: "Customers", path: "/customers" },
  { label: "Enquiries", path: "/enquiries" },
  { label: "Referral Partners", path: "/referral-partners" },
  { label: "AMC", path: "/amc" },
  { label: "Projects", path: "/projects" },
  { label: "Job Activities", path: "/job-activities" },
  { label: "Complaints", path: "/complaints" },
  { label: "Calendar", path: "/calendar" },
  {
    label: "Purchase",
    children: [
      ["Vendors", "/purchase/vendors"],
      ["Purchase Orders", "/purchase/orders"],
      ["Purchase Invoices", "/purchase/invoices"],
    ],
  },
  {
    label: "Finance",
    children: [
      ["Quotations", "/finance/quotations"],
      ["Proforma Invoices", "/finance/proforma-invoices"],
      ["GST Invoices", "/finance/gst-invoices"],
      ["Payments", "/finance/payments"],
      ["Advance Payments", "/finance/advance-payments"],
      ["Credit Notes", "/finance/credit-notes"],
      ["Items", "/finance/items"],
      ["Expenses", "/finance/expenses"],
    ],
  },
  {
    label: "Utilities",
    children: [
      ["Activity Log", "/utilities/activity-log"],
      ["Goals", "/utilities/goals"],
      ["Database Backup", "/utilities/database-backup"],
    ],
  },
  {
    label: "Reports",
    children: [
      ["Finance", "/reports/finance"],
      ["Expenses", "/reports/expenses"],
      ["Expenses vs Income", "/reports/expenses-vs-income"],
      ["Leads", "/reports/leads"],
    ],
  },
  { label: "Setup", path: "/setup" },
];

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [logo, setLogo] = useState(() => localStorage.getItem("crm_logo") || "");

  useEffect(() => {
    const updateLogo = () => setLogo(localStorage.getItem("crm_logo") || "");
    window.addEventListener("crm:logo-updated", updateLogo);
    return () => window.removeEventListener("crm:logo-updated", updateLogo);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login/", credentials);
      onLogin();
      navigate("/");
    } catch {
      setError("Login failed. Check your username and password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className={`login-brand ${logo ? "login-brand-with-logo" : ""}`}>
          {logo ? <img src={logo} alt="Sajo CRM" /> : <><span>SAJO</span> <strong>CRM</strong></>}
        </div>
        <h1>Sign in</h1>
        <label>
          Email
          <input required type="email" value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} />
        </label>
        <label>
          Password
          <input required type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} />
        </label>
        {error && <p className="error-message">{error}</p>}
        <button className="primary-button" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
      </form>
    </main>
  );
}

function StatusSummary({ title, items, showLegend = false, actionLabel, actionPath }) {
  const navigate = useNavigate();
  const total = (items || []).reduce((sum, item) => sum + item.total, 0);
  return (
    <article className="panel status-panel">
      <h2>{title}</h2>
      <div className="status-layout">
        <div>
          {showLegend && <div className="status-legend">{(items || []).map((item) => <span key={item.status}><i className={`legend-dot status-${item.status}`} />{item.status.replaceAll("_", " ")}</span>)}</div>}
          <div className="donut" style={{ "--donut-total": total }}>
            <div className="donut-hole"><strong>{total}</strong><span>Total</span></div>
          </div>
        </div>
        <div className="status-list">
          {items?.length ? items.map((item) => (
            <div className={`status-row status-${item.status}`} key={item.status}>
              <span><i className="status-dot" />{item.status.replaceAll("_", " ")}</span>
              <strong>{item.total}</strong>
            </div>
          )) : <p className="empty-state">No status data yet.</p>}
        </div>
      </div>
      {actionLabel && <button className="wide-action" onClick={() => actionPath && navigate(actionPath)}>{actionLabel}</button>}
    </article>
  );
}

function StatusTiles({ items = [], actionLabel, actionPath }) {
  const navigate = useNavigate();
  return (
    <div className="status-tiles">
      {items.length ? items.map((item) => <div className={`status-tile status-${item.status}`} key={item.status}><strong>{item.total}</strong><span>{item.status.replaceAll("_", " ")}</span></div>) : <p className="empty-state">No records found.</p>}
      <button className="wide-action" onClick={() => actionPath && navigate(actionPath)}>{actionLabel}</button>
    </div>
  );
}

function statusTotal(items, status) {
  return (items || []).find((item) => item.status === status)?.total || 0;
}

function DailySummary({ title, items }) {
  const max = Math.max(...(items || []).map((item) => item.total), 1);
  return (
    <article className="panel">
      <h2>{title}</h2>
      {items?.length ? items.map((item) => (
        <div className="daily-row" key={item.day}>
          <span>{item.day}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.total / max) * 100}%` }} /></div>
          <strong>{item.total}</strong>
        </div>
      )) : <p className="empty-state">No daily data yet.</p>}
    </article>
  );
}

function DailyChart({ title, items = [], monthSelector = false }) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyItems = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
    const day = dateKey(date);
    return { day, total: items.find((item) => item.day === day)?.total || 0 };
  });
  const max = Math.max(...dailyItems.map((item) => item.total), 1);
  return (
    <section className="dashboard-chart panel">
      <div className="dashboard-chart-heading">
        <h2>{title}</h2>
        {monthSelector && <select aria-label="Report month" defaultValue={new Date().toLocaleString("en-US", { month: "long" })}><option>{new Date().toLocaleString("en-US", { month: "long" })}</option></select>}
      </div>
      <div className="chart-area">
        <div className="chart-y-axis">{[max, max * .75, max * .5, max * .25, 0].map((value) => <span key={value}>{Number.isInteger(value) ? value : value.toFixed(1)}</span>)}</div>
        <div className="chart-plot">
          <div className="chart-gridlines">{[0, 1, 2, 3, 4].map((line) => <i key={line} />)}</div>
          <div className="chart-bars">{dailyItems.map((item) => <div className="chart-bar-column" key={item.day}><div className="chart-bar" style={{ height: `${(item.total / max) * 100}%` }} title={`${item.day}: ${item.total}`} /><span>{item.day}</span></div>)}</div>
        </div>
      </div>
    </section>
  );
}

function ProposalStatusOverview({ items = [], onView }) {
  const statuses = ["draft", "sent", "open", "revised", "declined", "accepted"];
  return (
    <section className="proposal-overview panel">
      <h2>Proposal Status Overview</h2>
      <div className="proposal-content">
        <div className="proposal-chart">
          <div className="proposal-legend">{statuses.map((status) => <span key={status}><i className={`legend-dot status-${status}`} />{status}</span>)}</div>
        </div>
        <div className="proposal-tiles">{statuses.map((status) => <div className={`status-tile status-${status}`} key={status}><strong>{statusTotal(items, status)}</strong><span>{status}</span></div>)}<button className="wide-action" onClick={onView}>View All Proposals</button></div>
      </div>
    </section>
  );
}

function dateKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function JobActivityDetailModal({ activity, onClose }) {
  if (!activity) return null;
  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="modal-card calendar-detail-modal">
        <div className="modal-header">
          <div><h2>{activity.title}</h2><small>Job Activity · {activity.billable ? "Billable" : "Not Billable"}</small></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="calendar-detail-body">
          <div className="calendar-detail-main">
            <p className="calendar-related"><strong>Related:</strong> {activity.customer_name || activity.enquiry_title || "Not linked"}</p>
            <div className="calendar-detail-actions"><button className="detail-check-button" type="button">✓</button><button className="detail-icon-button" type="button">☷</button><button className="secondary-button" type="button">◷ Start timer</button></div>
            <section><h3>Description</h3><p>{activity.notes || "No description for this job activity"}</p></section>
            <section><h3>Checklist Item</h3><p>No checklist items found for this job activity</p></section>
            <section><h3>Comments</h3></section>
          </div>
          <aside className="calendar-detail-sidebar">
            <h3>Job Activity Info</h3>
            <p>Created by Admin</p>
            <dl>
              <div><dt>Status</dt><dd>{activity.status || "—"}</dd></div>
              <div><dt>Start Date</dt><dd>{activity.start_date || activity.start_at || "—"}</dd></div>
              <div><dt>Priority</dt><dd>{activity.priority || "—"}</dd></div>
              <div><dt>Type</dt><dd>{activity.activity_type || "—"}</dd></div>
              <div><dt>Charge</dt><dd>{activity.charge ?? 0}</dd></div>
            </dl>
            <section><h3>Assignees</h3><p>{activity.assigned_to_name || "Unassigned"}</p></section>
            <section><h3>Followers</h3><p>{activity.followers?.length ? `${activity.followers.length} follower(s)` : "No followers"}</p></section>
            <div className="calendar-upload-placeholder">Drop files here to upload</div>
          </aside>
        </div>
      </article>
    </div>
  );
}

function MonthCalendar({ events = [], compact = false }) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedActivity, setSelectedActivity] = useState(null);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthDays = new Date(year, monthIndex, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
    const dayOffset = index - firstDay;
    if (dayOffset < 0) return { day: previousMonthDays + dayOffset + 1, outside: true, key: `previous-${index}` };
    if (dayOffset >= daysInMonth) return { day: dayOffset - daysInMonth + 1, outside: true, key: `next-${index}` };
    return { day: dayOffset + 1, outside: false, key: `${year}-${monthIndex}-${dayOffset + 1}` };
  });
  const today = dateKey(new Date());
  const eventsByDate = events.reduce((groups, event) => {
    const key = dateKey(event.start_at);
    groups[key] = [...(groups[key] || []), event];
    return groups;
  }, {});

  function changeMonth(offset) {
    setMonth(new Date(year, monthIndex + offset, 1));
  }

  return (
    <div className={compact ? "month-calendar compact" : "month-calendar"}>
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button className="calendar-nav-button" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <button className="calendar-nav-button" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          <button className="calendar-today-button" onClick={() => setMonth(new Date())}>Today</button>
        </div>
        <strong>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong>
        <div className="calendar-view-label">Month</div>
      </div>
      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span className="calendar-day" key={day}>{day}</span>)}
        {cells.map((cell) => {
          const key = cell.outside ? "" : `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
          return (
            <div className={`calendar-cell ${cell.outside ? "outside" : ""} ${key === today ? "today" : ""}`} key={cell.key}>
              <span className="calendar-number">{cell.day}</span>
              {!cell.outside && (eventsByDate[key] || []).map((event, index) => <button type="button" className={`calendar-event ${event.isTodo ? "todo-calendar-event" : `event-color-${index % 4}`}`} title={event.title} onClick={() => event.isJobActivity && setSelectedActivity(event)} key={`${event.isTodo ? "todo" : "event"}-${event.id}`}>{event.isTodo ? `To do: ${event.title}` : event.title}</button>)}
            </div>
          );
        })}
      </div>
      <JobActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
    </div>
  );
}

function calendarItems(events = [], todos = [], activities = []) {
  return [
    ...events,
    ...todos
      .filter((todo) => !todo.completed && todo.due_date)
      .map((todo) => ({ ...todo, start_at: `${todo.due_date}T00:00:00`, isTodo: true })),
    ...activities
      .filter((activity) => activity.start_date && ["planned", "in_progress"].includes(activity.status))
      .map((activity) => ({ ...activity, start_at: `${activity.start_date}T00:00:00`, isJobActivity: true })),
  ];
}

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  function loadSummary() {
    api.get("/dashboard/")
      .then(({ data }) => setSummary(data))
      .catch(() => setError("Dashboard data is unavailable. Start the Django API and authenticate to load live values."));
  }

  useEffect(loadSummary, []);

  return (
    <section className="reference-dashboard">
      {error && <p className="error-message">{error}</p>}
      <div className="stat-grid dashboard-top-stats">
        {[
          ["Total Customers", summary?.quick_statistics?.total_customers],
          ["Active Customers", summary?.quick_statistics?.active_customers],
          ["Inactive Customers", summary?.quick_statistics?.inactive_customers],
        ].map(([label, value]) => (
          <article className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
            <small>{error || "Live CRM aggregate"}</small>
          </article>
        ))}
      </div>
      <section className="dashboard-status-section dashboard-primary-status panel">
        <h2>Enquiries Overview - Status</h2>
        <div className="dashboard-status-content">
          <div className="dashboard-enquiry-left">
            <StatusSummary title="" items={summary?.enquiries_status} showLegend />
            <div className="week-metrics"><h3>What's This Week?</h3><div className="week-metric-grid"><div><strong>{statusTotal(summary?.leads_status, "new")}</strong><span>New Leads</span></div><div><strong>{statusTotal(summary?.enquiries_status, "new")}</strong><span>New Enquiries</span></div><div><strong>{statusTotal(summary?.enquiries_status, "visited")}</strong><span>Total Site Visits</span></div><div><strong>{statusTotal(summary?.enquiries_status, "won")}</strong><span>Enquiries Won</span></div></div></div>
          </div>
          <div className="dashboard-enquiry-right"><StatusTiles items={summary?.enquiries_status} actionLabel="View All Enquiries" actionPath="/enquiries" /></div>
        </div>
      </section>
      <section className="dashboard-secondary-grid">
        <DailySummary title="Weekly Payment Records" items={summary?.payments_weekly} />
        <section className="dashboard-status-section panel">
          <h2>Leads Overview - Status</h2>
          <div className="dashboard-status-content"><StatusSummary title="" items={summary?.leads_status} showLegend /><StatusTiles items={summary?.leads_status} actionLabel="View Hot Prospects" actionPath="/leads" /></div>
        </section>
        <section className="dashboard-status-section panel">
          <h2>Purchase Orders Overview - Status</h2>
          <div className="dashboard-status-content"><StatusSummary title="" items={summary?.purchase_orders_status} /><StatusTiles items={summary?.purchase_orders_status} actionLabel="View Purchase Orders" actionPath="/purchase/orders" /></div>
        </section>
        <section className="dashboard-status-section panel">
          <h2>Purchase Invoices Overview - Status</h2>
          <div className="dashboard-status-content"><StatusSummary title="" items={summary?.purchase_invoices_status} /><StatusTiles items={summary?.purchase_invoices_status} actionLabel="View Purchase Invoices" actionPath="/purchase/invoices" /></div>
        </section>
      </section>
      <DailyChart title="Enquiries Generated Daily" items={summary?.enquiries_daily || []} />
      <ProposalStatusOverview items={summary?.quotations_status || []} onView={() => navigate("/finance/quotations")} />
      <DailyChart title="Leads Generated Daily Report" items={summary?.leads_daily || []} monthSelector />
      <div className="dashboard-lower">
        <article className="panel calendar-panel"><MonthCalendar events={calendarItems(summary?.upcoming_events, summary?.open_todos)} compact /></article>
        <article className="panel todo-panel">
          <div className="panel-heading"><h2>My To Do Items</h2><button className="secondary-button">New To Do</button></div>
          <p className="todo-heading">Latest to do&apos;s</p>
          {summary?.open_todos?.length ? summary.open_todos.map((todo) => <p className="todo-item" key={todo.id}>{todo.title}{todo.due_date ? ` - ${todo.due_date}` : ""}</p>) : <p className="empty-state">No todos found</p>}
          <p className="todo-heading complete">Latest finished to do&apos;s</p><p className="empty-state">No finished todos found</p>
        </article>
      </div>
      <section className="dashboard-status-section panel job-activities-overview">
        <h2>Job Activities Overview - Status</h2>
        <div className="dashboard-status-content"><StatusSummary title="" items={summary?.job_activities_status} /><StatusTiles items={summary?.job_activities_status} actionLabel="View All Job Activities" actionPath="/job-activities" /></div>
      </section>
    </section>
  );
}

function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState({ title: "", due_date: "" });
  const [error, setError] = useState("");

  function loadItems() {
    Promise.all([api.get("/calendar-events/"), api.get("/todos/"), api.get("/job-activities/?status=planned")])
      .then(([eventResponse, todoResponse, activityResponse]) => {
        setEvents(eventResponse.data.results || eventResponse.data);
        setTodos(todoResponse.data.results || todoResponse.data);
        const planned = activityResponse.data.results || activityResponse.data;
        return api.get("/job-activities/?status=in_progress").then((inProgressResponse) => {
          setActivities([...planned, ...(inProgressResponse.data.results || inProgressResponse.data)]);
          setError("");
        });
      })
      .catch(() => setError("Unable to load calendar items."));
  }

  useEffect(loadItems, []);

  async function createTodo(event) {
    event.preventDefault();
    try {
      await api.post("/todos/", form);
      setForm({ title: "", due_date: "" });
      loadItems();
    } catch {
      setError("The todo could not be created.");
    }
  }

  async function completeTodo(todo) {
    try {
      await api.patch(`/todos/${todo.id}/`, { completed: true, completed_at: new Date().toISOString() });
      loadItems();
    } catch {
      setError("The todo could not be updated.");
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">Workspace</p><h1>Calendar &amp; To Do</h1></div>
        <button className="secondary-button" onClick={loadItems}>Refresh</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="dashboard-lower">
        <article className="panel calendar-page-panel">
          <MonthCalendar events={calendarItems(events, todos, activities)} />
        </article>
        <article className="panel">
          <h2>My To Do Items</h2>
          <form className="todo-form" onSubmit={createTodo}>
            <input required placeholder="Add a task" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} />
            <button className="primary-button">Add</button>
          </form>
          {todos.filter((todo) => !todo.completed).map((todo) => <div className="todo-item todo-row" key={todo.id}><span>{todo.title}{todo.due_date ? ` - ${todo.due_date}` : ""}</span><button className="secondary-button" onClick={() => completeTodo(todo)}>Complete</button></div>)}
          {!todos.some((todo) => !todo.completed) && <p className="empty-state">No open todos.</p>}
        </article>
      </div>
    </section>
  );
}

const moduleConfig = {
  staff: {
    title: "Staff",
    endpoint: "/staff/",
    fields: [{ name: "name", label: "Name" }, { name: "email", label: "Email", type: "email" }, { name: "phone", label: "Phone" }, { name: "designation", label: "Designation" }],
    columns: ["name", "email", "phone", "designation", "is_active"],
  },
  customers: {
    title: "Customers",
    endpoint: "/customers/",
    fields: [{ name: "name", label: "Name" }, { name: "email", label: "Email", type: "email" }, { name: "phone", label: "Phone" }],
    columns: ["name", "email", "phone", "is_active"],
  },
  leads: {
    title: "Leads",
    endpoint: "/leads/",
    fields: [{ name: "name", label: "Name" }, { name: "email", label: "Email", type: "email" }, { name: "phone", label: "Phone" }],
    columns: ["name", "email", "phone", "status"],
  },
  enquiries: {
    title: "Enquiries",
    endpoint: "/enquiries/",
    fields: [{ name: "title", label: "Title" }],
    columns: ["title", "status", "created_at"],
  },
};

function CrmList({ module }) {
  const config = moduleConfig[module];
  const singularLabel = config.title === "Staff" ? "Staff Member" : config.title.slice(0, -1);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});

  function loadRecords() {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    api.get(`${config.endpoint}${query}`)
      .then(({ data }) => setRecords(Array.isArray(data) ? data : data.results || []))
      .catch(() => setError(`Unable to load ${config.title.toLowerCase()}.`));
  }

  function LeadPage() {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");
    const [groupFilter, setGroupFilter] = useState("");
    const [hotnessFilter, setHotnessFilter] = useState("");
    const [assignedFilter, setAssignedFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [conversionLead, setConversionLead] = useState(null);
    const [followUpDate, setFollowUpDate] = useState("");
    const [error, setError] = useState("");
    const [form, setForm] = useState({ country: "India", status: "new" });
    const [staff, setStaff] = useState([]);

    function loadLeads() {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (groupFilter) params.set("group", groupFilter);
      if (hotnessFilter) params.set("hotness", hotnessFilter);
      if (assignedFilter) params.set("assigned_to", assignedFilter);
      Promise.all([
        api.get(`/leads/${params.toString() ? `?${params}` : ""}`),
        api.get("/staff/?is_active=true"),
      ])
        .then(([leadsResponse, staffResponse]) => {
          const data = leadsResponse.data;
          setRecords(data.results || data);
          const staffData = staffResponse.data;
          setStaff(staffData.results || staffData);
        })
        .catch(() => setError("Unable to load leads."));
    }

    useEffect(loadLeads, [search, statusFilter, sourceFilter, groupFilter, hotnessFilter, assignedFilter, dateFilter]);

    async function createLead(event) {
      event.preventDefault();
      try {
        const payload = { ...form };
        const { data: lead } = await api.post("/leads/", payload);
        if (event.nativeEvent.submitter?.value === "create-enquiry") {
          await api.post("/enquiries/", {
            title: `Enquiry - ${lead.name}`,
            enquiry_type: "New Lead",
            lead: lead.id,
            email: lead.email || "",
            phone: lead.phone || "",
            assigned_to: lead.assigned_to || null,
            status: "new",
          });
          await api.patch(`/leads/${lead.id}/`, { status: "enquiry_created" });
          navigate("/enquiries");
        }
        setForm({ country: "India", status: "new" });
        setShowForm(false);
        setError("");
        loadLeads();
      } catch {
        setError("The lead could not be saved. Check the required fields.");
      }
    }

    function updateField(name, value) {
      setForm((current) => ({ ...current, [name]: value }));
    }

    async function changeLeadStatus(record, status) {
      try {
        await api.patch(`/leads/${record.id}/`, { status });
        loadLeads();
      } catch {
        setError("The lead status could not be updated.");
      }
    }

    async function convertLead() {
      try {
        await api.post(`/leads/${conversionLead.id}/convert/`, {
          enquiry_title: `Enquiry - ${conversionLead.name}`,
          follow_up_date: followUpDate || undefined,
        });
        setConversionLead(null);
        setFollowUpDate("");
        loadLeads();
      } catch {
        setError("This lead could not be converted.");
      }
    }

    const statuses = [
      ["new", "New Lead"],
      ["contact_attempted", "Contact Attempted"],
      ["contacted", "Contacted"],
      ["enquiry_created", "Enquiry Created"],
      ["unreachable", "Unreachable"],
      ["customer", "Customer"],
    ];

    return (
      <section>
        <div className="page-heading">
          <div><p className="eyebrow">CRM</p><h1>Leads</h1></div>
          <div className="heading-actions">
            <button className="staff-new-button" onClick={() => setShowForm(!showForm)}>{showForm ? "Close" : "New Lead"}</button>
            <button className="toolbar-icon-button" aria-label="Lead analytics">▥</button>
            <button className="toolbar-icon-button">Switch to Kanban</button>
          </div>
        </div>
        {error && <p className="error-message">{error}</p>}
        {conversionLead && <div className="panel conversion-panel"><div><strong>Convert {conversionLead.name}</strong><p>This creates a Customer and Enquiry linked to this Lead.</p></div><label>Follow-up date<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label><button className="primary-button" onClick={convertLead}>Convert Lead</button><button className="secondary-button" onClick={() => setConversionLead(null)}>Cancel</button></div>}
        {showForm && (
          <div className="lead-modal-backdrop">
          <form className="panel lead-form lead-modal" onSubmit={createLead}>
            <button type="button" className="lead-modal-close" onClick={() => setShowForm(false)} aria-label="Close"><Icon name="close" /></button>
            <div className="lead-form-heading"><strong>Add new lead</strong><span>Profile</span></div>
            <div className="lead-form-grid">
              <label>Status<select value={form.status} onChange={(event) => updateField("status", event.target.value)}>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>Source<input value={form.source || ""} onChange={(event) => updateField("source", event.target.value)} placeholder="Facebook, Website..." /></label>
              <label>Assigned to<select value={form.assigned_to || ""} onChange={(event) => updateField("assigned_to", event.target.value || null)}><option value="">Unassigned</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
              <label>Hotness<select value={form.hotness || ""} onChange={(event) => updateField("hotness", event.target.value)}><option value="">Select</option><option value="hot">Hot Lead</option><option value="warm">Warm Lead</option><option value="cold">Cold Lead</option></select></label>
              <label>Salutation<select value={form.salutation || ""} onChange={(event) => updateField("salutation", event.target.value)}><option value="">Select</option><option>Mr.</option><option>Mrs.</option><option>Ms.</option></select></label>
              <label>Name<input required value={form.name || ""} onChange={(event) => updateField("name", event.target.value)} /></label>
              <label>Company<input value={form.company || ""} onChange={(event) => updateField("company", event.target.value)} /></label>
              <label>Referred by<input value={form.referred_by || ""} onChange={(event) => updateField("referred_by", event.target.value)} /></label>
              <label>Phone<input required value={form.phone || ""} onChange={(event) => updateField("phone", event.target.value)} /></label>
              <label>Email Address<input type="email" value={form.email || ""} onChange={(event) => updateField("email", event.target.value)} /></label>
              <label>Group<input value={form.group || ""} onChange={(event) => updateField("group", event.target.value)} /></label>
              <label>Lead Value<input type="number" min="0" step="0.01" value={form.lead_value || ""} onChange={(event) => updateField("lead_value", event.target.value)} /></label>
              <label>Address<textarea value={form.address || ""} onChange={(event) => updateField("address", event.target.value)} /></label>
              <label>City<input value={form.city || ""} onChange={(event) => updateField("city", event.target.value)} /></label>
              <label>State<input value={form.state || ""} onChange={(event) => updateField("state", event.target.value)} /></label>
              <label>Country<input value={form.country || ""} onChange={(event) => updateField("country", event.target.value)} /></label>
              <label>Zip Code<input value={form.zip_code || ""} onChange={(event) => updateField("zip_code", event.target.value)} /></label>
              <label className="full-width">Description<textarea value={form.description || ""} onChange={(event) => updateField("description", event.target.value)} /></label>
            </div>
            <div className="lead-form-checks"><label><input type="checkbox" checked={Boolean(form.is_public)} onChange={(event) => updateField("is_public", event.target.checked)} /> Public</label><label><input type="checkbox" checked={Boolean(form.contacted_today)} onChange={(event) => updateField("contacted_today", event.target.checked)} /> Contacted Today</label></div>
            <div className="lead-form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Close</button><button className="primary-button" value="save">Save</button><button className="staff-new-button" value="create-enquiry">Save and Create Enquiry</button></div>
          </form>
          </div>
        )}
        <div className="lead-filters panel">
          <label>Assigned<select value={assignedFilter} onChange={(event) => setAssignedFilter(event.target.value)}><option value="">Assigned</option>{staff.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
          <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">New Lead, Contact Attempted, Contacted, Enquiry Created, Unreachable</option>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Source<select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="">Source</option><option>Facebook</option><option>Website</option><option>Referral</option></select></label>
          <label>Additional Filters<select><option>Additional Filters</option></select></label>
          <label>Hotness<select value={hotnessFilter} onChange={(event) => setHotnessFilter(event.target.value)}><option value="">Hotness</option><option value="hot">Hot Lead</option><option value="warm">Warm Lead</option><option value="cold">Cold Lead</option></select></label>
          <label>Campaign<select><option>Campaign</option></select></label>
          <label>Group<select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}><option value="">Group</option><option>IT / Corporate</option><option>Hotel</option><option>School</option><option>Hospital</option></select></label>
          <label>Dates<select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="">Nothing selected</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option></select></label>
        </div>
        <div className="lead-table-toolbar"><div><select><option>25</option><option>50</option><option>100</option></select><button className="toolbar-icon-button">EXPORT</button><button className="toolbar-icon-button">BULK ACTIONS</button><button className="toolbar-icon-button" onClick={loadLeads}>↻</button></div><label>Search<input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
        <div className="panel table-wrap">
          <table className="leads-table"><thead><tr><th><input type="checkbox" aria-label="Select all leads" /></th><th>#</th><th>Name</th><th>Phone</th><th>Group</th><th>Lead Value</th><th>Company</th><th>Status</th><th>Source</th><th>Referred By</th><th>Hotness</th><th>Assigned</th><th>Created</th><th>Created By</th><th>Actions</th></tr></thead>
            <tbody>{records.length ? records.map((record) => <tr key={record.id}><td><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => setSelectedIds((ids) => ids.includes(record.id) ? ids.filter((id) => id !== record.id) : [...ids, record.id])} /></td><td>{record.id}</td><td>{record.salutation ? `${record.salutation} ` : ""}{record.name}</td><td>{record.phone || "—"}</td><td>{record.group || "—"}</td><td>{record.lead_value ? `₹${Number(record.lead_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}</td><td>{record.company || "—"}</td><td><select className={`lead-status status-${record.status}`} value={record.status} onChange={(event) => changeLeadStatus(record, event.target.value)}>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td><td>{record.source || "—"}</td><td>{record.referred_by || "—"}</td><td><span className={`hot-lead ${record.hotness || ""}`}>{record.hotness ? `${record.hotness[0].toUpperCase()}${record.hotness.slice(1)} Lead` : "—"}</span></td><td>{record.assigned_to_name || "Unassigned"}</td><td>{record.created_at ? new Date(record.created_at).toLocaleDateString() : "—"}</td><td>Admin</td><td>{record.converted_customer ? <button className="compact-button secondary-button" onClick={() => navigate("/customers")}>Customer</button> : <button className="compact-button primary-button" onClick={() => setConversionLead(record)}>Convert</button>}</td></tr>) : <tr><td colSpan="15" className="empty-state">No leads found.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    );
  }

  function StaffPage() {
    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(25);
    const [showForm, setShowForm] = useState(false);
    const [tab, setTab] = useState("profile");
    const [editingId, setEditingId] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [form, setForm] = useState({ date_joined: new Date().toISOString().slice(0, 10), gender: "" });
    const [error, setError] = useState("");

    function loadStaff() {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      api.get(`/staff/${query}`)
        .then(({ data }) => setRecords(data.results || data))
        .catch(() => setError("Unable to load staff members."));
    }

    useEffect(loadStaff, [search]);

    async function createStaff(event) {
      event.preventDefault();
      try {
        const staffPayload = Object.fromEntries(
          ["first_name", "last_name", "email", "phone", "gender", "designation", "date_joined", "is_administrator"].map((field) => [field, form[field] ?? ""]),
        );
        if (!staffPayload.date_joined) staffPayload.date_joined = null;
        const payload = new FormData();
        Object.entries(staffPayload).forEach(([field, value]) => payload.append(field, value ?? ""));
        if (form.password) payload.append("password", form.password);
        if (profileImage) payload.append("profile_image", profileImage);
        if (editingId) {
          await api.patch(`/staff/${editingId}/`, payload);
        } else {
          payload.append("is_active", "true");
          await api.post("/staff/", payload);
        }
        setForm({ date_joined: new Date().toISOString().slice(0, 10), gender: "" });
        setProfileImage(null);
        setShowForm(false);
        setEditingId(null);
        setProfileImage(null);
        setTab("profile");
        setError("");
        loadStaff();
      } catch (error) {
        if (error.response?.status === 401) {
          setError("Your session has expired. Please sign in again.");
          return;
        }
        const validation = error.response?.data;
        const details = validation && typeof validation === "object"
          ? Object.entries(validation).map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`).join(" ")
          : "";
        setError(details || "The staff member could not be saved. Check the required fields.");
      }
    }

    function updateField(name, value) {
      setForm((current) => ({ ...current, [name]: value }));
    }

    function openCreate() {
      setEditingId(null);
      setForm({ date_joined: new Date().toISOString().slice(0, 10), gender: "" });
      setTab("profile");
      setShowForm(true);
    }

    function openEdit(record) {
      const nameParts = (record.name || "").trim().split(/\s+/);
      setEditingId(record.id);
      setForm({
        first_name: record.first_name || nameParts.shift() || "",
        last_name: record.last_name || nameParts.join(" "),
        email: record.email || "",
        phone: record.phone || "",
        gender: record.gender || "",
        designation: record.designation || "",
        date_joined: record.date_joined || "",
        is_administrator: Boolean(record.is_administrator),
        profile_image: record.profile_image || "",
      });
      setProfileImage(null);
      setTab("profile");
      setShowForm(true);
    }

    useEffect(() => {
      const editId = new URLSearchParams(window.location.search).get("edit");
      if (editId && records.length) {
        const record = records.find((item) => String(item.id) === editId);
        if (record) openEdit(record);
      }
    }, [records]);

    async function deleteStaff(record) {
      if (!window.confirm(`Delete ${record.name}?`)) return;
      try {
        await api.delete(`/staff/${record.id}/`);
        loadStaff();
      } catch {
        setError("The staff member could not be deleted.");
      }
    }

    async function toggleStaff(record) {
        try {
          const { data } = await api.post(`/staff/${record.id}/toggle_status/`);
          setRecords((current) => current.map((item) => item.id === record.id ? { ...item, is_active: data.is_active } : item));
        } catch {
          setError("The staff status could not be updated.");
        }
    }

    function exportStaff() {
        const headers = ["Full Name", "Email", "Phone Number", "Designation", "Role", "Last Login", "Active"];
        const rows = records.map((record) => [
          record.name,
          record.email,
          record.phone || "",
          record.designation || "",
          record.is_administrator ? "Administrator" : "Employee",
          "Never",
          record.is_active ? "Yes" : "No",
        ]);
        const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        link.download = "staff.csv";
        link.click();
        URL.revokeObjectURL(link.href);
    }

    return (
      <section>
        <div className="page-heading">
          <div><p className="eyebrow">Administration</p><h1>Staff</h1></div>
          <button className="staff-new-button" onClick={showForm ? () => setShowForm(false) : openCreate}>{showForm ? "Close" : "New Staff Member"}</button>
        </div>
        {error && <p className="error-message">{error}</p>}
        {showForm && (
          <form className="panel staff-form" onSubmit={createStaff}>
            <div className="staff-tabs" role="tablist">
              <button type="button" className={tab === "profile" ? "staff-tab active" : "staff-tab"} onClick={() => setTab("profile")}>Profile</button>
              <button type="button" className={tab === "permissions" ? "staff-tab active" : "staff-tab"} onClick={() => setTab("permissions")}>Permissions</button>
            </div>
            {tab === "profile" ? (
              <div className="staff-form-fields">
                <label className="full-width">Profile Image<div className="staff-profile-upload">{form.profile_image ? <AuthenticatedImage src={form.profile_image} className="staff-profile-preview" alt="Current staff profile" /> : <span className="staff-profile-placeholder">{(form.first_name || form.email || "?").slice(0, 1).toUpperCase()}</span>}<div><input type="file" accept="image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0] || null; setProfileImage(file); if (file) setForm((current) => ({ ...current, profile_image: URL.createObjectURL(file) })); }} /><small>Use a clear square JPG or PNG image.</small></div></div></label>
                <label>First Name<input required={!editingId} value={form.first_name || ""} onChange={(event) => updateField("first_name", event.target.value)} /></label>
                <label>Last Name<input required={!editingId} value={form.last_name || ""} onChange={(event) => updateField("last_name", event.target.value)} /></label>
                <label>Email<input required type="email" value={form.email || ""} onChange={(event) => updateField("email", event.target.value)} /></label>
                <label>Phone<input required type="tel" value={form.phone || ""} onChange={(event) => updateField("phone", event.target.value)} /></label>
                <label>Gender<select value={form.gender} onChange={(event) => updateField("gender", event.target.value)}><option value="">Nothing selected</option><option>Male</option><option>Female</option><option>Others</option></select></label>
                <label>Designation<select value={form.designation || ""} onChange={(event) => updateField("designation", event.target.value)}><option value="">Nothing selected</option><option>Customer Support Executive</option><option>Sales Executive</option><option>Sales Manager</option><option>Service Manager</option><option>Telecalling Executive</option></select></label>
                <label>Date of Joining<input required={!editingId} type="date" value={form.date_joined} onChange={(event) => updateField("date_joined", event.target.value)} /></label>
                <div className="staff-checks full-width"><label><input type="checkbox" checked={Boolean(form.is_administrator)} onChange={(event) => updateField("is_administrator", event.target.checked)} /> Administrator</label><label><input type="checkbox" checked={Boolean(form.send_welcome_email)} onChange={(event) => updateField("send_welcome_email", event.target.checked)} /> Send welcome email</label></div>
                        <label>Password<input required={!editingId} type="password" autoComplete="new-password" value={form.password || ""} onChange={(event) => updateField("password", event.target.value)} placeholder={editingId ? "Leave blank to keep current password" : ""} /></label>
                <button className="primary-button staff-save">{editingId ? "Update Staff Member" : "Save Staff Member"}</button>
              </div>
            ) : (
              <div className="permissions-panel">
                <label>Role<select value={form.role || "Employee"} onChange={(event) => updateField("role", event.target.value)}><option>Employee</option><option>Manager</option><option>Administrator</option></select></label>
                <h2>Permissions</h2>
                {["Dashboard", "Customers", "Leads", "Enquiries", "Finance", "Reports"].map((permission) => <label className="permission-row" key={permission}><span>{permission}</span><select value={form[`permission_${permission}`] || "View"} onChange={(event) => updateField(`permission_${permission}`, event.target.value)}><option>None</option><option>View</option><option>View and Create</option><option>Full Access</option></select></label>)}
                <button type="submit" className="primary-button staff-save">{editingId ? "Update Staff Member" : "Save Staff Member"}</button>
              </div>
            )}
          </form>
        )}
        <div className="staff-list-toolbar">
          <div className="staff-list-controls">
            <select aria-label="Rows per page" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select>
            <button className="toolbar-icon-button" onClick={exportStaff}>Export</button>
            <button className="toolbar-icon-button" onClick={loadStaff} aria-label="Refresh staff"><Icon name="refresh" /></button>
          </div>
          <label className="staff-search">Search<input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div>
        <div className="panel table-wrap">
          <table className="staff-table"><thead><tr><th>Full Name</th><th>Email</th><th>Phone Number</th><th>Designation</th><th>Role</th><th>Last Login</th><th>Active</th></tr></thead>
            <tbody>{records.length ? records.slice(0, pageSize).map((record) => <tr key={record.id}><td><div className="staff-name-cell">{record.profile_image ? <AuthenticatedImage src={record.profile_image} className="staff-avatar staff-photo" alt="" /> : <span className="staff-avatar">{(record.name || "?").slice(0, 1).toUpperCase()}</span>}<span>{record.name}</span></div><div className="staff-row-actions"><button onClick={() => openEdit(record)}>View</button><button onClick={() => deleteStaff(record)}>Delete</button></div></td><td>{record.email}</td><td>{record.phone || "—"}</td><td>{record.designation || "—"}</td><td>{record.is_administrator ? "Administrator" : "Employee"}</td><td>Never</td><td><button className={`active-toggle ${record.is_active ? "is-active" : ""}`} onClick={() => toggleStaff(record)} aria-label={`${record.is_active ? "Deactivate" : "Activate"} ${record.name}`}><span /></button></td></tr>) : <tr><td colSpan="7" className="empty-state">No staff members found.</td></tr>}</tbody>
          </table>
        </div>
        <div className="staff-table-footer">Showing 1 to {Math.min(records.length, pageSize)} of {records.length} entries <span>Previous&nbsp;&nbsp; <strong>1</strong> &nbsp;&nbsp;Next</span></div>
      </section>
    );
  }

  useEffect(() => {
    loadRecords();
  }, [module, search]);

  async function createRecord(event) {
    event.preventDefault();
    try {
      await api.post(config.endpoint, form);
      setForm({});
      setShowForm(false);
      setError("");
      loadRecords();
    } catch {
      setError("The record could not be created. Check the form values.");
    }
  }

  if (module === "staff") {
    return <StaffPage />;
  }
  if (module === "leads") {
    return <LeadPage />;
  }

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">CRM</p><h1>{config.title}</h1></div>
        <button className="primary-button" onClick={() => setShowForm(!showForm)}>{showForm ? "Close" : `Add ${singularLabel}`}</button>
      </div>
      {showForm && (
        <form className="panel record-form" onSubmit={createRecord}>
          {config.fields.map((field) => (
            <label key={field.name}>{field.label}
              <input required={field.name === "name" || field.name === "title"} type={field.type || "text"} value={form[field.name] || ""} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />
            </label>
          ))}
          <button className="primary-button">Save</button>
        </form>
      )}
      <div className="toolbar">
        <input placeholder={`Search ${config.title.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} />
        <button className="secondary-button" onClick={loadRecords}>Refresh</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="panel table-wrap">
        <table>
          <thead><tr>{config.columns.map((column) => <th key={column}>{column.replace("_", " ")}</th>)}</tr></thead>
          <tbody>
            {records.length === 0 ? <tr><td colSpan={config.columns.length} className="empty-state">No records found.</td></tr> : records.map((record) => (
              <tr key={record.id}>{config.columns.map((column) => <td key={column}>{record[column] ?? "—"}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Placeholder({ name }) {
  return (
    <section className="panel">
      <p className="eyebrow">Module</p>
      <h1>{name}</h1>
      <p>This module will be wired to the Django REST API in the next implementation milestone.</p>
    </section>
  );
}

function TopbarAccount({ onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  useEffect(() => { api.get("/auth/me/").then(({ data }) => setProfile(data)).catch(() => setProfile(null)); }, []);
  const imageUrl = profile?.profile_image ? (profile.profile_image.startsWith("http") ? profile.profile_image : `${API_ORIGIN}${profile.profile_image}`) : "";
  return <div className="topbar-account"><button className="user-chip" onClick={() => setOpen(!open)} aria-label="Account menu">{imageUrl ? <AuthenticatedImage src={imageUrl} alt="" className="topbar-avatar-image" /> : profile?.first_name?.slice(0, 1).toUpperCase() || "●"}</button>{open && <div className="account-menu"><button onClick={() => { navigate("/profile"); setOpen(false); }}>My Profile</button><button disabled={!profile?.staff_id} onClick={() => { if (profile?.staff_id) navigate(`/staff?edit=${profile.staff_id}`); setOpen(false); }}>Edit Profile</button><button onClick={() => { onLogout(); setOpen(false); }}>Logout</button></div>}</div>;
}

function Brand() {
  const [logo, setLogo] = useState(() => localStorage.getItem("crm_logo") || "");
  useEffect(() => {
    const updateLogo = () => setLogo(localStorage.getItem("crm_logo") || "");
    window.addEventListener("crm:logo-updated", updateLogo);
    return () => window.removeEventListener("crm:logo-updated", updateLogo);
  }, []);
  return <div className={`brand ${logo ? "brand-with-logo" : ""}`}>{logo ? <img src={logo} alt="Sajo CRM" /> : <>SAJO <span>CRM</span></>}</div>;
}

export default function App() {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(null);
  const authCheckVersion = useRef(0);
  const [openNavGroup, setOpenNavGroup] = useState(() => localStorage.getItem("open_nav_group") || "");

  useEffect(() => {
    const version = authCheckVersion.current;
    api.get("/auth/csrf/").then(() => api.get("/auth/me/")).then(() => {
      if (authCheckVersion.current === version) setAuthenticated(true);
    }).catch(() => {
      if (authCheckVersion.current === version) setAuthenticated(false);
    });
  }, []);

  useEffect(() => {
    function handleAuthLogout() {
      setAuthenticated(false);
    }

    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, []);

  useEffect(() => {
    const matchingGroup = navigation.find((item) => item.children?.some(([, path]) => location.pathname.startsWith(path.split("/").slice(0, 3).join("/"))));
    if (matchingGroup) {
      setOpenNavGroup(matchingGroup.label);
      localStorage.setItem("open_nav_group", matchingGroup.label);
    }
  }, [location.pathname]);

  if (authenticated === null) {
    return <main className="login-page" />;
  }
  if (!authenticated) {
    return <Login onLogin={() => { authCheckVersion.current += 1; setAuthenticated(true); }} />;
  }

  function toggleNavGroup(label) {
    const nextGroup = openNavGroup === label ? "" : label;
    setOpenNavGroup(nextGroup);
    if (nextGroup) {
      localStorage.setItem("open_nav_group", nextGroup);
    } else {
      localStorage.removeItem("open_nav_group");
    }
  }

  return (
    <div className={`app-shell ${location.pathname === "/" ? "dashboard-shell" : ""}`}>
      <aside className="sidebar">
        <Brand />
        <nav>
          {navigation.map((item) => item.children ? (
            <div className={`nav-group ${openNavGroup === item.label ? "is-open" : ""}`} key={item.label}>
              <button className="nav-group-toggle" type="button" onClick={() => toggleNavGroup(item.label)} aria-expanded={openNavGroup === item.label}>
                <span className="nav-label"><Icon name={moduleIcons[item.label] || "tools"} />{item.label}</span>
                <span className="nav-chevron" aria-hidden="true"><Icon name={openNavGroup === item.label ? "chevronDown" : "chevronRight"} /></span>
              </button>
              <div className="nav-group-items">
                {item.children.map(([label, path]) => <NavLink className={({ isActive }) => (isActive ? "nav-link sub-link active" : "nav-link sub-link")} to={path} key={path}><Icon name={moduleIcons[label] || moduleIcons[item.label] || "tools"} />{label}</NavLink>)}
              </div>
            </div>
          ) : <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to={item.path} key={item.label}><Icon name={moduleIcons[item.label] || "tools"} />{item.label}</NavLink>)}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <input aria-label="Global search" placeholder="Search CRM records..." />
          <TopbarAccount onLogout={async () => { await api.post("/auth/logout/"); setAuthenticated(false); }} />
        </header>
        <Routes>
          <Route path="/" element={<Dashboard onLogout={() => {
            api.post("/auth/logout/");
            setAuthenticated(false);
          }} />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/complaints/add" element={<ComplaintsPage />} />
          <Route path="/finance/quotations/add" element={<QuotationsPage />} />
          <Route path="/finance/proforma-invoices/add" element={<ProformaInvoicesPage />} />
          <Route path="/finance/proforma-invoices/recurring" element={<ProformaInvoicesPage recurring />} />
          <Route path="/finance/gst-invoices/add" element={<GSTInvoicesPage />} />
          <Route path="/finance/payments/add" element={<PaymentsPage />} />
          <Route path="/finance/payments/:id" element={<PaymentsPage />} />
          <Route path="/finance/advance-payments" element={<AdvancePaymentsPage />} />
          <Route path="/finance/credit-notes/add" element={<CreditNotesPage />} />
          <Route path="/finance/items" element={<ItemsPage />} />
          <Route path="/finance/expenses/add" element={<ExpensesPage />} />
          <Route path="/utilities/activity-log" element={<ActivityLogPage />} />
          <Route path="/utilities/goals" element={<GoalsPage />} />
          <Route path="/utilities/database-backup" element={<DatabaseBackupPage />} />
          <Route path="/reports/finance" element={<FinanceReportPage />} />
          <Route path="/reports/expenses-vs-income" element={<ExpensesVsIncomePage />} />
          <Route path="/reports/leads" element={<LeadsReportPage />} />
          <Route path="/reports/expenses" element={<ExpensesReportPage />} />
          <Route path="/reports/expenses/detailed" element={<ExpensesReportPage />} />
          <Route path="/setup/customer-groups" element={<SetupCrudPage module="customer-groups" />} />
          <Route path="/setup/designations" element={<SetupCrudPage module="designations" />} />
          <Route path="/setup/complaint-departments" element={<SetupCrudPage module="complaint-departments" />} />
          <Route path="/setup/predefined-replies" element={<SetupCrudPage module="predefined-replies" />} />
          <Route path="/setup/complaint-priorities" element={<SetupCrudPage module="complaint-priorities" />} />
          <Route path="/setup/job-activity-templates" element={<SetupCrudPage module="job-activity-templates" />} />
          <Route path="/setup/job-activity-checklists" element={<SetupCrudPage module="job-activity-checklists" />} />
          <Route path="/setup/lead-sources" element={<SetupCrudPage module="lead-sources" />} />
          <Route path="/setup/lead-statuses" element={<SetupCrudPage module="lead-statuses" />} />
          <Route path="/setup/lead-hotness-levels" element={<SetupCrudPage module="lead-hotness-levels" />} />
          <Route path="/setup/campaigns" element={<SetupCrudPage module="campaigns" />} />
          <Route path="/setup/email-integrations" element={<SetupCrudPage module="email-integrations" />} />
          <Route path="/setup/web-to-lead-forms" element={<SetupCrudPage module="web-to-lead-forms" />} />
          <Route path="/setup/lead-reasons" element={<SetupCrudPage module="lead-reasons" />} />
          <Route path="/setup/tax-rates" element={<SetupCrudPage module="tax-rates" />} />
          <Route path="/setup/currencies" element={<SetupCrudPage module="currencies" />} />
          <Route path="/setup/payment-modes" element={<SetupCrudPage module="payment-modes" />} />
          <Route path="/setup/expense-categories" element={<SetupCrudPage module="expense-categories" />} />
          <Route path="/setup/products" element={<SetupCrudPage module="products" />} />
          <Route path="/setup/units" element={<SetupCrudPage module="units" />} />
          <Route path="/setup/amc-types" element={<SetupCrudPage module="amc-types" />} />
          <Route path="/setup/email-templates" element={<SetupCrudPage module="email-templates" />} />
          <Route path="/setup/roles" element={<SetupCrudPage module="roles" />} />
          <Route path="/setup/main-menu" element={<SetupCrudPage module="main-menu" />} />
          <Route path="/setup/setup-menu" element={<SetupCrudPage module="setup-menu" />} />
          <Route path="/setup/theme-style" element={<SetupCrudPage module="theme-style" />} />
          <Route path="/setup/settings" element={<SettingsPage />} />
          <Route path="/setup/:option" element={<SetupCrudPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/profile" element={<ProfilePage onLogout={() => setAuthenticated(false)} />} />
          {navigation.flatMap((item) => item.children || [[item.label, item.path]]).map(([name, path]) => (
            name.toLowerCase() === "customers" ? <Route key={path} path={path} element={<CustomerPage />} /> :
            name.toLowerCase() === "referral partners" ? <Route key={path} path={path} element={<ReferralPartnersPage />} /> :
            name.toLowerCase() === "projects" ? <Route key={path} path={path} element={<ProjectsPage />} /> :
            name.toLowerCase() === "amc" ? <Route key={path} path={path} element={<AMCPage />} /> :
            name.toLowerCase() === "complaints" ? <Route key={path} path={path} element={<ComplaintsPage />} /> :
            name.toLowerCase() === "quotations" ? <Route key={path} path={path} element={<QuotationsPage />} /> :
            name.toLowerCase() === "proforma invoices" ? <Route key={path} path={path} element={<ProformaInvoicesPage />} /> :
            name.toLowerCase() === "gst invoices" ? <Route key={path} path={path} element={<GSTInvoicesPage />} /> :
            name.toLowerCase() === "payments" ? <Route key={path} path={path} element={<PaymentsPage />} /> :
            name.toLowerCase() === "advance payments" ? <Route key={path} path={path} element={<AdvancePaymentsPage />} /> :
            name.toLowerCase() === "credit notes" ? <Route key={path} path={path} element={<CreditNotesPage />} /> :
            name.toLowerCase() === "items" ? <Route key={path} path={path} element={<ItemsPage />} /> :
            name.toLowerCase() === "expenses" ? <Route key={path} path={path} element={<ExpensesPage />} /> :
            name.toLowerCase() === "activity log" ? <Route key={path} path={path} element={<ActivityLogPage />} /> :
            name.toLowerCase() === "goals" ? <Route key={path} path={path} element={<GoalsPage />} /> :
            name.toLowerCase() === "database backup" ? <Route key={path} path={path} element={<DatabaseBackupPage />} /> :
            name.toLowerCase() === "finance" && path === "/reports/finance" ? <Route key={path} path={path} element={<FinanceReportPage />} /> :
            name.toLowerCase() === "expenses vs income" ? <Route key={path} path={path} element={<ExpensesVsIncomePage />} /> :
            name.toLowerCase() === "leads" && path === "/reports/leads" ? <Route key={path} path={path} element={<LeadsReportPage />} /> :
            name.toLowerCase() === "expenses" && path === "/reports/expenses" ? <Route key={path} path={path} element={<ExpensesReportPage />} /> :
            name.toLowerCase() === "setup" ? <Route key={path} path={path} element={<SetupPage />} /> :
              name.toLowerCase() === "enquiries" ? <Route key={path} path={path} element={<EnquiryPage />} /> :
                name.toLowerCase() === "vendors" ? <Route key={path} path={path} element={<VendorPage />} /> :
                name.toLowerCase() === "purchase orders" ? <Route key={path} path={path} element={<PurchaseOrderPage />} /> :
                name.toLowerCase() === "purchase invoices" ? <Route key={path} path={path} element={<PurchaseInvoicePage />} /> :
                  name.toLowerCase() === "job activities" ? <Route key={path} path={path} element={<JobActivitiesPage />} /> :
                moduleConfig[name.toLowerCase()] ? <Route key={path} path={path} element={<CrmList module={name.toLowerCase()} />} /> : <Route key={path} path={path} element={<Placeholder name={name} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
