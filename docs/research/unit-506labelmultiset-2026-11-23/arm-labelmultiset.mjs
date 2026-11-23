#!/usr/bin/env node
/**
 * unit-506labelmultiset — P1 … P5.
 *
 * Three stale-limb cells in ONE synthetic repository, driven in one pass, so the byte-count
 * collision below is a within-harness comparison rather than a cross-unit one:
 *
 *   cell               tracked            baseline      renders            form says
 *   F-MARKED-GUARDED   M1 (decl), G1      [M1, G1]      MARKED + GUARDED    358 B / 6 L  <- untried
 *   F-GUARDED-ABSENT   G1                 [G1, A01]     GUARDED + ABSENT    358 B / 6 L
 *   F-MARKED-ABSENT    M1 (decl)          [M1, A01]     MARKED + ABSENT     357 B / 6 L
 *
 * The harness shape is `unit-503` (Theseus) by way of `unit-504` (this seat): a `sha256`-asserted
 * byte-identical gate copy in its own repository under a `git check-ignore`-asserted scratch path.
 * Stated as a limit in the pre-registration rather than discovered afterwards: the two cells that
 * reproduce D-MIXED and E-MARKED-ABSENT are SAME-SHAPE, different-instance reproductions, so they
 * catch a per-instance construction error and cannot catch an error in the shape all three units
 * share.
 *
 * Every path is pinned to 40 characters and asserted, so every figure is comparable to B1, C-*,
 * D-* and E-*.
 *
 * TWO READERS, and the difference between them is the point. Both consume the SAME captured
 * stderr text:
 *
 *   - EQUALITY: capture the label with `^\s+(\S+)\s+-> now <bt>([A-Z]+)<bt>$` and compare with
 *     `===`. This is Theseus's `unit-505` §1 cure, and it is the move this seat's own
 *     `posthoc-reachable-labels-anchored.mjs` made after P1.c went blind on 11-22.
 *   - CONTAINMENT: `VOCAB.filter((v) => line.includes(v))` — the defect shape, kept as a live
 *     comparison arm rather than described.
 *
 * Nothing below is typed where it could be sliced. The emitter template, the `stale` filter's
 * excluded verdict, and the vocabulary's own containment relation are all read out of the gate's
 * source by anchoring on statement text. The known positive for the reader key is RENDERED by the
 * gate's own template with a verdict bound, not hand-written to look like gate output.
 *
 * Hygiene: the exemption key, the guard keys and the population key are assembled at runtime and
 * appear contiguously nowhere in this file — not in a string, not in a comment, not in a regex.
 * No tracked file in the real repository is written. The gate copy is `sha256`-asserted before
 * every drive.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync,
} from 'node:fs';
import { resolve, join } from 'node:path';

const UNIT = import.meta.dirname;
const ROOT = resolve(UNIT, '../../..');
const GATE_REL = 'scripts/verify-decl-body-slicers.mjs';
const BASE_REL = 'scripts/decl-body-slicers.baseline';
const SYN = join(UNIT, 'scratch', 'syn');
const CAP = join(UNIT, 'captures');

const sha = (b) => createHash('sha256').update(b).digest('hex');
const must = (cond, msg) => { if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`); };
const git = (cwd, args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });

const Q = String.fromCharCode(39);              // '
const BT = String.fromCharCode(96);             // `
const ch = (c) => `${Q}${c}${Q}`;
const CMP = (c, op) => `  if (k === ${ch(c)}) d ${op} 1;`;
const OPEN = String.fromCharCode(123);          // {
const CLOSE = String.fromCharCode(125);         // }
const DECL = `// ${'brace-slicer'}${'-deliberate'}${':'} unit-506 fixture, a deliberate naive slicer`;

/** A population member (both brace comparisons) that is also GUARDED (paren + colon). */
const fixtureSource = ({ marked }) => [
  marked ? DECL : '// unit-506 fixture, nothing declared at this site',
  'export function depth(s) {',
  '  let d = 0;',
  '  for (const k of s) {',
  CMP(OPEN, '+='),
  CMP(CLOSE, '-='),
  CMP('(', '+='),
  CMP(')', '-='),
  CMP(':', '+='),
  '  }',
  '  return d;',
  '}',
  '',
].join('\n');

/* ----------------------------------------------------------------- paths, every one pinned to 40 */
const WANT_LEN = 40;
const mkPath = (stem) => {
  const p = `src/${stem}${'x'.repeat(WANT_LEN - `src/${stem}`.length - '.mjs'.length)}.mjs`;
  must(p.length === WANT_LEN, `path ${p} is ${p.length} long, wanted ${WANT_LEN}`);
  return p;
};
const P_M1 = mkPath('m1');
const P_G1 = mkPath('g1');
const P_A01 = mkPath('a01');
must(new Set([P_M1, P_G1, P_A01]).size === 3, 'fixture paths are not distinct');

const gateBytes = readFileSync(join(ROOT, GATE_REL));
const gateSha = sha(gateBytes);
const gateSrc = gateBytes.toString('utf8');

/* =============================================================================================
 * SLICED, NOT TYPED — three facts read out of the gate's own source by anchoring on statement text
 * ============================================================================================= */

/** (i) The emitter's template literal, so the known positive is RENDERED rather than imitated. */
const EMIT_ANCHOR = 'for (const f of stale) emitErr(';
const emitAt = gateSrc.indexOf(EMIT_ANCHOR);
must(emitAt >= 0, 'the stale-limb per-entry emitter was not found by its statement text');
must(gateSrc.indexOf(EMIT_ANCHOR, emitAt + 1) === -1, 'the emitter anchor is not unique in the gate');
const emitRest = gateSrc.slice(emitAt + EMIT_ANCHOR.length);
must(emitRest[0] === BT, 'the emitter argument does not open with a template literal');
let tEnd = 1;
while (tEnd < emitRest.length) {
  if (emitRest[tEnd] === '\\') { tEnd += 2; continue; }
  if (emitRest[tEnd] === BT) break;
  tEnd += 1;
}
must(emitRest[tEnd] === BT, 'the emitter template literal is unterminated');
const EMIT_TEMPLATE = emitRest.slice(0, tEnd + 1);
// eslint-disable-next-line no-new-func
const renderLine = new Function('f', 'verdicts', `return ${EMIT_TEMPLATE};`);

/** (ii) The verdict the `stale` filter EXCLUDES — read from the quoted literal, never by
 *  containment. Reading this statement by containment is exactly the defect P1.c found on 11-22. */
const STALE_ANCHOR = 'const stale = baseline.filter(';
const staleAt = gateSrc.indexOf(STALE_ANCHOR);
must(staleAt >= 0, 'the stale filter was not found by its statement text');
must(gateSrc.indexOf(STALE_ANCHOR, staleAt + 1) === -1, 'the stale-filter anchor is not unique');
const staleStmt = gateSrc.slice(staleAt, gateSrc.indexOf('\n', staleAt));
const excMatch = staleStmt.match(new RegExp(`!==\\s*${Q}([A-Z]+)${Q}`));
must(excMatch !== null, `no quoted excluded verdict in the stale filter: ${staleStmt}`);
const EXCLUDED = excMatch[1];

/** (iii) The declared label list, sliced from the gate's own `LABELS` array literal. */
const LAB_ANCHOR = 'const LABELS = [';
const labAt = gateSrc.indexOf(LAB_ANCHOR);
must(labAt >= 0, 'the LABELS array was not found by its statement text');
const labLit = gateSrc.slice(labAt + LAB_ANCHOR.length, gateSrc.indexOf(']', labAt));
const LABELS = labLit.split(',').map((s) => s.trim().replace(new RegExp(Q, 'g'), '')).filter(Boolean);
must(LABELS.length >= 3, `LABELS sliced as ${JSON.stringify(LABELS)}`);
// `ABSENT` is the emitter's own fallback for an entry that is GONE. Sliced from the template
// rather than typed, for the same reason as everything else here.
const absMatch = EMIT_TEMPLATE.match(new RegExp(`\\?\\?\\s*${Q}([A-Z]+)${Q}`));
must(absMatch !== null, `no quoted fallback verdict in the emitter template: ${EMIT_TEMPLATE}`);
const GONE = absMatch[1];
const VOCAB = [...LABELS, GONE];

/* ------------------------------------------------------------------------------- the two readers */
const LINE_RE = new RegExp(`^\\s+(\\S+)\\s+→ now ${BT}([A-Z]+)${BT}\\s*$`);
const entryLines = (text) => text.split('\n').filter((l) => LINE_RE.test(l));

/** EQUALITY: capture the label, then compare with `===`. Returns a sorted multiset. */
function readByEquality(text) {
  const out = [];
  for (const line of entryLines(text)) {
    const captured = line.match(LINE_RE)[2];
    const hit = VOCAB.filter((v) => captured === v);
    must(hit.length <= 1, `equality matched ${hit.length} labels for one captured token`);
    out.push(hit.length === 1 ? hit[0] : `UNKNOWN(${captured})`);
  }
  return out.slice().sort();
}

/** CONTAINMENT: the defect shape, kept live. One entry line can yield more than one label. */
function readByContainment(text) {
  const out = [];
  for (const line of entryLines(text)) out.push(...VOCAB.filter((v) => line.includes(v)));
  return out.slice().sort();
}

/* ----------------------------------------------------------------------------- the synthetic repo */
function buildRepo() {
  rmSync(SYN, { recursive: true, force: true });
  mkdirSync(join(SYN, 'scripts'), { recursive: true });
  mkdirSync(join(SYN, 'src'), { recursive: true });
  const ci = git(ROOT, ['check-ignore', '-q', SYN]);
  must(ci.status === 0, `scratch path is NOT gitignored by the real repo: ${SYN}`);
  cpSync(join(ROOT, GATE_REL), join(SYN, GATE_REL));
  cpSync(join(ROOT, 'scripts', 'lib'), join(SYN, 'scripts', 'lib'), { recursive: true });
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, 'gate copy is not byte-identical');
  must(git(SYN, ['init', '-q']).status === 0, 'git init failed in the synthetic repo');
  git(SYN, ['config', 'user.email', 'daedalus@local']);
  git(SYN, ['config', 'user.name', 'unit-506 synthetic']);
}

/** Make `git ls-files` be EXACTLY the keys of `tracked`, asserted both ways. */
function setTracked(tracked) {
  for (const p of [P_M1, P_G1, P_A01]) {
    const abs = join(SYN, p);
    if (Object.hasOwn(tracked, p)) {
      writeFileSync(abs, fixtureSource(tracked[p]));
      must(git(SYN, ['add', '-f', p]).status === 0, `git add failed for ${p}`);
    } else {
      if (existsSync(abs)) rmSync(abs);
      git(SYN, ['rm', '--cached', '-q', p]);
    }
  }
  const want = Object.keys(tracked);
  const ls = git(SYN, ['ls-files']).stdout.split('\n').filter(Boolean);
  must(
    ls.length === want.length && want.every((p) => ls.includes(p)),
    `synthetic ls-files is ${JSON.stringify(ls)}, wanted ${JSON.stringify(want)}`,
  );
  return ls;
}

function setBaseline(entries) {
  writeFileSync(join(SYN, BASE_REL), `${entries.join('\n')}\n`);
  const back = readFileSync(join(SYN, BASE_REL), 'utf8').split('\n').filter(Boolean);
  must(JSON.stringify(back) === JSON.stringify(entries), 'the baseline on disk is not what was asked for');
}

const lineCount = (buf) => {
  if (!buf.length) return 0;
  const s = buf.toString('utf8');
  return s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
};

function drive(cell) {
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, `gate copy drifted before ${cell}`);
  const r = spawnSync(process.execPath, [join(SYN, GATE_REL)], { cwd: SYN, maxBuffer: 1 << 26 });
  writeFileSync(join(CAP, `${cell}.out`), r.stdout);
  writeFileSync(join(CAP, `${cell}.err`), r.stderr);
  const errText = r.stderr.toString('utf8');
  return {
    rc: r.status,
    outBytes: r.stdout.length,
    errBytes: r.stderr.length,
    errLines: lineCount(r.stderr),
    errSha: r.stderr.length ? sha(r.stderr) : null,
    errText,
    equality: readByEquality(errText),
    containment: readByContainment(errText),
  };
}

/* ------------------------------------------------------------------------------------------ drive */
const CELLS = [
  ['F-MARKED-GUARDED', { [P_M1]: { marked: true }, [P_G1]: { marked: false } }, [P_M1, P_G1]],
  ['F-GUARDED-ABSENT', { [P_G1]: { marked: false } }, [P_G1, P_A01]],
  ['F-MARKED-ABSENT', { [P_M1]: { marked: true } }, [P_M1, P_A01]],
];
const results = {};
const populations = {};
try {
  buildRepo();
  for (const [cell, tracked, baseline] of CELLS) {
    populations[cell] = setTracked(tracked);
    setBaseline(baseline);
    results[cell] = drive(cell);
  }
} finally {
  rmSync(join(UNIT, 'scratch'), { recursive: true, force: true });
}

/* --------------------------------------------------- the published pin's clauses, for this limb */
const GENERAL = (labels) => 227 + labels.reduce((a, l) => a + WANT_LEN + 19 + l.length, 0);
const namesEveryPath = (cell, baseline) => baseline.every((p) => results[cell].errText.includes(p));
const announcesCount = (cell, n) => new RegExp(`RED — ${n} stale baseline`).test(results[cell].errText);
/** Integers OUTSIDE the path lines — the published predicate's third defined clause. */
const outsideInts = (cell) => results[cell].errText
  .split('\n')
  .filter((l) => !LINE_RE.test(l))
  .join('\n')
  .match(/\d+/g) || [];

const MG = 'F-MARKED-GUARDED';
const GA = 'F-GUARDED-ABSENT';
const MA = 'F-MARKED-ABSENT';
const wantMG = GENERAL(['MARKED', 'GUARDED']);
const wantGA = GENERAL(['GUARDED', GONE]);
const wantMA = GENERAL(['MARKED', GONE]);

/* ------------------------------------------- P5: the containment relation inside the vocabulary */
const containPairs = [];
for (const a of VOCAB) for (const b of VOCAB) if (a !== b && a.includes(b)) containPairs.push([a, b]);

/* ------------------------------ P5.c: the known positive, RENDERED by the gate's own template */
const kpAbsent = renderLine(P_A01, new Map());
const kpExcluded = renderLine(P_G1, new Map([[P_G1, EXCLUDED]]));
const kpText = `\nRED — 1 stale baseline entry/entries (no longer unguarded, or gone):\n${kpExcluded}\n`;
const kpEquality = readByEquality(kpText);
const kpContainment = readByContainment(kpText);

/* ------------------------------------------------------------------------------------- the grades */
const sameSet = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const distinct = (xs) => new Set(xs.map((x) => JSON.stringify(x))).size;

const verdict = {
  /* ---- P1: the untried composition, out of sample */
  'P1.a  F-MARKED-GUARDED rc = 1': results[MG].rc === 1,
  [`P1.b  F-MARKED-GUARDED stderr = 227 + (40+19+6) + (40+19+7) = ${wantMG}`]:
    results[MG].errBytes === wantMG,
  'P1.c  F-MARKED-GUARDED stderr lines = 4 + 2 = 6': results[MG].errLines === 6,
  [`P1.d  the general form is exact in all three cells (${wantMG}, ${wantGA}, ${wantMA})`]:
    results[MG].errBytes === wantMG && results[GA].errBytes === wantGA
    && results[MA].errBytes === wantMA,

  /* ---- P2: the collision, measured inside one harness */
  'P2.a  F-MARKED-GUARDED and F-GUARDED-ABSENT have EQUAL stderr byte counts':
    results[MG].errBytes === results[GA].errBytes,
  'P2.b  ...and equal stderr line counts': results[MG].errLines === results[GA].errLines,
  'P2.c  ...and DISTINCT stderr sha256': results[MG].errSha !== results[GA].errSha,
  'P2.d  ...and distinct rendered-label multisets':
    !sameSet(results[MG].equality, results[GA].equality),
  'P2.e  across the three cells: 2 distinct byte counts, 1 distinct line count, 3 distinct multisets':
    distinct([results[MG].errBytes, results[GA].errBytes, results[MA].errBytes]) === 2
    && distinct([results[MG].errLines, results[GA].errLines, results[MA].errLines]) === 1
    && distinct([results[MG].equality, results[GA].equality, results[MA].equality]) === 3,

  /* ---- P3: the defined clauses of the published content predicate do not separate the cells */
  'P3.a  every baseline path is named, in all three cells':
    namesEveryPath(MG, [P_M1, P_G1]) && namesEveryPath(GA, [P_G1, P_A01])
    && namesEveryPath(MA, [P_M1, P_A01]),
  'P3.b  the count is announced, in all three cells':
    announcesCount(MG, 2) && announcesCount(GA, 2) && announcesCount(MA, 2),
  'P3.c  the integers outside the path lines are [2] in all three cells':
    sameSet(outsideInts(MG), ['2']) && sameSet(outsideInts(GA), ['2'])
    && sameSet(outsideInts(MA), ['2']),
  'P3.d  byte law + line law + the three defined clauses assign MG and GA IDENTICAL readings':
    results[MG].errBytes === results[GA].errBytes
    && results[MG].errLines === results[GA].errLines
    && sameSet(outsideInts(MG), outsideInts(GA))
    && announcesCount(MG, 2) && announcesCount(GA, 2),

  /* ---- P4: does the routed cure actually cure? */
  'P4.a  the equality-keyed multiset reader separates all 3 cells':
    distinct([results[MG].equality, results[GA].equality, results[MA].equality]) === 3,
  'P4.b  strict refinement: no two cells the multiset calls EQUAL are called distinct by bytes/lines':
    [[MG, GA], [MG, MA], [GA, MA]].every(([x, y]) => !sameSet(results[x].equality, results[y].equality)
      || (results[x].errBytes === results[y].errBytes && results[x].errLines === results[y].errLines)),
  'P4.c  the reader reads exactly N = 2 labels in every cell':
    [MG, GA, MA].every((c) => results[c].equality.length === 2),

  /* ---- P5: equality over containment is true, and true by coincidence in THIS limb */
  'P5.a  containment and equality AGREE on all three cells':
    [MG, GA, MA].every((c) => sameSet(results[c].equality, results[c].containment)),
  [`P5.b  the vocabulary ${JSON.stringify(VOCAB)} has exactly ONE containment pair, and its superstring is ${EXCLUDED} — the verdict the stale filter is DEFINED by excluding`]:
    containPairs.length === 1 && containPairs[0][0] === EXCLUDED
    && LABELS.includes(containPairs[0][1]) && EXCLUDED === excMatch[1],
  [`P5.c  KNOWN POSITIVE, rendered by the gate's own template: on a ${EXCLUDED} label the readers DISAGREE`]:
    !sameSet(kpEquality, kpContainment) && sameSet(kpEquality, [EXCLUDED])
    && kpContainment.length === 2,
  'P5.d  ...so in this limb the two readers are indistinguishable, and the KP is the only way to tell':
    [MG, GA, MA].every((c) => sameSet(results[c].equality, results[c].containment))
    && !sameSet(kpEquality, kpContainment),
};

/* ------------------- LABELLED POST-HOC, not a registered prediction: P4.b lands VACUOUSLY ------ */
const posthoc = {
  'P4.b is VACUOUS as registered': {
    note: 'all three multisets are distinct, so the universally-quantified antecedent'
      + ' ("two cells the multiset calls equal") has an EMPTY domain. The assertion is green and'
      + ' carries no load. Recorded rather than counted as a HIT.',
    pairsWithEqualMultisets: 0,
  },
  'the non-vacuous check P4.b should have been': {
    note: 'the labels the reader CAPTURED reproduce the measured bytes through the general form.'
      + ' A reader that dropped or invented a label fails this. Authored after seeing P4.b was'
      + ' vacuous, so it is a post-hoc and is not counted.',
    perCell: Object.fromEntries([MG, GA, MA].map((c) => [c, {
      capturedLabels: results[c].equality,
      formOverCaptured: GENERAL(results[c].equality),
      measured: results[c].errBytes,
      agrees: GENERAL(results[c].equality) === results[c].errBytes,
    }])),
  },
};

console.log(JSON.stringify({
  gateSha,
  pathLength: WANT_LEN,
  paths: { P_M1, P_G1, P_A01 },
  sliced: {
    emitTemplate: EMIT_TEMPLATE,
    excludedVerdictFromStaleFilter: EXCLUDED,
    labelsFromGateSource: LABELS,
    goneFallbackFromTemplate: GONE,
    vocabulary: VOCAB,
    containmentPairsInVocabulary: containPairs,
    staleStatementSliced: staleStmt,
  },
  knownPositive: {
    renderedAbsentLine: kpAbsent,
    renderedExcludedLine: kpExcluded,
    equalityReads: kpEquality,
    containmentReads: kpContainment,
  },
  generalForm: 'bytes = 227 + SUM(len(path_i) + 19 + len(label_i));  lines = 4 + N',
  cells: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, {
    rc: v.rc,
    population: populations[k].length,
    errBytes: v.errBytes,
    errLines: v.errLines,
    errSha: v.errSha,
    outBytes: v.outBytes,
    equalityMultiset: v.equality,
    containmentMultiset: v.containment,
    outsideInts: outsideInts(k),
  }])),
  predictedVsMeasured: {
    [MG]: { form: wantMG, measured: results[MG].errBytes },
    [GA]: { form: wantGA, measured: results[GA].errBytes },
    [MA]: { form: wantMA, measured: results[MA].errBytes },
  },
  stderrTexts: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.errText])),
  verdict,
  posthoc,
}, null, 2));
