#!/usr/bin/env node
/**
 * unit-505markedabsentpair — P1..P7. The stale-limb cell `unit-504mixedstalelabels` §6 left open.
 *
 * The landed general form claims `label_i ∈ { ABSENT, MARKED, GUARDED }`, but `MARKED` is in that
 * set on the strength of ONE drive (`unit-503stalelabelwidth` C-MARKED, N=1, alone in its block).
 * Every multi-entry stale cell ever driven is ABSENT-only, GUARDED-only, or GUARDED+ABSENT.
 *
 * `MARKED` and `ABSENT` are both six characters, so the form predicts a MARKED+ABSENT block at
 * byte-identical output to an ABSENT+ABSENT block with different content. The measurement worth
 * having is therefore not the byte count: it is what the PUBLISHED PIN PAIR cannot tell apart.
 *
 *   cell               tracked fixtures         baseline       N  renders
 *   E-MARKED-ABSENT    M1 (member + marker)     [M1, A01]      2  MARKED + ABSENT   <- the open cell
 *   E-2ABSENT          none                     [M1, A01]      2  ABSENT x2         <- control
 *   E-2MARKED          M1, M2 (both marked)     [M1, M2]       2  MARKED x2         <- control
 *   E-GUARDED-ABSENT   M1 (member, NO marker)   [M1, A01]      2  GUARDED + ABSENT  <- cross-harness
 *
 * E-MARKED-ABSENT and E-GUARDED-ABSENT share a baseline and a tracked set and differ in EXACTLY ONE
 * THING: whether the tracked fixture carries a declared marker. Any byte difference between those
 * two cells is therefore attributable to label width and to nothing else in the construction.
 *
 * E-2ABSENT kills "the limb charges a flat per-block constant at N=2". E-2MARKED kills "MARKED is
 * being charged as ABSENT because the verdict lookup fell through" — the right number for the wrong
 * reason, which the byte count alone cannot distinguish and P6's content assertions can.
 *
 * DECLARED LIMIT on the cross-harness anchor, registered in PRE-REGISTRATION §1 before measuring:
 * the harness shape here is the same shape `unit-504` used (he says so in his own arm's docblock).
 * An E-GUARDED-ABSENT = 358 is a same-shape, different-instance reproduction. It can catch a
 * per-instance construction error; it CANNOT catch an error in the shape both instances share, and
 * it is not corroboration of the form.
 *
 * LABEL READING IS KEYED ON EQUALITY, NEVER CONTAINMENT. `unit-504`'s P1.c was refuted because
 * `LABELS.filter((v) => line.includes(v))` finds `GUARDED` inside `UNGUARDED`. This arm captures the
 * label out of each rendered entry line and compares it with `===`, so the same hazard cannot reach
 * these figures.
 *
 * R1: no tracked file written; `git check-ignore` ASSERTED on the scratch path. R2: the gate copy is
 * sha256-asserted equal to the tracked gate before EVERY drive. R3: both streams captured, via
 * `spawnSync`. R4: no exemption token and no quoted-character comparison appears contiguously in
 * this source — every one is assembled at runtime, so this file cannot join the population, DEAD
 * MARKERS or quoted-only. R5: each cell's label composition is asserted from `git ls-files` BEFORE
 * the drive, so a cell that renders the wrong labels fails loudly instead of producing a tidy number.
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
// Assembled so the marker key (/brace-slicer-deliberate:\s*\S+/) cannot match THIS file's source.
const MARKER_DECL = `// ${'brace-slicer-deliberate'}${':'} unit-505 fixture, a deliberate naive slicer`;

/** A population member (brace comparisons both ways) that is also GUARDED (paren + colon). */
function fixtureSource({ marked }) {
  return [
    marked ? MARKER_DECL : '// unit-505 fixture — no exemption declared',
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

/* ----------------------------------------------------------------------------- the synthetic repo */
// Every path pinned to 40, so every figure here is directly comparable to C-*, D-* and B1.
const WANT_LEN = 40;
const mkPath = (stem) => {
  const p = `src/${stem}${'x'.repeat(WANT_LEN - `src/${stem}`.length - '.mjs'.length)}.mjs`;
  must(p.length === WANT_LEN, `path ${p} is ${p.length} long, wanted ${WANT_LEN}`);
  return p;
};
const P_M1 = mkPath('m1');
const P_M2 = mkPath('m2');
const P_A01 = mkPath('a01');
must(new Set([P_M1, P_M2, P_A01]).size === 3, 'fixture paths are not distinct');

const gateBytes = readFileSync(join(ROOT, GATE_REL));
const gateSha = sha(gateBytes);

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
  git(SYN, ['config', 'user.name', 'unit-505 synthetic']);
}

/**
 * Put the synthetic repo into a cell's state.
 * `baseline` is the ordered list written to the baseline file; `tracked` maps path -> {marked}.
 */
function setCell({ baseline, tracked }) {
  // Clear every fixture from index and disk first, so cells cannot leak into each other.
  for (const p of [P_M1, P_M2, P_A01]) {
    const abs = join(SYN, p);
    if (existsSync(abs)) rmSync(abs);
    git(SYN, ['rm', '--cached', '-q', p]);
  }
  for (const [p, { marked }] of Object.entries(tracked)) {
    writeFileSync(join(SYN, p), fixtureSource({ marked }));
    must(git(SYN, ['add', '-f', p]).status === 0, `git add failed for ${p}`);
  }
  // The gate copy, its lib and the baseline stay UNTRACKED on purpose: `git ls-files` must return
  // exactly the fixtures, or the lib's own population members would contaminate the stream.
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

/* --------------------------------------------- reading the rendered labels, by EQUALITY not match */
// An entry line renders as:  `      <path>  → now `<LABEL>``
// The label is CAPTURED and compared with `===`. `includes` would find GUARDED inside UNGUARDED,
// which is exactly how unit-504's P1.c was refuted.
const ENTRY = new RegExp(`^\\s+(\\S+)\\s+→ now ${BT}([A-Z]+)${BT}\\s*$`);
function renderedLabels(errText) {
  const pairs = [];
  for (const line of errText.split('\n')) {
    const m = ENTRY.exec(line);
    if (m) pairs.push({ path: m[1], label: m[2] });
  }
  return pairs;
}
const labelCount = (pairs, label) => pairs.filter((p) => p.label === label).length;

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
  'E-MARKED-ABSENT': { baseline: [P_M1, P_A01], tracked: { [P_M1]: { marked: true } } },
  'E-2ABSENT': { baseline: [P_M1, P_A01], tracked: {} },
  'E-2MARKED': {
    baseline: [P_M1, P_M2],
    tracked: { [P_M1]: { marked: true }, [P_M2]: { marked: true } },
  },
  'E-GUARDED-ABSENT': { baseline: [P_M1, P_A01], tracked: { [P_M1]: { marked: false } } },
};

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
  r.labels = renderedLabels(r.errText);
  r.predicate = publishedContentPredicate(r.errText, CELLS[cell].baseline);
}

const B = (c) => results[c].errBytes;
const L = (c) => results[c].errLines;
const S = (c) => results[c].errSha;
const lab = (c) => results[c].labels;

/* ------------------------------------------------------------------------------------- the grades */
const verdict = {
  /* P1 — the open cell */
  'P1.a  E-MARKED-ABSENT rc = 1': results['E-MARKED-ABSENT'].rc === 1,
  'P1.b  E-MARKED-ABSENT stderr = 227 + 2x(40+19+6) = 357 (landed form EXACT)':
    B('E-MARKED-ABSENT') === LAW(['MARKED', 'ABSENT'], WANT_LEN),
  'P1.c  E-MARKED-ABSENT stderr lines = 4 + N = 6': L('E-MARKED-ABSENT') === 6,

  /* P2 — identical bytes, different content */
  'P2.a  E-2ABSENT = 357 B (landed form EXACT)': B('E-2ABSENT') === LAW(['ABSENT', 'ABSENT'], WANT_LEN),
  'P2.b  E-2ABSENT lines = 6': L('E-2ABSENT') === 6,
  'P2.c  E-2ABSENT and E-MARKED-ABSENT are BYTE-IDENTICAL in length':
    B('E-2ABSENT') === B('E-MARKED-ABSENT'),
  'P2.d  ...and DIFFER in content (sha)': S('E-2ABSENT') !== S('E-MARKED-ABSENT'),

  /* P3 — a third content at the same byte count */
  'P3.a  E-2MARKED = 357 B (landed form EXACT)': B('E-2MARKED') === LAW(['MARKED', 'MARKED'], WANT_LEN),
  'P3.b  E-2MARKED lines = 6': L('E-2MARKED') === 6,
  'P3.c  three cells, ONE byte count':
    B('E-2MARKED') === B('E-2ABSENT') && B('E-2ABSENT') === B('E-MARKED-ABSENT'),
  'P3.d  ...and THREE distinct contents':
    new Set([S('E-2MARKED'), S('E-2ABSENT'), S('E-MARKED-ABSENT')]).size === 3,

  /* P4 — cross-harness anchor, limit declared in the pre-registration */
  'P4.a  E-GUARDED-ABSENT = 358 B (landed form EXACT)':
    B('E-GUARDED-ABSENT') === LAW(['GUARDED', 'ABSENT'], WANT_LEN),
  'P4.b  E-GUARDED-ABSENT lines = 6': L('E-GUARDED-ABSENT') === 6,
  'P4.c  reproduces unit-504 D-MIXED to the byte (358 B / 6 L), SAME-SHAPE harness':
    B('E-GUARDED-ABSENT') === 358 && L('E-GUARDED-ABSENT') === 6,

  /* P5 — bytes are a function of label WIDTH alone */
  'P5.a  the four cells read 357, 357, 357, 358':
    [B('E-MARKED-ABSENT'), B('E-2ABSENT'), B('E-2MARKED'), B('E-GUARDED-ABSENT')]
      .join(',') === '357,357,357,358',
  'P5.b  DIFFERENTIAL: MARKED->GUARDED on ONE entry, baseline and tracked set held constant, = +1 B':
    B('E-GUARDED-ABSENT') - B('E-MARKED-ABSENT') === 1,
  'P5.c  ...and that pair differs in exactly one input: the marker comment in the fixture':
    JSON.stringify(CELLS['E-MARKED-ABSENT'].baseline)
      === JSON.stringify(CELLS['E-GUARDED-ABSENT'].baseline)
    && JSON.stringify(Object.keys(CELLS['E-MARKED-ABSENT'].tracked))
      === JSON.stringify(Object.keys(CELLS['E-GUARDED-ABSENT'].tracked)),

  /* P6 — the labels are really printed (P1-P3 are not right-for-the-wrong-reason) */
  'P6.a  E-MARKED-ABSENT renders exactly one MARKED and one ABSENT':
    labelCount(lab('E-MARKED-ABSENT'), 'MARKED') === 1
    && labelCount(lab('E-MARKED-ABSENT'), 'ABSENT') === 1,
  'P6.b  E-2MARKED renders two MARKED and ZERO ABSENT':
    labelCount(lab('E-2MARKED'), 'MARKED') === 2 && labelCount(lab('E-2MARKED'), 'ABSENT') === 0,
  'P6.c  E-2ABSENT renders two ABSENT and ZERO MARKED':
    labelCount(lab('E-2ABSENT'), 'ABSENT') === 2 && labelCount(lab('E-2ABSENT'), 'MARKED') === 0,
  'P6.d  E-GUARDED-ABSENT renders exactly one GUARDED and one ABSENT, by EQUALITY not containment':
    labelCount(lab('E-GUARDED-ABSENT'), 'GUARDED') === 1
    && labelCount(lab('E-GUARDED-ABSENT'), 'ABSENT') === 1,
  'P6.e  every cell renders exactly N = 2 entry lines':
    Object.keys(CELLS).every((c) => lab(c).length === 2),

  /* P7 — the published pin pair is blind to label composition */
  'P7.a  the published BYTE law is satisfied by all three 357 cells':
    B('E-MARKED-ABSENT') === 357 && B('E-2ABSENT') === 357 && B('E-2MARKED') === 357,
  'P7.b  every path is named in all three': ['E-MARKED-ABSENT', 'E-2ABSENT', 'E-2MARKED']
    .every((c) => results[c].predicate.everyPathNamed),
  'P7.c  the count is announced in all three': ['E-MARKED-ABSENT', 'E-2ABSENT', 'E-2MARKED']
    .every((c) => results[c].predicate.countAnnounced),
  'P7.d  the non-path INTEGER multiset is IDENTICAL across all three':
    new Set(['E-MARKED-ABSENT', 'E-2ABSENT', 'E-2MARKED']
      .map((c) => JSON.stringify(results[c].predicate.nonPathIntegers))).size === 1,
  'P7.e  SO: byte law + the label-blind published clauses do NOT separate three different reds':
    B('E-MARKED-ABSENT') === B('E-2ABSENT') && B('E-2ABSENT') === B('E-2MARKED')
    && new Set(['E-MARKED-ABSENT', 'E-2ABSENT', 'E-2MARKED']
      .map((c) => JSON.stringify(results[c].predicate.nonPathIntegers))).size === 1
    && new Set([S('E-MARKED-ABSENT'), S('E-2ABSENT'), S('E-2MARKED')]).size === 3,
};

console.log(JSON.stringify({
  gateSha,
  paths: { P_M1, P_M2, P_A01, length: WANT_LEN },
  landedForm: 'bytes = 227 + SUM(len(path_i) + 19 + len(label_i)); lines = 4 + N',
  cells: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, {
    rc: v.rc,
    errBytes: v.errBytes,
    errLines: v.errLines,
    errSha: v.errSha,
    outBytes: v.outBytes,
    lsFiles: v.lsFiles,
    labels: v.labels,
    predicate: v.predicate,
  }])),
  stderrTexts: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.errText])),
  verdict,
}, null, 2));
