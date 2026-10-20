#!/usr/bin/env node
/**
 * Round 424 §3/§4 — the reach of his Round 423 §3 pattern resolver, and his 10-subject denominator.
 *
 * SUBJECT: the resolver block in `docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs`
 * (`RE_LITERAL` … `subjects`), which replaced the definition-line position key my Round 422 §3
 * charged. His memo reports it as applied-and-reasoned, NOT graded, with the fire window as the
 * named blocker, and says his next fire takes the confusion matrix for POSITION (inert label
 * hoisted in one cell, inline in the other). That is his; this file does not touch it.
 *
 * What this file grades instead are two things his memo states as settled:
 *
 *   §3  "resolvable subjects: 9 of 10". The resolver resolves AT MOST ONE pattern per body: it
 *       returns on the first regex literal `RE_LITERAL` finds, and only looks for a hoisted
 *       identifier if there is no inline literal at all. So a body with two literals, or with a
 *       literal and a hoisted ref, is classified on its first pattern alone and the rest is unread.
 *       MEASURED LIVE, not asserted: how many of the ten bodies carry more than one pattern?
 *       KNOWN POSITIVE in the real call shape: a body whose scope anchor is in its SECOND literal.
 *
 *   §4  the denominator. `keyLines` selects bucket keys with `^const has[A-Z]\w* = \(l\) =>` —
 *       column 0, single line, parameter spelled exactly `l`. His "10" inherits that shape key, so
 *       a differently-spelled key would be missing from the census entirely: a third category
 *       alongside "resolvable" and "UNRESOLVED", and one the FLOOR language does not cover.
 *       MEASURED: re-select under a wider key and compare MEMBER LISTS, not counts (Round 340).
 *
 * The resolver is SLICED OUT OF HIS FILE AND EXECUTED, not re-typed (Rounds 408/412: a hand-typed
 * reader is not a slice; Round 412: my copy of his key disagreed with him about his own mover). The
 * slice is taken as a parameterised factory, so each cell gets its own `SRC` (Round 414: take the
 * key as a parameter and grade each conjunct against a crippled copy).
 *
 * CONFUSION MATRIX for §4, because a wider key that finds the same members proves nothing on its
 * own: {his key, my wider key} x {the real file, the real file + one variant-spelled key}. His key
 * must miss the variant and mine must find it, or "the denominator survives" is vacuous.
 *
 * DIRECTION OF ERROR, stated (Round 408). Both mechanisms can only make the census read FEWER scope
 * legs than are there. They therefore cannot overturn "3 inclusion legs is a FLOOR" — they can only
 * raise the floor. What they can overturn is "measured over 9 of 10 subjects", which reads as a
 * coverage claim about those 9.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const B_REL = 'docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs';
const INSTR_REL = 'docs/research/round419-instruments/sec3-rekeyed-on-the-call-shape.mjs';
const OUT_ABS = path.join(import.meta.dirname, 'the-resolver-reads-one-pattern-per-body.out');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const quiet = () => {};
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};
const preds = [];
const predict = (name, expected, actual) => {
  const landed = JSON.stringify(expected) === JSON.stringify(actual);
  preds.push({ name, landed, expected, actual });
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

say('# Round 424 §3/§4 — the resolver reads one pattern per body, and his denominator under a wider key');
say('');
const HEAD = spawnSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
say(`REPO: ${REPO}`);
say(`HEAD at open: ${HEAD}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

const B_TXT = readFileSync(path.join(REPO, B_REL), 'utf8');
const SRC_REAL = readFileSync(path.join(REPO, INSTR_REL), 'utf8');

// --- slice his resolver out of his file, gated ------------------------------
const SLICE_START = 'const RE_LITERAL = ';
const SLICE_END = 'for (const s of subjects) {';
gate('slice start anchor occurs exactly once in his file', B_TXT.split(SLICE_START).length - 1 === 1,
  `occurs=${B_TXT.split(SLICE_START).length - 1}`);
gate('slice end anchor occurs exactly once in his file', B_TXT.split(SLICE_END).length - 1 === 1,
  `occurs=${B_TXT.split(SLICE_END).length - 1}`);
gate('the graded instrument his resolver reads is present', SRC_REAL.length > 0, INSTR_REL);
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED at a precondition'); process.exit(2); }

const slice = B_TXT.slice(B_TXT.indexOf(SLICE_START), B_TXT.indexOf(SLICE_END));
say(`  sliced ${slice.length} bytes of his resolver, executed as written (not re-typed)`);
const factorySrc = `export const build = (SRC, say) => {\n${slice}\n`
  + `return { RE_LITERAL, declOf, resolvePattern, SCOPE_IN_PATTERN, keyLines, subjects };\n};\n`;
const mod = await import('data:text/javascript;base64,' + Buffer.from(factorySrc).toString('base64'));
const his = (src) => mod.build(src, quiet);

const real = his(SRC_REAL);
gate('the slice executes and reproduces his published subject count of 10', real.subjects.length === 10,
  `${real.subjects.length} subjects`);
gate('…and reproduces his published UNRESOLVED member list',
  JSON.stringify(real.subjects.filter((s) => s.hasScope === null).map((s) => s.name)) === JSON.stringify(['hasEventName']),
  real.subjects.filter((s) => s.hasScope === null).map((s) => s.name).join(', ') || '(none)');

// --- §3: how many patterns per body does the resolver read? -----------------
say('');
say('## 1. §3 — the resolver returns on the FIRST pattern it finds');
say('');
// Derived from HIS pattern, not re-typed: the same source with the global flag.
const GLOBAL_LIT = new RegExp(real.RE_LITERAL.source, 'g');
say(`  his RE_LITERAL.source: ${real.RE_LITERAL.source}`);
say(`  his SCOPE_IN_PATTERN.source: ${real.SCOPE_IN_PATTERN.source}`);
say('');
const bodyOf = (sub, src) => {
  const line = src.split('\n')[sub.n - 1];
  return line.replace(/^const \w+ = \(l\) =>\s*/, '');
};
const perBody = real.subjects.map((s) => {
  const body = bodyOf(s, SRC_REAL);
  const lits = body.match(GLOBAL_LIT) || [];
  const capsRef = (body.match(/\b([A-Z][A-Z0-9_]*)\s*\.test\(/) || [, null])[1];
  return {
    name: s.name, n: s.n, literals: lits.length, capsRef,
    how: s.pat.how,
    scopeInResolved: s.pat.src === null ? null : real.SCOPE_IN_PATTERN.test(s.pat.src),
    scopeInAnyLiteral: lits.some((L) => real.SCOPE_IN_PATTERN.test(L)),
  };
});
for (const b of perBody) {
  say(`    line ${String(b.n).padStart(3)}  ${b.name.padEnd(20)} literals=${b.literals}  `
    + `capsRef=${(b.capsRef || '-').padEnd(13)}  ${b.how.padEnd(36)} `
    + `scope: resolved=${b.scopeInResolved} anyLiteral=${b.scopeInAnyLiteral}`);
}
const multiLit = perBody.filter((b) => b.literals > 1).map((b) => b.name);
const litAndRef = perBody.filter((b) => b.literals >= 1 && b.capsRef).map((b) => b.name);
say('');
say(`  bodies carrying more than one regex literal: ${multiLit.length} ${multiLit.length ? '(' + multiLit.join(', ') + ')' : ''}`);
say(`  bodies carrying a literal AND a hoisted ref:  ${litAndRef.length} ${litAndRef.length ? '(' + litAndRef.join(', ') + ')' : ''}`);
predict('the one-pattern-per-body limit is LATENT in this file, not live: zero bodies carry two patterns',
  [0, 0], [multiLit.length, litAndRef.length]);
gate('so no published figure of his moves on this account — the charge is latent and is reported as latent',
  multiLit.length === 0 && litAndRef.length === 0, `${multiLit.length} multi-literal, ${litAndRef.length} literal+ref`);

// KNOWN POSITIVE, carrying the property in the real call shape — not an analogy (Rounds 355/364).
// A body whose scope anchor is in its SECOND literal, written exactly as his other keys are.
say('');
say('  KNOWN POSITIVE — a key in his own call shape whose scope anchor is its SECOND literal:');
const KP_LINE = 'const hasKpSecondLiteral = (l) => /\\bzebra\\b/.test(l) || /^\\s*\\*\\s+\\*\\*zebra:\\*\\*/.test(l);';
const CONTROL_LINE = 'const hasKpFirstLiteral = (l) => /^\\s*\\*\\s+\\*\\*zebra:\\*\\*/.test(l) || /\\bzebra\\b/.test(l);';
say(`    KP:      ${KP_LINE}`);
say(`    CONTROL: ${CONTROL_LINE}`);
const injectAfter = (src, line) => {
  const anchor = 'const hasStreamScope = (l) =>';
  const occurs = src.split(anchor).length - 1;
  gate(`the KP injection anchor occurs exactly once: ${anchor}`, occurs === 1, `occurs=${occurs}`);
  if (occurs !== 1) return null;
  const lines = src.split('\n');
  const i = lines.findIndex((l) => l.startsWith(anchor));
  lines.splice(i + 1, 0, line);
  return lines.join('\n');
};
const kpSrc = injectAfter(SRC_REAL, KP_LINE);
const ctlSrc = injectAfter(SRC_REAL, CONTROL_LINE);
const kpRes = kpSrc && his(kpSrc).subjects.find((s) => s.name === 'hasKpSecondLiteral');
const ctlRes = ctlSrc && his(ctlSrc).subjects.find((s) => s.name === 'hasKpFirstLiteral');
say(`    KP      → resolved ${JSON.stringify(kpRes && kpRes.pat.src)}  hasScope=${kpRes && kpRes.hasScope}`);
say(`    CONTROL → resolved ${JSON.stringify(ctlRes && ctlRes.pat.src)}  hasScope=${ctlRes && ctlRes.hasScope}`);
predict('KP: a scope anchor in the SECOND literal is read as NOT a scope-label leg', false, kpRes && kpRes.hasScope);
predict('CONTROL: the SAME two literals in the other order ARE read as a scope-label leg', true, ctlRes && ctlRes.hasScope);
gate('THE DISCRIMINATOR (§3): two keys with the identical pair of patterns classify differently by '
  + 'the ORDER of the literals — so the limit is real, and only the file`s current contents keep it latent',
  !!kpRes && !!ctlRes && kpRes.hasScope === false && ctlRes.hasScope === true,
  kpRes && ctlRes ? `KP ${kpRes.hasScope} vs CONTROL ${ctlRes.hasScope}` : 'a cell did not resolve');
gate('CONTROL on the injection itself: both injected keys were actually censused as subjects',
  !!kpRes && !!ctlRes, `${kpRes ? 'KP found' : 'KP MISSING'} · ${ctlRes ? 'CONTROL found' : 'CONTROL MISSING'}`);

// --- §4: the denominator under a wider key ----------------------------------
say('');
say('## 2. §4 — his 10-subject denominator under a wider selector');
say('');
// Wider on three axes his key fixes: the declaration keyword, leading indentation, and the
// parameter name. Compared by MEMBER LIST, not by count (Round 340).
const WIDE = /^\s*(?:const|let|var|function)\s+((?:has|is)[A-Z]\w*)\s*(?:=\s*)?(?:\(?\s*\w+\s*\)?\s*=>|\()/;
const wideMembers = (src) => src.split('\n').map((l) => (l.match(WIDE) || [, null])[1]).filter(Boolean);
const hisMembers = (src) => his(src).subjects.map((s) => s.name);
const hisReal = hisMembers(SRC_REAL), wideReal = wideMembers(SRC_REAL);
say(`  his key:   ${hisReal.length} members — ${hisReal.join(', ')}`);
say(`  wide key:  ${wideReal.length} members — ${wideReal.join(', ')}`);
const onlyWide = wideReal.filter((m) => !hisReal.includes(m));
const onlyHis = hisReal.filter((m) => !wideReal.includes(m));
predict('on the real file the two member LISTS agree exactly — his denominator of 10 survives a wider key',
  [[], []], [onlyWide, onlyHis]);

// The confusion matrix: a wider key that finds the same members proves nothing unless it would
// have found a variant. One variant-spelled key, injected into a copy.
const VARIANT_LINE = '  const hasVariantSpelling = (line) => /^\\s*\\*\\s+\\*\\*zebra:\\*\\*/.test(line);';
say('');
say(`  variant-spelled key injected into a COPY (indented, parameter named \`line\`):`);
say(`    ${VARIANT_LINE.trim()}`);
const varSrc = injectAfter(SRC_REAL, VARIANT_LINE);
const hisVar = varSrc && hisMembers(varSrc), wideVar = varSrc && wideMembers(varSrc);
say(`    his key  → ${hisVar && hisVar.length} members, hasVariantSpelling present: ${hisVar && hisVar.includes('hasVariantSpelling')}`);
say(`    wide key → ${wideVar && wideVar.length} members, hasVariantSpelling present: ${wideVar && wideVar.includes('hasVariantSpelling')}`);
predict('his key does NOT see the variant-spelled key', false, !!hisVar && hisVar.includes('hasVariantSpelling'));
predict('the wide key DOES see it — so the agreement above is a measurement, not a vacuity',
  true, !!wideVar && wideVar.includes('hasVariantSpelling'));
gate('THE DISCRIMINATOR (§4): the two keys agree on the real file and DISAGREE on a copy with one '
  + 'variant-spelled key — so "the denominator is 10" is confirmed by a key that could have refuted it',
  !!hisVar && !!wideVar && !hisVar.includes('hasVariantSpelling') && wideVar.includes('hasVariantSpelling')
    && onlyWide.length === 0 && onlyHis.length === 0,
  `real: wide-only ${onlyWide.length}, his-only ${onlyHis.length} | variant: his ${hisVar && hisVar.includes('hasVariantSpelling')}, wide ${wideVar && wideVar.includes('hasVariantSpelling')}`);

// --- hygiene ----------------------------------------------------------------
say('');
const dirty = spawnSync('git', ['-C', REPO, 'diff', 'HEAD', '--stat', '--', B_REL, INSTR_REL],
  { encoding: 'utf8' }).stdout.trim();
gate('neither of his files was modified, staged or unstaged (every cell was an in-memory copy)',
  dirty === '', dirty || '(unmodified vs HEAD)');

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
say(`  §3 one-pattern-per-body: REAL (KP ${kpRes && kpRes.hasScope} vs CONTROL ${ctlRes && ctlRes.hasScope}) `
  + `but LATENT here — ${multiLit.length} multi-literal and ${litAndRef.length} literal+ref bodies of ${perBody.length}`);
say(`  §3 direction of error: can only UNDER-read scope legs, so the FLOOR of 3 stands; what it `
  + `qualifies is "measured over 9 of 10 subjects"`);
say(`  §4 his denominator of 10: CONFIRMED under a wider key that is shown able to refute it`);
writeFileSync(OUT_ABS, out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
