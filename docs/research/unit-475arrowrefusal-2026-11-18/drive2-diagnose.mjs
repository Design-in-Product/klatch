/**
 * Two diagnoses the arm's buckets raised but did not answer. Read-only.
 *
 * 1. `no-body-brace-after-the-parameter-list` is 967 — nearly twice the class this unit is about,
 *    and the module's declared limits do not mention it. Print heads to find out what they ARE.
 * 2. `arrow-then-other` (288) is the bucket the arm calls ambiguous. A function type's arrow is
 *    ALWAYS preceded by `)` (TS has no unparenthesised function-type parameter list), so a depth-0
 *    `=>` whose previous non-space character is not `)` cannot be a type's. Sub-split on that.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { declHeads, declBodyAt } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';
import { classifyAnnotation } from './region-key.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);
const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean).filter((f) => EXTS.has(extname(f)));

const noBrace = [];
const ambiguous = [];
for (const rel of tracked) {
  let src;
  try { src = readFileSync(resolve(ROOT, rel), 'utf8'); } catch { continue; }
  const code = stripSource(src, true);
  for (const h of declHeads(src)) {
    const b = declBodyAt(src, h.parenOpen, { isArrow: h.isArrow });
    if (b.kind !== 'refused') continue;
    const line = src.slice(0, h.headStart).split('\n').length;
    const text = src.slice(h.headStart).split('\n')[0].trim();
    if (b.reason === 'no-body-brace-after-the-parameter-list') noBrace.push({ rel, line, text });
    if (b.reason === 'return-type-annotation-on-an-arrow-declaration') {
      const cls = classifyAnnotation(code, b.parenClose);
      if (cls.bucket !== 'arrow-then-other') continue;
      let p = cls.arrowAt - 1;
      while (p >= 0 && /\s/.test(code[p])) p--;
      ambiguous.push({ rel, line, text, prev: code[p] ?? '\0' });
    }
  }
}

console.log(`1. no-body-brace-after-the-parameter-list: ${noBrace.length} sites. First 10 heads:`);
for (const s of noBrace.slice(0, 10)) console.log(`      ${s.rel}:${s.line}  ${s.text.slice(0, 96)}`);

const byPrev = new Map();
for (const a of ambiguous) byPrev.set(a.prev, (byPrev.get(a.prev) ?? 0) + 1);
console.log(`\n2. arrow-then-other: ${ambiguous.length} sites, by the character before the depth-0 arrow:`);
for (const [c, n] of [...byPrev].sort((a, b) => b[1] - a[1])) {
  console.log(`      prev ${JSON.stringify(c)}: ${n}${c === ')' ? '   <- genuinely ambiguous' : '   <- cannot be a function type'}`);
  for (const s of ambiguous.filter((a) => a.prev === c).slice(0, 2)) {
    console.log(`          ${s.rel}:${s.line}  ${s.text.slice(0, 96)}`);
  }
}
const nonParen = ambiguous.filter((a) => a.prev !== ')').length;
console.log(`\n  of ${ambiguous.length}: ${nonParen} not preceded by \`)\` · ${ambiguous.length - nonParen} preceded by \`)\``);
