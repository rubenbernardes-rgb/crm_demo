import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building2, Pencil, Plus, Trash2, User } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatDate, money } from "../lib/format";
import { Page, Loading, ErrorState } from "../components/Page";
import { StageBadge } from "../components/Badge";
import { DealForm } from "../components/DealForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ActivityForm } from "../components/ActivityForm";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <ErrorState message={error ?? "Deal not found"} />
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
            <CardTitle className="text-sm font-semibold">Deal details</CardTitle>
            <div className="ml-auto flex items-center gap-2">
              <StageBadge stage={deal.stage} />
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2.5 text-sm">
              <dt className="font-medium text-muted-foreground">Value</dt>
              <dd className="m-0 text-[17px] font-medium tabular-nums">{money(deal.value)}</dd>
              <dt className="font-medium text-muted-foreground">Close date</dt>
              <dd className="m-0">{formatDate(deal.closeDate)}</dd>
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
              <dt className="font-medium text-muted-foreground">Primary contact</dt>
              <dd className="m-0">
                {contact ? (
                  <Link to={`/contacts/${contact.id}`} className="font-medium text-primary hover:underline">
                    <User size={13} className="mr-1 inline align-middle" />
                    {contact.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
              <dt className="font-medium text-muted-foreground">Added</dt>
              <dd className="m-0">{formatDate(deal.createdAt)}</dd>
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
