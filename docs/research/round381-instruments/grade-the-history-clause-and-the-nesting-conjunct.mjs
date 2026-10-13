#!/usr/bin/env node
/**
 * Round 381 — grades the two items Theseus routed to me in Round 380, both in `probe-round377`:
 *
 *   §4  The Round 379 repair closed the FIGURE and left the sentence ABOUT the figure reading two of
 *       its numbers live. His counterfactual — one population filename broken, no byte of my file
 *       changed — made B1m publish *"19 … a move of +2 from 16, which lands on 19"*, at exit 0.
 *   §3  I wrote that B1's nesting conjunct `onlyUnderNarrow.length === 0` "breaks if either leg is
 *       re-keyed". He proved a re-key is the one edit that CANNOT break it: `narrowPop` is
 *       `censusPop.filter(…)`, a subset under every predicate, and the membership test is monotone.
 *       His M3 (shape change) reddens B1 but fails BOTH conjuncts at once, so nesting had never been
 *       reddened alone — leaving open whether it guards anything by itself.
 *
 * What this instrument measures, rather than argues:
 *
 *   A. His §4 defect reproduces, and my cure is graded AGAINST IT. The historical span of B1m is
 *      extracted from the printed line and compared across two drives (faithful tree / mutated
 *      population). CURED file: byte-identical span, derived figures moved. HEAD~ file (the Round
 *      379 spelling, read out of git): the same span CHANGES. The second drive is the control that
 *      makes the first a reading rather than a tautology (355) — a grade that passes on both
 *      spellings is grading nothing.
 *   B. The nesting conjunct is reachable as the SOLE false conjunct. Widen the narrow leg by one
 *      file OUTSIDE `census()`'s `/^probe-/` and only-wider stays non-empty while only-narrower
 *      goes positive: B1 red, nesting the only leg that is false. Driven beside a re-key, which
 *      must stay green — the two states are what separate "load-bearing" from "prose".
 *
 * Traps this project has already paid for and this harness honours:
 *   - Whole-line mutation anchors, count asserted `=== 1` (347); `const HERE = …` occurs twice in
 *     the subject, so a substring replace hits the wrong one.
 *   - Every mutation must MOVE a figure it is predicted to move, asserted, so an inert edit cannot
 *     read as "the check cannot catch this" (355).
 *   - A control drive must be exit 0 at 12/12 before any mutated drive is believed.
 *   - `exit != 0` with an empty failing-arm list fails its own grade (the parser, not the subject).
 *   - GRADE lines, and a non-zero exit if any grade is not `true` (356) — a printed self-test that
 *     gates nothing is not a measurement.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SUBJECT =
  'probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts';
const WORK = join(REPO, '.testdata', 'round381');

const grades = [];
const grade = (name, pass, detail = '') => {
  grades.push({ name, pass });
  console.log(`GRADE ${name}: ${pass}${detail ? `  — ${detail}` : ''}`);
};

/** Replace exactly one WHOLE line, or throw (347). */
const oneLine = (src, from, to) => {
  const lines = src.split('\n');
  const hits = lines.filter((l) => l === from).length;
  if (hits !== 1) throw new Error(`line anchor not unique (${hits}): ${from.slice(0, 70)}`);
  return lines.map((l) => (l === from ? to : l)).join('\n');
};
/** Replace every occurrence of a literal, with the occurrence count asserted (347). */
const everyOcc = (src, from, to, expected) => {
  const n = src.split(from).length - 1;
  if (n !== expected) throw new Error(`occurrences ${n} != ${expected} for ${from}`);
  return src.split(from).join(to);
};

const B1_LINE = /^(?:\[ok\]|FAIL) B1 {2}(.*)$/m;
const B1M_LINE = /^\[MEAS\] B1m {2}(.*)$/m;
const figuresOf = (out) => {
  const line = out.match(B1_LINE)?.[1] ?? '';
  const m = line.match(
    /(\d+) members under `probe-round\*` \((\d+) files\), (\d+) under `census\(\)`'s `\/\^probe-\/` \((\d+)\), (\d+) member\(s\) visible ONLY to the wider selector/,
  );
  const only = line.match(/and (\d+) visible only to the narrower/);
  return {
    narrow: m ? Number(m[1]) : null,
    narrowPop: m ? Number(m[2]) : null,
    wide: m ? Number(m[3]) : null,
    widePop: m ? Number(m[4]) : null,
    onlyWider: m ? Number(m[5]) : null,
    onlyNarrower: only ? Number(only[1]) : null,
  };
};
const armsOf = (out) => [
  ...new Set([
    ...[...out.matchAll(/^FAIL (\S+)/gm)].map((m) => m[1]),
    ...[...out.matchAll(/\[(\w+)\] FAIL/g)].map((m) => m[1]),
  ]),
];

/**
 * The span of B1m that is a statement about 10/12 rather than about the tree being read. Both
 * spellings are covered: the cured one opens "First spelling, Round 377:", the Round 379 one opens
 * "The first spelling of this line published". Returns null if neither is found, which fails its own
 * grade rather than comparing two empty strings — two nulls are equal and would pass vacuously.
 */
const historySpanOf = (out) => {
  const line = out.match(B1M_LINE)?.[1] ?? '';
  const cured = line.match(/First spelling, Round 377:.*?had on 10\/12/s);
  if (cured) return { span: cured[0], spelling: 'cured' };
  const prior = line.match(/The first spelling of this line published.*?which lands on 19/s);
  if (prior) return { span: prior[0], spelling: 'round379' };
  return { span: null, spelling: null };
};

const runProbe = (label, path, cwd) => {
  const run = spawnSync('npx', ['tsx', path], { cwd, encoding: 'utf8', timeout: 900_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  mkdirSync(WORK, { recursive: true });
  writeFileSync(join(WORK, `${label}.out`), out);
  const res = {
    label,
    code: run.status,
    arms: armsOf(out),
    all12: /All 12 regression checks passed/.test(out),
    b1Green: /^\[ok\] B1 /m.test(out),
    b1Red: /^FAIL B1 /m.test(out),
    fig: figuresOf(out),
    hist: historySpanOf(out),
  };
  console.log(
    `\n── ${label} ── exit ${res.code} · B1 ${res.b1Red ? 'RED' : res.b1Green ? 'green' : '(absent)'} · ` +
      `failing arms [${res.arms.join(' ') || 'none'}]`,
  );
  console.log(
    `   figures: narrow ${res.fig.narrow}/${res.fig.narrowPop} · census ${res.fig.wide}/${res.fig.widePop} · ` +
      `only-wider ${res.fig.onlyWider} · only-narrower ${res.fig.onlyNarrower}`,
  );
  if (res.code !== 0 && res.arms.length === 0) {
    grade(`${label} parser found the failing arm`, false, 'exit != 0 with an empty arm list');
  }
  return res;
};

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

// ════════════════════════════════════════════════════════════════════════════════════════════════
// A — his §4 counterfactual, against both spellings of my file
// ════════════════════════════════════════════════════════════════════════════════════════════════
//
// The mutation is to the POPULATION, not to the subject, so the subject cannot be relocated out of
// the tree it reads: the whole of `scripts/` is copied and the copy is edited. `probe-round232`
// names `probe-browse-latency-end-to-end.mts`; breaking that string everywhere inside that one file
// drops `probe-round232` out of the census-member list without touching my file at all.
const CARRIER = 'probe-round232-the-remainder-verdict-can-go-red.mts';
const NAMED = 'probe-browse-latency-end-to-end.mts';
const BROKEN = 'probe-browse-latency-end-to-endX.mts';

/** A copy of `scripts/`, optionally with the carrier's references to one population file broken. */
const makeTree = (label, { mutate, subjectSrc }) => {
  const root = join(WORK, label);
  const scripts = join(root, 'scripts');
  cpSync(SCRIPTS, scripts, { recursive: true });
  if (subjectSrc !== undefined) writeFileSync(join(scripts, SUBJECT), subjectSrc);
  const before = readFileSync(join(scripts, SUBJECT), 'utf8');
  if (mutate) {
    const carrier = readFileSync(join(scripts, CARRIER), 'utf8');
    writeFileSync(join(scripts, CARRIER), everyOcc(carrier, NAMED, BROKEN, 3));
  }
  const after = readFileSync(join(scripts, SUBJECT), 'utf8');
  return { root, scripts, subjectUntouched: before === after };
};

const headSrc = spawnSync('git', ['show', `HEAD:scripts/${SUBJECT}`], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).stdout;
grade(
  'A0 the Round 379 spelling was readable out of git HEAD',
  // One SOURCE line, not a reading-order fragment: the clause is split across two template lines in
  // the file, and a cross-line substring would report `false` for the wrong reason.
  typeof headSrc === 'string' &&
    headSrc.includes('spelling of this line published ${namesOther} while explaining a move of'),
  `${headSrc?.length ?? 0} bytes`,
);

const curedFaithful = makeTree('a1-cured-faithful', {});
const a1 = runProbe('a1-cured-faithful', join(curedFaithful.scripts, SUBJECT), REPO);
grade('A1 control in a copied tree: exit 0, all 12 green', a1.code === 0 && a1.all12 === true);
grade(
  'A1 control reproduces the published figures',
  a1.fig.narrow === 17 && a1.fig.narrowPop === 122 && a1.fig.wide === 20 && a1.fig.widePop === 153 &&
    a1.fig.onlyWider === 3 && a1.fig.onlyNarrower === 0,
);
grade('A1 the cured history span is found and is the cured spelling', a1.hist.spelling === 'cured');
grade(
  'A1 the cured history span carries the right constants (known positive on the span, not on an analogy)',
  a1.hist.span !== null &&
    /published 20 beside "a hand reading of 16 moved by 3", which lands on 19/.test(a1.hist.span) &&
    /the hand 16 was one short of the 17 its own narrow selector read, and the \+3 runs from 17/.test(a1.hist.span),
);

const curedMutated = makeTree('a2-cured-mutated', { mutate: true });
grade('A2 the mutation changed no byte of my file', curedMutated.subjectUntouched === true);
const a2 = runProbe('a2-cured-mutated', join(curedMutated.scripts, SUBJECT), REPO);
grade(
  'A2 the mutation MOVED the derived figures it is predicted to move (not inert)',
  a2.fig.wide === 19 && a2.fig.onlyWider === 2 && a2.fig.narrow === 17,
  `census ${a2.fig.wide} · only-wider ${a2.fig.onlyWider}`,
);
grade('A2 the subject is still green on it, as he reported: exit 0, 12/12', a2.code === 0 && a2.all12 === true);
grade(
  'A2 THE CURE: the history span is byte-identical across the two drives',
  a1.hist.span !== null && a2.hist.span !== null && a1.hist.span === a2.hist.span,
);

// The control that makes A2 a reading rather than a tautology: the Round 379 spelling, same two
// drives, must FAIL the same comparison — and must fail it by mis-reporting the numbers he named.
const priorFaithful = makeTree('a3-round379-faithful', { subjectSrc: headSrc });
const a3 = runProbe('a3-round379-faithful', join(priorFaithful.scripts, SUBJECT), REPO);
const priorMutated = makeTree('a4-round379-mutated', { subjectSrc: headSrc, mutate: true });
const a4 = runProbe('a4-round379-mutated', join(priorMutated.scripts, SUBJECT), REPO);
grade('A3 the Round 379 spelling drives green in both trees', a3.code === 0 && a4.code === 0);
grade('A3 its history span is found and is the prior spelling', a3.hist.spelling === 'round379' && a4.hist.spelling === 'round379');
grade(
  'A4 CONTROL: the Round 379 span is NOT identical across the same two drives',
  a3.hist.span !== null && a4.hist.span !== null && a3.hist.span !== a4.hist.span,
);
grade(
  'A4 CONTROL: and it mis-reports exactly what he reported — "published 19", "+2 from 16"',
  a4.hist.span !== null && /published 19 while explaining a move of \+2 from 16, which lands on 19/.test(a4.hist.span),
  a4.hist.span ?? '(no span)',
);

// ════════════════════════════════════════════════════════════════════════════════════════════════
// B — is the nesting conjunct reachable as the SOLE false conjunct?
// ════════════════════════════════════════════════════════════════════════════════════════════════
//
// These mutations are to the SUBJECT, not the population, so the cheaper harness applies: his
// `relocate`, which lifts one copy of the file out of `scripts/` and points it at the real tree.
const A_IMPORT_OUTCOME = "import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';";
const A_IMPORT_STRIP = "import { stripSource } from './lib/strip-source.mjs';";
const A_IMPORT_SWEEP = "import { census, SWEPT } from './sweep-probes.mjs';";
const A_HERE_CODE = 'const HERE = dirname(fileURLToPath(import.meta.url));';
const A_REPO_CODE = "const REPO = join(HERE, '..');";
const A_NARROW = 'const narrowPop = censusPop.filter((f) => /^probe-round/.test(f));';
const abs = (p) => JSON.stringify(join(SCRIPTS, p));
const relocate = (src) => {
  let s = src;
  s = oneLine(s, A_IMPORT_OUTCOME, `import { summariseAndExit, type ProbeVerdict } from ${abs('lib/probe-outcome.mts')};`);
  s = oneLine(s, A_IMPORT_STRIP, `import { stripSource } from ${abs('lib/strip-source.mjs')};`);
  s = oneLine(s, A_IMPORT_SWEEP, `import { census, SWEPT } from ${abs('sweep-probes.mjs')};`);
  s = oneLine(s, A_HERE_CODE, `const HERE = ${JSON.stringify(SCRIPTS)};`);
  s = oneLine(s, A_REPO_CODE, `const REPO = ${JSON.stringify(REPO)};`);
  return s;
};
const driveRelocated = (label, mutate) => {
  const path = join(WORK, `${label}.mts`);
  writeFileSync(path, mutate(relocate(readFileSync(join(SCRIPTS, SUBJECT), 'utf8'))));
  return runProbe(label, path, REPO);
};

const b0 = driveRelocated('b0-control', (s) => s);
grade('B0 relocated control: exit 0, 12/12, B1 green', b0.code === 0 && b0.all12 === true && b0.b1Green);

// B1 · a RE-KEY, which is what my docblock wrongly said breaks nesting. Must stay green.
const bRekey = driveRelocated('b1-narrow-rekeyed', (s) =>
  oneLine(s, A_NARROW, 'const narrowPop = censusPop.filter((f) => /^probe-round3/.test(f));'),
);
grade(
  'B1 the re-key moved both published legs (not inert)',
  bRekey.fig.narrow !== 17 && bRekey.fig.narrowPop !== null && bRekey.fig.narrowPop < 122,
  `narrow ${bRekey.fig.narrow}/${bRekey.fig.narrowPop}`,
);
grade(
  'B1 nesting is STILL 0 under the re-key, and the arm is green — his §3 reproduces',
  bRekey.fig.onlyNarrower === 0 && bRekey.code === 0 && bRekey.b1Green && !bRekey.b1Red,
);

// B2 · THE FINDING: a SHAPE change that widens the narrow leg by ONE file outside `/^probe-/`.
// `sweep-probes.mjs` is named by swept probes that name no probe FILE, so they join the narrow
// member list without joining the census one; and none of the three only-wider members name it, so
// only-wider survives. That is the state in which nesting is the only false conjunct.
const bShape = driveRelocated('b2-narrow-widened-off-census', (s) =>
  oneLine(
    s,
    A_NARROW,
    "const narrowPop = censusPop.filter((f) => /^probe-round/.test(f)).concat('sweep-probes.mjs');",
  ),
);
grade(
  'B2 the shape change moved the narrow member list it is predicted to move (not inert)',
  bShape.fig.narrow !== null && bShape.fig.narrow > 17,
  `narrow ${bShape.fig.narrow}`,
);
grade('B2 B1 is RED', bShape.b1Red === true && bShape.code !== 0);
grade('B2 B1 is the SOLE failing arm', bShape.arms.length === 1 && bShape.arms[0] === 'B1', bShape.arms.join(' ') || 'none');
grade(
  'B2 THE FINDING: nesting is the SOLE false conjunct — only-wider still non-empty, only-narrower positive',
  bShape.fig.onlyWider !== null && bShape.fig.onlyWider > 0 && bShape.fig.onlyNarrower > 0,
  `only-wider ${bShape.fig.onlyWider} · only-narrower ${bShape.fig.onlyNarrower}`,
);
grade(
  'B2 and the only-wider leg is untouched at 3, so the red is attributable to nesting alone',
  bShape.fig.onlyWider === 3,
  `only-wider ${bShape.fig.onlyWider}`,
);

// B3 · his M3 shape, for the contrast that is the whole point: a widening that absorbs all three
// only-wider members fails BOTH conjuncts, which is why nesting had never been reddened alone.
const bHis = driveRelocated('b3-his-m3-shape', (s) =>
  oneLine(
    s,
    A_NARROW,
    "const narrowPop = census(HERE).filter((f) => /^probe-round/.test(f)).concat('summariseAndExit');",
  ),
);
grade('B3 his M3 reproduces: B1 red', bHis.b1Red === true);
grade(
  'B3 his M3 fails BOTH conjuncts at once, which mine does not',
  bHis.fig.onlyWider === 0 && bHis.fig.onlyNarrower > 0,
  `only-wider ${bHis.fig.onlyWider} · only-narrower ${bHis.fig.onlyNarrower}`,
);

const bad = grades.filter((g) => g.pass !== true);
console.log('');
console.log(bad.length === 0 ? `ALL ${grades.length} GRADES TRUE` : `GRADES NOT TRUE: ${bad.map((g) => g.name).join(' | ')}`);
process.exit(bad.length === 0 ? 0 : 1);
