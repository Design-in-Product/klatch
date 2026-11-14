/**
 * unit-465byteslabel — arm C: differentiate arm B's key, and measure the CONSEQUENCE.
 *
 * Arm B's `B5` reported **104 executable sites**. That figure is not publishable as a defect count
 * and is not published as one. Hand-reading arm B's own output shows its key fuses at least three
 * mechanisms:
 *
 *   - genuine mislabels — `${str.length} bytes` where `str` is a utf8 STRING;
 *   - correct labels    — `readFileSync(abs).length` with no encoding returns a **Buffer**, whose
 *                         `.length` IS bytes (`round427…:189` is this, and it is right);
 *   - not byte claims   — `.filter(...).length`, `.split('\n').length`, and booleans named
 *                         `sameBytes`, where `bytes` names a conjunct or a row, not a quantity.
 *
 * An undifferentiated containment match that fuses three mechanisms cannot carry a count. So this
 * arm does two things instead:
 *
 *   1. tightens the key to a PRINTED LABEL adjacent to an interpolated `.length`, classifies each
 *      candidate by receiver provenance, and prints every one for hand reading;
 *   2. measures what the mislabel COSTS, empirically — over the corpus's own files, how often is
 *      `bytes !== chars`? That turns "possibly wrong" into a rate.
 *
 * Mid-fire predictions (Q1–Q4). These are NOT in the pushed pre-registration `d62d8779`; they were
 * written after reading arm B's output and before this arm ran, and are labelled as such rather
 * than presented as pre-registered.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
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
const git = (...a) =>
  execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const tracked = git('ls-tree', '-r', '--name-only', 'HEAD').split('\n').filter(Boolean);

// ===================================================== C3 first: what does the mislabel COST?
// Measured over the corpus's own files. Bytes from the Buffer, chars from the utf8 decode — the
// two quantities the defect confuses, read the only two ways that are each correct for one of them.

function multibyteScan(paths) {
  let differ = 0, same = 0, unreadable = 0;
  let maxDelta = 0, maxPath = '', totalDelta = 0;
  for (const p of paths) {
    let buf;
    try { buf = readFileSync(join(ROOT, p)); } catch { unreadable += 1; continue; }
    const bytes = buf.length;
    const chars = buf.toString('utf8').length;
    const d = bytes - chars;
    if (d !== 0) { differ += 1; totalDelta += d; if (d > maxDelta) { maxDelta = d; maxPath = p; } }
    else same += 1;
  }
  return { differ, same, unreadable, maxDelta, maxPath, totalDelta, n: differ + same };
}

const mjsPaths = tracked.filter((p) => p.endsWith('.mjs'));
const mdPaths = tracked.filter((p) => p.endsWith('.md'));
const outPaths = tracked.filter((p) => p.endsWith('.out'));

const sMjs = multibyteScan(mjsPaths);
const sMd = multibyteScan(mdPaths);
const sOut = multibyteScan(outPaths);

const rate = (s) => `${s.differ}/${s.n} (${((s.differ / s.n) * 100).toFixed(1)}%)`;
leg('C-cost-mjs', true, `.mjs files where bytes !== chars: ${rate(sMjs)} · worst delta ${sMjs.maxDelta} B (${sMjs.maxPath})`);
leg('C-cost-md', true, `.md  files where bytes !== chars: ${rate(sMd)} · worst delta ${sMd.maxDelta} B (${sMd.maxPath})`);
leg('C-cost-out', true, `.out recordings where bytes !== chars: ${rate(sOut)} · worst delta ${sOut.maxDelta} B (${sOut.maxPath})`);

const mjsRate = sMjs.differ / sMjs.n;
pred('Q1', mjsRate > 0.5,
  `a 'bytes' label over a corpus .mjs file's String.length is wrong MOST of the time, not occasionally: ${rate(sMjs)}`);

// The sharpest subset: the instruments' OWN recordings. Legs that print "stdout bytes: N" are
// measuring exactly this text, and this text is where the em dashes and `…` live.
pred('Q2', sOut.differ / sOut.n > 0.5,
  `the corpus's own recorded stdout is multi-byte more often than not (${rate(sOut)}), so every 'stdout bytes: ${'${'}x.length}' leg is wrong on a majority of its possible inputs`);

// ===================================================== C1/C2: tighten and classify the key

// A PRINTED label: the word `bytes` and an interpolated `.length` on the same line, in either order.
const TIGHT = [
  /bytes[^$\n]{0,40}\$\{[^}]*\.length[^}]*\}/i,
  /\$\{[^}]*\.length[^}]*\}[^$\n]{0,20}bytes/i,
  /\bbytes\s*:\s*[A-Za-z_$][\w$.]*\.length/,
];
// Receiver provenance, lexical and declared as such.
const BUFFERISH = /readFileSync\([^,)]*\)\s*\.length|Buffer\.|\.byteLength/;
const ARRAYLIKE = /\.split\([^)]*\)\.length|\.filter\([^)]*\)\.length|\.match\([^)]*\)\.length|rows\.length|files\.length|\bconjuncts?\.length/i;

const cands = [];
for (const p of mjsPaths) {
  if (p.startsWith(THIS_UNIT)) continue;
  let t;
  try { t = readFileSync(join(ROOT, p), 'utf8'); } catch { continue; }
  t.split('\n').forEach((line, i) => {
    if (!TIGHT.some((re) => re.test(line))) return;
    const isComment = /^\s*(\/\/|\*|\/\*)/.test(line);
    let kind = 'STRING';
    if (BUFFERISH.test(line)) kind = 'BUFFER-correct';
    else if (ARRAYLIKE.test(line)) kind = 'ARRAYLIKE-not-a-byte-claim';
    cands.push({ p, i: i + 1, isComment, kind, line: line.trim() });
  });
}

const code = cands.filter((c) => !c.isComment);
const byKind = (k) => code.filter((c) => c.kind === k);
console.log(`          TIGHT key candidates (code lines only): ${code.length}`);
for (const c of code) console.log(`            ${c.kind.padEnd(26)} ${c.p}:${c.i}  ${c.line.slice(0, 120)}`);

leg('C1', true,
  `tight key: ${code.length} code candidates vs arm B's 104 loose hits — ` +
    `STRING=${byKind('STRING').length} BUFFER-correct=${byKind('BUFFER-correct').length} ARRAYLIKE=${byKind('ARRAYLIKE-not-a-byte-claim').length}`);
leg('C2', byKind('BUFFER-correct').length > 0 || byKind('ARRAYLIKE-not-a-byte-claim').length > 0,
  `the loose key DID fuse distinct mechanisms — at least one candidate is a correct label or not a byte claim at all`);
pred('Q3', code.length < 104,
  `arm B's 104 over-reports: the tight key keeps ${code.length}, and even those need hand reading`);

const defectFiles = [...new Set(byKind('STRING').map((c) => c.p))];
leg('C3', true, `files holding a STRING-receiver 'bytes' label: ${defectFiles.length}`);
for (const f of defectFiles) console.log(`            ${f}`);

// Whose files are they? The mechanism is not one seat's.
const seatOf = (p) =>
  /round(3\d\d|4[0-5]\d)-instruments/.test(p) ? 'round-instruments (mixed)' :
  p.startsWith('scripts/') ? 'scripts (shared)' : 'unit dirs (mixed)';
const bySeat = {};
for (const f of defectFiles) { const s = seatOf(f); bySeat[s] = (bySeat[s] || 0) + 1; }
leg('C4', true, `STRING-receiver files by area: ${Object.entries(bySeat).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
pred('Q4', defectFiles.length > 2,
  `the mechanism is not two legs in one unit: ${defectFiles.length} distinct files carry a STRING-receiver 'bytes' label`);

// ===================================================== C5: re-grade P1 with a WINDOW, not a line

// Arm B's `B3` went red on 4 prose sites. A line-granularity key cannot see a correction that sits
// on the NEXT line, which is how prose actually wraps. Re-read with a +/-2 line window.
const FIGS = ['47585', '10552'];
const CORRECTION_WORDS = /char|correct|labelled|labeled|mislabel|UTF-16|code unit|String\.length/i;
const bare = [];
for (const p of mdPaths) {
  if (p.startsWith(THIS_UNIT)) continue;
  let t;
  try { t = readFileSync(join(ROOT, p), 'utf8'); } catch { continue; }
  const lines = t.split('\n');
  lines.forEach((line, i) => {
    if (!FIGS.some((f) => line.includes(f))) return;
    const win = lines.slice(Math.max(0, i - 2), i + 3).join('\n');
    if (!CORRECTION_WORDS.test(win)) bare.push({ p, i: i + 1, line: line.trim() });
  });
}
console.log(`          prose sites still BARE under a +/-2 line window: ${bare.length}`);
for (const b of bare) console.log(`            ${b.p}:${b.i}  ${b.line.slice(0, 140)}`);
leg('C5', true, `bare prose sites under a window (vs 4 under arm B's line key): ${bare.length}`);
pred('Q5', bare.length < 4,
  `arm B's B3 red was partly its own line-granularity: a windowed read leaves ${bare.length} of 4`);

const dirty = git('status', '--porcelain', 'docs/research/lib', 'packages', 'scripts').trim();
leg('C-gate', dirty === '', `git status --porcelain docs/research/lib packages scripts → ${JSON.stringify(dirty)}`);

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
    `preds=${preds.length} refuted=[${refuted}] prefused=[${prefused}]`
);
process.exit(exit);
