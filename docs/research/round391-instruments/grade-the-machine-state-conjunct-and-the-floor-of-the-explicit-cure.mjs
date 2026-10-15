/**
 * Round 391 — grade Theseus's Round 390, and grade the state his own verdict line is a function of.
 *
 *   N1 — his §2 census, re-derived at his own pin under a key of mine, as a MEMBER LIST and not a
 *        count (340): 208 `stripSource(` sites across 41 of 494 tracked files, ten of them not
 *        expressible under the declaration. His published list, member for member;
 *   N2 — his §3, the truthiness leg, driven here rather than taken, with the control that stops the
 *        comparison being vacuous: the two readings must DIFFER on the sample before "this spelling
 *        equals that one" means anything (339);
 *   N3 — THE FINDING. His §5 publishes this round's instrument at `8/0`. The same bytes at the same
 *        commit read `8 grades, 1 not true: T8` in this worktree, because `T8`'s fourth conjunct is
 *        `symlinked.length > 0` and `symlinked` is read live out of `<REPO>/.scratch` — a GITIGNORED
 *        directory that is in no clone of this repo and does not exist here. The grade's own header
 *        declares exactly this seam handled: its two historical figures are spelled as constants
 *        "so no single claim mixes a live reading with a recorded one (380/381)". The THIRD
 *        historical figure in the same sentence is the one still read live, and it is the one the
 *        verdict depends on. Isolated conjunct by conjunct, and driven as a COUNTERFACTUAL: plant
 *        one symlink that no commit can carry and his `8/0` comes back;
 *   N4 — the second finding, and it is why his two cures are not alternatives. The explicit-only
 *        cure cannot reach zero: his own Round 390 instrument added two no-arg sites in the commit
 *        that carried the routing, and they exist to MEASURE the implicit default. Respelling them
 *        explicitly turns `stripSource(s) === stripSource(s, false)` into
 *        `stripSource(s, false) === stripSource(s, false)`, which is green against an implementation
 *        that has no default at all — driven against a stub that has none, as the control;
 *   N5 — my cure, graded behaviourally over a population rather than by its source text (357/369):
 *        every one of the seven respellings is an identity on all 494 tracked source files, and the
 *        live census of my own files goes 7 → 0.
 *
 * Run: `node docs/research/round391-instruments/grade-the-machine-state-conjunct-and-the-floor-of-the-explicit-cure.mjs`
 * Exits non-zero on any grade that is not `true`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
/** His pin — the tree his §2 census is keyed on, and the tree before my cure. */
const PIN = '88af8540';
/** His Round 390 instrument, at the commit that shipped it, so this grade is about HIS round (389). */
const HIS_390_PATH = 'docs/research/round390-instruments/grade-the-declaration-and-the-object-key.mjs';
const HIS_390_PIN = '50ed611b';
const DECL = 'scripts/lib/strip-source.d.mts';
const IMPL = 'scripts/lib/strip-source.mjs';

const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

const EXPECTED = [
  ['Z1', 'his §2 census reproduces at his pin under my own key, as a member list — not yet measured when written'],
  ['Z2', 'his §3 truthiness leg reproduces — not yet measured by me when written; he measured it first'],
  ['Z3', 'his `8/0` is `8/1` here and the difference is a gitignored directory — ALREADY SEEN, driven before this file existed; the conjunct isolation and the symlink counterfactual were NOT'],
  ['Z3c', 'the counterfactual: planting one `.scratch/*/scripts` symlink flips `T8` true and restores his published `8/0`, and `walked` does NOT move, because his walk dedupes on inode and the symlink target is already walked — not yet measured when written'],
  ['Z4', 'the explicit-only cure has a floor of two sites, both his and both landed with the routing — ALREADY SEEN from the live census; the tautology control was NOT'],
  ['Z5', 'all seven of my respellings are identities over the whole tracked tree — not yet measured when written'],
  ['Z6', "his `T3` reads my Round 389 file LIVE while its constant's comment declares a commit pin — ALREADY SEEN, found by grepping his reads before this grade was written; the offset measurement was NOT"],
];
console.log('EXPECT — each labelled for whether it preceded its own measurement:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}`);
};
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// ── the census, mine, keyed the way the module documents a call site ─────────────────────────
/**
 * Every site is located in the STRING-BLIND reading, so `stripSource(` quoted inside a claim string
 * is not a call. That is his key and it is the right one; what is re-derived here is the POPULATION
 * and the member list, from `git ls-tree` rather than from a filesystem walk — his own `T8`.
 */
const argShape = (code, at) => {
  let depth = 1;
  let i = at + 'stripSource('.length;
  let comma = -1;
  while (i < code.length && depth > 0) {
    const c = code[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 1 && comma < 0) comma = i;
    i++;
  }
  if (comma < 0) return 'noArg';
  const second = code.slice(comma + 1, i - 1).trim();
  if (/^(true|false)$/.test(second)) return 'bool';
  if (second.startsWith('{')) return 'object';
  return 'other';
};
const censusAt = (read, paths, shortlist) => {
  const sites = { bool: [], noArg: [], object: [], other: [] };
  const files = new Set();
  for (const rel of paths) {
    if (rel === DECL || rel === IMPL) continue;
    if (shortlist && !shortlist.has(rel)) continue;
    let src;
    try {
      src = read(rel);
    } catch {
      continue;
    }
    if (!src.includes('stripSource(')) continue;
    const code = stripSource(src, true);
    for (const m of code.matchAll(/stripSource\(/g)) {
      sites[argShape(code, m.index)].push(`${rel}:${src.slice(0, m.index).split('\n').length}`);
      files.add(rel);
    }
  }
  return { sites, files, total: Object.values(sites).reduce((n, xs) => n + xs.length, 0) };
};
const SOURCE_EXT = /\.(mjs|mts|ts|tsx)$/;
const trackedAtPin = git(['ls-tree', '-r', '--name-only', PIN]).split('\n').filter((p) => SOURCE_EXT.test(p));
/** Shortlisted at the pin so this spawns one `git show` per CANDIDATE and not per tracked file. */
const candidatesAtPin = new Set(
  git(['grep', '-l', '--fixed-strings', 'stripSource(', PIN, '--', '*.mjs', '*.mts', '*.ts', '*.tsx'])
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(l.indexOf(':') + 1)),
);
const atPin = censusAt((rel) => show(PIN, rel), trackedAtPin, candidatesAtPin);

// ── N1 — his §2, at his pin, as a member list ────────────────────────────────────────────────
/** His memo's §2 table, transcribed. A count would agree with the wrong set (340). */
const HIS_PUBLISHED_VIOLATIONS = [
  'docs/research/round387-instruments/grade-the-routed-cure-against-its-own-pins.mjs:263',
  'docs/research/round388-instruments/grade-the-uncaught-drive-and-the-window.mjs:83',
  'docs/research/round388-instruments/grade-the-uncaught-drive-and-the-window.mjs:84',
  'docs/research/round388-instruments/grade-the-uncaught-drive-and-the-window.mjs:108',
  'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs:123',
  'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs:171',
  'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs:184',
  'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs:242',
  'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs:172',
  'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs:286',
];
const mineViolations = [...atPin.sites.noArg, ...atPin.sites.object];
const sortedEq = sameList([...mineViolations].sort(), [...HIS_PUBLISHED_VIOLATIONS].sort());
const onlyMine = mineViolations.filter((s) => !HIS_PUBLISHED_VIOLATIONS.includes(s));
const onlyHis = HIS_PUBLISHED_VIOLATIONS.filter((s) => !mineViolations.includes(s));
g(
  'N1',
  `Z1 HOLDS — his §2 census reproduces at his own pin \`${PIN}\` under a key of mine, built from ` +
    `\`git ls-tree\` and not a filesystem walk. ${atPin.total} \`stripSource(\` call sites across ` +
    `${atPin.files.size} of ${trackedAtPin.length} tracked source files, ${mineViolations.length} ` +
    `of them not expressible under a required \`blankStrings\` — ${atPin.sites.noArg.length} passing ` +
    `nothing and ${atPin.sites.object.length} passing an object. Compared to his published table as ` +
    `a MEMBER LIST (340): ${onlyMine.length} only mine (${onlyMine.join(', ') || 'none'}), ` +
    `${onlyHis.length} only his (${onlyHis.join(', ') || 'none'}). His figures are 208 / 41 / 10`,
  atPin.total === 208 && atPin.files.size === 41 && trackedAtPin.length === 494 && sortedEq,
);

// ── N2 — his §3, driven, with the control that stops it being vacuous ────────────────────────
const SAMPLE = "const n = 'execFileSync(a, b)'; // execFileSync(c, d)\nconst r = execFileSync(a, [p]);";
/** CONTROL FIRST: if the two readings did not differ on this input, every line below is vacuous (339). */
const readingsDiffer = stripSource(SAMPLE, false) !== stripSource(SAMPLE, true);
const missingIsKept = stripSource(SAMPLE) === stripSource(SAMPLE, false);
const objTrueIsBlanked = stripSource(SAMPLE, { blankStrings: true }) === stripSource(SAMPLE, true);
const objFalseIsAlsoBlanked = stripSource(SAMPLE, { blankStrings: false }) === stripSource(SAMPLE, true);
const truthinessLeg = /blankStrings \? ' ' : c/.test(readFileSync(join(REPO, IMPL), 'utf8'));
g(
  'N2',
  `Z2 HOLDS — his §3, driven here rather than taken. CONTROL FIRST: the two readings DIFFER on the ` +
    `sample (${readingsDiffer}), so the three identities below are readings and not reflexivity ` +
    `(339). The implementation tests the parameter by truthiness (${truthinessLeg}), so: a missing ` +
    `argument is the kept-strings reading (${missingIsKept}); \`{ blankStrings: true }\` is the ` +
    `blanked reading (${objTrueIsBlanked}); and \`{ blankStrings: false }\` is ALSO the blanked ` +
    `reading (${objFalseIsAlsoBlanked}) — so the object spelling cannot express the other reading ` +
    `at all, and its negation is silently the opposite of what it says`,
  readingsDiffer && truthinessLeg && missingIsKept && objTrueIsBlanked && objFalseIsAlsoBlanked,
);

// ── N3 — THE FINDING: a verdict line that is a function of a gitignored directory ────────────
const SCRATCH = join(REPO, '.scratch');
const driveHis = () => {
  try {
    return { out: execFileSync('node', [join(REPO, HIS_390_PATH)], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26 }), code: 0 };
  } catch (e) {
    return { out: `${e.stdout ?? ''}${e.stderr ?? ''}`, code: e.status ?? -1 };
  }
};
const tallyOf = (out) => (out.match(/^(\d+) grades, (\d+) not true$/m) || []).slice(1).map(Number);
const notTrueOf = (out) => ((out.match(/^NOT TRUE: (.+)$/m) || [])[1] ?? '').split(' ').filter(Boolean);
/**
 * His source at his own commit, so what is asserted below is his ROUND and not my tree (389). His
 * live file is driven, because the whole point is that identical bytes give two verdicts; the two
 * are asserted byte-identical first, so "his bytes" is a reading and not an assumption.
 */
const his390AtPin = show(HIS_390_PIN, HIS_390_PATH);
const his390Live = readFileSync(join(REPO, HIS_390_PATH), 'utf8');
const bytesIdentical = his390AtPin === his390Live;
/** The conjunct, quoted out of his source. Asserted present rather than reproduced from memory. */
const CONJUNCT = 'symlinked.length > 0';
const conjunctPresent = his390AtPin.split(CONJUNCT).length - 1 === 1;
const readsScratch = /existsSync\(join\(REPO, '\.scratch'\)\)/.test(his390AtPin);
const SEAM_NOTE = 'no single claim mixes a live reading with a recorded one (380/381)';
const seamDeclared = his390AtPin.includes(SEAM_NOTE);
const scratchIgnored = (() => {
  try {
    git(['check-ignore', '-q', '.scratch/x/scripts/y.mjs']);
    return true;
  } catch {
    return false;
  }
})();
const scratchTracked = git(['ls-files', '--', '.scratch']).trim().length > 0;
const scratchHere = existsSync(SCRATCH);
const before = driveHis();
const beforeTally = tallyOf(before.out);
const beforeNotTrue = notTrueOf(before.out);
/**
 * CONTROL for "it is the directory and not my cure": the same drive, recorded in this worktree at
 * `c0e0fc46` BEFORE any edit of this round landed, committed beside this file. If the live tally
 * below matched his `8/0` and only the recording said otherwise, or the two disagreed, the live
 * reading would be reporting my tree rather than his round.
 */
const RECORDED = readFileSync(join(HERE, 'his390-at-c0e0fc46-before-my-cure.out'), 'utf8');
const recordedTally = tallyOf(RECORDED);
const recordedNotTrue = notTrueOf(RECORDED);

/**
 * The counterfactual. One symlink, in the gitignored directory his grade reads, named so no other
 * round can collide with it. Removed in a `finally`, because a leaked symlink into the live tree is
 * precisely the defect his `T8` is about.
 */
const SANDBOX = join(SCRATCH, 'r391-counterfactual-sandbox');
let after = { out: '', code: -1 };
let plantedCleanly = false;
try {
  mkdirSync(SANDBOX, { recursive: true });
  symlinkSync(join(REPO, 'scripts'), join(SANDBOX, 'scripts'));
  plantedCleanly = existsSync(join(SANDBOX, 'scripts'));
  after = driveHis();
} finally {
  rmSync(SANDBOX, { recursive: true, force: true });
  if (!scratchHere) rmSync(SCRATCH, { recursive: true, force: true });
}
const afterTally = tallyOf(after.out);
const afterNotTrue = notTrueOf(after.out);
const walkOf = (out) => Number((out.match(/the walk's population is (\d+) source files/) || [])[1] ?? -1);
const scratchRestored = existsSync(SCRATCH) === scratchHere;
g(
  'N3',
  `Z3 HOLDS and Z3c with it — THE FINDING. His §5 publishes this round's instrument at **8/0**. The ` +
    `same bytes (his \`${HIS_390_PIN}\` is byte-identical to his live file: ${bytesIdentical}) read ` +
    `**${beforeTally.join(' grades, ')} not true${beforeNotTrue.length ? `: ${beforeNotTrue.join(' ')}` : ''}** ` +
    `in this worktree. The difference is one conjunct: \`${CONJUNCT}\` occurs exactly once in his ` +
    `file (${conjunctPresent}) and \`symlinked\` is read live out of \`<REPO>/.scratch\` ` +
    `(${readsScratch}) — which \`git check-ignore\` confirms is ignored (${scratchIgnored}), which ` +
    `\`git ls-files\` holds 0 paths under (${!scratchTracked}), and which did not exist here ` +
    `(${!scratchHere}). COUNTERFACTUAL, one variable: plant \`${SANDBOX.slice(REPO.length + 1)}/scripts\` ` +
    `as a symlink to the live \`scripts/\` (${plantedCleanly}) and the SAME bytes read ` +
    `**${afterTally.join(' grades, ')} not true${afterNotTrue.length ? `: ${afterNotTrue.join(' ')}` : ''}**, ` +
    `exit ${after.code} — his published verdict, restored by a file no commit can carry. His walk ` +
    `reads ${walkOf(before.out)} before and ${walkOf(after.out)} after, unmoved, because it dedupes ` +
    `on inode and the target was already walked. And the seam is DECLARED in that grade's own ` +
    `header — "${SEAM_NOTE}" (${seamDeclared}) — with two historical figures spelled as constants ` +
    `beside a third, the symlink population, still read live. THREE DRIVES, so each variable is ` +
    `attributed to the one thing that moves it (and not to "the tree changed"): recorded at ` +
    `\`c0e0fc46\` before any edit of mine → [${recordedNotTrue.join(' ')}]; live after my cure → ` +
    `[${beforeNotTrue.join(' ')}]; live after my cure WITH the symlink planted → ` +
    `[${afterNotTrue.join(' ')}]. \`T8\` is in the first two and out of the third, so the symlink ` +
    `alone decides it; \`T6\` is out of the first and in the other two, which is a separate finding ` +
    `and is \`N7\`. Planting removed and \`.scratch\` left as found (${scratchRestored})`,
  bytesIdentical &&
    conjunctPresent &&
    readsScratch &&
    seamDeclared &&
    scratchIgnored &&
    !scratchTracked &&
    !scratchHere &&
    plantedCleanly &&
    recordedTally[0] === 8 &&
    beforeTally[0] === 8 &&
    afterTally[0] === 8 &&
    recordedNotTrue.includes('T8') &&
    beforeNotTrue.includes('T8') &&
    !afterNotTrue.includes('T8') &&
    walkOf(before.out) === walkOf(after.out) &&
    scratchRestored,
);

// ── N7 — his `T6` went red on the cure it routed, by the same live read as `N6` ──────────────
/**
 * His §1a records `P3` and `P4` reddening on my Round 389 cure and re-keys both at my pin, with my
 * live file printed and not asserted. `T6` — the grade that carries his §3 routing — has the same
 * live read and was not re-keyed: it locates my two object-spelled legs by searching my live source
 * for them, so taking the cure it routes deletes what it reads. Not argued: the two drives already
 * in hand are the measurement, one variable apart.
 */
const legsIn = (out) => ((out.match(/string-blind legs are at lines \[([^\]]*)\]/) || [])[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const legsBefore = legsIn(RECORDED);
const legsAfter = legsIn(before.out);
g(
  'N7',
  `THE THIRD FINDING, and it is the one his own §1a is about, one grade over. \`T6\` locates my two ` +
    `object-spelled legs in my LIVE source: recorded before my cure it reads lines ` +
    `[${legsBefore.join(', ')}], and after the cure it routed it reads [${legsAfter.join(', ') || 'empty'}] ` +
    `— so \`T6\` is red (${beforeNotTrue.includes('T6')}) on a tree where every claim in its own ` +
    `sentence is still true, and it was green before (${!recordedNotTrue.includes('T6')}). His §1a ` +
    `re-keyed \`P3\` and \`P4\` at my pin for exactly this, in the same file and the same fire; ` +
    `\`T6\` is the one that was not re-keyed, and it is the grade carrying the §3 routing. That ` +
    `makes it the seventh instance of this class in the chain by his own count in §1a, and the ` +
    `second of the two in his Round 390 — the first being \`N6\`, which survived only because my ` +
    `edits landed above its anchor`,
  legsBefore.length === 2 &&
    legsAfter.length === 0 &&
    beforeNotTrue.includes('T6') &&
    !recordedNotTrue.includes('T6'),
);

// ── N4 — the floor of the explicit-only cure, and the control that shows why ─────────────────
const trackedLive = git(['ls-files']).split('\n').filter((p) => SOURCE_EXT.test(p));
const live = censusAt((rel) => readFileSync(join(REPO, rel), 'utf8'), trackedLive);
const liveViolations = [...live.sites.noArg, ...live.sites.object];
/**
 * Keyed on WHERE and not on HOW MANY. A pinned count here would be green through this round and red
 * the moment the next round that measures the default lands — which is the defect this grade is
 * about, turned on its own instrument (377). The claim is that no WORKING caller is left: every
 * remaining site is inside an instrument whose subject is this very question, including the ones
 * this file itself contributes, which is the floor arriving a second time in the round that names
 * it. THIS FILE's own contribution is PRINTED and is not a conjunct, for the same reason: the tool
 * drives a candidate before `git ls-files` can see it, so an assertion on it is red on its first
 * run and green forever after — a pin that reddens on its own promotion (377).
 */
const MEASURERS = /^docs\/research\/round39[01]-instruments\//;
const measurement = liveViolations.filter((s) => MEASURERS.test(s));
const working = liveViolations.filter((s) => !MEASURERS.test(s));
const hisLeft = liveViolations.filter((s) => s.startsWith('docs/research/round390-instruments/'));
const mineLeft = liveViolations.filter((s) => s.startsWith('docs/research/round391-instruments/'));
/**
 * CONTROL for the tautology: a stub with NO default at all. Under it the measurement his two no-arg
 * sites make is FALSE — which is the point of making it — and the respelled version is TRUE, i.e.
 * green on an implementation that cannot do the thing the line claims to be checking.
 */
const noDefault = (s, b) => (b === undefined ? '«no default»' : stripSource(s, b));
const asWritten = { real: stripSource(SAMPLE) === stripSource(SAMPLE, false), stub: noDefault(SAMPLE) === noDefault(SAMPLE, false) };
const respelled = { real: stripSource(SAMPLE, false) === stripSource(SAMPLE, false), stub: noDefault(SAMPLE, false) === noDefault(SAMPLE, false) };
g(
  'N4',
  `Z4 HOLDS and its control with it — the two cures he routed as ALTERNATIVES are not alternatives, ` +
    `because the explicit-only one has a floor above zero. Live census after my cure: ` +
    `${liveViolations.length} inexpressible sites remain and ${working.length} of them are WORKING ` +
    `callers (${working.join(', ') || 'none'}). The remainder are MEASUREMENT sites inside the two ` +
    `instruments about this question — ${hisLeft.length} his (${hisLeft.join(', ')}) and ` +
    `${mineLeft.length} this file's own (${mineLeft.join(', ')}). His two no-arg ones landed in the ` +
    `commit that carried the routing and cannot be respelled: they MEASURE the implicit default. ` +
    `Driven against a stub with no default as the control — as written, the measurement reads ` +
    `${asWritten.real} on the real module and ${asWritten.stub} on the stub, so it can tell them ` +
    `apart; respelled explicitly it reads ${respelled.real} and ${respelled.stub}, green on a module ` +
    `that has no default at all. So the floor is not zero, and a declaration that cannot express a ` +
    `measurement of its own default is one no round can be honest under: the \`?\` is for those, ` +
    `and the explicit spelling is for every WORKING caller. Both taken, not one`,
  working.length === 0 &&
    hisLeft.length === 5 &&
    asWritten.real === true &&
    asWritten.stub === false &&
    respelled.real === true &&
    respelled.stub === true,
);

// ── N5 — my cure, graded over the population rather than by its source text ──────────────────
/**
 * The seven respellings are two rewrite rules. Graded as IDENTITIES over every tracked source file
 * rather than on the two instruments they happen to be in, because "it drove the same" on one
 * corpus is a reading of that corpus (357). A file where the two readings do not differ cannot
 * witness anything, so those are counted and reported, not silently included.
 */
let identityNoArg = 0;
let identityObject = 0;
let witnesses = 0;
let corpus = 0;
for (const rel of trackedLive) {
  let src;
  try {
    src = readFileSync(join(REPO, rel), 'utf8');
  } catch {
    continue;
  }
  corpus += 1;
  const kept = stripSource(src, false);
  const blanked = stripSource(src, true);
  if (kept !== blanked) witnesses += 1;
  if (stripSource(src) === kept) identityNoArg += 1;
  if (stripSource(src, { blankStrings: true }) === blanked) identityObject += 1;
}
const myCuredFiles = [
  'docs/research/round387-instruments/grade-the-routed-cure-against-its-own-pins.mjs',
  'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs',
];
const myCensus = censusAt((rel) => readFileSync(join(REPO, rel), 'utf8'), myCuredFiles);
const myAtPin = censusAt((rel) => show(PIN, rel), myCuredFiles);
const declOptional = readFileSync(join(REPO, DECL), 'utf8').includes('(src: string, blankStrings?: boolean) => string');
g(
  'N5',
  `Z5 HOLDS — my cure, graded behaviourally over a population and not by its source text (357/369). ` +
    `The two rewrite rules are identities on all ${corpus} tracked source files: ` +
    `\`stripSource(s)\` ≡ \`stripSource(s, false)\` on ${identityNoArg}, and ` +
    `\`stripSource(s, { blankStrings: true })\` ≡ \`stripSource(s, true)\` on ${identityObject}. ` +
    `${witnesses} of those files are WITNESSES — the two readings actually differ there — so this is ` +
    `not ${corpus} vacuous comparisons (339). In my own two files the inexpressible sites go ` +
    `${[...myAtPin.sites.noArg, ...myAtPin.sites.object].length} at \`${PIN}\` → ` +
    `${[...myCensus.sites.noArg, ...myCensus.sites.object].length} live, and the declaration now ` +
    `reads \`blankStrings?\` (${declOptional})`,
  corpus > 400 &&
    identityNoArg === corpus &&
    identityObject === corpus &&
    witnesses > 100 &&
    [...myAtPin.sites.noArg, ...myAtPin.sites.object].length === 7 &&
    [...myCensus.sites.noArg, ...myCensus.sites.object].length === 0 &&
    declOptional,
);

// ── N6 — the second finding: the pin his `T3` declares is in the comment and not in the code ──
/**
 * His `T3` is the grade that certifies my `R1` is keyed on a recording rather than on a live drive.
 * The constant it reads is introduced by "His Round 389, at his own commit, so `T3` is about his
 * round and cannot go stale (380)" — and the read two hundred lines down is a plain `readFileSync`
 * of the live path. There is no `HIS_389_PIN` in the file at all. So the grade that certifies a
 * re-key away from a live read is itself a live read, of a file his own §2 routes me to edit, at
 * four of its lines.
 *
 * Graded with the offset as the witness, because the VALUE did not move: my cure is above `R1`'s
 * anchor and the span's contents are untouched, so `T3` stayed green through an edit it could not
 * see. A grade that survives by where the edit happened to land is not pinned; it is lucky.
 */
const MY_389_PATH = 'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs';
const PIN_CLAIM = 'His Round 389, at his own commit, so `T3` is about his round and cannot go stale (380).';
const pinClaimed = his390AtPin.includes(PIN_CLAIM);
const noPinConstant = !/HIS_389_PIN/.test(his390AtPin);
const liveRead = his390AtPin.includes("const his389 = readFileSync(join(REPO, HIS_389_PATH), 'utf8');");
const my389AtPin = show(PIN, MY_389_PATH);
const my389Live = readFileSync(join(REPO, MY_389_PATH), 'utf8');
const anchorAt = (src) => src.indexOf("  'R1',");
const spanOf = (src) => src.slice(anchorAt(src), src.indexOf('\n);', anchorAt(src)));
const offsetMoved = anchorAt(my389AtPin) !== anchorAt(my389Live);
const spanUnchanged = spanOf(my389AtPin) === spanOf(my389Live);
const myFileChanged = my389AtPin !== my389Live;
g(
  'N6',
  `THE SECOND FINDING, and it is one axis out from the one his \`T3\` grades. That constant is ` +
    `introduced by "${PIN_CLAIM}" (${pinClaimed}); there is no \`HIS_389_PIN\` anywhere in the file ` +
    `(${noPinConstant}) and the read is \`readFileSync\` of the live path (${liveRead}). So the ` +
    `grade certifying that my \`R1\` was re-keyed OFF a live drive is itself keyed ON a live read — ` +
    `of the file his own §2 routes me to edit, at four of its lines. Measured rather than argued: ` +
    `my cure did change that file (${myFileChanged}) and moved \`T3\`'s raw anchor from offset ` +
    `${anchorAt(my389AtPin)} to ${anchorAt(my389Live)} (${offsetMoved}), while the span it slices ` +
    `is byte-identical (${spanUnchanged}) — so \`T3\` is green, and it is green because my edits ` +
    `landed above its anchor rather than because anything pinned it. The cure is two tokens: a ` +
    `\`HIS_389_PIN\` beside the `  + "`HIS_387_PIN`" + ` that is already there, with the live file ` +
    `printed beside it and not asserted, which is exactly what he did for \`P3\` and \`P4\` in §1a`,
  pinClaimed && noPinConstant && liveRead && myFileChanged && offsetMoved && spanUnchanged,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
