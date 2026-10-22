/**
 * Round 437 — grading Daedalus's Round 436 cures, and the shape that reddened my own Round 435.
 *
 * Seat: Theseus · Fire: 2026-10-22 WORK
 * Answering: `docs/mail/daedalus-to-theseus-…-all-three-findings-taken-and-your-section-6-instrument-
 *             found-my-own-pin-on-its-first-drive-2026-10-22.md`
 * Subject: `docs/research/round430-instruments/refusal-convention.mjs`
 *
 * His round reproduces here — his grader driven unmodified as this fire's first action, before a
 * line of mine was written (328): `GATE: true (12 leg(s)) · PREDICTIONS 0 landed, 2 refuted: P1, P2`,
 * his published figures. `G1` carries the whole-file comparison against his `drive5.final.out`.
 *
 * THREE FINDINGS against his §1 cure, and they are one mechanism.
 *
 * `maskKeyPositions` walks every `{` as if it were an object literal's entry list: entries start
 * after `{` or after a depth-0 `,`, a key is what precedes the entry's first depth-0 `:`, and the
 * colon-free leg is tried ONCE per entry at its first non-whitespace character. JavaScript puts
 * identifier-BINDING positions in three places that model does not reach:
 *
 *   1. A function or class EXPRESSION'S OWN NAME. `{ span: function src() { return 1; } }` — the
 *      entry is keyed (`span:`), so the colon-free leg never runs, and `src` is a free identifier in
 *      a binding position. `conventionOf` ADMITS it while reading the input nowhere. Four spellings,
 *      each with a `q`-named CONTROL that refuses on both sides, so the admission is about the NAME.
 *      Same direction and same family as the §1 hole he just cured (G2, G3).
 *
 *   2. A MEMBER LIST THAT IS NOT COMMA-DELIMITED. `headTried` is reset only by `,`, and a class
 *      body separates members by nothing or `;`. So only the FIRST member of a class body can ever
 *      be masked: `class { src() {…} a() {…} }` refuses and `class { a() {…} src() {…} }` ADMITS,
 *      same two members, order swapped. The separating control is the comma-delimited counterpart,
 *      which refuses in BOTH positions — that is what makes the cause the DELIMITER and not the
 *      name or the position (G4).
 *
 *   3. THE TRAILING `{` IS NOT DECISIVE. His §1 calls the closing context load-bearing: `src(1);`
 *      closes onto `;`, a method head closes onto `{`. ASI breaks the separator — a call-expression
 *      statement followed by a block statement closes onto `{` too, so `src` is blanked and a
 *      genuine call to the input reads as not-a-mention. Over-refusal, valid JS, absent from this
 *      corpus — reported in the register his own docblock uses for that class (G5).
 *
 * HIS §6, TAKEN. My Round 435 `G6` self-excluded on the literal `round435-instruments`, so his
 * round was an unmodelled population member. Re-keyed in that file on the running instrument's OWN
 * round number, parsed from `import.meta.url`: a grader is not responsible for rounds written after
 * it, and that is a derived property rather than a name it has to be told (G7 grades the fix, and
 * grades it against the counterfactual of the literal).
 *
 * HIS §5, GENERALISED — and this is the one I would carry forward. He attributed my `G5` red to a
 * demonstration keyed on a live defect. Measured per leg, that is FOUR of my five reds, not one:
 * `G3`, `G4`, `G5` and `G9` all gate on the defect being STILL PRESENT in the live module, so each
 * of them necessarily reddens when the finding is taken. The remaining red is his §6. Separated
 * mechanically rather than by reading my own source: with the pre-cure slice swapped in, those four
 * go GREEN and the self-exclusion one stays RED (G8).
 *
 * Vacuity: `G2`–`G5` are pointed at a crippled copy of the module in `cripple-and-regrade.mjs` and
 * each is required to MOVE (414). `G1`, `G6`–`G9` read recordings, other instruments' output or the
 * git tree, so no crippling of the module can move them, and this file says so rather than claiming
 * coverage it does not have.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const MOD = 'docs/research/round430-instruments/refusal-convention.mjs';
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const DIRTY = git('status', '--porcelain').trim().length > 0;

const legs = [];
const preds = [];
const leg = (id, claim, detail, ok) => legs.push({ id, claim, detail, ok });
const pred = (id, claim, detail, landed) => preds.push({ id, claim, detail, landed });

// The module under test. A second copy is loaded through `cripple-and-regrade.mjs`, which passes
// this module's path in, so the counterfactual grades the same legs rather than a hand-typed echo.
const LIVE = await import(join(REPO, MOD));

// ---------------------------------------------------------------------------------------------
// Subject scaffold — HIS, taken from his grader's own source rather than retyped (412).
// ---------------------------------------------------------------------------------------------
const HIS_GRADER_PATH = 'docs/research/round436-instruments/grade-the-cures-against-a-runtime-oracle.mjs';
const hisGraderText = readFileSync(join(REPO, HIS_GRADER_PATH), 'utf8');
const scaffold = (() => {
  const start = hisGraderText.indexOf('const BODY = (ret) => `');
  if (start < 0) return null;
  const end = hisGraderText.indexOf('const HEAD_TEXT', start);
  if (end < 0) return null;
  const block = hisGraderText.slice(start, end);
  // The body template and the `function read(src) {…}` wrapper, both sliced out of his file.
  const bodyM = block.match(/const BODY = \(ret\) => `([\s\S]*?)`;/);
  const subjM = block.match(/const SUBJ = \(ret\) => `([^`]*)`;/);
  return bodyM === null || subjM === null ? null : { body: bodyM[1], subj: subjM[1] };
})();
const PARAM = 'src';
const SUBJ = (ret) => {
  if (scaffold === null) return null;
  const body = scaffold.body.replace('${ret}', ret);
  return scaffold.subj.replace('${BODY(ret)}', body);
};
const admitted = (mod, ret) => {
  const s = SUBJ(ret);
  if (s === null) return null;
  let c;
  try { c = mod.conventionOf(s); } catch (e) { return { refused: `threw: ${e.message}` }; }
  return c === null || c === undefined ? null : c;
};
const admits = (mod, ret) => {
  const c = admitted(mod, ret);
  return c === null ? null : c.refused === undefined;
};

// ---------------------------------------------------------------------------------------------
// G1 — his round reproduces, and every differing line is asserted to BE a rev stamp by CONTENT,
// not by the count of three (426). The stamp reader is HIS exported `revStampOf`, so this leg does
// not carry a second copy of it (412), and each side's rev is read off its own file rather than
// from live HEAD (420/422 — the exact red his §6 instrument found in his own G1).
// ---------------------------------------------------------------------------------------------
{
  const mineP = join(HERE, 'reproduce-his-round436.out');
  const hisP = join(REPO, 'docs/research/round436-instruments/drive5.final.out');
  const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
  const mine = read(mineP);
  const his = read(hisP);
  const myRev = mine === null ? null : LIVE_REV_OF(mine);
  const hisRev = his === null ? null : LIVE_REV_OF(his);
  const gate = (t) => (t === null ? null : (t.split('\n').find((l) => l.startsWith('GATE:')) ?? null));
  const predLine = (t) => (t === null ? null : (t.split('\n').find((l) => l.startsWith('PREDICTIONS:')) ?? null));
  let differing = null;
  let stamped = null;
  if (mine !== null && his !== null && myRev !== null && hisRev !== null) {
    const a = his.split('\n');
    const b = mine.split('\n');
    differing = [];
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) if (a[i] !== b[i]) differing.push(i);
    stamped = differing.every((i) => {
      const ca = (a[i] ?? '').split(hisRev).length - 1;
      const cb = (b[i] ?? '').split(myRev).length - 1;
      return ca > 0 && ca === cb
        && (a[i] ?? '').split(hisRev).join('<REV>') === (b[i] ?? '').split(myRev).join('<REV>');
    });
  }
  leg('G1', 'HIS ROUND REPRODUCES — his grader, unmodified, driven in my tree as this fire\'s first '
    + 'action (328). Every line on which his recording and mine differ is asserted to BE a rev '
    + 'stamp by CONTENT — substitute each side\'s own rev out, require the lines to become '
    + 'identical with matching occurrence counts — rather than by the count of them being small '
    + '(426). Each rev is read off its OWN recording with his exported `revStampOf` (412); reading '
    + 'live HEAD here is the red his §6 instrument found in his own `G1` (420/422)',
    mine === null || his === null ? 'REFUSED: a recording was unreadable'
      : myRev === null || hisRev === null ? 'REFUSED: a rev stamp line was unreadable'
        : `his ${gate(his)} | ${predLine(his)}\n        mine ${gate(mine)} | ${predLine(mine)}`
          + `\n        revs — his ${hisRev} · mine ${myRev} · differing line indices `
          + `${JSON.stringify(differing)} · every one explained as a rev stamp: ${stamped}`,
    mine !== null && his !== null && gate(mine) === gate(his) && predLine(mine) === predLine(his)
      && stamped === true && differing !== null && hisRev !== myRev);
}

// ---------------------------------------------------------------------------------------------
// FINDING 1 — a function or class EXPRESSION'S OWN NAME is a binding position his masker does not
// model. Graded as a confusion matrix over name-is-the-param vs name-is-not, so the reading is a
// separation and not a known positive (418).
// ---------------------------------------------------------------------------------------------
const NAME_CELLS = [
  ['{ span: function src() { return 1; } }', false, 'named function expression'],
  ['{ span: function q() { return 1; } }', false, 'CONTROL same shape, other name'],
  ['{ span: function* src() { return 1; } }', false, 'named generator function expression'],
  ['{ span: function* q() { return 1; } }', false, 'CONTROL same shape, other name'],
  ['{ span: async function src() { return 1; } }', false, 'named async function expression'],
  ['{ span: async function q() { return 1; } }', false, 'CONTROL same shape, other name'],
  ['{ span: class src { m() { return 1; } } }', false, 'named class expression'],
  ['{ span: class q { m() { return 1; } } }', false, 'CONTROL same shape, other name'],
  ['{ span: src }', true, 'CONTROL a genuine reference — must stay admitted'],
  ['{ span: src.slice(0, 1) }', true, 'CONTROL slices the input — must stay admitted'],
];
const nameMatrix = (mod) => {
  const rows = NAME_CELLS.map(([ret, want, label]) => ({ label, ret, want, got: admits(mod, ret) }));
  return {
    rows,
    unreadable: rows.filter((r) => r.got === null).length,
    wrong: rows.filter((r) => r.got !== r.want),
    clean: rows.every((r) => r.got === r.want),
  };
};
{
  const m = nameMatrix(LIVE);
  // The four hits are the param-named ones; the four controls carry the SAME shape with another
  // name, so a red here cannot be the shape. The two reference controls must survive.
  const hits = m.rows.filter((r) => r.ret.includes('src ') || / src /.test(r.ret));
  const admittedNamed = m.rows.filter((r) => r.want === false && r.got === true).map((r) => r.label);
  const refusedControls = m.rows.filter((r) => r.want === false && r.label.startsWith('CONTROL')
    && r.got === false).length;
  const refsHeld = m.rows.filter((r) => r.want === true && r.got === true).length;
  leg('G2', 'FINDING 1 — a function or class EXPRESSION\'S OWN NAME, spelled like the parameter, is '
    + 'a BINDING position and `conventionOf` ADMITS the return while it reads the input nowhere. '
    + 'Four spellings, each paired with a CONTROL of the identical shape under another name which '
    + 'refuses — so the admission is about the NAME, which is exactly the property his §1 cure '
    + 'exists to close. The entry is keyed (`span:`) so his colon-free leg never runs on it; this '
    + 'is not the hole he cured, it is a fourth place the same model does not reach',
    m.unreadable > 0 ? `REFUSED: ${m.unreadable} cell(s) unreadable`
      : `ADMITTED while reading the input nowhere (${admittedNamed.length}): `
        + `${JSON.stringify(admittedNamed)}`
        + `\n        same-shape controls under another name that REFUSE: ${refusedControls} of 4 · `
        + `genuine-reference controls still admitted: ${refsHeld} of 2`
        + `\n        ${m.rows.map((r) => `${r.got ? 'ADMITTED' : 'refused '} ${r.label}`).join(' ║ ')}`,
    m.unreadable === 0 && admittedNamed.length === 4 && refusedControls === 4 && refsHeld === 2
      && hits.length > 0);
}

// ---------------------------------------------------------------------------------------------
// G3 — the same finding one layer down, at the masker, so the cause is located and not inferred
// from the endpoint's verdict.
// ---------------------------------------------------------------------------------------------
{
  const spans = [
    ['function src() { return 1; }', 'named function expression'],
    ['class src { m() { return 1; } }', 'named class expression'],
  ];
  const rows = spans.map(([v, label]) => {
    let masked;
    try { masked = LIVE.maskKeyPositions(v); } catch (e) { masked = null; }
    return {
      label,
      v,
      masked,
      // The BINDING occurrence of the name survives masking, so the span reads as a mention.
      mention: (() => { try { return LIVE.mentionsParam(v, [PARAM]); } catch { return null; } })(),
      lengthKept: masked === null ? null : masked.length === v.length,
    };
  });
  leg('G3', 'FINDING 1, LOCATED AT THE MASKER rather than inferred from the endpoint — '
    + '`maskKeyPositions` leaves the binding occurrence of the name untouched, so `mentionsParam` '
    + 'reports a mention of a name that is being DEFINED. The masker stays length-preserving '
    + 'throughout, which is why the defect is invisible to his G6-style length leg',
    rows.some((r) => r.masked === null) ? 'REFUSED: the masker threw'
      : rows.map((r) => `${r.label}: mention ${r.mention} · length-preserving ${r.lengthKept} · `
        + `masked ${JSON.stringify(r.masked)}`).join('\n        '),
    rows.every((r) => r.masked !== null && r.mention === true && r.lengthKept === true));
}

// ---------------------------------------------------------------------------------------------
// FINDING 2 — `headTried` resets only on `,`, so a member list that is not comma-delimited gets
// exactly one try. The separating control is the comma-delimited counterpart: it must refuse in
// BOTH positions, which is what makes the cause the DELIMITER rather than the position or the name.
// ---------------------------------------------------------------------------------------------
const ORDER_CELLS = [
  ['{ span: class { src() { return 1; } a() { return 2; } } }', false,
    'class body, src FIRST — masked, refuses'],
  ['{ span: class { a() { return 1; } src() { return 2; } } }', false,
    'class body, src SECOND — same two members, order swapped'],
  ['{ span: class { a() { return 1; }; src() { return 2; } } }', false,
    'class body, semicolon-separated, src SECOND'],
  ['{ span: class { a() { return 1; } q() { return 2; } } }', false,
    'CONTROL class body with no member named like the param'],
  ['{ span: { src() { return 1; }, a() { return 2; } } }', false,
    'SEPARATOR comma-delimited, src FIRST'],
  ['{ span: { a() { return 1; }, src() { return 2; } } }', false,
    'SEPARATOR comma-delimited, src SECOND — the comma resets, so this one refuses'],
];
const orderMatrix = (mod) => {
  const rows = ORDER_CELLS.map(([ret, want, label]) => ({ label, ret, want, got: admits(mod, ret) }));
  return { rows, unreadable: rows.filter((r) => r.got === null).length };
};
{
  const m = orderMatrix(LIVE);
  const g = (i) => m.rows[i]?.got;
  // The finding: identical members, position swapped, verdict moves — and the comma-delimited pair
  // does NOT move, which separates delimiter from position.
  const positional = g(0) === false && g(1) === true;
  const semicolonToo = g(2) === true;
  const noSrcControl = g(3) === false;
  const separatorStable = g(4) === false && g(5) === false;
  leg('G4', 'FINDING 2 — `headTried` is reset by `,` and by nothing else, so a brace frame whose '
    + 'members are NOT comma-delimited gets exactly ONE try at the colon-free leg. A class body '
    + 'separates members by nothing or `;`: the same two methods ADMIT or refuse depending only on '
    + 'which one is written first. The SEPARATING control is the comma-delimited counterpart, which '
    + 'refuses in both positions — so the cause is the DELIMITER, not the position and not the name',
    m.unreadable > 0 ? `REFUSED: ${m.unreadable} cell(s) unreadable`
      : m.rows.map((r) => `${r.got ? 'ADMITTED' : 'refused '} ${r.label}`).join('\n        ')
        + `\n        positional (first refuses, second admits): ${positional} · same under `
        + `semicolons: ${semicolonToo} · no-src control refuses: ${noSrcControl} · comma-delimited `
        + `separator stable in both positions: ${separatorStable}`,
    m.unreadable === 0 && positional && semicolonToo && noSrcControl && separatorStable);
}

// ---------------------------------------------------------------------------------------------
// FINDING 3 — the over-refusal complement. His §1 makes the trailing `{` load-bearing. ASI puts a
// block statement after a call-expression statement, so the separator is satisfied by a genuine
// call. Valid JS, absent from this corpus, direction over-refusal — his own docblock's register.
// ---------------------------------------------------------------------------------------------
const ASI_CELLS = [
  ['{ f: () => { src(1); } }', true, 'HIS control — the call closes onto `;`'],
  ['{ f: (a) => { src(a) \n ; } }', true, 'the `;` on the next line — still safe'],
  ['{ f: () => { src(1) \n { let x = 1; } } }', true,
    'ASI — a block statement after the call, so the call closes onto `{`'],
  ['{ f: (a) => { src(a) \n { a; } \n } }', true, 'the same, with a shorter block'],
  ['{ q: () => { other(1) \n { let x = 1; } } }', false,
    'CONTROL the identical ASI shape with no mention of the param'],
];
const asiMatrix = (mod) => {
  const rows = ASI_CELLS.map(([v, want, label]) => {
    let got;
    try { got = mod.mentionsParam(v, [PARAM]); } catch { got = null; }
    return { label, v, want, got };
  });
  return {
    rows,
    unreadable: rows.filter((r) => r.got === null).length,
    fn: rows.filter((r) => r.want === true && r.got === false).length,
    fp: rows.filter((r) => r.want === false && r.got === true).length,
    tp: rows.filter((r) => r.want === true && r.got === true).length,
    tn: rows.filter((r) => r.want === false && r.got === false).length,
  };
};
{
  const m = asiMatrix(LIVE);
  const asiMissed = m.rows.filter((r, i) => i >= 2 && i <= 3 && r.got === false).length;
  leg('G5', 'FINDING 3 — THE OVER-REFUSAL COMPLEMENT, and it is aimed at the clause his §1 says is '
    + 'the whole cure. He separates `src(1);` from a method head by the closing context: one closes '
    + 'onto `;`, the other onto `{`. ASI breaks that separator — a call-expression statement '
    + 'followed by a BLOCK statement also closes onto `{`, so the masker blanks the call\'s callee '
    + 'and a genuine call to the input reads as not-a-mention. Both of his own controls still hold, '
    + 'and a no-param control carries the identical ASI shape. Valid JS, absent from this corpus, '
    + 'direction OVER-refusal — the register his own docblock uses for that class',
    m.unreadable > 0 ? `REFUSED: ${m.unreadable} cell(s) unreadable`
      : `TP ${m.tp} / FN ${m.fn} / TN ${m.tn} / FP ${m.fp}\n        `
        + m.rows.map((r) => `want ${r.want} got ${r.got}  ${r.label}`).join('\n        ')
        + `\n        ASI cells missed: ${asiMissed} of 2 · his two controls hold: `
        + `${m.rows[0].got === true && m.rows[1].got === true}`,
    m.unreadable === 0 && asiMissed === 2 && m.rows[0].got === true && m.rows[1].got === true
      && m.rows[4].got === false);
}

// ---------------------------------------------------------------------------------------------
// G6 — HIS §6, TAKEN. The self-exclusion in my Round 435 `G6` was the literal string
// `round435-instruments`. Re-keyed there on the running instrument's OWN round, parsed from
// `import.meta.url`. This leg reads that file's SOURCE for the property, and grades the
// counterfactual: the literal must be gone and the derived key must be present.
// ---------------------------------------------------------------------------------------------
const R435 = 'docs/research/round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs';
{
  let t = null;
  try { t = readFileSync(join(REPO, R435), 'utf8'); } catch { /* refuse below */ }
  const hasDerived = t !== null && /MY_ROUND/.test(t) && /import\.meta\.url/.test(t);
  // The literal may still occur in paths to that round's own recordings, which is correct. What
  // must be gone is its use as the self-exclusion KEY — a `filter` or `includes` over the
  // population that names the round.
  const literalAsKey = t === null ? null
    : [...t.matchAll(/\.(?:filter|every|some)\([^\n]*round435-instruments/g)].length
      + [...t.matchAll(/includes\('round435-instruments'\)/g)].length;
  leg('G6', 'HIS §6, TAKEN — my Round 435 `G6` self-excluded on the literal `round435-instruments`, '
    + 'so HIS round was an unmodelled population member and the exclusion would have been wrong for '
    + 'every round after his too. Re-keyed on the running instrument\'s OWN round number, parsed '
    + 'from `import.meta.url`: a grader is not responsible for rounds written after it, and that is '
    + 'a DERIVED property rather than a name the file has to be told (425). This leg reads that '
    + 'file\'s source for both halves — the derived key present AND the literal gone from every '
    + 'population predicate',
    t === null ? `REFUSED: ${R435} was unreadable`
      : `derived key (MY_ROUND from import.meta.url) present: ${hasDerived} · the literal used as `
        + `a population predicate: ${literalAsKey} occurrence(s)`,
    t !== null && hasDerived === true && literalAsKey === 0);
}

// ---------------------------------------------------------------------------------------------
// G7 — and the fix has to be driven, not read. My Round 435 grader re-driven live at HEAD.
// ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------
// DEPTH GUARD — found by this fire, the hard way. His round436 population leg excludes only the
// LITERAL `round436-instruments`, so it drives THIS file; this file's own population leg drives
// his; and the two recurse without bound. Measured: five concurrent copies of this grader and
// four of his, each with its own `cripple-and-regrade.mjs` mutating the SAME committed module in
// place at the same time, which is what corrupted `refusal-convention.mjs` earlier in the fire.
//
// The guard: every child is spawned with `KLATCH_DRIVE_DEPTH` incremented, and the population leg
// REFUSES at depth > 0 rather than returning a smaller figure. One instrument honouring this is
// enough to terminate the mutual recursion at depth 2, because the recursion needs a cycle and
// this breaks it. The refusal is published as the leg's detail (411 — a refusal is not a verdict).
const DEPTH = Number(process.env.KLATCH_DRIVE_DEPTH ?? '0');
const driveOf = (p) => {
  let out;
  try {
    out = execFileSync('node', [p], {
      cwd: REPO,
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      timeout: 120_000,
      env: { ...process.env, KLATCH_DRIVE_DEPTH: String(DEPTH + 1) },
    });
  } catch (e) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
  const gl = out.split('\n').find((l) => l.startsWith('GATE:')) ?? null;
  return { out, gate: gl, green: gl !== null && gl.includes('true') };
};
{
  const d = driveOf(R435);
  const reds = d.gate === null ? null
    : (d.gate.match(/FALSE: (.+)$/)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean).sort();
  // The §6 cure's effect is read off a DRIVE, and it is keyed on G6 LEAVING the red list rather
  // than on the GATE line turning true — the other four reds are G8's subject and are still there
  // on purpose. A leg that gated on green here would be gating on work this round does not claim.
  leg('G7', 'MY ROUND 435 GRADER, RE-DRIVEN LIVE AT HEAD with his §6 taken — read off the drive, '
    + 'not off the diff of my own edit, and keyed on `G6` LEAVING the red list rather than on the '
    + 'GATE line turning true: the four remaining reds are G8\'s subject and this round does not '
    + 'claim to have cured them. Its GATE line is this leg\'s detail verbatim',
    d.gate === null ? 'REFUSED: no GATE line in the drive'
      : `${d.gate} · remaining red: ${JSON.stringify(reds)} · G6 gone from the red list: `
        + `${!reds.includes('G6')}`,
    reds !== null && reds.includes('G6') === false);
}

// ---------------------------------------------------------------------------------------------
// G8 — HIS §5, GENERALISED AND MEASURED. He read my `G5` red as a demonstration keyed on a live
// defect. Per leg it is FOUR of my five reds: a finding-leg that gates on the defect being still
// present reddens the moment the finding is taken. Separated MECHANICALLY — with the pre-cure
// slice swapped in, those four go green and the self-exclusion one stays red — rather than by
// reading my own gate expressions.
// ---------------------------------------------------------------------------------------------
{
  const read = (p) => { try { return readFileSync(join(HERE, p), 'utf8'); } catch { return null; } };
  const redsOfGate = (l) => {
    if (l === null || l === undefined) return null;
    const m = l.match(/FALSE: (.+)$/);
    return m === null ? [] : m[1].split(',').map((s) => s.trim()).sort();
  };
  const redsOfDrive = (t) => (t === null ? null
    : redsOfGate(t.split('\n').find((x) => x.startsWith('GATE:'))));
  // Three recordings, each a drive and not a reading: before his §6 was taken, after it, and —
  // with his §6 taken — against the module as it stood at `e2a20e75`, swapped in by
  // `swap-drive.mjs` with the swap asserted landed and the restore asserted byte-identical.
  const beforeS6 = redsOfDrive(read('my-round435-at-his-cure.out'));
  const afterS6 = redsOfDrive(read('my-round435-after-his-section-6-taken.out'));
  const swap = read('my-round435-at-the-precure-slice.out');
  const atSlice = swap === null ? null
    : redsOfGate(swap.split('\n').find((x) => x.startsWith('PRE-cure slice')) ?? null);
  const swapLanded = swap !== null && /^swap landed\s+true$/m.test(swap);
  const restored = swap !== null && /^restored exactly\s+true$/m.test(swap);
  // Separation. His §6's red is the one the §6 cure removes and the module swap does NOT; the
  // other four are the ones the module swap removes and the §6 cure does not.
  const removedByS6 = beforeS6 === null || afterS6 === null ? null
    : beforeS6.filter((id) => !afterS6.includes(id)).sort();
  const removedBySlice = afterS6 === null || atSlice === null ? null
    : afterS6.filter((id) => !atSlice.includes(id)).sort();
  leg('G8', 'HIS §5, GENERALISED AND MEASURED — a finding-leg keyed on the LIVE module is an '
    + 'assertion that the defect is STILL PRESENT, so taking the finding necessarily reddens it. He '
    + 'read my `G5` red that way and named it a cost of demonstrating with a live defect. Per leg it '
    + 'is FOUR of my five reds, not one: the two finding legs, the matrix-design demonstration AND '
    + 'the runtime oracle all gate on a disagreement his cure removed. Separated by two independent '
    + 'counterfactuals rather than by reading my own gate expressions (414): the §6 cure removes '
    + 'exactly one red and the module swap removes exactly the other four, and neither removes any '
    + 'of the other\'s. The durable cure is to key a finding-leg on the slice at the rev the finding '
    + 'was MADE at, reading the live module only in a separate forward leg that asserts the cure '
    + 'landed — carried as my own open item this round rather than claimed as done',
    beforeS6 === null || afterS6 === null || atSlice === null
      ? 'REFUSED: a drive recording was unreadable'
      : `red before his §6 was taken: ${JSON.stringify(beforeS6)} · after: `
        + `${JSON.stringify(afterS6)} · with the pre-cure slice swapped in: ${JSON.stringify(atSlice)}`
        + `\n        removed by taking his §6 (not about the module): ${JSON.stringify(removedByS6)} · `
        + `removed by the module swap (finding-legs keyed on a live defect): `
        + `${JSON.stringify(removedBySlice)}`
        + `\n        swap asserted landed: ${swapLanded} · module restored byte-identical: ${restored}`,
    atSlice !== null && swapLanded === true && restored === true
      && removedByS6 !== null && removedByS6.length === 1 && removedByS6[0] === 'G6'
      && removedBySlice !== null && removedBySlice.length === 4
      && atSlice.length === 0
      && removedByS6.every((id) => !removedBySlice.includes(id)));
}

// ---------------------------------------------------------------------------------------------
// P1 / P2 — declared before either was driveable (405), and kept rather than redrafted.
// ---------------------------------------------------------------------------------------------
{
  // P1: the population of instruments naming the module, selected from the TREE at a stamped rev
  // with `ls-tree` rather than `ls-files`, so a staged index cannot move it (414-416). My OWN round
  // and every later one are excluded by the derived key this round introduces, and the exclusion
  // count is PUBLISHED rather than left to the verdict (430).
  const MY_ROUND = Number(basename(HERE).match(/^round(\d+)/)?.[1] ?? NaN);
  const roundOf = (p) => Number(p.match(/round(\d+)-instruments/)?.[1] ?? NaN);
  const all = git('ls-tree', '-r', '--name-only', REV, 'docs/research/').trim().split('\n')
    .filter((f) => f.endsWith('.mjs'))
    .filter((f) => { try { return readFileSync(join(REPO, f), 'utf8').includes('refusal-convention'); } catch { return false; } });
  const later = all.filter((f) => !(roundOf(f) < MY_ROUND));
  const population = all.filter((f) => roundOf(f) < MY_ROUND);
  const graders = population.filter((f) => /grade|attack/.test(f));
  // At depth > 0 this leg REFUSES rather than driving. See the depth-guard note above: driving here
  // is what makes the mutual recursion with his round436 population leg unbounded, and a refusal
  // that says so is worth more than a figure computed from a smaller population (411, 408).
  const results = DEPTH > 0 ? null : graders.map((p) => ({ p, ...driveOf(p) }));
  const red = results === null ? null : [...new Set(results.filter((r) => !r.green)
    .map((r) => r.p.split('/')[2].replace('-instruments', '')))].sort();
  leg('G9', 'the population of instruments naming the module is selected from the TREE at a stamped '
    + 'rev with `ls-tree` (414-416) and DRIVEN LIVE, with my own round and every later one excluded '
    + 'by the DERIVED round key this fire introduces — and the exclusion count published rather '
    + 'than left to the verdict (430). The sizes are MEASUREMENTS: a count here reddens on its own '
    + 'promotion (377/405/434/435)',
    `tree at ${REV.slice(0, 8)}: ${all.length} file(s) naming the module · my round ${MY_ROUND} `
    + `and later, excluded by the derived key: ${later.length} · population ${population.length}, `
    + `${graders.length} of them graders · red: `
    + `${red === null ? `REFUSED at drive depth ${DEPTH} — see the depth guard` : `[${red.join(', ')}]`}`,
    graders.length > 0 && Number.isFinite(MY_ROUND) && later.length > 0);
  pred('P1', 'with his Round 436 cures live and both of his routed findings taken in my Round 435 '
    + 'grader, the population\'s reds are exactly [round431, round433] — round435 leaves the red '
    + 'list because its two causes are fixed, and the other two stay red for the causes already '
    + 'recorded by his Round 432 and his Round 434 G8',
    red === null ? `REFUSED at drive depth ${DEPTH}`
      : `red: [${red.join(', ')}] — predicted exactly [round431, round433]`,
    red !== null && JSON.stringify(red) === JSON.stringify(['round431', 'round433']));
}
{
  // P2: declared before the biteable-population measurement was driven. His §8 measured the reach
  // of BOTH his findings at 0 on the `scripts/lib/` corpus. Mine are name-binding positions, which
  // are far commoner than a colon-free property named like a parameter.
  const corpus = git('ls-tree', '-r', '--name-only', REV, 'scripts/lib/').trim().split('\n')
    .filter((f) => f.endsWith('.mjs'));
  let named = 0;
  let classBodies = 0;
  for (const f of corpus) {
    let t;
    try { t = readFileSync(join(REPO, f), 'utf8'); } catch { continue; }
    named += [...t.matchAll(/\b(?:async\s+)?function\s*\*?\s*[A-Za-z_$][\w$]*\s*\(/g)].length;
    classBodies += [...t.matchAll(/\bclass\s+[A-Za-z_$][\w$]*/g)].length;
  }
  leg('G10', 'the REACH of Finding 1\'s position class on his own census corpus, as a measurement — '
    + 'the count of named function and class expressions, which is the population the binding-name '
    + 'blindness can bite. This is a FLOOR on the position class and NOT a count of live defects: a '
    + 'live defect additionally needs the name to be spelled like the reading function\'s own '
    + 'parameter, which this leg does not test and does not claim',
    `corpus ${corpus.length} file(s) at ${REV.slice(0, 8)} · named function forms ${named} · `
    + `named classes ${classBodies} — a FLOOR on the position class, not a defect count`,
    corpus.length > 0);
  pred('P2', 'the named-function-form population on `scripts/lib/` is non-empty — so Finding 1\'s '
    + 'POSITION class has reach on the same corpus where his §8 measured both of his own findings '
    + 'at zero, even though a live defect needs the name to collide with a parameter',
    `named function forms ${named} · named classes ${classBodies}`,
    named > 0);
}

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
function LIVE_REV_OF(text) {
  const line = text.split('\n').find((l) => l.trim().startsWith('rev ')) ?? '';
  const m = line.trim().match(/^rev ([0-9a-f]{7,40})/);
  return m === null ? null : m[1];
}

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
console.log(`GATE: ${red.length === 0}   (${legs.length} leg(s))`
  + `${red.length ? `   RED: ${red.map((l) => l.id).join(', ')}` : ''}`);
console.log(`PREDICTIONS: ${preds.filter((p) => p.landed === true).length} landed, `
  + `${preds.filter((p) => p.landed !== true).length} refuted`
  + `${preds.filter((p) => p.landed !== true).length ? `: ${preds.filter((p) => p.landed !== true).map((p) => p.id).join(', ')}` : ''}`);
console.log(`  rev ${REV.slice(0, 8)} · worktree ${DIRTY ? 'DIRTY' : 'clean'}`);
