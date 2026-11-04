import { useState } from "react";
import { Mail, Phone, StickyNote, Trash2, Check } from "lucide-react";
import type { ActivityType, ActivityWithRefs } from "../types";
import { ACTIVITY_STYLES } from "../lib/ui";
import { formatDateShort, formatDateTime, todayISO } from "../lib/format";
import { api } from "../api";

const ICONS: Record<ActivityType, typeof StickyNote> = {
  note: StickyNote,
  call: Phone,
  email: Mail,
};

function dueTone(due: string, done: boolean): "overdue" | "soon" | "normal" {
  if (done) return "normal";
  const today = todayISO();
  if (due < today) return "overdue";
  const diff = new Date(due).getTime() - new Date(today).getTime();
  if (diff <= 3 * 86400000) return "soon";
  return "normal";
}

interface TimelineProps {
  activities: ActivityWithRefs[];
  onChange: () => void;
}

export function ActivityTimeline({ activities, onChange }: TimelineProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (id: string) => {
    setBusy(id);
    try {
      await api.activities.toggle(id);
      onChange();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      await api.activities.remove(id);
      onChange();
    } finally {
      setBusy(null);
    }
  };

  if (activities.length === 0) {
    return (
      <div className="empty">
        <StickyNote />
        <div className="title">No activity yet</div>
        <div className="sub">Log a call, note or email to start a timeline.</div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {activities.map((a) => {
        const Icon = ICONS[a.type];
        const style = ACTIVITY_STYLES[a.type];
        return (
          <div className="timeline-item" key={a.id}>
            <div className={`timeline-dot ${style.dot}`}>
              <Icon size={15} />
            </div>
            <div className="timeline-body">
              <div className="timeline-top">
                <span className={`badge badge-${a.type === "call" ? "blue" : a.type === "email" ? "purple" : "slate"}`}>
                  {style.label}
                </span>
                <span className="timeline-meta">{formatDateTime(a.occurredAt)}</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                  {a.dueDate && (
                    <span className={`task-due ${dueTone(a.dueDate, a.done)}`}>
                      {a.done ? "Was due" : "Due"} {formatDateShort(a.dueDate)}
                    </span>
                  )}
                  {a.dueDate && (
                    <button
                      className="task-check"
                      onClick={() => toggle(a.id)}
                      aria-label={a.done ? "Mark not done" : "Mark done"}
                      style={busy === a.id ? { opacity: 0.5 } : undefined}
                    >
                      {a.done && <Check />}
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-icon task-delete"
                    onClick={() => remove(a.id)}
                    aria-label="Delete activity"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
              <div className="timeline-desc" style={a.done ? { color: "var(--muted)", textDecoration: "line-through" } : undefined}>
                {a.description}
              </div>
              {(a.contactName || a.dealName) && (
                <div className="timeline-meta" style={{ marginTop: 4 }}>
                  {a.contactName && <span>· {a.contactName}</span>}
                  {a.dealName && <span> · deal: {a.dealName}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
