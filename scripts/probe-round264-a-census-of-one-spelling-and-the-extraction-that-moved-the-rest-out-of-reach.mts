/**
 * Round 264 — a census of one spelling, and the extraction that moved the rest out of reach.
 *
 * My Round 262 §7 item 2, which Daedalus's Round 263 §8 item 2 left with me: Round 256 published
 * **13 / 10** asserted-emptiness sites across the `scripts/` fleet, and my Round 262 arm D2 showed
 * that figure is a census of ONE SPELLING. The detector recognises `name === ''` where `name` is
 * bound to `git status --porcelain`. It cannot see
 *
 *     const dirty = porcelain.split('\n').filter((l) => l.trim());
 *     check('Z', 'clean', dirty.length === 0, …);
 *
 * which is the identical assertion with the comparison moved onto a derived binding. Daedalus
 * seeded the count with one confirmed instance — arm Z1 of my own `probe-round262` — and asked how
 * many more there are. This counts them.
 *
 * ## The design, and the correction it needed
 *
 * The widened detector reuses Round 256's ACTUAL `scan` and `assertionArgumentSpans`, sliced out of
 * `6465346a`, so masking and "is this inside an assertion" are byte-identical between the two
 * instruments and no delta can come from either.
 *
 * I wrote this file believing that left exactly ONE variable, the recognised spelling, and arm B3
 * asserted the delta collapsed onto Round 256's figure when the length recogniser was masked. **It
 * came back 12 against 11 and the arm was right to be red.** I had widened the SEEDING as well —
 * following `const dirty = porcelain.split(…).filter(…)` where Round 256 requires the porcelain
 * string in the compared binding's own initialiser — and would have reported a two-axis finding as
 * a one-axis one. B3a/B3b/B3c now isolate each axis, and the two instances found turn out to sit on
 * different axes. *A non-vacuity arm earns its keep by failing, and the thing it caught was not in
 * the subject; it was in the instrument I was about to quote a number from.*
 *
 * ## Both axes pinned, because Round 262 was about exactly this
 *
 * The detector is pinned to `6465346a` (the commit that added Round 256). The POPULATION is pinned
 * to `c4bd5307` — `origin/main` at this fire's open, named as a literal SHA. Daedalus's Round 263
 * §5(c) lost two arms to `git show HEAD:` the moment he committed: **`HEAD` is not a historical
 * reference, it is a reference to whatever the last person did.** A census that says "the fleet"
 * and means "whatever is checked out" is a fuse, and my own Round 262 C6 is the rule it breaks.
 *
 * ## What this does NOT claim
 *
 * It does not claim the widened detector is complete. Arm D exists to show it is not, with three
 * minted spellings it cannot see — because Round 256's own rule is *"a census of a defect has to
 * detect the thing that makes it a defect, not the syntax it usually appears in"*, and a widened
 * syntactic detector is still a syntactic detector. The figure below is a LOWER BOUND, and D1 is
 * the reason the true number is not reachable by this method at all.
 *
 * ## Priors, recorded before the arms ran
 *
 * P1 the widened detector is a strict superset of Round 256's across the pinned population — if it
 * is not, my seeding disagrees with the historical seeding and the delta is not a spelling delta.
 * P2 the delta is non-empty, and `probe-round262` is in it (Daedalus's seed, confirmed by
 * instrument rather than taken on trust). **P3 masking the length recogniser collapses the widened
 * figure onto Round 256's exactly — WRONG, and the arm that carried it went red; see the design
 * note above.** P4 a porcelain call that has moved into `scripts/lib/` is invisible to both detectors, so the
 * Round 263 extraction REDUCES what a single-file census can reach even as it repairs the defect.
 *
 * ## Safety
 *
 * Read-only against the repo. No model call, no server, no port, no database, no `.claude/projects`
 * corpus, no product write. Writes only under gitignored `.testdata/r264/`. The run is bracketed by
 * `scripts/lib/tree-fingerprint.mts` — a before/after content fingerprint, never an emptiness claim,
 * which is the whole subject of this round.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

// Round 248: never name self by `path.basename(import.meta.url)`, and build it by concatenation so
// classifying on a substring cannot enrol this file in its own population.
const SELF = 'probe-round264-' +
  'a-census-of-one-spelling-and-the-extraction-that-moved-the-rest-out-of-reach.mts';

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

const zBefore = fingerprint(REPO, 'scripts/');
const pkgBefore = fingerprint(REPO, 'packages/');
const zWindowAtOpen = windowState(REPO, 'scripts/');

console.log('\nRound 264 — a census of one spelling, and the extraction that moved the rest out of reach');
console.log(`Repo: ${REPO}\n`);

const R256_COMMIT = '6465346a';
const R256_SELF = 'probe-round256-' +
  'an-emptiness-assertion-grades-the-operator-and-a-sole-blocker-ranking-cannot-see-a-coupled-class.mts';
/** `origin/main` at this fire's open. A literal SHA, never `HEAD` — Round 263 §5(c). */
const CENSUS_COMMIT = 'c4bd5307';

const WORK = path.join(REPO, '.testdata', 'r264');
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// Round 256's real machinery, sliced out of the commit that added it
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
const assertedText = sliceFn(R256_SRC, 'assertedEmptinessSites');

async function loadModule(name: string, body: string): Promise<Record<string, unknown>> {
  const file = path.join(WORK, name);
  fs.writeFileSync(file, body);
  return import(pathToFileURL(file).href) as Promise<Record<string, unknown>>;
}

const readerMod = await loadModule('r256-reader.mts',
  `type Scan = { code: string; specifiers: string[] };\n` +
  `${scanText}\n${emptyText}\n${spansText}\n${assertedText}\n` +
  `export { scan, emptinessSites, assertionArgumentSpans, assertedEmptinessSites };\n`);

const scanR256 = readerMod.scan as (s: string) => { code: string; specifiers: string[] };
const assertedSitesR256 = readerMod.assertedEmptinessSites as (s: string) => string[];
const spansR256 = readerMod.assertionArgumentSpans as (code: string) => string[];

check('A0', 'the slices reached the real declarations, not a truncated stub',
  scanText.length > 800 && emptyText.includes('--porcelain')
    && assertedText.includes('assertionArgumentSpans') && spansText.includes('depth'),
  `scan ${scanText.length} chars, emptinessSites ${emptyText.length} (carries the --porcelain ` +
    `regex), assertionArgumentSpans ${spansText.length} (carries the depth counter), ` +
    `assertedEmptinessSites ${assertedText.length}. Round 258 §A and Daedalus's Round 257 §5 both ` +
    `lost a run to an extractor that returned less than it claimed, so the slices are graded ` +
    `before anything is computed from them.`);

// ─────────────────────────────────────────────────────────────────────────────
// The widened detector — one variable changed, and it is the spelling
// ─────────────────────────────────────────────────────────────────────────────
//
// Seeding mirrors Round 256's: a binding whose initialiser mentions porcelain, a function whose
// body does, and a binding assigned from a call to one of those. Then the part Round 256 does not
// have: PROPAGATION through a derivation chain. `const dirty = porcelain.split('\n').filter(…)`
// makes `dirty` a porcelain-derived binding, and an assertion on ITS emptiness is the same defect
// with the comparison one hop downstream.
//
// The spellings are counted separately, not lumped, so the delta is decomposable by a reader and
// so arm B3 can mask exactly one of them.

const PORCELAIN = /status['"`]\s*,\s*['"`]--porcelain|status\s+--porcelain/;

type Spelling = 'eq' | 'len' | 'neg';
type Site = { name: string; spelling: Spelling };

/**
 * Bindings that carry porcelain output, directly or through a derivation chain.
 *
 * `propagate = false` reproduces Round 256's seeding exactly: a binding is only porcelain-bound if
 * the PORCELAIN STRING ITSELF appears in its initialiser. That switch exists because arm B3 went
 * red the first time it ran — see the comment there. It is the difference between two blindnesses
 * that were about to be reported as one.
 */
function porcelainNames(code: string, propagate = true): Set<string> {
  const names = new Set<string>();
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^\n;]*)/g)) {
    if (PORCELAIN.test(m[2])) names.add(m[1]);
  }
  for (const m of code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)[^{]*\{([\s\S]{0,400}?)\}/g)) {
    if (PORCELAIN.test(m[2])) names.add(m[1]);
  }
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*\(\s*\)/g)) {
    if (names.has(m[2])) names.add(m[1]);
  }
  // Propagation, to a fixed point: `const X = <chain over a known name>`. Multi-line initialisers
  // are the common shape (`porcelain\n  .split('\n')\n  .filter(…)`), so the initialiser is read to
  // the terminating `;` rather than to the end of the line.
  const DERIVE = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]{0,300}?);/g;
  for (let pass = 0; propagate && pass < 4; pass += 1) {
    const before = names.size;
    for (const m of code.matchAll(DERIVE)) {
      if (names.has(m[1])) continue;
      if (!/\.(?:split|filter|trim|map|match|replace|concat|slice)\s*\(/.test(m[2])) continue;
      for (const n of names) {
        if (new RegExp(`\\b${n}\\b`).test(m[2])) { names.add(m[1]); break; }
      }
    }
    if (names.size === before) break;
  }
  return names;
}

function sitePatterns(n: string): Array<{ spelling: Spelling; re: RegExp }> {
  const head = `\\b${n}\\b\\s*(?:\\(\\s*\\))?`;
  return [
    // Round 256's territory: compared directly against the empty string.
    { spelling: 'eq', re: new RegExp(`${head}\\s*(?:\\.trim\\(\\))?\\s*(?:===|!==)\\s*(['"\`])\\1`) },
    // The spelling it cannot see: emptiness moved onto `.length`.
    { spelling: 'len', re: new RegExp(`${head}\\s*(?:\\.trim\\(\\))?\\.length\\s*(?:===|!==|>|<)\\s*\\d`) },
    { spelling: 'len', re: new RegExp(`!\\s*${head}\\s*(?:\\.trim\\(\\))?\\.length\\b`) },
    // Bare truthiness — `!dirty` as a pass condition. Deliberately NOT matching `!==`, and not
    // matching `!x.length`, which the row above already owns.
    { spelling: 'neg', re: new RegExp(`!\\s*\\b${n}\\b\\s*(?![=.\\w])`) },
  ];
}

/**
 * Asserted emptiness sites in `src`, across all three spellings. Uses Round 256's OWN `scan` and
 * `assertionArgumentSpans`, so the only difference from `assertedEmptinessSites` is which
 * comparison shapes count.
 */
function widenedSites(src: string, allow: Spelling[] = ['eq', 'len', 'neg'], propagate = true): Site[] {
  const code = scanR256(src).code;
  if (!PORCELAIN.test(code)) return [];
  const spans = spansR256(code);
  const out: Site[] = [];
  for (const n of porcelainNames(code, propagate)) {
    for (const { spelling, re } of sitePatterns(n)) {
      if (!allow.includes(spelling)) continue;
      if (out.some((s) => s.name === n && s.spelling === spelling)) continue;
      if (spans.some((s) => re.test(s))) out.push({ name: n, spelling });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARM A — the widened detector, two-sided on minted source, BEFORE any figure
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm A: the widened detector, driven both ways on minted source ────────');

const M_EQ = `const before = execFileSync('git', ['status', '--porcelain', '--', 'packages/']);\n` +
  `check('Z', 'clean', before === '', before);\n`;
const M_LEN = `const porcelain = execFileSync('git', ['status', '--porcelain', '--', 'scripts/']);\n` +
  `const dirty = porcelain.split('\\n').filter((l) => l.trim());\n` +
  `check('Z', 'clean', dirty.length === 0, 'x');\n`;
const M_NEG = `const porcelain = execFileSync('git', ['status', '--porcelain', '--', 'scripts/']);\n` +
  `const dirty = porcelain.trim();\n` +
  `check('Z', 'clean', !dirty, 'x');\n`;
// Negatives. A before/after comparison is the REMEDY, not the defect; a commented-out shape is not
// code; and an unasserted diagnostic is Round 256's own hard-won distinction (`probe-round253`).
const M_BEFOREAFTER = `const a = execFileSync('git', ['status', '--porcelain', '--', 'packages/']);\n` +
  `const b = execFileSync('git', ['status', '--porcelain', '--', 'packages/']);\n` +
  `check('Z', 'unmoved', a === b, 'x');\n`;
const M_COMMENT = `// const porcelain = execFileSync('git', ['status','--porcelain']);\n` +
  `// const dirty = porcelain.split('\\n').filter(Boolean); dirty.length === 0\n` +
  `const x = 1;\n`;
const M_DIAG = `const porcelain = execFileSync('git', ['status','--porcelain','scripts/']);\n` +
  `const dirty = porcelain.split('\\n').filter((l) => l.trim());\n` +
  `console.log(dirty.length === 0 ? '  (empty)' : dirty.join(' | '));\n` +
  `check('Z', 'no .env leak', !/packages\\/server\\/\\.env/.test(porcelain), 'x');\n`;

const sp = (src: string) => widenedSites(src).map((s) => `${s.name}:${s.spelling}`).sort();

check('A1', 'POSITIVE — all three spellings of the identical assertion are seen',
  sp(M_EQ).length === 1 && sp(M_LEN).length === 1 && sp(M_NEG).length === 1,
  `Minted one per spelling: \`before === ''\` → ${JSON.stringify(sp(M_EQ))}; ` +
    `\`dirty.length === 0\` over a split/filter chain → ${JSON.stringify(sp(M_LEN))}; ` +
    `\`!dirty\` over a .trim() chain → ${JSON.stringify(sp(M_NEG))}. The chain cases require the ` +
    `propagation Round 256 does not have — the porcelain binding never meets the comparison.`);

check('A2', 'NEGATIVE — three ways to look like the defect without being it',
  sp(M_BEFOREAFTER).length === 0 && sp(M_COMMENT).length === 0 && sp(M_DIAG).length === 0,
  `A before/after comparison — which is the REMEDY — scores ${JSON.stringify(sp(M_BEFOREAFTER))}. ` +
    `The whole shape inside a comment scores ${JSON.stringify(sp(M_COMMENT))} (Round 256's \`scan\` ` +
    `is doing that, unchanged). An unasserted diagnostic that prints \`dirty.length === 0\` and ` +
    `asserts on something else scores ${JSON.stringify(sp(M_DIAG))} — the distinction Round 256's ` +
    `first pass got wrong on \`probe-round253\` and refined into \`assertedEmptinessSites\`. An ` +
    `arm that only fires in one direction has not been shown to measure anything.`);

check('A3', 'the two detectors agree exactly where they overlap, and differ only on spelling',
  assertedSitesR256(M_EQ).length === 1 && assertedSitesR256(M_LEN).length === 0
    && assertedSitesR256(M_NEG).length === 0,
  `On the same three minted positives, Round 256's own detector scores ` +
    `${assertedSitesR256(M_EQ).length} / ${assertedSitesR256(M_LEN).length} / ` +
    `${assertedSitesR256(M_NEG).length}. So it sees the \`eq\` spelling and neither of the other ` +
    `two, which is my Round 262 D2 restated with a second spelling added. Masking and span-finding ` +
    `are Round 256's own code running unmodified in BOTH instruments, so no delta below can come ` +
    `from either. Seeding is NOT held fixed — I widened it too, which I did not notice until B3 ` +
    `went red; B3a–B3c separate the two axes rather than letting one stand in for both.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM B — the census, over a population pinned to a named commit
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm B: the census over scripts/ at c4bd5307 ───────────────────────────');

/** Exactly the derivation installed in probe-round258 arm G4, verified against Round 256's own
 *  `walkScripts` by probe-round262 arm A1. Self is excluded in-walk, as Round 256 did. */
function derivePopulation(treeOutput: string, self: string): string[] {
  return treeOutput.split('\n').filter(Boolean).map((s) => s.replace(/^scripts\//, ''))
    .filter((r) => !r.split('/').some((seg) => seg.startsWith('.')))
    .filter((r) => /\.(mts|mjs|ts|js)$/.test(r))
    .filter((r) => r !== self);
}

const population = derivePopulation(
  git(['ls-tree', '-r', '--name-only', CENSUS_COMMIT, 'scripts/']), R256_SELF).sort();

const srcAt = new Map<string, string>();
for (const rel of population) srcAt.set(rel, git(['show', `${CENSUS_COMMIT}:scripts/${rel}`]));

const r256Hits = population.filter((rel) => assertedSitesR256(srcAt.get(rel)!).length > 0);
const widenedHits = population.filter((rel) => widenedSites(srcAt.get(rel)!).length > 0);
const missedFiles = widenedHits.filter((rel) => !r256Hits.includes(rel));
const r256Only = r256Hits.filter((rel) => !widenedHits.includes(rel));

check('B1', 'the widened detector is a STRICT SUPERSET of Round 256\'s across the population',
  r256Only.length === 0,
  `${population.length} files at ${CENSUS_COMMIT}. Files Round 256's detector flags that the ` +
    `widened one does not: ${JSON.stringify(r256Only)}. This has to be empty or the comparison ` +
    `below is not measuring spelling — it would mean my seeding diverged from the historical ` +
    `seeding, and the delta would be partly an artefact of my own reimplementation. It is the ` +
    `check that makes the delta interpretable, so it runs before the delta is quoted.`);

const totalR256 = population.reduce((a, rel) => a + assertedSitesR256(srcAt.get(rel)!).length, 0);
const totalWide = population.reduce((a, rel) => a + widenedSites(srcAt.get(rel)!).length, 0);
const bySpelling = { eq: 0, len: 0, neg: 0 } as Record<Spelling, number>;
for (const rel of population) for (const s of widenedSites(srcAt.get(rel)!)) bySpelling[s.spelling] += 1;

check('B2', 'the delta is non-empty — the published figure misses live instances',
  missedFiles.length > 0 && totalWide > totalR256,
  `Round 256's detector: ${r256Hits.length} files / ${totalR256} sites. Widened: ` +
    `${widenedHits.length} files / ${totalWide} sites ` +
    `(eq ${bySpelling.eq}, len ${bySpelling.len}, neg ${bySpelling.neg}). ` +
    `INVISIBLE TO ROUND 256 — ${missedFiles.length} file(s): ${JSON.stringify(missedFiles)}. ` +
    `Both hand-read before this figure was quoted anywhere, because Round 256's own first pass ` +
    `flagged two non-defects and the discipline since is that a census reports a list for a human ` +
    `to adjudicate. Both are real: each asserts emptiness over a window its seat does not own, ` +
    `with a frozen allowlist. B3a–B3c attribute the miss, which is NOT the single cause I expected.`);

// ── B3 went RED the first time it ran, and the red was right. ───────────────────────────────────
//
// I wrote one arm — "mask the length recogniser and the figure collapses onto Round 256's" —
// asserting the whole delta was a SPELLING delta. It came back 12 against 11. My widened detector
// finds one extra site with the length recogniser switched OFF, so something other than spelling
// was also contributing, and my single arm would have mis-attributed the entire finding.
//
// The cause is propagation. Round 256 seeds a name only when the PORCELAIN STRING ITSELF is in its
// initialiser; mine also follows `const derived = porcelain.split(…).filter(…)`. So the two
// detectors differ along TWO axes, not one, and the difference splits cleanly:
//
//   probe-round197 — `offenders === ''`, the `eq` spelling, on a binding two hops downstream of
//                    the porcelain call. Missed for REACH.
//   probe-round262 — `scriptsUntracked.length === 0`, on a binding one hop downstream. Missed for
//                    BOTH, and would still be missed by a reach-only widening.
//
// Three arms now, each isolating one axis, because "the delta is N" is worth nothing next to
// "the delta is N and here is which blindness produced each one".

const eqNoProp = population.reduce((a, rel) => a + widenedSites(srcAt.get(rel)!, ['eq'], false).length, 0);
const eqProp = population.reduce((a, rel) => a + widenedSites(srcAt.get(rel)!, ['eq'], true).length, 0);

check('B3a', 'IDENTITY — my detector with BOTH widenings off reproduces Round 256\'s figure exactly',
  eqNoProp === totalR256,
  `\`allow=['eq'], propagate=false\` over the identical population: ${eqNoProp} sites against ` +
    `Round 256's own ${totalR256}. This is the arm that makes the other two interpretable. If it ` +
    `were off by one, every number below would be partly an artefact of my reimplementation rather ` +
    `than a property of the subject — and I would not be able to tell which part.`);

check('B3b', 'AXIS 1, reach — propagation alone finds a site Round 256 cannot reach',
  eqProp > eqNoProp,
  `Same spelling (\`eq\`, Round 256's own), propagation on vs. off: ${eqProp} vs ${eqNoProp}. ` +
    `The +${eqProp - eqNoProp} is probe-round197's \`offenders === ''\`, where \`offenders\` is ` +
    `\`changed.split().filter().join()\` and \`changed\` holds the porcelain. Round 256 requires ` +
    `the porcelain string in the initialiser of the compared binding, so a derivation chain of any ` +
    `length hides the site without changing the assertion by one character.`);

check('B3c', 'AXIS 2, spelling — the length recogniser finds a further site on top of that',
  totalWide > eqProp && bySpelling.len > 0,
  `Propagation on, \`eq\` only vs. all three spellings: ${eqProp} vs ${totalWide} ` +
    `(+${totalWide - eqProp}, all of it \`len\`; \`neg\` scores ${bySpelling.neg} on this ` +
    `population). That +${totalWide - eqProp} is probe-round262's \`scriptsUntracked.length === 0\`, ` +
    `which needs BOTH widenings — reach to get to the binding and spelling to recognise the ` +
    `comparison. So the two axes are not alternatives and neither alone would have found it.`);

check('B4', 'the seed Daedalus named is IN the delta, confirmed by the instrument rather than assumed',
  missedFiles.some((rel) => rel.startsWith('probe-round262-')),
  `Round 263 §8 item 2 offered one confirmed instance to seed this census with — arm Z1 of my own ` +
    `probe-round262, at ${CENSUS_COMMIT} still carrying ` +
    `\`scriptsUntracked.length === 0\` over a \`.split().filter()\` chain. The delta contains ` +
    `${JSON.stringify(missedFiles.filter((r) => r.startsWith('probe-round262-')))}. Repaired on ` +
    `this fire's working tree, which is precisely why the population is pinned to a commit: a ` +
    `census that read the checkout would have lost its own seed to the repair it motivated.`);

meas('B5', 'what the published figure would have been',
  `Round 256 published 13 / 10 (files / asserted sites) over 137 files at ${R256_COMMIT}. Over ` +
    `${population.length} files at ${CENSUS_COMMIT} the same detector now reports ` +
    `${r256Hits.length} / ${totalR256} and the widened one ${widenedHits.length} / ${totalWide}. ` +
    `The two figures are not comparable as a trend — different population, different date, and ` +
    `several of the Round 256 instances have been repaired since. What is comparable is the pair ` +
    `measured here, same tree same day: the widened detector finds ${totalWide - totalR256} site(s) ` +
    `in ${missedFiles.length} file(s) that the published instrument is constitutionally unable to see.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM C — the bound. Three spellings the WIDENED detector still cannot see.
// ─────────────────────────────────────────────────────────────────────────────
//
// Round 256's rule — "a census of a defect has to detect the thing that makes it a defect, not the
// syntax it usually appears in" — is the rule its own detector broke, and widening the syntax does
// not repair the category error, it only moves the boundary. So the boundary is minted and driven
// rather than described, and the figure above is quoted as a lower bound because of this arm.

console.log('\n── arm C: what the WIDENED detector still cannot see ─────────────────────');

// C1 is the sharpest, and it is a direct consequence of the repair Daedalus shipped yesterday.
// `windowState()` lives in `scripts/lib/tree-fingerprint.mts` and returns porcelain. A probe that
// calls it and asserts emptiness has the defect and does not contain the string `--porcelain` at
// all — so BOTH detectors return before they start. Every such probe is not merely miscounted; it
// is outside the reachable set of a single-file syntactic census.
const M_CROSSMODULE = `import { windowState } from './lib/tree-fingerprint.mts';\n` +
  `const w = windowState(REPO, 'scripts/');\n` +
  `check('Z', 'clean', w === '', w);\n`;
check('C1', 'a porcelain call that moved into scripts/lib is invisible to BOTH detectors',
  assertedSitesR256(M_CROSSMODULE).length === 0 && widenedSites(M_CROSSMODULE).length === 0
    && !PORCELAIN.test(M_CROSSMODULE),
  `Minted: import \`windowState\`, assert its result is \`''\`. Round 256 scores ` +
    `${assertedSitesR256(M_CROSSMODULE).length}, widened scores ` +
    `${widenedSites(M_CROSSMODULE).length}, and the source does not contain the porcelain string ` +
    `at all, so both detectors exit at their first guard. This is the defect in full, one import ` +
    `away from the census. Round 263 §3 extracted the remedy because a copy could not propagate — ` +
    `correct, and the same extraction moves the DEFECT out of reach of the instrument that counts ` +
    `it. The lower bound above is bounded by this, not by the spellings in C2 and C3.`);

const M_INLINE = `check('Z', 'clean',\n` +
  `  execFileSync('git', ['status', '--porcelain', '--', 'scripts/'])\n` +
  `    .split('\\n').filter((l) => l.trim()).length === 0, 'x');\n`;
check('C2', 'a fully inline chain — no binding to propagate from — is invisible to both',
  assertedSitesR256(M_INLINE).length === 0 && widenedSites(M_INLINE).length === 0
    && PORCELAIN.test(M_INLINE),
  `The porcelain string IS present (both detectors get past their guard) but the chain never ` +
    `lands in a named binding, and both instruments are name-based: they find comparisons on ` +
    `NAMES. Round 256 scores ${assertedSitesR256(M_INLINE).length}, widened scores ` +
    `${widenedSites(M_INLINE).length}. The widening I added propagates along bindings, so it ` +
    `inherits this blindness exactly.`);

const M_THROW = `const porcelain = execFileSync('git', ['status', '--porcelain', '--', 'scripts/']);\n` +
  `const dirty = porcelain.split('\\n').filter((l) => l.trim());\n` +
  `if (dirty.length !== 0) throw new Error('tree dirty: ' + dirty.join(' | '));\n`;
check('C3', 'an assertion spelled as a THROW is invisible to both — the span-finder only knows four names',
  assertedSitesR256(M_THROW).length === 0 && widenedSites(M_THROW).length === 0
    && porcelainNames(scanR256(M_THROW).code).has('dirty'),
  `Round 256 scores ${assertedSitesR256(M_THROW).length}, widened scores ` +
    `${widenedSites(M_THROW).length} — and my propagation DID reach the binding ` +
    `(\`porcelainNames\` returns it), so the miss is entirely in \`assertionArgumentSpans\`, which ` +
    `matches \`check|assert|expect|ok\` and nothing else. A \`throw\` fails the run exactly as hard ` +
    `as a \`check\` does. I am reusing that function deliberately — one variable — and reporting ` +
    `what it costs rather than quietly fixing it inside an arm that is supposed to isolate spelling.`);

meas('C4', 'so the figure is a lower bound, and this is the shape of what is under it',
  `Three misses, each of a different kind: C1 the call moved to another MODULE (unreachable by ` +
    `any single-file reader); C2 the comparison has no NAME to hang on (unreachable by any ` +
    `name-based reader); C3 the assertion is not spelled as a CALL the span-finder knows. Only C3 ` +
    `is cheap to close. C1 is the one that matters: the fleet is mid-migration onto a shared lib ` +
    `this week, so the population of instances reachable by this method is going DOWN for a reason ` +
    `that has nothing to do with how many instances exist.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM Z — the window
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm Z: I left the tree as I found it ──────────────────────────────────');

const zAfter = fingerprint(REPO, 'scripts/');
const pkgAfter = fingerprint(REPO, 'packages/');
check('Z1', 'this run changed nothing under scripts/ or packages/ — bracketed, not asserted-empty',
  zBefore === zAfter && pkgBefore === pkgAfter,
  `Content fingerprints identical at open and close for both pathspecs. Every write went under ` +
    `gitignored .testdata/r264/. The spelling this probe is a census OF is the one it refuses to ` +
    `use on itself — an emptiness claim here would be red for any seat with work in flight and ` +
    `blind to a write into a file already being edited, which is the same window.`);

meas('Z2', 'the window I do not own, reported and never graded',
  zWindowAtOpen === ''
    ? `scripts/ was clean at open. A fact about whoever last committed, not about this run.`
    : `scripts/ held ${zWindowAtOpen.split('\n').length} dirty entries at open: ` +
      `${JSON.stringify(zWindowAtOpen.split('\n'))}. Z1 is green across all of them. Not asserted ` +
      `on, because this seat is not the only writer of that directory.`);

summariseAndExit({ probeName: SELF, results, skipped });
