/**
 * unit-465rekey374 — the grader. Reads the pre-registration's nine predictions against real bytes
 * and real runs, and prints one row per leg with the figure that decided it.
 *
 * Keys, stated so a reader can tell what is sliced from what is typed:
 *
 *   PRE   `git show <pre-cure rev>:<path>` — the subject and `probe-round377` as they stood before
 *         the commit under test. Not a frozen copy in this directory.
 *   CUR   the live file on disk.
 *   drives are CHILD PROCESSES of real copies, with every substitution asserted unique by `once`.
 *
 * The only hand-typed column is P5's pre-cure row ("exit 1, zero verdict rows, no headline"), which
 * is `unit-465guard374`'s measurement from 11/08 and is labelled HISTORICAL in the output rather
 * than re-driven here: that cell's subject no longer exists on disk, so re-driving it would mean
 * driving a reconstruction and reporting it as a reading.
 */

import { execFileSync } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { once } from './cure.mjs';

const UNIT = dirname(fileURLToPath(import.meta.url));
const REPO = join(UNIT, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SANDBOX = join(REPO, '.testdata', 'unit-465rekey374');
mkdirSync(SANDBOX, { recursive: true });
/**
 * `sweep-probes.mjs` imports `./lib/strip-source.mjs`, so a registry copy needs that module beside
 * it. Run 3 of this grader failed every drive on `ERR_MODULE_NOT_FOUND` for exactly this — and the
 * subject's own `:231` docblock warns about the same thing one level deeper. The sandbox is at
 * `.testdata/<unit>/`, the same depth as the subject's own, which is what makes the copy enough.
 */
mkdirSync(join(SANDBOX, 'lib'), { recursive: true });

const SUBJECT = 'probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts';
const R377 = 'probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts';
const R375 = 'probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts';
const R373_FILE = 'probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts';
const R225_FILE = 'probe-round225-a-citation-is-not-a-call.mts';

/** The commit that landed the cure; its parent is the pre-cure state of the subject. */
const CURE_REV = 'd9e1937d';
/** The commit that landed Daedalus's round377 re-key; its parent is round377 before it. */
const REKEY377_REV = 'a8b366dd';

const grades = [];
const grade = (id, claim, pass, figure) => {
  grades.push({ id, pass });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${id}  ${claim}\n        → ${figure}`);
};
const note = (id, figure) => console.log(`[NOTE] ${id}  ${figure}`);

/** `git show rev:path`, pinned with `-C` because `git` is cwd-sensitive. */
const atRev = (rev, path) =>
  execFileSync('git', ['-C', REPO, 'show', `${rev}:${path}`], { encoding: 'utf8', maxBuffer: 64 << 20 });

const occ = (h, n) => h.split(n).length - 1;
const lines15 = (s) => s.split('\n').filter((l) => l.includes('15')).length;

// ──────────────────────────────────────────────────────────────────────────────────────────────
// P2 — the frozen sibling total, PRE vs CUR, raw and through the repo's own shared code reader
// ──────────────────────────────────────────────────────────────────────────────────────────────

const preSrc = atRev(`${CURE_REV}^`, `scripts/${SUBJECT}`);
const curSrc = readFileSync(join(SCRIPTS, SUBJECT), 'utf8');
const LIT = 'All 15 regression checks passed';

const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));
/**
 * `blankStrings: true` — the reading `unit-465rekey377`'s L2 used, kept here EXACTLY as the
 * pre-registration named it rather than swapped for a friendlier one after the fact. The subject's
 * own docblock says what this reader does to a regex body, and P2d's row records what that costs.
 */
const codeOnly = (s) => stripSource(s, true);

grade(
  'P2a',
  `the full frozen literal is gone from the subject, raw`,
  occ(preSrc, LIT) === 2 && occ(curSrc, LIT) === 0,
  `raw occurrences PRE ${occ(preSrc, LIT)} → CUR ${occ(curSrc, LIT)} (predicted 2 → 0)`,
);
grade(
  'P2b',
  `the field named after the number is gone`,
  occ(preSrc, 'all15') === 5 && occ(curSrc, 'all15') === 0,
  `\`all15\` token PRE ${occ(preSrc, 'all15')} → CUR ${occ(curSrc, 'all15')} (predicted 5 → 0)`,
);
grade(
  'P2c',
  `no line of the subject mentions the number at all`,
  lines15(preSrc) === 9 && lines15(curSrc) === 0,
  `lines containing \`15\` PRE ${lines15(preSrc)} → CUR ${lines15(curSrc)} (predicted 9 → 0)`,
);
grade(
  'P2d',
  `and it is gone from live CODE, read through \`scripts/lib/strip-source.mjs\` rather than by grep`,
  occ(codeOnly(preSrc), LIT) === 2 && occ(codeOnly(curSrc), LIT) === 0,
  `code-only occurrences PRE ${occ(codeOnly(preSrc), LIT)} → CUR ${occ(codeOnly(curSrc), LIT)} (predicted 2 → 0)`,
);
note(
  'P2d-m',
  'all three readings, published because the figure a reader would quote depends on which one ' +
    `was taken: raw PRE ${occ(preSrc, LIT)} / CUR ${occ(curSrc, LIT)} · comments blanked, strings ` +
    `kept PRE ${occ(stripSource(preSrc, false), LIT)} / CUR ${occ(stripSource(curSrc, false), LIT)} · ` +
    `both blanked PRE ${occ(codeOnly(preSrc), LIT)} / CUR ${occ(codeOnly(curSrc), LIT)}. The two ` +
    'pre-cure sites were a REGEX BODY and a STRING LITERAL, and this reader blanks a regex body in ' +
    "both of its readings — the subject's own docblock states that, measured on Round 376 sandbox " +
    'D3. So a code-only key is partly blind HERE in a way it was not blind for the identifier sites ' +
    'L2 was built for.',
);

// ──────────────────────────────────────────────────────────────────────────────────────────────
// The registry mutations, each ONE asserted replacement of a `file:` line
// ──────────────────────────────────────────────────────────────────────────────────────────────

const sweepSrc = readFileSync(join(SCRIPTS, 'sweep-probes.mjs'), 'utf8');
copyFileSync(join(SCRIPTS, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
const fileLine = (f) => `    file: '${f}',`;
const renamed = (f) => `    file: '${f.replace('probe-round', 'probe-RENAMED-round')}',`;

const SWEEP_FAITHFUL = join(SANDBOX, 'sweep-faithful.mjs');
const SWEEP_NO_373 = join(SANDBOX, 'sweep-no-373.mjs');
const SWEEP_NO_225 = join(SANDBOX, 'sweep-no-225.mjs');
const SWEEP_373_NOT_HEADLINE = join(SANDBOX, 'sweep-373-not-headline.mjs');

/**
 * The third mutation's anchor is TWO LINES, not one. Run 1 of this grader refused here: the bare
 * `expect: /All 15 regression checks passed/,` line occurs FOUR times in the shipped registry — the
 * sibling family shares a pin — so a one-line anchor could not name round373's. The refusal is the
 * `once` guard doing its job and is kept in `grade-run1.txt` rather than tidied away. The anchor is
 * now the entry's `file:` line plus its `expect:` line, which is unique by construction.
 */
const R373_EXPECT_ANCHOR = `${fileLine(R373_FILE)}\n    expect: /All 15 regression checks passed/,`;

// The narrowness grade runs BEFORE the mutations are built, not after: a `once` refusal inside the
// construction crashes upstream of the arm that would diagnose it, and a crash and a red share an
// exit code.
grade(
  'M0',
  'every registry mutation below has a UNIQUE anchor in the shipped registry, so each lands on the ' +
    'entry it names and not on a sibling',
  occ(sweepSrc, fileLine(R373_FILE)) === 1 &&
    occ(sweepSrc, fileLine(R225_FILE)) === 1 &&
    occ(sweepSrc, R373_EXPECT_ANCHOR) === 1,
  `anchors in the shipped registry: round373 file-line ${occ(sweepSrc, fileLine(R373_FILE))}, ` +
    `round225 file-line ${occ(sweepSrc, fileLine(R225_FILE))}, round373 file+expect ` +
    `${occ(sweepSrc, R373_EXPECT_ANCHOR)} — each expected 1. For contrast, the bare expect line ` +
    `alone occurs ${occ(sweepSrc, '    expect: /All 15 regression checks passed/,')} time(s), which ` +
    `is what refused run 1`,
);

writeFileSync(SWEEP_FAITHFUL, sweepSrc, 'utf8');
writeFileSync(SWEEP_NO_373, once(sweepSrc, fileLine(R373_FILE), renamed(R373_FILE)), 'utf8');
writeFileSync(SWEEP_NO_225, once(sweepSrc, fileLine(R225_FILE), renamed(R225_FILE)), 'utf8');
writeFileSync(
  SWEEP_373_NOT_HEADLINE,
  once(sweepSrc, R373_EXPECT_ANCHOR, `${fileLine(R373_FILE)}\n    expect: /15 of 15 checks are green/,`),
  'utf8',
);

// ──────────────────────────────────────────────────────────────────────────────────────────────
// The subject, copied and driven as a child against a chosen registry
// ──────────────────────────────────────────────────────────────────────────────────────────────

const A_OUTCOME = "import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';";
const A_SWEPT = "import { SWEPT } from './sweep-probes.mjs';";
const A_HERE = 'const HERE = dirname(fileURLToPath(import.meta.url));';
/**
 * THREE lines, not one. Run 2 refused here: the subject carries that `HERE` line a SECOND time as a
 * string — `const R373_HERE = 'const HERE = …';` at `:218` — because it is itself an anchor the
 * subject uses when it copies `probe-round373`. An instrument copying a file that copies files has
 * to distinguish the declaration from the declaration's own spelling as data. Refusal kept in
 * `grade-run2.txt`.
 */
const A_HERE_BLOCK = [A_HERE, "const REPO = join(HERE, '..');", "const SWEEP = join(HERE, 'sweep-probes.mjs');"].join('\n');
const A_SANDBOX = "const SANDBOX = join(REPO, '.testdata', 'round374');";

/** One copy of the subject, pointed at a registry. Every substitution asserted unique. */
const copySubject = (src, label, sweepPath) => {
  let s = src;
  s = once(s, A_OUTCOME, `import { summariseAndExit, type ProbeVerdict } from '${join(SCRIPTS, 'lib', 'probe-outcome.mts')}';`);
  s = once(s, A_SWEPT, `import { SWEPT } from '${sweepPath}';`);
  s = once(
    s,
    A_HERE_BLOCK,
    [
      `const HERE = ${JSON.stringify(SCRIPTS)};`,
      `const REPO = ${JSON.stringify(REPO)};`,
      `const SWEEP = ${JSON.stringify(sweepPath)};`,
    ].join('\n'),
  );
  s = once(s, A_SANDBOX, `const SANDBOX = ${JSON.stringify(join(SANDBOX, `child-${label}`))};`);
  return s;
};

const driveFile = (path) => {
  const run = spawnSync('npx', ['tsx', path], { cwd: REPO, encoding: 'utf8', timeout: 600_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  return {
    status: run.status,
    out,
    // The LAST headline, not the first: this subject spawns CHILD probes that print their own.
    headlines: [...out.matchAll(/All \d+ regression checks passed/g)].map((m) => m[0]),
    rows: out.split('\n').filter((l) => l.startsWith('FAIL ') || l.startsWith('[ok] ')).length,
    failed: out.split('\n').filter((l) => l.startsWith('FAIL ')).map((l) => l.slice(5).split(/\s+/)[0]),
  };
};

const driveSubject = (src, label, sweepPath) => {
  const p = join(SANDBOX, `drive-${label}.mts`);
  writeFileSync(p, copySubject(src, label, sweepPath), 'utf8');
  const d = driveFile(p);
  writeFileSync(join(UNIT, `cell-${label}.txt`), d.out, 'utf8');
  return d;
};

// P1 — the control: the cured subject against a verbatim registry copy
const curFaithful = driveSubject(curSrc, 'cur-faithful', SWEEP_FAITHFUL);
grade(
  'P1',
  'CONTROL — the cured subject, copied and pointed at a VERBATIM registry copy, is green at the ' +
    'count its own entry now declares',
  curFaithful.status === 0 && curFaithful.headlines[curFaithful.headlines.length - 1] === 'All 10 regression checks passed',
  `exit ${String(curFaithful.status)} · own headline ${curFaithful.headlines[curFaithful.headlines.length - 1] ?? '(none)'} · ` +
    `failing arm(s): ${curFaithful.failed.join(' ') || '(none)'}`,
);

// P3 — A0r is reached, sole red, and prints a headline rather than a stack trace
const curNo373 = driveSubject(curSrc, 'cur-no-373', SWEEP_NO_373);
grade(
  'P3',
  'A0r is REACHED and is the SOLE red when the sibling entry goes absent, and the run reports a ' +
    'red row and a summary headline rather than a stack trace',
  curNo373.status === 1 && curNo373.failed.length === 1 && curNo373.failed[0] === 'A0r' && /regression check/.test(curNo373.out),
  `exit ${String(curNo373.status)} · failing arm(s): ${curNo373.failed.join(' ') || '(none)'} · ` +
    `verdict rows ${curNo373.rows} · summary line present: ${/regression check/.test(curNo373.out)}`,
);

// P3b — the SHAPE conjunct, not a count: an entry that stops pinning a headline is also a red
const curNotHeadline = driveSubject(curSrc, 'cur-373-not-headline', SWEEP_373_NOT_HEADLINE);
grade(
  'P3b',
  'and the conjunct is the SHAPE: an entry still present but no longer pinning a headline reddens ' +
    'A0r too — the state a presence-only guard would pass',
  curNotHeadline.status === 1 && curNotHeadline.failed.length === 1 && curNotHeadline.failed[0] === 'A0r',
  `exit ${String(curNotHeadline.status)} · failing arm(s): ${curNotHeadline.failed.join(' ') || '(none)'} · ` +
    `verdict rows ${curNotHeadline.rows}`,
);

// P4 — THE DEFECT, driven: the pre-cure subject is GREEN in the state that makes its claim unspeakable
const preNo373 = driveSubject(preSrc, 'pre-no-373', SWEEP_NO_373);
grade(
  'P4',
  'THE DEFECT, driven rather than described: the PRE-cure subject is GREEN in the same state, ' +
    'because its predicate read a frozen string and never read the sibling entry at all',
  preNo373.status === 0,
  `exit ${String(preNo373.status)} · own headline ${preNo373.headlines[preNo373.headlines.length - 1] ?? '(none)'} · ` +
    `failing arm(s): ${preNo373.failed.join(' ') || '(none)'}`,
);

// P5 — A0g reached and sole red under the state unit-465guard374 drove
const curNo225 = driveSubject(curSrc, 'cur-no-225', SWEEP_NO_225);
grade(
  'P5',
  'A0g is REACHED and is the SOLE red when the keyed entry goes absent, with a red row and a ' +
    'headline instead of a stack trace',
  curNo225.status === 1 && curNo225.failed.length === 1 && curNo225.failed[0] === 'A0g' && /regression check/.test(curNo225.out),
  `exit ${String(curNo225.status)} · failing arm(s): ${curNo225.failed.join(' ') || '(none)'} · ` +
    `verdict rows ${curNo225.rows} · summary line present: ${/regression check/.test(curNo225.out)}`,
);
note(
  'P5-hist',
  'HISTORICAL, hand-typed, NOT re-driven here: unit-465guard374 (11/08) measured the pre-cure ' +
    'subject in this same state at exit 1 with ZERO verdict rows and no headline, throwing at ' +
    '`const DRIFT_TARGET = r225.file;`. Its subject no longer exists on disk, so re-driving it ' +
    'would be driving a reconstruction and calling it a reading.',
);

// ──────────────────────────────────────────────────────────────────────────────────────────────
// P6 — the agreement rule, run rather than reasoned about
// ──────────────────────────────────────────────────────────────────────────────────────────────

const { SWEPT, entryProblems } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
const live374 = SWEPT.find((s) => s.file === SUBJECT);
const variantUnrespelled = { ...live374, why: live374.why.replace('8 of 8 green', '8/8 green').replace('10/10 green', '10 of 10 green') };
const variantVacuous = { ...live374, why: live374.why.replace('10/10 green', '10 of 10 green') };

grade(
  'P6a',
  'the shipped row AGREES: entryProblems returns empty on the edited round374 entry',
  entryProblems(live374).length === 0,
  `expect pins \`${live374.expect.source}\` · problems ${JSON.stringify(entryProblems(live374))}`,
);
grade(
  'P6b',
  'and it would NOT have agreed without the respell — the superseded count is a real drift, not ' +
    'bookkeeping',
  entryProblems(variantUnrespelled).some((p) => /says 8 where expect pins 10/.test(p)),
  `problems ${JSON.stringify(entryProblems(variantUnrespelled))}`,
);
grade(
  'P6c',
  'and deleting the pair instead of respelling it makes the rule VACUOUS rather than satisfied — ' +
    "the trap probe-round377's own entry fell into in Round 378",
  entryProblems(variantVacuous).some((p) => /vacuous/.test(p)),
  `problems ${JSON.stringify(entryProblems(variantVacuous))}`,
);

// ──────────────────────────────────────────────────────────────────────────────────────────────
// P7/P8 — the sibling that reads my pin, and the ordering leg
// ──────────────────────────────────────────────────────────────────────────────────────────────

const r377Live = driveFile(join(SCRIPTS, R377));
writeFileSync(join(UNIT, 'cell-r377-live.txt'), r377Live.out, 'utf8');
grade(
  'P7',
  'probe-round377 is INSENSITIVE to this bump, because its C1/C2 read the agreement rather than ' +
    'either number',
  r377Live.status === 0,
  `exit ${String(r377Live.status)} · own headline ${r377Live.headlines[r377Live.headlines.length - 1] ?? '(none)'} · ` +
    `failing arm(s): ${r377Live.failed.join(' ') || '(none)'}`,
);

// P8 — the ORDERING leg: round377 as it stood BEFORE the re-key, driven against today's registry
const r377Pre = atRev(`${REKEY377_REV}^`, `scripts/${R377}`);
const p377 = join(SANDBOX, 'drive-r377-pre-rekey.mts');
let r377PreSrc = r377Pre;
let p8Refusal = null;
try {
  // Every relative import redirected absolutely, because the copy lives outside `scripts/`. The
  // registry it is pointed at is TODAY'S — the bumped one — which is the whole point of the leg.
  //
  // The import anchor is the whole BLOCK, for the reason run 3 found one level down: round377 also
  // carries two of these import lines as STRINGS, being itself an instrument that copies probes.
  r377PreSrc = once(
    r377PreSrc,
    [A_OUTCOME, "import { stripSource } from './lib/strip-source.mjs';"].join('\n'),
    [
      `import { summariseAndExit, type ProbeVerdict } from '${join(SCRIPTS, 'lib', 'probe-outcome.mts')}';`,
      `import { stripSource } from '${join(SCRIPTS, 'lib', 'strip-source.mjs')}';`,
    ].join('\n'),
  );
  r377PreSrc = once(r377PreSrc, "import { census, SWEPT } from './sweep-probes.mjs';", `import { census, SWEPT } from '${join(SCRIPTS, 'sweep-probes.mjs')}';`);
  r377PreSrc = once(
    r377PreSrc,
    [A_HERE, "const REPO = join(HERE, '..');", "const SWEEP = join(HERE, 'sweep-probes.mjs');"].join('\n'),
    [
      `const HERE = ${JSON.stringify(SCRIPTS)};`,
      `const REPO = ${JSON.stringify(REPO)};`,
      `const SWEEP = ${JSON.stringify(join(SCRIPTS, 'sweep-probes.mjs'))};`,
    ].join('\n'),
  );
  r377PreSrc = once(r377PreSrc, "const SANDBOX = join(REPO, '.testdata', 'round377');", `const SANDBOX = ${JSON.stringify(join(SANDBOX, 'child-r377-pre'))};`);
} catch (e) {
  p8Refusal = e.message;
}
writeFileSync(p377, r377PreSrc, 'utf8');
const r377PreRun = p8Refusal === null ? driveFile(p377) : null;
if (r377PreRun) writeFileSync(join(UNIT, 'cell-r377-pre-rekey.txt'), r377PreRun.out, 'utf8');
grade(
  'P8',
  'THE ORDERING LEG: probe-round377 as it stood before this morning\'s re-key goes RED against ' +
    "today's registry — so landing this seat's bump first, as my 11/08 §2 proposed and his §4 " +
    'routed, would have manufactured a red in his file',
  p8Refusal === null && r377PreRun !== null && r377PreRun.status !== 0 && r377PreRun.failed.length > 0,
  p8Refusal !== null
    ? `REFUSED at an anchor rather than driven: ${p8Refusal}`
    : `exit ${String(r377PreRun.status)} · failing arm(s): ${r377PreRun.failed.join(' ') || '(none)'} · ` +
      `own headline ${r377PreRun.headlines[r377PreRun.headlines.length - 1] ?? '(none)'}`,
);

// P9 — round375 is insensitive by DEADNESS, and that is worth saying out loud
const r375Src = readFileSync(join(SCRIPTS, R375), 'utf8');
const r375Live = driveFile(join(SCRIPTS, R375));
writeFileSync(join(UNIT, 'cell-r375-live.txt'), r375Live.out, 'utf8');
grade(
  'P9',
  'probe-round375 is insensitive to the bump, and the reason is DEADNESS rather than design: its ' +
    'only use of this subject is one read whose binding is never read again',
  r375Live.status === 0 && occ(r375Src, 'r374Src') === 1,
  `exit ${String(r375Live.status)} · \`r374Src\` occurs ${occ(r375Src, 'r374Src')} time(s) in ` +
    `probe-round375 (a read with no reader) · failing arm(s): ${r375Live.failed.join(' ') || '(none)'}`,
);

const failed = grades.filter((g) => !g.pass);
console.log('');
console.log(`GRADES: ${grades.length - failed.length} of ${grades.length} true` + (failed.length ? ` — FAILED: ${failed.map((g) => g.id).join(' ')}` : ''));
process.exit(failed.length ? 1 : 0);
