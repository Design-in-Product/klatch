/**
 * unit-523indirectsize — post-hoc. UNREGISTERED; every leg here is labelled as such.
 *
 * The arm's drive (`captures/ARM.out`, KP 13 of 13, `.err` 0 B) raised five questions the
 * registration did not ask, and all five are against the arm:
 *
 *   PH1  RECEIVER-UNKEYED's 7 live members contain ZERO of the bracket receivers KP11 planted.
 *        Six read `receiver=return out` and one reads `receiver=` (empty). Both are the arm's own
 *        reader defects, absorbed by a fall-through cell whose reachability KP11 had just proved.
 *        Re-keyed here with both defects cured, and the delta published.
 *   PH2  The CEILING on the narrowed hazard. `UNRESOLVED ∧ INVARIANCE` is 5 and
 *        `OTHER-BOUND ∧ INVARIANCE` is 1 — six invariance claims whose receiver this key did not
 *        resolve to a collection kind. Their origins are printed so the ceiling is readable.
 *   PH3  The FLOOR under P20's zero. `BOUND-UNCOMPARED` is 11 — a size bound to a name that is
 *        never compared to a LITERAL. L3/L4 say nothing about a comparison to a variable.
 *   PH4  Does the cured receiver walk move the deliverable figure of 4?
 *   PH5  SELF-INCLUSION. This unit's own files are in this unit's population, because the arm was
 *        committed before it was driven. Measured, not waved at.
 *
 * No figure in `RESULTS.md` is taken from this file unless this file prints it.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();

const NEEDLE = 'new Set(';
const GUARD_PREDS = ['!= null', '!== null', '!== undefined', '!= undefined', 'Number.isFinite(', 'Boolean('];
const TAIL = /^\s*\.size\s*(===|==|!==|!=|>=|<=|>|<)\s*(\d+)/;
const SIZE_CMP = /\.size\s*(?:===|==|!==|!=|>=|<=|>|<)\s*\d+/g;
const SIZE_CMP_PARTS = /\.size\s*(===|==|!==|!=|>=|<=|>|<)\s*(\d+)/;
const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];
const CHANGE = [['>', 1], ['>=', 2], ['!==', 1], ['!=', 1]];
const EMPTY = [['===', 0], ['==', 0], ['!==', 0], ['!=', 0], ['>', 0], ['>=', 1]];
const inTab = (t, op, n) => t.some(([o, k]) => o === op && k === n);
const direction = (op, n) => {
  if (inTab(INVARIANCE, op, n)) return 'INVARIANCE';
  if (inTab(CHANGE, op, n)) return 'CHANGE';
  if (inTab(EMPTY, op, n)) return 'EMPTY';
  return 'OTHER-N';
};
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const IDENT = /[A-Za-z0-9_$.]/;
const matchBack = (code, close) => {
  const pairs = { ')': '(', ']': '[' };
  const open = pairs[code[close]];
  if (!open) return -1;
  let depth = 0;
  for (let i = close; i >= 0; i--) {
    if (code[i] === code[close]) depth++;
    else if (code[i] === open) { depth--; if (depth === 0) return i; }
  }
  return -1;
};

/**
 * PH1's CURED receiver walk, differing from the arm's in exactly two places, both named:
 *   (a) the backward walk stops at whitespace that separates two identifier runs, so a preceding
 *       KEYWORD is no longer absorbed into the receiver (`return out` → `out`);
 *   (b) a TypeScript non-null assertion `!` immediately before `.size` is skipped rather than
 *       breaking the walk (`mOwn.get(k)!.size` → `mOwn.get(k)`).
 * Nothing else moves. `cured` is reported next to the arm's reading, never in place of it.
 */
function receiverSpanCured(code, dot) {
  let i = dot - 1;
  let sawParen = false;
  let sawBracket = false;
  let sawBang = false;
  if (code[i] === '!') { sawBang = true; i--; }           // (b)
  let consumedIdentRun = false;
  for (;;) {
    let j = i;
    while (j >= 0 && /\s/.test(code[j])) j--;
    const crossedSpace = j !== i;
    if (j < 0) { i = j; break; }
    const c = code[j];
    if (c === ')' || c === ']') {
      if (crossedSpace && consumedIdentRun) break;        // (a): `foo (bar).size` is not a chain
      const open = matchBack(code, j);
      if (open === -1) { i = j; break; }
      if (c === ')') sawParen = true; else sawBracket = true;
      i = open - 1;
      continue;
    }
    if (IDENT.test(c)) {
      if (crossedSpace && consumedIdentRun) break;        // (a): the keyword cure
      i = j;
      while (i >= 0 && IDENT.test(code[i])) i--;
      consumedIdentRun = true;
      continue;
    }
    break;
  }
  let start = i + 1;
  while (start < dot && /\s/.test(code[start])) start++;
  const before = code.slice(Math.max(0, start - 8), start);
  const mNew = /\bnew\s*$/.exec(before);
  if (mNew) start = Math.max(0, start - 8) + mNew.index;
  let text = code.slice(start, dot);
  if (sawBang) text = text.replace(/!$/, '');
  return { start, text, sawParen, sawBracket, sawBang };
}

function bindingOf(code, name) {
  const re = new RegExp(
    `^[ \\t]*(?:export\\s+)?(?:const|let|var)\\s+${name.replace(/[$]/g, '\\$')}\\s*(?::[^=\\n]*)?=\\s*(.*)$`,
    'm',
  );
  const m = re.exec(code);
  return m ? { rhs: m[1], line: lineOf(code, m.index) } : null;
}

function setTailIndices(code) {
  const tails = new Set();
  let i = 0;
  while ((i = code.indexOf(NEEDLE, i)) !== -1) {
    const open = i + NEEDLE.length - 1;
    const end = parenSpanEnd(code, open);
    if (end !== -1) {
      const after = code.slice(end + 1);
      const ws = after.length - after.trimStart().length;
      tails.add(end + 1 + ws);
      i = end + 1;
    } else i += NEEDLE.length;
  }
  return tails;
}

/** The arm's class key, parameterised on which receiver walk it is given. */
function keyWith(walk, code, raw, path, m) {
  const parts = SIZE_CMP_PARTS.exec(code.slice(m.index, m.index + m[0].length + 2));
  const dir = parts ? direction(parts[1], Number(parts[2])) : 'OTHER-N';
  const rec = walk(code, m.index);
  const t = rec.text.trim();
  let cls;
  let argSpan = null;
  let bindLine = null;
  if (/^new\s+Set\s*\([\s\S]*\)$/.test(t)) { cls = 'SET-TAIL-DIRECT'; argSpan = t; }
  else if (rec.sawParen && t.includes(NEEDLE)) { cls = 'SET-EXPR'; argSpan = t; }
  else if (rec.sawParen && t.includes('new Map(')) cls = 'MAP-EXPR';
  else if (rec.sawBracket) cls = 'RECEIVER-UNKEYED';
  else if (/^[A-Za-z_$][\w$]*$/.test(t)) {
    const b = bindingOf(code, t);
    if (b === null) cls = 'UNRESOLVED';
    else {
      bindLine = b.line;
      if (b.rhs.includes(NEEDLE)) { cls = 'SET-BOUND'; argSpan = b.rhs; }
      else if (b.rhs.includes('new Map(')) cls = 'MAP-BOUND';
      else cls = 'OTHER-BOUND';
    }
  } else if (/\./.test(t) && !rec.sawParen) cls = 'PROPERTY';
  else if (rec.sawParen) cls = 'CALL';
  else cls = 'RECEIVER-UNKEYED';
  const guard = (cls === 'SET-BOUND' || cls === 'SET-EXPR')
    ? (GUARD_PREDS.some((p) => (argSpan || '').includes(p)) ? 'GUARDED' : 'BLIND') : null;
  const line = lineOf(code, m.index);
  return { path, line, cls, dir, guard, bindLine, receiver: t, whole: raw.split('\n')[line - 1] };
}

// the arm's own walk, re-implemented here verbatim so both readings run in one process
function receiverSpanArm(code, dot) {
  let i = dot - 1;
  let sawParen = false;
  let sawBracket = false;
  for (;;) {
    while (i >= 0 && /\s/.test(code[i])) i--;
    if (i < 0) break;
    const c = code[i];
    if (c === ')' || c === ']') {
      const open = matchBack(code, i);
      if (open === -1) break;
      if (c === ')') sawParen = true; else sawBracket = true;
      i = open - 1;
      continue;
    }
    if (IDENT.test(c)) { while (i >= 0 && IDENT.test(code[i])) i--; continue; }
    break;
  }
  let start = i + 1;
  while (start < dot && /\s/.test(code[start])) start++;
  const before = code.slice(Math.max(0, start - 8), start);
  const mNew = /\bnew\s*$/.exec(before);
  if (mNew) start = Math.max(0, start - 8) + mNew.index;
  return { start, text: code.slice(start, dot), sawParen, sawBracket };
}

// ─── population ─────────────────────────────────────────────────────────────────────────────────
const CODE_EXT = /\.(mjs|mts|js|ts|cjs)$/;
const tracked = sh('git ls-files').split('\n').filter(Boolean);
const corpus = tracked.filter(
  (p) => CODE_EXT.test(p) && (p.startsWith('scripts/') || p.startsWith('docs/research/')),
);
const read = (p) => { try { return readFileSync(`${ROOT}${p}`, 'utf8'); } catch { return null; } };

const armSites = [];
const curedSites = [];
const excludedTailPaths = [];
for (const p of corpus) {
  const raw = read(p);
  if (raw === null) continue;
  const code = stripSource(raw, true);
  const tails = setTailIndices(code);
  for (const m of code.matchAll(SIZE_CMP)) {
    if (tails.has(m.index)) { excludedTailPaths.push(p); continue; }
    armSites.push(keyWith(receiverSpanArm, code, raw, p, m));
    curedSites.push(keyWith(receiverSpanCured, code, raw, p, m));
  }
}

const tally = (xs, k) => xs.reduce((m, x) => { m[x[k]] = (m[x[k]] || 0) + 1; return m; }, {});
const pad = (s, n) => String(s).padEnd(n);
const ORDER = ['SET-BOUND', 'SET-EXPR', 'MAP-BOUND', 'MAP-EXPR', 'OTHER-BOUND', 'UNRESOLVED', 'PROPERTY', 'CALL', 'RECEIVER-UNKEYED', 'SET-TAIL-DIRECT'];

console.log('unit-523indirectsize — post-hoc (UNREGISTERED)');
console.log(`SHA ${SHA} · clock ${CLOCK} · corpus ${corpus.length} files · population ${armSites.length}`);
console.log('');

// ─── PH1 ────────────────────────────────────────────────────────────────────────────────────────
console.log('─── PH1  RECEIVER-UNKEYED: what is actually in the fall-through cell ───────────');
const unk = armSites.filter((s) => s.cls === 'RECEIVER-UNKEYED');
console.log(`  arm's RECEIVER-UNKEYED: ${unk.length}`);
const KW = /^(return|typeof|await|delete|void|yield|in|of|case|else|new)\s/;
let kwAbsorbed = 0;
let emptyReceiver = 0;
let realBracket = 0;
for (const s of unk) {
  const kind = KW.test(s.receiver) ? 'KEYWORD-ABSORBED'
    : s.receiver === '' ? 'EMPTY-RECEIVER(TS `!`)'
      : /\[/.test(s.receiver) ? 'REAL-BRACKET-RECEIVER' : 'OTHER';
  if (kind === 'KEYWORD-ABSORBED') kwAbsorbed += 1;
  if (kind.startsWith('EMPTY')) emptyReceiver += 1;
  if (kind === 'REAL-BRACKET-RECEIVER') realBracket += 1;
  console.log(`    ${kind}  ${s.path}:${s.line}  receiver="${s.receiver}"`);
  console.log(`      ${s.whole}`);
}
console.log(`  KEYWORD-ABSORBED ${kwAbsorbed} · EMPTY-RECEIVER ${emptyReceiver} · REAL-BRACKET-RECEIVER ${realBracket}`);
console.log(`  >>> the bracket receiver KP11 planted has ${realBracket} live members in this corpus.`);
console.log('');
console.log('  the two readings, side by side:');
const armT = tally(armSites, 'cls');
const curT = tally(curedSites, 'cls');
for (const k of ORDER) {
  const a = armT[k] || 0;
  const c = curT[k] || 0;
  console.log(`    ${pad(k, 20)} arm ${pad(a, 5)} cured ${pad(c, 5)} ${a === c ? '' : `DELTA ${c - a > 0 ? '+' : ''}${c - a}`}`);
}
let moved = 0;
for (let i = 0; i < armSites.length; i++) if (armSites[i].cls !== curedSites[i].cls) moved += 1;
console.log(`  sites whose class MOVED under the cured walk: ${moved} of ${armSites.length}`);
for (let i = 0; i < armSites.length; i++) {
  if (armSites[i].cls === curedSites[i].cls) continue;
  console.log(`    ${armSites[i].path}:${armSites[i].line}  ${armSites[i].cls} -> ${curedSites[i].cls}  receiver "${armSites[i].receiver}" -> "${curedSites[i].receiver}"`);
}
console.log('');
const spaced = armSites.filter((s) => /\s/.test(s.receiver.trim()) && s.cls !== 'RECEIVER-UNKEYED');
console.log(`  arm sites with a SPACE inside the receiver but NOT in RECEIVER-UNKEYED (the defect leaking into a keyed cell): ${spaced.length}`);
for (const s of spaced) console.log(`    ${s.path}:${s.line}  [${s.cls}] receiver="${s.receiver}"`);
console.log('');

// ─── PH4 (reported here because it is one line off PH1's tables) ────────────────────────────────
const narrowArm = armSites.filter((s) => (s.cls === 'SET-BOUND' || s.cls === 'SET-EXPR') && s.dir === 'INVARIANCE');
const narrowCur = curedSites.filter((s) => (s.cls === 'SET-BOUND' || s.cls === 'SET-EXPR') && s.dir === 'INVARIANCE');
console.log('─── PH4  does the cured walk move the deliverable figure? ──────────────────────');
console.log(`  narrowed hazard — arm ${narrowArm.length} · cured ${narrowCur.length}`);
console.log(`  guard — arm ${JSON.stringify(tally(narrowArm, 'guard'))} · cured ${JSON.stringify(tally(narrowCur, 'guard'))}`);
console.log('');

// ─── PH2 ────────────────────────────────────────────────────────────────────────────────────────
console.log('─── PH2  the CEILING: invariance claims whose receiver kind was not resolved ───');
const ceil = curedSites.filter((s) => s.dir === 'INVARIANCE' && (s.cls === 'UNRESOLVED' || s.cls === 'OTHER-BOUND' || s.cls === 'PROPERTY' || s.cls === 'CALL' || s.cls === 'RECEIVER-UNKEYED'));
console.log(`  INVARIANCE sites outside SET-* and MAP-* (cured reading): ${ceil.length}`);
console.log(`  by class: ${JSON.stringify(tally(ceil, 'cls'))}`);
for (const s of ceil) {
  console.log(`    ${s.path}:${s.line}  [${s.cls}] receiver="${s.receiver}"`);
  console.log(`      site: ${s.whole}`);
  const raw = read(s.path);
  const code = raw === null ? '' : stripSource(raw, true);
  // every line in the file that mentions the receiver name and could be its origin
  const name = s.receiver.replace(/[.[\]()!]/g, ' ').trim().split(/\s+/)[0];
  const origins = [];
  if (name) {
    const re = new RegExp(`^.*\\b${name.replace(/[$]/g, '\\$')}\\b.*$`, 'gm');
    for (const om of code.matchAll(re)) {
      const t = om[0].trim();
      if (/(?:const|let|var|function|=>|\bof\b|\bin\b|\(|=)/.test(t) && !t.includes('.size')) {
        origins.push(`${lineOf(code, om.index)}: ${(raw.split('\n')[lineOf(code, om.index) - 1] || '').trim()}`);
      }
    }
  }
  for (const o of origins.slice(0, 6)) console.log(`      origin? ${o}`);
  if (origins.length > 6) console.log(`      (${origins.length - 6} further candidate origin lines not printed)`);
}
console.log('');
console.log(`  >>> CEILING on Set-size invariance claims = narrowed hazard ${narrowCur.length} + unresolved-kind ${ceil.length} = ${narrowCur.length + ceil.length}`);
console.log('');

// ─── PH3 ────────────────────────────────────────────────────────────────────────────────────────
console.log('─── PH3  the FLOOR under P20\'s zero: BOUND-UNCOMPARED ─────────────────────────');
const bSites = [];
for (const p of corpus) {
  const raw = read(p);
  if (raw === null) continue;
  const code = stripSource(raw, true);
  let i = 0;
  while ((i = code.indexOf(NEEDLE, i)) !== -1) {
    const open = i + NEEDLE.length - 1;
    const end = parenSpanEnd(code, open);
    if (end === -1) { i += NEEDLE.length; continue; }
    const tail = code.slice(end + 1, end + 41);
    if (!/^\s*\.size/.test(tail) || TAIL.test(tail)) { i = end + 1; continue; }
    const line = lineOf(code, i);
    const lineStart = code.lastIndexOf('\n', i) + 1;
    const prefix = code.slice(lineStart, i);
    const mBind = /(?:^|[;{(,]|\b)(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*$/.exec(prefix);
    if (!mBind) { i = end + 1; continue; }
    const name = mBind[1];
    const lit = new RegExp(`(?<![\\w$.])${name.replace(/[$]/g, '\\$')}\\s*(===|==|!==|!=|>=|<=|>|<)\\s*(\\d+)`).exec(code);
    const nonLit = new RegExp(`(?<![\\w$.])${name.replace(/[$]/g, '\\$')}\\s*(===|==|!==|!=|>=|<=|>|<)\\s*([A-Za-z_$][\\w$.]*)`).exec(code);
    bSites.push({
      path: p, line, name,
      litCmp: lit ? lit[0] : null,
      litDir: lit ? direction(lit[1], Number(lit[2])) : null,
      nonLitCmp: nonLit ? nonLit[0] : null,
      whole: raw.split('\n')[line - 1],
    });
    i = end + 1;
  }
}
const unc = bSites.filter((s) => s.litCmp === null);
console.log(`  BOUND sites: ${bSites.length} · BOUND-COMPARED (literal): ${bSites.length - unc.length} · BOUND-UNCOMPARED: ${unc.length}`);
let nonLitInv = 0;
for (const s of unc) {
  console.log(`    ${s.path}:${s.line}  name=${s.name}  non-literal comparison: ${s.nonLitCmp === null ? 'NONE FOUND' : `\`${s.nonLitCmp}\``}`);
  console.log(`      ${s.whole}`);
  if (s.nonLitCmp !== null) nonLitInv += 1;
}
console.log(`  of the ${unc.length} uncompared-to-a-literal, ${nonLitInv} ARE compared to a non-literal — L3/L4's region, outside every key in this unit.`);
console.log('  BOUND-COMPARED directions:');
console.log(`    ${JSON.stringify(tally(bSites.filter((s) => s.litCmp !== null), 'litDir'))}`);
console.log('');

// ─── PH5 ────────────────────────────────────────────────────────────────────────────────────────
console.log('─── PH5  SELF-INCLUSION: this unit in its own population ───────────────────────');
const SELF = 'docs/research/unit-523indirectsize-2026-11-26/';
const selfA = armSites.filter((s) => s.path.startsWith(SELF));
const selfB = bSites.filter((s) => s.path.startsWith(SELF));
const selfTails = excludedTailPaths.filter((p) => p.startsWith(SELF));
const selfFiles = corpus.filter((p) => p.startsWith(SELF));
console.log(`  this unit's own tracked code files in the corpus: ${selfFiles.length}`);
for (const p of selfFiles) console.log(`    ${p}`);
console.log(`  Arm A sites contributed by this unit: ${selfA.length}`);
for (const s of selfA) console.log(`    ${s.path}:${s.line} [${s.cls} ${s.dir}]  ${s.whole.trim()}`);
console.log(`  excluded direct tails contributed by this unit: ${selfTails.length}`);
console.log(`  Arm B BOUND sites contributed by this unit: ${selfB.length}`);
console.log('');
console.log(`  total excluded direct tails (whole corpus): ${excludedTailPaths.length}`);
const u522 = excludedTailPaths.filter((p) => p.includes('unit-522'));
console.log(`  of those, from unit-522 (landed after unit-521's SHA): ${u522.length}`);
console.log(`  unit-521 published 54 size-keyed sites over 850 files; this reading is ${excludedTailPaths.length} over ${corpus.length}.`);
console.log(`  delta ${excludedTailPaths.length - 54}, of which unit-522 ${u522.length} and this unit ${selfTails.length}.`);
