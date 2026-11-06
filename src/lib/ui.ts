import type { BadgeVariant } from "@/components/ui/badge";
import type { ActivityType, ContactStatus, DealStage } from "../types";

export interface StageStyle {
  badge: BadgeVariant; // badge variant
  dot: string; // hex for the dot/swatch
}

const STAGE_STYLES: Record<DealStage, StageStyle> = {
  New: { badge: "blue", dot: "#209dd7" },
  Qualified: { badge: "purple", dot: "#753991" },
  Proposal: { badge: "amber", dot: "#ecad0a" },
  Negotiation: { badge: "slate", dot: "#525c6b" },
  Won: { badge: "green", dot: "#1f9d55" },
  Lost: { badge: "red", dot: "#d83a3a" },
};

export function stageStyle(stage: DealStage): StageStyle {
  return STAGE_STYLES[stage];
}

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
