// Round 454 — census 2: his §7 lead, traced from the module to the call sites.
//
// Theseus's Round 453 §7 verified AT THE MODULE that `stripSource` does not refuse a non-string:
//
//     42                                 -> ""
//     {}                                 -> ""
//     Buffer.from("const x = 1; // c")   -> "991111101151163212032613249593247473299…"
//
// and handed over the dataflow explicitly unpriced: *"I have not traced whether any of the 12 sites
// actually feeds it a Buffer. The mechanism is verified at the module; the dataflow is not, and an
// import is not a call site."* That last clause is the thing: his §3 figure is `importers=33`, and
// an import is not a call site — I have read my own reader report zero on exactly that confusion
// before.
//
// This census does two separable things, and keeps them separable:
//
//   A. A RUNTIME ORACLE over his three rows plus the refusal-shaped inputs he did not list
//      (`null`, `undefined`, an array, a `String` object). Driven through the real module, so the
//      mechanism is reproduced here rather than quoted from his memo.
//   B. A CALL-SITE census: every `stripSource(` CALL in code (not in a comment, not in a string,
//      not an import), with its first argument sliced by paren balance and classified by how it
//      produces its value. Buckets are positively keyed and sum to the population, and the
//      terminal bucket is `UNMODELLED` entered by its OWN branch rather than by fall-through, so a
//      shape this classifier has no model of is visible as unmodelled instead of being absorbed
//      into a reassuring answer.
//
// The classifier is graded by a KP/KN bundle before it is allowed to report: synthetic sources
// carrying one call of each modelled shape, with the expected bucket written down first. If any KP
// row misclassifies, the census refuses rather than publishing a figure off an ungraded reader.

import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], {
  encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
});
const REV = git('rev-parse', 'HEAD').trim();

// The subject module, and this file. Both excluded from the population by PATH, derived from
// `import.meta.url` rather than typed, because an instrument does not census its own source and a
// hand-typed self-exclusion is a string that can drift away from the file it names.
const SUBJECT = 'scripts/lib/strip-source.mjs';
const SELF = new URL(import.meta.url).pathname.slice(ROOT.length + 1);

// ═══ A. RUNTIME ORACLE ═══════════════════════════════════════════════════════════════════════════
const ORACLE_INPUTS = [
  ['a number', 42],
  ['an empty object', {}],
  ['a Buffer of real source', Buffer.from('const x = 1; // c')],
  ['null', null],
  ['undefined', undefined],
  ['an array of chars', ['a', 'b']],
  ['a String object', new String('const x = 1; // c')], // eslint-disable-line no-new-wrappers
  ['a real string (control)', 'const x = 1; // c'],
];
const oracle = ORACLE_INPUTS.map(([label, v]) => {
  let got;
  let threw = null;
  try { got = stripSource(v, true); } catch (e) { threw = String(e.message).split('\n')[0]; }
  return {
    label,
    threw,
    typeOut: threw === null ? typeof got : null,
    len: threw === null && typeof got === 'string' ? got.length : null,
    // Does the COMMENT BODY survive? That is the property that matters: a caller asking "which
    // bytes are code" and getting the comment back is not getting a weaker answer, it is getting
    // the opposite one.
    commentSurvives: threw === null && typeof got === 'string'
      ? /99|const x/.test(got) && got.includes('99') : null,
    head: threw === null && typeof got === 'string' ? got.slice(0, 48) : null,
  };
});

// ═══ B. CALL-SITE CENSUS ═════════════════════════════════════════════════════════════════════════
// Slice the first argument of a call by paren balance over the BLINDED text (so a paren inside a
// string or comment cannot close the list) and take the span out of the RAW — which is sound only
// because `stripSource` preserves length, asserted per file below rather than taken on trust.
function firstArg(raw, blind, callEnd) {
  let d = 1;
  let j = callEnd;
  let split = -1;
  for (; j < blind.length && d > 0; j += 1) {
    const c = blind[j];
    if ('(['.includes(c) || c === '{') d += 1;
    else if (')]'.includes(c) || c === '}') { d -= 1; if (d === 0) break; }
    else if (c === ',' && d === 1 && split === -1) split = j;
  }
  if (d !== 0) return null; // unbalanced — reported, never silently dropped
  const end = split === -1 ? j : split;
  return raw.slice(callEnd, end).trim();
}

// Positively keyed buckets. Order matters only in that each branch states its own condition; the
// last one is NOT a fall-through, it is keyed on "none of the above matched", and its members are
// printed so that a bucket growing is visible as a blindness rather than as a result.
function classify(arg) {
  if (arg === null) return { bucket: 'UNBALANCED', why: 'argument list did not balance' };
  const a = arg.replace(/\s+/g, ' ');
  // readFileSync — the hazard his lead names. A second argument is what makes it a string.
  const rf = /^(?:fs\.|node:fs\.)?readFileSync\s*\(/.exec(a);
  if (rf) {
    // Balance inside the readFileSync call to find whether it has a second argument.
    let d = 1; let j = rf[0].length; let comma = -1;
    for (; j < a.length && d > 0; j += 1) {
      const c = a[j];
      if ('(['.includes(c) || c === '{') d += 1;
      else if (')]'.includes(c) || c === '}') { d -= 1; if (d === 0) break; }
      else if (c === ',' && d === 1 && comma === -1) comma = j;
    }
    if (comma === -1) return { bucket: 'BUFFER:readFileSync-no-encoding', why: a };
    const enc = a.slice(comma + 1, j);
    if (/utf-?8|encoding/i.test(enc)) return { bucket: 'STRING:readFileSync-encoded', why: a };
    return { bucket: 'UNMODELLED:readFileSync-second-arg-unrecognised', why: a };
  }
  if (/^git\s*\(/.test(a) || /^execFileSync\s*\(/.test(a) || /^execSync\s*\(/.test(a)) {
    return { bucket: 'STRING:child-process-helper', why: a };
  }
  if (/^['"`]/.test(a)) return { bucket: 'STRING:literal', why: a };
  if (/^(?:[A-Za-z_$][\w$]*)(?:\.[A-Za-z_$][\w$]*)*$/.test(a)) {
    return { bucket: 'UNMODELLED:identifier-or-member', why: a };
  }
  return { bucket: 'UNMODELLED:other-expression', why: a };
}

// ── KP / KN bundle: the classifier is graded before it reports ───────────────────────────────────
// One positive per modelled bucket AND a control for the discriminator that matters (encoding
// present vs. absent on the same call shape), because a classifier that answered `BUFFER` to every
// `readFileSync` would pass a bundle with only the no-encoding row in it.
const KP = [
  ['stripSource(readFileSync(p), true)', 'BUFFER:readFileSync-no-encoding'],
  ['stripSource(readFileSync(p, "utf8"), true)', 'STRING:readFileSync-encoded'],
  ['stripSource(readFileSync(join(a, b), { encoding: "utf8" }), true)', 'STRING:readFileSync-encoded'],
  ['stripSource(git("show", `${REV}:${f}`), true)', 'STRING:child-process-helper'],
  ['stripSource("const x = 1", true)', 'STRING:literal'],
  ['stripSource(src, true)', 'UNMODELLED:identifier-or-member'],
  ['stripSource(obj.src, true)', 'UNMODELLED:identifier-or-member'],
  ['stripSource(readSomehow(f) ?? "", true)', 'UNMODELLED:other-expression'],
];
const kpRows = KP.map(([src, want]) => {
  const blind = stripSource(src, true);
  const i = blind.indexOf('stripSource(');
  const got = classify(firstArg(src, blind, i + 'stripSource('.length)).bucket;
  return { src, want, got, ok: got === want };
});
// KN: a call inside a comment and a call inside a string literal must BOTH be invisible, because a
// scanner that fails does so by returning a smaller number and only a per-stage control separates
// comment-blindness from string-blindness.
const KN = [
  ['// stripSource(readFileSync(p), true)', 'comment'],
  ['const s = "stripSource(readFileSync(p), true)";', 'string literal'],
];
const knRows = KN.map(([src, stage]) => {
  const blind = stripSource(src, true);
  return { src, stage, visible: blind.includes('stripSource('), ok: !blind.includes('stripSource(') };
});

// ── The population, at the rev, by `ls-tree` ─────────────────────────────────────────────────────
const POP = git('ls-tree', '-r', '--name-only', '-z', REV)
  .split('\0')
  .filter((f) => f !== '' && /\.(mjs|mts|ts|tsx|js)$/.test(f))
  .filter((f) => f !== SUBJECT && f !== SELF);

const sites = [];
const importers = [];
let lengthFailures = 0;
for (const f of POP) {
  let raw;
  try { raw = git('show', `${REV}:${f}`); } catch { continue; }
  if (!raw.includes('stripSource')) continue;
  const blind = stripSource(raw, true);
  if (blind.length !== raw.length) { lengthFailures += 1; continue; }
  // An IMPORT is not a call site — counted separately and reported separately, because conflating
  // the two is exactly what makes `importers=33` read as a call-site figure.
  if (/import\s*\{[^}]*\bstripSource\b[^}]*\}\s*from/.test(blind)) importers.push(f);
  const token = 'stripSource(';
  for (let i = blind.indexOf(token); i !== -1; i = blind.indexOf(token, i + 1)) {
    // Not a call if the token is part of a longer identifier.
    if (/[\w$.]/.test(blind[i - 1] ?? '')) continue;
    const arg = firstArg(raw, blind, i + token.length);
    const { bucket, why } = classify(arg);
    sites.push({ f, line: raw.slice(0, i).split('\n').length, bucket, why: why.slice(0, 120) });
  }
}

// ═══ PUBLISH ═════════════════════════════════════════════════════════════════════════════════════
console.log(`census2 — does any call site feed stripSource a non-string?   rev = ${REV}`);
console.log(`  population: ${POP.length} tracked source file(s) at the rev, ${SUBJECT} and ${SELF} excluded by path`);
console.log('');
console.log('A. RUNTIME ORACLE through the real module');
for (const o of oracle) {
  console.log(`   ${o.label.padEnd(26)} ${o.threw === null
    ? `-> ${o.typeOut} len=${o.len} commentBytesSurvive=${o.commentSurvives} ${JSON.stringify(o.head)}`
    : `THREW ${o.threw}`}`);
}
console.log('');
console.log('B. CALL SITES');
const byBucket = new Map();
for (const s of sites) byBucket.set(s.bucket, [...(byBucket.get(s.bucket) ?? []), s]);
const bucketNames = [...byBucket.keys()].sort();
for (const b of bucketNames) {
  const members = byBucket.get(b);
  console.log(`   ${String(members.length).padStart(3)}  ${b}`);
  if (b.startsWith('BUFFER') || b.startsWith('UNMODELLED') || b === 'UNBALANCED') {
    for (const m of members) console.log(`          ${m.f}:${m.line}  ${m.why}`);
  }
}
console.log('');
console.log(`   call sites: ${sites.length}   ·   files that IMPORT stripSource: ${importers.length}`);
console.log(`   (an import is not a call site — his §3 figure is an importer count, not this)`);
console.log(`   buckets sum to the population: ${bucketNames.reduce((n, b) => n + byBucket.get(b).length, 0)} === ${sites.length}`);

console.log('');
console.log('KP / KN BUNDLE (graded before the figure above is allowed to stand)');
for (const r of kpRows) console.log(`   ${r.ok ? 'ok ' : 'BAD'}  want ${r.want.padEnd(44)} got ${r.got}   ${r.src}`);
for (const r of knRows) console.log(`   ${r.ok ? 'ok ' : 'BAD'}  invisible through the ${r.stage.padEnd(14)} ${JSON.stringify(r.src)}`);

const nBuffer = (byBucket.get('BUFFER:readFileSync-no-encoding') ?? []).length;
const nUnmodelled = bucketNames.filter((b) => b.startsWith('UNMODELLED'))
  .reduce((n, b) => n + byBucket.get(b).length, 0);

const GATE = [
  ['every KP row classifies as declared', kpRows.every((r) => r.ok)],
  ['both KN stages are invisible (comment-blind AND string-blind, separately)', knRows.every((r) => r.ok)],
  ['stripSource preserved length on every file it read', lengthFailures === 0],
  ['the population is non-empty', POP.length > 0],
  ['at least one call site was found (so a zero BUFFER count is not a zero-site artifact)', sites.length > 0],
  ['the buckets sum to the call-site count', bucketNames.reduce((n, b) => n + byBucket.get(b).length, 0) === sites.length],
  ['the control oracle row (a real string) does NOT leak its comment body',
    oracle[oracle.length - 1].commentSurvives === false],
];
console.log('');
console.log('GATE');
let red = 0;
for (const [name, ok] of GATE) {
  console.log(`  ${ok === true ? 'ok ' : 'RED'}  ${name}`);
  if (ok !== true) red += 1;
}
console.log('');
console.log(`census2 verdict: ${red === 0 ? 'ok' : `RED (${red})`}`
  + ` · ${sites.length} call site(s) · BUFFER-hazard ${nBuffer} · UNMODELLED ${nUnmodelled}`);
if (red !== 0) process.exitCode = 1;
