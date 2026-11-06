import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Mail, Phone, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatDate } from "../lib/format";
import { Page, Loading, ErrorState } from "../components/Page";
import { StatusBadge } from "../components/Badge";
import { ContactForm } from "../components/ContactForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ActivityForm } from "../components/ActivityForm";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <ErrorState message={error ?? "Contact not found"} />
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
          <Button variant="outline" onClick={() => setActOpen(true)}>
            <Plus size={15} /> Log activity
          </Button>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setConfirming(true)}>
            <Trash2 size={15} /> Delete
          </Button>
        </>
      }
    >
      <div className="grid items-start gap-4 min-[880px]:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b px-6 py-4">
            <CardTitle className="text-sm font-semibold">Details</CardTitle>
            <div className="ml-auto flex items-center gap-2">
              <StatusBadge status={contact.status} />
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2.5 text-sm">
              <dt className="font-medium text-muted-foreground">Email</dt>
              <dd className="m-0">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="font-medium text-primary hover:underline">
                    <Mail size={13} className="mr-1 inline align-middle" />
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
              <dt className="font-medium text-muted-foreground">Phone</dt>
              <dd className="m-0">
                {contact.phone ? (
                  <span>
                    <Phone size={13} className="mr-1 inline align-middle" />
                    {contact.phone}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
              <dt className="font-medium text-muted-foreground">Organization</dt>
              <dd className="m-0">
                {organization ? (
                  <Link to={`/organizations/${organization.id}`} className="font-medium text-primary hover:underline">
                    <Building2 size={13} className="mr-1 inline align-middle" />
                    {organization.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
              <dt className="font-medium text-muted-foreground">Added</dt>
              <dd className="m-0">{formatDate(contact.createdAt)}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b px-6 py-4">
            <CardTitle className="text-sm font-semibold">Activity</CardTitle>
            <span className="text-xs text-muted-foreground">{activities.length}</span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setActOpen(true)}>
                <Plus size={14} /> Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={activities} onChange={reload} />
          </CardContent>
        </Card>
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
