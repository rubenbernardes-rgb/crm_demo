import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building2, Pencil, Plus, Trash2, User } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatDate, money } from "../lib/format";
import { Page, Loading } from "../components/Page";
import { StageBadge } from "../components/Badge";
import { DealForm } from "../components/DealForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ActivityForm } from "../components/ActivityForm";
import { ActivityTimeline } from "../components/ActivityTimeline";

export function DealDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.deals.get(id), [id]);
  const { data: orgs } = useAsync(() => api.organizations.list(), []);
  const { data: contacts } = useAsync(() => api.contacts.list(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [actOpen, setActOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (loading)
    return (
      <Page title="Deal" back={{ to: "/deals", label: "Deals" }}>
        <Loading />
      </Page>
    );
  if (error || !data)
    return (
      <Page title="Deal" back={{ to: "/deals", label: "Deals" }}>
        <div className="error-box">{error ?? "Deal not found"}</div>
      </Page>
    );

  const { deal, organization, contact, activities } = data;

  const confirmDelete = async () => {
    await api.deals.remove(deal.id);
    setConfirming(false);
    navigate("/deals");
  };

  return (
    <Page
      title={deal.name}
      crumb={organization?.name}
      back={{ to: "/deals", label: "Deals" }}
      actions={
        <>
          <button className="btn" onClick={() => setActOpen(true)}>
            <Plus size={15} /> Log activity
          </button>
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
            <h2>Deal details</h2>
            <div className="right">
              <StageBadge stage={deal.stage} />
            </div>
          </div>
          <div className="panel-pad">
            <dl className="kv">
              <dt>Value</dt>
              <dd className="row-title" style={{ fontSize: 17, fontVariantNumeric: "tabular-nums" }}>
                {money(deal.value)}
              </dd>
              <dt>Close date</dt>
              <dd>{formatDate(deal.closeDate)}</dd>
              <dt>Organization</dt>
              <dd>
                {organization ? (
                  <Link to={`/organizations/${organization.id}`} className="link">
                    <Building2 size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
                    {organization.name}
                  </Link>
                ) : (
                  <span className="muted">—</span>
                )}
              </dd>
              <dt>Primary contact</dt>
              <dd>
                {contact ? (
                  <Link to={`/contacts/${contact.id}`} className="link">
                    <User size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
                    {contact.name}
                  </Link>
                ) : (
                  <span className="muted">—</span>
                )}
              </dd>
              <dt>Added</dt>
              <dd>{formatDate(deal.createdAt)}</dd>
            </dl>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Activity</h2>
            <span className="sub">{activities.length}</span>
            <div className="right">
              <button className="btn btn-ghost btn-sm" onClick={() => setActOpen(true)}>
                <Plus size={14} /> Log
              </button>
            </div>
          </div>
          <div className="panel-pad">
            <ActivityTimeline activities={activities} onChange={reload} />
          </div>
        </div>
      </div>

      <DealForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        organizations={orgs ?? []}
        contacts={contacts ?? []}
        initial={deal}
      />
      <ActivityForm
        open={actOpen}
        onClose={() => setActOpen(false)}
        contactId={deal.contactId}
        dealId={deal.id}
        onCreated={reload}
      />
      <ConfirmDialog
        open={confirming}
        title="Delete deal"
        message={`Delete "${deal.name}"? This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </Page>
  );
}
