import { useState } from "react";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    title: "Customers",
    items: [["Groups", "/setup/customer-groups"]],
  },
  {
    title: "Staff",
    items: [["Designations", "/setup/designations"]],
  },
  {
    title: "Complaints",
    items: [["Departments", "/setup/complaint-departments"], ["Predefined Replies", "/setup/predefined-replies"], ["Complaint Priority", "/setup/complaint-priorities"], ["Job Activities", "/job-activities"]],
  },
  {
    title: "Job Activities",
    items: [["Templates", "/setup/job-activity-templates"], ["Checklists", "/setup/job-activity-checklists"]],
  },
  {
    title: "Leads",
    items: [["Sources", "/setup/lead-sources"], ["Statuses", "/setup/lead-statuses"], ["Heatness Level", "/setup/lead-hotness-levels"], ["Campaigns", "/setup/campaigns"], ["Email Integration", "/setup/email-integrations"], ["Web to Lead", "/setup/web-to-lead-forms"], ["Reasons", "/setup/lead-reasons"]],
  },
  {
    title: "Finance",
    items: [["Tax Rates", "/setup/tax-rates"], ["Currencies", "/setup/currencies"], ["Payment Modes", "/setup/payment-modes"], ["Expenses Categories", "/setup/expense-categories"]],
  },
  {
    title: "Items",
    items: [["Products", "/setup/products"], ["Units", "/setup/units"]],
  },
  {
    title: "AMC",
    items: [["AMC Types", "/setup/amc-types"]],
  },
  {
    title: "Administration",
    items: [["Email Templates", "/setup/email-templates"], ["Roles", "/setup/roles"], ["Main Menu", "/setup/main-menu"], ["Setup Menu", "/setup/setup-menu"], ["Theme Style", "/setup/theme-style"], ["Settings", "/setup/settings"]],
  },
];

export default function SetupPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState("Finance");
  return (
    <section className="setup-page">
      <div className="setup-heading">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1>Setup</h1>
          <p className="page-copy">Manage CRM options, defaults, and reusable lists.</p>
        </div>
      </div>
      <div className="setup-layout">
        <aside className="setup-menu-card">
          <div className="setup-menu-title">Setup</div>
          {sections.map((section) => (
            <div className={`setup-section ${open === section.title ? "is-open" : ""}`} key={section.title}>
              <button type="button" onClick={() => setOpen(open === section.title ? "" : section.title)}>
                <span>{section.title}</span><span>{open === section.title ? "▾" : "▸"}</span>
              </button>
              {open === section.title && <div className="setup-section-items">{section.items.map(([label, path]) => <button type="button" onClick={() => navigate(path)} key={label}>{label}</button>)}</div>}
            </div>
          ))}
        </aside>
        <div className="panel setup-welcome">
          <p className="eyebrow">Workspace configuration</p>
          <h2>Choose a setup option</h2>
          <p>Select a section from the Setup menu to manage CRM configuration. Finance settings are expanded to mirror the reference setup workflow.</p>
          <button className="primary-button" onClick={() => navigate("/setup/expense-categories")}>Open Expense Categories</button>
        </div>
      </div>
    </section>
  );
}
