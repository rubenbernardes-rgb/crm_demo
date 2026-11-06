import type { ReactNode } from "react";
import type { ContactStatus, DealStage } from "../types";
import { STATUS_STYLES, stageStyle } from "../lib/ui";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

export function StageBadge({ stage }: { stage: DealStage }) {
  const s = stageStyle(stage);
  return <Badge variant={s.badge}>{stage}</Badge>;
}

export function StatusBadge({ status }: { status: ContactStatus }) {
  const s = STATUS_STYLES[status];
  return <Badge variant={s.badge}>{s.label}</Badge>;
}

export function Pill({ children, tone = "secondary" }: { children: ReactNode; tone?: BadgeVariant }) {
  return <Badge variant={tone}>{children}</Badge>;
}
