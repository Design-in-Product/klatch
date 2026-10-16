#!/usr/bin/env node
/**
 * Round 398 — counterfactuals for Daedalus's Round 397 §2, and for the cure I took from it.
 *
 * THE FINDING (his): my Round 396 `T4` carried
 *   `!/\btype Row\b/.test(live.slice(live.indexOf('ROUND 396 RE-KEY')))`
 * `indexOf` refuses with `-1`; `.slice(-1)` is the last character of the file; a one-character
 * window cannot match `type Row`. The conjunct therefore went GREEN at the moment it stopped
 * reading the block it grades.
 *
 * WHAT DRIVES HERE. Two spellings — OLD, lifted out of `ff93ad0a`, and CURED, lifted out of the
 * live file — over four substituted tree-states, in memory, touching no tree. Neither spelling is
 * retyped: each is extracted from source by a refusing extractor, its `readFileSync(...)` /
 * `show(...)` call textually substituted with `src`, the substitution asserted to round-trip back
 * to the shipped text, and the result compiled with `new Function` (357). `probe-round371` is a
 * swept file other agents edit and it spawns child probes that do not run in a detached worktree,
 * so mutating a real tree is both unsafe and unnecessary here (my Round 396 §3 precedent).
 *
 * Every cell's expectation is written down in `CELLS` before anything drives (383). The grade is
 * `expected === drove` per cell; a cell whose extractor refused has NO verdict rather than a
 * green one (393/395).
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recorderDetachedAtProperty } from './property-pins.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

const MY_396 = 'docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs';
const OLD_PIN = 'ff93ad0a'; // the tree Daedalus read: my Round 396 instrument as published
const PROBE_371 = 'scripts/probe-round371-the-characterisation-item-is-a-registry-not-a-sweep.mts';
const REKEY_PIN = '17f25906'; // the commit that shipped the block the conjunct grades
const MARKER = 'ROUND 396 RE-KEY';

// ── the two spellings, extracted rather than retyped ─────────────────────────────────────────
/** One line beginning `const <name> =`, or null. Refuses on 0 and on >1 (347). */
function soleLine(src, prefix) {
  const hits = src.split('\n').filter((l) => l.startsWith(prefix));
  return hits.length === 1 ? hits[0] : null;
}

const oldSrc = show(OLD_PIN, MY_396);
const liveSrc = readFileSync(join(REPO, MY_396), 'utf8');

const oldLine = soleLine(oldSrc, 'const renamedAway = ');
const READ_CALL = "readFileSync(join(REPO, PROBE_371_PATH), 'utf8')";
let oldExpr = null;
if (oldLine !== null) {
  const occurrences = oldLine.split(READ_CALL).length - 1;
  const substituted = oldLine.split(READ_CALL).join('src');
  const roundTrip = substituted.split('src').join(READ_CALL) === oldLine;
  if (occurrences === 2 && roundTrip) oldExpr = substituted.replace('const renamedAway = ', '').replace(/;$/, '');
}

// The cured spelling is three bound lines, so it is extracted as a BLOCK and driven as a body.
const curedLines = ['const rekeyBlockAt = ', 'const rekeyBlock = ', 'const renamedAway = '].map((p) => soleLine(liveSrc, p));
const SHOW_CALL = 'show(REKEY_PIN, PROBE_371_PATH)';
const probeLine = soleLine(liveSrc, 'const rekeyedProbe = ');
let curedBody = null;
if (!curedLines.includes(null) && probeLine !== null && probeLine.includes(SHOW_CALL)) {
  const subbed = probeLine.split(SHOW_CALL).join('src');
  const roundTrip = subbed.split('src').join(SHOW_CALL) === probeLine;
  if (roundTrip) curedBody = `${[subbed, ...curedLines].join('\n')}\nreturn renamedAway;`;
}

const compile = (kind, text) => {
  if (text === null) return null;
  try {
    return kind === 'expr' ? new Function('src', `return (${text});`) : new Function('src', text);
  } catch (e) {
    console.log(`  COMPILE REFUSED (${kind}): ${e.message}`);
    return null;
  }
};
const OLD = compile('expr', oldExpr);
const CURED = compile('body', curedBody);

// ── the four tree-states ─────────────────────────────────────────────────────────────────────
const probe = show(REKEY_PIN, PROBE_371);
// Anchors asserted unique before anything is mutated (347): a replace that hits two sites, or
// none, makes every row below a measurement of something else.
const markerCount = probe.split(MARKER).length - 1;
const typeRowCount = (probe.match(/\btype Row\b/g) || []).length;
const markerAt = probe.indexOf(MARKER);
const typeRowAt = probe.search(/\btype Row\b/);
const anchorsOk = markerCount === 1 && typeRowCount === 1 && typeRowAt !== -1 && markerAt !== -1 && typeRowAt < markerAt;

const REINTRO = '\n/** ROUND 398 CF — reintroduced after the marker. */\ntype Row = { x: 1 };\n';
const states = {
  'CONTROL-A': probe,
  KP: probe.slice(0, markerAt + MARKER.length) + REINTRO + probe.slice(markerAt + MARKER.length),
  'CF-1': (probe.slice(0, markerAt + MARKER.length) + REINTRO + probe.slice(markerAt + MARKER.length)).replace(MARKER, 'ROUND 396 KEY CHANGE'),
  'CF-2': probe.replace(MARKER, 'ROUND 396 KEY CHANGE'),
};

/**
 * CELLS — written before the drive. `true` means the conjunct PASSES (reads as "my block is
 * clean"); `false` means it REDDENS. The defect is any cell where the state carries a `type Row`
 * after the block anchor and the conjunct still passes.
 */
const CELLS = {
  'CONTROL-A': { marker: true, defect: false, OLD: true, CURED: true },
  KP: { marker: true, defect: true, OLD: false, CURED: false },
  'CF-1': { marker: false, defect: true, OLD: true, CURED: false }, // ← his finding / the teeth
  'CF-2': { marker: false, defect: false, OLD: true, CURED: false }, // ← a refusal must not read as clean
};

console.log('── Round 398 — the refusable anchor, driven over substituted text in memory ──');
console.log(`subject: ${PROBE_371} at ${REKEY_PIN} (${probe.length} chars)`);
console.log(`OLD spelling from ${OLD_PIN}:${MY_396} — extracted: ${oldExpr !== null}, compiled: ${OLD !== null}`);
console.log(`CURED spelling from the live file — extracted: ${curedBody !== null}, compiled: ${CURED !== null}`);
console.log(
  `anchors unique and ordered (one ${JSON.stringify(MARKER)} at ${markerAt}, one \`type Row\` at ${typeRowAt}, before it): ${anchorsOk}\n`,
);

const rows = [];
let cellsNotAsExpected = 0;
let cellsWithNoVerdict = 0;
console.log('| state | marker | defect after anchor | window (OLD) | OLD | CURED | as predicted |');
console.log('|---|---|---|---|---|---|---|');
for (const [name, src] of Object.entries(states)) {
  const want = CELLS[name];
  const at = src.indexOf(MARKER);
  const window = at === -1 ? src.slice(-1) : src.slice(at); // the OLD spelling's window, stated
  const drove = {
    OLD: OLD === null ? null : OLD(src),
    CURED: CURED === null ? null : CURED(src),
  };
  // §4 item one, found by this round's own census: my first version of this line read
  // `src.slice(src.indexOf('ROUND 396 KEY CHANGE'))` — an unguarded refusable index, THE SHAPE
  // THIS HARNESS IS ABOUT, in the harness grading it, written the same hour. It refuses with a
  // 1-char window, which here makes `defectPresent` false and a cell print "NOT as predicted"
  // (it fails closed in this use, unlike the subject), but the shape is the shape. Both anchors
  // now refuse explicitly and a cell with no readable window has NO verdict.
  const rewordedAt = src.indexOf('ROUND 396 KEY CHANGE');
  const defectWindowAt = at !== -1 ? at : rewordedAt;
  const defectPresent = defectWindowAt === -1 ? null : /\btype Row\b/.test(src.slice(defectWindowAt));
  const ok = drove.OLD === want.OLD && drove.CURED === want.CURED && defectPresent === want.defect && (at !== -1) === want.marker;
  const refused = drove.OLD === null || drove.CURED === null || defectPresent === null;
  if (refused) cellsWithNoVerdict++; // one count per CELL, not per refusal
  else if (!ok) cellsNotAsExpected++;
  rows.push({ name, ok, drove, window: window.length, defectPresent });
  console.log(
    `| ${name} | ${at !== -1 ? 'present' : '**absent**'} | ${defectPresent === null ? 'REFUSED' : defectPresent ? '**yes**' : 'no'} | ${window.length} chars | ` +
      `${drove.OLD === null ? 'NO VERDICT' : `**${drove.OLD}**`} | ${drove.CURED === null ? 'NO VERDICT' : `**${drove.CURED}**`} | ${ok ? 'yes' : '**NO**'} |`,
  );
}

const finding = rows.find((r) => r.name === 'CF-1');
console.log(
  `\nHIS FINDING, driven: with the anchor reworded and the defect present, the OLD spelling reads ` +
    `**${finding.drove.OLD}** over a **${finding.window}-char** window — green with the defect in the file. ` +
    `The CURED spelling reads **${finding.drove.CURED}**.`,
);
console.log(
  `KP and CF-1 carry the identical defect; the single axis between them is whether ${JSON.stringify(MARKER)} ` +
    `is still spelled that way (OLD: ${rows.find((r) => r.name === 'KP').drove.OLD} → ${finding.drove.OLD}; ` +
    `CURED: ${rows.find((r) => r.name === 'KP').drove.CURED} → ${finding.drove.CURED}).`,
);

// ── the second routed question: `recorderRefusesToAdopt` as a verbatim source pin (375) ──────
/**
 * His §5 asks the same question of the rest of `T4`: `recorderRefusesToAdopt` is a verbatim
 * multi-line source pin, so a reword reddens it and a comment quoting it passes it. Both legs
 * are driven here — the OLD pin and a property pin — over four substituted recorder sources.
 */
const RECORDER = 'docs/research/round396-instruments/record-drives.mjs';
const recorderSrc = readFileSync(join(REPO, RECORDER), 'utf8');
const OLD_PIN_TEXT = "git(['worktree', 'remove', '--force', p]);\n    console.log(`  (removed a pre-existing ${tag} tree rather than adopting it)`);";

// The predicate is IMPORTED, not re-implemented: this harness grades the same function the
// Round 396 instrument now pins with, so the two cannot drift apart into vacuous agreement
// (339/369). See `property-pins.mjs`.
const recorderProperty = recorderDetachedAtProperty;

const recorderStates = {
  'CONTROL-R, live bytes': recorderSrc,
  'CF-R1, log message reworded only (property intact)': recorderSrc.replace('removed a pre-existing', 'reaped a pre-existing'),
  'CF-R2, the removal deleted (property gone)': recorderSrc.replace(`git(['worktree', 'remove', '--force', p]);`, '/* adopted */'),
  'CF-R3, removal deleted AND the old pin text quoted in a comment': `/* ${OLD_PIN_TEXT} */\n${recorderSrc.replace(`git(['worktree', 'remove', '--force', p]);`, '/* adopted */')}`,
};
const R_CELLS = {
  'CONTROL-R, live bytes': { verbatim: true, property: true },
  'CF-R1, log message reworded only (property intact)': { verbatim: false, property: true }, // verbatim pin is brittle
  'CF-R2, the removal deleted (property gone)': { verbatim: false, property: false },
  'CF-R3, removal deleted AND the old pin text quoted in a comment': { verbatim: true, property: false }, // ← 375, both legs wrong
};
console.log('\n── his §5, second leg: the verbatim pin vs a comment-blind property pin ──');
console.log('| recorder state | verbatim pin | property pin | both as predicted |');
console.log('|---|---|---|---|');
let rCellsNotAsExpected = 0;
for (const [name, src] of Object.entries(recorderStates)) {
  const verbatim = src.includes(OLD_PIN_TEXT);
  const property = recorderProperty(src);
  const want = R_CELLS[name];
  const ok = verbatim === want.verbatim && property === want.property;
  if (!ok) rCellsNotAsExpected++;
  console.log(`| ${name} | **${verbatim}** | ${property === null ? 'NO VERDICT' : `**${property}**`} | ${ok ? 'yes' : '**NO**'} |`);
}
console.log(
  '\nCF-R1 and CF-R3 are the two failures a verbatim pin has and a property pin does not: a ' +
    'behaviour-preserving reword reddens it, and a comment quoting the pinned text greens it with ' +
    'the property absent. The property pin is comment-blind and refuses when the function is gone.',
);

// ── grade ────────────────────────────────────────────────────────────────────────────────────
const graded =
  anchorsOk &&
  OLD !== null &&
  CURED !== null &&
  cellsWithNoVerdict === 0 &&
  cellsNotAsExpected === 0 &&
  rCellsNotAsExpected === 0;
console.log('\n── grade ──');
console.log(`  anchors asserted unique before mutation: ${anchorsOk}`);
console.log(`  both spellings extracted from source and round-tripped: ${OLD !== null && CURED !== null}`);
console.log(`  cells with no verdict: ${cellsWithNoVerdict}`);
console.log(`  cells not as predicted: ${cellsNotAsExpected} of ${rows.length} (renamedAway) and ${rCellsNotAsExpected} of 4 (recorder pin)`);
if (graded !== true) {
  console.log('\nNO VERDICT — this harness did not grade true; read the rows.');
  process.exit(1);
}
console.log(`\nHARNESS OK — 8 renamedAway cells and 4 recorder-pin cells, all as predicted.`);
