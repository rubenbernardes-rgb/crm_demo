import { useState } from "react";
import { Mail, Phone, StickyNote, Trash2 } from "lucide-react";
import type { ActivityType, ActivityWithRefs } from "../types";
import { ACTIVITY_STYLES } from "../lib/ui";
import { formatDateShort, formatDateTime, todayISO } from "../lib/format";
import { api } from "../api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const ICONS: Record<ActivityType, typeof StickyNote> = {
  note: StickyNote,
  call: Phone,
  email: Mail,
};

const TONE_CLASSES: Record<ActivityType, string> = {
  note: "bg-muted text-muted-foreground",
  call: "bg-brand-blue/10 text-brand-blueInk",
  email: "bg-brand-purple/10 text-brand-purpleInk",
};

const DUE_VARIANTS = {
  overdue: "red",
  soon: "amber",
  normal: "secondary",
} as const;

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
      <div className="flex flex-col items-center justify-center gap-1.5 py-14 text-center text-muted-foreground">
        <StickyNote size={24} />
        <div className="text-sm font-medium">No activity yet</div>
        <div className="text-xs">Log a call, note or email to start a timeline.</div>
      </div>
    );
  }

  return (
    <div>
      {activities.map((a) => {
        const Icon = ICONS[a.type];
        const style = ACTIVITY_STYLES[a.type];
        return (
          <div className="group flex gap-3 border-b border-muted py-3.5 last:border-b-0" key={a.id}>
            <div
              className={cn(
                "grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md",
                TONE_CLASSES[a.type]
              )}
            >
              <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={style.tone}>{style.label}</Badge>
                <span className="text-xs text-muted-foreground">{formatDateTime(a.occurredAt)}</span>
                <div className="ml-auto flex items-center gap-2">
                  {a.dueDate && (
                    <Badge variant={DUE_VARIANTS[dueTone(a.dueDate, a.done)]}>
                      {a.done ? "Was due" : "Due"} {formatDateShort(a.dueDate)}
                    </Badge>
                  )}
                  {a.dueDate && (
                    <Checkbox
                      checked={a.done}
                      onCheckedChange={() => toggle(a.id)}
                      disabled={busy === a.id}
                      aria-label={a.done ? "Mark not done" : "Mark done"}
                      className={cn(busy === a.id && "opacity-50")}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(a.id)}
                    aria-label="Delete activity"
                    className={cn(
                      "h-8 w-8 text-muted-foreground hover:text-destructive",
                      "opacity-0 transition-opacity group-hover:opacity-100"
                    )}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div
                className={cn(
                  "mt-1 text-sm",
                  a.done && "text-muted-foreground line-through"
                )}
              >
                {a.description}
              </div>
              {(a.contactName || a.dealName) && (
                <div className="mt-1 text-xs text-muted-foreground">
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
