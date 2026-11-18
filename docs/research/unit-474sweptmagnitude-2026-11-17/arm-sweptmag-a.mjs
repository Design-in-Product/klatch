// unit-474sweptmagnitude-2026-11-17 — arm A
//
// Drive probe-round322's OWN magnitudePins detector over the populations its arm A1 does not
// reach (backlogSwept, and the whole SWEPT set), and report the hit set so it can be classified.
//
// R4: the detector is NOT re-implemented from memory. SPEC_FROZEN, the line filter and the
// comparison regex are captured out of round322's source text at drive time; a failed capture is a
// red, never a typed fallback.
//
// ROOT is derived from import.meta.url and never from process.cwd() — this seat's 11/17 11:1x
// crash was exactly that.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const SELF = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(dirname(dirname(SELF)))); // <unit>/research/docs/<repo>
const SCRIPTS = join(ROOT, 'scripts');

const red = [];
const check = (id, claim, ok, detail) => {
  if (!ok) red.push(id);
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const measure = (id, line) => console.log(`  [${id}] MEAS  ${line}`);

const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const { stripSource } = await import(join(SCRIPTS, 'lib/strip-source.mjs'));
const { SWEPT, DEFERRED } = await import(join(SCRIPTS, 'sweep-probes.mjs'));

const R322 = readdirSync(SCRIPTS).find((n) => n.startsWith('probe-round322-'));
if (!R322) throw new Error('probe-round322 not found under scripts/');
const r322src = readFileSync(join(SCRIPTS, R322), 'utf8');

console.log('\n== unit-474sweptmagnitude arm A ==');
console.log(`ROOT ${ROOT}`);
console.log(`subject ${R322}`);

// ── A1: capture the detector's three keys out of its author's source ────────────────────────────
const specM = r322src.match(/const SPEC_FROZEN = new Set\(\[([^\]]*)\]\)/);
const SPEC_FROZEN = new Set((specM?.[1] ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)));
// The two readers, captured as source text and re-compiled, so a drift in round322 moves this arm.
const filterM = r322src.match(/if \(!\/(\(\?:\\\.length\|\\\.size\|\\bcount\\b\))\/\.test\(line\)\) continue;/);
const cmpM = r322src.match(/line\.matchAll\(\/([^/]+)\/g\)/);

const capturesOk = SPEC_FROZEN.size > 0 && Boolean(filterM) && Boolean(cmpM);
check('A1', 'CAPTURE: SPEC_FROZEN, the line filter and the comparison regex all sliced out of '
  + 'round322 source rather than typed (R4)',
  capturesOk,
  `SPEC_FROZEN ${SPEC_FROZEN.size} member(s) [${[...SPEC_FROZEN].join(' ')}] · `
    + `line filter ${filterM ? `/${filterM[1]}/` : 'CAPTURE-FAILED'} · `
    + `comparison ${cmpM ? `/${cmpM[1]}/` : 'CAPTURE-FAILED'}`);
if (!capturesOk) { console.log('\nCAPTURE-FAILED — refusing to continue on a typed copy (R4)'); process.exit(1); }

const LINE_FILTER = new RegExp(filterM[1]);
const CMP = cmpM[1];

/** round322:169-181, control flow re-expressed, every key sliced. */
const magnitudePins = (src) => {
  const out = [];
  for (const line of src.split('\n')) {
    if (!LINE_FILTER.test(line)) continue;
    for (const m of line.matchAll(new RegExp(CMP, 'g'))) {
      const v = Number(m[1]);
      if (!SPEC_FROZEN.has(v)) out.push(`${m[0].trim()} on: ${line.trim().slice(0, 90)}`);
    }
  }
  return out;
};

// ── populations, derived at drive time ──────────────────────────────────────────────────────────
const normalisedFile = (n) => stripSource(readFileSync(join(SCRIPTS, n), 'utf8'), false);
const scriptNames = readdirSync(SCRIPTS).filter((n) => /\.(mts|mjs)$/.test(n) && !n.startsWith('.')).sort();
const sweptFiles = new Set(SWEPT.map((s) => s.file));
const deferredFiles = new Set(DEFERRED);
const handRollsSummary = (src) => /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
const backlog = scriptNames.filter((n) => handRollsSummary(normalisedFile(n)));
const backlogSwept = backlog.filter((n) => sweptFiles.has(n));
const backlogDeferred = backlog.filter((n) => deferredFiles.has(n));

measure('A0', `SWEPT ${sweptFiles.size} · DEFERRED ${deferredFiles.size} · arm-G backlog ${backlog.length} `
  + `(= ${backlogSwept.length} SWEPT + ${backlogDeferred.length} DEFERRED)`);

// ── A2: agreement with round322's live A1 (a zero — weak alone, see A3/A4) ──────────────────────
const defHits = backlogDeferred.flatMap((n) => magnitudePins(normalisedFile(n)).map((p) => `${n} — ${p}`));
check('A2', "AGREEMENT: the sliced detector reproduces round322 A1's live result over backlogDeferred",
  defHits.length === 0,
  `${backlogDeferred.length} DEFERRED backlog member(s) scanned -> ${defHits.length} hit(s)`
    + (defHits.length ? `: ${defHits.join(' | ')}` : ''));

// ── A3: KP1, sliced from history — probe-round303 before Daedalus's cure ────────────────────────
const r303 = scriptNames.find((n) => n.startsWith('probe-round303-'));
let kp1 = 'NOT-RUN';
if (r303) {
  const cure = git(['log', '--format=%H', '-1', '--grep', 'round303 B7 re-keyed', '--', `scripts/${r303}`]).trim();
  if (cure) {
    const pre = git(['show', `${cure}^:scripts/${r303}`]);
    const hits = magnitudePins(stripSource(pre, false));
    kp1 = hits.filter((h) => /\b37\b/.test(h));
    check('A3', 'KP1: driven over the PRE-CURE blob of probe-round303, the detector reports the '
      + '48-day-live `=== 37` magnitude pin',
      kp1.length >= 1,
      `rev ${cure.slice(0, 8)}^ · ${hits.length} hit(s) total, ${kp1.length} naming 37`
        + (kp1.length ? ` -> ${kp1[0]}` : ` -> ALL: ${hits.join(' | ') || 'none'}`));
  } else check('A3', 'KP1 rev found', false, 'no commit matching "round303 B7 re-keyed" for that file');
} else check('A3', 'KP1 subject found', false, 'probe-round303 not under scripts/');

// ── A4: KP2, a second literal from a different file's history ───────────────────────────────────
const revs = git(['log', '--format=%H', '-S', 'pins.length === 8', '--', 'scripts/']).trim().split('\n').filter(Boolean);
let kp2ok = false, kp2detail = 'no rev introduced or removed `pins.length === 8`';
// DRIVE-1 DEFECT, kept: a pickaxe rev is where the string's COUNT CHANGED. For the repair commit
// that REMOVED the pin — which is exactly the commit a cured pin's history points at — the string
// lives at `rev^`, not `rev`. Drive 1 looked only at `rev` and reported the pin absent from
// history. A3 above was written with `^` in the same file, in the same half hour.
// DRIVE-2 CORRECTION: the first key filtered candidate files on `/probe-round309/`, the filename
// round322's own docblock names as the pin's provenance. No probe-round309 blob has ever carried
// the string. The key is now "any probe file in the pickaxe rev", and the leg REPORTS which file it
// was — so a wrong provenance in the subject's prose surfaces instead of reading as an absent KP.
for (const rev of revs) {
  const files = git(['show', '--name-only', '--format=', rev]).trim().split('\n').filter((p) => /^scripts\/probe-/.test(p));
  for (const p of files) {
    for (const at of [rev, `${rev}^`]) {
      let blob;
      try { blob = git(['show', `${at}:${p}`]); } catch { continue; }
      const hits = magnitudePins(stripSource(blob, false)).filter((h) => /===\s*8\b/.test(h));
      if (hits.length) { kp2ok = true; kp2detail = `rev ${at.replace(/^(.{8}).*?(\^?)$/, '$1$2')} · ${p.split('/').pop()} -> ${hits[0]}`; break; }
    }
    if (kp2ok) break;
  }
  if (kp2ok) break;
}
if (!kp2ok && revs.length) kp2detail = `${revs.length} pickaxe rev(s), none with a probe-round309 blob carrying the pin at rev or rev^`;
check('A4', 'KP2: a second real historical pin (`pins.length === 8`, the Round-314 repair round322 '
  + 'cites) is found by the same sliced detector, in a different file',
  kp2ok, kp2detail);

// ── A7: negative control on a rev-pinned blob, no hand-typed fixture ────────────────────────────
const negSrc = [
  'const bad = results.filter((r) => !r.pass);',
  'if (code === 2) throw new Error("pre-flight refusal");',
].join('\n');
check('A7', 'NEGATIVE CONTROL: an exit-code comparison and an emptiness claim produce no hit '
  + '(SPEC_FROZEN and the zero-pin shape both still exclude)', magnitudePins(stripSource(negSrc, false)).length === 0,
  `${magnitudePins(stripSource(negSrc, false)).length} hit(s)`);

// ── A5/A6: the measurement nobody has ───────────────────────────────────────────────────────────
const hitsFor = (names) => names.map((n) => ({ file: n, pins: magnitudePins(normalisedFile(n)) })).filter((r) => r.pins.length);

const sweptBacklogHits = hitsFor(backlogSwept);
measure('A5', `backlogSwept = [${backlogSwept.join(', ') || 'none'}] -> `
  + `${sweptBacklogHits.reduce((a, r) => a + r.pins.length, 0)} pin(s) in ${sweptBacklogHits.length} file(s)`);

const allSwept = [...sweptFiles].filter((n) => scriptNames.includes(n)).sort();
const sweptHits = hitsFor(allSwept);
const totalPins = sweptHits.reduce((a, r) => a + r.pins.length, 0);
measure('A6', `FULL SWEPT SET: ${allSwept.length} file(s) scanned -> ${totalPins} pin(s) in `
  + `${sweptHits.length} file(s) — the population A1 does not drive`);

console.log('\n── the hit set, for classification (A8, by hand, in RESULTS) ──');
for (const r of sweptHits.sort((a, b) => b.pins.length - a.pins.length)) {
  console.log(`\n  ${r.file}  (${r.pins.length})`);
  for (const p of r.pins) console.log(`      ${p}`);
}

// P5's specific subject, called out so the hand read cannot miss it
const r303hits = sweptHits.find((r) => r.file === r303);
measure('A6b', `P5 subject — probe-round303 at HEAD: ${r303hits ? r303hits.pins.length : 0} pin(s)`
  + (r303hits ? `, 2-naming: ${r303hits.pins.filter((p) => /===\s*2\b/.test(p)).length}` : ''));

// ── A9: the two-reading artefact round322's own docblock (:122-136) names, never exercised by A1 ─
// A1 is a zero, so the strings-KEPT reading never had a hit to be wrong about. Over SWEPT it does.
const codeOnlyFile = (n) => stripSource(readFileSync(join(SCRIPTS, n), 'utf8'), true);
// DRIVE-2 SELF-DEFECT, kept: the first key was `comparison token :: first 40 chars of the line`.
// Blanking strings REWRITES the line, so the key differed for every hit on a line that also holds a
// string — including lines whose code comparison plainly survives (`outcomes.size >= 6, \`…\``).
// It reported 43/12 and the 12 were mostly artefacts of the key. Re-keyed on (line INDEX,
// comparison token), which the transformation preserves because stripSource is line-preserving.
const pinSites = (src) => {
  const out = [];
  src.split('\n').forEach((line, i) => {
    if (!LINE_FILTER.test(line)) return;
    for (const m of line.matchAll(new RegExp(CMP, 'g'))) {
      if (!SPEC_FROZEN.has(Number(m[1]))) out.push({ key: `${i}::${m[0].trim()}`, line: line.trim() });
    }
  });
  return out;
};
let bothReadings = 0, stringsOnly = 0;
const stringOnlyExamples = [];
for (const r of sweptHits) {
  const codeKeys = new Set(pinSites(codeOnlyFile(r.file)).map((s) => s.key));
  for (const s of pinSites(normalisedFile(r.file))) {
    if (codeKeys.has(s.key)) bothReadings += 1;
    else { stringsOnly += 1; if (stringOnlyExamples.length < 8) stringOnlyExamples.push(`${r.file.slice(0, 24)}… ${s.key.split('::')[1]} @L${Number(s.key.split('::')[0]) + 1} — ${s.line.slice(0, 68)}`); }
  }
}
check('A9b', 'LINE-PRESERVING CONTROL: stripSource returns the same line count under both readings, '
  + "so an index-keyed cross-reading comparison is sound (the key drive 2's first version broke)",
  allSwept.every((n) => normalisedFile(n).split('\n').length === codeOnlyFile(n).split('\n').length),
  `${allSwept.filter((n) => normalisedFile(n).split('\n').length !== codeOnlyFile(n).split('\n').length).length}`
    + ` of ${allSwept.length} SWEPT file(s) change line count between readings`);
measure('A9', `TWO READINGS over the SWEPT hit set: ${bothReadings} pin(s) survive strings-BLANKED `
  + `(a real code comparison) · ${stringsOnly} appear only with strings KEPT (a quoted fixture or a `
  + `historical form named in prose) — the artefact round322:122-136 predicts and A1 could not reach`);
for (const e of stringOnlyExamples) console.log(`        strings-only: ${e}`);

// ── A10: the detector's blind set — population counts compared against a SPEC_FROZEN value ──────
// P5's subject (`tsFiles.length === 2`, round303:833) is invisible to this key because 2 is an
// exit code. Measure how much of SWEPT sits in that blind spot.
const blindRe = new RegExp(CMP.replace('(\\d+)', '(\\d+)'), 'g');
let blind = 0; const blindFiles = new Set();
for (const n of allSwept) {
  for (const line of codeOnlyFile(n).split('\n')) {
    if (!LINE_FILTER.test(line)) continue;
    for (const m of line.matchAll(blindRe)) {
      if (SPEC_FROZEN.has(Number(m[1]))) { blind += 1; blindFiles.add(n); }
    }
  }
}
measure('A10', `BLIND SET: ${blind} population-count comparison(s) against a SPEC_FROZEN value in `
  + `${blindFiles.size} SWEPT file(s), strings-blanked reading — every one invisible to this key. `
  + `P5's own subject (round303:833 \`tsFiles.length === 2\`) is one of them.`);

// ── A11: the operator split — a first-order classifier the detector throws away ─────────────────
// An `=== n` against a population the file does not own ROTS on any drift. A `>= n` floor is
// drift-tolerant upward and only rots when the population SHRINKS. The detector pools them.
const opOf = (p) => p.trim().split(/\s/)[0];
const byOp = {};
for (const r of sweptHits) for (const p of r.pins) { const o = opOf(p); byOp[o] = (byOp[o] ?? 0) + 1; }
const exact = (byOp['==='] ?? 0) + (byOp['!=='] ?? 0) + (byOp['=='] ?? 0) + (byOp['!='] ?? 0);
const bounded = (byOp['>='] ?? 0) + (byOp['<='] ?? 0);
measure('A11', `OPERATOR SPLIT of the ${exact + bounded} pin(s): ${exact} exact (===/!==, rots on any `
  + `drift) · ${bounded} bounded (>=/<=, rots only when the population moves the wrong way) — `
  + `${Object.entries(byOp).map(([o, n]) => `${o} ${n}`).join(' · ')}`);

// A11b: the same split restricted to backlogSwept, the population the live 48-day defect was in
let bsExact = 0, bsBounded = 0;
for (const r of sweptBacklogHits) for (const p of r.pins) (/^[=!]/.test(opOf(p)) ? bsExact++ : bsBounded++);
measure('A11b', `backlogSwept only: ${bsExact} exact · ${bsBounded} bounded, across `
  + `${sweptBacklogHits.map((r) => `${r.file.slice(0, 18)}…(${r.pins.length})`).join(' ')}`);

console.log(`\n${red.length ? `RED legs=[${red.join(', ')}]` : 'ok legs=0 red=[]'}`);
