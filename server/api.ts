import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { openDb, type DB } from "./db";
import { seed } from "./seed";
import {
  Repo,
  type ActivityInput,
  type ContactInput,
  type DealInput,
  type OrganizationInput,
} from "./repo";
import type { ContactStatus, DealStage } from "../src/types";

type NextFn = (err?: unknown) => void;
type Handler = (req: IncomingMessage, res: ServerResponse, next: NextFn) => void;

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(payload);
}

function sendError(res: ServerResponse, status: number, message: string): void {
  send(res, status, { error: message });
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function parseUrl(req: IncomingMessage): { pathname: string; params: URLSearchParams } {
  const url = new URL(req.url ?? "/", "http://localhost");
  return { pathname: url.pathname, params: url.searchParams };
}

let dbInstance: DB | null = null;
let repoInstance: Repo | null = null;

function getRepo(): Repo {
  if (!repoInstance || !dbInstance) {
    const dbPath = process.env.CRM_DB_PATH ?? path.resolve(process.cwd(), "crm.sqlite3");
    dbInstance = openDb(dbPath);
    const count = (dbInstance.prepare("SELECT COUNT(*) AS c FROM organizations").get() as { c: number }).c;
    if (count === 0) seed(dbInstance);
    repoInstance = new Repo(dbInstance);
  }
  return repoInstance;
}

/** Exposed for tests: build a repo over a fresh in-memory database (no file). */
export function makeInMemoryRepo(): Repo {
  const db = openDb(":memory:");
  seed(db);
  return new Repo(db);
}

export function createApiMiddleware(): Handler {
  // Eagerly open + seed the database when the middleware is created so the
  // first request is fast and the file exists immediately.
  getRepo();

  return (req, res, next) => {
    const { pathname, params } = parseUrl(req);
    if (!pathname.startsWith("/api/")) return next();

    const repo = getRepo();
    const method = (req.method ?? "GET").toUpperCase();
    const segments = pathname.split("/").filter(Boolean); // ["api","organizations", ...]

    // Helper: the resource id is the 3rd path segment (/api/<resource>/<id>)
    const id = segments[2];

    void handle({ repo, method, pathname, segments, id, params, req, res, next });
  };
}

interface RouteCtx {
  repo: Repo;
  method: string;
  pathname: string;
  segments: string[];
  id: string | undefined;
  params: URLSearchParams;
  req: IncomingMessage;
  res: ServerResponse;
  next: NextFn;
}

async function handle(ctx: RouteCtx): Promise<void> {
  const { repo, method, segments, res, pathname } = ctx;
  const resource = segments[1];
  try {
    switch (resource) {
      case "dashboard":
        if (method === "GET") return send(res, 200, repo.dashboard());
        return sendError(res, 405, "Method not allowed");

      case "organizations":
        return handleOrganizations(ctx);
      case "contacts":
        return handleContacts(ctx);
      case "deals":
        return handleDeals(ctx);
      case "activities":
        return handleActivities(ctx);
      default:
        return sendError(res, 404, `No route for ${pathname}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (message.startsWith("Invalid ")) return sendError(res, 400, message);
    return sendError(res, 500, message);
  }
}

async function handleOrganizations(ctx: RouteCtx): Promise<void> {
  const { repo, method, id, params, req, res } = ctx;
  if (!id) {
    if (method === "GET") return send(res, 200, repo.listOrganizations(params.get("q") ?? undefined));
    if (method === "POST") {
      const body = (await readBody(req)) as Partial<OrganizationInput>;
      return send(res, 201, repo.createOrganization(body as OrganizationInput));
    }
    return sendError(res, 405, "Method not allowed");
  }
  if (method === "GET") {
    const detail = repo.getOrganizationDetail(id);
    return detail ? send(res, 200, detail) : sendError(res, 404, "Organization not found");
  }
  if (method === "PUT") {
    const body = (await readBody(req)) as Partial<OrganizationInput>;
    const updated = repo.updateOrganization(id, body);
    return updated ? send(res, 200, updated) : sendError(res, 404, "Organization not found");
  }
  if (method === "DELETE") {
    return repo.deleteOrganization(id) ? send(res, 200, { id }) : sendError(res, 404, "Organization not found");
  }
  return sendError(res, 405, "Method not allowed");
}

async function handleContacts(ctx: RouteCtx): Promise<void> {
  const { repo, method, id, params, req, res } = ctx;
  if (!id) {
    if (method === "GET") {
      const status = (params.get("status") ?? undefined) as ContactStatus | "all" | undefined;
      return send(res, 200, repo.listContacts(params.get("q") ?? undefined, status ?? "all"));
    }
    if (method === "POST") {
      const body = (await readBody(req)) as Partial<ContactInput>;
      return send(res, 201, repo.createContact(body as ContactInput));
    }
    return sendError(res, 405, "Method not allowed");
  }
  if (method === "GET") {
    const detail = repo.getContactDetail(id);
    return detail ? send(res, 200, detail) : sendError(res, 404, "Contact not found");
  }
  if (method === "PUT") {
    const body = (await readBody(req)) as Partial<ContactInput>;
    const updated = repo.updateContact(id, body);
    return updated ? send(res, 200, updated) : sendError(res, 404, "Contact not found");
  }
  if (method === "DELETE") {
    return repo.deleteContact(id) ? send(res, 200, { id }) : sendError(res, 404, "Contact not found");
  }
  return sendError(res, 405, "Method not allowed");
}

async function handleDeals(ctx: RouteCtx): Promise<void> {
  const { repo, method, id, params, req, res } = ctx;
  if (!id) {
    if (method === "GET") {
      const stage = (params.get("stage") ?? undefined) as DealStage | "all" | undefined;
      return send(res, 200, repo.listDeals(params.get("q") ?? undefined, stage ?? "all"));
    }
    if (method === "POST") {
      const body = (await readBody(req)) as Partial<DealInput>;
      return send(res, 201, repo.createDeal(body as DealInput));
    }
    return sendError(res, 405, "Method not allowed");
  }
  if (method === "GET") {
    const detail = repo.getDealDetail(id);
    return detail ? send(res, 200, detail) : sendError(res, 404, "Deal not found");
  }
  if (method === "PUT") {
    const body = (await readBody(req)) as Partial<DealInput>;
    const updated = repo.updateDeal(id, body);
    return updated ? send(res, 200, updated) : sendError(res, 404, "Deal not found");
  }
  if (method === "DELETE") {
    return repo.deleteDeal(id) ? send(res, 200, { id }) : sendError(res, 404, "Deal not found");
  }
  return sendError(res, 405, "Method not allowed");
}

async function handleActivities(ctx: RouteCtx): Promise<void> {
  const { repo, method, id, params, req, res, segments } = ctx;
  if (!id) {
    if (method === "GET") {
      const limit = Number(params.get("limit") ?? 50);
      return send(res, 200, repo.listActivities(Number.isFinite(limit) ? limit : 50));
    }
    if (method === "POST") {
      const body = (await readBody(req)) as Partial<ActivityInput>;
      return send(res, 201, repo.createActivity(body as ActivityInput));
    }
    return sendError(res, 405, "Method not allowed");
  }
  // /api/activities/:id/toggle
  if (segments[3] === "toggle" && method === "POST") {
    const toggled = repo.toggleActivity(id);
    return toggled ? send(res, 200, toggled) : sendError(res, 404, "Activity not found");
  }
  if (method === "GET") {
    const activity = repo.getActivity(id);
    return activity ? send(res, 200, activity) : sendError(res, 404, "Activity not found");
  }
  if (method === "PUT") {
    const body = (await readBody(req)) as Partial<ActivityInput>;
    const updated = repo.updateActivity(id, body);
    return updated ? send(res, 200, updated) : sendError(res, 404, "Activity not found");
  }
  if (method === "DELETE") {
    return repo.deleteActivity(id) ? send(res, 200, { id }) : sendError(res, 404, "Activity not found");
  }
  return sendError(res, 405, "Method not allowed");
}
