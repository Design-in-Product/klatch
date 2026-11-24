#!/usr/bin/env node
/**
 * unit-514 post-hoc — the UNCLEAR bucket, sub-keyed; plus the two corrections Arm A owes.
 *
 * Arm A left **46 of 59** STRING-region occurrences in `UNCLEAR`. A fall-through terminal bucket
 * absorbs every blindness, so an uncharacterised 46 could hide consumers the census missed. This
 * sub-key exists to answer ONE question: **does the bucket hide any consumer?** It therefore does
 * not try to label everything — it tries to drive the RESIDUAL (neither emission nor prose nor a
 * prediction's own name) down to a number small enough to print in full and read by eye, and then
 * prints it in full.
 *
 * Also carries two corrections Arm A owes, computed rather than asserted:
 *
 *  A. **The retraction.** Arm A's 12 non-regex consumers include 2 decided from the 4-LINE WINDOW
 *     rather than the own line. Both are the label inside a prediction's NAME string. Counted here
 *     from the arm's own JSON column, not by eye.
 *  B. **The exclusion accounting.** Arm A prints a hard-coded `1 excluded as this arm's own` while
 *     the file was UNTRACKED at run time, so the filter removed nothing. Recomputed honestly, and
 *     this file reports whether IT is tracked too, since both are now in the corpus.
 *
 * No brace comparison in this file, deliberately (see Arm A's docblock).
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const LABEL = 'tracked files read';
const ARM = 'docs/research/unit-514equalityconsumer-2026-11-24/arm-equalityconsumer.mjs';
const SELF = 'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-unclear-subkey.mjs';
const ARM_JSON_CAPTURE = 'docs/research/unit-514equalityconsumer-2026-11-24/captures/ARM-A.out';

/* -------- region scan, imported by copy from the arm so the sub-key reads the same regions ----- */
function regions(src) {
  const out = [];
  let i = 0; let state = 'CODE'; let lastSig = ''; let regionStart = 0; let q = '';
  const n = src.length;
  const push = (end) => { out.push({ kind: state, start: regionStart, end }); };
  while (i < n) {
    const c = src[i]; const c2 = src[i + 1];
    if (state === 'CODE') {
      if (c === '/' && c2 === '/') { push(i); state = 'LINE_COMMENT'; regionStart = i; i += 2; continue; }
      if (c === '/' && c2 === '*') { push(i); state = 'BLOCK_COMMENT'; regionStart = i; i += 2; continue; }
      if (c === "'" || c === '"' || c === '`') { push(i); state = 'STRING'; regionStart = i; q = c; i += 1; continue; }
      if (c === '/' && !/[\w$)\]]/.test(lastSig)) { push(i); state = 'REGEX'; regionStart = i; i += 1; continue; }
      if (!/\s/.test(c)) lastSig = c;
      i += 1; continue;
    }
    if (state === 'LINE_COMMENT') { if (c === '\n') { push(i); state = 'CODE'; regionStart = i; } i += 1; continue; }
    if (state === 'BLOCK_COMMENT') { if (c === '*' && c2 === '/') { push(i + 2); state = 'CODE'; regionStart = i + 2; i += 2; continue; } i += 1; continue; }
    if (state === 'STRING') {
      if (c === '\\') { i += 2; continue; }
      if (c === q) { push(i + 1); state = 'CODE'; regionStart = i + 1; lastSig = 'x'; i += 1; continue; }
      i += 1; continue;
    }
    if (state === 'REGEX') {
      if (c === '\\') { i += 2; continue; }
      if (c === '[') { while (i < n && src[i] !== ']') { if (src[i] === '\\') i += 1; i += 1; } i += 1; continue; }
      if (c === '/') { push(i + 1); state = 'CODE'; regionStart = i + 1; lastSig = 'x'; i += 1; continue; }
      i += 1; continue;
    }
    i += 1;
  }
  push(n);
  return out.filter((r) => r.end > r.start);
}

const lineNo = (src, o) => src.slice(0, o).split('\n').length;
const lineAt = (src, o) => (src.split('\n')[lineNo(src, o) - 1] ?? '');

/* ------------------------------------------------------------------ the sub-key */
const SHAPE_RE = new RegExp(`(?:===|!==|==|!=)\\s*['"\`]${LABEL}['"\`]|['"\`]${LABEL}['"\`]\\s*(?:===|!==|==|!=)`
  + `|\\.(?:includes|startsWith|endsWith|indexOf|lastIndexOf|search)\\s*\\(\\s*['"\`]${LABEL}`
  + `|['"\`]${LABEL}['"\`]\\s*:|\\[[^\\]]*['"\`]${LABEL}['"\`]|[\\w$.]+\\s*\\(\\s*['"\`]${LABEL}['"\`]`);

/**
 * Four classes, tried in this order. The ORDER is the claim: EMITTER and PRED-NAME are decided
 * from syntax, PROSE from the enclosing literal's own shape, and whatever survives all three is
 * RESIDUAL and gets printed in full — that printed list is the evidence that the bucket hides no
 * consumer, and it is the only thing here anyone has to take on trust.
 */
function subKey(src, offset, region) {
  const literal = src.slice(region.start, region.end);
  const own = lineAt(src, offset);
  const ln = lineNo(src, offset) - 1;
  const win = src.split('\n').slice(Math.max(0, ln - 2), ln + 2).join('\n');
  const words = literal.split(/\s+/).filter((w) => /[a-z]{2,}/i.test(w)).length;

  if (/^['"`]\s*P\d+[a-z]?\.?[a-z0-9]*\s\s/.test(literal) || /^['"`]\s*P\d+[a-z]?\.[a-z]\s/.test(literal)) {
    return { cls: 'PRED-NAME', why: "the literal is a graded prediction's own NAME string", words, literal };
  }
  if (/console\.log|process\.stdout\.write|\.write\s*\(|\bpush\s*\(\s*['"`]|^\s*\+\s*['"`]/.test(own)
      || /console\.log|process\.stdout\.write|\.write\s*\(/.test(win)) {
    return { cls: 'EMITTER', why: 'the enclosing statement EMITS this string', words, literal };
  }
  if (words >= 8) {
    return { cls: 'PROSE', why: `the enclosing literal is a sentence (${words} words)`, words, literal };
  }
  return { cls: 'RESIDUAL', why: 'neither emission, nor a prediction name, nor a sentence', words, literal };
}

/* ------------------------------------------------------------------ corpus */
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter((p) => /\.(mjs|js)$/.test(p));
const EXCLUDE = [ARM, SELF];
const excludedPresent = EXCLUDE.filter((p) => tracked.includes(p));
const corpus = tracked.filter((p) => !EXCLUDE.includes(p));

const unclear = [];
const counts = { PRED_NAME: 0, EMITTER: 0, PROSE: 0, RESIDUAL: 0 };
let stringTotal = 0;
for (const rel of corpus) {
  let src;
  try { src = readFileSync(rel, 'utf8'); } catch { continue; }
  if (!src.includes(LABEL)) continue;
  const regs = regions(src);
  let at = src.indexOf(LABEL);
  while (at !== -1) {
    const r = regs.find((g) => at >= g.start && at < g.end);
    if (r && r.kind === 'STRING') {
      stringTotal += 1;
      const own = lineAt(src, at);
      const ln = lineNo(src, at) - 1;
      const win = src.split('\n').slice(Math.max(0, ln - 1), ln + 3).join('\n');
      const hasShapeOwn = SHAPE_RE.test(own);
      const hasShapeWin = SHAPE_RE.test(win);
      if (!hasShapeOwn && !hasShapeWin) {
        const k = subKey(src, at, r);
        counts[k.cls === 'PRED-NAME' ? 'PRED_NAME' : k.cls] += 1;
        unclear.push({ file: rel, line: ln + 1, cls: k.cls, why: k.why, words: k.words,
          literalHead: k.literal.replace(/\s+/g, ' ').slice(0, 150), line_text: own.trim().slice(0, 150) });
      }
    }
    at = src.indexOf(LABEL, at + 1);
  }
}

/* ------------------------------------------------------------------ correction A: the retraction */
const armOut = readFileSync(ARM_JSON_CAPTURE, 'utf8');
const armJson = JSON.parse(armOut.slice(armOut.indexOf('{\n  "kp"')));
const byDecision = armJson.nonRegexConsumers.reduce((m, r) => {
  m[r.decidedFrom] = (m[r.decidedFrom] || 0) + 1; return m;
}, {});
const windowDecided = armJson.nonRegexConsumers.filter((r) => r.decidedFrom === '4-line window');

/* ------------------------------------------------------------------ correction B: exclusion */
const exclusion = {
  armPrinted: '1 excluded as this arm\'s own',
  armPrintedIsTrueOfThatDrive: false,
  reasonItWasFalse: 'the arm was UNTRACKED at its own run time, so the path filter removed nothing and corpus.length == tracked.length',
  nowTrackedAtThisDrive: { [ARM]: tracked.includes(ARM), [SELF]: tracked.includes(SELF) },
  trackedJsAtThisDrive: tracked.length,
  excludedByPathAndPresent: excludedPresent.length,
  corpusReadAtThisDrive: corpus.length,
  identityHolds: corpus.length === tracked.length - excludedPresent.length,
};

console.log('=== unit-514 post-hoc — the UNCLEAR bucket, sub-keyed ===\n');
console.log(`  STRING-region occurrences with no shape on line or in window: ${unclear.length} (of ${stringTotal} STRING total)\n`);
console.log(`  PRED-NAME ${counts.PRED_NAME}  ·  EMITTER ${counts.EMITTER}  ·  PROSE ${counts.PROSE}  ·  RESIDUAL ${counts.RESIDUAL}\n`);
console.log('  RESIDUAL in full — the only class anyone has to read by eye:\n');
for (const r of unclear.filter((x) => x.cls === 'RESIDUAL')) {
  console.log(`    ${r.file}:${r.line}  (${r.words} words)`);
  console.log(`      ${r.line_text}`);
}
console.log('\n=== correction A — Arm A\'s 12, by what decided them ===\n');
console.log(`  ${JSON.stringify(byDecision)}`);
for (const r of windowDecided) console.log(`    RETRACTED  ${r.file}:${r.line}  ${r.shape}  <- decided from the 4-line window`);
console.log(`  non-regex consumers decided from the OWN LINE: ${(byDecision['own line'] ?? 0)}  <- the figure to carry`);
console.log('\n=== correction B — the exclusion accounting, recomputed ===\n');
for (const [k, v] of Object.entries(exclusion)) console.log(`  ${k}: ${JSON.stringify(v)}`);

console.log(`\n${JSON.stringify({ counts, stringTotal, unclearTotal: unclear.length, residual: unclear.filter((x) => x.cls === 'RESIDUAL'), byDecision, windowDecided, exclusion, allUnclear: unclear }, null, 2)}`);
