/**
 * Round 442 vacuity harness. Each cell cripples a named property of the SUBJECT
 * (`docs/research/lib/verdict.mjs`) and requires a NAMED FIGURE in the grader to move — never
 * merely that the gate flipped, and never merely that the edit landed (347/389/422).
 *
 * The subject is crippled, not the grader: these legs are about the emitter, so a cell that edited
 * the grader would be grading the grader's own text.
 *
 * Both halves are asserted per cell:
 *   1. the anchor occurs EXACTLY ONCE in the subject, so the cripple cannot silently no-op, and
 *   2. the cell's named figure DIFFERS between the baseline drive and the crippled drive.
 *
 * A cell whose figure cannot be read out of either drive is reported UNREADABLE, not VACUOUS —
 * an instrument that cannot refuse manufactures findings (436), and `null !== false` has been
 * published as a defect on this project.
 *
 * The copies live dot-prefixed and pid-stamped in this directory and are removed at exit; the
 * subject is restored by byte comparison, not by `git checkout`, because `git checkout` has
 * already been observed restoring a file to its fifth re-stamp rather than to its original.
 */

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SUBJECT = join(REPO, 'docs/research/lib/verdict.mjs');
const GRADER = join(HERE, 'grade-the-shared-verdict-emitter.mjs');
const BACKUP = join(HERE, `.r442-subject-backup-${process.pid}.mjs`);

const drive = () => {
  const r = execFileSync('node', [GRADER], {
    encoding: 'utf8', maxBuffer: 1 << 28, cwd: REPO,
    env: { ...process.env, KLATCH_R442_DEPTH: '1' },
  });
  return r;
};

/**
 * Figure readers. Each takes the grader's whole output and returns a string, or `null` when the
 * figure is not present — `null` is an UNREADABLE cell, never a moved one.
 *
 * Each reader is a SLICE of the grader's own detail line, keyed on the leg id, and not a
 * re-derivation of the figure (369/412).
 */
const legDetail = (text, id) => {
  const lines = text.split('\n');
  const i = lines.findIndex((l) => new RegExp(`^(?: ok |FAIL|REF ) ${id}  `).test(l));
  if (i === -1 || i + 1 >= lines.length) return null;
  return lines[i + 1].trim();
};
const predDetail = (text, id) => {
  const lines = text.split('\n');
  const i = lines.findIndex((l) => new RegExp(`^(?:LANDED|REFUTED|REFUSED) +${id}  `).test(l));
  if (i === -1 || i + 1 >= lines.length) return null;
  return lines[i + 1].trim();
};

const CELLS = [
  {
    id: 'C1',
    why: 'Drop the `refused=` field from the rendered line. The property under test is G5/P2\'s: '
      + 'that a list is NEVER absent, which is what makes "names no legs" unrepresentable. The '
      + 'figure that must move is P2\'s inferable count, which should go from 0 to 36.',
    anchor: "    `refused=${renderList(L.null)}`,\n",
    replace: '',
    figure: (t) => predDetail(t, 'P2'),
  },
  {
    id: 'C2',
    why: 'Make `topToken` return `ok` when there are refused legs but no red ones. The property '
      + 'under test is G6\'s confusion matrix. The figure that must move is G6\'s tp/tn/fp/fn row — '
      + 'and specifically `fp`, the cell that is the whole reason this file exists.',
    anchor: "  if (refused.length > 0) return 'REFUSED';\n",
    replace: "  if (refused.length > 0) return 'ok';\n",
    figure: (t) => legDetail(t, 'G6'),
  },
  {
    id: 'C3',
    why: 'Make `isTracked` always answer false. The property under test is G7\'s write guard. The '
      + 'figure that must move is G7\'s detail row, in which `threw TrackedTargetError` must stop '
      + 'being true and the fixture must stop being byte-identical after the refusal.',
    anchor: '    return true;\n  } catch {\n    return false;\n  }\n',
    replace: '    return false;\n  } catch {\n    return false;\n  }\n',
    figure: (t) => legDetail(t, 'G7'),
  },
];

const original = readFileSync(SUBJECT, 'utf8');
copyFileSync(SUBJECT, BACKUP);

const out = [];
out.push(`SUBJECT: docs/research/lib/verdict.mjs`);
out.push('');

let baseline;
try {
  baseline = drive();
} catch (e) {
  baseline = (e.stdout ?? '') + (e.stderr ?? '');
}
out.push(`baseline drive captured: ${baseline.split('\n').length} line(s)`);
out.push('');

let moved = 0; let vacuous = 0; let unreadable = 0;
try {
  for (const cell of CELLS) {
    const occurrences = original.split(cell.anchor).length - 1;
    if (occurrences !== 1) {
      out.push(`UNREADABLE ${cell.id}  anchor occurs ${occurrences}× in the subject, not exactly 1 — `
        + 'the cripple cannot be shown to have landed, so this cell grades nothing');
      out.push(`        ${cell.why}`);
      unreadable += 1;
      continue;
    }
    writeFileSync(SUBJECT, original.replace(cell.anchor, cell.replace));
    let crippled;
    try { crippled = drive(); } catch (e) { crippled = (e.stdout ?? '') + (e.stderr ?? ''); }
    writeFileSync(SUBJECT, original);

    const before = cell.figure(baseline);
    const after = cell.figure(crippled);
    let verdict;
    if (before === null || after === null) {
      verdict = 'UNREADABLE';
      unreadable += 1;
    } else if (before !== after) {
      verdict = 'MOVED';
      moved += 1;
    } else {
      verdict = 'VACUOUS';
      vacuous += 1;
    }
    out.push(`${verdict.padEnd(10)} ${cell.id}  anchor 1× · figure ${verdict === 'MOVED' ? 'differs' : verdict === 'VACUOUS' ? 'IDENTICAL' : 'not readable in one or both drives'}`);
    out.push(`        ${cell.why}`);
    out.push(`        before: ${before === null ? '(unreadable)' : before}`);
    out.push(`        after:  ${after === null ? '(unreadable)' : after}`);
  }
} finally {
  // Restore by byte comparison, not by `git checkout`.
  writeFileSync(SUBJECT, original);
  const restored = readFileSync(SUBJECT, 'utf8') === original;
  out.push('');
  out.push(`subject restored byte-identical: ${restored}`);
  if (!restored && existsSync(BACKUP)) copyFileSync(BACKUP, SUBJECT);
  rmSync(BACKUP, { force: true });
}

out.push('');
out.push(`VACUITY: ${moved} MOVED, ${vacuous} VACUOUS, ${unreadable} UNREADABLE, of ${CELLS.length} cell(s)`);
console.log(out.join('\n'));
process.exitCode = moved === CELLS.length ? 0 : 1;
