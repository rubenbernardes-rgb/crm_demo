import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { useDebounced } from "../lib/useDebounce";
import type { Contact, ContactStatus } from "../types";
import { Page, Loading } from "../components/Page";
import { ContactForm } from "../components/ContactForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Filter = ContactStatus | "all";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lead", label: "Leads" },
  { value: "qualified", label: "Qualified" },
  { value: "customer", label: "Customers" },
];

export function Contacts() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const debounced = useDebounced(q);
  const { data, loading, error, reload } = useAsync(() => api.contacts.list(debounced, status), [debounced, status]);
  const { data: orgs } = useAsync(() => api.organizations.list(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    await api.contacts.remove(deleting.id);
    setDeleting(null);
    reload();
  };

  return (
    <Page
      title="Contacts"
      actions={
        <Button onClick={openAdd}>
          <Plus size={15} /> Add contact
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
            placeholder="Search by name, email, phone or title…"
          />
        </div>
        <Tabs value={status} onValueChange={(v) => setStatus(v as Filter)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Contact</TableHead>
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Title</TableHead>
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Organization</TableHead>
                <TableHead className="bg-muted/50 px-4 text-xs uppercase tracking-wide">Status</TableHead>
                <TableHead className="bg-muted/50 px-4 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/contacts/${c.id}`)}>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email || "—"}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {c.title || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {c.organizationName || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(c);
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
                          setDeleting(c);
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
                      <Users size={34} className="mb-1.5 text-muted-foreground/40" />
                      <div className="text-sm font-medium text-foreground">No contacts found</div>
                      <div className="text-xs">
                        {q || status !== "all" ? "Try clearing the filters." : "Add your first contact."}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <ContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        organizations={orgs ?? []}
        initial={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete contact"
        message={`Delete "${deleting?.name}"? This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </Page>
  );
}
