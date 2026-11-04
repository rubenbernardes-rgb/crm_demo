import type { ContactStatus, DealStage } from "../types";
import { STATUS_STYLES, stageStyle } from "../lib/ui";

export function StageBadge({ stage }: { stage: DealStage }) {
  const s = stageStyle(stage);
  return <span className={`badge ${s.badge}`}>{stage}</span>;
}

export function StatusBadge({ status }: { status: ContactStatus }) {
  const s = STATUS_STYLES[status];
  return <span className={`badge ${s.badge}`}>{s.label}</span>;
}

export function Pill({ children, tone = "gray" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
