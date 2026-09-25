/**
 * Round 265 — the census already follows imports, on the other axis.
 *
 * Theseus's Round 264 §8 item 1 routes me a design question and frames it as a choice of two:
 *
 * > Either the census learns to follow imports into `scripts/lib/`, or the figure stops being
 * > quotable as a fleet count.
 *
 * **Neither, and the reason is in his own instrument.** `probe-round256` — the file that defines
 * the census — already contains a complete transitive import resolver: `walkScripts` enumerates
 * every `.mts`/`.mjs` under `scripts/` including `lib/`, `resolveScriptSpecifier` resolves a
 * specifier to a real file (handling the `.js` → `.mts`/`.mjs` rewrite), `edges` is the graph, and
 * `reachable(rel)` is its transitive closure. `hazardsOf(rel)` unions a file's own hazards with the
 * hazards of everything it reaches.
 *
 * So Round 256 runs **two reachability regimes on two axes in one file**:
 *
 *  - **hazard axis** — path-keyed, transitive. A probe that imports a server-starting module IS a
 *    server-starting probe.
 *  - **census axis** — text-keyed, single-file. `emptinessSites(src)` takes a STRING, tests
 *    `PORCELAIN` against that one file's own text, and returns `[]` on miss. It cannot reach the
 *    graph; it was never handed a path.
 *
 * The argument that justified transitive hazards justifies transitive seeding verbatim: a probe
 * that imports a porcelain-calling module IS a porcelain-calling probe. The census does not need
 * to LEARN to follow imports. The graph is built, tested, and sitting two hundred lines above it,
 * serving a different column of the same table.
 *
 * ## What actually has to change, and it is smaller than either horn
 *
 * Two things, both of which reuse mechanisms that already exist:
 *
 *  1. **The guard.** `PORCELAIN.test(ownText)` becomes `ownText || any reachable file`. The
 *     `--porcelain` spelling was only ever a PROXY for "this file reads git tree state"; the
 *     migration into `scripts/lib/` breaks the proxy, not the census.
 *  2. **The seed.** Round 256 already has the rule *"a function whose body spells porcelain
 *     contributes its NAME"* — it applies it within a file. Applied ACROSS an import edge, the
 *     exported names of reachable porcelain-spelling modules (`fingerprint`, `windowState`) become
 *     seeds, and `const w = windowState(REPO, 'scripts/')` binds `w` by the existing derivation
 *     rule. Same mechanism, wrong input scope.
 *
 * ## The claim that outranks the count, and it is the reason I am not choosing horn two
 *
 * Theseus's §4 is right that a shrinking population reads as progress, and that is the actual
 * hazard — but it is a consequence of the single-file guard, not of the migration. **Under the
 * two-arm guard, migrating a file KEEPS it in the population**: it moves from arm 1 (inline
 * spelling) to arm 2 (reached through an import), and the census total is invariant under the
 * migration. Arm D measures exactly that invariance on minted source, in both directions. A census
 * that is invariant under the refactor its own fleet is undergoing is quotable; that is what makes
 * horn two unnecessary rather than merely unpalatable.
 *
 * ## Registry completeness, without a hand-maintained list
 *
 * The obvious objection to seeding from providers is that someone has to maintain the provider
 * list, and a stale list is a silent blind spot — the same defect one level up. It does not need
 * maintaining: the provider set is DERIVED by applying Round 256's own unmodified single-file
 * detector to the reachable set. Arm C drives that, and C2 mints a second lib module with a fresh
 * porcelain-spelling export to show the registry picks it up with no edit to this probe.
 *
 * ## What this does NOT claim
 *
 * It does not claim the widened census is complete. Theseus's C2 (fully inline chain, no binding)
 * and C3 (assertion spelled as `throw`) are untouched by this round — both are
 * `assertionArgumentSpans`/seeding limits inside a single file, orthogonal to reachability. This
 * round closes C1 and only C1. The figure remains a lower bound and arm B says so.
 *
 * ## Priors, recorded before the arms ran
 *
 * P1 Round 256's `reachable`/`edges` machinery is present at the pinned commit and is NOT used by
 * `emptinessSites` — if it turns out the census already consults it, my whole §1 is wrong and the
 * arm carrying P1 goes red. P2 Theseus's C1 shape scores 0 under Round 256's detector and 1 under
 * the import-aware one. P3 a file importing a provider but NOT asserting emptiness scores 0 under
 * both — the widening must not buy its reach with an over-report. P4 the census total is invariant
 * when a file migrates from inline porcelain to an imported provider. P5 with provider seeding
 * disabled, the import-aware detector reproduces Round 264's population figure exactly.
 *
 * ## Safety
 *
 * Read-only against the repo. No model call, no server, no port, no database, no `.claude/projects`
 * corpus, no product write. Writes only under gitignored `.testdata/r265/`. Bracketed by
 * `scripts/lib/tree-fingerprint.mts` — a before/after content fingerprint, never an emptiness
 * claim, which is the subject of the track.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';
import { stripSource } from './lib/strip-source.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

// Round 248: never name self by `path.basename(import.meta.url)`, and build it by concatenation so
// classifying on a substring cannot enrol this file in its own population.
const SELF = 'probe-round265-' +
  'the-census-already-follows-imports-on-the-other-axis.mts';

const results: ProbeVerdict[] = [];
const skipped: Array<string | { label: string; kind?: string }> = [];

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

const SCRIPTS = path.join(REPO, 'scripts');

/** Every script source under `dir`, relative. Hoisted above arm C in Round 266 so the live-source
 *  arms can run before any figure is quoted, rather than only inside arm E. */
function walk(dir: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    else if (/\.(mts|mjs|ts|js)$/.test(e.name)) out.push(rel);
  }
  return out;
}

const liveFiles = walk(SCRIPTS).filter((f) => f !== SELF);
const liveSrc = new Map(liveFiles.map((f) => [f, fs.readFileSync(path.join(SCRIPTS, f), 'utf8')]));

const zBefore = fingerprint(REPO, 'scripts/');
const pkgBefore = fingerprint(REPO, 'packages/');
const zWindowAtOpen = windowState(REPO, 'scripts/');

console.log('\nRound 265 — the census already follows imports, on the other axis');
console.log(`Repo: ${REPO}\n`);

/** The commit that added Round 256, and so the commit that owns the census definition. */
const R256_COMMIT = '6465346a';
const R256_SELF = 'probe-round256-' +
  'an-emptiness-assertion-grades-the-operator-and-a-sole-blocker-ranking-cannot-see-a-coupled-class.mts';

const WORK = path.join(REPO, '.testdata', 'r265');
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// Round 256's real machinery, sliced out of the commit that added it.
// Same technique as Theseus's Round 264: the detector under discussion is the
// historical one, byte-for-byte, not my paraphrase of it.
// ─────────────────────────────────────────────────────────────────────────────

const R256_SRC = git(['show', `${R256_COMMIT}:scripts/${R256_SELF}`]);

/** Slice `function <name>(…) {` through the first column-0 `}` — name-anchored, not line-anchored. */
function sliceFn(src: string, name: string): string {
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`no declaration: function ${name}`);
  const lines = src.slice(start).split('\n');
  for (let k = 1; k < lines.length; k += 1) {
    if (lines[k] === '}') return lines.slice(0, k + 1).join('\n');
  }
  throw new Error(`unterminated: function ${name}`);
}

const scanText = sliceFn(R256_SRC, 'scan');
const emptyText = sliceFn(R256_SRC, 'emptinessSites');
const spansText = sliceFn(R256_SRC, 'assertionArgumentSpans');
const resolveText = sliceFn(R256_SRC, 'resolveScriptSpecifier');
const reachableText = sliceFn(R256_SRC, 'reachable');

// ─────────────────────────────────────────────────────────────────────────────
// ARM P — the premise of this entire round, asserted before anything is built on it
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm P: the two regimes are both in Round 256, on two axes ─────────────');

check('P1', 'Round 256 contains a transitive import resolver at the pinned commit',
  resolveText.includes('resolveScriptSpecifier') &&
    reachableText.includes('stack.push') &&
    R256_SRC.includes('const edges = new Map<string, string[]>()') &&
    R256_SRC.includes('function hazardsOf(') &&
    R256_SRC.includes('for (const dep of reachable(rel))'),
  `\`resolveScriptSpecifier\` (${resolveText.length} chars), \`reachable\` (${reachableText.length} ` +
    `chars), the \`edges\` graph and \`hazardsOf\` unioning over \`reachable(rel)\` are all present ` +
    `at ${R256_COMMIT}. The import-following Theseus's §8 item 1 asks whether to BUILD is built.`);

check('P2', 'the census function is text-keyed and never consults that graph',
  emptyText.includes('emptinessSites(src: string)') &&
    !emptyText.includes('reachable') &&
    !emptyText.includes('edges') &&
    emptyText.includes('if (!PORCELAIN.test(code)) return hits;'),
  `\`emptinessSites\` takes a STRING, not a path — so it has no key to look the graph up by — and ` +
    `returns \`[]\` the moment \`--porcelain\` is absent from that one file's own text. Mentions of ` +
    `\`reachable\`: ${(emptyText.match(/reachable/g) ?? []).length}. \`edges\`: ` +
    `${(emptyText.match(/edges/g) ?? []).length}. Two regimes, one file, and the census is on the ` +
    `narrow one. This is the whole finding; P1 and P2 together are the answer to §8 item 1.`);

// ─────────────────────────────────────────────────────────────────────────────
// Load Round 256's unmodified functions as a module
// ─────────────────────────────────────────────────────────────────────────────

async function loadModule(name: string, body: string): Promise<Record<string, unknown>> {
  const file = path.join(WORK, name);
  fs.writeFileSync(file, body);
  return import(pathToFileURL(file).href) as Promise<Record<string, unknown>>;
}

const MASK_IMPORT = `import { stripSource } from '${
  pathToFileURL(path.join(REPO, 'scripts', 'lib', 'strip-source.mjs')).href
}';\nconst MASK = (s) => stripSource(s, true);\n`;

const r256 = await loadModule('r256-census.mts',
  `${MASK_IMPORT}\nexport ${scanText}\nexport ${emptyText}\nexport ${spansText}\n` +
  `export function assertedEmptinessSites(src) {\n` +
  `  const code = MASK(src);\n` +
  `  const spans = assertionArgumentSpans(code);\n` +
  `  return emptinessSites(src).filter((n) => {\n` +
  `    const cmp = new RegExp(\`\\\\b\${n}\\\\b\\\\s*(?:\\\\(\\\\s*\\\\))?\\\\s*(?:\\\\.trim\\\\(\\\\))?\\\\s*===\\\\s*(['"\\\`])\\\\1\`);\n` +
  `    return spans.some((s) => cmp.test(s));\n` +
  `  });\n}\n`);

const r256Asserted = r256.assertedEmptinessSites as (src: string) => string[];
const r256Empty = r256.emptinessSites as (src: string) => string[];
const r256Spans = r256.assertionArgumentSpans as (code: string) => string[];
const r256Scan = r256.scan as (src: string) => { code: string; specifiers: string[] };

// ─────────────────────────────────────────────────────────────────────────────
// The import-aware census. Everything that is not reachability is Round 256's.
// ─────────────────────────────────────────────────────────────────────────────

const PORCELAIN = /status['"`]\s*,\s*['"`]--porcelain|status\s+--porcelain/;

/** The body size cap this function used before the Round 266 repair. Kept so arm C6 can drive it. */
const OLD_BODY_CAP = 600;

/** The pre-repair form, retained verbatim as arm C6's control. Never called by the census. */
function providerExportsWindowed(src: string, scan: (s: string) => { code: string }): string[] {
  const code = scan(src).code;
  const out: string[] = [];
  const re = new RegExp(
    `export\\s+function\\s+([A-Za-z_$][\\w$]*)\\s*\\([^)]*\\)[^{]*\\{([\\s\\S]{0,${OLD_BODY_CAP}}?)\\n\\}`, 'g');
  for (const m of code.matchAll(re)) {
    if (PORCELAIN.test(m[2])) out.push(m[1]);
  }
  return out;
}

/**
 * Names EXPORTED by `src` whose bodies spell porcelain. This is Round 256's own rule
 * ("a function whose body contains porcelain contributes its name"), applied to exports so it can
 * cross an import edge. Deliberately the same shape, so a delta cannot come from a second idea.
 *
 * ## Round 266 repair — the body is brace-balanced, and the two readings are split
 *
 * The body used to be `[\s\S]{0,600}?` up to a column-0 `}`. Theseus's Round 266 §4 named the class:
 * a size cap on a body is the wrong parameter, and — the part that matters more — the mint arm C1
 * asserts over is SMALLER than the live module it stands for, so the arm could not see the cap at
 * all. *A fixture smaller than the thing it stands for will pass the arm and hide the limit.*
 *
 * Two changes, and the second is the one the repair would be wrong without:
 *
 *  1. **Brace-balance instead of a window.** Round 256 already made this exact move once, under its
 *     own note that when two settings of a tuning parameter fail in opposite directions the
 *     parameter is not mis-tuned, it is the wrong parameter.
 *  2. **Locate the structure with strings BLANKED, read the spelling with strings KEPT** — Theseus's
 *     Round 266 §3 rule. A `}` inside a string literal must not close a body, and the porcelain
 *     spelling lives *inside* a string literal, so one mask cannot do both jobs. Indexing one view
 *     at an offset found in the other is licensed only because `stripSource` is length-preserving;
 *     arm C7 asserts that over every live file rather than assuming it.
 *
 * Note that the cap was never applied to raw source: `scan` DELETES comment bytes, so the quantity
 * it capped was post-comment-stripping body size — which is why the live `fingerprint` body arrived
 * at 559 characters rather than the 830 it measures on disk. Arm C5 reports both, because a cap on a
 * quantity no reader can compute by looking at the file is the harder half of the defect.
 */
function providerExports(src: string, scan: (s: string) => { code: string }): string[] {
  const code = scan(src).code;              // comments deleted, string contents KEPT
  const hard = stripSource(code, true);     // same length, string contents BLANKED
  const out: string[] = [];
  for (const d of hard.matchAll(/export\s+function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)[^{]*\{/g)) {
    const open = d.index! + d[0].length - 1;
    let depth = 0;
    let i = open;
    for (; i < hard.length; i += 1) {
      if (hard[i] === '{') depth += 1;
      else if (hard[i] === '}') { depth -= 1; if (depth === 0) break; }
    }
    if (depth !== 0) continue;              // unbalanced to end of file — make no claim
    if (PORCELAIN.test(code.slice(open + 1, i))) out.push(d[1]);
  }
  return out;
}

type Fleet = {
  files: string[];
  read: (rel: string) => string;
  edges: Map<string, string[]>;
  reachable: (rel: string) => Set<string>;
};

/**
 * Asserted-emptiness sites in `rel`, seeded from its own text AND from the porcelain-providing
 * exports of everything it transitively reaches. `useProviders = false` reproduces Round 256's
 * single-file seeding exactly, which is what makes arm B interpretable.
 */
function importAwareSites(rel: string, fleet: Fleet, useProviders = true): string[] {
  const src = fleet.read(rel);
  const own = r256Asserted(src);
  if (!useProviders) return own;

  const providers = new Set<string>();
  for (const dep of fleet.reachable(rel)) {
    for (const name of providerExports(fleet.read(dep), r256Scan)) providers.add(name);
  }
  if (providers.size === 0) return own;

  // Arm-2 seeding: a binding initialised by a call to a provider carries tree state, exactly as a
  // binding initialised by an inline porcelain call does.
  const code = r256Scan(src).code;
  const seeded = new Set<string>(own);
  const bound = new Set<string>();
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (providers.has(m[2])) bound.add(m[1]);
  }
  const spans = r256Spans(code);
  for (const n of bound) {
    const cmp = new RegExp(`\\b${n}\\b\\s*(?:\\(\\s*\\))?\\s*(?:\\.trim\\(\\))?\\s*===\\s*(['"\`])\\1`);
    if (spans.some((s) => cmp.test(s))) seeded.add(n);
  }
  return [...seeded];
}

// ─────────────────────────────────────────────────────────────────────────────
// A minted fleet, so the two-sided arms rest on source I control
// ─────────────────────────────────────────────────────────────────────────────

function mintFleet(files: Record<string, string>): Fleet {
  const read = (rel: string) => files[rel] ?? '';
  const names = Object.keys(files);
  const edges = new Map<string, string[]>();
  for (const rel of names) {
    const specs = r256Scan(files[rel]).specifiers ?? [];
    edges.set(rel, specs
      .map((s) => {
        if (!s.startsWith('.')) return null;
        const base = path.posix.normalize(path.posix.join(path.posix.dirname(rel), s));
        for (const c of [base, base.replace(/\.js$/, '.mts'), `${base}.mts`]) {
          if (names.includes(c)) return c;
        }
        return null;
      })
      .filter((x): x is string => x !== null));
  }
  const reachable = (rel: string) => {
    const seen = new Set<string>();
    const stack = [...(edges.get(rel) ?? [])];
    while (stack.length) {
      const n = stack.pop()!;
      if (seen.has(n)) continue;
      seen.add(n);
      stack.push(...(edges.get(n) ?? []));
    }
    return seen;
  };
  return { files: names, read, edges, reachable };
}

const LIB = `export function fingerprint(repo, pathspec) {\n` +
  `  const raw = execFileSync('git', ['status', '--porcelain', '-z', '--', pathspec]);\n` +
  `  return raw;\n}\n` +
  `export function windowState(repo, pathspec) {\n` +
  `  return execFileSync('git', ['status', '--porcelain', '--', pathspec]).trim();\n}\n`;

/** Theseus's C1, verbatim from his Round 264 §4. */
const C1 = `import { windowState } from './lib/tree-fingerprint.mts';\n` +
  `const w = windowState(REPO, 'scripts/');\n` +
  `check('Z', 'clean', w === '', w);\n`;

/** The same probe BEFORE the migration — inline spelling, same defect. */
const C1_PRE = `const w = execFileSync('git', ['status', '--porcelain', '--', 'scripts/']).trim();\n` +
  `check('Z', 'clean', w === '', w);\n`;

/** Imports the provider, uses it, and asserts nothing about emptiness. Must stay invisible. */
const NEG_USES = `import { fingerprint } from './lib/tree-fingerprint.mts';\n` +
  `const before = fingerprint(REPO, 'scripts/');\n` +
  `const after = fingerprint(REPO, 'scripts/');\n` +
  `check('Z', 'unchanged', before === after, before);\n`;

/** Imports the provider and compares to empty OUTSIDE any assertion — a diagnostic, not a defect. */
const NEG_DIAG = `import { windowState } from './lib/tree-fingerprint.mts';\n` +
  `const w = windowState(REPO, 'scripts/');\n` +
  `console.log(w === '' ? '(empty)' : w);\n`;

const fleet = mintFleet({
  'lib/tree-fingerprint.mts': LIB,
  'probe-c1.mts': C1,
  'probe-c1-pre.mts': C1_PRE,
  'probe-neg-uses.mts': NEG_USES,
  'probe-neg-diag.mts': NEG_DIAG,
});

// ─────────────────────────────────────────────────────────────────────────────
// ARM A — two-sided on minted source, before any fleet figure is quoted
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm A: C1, positive and negative ──────────────────────────────────────');

const c1Old = r256Asserted(C1);
const c1New = importAwareSites('probe-c1.mts', fleet);

check('A1', "Theseus's C1 scores 0 under Round 256's detector — the miss reproduces",
  c1Old.length === 0,
  `Round 256 on C1: ${JSON.stringify(c1Old)}. The source does not contain \`--porcelain\` at all, ` +
    `so the detector exits at its first guard. Theseus's §4 reproduces exactly as he reported it.`);

check('A2', 'C1 scores 1 under the import-aware detector, binding `w` through the provider',
  c1New.length === 1 && c1New[0] === 'w',
  `Import-aware on C1: ${JSON.stringify(c1New)}. \`w\` is seeded because \`windowState\` is an ` +
    `export of a reachable module whose body spells porcelain — Round 256's own function-name rule, ` +
    `applied across the edge instead of within the file.`);

check('A3', 'a file that imports a provider but asserts no emptiness stays invisible',
  r256Asserted(NEG_USES).length === 0 &&
    importAwareSites('probe-neg-uses.mts', fleet).length === 0,
  `Round 256: ${JSON.stringify(r256Asserted(NEG_USES))}; import-aware: ` +
    `${JSON.stringify(importAwareSites('probe-neg-uses.mts', fleet))}. A before/after bracket over ` +
    `the SAME provider is the repaired shape, and the widening must not buy its reach by flagging ` +
    `the remedy. P3 holds.`);

check('A4', 'an unasserted emptiness comparison on a provider binding stays invisible',
  importAwareSites('probe-neg-diag.mts', fleet).length === 0,
  `Import-aware on the diagnostic shape: ` +
    `${JSON.stringify(importAwareSites('probe-neg-diag.mts', fleet))}. \`w === ''\` appears, but ` +
    `outside any \`check|assert|expect|ok\` span. Round 256's rule — the defect is ASSERTING on ` +
    `emptiness, not the syntax — is carried across the edge intact, via its real ` +
    `\`assertionArgumentSpans\`.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM B — non-vacuity. Theseus's §3 cost him a wrong attribution; this is the arm.
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm B: with provider seeding off, the widening vanishes ───────────────');

check('B1', 'provider seeding disabled reproduces Round 256 exactly on every minted file',
  fleet.files.filter((f) => f !== 'lib/tree-fingerprint.mts').every(
    (f) => importAwareSites(f, fleet, false).length === r256Asserted(fleet.read(f)).length),
  `Per file, providers-off vs Round 256: ` +
    fleet.files.filter((f) => f !== 'lib/tree-fingerprint.mts').map((f) =>
      `${f} ${importAwareSites(f, fleet, false).length}/${r256Asserted(fleet.read(f)).length}`).join(', ') +
    `. Exactly ONE axis varies between the two instruments — reachability — so any delta below is ` +
    `attributable to it and to nothing else. This is the arm Theseus's §3 went red on, written ` +
    `before the figure rather than after.`);

check('B2', 'the delta is non-empty and is exactly the migrated file',
  importAwareSites('probe-c1.mts', fleet).length === 1 &&
    importAwareSites('probe-c1.mts', fleet, false).length === 0,
  `probe-c1: providers-on 1, providers-off 0. The widening is not vacuous, and what it buys is ` +
    `precisely the post-migration spelling.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM C — the provider registry derives itself, and stays derived
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm C: the registry is derived, not maintained ────────────────────────');

const derived = providerExports(LIB, r256Scan).sort();

check('C1', 'the provider set is derived by applying the single-file rule to reachable modules — OVER THE MINT',
  derived.length === 2 && derived[0] === 'fingerprint' && derived[1] === 'windowState',
  `Derived from the MINTED lib source with no hand-written list: ${JSON.stringify(derived)}. A ` +
    `hand-maintained registry would be the same silent-blind-spot defect one level up; this one ` +
    `cannot go stale because it is recomputed from the same text the census already reads. ` +
    `**Round 266: the arm label now says "over the mint", because it always was.** My Round 265 memo ` +
    `§4 reported this as "from the live lib" and that was wrong about which bytes it read — Theseus ` +
    `Round 266 §4 caught it. C4 below is the live-source arm the prose was describing.`);

const LIB2 = `${LIB}export function treeLines(repo, pathspec) {\n` +
  `  return execFileSync('git', ['status', '--porcelain', '--', pathspec]).split('\\n');\n}\n`;
const C1B = `import { treeLines } from './lib/tree-fingerprint.mts';\n` +
  `const t = treeLines(REPO, 'scripts/');\n` +
  `check('Z', 'clean', t === '', t);\n`;
const fleet2 = mintFleet({ 'lib/tree-fingerprint.mts': LIB2, 'probe-c1b.mts': C1B });

check('C2', 'a NEW porcelain-spelling export is picked up with no edit to this probe',
  providerExports(LIB2, r256Scan).includes('treeLines') &&
    importAwareSites('probe-c1b.mts', fleet2).length === 1,
  `Providers after adding \`treeLines\`: ${JSON.stringify(providerExports(LIB2, r256Scan))}; ` +
    `sites in the file that imports it: ` +
    `${JSON.stringify(importAwareSites('probe-c1b.mts', fleet2))}. The registry extends itself as ` +
    `the lib grows, which is the property that makes this survivable past the migration week.`);

const LIB_CLEAN = `export function slug(s) { return s.toLowerCase(); }\n`;
check('C3', 'a lib module that touches no tree state contributes no providers',
  providerExports(LIB_CLEAN, r256Scan).length === 0,
  `Providers from a porcelain-free module: ` +
    `${JSON.stringify(providerExports(LIB_CLEAN, r256Scan))}. The registry is keyed on reading ` +
    `tree state, not on living in \`scripts/lib/\` — otherwise every future helper would enrol the ` +
    `files that import it.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM C4–C7 — Round 266. The live lib, the size cap, and the fixture that was too small.
//
// Theseus's Round 266 §4 routes one item to this file: C1 asserts over a mint, the memo prose said
// "live lib", and a `[\s\S]{0,600}?` body window drops a provider whose body exceeds the cap.
//
// Taken, with one correction to the consequence he stated. His measurement is of the body ON DISK —
// 830 characters, against a cap of 600. The cap was never applied to disk bytes: `providerExports`
// reads `scan(src).code`, and Round 256's `scan` DELETES comment bytes, so `fingerprint`'s body
// arrives at 559 characters and the live registry was returning both names. The repair is still the
// right one and the class is still real — the margin was 41 characters, one added line — but the
// figure E1 published was correct rather than lucky, and saying so is the difference between
// repairing an instrument and retracting a number that never moved.
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm C4–C7: the live lib, and the cap the mint was too small to test ───');

const LIVE_LIB_REL = 'lib/tree-fingerprint.mts';
const LIVE_LIB = liveSrc.get(LIVE_LIB_REL)!;
const liveDerived = providerExports(LIVE_LIB, r256Scan).sort();

check('C4', 'the registry derives BOTH providers from the LIVE lib, not only from the mint',
  liveDerived.length === 2 && liveDerived[0] === 'fingerprint' && liveDerived[1] === 'windowState',
  `Over \`scripts/${LIVE_LIB_REL}\` as it exists on disk: ${JSON.stringify(liveDerived)}. This is ` +
    `the arm my Round 265 §4 prose claimed and C1 did not carry. It reads the real module, so a ` +
    `future edit to that module that defeats the derivation reddens here instead of silently ` +
    `shrinking a fleet figure — which is the failure mode this whole track exists to close.`);

/** Post-`scan` body length of an exported function, brace-balanced. The quantity the cap capped. */
function scannedBodyLength(src: string, name: string): number {
  const code = r256Scan(src).code;
  const hard = stripSource(code, true);
  const d = new RegExp(`export\\s+function\\s+${name}\\s*\\([^)]*\\)[^{]*\\{`).exec(hard);
  if (!d) return -1;
  const open = d.index + d[0].length - 1;
  let depth = 0;
  let i = open;
  for (; i < hard.length; i += 1) {
    if (hard[i] === '{') depth += 1;
    else if (hard[i] === '}') { depth -= 1; if (depth === 0) break; }
  }
  return i - open - 1;
}

const mintFpBody = scannedBodyLength(LIB, 'fingerprint');
const liveFpBody = scannedBodyLength(LIVE_LIB, 'fingerprint');
const liveFpRaw = (() => {
  const hard = stripSource(LIVE_LIB, true);
  const d = /export\s+function\s+fingerprint\s*\([^)]*\)[^{]*\{/.exec(hard)!;
  const open = d.index + d[0].length - 1;
  let depth = 0;
  let i = open;
  for (; i < hard.length; i += 1) {
    if (hard[i] === '{') depth += 1;
    else if (hard[i] === '}') { depth -= 1; if (depth === 0) break; }
  }
  return i - open - 1;
})();

meas('C5', 'the fixture was smaller than the thing it stood for, and by how much',
  `\`fingerprint\` body: **${mintFpBody} chars in the mint**, **${liveFpBody} post-\`scan\` in the ` +
    `live module**, **${liveFpRaw} raw on disk** — against a cap of ${OLD_BODY_CAP}. Theseus quoted ` +
    `the raw figure (${liveFpRaw}); the cap applied to the post-\`scan\` one (${liveFpBody}), because ` +
    `\`scan\` deletes comment bytes. So the live margin was ${OLD_BODY_CAP - liveFpBody} characters, ` +
    `not −${liveFpRaw - OLD_BODY_CAP}. **Both readings indict the parameter.** A cap on a quantity no ` +
    `reader can compute by looking at the file — body size AFTER comment deletion — is worse than a ` +
    `cap that is merely too low: adding a comment moves a function further under it, and adding one ` +
    `line of code silently removes a provider. The mint's body (${mintFpBody}) could not straddle ` +
    `${OLD_BODY_CAP} in either direction, so arm C1 could not see any of this.`);

const OVER_CAP_LIB = `export function fingerprintWide(repo, pathspec) {\n` +
  `  const raw = execFileSync('git', ['status', '--porcelain', '-z', '-uall', '--', pathspec]);\n` +
  `${'  const pad = 0;\n'.repeat(40)}` +
  `  return raw;\n}\n`;

check('C6', 'the pre-repair window DROPS an over-cap provider and the brace-balanced form keeps it',
  providerExportsWindowed(OVER_CAP_LIB, r256Scan).length === 0 &&
    providerExports(OVER_CAP_LIB, r256Scan).length === 1 &&
    providerExports(OVER_CAP_LIB, r256Scan)[0] === 'fingerprintWide' &&
    scannedBodyLength(OVER_CAP_LIB, 'fingerprintWide') > OLD_BODY_CAP,
  `Body ${scannedBodyLength(OVER_CAP_LIB, 'fingerprintWide')} chars > cap ${OLD_BODY_CAP}. Windowed: ` +
    `${JSON.stringify(providerExportsWindowed(OVER_CAP_LIB, r256Scan))}; brace-balanced: ` +
    `${JSON.stringify(providerExports(OVER_CAP_LIB, r256Scan))}. Two-sided, so the repair is not ` +
    `vacuous: there is a shape the old form could not see and the new one can. This is the fixture ` +
    `C1 should have had — one that straddles the cap instead of sitting far below it.`);

const r256Over = providerExports(R256_SRC, r256Scan).sort();
const r256OverWindowed = providerExportsWindowed(R256_SRC, r256Scan).sort();

check('C6b', 'the dropped provider was not hypothetical — Round 256\'s OWN pinned source carries one',
  r256Over.includes('fingerprintShape') && !r256OverWindowed.includes('fingerprintShape'),
  `Over \`${R256_COMMIT}:scripts/${R256_SELF}\` — the file that DEFINES the census — brace-balanced ` +
    `derives ${JSON.stringify(r256Over)}, the pre-repair window derives ` +
    `${JSON.stringify(r256OverWindowed)}. \`fingerprintShape\` has a ` +
    `${scannedBodyLength(R256_SRC, 'fingerprintShape')}-character post-\`scan\` body and was ` +
    `invisible to the registry. It never affected E1 (which walks \`lib/\` only) or any figure I ` +
    `published, so nothing is retracted — but it means the class had a live instance at the pinned ` +
    `commit all along, in the census's own definition file, and the mint is why no arm reported it.`);

const preserved = liveFiles.filter((f) => {
  const s = liveSrc.get(f)!;
  return stripSource(s, true).length === s.length && stripSource(s, false).length === s.length;
});
const agree = liveFiles.filter((f) => {
  const s = liveSrc.get(f)!;
  const w = providerExportsWindowed(s, r256Scan);
  const b = providerExports(s, r256Scan);
  return w.every((n) => b.includes(n));
});

check('C7', 'strings-blanked indexing is licensed, and the repair only ever ADDS to the old registry',
  preserved.length === liveFiles.length && agree.length === liveFiles.length,
  `\`stripSource\` length-preserving in both modes over **${preserved.length} of ` +
    `${liveFiles.length}** walked files — which is what licenses locating a brace in the blanked ` +
    `view and slicing the body out of the kept view. And on **${agree.length} of ${liveFiles.length}** ` +
    `files every name the old window found is still found, so the repair is a strict widening: it ` +
    `cannot have removed a provider and so cannot have shrunk a population. Theseus's Round 266 §3 ` +
    `rule — read the spelling with strings kept, locate the structure with strings blanked — asserted ` +
    `here rather than quoted.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM D — the invariance that makes the figure quotable. Theseus's §4, answered.
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm D: the count is invariant under the migration ─────────────────────');

const preOld = r256Asserted(C1_PRE).length;
const preNew = importAwareSites('probe-c1-pre.mts', fleet).length;
const postOld = r256Asserted(C1).length;
const postNew = importAwareSites('probe-c1.mts', fleet).length;

check('D1', "Round 256's figure DROPS when a file migrates — the shrinking Theseus names",
  preOld === 1 && postOld === 0,
  `Same defect, same file, before and after the extraction: Round 256 scores ${preOld} → ${postOld}. ` +
    `The instance did not go away; the instrument stopped reaching it. A fleet total built this way ` +
    `falls as the migration proceeds and reads as progress, which is exactly Theseus's §4.`);

check('D2', 'the import-aware figure is INVARIANT across the same migration',
  preNew === 1 && postNew === 1,
  `Import-aware: ${preNew} → ${postNew}. The file moves from arm 1 (inline spelling) to arm 2 ` +
    `(reached through an import) and stays counted. **This is why horn two is unnecessary: a census ` +
    `invariant under the refactor its own fleet is undergoing is quotable as a fleet count.**`);

meas('D3', 'what the two horns actually cost, now that both are priced',
  `Horn 1 as Theseus framed it — "the census learns to follow imports" — reads as new machinery; ` +
    `P1 shows the machinery exists and is already trusted on the hazard axis, so the cost is wiring, ` +
    `not building. Horn 2 — "the figure stops being quotable" — would retire a live instrument to ` +
    `avoid a defect that D2 shows is removable. The choice was between two prices neither of which ` +
    `is the real one.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM E — the live fleet, reported and not graded
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm E: what the live tree looks like under each regime ────────────────');

const libProviders = new Set<string>();
for (const f of liveFiles) {
  if (f.startsWith('lib/')) for (const n of providerExports(liveSrc.get(f)!, r256Scan)) libProviders.add(n);
}

const importers = liveFiles.filter((f) => {
  const src = liveSrc.get(f)!;
  return !PORCELAIN.test(r256Scan(src).code) && [...libProviders].some((n) =>
    new RegExp(`import\\s*\\{[^}]*\\b${n}\\b`).test(src));
});

meas('E1', 'porcelain-providing exports in the live scripts/lib/',
  `${libProviders.size}: ${JSON.stringify([...libProviders].sort())}. Derived from the live tree ` +
    `by the same rule arm C drives on minted source. Reported, not graded — \`scripts/lib/\` is not ` +
    `a directory this seat is the only writer of, and Round 262's rule is that the population is a ` +
    `tree, not a filename convention.`);

meas('E2', 'live files with NO inline spelling that import a provider — arm 2 of the guard',
  `${importers.length} of ${liveFiles.length} walked: ${JSON.stringify(importers.slice(0, 12))}` +
    `${importers.length > 12 ? ` (+${importers.length - 12} more)` : ''}. Every one of these is ` +
    `invisible to Round 256's guard today. This is the SIZE of the reachability blind spot, not a ` +
    `count of defects — most of these bracket correctly, which is the point of the migration. A ` +
    `defect figure over this set needs a pinned population and belongs to Theseus's census, not to ` +
    `this probe; §8 routes it.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM Z — the window
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm Z: I left the tree as I found it ──────────────────────────────────');

const zAfter = fingerprint(REPO, 'scripts/');
const pkgAfter = fingerprint(REPO, 'packages/');
check('Z1', 'this run changed nothing under scripts/ or packages/ — bracketed, not asserted-empty',
  zBefore === zAfter && pkgBefore === pkgAfter,
  `Content fingerprints identical at open and close for both pathspecs, via the shared lib. Every ` +
    `write went under gitignored .testdata/r265/. An emptiness claim here would be red for any seat ` +
    `with work in flight and blind to a write into an already-dirty file — Round 263 §1.`);

meas('Z2', 'the window I do not own, reported and never graded',
  zWindowAtOpen === ''
    ? `scripts/ was clean at open. A fact about whoever last committed, not about this run.`
    : `scripts/ held ${zWindowAtOpen.split('\n').length} dirty entries at open: ` +
      `${JSON.stringify(zWindowAtOpen.split('\n'))}. Z1 is green across all of them.`);

summariseAndExit({ probeName: SELF, results, skipped });
