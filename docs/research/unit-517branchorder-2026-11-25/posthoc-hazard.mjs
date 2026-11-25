/**
 * unit-517 post-hoc — shape reach vs hazard reach.
 *
 * Registered: `PRE-REGISTRATION-ADDENDUM-HAZARD.md`, commit `c6b9ba52`, pushed to `main` before
 * this file existed. PH1–PH4. The arm's figures are at `8189e3be` and nothing here edits them.
 *
 * The arm's P7 census found 6 files carrying the quote-anchored shape. This rung asks the question
 * the census does not answer: of those 6, how many are blind to anything that is actually there?
 *
 * Same discipline as the arm: no character comparison against a brace, paren or colon anywhere
 * (`unit-515` §5(iv)); both readings of `stripSource` out of one scanner; the extractor re-KP'd
 * under each substituted property name rather than inheriting the arm's 9 of 9.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
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

say('unit-517 post-hoc — shape reach vs hazard reach');
say(`  rev ${rev} · driven ${now} PST`);
say('');

// ───────────────────────────────────────────── the readers, parameterised by property name

const AT = (s, ch, i) => s.startsWith(ch, i);
const OPENERS = '([{';
const CLOSERS = ')]}';

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

const LITERAL = /^(['"`])([^'"`]*)\1$/;

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
 * **v2, and the v1 above is kept rather than replaced.** v1's first census of the five names
 * returned positives that are not conditionals at all, and reading them is what found it:
 *
 *   drive-guard.mts:61   `string; refusal?: RegExp; skip?: RegExp`
 *   sweep-probes.d.mts:23 `string;\n  expect: RegExp;  why: string;`
 *
 * Two defects, both in TypeScript and both invisible in `.mjs`:
 *   1. `ternaryQ` reads the `?` of an **optional property** (`refusal?: RegExp`) as a ternary.
 *   2. `valueSpan` stops at a top-level comma or closer, and a TS **type member** is terminated by
 *      `;` — so the span runs across the rest of the interface and swallows later members.
 *
 * v1 is retained and both censuses are printed, because a decontamination fix removes false
 * CREDITS as well as false debits: silently swapping in v2 would publish a smaller number with no
 * way to see that the first one was inflated, or by how much, or which direction the verdict moved.
 */
const valueSpanV2 = (code, from) => {
  let depth = 0;
  for (let i = from; i < code.length; i += 1) {
    const ch = code[i];
    if (OPENERS.includes(ch)) depth += 1;
    else if (CLOSERS.includes(ch)) { if (depth === 0) return i; depth -= 1; }
    else if (depth === 0 && (AT(code, ',', i) || AT(code, ';', i))) return i;
  }
  return code.length;
};

const ternaryQV2 = (expr) => {
  let depth = 0;
  for (let i = 0; i < expr.length; i += 1) {
    const ch = expr[i];
    if (OPENERS.includes(ch)) depth += 1;
    else if (CLOSERS.includes(ch)) depth -= 1;
    else if (AT(expr, '?', i) && depth === 0) {
      // `?.` optional chaining · `??` nullish · `?:` a TypeScript OPTIONAL PROPERTY, not a ternary.
      if (AT(expr, '?.', i) || AT(expr, '??', i) || AT(expr, '?:', i)) { i += 1; continue; }
      return i;
    }
  }
  return -1;
};

/** Every `<name>:` property site in `src`, with whether its value is a conditional expression. */
const sitesOf = (src, name, v2 = false) => {
  const span = v2 ? valueSpanV2 : valueSpan;
  const tq = v2 ? ternaryQV2 : ternaryQ;
  const code = stripSource(src, true);
  const kept = stripSource(src, false);
  const out = [];
  const KEY = new RegExp(`\\b${name}\\s*:`, 'g');
  for (const m of code.matchAll(KEY)) {
    const at = m.index + m[0].length;
    const end = span(code, at);
    const expr = kept.slice(at, end).trim();
    const lits = literalsOf(expr);
    out.push({ at, expr, literals: lits, ternary: tq(expr) !== -1, line: src.slice(0, m.index).split('\n').length });
  }
  return out;
};

const regionAt = (raw, blank, kept, o) => {
  if (blank[o] === raw[o]) return 'code';
  if (kept[o] === raw[o]) return 'string';
  const masked = (i) => i >= 0 && i < raw.length && blank[i] !== raw[i];
  let start = o;
  for (let i = o; i >= 0;) {
    if (masked(i)) { start = i; i -= 1; continue; }
    if (' \t'.includes(raw[i])) { i -= 1; continue; }
    break;
  }
  if (AT(raw, '//', start)) return 'line-comment';
  if (AT(raw, '/*', start)) return 'block-comment';
  if (AT(raw, '/', start)) return 'regex';
  return 'code';
};

// ───────────────────────────────────────────── PH2 first: re-KP the parameterised extractor

say('§1  PH2 — the extractor parameterised by name is a DIFFERENT key, so it is re-KP\'d');
const kpSet = (n) => [
  [`plain literal`, `return { ${n}: 'FIXTURE', why: x };`, ['FIXTURE'], 1],
  [`ternary operands`, `return { ${n}: /g/.test(s) ? 'GATE' : 'OTHER-PROCESS', why: x };`, ['GATE', 'OTHER-PROCESS'], 1],
  [`nested ternary`, `return { ${n}: a ? 'FIXTURE' : b ? 'CAPTURE' : 'FILE' };`, ['FIXTURE', 'CAPTURE', 'FILE'], 1],
  [`regex holding quote marks`, `if (/^['"\`]/.test(s)) return { ${n}: 'FIXTURE' };`, ['FIXTURE'], 1],
  [`two sites, order kept`, `if (a) return { ${n}: 'GATE' };\nreturn { ${n}: 'FILE' };`, ['GATE', 'FILE'], 2],
  [`REFUSAL inside a string`, `const s = "${n}: 'NOT-A-CLASS'";`, [], 0],
  [`REFUSAL in a line comment`, `// return { ${n}: 'NOT-A-CLASS' }\nconst z = 1;`, [], 0],
  [`REFUSAL in a block comment`, `/* ${n}: 'NOT-A-CLASS' */\nconst z = 1;`, [], 0],
  [`REFUSAL identifier value`, `return { ${n}: someIdent, why: x };`, ['<unresolved>'], 1],
];
// Two cells v1 FAILS and v2 must pass — written from the two artefacts v1's own positives showed.
const tsCells = (n) => [
  [`REFUSAL ts optional property`, `interface I { ${n}: string; refusal?: RegExp; }`, ['<unresolved>'], 1],
  [`REFUSAL ts member ends at ;`, `type T = { ${n}: string; why: RegExp; };`, ['<unresolved>'], 1],
];
const kpScores = {};
for (const n of ['cls', 'p', 'error']) {
  let pass = 0;
  const cells = kpSet(n);
  for (const [name, src, wantLits, wantSites] of cells) {
    const ss = sitesOf(src, n, true);
    const got = ss.flatMap((s) => s.literals.map((l) => (l.value === undefined ? '<unresolved>' : l.value)));
    const ok = ss.length === wantSites && got.join(',') === wantLits.join(',');
    if (ok) pass += 1; else fail(`KP[${n}] ${name}: sites ${ss.length}/${wantSites}, literals [${got.join(', ')}] want [${wantLits.join(', ')}]`);
  }
  kpScores[n] = [pass, cells.length];
  say(`  name "${n}"  KP cells ${pass} of ${cells.length} (v2)${pass === cells.length ? '' : '  ← no PH3 figure is reportable under this name'}`);
}
const PH2 = Object.values(kpScores).every(([p, t]) => p === t);
say(`  PH2 (9 of 9 under every substituted name): ${PH2}`);
say('');
say('  the two TypeScript cells, run under BOTH readers — v1 fails them, which is why v1\'s census inflated:');
let tsV1 = 0; let tsV2 = 0;
for (const n of ['cls', 'file']) {
  for (const [name, src, wantLits, wantSites] of tsCells(n)) {
    for (const [tag, use] of [['v1', false], ['v2', true]]) {
      const ss = sitesOf(src, n, use);
      const got = ss.flatMap((s) => s.literals.map((l) => (l.value === undefined ? '<unresolved>' : l.value)));
      const ok = ss.length === wantSites && got.join(',') === wantLits.join(',') && !ss.some((s) => s.ternary);
      if (use) { if (ok) tsV2 += 1; } else if (ok) tsV1 += 1;
      say(`    ${tag}  ${ok ? 'pass' : 'FAIL'}  [${n}] ${name.padEnd(30)} sites ${ss.length} ternary-flagged ${ss.filter((s) => s.ternary).length}`);
    }
  }
}
say(`  TypeScript refusal cells: v1 ${tsV1} of 4 · v2 ${tsV2} of 4`);
if (tsV2 !== 4) fail(`v2 does not hold the TypeScript refusals (${tsV2} of 4) — the cured census is not reportable`);
say('');

// ───────────────────────────────────────────── PH1 — the property name each member reads

say('§2  PH1 — the property name each census member\'s own key reads');
const MEMBERS = JSON.parse(readFileSync(join(CAPS, 'ARM-BRANCHORDER.json'), 'utf8')).census.members;
const CENSUS_KEY = /([A-Za-z_$][\w$]*)\s*:\s*\\?['"`]\(/;
const named = [];
for (const m of MEMBERS) {
  const src = readFileSync(join(ROOT, m.rel), 'utf8');
  const blank = stripSource(src, true);
  const kept = stripSource(src, false);
  const g = new RegExp(CENSUS_KEY.source, 'g');
  const names = new Set();
  for (const hit of src.matchAll(g)) {
    if (regionAt(src, blank, kept, hit.index) === 'regex') names.add(hit[1]);
  }
  named.push({ rel: m.rel, hits: m.hits, names: [...names] });
  say(`  ${m.rel}`);
  say(`      hits ${m.hits}   property name(s) read: ${[...names].join(', ') || '(none recovered)'}`);
}
const PH1 = named.every((n) => n.names.length > 0);
say(`  PH1 (a name recovered for all ${named.length} members): ${PH1}`);
const allNames = [...new Set(named.flatMap((n) => n.names))];
say(`  distinct property names across the census: ${allNames.length}  (${allNames.join(', ')})`);
say('');

// ───────────────────────────────────────────── PH3 — ternary-position occurrences per name

say('§3  PH3 — for each name, occurrences in a TERNARY-OPERAND position across the same population');
const tracked = execFileSync('git', ['ls-files', 'docs/research', 'scripts'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter((p) => p.endsWith('.mjs') || p.endsWith('.js') || p.endsWith('.mts'));
say(`  population: ${tracked.length} tracked file(s) — the arm's population, reused so the two figures share a denominator`);
say('');

const census = (v2) => {
  const per = {};
  for (const n of allNames) {
    const found = [];
    let totalSites = 0;
    for (const rel of tracked) {
      let src;
      try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
      if (!src.includes(`${n}:`)) continue;
      const ss = sitesOf(src, n, v2);
      totalSites += ss.length;
      for (const s of ss) if (s.ternary) found.push({ rel, line: s.line, expr: s.expr.replace(/\s+/g, ' ').slice(0, 68) });
    }
    per[n] = { sites: totalSites, ternary: found };
  }
  return per;
};
const perNameV1 = census(false);
const perName = census(true);

for (const n of allNames) {
  const a = perNameV1[n];
  const b = perName[n];
  say(`  ${n.padEnd(14)} sites v1 ${String(a.sites).padStart(5)} → v2 ${String(b.sites).padStart(5)}   TERNARY-position  v1 ${a.ternary.length} → v2 ${b.ternary.length}`);
  for (const f of b.ternary.slice(0, 5)) say(`      v2 keeps  ${f.rel}:${f.line}   ${f.expr}`);
  const dropped = a.ternary.filter((x) => !b.ternary.some((y) => y.rel === x.rel && y.line === x.line));
  for (const f of dropped.slice(0, 5)) say(`      v2 DROPS  ${f.rel}:${f.line}   ${f.expr}`);
}
say('');

const blindUnder = (per) => named.filter((m) => m.names.some((n) => per[n].ternary.length > 0));
const liveBlindV1 = blindUnder(perNameV1);
const liveBlind = blindUnder(perName);
say(`§4  the two figures, in one place — and the instrument's own correction, visible`);
say(`  SHAPE reach  — files carrying the quote-anchored key: ${MEMBERS.length}`);
say(`  HAZARD reach — v1 (TS-blind reader): ${liveBlindV1.length} of ${MEMBERS.length}`);
for (const m of liveBlindV1) say(`      v1 live-blind: ${m.rel}  (${m.names.filter((n) => perNameV1[n].ternary.length > 0).join(', ')})`);
say(`  HAZARD reach — v2 (TS optional-property and \`;\` terminator cured): ${liveBlind.length} of ${MEMBERS.length}`);
for (const m of liveBlind) say(`      v2 live-blind: ${m.rel}  (${m.names.filter((n) => perName[n].ternary.length > 0).join(', ')})`);
say(`  gap: ${MEMBERS.length - liveBlind.length} file(s) carry the shape and are blind to nothing that is there today.`);
const PH3 = liveBlind.length === 1 && liveBlind[0].rel.includes('unit-515keyekp');
say(`  PH3 as registered (live-blind = 1 of ${MEMBERS.length}, the subject alone): ${PH3}`);
say(`  verdict under v1 and under v2 is the same count (${liveBlindV1.length} and ${liveBlind.length}): ${liveBlindV1.length === liveBlind.length}`);
say(`  …and that agreement is NOT the same evidence: ${perNameV1.file ? perNameV1.file.ternary.length : 0} \`file\` hits under v1,`);
say(`     ${perName.file ? perName.file.ternary.length : 0} under v2. A count that survives a cure of the instrument can still have`);
say('     had most of its members replaced, so the count is not what was checked — the rows were.');
say('');
say('  LIMITS, as registered, in both directions and not cancelling:');
say('   · population is tracked docs/research + scripts only — a ternary in packages/ is out of');
say('     scope, so the hazard figure is a FLOOR.');
say('   · a common-English property name matches object literals unrelated to the member\'s read');
say('     target, so the per-name site counts are an UPPER BOUND on what any one reader looks at.');
say('   · the gap is a property of the corpus TODAY. It closes the moment anyone writes a ternary');
say('     into one of those five property positions, and no reader changes when it does.');
say('');

const diff = execFileSync('git', ['diff', '--stat', '--', 'packages', 'scripts'], { cwd: ROOT, encoding: 'utf8' }).trim();
say(`§5  packages/ and scripts/ diff --stat EMPTY: ${diff === ''}`);
if (diff !== '') fail(`packages/ or scripts/ is modified:\n${diff}`);

const SCORE = { PH1, PH2, PH3, PH4: true };
say('');
say('§6  registered predictions');
for (const [k, v] of Object.entries(SCORE)) say(`  ${v ? 'HIT     ' : 'REFUTED '} ${k}`);
say(`  ${Object.values(SCORE).filter(Boolean).length} of ${Object.keys(SCORE).length} HIT   (PH4 is a commitment about reporting, met in RESULTS.md and the memo)`);
say(`  failures: ${failures}`);

writeFileSync(join(CAPS, 'POSTHOC-HAZARD.out'), lines.join('\n') + '\n');
writeFileSync(join(CAPS, 'POSTHOC-HAZARD.json'), JSON.stringify({
  rev, drivenAt: now, kpScores, named, perName, liveBlind: liveBlind.map((m) => m.rel), score: SCORE,
}, null, 2) + '\n');
writeFileSync(join(CAPS, 'POSTHOC-HAZARD.err'), '');
process.exit(failures === 0 ? 0 : 1);
