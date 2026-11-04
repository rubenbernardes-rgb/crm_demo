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
import { Page, Loading } from "../components/Page";

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
        <div className="error-box">{error}</div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="pipeline">
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
    <div className={`column ${isOver ? "" : ""}`} ref={setNodeRef}>
      <div className="column-head">
        <span className="dot" style={{ background: style.dot }} />
        <span className="name">{stage}</span>
        <span className="count">{deals.length}</span>
      </div>
      <div className={`column-body ${isOver ? "drag-over" : ""}`}>
        {deals.map((d) => (
          <Card key={d.id} deal={d} />
        ))}
        {deals.length === 0 && (
          <div className="muted" style={{ fontSize: 12, padding: "10px 6px", textAlign: "center" }}>
            {stage === "Won" ? "No wins yet" : stage === "Lost" ? "Nothing lost" : "Empty"}
          </div>
        )}
        {openTotal > 0 && (stage !== "Won" && stage !== "Lost") && (
          <div className="dc-date" style={{ marginTop: 6, fontWeight: 600 }}>
            {money(openTotal)}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ deal }: { deal: DealWithNames }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  } as const;
  return (
    <div className="deal-card" ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="dc-name">{deal.name}</div>
      <div className="dc-org">{deal.organizationName || "—"}</div>
      <div className="dc-foot">
        <span className="dc-value">{money(deal.value)}</span>
        <span className="dc-date">{formatDate(deal.closeDate)}</span>
      </div>
    </div>
  );
}

function DraggedCard({ deal }: { deal: DealWithNames }) {
  return (
    <div className="deal-card" style={{ boxShadow: "var(--shadow-lg)", cursor: "grabbing" }}>
      <div className="dc-name">{deal.name}</div>
      <div className="dc-org">{deal.organizationName || "—"}</div>
      <div className="dc-foot">
        <span className="dc-value">{money(deal.value)}</span>
        <span className="dc-date">{formatDate(deal.closeDate)}</span>
      </div>
    </div>
  );
}
