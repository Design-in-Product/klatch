import Database from 'better-sqlite3';
import { describe, it, expect } from 'vitest';
import { applySchema, getDb } from '../../../packages/server/src/db/index.js';

/**
 * unit-477ddlcolumns — arm.
 *
 * Two live handles in one process, censused from `sqlite_master` and
 * `PRAGMA table_info` only. No DDL text is parsed and no schema fact is typed
 * here: every column name, type, nullability, default and pk flag below comes
 * out of a database that was built by the code under study.
 *
 * PRODUCTION side: a fresh `:memory:` handle through the real exported
 * `applySchema` — `initSchema` + `runMigrations`, which is what a fresh
 * production database actually becomes.
 *
 * FIXTURE side: `getDb()`, which `setup.ts`'s `vi.mock` points at `testDb` —
 * the very handle the tracked suite's 146 files run against.
 */

interface Col {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface TableCensus {
  /** Column names in declared order. */
  order: string[];
  /** name -> full attribute row, as PRAGMA reports it. */
  cols: Record<string, Col>;
}

interface Census {
  /** `type:name` for every object except SQLite's own autoindexes. */
  objects: string[];
  tables: Record<string, TableCensus>;
}

function census(db: Database.Database): Census {
  const rows = db
    .prepare('SELECT type, name FROM sqlite_master ORDER BY type, name')
    .all() as { type: string; name: string }[];
  const objects = rows
    // SQLite's own bookkeeping for PRIMARY KEY / UNIQUE. It arrives with the
    // table it belongs to; naming it separately reports one table as two
    // objects. Same exclusion schema-delta.ts's census() makes, same reason.
    .filter((o) => !o.name.startsWith('sqlite_autoindex_'))
    .map((o) => `${o.type}:${o.name}`);
  const tables: Record<string, TableCensus> = {};
  for (const r of rows) {
    if (r.type !== 'table') continue;
    if (r.name.startsWith('sqlite_')) continue;
    const cols = db.prepare(`PRAGMA table_info("${r.name}")`).all() as Col[];
    tables[r.name] = {
      order: cols.map((c) => c.name),
      cols: Object.fromEntries(
        cols.map((c) => [
          c.name,
          { name: c.name, type: c.type, notnull: c.notnull, dflt_value: c.dflt_value, pk: c.pk },
        ])
      ),
    };
  }
  return { objects, tables };
}

function prodHandle(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  applySchema(db);
  return db;
}

/** One comparison pass. Returns every cell this unit claims anything about. */
function compare(prod: Census, fix: Census) {
  const prodTables = Object.keys(prod.tables).sort();
  const fixTables = Object.keys(fix.tables).sort();
  const shared = prodTables.filter((t) => fixTables.includes(t));

  const prodOnlyTables = prodTables.filter((t) => !fixTables.includes(t));
  const fixOnlyTables = fixTables.filter((t) => !prodTables.includes(t));

  const prodOnlyCols: string[] = [];
  const fixOnlyCols: string[] = [];
  const attrDiffs: string[] = [];
  const orderDiffs: string[] = [];
  const nameSetDiffTables: string[] = [];

  for (const t of shared) {
    const p = prod.tables[t];
    const f = fix.tables[t];
    const pNames = p.order;
    const fNames = f.order;
    let nameSetDiffers = false;
    for (const c of pNames)
      if (!fNames.includes(c)) {
        prodOnlyCols.push(`${t}.${c}`);
        nameSetDiffers = true;
      }
    for (const c of fNames)
      if (!pNames.includes(c)) {
        fixOnlyCols.push(`${t}.${c}`);
        nameSetDiffers = true;
      }
    if (nameSetDiffers) nameSetDiffTables.push(t);

    // Attribute granularity, over columns that share a NAME on both sides.
    // This is the key a name-only census (schema-delta.ts's `Census.cols`)
    // cannot carry, and P5 is about exactly that gap.
    for (const c of pNames) {
      if (!fNames.includes(c)) continue;
      const pc = p.cols[c];
      const fc = f.cols[c];
      const fields: (keyof Col)[] = ['type', 'notnull', 'dflt_value', 'pk'];
      for (const k of fields) {
        if (pc[k] !== fc[k]) {
          attrDiffs.push(`${t}.${c}: ${k} prod=${JSON.stringify(pc[k])} fixture=${JSON.stringify(fc[k])}`);
        }
      }
    }

    // R3: order is reported, not folded into the name-set key. Compared over
    // the shared columns only, so a name difference is not double-counted as
    // an order difference.
    const pShared = pNames.filter((c) => fNames.includes(c));
    const fShared = fNames.filter((c) => pNames.includes(c));
    if (pShared.join(',') !== fShared.join(',')) {
      orderDiffs.push(`${t}: prod=[${pShared.join(' ')}] fixture=[${fShared.join(' ')}]`);
    }
  }

  return {
    prodTables,
    fixTables,
    shared,
    prodOnlyTables,
    fixOnlyTables,
    nameSetDiffTables,
    prodOnlyCols,
    fixOnlyCols,
    attrDiffs,
    orderDiffs,
    prodObjects: prod.objects,
    fixObjects: fix.objects,
  };
}

function report(label: string, r: ReturnType<typeof compare>) {
  const L = (s: string) => console.log(s);
  L('');
  L(`=== ${label} ===`);
  L(`tables: prod ${r.prodTables.length} · fixture ${r.fixTables.length} · shared ${r.shared.length}`);
  L(`prod-only tables (${r.prodOnlyTables.length}): ${r.prodOnlyTables.join(', ') || '(none)'}`);
  L(`fixture-only tables (${r.fixOnlyTables.length}): ${r.fixOnlyTables.join(', ') || '(none)'}`);
  L(`shared tables whose column NAME SET differs: ${r.nameSetDiffTables.length} of ${r.shared.length}`);
  L(`  ${r.nameSetDiffTables.join(', ') || '(none)'}`);
  L(`PROD-ONLY columns (${r.prodOnlyCols.length}):`);
  for (const c of r.prodOnlyCols) L(`  ${c}`);
  L(`FIXTURE-ONLY columns (${r.fixOnlyCols.length}):`);
  for (const c of r.fixOnlyCols) L(`  ${c}`);
  L(`ATTRIBUTE differences on same-named columns (${r.attrDiffs.length}):`);
  for (const d of r.attrDiffs) L(`  ${d}`);
  L(`ORDER differences over shared columns (${r.orderDiffs.length}):`);
  for (const d of r.orderDiffs) L(`  ${d}`);
  L(`objects: prod ${r.prodObjects.length} · fixture ${r.fixObjects.length}`);
  L(`  prod-only objects: ${r.prodObjects.filter((o) => !r.fixObjects.includes(o)).join(', ') || '(none)'}`);
  L(`  fixture-only objects: ${r.fixObjects.filter((o) => !r.prodObjects.includes(o)).join(', ') || '(none)'}`);
}

describe('unit-477ddlcolumns — do the two DDL definitions agree at column level?', () => {
  it('A1: baseline comparison, production effective schema vs the live test fixture', () => {
    const prod = prodHandle();
    const fix = census(getDb());
    const r = compare(census(prod), fix);
    report('A1 BASELINE', r);
    prod.close();

    // No expectation is asserted as a pass/fail here on purpose: this leg is a
    // MEASUREMENT, and a leg that both measures and gates cannot say which of
    // the two reddened it. The gradeable claims are the printed cells, graded
    // against the pre-registration. The one assertion is that both sides were
    // actually built — a comparison of two empty censuses agrees perfectly.
    expect(r.prodTables.length).toBeGreaterThan(0);
    expect(r.fixTables.length).toBeGreaterThan(0);
  });

  it('C1: a column planted on the FIXTURE side only must surface as fixture-only, and nothing else may move', () => {
    const prod = prodHandle();
    const before = compare(census(prod), census(getDb()));

    const fixDb = getDb();
    fixDb.exec('ALTER TABLE files ADD COLUMN kp_planted_fixture TEXT');
    const after = compare(census(prod), census(getDb()));
    report('C1 AFTER FIXTURE-SIDE PLANT', after);
    prod.close();

    const gained = after.fixOnlyCols.filter((c) => !before.fixOnlyCols.includes(c));
    expect(gained).toEqual(['files.kp_planted_fixture']);
    // Nothing else may move: same prod-only set, same attribute diffs, same
    // order diffs. C1 is only evidence that the comparator SEES a planted
    // column if it also does not invent anything alongside it.
    expect(after.prodOnlyCols).toEqual(before.prodOnlyCols);
    expect(after.attrDiffs).toEqual(before.attrDiffs);
    expect(after.orderDiffs).toEqual(before.orderDiffs);
  });

  it('C2: a column planted on the PRODUCTION side only must surface as prod-only and NOT as fixture-only', () => {
    const prod = prodHandle();
    const before = compare(census(prod), census(getDb()));

    prod.exec('ALTER TABLE files ADD COLUMN kp_planted_prod TEXT');
    const after = compare(census(prod), census(getDb()));
    report('C2 AFTER PRODUCTION-SIDE PLANT', after);
    prod.close();

    const gained = after.prodOnlyCols.filter((c) => !before.prodOnlyCols.includes(c));
    expect(gained).toEqual(['files.kp_planted_prod']);
    // The direction claim: it must NOT appear in the other bucket. A
    // comparator that reports every difference in one undifferentiated bucket
    // passes C1 and fails here, which is why both cripples exist.
    expect(after.fixOnlyCols).toEqual(before.fixOnlyCols);
    expect(after.fixOnlyCols.some((c) => c.includes('kp_planted_prod'))).toBe(false);
  });

  it('A2: P6 — messages_rebuild is in neither effective schema', () => {
    const prod = prodHandle();
    const p = census(prod);
    const f = census(getDb());
    prod.close();
    console.log('');
    console.log('=== A2 P6 ===');
    console.log(`prod tables: ${Object.keys(p.tables).sort().join(', ')}`);
    console.log(`fixture tables: ${Object.keys(f.tables).sort().join(', ')}`);
    console.log(
      `messages_rebuild present: prod=${'messages_rebuild' in p.tables} fixture=${'messages_rebuild' in f.tables}`
    );
    expect('messages_rebuild' in p.tables).toBe(false);
    expect('messages_rebuild' in f.tables).toBe(false);
  });
});
