/**
 * Round 450 instrument — grade the row cure in `docs/research/lib/verdict.mjs`.
 *
 * Subject: the cure for Theseus's Round 449 §3 (`renderTail` dropped a prediction's detail) and §4
 * (the row grammar decision), plus the finding driving §4 turned up: `renderRows` had none of
 * `renderVerdict`'s three guards.
 *
 * Legs are GATE legs. Predictions are separate and scored separately (430 — gate the figure on the
 * key, not on the prediction), so a refuted prediction cannot redden a leg and a green leg cannot
 * launder a refuted prediction.
 *
 * The cripples are MUTATIONS OF THE REAL PUBLISHED SOURCE, not env-var hooks: each copies
 * `verdict.mjs` into a scratch tree AT THE SAME DEPTH (the lib derives `REPO_ROOT` from
 * `import.meta.url` with three `..`, so a copy at the wrong depth makes every cell refuse — 425),
 * applies one textually anchored deletion, and re-drives. A cripple that does not anchor exactly
 * once is a dead cell and says so rather than reading as "no effect" (447 §4/436 — identical runs
 * read as no effect when all three are dead).
 */

import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  LEGACY_ROW_TOKENS, ROW_REFUSALS, PRED_TOKENS, LEG_TOKENS,
  renderRows, renderPredRows, renderTail, readRows, readTail, readCorpusRows,
  renderVerdict, selfTest, writeRecording, TrackedTargetError,
} from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const LIB = join(REPO, 'docs', 'research', 'lib', 'verdict.mjs');
const git = (args) => execFileSync('git', ['-C', REPO, ...args], {
  encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
}).trimEnd();

const out = [];
const say = (s) => { out.push(s); console.log(s); };

const REV = git(['rev-parse', 'HEAD']);
/** The last rev before this round touched the lib. Literal, so `W9` cannot go vacuous. */
const PRE_ROUND_REV = '9ddc9d17763456252870f69b6fc449ac33291caf';
const LIB_SRC = readFileSync(LIB, 'utf8');
say(`ROUND 450 — grade the row guards · rev ${REV} · subject docs/research/lib/verdict.mjs`);
say('');

const legs = [];
const preds = [];
const leg = (id, ok, what) => legs.push({ id, ok, what });
const pred = (id, landed, what) => preds.push({ id, landed, what });

// ── W1 — the §3 cure: a prediction's detail reaches the published artifact ───────────────────────
// Driven with sentinels through the real function. The pre-cure behaviour is recorded in
// `probe0`, run before the cure existed: `PREDICTION detail published: false`.
{
  const tail = renderTail({
    legs: [{ id: 'G1', ok: true, what: 'W1_LEG_SENTINEL' }],
    preds: [{ id: 'Q9', landed: false, what: 'W1_PRED_SENTINEL' }],
  });
  const legOut = tail.includes('W1_LEG_SENTINEL');
  const predOut = tail.includes('W1_PRED_SENTINEL');
  const idOut = tail.includes('refuted=[Q9]');
  const back = readTail(tail);
  const predRowReadable = back.ok === true && back.rows.some((r) => r.kind === 'PRED' && r.id === 'Q9');
  leg('W1', legOut && predOut && idOut && predRowReadable,
    `renderTail publishes a prediction's detail: leg=${legOut} pred=${predOut} id-in-line=${idOut} `
    + `pred-row-readable=${predRowReadable}`);
}

// ── W2 — the five unguarded shapes probe0 found now throw at EMIT, with a surviving control ─────
// Keyed per shape, with the member list published, not just a count (349 — compare member lists,
// not counts). The control is in the same leg so the cell cannot pass by throwing on everything.
{
  const shapes = [
    ['tri-state', { id: 'G1', ok: 'yes', what: 'x' }],
    ['id-with-space', { id: 'G1 ok hello', ok: true, what: 'x' }],
    ['id-empty', { id: '', ok: true, what: 'x' }],
    ['id-key-absent', { name: 'G1', ok: false, what: 'x' }],
    ['newline-forges-a-row', { id: 'G1', ok: true, what: 'one\nLEG G2 ok forged' }],
  ];
  const emitted = [];
  for (const [label, item] of shapes) {
    let got = null;
    try { got = renderRows([item]); } catch { /* required */ }
    if (got !== null) emitted.push(label);
  }
  let control = null;
  try { control = renderRows([{ id: 'G1', ok: true, what: 'ctl' }]); } catch { /* fails the leg */ }
  const controlLives = control !== null && control[0] === 'LEG G1 ok ctl';
  leg('W2', emitted.length === 0 && controlLives,
    `${shapes.length - emitted.length}/${shapes.length} unguarded shapes now throw at emit`
    + ` · still emitting: ${JSON.stringify(emitted)} · control survives: ${controlLives}`);
}

// ── W3 — row round-trip closure: no argument renders rows this module's own reader refuses ──────
// The property, driven over a generated space rather than over the exemplars the cure was written
// beside (342 — one KP per shape is coverage of one axis).
{
  const ids = ['G1', 'G4b', 'a.b', 'x:y', 'Z_9', 'q-1'];
  const states = [true, false, null];
  const whats = ['', 'plain', 'internal  spacing', 'punctuation: [a,b]=c', '—em dash—', 'ok RED REF'];
  let n = 0;
  const bad = [];
  for (const id of ids) {
    for (const s of states) {
      for (const w of whats) {
        n += 1;
        for (const [kind, item, key] of [
          ['LEG', { id, ok: s, what: w }, 'ok'], ['PRED', { id, landed: s, what: w }, 'landed'],
        ]) {
          let rows = null;
          try { rows = kind === 'LEG' ? renderRows([item]) : renderPredRows([item]); } catch (e) {
            bad.push(`${kind} ${id}/${s}/${JSON.stringify(w)} threw: ${e.message.slice(0, 60)}`);
            continue;
          }
          const r = readRows(rows.join('\n'));
          if (r.ok !== true) { bad.push(`${kind} ${id}/${s}/${JSON.stringify(w)} → ${r.refusal}`); continue; }
          const got = r.rows[0];
          if (got.id !== id || got.state !== s || got.what !== w) {
            bad.push(`${kind} ${id}/${s}/${JSON.stringify(w)} read back ${JSON.stringify(got)}`);
          }
        }
      }
    }
  }
  leg('W3', bad.length === 0,
    `round-trip over ${n * 2} (id × state × detail × kind) cases: ${bad.length} failure(s)`
    + `${bad.length === 0 ? '' : ` — first: ${bad[0]}`}`);
}

// ── W4 — a foreign row grammar is told apart from a run with nothing to report ──────────────────
// The row-level cure for Round 441 §1. Both arms are needed: without the legs=0 arm the leg would
// pass by refusing everything, which is the shape 356 warns about.
{
  const emptyRun = renderTail({ legs: [], preds: [] });
  const emptyOk = readTail(emptyRun).ok === true && readTail(emptyRun).rows.length === 0;
  const twoLegs = renderVerdict({ legs: [{ id: 'G6', ok: false }, { id: 'G7', ok: true }] });
  const foreign = readTail(`GATE: false   (2 leg(s))   RED: G6\n${twoLegs}`);
  const shortRows = readTail(`LEG G6 RED x\n${twoLegs}`);
  leg('W4', emptyOk && foreign.refusal === 'ROW_GRAMMAR_ABSENT'
    && shortRows.refusal === 'ROW_COUNT_DISAGREEMENT',
  `legs=0 reads clean: ${emptyOk} · a foreign grammar at legs=2 reads ${foreign.refusal} · `
  + `1 row at legs=2 reads ${shortRows.refusal}`);
}

// ── W5 — every declared refusal is REACHED BY DRIVING, and no undeclared code hides in source ───
//
// The first version of this leg was a pure source scan keyed `/refuseRow\(\s*'([A-Z_]+)'/` and it
// came out **RED against a correct lib**: it found 4 of 6, reporting UNKNOWN_ROW_TOKEN and
// WRONG_KIND_TOKEN as declared-but-never-called, while `W8` three legs below was driving both of
// them by name in the same run. The call is
// `refuseRow(otherKind === undefined ? 'UNKNOWN_ROW_TOKEN' : 'WRONG_KIND_TOKEN', line)` — an
// adjacent-token pattern cannot reach a wrapped call (367), and the failure direction was a
// SMALLER number, which is the direction that publishes (331).
//
// Re-keyed in the two directions separately, because they want different instruments:
//   reachability — DRIVEN, one input per declared code. A source scan cannot establish that a
//                  branch is live, only that a literal is present (358).
//   no-strays    — source, keyed on the whole `refuseRow(...)` call text rather than on the token
//                  adjacent to the paren, so a ternary is in range. Carries the wrapped call as its
//                  own known positive, plus a control, so a re-narrowed key cannot pass (367/344).
{
  const inputs = {
    MALFORMED_ROW: () => readRows('LEG G1').refusal,
    UNKNOWN_ROW_TOKEN: () => readRows('LEG G1 PASSED x').refusal,
    WRONG_KIND_TOKEN: () => readRows('LEG G1 LANDED x').refusal,
    DUPLICATE_ROW_ID: () => readRows('LEG G1 ok a\nLEG G1 RED b').refusal,
    ROW_GRAMMAR_ABSENT: () => readTail(`noise\n${renderVerdict({ legs: [{ id: 'G6', ok: false }] })}`).refusal,
    ROW_COUNT_DISAGREEMENT: () => readTail(
      `LEG G6 RED x\n${renderVerdict({ legs: [{ id: 'G6', ok: false }, { id: 'G7', ok: true }] })}`,
    ).refusal,
  };
  const unreached = [];
  for (const code of ROW_REFUSALS) {
    const drive = inputs[code];
    if (drive === undefined) { unreached.push(`${code}(no input declared)`); continue; }
    let got = null;
    try { got = drive(); } catch (e) { got = `threw:${e.message.slice(0, 40)}`; }
    if (got !== code) unreached.push(`${code}→${got}`);
  }

  // The source direction. Take each `refuseRow(` call's text and pull every all-caps literal from
  // it, so a code inside a ternary is in range.
  const callTexts = [...LIB_SRC.matchAll(/refuseRow\(/g)].map((m) => LIB_SRC.slice(m.index, m.index + 220));
  const inSource = new Set();
  for (const t of callTexts) for (const m of t.matchAll(/'([A-Z][A-Z_]{3,})'/g)) inSource.add(m[1]);
  const strays = [...inSource].filter((c) => !ROW_REFUSALS.includes(c));
  // KP for the SELECTOR itself: the two codes that are only ever reached through a ternary must be
  // found by this key. If the key is ever re-narrowed to the adjacent-token form, this reddens.
  const wrappedKP = ['UNKNOWN_ROW_TOKEN', 'WRONG_KIND_TOKEN'].filter((c) => !inSource.has(c));
  // CONTROL: a code that is not in the file must NOT be found, or the key is matching the universe.
  const controlClean = !inSource.has('NOT_A_REAL_ROW_REFUSAL');

  leg('W5', unreached.length === 0 && strays.length === 0 && wrappedKP.length === 0
    && controlClean && ROW_REFUSALS.length === 6,
  `all ${ROW_REFUSALS.length} declared row refusals DRIVEN by name: ${unreached.length === 0}`
  + `${unreached.length === 0 ? '' : ` (${JSON.stringify(unreached)})`} · undeclared codes in source: `
  + `${JSON.stringify(strays)} · wrapped-call KP found: ${wrappedKP.length === 0} · control clean: `
  + `${controlClean}`);
}

// ── W6 — the corpus reader reads the whole censused vocabulary, and both shapes ──────────────────
// The figure that matters is not "does the table have 8 entries" — it is whether the ONE shared
// reader reads what the two hand-rolled ones could not. Both old readers are sliced from their
// pinned sources below rather than retyped (411 — a hand-typed reader is not a slice).
{
  const r446 = readFileSync(join(HERE, '..', 'round446-instruments', 'grade-my-own-oracle-predicate.mjs'), 'utf8');
  const r448 = readFileSync(join(HERE, '..', 'round448-instruments', 'record-cripples.mjs'), 'utf8');
  const sliceRe = (src, anchor) => {
    const hits = [...src.matchAll(/\/\^\(\?:[^/]*\/(?=\.test|\))/g)].map((m) => m[0]);
    const line = src.split('\n').find((l) => l.includes(anchor) && l.includes('/^(?:'));
    if (line === undefined) return null;
    const m = line.match(/(\/\^\(\?:.*?\/)(?:\.test|\))/);
    return m === null ? null : m[1];
  };
  const src446 = sliceRe(r446, 'legLines');
  const src448 = sliceRe(r448, 'l.match(');
  // A slice that refuses is published as a refusal, never defaulted to a guess (399).
  const compile = (s) => {
    if (s === null) return null;
    const body = s.slice(1, -1);
    try { return new RegExp(body); } catch { return null; }
  };
  const re446 = compile(src446);
  const re448 = compile(src448);

  // One exemplar line per declared spelling, in the PADDED historical shape both old readers
  // actually key on: a FOUR-character token field, one space, the id, then TWO spaces.
  //
  // The first version of this leg built ` ${t} G9  detail` and carried a `.replace(/^ ok/, ' ok')`
  // that replaced a string with itself — a dead transformation — so the `ok` exemplar was ` ok G9`
  // with ONE space where both readers require two. It reported **446 reads 0/8 and 448 reads 0/8**,
  // which is a false finding against my own two rounds in the direction that exaggerates. The
  // readers are narrow; they are not blind. A reader must be driven against the shape it was
  // written for, or the measurement is of the exemplar (415 — a hand-typed KP is not a slice; 331 —
  // the failure direction was a smaller number).
  const pad4 = (t) => (t === 'ok' ? ' ok ' : t.padEnd(4, ' '));
  const exemplars = Object.keys(LEGACY_ROW_TOKENS).map((t) => [t, `${pad4(t)} G9  detail`]);
  const reads = (re, line) => (re === null ? null : re.test(line));
  const mineReads = (line) => readCorpusRows(line).rows.length === 1;

  const table = exemplars.map(([tok, line]) => ({
    tok, mine: mineReads(line), r446: reads(re446, line), r448: reads(re448, line),
  }));
  const mineAll = table.every((r) => r.mine === true);
  const oldMissed446 = table.filter((r) => r.r446 !== true).map((r) => r.tok);
  const oldMissed448 = table.filter((r) => r.r448 !== true).map((r) => r.tok);

  // And the canonical rows, which §4 measured as read by 0 of 3 by either.
  const canon = renderRows([{ id: 'G1', ok: true, what: 'a' }, { id: 'G2', ok: false, what: 'b' },
    { id: 'G3', ok: null, what: 'c' }]);
  const canonMine = canon.filter((l) => mineReads(l)).length;
  const canon446 = re446 === null ? null : canon.filter((l) => re446.test(l)).length;
  const canon448 = re448 === null ? null : canon.filter((l) => re448.test(l)).length;

  leg('W6', re446 !== null && re448 !== null && mineAll && canonMine === 3,
    `one shared reader over the censused 8: mine reads ${table.filter((r) => r.mine).length}/8, `
    + `446 reads ${8 - oldMissed446.length}/8 (missing ${JSON.stringify(oldMissed446)}), `
    + `448 reads ${8 - oldMissed448.length}/8 (missing ${JSON.stringify(oldMissed448)})`);
  say(`     canonical rows read: mine ${canonMine}/3 · 446 ${canon446}/3 · 448 ${canon448}/3`
    + '   (§4 measured 0/3 for both, pre-cure)');
  say(`     slices compiled from pinned source: 446 ${JSON.stringify(src446)} · 448 ${JSON.stringify(src448)}`);
}

// ── W7 — the lib's own self-test reaches the new ground, and FAILS when a guard is removed ──────
// The self-test returning true is not evidence it covers anything; the cripple grading below is.
// This leg only asserts it is driven and gates on `!== true` (356).
{
  let r = null;
  try { r = selfTest(); } catch { /* leaves r null */ }
  leg('W7', r === true, `selfTest() returned ${JSON.stringify(r)}`);
}

// ── W8 — the two vocabularies do not collide, and a cross-kind token refuses by name ────────────
// This is the declared COST of choosing a second vocabulary, mechanised. Without this leg the
// decision in §4 would be a preference; with it, the preference has a guard.
{
  const legToks = Object.values(LEG_TOKENS);
  const predToks = Object.values(PRED_TOKENS);
  const overlap = legToks.filter((t) => predToks.includes(t));
  const crossLeg = readRows('LEG G1 LANDED x').refusal;
  const crossPred = readRows('PRED Q1 ok x').refusal;
  const unknown = readRows('LEG G1 PASSED x').refusal;
  leg('W8', overlap.length === 0 && crossLeg === 'WRONG_KIND_TOKEN'
    && crossPred === 'WRONG_KIND_TOKEN' && unknown === 'UNKNOWN_ROW_TOKEN',
  `vocabularies disjoint: ${JSON.stringify(overlap)} · LEG+LANDED → ${crossLeg} · `
  + `PRED+ok → ${crossPred} · an unknown spelling → ${unknown}`);
}

// ── W9 — the verdict line is byte-identical to what it was before this round ────────────────────
// The cure adds a reader and guards rows; it must not change the published verdict grammar, or
// every committed recording's reader changes meaning silently. Compared against the lib AT THE
// PARENT REV, driven, not diffed by eye.
{
  const scratch = join(HERE, '.w9-parent-lib');
  rmSync(scratch, { recursive: true, force: true });
  // Same depth as docs/research/lib, so REPO_ROOT resolves identically (425).
  const libDir = join(scratch, 'docs', 'research', 'lib');
  mkdirSync(libDir, { recursive: true });
  // Pinned to a FIXED pre-round rev, not to `HEAD~1`. Keyed on `HEAD~1` this leg stays green and
  // goes VACUOUS the moment the next commit lands — it would then be comparing the cured lib to
  // itself (437 — an old cell sourced from HEAD inverts when the cure lands; a reread cannot catch
  // it, so the pin is literal).
  let parentSrc = null;
  try { parentSrc = git(['show', `${PRE_ROUND_REV}:docs/research/lib/verdict.mjs`]); } catch { /* refuses below */ }
  if (parentSrc === null) {
    leg('W9', null, 'could not read the lib at the parent rev — REFUSED rather than assuming identity');
  } else {
    writeFileSync(join(libDir, 'verdict.mjs'), parentSrc);
    const cases = [
      { legs: [], preds: [] },
      { legs: [{ id: 'G1', ok: true }], preds: [] },
      { legs: [{ id: 'G1', ok: false }, { id: 'G2', ok: null }], preds: [{ id: 'Q1', landed: false }] },
      { legs: [{ id: 'G1', ok: true }], preds: [{ id: 'Q1', landed: null }, { id: 'Q2', landed: true }] },
    ];
    const prog = `import { renderVerdict } from ${JSON.stringify(join(libDir, 'verdict.mjs'))};\n`
      + `for (const c of ${JSON.stringify(cases)}) console.log(renderVerdict(c));\n`;
    const progPath = join(scratch, 'emit.mjs');
    writeFileSync(progPath, prog);
    let parentOut = null;
    try {
      parentOut = execFileSync('node', [progPath], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      }).trimEnd();
    } catch (e) { parentOut = `DIED: ${String(e.stderr ?? '').split('\n')[0]}`; }
    const mineOut = cases.map((c) => renderVerdict(c)).join('\n');
    const same = parentOut === mineOut;
    leg('W9', same, `the verdict line over ${cases.length} cases is byte-identical to the pre-round `
      + `rev ${PRE_ROUND_REV.slice(0, 8)}: ${same}`);
    if (!same) { say(`     parent: ${JSON.stringify(parentOut)}`); say(`     mine:   ${JSON.stringify(mineOut)}`); }
    rmSync(scratch, { recursive: true, force: true });
  }
}

// ── Predictions, scored separately from the gate ─────────────────────────────────────────────────

// Q1 — stated before the census ran, in probe0's docstring: the reason §4 had never come up is that
// rows had no reader, so the adoption figure for the canonical row grammar across the corpus is
// LOW but non-zero.
{
  const files = git(['ls-tree', '-r', '--name-only', REV, '--', 'docs/research'])
    .split('\n').filter((p) => p.endsWith('.out'));
  // THIS ROUND'S OWN RECORDINGS ARE EXCLUDED and both figures are published. Theseus's Round 449
  // §5.6 is exactly this defect one round old — an adoption figure counted over a population
  // containing the round's own recorder — and the first version of this prediction repeated it.
  const MINE = 'docs/research/round450-instruments/';
  const tally = (list) => {
    let canon = 0;
    let withPred = 0;
    for (const f of list) {
      let t;
      try { t = readFileSync(join(REPO, f), 'utf8'); } catch { continue; }
      const r = readCorpusRows(t).rows.filter((x) => x.shape === 'canonical');
      if (r.length > 0) canon += 1;
      if (r.some((x) => x.kind === 'PRED')) withPred += 1;
    }
    return { canon, withPred, n: list.length };
  };
  const all = tally(files);
  const outside = tally(files.filter((f) => !f.startsWith(MINE)));
  pred('Q1', outside.canon > 0 && outside.canon < outside.n / 2 && outside.withPred === 0,
    `canonical rows in ${outside.canon}/${outside.n} committed recordings OUTSIDE this round's `
    + `directory (${all.canon}/${all.n} including it) · PRED rows outside: ${outside.withPred} — a `
    + 'prediction row has never been published, because the lib could not render one');
}

// Q2 — the claim that justifies the §4 decision. If the canonical grammar were already the corpus
// vocabulary, widening the readers would be the cheaper horn and my answer would be wrong.
{
  const canonicalToks = new Set([...Object.values(LEG_TOKENS), ...Object.values(PRED_TOKENS)]);
  const legacyOnly = Object.keys(LEGACY_ROW_TOKENS).filter((t) => !canonicalToks.has(t));
  pred('Q2', legacyOnly.length === 2 && legacyOnly.includes('FAIL') && legacyOnly.includes('REFUSED'),
    `of the censused 8 spellings, ${8 - legacyOnly.length} are canonical and ${legacyOnly.length} are `
    + `legacy-only: ${JSON.stringify(legacyOnly)} — so the canonical grammar is not a rename of the corpus`);
}

say('');
for (const l of renderRows(legs)) say(l);
for (const p of renderPredRows(preds)) say(p);
say('');
say(renderVerdict({ legs, preds }));

// Written through the lib's own write guard, not through `writeFileSync` — this round's subject is
// that file, and a recorder that re-stamps a committed recording is the class the guard exists to
// refuse. If the target is already committed this REFUSES and says so, which is the correct
// outcome and the one Theseus's Round 449 hit three times on his own recorder.
const target = process.argv[2] ?? process.env.KLATCH_R450_OUT ?? null;
if (target !== null) {
  const abs = join(HERE, target);
  try {
    writeRecording(abs, `${out.join('\n')}\n`);
    console.log(`recorded → ${target}`);
  } catch (e) {
    if (!(e instanceof TrackedTargetError)) throw e;
    console.log(`REFUSED to re-stamp a committed recording: ${target}`);
    console.log(`  ${e.message.split('\n')[0]}`);
    process.exitCode = 3;
  }
}
