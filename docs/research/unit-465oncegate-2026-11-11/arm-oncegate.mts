/**
 * unit-465oncegate — grading the gate leg `scripts/probe-once-anchor-duplication.mts` that Argus
 * promoted on 2026-11-11 (`b942aa49`, SWEPT 45).
 *
 * Two claims are under test, both about the PROMOTED FILE'S OWN PROSE rather than its predicate:
 *
 *   P1/P2 — the docblock's "Three of those standing anchors are live in this file's own population
 *           today", against `unit-465plant` §5's own key (flagged declarations) and against the two
 *           re-keyings that could rescue it (distinct values, distinct names).
 *   P3/P4 — the population selector's `.mjs` extension branch, which cannot be satisfied in
 *           conjunction with an `ONCE_HELPER` string carrying TypeScript type annotations.
 *
 * R3 (no number typed into an instrument; no reader re-implemented): the `flagsIn` apparatus is
 * SLICED out of the subject's own source at run time and imported — never re-typed. The slice span
 * is asserted non-empty and the import asserted to have produced a callable, so a failed slice
 * cannot read as a clean arm. Likewise `ONCE_HELPER` is sliced from the subject's own defining line
 * and the typed helper text is sliced from a real population member; the only derived text is the
 * annotation-stripped variant, which is produced by deletion from the slice and asserted to differ
 * from it (an unchanged "stripped" text would make P3's negative vacuous).
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SUBJECT = join(SCRIPTS, 'probe-once-anchor-duplication.mts');

const lines: string[] = [];
const say = (s: string) => { lines.push(s); console.log(s); };
let fails = 0;
const check = (id: string, claim: string, pass: boolean) => {
  if (!pass) fails++;
  say(`${pass ? '[ok]  ' : 'FAIL  '} ${id}  ${claim}`);
};

say(`# unit-465oncegate recording`);
say(`subject-rev: ${execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}`);
say(`subject-blob: ${execFileSync('git', ['-C', REPO, 'hash-object', SUBJECT], { encoding: 'utf8' }).trim()}`);
say(`driven-at: ${new Date().toISOString()}`);
say('');

const subjectSrc = readFileSync(SUBJECT, 'utf8');

// ── slice the apparatus out of the subject, verbatim ─────────────────────────────────────────────

const SLICE_START = 'const occ =';
const SLICE_END = '// ── Section A';
const a = subjectSrc.indexOf(SLICE_START);
const b = subjectSrc.indexOf(SLICE_END);
check('S1', `the apparatus span [${SLICE_START} .. Section A) is locatable in the subject — a failed `
  + 'slice must not read as a clean arm', a >= 0 && b > a);
if (a < 0 || b <= a) { say('ABORT: slice span not found'); process.exit(2); }
const apparatus = subjectSrc.slice(a, b);
say(`[MEAS] S1  apparatus slice: ${Buffer.byteLength(apparatus, 'utf8')} utf8 bytes, ${apparatus.split('\n').length} lines`);

const scratch = join(HERE, '.scratch');
mkdirSync(scratch, { recursive: true });
const appPath = join(scratch, 'apparatus-sliced.mts');
// The ONLY text added to the slice is the export line; nothing in the slice is edited.
writeFileSync(appPath, apparatus + '\nexport { occ, literalDecls, consumedByOnce, flagsIn };\n');

const mod = await import(appPath);
type Flag = { name: string; value: string; line: number; occ: number; chain: string[] };
const flagsIn = mod.flagsIn as (src: string) => Flag[];
check('S2', 'the sliced apparatus imports and exposes a callable flagsIn — the reader under every '
  + 'figure below is the subject\'s own, not a re-implementation', typeof flagsIn === 'function');

// ── slice the population selector's own ONCE_HELPER definition ───────────────────────────────────

const helperLine = subjectSrc.split('\n').find((l) => l.trimStart().startsWith('const ONCE_HELPER ='));
check('S3', 'the subject\'s ONCE_HELPER defining line is locatable and sliced, not retyped',
  helperLine !== undefined);
if (helperLine === undefined) { say('ABORT: ONCE_HELPER line not found'); process.exit(2); }
// eslint-disable-next-line no-new-func -- evaluating the subject's own one-line array-join, sliced
const ONCE_HELPER = new Function(`${helperLine.trim().replace(/^const /, 'const ')} return ONCE_HELPER;`)() as string;
say(`[MEAS] S3  ONCE_HELPER (sliced, ${ONCE_HELPER.length} chars): ${JSON.stringify(ONCE_HELPER)}`);

// ── the live population, by the subject's own selector ───────────────────────────────────────────

const SELF = 'probe-once-anchor-duplication.mts';
const probeFiles = readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f) && (f.endsWith('.mts') || f.endsWith('.mjs')));
const population = probeFiles
  .filter((f) => f !== SELF)
  .filter((f) => readFileSync(join(SCRIPTS, f), 'utf8').includes(ONCE_HELPER))
  .sort();
say(`[MEAS] POP  probe-* files: ${probeFiles.filter((f) => f.endsWith('.mts')).length} .mts + `
  + `${probeFiles.filter((f) => f.endsWith('.mjs')).length} .mjs · population (ONCE_HELPER holders): ${population.length}`);

// ── P1 / P2 — the docblock's "Three ... are live", under three candidate keys ────────────────────

const live = population.flatMap((f) => flagsIn(readFileSync(join(SCRIPTS, f), 'utf8')).map((fl) => ({ file: f, ...fl })));
const distinctValues = new Set(live.map((f) => f.value));
const distinctNames = new Set(live.map((f) => f.name));
const perFile = population.map((f) => `${f.slice(0, 18)}=${live.filter((x) => x.file === f).length}`);

say(`[MEAS] P1   live flagged declarations: ${live.length}  (${perFile.join(' ')})`);
say(`[MEAS] P2   distinct values: ${distinctValues.size} · distinct names: ${distinctNames.size}`);
for (const f of live) say(`[MEAS] P2     ${f.file.slice(0, 18)} ${f.name.padEnd(22)} occ=${f.occ} value=${JSON.stringify(f.value).slice(0, 72)}`);

const DOCBLOCK_CLAIM = 'Three of those standing anchors are live in this file’s own population today';
const docblockHasClaim = subjectSrc.includes('Three of those standing anchors are live');
check('P0', 'the docblock sentence under test is present in the subject as quoted (so P1/P2 are '
  + 'about live text, not a recollection of it)', docblockHasClaim);

check('P1', `under unit-465plant §5's own key (flagged declarations) the live figure is NOT 3, so the `
  + `docblock's "Three ... are live" is false under the key it cites (live=${live.length})`, live.length !== 3);
check('P2', `the sentence is not rescued by re-keying to distinct values (${distinctValues.size}) or `
  + `distinct names (${distinctNames.size}) either — neither is 3`,
  distinctValues.size !== 3 && distinctNames.size !== 3);
check('P2b', 'the sentence IS reconcilable per-file (every population member contributes the same '
  + 'number of flags), which is the charitable reading and the one the cure should make explicit',
  population.length > 0 && new Set(population.map((f) => live.filter((x) => x.file === f).length)).size === 1);

// ── P3 — the .mjs branch and the typed-annotation conjunct are mutually unsatisfiable ────────────

const donor = population[0];
const donorSrc = readFileSync(join(SCRIPTS, donor), 'utf8');
const hIdx = donorSrc.indexOf(ONCE_HELPER);
check('S4', `the typed helper text is sliceable verbatim from a real population member (${donor.slice(0, 18)})`, hIdx >= 0);
const typedHelper = donorSrc.split('\n').slice(donorSrc.slice(0, hIdx).split('\n').length - 1, donorSrc.slice(0, hIdx).split('\n').length + 5).join('\n');
say(`[MEAS] S4  typed helper slice (${typedHelper.split('\n').length} lines):`);
for (const l of typedHelper.split('\n')) say(`[MEAS] S4    ${l}`);

// The ONLY derived text in this unit: the same slice with TypeScript annotations deleted — what a
// `.mjs` copier of this helper necessarily looks like, since `: string` is not valid in `.mjs`.
const untypedHelper = typedHelper.replace(/: string/g, '');
check('S5', 'the annotation-stripped variant actually differs from the slice it was derived from — '
  + 'an unchanged "stripped" text would make P3\'s negative vacuous', untypedHelper !== typedHelper);
say(`[MEAS] S5  untyped variant first line: ${JSON.stringify(untypedHelper.split('\n')[0])}`);

check('P3a', 'MATCHED POSITIVE — the typed helper slice satisfies the subject\'s ONCE_HELPER '
  + 'conjunct, so P3b\'s negative is a statement about the selector and not about a broken slice',
  typedHelper.includes(ONCE_HELPER));
check('P3b', 'the annotation-stripped helper — i.e. any `.mjs` copy of the same six-line function — '
  + 'does NOT satisfy the ONCE_HELPER conjunct, so the selector\'s `.mjs` extension branch is '
  + 'unsatisfiable by construction', !untypedHelper.includes(ONCE_HELPER));

// A second, same-extension fragility worth separating from the .mjs claim: reformatting inside .mts
const wrappedHelper = typedHelper.replace(
  'const once = (src: string, from: string, to: string) => {',
  'const once = (\n  src: string,\n  from: string,\n  to: string,\n) => {',
);
check('S6', 'the reformatted variant differs from the slice it was derived from', wrappedHelper !== typedHelper);
check('P3c', 'a `.mts` copier whose helper is merely RE-WRAPPED across lines (the default of any '
  + 'formatter at a narrower print width) is also outside the population — the gap is not only '
  + 'about `.mjs`', !wrappedHelper.includes(ONCE_HELPER));

// ── P4 — does the gap bite today? Census the real tree, don't reason about it ────────────────────

const mjs = probeFiles.filter((f) => f.endsWith('.mjs'));
const ONCE_DECL = /^(?:export\s+)?(?:const\s+once\s*=|function\s+once\s*\()/m;
const mjsHolders = mjs.filter((f) => ONCE_DECL.test(readFileSync(join(SCRIPTS, f), 'utf8')));
const anyHolders = probeFiles.filter((f) => ONCE_DECL.test(readFileSync(join(SCRIPTS, f), 'utf8')));
say(`[MEAS] P4   probe-*.mjs files: ${mjs.length} · of those, declaring a top-level once(): ${mjsHolders.length}`);
say(`[MEAS] P4   probe-* files declaring a top-level once() under ANY spelling: ${anyHolders.length} `
  + `· population reached by the selector: ${population.length}`);
check('P4', 'no `probe-*.mjs` declares a once() helper today, so P3 is a REACH limitation of the '
  + 'docblock\'s automatic-coverage claim, not a live blindness — stated rather than overclaimed',
  mjsHolders.length === 0);
check('P4b', 'and the selector currently reaches every file that declares the helper under any '
  + 'spelling, so the population is exactly right TODAY', anyHolders.length === population.length);

say('');
say(fails === 0 ? `ALL ${lines.filter((l) => /^\[ok\]|^FAIL/.test(l)).length} checks passed` : `${fails} CHECK(S) FAILED`);
writeFileSync(join(HERE, 'recording-oncegate.txt'), lines.join('\n') + '\n');
process.exit(fails === 0 ? 0 : 1);
