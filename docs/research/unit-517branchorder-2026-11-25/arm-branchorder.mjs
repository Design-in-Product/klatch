/**
 * unit-517 — the ternary-blind branch-order extractor.
 *
 * Subject: `unit-515keyekp-2026-11-25/arm-keyekp.mjs:78`
 *   `const branchOrder = [...body.matchAll(/cls: '([A-Z-]+)'/g)].map((m) => m[1]);`
 * published this morning as the provenance of a precedence claim (`unit-515` P3) and found, in the
 * same fire, to read 4 branches of 6 — missing exactly the two whose class is a ternary operand.
 *
 * Pre-registration: `PRE-REGISTRATION.md`, commit `109f4948`, pushed to `main` 13:20:30 PST, before
 * this file existed. P1–P8.
 *
 * ## Readers used, and why they are not hand-rolled
 *
 * - `scripts/lib/decl-body.mjs` `bodyOf()` — the slice of `subjectOfApplication`.
 * - `scripts/lib/strip-source.mjs` `stripSource()` — which bytes are code. BOTH readings, from one
 *   scanner: strings blanked (to find `cls:` sites that are really code) and strings kept (to read
 *   the literal at those sites). Length-preserving, so the offsets of one index the other.
 *
 * **`blankStrings` is POSITIONAL and tested for truthiness.** `strip-source.d.mts` spends a
 * paragraph on this: `stripSource(s, { blankStrings: false })` passes a TRUTHY OBJECT and therefore
 * blanks strings — the opposite of what the spelling says. §0 asserts the trap rather than trusting
 * that I read the note correctly.
 *
 * **No comparison against a brace, paren or colon character anywhere in this file**, per
 * `unit-515` §5(iv): the assertion that you used the shared reader correctly is what admits your
 * file to the population of files suspected of not using it. Every character test here is
 * `.startsWith(ch, i)` or `'…'.includes(ch)`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bodyOf } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };
let failures = 0;
const fail = (m) => { failures += 1; say(`  FAIL  ${m}`); };

const rev = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
const now = execFileSync('date', ['+%Y-%m-%d %H:%M:%S'], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Los_Angeles' } }).trim();

say('unit-517 — the ternary-blind branch-order extractor');
say(`  rev ${rev} · driven ${now} PST`);
say('');

// ───────────────────────────────────────────── §0  preconditions, asserted not assumed

say('§0  preconditions');

// The positional-boolean trap, asserted on a fixture that contains a string with a colon-literal.
{
  const probe = "const a = 'cls: NOPE'; // c\n";
  const blanked = stripSource(probe, true);
  const kept = stripSource(probe, false);
  const objectSpelling = stripSource(probe, { blankStrings: false });
  const t1 = !blanked.includes('NOPE');
  const t2 = kept.includes('NOPE');
  const t3 = objectSpelling === blanked;
  if (!t1) fail('stripSource(s, true) did not blank the string body');
  if (!t2) fail('stripSource(s, false) did not keep the string body');
  if (!t3) fail('the object spelling is NOT the blanked reading — the d.mts trap has moved');
  say(`  stripSource positional trap asserted: blanked-hides-string ${t1} · kept-shows-string ${t2} · object-spelling-is-blanked ${t3}`);
  if (blanked.length !== probe.length || kept.length !== probe.length) fail('stripSource is not length-preserving');
  say(`  length-preserving in both readings: ${blanked.length === probe.length && kept.length === probe.length}`);
}

const KEYE_SRC_REL = 'docs/research/unit-513consumernull-2026-11-24/posthoc-application-subject.mjs';
const keyeSrc = readFileSync(join(ROOT, KEYE_SRC_REL), 'utf8');
const body = bodyOf(keyeSrc, 'subjectOfApplication');
// Intactness WITHOUT a character comparison against a brace — unit-515 §5(iv)'s cure, reused.
const delimited = body.startsWith('{') && body.endsWith('}');
if (!delimited) fail('the slice is not brace-delimited');
say(`  slice via scripts/lib/decl-body.mjs bodyOf()   ${body.length} B   brace-delimited: ${delimited}`);

const DECLARED = ['FIXTURE', 'GATE', 'OTHER-PROCESS', 'CAPTURE', 'FILE', 'UNRESOLVED'];

// P5's precondition: source order IS evaluation order only if nothing reorders or repeats.
const REORDERERS = ['for ', 'for(', 'while', 'switch', '.sort(', '.reverse(', 'do {'];
const bodyCode = stripSource(body, true);
const reorderHits = REORDERERS.filter((t) => bodyCode.includes(t));
if (reorderHits.length > 0) fail(`the slice contains a reordering construct: ${reorderHits.join(', ')} — a precedence claim read off source position is NOT sound here`);
say(`  no reordering construct in the slice (${REORDERERS.length} tokens checked): ${reorderHits.length === 0}`);
say('');

// ───────────────────────────────────────────── the cured extractor

const AT = (s, ch, i) => s.startsWith(ch, i);
const OPENERS = '([{';
const CLOSERS = ')]}';

/** The value expression of property `key` starting at `from`, to the next top-level comma. */
const valueSpan = (code, from) => {
  let depth = 0;
  for (let i = from; i < code.length; i += 1) {
    const ch = code[i];
    if (OPENERS.includes(ch)) depth += 1;
    else if (CLOSERS.includes(ch)) { if (depth === 0) return i; depth -= 1; }
    else if (AT(code, ',', i) && depth === 0) return i;
  }
  return code.length;
};

/** Top-level `?` of a conditional expression, or -1. Skips `?.` and `??`. */
const ternaryQ = (expr) => {
  let depth = 0;
  for (let i = 0; i < expr.length; i += 1) {
    const ch = expr[i];
    if (OPENERS.includes(ch)) depth += 1;
    else if (CLOSERS.includes(ch)) depth -= 1;
    else if (AT(expr, '?', i) && depth === 0) {
      if (AT(expr, '?.', i) || AT(expr, '??', i)) { i += 1; continue; }
      return i;
    }
  }
  return -1;
};

/** The `:` matching the top-level `?` at `q`, or -1. */
const ternaryColon = (expr, q) => {
  let depth = 0;
  let tern = 0;
  for (let i = q; i < expr.length; i += 1) {
    const ch = expr[i];
    if (OPENERS.includes(ch)) depth += 1;
    else if (CLOSERS.includes(ch)) depth -= 1;
    else if (depth === 0 && AT(expr, '?', i) && !AT(expr, '?.', i) && !AT(expr, '??', i)) tern += 1;
    else if (depth === 0 && AT(expr, ':', i)) { tern -= 1; if (tern === 0) return i; }
  }
  return -1;
};

const LITERAL = /^(['"`])([A-Za-z][A-Za-z0-9-]*)\1$/;

/**
 * Class literals reachable from a value expression, in source order, recursing through ternaries
 * and taking literals ONLY from operand positions — never from a condition.
 * Returns `[{ value } | { unresolved: <expr> }]`.
 */
const literalsOf = (expr) => {
  const e = expr.trim();
  const q = ternaryQ(e);
  if (q === -1) {
    const m = LITERAL.exec(e);
    return m ? [{ value: m[2] }] : [{ unresolved: e.slice(0, 60) }];
  }
  const c = ternaryColon(e, q);
  if (c === -1) return [{ unresolved: e.slice(0, 60) }];
  return [...literalsOf(e.slice(q + 1, c)), ...literalsOf(e.slice(c + 1))];
};

/**
 * Guard of the branch whose `cls:` site is at `at`, given the previous branch's site `prev`.
 *
 * **The rule is "no other `cls:` site in between", not "no `return` in between."** The first
 * spelling here was the latter, and it returned `null` for every guarded branch in the subject:
 * a guard's own `if` is immediately followed by its own `return`, so the test that was meant to
 * stop a guard being attributed to the NEXT branch rejected it for its own. The `cls:`-site rule
 * is the same intent keyed on data the caller already has — and the fall-through branch, which
 * genuinely has no guard, is the only case the old spelling got right.
 *
 * Span boundaries are found in the blanked reading and the guard text is sliced out of the RAW
 * source at the same offsets, because `stripSource` blanks a regex BODY in both readings — a guard
 * read from the blanked text would be `/      /.test(subj)` and no token test over it could see
 * what the regex matches.
 */
const guardOf = (code, raw, at, prev) => {
  let best = null;
  for (let i = 0; i + 2 < at; i += 1) {
    if (!AT(code, 'if', i)) continue;
    if (/[A-Za-z0-9_$.]/.test(code[i - 1] || ' ')) continue;
    let j = i + 2;
    while (j < at && ' \t\n'.includes(code[j])) j += 1;
    if (!AT(code, '(', j)) continue;
    const end = valueSpan(code, j + 1);
    if (end >= at) continue;
    if (end <= prev) continue;
    best = { guard: raw.slice(j + 1, end), at: i };
  }
  return best;
};

/** Every `cls:` branch in `src`, in source order, read from the two readings of one scanner. */
const branchesOf = (src) => {
  const code = stripSource(src, true);   // strings blanked — which `cls:` sites are really code
  const kept = stripSource(src, false);  // strings kept     — the literal values at those sites
  const out = [];
  const KEY = /\bcls\s*:/g;
  let prev = -1;
  for (const m of code.matchAll(KEY)) {
    const at = m.index + m[0].length;
    const end = valueSpan(code, at);
    const expr = kept.slice(at, end);
    const g = guardOf(code, src, m.index, prev);
    prev = m.index;
    out.push({
      at: m.index,
      expr: expr.trim(),
      literals: literalsOf(expr),
      guard: g ? g.guard.replace(/\s+/g, ' ').trim() : null,
    });
  }
  return out;
};

// ───────────────────────────────────────────── §1  KP the cured extractor BEFORE applying it

say('§1  known positives for the cured extractor — driven before it touches the subject');

const KP = [
  ['plain literal', "return { cls: 'FIXTURE', why: x };", ['FIXTURE'], 1],
  ['ternary operands', "return { cls: /g/.test(s) ? 'GATE' : 'OTHER-PROCESS', why: x };", ['GATE', 'OTHER-PROCESS'], 1],
  ['nested ternary', "return { cls: a ? 'FIXTURE' : b ? 'CAPTURE' : 'FILE' };", ['FIXTURE', 'CAPTURE', 'FILE'], 1],
  // The real hazard in the real subject: a regex whose character class holds all three quote marks.
  ['regex holding quote marks', "if (/^['\"`]/.test(subj)) return { cls: 'FIXTURE', why: q };", ['FIXTURE'], 1],
  ['two branches, order kept', "if (a) return { cls: 'GATE' };\nreturn { cls: 'FILE' };", ['GATE', 'FILE'], 2],
  // REFUSALS — P8.
  ['REFUSAL cls: inside a string', "const s = \"cls: 'NOT-A-CLASS'\";", [], 0],
  ['REFUSAL cls: in a line comment', "// return { cls: 'NOT-A-CLASS' }\nconst z = 1;", [], 0],
  ['REFUSAL cls: in a block comment', "/* cls: 'NOT-A-CLASS' */\nconst z = 1;", [], 0],
  ['REFUSAL identifier value', 'return { cls: someIdent, why: x };', ['<unresolved>'], 1],
];

let kpPass = 0;
for (const [name, src, wantLits, wantBranches] of KP) {
  const bs = branchesOf(src);
  const got = bs.flatMap((b) => b.literals.map((l) => (l.value === undefined ? '<unresolved>' : l.value)));
  const ok = bs.length === wantBranches && got.join(',') === wantLits.join(',');
  if (ok) kpPass += 1;
  else fail(`${name}: branches ${bs.length} (want ${wantBranches}), literals [${got.join(', ')}] (want [${wantLits.join(', ')}])`);
  say(`  ${ok ? 'pass' : 'FAIL'}  ${name.padEnd(30)} branches ${bs.length}  literals ${got.join(' → ') || '(none)'}`);
}
say('');
say(`  KP cells ${kpPass} of ${KP.length}   (refusals ${KP.filter(([n]) => n.startsWith('REFUSAL')).length})`);

// Guard reader, KP'd separately — P6 depends on it and a conjoined leg could not say which failed.
const GKP = [
  ['guarded branch', "if (/stdout/.test(ev)) return { cls: 'GATE' };", 'stdout'],
  ['fall-through branch', "if (a) return { cls: 'GATE' };\nreturn { cls: 'FILE' };", null],
  ['block form', "if (b(ev)) {\n  return { cls: 'FIXTURE' };\n}", 'ev'],
];
let gPass = 0;
for (const [name, src, wantIn] of GKP) {
  const bs = branchesOf(src);
  const last = bs[bs.length - 1];
  const g = last ? last.guard : undefined;
  const ok = wantIn === null ? g === null : typeof g === 'string' && g.includes(wantIn);
  if (ok) gPass += 1; else fail(`guard reader ${name}: got ${JSON.stringify(g)}, wanted ${wantIn === null ? 'null' : `one containing ${wantIn}`}`);
  say(`  ${ok ? 'pass' : 'FAIL'}  guard-reader ${name.padEnd(22)} → ${JSON.stringify(g)}`);
}
say(`  guard-reader KP cells ${gPass} of ${GKP.length}`);
say('');

// ───────────────────────────────────────────── §2  P1 — the published artefact reproduces

say('§2  P1 — the OLD extractor, re-run against the live slice');
const OLD = /cls: '([A-Z-]+)'/g;
const oldOrder = [...body.matchAll(OLD)].map((m) => m[1]);
say(`  old key  ${OLD}`);
say(`  yield    ${oldOrder.join(' → ')}   (${oldOrder.length} members)`);
const P1 = oldOrder.length === 4 && oldOrder.join(' → ') === 'UNRESOLVED → FIXTURE → FIXTURE → UNRESOLVED';
say(`  P1 reproduces as published (4, UNRESOLVED → FIXTURE → FIXTURE → UNRESOLVED): ${P1}`);
say('');

// ───────────────────────────────────────────── §3  P4/P2 — the cured extractor on the subject

say('§3  P4 — the cured extractor on the subject, and P2 — the two granularities');
const branches = branchesOf(body);
const allLits = branches.flatMap((b) => b.literals);
const curedOrder = allLits.map((l) => (l.value === undefined ? `<unresolved:${l.unresolved}>` : l.value));
for (const [i, b] of branches.entries()) {
  const ls = b.literals.map((l) => l.value ?? `<unresolved:${l.unresolved}>`).join(' | ');
  say(`  branch ${i + 1}  @${b.at}  ${b.literals.length === 1 ? 'plain  ' : 'ternary'}  ${ls}`);
  say(`            guard: ${b.guard === null ? '(none — fall-through)' : b.guard.slice(0, 92)}`);
}
say('');
say(`  cured order: ${curedOrder.join(' → ')}`);
const invented = allLits.filter((l) => l.value !== undefined && !DECLARED.includes(l.value));
say(`  branches 6 of 6: ${branches.length === 6}   class literals 8 of 8: ${allLits.length === 8}   invented members: ${invented.length}`);
const P4 = branches.length === 6 && allLits.length === 8 && invented.length === 0;
say(`  P4 (6 branches · 8 literals · 0 invented): ${P4}`);
say('');
say(`  P2 — one blindness, two granularities:`);
say(`       at BRANCH granularity      old ${oldOrder.length} of ${branches.length}`);
say(`       at CLASS-LITERAL granularity  old ${oldOrder.length} of ${allLits.length}`);
const P2 = branches.length === 6 && allLits.length === 8 && oldOrder.length === 4;
say(`  P2 (4 of 6 branches AND 4 of 8 literals, published figure was the branch one): ${P2}`);
say('');

// ───────────────────────────────────────────── §4  P3 — the blindness is the discriminating branches

say('§4  P3 — is the blindness distributed at random, or is it exactly the discriminating branches?');
// A branch is "caught" by the old key iff its cls value is a bare quoted literal immediately after
// `cls: ` — i.e. the old key matches inside this branch's own value span.
const caught = [];
const missed = [];
for (const b of branches) {
  const hit = /^'[A-Z-]+'$/.test(b.expr);
  (hit ? caught : missed).push(b);
}
const isTernary = (b) => b.literals.length > 1;
say(`  caught by the old key: ${caught.length}   of which ternary: ${caught.filter(isTernary).length}`);
say(`  missed by the old key: ${missed.length}   of which ternary: ${missed.filter(isTernary).length}`);
for (const b of missed) say(`    missed  @${b.at}  ${b.expr.slice(0, 80)}`);
const P3 = missed.length === 2 && missed.every(isTernary) && caught.length === 4 && caught.filter(isTernary).length === 0;
say(`  P3 (2 of 2 missed are ternary, 0 of 4 caught are): ${P3}`);
say(`  → in this key the ternary form appears ONLY where the branch makes a sub-discrimination, so a`);
say(`    quote-anchored reader is blind precisely at the branches a precedence claim must show.`);
say('');

// ───────────────────────────────────────────── §5  P5 — the precedence verdict at full granularity

say('§5  P5 — unit-515 P3\'s precedence claim, re-read over all six branches by source offset');
const EVIDENCE_TOKENS = /stdout|spawnSync|execFileSync|execSync|readFileSync/;
const literalSubjectBranch = branches.find((b) => b.guard !== null && /\^\[/.test(b.guard) && !EVIDENCE_TOKENS.test(b.guard));
const evidenceBranches = branches.filter((b) => b.guard !== null && EVIDENCE_TOKENS.test(b.guard));
// A branch whose evidence test is NEGATED is still an evidence test, and it matters which it is:
// one of the two FIXTURE branches is in this set, which is the §6 finding seen from here.
const negated = evidenceBranches.filter((b) => /!\s*\//.test(b.guard));
if (!literalSubjectBranch) fail('could not locate the literal-subject branch by its guard');
say(`  literal-subject branch @${literalSubjectBranch ? literalSubjectBranch.at : '?'}  guard: ${literalSubjectBranch ? literalSubjectBranch.guard.replace(/\s+/g, ' ').slice(0, 70) : '—'}`);
say(`  branches whose guard names a process/read token: ${evidenceBranches.length}   of which NEGATED: ${negated.length}`);
for (const b of evidenceBranches) say(`    @${b.at}  negated ${/!\s*\//.test(b.guard)}  ${b.guard.replace(/\s+/g, ' ').slice(0, 84)}`);
const precedes = literalSubjectBranch ? evidenceBranches.every((b) => literalSubjectBranch.at < b.at) : false;
say(`  the literal-subject branch precedes EVERY evidence branch: ${precedes}`);
say(`  P5 — verdict HELD at full granularity: ${precedes}`);
say(`       the figure the claim cites moved ${oldOrder.length} → ${allLits.length}; the verdict did not move.`);
say('');

// ───────────────────────────────────────────── §6  P6 — a class-name sequence cannot name a branch

say('§6  P6 — can a class-name sequence identify the branch a claim names?');
const names = allLits.map((l) => l.value).filter(Boolean);
const counts = new Map();
for (const n of names) counts.set(n, (counts.get(n) || 0) + 1);
const nonUnique = names.filter((n) => counts.get(n) > 1);
say(`  cured sequence: ${names.join(' → ')}`);
say(`  class names occurring more than once: ${[...counts].filter(([, c]) => c > 1).map(([n, c]) => `${n}×${c}`).join(', ')}`);
say(`  literals that are NON-UNIQUE within the sequence: ${nonUnique.length} of ${names.length}`);
const fixtureBranches = branches.filter((b) => b.literals.some((l) => l.value === 'FIXTURE'));
const fixtureConsulting = fixtureBranches.filter((b) => b.guard !== null && EVIDENCE_TOKENS.test(b.guard));
say(`  FIXTURE-returning branches: ${fixtureBranches.length}   of which consult the evidence line: ${fixtureConsulting.length}`);
for (const b of fixtureBranches) say(`    @${b.at}  consults-evidence ${b.guard !== null && EVIDENCE_TOKENS.test(b.guard)}  guard: ${(b.guard || '(none)').slice(0, 76)}`);
const P6 = nonUnique.length === 4 && fixtureBranches.length === 2 && fixtureConsulting.length === 1;
say(`  P6 (4 of 8 non-unique · 2 FIXTURE branches · exactly 1 consults evidence): ${P6}`);
say('');

// ───────────────────────────────────────────── §7  P7 — reach, which I asserted without measuring

say('§7  P7 — reach census: quote-anchored property-value extractors over source text');
const tracked = execFileSync('git', ['ls-files', 'docs/research', 'scripts'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter((p) => p.endsWith('.mjs') || p.endsWith('.js') || p.endsWith('.mts'));
say(`  population: tracked .mjs/.js/.mts under docs/research + scripts = ${tracked.length} file(s)`);

// The census key: a regex literal whose source holds `<ident>:` followed by a quote and a capture
// group — the shape of the subject's own `cls: '([A-Z-]+)'`.
const CENSUS_KEY = /[A-Za-z_$][\w$]*\s*:\s*\\?['"`]\(/;
say(`  census key (applied to REGEX LITERAL SOURCE only): ${CENSUS_KEY}`);

/**
 * Which region is offset `o` in: code, a string body, a regex literal, or a comment?
 *
 * **The first spelling of this scanned backwards to the nearest surviving delimiter, on the premise
 * that `stripSource` keeps a construct's delimiters and blanks only its body. That premise is
 * FALSE** — it blanks the construct WHOLE (`const r = /x/g` → `const r =      g`), so there is no
 * delimiter left to find and the classifier returned `code` for all three of its known positives.
 * It was asserted in a docblock here and refuted by its own KP set at **0 of 3**, before any census
 * figure existed. The cure uses the property the module actually guarantees: blanking is
 * LENGTH-PRESERVING, so `raw[i] !== blank[i]` is an exact mask of what was blanked, and the first
 * masked byte of a run IS the construct's opening delimiter in the raw text.
 *
 * Two readings separate three regions: a string body survives in the strings-kept reading; a
 * comment and a regex body do not survive in either, and are told apart by the raw bytes at the
 * run's start (`//`, `/*`, or a bare `/`).
 */
const regionAt = (raw, blank, kept, o) => {
  if (blank[o] === raw[o]) return 'code';
  if (kept[o] === raw[o]) return 'string';
  const masked = (i) => i >= 0 && i < raw.length && blank[i] !== raw[i];
  let start = o;
  for (let i = o; i >= 0;) {
    if (masked(i)) { start = i; i -= 1; continue; }
    if (' \t'.includes(raw[i])) { i -= 1; continue; } // a raw space blanks to itself — ambiguous
    break;
  }
  if (AT(raw, '//', start)) return 'line-comment';
  if (AT(raw, '/*', start)) return 'block-comment';
  if (AT(raw, '/', start)) return 'regex';
  return 'code';
};
// KP the region classifier before using it — a census returning 0 needs a known positive first.
const RKP = [
  ['regex', "const r = /cls: '([A-Z-]+)'/g;", 'regex'],
  ['line comment', "// cls: '([A-Z-]+)'\n", 'line-comment'],
  ['block comment', "/* cls: '([A-Z-]+)' */\n", 'block-comment'],
  ['string body', "const s = \"cls: '([A-Z-]+)'\";", 'string'],
  ['plain code', "const o = { cls: '(x)' };", 'code'],
];
let rPass = 0;
for (const [name, src, want] of RKP) {
  const blank = stripSource(src, true);
  const kept2 = stripSource(src, false);
  const o = src.search(CENSUS_KEY);
  const got = o === -1 ? '(key did not match)' : regionAt(src, blank, kept2, o);
  const ok = got === want;
  if (ok) rPass += 1; else fail(`region classifier ${name}: got ${got}, want ${want}`);
  say(`  ${ok ? 'pass' : 'FAIL'}  region-classifier ${name.padEnd(14)} → ${got}`);
}
say(`  region-classifier KP cells ${rPass} of ${RKP.length}`);

const members = [];
let scanned = 0;
for (const rel of tracked) {
  let src;
  try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  scanned += 1;
  const blank = stripSource(src, true);
  const keptR = stripSource(src, false);
  const hits = [];
  const g = new RegExp(CENSUS_KEY.source, 'g');
  for (const m of src.matchAll(g)) {
    if (regionAt(src, blank, keptR, m.index) === 'regex') hits.push({ at: m.index, text: m[0] });
  }
  if (hits.length > 0) {
    const line = (o) => src.slice(0, o).split('\n').length;
    members.push({ rel, hits: hits.length, first: `${line(hits[0].at)}: ${src.slice(hits[0].at - 10, hits[0].at + 30).replace(/\n/g, '\\n')}` });
  }
}
say(`  files scanned: ${scanned}`);
say(`  MEMBERS: ${members.length}`);
for (const m of members) say(`    ${m.rel}  (${m.hits} hit${m.hits === 1 ? '' : 's'})  ${m.first}`);
const subjectIsMember = members.some((m) => m.rel.includes('unit-515keyekp'));
say(`  the subject itself is among them: ${subjectIsMember}`);
const P7 = members.length === 1 && subjectIsMember;
say(`  P7 (registered expectation: exactly 1, the subject): ${P7}${P7 ? '' : '  ← my morning parenthetical is at risk'}`);
say('  DECLARED BLINDNESS of this census: it keys on a regex literal that spells the colon-quote-capture');
say('  shape LITERALLY. A reader built out of `indexOf`/`split`, or one whose pattern is assembled from');
say('  string pieces, is a member of the class and invisible to this key. The figure is a FLOOR.');
say('');

// ───────────────────────────────────────────── wrap

const diff = execFileSync('git', ['diff', '--stat', '--', 'packages', 'scripts'], { cwd: ROOT, encoding: 'utf8' }).trim();
say(`§8  packages/ and scripts/ diff --stat EMPTY: ${diff === ''}`);
if (diff !== '') fail(`packages/ or scripts/ is modified:\n${diff}`);

const SCORE = { P1, P2, P3, P4, P5: precedes, P6, P7, P8: kpPass === KP.length };
say('');
say('§9  registered predictions');
for (const [k, v] of Object.entries(SCORE)) say(`  ${v ? 'HIT     ' : 'REFUTED '} ${k}`);
say(`  ${Object.values(SCORE).filter(Boolean).length} of ${Object.keys(SCORE).length} HIT`);
say('');
say(`  KP totals: cured extractor ${kpPass}/${KP.length} · guard reader ${gPass}/${GKP.length} · region classifier ${rPass}/${RKP.length}`);
say(`  failures: ${failures}`);

writeFileSync(join(CAPS, 'ARM-BRANCHORDER.out'), lines.join('\n') + '\n');
writeFileSync(join(CAPS, 'ARM-BRANCHORDER.json'), JSON.stringify({
  rev, drivenAt: now, bodyBytes: body.length,
  oldOrder, curedOrder, branches, score: SCORE,
  kp: { cured: [kpPass, KP.length], guard: [gPass, GKP.length], region: [rPass, RKP.length] },
  census: { population: tracked.length, scanned, members },
}, null, 2) + '\n');
writeFileSync(join(CAPS, 'ARM-BRANCHORDER.err'), '');
process.exit(failures === 0 ? 0 : 1);
