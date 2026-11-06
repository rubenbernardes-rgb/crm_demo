import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { formatDate, money } from "../lib/format";
import { STAGES, type DealStage, type DealWithNames } from "../types";
import { stageStyle } from "../lib/ui";
import { Page, Loading, ErrorState } from "../components/Page";
import { cn } from "@/lib/utils";

export function Pipeline() {
  const { data, loading, error, reload } = useAsync(() => api.deals.list(), []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byStage = useMemo(() => {
    const map: Record<DealStage, DealWithNames[]> = {
      New: [],
      Qualified: [],
      Proposal: [],
      Negotiation: [],
      Won: [],
      Lost: [],
    };
    for (const d of data ?? []) map[d.stage].push(d);
    return map;
  }, [data]);

  const activeDeal = activeId ? (data ?? []).find((d) => d.id === activeId) ?? null : null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const over = e.over;
    if (!over) return;
    const targetStage = String(over.id) as DealStage;
    const draggedId = String(e.active.id);
    const deal = (data ?? []).find((d) => d.id === draggedId);
    if (!deal || deal.stage === targetStage) return;
    try {
      await api.deals.update(draggedId, { stage: targetStage });
      reload();
    } catch {
      /* ignore; a reload will resync */
    }
  };

  return (
    <Page title="Pipeline">
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid gap-3.5 items-stretch overflow-x-auto pb-2 [grid-auto-flow:column] [grid-auto-columns:minmax(252px,1fr)]">
            {STAGES.map((stage) => (
              <Column key={stage} stage={stage} deals={byStage[stage]} />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 180 }}>
            {activeDeal ? <DraggedCard deal={activeDeal} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </Page>
  );
}

function Column({ stage, deals }: { stage: DealStage; deals: DealWithNames[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const style = stageStyle(stage);
  const openTotal = deals.reduce((s, d) => s + (d.stage === "Won" || d.stage === "Lost" ? 0 : d.value), 0);

  return (
    <div className="flex min-h-[120px] flex-col rounded-lg border bg-muted/50" ref={setNodeRef}>
      <div className="flex items-center gap-2 border-b px-3 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: style.dot }} />
        <span className="text-[13px] font-semibold">{stage}</span>
        <span className="ml-auto rounded-full border bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {deals.length}
        </span>
      </div>
      <div className={cn("flex min-h-[80px] flex-1 flex-col gap-2 p-2.5", isOver && "bg-primary/5")}>
        {deals.map((d) => (
          <Card key={d.id} deal={d} />
        ))}
        {deals.length === 0 && (
          <div className="px-1.5 py-2.5 text-center text-xs text-muted-foreground">
            {stage === "Won" ? "No wins yet" : stage === "Lost" ? "Nothing lost" : "Empty"}
          </div>
        )}
        {openTotal > 0 && (stage !== "Won" && stage !== "Lost") && (
          <div className="mt-1.5 text-xs font-semibold text-muted-foreground">{money(openTotal)}</div>
        )}
      </div>
    </div>
  );
}

function Card({ deal }: { deal: DealWithNames }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  } as const;
  return (
    <div
      className={cn(
        "cursor-grab rounded-md border bg-card px-3 py-2.5 shadow-sm transition active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="mb-1.5 text-[13.5px] font-semibold">{deal.name}</div>
      <div className="mb-2 truncate text-xs text-muted-foreground">{deal.organizationName || "—"}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold tabular-nums">{money(deal.value)}</span>
        <span className="text-xs text-muted-foreground">{formatDate(deal.closeDate)}</span>
      </div>
    </div>
  );
}

function DraggedCard({ deal }: { deal: DealWithNames }) {
  return (
    <div className="cursor-grabbing rounded-md border bg-card px-3 py-2.5 shadow-lg transition">
      <div className="mb-1.5 text-[13.5px] font-semibold">{deal.name}</div>
      <div className="mb-2 truncate text-xs text-muted-foreground">{deal.organizationName || "—"}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold tabular-nums">{money(deal.value)}</span>
        <span className="text-xs text-muted-foreground">{formatDate(deal.closeDate)}</span>
      </div>
    </div>
  );
}
