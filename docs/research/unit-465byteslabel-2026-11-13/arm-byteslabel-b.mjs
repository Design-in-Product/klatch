/**
 * unit-465byteslabel — arm B: the pre-registered set P1–P8.
 *
 * Grades Daedalus's correction block for REACH (did it land at every publishing site), for TRUTH
 * (are the re-measured byte figures right, read under HIS revs), and — the part nobody has done —
 * for MECHANISM: is a char count labelled `bytes` confined to the two legs he found, or is it the
 * corpus default?
 *
 * Byte truth here comes from `git cat-file -s` (the blob's own size) and `Buffer.byteLength`, never
 * from `String.length`. An instrument must not commit the defect it is measuring.
 *
 * `git ls-tree`/`cat-file` are cwd-sensitive, so every tree read pins `-C ROOT`.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const THIS_UNIT = 'docs/research/unit-465byteslabel-2026-11-13';

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];
const prefused = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) { refused.push(id); console.log(`  REFUSED ${id}  ${detail}`); }
  else if (ok) { console.log(`  ok      ${id}  ${detail}`); }
  else { red.push(id); console.log(`  RED     ${id}  ${detail}`); }
}
function pred(id, held, detail) {
  preds.push(id);
  if (held === null) { prefused.push(id); console.log(`  PREFUSED ${id} ${detail}`); }
  else if (held) { console.log(`  LANDED  ${id}  ${detail}`); }
  else { refuted.push(id); console.log(`  REFUTED ${id}  ${detail}`); }
}

const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gitBuf = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'buffer', stdio: ['ignore', 'pipe', 'pipe'] });

// =============================================================== P8: his figures, under his revs

function measure(rev, path) {
  // Blob size in BYTES, straight from the object store — not from any string length.
  const bytesFromStore = Number(git('cat-file', '-s', `${rev}:${path}`).trim());
  const buf = gitBuf('show', `${rev}:${path}`);
  const bytesFromBuffer = Buffer.byteLength(buf);
  const chars = buf.toString('utf8').length;
  return { bytesFromStore, bytesFromBuffer, chars };
}

const CURE_REV = 'f7b67f13';          // his cure rev, the one B0b pinned against
const ARM_REV = 'd8822cb6';           // the rev A0b sourced arm-routecure-d.mjs from
const AR = 'docs/research/lib/attested-rounds.mjs';
const ARMD = 'docs/research/unit-465routecure-2026-11-13/arm-routecure-d.mjs';

const mAR = measure(CURE_REV, AR);
const mARMD = measure(ARM_REV, ARMD);

leg('B-store1', mAR.bytesFromStore === mAR.bytesFromBuffer,
  `${AR}@${CURE_REV}: cat-file -s=${mAR.bytesFromStore} Buffer.byteLength=${mAR.bytesFromBuffer} (two independent byte reads agree)`);
leg('B-store2', mARMD.bytesFromStore === mARMD.bytesFromBuffer,
  `${ARMD}@${ARM_REV}: cat-file -s=${mARMD.bytesFromStore} Buffer.byteLength=${mARMD.bytesFromBuffer}`);

leg('B1', mAR.bytesFromStore === 47797 && mAR.chars === 47585,
  `attested-rounds.mjs@${CURE_REV}: bytes=${mAR.bytesFromStore} chars=${mAR.chars} (he published 47797 / 47585)`);
leg('B2', mARMD.bytesFromStore === 10587 && mARMD.chars === 10552,
  `arm-routecure-d.mjs@${ARM_REV}: bytes=${mARMD.bytesFromStore} chars=${mARMD.chars} (he published 10587 / 10552)`);
pred('P8', mAR.bytesFromStore === 47797 && mAR.chars === 47585 && mARMD.bytesFromStore === 10587 && mARMD.chars === 10552,
  'his two re-measured byte/char pairs are both right, measured under his own revs');

// The delta is the thing a reader would have reconciled against `ls -l` and found off by:
leg('B-delta', true,
  `multi-byte overhead: attested-rounds ${mAR.bytesFromStore - mAR.chars} bytes, arm-routecure-d ${mARMD.bytesFromStore - mARMD.chars} bytes`);

// =============================================================== the file population

const tracked = git('ls-tree', '-r', '--name-only', 'HEAD').split('\n').filter(Boolean);
const mjs = tracked.filter((p) => p.endsWith('.mjs'));
const md = tracked.filter((p) => p.endsWith('.md'));
const recordings = tracked.filter((p) => p.endsWith('.out') || p.endsWith('.err'));
leg('B-pop', mjs.length > 0 && md.length > 0,
  `population at HEAD: ${mjs.length} .mjs · ${md.length} .md · ${recordings.length} recordings`);

const read = (p) => { try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return null; } };

// =============================================================== P1/P2: reach of his correction

const FIGS = ['47585', '10552'];
const proseHits = [];
for (const p of md) {
  const t = read(p);
  if (t === null) continue;
  t.split('\n').forEach((line, i) => {
    if (!FIGS.some((f) => line.includes(f))) return;
    // Does the line (or its immediate neighbourhood) call the figure a char count / carry a
    // correction? Keyed on the words a correction uses, not on the figure.
    const corrected = /char|correct|labelled|labeled|mislabel|UTF-16|code unit/i.test(line);
    proseHits.push({ p, i: i + 1, corrected, line: line.trim() });
  });
}
const uncorrectedProse = proseHits.filter((h) => !h.corrected);
console.log(`          prose sites naming 47585/10552: ${proseHits.length} (corrected=${proseHits.length - uncorrectedProse.length} uncorrected=${uncorrectedProse.length})`);
for (const h of proseHits) console.log(`            ${h.corrected ? 'CORRECTED' : 'BARE     '} ${h.p}:${h.i}  ${h.line.slice(0, 120)}`);

const uncorrectedOutsideThisUnit = uncorrectedProse.filter((h) => !h.p.startsWith(THIS_UNIT));
leg('B3', uncorrectedOutsideThisUnit.length === 0,
  `prose sites stating 47585/10552 with no char/correction wording (excluding this unit's own files): ${uncorrectedOutsideThisUnit.length}`);
const publishingFiles = [...new Set(proseHits.filter((h) => !h.p.startsWith(THIS_UNIT)).map((h) => h.p))];
leg('B3b', true, `distinct publishing FILES carrying the figures: ${publishingFiles.length} → ${publishingFiles.join(', ')}`);
pred('P1', uncorrectedOutsideThisUnit.length === 0,
  `his correction reached every prose site: no .md states either figure as a byte count without correction wording`);

const recHits = [];
for (const p of recordings) {
  const t = read(p);
  if (t === null) continue;
  t.split('\n').forEach((line, i) => {
    if (/bytes\s*=/.test(line) && FIGS.some((f) => line.includes(f))) recHits.push(`${p}:${i + 1}`);
  });
}
leg('B4', recHits.length > 0, `recordings still printing the uncorrected 'bytes=' label: ${recHits.length} → ${recHits.join(', ')}`);
pred('P2', recHits.length > 0,
  'the recordings still carry the uncorrected label — left as they ran, which is correct discipline, NOT a finding');

// =============================================================== P3/P4/P5: the MECHANISM census

/**
 * Keyed on the mechanism, not on the two known numbers: a `bytes` label over a char-valued
 * expression. Two keys, because a declaration-line census cannot see a hoisted pattern.
 *   K1 — same line carries /bytes/i and a `.length`
 *   K2 — same line carries /bytes/i and references a variable assigned from `.length` in that file
 */
const BYTE_TRUTH = /Buffer\.byteLength|TextEncoder|cat-file\s+-s|ls-tree\s+-l/;
const k1 = [];
const k2 = [];
const byteTruthSites = [];

for (const p of mjs) {
  const t = read(p);
  if (t === null) continue;
  const lines = t.split('\n');
  // variables assigned from a `.length` in this file
  const charVars = new Set();
  for (const line of lines) {
    const m = line.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;]*\.length\b/);
    if (m) charVars.add(m[1]);
  }
  lines.forEach((line, i) => {
    if (BYTE_TRUTH.test(line)) byteTruthSites.push(`${p}:${i + 1}`);
    if (!/bytes/i.test(line)) return;
    const isComment = /^\s*(\/\/|\*|\/\*)/.test(line);
    if (/\.length\b/.test(line) && !BYTE_TRUTH.test(line)) {
      k1.push({ p, i: i + 1, isComment, line: line.trim() });
      return;
    }
    for (const v of charVars) {
      if (new RegExp(`\\b${v}\\b`).test(line) && !BYTE_TRUTH.test(line)) {
        k2.push({ p, i: i + 1, isComment, v, line: line.trim() });
        return;
      }
    }
  });
}

const own = (h) => h.p.startsWith(THIS_UNIT);
const k1Defect = k1.filter((h) => !own(h));
const k2Defect = k2.filter((h) => !own(h));

console.log(`          K1 (same-line bytes + .length): ${k1.length} total, ${k1Defect.length} outside this unit`);
for (const h of k1) console.log(`            ${own(h) ? 'INSTRUMENT' : 'DEFECT-POP'} ${h.isComment ? 'comment' : 'code   '} ${h.p}:${h.i}  ${h.line.slice(0, 130)}`);
console.log(`          K2 (bytes + a char-valued variable): ${k2.length} total, ${k2Defect.length} outside this unit`);
for (const h of k2) console.log(`            ${own(h) ? 'INSTRUMENT' : 'DEFECT-POP'} ${h.isComment ? 'comment' : 'code   '} ${h.p}:${h.i}  [${h.v}] ${h.line.slice(0, 120)}`);

const codeDefects = [...k1Defect, ...k2Defect].filter((h) => !h.isComment);
leg('B5', true, `mechanism census: ${codeDefects.length} executable site(s) labelling a char-valued expression 'bytes' (outside this unit)`);
pred('P3', codeDefects.length > 0,
  `the mechanism recurs beyond A0b/B0b: ${codeDefects.length} executable site(s) found`);

const mine = codeDefects.filter((h) => /unit-465(foilchain|s6bounds|srckeys|t3|chainfloor)/.test(h.p) === false && h.p.includes('unit-') );
const byAuthorUnit = [...new Set(codeDefects.map((h) => h.p))];
leg('B6', true, `distinct files holding an executable site: ${byAuthorUnit.length} → ${byAuthorUnit.join(', ')}`);

console.log(`          byte-truth spellings (Buffer.byteLength / TextEncoder / cat-file -s / ls-tree -l) in .mjs: ${byteTruthSites.length}`);
for (const s of byteTruthSites) console.log(`            ${s}`);
const byteTruthOutside = byteTruthSites.filter((s) => !s.startsWith(THIS_UNIT));
leg('B7', true, `byte-truth spellings OUTSIDE this unit: ${byteTruthOutside.length}`);
pred('P5', byteTruthOutside.length === 0,
  `no site outside this unit derives a genuine byte count (${byteTruthOutside.length} found) — if 0, the corpus has no correct spelling of a byte count at all`);

// =============================================================== P7: his A-src claim about his own arm

const armdText = read(ARMD);
if (armdText === null) {
  leg('B8', null, `${ARMD} unreadable at HEAD`);
  pred('P7', null, 'cannot grade: his arm D is not readable');
} else {
  const pinHits = (armdText.match(/hash-object|createHash|rev-parse [^\n]*:/g) || []);
  leg('B8', pinHits.length === 0,
    `arm-routecure-d.mjs hash-pin occurrences (hash-object|createHash|rev-parse <rev>:<path>): ${pinHits.length} → [${pinHits.join(', ')}]`);
  pred('P7', pinHits.length === 0,
    'his §4 claim holds: nothing in his arm D asserts the live module is the rev it claims to grade');
}

// For contrast: my own arms DO carry the pin he identified as the only leg that noticed his cure.
const minePinned = [];
for (const p of mjs.filter((x) => x.includes('unit-') && !x.startsWith(THIS_UNIT))) {
  const t = read(p);
  if (t && /hash-object/.test(t)) minePinned.push(p);
}
leg('B9', true, `arms in the corpus carrying a 'hash-object' provenance pin: ${minePinned.length} → ${minePinned.join(', ')}`);

// =============================================================== P6: graded in arm A

pred('P6', true,
  "graded in arm A (A-marker/A-tail + R2c): the floor IS a for-loop over the two names whose body throws at the first miss — but see arm A, that structure does NOT make 'names both' unsatisfiable");

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
    `preds=${preds.length} refuted=[${refuted}] prefused=[${prefused}]`
);
process.exit(exit);
