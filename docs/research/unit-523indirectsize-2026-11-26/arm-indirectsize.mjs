/**
 * unit-523indirectsize — the arm.
 *
 * Narrows the two residual bounds `unit-521setsizefalsegreen-2026-11-26` published and declined to
 * narrow:
 *
 *   - Arm A: the `INDIRECT` bound of **123** — every literal `.size <op> <n>` in the instrument
 *     corpus that is NOT the tail of a balanced `new Set(...)`. Keyed by resolving the RECEIVER, so
 *     a `Map` size and a bound-`Set` size stop being one number.
 *   - Arm B: the **95** `NO-COMPARISON` sites — `new Set(...).size` read with no immediate literal
 *     comparison. Keyed by what the size FLOWS INTO, so "an invariance claim one binding away" gets
 *     a count instead of a shrug.
 *
 * Pre-registration: `PRE-REGISTRATION.md`, clock `2026-11-26 13:19:02 PST`, population SHA
 * `7bd926a0cc71`, 854 instrument files. Addendum: `PRE-REGISTRATION-ADDENDUM-KP12.md`, written
 * before this arm was driven even once.
 *
 * ## No display field
 *
 * Every member line prints WHOLE. This seat registered a refuted prediction nine hours ago off its
 * own instrument's 150-character display field, with the cut falling on the deciding `.map(...)`.
 * An arm with no display field cannot be wrong about its display. The price is a long capture.
 *
 * ## Two readers are DEPENDENCIES
 *
 * `stripSource` (length-preserving) and `parenSpanEnd` come from `scripts/lib/`. Checked before
 * hand-rolling: `declHeads`/`bodyOf` do NOT cover `const X = new Set(` — `DECL_HEAD_SOURCE`'s
 * second alternative requires a `(` immediately after `=`, and `new Set(` has `new Set` in between.
 * So the BINDING reader below is this unit's own, declared as such in the registration, and it is
 * the only hand-rolled reader here.
 *
 * ## The docblock used to claim this arm was out of the brace-slicer gate's population. It was not.
 *
 * The first version of this file said "this walk compares against PARENS … so it is out of that
 * population by construction." **The pre-commit gate reddened it**: `enclosingOpener` carried
 * `c === '{'` and `c === '}'` to find statement boundaries, which is exactly the gate's key. The
 * claim was a copy of `unit-521`'s true sentence about a *different* reader, asserted about this
 * one without reading it. See `PRE-REGISTRATION-ADDENDUM-GATE-RED.md`, written before any drive.
 *
 * It is now true, by narrowing rather than by exemption: no character comparison against either
 * brace survives anywhere in this file. Interpolation context is detected with two **string**
 * searches (`lastIndexOf('${')` vs `lastIndexOf('}')`) and the depth walk counts parens and
 * brackets only. Neither the baseline nor a site marker was used — a marker would have claimed this
 * file's job is to reproduce the defect, and appending to the baseline would have moved the
 * standing figures every other seat's gate reads.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// ─── §0 ─────────────────────────────────────────────────────────────────────────────────────────
const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') {
  throw new Error(`§0: packages/ or scripts/ is dirty, so no figure here is attributable:\n${dirty}`);
}
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();

// ─── direction tables, verbatim from unit-521 so the two units' cells are comparable ────────────

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

const NEEDLE = 'new Set(';
const GUARD_PREDS = ['!= null', '!== null', '!== undefined', '!= undefined', 'Number.isFinite(', 'Boolean('];
const TAIL = /^\s*\.size\s*(===|==|!==|!=|>=|<=|>|<)\s*(\d+)/;
const SIZE_CMP = /\.size\s*(?:===|==|!==|!=|>=|<=|>|<)\s*\d+/g;
const SIZE_CMP_PARTS = /\.size\s*(===|==|!==|!=|>=|<=|>|<)\s*(\d+)/;

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const IDENT = /[A-Za-z0-9_$.]/;

/**
 * The index of the `(`/`[` matching the closer at `close`, or -1. Backward depth walk.
 * Parens and brackets only: `receiverSpan` is the only caller and never passes a brace, and a
 * brace entry here would be dead reach that still reads as a brace-balance slicer.
 */
const matchBack = (code, close) => {
  const pairs = { ')': '(', ']': '[' };
  const open = pairs[code[close]];
  if (!open) return -1;
  let depth = 0;
  for (let i = close; i >= 0; i--) {
    if (code[i] === code[close]) depth++;
    else if (code[i] === open) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
};

/**
 * The receiver span of the `.size` whose `.` is at `dot`: walk back over a chain of identifier
 * characters and balanced `)`/`]` groups, then absorb a preceding `new` keyword. Returns
 * `{ start, text, sawParen, sawBracket }`.
 */
function receiverSpan(code, dot) {
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
    if (IDENT.test(c)) {
      while (i >= 0 && IDENT.test(code[i])) i--;
      continue;
    }
    break;
  }
  let start = i + 1;
  while (start < dot && /\s/.test(code[start])) start++;
  // absorb a preceding `new` keyword so `new Set(x)` reads as one receiver rather than `Set(x)`
  const before = code.slice(Math.max(0, start - 8), start);
  const mNew = /\bnew\s*$/.exec(before);
  if (mNew) start = Math.max(0, start - 8) + mNew.index;
  return { start, text: code.slice(start, dot), sawParen, sawBracket };
}

/**
 * The first file-local binding line for `name`: `{ rhs, line }`, or null.
 * Hand-rolled, and declared as such — see the docblock. L2 of the registration: FIRST binding wins,
 * reassignment and shadowing are blind.
 */
function bindingOf(code, name) {
  const re = new RegExp(
    `^[ \\t]*(?:export\\s+)?(?:const|let|var)\\s+${name.replace(/[$]/g, '\\$')}\\s*(?::[^=\\n]*)?=\\s*(.*)$`,
    'm',
  );
  const m = re.exec(code);
  if (!m) return null;
  return { rhs: m[1], line: lineOf(code, m.index) };
}

/** Indices (post-whitespace) at which a balanced `new Set(...)` span's tail begins, per file. */
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

/**
 * Is `idx` inside a template-literal `${ … }` interpolation?
 *
 * Two STRING searches, no character comparison against a brace: the nearest preceding `${` is
 * after the nearest preceding `}` exactly when the site is inside an open interpolation.
 *
 * **L6, declared in the gate-red addendum:** an interpolation containing a `}` of its own before
 * the site (`${ {a: 1}.a + new Set(x).size }`) reads as NOT in an interpolation. Named, not cured.
 */
const inInterp = (code, idx) => code.lastIndexOf('${', idx) > code.lastIndexOf('}', idx);

/**
 * The nearest enclosing opener before `idx` that is still open: `'('`, `'['` or null.
 * One depth counter per bracket kind, stopping at a `;` reached at depth 0. Used by Arm B only.
 *
 * **Braces are not counted and not compared against** — see the docblock. The price is L7,
 * declared in the gate-red addendum: a statement brace no longer terminates the backward walk, so
 * an object-literal property value (`{ n: new Set(x).size }`) is keyed by whatever paren or
 * bracket encloses the literal, or `null` if none does.
 */
function enclosingOpener(code, idx) {
  let par = 0;
  let brk = 0;
  for (let i = idx - 1; i >= 0; i--) {
    const c = code[i];
    if (c === ')') par++;
    else if (c === ']') brk++;
    else if (c === '(') {
      if (par === 0) return '(';
      par--;
    } else if (c === '[') {
      if (brk === 0) return '[';
      brk--;
    } else if (c === ';' && par === 0 && brk === 0) return null;
  }
  return null;
}

// ─── population ─────────────────────────────────────────────────────────────────────────────────

const CODE_EXT = /\.(mjs|mts|js|ts|cjs)$/;
const tracked = sh('git ls-files').split('\n').filter(Boolean);
const corpus = tracked.filter(
  (p) => CODE_EXT.test(p) && (p.startsWith('scripts/') || p.startsWith('docs/research/')),
);
const read = (p) => { try { return readFileSync(`${ROOT}${p}`, 'utf8'); } catch { return null; } };

// ─── Arm A ──────────────────────────────────────────────────────────────────────────────────────

/** Key one literal `.size <op> <n>` match that is NOT a direct `new Set(...)` tail. */
function keyIndirect(code, raw, path, m) {
  const parts = SIZE_CMP_PARTS.exec(code.slice(m.index, m.index + m[0].length + 2));
  const op = parts ? parts[1] : null;
  const n = parts ? Number(parts[2]) : null;
  const dir = op === null ? 'OTHER-N' : direction(op, n);
  const rec = receiverSpan(code, m.index);
  const line = lineOf(code, m.index);
  const whole = raw.split('\n')[line - 1];

  let cls;
  let bindLine = null;
  let argSpan = null;
  const t = rec.text.trim();

  const isDirectSetTail = /^new\s+Set\s*\([\s\S]*\)$/.test(t);
  if (isDirectSetTail) {
    cls = 'SET-TAIL-DIRECT';
    argSpan = t;
  } else if (rec.sawParen && t.includes(NEEDLE)) {
    cls = 'SET-EXPR';
    argSpan = t;
  } else if (rec.sawParen && t.includes('new Map(')) {
    cls = 'MAP-EXPR';
  } else if (rec.sawBracket) {
    cls = 'RECEIVER-UNKEYED';
  } else if (/^[A-Za-z_$][\w$]*$/.test(t)) {
    const b = bindingOf(code, t);
    if (b === null) cls = 'UNRESOLVED';
    else {
      bindLine = b.line;
      if (b.rhs.includes(NEEDLE)) { cls = 'SET-BOUND'; argSpan = b.rhs; }
      else if (b.rhs.includes('new Map(')) cls = 'MAP-BOUND';
      else cls = 'OTHER-BOUND';
    }
  } else if (/\./.test(t) && !rec.sawParen) {
    cls = 'PROPERTY';
  } else if (rec.sawParen) {
    cls = 'CALL';
  } else {
    cls = 'RECEIVER-UNKEYED';
  }

  const guard = (cls === 'SET-BOUND' || cls === 'SET-EXPR')
    ? (GUARD_PREDS.some((p) => (argSpan || '').includes(p)) ? 'GUARDED' : 'BLIND')
    : null;

  return { path, line, cls, dir, op, n, guard, bindLine, receiver: t, whole };
}

function armA(files) {
  const sites = [];
  let excludedDirectTails = 0;
  for (const p of files) {
    const raw = read(p);
    if (raw === null) continue;
    const code = stripSource(raw, true);
    const tails = setTailIndices(code);
    for (const m of code.matchAll(SIZE_CMP)) {
      if (tails.has(m.index)) { excludedDirectTails += 1; continue; }
      sites.push(keyIndirect(code, raw, p, m));
    }
  }
  return { sites, excludedDirectTails };
}

// ─── Arm B ──────────────────────────────────────────────────────────────────────────────────────

function armB(files) {
  const sites = [];
  for (const p of files) {
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
      // a NO-COMPARISON site
      const line = lineOf(code, i);
      const lineStart = code.lastIndexOf('\n', i) + 1;
      const prefix = code.slice(lineStart, i);
      const whole = raw.split('\n')[line - 1];
      let cls;
      let name = null;
      let cmpDir = null;
      let cmpText = null;
      const mBind = /(?:^|[;{(,]|\b)(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*$/.exec(prefix);
      const mProp = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+|\w+\[[^\]]*\])\s*=\s*$/.exec(prefix);
      if (mBind) {
        name = mBind[1];
        const cmp = new RegExp(
          `(?<![\\w$.])${name.replace(/[$]/g, '\\$')}\\s*(===|==|!==|!=|>=|<=|>|<)\\s*(\\d+)`,
        ).exec(code);
        if (cmp) {
          cls = 'BOUND-COMPARED';
          cmpDir = direction(cmp[1], Number(cmp[2]));
          cmpText = cmp[0];
        } else cls = 'BOUND-UNCOMPARED';
      } else if (mProp) {
        cls = 'PROPERTY-ASSIGN';
        name = mProp[1];
      } else if (/\breturn\s*$/.test(prefix)) {
        cls = 'RETURN';
      } else {
        const enc = enclosingOpener(code, i);
        cls = (inInterp(code, i) || enc === '(' || enc === '[') ? 'INTERP-OR-ARG' : 'B-UNKEYED';
      }
      sites.push({ path: p, line, cls, name, cmpDir, cmpText, whole });
      i = end + 1;
    }
  }
  return sites;
}

// ─── KP cells, planted OUTSIDE the corpus ───────────────────────────────────────────────────────
// `os.tmpdir()`, never `scripts/`, `packages/` or `docs/research/`: a scratch copy inside the
// corpus is a measured contaminant, and one at the wrong depth refuses every cell.

const KP_SRC = `
const kpArr = [1, 1, 2];
const kpSet = new Set([1, 1]);
const kpMap = new Map();
const kpGuarded = new Set(kpArr.filter((x) => x != null));
const kpObj = { inner: new Set() };
const kpRows = [new Set()];
const kpFn = (x) => new Set([x]);
const kpOut = {};
const kpN = new Set(kpArr).size;
let kpAcc = 0;
if (kpSet.size === 1) kpAcc++;              // KP1  SET-BOUND / INVARIANCE / BLIND
if (kpMap.size === 1) kpAcc++;              // KP2  MAP-BOUND / INVARIANCE
if (kpParam.size === 1) kpAcc++;            // KP3  UNRESOLVED
if (kpObj.inner.size === 0) kpAcc++;        // KP4  PROPERTY / EMPTY
if (kpFn(1).size > 1) kpAcc++;              // KP5  CALL / CHANGE
if (new Set(kpArr).size === 1) kpAcc++;     // KP6  direct tail -> EXCLUDED from Arm A
if (kpGuarded.size === 1) kpAcc++;          // KP7  SET-BOUND / GUARDED
if (kpN === 1) kpAcc++;                     // KP8  Arm B BOUND-COMPARED / INVARIANCE
const kpStr = \`\${new Set(kpArr).size}\`;      // KP9  Arm B INTERP-OR-ARG
kpOut.n = new Set(kpArr).size;              // KP10 Arm B PROPERTY-ASSIGN
if (kpRows[0].size === 1) kpAcc++;          // KP11 Arm A RECEIVER-UNKEYED (fall-through)
kpSink(new Set(kpArr).size + 1, 2);         // KP12 Arm B INTERP-OR-ARG (addendum-corrected)
new Set(kpArr).size;                        // KP13 Arm B B-UNKEYED (fall-through)
`;

const kpDir = mkdtempSync(join(tmpdir(), 'unit523kp-'));
const kpPath = join(kpDir, 'kp-plants.mjs');
writeFileSync(kpPath, KP_SRC, 'utf8');

const kpCode = stripSource(KP_SRC, true);
const kpTails = setTailIndices(kpCode);
const kpA = [];
for (const m of kpCode.matchAll(SIZE_CMP)) {
  if (kpTails.has(m.index)) {
    const ln = lineOf(kpCode, m.index);
    kpA.push({ cls: 'EXCLUDED-DIRECT-TAIL', line: ln, whole: KP_SRC.split('\n')[ln - 1] });
    continue;
  }
  kpA.push(keyIndirect(kpCode, KP_SRC, kpPath, m));
}
const kpAat = (needle) => kpA.find((s) => (s.whole || '').includes(needle));

const kpBsites = [];
{
  let i = 0;
  while ((i = kpCode.indexOf(NEEDLE, i)) !== -1) {
    const open = i + NEEDLE.length - 1;
    const end = parenSpanEnd(kpCode, open);
    if (end === -1) { i += NEEDLE.length; continue; }
    const tail = kpCode.slice(end + 1, end + 41);
    if (!/^\s*\.size/.test(tail) || TAIL.test(tail)) { i = end + 1; continue; }
    const line = lineOf(kpCode, i);
    const lineStart = kpCode.lastIndexOf('\n', i) + 1;
    const prefix = kpCode.slice(lineStart, i);
    const whole = KP_SRC.split('\n')[line - 1];
    let cls;
    let cmpDir = null;
    const mBind = /(?:^|[;{(,]|\b)(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*$/.exec(prefix);
    const mProp = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+|\w+\[[^\]]*\])\s*=\s*$/.exec(prefix);
    if (mBind) {
      const nm = mBind[1];
      const cmp = new RegExp(`(?<![\\w$.])${nm}\\s*(===|==|!==|!=|>=|<=|>|<)\\s*(\\d+)`).exec(kpCode);
      if (cmp) { cls = 'BOUND-COMPARED'; cmpDir = direction(cmp[1], Number(cmp[2])); }
      else cls = 'BOUND-UNCOMPARED';
    } else if (mProp) cls = 'PROPERTY-ASSIGN';
    else if (/\breturn\s*$/.test(prefix)) cls = 'RETURN';
    else {
      const enc = enclosingOpener(kpCode, i);
      cls = (inInterp(kpCode, i) || enc === '(' || enc === '[') ? 'INTERP-OR-ARG' : 'B-UNKEYED';
    }
    kpBsites.push({ cls, cmpDir, whole });
    i = end + 1;
  }
}
const kpBat = (needle) => kpBsites.find((s) => (s.whole || '').includes(needle));

const kpCells = [];
const cell = (name, ok, got) => kpCells.push({ name, ok: ok === true, got });

cell('KP1  kpSet.size === 1 -> SET-BOUND/INVARIANCE/BLIND',
  (() => { const s = kpAat('kpSet.size'); return s && s.cls === 'SET-BOUND' && s.dir === 'INVARIANCE' && s.guard === 'BLIND'; })(),
  JSON.stringify(kpAat('kpSet.size') && [kpAat('kpSet.size').cls, kpAat('kpSet.size').dir, kpAat('kpSet.size').guard]));
cell('KP2  kpMap.size === 1 -> MAP-BOUND/INVARIANCE',
  (() => { const s = kpAat('kpMap.size'); return s && s.cls === 'MAP-BOUND' && s.dir === 'INVARIANCE'; })(),
  JSON.stringify(kpAat('kpMap.size') && [kpAat('kpMap.size').cls, kpAat('kpMap.size').dir]));
cell('KP3  kpParam.size === 1 -> UNRESOLVED',
  (() => { const s = kpAat('kpParam.size'); return s && s.cls === 'UNRESOLVED'; })(),
  JSON.stringify(kpAat('kpParam.size') && kpAat('kpParam.size').cls));
cell('KP4  kpObj.inner.size === 0 -> PROPERTY/EMPTY',
  (() => { const s = kpAat('kpObj.inner.size'); return s && s.cls === 'PROPERTY' && s.dir === 'EMPTY'; })(),
  JSON.stringify(kpAat('kpObj.inner.size') && [kpAat('kpObj.inner.size').cls, kpAat('kpObj.inner.size').dir]));
cell('KP5  kpFn(1).size > 1 -> CALL/CHANGE',
  (() => { const s = kpAat('kpFn(1).size'); return s && s.cls === 'CALL' && s.dir === 'CHANGE'; })(),
  JSON.stringify(kpAat('kpFn(1).size') && [kpAat('kpFn(1).size').cls, kpAat('kpFn(1).size').dir]));
cell('KP6  new Set(kpArr).size === 1 -> EXCLUDED, absent from the keyed Arm A population',
  (() => { const s = kpAat('if (new Set(kpArr).size === 1)'); return s && s.cls === 'EXCLUDED-DIRECT-TAIL'; })(),
  JSON.stringify(kpAat('if (new Set(kpArr).size === 1)') && kpAat('if (new Set(kpArr).size === 1)').cls));
cell('KP7  kpGuarded.size === 1 -> SET-BOUND/GUARDED',
  (() => { const s = kpAat('kpGuarded.size'); return s && s.cls === 'SET-BOUND' && s.guard === 'GUARDED'; })(),
  JSON.stringify(kpAat('kpGuarded.size') && [kpAat('kpGuarded.size').cls, kpAat('kpGuarded.size').guard]));
cell('KP8  const kpN = new Set(kpArr).size + kpN === 1 -> BOUND-COMPARED/INVARIANCE',
  (() => { const s = kpBat('const kpN ='); return s && s.cls === 'BOUND-COMPARED' && s.cmpDir === 'INVARIANCE'; })(),
  JSON.stringify(kpBat('const kpN =') && [kpBat('const kpN =').cls, kpBat('const kpN =').cmpDir]));
cell('KP9  `${new Set(kpArr).size}` -> INTERP-OR-ARG',
  (() => { const s = kpBat('const kpStr ='); return s && s.cls === 'INTERP-OR-ARG'; })(),
  JSON.stringify(kpBat('const kpStr =') && kpBat('const kpStr =').cls));
cell('KP10 kpOut.n = new Set(kpArr).size -> PROPERTY-ASSIGN',
  (() => { const s = kpBat('kpOut.n ='); return s && s.cls === 'PROPERTY-ASSIGN'; })(),
  JSON.stringify(kpBat('kpOut.n =') && kpBat('kpOut.n =').cls));
cell('KP11 kpRows[0].size === 1 -> RECEIVER-UNKEYED (Arm A fall-through REACHABLE)',
  (() => { const s = kpAat('kpRows[0].size'); return s && s.cls === 'RECEIVER-UNKEYED'; })(),
  JSON.stringify(kpAat('kpRows[0].size') && kpAat('kpRows[0].size').cls));
cell('KP12 kpSink(new Set(kpArr).size + 1, 2) -> INTERP-OR-ARG (addendum-corrected expectation)',
  (() => { const s = kpBat('kpSink('); return s && s.cls === 'INTERP-OR-ARG'; })(),
  JSON.stringify(kpBat('kpSink(') && kpBat('kpSink(').cls));
cell('KP13 bare `new Set(kpArr).size;` -> B-UNKEYED (Arm B fall-through REACHABLE)',
  (() => { const s = kpBsites.find((x) => /^new Set\(kpArr\)\.size;/.test((x.whole || '').trim())); return s && s.cls === 'B-UNKEYED'; })(),
  JSON.stringify((kpBsites.find((x) => /^new Set\(kpArr\)\.size;/.test((x.whole || '').trim())) || {}).cls));

// ─── drive ──────────────────────────────────────────────────────────────────────────────────────

const { sites: A, excludedDirectTails } = armA(corpus);
const B = armB(corpus);

const tally = (xs, k) => xs.reduce((m, x) => { m[x[k]] = (m[x[k]] || 0) + 1; return m; }, {});
const pad = (s, n) => String(s).padEnd(n);

console.log(`unit-523indirectsize — arm`);
console.log(`SHA ${SHA} · clock ${CLOCK}`);
console.log(`instrument corpus: ${corpus.length} files`);
console.log('');

console.log('─── KP cells ───────────────────────────────────────────────────────────────────');
for (const c of kpCells) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.ok ? '' : `   got=${c.got}`}`);
const kpPassed = kpCells.filter((c) => c.ok).length;
console.log(`  KP ${kpPassed} of ${kpCells.length}`);
console.log('');

if (kpPassed !== kpCells.length) {
  console.log('ABORTED: a KP cell failed, so no census is published off this drive.');
  process.exit(1);
}

console.log('─── Arm A: the INDIRECT bound, keyed by receiver ───────────────────────────────');
console.log(`  literal .size comparisons excluded as direct \`new Set(...)\` tails: ${excludedDirectTails}`);
console.log(`  INDIRECT population (re-derived here; unit-521 published 123 over 850 files): ${A.length}`);
const clsA = tally(A, 'cls');
for (const k of ['SET-BOUND', 'SET-EXPR', 'MAP-BOUND', 'MAP-EXPR', 'OTHER-BOUND', 'UNRESOLVED', 'PROPERTY', 'CALL', 'RECEIVER-UNKEYED', 'SET-TAIL-DIRECT']) {
  console.log(`    ${pad(k, 20)} ${clsA[k] || 0}`);
}
const sumA = Object.values(clsA).reduce((a, b) => a + b, 0);
if (sumA !== A.length) throw new Error(`class sum ${sumA} != population ${A.length}`);
console.log(`    (sum asserted == population: ${sumA})`);
console.log('');
console.log('  direction × receiver class:');
for (const k of Object.keys(clsA).sort()) {
  const d = tally(A.filter((s) => s.cls === k), 'dir');
  console.log(`    ${pad(k, 20)} ${JSON.stringify(d)}`);
}
console.log('');
const setLike = A.filter((s) => s.cls === 'SET-BOUND' || s.cls === 'SET-EXPR');
const narrowed = setLike.filter((s) => s.dir === 'INVARIANCE');
console.log(`  NARROWED HAZARD — (SET-BOUND or SET-EXPR) and INVARIANCE: ${narrowed.length}`);
console.log(`    guard: ${JSON.stringify(tally(narrowed, 'guard'))}`);
console.log(`    files: ${new Set(narrowed.map((s) => s.path)).size}`);
for (const s of narrowed) {
  console.log(`      ${s.path}:${s.line}  [${s.cls} ${s.dir} ${s.guard}] receiver=${s.receiver} bindLine=${s.bindLine}`);
  console.log(`        ${s.whole}`);
}
console.log('');
const mapInv = A.filter((s) => s.cls === 'MAP-BOUND' && s.dir === 'INVARIANCE');
console.log(`  MAP-BOUND and INVARIANCE (real invariance claims that are NOT the Set-absence hazard): ${mapInv.length}`);
for (const s of mapInv) console.log(`      ${s.path}:${s.line}  receiver=${s.receiver}\n        ${s.whole}`);
console.log('');

console.log('─── Arm B: the NO-COMPARISON sites, keyed by what the size flows into ──────────');
console.log(`  NO-COMPARISON population (re-derived; unit-521 published 95 over 850 files): ${B.length}`);
const clsB = tally(B, 'cls');
for (const k of ['BOUND-COMPARED', 'BOUND-UNCOMPARED', 'PROPERTY-ASSIGN', 'RETURN', 'INTERP-OR-ARG', 'B-UNKEYED']) {
  console.log(`    ${pad(k, 20)} ${clsB[k] || 0}`);
}
const sumB = Object.values(clsB).reduce((a, b) => a + b, 0);
if (sumB !== B.length) throw new Error(`class sum ${sumB} != population ${B.length}`);
console.log(`    (sum asserted == population: ${sumB})`);
const bound = B.filter((s) => s.cls === 'BOUND-COMPARED' || s.cls === 'BOUND-UNCOMPARED');
console.log(`    BOUND (compared + uncompared) ${bound.length}`);
console.log('');
const oneAway = B.filter((s) => s.cls === 'BOUND-COMPARED' && s.cmpDir === 'INVARIANCE');
console.log(`  THE CLAIM ONE BINDING AWAY — BOUND-COMPARED whose comparison keys INVARIANCE: ${oneAway.length}`);
console.log(`    files: ${new Set(oneAway.map((s) => s.path)).size}`);
for (const s of oneAway) {
  console.log(`      ${s.path}:${s.line}  name=${s.name}  cmp=${s.cmpText}`);
  console.log(`        ${s.whole}`);
}
console.log('');
console.log('  BOUND-COMPARED by comparison direction:');
console.log(`    ${JSON.stringify(tally(B.filter((s) => s.cls === 'BOUND-COMPARED'), 'cmpDir'))}`);
console.log('');

console.log('─── every Arm A member, whole, no display field ────────────────────────────────');
for (const s of A) {
  console.log(`  ${s.path}:${s.line}  [${s.cls} ${s.dir}${s.guard ? ` ${s.guard}` : ''}] receiver=${s.receiver}`);
  console.log(`    ${s.whole}`);
}
console.log('');
console.log('─── every Arm B member, whole, no display field ────────────────────────────────');
for (const s of B) {
  console.log(`  ${s.path}:${s.line}  [${s.cls}${s.cmpDir ? ` cmp=${s.cmpDir}` : ''}]`);
  console.log(`    ${s.whole}`);
}
