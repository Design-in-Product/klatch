/**
 * Round 261, Daedalus, 2026-09-23 (STOP fire).
 *
 * Drives `scripts/sweep-probes.mjs` — the fleet probe sweep built this fire in answer to Theseus's
 * Round 260 §7 item 2 ("A sweep that runs each round's probe and records exit codes would have
 * caught it the same fire; I have not built one and am not claiming one exists").
 *
 * ── What this probe is FOR ──────────────────────────────────────────────────
 *
 * The sweep's value is entirely in its RED path. Its green path ran 8 of 8 green on the first try,
 * which proves nothing about whether it can go red — and Theseus's Round 260 §7 item 1 made exactly
 * this point about a masker property ("an arm that only checks the good masker cannot tell a real
 * property from a comparison that can never fail"). So every arm here is aimed at the red.
 *
 * Arms A–C drive the census partition against MINTED fixture directories under gitignored
 * `.testdata/`, never against `scripts/`. That is why `census()` takes a directory: a guard that can
 * only be pointed at the tree it guards cannot be shown to fail without dirtying that tree, and the
 * thing I would have to do to dirty it — write a junk file into `scripts/` — is the operator-tree
 * write both seats have ruled out since Round 254.
 *
 * Arm D drives `verdict()`, the per-probe grader, on the four corners of its two-limb conjunction.
 * Arm E is the negative control on the arms themselves.
 *
 * No server, no port, no database, no corpus, no model call. Writes only under `.testdata/r261/`.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { census, partition, verdict, SWEPT, DEFERRED } from './sweep-probes.mjs';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Round 263: arm Z is bracketed, so the "before" has to be taken before any arm runs. See the
// note on arm Z at the foot of this file for why this replaced an emptiness claim.
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

const SCRATCH = join(process.cwd(), '.testdata', 'r261', 'census-fixtures');
rmSync(SCRATCH, { recursive: true, force: true });

/** Mints a fixture directory holding exactly the named probe files, plus one non-probe decoy. */
const mint = (name: string, files: string[]): string => {
  const dir = join(SCRATCH, name);
  mkdirSync(dir, { recursive: true });
  for (const f of files) writeFileSync(join(dir, f), '// fixture, never executed\n');
  // A non-probe file in every fixture: the census must select on the `probe-` stem, and a census
  // that swept the whole directory would drag this in and go red for the wrong reason.
  writeFileSync(join(dir, 'verify-not-a-probe.mjs'), '// decoy\n');
  return dir;
};

const BASE = ['probe-round900-alpha.mts', 'probe-round901-beta.mts', 'probe-round902-gamma.mjs'];
const SW = ['probe-round900-alpha.mts'];
const DEF = ['probe-round901-beta.mts', 'probe-round902-gamma.mjs'];

console.log('── arm A — the census reads a directory, and selects on the stem ────────');

const dirBase = mint('base', BASE);
const c0 = census(dirBase);
check('A1', 'census returns exactly the probe files, sorted, and excludes the non-probe decoy',
  JSON.stringify(c0) === JSON.stringify([...BASE].sort()),
  `census(${'base'}) = [${c0.join(', ')}]; the decoy verify-not-a-probe.mjs is present on disk and absent here`);

const p0 = partition(c0, SW, DEF);
check('A2', 'a directory whose files are exactly the two lists partitions clean',
  p0.unclassified.length === 0 && p0.missing.length === 0 && p0.duplicated.length === 0,
  `unclassified 0, missing 0, duplicated 0 over ${c0.length} files`);

console.log('');
console.log('── arm B — the gate: an arriving probe reddens it ───────────────────────');

// This is the arm that matters. The sweep's whole claim to not going silently stale is that a probe
// landing in neither list is caught. Driven, not asserted.
const dirNew = mint('arrival', [...BASE, 'probe-round903-delta.mts']);
const pNew = partition(census(dirNew), SW, DEF);
check('B1', 'a probe in NEITHER list is reported unclassified',
  pNew.unclassified.length === 1 && pNew.unclassified[0] === 'probe-round903-delta.mts',
  `unclassified = [${pNew.unclassified.join(', ')}] — this is the red that fires when round 262 lands`);
check('B2', 'and the arrival does not also register as missing or duplicated — one fault, one signal',
  pNew.missing.length === 0 && pNew.duplicated.length === 0,
  `missing ${pNew.missing.length}, duplicated ${pNew.duplicated.length}`);

console.log('');
console.log('── arm C — the other two ways the lists can be wrong ────────────────────');

// A rename is the failure mode that would quietly empty the swept set: the entry keeps pointing at
// a name nothing answers to, and an allowlist that runs nothing runs green.
const dirGone = mint('rename', BASE.filter((f) => f !== 'probe-round901-beta.mts').concat('probe-round901-beta-renamed.mts'));
const pGone = partition(census(dirGone), SW, DEF);
check('C1', 'a declared probe that no longer exists is reported missing',
  pGone.missing.length === 1 && pGone.missing[0] === 'probe-round901-beta.mts',
  `missing = [${pGone.missing.join(', ')}] — a rename empties an entry without emptying the list`);
check('C2', 'and the renamed file simultaneously surfaces as unclassified — a rename is TWO faults',
  pGone.unclassified.length === 1 && pGone.unclassified[0] === 'probe-round901-beta-renamed.mts',
  `unclassified = [${pGone.unclassified.join(', ')}]. Theseus's Round 260 §7 rule — the breaking ` +
  `operation is rename, not relocation — reaches this instrument too, and it reports both ends`);

const pDup = partition(census(dirBase), ['probe-round900-alpha.mts', 'probe-round901-beta.mts'], DEF);
check('C3', 'a probe named by BOTH lists is reported duplicated, not silently swept',
  pDup.duplicated.length === 1 && pDup.duplicated[0] === 'probe-round901-beta.mts',
  `duplicated = [${pDup.duplicated.join(', ')}]; without this limb a probe could be swept AND ` +
  `recorded as deferred, and the deferred count would overstate the debt while the swept set ran it`);

console.log('');
console.log('── arm D — the grader, on all four corners of its conjunction ───────────');

const EXPECT = /All 7 regression checks passed/;
const good = 'blah\nAll 7 regression checks passed\n';
const wrong = 'blah\nAll 6 regression checks passed\n';

check('D1', 'exit 0 + matching summary → ok', verdict(0, good, EXPECT).ok === true, 'ok = true');
check('D2', 'exit 1 + matching summary → NOT ok (printed its tail, then threw on the way out)',
  verdict(1, good, EXPECT).ok === false && verdict(1, good, EXPECT).matched === true,
  'ok = false, matched = true — the exit-code limb is the one carrying it');
check('D3', 'exit 0 + NO matching summary → NOT ok (this is the round224 defect: a skip summarising as a pass)',
  verdict(0, wrong, EXPECT).ok === false && verdict(0, wrong, EXPECT).matched === false,
  'ok = false, matched = false — the summary limb is the one carrying it. probe-round224 is IN ' +
  'the swept set, so a sweep grading on exit code alone would reproduce the very defect its own ' +
  'subject was written to hold');
check('D4', 'exit 1 + no summary → NOT ok', verdict(1, wrong, EXPECT).ok === false, 'ok = false');

console.log('');
console.log('── arm E — negative control: these arms can come out the other way ──────');

// Without this, arms A–D are consistent with a partition() that returns empty arrays for
// everything and a verdict() that returns ok:false for everything.
check('E1', 'partition CAN return all-empty and CAN return non-empty — both observed above',
  p0.unclassified.length === 0 && pNew.unclassified.length > 0,
  `clean fixture 0 unclassified, arrival fixture ${pNew.unclassified.length} — the comparison discriminates`);
check('E2', 'verdict CAN return true and CAN return false — both observed above',
  verdict(0, good, EXPECT).ok === true && verdict(1, wrong, EXPECT).ok === false,
  'true and false both reachable; a grader stuck on either value would pass half of arm D vacuously');

console.log('');
console.log('── arm F — the real lists, measured not graded ──────────────────────────');

const real = census(join(process.cwd(), 'scripts'));
const pReal = partition(real, SWEPT.map((s) => s.file), DEFERRED);
check('F1', 'the live scripts/ census partitions clean against the shipped lists',
  pReal.unclassified.length === 0 && pReal.missing.length === 0 && pReal.duplicated.length === 0,
  `${real.length} probe files; unclassified ${pReal.unclassified.length}, missing ${pReal.missing.length}, duplicated ${pReal.duplicated.length}`);
measure('F2', 'how much of the fleet this sweep actually covers — the debt, printed so it cannot be mistaken for coverage',
  `${SWEPT.length} swept, ${DEFERRED.length} deferred, ${real.length} total. ` +
  `${Math.round((SWEPT.length / real.length) * 100)}% of probe files are swept. The other ` +
  `${DEFERRED.length} are NOT established safe — they are unexamined.`);

console.log('');
console.log('── arm G — the sweep exits non-zero when its census is red ──────────────');

// The census limb is driven above as a pure function. This drives the PROCESS: an exit code that
// does not follow the finding is the "silent cap" failure Round 103/104 named, one level up.
const runCensus = (env: NodeJS.ProcessEnv): { code: number; out: string } => {
  try {
    const out = execFileSync('node', ['scripts/sweep-probes.mjs', '--census'], { encoding: 'utf8', env });
    return { code: 0, out };
  } catch (e: any) {
    return { code: e.status ?? -1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
};
const g = runCensus(process.env);
check('G1', 'node scripts/sweep-probes.mjs --census exits 0 on the live tree and says so',
  g.code === 0 && /census PASSED/.test(g.out),
  `exit ${g.code}; tail: ${(g.out.trim().split('\n').pop() || '').slice(0, 60)}`);

console.log('');
console.log('── arm Z — I left the tree as I found it ────────────────────────────────');

// ── Round 263 repair, on Theseus's Round 262 §3 finding ──────────────────────
//
// This arm shipped in Round 261 as an EMPTINESS claim over the working-tree window, with an
// allowlist filtering out this round's own two deliverables. It went red on Theseus's tree on
// 2026-09-23 — not on anything this probe did, but on HIS uncommitted Round 262 files, while its
// subject (the sweep) was fine. His table names the shape exactly: a fuse misleads its author, a
// gate prompts its author, and this reddened for a third party who had done nothing wrong, during
// exactly the window in which the sweep is most worth running.
//
// The allowlist was the wrong patch twice over: it must name every future round's deliverables to
// stay green (the staleness this file's own DEFERRED design exists to avoid), and it is not even
// STRICT — an emptiness claim cannot see a write into a file that was already modified when the
// run opened, because the status letter does not move.
//
// So the claim is now bracketed: fingerprint at open, fingerprint at close, compare. That grades
// what this RUN did rather than what the WINDOW contained. Shared with `probe-round259` via
// `scripts/lib/tree-fingerprint.mts`; driven, red and green both, by `probe-round263`.
const zAfter = Z_PATHSPECS.map((p) => fingerprint(REPO, p));
const zMoved = Z_PATHSPECS.filter((_, i) => zAfter[i] !== zBefore[i]);
check('Z1', 'no file under scripts/ or packages/ was changed BY THIS RUN — a before/after content fingerprint, not an emptiness claim',
  zMoved.length === 0,
  zMoved.length === 0
    ? `fingerprints identical across the whole run for ${Z_PATHSPECS.join(' and ')}. Fixtures are ` +
      `minted under gitignored .testdata/r261/ only. Another seat's in-flight work under these ` +
      `paths is invisible to this arm by construction — that is the repair.`
    : `MOVED: ${zMoved.join(', ')}\n        before: ${zBefore.join(' || ')}\n        after:  ${zAfter.join(' || ')}`);

measure('Z3', 'state of the window when this run opened — reported, NOT graded, because this seat does not own it',
  zWindowAtOpen.join('\n        ') +
  '\n        Whatever is here is not this run\'s doing and arm Z1 does not grade it.');
check('Z2', 'the fixture directory is under .testdata/ and exists there, not in scripts/',
  existsSync(SCRATCH) && SCRATCH.includes('.testdata') && !existsSync(join(process.cwd(), 'scripts', 'probe-round900-alpha.mts')),
  `fixtures at ${SCRATCH.replace(process.cwd(), '.')}; scripts/probe-round900-alpha.mts does not exist`);

console.log('');
console.log(`${fail === 0 ? `All ${pass} regression checks passed` : `FAILED — ${fail} of ${pass + fail}`}, ${meas.length} measurements, 0 skips`);
process.exit(fail === 0 ? 0 : 1);
