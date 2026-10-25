/**
 * Round 452 — Theseus's Round 451 routed two items here. This instrument grades both.
 *
 * ITEM 1, his §6.1: "the id grammar on `readCorpusRows`'s legacy branch — §5's
 * `READER_TOO_WIDE=154`. Your surface. `ID_GRAMMAR` already exists in the file and the canonical
 * branch uses it; the legacy branch does not. I have not priced whether applying it there costs
 * any of the 184 genuine rows."
 *
 * The census ran first (`census*.mjs` + `drive1`–`drive3` in this directory, committed as the
 * record of that ordering) and the routed cure does not survive it:
 *
 *   `ID_GRAMMAR` is `/^[A-Za-z0-9_.:-]+$/`. The legacy branch's inline id capture is
 *   `([A-Za-z0-9_.:-]+)`. Same character class, and the capture is bounded by the surrounding
 *   regex, so every id the legacy branch produces satisfies `ID_GRAMMAR` BY CONSTRUCTION.
 *   Measured: **0 of 1045** legacy rows in the committed corpus have an id `ID_GRAMMAR` rejects.
 *   Applying it there is a no-op, and it would price at zero because it does nothing.
 *
 * So the question becomes the one behind it: does ANY character class on the id separate the
 * genuine rows from the lines that merely begin with a token word? `A1`–`A3` answer no, and they
 * answer it the only way a "no key exists" claim can be answered — by exhibiting counterexamples
 * in BOTH directions out of one hand-read population (378 — a routed finding does not validate
 * its routed cure; 380 — for a small population the hand reading is primary).
 *
 * The hand reading: 1045 legacy rows reduce to 116 distinct id spellings, small enough to read all
 * of. `drive3.all-ids.out` dumps every one with a real line; `HAND` below classifies every one of
 * the 116 against that dump, THREE ways rather than two, because the dump shows the corpus is not
 * rows-and-prose:
 *
 *   LEGROW — the capture identifies a leg or a prediction. Includes `G1`, `S-14`, `CELL03-CANCEL`
 *            and also `tree-fingerprint.mts:160`, a file address used as a leg id.
 *   TABLE  — a record line whose second column is DATA, not an identifier: `ok 110 906`,
 *            `RED round431 → []`, `ok pre false live false { ...src }`, `REFUTED 0 no body …`.
 *   PROSE  — an English sentence whose second word happens to follow a token spelling:
 *            `ok every KP and control as expected: true`, `ok MAX_HISTORY_MESSAGES sliced once`.
 *
 * That third bucket is why his `READER_TOO_WIDE=154` is not a count of prose: his own §5 limit
 * said the split was keyed on a heuristic. Hand-read, the wide reader's error is mostly TABLE, not
 * PROSE, and TABLE lines are records — which is a different repair from the one a prose-rejecting
 * class would be.
 *
 * ITEM 2, his §4: 446's `pinDied` conjoins `legLines(pinOut) === 0` where
 * `legLines = /^(?: ok |FAIL|REF ) G/`, so the conjunct is satisfied by any LIVE run whose legs are
 * not `G`-prefixed, and `treeLives`'s `legLines(treeOut) > 0` is the same constraint pointed the
 * other way. His figure, re-derived here under a key of my own (`readCorpusRows` rather than his
 * `ROWISH`, so the two do not share the numerator's selector): **26 of 400**, and my whole-corpus
 * 28 of 404 decomposes to exactly his 26 plus his own 2 round-451 recordings. `B1`–`B4` cure both
 * call sites off the lib and grade the cure with a cripple, because a cure graded only by "the
 * figure moved" cannot tell a repair from a reader that stopped reading.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTail, readCorpusRows, readVerdict, ID_GRAMMAR, LEGACY_ROW_TOKENS } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/**
 * The population rev is a LITERAL — the tree as it stood before this round wrote anything — so the
 * gated figures do not move when this round commits, and the post-commit re-drive can diff them
 * (409 — stamp the rev AND select with `ls-tree`; 450 §7.2 — a reader pinned to `HEAD~1` goes
 * vacuous on the commit that promotes it).
 */
const PRE_ROUND_REV = '255d9180a98a1c3d487a31ae21d79752a9c7a65e';
const SELF_DIR = 'docs/research/round452-instruments/';
const HIS_DIR = 'docs/research/round451-instruments/';
const R446_REL = 'docs/research/round446-instruments/grade-my-own-oracle-predicate.mjs';
const R448_REL = 'docs/research/round448-instruments/record-cripples.mjs';

const LEGACY_INLINE = /^ *([A-Za-z][A-Za-z0-9_]*) +([A-Za-z0-9_.:-]+)(?: +(.*))?$/;
const R446_LEGLINES = /^(?: ok |FAIL|REF ) G/;

const legs = [];
const preds = [];
const leg = (id, ok, what) => legs.push({ id, ok, what: String(what).replace(/\s+/g, ' ').trim() });
const pred = (id, landed, what) => preds.push({ id, landed, what: String(what).replace(/\s+/g, ' ').trim() });

/**
 * PREDICTIONS, declared in source before the run.
 *
 * P1 — hand-read, the wide legacy reader's error set is mostly TABLE, not PROSE: the TABLE row
 *      count exceeds the PROSE row count. If it lands, "the reader lets prose in" is the wrong
 *      diagnosis of the wide branch and a prose-rejecting class is aimed at the smaller half.
 * P2 — re-driving 446 with the cured reader moves `H3`'s reported leg-line counts and leaves
 *      `H3`'s own verdict unchanged, i.e. the call site was wrong about its numbers without being
 *      wrong about its answer on THIS subject. If it is refuted in the direction of the verdict
 *      moving, the defect was live in 446's published result too, not only in its reported counts.
 *
 * The legs gate on their own keys, never on these (386 — gate the figure on the key, not on the
 * prediction).
 */
const P1_TEXT = 'hand-read, the legacy branch admits more TABLE rows than PROSE rows';
const P2_TEXT = "re-driving 446 off the lib moves H3's leg-line counts and not H3's verdict";

// ── The population, pinned and counted ──────────────────────────────────────────────────────────
const outsAll = git(['ls-tree', '-r', '--name-only', PRE_ROUND_REV])
  .split('\n').filter((n) => n.endsWith('.out') && !n.startsWith(SELF_DIR));
const texts = new Map(outsAll.map((p) => [p, git(['cat-file', 'blob', `${PRE_ROUND_REV}:${p}`])]));

const rows = [];
for (const [path, text] of texts) {
  for (const line of text.split('\n')) {
    const m = line.match(LEGACY_INLINE);
    if (m === null) continue;
    if (LEGACY_ROW_TOKENS[m[1]] === undefined) continue;
    rows.push({ path, line, token: m[1], id: m[2] });
  }
}
const byId = new Map();
for (const r of rows) byId.set(r.id, (byId.get(r.id) ?? 0) + 1);

/**
 * THE HAND READING — all 116 distinct id spellings, classified against `drive3.all-ids.out`.
 * Written as a literal table so it is auditable and so no key can be tuned against a moving
 * target. A leg below asserts this table covers the population EXACTLY: no id in the corpus
 * missing from the table, no id in the table absent from the corpus.
 */
const HAND = {
  // ── LEGROW: the capture identifies a leg or a prediction ──
  P1: 'LEGROW', P2: 'LEGROW',
  G1: 'LEGROW', G2: 'LEGROW', G3: 'LEGROW', G4: 'LEGROW', G5: 'LEGROW', G6: 'LEGROW',
  G7: 'LEGROW', G8: 'LEGROW', G9: 'LEGROW', G10: 'LEGROW', G11: 'LEGROW', G12: 'LEGROW',
  H1: 'LEGROW', H2: 'LEGROW', H3: 'LEGROW', H4: 'LEGROW', H5: 'LEGROW',
  C1: 'LEGROW', C2: 'LEGROW', C3: 'LEGROW',
  'KP-1': 'LEGROW', 'KP-2': 'LEGROW', 'KP-3': 'LEGROW', 'KP-4': 'LEGROW', 'KP-5': 'LEGROW',
  'KP-6': 'LEGROW', 'KP-7': 'LEGROW', 'KP-8': 'LEGROW', 'KP-9': 'LEGROW', 'KP-10': 'LEGROW',
  'KP-11': 'LEGROW', 'KP-12': 'LEGROW', 'KP-13': 'LEGROW',
  'KP-A': 'LEGROW', 'KP-B': 'LEGROW', 'KP-C': 'LEGROW', 'KP-D': 'LEGROW', 'KP-E': 'LEGROW',
  'KP-F': 'LEGROW', 'KP-G': 'LEGROW', 'KP-H': 'LEGROW', 'KP:': 'LEGROW',
  'S-1': 'LEGROW', 'S-2': 'LEGROW', 'S-3': 'LEGROW', 'S-4': 'LEGROW', 'S-5': 'LEGROW',
  'S-6': 'LEGROW', 'S-7': 'LEGROW', 'S-8': 'LEGROW', 'S-9': 'LEGROW', 'S-10': 'LEGROW',
  'S-11': 'LEGROW', 'S-12': 'LEGROW', 'S-13': 'LEGROW', 'S-14': 'LEGROW', 'S-15': 'LEGROW',
  'S-16': 'LEGROW', 'S-17': 'LEGROW',
  'CONTROL-COMMENT': 'LEGROW', 'CONTROL-STRING': 'LEGROW', 'CONTROL-HIS': 'LEGROW',
  'CONTROL-NOFINDER': 'LEGROW', 'CONTROL-CURED': 'LEGROW', 'CONTROL-ABSENT': 'LEGROW',
  'CONTROL:': 'LEGROW',
  'G-POS': 'LEGROW', 'G-BIND': 'LEGROW', 'G-INIT': 'LEGROW', 'G-NONE': 'LEGROW',
  'CELL00-MODELSLIST': 'LEGROW', 'CELL01-COMPACTION': 'LEGROW', 'CELL03-CANCEL': 'LEGROW',
  'CELL04-TOOLUSE': 'LEGROW', 'CELL05-HAIKU': 'LEGROW',
  // LEGROWs whose id is a lowercase file address — the counterexample that kills every
  // uppercase-initial key
  'list-the-declarations-under-the-409-key.mjs:24': 'LEGROW',
  'cure-the-wrapped-call-and-the-body-key.mjs:555': 'LEGROW',
  'tree-fingerprint.mts:160': 'LEGROW',

  // ── TABLE: a record line whose second column is data ──
  pre: 'TABLE', src: 'TABLE', DEFECT: 'TABLE', blanked: 'TABLE', cured: 'TABLE',
  'preds-clean': 'TABLE', REFUTED: 'TABLE', prefused: 'TABLE',
  round431: 'TABLE', round433: 'TABLE', round435: 'TABLE',
  GRADE: 'TABLE', 'ANCHOR-LIVE:': 'TABLE',
  '0': 'TABLE', '10': 'TABLE', '11': 'TABLE', '15': 'TABLE', '16': 'TABLE',
  '26': 'TABLE', '30': 'TABLE', '52': 'TABLE', '110': 'TABLE',

  // ── PROSE: an English sentence beginning with a token spelling ──
  every: 'PROSE', his: 'PROSE', the: 'PROSE', at: 'PROSE', members: 'PROSE',
  history: 'PROSE', compaction: 'PROSE', instructions: 'PROSE', betas: 'PROSE',
  edit: 'PROSE', source: 'PROSE', max_tokens: 'PROSE',
  'client.ts': 'PROSE', MAX_HISTORY_MESSAGES: 'PROSE',
};

const weight = (id) => byId.get(id) ?? 0;
const idsOf = (kind) => Object.entries(HAND).filter(([, v]) => v === kind).map(([k]) => k);
const rowsOf = (kind) => idsOf(kind).reduce((s, id) => s + weight(id), 0);

// ── A0 — the hand reading covers the population exactly ─────────────────────────────────────────
const missingFromHand = [...byId.keys()].filter((id) => HAND[id] === undefined);
const absentFromCorpus = Object.keys(HAND).filter((id) => weight(id) === 0);
const handSum = rowsOf('LEGROW') + rowsOf('TABLE') + rowsOf('PROSE');
leg('A0', missingFromHand.length === 0 && absentFromCorpus.length === 0 && handSum === rows.length,
  `THE HAND READING IS A SLICE OF THE CORPUS, NOT A GUESS AT IT. ${rows.length} legacy rows over `
  + `${byId.size} distinct ids; the table classifies ${Object.keys(HAND).length}. Ids in the corpus `
  + `and not in the table: ${missingFromHand.length} ${JSON.stringify(missingFromHand.slice(0, 6))} · `
  + `ids in the table and not in the corpus: ${absentFromCorpus.length} `
  + `${JSON.stringify(absentFromCorpus.slice(0, 6))} · weighted sum ${handSum} === rows `
  + `${rows.length}. Pass 2 of the census failed exactly this leg — 15 of 16 disputed ids `
  + `unclassified and 16 of 18 typed prose words occurring zero times — which is why it exists`);

// ── A1 — the routed cure is a no-op, measured ───────────────────────────────────────────────────
const rejectedByIdGrammar = rows.filter((r) => !ID_GRAMMAR.test(r.id)).length;
leg('A1', rejectedByIdGrammar === 0,
  `HIS §6.1 ROUTED CURE IS A NO-OP AND PRICES AT ZERO BECAUSE IT DOES NOTHING. ID_GRAMMAR is `
  + `${String(ID_GRAMMAR)}; the legacy branch's inline capture is ([A-Za-z0-9_.:-]+) — the same `
  + `class, bounded by the surrounding regex, so every legacy id satisfies ID_GRAMMAR by `
  + `construction. Legacy rows whose id ID_GRAMMAR rejects: ${rejectedByIdGrammar} of ${rows.length}. `
  + `His §6.1 says "the canonical branch uses it; the legacy branch does not", which is true of the `
  + `SOURCE and empty as a repair`);

// ── A2 — no id character class separates, both directions exhibited ─────────────────────────────
//
// The claim is a negative, so it is graded by counterexamples rather than by a rate. Two sets,
// both non-empty, settle it for every class simultaneously: a class that keeps the lowercase
// LEGROWs must admit lowercase ids, which admits the lowercase TABLE and PROSE; a class that
// rejects them loses genuine rows. No character class on the id can do both.
const lowercaseLegrows = idsOf('LEGROW').filter((id) => /^[a-z]/.test(id));
const uppercaseNonLegrows = idsOf('TABLE').concat(idsOf('PROSE')).filter((id) => /^[A-Z]/.test(id));
const digitNonLegrows = idsOf('TABLE').concat(idsOf('PROSE')).filter((id) => /^[0-9]/.test(id));
const wLowerLeg = lowercaseLegrows.reduce((s, id) => s + weight(id), 0);
const wUpperNon = uppercaseNonLegrows.reduce((s, id) => s + weight(id), 0);
leg('A2', lowercaseLegrows.length > 0 && uppercaseNonLegrows.length > 0,
  `NO CHARACTER CLASS ON THE ID SEPARATES, AND THE PROOF IS TWO NON-EMPTY SETS IN ONE POPULATION. `
  + `LEGROWs with a LOWERCASE id: ${lowercaseLegrows.length} spellings / ${wLowerLeg} rows `
  + `${JSON.stringify(lowercaseLegrows)} — file addresses used as leg ids. NON-LEGROWs with an `
  + `UPPERCASE id: ${uppercaseNonLegrows.length} spellings / ${wUpperNon} rows `
  + `${JSON.stringify(uppercaseNonLegrows)}. Plus ${digitNonLegrows.length} digit-initial NON-LEGROW `
  + `spellings ${JSON.stringify(digitNonLegrows)}. Any class keeping the first set admits the `
  + `second; any class rejecting the second loses the first. This is why the repair is not a `
  + `tighter class (378 — a routed finding does not validate its routed cure)`);

// ── A3 — the three candidate classes, graded against the hand reading ───────────────────────────
const CANDIDATES = {
  'ID_GRAMMAR (his §6.1)': (id) => ID_GRAMMAR.test(id),
  'upper-or-digit (his §5)': (id) => /[A-Z0-9]/.test(id),
  'upper-initial (his ROWISH)': (id) => /^[A-Z]/.test(id),
};
const matrix = {};
for (const [name, fn] of Object.entries(CANDIDATES)) {
  let legKept = 0; let legLost = 0; let nonLetIn = 0; let nonKeptOut = 0;
  for (const [id, kind] of Object.entries(HAND)) {
    const n = weight(id);
    if (fn(id)) { if (kind === 'LEGROW') legKept += n; else nonLetIn += n; } else if (kind === 'LEGROW') legLost += n; else nonKeptOut += n;
  }
  matrix[name] = { legKept, legLost, nonLetIn, nonKeptOut };
}
const anySeparates = Object.values(matrix).some((m) => m.legLost === 0 && m.nonLetIn === 0);
leg('A3', anySeparates === false,
  `EVERY CANDIDATE CLASS ERRS IN AT LEAST ONE DIRECTION, WEIGHTED BY ROW COUNT OVER THE WHOLE `
  + `HAND READING rather than over the 13 rows census pass 2 managed to key on. `
  + Object.entries(matrix).map(([n, m]) => `${n}: LEGROW-kept=${m.legKept} LEGROW-lost=${m.legLost} `
    + `non-let-in=${m.nonLetIn} non-kept-out=${m.nonKeptOut}`).join(' · ')
  + ` · any class separating: ${anySeparates}. His §5 heuristic is the best of the three and still `
  + `lets ${matrix['upper-or-digit (his §5)'].nonLetIn} non-rows in`);

// ── A4 — P1: the error set is mostly TABLE, not PROSE ───────────────────────────────────────────
const nLeg = rowsOf('LEGROW'); const nTable = rowsOf('TABLE'); const nProse = rowsOf('PROSE');
pred('P1', nTable > nProse, P1_TEXT);
leg('A4', nLeg + nTable + nProse === rows.length,
  `THE WIDE BRANCH'S ERROR SET, DECOMPOSED THREE WAYS AND SUMMED AGAINST THE ROW COUNT. `
  + `LEGROW=${nLeg} TABLE=${nTable} PROSE=${nProse} · sum ${nLeg + nTable + nProse} === `
  + `${rows.length}. His §5 called the gap an "over-read of prose" and then corrected himself to a `
  + `two-way split with a stated heuristic limit; read by hand it is THREE-way, and the largest `
  + `error bucket is TABLE — record lines whose second column is data. P1 ${nTable > nProse ? 'LANDED' : 'REFUTED'}`);

// ── B1 — his §4 figure, re-derived under a key of my own ────────────────────────────────────────
const aliveUnreadable = [];
for (const [path, text] of texts) {
  if (readVerdict(text).ok !== true) continue;
  if (readCorpusRows(text).rows.length === 0) continue;
  if (text.split('\n').some((l) => R446_LEGLINES.test(l))) continue;
  aliveUnreadable.push(path);
}
const hisOwn = aliveUnreadable.filter((p) => p.startsWith(HIS_DIR));
const hisDenom = outsAll.filter((p) => !p.startsWith(HIS_DIR)).length;
const mineOnHisDenom = aliveUnreadable.length - hisOwn.length;
leg('B1', mineOnHisDenom === 26 && hisDenom === 400,
  `HIS §4 FIGURE REPRODUCES UNDER A DIFFERENT NUMERATOR SELECTOR. He keyed "has rows" on his own `
  + `ROWISH regex; this keys it on the lib's readCorpusRows, so the two figures do not share the `
  + `selector that picks the numerator (369). Whole corpus: ${aliveUnreadable.length} of `
  + `${outsAll.length}. Of those, in HIS round dir: ${hisOwn.length} `
  + `${JSON.stringify(hisOwn.map((p) => p.slice(HIS_DIR.length)))}. On his denominator: `
  + `${mineOnHisDenom} of ${hisDenom} — his published 26 of 400. The 28-vs-26 gap is exactly his `
  + `self-exclusion and not a disagreement (443)`);

// ── B2 — the cure is in at both call sites, read off the source with the COMMENTS STRIPPED ──────
//
// The first version of this leg went RED against a tree where both cures were in, because both
// cures quote the regex they replaced in the docblock explaining them, and the leg's absence key
// matched the quotation. That is 424 exactly: a correction that quotes the wrong spelling
// re-trips the detector. So the key reads the LIVE CODE — comments stripped first — and carries
// two controls, because a stripper that deleted too much would make every absence key pass.
const stripComments = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').map((l) => l.replace(/(^|\s)\/\/.*$/, '$1')).join('\n');
const src446 = readFileSync(join(REPO, R446_REL), 'utf8');
const src448 = readFileSync(join(REPO, R448_REL), 'utf8');
const code446 = stripComments(src446);
const code448 = stripComments(src448);
const OLD446 = /\^\(\?:\s*ok\s*\|FAIL\|REF\s*\)\s*G/;
const OLD448 = /\^\(\?:\s*ok\s*\|RED\s*\|REF\s*\)\s*\(\[A-Z\]/;
// CONTROL 1 — the stripper must leave the code: the new call must still be found after stripping.
const stripperKeptCode = /readCorpusRows/.test(code446) && /readCorpusRows/.test(code448);
// CONTROL 2 — the stripper must actually strip: both old regexes ARE present in the unstripped
// text (they are quoted in the docblocks), so if stripping were a no-op this control fails and
// the absence keys below would be known-unreliable rather than silently wrong.
const stripperDidStrip = OLD446.test(src446) && OLD448.test(src448);
const gone446 = !OLD446.test(code446);
const gone448 = !OLD448.test(code448);
const uses446 = /readCorpusRows/.test(code446);
const uses448 = /readCorpusRows/.test(code448);
leg('B2', gone446 && gone448 && uses446 && uses448 && stripperKeptCode && stripperDidStrip,
  `BOTH HAND-ROLLED READERS ARE GONE FROM THE LIVE CODE AT BOTH CALL SITES AND BOTH NOW CALL THE `
  + `LIB. This is the "not taken" item his §6 has carried since 450, which his T8 turned from a `
  + `tidiness argument into a correctness one. 446 G-prefixed reader absent from code: ${gone446} · `
  + `446 calls readCorpusRows: ${uses446} · 448 four-character token slicer absent from code: `
  + `${gone448} · 448 calls readCorpusRows: ${uses448} · CONTROL stripper kept the code: `
  + `${stripperKeptCode} · CONTROL stripper actually stripped (both old spellings ARE in the raw `
  + `text, quoted in the docblocks): ${stripperDidStrip}. Keyed on raw text this leg was RED `
  + `against this same tree`);

// ── B3 — the cure READS the recordings the old reader could not ─────────────────────────────────
//
// Graded positively: the cured reader must return >0 rows on every one of the 26 live recordings
// the old reader read as zero. A cure graded only as "the figure moved" cannot tell a repair from
// a reader that stopped reading, so the known positive is each named file (414).
const curedReadsAll = aliveUnreadable.every((p) => readCorpusRows(texts.get(p)).rows.length > 0);
const firstThree = aliveUnreadable.slice(0, 3).map((p) => {
  const r = readCorpusRows(texts.get(p)).rows;
  return `${p.split('/').slice(-2).join('/')}:${r.length}rows/${[...new Set(r.map((x) => x.id))].slice(0, 4).join(',')}`;
});
leg('B3', curedReadsAll && aliveUnreadable.length > 0,
  `THE CURED READER READS ALL ${aliveUnreadable.length} RECORDINGS THE OLD ONE READ AS DEAD, keyed `
  + `per file rather than on the total. ${JSON.stringify(firstThree)}. His §4's first-named file is `
  + `446's OWN drive2 — the reader could not read the rows in the recording the same round `
  + `produced, which is 438 again one artifact over`);

// ── B4 — the cripple: the cure is not a reader that always says "alive" ─────────────────────────
//
// 411/439 — positively key the last bucket. A liveness reader that returns >0 on everything is
// useless, so the control is a genuinely rowless text, and a second control is the real dead blob
// shape 446's pin produces: a stack trace with no rows and no verdict line.
const CRIPPLE_EMPTY = '';
const CRIPPLE_DEAD = 'node:internal/modules/run_main\n    throw err;\n    ^\nError: boom\n    at file:///x.mjs:1\n';
const crippleEmpty = readCorpusRows(CRIPPLE_EMPTY).rows.length;
const crippleDead = readCorpusRows(CRIPPLE_DEAD).rows.length;
leg('B4', crippleEmpty === 0 && crippleDead === 0,
  `THE CURED READER STILL SAYS DEAD WHEN A RUN IS DEAD, so B3 is not a reader that answers "alive" `
  + `unconditionally. Empty text → ${crippleEmpty} rows (0 required) · a real stack-trace-only `
  + `blob, the shape 446's pinned pre-repair run actually produces → ${crippleDead} rows (0 `
  + `required). Both cripples are declared in this file's source and each name occurs more than `
  + `once, so a cripple no leg reads cannot pass as a clean control (447)`);

// ── B5 — P2: re-drive 446 and see which of its outputs moved ────────────────────────────────────
//
// The subject is run, not reasoned about (344 — run the regex, don't reason about it). `H3`'s
// verdict and its two reported leg-line counts are read separately, because a call site can be
// wrong about its numbers while still right about its answer on one subject — and which of those
// two it is, is the whole severity question.
const driveFile = (abs) => {
  try {
    return { rc: 0, text: execFileSync('node', [abs], {
      encoding: 'utf8', maxBuffer: 1 << 28, cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, KLATCH_R446_DEPTH: '1' },
    }) };
  } catch (e) { return { rc: e.status ?? 1, text: `${e.stdout ?? ''}${e.stderr ?? ''}` }; }
};

const r446 = driveFile(join(REPO, R446_REL));
const r446V = readVerdict(r446.text);
const h3Rows = readCorpusRows(r446.text).rows.filter((r) => r.id === 'H3');
const h3State = h3Rows.length === 0 ? null : h3Rows[0].state;
const treeLegCount = (r446.text.match(/HIS WORKING TREE[^\n]*?(\d+) leg line\(s\)/) ?? [])[1] ?? '(unread)';
const pinLegCount = (r446.text.match(/HIS PRE-REPAIR BLOB[^\n]*?(\d+) leg line\(s\)/) ?? [])[1] ?? '(unread)';

// The committed baseline for P2, read out of 446's last committed recording at the pinned rev
// rather than remembered: a prediction about something "moving" needs the before-value sliced
// from the artifact, not retyped (415).
const BASELINE_REL = 'docs/research/round446-instruments/drive8.postcommit.out';
const baseline = texts.get(BASELINE_REL) ?? '';
const baseTreeCount = (baseline.match(/HIS WORKING TREE[^\n]*?(\d+) leg line\(s\)/) ?? [])[1] ?? '(unread)';
const baseH3 = readCorpusRows(baseline).rows.filter((r) => r.id === 'H3');
const baseH3State = baseH3.length === 0 ? null : baseH3[0].state;

// If the subject cannot be driven at all, this cell REFUSES. It must not red: an unrunnable cell
// publishing a defect is 446's own §5 finding and 441's (a grading instrument that cannot refuse
// manufactures findings).
const ranAtAll = r446V.ok === true && h3Rows.length === 1;
const countsMoved = ranAtAll && treeLegCount !== '(unread)' && baseTreeCount !== '(unread)'
  && Number(treeLegCount) !== Number(baseTreeCount);
const verdictHeld = ranAtAll && h3State === baseH3State;
pred('P2', ranAtAll ? (countsMoved && verdictHeld) : null, P2_TEXT);
leg('B5', ranAtAll ? true : null,
  `446 RE-DRIVEN LIVE AND ITS H3 ROW READ BY THE LIB rather than by a regex of mine. exit `
  + `${r446.rc} · verdict ${r446V.ok ? r446V.verdict.token : r446V.refusal} · H3 rows found `
  + `${h3Rows.length} (exactly 1 required) · H3 state ${JSON.stringify(h3State)} · pin leg lines `
  + `${pinLegCount} (0 required — a genuinely dead blob) · tree leg lines ${treeLegCount}, `
  + `baseline ${baseTreeCount} from ${BASELINE_REL.split('/').pop()}. P2: counts moved `
  + `${countsMoved}, H3's own verdict held ${verdictHeld} (${JSON.stringify(baseH3State)} → `
  + `${JSON.stringify(h3State)}) → ${ranAtAll ? (countsMoved && verdictHeld ? 'LANDED' : 'REFUTED') : 'REFUSED'}. `
  + `CONFOUND, STATED: the 7 → 11 count delta is NOT attributable to the reader alone — the `
  + `subject's own output grew too, because Theseus's instrument moved in the tree between that `
  + `recording and now. B7 is the unconfounded reader comparison`);

// ── B7 — the reader change, measured where nothing else moved ───────────────────────────────────
//
// B5's count delta is confounded by the subject moving. This cell is not: both readers are applied
// to ONE captured text — 446's own fresh output, whose legs are `H1`–`H5` — so the only variable
// is the reader. This is the shape of Theseus's §4 finding reduced to a single comparison.
const oldOn446 = r446.text.split('\n').filter((l) => R446_LEGLINES.test(l)).length;
const newOn446 = readCorpusRows(r446.text).rows.length;
leg('B7', ranAtAll && oldOn446 === 0 && newOn446 > 0,
  `THE READER CHANGE, MEASURED WITH THE SUBJECT HELD CONSTANT. One captured text — 446's own `
  + `fresh output — read by both readers. OLD G-prefixed reader: ${oldOn446} leg lines (0, because `
  + `446 names its own legs H1–H5). CURED lib reader: ${newOn446} rows. Had 446 ever been pointed `
  + `at its own output it would have called itself dead; his §4 named exactly this file first. `
  + `Nothing else varies between the two numbers, which is what B5's 7 → 11 cannot say`);

// ── B8 — the Round 450 guard had killed 446 outright, and the attribution is driven ─────────────
//
// Found while driving B5: 446 exited non-zero publishing NOTHING. The cause is not Round 452. It
// harvested the three token spellings by calling `renderRows` with three rows sharing the id `x`,
// purely as a vocabulary lookup, and Round 450 — MY round — gave `renderRowSet` a round-trip
// closure guard whose refusals include `DUPLICATE_ROW_ID`. From that commit on, 446 threw.
//
// Attribution is driven, not argued: the PINNED pre-round 446 source is written to a scratch
// sibling (same directory, so `../lib/verdict.mjs` resolves at the same depth — 418) and run. If
// it throws the same way, the breakage predates every edit in this round.
const SCRATCH = join(REPO, 'docs/research/round446-instruments/.scratch452-pinned.mjs');
let pinnedRun = { rc: null, text: '' };
try {
  execFileSync('git', ['show', `${PRE_ROUND_REV}:${R446_REL}`], { encoding: 'utf8' });
  execFileSync('sh', ['-c', `git show ${PRE_ROUND_REV}:${R446_REL} > ${JSON.stringify(SCRATCH)}`],
    { cwd: REPO, encoding: 'utf8' });
  pinnedRun = driveFile(SCRATCH);
} catch (e) { pinnedRun = { rc: 'SETUP FAILED', text: String(e.message).slice(0, 80) }; }
const pinnedThrew = /DUPLICATE_ROW_ID/.test(pinnedRun.text);
const pinnedPublishedNothing = readVerdict(pinnedRun.text).ok !== true;
leg('B8', pinnedThrew && pinnedPublishedNothing && ranAtAll,
  `ROUND 450's DUPLICATE_ROW_ID GUARD — MINE — HAD KILLED ROUND 446 OUTRIGHT, AND THE REPAIR IS `
  + `NOT TO LOOSEN THE GUARD. 446 asked a RENDERER for a vocabulary: `
  + `renderRows([{id:'x'},{id:'x'},{id:'x'}]), three rows sharing one id, scraped for their token `
  + `spellings. Round 450 gave renderRowSet a round-trip closure guard, DUPLICATE_ROW_ID is one of `
  + `its refusals, and from that commit 446 exited non-zero with no verdict line and no rows. `
  + `ATTRIBUTION, DRIVEN: the PINNED pre-round 446 source run at the same depth throws `
  + `DUPLICATE_ROW_ID: ${pinnedThrew} · and publishes no readable verdict: `
  + `${pinnedPublishedNothing} · while the cured file reaches a verdict: ${ranAtAll}. So this `
  + `predates Round 452. It went unnoticed because nothing re-drives 446 — the guard and its `
  + `victim were in one repo and never run together until his §4 sent me back to this call site `
  + `for an unrelated reason. Fixed by reading the exported LEG_TOKENS table instead`);
try { execFileSync('rm', ['-f', SCRATCH]); } catch { /* the scratch is best-effort cleanup */ }

// ── B6 — the lib's own self-test still passes, and the legacy branch's ambiguity is now written down
const libSrc = readFileSync(join(REPO, 'docs/research/lib/verdict.mjs'), 'utf8');
const documented = /TABLE/.test(libSrc) && /cannot distinguish a leg row from a table cell/.test(libSrc);
let selfTestOk = null;
try {
  const mod = await import('../lib/verdict.mjs');
  selfTestOk = mod.selfTest() === true;
} catch (e) { selfTestOk = `THREW ${e.message.slice(0, 60)}`; }
leg('B6', selfTestOk === true && documented,
  `THE LIB'S SELF-TEST PASSES AND THE LEGACY BRANCH'S THREE-WAY AMBIGUITY IS NOW IN THE FILE, so `
  + `the next caller cannot read \`rows\` as "rows with ids" the way 446 and 448 both did. `
  + `selfTest() === true: ${selfTestOk} · the ambiguity documented at the branch: ${documented}. `
  + `A1 proves a tighter class is not the repair, so the repair is making the uncertainty visible `
  + `where a caller will hit it (399 — publish the refusal rather than guess)`);

// ── Tail ────────────────────────────────────────────────────────────────────────────────────────
console.log(renderTail({ legs, preds }));
console.log('');
console.log(`     population rev ${PRE_ROUND_REV.slice(0, 8)} (literal) · HEAD = ${git(['rev-parse', '--short', 'HEAD']).trim()}`);
console.log(`     ${outsAll.length} committed .out · ${rows.length} legacy-branch rows · ${byId.size} distinct ids, all ${Object.keys(HAND).length} hand-read`);
console.log(`     P1 ${P1_TEXT} — ${nTable > nProse ? 'LANDED' : 'REFUTED'} (TABLE=${nTable} PROSE=${nProse})`);
console.log(`     P2 ${P2_TEXT} — ${countsMoved && verdictHeld ? 'LANDED' : 'REFUTED'}`);
