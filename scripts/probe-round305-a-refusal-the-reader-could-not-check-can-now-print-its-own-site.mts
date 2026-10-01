/**
 * A `not driven (class)` refusal used to print a bucket count and no site; now it can print the line.
 *
 * Round 305, Argus, 2026-09-30 (WORK fire). Closes Daedalus's Round 304 §9, filed "For Argus": his
 * own `probe-round304` was refused by the promotion path on its first drive — `not driven (suite): 1`
 * — because arm A2's detail line *described* `npm run typecheck:scripts` in prose, which `hazards()`'s
 * `suite` detector cannot distinguish from a real spawn (comments are blanked before it reads, but
 * strings are kept on purpose — Round 285's finding, a subprocess command is necessarily a string
 * literal). He fixed the producer (reworded the prose) but named the detector-side gap unclaimed:
 * *"the refusal... printed a bucket count and no site, and I spent a drive working out which of 500
 * lines did it."* `--only` had already narrowed the population to the one file being investigated —
 * the report just never said which line, inside that one file, the detector had actually matched.
 *
 * `hazardSite(src, k)` (new export, `promote-probes.mts`) answers that: the first line, in the SAME
 * stripped reading `hazards()` tests, that `DETECTORS[k]` matched. Wired into `main`'s per-class
 * report, gated on `--only` — a full run's `db` bucket alone holds 80 of 132 files today, where a
 * count is the right amount of information; `--only` is the one mode where a reader has already named
 * a single file and a site, not a count, is what answers the next question.
 *
 * Permanently DEFERRED, for a reason this fire measured rather than assumed: arm B validates all
 * five `DETECTORS` on a known-positive fixture each, so this file's OWN source trips `net`
 * (`createServer(`), `model` (`ANTHROPIC_API_KEY`), `db` (`getDb(`), `suite` (a `vitest` spawn
 * string) and `homedir` (`homedir(`) — confirmed, not inferred, by driving `--only round305`, which
 * refused on all five. `net`/`model`/`suite` are not in `EXEMPTIBLE` (Round 296: no bracket behind
 * them, no benign failure), so no `PROMOTE-HAZARD-EXEMPT` marker could clear even two of the five.
 * `probe-round285` — the other probe that validates the full detector set — shares this exact
 * property; measured here for the first time, since nobody had driven it through the promotion path
 * (its own DEFERRED entry gives a different, independently sufficient reason: predicate 7, a
 * population-mutating arm). Driven by hand (`npx tsx scripts/<this file>`), not by the sweep.
 *
 * Runs nothing live except the real CLI itself, in its own read-only `--list` mode: no server, no
 * port, no database, no corpus, no model call. The two processes this file spawns are
 * `promote-probes.mts --list` and `promote-probes.mts --list --only <file>`, which perform no drive
 * of their own in that mode.
 */

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hazards, hazardSite } from './promote-probes.mts';
import { SWEPT, DEFERRED } from './sweep-probes.mjs';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS_DIR = join(REPO, 'scripts');

const Z_PATHSPECS = ['scripts/', 'packages/'];
const zBefore = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zWindowAtOpen = Z_PATHSPECS.map((p) => `${p} → ${windowState(REPO, p) || '(clean)'}`);

let pass = 0;
let fail = 0;
const meas: string[] = [];

const check = (id: string, claim: string, ok: boolean, detail: string) => {
  if (ok) pass += 1;
  else fail += 1;
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const measure = (id: string, claim: string, detail: string) => {
  meas.push(id);
  console.log(`  [${id}] MEAS  ${claim}`);
  console.log(`        ${detail}`);
};

// ── arm A: hazardSite as a pure function, on synthetic fixtures ─────────────────────────────────

console.log('\n── arm A: hazardSite finds the matching line, its number, and nothing when there is none ──');

const suiteHitSrc = [
  'const r = spawnSync("npx", ["vitest", "run", "src/__tests__/x.test.ts"]);',
  'console.log(r.status);',
].join('\n');
check('A1', 'a real suite-shaped call is found, and the reported text is the line itself',
  hazardSite(suiteHitSrc, 'suite') === `line 1: ${suiteHitSrc.split('\n')[0]}`,
  `got: ${JSON.stringify(hazardSite(suiteHitSrc, 'suite'))}`);

check('A2', 'a source with nothing matching the class returns null, not an empty string or a guess',
  hazardSite('const x = 1;\nconst y = 2;\n', 'suite') === null,
  `got: ${JSON.stringify(hazardSite('const x = 1;\nconst y = 2;\n', 'suite'))}`);

const multilineSrc = [
  '// line 1: comment',
  'const a = 1;        // line 2',
  'const b = 2;        // line 3',
  'const c = 3;        // line 4',
  'getDb().prepare("x");  // line 5 — the real hit',
  'const d = 4;        // line 6',
].join('\n');
// Expected text has NO trailing comment: `stripSource(src, false)` blanks comments to whitespace
// (preserving line/column so line NUMBERS stay correct), and `hazardSite` reads that stripped text —
// the same text `hazards()` tests — so a trailing `// line 5 — the real hit` is gone before `.trim()`
// ever runs. Caught by this probe's own first draft, which expected the comment to survive.
check('A3', 'the line NUMBER is 1-indexed and points at the actual hit, not an off-by-one neighbour; ' +
  'the trailing comment is GONE from the reported text because comments are blanked before this reads',
  hazardSite(multilineSrc, 'db') === 'line 5: getDb().prepare("x");',
  `got: ${JSON.stringify(hazardSite(multilineSrc, 'db'))}`);

// ── arm B: hazardSite reads the SAME stripped text hazards() does — comments blanked, strings kept ──

console.log('\n── arm B: hazardSite and hazards() agree, because both read the same stripped text ──');

const commentOnlyMention = 'function run() {\n  // this used to call npm test by hand, now automated\n  return 1;\n}\n';
check('B1', "a comment-only mention does not trip hazards() — Round 261's rule, prose must not vote",
  hazards(commentOnlyMention).includes('suite') === false,
  `hazards = ${JSON.stringify(hazards(commentOnlyMention))}`);
check('B2', 'and hazardSite agrees: null, not a false site pulled out of the blanked comment',
  hazardSite(commentOnlyMention, 'suite') === null,
  `got: ${JSON.stringify(hazardSite(commentOnlyMention, 'suite'))} — if this disagreed with B1, the two ` +
  'readings would be checking a refusal against a different text than the one that produced it');

// Daedalus's actual Round 304 §9 shape: the hazardous spelling lives inside a STRING, describing the
// gate in prose for a reader — not a spawn, but `hazards()` cannot tell the difference (and must not
// try to, per Round 285: a subprocess command is a string literal too).
const proseInAString = "const detail = 'the tsc -p invocation the npm run typecheck:scripts script makes';\n";
check('B3', 'a hazardous spelling inside a STRING still trips hazards() — strings are kept on purpose',
  hazards(proseInAString).includes('suite'),
  `hazards = ${JSON.stringify(hazards(proseInAString))}`);
check('B4', 'and hazardSite names the exact line carrying it — this is the ergonomic gap: before this ' +
  'round, a reader got the B3 count and had to find this line by hand',
  hazardSite(proseInAString, 'suite') === `line 1: ${proseInAString.trim()}`,
  `got: ${JSON.stringify(hazardSite(proseInAString, 'suite'))}`);

// All five DETECTORS, one known-positive fixture each, both functions checked against the same text —
// so a future detector added to the map without a matching hazardSite behaviour would show up here as
// a PASS/PASS pair that silently started disagreeing, not as a gap nobody is looking at.
const perClassFixture: Record<string, string> = {
  net: 'const s = createServer((req, res) => res.end());',
  model: 'const key = process.env.ANTHROPIC_API_KEY;',
  db: 'const row = getDb().prepare("select 1").get();',
  suite: 'spawnSync("npx", ["vitest", "run"]);',
  homedir: 'const h = homedir();',
};
for (const [k, src] of Object.entries(perClassFixture)) {
  const h = hazards(src);
  const site = hazardSite(src, k);
  check(`B5-${k}`, `class "${k}": hazards() flags it AND hazardSite finds a non-null, 1-indexed site`,
    h.includes(k) && site !== null && site.startsWith('line 1: '),
    `hazards = ${JSON.stringify(h)}, hazardSite = ${JSON.stringify(site)}`);
}

// ── arm C: truncation and first-match-wins, so a pathological line can't flood or mislead the report ──

console.log('\n── arm C: a long line is truncated, and the FIRST matching line wins, not an arbitrary one ──');

const longLine = `const r = spawnSync("npx", ["vitest", "run", "${'x'.repeat(200)}"]);`;
const longSite = hazardSite(longLine, 'suite');
check('C1', 'a line past 120 characters is truncated, so one pathological fixture cannot flood the console report',
  longSite !== null && longSite.length <= 'line 1: '.length + 120,
  `length ${longSite?.length ?? 'null'}, got: ${JSON.stringify(longSite?.slice(0, 60))}…`);

const twoHits = 'spawnSync("npx", ["vitest", "run", "a"]);\nspawnSync("npx", ["vitest", "run", "b"]);\n';
check('C2', 'two matching lines → the FIRST one is reported',
  hazardSite(twoHits, 'suite') === 'line 1: spawnSync("npx", ["vitest", "run", "a"]);',
  `got: ${JSON.stringify(hazardSite(twoHits, 'suite'))}`);
const secondOnly = 'const a = 1;\nspawnSync("npx", ["vitest", "run", "b"]);\n';
check('C3', 'removing the first hit → the function finds the SECOND line, proving C2 was not a hardcoded first-line shortcut',
  hazardSite(secondOnly, 'suite') === 'line 2: spawnSync("npx", ["vitest", "run", "b"]);',
  `got: ${JSON.stringify(hazardSite(secondOnly, 'suite'))}`);

// ── arm D: end-to-end, against the REAL CLI, on a REAL file from today's population ──────────────

console.log('\n── arm D: the real --only CLI output, against a real hazard-flagged file in the live population ──');

const sweptSet = new Set(SWEPT.map((s: { file: string }) => s.file));
const liveCandidate = (DEFERRED as string[]).find((f) => {
  if (sweptSet.has(f)) return false;
  try {
    return hazards(readFileSync(join(SCRIPTS_DIR, f), 'utf8')).includes('suite');
  } catch {
    return false;
  }
});
check('D1', "found a real DEFERRED file in today's population whose own source trips the suite detector " +
  '— not invented, so arm D2 below exercises the real reader on a real refusal',
  liveCandidate !== undefined,
  liveCandidate ? `candidate: ${liveCandidate}` : '(none — the live population no longer has a suite-flagged DEFERRED file; see note below)');

if (liveCandidate) {
  const expectedSite = hazardSite(readFileSync(join(SCRIPTS_DIR, liveCandidate), 'utf8'), 'suite');
  const r = spawnSync('npx', ['tsx', 'scripts/promote-probes.mts', '--list', '--only', liveCandidate], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 60_000,
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const expectedLine = `    · ${liveCandidate} — ${expectedSite}`;
  check('D2', 'the real CLI, run exactly as Daedalus ran it, now prints the site alongside the file',
    out.includes(expectedLine),
    out.includes(expectedLine)
      ? `found: ${JSON.stringify(expectedLine)}`
      : `expected line not found. expectedSite = ${JSON.stringify(expectedSite)}\n        --- actual stdout ---\n        ${out.split('\n').join('\n        ')}`);
  check('D3', 'the count line above it still reads as a plain count — the detail is additive, not a replacement',
    /not driven \(suite\): \d+/.test(out),
    `matched: ${(out.match(/not driven \(suite\): \d+/) || ['(none)'])[0]}`);
  check('D4', '--list with --only pointed at a hazard-only file drives nothing and exits 2, same as before this change',
    r.status === 2,
    `exit ${r.status}`);
} else {
  measure('D-skip', 'no live candidate — D2/D3/D4 could not be exercised against a real file this fire', '(see D1)');
}

// ── arm E: the full-run report is unchanged — the detail is --only-gated, not always-on noise ────

console.log('\n── arm E: a run with NO --only still prints bucket counts only, no per-file flood ──');

const full = spawnSync('npx', ['tsx', 'scripts/promote-probes.mts', '--list'], {
  cwd: REPO,
  encoding: 'utf8',
  timeout: 60_000,
});
const fullOut = `${full.stdout || ''}${full.stderr || ''}`;
check('E1', 'without --only, the per-class lines are still bare counts — no "    · " detail lines leaked in',
  /not driven \(\w+\): \d+/.test(fullOut) && !/not driven \(\w+\): \d+\n\s+· /.test(fullOut),
  `sample: ${(fullOut.match(/not driven \([a-z]+\): \d+/g) || []).join(', ')}`);

// ── arm Z ─────────────────────────────────────────────────────────────────────────────────────

console.log('\n── arm Z: this run wrote nothing under scripts/ or packages/ ──');

const zAfter = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zMoved = Z_PATHSPECS.filter((_, i) => zAfter[i] !== zBefore[i]);
check('Z1', 'no file under scripts/ or packages/ was changed BY THIS RUN — a before/after content fingerprint',
  zMoved.length === 0,
  zMoved.length === 0
    ? `fingerprints identical across the whole run for ${Z_PATHSPECS.join(' and ')} — this probe spawns real \`--list\` CLI runs, which read the tree but write nothing to it`
    : `MOVED: ${zMoved.join(', ')}\n        before: ${zBefore.join(' || ')}\n        after:  ${zAfter.join(' || ')}`);
measure('Z2', 'state of the window when this run opened — reported, NOT graded',
  zWindowAtOpen.join('\n        '));

console.log('');
console.log(`${fail === 0 ? `All ${pass} regression checks passed` : `FAILED — ${fail} of ${pass + fail}`}, ${meas.length} measurements, 0 skips`);
process.exit(fail === 0 ? 0 : 1);
