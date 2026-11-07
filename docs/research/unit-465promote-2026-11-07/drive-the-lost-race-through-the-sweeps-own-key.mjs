/**
 * unit-465promote — P2 and P3.
 *
 * Does a lost race enter the sweep as a declared blocker, or as an undifferentiated red?
 *
 * The verdict is NOT re-implemented here: `classify` is imported from `sweep-probes.mjs`, which is
 * the thing the promotion decision is about. A grader at this call site that re-spelled the
 * exit-code/summary-line key could only grade its own copy of it.
 *
 * `expect` is CAPTURED from the control drive's own output, not typed. The probe is not in SWEPT,
 * so no entry pin exists yet; typing the conclusion line here would make P3 a test of my spelling.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { classify } from '../../../scripts/sweep-probes.mjs';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const FILE = 'probe-backfill-sidecar-neutrality.mts';

/** The sweep's own runner shape: spawnSync, and stdout+stderr concatenated into one `out`. */
const drive = (env) => {
  const t0 = Date.now();
  const r = spawnSync('npx', ['tsx', path.join('scripts', FILE)], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, ...env },
  });
  return {
    code: r.status,
    out: `${r.stdout || ''}${r.stderr || ''}`,
    err: r.error,
    ms: Date.now() - t0,
  };
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The shapes `probe-outcome.mts` gives a conclusion, searched from the end — the sweep's own rule. */
const conclusionOf = (out) => {
  const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\(exit 3 —/.test(lines[i])) continue;
    if (/passed|FAIL|regression|established|broke/i.test(lines[i])) return lines[i];
  }
  return lines[lines.length - 1] ?? '';
};

const grades = [];
const grade = (name, ok, detail) => {
  grades.push({ name, ok, detail });
  console.log(`  ${ok ? 'true ' : 'FALSE'}  ${name} — ${detail}`);
};

console.log('=== drive 0 — control, no cripple ===');
const d0 = drive({});
const concl0 = conclusionOf(d0.out);
console.log(`  exit ${d0.code}  ${d0.ms} ms`);
console.log(`  conclusion: ${concl0}`);

// The pin, captured rather than typed.
const EXPECT = new RegExp(esc(concl0));
console.log(`  EXPECT (captured): /${EXPECT.source.slice(0, 90)}/`);

const c0 = classify(d0.code, d0.out, EXPECT, undefined, undefined);
console.log(`  classify -> ${c0.state}`);

console.log('\n=== drive 1 — X1, the race deliberately lost ===');
const d1 = drive({ U465PROMOTE_LOSE_RACE: '1' });
console.log(`  exit ${d1.code}  ${d1.ms} ms`);
const eLines1 = d1.out.split('\n').filter((l) => /\[E\]/.test(l));
for (const l of eLines1) console.log(`  ${l.trim()}`);
const c1 = classify(d1.code, d1.out, EXPECT, undefined, undefined);
console.log(`  classify -> ${c1.state}`);

console.log('\n=== drive 2 — X2, the size test removed (the destructive defect) ===');
const d2 = drive({ U465PROMOTE_NO_SIZE_TEST: '1' });
console.log(`  exit ${d2.code}  ${d2.ms} ms`);
const eLines2 = d2.out.split('\n').filter((l) => /\[E\]/.test(l));
for (const l of eLines2) console.log(`  ${l.trim()}`);
const c2 = classify(d2.code, d2.out, EXPECT, undefined, undefined);
console.log(`  classify -> ${c2.state}`);

console.log('\n=== grades ===');

// Sanity: the control must be green, or nothing below is a reading of anything.
grade('S1 control is green and the captured pin matches it', d0.code === 0 && c0.state === 'PASS',
  `exit ${d0.code}, state ${c0.state}`);

// P2.
grade('P2a the lost race exits 1, not 2 and not 3', d1.code === 1, `exit ${d1.code}`);
grade('P2b the lost race emits no `did not run:` line', !/did not run:/.test(d1.out),
  /did not run:/.test(d1.out) ? 'a `did not run:` line IS present' : 'absent');
grade('P2c therefore classify says RED, not BLOCKED', c1.state === 'RED', `state ${c1.state}`);
grade('P2d the not-built reason is the inode mismatch, three attempts consumed',
  /made its own -wal/.test(d1.out) && /3 attempt\(s\)/.test(d1.out),
  (d1.out.match(/commit made its own -wal[^\n]*/) || ['(reason line not found)'])[0].trim());

// P3 — compared at the SWEEP's granularity, which is the two printed lines, not the probe's stdout.
const sweepRow = (c, d) => {
  const matched = c.matched;
  const conclusion = matched ? undefined : conclusionOf(d.out);
  const summary = matched
    ? (d.out.match(EXPECT) || [''])[0]
    : `exit ${d.code}, summary line NOT FOUND — ${conclusion.slice(0, 110)}`;
  return `${c.state.padEnd(7)} exit ${String(d.code).padStart(3)}  ${FILE}\n${summary}`;
};
const row1 = sweepRow(c1, d1);
const row2 = sweepRow(c2, d2);
console.log('\n  --- sweep row, lost race ---');
console.log(row1);
console.log('  --- sweep row, destructive defect ---');
console.log(row2);

grade('P3a both drives are RED at the sweep', c1.state === 'RED' && c2.state === 'RED',
  `lost-race ${c1.state}, defect ${c2.state}`);
grade('P3b both fail the captured pin', !c1.matched && !c2.matched,
  `matched: lost-race ${c1.matched}, defect ${c2.matched}`);
grade('P3c the two sweep rows carry the same state and the same exit code',
  c1.state === c2.state && d1.code === d2.code,
  `${c1.state}/exit ${d1.code} vs ${c2.state}/exit ${d2.code}`);

// The one bit that DOES differ, recorded rather than claimed either way: the failing-arm text.
const armsOf = (out) => (out.match(/REGRESSIONS:[\s\S]*?(?:\n\n|$)/) || [''])[0].trim();
const a1 = armsOf(d1.out);
const a2 = armsOf(d2.out);
grade('P3d the failing-arm BLOCK does differ between them (so the probe is readable by hand)',
  a1 !== a2 && a1.length > 0 && a2.length > 0,
  `lost-race ${a1.split('\n').length - 1} arm line(s), defect ${a2.split('\n').length - 1}`);
console.log('\n  --- failing arms, lost race ---\n' + a1);
console.log('\n  --- failing arms, destructive defect ---\n' + a2);

const bad = grades.filter((g) => !g.ok);
console.log(`\nSUMMARY  ${grades.length - bad.length}/${grades.length} grades true` +
  (bad.length ? ` — FALSE: ${bad.map((g) => g.name.split(' ')[0]).join(', ')}` : ''));
process.exit(bad.length ? 1 : 0);
