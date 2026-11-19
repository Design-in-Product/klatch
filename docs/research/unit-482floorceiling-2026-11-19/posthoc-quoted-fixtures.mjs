#!/usr/bin/env node
/**
 * unit-482floorceiling POST-HOC leg 3 — the repair of leg 2, which was VACUOUS.
 *
 * Leg 2 (`drive4`) asked "how much of the population is string-literal text?" by re-driving the
 * gate's keys under `stripSource(raw, true)`. It returned **69 of 69**, with
 * `UNGUARDED 0 · MARKED 0 · GUARDED 0`. That is not a measurement: the gate's keys ARE comparisons
 * against a quoted character, so blanking string bodies turns `c === '{'` into `c ===     ` and
 * unsatisfies every key universally. The gate's own docblock (`:126-134`) already names this as its
 * repaired Drive-13 defect AND names the tell I then walked into — *"when a three-way classification
 * returns zero in one class, check whether that class is reachable at all before writing down the
 * other two."* All three classes returned zero. `drive4` is kept, not deleted.
 *
 * The question is real and leg 2 could not ask it. A gate key's operand is a **one-character** string
 * (`'{'`). A quoted KP fixture is a **many-character** string that happens to contain a whole
 * comparison (`"if (s[i] === '{') d++;"`). So the reading this question needs blanks string bodies
 * of length >= 2 and KEEPS length-1 bodies.
 *
 * The string spans are NOT re-scanned here. They are derived from the two readings `strip-source.mjs`
 * already produces — the shared reader answers "which bytes are a string body", and this leg only
 * groups them — per `feedback_check_lib_before_handrolling_a_detector`.
 *
 * DECLARED BLINDNESS, with the reason it is harmless: a string body made entirely of the blank
 * character (`' '`, `'   '`) produces no difference between the two readings and is invisible to this
 * grouping. Such a body cannot contain a brace comparison, so it cannot move any verdict here.
 *
 * brace-slicer-deliberate: carries naive brace-comparison readers on purpose — the subject, not a
 * tool.
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const BASELINE = join(ROOT, 'scripts/decl-body-slicers.baseline');
const gateSrc = readFileSync(GATE, 'utf8');
const capture = (label, re, src) => {
  const m = src.match(re); if (!m) { console.error(`CAPTURE-FAILED — ${label}`); process.exit(3); }
  return m[1];
};
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/, gateSrc);
// eslint-disable-next-line no-eval
const cmpRaw = eval(cmpSrc);
const g = (ch) => new RegExp(cmpRaw(ch).source, 'g');
const chars = {};
for (const n of ['OPEN_BRACE', 'CLOSE_BRACE', 'LPAREN', 'RPAREN', 'COLON']) {
  chars[n] = capture(n, new RegExp(`const ${n} = cmp\\('(.)'\\)`), gateSrc);
}
const K = Object.fromEntries(Object.entries(chars).map(([k, c]) => [k, g(c)]));
const MARKER = new RegExp(capture('MARKER', /const MARKER = \/(.*?)\/;/, gateSrc));
const EXTS = new Set(capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/, gateSrc)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const SELF = new Set(capture('SELF', /const SELF = new Set\(\[([\s\S]*?)\]\)/, gateSrc)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const { stripSource } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

/* ---- the blank character, read off the reader rather than assumed -------------------------- */
const probe = "const x = 'ABCDEFGH';";
const probeKeep = stripSource(probe, false), probeBlank = stripSource(probe, true);
const bi = probe.indexOf('ABCDEFGH');
const BLANK = probeBlank[bi];
console.log(`=== the blank character, read off strip-source.mjs: ${JSON.stringify(BLANK)}`);
if (probeKeep[bi] !== 'A' || BLANK === 'A' || probeBlank.length !== probe.length) {
  console.error('CAPTURE-FAILED — the two readings do not behave as the module documents.'); process.exit(3);
}

/**
 * The length-aware reading: blank every string body of length >= `minLen`, keep shorter ones.
 * Spans come from the two readings' disagreement, extended through blank-in-`b` bytes so that a
 * space inside a string body does not split the span (the self-blanking-char hazard).
 */
const keepShortStrings = (raw, minLen) => {
  const a = stripSource(raw, false), b = stripSource(raw, true);
  const n = raw.length;
  const inBody = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) inBody[i] = 1;            // seeds
  for (let i = 0; i < n; i++) {                                            // extend through blanks
    if (!inBody[i]) continue;
    for (let j = i - 1; j >= 0 && b[j] === BLANK && !inBody[j]; j--) inBody[j] = 1;
    for (let j = i + 1; j < n && b[j] === BLANK && !inBody[j]; j++) inBody[j] = 1;
  }
  const out = a.split('');
  let i = 0;
  const spans = [];
  while (i < n) {
    if (!inBody[i]) { i++; continue; }
    let j = i; while (j < n && inBody[j]) j++;
    spans.push([i, j]);
    if (j - i >= minLen) for (let k = i; k < j; k++) out[k] = BLANK;
    i = j;
  }
  return { code: out.join(''), spans };
};

const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };
const verdictUnder = (code, raw) => {
  const ob = all(K.OPEN_BRACE, code), cb = all(K.CLOSE_BRACE, code);
  if (!ob.length || !cb.length) return { v: 'OUT', ob: ob.length };
  if (MARKER.test(raw)) return { v: 'MARKED', ob: ob.length };
  const lp = all(K.LPAREN, code), rp = all(K.RPAREN, code), co = all(K.COLON, code);
  return { v: (lp.length && rp.length && co.length) ? 'GUARDED' : 'UNGUARDED', ob: ob.length };
};

/* ---- KPs — the reading must be NON-VACUOUS, i.e. land KP-L and KP-M on opposite sides ------- */
console.log('\n=== KNOWN POSITIVES — is the length-aware reading non-vacuous? ===');
const KPL = "let d = 0;\nif (c === '{') d++;\nif (c === '}') d--;\n";
const KPM = 'const fixture = "if (s[i] === \'{\') d++; if (s[i] === \'}\') d--;";\nexport const run = () => fixture.length;\n';
const KPN = KPL + KPM;
const kp = (name, text, want, note) => {
  const { code } = keepShortStrings(text, 2);
  const got = verdictUnder(code, text);
  const pass = (got.v !== 'OUT') === want;
  console.log(`  ${name}  in population: ${String(got.v !== 'OUT').padEnd(5)} (${got.ob} site(s), ${got.v})  want ${want}  ${pass ? 'PASS' : 'FAIL'}   ${note}`);
  return pass;
};
const kpl = kp('KP-L', KPL, true, 'a real two-sided depth counter — 1-char operands KEPT');
const kpm = kp('KP-M', KPM, false, 'the same comparison inside a quoted fixture — BLANKED');
const kpn = kp('KP-N', KPN, true, 'both in one file — the real reader survives the blanking');
if (!(kpl && kpm && kpn)) { console.error('\nKP-FAILED — the reading is vacuous or inverted. Nothing published.'); process.exit(4); }

/* ---- CONTROL — the string-keeping column still reproduces the live gate --------------------- */
const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);
const baselineSet = new Set(readFileSync(BASELINE, 'utf8').split('\n')
  .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean));

const rows = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  const gateV = verdictUnder(stripSource(raw, false), raw);
  const { code } = keepShortStrings(raw, 2);
  const shortV = verdictUnder(code, raw);
  rows.push({ rel, gateV, shortV });
}
const popGate = rows.filter((r) => r.gateV.v !== 'OUT');
const t = (rs, k) => rs.reduce((a, r) => (a[r[k].v] = (a[r[k].v] || 0) + 1, a), {});
const vg = t(popGate, 'gateV');
const readable = tracked.filter((f) => EXTS.has(extname(f))).length;
const exp = { tracked: +process.argv[2], population: +process.argv[3], UNGUARDED: +process.argv[4], MARKED: +process.argv[5], GUARDED: +process.argv[6] };
const got = { tracked: readable, population: popGate.length, UNGUARDED: vg.UNGUARDED || 0, MARKED: vg.MARKED || 0, GUARDED: vg.GUARDED || 0 };
console.log('\n=== CONTROL — the gate column vs the LIVE gate ===');
let ok = true;
for (const k of Object.keys(exp)) {
  const good = got[k] === exp[k]; if (!good) ok = false;
  console.log(`  ${k.padEnd(11)} captured ${String(got[k]).padStart(4)}  live ${String(exp[k]).padStart(4)}  ${good ? 'OK' : 'MISMATCH'}`);
}
if (!ok) { console.error('\nCAPTURE-FAILED — nothing below is published.'); process.exit(3); }

/* ---- the measurement ------------------------------------------------------------------------ */
const popShort = rows.filter((r) => r.shortV.v !== 'OUT');
const vs = t(popShort, 'shortV');
const dropped = popGate.filter((r) => r.shortV.v === 'OUT');
const added = rows.filter((r) => r.gateV.v === 'OUT' && r.shortV.v !== 'OUT');
console.log('\n=== MEASUREMENT — population members that are in it only because of a QUOTED FIXTURE ===');
console.log(`  population, gate reading (all strings kept):     ${popGate.length}`);
console.log(`  population, 1-char strings only:                 ${popShort.length}`);
console.log(`  members present ONLY under the gate's reading:    ${dropped.length}`);
console.log(`  members present ONLY under the narrow reading:    ${added.length}   (must be 0)`);
console.log(`  verdicts  gate:   UNGUARDED ${vg.UNGUARDED || 0} · MARKED ${vg.MARKED || 0} · GUARDED ${vg.GUARDED || 0}`);
console.log(`            narrow: UNGUARDED ${vs.UNGUARDED || 0} · MARKED ${vs.MARKED || 0} · GUARDED ${vs.GUARDED || 0}`);
console.log('\n  in the population ONLY because a multi-character string quotes a comparison:');
for (const r of dropped) {
  console.log(`      ${r.gateV.v.padEnd(9)} ${baselineSet.has(r.rel) ? 'baselined' : '  —      '}  ${r.gateV.ob} site(s)  ${r.rel}`);
}
const db = dropped.filter((r) => baselineSet.has(r.rel));
const dm = dropped.filter((r) => r.gateV.v === 'MARKED');
console.log(`\n  of those, baselined as "a known unguarded slicer added on purpose": ${db.length} of ${baselineSet.size}`);
console.log(`  of those, MARKED (declared naive on purpose):                       ${dm.length} of ${vg.MARKED || 0}`);
console.log(`  scripts/lib/decl-body.mjs survives the narrow reading: ${rows.find((r) => r.rel === 'scripts/lib/decl-body.mjs').shortV.v}  (must NOT be OUT)`);
