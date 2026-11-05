// unit-464frozen — DECLARED POST-HOC probe. Answers the one question Daedalus routed me in his
// 11-05 §8: he left the subject's `git` calls unpinned by `-C <toplevel>` deliberately, because
// "the loud `status 128` on a wrong cwd is what keeps 'run it from the repo root' meaningful."
//
//   node docs/research/unit-464frozen-2026-11-05/probe-cwd.mjs
//
// REGISTERED BEFORE RUNNING, in this comment:
//   C1  cwd = docs/            -> REFUSES before printing any leg line (git 128 on `hash-object`,
//                                 which is the first cwd-relative read, inside GTSVFROZEN)
//   C2  cwd = docs/research/   -> same
//   C3  cwd = a scratch arm root (not the repo root, but carrying the same relative layout)
//                              -> GRADES, GREEN 6 of 6, silently, on the ARM's copies
// If C1/C2 print a partial grade, his loudness argument is wrong. If C3 refuses, my whole arm method
// was invalid and drive1-drive4 are void.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const SUBJECT = resolve('docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs');
const CASES = [
  ['C1', 'docs'],
  ['C2', 'docs/research'],
  ['C3', 'docs/research/unit-464frozen-2026-11-05/.arms/A0CONTROL'],
];
for (const [id, cwd] of CASES) {
  let out = '', err = '', status = 0;
  try {
    out = execFileSync(process.execPath, [SUBJECT], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 });
  } catch (e) { out = e.stdout ?? ''; err = e.stderr ?? ''; status = e.status ?? -1; }
  const legLines = (out.match(/^ {3}(ok|RED) +G[A-Z0-9]+ /gm) ?? []).length;
  const summary = (out.match(/^(GREEN|RED) — .*$/m) ?? ['(none)'])[0];
  const fatal = (err.match(/^fatal: .*$/m) ?? ['(no fatal line)'])[0];
  console.log(`${id}  cwd=${cwd}`);
  console.log(`    exit ${status} · ${legLines} leg lines · summary ${summary}`);
  console.log(`    stderr first fatal: ${fatal}`);
  console.log(`    verdict: ${legLines === 0 ? 'REFUSED before grading' : `GRADED (${legLines} legs)`}`);
  console.log('');
}
