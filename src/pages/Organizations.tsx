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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <Button onClick={openAdd}>
          <Plus size={15} /> Add organization
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-[420px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search organizations by name, website or industry…"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="m-4 rounded-md border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Organization</TableHead>
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Industry</TableHead>
                <TableHead className="bg-muted/50 px-4 text-right text-xs uppercase tracking-wide tabular-nums">
                  Contacts
                </TableHead>
                <TableHead className="bg-muted/50 px-4 text-right text-xs uppercase tracking-wide tabular-nums">
                  Deals
                </TableHead>
                <TableHead className="bg-muted/50 px-4 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/organizations/${o.id}`)}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="font-medium text-foreground">{o.name}</div>
                      <div className="text-xs text-muted-foreground">{o.website || "—"}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {o.industry || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">{o.contactCount}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">{o.dealCount}</TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(o);
                        }}
                        aria-label="Edit"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleting(o);
                        }}
                        aria-label="Delete"
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center text-muted-foreground">
                      <Building2 size={34} className="mb-1.5 text-muted-foreground/40" />
                      <div className="text-sm font-medium text-foreground">No organizations found</div>
                      <div className="text-xs">
                        {q ? "Try a different search." : "Add your first organization to get started."}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

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
