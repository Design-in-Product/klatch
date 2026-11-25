/**
 * unit-515 arm — **a known-positive set for Key E, and a keyed decomposition of its 14-row terminal
 * bucket.**
 *
 * `unit-513` post-hoc 3 published `Key E: GATE 3 · CAPTURE 2 · FIXTURE 3 · FILE 0 · OTHER-PROCESS 0
 * · UNRESOLVED 14` and a cross of `0`, stated as the interval `[1, 12]`. Two things make that not a
 * measurement, both named in `unit-513` itself: the key has **no known positive** (so two of its
 * cells report `0` with nothing establishing they are reachable), and **14 of 22 subjects sit in a
 * terminal bucket reached by fall-through**, which absorbs every blindness it has.
 *
 * This arm does not re-implement Key E. It **executes the original bytes**: the body of
 * `subjectOfApplication` is sliced out of `posthoc-application-subject.mjs` with the shared reader
 * (`scripts/lib/decl-body.mjs`), its delimiters stripped, and compiled. There is therefore no copy
 * to drift and no byte-identity to assert — there is one definition, and this file runs it.
 *
 * Pre-registration: `PRE-REGISTRATION.md`, commit `deb46404`, pushed to `main` at 09:20:31 PST
 * before this file existed.
 *
 * No exemption marker: compares no braces, and takes its one declaration slice from the shared
 * reader rather than hand-rolling a brace walk — the remedy this gate names first.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bodyOf } from '../../../scripts/lib/decl-body.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const U513 = join(ROOT, 'docs', 'research', 'unit-513consumernull-2026-11-24');
const KEYE_SRC = join(U513, 'posthoc-application-subject.mjs');
const KEYE_CAP = join(U513, 'captures', 'POSTHOC-APPSUBJECT.json');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const srcOf = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const rev = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const now = execFileSync('date', ['+%H:%M:%S'], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Los_Angeles' } }).trim();

say('unit-515 arm — Key E known positives, and the 14-row terminal bucket keyed');
say(`  rev ${rev} · driven ${now} PST`);
say('');

let failures = 0;
const fail = (s) => { failures += 1; say(`  *** KP FAILED: ${s}`); };

// ───────────────────────────────────────────── §0  the subject under test, executed not copied

say('§0  the key under test — the original bytes, compiled, not a copy');

const keyeSrc = readFileSync(KEYE_SRC, 'utf8');
const body = bodyOf(keyeSrc, 'subjectOfApplication');
if (typeof body !== 'string' || body.length < 500) fail(`sliced body is ${typeof body} / ${body && body.length} B — expected a string over 500 B`);
// Expressed with `startsWith`/`endsWith` rather than a character comparison against a brace: this
// gate's population key is any `=== '{'`-shaped comparison, and its own header records that the key
// OVER-ADMITS on exactly this shape. The first drive of this file reddened the gate for asserting
// that the SHARED reader's output is well-formed — the assertion that I used `bodyOf` correctly is
// what put the file in the population of files suspected of not using it. No marker and no baseline
// entry: the honest cure is to stop making the comparison, not to exempt it.
const delimited = body.startsWith('{') && body.endsWith('}');
if (!delimited) fail('sliced body is not brace-delimited, so stripping two chars would corrupt it');
// A present anchor is not an intact span: require every declared class name to be inside the slice.
const DECLARED = ['UNRESOLVED', 'FIXTURE', 'GATE', 'OTHER-PROCESS', 'CAPTURE', 'FILE'];
const missing = DECLARED.filter((c) => !body.includes(`'${c}'`));
if (missing.length) fail(`sliced body is missing declared class literal(s): ${missing.join(', ')}`);
say(`  slice via scripts/lib/decl-body.mjs bodyOf()   ${body.length} B   brace-delimited: ${delimited}`);
say(`  all 6 declared class literals present in the slice: ${missing.length === 0}`);

// eslint-disable-next-line no-new-func
const subjectOfApplication = new Function('row', 'srcOf', body.slice(1, -1));
const keyE = (row) => subjectOfApplication(row, srcOf);

// Read the live branch order out of the slice, rather than asserting it from memory.
const branchOrder = [...body.matchAll(/cls: '([A-Z-]+)'/g)].map((m) => m[1]);
say(`  branch order read off the slice: ${branchOrder.join(' → ')}`);
say('');

// ───────────────────────────────────────────── §1  known positives, one per declared class

// Two real paths, chosen so the GATE/OTHER-PROCESS discrimination has a live cell on each side.
// The discrimination is `/verify-decl-body-slicers/.test(srcOf(row.rel))`, i.e. it keys on the HOST
// file naming the gate — so a host that does and a host that does not are both needed.
const REL_NAMES_GATE = 'docs/research/unit-513consumernull-2026-11-24/posthoc-application-subject.mjs';
const REL_NO_GATE = 'packages/server/src/db/index.ts'; // long-lived, outside docs/, so "does not name the gate" is not an artefact of one directory
for (const [rel, want] of [[REL_NAMES_GATE, true], [REL_NO_GATE, false]]) {
  const has = /verify-decl-body-slicers/.test(srcOf(rel));
  if (has !== want) fail(`KP host precondition: ${rel} names the gate = ${has}, needed ${want}`);
}

const KP = [
  ['FIXTURE-direct', { rel: REL_NAMES_GATE, subject: "'  tracked files read: 1083'", modeEvidence: '' }, 'FIXTURE'],
  ['FIXTURE-bound', { rel: REL_NAMES_GATE, subject: 'APPENDED', modeEvidence: "const APPENDED = '  tracked files read: 9 (…)';" }, 'FIXTURE'],
  ['GATE', { rel: REL_NAMES_GATE, subject: 'V', modeEvidence: 'const V = r.stdout;' }, 'GATE'],
  ['OTHER-PROCESS', { rel: REL_NO_GATE, subject: 'V', modeEvidence: 'const V = r.stdout;' }, 'OTHER-PROCESS'],
  ['CAPTURE', { rel: REL_NAMES_GATE, subject: 't', modeEvidence: "const t = readFileSync(join(CAPS, 'ARM.out'), 'utf8');" }, 'CAPTURE'],
  ['FILE', { rel: REL_NAMES_GATE, subject: 't', modeEvidence: "const t = readFileSync(join(ROOT, 'README.md'), 'utf8');" }, 'FILE'],
  ['UNRESOLVED-no-subject', { rel: REL_NAMES_GATE, subject: null, modeEvidence: 'const FIG = {' }, 'UNRESOLVED'],
  ['UNRESOLVED-no-origin', { rel: REL_NAMES_GATE, subject: 'z', modeEvidence: 'const z = somethingElse(q);' }, 'UNRESOLVED'],
  // P3 — precedence, read off the live branch order above: the literal test on the SUBJECT precedes
  // every evidence test, so a literal subject with process evidence must stay FIXTURE.
  ['PRECEDENCE literal-beats-process', { rel: REL_NAMES_GATE, subject: "'tracked files read: 7'", modeEvidence: 'const x = spawnSync(node, [p]).stdout;' }, 'FIXTURE'],
  // Refusal: a subject that is an identifier whose evidence names BOTH a literal binding and a read
  // must not be claimed as FIXTURE — the second branch guards on the absence of read/spawn tokens.
  ['REFUSAL literal-binding-but-also-a-read', { rel: REL_NAMES_GATE, subject: 'y', modeEvidence: "const y = readFileSync(p, 'utf8') + '';" }, 'FILE'],
];

say('§1  known positives — one per declared class, plus a precedence cell and a refusal');
let kpPass = 0;
for (const [name, row, want] of KP) {
  let got, why = '';
  try { const r = keyE(row); got = r.cls; why = r.why; } catch (e) { got = `THREW ${e.message}`; }
  const ok = got === want;
  if (ok) kpPass += 1; else fail(`${name}: want ${want}, got ${got}`);
  say(`  ${ok ? 'pass' : 'FAIL'}  ${name.padEnd(36)} → ${String(got).padEnd(14)} (want ${want})`);
  if (ok && why) say(`          why: ${why.slice(0, 96)}`);
}
say('');
say(`  KP cells ${kpPass} of ${KP.length}`);
const classesCovered = [...new Set(KP.filter(([, , w]) => DECLARED.includes(w)).map(([, , w]) => w))];
say(`  declared classes with a known positive: ${classesCovered.length} of ${DECLARED.length}   (${DECLARED.filter((c) => !classesCovered.includes(c)).join(', ') || 'none missing'})`);
say('');

// ───────────────────────────────────────────── §2  the population, read from unit-513's capture

const cap = JSON.parse(readFileSync(KEYE_CAP, 'utf8'));
const rows513 = cap.keyE;
say('§2  the population — unit-513\'s committed capture, read, not re-derived');
say(`  capture rev ${cap.rev} · driven ${cap.drivenAt} PST · rows ${rows513.length}`);
const n513 = (k) => rows513.filter((r) => r.applicationClass === k).length;
say(`  Key E as published: ${DECLARED.map((k) => `${k} ${n513(k)}`).join(' · ')}`);
const unresolved = rows513.filter((r) => r.applicationClass === 'UNRESOLVED');
if (unresolved.length !== 14) fail(`the capture's UNRESOLVED count is ${unresolved.length}, not the 14 this unit was registered against`);
say(`  terminal bucket to be keyed: ${unresolved.length}`);
say('');

// P7 — do the two existing `why` strings partition the mechanisms? Read the strings off the rows.
const whyKinds = [...new Set(unresolved.map((r) => (/no subject expression/.test(r.why) ? 'no-subject-expression' : /does not name a source/.test(r.why) ? 'no-origin-named' : 'OTHER')))];
say(`  the bucket's own reason strings: ${whyKinds.join(' · ')}`);
const byWhy = {};
for (const r of unresolved) {
  const k = /no subject expression/.test(r.why) ? 'no-subject-expression' : /does not name a source/.test(r.why) ? 'no-origin-named' : 'OTHER';
  byWhy[k] = (byWhy[k] || 0) + 1;
}
say(`  bucket split by reason string: ${Object.entries(byWhy).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
say('');

// ───────────────────────────────────────────── §3  a keyed sub-classifier for the 14

/**
 * Ordered, declared mechanism key. Nothing falls through silently: the last arm is `UNKEYED` and it
 * is reported at whatever it is, because a terminal bucket reached by fall-through absorbs every
 * blindness — which is the defect this section exists to repair, so it must not re-commit it.
 */
const lineAt = (rel, n) => (srcOf(rel).split('\n')[n - 1] ?? '');
const precedingNonBlank = (rel, n) => {
  const L = srcOf(rel).split('\n');
  for (let i = n - 2; i >= 0 && i >= n - 6; i -= 1) if (L[i] && L[i].trim()) return L[i];
  return '';
};
const siteOf = (r) => { const m = /^(.*):(\d+)$/.exec(r.site); return { rel: m[1], line: Number(m[2]) }; };

const STRING_METHODS = new Set(['test', 'exec', 'match', 'matchAll', 'replace', 'replaceAll', 'split', 'search']);

const MECHANISM = [
  ['RECEIVER-OFF-LINE', (use, prev) => /^\s*\/.*\/[a-z]*\s*,?\s*$/.test(use) && /\.(replace|match|matchAll|test|exec|search)\(\s*$/.test(prev.trimEnd())],
  ['BOUND-PATTERN', (use) => /^\s*(?:const|let|var)\s+[\w$]+\s*=\s*\//.test(use) || /^\s*(?:'[^']*'|"[^"]*"|[\w$]+)\s*:\s*\//.test(use) || /^\s*\[\s*(?:'[^']*'|"[^"]*")\s*,\s*\//.test(use)],
  ['HELPER-ARG', (use) => { const m = /([\w$]+)\s*\(\s*\//.exec(use); return !!m && !STRING_METHODS.has(m[1]) && !/\.\s*$/.test(use.slice(0, m.index + m[1].length).replace(m[1], '')); }],
  ['CALLBACK-PARAM', (use, prev, r) => { const s = r.subjectName; return !!s && new RegExp(`\\(\\s*\\(?\\s*${s}\\s*\\)?\\s*(?::[^)]*)?\\)?\\s*=>`).test(use); }],
  ['SUBJECT-IS-PARAM', (use, prev, r) => { const s = r.subjectName; if (!s) return false; const src = srcOf(r.rel); const bind = new RegExp(`(?:const|let|var)\\s+${s}\\s*=\\s*([\\w$]+)\\.toString\\(\\)`).exec(src); if (!bind) return false; return new RegExp(`\\(\\s*${bind[1]}\\s*\\)\\s*=>|function[^(]*\\(\\s*${bind[1]}\\b`).test(src); }],
];

say('§3  the terminal bucket, keyed — ordered arms, declared, with the order printed');
say(`  arm order: ${MECHANISM.map(([n]) => n).join(' → ')} → UNKEYED`);
say('');

// The subject identifier, where the capture's `why` names one. Extracted from the why string, not
// retyped: the arm wrote "no origin found for \`l\`" and that backtick-quoted token IS the subject.
const subjectNameOf = (r) => {
  const m = /no origin found for `([^`]+)`/.exec(r.why);
  if (m) return m[1];
  const m2 = /const\s+([\w$]+)\s*=/.exec(r.why);
  return m2 ? m2[1] : null;
};

const keyed = unresolved.map((r) => {
  const { rel, line } = siteOf(r);
  const use = lineAt(rel, line);
  const prev = precedingNonBlank(rel, line);
  const enriched = { ...r, rel, line, use, prev, subjectName: subjectNameOf(r) };
  for (const [name, test] of MECHANISM) {
    let hit = false;
    try { hit = !!test(use, prev, enriched); } catch { hit = false; }
    if (hit) return { ...enriched, mech: name };
  }
  return { ...enriched, mech: 'UNKEYED' };
});

for (const r of keyed) {
  say(`  ${r.mech.padEnd(18)} ${r.site.split('/').slice(-2).join('/')}  consumer ${String(r.consumer).padEnd(11)} reason-string ${/no subject expression/.test(r.why) ? 'no-subject' : 'no-origin'}`);
  say(`        use : ${r.use.trim().slice(0, 104)}`);
  if (r.mech === 'RECEIVER-OFF-LINE' || r.mech === 'UNKEYED') say(`        prev: ${r.prev.trim().slice(0, 104)}`);
}
say('');
const MECH_NAMES = [...MECHANISM.map(([n]) => n), 'UNKEYED'];
const nM = (k) => keyed.filter((r) => r.mech === k).length;
say(`  ${MECH_NAMES.map((k) => `${k} ${nM(k)}`).join(' · ')}`);
say(`  total keyed ${keyed.length}   fall-through ${nM('UNKEYED')}`);
say('');

// P7 — does any one mechanism appear under BOTH reason strings?
say('§3b  do the bucket\'s two reason strings partition the mechanisms?');
let crossCut = [];
for (const k of MECH_NAMES) {
  const rs = new Set(keyed.filter((r) => r.mech === k).map((r) => (/no subject expression/.test(r.why) ? 'no-subject' : 'no-origin')));
  if (nM(k)) say(`  ${k.padEnd(18)} appears under: ${[...rs].join(' + ')}`);
  if (rs.size > 1) crossCut.push(k);
}
say(`  mechanisms appearing under BOTH reason strings: ${crossCut.length ? crossCut.join(', ') : 'none'}`);
say('');

// ───────────────────────────────────────────── §4  the RECEIVER-OFF-LINE cure, KP'd then applied

/**
 * The cure rung: when the arm found no subject on the use line, and the use line is a bare regex
 * literal that is argument 1 of a call whose receiver sits on a preceding line, the subject is that
 * receiver. Re-enters the ORIGINAL Key E with the recovered subject expression, so the class comes
 * from the key under test and not from this rung.
 */
const RECEIVER_RE = /([\w$.[\]'"()]+)\.(?:replace|match|matchAll|test|exec|search)\(\s*$/;
const recoverReceiver = (use, prev) => {
  if (!/^\s*\/.*\/[a-z]*\s*,?\s*$/.test(use)) return null;
  const m = RECEIVER_RE.exec(prev.trimEnd());
  return m ? m[1] : null;
};

say('§4  the RECEIVER-OFF-LINE cure — KP\'d, with a refusal, then applied');
const CURE_KP = [
  ['KP recovers a receiver', '  /^(\\s*tracked files read: )(\\d+)$/m,', 'const APPENDED = out.VERBATIM.text.replace(', 'out.VERBATIM.text'],
  ['KP recovers a dotted receiver', '    /x/,', '  const a = drives.VERBATIM.out.replace(', 'drives.VERBATIM.out'],
  ['REFUSAL use line is not a bare pattern', "  const m = s.match(/tracked files read: (\\d+)/);", 'const s = buf.toString();', null],
  ['REFUSAL preceding line is not a call head', '  /^x$/,', 'const FIG = {', null],
  ['REFUSAL pattern is argument 2', '  /x/,', "s.replace('tracked files read',", null],
];
let cureKpPass = 0;
for (const [name, use, prev, want] of CURE_KP) {
  const got = recoverReceiver(use, prev);
  const ok = got === want;
  if (ok) cureKpPass += 1; else fail(`cure ${name}: want ${want === null ? 'null (refused)' : want}, got ${got}`);
  say(`  ${ok ? 'pass' : 'FAIL'}  ${name.padEnd(40)} → ${got === null ? 'refused' : got}`);
}
say(`  cure KP cells ${cureKpPass} of ${CURE_KP.length}`);
say('');

const cured = keyed.map((r) => {
  const recovered = recoverReceiver(r.use, r.prev);
  if (!recovered) return { ...r, recovered: null, newCls: 'UNRESOLVED' };
  // Re-enter the ORIGINAL key with the recovered subject, and with the receiver's own binding line
  // as evidence where the file has one.
  const src = srcOf(r.rel);
  const rootId = recovered.split(/[.[]/)[0];
  const bindLine = src.split('\n').find((l) => new RegExp(`(?:const|let|var)\\s+${rootId}\\s*=`).test(l)) ?? '';
  const re = keyE({ rel: r.rel, subject: recovered, modeEvidence: bindLine });
  return { ...r, recovered, bindLine: bindLine.trim(), newCls: re.cls, newWhy: re.why };
});

const recoveredRows = cured.filter((r) => r.recovered);
say(`  rows the cure recovers: ${recoveredRows.length}`);
for (const r of recoveredRows) {
  say(`      ${r.site}  subject ← "${r.recovered}"`);
  say(`          binding line: ${r.bindLine ? r.bindLine.slice(0, 100) : '(none found in the file)'}`);
  say(`          Key E on the recovered subject: ${r.newCls}   (${String(r.newWhy).slice(0, 80)})`);
}
say('');
const nAfter = (k) => (k === 'UNRESOLVED'
  ? n513('UNRESOLVED') - recoveredRows.filter((r) => r.newCls !== 'UNRESOLVED').length
  : n513(k) + recoveredRows.filter((r) => r.newCls === k).length);
say(`  Key E after the cure: ${DECLARED.map((k) => `${k} ${nAfter(k)}`).join(' · ')}`);
say('');

// ───────────────────────────────────────────── §5  the silent subset and unit-513's interval

say('§5  the silent subset — read off unit-513\'s capture, and what the cure does to its interval');
const SILENT = ['SKIP', 'DEFAULT'];
const silentAll = rows513.filter((r) => SILENT.includes(r.consumer));
const silentUnres = unresolved.filter((r) => SILENT.includes(r.consumer));
const silentGate = rows513.filter((r) => SILENT.includes(r.consumer) && r.applicationClass === 'GATE');
say(`  SILENT (SKIP+DEFAULT) across all ${rows513.length} applied rows: ${silentAll.length}`);
say(`  …already resolved to GATE (the confirmed reachable-silent members): ${silentGate.length}`);
for (const r of silentGate) say(`        CONFIRMED  ${r.site}  ${r.consumer}`);
say(`  …still UNRESOLVED: ${silentUnres.length}   ← the width of unit-513's published interval`);
say(`  unit-513 published the interval [${silentGate.length}, ${silentGate.length + silentUnres.length}]`);
const silentRecovered = cured.filter((r) => r.recovered && SILENT.includes(r.consumer) && r.newCls !== 'UNRESOLVED');
const silentToGate = silentRecovered.filter((r) => r.newCls === 'GATE');
say(`  silent rows the cure resolves: ${silentRecovered.length}   of which to GATE: ${silentToGate.length}`);
for (const r of silentRecovered) say(`        ${r.site}  ${r.consumer}  UNRESOLVED → ${r.newCls}`);
const loAfter = silentGate.length + silentToGate.length;
const hiAfter = loAfter + (silentUnres.length - silentRecovered.length);
say(`  interval after this unit: [${loAfter}, ${hiAfter}]`);
say('');

// ───────────────────────────────────────────── §6  hygiene

const diff = execFileSync('git', ['-C', ROOT, 'diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], { encoding: 'utf8' });
say('§6  hygiene');
say(`  packages/ and scripts/ diff against HEAD: ${diff.trim() === '' ? 'empty' : `NOT EMPTY\n${diff}`}`);
if (diff.trim() !== '') fail('this unit modified packages/ or scripts/');
say(`  KP failures across this arm: ${failures}`);
say('');

writeFileSync(join(CAPS, 'ARM-KEYEKP.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'ARM-KEYEKP.json'), `${JSON.stringify({
  rev, drivenAt: now, bodyBytes: body.length, branchOrder,
  kp: { pass: kpPass, total: KP.length, cells: KP.map(([n, , w]) => ({ name: n, want: w })) },
  cureKp: { pass: cureKpPass, total: CURE_KP.length },
  published: Object.fromEntries(DECLARED.map((k) => [k, n513(k)])),
  afterCure: Object.fromEntries(DECLARED.map((k) => [k, nAfter(k)])),
  bucketByReasonString: byWhy,
  mechanisms: Object.fromEntries(MECH_NAMES.map((k) => [k, nM(k)])),
  crossCutMechanisms: crossCut,
  keyed: keyed.map((r) => ({ site: r.site, mech: r.mech, consumer: r.consumer, reasonString: /no subject expression/.test(r.why) ? 'no-subject' : 'no-origin', use: r.use.trim() })),
  recovered: recoveredRows.map((r) => ({ site: r.site, subject: r.recovered, newCls: r.newCls })),
  interval: { published: [silentGate.length, silentGate.length + silentUnres.length], after: [loAfter, hiAfter] },
  failures,
}, null, 2)}\n`);

if (failures) { console.error(`\nunit-515 arm: ${failures} KP failure(s) — no class figure above is a measurement.`); process.exit(3); }
