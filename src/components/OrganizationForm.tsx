import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../api";
import type { Organization } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Organization | null;
}

export function OrganizationForm({ open, onClose, onSaved, initial }: Props) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setWebsite(initial?.website ?? "");
      setIndustry(initial?.industry ?? "");
      setNotes(initial?.notes ?? "");
      setError(null);
    }
  }, [open, initial]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), website: website.trim(), industry: industry.trim(), notes: notes.trim() };
      if (initial) await api.organizations.update(initial.id, payload);
      else await api.organizations.create(payload);
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
      title={initial ? "Edit organization" : "Add organization"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add organization"}
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
          <Label htmlFor="org-name">Name *</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Corp"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="org-website">Website</Label>
            <Input
              id="org-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://acme.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="org-industry">Industry</Label>
            <Input
              id="org-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Software"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="org-notes">Notes</Label>
          <Textarea
            id="org-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering…"
          />
        </div>
      </div>
    </Modal>
  );
}
