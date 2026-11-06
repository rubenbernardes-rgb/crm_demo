import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../api";
import type { ActivityType } from "../types";

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  contactId: string | null;
  dealId: string | null;
  onCreated: () => void;
}

const TYPES: { value: ActivityType; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
];

function nowLocalInput(): string {
  // datetime-local value in the user's timezone
  const d = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export function ActivityForm({ open, onClose, contactId, dealId, onCreated }: ActivityFormProps) {
  const [type, setType] = useState<ActivityType>("note");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocalInput());
  const [dueDate, setDueDate] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setType("note");
      setDescription("");
      setOccurredAt(nowLocalInput());
      setDueDate("");
      setDone(false);
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    if (!description.trim()) {
      setError("Please add a description.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.activities.create({
        type,
        contactId,
        dealId,
        description: description.trim(),
        occurredAt: new Date(occurredAt || Date.now()).toISOString(),
        dueDate: dueDate ? dueDate : null,
        done,
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the activity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Log activity"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save activity"}
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
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="activity-when">When</Label>
            <Input
              id="activity-when"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="activity-description">Description</Label>
          <Textarea
            id="activity-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened?"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="activity-due">Follow-up due date</Label>
            <Input
              id="activity-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">
              Optional — turns this into a task on the dashboard.
            </span>
          </div>
          <div className="flex items-end justify-end gap-2 pb-1.5">
            <Checkbox
              id="activity-done"
              checked={done}
              onCheckedChange={(v) => setDone(v === true)}
            />
            <Label htmlFor="activity-done">Already done</Label>
          </div>
        </div>
      </div>
    </Modal>
  );
}
