import type { ActivityType, ContactStatus, DealStage } from "../types";

export interface StageStyle {
  badge: string; // badge class
  dot: string; // hex for the dot/swatch
}

// Darkmatter theme palette. Won/Lost are legible green/red constants
// that read well on both the light and dark surfaces.
const STAGE_STYLES: Record<DealStage, StageStyle> = {
  New: { badge: "badge-blue", dot: "#5f8787" },
  Qualified: { badge: "badge-purple", dot: "#527575" },
  Proposal: { badge: "badge-amber", dot: "#e78a53" },
  Negotiation: { badge: "badge-slate", dot: "#888888" },
  Won: { badge: "badge-green", dot: "#1f9d55" },
  Lost: { badge: "badge-red", dot: "#ef4444" },
};

export function stageStyle(stage: DealStage): StageStyle {
  return STAGE_STYLES[stage];
}

export const STATUS_STYLES: Record<ContactStatus, { badge: string; label: string }> = {
  lead: { badge: "badge-blue", label: "Lead" },
  qualified: { badge: "badge-purple", label: "Qualified" },
  customer: { badge: "badge-green", label: "Customer" },
};

export interface ActivityTypeStyle {
  label: string;
  dot: string; // css class for the timeline dot
}

export const ACTIVITY_STYLES: Record<ActivityType, ActivityTypeStyle> = {
  note: { label: "Note", dot: "note" },
  call: { label: "Call", dot: "call" },
  email: { label: "Email", dot: "email" },
};

export const STATUS_LABELS: Record<ContactStatus, string> = {
  lead: "Lead",
  qualified: "Qualified",
  customer: "Customer",
};
