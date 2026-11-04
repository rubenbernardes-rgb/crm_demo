import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { useDebounced } from "../lib/useDebounce";
import type { Contact, ContactStatus } from "../types";
import { Page, Loading } from "../components/Page";
import { ContactForm } from "../components/ContactForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/Badge";

type Filter = ContactStatus | "all";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lead", label: "Leads" },
  { value: "qualified", label: "Qualified" },
  { value: "customer", label: "Customers" },
];

export function Contacts() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const debounced = useDebounced(q);
  const { data, loading, error, reload } = useAsync(() => api.contacts.list(debounced, status), [debounced, status]);
  const { data: orgs } = useAsync(() => api.organizations.list(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    await api.contacts.remove(deleting.id);
    setDeleting(null);
    reload();
  };

  return (
    <Page
      title="Contacts"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add contact
        </button>
      }
    >
      <div className="toolbar">
        <div className="search">
          <Search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, phone or title…" />
        </div>
        <div className="segmented">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={status === f.value ? "active" : ""}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="error-box" style={{ margin: 16 }}>
            {error}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Title</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th className="cell-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((c) => (
                    <tr key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}>
                      <td>
                        <div className="row-title">{c.name}</div>
                        <div className="row-sub">{c.email || "—"}</div>
                      </td>
                      <td>{c.title || <span className="muted">—</span>}</td>
                      <td>{c.organizationName || <span className="muted">—</span>}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="cell-actions">
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(c);
                            setFormOpen(true);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(c);
                          }}
                          aria-label="Delete"
                        >
                          <Trash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty">
                        <Users />
                        <div className="title">No contacts found</div>
                        <div className="sub">{q || status !== "all" ? "Try clearing the filters." : "Add your first contact."}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        organizations={orgs ?? []}
        initial={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete contact"
        message={`Delete "${deleting?.name}"? This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </Page>
  );
}
