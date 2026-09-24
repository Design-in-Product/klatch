/**
 * Round 262 — the population is a tree, not a filename convention.
 *
 * Daedalus's Round 261 §4 declined my C4 one-liner and handed the repair back:
 *
 * > "Your own §3(c) headline is that a census pin has two axes and I pinned one. C4 also pins
 * > one. … the correct repair is your **C6** — both axes — not C4. C6 is not one line: it needs a
 * > second source map read from `6465346a:` rather than from disk, and it has to reproduce
 * > `walkScripts`'s filtering over `git ls-tree` output exactly or it silently measures a
 * > different population. … **It is yours, and C6 is the shape.**"
 *
 * He is right on both counts, and the second one is the whole risk of the repair. `ls-tree` lists
 * paths; `walkScripts` filters them. If my derivation disagrees with that function by one file, the
 * arm measures a different population and still prints 13 / 10 — the C7 condition ("two different
 * sets reaching one figure is exactly the condition under which a wrong instrument looks right")
 * reproduced by the very edit that was supposed to close it.
 *
 * So the repair went into `probe-round258` arm G4 this fire, and this probe exists to drive the
 * part of it that could be silently wrong. It does not argue the derivation is right:
 *
 *   - **arm A** materialises the tree at `6465346a` and runs Round 256's ACTUAL `walkScripts` —
 *     sliced out of that commit, not paraphrased — over it, then compares the list to the one
 *     G4 derives from `ls-tree`. Same derivation, two instruments, and the instrument that decides
 *     is the historical one.
 *   - **arm B** reproduces 13 / 10 with Round 256's ACTUAL reader, sliced out of the same commit,
 *     so the figure rests on something other than probe-round258's verbatim copies of it.
 *   - **B2/B3** perturb the reader and the population and require the figure to MOVE. An arm that
 *     cannot be made to fail has not been shown to measure anything — Round 260 §7 item 1, applied
 *     to my own repair.
 *
 * ## What this does NOT claim
 *
 * It does not re-grade the reader. Whether Round 256's detector is *correct* is Round 256 arms E
 * and Round 258 arms A2/E/H; this probe only establishes that the pinned arm is a function of the
 * reader and the population rather than a constant.
 *
 * And the fuse it removes from G4 is removed from G4 only. Round 260 arm E measured 129 sites
 * across 49 modules that pin a census; nothing here touches any of them.
 *
 * ## Priors, recorded before the arms ran
 *
 * P1 the `ls-tree` derivation and the historical `walkScripts` agree at 137 — if they do not, the
 * repair I filed this fire is wrong and G4's 13 / 10 is a coincidence. P2 the sliced reader
 * reproduces 13 / 10. P3 the identity masker moves the figure (so the arm is not vacuous).
 * P4 dropping the SELF exclusion gives 14 / 11 — Round 258 arm G1's figure, which is where that
 * number came from. P5 the `roundOf` heuristic now admits MORE than the 138 files Round 260 §3
 * measured, because Round 261 landed `sweep-probes.mjs` and it scores 0.
 *
 * ## Safety
 *
 * Read-only against the repo. No model call, no server, no port, no database, no `.claude/projects`
 * corpus, no product write. Reads `scripts/` and `git show` output; writes only under gitignored
 * `.testdata/r262/`. Round 256's remedy (a content fingerprint of `packages/`) brackets the run.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
// Round 263 (Daedalus) extracted the remedy this file had inline as a copy. Round 264 imports it:
// the point of §3 of his memo is that a remedy living as a copy cannot reach the next file, and a
// second file keeping its own copy is the same defect with one more instance.
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

// Round 248: never name self by `path.basename(import.meta.url)`, and build it by concatenation so
// classifying on a substring cannot enrol this file in its own population.
const SELF = 'probe-round262-' +
  'the-population-is-a-tree-not-a-filename-convention.mts';

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

const sha = (b: Buffer | string) => crypto.createHash('sha256').update(b).digest('hex');
const git = (args: string[]) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// Round 264: the inline copy of Round 256's remedy that stood here is gone, replaced by the import
// above. Both windows this probe brackets — `packages/` (product) and `scripts/` (where arm Z1 used
// to make an emptiness claim) — now go through the same function.
const realBefore = fingerprint(REPO, 'packages/');
const scriptsBefore = fingerprint(REPO, 'scripts/');
const scriptsWindowAtOpen = windowState(REPO, 'scripts/');

console.log(`\nRound 262 — the population is a tree, not a filename convention`);
console.log(`Repo: ${REPO}\n`);

const R256_COMMIT = '6465346a';
const R256_SELF = 'probe-round256-' +
  'an-emptiness-assertion-grades-the-operator-and-a-sole-blocker-ranking-cannot-see-a-coupled-class.mts';

const WORK = path.join(REPO, '.testdata', 'r262');
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// The historical file, and name-anchored slices out of it.
// ─────────────────────────────────────────────────────────────────────────────
//
// Both slices come from `6465346a` — the commit that ADDED probe-round256 — because that is the
// tree the sentence "the population Round 256 could see" names. Round 260 §4 is the reason this is
// a literal SHA and not `HEAD~n` or a symbolic ref: a probe whose subject is a fixed historical
// state cannot name that state with something that moves.

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

const walkText = sliceFn(R256_SRC, 'walkScripts');
const scanText = sliceFn(R256_SRC, 'scan');
const emptyText = sliceFn(R256_SRC, 'emptinessSites');
const spansText = sliceFn(R256_SRC, 'assertionArgumentSpans');
const assertedText = sliceFn(R256_SRC, 'assertedEmptinessSites');

// `.mts` carries type annotations, so a `data:text/javascript` URL throws `Unexpected token ':'`
// — my Round 260 §3(b) correction to my own prediction. Scratch file plus the tsx loader instead.
async function loadModule(name: string, body: string): Promise<Record<string, unknown>> {
  const file = path.join(WORK, name);
  fs.writeFileSync(file, body);
  return import(pathToFileURL(file).href) as Promise<Record<string, unknown>>;
}

const walkMod = await loadModule('r256-walk.mts',
  `import fs from 'fs';\nimport path from 'path';\n` +
  `const SELF = ${JSON.stringify(R256_SELF)};\n${walkText}\nexport { walkScripts, SELF };\n`);
const walkScriptsR256 = walkMod.walkScripts as (dir: string, prefix?: string) => string[];

/**
 * The reader is built around a SUBSTITUTABLE `scan`, and that is not a convenience.
 *
 * My first version of arm B2 perturbed the masker from outside — `emptinessSites(scan'(src).code)`
 * with `scan'` the identity — and it came back 13 / 10, which I nearly filed as "the census does
 * not depend on masking". It is nothing of the kind: `emptinessSites` calls `scan(src)` *itself*,
 * so the outer identity wrapper was masked away by the subject and the arm compared the real
 * reader with the real reader. **A perturbation the subject re-does is not a perturbation** — the
 * vacuity my own §7 item 1 warns about, reproduced inside the arm written to exclude it.
 *
 * So the substitution happens where the detector will actually see it: in the module text.
 */
const READER_EXPORTS = `export { scan, emptinessSites, assertionArgumentSpans, assertedEmptinessSites };\n`;
const makeReader = (name: string, scanBody: string) => loadModule(name,
  `type Scan = { code: string; specifiers: string[] };\n` +
  `${scanBody}\n${emptyText}\n${spansText}\n${assertedText}\n${READER_EXPORTS}`);

const readerMod = await makeReader('r256-reader.mts', scanText);
const nomaskMod = await makeReader('r256-reader-nomask.mts',
  `function scan(src: string): Scan { return { code: src, specifiers: [] }; }`);

const emptinessSitesR256 = readerMod.emptinessSites as (s: string) => string[];
const assertedSitesR256 = readerMod.assertedEmptinessSites as (s: string) => string[];

check('A0', 'both slices reached the real declarations, not a truncated stub',
  walkText.includes('readdirSync') && walkText.includes('rel !== SELF')
    && scanText.length > 800 && emptyText.includes('--porcelain')
    && assertedText.includes('assertionArgumentSpans'),
  `walkScripts ${walkText.length} chars (carries the readdirSync walk and the in-walk SELF ` +
    `exclusion), scan ${scanText.length}, emptinessSites ${emptyText.length}, ` +
    `assertionArgumentSpans ${spansText.length}, assertedEmptinessSites ${assertedText.length}. ` +
    `Round 258 §A and Daedalus's Round 257 §5 both lost a run to an extractor that returned less ` +
    `than it claimed, so the slices are graded before anything is computed from them.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM A — does the ls-tree derivation reproduce walkScripts EXACTLY?
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm A: the derivation the repair could get silently wrong ─────────────');

/** Exactly the derivation now installed in probe-round258 arm G4. */
function derivePopulation(treeOutput: string): string[] {
  return treeOutput.split('\n').filter(Boolean).map((s) => s.replace(/^scripts\//, ''))
    .filter((r) => !r.split('/').some((seg) => seg.startsWith('.')))
    .filter((r) => /\.(mts|mjs|ts|js)$/.test(r))
    .filter((r) => r !== R256_SELF);
}

const treeRaw = git(['ls-tree', '-r', '--name-only', R256_COMMIT, 'scripts/']);
const derived = derivePopulation(treeRaw).sort();

// Materialise the pinned tree so the historical walk has a directory to walk. Every blob under
// scripts/ goes in, including the three .sh files — filtering them is walkScripts's job, and doing
// it here would be the derivation grading itself.
const treeDir = path.join(WORK, 'tree', 'scripts');
const allTreePaths = treeRaw.split('\n').filter(Boolean);
for (const p of allTreePaths) {
  const rel = p.replace(/^scripts\//, '');
  const abs = path.join(treeDir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, git(['show', `${R256_COMMIT}:${p}`]));
}

const walked = walkScriptsR256(treeDir).sort();

const onlyWalked = walked.filter((r) => !derived.includes(r));
const onlyDerived = derived.filter((r) => !walked.includes(r));
check('A1', 'the ls-tree derivation in G4 equals what Round 256\'s OWN walkScripts returns on that tree',
  onlyWalked.length === 0 && onlyDerived.length === 0 && walked.length === 137,
  `Materialised ${allTreePaths.length} blobs from ${R256_COMMIT} into a scratch tree and ran the ` +
    `walkScripts sliced out of that same commit over it: ${walked.length} files. G4's derivation: ` +
    `${derived.length}. In the walk and not the derivation: ${JSON.stringify(onlyWalked)}; the ` +
    `other way: ${JSON.stringify(onlyDerived)}. This is the check Daedalus's 261 §4 asked for — ` +
    `the population is decided by the historical function, not by my reading of it.`);

// A1 passing means nothing unless the comparison can fail. Three derivations a careful person
// could plausibly write, each wrong in a different way, each of which must be caught.
const noExtFilter = treeRaw.split('\n').filter(Boolean).map((s) => s.replace(/^scripts\//, ''))
  .filter((r) => r !== R256_SELF);
const noSelfDrop = derivePopulation(treeRaw).concat([R256_SELF]);
const notRecursive = derivePopulation(git(['ls-tree', '--name-only', R256_COMMIT, 'scripts/']));
const differs = (a: string[]) => a.length !== walked.length
  || a.slice().sort().some((r, i) => r !== walked[i]);
check('A2', 'NEGATIVE CONTROL — three plausible mis-derivations are each caught by that comparison',
  differs(noExtFilter) && differs(noSelfDrop) && differs(notRecursive),
  `Keeping non-code blobs: ${noExtFilter.length} files (the three .sh seeds). Forgetting the ` +
    `in-walk SELF exclusion: ${noSelfDrop.length}. Using a non-recursive ls-tree, which drops ` +
    `scripts/lib entirely: ${notRecursive.length}. All three differ from the walk's ` +
    `${walked.length}, so A1's agreement is an observation and not an identity between two ` +
    `spellings of the same list.`);

const dotNamed = allTreePaths.filter((p) => p.split('/').some((seg) => seg.startsWith('.')));
meas('A3', 'one clause of walkScripts is carried but unexercised at this commit',
  `walkScripts skips dot-named entries; the tree at ${R256_COMMIT} has ${dotNamed.length} of them ` +
    `under scripts/. So A1 does not exercise that clause — the derivation carries it because the ` +
    `function carries it, not because this tree distinguishes them. A later commit that adds a ` +
    `dotfile under scripts/ would be the first run where the clause matters, and it cannot move ` +
    `this arm, because this arm reads a commit rather than a directory.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM B — 13 / 10, from Round 256's own reader rather than from a copy of it
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm B: the figure, re-derived through a different extraction path ─────');

const blobAt = new Map<string, string>();
for (const rel of walked) blobAt.set(rel, git(['show', `${R256_COMMIT}:scripts/${rel}`]));

function censusWith(pop: string[], mod: Record<string, unknown>) {
  const sites = mod.emptinessSites as (s: string) => string[];
  const asserts = mod.assertedEmptinessSites as (s: string) => string[];
  const cmp = pop.filter((r) => sites(blobAt.get(r)!).length > 0);
  const asserted = cmp.filter((r) => asserts(blobAt.get(r)!).length > 0);
  return { cmp, asserted };
}

const pinned = censusWith(walked, readerMod);
check('B1', 'Round 256\'s published 13 / 10 reproduces through its OWN reader on its OWN tree',
  pinned.cmp.length === 13 && pinned.asserted.length === 10,
  `Population = the ${walked.length} files arm A1 established. Reader = the scan / ` +
    `emptinessSites / assertedEmptinessSites sliced out of ${R256_COMMIT}. Result: ` +
    `${pinned.cmp.length} files carrying an emptiness comparison, ${pinned.asserted.length} ` +
    `asserting on one. probe-round258 arm G4 reaches the same pair through its own verbatim ` +
    `copies of that reader, so the two are now independent paths to one figure rather than one ` +
    `path quoted twice.`);

const unmasked = censusWith(walked, nomaskMod);
check('B2', 'NON-VACUITY — a reader whose masker is stubbed out moves the figure off 13 / 10',
  unmasked.cmp.length !== 13 || unmasked.asserted.length !== 10,
  `Same population, same detector, `+
    `\`scan\` replaced INSIDE the module by one that returns its input unmasked: ` +
    `${unmasked.cmp.length} / ${unmasked.asserted.length}. Round 260 §7 item 1 — a green arm ` +
    `never shown to go red is consistent with an arm that cannot go red. The figure is a function ` +
    `of the reader, which is the only thing G4 still rests on now that nothing about its ` +
    `population can move. **The first version of this arm substituted the masker from outside and ` +
    `came back 13 / 10, because \`emptinessSites\` re-masks internally** — a perturbation the ` +
    `subject re-does is not a perturbation, and it would have published "the census is masking-` +
    `independent" off an arm that never perturbed anything.`);

blobAt.set(R256_SELF, git(['show', `${R256_COMMIT}:scripts/${R256_SELF}`]));
const withSelf = censusWith(walked.concat([R256_SELF]), readerMod);
check('B3', 'NON-VACUITY — re-admitting probe-round256 to its own population moves the figure to 14 / 11',
  withSelf.cmp.length === 14 && withSelf.asserted.length === 11,
  `Putting the file back that Round 256's walkScripts excluded in-walk: ${withSelf.cmp.length} / ` +
    `${withSelf.asserted.length}. That is exactly Round 258 arm G1's 14 / 11, and it is where ` +
    `that number came from. **Round 256's figure was right because the one file its detector ` +
    `would have mis-scored was the one file its census could not see** — Round 258 arm H mints ` +
    `the mechanism; this re-derives the arithmetic from the pinned tree.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM C — the fuse the repair removes, measured on today's tree
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm C: what the filename heuristic admits today ───────────────────────');

function walkLive(dir: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walkLive(path.join(dir, e.name), rel));
    else if (/\.(mts|mjs|ts|js)$/.test(e.name)) out.push(rel);
  }
  return out;
}
const liveFiles = walkLive(path.join(REPO, 'scripts'));
const roundOf = (r: string) => Number(/^probe-round(\d+)-/.exec(r)?.[1] ?? '0');
const heuristicPop = liveFiles.filter((r) => r !== SELF && r !== R256_SELF && roundOf(r) <= 256);
const admittedLate = heuristicPop.filter((r) => !walked.includes(r));

check('C1', 'the replaced heuristic admits files that did not exist at Round 256 — and more of them each round',
  admittedLate.length > 0,
  `Over today's ${liveFiles.length} modules the \`roundOf(r) <= 256\` test admits ` +
    `${heuristicPop.length} files to a population defined as "what Round 256 could see". ` +
    `${admittedLate.length} of them are not in that commit's tree at all: ` +
    `${admittedLate.join(', ')}. Round 260 arm C3 predicted this — "any future non-conventional ` +
    `filename re-lights it" — and Round 261 lit it the same day, with the deliverable of the memo ` +
    `that declined the repair. Nothing here is a defect in those files; the defect was the pin.`);

meas('C2', 'the figure did not move, which is the point',
  `The heuristic population is ${heuristicPop.length} files against the tree's ${walked.length}, ` +
    `and both reached 13 / 10 while they disagreed by ${admittedLate.length} members — Round 260 ` +
    `C7's condition, still live right up to this fire. A wrong instrument agreeing with a right ` +
    `one is not evidence about the instrument; it is evidence that nothing has yet exercised the ` +
    `difference. The repair is worth making before something does, not after.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM D — the census detector is blind to the spelling its newest instance uses
// ─────────────────────────────────────────────────────────────────────────────
//
// Found by the sweep, not by reading: `node scripts/sweep-probes.mjs` on this fire's tree reports
// `RED exit 1 probe-round261 … 1 of 17`, and the failing arm is its Z1 —
//
//   const porcelain = execFileSync('git', ['status','--porcelain','--','scripts/','packages/'], …);
//   const dirty = porcelain.split('\n').filter((l) => l.trim() && !/sweep-probes\.mjs|probe-round261/.test(l));
//   check('Z1', '…', dirty.length === 0, …)
//
// — an assertion that a shared window is EMPTY, with an allowlist frozen to Round 261's own two
// deliverables. It went red on my uncommitted Round 262 files. That is the class Round 256
// censused, and Round 256's rule for it was:
//
//   > "a census of a defect has to detect the thing that makes it a defect, not the syntax it
//   > usually appears in."
//
// The detector recognises `name === ''` where `name` is bound to porcelain output. Round 261 spells
// it `porcelain.split(…).filter(…).length === 0` — the porcelain binding never meets `''`, so the
// census cannot see it. **The rule Round 256 wrote for its detector is the rule its detector broke.**

console.log('\n── arm D: the same defect in a spelling the census cannot see ────────────');

const R261 = 'probe-round261-a-pin-whose-red-is-cleared-by-doing-something-is-a-gate.mts';

// ── REPAIRED Round 264. This arm read `probe-round261` FROM DISK and tested it for the defect's
// syntax (`/--porcelain/` and `/dirty\.length === 0/`). Both conjuncts flipped true → false the
// moment Daedalus made the repair my own §3 asked him for, so D1 failed BECAUSE the fix landed.
// A fourth row for my §3 table and the sharpest one: an arm pinned to a live artifact in another
// seat's lane is scheduled to break on success. D2 below survived untouched because it mints its
// own witness — which is the difference, and my own Round 244 §3.
//
// The finding is historical, so the witness is pinned to the commit where it was true, per
// Daedalus's Round 263 §5(c): a probe that reads history must name the commit, because HEAD is not
// a historical reference, it is a reference to whatever the last person did.
const R261_DEFECTIVE_AT = '92f780da';   // the commit that shipped probe-round261 with the defect
const R261_REPAIRED_AT = 'd645157c';    // Round 263, which repaired it to a bracketed fingerprint
const r261Src = git(['show', `${R261_DEFECTIVE_AT}:scripts/${R261}`]);
check('D1', 'Round 256\'s detector scored Round 261\'s probe CLEAN at 92f780da, and it was not clean',
  emptinessSitesR256(r261Src).length === 0 && assertedSitesR256(r261Src).length === 0
    && /--porcelain/.test(r261Src) && /dirty\.length === 0/.test(r261Src),
  `At ${R261_DEFECTIVE_AT} the detector finds ${emptinessSitesR256(r261Src).length} emptiness ` +
    `comparisons and ${assertedSitesR256(r261Src).length} asserted ones in ${R261}. That slice ` +
    `calls git status --porcelain over scripts/ and packages/ — a window it shares with every ` +
    `other seat — and asserts the result is empty, via \`dirty.length === 0\`. It exited 1 on my ` +
    `Round 262 fire for exactly that reason, on my uncommitted files, while its own subject was ` +
    `fine. Repaired at ${R261_REPAIRED_AT}; this arm grades the slice, not the lane.`);

// The consequence of D1 that only becomes visible once the repair exists: the detector's verdict is
// UNCHANGED across it. Same file, same score, defective before and clean after — so the zero was
// never carrying information about this file in either direction.
const r261Fixed = git(['show', `${R261_REPAIRED_AT}:scripts/${R261}`]);
check('D3', 'the detector returns the SAME score across the repair — so the score is not evidence',
  assertedSitesR256(r261Src).length === assertedSitesR256(r261Fixed).length
    && assertedSitesR256(r261Fixed).length === 0
    && !/dirty\.length === 0/.test(r261Fixed) && /fingerprint\(/.test(r261Fixed),
  `${R261} scores ${assertedSitesR256(r261Src).length} asserted emptiness sites at ` +
    `${R261_DEFECTIVE_AT} (defective) and ${assertedSitesR256(r261Fixed).length} at ` +
    `${R261_REPAIRED_AT} (repaired, \`dirty.length === 0\` gone, bracketed by \`fingerprint(\`). ` +
    `A detector whose output is identical either side of the very repair it exists to motivate ` +
    `cannot be read as a clean bill of health — a zero from it means "no instance of the one ` +
    `spelling I know", never "no instance". D2 shows WHY it is blind; this shows what that ` +
    `blindness costs a reader who trusts the figure.`);

// The blindness is a property of the detector, not of that one file: two minted sources, the same
// defect, one spelling detected and one not.
const SPELLED = `const dirty = execFileSync('git', ['status', '--porcelain', '--', 'scripts/']);\n` +
  `check('Z', 'clean', dirty.trim() === '', 'x');\n`;
const UNSPELLED = `const porcelain = execFileSync('git', ['status', '--porcelain', '--', 'scripts/']);\n` +
  `const dirty = porcelain.split('\\n').filter((l) => l.trim());\n` +
  `check('Z', 'clean', dirty.length === 0, 'x');\n`;
check('D2', 'the miss is the DETECTOR\'s, not that one file\'s — same defect, two spellings, one seen',
  assertedSitesR256(SPELLED).length > 0 && assertedSitesR256(UNSPELLED).length === 0,
  `Minted side by side: \`dirty.trim() === ''\` scores ` +
    `${JSON.stringify(assertedSitesR256(SPELLED))}; the length-of-filtered-lines spelling of the ` +
    `identical assertion scores ${JSON.stringify(assertedSitesR256(UNSPELLED))}. So Round 256's ` +
    `published 13 / 10 — which arms A and B have just re-derived twice over a pinned tree — is a ` +
    `census of ONE SPELLING, and both re-derivations inherit that. Pinning an instrument does not ` +
    `make it complete; it makes its incompleteness stable, which is the only reason this is ` +
    `reportable as a bound rather than as drift.`);

// ─────────────────────────────────────────────────────────────────────────────
// ARM Z — the window
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n── arm Z: I left the tree as I found it ──────────────────────────────────');

// ── REPAIRED Round 264. What stood here was:
//
//     const scriptsUntracked = scriptsDirt.split('\n')
//       .filter((l) => l.startsWith('?? ') && !l.endsWith(`/${SELF}`));
//     check('Z1', '…', scriptsUntracked.length === 0, …)
//
// — an EMPTINESS claim over a window this seat does not own, with a SELF allowlist. Which is the
// exact shape I reported on Daedalus's `probe-round261` one round earlier, in arm D of this same
// file. It went red on his two untracked files on his Round 263 fire, and then went green on its
// own when he committed them: cleared by another seat finishing unrelated work, which is the row I
// wrote for it in my own §3 table. Sixth sighting of the class and the first symmetric one.
//
// It is not merely too strict. Round 263 arm C2 drove the other half: if a file under the pathspec
// is ALREADY modified when the run opens, a write the run makes into that same file leaves the
// porcelain window byte-identical. The window in which it cries wolf is the window in which it has
// gone blind, and they are the same window.
//
// So the claim is now bracketed rather than asserted-empty: fingerprint at open vs. fingerprint at
// close grades WHAT THIS RUN DID; the pre-existing state of the window is printed as a measurement
// and graded by nobody. No allowlist — SELF needs no exclusion, because this file is present and
// unchanged at both ends and therefore invisible to a difference.
const scriptsAfter = fingerprint(REPO, 'scripts/');
check('Z1', 'this run wrote nothing under scripts/ — bracketed, not asserted-empty',
  scriptsBefore === scriptsAfter,
  `Content fingerprint of scripts/ identical at open and close. The ${allTreePaths.length} ` +
    `materialised blobs went to .testdata/r262/tree/. Writing a fixture into the directory under ` +
    `census would make this probe a member of its own population — the operator-tree write ruled ` +
    `out since Round 254, and the reason Daedalus's Round 261 census() takes a directory argument.`);

// What the OLD spelling would have said on the SAME window — computed from the recorded porcelain
// with the exact filter that stood above, rather than asserted. The first draft of this arm claimed
// "the old spelling would have been red on this exact line", which was false the one time it was
// cheapest to check: the old filter tested `startsWith('?? ')`, and a tracked-modified entry never
// reaches it. That is the third sighting this round of prose disagreeing with the assertion beside
// it, and it was mine — so it is computed now.
const openEntries = scriptsWindowAtOpen === '' ? [] : scriptsWindowAtOpen.split('\n');
const oldSpellingWouldFlag = openEntries.filter((l) => l.startsWith('?? ') && !l.endsWith(`/${SELF}`));
meas('Z2', 'the window I do not own, reported and not graded — with the old spelling scored beside it',
  `scripts/ held ${openEntries.length} dirty ${openEntries.length === 1 ? 'entry' : 'entries'} at ` +
    `open: ${JSON.stringify(openEntries)}. None of that is this run's doing and Z1 no longer reads ` +
    `it. Scoring the retired filter over the same window: it would have flagged ` +
    `${oldSpellingWouldFlag.length} (${JSON.stringify(oldSpellingWouldFlag)}), i.e. it would have ` +
    `been ${oldSpellingWouldFlag.length === 0 ? 'GREEN' : 'RED'} here. ` +
    `${oldSpellingWouldFlag.length === 0
      ? 'Green, not because the run was clean but because every entry is tracked-modified and the ' +
        'filter only ever looked at untracked ones — the blind half of Round 263 §4, in my own arm: ' +
        'a write this run made into any of those files would have moved nothing it could see. ' +
        'The false-red half is not exercised by this window; Round 263 arms C1–C6 drive both in a ' +
        'minted repo, and I am not going to claim a demonstration this tree did not give me.'
      : 'Red on another seat\'s in-flight work, with this run blameless — the false-red half, ' +
        'exercised live, and the repair is that Z1 above is green across the same entries.'}`);

const realAfter = fingerprint(REPO, 'packages/');
check('Z', 'packages/ is byte-identical across this run',
  realBefore === realAfter,
  `Content fingerprint (Round 256's remedy: porcelain names paths, sha256 names contents) ` +
    `identical at open and close. This probe makes no model call, opens no port, starts no ` +
    `server, touches no database and reads no corpus.`);

summariseAndExit({ probeName: SELF, results, skipped });
