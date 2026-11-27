#!/usr/bin/env node
/**
 * unit-528 ARM — curing unit-522's prefix-form blindness, and supplying the evidence for the
 * hand-read of the 28.
 *
 * Registered in PRE-REGISTRATION.md at `8e49bb0f`, clock 10:50:12 PST, before this file existed.
 * P1-P13.
 *
 * NOTHING IS RETYPED. Every published key is SLICED from its frozen source:
 *   - `UNIT_TAIL` from docs/research/unit-522lengthasbytes-2026-11-26/arm-lengthasbytes.mjs
 *   - `regionOf` (whole function text) from unit-522's posthoc-which-133.mjs
 *   - the population filter `extRe` from unit-522's own committed capture
 *   - arm C's `classifyC` constituents (`TIGHT`/`BUFFERISH`/`ARRAYLIKE`/`isComment`/`THIS_UNIT`)
 *     from docs/research/unit-465byteslabel-2026-11-13/arm-byteslabel-c.mjs
 *   - `sitesT` (unit-526's instantiation of the published key) from unit-526's own arm
 * The CURE is the only new text, and it is an ADDED DISJUNCT in this file, never an edit of a
 * frozen file. Any slice failure ABORTS: a slice that cannot reproduce its source grades nothing.
 *
 * THE CONTROL: unit-526's frozen arm is driven UNCHANGED as a child process at this same pin and
 * its own published-key figure is compared to this arm's sliced PUBLISHED reading, cell for cell.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());

const SELF = 'docs/research/unit-528prefixform-2026-11-27/arm-prefixform.mjs';
const C_ARM = 'docs/research/unit-465byteslabel-2026-11-13/arm-byteslabel-c.mjs';
const T_ARM = 'docs/research/unit-522lengthasbytes-2026-11-26/arm-lengthasbytes.mjs';
const T_PH = 'docs/research/unit-522lengthasbytes-2026-11-26/posthoc-which-133.mjs';
const T_OUT = 'docs/research/unit-522lengthasbytes-2026-11-26/captures/ARM.out';
const U526_ARM = 'docs/research/unit-526fiftyeight-2026-11-26/arm-fiftyeight.mjs';
const U526_OUT = 'docs/research/unit-526fiftyeight-2026-11-26/captures/ARM.out';

const P2 = [58, 70];
const P3 = [654, 668];
const P4 = [28, 140];
const P5_FLOOR = 24;
const P12_FLOOR = 2000;
const P13 = [18, 27];

const say = (...a) => console.log(...a);
const V = [];
const grade = (id, claim, got, lo, hi) => {
  const ok = got >= lo && got <= hi;
  V.push({ id, claim, got, lo, hi, verdict: ok ? 'HIT' : 'REFUTED' });
  say(`  ${ok ? 'HIT     ' : 'REFUTED '} ${id}  ${claim}`);
  say(`           registered [${lo}, ${hi}]   measured ${got}`);
};
const gradeBool = (id, claim, got, want) => {
  const ok = got === want;
  V.push({ id, claim, got: String(got), lo: String(want), hi: String(want), verdict: ok ? 'HIT' : 'REFUTED' });
  say(`  ${ok ? 'HIT     ' : 'REFUTED '} ${id}  ${claim}`);
  say(`           registered ${want}   measured ${got}`);
};
const abort = (why) => { say(`\n  ABORT — ${why}`); process.exit(1); };

/* ===================================================== §0 the fire's own no-op assertion */

say('=== §0 subject state, asserted before any measurement ===\n');
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const productDiff = execFileSync('git', ['diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], { encoding: 'utf8' }).trim();
say(`  HEAD: ${head}`);
say(`  git diff --stat HEAD -- packages/ scripts/ : ${productDiff === '' ? 'EMPTY — this unit is a no-op on product' : `NON-EMPTY\n${productDiff}`}`);

const frozenDirty = execFileSync('git', ['status', '--porcelain', '--',
  'docs/research/unit-465byteslabel-2026-11-13',
  'docs/research/unit-522lengthasbytes-2026-11-26',
  'docs/research/unit-526fiftyeight-2026-11-26',
  'scripts/lib'], { encoding: 'utf8' }).trim();
say(`  frozen subjects + scripts/lib dirty? ${frozenDirty === '' ? 'NO — every slice below is of committed text' : `YES\n${frozenDirty}`}`);
if (frozenDirty !== '') abort('a frozen subject unit or the live discriminator has uncommitted edits.');

/* ===================================================== §1 the slices */

say('\n=== §1 SLICES — abort on any failure ===\n');

function between(src, prefix, suffix, label) {
  const a = src.indexOf(prefix);
  if (a === -1) abort(`slice failed: prefix ${JSON.stringify(prefix)} not found for ${label}`);
  if (src.indexOf(prefix, a + 1) !== -1) abort(`slice failed: prefix for ${label} occurs more than once`);
  const b = src.indexOf(suffix, a + prefix.length);
  if (b === -1) abort(`slice failed: suffix ${JSON.stringify(suffix)} not found for ${label}`);
  return src.slice(a + prefix.length, b);
}
function compileLiteral(text, label) {
  const m = /^\/([\s\S]*)\/([a-z]*)$/.exec(text.trim());
  if (!m) abort(`slice failed: ${label} is not a regex literal: ${JSON.stringify(text)}`);
  try { return new RegExp(m[1], m[2]); } catch (e) { abort(`slice failed: ${label} would not compile: ${e.message}`); }
}

const cSrc = readFileSync(C_ARM, 'utf8');
const tSrc = readFileSync(T_ARM, 'utf8');
const phSrc = readFileSync(T_PH, 'utf8');
const tOut = readFileSync(T_OUT, 'utf8');
const u526Src = readFileSync(U526_ARM, 'utf8');

const tightBlock = between(cSrc, 'const TIGHT = [\n', '\n];', 'arm C TIGHT');
const tightTexts = tightBlock.split('\n').map((l) => l.trim().replace(/,$/, '')).filter(Boolean);
if (tightTexts.length !== 3) abort(`arm C TIGHT sliced ${tightTexts.length} literal(s), expected 3`);
const TIGHT = tightTexts.map((t, i) => compileLiteral(t, `TIGHT[${i}]`));
const BUFFERISH = compileLiteral(between(cSrc, 'const BUFFERISH = ', ';\n', 'BUFFERISH'), 'BUFFERISH');
const ARRAYLIKE = compileLiteral(between(cSrc, 'const ARRAYLIKE = ', ';\n', 'ARRAYLIKE'), 'ARRAYLIKE');
const IS_COMMENT = compileLiteral(between(cSrc, 'const isComment = ', '.test(line);', 'isComment'), 'isComment');
const C_THIS_UNIT = between(cSrc, "const THIS_UNIT = '", "';", 'arm C THIS_UNIT');
const UNIT_TAIL = compileLiteral(between(tSrc, 'const UNIT_TAIL = ', ';\n', 'UNIT_TAIL'), 'UNIT_TAIL');

const regionFn = `function regionOf${between(phSrc, 'function regionOf', '\n}\n', 'regionOf')}\n}`;
if (!/stripSource\(src, false\)/.test(regionFn) || !/stripSource\(src, true\)/.test(regionFn)) {
  abort('regionOf sliced without both stripSource passes — the discriminator is not the published one');
}
const regionOf = new Function('stripSource', `${regionFn}; return regionOf;`)(stripSource);

const filterLiteral = tOut.match(/the population filter, four links out: (\/.+?\/)\s*$/m)?.[1] ?? null;
if (!filterLiteral) abort("unit-522's population filter could not be sliced off its own capture");
const extRe = compileLiteral(filterLiteral, 'extRe');

/* unit-526's own instantiation of the published key, sliced whole — so the PUBLISHED half of the
 * differential is literally the function that produced the 58, not a re-expression of it. */
const sitesTFn = `function sitesT${between(u526Src, 'function sitesT', '\n}\n', 'sitesT')}\n}`;
if (!/UNIT_TAIL/.test(sitesTFn) || !/regionOf/.test(sitesTFn)) {
  abort('sitesT sliced without both UNIT_TAIL and regionOf — it is not the published instantiation');
}
const sitesT = new Function('UNIT_TAIL', 'regionOf', `${sitesTFn}; return sitesT;`)(UNIT_TAIL, regionOf);

say(`  u-522  UNIT_TAIL   ${UNIT_TAIL}`);
say(`  u-522  extRe       ${extRe}   (off ${T_OUT}, not retyped)`);
say(`  u-522  regionOf    sliced, ${regionFn.split('\n').length} lines, both stripSource passes present`);
say(`  u-526  sitesT      sliced, ${sitesTFn.split('\n').length} lines, references UNIT_TAIL and regionOf`);
say(`  arm C  BUFFERISH   ${BUFFERISH}`);
say(`  arm C  ARRAYLIKE   ${ARRAYLIKE}`);
say(`  arm C  isComment   ${IS_COMMENT}`);
say(`  arm C  THIS_UNIT   ${C_THIS_UNIT}`);

function classifyC(line) {
  if (!TIGHT.some((re) => re.test(line))) return null;
  if (IS_COMMENT.test(line)) return 'IN-COMMENT';
  if (BUFFERISH.test(line)) return 'BUFFER-correct';
  if (ARRAYLIKE.test(line)) return 'ARRAYLIKE-not-a-byte-claim';
  return 'STRING';
}

/* ===================================================== §2 THE CURE — the only new text */

say('\n=== §2 THE CURE — an ADDED PREFIX DISJUNCT, specified in PRE-REGISTRATION §3 before this file ===\n');

/* Mirror of the published key. Head = line.slice(0, idx), cut at the LAST `}` — the mirror of the
 * published cut at the next `${`, and for the same reason: text before a `}` is inside a PREVIOUS
 * interpolation's expression and cannot be a label for this one. A separator is REQUIRED, so a
 * subject merely NAMED `bytes` is refused (that is unit-522's L3, not this cure). */
const PREFIX_UNIT = /\b(B|bytes|byte)\b(?:\s*[:=]\s*|\s+)(?:\$\{)?[A-Za-z0-9_$.\[\]'"`()?|&!\s+\-]{0,40}$/;

say(`  PREFIX_UNIT  ${PREFIX_UNIT}`);
say('  applied to:  head = line.slice(0, idx); headCut = head.slice(head.lastIndexOf(\'}\') + 1)');

/** Prefix-form sites in one source text, keyed the same way sitesT keys suffix-form ones. */
function sitesP(src) {
  const out = [];
  const lines = src.split('\n');
  let off = 0;
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    let i = line.indexOf('.length');
    while (i !== -1) {
      const head = line.slice(0, i);
      const headCut = head.slice(head.lastIndexOf('}') + 1);
      const m = headCut.match(PREFIX_UNIT);
      if (m) {
        const tokAt = off + head.length - headCut.length + m.index + m[0].indexOf(m[1]);
        out.push({ n: n + 1, line, tok: m[1], region: regionOf(src, tokAt) });
      }
      i = line.indexOf('.length', i + 1);
    }
    off += line.length + 1;
  }
  return out;
}

/* ===================================================== §3 KPs AND KNs BEFORE ANY FIGURE */

say('\n=== §3 KNOWN POSITIVES / NEGATIVES — the cure must select AND must refuse ===\n');

const kps = [];
const kp = (id, origin, src, want, note) => {
  const s = sitesP(src);
  kps.push({ id, origin, got: s.length ? `${s[0].tok}/${s[0].region}` : 'NONE', want, note, n: s.length });
};

/* POSITIVES sliced from the real 28: the exact three shapes unit-526 printed, taken from the
 * live files at the cited lines rather than typed. */
const sliceLine = (p, n) => readFileSync(p, 'utf8').split('\n')[n - 1];
const S1 = 'docs/research/round419-instruments/drive-his-418.mjs';
const S2 = 'docs/research/unit-464cure3-2026-11-01/subject.pre.drive-the-steal.mjs';
const S3 = 'docs/research/unit-516secondargfixture-2026-11-25/arm-secondargfixture.mjs';
kp('KP1', 'SLICED', `const s = '';\n${sliceLine(S1, 45)}\n`, 'bytes/LABEL-IN-STRING', `${S1}:45 — the \`stdout bytes: \${x.length}\` shape, in an interpolation`);
kp('KP2', 'SLICED', `const src = '';\n${sliceLine(S2, 167)}\n`, 'bytes/IDENT-IN-CODE', `${S2}:167 — the \`bytes: src.length,\` object-property shape, NOT in a string`);
kp('KP3', 'SLICED', `const span = '';\n${sliceLine(S3, 94)}\n`, 'bytes/LABEL-IN-STRING', `${S3}:94 — \`bytes: \${span.length}\` after other interpolations on the line`);

/* NEGATIVES — the over-reach this cure could plausibly have. */
kp('KN1', 'PLANTED', 'const bytes = [1,2];\nconst n = bytes.length;\n', 'NONE', 'subject merely NAMED bytes — no separator, must be refused (that is L3, not this cure)');
kp('KN2', 'PLANTED', 'const a = "x", b = "y";\nsay(`${a.length} bytes and then the whole span of it is ${b.length}`);\n', 'NONE', 'a token 30+ chars from an UNRELATED .length in the same segment — the distance/segment guard');
kp('KN3', 'PLANTED', 'const xs = [];\nsay(`rows ${xs.length}`);\n', 'NONE', 'no unit token at all — the cure must refuse it entirely');
kp('KN4', 'PLANTED', 'const chars = 1, bytes = 2, contributing = [];\nsay(`(${((chars / bytes) * 100).toFixed(2)}%), from ${contributing.length} files`);\n', 'NONE', "arm C's own known false positive shape — `bytes` is a division operand in a PREVIOUS interpolation; the `}`-cut must exclude it");

for (const k of kps) {
  k.ok = k.got === k.want;
  say(`  ${k.ok ? 'PASS' : 'FAIL'}  ${k.id.padEnd(4)} (${k.origin.padEnd(7)})  want ${k.want.padEnd(22)} got ${k.got}`);
  say(`        ${k.note}`);
}
const kpPass = kps.filter((k) => k.ok).length;
say(`\n  ${kpPass} of ${kps.length} known positives/negatives pass`);
gradeBool('P7', 'KN gate — every known NEGATIVE refused', kps.filter((k) => k.id.startsWith('KN')).every((k) => k.ok), true);
gradeBool('P10', 'KP gate — every known POSITIVE selected and regioned', kps.filter((k) => k.id.startsWith('KP')).every((k) => k.ok), true);
if (kpPass !== kps.length) abort('a key failed a known positive or negative — no figure is published off an ungraded key.');

/* ===================================================== §4 population */

say('\n=== §4 POPULATION — one pinned population, both readings over it ===\n');

const lsFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean);
const EXCLUDE = new Set([SELF, T_ARM, T_PH, U526_ARM]);
const T_POP = lsFiles.filter((p) => extRe.test(p) && !EXCLUDE.has(p));
say(`  git ls-files: ${lsFiles.length}`);
say(`  T-POP (unit-522's own filter, minus this fire's instruments and the frozen arms): ${T_POP.length}`);
say(`  excluded: ${[...EXCLUDE].join(', ')}`);
grade('P3', 'T-POP today', T_POP.length, ...P3);

/* ===================================================== §5 the differential */

say('\n=== §5 THE DIFFERENTIAL — PUBLISHED (sliced) vs CURED (published ∨ prefix) ===\n');

const key = (s) => `${s.p}:${s.n}`;
const pub = [];
const pre = [];
let lengthOccurrences = 0;
const srcCache = new Map();
for (const p of T_POP) {
  let t;
  try { t = readFileSync(p, 'utf8'); } catch { continue; }
  srcCache.set(p, t);
  let i = t.indexOf('.length');
  while (i !== -1) { lengthOccurrences += 1; i = t.indexOf('.length', i + 1); }
  for (const s of sitesT(t)) if (s.tok === 'bytes' && s.region === 'LABEL-IN-STRING') pub.push({ p, ...s });
  for (const s of sitesP(t)) if (s.tok === 'bytes' && s.region === 'LABEL-IN-STRING') pre.push({ p, ...s });
}
const pubKeys = new Set(pub.map(key));
const preKeys = new Set(pre.map(key));
const both = [...preKeys].filter((k) => pubKeys.has(k));
const addedKeys = [...preKeys].filter((k) => !pubKeys.has(k)).sort();
const added = addedKeys.map((k) => pre.find((s) => key(s) === k));
const curedKeys = new Set([...pubKeys, ...preKeys]);
const lost = [...pubKeys].filter((k) => !curedKeys.has(k));

say(`  PUBLISHED  bytes-token LABEL-IN-STRING over T-POP:  ${pub.length}   (unit-526 published 58 on 2026-11-26's tree)`);
say(`  PREFIX     bytes-token LABEL-IN-STRING over T-POP:  ${pre.length}`);
say(`  BOTH       (a token on each side of the same .length): ${both.length}`);
say(`  CURED      union:                                   ${curedKeys.size}`);
say(`  ADDED      by the cure, not seen by the published key: ${added.length}`);
say(`  LOST       by the cure:                             ${lost.length}`);
say(`  total '.length' occurrences in T-POP:               ${lengthOccurrences}`);

grade('P2', 'PUBLISHED reading over T-POP today', pub.length, ...P2);
grade('P4', 'the cure\'s GROSS REACH — sites added, non-empty required', added.length, ...P4);
gradeBool('P4-nonempty', 'the ADDED set is non-empty (registered apart from the interval)', added.length > 0, true);
gradeBool('P6', 'sites with a token on BOTH sides — non-empty', both.length > 0, true);
gradeBool('P11', 'the cure loses nothing (it adds a disjunct)', lost.length === 0, true);
gradeBool('P12', `vacuity floor — '.length' occurrences in T-POP >= ${P12_FLOOR}`, lengthOccurrences >= P12_FLOOR, true);

/* ===================================================== §6 the 28 */

say("\n=== §6 unit-526's 28 — recovered off its OWN capture, never retyped ===\n");

const u526Out = readFileSync(U526_OUT, 'utf8');
const blockStart = u526Out.indexOf("P11 cause — arm-C-only sites where the unit token PRECEDES");
if (blockStart === -1) abort("unit-526's P11 block could not be located in its own capture");
const declared = Number(u526Out.slice(blockStart).match(/: (\d+)/)?.[1] ?? NaN);
const blockEnd = u526Out.indexOf('\n\n', blockStart);
const blockLines = u526Out.slice(blockStart, blockEnd === -1 ? undefined : blockEnd).split('\n').slice(1);
const the28 = [];
for (const l of blockLines) {
  const m = l.match(/^\s{6}(\S+):(\d+)$/);
  if (m) the28.push({ p: m[1], n: Number(m[2]) });
}
say(`  unit-526 DECLARED the figure as: ${declared}`);
say(`  site lines recovered from its capture: ${the28.length}`);
gradeBool('P5-recovery', 'the 28 recovered off the capture equals the declared figure', the28.length === declared, true);
if (the28.length !== declared) abort('the recovered site list does not match the figure unit-526 declared — the recovery is wrong, not the figure.');

const addedSet = new Set(addedKeys);
const inPop = new Set(T_POP);
const recovered = the28.filter((s) => addedSet.has(`${s.p}:${s.n}`));
const outOfPop = the28.filter((s) => !inPop.has(s.p));
const missed = the28.filter((s) => !addedSet.has(`${s.p}:${s.n}`));
say(`  of the 28, ADDED by the cure:        ${recovered.length}`);
say(`  of the 28, outside T-POP entirely:   ${outOfPop.length}${outOfPop.length ? ` — ${outOfPop.map((s) => s.p).join(', ')}` : ''}`);
say(`  of the 28, NOT added, with reason printed below: ${missed.length}`);
for (const s of missed) {
  const t = srcCache.get(s.p);
  const line = t ? t.split('\n')[s.n - 1] : '(file not in T-POP)';
  const already = pubKeys.has(`${s.p}:${s.n}`);
  say(`      ${s.p}:${s.n}   ${already ? 'ALREADY selected by the published key' : !inPop.has(s.p) ? 'OUTSIDE T-POP' : 'REFUSED by the cure'}`);
  say(`        ${String(line).trim()}`);
}
grade('P5', 'of unit-526\'s 28, how many the cure adds', recovered.length, P5_FLOOR, 28);

gradeBool('P9', "the cure REFUSES scripts/measure-marker-floor.mjs:296 — arm C's own known false positive", !addedSet.has('scripts/measure-marker-floor.mjs:296') && !pubKeys.has('scripts/measure-marker-floor.mjs:296'), true);

/* ===================================================== §7 the hand-read's EVIDENCE */

say("\n=== §7 HAND-READ EVIDENCE for the 28 — the arm supplies, it does NOT judge ===\n");
say('  For each of the 28: the whole line, the subject expression immediately before `.length`, the');
say('  root identifier of that subject, and EVERY declaration/assignment line for that identifier in');
say("  the same file. arm C's BUFFERISH is a LINE-LEVEL test, so a subject declared on another line is");
say('  invisible to it. P8 is a prediction about what those declarations say. The VERDICTS are mine,');
say('  in RESULTS.md, read off this capture — not computed here.\n');

const SUBJ = /([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*|\[[^\]]*\])*)$/;
const evidence = [];
for (const s of the28) {
  const t = srcCache.get(s.p) ?? (() => { try { return readFileSync(s.p, 'utf8'); } catch { return null; } })();
  if (!t) { evidence.push({ ...s, line: '(unreadable)', subj: null, root: null, decls: [], bufferish: null }); continue; }
  const lines = t.split('\n');
  const line = lines[s.n - 1] ?? '';
  const i = line.indexOf('.length');
  const headExpr = i === -1 ? '' : line.slice(0, i);
  const subj = headExpr.match(SUBJ)?.[1] ?? null;
  const root = subj ? subj.split(/[.?\[]/)[0] : null;
  const decls = [];
  if (root) {
    const declRe = new RegExp(`(?:const|let|var)\\s+(?:\\{[^}]*\\b${root}\\b[^}]*\\}|\\[[^\\]]*\\b${root}\\b[^\\]]*\\]|${root})\\b|\\b${root}\\s*=[^=]`);
    lines.forEach((l, k) => { if (k + 1 !== s.n && declRe.test(l)) decls.push({ n: k + 1, text: l.trim() }); });
  }
  evidence.push({ ...s, line, subj, root, decls: decls.slice(0, 4), bufferish: BUFFERISH.test(line), classC: classifyC(line) });
}

let bufDeclElsewhere = 0;
const BUF_DECL = /readFileSync\((?![^)]*utf8)|Buffer\.(?:from|alloc|concat)|\.subarray\(|\bBuffer\b/;
for (const e of evidence) {
  say(`  [${String(the28.indexOf(the28.find((x) => x.p === e.p && x.n === e.n)) + 1).padStart(2)}] ${e.p}:${e.n}`);
  say(`       line:    ${String(e.line).trim()}`);
  say(`       subject: ${e.subj ?? '(unparsed)'}   root: ${e.root ?? '(none)'}   arm C class: ${e.classC}   line-level BUFFERISH: ${e.bufferish}`);
  if (e.decls.length === 0) say('       decls:   (none found in this file — a parameter, an import, or a destructure this key cannot see)');
  for (const d of e.decls) {
    const buf = BUF_DECL.test(d.text);
    if (buf) bufDeclElsewhere += 1;
    say(`       decl@${String(d.n).padStart(4)}${buf ? ' *BUFFER-SHAPED*' : '               '} ${d.text.slice(0, 150)}`);
  }
}
say(`\n  sites with at least one BUFFER-SHAPED declaration line elsewhere in the file: ${evidence.filter((e) => e.decls.some((d) => BUF_DECL.test(d.text))).length}`);
say(`  (declaration lines matching the buffer shape, total: ${bufDeclElsewhere})`);
gradeBool('P8', 'at least one of the 28 has a Buffer-shaped subject declaration on ANOTHER line — invisible to arm C\'s line-level BUFFERISH',
  evidence.filter((e) => e.decls.some((d) => BUF_DECL.test(d.text))).length >= 1, true);
say('  P13 (true mislabels among the 28) is NOT graded here — it is a hand-read, graded in RESULTS.md §4 off this capture.');

/* ===================================================== §8 every added site, for audit */

say('\n=== §8 EVERY site the cure ADDS, whole line — so over-reach is auditable, not asserted ===\n');
added.forEach((s, k) => {
  say(`  [${String(k + 1).padStart(3)}] ${s.p}:${s.n}`);
  say(`        ${String(s.line).trim().slice(0, 220)}`);
});

/* ===================================================== §9 the control */

say('\n=== §9 CONTROL — unit-526\'s frozen arm driven UNCHANGED as a child at this same pin ===\n');

const ctl = spawnSync(process.execPath, [U526_ARM], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
writeFileSync('docs/research/unit-528prefixform-2026-11-27/captures/CONTROL-526.out', ctl.stdout ?? '');
writeFileSync('docs/research/unit-528prefixform-2026-11-27/captures/CONTROL-526.err', ctl.stderr ?? '');
say(`  child exit: ${ctl.status}   stdout ${(ctl.stdout ?? '').length} chars   stderr ${(ctl.stderr ?? '').length} chars`);
const ctlFig = Number((ctl.stdout ?? '').match(/unit-522 bytes-token LABEL-IN-STRING over T-POP:\s*(\d+)/)?.[1] ?? NaN);
const ctlPop = Number((ctl.stdout ?? '').match(/T-POP\s+\(unit-522's own: tracked files passing extRe\):\s*(\d+)/)?.[1] ?? NaN);
say(`  control's own published-key figure: ${Number.isNaN(ctlFig) ? '(NOT PARSED)' : ctlFig}`);
say(`  control's own T-POP:                ${Number.isNaN(ctlPop) ? '(NOT PARSED)' : ctlPop}   (this arm's: ${T_POP.length}; differs by its own EXCLUDE set)`);
if (ctl.status !== 0) say('  NOTE — the control exited non-zero; P1 is REFUTED and the differential is reported UNLICENSED.');
gradeBool('P1', 'CONTROL — the frozen arm\'s published-key figure equals this arm\'s sliced PUBLISHED reading',
  ctl.status === 0 && ctlFig === pub.length, true);

/* ===================================================== §10 grading */

say('\n=== §10 GRADING ===\n');
const hits = V.filter((v) => v.verdict === 'HIT').length;
const refs = V.filter((v) => v.verdict === 'REFUTED').length;
for (const v of V) say(`  ${v.verdict.padEnd(8)} ${v.id.padEnd(12)} ${v.claim}`);
say(`\n  ${hits} HIT / ${refs} REFUTED of ${V.length} graded here (P13 is hand-read in RESULTS.md)`);
say(`  KP/KN: ${kpPass} of ${kps.length}`);
