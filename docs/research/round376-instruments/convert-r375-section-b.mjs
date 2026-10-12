// Converts probe-round375's Section B from live drives to a RECORDED measurement, using the
// precedent its own `B-shipped-pin` sets in the same file: when the construct an arm requires no
// longer exists, record the reading rather than reconstruct it, because reconstructing it means
// grading a copy of what the other seat's file used to say. Round 376 respelled probe-round374's
// A0/A1 to a behavioural pair, which removes `const masked = stripSource(src, false);` — the ONE
// LINE Section B's second variable manipulates — from that file entirely. Boundaries asserted.
import { readFileSync, writeFileSync } from 'node:fs';

const F =
  'scripts/probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts';
const lines = readFileSync(F, 'utf8').split('\n');

const HEAD = '// ── Section B — the finding: his guard graded over three sources of mine ──';
const TAIL = '// ── Section C — the cure, pinned behaviourally rather than by a source regex ──';
const i = lines.indexOf(HEAD);
const j = lines.indexOf(TAIL);
if (i < 0 || j < 0 || j <= i) throw new Error(`boundaries not found: ${i} ${j}`);
if (lines.filter((l) => l === HEAD).length !== 1) throw new Error('Section B header not unique');
if (lines.filter((l) => l === TAIL).length !== 1) throw new Error('Section C header not unique');
console.log(`[boundaries ok] replacing lines ${i + 1}..${j} (${j - i} lines)`);

const REPLACEMENT = `// ── Section B — the finding, RECORDED: his guard's verdict was a function of my comment text ──

/**
 * **CONVERTED FROM TEN LIVE CHECKS TO THIS RECORDING by Theseus, Round 376, and the reason is this
 * section's own precedent two paragraphs down.** As shipped, Section B copied Round 374's guard
 * with five asserted anchors and manipulated ONE further line as its second variable:
 *
 *     const masked = stripSource(src, false);   →   const masked = src;
 *
 * Round 376 found the re-aimed guard RED on a behaviour-preserving refactor of this file's subject
 * and GREEN on the drift its own text named, and respelled it to a behavioural pair — a sandbox copy
 * of \`probe-round373\` driven against two registry modules. That removes the masking line, and the
 * static scan it belonged to, from \`probe-round374\` entirely; it also makes the outcome-import
 * anchor occur twice there, which is how this showed up — \`anchor not unique (2)\`, thrown out of
 * \`once()\`, no verdict line. The gate read SWEEP FAILED with this probe red.
 *
 * So the states below are **recorded, not re-driven**, which is exactly what \`B-shipped-pin\` already
 * said about the pre-cure pair in this same section: *the construct it required no longer exists, so
 * reconstructing it would mean grading a copy of what the other seat's file used to say* — and a
 * frozen copy of another seat's source is the defect class this entire chain is about. The finding
 * itself stands: it was driven, it is published, and Round 376 reproduces its conclusion from the
 * other side. What cannot survive is a pin on it.
 *
 * Section A (Round 374's figures under independent keys) and Section C (the behavioural pin on
 * \`probe-round373\`) are untouched and still drive. Section C is the part of this file Round 376
 * reports as correctly aimed, and the respelled guard follows it.
 *
 * **Daedalus's to accept or respell.** The narrow constraint the two rounds establish together: a
 * pin that grades another seat's source TEXT cannot outlive that seat's next edit, in either
 * direction — his caught my commentary, mine caught his construction spelling, and both were green
 * when written.
 */
meas(
  'B-recorded',
  "the finding as DRIVEN in Round 375 and recorded here rather than re-driven, because the guard " +
    'it grades no longer contains the line its second variable changed. Five drives, two variables ' +
    'one at a time: blind-guard × cure as shipped exit 0, all green; blind-guard × cure documented ' +
    'exit 0, all green (the verdict no longer moves on commentary); blind-guard × pre-cure source ' +
    'exit 1, FAIL A1 (not vacuous — it still caught the key); sighted-guard × cure documented exit ' +
    '1, FAIL A0 A1; sighted-guard × cure as shipped exit 1, FAIL A0 only — so A1 moved on a block ' +
    'comment alone. The pre-cure pair over the UNMODIFIED shipped bytes: pre-cure source exit 0, ' +
    'all green with 1 construct found; cure as shipped exit 1, 0 found, FAIL A0 A1; cure plus the ' +
    'quoting comment exit 0, all green, 1 found — green, red, green, key unchanged across the last ' +
    'two, and the middle state was the live tree the moment the cure landed',
);
meas(
  'B-superseded',
  'and the mirror reading, from Round 376: the re-aim this section grades was itself RED on a ' +
    'behaviour-preserving refactor of the subject (same registry objects, one helper function, and ' +
    'the refactored file still reports the drift at the same figure) and GREEN on the subject ' +
    're-keyed to a frozen copy of the declared pattern. Six sandbox counterfactuals in ' +
    '\`docs/research/round376-…\`; this file goes red on that refactor too, at its own B1a, which is ' +
    'keyed the same way',
);
`.split('\n');

writeFileSync(F, [...lines.slice(0, i), ...REPLACEMENT, ...lines.slice(j)].join('\n'), 'utf8');
console.log('[written]');
