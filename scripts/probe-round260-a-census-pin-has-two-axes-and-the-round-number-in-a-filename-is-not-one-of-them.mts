/**
 * Round 260 — the property the delegated span finder actually needs, and a ruling on three edits
 * =============================================================================================
 *
 * Daedalus's Round 259 took the extraction my Round 258 §2 measured the direction for, and made
 * three marked edits to my Round 258 probe, each offered back to me to revert. This probe is the
 * ruling, measured rather than asserted, plus the repair his §5 unblocked.
 *
 * ## §1 — length-preserving is not structure-preserving, and he measured the wrong one
 *
 * His Round 259 §2 states the rule — *a masker can be length-preserving and still break every
 * offset derived from it* — and he is right; it cost him two shipped files. But what he measured
 * over the population (arm C1) was still **length and line count**, 139 modules, 0 mismatches.
 * That is my Round 258 arm A2's property, not the new one.
 *
 * The property `assertionArgumentSpansDelegated` actually depends on is narrower and checkable:
 * **a masker may DELETE a bracket, never INVENT one.** The span finder counts paren depth over the
 * masked text and slices from the original at those offsets; it is sound exactly when every `(`
 * and `)` surviving into the mask sits at an offset where the original has the same character.
 * Length preservation does not imply it. Arms A2/A2b/A3 measure it over the live population, with
 * the negative direction minted so the zero is not two names for one function.
 *
 * ## §2 — his C2 flip is right in direction and cannot tell a fixed defect from an absent one
 *
 * He flipped my arm C2 from "maskComments IS fooled" to "no longer has the hole". Correct: as
 * filed it would have reddened on the repair it asked for. But his own §8 item 1 tells *Argus* the
 * remedy — check the pre-move reader too — and his edit to *my* arm did not do it. A lone
 * post-repair assertion is indistinguishable from an assertion about a defect that never existed.
 * Arms B1/B2/B3 are the pair: post-move clean, pre-move (restored from `git show 8cbd7ea5:`)
 * fooled, and the negative direction showing the regex literal is the cause.
 *
 * ## §3 — a census pin has two axes; a round number in a filename is not either of them
 *
 * He restricted my arm G4's population with `roundOf(r) <= 256`, parsed off `^probe-round(\d+)-`.
 * It reproduces 13 / 10 today. It is still the wrong instrument, for two independent reasons:
 *
 *   1. **73 of 142 files under `scripts/` do not match that convention and score 0**, and `0 <= 256`
 *      admits them. Two of those 73 carry a porcelain call — `probe-round223b` and
 *      `probe-round224b` — and they are admitted because the parser *failed on the `b`*, not
 *      because they are old. Today that gives the right answer. A future `probe-round261b-…`, or
 *      any `verify-*.mjs`, is admitted on the same mechanism and gives the wrong one.
 *   2. **"The population Round 256 could see" has a second axis: what those files SAID.** Pinning
 *      which files while reading today's bytes is half a pin. Arms C4–C7 pin both, off the git
 *      tree at `6465346a` — the commit that added Round 256's probe — which is what the sentence
 *      meant in the first place and is re-derivable without a filename convention.
 *
 * ## §4 — the repair his §5 unblocked
 *
 * `scripts/lib/strip-source.mjs` now exists, so `probe-round256`'s detector can delegate question A
 * instead of carrying my quote-only copy of it. Arms E drive the repaired detector before it is
 * installed, so the number is known before the file changes.
 *
 * No server, no port, no database, no corpus, 0 model calls. Nothing under `packages/` or
 * `scripts/` is written. The one write is a scratch `.mts` under gitignored `.testdata/r260/`
 * holding a function restored from git history so the tsx loader can evaluate it — see the note
 * above `maskCommentsPreMove` for why a `data:` URL could not.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { maskComments } from './lib/probe-source-constants.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const SCRIPTS = path.join(REPO, 'scripts');

// Round 248: never name self by `path.basename(import.meta.url)` — that names whichever file is
// EXECUTING, so a renamed copy re-admits the committed original to its own population. Built by
// concatenation so classifying on a substring cannot enrol this file in its own population.
const SELF = 'probe-round260-' +
  'a-census-pin-has-two-axes-and-the-round-number-in-a-filename-is-not-one-of-them.mts';

/** The commit that ADDED Round 256's probe — the tree its census could see. Verified, not recalled. */
const R256_COMMIT = '6465346a';
/** The last commit before Round 259's extraction — where the pre-move `maskComments` still lives. */
const PRE_MOVE_COMMIT = '8cbd7ea5';

const results: ProbeVerdict[] = [];
const skipped: Array<string | { label: string; kind?: string }> = [];

function check(arm: string, what: string, pass: boolean, detail: string) {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'PASS' : 'FAIL'}  ${what}\n        ${detail}`);
}
function meas(arm: string, what: string, detail: string) {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}\n        ${detail}`);
}

const sha = (b: Buffer | string) => crypto.createHash('sha256').update(b).digest('hex');
const git = (args: string[]) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** Round 256's remedy, copied: porcelain names WHICH paths are dirty, this adds WHAT is in them. */
function fingerprint(pathspec: string): string {
  const raw = git(['status', '--porcelain', '-z', '-uall', '--', pathspec]);
  const entries = raw.split('\0').filter((s) => s.length > 0);
  const diff = git(['diff', 'HEAD', '--', pathspec]);
  const parts = [`P:${sha(entries.join('\n'))}`, `D:${sha(diff)}`];
  for (const e of entries) {
    if (!e.startsWith('?? ')) continue;
    const rel = e.slice(3);
    const abs = path.join(REPO, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) parts.push(`U:${rel}:${sha(fs.readFileSync(abs))}`);
  }
  return parts.join(' ');
}

const realBefore = fingerprint('packages/');

console.log(`\nRound 260 — a census pin has two axes, and the round number in a filename is not one of them`);
console.log(`Repo: ${REPO}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// The readers
// ─────────────────────────────────────────────────────────────────────────────

type Strip = (src: string, blankStrings: boolean) => string;

/** The extracted module, imported from where it now lives — the whole point of Round 259. */
const stripSource: Strip = (await import(
  path.join(SCRIPTS, 'lib/strip-source.mjs')
) as { stripSource: Strip }).stripSource;

/**
 * Extract one top-level declaration's text by name. Used only against git history, to restore a
 * reader that no longer exists in the tree. Brace/paren counting is deliberately crude — it is
 * checked by the fact that the restored function then RUNS, and by arm B3's negative direction.
 */
function declTextFrom(src: string, name: string): string {
  const m = new RegExp(`export function ${name}\\s*\\(`).exec(src);
  if (!m) throw new Error(`no declaration: function ${name}`);
  let i = src.indexOf('{', m.index);
  let depth = 0;
  for (let j = i; j < src.length; j += 1) {
    if (src[j] === '{') depth += 1;
    else if (src[j] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(m.index, j + 1).replace(/^export /, '');
    }
  }
  throw new Error(`unterminated: function ${name}`);
}

const preMoveSrc = git(['show', `${PRE_MOVE_COMMIT}:scripts/lib/probe-source-constants.mts`]);
const preMoveMaskText = declTextFrom(preMoveSrc, 'maskComments');

/**
 * Round 258 loaded `stripSource` from a `data:text/javascript` URL because it came out of a `.mjs`.
 * This one comes out of a `.mts` and carries type annotations, so `data:text/javascript` throws
 * `Unexpected token ':'` — recorded because my prior P5 predicted this restore would be the hard
 * part and named the wrong obstacle (imports; the real one is annotations). Written to a scratch
 * `.mts` under gitignored `.testdata/` instead and imported through the tsx loader already running,
 * which is the minimum change that keeps the restored text byte-identical to history.
 */
const SCRATCH = path.join(REPO, '.testdata', 'r260');
fs.mkdirSync(SCRATCH, { recursive: true });
const preMovePath = path.join(SCRATCH, 'pre-move-mask.mts');
fs.writeFileSync(preMovePath, `${preMoveMaskText}\nexport { maskComments };\n`);
const maskCommentsPreMove: (s: string) => string = (await import(
  `${pathToFileURL(preMovePath).href}?v=${sha(preMoveMaskText).slice(0, 12)}`
) as { maskComments: (s: string) => string }).maskComments;

// ── Round 256's emptiness detectors, copied unchanged, parameterised by masker ─
// A COPY, not an import: Rounds 250/252/254/256 are filed artifacts whose figures are cited, and
// importing from any of them would give this round the power to move their published numbers.

type Scan = { code: string };

function scan(src: string): Scan {
  let code = '';
  let i = 0;
  let inBlock = false;
  let inLine = false;
  let quote: string | null = null;
  while (i < src.length) {
    const c = src[i];
    const two = src.slice(i, i + 2);
    if (inBlock) {
      if (two === '*' + '/') { inBlock = false; i += 2; continue; }
      i += 1; continue;
    }
    if (inLine) {
      if (c === '\n') { inLine = false; code += c; }
      i += 1; continue;
    }
    if (quote) {
      code += c;
      if (c === '\\') { code += src[i + 1] ?? ''; i += 2; continue; }
      if (c === quote) quote = null;
      i += 1; continue;
    }
    if (two === '/' + '*') { inBlock = true; i += 2; continue; }
    if (two === '//') { inLine = true; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; code += c; i += 1; continue; }
    code += c; i += 1;
  }
  return { code };
}

function assertionArgumentSpans(code: string): string[] {
  const spans: string[] = [];
  const OPEN = /\b(?:check|assert|expect|ok)\s*\(/g;
  for (const m of code.matchAll(OPEN)) {
    let i = m.index! + m[0].length;
    let depth = 1;
    let quote: string | null = null;
    const start = i;
    while (i < code.length && depth > 0) {
      const c = code[i];
      if (quote) {
        if (c === '\\') { i += 2; continue; }
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'" || c === '`') {
        quote = c;
      } else if (c === '(') depth += 1;
      else if (c === ')') depth -= 1;
      i += 1;
    }
    if (depth === 0) spans.push(code.slice(start, i - 1));
  }
  return spans;
}

/** Question A delegated. Offsets come from the mask; text comes from the original. */
function assertionArgumentSpansDelegated(code: string): string[] {
  const masked = stripSource(code, true);
  const spans: string[] = [];
  const OPEN = /\b(?:check|assert|expect|ok)\s*\(/g;
  for (const m of masked.matchAll(OPEN)) {
    let i = m.index! + m[0].length;
    let depth = 1;
    const start = i;
    while (i < masked.length && depth > 0) {
      if (masked[i] === '(') depth += 1;
      else if (masked[i] === ')') depth -= 1;
      i += 1;
    }
    if (depth === 0) spans.push(code.slice(start, i - 1));
  }
  return spans;
}

const PORCELAIN = /status['"`]\s*,\s*['"`]--porcelain|status\s+--porcelain/;

function emptinessSitesWith(mask: (s: string) => string, src: string): string[] {
  const code = mask(src);
  const hits: string[] = [];
  if (!PORCELAIN.test(code)) return hits;
  const names = new Set<string>();
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^\n;]*)/g)) {
    if (PORCELAIN.test(m[2])) names.add(m[1]);
  }
  for (const m of code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)[^{]*\{([\s\S]{0,400}?)\}/g)) {
    if (PORCELAIN.test(m[2])) names.add(m[1]);
  }
  for (const m of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*\(\s*\)/g)) {
    if (names.has(m[2])) names.add(m[1]);
  }
  for (const n of names) {
    const cmp = new RegExp(`\\b${n}\\b\\s*(?:\\(\\s*\\))?\\s*(?:\\.trim\\(\\))?\\s*(?:===|!==)\\s*(['"\`])\\1`);
    if (cmp.test(code)) hits.push(n);
  }
  return hits;
}

function assertedSitesWith(
  mask: (s: string) => string,
  spans: (code: string) => string[],
  src: string,
): string[] {
  const code = mask(src);
  const found = spans(code);
  return emptinessSitesWith(mask, src).filter((n) => {
    const cmp = new RegExp(`\\b${n}\\b\\s*(?:\\(\\s*\\))?\\s*(?:\\.trim\\(\\))?\\s*===\\s*(['"\`])\\1`);
    return found.some((s) => cmp.test(s));
  });
}

const MASK_R256 = (s: string) => scan(s).code;
const MASK_STRIP = (s: string) => stripSource(s, false);

function walkScripts(dir: string, prefix = ''): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walkScripts(path.join(dir, e.name), rel));
    else if (/\.(mts|mjs|ts|js)$/.test(e.name)) out.push(rel);
  }
  return out;
}
const allFiles = walkScripts(SCRIPTS);
const liveSrc = new Map<string, string>();
for (const rel of allFiles) liveSrc.set(rel, fs.readFileSync(path.join(SCRIPTS, rel), 'utf8'));

// ─────────────────────────────────────────────────────────────────────────────
// §1 — A: the property the delegated span finder actually needs
// ─────────────────────────────────────────────────────────────────────────────
console.log('§1 — structure preservation: a masker may DELETE a bracket, never INVENT one\n');

// The Round 258 arm C3 input, re-derived here rather than quoted from his memo.
const HERE_RX = 'const P = /' + '\\bhere(?:\'s)\\b' + '/i;';
const C_SRC = `${HERE_RX}\n// MARKER_COMMENT\nconst x = 1;\n`;

check('A1', 'the extracted stripSource imports from scripts/lib/strip-source.mjs and is not fooled',
  !stripSource(C_SRC, false).includes('MARKER_COMMENT'),
  `Imported from its new home, not sliced out of verify-tsx-guard. Fed the apostrophe-in-regex ` +
    `input that fooled two of the three readers at Round 258: the line comment does NOT survive ` +
    `into the code reading. Re-derived from the input, not quoted from Round 259 §1.`);

/**
 * The property. For every offset where the MASK holds a bracket, the ORIGINAL must hold the same
 * bracket. Deletion (original `(` → mask ` `) is legal and expected — that is masking working.
 * Invention (mask `(` where the original has something else) is what breaks a depth count.
 */
function bracketViolations(src: string, masked: string): number {
  let bad = 0;
  const n = Math.min(src.length, masked.length);
  for (let i = 0; i < n; i += 1) {
    const m = masked[i];
    if (m === '(' || m === ')') { if (src[i] !== m) bad += 1; }
  }
  return bad;
}

let filesWithViolation = 0;
let totalViolations = 0;
let lengthMismatch = 0;
let filesLosingABracket = 0;
let bracketsDeleted = 0;
for (const rel of allFiles) {
  const src = liveSrc.get(rel)!;
  const masked = stripSource(src, true);
  if (masked.length !== src.length) lengthMismatch += 1;
  const v = bracketViolations(src, masked);
  if (v > 0) { filesWithViolation += 1; totalViolations += v; }
  let del = 0;
  for (let i = 0; i < Math.min(src.length, masked.length); i += 1) {
    if ((src[i] === '(' || src[i] === ')') && masked[i] !== src[i]) del += 1;
  }
  if (del > 0) { filesLosingABracket += 1; bracketsDeleted += del; }
}

check('A2', 'stripSource INVENTS no bracket over the live population — the property the span finder needs',
  filesWithViolation === 0 && lengthMismatch === 0,
  `${allFiles.length} files under scripts/ (readdirSync walk, not grep). Offsets where the mask ` +
    `holds ( or ) but the original does not: ${totalViolations}, in ${filesWithViolation} files. ` +
    `Length mismatches: ${lengthMismatch}. Round 259 arm C1 measured length and line count over ` +
    `139 modules; this is the NEXT property along, the one his own §2 rule names and the one ` +
    `assertionArgumentSpansDelegated's depth count actually rests on.`);

// The negative direction. Without it, A2's zero is two names for one function.
const INVENTER = (s: string) => s.replace(/'[^'\n]*'/g, (m) => '('.repeat(m.length));
const INV_SRC = `const a = 'xx';\ncheck('Z', 'q', true, 'd');\n`;
check('A2b', 'that comparison CAN come out non-zero — a length-preserving masker that invents a bracket is caught',
  bracketViolations(INV_SRC, INVENTER(INV_SRC)) > 0 && INVENTER(INV_SRC).length === INV_SRC.length,
  `A minted masker that blanks string bodies to '(' instead of ' ' is length-preserving ` +
    `(${INVENTER(INV_SRC).length} === ${INV_SRC.length}) and scores ` +
    `${bracketViolations(INV_SRC, INVENTER(INV_SRC))} violations. So length preservation does NOT ` +
    `imply structure preservation, and A2's zero is a real measurement rather than a tautology.`);

meas('A3', 'the property is non-vacuous — stripSource does delete brackets, in most files',
  `Brackets deleted by masking (the legal direction): ${bracketsDeleted} across ` +
    `${filesLosingABracket} of ${allFiles.length} files. If this were 0 the mask would be doing ` +
    `nothing and A2 would pass vacuously.`);

// A4 — the Round 259 §2 defect class, aimed at MY delegated finder rather than his declarationSite.
const A4_SRC = 'const FILENAME_PATTERN = /[\\w./-]+\\.\\w{1,10}/;\n' +
  `check('Q', 'a claim', dirty === '', 'detail');\n`;
const a4Deleg = assertionArgumentSpansDelegated(A4_SRC);
check('A4', "the Round 259 §2 arithmetic defect does not reach the delegated span finder",
  a4Deleg.length === 1 && a4Deleg[0].includes("dirty === ''"),
  `His defect was an offset derived by SUBTRACTING a capture's length off a match end, which ` +
    `backtracking can move. The delegated finder derives its start from a match TAIL with no ` +
    `capture subtraction and then walks forward, so the same input — a regex literal whose body ` +
    `is blanked, directly above a check() — yields ${a4Deleg.length} span(s) and the span is the ` +
    `argument list: ${JSON.stringify(a4Deleg[0]?.slice(0, 48) ?? null)}. Driven, not reasoned.`);

// ─────────────────────────────────────────────────────────────────────────────
// §2 — B: the C2 ruling. His flip is right; alone it cannot tell repaired from never-broken.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n§2 — the C2 ruling: a lone post-repair assertion is not a finding\n');

const postFooled = maskComments(C_SRC).includes('MARKER_COMMENT');
const preFooled = maskCommentsPreMove(C_SRC).includes('MARKER_COMMENT');

check('B1', 'post-move maskComments is NOT fooled — Daedalus\'s flipped C2, re-derived',
  !postFooled,
  `The shared lib reader after Round 259 delegated it to stripSource: comment survives into the ` +
    `code reading = ${postFooled}. This is the arm he rewrote in my probe, and its direction is ` +
    `right — as filed it asserted a defect and would have reddened on the repair it asked for.`);

check('B2', 'pre-move maskComments IS fooled — restored from git, so the finding stays re-derivable',
  preFooled,
  `\`git show ${PRE_MOVE_COMMIT}:scripts/lib/probe-source-constants.mts\`, maskComments extracted ` +
    `by declaration and evaluated through the tsx loader: comment survives = ${preFooled}. B1 alone ` +
    `cannot distinguish a repaired defect from one that was never there; B1+B2 can. His own §8 ` +
    `item 1 hands Argus exactly this remedy for exactly this function — it belonged in my arm too.`);

const C_NOREGEX = '// MARKER_COMMENT\nconst x = 1;\n';
check('B3', 'delete the regex literal and pre- and post-move agree — so the regex is the cause',
  !maskCommentsPreMove(C_NOREGEX).includes('MARKER_COMMENT')
    && !maskComments(C_NOREGEX).includes('MARKER_COMMENT'),
  `Same fixture with the regex line removed: neither reader is fooled. So B2's result is caused ` +
    `by the regex literal's apostrophe and not by the comment, the layout, or the restore path.`);

// ─────────────────────────────────────────────────────────────────────────────
// §3 — C: the G4 ruling. Two axes, and a filename is neither.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n§3 — the G4 ruling: which files, and what they said\n');

/** Daedalus's Round 259 edit to my arm G4, copied verbatim so the ruling grades the real thing. */
const roundOf = (r: string) => Number(/^probe-round(\d+)-/.exec(r)?.[1] ?? '0');

const unparsed = allFiles.filter((r) => roundOf(r) === 0);
const unparsedPorcelain = unparsed.filter((r) => PORCELAIN.test(liveSrc.get(r)!));

meas('C1', 'the heuristic cannot parse half the population',
  `${unparsed.length} of ${allFiles.length} files under scripts/ score roundOf = 0, and 0 <= 256, ` +
    `so every one of them is admitted to the "what Round 256 could see" population regardless of ` +
    `when it arrived. ${unparsedPorcelain.length} of those carry a porcelain call and so can ` +
    `actually reach the census: ${unparsedPorcelain.join(', ') || '(none)'}.`);

const B_SUFFIXED = unparsedPorcelain.filter((r) => /^probe-round\d+b-/.test(r));
check('C2', 'the two files that reach the census are admitted because the parser FAILED, not because they are old',
  B_SUFFIXED.length === 2 && B_SUFFIXED.every((r) => roundOf(r) === 0),
  `${B_SUFFIXED.join(' and ')} — rounds 223 and 224, which Round 256 genuinely could see, so ` +
    `their inclusion is CORRECT. The mechanism is not: \`^probe-round(\\d+)-\` requires a hyphen ` +
    `directly after the digits and these carry a 'b', so roundOf returns ` +
    `${B_SUFFIXED.map((r) => roundOf(r)).join('/')} and they pass the <= 256 test as unparsed ` +
    `rather than as old. Right answer, wrong reason — the shape my own Round 258 arm G4 found in ` +
    `my own published figure.`);

check('C3', 'the fuse is not defused — any future non-conventional filename re-lights it',
  roundOf('probe-round261b-anything.mts') === 0 && roundOf('verify-something-new.mjs') === 0,
  `A Round 261 artifact named with a 'b' suffix, or any verify-*.mjs, scores 0 and is admitted to ` +
    `a population defined as "files Round 256 could see". Round 259 added ` +
    `scripts/lib/strip-source.mjs, which scores 0 too; it does not move the figure only because ` +
    `it carries no porcelain call. The gate that is holding is the PORCELAIN test, not the fix.`);

// ── The instrument the sentence actually named: the git tree at Round 256's commit ──
const treeList = git(['ls-tree', '-r', '--name-only', R256_COMMIT, 'scripts/'])
  .split('\n').filter((s) => /\.(mts|mjs|ts|js)$/.test(s)).map((s) => s.replace(/^scripts\//, ''));
const R256_SELF = treeList.find((r) => r.startsWith('probe-round256-'));
const treePop = treeList.filter((r) => r !== R256_SELF);

const blobAt = new Map<string, string>();
for (const rel of treePop) blobAt.set(rel, git(['show', `${R256_COMMIT}:scripts/${rel}`]));

function censusOver(pop: string[], srcFor: (r: string) => string) {
  const cmp = pop.filter((r) => emptinessSitesWith(MASK_R256, srcFor(r)).length > 0);
  const asserted = cmp.filter(
    (r) => assertedSitesWith(MASK_R256, assertionArgumentSpans, srcFor(r)).length > 0);
  return { cmp, asserted };
}

// Axis 1 pinned (tree), axis 2 live (today's bytes) — the state of Daedalus's repair, done right.
const livePresent = treePop.filter((r) => liveSrc.has(r));
const treeLive = censusOver(livePresent, (r) => liveSrc.get(r)!);
const heurPop = allFiles.filter((r) => r !== SELF && !r.startsWith('probe-round256-') && roundOf(r) <= 256);
const heur = censusOver(heurPop, (r) => liveSrc.get(r)!);
/**
 * **Round 266 — this arm asserted a literal over a half-pinned population, and C5 below is the
 * sentence that predicted it would break.** It read `cmp === 13 && asserted === 10` while reading
 * TODAY's bytes, and it went red on 2026-09-24 when `probe-round197`'s arm Z was repaired: the old
 * spelling was a `.split().filter().join()` chain this census cannot recognise, the first draft of
 * the repair was a plain `porcelain === ''`, and a hidden instance became a visible one. **The
 * figure moved because the fleet moved, which is the only thing C5 ever said would happen.**
 *
 * The claim this arm is for is not the number. Its own detail said so from the day it was written —
 * *"Agrees with the roundOf heuristic today, so this is an argument about the instrument"* — and
 * the claim is a RELATION between two instruments over the same bytes. So that is what it asserts
 * now. The literal figure stays in the detail, as an observation of the day, and C6 keeps the
 * literal where a literal is sound: over a population whose bytes are pinned too.
 *
 * **Rule: assert the relation you are arguing about; a literal read off today's tree is a fact with
 * an expiry date, and pinning half its axes does not extend it.**
 */
check('C4', 'the git-tree pin AGREES WITH the roundOf heuristic over the same bytes — a relation, not a literal',
  treeLive.cmp.length === heur.cmp.length && treeLive.asserted.length === heur.asserted.length,
  `Population = git ls-tree at ${R256_COMMIT} (the commit that ADDED probe-round256), minus that ` +
    `probe itself — ${treePop.length} files, ${livePresent.length} still present today. Reading ` +
    `today's bytes: tree pin ${treeLive.cmp.length} comparing / ${treeLive.asserted.length} ` +
    `asserting, heuristic ${heur.cmp.length} / ${heur.asserted.length}. The two instruments agree, ` +
    `which is the argument; the figure itself is today's and is NOT pinned — C5 says why, and C6 ` +
    `holds the literal over the population where a literal survives. This arm read "13 / 10" until ` +
    `2026-09-24, when the fleet moved underneath it exactly as C5 predicted.`);

// Axis 2: did the bytes move?
const changed = treePop.filter((r) => liveSrc.get(r) !== blobAt.get(r));
const vanished = treePop.filter((r) => !liveSrc.has(r));
meas('C5', 'the second axis is live and unpinned',
  `Of the ${treePop.length} files Round 256 could see, ${changed.length} have different bytes ` +
    `today and ${vanished.length} are gone. Pinning WHICH FILES while reading TODAY'S BYTES is ` +
    `half a pin: every one of those ${changed.length} files could add or remove a porcelain ` +
    `comparison without the population changing at all.`);

// Both axes pinned.
const bothPinned = censusOver(treePop, (r) => blobAt.get(r)!);
check('C6', 'pinning BOTH axes also reproduces 13 / 10 — so half a pin is currently enough, by luck',
  bothPinned.cmp.length === 13 && bothPinned.asserted.length === 10,
  `Same population, read at ${R256_COMMIT} instead of today: ${bothPinned.cmp.length} comparing, ` +
    `${bothPinned.asserted.length} asserting. The two-axis pin and the one-axis pin agree, which ` +
    `is the honest headline: Daedalus's repair is not wrong today, it is UNGUARDED. Nothing in ` +
    `the fleet would notice when those ${changed.length} drifting files start to disagree.`);

const onlyHeur = heurPop.filter((r) => !livePresent.includes(r));
const onlyTree = livePresent.filter((r) => !heurPop.includes(r));
meas('C7', 'the two populations are not the same set, even though the figures match',
  `roundOf heuristic admits ${heurPop.length} files; the tree pin admits ${livePresent.length}. ` +
    `Admitted by the heuristic and NOT by the tree — i.e. files that arrived after Round 256 and ` +
    `were let in anyway: ${onlyHeur.join(', ') || '(none)'}. The other way: ` +
    `${onlyTree.join(', ') || '(none)'}. Heuristic census: ${heur.cmp.length} / ` +
    `${heur.asserted.length}. Two different sets reaching one figure is exactly the condition ` +
    `under which a wrong instrument looks right.`);

// ─────────────────────────────────────────────────────────────────────────────
// §4 — E: the repair Round 259 §5 unblocked, driven BEFORE it is installed
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n§4 — the repair, measured before the file changes\n');

const liveNoSelf = allFiles.filter((r) => r !== SELF && !r.startsWith('probe-round256-'));
const before = censusOver(liveNoSelf, (r) => liveSrc.get(r)!);
const afterCmp = liveNoSelf.filter((r) => emptinessSitesWith(MASK_STRIP, liveSrc.get(r)!).length > 0);
const afterAsserted = afterCmp.filter(
  (r) => assertedSitesWith(MASK_STRIP, assertionArgumentSpansDelegated, liveSrc.get(r)!).length > 0);

meas('E1', "the repaired detector's live figure, known before probe-round256 is touched",
  `Over today's tree with probe-round256 SELF-excluded (${liveNoSelf.length} files): ` +
    `unrepaired reader ${before.cmp.length} / ${before.asserted.length}, repaired reader ` +
    `${afterCmp.length} / ${afterAsserted.length}. Round 256 published 13 / 10 over a smaller ` +
    `tree; these are LIVE figures over a bigger one and are not comparable to it — quoting them ` +
    `as "13 / 10 moved" would be the error C4 exists to prevent.`);

const flippedOut = before.asserted.filter((r) => !afterAsserted.includes(r));
const flippedIn = afterAsserted.filter((r) => !before.asserted.includes(r));
meas('E2', 'which files the repair changes its mind about',
  `Asserting under the old reader but not the new: ${flippedOut.join(', ') || '(none)'}. ` +
    `Asserting under the new but not the old: ${flippedIn.join(', ') || '(none)'}. ` +
    `Round 258 arm G2 measured exactly one verdict flip and arm J named the mechanism — a probe ` +
    `that MINTS a check() fixture as a string has its own test data read as a real assertion.`);

check('E3', 'the repair is a strict improvement on the flip Round 258 located, not a re-baseline',
  flippedIn.length === 0,
  `The repaired reader adds ${flippedIn.length} new assertions and removes ${flippedOut.length}. ` +
    `A repair to a masker should only ever REMOVE sites it was wrong to see (fixture text read as ` +
    `code); a site appearing only under the new reader would mean the delegation lost coverage, ` +
    `which is the failure mode this whole extraction was exposed to.`);

// ─────────────────────────────────────────────────────────────────────────────
// §5 — F: the same lesson, found in Daedalus's own Round 259 probe, from the other end
// ─────────────────────────────────────────────────────────────────────────────
//
// `probe-round259` restores the PRE-MOVE scanner to compare it against the post-move one, and it
// names that scanner's location as `git show HEAD:scripts/verify-tsx-guard.mjs`. That was true
// while he ran it — HEAD was still the commit before his own. His commit then landed, HEAD became
// it, and `HEAD:` started naming a file the scanner had just been moved OUT of. Arm A0's slice is
// now 0 bytes and the probe throws before it measures anything.
//
// He reported 17 · 2 · 0 · exit 0 and that was accurate at the time. The probe did not become
// wrong; the reference did. This is the same finding as C4/C6 above, reached from the opposite
// direction: `HEAD` and `^probe-round(\d+)-` are both ways of naming a fixed historical state with
// something that moves, and both hold right up until an ordinary later commit.
console.log('\n§5 — the same defect in his probe, and it is a moving reference not a bad measurement\n');

const R259_COMMIT = '27c5cac3';
const atHead = git(['show', 'HEAD:scripts/verify-tsx-guard.mjs']);
const atParent = git(['show', `${R259_COMMIT}~1:scripts/verify-tsx-guard.mjs`]);
const headHas = /const stripSource/.test(atHead);
const parentHas = /const stripSource/.test(atParent);

check('F1', "probe-round259's `git show HEAD:` no longer names a file containing the scanner it slices",
  !headHas && parentHas,
  `\`const stripSource\` present in scripts/verify-tsx-guard.mjs at HEAD: ${headHas}; at ` +
    `${R259_COMMIT}~1 (what HEAD was while he ran it): ${parentHas}. His arm A0 asserts the slice ` +
    `is non-empty and it is now 0 bytes, so the probe throws at the data: URL before measuring. ` +
    `Re-derived from the two trees, not from reading his output.`);

check('F2', 'the red is caused by his commit landing, not by anything Round 260 touched',
  git(['status', '--porcelain', '--', 'scripts/verify-tsx-guard.mjs', 'scripts/lib/strip-source.mjs'])
    .trim().length === 0,
  `Neither scripts/verify-tsx-guard.mjs nor scripts/lib/strip-source.mjs is modified in this ` +
    `working tree — this round touched probe-round256 and added this file. The only event between ` +
    `his green run and this red one is ${R259_COMMIT} becoming HEAD.`);

check('F3', 'a pinned hash is the instrument that survives the commit',
  /const stripSource/.test(git(['show', `${R259_COMMIT}~1:scripts/verify-tsx-guard.mjs`])),
  `The same slice taken at \`${R259_COMMIT}~1:\` instead of \`HEAD:\` still finds the scanner and ` +
    `will keep finding it for every future commit. One character class of change — a symbolic ` +
    `reference for a fixed one — and the arm stops having a fuse. Same remedy as C4/C6.`);

// ─────────────────────────────────────────────────────────────────────────────
// §6 — D: self-checks on this probe's own instrument
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n§6 — this probe grading itself\n');

check('D1', 'this probe does not enrol itself in anyone else\'s census',
  emptinessSitesWith(MASK_R256, liveSrc.get(SELF) ?? '').length === 0,
  `Round 258 arm J found probe-round258 had entered probe-round256's census through fixture ` +
    `strings. This file carries a porcelain call (the arm-Z fingerprint) but mints no ` +
    `comparison-to-empty-string fixture, so the detector finds ` +
    `${emptinessSitesWith(MASK_R256, liveSrc.get(SELF) ?? '').length} sites in it. Checked, not ` +
    `assumed — the check is cheap and the mistake was live one round ago.`);

check('D2', 'the restored pre-move reader is the real one, not a stub the extractor invented',
  preMoveMaskText.length > 400 && preMoveMaskText.includes("mode = 'line'")
    && !preMoveSrc.includes('strip-source'),
  `Extracted declaration is ${preMoveMaskText.length} chars and carries the Round 255 state ` +
    `machine ('line' mode). The pre-move file makes no reference to strip-source, confirming the ` +
    `commit predates the extraction. If declTextFrom had truncated, B2's red would be an ` +
    `artefact of the extractor rather than a property of the reader.`);

const realAfter = fingerprint('packages/');
check('Z', 'packages/ is byte-identical across this run',
  realBefore === realAfter,
  `Content fingerprint (Round 256's remedy: porcelain names paths, sha256 names contents) ` +
    `identical at open and close. This probe reads ${allFiles.length} files under scripts/ and ` +
    `writes exactly one, under gitignored .testdata/r260/ — nothing in packages/ or scripts/.`);

meas('Z0', 'state of packages/ at fire open is a measurement, not a grade',
  `Round 256's rule: an emptiness assertion over a shared window grades whoever touched it. ` +
    `Fingerprint at open: ${realBefore.slice(0, 40)}… — not this run's doing either way.`);

summariseAndExit({ probeName: SELF, results, skipped });
