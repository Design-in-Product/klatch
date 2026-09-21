/**
 * Round 244 — the sweep that finds stale probes does not walk the directory the
 * shared probe code now lives in, and its own two-sided control went red to say so.
 *
 * ── How this round opened ────────────────────────────────────────────────────
 *
 * Not from a hunch. Re-driving Round 240's staleness sweep at the top of this
 * fire — because its population figure was four days and many commits old and I
 * would not quote a stale number about stale probes — returned **exit 1**, with
 * one red arm:
 *
 *   [I] FAIL  corpus-pin classifier separates found-ids from minted-ids
 *         probe-round179 … classified a corpus reader: false (want false);
 *         probe-import-entity-binding … classified a corpus reader: false (want TRUE).
 *
 * The positive half of a two-sided control stopped holding. Round 240's own
 * closing note says the right response to a world-arm reading CHANGED is to
 * revisit the subject, not repair the probe. So: the subject.
 *
 * ── What actually happened, measured not inferred ────────────────────────────
 *
 * `probe-import-entity-binding.mts` names `~/.claude/projects` three times, and
 * after `stripComments` it names it **zero** times: all three are in prose now.
 * Its corpus access moved, in Daedalus's Round 241 commit `2920d6bc` ("the
 * import acceptance test now resolves its cast instead of naming it"), into
 * `scripts/lib/probe-corpus-sessions.mts`, which it imports at line 99.
 *
 * And Round 240's sweep enumerates `scripts/` with a **one-level** `readdirSync`
 * filtered to `.mts|.mjs|.ts`. `scripts/lib/` is a directory: it fails the
 * extension filter and is never descended into. So the sweep's denominator
 * excludes every shared module, and its arm A — *"110 files on disk = 110 with a
 * commit"* — reports completeness **of the level it walks**, which is the kind of
 * true sentence that stops a reader from asking the next question.
 *
 * ── Why this one is mine to eat ──────────────────────────────────────────────
 *
 * I wrote arm A. I wrote its "readdirSync, not a glob" comment, in Round 240.
 * One round later, in Round 242, my census arm went red and found **124 subagent
 * transcripts** that a one-level walk of the Claude Code corpus does not see —
 * and I wrote that finding up as a discovery about the corpus. It is not. It is
 * a shape: *`readdirSync` at one level answers "everything here", and the
 * denominator you wanted was "everything under here".* I had the finding in hand
 * and did not carry it back to my own instrument, where the identical defect had
 * been sitting since the round before.
 *
 *   **Rule (fifth iteration of the denominator rule): replacing a glob with a
 *   directory read fixes WHICH entries are reported, not HOW DEEP the walk goes.
 *   A control that asserts "N on disk = N enumerated" is satisfied by any
 *   self-consistent horizon, including one that stops a directory short.**
 *
 * ── What this probe asks ─────────────────────────────────────────────────────
 *
 *   A  one-level vs recursive enumeration of scripts/ — is there a horizon, how wide
 *   B  does following imports restore arm I's positive fixture (the mechanism)
 *   C  the corpus-reader classification re-derived over the full denominator
 *   D  the pin inventory over the full denominator — is a live pin hiding in lib/
 *   E  the assigned unit: the stale-in-code population, graded by whether the
 *      product paths each probe names still EXIST on disk
 *   F  two-sided control on E, on minted sentinel paths
 *   G  the shared modules themselves put through the drift question for the first time
 *
 * It does NOT grade drift and does NOT claim a stale probe is broken. Same
 * discipline as Round 240: drift is a measurement, death needs a drive.
 *
 * Usage:  npx tsx scripts/probe-round244-*.mts [--verbose]
 * Writes nothing. Reads git and the working tree only. Zero model calls.
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

const results: ProbeVerdict[] = [];
const measurements: string[] = [];

function check(arm: string, what: string, pass: boolean, detail: string) {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'PASS' : 'FAIL'}  ${what}\n        ${detail}`);
}
function meas(arm: string, what: string, detail: string) {
  measurements.push(`${arm}: ${what}`);
  console.log(`  [${arm}] MEAS  ${what}\n        ${detail}`);
}

const git = (args: string[]) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const SCRIPT_EXT = /\.(mts|mjs|ts)$/;

/**
 * Strips `//` line comments and block comments. Same naive stripper Round 240
 * used, reproduced rather than imported so that a change to one does not silently
 * move the other's numbers — the two rounds' figures are meant to be comparable.
 * Arm F's sentinels control it.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

// ── Enumeration: the thing this round is about ───────────────────────────────

function walkOneLevel(dir: string): string[] {
  return fs
    .readdirSync(path.join(REPO, dir))
    .filter((f) => SCRIPT_EXT.test(f) && !f.startsWith('.'))
    .map((f) => `${dir}/${f}`)
    .sort();
}

function walkRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(path.join(REPO, dir), { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...walkRecursive(rel));
    else if (SCRIPT_EXT.test(e.name)) out.push(rel);
  }
  return out.sort();
}

const oneLevel = walkOneLevel('scripts');
const recursive = walkRecursive('scripts');
const belowHorizon = recursive.filter((f) => !oneLevel.includes(f));

console.log(`\nRound 244 — the staleness sweep's horizon`);
console.log(`repo: ${REPO}`);
console.log(`HEAD: ${git(['rev-parse', '--short', 'HEAD']).trim()}  ${git(['log', '-1', '--format=%ci']).trim()}`);
console.log(`scripts/: ${oneLevel.length} at one level, ${recursive.length} recursive\n`);

console.log('── A/B: the horizon and the mechanism ───────────────────────────\n');

// Arm A. Two-sided: recursive must strictly exceed one-level (there IS a horizon),
// AND a file known to sit below it must be absent from the one-level walk and
// present in the recursive one. Asserting only "recursive >= one-level" would be
// satisfied by two identical walks, which is the reading that hides the defect.
const knownBelow = 'scripts/lib/probe-corpus-sessions.mts';
check('A', 'the one-level walk has a horizon, and a known below-horizon module is on the far side of it',
  belowHorizon.length > 0 &&
    !oneLevel.includes(knownBelow) &&
    recursive.includes(knownBelow) &&
    fs.existsSync(path.join(REPO, knownBelow)),
  `one-level ${oneLevel.length}, recursive ${recursive.length}, below horizon ${belowHorizon.length}. ` +
    `${knownBelow} on disk: ${fs.existsSync(path.join(REPO, knownBelow))}; ` +
    `in one-level walk: ${oneLevel.includes(knownBelow)} (want false); ` +
    `in recursive walk: ${recursive.includes(knownBelow)} (want true). ` +
    `Round 240's sweep used the one-level walk and its arm A called it complete.`);

meas('A2', 'what lives below the horizon',
  belowHorizon.length === 0 ? 'nothing' : belowHorizon.map((f) => f.replace('scripts/', '')).join(', '));

// Arm B — the mechanism behind Round 240's red arm I. Resolve each top-level
// probe's relative imports and ask whether corpus context is reachable
// transitively. Two-sided: the negative fixture must NOT be credited.
const CORPUS_CTX_RE = /\.claude['"\s,)/\\]|['"`]-Users-[A-Za-z0-9-]+['"`]|claude['"],\s*['"]projects/;
const IMPORT_RE = /from\s+['"](\.[^'"]+)['"]/g;

const srcCache = new Map<string, string>();
function read(rel: string): string {
  if (!srcCache.has(rel)) srcCache.set(rel, fs.readFileSync(path.join(REPO, rel), 'utf8'));
  return srcCache.get(rel)!;
}

/** Relative imports of `rel`, resolved to repo-relative paths that exist. */
function importsOf(rel: string): string[] {
  const code = stripComments(read(rel));
  const dir = path.dirname(rel);
  const out: string[] = [];
  for (const m of code.matchAll(IMPORT_RE)) {
    const cand = path.normalize(path.join(dir, m[1]));
    for (const p of [cand, `${cand}.mts`, `${cand}.mjs`, `${cand}.ts`]) {
      if (SCRIPT_EXT.test(p) && fs.existsSync(path.join(REPO, p))) { out.push(p); break; }
    }
  }
  return [...new Set(out)];
}

/** Does `rel` reach corpus context, directly or through its import graph? */
function reachesCorpus(rel: string, seen = new Set<string>()): { direct: boolean; via: string | null } {
  if (seen.has(rel)) return { direct: false, via: null };
  seen.add(rel);
  if (CORPUS_CTX_RE.test(stripComments(read(rel)))) return { direct: seen.size === 1, via: seen.size === 1 ? null : rel };
  for (const dep of importsOf(rel)) {
    const r = reachesCorpus(dep, seen);
    if (r.direct || r.via) return { direct: false, via: r.via ?? dep };
  }
  return { direct: false, via: null };
}

const entityBinding = 'scripts/probe-import-entity-binding.mts';
const round179 = 'scripts/probe-round179-backfill-flag-spellings-and-undo-errors.mts';
const ebDirect = CORPUS_CTX_RE.test(stripComments(read(entityBinding)));
const ebReach = reachesCorpus(entityBinding);
const r179Reach = reachesCorpus(round179);

check('B', "following imports restores arm I's positive fixture, and does not falsely credit its negative one",
  !ebDirect && ebReach.via !== null && !r179Reach.direct && r179Reach.via === null,
  `probe-import-entity-binding: corpus context in its own code = ${ebDirect} (want false — this is why ` +
    `Round 240 arm I went red); reachable through imports = ${ebReach.via ?? 'no'} (want a module). ` +
    `probe-round179 (mints its fixture ids, reads no corpus): direct ${r179Reach.direct}, via ` +
    `${r179Reach.via ?? 'none'} (want false/none — a graph walk that credits everything proves nothing).`);

console.log('\n── C/D: the classification and the pin inventory, re-derived ────\n');

// Arm C — corpus readers over the full denominator, counted both ways so the
// delta attributable to the horizon is visible rather than folded into a total.
const readersOneLevelDirect = oneLevel.filter((f) => CORPUS_CTX_RE.test(stripComments(read(f))));
const readersRecursiveDirect = recursive.filter((f) => CORPUS_CTX_RE.test(stripComments(read(f))));
const readersTransitive = recursive.filter((f) => {
  const r = reachesCorpus(f);
  return CORPUS_CTX_RE.test(stripComments(read(f))) || r.via !== null;
});

meas('C', 'corpus readers, three denominators',
  `direct/one-level ${readersOneLevelDirect.length}/${oneLevel.length} (Round 240's number, its arm I said 22/110); ` +
    `direct/recursive ${readersRecursiveDirect.length}/${recursive.length}; ` +
    `transitive/recursive ${readersTransitive.length}/${recursive.length}. ` +
    `The third is the population a corpus-pin sweep actually has to cover.`);

// Arm D — the question that matters: did the horizon hide a live pin? Answer it
// as a measurement either way. A negative here is a real finding and is reported
// as a negative, not as vindication of the old arm.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const isSynthetic = (u: string) => /^(0{8}|a{8}|b{8}|c{8}|d{8}|e{8}|f{8}|1{8}|deadbeef)/.test(u);

const CORPUS = path.join(os.homedir(), '.claude', 'projects');
const corpusIds = new Set<string>();
let corpusReadable = true;
try {
  for (const d of fs.readdirSync(CORPUS)) {
    const dp = path.join(CORPUS, d);
    if (!fs.statSync(dp).isDirectory()) continue;
    for (const fn of fs.readdirSync(dp)) if (fn.endsWith('.jsonl')) corpusIds.add(fn.replace(/\.jsonl$/, ''));
  }
} catch { corpusReadable = false; }

type Pin = { file: string; uuid: string; present: boolean };
const pinsBelow: Pin[] = [];
const pinsAll: Pin[] = [];
for (const f of readersTransitive) {
  const code = stripComments(read(f));
  for (const u of new Set(code.match(UUID_RE) ?? [])) {
    if (isSynthetic(u)) continue;
    const pin = { file: f, uuid: u, present: corpusIds.has(u) };
    pinsAll.push(pin);
    if (belowHorizon.includes(f)) pinsBelow.push(pin);
  }
}

meas('D', 'live-corpus UUID pins over the FULL denominator, and how many the horizon was hiding',
  `${pinsAll.length} non-synthetic UUID pin(s) in executable code across ${readersTransitive.length} corpus-reaching ` +
    `file(s); ${pinsBelow.length} of them below the one-level horizon; ` +
    `${pinsAll.filter((p) => !p.present).length} resolve to nothing on disk today ` +
    `(corpus readable: ${corpusReadable}, ${corpusIds.size} sessions). ` +
    (pinsBelow.length === 0
      ? `So the horizon has NOT yet hidden a live pin — stated as the measured negative it is. ` +
        `Round 240 arm J's "0 pins" was correct in substance and unsound in construction: ` +
        `the class it checks can now live in a directory it does not walk.`
      : `The horizon WAS hiding pins; see the inventory below.`));

console.log('\n── E/F: the stale-in-code population, graded against disk ───────\n');

// The assigned unit. Round 242 and 243 both closed with "the 28 unexamined
// stale-in-code probes" open. Driving 28 probes is not a fire's work and several
// of them spawn servers. But one question about them is cheap, mechanical, and
// strictly stronger than "the subject moved": do the product files each one names
// still EXIST? "Moved" is a population. "Gone" is a defect.
const SUBJECT_RE = /packages\/[A-Za-z0-9_@./-]+?\.(?:tsx|ts)\b/g;

function subjectsOf(rel: string): string[] {
  const code = stripComments(read(rel));
  const out = new Set<string>();
  for (const m of code.match(SUBJECT_RE) ?? []) {
    if (m.includes('node_modules')) continue;
    out.add(m);
  }
  return [...out];
}

function lastCommitOf(rel: string): string | null {
  const o = git(['log', '-1', '--format=%H %cs', '--', rel]).trim();
  return o || null;
}

/**
 * THE DISCRIMINATOR, and the reason this arm was rebuilt mid-fire.
 *
 * The first version of arm E reported 9 "GONE" product paths across 2 probes and
 * every one of them was a minted sentinel: `packages/a.ts`, `packages/masked.ts`,
 * `packages/server/src/db/no-such-module.ts` — strings `verify-tsx-guard.mjs`
 * feeds its own resolver to prove the guard rejects them, and the negative
 * fixture in Round 240's own arm B. **Zero commits ever, all nine.**
 *
 * That is the third appearance of one shape. Round 240 arm I's first version
 * called `probe-round179`'s hand-minted twin ids real pins by hex entropy, and
 * the fix was to stop asking what a string LOOKS like and ask what the probe
 * DOES with it: *a pin is an id the probe expects to FIND; a fixture is one it
 * creates.* I wrote that sentence, and then built an existence check over paths
 * without applying it.
 *
 *   **Rule: "absent from disk" is not evidence a subject was lost. A subject
 *   that was never there was never lost — and a probe's negative fixtures are
 *   absent BY DESIGN, so an existence check alone reports a deliberate absence
 *   and a real deletion in identical words.**
 *
 * The non-heuristic question, matching the pin precedent: a real subject is one
 * git has ever tracked. A minted sentinel has no history at all. So GONE means
 * `everCommitted && !exists`, and absent-with-no-history is a fixture, reported
 * separately rather than silently dropped — dropping it would leave no record of
 * why the count fell.
 */
const historyCache = new Map<string, boolean>();
function everCommitted(rel: string): boolean {
  if (!historyCache.has(rel)) {
    historyCache.set(rel, git(['log', '--all', '--oneline', '-1', '--', rel]).trim().length > 0);
  }
  return historyCache.get(rel)!;
}

type StaleRow = {
  file: string; probeCommit: string; probeDate: string;
  moved: string[]; gone: string[]; fixtures: string[];
};
const staleRows: StaleRow[] = [];
const goneAll: { file: string; subject: string }[] = [];
const fixtureAll: { file: string; subject: string }[] = [];

for (const f of recursive) {
  if (f.includes('round244')) continue;
  const lc = lastCommitOf(f);
  if (!lc) continue;
  const [sha, date] = lc.split(' ');
  const subs = subjectsOf(f);
  if (subs.length === 0) continue;
  const moved: string[] = [];
  const gone: string[] = [];
  const fixtures: string[] = [];
  for (const s of subs) {
    // EXISTENCE is checked on disk, never inferred from the regex. Round 240's
    // first version reported six probes naming a GONE `ChannelSidebar.ts` because
    // `/\.(?:ts|tsx)/` truncated the extension. The lesson was not "fix the regex"
    // — it was "resolve the claim against the filesystem before reporting it".
    if (!fs.existsSync(path.join(REPO, s))) {
      // ...and absence alone is not the finding. See everCommitted().
      if (everCommitted(s)) { gone.push(s); goneAll.push({ file: f, subject: s }); }
      else { fixtures.push(s); fixtureAll.push({ file: f, subject: s }); }
      continue;
    }
    const since = git(['log', '--oneline', `${sha}..HEAD`, '--', s]).trim();
    if (since) moved.push(`${s} +${since.split('\n').length}`);
  }
  if (moved.length || gone.length || fixtures.length) {
    staleRows.push({ file: f, probeCommit: sha.slice(0, 8), probeDate: date, moved, gone, fixtures });
  }
}

const withGone = staleRows.filter((r) => r.gone.length > 0);

check('E', 'absent product paths are split by git history, not reported on absence alone',
  staleRows.length > 0 && goneAll.length + fixtureAll.length > 0,
  `${staleRows.length} file(s) name a product path that moved or is absent since they were last committed. ` +
    `Absent paths: ${goneAll.length} GONE (git has tracked them, so absence is loss) + ` +
    `${fixtureAll.length} FIXTURE (zero commits ever, so absence is the point of naming them). ` +
    `The first version of this arm reported all ${goneAll.length + fixtureAll.length} as GONE.`);

// Arm E2 — the discriminator itself, two-sided, on fixtures chosen for stability
// rather than convenience. `git mv`-ing a memo into docs/mail/read/ leaves the
// old path permanently in history and permanently absent from disk, which is
// exactly the ever-committed-and-gone shape and cannot be un-made by a future
// repair. That matters: anchoring a control on a live artifact is how Round 240's
// arm I rotted, and the round diagnosing that would be a poor place to repeat it.
const everGoneFixture = 'docs/mail/iris-to-theseus-round43-reply-2026-06-25.md';
const neverFixture = 'packages/a.ts';
const liveFixture = 'packages/server/src/db/queries.ts';
check('E2', 'the ever-committed discriminator separates a real deletion from a minted sentinel (two-sided)',
  everCommitted(everGoneFixture) && !fs.existsSync(path.join(REPO, everGoneFixture)) &&
    !everCommitted(neverFixture) && !fs.existsSync(path.join(REPO, neverFixture)) &&
    everCommitted(liveFixture) && fs.existsSync(path.join(REPO, liveFixture)),
  `${everGoneFixture}: everCommitted ${everCommitted(everGoneFixture)} (want true), ` +
    `exists ${fs.existsSync(path.join(REPO, everGoneFixture))} (want false) — absent AND real; ` +
    `${neverFixture}: everCommitted ${everCommitted(neverFixture)} (want false) — absent and never real; ` +
    `${liveFixture}: everCommitted ${everCommitted(liveFixture)} (want true), ` +
    `exists ${fs.existsSync(path.join(REPO, liveFixture))} (want true). ` +
    `All three are needed: the first two alone are both "absent", which is the distinction that failed.`);

// Arm E3 — how big is the class arm E hunts, in this repo, ever? Answered from
// history rather than from today's disk, because "no gone subjects today" and
// "this product has never lost a source file" are different claims and only the
// second one tells the next reader what a clean arm E is worth.
const deletedEver = git(['log', '--diff-filter=D', '--name-only', '--format=', '--', 'packages'])
  .split('\n').map((s) => s.trim()).filter((s) => /^packages\/.*\.(ts|tsx)$/.test(s));
const renamedEver = git(['log', '--diff-filter=R', '-M', '--name-status', '--format=', '--', 'packages'])
  .split('\n').filter((l) => l.startsWith('R'));
meas('E3', 'how often a product source file has actually been lost in this repo, ever',
  `deletions of packages/**/*.ts(x) in all of history: ${new Set(deletedEver).size}; ` +
    `renames: ${renamedEver.length}. ` +
    (new Set(deletedEver).size === 0 && renamedEver.length === 0
      ? `So the gone-subject class is empty BY HISTORY, not merely today. A stale probe in this repo ` +
        `has a subject that CHANGED, never one that VANISHED — which is what makes the 28-unexamined ` +
        `population a drift question and not a rot question, and is the first thing said about it ` +
        `that is stronger than "nobody has checked".`
      : `The class is non-empty; a clean arm E is therefore informative rather than structural.`));

// Arm F — two-sided control on E's existence test, using minted sentinels rather
// than live paths. A control anchored on a live artifact is itself a pin: that is
// exactly how Round 240's arm I rotted, and repeating the mistake in the round
// that diagnoses it would be its own kind of funny.
const presentSentinel = 'packages/server/src/db/queries.ts';
const absentSentinel = 'packages/server/src/db/queries-that-do-not-exist-round244.ts';
const tsxSentinel = 'packages/client/src/components/ChannelSidebar.tsx';
const mintedSrc = `const a = '${presentSentinel}'; const b = '${absentSentinel}'; const c = '${tsxSentinel}';`;
const mintedHits: string[] = mintedSrc.match(SUBJECT_RE) ?? [];

check('F', 'existence test and subject regex are two-sided on minted sentinels (.tsx not truncated)',
  mintedHits.includes(presentSentinel) &&
    mintedHits.includes(absentSentinel) &&
    mintedHits.includes(tsxSentinel) &&
    fs.existsSync(path.join(REPO, presentSentinel)) &&
    !fs.existsSync(path.join(REPO, absentSentinel)) &&
    fs.existsSync(path.join(REPO, tsxSentinel)),
  `regex found ${mintedHits.length}/3 sentinels, .tsx intact: ${mintedHits.includes(tsxSentinel)}; ` +
    `present sentinel exists: ${fs.existsSync(path.join(REPO, presentSentinel))} (want true); ` +
    `absent sentinel exists: ${fs.existsSync(path.join(REPO, absentSentinel))} (want false); ` +
    `.tsx sentinel exists: ${fs.existsSync(path.join(REPO, tsxSentinel))} (want true).`);

console.log('\n── G: the shared modules, asked the drift question for the first time ──\n');

// Arm G — the modules below the horizon have never been in a staleness sweep.
// Ask them the same question, now that they are enumerated.
const libRows = staleRows.filter((r) => belowHorizon.includes(r.file));
const libDetail = libRows
  .map((r) => `${r.file.replace('scripts/', '')} (${r.moved.length} moved, ${r.gone.length} gone)`)
  .join('; ');

meas('G', 'drift on the shared modules the sweep could not see',
  belowHorizon.length === 0
    ? 'no below-horizon modules'
    : `${belowHorizon.length} module(s) below the horizon; ${libRows.length} of them name a product path that ` +
      `has moved since the module was last committed` +
      (libRows.length
        ? `: ${libDetail}`
        : '. A clean reading, and it is only meaningful because arm A proved the walk reaches them at all.'));

// ── Inventories ──────────────────────────────────────────────────────────────

console.log('\n── Absent product paths, split by whether git ever tracked them ─\n');
if (withGone.length === 0) {
  console.log('  GONE (ever-committed, absent today): none.');
} else {
  for (const r of withGone.sort((a, b) => b.gone.length - a.gone.length)) {
    console.log(`  ${r.file.replace('scripts/', '')}  (last committed ${r.probeCommit}, ${r.probeDate})`);
    for (const g of r.gone) console.log(`        GONE     ${g}`);
  }
}
const withFixtures = staleRows.filter((r) => r.fixtures.length > 0);
for (const r of withFixtures.sort((a, b) => b.fixtures.length - a.fixtures.length)) {
  console.log(`  ${r.file.replace('scripts/', '')}  — ${r.fixtures.length} minted sentinel(s), 0 commits ever`);
  for (const s of r.fixtures) console.log(`        FIXTURE  ${s}`);
}

if (pinsAll.length) {
  console.log('\n── Live-corpus UUID pins, full denominator ──────────────────────\n');
  for (const p of pinsAll) {
    console.log(`  ${p.present ? 'alive' : 'DEAD '}  ${p.uuid}  ${p.file.replace('scripts/', '')}` +
      `${belowHorizon.includes(p.file) ? '   [below Round 240 horizon]' : ''}`);
  }
}

if (VERBOSE) {
  console.log('\n── Stale-in-code, full recursive denominator ────────────────────\n');
  for (const r of staleRows.sort((a, b) => b.moved.length + b.gone.length - (a.moved.length + a.gone.length))) {
    console.log(`  ${r.file.replace('scripts/', '')}  (${r.probeCommit}, ${r.probeDate})`);
    for (const m of r.moved) console.log(`        moved  ${m}`);
    for (const g of r.gone) console.log(`        GONE   ${g}`);
  }
}

console.log(`\n${measurements.length} measurement(s):`);
for (const m of measurements) console.log(`  ${m}`);

console.log(`
NEXT: the "gone" list above is the only part of the stale population that is a
defect list rather than a population. Everything else still needs a drive —
exit code proves the apparatus runs, only the figures prove it still measures
the same thing.
`);

summariseAndExit({ probeName: 'round244-the-staleness-sweep-horizon', results });
