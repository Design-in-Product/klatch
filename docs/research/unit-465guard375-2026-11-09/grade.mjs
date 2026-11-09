/**
 * unit-465guard375 — the grader. Reads the pre-registration's eleven predictions against real bytes
 * and real child-process runs, and prints one row per leg with the figure that decided it.
 *
 * Keys, stated so a reader can tell what is SLICED from what is TYPED:
 *
 *   CUR     the live subject on disk.
 *   PRE     `git show <cure rev>^:<path>` — the subject as it stood before this unit's cure. Not a
 *           frozen copy in this directory.
 *   PLUS1   the live `probe-round373` with ONE extra arm, by one asserted insertion. This is the
 *           +1-arm fixture P6/P7 need, and it is a SLICE of the live sibling plus one line, not a
 *           hand-written probe.
 *   drives  CHILD PROCESSES of real copies, every substitution asserted unique by `once`.
 *
 * Nothing in the predictions column is hand-typed from a run: every figure printed below is read
 * out of the run that produced it.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const UNIT = dirname(fileURLToPath(import.meta.url));
const REPO = join(UNIT, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SANDBOX = join(REPO, '.testdata', 'unit-465guard375');
mkdirSync(SANDBOX, { recursive: true });
/**
 * `sweep-probes.mjs` imports `./lib/strip-source.mjs`, so a registry copy needs that module beside
 * it — a refusal named in the pre-registration in advance, because step 2's grader lost a whole run
 * to it. The sandbox sits at `.testdata/<unit>/`, the same DEPTH as the subject's own, which is what
 * makes the copy enough.
 */
mkdirSync(join(SANDBOX, 'lib'), { recursive: true });

const SUBJECT =
  'probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts';
const R373 = 'probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts';
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
const R377 =
  'probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts';

/** The commit that landed this unit's cure; its parent is the pre-cure subject. */
const CURE_REV = '6f790f15';

const grades = [];
const grade = (id, claim, pass, figure) => {
  grades.push({ id, pass });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${id}  ${claim}\n        → ${figure}`);
};
const note = (id, figure) => console.log(`[NOTE] ${id}  ${figure}`);

/** `git show rev:path`, pinned with `-C` because `git` is cwd-sensitive. */
const atRev = (rev, path) =>
  execFileSync('git', ['-C', REPO, 'show', `${rev}:${path}`], {
    encoding: 'utf8',
    maxBuffer: 64 << 20,
  });

const occ = (h, n) => h.split(n).length - 1;
/** One asserted replacement, or throw. A mutation whose target is asserted rather than hoped for. */
const once = (src, from, to) => {
  if (occ(src, from) !== 1) throw new Error(`anchor not unique (${occ(src, from)}): ${from}`);
  return src.replace(from, to);
};

const preSrc = atRev(`${CURE_REV}^`, `scripts/${SUBJECT}`);
const curSrc = readFileSync(join(SCRIPTS, SUBJECT), 'utf8');
const sweepSrc = readFileSync(join(SCRIPTS, 'sweep-probes.mjs'), 'utf8');
const r373Src = readFileSync(join(SCRIPTS, R373), 'utf8');

// ──────────────────────────────────────────────────────────────────────────────────────────────
// P0 — narrowness, graded BEFORE anything is built
// ──────────────────────────────────────────────────────────────────────────────────────────────

const fileLine = (f) => `    file: '${f}',`;
const renamed = (f) => `    file: '${f.replace('probe-round', 'probe-RENAMED-round')}',`;
/**
 * TWO lines, not one. The bare `expect:` line for this family is shared — these probes pin the same
 * headline text — so a one-line anchor could not name `probe-round373`'s. Named in the
 * pre-registration as an expected refusal and spelled around it here.
 */
const R373_PIN_ANCHOR = `${fileLine(R373)}\n    expect: /All 15 regression checks passed/,`;
const R373_EXIT = "summariseAndExit({ probeName: 'probe-round373', results });";

grade(
  'P0',
  'NARROWNESS, graded before any mutation is built: every anchor below is UNIQUE in the artefact it ' +
    'is applied to, so each mutation lands on the thing it names and not on a sibling. Run first ' +
    'because a `once` refusal inside the construction crashes UPSTREAM of the leg that would ' +
    'diagnose it, and a crash and a red share an exit code',
  occ(sweepSrc, fileLine(R373)) === 1 &&
    occ(sweepSrc, fileLine(R225)) === 1 &&
    occ(sweepSrc, R373_PIN_ANCHOR) === 1 &&
    occ(r373Src, R373_EXIT) === 1,
  `registry: round373 file-line ${occ(sweepSrc, fileLine(R373))}, round225 file-line ` +
    `${occ(sweepSrc, fileLine(R225))}, round373 file+expect ${occ(sweepSrc, R373_PIN_ANCHOR)}; ` +
    `probe-round373's own exit call ${occ(r373Src, R373_EXIT)} — each expected 1. For contrast the ` +
    `bare expect line alone occurs ` +
    `${occ(sweepSrc, '    expect: /All 15 regression checks passed/,')} time(s), which is why the ` +
    `pin anchor is two lines`,
);

// ── the registry copies, one asserted mutation each ──
copyFileSync(join(SCRIPTS, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
const SW_FAITHFUL = join(SANDBOX, 'sweep-faithful.mjs');
const SW_NO_225 = join(SANDBOX, 'sweep-no-225.mjs');
const SW_NO_373 = join(SANDBOX, 'sweep-no-373.mjs');
const SW_373_NOT_HEADLINE = join(SANDBOX, 'sweep-373-not-headline.mjs');
const SW_373_PIN_16 = join(SANDBOX, 'sweep-373-pin-16.mjs');
writeFileSync(SW_FAITHFUL, sweepSrc, 'utf8');
writeFileSync(SW_NO_225, once(sweepSrc, fileLine(R225), renamed(R225)), 'utf8');
writeFileSync(SW_NO_373, once(sweepSrc, fileLine(R373), renamed(R373)), 'utf8');
writeFileSync(
  SW_373_NOT_HEADLINE,
  once(sweepSrc, R373_PIN_ANCHOR, `${fileLine(R373)}\n    expect: /15 of 15 checks are green/,`),
  'utf8',
);
writeFileSync(
  SW_373_PIN_16,
  once(sweepSrc, R373_PIN_ANCHOR, `${fileLine(R373)}\n    expect: /All 16 regression checks passed/,`),
  'utf8',
);

/**
 * The +1-arm sibling fixture: the LIVE `probe-round373` with one extra arm, inserted ahead of its
 * own exit call by one asserted substitution. A slice of the live file plus one line — not a
 * hand-written stand-in, which could not stand for the sibling in a claim about the sibling.
 */
const R373_PLUS1 = join(SANDBOX, 'round373-plus-one-arm.mts');
writeFileSync(
  R373_PLUS1,
  once(
    r373Src,
    R373_EXIT,
    `check('Z0', 'SYNTHETIC extra arm — unit-465guard375 P6/P7 fixture, one asserted insertion', true);\n${R373_EXIT}`,
  ),
  'utf8',
);

// ──────────────────────────────────────────────────────────────────────────────────────────────
// the subject, copied and driven as a child against a chosen registry and a chosen sibling source
// ──────────────────────────────────────────────────────────────────────────────────────────────

const A_OUTCOME = "import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';";
const A_SWEPT = "import { SWEPT } from './sweep-probes.mjs';";
/**
 * THREE lines, not one. The subject carries `const HERE = dirname(fileURLToPath(import.meta.url));`
 * a SECOND time as a STRING — `const C_HERE = '…'` — because it is itself a probe that copies
 * probes. An instrument copying an instrument has to tell a declaration from the declaration's own
 * spelling as data. Named as an expected refusal in the pre-registration.
 */
const A_HERE_BLOCK = [
  'const HERE = dirname(fileURLToPath(import.meta.url));',
  "const REPO = join(HERE, '..');",
  "const SWEEP = join(HERE, 'sweep-probes.mjs');",
].join('\n');
const A_SANDBOX = "const SANDBOX = join(REPO, '.testdata', 'round375');";
const A_R373_READ = "const r373Src = readFileSync(join(HERE, R373), 'utf8');";

const copySubject = (src, label, sweepPath, r373Path) => {
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
  if (r373Path !== null) {
    s = once(s, A_R373_READ, `const r373Src = readFileSync(${JSON.stringify(r373Path)}, 'utf8');`);
  }
  return s;
};

const driveFile = (path) => {
  const run = spawnSync('npx', ['tsx', path], { cwd: REPO, encoding: 'utf8', timeout: 900_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  const headlines = [...out.matchAll(/All \d+ regression checks passed/g)].map((m) => m[0]);
  const rowLines = out.split('\n').filter((l) => l.startsWith('FAIL ') || l.startsWith('[ok] '));
  return {
    status: run.status,
    out,
    // The LAST headline, not the first: these subjects spawn children that print their own.
    own: headlines.length === 0 ? null : headlines[headlines.length - 1],
    headlines,
    rows: rowLines.length,
    armsSeen: rowLines.map((l) => l.slice(5).trim().split(/\s+/)[0]),
    failed: out.split('\n').filter((l) => l.startsWith('FAIL ')).map((l) => l.slice(5).trim().split(/\s+/)[0]),
  };
};

const drive = (src, label, sweepPath, r373Path = null) => {
  const p = join(SANDBOX, `drive-${label}.mts`);
  writeFileSync(p, copySubject(src, label, sweepPath, r373Path), 'utf8');
  const d = driveFile(p);
  writeFileSync(join(UNIT, `cell-${label}.txt`), d.out, 'utf8');
  return d;
};

const shape = (d) =>
  `exit ${String(d.status)} · own headline ${d.own ?? '(none)'} · verdict rows ${d.rows} · ` +
  `failing arm(s) ${d.failed.join(' ') || '(none)'}`;

// P1 — CONTROL
const p1 = drive(curSrc, 'cur-faithful', SW_FAITHFUL);
grade(
  'P1',
  'CONTROL — the cured subject, copied and pointed at a VERBATIM registry copy, is green at the ' +
    'count its own entry now declares. This is what makes every red below attributable to the one ' +
    'variable rather than to the copying',
  p1.status === 0 && p1.own === 'All 10 regression checks passed' && p1.failed.length === 0,
  shape(p1),
);

// P2 / P3 — A0g, and the defect it replaced
const p2 = drive(curSrc, 'cur-no-225', SW_NO_225);
grade(
  'P2',
  'A0g is REACHED and is the SOLE red when the keyed entry goes absent, and the run reports a red ' +
    'ROW and a summary headline rather than a stack trace — the exit code is 1 either way, so the ' +
    'distinguishing key is the row count and the headline',
  p2.status === 1 &&
    p2.failed.length === 1 &&
    p2.failed[0] === 'A0g' &&
    p2.rows >= 1 &&
    /regression check/.test(p2.out),
  `${shape(p2)} · summary line present: ${/regression check/.test(p2.out)}`,
);

const p3 = drive(preSrc, 'pre-no-225', SW_NO_225);
grade(
  'P3',
  'THE DEFECT, driven rather than described: the PRE-cure subject in the SAME state exits 1 with ' +
    'ZERO verdict rows and NO headline — it throws at an unguarded dereference instead of reporting, ' +
    'and a sweep-level reader cannot tell that from a crash',
  p3.status !== 0 && p3.rows === 0 && p3.own === null,
  `${shape(p3)} · first stderr line: ${(p3.out.split('\n').find((l) => /Error|error/.test(l)) ?? '(none)').slice(0, 120)}`,
);

// P8 — the declined third guard: the mutant lookup is never REACHED in that state
grade(
  'P8',
  'and the THIRD guard was rightly declined (pre-registered as P8, not decided after the fact): in ' +
    'the one state that could make the mutant-registry lookup `undefined`, A0g exits first and that ' +
    'line is NEVER REACHED — no A3 row and no A5 row in the output — so an arm there would be a ' +
    'vacuous pin. A census of unguarded dereference SITES is not a census of reachable defects',
  p2.armsSeen.includes('A0g') && !p2.armsSeen.includes('A3') && !p2.armsSeen.includes('A5'),
  `arms that reported at all in the A0g cell: ${p2.armsSeen.join(' ') || '(none)'} — A3 (the ` +
    `mutation's own narrowness arm) and A5 (the member-list arm over BOTH modules) are the two ` +
    `that sit downstream of the mutant lookup, and neither appears`,
);

// P4 / P5 — A0r, presence and shape
const p4 = drive(curSrc, 'cur-no-373', SW_NO_373);
grade(
  'P4',
  'A0r is REACHED and is the SOLE red when the SIBLING entry goes absent — a separate arm from A0g, ' +
    'which is what lets the red name WHICH entry went missing',
  p4.status === 1 && p4.failed.length === 1 && p4.failed[0] === 'A0r' && /regression check/.test(p4.out),
  shape(p4),
);

const p5 = drive(curSrc, 'cur-373-not-headline', SW_373_NOT_HEADLINE);
grade(
  'P5',
  "and A0r's conjunct is the SHAPE, reachable ALONE: an entry still PRESENT but no longer pinning a " +
    'headline reddens it, which is the state a presence-only guard passes. So the shape is not a ' +
    'weaker stand-in for the count — it catches a state presence cannot',
  p5.status === 1 && p5.failed.length === 1 && p5.failed[0] === 'A0r',
  shape(p5),
);

// P6 — THE ORDERING LEG
const p6pre = drive(preSrc, 'pre-plus1-pin16', SW_373_PIN_16, R373_PLUS1);
const p6cur = drive(curSrc, 'cur-plus1-pin16', SW_373_PIN_16, R373_PLUS1);
grade(
  'P6',
  'THE ORDERING LEG, and it is why this file is step 3\'s head rather than my preference: with the ' +
    'sibling carrying one more arm AND its registry pin moved with it — the exact state step 3\'s ' +
    '`373` bump creates — the PRE-cure subject goes RED at C1 and the CURED subject is green. So ' +
    'landing that bump ahead of this cure would have manufactured a red in this file',
  p6pre.status === 1 &&
    p6pre.failed.length === 1 &&
    p6pre.failed[0] === 'C1' &&
    p6cur.status === 0 &&
    p6cur.failed.length === 0,
  `PRE: ${shape(p6pre)}  ||  CUR: ${shape(p6cur)}`,
);

// P7 — and the cure is not a desensitisation
const p7 = drive(curSrc, 'cur-plus1-pin15', SW_FAITHFUL, R373_PLUS1);
grade(
  'P7',
  'and the re-key is NOT a desensitisation: the same +1-arm sibling against an UNMOVED pin reddens ' +
    'the CURED C1 too, sole red. AGREEMENT is strictly stronger than the frozen number it replaced ' +
    'and strictly stronger than a shape — a member whose printed count stops matching its own pin ' +
    'is caught, which is the state `/All \\d+ …/` passes',
  p7.status === 1 && p7.failed.length === 1 && p7.failed[0] === 'C1',
  shape(p7),
);

// ──────────────────────────────────────────────────────────────────────────────────────────────
// P9 — the sibling that reads MY pin, driven live
// ──────────────────────────────────────────────────────────────────────────────────────────────

const r377 = driveFile(join(SCRIPTS, R377));
writeFileSync(join(UNIT, 'cell-r377-live.txt'), r377.out, 'utf8');
const c5Row = r377.out.split('\n').find((l) => /^(FAIL|\[ok\]) C5 /.test(l)) ?? '';
const c5List = /failing arm\(s\) ([A-Z0-9 ]+?)\./.exec(c5Row)?.[1]?.trim() ?? '(not found)';
grade(
  'P9',
  'the sibling that reads this pin is GREEN after the bump, and the leg that could have broken is ' +
    "checked at its own granularity rather than at the file's: probe-round377's C5 asserts the " +
    'EXACT failing-arm list of a driven copy of THIS file under an unprefixed registry, so two new ' +
    'arms could have changed that list. It did not change',
  r377.status === 0 && c5List === 'A1 A2 A4 C2' && /^\[ok\] C5 /.test(c5Row),
  `probe-round377 ${shape(r377)} · its C5 row is ${c5Row.slice(0, 4).trim()} and the list it read ` +
    `off the driven copy of this file is \`${c5List}\``,
);

// ──────────────────────────────────────────────────────────────────────────────────────────────
// P10 — the registry agreement rule, RUN rather than reasoned about
// ──────────────────────────────────────────────────────────────────────────────────────────────

const { SWEPT, entryProblems } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
const live = SWEPT.find((s) => s.file === SUBJECT);
const unrespelled = { ...live, why: live.why.replace('8 of 8 green', '8/8 green').replace('10/10 green', '10 of 10 green') };
const vacuous = { ...live, why: live.why.replace('10/10 green', '10 of 10 green') };

grade(
  'P10a',
  'the shipped row AGREES: entryProblems returns empty on the edited entry',
  entryProblems(live).length === 0,
  `expect pins \`${live.expect.source}\` · problems ${JSON.stringify(entryProblems(live))}`,
);
grade(
  'P10b',
  'and it would NOT have agreed without the respell — the superseded count in `why` is a real ' +
    'drift, not bookkeeping',
  entryProblems(unrespelled).some((p) => /says 8 where expect pins 10/.test(p)),
  `problems ${JSON.stringify(entryProblems(unrespelled))}`,
);
grade(
  'P10c',
  'and deleting the pair instead of respelling it makes the rule VACUOUS rather than satisfied — ' +
    "the trap probe-round377's own entry fell into in Round 378, and the reason the new record " +
    'carries a self-equal pair of its own',
  entryProblems(vacuous).some((p) => /vacuous/.test(p)),
  `problems ${JSON.stringify(entryProblems(vacuous))}`,
);

/**
 * Added between run 1 and run 2 of this grader, after reading run 1's own output. NOT a predicate
 * and no grade's conjunct changed — run 1 is kept beside run 2 so the diff is readable.
 */
note(
  'OWN-FIELD',
  'A MISLABELLED FIELD IN THIS GRADER, called out rather than left standing. The `own headline` ' +
    "column is the LAST `All \\d+ regression checks passed` in the run's output, and in a cell where " +
    'A0r REPORTS, that text also appears inside A0r\'s own reason — the arm prints the pin it read. ' +
    `So the A0g cell above shows \`${p2.own ?? '(none)'}\` with ${p2.rows} rows and no section C at ` +
    'all: that is the PIN echoed in a verdict row, not a headline the run emitted for itself. It ' +
    'decided nothing — no red cell\'s predicate reads the field, and P3\'s `own === null` is ' +
    'conjoined with `rows === 0`, where there is no row to echo anything. The subject\'s own C1 is ' +
    'not exposed to this: its reader runs over the CHILD\'s output, and P7 is the control that says ' +
    "so — the child's summary is genuinely last there, which is why the +1-arm cell reddens.",
);
note(
  'SITES',
  `the sibling's frozen arm total, across the three live sites it held: PRE ` +
    `${occ(preSrc, 'All 15 regression checks passed')} raw occurrence(s) of the full literal and ` +
    `${preSrc.split('\n').filter((l) => l.includes('15')).length} line(s) mentioning the number at ` +
    `all → CUR ${occ(curSrc, 'All 15 regression checks passed')} and ` +
    `${curSrc.split('\n').filter((l) => l.includes('15')).length}. Removed, not refreshed.`,
);

const failed = grades.filter((g) => !g.pass);
console.log('');
console.log(
  `GRADES: ${grades.length - failed.length} of ${grades.length} true` +
    (failed.length ? ` — FAILED: ${failed.map((g) => g.id).join(' ')}` : ''),
);
process.exit(failed.length ? 1 : 0);
