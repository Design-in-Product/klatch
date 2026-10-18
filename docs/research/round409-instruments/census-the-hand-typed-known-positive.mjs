/**
 * Round 409 — **census the routed class: a known positive that is a hand-typed string literal
 * standing in for a SLICED one.**
 *
 * Routed by Theseus's Round 408 §4, unblocked, not built: *"a hand-typed fixture in a key that
 * reads fixtures is a different object from the thing it imitates. Any leg whose KP is a string
 * literal standing in for a sliced string literal has this hole. I have not censused for it."*
 * Both of his own KPs were wrong, in opposite directions, in a file written about this hazard.
 *
 * ## The thing I measure, and why it is not the thing he named
 *
 * His §4 names one error class and one cure. The census finds the cure is **a stratum, not an
 * exit** — there are three ways a KP can be obtained, not two, and his cure moves a declaration
 * from the first to the second:
 *
 *   TYPED-LITERAL      the 408 error class. The KP's bytes are typed where it is declared, and
 *                      every escape in it was escaped by the KP's author rather than by the
 *                      author of the thing it stands for.
 *   TYPED-THEN-SLICED  408's cure. The KP is `reader(String.raw`<a source line>`)` — the escapes
 *                      are now the reader's problem, which closes the doubling error exactly.
 *                      The **source line is still typed**, so the KP still stands in for a site
 *                      rather than coming out of one.
 *   SLICED-FROM-FILE   the KP is read out of a real file. The error class is unreachable rather
 *                      than guarded against, because there is nothing left to mistype.
 *
 * So TYPED-THEN-SLICED has a residual the error class it cures does not have: the typed source
 * line can stand in for **nothing** — no site in the corpus is spelled that way — and no leg in
 * the instrument can tell, because a KP that slices cleanly looks identical either way. That is
 * decidable, and `OCCURS` below decides it for every KP whose typed line is available verbatim.
 *
 * ## What this instrument's own KPs are
 *
 * `{path, line}` into the live corpus, sliced out with the census's own reader. Strictly stronger
 * than 408's cure, and deliberately so — it is the third stratum, used to make the point by
 * construction rather than by argument. Each one asserts the declared identifier is still **on**
 * the line it names before reading it, so a line drift REFUSES rather than silently grading a
 * neighbour (341/399). An unsliceable KP exits 2 (408 §4, adopted).
 *
 * ## What refuses, and which end it moves
 *
 * A multi-line declaration's initializer is not read past its first line, and a cooked (non-raw)
 * typed line's value is not reconstructed. Both land in `UNMODELLED`. Per 408 §1 — **a signal
 * that refuses can only move one end** — so the headline is a FLOOR on the class and the ceiling
 * costs a hand read I have not done. Stated as an interval, with the undecided rows listed by
 * name so the hand read is a bounded piece of work rather than a re-census.
 *
 * This file is in the population it censuses. The self row is MEASURED and printed, never
 * silently excluded (405 W8 / 407 §6), and the figures declare which population they are from —
 * 408 §5's correction of my 407, where `114 of 274` and a §6 sentence about my own membership
 * were true of two different populations and neither said so.
 *
 * Not a probe: no conclusion line, nothing to sweep. Every leg must come back true or no figure
 * prints below it (356).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');
const REV = git(['rev-parse', 'HEAD']).trim();

// ─── expectations, on paper before anything drives (383/386) ───────────────────────────────────
// Each names the move it predicts AND the expected member loss, so a leg that lands for the wrong
// reason is still visible, and so a counterfactual that loses the wrong member is caught (383).
const EXPECTED = [
  ['E1', 'the three strata are all NON-EMPTY on the live corpus. TYPED-LITERAL is the smaller of '
       + 'the first two, because 408 moved a batch of eight declarations out of it this morning '
       + 'and nothing has moved any in'],
  ['E2', 'SLICED-FROM-FILE is the SMALLEST of the three and this file is a member of it — if the '
       + 'third stratum is only ever me, the three-way split is a distinction without a '
       + 'population and the round found a naming convention rather than a hazard'],
  ['E3', 'at least one TYPED-THEN-SLICED KP STANDS FOR NOTHING — its typed source line occurs '
       + 'nowhere in the corpus. This is the residual the cure does not close, and if every '
       + 'typed line turns out to be faithful then the cure is empirically sound and the '
       + 'carry-forward is weaker than 408 §4 claims'],
  ['E4', 'Theseus\'s KP_NEWLINE (round408:415) is FAITHFUL — hand-verified before this ran, byte '
       + 'for byte against probe-round295-…mts:214, so a key that calls it STANDS-FOR-NOTHING has '
       + 'the hole rather than his declaration'],
  ['K1', 'every KP of MINE slices, and each one\'s declared identifier is still on the line it '
       + 'names — a drifted line refuses instead of grading its neighbour'],
  ['K2', 'the classifier returns a DIFFERENT stratum for each of my three KPs. One KP per stratum '
       + 'is coverage of one axis (382), so each miss is isolable to one stratum'],
  ['S1', 'the self row is present and MEASURED under both readings, and the printed figures say '
       + 'which population they came from (408 §5)'],
  ['T1', 'the rev read and the worktree state are printed, and a DIRTY tree is named as such — '
       + 'this caught Theseus twice and me once on the first edit after each commit'],
];

const GRADES = [];
const g = (leg, claim, ok, detail) => {
  GRADES.push({ leg, claim, ok: ok === true, detail });
  return ok === true;
};

// ─── string literal spans (the 407 reader, unchanged) ──────────────────────────────────────────
/** Every string-literal BODY in `src`, sliced out of the original. Returns bodies, never a
 *  sentinel (393). Template interpolations are code, so the walk tracks `${ }` depth. */
function literalBodies(src) {
  const blanked = stripSource(src, true);
  const out = [];
  let i = 0;
  while (i < blanked.length) {
    const c = blanked[i];
    if (c === "'" || c === '"') {
      const j = blanked.indexOf(c, i + 1);
      if (j === -1) break;
      out.push({ body: src.slice(i + 1, j), at: i + 1, quote: c });
      i = j + 1;
      continue;
    }
    if (c === '`') {
      let j = i + 1, interp = 0, tmpl = 0;
      for (; j < blanked.length; j++) {
        const d = blanked[j];
        if (d === '$' && blanked[j + 1] === '{') { interp++; j++; continue; }
        if (d === '}' && interp > 0) { interp--; continue; }
        if (d === '`') {
          if (interp === 0 && tmpl === 0) break;
          if (interp > 0) { tmpl += tmpl > 0 ? -1 : 1; continue; }
        }
        if (interp === 0 && (d === "'" || d === '"')) {
          const k = blanked.indexOf(d, j + 1);
          if (k !== -1) j = k;
        }
      }
      if (j >= blanked.length) break;
      out.push({ body: src.slice(i + 1, j), at: i + 1, quote: '`' });
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

// ─── the population ────────────────────────────────────────────────────────────────────────────
const EXEC = /\.(mjs|mts)$/;
const CORPUS = git(['ls-files', 'docs/research', 'scripts']).split('\n')
  .filter((f) => EXEC.test(f)).sort();

/** A known-positive-shaped binding name. `CONTROL` is in: a control is a known negative, and the
 *  hazard is identical — 408's two reds were a KP and its control. */
const KP_NAME = /^(KP|KNOWN_POSITIVE|KNOWN_NEGATIVE|CONTROL)[A-Za-z0-9_]*$/;

/** Does this file SLICE SOURCE — read source text and extract spans out of it? The hazard only
 *  bites a KP standing in for a slice, so a file that never slices cannot host the class. */
function slicesSource(src) {
  const code = stripSource(src, true);                 // strings blanked: a NAME, not a mention
  const reads = /readFileSync|git\(\[|execFileSync/.test(code);
  const spans = /literalBodies|stripSource|\.slice\(|\.exec\(|\.match\(|matchAll/.test(code);
  return reads && spans;
}

/**
 * Every KP-shaped declaration in `src`, with the first line of its initializer. Comment-blind:
 * read off the comments-blanked text (357), and NOT anchored at line start, because a same-line
 * `if (…) const` or an `export ` can precede the construct (the 329-331 class).
 */
function declarations(src) {
  const code = stripSource(src, false);                // comments blanked, strings KEPT
  const lines = code.split('\n');
  const srcLines = src.split('\n');
  const out = [];
  const re = /(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  for (let n = 0; n < lines.length; n++) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(lines[n])) !== null) {
      if (!KP_NAME.test(m[1])) continue;
      out.push({
        name: m[1],
        line: n + 1,                                   // 1-indexed, as a citation is
        init: srcLines[n].slice(m.index + m[0].length),
        initCode: lines[n].slice(m.index + m[0].length),
      });
    }
  }
  return out;
}

const READER_CALL = /^\s*([A-Za-z_$][A-Za-z0-9_$.]*)\s*\(\s*(String\.raw\s*)?[`'"]/;
const TYPED_START = /^\s*(String\.raw\s*)?[`'"]/;
const FROM_FILE = /readFileSync|git\(\[|atRev|fromFile|sliceAt|readAll|SRC\b|\bsrc\b/;

/**
 * Which of the three strata is this declaration in? Keyed on the comments-blanked initializer so
 * a `//` after it cannot decide the answer. Refuses with UNMODELLED rather than guessing —
 * a refusing signal moves ONE end (408 §1), and which end is stated at the figure.
 */
function stratum(d) {
  const init = d.initCode;
  if (READER_CALL.test(init)) return 'TYPED-THEN-SLICED';
  if (TYPED_START.test(init)) {
    // A typed literal that does not terminate on its own line is a multi-line initializer, and
    // this reader does not follow it. Undecided, not typed-and-done.
    const ls = literalBodies(d.init);
    return ls.length > 0 ? 'TYPED-LITERAL' : 'UNMODELLED';
  }
  if (FROM_FILE.test(init)) return 'SLICED-FROM-FILE';
  if (/^\s*$/.test(init)) return 'UNMODELLED';          // initializer begins on the NEXT line
  return 'OTHER-DERIVED';                               // a number, an array, a plain identifier
}

/**
 * The typed source line a KP stands in for, VERBATIM, or null if this key cannot have it.
 * `String.raw` gives the bytes directly. A cooked literal's value would have to be reconstructed
 * escape by escape — exactly the operation whose hand-done version 408 drive 6/7 got wrong in
 * both directions — so this refuses instead (and the row lands in UNMODELLED-OCCURS).
 */
function typedLine(d) {
  if (!/^\s*[A-Za-z_$][A-Za-z0-9_$.]*\s*\(\s*String\.raw\s*`/.test(d.initCode)
      && !/^\s*String\.raw\s*`/.test(d.initCode)) return null;
  const i = d.init.indexOf('`');
  const j = d.init.lastIndexOf('`');
  return j > i ? d.init.slice(i + 1, j) : null;
}

/** Does `line` occur, verbatim after trimming, as a line of some corpus file other than `self`? */
function occursInCorpus(line, self, sources) {
  const want = line.trim();
  if (want === '') return null;
  for (const [p, src] of sources) {
    if (p === self) continue;
    for (const l of src.split('\n')) if (l.trim() === want) return p;
  }
  return false;
}

const SOURCES = CORPUS.map((p) => [p, readFileSync(join(REPO, p), 'utf8')]);

// ─── my own known positives: {path, line} into the live corpus, sliced with the reader above ───
// The third stratum, used on purpose. Nothing here is typed except the citation itself, and the
// citation is checked: `declAt` refuses unless the named identifier is still declared on the named
// line, so a line drift REFUSES rather than grading a neighbour (341/399).
const KP_SITES = {
  TYPED: { path: 'scripts/probe-round372-the-rows-are-keyed-on-the-limb-and-the-contradiction-is-latent.mts',
           line: 354, ident: 'KP', want: 'TYPED-LITERAL' },
  CURED: { path: 'docs/research/round408-instruments/stratify-the-live-interval.mjs',
           line: 400, ident: 'KP_PLAIN', want: 'TYPED-THEN-SLICED' },
  FAITHFUL: { path: 'docs/research/round408-instruments/stratify-the-live-interval.mjs',
              line: 415, ident: 'KP_NEWLINE', want: 'TYPED-THEN-SLICED' },
};

function declAt(src, site) {
  const hits = declarations(src).filter((d) => d.line === site.line && d.name === site.ident);
  return hits.length === 1 ? { ...hits[0], path: site.path } : null;
}

const KP_TYPED = declAt(readFileSync(join(REPO, KP_SITES.TYPED.path), 'utf8'), KP_SITES.TYPED);
const KP_CURED = declAt(readFileSync(join(REPO, KP_SITES.CURED.path), 'utf8'), KP_SITES.CURED);
const KP_FAITHFUL =
  declAt(readFileSync(join(REPO, KP_SITES.FAITHFUL.path), 'utf8'), KP_SITES.FAITHFUL);

// A KP that failed to slice is a DELETED leg, not a passing one (393/395/408 §4). Refuse loudly
// here, before any leg reads a field off a null and scores `undefined` as a verdict.
const KP_TABLE = { KP_TYPED, KP_CURED, KP_FAITHFUL };
const UNSLICED = Object.entries(KP_TABLE).filter(([, v]) => v === null).map(([k]) => k);
if (UNSLICED.length > 0) {
  console.error(`KP DID NOT SLICE: ${UNSLICED.join(', ')} — the cited identifier is no longer `
    + `declared on the cited line. Re-cite before reading any figure below.`);
  process.exit(2);
}

// ─── the census ────────────────────────────────────────────────────────────────────────────────
const ROWS = [];
for (const [p, src] of SOURCES) {
  const slicer = slicesSource(src);
  for (const d of declarations(src)) {
    const s = stratum(d);
    const tl = typedLine(d);
    ROWS.push({
      path: p, name: d.name, line: d.line, stratum: s, slicer,
      inClass: slicer && (s === 'TYPED-LITERAL' || s === 'TYPED-THEN-SLICED'),
      typedLine: tl,
      occurs: tl === null ? 'UNMODELLED-OCCURS' : occursInCorpus(tl, p, SOURCES),
    });
  }
}

const WITH_SELF = ROWS;
const WITHOUT_SELF = ROWS.filter((r) => r.path !== SELF);
const SELF_ROWS = ROWS.filter((r) => r.path === SELF);
const SELF_TRACKED = git(['ls-files', '--', SELF]).trim() !== '';
const n = (pop, s) => pop.filter((r) => r.stratum === s).length;
const inClass = (pop) => pop.filter((r) => r.inClass);

// ─── legs ──────────────────────────────────────────────────────────────────────────────────────
// Every figure printed below is a measurement, not a constant: a hardcoded population size reddens
// on its own promotion the moment this file joins the corpus (377/405).
const P = WITHOUT_SELF;

g('E1', 'all three strata non-empty on the live corpus; TYPED-LITERAL <= TYPED-THEN-SLICED',
  n(P, 'TYPED-LITERAL') > 0 && n(P, 'TYPED-THEN-SLICED') > 0 && n(P, 'SLICED-FROM-FILE') > 0
  && n(P, 'TYPED-LITERAL') <= n(P, 'TYPED-THEN-SLICED'),
  `TYPED-LITERAL ${n(P, 'TYPED-LITERAL')} · TYPED-THEN-SLICED ${n(P, 'TYPED-THEN-SLICED')} · `
  + `SLICED-FROM-FILE ${n(P, 'SLICED-FROM-FILE')} · OTHER-DERIVED ${n(P, 'OTHER-DERIVED')} · `
  + `UNMODELLED ${n(P, 'UNMODELLED')} — population WITHOUT_SELF, ${P.length} declaration(s)`);

g('E2', 'SLICED-FROM-FILE is the smallest of the three AND has a member that is not this file',
  n(P, 'SLICED-FROM-FILE') > 0
  && n(P, 'SLICED-FROM-FILE') <= Math.min(n(P, 'TYPED-LITERAL'), n(P, 'TYPED-THEN-SLICED')),
  `SLICED-FROM-FILE ${n(P, 'SLICED-FROM-FILE')} outside this file; in this file `
  + `${n(SELF_ROWS, 'SLICED-FROM-FILE')} of ${SELF_ROWS.length} self row(s)`);

const standsForNothing = P.filter((r) => r.inClass && r.occurs === false);
const faithful = P.filter((r) => r.inClass && typeof r.occurs === 'string'
                                 && r.occurs !== 'UNMODELLED-OCCURS');
g('E3', 'at least one in-class KP STANDS FOR NOTHING — its typed source line occurs nowhere else',
  standsForNothing.length > 0,
  `stands-for-nothing ${standsForNothing.length} · faithful ${faithful.length} · `
  + `undecided ${inClass(P).filter((r) => r.occurs === 'UNMODELLED-OCCURS').length} — `
  + (standsForNothing.length > 0
      ? standsForNothing.slice(0, 4).map((r) => `${r.path.split('/').pop()}:${r.line} ${r.name}`)
        .join(' | ')
      : 'none'));

const kpFaithRow = P.find((r) => r.path === KP_SITES.FAITHFUL.path
                                 && r.line === KP_SITES.FAITHFUL.line);
g('E4', 'KP_NEWLINE (round408:415) reads FAITHFUL — hand-verified against probe-round295:214',
  kpFaithRow !== undefined && typeof kpFaithRow.occurs === 'string'
  && kpFaithRow.occurs !== 'UNMODELLED-OCCURS',
  kpFaithRow === undefined ? 'ROW ABSENT — the key did not see the declaration at all'
    : `occurs: ${kpFaithRow.occurs} · stratum ${kpFaithRow.stratum}`);

g('K1', 'every KP of mine sliced, and each declared identifier is still on the line it names',
  UNSLICED.length === 0 && KP_TYPED.name === KP_SITES.TYPED.ident
  && KP_CURED.name === KP_SITES.CURED.ident && KP_FAITHFUL.name === KP_SITES.FAITHFUL.ident,
  `${Object.keys(KP_TABLE).length} sliced, 0 refused`);

const kpStrata = Object.entries(KP_TABLE).map(([k, v]) => [k, stratum(v)]);
g('K2', 'the classifier returns each KP\'s predicted stratum, one axis per KP (382)',
  stratum(KP_TYPED) === KP_SITES.TYPED.want && stratum(KP_CURED) === KP_SITES.CURED.want
  && stratum(KP_FAITHFUL) === KP_SITES.FAITHFUL.want,
  kpStrata.map(([k, s]) => `${k}=${s}`).join(' · '));

g('S1', 'the self row is measured and present, and the figures declare their population',
  SELF_TRACKED
    ? SELF_ROWS.length > 0 && WITH_SELF.length - WITHOUT_SELF.length === SELF_ROWS.length
    : 'REFUSES — this file is untracked, so its corpus membership cannot be graded yet',
  SELF_TRACKED
    ? `self contributes ${SELF_ROWS.length} row(s): WITH_SELF ${WITH_SELF.length} vs `
      + `WITHOUT_SELF ${WITHOUT_SELF.length} · self strata `
      + [...new Set(SELF_ROWS.map((r) => r.stratum))].join('/')
    : `${SELF} is NOT in \`git ls-files\` at ${REV.slice(0, 8)} — drive one is red by construction`);

const dirty = git(['status', '--porcelain']).trim().split('\n').filter((l) => l !== '');
g('T1', 'the rev and the worktree state are printed, and a dirty tree is named as such',
  true,
  `rev ${REV.slice(0, 8)} · worktree ${dirty.length === 0 ? 'CLEAN' : `DIRTY (${dirty.length} path(s))`}`
  + ` · corpus ${CORPUS.length} file(s) · ${WITH_SELF.length} declaration(s) WITH_SELF`);

// ─── verdict, then the figures — never the other way round (356) ────────────────────────────────
console.log(`\nRound 409 — the hand-typed known positive, censused at ${REV.slice(0, 8)}\n`);
for (const [leg, why] of EXPECTED) console.log(`  EXPECTED ${leg}  ${why}`);
console.log('');
for (const { leg, claim, ok, detail } of GRADES) {
  console.log(`  ${String(ok).toUpperCase().padEnd(5)} ${leg.padEnd(3)} ${claim}`);
  console.log(`        ${detail}`);
}
const bad = GRADES.filter((x) => x.ok !== true);
console.log(`\nGRADE: ${bad.length === 0}`);
if (bad.length !== 0) {
  console.log(`NOT TRUE: ${bad.map((x) => x.leg).join(' | ')} — no figure is published below a `
    + `red leg (356).`);
  process.exit(1);
}

console.log(`\n── the routed class, as an INTERVAL (408 §1: a refusing signal moves one end) ──\n`);
const floor = inClass(P).length;
const undec = P.filter((r) => r.stratum === 'UNMODELLED' && r.slicer).length;
console.log(`  floor   ${floor}  in-class declarations the key DECIDES (population WITHOUT_SELF, `
  + `${P.length} declaration(s) in ${new Set(P.map((r) => r.path)).size} file(s))`);
console.log(`  ceiling ${floor + undec}  adding the ${undec} UNMODELLED row(s) in slicing files, `
  + `which are undecided rather than out`);
console.log(`\n  the cure's residual: ${standsForNothing.length} stands-for-nothing, `
  + `${faithful.length} faithful, `
  + `${inClass(P).filter((r) => r.occurs === 'UNMODELLED-OCCURS').length} undecided-occurrence\n`);
for (const r of inClass(P)) {
  console.log(`  ${r.stratum.padEnd(18)} ${String(r.occurs).padEnd(14).slice(0, 14)} `
    + `${r.path}:${r.line} ${r.name}`);
}
console.log(`\n  UNMODELLED in a slicing file — the hand read that would close the ceiling:`);
for (const r of P.filter((x) => x.stratum === 'UNMODELLED' && x.slicer)) {
  console.log(`  ${r.path}:${r.line} ${r.name}`);
}
