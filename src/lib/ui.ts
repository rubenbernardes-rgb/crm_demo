import type { BadgeVariant } from "@/components/ui/badge";
import type { ActivityType, ContactStatus, DealStage } from "../types";

export interface StageStyle {
  badge: BadgeVariant; // badge variant
  dot: string; // hex for the dot/swatch
}

// Darkmatter theme (tweakcn) — dark appearance. Dot colors use the theme's
// chart palette + destructive red; badge colors come from the brand palette
// in tailwind.config.ts.
const STAGE_STYLES: Record<DealStage, StageStyle> = {
  New: { badge: "blue", dot: "#5f8787" }, // Darkmatter chart-1 (teal)
  Qualified: { badge: "purple", dot: "#fbcb97" }, // Darkmatter chart-3 (peach)
  Proposal: { badge: "amber", dot: "#d87943" }, // Darkmatter light primary (deep orange)
  Negotiation: { badge: "slate", dot: "#999999" }, // Darkmatter chart-5
  Won: { badge: "green", dot: "#e78a53" }, // Darkmatter primary
  Lost: { badge: "red", dot: "#ef4444" }, // destructive — deliberately red so Lost reads as a failure
};

export function stageStyle(stage: DealStage): StageStyle {
  return STAGE_STYLES[stage];
}

// Contact statuses mirror the stage colors: lead=New, qualified=Qualified,
// customer=Won.
export const STATUS_STYLES: Record<ContactStatus, { badge: BadgeVariant; label: string }> = {
  lead: { badge: "blue", label: "Lead" },
  qualified: { badge: "purple", label: "Qualified" },
  customer: { badge: "green", label: "Customer" },
};

export interface ActivityTypeStyle {
  label: string;
  tone: BadgeVariant; // badge variant for the type pill
}

export const ACTIVITY_STYLES: Record<ActivityType, ActivityTypeStyle> = {
  note: { label: "Note", tone: "slate" },
  call: { label: "Call", tone: "blue" },
  email: { label: "Email", tone: "purple" },
};

export const STATUS_LABELS: Record<ContactStatus, string> = {
  lead: "Lead",
  qualified: "Qualified",
  customer: "Customer",
};
