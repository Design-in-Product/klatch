import Database from 'better-sqlite3';
import { describe, it, expect } from 'vitest';
import { applySchema, getDb } from '../../../packages/server/src/db/index.js';
import { census as shippedCensus, diffCensus } from '../../../packages/server/src/db/schema-delta.js';

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

  it('A3: the order difference, put to the SHIPPED comparator in both directions', () => {
    const prod = prodHandle();
    const fix = getDb();

    // `census` and `diffCensus` are both the real exported functions from
    // `db/schema-delta.ts`. Nothing about the census is re-derived here: a
    // hand-typed copy of it would be the thing grading the shipped one, and
    // this corpus has already paid for that mistake twice.
    const pc = shippedCensus(prod);
    const fc = shippedCensus(fix);

    const fixToProd = diffCensus(fc, pc);
    const prodToFix = diffCensus(pc, fc);
    prod.close();

    const L = (s: string) => console.log(s);
    L('');
    L('=== A3 SHIPPED diffCensus ===');
    L(`fixture -> production: empty=${fixToProd.empty}`);
    L(`  addedObjects   (${fixToProd.addedObjects.length}): ${fixToProd.addedObjects.join(', ') || '(none)'}`);
    L(`  droppedObjects (${fixToProd.droppedObjects.length}): ${fixToProd.droppedObjects.join(', ') || '(none)'}`);
    L(`  addedColumns   (${fixToProd.addedColumns.length}): ${fixToProd.addedColumns.join(', ') || '(none)'}`);
    L(`  rebuiltTables  (${fixToProd.rebuiltTables.length}): ${fixToProd.rebuiltTables.join(', ') || '(none)'}`);
    L(`  alteredTables  (${fixToProd.alteredTables.length}): ${fixToProd.alteredTables.join(', ') || '(none)'}`);
    L(`production -> fixture: empty=${prodToFix.empty}`);
    L(`  addedObjects   (${prodToFix.addedObjects.length}): ${prodToFix.addedObjects.join(', ') || '(none)'}`);
    L(`  droppedObjects (${prodToFix.droppedObjects.length}): ${prodToFix.droppedObjects.join(', ') || '(none)'}`);
    L(`  addedColumns   (${prodToFix.addedColumns.length}): ${prodToFix.addedColumns.join(', ') || '(none)'}`);
    L(`  rebuiltTables  (${prodToFix.rebuiltTables.length}): ${prodToFix.rebuiltTables.join(', ') || '(none)'}`);
    L(`  alteredTables  (${prodToFix.alteredTables.length}): ${prodToFix.alteredTables.join(', ') || '(none)'}`);

    // Measurement, not a gate — the printed cells are what is graded. The one
    // assertion is that both censuses were actually taken.
    expect(Object.keys(fc.cols).length).toBeGreaterThan(0);
    expect(Object.keys(pc.cols).length).toBeGreaterThan(0);
  });

  it('A4: constraint granularity — the one thing PRAGMA table_info cannot see', () => {
    const prod = prodHandle();
    const pc = shippedCensus(prod);
    const fc = shippedCensus(getDb());
    prod.close();

    // `PRAGMA table_info` carries name/type/notnull/dflt_value/pk and NOTHING
    // about CHECK, FOREIGN KEY or UNIQUE. A1 could therefore report perfect
    // agreement over two tables whose constraints differ — which is also why
    // `alteredTables` exists in the shipped comparator at all. The census's
    // `sql` field is SQLite's own stored `CREATE TABLE` text, so it is the
    // right surface for this question and no DDL file is parsed here either.
    const L = (s: string) => console.log(s);
    L('');
    L('=== A4 CONSTRAINT / CREATE TABLE TEXT ===');
    const tables = Object.keys(pc.cols).sort();
    let identical = 0;
    const differing: string[] = [];
    for (const t of tables) {
      const same = pc.sql[t] === fc.sql[t];
      if (same) identical++;
      else differing.push(t);
      L(`${t}: CREATE TABLE text ${same ? 'BYTE-IDENTICAL' : 'DIFFERS'}`);
    }
    L(`byte-identical: ${identical} of ${tables.length} · differing: ${differing.join(', ') || '(none)'}`);

    // For the differing ones, compare the CONSTRAINT CLAUSES as sets rather
    // than the whole text: the text necessarily differs wherever the column
    // ORDER differs, and reporting that as a constraint difference would fuse
    // two mechanisms A1 has already told apart.
    const clauses = (sql: string, kw: RegExp) =>
      (sql.match(kw) ?? []).map((s) => s.replace(/\s+/g, ' ').trim()).sort();
    const CHECKS = /CHECK[\s]*\([^)]*\)/gi;
    const FKS = /REFERENCES[\s]+[A-Za-z_"]+[\s]*\([^)]*\)/gi;
    const UNIQ = /UNIQUE[\s]*\([^)]*\)|\bUNIQUE\b/gi;
    const PKS = /PRIMARY[\s]+KEY[\s]*\([^)]*\)|\bPRIMARY[\s]+KEY\b/gi;
    L('');
    for (const t of differing) {
      for (const [label, kw] of [
        ['CHECK', CHECKS],
        ['REFERENCES', FKS],
        ['UNIQUE', UNIQ],
        ['PRIMARY KEY', PKS],
      ] as const) {
        const p = clauses(pc.sql[t], kw);
        const f = clauses(fc.sql[t], kw);
        const agree = JSON.stringify(p) === JSON.stringify(f);
        L(`${t} ${label}: ${agree ? 'AGREE' : 'DIFFER'} — prod ${JSON.stringify(p)} · fixture ${JSON.stringify(f)}`);
      }
    }

    // The four buckets above are a PREFIX comparison and the output shows it:
    // `CHECK\([^)]*\)` stops at the first `)`, so it captures
    // `CHECK (status IN ('complete', ...'` without its closing paren, and a
    // difference after that point is invisible. Rather than leave a truncating
    // reader as the evidence for a clean verdict, the complete key:
    //
    //   split the CREATE TABLE body on TOP-LEVEL commas (depth 0 only, so a
    //   CHECK's own internal commas do not split it), normalise whitespace,
    //   SORT, and compare.
    //
    // If the two sides are equal under that key, then everything the DDL says
    // is the same on both sides and the ONLY difference is the order in which
    // it is said. That is a complete statement, not a prefix of one.
    const topLevelClauses = (sql: string): string[] => {
      const open = sql.indexOf('(');
      const close = sql.lastIndexOf(')');
      if (open < 0 || close <= open) return [];
      const body = sql.slice(open + 1, close);
      const out: string[] = [];
      let depth = 0;
      let cur = '';
      let quote: string | null = null;
      for (const ch of body) {
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
        if (ch === ',' && depth === 0) {
          out.push(cur.replace(/\s+/g, ' ').trim());
          cur = '';
          continue;
        }
        cur += ch;
      }
      if (cur.trim()) out.push(cur.replace(/\s+/g, ' ').trim());
      return out;
    };

    L('');
    L('--- A5: equal up to permutation? (complete key, top-level clause multiset) ---');
    let permutationOnly = 0;
    const realDiffs: string[] = [];
    for (const t of tables) {
      const p = topLevelClauses(pc.sql[t]);
      const f = topLevelClauses(fc.sql[t]);
      const same = JSON.stringify([...p].sort()) === JSON.stringify([...f].sort());
      const orderSame = JSON.stringify(p) === JSON.stringify(f);
      if (same) permutationOnly++;
      else realDiffs.push(t);
      L(
        `${t}: clauses ${p.length}/${f.length} · multiset ${same ? 'EQUAL' : 'DIFFERENT'} · order ${orderSame ? 'same' : 'DIFFERENT'}`
      );
      if (!same) {
        L(`  prod-only clauses: ${JSON.stringify(p.filter((c) => !f.includes(c)))}`);
        L(`  fixture-only clauses: ${JSON.stringify(f.filter((c) => !p.includes(c)))}`);
      }
    }
    L(
      `equal up to permutation: ${permutationOnly} of ${tables.length} · genuinely different: ${realDiffs.join(', ') || '(none)'}`
    );

    // Measurement leg. The printed cells are the gradeable claims.
    expect(tables.length).toBe(9);
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
