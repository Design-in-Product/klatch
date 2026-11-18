/**
 * unit-475arrowrefusal arm A — is `decl-body.mjs`'s arrow return-type refusal keyed on the class or
 * on the ambiguity?
 *
 * Usage:
 *   node docs/research/unit-475arrowrefusal-2026-11-18/arm-arrowrefusal-a.mjs [--baseline-write]
 *
 * Driven from the repo root. `--baseline-write` records every `block` span over the tracked tree to
 * `block-spans.baseline.json` for P4; without it, that file (if present) is read back and diffed,
 * which is the only leg that can see a narrowing that MOVED an existing span.
 *
 * The region key below is deliberately CONSERVATIVE: it does not track `<`/`>` as brackets, so an
 * arrow inside a generic type argument (`Map<string, () => void>`) is counted at depth 0 and the
 * site is classified AMBIGUOUS. The failure direction is over-reporting ambiguity, never
 * under-reporting it — a narrowing whose key errs toward 'resolve it anyway' would re-introduce the
 * silent wrong span this module exists to cure.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { declHeads, declBodyAt, braceSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);
const WRITE_BASELINE = process.argv.includes('--baseline-write');
const BASELINE = resolve(HERE, 'block-spans.baseline.json');

let fails = 0;
const check = (/** @type {string} */ label, /** @type {boolean} */ ok, /** @type {string} */ note) => {
  console.log(`  ${ok ? 'green' : 'RED  '}  ${label}${note ? ` — ${note}` : ''}`);
  if (!ok) fails++;
};

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((f) => EXTS.has(extname(f)));

/* ------------------------------------------------------------------ the key */

const TYPE_CONTINUATION = /[|&[,>)]/;

/**
 * Classify the annotation region of a declaration whose parameter list closes at `parenClose`.
 * Returns one of the named buckets below — every path returns an explicit bucket and there is no
 * fall-through `else`, because a terminal bucket reached by fall-through absorbs every blindness the
 * scan has (this seat's own lesson, filed 11/17 against exactly this shape).
 *
 *   'no-annotation'          the `)` is not followed by `:` — not in the class at all
 *   'arrow-then-brace'       first depth-0 `=>` is immediately followed by the body `{` → RESOLVABLE
 *   'type-literal-then-body' a `{…}` in the annotation was a type literal, and a later arrow's `{`
 *                            is the body → RESOLVABLE
 *   'arrow-then-other'       first depth-0 `=>` is followed by something that is not `{` (a concise
 *                            body, or a function-type annotation) → AMBIGUOUS, stays refused
 *   'semicolon-at-depth-0'   an overload/ambient declaration — no body to find
 *   'no-depth-0-arrow'       the region never reaches a depth-0 `=>` (a `function` declaration's
 *                            shape; for an arrow this would mean a head we mis-matched)
 *   'unbalanced'             a bracket or brace in the region never closes
 */
export const classifyAnnotation = (/** @type {string} */ code, /** @type {number} */ parenClose) => {
  let i = parenClose + 1;
  while (i < code.length && /\s/.test(code[i])) i++;
  if (code[i] !== ':') return { bucket: 'no-annotation', arrowAt: -1, bodyAt: -1 };

  let j = i + 1;
  let depth = 0;
  let hoppedTypeLiteral = false;
  while (j < code.length) {
    const c = code[j];
    // `=>` is read as ONE token. The existing non-arrow scan in decl-body.mjs decrements its depth
    // on this `>` (`:220`), which is P3.
    if (c === '=' && code[j + 1] === '>') {
      if (depth === 0) {
        let k = j + 2;
        while (k < code.length && /\s/.test(code[k])) k++;
        if (code[k] === '{') {
          // Is this `{` the body, or an object type returned by a function-type annotation?
          const end = braceSpanEnd(code, k);
          if (end === -1) return { bucket: 'unbalanced', arrowAt: j, bodyAt: -1 };
          let k2 = end + 1;
          while (k2 < code.length && /\s/.test(code[k2])) k2++;
          const afterIsArrow = code[k2] === '=' && code[k2 + 1] === '>';
          if (afterIsArrow || TYPE_CONTINUATION.test(code[k2] ?? '')) {
            hoppedTypeLiteral = true;
            j = end + 1;
            continue;
          }
          return {
            bucket: hoppedTypeLiteral ? 'type-literal-then-body' : 'arrow-then-brace',
            arrowAt: j, bodyAt: k,
          };
        }
        return { bucket: 'arrow-then-other', arrowAt: j, bodyAt: -1 };
      }
      j += 2;
      continue;
    }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === '{') {
      // A body cannot precede the arrow's own `=>`, so a `{` reached first is in the annotation.
      const end = braceSpanEnd(code, j);
      if (end === -1) return { bucket: 'unbalanced', arrowAt: -1, bodyAt: -1 };
      if (depth === 0) hoppedTypeLiteral = true;
      j = end + 1;
      continue;
    }
    else if (c === ';' && depth === 0) return { bucket: 'semicolon-at-depth-0', arrowAt: -1, bodyAt: -1 };
    j++;
  }
  return { bucket: 'no-depth-0-arrow', arrowAt: -1, bodyAt: -1 };
};

/* ----------------------------------------------- A1: the refusal census (P1) */

console.log(`A1 — P1: kinds and refusal reasons over ${tracked.length} tracked files`);

const kinds = new Map();
const reasons = new Map();
const blockSpans = [];
/** @type {{file: string, name: string, parenClose: number, line: number}[]} */
const arrowRefused = [];

for (const rel of tracked) {
  let src;
  try { src = readFileSync(resolve(ROOT, rel), 'utf8'); } catch { continue; }
  const code = stripSource(src, true);
  for (const h of declHeads(src)) {
    const b = declBodyAt(src, h.parenOpen, { isArrow: h.isArrow });
    kinds.set(b.kind, (kinds.get(b.kind) ?? 0) + 1);
    if (b.kind === 'refused') reasons.set(b.reason, (reasons.get(b.reason) ?? 0) + 1);
    if (b.kind === 'block') {
      blockSpans.push({ f: rel, n: h.name, s: b.bodyStart, e: b.bodyEnd });
    }
    if (b.kind === 'refused' && b.reason === 'return-type-annotation-on-an-arrow-declaration') {
      arrowRefused.push({
        file: rel, name: h.name, parenClose: b.parenClose,
        line: src.slice(0, h.headStart).split('\n').length,
      });
    }
  }
  void code;
}

for (const [k, n] of [...kinds].sort((a, b) => b[1] - a[1])) console.log(`      kind ${k}: ${n}`);
for (const [r, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`      reason ${r}: ${n}`);

const refusedTotal = kinds.get('refused') ?? 0;
const classTotal = reasons.get('return-type-annotation-on-an-arrow-declaration') ?? 0;
const share = refusedTotal === 0 ? 0 : classTotal / refusedTotal;
console.log(`\n  class ${classTotal} of ${refusedTotal} refusals = ${(share * 100).toFixed(1)}%`);
check('A1a the class is a non-empty population (a zero would make every leg below vacuous)',
  classTotal > 0, `class=${classTotal}`);
check('A1b P1 HIT: the class is > 50% of all refusals', share > 0.5,
  `${classTotal}/${refusedTotal} = ${(share * 100).toFixed(1)}%`);
check('A1c the collected class list is the same size as the counter says',
  arrowRefused.length === classTotal, `list=${arrowRefused.length} counter=${classTotal}`);

/* --------------------------------------- A2: how much of the class is sound (P2) */

console.log(`\nA2 — P2: the ${arrowRefused.length} class members under the region key`);

const buckets = new Map();
const srcCache = new Map();
const codeFor = (/** @type {string} */ rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, stripSource(readFileSync(resolve(ROOT, rel), 'utf8'), true));
  return srcCache.get(rel);
};
/** @type {Record<string, {file:string,name:string,line:number}[]>} */
const samples = {};
for (const m of arrowRefused) {
  const { bucket } = classifyAnnotation(codeFor(m.file), m.parenClose);
  buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  (samples[bucket] ??= []).push({ file: m.file, name: m.name, line: m.line });
}
for (const [b, n] of [...buckets].sort((a, b2) => b2[1] - a[1])) {
  console.log(`      bucket ${b}: ${n}`);
  for (const s of (samples[b] ?? []).slice(0, 3)) console.log(`          e.g. ${s.file}:${s.line} ${s.name}`);
}

const bucketSum = [...buckets.values()].reduce((a, b) => a + b, 0);
check('A2a every class member landed in exactly one named bucket (no silent drop)',
  bucketSum === arrowRefused.length, `sum=${bucketSum} class=${arrowRefused.length}`);
check('A2b no class member is `no-annotation` (it would mean the reason string and the region key disagree)',
  (buckets.get('no-annotation') ?? 0) === 0, `no-annotation=${buckets.get('no-annotation') ?? 0}`);

const resolvable = (buckets.get('arrow-then-brace') ?? 0) + (buckets.get('type-literal-then-body') ?? 0);
const rShare = arrowRefused.length === 0 ? 0 : resolvable / arrowRefused.length;
console.log(`\n  resolvable ${resolvable} of ${arrowRefused.length} = ${(rShare * 100).toFixed(1)}%`);
check('A2c P2 HIT: >= 60% of the class is unambiguous under the conservative key', rShare >= 0.6,
  `${resolvable}/${arrowRefused.length} = ${(rShare * 100).toFixed(1)}%`);

/* --------------------------------------------------- A3: KP-A, sliced not typed */

console.log('\nA3 — KP-A: a plain annotation, SLICED from a tracked file');

const kpA = arrowRefused.find((m) => classifyAnnotation(codeFor(m.file), m.parenClose).bucket === 'arrow-then-brace');
if (!kpA) {
  check('A3a a live plain-annotation member exists to slice', false, 'none found');
} else {
  const src = readFileSync(resolve(ROOT, kpA.file), 'utf8');
  const heads = declHeads(src).filter((h) => h.name === kpA.name);
  const head = heads.find((h) => declBodyAt(src, h.parenOpen, { isArrow: h.isArrow }).parenClose === kpA.parenClose);
  const b = head ? declBodyAt(src, head.parenOpen, { isArrow: head.isArrow }) : null;
  const headText = head ? src.slice(head.headStart, kpA.parenClose + 40).split('\n')[0] : '(not relocated)';
  console.log(`      KP-A = ${kpA.file}:${kpA.line} ${kpA.name}`);
  console.log(`      head: ${headText.trim()}`);
  check('A3a KP-A is refused at HEAD with the class reason (the before half of the KP)',
    b?.kind === 'refused' && b?.reason === 'return-type-annotation-on-an-arrow-declaration',
    `kind=${b?.kind} reason=${b?.reason}`);
  const cls = classifyAnnotation(codeFor(kpA.file), kpA.parenClose);
  const code = codeFor(kpA.file);
  check('A3b KP-A carries NO depth-0 `=>` before its body (it is the unambiguous form)',
    cls.bucket === 'arrow-then-brace' && code[cls.bodyAt] === '{',
    `bucket=${cls.bucket} char-at-bodyAt=${JSON.stringify(code[cls.bodyAt] ?? null)}`);
  const end = cls.bodyAt === -1 ? -1 : braceSpanEnd(code, cls.bodyAt);
  check('A3c the body the region key points at is brace-balanced (the span a cure would return)',
    end > cls.bodyAt, `bodyAt=${cls.bodyAt} end=${end}`);
}

/* ------------------------------------- A4: KP-B, the genuinely ambiguous form (P5) */

console.log('\nA4 — KP-B: the function-type return annotation on an arrow');

const KPB = 'const kpb = (a: string): (b: number) => void => { return; };\n';
const liveKPB = arrowRefused.filter((m) => {
  const cls = classifyAnnotation(codeFor(m.file), m.parenClose);
  return cls.bucket === 'arrow-then-other';
});
console.log(`      live members in the ambiguous bucket: ${liveKPB.length}`
  + (liveKPB.length ? ` (e.g. ${liveKPB[0].file}:${liveKPB[0].line} ${liveKPB[0].name})` : ''));
console.log('      KP-B itself is SYNTHETIC (typed here, labelled as such): ' + KPB.trim());
const kpbHead = declHeads(KPB)[0];
const kpbRes = kpbHead ? declBodyAt(KPB, kpbHead.parenOpen, { isArrow: kpbHead.isArrow }) : null;
check('A4a KP-B is matched as a head at all (a head miss would make A4b vacuous)',
  kpbHead !== undefined && kpbHead.isArrow === true, `head=${kpbHead?.name} isArrow=${kpbHead?.isArrow}`);
check('A4b P5: KP-B is REFUSED (resolving it to concise is the silent-under-report harm)',
  kpbRes?.kind === 'refused', `kind=${kpbRes?.kind} reason=${kpbRes?.reason}`);
const kpbCls = classifyAnnotation(stripSource(KPB, true), kpbRes?.parenClose ?? -1);
check('A4c the region key calls KP-B ambiguous, so a cure keyed on it leaves KP-B refused',
  kpbCls.bucket === 'arrow-then-other', `bucket=${kpbCls.bucket}`);

/* ------------------------- A5: KP-C, the `>` of `=>` in the EXISTING scan (P3) */

console.log('\nA5 — KP-C / P3: a `function` declaration with a function-type return annotation');

const KPC = 'function kpc(a: number): (b: number) => void {\n  return () => {};\n}\n';
const kpcHead = declHeads(KPC)[0];
const kpcRes = kpcHead ? declBodyAt(KPC, kpcHead.parenOpen, { isArrow: kpcHead.isArrow }) : null;
console.log(`      KP-C is SYNTHETIC unless a live site is named below: ${KPC.split('\n')[0]}`);
console.log(`      HEAD verdict: kind=${kpcRes?.kind} reason=${kpcRes?.reason ?? 'null'}`);
check('A5a KP-C is matched as a NON-arrow head (the scan under test is the function-declaration one)',
  kpcHead !== undefined && kpcHead.isArrow === false, `isArrow=${kpcHead?.isArrow}`);
check('A5b P3 HIT at HEAD: the form refuses as `no-body-brace-after-the-return-type`',
  kpcRes?.kind === 'refused' && kpcRes?.reason === 'no-body-brace-after-the-return-type',
  `kind=${kpcRes?.kind} reason=${kpcRes?.reason}`);
const kpcCls = classifyAnnotation(stripSource(KPC, true), kpcRes?.parenClose ?? -1);
check('A5c the region key finds the body KP-C has (so the refusal is the scan, not the source)',
  kpcCls.bucket === 'arrow-then-brace' || kpcCls.bucket === 'type-literal-then-body',
  `bucket=${kpcCls.bucket}`);
const liveKPC = [];
for (const rel of tracked) {
  let src;
  try { src = readFileSync(resolve(ROOT, rel), 'utf8'); } catch { continue; }
  for (const h of declHeads(src)) {
    if (h.isArrow) continue;
    const b = declBodyAt(src, h.parenOpen, { isArrow: false });
    if (b.kind === 'refused' && b.reason === 'no-body-brace-after-the-return-type') {
      liveKPC.push(`${rel}:${src.slice(0, h.headStart).split('\n').length} ${h.name}`);
    }
  }
}
console.log(`      live function-declaration sites refused that way: ${liveKPC.length}`);
for (const s of liveKPC.slice(0, 8)) console.log(`          ${s}`);

/* ---------------------------------------- A6: P4, the pre-action span baseline */

console.log(`\nA6 — P4: block spans over the tracked tree (${blockSpans.length} spans)`);
const key = (/** @type {{f:string,n:string,s:number,e:number}} */ b) => `${b.f}|${b.n}|${b.s}|${b.e}`;
if (WRITE_BASELINE) {
  writeFileSync(BASELINE, JSON.stringify(blockSpans.map(key).sort(), null, 0) + '\n');
  console.log(`      baseline WRITTEN: ${blockSpans.length} spans → ${BASELINE}`);
  check('A6a the baseline is non-empty (an empty one would make the P4 diff vacuous)',
    blockSpans.length > 0, `spans=${blockSpans.length}`);
} else if (existsSync(BASELINE)) {
  const before = new Set(JSON.parse(readFileSync(BASELINE, 'utf8')));
  const now = new Set(blockSpans.map(key));
  const lost = [...before].filter((k) => !now.has(k));
  const gained = [...now].filter((k) => !before.has(k));
  console.log(`      baseline ${before.size} spans · now ${now.size} · lost ${lost.length} · gained ${gained.length}`);
  for (const l of lost.slice(0, 10)) console.log(`          LOST   ${l}`);
  for (const g of gained.slice(0, 6)) console.log(`          gained ${g}`);
  check('A6a the baseline is non-empty', before.size > 0, `baseline=${before.size}`);
  check('A6b P4 HIT: every span that resolved before resolves to the IDENTICAL bytes now',
    lost.length === 0, `lost=${lost.length}`);
} else {
  check('A6a a baseline exists to diff against (run --baseline-write at HEAD first)', false,
    `missing ${BASELINE}`);
}

console.log(`\n${fails === 0 ? 'ARM A GREEN' : `ARM A RED — ${fails} leg(s)`}`);
process.exit(fails === 0 ? 0 : 1);
