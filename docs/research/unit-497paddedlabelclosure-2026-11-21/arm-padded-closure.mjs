#!/usr/bin/env node
/**
 * unit-497paddedlabelclosure — arm for P1, P2, P3, P4, P6.
 *
 * Theseus's 11-21 §2: assertion (c) in `scripts/verify-decl-body-slicers.mjs` keys on
 * `line.endsWith(label)`, while the fusion hazard's own reader is `/LABEL\s+(\d+)/`, whose `\s+`
 * eats trailing whitespace as well as the newline. One trailing space is the whole distance.
 *
 * This arm does not re-type `publish()`. It slices the real body out of the real gate with the
 * SHARED slicer (`scripts/lib/decl-body.mjs` → `bodyOf`), asserts the slice is byte-identical to a
 * span of the file AND pins the span's start offset (a count of 1 does not pin an anchor), then
 * drives the PRE and POST forms of the key against the same plants in child processes, so a
 * `process.exit(2)` refusal is observable as an exit code rather than as a thrown object.
 *
 * The POST form is produced from the PRE form by ONE textual substitution whose match count is
 * asserted to be exactly 1 — so the two columns differ in the key and in nothing else.
 *
 * This file hand-rolls no brace-balance slicer; it imports the shared one, so it needs no exemption
 * and deliberately does NOT write the exemption token — writing the token to say "not needed" is
 * what put the first draft of this file into the gate's own dead-marker list (see the post-hoc).
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { bodyOf } from '../../../scripts/lib/decl-body.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = resolve(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const SCRATCH = resolve(ROOT, 'scripts/scratch-unit497-arm.mjs'); // at scripts/ depth, untracked

const src = readFileSync(GATE, 'utf8');
const body = bodyOf(src, 'publish');
if (typeof body !== 'string' || body.length === 0) throw new Error('arm: publish() body not sliced');

// --- the slice is a real span of the real file, and its start anchor is pinned ---------------
const occurrences = src.split(body).length - 1;
const startOffset = src.indexOf(body);
const headOffset = src.indexOf('function publish(sink, args)');
if (occurrences !== 1) throw new Error(`arm: publish() body appears ${occurrences}× — span ambiguous`);
if (startOffset < headOffset) throw new Error('arm: sliced span starts BEFORE the declaration head');
const sliceReport = {
  bytes: Buffer.byteLength(body),
  codeUnits: body.length,
  occurrencesInFile: occurrences,
  startOffset,
  byteIdentical: src.slice(startOffset, startOffset + body.length) === body,
};
if (!sliceReport.byteIdentical) throw new Error('arm: slice is not byte-identical to the file span');

// --- one substitution, asserted to be exactly one, in WHICHEVER direction the tree is in -------
//
// The first draft of this arm assumed the live body carried the PRE key and derived POST from it.
// That assumption held for exactly as long as the cure was unlanded: the moment the widened key
// went into the gate, this arm threw `the PRE key occurs 0× in the sliced body`. A harness keyed on
// the hazard's spelling dies when the hazard is fixed — the same shape as Theseus's own 11-21 §3
// refutation (a detector keyed on the hazard's form goes silent *because* the hazard was fixed),
// reproduced here one fire later in a harness rather than in a census. The arm is therefore
// direction-agnostic: it reads which form the tree is in, asserts exactly one of the two is
// present, and derives its counterfactual in whichever direction is needed.
const PRE_KEY = 'LABELS.find((v) => line.endsWith(v))';
const POST_KEY = 'LABELS.find((v) => line.trimEnd().endsWith(v))';
const preHits = body.split(PRE_KEY).length - 1;
const postHits = body.split(POST_KEY).length - 1;
// `POST_KEY` contains `.endsWith(v)` but not the exact `line.endsWith(v)` substring, so the two
// counts are independent rather than nested; assert that, don't assume it.
if (preHits + postHits !== 1) {
  throw new Error(`arm: the sliced body carries PRE×${preHits} and POST×${postHits}; exactly one form must be present`);
}
const liveForm = postHits === 1 ? 'POST (cured)' : 'PRE (uncured)';
const preBody = postHits === 1 ? body.replace(POST_KEY, PRE_KEY) : body;
const postBody = postHits === 1 ? body : body.replace(PRE_KEY, POST_KEY);
if (postBody === preBody) throw new Error('arm: substitution produced an identical body');
if (preBody.split(PRE_KEY).length - 1 !== 1) throw new Error('arm: PRE key not present exactly once');
if (postBody.split(POST_KEY).length - 1 !== 1) throw new Error('arm: POST key not present exactly once');

// --- plants ------------------------------------------------------------------------------------
const PLANTS = [
  ['kp-bare', 'row  GUARDED'],
  ['padded-one-space', 'row  GUARDED '],
  ['padded-two-spaces', 'row  GUARDED  '],
  ['padded-tab', 'row  GUARDED\t'],
  ['padded-cr', 'row  GUARDED\r'],
  ['control-quoted', 'row  `GUARDED`'],
  ['control-absent-terminal', 'row  → now ABSENT'],
];

function drive(bodyText, plant) {
  const harness = `import { format } from 'node:util';
const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];
function refuse(message) {
  console.error(\`verify-decl-body-slicers: BLOCKED — \${message}\`);
  process.exit(2);
}
function publish(sink, args) {${bodyText}}
const emit = (...args) => publish((c) => console.log(c), args);
emit(${JSON.stringify(plant)});
`;
  writeFileSync(SCRATCH, harness);
  try {
    const r = spawnSync(process.execPath, [SCRATCH], { encoding: 'buffer' });
    return {
      rc: r.status,
      stdoutBytes: r.stdout.length,
      stderrBytes: r.stderr.length,
      published: r.status === 0 && r.stdout.length > 0,
      refused: r.status === 2,
    };
  } finally {
    rmSync(SCRATCH, { force: true });
  }
}

console.log('unit-497paddedlabelclosure — arm');
console.log('');
console.log('## slice provenance (the subject is the real `publish()`, not a re-typing)');
console.log(`  sliced body: ${sliceReport.bytes} bytes / ${sliceReport.codeUnits} UTF-16 code units`);
console.log(`  occurrences in file: ${sliceReport.occurrencesInFile}  start offset: ${sliceReport.startOffset}`
  + `  (declaration head at ${headOffset})`);
console.log(`  byte-identical to the file span: ${sliceReport.byteIdentical}`);
console.log(`  live form in the tree: ${liveForm}  (PRE×${preHits}, POST×${postHits} — exactly one asserted)`);
console.log('  PRE key present exactly once in the PRE form: true   POST key likewise in the POST form: true');
console.log('');

// --- P2 / P3 matrix -----------------------------------------------------------------------------
console.log('## P2 (PRE column) and P3 (POST column) — same plants, keys differing by one substitution');
const matrix = [];
for (const [name, plant] of PLANTS) {
  const pre = drive(preBody, plant);
  const post = drive(postBody, plant);
  matrix.push({ name, pre, post });
  const cell = (r) => (r.refused ? `rc=${r.rc} REFUSED` : `rc=${r.rc} published ${r.stdoutBytes} B`);
  console.log(`  ${name.padEnd(24)} PRE: ${cell(pre).padEnd(24)} POST: ${cell(post)}`);
}
const padded = matrix.filter((m) => m.name.startsWith('padded-'));
const kp = matrix.find((m) => m.name === 'kp-bare');
const quoted = matrix.find((m) => m.name === 'control-quoted');
const absent = matrix.find((m) => m.name === 'control-absent-terminal');
console.log('');
console.log(`  P2: KP (bare) refuses PRE = ${kp.pre.refused}; padded published PRE = `
  + `${padded.filter((m) => m.pre.published).length} of ${padded.length}`);
console.log(`  P3: padded refused POST = ${padded.filter((m) => m.post.refused).length} of ${padded.length}`
  + `; bare still refuses = ${kp.post.refused}`
  + `; quoted still publishes = ${quoted.post.published}`
  + `; ABSENT still publishes = ${absent.post.published}`);
console.log('');

// --- P4: is `trimEnd` exactly the closure of `\s`? ----------------------------------------------
console.log('## P4 — `trimEnd()` vs the hazard reader\'s own `\\s*$`, over a DERIVED whitespace set');
const ws = [];
for (let cp = 0; cp <= 0xffff; cp += 1) {
  const c = String.fromCharCode(cp);
  if (/\s/.test(c)) ws.push(c);
}
const LABEL_SET = ['MARKED', 'GUARDED', 'UNGUARDED'];
const A = (line) => LABEL_SET.some((v) => line.trimEnd().endsWith(v));
const B = (line) => /(?:MARKED|GUARDED|UNGUARDED)\s*$/.test(line);
const disagreements = [];
for (const c of ws) {
  const line = `row  GUARDED${c}`;
  if (A(line) !== B(line)) disagreements.push({ cp: c.codePointAt(0), a: A(line), b: B(line) });
}
const CONTROLS = ['x', '0', '`', '·', '᠎', '"'];
const controlDisagreements = [];
for (const c of CONTROLS) {
  const line = `row  GUARDED${c}`;
  if (A(line) !== B(line)) controlDisagreements.push({ cp: c.codePointAt(0), a: A(line), b: B(line) });
}
console.log(`  whitespace characters derived from /\\s/ over U+0000..U+FFFF: ${ws.length}`);
console.log(`  disagreements between trimEnd-key and /LABEL\\s*$/ on the whitespace set: ${disagreements.length}`
  + (disagreements.length ? `  ${JSON.stringify(disagreements)}` : ''));
console.log(`  non-whitespace control set (${CONTROLS.length} chars, both predicates must be false):`
  + ` disagreements = ${controlDisagreements.length}`
  + `, both-false = ${CONTROLS.filter((c) => !A(`row  GUARDED${c}`) && !B(`row  GUARDED${c}`)).length}`);
console.log('');

// --- P1 and P6: the live gate's own published lines, under this seat's own reader ---------------
console.log('## P1 — reach in the live tree, with a KP for the zero');
const live = spawnSync(process.execPath, [GATE], { encoding: 'buffer', cwd: ROOT });
const out = live.stdout.toString('utf8');
const lines = out.split('\n').filter((l, i, a) => !(i === a.length - 1 && l === ''));
const endsWs = lines.filter((l) => l !== l.trimEnd());
const bareTerminal = lines.filter((l) => LABEL_SET.some((v) => l.endsWith(v)));
const trimTerminal = lines.filter((l) => LABEL_SET.some((v) => l.trimEnd().endsWith(v)));
const KP_LINE = '  x  GUARDED ';
console.log(`  gate rc=${live.status}  published stdout lines: ${lines.length}`);
console.log(`  lines ending in whitespace: ${endsWs.length}`);
console.log(`  label-terminal under bare endsWith: ${bareTerminal.length}`);
console.log(`  label-terminal under trimEnd key:   ${trimTerminal.length}`);
console.log(`  KP over a synthetic line that MUST report 1: ends-in-whitespace=`
  + `${KP_LINE !== KP_LINE.trimEnd() ? 1 : 0}`
  + `  trimEnd-key=${LABEL_SET.some((v) => KP_LINE.trimEnd().endsWith(v)) ? 1 : 0}`
  + `  bare-key=${LABEL_SET.some((v) => KP_LINE.endsWith(v)) ? 1 : 0}  (expected 1 · 1 · 0)`);
console.log('');
console.log('## P6 — this seat\'s own 3888 mechanism, re-derived rather than recalled');
const bytes = Buffer.byteLength(out);
const codeUnits = out.length;
const emDashes = (out.match(/—/g) || []).length;
console.log(`  stdout: ${bytes} bytes (Buffer.byteLength) · ${codeUnits} UTF-16 code units · delta ${bytes - codeUnits}`);
console.log(`  em-dashes in stdout: ${emDashes}  × 2 extra UTF-8 bytes each = ${emDashes * 2}`);
console.log(`  delta accounted for by em-dashes alone: ${bytes - codeUnits === emDashes * 2}`);
console.log('');
const ok = kp.pre.refused && padded.every((m) => m.pre.published)
  && padded.every((m) => m.post.refused) && kp.post.refused
  && quoted.post.published && absent.post.published
  && disagreements.length === 0 && controlDisagreements.length === 0
  && endsWs.length === 0 && bareTerminal.length === 0 && trimTerminal.length === 0;
console.log(`ARM ${ok ? 'OK' : 'ATTENTION'} — every registered cell above is a drive of the real sliced \`publish()\`;`
  + ' the PRE column is the counterfactual that makes the POST column a measurement.');
