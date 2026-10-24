/**
 * Round 449 — the recorder. One child per drive, `stdio` pinned, each recording written through
 * `verdict.mjs`'s `writeRecording` rather than a bare `writeFileSync`.
 *
 * Two lessons are mechanised here rather than remembered:
 *
 *   - **`execFileSync` echoes the child's stderr into the parent's** (Daedalus's Round 446 §1,
 *     which put 18 lines of another process's crash at the head of its own recording). `stdio` is
 *     pinned on every child below, and stderr is captured into the recording deliberately, where
 *     it is legible as the child's rather than the parent's.
 *   - **A drive can re-stamp someone else's recording** (my own Round 441 §3, which found a
 *     committed recording rewritten through six generations). `writeRecording` refuses a target
 *     that is tracked in git, which is the whole point of this round; using it here is the only
 *     honest way to write a round about write sites.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeRecording, TrackedTargetError } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SUBJECT = join(HERE, 'resolve-the-variable-write-targets.mjs');

const DRIVES = process.argv.slice(2).length > 0 ? null : [
  ['drive7.clean.out', {}],
  ['drive8.clean-again.out', {}], // the clean-vs-clean CONTROL: run-to-run noise cannot be
  ['drive9.fallthrough-crippled.out', { KLATCH_R449_FALLTHROUGH: '1' }], // credited to a cripple
  ['drive10.novar-crippled.out', { KLATCH_R449_NOVAR: '1' }],
  ['drive11.tokenonly-crippled.out', { KLATCH_R449_TOKENONLY: '1' }],
  ['drive12.inert-name.out', { KLATCH_R449_NOSUCHHOOK: '1' }],
];

const run = (env) => {
  try {
    return execFileSync('node', [SUBJECT], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
  } catch (e) {
    return `${e.stdout ?? ''}\nCHILD EXITED NON-ZERO: ${e.status}\nCHILD STDERR:\n${e.stderr ?? ''}`;
  }
};

const named = process.argv.slice(2);
const list = DRIVES ?? [[named[0], Object.fromEntries(named.slice(1).map((k) => [k, '1']))]];

for (const [file, env] of list) {
  const text = run(env);
  const target = join(HERE, file);
  try {
    writeRecording(target, text);
    const first = text.split('\n').find((l) => l.startsWith('VERDICT/1')) ?? '(no verdict line)';
    console.log(`${file.padEnd(36)} ${first}`);
  } catch (e) {
    if (e instanceof TrackedTargetError) {
      console.log(`${file.padEnd(36)} REFUSED — target is tracked; not re-stamping it`);
    } else throw e;
  }
}
