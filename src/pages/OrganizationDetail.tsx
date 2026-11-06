import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatDate, money } from "../lib/format";
import { Page, Loading, ErrorState } from "../components/Page";
import { StageBadge, StatusBadge } from "../components/Badge";
import { OrganizationForm } from "../components/OrganizationForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
        <ErrorState message={error ?? "Organization not found"} />
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
          <CardHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4">
            <CardTitle className="text-sm font-semibold">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2.5 text-sm">
              <dt className="font-medium text-muted-foreground">Website</dt>
              <dd className="m-0">
                {org.website ? (
                  <a href={org.website} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                    {org.website.replace(/^https?:\/\//, "")} <ExternalLink size={12} className="inline align-middle" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
              <dt className="font-medium text-muted-foreground">Industry</dt>
              <dd className="m-0">{org.industry || <span className="text-muted-foreground">—</span>}</dd>
              <dt className="font-medium text-muted-foreground">Contacts</dt>
              <dd className="m-0">{contacts.length}</dd>
              <dt className="font-medium text-muted-foreground">Open deals</dt>
              <dd className="m-0">{deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost").length}</dd>
            </dl>
            {org.notes && (
              <>
                <Separator className="my-4" />
                <div className="mb-3 text-sm font-semibold">Notes</div>
                <p className="whitespace-pre-wrap text-xs text-muted-foreground">{org.notes}</p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b px-6 py-4">
              <CardTitle className="text-sm font-semibold">Contacts</CardTitle>
              <span className="text-xs text-muted-foreground">{contacts.length}</span>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/contacts">
                    <Plus size={14} /> Add
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-muted-foreground">No contacts yet.</div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {contacts.map((c) => (
                    <Link key={c.id} to={`/contacts/${c.id}`} className="flex flex-wrap items-center gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.title || "—"} · {c.email}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b px-6 py-4">
              <CardTitle className="text-sm font-semibold">Deals</CardTitle>
              <span className="text-xs text-muted-foreground">{deals.length}</span>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <div className="text-muted-foreground">No deals yet.</div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {deals.map((d) => (
                    <Link key={d.id} to={`/deals/${d.id}`} className="flex flex-wrap items-center gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground">{d.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.contactName || "—"} · close {formatDate(d.closeDate)}
                        </div>
                      </div>
                      <StageBadge stage={d.stage} />
                      <div className="font-medium tabular-nums text-foreground">{money(d.value)}</div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
