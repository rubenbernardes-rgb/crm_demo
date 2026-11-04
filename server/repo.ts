import type { DB } from "./db";
import {
  type Activity,
  type ActivityType,
  type ActivityWithRefs,
  type Contact,
  type ContactStatus,
  type ContactWithOrg,
  type DashboardData,
  type Deal,
  type DealStage,
  type DealWithNames,
  type Organization,
} from "../src/types";

type Row = Record<string, unknown>;

function toBool(n: unknown): boolean {
  return Number(n) === 1;
}
function toDollars(cents: unknown): number {
  // value_cents is stored as an exact integer; dividing by 100 keeps the
  // two-decimal dollar value (display formatting rounds for the UI).
  return Number(cents) / 100;
}

function mapOrganization(r: Row): Organization {
  return {
    id: String(r.id),
    name: String(r.name),
    website: String(r.website ?? ""),
    industry: String(r.industry ?? ""),
    notes: String(r.notes ?? ""),
    createdAt: String(r.created_at),
  };
}

function mapContact(r: Row): Contact {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    title: String(r.title ?? ""),
    organizationId: r.organization_id == null ? null : String(r.organization_id),
    status: String(r.status) as ContactStatus,
    createdAt: String(r.created_at),
  };
}

function mapContactWithOrg(r: Row): ContactWithOrg {
  return {
    ...mapContact(r),
    organizationName: r.organization_name == null ? null : String(r.organization_name),
  };
}

function mapDeal(r: Row): Deal {
  return {
    id: String(r.id),
    name: String(r.name),
    organizationId: r.organization_id == null ? null : String(r.organization_id),
    contactId: r.contact_id == null ? null : String(r.contact_id),
    stage: String(r.stage) as DealStage,
    value: toDollars(r.value_cents),
    closeDate: r.close_date == null ? null : String(r.close_date),
    createdAt: String(r.created_at),
  };
}

function mapDealWithNames(r: Row): DealWithNames {
  return {
    ...mapDeal(r),
    organizationName: r.organization_name == null ? null : String(r.organization_name),
    contactName: r.contact_name == null ? null : String(r.contact_name),
  };
}

function mapActivity(r: Row): Activity {
  return {
    id: String(r.id),
    type: String(r.type) as ActivityType,
    contactId: r.contact_id == null ? null : String(r.contact_id),
    dealId: r.deal_id == null ? null : String(r.deal_id),
    description: String(r.description ?? ""),
    occurredAt: String(r.occurred_at),
    dueDate: r.due_date == null ? null : String(r.due_date),
    done: toBool(r.done),
    createdAt: String(r.created_at),
  };
}

function mapActivityWithRefs(r: Row): ActivityWithRefs {
  return {
    ...mapActivity(r),
    contactName: r.contact_name == null ? null : String(r.contact_name),
    dealName: r.deal_name == null ? null : String(r.deal_name),
    organizationName: r.organization_name == null ? null : String(r.organization_name),
  };
}

// --- Inputs -----------------------------------------------------------------

export interface OrganizationInput {
  name: string;
  website: string;
  industry: string;
  notes: string;
}
export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  title: string;
  organizationId: string | null;
  status: ContactStatus;
}
export interface DealInput {
  name: string;
  organizationId: string | null;
  contactId: string | null;
  stage: DealStage;
  value: number;
  closeDate: string | null;
}
export interface ActivityInput {
  type: ActivityType;
  contactId: string | null;
  dealId: string | null;
  description: string;
  occurredAt: string;
  dueDate: string | null;
  done: boolean;
}

export interface OrganizationList extends Organization {
  contactCount: number;
  dealCount: number;
}

const VALID_STAGES: DealStage[] = [
  "New",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];
const VALID_STATUSES: ContactStatus[] = ["lead", "qualified", "customer"];
const VALID_ACTIVITY_TYPES: ActivityType[] = ["note", "call", "email"];

function assertStage(stage: unknown): asserts stage is DealStage {
  if (!VALID_STAGES.includes(stage as DealStage)) {
    throw new Error(`Invalid stage: ${stage}`);
  }
}
function assertStatus(status: unknown): asserts status is ContactStatus {
  if (!VALID_STATUSES.includes(status as ContactStatus)) {
    throw new Error(`Invalid status: ${status}`);
  }
}
function assertActivityType(type: unknown): asserts type is ActivityType {
  if (!VALID_ACTIVITY_TYPES.includes(type as ActivityType)) {
    throw new Error(`Invalid activity type: ${type}`);
  }
}

function uuid(): string {
  return crypto.randomUUID();
}

export class Repo {
  constructor(private db: DB) {}

  // --- Organizations -------------------------------------------------------
  listOrganizations(q?: string): OrganizationList[] {
    let sql = `
      SELECT o.*, COUNT(DISTINCT c.id) AS contact_count, COUNT(DISTINCT d.id) AS deal_count
      FROM organizations o
      LEFT JOIN contacts c ON c.organization_id = o.id
      LEFT JOIN deals d ON d.organization_id = o.id
    `;
    const params: Record<string, unknown> = {};
    if (q && q.trim()) {
      sql += " WHERE o.name LIKE @q OR o.website LIKE @q OR o.industry LIKE @q OR o.notes LIKE @q";
      params.q = `%${q.trim()}%`;
    }
    sql += " GROUP BY o.id ORDER BY o.name COLLATE NOCASE ASC";
    return (this.db.prepare(sql).all(params) as Row[]).map((r) => ({
      ...mapOrganization(r),
      contactCount: Number(r.contact_count),
      dealCount: Number(r.deal_count),
    }));
  }

  getOrganization(id: string): Organization | undefined {
    const r = this.db.prepare("SELECT * FROM organizations WHERE id = ?").get(id) as Row | undefined;
    return r ? mapOrganization(r) : undefined;
  }

  createOrganization(input: OrganizationInput): Organization {
    const id = uuid();
    this.db
      .prepare(
        "INSERT INTO organizations (id, name, website, industry, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(id, input.name, input.website ?? "", input.industry ?? "", input.notes ?? "", new Date().toISOString());
    return this.getOrganization(id)!;
  }

  updateOrganization(id: string, input: Partial<OrganizationInput>): Organization | undefined {
    const existing = this.getOrganization(id);
    if (!existing) return undefined;
    const next: OrganizationInput = {
      name: input.name ?? existing.name,
      website: input.website ?? existing.website,
      industry: input.industry ?? existing.industry,
      notes: input.notes ?? existing.notes,
    };
    this.db
      .prepare("UPDATE organizations SET name = ?, website = ?, industry = ?, notes = ? WHERE id = ?")
      .run(next.name, next.website, next.industry, next.notes, id);
    return this.getOrganization(id);
  }

  deleteOrganization(id: string): boolean {
    return this.db.prepare("DELETE FROM organizations WHERE id = ?").run(id).changes > 0;
  }

  getOrganizationDetail(id: string): { org: Organization; contacts: ContactWithOrg[]; deals: DealWithNames[] } | undefined {
    const org = this.getOrganization(id);
    if (!org) return undefined;
    const contacts = (this.db.prepare(
      "SELECT * FROM contacts WHERE organization_id = ? ORDER BY name COLLATE NOCASE ASC"
    ).all(id) as Row[]).map(mapContactWithOrg);
    const deals = (this.db.prepare(
      `SELECT d.*, o.name AS organization_name, c.name AS contact_name
       FROM deals d
       LEFT JOIN organizations o ON o.id = d.organization_id
       LEFT JOIN contacts c ON c.id = d.contact_id
       WHERE d.organization_id = ?
       ORDER BY d.close_date IS NULL, d.close_date ASC`
    ).all(id) as Row[]).map(mapDealWithNames);
    return { org, contacts, deals };
  }

  // --- Contacts ------------------------------------------------------------
  listContacts(q?: string, status?: ContactStatus | "all"): ContactWithOrg[] {
    let sql = `
      SELECT c.*, o.name AS organization_name
      FROM contacts c
      LEFT JOIN organizations o ON o.id = c.organization_id
      WHERE 1=1
    `;
    const params: Record<string, unknown> = {};
    if (status && status !== "all") {
      sql += " AND c.status = @status";
      params.status = status;
    }
    if (q && q.trim()) {
      sql += " AND (c.name LIKE @q OR c.email LIKE @q OR c.phone LIKE @q OR c.title LIKE @q)";
      params.q = `%${q.trim()}%`;
    }
    sql += " ORDER BY c.name COLLATE NOCASE ASC";
    return (this.db.prepare(sql).all(params) as Row[]).map(mapContactWithOrg);
  }

  getContact(id: string): Contact | undefined {
    const r = this.db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Row | undefined;
    return r ? mapContact(r) : undefined;
  }

  createContact(input: ContactInput): Contact {
    assertStatus(input.status);
    const id = uuid();
    this.db
      .prepare(
        "INSERT INTO contacts (id, name, email, phone, title, organization_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(id, input.name, input.email ?? "", input.phone ?? "", input.title ?? "", input.organizationId ?? null, input.status, new Date().toISOString());
    return this.getContact(id)!;
  }

  updateContact(id: string, input: Partial<ContactInput>): Contact | undefined {
    const existing = this.getContact(id);
    if (!existing) return undefined;
    const next: ContactInput = {
      name: input.name ?? existing.name,
      email: input.email ?? existing.email,
      phone: input.phone ?? existing.phone,
      title: input.title ?? existing.title,
      organizationId: input.organizationId ?? existing.organizationId,
      status: input.status ?? existing.status,
    };
    assertStatus(next.status);
    this.db
      .prepare("UPDATE contacts SET name = ?, email = ?, phone = ?, title = ?, organization_id = ?, status = ? WHERE id = ?")
      .run(next.name, next.email, next.phone, next.title, next.organizationId, next.status, id);
    return this.getContact(id);
  }

  deleteContact(id: string): boolean {
    return this.db.prepare("DELETE FROM contacts WHERE id = ?").run(id).changes > 0;
  }

  // --- Deals ---------------------------------------------------------------
  listDeals(q?: string, stage?: DealStage | "all"): DealWithNames[] {
    let sql = `
      SELECT d.*, o.name AS organization_name, c.name AS contact_name
      FROM deals d
      LEFT JOIN organizations o ON o.id = d.organization_id
      LEFT JOIN contacts c ON c.id = d.contact_id
      WHERE 1=1
    `;
    const params: Record<string, unknown> = {};
    if (stage && stage !== "all") {
      sql += " AND d.stage = @stage";
      params.stage = stage;
    }
    if (q && q.trim()) {
      sql += " AND (d.name LIKE @q OR o.name LIKE @q OR c.name LIKE @q)";
      params.q = `%${q.trim()}%`;
    }
    sql += " ORDER BY d.created_at DESC";
    return (this.db.prepare(sql).all(params) as Row[]).map(mapDealWithNames);
  }

  getDeal(id: string): Deal | undefined {
    const r = this.db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as Row | undefined;
    return r ? mapDeal(r) : undefined;
  }

  createDeal(input: DealInput): Deal {
    assertStage(input.stage);
    const id = uuid();
    this.db
      .prepare(
        "INSERT INTO deals (id, name, organization_id, contact_id, stage, value_cents, close_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(id, input.name, input.organizationId ?? null, input.contactId ?? null, input.stage, Math.round(Number(input.value) * 100), input.closeDate ?? null, new Date().toISOString());
    return this.getDeal(id)!;
  }

  updateDeal(id: string, input: Partial<DealInput>): Deal | undefined {
    const existing = this.getDeal(id);
    if (!existing) return undefined;
    const next: DealInput = {
      name: input.name ?? existing.name,
      organizationId: input.organizationId ?? existing.organizationId,
      contactId: input.contactId ?? existing.contactId,
      stage: input.stage ?? existing.stage,
      value: input.value ?? existing.value,
      closeDate: input.closeDate ?? existing.closeDate,
    };
    assertStage(next.stage);
    this.db
      .prepare("UPDATE deals SET name = ?, organization_id = ?, contact_id = ?, stage = ?, value_cents = ?, close_date = ? WHERE id = ?")
      .run(next.name, next.organizationId, next.contactId, next.stage, Math.round(Number(next.value) * 100), next.closeDate, id);
    return this.getDeal(id);
  }

  setDealStage(id: string, stage: DealStage): Deal | undefined {
    assertStage(stage);
    return this.updateDeal(id, { stage });
  }

  deleteDeal(id: string): boolean {
    return this.db.prepare("DELETE FROM deals WHERE id = ?").run(id).changes > 0;
  }

  getDealDetail(id: string): { deal: DealWithNames; organization: Organization | null; contact: Contact | null; activities: ActivityWithRefs[] } | undefined {
    const dealRow = this.db.prepare(
      `SELECT d.*, o.name AS organization_name, c.name AS contact_name
       FROM deals d
       LEFT JOIN organizations o ON o.id = d.organization_id
       LEFT JOIN contacts c ON c.id = d.contact_id
       WHERE d.id = ?`
    ).get(id) as Row | undefined;
    if (!dealRow) return undefined;
    const deal = mapDealWithNames(dealRow);
    const organization = deal.organizationId ? this.getOrganization(deal.organizationId) ?? null : null;
    const contact = deal.contactId ? this.getContact(deal.contactId) ?? null : null;
    const activities = this.activitiesFor(deal.contactId ?? undefined, id);
    return { deal, organization, contact, activities };
  }

  getContactDetail(id: string): { contact: ContactWithOrg; organization: Organization | null; activities: ActivityWithRefs[] } | undefined {
    const row = this.db.prepare(
      `SELECT c.*, o.name AS organization_name FROM contacts c
       LEFT JOIN organizations o ON o.id = c.organization_id
       WHERE c.id = ?`
    ).get(id) as Row | undefined;
    if (!row) return undefined;
    const contact = mapContactWithOrg(row);
    const organization = contact.organizationId ? this.getOrganization(contact.organizationId) ?? null : null;
    const activities = this.activitiesFor(id, undefined);
    return { contact, organization, activities };
  }

  // --- Activities ----------------------------------------------------------
  listActivities(limit = 50): ActivityWithRefs[] {
    const rows = this.db.prepare(
      `SELECT a.*, c.name AS contact_name, d.name AS deal_name, o.name AS organization_name
       FROM activities a
       LEFT JOIN contacts c ON c.id = a.contact_id
       LEFT JOIN deals d ON d.id = a.deal_id
       LEFT JOIN organizations o ON o.id = d.organization_id
       ORDER BY a.occurred_at DESC
       LIMIT ?`
    ).all(limit) as Row[];
    return rows.map(mapActivityWithRefs);
  }

  activitiesFor(contactId?: string, dealId?: string): ActivityWithRefs[] {
    const rows = this.db.prepare(
      `SELECT a.*, c.name AS contact_name, d.name AS deal_name, o.name AS organization_name
       FROM activities a
       LEFT JOIN contacts c ON c.id = a.contact_id
       LEFT JOIN deals d ON d.id = a.deal_id
       LEFT JOIN organizations o ON o.id = d.organization_id
       WHERE a.contact_id = ? OR a.deal_id = ?
       ORDER BY a.occurred_at DESC, a.created_at DESC`
    ).all(contactId ?? null, dealId ?? null) as Row[];
    return rows.map(mapActivityWithRefs);
  }

  createActivity(input: ActivityInput): Activity {
    assertActivityType(input.type);
    const id = uuid();
    this.db
      .prepare(
        "INSERT INTO activities (id, type, contact_id, deal_id, description, occurred_at, due_date, done, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(id, input.type, input.contactId ?? null, input.dealId ?? null, input.description, input.occurredAt || new Date().toISOString(), input.dueDate ?? null, input.done ? 1 : 0, new Date().toISOString());
    return this.getActivity(id)!;
  }

  getActivity(id: string): Activity | undefined {
    const r = this.db.prepare("SELECT * FROM activities WHERE id = ?").get(id) as Row | undefined;
    return r ? mapActivity(r) : undefined;
  }

  updateActivity(id: string, input: Partial<ActivityInput>): Activity | undefined {
    const existing = this.getActivity(id);
    if (!existing) return undefined;
    const next: ActivityInput = {
      type: input.type ?? existing.type,
      contactId: input.contactId ?? existing.contactId,
      dealId: input.dealId ?? existing.dealId,
      description: input.description ?? existing.description,
      occurredAt: input.occurredAt ?? existing.occurredAt,
      dueDate: input.dueDate ?? existing.dueDate,
      done: input.done ?? existing.done,
    };
    assertActivityType(next.type);
    this.db
      .prepare(
        "UPDATE activities SET type = ?, contact_id = ?, deal_id = ?, description = ?, occurred_at = ?, due_date = ?, done = ? WHERE id = ?"
      )
      .run(next.type, next.contactId, next.dealId, next.description, next.occurredAt, next.dueDate, next.done ? 1 : 0, id);
    return this.getActivity(id);
  }

  toggleActivity(id: string): Activity | undefined {
    const existing = this.getActivity(id);
    if (!existing) return undefined;
    return this.updateActivity(id, { done: !existing.done });
  }

  deleteActivity(id: string): boolean {
    return this.db.prepare("DELETE FROM activities WHERE id = ?").run(id).changes > 0;
  }

  // --- Dashboard -----------------------------------------------------------
  dashboard(months = 6): DashboardData {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    // Build the rolling window of the last `months` months, ending this month.
    const window: { month: string; count: number; revenue: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      window.push({ month: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, count: 0, revenue: 0 });
    }
    const index = new Map(window.map((w) => [w.month, w]));
    const wonRows = this.db.prepare(
      "SELECT close_date, value_cents FROM deals WHERE stage = 'Won' AND close_date IS NOT NULL"
    ).all() as Row[];
    for (const r of wonRows) {
      const m = String(r.close_date).slice(0, 7); // YYYY-MM
      const bucket = index.get(m);
      if (bucket) {
        bucket.count += 1;
        bucket.revenue += toDollars(r.value_cents);
      }
    }

    const recentActivities = this.listActivities(10);

    const overdueRows = this.db.prepare(
      `SELECT a.*, c.name AS contact_name, d.name AS deal_name, o.name AS organization_name
       FROM activities a
       LEFT JOIN contacts c ON c.id = a.contact_id
       LEFT JOIN deals d ON d.id = a.deal_id
       LEFT JOIN organizations o ON o.id = d.organization_id
       WHERE a.due_date IS NOT NULL AND a.done = 0 AND a.due_date < ?
       ORDER BY a.due_date ASC, a.occurred_at DESC`
    ).all(todayStr) as Row[];
    const overdueTasks = overdueRows.map(mapActivityWithRefs);

    const upcomingRows = this.db.prepare(
      `SELECT a.*, c.name AS contact_name, d.name AS deal_name, o.name AS organization_name
       FROM activities a
       LEFT JOIN contacts c ON c.id = a.contact_id
       LEFT JOIN deals d ON d.id = a.deal_id
       LEFT JOIN organizations o ON o.id = d.organization_id
       WHERE a.due_date IS NOT NULL AND a.done = 0 AND a.due_date >= ?
       ORDER BY a.due_date ASC, a.occurred_at DESC
       LIMIT 12`
    ).all(todayStr) as Row[];
    const upcomingTasks = upcomingRows.map(mapActivityWithRefs);

    const summaryRow = this.db
      .prepare(
        `SELECT
           SUM(CASE WHEN stage NOT IN ('Won','Lost') THEN 1 ELSE 0 END) AS open_deals,
           SUM(CASE WHEN stage = 'Won' THEN 1 ELSE 0 END) AS won_deals,
           SUM(CASE WHEN stage = 'Lost' THEN 1 ELSE 0 END) AS lost_deals,
           SUM(CASE WHEN stage NOT IN ('Won','Lost') THEN value_cents ELSE 0 END) AS pipeline_value,
           SUM(CASE WHEN stage = 'Won' THEN value_cents ELSE 0 END) AS won_value
         FROM deals`
      )
      .get() as Row;
    const summary = {
      openDeals: Number(summaryRow.open_deals || 0),
      wonDeals: Number(summaryRow.won_deals || 0),
      lostDeals: Number(summaryRow.lost_deals || 0),
      pipelineValue: toDollars(summaryRow.pipeline_value || 0),
      wonValue: toDollars(summaryRow.won_value || 0),
      overdueCount: overdueTasks.length,
    };

    return { wonPerMonth: window, recentActivities, upcomingTasks, overdueTasks, summary };
  }
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
