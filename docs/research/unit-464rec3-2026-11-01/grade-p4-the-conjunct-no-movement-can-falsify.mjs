#!/usr/bin/env node
// unit-464rec3 — P4, graded AS-REGISTERED, before any cure in this unit lands.
//
// The claim: S3's verdict conjunct `theFixCommit.length > 8` cannot be falsified by any recency
// movement, so the value's presence in the verdict is not the same as the value being
// load-bearing there. A guard on presence is not a guard on identity.
//
// The cripple perturbs the KEY (which commit `theFixCommit` resolves to), never the SUBJECT
// (the instrument's source). Its evidence is the delta between arms, not either arm's absolute
// value: an arm's figure alone cannot tell a reached leg from an unreachable one.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => {
  try {
    return execFileSync('git', args, {
      cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
};

const S3_FILE = 'docs/research/round397-instruments/grade-the-anchor-that-is-not-guarded.mjs';
const MY_395_PATH =
  'docs/research/round395-instruments/grade-the-refusal-that-deletes-the-verdict.mjs';

console.log(`# unit-464rec3 — P4 graded as-registered, rev ${git(['rev-parse', 'HEAD']).trim()}`);
const src = readFileSync(join(REPO, S3_FILE), 'utf8');

// The predicate is READ OFF THE SOURCE, not retyped here. Retyping it would grade my own
// transcription of the conjunct rather than the conjunct.
const verdictLine = src.split('\n')[274];
const predicate = (verdictLine.match(/theFixCommit\.(\w+) (\S+) (\d+)/) ?? null);
if (predicate === null) {
  console.log(`REFUSED: :275 does not match the expected \`theFixCommit.<prop> <op> <n>\` shape.`);
  console.log(`         :275 = ${verdictLine.trim()}`);
  process.exit(1);
}
const [, prop, op, bound] = predicate;
console.log(`[MEAS] the conjunct, lifted from :275: theFixCommit.${prop} ${op} ${bound}`);

// The arms. Each is a candidate value for the key; the subject is untouched in all of them.
const arms = {
  'NO-CRIPPLE (live: log -1 on the path)': (git(['log', '-1', '--format=%h %s', '--', MY_395_PATH]) ?? '').trim(),
  'KP (the add event — a DIFFERENT, correct commit)': (git(['log', '--diff-filter=A', '--format=%h %s', '--', MY_395_PATH]) ?? '').trim(),
  'KP (the repo root commit — maximally wrong, still a real commit)': (git(['log', '--reverse', '--format=%h %s', 'HEAD']) ?? '').split('\n')[0].trim(),
  'CONTROL (empty — what a refusing git would yield)': '',
};

const evalConjunct = (value) => {
  if (prop !== 'length' || op !== '>') return null; // refuse rather than guess at another shape
  return value.length > Number(bound);
};

console.log(`\n# arm → the value the key resolves to → the conjunct's truth`);
const results = {};
for (const [arm, value] of Object.entries(arms)) {
  const truth = evalConjunct(value);
  results[arm] = truth;
  const shown = value === '' ? '(empty)' : value.length > 60 ? value.slice(0, 57) + '…' : value;
  console.log(`[MEAS] ${truth === null ? 'REFUSED' : String(truth).padEnd(5)}  ${shown}`);
  console.log(`         arm: ${arm}`);
}

// ── the delta, which is the actual evidence ──────────────────────────────────────────────────
const live = results['NO-CRIPPLE (live: log -1 on the path)'];
const movedArms = Object.entries(results).filter(([a]) => a.startsWith('KP'));
const anyKpMoved = movedArms.some(([, t]) => t !== live);
console.log(`\n[MEAS] the live arm's conjunct: ${live}`);
console.log(`[MEAS] any KP arm — a different, real commit — moves the conjunct: ${anyKpMoved}`);
console.log(
  `[P4] the conjunct cannot be falsified by any recency movement ` +
    `(every KP arm leaves it unmoved): ${anyKpMoved === false}`,
);

// The CONTROL exists so that "nothing moves it" cannot be read as "the leg is unreachable".
const control = results['CONTROL (empty — what a refusing git would yield)'];
console.log(
  `[MEAS] the CONTROL arm (empty value) moves it: ${control !== live} — ` +
    `so the leg IS reached and IS evaluable; what it cannot distinguish is WHICH commit, ` +
    `only WHETHER there is one.`,
);
console.log(
  `[MEAS] therefore Theseus's "display only" is right in effect and wrong in location: the ` +
    `value sits INSIDE the verdict conjunction at :275, and is harmless there only because the ` +
    `conjunct tests presence. The published identity claim at :263 — "the fix is its own ` +
    `commit: <sha>" — is the reachable harm, and no leg guards it.`,
);
