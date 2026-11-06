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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <Button onClick={openAdd}>
          <Plus size={15} /> Add deal
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
            placeholder="Search deals by name, organization or contact…"
          />
        </div>
        <Select value={stage} onValueChange={(v) => setStage(v as StageFilter)}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by stage">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Deal</TableHead>
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Organization</TableHead>
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Contact</TableHead>
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Stage</TableHead>
                <TableHead className="bg-muted/50 px-4 text-right text-xs uppercase tracking-wide tabular-nums">
                  Value
                </TableHead>
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Close date</TableHead>
                <TableHead className="bg-muted/50 px-4 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((d) => (
                  <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/deals/${d.id}`)}>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium text-foreground">{d.name}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {d.organizationName || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {d.contactName || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StageBadge stage={d.stage} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">{money(d.value)}</TableCell>
                    <TableCell className="px-4 py-3">{formatDate(d.closeDate)}</TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(d);
                          setFormOpen(true);
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
                          setDeleting(d);
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
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center text-muted-foreground">
                      <Briefcase size={34} className="mb-1.5 text-muted-foreground/40" />
                      <div className="text-sm font-medium text-foreground">No deals found</div>
                      <div className="text-xs">
                        {q || stage !== "all" ? "Try clearing the filters." : "Add your first deal."}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

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
