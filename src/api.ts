import type {
  Activity,
  ActivityType,
  Contact,
  ContactDetail,
  ContactStatus,
  ContactWithOrg,
  DashboardData,
  Deal,
  DealDetail,
  DealStage,
  DealWithNames,
  Organization,
  OrganizationDetail,
  OrganizationListItem,
} from "./types";

const BASE = "/api";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

function body(payload: unknown): { body: string } {
  return { body: JSON.stringify(payload) };
}

export const api = {
  dashboard: () => req<DashboardData>("/dashboard"),

  organizations: {
    list: (q?: string) => req<OrganizationListItem[]>(`/organizations${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    get: (id: string) => req<OrganizationDetail>(`/organizations/${id}`),
    create: (input: Partial<Organization>) => req<Organization>("/organizations", { method: "POST", ...body(input) }),
    update: (id: string, input: Partial<Organization>) => req<Organization>(`/organizations/${id}`, { method: "PUT", ...body(input) }),
    remove: (id: string) => req<{ id: string }>(`/organizations/${id}`, { method: "DELETE" }),
  },

  contacts: {
    list: (q?: string, status?: ContactStatus | "all") => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status && status !== "all") params.set("status", status);
      const qs = params.toString();
      return req<ContactWithOrg[]>(`/contacts${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => req<ContactDetail>(`/contacts/${id}`),
    create: (input: Partial<Contact>) => req<Contact>("/contacts", { method: "POST", ...body(input) }),
    update: (id: string, input: Partial<Contact>) => req<Contact>(`/contacts/${id}`, { method: "PUT", ...body(input) }),
    remove: (id: string) => req<{ id: string }>(`/contacts/${id}`, { method: "DELETE" }),
  },

  deals: {
    list: (q?: string, stage?: DealStage | "all") => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (stage && stage !== "all") params.set("stage", stage);
      const qs = params.toString();
      return req<DealWithNames[]>(`/deals${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => req<DealDetail>(`/deals/${id}`),
    create: (input: Partial<Deal>) => req<Deal>("/deals", { method: "POST", ...body(input) }),
    update: (id: string, input: Partial<Deal>) => req<Deal>(`/deals/${id}`, { method: "PUT", ...body(input) }),
    remove: (id: string) => req<{ id: string }>(`/deals/${id}`, { method: "DELETE" }),
  },

  activities: {
    create: (input: {
      type: ActivityType;
      contactId: string | null;
      dealId: string | null;
      description: string;
      occurredAt: string;
      dueDate: string | null;
      done: boolean;
    }) => req<Activity>("/activities", { method: "POST", ...body(input) }),
    update: (id: string, input: Partial<{ done: boolean; dueDate: string | null; description: string }>) =>
      req<Activity>(`/activities/${id}`, { method: "PUT", ...body(input) }),
    toggle: (id: string) => req<Activity>(`/activities/${id}/toggle`, { method: "POST" }),
    remove: (id: string) => req<{ id: string }>(`/activities/${id}`, { method: "DELETE" }),
  },
};

export { ApiError };
