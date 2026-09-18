import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import AuthenticatedImage from "../components/AuthenticatedImage";

const API_ORIGIN = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000/api" : `${window.location.origin}/api`)).replace(/\/api\/?$/, "");

export default function ProfilePage({ onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/auth/me/").then(({ data }) => { setProfile(data); setForm({ first_name: data.first_name || "", last_name: data.last_name || "", email: data.email || "", password: "" }); }).catch(() => setError("Unable to load your profile."));
  }, []);
  async function save(event) {
    event.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const { data } = await api.patch("/auth/me/", payload);
      setProfile(data);
      setForm({ ...form, first_name: data.first_name || "", last_name: data.last_name || "", email: data.email || "", password: "" });
      setEditing(false);
      setMessage("Profile updated successfully.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.email?.[0] || "The profile could not be updated.");
    }
  }
  if (!profile) return <section className="profile-page"><p className="empty-state">Loading profile...</p></section>;
  const displayName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email;
  const imageUrl = profile.profile_image ? (profile.profile_image.startsWith("http") ? profile.profile_image : `${API_ORIGIN}${profile.profile_image}`) : "";
  return <section className="profile-page">
    <div className="profile-grid">
      <article className="panel profile-card"><div className="profile-card-header"><h1>Profile</h1><button className="profile-edit-icon" onClick={() => profile.staff_id && navigate(`/staff?edit=${profile.staff_id}`)} aria-label="Edit profile" disabled={!profile.staff_id}>✎</button></div>{editing ? <form className="profile-form" onSubmit={save}><div className="profile-image-edit">{imageUrl ? <AuthenticatedImage src={imageUrl} alt={`${displayName} profile`} className="profile-avatar profile-avatar-image" /> : <div className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</div>}<p>Use Edit Profile in the account menu to change your photo.</p></div><label>First Name<input value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} /></label><label>Last Name<input value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} /></label><label>Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>New Password<input type="password" placeholder="Leave blank to keep current password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><div className="profile-actions"><button type="button" className="secondary-button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button">Save</button></div></form> : <><div className="profile-avatar">{imageUrl ? <AuthenticatedImage src={imageUrl} alt={`${displayName} profile`} className="profile-avatar-image" /> : displayName.slice(0, 1).toUpperCase()}</div><a className="admin-profile-link">This is admin profile</a><h2>{displayName}</h2><p>✉ {profile.email}</p>{profile.phone && <p>▣ {profile.phone}</p>}<p>♟ {profile.gender || "Staff member"}</p>{profile.date_joined && <p>Date of Joining: {profile.date_joined}</p>}</>}</article>
      <article className="panel notifications-card"><h2>Notifications</h2><button className="notification-read">Mark all as read</button><div className="notification-empty">No new notifications.</div><button className="load-more-button">LOAD MORE</button></article>
    </div>
    {message && <p className="success-message">{message}</p>}{error && <p className="error-message">{error}</p>}
  </section>;
}
