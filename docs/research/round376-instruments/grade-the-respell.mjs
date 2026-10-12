// Grades the RESPELLED A0/A1 against the four states that decide it, by copying the respelled
// probe into each sandbox and driving it there. Required polarity:
//   376a (cure as shipped)                 → green   (control: the copy is the file)
//   376g (cure + comment quoting the line)  → green   (the Round 375 false-green state)
//   376b (behaviour-preserving refactor)    → green   (the Round 376 false-red state)
//   376c (B4 re-keyed to a frozen copy)     → RED     (the drift the pair exists for)
import { cpSync, copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const R374 =
  'scripts/probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts';
const R373 = 'scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts';
const PRE =
  'const refusalInSubject = (r225Src.match(/probe-round223b: something already holds 3001/g) || []).length;';

// 376g — the cure, documented the way a repair commit documents itself.
rmSync('.testdata/round376g', { recursive: true, force: true });
cpSync('.testdata/round376a', '.testdata/round376g', { recursive: true });
rmSync('.testdata/round376g/.git', { recursive: true, force: true });
{
  const f = join('.testdata/round376g', R373);
  const src = readFileSync(f, 'utf8');
  writeFileSync(
    f,
    `${src}\n/**\n * Round 375, for the record, the line this file used to carry:\n *   ${PRE}\n */\n`,
  );
}

const want = { round376a: 0, round376g: 0, round376b: 0, round376c: 1 };
for (const [arm, expected] of Object.entries(want)) {
  copyFileSync(R374, join('.testdata', arm, R374)); // the respelled guard, same bytes everywhere
  const r = spawnSync('npx', ['tsx', join('.testdata', arm, R374)], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const fails = out
    .split('\n')
    .filter((l) => l.startsWith('FAIL '))
    .map((l) => l.slice(5).split(/\s+/)[0]);
  const pass = /All 8 regression checks passed/.test(out);
  const verdict = r.status === expected ? 'AS REQUIRED' : '*** WRONG POLARITY ***';
  console.log(
    `${arm}  exit ${String(r.status).padEnd(4)} want ${expected}  ` +
      `${pass ? 'All 8 passed' : `FAIL ${fails.join(' ') || '(crashed, no arm line)'}`}  → ${verdict}`,
  );
}
