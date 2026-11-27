/**
 * unit-529defaultparam — the arm.
 *
 * `bindingOf` in the frozen `docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs`
 * matches `^[ \t]*(?:export\s+)?(?:const|let|var)\s+NAME…`, so a DEFAULT PARAMETER
 * (`function f(seen = new Set<string>())`) binds nothing and every use site of `seen` is
 * `UNRESOLVED`.
 *
 * Pre-registration: `PRE-REGISTRATION.md`, clock `2026-11-27 13:19:51 PST`, population SHA
 * `252a5cfdf5aa`, committed and pushed as `56b394c3` BEFORE this file existed. 15 predictions.
 *
 * ## A full 2×2, because the boarded price of "2 members" turned out to be conditional
 *
 * Two cures, each sliced into the frozen reader, instantiated in all four combinations:
 *
 *   - `D` — the default-parameter binding form, registered verbatim in §2 of the pre-registration.
 *   - `G` — `unit-527setgeneric`'s four substitutions, NOT retyped: the `GENERIC_SRC` + `SUBS`
 *           region is sliced out of `unit-527`'s own arm file as TEXT and instantiated, so this
 *           unit cannot drift from the cure whose figures it reuses.
 *
 * `PUB` (neither) · `DEF` (D) · `GEN` (G) · `BOTH` (D+G). The frozen file is never written.
 *
 * ## Two controls
 *
 * 1. The frozen arm driven UNCHANGED as a child process at this SHA, compared to `PUB` cell for
 *    cell. A slice that cannot reproduce its source grades nothing.
 * 2. CROSS-UNIT: `GEN` must reproduce `unit-527`'s published post-cure figures. This control is
 *    only valid at an unmoved population, so it is asserted when the corpus size and `PUB`'s class
 *    table match `unit-527`'s, and REPORTED (not silently passed) when they do not. A conditional
 *    cell that passes by skipping is a vacuous cell, so the condition is printed either way.
 *
 * ## Every firing of cure D is printed
 *
 * `LD4` (the `[(,]` class admits a non-parameter) is not cured and not excluded by key. Instead
 * every `(name, line, rhs)` at which the cure fires is pushed to a log and printed whole, so a
 * reader can audit the class of every one. `K11` plants the harm and asserts it fires.
 *
 * ## No display field, and no character comparison against a brace
 *
 * Every member line prints WHOLE. There is no `'{'` or `'}'` character literal anywhere in this
 * file, so it is out of the brace-slicer gate's population by construction rather than by
 * exemption — verified by searching this file, which is how that claim should always be checked.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

// ─── §0 attributability ─────────────────────────────────────────────────────────────────────────

const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') {
  throw new Error(`§0: packages/ or scripts/ is dirty, so no figure here is attributable:\n${dirty}`);
}
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();
const PREREG_SHA = '252a5cfdf5aa';

const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const DONOR = 'docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs';
for (const f of [FROZEN, DONOR]) {
  const d = sh(`git diff --stat HEAD -- ${f}`).trim();
  if (d !== '') throw new Error(`§0: ${f} is modified in the worktree:\n${d}`);
}
const frozenText = readFileSync(`${ROOT}${FROZEN}`, 'utf8');
const donorText = readFileSync(`${ROOT}${DONOR}`, 'utf8');
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

const pad = (s, n) => String(s).padEnd(n, ' ');
const tally = (rows, k) => {
  const out = {};
  for (const r of rows) out[r[k]] = (out[r[k]] || 0) + 1;
  return out;
};
const occ = (hay, needle) => hay.split(needle).length - 1;
const sliceBetween = (text, startLit, endLit, label) => {
  for (const [n, lit] of [[`${label}.start`, startLit], [`${label}.end`, endLit]]) {
    const c = occ(text, lit);
    if (c !== 1) throw new Error(`anchor ${n} occurs ${c} times, not once: ${JSON.stringify(lit)}`);
  }
  const a = text.indexOf(startLit);
  const b = text.indexOf(endLit);
  if (b <= a) throw new Error(`${label}: anchors are out of order`);
  return text.slice(a, b);
};

// ─── the slice of the frozen reader ─────────────────────────────────────────────────────────────

const SLICED = sliceBetween(
  frozenText,
  "const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];",
  '// ─── Arm B ',
  'SLICE',
);

// ─── cure G: read out of unit-527's arm, not retyped ────────────────────────────────────────────

const DONOR_REGION = sliceBetween(
  donorText,
  'const GENERIC_SRC = ',
  '\nlet CURED_TEXT = SLICED;',
  'DONOR',
);
// eslint-disable-next-line no-new-func
const donorGet = new Function(`${DONOR_REGION}\nreturn [GENERIC_SRC, SUBS];`);
const [GENERIC_SRC, GSUBS] = donorGet();
if (typeof GENERIC_SRC !== 'string' || !Array.isArray(GSUBS) || GSUBS.length !== 4) {
  throw new Error(`donor region did not yield GENERIC_SRC + 4 SUBS: got ${typeof GENERIC_SRC}, ${GSUBS && GSUBS.length}`);
}

// ─── cure D: registered verbatim in §2 of the pre-registration ──────────────────────────────────

const PARAM_SRC = '[(,]\\s*NAME\\s*(?::[^=,)\\n]*)?=\\s*(.*)$';

const DSUB = {
  id: 'D1  bindingOf: fall through to a DEFAULT PARAMETER when no declaration matches',
  from: `  const m = re.exec(code);
  if (!m) return null;
  return { rhs: m[1], line: lineOf(code, m.index) };`,
  to: `  const m = re.exec(code);
  if (m) return { rhs: m[1], line: lineOf(code, m.index) };
  const _pre = new RegExp(${JSON.stringify(PARAM_SRC)}.replace('NAME', name.replace(/[$]/g, '\\\\$')), 'm');
  const _pm = _pre.exec(code);
  if (!_pm) return null;
  const _pl = lineOf(code, _pm.index);
  __firings.push({ name, line: _pl, rhs: _pm[1] });
  return { rhs: _pm[1], line: _pl };`,
};

const applySubs = (text, subs, label) => {
  let out = text;
  for (const s of subs) {
    const n = occ(out, s.from);
    if (n !== 1) throw new Error(`${label} / ${s.id}: anchor occurs ${n} times in the slice, not once`);
    out = out.replace(s.from, () => s.to);
    const after = occ(out, s.to);
    if (after !== 1) throw new Error(`${label} / ${s.id}: replacement occurs ${after} times after substitution, not once`);
  }
  return out;
};

const TEXT = {
  PUB: SLICED,
  DEF: applySubs(SLICED, [DSUB], 'DEF'),
  GEN: applySubs(SLICED, GSUBS, 'GEN'),
  BOTH: applySubs(applySubs(SLICED, [DSUB], 'BOTH.D'), GSUBS, 'BOTH.G'),
};

// ─── instantiation ──────────────────────────────────────────────────────────────────────────────

const RETURN = `
  return { armA, keyIndirect, setTailIndices, bindingOf, receiverSpan, corpus, read,
           CODE_EXT, NEEDLE, SIZE_CMP, direction, lineOf, parenSpanEnd };
`;
const FIRINGS = { PUB: [], DEF: [], GEN: [], BOTH: [] };
const instantiate = (label) => {
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('stripSource', 'parenSpanEnd', 'sh', 'readFileSync', 'ROOT', '__firings',
      TEXT[label] + RETURN);
    return f(stripSource, parenSpanEnd, sh, readFileSync, ROOT, FIRINGS[label]);
  } catch (e) {
    throw new Error(`instantiating the ${label} slice failed: ${e.message}`);
  }
};
const LABELS = ['PUB', 'DEF', 'GEN', 'BOTH'];
const INST = {};
for (const l of LABELS) INST[l] = instantiate(l);

const popSizes = LABELS.map((l) => INST[l].corpus.length);
if (new Set(popSizes).size !== 1) {
  throw new Error(`the four instantiations disagree on the population: ${popSizes.join(' / ')}`);
}
const CORPUS = INST.PUB.corpus;

// ─── KP / KN cells, all four instantiations ─────────────────────────────────────────────────────

const keyFixture = (inst, code) => {
  const tails = inst.setTailIndices(code);
  const ms = [...code.matchAll(inst.SIZE_CMP)];
  if (ms.length !== 1) return `NO-SITE(${ms.length} matches)`;
  const m = ms[0];
  if (tails.has(m.index)) return 'EXCLUDED';
  return inst.keyIndirect(code, code, '<fixture>', m);
};
const shape = (r) => (typeof r === 'string' ? r : `${r.cls}/${r.dir}${r.guard ? `/${r.guard}` : ''}`);

const KP = [];
const cell = (name, code, want) => {
  const got = {};
  for (const l of LABELS) got[l] = shape(keyFixture(INST[l], code));
  const ok = LABELS.every((l) => got[l] === want[l]);
  KP.push({
    name,
    ok,
    want: LABELS.map((l) => `${l}=${want[l]}`).join('  '),
    got: LABELS.map((l) => `${l}=${got[l]}`).join('  '),
  });
};
const all4 = (v) => ({ PUB: v, DEF: v, GEN: v, BOTH: v });
const SB = 'SET-BOUND/INVARIANCE/BLIND';
const OB = 'OTHER-BOUND/INVARIANCE';
const UR = 'UNRESOLVED/INVARIANCE';

cell('K1  regression: a plain bound Set is SET-BOUND under all four',
  'const kpSet = new Set(kpArr);\nif (kpSet.size === 1) kpGo();\n', all4(SB));

cell('K2  cure G alone: a GENERIC bound Set — OTHER-BOUND until G is present',
  'const kpGen = new Set<string>(kpArr);\nif (kpGen.size === 1) kpGo();\n',
  { PUB: OB, DEF: OB, GEN: SB, BOTH: SB });

cell("K3  CURE D's KNOWN POSITIVE: a PLAIN Set as a default parameter — D alone reaches it",
  'function kpf(kpSeen = new Set()) {\n  if (kpSeen.size === 1) kpGo();\n}\n',
  { PUB: UR, DEF: SB, GEN: UR, BOTH: SB });

cell("K4  THE MEMBERS' OWN SHAPE (P2/P3/P4): a GENERIC Set as a default parameter",
  'function kpf(kpSeen = new Set<string>()) {\n  if (kpSeen.size === 1) kpGo();\n}\n',
  { PUB: UR, DEF: OB, GEN: UR, BOTH: SB });

cell('K5  a parameter with NO default and no binding — UNRESOLVED under all four (Theseus’s class)',
  'function kpf(kpP) {\n  if (kpP.size === 1) kpGo();\n}\n', all4(UR));

cell('K6  P12 / LD5: an array-destructuring DECLARATION stays UNRESOLVED under all four',
  'const [kpA, kpB] = [new Set(), new Set()];\nif (kpB.size === 1) kpGo();\n', all4(UR));

cell('K7  P13 / LD5: a DESTRUCTURED parameter with no default stays UNRESOLVED under all four',
  'const kpR = kpRows.map(([kpK, kpS]) => kpS.size === 1);\n', all4(UR));

cell('K8  P5 additivity: a real declaration still WINS over a later default parameter',
  'const kpX = new Map(kpArr);\nfunction kpf(kpX = new Set()) {\n  return kpNoop(kpX);\n}\nif (kpX.size === 1) kpGo();\n',
  all4('MAP-BOUND/INVARIANCE'));

cell("K9  LD2, KNOWN POSITIVE FOR CURE D'S OWN HARM: a default in fn A binds a use in fn B",
  'function kpA(kpSeen = new Set(kpArr)) {\n  return kpNoop(kpSeen);\n}\nfunction kpB(kpSeen) {\n  if (kpSeen.size === 1) kpGo();\n}\n',
  { PUB: UR, DEF: SB, GEN: UR, BOTH: SB });

cell('K10 LD1, declared limit: a type annotation containing a comma defeats cure D',
  'function kpf(kpA: Map<string, number> = new Set()) {\n  if (kpA.size === 1) kpGo();\n}\n',
  all4(UR));

cell('K11 LD4, KNOWN POSITIVE FOR THE OVER-WIDE `[(,]` CLASS: an assignment in CALL position',
  'kpCall(kpQ = new Set(kpArr));\nif (kpQ.size === 1) kpGo();\n',
  { PUB: UR, DEF: SB, GEN: UR, BOTH: SB });

cell('K12 the guard arm survives cure D: a guarded default parameter is GUARDED, not BLIND',
  'function kpf(kpG = new Set(kpXs != null ? kpXs : [])) {\n  if (kpG.size === 1) kpGo();\n}\n',
  { PUB: UR, DEF: 'SET-BOUND/INVARIANCE/GUARDED', GEN: UR, BOTH: 'SET-BOUND/INVARIANCE/GUARDED' });

cell('K13 direction is untouched by cure D: a default parameter compared for CHANGE',
  'function kpf(kpC = new Set(kpArr)) {\n  if (kpC.size > 1) kpGo();\n}\n',
  { PUB: 'UNRESOLVED/CHANGE', DEF: 'SET-BOUND/CHANGE/BLIND', GEN: 'UNRESOLVED/CHANGE', BOTH: 'SET-BOUND/CHANGE/BLIND' });

cell('K14 regression: a plain DIRECT tail is excluded from the population under all four',
  'if (new Set(kpArr).size === 1) kpGo();\n', all4('EXCLUDED'));

cell("K15 unit-527's K8/P14' across the 2x2: a GENERIC direct tail is CALL until G is present",
  'if (new Set<string>(kpArr).size === 1) kpGo();\n',
  { PUB: 'CALL/INVARIANCE', DEF: 'CALL/INVARIANCE', GEN: 'EXCLUDED', BOTH: 'EXCLUDED' });

// The fixture runs must not pollute the corpus firing census.
for (const l of LABELS) FIRINGS[l].length = 0;

// ─── the four runs ──────────────────────────────────────────────────────────────────────────────

const RUN = {};
for (const l of LABELS) RUN[l] = INST[l].armA(CORPUS);

const CLASSES = ['SET-BOUND', 'SET-EXPR', 'MAP-BOUND', 'MAP-EXPR', 'OTHER-BOUND', 'UNRESOLVED',
  'PROPERTY', 'CALL', 'RECEIVER-UNKEYED', 'SET-TAIL-DIRECT'];
const CLS = {};
for (const l of LABELS) {
  CLS[l] = tally(RUN[l].sites, 'cls');
  const sum = CLASSES.reduce((a, k) => a + (CLS[l][k] || 0), 0);
  if (sum !== RUN[l].sites.length) {
    throw new Error(`${l} class sum ${sum} != population ${RUN[l].sites.length}`);
  }
}

const keyOf = (s) => `${s.path}:${s.line}:${s.receiver}`;
const MAPS = {};
for (const l of LABELS) MAPS[l] = new Map(RUN[l].sites.map((s) => [keyOf(s), s]));

const movement = (a, b) => {
  const moved = [];
  const left = [];
  for (const [k, s] of MAPS[a]) {
    const c = MAPS[b].get(k);
    if (!c) left.push(s);
    else if (c.cls !== s.cls || c.guard !== s.guard || c.bindLine !== s.bindLine) moved.push({ from: s, to: c });
  }
  const entered = [...MAPS[b].keys()].filter((k) => !MAPS[a].has(k)).map((k) => MAPS[b].get(k));
  return { moved, left, entered };
};
const MOV = {
  DEF: movement('PUB', 'DEF'),
  GEN: movement('PUB', 'GEN'),
  BOTH: movement('PUB', 'BOTH'),
};

const narrowedOf = (sites) =>
  sites.filter((s) => (s.cls === 'SET-BOUND' || s.cls === 'SET-EXPR') && s.dir === 'INVARIANCE');
const NARROW = {};
for (const l of LABELS) NARROW[l] = narrowedOf(RUN[l].sites);

// ─── Arm A: the UNRESOLVED partition ────────────────────────────────────────────────────────────

/**
 * Four detectors plus a fall-through, run on EVERY `UNRESOLVED` site. All four are recorded per
 * site, not just the winning one, so the order below is auditable rather than load-bearing: if no
 * site fires two detectors, the order cannot have decided anything, and the report says which.
 *
 * DECLARED: the bucket NAMES and their predicted counts are pre-registered (P1); this ORDER is an
 * implementation choice made while writing the arm and is named as such.
 */
const ORDER = ['DEFAULT-PARAM', 'DESTRUCTURE-DECL', 'PARAM-NO-DEFAULT', 'ASSIGNED-ELSEWHERE'];
const detect = (code, name) => {
  const esc = name.replace(/[$]/g, '\\$');
  const out = {};
  out['DEFAULT-PARAM'] = new RegExp(PARAM_SRC.replace('NAME', esc), 'm').test(code);
  out['DESTRUCTURE-DECL'] = new RegExp(
    `(?:^|[;(,]\\s*)(?:export\\s+)?(?:const|let|var)\\s+[\\[{][^=\\n]*\\b${esc}\\b[^=\\n]*[\\]}]\\s*=`, 'm',
  ).test(code);
  // EVERY parameter-list-shaped candidate is scanned, not the first: a short receiver name such as
  // `s` has many `\b s \b` candidates, and keying on `exec`'s first hit would let an unrelated
  // earlier list decide this site's bucket.
  const plist = new RegExp(`\\(([^()\\n]*\\b${esc}\\b[^()\\n]*)\\)\\s*(?:=>|{|:)`, 'g');
  const hasDefault = new RegExp(`\\b${esc}\\s*(?::[^=,)]*)?=`);
  out['PARAM-NO-DEFAULT'] = [...code.matchAll(plist)].some((mm) => !hasDefault.test(mm[1]));
  out['ASSIGNED-ELSEWHERE'] = new RegExp(`(?:^|[^\\w$.])${esc}\\s*=[^=]`, 'm').test(code);
  return out;
};

const unresolved = [];
for (const s of RUN.PUB.sites) {
  if (s.cls !== 'UNRESOLVED') continue;
  const raw = INST.PUB.read(s.path);
  if (raw === null) {
    unresolved.push({ site: s, d: {}, fired: [], bucket: 'UNREADABLE' });
    continue;
  }
  const code = stripSource(raw, true);
  const d = detect(code, s.receiver);
  const fired = ORDER.filter((k) => d[k]);
  unresolved.push({ site: s, d, fired, bucket: fired.length ? fired[0] : 'NO-DETECTOR' });
}
const BUCKETS = [...ORDER, 'NO-DETECTOR', 'UNREADABLE'];
const bucketTally = {};
for (const b of BUCKETS) bucketTally[b] = 0;
for (const u of unresolved) bucketTally[u.bucket] += 1;
const multiFired = unresolved.filter((u) => u.fired.length > 1);

// ─── control 1: the frozen arm, driven unchanged ────────────────────────────────────────────────

const CAP = 'docs/research/unit-529defaultparam-2026-11-27/captures';
let ctrlText = '';
let ctrlErr = null;
try {
  ctrlText = sh(`node ${FROZEN} 2>${CAP}/CONTROL-523.err`);
  writeFileSync(`${ROOT}${CAP}/CONTROL-523.out`, ctrlText);
} catch (e) {
  ctrlErr = e.message;
}
const ctrlPop = /INDIRECT population \(re-derived here;[^)]*\): (\d+)/.exec(ctrlText);
const ctrlExcl = /excluded as direct `new Set\(\.\.\.\)` tails: (\d+)/.exec(ctrlText);
const ctrlNarrow = /NARROWED HAZARD — \(SET-BOUND or SET-EXPR\) and INVARIANCE: (\d+)/.exec(ctrlText);
const ctrlCls = {};
for (const k of CLASSES) {
  const m = new RegExp(`^ {4}${k.replace(/-/g, '\\-')} +(\\d+)$`, 'm').exec(ctrlText);
  if (m) ctrlCls[k] = Number(m[1]);
}

const CTL = [];
const cctl = (name, ok, got) => CTL.push({ name, ok: ok === true, got });
cctl('C0  frozen arm drove, rc 0', ctrlErr === null, ctrlErr || 'rc 0');
cctl('C1  population equal', ctrlPop !== null && Number(ctrlPop[1]) === RUN.PUB.sites.length,
  `frozen=${ctrlPop ? ctrlPop[1] : 'n/a'} slice=${RUN.PUB.sites.length}`);
cctl('C2  excludedDirectTails equal', ctrlExcl !== null && Number(ctrlExcl[1]) === RUN.PUB.excludedDirectTails,
  `frozen=${ctrlExcl ? ctrlExcl[1] : 'n/a'} slice=${RUN.PUB.excludedDirectTails}`);
for (const k of CLASSES) {
  cctl(`C3.${k}`, (ctrlCls[k] ?? 0) === (CLS.PUB[k] || 0), `frozen=${ctrlCls[k] ?? 'n/a'} slice=${CLS.PUB[k] || 0}`);
}
cctl('C4  narrowed hazard equal', ctrlNarrow !== null && Number(ctrlNarrow[1]) === NARROW.PUB.length,
  `frozen=${ctrlNarrow ? ctrlNarrow[1] : 'n/a'} slice=${NARROW.PUB.length}`);
// C5/C6 are STRUCTURAL, not "the log came back empty": an empty log is also what a cure that was
// never spliced in produces, so the cells assert the splice's presence and absence in the TEXT.
cctl('C5  cure D absent from the PUB and GEN texts',
  occ(TEXT.PUB, '__firings') === 0 && occ(TEXT.GEN, '__firings') === 0,
  `PUB=${occ(TEXT.PUB, '__firings')} GEN=${occ(TEXT.GEN, '__firings')} occurrences`);
cctl('C6  cure D present exactly once in the DEF and BOTH texts',
  occ(TEXT.DEF, '__firings') === 1 && occ(TEXT.BOTH, '__firings') === 1,
  `DEF=${occ(TEXT.DEF, '__firings')} BOTH=${occ(TEXT.BOTH, '__firings')} occurrences`);
// C7 is the non-vacuity cell for the whole unit: a cure that fires nowhere measures nothing, and
// every figure below would be a differential of zero against zero.
cctl('C7  cure D actually FIRED on the corpus under DEF', FIRINGS.DEF.length > 0,
  `${FIRINGS.DEF.length} firings`);
cctl('C8  PUB and GEN firing logs are empty, as the texts require',
  FIRINGS.PUB.length === 0 && FIRINGS.GEN.length === 0,
  `PUB=${FIRINGS.PUB.length} GEN=${FIRINGS.GEN.length}`);

// ─── control 2: cross-unit, GEN against unit-527's published figures ────────────────────────────

const U527 = { corpus: 858, slice: 7893, cured: 8103, SET_BOUND: 40, OTHER_BOUND: 30, hazard: 5 };
const popUnmoved = CORPUS.length === U527.corpus
  && (CLS.PUB['SET-BOUND'] || 0) === 36 && (CLS.PUB['OTHER-BOUND'] || 0) === 34;
const XU = [];
const xctl = (name, got, want) => {
  XU.push({
    name,
    valid: popUnmoved,
    ok: got === want,
    got: `GEN=${got} unit-527=${want}`,
  });
};
xctl('X1  G-cured slice byte length', TEXT.GEN.length, U527.cured);
xctl('X2  sliced region byte length', SLICED.length, U527.slice);
xctl('X3  SET-BOUND after G', CLS.GEN['SET-BOUND'] || 0, U527.SET_BOUND);
xctl('X4  OTHER-BOUND after G', CLS.GEN['OTHER-BOUND'] || 0, U527.OTHER_BOUND);
xctl('X5  narrowed hazard after G', NARROW.GEN.length, U527.hazard);

// ─── P9: additivity ─────────────────────────────────────────────────────────────────────────────

const additive = {};
for (const k of CLASSES) {
  const p = CLS.PUB[k] || 0;
  additive[k] = p + ((CLS.DEF[k] || 0) - p) + ((CLS.GEN[k] || 0) - p);
}
const additivityBreaks = CLASSES
  .filter((k) => additive[k] !== (CLS.BOTH[k] || 0))
  .map((k) => ({ cls: k, additive: additive[k], measured: CLS.BOTH[k] || 0, off: (CLS.BOTH[k] || 0) - additive[k] }));

// ─── the two named members ──────────────────────────────────────────────────────────────────────

const NAMED_PREFIX = 'scripts/probe-round244';
const NAMED_LINE = 188;
const namedRows = RUN.PUB.sites
  .filter((s) => s.path.startsWith(NAMED_PREFIX) && s.line === NAMED_LINE)
  .map((s) => ({ key: keyOf(s), per: Object.fromEntries(LABELS.map((l) => [l, MAPS[l].get(keyOf(s)) || null])) }));

// ─── report ─────────────────────────────────────────────────────────────────────────────────────

console.log('unit-529defaultparam — arm');
console.log(`SHA ${SHA} · clock ${CLOCK}`);
console.log(`pre-registration SHA ${PREREG_SHA}; this drive is at ${SHA}`);
console.log('  (the difference is the pre-registration commit itself, markdown only — no `.mjs`,');
console.log('   `.mts`, `.js`, `.ts` or `.cjs` file changed, so the population is the same one.)');
console.log(`frozen subject: ${FROZEN}   sha256[0:12] ${sha12(frozenText)}  (clean against HEAD)`);
console.log(`cure-G donor:   ${DONOR}   sha256[0:12] ${sha12(donorText)}  (clean against HEAD)`);
console.log(`instrument corpus: ${CORPUS.length} files   (CODE_EXT: ${INST.PUB.CODE_EXT})`);
console.log(`sliced region ${SLICED.length} B · DEF ${TEXT.DEF.length} B · GEN ${TEXT.GEN.length} B · BOTH ${TEXT.BOTH.length} B`);
console.log(`NEEDLE as instantiated: ${JSON.stringify(INST.PUB.NEEDLE)}`);
console.log(`donor region ${DONOR_REGION.length} B, yielded GENERIC_SRC + ${GSUBS.length} SUBS`);
console.log(`  GENERIC_SRC read out of the donor: ${JSON.stringify(GENERIC_SRC)}`);
console.log('');

console.log('─── cure D, the one substitution, printed whole ────────────────────────────────');
console.log(`  ${DSUB.id}`);
console.log(`    PARAM_SRC: ${JSON.stringify(PARAM_SRC)}`);
console.log(`    FROM: ${JSON.stringify(DSUB.from)}`);
console.log(`    TO:   ${JSON.stringify(DSUB.to)}`);
console.log('');
console.log("─── cure G, the four substitutions as READ out of unit-527's arm ───────────────");
for (const s of GSUBS) {
  console.log(`  ${s.id}`);
  console.log(`    FROM: ${JSON.stringify(s.from)}`);
  console.log(`    TO:   ${JSON.stringify(s.to)}`);
}
console.log('');

console.log('─── KP / KN cells, all four instantiations ─────────────────────────────────────');
for (const c of KP) {
  console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}`);
  console.log(`        want ${c.want}`);
  console.log(`        got  ${c.got}`);
}
const kpPassed = KP.filter((c) => c.ok).length;
console.log(`  KP ${kpPassed} of ${KP.length}`);
console.log('');

console.log('─── control 1: the frozen arm, driven unchanged at this SHA ────────────────────');
for (const c of CTL) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${pad(c.name, 46)} ${c.got}`);
const ctlPassed = CTL.filter((c) => c.ok).length;
console.log(`  CONTROL-1 ${ctlPassed} of ${CTL.length}`);
console.log('');

console.log("─── control 2: cross-unit, GEN vs unit-527's published figures ─────────────────");
console.log(`  precondition (population unmoved): ${popUnmoved ? 'HOLDS' : 'DOES NOT HOLD'}`);
console.log(`    corpus ${CORPUS.length} vs 858 · PUB SET-BOUND ${CLS.PUB['SET-BOUND'] || 0} vs 36 · PUB OTHER-BOUND ${CLS.PUB['OTHER-BOUND'] || 0} vs 34`);
for (const c of XU) {
  const verdict = c.valid ? (c.ok ? 'PASS' : 'FAIL') : (c.ok ? 'n/a-AGREES' : 'n/a-DIFFERS');
  console.log(`  ${pad(verdict, 11)} ${pad(c.name, 34)} ${c.got}`);
}
const xuPassed = XU.filter((c) => c.ok).length;
console.log(`  CROSS-UNIT ${xuPassed} of ${XU.length} agree; ${popUnmoved ? 'the precondition holds, so these are asserted' : 'the precondition does NOT hold, so these are REPORTED, not asserted'}`);
console.log('');

const UNGRADED = kpPassed !== KP.length || ctlPassed !== CTL.length || (popUnmoved && xuPassed !== XU.length);
if (UNGRADED) {
  console.log('*** UNGRADED: a KP cell, a control cell, or an asserted cross-unit cell failed.');
  console.log('*** Figures below are printed for diagnosis and must NOT be published as a census.');
  console.log('');
}

console.log('─── Arm A: the UNRESOLVED partition (P1) ───────────────────────────────────────');
console.log(`  UNRESOLVED under PUB: ${unresolved.length}`);
console.log(`  detector order (an implementation choice, declared): ${ORDER.join(' > ')} > NO-DETECTOR`);
for (const b of BUCKETS) console.log(`    ${pad(b, 22)} ${bucketTally[b]}`);
console.log(`  sites firing MORE THAN ONE detector: ${multiFired.length}`);
console.log('    (at 0, the order above cannot have decided any bucket; above 0, it can, and the');
console.log('     offending sites are listed immediately below.)');
for (const u of multiFired) console.log(`    ${u.site.path}:${u.site.line}  receiver=${u.site.receiver}  fired=${u.fired.join('+')}`);
console.log('');
console.log('  every UNRESOLVED site, with its full detector vector and whole line:');
for (const u of unresolved) {
  console.log(`    ${u.site.path}:${u.site.line}  receiver=${u.site.receiver}  BUCKET=${u.bucket}`);
  console.log(`      detectors ${ORDER.map((k) => `${k}=${u.d[k] ? 'Y' : 'n'}`).join(' ')}`);
  console.log(`      ${u.site.whole}`);
  for (const l of ['DEF', 'GEN', 'BOTH']) {
    const c = MAPS[l].get(keyOf(u.site));
    console.log(`      ${pad(l, 5)} ${c ? `${c.cls}/${c.dir}${c.guard ? `/${c.guard}` : ''} bindLine=${c.bindLine}` : 'ABSENT (left the population)'}`);
  }
}
console.log('');

console.log('─── Arm B: the 2x2 class table ─────────────────────────────────────────────────');
console.log(`  population            ${LABELS.map((l) => pad(RUN[l].sites.length, 8)).join('')}`);
console.log(`  excludedDirectTails   ${LABELS.map((l) => pad(RUN[l].excludedDirectTails, 8)).join('')}`);
console.log('');
console.log(`  ${pad('class', 20)} ${LABELS.map((l) => pad(l, 8)).join('')} ${pad('dDEF', 7)}${pad('dGEN', 7)}dBOTH`);
for (const k of CLASSES) {
  const p = CLS.PUB[k] || 0;
  const d = (x) => {
    const v = (CLS[x][k] || 0) - p;
    return pad(v > 0 ? `+${v}` : String(v), 7);
  };
  console.log(`  ${pad(k, 20)} ${LABELS.map((l) => pad(CLS[l][k] || 0, 8)).join('')} ${d('DEF')}${d('GEN')}${d('BOTH')}`);
}
console.log('');
console.log('  NARROWED HAZARD (SET-BOUND or SET-EXPR) and INVARIANCE:');
for (const l of LABELS) {
  console.log(`    ${pad(l, 6)} ${pad(NARROW[l].length, 4)} guard ${JSON.stringify(tally(NARROW[l], 'guard'))}`);
}
console.log('');
for (const l of ['DEF', 'GEN', 'BOTH']) {
  const m = MOV[l];
  console.log(`  PUB -> ${l}: ${m.moved.length} moved · ${m.left.length} left the population · ${m.entered.length} entered`);
  for (const { from, to } of m.moved) {
    console.log(`    ${from.path}:${from.line}  ${from.cls}/${from.dir}${from.guard ? `/${from.guard}` : ''} -> ${to.cls}/${to.dir}${to.guard ? `/${to.guard}` : ''}  bindLine ${from.bindLine} -> ${to.bindLine}`);
    console.log(`      ${from.whole}`);
  }
  for (const s of m.left) console.log(`    LEFT  ${s.path}:${s.line} [${s.cls}] ${s.whole}`);
  for (const s of m.entered) console.log(`    ENTER ${s.path}:${s.line} [${s.cls}] ${s.whole}`);
  console.log(`    as a from -> to tally: ${JSON.stringify(tally(m.moved.map(({ from, to }) => ({ t: `${from.cls} -> ${to.cls}` })), 't'))}`);
}
console.log('');

console.log('─── P9: do the two cures compose ADDITIVELY? ───────────────────────────────────');
console.log(`  ${pad('class', 20)} ${pad('PUB+dDEF+dGEN', 15)} ${pad('measured BOTH', 14)} off-by`);
for (const k of CLASSES) {
  const off = (CLS.BOTH[k] || 0) - additive[k];
  console.log(`  ${pad(k, 20)} ${pad(additive[k], 15)} ${pad(CLS.BOTH[k] || 0, 14)} ${off > 0 ? '+' : ''}${off}`);
}
console.log(`  classes where addition FAILS: ${additivityBreaks.length}`);
for (const b of additivityBreaks) {
  console.log(`    ${pad(b.cls, 20)} additive ${b.additive} · measured ${b.measured} · off by ${b.off > 0 ? '+' : ''}${b.off}`);
}
console.log('');

console.log('─── P15: every firing of cure D across the corpus ──────────────────────────────');
for (const l of ['DEF', 'BOTH']) {
  const uniq = new Map(FIRINGS[l].map((f) => [`${f.name}:${f.line}`, f]));
  console.log(`  ${l}: ${FIRINGS[l].length} firings, ${uniq.size} distinct (name, line) pairs`);
  for (const [k, f] of uniq) console.log(`    ${pad(k, 28)} rhs=${JSON.stringify(f.rhs)}`);
}
console.log('');

console.log('─── the two named members (scripts/probe-round244…:188) ────────────────────────');
console.log(`  rows found in the PUB population: ${namedRows.length}`);
for (const r of namedRows) {
  console.log(`    ${r.key}`);
  for (const l of LABELS) {
    const c = r.per[l];
    console.log(`      ${pad(l, 5)} ${c ? `${c.cls}/${c.dir}${c.guard ? `/${c.guard}` : ''}  bindLine=${c.bindLine}` : 'ABSENT'}`);
  }
  if (r.per.PUB) console.log(`      ${r.per.PUB.whole}`);
}
console.log('');
console.log(`VERDICT: ${UNGRADED ? 'UNGRADED' : 'GRADED'}  ·  KP ${kpPassed}/${KP.length}  ·  CONTROL-1 ${ctlPassed}/${CTL.length}  ·  CROSS-UNIT ${xuPassed}/${XU.length} (${popUnmoved ? 'asserted' : 'reported'})`);
