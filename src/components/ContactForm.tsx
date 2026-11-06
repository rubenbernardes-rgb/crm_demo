import { useEffect, useState } from "react";
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
import type { Contact, ContactStatus, Organization } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  organizations: Organization[];
  initial?: Contact | null;
  defaultOrganizationId?: string | null;
}

const STATUSES: { value: ContactStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "customer", label: "Customer" },
];

export function ContactForm({ open, onClose, onSaved, organizations, initial, defaultOrganizationId }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [status, setStatus] = useState<ContactStatus>("lead");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setEmail(initial?.email ?? "");
      setPhone(initial?.phone ?? "");
      setTitle(initial?.title ?? "");
      setOrganizationId(initial?.organizationId ?? defaultOrganizationId ?? "");
      setStatus(initial?.status ?? "lead");
      setError(null);
    }
  }, [open, initial, defaultOrganizationId]);

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
        email: email.trim(),
        phone: phone.trim(),
        title: title.trim(),
        organizationId: organizationId || null,
        status,
      };
      if (initial) await api.contacts.update(initial.id, payload);
      else await api.contacts.create(payload);
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
      title={initial ? "Edit contact" : "Add contact"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add contact"}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-name">Name *</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-title">Job title</Label>
            <Input
              id="contact-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VP Sales"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@acme.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 0100"
            />
          </div>
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
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContactStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
