import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { useDebounced } from "../lib/useDebounce";
import type { OrganizationListItem } from "../types";
import { Page, Loading } from "../components/Page";
import { OrganizationForm } from "../components/OrganizationForm";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function Organizations() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const debounced = useDebounced(q);
  const { data, loading, error, reload } = useAsync(() => api.organizations.list(debounced), [debounced]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrganizationListItem | null>(null);
  const [deleting, setDeleting] = useState<OrganizationListItem | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (o: OrganizationListItem) => {
    setEditing(o);
    setFormOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    await api.organizations.remove(deleting.id);
    setDeleting(null);
    reload();
  };

  return (
    <Page
      title="Organizations"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add organization
        </button>
      }
    >
      <div className="toolbar">
        <div className="search">
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search organizations by name, website or industry…"
          />
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
                  <th>Organization</th>
                  <th>Industry</th>
                  <th className="num">Contacts</th>
                  <th className="num">Deals</th>
                  <th className="cell-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((o) => (
                    <tr key={o.id} onClick={() => navigate(`/organizations/${o.id}`)}>
                      <td>
                        <div className="row-title">{o.name}</div>
                        <div className="row-sub">{o.website || "—"}</div>
                      </td>
                      <td>{o.industry || <span className="muted">—</span>}</td>
                      <td className="num">{o.contactCount}</td>
                      <td className="num">{o.dealCount}</td>
                      <td className="cell-actions">
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(o);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(o);
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
                        <Building2 />
                        <div className="title">No organizations found</div>
                        <div className="sub">
                          {q ? "Try a different search." : "Add your first organization to get started."}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrganizationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        initial={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete organization"
        message={`Delete "${deleting?.name}"? Its contacts and deals will keep their data but lose this organization link. This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </Page>
  );
}
