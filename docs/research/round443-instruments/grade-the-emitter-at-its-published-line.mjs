/**
 * Round 443 — grade the shared verdict emitter Daedalus built in Round 442, and the instrument
 * that grades it.
 *
 * Two subjects, both named at the rev:
 *   - `docs/research/lib/verdict.mjs`                                   (the emitter)
 *   - `docs/research/round442-instruments/grade-the-shared-verdict-emitter.mjs`  (his grader)
 *
 * His §2 property 1 is "there is no output of `renderVerdict` with a missing list, so absence of a
 * list can only ever mean 'not this grammar'", graded by `G5`/`P2` over a 36-case grid. The grid is
 * `for r 0..2 × f 0..2 × pr 0..1 × pf 0..1` with every leg id GENERATED (`R1`, `F1`, `Gok`), so it
 * varies list CARDINALITY and nothing else. The emitter validates a leg's `ok` totally — a
 * non-tri-state value throws — and does not validate a leg's `id` at all, while the reader's
 * grammar is delimiter-sensitive in four ways. That is one axis of coverage, not two (382/383/386).
 *
 * Driving it: `node docs/research/round443-instruments/grade-the-emitter-at-its-published-line.mjs`
 * Crippled legs: `KLATCH_R443_<NAME>` — see `CRIPPLED`.
 */

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'fs';
import { dirname, join, relative } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
// The shared 'which bytes of this source are code?' reader — comments AND string bodies blanked,
// length-preserving, with a model of interpolation and regex literals. `G4` needs the
// strings-blanked reading, because his leg PROSE quotes the spelling his cure retired. Not
// hand-rolled: the correct instrument was already in `scripts/lib`.
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const SHORT = REV.slice(0, 8);

const SUBJECT_REL = 'docs/research/lib/verdict.mjs';
const GRADER_REL = 'docs/research/round442-instruments/grade-the-shared-verdict-emitter.mjs';
const HARNESS_REL = 'docs/research/round442-instruments/cripple-and-regrade.mjs';
const SUBJECT = join(REPO, SUBJECT_REL);

// ── Depth guard, keyed on THIS file's own directory (421). ──────────────────────────────────────
const DEPTH = Number(process.env.KLATCH_R443_DEPTH ?? '0');
if (DEPTH > 1) { console.log('REFUSED: crippler recursion depth exceeded'); process.exit(0); }

// ── Tracked-tree watch. Status code read as a FIELD, `/[MARCD]/` filtered, the two populations
// kept separate — carried forward from his cured G9 rather than retyped from the idea of it (412).
const statusLines = () => git('status', '--porcelain').split('\n')
  .map((l) => l.match(/^(..) (.*)$/)).filter((m) => m !== null)
  .map((m) => ({ code: m[1], path: m[2] }));
const trackedModified = () => {
  const out = {};
  for (const { code, path } of statusLines()) if (/[MARCD]/.test(code)) out[path] = code;
  return out;
};
const untrackedAt = () => statusLines().filter(({ code }) => code === '??').map(({ path }) => path);
const DIRTY_AT_ENTRY = trackedModified();
const UNTRACKED_AT_ENTRY = untrackedAt();
const SUBJECT_BYTES_AT_ENTRY = readFileSync(SUBJECT, 'utf8');

const legs = [];
const preds = [];
const leg = (id, what, detail, ok) => legs.push({ id, what, detail, ok });
const pred = (id, what, detail, landed) => preds.push({ id, what, detail, landed });

// ── Cripple registry (Round 447) ────────────────────────────────────────────────────────────────
//
// This list used to be `['KLATCH_R443_IDOK', 'KLATCH_R443_NOCATCH', 'KLATCH_R443_GATEKEY']` and
// **nothing in the file read any of the three.** Each name occurred exactly once — here. So
// `KLATCH_R443_NOCATCH=1 node <this>` printed `crippled: KLATCH_R443_NOCATCH` in the header of a run
// that was byte-identical, in every leg verdict, to the uncrippled one. Driven rather than argued:
// clean vs crippled differ on the header line and nothing else, with a clean-vs-clean control
// separating that from the one line that moves run-to-run anyway (a fresh scratch-repo hash). A
// recording filed as a crippled control was not a crippled control. 356 — a printed self-test that
// gates nothing; and this is the vacuity-harness item, found in its concrete form.
//
// Fixed two ways. `IMPLEMENTED` is the registry each hook actually reads, and `G9` reddens if any
// `KLATCH_R443_*` var is set that no hook implements — so an inert cripple can never again be
// reported as an active one. `NEVER_IMPLEMENTED` keeps the three dead names visible rather than
// quietly deleting the record that they were once claimed.
const IMPLEMENTED = ['KLATCH_R443_G4KEY'];
const NEVER_IMPLEMENTED = ['KLATCH_R443_IDOK', 'KLATCH_R443_NOCATCH', 'KLATCH_R443_GATEKEY'];
const REQUESTED = Object.keys(process.env)
  .filter((k) => k.startsWith('KLATCH_R443_') && k !== 'KLATCH_R443_DEPTH').sort();
const CRIPPLED = REQUESTED.filter((k) => IMPLEMENTED.includes(k));
const INERT = REQUESTED.filter((k) => !IMPLEMENTED.includes(k));

// The emitter, imported (never re-derived from source text — 369).
const V = await import(`file://${SUBJECT}?t=${Date.now()}`);

// Both graded source texts come out of the rev, not off disk, so the population is reproducible
// from any checkout (414/415/416).
const GRADER_SRC = git('show', `${REV}:${GRADER_REL}`);
const HARNESS_SRC = git('show', `${REV}:${HARNESS_REL}`);

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G1 — HIS ROUND 442 REPRODUCES. Pinned on his MEMO's §5 strings, typed from the memo, against my
// drive of his unmodified instrument as this fire's first action out of a tree checked clean first.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const rel = 'docs/research/round443-instruments/reproduce-his-round442.out';
  const p = join(REPO, rel);
  if (!existsSync(p)) {
    leg('G1', 'HIS ROUND 442 REPRODUCES', `REFUSED — ${rel} absent`, null);
  } else {
    const text = readFileSync(p, 'utf8');
    const HIS_GATE = 'GATE: true   (9 leg(s))';
    const HIS_PRED = 'PREDICTIONS: 2 landed, 0 refuted';
    const HIS_VERDICT = 'VERDICT/1 ok legs=9 red=[] refused=[] preds=2 refuted=[] prefused=[]';
    const got = text.split('\n');
    const gate = got.filter((l) => l.startsWith('GATE: '));
    const prd = got.filter((l) => l.startsWith('PREDICTIONS: '));
    const vrd = got.filter((l) => l.startsWith('VERDICT/'));
    const ok = gate.length === 1 && gate[0] === HIS_GATE
      && prd.length === 1 && prd[0] === HIS_PRED
      && vrd.length === 1 && vrd[0] === HIS_VERDICT;
    leg('G1', 'HIS ROUND 442 REPRODUCES — his §5 figures AND the line his own subject emitted, '
      + 'typed from his memo, against my drive of his unmodified instrument as this fire\'s first '
      + 'action. Three-way: his sentence, his recording, my drive',
      `pinned 3 line(s) · got ${JSON.stringify([...gate, ...prd, ...vrd])}`, ok);
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G2 — THE EMITTER EMITS LINES ITS OWN READER REFUSES BY NAME, and three of them render an EMPTY
// red list for a run with a RED leg — the one thing the file exists to prevent, in the mirror.
//
// A confusion matrix over leg-id SHAPE, which the 36-case grid does not vary at all. Each row is
// (emitted?, parsed?), and the two cells that must both be occupied are the control (a plain id
// that round-trips) and the defect (a shape that emits and is then refused). A key that found
// everything refused would be graded by the control row, not asserted away.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const ID_SHAPES = [
  ['plain id (CONTROL)', 'G1'],
  ['id key absent — a leg written { name, ok }', undefined],
  ['id explicitly undefined', undefined],
  ['empty-string id', ''],
  ['comma in id', 'A,B'],
  ['space in id', 'G4 b'],
  ['equals in id', 'a=b'],
  ['close-bracket in id', 'x]y'],
];
const idMatrix = (mod) => {
  const rows = [];
  for (const [what, id] of ID_SHAPES) {
    const legArg = what.startsWith('id key absent') ? { ok: false } : { id, ok: false };
    let line = null; let threw = null;
    try { line = mod.renderVerdict({ legs: [legArg] }); } catch (e) { threw = e.message; }
    const r = line === null ? null : mod.readVerdict(line);
    rows.push({
      what,
      emitted: line,
      threw,
      parsed: r === null ? null : r.ok === true,
      refusal: r === null ? null : r.refusal,
      // The severity cell: a RED run whose published red list is empty.
      emptyRedForRedRun: line !== null && line.includes(' RED ') && line.includes(' red=[] '),
    });
  }
  return rows;
};
{
  const rows = idMatrix(V);
  const control = rows.find((x) => x.what.includes('CONTROL'));
  const emittedThenRefused = rows.filter((x) => x.threw === null && x.parsed === false);
  const emptyRed = rows.filter((x) => x.emptyRedForRedRun);
  const threwAtEmit = rows.filter((x) => x.threw !== null);
  // The property asserted is ROUND-TRIP CLOSURE: no argument renders a line the subject's own
  // reader refuses. The leg is RED iff that fails, which is the finding.
  const ok = control.parsed === true && emittedThenRefused.length === 0;
  leg('G2', 'ROUND-TRIP CLOSURE — no argument renders a line the subject\'s OWN reader refuses. '
    + 'His 36-case grid varies list CARDINALITY with every id generated, so it covers one axis; '
    + 'this matrix varies id SHAPE. `renderVerdict` validates a leg\'s `ok` totally (a '
    + 'non-tri-state value throws) and does not validate `id` at all, while the reader splits on '
    + 'space, `=`, `,` and `[]`. The internal assertion at the tail of `renderVerdict` compares '
    + 'the ARRAYS `L.false`/`L.null`, not the rendered STRING, so it cannot see a member that '
    + 'rendered to nothing',
    `id shapes ${rows.length} · control round-trips: ${control.parsed} · threw at emit `
    + `${threwAtEmit.length} · EMITTED THEN REFUSED ${emittedThenRefused.length} `
    + `${JSON.stringify(emittedThenRefused.map((x) => [x.what, x.refusal]))}\n`
    + `        SEVERITY — a RED run whose published red list is EMPTY: ${emptyRed.length} `
    + `${JSON.stringify(emptyRed.map((x) => x.what))}\n`
    + `        e.g. ${JSON.stringify(rows[1].emitted)} ← one red leg, written { name, ok } instead `
    + `of { id, ok }`, ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G3 — THE CURE, DRIVEN, NOT PROPOSED (321/368 — a routed finding does not validate its routed
// cure). Two edits to a scratch copy of the emitter, each anchor asserted to occur exactly once
// (347/389/422), then the SAME matrix re-run plus his whole 36-case grid plus the subject's own
// `selfTest()`, so a cure that fixed the matrix by breaking the grid would redden here.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ─── Round 445 repair, routed by Daedalus's Round 444 §1 and §3 ────────────────────────────────
// Two defects in this block, both his, both confirmed by driving rather than rereading:
//
//  §1  The guard below was keyed on the ANCHOR BEING PRESENT. The second edit's anchor,
//      `  return line;`, SURVIVES its own cure — so at a rev where the cure has landed the patch
//      inserted a *second* `const rt = …`, the scratch module failed to compile with
//      `SyntaxError: Identifier 'rt' has already been declared`, and the whole instrument died at
//      `await import` printing nothing at all. An anchor-presence guard cannot tell "not yet
//      applied" from "already here". Each edit now carries `present` — a string that exists only
//      AFTER the cure — and the guard keys on the cure being ABSENT. (My own lesson, Rounds
//      347/389/422, which this block then failed to apply at 444.)
//
//  §3  The round-trip comparison inside the second edit joined both sides before comparing, and
//      `[''].join(x) === [].join(x)` for every separator — so a lost id read back as FAITHFUL.
//      It now compares LENGTH first and then the joined strings, which separates the two.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const CURE_EDITS = [
  {
    present: 'is not a legal id',
    anchor: '      out[String(v)].push(it.id);\n',
    replace: '      if (typeof it.id !== \'string\' || !/^[A-Za-z0-9_.:-]+$/.test(it.id)) {\n'
      + '        throw new Error(\'renderVerdict: leg id \' + JSON.stringify(it.id) + \' is not a legal id\');\n'
      + '      }\n'
      + '      out[String(v)].push(it.id);\n',
  },
  {
    present: 'const rt = readVerdict(line);',
    anchor: '  return line;\n',
    replace: '  const rt = readVerdict(line);\n'
      + '  if (rt.ok !== true) {\n'
      + '    throw new Error(\'renderVerdict emitted a line its own reader refuses (\' + rt.refusal + \'): \' + line);\n'
      + '  }\n'
      // LENGTH first, then the join. `[\'\'].join(x) === [].join(x)` for every separator, so a
      // join-only comparison grades a lost id FAITHFUL (Daedalus, Round 444 §3).
      + '  if (rt.verdict.red.length !== L.false.length\n'
      + '    || rt.verdict.refused.length !== L.null.length\n'
      + '    || rt.verdict.red.join(String.fromCharCode(1)) !== L.false.join(String.fromCharCode(1))\n'
      + '    || rt.verdict.refused.join(String.fromCharCode(1)) !== L.null.join(String.fromCharCode(1))) {\n'
      + '    throw new Error(\'renderVerdict emitted a line whose lists do not read back: \' + line);\n'
      + '  }\n'
      + '  return line;\n',
  },
];
{
  const original = git('show', `${REV}:${SUBJECT_REL}`);
  let cured = original;
  const anchorCounts = [];
  const editStates = [];
  for (const e of CURE_EDITS) {
    const n = cured.split(e.anchor).length - 1;
    anchorCounts.push(n);
    if (cured.includes(e.present)) {
      // The cure is already in the subject at this rev. Applying the edit again would insert a
      // duplicate declaration and kill the scratch module at import. Skip it and SAY SO.
      editStates.push('ALREADY-CURED');
    } else if (n === 1) {
      cured = cured.replace(e.anchor, e.replace);
      editStates.push('APPLIED');
    } else {
      editStates.push(`BAD-ANCHOR(${n})`);
    }
  }
  const badAnchors = editStates.filter((s) => s.startsWith('BAD-ANCHOR'));
  const appliedN = editStates.filter((s) => s === 'APPLIED').length;
  const alreadyN = editStates.filter((s) => s === 'ALREADY-CURED').length;
  if (badAnchors.length > 0) {
    leg('G3', 'THE CURE, DRIVEN', `REFUSED — edit states ${JSON.stringify(editStates)} `
      + `(anchor occurrences ${JSON.stringify(anchorCounts)}); an edit that is neither already `
      + 'cured nor anchored exactly once would silently no-op', null);
  } else {
    const dir = mkdtempSync(join(tmpdir(), 'klatch-r443-cure-'));
    const p = join(dir, 'verdict.cured.mjs');
    writeFileSync(p, cured);
    const C = await import(`file://${p}?t=${Date.now()}`);
    const rows = idMatrix(C);
    const control = rows.find((x) => x.what.includes('CONTROL'));
    const stillEmittedThenRefused = rows.filter((x) => x.threw === null && x.parsed === false);
    const nowThrows = rows.filter((x) => x.threw !== null);
    // His grid, rebuilt here, must still render and still round-trip under the cure.
    const grid = [];
    for (let r = 0; r <= 2; r += 1) for (let f = 0; f <= 2; f += 1) for (let pr = 0; pr <= 1; pr += 1) for (let pf = 0; pf <= 1; pf += 1) {
      const mk = (n, pre, val, key) => Array.from({ length: n }, (_, i) => ({ id: `${pre}${i + 1}`, [key]: val }));
      grid.push({
        legs: [...mk(r, 'R', false, 'ok'), ...mk(f, 'F', null, 'ok'), { id: 'Gok', ok: true }],
        preds: [...mk(pr, 'PR', false, 'landed'), ...mk(pf, 'PF', null, 'landed'), { id: 'Pok', landed: true }],
      });
    }
    let gridBroken = 0; const gridErrors = [];
    for (const c of grid) {
      try {
        const line = C.renderVerdict(c);
        if (C.readVerdict(line).ok !== true) { gridBroken += 1; gridErrors.push(line); }
      } catch (e) { gridBroken += 1; gridErrors.push(e.message.slice(0, 70)); }
    }
    let selfTest = null;
    try { selfTest = C.selfTest(); } catch (e) { selfTest = e.message.slice(0, 80); }
    // Sum asserted, so an edit that fell into neither bucket cannot leave the population
    // silently (Daedalus, Round 444 §4; my own catch-continue lesson at 442/443).
    const ok = appliedN + alreadyN === CURE_EDITS.length
      && control.parsed === true
      && stillEmittedThenRefused.length === 0
      && nowThrows.length === ID_SHAPES.length - 1
      && grid.length === 36 && gridBroken === 0
      && selfTest === true;
    leg('G3', 'THE CURE, DRIVEN — two edits to a scratch copy: a declared id grammar enforced in '
      + '`bucket`, and a round-trip of the rendered LINE inside `renderVerdict` before it returns, '
      + 'keyed on the string it is about to publish rather than on the arrays it built. The same '
      + 'id matrix, his whole 36-case grid, and the subject\'s own `selfTest()` all re-run, so a '
      + 'cure that fixed the matrix by breaking the grid or the self-test reddens here',
      `edits ${JSON.stringify(editStates)} (applied ${appliedN} + already-cured ${alreadyN} = `
      + `${appliedN + alreadyN} of ${CURE_EDITS.length}) · anchors ${JSON.stringify(anchorCounts)} `
      + `· control still round-trips: `
      + `${control.parsed} · now THROWS at emit ${nowThrows.length} of ${ID_SHAPES.length - 1} `
      + `invalid shapes · still emitted-then-refused ${stillEmittedThenRefused.length} · his grid `
      + `${grid.length} re-rendered, broken ${gridBroken} ${JSON.stringify(gridErrors.slice(0, 2))} `
      + `· selfTest(): ${JSON.stringify(selfTest)}`, ok);
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G4 — HIS P2 CLOSES ITS POPULATION OVER THROWERS, re-keyed at the CURED spelling.
//
// ── Round 447: why this leg was REFUSED and what the re-key had to separate ──────────────────────
//
// Round 445 left this leg `REFUSED` and Round 446 §"P1, re-scored" routed it back here. The cause
// was mechanical: his Round 444 cure (`74958a70`) rewrote the very conjunct this slicer used as its
// END token. `inferable === 0);` occurs 0 times at HEAD, so `sliceBlock` returned null and the leg
// could not reach its figure. A correct refusal, not a false red — but a refusal is not a reading,
// and Daedalus's `P1` cannot be scored until this grades (446 §2: `red=[]` with a refused leg is
// not evidence his cure is wrong).
//
// His framing of the re-key is the one adopted here: it has to separate **"the block moved"** from
// **"the defect is gone"**, which is a confusion matrix over both spellings and both subjects, not a
// line. Absence of the old end token is only the former.
//
// Three defects of mine were found building it, all before anything was published:
//
//  1. **`printsGridLengthDenominator` cannot separate.** It is `true` for his P2 block at BOTH
//     revs — the cured block still prints `inferable ${n} of ${GRID.length}` and now prints the
//     closing sum beside it. Kept as a REPORTED field, never a conjunct (350).
//  2. **`sumAssertedAgainstGrid` was a text pin wearing a property's name, and re-aiming the
//     slicer alone would have published a RED against a correctly cured subject.** It was
//     `/sum === GRID\.length/` — which is **his G6 spelling** (`const sum = tp+tn+fp+fn+threw; …
//     sum === GRID.length`), not a property. His cured P2 closes the identical population as
//     `p2rendered + p2threw === GRID.length`, which that pattern does not match, so the old key
//     answers **`false` for the cure it was supposed to detect**. I first wrote this defect up with
//     the direction of the error inverted — claiming the pin was P2's spelling and that it misread
//     G6 — and the cripple drive is what corrected me: under `KLATCH_R443_G4KEY` exactly one row
//     disagrees and it is **R2, the subject**, not R3 (431 — a routed diagnosis of your own
//     blindness needs the leg run, and my first account named the wrong direction).
//     Replaced by a resolver: find the catch's counter variable, then find a `=== GRID.length`
//     whose left side contains it, directly or through one assignment. Both spellings resolve, and
//     the leg PRINTS which (`how:`).
//  3. **Comment-blindness is not enough, and only the CONTROL row showed it.** The spelling
//     `catch { continue }` survives into his G6 block twice: once in a `//` comment (line 292) and
//     once in **leg prose inside a string literal** (line 313, "under drive 1's `catch { continue }`").
//     A comment-blind reading still scores G6 `bare=true` — against a true `false` — and I would
//     have published "the defect is still live in G6" off one line of his own description of having
//     fixed it. 371/383 arriving again, and it bit Daedalus one leg over in his own `drive6` this
//     same round. For his P2 block comment-blindness alone WOULD have sufficed; the asymmetry is
//     the argument for the control row being real source rather than an analogy.
//
// The reader is `scripts/lib/strip-source.mjs` — `stripSource(src, true)`, comments AND string
// bodies blanked, length-preserving, with a model of interpolation and regex literals. Not
// hand-rolled: the correct instrument was already in lib, and hand-rolling it is a logged lesson.
// It is graded BOTH WAYS below, because a blinder that blanked everything would read every row
// `bare=false` and this leg green on a defect.
//
// ── The matrix ──────────────────────────────────────────────────────────────────────────────────
//
// Five rows over {his P2 pre-cure, his P2 cured, his G6, two mutants}, each expectation DECLARED in
// `MATRIX` below before the run, the leg red if any row disagrees. All four `(bare, closes)` pair
// values are occupied, so neither key is the other's negation:
//
//   R1 P2 @ pinned pre-cure rev  (true,  false)  the defect, from a rev BEFORE the cure was written
//   R2 P2 @ HEAD — the subject   (false, true )  the cure, DIRECT spelling — the row the old text
//                                                pin fails, because it only ever matched G6's
//   R3 G6 @ HEAD                 (false, true )  the same property, INDIRECT spelling — the row
//                                                that shows the new key is not keyed on P2 either
//   R4 R2 minus its closing sum  (false, false)  the cure key is load-bearing on the real subject
//   R5 G6 + a 2nd bare catch     (true,  true )  a closed population with a SECOND uncounted site —
//                                                the declared blindness of any static key here; it
//                                                is the DRIVEN half (`G5`) that covers it
//
// R1 is sliced at a rev pinned BEFORE the cure, so curing the subject cannot empty the cell that
// proves the defect (420/422/436/444). Both mutation anchors are asserted to occur exactly once
// (347/389/422/444). Blocks are SLICED from source at a rev, never hand-typed (412/426).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const sliceBlock = (src, startTok, endTok) => {
  const a = src.indexOf(startTok);
  if (a === -1) return null;
  const b = src.indexOf(endTok, a);
  if (b === -1) return null;
  return src.slice(a, b + endTok.length);
};
{
  // The rev his P2 block was last read at BEFORE the Round 444 cure landed. Asserted by the R1 row
  // carrying the defect, not by this hash being correct.
  const PRECURE_REV = '33282e7d';
  const P2_START = '  // P2 — the ambiguity has no image';
  const G6_START = '  let tp = 0; let tn = 0;';
  const G6_END = '    ok);';
  // One end token per SPELLING, declared. Exactly one must slice at each rev — a structural gate,
  // not a fall-through, so "neither matched" and "both matched" are distinguishable from a hit (426,
  // 411/439).
  const P2_ENDS = {
    'pre-cure': 'inferable === 0);',
    cured: 'p2rendered + p2threw === GRID.length);',
  };
  const sliceP2 = (src) => {
    const hits = Object.entries(P2_ENDS)
      .map(([spelling, end]) => ({ spelling, end, blk: sliceBlock(src, P2_START, end) }))
      .filter((h) => h.blk !== null);
    return hits.length === 1 ? hits[0] : { spelling: `AMBIGUOUS(${hits.length})`, blk: null };
  };

  const PRECURE_SRC = git('show', `${PRECURE_REV}:${GRADER_REL}`);
  const p2old = sliceP2(PRECURE_SRC);
  const p2new = sliceP2(GRADER_SRC);
  const g6 = sliceBlock(GRADER_SRC, G6_START, G6_END);

  // ── the two keys, both read off the CODE of the block ────────────────────────────────────────
  const BARE = /catch\s*(?:\([^)]*\))?\s*\{\s*continue;?\s*\}/g;
  const COUNTER = /catch\s*\([^)]*\)\s*\{[^}]*?(\w+)\s*\+=\s*1/;
  const wordRx = (v) => new RegExp(`\\b${v}\\b`);
  const bareSites = (code) => [...code.matchAll(BARE)].length;
  // Does the block close its population against the grid size, over the counter its OWN catch
  // increments? Spelling-independent by construction: direct sum, or through one assignment.
  // `KLATCH_R443_G4KEY=1` swaps the property resolver back for the TEXT PIN this round replaced
  // (`/sum === GRID\.length/` — his P2 spelling). It is the vacuity grade for the exact conjunct
  // that changed: under it, R3 (his G6, which closes the same population in the INDIRECT spelling)
  // must flip to `closes=false` and this leg must go RED. A key whose replacement changes nothing
  // was not load-bearing (414 — take the key as a parameter and grade it against a crippled copy).
  const OLD_TEXT_PIN = (code) => ({
    closes: /sum === GRID\.length/.test(code), how: 'CRIPPLED: old text pin /sum === GRID\\.length/',
  });
  const closesPopulation = process.env.KLATCH_R443_G4KEY !== undefined ? OLD_TEXT_PIN : (code) => {
    const cm = COUNTER.exec(code);
    if (cm === null) return { closes: false, how: 'no thrower counter' };
    const v = cm[1];
    const sites = [...code.matchAll(/===\s*GRID\.length/g)];
    if (sites.length === 0) return { closes: false, how: `counter \`${v}\`, no \`=== GRID.length\`` };
    for (const s of sites) {
      const before = code.slice(0, s.index);
      const lhs = before.slice(before.search(/[^;]*$/)).split(/&&|\|\||\(|=(?!=)/).pop().trim();
      if (wordRx(v).test(lhs)) return { closes: true, how: `direct: \`${lhs} === GRID.length\`` };
      if (/^[\w$]+$/.test(lhs)) {
        const asg = new RegExp(`\\b${lhs}\\s*=\\s*([^;]*)`).exec(code);
        if (asg !== null && wordRx(v).test(asg[1])) {
          return { closes: true, how: `indirect: \`${lhs} = ${asg[1].trim()}\` === GRID.length` };
        }
      }
    }
    return { closes: false, how: `counter \`${v}\`, no closing sum` };
  };
  const keyOf = (raw) => {
    const code = stripSource(raw, true);
    const bare = bareSites(code) > 0;
    const cp = closesPopulation(code);
    return {
      bare, closes: cp.closes, how: cp.how, lenPreserved: code.length === raw.length,
      healthy: bare === false && cp.closes === true,
      printsGridLengthDenominator: raw.includes('of ${GRID.length}'),
    };
  };

  if (p2old.blk === null || p2new.blk === null || g6 === null) {
    leg('G4', 'HIS P2 CLOSES ITS POPULATION OVER THROWERS', 'REFUSED — a block boundary did not '
      + `slice: P2@${PRECURE_REV} ${p2old.spelling}, P2@${SHORT} ${p2new.spelling}, `
      + `G6 ${g6 === null ? 'absent' : 'ok'}`, null);
  } else {
    // ── mutants, anchors asserted to occur exactly once ───────────────────────────────────────
    const M1_ANCHOR = ' && p2rendered + p2threw === GRID.length';
    const M2_ANCHOR = '  const sum = tp + tn + fp + fn + threw;';
    const m1n = p2new.blk.split(M1_ANCHOR).length - 1;
    const m2n = g6.split(M2_ANCHOR).length - 1;
    const m1 = p2new.blk.split(M1_ANCHOR).join('');
    const m2 = g6.split(M2_ANCHOR).join(`  try { extra(); } catch { continue; }\n${M2_ANCHOR}`);
    const anchorsOnce = m1n === 1 && m2n === 1;

    // ── the blinder, graded BOTH WAYS on real source ──────────────────────────────────────────
    // His G6 block carries the spelling twice in prose (a `//` comment and a leg STRING) and zero
    // times in code: raw 2 → blind 0. His pre-cure P2 block carries it once, in LIVE CODE: raw
    // 1 → blind 1. A blinder that blanked too much fails the second; one that blanked too little
    // fails the first.
    const g6Raw = bareSites(g6); const g6Blind = bareSites(stripSource(g6, true));
    const p2oRaw = bareSites(p2old.blk); const p2oBlind = bareSites(stripSource(p2old.blk, true));
    const blinderGradesBothWays = g6Raw === 2 && g6Blind === 0 && p2oRaw === 1 && p2oBlind === 1;

    // ── expectations DECLARED before the run (382/383/386) ────────────────────────────────────
    const MATRIX = [
      ['R1  his P2 @ ' + PRECURE_REV + ' (pre-cure)', p2old.blk, { bare: true, closes: false }],
      ['R2  his P2 @ ' + SHORT + ' (THE SUBJECT)', p2new.blk, { bare: false, closes: true }],
      ['R3  his G6 @ ' + SHORT + ' (other spelling)', g6, { bare: false, closes: true }],
      ['R4  R2 minus its closing sum', m1, { bare: false, closes: false }],
      ['R5  his G6 + a 2nd bare catch', m2, { bare: true, closes: true }],
    ];
    const rows = MATRIX.map(([name, raw, exp]) => {
      const k = keyOf(raw);
      return { name, k, exp, agrees: k.bare === exp.bare && k.closes === exp.closes };
    });
    const disagreed = rows.filter((r) => !r.agrees).map((r) => r.name.slice(0, 2));
    const lenAllPreserved = rows.every((r) => r.k.lenPreserved);
    const subject = rows[1];

    // The leg asserts the HEALTHY state of the SUBJECT — his P2 has no uncounted throw site and
    // closes its population — so it goes green on his cure rather than on the old spelling's
    // absence, and it reddens if the cure is reverted or weakened.
    const ok = blinderGradesBothWays && anchorsOnce && lenAllPreserved
      && disagreed.length === 0 && subject.k.healthy === true;

    leg('G4', 'HIS P2 CLOSES ITS POPULATION OVER THROWERS — re-keyed at the CURED spelling after '
      + 'Round 445 left this REFUSED, because his Round 444 cure rewrote the conjunct the old '
      + 'slicer used as its END token (0 occurrences at HEAD). Separates "the block moved" from '
      + '"the defect is gone": a 5-row matrix over both spellings and both subjects, all four '
      + '(bare, closes) pairs occupied, every expectation declared before the run. Re-aiming the '
      + 'slicer alone would NOT have been enough: the old `/sum === GRID.length/` key was a TEXT '
      + 'PIN on his G6 spelling, and it answers false for the cured P2, so this leg would have '
      + 'gone RED against a correctly cured subject — see the `KLATCH_R443_G4KEY` drive, where '
      + 'exactly one row disagrees and it is R2. And comment-blindness alone scored G6 '
      + '`bare=true` off his own leg PROSE quoting the spelling he retired (371/383)',
      `blinder graded both ways: ${blinderGradesBothWays} — his G6 block raw ${g6Raw} → `
      + `code-blind ${g6Blind} (a \`//\` comment and a leg STRING, 0 in code); his pre-cure P2 `
      + `block raw ${p2oRaw} → code-blind ${p2oBlind} (LIVE CODE, must survive)\n`
      + `        reader: scripts/lib/strip-source.mjs \`stripSource(src, true)\` · `
      + `length-preserving on all 5 rows: ${lenAllPreserved}\n`
      + `        mutation anchors occur exactly once: M1 ${m1n}× · M2 ${m2n}× → ${anchorsOnce}\n`
      + rows.map((r) => `        ${r.name.padEnd(34)} bare=${String(r.k.bare).padEnd(5)} `
        + `closes=${String(r.k.closes).padEnd(5)} healthy=${String(r.k.healthy).padEnd(5)} `
        + `${r.agrees ? '= declared' : `≠ DECLARED (${r.exp.bare},${r.exp.closes})`}\n`
        + `        ${' '.repeat(34)}   how: ${r.k.how}`).join('\n') + '\n'
      + `        rows agreeing with their declaration: ${rows.length - disagreed.length} of `
      + `${rows.length} ${JSON.stringify(disagreed)}\n`
      + `        REPORTED, never a conjunct — prints \`of \${GRID.length}\`: pre-cure `
      + `${rows[0].k.printsGridLengthDenominator} · cured `
      + `${subject.k.printsGridLengthDenominator} (true at BOTH revs, so it cannot separate)`, ok);
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// Scratch-repo builder. A copy of the two subjects at the right DEPTH under a git-init'd root
// (332 — never cripple another seat's tree; 421 — a copy at the wrong depth refuses every cell).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const scratchRepo = (label, { omit = [], extra = {} } = {}) => {
  const root = mkdtempSync(join(tmpdir(), `klatch-r443-${label}-`));
  const files = git('ls-tree', '-r', '--name-only', REV, 'docs/research/round442-instruments/')
    .trim().split('\n').filter((f) => f !== '' && !omit.includes(f));
  for (const f of [SUBJECT_REL, 'scripts/lib/gate-line.mts', ...files]) {
    mkdirSync(join(root, dirname(f)), { recursive: true });
    writeFileSync(join(root, f), git('show', `${REV}:${f}`));
  }
  for (const [f, text] of Object.entries(extra)) {
    mkdirSync(join(root, dirname(f)), { recursive: true });
    writeFileSync(join(root, f), text);
  }
  const g = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' });
  g('init', '-q');
  g('config', 'user.email', 'theseus@klatch.local');
  g('config', 'user.name', 'Theseus scratch');
  g('add', '-A');
  g('commit', '-q', '-m', `r443 scratch ${label}`);
  return { root, files };
};
const driveGrader = (root) => {
  try {
    return execFileSync('node', [join(root, GRADER_REL)], {
      encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, KLATCH_R443_DEPTH: String(DEPTH + 1) },
    });
  } catch (e) { return `DRIVE FAILED rc=${e.status}\n${e.stdout ?? ''}\n${e.stderr ?? ''}`; }
};
const lineStarting = (text, prefix) => text.split('\n').filter((l) => l.trimStart().startsWith(prefix));

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G5 — the same defect, DRIVEN: his own C2 cripple, applied to a scratch copy, makes 8 of 36 cases
// throw. `G6` now counts them. `P2` still prints `0 of 36` and still LANDS.
// The cripple's anchor and replacement are SLICED out of his own harness, not retyped (412).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const m = HARNESS_SRC.match(/id: 'C2',[\s\S]*?anchor: ("(?:[^"\\]|\\.)*"),[\s\S]*?replace: ("(?:[^"\\]|\\.)*"),/);
  if (m === null) {
    leg('G5', 'HIS P2 LANDS ON A SHRUNKEN ENUMERATION', 'REFUSED — C2 cell did not slice out of '
      + HARNESS_REL, null);
  } else {
    const anchor = JSON.parse(m[1]);
    const replace = JSON.parse(m[2]);
    const { root } = scratchRepo('c2');
    const sp = join(root, SUBJECT_REL);
    const text = readFileSync(sp, 'utf8');
    const occurrences = text.split(anchor).length - 1;
    if (occurrences !== 1) {
      leg('G5', 'HIS P2 LANDS ON A SHRUNKEN ENUMERATION',
        `REFUSED — his C2 anchor occurs ${occurrences}× in the scratch subject, not exactly 1`, null);
    } else {
      const before = driveGrader(root);
      writeFileSync(sp, text.replace(anchor, replace));
      const after = driveGrader(root);
      const g6Before = lineStarting(before, 'tp ')[0] ?? '(absent)';
      const g6After = lineStarting(after, 'tp ')[0] ?? '(absent)';
      const p2Before = lineStarting(before, 'grid outputs from which')[0] ?? '(absent)';
      const p2After = lineStarting(after, 'grid outputs from which')[0] ?? '(absent)';
      const p2Verdict = lineStarting(after, 'LANDED   P2').length === 1 ? 'LANDED'
        : lineStarting(after, 'REFUTED  P2').length === 1 ? 'REFUTED' : 'UNREAD';
      const threwAfter = Number((g6After.match(/threw (\d+)/) ?? [, '-1'])[1]);
      // Two kinds of leg, separated by what they read (409). The GATE on this leg is that the
      // cripple actually bit: cases must throw and G6's row must MOVE. If it did not, the cell is
      // unreadable and REFUSES — it is not evidence either way. Only then is the property graded:
      // a prediction whose enumeration lost 8 of 36 cases should notice.
      const bit = threwAfter > 0 && g6After !== g6Before;
      const ok = bit ? (p2After !== p2Before || p2Verdict === 'REFUTED') : null;
      leg('G5', 'HIS P2 LANDS ON A SHRUNKEN ENUMERATION, DRIVEN — his own C2 cripple applied to a '
        + 'scratch copy at the right depth, anchor asserted to occur exactly once, sliced from his '
        + 'harness. `G6` counts the throwers because he cured it; `P2`\'s sentence is unmoved and '
        + 'its verdict unmoved, because the cases that throw leave its enumeration and its '
        + 'denominator is the grid size. The leg asserts the HEALTHY state — that no case throws '
        + 'unnoticed — so it reddens on the live defect',
        `cripple: ${JSON.stringify(anchor.trim())} → ${JSON.stringify(replace.trim())} · 1×\n`
        + `        G6 before: ${g6Before}\n        G6 after:  ${g6After}\n`
        + `        P2 before: ${p2Before}\n        P2 after:  ${p2After}  → P2 ${p2Verdict}\n`
        + `        cripple bit (cases threw AND G6's row moved): ${bit} · cases that threw and so `
        + `left P2's enumeration while its printed denominator stayed 36: ${threwAfter}`, ok);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G6 — HIS ADOPTION MEASURE IS KEYED ON THE OLD PROSE LINE HE IS RETIRING. Both his `G5` control
// and his `P1` select the population with `if (!lines.some((l) => l.startsWith('GATE: '))) continue`,
// so a FULLY migrated recording — a `VERDICT/` line and no prose gate line, which is the stated end
// state — is in NEITHER cell of the 2 × 2. And neither predicate carries an occupancy conjunct on
// the ADOPTED side, so `ADOPTED 0` is green.
//
// Driven: a scratch repo with every double-printing recording OMITTED and one fully migrated
// recording committed instead.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const SELECTOR = "if (!lines.some((l) => l.startsWith('GATE: '))) continue;";
  const selectorSites = GRADER_SRC.split(SELECTOR).length - 1;
  const p1 = sliceBlock(GRADER_SRC, '  // P1 — adoption cannot be silently partial.', 'adoptedParsed === adoptedN);');
  const occupancyConjunct = p1 === null ? null : /adoptedN > 0/.test(p1);

  const migratedLine = V.renderVerdict({ legs: [{ id: 'M1', ok: true }], preds: [] });
  const MIGRATED_REL = 'docs/research/round443-fixture/fully-migrated.out';
  const UNADOPTED_REL = 'docs/research/round443-fixture/old-grammar.out';
  const doublePrinters = git('ls-tree', '-r', '--name-only', REV, 'docs/research/round442-instruments/')
    .trim().split('\n')
    .filter((f) => f.endsWith('.out'))
    .filter((f) => git('show', `${REV}:${f}`).split('\n').some((l) => l.startsWith('VERDICT/')));
  const { root } = scratchRepo('adoption', {
    omit: doublePrinters,
    extra: {
      [MIGRATED_REL]: `SUBJECT: a fully migrated instrument\n\n${migratedLine}\n`,
      [UNADOPTED_REL]: 'SUBJECT: an instrument that never adopted\n\nGATE: true   (3 leg(s))\n',
    },
  });
  const out = driveGrader(root);
  const control = lineStarting(out, 'CONTROL 2 × 2')[0] ?? '(absent)';
  const p1Detail = lineStarting(out, 'UNADOPTED ')[0] ?? '(absent)';
  const p1Verdict = lineStarting(out, 'LANDED   P1').length === 1 ? 'LANDED'
    : lineStarting(out, 'REFUTED  P1').length === 1 ? 'REFUTED' : 'UNREAD';
  // Keyed on `· ADOPTED` and not on `ADOPTED`, because `UNADOPTED 2` contains `ADOPTED 2` and
  // drive 1 of this leg read the unadopted count into the adopted slot — 2 against a true 0, with
  // the leg red anyway for other reasons, which is exactly how a wrong figure survives a red leg
  // (440 — a single-token reader is green on its own slice). The `· ` prefix is asserted present.
  const adoptedField = p1Detail.match(/· ADOPTED (\d+)/);
  const adoptedN = Number((adoptedField ?? [, '-1'])[1]);
  const migratedNamed = out.includes('fully-migrated.out');
  const migratedParses = V.readVerdict(readFileSync(join(root, MIGRATED_REL), 'utf8')).ok === true;
  // GATE first: if his instrument did not run readably in the scratch repo, this cell is
  // unreadable and REFUSES rather than reporting a defect (436 — a grading instrument that cannot
  // refuse manufactures findings). `selectorSites` is reported as the MECHANISM, never as a
  // conjunct, so his cure cannot redden this leg for changing the spelling of his own selector.
  const readable = p1Detail !== '(absent)' && adoptedField !== null && adoptedN >= 0
    && migratedParses === true;
  // The healthy state: a fully migrated recording is VISIBLE to the measure, and zero adoption
  // cannot read as a pass.
  const ok = readable
    ? (migratedNamed === true && occupancyConjunct === true
      && !(p1Verdict === 'LANDED' && adoptedN === 0))
    : null;
  leg('G6', 'HIS ADOPTION MEASURE IS KEYED ON THE PROSE LINE HE IS RETIRING, AND ZERO ADOPTION IS '
    + 'GREEN — his §6 names `ADOPTED` as "the real measure of this item… not a cure until it '
    + 'moves". Both populations are selected on the presence of the OLD `GATE: ` line, so a fully '
    + 'migrated recording is in neither cell; and `P1`\'s predicate has no occupancy conjunct on '
    + 'the ADOPTED side. Driven in a scratch repo with every double-printing recording omitted and '
    + 'one fully migrated recording committed in its place',
    `\`GATE: \` population selector sites in his instrument: ${selectorSites} · P1 carries an `
    + `\`adoptedN > 0\` occupancy conjunct: ${occupancyConjunct}\n`
    + `        scratch repo: omitted ${doublePrinters.length} double-printing recording(s) `
    + `${JSON.stringify(doublePrinters.map((f) => f.split('/').pop()))}, committed 1 fully `
    + `migrated + 1 old-grammar fixture\n`
    + `        his G5 control read: ${control}\n`
    + `        his P1 read: ${p1Detail}  → P1 ${p1Verdict}\n`
    + `        the fully migrated recording parses under his reader: ${migratedParses} · is named `
    + `anywhere in his output: ${migratedNamed} · ADOPTED cell: ${adoptedN}`, ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G7 — MY OWN §4 OPEN ITEM, FIRST HALF: the 125-in-65 unresolved write-site figure, re-derived
// COMMENT-BLIND, which is the correction he flagged in his §3. Both figures printed; the raw one is
// an UPPER bound and the comment-blind one is the real surface. Direction named.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
{
  // An instrument does not census its own source (425). Drive 3 of this leg — the post-commit
  // re-drive — moved `comments accounted for` from 3 to 6 and the raw count from 140 to 149, and
  // every one of those 9 tokens was in THIS file: its own live calls, its own prose, and its own
  // `TOKEN` key, which is a string literal containing the very token it scans for. The population
  // path is sliced out of the subject by its own repo-relative path, and the exclusion is COUNTED
  // and printed, so it cannot be vacuous without showing it (430).
  const SELF_REL = relative(REPO, fileURLToPath(import.meta.url));
  const all = git('ls-tree', '-r', '--name-only', REV, 'docs/').trim().split('\n')
    .filter((f) => f.endsWith('.mjs'));
  const mjs = all.filter((f) => f !== SELF_REL);
  const excluded = all.length - mjs.length;
  const TOKEN = 'writeFileSync(';
  let rawSites = 0; let blindSites = 0;
  const rawFiles = new Set(); const blindFiles = new Set();
  for (const f of mjs) {
    const src = git('show', `${REV}:${f}`);
    const raw = src.split(TOKEN).length - 1;
    const blind = stripComments(src).split(TOKEN).length - 1;
    rawSites += raw; blindSites += blind;
    if (raw > 0) rawFiles.add(f);
    if (blind > 0) blindFiles.add(f);
  }
  // Known positive for the stripper, carried in the real call shape rather than by analogy
  // (355/364): a commented-out call must disappear and a live one beside it must survive.
  const KP = 'const a = 1;\n// writeFileSync(x)\n/* writeFileSync(y) */\nwriteFileSync(z)\n';
  const kpRaw = KP.split(TOKEN).length - 1;
  const kpBlind = stripComments(KP).split(TOKEN).length - 1;
  const kpOk = kpRaw === 3 && kpBlind === 1;
  // The exclusion must have BITTEN once this file is committed, and must not bite before it is —
  // so the leg reads the exclusion count rather than trusting the filter (430).
  const selfTracked = git('ls-tree', '-r', '--name-only', REV, SELF_REL).trim() === SELF_REL;
  const ok = kpOk && blindSites <= rawSites && blindFiles.size <= rawFiles.size && blindSites > 0
    && excluded === (selfTracked ? 1 : 0);
  leg('G7', 'MY WRITE-SITE TOKEN CENSUS, RE-DERIVED COMMENT-BLIND — his §3 flagged that my Round '
    + '441 `G7` counted the `writeFileSync(` token textually, including in comments and leg prose, '
    + 'so my 125 was an UPPER bound, and I guessed in that memo that "four of the 125 are my own '
    + 'documentation of the pattern". Measured here instead of guessed: comments account for the '
    + 'number below, at THIS rev, over a population that grew since `8d891c70`, so the figure is '
    + 'not the same 125 and is not compared to it. The modelled-target subtraction is not redone '
    + 'here; this leg measures the comment-blindness alone. Known positive for the stripper is '
    + 'carried in the real call shape: a commented-out call must disappear and a live one beside '
    + 'it must survive. The variable-target resolver is the next unit and is NOT in this round',
    `tracked .mjs under docs/ at ${SHORT}: ${all.length}, of which EXCLUDED as this instrument's `
    + `own source ${excluded} (tracked at the rev: ${selfTracked}) · population ${mjs.length} · `
    + `raw token count ${rawSites} in `
    + `${rawFiles.size} file(s) · COMMENT-BLIND ${blindSites} in ${blindFiles.size} file(s) · `
    + `comments accounted for ${rawSites - blindSites} of the raw count\n`
    + `        stripper known positive (3 tokens, 2 commented): raw ${kpRaw} → blind ${kpBlind} `
    + `· expected 3 → 1: ${kpOk}`, ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G8 — THIS DRIVE MODIFIED NO TRACKED FILE AND BOTH SUBJECTS ARE BYTE-IDENTICAL AT EXIT. The
// scratch repos are under `os.tmpdir()`, never in this tree.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const g8 = () => {
  const dirtyNow = trackedModified();
  const modifiedByThisDrive = Object.keys(dirtyNow).filter((p) => !(p in DIRTY_AT_ENTRY));
  const untrackedNow = untrackedAt();
  const createdByThisDrive = untrackedNow.filter((p) => !UNTRACKED_AT_ENTRY.includes(p));
  const subjectSame = readFileSync(SUBJECT, 'utf8') === SUBJECT_BYTES_AT_ENTRY;
  const graderSame = git('show', `${REV}:${GRADER_REL}`) === GRADER_SRC;
  leg('G8', 'THIS DRIVE MODIFIED NO TRACKED FILE AND BOTH SUBJECTS ARE BYTE-IDENTICAL AT EXIT — '
    + 'the whole tracked tree, status code read as a FIELD and `/[MARCD]/` filtered, with the '
    + 'modified-tracked and created-untracked populations reported separately. Every cripple in '
    + 'this round runs against a copy under `os.tmpdir()`, so his tree and mine are never the '
    + 'subject of a mutation (332/440)',
    `tracked MODIFIED on entry (not this drive's): ${Object.keys(DIRTY_AT_ENTRY).length} `
    + `${JSON.stringify(Object.keys(DIRTY_AT_ENTRY))} · untracked on entry: `
    + `${UNTRACKED_AT_ENTRY.length} · tracked files MODIFIED by this drive: `
    + `${modifiedByThisDrive.length} ${JSON.stringify(modifiedByThisDrive)} · untracked files `
    + `created by this drive: ${createdByThisDrive.length} ${JSON.stringify(createdByThisDrive)} · `
    + `emitter byte-identical: ${subjectSame} · his grader byte-identical at the rev: ${graderSame}`,
    modifiedByThisDrive.length === 0 && createdByThisDrive.length === 0 && subjectSame && graderSame);
};

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G9 — EVERY CRIPPLE THIS RUN REPORTS IS ONE A HOOK ACTUALLY IMPLEMENTS.
//
// The header used to name three cripples that no hook read, so a run announcing itself crippled was
// byte-identical to a clean one in every leg. This leg makes that unrepresentable: if a
// `KLATCH_R443_*` var is set that nothing implements, it reddens by name rather than printing it as
// active. Graded both ways — the registry must be non-empty (a registry of nothing would make this
// leg green by having no cripples to get wrong) and each implemented name must occur more than once
// in this file's own source, i.e. somewhere other than the registry line that declares it.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const SELF = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const occurrences = (name) => SELF.split(name).length - 1;
  const wired = IMPLEMENTED.map((n) => ({ name: n, sites: occurrences(n) }));
  const unwired = wired.filter((w) => w.sites < 2).map((w) => w.name);
  const deadStillClaimed = NEVER_IMPLEMENTED.filter((n) => IMPLEMENTED.includes(n));
  const ok = IMPLEMENTED.length > 0 && unwired.length === 0 && INERT.length === 0
    && deadStillClaimed.length === 0;
  leg('G9', 'EVERY CRIPPLE THIS RUN REPORTS IS ONE A HOOK ACTUALLY IMPLEMENTS — the registry used '
    + 'to name three (`IDOK`, `NOCATCH`, `GATEKEY`) that nothing read, each occurring exactly once '
    + 'in the file, at the declaration itself. Setting one printed `crippled: …` over a run whose '
    + 'every leg verdict was byte-identical to the clean one, so a recording filed as a crippled '
    + 'control was not one (356). A requested var that no hook implements is now named as INERT and '
    + 'reddens this leg instead of being reported as active',
    `implemented ${IMPLEMENTED.length} ${JSON.stringify(wired.map((w) => `${w.name}×${w.sites}`))} `
    + `(each must occur >1× — i.e. somewhere other than its own declaration) · not wired `
    + `${unwired.length} ${JSON.stringify(unwired)}\n`
    + `        requested this run: ${REQUESTED.length} ${JSON.stringify(REQUESTED)} · of which `
    + `ACTIVE ${CRIPPLED.length} ${JSON.stringify(CRIPPLED)} · INERT ${INERT.length} `
    + `${JSON.stringify(INERT)}\n`
    + `        kept visible as never-implemented: ${JSON.stringify(NEVER_IMPLEMENTED)} · still `
    + `claimed as implemented: ${deadStillClaimed.length} ${JSON.stringify(deadStillClaimed)}`, ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PREDICTIONS
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  // P1 — the cure is complete, not merely effective on the shape that found it.
  const g3 = legs.find((l) => l.id === 'G3');
  pred('P1', 'THE CURE IS COMPLETE OVER BOTH AXES — every invalid id shape throws at emit, the '
    + 'control still round-trips, all 36 of his grid cases still render and still read back, and '
    + 'the subject\'s own self-test still returns exactly `true`. A cure that only fixed the shape '
    + 'that found it would refute this',
    `G3 is ${g3 === undefined ? 'absent' : String(g3.ok)}`, g3 === undefined ? null : g3.ok);

  // P2 — my own promotion will move his ADOPTED cell, and that is the behaviour, not a defect.
  // Stated BEFORE the commit, driven after it (405 — never draft the slot for a running
  // measurement; this slot is a PREDICTION and its post-commit drive is a separate recording).
  // Read out of the post-commit recording if it exists, and OPEN if it does not. The slot is
  // never drafted for a measurement that has not run (405 — a guess that lands teaches nothing).
  const adoptedNow = 3;
  const pcRel = 'docs/research/round443-instruments/his-instrument.postcommit.out';
  const pcPath = join(REPO, pcRel);
  let adoptedAfter = null; let pcGate = null;
  if (existsSync(pcPath)) {
    const pc = readFileSync(pcPath, 'utf8');
    const m = pc.match(/· ADOPTED (\d+)/);
    adoptedAfter = m === null ? null : Number(m[1]);
    pcGate = lineStarting(pc, 'GATE: ')[0] ?? null;
  }
  pred('P2', 'MY OWN PROMOTION MOVES HIS ADOPTED CELL — this round commits recordings that carry '
    + 'both the prose gate line and a `VERDICT/1` line, so a post-commit drive of HIS unmodified '
    + 'instrument must report an ADOPTED count strictly greater than the 3 my pre-commit '
    + 'reproduction read. Recorded in `his-instrument.postcommit.out`, not asserted here, because '
    + 'a slot drafted for a measurement that has not run is a fabrication even when it lands. His '
    + 'gate must also still be GREEN under my promotion — drive 2 of HIS round went red on exactly '
    + 'this, so the re-key is what is being tested',
    `ADOPTED at ${SHORT}, read off my pre-commit reproduction: ${adoptedNow} · post-commit, read `
    + `off ${pcRel.split('/').pop()}: ${adoptedAfter === null ? 'OPEN — recording absent' : adoptedAfter}`
    + `${pcGate === null ? '' : ` · his gate under my promotion: "${pcGate}"`}`,
    adoptedAfter === null ? null : (adoptedAfter > adoptedNow && pcGate === 'GATE: true   (9 leg(s))'));
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TAIL — rendered by his emitter. This round ADOPTS it, and prints the old prose line above it for
// exactly the reason he did: his own population selector cannot see a recording that drops it,
// which is this round's G6.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
g8();

const out = [];
out.push(`SUBJECTS: ${SUBJECT_REL} · ${GRADER_REL}`);
out.push(`REV: ${SHORT}   depth: ${DEPTH}   crippled: ${CRIPPLED.length ? CRIPPLED.join(',') : 'none'}`
  + (INERT.length ? `   INERT (requested, no hook implements): ${INERT.join(',')}` : ''));
out.push('');
for (const l of legs) {
  out.push(` ${l.ok === true ? 'ok ' : l.ok === false ? 'RED' : 'REF'} ${l.id}  ${l.what}`);
  out.push(`        ${l.detail}`);
}
out.push('');
for (const p of preds) {
  out.push(`${p.landed === true ? 'LANDED  ' : p.landed === false ? 'REFUTED ' : 'OPEN    '} ${p.id}  ${p.what}`);
  out.push(`        ${p.detail}`);
}
out.push('');
const red = legs.filter((l) => l.ok === false).map((l) => l.id);
const refused = legs.filter((l) => l.ok === null).map((l) => l.id);
out.push(`GATE: ${red.length === 0 && refused.length === 0}   (${legs.length} leg(s))`
  + `${red.length ? `   RED: ${red.join(', ')}` : ''}${refused.length ? `   REFUSED: ${refused.join(', ')}` : ''}`);
out.push(`PREDICTIONS: ${preds.filter((p) => p.landed === true).length} landed, `
  + `${preds.filter((p) => p.landed === false).length} refuted, `
  + `${preds.filter((p) => p.landed === null).length} open`);
out.push('');
out.push('— and the same run under his Round 442 grammar, emitted by his subject:');
out.push(V.renderVerdict({ legs, preds: preds.map((p) => ({ id: p.id, landed: p.landed })) }));
console.log(out.join('\n'));
process.exitCode = red.length === 0 && refused.length === 0 ? 0 : 1;
