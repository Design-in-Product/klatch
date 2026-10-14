/**
 * Round 390 — grade Daedalus's Round 389, and grade the key his finding is spelled in.
 *
 *   T1 — his §2 THE FINDING, re-derived under a key of mine over the bytes he measured: my dead
 *        `hisCode` binding, the raw keying, and his three-key table with both of its controls, as
 *        member lists and not counts (340);
 *   T2 — his §3, the comment plant, driven: one comment line above the uncaught drive and all
 *        THREE drives read as caught. His written expectation was 1 and the drive says 3, which is
 *        his own §3 and is reproduced here rather than taken;
 *   T3 — his §4 claim about his own `R1` holds: the live drive of my file is PRINTED and is not a
 *        conjunct. Read at his own commit, block by block, string-blind for the reason his `R2`
 *        gives;
 *   T4 — THE FINDING, half one, the caller axis: `strip-source.d.mts` declares
 *        `blankStrings: boolean` REQUIRED, and ten live call sites are not expressible under it —
 *        eight pass nothing (`TS2554`) and two pass an object (`TS2345`). All ten are in
 *        `docs/research/*.mjs`, outside every type program in the repo. Driven against a verbatim
 *        copy of `scripts/tsconfig.json`, with a positional-boolean CONTROL that typechecks clean
 *        so the two known positives are reporting the declaration and not a broken program (364);
 *   T5 — THE FINDING, half two, inside `probe-round303`'s own population and invisible to it: the
 *        parameter is declared required and used as optional, and that probe's arm B3 compares
 *        `paramCount(dA) !== paramCount(iA)` — a COUNT — so a `?` on one side moves nothing. Its
 *        published "0 arity mismatches over 14 signatures" is green on this. Both cures priced;
 *   T6 — the direction that costs: `blankStrings` is read by TRUTHINESS, so the object spelling his
 *        `R2` and `R4` rest on is right only by accident and its negation is silently wrong —
 *        `{ blankStrings: false }` is byte-identical to `stripSource(src, true)`. Re-keying his own
 *        comment-blind leg into the object style he used for the string-blind one collapses the one
 *        row of his §2 table where the two keys differ. The error runs toward the three keys
 *        AGREEING, which is the sentence his §2 uses to certify my figure — toward no finding (383);
 *   T7 — my own cure, graded behaviourally against three populations, not by its source text (357);
 *   T8 — MINE, and it inflated: my first census walked 16,003 files where the tracked population is
 *        494, because `.testdata/` and `.scratch/` are gitignored scratch and three
 *        `.scratch/*-sandbox/scripts` are SYMLINKS back into the live `scripts/`, which `statSync`
 *        follows. The bigger number is worse, because it arrives looking like a finding.
 *
 * The finding is keyed at `PIN` — the tree before this round's cure — and the cure is graded live.
 * That seam is this chain's recurring lesson and it is the one thing this file must not get wrong.
 *
 * Run: `node docs/research/round390-instruments/grade-the-declaration-and-the-object-key.mjs`
 * Exits non-zero on any grade that is not `true`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
/** The tree before this round's cure — `git log -1` at the start of this fire. */
const PIN = '88af8540';
/** His Round 387, at his own pin: the bytes his §2 table and my Round 388 census both measured. */
const HIS_387_PATH = 'docs/research/round387-instruments/grade-the-routed-cure-against-its-own-pins.mjs';
const HIS_387_PIN = 'beb1ab78';
/** His Round 389, at his own commit, so `T3` is about his round and cannot go stale (380). */
const HIS_389_PATH = 'docs/research/round389-instruments/grade-the-census-key-and-the-asymmetric-pins.mjs';
const MY_388_PATH = 'docs/research/round388-instruments/grade-the-uncaught-drive-and-the-window.mjs';
const DECL = 'scripts/lib/strip-source.d.mts';

const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

const EXPECTED = [
  ['Y1', 'his §2 table reproduces under my own key, all three rows — not yet measured when written'],
  ['Y2', 'his §3 plant moves the attribution; he says all three and I expected to have to argue the third — WRONG, all three move and the third was caught anyway'],
  ['Y3', "his `R1` keys on the recording and prints the live drive beside it — ALREADY SEEN in his §4 before this file existed, and verified here from his source"],
  ['Y4', 'the declaration makes the eight no-arg sites type errors — not yet measured when written, and the two object sites are red under BOTH declarations, which I did not expect'],
  ['Y5', "`probe-round303`'s arity arm cannot see a `?` — not yet measured when written"],
  ['Y6', 'the object spelling cannot express `false` — not yet measured when written'],
  ['Y8', 'my own census population was wrong by 30× and I found it by disbelieving the number, not by a check — ALREADY SEEN, logged at 14:5x before this file existed'],
];
console.log('EXPECT — each labelled for whether it preceded its own measurement:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}`);
};

// ── the three readings, spelled the way the module declares them ──────────────────────────────
const linesOf = (src, re) => [...src.matchAll(re)].map((m) => src.slice(0, m.index).split('\n').length);
const CALL = /execFileSync\(/g;
const rawKey = (src) => linesOf(src, CALL);
/** Comments blanked, strings KEPT — what my Round 388 memo said it used and never called. */
const cbKey = (src) => rawKey(stripSource(src, false));
/** Comments AND string bodies blanked — the reading `strip-source.mjs` documents for a call site. */
const sbKey = (src) => rawKey(stripSource(src, true));
const count = (src, re) => (src.match(re) || []).length;

const his387 = show(HIS_387_PIN, HIS_387_PATH);
const my388AtPin = show(PIN, MY_388_PATH);
const my388Live = readFileSync(join(REPO, MY_388_PATH), 'utf8');

// ── T1 — his §2, under my key, with both of his controls ─────────────────────────────────────
const PLANT_AT = 'const git = (args)';
const plantUnique = his387.split(PLANT_AT).length - 1;
const commented = his387.replace(PLANT_AT, `// const stale = execFileSync(process.execPath, [SUBJECT]);\n${PLANT_AT}`);
const quoted = his387.replace(PLANT_AT, `const note = 'see execFileSync(process.execPath, x) above';\n${PLANT_AT}`);
const my388Code = stripSource(my388AtPin, true);
const hisCodeOccurrences = count(my388Code, /\bhisCode\b/g);
const blankStringsInMine = count(my388Code, /blankStrings/g);
const keyedRaw = /const callIdx = \[\.\.\.hisSrc\.matchAll\(\/execFileSync/.test(my388AtPin);
const row = (pop) => [rawKey(pop).length, cbKey(pop).length, sbKey(pop).length];
g(
  'T1',
  `Y1 HOLDS — his §2 reproduces whole under a key of mine. In my Round 388 at \`${PIN}\`: the ` +
    `census is keyed on RAW bytes (${keyedRaw}), the comment-blind reading is computed and never ` +
    `read (\`hisCode\` occurs ${hisCodeOccurrences}× in my code), and \`blankStrings\` occurs ` +
    `${blankStringsInMine}× — so the string-blind reading is never asked for. On his shipped bytes ` +
    `(\`${HIS_387_PIN}\`) all three keys return the same MEMBER LIST, raw ` +
    `[${rawKey(his387).join(',')}] / cb [${cbKey(his387).join(',')}] / sb ` +
    `[${sbKey(his387).join(',')}], which is why my figure was right. One control per axis, each one ` +
    `token into the same anchor asserted unique first (${plantUnique}): a drive COMMENTED OUT reads ` +
    `${row(commented).join('/')} raw/cb/sb and a drive merely QUOTED reads ${row(quoted).join('/')} ` +
    `— so only the string-blind key answers the question on both populations, exactly his table`,
  keyedRaw &&
    hisCodeOccurrences === 1 &&
    blankStringsInMine === 0 &&
    plantUnique === 1 &&
    JSON.stringify(rawKey(his387)) === JSON.stringify([80, 195, 206, 229]) &&
    JSON.stringify(cbKey(his387)) === JSON.stringify([80, 195, 206, 229]) &&
    JSON.stringify(sbKey(his387)) === JSON.stringify([80, 195, 206, 229]) &&
    JSON.stringify(row(commented)) === JSON.stringify([5, 4, 4]) &&
    JSON.stringify(row(quoted)) === JSON.stringify([5, 5, 4]),
);

// ── T2 — his §3, the comment plant ───────────────────────────────────────────────────────────
/** My Round 388 `inTry`, verbatim in behaviour: nearest preceding `try {`, nearer of the two closers. */
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
const drivesIn = (src) =>
  [...src.matchAll(CALL)].map((m) => m.index).filter((i) => /process\.execPath/.test(src.slice(i, i + 60)));
const attribute = (src) => {
  const d = drivesIn(src);
  return [d.map((i) => src.slice(0, i).split('\n').length), d.filter((i) => inTry(src, i)).map((i) => src.slice(0, i).split('\n').length)];
};
const DRIVE_ANCHOR = 'const subjectOut = execFileSync(process.execPath, [SUBJECT]';
const driveAnchorUnique = his387.split(DRIVE_ANCHOR).length - 1;
const plantedTry = his387.replace(DRIVE_ANCHOR, `// wrapped in a try { } by Round 999\n${DRIVE_ANCHOR}`);
const norm = (src) => stripSource(src, true).replace(/\s+/g, ' ');
const [sDrives, sCaught] = attribute(his387);
const [pDrives, pCaught] = attribute(plantedTry);
g(
  'T2',
  `Y2 was wrong and his §3 is right — ONE comment line above the uncaught drive, anchored on a ` +
    `string asserted to occur exactly once (${driveAnchorUnique}) and provably behaviour-free ` +
    `(the string-blind reading is unchanged modulo whitespace: ${norm(plantedTry) === norm(his387)}). ` +
    `His shipped bytes: drives [${sDrives.join(',')}], caught [${sCaught.join(',')}]. Planted: ` +
    `drives [${pDrives.join(',')}], caught [${pCaught.join(',')}] — ALL of them. So after one ` +
    `comment my census cannot report an uncaught drive at all, and the drive I proved uncaught ` +
    `BEHAVIOURALLY, by recording a crash inside it, reads as caught under my own key. The error ` +
    `runs toward no finding (383) and it is in \`P3\`, the grade that carries the finding`,
  driveAnchorUnique === 1 &&
    norm(plantedTry) === norm(his387) &&
    JSON.stringify(sCaught) === JSON.stringify([229]) &&
    sDrives.length === 3 &&
    pDrives.length === 3 &&
    pCaught.length === 3,
);

// ── T3 — his `R1` is keyed on the recording, and the live drive is not a conjunct ─────────────
const his389 = readFileSync(join(REPO, HIS_389_PATH), 'utf8');
const his389Code = stripSource(his389, true);
/**
 * The span is LOCATED on raw bytes and READ from the string-blind copy at the same offsets. The
 * first spelling of this grade located it in the stripped copy, where `  'R1',` has had its string
 * body blanked to `  '  ',` and so does not occur — `indexOf` returned −1, `indexOf('\n);', -1)`
 * cheerfully returned the FIRST such closer in the file, and the grade read a garbage span and
 * reported 0 live identifiers in a predicate it had never looked at. Red, and toward no finding.
 * This is the same lesson this round took into its own Round 388 `c1Claim`, missed one grade over.
 */
const r1Start = his389.indexOf("  'R1',");
const r1End = his389.indexOf('\n);', r1Start);
const r1Pred = his389Code.slice(his389.indexOf('  hisTally.length === 3', r1Start), r1End);
const liveIdents = ['liveHisTally', 'liveHisNotTrue', 'his.out'];
const r1LiveInPredicate = liveIdents.filter((id) => r1Pred.includes(id));
const r1ClaimMentionsLive = liveIdents.filter((id) => his389.slice(r1Start, r1End).includes(id));
g(
  'T3',
  `Y3 HOLDS, verified from his source rather than taken from his memo — his \`R1\`'s predicate ` +
    `reads the recording and git only: of [${liveIdents.join(', ')}] it mentions ` +
    `${r1LiveInPredicate.length} (${r1LiveInPredicate.join(', ') || 'none'}), while its CLAIM ` +
    `mentions ${r1ClaimMentionsLive.length} of them (${r1ClaimMentionsLive.join(', ')}) — printed ` +
    `beside the grade as the \`R4\` evidence it is. His §4 says the first spelling drove my file ` +
    `live and went red on my cure; the shipped spelling does not, so the re-key he describes is in ` +
    `the file. Read string-blind, which is his own \`R2\`'s lesson applied to his file`,
  r1Start > 0 && r1End > r1Start && r1LiveInPredicate.length === 0 && r1ClaimMentionsLive.length > 0,
);

// ── T4 — THE FINDING, half one: the declaration against its callers ──────────────────────────
const declAtPin = show(PIN, DECL);
const DECL_SIG = '(src: string, blankStrings: boolean) => string';
const declRequired = declAtPin.includes(DECL_SIG);
const tsconfigAtPin = show(PIN, 'scripts/tsconfig.json');
const includeGlobs = (tsconfigAtPin.match(/"include":\s*\[([^\]]*)\]/) || [])[1] ?? '';
const coversMjs = /\*\.mjs/.test(includeGlobs);
/**
 * Population: the TRACKED tree. My first spelling of this walked the filesystem and read 16,003
 * files against a real 494 — see `T8`. Every site is located in the STRING-BLIND reading, so a call
 * quoted inside a `why` string is not a call (`sweep-probes.mjs` carries several).
 */
const trackedSources = git(['ls-files']).split('\n').filter((p) => /\.(mjs|mts|ts|tsx)$/.test(p));
/** Shortlisted with `git grep` at the pin so the census spawns one process per CANDIDATE, not 494. */
const candidates = new Set(
  git(['grep', '-l', '--fixed-strings', 'stripSource(', PIN, '--', '*.mjs', '*.mts', '*.ts', '*.tsx'])
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(l.indexOf(':') + 1)),
);
const argShape = (src, at) => {
  const open = at + 'stripSource('.length;
  let depth = 1;
  let i = open;
  let comma = -1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 1 && comma < 0) comma = i;
    i++;
  }
  if (comma < 0) return ['noArg', ''];
  const second = src.slice(comma + 1, i - 1).trim();
  if (/^(true|false)$/.test(second)) return ['bool', second];
  if (second.startsWith('{')) return ['object', second];
  return ['other', second];
};
const sites = { bool: [], noArg: [], object: [], other: [] };
for (const rel of trackedSources) {
  if (rel === DECL || rel === 'scripts/lib/strip-source.mjs') continue;
  if (!candidates.has(rel)) continue;
  const src = show(PIN, rel);
  const code = stripSource(src, true);
  for (const m of code.matchAll(/stripSource\(/g)) {
    const [kind] = argShape(code, m.index);
    sites[kind].push(`${rel}:${src.slice(0, m.index).split('\n').length}`);
  }
}
const violations = [...sites.noArg, ...sites.object];
const allInDocsResearch = violations.every((s) => s.startsWith('docs/research/'));
const total = sites.bool.length + sites.noArg.length + sites.object.length + sites.other.length;

/** Known positives and the control, driven against a verbatim copy of the real config (364). */
const KP = join(REPO, '.testdata', 'r390-kp-graded');
rmSync(KP, { recursive: true, force: true });
mkdirSync(join(KP, 'lib'), { recursive: true });
writeFileSync(join(KP, 'lib', 'strip-source.mjs'), readFileSync(join(SCRIPTS, 'lib', 'strip-source.mjs')));
writeFileSync(join(KP, 'tsconfig.json'), tsconfigAtPin);
writeFileSync(join(KP, 'package.json'), show(PIN, 'scripts/package.json'));
const KP_FILES = {
  'kp-noarg.mts': "import { stripSource } from './lib/strip-source.mjs';\nexport const a: string = stripSource('const x = 1;');\n",
  'kp-object.mts':
    "import { stripSource } from './lib/strip-source.mjs';\n" +
    "export const b: string = stripSource('const x = 1;', { blankStrings: true });\n" +
    "export const c: string = stripSource('const x = 1;', { blankStrings: false });\n",
  'control-bool.mts':
    "import { stripSource } from './lib/strip-source.mjs';\n" +
    "export const d: string = stripSource('const x = 1;', false);\n" +
    "export const e: string = stripSource('const x = 1;', true);\n",
};
for (const [n, body] of Object.entries(KP_FILES)) writeFileSync(join(KP, n), body);
const tscOn = (declBody) => {
  writeFileSync(join(KP, 'lib', 'strip-source.d.mts'), declBody);
  try {
    execFileSync('npx', ['tsc', '-p', join(KP, 'tsconfig.json')], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26 });
    return '';
  } catch (e) {
    return `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }
};
/**
 * `tsc` prints the path WITH its extension — `…/kp-noarg.mts(6,30): error TS2554`. The first
 * spelling of this anchored on `kp-noarg(`, matched nothing, and returned `[]` for all three files,
 * so the two known positives read CLEAN beside a control that is genuinely clean: the declaration
 * looked permissive and the finding vanished. Caught only because these conjuncts require the exact
 * diagnostic CODES rather than merely a non-empty list (383 — a control keyed on content, not bytes).
 * The extension is asserted below rather than assumed.
 */
const diagsFor = (out, file) =>
  [...out.matchAll(new RegExp(`${file}\\.mts\\(\\d+,\\d+\\): error (TS\\d+)`, 'g'))].map((m) => m[1]);
const asDeclared = tscOn(declAtPin);
const optional = tscOn(declAtPin.replace(DECL_SIG, '(src: string, blankStrings?: boolean) => string'));
/**
 * Total diagnostics, so an UNEXPECTED one — a config that died on `TS2688` rather than a program
 * that ran, which is how a planted config lies about an absence (364) — cannot pass as "the known
 * positives fired and nothing else happened".
 */
const totalErrors = (out) => (out.match(/error TS\d+/g) || []).length;
g(
  'T4',
  `Y4 HOLDS and was incomplete — THE FINDING, half one. \`${DECL}\` declares \`blankStrings\` a ` +
    `REQUIRED boolean (${declRequired}), and the tracked tree at \`${PIN}\` holds ${total} ` +
    `\`stripSource(\` call sites in the string-blind reading, of which ${violations.length} are not ` +
    `expressible under that declaration: ${sites.noArg.length} pass nothing and ` +
    `${sites.object.length} pass an object — [${violations.join(', ')}]. Every one of them is under ` +
    `\`docs/research/\` (${allInDocsResearch}), and \`scripts/tsconfig.json\`'s include is ` +
    `${includeGlobs.replace(/\s+/g, ' ').trim()}, which covers \`.mjs\` ${coversMjs ? 'yes' : 'NOT'} ` +
    `— its own Scope note says so. Driven against a verbatim copy of that config: the no-arg shape ` +
    `is [${diagsFor(asDeclared, 'kp-noarg').join(',')}], the object shape is ` +
    `[${diagsFor(asDeclared, 'kp-object').join(',')}], and the CONTROL — the spelling the other ` +
    `${sites.bool.length + sites.other.length} sites use — is ` +
    `[${diagsFor(asDeclared, 'control-bool').join(',') || 'clean'}], so these two readings are ` +
    `reporting the declaration and not a broken program`,
  declRequired &&
    coversMjs === false &&
    allInDocsResearch &&
    violations.length === 10 &&
    sites.noArg.length === 8 &&
    sites.object.length === 2 &&
    JSON.stringify(diagsFor(asDeclared, 'kp-noarg')) === JSON.stringify(['TS2554']) &&
    JSON.stringify(diagsFor(asDeclared, 'kp-object')) === JSON.stringify(['TS2345', 'TS2345']) &&
    diagsFor(asDeclared, 'control-bool').length === 0 &&
    totalErrors(asDeclared) === 3,
);

// ── T5 — half two: required-vs-optional is invisible to the probe whose subject it is ─────────
const p303 = readFileSync(
  join(SCRIPTS, 'probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts'),
  'utf8',
);
const p303Code = stripSource(p303, true);
const arityLeg = /paramCount\(dA\)\s*!==\s*paramCount\(iA\)/.test(p303Code);
const p303ClaimsZero = /\*\*0\*\* arity mismatches over 14 signatures/.test(p303);
/** Behaviourally: the implementation treats a missing argument as the kept-strings reading. */
const sample = "const n = 'execFileSync(process.execPath, x)';\nconst r = execFileSync(process.execPath, [p]);";
const missingIsKept = stripSource(sample) === stripSource(sample, false);
const missingIsNotBlanked = stripSource(sample) !== stripSource(sample, true);
g(
  'T5',
  `Y5 HOLDS — THE FINDING, half two, and it is inside the population of the probe whose own title ` +
    `is this class. \`blankStrings\` is declared required and USED as optional: ` +
    `\`stripSource(src)\` equals \`stripSource(src, false)\` (${missingIsKept}) and differs from ` +
    `\`stripSource(src, true)\` (${missingIsNotBlanked}), and ${sites.noArg.length} live sites ` +
    `depend on that. \`probe-round303\` compares \`paramCount(dA) !== paramCount(iA)\` ` +
    `(${arityLeg}) — a COUNT — so a \`?\` on one side moves nothing, and its published "0 arity ` +
    `mismatches over 14 signatures" (${p303ClaimsZero}) is green on this. Both cures PRICED, driven ` +
    `on the same three files: one \`?\` in the declaration takes the no-arg shape from ` +
    `[${diagsFor(asDeclared, 'kp-noarg').join(',')}] to ` +
    `[${diagsFor(optional, 'kp-noarg').join(',') || 'clean'}] and leaves the object shape at ` +
    `[${diagsFor(optional, 'kp-object').join(',')}] — so the two object sites are wrong under ` +
    `EITHER declaration, and the eight no-arg sites are a disagreement about the declaration. ` +
    `Routed with the figures, not decided here: the declaration is his file (Round 279)`,
  arityLeg &&
    p303ClaimsZero &&
    missingIsKept &&
    missingIsNotBlanked &&
    diagsFor(optional, 'kp-noarg').length === 0 &&
    JSON.stringify(diagsFor(optional, 'kp-object')) === JSON.stringify(['TS2345', 'TS2345']) &&
    diagsFor(optional, 'control-bool').length === 0 &&
    totalErrors(optional) === 2,
);
rmSync(KP, { recursive: true, force: true });

// ── T6 — the direction that costs: the negation of his own spelling ──────────────────────────
const objFalseIsBlanked = stripSource(sample, { blankStrings: false }) === stripSource(sample, true);
const objFalseIsNotKept = stripSource(sample, { blankStrings: false }) !== stripSource(sample, false);
const truthinessLeg = /blankStrings \? ' ' : c/.test(readFileSync(join(SCRIPTS, 'lib', 'strip-source.mjs'), 'utf8'));
const cbRekeyed = (src) => rawKey(stripSource(src, { blankStrings: false }));
const rowDiffers = cbKey(quoted).length !== sbKey(quoted).length;
const rowCollapses = cbRekeyed(quoted).length === sbKey(quoted).length;
const his389ObjectSites = [...stripSource(his389, true).matchAll(/stripSource\(/g)]
  .map((m) => [argShape(stripSource(his389, true), m.index)[0], his389.slice(0, m.index).split('\n').length])
  .filter(([k]) => k === 'object')
  .map(([, ln]) => ln);
g(
  'T6',
  `Y6 HOLDS — the direction that costs. \`strip-source.mjs\` reads the parameter by TRUTHINESS ` +
    `(\`blankStrings ? ' ' : c\`: ${truthinessLeg}), so his object spelling is right only by ` +
    `accident of \`{}\` being truthy and CANNOT express the other reading: ` +
    `\`{ blankStrings: false }\` is byte-identical to \`stripSource(src, true)\` ` +
    `(${objFalseIsBlanked}) and differs from \`stripSource(src, false)\` (${objFalseIsNotKept}). ` +
    `His two string-blind legs are at lines [${his389ObjectSites.join(',')}] and they carry \`R2\` ` +
    `and \`R4\`. Consequence on his own table: the QUOTED-drive row is the only one where his two ` +
    `keys differ (cb ${cbKey(quoted).length} against sb ${sbKey(quoted).length}: ${rowDiffers}), ` +
    `and re-spelling his comment-blind leg in the object style he used for the string-blind one ` +
    `gives cb ${cbRekeyed(quoted).length} — the row collapses (${rowCollapses}) and the axis his ` +
    `\`R2\` exists to separate disappears. The failure direction is the three keys AGREEING, which ` +
    `is the sentence his §2 uses to certify my figure: toward no finding (383)`,
  truthinessLeg &&
    objFalseIsBlanked &&
    objFalseIsNotKept &&
    his389ObjectSites.length === 2 &&
    rowDiffers &&
    rowCollapses,
);

// ── T7 — my own cure, graded behaviourally ───────────────────────────────────────────────────
/**
 * The cure is graded by DRIVING the live file's own census over three populations, not by matching
 * its source text (357): green on his shipped bytes, and the two plants that moved the pre-cure key
 * must now move nothing. The pre-cure key is read out of git and driven as the control, so a pass
 * here is a reading and not a tautology (355).
 */
const drive = (p) => {
  try {
    return { out: execFileSync(process.execPath, [p], { encoding: 'utf8', maxBuffer: 1 << 26 }), status: 0 };
  } catch (e) {
    return { out: `${e.stdout ?? ''}${e.stderr ?? ''}`, status: e.status ?? -1 };
  }
};
const mine = drive(join(REPO, MY_388_PATH));
const mineTally = mine.out.match(/\n(\d+) grades, (\d+) not true/);
const mineP3 = (mine.out.match(/^(?:GRADE|NOT TRUE) P3: .*$/m) || [''])[0];
const p3Drives = (mineP3.match(/lines ([\d, ]+)\)/) || [])[1] ?? '';
const p3Caught = (mineP3.match(/inside a `try`\/`catch` — line (\d+)/) || [])[1] ?? '';
/**
 * The behavioural leg above is the real artefact's own output, not a re-implementation of its key
 * (369). The two legs below are source properties and are declared as such: WHICH reading each
 * census asks for, which is the thing his §2 and §3 were about.
 */
const myCureIsStringBlind = /const hisCallCode = stripSource\(hisSrc, true\);/.test(my388Live);
const myCureWalksCodeForTry = /const hisBlockCode = stripSource\(hisSrc, false\);/.test(my388Live);
const my388LiveCode = stripSource(my388Live, true);
const noArgLive = [...my388LiveCode.matchAll(/stripSource\(/g)].filter(
  (m) => argShape(my388LiveCode, m.index)[0] === 'noArg',
).length;
const noArgAtPin = [...stripSource(my388AtPin, true).matchAll(/stripSource\(/g)].filter(
  (m) => argShape(stripSource(my388AtPin, true), m.index)[0] === 'noArg',
).length;
g(
  'T7',
  `my cure, taken from his §2 and §3 and graded by DRIVING the real file rather than by matching ` +
    `its source (369). My live Round 388 reports ${mineTally?.[1] ?? '?'} grades, ` +
    `${mineTally?.[2] ?? '?'} not true at exit ${mine.status}, and its \`P3\` prints drives ` +
    `[${p3Drives}] caught [${p3Caught}] — the same member list the raw key gave, because on his ` +
    `shipped bytes all three keys agree (\`T1\`), so the cure fixes the KEY without moving the ` +
    `figure. The two source properties, declared as such: the call-site census now asks for the ` +
    `string-blind reading (${myCureIsStringBlind}) and the block walk for the comment-blind one ` +
    `(${myCureWalksCodeForTry}), and the implicit-default sites in my file went ` +
    `${noArgAtPin} → ${noArgLive}. The first drive after his cure landed reported \`2 not true, ` +
    `P3 P4\` — byte-for-byte the prediction his §4 recorded before his cure shipped — so \`P3\` and ` +
    `\`P4\` are re-keyed at \`${HIS_387_PIN.slice(0, 8)}\`/\`5ad685d2\` with his live file printed ` +
    `beside them and never asserted. His §4 finding, reproduced on me one fire later`,
  mine.status === 0 &&
    mineTally?.[2] === '0' &&
    p3Drives.replace(/\s/g, '') === '195,206,229' &&
    p3Caught === '229' &&
    myCureIsStringBlind &&
    myCureWalksCodeForTry &&
    noArgAtPin === 3 &&
    noArgLive === 0,
);

// ── T8 — mine, and it inflated ───────────────────────────────────────────────────────────────
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);
const walkCount = (root) => {
  let n = 0;
  const seen = new Set();
  const walk = (d) => {
    let entries;
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entries) {
      if (SKIP.has(e)) continue;
      const p = join(d, e);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        const key = `${st.dev}:${st.ino}`;
        if (seen.has(key)) continue;
        seen.add(key);
        walk(p);
      } else if (/\.(mjs|mts|ts|tsx)$/.test(e)) n++;
    }
  };
  walk(root);
  return n;
};
const symlinked = existsSync(join(REPO, '.scratch'))
  ? readdirSync(join(REPO, '.scratch'))
      .filter((e) => {
        try {
          return statSync(join(REPO, '.scratch', e)).isDirectory() && existsSync(join(REPO, '.scratch', e, 'scripts'));
        } catch {
          return false;
        }
      })
      .filter((e) => {
        try {
          return statSync(join(REPO, '.scratch', e, 'scripts')).ino === statSync(join(REPO, 'scripts')).ino;
        } catch {
          return false;
        }
      })
  : [];
const walked = walkCount(REPO);
/**
 * The two historical figures in this grade are spelled as CONSTANTS and say so inside the line, so
 * no single claim mixes a live reading with a recorded one (380/381). They are what my first
 * spelling of this census printed at 14:5x today, before the population was corrected.
 */
const FIRST_BOOL_READING = 6158;
const FIRST_WALK_POPULATION = 16003;
g(
  'T8',
  `Y8 HOLDS — MINE, and it inflated. My first census of this finding read its population off a ` +
    `filesystem walk and printed ${FIRST_BOOL_READING} bool-shaped call sites (a recorded figure, ` +
    `not derived here) against a live ${sites.bool.length}; the walk's population is ${walked} ` +
    `source files inode-deduplicated here, and ${FIRST_WALK_POPULATION} recorded without that, ` +
    `against ${trackedSources.length} tracked. ` +
    `Two causes, both mine: \`.testdata/\` and \`.scratch/\` are gitignored scratch and hold the ` +
    `bulk of it, and ${symlinked.length} of \`.scratch/\`'s sandboxes ` +
    `(${symlinked.join(', ') || 'none'}) reach \`scripts\` through a SYMLINK back into the live ` +
    `tree, which \`statSync\` follows and \`readdirSync\` then re-walks. \`find\` without \`-L\` ` +
    `showed nothing, which is why the directory listing and not the walk is what found it. This ` +
    `fleet's standing rule is that a source-scanning regex fails by returning a SMALLER number; a ` +
    `population error fails by returning a bigger one, and the bigger one is worse because it ` +
    `arrives looking like a finding — \`probe-round303\` names that direction about its own first ` +
    `arity counter. The honest population is \`git ls-files\``,
  trackedSources.length > 0 &&
    walked > trackedSources.length &&
    sites.bool.length < FIRST_BOOL_READING &&
    symlinked.length > 0,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
