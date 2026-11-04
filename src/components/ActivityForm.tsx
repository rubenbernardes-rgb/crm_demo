import { useEffect, useState } from "react";
import { Modal } from "./Modal";
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
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save activity"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        {error && <div className="error-box">{error}</div>}
        <div className="form-row">
          <div className="field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>When</label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened?"
          />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Follow-up due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <span className="hint">Optional — turns this into a task on the dashboard.</span>
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label className="checkbox">
              <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
              Already done
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}
