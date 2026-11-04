import Database from "better-sqlite3";
import type { Database as DB } from "better-sqlite3";

const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS organizations (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  website     TEXT NOT NULL DEFAULT '',
  industry    TEXT NOT NULL DEFAULT '',
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  title           TEXT NOT NULL DEFAULT '',
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'lead',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deals (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  contact_id      TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  stage           TEXT NOT NULL DEFAULT 'New',
  value_cents     INTEGER NOT NULL DEFAULT 0,
  close_date      TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL DEFAULT 'note',
  contact_id   TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id      TEXT REFERENCES deals(id) ON DELETE SET NULL,
  description  TEXT NOT NULL DEFAULT '',
  occurred_at  TEXT NOT NULL,
  due_date     TEXT,
  done         INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_due ON activities(due_date);
`;

/**
 * Open (or create) a SQLite database at `path` and ensure its schema exists.
 * Pass `:memory:` for an ephemeral in-process database (used by tests).
 */
export function openDb(path: string): DB {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

export type { DB };
