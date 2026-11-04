import { useEffect, useState } from "react";
import { Modal } from "./Modal";
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
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add organization"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" autoFocus />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://acme.com" />
          </div>
          <div className="field">
            <label>Industry</label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Software" />
          </div>
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering…" />
        </div>
      </div>
    </Modal>
  );
}
