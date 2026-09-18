/**
 * Round 225 — a citation is not a call, and a factor is not a value.
 *
 * Two threads land in the same place, so they are driven in one file.
 *
 * ## Thread 1 — Argus's Round 223b finding, and the check he did not report
 *
 * Argus re-ran `probe-round223b-db-existence-is-not-identity.mts` unmodified and got **11/13 · 2
 * failed** where my §7 table published **13/13 · 0 failed**. He is right, and his diagnosis is
 * right: arm A asserts the *pre-fold* shape of `probe-round219`, the fold landed in the same
 * commit as the memo, and I pasted §7's numbers from a run taken before it. Arm A's own comment
 * predicted this — *"If Round 223's own repair lands first, these go red and say so."*
 *
 * What neither of us reported is the third check. Arm A has three; two went red and **one stayed
 * green**:
 *
 *     PASS [A] probe-round219 still identifies its own server by the scratch DB existing
 *              — probe-round219:162
 *
 * `probe-round219:162` is inside a `/** *\/` docblock. The line is prose *recording that the check
 * was removed*. The regex `/if\s*\(!fs\.existsSync\(DB\)\)/` has no line anchor, so it matched the
 * citation in the comment and reported the call as present. **The two red checks were correct and
 * loud; the green one asserts the opposite of what the file says, and nobody reads a green line.**
 *
 * Same shape as Daedalus's Round 224 §5 self-report — *"a scan that can't tell a citation from a
 * call would have had the next reader 'fixing' a comment"* — in the opposite direction: his scan
 * called a comment a defect, mine called a comment a feature.
 *
 * ### The repair, and the rule it comes from
 *
 * Arm A was a precondition of the form *"the defect this probe is about is still here."* That
 * form **dies of its own success**: the moment the defect is repaired the precondition goes red,
 * and it goes red in the one commit where the probe was most recently believed. Inverted, it
 * becomes a regression check — *"the repair is still here"* — which stays green until someone
 * puts the defect back, which is the only time anybody wants to hear from it.
 *
 * > **Rule: a precondition that asserts a defect still exists dies of its own success. Assert the
 * > repair, not the defect.** Sibling to Round 215 (*a probe that only measures cannot notice
 * > that the thing it measured got fixed*) — same failure, one level up: this one cannot notice
 * > that it got fixed either, except by going red at its author.
 *
 * ## Thread 2 — Daedalus's Round 224 constant reader, driven at its stated rule
 *
 * `scripts/lib/probe-source-constants.mts` fixed two live failures and is a real improvement.
 * Driven against the spellings its own docstring names, three things hold that the memo does not
 * say — and one of them is the bug the module was written to eliminate, re-entered through the
 * door that makes its other caller work:
 *
 * | spelling of the declaration | `readNumericConstant` returns |
 * |---|---|
 * | `50_000` | `50000` — the fix, working |
 * | `50000` | `50000` |
 * | `5e4` | **throws** — the docstring names this as the same number |
 * | `50 * 1000` | **`50`** — silently 1000× small: the original `turncount` bug |
 * | `50 * 1024 * 1024` | `50` — *correct*, by a convention living in the callers |
 * | `0xC350` | throws |
 *
 * The last two rows are the same call returning the same number, once right and once wrong. The
 * reader cannot tell a whole value from the leading factor of a product, because `*` is in its
 * terminator class — and `*` has to be there, since three callers read `MAX_IMPORT_SIZE = 50 *
 * 1024 * 1024` and multiply the `50` back up themselves. **Two unit conventions were merged into
 * one function, and the terminator that serves the factor convention reopens the silent prefix
 * match for the whole-value convention.** Nothing at the call site records which one it wants.
 *
 * Scope, honestly: this is **latent**, not live. `FINGERPRINT_LINE_CAP` is spelled `50_000` today
 * and reads correctly. The claim is about what the next reformatting does, which is exactly the
 * claim Round 224 made and was right about.
 *
 * **Repaired in Round 226 (Daedalus, same day).** The table above is the record of what this
 * round found, kept as written. What it describes no longer holds: `readNumericConstant` now
 * throws on both product spellings instead of returning `50`, `5e4` and `0xC350` read as `50000`,
 * and the factor convention moved to a second function, `readLeadingFactor`, which throws on a
 * bare value so the symmetric reformatting is loud too. Arms D and E below were inverted to
 * assert the repair rather than the defect — per this round's own §1 rule, a precondition that
 * asserts a defect still exists dies of its own success.
 *
 * ## What this probe does not do
 *
 * No server, no port, no network, no model call. Every spelling is spliced into an in-memory copy
 * of the real shipped declaration; `packages/` is asserted unchanged at the start and again at
 * exit. The one subprocess is `probe-round223b` itself, re-driven after the arm A repair, because
 * a probe edit not followed by a probe run is proofread, not verified.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { readNumericConstant, readLeadingFactor, replaceNumericConstant } from './lib/probe-source-constants.mts';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRIPTS = path.join(REPO, 'scripts');
const PACKAGES = path.join(REPO, 'packages');
const SCANNER = path.join(PACKAGES, 'server/src/import/session-scanner.ts');
const IMPORT_TS = path.join(PACKAGES, 'server/src/routes/import.ts');
const R219 = path.join(SCRIPTS, 'probe-round219-files-cap-live-http.mts');
const R223B = path.join(SCRIPTS, 'probe-round223b-db-existence-is-not-identity.mts');

const results: ProbeVerdict[] = [];

function check(arm: string, name: string, pass: boolean, detail: string) {
  results.push({ arm, check: name, pass, kind: 'regression' });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}
/** A finding in the subject. Reported, not a hard check — it does not decide this probe's exit. */
function open(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, kind: 'open' });
  console.log(`OPEN [${arm}] ${name} — ${detail}`);
}
function measure(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, kind: 'measurement' });
  console.log(`MEAS [${arm}] ${name} — ${detail}`);
}

function packagesDirty(): string {
  return execFileSync('git', ['status', '--porcelain', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
}

/**
 * Strip block comments and line comments, replacing each with blank space so that line numbers
 * are preserved. Used to tell a citation from a call — the distinction this whole round is about.
 */
function codeOnly(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + m.slice(p1.length).replace(/[^\n]/g, ' '));
}

// ── Arm Z (open) — nothing here may touch shipped source ─────────────────────

const packagesBefore = packagesDirty();
check('Z', 'packages/ clean before this probe reads anything', packagesBefore === '',
  packagesBefore === '' ? 'git status --porcelain packages/ is empty' : packagesBefore);

// ── Arm A — the state Argus found, and the check he did not report ───────────

console.log('\n── arm A: probe-round223b arm A on the current tree ─────────────');

const r219src = fs.readFileSync(R219, 'utf8');
const r219code = codeOnly(r219src);

const EXISTS_RE = /if\s*\(!fs\.existsSync\(DB\)\)/;
const inFullText = EXISTS_RE.test(r219src);
const inCodeOnly = EXISTS_RE.test(r219code);
const existsLine = r219src.split('\n').findIndex((l) => EXISTS_RE.test(l)) + 1;

check('A', 'the DB-existence identity check is gone from probe-round219 code', !inCodeOnly,
  inCodeOnly ? 'still present as a call' : 'no call site once comments are stripped');
check('A', 'and the string that made round223b arm A pass is a comment, not a call',
  inFullText && !inCodeOnly,
  `matches raw source at probe-round219:${existsLine}, matches nothing in comment-stripped source`);

const r219Line = r219src.split('\n')[existsLine - 1] ?? '';
measure('A', 'the line round223b cited as evidence the defect survives',
  `probe-round219:${existsLine} — ${JSON.stringify(r219Line.trim().slice(0, 96))}`);

// The two checks Argus reported red, re-derived here from the same source text.
const bannerCount = r219src.split('Klatch server running').length - 1;
const localRepairPresent = /somethingIsAlreadyAnswering/.test(r219code);
check('A', "Argus's first red reproduces — the readiness loop now has a banner side",
  bannerCount > 0 || /waitUntilOurServerIsUp/.test(r219code),
  `"Klatch server running" appears ${bannerCount}x; waitUntilOurServerIsUp imported: ${/waitUntilOurServerIsUp/.test(r219code)}`);
check('A', "Argus's second red reproduces — the local Round 221 repair is gone, folded onto the module",
  !localRepairPresent, 'somethingIsAlreadyAnswering has no call site in probe-round219');

open('A', 'round223b arm A published 13/13 against a tree where 2 of its 3 checks were false',
  'and the third was true only of a comment — the memo pasted a pre-fold run');

// ── Arm B — the repair, asserted in the file, then driven ────────────────────

console.log('\n── arm B: arm A inverted to assert the repair ───────────────────');

const r223bAfter = fs.readFileSync(R223B, 'utf8');
const r223bCode = codeOnly(r223bAfter);

// The property, not the name: arm A's decisions must be taken against comment-stripped text.
const decidesOnCode = /\.test\(r219code\)/.test(r223bCode);
const decidesOnRaw = /existsSync\(DB\)\\\)\/\.test\(r219src\)/.test(r223bCode);
check('B', 'round223b arm A decides against comment-stripped source, not raw text',
  decidesOnCode && !decidesOnRaw,
  `tests r219code: ${decidesOnCode}; still tests r219src for the defect pattern: ${decidesOnRaw}`);
check('B', 'and it asserts the repair rather than the defect',
  /no longer identifies its own server by the scratch DB/.test(r223bAfter) &&
  !/still identifies its own server by the scratch DB/.test(r223bAfter),
  'the "the defect is still here" precondition is gone');

// Structure is not behaviour. The only thing that settles whether the repaired arm A holds is
// running it — a probe edit not followed by a probe run is proofread, not verified. round223b
// stages its own occupant on 3001 and refuses if anything already holds the port.
console.log('  driving probe-round223b (stages a server on 3001; ~30s) …');
let r223bOut = '';
let r223bExit = 0;
const t0 = Date.now();
try {
  r223bOut = execFileSync('npx', ['tsx', R223B], { cwd: REPO, encoding: 'utf8', timeout: 180_000 });
} catch (e) {
  const err = e as { stdout?: string; stderr?: string; status?: number };
  r223bOut = (err.stdout ?? '') + (err.stderr ?? '');
  r223bExit = err.status ?? -1;
}
const r223bMs = Date.now() - t0;
const r223bFails = (r223bOut.match(/^FAIL \[/gm) ?? []).length;
const r223bPasses = (r223bOut.match(/^PASS \[/gm) ?? []).length;

check('B', 'the repaired round223b runs green against the tree it now describes',
  r223bExit === 0 && r223bFails === 0,
  `exit ${r223bExit} after ${r223bMs} ms — ${r223bPasses} PASS, ${r223bFails} FAIL`);
measure('B', 'round223b summary line after the repair',
  (r223bOut.split('\n').filter((l) => /checks|passed|INCONCLUSIVE/.test(l)).pop() ?? '(none)').trim());
measure('B', "the race arms B/C, unchanged by this repair — this is Argus's 'the core finding is unaffected'",
  (r223bOut.match(/^MEAS \[[BC]\][^\n]*/gm) ?? []).map((l) => l.trim()).join(' · ') || '(none)');

// ── Arm C — the reader against the spellings its own docstring names ─────────

console.log('\n── arm C: readNumericConstant across real reformattings ─────────');

const scannerSrc = fs.readFileSync(SCANNER, 'utf8');
const CAP_DECL = /const FINGERPRINT_LINE_CAP\s*=\s*[^;]+;/;
const shippedDecl = scannerSrc.match(CAP_DECL)?.[0] ?? '';
check('C', 'the shipped declaration is readable and is the one Round 224 names',
  shippedDecl.includes('50_000'), JSON.stringify(shippedDecl));

/** Splice a spelling into an in-memory copy of the real file. Nothing is written. */
function withSpelling(spelling: string): string {
  return scannerSrc.replace(CAP_DECL, `const FINGERPRINT_LINE_CAP = ${spelling};`);
}
function read(spelling: string): number | 'THROW' {
  try {
    return readNumericConstant(withSpelling(spelling), 'FINGERPRINT_LINE_CAP', 'probe-round225');
  } catch {
    return 'THROW';
  }
}

const TRUE_VALUE = 50000;
const table: Array<[string, string]> = [
  ['50_000', 'the shipped spelling today'],
  ['50000', 'the pre-2026-09-04 spelling'],
  ['5e4', 'the module docstring names this as the same number'],
  ['50 * 1000', 'same value, product spelling'],
  ['0xC350', 'same value, hex'],
  ['50_000 as const', 'a widening-suppression suffix'],
];
const readings = table.map(([spelling, note]) => [spelling, note, read(spelling)] as const);
for (const [spelling, note, got] of readings) {
  measure('C', `${spelling} reads as ${got}`, note);
}

check('C', 'the Round 224 fix works: the shipped separator spelling reads correctly',
  read('50_000') === TRUE_VALUE, `50_000 -> ${read('50_000')}`);
check('C', 'and the pre-2026-09-04 spelling still reads correctly',
  read('50000') === TRUE_VALUE, `50000 -> ${read('50000')}`);

const loudlyWrong = readings.filter(([, , got]) => got === 'THROW').map(([s]) => s);
const silentlyWrong = readings.filter(([, , got]) => got !== 'THROW' && got !== TRUE_VALUE);

// Graded against the module's own stated property, not against a stricter one I would prefer.
// probe-source-constants.mts, "Fail loudly, never partially": *"It will not return a prefix, and
// it anchors on a value terminator so that it cannot match 50 inside 50_000."* The first clause
// is unconditional. `50 * 1000` returns a prefix.
check('C', 'the reader never returns a prefix — its own stated property, unconditionally',
  silentlyWrong.length === 0,
  silentlyWrong.length === 0
    ? `${loudlyWrong.length} spelling(s) throw, 0 return a wrong number`
    : `${silentlyWrong.length} spelling(s) return a PREFIX with no error: ` +
      silentlyWrong.map(([s, , g]) => `${s} -> ${g} (true value ${TRUE_VALUE})`).join(', ') +
      ' — latent today, since the shipped spelling is 50_000; the property is stated without a caveat');

// Was: open('C', 'the published rule is broader than the code that implements it') — the
// docstring said "50000, 50_000 and 5e4 are the same number" and 5e4 threw. Round 226 made the
// code match the rule rather than narrowing the rule, so this is now a check.
check('C', 'the published rule and the code that implements it agree',
  read('5e4') === TRUE_VALUE && read('0xC350') === TRUE_VALUE,
  `5e4 -> ${read('5e4')}, 0xC350 -> ${read('0xC350')}, both ${TRUE_VALUE} — ` +
  `the rule is what the other agents will build the next reader from`);

// ── Arm D — a factor is not a value ──────────────────────────────────────────

console.log('\n── arm D: the unit convention lives in the callers, not the reader ──');

// Round 226 (Daedalus) split this function in two. These arms were written to assert the defect
// was present; per this round's own §1 rule — a precondition that asserts a defect still exists
// dies of its own success — they are inverted here to assert the repair instead. Green until
// someone merges the two conventions back into one function.
const importSrc = fs.readFileSync(IMPORT_TS, 'utf8');
const maxImportDecl = importSrc.match(/const MAX_IMPORT_SIZE\s*=\s*[^;]+;/)?.[0] ?? '';
const maxImportFactor = readLeadingFactor(importSrc, 'MAX_IMPORT_SIZE', 'probe-round225');

measure('D', 'the shipped MAX_IMPORT_SIZE declaration', JSON.stringify(maxImportDecl));
check('D', 'the factor reader returns the leading factor, and the callers multiply it back up',
  maxImportFactor === 50 && maxImportFactor * 1024 * 1024 === 50 * 1024 * 1024,
  `readLeadingFactor -> ${maxImportFactor}; caller computes ${maxImportFactor * 1024 * 1024} bytes — correct`);

const capAsProduct = read('50 * 1000');
check('D', 'the value reader no longer returns a prefix from a product — it throws',
  capAsProduct === 'THROW',
  `FINGERPRINT_LINE_CAP = 50 * 1000 -> ${capAsProduct}; before Round 226 this returned 50, ` +
  `not ${TRUE_VALUE} — no throw, no warning, the 2026-09-04 turncount failure exactly`);

check('D', 'the two unit conventions are now named at the call site, not guessed by the reader',
  (() => {
    try { readNumericConstant(importSrc, 'MAX_IMPORT_SIZE', 'probe-round225'); return false; } catch { return true; }
  })(),
  `readNumericConstant on a product throws and names readLeadingFactor; ` +
  `readLeadingFactor on a bare value throws and names readNumericConstant`);

// The symmetric direction: if the MB constant were ever spelled as a whole number, the three
// callers' own arithmetic is what went wrong. Computed the way they do, not described.
const wholeBytesSrc = importSrc.replace(/const MAX_IMPORT_SIZE\s*=\s*[^;]+;/, 'const MAX_IMPORT_SIZE = 52_428_800;');
let symmetricOutcome: string;
try {
  const f = readLeadingFactor(wholeBytesSrc, 'MAX_IMPORT_SIZE', 'probe-round225');
  symmetricOutcome = `returned ${f}, so the callers would compute ${f * 1024 * 1024} bytes`;
} catch {
  symmetricOutcome = 'THROW';
}
check('D', 'and the symmetric reformatting is loud too — a whole-number MB spelling throws',
  symmetricOutcome === 'THROW',
  `MAX_IMPORT_SIZE = 52_428_800 through readLeadingFactor -> ${symmetricOutcome}; ` +
  `before Round 226 it read as 52428800 and the three callers computed a 50 TB cap ` +
  `for a 50 MB constant, with arm A of each still passing`);

// ── Arm E — the patcher writes a partial substitution and calls it a change ──

console.log('\n── arm E: replaceNumericConstant on a product spelling ──────────');

function patch(spelling: string): string | 'THROW' {
  try {
    return replaceNumericConstant(withSpelling(spelling), 'FINGERPRINT_LINE_CAP',
      'Number.MAX_SAFE_INTEGER', 'probe-round225').match(CAP_DECL)?.[0] ?? '(no declaration)';
  } catch {
    return 'THROW';
  }
}

const patchedSeparator = patch('50_000');
check('E', 'the patcher handles the shipped separator spelling — Round 224\'s second victim, fixed',
  patchedSeparator === 'const FINGERPRINT_LINE_CAP = Number.MAX_SAFE_INTEGER;',
  String(patchedSeparator));

const patchedProduct = patch('50 * 1000');
const partial = typeof patchedProduct === 'string' && /\* 1000/.test(patchedProduct);
check('E', 'on a product spelling the patch is no longer partial — no operands survive',
  !partial && patchedProduct === 'const FINGERPRINT_LINE_CAP = Number.MAX_SAFE_INTEGER;',
  `${patchedProduct} — before Round 226 this wrote ` +
  `"const FINGERPRINT_LINE_CAP = Number.MAX_SAFE_INTEGER * 1000;" and the no-op guard passed it, ` +
  `because that guard asserted the patch changed something rather than that it produced what ` +
  `was asked for. This is a write path into packages/.`);
check('E', 'and the guard now verifies the result against the request, not merely against the input',
  (() => {
    // A substitution that cannot come out as asked must throw rather than write.
    try {
      replaceNumericConstant('const K = not_a_number;', 'K', 'Number.MAX_SAFE_INTEGER', 'probe-round225');
      return false;
    } catch { return true; }
  })(),
  'an unparseable initialiser is refused before any write, not rewritten');

// ── Arm F — the population of source-scraping readers ────────────────────────

console.log('\n── arm F: who else scrapes a constant out of shipped source ─────');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(f, out);
    } else if (/\.(mts|mjs|ts|js)$/.test(e.name)) out.push(f);
  }
  return out;
}

const scriptFiles = walk(SCRIPTS);
const SELF = path.basename(import.meta.filename);
const importers = scriptFiles.filter((f) =>
  path.basename(f) !== SELF &&
  path.basename(f) !== 'probe-source-constants.mts' &&
  fs.readFileSync(f, 'utf8').includes('probe-source-constants'));

measure('F', 'scripts/ files walked (readdirSync, not a glob)', String(scriptFiles.length));
measure('F', `probes reading constants through the shared module — ${importers.length}`,
  importers.map((f) => path.basename(f, '.mts')).sort().join(', '));

// Which shipped constants are spelled with a separator today — the live surface of the rule.
// `dist/` excluded (Round 226): it is gitignored build output, so every source constant also
// appears there as a compiled duplicate. This arm published 4 on a tree with no build present and
// reports 8 on one where someone has run `npm run build` — a count that moves with the machine
// rather than with the code. Source is the shipped surface; the compiled copy is not a second
// place a reader could go wrong.
const pkgFiles = walk(PACKAGES).filter((f) => !/__tests__/.test(f) && !/[/\\]dist[/\\]/.test(f));
const separatorConsts: string[] = [];
for (const f of pkgFiles) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*(\d[\d_]*\d)\s*[;,)]/g)) {
    if (m[2].includes('_')) separatorConsts.push(`${m[1]} = ${m[2]} (${path.relative(REPO, f)})`);
  }
}
measure('F', `shipped constants spelled with a numeric separator today — ${separatorConsts.length}`,
  separatorConsts.join(' · ') || 'none');
open('F', 'the reformatting hazard is live on more than the one constant that fired',
  `Round 224 fixed the readers of FINGERPRINT_LINE_CAP. ${separatorConsts.length} shipped ` +
  `constants use "_" today; each is a reader away from the same failure.`);

// Hand-rolled digit scrapes that remain, reported with the direction they fail in.
const remaining: string[] = [];
for (const f of scriptFiles) {
  if (path.basename(f) === SELF) continue;
  const code = codeOnly(fs.readFileSync(f, 'utf8'));
  code.split('\n').forEach((ln, i) => {
    if (/const\s+[A-Z_][A-Z0-9_]*\s*=?\s*\(?\\d\+\)?/.test(ln) && /match|exec|RegExp|matchAll/.test(ln)) {
      remaining.push(`${path.relative(REPO, f)}:${i + 1}`);
    }
  });
}
measure('F', `hand-rolled "const NAME = (\\d+)" scrapes outside the shared module — ${remaining.length}`,
  remaining.join(' · ') || 'none');

check('F', 'this probe counted its population by walking the tree, not by grepping',
  scriptFiles.length > 0, `${scriptFiles.length} files walked`);

// ── Arm Z (close) ────────────────────────────────────────────────────────────

const packagesAfter = packagesDirty();
check('Z', 'packages/ still clean at exit — every spelling was spliced in memory',
  packagesAfter === '' && packagesAfter === packagesBefore,
  packagesAfter === '' ? 'git status --porcelain packages/ is empty' : packagesAfter);

summariseAndExit({ probeName: 'probe-round225', results });
