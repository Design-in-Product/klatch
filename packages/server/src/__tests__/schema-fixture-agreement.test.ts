import Database from 'better-sqlite3';
import { describe, it, expect } from 'vitest';
import { applySchema, getDb } from '../db/index.js';
import { census, diffCensus } from '../db/schema-delta.js';

/**
 * Does this suite's fixture schema still match the schema production builds?
 *
 * Klatch has two definitions of its schema. `db/index.ts` (`initSchema` +
 * `runMigrations`) is what a real database becomes; `__tests__/setup.ts` is what
 * every test in this directory runs against — 146 files' worth as of 2026-11-18.
 * Nothing enforced that the two agree. Argus's 2026-11-18 finding is what put
 * the question on the board: `migration.test.ts` calls neither `applySchema` nor
 * `runMigrations`, so the suite's largest schema-shaped claim rests on a fixture
 * nothing compares to production.
 *
 * `unit-477ddlcolumns` measured it: on 2026-11-18 the two agree on every column
 * name, every `PRAGMA table_info` attribute, and every top-level DDL clause, for
 * all nine tables. Five of the nine differ in column ORDER, and only in that —
 * production reaches its schema by `ALTER TABLE ADD COLUMN`, which can only
 * append, while the fixture types each column in its logical place.
 *
 * That measurement was true on the day it was taken, which is the state this
 * file exists to change. The guarantee asserted here is **equality up to
 * permutation**: everything the DDL says must be the same on both sides, and the
 * order in which it is said may differ. A stricter key would redden on the next
 * migration for a reason that is not drift; a looser one (column names only)
 * would pass a fixture whose `CHECK` constraint had quietly diverged.
 */

/** Top-level clauses of a `CREATE TABLE`, depth- and quote-aware. */
function topLevelClauses(sql: string): string[] {
  const open = sql.indexOf('(');
  const close = sql.lastIndexOf(')');
  if (open < 0 || close <= open) return [];
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  let quote: string | null = null;
  for (const ch of sql.slice(open + 1, close)) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    // A `CHECK (status IN ('a', 'b'))`'s own commas sit at depth 1 and inside
    // quotes; splitting on them would turn one clause into three and make the
    // multiset comparison below disagree for a reason that is not a difference.
    if (ch === ',' && depth === 0) {
      out.push(cur.replace(/\s+/g, ' ').trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.replace(/\s+/g, ' ').trim());
  return out;
}

function freshProductionDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  // The real exported migration path, not a list of expected tables. A
  // hand-maintained expectation here would be a THIRD definition of the schema,
  // which is the problem this file is about.
  applySchema(db);
  return db;
}

describe('test fixture vs production schema', () => {
  it('has the same tables on both sides', () => {
    const prod = freshProductionDb();
    const p = census(prod);
    const f = census(getDb());
    prod.close();
    expect(Object.keys(f.cols).sort()).toEqual(Object.keys(p.cols).sort());
  });

  it('has the same column names, in or out of order, for every table', () => {
    const prod = freshProductionDb();
    const p = census(prod);
    const f = census(getDb());
    prod.close();
    for (const t of Object.keys(p.cols)) {
      expect([...(f.cols[t] ?? [])].sort(), `column names for ${t}`).toEqual(
        [...p.cols[t]].sort()
      );
    }
  });

  it('has the same column attributes — type, nullability, default, pk', () => {
    const prod = freshProductionDb();
    const fix = getDb();
    const attrs = (db: Database.Database, t: string) =>
      (db.prepare(`PRAGMA table_info("${t}")`).all() as {
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
        pk: number;
      }[])
        .map((c) => `${c.name} ${c.type} notnull=${c.notnull} default=${c.dflt_value} pk=${c.pk}`)
        .sort();
    for (const t of Object.keys(census(prod).cols)) {
      expect(attrs(fix, t), `column attributes for ${t}`).toEqual(attrs(prod, t));
    }
    prod.close();
  });

  it('is equal up to permutation: every top-level DDL clause matches on both sides', () => {
    const prod = freshProductionDb();
    const p = census(prod);
    const f = census(getDb());
    prod.close();
    for (const t of Object.keys(p.cols)) {
      expect([...topLevelClauses(p.sql[t])].sort(), `DDL clauses for ${t}`).toEqual(
        [...topLevelClauses(f.sql[t] ?? '')].sort()
      );
    }
  });

  // The three legs above are all of the form "two things are equal". Every one
  // of them also passes when the comparison is blind, so the file needs a known
  // positive or it is a gate that has never been shown capable of reddening.
  // Both directions, because a comparator that reports every difference in one
  // undifferentiated bucket passes a one-direction KP.
  it('known positive: a column added on the fixture side alone is detected', () => {
    const prod = freshProductionDb();
    const fix = getDb();
    fix.exec('ALTER TABLE files ADD COLUMN kp_fixture_only TEXT');
    const d = diffCensus(census(prod), census(fix));
    prod.close();
    expect(d.addedColumns).toEqual(['files.kp_fixture_only']);
    expect(d.empty).toBe(false);
    // `beforeEach` in setup.ts rebuilds the fixture handle for the next test, so
    // the planted column does not leak. Asserted rather than assumed: this
    // mutates the handle every other test in the suite also uses.
    expect(census(fix).cols.files).toContain('kp_fixture_only');
  });

  it('known positive: a column added on the production side alone is detected', () => {
    const prod = freshProductionDb();
    prod.exec('ALTER TABLE files ADD COLUMN kp_prod_only TEXT');
    const d = diffCensus(census(getDb()), census(prod));
    prod.close();
    expect(d.addedColumns).toEqual(['files.kp_prod_only']);
    expect(d.empty).toBe(false);
  });

  it('known positive: the fixture handle is clean again after the plant', () => {
    // Pairs with the two above. If `beforeEach` ever stops rebuilding the
    // fixture, the plants leak into every later test in the suite and this is
    // the leg that says so.
    expect(census(getDb()).cols.files).not.toContain('kp_fixture_only');
  });
});
