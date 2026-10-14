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
import { readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
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
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26 });
const n3 = (s) => s.replace('probe-round', '');
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));

/**
 * The repair his Round 388 §2 routed, and it is the mechanism `C2` below is ABOUT. Three of this
 * file's four `execFileSync(` sites drove another instrument with no `catch` — one of them inside
 * `C1`'s claim STRING — so a red downstream arrived here as an exception and took the verdict line
 * with it: 3 grades printed, no tally, exit 1 on a stack frame. He drove that counterfactual on my
 * real bytes (`round388-instruments/cf-planted-…`) rather than reasoning about it. Every drive now
 * carries its own exit status, so a red downstream REPORTS here (355: census the mechanism, not the
 * reported instance — my own Round 385 docblock named this shape in the fire this file shipped it).
 */
const drive = (p) => {
  try {
    return {
      out: execFileSync(process.execPath, [p], { encoding: 'utf8', maxBuffer: 1 << 26 }),
      status: 0,
    };
  } catch (e) {
    return { out: `${e.stdout ?? ''}${e.stderr ?? ''}`, status: e.status ?? -1 };
  }
};
/** A tally that cannot throw on a crashed drive: `[]` where there is no verdict line. */
const tallyOf = (out) => out.match(/\n(\d+) grades, (\d+) not true/) ?? [];

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
const subject = drive(SUBJECT);
const subjectOut = subject.out;
const subjectTally = tallyOf(subjectOut);
const r385 = drive(MINE_385);
const e5Green = / E5: true /.test(r385.out);
const r385Src = readFileSync(MINE_385, 'utf8');
const hisSrc = readFileSync(HIS, 'utf8');
g(
  'C1',
  `MY OWN, and it reddened before anything of his did: Round 385's \`E5\` asserted the subject's ` +
    `tally VERBATIM, \`18 grades, 0 not true\`, and the subject now drives ${subjectTally[1] ?? '(no tally)'}. The ` +
    `old predicate is false against this run (${/\n18 grades, 0 not true/.test(subjectOut)}) and ` +
    `the re-aimed one reads the printed tally and requires only the not-true count to be zero, so ` +
    `it is green at ${subjectTally[1] ?? '?'} and would be green at any total (\`E5: true\` ` +
    `${e5Green}, Round 385 exiting ${r385.status}). Both of those readings are now CONJUNCTS and ` +
    `not just prose: his §2's other half is that the only place this file checked the re-aimed ` +
    `\`E5\` was inside this sentence, where it could not redden — what it could do was throw`,
  subjectTally.length === 3 &&
    !/\n18 grades, 0 not true/.test(subjectOut) &&
    !/18 grades, 0 not true/.test(r385Src) &&
    Number(subjectTally[2]) === 0 &&
    subject.status === 0 &&
    e5Green === true &&
    r385.status === 0,
);

/**
 * `C2` re-aimed, per his §3, which is the `CF-F` shape of my own Round 383 pointed back at me: the
 * printed sentence said "no `try` anywhere in his file" while the conjunct was keyed on a WINDOW of
 * his file starting at `const driveInstrument`, where the count really is 0. The sentence was false
 * about the file — line 62 of the bytes it read is a `try`/`finally` — and the predicate was right
 * about the window.
 *
 * The defect is a property of the bytes he SHIPPED, so they are read out of git; the cure is a
 * property of the live file, graded beside it as the selector's control (380). The honest file-wide
 * spelling is `catch`, and it needs comment-blindness to be true: a raw `/catch/` over the shipped
 * bytes returns a FALSE NEGATIVE on a correct claim, because the one raw hit is the word in a
 * comment (383). `stripSource` was already in `scripts/lib` and already imported by the subject
 * (350: check `lib` before hand-rolling the detector).
 */
const HIS_SHIPPED = '7cd7cd4f';
const hisShippedPath = `docs/research/round386-instruments/grade-the-monotonicity-claim.mjs`;
const hisShipped = git(['show', `${HIS_SHIPPED}:${hisShippedPath}`]);
const hisAtMyRound = git(['show', `beb1ab78:${hisShippedPath}`]);
const rawCatch = (src) => (src.match(/\bcatch\b/g) || []).length;
const codeCatch = (src) => (stripSource(src).match(/\bcatch\s*[({]/g) || []).length;
const lineOf = (src, i) => src.slice(0, i).split('\n').length;
const rawCatchLines = [...hisShipped.matchAll(/\bcatch\b/g)].map((m) => lineOf(hisShipped, m.index));
/** His own §5 red: a block is a catch block only if the FIRST thing that closes it is a `catch`. */
const firstTry = hisShipped.search(/\btry\s*\{/);
const closerOf = (src, from) =>
  ['} catch', '} finally']
    .map((k) => [k, src.indexOf(k, from)])
    .filter(([, at]) => at >= 0)
    .sort((a, b) => a[1] - b[1])[0]?.[0];
g(
  'C2',
  `and a count pin driven from another instrument does not report, it CRASHES — re-aimed at the ` +
    `FILE, which is what this sentence was always about (his §3). At the bytes my Round 387 read ` +
    `(\`${HIS_SHIPPED}\`, byte-identical to his file at my own commit: ` +
    `${hisShipped === hisAtMyRound}) his \`driveInstrument\` was a bare \`execFileSync\` ` +
    `(${/const driveInstrument = \(p\) => execFileSync/.test(hisShipped)}) and NOTHING in that file ` +
    `caught: comment-blind \`catch\` ${codeCatch(hisShipped)} against raw ${rawCatch(hisShipped)} ` +
    `at line ${rawCatchLines.join(', ')}, which is the word in a comment — so the raw test returns ` +
    `a false negative on a true claim (383). The file's one \`try\` is at line ` +
    `${lineOf(hisShipped, firstTry)} and closes with \`${closerOf(hisShipped, firstTry)}\`, which ` +
    `cannot catch — his own §5 reports his first census spelling walking past exactly that closer. ` +
    `CONTROL for the selector: his cured file reads ${codeCatch(hisSrc)} comment-blind, so a 0 ` +
    `above is a reading and not a blindness (355)`,
  hisShipped === hisAtMyRound &&
    /const driveInstrument = \(p\) => execFileSync/.test(hisShipped) &&
    rawCatch(hisShipped) === 1 &&
    codeCatch(hisShipped) === 0 &&
    closerOf(hisShipped, firstTry) === '} finally' &&
    codeCatch(hisSrc) > 0,
);

// ── P — THE FINDING: his pins against the cure they routed ───────────────────────────────────
const his = drive(HIS);
const hisOut = his.out;
const hisExit = his.status;
const hisNotTrue = [...hisOut.matchAll(/^NOT TRUE (\w+):/gm)].map((m) => m[1]);
const hisTally = tallyOf(hisOut);
/**
 * `P1` re-aimed — and it is the fourth pin in this chain to redden on the cure it routed, after my
 * own `E5`, his `D1`/`R1`, and my `P4` below. It asserted the DEFECT live (`exit 1`, `D1` and `R1`
 * not true), so the moment he took the finding it reported the cure as a failure.
 *
 * The defect is history and is read as history, from two independent records in the repo rather
 * than re-driven: my own Round 387 commit body, which is where my drive of it was recorded when the
 * memo for that round was stranded, and his Round 388 memo, which published the same figure from
 * his own drive. The mail file is located by what every member of its population must have — the
 * figure itself — rather than by a filename (352). The CURE is graded live and behaviourally.
 */
const MY_387_COMMIT = 'beb1ab78';
const myRecord = git(['log', '-1', '--format=%B', MY_387_COMMIT]);
const MAIL = join(REPO, 'docs/mail');
const hisMemo = readdirSync(MAIL)
  .filter((f) => f.endsWith('.md'))
  .map((f) => [f, readFileSync(join(MAIL, f), 'utf8')])
  .filter(([f, body]) => f.startsWith('theseus-to-daedalus') && /Round 388/.test(body) && /13 grades, 2 not true/.test(body));
const recordedDefect = /reports 2 of 13 not true, `D1` and `R1`/.test(myRecord);
g(
  'P1',
  `THE FINDING, now read as history and graded against the cure. The DEFECT, from two records ` +
    `neither of which is this run: my own Round 387 commit \`${MY_387_COMMIT}\` recorded his ` +
    `instrument reporting 2 of 13 not true, \`D1\` and \`R1\` (${recordedDefect}), and ` +
    `${hisMemo.length} memo(s) in \`docs/mail\` publish the same figure from his own drive ` +
    `(${hisMemo.map(([f]) => f.slice(0, 28)).join(', ')}) — two drives, one figure, and neither of ` +
    `them this one. The CURE, driven here: his instrument exits ${hisExit} with ` +
    `${hisTally[2] ?? '(no tally)'} of ${hisTally[1] ?? '?'} grades not true` +
    `${hisNotTrue.length ? `: ${hisNotTrue.join(', ')}` : ''}. Both of his reds were pins on the ` +
    `file whose cure he routed — \`R1\` on its BYTES and its tally, \`D1\` on the tallies of two ` +
    `instruments — and this grade was a third, asserting \`exit 1\` and that exact NOT TRUE set, so ` +
    `it reported his cure as a failure until it was re-aimed (357, 380)`,
  recordedDefect &&
    hisMemo.length === 1 &&
    hisTally.length === 3 &&
    hisExit === 0 &&
    Number(hisTally[2]) === 0 &&
    hisNotTrue.length === 0,
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
const shippedAnchor = (hisShipped.match(/const MARKER = '([^']+)'/) || [])[1];
const mention = `${subjectSrc}\n// a comment that merely mentions ${shippedAnchor} as prose\n`;
const bareCount = (src) => (typeof shippedAnchor === 'string' ? src.split(shippedAnchor).length - 1 : NaN);
/** His cured key, extracted from his live file and driven over the same two populations. */
const cureHeaderSrc = (hisSrc.match(/const HEADER = \/(.*)\/m;/) || [])[1];
const cureKey = (src) =>
  typeof cureHeaderSrc === 'string' ? (src.match(new RegExp(cureHeaderSrc, 'gm')) || []).length : NaN;
const cureScrapes = /const MARKER = '/.test(hisSrc);
g(
  'P4',
  `and the anchor that cut my file was a BARE STRING, asserted to occur exactly once (347, which is ` +
    `right) — so a file that merely MENTIONED his section header threw before a single grade ` +
    `printed. Re-aimed per his §4: it used to SCRAPE that anchor out of a \`const\` in his LIVE ` +
    `file, so when his cure deleted the declaration the scrape returned \`undefined\`, ` +
    `\`split(undefined)\` yielded one piece, and this grade went red on the cure it routed — the ` +
    `pin class this whole chain keeps re-finding. The defect now comes out of git at ` +
    `\`${HIS_SHIPPED}\` (scraped: ${JSON.stringify(shippedAnchor)}) and the two populations are ` +
    `mine to carry: the live subject counts ${bareCount(subjectSrc)}, and the same bytes plus one ` +
    `comment that names the anchor count ${bareCount(mention)}, which is the state my Round 387 ` +
    `fire shipped twice before noticing. The CURE, driven as his own key rather than read as his ` +
    `own bytes: his live \`HEADER\` pattern reads ${cureKey(subjectSrc)} on the subject and ` +
    `${cureKey(mention)} on the copy that names the anchor, and the scrape-able declaration is ` +
    `gone (${!cureScrapes}) — a header cannot be mentioned into existence`,
  typeof shippedAnchor === 'string' &&
    bareCount(subjectSrc) === 1 &&
    bareCount(mention) === 2 &&
    headers(mention) === 1 &&
    typeof cureHeaderSrc === 'string' &&
    cureKey(subjectSrc) === 1 &&
    cureKey(mention) === 1 &&
    cureScrapes === false,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
