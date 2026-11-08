/**
 * unit-465guard — the 2×2 drive behind P1–P5.
 *
 * Two subjects × two registries, one variable per cell:
 *
 *   subject   SHIPPED   = `git show <BASELINE>:scripts/probe-round372-….mts` — the file as it stood
 *                         before this unit's cure, taken from git and NOT from a copy I made by
 *                         hand before editing, because this unit cures its own subject.
 *             CURED     = the live working tree.
 *   registry  FAITHFUL  = a byte copy of `scripts/sweep-probes.mjs`. The control that proves the
 *                         sandbox copy is the same artefact as the file.
 *             MOVED     = the same module with `probe-round225`'s `refusal:` and `skip:` lines
 *                         removed from its entry and inserted, unchanged, into another SWEPT entry
 *                         that declares neither today. Count-preserving by construction (one
 *                         declaring member leaves the list, one joins it), which is what makes the
 *                         `=== N` / `includes()` separation visible.
 *
 * Every anchor is asserted unique before replacement (`once`, Round 347) and the insertion target
 * is DERIVED from the imported registry rather than hand-typed, because a hand-typed filename is
 * not a slice of the population it claims to come from.
 *
 * **P1 is keyed on the missing headline, not on the exit code.** An uncaught `TypeError` in node
 * exits 1 and so does a one-arm red; the exit code cannot tell the crash this unit reports from the
 * red it is trying to produce.
 */
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const UNIT = dirname(fileURLToPath(import.meta.url));
const REPO = join(UNIT, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SANDBOX = join(REPO, '.testdata', 'unit-465guard');
const OUT = join(UNIT, 'scratch');
const SUBJECT_REL =
  'scripts/probe-round372-the-rows-are-keyed-on-the-limb-and-the-contradiction-is-latent.mts';
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
/** The pre-registration commit — the last rev at which the subject is the SHIPPED file. */
const BASELINE = process.argv[2] ?? 'HEAD';

mkdirSync(SANDBOX, { recursive: true });
mkdirSync(join(SANDBOX, 'lib'), { recursive: true });
mkdirSync(OUT, { recursive: true });

const lines: string[] = [];
const say = (s: string) => {
  lines.push(s);
  console.log(s);
};

const occ = (h: string, n: string) => h.split(n).length - 1;
const once = (src: string, from: string, to: string) => {
  if (occ(src, from) !== 1) throw new Error(`anchor not unique (${occ(src, from)}): ${from}`);
  return src.replace(from, to);
};

// ── the two registries ─────────────────────────────────────────────────────────────────────────
const sweepSrc = readFileSync(join(SCRIPTS, 'sweep-probes.mjs'), 'utf8');
const live = (await import(pathToFileURL(join(SCRIPTS, 'sweep-probes.mjs')).href)) as {
  SWEPT: { file: string; refusal?: RegExp; skip?: RegExp }[];
};
const r225 = live.SWEPT.find((s) => s.file === R225);
if (r225 === undefined || r225.refusal === undefined || r225.skip === undefined) {
  throw new Error('the keyed entry does not declare both patterns on this tree — mutation refused');
}

const REFUSAL_DECL = `    refusal: /${r225.refusal.source}/,`;
const SKIP_DECL = `    skip: /${r225.skip.source}/,`;
/** Derived, not hand-typed: the first SWEPT entry that declares neither pattern today. */
const TARGET = live.SWEPT.find((s) => !s.refusal && !s.skip)!.file;
const TARGET_ANCHOR = `    file: '${TARGET}',`;

let movedSrc = once(sweepSrc, `${REFUSAL_DECL}\n`, '');
movedSrc = once(movedSrc, `${SKIP_DECL}\n`, '');
movedSrc = once(
  movedSrc,
  `${TARGET_ANCHOR}\n`,
  `${TARGET_ANCHOR}\n${REFUSAL_DECL}\n${SKIP_DECL}\n`,
);

const FAITHFUL = join(SANDBOX, 'sweep-faithful.mjs');
const MOVED = join(SANDBOX, 'sweep-moved.mjs');
copyFileSync(join(SCRIPTS, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
writeFileSync(FAITHFUL, sweepSrc, 'utf8');
writeFileSync(MOVED, movedSrc, 'utf8');

const movedMod = (await import(pathToFileURL(MOVED).href)) as typeof live;
const members = (list: typeof live.SWEPT) =>
  list.filter((s) => s.refusal || s.skip).map((s) => [s.file, Boolean(s.refusal), Boolean(s.skip)]);
const shippedMembers = members(live.SWEPT);
const movedMembers = members(movedMod.SWEPT);

// ── M2 / P3 — the member lists, as objects ─────────────────────────────────────────────────────
say('── M2  declaring populations, printed as objects rather than counts ──');
say(`  FAITHFUL  SWEPT ${live.SWEPT.length}  declaring ${shippedMembers.length}`);
for (const m of shippedMembers) say(`    ${String(m[0])}  refusal=${String(m[1])} skip=${String(m[2])}`);
say(`  MOVED     SWEPT ${movedMod.SWEPT.length}  declaring ${movedMembers.length}`);
for (const m of movedMembers) say(`    ${String(m[0])}  refusal=${String(m[1])} skip=${String(m[2])}`);
const countPreserved = shippedMembers.length === movedMembers.length;
const listChanged = JSON.stringify(shippedMembers) !== JSON.stringify(movedMembers);
const keyedStillIn = movedMembers.some((m) => m[0] === R225);
say(
  `  P3  count-preserving=${String(countPreserved)} (${shippedMembers.length} → ${movedMembers.length})  ` +
    `member-list-changed=${String(listChanged)}  keyed-entry-still-declaring=${String(keyedStillIn)}  ` +
    `insertion-target=${TARGET}`,
);

// ── the two subjects ───────────────────────────────────────────────────────────────────────────
const shippedSubject = execFileSync('git', ['show', `${BASELINE}:${SUBJECT_REL}`], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const curedSubject = readFileSync(join(REPO, SUBJECT_REL), 'utf8');

const C_IMPORT_OUTCOME = "} from './lib/probe-outcome.mts';";
const C_IMPORT_STRIP = "from './lib/strip-source.mjs';";
const C_IMPORT_SWEEP = "} from './sweep-probes.mjs';";
const C_HERE = 'const HERE = dirname(fileURLToPath(import.meta.url));';
const C_SWEEP_CONST = "const SWEEP = join(HERE, 'sweep-probes.mjs');";

const copySubject = (src: string, sweepPath: string) => {
  let s = once(src, C_IMPORT_OUTCOME, `} from '${join(SCRIPTS, 'lib', 'probe-outcome.mts')}';`);
  s = once(s, C_IMPORT_STRIP, `from '${join(SCRIPTS, 'lib', 'strip-source.mjs')}';`);
  s = once(s, C_IMPORT_SWEEP, `} from '${sweepPath}';`);
  s = once(s, C_HERE, `const HERE = ${JSON.stringify(SCRIPTS)};`);
  // Read and import the SAME module, so no arm reads a registry its siblings did not import.
  s = once(s, C_SWEEP_CONST, `const SWEEP = ${JSON.stringify(sweepPath)};`);
  return s;
};

type Cell = {
  label: string;
  status: number | null;
  signal: string | null;
  headline: string | null;
  a1: string | null;
  a1bPresent: boolean;
  a2: string | null;
  typeError: boolean;
  rows: number;
  outPath: string;
};

const SUBJECT_PATH = join(SANDBOX, 'subject-round372.mts');
const drive = (label: string, subjectSrc: string, sweepPath: string): Cell => {
  writeFileSync(SUBJECT_PATH, copySubject(subjectSrc, sweepPath), 'utf8');
  const run = spawnSync('npx', ['tsx', SUBJECT_PATH], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 300_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const stdout = run.stdout ?? '';
  const stderr = run.stderr ?? '';
  const outPath = join(OUT, `${label}.out`);
  writeFileSync(outPath, `---- STDOUT ----\n${stdout}\n---- STDERR ----\n${stderr}\n`, 'utf8');
  const row = (arm: string) =>
    stdout.split('\n').find((l) => l.startsWith(`[ok] ${arm}  `) || l.startsWith(`FAIL ${arm}  `)) ??
    null;
  const headline =
    /^(All \d+ regression checks passed\.|.*\bINCONCLUSIVE\b.*|\d+ of \d+ .*)$/m.exec(stdout)?.[0] ??
    null;
  return {
    label,
    status: run.status,
    signal: run.signal,
    headline,
    a1: row('A1'),
    a1bPresent: row('A1b') !== null,
    a2: row('A2'),
    typeError: /TypeError/.test(stderr),
    rows: stdout.split('\n').filter((l) => l.startsWith('[ok] ') || l.startsWith('FAIL ')).length,
    outPath,
  };
};

const report = (c: Cell) => {
  say(`── ${c.label} ──`);
  say(`  exit=${String(c.status)} signal=${String(c.signal)}  verdict rows=${c.rows}`);
  say(`  headline: ${c.headline === null ? '(NONE PRINTED)' : c.headline}`);
  say(`  stderr TypeError: ${String(c.typeError)}`);
  say(`  A1  : ${c.a1 === null ? '(no row)' : c.a1.slice(0, 96)}`);
  say(`  A2  : ${c.a2 === null ? '(no row)' : c.a2.slice(0, 160)}`);
  say(`  A1b : ${c.a1bPresent ? 'row present' : '(no row)'}`);
};

say('');
say(`baseline rev for the SHIPPED subject: ${BASELINE}`);
const shippedFaithful = drive('shipped-x-faithful', shippedSubject, FAITHFUL);
const shippedMoved = drive('shipped-x-moved', shippedSubject, MOVED);
const curedFaithful = drive('cured-x-faithful', curedSubject, FAITHFUL);
const curedMoved = drive('cured-x-moved', curedSubject, MOVED);
say('');
for (const c of [shippedFaithful, shippedMoved, curedFaithful, curedMoved]) report(c);

// ── verdicts ───────────────────────────────────────────────────────────────────────────────────
const v: [string, boolean, string][] = [
  [
    'P0 control',
    shippedFaithful.status === 0 && /All 26 regression checks passed/.test(shippedFaithful.headline ?? ''),
    'the SHIPPED subject against a FAITHFUL registry copy is green at 26 — the copy is the file, so ' +
      'every other cell is attributable to the one variable',
  ],
  [
    'P1',
    shippedMoved.headline === null && !shippedMoved.a1bPresent && shippedMoved.typeError,
    'SHIPPED × MOVED: no summary headline, no A1b row, TypeError on stderr — the crash, keyed on ' +
      `the headline rather than the exit code (which was ${String(shippedMoved.status)}, the same ` +
      'value a legitimate one-arm red produces)',
  ],
  [
    'P2',
    (shippedMoved.a1 ?? '').startsWith('[ok] A1') && shippedMoved.rows === 1,
    'and the last thing a reader sees is a green row: A1 [ok], and it is the only verdict row in ' +
      'the run',
  ],
  [
    'P3',
    countPreserved && listChanged && !keyedStillIn,
    `the move is count-preserving (${shippedMembers.length} → ${movedMembers.length}) while the ` +
      'member list changes and the keyed entry leaves it — so `=== N` is green on exactly the ' +
      'registry that kills the shipped file, and `includes(R225)` is not',
  ],
  [
    'P4',
    curedMoved.status === 1 &&
      curedMoved.headline !== null &&
      !curedMoved.typeError &&
      (curedMoved.a2 ?? '').startsWith('FAIL A2') &&
      !curedMoved.a1bPresent,
    'CURED × MOVED: A2 FAILs and names the live member list, a summary headline is printed, no ' +
      'TypeError, and nothing below the guard reports — a recorded red instead of a stack trace',
  ],
  [
    'P5',
    curedFaithful.status === 0 &&
      /All 26 regression checks passed/.test(curedFaithful.headline ?? '') &&
      curedFaithful.rows === shippedFaithful.rows,
    `CURED × FAITHFUL is green at the shipped figure, and at the same number of verdict rows as ` +
      `the shipped subject (${curedFaithful.rows} vs ${shippedFaithful.rows}) — the cure moved no ` +
      'count, so the registry `expect` needs no edit',
  ],
];
say('');
for (const [name, pass, why] of v) say(`${pass ? '[HELD]' : '[REFUTED]'} ${name}  ${why}`);
say('');
say(
  `${v.filter(([, p]) => p).length} of ${v.length} held` +
    (v.every(([, p]) => p) ? '' : ' — REFUTATIONS ABOVE'),
);
writeFileSync(join(OUT, 'drive-guard.txt'), `${lines.join('\n')}\n`, 'utf8');
process.exit(v.every(([, p]) => p) ? 0 : 1);
