/**
 * Round 444 — grade the three cures Theseus routed to this seat in Round 443 §7.
 *
 * Subjects: `docs/research/lib/verdict.mjs` (§1 — round-trip closure and a declared id grammar) and
 * `docs/research/round442-instruments/grade-the-shared-verdict-emitter.mjs` (§3 — P2's thrower cell;
 * §4 — the adoption population re-key).
 *
 * THE BEFORE STATE IS PINNED TO A REV, NOT RE-DERIVED. Every cell that compares pre-cure with
 * post-cure reads the pre-cure subject as a BLOB at `PRE_REV` and imports it beside the working
 * tree's copy. An old cell sourced from HEAD inverts the moment the cure lands, and that has now
 * happened three times on this project (420/422/436), which is also why the cure was committed
 * BEFORE this instrument was driven rather than after.
 *
 * Driving it: `node docs/research/round444-instruments/grade-the-round-trip-cure.mjs`
 */

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const SHORT = REV.slice(0, 8);

// ── Depth guard, keyed on THIS file's own directory (421). ──────────────────────────────────────
const DEPTH = Number(process.env.KLATCH_R444_DEPTH ?? '0');
if (DEPTH > 1) { console.log('REFUSED: crippler recursion depth exceeded'); process.exit(0); }

const SUBJECT_REL = 'docs/research/lib/verdict.mjs';
const GRADER_REL = 'docs/research/round442-instruments/grade-the-shared-verdict-emitter.mjs';
const HIS_REL = 'docs/research/round443-instruments/grade-the-emitter-at-its-published-line.mjs';
const HIS_DRIVE5_REL = 'docs/research/round443-instruments/drive5.final.out';

/**
 * The rev the cure landed ON TOP OF. `626ab6fe` is the last commit before Round 444's first edit;
 * its `verdict.mjs` is the 327-line pre-cure file (asserted below by a property, not by its length:
 * the pre-cure copy must have no `ID_GRAMMAR` and must EMIT for the shapes the cured one throws on).
 */
const PRE_REV = '626ab6fe';

// ── Tracked-tree watch. Snapshot BEFORE anything runs; status codes read as a FIELD (412). ───────
const statusLines = () => git('status', '--porcelain').split('\n')
  .map((l) => l.match(/^(..) (.*)$/)).filter((m) => m !== null)
  .map((m) => ({ code: m[1], path: m[2] }));
const trackedModified = () => {
  const out = {};
  for (const { code, path } of statusLines()) if (/[MARCD]/.test(code)) out[path] = code;
  return out;
};
const DIRTY_AT_ENTRY = trackedModified();
const BYTES_AT_ENTRY = Object.fromEntries([SUBJECT_REL, GRADER_REL, HIS_REL]
  .map((r) => [r, readFileSync(join(REPO, r), 'utf8')]));

const legs = [];
const preds = [];
const leg = (id, what, detail, ok) => legs.push({ id, what, detail, ok });
const pred = (id, what, detail, landed) => preds.push({ id, what, detail, landed });

const SCRATCH = mkdtempSync(join(tmpdir(), 'klatch-r444-'));
let seq = 0;
/** Import a module from source text. Fresh path per call, so no import cache collision. */
const importSource = async (src, tag) => {
  seq += 1;
  const p = join(SCRATCH, `${tag}-${seq}.mjs`);
  writeFileSync(p, src);
  return import(`file://${p}`);
};

const NEW_SRC = readFileSync(join(REPO, SUBJECT_REL), 'utf8');
const OLD_SRC = git('show', `${PRE_REV}:${SUBJECT_REL}`);
const NEW = await importSource(NEW_SRC, 'new');
const OLD = await importSource(OLD_SRC, 'old');

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// THE SHAPE POPULATION. His Round 443 §1 table verbatim as the eight shapes he drove — including
// his plain-id CONTROL row — plus three PREDICATION shapes his matrix did not reach, because his
// axis was leg ids and `preds` feeds `refuted=`/`prefused=` through the same unvalidated path.
//
// Each shape carries its own EXPECTED lists, computed here from the shape itself rather than from
// the module under test, so the oracle is not the thing being graded.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const SHAPES = [
  { k: 'control: id "G1"', c: { legs: [{ id: 'G1', ok: false }] }, control: true },
  { k: 'id key absent', c: { legs: [{ name: 'G1', ok: false }] } },
  { k: 'id: undefined', c: { legs: [{ id: undefined, ok: false }] } },
  { k: "id: ''", c: { legs: [{ id: '', ok: false }] } },
  { k: "id: 'A,B'", c: { legs: [{ id: 'A,B', ok: false }] } },
  { k: "id: 'G4 b'", c: { legs: [{ id: 'G4 b', ok: false }] } },
  { k: "id: 'a=b'", c: { legs: [{ id: 'a=b', ok: false }] } },
  { k: "id: 'x]y'", c: { legs: [{ id: 'x]y', ok: false }] } },
  // Mine. The first two PARSE under the reader and are refused only by comparing the parsed list to
  // the one that went in; the third is caught by the count check.
  { k: "PRED id: 'A,B' beside a green pred", c: { legs: [{ id: 'G1', ok: true }], preds: [{ id: 'A,B', landed: false }, { id: 'Pok', landed: true }] } },
  { k: "PRED id: '' (prefused)", c: { legs: [{ id: 'G1', ok: true }], preds: [{ id: '', landed: null }] } },
  { k: "PRED id: 'A,B' alone", c: { legs: [{ id: 'G1', ok: true }], preds: [{ id: 'A,B', landed: false }] } },
];
const expected = (c) => ({
  red: (c.legs ?? []).filter((l) => l.ok === false).map((l) => l.id),
  refused: (c.legs ?? []).filter((l) => l.ok === null).map((l) => l.id),
  refuted: (c.preds ?? []).filter((p) => p.landed === false).map((p) => p.id),
  prefused: (c.preds ?? []).filter((p) => p.landed === null).map((p) => p.id),
});

/**
 * Classify one (module, shape) pair into exactly one positively-keyed outcome. No fall-through
 * bucket: an unrecognised state is `UNCLASSIFIED` and is counted, so a blindness cannot be absorbed
 * by the last branch (411/439).
 */
const classify = (M, shape) => {
  let line;
  try { line = M.renderVerdict(shape.c); } catch (e) { return { o: 'THREW', line: null, why: e.message.slice(0, 80) }; }
  const r = M.readVerdict(line);
  if (r.ok === false) return { o: 'EMITTED_REFUSED', line, why: r.refusal };
  if (r.ok === true) {
    const w = expected(shape.c);
    // Length AND element, never a joined string: drive 1 of this instrument graded
    // `preds: [{ id: '', landed: null }]` FAITHFUL against a true loss of the id, because
    // `[''].join(x) === [].join(x)`. The oracle had the same defect as the subject it grades.
    const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    const bad = ['red', 'refused', 'refuted', 'prefused']
      .filter((f) => !same(r.verdict[f], w[f]));
    if (bad.length) return { o: 'EMITTED_MISREAD', line, why: `${bad.join(',')} read back wrong` };
    return { o: 'EMITTED_FAITHFUL', line, why: '' };
  }
  return { o: 'UNCLASSIFIED', line, why: JSON.stringify(r).slice(0, 60) };
};

const tally = (M) => {
  const t = { THREW: 0, EMITTED_REFUSED: 0, EMITTED_MISREAD: 0, EMITTED_FAITHFUL: 0, UNCLASSIFIED: 0 };
  const rows = [];
  for (const s of SHAPES) { const r = classify(M, s); t[r.o] += 1; rows.push({ k: s.k, ...r, control: s.control === true }); }
  return { t, rows };
};

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G1 — THE DEFECT REPRODUCES AGAINST THE PINNED PRE-CURE BLOB AND IS CLOSED AGAINST THE TREE.
//
// A confusion matrix over id SHAPE × subject VERSION. The OLD row must CARRY the defect — without
// that conjunct this leg would be green against a version that never had it, which is a cure graded
// against itself (355/364 — a known positive must carry the property, not an analogy).
//
// The published-STRING key is separate from the counts, because the artifact a consumer reads is
// the string: his §1 headline was not "7 refuse" but that three shapes publish a red run with an
// empty red list (443 — guard the published string, not the arrays it came from).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const RED_EMPTY_RED = 'VERDICT/1 RED legs=1 red=[] refused=[] preds=0 refuted=[] prefused=[]';
let OLD_TALLY = null; let NEW_TALLY = null;
{
  const o = tally(OLD); const n = tally(NEW);
  OLD_TALLY = o; NEW_TALLY = n;
  const oldPublishedRedEmpty = o.rows.filter((r) => r.line === RED_EMPTY_RED).map((r) => r.k);
  const newPublishedRedEmpty = n.rows.filter((r) => r.line === RED_EMPTY_RED).map((r) => r.k);
  const oldControl = o.rows.find((r) => r.control);
  const newControl = n.rows.find((r) => r.control);
  const preIsPreCure = !/ID_GRAMMAR/.test(OLD_SRC);
  const oldBroken = o.t.EMITTED_REFUSED + o.t.EMITTED_MISREAD;
  const newBroken = n.t.EMITTED_REFUSED + n.t.EMITTED_MISREAD;
  const ok = preIsPreCure
    && oldBroken > 0 && o.t.THREW === 0 && oldPublishedRedEmpty.length > 0
    && newBroken === 0 && n.t.UNCLASSIFIED === 0 && newPublishedRedEmpty.length === 0
    && n.t.THREW === SHAPES.length - 1
    && oldControl.o === 'EMITTED_FAITHFUL' && newControl.o === 'EMITTED_FAITHFUL';
  leg('G1', 'HIS ROUND 443 §1 DEFECT REPRODUCES AGAINST THE PINNED PRE-CURE BLOB AND IS CLOSED '
    + 'AGAINST THE TREE — one matrix, 11 id shapes × 2 subject versions, the pre-cure version read '
    + `as a blob at ${PRE_REV} and not re-derived from HEAD. The OLD row must carry the defect and `
    + 'the control row must round-trip under BOTH, so the cure cannot be graded against a version '
    + 'that never had the property or by a throw-everything emitter',
    `OLD (${PRE_REV}, no ID_GRAMMAR: ${preIsPreCure}): threw ${o.t.THREW} · emitted-then-refused `
    + `${o.t.EMITTED_REFUSED} · emitted-then-MISREAD ${o.t.EMITTED_MISREAD} · faithful `
    + `${o.t.EMITTED_FAITHFUL} · unclassified ${o.t.UNCLASSIFIED}\n`
    + `        NEW (${SHORT}): threw ${n.t.THREW} · emitted-then-refused ${n.t.EMITTED_REFUSED} · `
    + `emitted-then-MISREAD ${n.t.EMITTED_MISREAD} · faithful ${n.t.EMITTED_FAITHFUL} · `
    + `unclassified ${n.t.UNCLASSIFIED}\n`
    + `        PUBLISHED STRING \`RED legs=1 red=[]\` — a red run with an empty red list — occurs `
    + `OLD ${oldPublishedRedEmpty.length}× ${JSON.stringify(oldPublishedRedEmpty)}, NEW `
    + `${newPublishedRedEmpty.length}× ${JSON.stringify(newPublishedRedEmpty)}\n`
    + `        control row OLD ${oldControl.o} / NEW ${newControl.o}\n`
    + `        OLD outcome by shape: ${JSON.stringify(o.rows.map((r) => `${r.k}=${r.o}${r.why ? `(${r.why})` : ''}`))}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G2 — THE TWO EDITS ARE EACH GRADED WITH THE OTHER REMOVED, and the widening past his spec is
// MEASURED rather than argued.
//
// Four variants of the cured subject, each built by removing a named anchor from it and each anchor
// asserted to occur EXACTLY ONCE (347/389/422). `TWO_LIST` is his §2 spelling of the cure — "its
// parsed `red`/`refused` must equal `L.false`/`L.null`" — and the cell reports how many shapes it
// ADMITS, which is the whole content of the claim that four lists were needed.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const A_GRAMMAR = `      if (typeof it.id !== 'string' || !ID_GRAMMAR.test(it.id)) {`;
  const A_FOURTH = `    ['refuted', rt.verdict.refuted, P.false], ['prefused', rt.verdict.prefused, P.null],`;
  const A_RT = '  const rt = readVerdict(line);';
  const counts = {
    grammar: NEW_SRC.split(A_GRAMMAR).length - 1,
    fourth: NEW_SRC.split(A_FOURTH).length - 1,
    rt: NEW_SRC.split(A_RT).length - 1,
  };
  const anchorsOk = counts.grammar === 1 && counts.fourth === 1 && counts.rt === 1;

  // Removals. The grammar block is four lines from its `if`; the round-trip block runs from its
  // first line to `  return line;`, and the slice is gated STRUCTURALLY on what it removed rather
  // than on "it occurred once" (426 — gate the slice structurally).
  const dropGrammar = (s) => {
    const i = s.indexOf(A_GRAMMAR);
    const j = s.indexOf('      }\n', i);
    return s.slice(0, i) + s.slice(j + '      }\n'.length);
  };
  const dropRoundTrip = (s) => {
    const i = s.indexOf(A_RT);
    const j = s.indexOf('  return line;', i);
    return { src: s.slice(0, i) + s.slice(j), cut: s.slice(i, j) };
  };
  const rtCut = dropRoundTrip(NEW_SRC);
  const cutLooksRight = rtCut.cut.includes('rt.ok !== true') && rtCut.cut.includes('read back as')
    && !dropGrammar(NEW_SRC).includes('ID_GRAMMAR.test');

  const VARIANTS = {
    BOTH: NEW_SRC,
    GRAMMAR_ONLY: rtCut.src,
    ROUNDTRIP_ONLY: dropGrammar(NEW_SRC),
    TWO_LIST: dropGrammar(NEW_SRC).split(A_FOURTH + '\n').join(''),
    NEITHER: dropRoundTrip(dropGrammar(NEW_SRC)).src,
  };
  const results = {};
  for (const [name, src] of Object.entries(VARIANTS)) {
    // eslint-disable-next-line no-await-in-loop
    const M = await importSource(src, name.toLowerCase());
    const t = tally(M);
    results[name] = t;
  }
  const admits = (name) => results[name].t.EMITTED_REFUSED + results[name].t.EMITTED_MISREAD;
  const controlFaithful = Object.keys(VARIANTS)
    .filter((n) => results[n].rows.find((r) => r.control).o !== 'EMITTED_FAITHFUL');
  // The claim being graded, stated as an inequality rather than as a pair of adjectives: the
  // four-list spelling admits strictly fewer shapes than the two-list one, and NEITHER must admit
  // the most, which is what makes this a matrix rather than a known positive.
  const ok = anchorsOk && cutLooksRight
    && admits('BOTH') === 0 && admits('GRAMMAR_ONLY') === 0 && admits('ROUNDTRIP_ONLY') === 0
    && admits('TWO_LIST') > 0 && admits('NEITHER') >= admits('TWO_LIST')
    && controlFaithful.length === 0;
  leg('G2', 'EACH EDIT IS SUFFICIENT ON ITS OWN, AND THE FOUR-LIST WIDENING PAST HIS SPEC IS WORTH '
    + `${admits('TWO_LIST')} SHAPES — five variants of the cured subject, each anchor asserted to `
    + 'occur exactly once and each slice gated on what it removed. `TWO_LIST` is his §2 spelling '
    + '(`red`/`refused` only); the count it admits is the entire content of my claim that the pred '
    + 'lists had to be compared too. `NEITHER` reproduces the pre-cure behaviour from the CURED '
    + 'source, which is a second, independent reading of G1\'s OLD row',
    `anchors grammar ${counts.grammar} · fourth-list ${counts.fourth} · round-trip ${counts.rt} `
    + `(each exactly 1: ${anchorsOk}) · removed slice carries the guard it claims to: ${cutLooksRight}\n`
    + `        shapes ADMITTED (emitted-then-refused + emitted-then-misread), of ${SHAPES.length}: `
    + Object.keys(VARIANTS).map((n) => `${n} ${admits(n)}`).join(' · ') + '\n'
    + `        throws by variant: ` + Object.keys(VARIANTS).map((n) => `${n} ${results[n].t.THREW}`).join(' · ')
    + `\n        TWO_LIST admits: `
    + JSON.stringify(results.TWO_LIST.rows.filter((r) => r.o === 'EMITTED_REFUSED' || r.o === 'EMITTED_MISREAD')
      .map((r) => `${r.k} → ${r.o}(${r.why})`))
    + `\n        control round-trips under every variant: ${controlFaithful.length === 0} `
    + `${JSON.stringify(controlFaithful)}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G3 — WHAT THE ROUND-TRIP GUARD IS WORTH TODAY, stated as the measurement and not as a boast.
//
// Given `ID_GRAMMAR`, is the round-trip reachable at all? This cell searches the space of ids the
// grammar ADMITS for one that breaks the correspondence, and reports the count. A guard whose
// reachable set is empty is belt-and-braces, and saying so is the honest version of "both edits
// hold" (408 — a refusing signal only raises a floor; say which end it can move).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const ALPHABET = ['G1', 'a', 'Z', '0', '_', '.', ':', '-', 'G.1', 'a:b', 'x-y', 'A_1', '9.9', '-:.', 'G1'.repeat(20)];
  let searched = 0; let broke = 0; const breakers = [];
  const M = NEW;
  for (const a of ALPHABET) for (const b of ALPHABET) {
    for (const shape of [
      { legs: [{ id: a, ok: false }, { id: b, ok: null }], preds: [] },
      { legs: [{ id: a, ok: true }], preds: [{ id: b, landed: false }, { id: a, landed: null }] },
    ]) {
      searched += 1;
      const r = classify(M, { c: shape, k: `${a}/${b}` });
      if (r.o === 'EMITTED_REFUSED' || r.o === 'EMITTED_MISREAD' || r.o === 'UNCLASSIFIED') {
        broke += 1; breakers.push(`${a}/${b} → ${r.o}(${r.why})`);
      } else if (r.o === 'THREW') { broke += 1; breakers.push(`${a}/${b} → THREW(${r.why})`); }
    }
  }
  // This leg is a MEASUREMENT with a stated direction, so it is green when the search is wide
  // enough to be worth reporting and every grammar-legal id round-trips. A non-zero `broke` would
  // mean the grammar admits an id the reader cannot carry, which is a defect in the grammar.
  const ok = searched >= 400 && broke === 0;
  leg('G3', 'EVERY ID THE GRAMMAR ADMITS ROUND-TRIPS, SO THE ROUND-TRIP GUARD IS CURRENTLY '
    + 'UNREACHABLE AND I AM NOT CLAIMING IT CATCHES ANYTHING TODAY — a search over grammar-legal '
    + 'ids, in both the leg and the pred position, for one that breaks the string/list '
    + 'correspondence. Its value is closure under a FUTURE widening of the grammar or a change to '
    + 'the reader, not a live catch; the edit that bites today is the grammar, and G2 shows each is '
    + 'sufficient alone',
    `grammar-legal id pairs searched ${searched} · that break the correspondence ${broke} `
    + `${JSON.stringify(breakers.slice(0, 3))}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G4 — HIS LITERAL SPELLING OF THE §3 CURE REFUTES P2 AGAINST A TRUE LANDED STATE, graded both
// ways in the same scratch copy (431 — a routed diagnosis needs the leg run; 345 — check a routed
// figure at the cure's granularity).
//
// His §3 cure line: "count the throwers in their own cell and assert `inferable + threw ===
// GRID.length`". `inferable` is the count of RENDERED outputs that LACK a list token, which is 0
// exactly when P2's own claim holds — so his conjunct is `0 === 36` in the healthy state. The cell
// below drives his spelling and mine in the same copy of the grader and requires them to DISAGREE,
// with mine landing.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const NEW_GRADER = readFileSync(join(REPO, GRADER_REL), 'utf8');
  const OLD_GRADER = git('show', `${PRE_REV}:${GRADER_REL}`);
  const HARNESS = readFileSync(join(REPO, 'docs/research/round442-instruments/cripple-and-regrade.mjs'), 'utf8');

  /** Slice between two anchors, each asserted to occur exactly once, or `null`. */
  const slice = (src, from, to) => {
    if (src.split(from).length - 1 !== 1 || src.split(to).length - 1 !== 1) return null;
    const i = src.indexOf(from); const j = src.indexOf(to, i);
    return j === -1 ? null : src.slice(i, j + to.length);
  };
  const GRID_SRC = slice(NEW_GRADER, 'const GRID = [];', '    r, f,\n  });\n}');
  const P2_NEW = slice(NEW_GRADER, '  // P2 — the ambiguity has no image under the new grammar.', 'GRID.length);');
  const P2_OLD = slice(OLD_GRADER, '  // P2 — the ambiguity has no image under the new grammar.', 'inferable === 0);');

  // The cripple is SLICED out of my own vacuity harness's C2 cell, not retyped — his §3 drove this
  // same cripple against my grader and I am not going to re-type the one line it turns on
  // (412 — a hand-typed reader is not a slice; 355 — his shape had inverted an exit code in my own
  // shared lib).
  // His own regex over my harness, reused rather than re-derived — it is the reader that has
  // already been driven against this cell once (431 — a routed diagnosis needs the leg run).
  const c2 = HARNESS.match(/id: 'C2',[\s\S]*?anchor: ("(?:[^"\\]|\\.)*"),[\s\S]*?replace: ("(?:[^"\\]|\\.)*"),/);
  const A = c2 === null ? null : JSON.parse(c2[1]);
  const B = c2 === null ? null : JSON.parse(c2[2]);
  const crippleSites = A === null ? -1 : NEW_SRC.split(A).length - 1;

  const MINE = 'p2rendered + p2threw === GRID.length';
  const HIS = 'inferable + p2threw === GRID.length';
  const mineSites = P2_NEW === null ? -1 : P2_NEW.split(MINE).length - 1;

  /**
   * Run one P2 spelling against one subject module and return its landed value. The predicate is
   * the SLICED source's own, never re-typed here; `pred` captures what the block publishes.
   */
  const runP2 = async (p2src, V) => {
    const mod = `export default async function (V) {
      ${GRID_SRC}
      let landed = null; let detail = null;
      const pred = (id, what, d, l) => { landed = l; detail = d; };
      { ${p2src} }
      return { landed, detail, grid: GRID.length };
    }`;
    const m = await importSource(mod, 'p2');
    return m.default(V);
  };

  const ready = GRID_SRC !== null && P2_NEW !== null && P2_OLD !== null
    && A !== null && B !== null && crippleSites === 1 && mineSites === 1;
  let cells = {};
  if (ready) {
    const V_OK = NEW;
    const V_CRIPPLED = await importSource(NEW_SRC.split(A).join(B), 'crippled');
    const SPELLINGS = {
      'PRE-CURE (his §3 subject)': P2_OLD,
      MINE: P2_NEW,
      'HIS LITERAL': P2_NEW.split(MINE).join(HIS),
    };
    for (const [name, src] of Object.entries(SPELLINGS)) {
      for (const [vname, V] of [['sound', V_OK], ['crippled', V_CRIPPLED]]) {
        // eslint-disable-next-line no-await-in-loop
        const r = await runP2(src, V);
        cells[`${name} / ${vname}`] = r;
      }
    }
  }
  const got = (k) => (cells[k] === undefined ? null : cells[k].landed);
  // The four claims, each a named cell. The PRE-CURE row is his §3 finding reproduced from the
  // pinned blob: 8 of 36 cases leave the enumeration and the prediction still LANDS.
  const ok = !ready ? null
    : got('PRE-CURE (his §3 subject) / sound') === true
      && got('PRE-CURE (his §3 subject) / crippled') === true
      && got('MINE / sound') === true
      && got('MINE / crippled') === false
      && got('HIS LITERAL / sound') === false;
  leg('G4', 'HIS §3 DEFECT REPRODUCES FROM THE PINNED PRE-CURE BLOCK, MY CURE CATCHES IT, AND HIS '
    + 'LITERAL SPELLING OF THE CURE REFUTES P2 AGAINST A TRUE LANDED STATE — three spellings of '
    + 'the P2 block, each SLICED from a grader source rather than retyped, × two subjects, the '
    + 'crippled one built with the C2 cripple sliced out of my own vacuity harness. The pre-cure '
    + 'row is the known positive: it must LAND under the cripple, which is the defect. His literal '
    + '`inferable + threw === GRID.length` is `0 + 0` against a grid of 36 whenever P2 is true',
    `slices: GRID ${GRID_SRC === null ? 'ABSENT' : `${GRID_SRC.length}B`} · P2 new `
    + `${P2_NEW === null ? 'ABSENT' : `${P2_NEW.length}B`} · P2 pre-cure `
    + `${P2_OLD === null ? 'ABSENT' : `${P2_OLD.length}B`} · C2 cripple anchor occurs `
    + `${crippleSites}× in the subject (exactly 1 required) · my conjunct occurs ${mineSites}× in `
    + `the sliced block\n        `
    + Object.entries(cells).map(([k, v]) => `${k}: ${v.landed === true ? 'LANDED' : v.landed === false ? 'REFUTED' : 'UNREAD'}`).join(' · ')
    + '\n        ' + Object.entries(cells).map(([k, v]) => `${k} → ${v.detail}`).join('\n        '),
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G5 — WHAT THE §4 RE-KEY ACTUALLY MOVED, counted independently of the grader. Member lists, not
// counts (340).
//
// Drive 2 of this leg read `VERDICT-only 0` and its sentence said the re-key had moved nothing in
// the live tree and was demonstrable only in a fixture. That was true of the tree and false one
// commit later: THIS round's own recordings print the `VERDICT/` line and no prose gate line, so
// they are the first fully migrated recordings in the repo and the first live members the old
// `GATE: `-only selector would have dropped — not unadopted, not adopted, invisible. The figure
// moved on my own promotion, which is the behaviour and not a defect in it
// (377/405/434/435; 380/397/412 — a cured figure can leave a live sentence about the old one, so
// this one is keyed on the partition rather than on either number).
//
// His §4 live datum was `3 → 6`; mine reads 13 post-commit. Most of that is population growth, NOT
// the re-key, and saying so is the point of the three-way partition: the re-key's own contribution
// is exactly the VERDICT-only column, and each member of it is re-verified here against its own
// blob rather than trusted from the partition that produced it.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
let LIVE_ADOPTED = null;
{
  const outs = git('ls-tree', '-r', '--name-only', REV, 'docs/research/').split('\n')
    .filter((f) => f.endsWith('.out'));
  let gateOnly = 0; const both = []; const verdictOnly = [];
  for (const f of outs) {
    const lines = git('show', `${REV}:${f}`).split('\n');
    const g = lines.some((l) => l.startsWith('GATE: '));
    const v = lines.some((l) => l.startsWith('VERDICT/'));
    if (g && v) both.push(f); else if (v) verdictOnly.push(f); else if (g) gateOnly += 1;
  }
  LIVE_ADOPTED = both.length + verdictOnly.length;
  const GRADER_SRC = readFileSync(join(REPO, GRADER_REL), 'utf8');
  const oldSelectorSites = GRADER_SRC.split("if (!lines.some((l) => l.startsWith('GATE: '))) continue;").length - 1;
  const newSelector = /if \(!hasGate && !hasVerdict\) continue;/.test(GRADER_SRC);
  const occupancy = /adoptedN > 0 && adoptedParsed === adoptedN/.test(GRADER_SRC);
  const g5occupancy = /adopted\.length > 0/.test(GRADER_SRC);
  // Each VERDICT-only member re-verified against its own blob: no line may START with `GATE: `,
  // which is the property that made it invisible. A member that failed this would mean the
  // partition above, not the selector, is what is wrong.
  const misfiled = verdictOnly.filter((f) => git('show', `${REV}:${f}`).split('\n')
    .some((l) => l.startsWith('GATE: ')));
  const ok = oldSelectorSites === 0 && newSelector && occupancy && g5occupancy
    && misfiled.length === 0;
  leg('G5', 'THE §4 RE-KEY\'S OWN CONTRIBUTION IS THE VERDICT-ONLY COLUMN, AND THIS ROUND PUT THE '
    + 'FIRST MEMBERS IN IT — every committed `.out` at the rev partitioned three ways, '
    + 'independently of the grader. Most of the 6 → 13 is population growth and is NOT the cure; '
    + 'the re-key\'s effect is the third column alone, which his §4 could only demonstrate in a '
    + 'fixture and which my own recordings now occupy for real. Each member of it is re-verified '
    + 'against its own blob, so a misfiled member would redden this rather than inflate it',
    `committed .out at ${SHORT}: prose-gate only ${gateOnly} · BOTH lines ${both.length} · `
    + `VERDICT-only — the members the old selector could not see — ${verdictOnly.length} `
    + `${JSON.stringify(verdictOnly)} · of those, misfiled (a prose gate line after all) `
    + `${misfiled.length} ${JSON.stringify(misfiled)}\n`
    + `        old \`GATE: \`-only selector sites remaining in the grader: ${oldSelectorSites} · `
    + `new selector present: ${newSelector} · P1 occupancy conjunct: ${occupancy} · G5 occupancy `
    + `conjunct: ${g5occupancy}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G6 — HIS OWN ROUND 443 INSTRUMENT WAS GOING TO BE THE ORACLE FOR ALL THREE CURES, AND IT CANNOT
// RUN AT THIS REV. Found by driving it, not by reading it.
//
// His `G3` applies his two proposed edits to the subject AS A BLOB AT THE REV
// (`git show ${REV}:${SUBJECT_REL}`) and guards each edit on its ANCHOR occurring exactly once. The
// anchor for the round-trip edit is `  return line;`, which survives the cure — so at a rev where
// the cure has landed, his patch inserts a SECOND `const rt = readVerdict(line);`, the scratch
// module is a SyntaxError, and his instrument dies at import. It does not print a red leg; it
// prints nothing at all, because his whole output is built and flushed at the tail.
//
// An anchor-presence guard cannot tell "this edit has not been applied" from "this edit is already
// here". Graded as a 2 × 2 so the collision is attributed to the cure rather than to his patch
// being broken in general: his sliced edits applied to the PRE-CURE blob must import cleanly.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
let HIS_OUT = null;
{
  const before = git('show', `${REV}:${HIS_DRIVE5_REL}`);
  const beforeV = NEW.readVerdict(before);
  let text = null;
  try {
    text = execFileSync('node', [join(REPO, HIS_REL)], {
      encoding: 'utf8', maxBuffer: 1 << 28, cwd: REPO,
      env: { ...process.env, KLATCH_R444_DEPTH: '1' },
    });
  } catch (e) { text = (e.stdout ?? '') + (e.stderr ?? ''); }
  HIS_OUT = text;
  const afterV = NEW.readVerdict(text);

  // His CURE_EDITS, SLICED out of his source and evaluated, never retyped.
  const HIS_SRC = readFileSync(join(REPO, HIS_REL), 'utf8');
  const editsSrc = (() => {
    const i = HIS_SRC.indexOf('const CURE_EDITS = [');
    const j = HIS_SRC.indexOf('\n];', i);
    return i === -1 || j === -1 ? null : `export default ${HIS_SRC.slice(i + 'const CURE_EDITS = '.length, j + 2)};`;
  })();
  // ─── Round 446 cure, routed by this seat against its own instrument ─────────────────────────
  // TWO defects here, both found by driving this leg one rev after his repair landed.
  //
  //  (a) THIS LEG SLICED HIS DATA AND RETYPED HIS GUARD. `CURE_EDITS` is lifted out of his source
  //      and never retyped — and then consumed by a hand-written `apply` keyed on
  //      `split(anchor).length - 1 === 1`. His Round 445 repair is IN THE GUARD, not the data:
  //      each edit now carries a `present` marker and an already-cured edit is skipped. A loop
  //      with no model of `present` reports `SyntaxError` on the cured blob forever, whatever he
  //      does to it. Slicing the inputs and retyping the consumer (428/412). His loop is sliced
  //      here too, now, and asserted to be the present-keyed one.
  //
  //  (b) THIS LEG ASSERTED THE DEFECT IT ROUTED AWAY. Its `ok` required his instrument to die
  //      with no verdict, so his repair REDDENED it — the probe that found the defect was
  //      asserting it. The cell is now a 2 × 2 whose known positive is the PINNED anchor-only
  //      loop out of this file's own pre-cure blob: that loop must still die on the cured blob,
  //      his repaired loop must not, and his live instrument must publish a readable verdict.
  //      Defect PRESENT at the pin, ABSENT in the tree — so the leg grades the repair.
  //
  // Graded in Round 446 `H2` (the 2 × 2 over both loops) and `H3` (his instrument at the pinned
  // pre-repair rev beside his working-tree copy). `docs/research/round446-instruments/`.
  // ────────────────────────────────────────────────────────────────────────────────────────────
  const sliceOnce = (src, start, endTok) => {
    const a = src.indexOf(start);
    if (a === -1 || src.split(start).length - 1 !== 1) return null;
    const b = src.indexOf(endTok, a);
    return b === -1 ? null : src.slice(a, b + endTok.length);
  };
  /** HIS guard, sliced — the loop, not just the data it eats. */
  const hisLoopSrc = sliceOnce(HIS_SRC, '  for (const e of CURE_EDITS) {', '\n  }');
  /**
   * MY retyped anchor-only loop, out of THIS FILE's own pre-cure blob. It is the known positive:
   * a cell with only his repaired loop in it could not tell "the guard was fixed" from "the tree
   * stopped tripping it" (355/364 — a known positive must carry the property).
   */
  const PINNED_SELF_REV = 'c3c6ec49';
  const oldLoopSrc = sliceOnce(git('show', `${PINNED_SELF_REV}:${relative(REPO, join(REPO, 'docs/research/round444-instruments/grade-the-round-trip-cure.mjs'))}`),
    '    const apply = (src) => {', '\n    };');

  let onPre = null; let onCured = null; let edits = null;
  let oldOnPre = null; let oldOnCured = null; let hisStates = null;
  const hisLoopIsPresentKeyed = hisLoopSrc !== null && /\bpresent\b/.test(hisLoopSrc);
  const oldLoopIsAnchorOnly = oldLoopSrc !== null && !/\bpresent\b/.test(oldLoopSrc);
  if (editsSrc !== null && hisLoopSrc !== null && oldLoopSrc !== null) {
    edits = (await importSource(editsSrc, 'his-edits')).default;
    // Both loops rebuilt from their own sliced text; each parameter named with the free variable
    // its own slice uses, so neither slice is edited to fit this harness.
    const loops = await importSource(
      'export const his = (CURE_EDITS, original) => {\n  let cured = original;\n'
      + '  const editStates = [];\n  const anchorCounts = [];\n'
      + `${hisLoopSrc}\n  return { cured, editStates };\n};\n`
      + 'export const old = (edits, src) => {\n'
      + `${oldLoopSrc.replace('    const apply = (src) => {', '  const apply = (src) => {')}\n`
      + '  return apply(src);\n};\n', 'loops');
    const tryImport = async (src, tag) => {
      try { await importSource(src, tag); return 'IMPORTS'; } catch (e) { return `${e.name}: ${e.message.slice(0, 48)}`; }
    };
    const hPre = loops.his(edits, OLD_SRC);
    const hCur = loops.his(edits, NEW_SRC);
    hisStates = { pre: hPre.editStates, cured: hCur.editStates };
    onPre = await tryImport(hPre.cured, 'his-on-pre');
    onCured = await tryImport(hCur.cured, 'his-on-cured');
    oldOnPre = await tryImport(loops.old(edits, OLD_SRC), 'old-on-pre');
    oldOnCured = await tryImport(loops.old(edits, NEW_SRC), 'old-on-cured');
  }
  const readable = beforeV.ok === true && edits !== null;
  const ok = !readable ? null
    : (hisLoopIsPresentKeyed && oldLoopIsAnchorOnly
      // His repaired guard survives BOTH blobs …
      && onPre === 'IMPORTS' && onCured === 'IMPORTS'
      // … the pinned anchor-only one survives only the pre-cure blob (the known positive) …
      && oldOnPre === 'IMPORTS' && /SyntaxError/.test(String(oldOnCured))
      // … and his live instrument publishes a verdict this reader accepts, green or refused.
      && afterV.ok === true);
  leg('G6', 'HIS ROUND 445 GUARD REPAIR HOLDS AGAINST THE CURED TREE, graded against the PINNED '
    + 'anchor-only loop rather than by asserting the defect. Round 444 reported that his `G3` '
    + 'guarded each edit on its ANCHOR occurring once, that the anchor `  return line;` survives '
    + 'its own cure, and that his instrument therefore died at import publishing nothing. He '
    + 'repaired it in `62e023ca`: each edit carries a `present` marker and the guard keys on the '
    + 'cure being ABSENT. Both loops are SLICED — his from his source, the retired one from this '
    + 'file\'s own pre-cure blob — and run over both subject blobs. The retired loop is the known '
    + 'positive: it must STILL die on the cured blob, or this cell could not tell a repaired '
    + 'guard from a tree that stopped tripping the old one',
    `his committed drive5 verdict (read with my reader): ${beforeV.ok ? beforeV.verdict.token : beforeV.refusal} `
    + `red=${JSON.stringify(beforeV.ok ? beforeV.verdict.red : null)}\n`
    + `        his instrument re-driven at ${SHORT}: ${afterV.ok ? `${afterV.verdict.token} red=${JSON.stringify(afterV.verdict.red)} refused=${JSON.stringify(afterV.verdict.refused)}` : afterV.refusal} · `
    + `output ${text.split('\n').length} line(s), VERDICT lines `
    + `${text.split('\n').filter((l) => l.startsWith('VERDICT/')).length}, leg lines `
    + `${text.split('\n').filter((l) => /^(?: ok |FAIL|REF ) G/.test(l)).length}\n`
    + `        loops, both sliced: his is present-keyed ${hisLoopIsPresentKeyed} (true required) · `
    + `the pinned ${PINNED_SELF_REV} loop is anchor-only ${oldLoopIsAnchorOnly} (true required)\n`
    + `        HIS REPAIRED GUARD × ${edits === null ? 'ABSENT' : `${edits.length}`} sliced edits → `
    + `PRE-CURE blob: ${onPre}${hisStates === null ? '' : ` ${JSON.stringify(hisStates.pre)}`} · `
    + `CURED blob: ${onCured}${hisStates === null ? '' : ` ${JSON.stringify(hisStates.cured)}`}\n`
    + `        RETIRED ANCHOR-ONLY LOOP (known positive) → PRE-CURE blob: ${oldOnPre} · `
    + `CURED blob: ${oldOnCured}\n`
    + `        his first error line: ${(text.split('\n').find((l) => /Error/.test(l)) ?? '(none)').slice(0, 90)}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G7 — THE TRACKED TREE. Carried forward, not retyped: a drive that rewrites a committed recording
// is the class Theseus censused in Round 441 §2 and found six generations deep (440/441).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const g7 = () => {
  const now = trackedModified();
  const foreign = Object.keys(now).filter((p) => !(p in DIRTY_AT_ENTRY));
  const same = Object.entries(BYTES_AT_ENTRY)
    .filter(([r, b]) => readFileSync(join(REPO, r), 'utf8') !== b).map(([r]) => r);
  leg('G7', 'THIS DRIVE REWROTE NO COMMITTED RECORDING, and the three files it reads as subjects '
    + 'are byte-identical at exit. His instrument is driven in-place by G6, so this is the cell '
    + 'that catches it having written to the tracked tree',
    `tracked MODIFIED on entry (not this drive's): ${Object.keys(DIRTY_AT_ENTRY).length} `
    + `${JSON.stringify(Object.keys(DIRTY_AT_ENTRY))} · tracked files MODIFIED by this drive: `
    + `${foreign.length} ${JSON.stringify(foreign)} · subjects byte-identical at exit: `
    + `${same.length === 0} ${JSON.stringify(same)}`,
    foreign.length === 0 && same.length === 0);
};

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PREDICTIONS
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  // P1 — the cure holds under HIS gate, not just under mine.
  //
  // ─── Round 446 cure, routed by this seat against its own instrument ───────────────────────────
  // This was `/^GATE: true/` over the one line of his output starting `GATE: `. His REPAIRED
  // instrument (Round 445, `62e023ca`) publishes `GATE: false   (8 leg(s))   REFUSED: G4` — with
  // `red=[]`. Nothing graded badly; one leg could not REACH its figure, because this round's own
  // §4 cure rewrote the `P2` block his slicer keys on. Under the old predicate that is
  // indistinguishable from `GATE: false … RED: G2, G4, G5, G6`, so the moment the blocker named
  // below was lifted this prediction scored REFUTED — publishing "his instrument says my cure is
  // wrong" off a leg that said nothing at all, which is the exact outcome the sentence below
  // forbids. The prose was right and the predicate four lines under it was not.
  //
  // Scored now off the shared reader, with the mapping taken from `topToken`'s own branch
  // literals rather than a regex over prose (426): `ok` → LANDED, `RED` → REFUTED, `REFUSED` →
  // open. Graded in Round 446 `H1` (the old predicate, over four real recordings, one per bucket)
  // and `H5` (this spelling, over the same four).
  // ──────────────────────────────────────────────────────────────────────────────────────────────
  const hisRead = HIS_OUT === null ? null : NEW.readVerdict(HIS_OUT);
  const hisTop = hisRead === null || hisRead.ok !== true ? null
    : NEW.topToken(hisRead.verdict.red, hisRead.verdict.refused);
  const hisVerdict = hisTop === null ? null : hisTop === 'ok' ? true : hisTop === 'RED' ? false : null;
  pred('P1', 'HIS GATE GOES GREEN AT THIS REV — PRE-REGISTERED BEFORE DRIVE 1. Round 444 left this '
    + 'REFUSED with one named blocker: his `G3` guard keyed on his patch ANCHOR being present '
    + 'rather than on the cure being ABSENT, so his instrument died at import against a cured tree '
    + 'and the oracle was unavailable. Round 445 (`62e023ca`) lifted it. It is now scorable, and '
    + 'the answer is REFUSED AGAIN FOR A SECOND, DIFFERENT REASON: his gate is false because `G4` '
    + 'cannot reach its figure — `red=[]`, no leg graded the tree badly — and a refusing signal '
    + 'only raises a floor (408). Scoring it REFUTED would blame the cure for his slicer keying on '
    + 'the spelling the cure replaced; scoring it LANDED on my own legs would be the thing it '
    + 'exists to avoid (436). Open until he re-aims `G4` at the cured `P2` spelling — his own next '
    + 'unit, behind his vacuity harness',
    `his verdict at ${SHORT}, read with the shared reader: `
    + `${hisRead === null ? 'NOT RUN' : hisRead.ok ? `${hisRead.verdict.token} red=${JSON.stringify(hisRead.verdict.red)} refused=${JSON.stringify(hisRead.verdict.refused)}` : hisRead.refusal}`
    + ` · topToken → ${hisTop ?? 'UNREADABLE'} · scored `
    + `${hisVerdict === null ? 'REFUSED (open)' : hisVerdict ? 'LANDED' : 'REFUTED'}`
    + ` · the retired \`/^GATE: true/\` predicate would score this `
    + `${(() => { const l = HIS_OUT === null ? null : (HIS_OUT.split('\n').find((x) => x.startsWith('GATE: ')) ?? null); return l === null ? 'open' : /^GATE: true/.test(l) ? 'LANDED' : 'REFUTED'; })()}`,
    hisVerdict);

  // P2 — my own promotion moves the adoption cell, and the re-key must hold under it. Stated here,
  // driven AFTER the commit into a separate recording (405 — never draft the slot for a running
  // measurement; the figure below is read out of the post-commit file or the slot stays OPEN).
  // THE BASELINE IS PINNED TO A COMMITTED RECORDING, NOT RECOMPUTED. Drive 3 scored this REFUTED
  // against a true LANDED: the baseline was `LIVE_ADOPTED`, counted in `G5` at HEAD, so committing
  // this round's recordings moved the baseline and the post-commit figure by the same 3 and
  // `13 > 13` is false. A cell sourced from HEAD inverts when the thing it measures lands, and this
  // is the fourth instance of that class on this project (420/422/436). Read now out of `drive2.out`
  // — the committed recording of the pre-commit drive — with both fields asserted to have matched,
  // so a missing field REFUSES rather than reading as a zero (393).
  const BASE_REL = 'docs/research/round444-instruments/drive2.out';
  let base = null; let baseWhy = 'unread';
  //
  // Read out of ONE asserted line, with a class that cannot cross a newline. Drive 4 read a
  // baseline of 74968: `/VERDICT-only[^0-9]*(\d+)/` over the whole file matched an earlier
  // occurrence of the label and then ran `[^0-9]*` ACROSS the newline to the first digits it could
  // find, which were in a rev hash on a later line (415 — a proximity-window key over-reports;
  // 412 — the row you are looking for becomes a terminator). The line is isolated first and
  // asserted to occur exactly once.
  try {
    const rows = git('show', `${REV}:${BASE_REL}`).split('\n')
      .filter((l) => l.trimStart().startsWith('committed .out at '));
    if (rows.length !== 1) baseWhy = `${rows.length} \`committed .out at\` rows in ${BASE_REL}, not 1`;
    else {
      const mb = rows[0].match(/BOTH lines (\d+)/);
      const mv = rows[0].match(/VERDICT-only[^0-9\n]*?(\d+)/);
      if (mb === null || mv === null) baseWhy = `fields absent in the ${BASE_REL} row`;
      else { base = Number(mb[1]) + Number(mv[1]); baseWhy = `BOTH ${mb[1]} + VERDICT-only ${mv[1]}`; }
    }
  } catch (e) { baseWhy = `${BASE_REL} not committed at ${SHORT}`; }

  const PC_REL = 'docs/research/round444-instruments/his-round442-instrument.postcommit.out';
  const pcPath = join(REPO, PC_REL);
  let pcAdopted = null; let pcGate = null; let pcMigrated = null;
  if (existsSync(pcPath)) {
    const pc = readFileSync(pcPath, 'utf8');
    const m = pc.match(/· ADOPTED (\d+)/);
    pcAdopted = m === null ? null : Number(m[1]);
    const mm = pc.match(/FULLY MIGRATED \(no prose line at all\) (\d+)/);
    pcMigrated = mm === null ? null : Number(mm[1]);
    pcGate = pc.split('\n').find((l) => l.startsWith('GATE: ')) ?? null;
  }
  pred('P2', 'MY OWN PROMOTION MOVES THE ADOPTED CELL AND THE RE-KEYED GATE SURVIVES IT — this '
    + 'round commits recordings carrying a `VERDICT/` line, so a post-commit drive of the re-keyed '
    + 'Round 442 instrument must read an ADOPTED count strictly greater than the pre-commit figure '
    + 'AND keep its gate green. This is the trap that reddened P1 on its own promotion in Round 442 '
    + 'drive 2, and a re-key that had not fixed it would fail here rather than in a fixture. Drive '
    + '3 scored it REFUTED off a baseline recomputed at HEAD — see the comment on the baseline',
    `ADOPTED baseline, PINNED to ${BASE_REL} at ${SHORT} (${baseWhy}): ${base ?? 'UNREADABLE'} · `
    + `live count at this rev, for contrast and NOT used as the baseline: ${LIVE_ADOPTED} · `
    + `post-commit, read off ${relative(REPO, pcPath)}: ${pcAdopted ?? 'OPEN (not yet driven)'} · `
    + `fully migrated post-commit: ${pcMigrated ?? 'OPEN'} · post-commit gate: ${pcGate ?? 'OPEN'}`,
    pcAdopted === null || pcGate === null || base === null ? null
      : (pcAdopted > base && pcMigrated > 0 && /^GATE: true/.test(pcGate)));
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TAIL — emitted by the subject, which is now the subject's third round as its own publisher.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
g7();

const out = [];
out.push(`SUBJECTS: ${SUBJECT_REL} · ${GRADER_REL}`);
out.push(`REV: ${SHORT}   pre-cure blob pinned at: ${PRE_REV}   depth: ${DEPTH}`);
out.push(`verdict.mjs selfTest(): ${NEW.selfTest()}`);
out.push('');
for (const l of legs) {
  out.push(`${l.ok === true ? ' ok ' : l.ok === false ? 'FAIL' : 'REF '} ${l.id}  ${l.what}`);
  out.push(`        ${l.detail}`);
}
out.push('');
for (const p of preds) {
  out.push(`${p.landed === true ? 'LANDED  ' : p.landed === false ? 'REFUTED ' : 'OPEN    '} ${p.id}  ${p.what}`);
  out.push(`        ${p.detail}`);
}
out.push('');
out.push(NEW.renderVerdict({ legs, preds }));

console.log(out.join('\n'));
process.exitCode = legs.some((l) => l.ok === false) ? 1 : 0;
