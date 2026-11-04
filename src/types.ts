// Shared domain types for Personal CRM. These shapes are used by both the
// React front end and the Node/SQLite data layer, so they live here as the
// single source of truth.

export type ContactStatus = "lead" | "qualified" | "customer";

export type DealStage =
  | "New"
  | "Qualified"
  | "Proposal"
  | "Negotiation"
  | "Won"
  | "Lost";

export type ActivityType = "note" | "call" | "email";

/** Pipeline stages, in board order (left → right). */
export const STAGES: DealStage[] = [
  "New",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

export interface Organization {
  id: string;
  name: string;
  website: string;
  industry: string;
  notes: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  organizationId: string | null;
  status: ContactStatus;
  createdAt: string;
}

export interface Deal {
  id: string;
  name: string;
  organizationId: string | null;
  contactId: string | null;
  stage: DealStage;
  /** Value in whole US dollars. */
  value: number;
  /** ISO date string (YYYY-MM-DD) or null. */
  closeDate: string | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  contactId: string | null;
  dealId: string | null;
  description: string;
  /** ISO datetime of when the activity happened. */
  occurredAt: string;
  /** ISO date (YYYY-MM-DD) the follow-up is due, or null. */
  dueDate: string | null;
  done: boolean;
  createdAt: string;
}

/** An organization as returned by the list endpoint, with roll-up counts. */
export interface OrganizationListItem extends Organization {
  contactCount: number;
  dealCount: number;
}

/** A contact as returned by list endpoints, enriched with its org name. */
export interface ContactWithOrg extends Contact {
  organizationName: string | null;
}

/** A deal as returned by list endpoints, enriched with org + contact names. */
export interface DealWithNames extends Deal {
  organizationName: string | null;
  contactName: string | null;
}

export interface OrganizationDetail {
  org: Organization;
  contacts: ContactWithOrg[];
  deals: DealWithNames[];
}

export interface ContactDetail {
  contact: ContactWithOrg;
  organization: Organization | null;
  activities: ActivityWithRefs[];
}

export interface DealDetail {
  deal: DealWithNames;
  organization: Organization | null;
  contact: Contact | null;
  activities: ActivityWithRefs[];
}

export interface ActivityWithRefs extends Activity {
  contactName: string | null;
  dealName: string | null;
  organizationName: string | null;
}

export interface DashboardData {
  /** Last N months of closed business, oldest → newest. */
  wonPerMonth: { month: string; count: number; revenue: number }[];
  recentActivities: ActivityWithRefs[];
  /** Tasks (activities with a due date) due today or later, not done. */
  upcomingTasks: ActivityWithRefs[];
  /** Overdue tasks not yet done. */
  overdueTasks: ActivityWithRefs[];
  summary: {
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    pipelineValue: number;
    wonValue: number;
    overdueCount: number;
  };
}
