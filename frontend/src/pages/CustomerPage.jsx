import { useEffect, useState } from "react";
import api from "../api";
import Icon from "../components/Icon";

const CUSTOMER_GROUPS = [
  "College / University",
  "Hospital",
  "Hotel",
  "IT / Corporate",
  "School",
];

const BRANDS = ["HikVision", "Bosch", "Eufy"];

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters & Controls
  const [search, setSearch] = useState("");
  const [excludeInactive, setExcludeInactive] = useState(true);
  const [groupFilter, setGroupFilter] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [showBrandsSummary, setShowBrandsSummary] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkGroup, setBulkGroup] = useState("");
  const [isMassDelete, setIsMassDelete] = useState(false);

  // Customer detail / Contacts modal
  const [activeCustomerForContacts, setActiveCustomerForContacts] = useState(null);
  const [newContactForm, setNewContactForm] = useState({
    salutation: "Mr.",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    title: "",
    is_primary: false,
  });

  // Create Customer Form State
  const [createForm, setCreateForm] = useState({
    name: "",
    company: "",
    group: "",
    phone: "",
    email: "",
    website: "",
    gst_number: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    country: "India",
    zip_code: "",
    is_active: true,
    // Primary contact
    primary_salutation: "Mr.",
    primary_first_name: "",
    primary_last_name: "",
    primary_email: "",
    primary_phone: "",
    primary_title: "",
  });

  function loadData() {
    setLoading(true);
    setError("");

    // Build query params
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (groupFilter) params.set("group", groupFilter);
    if (excludeInactive) params.set("is_active", "true");

    const queryStr = params.toString() ? `?${params.toString()}` : "";

    Promise.all([
      api.get(`/customers/${queryStr}`),
      api.get("/customers/summary/"),
    ])
      .then(([custRes, summaryRes]) => {
        const rawList = custRes.data.results || custRes.data || [];
        setCustomers(Array.isArray(rawList) ? rawList : []);
        setSummary(summaryRes.data);
      })
      .catch((err) => {
        console.error("Failed to load customers:", err);
        setError("Unable to load customers from API. Please verify server connection.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [search, groupFilter, excludeInactive]);

  // Toggle active status
  async function handleToggleStatus(customer) {
    try {
      const { data } = await api.post(`/customers/${customer.id}/toggle_status/`);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, is_active: data.is_active } : c))
      );
      // Refresh summary numbers
      const summaryRes = await api.get("/customers/summary/");
      setSummary(summaryRes.data);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert("Failed to update status.");
    }
  }

  // Delete customer
  async function handleDelete(customer) {
    if (!window.confirm(`Are you sure you want to delete ${customer.name}?`)) return;
    try {
      await api.delete(`/customers/${customer.id}/`);
      loadData();
    } catch (err) {
      alert("Could not delete customer.");
    }
  }

  // Handle select all
  function handleSelectAll(e) {
    if (e.target.checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  }

  function handleSelectRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Create customer
  async function handleCreateSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/customers/", createForm);
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        company: "",
        group: "",
        phone: "",
        email: "",
        website: "",
        gst_number: "",
        address: "",
        city: "",
        state: "Tamil Nadu",
        country: "India",
        zip_code: "",
        is_active: true,
        primary_salutation: "Mr.",
        primary_first_name: "",
        primary_last_name: "",
        primary_email: "",
        primary_phone: "",
        primary_title: "",
      });
      loadData();
    } catch (err) {
      alert("Failed to save customer. Please check required fields.");
    }
  }

  // Add contact to active customer
  async function handleAddContact(e) {
    e.preventDefault();
    if (!activeCustomerForContacts) return;
    try {
      await api.post("/contacts/", {
        ...newContactForm,
        customer: activeCustomerForContacts.id,
      });
      // Refresh active customer data
      const { data: updatedCustomer } = await api.get(`/customers/${activeCustomerForContacts.id}/`);
      setActiveCustomerForContacts(updatedCustomer);
      setNewContactForm({
        salutation: "Mr.",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        title: "",
        is_primary: false,
      });
      loadData();
    } catch (err) {
      alert("Failed to add contact.");
    }
  }

  // Bulk actions submit
  async function handleBulkAction() {
    if (!selectedIds.length) {
      alert("No customers selected.");
      return;
    }
    if (isMassDelete) {
      if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} customers?`)) return;
      try {
        await Promise.all(selectedIds.map((id) => api.delete(`/customers/${id}/`)));
        setSelectedIds([]);
        setShowBulkModal(false);
        loadData();
      } catch (err) {
        alert("Bulk delete failed.");
      }
    } else if (bulkGroup) {
      try {
        await Promise.all(
          selectedIds.map((id) => api.patch(`/customers/${id}/`, { group: bulkGroup }))
        );
        setSelectedIds([]);
        setShowBulkModal(false);
        loadData();
      } catch (err) {
        alert("Bulk group update failed.");
      }
    }
  }

  // CSV Export
  function exportCSV() {
    if (!customers.length) return;
    const headers = ["ID", "Customer", "Phone", "Email", "Primary Contact", "Group", "Active", "Date Created"];
    const rows = customers.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.phone || ""}"`,
      `"${c.email || ""}"`,
      `"${c.primary_contact?.full_name || ""}"`,
      `"${c.group || ""}"`,
      c.is_active ? "Yes" : "No",
      `"${c.created_at || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <section className="customers-module">
      {/* Top Header Buttons */}
      <div className="crm-actions-bar">
        <div className="action-buttons-group">
          <button
            type="button"
            className="btn-customer-green"
            onClick={() => setShowCreateModal(true)}
          >
            NEW CUSTOMER
          </button>
          <button
            type="button"
            className="btn-customer-green"
            onClick={() => alert("CSV Import: Supported format (.csv) with columns: Name, Phone, Email, Group, Address.")}
          >
            IMPORT CUSTOMERS
          </button>
          <button
            type="button"
            className="btn-customer-green"
            onClick={() => {
              // Open contacts summary or clear filter
              setGroupFilter("");
              setSearch("");
            }}
          >
            CONTACTS
          </button>
          <button
            type="button"
            className="btn-icon-chart"
            title="Brands Summary"
            onClick={() => setShowBrandsSummary(!showBrandsSummary)}
          >
            <Icon name="chart" title="Brands Summary" />
          </button>
        </div>

        {/* Filter Dropdown */}
        <div className="filter-dropdown-wrap">
          <button
            type="button"
            className="btn-filter-toggle"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            title="Filter by"
          >
            <span className="filter-icon"><Icon name="filter" /></span> Filter by <Icon name="chevronDown" />
          </button>

          {showFilterMenu && (
            <div className="filter-dropdown-menu">
              <div
                className={`filter-item ${!groupFilter ? "active" : ""}`}
                onClick={() => {
                  setGroupFilter("");
                  setShowFilterMenu(false);
                }}
              >
                All Groups
              </div>
              <div className="filter-divider" />
              <div className="filter-heading">Filter by Group</div>
              {CUSTOMER_GROUPS.map((grp) => (
                <div
                  key={grp}
                  className={`filter-item ${groupFilter === grp ? "active" : ""}`}
                  onClick={() => {
                    setGroupFilter(grp);
                    setShowFilterMenu(false);
                  }}
                >
                  {grp}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customers Summary Row */}
      <div className="panel customer-summary-panel">
        <h4 className="summary-title">Customers Summary</h4>
        <div className="customer-summary-grid">
          <div className="summary-stat-box">
            <h3 className="summary-num text-dark">{summary?.total_customers ?? "—"}</h3>
            <span className="summary-label text-dark">Total Customers</span>
          </div>
          <div className="summary-stat-box">
            <h3 className="summary-num text-success">{summary?.active_customers ?? "—"}</h3>
            <span className="summary-label text-success">Active Customers</span>
          </div>
          <div className="summary-stat-box">
            <h3 className="summary-num text-danger">{summary?.inactive_customers ?? "—"}</h3>
            <span className="summary-label text-danger">Inactive Customers</span>
          </div>
          <div className="summary-stat-box">
            <h3 className="summary-num text-info">{summary?.active_contacts ?? "—"}</h3>
            <span className="summary-label text-info">Active Contacts</span>
          </div>
          <div className="summary-stat-box">
            <h3 className="summary-num text-danger">{summary?.inactive_contacts ?? "—"}</h3>
            <span className="summary-label text-danger">Inactive Contacts</span>
          </div>
        </div>
      </div>

      {/* Expandable Brands Summary */}
      {showBrandsSummary && (
        <div className="panel brands-summary-panel">
          <h4 className="summary-title">Brands Summary</h4>
          <div className="brands-summary-grid">
            {BRANDS.map((brand) => (
              <div className="summary-stat-box" key={brand}>
                <h3 className="summary-num text-dark">0</h3>
                <span className="summary-label text-dark">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table Panel */}
      <div className="panel customer-table-panel">
        {/* Checkbox Filter */}
        <div className="table-quick-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={excludeInactive}
              onChange={(e) => setExcludeInactive(e.target.checked)}
            />
            <span>Exclude Inactive Customers</span>
          </label>
        </div>

        {/* DataTables Controls Header */}
        <div className="table-controls-bar">
          <div className="table-controls-left">
            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="-1">All</option>
            </select>

            <div className="dt-buttons-group">
              <button type="button" className="btn-dt-action" onClick={exportCSV}>
                Export
              </button>
              <button
                type="button"
                className="btn-dt-action"
                onClick={() => {
                  if (!selectedIds.length) {
                    alert("Please select at least one customer row.");
                    return;
                  }
                  setShowBulkModal(true);
                }}
              >
                Bulk Actions {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
              <button type="button" className="btn-dt-action" title="Reload" onClick={loadData}>
                <Icon name="refresh" />
              </button>
            </div>
          </div>

          <div className="table-controls-right">
            <div className="search-input-group">
              <span className="search-icon"><Icon name="search" /></span>
              <input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        {/* Customers Table */}
        <div className="table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={{ width: "50px" }}>#</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Primary Contact</th>
                <th style={{ width: "90px" }}>Active</th>
                <th>Group</th>
                <th>Date Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    No matching customers found.
                  </td>
                </tr>
              ) : (
                customers.slice(0, pageSize === -1 ? customers.length : pageSize).map((customer) => (
                  <tr key={customer.id} className="customer-row">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => handleSelectRow(customer.id)}
                      />
                    </td>
                    <td>{customer.id}</td>
                    <td>
                      <strong className="customer-name-link">{customer.name}</strong>
                      <div className="row-options">
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => {
                            setActiveCustomerForContacts(customer);
                          }}
                        >
                          View
                        </button>{" "}
                        |{" "}
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => {
                            setActiveCustomerForContacts(customer);
                          }}
                        >
                          Contacts ({customer.contacts_count || 0})
                        </button>{" "}
                        |{" "}
                        <button
                          type="button"
                          className="link-button text-danger"
                          onClick={() => handleDelete(customer)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td>
                      {customer.phone ? (
                        <a href={`tel:${customer.phone}`} className="phone-link">
                          {customer.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {customer.email ? (
                        <a href={`mailto:${customer.email}`} className="email-link">
                          {customer.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {customer.primary_contact ? (
                        <div className="primary-contact-cell">
                          <strong className="contact-name">
                            {customer.primary_contact.full_name}
                          </strong>
                          <div className="contact-sublinks">
                            {customer.primary_contact.email && (
                              <small>
                                <a href={`mailto:${customer.primary_contact.email}`}>
                                  {customer.primary_contact.email}
                                </a>
                              </small>
                            )}
                            {customer.primary_contact.email && customer.primary_contact.phone && (
                              <small> | </small>
                            )}
                            {customer.primary_contact.phone && (
                              <small>
                                <a href={`tel:${customer.primary_contact.phone}`}>
                                  {customer.primary_contact.phone}
                                </a>
                              </small>
                            )}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {/* On/Off Toggle Switch */}
                      <label className="onoffswitch">
                        <input
                          type="checkbox"
                          checked={customer.is_active}
                          onChange={() => handleToggleStatus(customer)}
                        />
                        <span className="onoffswitch-slider" />
                      </label>
                    </td>
                    <td>
                      {customer.group ? (
                        <span className="customer-group-badge">{customer.group}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleString("en-GB", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="table-footer">
          <div className="table-info">
            Showing 1 to {Math.min(pageSize === -1 ? customers.length : pageSize, customers.length)} of{" "}
            {customers.length} entries
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-large">
            <div className="modal-header">
              <h2>New Customer</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <h3 className="section-title">Customer Information</h3>
                <div className="form-grid-2">
                  <label>
                    Customer / Company Name *
                    <input
                      required
                      placeholder="e.g. Messrs. Milestone Designs"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    />
                  </label>
                  <label>
                    Customer Group
                    <select
                      value={createForm.group}
                      onChange={(e) => setCreateForm({ ...createForm, group: e.target.value })}
                    >
                      <option value="">Select Group</option>
                      {CUSTOMER_GROUPS.map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Phone
                    <input
                      type="tel"
                      placeholder="e.g. 9632541212"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      placeholder="e.g. milestone@gmail.com"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    />
                  </label>
                  <label>
                    Website
                    <input
                      type="text"
                      placeholder="https://..."
                      value={createForm.website}
                      onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                    />
                  </label>
                  <label>
                    GST Number
                    <input
                      type="text"
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      value={createForm.gst_number}
                      onChange={(e) => setCreateForm({ ...createForm, gst_number: e.target.value })}
                    />
                  </label>
                </div>

                <div className="form-grid-2">
                  <label className="full-width">
                    Address
                    <textarea
                      rows="2"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    />
                  </label>
                  <label>
                    City
                    <input
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    />
                  </label>
                  <label>
                    State
                    <input
                      value={createForm.state}
                      onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    />
                  </label>
                  <label>
                    Country
                    <input
                      value={createForm.country}
                      onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                    />
                  </label>
                  <label>
                    Zip Code
                    <input
                      value={createForm.zip_code}
                      onChange={(e) => setCreateForm({ ...createForm, zip_code: e.target.value })}
                    />
                  </label>
                </div>

                <h3 className="section-title" style={{ marginTop: "20px" }}>
                  Primary Contact Details
                </h3>
                <div className="form-grid-3">
                  <label>
                    Salutation
                    <select
                      value={createForm.primary_salutation}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, primary_salutation: e.target.value })
                      }
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </label>
                  <label>
                    First Name
                    <input
                      placeholder="e.g. Arul Vignesh"
                      value={createForm.primary_first_name}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, primary_first_name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Last Name
                    <input
                      placeholder="e.g. R"
                      value={createForm.primary_last_name}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, primary_last_name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Contact Email
                    <input
                      type="email"
                      placeholder="e.g. arul@gmail.com"
                      value={createForm.primary_email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, primary_email: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Contact Phone
                    <input
                      type="tel"
                      placeholder="e.g. 9632147963"
                      value={createForm.primary_phone}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, primary_phone: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Designation / Title
                    <input
                      placeholder="e.g. IT Director"
                      value={createForm.primary_title}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, primary_title: e.target.value })
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Close
                </button>
                <button type="submit" className="btn-customer-green">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Contacts Modal */}
      {activeCustomerForContacts && (
        <div className="modal-overlay">
          <div className="modal-card modal-large">
            <div className="modal-header">
              <h2>Contacts — {activeCustomerForContacts.name}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setActiveCustomerForContacts(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <h4>Existing Contacts ({activeCustomerForContacts.contacts?.length || 0})</h4>
              <table className="customers-table" style={{ marginBottom: "20px" }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Title</th>
                    <th>Primary</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCustomerForContacts.contacts?.map((contact) => (
                    <tr key={contact.id}>
                      <td>
                        <strong>
                          {contact.salutation ? `${contact.salutation} ` : ""}
                          {contact.first_name} {contact.last_name}
                        </strong>
                      </td>
                      <td>{contact.email || "—"}</td>
                      <td>{contact.phone || "—"}</td>
                      <td>{contact.title || "—"}</td>
                      <td>{contact.is_primary ? "✓ Primary" : "—"}</td>
                    </tr>
                  ))}
                  {(!activeCustomerForContacts.contacts ||
                    activeCustomerForContacts.contacts.length === 0) && (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No contacts found for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <h4 style={{ marginTop: "16px" }}>Add New Contact</h4>
              <form onSubmit={handleAddContact} className="form-grid-3">
                <label>
                  Salutation
                  <select
                    value={newContactForm.salutation}
                    onChange={(e) =>
                      setNewContactForm({ ...newContactForm, salutation: e.target.value })
                    }
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </label>
                <label>
                  First Name *
                  <input
                    required
                    value={newContactForm.first_name}
                    onChange={(e) =>
                      setNewContactForm({ ...newContactForm, first_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Last Name
                  <input
                    value={newContactForm.last_name}
                    onChange={(e) =>
                      setNewContactForm({ ...newContactForm, last_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={newContactForm.email}
                    onChange={(e) =>
                      setNewContactForm({ ...newContactForm, email: e.target.value })
                    }
                  />
                </label>
                <label>
                  Phone
                  <input
                    type="tel"
                    value={newContactForm.phone}
                    onChange={(e) =>
                      setNewContactForm({ ...newContactForm, phone: e.target.value })
                    }
                  />
                </label>
                <label>
                  Title / Designation
                  <input
                    value={newContactForm.title}
                    onChange={(e) =>
                      setNewContactForm({ ...newContactForm, title: e.target.value })
                    }
                  />
                </label>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="checkbox"
                      checked={newContactForm.is_primary}
                      onChange={(e) =>
                        setNewContactForm({ ...newContactForm, is_primary: e.target.checked })
                      }
                    />
                    Mark as Primary Contact
                  </label>
                  <button type="submit" className="btn-customer-green" style={{ marginLeft: "auto" }}>
                    Add Contact
                  </button>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveCustomerForContacts(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Bulk Actions ({selectedIds.length} customers)</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowBulkModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "#dc2626", fontWeight: "700" }}>
                <input
                  type="checkbox"
                  checked={isMassDelete}
                  onChange={(e) => setIsMassDelete(e.target.checked)}
                />
                Mass Delete Selected Customers
              </label>

              {!isMassDelete && (
                <label>
                  Change Group
                  <select
                    value={bulkGroup}
                    onChange={(e) => setBulkGroup(e.target.value)}
                  >
                    <option value="">Select a Group</option>
                    {CUSTOMER_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowBulkModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-customer-green"
                onClick={handleBulkAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
