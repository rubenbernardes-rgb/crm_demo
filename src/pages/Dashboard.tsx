import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Briefcase,
  Check,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAsync } from "../lib/useAsync";
import { useIsDark } from "../lib/useTheme";
import { money, moneyShort, monthLabel, relativeTime, formatDateShort } from "../lib/format";
import type { ActivityWithRefs } from "../types";
import { Page } from "../components/Page";

export function Dashboard() {
  const { data, loading, error, reload } = useAsync(() => api.dashboard(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const isDark = useIsDark();

  const toggle = async (id: string) => {
    setBusy(id);
    try {
      await api.activities.toggle(id);
      reload();
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Page title="Dashboard">{<div className="loading">Loading your dashboard…</div>}</Page>;
  if (error || !data) return <Page title="Dashboard">{<div className="error-box">{error}</div>}</Page>;

  const { summary, wonPerMonth, recentActivities, upcomingTasks, overdueTasks } = data;
  const wonChartData = wonPerMonth.map((m) => ({ label: monthLabel(m.month), count: m.count }));
  const revenueChartData = wonPerMonth.map((m) => ({ label: monthLabel(m.month), revenue: m.revenue }));

  return (
    <Page
      title="Dashboard"
      actions={
        <Link to="/pipeline" className="btn btn-primary">
          <Briefcase size={15} /> Open pipeline
        </Link>
      }
    >
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Open deals</div>
          <div className="value blue">{summary.openDeals}</div>
          <div className="delta">{money(summary.pipelineValue)} in pipeline</div>
        </div>
        <div className="stat">
          <div className="label">Won</div>
          <div className="value green">{summary.wonDeals}</div>
          <div className="delta">{money(summary.wonValue)} closed</div>
        </div>
        <div className="stat">
          <div className="label">Pipeline value</div>
          <div className="value amber">{moneyShort(summary.pipelineValue)}</div>
          <div className="delta">across {summary.openDeals} open deals</div>
        </div>
        <div className="stat">
          <div className="label">Lost</div>
          <div className="value red">{summary.lostDeals}</div>
          <div className="delta">closed as lost</div>
        </div>
        <div className="stat">
          <div className="label">Overdue tasks</div>
          <div className="value red">{summary.overdueCount}</div>
          <div className="delta">needs attention</div>
        </div>
      </div>

      <div className="chart-row">
        <div className="panel">
          <div className="panel-head">
            <h2>Deals won</h2>
            <span className="sub">per month</span>
          </div>
          <div className="chart-wrap" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wonChartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#2a2a2a" : "#e5e7eb"} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: isDark ? "#888888" : "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: isDark ? "#888888" : "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(95,135,135,0.12)" }}
                  formatter={(v: number) => [`${v} deal${v === 1 ? "" : "s"}`, "Won"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={42}>
                  {wonChartData.map((_, i) => (
                    <Cell key={i} fill="#5f8787" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h2>Revenue won</h2>
            <span className="sub">per month</span>
          </div>
          <div className="chart-wrap" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#2a2a2a" : "#e5e7eb"} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: isDark ? "#888888" : "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => moneyShort(v)}
                  tick={{ fontSize: 11, fill: isDark ? "#888888" : "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: "rgba(231,138,83,0.12)" }}
                  formatter={(v: number) => [money(v), "Revenue"]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={42}>
                  {revenueChartData.map((_, i) => (
                    <Cell key={i} fill="#e78a53" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="panel-head">
            <h2>Recent activity</h2>
            <span className="sub">across all records</span>
          </div>
          <div className="panel-pad">
            {recentActivities.length === 0 ? (
              <div className="empty">
                <Clock />
                <div className="title">No recent activity</div>
              </div>
            ) : (
              <div className="stack">
                {recentActivities.map((a) => (
                  <ActivityFeedRow key={a.id} a={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="panel-head">
              <h2>Overdue</h2>
              <span className="sub">{overdueTasks.length} task{overdueTasks.length === 1 ? "" : "s"}</span>
            </div>
            <div className="panel-pad">
              {overdueTasks.length === 0 ? (
                <div className="empty" style={{ padding: "28px 12px" }}>
                  <Check />
                  <div className="title">Nothing overdue</div>
                </div>
              ) : (
                <div>
                  {overdueTasks.map((t) => (
                    <TaskRow key={t.id} t={t} onToggle={toggle} busy={busy} overdue />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <h2>Upcoming</h2>
              <span className="sub">next follow-ups</span>
            </div>
            <div className="panel-pad">
              {upcomingTasks.length === 0 ? (
                <div className="empty" style={{ padding: "28px 12px" }}>
                  <TrendingUp />
                  <div className="title">No upcoming tasks</div>
                </div>
              ) : (
                <div>
                  {upcomingTasks.map((t) => (
                    <TaskRow key={t.id} t={t} onToggle={toggle} busy={busy} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

function ActivityFeedRow({ a }: { a: ActivityWithRefs }) {
  const icon =
    a.type === "call" ? <Briefcase size={15} /> : a.type === "email" ? <ArrowUpRight size={15} /> : <DollarSign size={15} />;
  const tone = a.type === "call" ? "blue" : a.type === "email" ? "purple" : "slate";
  return (
    <div className="row-gap" style={{ alignItems: "flex-start" }}>
      <div className={`timeline-dot ${a.type}`}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="row-gap" style={{ gap: 8 }}>
          <span className={`badge badge-${tone}`} style={{ textTransform: "capitalize" }}>
            {a.type}
          </span>
          <span className="timeline-meta">{relativeTime(a.occurredAt)}</span>
        </div>
        <div className="timeline-desc">{a.description}</div>
        <div className="timeline-meta">
          {a.contactId && (
            <Link to={`/contacts/${a.contactId}`} className="muted-link">
              {a.contactName}
            </Link>
          )}
          {a.dealId && <Link to={`/deals/${a.dealId}`} className="muted-link"> · {a.dealName}</Link>}
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  t,
  onToggle,
  busy,
  overdue,
}: {
  t: ActivityWithRefs;
  onToggle: (id: string) => void;
  busy: string | null;
  overdue?: boolean;
}) {
  return (
    <div className="task-row">
      <button
        className={`task-check ${t.done ? "checked" : ""}`}
        onClick={() => onToggle(t.id)}
        disabled={busy === t.id}
        aria-label={t.done ? "Mark not done" : "Mark done"}
      >
        {t.done && <Check />}
      </button>
      <div className="task-text" style={{ minWidth: 0 }}>
        <div className={t.done ? "task-text done" : ""} style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {t.description}
        </div>
        <div className="timeline-meta">
          {t.contactName && <span>{t.contactName} · </span>}
          {t.dealName && <span>{t.dealName}</span>}
        </div>
      </div>
      <span className={`task-due ${overdue ? "overdue" : "normal"}`}>Due {formatDateShort(t.dueDate)}</span>
    </div>
  );
}
