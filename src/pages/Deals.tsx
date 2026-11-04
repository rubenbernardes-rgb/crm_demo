import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, Briefcase } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { useDebounced } from "../lib/useDebounce";
import { formatDate, money } from "../lib/format";
import { STAGES, type Deal, type DealStage } from "../types";
import { Page, Loading } from "../components/Page";
import { StageBadge } from "../components/Badge";
import { DealForm } from "../components/DealForm";
import { ConfirmDialog } from "../components/ConfirmDialog";

type StageFilter = DealStage | "all";

export function Deals() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");
  const debounced = useDebounced(q);
  const { data, loading, error, reload } = useAsync(() => api.deals.list(debounced, stage), [debounced, stage]);
  const { data: orgs } = useAsync(() => api.organizations.list(), []);
  const { data: contacts } = useAsync(() => api.contacts.list(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [deleting, setDeleting] = useState<Deal | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    await api.deals.remove(deleting.id);
    setDeleting(null);
    reload();
  };

  return (
    <Page
      title="Deals"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add deal
        </button>
      }
    >
      <div className="toolbar">
        <div className="search">
          <Search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deals by name, organization or contact…" />
        </div>
        <select
          className="field"
          style={{ width: "auto", padding: "8px 11px" }}
          value={stage}
          onChange={(e) => setStage(e.target.value as StageFilter)}
          aria-label="Filter by stage"
        >
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
                  <th>Deal</th>
                  <th>Organization</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th className="num">Value</th>
                  <th>Close date</th>
                  <th className="cell-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((d) => (
                    <tr key={d.id} onClick={() => navigate(`/deals/${d.id}`)}>
                      <td>
                        <div className="row-title">{d.name}</div>
                      </td>
                      <td>{d.organizationName || <span className="muted">—</span>}</td>
                      <td>{d.contactName || <span className="muted">—</span>}</td>
                      <td>
                        <StageBadge stage={d.stage} />
                      </td>
                      <td className="num">{money(d.value)}</td>
                      <td>{formatDate(d.closeDate)}</td>
                      <td className="cell-actions">
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(d);
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
                            setDeleting(d);
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
                    <td colSpan={7}>
                      <div className="empty">
                        <Briefcase />
                        <div className="title">No deals found</div>
                        <div className="sub">{q || stage !== "all" ? "Try clearing the filters." : "Add your first deal."}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DealForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        organizations={orgs ?? []}
        contacts={contacts ?? []}
        initial={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete deal"
        message={`Delete "${deleting?.name}"? This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </Page>
  );
}
