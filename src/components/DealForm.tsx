import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../api";
import type { Contact, Deal, DealStage, Organization } from "../types";
import { STAGES } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  organizations: Organization[];
  contacts: Contact[];
  initial?: Deal | null;
  defaultOrganizationId?: string | null;
}

export function DealForm({ open, onClose, onSaved, organizations, contacts, initial, defaultOrganizationId }: Props) {
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [contactId, setContactId] = useState<string>("");
  const [stage, setStage] = useState<DealStage>("New");
  const [value, setValue] = useState<string>("");
  const [closeDate, setCloseDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setOrganizationId(initial?.organizationId ?? defaultOrganizationId ?? "");
      setContactId(initial?.contactId ?? "");
      setStage(initial?.stage ?? "New");
      setValue(initial ? String(initial.value) : "");
      setCloseDate(initial?.closeDate ?? "");
      setError(null);
    }
  }, [open, initial, defaultOrganizationId]);

  const orgContacts = useMemo(
    () => (organizationId ? contacts.filter((c) => c.organizationId === organizationId) : contacts),
    [organizationId, contacts]
  );

  // If the selected contact isn't in the chosen org, clear it.
  useEffect(() => {
    if (contactId && organizationId && !orgContacts.some((c) => c.id === contactId)) {
      setContactId("");
    }
  }, [organizationId, contactId, orgContacts]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        organizationId: organizationId || null,
        contactId: contactId || null,
        stage,
        value: value ? Number(value) : 0,
        closeDate: closeDate || null,
      };
      if (initial) await api.deals.update(initial.id, payload);
      else await api.deals.create(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={initial ? "Edit deal" : "Add deal"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add deal"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="deal-name">Deal name *</Label>
          <Input
            id="deal-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enterprise license"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Organization</Label>
            <Select
              value={organizationId || "none"}
              onValueChange={(v) => setOrganizationId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="— None —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Primary contact</Label>
            <Select value={contactId || "none"} onValueChange={(v) => setContactId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="— None —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {orgContacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="deal-value">Value (USD)</Label>
            <Input
              id="deal-value"
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="deal-close-date">Close date</Label>
          <Input
            id="deal-close-date"
            type="date"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
