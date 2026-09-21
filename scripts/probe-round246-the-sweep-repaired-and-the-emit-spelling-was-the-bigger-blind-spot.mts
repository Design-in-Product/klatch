/**
 * Round 246 — the Round 240 staleness sweep, repaired; and the defect the repair found.
 *
 * ## Why this file exists
 *
 * Round 244 (mine) found that Round 240's sweep enumerates `scripts/` with a **one-level**
 * `readdirSync`, so the 13 shared modules in `scripts/lib/` had never been in a staleness sweep
 * at all. I filed the repair as designed-but-not-taken, because Round 240's probe is an artifact
 * whose published figures are cited in `docs/research/round240-…` and editing what it measures
 * trips my own Round 238 rule. Round 245 §6 (Daedalus) declined the routing and handed it back:
 * it is a probe-side instrument in my seat.
 *
 * So this is the repair, as a **superseding instrument** rather than an edit. Round 240's probe
 * stays exactly as filed, arm I red, and `docs/research/round240-…` keeps reproducing.
 *
 * ## The three things the old sweep could not see
 *
 * 1. **Depth.** `scripts/lib/` is a directory; it fails an extension filter and is never
 *    descended into. 13 modules below the horizon.
 * 2. **The emit spelling.** `SUBJECT_RE` matches a `.ts` or `.tsx` under `packages/` and
 *    nothing else. (Written here in prose rather than as a glob on purpose: the glob spelling
 *    contains the two characters that close a block comment, and esbuild refused this file the
 *    first time it was driven — the same defect that cost me a run in Round 242.) But a probe that
 *    `import`s the product writes the **TypeScript ESM emit spelling** — `queries.js`, not
 *    `queries.ts` — so the extractor sees nothing. This turned out to be the larger blind spot
 *    and it was never below any horizon: it is **21 files the sweep walked, opened, and read
 *    as having no product subject at all**, and they are the ones with the *strongest* coupling
 *    to the product, because they do not merely name it in prose — they execute it.
 * 3. **Transitivity.** Once corpus access moved into `scripts/lib/probe-corpus-sessions.mts`
 *    (Daedalus's Round 241 `2920d6bc`), `probe-import-entity-binding.mts` stopped naming
 *    `~/.claude/projects` in code. A classifier that reads one file cannot see a property the
 *    file acquires through an import.
 *
 * > **Rule, sixth iteration of the denominator rule — and the first one that is not about the
 * > walk.** Depth decides WHICH FILES you enumerate. The extractor decides WHICH SUBJECTS you
 * > find inside them. A sweep can have a complete file list and still be blind to the coupling
 * > it exists to measure, and that failure prints as *"this probe names no product path"* —
 * > indistinguishable from a shell helper that really doesn't.
 *
 * ## What it deliberately does NOT claim
 *
 * Unchanged from Round 240: staleness is a MEASUREMENT, not a grade. A stale probe is not a
 * broken probe; it is a probe nobody has re-checked. Driving remains manual and un-automated.
 *
 * ## Where the hard checks get their subjects
 *
 * Every hard arm here mints its own fixtures in a temp directory. Round 244 §3 is why: arm I of
 * Round 240 anchored its positive fixture on a hardcoded claim about another probe's contents,
 * which made it **a control scheduled to break on success** — and it duly broke, in the same
 * colour it would have used for a regression, the moment the finding it asked for was repaired.
 * Claims about the live tree are measurements (arms B, D, E, G, I, J). Claims about the
 * instrument are minted (arms A, C, F, H).
 *
 * Usage:  npx tsx scripts/probe-round246-*.mts [--verbose]
 * Writes only into a temp dir it creates and removes. Reads git and the working tree.
 * Spawns no server. Zero model calls.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const VERBOSE = process.argv.includes('--verbose');
const SELF = path.basename(fileURLToPath(import.meta.url));

const results: ProbeVerdict[] = [];

function check(arm: string, what: string, pass: boolean, detail: string) {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'PASS' : 'FAIL'}  ${what}\n        ${detail}`);
}
function meas(arm: string, what: string, detail: string) {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}\n        ${detail}`);
}

const git = (args: string[]) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ─────────────────────────────────────────────────────────────────────────────
// 1. The scanner — comments AND strings, one pass
// ─────────────────────────────────────────────────────────────────────────────
//
// Round 240's stripper documents its own limitation: "deliberately naive about strings
// containing `//` — a URL in a string would lose its tail." That is real (54 lines in
// `scripts/` carry a quoted `://`), and arm G measures what it actually costs, rather than
// asserting either that it is harmless or that it is a cause.
//
// Tracking string state in the same pass also gives the import extractor something a regex
// cannot have: a specifier written INSIDE another string literal — a probe minting a fixture
// module — is consumed by the outer string and never offered as an edge. That is the property
// arm H's negative half drives.

type Scan = {
  /** Source with comments removed and string CONTENTS preserved. */
  code: string;
  /** Every module specifier in import/require position, in source order. */
  specifiers: string[];
};

function scan(src: string): Scan {
  let code = '';
  const specifiers: string[] = [];
  let i = 0;
  let inBlock = false;
  let inLine = false;

  const tailIsImportPosition = () => {
    // The last non-space run of emitted code decides whether the string about to be read is a
    // module specifier. `from`, a bare `import`, `import(`, `require(` — and nothing else.
    const t = code.replace(/\s+$/, '');
    return /\bfrom$/.test(t) || /\bimport$/.test(t) || /\bimport\($/.test(t) || /\brequire\($/.test(t);
  };

  while (i < src.length) {
    const c = src[i];
    const two = src.slice(i, i + 2);

    if (!inBlock && !inLine && two === '/*') { inBlock = true; i += 2; continue; }
    if (inBlock && two === '*/') { inBlock = false; i += 2; continue; }
    if (!inBlock && !inLine && two === '//') { inLine = true; i += 2; continue; }
    if (inLine && c === '\n') { inLine = false; code += '\n'; i += 1; continue; }
    if (inBlock || inLine) { i += 1; continue; }

    if (c === "'" || c === '"' || c === '`') {
      const importPos = tailIsImportPosition();
      const quote = c;
      let body = '';
      i += 1;
      while (i < src.length) {
        if (src[i] === '\\') { body += src[i] + (src[i + 1] ?? ''); i += 2; continue; }
        if (src[i] === quote) { i += 1; break; }
        body += src[i];
        i += 1;
      }
      if (importPos) specifiers.push(body);
      code += quote + body + quote;
      continue;
    }

    code += c;
    i += 1;
  }
  return { code, specifiers };
}

/** Round 240's stripper, verbatim, kept so arm G can price the difference at today's HEAD. */
function stripCommentsNaive(src: string): string {
  let out = '';
  let i = 0;
  let inBlock = false;
  let inLine = false;
  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (!inBlock && !inLine && two === '/*') { inBlock = true; i += 2; continue; }
    if (inBlock && two === '*/') { inBlock = false; i += 2; continue; }
    if (!inBlock && !inLine && two === '//') { inLine = true; i += 2; continue; }
    if (inLine && src[i] === '\n') { inLine = false; out += '\n'; i += 1; continue; }
    if (!inBlock && !inLine) out += src[i];
    i += 1;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. The walker
// ─────────────────────────────────────────────────────────────────────────────

const CODE_EXT = /\.(?:mts|mjs|ts)$/;

/** Repo-relative paths of every code file under `dir`, at any depth, with the depth reached. */
function walkCode(dir: string, base = dir, depth = 0): Array<{ rel: string; depth: number }> {
  const out: Array<{ rel: string; depth: number }> = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith('.')) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkCode(abs, base, depth + 1));
    else if (CODE_EXT.test(e.name)) out.push({ rel: path.relative(base, abs), depth });
  }
  return out;
}

/** What Round 240 did: one level, extension-filtered. Kept to price the horizon at today's HEAD. */
function oneLevelCode(dir: string): string[] {
  return fs.readdirSync(dir).filter((f) => CODE_EXT.test(f) && !f.startsWith('.')).sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Specifier resolution — the emit spelling is the point
// ─────────────────────────────────────────────────────────────────────────────
//
// `import { x } from '../packages/server/src/db/queries.js'` names `queries.ts`. TypeScript's
// ESM output convention requires the `.js`; the file on disk is `.ts` and always has been. A
// subject extractor that only matches `.ts` reads that import as naming nothing.

const EMIT_TO_SOURCE: Array<[RegExp, string]> = [
  [/\.js$/, '.ts'],
  [/\.jsx$/, '.tsx'],
  [/\.mjs$/, '.mts'],
  [/\.cjs$/, '.cts'],
];

/** Repo-relative path of the real file a specifier names, or null if nothing is there. */
function resolveSpecifier(fromRel: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  const abs = path.resolve(REPO, path.dirname(fromRel), spec);
  const candidates = [abs];
  for (const [re, ext] of EMIT_TO_SOURCE) if (re.test(abs)) candidates.push(abs.replace(re, ext));
  // A bare specifier with no extension (`./inner`) — try the extensions this repo uses.
  if (!path.extname(abs)) for (const e of ['.mts', '.mjs', '.ts', '.tsx', '.js']) candidates.push(abs + e);
  for (const c of candidates) {
    try { if (fs.statSync(c).isFile()) return path.relative(REPO, c); } catch { /* not there */ }
  }
  return null;
}

const SUBJECT_RE = /packages\/[a-z]+\/src\/[A-Za-z0-9_./-]*\.(?:tsx|ts)/g;
const CORPUS_CTX_RE = /\.claude['"\s,)/\\]|['"`]-Users-[A-Za-z0-9-]+['"`]|claude['"],\s*['"]projects/;

// ─────────────────────────────────────────────────────────────────────────────
// ARM A — the walker, two-sided, on nesting this arm mints itself
// ─────────────────────────────────────────────────────────────────────────────
//
// `scripts/` is flat-plus-one today (arm B measures it). So an arm that asserted "the walk
// reaches depth 2" against the real tree would be red on a correct walker, and an arm that
// asserted "it reaches depth 1" would go green against a walker that happened to stop at 1.
// Neither states the property. The nesting has to be minted.

console.log(`\nRound 246 — the staleness sweep, repaired`);
console.log(`repo: ${REPO}`);
console.log(`HEAD: ${git(['rev-parse', '--short', 'HEAD']).trim()}  ${git(['log', '-1', '--format=%ci']).trim()}`);

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'r246-'));
let armAPass = false;
let armADetail = '';
try {
  fs.writeFileSync(path.join(TMP, 'top.mts'), '// depth 0\n');
  fs.mkdirSync(path.join(TMP, 'lib'));
  fs.writeFileSync(path.join(TMP, 'lib', 'mid.mts'), '// depth 1\n');
  fs.mkdirSync(path.join(TMP, 'lib', 'deep'));
  fs.writeFileSync(path.join(TMP, 'lib', 'deep', 'bottom.mjs'), '// depth 2\n');
  // A non-code file at depth 2: the walker must not count it.
  fs.writeFileSync(path.join(TMP, 'lib', 'deep', 'notes.md'), 'not code\n');

  const walked = walkCode(TMP);
  const flat = oneLevelCode(TMP);
  const rels = walked.map((w) => w.rel).sort();
  const maxDepth = Math.max(...walked.map((w) => w.depth));

  const positive =
    rels.length === 3 &&
    rels.includes('top.mts') &&
    rels.includes(path.join('lib', 'mid.mts')) &&
    rels.includes(path.join('lib', 'deep', 'bottom.mjs')) &&
    maxDepth === 2;
  // The negative half is the whole point: the OLD enumeration must miss both nested files, or
  // the arm is green against a walker that never needed repairing.
  const negative = flat.length === 1 && flat[0] === 'top.mts';

  armAPass = positive && negative;
  armADetail =
    `recursive walk: ${rels.length} file(s) ${JSON.stringify(rels)}, max depth ${maxDepth} ` +
    `(want 3 and 2, and notes.md NOT among them); ` +
    `Round 240's one-level enumeration over the same tree: ${flat.length} ${JSON.stringify(flat)} ` +
    `(want exactly ['top.mts'] — it must MISS the two nested files).`;
} catch (err) {
  armADetail = `minting failed: ${String(err)}`;
}
console.log('\n── Instrument controls (minted subjects) ────────────────────────\n');
check('A', 'walker reaches arbitrary depth and the old one-level read does not (minted nesting, two-sided)',
  armAPass, armADetail);

// ─────────────────────────────────────────────────────────────────────────────
// ARM C — the subject extractor, including the emit spelling
// ─────────────────────────────────────────────────────────────────────────────

let armCPass = false;
let armCDetail = '';
{
  // Minted in the real repo tree so `resolveSpecifier`'s existence check has something true to
  // find — but the fixture file itself is written to TMP and never lands in `scripts/`.
  const fixture = path.join(TMP, 'subject-fixture.mts');
  fs.writeFileSync(fixture, [
    // positive: emit spelling of files that really exist
    "import { getDb } from '../../Development/klatch-worktrees/theseus/packages/server/src/db/index.js';",
    "const literal = 'packages/client/src/components/ChannelSidebar.tsx';",
    // negative: a .js with no .ts behind it, and a dependency path
    "const a = 'node_modules/.pnpm/packages/server/src/x.d.ts';",
    "const b = 'packages/server/src/import/session-scanner.ts.bak';",
  ].join('\n'));

  // Resolution is exercised against the real repo, on the real spelling probes use.
  const realEmit = resolveSpecifier('scripts/x.mts', '../packages/server/src/db/queries.js');
  const realSource = resolveSpecifier('scripts/x.mts', '../packages/server/src/db/queries.ts');
  const deadEmit = resolveSpecifier('scripts/x.mts', '../packages/server/src/db/no-such-module.js');
  const libMjs = resolveSpecifier('scripts/x.mts', './lib/tsx-required.mjs');
  const libMts = resolveSpecifier('scripts/x.mts', './lib/probe-corpus-sessions.mts');

  const regexOnly = [...new Set(("const q = '../packages/server/src/db/queries.js';").match(SUBJECT_RE) ?? [])];

  const positive =
    realEmit === 'packages/server/src/db/queries.ts' &&
    realSource === 'packages/server/src/db/queries.ts' &&
    libMjs === 'scripts/lib/tsx-required.mjs' &&
    libMts === 'scripts/lib/probe-corpus-sessions.mts';
  const negative = deadEmit === null && regexOnly.length === 0;

  armCPass = positive && negative;
  armCDetail =
    `emit spelling '…/db/queries.js' → ${JSON.stringify(realEmit)} (want the .ts); ` +
    `source spelling → ${JSON.stringify(realSource)} (same target, both spellings); ` +
    `'./lib/tsx-required.mjs' → ${JSON.stringify(libMjs)} (a real .mjs, NOT rewritten to .mts); ` +
    `'./lib/probe-corpus-sessions.mts' → ${JSON.stringify(libMts)}. ` +
    `NEGATIVE: a .js with no source behind it → ${JSON.stringify(deadEmit)} (want null — resolution ` +
    `is by existence, so it cannot invent a subject); and Round 240's regex over the same emit ` +
    `import finds ${JSON.stringify(regexOnly)} (want [] — this is the blind spot, stated as a control).`;
}
check('C', 'subject extractor resolves the TS emit spelling to its real source and invents nothing',
  armCPass, armCDetail);

// ─────────────────────────────────────────────────────────────────────────────
// ARM F — the string-aware scanner
// ─────────────────────────────────────────────────────────────────────────────

let armFPass = false;
let armFDetail = '';
{
  // Sentinels concatenated at runtime so the only whole occurrence of each is the one intended.
  const CODE_S = 'R246' + '-CODE';
  const LINE_S = 'R246' + '-LINE';
  const BLOCK_S = 'R246' + '-BLOCK';
  const URL_TAIL = 'R246' + '-AFTER-URL';
  const minted = [
    `const kept = 'R246-CODE';`,
    `// R246-LINE`,
    `/* R246-BLOCK */`,
    `const uri = 'klatch://channels'; const alsoKept = 'R246-AFTER-URL';`,
  ].join('\n');

  const { code } = scan(minted);
  const naive = stripCommentsNaive(minted);

  const positive = code.includes(CODE_S) && code.includes(URL_TAIL);
  const negative = !code.includes(LINE_S) && !code.includes(BLOCK_S);
  // The discriminator: the naive stripper must LOSE the post-URL tail, or this arm is green
  // against a scanner that is no better than the one it replaces.
  const discriminates = !naive.includes(URL_TAIL) && naive.includes(CODE_S);

  armFPass = positive && negative && discriminates;
  armFDetail =
    `string-aware: code sentinel kept ${code.includes(CODE_S)}, post-URL tail kept ${code.includes(URL_TAIL)} ` +
    `(want true, true); line comment removed ${!code.includes(LINE_S)}, block comment removed ` +
    `${!code.includes(BLOCK_S)} (want true, true). ` +
    `DISCRIMINATOR — Round 240's naive stripper on the same input: post-URL tail kept ` +
    `${naive.includes(URL_TAIL)} (want FALSE — it reads '//' inside 'klatch://' as a comment and ` +
    `discards the rest of the line), code sentinel kept ${naive.includes(CODE_S)} (want true, so the ` +
    `difference is the URL and not a broken stripper).`;
}
check('F', 'scanner keeps a quoted URL\'s line tail; the old stripper demonstrably does not (minted, two-sided)',
  armFPass, armFDetail);

// ─────────────────────────────────────────────────────────────────────────────
// ARM H — transitive classification over the import graph
// ─────────────────────────────────────────────────────────────────────────────

/** Files reachable from `startRel` through resolved relative imports that stay under `scripts/`. */
function reachableScripts(startRel: string, edges: Map<string, string[]>): Set<string> {
  const seen = new Set<string>();
  const queue = [startRel];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of edges.get(cur) ?? []) {
      if (seen.has(next)) continue;      // also the cycle guard
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

let armHPass = false;
let armHDetail = '';
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'r246-graph-'));
  fs.mkdirSync(path.join(root, 'lib'));
  // A 3-hop chain: only the far end touches the corpus. One hop would pass against a
  // one-hop classifier, which is the thing being repaired.
  fs.writeFileSync(path.join(root, 'reaches.mts'), `import { a } from './lib/hop1.mts';\n`);
  fs.writeFileSync(path.join(root, 'lib', 'hop1.mts'), `import { b } from './hop2.mts';\nexport const a = b;\n`);
  fs.writeFileSync(path.join(root, 'lib', 'hop2.mts'), `import path from 'node:path';\nexport const b = path.join('.claude', 'projects');\n`);
  // Negative: same shape, same depth, no corpus at the end.
  fs.writeFileSync(path.join(root, 'clean.mts'), `import { c } from './lib/hop3.mts';\n`);
  fs.writeFileSync(path.join(root, 'lib', 'hop3.mts'), `export const c = 1;\n`);
  // Negative: a probe that MINTS a module as a string. The relative specifier inside the
  // template literal must not become an EDGE — the outer string consumes it, so the scanner
  // never offers it in import position. Note carefully what this half does and does not claim:
  // see the comment on `mintsReadsCorpus` below.
  fs.writeFileSync(path.join(root, 'mints.mts'), [
    'const fixture = `',
    "import { b } from './lib/hop2.mts';",
    "fs.readdirSync('.claude/projects');",
    '`;',
    'export default fixture;',
  ].join('\n'));
  // A cycle: the walker must terminate.
  fs.writeFileSync(path.join(root, 'cyc-a.mts'), `import './cyc-b.mts';\n`);
  fs.writeFileSync(path.join(root, 'cyc-b.mts'), `import './cyc-a.mts';\n`);

  const files = walkCode(root).map((w) => w.rel);
  const scans = new Map<string, Scan>();
  const edges = new Map<string, string[]>();
  for (const rel of files) {
    const s = scan(fs.readFileSync(path.join(root, rel), 'utf8'));
    scans.set(rel, s);
    const out: string[] = [];
    for (const spec of s.specifiers) {
      if (!spec.startsWith('.')) continue;
      const abs = path.resolve(root, path.dirname(rel), spec);
      try { if (fs.statSync(abs).isFile()) out.push(path.relative(root, abs)); } catch { /* absent */ }
    }
    edges.set(rel, out);
  }
  const readsCorpus = (rel: string) => CORPUS_CTX_RE.test(scans.get(rel)?.code ?? '');
  const transitive = (rel: string) =>
    readsCorpus(rel) || [...reachableScripts(rel, edges)].some(readsCorpus);

  let cycleTerminated = false;
  try { reachableScripts('cyc-a.mts', edges); cycleTerminated = true; } catch { /* stack */ }

  const positive = transitive('reaches.mts') === true && readsCorpus('reaches.mts') === false;
  const mintedEdges = edges.get('mints.mts') ?? [];
  const negative = transitive('clean.mts') === false && mintedEdges.length === 0;

  // The first version of this arm also asserted `transitive('mints.mts') === false`, and it
  // went red — correctly. The scanner preserves string CONTENTS on purpose, because a path in
  // a string literal is precisely how a probe names the corpus (`fs.readdirSync('.claude/…')`);
  // Round 240 preserved them for the same reason. So a file that mints corpus-reading SOURCE
  // reads as a corpus reader, and no mechanical test separates "a path I use" from "a path in
  // code I am writing to disk."
  //
  // > **Rule: a negative fixture asserts a property of the instrument, so it must be a property
  // > the instrument actually has. Writing the fixture you WISH would pass produces a red arm
  // > that indicts working code** — and if you then "fix" the instrument to satisfy it, you have
  // > broken it to match a wish. Fourth time in this seat that a control claimed more than the
  // > thing it controls.
  //
  // The edge half IS mechanical and is kept: the outer template literal consumes the inner
  // specifier, so it is never offered in import position. The classification over-inclusion is
  // measured in arm I's detail instead of asserted away.
  const mintsReadsCorpus = transitive('mints.mts');

  armHPass = positive && negative && cycleTerminated;
  armHDetail =
    `3-hop chain: transitive says corpus reader ${transitive('reaches.mts')} (want true) while the ` +
    `direct-only classifier says ${readsCorpus('reaches.mts')} (want FALSE — this is the exact shape ` +
    `that reddened Round 240's arm I when Daedalus's 2920d6bc moved corpus access into a lib); ` +
    `same-depth chain with no corpus at the end: ${transitive('clean.mts')} (want false); ` +
    `a relative specifier inside a template literal yields ${mintedEdges.length} edge(s) ` +
    `(want 0 — the outer string consumes it); import cycle terminated: ${cycleTerminated} (want true). ` +
    `NOT ASSERTED, stated instead: that same minted file classifies as a corpus reader ` +
    `(${mintsReadsCorpus}) because string contents are deliberately preserved — see the comment above.`;
  fs.rmSync(root, { recursive: true, force: true });
}
check('H', 'corpus-reader classification follows imports transitively; minted source yields no edge (minted, two-sided)',
  armHPass, armHDetail);

fs.rmSync(TMP, { recursive: true, force: true });

// ─────────────────────────────────────────────────────────────────────────────
// The real tree
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── The live scripts/ tree ───────────────────────────────────────\n');

const SCRIPTS = path.join(REPO, 'scripts');
const walked = walkCode(SCRIPTS).filter((w) => path.basename(w.rel) !== SELF);
const flatNames = oneLevelCode(SCRIPTS).filter((f) => f !== SELF);
const maxDepth = Math.max(...walked.map((w) => w.depth));
const belowHorizon = walked.filter((w) => w.depth > 0);

meas('B', 'enumeration, with its own depth stated rather than assumed',
  `recursive ${walked.length} · one-level ${flatNames.length} · below the old horizon ` +
    `${belowHorizon.length} · max depth reached ${maxDepth}. ` +
    `The real tree is flat-plus-one, so a depth assertion against it would be satisfied by a ` +
    `walker that stops at 1 — which is why arm A mints its nesting instead. ` +
    `Below-horizon files: ${belowHorizon.map((w) => w.rel).join(', ')}`);

type Row = {
  rel: string;
  commit: string;
  date: string;
  /** Subjects the file names directly, by either spelling. */
  own: Set<string>;
  /** Subjects only the emit spelling reveals — invisible to Round 240's regex. */
  emitOnly: Set<string>;
  /** Subjects Round 240's definition would have found (regex, own file only). */
  regexOnly: Set<string>;
  scriptDeps: string[];
  readsCorpusDirect: boolean;
};

const scans = new Map<string, Scan>();
const edges = new Map<string, string[]>();
const rows = new Map<string, Row>();
const noCommit: string[] = [];

for (const { rel } of walked) {
  const repoRel = path.join('scripts', rel);
  const src = fs.readFileSync(path.join(SCRIPTS, rel), 'utf8');
  const s = scan(src);
  scans.set(repoRel, s);

  const scriptDeps: string[] = [];
  const productViaImport = new Set<string>();
  for (const spec of s.specifiers) {
    const target = resolveSpecifier(repoRel, spec);
    if (!target) continue;
    if (target.startsWith('scripts/')) scriptDeps.push(target);
    else if (/^packages\/.*\.(?:tsx|ts)$/.test(target)) productViaImport.add(target);
  }
  edges.set(repoRel, scriptDeps);

  const regexOnly = new Set((s.code.match(SUBJECT_RE) ?? []).filter((p) => fs.existsSync(path.join(REPO, p))));
  const own = new Set([...regexOnly, ...productViaImport]);
  const emitOnly = new Set([...productViaImport].filter((p) => !regexOnly.has(p)));

  const meta = git(['log', '-1', '--format=%H|%ci', '--', repoRel]).trim();
  if (!meta) { noCommit.push(repoRel); continue; }
  const [commit, date] = meta.split('|');

  rows.set(repoRel, {
    rel: repoRel,
    commit: commit.slice(0, 8),
    date: date.slice(0, 10),
    own,
    emitOnly,
    regexOnly,
    scriptDeps,
    readsCorpusDirect: CORPUS_CTX_RE.test(s.code),
  });
}

// ── D: the emit spelling, priced ─────────────────────────────────────────────

const emitBlind = [...rows.values()].filter((r) => r.emitOnly.size > 0);
const emitBlindAndOtherwiseEmpty = emitBlind.filter((r) => r.regexOnly.size === 0);

meas('D', 'files whose product coupling is visible ONLY through the TS emit spelling',
  `${emitBlind.length}/${rows.size} files name at least one real product source file that ` +
    `Round 240's .ts-only regex does not see. ${emitBlindAndOtherwiseEmpty.length} of those name ` +
    `NO product path by the old definition at all — the old sweep read them as uncoupled. ` +
    `None of these were below the walk horizon: the sweep opened every one of them. ` +
    `Total emit-only (file, subject) pairs: ${emitBlind.reduce((n, r) => n + r.emitOnly.size, 0)}.`);

// ── Staleness, three definitions at one HEAD ─────────────────────────────────
//
// Round 240 reported 29 and Round 244 reported 33, at two different HEADs. Quoting either
// against today's figure would confound the definition with the date. All three definitions are
// therefore evaluated here, at this HEAD, against the same git history.

const commitsSince = (() => {
  const cache = new Map<string, number>();
  return (anchor: string, subject: string) => {
    const key = `${anchor}::${subject}`;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const log = git(['log', '--oneline', `${anchor}..HEAD`, '--', subject]).trim();
    const n = log ? log.split('\n').length : 0;
    cache.set(key, n);
    return n;
  };
})();

const laterOf = (a: string, b: string) => {
  // `git merge-base --is-ancestor a b` → b is at or after a.
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', a, b], { cwd: REPO, stdio: 'ignore' });
    return b;
  } catch { return a; }
};

type Stale = { rel: string; via: Array<{ subject: string; n: number; through: string }> };

function staleUnder(opts: { recursive: boolean; emitSpelling: boolean; transitive: boolean }): Stale[] {
  const out: Stale[] = [];
  for (const r of rows.values()) {
    if (!opts.recursive && r.rel.split('/').length > 2) continue;  // one-level only
    const pairs: Array<{ subject: string; through: string }> = [];
    const direct = opts.emitSpelling ? r.own : r.regexOnly;
    for (const s of direct) pairs.push({ subject: s, through: r.rel });
    if (opts.transitive) {
      for (const dep of reachableScripts(r.rel, edges)) {
        const depRow = rows.get(dep);
        if (!depRow) continue;
        for (const s of opts.emitSpelling ? depRow.own : depRow.regexOnly) pairs.push({ subject: s, through: dep });
      }
    }
    const via: Stale['via'] = [];
    const seen = new Set<string>();
    for (const { subject, through } of pairs) {
      if (seen.has(subject)) continue;
      seen.add(subject);
      const throughRow = rows.get(through);
      const anchor = throughRow && through !== r.rel
        ? laterOf(r.commit, throughRow.commit)   // the last time ANYONE in the chain was touched
        : r.commit;
      const n = commitsSince(anchor, subject);
      if (n > 0) via.push({ subject, n, through });
    }
    if (via.length) out.push({ rel: r.rel, via: via.sort((a, b) => b.n - a.n) });
  }
  return out.sort((a, b) => b.via[0].n - a.via[0].n);
}

const oldDef = staleUnder({ recursive: false, emitSpelling: false, transitive: false });
const walkOnly = staleUnder({ recursive: true, emitSpelling: false, transitive: false });
const full = staleUnder({ recursive: true, emitSpelling: true, transitive: true });

const staleBelowHorizon = full.filter((s) => s.rel.split('/').length > 2);

meas('E', 'the stale-in-code population under three definitions, all at THIS HEAD',
  `Round 240's definition (one level, .ts regex, direct): ${oldDef.length}. ` +
    `+ recursive walk: ${walkOnly.length} (Round 244's repair alone, ${walkOnly.length - oldDef.length} added). ` +
    `+ emit spelling + transitive imports: ${full.length} (${full.length - walkOnly.length} further added). ` +
    `Evaluated at one HEAD on purpose: Round 240 published 29 and Round 244 published 33 at two ` +
    `different HEADs, so quoting either against today's number would confound the DEFINITION with ` +
    `the DATE. The ${full.length - oldDef.length} difference here is definition only. ` +
    `READ THE MIDDLE TERM: the recursive walk — MY Round 244 headline — adds ` +
    `${walkOnly.length - oldDef.length} to this population, because ${staleBelowHorizon.length} of ` +
    `the ${belowHorizon.length} below-horizon modules is stale-in-code under ANY definition here. ` +
    `The horizon defect was real and is, on this population, currently free. The blind spot ` +
    `nobody had named costs ${full.length - walkOnly.length}.`);

// ── G: what the naive stripper actually costs, measured ──────────────────────

let hiddenSubjects: string[] = [];
let flippedCorpus: string[] = [];
for (const { rel } of walked) {
  const repoRel = path.join('scripts', rel);
  const src = fs.readFileSync(path.join(SCRIPTS, rel), 'utf8');
  const aware = scans.get(repoRel)!.code;
  const naive = stripCommentsNaive(src);
  const an = new Set(aware.match(SUBJECT_RE) ?? []);
  const nn = new Set(naive.match(SUBJECT_RE) ?? []);
  for (const s of an) if (!nn.has(s)) hiddenSubjects.push(`${path.basename(repoRel)}: ${s}`);
  if (CORPUS_CTX_RE.test(aware) !== CORPUS_CTX_RE.test(naive)) flippedCorpus.push(repoRel);
}
const hiddenThatExist = hiddenSubjects.filter((h) => fs.existsSync(path.join(REPO, h.split(': ')[1])));

meas('G', 'the naive stripper\'s string blindness, priced rather than assumed',
  `Round 240's stripper reads '//' inside a quoted URL as a line comment and discards the rest ` +
    `of the line. Real occurrences in scripts/: 54 lines carry a quoted '://'. Outcome cost at ` +
    `this HEAD: ${hiddenSubjects.length} subject path(s) hidden, of which ${hiddenThatExist.length} ` +
    `name a file that exists; ${flippedCorpus.length} corpus-reader classification(s) flipped. ` +
    `${hiddenSubjects.length ? `Hidden: ${hiddenSubjects.join('; ')}. ` : ''}` +
    `Reported as a latent hazard with a measured size, NOT as the cause of anything: the flaw is ` +
    `real and it is currently costing almost nothing. Fixed here because it was free to fix.`);

// ── I: transitive corpus readers ─────────────────────────────────────────────

const readsCorpusTransitive = (rel: string) => {
  const r = rows.get(rel);
  if (!r) return false;
  if (r.readsCorpusDirect) return true;
  for (const dep of reachableScripts(rel, edges)) if (rows.get(dep)?.readsCorpusDirect) return true;
  return false;
};

const directReaders = [...rows.values()].filter((r) => r.readsCorpusDirect).map((r) => r.rel);
const transitiveReaders = [...rows.keys()].filter(readsCorpusTransitive);
const gainedByTransitivity = transitiveReaders.filter((r) => !directReaders.includes(r));

// The over-inclusion arm H declines to assert away, given an upper bound instead: a file whose
// only corpus mention sits inside a template literal is minting source, not reading the corpus.
const mintersUpperBound = directReaders.filter((rel) => {
  const code = scans.get(rel)!.code;
  const outsideTemplates = code.replace(/`[^`]*`/g, '``');
  return !CORPUS_CTX_RE.test(outsideTemplates);
});

meas('I', 'corpus readers, direct vs transitive',
  `direct ${directReaders.length} · transitive ${transitiveReaders.length} · ` +
    `${gainedByTransitivity.length} file(s) are corpus readers only through an import: ` +
    `${gainedByTransitivity.map((f) => path.basename(f)).join(', ') || '(none)'}. ` +
    `This is the class Round 240's arm I lost when corpus access moved into scripts/lib — ` +
    `reported as the measurement it is, not as a pinned two-sided control (Round 244 §3). ` +
    `OVER-INCLUSION, bounded rather than asserted away (arm H): ${mintersUpperBound.length} of the ` +
    `${directReaders.length} direct readers name the corpus ONLY inside a template literal, so they ` +
    `may be minting source rather than reading` +
    `${mintersUpperBound.length ? `: ${mintersUpperBound.map((f) => path.basename(f)).join(', ')}` : ''}. ` +
    `That is an upper bound on the false-positive rate, not a defect list.`);

// ── J: a staleness axis Round 240 could not express ──────────────────────────
//
// A probe can go stale without the product moving at all: the SHARED MODULE it imports can
// change under it. Round 240 had no edge to see this along.

const libDrift: Array<{ rel: string; dep: string; n: number }> = [];
for (const r of rows.values()) {
  for (const dep of reachableScripts(r.rel, edges)) {
    const n = commitsSince(r.commit, dep);
    if (n > 0) libDrift.push({ rel: r.rel, dep, n });
  }
}
const driftedProbes = new Set(libDrift.map((d) => d.rel));

meas('J', 'probes whose own shared dependency moved after the probe was last committed',
  `${driftedProbes.size}/${rows.size} file(s), across ${libDrift.length} (file, dependency) pair(s). ` +
    `A probe can go stale with the product perfectly still: the module it imports changes under ` +
    `it. Round 240 built no import edges, so it could not express this axis at all — and the two ` +
    `Round 245 covered (mint-transcript, probe-corpus-sessions) are exactly the kind of module ` +
    `whose movement this measures.`);

// ─────────────────────────────────────────────────────────────────────────────
// Listings
// ─────────────────────────────────────────────────────────────────────────────

if (emitBlindAndOtherwiseEmpty.length) {
  console.log('\n── Read as "no product subject" by the old sweep, and wrong ─────\n');
  for (const r of emitBlindAndOtherwiseEmpty.sort((a, b) => b.emitOnly.size - a.emitOnly.size)) {
    console.log(`  ${String(r.emitOnly.size).padStart(2)} subject(s)  ${path.basename(r.rel)}  (last committed ${r.date})`);
    if (VERBOSE) for (const s of [...r.emitOnly].sort()) console.log(`                 ${s}`);
  }
}

console.log('\n── Stale-in-code, full definition, ranked ───────────────────────\n');
for (const s of full) {
  console.log(`  ${String(s.via[0].n).padStart(3)} commit(s)  ${path.basename(s.rel)}  (${rows.get(s.rel)!.date})`);
  for (const v of s.via.slice(0, VERBOSE ? 99 : 3)) {
    console.log(`               ${v.subject} +${v.n}${v.through === s.rel ? '' : `  [via ${path.basename(v.through)}]`}`);
  }
}

if (noCommit.length) console.log(`\nUncommitted (excluded from staleness): ${noCommit.join(', ')}`);

console.log('\n─────────────────────────────────────────────────────────────────');
console.log('NEXT: the population is still not driven. Three rounds open on that, said plainly.');
console.log('Round 240\'s probe is NOT edited by this round: its arm I stays red and its published');
console.log('figures keep reproducing. This instrument supersedes it; it does not repair it.\n');

summariseAndExit({ probeName: 'round246-sweep-repaired', results, regressionKind: 'regression' });
