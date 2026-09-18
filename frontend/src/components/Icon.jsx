const paths = {
  dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  users: <><path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" /><circle cx="9.5" cy="7" r="3" /><path d="M17 11a3 3 0 0 0 0-6" /><path d="M21 20v-1a4 4 0 0 0-3-3.87" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  leads: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></>,
  customers: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 11a3 3 0 1 0 0-6" /><path d="M18 14a5 5 0 0 1 3 6" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  shopping: <><path d="M3 5h2l2 11h11l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></>,
  finance: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  tools: <><path d="m14.7 6.3 3-3a4 4 0 0 1-5 5L5 16a2 2 0 1 0 3 3l7.7-7.7a4 4 0 0 1 5-5l-3 3" /></>,
  report: <><path d="M5 20V10M12 20V4M19 20v-7" /><path d="M3 20h18" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V20h-2v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.55-1H7v-2h.85A1.7 1.7 0 0 0 9.4 11a1.7 1.7 0 0 0-.34-1.88L9 9.06l1.42-1.42.06.06A1.7 1.7 0 0 0 12.36 8a1.7 1.7 0 0 0 1-1.55V6h2v.45a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 11a1.7 1.7 0 0 0 1.55 1H21v2h-.05a1.7 1.7 0 0 0-1.55 1Z" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  edit: <><path d="M4 20h4L19 9a2 2 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  save: <><path d="M5 4h12l2 2v14H5z" /><path d="M8 4v5h8V4M8 20v-6h8v6" /></>,
  download: <><path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>,
  chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></>,
  filter: <><path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14-5L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14 5l2-2" /><path d="M20 20v-4h-4" /></>,
  close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  tag: <><path d="M3 5v6l10 10 8-8L11 3H5a2 2 0 0 0-2 2Z" /><circle cx="7" cy="7" r="1" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
};

export default function Icon({ name, size = 16, strokeWidth = 1.8, title, className = "" }) {
  return <svg className={`ui-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}><title>{title}</title>{paths[name]}</svg>;
}
