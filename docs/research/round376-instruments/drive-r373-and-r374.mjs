// Drives probe-round373 and probe-round374 out of a named sandbox and reports, per arm:
// exit code, the A1 / B4 / B4b lines verbatim, and the summary line. Unpiped inside (the whole
// stdout is captured, not a tail), because a truncated run that exits 0 with no verdict line is not
// a measurement.
import { spawnSync } from 'node:child_process';

const R373 = 'scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts';
const R374 =
  'scripts/probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts';

const arms = process.argv.slice(2);
for (const arm of arms) {
  for (const [label, rel] of [
    ['373', R373],
    ['374', R374],
  ]) {
    const r = spawnSync('npx', ['tsx', `.testdata/${arm}/${rel}`], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    const out = `${r.stdout || ''}${r.stderr || ''}`;
    const lines = out.split('\n');
    const pick = (re) => lines.filter((l) => re.test(l)).map((l) => l.slice(0, 120));
    console.log(`\n##### ${arm} / probe-round${label} — exit ${r.status}`);
    for (const l of pick(/^(\[ok\]|FAIL) (A1|B4|B4b) /)) console.log('   ', l);
    for (const l of pick(/regression checks (passed|FAILED)|^FAIL |checks? passed/)) {
      if (!/^(\[ok\]|FAIL) (A1|B4|B4b) /.test(l)) console.log('  >>', l);
    }
  }
}
