#!/usr/bin/env node
/**
 * Round 420 — drive Daedalus's Round 419 instruments UNMODIFIED, before anything of mine is built,
 * and diff each one's live output against the output he committed beside it.
 *
 * Three properties this measures that a read of his memo cannot:
 *
 * 1. REPRODUCTION, not agreement. His recorded `.out` files are extracted from the commit with
 *    `git show <rev>:<path>` rather than read off disk, because two of his instruments REWRITE
 *    their own `.out` when driven — so the on-disk copy after a drive is this fire's output, not
 *    his record. (Round 412: a hand-typed reader is not a slice; the same applies to a baseline.)
 * 2. EXIT CODES off `spawnSync().status`, unpiped (feedback: a pipe hides the head and reports the
 *    wrong exit code).
 * 3. BOTH CWDS. He drove mine from two cwds because my Round 418 §5 charged his Round 417
 *    instrument with dying on ENOENT from its own directory. His four get the same treatment.
 *
 * Volatile lines (timestamps, the `driven at:` stamp, absolute cwd paths, fetch digest timing) are
 * normalised before the diff and the normalisation is PRINTED, so a diff of 0 cannot be the
 * normaliser eating a real difference. A CONTROL asserts the normaliser does not erase a line that
 * differs for a non-volatile reason.
 *
 * Usage: node drive-his-419.mjs      (any cwd; paths resolve against the repo root)
 */
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const HIS = 'docs/research/round419-instruments';
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').stdout.trim();

// The rev that published Round 419. Stamped, not "HEAD", so this reproduction is addressable later
// (Round 389: "his round reproduces" must name both hashes).
const HIS_REV = 'ee37abae';

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
  return ok;
};

say('# Round 420 — Daedalus\'s Round 419 instruments, driven unmodified');
say('');
say(`my rev:    ${REV}`);
say(`his rev:   ${HIS_REV} (${git('log', '-1', '--format=%h %an %s', HIS_REV).stdout.trim()})`);
say(`driven at: ${new Date().toISOString()}`);
say('');

// --- the instruments, with the argv each needs and the recorded output each writes ---
const CHANGELOG = path.join(REPO, '.testdata', 'round419-sdk-changelog.md');
const INSTRUMENTS = [
  { file: 'grade-the-417-repairs.mjs', argv: [], rec: 'grade-the-417-repairs.out' },
  { file: 'sec3-rekeyed-on-the-call-shape.mjs', argv: [CHANGELOG], rec: 'sec3-rekeyed.out' },
  { file: 'drive-his-418.mjs', argv: [], rec: 'his418-driven-live.out' },
  // fetch-changelog.mjs writes no .out; driven for its exit code and digest line only.
  { file: 'fetch-changelog.mjs', argv: [], rec: null },
];

gate('the input changelog is present', existsSync(CHANGELOG), CHANGELOG);
if (!existsSync(CHANGELOG)) { say('VERDICT: REFUSED — run fetch-changelog.mjs first.'); process.exit(2); }

// --- normaliser -------------------------------------------------------------
// Each rule is PRINTED so a clean diff cannot hide behind an unstated substitution.
const RULES = [
  [/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, '<TIMESTAMP>'],
  [/^(cwd:\s*).*$/gm, '$1<CWD>'],
  [/^(repo root:\s*).*$/gm, '$1<REPO>'],
  [/^(changelog:\s*).*$/gm, '$1<CHANGELOG>'],
  [/^(HEAD:\s*).*$/gm, '$1<HEAD>'],
  [/^(rev stamp:\s*).*$/gm, '$1<REV>'],
  [/^(\s*SUMMARY: rev )[0-9a-f]{8}/gm, '$1<REV8>'],
  [/^(SUMMARY: rev )[0-9a-f]{8}/gm, '$1<REV8>'],
  [/\/Users\/[^\s'"]+/g, '<ABSPATH>'],
  [/stderr bytes: \d+/g, 'stderr bytes: <N>'],
];
say('');
say('normalisation rules applied to BOTH sides before diffing:');
RULES.forEach(([re, to]) => say(`   ${String(re)}  ->  ${to}`));
const norm = (s) => RULES.reduce((acc, [re, to]) => acc.replace(re, to), s || '');

// CONTROL: the normaliser must not erase a difference that is not volatile.
{
  const a = norm('rev stamp: abc\nKLATCH-REACHABLE bullets: 32 of 191');
  const b = norm('rev stamp: xyz\nKLATCH-REACHABLE bullets: 31 of 191');
  gate('CONTROL normaliser erases the volatile line', a.split('\n')[0] === b.split('\n')[0]);
  gate('CONTROL normaliser preserves a non-volatile difference', a !== b);
}

// --- his committed baselines, taken from the commit, not from disk ----------
const baseline = {};
for (const { rec } of INSTRUMENTS) {
  if (!rec) continue;
  const r = git('show', `${HIS_REV}:${HIS}/${rec}`);
  baseline[rec] = r.status === 0 ? r.stdout : null;
  gate(`baseline ${rec} extracted from ${HIS_REV}`, baseline[rec] !== null,
    baseline[rec] ? `${baseline[rec].split('\n').length} lines` : String(r.stderr).trim().slice(0, 80));
}

if (fails.length) { say(''); say(`VERDICT: REFUSED — ${fails.length} gate(s) failed: ${fails.join(', ')}`); process.exit(1); }

// --- drive ------------------------------------------------------------------
const results = [];
for (const { file, argv, rec } of INSTRUMENTS) {
  const abs = path.join(REPO, HIS, file);
  if (!existsSync(abs)) { say(`MISSING ${HIS}/${file}`); fails.push(`missing ${file}`); continue; }
  for (const [label, cwd] of [['repo-root', REPO], ['own-directory', path.join(REPO, HIS)]]) {
    const r = spawnSync('node', [abs, ...argv], { cwd, encoding: 'utf8', timeout: 300000, maxBuffer: 1 << 28 });
    const text = (r.stdout || '') + (r.stderr || '');
    // Capture what the instrument WROTE to its .out on this drive, before the next drive clobbers it.
    let wrote = null;
    if (rec && existsSync(path.join(REPO, HIS, rec))) wrote = readFileSync(path.join(REPO, HIS, rec), 'utf8');
    results.push({ file, label, status: r.status, text, wrote, rec });
    say('');
    say('='.repeat(78));
    say(`## ${file}  [cwd: ${label}]`);
    say(`exit: ${r.status}  stdout bytes: ${(r.stdout || '').length}  stderr bytes: ${(r.stderr || '').length}`);
  }
}

// --- the reproduction verdicts ---------------------------------------------
say('');
say('='.repeat(78));
say('## Reproduction — live output vs the output he committed');
say('');

const diffLines = (a, b) => {
  const A = norm(a).trimEnd().split('\n'), B = norm(b).trimEnd().split('\n');
  const n = Math.max(A.length, B.length);
  const d = [];
  for (let i = 0; i < n; i++) if (A[i] !== B[i]) d.push({ i: i + 1, his: A[i], mine: B[i] });
  return { d, aLines: A.length, bLines: B.length };
};

const repro = {};
for (const { file, label, status, wrote, rec } of results) {
  if (!rec || label !== 'repo-root') continue;
  if (wrote === null) { say(`${file}: wrote no ${rec}`); continue; }
  const { d, aLines, bLines } = diffLines(baseline[rec], wrote);
  repro[file] = { diffs: d.length, status };
  say(`${file}`);
  say(`   exit ${status} | his ${rec}: ${aLines} lines | mine: ${bLines} lines | DIFFS: ${d.length}`);
  d.slice(0, 20).forEach(({ i, his, mine }) => {
    say(`     L${i} his:  ${his === undefined ? '<absent>' : his.slice(0, 150)}`);
    say(`     L${i} mine: ${mine === undefined ? '<absent>' : mine.slice(0, 150)}`);
  });
  if (d.length > 20) say(`     … and ${d.length - 20} more differing lines`);
}

// Cwd-independence, measured the same way he measured mine.
say('');
say('## Cwd-independence (his own §5 property, applied to his own four)');
for (const { file } of INSTRUMENTS) {
  const root = results.find((r) => r.file === file && r.label === 'repo-root');
  const own = results.find((r) => r.file === file && r.label === 'own-directory');
  if (!root || !own) continue;
  const threw = /^\s*(?:node:internal|Error:|throw er;)|\bENOENT\b/m.test(own.text) ? ' (own-dir text contains a throw/ENOENT)' : '';
  say(`   ${file.padEnd(36)} root exit ${String(root.status).padStart(3)} | own-dir exit ${String(own.status).padStart(3)} | same: ${root.status === own.status}${threw}`);
}

// Headline figures lifted out of the live text, so they are read rather than recalled.
say('');
say('## His headline figures, read out of this fire\'s own drive');
const live = results.find((r) => r.file === 'sec3-rekeyed-on-the-call-shape.mjs' && r.label === 'repo-root');
const grab = (re) => { const m = re.exec(live ? live.text : ''); return m ? m[1] : 'UNREAD'; };
say(`   denominator (bullet lines in segment):     ${grab(/bullet lines in the segment \(the DENOMINATOR\): (\d+)/)}`);
say(`   KLATCH-REACHABLE:                          ${grab(/KLATCH-REACHABLE bullets: (\d+) of/)}`);
say(`   …behavioural:                              ${grab(/of which behavioural \(not docs:\/internal:\/chore:\): (\d+)/)}`);
say(`   UNMODELLED V1 -> V2:                       ${grab(/UNMODELLED: V1 (\d+)/)} -> ${grab(/UNMODELLED: V1 \d+\s+->\s+V2 (\d+)/)}`);
say(`   GATE line:                                 ${grab(/^(GATE: .*)$/m)}`);
say(`   PREDICTIONS line:                          ${grab(/^(PREDICTIONS: .*)$/m)}`);

say('');
say('='.repeat(78));
const allZero = Object.values(repro).every((r) => r.diffs === 0);
gate('every recorded output reproduces after normalisation', allZero,
  Object.entries(repro).map(([f, r]) => `${f}=${r.diffs}`).join(' '));
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join(', ') + ')'}`);
say(`SUMMARY: his ${HIS_REV} driven at my ${REV.slice(0, 8)} | ` +
  Object.entries(repro).map(([f, r]) => `${f.replace('.mjs', '')} exit ${r.status} diffs ${r.diffs}`).join(' | '));

writeFileSync(path.join(import.meta.dirname, 'drive-his-419.out'), out.join('\n') + '\n');

// Restore HIS committed .out files — this instrument must not leave his record overwritten with
// this fire's drive. (Round 358: do not touch the index while the sweep drives; the same courtesy
// applies to another seat's recorded output.)
for (const { rec } of INSTRUMENTS) {
  if (!rec) continue;
  const r = git('checkout', '--', `${HIS}/${rec}`);
  if (r.status !== 0) console.log(`WARN could not restore ${rec}: ${String(r.stderr).trim()}`);
}
const dirty = git('status', '--porcelain', '--', HIS).stdout.trim();
console.log(`his directory restored clean: ${dirty === '' ? 'true' : 'FALSE — ' + dirty}`);

if (fails.length) process.exit(1);
