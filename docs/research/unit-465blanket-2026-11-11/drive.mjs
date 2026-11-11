// Driver for the 2026-11-11 START-fire blanket-substitution arms.
// spawnSync (not execFileSync) so the child's stderr lands in the RECORDING
// rather than being echoed into this driver's own output.
// Absolute paths throughout: an argv script path resolves against the CHILD's cwd.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const arms = ['A0', 'A1', 'A2'];

for (const a of arms) {
  const r = spawnSync(process.execPath, [path.join(here, `${a}.mjs`)], {
    encoding: 'utf8',
    cwd: here,
  });
  const body = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  writeFileSync(path.join(here, `${a}.out`), body);
  const headline = (r.stdout ?? '').split('\n').find((l) => l.includes('self-check'))
    ?? (r.stderr ?? '').split('\n').find((l) => l.includes('SELF-CHECK'))
    ?? '(no self-check line found — that itself is the finding)';
  // `body.length` is UTF-16 code units, NOT bytes — the output carries `…`, `—`, `≤`,
  // so the two differ by 156 here. Labelling the character count "bytes" is how a
  // figure gets compared against a `wc -c`/filesystem figure from another fire and
  // read as a 156-byte shrink that never happened. Print both, labelled.
  const utf8 = Buffer.byteLength(body, 'utf8');
  console.log(`${a}  rc=${r.status}  signal=${r.signal ?? 'none'}  utf8Bytes=${utf8}  chars=${body.length}`);
  console.log(`     headline: ${headline.trim()}`);
}
