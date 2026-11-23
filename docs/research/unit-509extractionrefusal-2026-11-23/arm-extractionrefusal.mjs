#!/usr/bin/env node
/**
 * unit-509extractionrefusal — P1 … P5.
 *
 * Daedalus's `unit-508grainvsextraction` §2 FULLY SPECIFIED a stale-limb reader and deliberately
 * did not land it, leaving the file unblocked. This unit takes that specification as its SUBJECT:
 *
 *     capture with /^\s+(\S+)\s+→ now `([A-Z]+)`$/, compare the label by === at its own position,
 *     compare the pair SET.
 *
 * Two things his unit could not ask of itself:
 *
 *   1. `(\S+)` is DEFINED BY EXCLUDING WHITESPACE, and the emitter puts the baseline entry's PATH
 *      in that field. The baseline is read `.replace(/#.*$/,'').trim()`, so internal whitespace
 *      survives, and the stale limb renders a line for every baseline entry whose verdict is not
 *      the excluded one — INCLUDING entries that name no existing file. A baseline LINE is enough.
 *   2. His grading denominator, `entryCount`, is `entryLines(text).length` where `entryLines` is
 *      `filter((l) => LINE_RE.test(l))` — i.e. THE EXTRACTION'S OWN REGEX. If the regex refuses a
 *      rendered entry, numerator and denominator fall together and the criterion is green.
 *
 * Four cells, ONE synthetic repository, one pass. Tracked is always `P_M1`, marker declared.
 *
 *   cell        2nd baseline entry   property that entry carries in the PATH field
 *   T-CLEAN     P_A01                CONTROL — no whitespace, no vocabulary token
 *   T-COLLIDE   P_COL                a vocabulary token (Daedalus's KP, re-driven here)
 *   T-SPACE     P_SPACE              whitespace (sliced out of the emitter's own separator)
 *   T-EMBED     P_EMBED              the reader's own anchor text (separator + label + tick)
 *
 * FIVE readers over the same captured stderr, FOUR grading criteria:
 *
 *   reader       line model            label lifted by
 *   strict       his spelling          === at its own position            (the specification)
 *   lazy         (.+?) + anchored      === at its own position            (the candidate cure)
 *   containment  his spelling          line.includes(v)                   (his P2 defect, kept live)
 *   unanchored   no ^ / $              === at its own position            (mints)
 *   firstToken   lazy                  first [A-Z]+ run on the line       (mis-assigns)
 *
 *   criterion    denominator
 *   separation   how many of the 4 cells the pair SET tells apart
 *   self         entry lines counted BY THAT READER'S OWN REGEX
 *   header       the count the stale block DECLARES about itself
 *   truth        the construction inputs
 *
 * Nothing carrying a property under test is typed. The separator, the lead, the tail and the
 * fallback verdict come out of the gate's emitter template by EXECUTING it; the excluded verdict
 * out of `const stale = baseline.filter(…)`; the vocabulary out of `const LABELS = [`; the header
 * count regex out of the gate's own header template; the marked verdict out of the `if (declared)`
 * branch — a different limb from the emitter under test. No tracked file in the real repository is
 * written; the real repo is read by `git ls-files` and one baseline read.
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
const git = (cwd, args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const Q = String.fromCharCode(39);              // '
const OPEN = String.fromCharCode(123);          // {
const CLOSE = String.fromCharCode(125);         // }
const ch = (c) => `${Q}${c}${Q}`;
const CMP = (c, op) => `  if (k === ${ch(c)}) d ${op} 1;`;
const DECL = `// ${'brace-slicer'}${'-deliberate'}${':'} unit-509 fixture, a deliberate naive slicer`;

const fixtureSource = ({ marked }) => [
  marked ? DECL : '// unit-509 fixture, nothing declared at this site',
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

/* --------------------------------------------------- slice the gate's own vocabulary and emitter */
const gateBytes = readFileSync(join(ROOT, GATE_REL));
const gateSha = sha(gateBytes);
const gateSrc = gateBytes.toString('utf8');

const EMIT_ANCHOR = 'for (const f of stale) emitErr(';
const emitAt = gateSrc.indexOf(EMIT_ANCHOR);
must(emitAt !== -1, `emitter anchor not found: ${EMIT_ANCHOR}`);
const emitRest = gateSrc.slice(emitAt + EMIT_ANCHOR.length);
let depth = 0; let tEnd = -1;
for (let i = 0; i < emitRest.length; i += 1) {
  if (emitRest[i] === '(') depth += 1;
  else if (emitRest[i] === ')') { if (depth === 0) { tEnd = i - 1; break; } depth -= 1; }
}
must(tEnd > 0, 'could not bound the emitter template expression');
const EMIT_TEMPLATE = emitRest.slice(0, tEnd + 1);
const renderLine = new Function('f', 'verdicts', `return ${EMIT_TEMPLATE};`);

const STALE_ANCHOR = 'const stale = baseline.filter(';
const staleAt = gateSrc.indexOf(STALE_ANCHOR);
must(staleAt !== -1, `stale filter anchor not found: ${STALE_ANCHOR}`);
const staleStmt = gateSrc.slice(staleAt, gateSrc.indexOf('\n', staleAt));
const excMatch = staleStmt.match(new RegExp(`!==\\s*${Q}([A-Z]+)${Q}`));
must(excMatch !== null, `no quoted excluded verdict in: ${staleStmt}`);
const EXCLUDED = excMatch[1];

const LAB_ANCHOR = 'const LABELS = [';
const labAt = gateSrc.indexOf(LAB_ANCHOR);
must(labAt !== -1, `labels anchor not found: ${LAB_ANCHOR}`);
const labLit = gateSrc.slice(labAt + LAB_ANCHOR.length, gateSrc.indexOf(']', labAt));
const LABELS = labLit.split(',').map((s) => s.trim().replace(new RegExp(Q, 'g'), '')).filter(Boolean);
const absMatch = EMIT_TEMPLATE.match(new RegExp(`\\?\\?\\s*${Q}([A-Z]+)${Q}`));
must(absMatch !== null, `no quoted fallback verdict in the emitter template: ${EMIT_TEMPLATE}`);
const GONE = absMatch[1];
const VOCAB = [...LABELS, GONE];
must(VOCAB.includes(EXCLUDED), `the excluded verdict ${EXCLUDED} is not in the vocabulary`);

/** The verdict a DECLARED marker earns — sliced from the classify limb, not the emitter limb. */
const DECL_ANCHOR = 'if (declared) {';
const declAt = gateSrc.indexOf(DECL_ANCHOR);
must(declAt !== -1, `declared-branch anchor not found: ${DECL_ANCHOR}`);
const declRest = gateSrc.slice(declAt, declAt + 400);
const vtMatch = declRest.match(new RegExp(`verdicts\\.set\\(rel,\\s*${Q}([A-Z]+)${Q}`));
must(vtMatch !== null, `no quoted verdict in the declared branch: ${declRest.slice(0, 120)}`);
const V_TRACKED = vtMatch[1];
must(VOCAB.includes(V_TRACKED), `the declared-marker verdict ${V_TRACKED} is not in the vocabulary`);

/** The literal pieces of a rendered entry line, obtained by EXECUTING the gate's own emitter. */
const PROBE_PATH = 'zzzprobezzz';
const probeLine = renderLine(PROBE_PATH, new Map([[PROBE_PATH, V_TRACKED]]));
const pAt = probeLine.indexOf(PROBE_PATH);
must(pAt !== -1, `the emitter did not place the path in its output: ${JSON.stringify(probeLine)}`);
const LEAD = probeLine.slice(0, pAt);
const afterPath = probeLine.slice(pAt + PROBE_PATH.length);
const vAt = afterPath.indexOf(V_TRACKED);
must(vAt > 0, `the emitter did not place the verdict after the path: ${JSON.stringify(probeLine)}`);
const SEP = afterPath.slice(0, vAt);
const TAIL = afterPath.slice(vAt + V_TRACKED.length);
const ARROW = SEP.replace(/^\s+/, '');
const WS = SEP.match(/\s/);
must(WS !== null, `the emitter separator carries no whitespace to slice: ${JSON.stringify(SEP)}`);
must(LEAD.trim() === '' && LEAD.length > 0, `unexpected emitter lead: ${JSON.stringify(LEAD)}`);
must(TAIL.length > 0, `unexpected emitter tail: ${JSON.stringify(TAIL)}`);

/** The header's own declared count of itself — regex built out of the gate's own template. */
const HDR_NEEDLE = 'stale baseline entry/entries';
const hdrNeedleAt = gateSrc.indexOf(HDR_NEEDLE);
must(hdrNeedleAt !== -1, `header needle not found: ${HDR_NEEDLE}`);
const BTK = String.fromCharCode(96);
const hdrStart = gateSrc.lastIndexOf(BTK, hdrNeedleAt);
const hdrEnd = gateSrc.indexOf(BTK, hdrNeedleAt);
must(hdrStart !== -1 && hdrEnd > hdrStart, 'could not bound the header template literal');
const HDR_TEMPLATE = gateSrc.slice(hdrStart + 1, hdrEnd).replace(/^\\n/, '');
const COUNT_EXPR = '${stale.length}';
must(HDR_TEMPLATE.includes(COUNT_EXPR), `header template has no count expression: ${HDR_TEMPLATE}`);
const [hdrL, hdrR] = HDR_TEMPLATE.split(COUNT_EXPR);
const HDR_RE = new RegExp(`${esc(hdrL)}(\\d+)${esc(hdrR)}`);

/** The vocabulary's containment pairs, measured rather than recalled. */
const containmentPairs = [];
for (const a of VOCAB) for (const b of VOCAB) if (a !== b && b.includes(a)) containmentPairs.push([a, b]);

/* ------------------------------------------------------------------------------ fixture paths */
const WANT_LEN = 40;
const mkPath = (stem) => {
  const head = `src/${stem}`;
  const pad = WANT_LEN - head.length - '.mjs'.length;
  must(pad >= 0, `stem ${stem} is too long to pin at ${WANT_LEN}`);
  const p = `${head}${'x'.repeat(pad)}.mjs`;
  must(p.length === WANT_LEN, `path ${p} is ${p.length} long, wanted ${WANT_LEN}`);
  return p;
};
const P_M1 = mkPath('m1');
const P_A01 = mkPath('a01');
/** KP for a vocabulary token in the path field: stem IS the gate's own excluded verdict, sliced. */
const P_COL = mkPath(EXCLUDED);
/** KP for whitespace in the path field: the character comes out of the emitter's own separator. */
const P_SPACE = `src/a${WS[0]}b.mjs`;
/** KP for the reader's own anchor text in the path field: separator + a label + tail, all sliced. */
const P_EMBED = `src/a${SEP}${LABELS[0]}${TAIL}.mjs`;

must(P_COL.includes(EXCLUDED), `the collide path does not carry ${EXCLUDED}: ${P_COL}`);
must(/\s/.test(P_SPACE), `the space path carries no whitespace: ${JSON.stringify(P_SPACE)}`);
must(P_EMBED.includes(ARROW), `the embed path does not carry the reader's anchor: ${P_EMBED}`);
must(!/#/.test(P_SPACE + P_EMBED), 'a KP path carries `#`, which the baseline reader would strip');
must(P_SPACE.trim() === P_SPACE && P_EMBED.trim() === P_EMBED, 'a KP path would be altered by trim()');
const ALL_PATHS = [P_M1, P_A01, P_COL, P_SPACE, P_EMBED];
must(new Set(ALL_PATHS).size === ALL_PATHS.length, 'fixture paths are not distinct');
/** Only files that can exist on disk are ever written; the KP entries are baseline-only. */
const WRITABLE = new Set([P_M1, P_A01, P_COL]);

/* ------------------------------------------------------------------------------- the readers */
const RE_STRICT = new RegExp(`^\\s+(\\S+)\\s+${esc(ARROW)}([A-Z]+)${esc(TAIL)}\\s*$`);
const RE_LAZY = new RegExp(`^\\s+(.+?)\\s+${esc(ARROW)}([A-Z]+)${esc(TAIL)}\\s*$`);
const RE_UNANCHORED = new RegExp(`(\\S+)\\s+${esc(ARROW)}([A-Z]+)${esc(TAIL)}`);
const RE_UNANCHORED_G = new RegExp(RE_UNANCHORED.source, 'g');
const FIRST_TOKEN = /[A-Z]+/;

/** Positive control on the reconstruction: strict must read a clean rendered line exactly. */
{
  const cl = renderLine(P_M1, new Map([[P_M1, V_TRACKED]]));
  const m = cl.match(RE_STRICT);
  must(m !== null && m[1] === P_M1 && m[2] === V_TRACKED,
    `reconstructed strict reader does not read a clean emitted line: ${JSON.stringify(cl)}`);
  must(cl.match(RE_LAZY)?.[1] === P_M1, 'reconstructed lazy reader does not read a clean emitted line');
}

const pair = (p, v) => `${p}\t${v}`;
const asSet = (ps) => [...new Set(ps)].sort();
const labelByEquality = (captured) => {
  const hit = VOCAB.filter((v) => captured === v);
  must(hit.length <= 1, `equality matched ${hit.length} labels for one captured token`);
  return hit.length === 1 ? hit[0] : `UNKNOWN(${captured})`;
};
const linesOf = (text) => text.split('\n');

function readWith(text, re) {
  const pairs = []; const paths = []; const labels = [];
  for (const line of linesOf(text)) {
    const m = line.match(re);
    if (!m) continue;
    pairs.push(pair(m[1], labelByEquality(m[2])));
    paths.push(m[1]); labels.push(m[2]);
  }
  return { pairs, paths, labels, lineCount: pairs.length };
}

/** CONTAINMENT: his strict line model, label lifted by `includes` over the whole line. */
function readByContainment(text) {
  const pairs = []; const labels = [];
  let lineCount = 0;
  for (const line of linesOf(text)) {
    const m = line.match(RE_STRICT);
    if (!m) continue;
    lineCount += 1;
    for (const v of VOCAB) if (line.includes(v)) { pairs.push(pair(m[1], v)); labels.push(v); }
  }
  return { pairs, paths: [], labels, lineCount };
}

/** FIRST TOKEN: the lazy line model (so the refusal mechanism is not conflated with this one). */
function readByFirstToken(text, re) {
  const pairs = []; const labels = [];
  let lineCount = 0;
  for (const line of linesOf(text)) {
    const m = line.match(re);
    if (!m) continue;
    lineCount += 1;
    const tok = line.match(FIRST_TOKEN);
    pairs.push(pair(m[1], labelByEquality(tok ? tok[0] : '')));
    labels.push(tok ? tok[0] : '');
  }
  return { pairs, paths: [], labels, lineCount };
}

/** UNANCHORED, every match on the line rather than the first — recorded, not graded by P4.a. */
function readUnanchoredGlobal(text) {
  const pairs = [];
  let lineCount = 0;
  for (const line of linesOf(text)) {
    const ms = [...line.matchAll(RE_UNANCHORED_G)];
    if (!ms.length) continue;
    lineCount += 1;
    for (const m of ms) pairs.push(pair(m[1], labelByEquality(m[2])));
  }
  return { pairs, paths: [], labels: [], lineCount };
}

/* ------------------------------------------------------------------------- the synthetic repo */
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
  git(SYN, ['config', 'user.email', 'theseus@local']);
  git(SYN, ['config', 'user.name', 'unit-509 synthetic']);
}

function setTracked(tracked) {
  for (const p of ALL_PATHS) {
    if (!WRITABLE.has(p)) continue;
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
  /** The gate's own baseline reader, applied here, so a KP that it would alter cannot pass silently. */
  const asGateReads = readFileSync(join(SYN, BASE_REL), 'utf8').split('\n')
    .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
  must(JSON.stringify(asGateReads) === JSON.stringify(entries),
    `the gate's baseline reader alters these entries: ${JSON.stringify(asGateReads)}`);
}

const byteLines = (buf) => {
  if (!buf.length) return 0;
  const s = buf.toString('utf8');
  return s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
};

function drive(cell, baseline, tracked) {
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, `gate copy drifted before ${cell}`);
  const r = spawnSync(process.execPath, [join(SYN, GATE_REL)], { cwd: SYN, maxBuffer: 1 << 26 });
  writeFileSync(join(CAP, `${cell}.out`), r.stdout);
  writeFileSync(join(CAP, `${cell}.err`), r.stderr);
  const errText = r.stderr.toString('utf8');
  const hdr = errText.match(HDR_RE);
  const readers = {
    strict: readWith(errText, RE_STRICT),
    lazy: readWith(errText, RE_LAZY),
    containment: readByContainment(errText),
    unanchored: readWith(errText, RE_UNANCHORED),
    firstToken: readByFirstToken(errText, RE_LAZY),
    firstTokenStrict: readByFirstToken(errText, RE_STRICT),
    unanchoredGlobal: readUnanchoredGlobal(errText),
  };
  /** TRUTH: the construction inputs. Verdict sliced from the classify limb, not from any reader. */
  const truth = baseline.map((p) => pair(p, Object.hasOwn(tracked, p) ? V_TRACKED : GONE));
  return {
    rc: r.status,
    errBytes: r.stderr.length,
    errLines: byteLines(r.stderr),
    errSha: r.stderr.length ? sha(r.stderr) : null,
    headerCount: hdr ? Number(hdr[1]) : null,
    renderedLines: linesOf(errText).filter((l) => l.includes(ARROW)).length,
    errText,
    readers,
    truth,
  };
}

/* ------------------------------------------------------------------------------------- drive */
const CELLS = [
  ['T-CLEAN', { [P_M1]: { marked: true } }, [P_A01, P_M1]],
  ['T-COLLIDE', { [P_M1]: { marked: true } }, [P_COL, P_M1]],
  ['T-SPACE', { [P_M1]: { marked: true } }, [P_SPACE, P_M1]],
  ['T-EMBED', { [P_M1]: { marked: true } }, [P_EMBED, P_M1]],
];
const R = {};
const populations = {};
try {
  buildRepo();
  for (const [cell, tracked, baseline] of CELLS) {
    populations[cell] = setTracked(tracked);
    setBaseline(baseline);
    R[cell] = drive(cell, baseline, tracked);
  }
} finally {
  rmSync(join(UNIT, 'scratch'), { recursive: true, force: true });
}

const NAMES = CELLS.map(([c]) => c);
const READERS = ['strict', 'lazy', 'containment', 'unanchored', 'firstToken'];
const SPACEFREE = ['T-CLEAN', 'T-COLLIDE'];
const SPACEY = ['T-SPACE', 'T-EMBED'];
const NONCOLLIDE = NAMES.filter((c) => c !== 'T-COLLIDE');

/* ---------------------------------------------------------------- the 4 criteria, per reader */
const critSelf = (c, k) => R[c].readers[k].pairs.length === R[c].readers[k].lineCount;
const critHeader = (c, k) => R[c].readers[k].pairs.length === R[c].headerCount;
const critTruth = (c, k) => JSON.stringify(asSet(R[c].readers[k].pairs)) === JSON.stringify(asSet(R[c].truth));
const sepOf = (k) => new Set(NAMES.map((c) => JSON.stringify(asSet(R[c].readers[k].pairs)))).size;

/* ================================================================================== GRADING */
const G = [];
const grade = (id, claim, pass, detail) => { G.push({ id, claim, verdict: pass ? 'HIT' : 'REFUTED', detail }); };
const eqMs = (c) => R[c].readers.strict.labels.map(labelByEquality).slice().sort();
const coMs = (c) => R[c].readers.containment.labels.slice().sort();

/* --- P1: his routed figures, reproduced under my own drive --------------------------------- */
grade('P1.a.eq', 'T-COLLIDE equality reads exactly 2 labels',
  eqMs('T-COLLIDE').length === 2, eqMs('T-COLLIDE').join(','));
grade('P1.a.co', 'T-COLLIDE containment reads exactly 4 labels',
  coMs('T-COLLIDE').length === 4, coMs('T-COLLIDE').join(','));
grade('P1.a.sup', 'the containment multiset is a strict superset of the equality one',
  coMs('T-COLLIDE').length > eqMs('T-COLLIDE').length
    && eqMs('T-COLLIDE').every((l) => coMs('T-COLLIDE').includes(l)),
  `${eqMs('T-COLLIDE').length} -> ${coMs('T-COLLIDE').length}`);
grade('P1.b.over', 'containment pair extraction EXCEEDS the rendered entry count on T-COLLIDE and only there',
  R['T-COLLIDE'].readers.containment.pairs.length > R['T-COLLIDE'].renderedLines
    && NONCOLLIDE.every((c) => R[c].readers.containment.pairs.length <= R[c].renderedLines),
  JSON.stringify(Object.fromEntries(NAMES.map((c) =>
    [c, `${R[c].readers.containment.pairs.length}/${R[c].renderedLines}`]))));
const minted = asSet(R['T-COLLIDE'].readers.containment.pairs).filter((p) => p.split('\t')[1] === EXCLUDED);
grade('P1.b.mint', `containment mints exactly one pair labelled ${EXCLUDED}, which no line renders`,
  minted.length === 1 && !asSet(R['T-COLLIDE'].readers.strict.pairs).some((p) => p.split('\t')[1] === EXCLUDED),
  `minted: ${JSON.stringify(minted)}`);
grade('P1.c', 'the containment-extracted pair set separates the SAME number of cells as the correct extraction',
  sepOf('containment') === sepOf('lazy'), `containment ${sepOf('containment')} of 4 · lazy ${sepOf('lazy')} of 4`);
grade('P1.d', 'CONTROL: on every cell with no vocabulary token in a path, equality and containment agree exactly',
  NONCOLLIDE.every((c) => JSON.stringify(eqMs(c)) === JSON.stringify(coMs(c))),
  JSON.stringify(Object.fromEntries(NONCOLLIDE.map((c) => [c, [eqMs(c), coMs(c)]]))));

/* --- P2: the specified extraction REFUSES, silently ---------------------------------------- */
grade('P2.a', 'on T-SPACE the header declares 2 stale entries and `strict` extracts exactly 1 pair',
  R['T-SPACE'].headerCount === 2 && R['T-SPACE'].readers.strict.pairs.length === 1,
  `header ${R['T-SPACE'].headerCount} · strict ${R['T-SPACE'].readers.strict.pairs.length} · `
  + `rendered ${R['T-SPACE'].renderedLines}`);
grade('P2.b', 'NO captured path contains whitespace, on any cell, under any reader',
  NAMES.every((c) => READERS.every((k) => R[c].readers[k].pairs
    .every((p) => !/\s/.test(p.split('\t')[0])))),
  JSON.stringify(Object.fromEntries(NAMES.map((c) => [c, R[c].readers.lazy.pairs
    .filter((p) => /\s/.test(p.split('\t')[0])).length]))));
grade('P2.c', 'on T-EMBED the header declares 2 and `strict` extracts exactly 1',
  R['T-EMBED'].headerCount === 2 && R['T-EMBED'].readers.strict.pairs.length === 1,
  `header ${R['T-EMBED'].headerCount} · strict ${R['T-EMBED'].readers.strict.pairs.length} · `
  + `rendered ${R['T-EMBED'].renderedLines}`);
grade('P2.d.count', '`lazy` extracts exactly the header count on all four cells',
  NAMES.every((c) => critHeader(c, 'lazy')),
  JSON.stringify(Object.fromEntries(NAMES.map((c) => [c, `${R[c].readers.lazy.pairs.length}/${R[c].headerCount}`]))));
grade('P2.d.truth', '`lazy`\'s pair set equals the CONSTRUCTION GROUND TRUTH on all four cells',
  NAMES.every((c) => critTruth(c, 'lazy')),
  JSON.stringify(Object.fromEntries(NAMES.map((c) => [c, critTruth(c, 'lazy')]))));
grade('P2.e', 'CONTROL: on the whitespace-free cells `strict` and `lazy` are identical — a widening, not a rewrite',
  SPACEFREE.every((c) => JSON.stringify(R[c].readers.strict.pairs) === JSON.stringify(R[c].readers.lazy.pairs)),
  JSON.stringify(Object.fromEntries(SPACEFREE.map((c) =>
    [c, `${R[c].readers.strict.pairs.length}=${R[c].readers.lazy.pairs.length}`]))));
grade('P2.f', '`strict` separates 3 of 4 — T-SPACE and T-EMBED collapse to one pair set under it',
  sepOf('strict') === 3
    && JSON.stringify(asSet(R['T-SPACE'].readers.strict.pairs))
      === JSON.stringify(asSet(R['T-EMBED'].readers.strict.pairs)),
  `strict ${sepOf('strict')} of 4 · lazy ${sepOf('lazy')} of 4 · containment ${sepOf('containment')} of 4`);

/* --- P3: a criterion keyed on the extraction's own regex cannot see a refusal --------------- */
grade('P3.a', 'on T-SPACE, `self` is GREEN for `strict` while `header` is RED',
  critSelf('T-SPACE', 'strict') === true && critHeader('T-SPACE', 'strict') === false,
  `self ${critSelf('T-SPACE', 'strict')} · header ${critHeader('T-SPACE', 'strict')}`);
grade('P3.b', 'on T-EMBED, `self` is GREEN for `strict` while `header` is RED',
  critSelf('T-EMBED', 'strict') === true && critHeader('T-EMBED', 'strict') === false,
  `self ${critSelf('T-EMBED', 'strict')} · header ${critHeader('T-EMBED', 'strict')}`);
grade('P3.c', 'CONTROL: on the whitespace-free cells `self` and `header` agree for `strict`, both green',
  SPACEFREE.every((c) => critSelf(c, 'strict') && critHeader(c, 'strict')),
  JSON.stringify(Object.fromEntries(SPACEFREE.map((c) =>
    [c, `${critSelf(c, 'strict')}/${critHeader(c, 'strict')}`]))));
grade('P3.d', '`self` is RED for `containment` on T-COLLIDE — blind to refusal, not simply dead',
  critSelf('T-COLLIDE', 'containment') === false,
  `self ${critSelf('T-COLLIDE', 'containment')} · pairs ${R['T-COLLIDE'].readers.containment.pairs.length}`
  + ` · lines ${R['T-COLLIDE'].readers.containment.lineCount}`);

/* --- P4: header reconciliation is necessary and NOT sufficient ------------------------------ */
grade('P4.a', '`unanchored` passes BOTH `self` and `header` on all four cells',
  NAMES.every((c) => critSelf(c, 'unanchored') && critHeader(c, 'unanchored')),
  JSON.stringify(Object.fromEntries(NAMES.map((c) =>
    [c, `${critSelf(c, 'unanchored')}/${critHeader(c, 'unanchored')}`]))));
const baseEmbed = new Set([P_EMBED, P_M1]);
const unanchoredMint = asSet(R['T-EMBED'].readers.unanchored.pairs).filter((p) => !baseEmbed.has(p.split('\t')[0]));
grade('P4.b', '`unanchored` MINTS a pair on T-EMBED whose path is not a baseline entry, and `truth` reddens it',
  unanchoredMint.length >= 1 && critTruth('T-EMBED', 'unanchored') === false,
  `minted: ${JSON.stringify(unanchoredMint)} · truth ${critTruth('T-EMBED', 'unanchored')}`);
grade('P4.c.count', '`firstToken` passes BOTH `self` and `header` on all four cells',
  NAMES.every((c) => critSelf(c, 'firstToken') && critHeader(c, 'firstToken')),
  JSON.stringify(Object.fromEntries(NAMES.map((c) =>
    [c, `${critSelf(c, 'firstToken')}/${critHeader(c, 'firstToken')}`]))));
const ftCollide = asSet(R['T-COLLIDE'].readers.firstToken.pairs).filter((p) => p.split('\t')[1] === EXCLUDED);
grade('P4.c.assign', `\`firstToken\` assigns ${EXCLUDED} to the token-bearing path on T-COLLIDE, and \`truth\` reddens it`,
  ftCollide.length === 1 && critTruth('T-COLLIDE', 'firstToken') === false,
  `${JSON.stringify(ftCollide)} · truth ${critTruth('T-COLLIDE', 'firstToken')}`);
const MECH = {
  'over-report (containment)': 'containment',
  'refuse (strict)': 'strict',
  'mint (unanchored)': 'unanchored',
  'mis-assign (firstToken)': 'firstToken',
};
const reddens = (crit) => Object.entries(MECH)
  .filter(([, k]) => NAMES.some((c) => crit(c, k) === false)).map(([m]) => m);
const CRITS = {
  self: critSelf, header: critHeader, truth: critTruth,
};
const redTable = Object.fromEntries(Object.entries(CRITS).map(([n, f]) => [n, reddens(f)]));
redTable.separation = Object.entries(MECH)
  .filter(([, k]) => sepOf(k) !== sepOf('lazy')).map(([m]) => m);
grade('P4.d', 'exactly ONE of the four criteria reddens all four defect mechanisms, and it is `truth`',
  redTable.truth.length === 4
    && ['self', 'header', 'separation'].every((n) => redTable[n].length < 4),
  JSON.stringify(redTable));

/* --- P5: reach, measured, and the class this unit joins ------------------------------------ */
const readAt = spawnSync('date', ['+%Y-%m-%d %H:%M:%S %Z'], { encoding: 'utf8' }).stdout.trim();
const baseRaw = readFileSync(join(ROOT, BASE_REL), 'utf8');
const baseNonEmpty = baseRaw.split('\n').filter((l) => l.trim().length > 0);
const baseComments = baseNonEmpty.filter((l) => l.trim().startsWith('#'));
const baseEntries = baseNonEmpty.filter((l) => !l.trim().startsWith('#')).map((l) => l.trim());
const spaceyEntries = baseEntries.filter((l) => /\s/.test(l));
grade('P5.a', 'live baseline entries carrying whitespace: reported, and REACH only if empty',
  true, `${spaceyEntries.length} of ${baseEntries.length} entries · ${JSON.stringify(spaceyEntries)}`);
const tracked = git(ROOT, ['ls-files']).stdout.split('\n').filter(Boolean);
const spaceyTracked = tracked.filter((p) => /\s/.test(p));
grade('P5.b', 'live tracked paths carrying whitespace: reported at a date-read time',
  true, `${spaceyTracked.length} of ${tracked.length} tracked at ${readAt} · ${JSON.stringify(spaceyTracked.slice(0, 5))}`);
const myCaptures = NAMES.flatMap((c) => [`${c}.out`, `${c}.err`]);
grade('P5.c', 'this unit\'s own cell names and capture filenames carry NO vocabulary token',
  myCaptures.every((f) => !VOCAB.some((v) => f.includes(v))),
  JSON.stringify(myCaptures.filter((f) => VOCAB.some((v) => f.includes(v)))));

/* ===================================================================================== REPORT */
const hits = G.filter((g) => g.verdict === 'HIT').length;
const out = {
  unit: 'unit-509extractionrefusal',
  readAt,
  gateSha,
  vocabulary: VOCAB,
  excludedVerdict: EXCLUDED,
  declaredMarkerVerdict: V_TRACKED,
  fallbackVerdict: GONE,
  containmentPairs,
  emitter: { lead: LEAD, sep: SEP, arrow: ARROW, tail: TAIL },
  headerRegex: HDR_RE.source,
  readers: {
    strict: RE_STRICT.source, lazy: RE_LAZY.source, unanchored: RE_UNANCHORED.source,
  },
  kpPaths: {
    collide: P_COL, space: P_SPACE, embed: P_EMBED, m1: P_M1, a01: P_A01,
  },
  cells: Object.fromEntries(NAMES.map((c) => [c, {
    rc: R[c].rc,
    errBytes: R[c].errBytes,
    errLines: R[c].errLines,
    errSha: R[c].errSha ? R[c].errSha.slice(0, 8) : null,
    headerCount: R[c].headerCount,
    renderedLines: R[c].renderedLines,
    truth: R[c].truth,
    population: populations[c],
    readers: Object.fromEntries(Object.entries(R[c].readers).map(([k, v]) => [k, {
      pairs: asSet(v.pairs), count: v.pairs.length, lineCount: v.lineCount,
    }])),
    criteria: Object.fromEntries(READERS.map((k) => [k, {
      self: critSelf(c, k), header: critHeader(c, k), truth: critTruth(c, k),
    }])),
  }])),
  separation: Object.fromEntries([...READERS, 'firstTokenStrict', 'unanchoredGlobal']
    .map((k) => [k, `${sepOf(k)} of 4`])),
  rednessByCriterion: redTable,
  liveBaseline: {
    nonEmptyLines: baseNonEmpty.length,
    commentLines: baseComments.length,
    realEntries: baseEntries.length,
    whitespaceBearingEntries: spaceyEntries,
  },
  trackedWhitespace: { tracked: tracked.length, count: spaceyTracked.length },
  grades: G,
  summary: `${hits} of ${G.length} HIT`,
};
writeFileSync(join(CAP, 'P1-P5-arm.json'), `${JSON.stringify(out, null, 2)}\n`);

console.log(`unit-509extractionrefusal — read at ${readAt}`);
console.log(`gate sha ${gateSha.slice(0, 8)} · vocabulary ${JSON.stringify(VOCAB)} · excluded ${EXCLUDED}`
  + ` · declared-marker verdict ${V_TRACKED}`);
console.log(`emitter pieces, by execution: lead=${JSON.stringify(LEAD)} sep=${JSON.stringify(SEP)}`
  + ` tail=${JSON.stringify(TAIL)}`);
console.log(`KP paths: collide=${P_COL}\n          space=${JSON.stringify(P_SPACE)}`
  + `\n          embed=${JSON.stringify(P_EMBED)}\n`);
console.log('  cell        bytes lines rc  sha       header rendered  strict lazy cont unanch first');
for (const c of NAMES) {
  const r = R[c];
  console.log(
    `  ${c.padEnd(11)} ${String(r.errBytes).padStart(4)}  ${String(r.errLines).padStart(4)}  ${r.rc}  `
    + `${(r.errSha || '-').slice(0, 8)}  ${String(r.headerCount).padStart(5)} `
    + `${String(r.renderedLines).padStart(8)}  ${READERS.map((k) =>
      String(r.readers[k].pairs.length).padStart(6)).join('')}`,
  );
}
console.log('\nCRITERIA (self / header / truth), per reader per cell — `.` green, `R` RED:');
console.log(`  ${'cell'.padEnd(11)} ${READERS.map((k) => k.padEnd(13)).join('')}`);
for (const c of NAMES) {
  console.log(`  ${c.padEnd(11)} ${READERS.map((k) => {
    const x = (b) => (b ? '.' : 'R');
    return `${x(critSelf(c, k))}${x(critHeader(c, k))}${x(critTruth(c, k))}`.padEnd(13);
  }).join('')}`);
}
console.log('\nSEPARATION (of 4):');
for (const [k, v] of Object.entries(out.separation)) console.log(`  ${k.padEnd(20)} ${v}`);
console.log('\nWHICH DEFECT MECHANISMS EACH CRITERION REDDENS ANYWHERE:');
for (const [k, v] of Object.entries(redTable)) {
  console.log(`  ${k.padEnd(12)} ${v.length} of 4  ${JSON.stringify(v)}`);
}
console.log(`\nlive baseline: ${baseNonEmpty.length} non-empty = ${baseComments.length} comments`
  + ` + ${baseEntries.length} entries · whitespace-bearing ${spaceyEntries.length}`);
console.log(`live tracked paths with whitespace: ${spaceyTracked.length} of ${tracked.length}`);
console.log('\nGRADES');
for (const g of G) console.log(`  ${g.verdict.padEnd(8)} ${g.id.padEnd(12)} ${g.claim}\n           ${g.detail}`);
console.log(`\n${out.summary}`);
if (hits !== G.length) process.exitCode = 1;
