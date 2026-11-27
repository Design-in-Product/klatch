/**
 * unit-530compose — post-hoc: why P8b was REFUTED, and what the repaired key measures.
 *
 * `P8b` predicted "one of the four GSUBS widens that very test" and keyed it on the LITERAL
 * `new Set(` appearing in the substitution's anchor. It scored FALSE. The claim was right and the
 * key was wrong: `S4`'s anchor is `b.rhs.includes(NEEDLE)` — the Set shape is reached through a
 * VARIABLE, so a literal-keyed detector cannot see the site that uses the literal.
 *
 * This post-hoc measures the blindness rather than asserting it, and gates the repaired key on
 * planted positives and negatives before reporting any figure from it.
 *
 * Driven AFTER the arm, at the same pin. Nothing here changes the arm's grade: P8b stays REFUTED.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const pad = (s, n) => String(s).padEnd(n, ' ');

const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') throw new Error(`§0: product is dirty:\n${dirty}`);
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();

const SUBJ = 'docs/research/unit-529defaultparam-2026-11-27/arm-defaultparam.mjs';
const subjText = readFileSync(`${ROOT}${SUBJ}`, 'utf8');

const CUT = '// ─── Arm A: the UNRESOLVED partition ─';
const stripped = subjText.slice(0, subjText.indexOf(CUT))
  .split('\n')
  .filter((l) => !/^import\s/.test(l) && !/^const ROOT = new URL\(/.test(l))
  .join('\n');
// eslint-disable-next-line no-new-func
const run = new Function('execSync', 'readFileSync', 'writeFileSync', 'createHash',
  'stripSource', 'parenSpanEnd', 'ROOT',
  `${stripped}\n  return { GSUBS, GENERIC_SRC, SLICED, INST, DSUB };`);
const S = run(execSync, readFileSync, () => {}, createHash, stripSource, parenSpanEnd, ROOT);
const { GSUBS, GENERIC_SRC, SLICED } = S;

const out = [];
const ck = (n, ok, got) => out.push({ n, ok, got });

// ─── Q1: what is NEEDLE, and is it the literal my key looked for? ───────────────────────────────

const needleDecl = /const NEEDLE = ([^;\n]+);/.exec(SLICED);
ck('Q1  NEEDLE is declared in the frozen subject and its value IS the literal P8b keyed on',
  needleDecl !== null && /new Set\(/.test(needleDecl[1]),
  needleDecl ? `const NEEDLE = ${needleDecl[1].trim()}` : 'no NEEDLE declaration found');

// ─── Q2: the three keys, scored on the same population of four substitutions ────────────────────

const KEYS = {
  'LITERAL (the refuted P8b key)': (s) => /new Set\(/.test(s.from),
  'VARIABLE (NEEDLE by name)': (s) => /\bNEEDLE\b/.test(s.from),
  'ESCAPED-REGEX (new\\s+Set\\s*\\()': (s) => /new\\s\+Set\\s\*\\\(/.test(s.from),
};
const score = {};
for (const [name, fn] of Object.entries(KEYS)) {
  score[name] = GSUBS.filter(fn).map((s) => s.id.slice(0, 2));
}
const union = GSUBS.filter((s) => Object.values(KEYS).some((fn) => fn(s))).map((s) => s.id.slice(0, 2));

ck('Q2a the LITERAL key scores 0 of 4 — the blindness P8b was graded on',
  score['LITERAL (the refuted P8b key)'].length === 0,
  `matched: ${score['LITERAL (the refuted P8b key)'].join(',') || 'none'}`);
ck('Q2b the VARIABLE key recovers 3 of 4',
  score['VARIABLE (NEEDLE by name)'].length === 3,
  `matched: ${score['VARIABLE (NEEDLE by name)'].join(',') || 'none'}`);
ck('Q2c the ESCAPED-REGEX key recovers the remaining 1, and the two keys do not overlap',
  score['ESCAPED-REGEX (new\\s+Set\\s*\\()'].length === 1
  && score['VARIABLE (NEEDLE by name)'].every((id) => !score['ESCAPED-REGEX (new\\s+Set\\s*\\()'].includes(id)),
  `matched: ${score['ESCAPED-REGEX (new\\s+Set\\s*\\()'].join(',') || 'none'}`);
ck('Q2d so all 4 substitutions DO target the Set-shape test — P8b\'s claim was right and its key was wrong',
  union.length === 4, `union: ${union.join(',')}`);
ck('Q2e and the single undifferentiated miss hid TWO mechanisms, not one',
  score['VARIABLE (NEEDLE by name)'].length > 0 && score['ESCAPED-REGEX (new\\s+Set\\s*\\()'].length > 0,
  `variable-indirected ${score['VARIABLE (NEEDLE by name)'].length} · regex-escaped ${score['ESCAPED-REGEX (new\\s+Set\\s*\\()'].length}`);

// ─── Q3: which substitution is the SET-BOUND binding test — the series consumer? ────────────────

const sbSub = GSUBS.filter((s) => /b\.rhs/.test(s.from));
ck('Q3  exactly one substitution rewrites the test that reads a BINDING\'s rhs — the consumer of cure D',
  sbSub.length === 1 && /SET-BOUND/.test(sbSub[0].id),
  sbSub.length === 1 ? sbSub[0].id : `${sbSub.length} candidates`);

// ─── Q4: KP/KN for the REPAIRED key, before any figure from it is reported ──────────────────────

const repaired = (from) => /\bNEEDLE\b/.test(from) || /new\\s\+Set\\s\*\\\(/.test(from);
const KP = [];
const m = (n, got, want) => KP.push({ n, ok: got === want, got: `${got}`, want: `${want}` });
m('R1  KP: the real S4 anchor (variable-indirected)', repaired('b.rhs.includes(NEEDLE)'), true);
m('R2  KP: the real S2 anchor (regex-escaped)',
  repaired('const isDirectSetTail = /^new\\s+Set\\s*\\([\\s\\S]*\\)$/.test(t);'), true);
m('R3  KP: the real S3 anchor', repaired('rec.sawParen && t.includes(NEEDLE)'), true);
m('R4  KN: an anchor naming a DIFFERENT variable is not matched', repaired('b.rhs.includes(HAYSTACK)'), false);
m('R5  KN: an anchor on a Map shape is not matched', repaired('b.rhs.includes(MAP_NEEDLE_X)'), false);
m('R6  KN: a bare comment mentioning the words is not matched', repaired('// widen the new Set test'), false);
m('R7  KN: NEEDLE as a substring of a longer identifier is not matched', repaired('x.includes(NEEDLES_ARR)'), false);
m('R8  KP: the plain literal, had any substitution used it, is still caught by neither leg — stated, not hidden',
  repaired('b.rhs.includes("new Set(")'), false);

// ─── report ─────────────────────────────────────────────────────────────────────────────────────

console.log('═══ unit-530compose — post-hoc: the key, not the claim ══════════════════════════');
console.log(`SHA ${SHA} · clock ${CLOCK}`);
console.log(`GENERIC_SRC: ${JSON.stringify(GENERIC_SRC)}`);
console.log('');
console.log('─── the four substitutions, scored by three keys over one population ────────────');
console.log(`  ${pad('key', 34)}${pad('matched', 16)}count`);
for (const [name, ids] of Object.entries(score)) {
  console.log(`  ${pad(name, 34)}${pad(ids.join(',') || '—', 16)}${ids.length} of 4`);
}
console.log(`  ${pad('UNION of all three', 34)}${pad(union.join(','), 16)}${union.length} of 4`);
console.log('');
console.log('─── each substitution and the key that reaches it ───────────────────────────────');
for (const s of GSUBS) {
  const by = Object.entries(KEYS).filter(([, fn]) => fn(s)).map(([n]) => n.split(' ')[0]);
  console.log(`  ${pad(s.id.slice(0, 2), 4)} reached by: ${by.join(' + ') || 'NOTHING'}`);
  console.log(`       anchor: ${JSON.stringify(s.from.slice(0, 96))}`);
}
console.log('');
console.log('─── KP/KN for the REPAIRED key ─────────────────────────────────────────────────');
for (const k of KP) {
  console.log(`  ${k.ok ? 'ok  ' : 'FAIL'} ${pad(k.n, 78)} got ${k.got} want ${k.want}`);
}
console.log(`  KP/KN: ${KP.filter((k) => k.ok).length} of ${KP.length}`);
console.log('');
console.log('─── cells ──────────────────────────────────────────────────────────────────────');
for (const r of out) {
  console.log(`  ${r.ok ? 'HIT    ' : 'REFUTED'} ${pad(r.n, 100)} ${r.got}`);
}
const hit = out.filter((r) => r.ok).length;
console.log('');
console.log(`POST-HOC: ${hit} HIT / ${out.length - hit} REFUTED of ${out.length}`);
console.log(`REPAIRED-KEY KP/KN: ${KP.filter((k) => k.ok).length} of ${KP.length}`);
console.log('');
console.log('P8b stays REFUTED in the arm. The claim it carried is confirmed here under a repaired');
console.log('key, which is a different thing from the prediction having been right.');
