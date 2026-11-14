/**
 * unit-465floorstates — arm C
 *
 * Grades `P9` and the correction this unit owes its own subject:
 * `docs/research/unit-465chainfloor-2026-11-13/RESULTS.md` §0.
 *
 * This arm cures its own subject, so the two readings come from two provenances — the BASELINE from
 * the object store at the pre-registration rev (before any edit existed), the CURED state from the
 * working tree. Sourcing both from HEAD would grade one rev twice and read as a broken cure.
 *
 * It also refuses to accept a present anchor as an intact span: the false reason must be inside a
 * closed `~~…~~` strike, not merely adjacent to a `~~`.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SUBJECT = 'docs/research/unit-465chainfloor-2026-11-13/RESULTS.md';
const PREREG_REV = process.env.PREREG_REV || '5ed6886d';

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) {
    refused.push(id);
    console.log(`  REFUSED ${id}  ${detail}`);
  } else if (ok) {
    console.log(`  ok      ${id}  ${detail}`);
  } else {
    red.push(id);
    console.log(`  RED     ${id}  ${detail}`);
  }
}
function pred(id, held, detail) {
  preds.push(id);
  if (held) console.log(`  LANDED  ${id}  ${detail}`);
  else {
    refuted.push(id);
    console.log(`  REFUTED ${id}  ${detail}`);
  }
}

const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// The sentence that was false. Captured as the distinctive clause, not retyped whole.
const FALSE_REASON = 'so a single throw can only ever name one';
const VERDICT_SENTENCE = '"names\nboth" is **unsatisfiable**, not merely unmet.';
const CORRECTION_ANCHOR = 'Correction to the correction, 2026-11-14';
const CELL_ANCHOR = '`sepN-bndA`';

// ------------------------------------------------------------------ baseline (object store)

const BASE = git('show', `${PREREG_REV}:${SUBJECT}`);
const baseHasFalseReason = BASE.includes(FALSE_REASON);
const baseHasCorrection = BASE.includes(CORRECTION_ANCHOR);
leg(
  'C1',
  baseHasFalseReason && !baseHasCorrection,
  `baseline @${PREREG_REV}: falseReason=${baseHasFalseReason} correction=${baseHasCorrection} ` +
    `bytes=${Buffer.byteLength(BASE, 'utf8')}`
);
pred('P9', baseHasFalseReason && !baseHasCorrection, 'the correction had a live subject: the false reason was present and uncorrected at the pre-reg rev');

// ------------------------------------------------------------------ cured state (working tree)

const LIVE = readFileSync(join(ROOT, SUBJECT), 'utf8');
leg(
  'C2',
  LIVE !== BASE,
  `the two provenances differ, so a cure landed: base bytes=${Buffer.byteLength(BASE, 'utf8')} ` +
    `live bytes=${Buffer.byteLength(LIVE, 'utf8')}`
);

// Struck, not deleted: the false reason is still findable.
leg('C3', LIVE.includes(FALSE_REASON), `the false reason is still present in the cured file (struck, not deleted) = ${LIVE.includes(FALSE_REASON)}`);

// ...and inside a CLOSED strike span. A present `~~` is not an intact span.
const strikes = [...LIVE.matchAll(/~~([\s\S]*?)~~/g)].map((m) => m[1]);
const strikeHolding = strikes.filter((s) => s.includes(FALSE_REASON));
leg(
  'C4',
  strikeHolding.length === 1,
  `closed ~~…~~ spans containing the false reason = ${strikeHolding.length} (want exactly 1; total spans=${strikes.length})`
);
leg(
  'C5',
  strikeHolding.length === 1 && strikeHolding[0].includes('**unsatisfiable**'),
  `the struck span carries the word that was wrong ("unsatisfiable") = ${strikeHolding.length === 1 && strikeHolding[0].includes('**unsatisfiable**')}`
);

// The correction is present and names the cell that refutes HIS reason, not only mine. A correction
// that only restates the verdict would satisfy an anchor-on-the-heading leg and carry no finding.
leg('C6', LIVE.includes(CORRECTION_ANCHOR), `correction block present = ${LIVE.includes(CORRECTION_ANCHOR)}`);
leg('C7', LIVE.includes(CELL_ANCHOR), `the correction names the counterexample cell ${CELL_ANCHOR} = ${LIVE.includes(CELL_ANCHOR)}`);
leg(
  'C8',
  LIVE.includes('wrong on 1') && LIVE.includes('wrong on 0'),
  `the correction states the predicate comparison as measured (wrong on 1 / wrong on 0) = ${LIVE.includes('wrong on 1') && LIVE.includes('wrong on 0')}`
);

// The struck sentence must sit ADJACENT to its replacement, not 73 lines away — his §3 finding
// about my memo, applied to this correction. Measured as line distance, not asserted.
const lines = LIVE.split('\n');
const strikeLine = lines.findIndex((l) => l.includes(FALSE_REASON));
const corrLine = lines.findIndex((l) => l.includes(CORRECTION_ANCHOR));
const distance = corrLine - strikeLine;
leg(
  'C9',
  strikeLine !== -1 && corrLine !== -1 && distance > 0 && distance <= 15,
  `line distance from the struck sentence (${strikeLine + 1}) to its correction (${corrLine + 1}) = ${distance} (want <= 15)`
);

// ------------------------------------------------------------------- gate

const dirty = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('C-gate', dirty === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(dirty)}`);

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
    `preds=${preds.length} refuted=[${refuted}]`
);
process.exit(exit);
