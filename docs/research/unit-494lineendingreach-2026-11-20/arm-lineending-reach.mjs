// unit-494lineendingreach — arm. Grades PREREG.md's P1–P6 over the LIVE gate and its FRESH stdout.
//
// R1: this reads `scripts/verify-decl-body-slicers.mjs` and drives it. It edits no tracked file, by
// reader or by byte. Every plant happens in a copy of the capture inside this unit's directory.
// R4: no `mtime` is read anywhere — the wrapper syncs this worktree pre-fire, so every file's mtime
// is a fact about the wrapper.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const GATE = join(ROOT, 'scripts', 'verify-decl-body-slicers.mjs');
const CENSUS = join(HERE, 'census-emitter.json');
const PRELOAD = pathToFileURL(join(HERE, 'probe-emitter-census.mjs')).href;
const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];

const drive = (extraArgs, env) => {
  // stderr is captured to a pipe rather than inherited: `unit-490partitionformat` found an
  // inherited stderr leaking one drive's RED block into a neighbouring drive's artefact while
  // being absent from the `out` the legs read.
  try {
    return execFileSync('node', [...extraArgs, GATE], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env },
    });
  } catch (e) {
    // A non-zero gate is a finding, not a reason to drop the case: the captured stdout is still
    // the publication. `catch { continue }` is how a matrix loses cases.
    if (typeof e.stdout === 'string') return e.stdout;
    throw e;
  }
};

/* ---------------------------------------------------------------- two drives, one byte diff */
const plain = drive([], {});
const patched = drive([`--import=${PRELOAD}`], { THESEUS_EMITTER_CENSUS: CENSUS });
writeFileSync(join(HERE, 'drive1.gate-plain.out'), plain);
writeFileSync(join(HERE, 'drive2.gate-under-emitter-patch.out'), patched);

const census = JSON.parse(readFileSync(CENSUS, 'utf8'));
const chunks = census.calls;

/* ------------------------------------------------------------------------------ the readers */
const linesOf = (s) => {
  const parts = s.split('\n');
  if (parts.length && parts[parts.length - 1] === '') parts.pop();
  return parts;
};
// The registered reader for P4: a published line whose LAST whitespace-delimited token is a bare
// verdict label. `trimEnd` first, because a trailing space would hide the token from `split`.
const endsWithBareLabel = (line) => {
  const toks = line.trimEnd().split(/\s+/);
  return toks.length > 0 && LABELS.includes(toks[toks.length - 1]);
};
const countEndings = (text) => linesOf(text).filter(endsWithBareLabel).length;
const partialWriteHits = (src) => (src.match(/process\.(stdout|stderr)\.write/g) || []).length;

const published = linesOf(plain);
const gateSrc = readFileSync(GATE, 'utf8');

/* ------------------------------------------------------------ P3 known positive: tree-wide run */
// A zero from `partialWriteHits` over one file measures the reader unless the same reader returns
// non-zero somewhere. The population is every script in `scripts/`, read as a slice rather than
// hand-typed.
const scriptDir = join(ROOT, 'scripts');
let treePartialWrites = 0;
const treeWriters = [];
for (const f of readdirSync(scriptDir)) {
  if (!/\.(mjs|mts|js|ts)$/.test(f)) continue;
  const n = partialWriteHits(readFileSync(join(scriptDir, f), 'utf8'));
  if (n > 0) { treePartialWrites += n; treeWriters.push(`${f} (${n})`); }
}

/* ------------------------------------------------ P4 known positives: two plants, two shapes */
// `unit-488markedkeykp` §: one KP per shape is coverage of ONE axis. The line-ending direction has
// two distinct shapes and a single plant would grade only one.
const plantProse = `${plain}  every verdict row above is a GUARDED\n`;
const plantRowLast = `${plain}      58   UNGUARDED\n`;
writeFileSync(join(HERE, 'kp1.capture-plus-prose-line.out'), plantProse);
writeFileSync(join(HERE, 'kp2.capture-plus-label-last-row.out'), plantRowLast);
const kpProse = countEndings(plantProse);
const kpRowLast = countEndings(plantRowLast);

/* --------------------------------------------- post-hoc, unregistered: does the hazard BITE? */
// Registered predictions grade whether a line-ending guard has anything to guard. They do not
// grade whether the ending actually moves a figure. An unanchored label-keyed reader is the thing
// §4 of `unit-493ceilingreplication` says the adjacency protects; this drives it.
const unanchored = /GUARDED\s+(\d+)/;
const readGuarded = (text) => {
  const m = text.match(unanchored);
  return m ? m[1] : 'null';
};

/* ---------------------------------------------------------------------------------- verdicts */
const executedCalls = chunks.length;
const publishedLines = published.length;
const chunksWithNewline = chunks.filter((c) => c.some((a) => a.includes('\n'))).length;
const multiArg = chunks.filter((c) => c.length > 1).length;
const kpMulti = census.selftest.filter((c) => c.length > 1).length;
const kpEmbedded = census.selftest.filter((c) => c.some((a) => a.includes('\n'))).length;
const srcNewlineLogLines = gateSrc.split('\n')
  .filter((l) => l.includes('console.log') && l.includes('\\n')).length;
const rowsReach = 3 / publishedLines;

const V = (b) => (b ? 'HIT' : 'REFUTED');
const out = [];
out.push('unit-494lineendingreach — arm');
out.push('');
out.push('BYTE DIFF (unregistered, and the strongest thing here):');
out.push(`  plain capture:            ${plain.length} bytes`);
out.push(`  under the emitter patch:  ${patched.length} bytes`);
out.push(`  byte-identical:           ${plain === patched}`);
out.push('');
out.push('EMITTER CENSUS (runtime, every published chunk in order):');
out.push(`  executed console.log calls:        ${executedCalls}`);
out.push(`  published lines:                   ${publishedLines}`);
out.push(`  chunks containing a newline:        ${chunksWithNewline}`);
out.push(`  multi-argument calls:              ${multiArg}`);
out.push(`  source lines w/ console.log + \\n:  ${srcNewlineLogLines}  (lower bound, line-keyed)`);
out.push('');
out.push('KNOWN POSITIVES:');
out.push(`  census multi-arg tally can rise:    ${kpMulti} (expect 1)`);
out.push(`  census newline tally can rise:      ${kpEmbedded} (expect 1)`);
out.push(`  partial-write reader, tree-wide:    ${treePartialWrites} in ${treeWriters.length} file(s)`);
for (const w of treeWriters) out.push(`      ${w}`);
out.push(`  line-ending reader, prose plant:    ${kpProse} (expect 1)`);
out.push(`  line-ending reader, label-last row: ${kpRowLast} (expect 1)`);
out.push('');
out.push('PREDICTIONS:');
out.push(`  P1 published(${publishedLines}) > executed calls(${executedCalls}): `
  + `${V(publishedLines > executedCalls)}`);
out.push(`  P2 source lines w/ console.log + \\n >= 1 (${srcNewlineLogLines}): `
  + `${V(srcNewlineLogLines >= 1)}`);
out.push(`  P3 partial-line writes in the gate == 0 (${partialWriteHits(gateSrc)}): `
  + `${treePartialWrites > 0 ? V(partialWriteHits(gateSrc) === 0) : 'UNGRADEABLE (KP returned 0)'}`);
out.push(`  P4 published lines ending in a bare label == 0 (${countEndings(plain)}): `
  + `${kpProse === 1 && kpRowLast === 1 ? V(countEndings(plain) === 0) : 'UNGRADEABLE (KP failed)'}`);
out.push(`  P5 rows-array reach <= 10% (${(rowsReach * 100).toFixed(1)}%): ${V(rowsReach <= 0.10)}`);
out.push(`  P6 multi-argument calls == 0 (${multiArg}): `
  + `${kpMulti === 1 ? V(multiArg === 0) : 'UNGRADEABLE (KP failed)'}`);
out.push('');
out.push('POST-HOC, UNREGISTERED — does a label-ending line move a figure?');
out.push(`  /GUARDED\\s+(\\d+)/ over the real capture:      ${readGuarded(plain)}`);
out.push(`  … over the capture + one prose line:          ${readGuarded(plantProse)}`);
out.push(`  … over the capture + one label-last row:      ${readGuarded(plantRowLast)}`);
out.push('  (first-match readers are order-sensitive: a plant APPENDED cannot displace an earlier');
out.push('   match, so an unchanged figure here is a property of position, not of safety.)');
console.log(out.join('\n'));
