import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
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
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add deal"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Deal name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enterprise license" autoFocus />
        </div>
        <div className="form-row">
          <div className="field">
            <label>Organization</label>
            <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
              <option value="">— None —</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Primary contact</label>
            <select value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">— None —</option>
              {orgContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value as DealStage)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Value (USD)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="field">
          <label>Close date</label>
          <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
