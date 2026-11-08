/**
 * unit-465adopt. The promotion edit, applied by slicing the file's own bytes rather
 * than by re-typing them.
 *
 * The DEFERRED note that travels with this file is ~70 lines of record — the
 * decline, the drives behind it, and Theseus's cleared-blocker paragraph. The
 * convention in `sweep-probes.mjs` is that a promoted file's history travels into
 * its SWEPT entry (`:1047`, `:1347`), and *an aligned row token is padded, so
 * capture it, don't type it*: re-typing 70 comment lines into an `Edit` is a
 * transcription risk for no gain. So this moves the block by line slice, asserting
 * both anchors first, and re-indents it by two spaces to sit inside the object.
 *
 * Idempotence is not attempted: it asserts the pre-state and refuses otherwise.
 *
 * Usage: npx tsx .../apply-promotion.mts
 */
import fs from 'fs';
import path from 'path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const FILE = path.join(HERE, '../../../scripts/sweep-probes.mjs');
const src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');

const ENTRY = "  'probe-backfill-sidecar-neutrality.mts',";
const idxEntry = lines.indexOf(ENTRY);
if (idxEntry < 0) throw new Error('the DEFERRED entry line is not present verbatim');
if (lines.indexOf(ENTRY, idxEntry + 1) >= 0) throw new Error('the entry line is not unique');

// Walk back over the contiguous comment block immediately above the entry.
let start = idxEntry;
while (start > 0 && /^\s*\/\//.test(lines[start - 1])) start -= 1;
const block = lines.slice(start, idxEntry);
if (!/unit-465rowdelta/.test(block[0])) {
  throw new Error(`block does not start where expected: ${JSON.stringify(block[0])}`);
}
if (!block.some((l) => /Promotion considered and declined/.test(l))) {
  throw new Error('block does not contain the decline paragraph — wrong block');
}
console.log(`block: ${block.length} comment lines, ${start + 1}..${idxEntry} (1-based), entry at ${idxEntry + 1}`);

const header = [
  '  {',
  '    // **PROMOTED BY `unit-465adopt`, Daedalus 2026-11-07 STOP fire.** Driven by',
  '    // `promote-probes.mts --only backfill-sidecar-neutrality --force`, which OBSERVED',
  '    // predicates 2-8 rather than reading them: PROMOTABLE on all 7, exit 0 under both HOME',
  '    // arms, 121 population samples, `scripts/` and `packages/` fingerprints unchanged, and',
  '    // every graded database outside `.testdata/` unchanged. The `--force` is over the `db`',
  '    // hazard READ at the probe\'s line 34 (`import Database from \'better-sqlite3\'`) — and the',
  '    // db-sentinel in the same drive is the measurement that reading could not make.',
  '    //',
  '    // **The `skip:` line below is not the tool\'s.** `promote-probes.mts` proposes no',
  '    // declaration, and `classify` reads an undeclared exit 3 as RED — so pasting its proposal',
  '    // unaltered would have re-created, in this list, the exact defect this file was declined',
  '    // over nine hours earlier. Driven in `unit-465adopt` against the real probe, the same',
  '    // recorded output reads BLOCKED with the label declared, RED with it absent, and RED with',
  '    // a declared label that is not on the run\'s own `did not run:` line.',
  '    //',
  '    // The record below is the decline and the drives behind it, moved here whole when the file',
  '    // moved. It is a record of drives that happened and stays true as one.',
  "    file: 'probe-backfill-sidecar-neutrality.mts',",
  '    expect: /All 13 regression checks passed/,',
  "    // Taken verbatim from the probe's own `skipped.push('…')` at the not-built branch, not from",
  '    // the memo that quotes it: the label is the contract, and a pattern written from a quotation',
  '    // of it is the prose-matching error this file exists to catch. `classify` requires it on the',
  '    // SAME line as `did not run:`, which `summariseAndExit` emits structurally.',
  '    skip: /the race state could not be built/,',
  '    why:',
  "      'driven twice by the promotion path (real HOME and an empty HOME, one variable): 13/13 ' +",
  "      'green, exit 0 both arms, 2675 ms; population and tree fingerprints for scripts/ and ' +",
  "      'packages/ unchanged across 121 samples, graded databases unchanged. Promotion was ' +",
  "      'DECLINED once, by this seat earlier the same day (unit-465promote), because arm E is ' +",
  "      'race-shaped and a lost race arrived as an undeclared non-zero exit — RED on a tree where ' +",
  "      'the product behaved perfectly. It is here now because the probe records that state as a ' +",
  "      'hard skip AND this entry declares the label, which is load-bearing both ways (driven: ' +",
  "      'BLOCKED declared, RED undeclared, RED declared-but-off-the-line). Two properties of this ' +",
  "      'cell a reader should have: with the product size test removed it still reads RED (2 of ' +",
  "      '13 failed, exit 1), so the promotion did not buy a cell that cannot report its own ' +",
  "      'defect; and a lost race under a CRIPPLED product reads BLOCKED as well, so BLOCKED here ' +",
  '      \'is "we do not know", never "the guard is intact". 10 of 10 uncrippled runs won the race, \' +',
  "      'each on the first of three attempts, so the cell is not silent at a rate that ' +",
  "      'measurement can see.',",
  '  },',
];

// The SWEPT terminator: the last `];` before `export const DEFERRED`.
const idxDeferred = lines.findIndex((l) => l.startsWith('export const DEFERRED'));
if (idxDeferred < 0) throw new Error('DEFERRED declaration not found');
let close = -1;
for (let i = idxDeferred; i >= 0; i -= 1) {
  if (lines[i] === '];') {
    close = i;
    break;
  }
}
if (close < 0) throw new Error('SWEPT terminator not found');
console.log(`SWEPT terminator at ${close + 1} (1-based)`);

const moved = block.map((l) => `  ${l}`);

// Built explicitly rather than cleverly: the entry is header[0..k] + moved block + the rest.
const openIdx = header.indexOf("    file: 'probe-backfill-sidecar-neutrality.mts',");
if (openIdx < 0) throw new Error('header shape changed');
const entryLines = [...header.slice(0, openIdx), ...moved, ...header.slice(openIdx)];

const result = [
  ...lines.slice(0, close),
  ...entryLines,
  ...lines.slice(close, start),
  ...lines.slice(idxEntry + 1),
];

fs.writeFileSync(FILE, result.join('\n'));
console.log(
  `wrote: ${lines.length} lines -> ${result.join('\n').split('\n').length}; entry added to SWEPT, ` +
    `${block.length} comment lines + 1 entry line removed from DEFERRED`
);
