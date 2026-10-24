// Post-commit re-drive, diffed against the committed pre-commit recordings. The cells that read
// HEAD (R2, R3, and every `SHORT` label) move when the commit lands; R1 is pinned at 33282e7d and
// must not. A reread cannot catch this class — only a re-drive and a diff of the VERDICT map can.
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const git = (...a) => execFileSync('git', ['-C', process.cwd(), ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const HEAD = git('rev-parse', 'HEAD').trim().slice(0, 8);
const D = 'docs/research/round447-instruments/';
const INSTR = 'docs/research/round443-instruments/grade-the-emitter-at-its-published-line.mjs';
const run = (env) => {
  try {
    return execFileSync('node', [INSTR], {
      encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
  } catch (e) { return (e.stdout ?? '') + (e.stderr ?? ''); }
};
const verdict = (t) => t.split('\n').filter((l) => l.startsWith('VERDICT/'))[0] ?? 'NO VERDICT LINE';
const gate = (t) => t.split('\n').filter((l) => l.startsWith('GATE: '))[0] ?? 'NO GATE LINE';
const rows = (t) => t.split('\n').filter((l) => /^\s+R\d\s/.test(l))
  .map((l) => l.trim().replace(/@ [0-9a-f]{8}/g, '@ <rev>'));
const agree = (t) => (t.split('\n').find((l) => l.includes('rows agreeing')) ?? '').trim();

console.log('HEAD is now ' + HEAD + '\n');
const CASES = [
  ['drive1.clean.out', {}],
  ['drive2.g4key-crippled.out', { KLATCH_R443_G4KEY: '1' }],
  ['drive3.inert-name.out', { KLATCH_R443_NOCATCH: '1' }],
];
let allSame = true;
for (const [file, env] of CASES) {
  const before = readFileSync(D + file, 'utf8');
  const after = run(env);
  writeFileSync('.scratch-r447/post.' + file, after);
  const vSame = verdict(before) === verdict(after);
  const gSame = gate(before) === gate(after);
  const rSame = JSON.stringify(rows(before)) === JSON.stringify(rows(after));
  const aSame = agree(before) === agree(after);
  if (!(vSame && gSame && rSame && aSame)) allSame = false;
  console.log('── ' + file);
  console.log('   pre : ' + verdict(before));
  console.log('   post: ' + verdict(after));
  console.log('   VERDICT identical: ' + vSame + ' · GATE identical: ' + gSame
    + ' · matrix rows identical (rev labels normalised): ' + rSame + ' · ' + aSame);
  if (!rSame) {
    const a = rows(before); const b = rows(after);
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      if (a[i] !== b[i]) console.log('     row ' + i + '\n       pre : ' + a[i] + '\n       post: ' + b[i]);
    }
  }
  // the one field that MOVES across the commit, reported not gated
  const revLine = (t) => (t.split('\n').find((l) => l.startsWith('REV:')) ?? '').trim();
  console.log('   REV field (expected to move): pre ' + revLine(before).slice(0, 18)
    + ' → post ' + revLine(after).slice(0, 18));
  console.log('');
}
// R1 is pinned and must read the same rev in both
const pinned = (t) => (t.split('\n').find((l) => l.includes('R1  his P2 @')) ?? '').trim();
const b1 = readFileSync(D + 'drive1.clean.out', 'utf8');
const a1 = run({});
console.log('R1 pinned row, pre : ' + pinned(b1));
console.log('R1 pinned row, post: ' + pinned(a1));
console.log('R1 pin did NOT move across the commit: ' + (pinned(b1) === pinned(a1)));
console.log('\nALL verdict maps identical across the commit: ' + allSame);
