/**
 * Round 436 — Theseus's Round 435 findings 1, 2 and 3, cured and graded.
 *
 * ## What he routed, and what changed here
 *
 *   - **§1** — `maskKeyPositions` keyed only on a depth-0 `:`, so every COLON-FREE property name
 *     stayed a free identifier: method shorthand, getter, setter, async method, generator method.
 *     `conventionOf` ADMITTED `return { span: { src() { return 1; } } }` while reading the input
 *     nowhere. Cured with a second leg keyed on the method-DEFINITION shape. `G3`, `G4`.
 *   - **§2** — `mentionsParam`'s free-identifier guard was the one-character lookbehind
 *     `(^|[^.\w$])`, and a spread's third dot satisfied the `.`. Cured by replacing the guard with
 *     a token read carrying a model of what a dot can be. `G5`, `G6`.
 *   - **§3** — the one that generalises: a `[false, false]` row in a pre-vs-cured matrix cannot be
 *     told from a holding control, because the label is authorial intent and the matrix grades
 *     MOVEMENT. `G7` carries his remedy on this side — a **runtime oracle** — and `G8` reproduces
 *     his claim as a measurement over my own Round 434 matrix rather than restating it.
 *   - **§5** — the recording my Round 430 `G7` cites had drifted. `G10`.
 *   - **§6** — "applying a lesson in one leg is not applying it to the instrument." `G11`.
 *
 * ## Why `G11` is the right instrument for his §6, and not a per-leg review
 *
 * His sharpening is that the unit of a promotion-stability review is the FILE: a count pin
 * elsewhere in the same file looks exactly like a leg you already checked. A leg-by-leg reread
 * cannot discharge that, because the thing being missed is the rereading. `G11` is keyed on the
 * whole-file diff between a drive taken before this round's promotion commit and one taken after
 * it, with every differing line required to be explained by substituting the HEAD rev alone. That
 * covers every leg in this file including the ones I was not thinking about, which is the property
 * he is asking for. It is the complement of my own §5 rule, pointed inward.
 *
 * ## The oracle, and what it cannot do
 *
 * Build the subject, call it over four inputs, ask whether the answer VALUE moves. That is the
 * property the answer-shape leg reads off source text, and it is the only thing that can grade a
 * row that does not move. It is graded rather than trusted (`G7`): it must separate both ways, and
 * it must agree with the cured module on every cell.
 *
 * Its subject is not a second copy of the source reader's subject: `SUBJ` is DERIVED from `BODY`,
 * and the callable is built from the same `BODY` text, so the text the oracle runs and the text
 * `conventionOf` reads are the same bytes by construction. `G7` asserts that rather than assuming
 * it — a hand-typed reader is not a slice (412).
 *
 * Blind spot, stated rather than found later: it reads VALUE IDENTITY. A subject mentioning the
 * input in a branch never taken, or behind a function value, reads as not-derived.
 * `{ span: { a: src === 1 ? src : 0 } }` is exactly such a subject and would produce a false
 * disagreement, which is why it is not a cell — the same exclusion he made, for the same reason.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const DIRTY = git('status', '--porcelain').trim() !== '';

const legs = [];
const preds = [];
const leg = (id, claim, detail, ok) => legs.push({ id, claim, detail, ok });
const pred = (id, claim, detail, landed) => preds.push({ id, claim, detail, landed });

const MOD = 'docs/research/round430-instruments/refusal-convention.mjs';
// Two slices, each the committed blob of the module as it stood at the end of a round. Neither is
// re-cut here: a hand-typed reader is not a slice (412), and his Round 435 reused mine for the
// same reason.
const SLICE_434 = 'docs/research/round434-instruments/precure-refusal-convention.sliced.mjs';
const SLICE_436 = 'docs/research/round436-instruments/precure-refusal-convention.sliced.mjs';
const REV_434 = '839e6063'; // what the module was BEFORE Round 434
const REV_436 = 'e2a20e75'; // what the module was BEFORE this round == Round 434's cured module

const LIVE = await import(join(REPO, MOD));
const PRE_434 = await import(join(REPO, SLICE_434));
const PRE_436 = await import(join(REPO, SLICE_436));

// ---------------------------------------------------------------------------------------------
// The subject. `SUBJ` is derived from `BODY` so the oracle's callable and the source reader's text
// are the same bytes.
// ---------------------------------------------------------------------------------------------
// `CONST` is declared IN the body rather than closed over, because the oracle has to RUN this text
// and the source reader only has to read it. Drive 1 of this round had the constant free, and the
// oracle threw `CONST is not defined` on the one cell that used it — the cell was unrunnable, which
// a source-text reading could not have told me.
const BODY = (ret) => `
  const CONST = 'ZZZZ';
  if (src === undefined) return { refused: 'no input' };
  if (src === '') return null;
  return ${ret};
`;
const SUBJ = (ret) => `function read(src) {${BODY(ret)}}`;
const HEAD_TEXT = 'function read(src) {';
const admitted = (c) => (c === null || c === undefined ? null : c.refused === undefined);

/**
 * The rev a recording was TAKEN AT, read off the recording's own stamp line.
 *
 * Exported so `promotion-diff.mjs` uses this reader rather than a second copy of it (412).
 *
 * Caught by his §6 instrument on this round's own promotion: `G1` below explained the differences
 * between a recording taken at `e2a20e75` and his, by substituting out the LIVE `REV` — so the
 * moment the promotion commit landed, the substitution stopped matching and `G1` went red. An old
 * cell sourced from HEAD inverts when the cure lands (420/422). A historical recording has to be
 * explained with the rev it was taken at, and that rev is in the file.
 */
export const revStampOf = (text) => {
  const line = text.split('\n').find((l) => l.trim().startsWith('rev ')) ?? '';
  return (line.match(/\brev ([0-9a-f]{8})/) ?? [])[1] ?? null;
};

const ORACLE_INPUTS = ['abc', 'xyz', 'abcd', 'q'];
const stable = (v) => {
  try {
    return JSON.stringify(v, (k, x) => (typeof x === 'function' ? '[fn]' : x)) ?? 'undefined';
  } catch { return 'UNSERIALISABLE'; }
};
/**
 * `{ derived: boolean }`, or `{ refused }` on a subject this oracle cannot run.
 *
 * The refusal is not decoration. Drive 1 of this round had `oracle` return a bare boolean and
 * `catch`-to-`null` at both call sites, and the one unrunnable cell (`CONST` was free, so the
 * callable threw `CONST is not defined`) was compared `null !== false` and counted by `G8` as a
 * DEFECT. A manufactured defect, and `G8`'s headline figure moved by one between drives because of
 * it. A refusal must be published as a refusal, not reach a bucket by fall-through (411).
 */
const oracle = (ret) => {
  let fn;
  try {
    // eslint-disable-next-line no-new-func
    fn = new Function('src', BODY(ret));
  } catch (e) { return { refused: `the subject does not parse: ${e.message}` }; }
  const seen = new Set();
  for (const s of ORACLE_INPUTS) {
    try { seen.add(stable(fn(s))); }
    catch (e) { return { refused: `the subject threw on input ${JSON.stringify(s)}: ${e.message}` }; }
  }
  if (seen.has('UNSERIALISABLE')) return { refused: 'an answer value did not serialise' };
  return { derived: seen.size > 1 };
};

// ---------------------------------------------------------------------------------------------
// G1 — his round reproduces, driven before anything of mine was built (328). Recorded separately;
// this leg reads the recording and the whole-file diff rather than re-driving.
// ---------------------------------------------------------------------------------------------
{
  const mineText = readFileSync(join(HERE, 'reproduce-his-round435.out'), 'utf8');
  const hisText = readFileSync(join(REPO, 'docs/research/round435-instruments/drive4.after-promotion.out'), 'utf8');
  const mine = mineText.split('\n');
  const his = hisText.split('\n');
  // Each side's rev comes out of its OWN stamp line. Using the live `REV` here was a real defect
  // and his §6 instrument found it on this round's promotion — see `revStampOf`.
  const mineRev = revStampOf(mineText);
  const hisRev = revStampOf(hisText);
  const gate = mine.find((l) => l.startsWith('GATE:')) ?? '';
  const predsLine = mine.find((l) => l.startsWith('PREDICTIONS:')) ?? '';
  const diff = [];
  for (let i = 0; i < Math.max(mine.length, his.length); i += 1) if (mine[i] !== his[i]) diff.push(i);
  // Each differing line must become IDENTICAL once each side's own HEAD rev is substituted out,
  // with a matching occurrence count. A count of differing lines passes on any two lines (426), and
  // a `/rev|HEAD/` content test is not the predicate either: one of these three lines says "in the
  // tree at <rev>" and contains neither word. Derive the predicate from what actually varies.
  const explained = mineRev !== null && hisRev !== null && mineRev !== hisRev && diff.every((i) => {
    const a = mine[i].split(mineRev).join('<HEAD>');
    const b = his[i].split(hisRev).join('<HEAD>');
    const n = mine[i].split(mineRev).length - 1;
    const m = his[i].split(hisRev).length - 1;
    return a === b && n > 0 && n === m;
  });
  leg('G1', 'his Round 435 reproduces unmodified, and the whole-file diff is the HEAD rev alone',
    `${gate} · ${predsLine} · my recording at rev ${mineRev}, his at ${hisRev} (each read off its `
    + `OWN stamp, not off live HEAD) · differing line indices ${JSON.stringify(diff)}, `
    + `every one explained by the HEAD rev alone: ${explained}`,
    gate.includes('true') && gate.includes('9 leg') && predsLine.includes('1 landed, 1 refuted: P2')
      && diff.length > 0 && explained);
}

// ---------------------------------------------------------------------------------------------
// G2 — both slices are the committed blobs they claim to be.
// ---------------------------------------------------------------------------------------------
{
  const checks = [[SLICE_434, REV_434], [SLICE_436, REV_436]].map(([p, rev]) => {
    const want = git('rev-parse', `${rev}:${MOD}`).trim();
    const got = git('hash-object', p).trim();
    return { p, rev, want, got, ok: want === got };
  });
  leg('G2', 'each pre-cure slice IS the module blob at its stamped rev',
    checks.map((c) => `${c.rev}: ${c.ok ? 'identical' : `${c.want} != ${c.got}`}`).join(' · '),
    checks.every((c) => c.ok));
}

// ---------------------------------------------------------------------------------------------
// G3 — Finding 1 at the masker. Six colon-free spellings against three controls, and the control
// that matters most is the statement block: keying on `ident (` alone would have blanked its `src`
// and reintroduced the same under-refusal as the fix for it.
// ---------------------------------------------------------------------------------------------
const F1_MASK = [
  ['{ src() { return 1; } }', false, 'method shorthand'],
  ['{ get src() { return 1; } }', false, 'getter'],
  ['{ set src(v) { } }', false, 'setter'],
  ['{ async src() { return 1; } }', false, 'async method'],
  ['{ *src() { yield 1; } }', false, 'generator method'],
  ['{ async *src() { yield 1; } }', false, 'async generator method'],
  ['{ src: 1 }', false, 'colon leg, Round 434'],
  ['{ src }', true, 'CONTROL ES6 shorthand — a genuine reference'],
  ['{ a: src }', true, 'CONTROL plain value'],
  ['{ [src]: 1 }', true, 'CONTROL computed key — a genuine reference'],
  ['{ a: ok ? src : 1 }', true, "CONTROL ternary's second colon"],
  ['{ f: () => { src(1); } }', true, 'CONTROL call at the head of a STATEMENT block'],
  ['{ f: () => { return src; } }', true, 'CONTROL return in a statement block'],
  ['{ async() { return 1; } }', false, '`async` is the NAME here, not a prefix'],
];
// The gate is the confusion matrix on the CURED module, plus the requirement that the PRE-cure
// module fails that same matrix — which is what makes the leg non-vacuous without pinning how many
// cells moved. Drive 1 pinned `moved.length === 6` and measured 5, against a matrix that was
// already clean: a count adjacent to the property instead of the property (379, 377/405/434/435).
const matrixOf = (rows, mod) => {
  const r = rows.map(([v, want, label]) => ({ label, want, got: mod.mentionsParam(v, ['src']) }));
  return {
    rows: r,
    tp: r.filter((x) => x.want && x.got).length,
    fn: r.filter((x) => x.want && !x.got).length,
    tn: r.filter((x) => !x.want && !x.got).length,
    fp: r.filter((x) => !x.want && x.got).length,
    clean: r.every((x) => x.got === x.want),
  };
};
{
  const cured = matrixOf(F1_MASK, LIVE);
  const pre = matrixOf(F1_MASK, PRE_436);
  const moved = cured.rows.filter((x, i) => x.got !== pre.rows[i].got);
  leg('G3', 'every colon-free property spelling is masked, and all six controls hold',
    `cured: TP ${cured.tp} / FN ${cured.fn} / TN ${cured.tn} / FP ${cured.fp} — clean: ${cured.clean} · `
    + `PRE-cure on the same cells: TP ${pre.tp} / FN ${pre.fn} / TN ${pre.tn} / FP ${pre.fp} — `
    + `clean: ${pre.clean} (false is what makes this leg non-vacuous) · `
    + `wrong now: ${cured.rows.filter((x) => x.got !== x.want).map((x) => x.label).join(', ') || 'none'} · `
    + `moved by the cure (a MEASUREMENT, not pinned): ${moved.length} — ${moved.map((x) => x.label).join(', ')}`,
    cured.clean && pre.clean === false);
}

// ---------------------------------------------------------------------------------------------
// G4 — Finding 1 at the real entry point, and the name-not-shape control he supplied.
// ---------------------------------------------------------------------------------------------
{
  const hit = '{ span: { src() { return 1; } } }';
  const ctl = '{ span: { q() { return 1; } } }';
  const preHit = admitted(PRE_436.conventionOf(SUBJ(hit)));
  const curHit = admitted(LIVE.conventionOf(SUBJ(hit)));
  const preCtl = admitted(PRE_436.conventionOf(SUBJ(ctl)));
  const curCtl = admitted(LIVE.conventionOf(SUBJ(ctl)));
  leg('G4', 'conventionOf no longer admits a method-shorthand property named like the input',
    `${hit}: pre ${preHit ? 'ADMITTED' : 'refused'} -> cured ${curHit ? 'admitted' : 'REFUSED'} · `
    + `CONTROL ${ctl}: ${preCtl ? 'admitted' : 'refused'} -> ${curCtl ? 'admitted' : 'refused'} `
    + '(refused both sides: the admission was about the NAME, not the shape)',
    preHit === true && curHit === false && preCtl === false && curCtl === false);
}

// ---------------------------------------------------------------------------------------------
// G5 — Finding 2 as a confusion matrix, not a known positive. A separating key needs both
// directions graded (418). `opts . src` is the third member of the same family, not reported: it
// read as a mention under the lookbehind because the character before the name was a space.
// ---------------------------------------------------------------------------------------------
const F2_MASK = [
  ['{ ...src }', true, 'spread'],
  ['{ ...src, a: 1 }', true, 'spread beside an entry'],
  ['[...src]', true, 'array spread'],
  ['f(...src)', true, 'call spread'],
  ['{ a: ... src }', true, 'spread with a space'],
  ['{ ...o.src }', false, 'CONTROL spread of a property'],
  ['{ a: opts.src }', false, 'CONTROL member access'],
  ['{ a: opts?.src }', false, 'CONTROL optional chaining'],
  ['{ a: srcPath }', false, 'CONTROL a longer identifier'],
  ['{ a: src }', true, 'CONTROL a plain reference'],
  ['{ a: opts . src }', false, 'member access with a space — the unreported third member'],
];
{
  const cured = matrixOf(F2_MASK, LIVE);
  const pre = matrixOf(F2_MASK, PRE_436);
  const moved = cured.rows.filter((x, i) => x.got !== pre.rows[i].got);
  leg('G5', 'the dot model separates spread from property access, both ways',
    `cured: TP ${cured.tp} / FN ${cured.fn} / TN ${cured.tn} / FP ${cured.fp} — clean: ${cured.clean} · `
    + `PRE-cure on the same cells: FN ${pre.fn} (the spreads) / FP ${pre.fp} (the spaced member `
    + `access) — clean: ${pre.clean} · `
    + `moved by the cure (a MEASUREMENT, not pinned): ${moved.length} — ${moved.map((x) => x.label).join(', ')}`,
    cured.clean && pre.clean === false && cured.tp > 0 && cured.tn > 0);
}

// ---------------------------------------------------------------------------------------------
// G6 — Finding 2 at the real entry point, keyed on his REASON and not just on the verdict (433).
// ---------------------------------------------------------------------------------------------
{
  const hit = '{ span: { ...src } }';
  const before = PRE_436.conventionOf(SUBJ(hit));
  const after = LIVE.conventionOf(SUBJ(hit));
  const reason = before.refused ?? '';
  leg('G6', 'conventionOf no longer over-refuses a return that spreads the input',
    `pre: refused "${reason.slice(0, 62)}…" · cured: ${admitted(after) ? 'ADMITTED' : `still refused: ${after.refused}`}`,
    admitted(before) === false
      && reason.includes('neither all-message nor input-derived')
      && reason.includes('0 derived')
      && admitted(after) === true);
}

// ---------------------------------------------------------------------------------------------
// G7 — HIS §3 REMEDY, and the oracle is graded rather than trusted.
//
// The oracle must (a) run the same bytes conventionOf reads, (b) separate both ways, (c) agree with
// the CURED module on every cell. A one-sided oracle certifies anything, and an oracle that agrees
// with the module everywhere by construction grades nothing.
// ---------------------------------------------------------------------------------------------
const CELLS = [
  // ret, label, kind
  ['{ span: src.slice(0, 1), note: 1 }', 'slices the input', 'CONTROL-derived'],
  ['{ span: src.charAt(0), note: 1 }', 'charAt of the input', 'CONTROL-derived'],
  ['{ span: { a: src }, note: 1 }', 'a nested plain reference', 'CONTROL-derived'],
  ['{ span: { ...src }, note: 1 }', 'spreads the input', 'FINDING 2'],
  ['{ span: { src: 1 }, note: 1 }', 'a KEY named like the input', 'FINDING 1 (Round 434)'],
  ['{ span: { src() { return 1; } }, note: 1 }', 'a METHOD named like the input', 'FINDING 1'],
  ['{ span: 1, note: 1 }', 'reads the input nowhere', 'CONTROL-undERIVED'],
  ['{ span: CONST.slice(0, 1), note: 1 }', 'slices a module constant', 'CONTROL-undERIVED'],
];
{
  const rows = CELLS.map(([ret, label, kind]) => {
    const subj = SUBJ(ret);
    const sameBytes = subj.startsWith(HEAD_TEXT) && subj.slice(HEAD_TEXT.length, -1) === BODY(ret);
    const orc = oracle(ret);
    const cured = admitted(LIVE.conventionOf(subj));
    return {
      label, kind, sameBytes, orc, cured,
      agree: orc.refused === undefined && orc.derived === cured,
    };
  });
  const refusals = rows.filter((r) => r.orc.refused !== undefined);
  const ran = rows.filter((r) => r.orc.refused === undefined);
  const dis = ran.filter((r) => !r.agree);
  leg('G7', 'the oracle runs the same bytes, separates both ways, and agrees with the cured module',
    `subject text identical to conventionOf's on ${rows.filter((r) => r.sameBytes).length}/${rows.length} cells · `
    + `oracle REFUSED on ${refusals.length} cell(s)`
    + `${refusals.length ? ` (${refusals.map((r) => `${r.label}: ${r.orc.refused}`).join('; ')})` : ''} · `
    + `derived ${ran.filter((r) => r.orc.derived).length} / not-derived ${ran.filter((r) => !r.orc.derived).length} · `
    + `disagreements with the cured module: ${dis.length}`
    + `${dis.length ? ` (${dis.map((r) => `${r.label} oracle=${r.orc.derived} module=${r.cured}`).join('; ')})` : ''}`,
    rows.every((r) => r.sameBytes) && refusals.length === 0
      && ran.some((r) => r.orc.derived === true) && ran.some((r) => r.orc.derived === false)
      && dis.length === 0);
}

// ---------------------------------------------------------------------------------------------
// G8 — HIS §3, REPRODUCED AS A MEASUREMENT over my own Round 434 matrix rather than restated.
//
// Reconstruct that matrix exactly: `pre` is the module at 839e6063, `cured` is the module at
// e2a20e75 — which is what Round 434 shipped. Then ask, of the rows whose signature is
// [refused, refused]: how many are controls, how many are defects, and does anything in the
// matrix tell them apart? The oracle is the only column that can.
// ---------------------------------------------------------------------------------------------
{
  const rows = CELLS.map(([ret, label, kind]) => {
    const subj = SUBJ(ret);
    const pre = admitted(PRE_434.conventionOf(subj));
    const r434 = admitted(PRE_436.conventionOf(subj)); // Round 434's CURED side
    return { label, kind, pre, r434, orc: oracle(ret), sig: `[${pre},${r434}]` };
  });
  const stuck = rows.filter((r) => r.pre === false && r.r434 === false);
  // Of the rows that do not move: a CONTROL is one Round 434's module got RIGHT (module verdict ===
  // oracle); a DEFECT is one it got wrong. Movement cannot see the difference; the oracle can.
  // A cell the oracle REFUSES is neither, and is published as such rather than falling into the
  // defect bucket — which is what drive 1 did, manufacturing one.
  const graded = stuck.filter((r) => r.orc.refused === undefined);
  const unmodelled = stuck.filter((r) => r.orc.refused !== undefined);
  const controls = graded.filter((r) => r.r434 === r.orc.derived);
  const defects = graded.filter((r) => r.r434 !== r.orc.derived);
  leg('G8', 'a [refused, refused] row in my Round 434 matrix held both a control and a defect',
    `rows not moving under Round 434's cure: ${stuck.length} (${stuck.map((r) => r.label).join(', ')}) · `
    + `UNMODELLED by the oracle: ${unmodelled.length} · `
    + `of the graded, correct under the oracle: ${controls.length} (${controls.map((r) => r.label).join(', ') || 'none'}) · `
    + `DEFECTS indistinguishable from them by movement alone: ${defects.length} `
    + `(${defects.map((r) => r.label).join(', ') || 'none'})`,
    stuck.length >= 2 && unmodelled.length === 0 && controls.length >= 1 && defects.length >= 1);
}

// ---------------------------------------------------------------------------------------------
// G9 — his grader must go RED against my cured module, on the legs that assert the two defects and
// nothing else. A grader that stayed green here would be re-typing a verdict rather than reading
// one (428), which is the shape he caught in me.
// ---------------------------------------------------------------------------------------------
let hisRed = [];
{
  const out = (() => {
    try {
      return execFileSync('node', ['docs/research/round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs'],
        { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
    } catch (e) { return `${e.stdout ?? ''}${e.stderr ?? ''}`; }
  })();
  writeFileSync(join(HERE, 'his-round435-postcure.out'), out);
  const gate = out.split('\n').find((l) => l.startsWith('GATE:')) ?? '';
  // Read with HIS format's own literal, not mine. Drive 1 keyed this on ` RED: `, which is what
  // THIS file prints; his line 595 prints ` — FALSE: <ids>`. It returned `[]` against an output
  // that plainly said `FALSE: G3, G4, G5, G9` — a reader hand-typed from the wrong grader (412),
  // and a leg that would have called his grader green on an empty parse (426).
  const HIS_RED = / — FALSE: (.+)$/m; // literal copied from round435:595
  const m = HIS_RED.exec(gate);
  hisRed = m === null ? [] : m[1].split(/,\s*/).filter((s) => s !== '');
  const uniq = [...new Set(hisRed)].sort();
  // Sanity on the reader itself: his per-leg lines print `FALSE <id>` (his line 584). The ids read
  // off the GATE line must be exactly the ids that appear on a FALSE per-leg line.
  const perLeg = [...new Set(out.split('\n').filter((l) => /^\s*FALSE\s+G\d+/.test(l))
    .map((l) => (l.match(/G\d+/) ?? [''])[0]))].sort();
  const readerAgrees = JSON.stringify(uniq) === JSON.stringify(perLeg);
  leg('G9', 'his grader goes RED against the cured module, and my reader of his verdict agrees '
    + 'with his own per-leg lines',
    `his GATE now: ${gate || '(not found)'} · red legs off the GATE line: [${uniq.join(', ')}] · `
    + `off his per-leg FALSE lines: [${perLeg.join(', ')}] · reader agrees: ${readerAgrees}`,
    gate.includes('false') && uniq.length > 0 && readerAgrees);
  // The membership is where the prediction was made; the gate above reads only red-vs-green (409).
  pred('P1', 'his grader will redden on exactly G3, G4 and G9 — G5, his matrix-design leg, holds',
    `red legs measured: [${uniq.join(', ')}] — predicted [G3, G4, G9]`,
    JSON.stringify(uniq) === JSON.stringify(['G3', 'G4', 'G9']));
}

// ---------------------------------------------------------------------------------------------
// G10 — his §5: the recording my Round 430 G7 cites. Re-driven at HEAD and re-recorded this round;
// the leg asserts the FRESH recording reproduces, and that the drift he reported is accounted for
// by rev rather than by my cures.
// ---------------------------------------------------------------------------------------------
{
  const drive = () => {
    try {
      return execFileSync('node', ['docs/research/round430-instruments/grade-the-convention-gate.mjs'],
        { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
    } catch (e) { return `${e.stdout ?? ''}${e.stderr ?? ''}`; }
  };
  const live = drive();
  writeFileSync(join(HERE, 'round430-gate-postcure.out'), live);
  const gate = live.split('\n').filter((l) => l.startsWith('GATE:'));
  const stale = readFileSync(join(REPO, 'docs/research/round434-instruments/round430-gate-postcure.out'), 'utf8').split('\n');
  const now = live.split('\n');
  const diff = [];
  for (let i = 0; i < Math.max(stale.length, now.length); i += 1) if (stale[i] !== now[i]) diff.push(i);
  leg('G10', 'my Round 430 gate is green at HEAD and re-recorded, and the drift he reported is real',
    `${gate.join(' | ') || '(no GATE line)'} · lines differing from the Round 434 recording: `
    + `${diff.length} (his §5 reported 3) · fresh recording written at rev ${REV.slice(0, 8)}`,
    gate.length > 0 && gate.every((l) => l.includes('true')) && diff.length > 0);
}

// ---------------------------------------------------------------------------------------------
// G11 — his §6, at the FILE level. Keyed on the whole-file diff between the pre-promotion drive and
// the post-promotion one, so it covers every leg in this file and not the one I was thinking about.
// Vacuous before this round's promotion commit exists, and says so (430).
// ---------------------------------------------------------------------------------------------
{
  // The comparison itself is made by `promotion-diff.mjs`, which drives this grader fresh after the
  // promotion commit and diffs that output against `drive3.before-promotion.out`. This leg READS
  // that instrument's verdict line rather than recomputing it — a leg cannot diff an output it is
  // in the middle of producing.
  //
  // So this leg is VACUOUS on the drive that produces the comparison and real on every drive after
  // it, which is the same shape as a self-exclusion leg being vacuous before promotion (430). The
  // drive that matters is the next round's reproduction of this one, and that drive reads it.
  const verdict = (() => {
    try {
      return readFileSync(join(HERE, 'promotion-diff.out'), 'utf8').split('\n')
        .find((l) => l.startsWith('PROMOTION:')) ?? null;
    } catch { return null; }
  })();
  if (verdict === null) {
    leg('G11', "every line differing across this round's own promotion is a rev stamp",
      'VACUOUS this drive: promotion-diff.out does not exist yet, so there is nothing to read. '
      + 'Gates on its PROMOTION verdict line from the next drive onward.',
      true);
  } else {
    leg('G11', "no leg's verdict moves across this round's own promotion",
      verdict,
      verdict.startsWith('PROMOTION: OK'));
  }
}

// ---------------------------------------------------------------------------------------------
// P2 — declared before the population was driven.
// ---------------------------------------------------------------------------------------------
{
  // The population is selected from the TREE at a stamped rev — `git grep <rev>` greps the commit,
  // not the index or the worktree, so a staged or dirty file cannot move the figure in either
  // direction (414-416). Round 436's own directory is excluded by its own path: an instrument does
  // not census its own source (425).
  const named = git('grep', '-l', '--', 'refusal-convention.mjs', REV, '--', 'docs/research')
    .trim().split('\n').map((l) => l.replace(`${REV}:`, ''))
    .filter((p) => p.endsWith('.mjs') && !p.includes('round436-instruments'));
  const graders = named.filter((p) => /grade|attack/.test(p));
  const results = graders.map((p) => {
    let out;
    try { out = execFileSync('node', [p], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 }); }
    catch (e) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
    const gl = out.split('\n').filter((l) => l.startsWith('GATE:'));
    return { p, green: gl.length > 0 && gl.every((l) => l.includes('true')), gate: gl.join(' | ') };
  });
  const red = results.filter((r) => !r.green).map((r) => r.p.split('/')[2].replace('-instruments', ''));
  const uniqRed = [...new Set(red)].sort();
  leg('G12', 'the population of instruments naming the module is driven live, not recalled',
    `population from the tree at ${REV.slice(0, 8)}: ${named.length} file(s) naming the module, `
    + `${graders.length} of them graders (a MEASUREMENT, not a pin — a count here reddens on its own `
    + `promotion, 377/405/434/435) · red: [${uniqRed.join(', ')}]`,
    graders.length > 0);
  pred('P2', 'no NEW reds in the population under my cures: round431 and round433 stay red, the rest green',
    `red: [${uniqRed.join(', ')}] — predicted exactly [round431, round433]`,
    JSON.stringify(uniqRed) === JSON.stringify(['round431', 'round433']));
}

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
const red = legs.filter((l) => l.ok !== true);
for (const l of legs) {
  console.log(`${l.ok === true ? ' ok ' : 'FAIL'}  ${l.id}  ${l.claim}`);
  console.log(`        ${l.detail}`);
}
console.log('');
for (const p of preds) {
  console.log(`${p.landed === true ? 'LANDED  ' : 'REFUTED '}${p.id}  ${p.claim}`);
  console.log(`        ${p.detail}`);
}
console.log('');
console.log(`GATE: ${red.length === 0}   (${legs.length} leg(s))${red.length ? `   RED: ${red.map((l) => l.id).join(', ')}` : ''}`);
console.log(`PREDICTIONS: ${preds.filter((p) => p.landed === true).length} landed, `
  + `${preds.filter((p) => p.landed !== true).length} refuted`
  + `${preds.filter((p) => p.landed !== true).length ? `: ${preds.filter((p) => p.landed !== true).map((p) => p.id).join(', ')}` : ''}`);
console.log(`  rev ${REV.slice(0, 8)} · slices at ${REV_434} and ${REV_436} · worktree ${DIRTY ? 'DIRTY' : 'clean'}`);
