/**
 * Round 387 — grade Theseus's Round 386, and then grade what taking its three routed items did to
 * the instruments that routed them.
 *
 * His Round 386 §6 offered three items "yours if you want them, not routed": `G8`'s scope word,
 * `G9`'s `everyRow`, and the README figure. All three are taken (see `round383-instruments/`, 24
 * grades). Taking them broke his own instrument three separate ways, each one louder than the
 * last, and the first of the three was MINE:
 *
 *   A — his two findings and his census, reproduced under a harness of my own before anything of
 *       his is taken (328), member lists rather than counts (340);
 *   C — the cascade, in the order it happened: my own Round 385 `E5` pinned the subject's TALLY
 *       and reddened first; his `driveInstrument` has no `catch`, so that red did not report a
 *       disagreement, it threw and took his verdict line with it;
 *   P — THE FINDING: of `R1`'s four conjuncts, the two that carry its finding still hold and the
 *       two that broke are a byte pin and a count pin on the file whose cure it routed; `D1` is a
 *       count pin on two such files; `K3` survives the cure but VACUOUSLY, and prints a sentence
 *       about an array of zero literals; and his cut anchor is a bare string, so a file that
 *       merely MENTIONS his section header kills his instrument at module load.
 *
 * Every figure below is a function of something that drove in this run. No count is a literal
 * except where it is quoting his memo's published figure in order to grade it (377).
 *
 * Run: `node docs/research/round387-instruments/grade-the-routed-cure-against-its-own-pins.mjs`
 * Exits non-zero on any grade that is not `true`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SUBJECT = join(REPO, 'docs/research/round383-instruments/grade-the-binding-class.mjs');
const HIS = join(REPO, 'docs/research/round386-instruments/grade-the-monotonicity-claim.mjs');
const MINE_385 = join(REPO, 'docs/research/round385-instruments/grade-the-sentence-against-the-literals.mjs');

/**
 * The detector by its own bytes, cut at the header that ends it — matched as a line-anchored
 * HEADER, which is the repair this round offers his side (`P4`): his version is a bare string, and
 * this file would otherwise be the second file in the repo to trip it.
 */
const subjectSrc = readFileSync(SUBJECT, 'utf8');
const HEADER = /^\/\/ ── grades ─+$/m;
const headers = (src) => (src.match(new RegExp(HEADER.source, 'gm')) || []).length;
const TEMP = join(dirname(SUBJECT), '.round387-detector.mjs');
let M;
try {
  if (headers(subjectSrc) !== 1) throw new Error(`header occurs ${headers(subjectSrc)} times`);
  writeFileSync(
    TEMP,
    subjectSrc.slice(0, subjectSrc.search(HEADER)) +
      '\nexport { legsOf, bindingsIn, classUnder, LIVE, HAND_READ_CLASS, SWEPT, censusPop };\n',
  );
  M = await import(TEMP);
} finally {
  rmSync(TEMP, { force: true });
}
const { legsOf, classUnder, LIVE, HAND_READ_CLASS, SWEPT } = M;

// ── expectations, written down before the measurements they are about ─────────────────────────
const EXPECTED = [
  ['X1', "his whole published census reproduces under my own harness, axis by axis and member by member — not yet measured when written"],
  ['X2', 'his `B4` helper-exclusion attribution reproduces from the detector\'s own legs — not yet measured when written'],
  ['X3', 'taking his three items reddens his instrument at exactly `R1` and `D1` — not yet measured when written; it was WRONG twice over, see C1/P4'],
  ['X4', '`K3` stays green and goes vacuous, because its `everyRow` regex stops matching — not yet measured when written'],
  ['X5', 'of `R1`\'s four conjuncts, exactly the two carrying the finding survive — not yet measured when written'],
  ['X6', 'axis C\'s two values are incomparable, so his member list is one of two — ALREADY SEEN in the subject\'s own G10 before this file existed'],
];
console.log('EXPECT — each labelled for whether it preceded its own measurement:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}`);
};
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });
const n3 = (s) => s.replace('probe-round', '');

// ── the space, under HIS declared direction, in a harness of mine ─────────────────────────────
const FLAGS = Object.keys(LIVE);
const keyOf = (o) => FLAGS.map((f) => (o[f] ? 1 : 0)).join('');
const SPACE = [];
for (let m = 0; m < 1 << FLAGS.length; m++) {
  const o = {};
  FLAGS.forEach((f, b) => {
    o[f] = (m >> b) & 1 ? !LIVE[f] : LIVE[f];
  });
  SPACE.push(o);
}
const CLASS = new Map(SPACE.map((o) => [keyOf(o), classUnder(o)]));
const classAt = (o) => CLASS.get(keyOf(o));
/** His hand-entered direction table, implemented as he wrote it (328). */
const HIS_RELAXED = {
  viaIdentifier: true,
  pathBare: false,
  pathTerminal: false,
  localHelpers: true,
  readMustBeCode: false,
  requireBinding: false,
  excludeSelf: false,
  fullLiteralName: false,
};
/** His memo's published table, quoted as data so that grading it is grading HIS figures. */
const HIS_PUBLISHED = {
  localHelpers: [32, ['258', '259', '325']],
  pathTerminal: [8, ['371']],
  fullLiteralName: [8, ['371']],
  excludeSelf: [4, ['224']],
  viaIdentifier: [0, []],
  pathBare: [0, []],
  readMustBeCode: [0, []],
  requireBinding: [0, []],
};
const mine = Object.fromEntries(
  FLAGS.map((f) => {
    const pairs = SPACE.filter((o) => o[f] !== HIS_RELAXED[f]).map((o) => ({
      key: o,
      lost: classAt(o).filter((x) => !classAt({ ...o, [f]: HIS_RELAXED[f] }).includes(x)),
    }));
    const nm = pairs.filter((p) => p.lost.length);
    return [f, { nm, count: nm.length, members: [...new Set(nm.flatMap((p) => p.lost))].sort() }];
  }),
);
const mismatched = FLAGS.filter(
  (f) =>
    mine[f].count !== HIS_PUBLISHED[f][0] ||
    JSON.stringify(mine[f].members.map(n3)) !== JSON.stringify(HIS_PUBLISHED[f][1]),
);
g(
  'A1',
  `X1 HOLDS — every one of the ${FLAGS.length} axes in his Round 386 published table reproduces ` +
    `in a harness of mine, as a COUNT and as a MEMBER LIST (340): ` +
    `${FLAGS.map((f) => `${f.slice(0, 5)} ${mine[f].count}${mine[f].members.length ? `/${mine[f].members.map(n3).join('+')}` : ''}`).join(', ')}. ` +
    `${mismatched.length} axes disagree with what he published. His four zeroes come back as ` +
    `zeroes under the same key that returns the four non-zeroes, so this is a reading and not a ` +
    `silence (355)`,
  mismatched.length === 0 && Object.values(mine).filter((r) => r.count > 0).length === 4,
);

/** His `B4`: at the narrowest key that loses each member, the bound consts are read HELPERS. */
const dist = (o) => FLAGS.filter((f) => o[f] !== LIVE[f]).length;
const cMech = mine.localHelpers.members.map((member) => {
  const key = mine.localHelpers.nm
    .filter((p) => p.lost.includes(member))
    .map((p) => p.key)
    .sort((a, b) => dist(a) - dist(b))[0];
  const file = SWEPT.map((e) => e.file).find((f) => f.startsWith(member));
  const tight = legsOf(file, key);
  const loose = legsOf(file, { ...key, localHelpers: HIS_RELAXED.localHelpers });
  return {
    member,
    narrowest: keyOf(key),
    bound: tight.bound,
    looseBound: loose.bound,
    swallowed: tight.bound.filter((id) => loose.helpers.includes(id)),
  };
});
g(
  'A2',
  `X2 HOLDS — his \`B4\` mechanism attribution reproduces from the detector's own legs rather ` +
    `than from a re-reading of the files: ` +
    `${cMech.map((c) => `${n3(c.member)} binds [${c.bound.join(',')}] → [${c.looseBound.join(',') || '∅'}], all of them re-classified as helpers`).join('; ')}. ` +
    `Attributed at ${new Set(cMech.map((c) => c.narrowest)).size} distinct narrowest keys for ` +
    `${cMech.length} members, which is his own Round 386 red holding here too: "lost somewhere in ` +
    `the space" and "lost at this key" are different sets`,
  cMech.length === 3 &&
    cMech.every((c) => c.bound.length > 0 && c.looseBound.length === 0 && c.swallowed.length === c.bound.length),
);

const PIN = 'e922394b';
const pinnedReadme = git(['show', `${PIN}:docs/research/round383-instruments/README.md`]);
const pinnedFigure = Number((pinnedReadme.match(/\b(\d+)\s+grades\b/) || [])[1]);
const readmeChurn = git(['show', '--numstat', '--format=', PIN, '--', 'docs/research/round383-instruments/README.md'])
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map(Number)
  .reduce((a, b) => a + b, 0);
const liveReadme = readFileSync(join(REPO, 'docs/research/round383-instruments/README.md'), 'utf8');
g(
  'A3',
  `and his §2 README finding, verified from git rather than taken: at ${PIN} that README ` +
    `headlined ${pinnedFigure} in a commit that changed ${readmeChurn} lines of it to write four ` +
    `new rows into its table. The cure is not a fresher figure — the live README carries NO grade ` +
    `tally at all (${!/\b\d+\s+grades\b/.test(liveReadme)}), which is the one property that ` +
    `cannot go stale; \`G15\`/\`G16\` in the subject grade the absence and its two controls`,
  pinnedFigure === 14 && readmeChurn === 45 && !/\b\d+\s+grades\b/.test(liveReadme),
);

// ── C — the cascade, in the order it happened ────────────────────────────────────────────────
const subjectOut = execFileSync(process.execPath, [SUBJECT], { encoding: 'utf8', maxBuffer: 1 << 26 });
const subjectTally = subjectOut.match(/\n(\d+) grades, (\d+) not true/);
const r385Src = readFileSync(MINE_385, 'utf8');
const hisSrc = readFileSync(HIS, 'utf8');
g(
  'C1',
  `MY OWN, and it reddened before anything of his did: Round 385's \`E5\` asserted the subject's ` +
    `tally VERBATIM, \`18 grades, 0 not true\`, and the subject now drives ${subjectTally[1]}. The ` +
    `old predicate is false against this run (${/\n18 grades, 0 not true/.test(subjectOut)}) and ` +
    `the re-aimed one reads the printed tally and requires only the not-true count to be zero, so ` +
    `it is green at ${subjectTally[1]} and would be green at any total ` +
    `(${/ E5: true /.test(execFileSync(process.execPath, [MINE_385], { encoding: 'utf8', maxBuffer: 1 << 26 }))}). ` +
    `A count pinned in one file reddens on a grade added in another (377) — his §2 found that ` +
    `shape in my README in the same fire my own instrument was carrying it in a predicate`,
  !/\n18 grades, 0 not true/.test(subjectOut) &&
    !/18 grades, 0 not true/.test(r385Src) &&
    Number(subjectTally[2]) === 0,
);
g(
  'C2',
  `and a count pin driven from another instrument does not report, it CRASHES: his ` +
    `\`driveInstrument\` is \`execFileSync\` with no \`catch\` (${/const driveInstrument = \(p\) => execFileSync/.test(hisSrc)} ` +
    `— and no \`try\` anywhere in his file: ${!/\btry\s*\{/.test(hisSrc.slice(hisSrc.indexOf('driveInstrument')))}), ` +
    `so while \`E5\` was red his whole run died at that line with ZERO grades printed and no ` +
    `verdict line. An instrument that drives another instrument inherits its exit code as an ` +
    `exception, which is the difference between "2 not true" and nothing at all`,
  /const driveInstrument = \(p\) => execFileSync/.test(hisSrc) &&
    !/\btry\s*\{/.test(hisSrc.slice(hisSrc.indexOf('const driveInstrument'))),
);

// ── P — THE FINDING: his pins against the cure they routed ───────────────────────────────────
let hisOut = '';
let hisExit = 0;
try {
  hisOut = execFileSync(process.execPath, [HIS], { encoding: 'utf8', maxBuffer: 1 << 26 });
} catch (e) {
  hisOut = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  hisExit = e.status;
}
const hisNotTrue = [...hisOut.matchAll(/^NOT TRUE (\w+):/gm)].map((m) => m[1]);
const hisTally = hisOut.match(/\n(\d+) grades, (\d+) not true/);
g(
  'P1',
  `THE FINDING, behavioural — his Round 386 instrument, driven against the tree that took its own ` +
    `three routed items, exits ${hisExit} with ${hisTally?.[2] ?? '?'} of ${hisTally?.[1] ?? '?'} ` +
    `grades not true: ${hisNotTrue.join(', ')}. Both are pins on the file whose cure he routed — ` +
    `\`R1\` on its BYTES and its tally, \`D1\` on the tallies of two instruments — and neither is ` +
    `a pin on the property either grade is about. X3 named these two and was right about them and ` +
    `wrong about the count: it missed C1 and P4 entirely, which both fire earlier and louder`,
  hisExit === 1 && JSON.stringify(hisNotTrue.sort()) === JSON.stringify(['D1', 'R1']),
);

/** `R1`'s four conjuncts, reconstructed and evaluated one at a time. */
const pinnedMjs = git(['show', `${PIN}:docs/research/round383-instruments/grade-the-binding-class.mjs`]);
const n383 = Number(subjectTally[1]);
const R1 = {
  'pinnedMjs === subjectSrc': pinnedMjs === subjectSrc,
  'pinnedFigure === 14': pinnedFigure === 14,
  'n383 === 18': n383 === 18,
  'pinnedFigure !== n383': pinnedFigure !== n383,
};
const broke = Object.keys(R1).filter((k) => !R1[k]);
const held = Object.keys(R1).filter((k) => R1[k]);
g(
  'P2',
  `X5 HOLDS, conjunct by conjunct — of \`R1\`'s four, the ${broke.length} that broke are ` +
    `${broke.map((k) => `\`${k}\``).join(' and ')} and the ${held.length} that hold are ` +
    `${held.map((k) => `\`${k}\``).join(' and ')}. The finding \`R1\` exists to report — that the ` +
    `pinned README's figure disagrees with what the instrument drives — is intact and stronger ` +
    `than when it was written (${pinnedFigure} against ${n383}). What reddened is a verbatim ` +
    `source pin and a hardcoded total, on a file he had just invited me to change (357, 375)`,
  broke.length === 2 &&
    JSON.stringify(broke) === JSON.stringify(['pinnedMjs === subjectSrc', 'n383 === 18']) &&
    R1['pinnedFigure !== n383'],
);

/** `K3`'s warrant conjunct, against three populations: the cure, the defect, and the counter. */
const k3Leg = (src) =>
  !/readMustBeCode/.test((src.match(/const everyRow = \[[\s\S]*?\n\];/) || [''])[0]);
const plantedDefect = `${subjectSrc}\nconst everyRow = [\n  {},\n  { fullLiteralName: false },\n];\n`;
const plantedCounter = `${subjectSrc}\nconst everyRow = [\n  {},\n  { readMustBeCode: false },\n];\n`;
g(
  'P3',
  `X4 HOLDS — \`K3\` is still green and it is now VACUOUS. Its warrant conjunct asks whether the ` +
    `\`everyRow\` literal mentions axis D; the literal is gone, so the match is the empty string ` +
    `and the test passes by emptiness. His own printed claim says it out loud: "a hand-typed array ` +
    `of 0 literals that omits axis D" ` +
    `(${/array of 0 literals/.test(hisOut)}). Three populations under his own leg: the CURED tree ` +
    `reads ${k3Leg(subjectSrc)}, a planted \`everyRow\` that really does omit axis D — the defect ` +
    `itself — reads ${k3Leg(plantedDefect)}, and one that mentions it reads ` +
    `${k3Leg(plantedCounter)}. The cure and the defect return the SAME value, so the green is ` +
    `unreadable (352: a selector on optional metadata fails silently)`,
  k3Leg(subjectSrc) === true &&
    k3Leg(plantedDefect) === true &&
    k3Leg(plantedCounter) === false &&
    /array of 0 literals/.test(hisOut),
);

/**
 * `P4` — the loudest of the three, and the one no expectation named: his cut anchor is a BARE
 * STRING asserted to occur exactly once in my file, so my file cannot discuss his section header.
 * It happened twice in this fire: once when the equivalence grade held the header in a `const`,
 * and again when the comment explaining THAT quoted it (371, one level up). Both times his
 * instrument died at module load with zero grades printed.
 */
const hisAnchor = (hisSrc.match(/const MARKER = '([^']+)'/) || [])[1];
const mention = `${subjectSrc}\n// a comment that merely mentions ${hisAnchor} as prose\n`;
const bareCount = (src) => src.split(hisAnchor).length - 1;
g(
  'P4',
  `and the anchor that cuts my file is a BARE STRING (\`${hisAnchor}\`), asserted to occur exactly ` +
    `once (347, which is right) — so a file that merely MENTIONS his section header throws before ` +
    `a single grade prints. Two populations: the live subject counts ${bareCount(subjectSrc)}, and ` +
    `the same bytes plus one comment that names the anchor count ${bareCount(mention)}, which is ` +
    `the state this fire shipped twice before noticing. The line-anchored pattern this file and ` +
    `the subject now both use reads ${headers(mention)} on that same copy — a header cannot be ` +
    `mentioned into existence. One token of repair, offered not taken: his file is his`,
  bareCount(subjectSrc) === 1 && bareCount(mention) === 2 && headers(mention) === 1,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
