#!/usr/bin/env node
// unit-464rec3 — S2's pin has drifted (census drive1: derived dee68c0f, sibling's literal
// ff93ad0a). Drift of the KEY is not yet harm to the VALUE. This probe asks the only question
// that settles whether the live probe is reading the wrong text today:
//
//   is the `const renamedAway = …` line byte-identical at ff93ad0a and at dee68c0f?
//
// A guard on identity does not guard value, and the converse holds too: a key that has moved
// has not necessarily moved what it selects. Both halves get measured, not asserted.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => {
  try {
    return execFileSync('git', args, {
      cwd: REPO,
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
};

const HIS_396_PATH =
  'docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs';
const AT_ADD = 'ff93ad0a'; // the add event — what his round396 published, and what the sibling grade pins
const AT_RECENCY = 'dee68c0f'; // what the probe's `log -1` resolves to today

console.log(`# unit-464rec3 — does S2's drift change the lifted value?`);
console.log(`# rev ${git(['rev-parse', 'HEAD']).trim()}\n`);

const lift = (rev) => {
  const src = git(['show', `${rev}:${HIS_396_PATH}`]);
  if (src === null) return { rev, refused: true };
  const line = (src.match(/^const renamedAway = .*$/m) ?? [null])[0];
  return { rev, refused: false, bytes: Buffer.byteLength(src, 'utf8'), line };
};

const a = lift(AT_ADD);
const b = lift(AT_RECENCY);

for (const x of [a, b]) {
  const tag = x.rev === AT_ADD ? 'ADD     ' : 'RECENCY ';
  if (x.refused) {
    console.log(`[MEAS] ${tag} ${x.rev}: REFUSED — the path does not exist at this rev`);
    continue;
  }
  console.log(`[MEAS] ${tag} ${x.rev}: file ${x.bytes} B`);
  console.log(`         line: ${x.line === null ? 'NO `const renamedAway =` LINE' : x.line}`);
}

// ── the two questions, kept apart ────────────────────────────────────────────────────────────
const fileMoved = !a.refused && !b.refused && a.bytes !== b.bytes;
const lineMoved = !a.refused && !b.refused && a.line !== b.line;
const lineExistsAtBoth = !a.refused && !b.refused && a.line !== null && b.line !== null;

console.log(`\n[MEAS] the FILE differs between the two revs: ${fileMoved}`);
console.log(`[MEAS] the LIFTED LINE differs between the two revs: ${lineMoved}`);
console.log(`[MEAS] the lifted line is present at BOTH revs: ${lineExistsAtBoth}`);

// The probe's own refusal path fires only when the line is absent. So the reachable states are:
//   line absent at the drifted rev  -> the probe REFUSES, loudly. Safe.
//   line present but different      -> the probe LIFTS THE WRONG TEXT, silently. The harm.
//   line present and identical      -> drift of the key, no harm to the value, today only.
const state = a.refused || b.refused
  ? 'REFUSED'
  : !lineExistsAtBoth
    ? 'LOUD — the probe refuses at the drifted rev'
    : lineMoved
      ? 'SILENT HARM — the probe lifts a different line than its own comment claims'
      : 'KEY-ONLY — the key has moved, the value has not, at this rev';
console.log(`\n[VERDICT] S2 today: ${state}`);

// And the half that does not depend on today's bytes: what makes it safe, or not?
// REPAIRED after drive2. The first version of this block printed a single fixed sentence —
// "what protects the value today is that the round398 commit did not edit this line" — beside a
// verdict that had just reported the opposite. It was written as the KEY-ONLY state's sentence
// and printed unconditionally, so it shipped false the moment the state was SILENT HARM. The
// sentence is now derived from `state`, which is derived from the bytes.
const closing = {
  'REFUSED': `the lift cannot be performed at one of the two revs, so nothing is claimed here.`,
  'LOUD — the probe refuses at the drifted rev':
    `the drift is self-announcing: the probe's own refusal path fires, because the line it ` +
    `matches on is absent at the drifted rev. Noisy, and therefore safe.`,
  'SILENT HARM — the probe lifts a different line than its own comment claims':
    `the drifting commit DID edit the lifted line, so nothing protects the value — the probe ` +
    `reads a text its own comment says it is not reading, and its output says nothing about it. ` +
    `Direction matters: the ADD rev holds the DEFECT this probe exists to grade and the ` +
    `RECENCY rev holds the CURE, so the probe grades the defect against the fixed state.`,
  'KEY-ONLY — the key has moved, the value has not, at this rev':
    `the key has moved but the drifting commit happened not to touch the lifted line. What ` +
    `protects the value is that accident, not anything in the probe; the next edit that does ` +
    `touch it makes the lift wrong, and nothing in the probe's output would say so.`,
}[state];
console.log(`[MEAS] ${closing}`);
