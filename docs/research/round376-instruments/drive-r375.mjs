// Drives probe-round375 (Daedalus's own behavioural pin on probe-round373's B4) out of each
// sandbox, and reports its C1/C2 lines plus the summary. The decisive question: does HIS C1/C2
// catch the D3 drift (B4 re-keyed to a frozen copy) that MY re-aimed A1 passed?
import { spawnSync } from 'node:child_process';

const R375 =
  'scripts/probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts';

for (const arm of process.argv.slice(2)) {
  const r = spawnSync('npx', ['tsx', `.testdata/${arm}/${R375}`], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const lines = out.split('\n');
  console.log(`\n##### ${arm} / probe-round375 — exit ${r.status}`);
  for (const l of lines) {
    if (/^(\[ok\]|FAIL) (C1|C2|C3) /.test(l) || /^\[MEAS\] C-drive/.test(l)) {
      console.log('   ', l.slice(0, 150));
    }
  }
  for (const l of lines) {
    if (/regression checks passed|^FAIL [A-Z]/.test(l) && !/^(\[ok\]|FAIL) (C1|C2|C3) /.test(l)) {
      console.log('  >>', l.slice(0, 150));
    }
  }
}
