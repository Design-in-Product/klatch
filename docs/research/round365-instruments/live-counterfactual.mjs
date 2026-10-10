/**
 * Round 365 — the routed cure, driven in the PROBES rather than in my own copy of its predicate.
 *
 * A routed finding does not validate its routed cure, and a predicate graded in a harness is not
 * the same object as the cell that ships. This mutates the REAL `scripts/tsconfig.json` to exclude
 * exactly the residue file, drives both probes end to end, and restores the config byte-for-byte —
 * asserting the restore against the pre-mutation bytes rather than trusting it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = process.cwd();
const CFG = join(REPO, 'scripts', 'tsconfig.json');
const RESIDUE =
  'probe-round311-the-nearer-of-argus-two-candidates-is-the-one-that-drops-a-failure-and-a-kind-field-is-what-breaks-it.mts';

const ORIGINAL = readFileSync(CFG, 'utf8');
const anchor = '  "include": ["**/*.mts", "**/*.ts"]';
const hits = ORIGINAL.split('\n').filter((l) => l === anchor).length;
console.log(`anchor occurrences in the real config: ${hits} (must be exactly 1 before mutating)`);
if (hits !== 1) {
  console.log('GRADE setup: false — anchor is not unique, refusing to mutate');
  process.exit(1);
}

const PROBES = [
  'scripts/probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts',
  'scripts/probe-round304-the-deferral-was-repaired-with-a-declaration-and-both-repair-shapes-redden-the-arm-that-pinned-it.mts',
];

const drive = (p) => {
  const r = spawnSync('npx', ['tsx', p], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const a1b = out.split('\n').find((l) => l.includes('[A1b]')) ?? '(A1b line absent)';
  const tail = out.split('\n').find((l) => /regression checks/.test(l)) ?? '(no conclusion line)';
  return { status: r.status, a1b: a1b.trim(), tail: tail.trim() };
};

let bad = 0;
const report = (phase, p, r, wantPass) => {
  const isPass = r.a1b.includes('] PASS');
  const isFail = r.a1b.includes('] FAIL');
  const ok = wantPass ? isPass : isFail;
  if (!ok) bad += 1;
  console.log(`${ok ? 'OK  ' : 'MISS'} ${phase} · ${p.split('-type')[0].split('/').pop().slice(0, 18)}`);
  console.log(`      ${r.a1b.slice(0, 110)}`);
  console.log(`      ${r.tail} · exit ${r.status} (expected A1b ${wantPass ? 'PASS' : 'FAIL'})`);
};

try {
  console.log('\n── phase 1: real config, both probes green ──');
  for (const p of PROBES) report('BEFORE', p, drive(p), true);

  console.log('\n── phase 2: real config with the residue file excluded ──');
  writeFileSync(
    CFG,
    ORIGINAL.replace(anchor, `  "exclude": ["${RESIDUE}"],\n${anchor}`),
  );
  const mutated = readFileSync(CFG, 'utf8');
  console.log(`      mutation present in the config on disk: ${mutated.includes(RESIDUE)}`);
  if (!mutated.includes(RESIDUE)) {
    bad += 1;
    console.log('MISS  the mutation did not land — nothing below grades anything');
  }
  for (const p of PROBES) report('MUTATED', p, drive(p), false);
} finally {
  writeFileSync(CFG, ORIGINAL);
  const restored = readFileSync(CFG, 'utf8') === ORIGINAL;
  const porcelain = spawnSync('git', ['status', '--porcelain', 'scripts/tsconfig.json'], {
    cwd: REPO,
    encoding: 'utf8',
  });
  const clean = (porcelain.stdout ?? '').trim() === '';
  if (!restored || !clean) bad += 1;
  console.log(
    `\n${restored && clean ? 'OK  ' : 'MISS'} RESTORE byte-identical: ${restored} · git sees the config as unmodified: ${clean}` +
      `${clean ? '' : ` [${(porcelain.stdout ?? '').trim()}]`}`,
  );
}

console.log(`GRADE every expected verdict matched: ${bad === 0}`);
if (bad !== 0) process.exit(1);
