/**
 * Round 447 — drive `round443-instruments/grade-the-emitter-at-its-published-line.mjs` in every
 * configuration this round claims a reading for, and record each one.
 *
 * Four recordings, and the last two are the ones that matter:
 *
 *   1. `drive1.clean.out`            — the gate, with `G4` re-keyed and reaching its figure
 *   2. `drive2.g4key-crippled.out`   — `G4`'s property resolver swapped back for the Round 443 TEXT
 *                                      PIN. `G4` must go RED, and the row that disagrees must be
 *                                      `R2` (the subject), which is how the direction of the old
 *                                      key's error was established rather than reasoned about.
 *   3. `drive3.inert-name.out`       — a cripple name no hook implements. `G9` must go RED and the
 *                                      header must print it as INERT.
 *   4. `drive4.cripple-inertness.out` — the evidence that the three PREVIOUS cripple names were
 *                                      inert: clean vs crippled vs a SECOND clean run, so the one
 *                                      line that moves run-to-run anyway (a fresh scratch-repo
 *                                      hash) is separated from a leg actually responding. Run
 *                                      against the COMMITTED pre-repair blob, so the finding does
 *                                      not evaporate now that the registry is fixed.
 *
 * `stdio` is pinned on every child: `execFileSync` echoes a child's stderr to the parent as well as
 * capturing it, which puts another process's crash into the head of your own recording (446 §1).
 *
 * Driving it: `node docs/research/round447-instruments/record-drives.mjs`
 */

import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const OUT = HERE;
const INSTR = 'docs/research/round443-instruments/grade-the-emitter-at-its-published-line.mjs';
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim().slice(0, 8);

const run = (file, env = {}) => {
  try {
    return execFileSync('node', [file], {
      cwd: REPO,
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
  } catch (e) {
    return `DRIVE FAILED rc=${e.status}\n${e.stdout ?? ''}\n${e.stderr ?? ''}`;
  }
};

const lineStarting = (t, p) => t.split('\n').filter((l) => l.startsWith(p));
const verdict = (t) => lineStarting(t, 'VERDICT/')[0] ?? 'NO VERDICT LINE';

mkdirSync(OUT, { recursive: true });
const summary = [];

for (const [file, label, env] of [
  ['drive1.clean.out', 'clean', {}],
  ['drive2.g4key-crippled.out', 'G4KEY — the old text pin', { KLATCH_R443_G4KEY: '1' }],
  ['drive3.inert-name.out', 'an unimplemented cripple name', { KLATCH_R443_NOCATCH: '1' }],
]) {
  const text = run(INSTR, env);
  writeFileSync(join(OUT, file), text);
  const rows = text.split('\n').filter((l) => /^\s+R\d\s/.test(l)).map((l) => l.trim());
  const disagree = text.split('\n').filter((l) => l.includes('rows agreeing with their declaration'));
  summary.push({
    file, label, verdict: verdict(text),
    header: (text.split('\n').find((l) => l.startsWith('REV:')) ?? '').trim(),
    matrix: disagree.map((l) => l.trim()),
    rows: rows.length,
  });
}

// ── The inertness evidence, against the COMMITTED PRE-REPAIR BLOB ───────────────────────────────
// `HEAD~1` is this round's parent: the instrument as it stood with `IDOK`/`NOCATCH`/`GATEKEY`
// declared and unread. Written to a scratch path so the real instrument is never the subject.
const lines = [];
const blobRev = 'HEAD~1';
let pre = null;
try {
  pre = git('show', `${blobRev}:${INSTR}`);
} catch (e) {
  lines.push(`REFUSED — could not read ${blobRev}:${INSTR} — ${e.message.split('\n')[0]}`);
}
if (pre !== null) {
  // The pin is asserted by a PROPERTY, not by the rev being the right one: the blob must declare
  // the three dead names and must NOT carry this round's registry. If that inverts, the recording
  // says so instead of silently driving the repaired file and reporting the cripples as inert.
  const declaresDead = pre.includes("const CRIPPLED = ['KLATCH_R443_IDOK'");
  const hasRegistry = pre.includes('const IMPLEMENTED = ');
  lines.push(`PIN asserted by property, not by hash: blob declares the three dead names: `
    + `${declaresDead} · blob carries this round's registry: ${hasRegistry} `
    + `(must be true / false)`);
  if (!declaresDead || hasRegistry) {
    lines.push(`REFUSED — ${blobRev}:${INSTR} is not the pre-repair blob; not driven.`);
    writeFileSync(join(OUT, 'drive4.cripple-inertness.out'), lines.join('\n') + '\n');
    console.log(lines.join('\n'));
    process.exit(0);
  }
  lines.push('');
  // The blob must be driven at the SAME DEPTH as the real instrument. Drive 1 of this recording put
  // it under `.scratch-r447-blob/<full path>`, where the instrument's own
  // `REPO = join(HERE, '..', '..', '..')` resolved to the scratch root — so `docs/research/lib/
  // verdict.mjs` did not exist, the `await import` of the subject threw, and all THREE runs died
  // before printing a line. They were byte-identical because they were the same failure, and
  // "differ only under the cripple: []" would have read as the inertness finding off a dead drive.
  // The verdict predicate below refused instead, which is the only reason this was caught (436).
  const at = join(REPO, dirname(INSTR), '.r447-prerepair-blob.mjs');
  const rel = `${dirname(INSTR)}/.r447-prerepair-blob.mjs`;
  writeFileSync(at, pre);
  const A = run(rel, {});
  const B = run(rel, { KLATCH_R443_IDOK: '1', KLATCH_R443_NOCATCH: '1', KLATCH_R443_GATEKEY: '1' });
  const C = run(rel, {});
  const diff = (x, y) => {
    const a = x.split('\n'); const b = y.split('\n'); const o = [];
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) if (a[i] !== b[i]) o.push(i + 1);
    return o;
  };
  const ab = diff(A, B); const ac = diff(A, C);
  const only = ab.filter((n) => !ac.includes(n));
  lines.push(`PRE-REPAIR BLOB at ${blobRev}, driven three ways from ${rel}`);
  lines.push(`  three declared cripples: KLATCH_R443_IDOK, KLATCH_R443_NOCATCH, KLATCH_R443_GATEKEY`);
  lines.push('');
  // First line of each raw output, so a drive that died before printing anything is legible here
  // rather than showing up only as an absent verdict.
  for (const [n, t] of [['clean', A], ['CRIPPLED', B], ['clean#2', C]]) {
    lines.push(`  ${n.padEnd(9)} first line: ${(t.split('\n')[0] ?? '(empty)').slice(0, 110)}`);
  }
  lines.push('');
  lines.push(`  clean   verdict: ${verdict(A)}`);
  lines.push(`  CRIPPLED verdict: ${verdict(B)}`);
  lines.push(`  clean#2 verdict: ${verdict(C)}`);
  lines.push(`  verdict lines identical across all three: ${verdict(A) === verdict(B) && verdict(A) === verdict(C)}`);
  lines.push(`  all three REACHED a verdict (a dead drive cannot grade a cripple): `
    + `${verdict(A) !== 'NO VERDICT LINE' && verdict(B) !== 'NO VERDICT LINE' && verdict(C) !== 'NO VERDICT LINE'}`);
  lines.push('');
  lines.push(`  clean vs CRIPPLED differing lines: ${JSON.stringify(ab)}`);
  lines.push(`  clean vs clean#2 differing lines:  ${JSON.stringify(ac)}  <- run-to-run noise`);
  lines.push(`  differ ONLY under the cripple:     ${JSON.stringify(only)}`);
  for (const n of only) {
    lines.push(`    line ${n} clean   : ${(A.split('\n')[n - 1] ?? '').trim()}`);
    lines.push(`    line ${n} CRIPPLED: ${(B.split('\n')[n - 1] ?? '').trim()}`);
  }
  lines.push('');
  const reached = [A, B, C].every((t) => verdict(t) !== 'NO VERDICT LINE');
  const headerOnly = only.length === 1 && (A.split('\n')[only[0] - 1] ?? '').startsWith('REV:');
  lines.push('');
  lines.push(`VERDICT: the three cripples are INERT — all three runs reached a verdict AND the only `
    + `line that responds to the cripple is the header itself: ${reached && headerOnly}`);
  // The scratch copy is removed, so this driver leaves no untracked file behind.
  rmSync(at, { force: true });
  lines.push(`scratch copy removed: ${!existsSync(at)}`);
}
writeFileSync(join(OUT, 'drive4.cripple-inertness.out'), lines.join('\n') + '\n');

console.log(`round447 recordings at ${REV}`);
for (const s of summary) {
  console.log(`\n── ${s.file}  (${s.label})`);
  console.log(`   ${s.header}`);
  console.log(`   ${s.verdict}`);
  console.log(`   matrix rows printed: ${s.rows} · ${s.matrix.join(' · ')}`);
}
console.log(`\n── drive4.cripple-inertness.out`);
console.log(lines.filter((l) => l.startsWith('VERDICT:') || l.includes('differ ONLY')).join('\n'));
