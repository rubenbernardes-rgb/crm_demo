import type { ActivityType, ContactStatus, DealStage } from "../types";

export interface StageStyle {
  badge: string; // badge class
  dot: string; // hex for the dot/swatch
}

// Darkmatter theme (tweakcn) — dark appearance. Dot colors use the theme's
// chart palette + destructive red; badge colors live in styles.css.
const STAGE_STYLES: Record<DealStage, StageStyle> = {
  New: { badge: "badge-blue", dot: "#5f8787" }, // Darkmatter chart-1 (teal)
  Qualified: { badge: "badge-purple", dot: "#fbcb97" }, // Darkmatter chart-3 (peach)
  Proposal: { badge: "badge-amber", dot: "#d87943" }, // Darkmatter light primary (deep orange)
  Negotiation: { badge: "badge-slate", dot: "#999999" }, // Darkmatter chart-5
  Won: { badge: "badge-green", dot: "#e78a53" }, // Darkmatter primary
  Lost: { badge: "badge-red", dot: "#ef4444" }, // destructive — deliberately red so Lost reads as a failure
};

export function stageStyle(stage: DealStage): StageStyle {
  return STAGE_STYLES[stage];
}

// Contact statuses mirror the stage colors: lead=New, qualified=Qualified,
// customer=Won.
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
