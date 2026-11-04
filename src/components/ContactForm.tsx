import { useEffect, useState } from "react";
import { Modal } from "./Modal";
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
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Add contact"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        {error && <div className="error-box">{error}</div>}
        <div className="form-row">
          <div className="field">
            <label>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoFocus />
          </div>
          <div className="field">
            <label>Job title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VP Sales" />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" />
          </div>
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
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ContactStatus)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
