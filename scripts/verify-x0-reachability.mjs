#!/usr/bin/env node
/**
 * verify-x0-reachability.mjs — Round 114 (Theseus, 2026-08-29 START)
 *
 * Round 113 §3 raised the arm-S ambiguity count from Theseus's 7-of-10 to 10-of-10. The three
 * shapes it added are ambiguous "for the mirror reason — a later `sep 0` is a miss or a productive
 * second neighbourhood". That mirror reason is carried by exactly one render kind, `X0`:
 *
 *     X0  sep=0  productive=true  nbhd=X  — a SECOND distinct productive neighbourhood, one excerpt
 *
 * and Round 113 §3 attributes its provenance to Theseus's Round 112 artifact read:
 * "The kind that breaks it is one your artifact read created."
 *
 * This script checks two things the Round 113 verifier does not:
 *
 *   (a) WHAT THE ARTIFACT READ ACTUALLY ESTABLISHED. Round 112 §3 established that a sep-0 render
 *       can be PRODUCTIVE. `X0` needs more than that: the productive sep-0 render must expose a
 *       neighbourhood NOT ALREADY RENDERED. Those are different claims. This derives, per search
 *       call, the rendered neighbourhood's row set from the offered gap addresses, and asks whether
 *       any sep-0 render in the ten-run corpus introduced a distinct neighbourhood.
 *
 *   (b) WHAT THE 10-OF-10 RESTS ON. Re-runs the Round 113 S-exposed enumeration with `X0` present
 *       and absent, and reports which sep-shapes lose their ambiguity when it is absent.
 *
 * The enumeration is over what arm S CAN produce, so an unattested kind is not thereby unreachable
 * — arm S is unspent and its geometry is one-target, not the corpus's two-target. The point is to
 * establish which of the two numbers is load-bearing on which assumption, and to name the
 * assumption. Per rule 15: `X0` is a kind the clause's antecedent can name and no recorded or
 * derived field in the corpus witnesses.
 *
 * Reads .testdata/ probe JSONs (this seat only; .testdata/ is gitignored). Exits 1 on self-check
 * failure.
 */

import fs from 'node:fs';

const failures = [];
const check = (label, actual, want) => {
  const ok = JSON.stringify(actual) === JSON.stringify(want);
  if (!ok) failures.push({ label, actual, want });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label} — ${JSON.stringify(actual)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
};

// ── (a) The corpus: does any sep-0 render introduce a distinct neighbourhood? ──────────────────

const RUNS = [
  ['Q L1', 'R94L1-Q'], ['Q L2', 'R94L2-Q'], ['Q L3', 'R94L3-Q'],
  ['Q L4', 'R94L4-Q'], ['Q L5', 'R94L5-Q'],
  ['R L1', 'R106L1-R'], ['R L2', 'R106L2-R'], ['R L3', 'R106L3-R'],
  ['R L4', 'R106L4-R'], ['R L5', 'R106L5-R'],
];

/**
 * The rendered neighbourhood, as a row set, derived from the gap addresses the render offers.
 * A render over an N-message conversation shows every row NOT covered by an offered gap; the gap
 * addresses are {conversation, from, to} inclusive. Distinct offers repeat when two excerpts share
 * an interior gap, so they are de-duplicated first.
 */
function renderedRows(call, total) {
  const r = call.rendered;
  if (!r || r.shownCount === 0) return null;
  const gaps = new Map();
  for (const a of r.addressesOffered ?? []) {
    const o = typeof a === 'string' ? JSON.parse(a) : a;
    gaps.set(`${o.conversation}:${o.from}-${o.to}`, o);
  }
  const hidden = new Set();
  for (const g of gaps.values()) for (let i = g.from; i <= g.to; i++) hidden.add(i);
  const shown = [];
  for (let i = 1; i <= total; i++) if (!hidden.has(i)) shown.push(i);
  return shown;
}

const contiguousBlocks = (rows) => {
  const out = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && r === last[1] + 1) last[1] = r;
    else out.push([r, r]);
  }
  return out.map(([a, b]) => `${a}-${b}`);
};

console.log('=== (a) Every sep-0 render in the ten-run corpus — is any a DISTINCT neighbourhood? ===\n');

const sepTable = {};
const sepZero = [];      // every sep-0 render
const distinctAtZero = []; // sep-0 renders that introduced rows not yet rendered in that run

for (const [id, file] of RUNS) {
  const run = JSON.parse(fs.readFileSync(`.testdata/recall-probe-${file}.json`, 'utf8'))[0];
  const total = run.structural.scopedTotal;
  const searches = run.toolCalls.filter((c) => c.kind === 'search');
  sepTable[id] = searches.map((c) => c.rendered?.excerptSeparators ?? 0);

  const seenRows = new Set();
  const lines = [];
  searches.forEach((c, i) => {
    const sep = c.rendered?.excerptSeparators ?? 0;
    const rows = renderedRows(c, total);
    const blocks = rows ? contiguousBlocks(rows) : [];
    const fresh = rows ? rows.filter((r) => !seenRows.has(r)) : [];
    const introducesDistinct = fresh.length > 0 && i > 0;
    if (sep === 0) {
      sepZero.push({ run: id, call: i + 1, rows: c.rows, productive: c.rows > 0, blocks, freshCount: fresh.length });
      if (c.rows > 0 && introducesDistinct) distinctAtZero.push(`${id} call${i + 1}`);
    }
    lines.push(
      `    call${i + 1} sep=${sep} rows=${c.rows} ` +
      `nbhd=[${blocks.join(' ')}]`.padEnd(24) +
      `${i > 0 ? (fresh.length ? `+${fresh.length} NEW row(s)` : 'no new rows — repeat/subset') : '(first render)'}`,
    );
    for (const r of rows ?? []) seenRows.add(r);
  });
  console.log(`  ${id}  seps=[${sepTable[id].join(',')}]`);
  for (const l of lines) console.log(l);
}

const productiveZero = sepZero.filter((s) => s.productive);
const rowsZeroZero = sepZero.filter((s) => !s.productive);
// A sep>=1 render that introduced new rows — the attested "distinct second neighbourhood" kind.
const distinctAtOne = [];
for (const [id, file] of RUNS) {
  const run = JSON.parse(fs.readFileSync(`.testdata/recall-probe-${file}.json`, 'utf8'))[0];
  const total = run.structural.scopedTotal;
  const searches = run.toolCalls.filter((c) => c.kind === 'search');
  const seen = new Set();
  searches.forEach((c, i) => {
    const sep = c.rendered?.excerptSeparators ?? 0;
    const rows = renderedRows(c, total) ?? [];
    if (i > 0 && sep >= 1 && rows.some((r) => !seen.has(r))) distinctAtOne.push(`${id} call${i + 1}`);
    for (const r of rows) seen.add(r);
  });
}

console.log(`\n  sep-0 renders:                                    ${sepZero.length}`);
console.log(`    of those, rows=0 (unproductive miss, kind M):    ${rowsZeroZero.length}  — ${rowsZeroZero.map((s) => `${s.run} call${s.call}`).join(', ')}`);
console.log(`    of those, PRODUCTIVE (rows>0):                   ${productiveZero.length}`);
console.log(`    of the productive ones, introducing a NEW nbhd:  ${distinctAtZero.length}${distinctAtZero.length ? ` — ${distinctAtZero.join(', ')}` : '  <- the X0 witness count'}`);
console.log(`  sep>=1 renders introducing a NEW nbhd (X1-like):   ${distinctAtOne.length}  — ${distinctAtOne.join(', ')}`);
console.log(`
  Reading: every productive sep-0 render in the corpus re-rendered rows already rendered in that
  run (or was the run's first render). A distinct second neighbourhood is attested in this corpus
  ONLY at sep >= 1. So Round 112 §3's artifact read establishes kind M-vs-productive at sep 0; it
  does NOT witness X0. X0 is a geometric construction, not an observed kind.
`);

console.log('  self-checks:');
check('the corpus holds 14 sep-0 renders (Round 112 §3, Round 113 §7)', sepZero.length, 14);
check('3 of them are rows=0 misses (Round 112 §3)', rowsZeroZero.length, 3);
check('11 of them are productive (Round 112 §3)', productiveZero.length, 11);
check('Round 113 §7 could not resolve which 3 productive sep-0 renders sit in Q L3 / R L2 — this seat can',
  productiveZero.filter((s) => ['Q L3', 'R L2'].includes(s.run)).map((s) => `${s.run} call${s.call}`),
  ['Q L3 call1', 'R L2 call1', 'R L2 call5']);
check('NO productive sep-0 render introduces a distinct neighbourhood — X0 has zero witnesses', distinctAtZero.length, 0);
// NOTE: 7, not 6. 6 was this author's predicted value and it was wrong — the count includes R L2
// call2, which is easy to drop because R L2 is the five-search run and the eye stops at call 1.
// Corrected to the derived value; recorded here rather than silently overwritten, because the
// miscount is the same shape as the defect rules 12/14 exist to catch.
check('distinct second neighbourhoods ARE attested, but only at sep>=1 (kind X1)', distinctAtOne.length, 7);

// ── (b) The 10-of-10, with and without X0 ─────────────────────────────────────────────────────

const RULES = {
  ordinal: (s) => (s.length < 2 ? 'undefined' : s[1] >= 1 ? 'suppress' : 'expand'),
  free: (s) => (s.some((x) => x >= 1) ? 'suppress' : 'expand'),
  recency: (s) => (s.length === 0 ? 'undefined' : s[s.length - 1] >= 1 ? 'suppress' : 'expand'),
};
const preds = (s) => Object.values(RULES).map((f) => f(s));
const discriminates = (s) => !preds(s).includes('undefined') && new Set(preds(s)).size > 1;

const K = {
  E: { id: 'E', productive: true, nbhd: 'E', sep: 1 },
  M: { id: 'M', productive: false, nbhd: null, sep: 0 },
  X1: { id: 'X1', productive: true, nbhd: 'X', sep: 1 },
  X0: { id: 'X0', productive: true, nbhd: 'X', sep: 0 },
};
const seps = (ks) => ks.map((k) => k.sep);
const voided = (ks) => new Set(ks.filter((k) => k.productive).map((k) => k.nbhd)).size > 1;

function enumerate(first, later, maxLen) {
  const out = [];
  const rec = (cur) => { out.push([...cur]); if (cur.length >= maxLen) return; for (const k of later) rec([...cur, k]); };
  for (const f of first) rec([f]);
  return out;
}

function analyse(later) {
  const shapes = enumerate([K.E], later, 4);
  const disc = shapes.filter((s) => discriminates(seps(s)));
  const survive = disc.filter((s) => !voided(s));
  const sepShapes = [...new Set(disc.map((s) => seps(s).join(',')))];
  const ambiguous = sepShapes.filter((sp) => {
    const fam = disc.filter((s) => seps(s).join(',') === sp);
    return new Set(fam.map(voided)).size > 1;
  });
  return { kindShapes: shapes.length, disc: disc.length, survive: survive.length, sepShapes, ambiguous };
}

const withX0 = analyse([K.E, K.M, K.X1, K.X0]);
const noX0 = analyse([K.E, K.M, K.X1]);
const lost = withX0.ambiguous.filter((a) => !noX0.ambiguous.includes(a));

console.log('\n=== (b) The S-exposed ambiguity count, with X0 reachable and without ===\n');
for (const [label, r] of [['X0 REACHABLE (Round 113 §3)', withX0], ['X0 UNREACHABLE', noX0]]) {
  console.log(`  ${label}`);
  console.log(`    kind-shapes reachable (<=4 calls):   ${String(r.kindShapes).padStart(3)}`);
  console.log(`    discriminating:                      ${String(r.disc).padStart(3)}`);
  console.log(`    surviving the operative void clause: ${String(r.survive).padStart(3)}`);
  console.log(`    distinct sep-shapes:                 ${String(r.sepShapes.length).padStart(3)}`);
  console.log(`    AMBIGUOUS on seps alone:             ${String(r.ambiguous.length).padStart(3)}  — [${r.ambiguous.join('] [')}]`);
}
console.log(`\n  sep-shapes whose ambiguity is carried by X0 ALONE: ${lost.length} — [${lost.join('] [')}]`);
console.log(`  the live shape R L1 / R L5 exhibit, [1,0], is ${lost.includes('1,0') ? 'AMONG THEM' : 'not among them'}.`);
console.log(`
  Reading: the count is 10 if X0 is reachable and ${noX0.ambiguous.length} if it is not — Theseus's Round 112 number.
  The disputed 3 are exactly the shapes with no later sep>=1, where the only voider available is a
  productive sep-0 render. Note the headline "10 discriminating shapes survive" is INVARIANT: X0
  only ever ADDS voided shapes, never surviving ones. What moves is adjudicability, not power.
`);

console.log('  self-checks:');
check('with X0, ambiguity is 10 of 10 (Round 113 §3)', [withX0.ambiguous.length, withX0.sepShapes.length], [10, 10]);
check('without X0, ambiguity is 7 of 10 (Theseus, Round 112 §3)', [noX0.ambiguous.length, noX0.sepShapes.length], [7, 10]);
check('the surviving-shape headline is unchanged either way — X0 adds no power', [withX0.survive, noX0.survive], [10, 10]);
check('exactly 3 sep-shapes owe their ambiguity to X0', lost.length, 3);
check('[1,0] — the shape R L1 and R L5 actually exhibit — is one of the 3', lost.includes('1,0'), true);
check('all 3 are shapes with no later sep>=1', lost.every((sp) => !sp.split(',').slice(1).includes('1')), true);

console.log(failures.length ? `\nFAIL — ${failures.length} self-check(s) failed` : '\nPASS — all self-checks passed');
process.exit(failures.length ? 1 : 0);
