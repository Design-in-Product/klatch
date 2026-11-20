/**
 * unit-488markedkeykp — the KP set the `MARKED` re-key is blocked on.
 *
 * Daedalus's `unit-487markerreport` routed one thing to this seat with a named blocker: re-keying the
 * `MARKED` verdict from `MARKER.test(raw)` to the DECLARED-only reading is *"priced at 0 verdict
 * moves — but a key change with zero measured movement still needs a KP proving the new reading can
 * report a difference at all, and that KP set does not exist."* The same sentence is in the gate's own
 * `declaredMarkerCount` docblock. This arm builds the KP set.
 *
 * ## Capture, never re-type
 *
 * `MARKER`, `MARKER_ALL` and `declaredMarkerCount` are module-private to
 * `scripts/verify-decl-body-slicers.mjs`, so they cannot be imported. They are **sliced verbatim out
 * of the gate's source** and re-materialised as a module beside the real
 * `scripts/lib/strip-source.mjs`. Every span is asserted present before use; a capture miss is
 * `rc=3`, never a fallback literal. The verdict PREDICATES are captured too, so the branch literals
 * this arm classifies on are the gate's own text rather than this seat's memory of it.
 *
 * ## The KP inputs are assembled from captured spans, not hand-typed
 *
 * A typed file containing a marker comment and `s[i] === '{'` would prove a regex can tell a comment
 * from a string, which nobody doubts. It would prove nothing about this corpus. So each KP is built
 * from three spans sliced out of live tracked files: `P` (a one-char brace-comparison pair out of a
 * live population member), `D` (a declared marker out of a live `MARKED` file's comment) and `Q` (the
 * token quoted in a string literal out of `unit-487markerreport`'s cripple, which is the whole
 * `NOT A MARKER` class the gate reports today).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');
const LIB = join(ROOT, 'scripts/lib/strip-source.mjs');
const SCRATCH = join(ROOT, '.scratch/unit-488markedkeykp');

const refuse = (why) => { console.error(`arm-markedkeykp: REFUSING (rc=3) — ${why}`); process.exit(3); };

const gateSrc = readFileSync(GATE, 'utf8');

/* ------------------------------------------------- capture the keys out of the gate, verbatim */
/** Slice `[from, to]` inclusive of both anchors; refuse if either is absent or out of order. */
function span(label, from, to) {
  const a = gateSrc.indexOf(from);
  if (a < 0) refuse(`capture failed: ${label} start anchor absent from the gate`);
  const b = gateSrc.indexOf(to, a + from.length);
  if (b < 0) refuse(`capture failed: ${label} end anchor absent after its start`);
  return gateSrc.slice(a, b + to.length);
}
function line(label, anchor) {
  const a = gateSrc.indexOf(anchor);
  if (a < 0) refuse(`capture failed: ${label} absent from the gate`);
  if (gateSrc.indexOf(anchor, a + anchor.length) >= 0) {
    refuse(`capture ambiguous: ${label} appears more than once in the gate`);
  }
  const start = gateSrc.lastIndexOf('\n', a) + 1;
  const end = gateSrc.indexOf('\n', a);
  return gateSrc.slice(start, end < 0 ? gateSrc.length : end);
}

const capCmp = line('cmp', 'const cmp = (ch) =>');
const capOpen = line('OPEN_BRACE', "const OPEN_BRACE = cmp('{');");
const capClose = line('CLOSE_BRACE', "const CLOSE_BRACE = cmp('}');");
const capLparen = line('LPAREN', "const LPAREN = cmp('(');");
const capRparen = line('RPAREN', "const RPAREN = cmp(')');");
const capColon = line('COLON', "const COLON = cmp(':');");
// **Drive 1 refused here, and the refusal is a finding rather than a typo.** The anchor was
// `const MARKER = /brace-slicer-deliberate:` and the gate contains it TWICE: once as the
// declaration, once inside `declaredMarkerCount`'s own docblock, which quotes the key line it is
// explaining. That is `unit-487markerreport` §4's irreducible limit — *a comment quoting the key
// cannot be told from the key* — arriving one layer further out, in the CAPTURE anchor rather than
// in the count. The cure is the same shape the gate's own §4 says is unavailable to it: anchor on
// the whole declaration including its terminator, which the prose copy elides to `…/;`.
const capMarker = line('MARKER', String.raw`const MARKER = /brace-slicer-deliberate:\s*\S+/;`);
const capMarkerAll = line('MARKER_ALL', 'const MARKER_ALL = new RegExp(MARKER.source,');
const capPopLine = line('population reading', 'const code = blankLongStrings(raw, 2);');
const capDeclared = span('declaredMarkerCount', 'function declaredMarkerCount(raw) {', '\n  return n;\n}');

// A present anchor is not an intact span: assert the captured function still carries the three
// things its discrimination is made of, and the population line still names the 2-char threshold.
for (const needle of ['stripSource(raw, false)', 'MARKER_ALL', "kept.startsWith('brace-slicer-deliberate:'"]) {
  if (!capDeclared.includes(needle)) refuse(`captured declaredMarkerCount does not contain ${needle}`);
}
if (!capPopLine.includes('blankLongStrings(raw, 2)')) refuse('captured population line lost its threshold');

// The verdict PREDICATES, captured so the branch literals below are the gate's and not recalled.
const capOutOfPop = line('out-of-population branch', 'if (!OPEN_BRACE.test(code) || !CLOSE_BRACE.test(code)) {');
const capMarkedBranch = line('MARKED branch', "verdicts.set(rel, 'MARKED');");
const capGuardedBranch = line('GUARDED branch', "else if (LPAREN.test(code) && RPAREN.test(code) && COLON.test(code)) verdicts.set(rel, 'GUARDED');");
const capUnguardedBranch = line('UNGUARDED branch', "else verdicts.set(rel, 'UNGUARDED');");
// The OLD key's text is the line immediately above the MARKED branch; located RELATIVE to that
// branch rather than by first occurrence, because `MARKER.test(raw)` appears twice in the gate —
// once in the out-of-population disclosure arm and once as the verdict key. `line()` would refuse
// it as ambiguous, which is the right refusal and the wrong capture.
const markedAt = gateSrc.indexOf("verdicts.set(rel, 'MARKED');");
const oldKeyStart = gateSrc.lastIndexOf('if (MARKER.test(raw)) {', markedAt);
if (oldKeyStart < 0) refuse('capture failed: the OLD key line above the MARKED branch is absent');
const capOldKeyLine = gateSrc.slice(oldKeyStart, gateSrc.indexOf('\n', oldKeyStart));

/* ------------------------------------------------ re-materialise the captured keys as a module */
mkdirSync(SCRATCH, { recursive: true });
const keyModule = [
  `import { blankLongStrings, stripSource } from ${JSON.stringify(pathToFileURL(LIB).href)};`,
  capCmp, capOpen, capClose, capLparen, capRparen, capColon, capMarker, capMarkerAll, capDeclared,
  'export const popReading = (raw) => ' + capPopLine.trim().replace(/^const code = /, '').replace(/;$/, '') + ';',
  'export { OPEN_BRACE, CLOSE_BRACE, LPAREN, RPAREN, COLON, MARKER, declaredMarkerCount };',
].join('\n');
const keyPath = join(SCRATCH, 'captured-keys.mjs');
writeFileSync(keyPath, `${keyModule}\n`);
const K = await import(pathToFileURL(keyPath).href);

/* --------------------------------------------------------------------------- the classifier */
// Derived from the four captured branch lines above, in the gate's own order. `keyKind` selects
// which MARKED key is in force; everything else is identical between the two arms by construction,
// so a verdict difference can only be the key.
function classify(raw, keyKind) {
  const code = K.popReading(raw);
  const marked = keyKind === 'OLD' ? K.MARKER.test(raw) : K.declaredMarkerCount(raw) > 0;
  if (!K.OPEN_BRACE.test(code) || !K.CLOSE_BRACE.test(code)) return 'OUT-OF-POPULATION';
  if (marked) return 'MARKED';
  if (K.LPAREN.test(code) && K.RPAREN.test(code) && K.COLON.test(code)) return 'GUARDED';
  return 'UNGUARDED';
}

/* ----------------------------------------------------------------- the live tracked population */
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);
const SELF = new Set(['scripts/verify-decl-body-slicers.mjs', 'scripts/decl-body-slicers.baseline']);
let tracked;
try {
  tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
    .split('\n').map((l) => l.trim()).filter(Boolean);
} catch (e) { refuse(`could not list tracked files: ${e.message}`); }
const baselineSet = new Set(readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean));

const files = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw;
  try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  files.push([rel, raw]);
}

/* ---------------------------------------------------------------- capture the three KP spans */
/** The raw line holding the Nth match of `re` in `code`, offsets taken from a same-length reading. */
function lineAt(raw, at) {
  const s = raw.lastIndexOf('\n', at) + 1;
  const e = raw.indexOf('\n', at);
  return raw.slice(s, e < 0 ? raw.length : e);
}

// P — a one-char brace-comparison PAIR out of a live population member, chosen by a stated rule:
// the first member whose two candidate lines together carry no paren/colon comparison, so KP2's
// new-key verdict is UNGUARDED rather than GUARDED (P5) and the KP prices the failure direction.
let P = null;
for (const [rel, raw] of files) {
  const code = K.popReading(raw);
  if (code.length !== raw.length) continue;
  const o = code.match(K.OPEN_BRACE);
  const c = code.match(K.CLOSE_BRACE);
  if (!o || !c) continue;
  const lo = lineAt(raw, o.index);
  const lc = lineAt(raw, c.index);
  const joined = `${lo}\n${lc}`;
  const jc = K.popReading(joined);
  if (!K.OPEN_BRACE.test(jc) || !K.CLOSE_BRACE.test(jc)) continue;      // the pair must survive the slice
  if (K.LPAREN.test(jc) || K.RPAREN.test(jc) || K.COLON.test(jc)) continue;
  if (K.MARKER.test(joined)) continue;                                   // P must carry no marker
  P = { from: rel, text: joined, openSpan: o[0], closeSpan: c[0] };
  break;
}
if (!P) refuse('no live population member yields a brace-comparison pair free of paren/colon comparisons');

// D — a DECLARED marker, sliced out of a live MARKED file's comment. Asserted declared by the gate's
// own discrimination: the token is GONE from the strings-KEPT reading at its offset.
let D = null;
for (const [rel, raw] of files) {
  if (classify(raw, 'OLD') !== 'MARKED') continue;
  if (K.declaredMarkerCount(raw) < 1) continue;
  const m = raw.match(K.MARKER);
  const text = lineAt(raw, m.index);
  if (K.declaredMarkerCount(text) !== 1) continue;        // the slice must keep the property
  D = { from: rel, text };
  break;
}
if (!D) refuse('no live MARKED file yields a one-line span carrying exactly one declared marker');

// Q — the token QUOTED inside a string literal, sliced out of the file the gate reports today as the
// whole NOT-A-MARKER class. Asserted quoted: the marker key matches the slice and the declared count
// on it is zero.
const Q_FROM = 'docs/research/unit-487markerreport-2026-11-19/cripple-dead-marker-key.mjs';
const qEntry = files.find(([rel]) => rel === Q_FROM);
if (!qEntry) refuse(`${Q_FROM} is not a tracked code file — the quoted class has no live source to slice`);
let Q = null;
for (const m of qEntry[1].matchAll(new RegExp(K.MARKER.source, 'g'))) {
  const text = lineAt(qEntry[1], m.index);
  if (K.MARKER.test(text) && K.declaredMarkerCount(text) === 0) { Q = { from: Q_FROM, text }; break; }
}
if (!Q) refuse(`${Q_FROM} yields no one-line span whose marker token is quoted rather than declared`);

/* ----------------------------------------------------------- POST-HOC, added after drive 3 */
// **`G` and `KP4` are POST-HOC.** Drive 3 graded all seven registered predictions (7 HIT, 0
// REFUTED) and `drive3.arm.out` is kept as that record, unmodified. What drive 3 showed is that the
// re-key's failure direction on this tree is LOUD — all 4 live `MARKED` files would fall through to
// `UNGUARDED` and none is baselined, so each would redden. That makes the opposite direction worth
// a KP too: a file carrying a quoted-only marker **and** paren/colon comparisons would fall through
// to `GUARDED` and change column in SILENCE. `LIVE LEG 1` measures that class at **zero members
// today** (0 quoted-only in the population), so without a KP it would be a declared reach held open
// by a claim rather than by an instrument. `G` is sliced out of a live `GUARDED` file.
let G = null;
for (const [rel, raw] of files) {
  if (classify(raw, 'OLD') !== 'GUARDED') continue;
  const code = K.popReading(raw);
  if (code.length !== raw.length) continue;
  const parts = [];
  for (const re of [K.LPAREN, K.RPAREN, K.COLON]) {
    const m = code.match(re);
    if (m) parts.push(lineAt(raw, m.index));
  }
  if (parts.length !== 3) continue;
  const joined = [...new Set(parts)].join('\n');
  const jc = K.popReading(joined);
  if (!K.LPAREN.test(jc) || !K.RPAREN.test(jc) || !K.COLON.test(jc)) continue;
  if (K.MARKER.test(joined)) continue;
  G = { from: rel, text: joined };
  break;
}
if (!G) refuse('no live GUARDED file yields spans carrying all three of LPAREN/RPAREN/COLON');

/* ------------------------------------------------------------------------------- the KP set */
const KPS = [
  ['KP1', `${P.text}\n${D.text}\n`, 'P + D — a declared exemption in the population'],
  ['KP2', `${P.text}\n${Q.text}\n`, 'P + Q — the difference this KP set exists to prove'],
  ['KP3', `${P.text}\n`, 'P alone — the marker key fires on neither reading'],
  ['KN-D', `${D.text}\n`, 'D alone — a marker is not a verdict'],
  ['KN-Q', `${Q.text}\n`, 'Q alone — a fixture is not a verdict'],
  ['KP4', `${P.text}\n${G.text}\n${Q.text}\n`, 'POST-HOC: P + G + Q — the SILENT direction'],
];

console.log('unit-488markedkeykp — the KP set for the MARKED re-key');
console.log(`  subject: scripts/verify-decl-body-slicers.mjs (${gateSrc.length} bytes)`);
console.log(`  captured OLD key:  ${capOldKeyLine.trim()}`);
console.log(`  captured branches: ${capGuardedBranch.trim().slice(0, 96)}…`);
console.log(`  captured NEW key:  declaredMarkerCount(raw) > 0  (${capDeclared.length}-byte span, verbatim)`);
console.log(`  captured keys module: ${keyPath.replace(ROOT + '/', '')}`);
console.log('');
console.log('  SPANS (sliced verbatim, never typed):');
console.log(`    P  ← ${P.from}`);
for (const l of P.text.split('\n')) console.log(`         | ${l}`);
console.log(`    D  ← ${D.from}`);
console.log(`         | ${D.text}`);
console.log(`    Q  ← ${Q.from}`);
console.log(`         | ${Q.text}`);
console.log(`    G  ← ${G.from}   (POST-HOC)`);
for (const l of G.text.split('\n')) console.log(`         | ${l}`);
console.log('');
console.log('  VERDICT MATRIX — same classifier, same population reading, only the MARKED key differs:');
console.log(`    ${'KP'.padEnd(6)} ${'OLD (MARKER.test(raw))'.padEnd(24)} ${'NEW (declared only)'.padEnd(22)} moves?`);
let moved = 0;
const matrix = [];
for (const [name, src, why] of KPS) {
  writeFileSync(join(SCRATCH, `${name}.mjs`), src);
  const o = classify(src, 'OLD');
  const n = classify(src, 'NEW');
  const diff = o !== n;
  if (diff) moved += 1;
  matrix.push([name, o, n, diff, why]);
  console.log(`    ${name.padEnd(6)} ${o.padEnd(24)} ${n.padEnd(22)} ${diff ? 'YES' : 'no'}   ${why}`);
}
console.log(`    → ${moved} of ${KPS.length} KP(s) move (5 registered + 1 post-hoc).`
  + ` The KP set can report a difference: ${moved > 0 ? 'YES' : 'NO'}`);
const kp4 = matrix.find((r) => r[0] === 'KP4');
console.log(`    → POST-HOC, the silent direction: KP4 OLD=${kp4[1]} NEW=${kp4[2]} — a quoted-only`
  + ` marker beside paren/colon comparisons ${kp4[2] === 'GUARDED' ? 'CHANGES COLUMN WITHOUT REDDENING' : `lands ${kp4[2]}`}.`);

/* ------------------------------- LIVE LEG 1 (P6): the re-key's measured price on this tree today */
console.log('');
console.log('  LIVE LEG 1 — every in-population marker-bearing tracked file, DECLARED vs QUOTED:');
const inPop = [];
for (const [rel, raw] of files) {
  if (classify(raw, 'OLD') !== 'MARKED') continue;
  const n = K.declaredMarkerCount(raw);
  // `raw` is carried in the row. Drive 2 crashed here with `blankLongStrings: got a number` because
  // the row was `[rel, n]` and LIVE LEG 2 destructured its second element as `raw` — the same
  // shape-of-the-row defect this seat has logged before. The refusal in `strip-source.mjs` is what
  // caught it; a reader that coerced would have given leg 2 a verdict off the digit string.
  inPop.push([rel, n, raw]);
}
const declared = inPop.filter(([, n]) => n > 0);
const quoted = inPop.filter(([, n]) => n === 0);
for (const [rel, n] of inPop) console.log(`      ${n > 0 ? 'DECLARED' : 'QUOTED  '} ${n} ${rel}`);
console.log(`    → ${inPop.length} in-population MARKED: ${declared.length} declared, ${quoted.length} quoted-only.`);
console.log(`    → the re-key moves ${quoted.length} verdict(s) on this tree today.`);

/* ------------------------------- LIVE LEG 2 (P7): what the exemption is actually buying each file */
console.log('');
console.log('  LIVE LEG 2 — the verdict each MARKED file would FALL THROUGH to, and whether that reddens:');
let wouldRedden = 0;
for (const [rel, , raw] of inPop) {
  const code = K.popReading(raw);
  const through = (K.LPAREN.test(code) && K.RPAREN.test(code) && K.COLON.test(code)) ? 'GUARDED' : 'UNGUARDED';
  const based = baselineSet.has(rel);
  const reddens = through === 'UNGUARDED' && !based;
  if (reddens) wouldRedden += 1;
  console.log(`      ${through.padEnd(10)} baselined=${String(based).padEnd(5)} reddens=${String(reddens).padEnd(5)} ${rel}`);
}
console.log(`    → ${wouldRedden} of ${inPop.length} would REDDEN the gate if its marker stopped counting.`);
console.log('');
console.log(`  population (this arm, same key as the gate): ${files.filter(([, raw]) => classify(raw, 'OLD') !== 'OUT-OF-POPULATION').length}`);
console.log(`  tracked code files read: ${files.length} · baseline entries: ${baselineSet.size}`);

/* --------------------------------------------------------------------------- registered answers */
const verdictOf = (name) => matrix.find((r) => r[0] === name);
const results = [
  ['P1', 'KP2 exists and the keys DISAGREE on it: OLD MARKED, NEW not MARKED',
    verdictOf('KP2')[1] === 'MARKED' && verdictOf('KP2')[2] !== 'MARKED'],
  ['P2', 'KP1 is MARKED under BOTH keys — no declared exemption is lost',
    verdictOf('KP1')[1] === 'MARKED' && verdictOf('KP1')[2] === 'MARKED'],
  ['P3', 'KP3 is IN the population and MARKED under neither key',
    verdictOf('KP3')[1] !== 'OUT-OF-POPULATION' && verdictOf('KP3')[1] !== 'MARKED' && verdictOf('KP3')[2] !== 'MARKED'],
  ['P4', 'KN-D and KN-Q are both OUT of the population under both keys',
    verdictOf('KN-D')[1] === 'OUT-OF-POPULATION' && verdictOf('KN-D')[2] === 'OUT-OF-POPULATION'
    && verdictOf('KN-Q')[1] === 'OUT-OF-POPULATION' && verdictOf('KN-Q')[2] === 'OUT-OF-POPULATION'],
  ['P5', "KP2's NEW verdict is UNGUARDED, not GUARDED", verdictOf('KP2')[2] === 'UNGUARDED'],
  ['P6', 'in-population quoted-only = 0 (4 of 4 declared), so the re-key prices at 0 moves today',
    quoted.length === 0 && declared.length === 4],
  ['P7', 'at least 1 of the MARKED files would fall through to UNGUARDED and is NOT baselined',
    wouldRedden >= 1],
];
console.log('');
console.log('  REGISTERED PREDICTIONS (pre-reg §4, graded here):');
let hit = 0;
for (const [id, text, ok] of results) {
  if (ok) hit += 1;
  console.log(`    ${ok ? 'HIT     ' : 'REFUTED '} ${id} — ${text}`);
}
console.log(`  → ${hit} HIT, ${results.length - hit} REFUTED, of ${results.length}.`);
if (moved === 0) {
  console.error('arm-markedkeykp: the KP set reports NO difference — the stated blocker is NOT discharged.');
  process.exit(1);
}
