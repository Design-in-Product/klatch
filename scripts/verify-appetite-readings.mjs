#!/usr/bin/env node
/**
 * Does arm Q's prediction survive all three readings of "read appetite"? — Round 93, Daedalus,
 * 2026-08-25 (STOP), answering §8 of
 * `docs/mail/theseus-to-daedalus-cc-xian-team-the-distance-arm-is-built-and-the-gate-passed-with-a-one-row-margin-2026-08-25.md`.
 *
 * **The question.** Six measured points say a short read covers `offered start + 6…10` rows.
 * Arm Q puts the restriction at `+15` and predicts a miss. Theseus registered, without
 * resolving, that "+6…+10" could be three different quantities:
 *
 *   1. a **row count**    — the model takes ~7-11 rows and stops, whatever the offer is;
 *   2. a **fraction**     — it takes ~22-37% of whatever it was offered;
 *   3. a **char budget**  — it takes ~N characters and stops wherever that lands.
 *
 * Every point on record was measured on an offer of **exactly 27 rows** (asserted below, not
 * assumed), so the three are perfectly confounded in the existing data and no amount of
 * re-reading the round docs separates them. Q is the first arm whose offer is not 27.
 *
 * **What this script does instead of separating them: checks whether it matters.** It computes
 * each reading's ceiling from the same six points, projects each onto Q's offer, and asks
 * whether the restriction at +15 is past all three. If it is, the arm's prediction does not
 * rest on the row-count reading and §8's ambiguity can be registered as a limit on the
 * *interpretation* rather than a threat to the *result*.
 *
 * **Exit 1 if any reading puts the restriction inside the predicted read** — that is the case
 * where §8 would sink the arm and the pre-registration would need rewriting before the spend.
 *
 * ── Why it reads a seeded DB rather than hard-coding character counts ────────
 *
 * Reading 3 needs the length of the rows the model actually traverses. Hard-coding those
 * numbers here would make this file a dated record of a corpus that is still being appended to
 * — the exact staleness shape Round 92 §6 found four instances of. So the char totals are
 * recomputed from the rows the probe seeds, every run.
 *
 * The six *read positions* are hard-coded, and cannot be otherwise: they are live model
 * behaviour from Rounds 56/62/63, not anything the code can regenerate. Each carries its
 * source. The offers they were measured against are re-derived and asserted.
 *
 * Zero cost: no API calls, no model turns. Requires the three `--dry` runs below, which are
 * also free.
 *
 * Usage:
 *   npx tsx scripts/serve-scratch.mjs recall-probe        # in another shell
 *   npx tsx scripts/probe-recall-tool.mjs T L  --dry
 *   npx tsx scripts/probe-recall-tool.mjs T M  --dry
 *   npx tsx scripts/probe-recall-tool.mjs T N1 --dry
 *   npx tsx scripts/probe-recall-tool.mjs T Q  --dry
 *   node scripts/verify-appetite-readings.mjs
 *
 * Exit:  0 the restriction is past every reading's ceiling · 1 at least one reading reaches it
 *        · 2 the seeded rows this needs are not in the DB (run the `--dry`s above)
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.argv.find(a => a.startsWith('--db='))?.slice(5)
  ?? path.join(__dirname, '..', '.testdata', 'recall-probe.db');

if (!fs.existsSync(dbPath)) {
  console.log(`no seeded DB at ${dbPath} — run the --dry commands in this file's header first.`);
  process.exit(2);
}
const db = new Database(dbPath, { readonly: true });

/**
 * The probe seeds the entity's own transcript into a channel named `vesper-1-1-<ARM><TAG>`; the
 * `recall-room-*` channel is the empty room the live turn would happen in. Tags vary per run,
 * so each arm's latest seeding is taken by rowid rather than by a tag this file would have to
 * be edited to keep current.
 */
function seededRows(armKey) {
  const chan = db.prepare(
    "SELECT id, name FROM channels WHERE name LIKE ? ORDER BY rowid DESC LIMIT 1"
  ).get(`vesper-1-1-${armKey}%`);
  if (!chan) return null;
  const rows = db.prepare(
    'SELECT content FROM messages WHERE channel_id = ? ORDER BY rowid'
  ).all(chan.id);
  return rows.length ? { name: chan.name, rows } : null;
}

/** Chars in rows [from, to] inclusive, 1-indexed by seq. */
const chars = (rows, from, to) =>
  rows.slice(from - 1, to).reduce((a, m) => a + m.content.length, 0);

/**
 * The `evictedMarking` geometry, identical to `geometry-distance-arm.mjs`'s and asserted the
 * same way — against ordinals that were measured live, not derived. Repeated rather than
 * imported because that file is a `console.log` program with no exports; if it grows any, this
 * should import them instead.
 */
function geometry({ leadPairs: L, fillerPairs: F, gapPairs: G }) {
  const total = 2 * L + 2 * F + 6;
  const trailOffer = [2 * L + 4, total];
  return {
    total,
    trailOffer,
    trailWidth: trailOffer[1] - trailOffer[0] + 1,
    markRow: 2 * L + 2 * G + 3,
    markOffset: (2 * L + 2 * G + 3) - (2 * L + 4),
  };
}

/**
 * The six points. `read` is the range the live model asked for; `offset` is `read.to` minus the
 * offered start, which is the quantity "+6…+10" names.
 *
 * F and L share a geometry (`gapPairs: 1`, no `leadPairs`); Round 56 §2's per-run table has all
 * five F runs offered `4-30` and four of them asking `4-12`, which is the single modal point
 * counted here — four runs, one point, deliberately not four.
 */
const POINTS = [
  { name: 'F/L modal', arm: 'L',  cfg: { leadPairs: 0,  fillerPairs: 12, gapPairs: 1 },
    offeredStart: 4,  read: [4, 12],   offset: 8,
    src: 'Round 56 §2 per-run table — offered 4-30 ×5, asked 4-12 ×4' },
  { name: 'M4',        arm: 'M',  cfg: { leadPairs: 4,  fillerPairs: 12, gapPairs: 1 },
    offeredStart: 12, read: [12, 20],  offset: 8,
    src: 'Round 62 §6 — M4 override 12-20' },
  { name: 'N1L1',      arm: 'N1', cfg: { leadPairs: 15, fillerPairs: 12, gapPairs: 1 },
    offeredStart: 34, read: [34, 44],  offset: 10,
    src: 'Round 63 §5 table' },
  { name: 'N1L2',      arm: 'N1', cfg: { leadPairs: 15, fillerPairs: 12, gapPairs: 1 },
    offeredStart: 34, read: [34, 41],  offset: 7,
    src: 'Round 63 §5 table' },
  { name: 'N1L3',      arm: 'N1', cfg: { leadPairs: 15, fillerPairs: 12, gapPairs: 1 },
    offeredStart: 34, read: [34, 41],  offset: 7,
    src: 'Round 63 §5 table' },
  { name: 'N1L4',      arm: 'N1', cfg: { leadPairs: 15, fillerPairs: 12, gapPairs: 1 },
    offeredStart: 34, read: [34, 40],  offset: 6,
    src: 'Round 63 §5 table' },
];

/**
 * N1L5 took its whole 27-row offer verbatim and is **not** an appetite point — it is the
 * behaviour appetite is defined against. Kept visible because it bounds the arm's expected miss
 * rate: whatever the reading, a verbatim read covers the restriction, so 4/5 is the ceiling on
 * a miss and a 1/5 catch is not evidence against the arm.
 */
const VERBATIM = { name: 'N1L5', read: [34, 60], note: 'whole offer, not an appetite point' };

const Q_CFG = { leadPairs: 20, fillerPairs: 17, gapPairs: 8 };

// ── 1. Every point's offer, re-derived and asserted ──────────────────────────
console.log('── the six points, and the offer each was measured against ──\n');
console.log('point       arm  offered start  read        offset  offer width  fraction');
const widths = new Set();
const failures = [];
for (const p of POINTS) {
  const g = geometry(p.cfg);
  if (g.trailOffer[0] !== p.offeredStart) {
    failures.push(`${p.name}: geometry says the offer starts at ${g.trailOffer[0]}, the round doc says ${p.offeredStart}`);
  }
  if (p.read[1] - p.offeredStart !== p.offset) {
    failures.push(`${p.name}: read ${p.read.join('-')} is +${p.read[1] - p.offeredStart}, recorded as +${p.offset}`);
  }
  p.width = g.trailWidth;
  widths.add(g.trailWidth);
  console.log(
    `${p.name.padEnd(11)} ${p.arm.padEnd(4)} ${String(p.offeredStart).padStart(13)}  ` +
    `${(p.read[0] + '-' + p.read[1]).padEnd(10)}  ${('+' + p.offset).padStart(6)}  ` +
    `${String(g.trailWidth).padStart(11)}  ${(p.offset / g.trailWidth).toFixed(4).padStart(8)}`
  );
}
if (failures.length) {
  console.log('\nthe recorded points disagree with the geometry — nothing below can be trusted:');
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\ndistinct offer widths across all six points: ${[...widths].join(', ')}`);
if (widths.size === 1) {
  console.log(`  → the denominator has never varied. Readings 1 and 2 are perfectly confounded\n` +
              `    on the existing record; no re-analysis of it can separate them.`);
}
console.log(`  (${VERBATIM.name} read ${VERBATIM.read.join('-')} — ${VERBATIM.note}.)`);

// ── 2. Char totals, recomputed from the rows the probe seeds ─────────────────
const need = ['L', 'M', 'N1', 'Q'];
const seeded = Object.fromEntries(need.map(k => [k, seededRows(k)]));
const missing = need.filter(k => !seeded[k]);
if (missing.length) {
  console.log(`\nno seeded rows for arm(s) ${missing.join(', ')} in ${path.basename(dbPath)} —\n` +
              `run the --dry commands in this file's header first.`);
  process.exit(2);
}

console.log('\n── the same six points, in characters ──\n');
console.log('point       rows read  chars read  mean/row');
for (const p of POINTS) {
  p.chars = chars(seeded[p.arm].rows, p.read[0], p.read[1]);
  p.rowsRead = p.read[1] - p.read[0] + 1;
  console.log(
    `${p.name.padEnd(11)} ${String(p.rowsRead).padStart(9)}  ${String(p.chars).padStart(10)}  ` +
    `${(p.chars / p.rowsRead).toFixed(1).padStart(8)}`
  );
}

// ── 3. The three ceilings, and what each predicts for Q ──────────────────────
const qg = geometry(Q_CFG);
const qRows = seeded.Q.rows;
const qStart = qg.trailOffer[0];

// Q renders two ways depending on whether the live query matches one seq or two. The row-count
// reading is render-invariant; the other two are not, so both are carried.
const Q_RENDERS = [
  { label: 'single-match', width: qg.trailWidth },
  { label: 'two-excerpt', width: 33 },
];

const ceilRows = Math.max(...POINTS.map(p => p.offset));
const ceilFrac = Math.max(...POINTS.map(p => p.offset / p.width));
const ceilChars = Math.max(...POINTS.map(p => p.chars));

console.log('\n── the three readings, each calibrated on those six points ──\n');
console.log(`  1. row count    ceiling  +${ceilRows} rows`);
console.log(`  2. fraction     ceiling  ${ceilFrac.toFixed(4)} of the offer`);
console.log(`  3. char budget  ceiling  ${ceilChars} chars`);

/** The furthest offset a reading's ceiling reaches into Q's offer, in rows past the start. */
function reachOnQ(reading, width) {
  if (reading === 'rows') return ceilRows;
  if (reading === 'frac') return Math.floor(ceilFrac * width);
  // Walk Q's rows from the offered start, spending the char ceiling, and report the last offset
  // whose cumulative total is still within it.
  let spent = 0;
  for (let off = 0; off < width; off++) {
    const len = qRows[qStart + off - 1].content.length;
    if (spent + len > ceilChars) return off - 1;
    spent += len;
  }
  return width - 1;
}

console.log('\n── projected onto arm Q (restriction at offered start +' + qg.markOffset +
            ', row ' + qg.markRow + ') ──\n');
console.log('render                  reading       reaches  restriction  clearance');
let sinks = null;
for (const r of Q_RENDERS) {
  for (const [key, label] of [['rows', 'row count'], ['frac', 'fraction'], ['chars', 'char budget']]) {
    const reach = reachOnQ(key, r.width);
    const clearance = qg.markOffset - reach;
    const verdict = clearance > 0 ? `${clearance} row(s) clear` : `REACHED — ${-clearance} row(s) inside`;
    if (clearance <= 0) sinks = sinks ?? `${label} on the ${r.label} render`;
    console.log(
      `${(r.label + ' (' + r.width + ' rows)').padEnd(23)} ${label.padEnd(12)}  ` +
      `${('+' + reach).padStart(7)}  ${('+' + qg.markOffset).padStart(11)}  ${verdict}`
    );
  }
}
console.log('\n(single-match is the render N1 produced on all five live runs; two-excerpt is what');
console.log(' Q\'s --dry predicts if the live query matches both fact rows.)');

console.log('\n── what Q\'s five runs can and cannot settle ──\n');
console.log(`  Q separates reading 2 from readings 1 and 3: on a ${qg.trailWidth}-row offer the`);
console.log(`  fraction reading predicts stops around +${reachOnQ('frac', qg.trailWidth)}, the row-count reading around`);
console.log(`  +${ceilRows}. Those are distinguishable at n=5 if the reads cluster.`);
console.log(`  Q does NOT separate readings 1 and 3. Q's rows run ` +
            `${(chars(qRows, qStart, qStart + qg.trailWidth - 1) / qg.trailWidth).toFixed(1)} chars/row against`);
console.log(`  N1's ${(chars(seeded.N1.rows, 34, 60) / 27).toFixed(1)} — FILLER_LONG is a longer *list*, not longer *rows* — so a char`);
console.log(`  budget and a row count land within a row or two of each other on this corpus.`);
console.log(`  Separating them needs an arm whose rows differ in length, which no arm has.`);

// ── 4. Was the offer-size change a choice, or entailed? ──────────────────────
//
// §2 of Theseus's memo registers "three fields move and they have to" as the weakest structural
// claim in the build. It is stronger than he wrote it, and the algebra says why:
//
//     markOffset = 2G − 1            (independent of L and F)
//     trailWidth = 2F + 3            (independent of L and G)
//     eviction   ⇒ G ≤ F − 9
//
// so pinning the offset to +15 pins G = 8, which forces F ≥ 17, which forces the offer to be at
// least 37 rows. The denominator change §8 worries about is not a design decision — it is
// entailed by the same bound that makes the arm feasible at all. §2 and §8 are one problem.
console.log('\n── was the 27 → ' + qg.trailWidth + ' offer change chosen, or forced? ──\n');
console.log(`  markOffset = 2G−1 and trailWidth = 2F+3, with eviction requiring G ≤ F−9.`);
console.log(`  Restriction at +${qg.markOffset} ⇒ G = ${Q_CFG.gapPairs} ⇒ F ≥ ${Q_CFG.gapPairs + 9} ⇒ offer ≥ ${2 * (Q_CFG.gapPairs + 9) + 3} rows.\n`);
console.log('   F   G  offer  fraction-reading reach  clearance  verdict');
for (let F = Q_CFG.gapPairs + 9; F <= Q_CFG.gapPairs + 18; F++) {
  const width = 2 * F + 3;
  const reach = Math.floor(ceilFrac * width);
  const cl = qg.markOffset - reach;
  console.log(
    `  ${String(F).padStart(2)}   ${Q_CFG.gapPairs}  ${String(width).padStart(5)}  ` +
    `${('+' + reach).padStart(21)}  ${String(cl).padStart(9)}  ` +
    `${cl > 0 ? 'survives' : 'REACHED — prediction fails'}${F === Q_CFG.fillerPairs ? '   ← arm Q' : ''}`
  );
}
console.log(`\n  So F = ${Q_CFG.fillerPairs} is not merely the cheapest feasible list — it is one of only two`);
console.log(`  feasible values whose prediction survives the fraction reading at all, and it has`);
console.log(`  the widest clearance of those two. Every larger offer is nearer the start`);
console.log(`  proportionally, so the fraction reading eats it. Theseus picked F = ${Q_CFG.fillerPairs} because it is`);
console.log(`  the list that exists; that it is also the fraction-optimal choice is luck, but it is`);
console.log(`  checkable luck and the arm should not be re-specified to a longer list.`);

if (sinks) {
  console.log(`\n✗ ${sinks} puts the restriction inside the predicted read. §8 is not just a`);
  console.log(`  limit on interpretation — it reaches the result. Do not run Q on this pre-registration.`);
  process.exit(1);
}
console.log(`\nOK — the restriction at +${qg.markOffset} is past all three ceilings under both renders.`);
console.log('The arm predicts a miss on every reading of the appetite, so the ambiguity is a limit');
console.log('on what a miss will MEAN, not on whether one is predicted. Thinnest clearance is the');
console.log('fraction reading on the single-match render, which is the render N1 produced live ×5.');
