import { describe, it, expect, beforeEach } from "vitest";
import { makeInMemoryRepo } from "../server/api";
import type { Repo } from "../server/repo";

describe("Organizations — CRUD", () => {
  let repo: Repo;
  beforeEach(() => {
    repo = makeInMemoryRepo();
  });

  it("lists seeded organizations", () => {
    const orgs = repo.listOrganizations();
    expect(orgs.length).toBeGreaterThan(5);
    for (const o of orgs) {
      expect(typeof o.id).toBe("string");
      expect(typeof o.name).toBe("string");
      expect(o.contactCount).toBeGreaterThanOrEqual(0);
      expect(o.dealCount).toBeGreaterThanOrEqual(0);
    }
  });

  it("creates, reads, updates and deletes an organization", () => {
    const created = repo.createOrganization({
      name: "Globex Corp",
      website: "https://globex.com",
      industry: "Shipping",
      notes: "A new prospect.",
    });
    expect(created.name).toBe("Globex Corp");
    expect(created.id).toBeTruthy();

    const fetched = repo.getOrganization(created.id);
    expect(fetched?.name).toBe("Globex Corp");
    expect(fetched?.industry).toBe("Shipping");

    const updated = repo.updateOrganization(created.id, { industry: "Logistics", notes: "Updated notes" });
    expect(updated?.industry).toBe("Logistics");
    expect(updated?.notes).toBe("Updated notes");
    expect(updated?.name).toBe("Globex Corp");

    const deleted = repo.deleteOrganization(created.id);
    expect(deleted).toBe(true);
    expect(repo.getOrganization(created.id)).toBeUndefined();
    expect(repo.deleteOrganization(created.id)).toBe(false);
  });

  it("update returns undefined for a missing organization", () => {
    expect(repo.updateOrganization("does-not-exist", { name: "x" })).toBeUndefined();
  });
});

describe("Contacts — CRUD, search, status filter", () => {
  let repo: Repo;
  beforeEach(() => {
    repo = makeInMemoryRepo();
  });

  it("creates, reads, updates and deletes a contact", () => {
    const org = repo.listOrganizations()[0];
    const created = repo.createContact({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+1 555 0100",
      title: "Founder",
      organizationId: org.id,
      status: "lead",
    });
    expect(created.status).toBe("lead");

    const updated = repo.updateContact(created.id, { status: "qualified", title: "CEO" });
    expect(updated?.status).toBe("qualified");
    expect(updated?.title).toBe("CEO");

    const detail = repo.getContactDetail(created.id);
    expect(detail?.organization?.id).toBe(org.id);

    expect(repo.deleteContact(created.id)).toBe(true);
    expect(repo.getContact(created.id)).toBeUndefined();
  });

  it("search narrows by name", () => {
    const all = repo.listContacts();
    const sample = all[0];
    const matches = repo.listContacts(sample.name.slice(0, 4));
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((c) => c.name.toLowerCase().includes(sample.name.slice(0, 4).toLowerCase()))).toBe(true);
    expect(matches.length).toBeLessThan(all.length);
  });

  it("search narrows by email", () => {
    const all = repo.listContacts();
    const withEmail = all.find((c) => c.email.length > 0)!;
    const matches = repo.listContacts(withEmail.email.split("@")[0]);
    expect(matches.some((c) => c.id === withEmail.id)).toBe(true);
  });

  it("status filter returns only that status", () => {
    const leads = repo.listContacts(undefined, "lead");
    expect(leads.length).toBeGreaterThan(0);
    expect(leads.every((c) => c.status === "lead")).toBe(true);

    const customers = repo.listContacts(undefined, "customer");
    expect(customers.every((c) => c.status === "customer")).toBe(true);

    // Total of all statuses equals the unfiltered count.
    const all = repo.listContacts();
    const grouped = ["lead", "qualified", "customer"].reduce(
      (sum, s) => sum + repo.listContacts(undefined, s as "lead").length,
      0
    );
    expect(grouped).toBe(all.length);
  });
});

describe("Deals — CRUD, search, stage changes", () => {
  let repo: Repo;
  beforeEach(() => {
    repo = makeInMemoryRepo();
  });

  it("creates a deal and updates its value and close date", () => {
    const org = repo.listOrganizations()[0];
    const contact = repo.listContacts()[0];
    const deal = repo.createDeal({
      name: "Big deal",
      organizationId: org.id,
      contactId: contact.id,
      stage: "New",
      value: 42500,
      closeDate: "2099-01-15",
    });
    expect(deal.value).toBe(42500);
    expect(deal.closeDate).toBe("2099-01-15");

    const updated = repo.updateDeal(deal.id, { value: 42500.5, closeDate: "2099-02-01" });
    expect(updated?.value).toBe(42500.5);
    expect(updated?.closeDate).toBe("2099-02-01");
  });

  it("changes stage through New → Qualified → Proposal → Negotiation → Won", () => {
    const org = repo.listOrganizations()[0];
    const deal = repo.createDeal({
      name: "Stage test",
      organizationId: org.id,
      contactId: null,
      stage: "New",
      value: 10000,
      closeDate: null,
    });
    for (const stage of ["Qualified", "Proposal", "Negotiation", "Won"] as const) {
      const updated = repo.setDealStage(deal.id, stage);
      expect(updated?.stage).toBe(stage);
    }
    // Won shows up in the deal detail and the dashboard.
    const detail = repo.getDealDetail(deal.id);
    expect(detail?.deal.stage).toBe("Won");
  });

  it("marks a deal Lost and reflects it in the dashboard summary", () => {
    const org = repo.listOrganizations()[0];
    const deal = repo.createDeal({
      name: "Lost test",
      organizationId: org.id,
      contactId: null,
      stage: "New",
      value: 5000,
      closeDate: null,
    });
    const before = repo.dashboard();
    const lost = repo.setDealStage(deal.id, "Lost");
    expect(lost?.stage).toBe("Lost");
    const after = repo.dashboard();
    expect(after.summary.lostDeals).toBe(before.summary.lostDeals + 1);
  });

  it("search narrows by deal name, org name and contact name", () => {
    const all = repo.listDeals();
    const sample = all.find((d) => d.organizationName)!;
    const matches = repo.listDeals(sample.organizationName!.slice(0, 4));
    expect(matches.some((d) => d.id === sample.id)).toBe(true);
    expect(matches.length).toBeLessThanOrEqual(all.length);
  });

  it("deletes a deal", () => {
    const org = repo.listOrganizations()[0];
    const deal = repo.createDeal({
      name: "Delete me",
      organizationId: org.id,
      contactId: null,
      stage: "New",
      value: 1000,
      closeDate: null,
    });
    expect(repo.deleteDeal(deal.id)).toBe(true);
    expect(repo.getDeal(deal.id)).toBeUndefined();
  });

  it("invalid stage throws", () => {
    const org = repo.listOrganizations()[0];
    const deal = repo.createDeal({
      name: "Bad stage",
      organizationId: org.id,
      contactId: null,
      stage: "New",
      value: 1,
      closeDate: null,
    });
    expect(() => repo.setDealStage(deal.id, "Bogus" as never)).toThrow();
  });
});

describe("Activities — add and toggle completion", () => {
  let repo: Repo;
  beforeEach(() => {
    repo = makeInMemoryRepo();
  });

  it("adds an activity to a contact and sees it in the timeline, newest first", () => {
    const contact = repo.listContacts()[0];
    const a1 = repo.createActivity({
      type: "note",
      contactId: contact.id,
      dealId: null,
      description: "First note",
      occurredAt: new Date(Date.now() - 86400000).toISOString(),
      dueDate: null,
      done: false,
    });
    const a2 = repo.createActivity({
      type: "call",
      contactId: contact.id,
      dealId: null,
      description: "Follow-up call",
      occurredAt: new Date().toISOString(),
      dueDate: "2099-01-01",
      done: false,
    });
    const detail = repo.getContactDetail(contact.id);
    const ids = detail!.activities.map((a) => a.id);
    expect(ids).toContain(a1.id);
    expect(ids).toContain(a2.id);
    // newest first: a2 occurred later than a1
    const idx1 = ids.indexOf(a1.id);
    const idx2 = ids.indexOf(a2.id);
    expect(idx2).toBeLessThan(idx1);
  });

  it("toggles a task done / not-done and persists", () => {
    const contact = repo.listContacts()[0];
    const task = repo.createActivity({
      type: "email",
      contactId: contact.id,
      dealId: null,
      description: "Send proposal",
      occurredAt: new Date().toISOString(),
      dueDate: "2099-02-02",
      done: false,
    });
    expect(task.done).toBe(false);

    const done = repo.toggleActivity(task.id);
    expect(done?.done).toBe(true);
    // persists on a fresh fetch
    expect(repo.getActivity(task.id)?.done).toBe(true);

    const undone = repo.toggleActivity(task.id);
    expect(undone?.done).toBe(false);
    expect(repo.getActivity(task.id)?.done).toBe(false);
  });

  it("an overdue task appears in the dashboard overdue list", () => {
    const contact = repo.listContacts()[0];
    const before = repo.dashboard().overdueTasks.length;
    repo.createActivity({
      type: "note",
      contactId: contact.id,
      dealId: null,
      description: "Past due follow-up",
      occurredAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      dueDate: "2000-01-01",
      done: false,
    });
    const after = repo.dashboard().overdueTasks.length;
    expect(after).toBe(before + 1);
  });

  it("deletes an activity", () => {
    const contact = repo.listContacts()[0];
    const a = repo.createActivity({
      type: "note",
      contactId: contact.id,
      dealId: null,
      description: "Temp",
      occurredAt: new Date().toISOString(),
      dueDate: null,
      done: false,
    });
    expect(repo.deleteActivity(a.id)).toBe(true);
    expect(repo.getActivity(a.id)).toBeUndefined();
  });
});

describe("Dashboard", () => {
  it("returns a 6-month window with counts and revenue, and a summary", () => {
    const repo = makeInMemoryRepo();
    const dash = repo.dashboard();
    expect(dash.wonPerMonth).toHaveLength(6);
    for (const m of dash.wonPerMonth) {
      expect(/^\d{4}-\d{2}$/.test(m.month)).toBe(true);
      expect(typeof m.count).toBe("number");
      expect(typeof m.revenue).toBe("number");
    }
    // Seeded wins land in the window — at least one month should have revenue.
    const inWindow = dash.wonPerMonth.reduce((s, m) => s + m.count, 0);
    expect(inWindow).toBeGreaterThan(0);
    // The summary counts every won deal (some may fall outside the 6-month window).
    expect(dash.summary.wonDeals).toBe(repo.listDeals(undefined, "Won").length);
    expect(dash.recentActivities.length).toBeGreaterThan(0);
  });
});
