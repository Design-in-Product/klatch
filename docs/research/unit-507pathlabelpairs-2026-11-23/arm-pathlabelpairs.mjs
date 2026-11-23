#!/usr/bin/env node
/**
 * unit-507pathlabelpairs — P1..P8. The two open items in Daedalus's `unit-506labelmultiset` memo
 * turn out to share ONE cell pair, and his §2 P5.a is the claim this arm aims at.
 *
 * Standing and credited: five contents at two byte counts and one line count in the stale limb.
 * The rendered-label multiset separates all five where bytes give 2 readings and lines give 1.
 * This arm does not dispute that. It asks a different question: every cell either seat has ever
 * driven varies the COMPOSITION of the multiset. None has held the composition fixed and varied the
 * ASSIGNMENT of labels to paths — and a multiset is, by construction, blind to that.
 *
 *   cell        baseline (order held)  tracked          renders                    multiset
 *   G-SWAP-A    [P_A, P_B]             P_A (+marker)    P_A->MARKED  P_B->ABSENT   {ABSENT,MARKED}
 *   G-SWAP-B    [P_A, P_B]             P_B (+marker)    P_A->ABSENT  P_B->MARKED   {ABSENT,MARKED}
 *   G-COLLIDE   [P_U, P_B]             P_B (+marker)    P_U->ABSENT  P_B->MARKED   {ABSENT,MARKED}
 *   G-2MARKED   [P_A, P_B]             both (+marker)   P_A->MARKED  P_B->MARKED   {MARKED,MARKED}
 *
 * G-SWAP-A and G-SWAP-B differ in EXACTLY ONE INPUT: which fixture carries the declared marker.
 * Same paths, same baseline order, same label strings, opposite pairing. His P4.b was green and
 * VACUOUS because all three of his multisets were distinct; this pair fills that empty domain.
 *
 * G-COLLIDE reaches the same multiset through a path whose stem carries the token `UNGUARDED`.
 * That is where a containment-keyed reader and an equality-keyed one must part, because a
 * containment reader is by definition not restricted to the label POSITION and the line carries a
 * PATH. 24 such paths already exist in the live tree (pre-registration §0), six written by
 * unit-506 itself, so the state is not hypothetical.
 *
 * G-2MARKED is the control that keeps P5 from being a dead cripple: a cell the published multiset
 * clause DOES separate. Without it, a multiset reader returning one reading for the other three is
 * equally consistent with "the reader is broken and returns one reading for everything."
 *
 * DECLARED LIMIT, registered in PRE-REGISTRATION §2 before measuring: the harness shape here is the
 * one unit-503..506 share. A figure of mine agreeing with one of his catches a per-instance
 * construction error and CANNOT catch an error in the shape all five instances share. Nothing here
 * is offered as independent corroboration of the form.
 *
 * R1 no tracked file written; `git check-ignore` ASSERTED on the scratch path. R2 the gate copy is
 * sha256-asserted equal to the tracked gate before EVERY drive. R3 both streams captured via
 * `spawnSync`. R4 no exemption token and no quoted-character comparison appears contiguously in
 * this source — every one assembled at runtime — so this file cannot join the population, DEAD
 * MARKERS or quoted-only; driven after the arm is tracked, which is the only way that is checkable.
 * R5 each cell's label composition is asserted from `git ls-files` BEFORE the drive. R6 the
 * containment reader exists only as P7's subject and never feeds another figure. R7 P_U's label
 * token is assembled at runtime and its presence is ASSERTED, not assumed from the stem.
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

/* ------------------------------------------------- the fixture, assembled, never written literal */
const Q = String.fromCharCode(39);              // '
const BT = String.fromCharCode(96);             // `
const ch = (c) => `${Q}${c}${Q}`;
const CMP = (c, op) => `  if (k === ${ch(c)}) d ${op} 1;`;
const OPEN = String.fromCharCode(123);          // {
const CLOSE = String.fromCharCode(125);         // }
const MARKER_DECL = `// ${'brace-slicer-deliberate'}${':'} unit-507 fixture, a deliberate naive slicer`;

/** A population member (brace comparisons both ways) that is also GUARDED (paren + colon). */
function fixtureSource({ marked }) {
  return [
    marked ? MARKER_DECL : '// unit-507 fixture — no exemption declared',
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
}

/* ----------------------------------------------------------------------- the vocabulary, assembled */
// R4/R7: assembled, so no label token appears contiguously in this source outside a comment.
const T_MARKED = `MAR${'KED'}`;
const T_GUARDED = `GUAR${'DED'}`;
const T_UNGUARDED = `UN${T_GUARDED}`;
const T_ABSENT = `ABS${'ENT'}`;
// The gate's own LABELS array, plus the emitter's `?? 'ABSENT'` fallback — the vocabulary a
// stale-limb reader faces. Sliced below from the gate source and ASSERTED equal to this.
const VOCAB = [T_MARKED, T_GUARDED, T_UNGUARDED, T_ABSENT];

/* ----------------------------------------------------------------------------- the synthetic repo */
const WANT_LEN = 40;
const mkPath = (stem) => {
  const p = `src/${stem}${'x'.repeat(WANT_LEN - `src/${stem}`.length - '.mjs'.length)}.mjs`;
  must(p.length === WANT_LEN, `path ${p} is ${p.length} long, wanted ${WANT_LEN}`);
  return p;
};
const P_A = mkPath('a1');
const P_B = mkPath('b1');
const P_U = mkPath(T_UNGUARDED);
// R7: ASSERTED, not assumed from the stem I typed.
must(P_U.includes(T_UNGUARDED), `P_U does not carry the token: ${P_U}`);
must(!P_A.includes(T_UNGUARDED) && !P_B.includes(T_UNGUARDED), 'P_A/P_B carry the token');
must(
  VOCAB.every((v) => !P_A.includes(v) && !P_B.includes(v)),
  'P_A/P_B carry some label token — the swap pair would be contaminated',
);
must(new Set([P_A, P_B, P_U]).size === 3, 'fixture paths are not distinct');

const gateBytes = readFileSync(join(ROOT, GATE_REL));
const gateSrc = gateBytes.toString('utf8');
const gateSha = sha(gateBytes);

/* ------------------------------------- P4: the KP, SLICED out of the gate rather than hand-typed */
// A hand-typed reader is not a slice, and retyping a key plants it twice. The per-entry emitter's
// template literal is located by its own statement text and evaluated with `f` and `verdicts` bound.
const EMIT_ANCHOR = `for (const f of stale) emitErr(`;
const emitHits = gateSrc.split('\n')
  .map((line, i) => ({ line, n: i + 1 }))
  .filter(({ line }) => line.includes(EMIT_ANCHOR));
const emitLine = emitHits.length === 1 ? emitHits[0].line : null;
const emitTpl = emitLine
  ? emitLine.slice(emitLine.indexOf(BT), emitLine.lastIndexOf(BT) + 1)
  : null;
// eslint-disable-next-line no-new-func
const renderEntry = emitTpl
  ? new Function('f', 'verdicts', `return ${emitTpl};`)
  : null;

// The gate's LABELS array, also sliced rather than typed, so VOCAB cannot drift from the partition.
const LABELS_ANCHOR = 'const LABELS = [';
const labelsHits = gateSrc.split('\n').filter((l) => l.includes(LABELS_ANCHOR));
const slicedLabels = labelsHits.length === 1
  ? JSON.parse(
    labelsHits[0].slice(labelsHits[0].indexOf('['), labelsHits[0].lastIndexOf(']') + 1)
      .split(Q).join('"'),
  )
  : null;

function buildRepo() {
  rmSync(SYN, { recursive: true, force: true });
  mkdirSync(join(SYN, 'scripts'), { recursive: true });
  mkdirSync(join(SYN, 'src'), { recursive: true });
  // R1: ASSERTED, not assumed. A scratch copy at the wrong depth is a defect this corpus has
  // shipped four times, and the fourth was at the RIGHT depth and still refused.
  const ci = git(ROOT, ['check-ignore', '-q', SYN]);
  must(ci.status === 0, `scratch path is NOT gitignored by the real repo: ${SYN}`);
  cpSync(join(ROOT, GATE_REL), join(SYN, GATE_REL));
  cpSync(join(ROOT, 'scripts', 'lib'), join(SYN, 'scripts', 'lib'), { recursive: true });
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, 'gate copy is not byte-identical');
  must(git(SYN, ['init', '-q']).status === 0, 'git init failed in the synthetic repo');
  git(SYN, ['config', 'user.email', 'theseus@local']);
  git(SYN, ['config', 'user.name', 'unit-507 synthetic']);
}

function setCell({ baseline, tracked }) {
  for (const p of [P_A, P_B, P_U]) {
    const abs = join(SYN, p);
    if (existsSync(abs)) rmSync(abs);
    git(SYN, ['rm', '--cached', '-q', p]);
  }
  for (const [p, { marked }] of Object.entries(tracked)) {
    writeFileSync(join(SYN, p), fixtureSource({ marked }));
    must(git(SYN, ['add', '-f', p]).status === 0, `git add failed for ${p}`);
  }
  writeFileSync(join(SYN, BASE_REL), `${baseline.join('\n')}\n`);
  const ls = git(SYN, ['ls-files']).stdout.split('\n').filter(Boolean).sort();
  const want = Object.keys(tracked).sort();
  must(
    ls.length === want.length && ls.every((v, i) => v === want[i]),
    `synthetic ls-files is ${JSON.stringify(ls)}, wanted ${JSON.stringify(want)}`,
  );
  return ls;
}

function drive(cell) {
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, `gate copy drifted before ${cell}`);
  const r = spawnSync(process.execPath, [join(SYN, GATE_REL)], { cwd: SYN, maxBuffer: 1 << 26 });
  writeFileSync(join(CAP, `${cell}.out`), r.stdout);
  writeFileSync(join(CAP, `${cell}.err`), r.stderr);
  const countLines = (buf) => {
    if (!buf.length) return 0;
    const s = buf.toString('utf8');
    return s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
  };
  return {
    rc: r.status,
    outBytes: r.stdout.length,
    errBytes: r.stderr.length,
    errLines: countLines(r.stderr),
    errSha: r.stderr.length ? sha(r.stderr) : null,
    errText: r.stderr.toString('utf8'),
  };
}

/* ------------------------------------------------------------------------------- the four readers */
// (1) EQUALITY, terminal label captured and compared with `===`. unit-504's P1.c was refuted by
//     `includes` finding GUARDED inside UNGUARDED; this reader cannot have that defect.
const ENTRY = new RegExp(`^\\s+(\\S+)\\s+→ now ${BT}([A-Z]+)${BT}\\s*$`);
const pairsOf = (errText) => errText.split('\n')
  .map((line) => ENTRY.exec(line))
  .filter(Boolean)
  .map((m) => ({ path: m[1], label: m[2] }));

// (2) the PUBLISHED multiset clause: the rendered labels, unordered.
const multisetOf = (pairs) => pairs.map((p) => p.label).sort().join(',');

// (3) the PAIR grain: ordered, and unordered-as-a-set.
const pairListOf = (pairs) => pairs.map((p) => `${p.path}=${p.label}`).join('|');
const pairSetOf = (pairs) => pairs.map((p) => `${p.path}=${p.label}`).sort().join('|');

// (4) R6: CONTAINMENT, the subject of P7 and nothing else. Keyed over the same vocabulary, scanning
//     the whole entry line — which is what "containment-keyed" means, and the line carries a path.
const containmentMultisetOf = (errText) => errText.split('\n')
  .filter((line) => ENTRY.test(line))
  .flatMap((line) => VOCAB.filter((v) => line.includes(v)))
  .sort()
  .join(',');

/** The label-blind clauses of the published content predicate, evaluated per cell. */
function publishedContentPredicate(errText, baseline) {
  const pathLine = (line) => baseline.some((p) => line.includes(p));
  const nonPathInts = errText.split('\n')
    .filter((l) => !pathLine(l))
    .flatMap((l) => (l.match(/\d+/g) ?? []))
    .map(Number);
  return {
    everyPathNamed: baseline.every((p) => errText.includes(p)),
    countAnnounced: new RegExp(`\\b${baseline.length}\\b`).test(errText.split('\n')[1] ?? ''),
    nonPathIntegers: nonPathInts,
  };
}

/* ------------------------------------------------------------------------------------------ drive */
const LAW = (labels, len) => 227 + labels.reduce((a, l) => a + len + 19 + l.length, 0);
const CELLS = {
  'G-SWAP-A': { baseline: [P_A, P_B], tracked: { [P_A]: { marked: true } } },
  'G-SWAP-B': { baseline: [P_A, P_B], tracked: { [P_B]: { marked: true } } },
  'G-COLLIDE': { baseline: [P_U, P_B], tracked: { [P_B]: { marked: true } } },
  'G-2MARKED': {
    baseline: [P_A, P_B],
    tracked: { [P_A]: { marked: true }, [P_B]: { marked: true } },
  },
};
const THREE = ['G-SWAP-A', 'G-SWAP-B', 'G-COLLIDE'];

const results = {};
try {
  buildRepo();
  for (const [cell, state] of Object.entries(CELLS)) {
    const ls = setCell(state);
    results[cell] = { ...drive(cell), lsFiles: ls };
  }
} finally {
  rmSync(SYN, { recursive: true, force: true });
}

for (const [cell, r] of Object.entries(results)) {
  r.pairs = pairsOf(r.errText);
  r.multiset = multisetOf(r.pairs);
  r.pairList = pairListOf(r.pairs);
  r.pairSet = pairSetOf(r.pairs);
  r.containment = containmentMultisetOf(r.errText);
  r.predicate = publishedContentPredicate(r.errText, CELLS[cell].baseline);
  // P4.c: the captured labels must reproduce the measured bytes through the general form.
  r.lawFromCapture = 227 + r.pairs.reduce((a, p) => a + p.path.length + 19 + p.label.length, 0);
}

const B = (c) => results[c].errBytes;
const L = (c) => results[c].errLines;
const S = (c) => results[c].errSha;
const uniq = (cells, f) => new Set(cells.map(f)).size;

/* ------------------------------------------------- P4: the KP, rendered rather than imitated */
const kpPath = P_U;
const kpRendered = renderEntry ? renderEntry(kpPath, new Map()) : null;   // empty Map -> ?? fallback
const kpPairs = kpRendered === null ? [] : pairsOf(`x\n${kpRendered}\n`);
// The KP is only a known positive if the gate really emits that byte sequence. Asserted against a
// line actually present in G-COLLIDE's captured stderr, not against my reading of the template.
const kpInCapture = kpRendered !== null
  && results['G-COLLIDE'].errText.split('\n').includes(kpRendered);

/* ------------------------------------------------------------------------------------- the grades */
const verdict = {
  /* P1 — the landed form, four times */
  'P1.a  all four cells rc = 1': Object.values(results).every((r) => r.rc === 1),
  'P1.b  all four cells stderr = 227 + 2x(40+19+6) = 357 (landed form EXACT)':
    Object.keys(CELLS).every((c) => B(c) === LAW([T_MARKED, T_ABSENT], WANT_LEN))
    && LAW([T_MARKED, T_ABSENT], WANT_LEN) === 357,
  'P1.c  all four cells stderr lines = 4 + N = 6':
    Object.keys(CELLS).every((c) => L(c) === 6),

  /* P2 — the multiset separates COMPOSITION, not ASSIGNMENT */
  'P2.a  G-SWAP-A / G-SWAP-B / G-COLLIDE have ONE label multiset between them':
    uniq(THREE, (c) => results[c].multiset) === 1,
  'P2.b  ...and THREE distinct contents (sha)': uniq(THREE, (c) => S(c)) === 3,
  'P2.c  G-2MARKED multiset differs from all three (the clause is not dead)':
    !THREE.some((c) => results[c].multiset === results['G-2MARKED'].multiset),
  'P2.d  the swap pair differs in EXACTLY ONE input: which fixture carries the marker':
    JSON.stringify(CELLS['G-SWAP-A'].baseline) === JSON.stringify(CELLS['G-SWAP-B'].baseline)
    && JSON.stringify(Object.keys(CELLS['G-SWAP-A'].tracked)) !== JSON.stringify(Object.keys(CELLS['G-SWAP-B'].tracked))
    && Object.keys(CELLS['G-SWAP-A'].tracked).length === Object.keys(CELLS['G-SWAP-B'].tracked).length,

  /* P3 — the pair grain is injective here, and not by order */
  'P3.a  the ORDERED (path,label) list separates all FOUR cells':
    uniq(Object.keys(CELLS), (c) => results[c].pairList) === 4,
  'P3.b  the UNORDERED (path,label) SET separates all four too (not an order artefact)':
    uniq(Object.keys(CELLS), (c) => results[c].pairSet) === 4,
  'P3.c  every cell reads exactly N = 2 pairs':
    Object.keys(CELLS).every((c) => results[c].pairs.length === 2),

  /* P4 — the reader is SLICED and has a RENDERED known positive */
  'P4.a  the emitter anchor occurs EXACTLY ONCE in the gate source': emitHits.length === 1,
  'P4.b  the LABELS array sliced from the gate equals this arm\'s assembled vocabulary minus ABSENT':
    slicedLabels !== null
    && JSON.stringify(slicedLabels) === JSON.stringify(VOCAB.filter((v) => v !== T_ABSENT)),
  'P4.c  KP: the sliced emitter, evaluated with an ABSENT-fallback verdict, parses to ONE pair':
    kpPairs.length === 1 && kpPairs[0].path === kpPath && kpPairs[0].label === T_ABSENT,
  'P4.d  ...and that rendered line is BYTE-PRESENT in G-COLLIDE\'s captured stderr': kpInCapture,
  'P4.e  per cell, the CAPTURED pairs reproduce the measured bytes through the general form':
    Object.keys(CELLS).every((c) => results[c].lawFromCapture === B(c)),

  /* P5 — the published clause, as a reader, is blind here and NOT dead */
  'P5.a  a multiset-keyed reader returns ONE reading for the three cells':
    uniq(THREE, (c) => results[c].multiset) === 1,
  'P5.b  ...and the SAME reader separates G-2MARKED, so the blindness is the clause\'s':
    uniq([...THREE, 'G-2MARKED'], (c) => results[c].multiset) === 2,

  /* P6 — the FULL published pin, multiset clause included, gives one reading for three documents */
  'P6.a  every path is named in all three': THREE.every((c) => results[c].predicate.everyPathNamed),
  'P6.b  the count is announced in all three': THREE.every((c) => results[c].predicate.countAnnounced),
  'P6.c  the non-path INTEGER multiset is identical across all three':
    uniq(THREE, (c) => JSON.stringify(results[c].predicate.nonPathIntegers)) === 1,
  'P6.d  SO: bytes + lines + label-blind clauses + the MULTISET clause = ONE reading, THREE documents':
    uniq(THREE, (c) => B(c)) === 1 && uniq(THREE, (c) => L(c)) === 1
    && uniq(THREE, (c) => results[c].multiset) === 1
    && uniq(THREE, (c) => JSON.stringify(results[c].predicate.nonPathIntegers)) === 1
    && uniq(THREE, (c) => S(c)) === 3,
  'P6.e  ...and the pair grain gives THREE': uniq(THREE, (c) => results[c].pairSet) === 3,

  /* P7 — against Daedalus's §2 P5.a */
  'P7.a  on G-COLLIDE, equality reads a 2-label multiset':
    results['G-COLLIDE'].multiset.split(',').length === 2,
  'P7.b  ...and containment over the SAME lines reports a STRICT SUPERSET':
    (() => {
      const eq = results['G-COLLIDE'].multiset.split(',');
      const co = results['G-COLLIDE'].containment.split(',').filter(Boolean);
      return co.length > eq.length && eq.every((v) => co.includes(v));
    })(),
  'P7.c  ...and the superset includes BOTH members of the vocabulary\'s only containment pair':
    results['G-COLLIDE'].containment.includes(T_GUARDED)
    && results['G-COLLIDE'].containment.includes(T_UNGUARDED),
  'P7.d  the two readers AGREE on every cell whose paths carry no label token':
    ['G-SWAP-A', 'G-SWAP-B', 'G-2MARKED']
      .every((c) => results[c].containment === results[c].multiset),
  'P7.e  SO: the disagreement is located in the PATH field, in a state a real repository can hold':
    results['G-COLLIDE'].containment !== results['G-COLLIDE'].multiset
    && results['G-SWAP-B'].containment === results['G-SWAP-B'].multiset
    && results['G-COLLIDE'].pairs.some((p) => p.path.includes(T_UNGUARDED))
    && !results['G-COLLIDE'].pairs.some((p) => p.label === T_UNGUARDED),
};

/* ---------------------------------------------- P8 — the reach, read off the LIVE tree, not a cell */
const liveFiles = git(ROOT, ['ls-files']).stdout.split('\n').filter(Boolean);
const liveTokenPaths = liveFiles.filter((f) => VOCAB.some((v) => f.includes(v)));
const liveBaseline = readFileSync(join(ROOT, BASE_REL), 'utf8').split('\n').filter(Boolean);
verdict['P8.a  at least one live label-token-bearing path was written by unit-506 itself'] =
  liveTokenPaths.some((f) => f.includes('unit-506'));
verdict['P8.b  NONE of the live label-token-bearing paths is currently a baseline entry (REACH, not a live red)'] =
  liveTokenPaths.every((f) => !liveBaseline.includes(f));

console.log(JSON.stringify({
  gateSha,
  emitterSlice: { anchorHits: emitHits.length, line: emitHits[0]?.n ?? null, template: emitTpl },
  slicedLabels,
  paths: { P_A, P_B, P_U, length: WANT_LEN },
  landedForm: 'bytes = 227 + SUM(len(path_i) + 19 + len(label_i)); lines = 4 + N',
  kp: { path: kpPath, rendered: kpRendered, parsed: kpPairs, presentInCapture: kpInCapture },
  live: {
    tracked: liveFiles.length,
    tokenBearingPaths: liveTokenPaths.length,
    tokenBearingFromUnit506: liveTokenPaths.filter((f) => f.includes('unit-506')).length,
    baselineEntries: liveBaseline.length,
    tokenBearingAlsoBaselined: liveTokenPaths.filter((f) => liveBaseline.includes(f)),
  },
  cells: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, {
    rc: v.rc,
    errBytes: v.errBytes,
    errLines: v.errLines,
    errSha: v.errSha,
    outBytes: v.outBytes,
    lsFiles: v.lsFiles,
    pairs: v.pairs,
    multiset: v.multiset,
    pairList: v.pairList,
    containment: v.containment,
    lawFromCapture: v.lawFromCapture,
    predicate: v.predicate,
  }])),
  stderrTexts: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.errText])),
  verdict,
}, null, 2));
