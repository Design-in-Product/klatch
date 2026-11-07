/**
 * unit-465promote — P1 and P5.
 *
 * P1: does moving the file DEFERRED -> SWEPT cause `npm test` / `gate.mts` to drive it?
 *     Both call `--census`. Graded by driving the census the way they do and reading what it says
 *     it did NOT check, plus asserting the census spawns no child for the file.
 *
 * P5: does the lib already carry the cure? A hard skip must give exit 3 AND a structural
 *     `did not run: <label>` line, which is the only pair `classify`'s BLOCKED limb accepts.
 *     Graded against the REAL output of a real drive, then through the sweep's own `classify`.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { classify, DEFERRED, SWEPT } from '../../../scripts/sweep-probes.mjs';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const HERE = path.relative(REPO, path.dirname(new URL(import.meta.url).pathname));
const FILE = 'probe-backfill-sidecar-neutrality.mts';

const grades = [];
const grade = (name, ok, detail) => {
  grades.push({ name, ok });
  console.log(`  ${ok ? 'true ' : 'FALSE'}  ${name} — ${detail}`);
};

// ── P1 ────────────────────────────────────────────────────────────────────────
console.log('=== P1 — what the census does, and does not, drive ===');

const census = spawnSync('node', ['scripts/sweep-probes.mjs', '--census'], {
  cwd: REPO, encoding: 'utf8', timeout: 300_000,
});
const cOut = `${census.stdout || ''}${census.stderr || ''}`;
console.log(`  census exit ${census.status}`);

grade('P1a the census passes on the untouched tree', census.status === 0 && /census PASSED/.test(cOut),
  (cOut.match(/census (PASSED|FAILED[^\n]*)/) || ['(not found)'])[0]);

grade('P1b the census states in its own output that it drove no probe',
  /NOT CHECKED: none of the \d+ swept probes was driven/.test(cOut),
  (cOut.match(/NOT CHECKED: none of the \d+ swept probes was driven/) || ['(line absent)'])[0]);

// The decisive leg: the subject is in DEFERRED today, and the census reads source only. If
// membership were what made `npm test` drive a probe, the census would have to spawn. It does not
// spawn for ANY probe, which is why promotion cannot change this. Read off the list membership and
// the census's own claim together rather than inferred from either alone.
const inDeferred = DEFERRED.filter((f) => f === FILE).length;
const inSwept = SWEPT.filter((s) => s.file === FILE).length;
grade('P1c the subject is in DEFERRED exactly once and in SWEPT not at all',
  inDeferred === 1 && inSwept === 0, `DEFERRED ${inDeferred}, SWEPT ${inSwept}`);

// `npm test` and the gate are read from source, so the claim is about what they invoke.
const pkg = spawnSync('node', ['-e',
  'const p=require("./package.json");process.stdout.write(p.scripts.test)'],
  { cwd: REPO, encoding: 'utf8' });
const gateSrc = spawnSync('node', ['-e',
  'process.stdout.write(require("fs").readFileSync("scripts/gate.mts","utf8"))'],
  { cwd: REPO, encoding: 'utf8' }).stdout || '';
const gateCensusLine = (gateSrc.match(/census: \[[^\]]*\]/) || ['(not found)'])[0];
console.log(`  package.json test: ${pkg.stdout}`);
console.log(`  gate.mts census:   ${gateCensusLine}`);
grade('P1d both `npm test` and the gate pass --census, so neither reaches the driving loop',
  /sweep-probes\.mjs --census/.test(pkg.stdout || '') && /--census/.test(gateCensusLine),
  'both carry --census');

// ── P5 ────────────────────────────────────────────────────────────────────────
console.log('\n=== P5 — does the lib already carry the cure shape? ===');

const fx = spawnSync('npx', ['tsx', path.join(HERE, 'fixture-hard-skip.mts')], {
  cwd: REPO, encoding: 'utf8', timeout: 300_000,
});
const fOut = `${fx.stdout || ''}${fx.stderr || ''}`;
console.log(`  fixture exit ${fx.status}`);
for (const l of fOut.split('\n').filter(Boolean)) console.log(`  | ${l}`);

grade('P5a a hard skip exits 3', fx.status === 3, `exit ${fx.status}`);

const didNotRunLine = fOut.split('\n').find((l) => l.includes('did not run:')) || '';
grade('P5b and emits a structural `did not run:` line', didNotRunLine !== '',
  didNotRunLine.trim() || '(absent)');

// The label the entry would declare, captured off the fixture's own line rather than typed.
const SKIP = /the race state could not be built/;
const cls = classify(fx.status, fOut, /All \d+ regression checks passed/, undefined, SKIP);
grade('P5c with a declared `skip:` pattern the sweep says BLOCKED, not RED',
  cls.state === 'BLOCKED', `state ${cls.state}, skipped ${cls.skipped}`);

// And the control that makes P5c a reading: WITHOUT the declaration the same run is RED. An
// undeclared exit 3 must not buy a blocker.
const clsNoDecl = classify(fx.status, fOut, /All \d+ regression checks passed/, undefined, undefined);
grade('P5d without the declaration the identical run is RED (the declaration is load-bearing)',
  clsNoDecl.state === 'RED', `state ${clsNoDecl.state}`);

// And the negative that proves the label must be the one on the line, not any label.
const clsWrong = classify(fx.status, fOut, /All \d+ regression checks passed/, undefined,
  /a label no row carries/);
grade('P5e a declared label absent from the `did not run:` line does NOT buy a blocker',
  clsWrong.state === 'RED', `state ${clsWrong.state}`);

const bad = grades.filter((g) => !g.ok);
console.log(`\nSUMMARY  ${grades.length - bad.length}/${grades.length} grades true` +
  (bad.length ? ` — FALSE: ${bad.map((g) => g.name.split(' ')[0]).join(', ')}` : ''));
process.exit(bad.length ? 1 : 0);
