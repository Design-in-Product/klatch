/**
 * unit-465repromote. Drive the five grader probes (rounds 372, 373, 374, 375, 377) and
 * record each one's exit code and conclusion line.
 *
 * Tag comes from argv so the SAME instrument records the pre-edit and post-edit arms —
 * a hand-typed second reader is not a slice of the first. Output is appended under a
 * timestamped header rather than written, because `unit-465adopt` lost a grading
 * artefact to a `writeFileSync` on a tag-keyed filename.
 *
 * Usage: npx tsx docs/research/unit-465repromote-2026-11-08/drive-graders.mts <tag>
 *        (run from the repo root; the probe paths below resolve against the repo root)
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.join(HERE, '../../..');
const tag = process.argv[2];
if (!tag) throw new Error('usage: drive-graders.mts <tag>');

const PROBES: Array<[string, string]> = [
  ['round372', 'probe-round372-the-rows-are-keyed-on-the-limb-and-the-contradiction-is-latent.mts'],
  ['round373', 'probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts'],
  [
    'round374',
    'probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts',
  ],
  [
    'round375',
    'probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts',
  ],
  [
    'round377',
    'probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts',
  ],
];

const rows: string[] = [];
for (const [short, file] of PROBES) {
  const abs = path.join(ROOT, 'scripts', file);
  if (!fs.existsSync(abs)) throw new Error(`probe not present: ${abs}`);
  let out = '';
  let code = 0;
  try {
    // stdio pipe on BOTH streams: execFileSync otherwise echoes the child's stderr
    // into this recording, which contaminated a prior unit's artefacts.
    out = execFileSync('npx', ['tsx', abs], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 300_000,
    });
  } catch (e: any) {
    code = typeof e.status === 'number' ? e.status : -1;
    out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }
  fs.writeFileSync(path.join(HERE, 'scratch', `${tag}-${short}.out`), out);
  // The conclusion line, captured off the run rather than re-typed.
  const concl =
    out
      .split('\n')
      .filter((l) => /regression check/.test(l) || /did not run:/.test(l))
      .slice(-1)[0] ?? '(no conclusion line)';
  rows.push(`${short}  exit=${code}  ${concl.trim()}`);
  console.log(rows[rows.length - 1]);
}

fs.appendFileSync(
  path.join(HERE, 'grader-grading.txt'),
  `\n## ${tag} — ${new Date().toISOString()}\n${rows.join('\n')}\n`
);
