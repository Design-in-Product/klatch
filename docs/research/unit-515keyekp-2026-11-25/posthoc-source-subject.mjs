/**
 * unit-515 post-hoc — **the subject name from SOURCE instead of from the diagnostic string, and
 * `unit-513`'s published interval re-derived.**
 *
 * The arm left 1 of 14 rows `UNKEYED` because two of its mechanism arms need the subject's
 * identifier and it took that identifier from `unit-513`'s `why` **message**. The message carries a
 * backtick-quoted identifier for some rows and a path for others, so the one row whose message
 * names a path reached both arms with a null name and could not be tested by either. The arm's
 * `SUBJECT-IS-PARAM 0` is therefore not a measurement of that class — it is my key's input failing.
 *
 * Pre-registration: `PRE-REGISTRATION-ADDENDUM-SOURCE-SUBJECT.md`, committed before this file
 * existed. P8–P11.
 *
 * The mechanism key is **not copied**: its declaration text is sliced out of the arm's source and
 * compiled, so there is one definition of the five arms and this file runs it.
 *
 * No exemption marker: no brace comparison, no declaration slicing of its own.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const ARM = join(HERE, 'arm-keyekp.mjs');
const U513CAP = join(ROOT, 'docs', 'research', 'unit-513consumernull-2026-11-24', 'captures', 'POSTHOC-APPSUBJECT.json');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const srcOf = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const rev = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const now = execFileSync('date', ['+%H:%M:%S'], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Los_Angeles' } }).trim();

let failures = 0;
const fail = (s) => { failures += 1; say(`  *** KP FAILED: ${s}`); };

say('unit-515 post-hoc — subject name from source, and unit-513\'s interval re-derived');
say(`  rev ${rev} · driven ${now} PST`);
say('');

// ───────────────────────────────────────── §0  the five mechanism arms, sliced from the arm, not copied

const armSrc = readFileSync(ARM, 'utf8');
const A = armSrc.indexOf('const MECHANISM = [');
const B = armSrc.indexOf('\n];', A);
if (A < 0 || B < 0) fail('could not anchor the MECHANISM declaration in the arm source');
const mechText = armSrc.slice(A + 'const MECHANISM = '.length, B + 3);
const ARM_NAMES = ['RECEIVER-OFF-LINE', 'BOUND-PATTERN', 'HELPER-ARG', 'CALLBACK-PARAM', 'SUBJECT-IS-PARAM'];
const absent = ARM_NAMES.filter((n) => !mechText.includes(`'${n}'`));
if (absent.length) fail(`the sliced MECHANISM text is missing arm(s): ${absent.join(', ')} — a present anchor is not an intact span`);
const STRING_METHODS = new Set(['test', 'exec', 'match', 'matchAll', 'replace', 'replaceAll', 'split', 'search']);
// eslint-disable-next-line no-new-func
const MECHANISM = new Function('STRING_METHODS', 'srcOf', `return ${mechText}`)(STRING_METHODS, srcOf);
say('§0  the mechanism key — sliced out of the arm and compiled, one definition');
say(`  sliced ${mechText.length} B   arms ${MECHANISM.length}   all 5 arm names present: ${absent.length === 0}`);
say(`  arm order: ${MECHANISM.map(([n]) => n).join(' → ')} → UNKEYED`);
say('');

// ───────────────────────────────────────── §1  two subject-name sources, the new one KP'd

/** The arm's source: the identifier as the `why` MESSAGE happened to spell it. */
const nameFromWhy = (r) => {
  const m = /no origin found for `([^`]+)`/.exec(r.why);
  if (m) return m[1];
  const m2 = /const\s+([\w$]+)\s*=/.exec(r.why);
  return m2 ? m2[1] : null;
};

/**
 * The cure: the identifier as the USE LINE spells it. Two shapes, both common in this corpus:
 *   RECEIVER   `X.match(/…/)`, `X.replace(/…/`, `X.split(…)` — the thing the pattern is applied to
 *   ARGUMENT   `/…/.test(X)` — the pattern is the receiver and the subject is the argument
 */
const nameFromSource = (use) => {
  const arg = /\/[^/]*\/[a-z]*\s*\.\s*(?:test|exec)\(\s*([\w$]+)\s*\)/.exec(use);
  if (arg) return arg[1];
  const recv = /([\w$]+)\s*\.\s*(?:match|matchAll|replace|replaceAll|test|exec|search|split)\(\s*\//.exec(use);
  if (recv && !STRING_METHODS.has(recv[1])) return recv[1];
  return null;
};

const NAME_KP = [
  ['KP receiver form', 'const m = s.match(/tracked files read: (\\d+)/);', 's'],
  ['KP argument form', "const readLine = (t.split('\\n').find((l) => /tracked files read/.test(l)) ?? '');", 'l'],
  ['KP replace receiver on the line', 'const x = body.replace(/a/, b);', 'body'],
  ['REFUSAL no subject on the line', 'const TRACKED = /tracked files read: (\\d+)/;', null],
  ['REFUSAL object-literal pattern entry', "  read: /tracked files read: (\\d+)/,", null],
];
say('§1  the source-derived subject-name reader — KP\'d in both directions');
let nameKp = 0;
for (const [name, use, want] of NAME_KP) {
  const got = nameFromSource(use);
  const ok = got === want;
  if (ok) nameKp += 1; else fail(`${name}: want ${want === null ? 'null (refused)' : want}, got ${got}`);
  say(`  ${ok ? 'pass' : 'FAIL'}  ${name.padEnd(34)} → ${got === null ? 'refused' : got}`);
}
say(`  name-reader KP cells ${nameKp} of ${NAME_KP.length}`);
say('');

// ───────────────────────────────────────── §2  re-key the 14 under each name source

const cap = JSON.parse(readFileSync(U513CAP, 'utf8'));
const unresolved = cap.keyE.filter((r) => r.applicationClass === 'UNRESOLVED');
if (unresolved.length !== 14) fail(`the capture's UNRESOLVED count is ${unresolved.length}, not 14`);

const lineAt = (rel, n) => (srcOf(rel).split('\n')[n - 1] ?? '');
const precedingNonBlank = (rel, n) => {
  const L = srcOf(rel).split('\n');
  for (let i = n - 2; i >= 0 && i >= n - 6; i -= 1) if (L[i] && L[i].trim()) return L[i];
  return '';
};
const siteOf = (r) => { const m = /^(.*):(\d+)$/.exec(r.site); return { rel: m[1], line: Number(m[2]) }; };

const keyWith = (nameFn) => unresolved.map((r) => {
  const { rel, line } = siteOf(r);
  const use = lineAt(rel, line);
  const prev = precedingNonBlank(rel, line);
  const subjectName = nameFn === 'why' ? nameFromWhy(r) : nameFromSource(use);
  const e = { ...r, rel, line, use, prev, subjectName };
  for (const [name, test] of MECHANISM) {
    let hit = false;
    try { hit = !!test(use, prev, e); } catch { hit = false; }
    if (hit) return { site: r.site, mech: name, subjectName, consumer: r.consumer };
  }
  return { site: r.site, mech: 'UNKEYED', subjectName, consumer: r.consumer };
});

const byWhy = keyWith('why');
const bySrc = keyWith('src');
const NAMES = [...ARM_NAMES, 'UNKEYED'];
const tally = (rows) => NAMES.map((k) => `${k} ${rows.filter((r) => r.mech === k).length}`).join(' · ');

say('§2  the 14 keyed under each subject-name source');
say(`  names from the WHY string   : ${tally(byWhy)}`);
say(`  names from the USE LINE     : ${tally(bySrc)}`);
say('');
say('  per-site diff — a mechanism change at any site, not a comparison of totals:');
let moved = 0;
for (let i = 0; i < byWhy.length; i += 1) {
  const a = byWhy[i]; const b = bySrc[i];
  const changed = a.mech !== b.mech;
  if (changed) moved += 1;
  if (changed || a.mech === 'UNKEYED' || b.mech === 'UNKEYED') {
    say(`    ${changed ? 'MOVED ' : 'same  '} ${a.site.split('/').slice(-2).join('/')}`);
    say(`            why-name ${String(a.subjectName).padEnd(10)} → ${a.mech}`);
    say(`            src-name ${String(b.subjectName).padEnd(10)} → ${b.mech}`);
  }
}
say('');
say(`  sites whose mechanism MOVED under the name swap: ${moved}`);
say(`  sites unchanged (the P10 control):               ${byWhy.length - moved}`);
const unkeyedBefore = byWhy.filter((r) => r.mech === 'UNKEYED');
const unkeyedAfter = bySrc.filter((r) => r.mech === 'UNKEYED');
say(`  UNKEYED  ${unkeyedBefore.length} → ${unkeyedAfter.length}`);
for (const r of unkeyedAfter) say(`      STILL UNKEYED  ${r.site}  src-name ${r.subjectName}`);
say('');

// ───────────────────────────────────────── §3  P11 — which arithmetic returns unit-513's 12?

say('§3  unit-513\'s published interval [1, 12] — both candidate arithmetics, computed');
const SILENT = ['SKIP', 'DEFAULT'];
const rows = cap.keyE;
const silentAll = rows.filter((r) => SILENT.includes(r.consumer));
const silentGate = rows.filter((r) => SILENT.includes(r.consumer) && r.applicationClass === 'GATE');
const silentUnres = rows.filter((r) => SILENT.includes(r.consumer) && r.applicationClass === 'UNRESOLVED');
const silentOther = silentAll.filter((r) => !['GATE', 'UNRESOLVED'].includes(r.applicationClass));
say(`  SILENT rows                                    ${silentAll.length}`);
say(`    …Key E resolved to GATE (confirmed members)  ${silentGate.length}`);
say(`    …Key E left UNRESOLVED (still available)     ${silentUnres.length}`);
say(`    …Key E resolved to something else            ${silentOther.length}   ${silentOther.map((r) => `${r.site.split('/').pop()}=${r.applicationClass}`).join(', ')}`);
say('');
const candA = [silentGate.length, silentGate.length + silentAll.length];
const candB = [silentGate.length, silentGate.length + silentUnres.length];
say(`  candidate A — confirmed + ALL silent rows:      [${candA.join(', ')}]   ${candA[1] === 12 ? '← reproduces the published 12' : ''}`);
say(`  candidate B — confirmed + silent AND UNRESOLVED:[${candB.join(', ')}]   ${candB[1] === 12 ? '← reproduces the published 12' : ''}`);
say('');
const which = candA[1] === 12 ? 'A' : candB[1] === 12 ? 'B' : 'NEITHER';
say(`  the arithmetic that reproduces unit-513's upper bound of 12: candidate ${which}`);
if (which === 'A') {
  say('  Candidate A double-counts the confirmed member AND counts silent rows Key E already');
  say(`  resolved elsewhere (${silentOther.length}) as if a rename could still reach them.`);
  say(`  **The honest interval is [${candB.join(', ')}], and unit-513's 12 OVERSTATED the hazard.**`);
} else if (which === 'B') {
  say('  The published bound is candidate B and stands; the arm\'s re-derivation was the error.');
} else {
  say('  NEITHER candidate returns 12 — the published bound came from an arithmetic this rung has');
  say('  not reconstructed, and it is withdrawn pending one rather than replaced by a guess.');
}
say('');

// ───────────────────────────────────────── §4  hygiene

const diff = execFileSync('git', ['-C', ROOT, 'diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], { encoding: 'utf8' });
say('§4  hygiene');
say(`  packages/ and scripts/ diff against HEAD: ${diff.trim() === '' ? 'empty' : `NOT EMPTY\n${diff}`}`);
if (diff.trim() !== '') fail('this rung modified packages/ or scripts/');
say(`  KP failures across this rung: ${failures}`);

writeFileSync(join(CAPS, 'POSTHOC-SRCSUBJECT.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'POSTHOC-SRCSUBJECT.json'), `${JSON.stringify({
  rev, drivenAt: now, nameKp: { pass: nameKp, total: NAME_KP.length },
  mechSliceBytes: mechText.length,
  byWhy: Object.fromEntries(NAMES.map((k) => [k, byWhy.filter((r) => r.mech === k).length])),
  bySrc: Object.fromEntries(NAMES.map((k) => [k, bySrc.filter((r) => r.mech === k).length])),
  movedSites: byWhy.filter((r, i) => r.mech !== bySrc[i].mech).map((r, i) => r.site),
  moved, unchanged: byWhy.length - moved,
  interval: { candidateA: candA, candidateB: candB, reproducesPublished12: which },
  silent: { all: silentAll.length, gate: silentGate.length, unresolved: silentUnres.length, other: silentOther.length },
  failures,
}, null, 2)}\n`);

if (failures) { console.error(`\nunit-515 post-hoc: ${failures} KP failure(s) — no figure above is a measurement.`); process.exit(3); }
