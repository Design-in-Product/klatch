#!/usr/bin/env node
/**
 * unit-465plant — POST-HOC legs 7 and 8. Labelled post-hoc because neither was pre-registered;
 * both were written after reading `screen-run-1.txt`, and LEG 7 exists *because* that run showed a
 * pre-registered prediction of mine (P8) was vacuous.
 *
 * LEG 7 — the real precision number. P8 claimed "exactly one flag across every scripts/ file the KP
 *   commit touched". That commit touched EXACTLY ONE FILE, so P8's population is P3's population and
 *   its agreement with P3 is vacuous: two keys sharing a denominator agree for free. The precision a
 *   "ship it as a pre-commit check" recommendation actually needs is a false-positive rate over a
 *   real population of deltas, which is what this leg measures — over the WHOLE history of scripts/
 *   (a rev range, not a first-N slice).
 *
 * LEG 8 — the screen's key, and what it buys. The screen reads ADDED *declarations*. The hazard
 *   `once()` throws on is `occ(target, anchorValue) !== 1`, which a duplicate *line* breaks just as
 *   well as a duplicate declaration. This leg plants both and shows the screen sees one of them.
 *
 * `screen-added-declaration.mjs` and `screen-run-1.txt` are NOT edited — they stay a matched
 * source/capture pair at the rev that graded the eight pre-registered predictions.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
if (!existsSync(join(REPO, 'scripts', 'sweep-probes.mjs'))) {
  console.log(`REFUSED — repo root not found at ${REPO}`);
  process.exit(2);
}

const occ = (hay, needle) => (needle === '' ? -1 : hay.split(needle).length - 1);
const git = (...args) => execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const blob = (rev, path) => {
  try { return git('show', `${rev}:${path}`); } catch { return null; }
};

const R375 = 'scripts/probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts';
const R377 = 'scripts/probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts';

// ── the same parser and screen as the pre-registered instrument, copied verbatim ─────────────────
// Copied rather than imported so that instrument stays a matched source/capture pair. Any drift
// between the two copies would be a defect; the calibration at the top of LEG 7 is what catches it.
const SIMPLE = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
function parseLiteral(rhs) {
  const q = rhs[0];
  if (q !== "'" && q !== '"' && q !== '`') return { unread: 'rhs is not a string literal' };
  let out = ''; let i = 1;
  while (i < rhs.length) {
    const c = rhs[i];
    if (c === '\\') {
      const e = rhs[i + 1];
      if (e === undefined) return { unread: 'trailing backslash' };
      if (e in SIMPLE) { out += SIMPLE[e]; i += 2; continue; }
      if (e === '\\' || e === "'" || e === '"' || e === '`') { out += e; i += 2; continue; }
      if (e === 'x') { const h = rhs.slice(i + 2, i + 4); if (!/^[0-9a-fA-F]{2}$/.test(h)) return { unread: 'malformed \\x' }; out += String.fromCharCode(parseInt(h, 16)); i += 4; continue; }
      if (e === 'u') { const h = rhs.slice(i + 2, i + 6); if (!/^[0-9a-fA-F]{4}$/.test(h)) return { unread: 'malformed \\u' }; out += String.fromCharCode(parseInt(h, 16)); i += 6; continue; }
      return { unread: `unknown escape \\${e}` };
    }
    if (q === '`' && c === '$' && rhs[i + 1] === '{') return { unread: 'template interpolation' };
    if (c === q) return i === rhs.length - 1 ? { value: out } : { unread: 'rhs continues past the literal' };
    out += c; i++;
  }
  return { unread: 'unterminated literal' };
}
function literalDecls(src) {
  const decls = new Map();
  const lines = src.split('\n');
  for (let n = 0; n < lines.length; n++) {
    const m = /^const ([A-Za-z_$][\w$]*) = (.*);[ \t]*$/.exec(lines[n]);
    if (!m) continue;
    const p = parseLiteral(m[2]);
    if (p.unread) continue;
    decls.set(m[1], { value: p.value, line: n + 1 });
  }
  return decls;
}
function screen(baseSrc, candSrc) {
  if (baseSrc === null || candSrc === null) return { refused: 'path absent at one side' };
  const b = literalDecls(baseSrc), c = literalDecls(candSrc);
  if (b.size === 0 || c.size === 0) return { refused: `0 literal declarations at ${b.size === 0 ? 'base' : 'candidate'}` };
  const added = [];
  for (const [name, cd] of c) {
    const bd = b.get(name);
    if (bd === undefined || bd.value !== cd.value) added.push({ name, ...cd, occ: occ(candSrc, cd.value) });
  }
  return { added, flags: added.filter((a) => a.occ >= 2), baseCount: b.size, candCount: c.size };
}

const RECORD = [];
const rec = (id, claim, value) => { RECORD.push({ id, claim, value }); return value; };

console.log('unit-465plant — POST-HOC legs 7 and 8 (neither pre-registered; LEG 7 exists because P8 was vacuous)');

// ---- calibration: this copy of the screen must reproduce the pre-registered run's KP cell -------
console.log('\n== CALIBRATION — this copied screen against the pre-registered instrument\'s own KP cell ==');
const calib = screen(blob('6b569a40', R375), blob('e501d6af', R375));
const calibOK = !calib.refused && calib.added.length === 1 && calib.flags.length === 1 &&
  calib.flags[0].name === 'C_SWEEP' && calib.flags[0].occ === 2 && calib.baseCount === 8 && calib.candCount === 9;
console.log(`  base ${calib.baseCount} · cand ${calib.candCount} · ADDED ${calib.added?.length} · FLAGGED ${calib.flags?.length} → ${calib.flags?.map((f) => `${f.name}(occ=${f.occ})`).join(', ')}`);
console.log(`  reproduces LEG 1 of screen-run-1.txt: ${calibOK}`);
if (!calibOK) {
  console.log('REFUSED — the copied screen does not reproduce the pre-registered instrument. Legs 7 and 8 report nothing.');
  process.exit(2);
}

// ---- LEG 7 (POST-HOC) — precision over the whole history of scripts/ ---------------------------
console.log('\n== LEG 7 (POST-HOC) — the screen over EVERY commit touching scripts/, whole history ==');
const log = git('log', '--format=%H %P', '--no-merges', '--', 'scripts/').trim().split('\n').filter(Boolean);
console.log(`  population: ${log.length} non-merge commits touching scripts/ (a rev range over all of history, not a first-N slice)`);
let nCommits = 0, nRootSkipped = 0, nFileDeltas = 0, nAdded = 0, nFlags = 0, nRefusedDeltas = 0;
const flagRows = [];
const refusalReasons = new Map();
for (const line of log) {
  const parts = line.split(' ');
  const h = parts[0], parents = parts.slice(1);
  if (parents.length === 0) { nRootSkipped++; continue; }   // counted, not silently dropped
  const p = parents[0];
  nCommits++;
  let touched;
  try {
    touched = git('diff', '--name-only', p, h, '--', 'scripts/').split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    nRefusedDeltas++;
    refusalReasons.set('diff failed', (refusalReasons.get('diff failed') ?? 0) + 1);
    continue;
  }
  for (const f of touched) {
    const r = screen(blob(p, f), blob(h, f));
    nFileDeltas++;
    if (r.refused) {
      nRefusedDeltas++;
      refusalReasons.set(r.refused, (refusalReasons.get(r.refused) ?? 0) + 1);
      continue;
    }
    nAdded += r.added.length;
    nFlags += r.flags.length;
    for (const fl of r.flags) flagRows.push({ h: h.slice(0, 8), f, name: fl.name, occ: fl.occ, line: fl.line, value: fl.value });
  }
}
console.log(`  commits screened: ${nCommits} · root commits skipped (counted): ${nRootSkipped}`);
console.log(`  file-deltas screened: ${nFileDeltas} · of those REFUSED (no verdict): ${nRefusedDeltas}`);
for (const [why, n] of [...refusalReasons].sort((a, b) => b[1] - a[1])) console.log(`      refusal: ${n} × ${why}`);
console.log(`  ADDED literal declarations across the population: ${nAdded}`);
console.log(`  FLAGGED (occ >= 2): ${nFlags}`);
const gradedDeltas = nFileDeltas - nRefusedDeltas;
console.log(`  flag rate: ${nFlags} / ${gradedDeltas} graded file-deltas · ${nFlags} / ${nAdded} added declarations`);
console.log(`\n  every flag, so each can be checked rather than taken on the rate:`);
for (const r of flagRows) {
  console.log(`    ${r.h}  ${r.f.replace(/^scripts\//, '')}`);
  console.log(`        ${r.name} @${r.line} occ=${r.occ}  value: ${JSON.stringify(r.value).slice(0, 110)}`);
}
rec('L7a', 'the precision population is larger than P8\'s (which was 1 file)', gradedDeltas > 1);
rec('L7b', 'the screen does not flag every added declaration (it discriminates on the real corpus)', nFlags < nAdded);
rec('L7c', 'no file-delta in the population was silently dropped — every one is graded or counted as refused',
  nFileDeltas === gradedDeltas + nRefusedDeltas);

// ---- LEG 8 (POST-HOC) — the screen's key, and the hazard it does not see -----------------------
console.log('\n== LEG 8 (POST-HOC) — a duplicate LINE breaks once() too, and the screen is keyed on declarations ==');
const src375 = blob('HEAD', R375);
const src377 = blob('HEAD', R377);
let l8 = null;
if (src375 === null || src377 === null) {
  console.log('  REFUSED — a copier is absent at HEAD');
} else {
  // The guard's own text, read off 377's live source rather than retyped from memory.
  const guard = src377.split('\n').map((l, i) => ({ l, n: i + 1 })).filter((x) => /anchor not unique/.test(x.l));
  console.log(`  the predicate once() throws on, read off ${R377.replace(/^scripts\//, '')}:`);
  for (const g of guard) console.log(`    :${g.n}  ${g.l.trim().slice(0, 120)}`);
  const anchor = literalDecls(src377).get('A_SWEEP_READ');
  if (!anchor || guard.length === 0) {
    console.log('  REFUSED — A_SWEEP_READ is not a pure literal at HEAD, or no guard line found (UNREAD, not 0)');
  } else {
    // Is the anchor actually applied to 375 at HEAD? Printed, not assumed.
    const applied = src377.split('\n').map((l, i) => ({ l, n: i + 1 })).filter((x) => /A_SWEEP_READ/.test(x.l));
    console.log(`  A_SWEEP_READ declared @${anchor.line}; every mention in ${R377.replace(/^scripts\//, '')}:`);
    for (const a of applied) console.log(`    :${a.n}  ${a.l.trim().slice(0, 118)}`);
    const clean = occ(src375, anchor.value);
    console.log(`\n  occ(probe-round375@HEAD, value(A_SWEEP_READ)) on the CLEAN tree: ${clean}  (once() needs exactly 1)`);

    // PLANT A — a bare duplicate LINE. Additive: one appended line, nothing else touched.
    const plantLine = `${src375}${anchor.value}\n`;
    const occLine = occ(plantLine, anchor.value);
    const scrLine = screen(src375, plantLine);
    // PLANT B — the SAME value, wrapped in a declaration. The matched positive.
    const plantDecl = `${src375}const PLANT_B = ${JSON.stringify(anchor.value)};\n`;
    const occDecl = occ(plantDecl, anchor.value);
    const scrDecl = screen(src375, plantDecl);

    console.log(`\n  PLANT A — the anchor's own line appended as a BARE LINE (not a declaration):`);
    console.log(`      occ(375+plantA, anchorValue) = ${occLine}  →  once() would throw: ${occLine !== 1}`);
    console.log(`      the screen: ADDED ${scrLine.added.length} · FLAGGED ${scrLine.flags.length}`);
    console.log(`  PLANT B — the same value, wrapped in a declaration (matched positive):`);
    console.log(`      occ(375+plantB, anchorValue) = ${occDecl}  →  once() would throw: ${occDecl !== 1}`);
    console.log(`      the screen: ADDED ${scrDecl.added.length} · FLAGGED ${scrDecl.flags.length}`);
    l8 = {
      hazardLiveBoth: occLine !== 1 && occDecl !== 1,
      screenSilentOnLine: scrLine.added.length === 0 && scrLine.flags.length === 0,
      screenFiresOnDecl: scrDecl.flags.length === 1,
    };
    console.log(`\n  Both plants make once() throw: ${l8.hazardLiveBoth}`);
    console.log(`  The screen is SILENT on the bare-line plant: ${l8.screenSilentOnLine}`);
    console.log(`  The screen FIRES on the declaration plant:  ${l8.screenFiresOnDecl}`);
  }
}
rec('L8a', 'a bare duplicate LINE breaks once() exactly as a duplicate declaration does', l8?.hazardLiveBoth === true);
rec('L8b', 'the screen is SILENT on the bare-line plant — a declared blindness, measured not assumed', l8?.screenSilentOnLine === true);
rec('L8c', 'the screen FIRES on the matched declaration plant, so L8b is about its key and not about the plant', l8?.screenFiresOnDecl === true);

console.log('\n================ POST-HOC GRADES ================');
let n = 0;
for (const r of RECORD) { console.log(`  ${r.value ? 'TRUE    ' : 'NOT TRUE'} ${r.id} — ${r.claim}`); if (r.value) n++; }
const bad = RECORD.filter((r) => !r.value).map((r) => r.id);
console.log(`\nPOST-HOC GRADED — ${n} of ${RECORD.length} true${bad.length ? `, not true: ${bad.join(', ')}` : ''}`);
console.log(`PRECISION — ${nFlags} flag(s) over ${gradedDeltas} graded file-deltas and ${nAdded} added declarations, whole history of scripts/`);
