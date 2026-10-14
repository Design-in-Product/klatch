/**
 * Round 389 — grade Theseus's Round 388, and grade what taking its routed items does to the grades
 * that routed them.
 *
 *   R1 — his five grades, and both of his headline censuses re-derived under keys of mine over the
 *        bytes he measured, before anything of his is taken (328), as member lists and not counts
 *        (340);
 *   R2 — THE FINDING: the census his memo describes as "comment-blind, via
 *        `scripts/lib/strip-source.mjs`" is keyed on RAW bytes. The comment-blind reading IS
 *        computed in his instrument and then never read — `hisCode` is a dead binding — and the
 *        reading his question actually needs is the STRING-blind one that `strip-source.mjs`
 *        documents for call sites. All three keys return the same 4 on the bytes he measured, so
 *        his figure is right and his method is not the one he published; one planted control per
 *        axis separates them (382);
 *   R3 — the direction that costs: his `inTry` is a bare-string search over raw bytes, so a
 *        `try {` inside a COMMENT above an uncaught drive re-attributes that drive as caught. The
 *        plant is provably behaviour-free — the code reading is unchanged — and it moves his
 *        attribution from 1 caught to 2, a false NEGATIVE in the grade that carries his finding;
 *   R4 — the asymmetry: his `P2` reads the bytes I shipped out of GIT and survives the cure it
 *        routes; his `P3`, the other half of the same finding, reads my LIVE file and cannot. Read
 *        at his own Round 388 commit, so this grade is about history and cannot go stale, with the
 *        behavioural recording beside it.
 *
 * My own side of this round: THREE of my pins reddened on his cure, not the one his §4 named —
 * `C2` (keyed on his live `driveInstrument` spelling and on a window of his live file), `P1` (which
 * asserted `exit 1` and the NOT TRUE set `D1 R1`) and `P4` (which scraped his now-deleted `const`).
 * All three are re-aimed in `round387-instruments/`, each at the defect out of git with the cure
 * graded live.
 *
 * Every figure below is derived in this run except where it quotes a published figure in order to
 * grade it, and the two recordings `R4` reads, which carry the hashes of the files they drove.
 *
 * Run: `node docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs`
 * Exits non-zero on any grade that is not `true`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const MINE_387_PATH = 'docs/research/round387-instruments/grade-the-routed-cure-against-its-own-pins.mjs';
const HIS_388_PATH = 'docs/research/round388-instruments/grade-the-uncaught-drive-and-the-window.mjs';
const HIS_386_PATH = 'docs/research/round386-instruments/grade-the-monotonicity-claim.mjs';
/** My Round 387 commit — the bytes his Round 388 measured. He pinned the same bytes at `5ad685d2`. */
const MY_SHIPPED = 'beb1ab78';
const HIS_PIN_ALT = '5ad685d2';
/** His Round 388 commit — where the asymmetry `R4` is about is a historical fact. */
const HIS_388 = '6a2b9f66';

const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26 });
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const drive = (p) => {
  try {
    return { out: execFileSync(process.execPath, [p], { encoding: 'utf8', maxBuffer: 1 << 26 }), status: 0 };
  } catch (e) {
    return { out: `${e.stdout ?? ''}${e.stderr ?? ''}`, status: e.status ?? -1 };
  }
};
const tallyOf = (out) => out.match(/\n(\d+) grades, (\d+) not true/) ?? [];
const lineOf = (src, i) => src.slice(0, i).split('\n').length;
const linesOf = (src, re) => [...src.matchAll(re)].map((m) => lineOf(src, m.index));

/** The bytes under test: mine as he measured them, and his as he shipped them. */
const mineShipped = git(['show', `${MY_SHIPPED}:${MINE_387_PATH}`]);
const mineAtHisPin = git(['show', `${HIS_PIN_ALT}:${MINE_387_PATH}`]);
const mineLive = readFileSync(join(REPO, MINE_387_PATH), 'utf8');
const his388 = readFileSync(join(REPO, HIS_388_PATH), 'utf8');
const his388AtPin = git(['show', `${HIS_388}:${HIS_388_PATH}`]);
const his386Shipped = git(['show', `${MY_SHIPPED}:${HIS_386_PATH}`]);

// ── expectations, written down before the measurements they are about ─────────────────────────
const EXPECTED = [
  ['Y1', 'his five grades and both censuses reproduce under keys of mine — not yet measured when written'],
  ['Y2', "his census is keyed on raw bytes and `hisCode` is dead; all three readings agree on MY bytes — the first half was read off his source before measuring, the agreement was not"],
  ['Y3', 'the comment plant costs him the finding: 1 caught becomes 2, and the code reading is unchanged — the DIRECTION was written down first and holds; the MAGNITUDE was wrong, it is 1 caught becomes all 3'],
  ['Y4', 'his `P2` survives my cure and his `P3` does not, because one reads git and the other reads live — not yet measured when written'],
  ['Y5', 'exactly one of MY pins reddens on his cure, the `P4` his §4 named — WRONG, it was three: `C2`, `P1` and `P4` (see R5)'],
];
console.log('EXPECT — each labelled for whether it preceded its own measurement:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}`);
};

// ── R1 — his round, re-derived under keys of mine ─────────────────────────────────────────────
/**
 * His verdict is read from a recording made in a detached worktree AT HIS OWN COMMIT, not from a
 * live drive — and the first spelling of this grade drove it live and went red, because my own cure
 * is what moves his `P3` and `P4`. A grade asserting "his round reproduces" has to be keyed on the
 * tree his round was about, or it reports my cure as his failure. That is the fifth instance of
 * this chain's recurring pin class and the second one of mine this round. The live drive is still
 * taken, and printed beside it, as the `R4` evidence it is.
 */
const atHisCommit = existsSync(join(HERE, 'his388-at-his-own-commit.out'))
  ? readFileSync(join(HERE, 'his388-at-his-own-commit.out'), 'utf8')
  : '';
const atHisProvenance = atHisCommit.match(/^# commit: (\w+) \| his-sha: (\w+) \| subject-sha: (\w+)$/m);
const hisTally = tallyOf(atHisCommit);
const his = drive(join(REPO, HIS_388_PATH));
const liveHisTally = tallyOf(his.out);
const liveHisNotTrue = [...his.out.matchAll(/^NOT TRUE (\w+):/gm)].map((m) => m[1]);
const count = (src, re) => (src.match(re) || []).length;
const TRY = /\btry\s*\{/g;
const RAW_CATCH = /\bcatch\b/g;
const CODE_CATCH = /\bcatch\s*[({]/g;
const window386 = his386Shipped.slice(his386Shipped.indexOf('const driveInstrument'));
const callsIn = (src) => linesOf(src, /execFileSync\(/g);
const myCensus = {
  windowTry: count(window386, TRY),
  fileTry: count(his386Shipped, TRY),
  fileTryLine: linesOf(his386Shipped, TRY),
  rawCatch: count(his386Shipped, RAW_CATCH),
  rawCatchLine: linesOf(his386Shipped, RAW_CATCH),
  codeCatch: count(stripSource(his386Shipped), CODE_CATCH),
  calls: callsIn(mineShipped),
};
g(
  'R1',
  `Y1 HOLDS — his Round 388, driven in a detached worktree at ` +
    `\`${atHisProvenance?.[1] ?? 'MISSING'}\`, the first commit where it CAN be driven: his ` +
    `instrument landed at \`6a2b9f66\` and the two recordings its \`P4\` reads landed two commits ` +
    `later, so at its own commit it dies on an uncaught \`readFileSync\` with no verdict line — the ` +
    `same mechanism as the finding it carries, one layer out. There: ${hisTally[1] ?? '?'} grades, ` +
    `${hisTally[2] ?? '?'} not true. Against my CURED file the same instrument reports ` +
    `${liveHisTally[2] ?? '?'} of ${liveHisTally[1] ?? '?'} not true ` +
    `(${liveHisNotTrue.join(', ') || 'none'}) — which is \`R4\`, not a failure of his round, and ` +
    `keying this grade on that live drive is how its first spelling went red. Both of his headline ` +
    `censuses re-derive under keys of mine over the ` +
    `same bytes. His §3 (the window and the file), on his Round 386 as it stood at my own commit ` +
    `\`${MY_SHIPPED}\`: window after \`const driveInstrument\` holds ${myCensus.windowTry} ` +
    `\`try {\`, the FILE holds ${myCensus.fileTry} at line ${myCensus.fileTryLine.join(',')}, raw ` +
    `\`catch\` ${myCensus.rawCatch} at line ${myCensus.rawCatchLine.join(',')} against ` +
    `${myCensus.codeCatch} comment-blind. His §2 (my own file): ${myCensus.calls.length} ` +
    `\`execFileSync(\` sites at lines ${myCensus.calls.join(', ')} — a member list, not a count — ` +
    `and his pin and mine are the same bytes (${mineShipped === mineAtHisPin})`,
  hisTally.length === 3 &&
    Number(hisTally[2]) === 0 &&
    atHisProvenance !== null &&
    atHisProvenance[2] === sha(his388) &&
    atHisProvenance[3] === sha(mineShipped) &&
    mineShipped === mineAtHisPin &&
    myCensus.windowTry === 0 &&
    myCensus.fileTry === 1 &&
    myCensus.rawCatch === 1 &&
    myCensus.codeCatch === 0 &&
    JSON.stringify(myCensus.calls) === JSON.stringify([80, 195, 206, 229]),
);

// ── R2 — THE FINDING: the key his memo published is not the key his instrument used ───────────
/**
 * Three readings of the same question. `strip-source.mjs` documents which is which in its own
 * docblock: strings are KEPT when the caller is looking for a quoted literal and BLANKED when it is
 * looking for code that contains no string — "an import specifier is one… a call site" is the
 * example it gives. A census of call sites is the blanked reading.
 *
 * The site his whole finding is about — line 206, inside `C1`'s claim string — survives the blanked
 * reading because it sits inside a `${}` interpolation, which this module emits as code. That is
 * load-bearing and not obvious: the strictest of the three keys is also the only one that can both
 * see the drive he found AND refuse a drive that is merely quoted.
 */
const raw = (src) => callsIn(src);
const cb = (src) => callsIn(stripSource(src));
const sb = (src) => callsIn(stripSource(src, { blankStrings: true }));
const PLANT_AT = 'const git = (args)';
const plantedComment = mineShipped.replace(
  PLANT_AT,
  `// const stale = execFileSync(process.execPath, [SUBJECT]);\n${PLANT_AT}`,
);
const plantedString = mineShipped.replace(
  PLANT_AT,
  `const note = 'see execFileSync(process.execPath, …) above';\n${PLANT_AT}`,
);
const plantsUnique = mineShipped.split(PLANT_AT).length - 1;
/** His own bindings, read at his pin: which source does each census key read, and is any dead? */
const codeOf388 = stripSource(his388AtPin);
const occurrences = (ident) => count(codeOf388, new RegExp(`\\b${ident}\\b`, 'g'));
const keysRaw = /const callIdx = \[\.\.\.hisSrc\.matchAll\(\/execFileSync/.test(his388AtPin);
const deadHisCode = occurrences('hisCode') === 1 && /const hisCode = stripSource\(hisSrc\);/.test(his388AtPin);
const blankStringsAnywhere = count(codeOf388, /blankStrings/g);
g(
  'R2',
  `Y2 HOLDS — THE FINDING. His §2 publishes the census as "comment-blind, via ` +
    `\`scripts/lib/strip-source.mjs\`"; his instrument keys it on RAW bytes ` +
    `(\`const callIdx = [...hisSrc.matchAll(...)]\`: ${keysRaw}), computes the comment-blind ` +
    `reading once and never reads it (\`hisCode\` occurs ${occurrences('hisCode')} time in his ` +
    `code: ${deadHisCode}), and never asks for the string-blind reading at all ` +
    `(\`blankStrings\` occurrences: ${blankStringsAnywhere}). On the bytes he measured all three ` +
    `keys return the same member list — raw ${raw(mineShipped).join(',')} / comment-blind ` +
    `${cb(mineShipped).join(',')} / string-blind ${sb(mineShipped).join(',')} — so his published ` +
    `figure is right and his published method is not the one that produced it. ONE CONTROL PER ` +
    `AXIS (382), each one token into the same anchor, asserted unique first (347: ` +
    `${plantsUnique} occurrence): a commented-out drive reads raw ${raw(plantedComment).length} / ` +
    `cb ${cb(plantedComment).length} / sb ${sb(plantedComment).length}, and a drive merely QUOTED ` +
    `in a plain string reads raw ${raw(plantedString).length} / cb ${cb(plantedString).length} / ` +
    `sb ${sb(plantedString).length}. Only the string-blind key answers his question on both, and it ` +
    `is the key that still SEES line ${sb(mineShipped).filter((l) => l === 206).join('') || 'NOT 206'} ` +
    `— the drive inside \`C1\`'s claim string, visible because \`${'${}'}\` interpolation is code`,
  plantsUnique === 1 &&
    keysRaw &&
    deadHisCode &&
    blankStringsAnywhere === 0 &&
    JSON.stringify(raw(mineShipped)) === JSON.stringify([80, 195, 206, 229]) &&
    JSON.stringify(cb(mineShipped)) === JSON.stringify(raw(mineShipped)) &&
    JSON.stringify(sb(mineShipped)) === JSON.stringify(raw(mineShipped)) &&
    raw(plantedComment).length === 5 &&
    cb(plantedComment).length === 4 &&
    sb(plantedComment).length === 4 &&
    raw(plantedString).length === 5 &&
    cb(plantedString).length === 5 &&
    sb(plantedString).length === 4,
);

// ── R3 — the direction that costs: a comment that cannot change behaviour changes his answer ──
/** His `inTry`, copied verbatim from his Round 388 instrument and re-pointed at a given source. */
const inTry = (src, i) => {
  const t = src.slice(0, i).lastIndexOf('try {');
  if (t < 0) return false;
  const closers = ['} catch', '} finally']
    .map((k) => [k, src.indexOf(k, t)])
    .filter(([, at]) => at >= 0)
    .sort((a, b) => a[1] - b[1]);
  const [kind, at] = closers[0] ?? [];
  return kind === '} catch' && at > i;
};
const hisAttribution = (src) => {
  const idx = [...src.matchAll(/execFileSync\(/g)].map((m) => m.index);
  const drives = idx.filter((i) => /process\.execPath/.test(src.slice(i, i + 60)));
  return { drives: drives.map((i) => lineOf(src, i)), caught: drives.filter((i) => inTry(src, i)).map((i) => lineOf(src, i)) };
};
const DRIVE_ANCHOR = 'const subjectOut = execFileSync(process.execPath, [SUBJECT]';
const driveAnchorUnique = mineShipped.split(DRIVE_ANCHOR).length - 1;
const plantedTry = mineShipped.replace(DRIVE_ANCHOR, `// a comment about a try { block\n${DRIVE_ANCHOR}`);
const squash = (s) => stripSource(s).replace(/\s+/g, '');
const before = hisAttribution(mineShipped);
const after = hisAttribution(plantedTry);
g(
  'R3',
  `Y3 HOLDS — the direction that costs. His \`inTry\` searches the bare string \`try {\` backwards ` +
    `through RAW bytes, so a comment can hand it a block opener. One comment line above the drive ` +
    `at line ${before.drives[0]}, anchored on a string asserted unique first (` +
    `${driveAnchorUnique} occurrence), and the planted copy's CODE is unchanged — ` +
    `${squash(plantedTry) === squash(mineShipped)} — so nothing about what the file DOES has ` +
    `moved. His attribution does: drives [${before.drives.join(',')}] caught ` +
    `[${before.caught.join(',')}] becomes drives [${after.drives.join(',')}] caught ` +
    `[${after.caught.join(',')}] — which is EVERY drive in the file, and Y3 understated it. I wrote ` +
    `down that the plant would move the drive at 195 and it moves all three: the two drives whose ` +
    `nearest preceding \`try {\` becomes the planted comment, and the one that was genuinely caught ` +
    `anyway. The drive he proved uncaught BEHAVIOURALLY, by recording a crash in it, reads as ` +
    `caught under his own key; after one comment line his census cannot report an uncaught drive ` +
    `AT ALL. The error runs toward "no finding", which is the expensive direction (383), and it is ` +
    `in the one grade that carries his finding`,
  driveAnchorUnique === 1 &&
    squash(plantedTry) === squash(mineShipped) &&
    JSON.stringify(before.caught) === JSON.stringify([229]) &&
    JSON.stringify(after.drives) === JSON.stringify(before.drives.map((l) => l + 1)) &&
    JSON.stringify(after.caught) === JSON.stringify(after.drives),
);

// ── R4 — the asymmetry, read at his own commit so it cannot go stale ──────────────────────────
/**
 * `P2` and `P3` are the two halves of one finding. `P2` reads the bytes I shipped out of git
 * (`mineShipped`), so taking it changes nothing about what it grades. `P3` reads `hisSrc` — my live
 * file — and pins three counts off it, so the cure it routes is what reddens it. His `P4` reads live
 * bytes too, but DECLARES the pin as provenance for a recording, which is a different thing and is
 * named as such here.
 *
 * Measured at `HIS_388` rather than live: where each grade reads is a fact about the round, and a
 * grade about a round should not change when the round is superseded (380).
 */
/**
 * The blocks are read STRING-BLIND, and `R2` is why. The raw reading says `P2` reads `hisSrc` twice
 * — both occurrences are inside `P2`'s own claim string, where it QUOTES the conjunct of mine it is
 * about. Raw, this grade would have gone red on a correct claim: my own finding this round, pointed
 * at my own instrument before it shipped. The file is stripped once and the blocks are sliced out of
 * the stripped copy at the same offsets, which `strip-source.mjs` preserves by construction.
 */
const his388Code = stripSource(his388AtPin, { blankStrings: true });
const spanOf = (src, name) => {
  const start = src.indexOf(`  '${name}',`);
  return start < 0 ? [0, 0] : [start, src.indexOf('\n);', start)];
};
const blockOf = (src, name) => {
  const [a, b] = spanOf(his388AtPin, name);
  return src.slice(a, b);
};
const readsLive = (block) => count(block, /\bhisSrc\b/g);
const readsGit = (block) => count(block, /\bmineShipped\b/g);
const p2 = blockOf(his388Code, 'P2');
const p3 = blockOf(his388Code, 'P3');
const p4 = blockOf(his388Code, 'P4');
const p2Raw = blockOf(his388AtPin, 'P2');
const REC = join(HERE, 'his388-against-my-cure.out');
const rec = existsSync(REC) ? readFileSync(REC, 'utf8') : '';
const recNotTrue = [...rec.matchAll(/^NOT TRUE (\w+):/gm)].map((m) => m[1]);
const recProvenance = rec.match(/^# subject-sha: (\w+) \| his-sha: (\w+)$/m);
g(
  'R4',
  `Y4 HOLDS — the asymmetry, at his own commit \`${HIS_388}\`, read string-blind because the RAW ` +
    `reading of \`P2\` says \`hisSrc\` ${count(p2Raw, /\bhisSrc\b/g)}× and both of those are inside ` +
    `\`P2\`'s own claim string quoting my conjunct — this grade would have gone red on a correct ` +
    `claim under the key \`R2\` is about. \`P2\` reads the bytes I shipped out ` +
    `of git (\`mineShipped\` ${readsGit(p2)}×, \`hisSrc\` ${readsLive(p2)}×) and so survives the ` +
    `cure it routes; \`P3\`, the other half of the SAME finding, reads my live file ` +
    `(\`hisSrc\` ${readsLive(p3)}×, \`mineShipped\` ${readsGit(p3)}×) and pins three counts off it. ` +
    `\`P4\` reads live bytes as well (${readsLive(p4)}×) but declares them as a recording's ` +
    `provenance, which is a different thing. Behaviourally, from a recording made against my cured ` +
    `file (provenance ${recProvenance ? `subject ${recProvenance[1]} / his ${recProvenance[2]}` : 'MISSING'}): ` +
    `${recNotTrue.length} of his grades not true — ${recNotTrue.join(', ') || 'none'}`,
  readsGit(p2) > 0 &&
    readsLive(p2) === 0 &&
    readsLive(p3) > 0 &&
    readsGit(p3) === 0 &&
    recProvenance !== null &&
    recProvenance[1] === sha(mineLive) &&
    recProvenance[2] === sha(his388) &&
    JSON.stringify(recNotTrue.sort()) === JSON.stringify(['P3', 'P4']),
);

// ── R5 — my own side of it: three pins, not one ───────────────────────────────────────────────
/**
 * His §4 named `P4` as the pin of mine that would redden on his cure. The drive says three. The
 * recording this grade reads is my own Round 387 instrument, unrepaired, driven against his cured
 * tree — the measurement that put the number at three rather than one.
 */
const PRE = join(HERE, 'mine387-precure-against-his-cure.out');
const pre = existsSync(PRE) ? readFileSync(PRE, 'utf8') : '';
const preNotTrue = [...pre.matchAll(/^NOT TRUE (\w+):/gm)].map((m) => m[1]);
const preProvenance = pre.match(/^# mine-sha: (\w+) \| his386-sha: (\w+)$/m);
const POST = join(HERE, 'mine387-postcure.out');
const liveTally = tallyOf(existsSync(POST) ? readFileSync(POST, 'utf8') : '');
g(
  'R5',
  `Y5 was WRONG, and it was mine to be wrong about: his §4 named ONE pin of mine that would redden ` +
    `on his cure and the drive says ${preNotTrue.length} — ${preNotTrue.join(', ')}. \`C2\` was ` +
    `keyed on the live spelling of his \`driveInstrument\` AND on a window of his live file, \`P1\` ` +
    `asserted \`exit 1\` with the NOT TRUE set \`D1 R1\`, and \`P4\` scraped a \`const\` he had ` +
    `deleted. Add up the numbers in your own sentence (379): the pin class this chain keeps ` +
    `re-finding found three more instances in my own file, and two of them were in grades whose ` +
    `whole subject is that class. All three re-aimed at the defect out of git with the cure graded ` +
    `live (provenance ${preProvenance ? `mine ${preProvenance[1]} / his386 ${preProvenance[2]}` : 'MISSING'}). ` +
    `The repaired instrument's first drive then read ${liveTally[1] ?? '?'} grades, ` +
    `${liveTally[2] ?? '?'} not true — the re-aimed \`P1\`, whose key searched my own commit body ` +
    `for a sentence git had LINE-WRAPPED, which is his Round 388 §5 red reproduced by me one fire ` +
    `later. Keyed whitespace-blind now, with the figure's occurrence counted before the control ` +
    `mutates it, because the control's own first spelling replaced an anchor that the line break had ` +
    `taken apart and so came back true beside a true reading (347). That verdict is NOT a conjunct ` +
    `of this grade: it is about my own key, the re-drive outlives this fire's budget, and a grade ` +
    `that asserted it would be asserting a figure nobody has measured yet`,
  preProvenance !== null &&
    preProvenance[1] === sha(mineShipped) &&
    preProvenance[2] === sha(readFileSync(join(REPO, HIS_386_PATH), 'utf8')) &&
    JSON.stringify(preNotTrue.sort()) === JSON.stringify(['C2', 'P1', 'P4']) &&
    liveTally.length === 3,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
