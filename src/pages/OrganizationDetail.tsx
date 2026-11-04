import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatDate, money } from "../lib/format";
import { Page, Loading } from "../components/Page";
import { StageBadge, StatusBadge } from "../components/Badge";
import { OrganizationForm } from "../components/OrganizationForm";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function OrganizationDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.organizations.get(id), [id]);
  const [formOpen, setFormOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (loading)
    return (
      <Page title="Organization" back={{ to: "/organizations", label: "Organizations" }}>
        <Loading />
      </Page>
    );
  if (error || !data)
    return (
      <Page title="Organization" back={{ to: "/organizations", label: "Organizations" }}>
        <div className="error-box">{error ?? "Organization not found"}</div>
      </Page>
    );

  const { org, contacts, deals } = data;

  const confirmDelete = async () => {
    await api.organizations.remove(org.id);
    setConfirming(false);
    navigate("/organizations");
  };

  return (
    <Page
      title={org.name}
      crumb={org.industry || undefined}
      back={{ to: "/organizations", label: "Organizations" }}
      actions={
        <>
          <button className="btn" onClick={() => setFormOpen(true)}>
            <Pencil size={15} /> Edit
          </button>
          <button className="btn btn-danger" onClick={() => setConfirming(true)}>
            <Trash2 size={15} /> Delete
          </button>
        </>
      }
    >
      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Overview</h2>
          </div>
          <div className="panel-pad">
            <dl className="kv">
              <dt>Website</dt>
              <dd>
                {org.website ? (
                  <a href={org.website} target="_blank" rel="noreferrer" className="link">
                    {org.website.replace(/^https?:\/\//, "")} <ExternalLink size={12} style={{ verticalAlign: "middle" }} />
                  </a>
                ) : (
                  <span className="muted">—</span>
                )}
              </dd>
              <dt>Industry</dt>
              <dd>{org.industry || <span className="muted">—</span>}</dd>
              <dt>Contacts</dt>
              <dd>{contacts.length}</dd>
              <dt>Open deals</dt>
              <dd>{deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost").length}</dd>
            </dl>
            {org.notes && (
              <>
                <div className="divider" />
                <div className="section-title">Notes</div>
                <p className="row-sub" style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>
                  {org.notes}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="panel-head">
              <h2>Contacts</h2>
              <span className="sub">{contacts.length}</span>
              <div className="right">
                <Link to="/contacts" className="btn btn-ghost btn-sm">
                  <Plus size={14} /> Add
                </Link>
              </div>
            </div>
            <div className="panel-pad">
              {contacts.length === 0 ? (
                <div className="muted">No contacts yet.</div>
              ) : (
                <div className="stack">
                  {contacts.map((c) => (
                    <Link key={c.id} to={`/contacts/${c.id}`} className="row-gap" style={{ alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row-title">{c.name}</div>
                        <div className="row-sub">
                          {c.title || "—"} · {c.email}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Deals</h2>
              <span className="sub">{deals.length}</span>
            </div>
            <div className="panel-pad">
              {deals.length === 0 ? (
                <div className="muted">No deals yet.</div>
              ) : (
                <div className="stack">
                  {deals.map((d) => (
                    <Link key={d.id} to={`/deals/${d.id}`} className="row-gap" style={{ alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row-title">{d.name}</div>
                        <div className="row-sub">
                          {d.contactName || "—"} · close {formatDate(d.closeDate)}
                        </div>
                      </div>
                      <StageBadge stage={d.stage} />
                      <div className="row-title" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {money(d.value)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <OrganizationForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={reload} initial={org} />
      <ConfirmDialog
        open={confirming}
        title="Delete organization"
        message={`Delete "${org.name}"? This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </Page>
  );
}
