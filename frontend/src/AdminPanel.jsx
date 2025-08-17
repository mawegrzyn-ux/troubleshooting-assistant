// src/AdminPanel.jsx
import { useEffect, useState } from "react";
import "./AdminPanel.css"; // optional styling

function AdminPanel() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ system: "", vendor: "", problem: "", what_to_try_first: "", when_to_call_support: "" });
  const [editingId, setEditingId] = useState(null);

  // Fetch all entries
  useEffect(() => {
    fetch("/api/troubleshooting")
      .then(res => res.json())
      .then(data => setEntries(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      system: form.system,
      vendor: form.vendor,
      problem: form.problem,
      what_to_try_first: form.what_to_try_first.split("\n"),
      when_to_call_support: form.when_to_call_support
    };

    const url = editingId ? `/api/troubleshooting/${editingId}` : "/api/troubleshooting";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      window.location.reload();
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      system: entry.system,
      vendor: entry.vendor,
      problem: entry.problem,
      what_to_try_first: entry.what_to_try_first.join("\n"),
      when_to_call_support: entry.when_to_call_support
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    const res = await fetch(`/api/troubleshooting/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  return (
    <div className="admin-container">
      <h2>🛠️ Troubleshooting Admin Panel</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <input name="system" value={form.system} onChange={handleChange} placeholder="System" required />
        <input name="vendor" value={form.vendor} onChange={handleChange} placeholder="Vendor" required />
        <input name="problem" value={form.problem} onChange={handleChange} placeholder="Problem" required />
        <textarea name="what_to_try_first" value={form.what_to_try_first} onChange={handleChange} placeholder="Steps (one per line)" rows={5} required />
        <textarea name="when_to_call_support" value={form.when_to_call_support} onChange={handleChange} placeholder="When to call support" rows={2} required />
        <button type="submit">{editingId ? "Update" : "Add"} Entry</button>
      </form>

      <hr />

      <div className="entry-list">
        {entries.map(entry => (
          <div key={entry.id} className="entry-block">
            <strong>{entry.system} - {entry.problem}</strong>
            <p><em>{entry.vendor}</em></p>
            <ul>
              {entry.what_to_try_first.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            <p><strong>Support:</strong> {entry.when_to_call_support}</p>
            <button onClick={() => handleEdit(entry)}>Edit</button>
            <button onClick={() => handleDelete(entry.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
