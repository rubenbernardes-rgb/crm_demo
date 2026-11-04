import type { DB } from "./db";

// ---------------------------------------------------------------------------
// Realistic sample data for a first launch so every screen looks alive.
// Dates are computed relative to "today" so the dashboard charts always show
// the last several months of closed business.

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n, 15);
  return d;
}
function monthsAhead(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + n, 20);
  return d;
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysAhead(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

interface SeedOrg {
  id: string;
  name: string;
  website: string;
  industry: string;
  notes: string;
}
interface SeedContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  orgId: string | null;
  status: "lead" | "qualified" | "customer";
}
interface SeedDeal {
  id: string;
  name: string;
  orgId: string;
  contactId: string;
  stage: "New" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
  value: number;
  closeDate: string | null;
}
interface SeedActivity {
  id: string;
  type: "note" | "call" | "email";
  contactId: string | null;
  dealId: string | null;
  description: string;
  occurredAt: string;
  dueDate: string | null;
  done: 0 | 1;
}

const ORGS: SeedOrg[] = [
  { id: "org-northwind", name: "Northwind Traders", website: "https://northwind.io", industry: "Logistics", notes: "Mid-market logistics company expanding across the west coast. Open to a multi-quarter rollout." },
  { id: "org-contoso", name: "Contoso Ltd", website: "https://contoso.com", industry: "Manufacturing", notes: "Large manufacturer modernizing factory operations. Security review required for procurement." },
  { id: "org-fabrikam", name: "Fabrikam Inc", website: "https://fabrikam.com", industry: "Retail", notes: "Regional retail chain, ~80 stores. Interested in a unified POS rollout." },
  { id: "org-adventure", name: "Adventure Works", website: "https://adventure-works.com", industry: "Outdoor Gear", notes: "Premium outdoor brand. Strong renewal candidate." },
  { id: "org-tailspin", name: "Tailspin Toys", website: "https://tailspin.toys", industry: "Consumer Goods", notes: "Seasonal business; big Q4 push." },
  { id: "org-wideworld", name: "Wide World Importers", website: "https://wideworld.importers", industry: "Wholesale", notes: "Importer with complex inventory needs across warehouses." },
  { id: "org-coho", name: "Coho Winery", website: "https://cohowinery.com", industry: "Beverage", notes: "Family-owned winery launching a wine club." },
  { id: "org-proseware", name: "Proseware Inc", website: "https://proseware.io", industry: "Software", notes: "Enterprise software vendor; big-ticket deals, longer cycles." },
  { id: "org-litware", name: "Litware Inc", website: "https://litware.com", industry: "Electronics", notes: "Electronics distributor evaluating a pilot." },
  { id: "org-margies", name: "Margie's Travel", website: "https://margies.travel", industry: "Travel", notes: "Boutique travel agency looking to automate bookings." },
];

const CONTACTS: SeedContact[] = [
  { id: "c-helene", name: "Helene Pell", email: "helene.pell@northwind.io", phone: "+1 (206) 555-0118", title: "VP Operations", orgId: "org-northwind", status: "customer" },
  { id: "c-marcus", name: "Marcus Lee", email: "marcus.lee@northwind.io", phone: "+1 (206) 555-0144", title: "Logistics Director", orgId: "org-northwind", status: "qualified" },
  { id: "c-diego", name: "Diego Zapata", email: "diego.zapata@contoso.com", phone: "+1 (425) 555-0177", title: "Plant Manager", orgId: "org-contoso", status: "qualified" },
  { id: "c-aisha", name: "Aisha Khan", email: "aisha.khan@contoso.com", phone: "+1 (425) 555-0192", title: "Head of Procurement", orgId: "org-contoso", status: "customer" },
  { id: "c-priya", name: "Priya Natarajan", email: "priya@fabrikam.com", phone: "+1 (312) 555-0123", title: "Retail Director", orgId: "org-fabrikam", status: "customer" },
  { id: "c-tom", name: "Tom O'Hara", email: "tom.ohara@fabrikam.com", phone: "+1 (312) 555-0156", title: "IT Manager", orgId: "org-fabrikam", status: "qualified" },
  { id: "c-rena", name: "Rena Ichikawa", email: "rena@adventure-works.com", phone: "+1 (720) 555-0133", title: "CFO", orgId: "org-adventure", status: "customer" },
  { id: "c-victor", name: "Victor Bram", email: "victor.bram@adventure-works.com", phone: "+1 (720) 555-0102", title: "Supply Chain Lead", orgId: "org-adventure", status: "qualified" },
  { id: "c-janet", name: "Janet Lee", email: "janet@tailspin.toys", phone: "+1 (212) 555-0188", title: "Marketing VP", orgId: "org-tailspin", status: "lead" },
  { id: "c-omar", name: "Omar Haddad", email: "omar@wideworld.importers", phone: "+1 (503) 555-0167", title: "Warehouse Ops Lead", orgId: "org-wideworld", status: "customer" },
  { id: "c-fleur", name: "Fleur Moreau", email: "fleur@cohowinery.com", phone: "+1 (707) 555-0129", title: "Owner", orgId: "org-coho", status: "customer" },
  { id: "c-grace", name: "Grace Park", email: "grace.park@proseware.io", phone: "+1 (646) 555-0141", title: "VP Engineering", orgId: "org-proseware", status: "customer" },
  { id: "c-ravi", name: "Ravi Subramanian", email: "ravi@proseware.io", phone: "+1 (646) 555-0175", title: "Director of IT", orgId: "org-proseware", status: "qualified" },
  { id: "c-lena", name: "Lena Brandt", email: "lena.brandt@litware.com", phone: "+1 (408) 555-0150", title: "CTO", orgId: "org-litware", status: "lead" },
  { id: "c-sam", name: "Sam Whitfield", email: "sam@litware.com", phone: "+1 (408) 555-0188", title: "Product Lead", orgId: "org-litware", status: "lead" },
  { id: "c-margie", name: "Margie Shoup", email: "margie@margies.travel", phone: "+1 (415) 555-0162", title: "Founder", orgId: "org-margies", status: "lead" },
  { id: "c-bruno", name: "Bruno Costa", email: "bruno.costa@contoso.com", phone: "+1 (425) 555-0201", title: "COO", orgId: "org-contoso", status: "lead" },
  { id: "c-nadia", name: "Nadia Petrov", email: "nadia@northwind.io", phone: "+1 (206) 555-0166", title: "Finance Manager", orgId: "org-northwind", status: "lead" },
];

const DEALS: SeedDeal[] = [
  // Won (spread across the last ~6 months for the dashboard)
  { id: "d-enterprise", orgId: "org-proseware", contactId: "c-grace", name: "Enterprise license", stage: "Won", value: 120000, closeDate: iso(monthsAgo(1)) },
  { id: "d-pos", orgId: "org-fabrikam", contactId: "c-priya", name: "POS rollout", stage: "Won", value: 32000, closeDate: iso(monthsAgo(1)) },
  { id: "d-supply", orgId: "org-adventure", contactId: "c-rena", name: "Annual supply contract", stage: "Won", value: 84000, closeDate: iso(monthsAgo(2)) },
  { id: "d-warehouse", orgId: "org-northwind", contactId: "c-helene", name: "Warehouse automation", stage: "Won", value: 18000, closeDate: iso(monthsAgo(2)) },
  { id: "d-inventory", orgId: "org-wideworld", contactId: "c-omar", name: "Inventory overhaul", stage: "Won", value: 58000, closeDate: iso(monthsAgo(3)) },
  { id: "d-wineclub", orgId: "org-coho", contactId: "c-fleur", name: "Wine club platform", stage: "Won", value: 36500, closeDate: iso(monthsAgo(4)) },
  { id: "d-factory", orgId: "org-contoso", contactId: "c-aisha", name: "Factory automation", stage: "Won", value: 21000, closeDate: iso(monthsAgo(4)) },
  { id: "d-holiday", orgId: "org-tailspin", contactId: "c-janet", name: "Holiday campaign", stage: "Won", value: 27500, closeDate: iso(monthsAgo(5)) },
  { id: "d-dashboard", orgId: "org-northwind", contactId: "c-marcus", name: "Logistics dashboard", stage: "Won", value: 47000, closeDate: iso(monthsAgo(6)) },
  // Lost
  { id: "d-custom", orgId: "org-tailspin", contactId: "c-janet", name: "Custom build", stage: "Lost", value: 30000, closeDate: iso(monthsAgo(2)) },
  { id: "d-audit", orgId: "org-coho", contactId: "c-fleur", name: "Logistics audit", stage: "Lost", value: 12000, closeDate: iso(monthsAgo(3)) },
  // Open pipeline
  { id: "d-pilot", orgId: "org-litware", contactId: "c-lena", name: "Pilot program", stage: "New", value: 15000, closeDate: iso(monthsAhead(1)) },
  { id: "d-trial", orgId: "org-margies", contactId: "c-margie", name: "Trial deployment", stage: "New", value: 22000, closeDate: iso(monthsAhead(2)) },
  { id: "d-migration", orgId: "org-contoso", contactId: "c-diego", name: "SaaS migration", stage: "Qualified", value: 95000, closeDate: iso(monthsAhead(1)) },
  { id: "d-ecommerce", orgId: "org-fabrikam", contactId: "c-tom", name: "E-commerce platform", stage: "Qualified", value: 64000, closeDate: iso(monthsAhead(2)) },
  { id: "d-retainer", orgId: "org-proseware", contactId: "c-ravi", name: "Support retainer", stage: "Proposal", value: 18000, closeDate: iso(monthsAhead(3)) },
  { id: "d-dw", orgId: "org-wideworld", contactId: "c-omar", name: "Data warehouse", stage: "Proposal", value: 73000, closeDate: iso(monthsAhead(2)) },
  { id: "d-renewal", orgId: "org-adventure", contactId: "c-rena", name: "Multi-year renewal", stage: "Negotiation", value: 140000, closeDate: iso(monthsAhead(1)) },
  { id: "d-expansion", orgId: "org-litware", contactId: "c-lena", name: "Platform expansion", stage: "Negotiation", value: 41000, closeDate: iso(monthsAhead(1)) },
];

const ACTIVITIES: SeedActivity[] = [
  { id: "a-1", type: "call", contactId: "c-grace", dealId: "d-enterprise", description: "Discovery call — confirmed scope for the enterprise license.", occurredAt: daysAgo(40).toISOString(), dueDate: null, done: 1 },
  { id: "a-2", type: "email", contactId: "c-grace", dealId: "d-enterprise", description: "Sent over the redlined MSA and pricing one-pager.", occurredAt: daysAgo(35).toISOString(), dueDate: null, done: 1 },
  { id: "a-3", type: "note", contactId: "c-grace", dealId: "d-enterprise", description: "Deal closed! Contract signed, kickoff scheduled for next month.", occurredAt: daysAgo(30).toISOString(), dueDate: null, done: 1 },
  { id: "a-4", type: "call", contactId: "c-rena", dealId: "d-renewal", description: "Renewal call — they want a 3-year term with a discount.", occurredAt: daysAgo(6).toISOString(), dueDate: iso(daysAhead(3)), done: 0 },
  { id: "a-5", type: "email", contactId: "c-rena", dealId: "d-renewal", description: "Sent the renewal quote with the volume discount tier.", occurredAt: daysAgo(4).toISOString(), dueDate: iso(daysAhead(7)), done: 0 },
  { id: "a-6", type: "note", contactId: "c-lena", dealId: "d-pilot", description: "Pilot kickoff — set up the sandbox environment for the Litware team.", occurredAt: daysAgo(2).toISOString(), dueDate: iso(daysAhead(10)), done: 0 },
  { id: "a-7", type: "call", contactId: "c-diego", dealId: "d-migration", description: "Qualified the migration; needs an integration with their MES.", occurredAt: daysAgo(3).toISOString(), dueDate: iso(daysAhead(5)), done: 0 },
  { id: "a-8", type: "email", contactId: "c-priya", dealId: "d-pos", description: "Thank-you note after POS rollout go-live.", occurredAt: daysAgo(28).toISOString(), dueDate: null, done: 1 },
  { id: "a-9", type: "note", contactId: "c-fleur", dealId: "d-wineclub", description: "Wine club launched — first shipments going out this week.", occurredAt: daysAgo(20).toISOString(), dueDate: null, done: 1 },
  { id: "a-10", type: "call", contactId: "c-omar", dealId: "d-dw", description: "Walked through the data warehouse proposal; pricing pushback.", occurredAt: daysAgo(5).toISOString(), dueDate: iso(daysAhead(4)), done: 0 },
  { id: "a-11", type: "email", contactId: "c-omar", dealId: "d-inventory", description: "Sent QBR summary and next-quarter recommendations.", occurredAt: daysAgo(12).toISOString(), dueDate: null, done: 1 },
  { id: "a-12", type: "note", contactId: "c-janet", dealId: "d-custom", description: "Lost to an in-house build — keep in touch, revisit next year.", occurredAt: daysAgo(60).toISOString(), dueDate: iso(daysAgo(1)), done: 0 },
  { id: "a-13", type: "call", contactId: "c-janet", dealId: "d-holiday", description: "Holiday campaign wrap-up; strong results, want to expand scope.", occurredAt: daysAgo(50).toISOString(), dueDate: null, done: 1 },
  { id: "a-14", type: "email", contactId: "c-margie", dealId: "d-trial", description: "Intro email with the trial deployment plan and timeline.", occurredAt: daysAgo(1).toISOString(), dueDate: iso(daysAhead(9)), done: 0 },
  { id: "a-15", type: "note", contactId: "c-marcus", dealId: "d-dashboard", description: "Dashboard shipped; team happy with the real-time view.", occurredAt: daysAgo(15).toISOString(), dueDate: null, done: 1 },
  { id: "a-16", type: "call", contactId: "c-tom", dealId: "d-ecommerce", description: "Scoped the e-commerce platform; needs headless storefront.", occurredAt: daysAgo(2).toISOString(), dueDate: iso(daysAhead(6)), done: 0 },
  { id: "a-17", type: "note", contactId: "c-aisha", dealId: "d-factory", description: "Follow up on the factory automation handoff.", occurredAt: daysAgo(8).toISOString(), dueDate: iso(daysAgo(2)), done: 0 },
  { id: "a-18", type: "email", contactId: "c-helene", dealId: null, description: "Sent the quarterly business review invite.", occurredAt: daysAgo(1).toISOString(), dueDate: iso(daysAhead(2)), done: 0 },
];

export function seed(db: DB): void {
  const now = new Date().toISOString();

  const insertOrg = db.prepare(
    "INSERT INTO organizations (id, name, website, industry, notes, created_at) VALUES (@id, @name, @website, @industry, @notes, @createdAt)"
  );
  const insertContact = db.prepare(
    "INSERT INTO contacts (id, name, email, phone, title, organization_id, status, created_at) VALUES (@id, @name, @email, @phone, @title, @organizationId, @status, @createdAt)"
  );
  const insertDeal = db.prepare(
    "INSERT INTO deals (id, name, organization_id, contact_id, stage, value_cents, close_date, created_at) VALUES (@id, @name, @organizationId, @contactId, @stage, @valueCents, @closeDate, @createdAt)"
  );
  const insertActivity = db.prepare(
    "INSERT INTO activities (id, type, contact_id, deal_id, description, occurred_at, due_date, done, created_at) VALUES (@id, @type, @contactId, @dealId, @description, @occurredAt, @dueDate, @done, @createdAt)"
  );

  const tx = db.transaction(() => {
    for (const o of ORGS) {
      insertOrg.run({ ...o, createdAt: now });
    }
    for (const c of CONTACTS) {
      insertContact.run({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        title: c.title,
        organizationId: c.orgId,
        status: c.status,
        createdAt: now,
      });
    }
    for (const d of DEALS) {
      insertDeal.run({
        id: d.id,
        name: d.name,
        organizationId: d.orgId,
        contactId: d.contactId,
        stage: d.stage,
        valueCents: Math.round(d.value * 100),
        closeDate: d.closeDate,
        createdAt: now,
      });
    }
    for (const a of ACTIVITIES) {
      insertActivity.run({
        id: a.id,
        type: a.type,
        contactId: a.contactId,
        dealId: a.dealId,
        description: a.description,
        occurredAt: a.occurredAt,
        dueDate: a.dueDate,
        done: a.done,
        createdAt: now,
      });
    }
  });
  tx();
}
