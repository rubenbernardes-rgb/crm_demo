import type { ActivityType, ContactStatus, DealStage } from "../types";

export interface StageStyle {
  badge: string; // badge class
  dot: string; // hex for the dot/swatch
}

const STAGE_STYLES: Record<DealStage, StageStyle> = {
  New: { badge: "badge-blue", dot: "#209dd7" },
  Qualified: { badge: "badge-purple", dot: "#753991" },
  Proposal: { badge: "badge-amber", dot: "#ecad0a" },
  Negotiation: { badge: "badge-slate", dot: "#525c6b" },
  Won: { badge: "badge-green", dot: "#1f9d55" },
  Lost: { badge: "badge-red", dot: "#d83a3a" },
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
