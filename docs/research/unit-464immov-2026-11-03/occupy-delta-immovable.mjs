#!/usr/bin/env node
// occupy-delta-immovable — is `delta x immovable` an OCCUPIABLE cell, and is axis B INVARIANT under
// negating axis A's polarity?
//
// Theseus's 11-02 STOP memo s6 routed me the one of my three empty v1.2 cells whose emptiness was
// NOT forced by arithmetic: `delta x immovable`, row total 3, column total 4. He deliberately did
// not look. This answers it the way he answered his: BY CONSTRUCTION, in scratch git repos under
// the OS temp dir, never in Klatch's own tree, so no worktree's index is touched.
// [[feedback_drive_a_counterfactual_in_a_scratch_git_repo]]
// [[feedback_dont_touch_the_index_while_the_sweep_drives]]
//
// THE SHAPE. `G0@80` is `identity x immovable`: `a !== b` per file over two FROZEN revs, refusing
// when they differ, i.e. asserting EQUAL. Negate the assertion and you get "the content at these
// two named revs DIFFERS" — the ordinary "the cure commit actually changed the subject" check,
// written between two pins rather than against the worktree. That is axis A `delta` over an axis B
// `immovable` figure. One keystroke from a row we already have, exactly as his cell was one
// keystroke from `C2b`.
//
// THREE ARMS, because the measurement is the DELTA between them:
//   arm A  two named revs whose content DIFFERS                  -> delta leg GREEN
//   arm B  arm A plus THREE further commits touching the path    -> figure byte-identical to A
//          ...read a second time by C2b's recency-selector shape -> which MUST move
//   arm C  a matched repo where the two named revs carry the SAME content -> delta leg RED
//
// arm B is the whole point of `immovable`, and a single reader on it proves nothing: "the figure
// did not move" is indistinguishable from "the reader is dead". So arm B is read twice, by this
// cell's reader and by the history-keyed reader, and exactly one of them must move.
// [[feedback_identical_runs_read_as_no_effect_when_all_three_are_dead]]
// [[feedback_a_refusing_signal_only_raises_a_floor]]
// [[feedback_grade_a_cripple_as_a_delta_against_a_matched_no_cripple_drive]]

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PIN = process.env.PIN ?? 'e0fbd74c';
const AXES = 'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv';

let red = 0;
let unrunnable = 0;
const check = (id, cond, msg) => {
  if (cond === true) console.log(`${id}  ok    ${msg}`);
  else { console.log(`${id}  RED   ${msg}`); red += 1; }
};
const refuse = (id, msg) => { console.log(`${id}  UNRUNNABLE  ${msg}`); unrunnable += 1; };

const g = (cwd, ...args) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return { err: String(e.message).split('\n')[0] };
  }
};
const here = (...args) => g(process.cwd(), ...args);

const SUBJECT = 'subject.txt';
const OTHER = 'unrelated.txt';

// --------------------------------------------------------------------------- build a scratch repo
// `sameContentAtBoth` chooses the arm: false -> the two named revs differ (arms A/B),
// true -> the two named revs carry byte-identical SUBJECT content (arm C). Everything else about
// the two repos is identical, so the arms are matched and the difference between them is the one
// variable. [[feedback_a_cripple_map_must_name_whether_it_perturbs_the_key_or_the_subject]]
const buildScratch = (tag, sameContentAtBoth) => {
  const root = mkdtempSync(join(tmpdir(), `klatch-464immov-${tag}-`));
  const init = g(root, 'init', '--quiet', '-b', 'main');
  if (init?.err) return { err: `git init failed: ${init.err}` };
  g(root, 'config', 'user.email', 'daedalus@example.invalid');
  g(root, 'config', 'user.name', 'unit-464immov scratch');

  writeFileSync(join(root, SUBJECT), 'the graded property: FOUR\n');
  writeFileSync(join(root, OTHER), 'nothing to do with it\n');
  g(root, 'add', '-A');
  const c1 = g(root, 'commit', '--quiet', '-m', 'baseline: the subject before the cure');
  if (c1?.err) return { err: `baseline commit failed: ${c1.err}` };
  const REV_A = g(root, 'rev-parse', 'HEAD');

  // The second named rev. In arms A/B the cure CHANGES the subject; in arm C it does not, and the
  // commit exists only because an unrelated file moved.
  if (sameContentAtBoth) writeFileSync(join(root, OTHER), 'an unrelated edit\n');
  else writeFileSync(join(root, SUBJECT), 'the graded property: THREE\n');
  g(root, 'add', '-A');
  const c2 = g(root, 'commit', '--quiet', '-m', 'the cure commit');
  if (c2?.err) return { err: `cure commit failed: ${c2.err}` };
  const REV_B = g(root, 'rev-parse', 'HEAD');

  if (typeof REV_A !== 'string' || typeof REV_B !== 'string') return { err: 'could not read both revs' };
  return { root, REV_A, REV_B };
};

// --------------------------------------------------------------------------- the four legs
// Each returns BOTH its verdict and its FIGURE, because axis B is a claim about the figure and a
// claim about a figure cannot be graded off a verdict alone.
// [[feedback_a_guard_on_identity_does_not_guard_value]]

// `delta x immovable` — THE CELL UNDER TEST. Two NAMED revs; asserts the blobs DIFFER.
const legDeltaImmovable = (r) => {
  const a = g(r.root, 'rev-parse', `${r.REV_A}:${SUBJECT}`);
  const b = g(r.root, 'rev-parse', `${r.REV_B}:${SUBJECT}`);
  if (typeof a !== 'string' || typeof b !== 'string') return { verdict: 'UNRUNNABLE', figure: null };
  return { verdict: a !== b ? 'GREEN' : 'RED', figure: `${a}|${b}`, anchors: `${r.REV_A}:${SUBJECT}|${r.REV_B}:${SUBJECT}` };
};

// `identity x immovable` — its COMPLEMENT, and `G0@80`'s shape. Same anchors, negated assertion.
const legIdentityImmovable = (r) => {
  const a = g(r.root, 'rev-parse', `${r.REV_A}:${SUBJECT}`);
  const b = g(r.root, 'rev-parse', `${r.REV_B}:${SUBJECT}`);
  if (typeof a !== 'string' || typeof b !== 'string') return { verdict: 'UNRUNNABLE', figure: null };
  return { verdict: a === b ? 'GREEN' : 'RED', figure: `${a}|${b}`, anchors: `${r.REV_A}:${SUBJECT}|${r.REV_B}:${SUBJECT}` };
};

// `delta x history-keyed` — `C2b@99`'s shape, here only as the DISCRIMINATING reader on arm B.
const legDeltaHistoryKeyed = (r) => {
  const atPin = r.REV_A;
  const atRecency = g(r.root, 'log', '-1', '--format=%H', '--', SUBJECT);
  if (typeof atRecency !== 'string' || atRecency === '') return { verdict: 'UNRUNNABLE', figure: null };
  return { verdict: atPin !== atRecency ? 'GREEN' : 'RED', figure: `${atPin}|${atRecency}`, anchors: `${r.REV_A}|git log -1 -- ${SUBJECT}` };
};

// `identity x history-keyed` — Theseus's cell, re-driven here so the lemma is demonstrated on BOTH
// columns in one harness rather than cited from his unit.
const legIdentityHistoryKeyed = (r) => {
  const atPin = r.REV_A;
  const atRecency = g(r.root, 'log', '-1', '--format=%H', '--', SUBJECT);
  if (typeof atRecency !== 'string' || atRecency === '') return { verdict: 'UNRUNNABLE', figure: null };
  return { verdict: atPin === atRecency ? 'GREEN' : 'RED', figure: `${atPin}|${atRecency}`, anchors: `${r.REV_A}|git log -1 -- ${SUBJECT}` };
};

// =========================================================================== arms A and B
const ab = buildScratch('ab', false);
if (ab.err) { refuse('GSCRATCH', `arms A/B scratch repo could not be built: ${ab.err}`); process.exit(2); }
check('GSCRATCH', /^[0-9a-f]{40}$/.test(ab.REV_A) && /^[0-9a-f]{40}$/.test(ab.REV_B) && ab.REV_A !== ab.REV_B,
  `arms A/B scratch repo built at ${ab.root} with two distinct named revs ${ab.REV_A.slice(0, 8)} / ${ab.REV_B.slice(0, 8)}`);

// The CONSTRUCTION's target, asserted before any verdict is read: the two named revs really do
// carry different SUBJECT content. [[feedback_a_mutation_counterfactual_needs_its_target_asserted]]
const blobA = g(ab.root, 'rev-parse', `${ab.REV_A}:${SUBJECT}`);
const blobB = g(ab.root, 'rev-parse', `${ab.REV_B}:${SUBJECT}`);
check('GTARGETAB', typeof blobA === 'string' && typeof blobB === 'string' && blobA !== blobB,
  `arm A's construction target is present: ${SUBJECT} has different blobs at the two named revs (${String(blobA).slice(0, 8)} vs ${String(blobB).slice(0, 8)})`);

const A_delta = legDeltaImmovable(ab);
const A_ident = legIdentityImmovable(ab);
const A_hist = legDeltaHistoryKeyed(ab);
const A_histIdent = legIdentityHistoryKeyed(ab);

console.log(`\narm A (control — two named revs, content differs, no further commits):`);
console.log(`  delta    x immovable      : ${A_delta.verdict}   figure ${A_delta.figure}`);
console.log(`  identity x immovable      : ${A_ident.verdict}   figure ${A_ident.figure}`);
console.log(`  delta    x history-keyed  : ${A_hist.verdict}   figure ${A_hist.figure}`);
console.log(`  identity x history-keyed  : ${A_histIdent.verdict}   figure ${A_histIdent.figure}`);

check('GARMA', A_delta.verdict === 'GREEN',
  `P1 half one: the delta x immovable leg reads GREEN on two named revs whose content differs (registered: GREEN) — got ${A_delta.verdict}`);

// --------------------------------------------------------------------------- arm B: THREE commits
// touching the path, AFTER both named revs. Neither anchor is a selector, so nothing the leg reads
// can move. This is the arm that separates `immovable` from `history-keyed`.
for (let i = 1; i <= 3; i += 1) {
  appendFileSync(join(ab.root, SUBJECT), `# trailing comment ${i}; the graded property above is untouched\n`);
  g(ab.root, 'add', '-A');
  const c = g(ab.root, 'commit', '--quiet', '-m', `post-cure commit ${i} touching the path`);
  if (c?.err) { refuse('GARMB', `perturbing commit ${i} failed: ${c.err} — arm B is undriven and P2 stays unmeasured`); break; }
}

const newest = g(ab.root, 'log', '-1', '--format=%H', '--', SUBJECT);
const countTouching = g(ab.root, 'rev-list', '--count', 'HEAD', '--', SUBJECT);
check('GTARGETB', typeof newest === 'string' && newest !== ab.REV_B && countTouching === '5',
  `arm B's perturbation landed: ${countTouching} commits now touch ${SUBJECT} (was 2), newest ${String(newest).slice(0, 8)} != the second named rev ${ab.REV_B.slice(0, 8)}`);

const B_delta = legDeltaImmovable(ab);
const B_ident = legIdentityImmovable(ab);
const B_hist = legDeltaHistoryKeyed(ab);
const B_histIdent = legIdentityHistoryKeyed(ab);

console.log(`\narm B (perturbed — THREE further commits touching the path, graded property untouched):`);
console.log(`  delta    x immovable      : ${B_delta.verdict}   figure ${B_delta.figure}`);
console.log(`  identity x immovable      : ${B_ident.verdict}   figure ${B_ident.figure}`);
console.log(`  delta    x history-keyed  : ${B_hist.verdict}   figure ${B_hist.figure}`);
console.log(`  identity x history-keyed  : ${B_histIdent.verdict}   figure ${B_histIdent.figure}`);

check('GIMMOV', B_delta.figure === A_delta.figure && B_delta.verdict === A_delta.verdict,
  `P2 half one — IMMOVABLE: three commits touching the path moved the leg's figure not at all (${A_delta.figure} -> ${B_delta.figure}) and its verdict not at all (${A_delta.verdict} -> ${B_delta.verdict})`);

check('GDISCRIM', B_hist.figure !== A_hist.figure && B_histIdent.verdict !== A_histIdent.verdict,
  `P2 half two — THE DISCRIMINATING READER: on the SAME arm B, the history-keyed figure DID move (${A_hist.figure} -> ${B_hist.figure}) and its identity polarity flipped ${A_histIdent.verdict} -> ${B_histIdent.verdict}. So GIMMOV above is a measurement and not a dead reader`);

// =========================================================================== arm C
const c = buildScratch('c', true);
if (c.err) { refuse('GARMC', `arm C scratch repo could not be built: ${c.err} — P1's RED half stays unmeasured`); }
else {
  const cA = g(c.root, 'rev-parse', `${c.REV_A}:${SUBJECT}`);
  const cB = g(c.root, 'rev-parse', `${c.REV_B}:${SUBJECT}`);
  check('GTARGETC', typeof cA === 'string' && cA === cB && c.REV_A !== c.REV_B,
    `arm C's construction target is present: two DISTINCT named revs (${c.REV_A.slice(0, 8)}/${c.REV_B.slice(0, 8)}) carrying BYTE-IDENTICAL ${SUBJECT} (${String(cA).slice(0, 8)})`);

  const C_delta = legDeltaImmovable(c);
  const C_ident = legIdentityImmovable(c);
  console.log(`\narm C (matched — two named revs carrying identical content):`);
  console.log(`  delta    x immovable      : ${C_delta.verdict}   figure ${C_delta.figure}`);
  console.log(`  identity x immovable      : ${C_ident.verdict}   figure ${C_ident.figure}`);

  check('GARMC', C_delta.verdict === 'RED',
    `P1 half two: the same leg reads RED when the two named revs carry identical content (registered: RED) — got ${C_delta.verdict}`);
  check('GDELTAVSCTRL', C_delta.verdict !== A_delta.verdict,
    `the matched arms DIFFER at the leg under test (${A_delta.verdict} vs ${C_delta.verdict}) — so the leg's verdict is a function of the PAIR's difference, which is what axis A `
    + `'delta' means. A single arm could not have told occupiable from dead`);

  // ------------------------------------------------------------------- P3: THE POLARITY LEMMA
  // Axis B is a claim about the FIGURE. Negating axis A's operator changes what the leg ASSERTS and
  // not what it READS, so the two polarities must present byte-identical anchors and figures, and
  // must disagree on every state pair.
  const pairs = [
    ['arm A', A_delta, A_ident],
    ['arm B', B_delta, B_ident],
    ['arm C', C_delta, C_ident],
    ['arm A hist', A_hist, A_histIdent],
    ['arm B hist', B_hist, B_histIdent],
  ];
  const sameAnchors = pairs.filter(([, d, i]) => d.anchors === i.anchors && d.figure === i.figure);
  check('GAXISBINV', sameAnchors.length === pairs.length,
    `P3's premise, measured not argued: on ${sameAnchors.length}/${pairs.length} state pairs the delta leg and its identity complement present BYTE-IDENTICAL anchors AND byte-identical figures. Axis B reads the same thing in both polarities`);

  const opposed = pairs.filter(([, d, i]) => d.verdict !== i.verdict && d.verdict !== 'UNRUNNABLE' && i.verdict !== 'UNRUNNABLE');
  check('GDELTAPOL', opposed.length === pairs.length,
    `and on ${opposed.length}/${pairs.length} state pairs the two polarities give OPPOSITE verdicts — they are complements, so they cannot both be green and cannot both be empty for want of a writable shape`);
}

// =========================================================================== P3's grid consequence
// The cross-tab is SLICED from the pinned TSV, never re-typed, so the empty-cell list and the row
// and column totals below cannot be my recollection of them.
// [[feedback_slicing_the_inputs_but_retyping_the_verdict]] [[feedback_compare_member_lists_not_counts]]
const tsv = here('show', `${PIN}:${AXES}`);
if (typeof tsv !== 'string') {
  refuse('GGRID', `cannot read ${AXES} at ${PIN} — P3's grid consequence stays unmeasured`);
} else {
  const lines = tsv.split('\n');
  const hi = lines.findIndex((l) => l.startsWith('file\tline\tid\t'));
  if (hi < 0) refuse('GGRID', 'no header row in the axes TSV');
  else {
    const cols = lines[hi].split('\t');
    const rows = lines.slice(hi + 1)
      .filter((l) => l.trim() !== '' && !l.startsWith('#'))
      .map((l) => Object.fromEntries(l.split('\t').map((v, i) => [cols[i] ?? `c${i}`, v])));
    check('GGRIDROWS', rows.length === 13, `sliced ${rows.length} rows from the axes TSV at ${PIN} (published total: 13)`);

    const A_VALS = ['conjunctive', 'delta', 'identity'];
    const B_VALS = ['immovable', 'movable', 'history-keyed'];
    const cellOf = (a, b) => rows.filter((r) => r.axisA === a && r.axisB === b);
    console.log(`\nTHE 3x3 CROSS-TAB, sliced from ${AXES} at ${PIN}:`);
    console.log(`                 ${B_VALS.map((b) => b.padStart(14)).join('')}      row`);
    for (const a of A_VALS) {
      const cells = B_VALS.map((b) => cellOf(a, b).length);
      console.log(`  ${a.padEnd(13)}  ${cells.map((n) => String(n).padStart(14)).join('')}  ${String(cells.reduce((x, y) => x + y, 0)).padStart(7)}`);
    }
    const colTot = B_VALS.map((b) => rows.filter((r) => r.axisB === b).length);
    console.log(`  ${'col'.padEnd(13)}  ${colTot.map((n) => String(n).padStart(14)).join('')}  ${String(rows.length).padStart(7)}`);

    const empties = [];
    for (const a of A_VALS) for (const b of B_VALS) if (cellOf(a, b).length === 0) empties.push(`${a} x ${b}`);
    check('GEMPTIES', empties.length === 3,
      `the sliced grid leaves ${empties.length} cells empty: [${empties.join(' ; ')}] (my published figure: 3)`);

    // The lemma's REACH, derived: a polarity cell is reachable-by-complement iff its complement in
    // the SAME column is occupied. `conjunctive` has no operand pair, so it has no complement and
    // the lemma says nothing about it — which is a statement about the lemma, not about the cell.
    const COMPLEMENT = { delta: 'identity', identity: 'delta' };
    const reachable = [];
    const outside = [];
    for (const e of empties) {
      const [a, b] = e.split(' x ');
      const comp = COMPLEMENT[a];
      if (comp === undefined) outside.push(`${e}  (axis A '${a}' has no operand pair, so no complement)`);
      else if (cellOf(comp, b).length > 0) reachable.push(`${e}  (complement '${comp} x ${b}' occupied by ${cellOf(comp, b).length}: ${cellOf(comp, b).map((r) => `${r.id}@${r.line}`).join(',')})`);
      else outside.push(`${e}  (complement '${comp} x ${b}' is itself empty)`);
    }
    console.log(`\nP3 — THE LEMMA'S REACH over the three empty cells:`);
    for (const r of reachable) console.log(`  REACHABLE-BY-COMPLEMENT  ${r}`);
    for (const o of outside) console.log(`  OUTSIDE THE LEMMA        ${o}`);

    check('GLEMMAREACH', reachable.length === 2 && outside.length === 1 && outside[0].startsWith('conjunctive x history-keyed'),
      `P3: ${reachable.length} of the 3 empty cells are reachable-by-complement from an OCCUPIED cell in their own column, and exactly ${outside.length} lies outside the lemma — ${outside[0].split('  ')[0]}`);

    // And the independent-cell count the lemma implies.
    const polarityCells = A_VALS.filter((a) => COMPLEMENT[a] !== undefined).length * B_VALS.length; // 6
    const independent = (polarityCells / 2) + (A_VALS.length - 2) * B_VALS.length; // 3 pairs + conjunctive's 3
    check('GGRIDINDEP', independent === 6,
      `P3's consequence: of the 9 cells, the ${polarityCells} delta/identity cells collapse to ${polarityCells / 2} independent pairs, leaving ${independent} independent cells, not 9`);
  }
}

console.log(`\n=========================================================`);
console.log(`drive1 (occupy delta x immovable + the polarity lemma): RED ${red} · UNRUNNABLE ${unrunnable}`);
console.log(`VERDICT ${red === 0 && unrunnable === 0 ? 'GREEN' : red > 0 ? 'RED' : 'UNRUNNABLE'}`);
console.log(`scratch repos left for inspection, both outside the Klatch tree.`);
process.exit(red > 0 ? 1 : unrunnable > 0 ? 2 : 0);
