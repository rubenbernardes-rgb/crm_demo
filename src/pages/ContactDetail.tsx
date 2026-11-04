import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Mail, Phone, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatDate } from "../lib/format";
import { Page, Loading } from "../components/Page";
import { StatusBadge } from "../components/Badge";
import { ContactForm } from "../components/ContactForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ActivityForm } from "../components/ActivityForm";
import { ActivityTimeline } from "../components/ActivityTimeline";

export function ContactDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.contacts.get(id), [id]);
  const { data: orgs } = useAsync(() => api.organizations.list(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [actOpen, setActOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (loading)
    return (
      <Page title="Contact" back={{ to: "/contacts", label: "Contacts" }}>
        <Loading />
      </Page>
    );
  if (error || !data)
    return (
      <Page title="Contact" back={{ to: "/contacts", label: "Contacts" }}>
        <div className="error-box">{error ?? "Contact not found"}</div>
      </Page>
    );

  const { contact, organization, activities } = data;

  const confirmDelete = async () => {
    await api.contacts.remove(contact.id);
    setConfirming(false);
    navigate("/contacts");
  };

  return (
    <Page
      title={contact.name}
      crumb={contact.title || undefined}
      back={{ to: "/contacts", label: "Contacts" }}
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
            <h2>Details</h2>
            <div className="right">
              <StatusBadge status={contact.status} />
            </div>
          </div>
          <div className="panel-pad">
            <dl className="kv">
              <dt>Email</dt>
              <dd>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="link">
                    <Mail size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
                    {contact.email}
                  </a>
                ) : (
                  <span className="muted">—</span>
                )}
              </dd>
              <dt>Phone</dt>
              <dd>
                {contact.phone ? (
                  <span>
                    <Phone size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />
                    {contact.phone}
                  </span>
                ) : (
                  <span className="muted">—</span>
                )}
              </dd>
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
              <dt>Added</dt>
              <dd>{formatDate(contact.createdAt)}</dd>
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

      <ContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        organizations={orgs ?? []}
        initial={contact}
      />
      <ActivityForm
        open={actOpen}
        onClose={() => setActOpen(false)}
        contactId={contact.id}
        dealId={null}
        onCreated={reload}
      />
      <ConfirmDialog
        open={confirming}
        title="Delete contact"
        message={`Delete "${contact.name}"? This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </Page>
  );
}
