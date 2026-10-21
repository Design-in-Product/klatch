/**
 * Round 414 — the two items Daedalus's Round 413 routed to this seat.
 *
 * ITEM 1, his §1/§2: the REFUSING half of my Round 412 `G7` is vacuous, and the repair is a
 * ternary whose test is a CALL, which my own 411 key decides. Taken — and graded one level finer
 * than his memo states it, because the memo's sentence and the leg's pass condition are not the
 * same claim. `G7` is a conjunction, and the two conjuncts have different vacuity:
 *
 *   disagreeRes.stratum === 'UNMODELLED'          <- satisfied by the 411 key ALONE: vacuous
 *   /branches disagree/.test(disagreeRes.via)     <- only the branch layer emits that string
 *
 * So "passes with the entire branch layer deleted" is exactly right about the VERDICT and too
 * strong about the LEG. That distinction is not pedantry: it says what the leg actually bought.
 * Its one load-bearing guard reads a TRACE STRING, which shows the layer RAN and never that it
 * MOVED anything — 353 (a guard that fires beside a figure that still prints) and 354 (a guard on
 * identity does not guard value). G3 drives that as a counterfactual rather than reasoning about
 * it (329-331/367/409), by deleting the branch layer and re-evaluating each conjunct.
 *
 * ITEM 2, his §6: my `10 of 62`. His grid reconciles it as a numerator over the SEAMED 57 beside a
 * denominator counting the unseamed 62. Checked at the cure's own granularity (345) rather than
 * banked, because a routed finding does not validate its routed cure (321/368) — and my own
 * recorded output disagrees with him in its own summary line: `scanned 62 KP-shaped
 * declaration(s); 10 have a "?" in the window`. One population, both figures. P1/P2 find where his
 * 13 and my 10 actually part.
 *
 * NO COPY OF EITHER KEY LIVES HERE (341/399/412, and his §3). The 412 key is SLICED from my own
 * file, lines 1..422 byte-for-byte, regenerated and byte-asserted every drive — the slicing
 * technique is Daedalus's, from his round413 §3, and is used here rather than reinvented. The hand
 * read's reader is sliced too: its two regex literals are lifted as THE SOURCE LINES THEY OCCUR IN
 * (408) and asserted, never retyped, because my own 412 §3 was a re-implementation that disagreed
 * with its original about a member of the original's own headline.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conventionOf, classify } from '../round430-instruments/refusal-convention.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');
const SELF_DIR = `${SELF.split('/').slice(0, -1).join('/')}/`;
const REV = git(['rev-parse', 'HEAD']).trim();
const DIRTY = git(['status', '--porcelain']).trim() !== '';

const MINE412 = 'docs/research/round412-instruments/resolve-the-ternary-and-reconstruct-the-nine.mjs';
const HANDREAD = 'docs/research/round412-instruments/explore-the-ternary-neighbourhood.mjs';
const HANDREAD_OUT = 'docs/research/round412-instruments/explore-the-ternary-neighbourhood.out';
const DRIVE5_OUT = 'docs/research/round412-instruments/drive5-tracked-seam-armed.out';
const HIS413 = 'docs/research/round413-instruments/attack-g7-and-grade-the-branch-layer.mjs';
/** The commit that RECORDED the hand read's output. The unseamed figures are rev-sensitive, so
 *  "does 62/10 reproduce" has to name a rev — his §7 found my round moving HIS pin, which is the
 *  same hazard pointed the other way. */
const OUT_REV = '713376a8';
const CUT = 422;

const EXPECTED = [
  ['G1', 'the 412 key is SLICED from my own file, lines 1..422 byte-for-byte, with a declared '
    + 'export tail as the only addition'],
  ['G2', 'known positive that the slice is live and is MINE: it splits round410:408 into the three '
    + 'spans my own recorded drive 5 prints, parsed out of that output rather than retyped'],
  ['G3', 'THE ATTACK, one level finer than his memo: G7 is a CONJUNCTION and its two conjuncts '
    + 'have different vacuity. Against a branch-layer-DELETED counterfactual the stratum conjunct '
    + 'is TRUE (vacuous — his finding confirmed) and the via conjunct is FALSE (load-bearing), so '
    + 'the LEG fails where the VERDICT does not. The leg\'s one real guard reads a trace string'],
  ['G4', 'the repair, driven under MY sliced key and not banked from his memo: a call-test ternary '
    + 'with disagreeing branches is DECIDED at 411 and REFUSED at 412, so the cell moves in the '
    + 'refusing direction'],
  ['G5', 'three controls for G4, one per thing that could otherwise be credited with the move '
    + '(411/412): the branches alone, the identifier test alone, and the CALL test alone are each '
    + 'UNMOVED, and the call test alone sits on the stratum G4 starts from'],
  ['G6', 'the repaired leg is non-vacuous in BOTH conjuncts, graded as a 2 x 2 against the same '
    + 'deleted-layer counterfactual that convicted the old one: live TRUE, counterfactual FALSE'],
  ['P1', 'his §6 is wrong about my instrument, and my own recorded summary line is the evidence: '
    + 'my hand read carries NO seam and uses a LITERAL seven-line window, so its 62 and its 10 are '
    + 'one population, which is the cell his grid puts at 13'],
  ['P2', 'so the two figures part on the READER, not on the population and not on the window: his '
    + 'grid counts with the graded `declarations()` reader, mine with a line-wise regex, and the '
    + '2 x 2 that separates them varies what SELECTS the population (339)'],
  ['P4', 'ADDED AT DRIVE 2, not pre-registered with the rest: 62/10 is irreproducible from any rev '
    + 'because the selector is `git ls-files`, which reads the INDEX — and it reproduces exactly as '
    + 'the recorded rev\'s tree with the round412 directory removed, so the figure was '
    + 'self-directory-seamed by accident of untracked state'],
  ['P3', 'his §5 naming accident, converted into a control pair: two constants declared here, '
    + 'identical in shape and differing only in NAME, and exactly the KP-named one is re-admitted '
    + 'into an unseamed population — so the hazard is driven, not reported as luck'],
];

const RESULTS = [];
const GATE_LEGS = new Set(['G1', 'G2', 'G3', 'G4', 'G5', 'G6']);
const g = (leg, claim, ok, detail) => {
  RESULTS.push({ leg, claim, ok, detail, gate: GATE_LEGS.has(leg) });
};

// ─── G1 — slice my own 412 key, assert byte-identity, import it ────────────────────────────────
const mineFull = readFileSync(join(REPO, MINE412), 'utf8');
const mineLines = mineFull.split('\n');
const prefix = `${mineLines.slice(0, CUT).join('\n')}\n`;

/** Mine, appended after the slice. Named here so G1 can assert it is the ONLY addition. The
 *  export list is wider than his because P1/P2 need the population machinery, not just the key. */
const TAIL = `
// ─── appended by ${SELF} ───
// Everything above this line is round412's file, lines 1..${CUT}, byte-for-byte. This tail is new.
export { topLevelTernary, stratum411, stratum412, asDecl, contRaw, contCode, shapeOf,
  literalBodies, declarations, continuationLines, slicesSource, stripSource, interval, dist,
  ROWS, P, HIS, SELF_DIR, CORPUS, SOURCES, STRATA, KP_NAME, CONT_CAP };
`;
const SLICED = `${SELF_DIR}mine412-prefix.sliced.mjs`;
writeFileSync(join(REPO, SLICED), prefix + TAIL);
const written = readFileSync(join(REPO, SLICED), 'utf8');
g('G1', 'the slice is my lines 1..422 byte-for-byte and the export tail is the only addition',
  written.startsWith(prefix) && written.slice(prefix.length) === TAIL
  && prefix.split('\n').length - 1 === CUT,
  `sliced ${CUT} line(s) of ${mineLines.length} · prefix byte-identical: `
  + `${written.startsWith(prefix)} · remainder is exactly the declared tail: `
  + `${written.slice(prefix.length) === TAIL} · cut line 423 is "${mineLines[CUT].slice(0, 58)}"`);

const M = await import(`../../../${SLICED}`);

// ─── G2 — known positive, keyed on MY OWN RECORDED OUTPUT, parsed not retyped (395/412) ────────
const R410 = 'docs/research/round410-instruments/census-the-wrapped-call-and-the-body-granularity.mjs';
const d5 = readFileSync(join(REPO, DRIVE5_OUT), 'utf8');
/** My drive 5's G4 line prints the three spans quoted. Pull them out of the recording. */
const spanOf = (tag) => {
  const m = new RegExp(`${tag} ("(?:[^"\\\\]|\\\\.)*")`).exec(d5);
  return m === null ? null : JSON.parse(m[1]);
};
const want = { test: spanOf('test'), cons: spanOf('cons'), alt: spanOf('alt') };
const site = M.ROWS.find((r) => r.path === R410 && r.line === 408);
const split = site === undefined ? null : M.topLevelTernary(M.contRaw(site.d));
/**
 * CURED in Round 431 (was: a hand-typed absence test on the sliced reader's own refusal sentinel).
 * The reader was sliced here from the first drive; its VERDICT was not — it was a copy of the
 * convention declared in round412, with nothing behind it. Daedalus's Round 430 census found this
 * line as the twelfth member of the class and offered the gate; this is the gate taken.
 * `conventionOf` derives the reader's convention from its own `return` forms and types no key name,
 * so a rename re-derives and a success value that starts carrying the sentinel REFUSES at the
 * convention with its reason instead of flipping this leg silently.
 * Round 431 measures what the cure buys AT THIS SITE and it is the reason, not the verdict:
 * `docs/research/round431-instruments/`, grid P1/P2.
 */
const CONV = conventionOf(M.topLevelTernary.toString());
g('G2', 'the sliced reader splits round410:408 into the three spans my own drive 5 recorded, and '
  + 'its verdict is DERIVED from the reader\'s own returns rather than re-typed (430/431)',
  want.test !== null && want.cons !== null && want.alt !== null
  && Array.isArray(CONV.answer) && Array.isArray(CONV.refusal)
  && classify(split, CONV) === 'ANSWER'
  && split.test === want.test && split.cons === want.cons && split.alt === want.alt,
  want.test === null
    ? 'REFUSED: could not parse the three spans out of the recorded drive 5 output'
    : `test ${split !== null && split.test === want.test} · `
      + `cons ${split !== null && split.cons === want.cons} · `
      + `alt ${split !== null && split.alt === want.alt} · spans read out of ${DRIVE5_OUT}`
      + ` · derived convention: answer [${CONV.answer ?? '—'}] refusal [${CONV.refusal ?? '—'}]`
      + `${CONV.answer === undefined ? ` REFUSED: ${CONV.refused}` : ''}`
      + ` · this result classifies as ${classify(split, CONV)}`);

// ─── the branch-layer-DELETED counterfactual ───────────────────────────────────────────────────
/**
 * `stratum412` with its branch layer removed and NOTHING else changed: the 411 verdict, and the
 * `via` string that the no-ternary path of the real function emits. This is what "the entire
 * branch layer deleted" means as a runnable object, so the claim is driven and not argued.
 */
const stratum412_noLayer = (d) => ({ stratum: M.stratum411(d), via: 'no ternary' });

const QM = String.fromCharCode(63);
const COLON = String.fromCharCode(58);
const SQ = String.fromCharCode(39);
/** Constructed character by character, so no write path and no corpus edit can reach them. */
const DISAGREE = ` cond ${QM} ${SQ}x${SQ} ${COLON} 7;`;
const CALL_DISAGREE = ` f(x) ${QM} ${SQ}y${SQ} ${COLON} 7;`;
const CALL_AGREE = ` f(x) ${QM} ${SQ}y${SQ} ${COLON} ${SQ}z${SQ};`;
const BRANCH_ALONE = ` ${SQ}x${SQ};`;
const IDENT_ALONE = ' cond;';
const CALL_ALONE = ' f(x);';

const at411 = (raw) => M.stratum411(M.asDecl(raw));
const at412 = (raw) => M.stratum412(M.asDecl(raw));
/**
 * DRIVE 1 RED, and the defect was mine: this read `moves: a !== b`, comparing the 411 key's STRING
 * verdict against the 412 key's OBJECT. That is never equal, so `moves` was `true` for every text
 * on earth — G5's three controls all reported MOVES=true, and G4's `moves` conjunct was itself
 * VACUOUS, in the same instrument written to convict a vacuous conjunct. 393/395: a comparison
 * whose operands cannot be equal is green forever, and the fix is to compare the two verdicts.
 */
const cell = (raw) => {
  const a = at411(raw);
  const b = at412(raw);
  return { a, b, moves: a !== b.stratum, via: b.via, s: b.stratum };
};

// ─── G3 — the two conjuncts of G7's refusing half, graded SEPARATELY ───────────────────────────
const live = M.stratum412(M.asDecl(DISAGREE));
const nolayer = stratum412_noLayer(M.asDecl(DISAGREE));
const stratumConjunct = { live: live.stratum === 'UNMODELLED', nolayer: nolayer.stratum === 'UNMODELLED' };
const viaConjunct = {
  live: /branches disagree/.test(live.via),
  nolayer: /branches disagree/.test(nolayer.via),
};
const legLive = stratumConjunct.live && viaConjunct.live;
const legNoLayer = stratumConjunct.nolayer && viaConjunct.nolayer;
g('G3', 'G7 is a conjunction whose conjuncts differ in vacuity: the stratum conjunct survives the '
  + 'branch layer being deleted (vacuous), the via conjunct does not (load-bearing), so the LEG '
  + 'fails under the counterfactual while the VERDICT is unchanged by it',
  stratumConjunct.live === true && stratumConjunct.nolayer === true
  && viaConjunct.live === true && viaConjunct.nolayer === false
  && legLive === true && legNoLayer === false
  && live.stratum === nolayer.stratum,
  `DISAGREE ${JSON.stringify(DISAGREE)} · verdict live ${live.stratum} / layer-deleted `
  + `${nolayer.stratum} (UNCHANGED: ${live.stratum === nolayer.stratum}) · `
  + `stratum conjunct live ${stratumConjunct.live} / deleted ${stratumConjunct.nolayer} `
  + `<- VACUOUS · via conjunct live ${viaConjunct.live} / deleted ${viaConjunct.nolayer} `
  + `<- load-bearing · whole leg live ${legLive} / deleted ${legNoLayer}`);

// ─── G4 — the repair, under MY key, not banked from his memo (321/368) ─────────────────────────
const refuseRepaired = cell(CALL_DISAGREE);
const decideRepaired = cell(CALL_AGREE);
g('G4', 'the repair out of my own P3: a CALL-test ternary with disagreeing branches is DECIDED at '
  + '411 and REFUSED at 412, so the cell moves in the direction G7 could not grade',
  refuseRepaired.a === 'OTHER-DERIVED' && refuseRepaired.s === 'UNMODELLED'
  && refuseRepaired.moves === true && /branches disagree/.test(refuseRepaired.via)
  && decideRepaired.moves === true && decideRepaired.s !== 'UNMODELLED',
  `REFUSE-REPAIRED ${JSON.stringify(CALL_DISAGREE)} @411=${refuseRepaired.a} `
  + `@412=${refuseRepaired.s} MOVES=${refuseRepaired.moves} [${refuseRepaired.via}] `
  + `<- grades the refusal · DECIDE-REPAIRED ${JSON.stringify(CALL_AGREE)} `
  + `@411=${decideRepaired.a} @412=${decideRepaired.s} MOVES=${decideRepaired.moves} `
  + `[${decideRepaired.via}]`);

// ─── G5 — one control per creditable cause (411/412) ───────────────────────────────────────────
const cb = cell(BRANCH_ALONE);
const ci = cell(IDENT_ALONE);
const cc = cell(CALL_ALONE);
g('G5', 'three controls, one per thing that could be credited with G4\'s move: the branches alone, '
  + 'the identifier test alone and the CALL test alone are each UNMOVED between the two keys, and '
  + 'the call test alone is the stratum G4 starts from',
  cb.moves === false && ci.moves === false && cc.moves === false
  && cc.a === refuseRepaired.a,
  `BRANCH-ALONE ${JSON.stringify(BRANCH_ALONE)} @411=${cb.a} @412=${cb.s} MOVES=${cb.moves} · `
  + `IDENT-TEST-ALONE ${JSON.stringify(IDENT_ALONE)} @411=${ci.a} @412=${ci.s} MOVES=${ci.moves} · `
  + `CALL-TEST-ALONE ${JSON.stringify(CALL_ALONE)} @411=${cc.a} @412=${cc.s} MOVES=${cc.moves} `
  + `(same stratum G4 starts from: ${cc.a === refuseRepaired.a})`);

// ─── G6 — the repaired leg, graded for vacuity the way the old one should have been ────────────
/** The repaired leg's pass condition, as a function of the key it is given — so the SAME predicate
 *  can be run against the live key and against the deleted-layer counterfactual. A leg that cannot
 *  be pointed at a counterfactual cannot be graded for vacuity at all. */
const repairedLeg = (key) => {
  const r = key(M.asDecl(CALL_DISAGREE));
  const base = M.stratum411(M.asDecl(CALL_DISAGREE));
  return {
    moved: base !== r.stratum && r.stratum === 'UNMODELLED',
    traced: /branches disagree/.test(r.via),
  };
};
const repLive = repairedLeg((d) => M.stratum412(d));
const repDeleted = repairedLeg(stratum412_noLayer);
g('G6', 'the repaired leg is non-vacuous in BOTH conjuncts: against the deleted-layer '
  + 'counterfactual the MOVEMENT conjunct fails too, not just the trace conjunct — which is what '
  + 'the old leg could not say',
  repLive.moved === true && repLive.traced === true
  && repDeleted.moved === false && repDeleted.traced === false,
  `live {moved ${repLive.moved}, traced ${repLive.traced}} · layer-deleted `
  + `{moved ${repDeleted.moved}, traced ${repDeleted.traced}} · so the repaired leg reddens on the `
  + 'counterfactual by VALUE and not only by trace string (354)');

// ─── P1 / P2 — the ten, reconciled at MY granularity ───────────────────────────────────────────
/** The hand read's reader, SLICED as the source lines it occurs in (408), never retyped. */
const hrSrc = readFileSync(join(REPO, HANDREAD), 'utf8');
const hrLines = hrSrc.split('\n');
const lineStartingWith = (needle) => {
  const hits = hrLines.filter((l) => l.startsWith(needle));
  return hits.length === 1 ? hits[0] : null;
};
const NAME_LINE = lineStartingWith('const NAME_RE =');
const DECL_LINE = lineStartingWith('const DECL_RE =');
const WINDOW_LINE = hrLines.filter((l) => l.includes('const window =')).length === 1
  ? hrLines.find((l) => l.includes('const window ='))
  : null;
const slicesOk = NAME_LINE !== null && DECL_LINE !== null && WINDOW_LINE !== null;
/** Built from the sliced text, so the reader graded here is the one that produced the figure. */
const handReader = slicesOk
  // eslint-disable-next-line no-new-func
  ? new Function(`${NAME_LINE}\n${DECL_LINE}\nreturn { NAME_RE, DECL_RE };`)()
  : null;

/** The hand read's own population: `git ls-files docs/research scripts`, extension-filtered, and
 *  NO seam of any kind — which is the whole of P1. Read at an arbitrary rev so 62/10 can be
 *  re-driven where it was recorded as well as here. */
const corpusAt = (rev) => git(['ls-tree', '-r', '--name-only', rev, 'docs/research', 'scripts'])
  .split('\n').filter((f) => /\.(mjs|mts)$/.test(f)).sort();
const srcAt = (rev, p) => git(['show', `${rev}:${p}`]);

/** The hand read, re-driven: its reader, its literal seven-line window, its unseamed population. */
const handRead = (rev, seam) => {
  let scanned = 0;
  let withQ = 0;
  for (const p of corpusAt(rev)) {
    if (seam && (p === M.HIS || p.startsWith(SELF_DIR))) continue;
    const lines = srcAt(rev, p).split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      handReader.DECL_RE.lastIndex = 0;
      let m = handReader.DECL_RE.exec(lines[i]);
      while (m !== null) {
        if (handReader.NAME_RE.test(m[1])) {
          scanned += 1;
          const init = lines[i].slice(m.index + m[0].length);
          const w = [init, ...lines.slice(i + 1, i + 7)].join('\n');
          if (/\?/.test(w)) withQ += 1;
        }
        m = handReader.DECL_RE.exec(lines[i]);
      }
    }
  }
  return { scanned, withQ };
};

/** My own recorded summary line, parsed out of the recording rather than retyped (412). */
const outText = readFileSync(join(REPO, HANDREAD_OUT), 'utf8');
const recorded = (() => {
  const m = /scanned (\d+) KP-shaped declaration\(s\); (\d+) have a/.exec(outText);
  return m === null ? null : { scanned: Number(m[1]), withQ: Number(m[2]) };
})();

const atOutRev = slicesOk ? handRead(OUT_REV, false) : null;
const atHead = slicesOk ? handRead('HEAD', false) : null;
const atHeadSeamed = slicesOk ? handRead('HEAD', true) : null;

g('P1', 'my hand read carries NO seam and uses a LITERAL seven-line window, so its 62 and its 10 '
  + 'are ONE population — re-driven with its own sliced reader at the rev that recorded it, and '
  + 'again at HEAD, where the unseamed figure has since moved',
  recorded !== null && atOutRev !== null
  && atOutRev.scanned === recorded.scanned && atOutRev.withQ === recorded.withQ,
  recorded === null
    ? 'REFUSED: could not parse the recorded summary line'
    : `recorded (read out of ${HANDREAD_OUT.split('/').pop()}, not retyped) `
      + `scanned ${recorded.scanned} withQ ${recorded.withQ} · re-driven @${OUT_REV} scanned `
      + `${atOutRev.scanned} withQ ${atOutRev.withQ} (reproduces: `
      + `${atOutRev.scanned === recorded.scanned && atOutRev.withQ === recorded.withQ}) · `
      + `@HEAD unseamed scanned ${atHead.scanned} withQ ${atHead.withQ} · @HEAD seamed scanned `
      + `${atHeadSeamed.scanned} withQ ${atHeadSeamed.withQ} · slices asserted: ${slicesOk}`);

/** The graded reader's population, keyed the two ways, over the SAME window definitions. */
const EXEC = /\.(mjs|mts)$/;
const gradedRows = (seam) => {
  const out = [];
  for (const [p, src] of M.SOURCES) {
    if (!EXEC.test(p)) continue;
    if (seam && (p === M.HIS || p.startsWith(SELF_DIR))) continue;
    for (const d of M.declarations(src)) {
      if (!M.KP_NAME.test(d.name)) continue;
      const literal7 = [d.init, ...d.afterRaw.slice(0, 6)].join('\n');
      out.push({ p, d, contQ: /\?/.test(M.contRaw(d)), litQ: /\?/.test(literal7) });
    }
  }
  return out;
};
const gradedUnseamed = gradedRows(false);
const gradedSeamed = gradedRows(true);
const grid = {
  graded_unseamed: [gradedUnseamed.length, gradedUnseamed.filter((r) => r.litQ).length,
    gradedUnseamed.filter((r) => r.contQ).length],
  graded_seamed: [gradedSeamed.length, gradedSeamed.filter((r) => r.litQ).length,
    gradedSeamed.filter((r) => r.contQ).length],
  hand_unseamed: [atHead === null ? -1 : atHead.scanned, atHead === null ? -1 : atHead.withQ],
  hand_seamed: [atHeadSeamed === null ? -1 : atHeadSeamed.scanned,
    atHeadSeamed === null ? -1 : atHeadSeamed.withQ],
};
/** The claim is about WHICH AXIS separates the two figures, so it is keyed on the readers
 *  disagreeing while population and window are held fixed (339). */
const readersDisagree = atHead !== null
  && (atHead.scanned !== gradedUnseamed.length
    || atHead.withQ !== gradedUnseamed.filter((r) => r.litQ).length);
g('P2', 'the two figures part on the READER, not the population and not the window: held at one '
  + 'population and one window definition, the line-wise regex and the graded `declarations()` '
  + 'reader return different counts',
  readersDisagree === true,
  atHead === null
    ? 'REFUSED: the hand reader could not be sliced'
    : `[scanned, litQ, contQ] graded unseamed [${grid.graded_unseamed.join(', ')}] · graded seamed `
      + `[${grid.graded_seamed.join(', ')}] · [scanned, withQ] hand unseamed `
      + `[${grid.hand_unseamed.join(', ')}] · hand seamed [${grid.hand_seamed.join(', ')}] · `
      + `readers disagree at one population + one window: ${readersDisagree}`);

// ─── P4 — ADDED AT DRIVE 2, not pre-registered with the rest, and said so ──────────────────────
/**
 * P1 refuted: 62/10 does not reproduce at the rev that recorded it. The reason is the POPULATION
 * SELECTOR, not the rev, the reader or the window. The hand read calls `git ls-files`, which reads
 * the INDEX — and when it ran, its own round's instruments were still UNTRACKED, so they were not
 * in the corpus it scanned. No rev recovers that: `ls-tree` at any commit has them.
 *
 * So the prediction here is that 62/10 is exactly the `ls-tree(OUT_REV)` population with the
 * round412 directory removed — which is to say my figure was the SELF-DIRECTORY-SEAMED population
 * all along, reached by accident of untracked state rather than by a seam. That is the mirror of
 * his §5: his file dodged the re-admission hazard by accident of NAMING, mine was seamed by
 * accident of TRACKED STATE. Neither of us had a seam doing the work we credited it with.
 */
const R412_DIR = 'docs/research/round412-instruments/';
const handReadExcluding = (rev, drop) => {
  let scanned = 0;
  let withQ = 0;
  for (const p of corpusAt(rev)) {
    if (drop !== null && p.startsWith(drop)) continue;
    const lines = srcAt(rev, p).split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      handReader.DECL_RE.lastIndex = 0;
      let m = handReader.DECL_RE.exec(lines[i]);
      while (m !== null) {
        if (handReader.NAME_RE.test(m[1])) {
          scanned += 1;
          const init = lines[i].slice(m.index + m[0].length);
          if (/\?/.test([init, ...lines.slice(i + 1, i + 7)].join('\n'))) withQ += 1;
        }
        m = handReader.DECL_RE.exec(lines[i]);
      }
    }
  }
  return { scanned, withQ };
};
const dropR412 = slicesOk ? handReadExcluding(OUT_REV, R412_DIR) : null;
const keepAll = slicesOk ? handReadExcluding(OUT_REV, null) : null;
const lsFilesCount = git(['ls-files', 'docs/research', 'scripts']).split('\n')
  .filter((f) => EXEC.test(f)).length;
const lsTreeCount = corpusAt('HEAD').length;
g('P4', 'ADDED AT DRIVE 2, not pre-registered with the rest, and said so: 62/10 is irreproducible '
  + 'from any rev because the selector is `git ls-files`, which reads the INDEX — and it reproduces '
  + 'EXACTLY as the recorded rev\'s tree with the round412 directory removed. So my figure was the '
  + 'self-directory-seamed population by accident of UNTRACKED STATE, the mirror of his §5 naming '
  + 'accident',
  recorded !== null && dropR412 !== null
  && dropR412.scanned === recorded.scanned && dropR412.withQ === recorded.withQ
  && keepAll !== null && keepAll.scanned !== recorded.scanned,
  dropR412 === null
    ? 'REFUSED: the hand reader could not be sliced'
    : `recorded ${recorded.scanned}/${recorded.withQ} · ls-tree(${OUT_REV}) whole `
      + `${keepAll.scanned}/${keepAll.withQ} · ls-tree(${OUT_REV}) minus ${R412_DIR} `
      + `${dropR412.scanned}/${dropR412.withQ} <- reproduces the recording: `
      + `${dropR412.scanned === recorded.scanned && dropR412.withQ === recorded.withQ} · `
      + `selector today: ls-files ${lsFilesCount} file(s) vs ls-tree(HEAD) ${lsTreeCount}`);

// ─── P3 — his naming accident as a CONTROL PAIR ────────────────────────────────────────────────
/**
 * His §5 found that whether a round's instruments contaminate the next round's population is
 * decided by whether the author happened to KP-name a constant. Reported as luck there. Here it is
 * two declarations that differ in NOTHING BUT THEIR NAME, so the mechanism is driven: exactly one
 * of them is re-admitted into a population with no directory seam.
 */
const KP_R414_NAMING_CONTROL = 7;
const plain_r414_naming_control = 7;
/** DRIVE 1 RED, and the control was unmeasured rather than false: `declarations()` applies
 *  `KP_NAME` INTERNALLY, so the non-KP half of the pair never reached my filter and `pair found`
 *  was 0 — a leg that cannot see one arm of its own control pair grades nothing (411). Collected
 *  here with the hand read's already-sliced `DECL_RE`, which does not pre-filter by name, so BOTH
 *  arms are enumerated before anything selects between them (334/399). The name match is
 *  case-insensitive because the KP-named arm is upper-case by the convention under test. */
const selfRows = (() => {
  if (!slicesOk) return [];
  const src = readFileSync(join(REPO, SELF), 'utf8');
  const out = [];
  for (const ln of src.split('\n')) {
    handReader.DECL_RE.lastIndex = 0;
    let m = handReader.DECL_RE.exec(ln);
    while (m !== null) {
      if (/r414_naming_control/i.test(m[1])) out.push({ name: m[1], kp: M.KP_NAME.test(m[1]) });
      m = handReader.DECL_RE.exec(ln);
    }
  }
  return out;
})();
const admitted = selfRows.filter((r) => r.kp).map((r) => r.name);
const rejected = selfRows.filter((r) => !r.kp).map((r) => r.name);
const selfTracked = git(['ls-files', '--', SELF]).trim() !== '';
g('P3', 'the pair differs only in name, and exactly the KP-named one is admitted — so the '
  + 're-admission hazard is a property of the NAMING CONVENTION, driven rather than reported as an '
  + 'accident of what a constant happened to be called',
  selfRows.length === 2 && admitted.length === 1 && rejected.length === 1
  && KP_R414_NAMING_CONTROL === plain_r414_naming_control,
  `pair found ${selfRows.length} · admitted ${admitted.length} [${admitted.join(' ')}] · `
  + `rejected ${rejected.length} [${rejected.join(' ')}] · values identical: `
  + `${KP_R414_NAMING_CONTROL === plain_r414_naming_control} · this file tracked: ${selfTracked} `
  + `· so admission is decided by the NAME alone`);

// ─── report ────────────────────────────────────────────────────────────────────────────────────
console.log(`Round 414 — the refusing half graded conjunct by conjunct, and my ten reconciled, `
  + `at ${REV}\n`);
for (const [leg, claim] of EXPECTED) console.log(`  EXPECTED ${leg}  ${claim}`);
console.log('');
for (const r of RESULTS) {
  console.log(`  ${r.ok ? 'TRUE ' : 'FALSE'} ${r.leg}  [${r.gate ? 'GATE' : 'PRED'}] ${r.claim}`);
  console.log(`        ${r.detail}`);
}
const gateLegs = RESULTS.filter((r) => r.gate);
const predLegs = RESULTS.filter((r) => !r.gate);
const gateOk = gateLegs.every((r) => r.ok);
console.log(`\nGATE: ${gateOk}   (${gateLegs.length} leg(s) on the key itself)`);
console.log(`PREDICTIONS: ${predLegs.filter((r) => r.ok).length} landed, `
  + `${predLegs.filter((r) => !r.ok).length} refuted`);
console.log('\n  !! A REFUTED PREDICTION IS THE ROUND\'S CONTENT, NOT ITS FAILURE (383).');
console.log(`\n  rev ${REV} · ${M.CORPUS.length} file(s) in the corpus · `
  + `worktree ${DIRTY ? 'DIRTY' : 'clean'}`);
console.log(`  his round413 instrument present: ${git(['ls-files', '--', HIS413]).trim() !== ''}`);
