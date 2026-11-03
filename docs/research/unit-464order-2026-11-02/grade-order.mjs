#!/usr/bin/env node
// grade-order — grades the SIX predictions of PRE-REGISTRATION.md.
//
// Structure, deliberate: `legs` carries ONLY input-integrity and non-vacuity gates. Not one leg
// asserts a registered prediction, because a leg that asserts a prediction is red forever once the
// prediction is refuted — three separate instruments in this tree have now shipped that defect.
// [[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]
// Every verdict goes through `verdict()`, which prints its REGISTERED threshold beside the MEASURED
// value, so the recording re-derives without re-running.
// [[feedback_exit_0_without_a_summary_line_is_not_a_measurement]]

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const PIN = process.env.PIN ?? '1411a7d7';
const MY_TSV = 'docs/research/unit-464reach-2026-11-02/HAND-READ-13.tsv';
const HIS_TSV = 'docs/research/unit-464subkind-2026-11-02/HAND-CRITERIA-13.tsv';
const AXES = 'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv';
// ENTRY is overridable for ONE purpose: the cripple drive, which perturbs a COPY of the entry (the
// SUBJECT, not the key) to show GV12 can redden. The pinned-rev comparison in GV11VERBATIM still
// reads the committed path, so a cripple that perturbs only the V12 fence moves exactly one leg.
// [[feedback_a_cripple_map_must_name_whether_it_perturbs_the_key_or_the_subject]]
const ENTRY_LIVE = process.argv[2] ?? 'docs/research/LEG-CLASS-CONVENTION.md';
const ENTRY = 'docs/research/LEG-CLASS-CONVENTION.md';

const git = (args) => {
  try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch { return null; }
};
const bytes = (s) => Buffer.byteLength(s, 'utf8');

const legs = [];
const check = (name, ok, why) => { legs.push({ name, ok: !!ok, why }); };
const refuse = (name, why) => { legs.push({ name, ok: false, why: `REFUSED — ${why}` }); };

const verdicts = [];
const verdict = (id, registered, measured, lands) =>
  verdicts.push({ id, registered, measured, lands });

const tsvRows = (text, label) => {
  const lines = text.split('\n');
  const h = lines.findIndex((l) => l.startsWith('file\tline\tid\t'));
  if (h < 0) return null;
  const cols = lines[h].split('\t');
  return lines.slice(h + 1)
    .filter((l) => l.trim() !== '' && !l.startsWith('#'))
    .map((l) => {
      const o = Object.fromEntries(l.split('\t').map((v, i) => [cols[i] ?? `c${i}`, v]));
      o.__key = `${o.file}|${o.line}|${o.id}`;
      o.__from = label;
      return o;
    });
};

// ------------------------------------------------------------------- inputs, and where each is read
// My OWN axis read is read at HEAD, not at the subject pin: an instrument's own input cannot be
// pinned to the rev of the thing it grades. His criteria TSV predates the pin, so it is read AT the
// pin, with a leg asserting pin and HEAD cannot have diverged.
const axesHead = git(['show', `HEAD:${AXES}`]);
const axesWork = (() => { try { return readFileSync(AXES, 'utf8'); } catch { return null; } })();
if (axesHead === null || axesWork === null) {
  refuse('GINPUTREV', `my own axis TSV is unreadable (HEAD ${axesHead === null ? 'missing' : 'ok'}, worktree ${axesWork === null ? 'missing' : 'ok'})`);
} else {
  check('GINPUTREV', axesHead === axesWork,
    `my own axis read is graded from its COMMITTED form: HEAD blob ${bytes(axesHead)} bytes, `
    + `worktree ${bytes(axesWork)} bytes, identical ${axesHead === axesWork}`);
}

const hisAtPin = git(['show', `${PIN}:${HIS_TSV}`]);
const hisAtHead = git(['show', `HEAD:${HIS_TSV}`]);
check('GHISFROZEN', hisAtPin !== null && hisAtPin === hisAtHead,
  `his criteria TSV cannot have diverged between the pin and HEAD: ${bytes(hisAtPin ?? '')} bytes at `
  + `${PIN}, ${bytes(hisAtHead ?? '')} at HEAD, identical ${hisAtPin === hisAtHead}`);

const myAtPin = git(['show', `${PIN}:${MY_TSV}`]);
if (myAtPin === null || hisAtPin === null || axesHead === null) {
  console.log('');
  console.log('UNRUNNABLE — one of the three inputs could not be read. Nothing below is a measurement.');
  for (const l of legs) console.log(`  ${l.ok ? 'ok  ' : 'RED '} ${l.name}  ${l.why}`);
  process.exit(2);
}

const mine = tsvRows(myAtPin, 'mine');
const his = tsvRows(hisAtPin, 'his');
const axes = tsvRows(axesHead, 'axes');
if (!mine || !his || !axes) {
  refuse('GROWKEY', 'at least one input has no parseable header row');
  console.log('UNRUNNABLE');
  process.exit(2);
}

const keysOf = (rs) => rs.map((r) => r.__key).sort();
const sameMembers = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
check('GROWKEY',
  mine.length === 13 && sameMembers(keysOf(mine), keysOf(his)) && sameMembers(keysOf(mine), keysOf(axes)),
  `the three inputs key on the same 13 (file,line,id) rows — compared as MEMBER LISTS, not counts: `
  + `mine ${mine.length}, his ${his.length}, axes ${axes.length}; `
  + `mine==his ${sameMembers(keysOf(mine), keysOf(his))}, mine==axes ${sameMembers(keysOf(mine), keysOf(axes))}`);

const byKey = (rs) => new Map(rs.map((r) => [r.__key, r]));
const M = byKey(mine); const H = byKey(his); const A = byKey(axes);
const KEYS = keysOf(mine);

// -------------------------------------------------------------------------- the subject files at pin
const files = [...new Set(mine.map((r) => `docs/research/${r.file}`))];
const drift = files.filter((p) => git(['show', `${PIN}:${p}`]) !== git(['show', `HEAD:${p}`]));
check('GSUBJECTPIN', drift.length === 0,
  `all ${files.length} subject files byte-identical at ${PIN} and HEAD, so the pin costs nothing `
  + `and is still the only thing between a correct read and a silent mis-aim; drifted [${drift.join(',')}]`);

// ------------------------------------------------------------------------------- the axes, as values
const AXIS_A = ['conjunctive', 'delta', 'identity'];
const AXIS_B = ['immovable', 'movable', 'history-keyed'];
const badA = axes.filter((r) => !AXIS_A.includes(r.axisA));
const badB = axes.filter((r) => !AXIS_B.includes(r.axisB));
const tallyOf = (rs, f) => rs.reduce((o, r) => { const k = f(r); o[k] = (o[k] ?? 0) + 1; return o; }, {});
check('GAXISATOTAL', badA.length === 0 && axes.length === 13,
  `axis A is total and single-valued over 13 rows: ${JSON.stringify(tallyOf(axes, (r) => r.axisA))}; `
  + `off-vocabulary [${badA.map((r) => `${r.__key}=${r.axisA}`).join(',')}]`);
check('GAXISBTOTAL', badB.length === 0 && axes.length === 13,
  `axis B is total and single-valued over 13 rows: ${JSON.stringify(tallyOf(axes, (r) => r.axisB))}; `
  + `off-vocabulary [${badB.map((r) => `${r.__key}=${r.axisB}`).join(',')}]`);

// ---------------------------------------------------- the ordered key, DERIVED from his c1..c4 alone
const CRIT = ['c1', 'c2', 'c3', 'c4'];
const LABEL = { c1: 'conjunctive', c2: 'delta', c3: 'staleness', c4: 'inert' };
const FALLTHROUGH = 'keyed';
const undecidable = his.filter((r) => CRIT.some((c) => r[c] === '?'));
const derive = (row, order) => {
  for (const c of order) if (row[c] === 'T') return LABEL[c];
  return FALLTHROUGH;
};
if (undecidable.length > 0) {
  refuse('GNOUNDECIDED', `${undecidable.length} row(s) carry a '?' in a criterion, so no first-yes label `
    + `can be derived without folding undecidable into F: [${undecidable.map((r) => r.__key).join(',')}]`);
} else {
  check('GNOUNDECIDED', true, `no row carries '?' in c1..c4, so every first-yes label is derived and `
    + `none is a silent fold of undecidable into F (13 rows × 4 criteria read)`);
}
const DEFAULT_ORDER = ['c1', 'c2', 'c3', 'c4'];
const derivedLabel = new Map(KEYS.map((k) => [k, derive(H.get(k), DEFAULT_ORDER)]));
const publishedLabel = new Map(KEYS.map((k) => [k, M.get(k).subkind5]));

const departures = KEYS.filter((k) => derivedLabel.get(k) !== publishedLabel.get(k));
console.log('[MEAS] the five-way key, derived from HIS c1..c4 under MY registered order c1<c2<c3<c4:');
console.log(`       ${JSON.stringify(tallyOf(KEYS.map((k) => ({ l: derivedLabel.get(k) })), (r) => r.l))}`);
console.log('[MEAS] the five-way key as I PUBLISHED it in HAND-READ-13.tsv:');
console.log(`       ${JSON.stringify(tallyOf(KEYS.map((k) => ({ l: publishedLabel.get(k) })), (r) => r.l))}`);
console.log(`[MEAS] departures: ${departures.length} of 13`);
for (const k of departures) {
  const h = H.get(k);
  console.log(`       ${k}  published=${publishedLabel.get(k)}  derived=${derivedLabel.get(k)}  `
    + `c1..c4=${CRIT.map((c) => h[c]).join('')}`);
}

// ------------------------------------------------------------------------------------------ P1
const idxOfLabel = (lab) => (lab === FALLTHROUGH ? 5 : CRIT.indexOf(Object.keys(LABEL).find((c) => LABEL[c] === lab)) + 1);
const p1Rows = departures.map((k) => {
  const h = H.get(k);
  const mineIdx = idxOfLabel(publishedLabel.get(k));
  const earlierYes = CRIT.slice(0, Math.max(0, mineIdx - 1)).filter((c) => h[c] === 'T');
  return { k, mineIdx, earlierYes };
});
for (const r of p1Rows) {
  console.log(`[P1] ${r.k}: my label is criterion ${r.mineIdx}; earlier criteria answering T: `
    + `[${r.earlierYes.join(',')}] (${r.earlierYes.length})`);
}
const p1 = p1Rows.filter((r) => r.earlierYes.length > 0).length;
check('GP1NONVACUOUS', departures.length > 0,
  `P1's population is non-empty — ${departures.length} departure row(s); a 0-of-0 "3 of 3" would be vacuous`);
verdict('P1', '3 of 3 departure rows have an earlier criterion answering T',
  `${p1} of ${p1Rows.length}`, p1 === 3 && p1Rows.length === 3);

// -------------------------------------------------- P2: comparison operators in the registered span
// The surface is the REGISTERED SPAN only — the same surface a refusal rule keyed on "no comparison
// operator in the predicate" would read. Stated blindness, demonstrated below on :161: an operator
// inside an operand's DERIVATION is outside this span, so the count cannot see it.
const OPS = /===|!==|==|!=|<=|>=|<|>/g;
const spanOf = (srcStripped, line) => {
  const all = srcStripped.split('\n');
  let depth = 0; let started = false; let out = [];
  for (let i = line - 1; i < all.length; i++) {
    const l = all[i];
    out.push(l);
    for (const ch of l) {
      if (ch === '(') { depth++; started = true; }
      else if (ch === ')') depth--;
    }
    if (started && depth <= 0) return out.join('\n');
    if (out.length > 40) return null;
  }
  return null;
};
const srcCache = new Map();
const strippedAt = (p) => {
  if (!srcCache.has(p)) {
    const raw = git(['show', `${PIN}:${p}`]);
    srcCache.set(p, raw === null ? null : stripSource(raw, true));
  }
  return srcCache.get(p);
};
const opCounts = new Map();
let unliftable = [];
for (const k of KEYS) {
  const r = M.get(k);
  const s = strippedAt(`docs/research/${r.file}`);
  const span = s === null ? null : spanOf(s, Number(r.line));
  if (span === null) { unliftable.push(k); opCounts.set(k, null); continue; }
  opCounts.set(k, (span.match(OPS) ?? []).length);
}
check('GSPANLIFT', unliftable.length === 0,
  `every one of the 13 registered spans lifted from the PINNED source by paren balance over the `
  + `comment- and string-blanked text; unliftable [${unliftable.join(',')}]`);
for (const k of KEYS) console.log(`[MEAS] ops in span  ${k}  ${opCounts.get(k)}`);

// Known positives, hand-verified off slice1.13rows-at-1411a7d7.out, so a 0 elsewhere is a reading
// and not a dead counter. [[feedback_a_known_positive_must_carry_the_property_not_an_analogy]]
const KP71 = 'unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs|71|GCURE';
const KP88 = 'unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs|88|GPATHS';
const KP161 = 'unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs|161|GCTRLPRE';
check('GOPKP', opCounts.get(KP71) >= 2 && opCounts.get(KP88) >= 1,
  `the operator counter fires where the slice shows operators: :71 has ${opCounts.get(KP71)} `
  + `(\`=== 4\`, \`=== 3\` — both state-vs-LITERAL), :88 has ${opCounts.get(KP88)} (\`===\`, state-vs-state); `
  + `so a 0 elsewhere is a reading, not a dead counter`);
check('GSPANBLIND', opCounts.get(KP161) >= 1,
  `the span-only surface is DEMONSTRABLY blind, not assumed so: :161 counts ${opCounts.get(KP161)} `
  + `operator(s) in its span and every one is state-vs-LITERAL, while its FIGURE is a live-vs-frozen `
  + `identity count built in \`preCtrlMatches\` one line above the span`);

const ambiguous = KEYS.filter((k) => H.get(k).c1 === 'T' && H.get(k).c2 === 'T');
const zeroOps = ambiguous.filter((k) => opCounts.get(k) === 0);
console.log(`[P2] rows his read marks c1=T AND c2=T: [${ambiguous.join(' ; ')}]`);
for (const k of ambiguous) console.log(`[P2]   ${k} ops=${opCounts.get(k)}`);
check('GP2NONVACUOUS', ambiguous.length === 2,
  `P2's population is the 2 rows whose criterion-2 value is an interpretation rather than a reading; `
  + `measured ${ambiguous.length}`);
verdict('P2', 'a refusal keyed on "zero comparison operators" fires on exactly 1 of the 2 ambiguous rows',
  `${zeroOps.length} of ${ambiguous.length}`, zeroOps.length === 1 && ambiguous.length === 2);

// --------------------------------------------------------------------- P3: is 2-before-4 measured?
const c2T = KEYS.filter((k) => H.get(k).c2 === 'T');
const c4T = KEYS.filter((k) => H.get(k).c4 === 'T');
const both24 = KEYS.filter((k) => H.get(k).c2 === 'T' && H.get(k).c4 === 'T');
check('GP3NONVACUOUS', c2T.length > 0 && c4T.length > 0,
  `neither conjunct is empty, so "0 rows have both" is a measurement and not a filter artefact: `
  + `c2=T on ${c2T.length} row(s), c4=T on ${c4T.length} row(s)`);
console.log(`[P3] c2=T: [${c2T.join(' ; ')}]`);
console.log(`[P3] c4=T: [${c4T.join(' ; ')}]`);
verdict('P3', '0 of 13 rows have c2=T AND c4=T, so no row separates criterion-2-before-4 from 4-before-2',
  `${both24.length} of 13${both24.length ? ` [${both24.join(' ; ')}]` : ''}`, both24.length === 0);

// --------------------------------------------- P4: all 24 orderings of the four asked criteria
const perms = (xs) => xs.length <= 1 ? [xs]
  : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
const ORDERS = perms(CRIT);
const cellsFor = (order) => {
  const o = {};
  for (const k of KEYS) { const l = derive(H.get(k), order); (o[l] ??= []).push(k); }
  for (const l of Object.keys(o)) o[l].sort();
  return o;
};
const allCells = ORDERS.map((o) => ({ order: o.join('<'), cells: cellsFor(o) }));
const keyedLists = new Set(allCells.map((c) => (c.cells[FALLTHROUGH] ?? []).join(' ; ')));
const varying = new Set();
for (const lab of [...Object.values(LABEL), FALLTHROUGH]) {
  const lists = new Set(allCells.map((c) => (c.cells[lab] ?? []).join(' ; ')));
  if (lists.size > 1) varying.add(lab);
  console.log(`[P4] cell ${lab}: ${lists.size} distinct member list(s) across ${ORDERS.length} orderings`);
}
const rowVaries = KEYS.filter((k) => new Set(ORDERS.map((o) => derive(H.get(k), o))).size > 1);
check('GP4NONVACUOUS', rowVaries.length > 0,
  `order-invariance of the bottom cell is not trivial: ${rowVaries.length} of 13 row(s) take more than `
  + `one label across the 24 orderings — [${rowVaries.join(' ; ')}]`);
check('GP4ORDERCOUNT', ORDERS.length === 24,
  `all orderings of the four ASKED criteria are enumerated (criterion 5 is the fallthrough and cannot `
  + `move): ${ORDERS.length} = 4!`);
verdict('P4', 'the keyed member list is identical across all 24 orderings, and >=1 other cell varies',
  `keyed has ${keyedLists.size} distinct member list(s) across 24; cells that vary: `
  + `[${[...varying].join(',')}] (${varying.size})`,
  keyedLists.size === 1 && varying.size >= 1 && !varying.has(FALLTHROUGH));
console.log(`[P4] the one keyed member list: [${[...keyedLists][0]}]`);

// ------------------------------------------------------ P5: two axes, and the hazard cell's members
const cross = {};
for (const k of KEYS) {
  const a = A.get(k);
  (cross[`${a.axisA} × ${a.axisB}`] ??= []).push(k);
}
for (const c of Object.keys(cross).sort()) console.log(`[P5] ${c}: ${cross[c].length}  [${cross[c].join(' ; ')}]`);
const total = Object.values(cross).reduce((n, v) => n + v.length, 0);
const hazardNew = (cross['identity × movable'] ?? []).slice().sort();
const hazardOld = (cellsFor(DEFAULT_ORDER)[FALLTHROUGH] ?? []).slice().sort();
check('GP5TOTAL', total === 13,
  `the 3×3 cross-tab is total: ${total} row-assignments over 13 rows across `
  + `${Object.keys(cross).length} non-empty cell(s)`);
// Compared as arrays AND as a joined string: a joined-string comparison alone cannot see an empty
// member. [[feedback_a_joined_string_comparison_cannot_see_an_empty_member]]
check('GP5NONEMPTY', hazardNew.length === 2 && hazardOld.length === 2,
  `both hazard member lists are non-empty before they are compared: new ${hazardNew.length}, `
  + `old ${hazardOld.length}`);
verdict('P5', 'the identity × movable member list is byte-identical to the published keyed member list',
  `lengths ${hazardNew.length} vs ${hazardOld.length}; members ${sameMembers(hazardNew, hazardOld) ? 'IDENTICAL' : 'DIFFER'} `
  + `— new [${hazardNew.join(' ; ')}] vs old [${hazardOld.join(' ; ')}]`,
  sameMembers(hazardNew, hazardOld) && hazardNew.length === 2);

// ------------------------------------------- P6: mis-prescription, ONE checker over TWO tables
// The rule, registered before it ran: a row is mis-prescribed iff its label's prescription asserts
// the figure CAN move while a true criterion of that row says it cannot.
const MOVES = {
  // the ordered key's own table, from the entry's §2.1 "what to do" column
  old: { conjunctive: true, delta: true, staleness: false, inert: false, keyed: true },
  // the two-axis table: the cell NAMES the figure, so its prescription never asserts movement the
  // axis denies. Scored by the SAME checker, which is the only reason its 0 is a measurement.
  new: {
    'conjunctive × movable': true, 'conjunctive × immovable': false, 'conjunctive × history-keyed': true,
    'delta × movable': true, 'delta × immovable': false, 'delta × history-keyed': true,
    'identity × movable': true, 'identity × immovable': false, 'identity × history-keyed': true,
  },
};
const cannotMove = (k) => {
  const h = H.get(k);
  const reasons = [];
  if (h.c3 === 'T') reasons.push('c3 (neither side live)');
  if (h.c4 === 'T') reasons.push('c4 (out of a cure\'s reach)');
  return reasons;
};
const misOld = KEYS.filter((k) => MOVES.old[derivedLabel.get(k)] === true && cannotMove(k).length > 0);
const newCellOf = (k) => `${A.get(k).axisA} × ${A.get(k).axisB}`;
const misNew = KEYS.filter((k) => MOVES.new[newCellOf(k)] === true && A.get(k).axisB === 'immovable');
for (const k of misOld) {
  console.log(`[P6] mis-prescribed under the ordered key: ${k} → ${derivedLabel.get(k)} `
    + `("the figure can move") while ${cannotMove(k).join(' and ')} says it cannot`);
}
check('GP6CHECKERKP', misOld.length > 0,
  `the SAME mis-prescription checker fires on the old prescription table — ${misOld.length} row(s) — `
  + `which is the known positive that makes its count on the new table a reading rather than a `
  + `dead checker [[feedback_a_printed_self_test_that_gates_nothing]]`);

// drive1 published `new 0 of 13` beside `old 2 of 13` as though both were counts over the same
// population. They are not. `misNew` filters on `MOVES.new[cell] === true && axisB === 'immovable'`,
// and every `× immovable` cell of the new table is false BY CONSTRUCTION — so that 0 holds for any
// assignment of any rows to cells, and quoting it as "0 of 13" credits the 13 rows with a property
// of the prescription table. [[feedback_a_conjunct_a_filter_makes_true_cannot_be_rekeyed_red]]
// Measured by EXHAUSTION over all 9 cells instead, which is both honest and stronger: the claim is
// that the new table cannot mis-prescribe, not that these 13 rows happen not to.
const ALL_CELLS = AXIS_A.flatMap((a) => AXIS_B.map((b) => `${a} × ${b}`));
const cellMisprescribes = (table, cell) =>
  table[cell] === true && cell.endsWith('× immovable');
const exhaustNew = ALL_CELLS.filter((c) => cellMisprescribes(MOVES.new, c));
// The same exhaustion over a DELIBERATELY BROKEN table, so "0 of 9" is not a dead loop.
const BROKEN = { ...MOVES.new, 'delta × immovable': true };
const exhaustBroken = ALL_CELLS.filter((c) => cellMisprescribes(BROKEN, c));
check('GP6EXHAUSTKP', ALL_CELLS.length === 9 && exhaustBroken.length === 1,
  `the exhaustion walks all ${ALL_CELLS.length} cells of the 3×3 and the same predicate finds the one `
  + `planted fault in a broken copy of the table — [${exhaustBroken.join(',')}] — so "0 of 9" below is `
  + `a reading and not a dead loop`);
verdict('P6', 'exactly 2 of 13 rows are mis-prescribed by the ordered key; the two-axis table cannot '
  + 'mis-prescribe at all, by exhaustion over all 9 cells (NOT a count over these 13 rows)',
  `old ${misOld.length} of 13 [${misOld.join(' ; ')}] · new ${exhaustNew.length} of 9 cells `
  + `(and ${misNew.length} of the 13 rows, which is entailed by the 0 of 9 and is not evidence of its own)`,
  misOld.length === 2 && exhaustNew.length === 0);

// ---------------------------------------------------- the entry: V11 preserved, V12 present or not
const liveEntry = (() => { try { return readFileSync(ENTRY_LIVE, 'utf8'); } catch { return null; } })();
const entryAtPin = git(['show', `${PIN}:${ENTRY}`]);
if (ENTRY_LIVE !== ENTRY) {
  console.log(`[CRIPPLE] the entry is being read from ${ENTRY_LIVE}, not ${ENTRY}. This is a cripple `
    + `drive: the SUBJECT is perturbed, the key is not. Grade it as a delta against the matched `
    + `no-cripple drive, not on its own.`);
}
if (liveEntry === null || entryAtPin === null) {
  refuse('GV11VERBATIM', `the entry is unreadable (worktree ${liveEntry === null}, pin ${entryAtPin === null})`);
} else {
  const fence = (s) => (s.match(/MEASURED-BLOCK-V11[\s\S]*?```/) ?? [null])[0];
  const fPin = fence(entryAtPin); const fLive = fence(liveEntry);
  check('GV11VERBATIM', !!fPin && fPin === fLive,
    `the MEASURED-BLOCK-V11 fence is byte-identical at ${PIN} and in the worktree, so `
    + `unit-464reach's own GDOCPIN still grades the figures it was filed against: `
    + `${bytes(fPin ?? '')} vs ${bytes(fLive ?? '')} bytes, identical ${fPin === fLive}`);
  const hasV12 = /MEASURED-BLOCK-V12/.test(liveEntry);
  console.log(`[MEAS] the entry carries a MEASURED-BLOCK-V12 fence: ${hasV12}`);
  // GV12 — the promoted figures must match the measured ones. It does NOT recompute what it grades:
  // every `want` below is the value this run already measured above, and the leg only asks whether
  // the entry's own markdown says it. [[feedback_a_pin_that_recomputes_what_it_grades_is_hollow]]
  const v12 = (liveEntry.match(/MEASURED-BLOCK-V12[\s\S]*?```/) ?? [null])[0];
  if (!hasV12) {
    console.log('[PENDING] GV12: the entry carries no MEASURED-BLOCK-V12 fence yet, so there are no '
      + 'promoted v1.2 figures to pin. This drive records the measurements; the promotion drive pins them.');
  } else if (!v12) {
    refuse('GV12', 'the entry mentions MEASURED-BLOCK-V12 but no fence closes after it');
  } else {
    const norm = (s) => s.replace(/×/g, 'x').replace(/[ \t]+/g, ' ');
    const body = norm(v12);
    const want = [
      ...Object.entries(cross).map(([c, v]) => [`cell ${c}`, new RegExp(`${norm(c)} ${v.length}\\b`)]),
      ...Object.entries(tallyOf(axes, (r) => r.axisA)).map(([k, v]) => [`axisA ${k}`, new RegExp(`${k} ${v}\\b`)]),
      ...Object.entries(tallyOf(axes, (r) => r.axisB)).map(([k, v]) => [`axisB ${k}`, new RegExp(`${k} ${v}\\b`)]),
      ['hazard member 1', /grade-the-attrib-cure\.mjs:161 GCTRLPRE/],
      ['hazard member 2', /grade-the-steal-cures\.mjs:211 GROWREPRO/],
      ['keyed distinct lists', new RegExp(`keyed ${keyedLists.size} distinct member list`)],
      ['rows that vary', new RegExp(`${rowVaries.length} of 13 rows take more than one label`)],
      ['mis-prescribed old', new RegExp(`ordered key ${misOld.length} of 13`)],
      ['mis-prescribed new', new RegExp(`two axes ${exhaustNew.length} of 9 CELLS`)],
    ];
    const absent = want.filter(([, re]) => !re.test(body)).map(([k]) => k);
    check('GV12', absent.length === 0,
      `every v1.2 figure this run measured appears in the entry's own MEASURED-BLOCK-V12 as written `
      + `(${want.length} checked, ${bytes(v12)} bytes of fence); absent [${absent.join(',')}]`);
  }
  console.log(`[MEAS] the entry's version header line: ${(liveEntry.match(/^\*\*v1\.\d.*$/m) ?? ['(none)'])[0]}`);
  // Not a gate — a measurement of one of my own filed instruments. unit-464reach's GDOCPIN gates on
  // /v1\.1/ matching the entry anywhere, and a v1.2 entry still says "v1.1" in its own changelog
  // paragraph, so that version key cannot tell the two apart. The drive that re-runs grade-reach.mjs
  // against the edited entry is the honest check, not a leg here.
  console.log(`[MEAS] /v1\\.1/ still matches the live entry (so GDOCPIN's version key is insensitive `
    + `to the bump): ${/v1\.1/.test(liveEntry)}`);
}

const dirty = git(['status', '--porcelain', '--', 'packages/', 'scripts/']) ?? '';
check('GNODEPEND', dirty.length === 0,
  `git status --porcelain -- packages/ scripts/ is ${dirty.length} bytes, asserted INSIDE the harness `
  + `rather than by hand`);

// ---------------------------------------------------------------------------------------- verdict
console.log('');
console.log(`unit-464order — ${legs.length} legs`);
for (const l of legs) console.log(`  ${l.ok ? 'ok  ' : 'RED '} ${l.name}  ${l.why}`);
console.log('');
console.log('PREDICTIONS — registered threshold beside measured value:');
for (const v of verdicts) {
  console.log(`  ${v.lands ? 'LANDS   ' : 'REFUTED '} ${v.id}`);
  console.log(`      registered: ${v.registered}`);
  console.log(`      measured:   ${v.measured}`);
}
const red = legs.filter((l) => !l.ok);
console.log('');
console.log(`${red.length === 0 ? 'GREEN' : 'RED'} at ${legs.length} legs`
  + `${red.length ? ` — [${red.map((l) => l.name).join(',')}]` : ''}`);
console.log(`${verdicts.filter((v) => v.lands).length} of ${verdicts.length} predictions land`);
process.exit(red.length === 0 ? 0 : 1);
