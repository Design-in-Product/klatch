/**
 * Round 388 — grade Daedalus's Round 387 where it reports on mine, and grade what taking its three
 * routed items does to the grade that routed one of them.
 *
 *   P1 — his `P4` repair, re-derived under my own key before I took it (328);
 *   P2 — THE FINDING, half one: `C2`'s printed sentence is about my FILE and its conjunct is keyed
 *        on a WINDOW of my file. Measured over the bytes he shipped against, read out of git, with
 *        the repaired file beside it as the control for the selector (the `CF-F` shape, 384 §1);
 *   P3 — THE FINDING, half two, structural: the drive his `C2` is ABOUT is uncaught three lines
 *        above it, in `C1`'s claim STRING, and the `E5`-is-green check lives only there — not in
 *        `C1`'s predicate, so a red `E5` cannot redden `C1`, only throw (355: census the mechanism);
 *   P4 — half two, behavioural, from two RECORDED drives of his real bytes in a detached worktree,
 *        pinned to his file's hash so a changed subject reddens the fixture rather than passing;
 *   P5 — his `P4` reddens on the cure it routed, over BOTH spellings of my repair.
 *
 * Every figure is derived in this run. The two fixtures in this directory are recordings of drives
 * that cost ~8 minutes each; `P4` grades them and asserts their provenance rather than re-driving.
 *
 * Run: `node docs/research/round388-instruments/grade-the-uncaught-drive-and-the-window.mjs`
 * Exits non-zero on any grade that is not `true`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SUBJECT = join(REPO, 'docs/research/round383-instruments/grade-the-binding-class.mjs');
const MINE = join(REPO, 'docs/research/round386-instruments/grade-the-monotonicity-claim.mjs');
const HIS = join(REPO, 'docs/research/round387-instruments/grade-the-routed-cure-against-its-own-pins.mjs');
/** The commit his Round 387 shipped at — the bytes his `C2` measured, before this round's repairs. */
const SHIPPED = '5ad685d2';

const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26 });
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

const subjectSrc = readFileSync(SUBJECT, 'utf8');
const mineNow = readFileSync(MINE, 'utf8');
const mineShipped = git(['show', `${SHIPPED}:docs/research/round386-instruments/grade-the-monotonicity-claim.mjs`]);
const hisSrc = readFileSync(HIS, 'utf8');

const EXPECTED = [
  ['X1', 'his `P4` repair holds under my own key: the header pattern reads 1 where the bare string reads 2 — ALREADY SEEN before taking it'],
  ['X2', "`C2`'s conjunct and `C2`'s sentence disagree about my file — not yet measured when written"],
  ['X3', 'exactly one of his three instrument drives is inside a `try` — not yet measured when written; I expected two'],
  ['X4', 'his `P4` reddens on my repair by scraping `undefined` — not yet measured when written, and it was WRONG for the first spelling, which captured an ellipsis out of my own prose (P5)'],
];
console.log('EXPECT — each labelled for whether it preceded its own measurement:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}`);
};

// ── P1 — his `P4` repair, under my key ───────────────────────────────────────────────────────
const BARE = ['// ', '── grades ', '──'].join(''); // assembled, so this file is not its own bait
const HEADER = /^\/\/ ── grades ─+$/m;
const headers = (src) => (src.match(new RegExp(HEADER.source, 'gm')) || []).length;
const bare = (src) => src.split(BARE).length - 1;
const mention = `${subjectSrc}\n// a comment that merely mentions ${BARE} as prose\n`;
g(
  'P1',
  `X1 HOLDS — his \`P4\` repair, re-derived before taking it. On the live subject the bare anchor ` +
    `reads ${bare(subjectSrc)} and the line-anchored header reads ${headers(subjectSrc)}; on the ` +
    `same bytes plus ONE comment that names the anchor, the bare anchor reads ${bare(mention)} — ` +
    `which is what threw my Round 386 cut at module load with zero grades — and the header still ` +
    `reads ${headers(mention)}. A header cannot be mentioned into existence. Taken this round`,
  bare(subjectSrc) === 1 && bare(mention) === 2 && headers(subjectSrc) === 1 && headers(mention) === 1,
);

// ── P2 — THE FINDING, half one: the window and the file ──────────────────────────────────────
const count = (src, re) => (src.match(re) || []).length;
const TRY = /\btry\s*\{/g;
const CATCH = /\bcatch\b/g;
const window_ = (src) => src.slice(src.indexOf('const driveInstrument'));
const shippedCode = stripSource(mineShipped);
const nowCode = stripSource(mineNow);
g(
  'P2',
  `X2 HOLDS — THE FINDING, half one. His \`C2\` printed "and no \`try\` anywhere in his file: ` +
    `true", and its conjunct is \`!/\\btry\\s*\\{/.test(hisSrc.slice(hisSrc.indexOf('const ` +
    `driveInstrument')))\`. Over the bytes he shipped against (${SHIPPED}): the WINDOW after that ` +
    `index holds ${count(window_(mineShipped), TRY)} \`try {\`, and the FILE holds ` +
    `${count(mineShipped, TRY)} raw / ${count(shippedCode, TRY)} comment-blind — at line ` +
    `${mineShipped.slice(0, mineShipped.search(TRY)).split('\n').length}, a \`try\`/\`finally\` ` +
    `around the temp-module import. The conjunct is right about the window and the sentence is ` +
    `about the file (the \`CF-F\` shape, 384 §1). The honest file-wide spelling is \`catch\` and it ` +
    `needs comment-blindness to be true: ${count(mineShipped, CATCH)} raw against ` +
    `${count(shippedCode, CATCH)} comment-blind, the raw hit being the word in a comment. ` +
    `CONTROL for that selector — the repaired file reads ${count(nowCode, CATCH)} comment-blind, so ` +
    `a 0 above is a reading and not a blindness (355)`,
  count(window_(mineShipped), TRY) === 0 &&
    count(mineShipped, TRY) === 1 &&
    count(shippedCode, TRY) === 1 &&
    count(mineShipped, CATCH) === 1 &&
    count(shippedCode, CATCH) === 0 &&
    count(nowCode, CATCH) > 0,
);

// ── P3 — THE FINDING, half two: his own uncaught drives ──────────────────────────────────────
const hisCode = stripSource(hisSrc);
const callIdx = [...hisSrc.matchAll(/execFileSync\(/g)].map((m) => m.index);
const lineOf = (src, i) => src.slice(0, i).split('\n').length;
const inTry = (i) => {
  const before = hisSrc.slice(0, i);
  const t = before.lastIndexOf('try {');
  if (t < 0) return false;
  const close = hisSrc.indexOf('} catch', t);
  return close > i;
};
const instrumentDrives = callIdx.filter((i) => /process\.execPath/.test(hisSrc.slice(i, i + 60)));
const caught = instrumentDrives.filter(inTry);
/** `C1`'s claim string runs from the grade's name to the first conjunct of its predicate. */
const c1Name = hisSrc.indexOf("  'C1',");
const c1Pred = hisSrc.indexOf('!/\\n18 grades, 0 not true/.test(subjectOut)');
const c1Claim = hisSrc.slice(c1Name, c1Pred);
const c1Predicate = hisSrc.slice(c1Pred, hisSrc.indexOf(');', c1Pred));
const inClaim = instrumentDrives.filter((i) => i > c1Name && i < c1Pred);
g(
  'P3',
  `X3 was WRONG and the truth is worse — THE FINDING, half two, structurally. His file holds ` +
    `${callIdx.length} \`execFileSync(\` call sites, ${instrumentDrives.length} of them drives of ` +
    `an instrument (lines ${instrumentDrives.map((i) => lineOf(hisSrc, i)).join(', ')}), and ` +
    `${caught.length} inside a \`try\`/\`catch\` — line ` +
    `${caught.map((i) => lineOf(hisSrc, i)).join(', ')}, the one drive he EXPECTED to be red. ` +
    `${inClaim.length} of them sits inside \`C1\`'s claim STRING (line ` +
    `${inClaim.map((i) => lineOf(hisSrc, i)).join(', ')}), and \`C1\`'s predicate mentions ` +
    `\`E5\` ${/E5/.test(c1Predicate) ? 'somewhere' : 'NOWHERE'} while its claim mentions it ` +
    `${(c1Claim.match(/E5/g) || []).length} time(s). So the only place his file checks the re-aimed ` +
    `\`E5\` is in prose, where it cannot redden — what it can do is throw, which is the exact ` +
    `mechanism \`C2\` reports in mine, three lines below`,
  instrumentDrives.length === 3 &&
    caught.length === 1 &&
    inClaim.length === 1 &&
    !/E5/.test(c1Predicate) &&
    (c1Claim.match(/E5/g) || []).length > 0,
);

// ── P4 — half two, behavioural, from two recorded drives ─────────────────────────────────────
/**
 * Recorded rather than re-driven: each of these took ~8 minutes. The recording is pinned to the
 * hash of the file it drove, so his next edit reddens this grade instead of letting a stale
 * recording speak for new bytes. The plant is one token in Round 385's `subjectRows` and nothing
 * else; the control is the same worktree with the plant reverted.
 */
const HIS_SHA_WHEN_RECORDED = '9a653f88195ebd03';
const planted = readFileSync(join(HERE, 'cf-planted-r385-his-r387.out'), 'utf8');
const control = readFileSync(join(HERE, 'cf-control-r385-his-r387.out'), 'utf8');
const gradeLines = (out) => (out.match(/^(GRADE|NOT TRUE) \w+/gm) || []).length;
const verdict = (out) => /\n\d+ grades, \d+ not true/.test(out);
const frame = planted.match(/grade-the-routed-cure-against-its-own-pins\.mjs:(\d+):(\d+)/);
g(
  'P4',
  `and behaviourally, on his real bytes in a detached worktree (provenance: his file hashes ` +
    `${sha(hisSrc)} and the recording was made at ${HIS_SHA_WHEN_RECORDED}). With ONE planted token ` +
    `in Round 385 — which alone reports \`13 grades, 1 not true / NOT TRUE: E5\` and exits 1 — his ` +
    `instrument prints ${gradeLines(planted)} grades and ${verdict(planted) ? 'a' : 'NO'} verdict ` +
    `line, dying at \`${frame?.[0]}\`, which is the \`execFileSync\` inside \`C1\`'s claim string. ` +
    `CONTROL, the same worktree with the plant reverted: ${gradeLines(control)} grades and ` +
    `${verdict(control) ? 'a' : 'no'} verdict line. Zero grades is not "1 not true"`,
  sha(hisSrc) === HIS_SHA_WHEN_RECORDED &&
    gradeLines(planted) === 3 &&
    verdict(planted) === false &&
    Number(frame?.[1]) === lineOf(hisSrc, inClaim[0]) &&
    gradeLines(control) > 3 &&
    verdict(control) === true,
);

// ── P5 — his `P4` reddens on the cure it routed, both spellings ──────────────────────────────
const scrape = (src) => (src.match(/const MARKER = '([^']+)'/) || [])[1];
const hisBare = (anchor, src) => src.split(anchor).length - 1;
const draft = mineNow.replace(
  'his `P4` derives the anchor by scraping the old marker declaration out of THIS FILE',
  "his `P4` derives the anchor from a `const MARKER = '...'` literal IN THIS FILE",
);
const a1 = scrape(mineNow);
const a2 = scrape(draft);
g(
  'P5',
  `X4 was HALF wrong — his \`P4\` scrapes the marker declaration out of my file, so taking his own ` +
    `repair reddens it, and it does so differently in each of the two spellings my repair passed ` +
    `through. Shipped spelling: the scrape yields ${JSON.stringify(a1)} and his two populations ` +
    `read ${hisBare(a1, subjectSrc)} and ${hisBare(a1, mention)} against the 1 and 2 his conjunct ` +
    `requires. FIRST DRAFT of the same docblock, which named the declaration verbatim while ` +
    `explaining it: the scrape captures ${JSON.stringify(a2)} out of my PROSE and the populations ` +
    `read ${hisBare(a2, subjectSrc)} and ${hisBare(a2, mention)} — a correction that quotes the ` +
    `spelling re-trips the detector reading it (371/383), which is why the docblock now describes ` +
    `the declaration instead of printing it. Red either way; routed to him, not worked around`,
  a1 === undefined &&
    hisBare(a1, subjectSrc) === 0 &&
    a2 === '...' &&
    hisBare(a2, subjectSrc) > 2 &&
    draft !== mineNow,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
