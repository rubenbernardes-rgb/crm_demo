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
import { money, moneyShort, monthLabel, relativeTime, formatDateShort } from "../lib/format";
import type { ActivityType, ActivityWithRefs } from "../types";
import { Page, Loading, ErrorState } from "../components/Page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const FEED_TONE_CLASSES: Record<ActivityType, string> = {
  note: "bg-muted text-muted-foreground",
  call: "bg-brand-blue/10 text-brand-blueInk",
  email: "bg-brand-purple/10 text-brand-purpleInk",
};

export function Dashboard() {
  const { data, loading, error, reload } = useAsync(() => api.dashboard(), []);
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (id: string) => {
    setBusy(id);
    try {
      await api.activities.toggle(id);
      reload();
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Page title="Dashboard">{<Loading label="Loading your dashboard…" />}</Page>;
  if (error || !data) return <Page title="Dashboard">{<ErrorState message={error ?? ""} />}</Page>;

  const { summary, wonPerMonth, recentActivities, upcomingTasks, overdueTasks } = data;
  const wonChartData = wonPerMonth.map((m) => ({ label: monthLabel(m.month), count: m.count }));
  const revenueChartData = wonPerMonth.map((m) => ({ label: monthLabel(m.month), revenue: m.revenue }));

  return (
    <Page
      title="Dashboard"
      actions={
        <Button asChild>
          <Link to="/pipeline">
            <Briefcase size={15} /> Open pipeline
          </Link>
        </Button>
      }
    >
      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Open deals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1.5">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-brand-blueInk">
              {summary.openDeals}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{money(summary.pipelineValue)} in pipeline</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Won</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1.5">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-brand-greenInk">
              {summary.wonDeals}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{money(summary.wonValue)} closed</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pipeline value
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1.5">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-brand-amberInk">
              {moneyShort(summary.pipelineValue)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">across {summary.openDeals} open deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lost</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1.5">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-brand-redInk">
              {summary.lostDeals}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">closed as lost</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Overdue tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1.5">
            <div className="text-2xl font-bold tracking-tight tabular-nums text-brand-redInk">
              {summary.overdueCount}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">needs attention</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 min-[880px]:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4">
            <CardTitle className="text-sm font-semibold">Deals won</CardTitle>
            <span className="text-xs text-muted-foreground">per month</span>
          </CardHeader>
          <div className="px-4 pb-4" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wonChartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--chart-grid))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(231,138,83,0.07)" }}
                  formatter={(v: number) => [`${v} deal${v === 1 ? "" : "s"}`, "Won"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={42}>
                  {wonChartData.map((_, i) => (
                    <Cell key={i} fill="#e78a53" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4">
            <CardTitle className="text-sm font-semibold">Revenue won</CardTitle>
            <span className="text-xs text-muted-foreground">per month</span>
          </CardHeader>
          <div className="px-4 pb-4" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--chart-grid))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => moneyShort(v)}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  cursor={{ fill: "rgba(95,135,135,0.08)" }}
                  formatter={(v: number) => [money(v), "Revenue"]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={42}>
                  {revenueChartData.map((_, i) => (
                    <Cell key={i} fill="#5f8787" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid items-start gap-4 min-[880px]:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4">
            <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
            <span className="text-xs text-muted-foreground">across all records</span>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center text-muted-foreground">
                <Clock size={34} className="mb-1.5 text-muted-foreground/40" />
                <div className="text-sm font-medium text-foreground">No recent activity</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {recentActivities.map((a) => (
                  <ActivityFeedRow key={a.id} a={a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4">
              <CardTitle className="text-sm font-semibold">Overdue</CardTitle>
              <span className="text-xs text-muted-foreground">
                {overdueTasks.length} task{overdueTasks.length === 1 ? "" : "s"}
              </span>
            </CardHeader>
            <CardContent>
              {overdueTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 px-3 py-7 text-center text-muted-foreground">
                  <Check size={34} className="mb-1.5 text-muted-foreground/40" />
                  <div className="text-sm font-medium text-foreground">Nothing overdue</div>
                </div>
              ) : (
                <div>
                  {overdueTasks.map((t) => (
                    <TaskRow key={t.id} t={t} onToggle={toggle} busy={busy} overdue />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4">
              <CardTitle className="text-sm font-semibold">Upcoming</CardTitle>
              <span className="text-xs text-muted-foreground">next follow-ups</span>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 px-3 py-7 text-center text-muted-foreground">
                  <TrendingUp size={34} className="mb-1.5 text-muted-foreground/40" />
                  <div className="text-sm font-medium text-foreground">No upcoming tasks</div>
                </div>
              ) : (
                <div>
                  {upcomingTasks.map((t) => (
                    <TaskRow key={t.id} t={t} onToggle={toggle} busy={busy} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
    <div className="flex flex-wrap items-start gap-2.5">
      <div className={cn("grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md", FEED_TONE_CLASSES[a.type])}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={tone} className="capitalize">
            {a.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{relativeTime(a.occurredAt)}</span>
        </div>
        <div className="mt-1 text-sm">{a.description}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {a.contactId && (
            <Link to={`/contacts/${a.contactId}`} className="text-muted-foreground hover:text-foreground">
              {a.contactName}
            </Link>
          )}
          {a.dealId && (
            <Link to={`/deals/${a.dealId}`} className="text-muted-foreground hover:text-foreground">
              {" "}
              · {a.dealName}
            </Link>
          )}
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
    <div className="flex items-center gap-2.5 border-b border-muted py-3 last:border-b-0">
      <Checkbox
        checked={t.done}
        onCheckedChange={() => onToggle(t.id)}
        disabled={busy === t.id}
        aria-label={t.done ? "Mark not done" : "Mark done"}
      />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm", t.done && "text-muted-foreground line-through")}>{t.description}</div>
        <div className="text-xs text-muted-foreground">
          {t.contactName && <span>{t.contactName} · </span>}
          {t.dealName && <span>{t.dealName}</span>}
        </div>
      </div>
      <Badge variant={overdue ? "red" : "secondary"}>Due {formatDateShort(t.dueDate)}</Badge>
    </div>
  );
}
