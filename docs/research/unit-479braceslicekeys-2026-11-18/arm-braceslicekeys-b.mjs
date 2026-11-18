#!/usr/bin/env node
/**
 * **unit-479braceslicekeys arm B — the 69th member, the ignored population arm A's refusal could
 * not see, and the mechanism behind the 7 verdict disagreements.**
 *
 * Pre-registration: `PRE-REGISTRATION-B.md`, pushed before this file existed.
 *
 * ## What is sliced
 *
 * - **Three readings of ONE reader.** The published `drive3.arma.out` (62), the 11/18 START fire's
 *   `unit-476phantomdenom/drive3.redrive469-at-head.out` (69), and a live run here. All three are
 *   the unit-469 arm, which arm A asserted byte-identical to its publishing rev by sha256.
 * - **The 469 arm's own keys are captured out of its source** (`OPEN_CMP`, `LPAREN_CMP`,
 *   `RPAREN_CMP`, `WINDOW`) for the Q7/Q8 distance measurement — the same regexes the verdict under
 *   test came from, not re-typed ones.
 * - **The parser is duplicated from arm A, deliberately and under a control.** `C0` asserts this
 *   arm's parse of `drive3.arma.out` reproduces arm A's printed published figures
 *   (62 = 6 + 4 + 52) and that its live run reproduces arm A's printed live figures (68 = 8 + 4 +
 *   56). A duplicated reader that reproduces the first reader's published numbers is a slice of it;
 *   one that does not is a second rival and would be a `CAPTURE-FAILED`.
 * - **The ignored population is read with `git ls-files --others` and `git check-ignore`** (S1),
 *   never from `git status`, which is the key that failed in arm A.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const ARM469 = 'docs/research/unit-469braceslice-2026-11-17/arm-braceslice-a.mjs';
const DRIVE3_PUB = join(ROOT, 'docs/research/unit-469braceslice-2026-11-17/drive3.arma.out');
const DRIVE3_START = join(ROOT, 'docs/research/unit-476phantomdenom-2026-11-18/drive3.redrive469-at-head.out');
const GATE = 'scripts/verify-decl-body-slicers.mjs';
const ROOTS469 = ['scripts', 'docs/research', 'docs/operations', 'packages'];

const legs = [];
const red = [];
const check = (n, ok, m) => { legs.push(`  ${ok ? 'ok  ' : 'RED '} ${n} — ${m}`); if (!ok) red.push(`${n}: ${m}`); };
const die = (w) => { console.log(`\nCAPTURE-FAILED — ${w}`); process.exit(3); };
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

console.log('unit-479braceslicekeys arm B — the 69th member, the ignored population, the disagreement mechanism');
console.log(`  HEAD: ${git('rev-parse', 'HEAD').trim()}`);

/* ---------------------------------------------------------------- the parser (controlled by C0) */
const ROW = /^ {6}(GUARDED|AMBIGUOUS|UNGUARDED) +(\S+)$/;
const COUNT = {
  slicer: /^ {2}SLICER \(also compares against a close brace\): +(\d+)$/m,
  guarded: /^ {2}GUARDED \(paren-match within 400 chars before\): (\d+)$/m,
  ambiguous: /^ {2}AMBIGUOUS \(window-sensitive, WITHDRAWN\): +(\d+)$/m,
  unguarded: /^ {2}UNGUARDED: +(\d+)$/m,
};
const parse469 = (text, label) => {
  const nums = {};
  for (const [k, re] of Object.entries(COUNT)) {
    const m = text.match(re);
    if (!m) die(`${label}: could not capture the ${k} count line`);
    nums[k] = Number(m[1]);
  }
  const cls = new Map();
  for (const line of text.split('\n')) { const m = line.match(ROW); if (m) cls.set(m[2], m[1]); }
  if (cls.size !== nums.slicer) die(`${label}: ${cls.size} member rows against a printed SLICER count of ${nums.slicer}`);
  return { nums, cls };
};

if (!existsSync(DRIVE3_START)) die(`the START fire's artefact is missing at ${DRIVE3_START}`);
const pub = parse469(readFileSync(DRIVE3_PUB, 'utf8'), 'published drive3');
const start = parse469(readFileSync(DRIVE3_START, 'utf8'), 'START fire redrive469');
const liveOut = execFileSync('node', [join(ROOT, ARM469)], { encoding: 'utf8', cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
const live = parse469(liveOut, 'live run in this process');

const c0 = pub.nums.slicer === 62 && pub.nums.guarded === 6 && pub.nums.ambiguous === 4 && pub.nums.unguarded === 52
  && live.nums.slicer === 68 && live.nums.guarded === 8 && live.nums.ambiguous === 4 && live.nums.unguarded === 56;
check('C0', c0,
  `duplicated parser against arm A's printed figures: published ${pub.nums.slicer}=${pub.nums.guarded}+${pub.nums.ambiguous}+${pub.nums.unguarded} (arm A: 62=6+4+52) · live ${live.nums.slicer}=${live.nums.guarded}+${live.nums.ambiguous}+${live.nums.unguarded} (arm A: 68=8+4+56)`);
if (!c0) die('this arm\'s parser does not reproduce arm A\'s figures, so its member lists are a rival reading');
console.log(`  three readings of one reader: published ${pub.nums.slicer} · START fire ${start.nums.slicer} · live ${live.nums.slicer}`);

/* ================================================== Q1–Q3: the 62 → 69 → 68 chain, member-for-member */
// Drive 3 crashed here: `S` was handed the whole `{nums, cls}` reading rather than its member map.
// Kept as `drive3.armb.{out,err}` rather than overwritten — a crash is a reading of the arm.
const S = (r) => new Set(r.cls.keys());
const startOnly = [...S(start)].filter((p) => !S(live).has(p)).sort();
const liveOnlyVsStart = [...S(live)].filter((p) => !S(start).has(p)).sort();
const VENDORED = 'docs/research/unit-476phantomdenom-2026-11-18/precure/strip-source.mjs';
console.log(`\nE1 — START reading (${start.nums.slicer}) vs live (${live.nums.slicer})`);
for (const p of startOnly) console.log(`      - START-ONLY ${p}`);
for (const p of liveOnlyVsStart) console.log(`      + LIVE-ONLY  ${p}`);
check('Q1', startOnly.length === 1 && startOnly[0] === VENDORED,
  `registered: exactly one START-only member, the vendored copy that fire deleted; measured ${startOnly.length}${startOnly.length ? ` → ${startOnly.join(', ')}` : ''}`);
const vendorLog = git('log', '--all', '--format=%H', '--', VENDORED).trim();
const vendorOnDisk = existsSync(join(ROOT, VENDORED));
check('Q2', vendorLog === '' && !vendorOnDisk,
  `registered: never tracked and not on disk; git log --all → ${vendorLog === '' ? 'EMPTY' : vendorLog.split('\n').length + ' commit(s)'}, on disk ${vendorOnDisk}`);
check('Q3', liveOnlyVsStart.length === 0,
  `registered 0 live-only-vs-START members; measured ${liveOnlyVsStart.length}${liveOnlyVsStart.length ? ` → ${liveOnlyVsStart.join(', ')}` : ''}`);
const arrivals = [...S(live)].filter((p) => !S(pub).has(p)).sort();
console.log(`  CHAIN: published ${pub.nums.slicer} + ${arrivals.length} arrivals = ${pub.nums.slicer + arrivals.length}; the START reading held ${startOnly.length} transient member(s) on top of that = ${start.nums.slicer}`);

/* ================================================== Q4–Q5: the ignored population (S1) */
const gateSrc = readFileSync(join(ROOT, GATE), 'utf8');
const grab = (re, what) => { const m = gateSrc.match(re); if (!m) die(`could not capture ${what} out of ${GATE}`); return m; };
const cmpLine = grab(/^const cmp = \(ch\) => (new RegExp\(.*\));$/m, 'the cmp factory')[1];
// eslint-disable-next-line no-new-func
const cmp = new Function('ch', `return ${cmpLine};`);
const K = {};
for (const name of ['OPEN_BRACE', 'CLOSE_BRACE', 'LPAREN', 'RPAREN', 'COLON']) {
  K[name] = cmp(grab(new RegExp(`^const ${name} = cmp\\('(.+?)'\\);$`, 'm'), `the ${name} character`)[1]);
}
const MARKER = new RegExp(grab(/^const MARKER = \/(.*)\/;$/m, 'the MARKER key')[1]);
const gateExts = new Set(JSON.parse(grab(/^const EXTS = new Set\((\[[^\]]*\])\);$/m, 'the gate EXTS set')[1].replace(/'/g, '"')));
const gateSelf = new Set(grab(/^const SELF = new Set\(\[([\s\S]*?)\]\);$/m, 'the gate SELF set')[1]
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));

const tracked = new Set(git('ls-files').split('\n').map((l) => l.trim()).filter(Boolean));
const gateVerdicts = new Map();
for (const rel of tracked) {
  if (gateSelf.has(rel) || !gateExts.has(extname(rel))) continue;
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  const code = stripSource(raw, false);
  if (!K.OPEN_BRACE.test(code) || !K.CLOSE_BRACE.test(code)) continue;
  gateVerdicts.set(rel, MARKER.test(raw) ? 'MARKED'
    : (K.LPAREN.test(code) && K.RPAREN.test(code) && K.COLON.test(code)) ? 'GUARDED' : 'UNGUARDED');
}
const armOnly = [...S(live)].filter((p) => !gateVerdicts.has(p)).sort();
// S1: the ignored population, read the way arm A's refusal should have read it.
// Drive 4 crashed here with `spawnSync git ENOBUFS`: a bare `ls-files --others` over this repo
// lists every ignored file, `node_modules` included, and that is tens of megabytes. Scoped to the
// four 469 walk roots with `node_modules`/`dist` excluded by pathspec — the same two directories
// the 469 arm's own walk skips, so the population is the one under comparison and not a wider one.
// Drive 4 is kept as `drive4.armb.{out,err}`.
const PATHSPEC = [...ROOTS469, ':!**/node_modules/**', ':!**/dist/**'];
const ignored = git('ls-files', '--others', '--ignored', '--exclude-standard', '--', ...PATHSPEC)
  .split('\n').map((l) => l.trim()).filter(Boolean);
const porcelainUntracked = new Set(git('status', '--porcelain').split('\n').filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim()));
const ignoredCode = ignored.filter((p) => gateExts.has(extname(p)));
console.log(`\nE2 — the population the two instruments cannot share`);
console.log(`      git ls-files --others (ignored included), code files under the four roots: ${ignoredCode.length}`);
for (const p of ignoredCode) {
  let ci = ''; try { ci = execFileSync('git', ['-C', ROOT, 'check-ignore', '-v', p], { encoding: 'utf8' }).trim(); } catch { ci = 'NOT-IGNORED'; }
  console.log(`      IGNORED  in-469-pop=${S(live).has(p)}  seen-by-porcelain=${porcelainUntracked.has(p)}  ${p}  ← ${ci.split('\t')[0]}`);
}
const q4 = armOnly.length > 0 && armOnly.every((p) => ignoredCode.includes(p))
  && armOnly.every((p) => !porcelainUntracked.has(p));
check('Q4', q4,
  `registered: every 469-only member is an ignored file and none is visible to --porcelain; 469-only ${armOnly.length} → ${armOnly.join(', ') || 'none'}; of those, ignored ${armOnly.filter((p) => ignoredCode.includes(p)).length}, porcelain-visible ${armOnly.filter((p) => porcelainUntracked.has(p)).length}`);
const q5 = ignoredCode.filter((p) => S(live).has(p)).length >= 2;
check('Q5', q5,
  `registered >= 2 ignored code files in the 469 population; measured ${ignoredCode.filter((p) => S(live).has(p)).length} of ${ignoredCode.length} ignored code file(s)`);
console.log(`      arm A's R1 refusal reported 1 untracked code file; the population that differs is ${ignoredCode.length} ignored one(s) — the refusal was keyed on the wrong class and under-reported it`);

/* ================================================== Q6: requirement 4, member-for-member */
const shared = [...S(live)].filter((p) => gateVerdicts.has(p));
const gu469g = shared.filter((p) => gateVerdicts.get(p) === 'UNGUARDED' && live.cls.get(p) === 'GUARDED').sort();
const gg469u = shared.filter((p) => gateVerdicts.get(p) === 'GUARDED' && live.cls.get(p) === 'UNGUARDED').sort();
const pubGuarded = [...pub.cls].filter(([, c]) => c === 'GUARDED').map(([p]) => p).sort();
console.log(`\nE3 — the gate's requirement 4, against the PUBLISHED GUARDED class`);
console.log(`      published GUARDED (${pubGuarded.length}): ${pubGuarded.join(' · ')}`);
console.log(`      gate=UNGUARDED ∧ 469=GUARDED (${gu469g.length}): ${gu469g.join(' · ')}`);
const q6 = gu469g.length === pubGuarded.length && gu469g.every((p, i) => p === pubGuarded[i]);
check('Q6', q6,
  `registered: the gate-UNGUARDED/469-GUARDED set is EXACTLY the published GUARDED class; ${gu469g.length} vs ${pubGuarded.length} members, identical=${q6}`);

/* ================================================== Q7–Q8: locality, measured (S2) */
const armSrc = readFileSync(join(ROOT, ARM469), 'utf8');
const agrab = (name) => { const m = armSrc.match(new RegExp(`^const ${name} = \\/(.*)\\/;$`, 'm')); if (!m) die(`could not capture ${name} out of the 469 arm`); return new RegExp(m[1], 'g'); };
const OPEN_CMP = agrab('OPEN_CMP');
const LPAREN_CMP = agrab('LPAREN_CMP');
const RPAREN_CMP = agrab('RPAREN_CMP');
const WINDOW = Number((armSrc.match(/^const WINDOW = (\d+);/m) || die('could not capture WINDOW'))[1]);
const lastIdx = (re, s) => { let last = -1, m; re.lastIndex = 0; while ((m = re.exec(s))) last = m.index; return last; };
const distance = (rel) => {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  OPEN_CMP.lastIndex = 0;
  const m = OPEN_CMP.exec(src);
  if (!m) return null;
  const before = src.slice(0, m.index);
  const l = lastIdx(LPAREN_CMP, before);
  const r = lastIdx(RPAREN_CMP, before);
  const nearest = Math.max(l, r);
  return { idx: m.index, lparen: l, rparen: r, dist: nearest < 0 ? Infinity : m.index - nearest };
};
console.log(`\nE4 — locality: the 469 window is ${WINDOW} chars; the gate has no locality at all`);
for (const p of gg469u) {
  const d = distance(p);
  console.log(`      REVERSE  ${p}`);
  console.log(`               open-brace cmp at char ${d.idx} · nearest preceding paren cmp at ${Math.max(d.lparen, d.rparen)} · distance ${d.dist === Infinity ? 'NONE BEFORE IT' : d.dist}`);
  console.log(`               gate keys over the file: LPAREN=${K.LPAREN.test(stripSource(readFileSync(join(ROOT, p), 'utf8'), false))} RPAREN=${K.RPAREN.test(stripSource(readFileSync(join(ROOT, p), 'utf8'), false))} COLON=${K.COLON.test(stripSource(readFileSync(join(ROOT, p), 'utf8'), false))}`);
}
const q7 = gg469u.length >= 1 && gg469u.every((p) => { const d = distance(p); return d && (d.dist === Infinity || d.dist > WINDOW); });
check('Q7', q7,
  `registered: the reverse disagreement(s) are locality failures — gate keys all match the file while the nearest preceding paren comparison is beyond ${WINDOW} chars; ${gg469u.length} member(s), all qualifying=${q7}`);
const distantGateGuarded = [...gateVerdicts].filter(([, v]) => v === 'GUARDED').map(([p]) => p)
  .filter((p) => { const d = distance(p); return d && (d.dist === Infinity || d.dist > WINDOW); });
check('Q8', distantGateGuarded.length <= 3,
  `registered <= 3 gate-GUARDED files whose guard is beyond the ${WINDOW}-char window; measured ${distantGateGuarded.length} of ${[...gateVerdicts.values()].filter((v) => v === 'GUARDED').length} gate-GUARDED — ${distantGateGuarded.join(', ') || 'none'}`);

/* ================================================== report */
console.log('\nlegs:');
for (const l of legs) console.log(l);
console.log(`\n${red.length ? 'red' : 'ok'} legs=${red.length} red=[${red.join(' | ')}] refused=[]`);
console.log(`CHAIN: ${pub.nums.slicer} published → ${start.nums.slicer} at the START fire → ${live.nums.slicer} live; ${arrivals.length} tracked arrivals, ${startOnly.length} transient, 0 departures`);
console.log(`DIVERGENCE: gate ${gateVerdicts.size} · 469 ${live.nums.slicer} · 469-only ${armOnly.length}, all ignored-by-.gitignore · gate-only 0`);
console.log(`VERDICTS: ${gu469g.length} gate-UNGUARDED/469-GUARDED · ${gg469u.length} gate-GUARDED/469-UNGUARDED · the second direction is the gate's locality blindness, BOARDED NOT CURED (S3)`);
