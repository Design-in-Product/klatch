#!/usr/bin/env npx tsx
/**
 * Round 257 — `verify-tsx-guard.mjs`'s source scanner had no model of `${ … }`, and the control
 * that caught it had been red for four days with nothing scheduled to read it.
 *
 * ## What happened
 *
 * `stripSource` is the one comment/string/regex-aware reader every limb of `verify-tsx-guard.mjs`
 * runs on: `anchorsOf` finds import sites in its code reading, the guard-adoption verdict tests its
 * strings-blanked reading, and a parity precondition asserts that every quote surviving the blanked
 * reading is a real delimiter. It treated a template literal as a plain quoted span. So the
 * **opening** backtick of a nested template closed the outer one, and the rest of the line was read
 * as code. The regex heuristic then did the damage: between two substitutions, `${x.c}/${x.s}`
 * puts a `}` immediately before a `/`, `}` is in `REGEX_MAY_OPEN_AFTER`, and `regexLiteralEnd`
 * found a later `/` on the same line and blanked everything between them — the template's closing
 * backtick and any quotes with it.
 *
 * The file's own header argued this could not happen: *"a misfire needs punctuation-or-keyword
 * immediately before a division, which valid JS does not contain."* It said so while calling that
 * an argument rather than a measurement, and shipped the parity precondition as the measurement.
 * **The measurement was right and the argument was wrong.** The counterexample is not a division at
 * all — it is a `/` in template text the scanner should never have been reading as code.
 *
 * It went red on `probe-round233-arm-m-and-the-endpoint-can-walk-different-corpora.mts` the day
 * that file landed (2026-09-19) and stayed red until 2026-09-23, because `verify-tsx-guard.mjs` is
 * not in `npm test` and nothing schedules it. Found only because this fire ran every caller of
 * `explainTsxRequirement` under plain `node` on the way to doing something else.
 *
 * > **Rule: an argument that a heuristic is safe is a claim about the inputs it will see, and the
 * > inputs are a moving population. The control that outlives the argument is the one that reads
 * > the population on every run — and it is worth exactly as much as its chance of being run.**
 *
 * ## What this probe asserts, and why it mutates text rather than files
 *
 * The scanner is a private `const` inside a 1600-line script, so it is **extracted from the live
 * file by name** and evaluated — never reimplemented here. Theseus, Round 256 §3: *a control has to
 * call the same function the finding does; two implementations of one idea is a control that grades
 * its own twin.*
 *
 * The mutation drive then edits that **extracted string**, not the file on disk. Nothing under
 * `scripts/` or `packages/` is written, so this probe cannot leave the operator's tree dirty and
 * cannot be the thing that reddens somebody's emptiness assertion — which is Theseus's Round 256 §1
 * and my own Round 255 §5, both of which I caused.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = join(ROOT, 'scripts');
const VTG = join(SCRIPTS, 'verify-tsx-guard.mjs');
const VTG_SRC = readFileSync(VTG, 'utf8');

const results: ProbeVerdict[] = [];
const QUOTES = ["'", '"', '`'];

// ── Extracting the live scanner ────────────────────────────────────────────────────────────────
// By declaration name, never by line number. The first version of these diagnostics sliced fixed
// line spans, and my own repair then moved them — an extractor anchored on line numbers grades
// whatever happens to sit at those lines. Its second version looked only for `\n};` as a closer and
// ran a `new Set([…])` (which closes `]);`) straight through the next function; node refused the
// duplicate binding, which is the only reason that was a crash and not a silent wrong answer.
const CLOSERS = new Set(['};', ']);', ');', '];', '});']);

function declText(src: string, name: string): string {
  // Round 259: the scanner moved to `lib/strip-source.mjs` and its declarations are `export const`
  // there, so the anchor admits an optional `export`. The move made this probe THROW rather than
  // measure the wrong thing — the loud direction, and the reason the name-anchored extractor was
  // written in the first place.
  const start = [`\nexport const ${name} = `, `\nconst ${name} = `]
    .map((a) => src.indexOf(a))
    .find((n) => n !== -1) ?? -1;
  if (start === -1) throw new Error(`not found: const ${name}`);
  const lines = src.slice(start + 1).split('\n');
  if (lines[0].trimEnd().endsWith(';')) return lines[0];
  for (let k = 1; k < lines.length; k += 1) {
    if (CLOSERS.has(lines[k])) return lines.slice(0, k + 1).join('\n');
  }
  throw new Error(`unterminated: const ${name}`);
}

// Round 259: the scanner was extracted to `scripts/lib/strip-source.mjs`, so this reads it from
// there. The SCAN_ROWS table below stayed in `verify-tsx-guard.mjs` and is still read from VTG_SRC
// — the two halves of this probe now read two files, which is the point of the extraction.
const STRIP = join(SCRIPTS, 'lib/strip-source.mjs');
const STRIP_SRC = readFileSync(STRIP, 'utf8');
const SCANNER_PARTS = ['REGEX_MAY_OPEN_AFTER', 'REGEX_MAY_OPEN_AFTER_WORD', 'regexLiteralEnd', 'stripSource'];
// `export ` is stripped because this text is re-exported below under an explicit export list, and
// `export const stripSource` plus `export { stripSource }` is a duplicate-binding SyntaxError. Node
// refused it outright — the same loud-not-silent failure the CLOSERS note above records.
const scannerSource = SCANNER_PARTS
  .map((n) => declText(STRIP_SRC, n).replace(/^export /, ''))
  .join('\n');

type Strip = (src: string, blankStrings: boolean) => string;
async function loadScanner(text: string): Promise<Strip> {
  const mod = await import(`data:text/javascript,${encodeURIComponent(`${text}\nexport { stripSource };`)}`);
  return mod.stripSource as Strip;
}

const stripSource = await loadScanner(scannerSource);

// [A] The extraction reached the real thing. Without this, every arm below could be grading an
// empty string that trivially satisfies them.
results.push({
  arm: 'A',
  check: `the scanner was extracted from ${relative(ROOT, VTG)} by name (${scannerSource.length} chars, ${SCANNER_PARTS.length} declarations)`,
  pass: SCANNER_PARTS.every((n) => scannerSource.includes(`const ${n} = `))
    && scannerSource.includes('interp')
    && typeof stripSource === 'function',
  kind: 'regression',
});

// ── The population ─────────────────────────────────────────────────────────────────────────────
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const modules = walk(SCRIPTS).filter((p) => /\.(mjs|mts|js|ts)$/.test(p)).sort();

// [B] The parity property, re-derived here over the whole `scripts/` population rather than quoted
// from `verify-tsx-guard.mjs`'s own run. Every quote surviving the strings-blanked reading is a
// delimiter, delimiters pair, so an odd count means the scan ended with a span still open.
const unbalanced = modules.filter((p) => {
  const blanked = stripSource(readFileSync(p, 'utf8'), true);
  return QUOTES.some((q) => (blanked.split(q).length - 1) % 2 === 1);
});
results.push({
  arm: 'B',
  check: `no module under scripts/ is left with a string span open at end of file (${modules.length} walked): ${unbalanced.length ? unbalanced.map((p) => relative(SCRIPTS, p)).join(', ') : 'none'}`,
  pass: unbalanced.length === 0,
  kind: 'regression',
});

// [C] Offset preservation, which conjunct 2 of the anchor depends on. Asserted on the live
// population because the interpolation branches added this round emit their own characters.
const desynced = modules.filter((p) => {
  const src = readFileSync(p, 'utf8');
  return stripSource(src, false).length !== src.length || stripSource(src, true).length !== src.length;
});
results.push({
  arm: 'C',
  check: `both readings stay exactly as long as the input on every module (${modules.length} walked): ${desynced.length ? desynced.map((p) => relative(SCRIPTS, p)).join(', ') : 'none'}`,
  pass: desynced.length === 0,
  kind: 'regression',
});

// ── The mutation drive ─────────────────────────────────────────────────────────────────────────
// Four ways to get interpolation wrong, each aimed at a row of `SCAN_ROWS`. A mutation that no row
// catches is a row this round owes; a mutation that does not apply is a drive reporting on an
// unchanged subject, so every row asserts the text actually moved.
const MUTATIONS: { id: string; why: string; find: string; replace: string }[] = [
  {
    id: 'M1',
    why: 'never enter interpolation at all — the pre-repair scanner, restored verbatim',
    find: "      if (quote === '`' && c === '$' && src[i + 1] === '{') {",
    replace: "      if (false) {",
  },
  {
    id: 'M2',
    why: "open interpolation inside ANY string, not just a template",
    find: "      if (quote === '`' && c === '$' && src[i + 1] === '{') {",
    replace: "      if (c === '$' && src[i + 1] === '{') {",
  },
  {
    id: 'M3',
    why: 'let the escape branch stop winning, so `\\${` opens an interpolation',
    find: "      if (c === '\\\\') { out += '  '; i += 2; continue; }",
    replace: "      if (false) { out += '  '; i += 2; continue; }",
  },
  {
    id: 'M4',
    why: 'pop the interpolation on ANY `}`, ignoring brace depth',
    find: "    if (interp.length && c === '}' && interp[interp.length - 1] === 0) {",
    replace: "    if (interp.length && c === '}') {",
  },
];

// The fixture table, read out of the live file rather than retyped, so this drive and the rows it
// grades cannot drift apart.
const tableStart = VTG_SRC.indexOf('const SCAN_ROWS = [');
const tableText = VTG_SRC.slice(tableStart, VTG_SRC.indexOf('\n];', tableStart) + 3);
const SCAN_ROWS: [string, string, boolean][] =
  (await import(`data:text/javascript,${encodeURIComponent(`${tableText}\nexport { SCAN_ROWS };`)}`)).SCAN_ROWS;

const rowsPass = (strip: Strip) =>
  SCAN_ROWS.filter(([, src, wantCode]) => strip(src, true).includes('MARK') === wantCode).length;

const baseline = rowsPass(stripSource);
results.push({
  arm: 'D',
  check: `baseline: all ${SCAN_ROWS.length} SCAN_ROWS pass against the live scanner`,
  pass: baseline === SCAN_ROWS.length,
  kind: 'regression',
});

/**
 * Apply one mutation to the extracted scanner text.
 *
 * The replacer is a **function**, not a string, and that is not a style preference. `String.replace`
 * with a string replacement expands `$'` to "everything after the match" — and M2's replacement text
 * is `… c === '$' && …`, which contains exactly that sequence. The first run of this probe spliced
 * the entire tail of the function back in after its own closing brace and died on a syntax error.
 * It failed loudly only by luck; a mutation that mangles its subject and still parses is a drive
 * reporting on a file nobody wrote. Hence `mutate` returns the text and every caller checks it.
 */
function mutate(text: string, find: string, replace: string): string | null {
  if (!text.includes(find)) return null;
  const out = text.replace(find, () => replace);
  // The mutation must have moved the text AND landed the literal we asked for.
  if (out === text || !out.includes(replace)) return null;
  return out;
}

let caught = 0;
for (const m of MUTATIONS) {
  const mutantText = mutate(scannerSource, m.find, m.replace);
  let killedBy: string[] = [];
  if (mutantText) {
    const mutant = await loadScanner(mutantText);
    killedBy = SCAN_ROWS
      .filter(([, src, wantCode]) => mutant(src, true).includes('MARK') !== wantCode)
      .map(([label]) => label);
  }
  const ok = mutantText !== null && killedBy.length > 0;
  if (ok) caught += 1;
  results.push({
    arm: m.id,
    check: `${m.why} — applied=${mutantText !== null}, caught by ${killedBy.length} row(s)${killedBy.length ? `: ${killedBy.slice(0, 2).join(' | ')}` : ''}`,
    pass: ok,
    kind: 'regression',
  });
}

results.push({
  arm: 'E',
  check: `every mutation of the interpolation model is caught by at least one fixture row (${caught}/${MUTATIONS.length})`,
  pass: caught === MUTATIONS.length,
  kind: 'regression',
});

// [F] Measurement, not a check. How many modules did the pre-repair scanner actually read
// differently? This is the population the defect was live on — the parity control could only see
// the odd-parity subset of it, and said so ("necessary and not sufficient").
const preRepairText = mutate(scannerSource, MUTATIONS[0].find, MUTATIONS[0].replace);
if (preRepairText === null) throw new Error('[F] could not construct the pre-repair scanner — refusing to report a census from an unmutated subject');
const preRepair = await loadScanner(preRepairText);
// Three nested populations, because the outermost one on its own would be a misleading headline.
// ANY file containing `${` reads differently, by design — the repair's whole point is that
// interpolation is code where it used to be string body. That number says "the repair does
// something", not "the scanner was getting these wrong". The subsets below are the ones with a
// consequence attached.
const oddUnder = (strip: Strip, src: string) =>
  QUOTES.some((q) => (strip(src, true).split(q).length - 1) % 2 === 1);
const GUARD_CALL_RE = /explainTsxRequirement\s*\(/;

const differs: string[] = [];
const parityFlipped: string[] = [];
const verdictFlipped: string[] = [];
for (const p of modules) {
  const src = readFileSync(p, 'utf8');
  const name = relative(SCRIPTS, p);
  if (preRepair(src, true) !== stripSource(src, true) || preRepair(src, false) !== stripSource(src, false)) differs.push(name);
  if (oddUnder(preRepair, src) !== oddUnder(stripSource, src)) parityFlipped.push(name);
  if (GUARD_CALL_RE.test(preRepair(src, true)) !== GUARD_CALL_RE.test(stripSource(src, true))) verdictFlipped.push(name);
}
console.log(`[F] modules read differently at all (expected — every `);
console.log(`    interpolation changes side): ${differs.length} of ${modules.length}`);
console.log(`[F] modules whose end-of-file string parity flips: ${parityFlipped.length}${parityFlipped.length ? ` — ${parityFlipped.join(', ')}` : ''}`);
console.log(`[F] modules whose guard-adoption verdict flips:    ${verdictFlipped.length}${verdictFlipped.length ? ` — ${verdictFlipped.join(', ')}` : ''}`);
results.push({
  arm: 'F',
  check: `population: ${differs.length}/${modules.length} read differently (by design), ${parityFlipped.length} with a parity flip — the only subset the old control could ever have seen — and ${verdictFlipped.length} with a changed guard-adoption verdict`,
  pass: true,
  kind: 'measurement',
});

summariseAndExit({ probeName: 'probe-round257-the-scanner-had-no-model-of-interpolation', results });
