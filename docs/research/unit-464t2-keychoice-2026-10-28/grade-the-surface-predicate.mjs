#!/usr/bin/env node
// grade-the-surface-predicate.mjs — Unit 464-T2-keychoice, 2026-10-28, Daedalus
//
// SUBJECT
// -------
// Theseus's `unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs` measured that the
// stop condition's value is decided by a key nobody stated:
//
//   dir key           cure set 381,383,387,389,391,417,454,464  last 464  consecutive 0   NOT FIRED
//   self-attested key cure set 381,383,391,417,454              last 454  consecutive 10  FIRED
//
// That reproduces at this seat's HEAD (drive1 of this unit, `.err` empty) and his §8
// routed the CHOICE between the two keys to me, as the author of the condition.
//
// This cell does not pick one. It grades a free variable that sits UNDER both of them,
// and that is mine: the SURFACE predicate. The condition as I filed it reads
//
//   "The track continues while its rounds keep curing defects in surfaces that have a
//    standing gate (packages/, scripts/). It stops, and re-scopes, when N consecutive
//    rounds cure defects only in round-track instruments themselves."
//
// The clause after the comma names the stopping case as "round-track instruments
// themselves". The gate before it admits all of `scripts/` — which is where this
// track's instruments live (213 files at HEAD; `probe-round*`, `verify-*`,
// `sweep-probes`, `lib/`). The two halves of my own sentence do not obviously agree, and
// if they do not, then BOTH of Theseus's keys are computed over a surface set that
// over-credits, and the key dispute is not what decides the verdict.
//
// THE THREE READINGS, nested, each a strict subset of the one before
// -------------------------------------------------------------------
//   AS-FILED       a gated file is any `packages/**` or `scripts/**`
//   PRODUCT-ANY    a gated file is any `packages/**` (instruments under scripts/ excluded)
//   PRODUCT-SOURCE a gated file is any `packages/**` NOT under a `__tests__/` directory
//
// The third exists because 3 of the 4 `packages/` files touched in the window are
// `roundNNN-*.test.ts` — the round track's own instruments, living inside the product
// tree. Excluding `scripts/` alone does not exclude round-track instruments; it only
// excludes the ones that are easy to see.
//
// PRODUCT-SOURCE is NOT offered as the right reading. A round-track test that guards
// product behaviour is real work and `round11-klatch-creation.test.ts` is a product
// test, not a grader. The three readings are offered as a bracket, and D4 asks whether
// the condition's VERDICT is invariant across them. If it is, the surface predicate is
// a free variable that does not matter and the choice is Theseus's key alone. If it is
// not, the decision xian is being asked for has two axes, not one.
//
// WHAT THIS CELL DOES NOT CLAIM
// -----------------------------
//  * It does not claim PRODUCT-SOURCE is correct, or that the track should stop. D5
//    publishes the verdict under the strictest reading with the polarity Theseus gave
//    `T2` (a RED means "stop and re-scope"); the decision stays xian's.
//  * The classifier is a PROXY. Git sees paths, not units of work. D3 therefore
//    requires every file in the credit union to classify POSITIVELY and refuses on an
//    unclassified path rather than letting it fall through into a terminal bucket.
//  * D2 cross-checks this cell's independently written edge enumeration against
//    THESEUS'S OWN CELL, by running it as a child process and parsing its figures, as
//    member lists in both directions. A count-equal cross-check, or a re-read of my own
//    numbers, would be vacuous.
//
// CRIPPLES (argv[2]). D7 asserts each one DECLARED here occurs more than once in this
// file's own source, so a cripple no hook reads cannot leave every crippled arm clean.
// ---------------------------------------------------------------------------------
// Each map below was DERIVED BY HAND from the leg predicates before the first drive of
// this cell, not observed and then written down. Deriving them is what found the two
// defects noted at D6 and at the predictions.
//
//   PREDICTED CLEAN   red=[D4a,D5] refused=[] refuted=[]
//
//   surface-collapse        every gated file is product-source
//                           → red=[D5,D6] refuted=[Q2,Q3,Q4]. D4a goes GREEN: that is the
//                             separation — collapsing the surface restores the as-filed
//                             defect and invariance with it. D5 stays RED, which is itself
//                             part of the finding: under the self-attested key the
//                             condition fires at 454 regardless of the surface reading.
//   tests-as-product-source __tests__ counts as product source
//                           → red=[D4a,D5,D6]. Predicted NOT to separate on the finding
//                             legs, because the one commit carrying test files (e2759907)
//                             carries `packages/shared/src/types.ts` too, so the corpus
//                             confounds the test/source distinction. ONLY D6's known
//                             negative catches the collapse. Published as a negative.
//   xcheck-swap-member      one member swapped in MY dir cure set → red=[D2,D4a,D5]
//   classifier-refuses      classifier returns null for all
//                           → red=[D3] refused=[D2,D4a,D5,D6] prefused=[Q2,Q3,Q4]
//   kp-drop-product         types.ts classified as instrument
//                           → red=[D4a,D5,D6] refuted=[Q4]
//   no-edges                credit edge list emptied
//                           → red=[D1,D3] refused=[D2,D4a,D5] (D1 is the gate: a dead
//                             population must be a RED, never a refusal)

import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';

const CRIPPLE = process.argv[2] ?? null;
const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const SEP = '\u001f';
// ABSOLUTE cutoff. A bare `2026-10-13` is resolved by git against the ambient clock, so
// the window slides forward every hour and members fall off its tail — measured by
// Theseus on 10-27 and the reason his own `t1-no-clock` cripple was keyed on the hazard
// it exists to demonstrate.
const SINCE = '2026-10-13 00:00:00';
const N_PROPOSED = 5;

function git(args) {
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

// Kleene strong AND: null unless some conjunct is already false. A refusal conjoined
// away publishes a false RED.
function allOf(...xs) {
  if (xs.some((x) => x === false)) return false;
  if (xs.some((x) => x === null || x === undefined)) return null;
  return true;
}

const legs = [];
// Declared id list, not leg text. Theseus's `M0` reasoning: if the exclusion were keyed on
// the leg's own words, any leg could opt out of the verdict by editing its first six
// characters. `D8` guards this list in both directions — a declared MEAS that carries a
// value, and an undeclared leg that calls itself one.
const MEAS_IDS = ['D3m', 'D4', 'D4b'];
function measured(value, id, claim, detail) {
  const state = value === null || value === undefined ? 'REF' : value ? 'ok' : 'RED';
  legs.push({ id, claim, detail, value, state, meas: MEAS_IDS.includes(id) });
  console.log(`${state === 'ok' ? ' ok ' : state === 'RED' ? 'RED ' : 'REF '} ${id}: ${claim}`);
  console.log(`      detail: ${detail}`);
}
const preds = [];
function predict(id, claim, got, want) {
  const landed = got === null || got === undefined ? null : got === want ? true : false;
  preds.push({ id, claim, got, want, landed });
  console.log(
    `${landed === null ? 'PREF' : landed ? 'LAND' : 'REFU'} ${id}: ${claim}\n      got=${got} want=${want}`
  );
}

const REV = git(['rev-parse', 'HEAD']).trim();

// ---------------------------------------------------------------------------
// POPULATION — written independently of Theseus's cell so D2's cross-check is a
// comparison of two readers, not of a reader with its own copy.
// ---------------------------------------------------------------------------
const GATED_RE = /^(packages|scripts)\//;
const ROUND_DIR_RE = /^docs\/research\/round(\d+)-/;
const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;

let popError = null;
let commits = [];
try {
  const raw = git(['log', `--since=${SINCE}`, '--name-only', `--format=%x00%H${SEP}%an${SEP}%cI${SEP}%s`]);
  for (const rec of raw.split('\u0000')) {
    if (!rec.trim()) continue;
    const lines = rec.split('\n');
    const [hash, author, date, ...subj] = lines[0].split(SEP);
    if (!hash) continue;
    const files = lines.slice(1).filter((l) => l.trim().length > 0);
    const rounds = new Set();
    for (const f of files) {
      const m = ROUND_DIR_RE.exec(f);
      if (m) rounds.add(Number(m[1]));
    }
    const sm = SUBJECT_ROUND_RE.exec(subj.join(SEP));
    commits.push({
      hash,
      author,
      date,
      subject: subj.join(SEP),
      files,
      gatedFiles: files.filter((f) => GATED_RE.test(f)),
      dirRounds: [...rounds].sort((a, b) => a - b),
      subjectRound: sm ? Number(sm[1]) : null,
    });
  }
} catch (e) {
  popError = `git log failed: ${e.message}`;
  commits = [];
}

let roundDirs = [];
try {
  // readdirSync, not a grep over a listing: a grep drops a name it cannot print.
  roundDirs = readdirSync(`${REPO}/docs/research`)
    .map((d) => /^round(\d+)-instruments$/.exec(d))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
} catch (e) {
  roundDirs = [];
}

let edges = [];
for (const c of commits) if (c.gatedFiles.length) for (const r of c.dirRounds) edges.push({ round: r, commit: c });
if (CRIPPLE === 'no-edges') edges = [];

console.log('=== GRADE/464-T2-keychoice — the surface predicate under the stop condition ===');
console.log(`REV ${REV}`);
console.log(`WINDOW --since=${JSON.stringify(SINCE)}`);
console.log(`CRIPPLE ${CRIPPLE ?? 'none'}`);
console.log(`N_PROPOSED ${N_PROPOSED}`);
console.log(`CLOCK ${new Date().toISOString()}`);
console.log(`POPULATION commits=${commits.length} edges=${edges.length} roundDirs=${roundDirs.length}`);
if (popError) console.log(`POPULATION ERROR: ${popError}`);
console.log('');

// ---------------------------------------------------------------------------
// D1 — GATE LEG. A refusal here MUST be a RED: if the population did not load,
// every leg below reports about nothing, and an all-REF cell that exits without a
// RED has stopped reporting.
// ---------------------------------------------------------------------------
const d1 = popError === null && commits.length > 0 && roundDirs.length > 0 && edges.length > 0;
measured(
  d1,
  'D1',
  'GATE: the commit population, the round-directory list and the credit-edge list all loaded non-empty',
  `commits=${commits.length} roundDirs=${roundDirs.length} edges=${edges.length} popError=${popError ?? 'none'}`
);

// ---------------------------------------------------------------------------
// THE SURFACE CLASSIFIER. Three-way, BOTH ends positively keyed, and `null` for a
// path that matches no key — so a new kind of gated file refuses instead of landing
// in whichever bucket happens to be last.
// ---------------------------------------------------------------------------
const INSTRUMENT_BASENAME_RE =
  /^(probe-|verify-|round\d+-|sweep-probes|measure-|geometry-|exact-tests|compare-klatch-corpora|promote-probes)/;
const OPERATOR_BASENAMES = new Set([
  'demo-seed.sh', 'seed-demo.sh', 'aaxt-seed.sh', 'record-demo.ts', 'inspect-klatch-db.mjs',
  'backfill-entity-bindings.mts', 'gate.mts', 'serve-scratch.mjs', 'refresh-import-fixtures.mjs',
  'aaxt-mcp-live-probe.ts', 'package.json', 'tsconfig.json', 'tsconfig.lib-mjs.json',
]);

// → 'product-source' | 'product-test' | 'instrument' | 'operator' | null (refused)
function classify(path) {
  if (CRIPPLE === 'classifier-refuses') return null;
  if (CRIPPLE === 'surface-collapse') return 'product-source';
  if (CRIPPLE === 'kp-drop-product' && path === 'packages/shared/src/types.ts') return 'instrument';
  if (/^packages\//.test(path)) {
    const isTest = /(^|\/)__tests__\//.test(path);
    if (isTest) return CRIPPLE === 'tests-as-product-source' ? 'product-source' : 'product-test';
    return 'product-source';
  }
  if (/^scripts\//.test(path)) {
    if (/^scripts\/(lib|hooks)\//.test(path)) return 'instrument';
    const base = path.slice('scripts/'.length);
    if (base.includes('/')) return null; // an unmodelled nested directory under scripts/
    if (INSTRUMENT_BASENAME_RE.test(base)) return 'instrument';
    if (OPERATOR_BASENAMES.has(base)) return 'operator';
    return null;
  }
  return null;
}

const creditUnion = [...new Set(edges.flatMap((e) => e.commit.gatedFiles))].sort();
const classified = creditUnion.map((f) => ({ file: f, kind: classify(f) }));
const unclassified = classified.filter((c) => c.kind === null);

console.log('\nD3 the credit union, classified:');
for (const c of classified) console.log(`  ${(c.kind ?? 'UNCLASSIFIED').padEnd(14)} ${c.file}`);

// ---------------------------------------------------------------------------
// D3 — every file in the credit union classifies positively. A RED/REF here means
// the readings below are computed over a set the classifier does not understand.
// ---------------------------------------------------------------------------
measured(
  allOf(d1 === false ? false : true, classified.length > 0 ? true : null, unclassified.length === 0),
  'D3',
  'every gated file in the credit union classifies positively (no path falls through into a terminal bucket)',
  `union=${classified.length} unclassified=${unclassified.length}${unclassified.length ? ' :: ' + unclassified.map((c) => c.file).join(', ') : ''}`
);

const kindCount = {};
for (const c of classified) kindCount[c.kind ?? 'UNCLASSIFIED'] = (kindCount[c.kind ?? 'UNCLASSIFIED'] || 0) + 1;
measured(
  null,
  'D3m',
  '[MEAS] the credit union by kind, and the whole-window gated set by kind',
  `union=${JSON.stringify(kindCount)} windowGatedFiles=${[...new Set(commits.flatMap((c) => c.gatedFiles))].length}`
);

// ---------------------------------------------------------------------------
// THE TWO KEYS (Theseus's), re-implemented here only to the extent D4 needs a value
// under each. D2 cross-checks these against HIS cell rather than trusting them.
// ---------------------------------------------------------------------------
const creatorCache = new Map();
function dirCreator(round) {
  if (creatorCache.has(round)) return creatorCache.get(round);
  let res = null;
  try {
    const raw = git([
      'log', '--diff-filter=A', '--reverse', `--format=%H${SEP}%an`,
      '--', `docs/research/round${round}-instruments/`,
    ]);
    const first = raw.split('\n').find((l) => l.trim().length > 0);
    if (first) {
      const [hash, author] = first.split(SEP);
      if (hash && author) res = { hash, author };
    }
  } catch (e) {
    res = null;
  }
  creatorCache.set(round, res);
  return res;
}
// → true (genuine) | false (incidental) | null (refused)
function selfAttested(edge) {
  const creator = dirCreator(edge.round);
  if (creator === null) return null;
  return edge.commit.subjectRound === edge.round || creator.hash === edge.commit.hash;
}

const SURFACE_READINGS = [
  { id: 'AS-FILED', keep: (k) => k === 'product-source' || k === 'product-test' || k === 'instrument' || k === 'operator' },
  { id: 'PRODUCT-ANY', keep: (k) => k === 'product-source' || k === 'product-test' },
  { id: 'PRODUCT-SOURCE', keep: (k) => k === 'product-source' },
];
const KEYS = [
  { id: 'dir', admit: () => true },
  { id: 'self-attested', admit: selfAttested },
];

function consecutiveSince(last) {
  if (last === null) return null;
  if (roundDirs.length === 0) return null;
  return roundDirs.filter((r) => r > last).length;
}

// cell → { set, last, consecutive, fired } or null if any input refused
function cell(reading, key) {
  if (!d1) return null;
  const rounds = new Set();
  let refused = false;
  for (const e of edges) {
    const kinds = e.commit.gatedFiles.map(classify);
    if (kinds.some((k) => k === null)) { refused = true; continue; }
    if (!kinds.some((k) => reading.keep(k))) continue;
    const admit = key.admit(e);
    if (admit === null) { refused = true; continue; }
    if (admit) rounds.add(e.round);
  }
  if (refused) return null;
  const set = [...rounds].sort((a, b) => a - b);
  const last = set.length ? Math.max(...set) : null;
  const consecutive = consecutiveSince(last);
  if (last !== null && consecutive === null) return null;
  return { set, last, consecutive, fired: last === null ? true : consecutive >= N_PROPOSED };
}

const table = {};
console.log('\nD4 the 3 surface readings × 2 keys:');
for (const r of SURFACE_READINGS) {
  for (const k of KEYS) {
    const c = cell(r, k);
    table[`${r.id}|${k.id}`] = c;
    console.log(
      `  ${r.id.padEnd(15)} ${k.id.padEnd(14)} ` +
        (c === null
          ? 'UNMEASURED (an input refused)'
          : `set=[${c.set.join(',')}] last=${c.last ?? 'NONE'} consecutive=${c.consecutive ?? 'n/a'} fired=${c.fired}`)
    );
  }
}

const allCells = Object.values(table);
const firedVals = allCells.map((c) => (c === null ? null : c.fired));
measured(
  null,
  'D4',
  '[MEAS] the 3 × 2 table of (surface reading, credit key) → whether the condition has fired at N=5',
  Object.entries(table)
    .map(([k, c]) => `${k}=${c === null ? 'REF' : c.fired ? 'FIRED' : 'not'}`)
    .join(' '),
);

// ---------------------------------------------------------------------------
// D4a — is the VERDICT invariant across the surface reading, holding the key fixed?
// Asserts invariance, so the RED is the finding: it means the surface predicate is a
// second free variable and the decision has two axes, not one.
// ---------------------------------------------------------------------------
function surfaceInvariant(keyId) {
  const cs = SURFACE_READINGS.map((r) => table[`${r.id}|${keyId}`]);
  if (cs.some((c) => c === null)) return null;
  return new Set(cs.map((c) => c.fired)).size === 1;
}
measured(
  allOf(surfaceInvariant('dir'), surfaceInvariant('self-attested')),
  'D4a',
  'the fired/not verdict is INVARIANT across the three surface readings under each key — a RED means the surface predicate decides it too, so the choice has two axes',
  `dirKeyInvariant=${surfaceInvariant('dir')} selfAttestedInvariant=${surfaceInvariant('self-attested')}`
);

// ---------------------------------------------------------------------------
// D4b — is the VERDICT invariant across the KEY, holding the surface fixed? This is
// Theseus's C3 re-asked once per reading. A green under the strict readings means his
// key dispute does not reach the verdict there.
// ---------------------------------------------------------------------------
function keyInvariant(readingId) {
  const cs = KEYS.map((k) => table[`${readingId}|${k.id}`]);
  if (cs.some((c) => c === null)) return null;
  return new Set(cs.map((c) => c.fired)).size === 1;
}
measured(
  null,
  'D4b',
  '[MEAS] key-invariance per reading (Theseus C3, re-asked once per surface reading)',
  SURFACE_READINGS.map((r) => `${r.id}=${keyInvariant(r.id)}`).join(' ')
);

// ---------------------------------------------------------------------------
// D5 — THE HEADLINE, with Theseus's T2 polarity: asserts the condition has NOT fired
// under the strictest reading the condition's own sentence supports. A RED means the
// track has passed its own stop condition and should stop and re-scope.
// ---------------------------------------------------------------------------
const strict = table['PRODUCT-SOURCE|self-attested'];
measured(
  strict === null ? null : strict.fired === false,
  'D5',
  `the stop condition has NOT fired under PRODUCT-SOURCE × self-attested — a RED means the consecutive self-only run has reached N=${N_PROPOSED} and the track should stop and re-scope`,
  strict === null
    ? 'UNMEASURED'
    : `set=[${strict.set.join(',')}] last=${strict.last ?? 'NONE'} consecutive=${strict.consecutive} N=${N_PROPOSED} fired=${strict.fired}`
);

// ---------------------------------------------------------------------------
// D6 — KNOWN POSITIVES / NEGATIVE for the classifier, keyed on paths VERIFIED to
// exist in this rev's tree rather than hand-asserted. A classifier KP over a path
// that does not exist grades nothing.
// ---------------------------------------------------------------------------
const KP = [
  { path: 'packages/shared/src/types.ts', want: 'product-source' },
  { path: 'scripts/lib/strip-source.mjs', want: 'instrument' },
  { path: 'packages/server/src/__tests__/round11-klatch-creation.test.ts', want: 'product-test' },
  { path: 'scripts/sweep-probes.mjs', want: 'instrument' },
  { path: 'scripts/inspect-klatch-db.mjs', want: 'operator' },
];
let tracked = [];
try {
  tracked = git(['ls-tree', '-r', '--name-only', 'HEAD']).split('\n');
} catch (e) {
  tracked = [];
}
const trackedSet = new Set(tracked);
const kpRows = KP.map((k) => ({
  ...k,
  exists: trackedSet.has(k.path),
  got: classify(k.path),
}));
console.log('\nD6 classifier known positives (and the test/source known negative):');
for (const r of kpRows) {
  console.log(`  ${r.exists ? 'in-tree' : 'ABSENT '} want=${String(r.want).padEnd(14)} got=${String(r.got).padEnd(14)} ${r.path}`);
}
// A refused classification must NOT be conjoined into `got === want` being false: that
// publishes a RED where the honest answer is "unmeasurable". Derived by hand-deriving the
// `classifier-refuses` verdict map before driving it — the conjunct order made a refusal
// win as a defect.
const kpCorrect = kpRows.every((r) => r.got !== null) ? kpRows.every((r) => r.got === r.want) : null;
measured(
  allOf(
    trackedSet.size > 0 ? true : null,
    kpRows.every((r) => r.exists),
    kpCorrect
  ),
  'D6',
  'every classifier known positive is a path present in this rev tree AND classifies as stated — including that a packages/ __tests__ file is product-test, NOT product-source',
  `kps=${kpRows.length} inTree=${kpRows.filter((r) => r.exists).length} correct=${kpRows.filter((r) => r.got === r.want).length} tracked=${trackedSet.size}`
);

// ---------------------------------------------------------------------------
// D2 — CROSS-CHECK against Theseus's own cell, run as a child process. Compared as
// member LISTS in both directions: equal counts have hidden an overlap of 2 before,
// and a re-read of my own numbers would be vacuous.
// ---------------------------------------------------------------------------
const HIS = `${REPO}/docs/research/unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs`;
function hisSets() {
  if (!existsSync(HIS)) return null;
  let out;
  try {
    out = execFileSync('node', [HIS], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    // His cell exits 1 on its own RED; that is a verdict, not a failure to run.
    out = e.stdout ?? null;
  }
  if (!out) return null;
  const dirM = /^ ?MEAS C1:.*\n\s+detail: set=\[([0-9,]*)\]/m.exec(out);
  const selfM = /^ ?ok  C2:.*\n\s+detail: set=\[([0-9,]*)\]/m.exec(out);
  if (!dirM || !selfM) return null;
  const parse = (s) => (s.trim() === '' ? [] : s.split(',').map(Number));
  return { dir: parse(dirM[1]), self: parse(selfM[1]) };
}
const his = hisSets();
let mineDir = table['AS-FILED|dir'] ? [...table['AS-FILED|dir'].set] : null;
let mineSelf = table['AS-FILED|self-attested'] ? [...table['AS-FILED|self-attested'].set] : null;
if (CRIPPLE === 'xcheck-swap-member' && mineDir && mineDir.length) mineDir = [...mineDir.slice(0, -1), 999];

function sameMembers(a, b) {
  if (a === null || b === null) return null;
  if (a.length !== b.length) return false; // length first: a joined-string compare cannot see an empty member
  const A = new Set(a), B = new Set(b);
  return [...A].every((x) => B.has(x)) && [...B].every((x) => A.has(x));
}
const dirSame = sameMembers(mineDir, his ? his.dir : null);
const selfSame = sameMembers(mineSelf, his ? his.self : null);
console.log('\nD2 cross-check against his cell (run as a child process):');
console.log(`  his  dir=[${his ? his.dir.join(',') : 'UNREAD'}] self=[${his ? his.self.join(',') : 'UNREAD'}]`);
console.log(`  mine dir=[${mineDir ? mineDir.join(',') : 'UNREAD'}] self=[${mineSelf ? mineSelf.join(',') : 'UNREAD'}]`);
measured(
  allOf(his === null ? null : true, dirSame, selfSame),
  'D2',
  "this cell's independently written edge enumeration agrees with Theseus's cell on BOTH cure sets, compared as member lists in both directions",
  `hisRead=${his !== null} dirSame=${dirSame} selfSame=${selfSame} mineDir=[${mineDir ?? ''}] hisDir=[${his ? his.dir : ''}]`
);

// ---------------------------------------------------------------------------
// D7 — every cripple DECLARED in this file's docblock is actually read by a hook in
// it. A declared cripple no branch reads exits 0, and "the cripple did not redden" is
// the same output as "the repair is sound".
// ---------------------------------------------------------------------------
const DECLARED = [
  'surface-collapse', 'tests-as-product-source', 'xcheck-swap-member',
  'classifier-refuses', 'kp-drop-product', 'no-edges',
];
let ownSource = null;
try {
  ownSource = git(['show', `${REV}:docs/research/unit-464t2-keychoice-2026-10-28/grade-the-surface-predicate.mjs`]);
} catch (e) {
  // Not yet committed at this rev — fall back to the working file, and say so in detail.
  try {
    ownSource = execFileSync('cat', [new URL(import.meta.url).pathname], { encoding: 'utf8' });
  } catch (e2) {
    ownSource = null;
  }
}
const occ = DECLARED.map((name) => ({
  name,
  n: ownSource === null ? null : ownSource.split(name).length - 1,
}));
measured(
  allOf(ownSource === null ? null : true, occ.every((o) => o.n !== null && o.n > 1)),
  'D7',
  'every cripple declared in this file occurs more than once in its own source (declaration plus at least one hook)',
  occ.map((o) => `${o.name}=${o.n}`).join(' ')
);

// ---------------------------------------------------------------------------
// D8 — guards the MEAS exclusion itself, in BOTH directions. Found by writing this
// cell: `D4b` printed `[MEAS]` in its claim and was NOT in `MEAS_IDS`, so its `null`
// would have been published as a refusal in the verdict line — a measurement reported
// as a failure to measure. Keyed on the declared list vs the leg text, so either half
// drifting reddens.
// ---------------------------------------------------------------------------
const declaredMeas = legs.filter((l) => MEAS_IDS.includes(l.id));
const saysMeas = legs.filter((l) => l.claim.includes('[MEAS]'));
const measCarryingValue = declaredMeas.filter((l) => l.value !== null && l.value !== undefined);
const undeclaredSaysMeas = saysMeas.filter((l) => !MEAS_IDS.includes(l.id));
const declaredNotSaying = declaredMeas.filter((l) => !l.claim.includes('[MEAS]'));
measured(
  allOf(
    declaredMeas.length > 0 ? true : null,
    measCarryingValue.length === 0,
    undeclaredSaysMeas.length === 0,
    declaredNotSaying.length === 0
  ),
  'D8',
  'every declared [MEAS] leg carries no value and says so, and no undeclared leg calls itself a [MEAS]',
  `declared=${declaredMeas.length} carryingValue=[${measCarryingValue.map((l) => l.id).join(',')}] undeclaredSaysMeas=[${undeclaredSaysMeas.map((l) => l.id).join(',')}] declaredNotSaying=[${declaredNotSaying.map((l) => l.id).join(',')}]`
);

// ---------------------------------------------------------------------------
// PREDICTIONS — written before this cell's first drive.
// ---------------------------------------------------------------------------
console.log('');
const pkgEdges = edges.filter((e) => e.commit.gatedFiles.some((f) => /^packages\//.test(f)));
predict(
  'Q1',
  'exactly ONE of the credit edges carries a packages/ file at all, and its round is 417',
  `${pkgEdges.length}|${[...new Set(pkgEdges.map((e) => e.round))].join(',')}`,
  '1|417'
);
// A prediction whose input is UNMEASURABLE must be PREFUSED, not REFUTED. `String(null)`
// is the truthy-looking string `"null"`, which compares unequal to `"true"` and would
// publish a refutation where nothing was measured.
predict(
  'Q2',
  'under PRODUCT-SOURCE the two keys AGREE (417 is admitted by clause (b), so the key does not reach the verdict there)',
  keyInvariant('PRODUCT-SOURCE') === null ? null : String(keyInvariant('PRODUCT-SOURCE')),
  'true'
);
predict(
  'Q3',
  'AS-FILED is the ONLY one of the three readings under which the condition has not fired, under the dir key',
  SURFACE_READINGS.some((r) => table[`${r.id}|dir`] === null)
    ? null
    : SURFACE_READINGS.map((r) => `${r.id}:${table[`${r.id}|dir`].fired ? 'FIRED' : 'not'}`).join(' '),
  'AS-FILED:not PRODUCT-ANY:FIRED PRODUCT-SOURCE:FIRED'
);
predict(
  'Q4',
  'the consecutive run under PRODUCT-SOURCE × dir is at least 11 (round dirs above 417)',
  table['PRODUCT-SOURCE|dir'] === null || table['PRODUCT-SOURCE|dir'].consecutive === null
    ? null
    : String(table['PRODUCT-SOURCE|dir'].consecutive >= 11),
  'true'
);

// ---------------------------------------------------------------------------
// VERDICT
// ---------------------------------------------------------------------------
const graded = legs.filter((l) => !l.meas);
const red = graded.filter((l) => l.state === 'RED').map((l) => l.id);
const ref = graded.filter((l) => l.state === 'REF').map((l) => l.id);
const refuted = preds.filter((p) => p.landed === false).map((p) => p.id);
const prefused = preds.filter((p) => p.landed === null).map((p) => p.id);
console.log(
  `\nVERDICT/${red.length || ref.length ? 1 : 0} ${red.length || ref.length ? 'RED' : 'ok'} legs=${graded.length} red=[${red.join(',')}] refused=[${ref.join(',')}] preds=${preds.length} refuted=[${refuted.join(',')}] prefused=[${prefused.join(',')}]`
);
process.exit(red.length || ref.length ? 1 : 0);
