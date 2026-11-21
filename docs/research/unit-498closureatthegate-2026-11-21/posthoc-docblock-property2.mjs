#!/usr/bin/env node
/**
 * unit-498closureatthegate — post-hoc for P6.
 *
 * Assertion (c)'s docblock, property 2, states: *"This report makes 34 `console.log` calls and
 * publishes 38 lines: 4 of 38 published lines (10.5%) are not the first line of their chunk, and
 * all four are section-break prose … (The rows array is 3 of 38.)"*
 *
 * Those four figures are the stated justification for splitting each chunk on `\n` instead of
 * guarding per CALL. They were measured at `a42cd40d` (the unit-495 cure). P6 registers that they
 * are stale at today's tree, and that the staleness is caused by the gate's own `IRREDUCIBLE LIMIT`
 * self-naming class — files written ABOUT the gate entering the report — which is the same
 * mechanism that refuted Daedalus's P5 one fire ago. The clause *"all four are section-break
 * prose"* was registered SEPARATELY and expected REFUTED.
 *
 * Chunk boundaries cannot be recovered from captured stdout: a chunk containing a newline is
 * indistinguishable from two chunks. So this measures the REAL gate rather than re-deriving it from
 * its output — `--import` installs a recorder over `console.log`/`console.error` before the gate's
 * first statement runs, and `publish()` passes exactly one string to its sink. Nothing in the gate
 * is edited; the recorder lives in an untracked scratch module.
 *
 * The attribution leg is git-only and needs no second checkout: the gate's `emit(`/`emitErr(` call
 * sites are extracted from `a42cd40d` and from HEAD and compared as sets. If the STATIC sites are
 * unchanged, every published line the two trees do not share came from a loop, and the loops over
 * the marker lists are the self-naming class.
 *
 * Byte figures are `Buffer.byteLength`; code-unit figures are labelled as code units.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = resolve(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const RECORDER = resolve(HERE, 'scratch-unit498-recorder.mjs');
const RECORD = resolve(HERE, 'scratch-unit498-record.json');
const DOCBLOCK_REV = 'a42cd40d';

/* ------------------------------------------- the docblock's own figures, read from the file ---- */
const src = readFileSync(GATE, 'utf8');
const claimRaw = src.slice(src.indexOf('2. **Chunks are split on `\\n`'), src.indexOf('3. **The key is derived from'));
if (!claimRaw) throw new Error('posthoc: property-2 docblock text not found');
// The docblock is a `*`-prefixed comment and it WRAPS mid-figure: `(The rows array is\n *    3 of
// 38.)`. A reader keyed on the figure's words with the newline left in place reported no match at
// all — which is the right failure direction and is why the parse throws rather than defaulting.
// Strip the comment prefixes and collapse whitespace before reading any figure off it.
const claim = claimRaw.replace(/^\s*\*\s?/gm, '').replace(/\s+/g, ' ');
const stated = {
  calls: Number((claim.match(/(\d+) `console\.log` calls/) || [])[1]),
  lines: Number((claim.match(/publishes (\d+) lines/) || [])[1]),
  nonFirst: Number((claim.match(/\*\*(\d+) of \d+ published lines/) || [])[1]),
  rowsArray: Number((claim.match(/rows array is (\d+) of/) || [])[1]),
};
for (const [k, v] of Object.entries(stated)) {
  if (!Number.isInteger(v)) throw new Error(`posthoc: could not read stated figure \`${k}\` off the docblock`);
}

/* ------------------------------------------------------- record the real gate's real chunks ---- */
writeFileSync(RECORDER, `import { writeFileSync } from 'node:fs';
const rec = { out: [], err: [] };
const realLog = console.log.bind(console);
const realErr = console.error.bind(console);
console.log = (...a) => { rec.out.push(a.length === 1 && typeof a[0] === 'string' ? a[0] : null); realLog(...a); };
console.error = (...a) => { rec.err.push(a.length === 1 && typeof a[0] === 'string' ? a[0] : null); realErr(...a); };
process.on('exit', () => writeFileSync(${JSON.stringify(RECORD)}, JSON.stringify(rec)));
`);
let rec;
let run;
try {
  run = spawnSync(process.execPath, ['--import', RECORDER, GATE], { encoding: 'buffer', cwd: ROOT });
  rec = JSON.parse(readFileSync(RECORD, 'utf8'));
} finally {
  rmSync(RECORDER, { force: true });
  rmSync(RECORD, { force: true });
}
if (rec.out.some((c) => c === null)) throw new Error('posthoc: a console.log call did not pass exactly one string');

// stdout as the gate actually emitted it, reconstructed from the recording and asserted against the
// captured bytes — the recording is not believed until it reproduces the real capture.
const reconstructed = rec.out.map((c) => `${c}\n`).join('');
const captured = run.stdout.toString('utf8');
const reconstructionMatches = reconstructed === captured;

const chunks = rec.out;
const perChunkLines = chunks.map((c) => c.split('\n'));
const lines = perChunkLines.flat();
const nonFirst = [];
perChunkLines.forEach((ls, ci) => {
  ls.slice(1).forEach((l) => nonFirst.push({ chunk: ci, text: l }));
});

/* ---------------------------------------------------- classify, because the clause names a kind */
const isPathEntry = (t) => /^\s+(docs|packages|scripts|src)\//.test(t);
const isBlank = (t) => t.trim() === '';
const kindOf = (t) => (isPathEntry(t) ? 'file-path list entry' : isBlank(t) ? 'blank' : 'prose');
const kinds = {};
for (const n of nonFirst) kinds[kindOf(n.text)] = (kinds[kindOf(n.text)] || 0) + 1;
const allProse = nonFirst.every((n) => kindOf(n.text) === 'prose');

// the rows array: the `for (const v of LABELS) emit(...)` loop's lines, keyed on the published shape
const rowLines = lines.filter((l) => /^ {6}(MARKED|GUARDED|UNGUARDED)\s+\d+$/.test(l));
// the self-naming class: file-path lines anywhere in the report
const pathLines = lines.filter((l) => isPathEntry(l));

/* ---------------------------------- attribution: did the STATIC emit sites move since a42cd40d? */
const old = spawnSync('git', ['show', `${DOCBLOCK_REV}:scripts/verify-decl-body-slicers.mjs`],
  { encoding: 'utf8', cwd: ROOT });
if (old.status !== 0) throw new Error(`posthoc: git show ${DOCBLOCK_REV} failed: ${old.stderr}`);
const sitesOf = (text) => (text.match(/^\s*emit(?:Err)?\(/gm) || []).length;
const siteTextOf = (text) => (text.match(/^\s*emit(?:Err)?\([^\n]*/gm) || []).map((s) => s.trim());
const oldSites = siteTextOf(old.stdout);
const newSites = siteTextOf(src);
const addedSites = newSites.filter((s) => !oldSites.includes(s));
const removedSites = oldSites.filter((s) => !newSites.includes(s));

/* ------------------------------------------------------------------------------------ report -- */
console.log('unit-498closureatthegate — post-hoc: assertion (c) docblock property 2 (P6)');
console.log('');
console.log('## the docblock\'s own figures, parsed off the live file rather than quoted from memory');
console.log(`  stated: ${stated.calls} console.log calls · ${stated.lines} published lines ·`
  + ` ${stated.nonFirst} of ${stated.lines} not first-of-chunk · rows array ${stated.rowsArray} of ${stated.lines}`);
console.log(`  measured at: ${DOCBLOCK_REV} (the unit-495 cure, by \`git log -S\`)`);
console.log('');
console.log('## today\'s tree, measured on the REAL gate with a recorder over console.log');
console.log(`  gate rc=${run.status}  stdout ${Buffer.byteLength(captured)} bytes (Buffer.byteLength)`
  + ` / ${captured.length} UTF-16 code units`);
console.log(`  recording reproduces the captured stdout byte-for-byte: ${reconstructionMatches}`);
console.log(`  console.log calls (stdout chunks): ${chunks.length}   stderr chunks: ${rec.err.length}`);
console.log(`  published stdout lines: ${lines.length}`);
console.log(`  not the first line of their chunk: ${nonFirst.length} of ${lines.length}`
  + ` (${((nonFirst.length / lines.length) * 100).toFixed(1)}%)`);
console.log(`  rows array: ${rowLines.length} of ${lines.length}`);
console.log(`  file-path (self-naming class) lines: ${pathLines.length} of ${lines.length}`);
console.log('');
console.log('## each stated figure against its re-derivation');
const cmp = [
  ['console.log calls', stated.calls, chunks.length],
  ['published lines', stated.lines, lines.length],
  ['not first-of-chunk', stated.nonFirst, nonFirst.length],
  ['rows array', stated.rowsArray, rowLines.length],
];
for (const [name, was, now] of cmp) {
  console.log(`  ${name.padEnd(22)} docblock ${String(was).padStart(3)}   today ${String(now).padStart(3)}`
    + `   ${was === now ? 'unchanged' : `STALE (${now > was ? '+' : ''}${now - was})`}`);
}
console.log('');
console.log('## the separately-registered clause: "all four are section-break prose"');
console.log(`  non-first-of-chunk lines by kind: ${JSON.stringify(kinds)}`);
console.log(`  every non-first line is prose: ${allProse}`);
for (const n of nonFirst) {
  console.log(`    chunk ${String(n.chunk).padStart(2)}  ${kindOf(n.text).padEnd(21)}`
    + ` ${JSON.stringify(n.text.length > 64 ? `${n.text.slice(0, 61)}...` : n.text)}`);
}
console.log('');
console.log('## attribution — did the STATIC emit sites move, or only the loops?');
console.log(`  emit/emitErr call sites at ${DOCBLOCK_REV}: ${sitesOf(old.stdout)}   at HEAD: ${sitesOf(src)}`);
console.log(`  sites added since ${DOCBLOCK_REV}: ${addedSites.length}`
  + (addedSites.length ? `  ${JSON.stringify(addedSites)}` : ''));
console.log(`  sites removed since ${DOCBLOCK_REV}: ${removedSites.length}`
  + (removedSites.length ? `  ${JSON.stringify(removedSites)}` : ''));
console.log(`  so every line the two trees do not share came from a LOOP: `
  + `${addedSites.length === 0 && removedSites.length === 0}`);
console.log('');
console.log(`POST-HOC — P6 ${lines.length !== stated.lines ? 'HIT on staleness' : 'REFUTED on staleness'};`
  + ` the separately-registered prose clause is ${allProse ? 'HELD' : 'REFUTED'}.`);
