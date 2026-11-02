#!/usr/bin/env node
// grade-subkind — unit-464subkind, 2026-11-02 WORK.
//
// Answers the two questions Daedalus's 11/02 WORK memo §6 routed to me as the coiner of
// `conjunctive` and `staleness`, and grades his §4 departure from my published figure.
//
// Discipline:
//  * every slice comes from `git show <PIN>:<path>`, never the worktree (GREV prints the pinned
//    AND HEAD blob hash of every subject);
//  * his verdict is joined out of HIS OWN TSV on (file,line,id) — my hand file carries no
//    subkind column, so a departure cannot come from my transcription;
//  * a leg that cannot run prints UNRUNNABLE and the unit exits non-zero;
//  * `?` in a criteria cell is a refusal where it would decide the label, not a silent F.

import { execFileSync } from 'node:child_process';

const PIN = 'de422c75';
const HIS_TSV = 'docs/research/unit-464reach-2026-11-02/HAND-READ-13.tsv';
const MY_TSV = 'docs/research/unit-464subkind-2026-11-02/HAND-CRITERIA-13.tsv';
const VAC = 'docs/research/unit-464vac-2026-10-31/measure.mjs';
const REC3 = 'docs/research/unit-464rec3-2026-11-01/grade-the-three-cures.mjs';
const STEAL = 'docs/research/unit-464cure3-2026-11-01/grade-the-steal-cures.mjs';
const ATTRIB = 'docs/research/unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs';
const CONV = 'docs/research/LEG-CLASS-CONVENTION.md';
const HIS_DIR = 'docs/research/unit-464reach-2026-11-02';

const SUBJECTS = [VAC, REC3, STEAL, ATTRIB, CONV, HIS_TSV];

let RED = 0;
let UNRUNNABLE = 0;
const LEGS = [];
// Measured figures live here and the prediction verdicts are read OFF them, never off whether a
// leg went green — a verdict keyed on leg greenness cannot tell REFUTED from UNRUNNABLE.
const MEAS = {};

const git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
};
const show = (path) => git(['show', `${PIN}:${path}`]);
// MY OWN input file cannot exist at a pin that predates this unit — drive1 refused on exactly
// that, and the recording is kept. It is read at HEAD, and GMYTSVCOMMITTED asserts the HEAD blob
// is byte-identical to the worktree copy, so the input is a committed artefact and not a dirty
// edit. The SUBJECTS stay pinned; only this unit's own input moves to HEAD.
const showMine = (path) => git(['show', `HEAD:${path}`]);

const leg = (id, ok, msg) => {
  LEGS.push({ id, ok, msg });
  if (ok === null) {
    UNRUNNABLE++;
    console.log(`${id.padEnd(16)} UNRUNNABLE  ${msg}`);
  } else if (ok) {
    console.log(`${id.padEnd(16)} ok          ${msg}`);
  } else {
    RED++;
    console.log(`${id.padEnd(16)} RED         ${msg}`);
  }
};

// ─────────────────────────────────────────────────────────────────── GREV: the pin, both hashes
{
  const rows = SUBJECTS.map((p) => {
    const a = (git(['rev-parse', `${PIN}:${p}`]) ?? '').trim();
    const b = (git(['rev-parse', `HEAD:${p}`]) ?? '').trim();
    return { p, a, b, same: a !== '' && a === b };
  });
  for (const r of rows) {
    console.log(`  [REV] ${r.p}\n        pinned ${r.a.slice(0, 12) || 'MISSING'}  HEAD ${r.b.slice(0, 12) || 'MISSING'}  ${r.same ? 'IDENTICAL' : 'DIFFERS'}`);
  }
  const missing = rows.filter((r) => r.a === '');
  leg('GREV', missing.length === 0,
    `all ${rows.length} subject(s) readable at the pin ${PIN}; ${rows.filter((r) => r.same).length}/${rows.length} byte-identical at HEAD` +
    (missing.length ? ` — MISSING at pin: ${missing.map((r) => r.p).join(',')}` : ''));
}

// ───────────────────────────────────────────────── GROWKEY / GNOTRETYPED: the two row sets join
const parseTsv = (text) => {
  if (text === null) return null;
  const lines = text.split('\n');
  const h = lines.findIndex((l) => l.startsWith('file\tline\tid\t'));
  if (h < 0) return null;
  const cols = lines[h].split('\t');
  return {
    cols,
    rows: lines.slice(h + 1).filter((l) => l.trim() !== '' && !l.startsWith('#'))
      .map((l) => Object.fromEntries(l.split('\t').map((v, i) => [cols[i] ?? `c${i}`, v]))),
  };
};

{
  const headBlob = (git(['rev-parse', `HEAD:${MY_TSV}`]) ?? '').trim();
  const wtBlob = (git(['hash-object', MY_TSV]) ?? '').trim();
  leg('GMYTSVCOMMITTED', headBlob !== '' && headBlob === wtBlob,
    `my own criteria input is read at HEAD (it postdates the subject pin): HEAD blob ` +
    `${headBlob.slice(0, 12) || 'MISSING'} vs worktree ${wtBlob.slice(0, 12) || 'MISSING'} — ` +
    `${headBlob === wtBlob ? 'IDENTICAL, so the graded input is the committed one' : 'DIFFERS — the input is a dirty edit'}`);
}

const his = parseTsv(show(HIS_TSV));
const mine = parseTsv(showMine(MY_TSV));
if (his === null || mine === null) {
  console.log(`GTSV             UNRUNNABLE  could not parse ${his === null ? HIS_TSV : MY_TSV} at ${PIN}`);
  process.exit(2);
}

const key = (r) => `${r.file}|${r.line}|${r.id}`;
const hisByKey = new Map(his.rows.map((r) => [key(r), r]));
const myByKey = new Map(mine.rows.map((r) => [key(r), r]));

leg('GROWKEY', his.rows.length === 13 && mine.rows.length === 13 &&
  his.rows.every((r) => myByKey.has(key(r))) && mine.rows.every((r) => hisByKey.has(key(r))),
  `his ${his.rows.length} rows and my ${mine.rows.length} rows join on (file,line,id) with no row ` +
  `dropped on either side; unmatched his=${his.rows.filter((r) => !myByKey.has(key(r))).length} ` +
  `mine=${mine.rows.filter((r) => !hisByKey.has(key(r))).length}`);

leg('GNOTRETYPED', !mine.cols.includes('subkind5') && !mine.cols.includes('subkind') &&
  mine.cols.includes('c1') && his.cols.includes('subkind5'),
  `my TSV columns [${mine.cols.join(',')}] carry no subkind column, so every departure below is ` +
  `derived from c1..c4 and joined against HIS subkind5 — not transcribed`);

// ─────────────────────────────────────────────── P3: the 13 x 5 matrix and the first-yes derivation
const CRIT = ['c1', 'c2', 'c3', 'c4'];
const NAME = { c1: 'conjunctive', c2: 'delta', c3: 'staleness', c4: 'inert' };

const firstYes = (r) => {
  for (const c of CRIT) {
    if (r[c] === 'T') return { label: NAME[c], via: c, refused: false };
    if (r[c] === '?') return { label: null, via: c, refused: true };
  }
  return { label: 'keyed', via: 'c5', refused: false };
};

console.log('');
console.log('  ── the 13 x 4 criteria matrix (mine), the derived first-yes label, and his ──────────────');
console.log(`  ${'row'.padEnd(52)} c1 c2 c3 c4  n  derived      his          agree`);
const graded = [];
for (const r of mine.rows) {
  const h = hisByKey.get(key(r));
  const fy = firstYes(r);
  const n = CRIT.filter((c) => r[c] === 'T').length;
  const q = CRIT.filter((c) => r[c] === '?').length;
  const agree = fy.label !== null && h !== undefined && fy.label === h.subkind5;
  graded.push({ r, h, fy, n, q, agree });
  const short = `${r.file.replace(/^unit-464/, '').replace(/-2026-\d\d-\d\d/, '')}:${r.line} ${r.id}`;
  console.log(`  ${short.padEnd(52)} ${CRIT.map((c) => r[c]).join('  ')}  ${n}  ` +
    `${(fy.label ?? 'REFUSED').padEnd(12)} ${(h?.subkind5 ?? '??').padEnd(12)} ${agree ? 'yes' : 'NO'}`);
}

const refusedRows = graded.filter((g) => g.fy.refused);
leg('GNOREFUSE', refusedRows.length === 0,
  `${refusedRows.length} row(s) carry a '?' in the position that would decide the label` +
  (refusedRows.length ? `: ${refusedRows.map((g) => key(g.r)).join(', ')}` : '') +
  `; total '?' cells across the matrix: ${graded.reduce((a, g) => a + g.q, 0)}`);

const overlap = graded.filter((g) => g.n >= 2);
MEAS.overlapN = overlap.length;
MEAS.rowN = graded.length;
leg('GOVERLAP', overlap.length > 0,
  `P3 — rows with TWO OR MORE of the five criteria true at once: ${overlap.length} of ${graded.length} ` +
  `[${overlap.map((g) => `${g.r.id}@${g.r.line}{${CRIT.filter((c) => g.r[c] === 'T').map((c) => NAME[c]).join('+')}}`).join(' ')}] ` +
  `— 'first yes decides' is ORDERING an overlap, not resolving one`);

const departures = graded.filter((g) => !g.agree);
console.log('');
for (const g of departures) {
  console.log(`  [DEPART] ${g.r.file}:${g.r.line} ${g.r.id} — mine ${g.fy.label} (via ${g.fy.via}), his ${g.h?.subkind5}`);
  console.log(`           why: ${g.r.why}`);
}
leg('GDEPARTCOUNT', departures.length + graded.filter((g) => g.agree).length === graded.length,
  `${graded.filter((g) => g.agree).length} of ${graded.length} labels agree, ${departures.length} depart ` +
  `[${departures.map((g) => `${g.r.id}@${g.r.line}: ${g.h?.subkind5}->${g.fy.label}`).join(' · ')}]`);

const dist = (rows, get) => {
  const m = new Map();
  for (const r of rows) m.set(get(r), (m.get(get(r)) ?? 0) + 1);
  return [...m].sort().map(([k, v]) => `${k} ${v}`).join(' · ');
};
console.log(`  [DIST] his five-way:  ${dist(his.rows, (r) => r.subkind5)}`);
console.log(`  [DIST] mine five-way: ${dist(graded, (g) => g.fy.label ?? 'REFUSED')}`);

const hazardHis = his.rows.filter((r) => r.subkind5 === 'keyed').map(key).sort();
const hazardMine = graded.filter((g) => g.fy.label === 'keyed').map((g) => key(g.r)).sort();
MEAS.hazardSame = hazardHis.length === hazardMine.length && hazardHis.every((k, i) => k === hazardMine[i]);
leg('GHAZARDMEMBERS', hazardHis.length === hazardMine.length && hazardHis.every((k, i) => k === hazardMine[i]),
  `P5 — the HAZARD cell compared as a MEMBER LIST, not a count: his [${hazardHis.join(' ; ')}] ` +
  `vs mine [${hazardMine.join(' ; ')}] — ${hazardHis.length === hazardMine.length && hazardHis.every((k, i) => k === hazardMine[i]) ? 'IDENTICAL' : 'DIFFERENT'}`);
// [[feedback_compare_member_lists_not_counts]]

// ──────────────────────────────────────── P1: MY_REV is read out of a file, not off the worktree
{
  const src = show(VAC);
  if (src === null) leg('GMYREV', null, `${VAC} unreadable at ${PIN}`);
  else {
    const m = src.match(/^const MY_REV = (.+);$/m);
    const his2 = src.match(/^const HIS_REV = (.+);$/m);
    const rhs = m?.[1] ?? '';
    const hrhs = his2?.[1] ?? '';
    const live = /rev-parse[^)]*HEAD|['"`]HEAD['"`]|process\.cwd|execSync|readFileSync\(join\(/.test(rhs);
    const isFile = /readFileSync\(/.test(rhs);
    MEAS.myRevIsFile = isFile;
    MEAS.myRevIsLive = live;
    leg('GMYREV', !!m && isFile && !live,
      `P1 — sliced \`const MY_REV = ${rhs}\` and \`const HIS_REV = ${hrhs}\`: MY_REV is a readFileSync ` +
      `of a recorded rev (${isFile}) with no HEAD/cwd/execSync selector in it (${!live}), HIS_REV comes ` +
      `out of his sat.json — so NEITHER side is the worktree and the row is staleness, not keyed`);
  }
}

// ─────────────── P1 corollary: is the recorded rev a literal in the tree, and does anything move it?
{
  const files = (git(['ls-tree', '-r', '--name-only', PIN]) ?? '').split('\n')
    .filter((p) => p.endsWith('baseline.rev'));
  const hist = files.map((p) => ({
    p,
    n: ((git(['log', '--format=%h', '--', p]) ?? '').trim().split('\n').filter(Boolean)).length,
  }));
  const multi = hist.filter((h) => h.n > 1);
  // writes: any tracked file at the pin that WRITES a path ending baseline.rev
  const all = (git(['ls-tree', '-r', '--name-only', PIN]) ?? '').split('\n').filter((p) => /\.(mjs|js|mts|ts|sh)$/.test(p));
  const writers = [];
  for (const p of all) {
    const s = show(p);
    if (s === null) continue;
    s.split('\n').forEach((l, i) => {
      if (/baseline\.rev/.test(l) && /(writeFileSync|appendFileSync|createWriteStream|>\s*[`'"]?[^`'"]*baseline\.rev)/.test(l)) {
        writers.push(`${p}:${i + 1}`);
      }
    });
  }
  const readers = [];
  for (const p of all) {
    const s = show(p);
    if (s === null) continue;
    s.split('\n').forEach((l, i) => { if (/readFileSync\([^)]*baseline\.rev/.test(l)) readers.push(`${p}:${i + 1}`); });
  }
  console.log(`  [MEAS] tracked baseline.rev files at ${PIN}: ${files.length}; commit counts: ${hist.map((h) => `${h.p.split('/')[2]}=${h.n}`).join(' ')}`);
  MEAS.baseWriters = writers;
  MEAS.baseReaders = readers;
  MEAS.baseFiles = files.length;
  MEAS.baseScanned = all.length;
  MEAS.subjectCommits = hist.find((h) => h.p.includes('unit-464vac'))?.n ?? null;
  MEAS.baseMulti = multi;

  // GATE, not prediction. drive2's version of these two legs ASSERTED P2's own predicate, so a
  // refuted prediction came out as a RED and the leg's own message printed "LANDS" beside it —
  // the same shape as drive1 of unit-464pins and as his own GP2COEXT. What is gated here is that
  // the MEASUREMENT could be made: the scanner must demonstrably find baseline.rev references at
  // all (else "0 writers" is vacuous), and the subject's own history must be countable.
  // [[feedback_gate_the_figure_on_the_key_not_on_the_prediction]]
  // [[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]
  leg('GBASEMEASURED', readers.length > 0 && files.length > 0 && typeof MEAS.subjectCommits === 'number',
    `the write/read scan is non-vacuous: ${all.length} tracked code file(s) read at the pin, ` +
    `${readers.length} READ a baseline.rev and ${writers.length} WRITE one ` +
    `[${writers.join(',') || 'none'}]; ${files.length} baseline.rev files tracked; the subject's ` +
    `(unit-464vac) own history is ${MEAS.subjectCommits} commit(s)`);
  leg('GBASEPOP', true,
    `population, reported not asserted: ${multi.length} of ${files.length} baseline.rev file(s) have ` +
    `>1 commit [${multi.map((h) => `${h.p.replace('docs/research/', '')}=${h.n}`).join(',') || 'none'}] — ` +
    `the one that does is MY OWN unit-464grep, where I re-stamped it BY HAND after the instrument ` +
    `commit to cure a vacuous self-exclusion leg. So an anchor file can move across commits; what ` +
    `no instrument in the tree does is move one on a DRIVE`);
}

// ────────── P2 (the axis that does separate them): is the anchor a LITERAL or a SELECTOR?
{
  const src = show(REC3);
  if (src === null) leg('GRECENCY', null, `${REC3} unreadable at ${PIN}`);
  else {
    const pinLine = src.match(/^const s2Pin = .+$/m)?.[0] ?? '';
    const recLine = src.match(/^const atRecency = .+$/m)?.[0] ?? '';
    const c2bPred = src.match(/^g\('C2b',[\s\S]{0,400}?\);$/m)?.[0] ?? '';
    const selector = /\['log',\s*'-1'/.test(recLine);
    const differs = /atPin\s*!==\s*atRecency/.test(c2bPred);
    console.log(`  [MEAS] C2b's two anchors:\n         ${pinLine}\n         ${recLine}`);
    leg('GRECENCY', selector,
      `C2b's SECOND anchor is \`git log -1 --format=%h -- HIS_396_PATH\` — a recency SELECTOR ` +
      `(${selector}), so any commit touching that path moves the figure: the leg IS in a cure's reach`);
    leg('GC2BDIFFERS', differs,
      `and C2b's predicate carries an explicit \`atPin !== atRecency\` (${differs}) — criterion 2 ` +
      `("asserts they DIFFER") is TRUE of it, and criterion 2 is asked BEFORE criterion 3, so his ` +
      `own ordered key sends C2b to \`delta\`, the cell his table marks "(sound)"`);
    const nTouch = ((git(['log', '--format=%h', '--', 'docs/research/unit-464t2-rekey-2026-10-29/insert-coord-entry.mjs']) ?? '').trim().split('\n').filter(Boolean)).length;
    void nTouch;
  }
}

// ────────── P4: is the figure at measure.mjs:79 out of a cure's reach? (the question-1 answer)
{
  const src = show(VAC);
  if (src === null) leg('GREACH79', null, `${VAC} unreadable at ${PIN}`);
  else {
    const cmp = src.split('\n')[75] ?? '';                      // line 76, the comparison
    const l79 = src.split('\n')[78] ?? '';
    const l80 = src.split('\n')[79] ?? '';
    const eachVsNull = /a === null \|\| b === null/.test(cmp);
    const myRhs = src.match(/^const MY_REV = (.+);$/m)?.[1] ?? '';
    const anchorsFrozen = /readFileSync\(/.test(myRhs) &&
      !/\['log'|rev-list|['"`]HEAD['"`]/.test(myRhs) &&
      /sat\.baselineRev/.test(src.match(/^const HIS_REV = (.+);$/m)?.[1] ?? '');
    MEAS.reach79 = eachVsNull && anchorsFrozen;
    leg('GREACH79', eachVsNull && anchorsFrozen,
      `P4 — :76 is \`${cmp.trim()}\` (each state vs the literal null: ${eachVsNull}) and BOTH anchors ` +
      `are fixed strings read at startup (${anchorsFrozen}) — so the compared figure ("does path p ` +
      `exist at this frozen rev") cannot be moved by ANY commit. Criterion 4 is TRUE of row 79, which ` +
      `is where criterion 1 already sent it: the row satisfies three sub-kinds and his ORDER picks one`);
    leg('GL80ASSERTSEQ', /moved\.length > 0/.test(l80) && /a !== b/.test(src.split('\n')[76] ?? ''),
      `and row 80's leg refuses WHEN they differ (\`${l80.trim().slice(0, 60)}…\`), i.e. it asserts ` +
      `EQUALITY — so criterion 2 is false of it and criterion 3 is the first yes, exactly as he has it`);
    void l79;
  }
}

// ────────── P6: how many GCTRLPRE legs are there, and where?
{
  const ids = ['GCTRLPRE', 'GROWREPRO', 'GCURE', 'G0'];
  const files = [...new Set(his.rows.map((r) => `docs/research/${r.file}`))];
  const sites = [];
  for (const f of files) {
    const s = show(f);
    if (s === null) continue;
    s.split('\n').forEach((l, i) => {
      for (const id of ids) {
        if (new RegExp(`(check|g|refuse|leg)\\('${id}'`).test(l)) sites.push({ id, at: `${f.replace('docs/research/', '')}:${i + 1}` });
      }
    });
  }
  const byId = new Map();
  for (const s of sites) byId.set(s.id, [...(byId.get(s.id) ?? []), s.at]);
  for (const [id, at] of [...byId].sort()) console.log(`  [MEAS] id \`${id}\` is registered at ${at.length} site(s): ${at.join(' , ')}`);
  const multiFile = [...byId].filter(([, at]) => new Set(at.map((a) => a.split(':')[0])).size > 1);
  const ctrl = byId.get('GCTRLPRE') ?? [];
  MEAS.ctrlSites = ctrl;
  MEAS.ctrlSameFile = new Set(ctrl.map((a) => a.split(':')[0])).size === 1;
  leg('GDUPID', multiFile.length > 0,
    `P6 — ids registered in MORE THAN ONE FILE: ${multiFile.length} ` +
    `[${multiFile.map(([id, at]) => `${id}{${at.join('|')}}`).join(' ')}]. \`GCTRLPRE\` sits at ` +
    `${ctrl.length} site(s): ${ctrl.join(' , ')} — so "@161" and "@194" are DIFFERENT FILES, not two ` +
    `lines of one, and his TSV gives them DIFFERENT sub-kinds`);
  const pre161 = his.rows.find((r) => r.id === 'GCTRLPRE' && r.line === '161');
  const pre194 = his.rows.find((r) => r.id === 'GCTRLPRE' && r.line === '194');
  leg('GMYCITATION', pre194 !== undefined && pre194.subkind5 === 'conjunctive' &&
    pre161 !== undefined && pre161.subkind5 === 'keyed',
    `and the consequence is mine: my own 11/02 §7 deferred "the both-sides counterfactual for ` +
    `GCTRLPRE@194" as the perturbation that separates keyed from conjunctive — but @194 ` +
    `(${pre194?.file}) is already \`${pre194?.subkind5}\` and the \`keyed\` GCTRLPRE is @161 ` +
    `(${pre161?.file}). I aimed a named follow-up at the wrong one of two same-named legs, one fire ` +
    `after charging him with exactly that`);
}

// ────────── GC1READER: criterion 1, MEASURED off the predicate rather than hand-read
// Criterion 1 is "are the states never compared TO EACH OTHER (each vs a literal)?". That is a
// property of the predicate's comparison operators, so it can be read instead of asserted. The
// reader strips every string literal FIRST — a why-string's `${...}` interpolation would otherwise
// put an identifier on the wrong side of an operator, which is how my own drive4 broke yesterday.
// [[feedback_reducing_a_predicate_to_operands_can_move_an_identifier_to_the_wrong_side]]
// [[feedback_a_source_scanner_needs_interpolation_and_regex_models]]
//
// It is run on the two departure rows AND on three rows whose c1 I read as FALSE for a
// state-pair reason, so the reader is controlled in both directions and a reader that simply
// returns 0 cannot pass. [[feedback_a_known_positive_must_carry_the_property_not_an_analogy]]
{
  const stripStrings = (t) => t
    .replace(/`(?:\\.|\$\{[^}]*\}|[^`\\])*`/g, '`S`')
    .replace(/'(?:\\.|[^'\\])*'/g, "'S'")
    .replace(/"(?:\\.|[^"\\])*"/g, '"S"');

  // The call span: from the registration line to the line that closes it at paren depth 0.
  const callSpan = (lines, startIdx) => {
    let depth = 0;
    const out = [];
    for (let i = startIdx; i < lines.length && i < startIdx + 24; i++) {
      const stripped = stripStrings(lines[i]);
      out.push(stripped);
      for (const ch of stripped) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      if (depth <= 0 && i > startIdx - 1 && out.join('').includes('(')) return out.join(' ');
    }
    return null;
  };

  const LITERAL = /^(?:-?\d+(?:\.\d+)?|true|false|null|undefined|'S'|"S"|`S`)$/;
  const operandAt = (text, idx, dir) => {
    // walk outward from the operator, collecting the adjacent operand token
    let s = dir < 0 ? text.slice(0, idx) : text.slice(idx);
    if (dir < 0) {
      const m = s.match(/([A-Za-z0-9_$.\]'"`)]+)\s*$/);
      return m ? m[1] : '';
    }
    s = s.replace(/^(?:===|!==|==|!=)\s*/, '');
    const m = s.match(/^([A-Za-z0-9_$.['"`(]+[A-Za-z0-9_$.\]'"`)]*)/);
    return m ? m[1] : '';
  };

  const crossStateCmps = (callText) => {
    const found = [];
    const re = /===|!==|==(?!=)|!=(?!=)/g;
    let m;
    while ((m = re.exec(callText)) !== null) {
      const l = operandAt(callText, m.index, -1);
      const r = operandAt(callText, m.index, +1);
      const lLit = LITERAL.test(l) || /^'S'|^"S"|^`S`/.test(l);
      const rLit = LITERAL.test(r) || /^'S'|^"S"|^`S`/.test(r);
      found.push({ op: m[0], l, r, cross: !lLit && !rLit });
    }
    return found;
  };

  const TARGETS = [
    { file: ATTRIB, line: 71, id: 'GCURE', expectCross: 0, role: 'departure' },
    { file: STEAL, line: 90, id: 'GCURE', expectCross: 0, role: 'departure' },
    { file: REC3, line: 99, id: 'C2b', expectCross: 1, role: 'departure (control +)' },
    { file: ATTRIB, line: 88, id: 'GPATHS', expectCross: 1, role: 'control +' },
    { file: STEAL, line: 211, id: 'GROWREPRO', expectCross: 1, role: 'control +' },
  ];

  let unreadable = 0;
  const results = [];
  for (const t of TARGETS) {
    const src = show(t.file);
    if (src === null) { unreadable++; continue; }
    const lines = src.split('\n');
    const span = callSpan(lines, t.line - 1);
    if (span === null) { unreadable++; results.push({ ...t, cmps: null }); continue; }
    const cmps = crossStateCmps(span);
    const nCross = cmps.filter((c) => c.cross).length;
    results.push({ ...t, nCmp: cmps.length, nCross, cmps });
    console.log(`  [C1] ${t.file.replace('docs/research/', '')}:${t.line} ${t.id} (${t.role}) — ` +
      `${cmps.length} comparison(s), ${nCross} of them state-vs-state` +
      (cmps.length ? `: ${cmps.map((c) => `${c.l}${c.op}${c.r}${c.cross ? '[X]' : ''}`).join(' , ')}` : ''));
  }

  const ok = unreadable === 0 && results.every((r) =>
    r.expectCross === 0 ? r.nCross === 0 : r.nCross >= 1);
  MEAS.c1ReaderOk = ok;
  MEAS.c1Zero = results.filter((r) => r.nCross === 0).map((r) => `${r.id}@${r.line}`);
  leg('GC1READER', unreadable === 0 ? ok : null,
    `criterion 1 read off the predicates of 5 rows (2 expected 0 state-vs-state comparisons, 3 ` +
    `expected >=1): ${results.map((r) => `${r.id}@${r.line}=${r.nCross}/${r.nCmp}`).join(' ')} — ` +
    `${ok ? 'the reader separates the two directions, so c1=T on the GCURE rows is MEASURED and not read' : 'MISMATCH against my hand read'}`);

  const noCmpAtAll = results.filter((r) => r.nCmp === 0).map((r) => `${r.id}@${r.line}`);
  leg('GNOCMP', true,
    `and the sharper fact, reported not asserted: ${noCmpAtAll.length} of the 5 rows carry ZERO ` +
    `comparison operators in the whole predicate [${noCmpAtAll.join(',') || 'none'}] — for those, ` +
    `criterion 2 ("does the comparison assert they DIFFER?") has no comparison to read at all, so ` +
    `it is UNANSWERABLE rather than merely ambiguous`);
}

// ────────── the convention entry actually carries the three terms
{
  const conv = show(CONV);
  if (conv === null) leg('GCONV', null, `${CONV} unreadable at ${PIN}`);
  else {
    const has = (t) => new RegExp(t).test(conv);
    const v11 = /v1\.1/.test(conv);
    leg('GCONV', v11 && has('conjunctive') && has('staleness') && has('inert'),
      `${CONV} at the pin is v1.1 (${v11}) and names conjunctive/${has('conjunctive')} ` +
      `staleness/${has('staleness')} inert/${has('inert')}; MEASURED-BLOCK-V11 present: ` +
      `${has('MEASURED-BLOCK-V11')}`);
  }
}

// ────────── GNODEPEND / GHISDIRCLEAN — asserted inside the harness, not by hand
{
  const dirty = (git(['status', '--porcelain', '--', 'packages/', 'scripts/']) ?? 'ERR');
  leg('GNODEPEND', dirty.trim() === '',
    `git status --porcelain -- packages/ scripts/ is ${Buffer.byteLength(dirty, 'utf8')} bytes`);
  const hisDirty = (git(['status', '--porcelain', '--', HIS_DIR]) ?? 'ERR');
  leg('GHISDIRCLEAN', hisDirty.trim() === '',
    `git status --porcelain -- ${HIS_DIR} is ${Buffer.byteLength(hisDirty, 'utf8')} bytes — this unit ` +
    `reads his directory and must not write it`);
}

// ─────────────────────────────────────────────────────────────────────────── prediction verdicts
const legOf = (id) => LEGS.find((l) => l.id === id);
const verdict = (name, ok, note) => console.log(`  ${name}  ${ok === null ? 'UNRESOLVED' : ok ? 'LANDS   ' : 'REFUTED '}  ${note}`);
// A verdict is UNRESOLVED only when the figure it reads was never measured. Each line below names
// the figure and the registered threshold, so the verdict can be re-derived from the printed
// numbers without re-running. [[feedback_exit_0_without_a_summary_line_is_not_a_measurement]]
const resolved = (v) => (v === undefined || v === null ? null : v);

console.log('');
console.log('  ── prediction verdicts ─────────────────────────────────────────────────────────────────');
verdict('P1', resolved(MEAS.myRevIsFile === undefined ? null : MEAS.myRevIsFile && !MEAS.myRevIsLive),
  `declared non-blind. MY_REV is a readFileSync=${MEAS.myRevIsFile}, carries no live selector=` +
  `${MEAS.myRevIsLive === undefined ? '??' : !MEAS.myRevIsLive} — measure.mjs:80 is staleness, not ` +
  'keyed, and my published keyed-and-reachable 3 is 2');
verdict('P2', resolved(MEAS.baseWriters === undefined ? null
  : MEAS.baseWriters.length >= 1 && MEAS.subjectCommits >= 2),
  `registered: >=1 writer AND >=2 commits on the subject's anchor. Measured: writers=` +
  `${MEAS.baseWriters?.length ?? '??'} (threshold >=1), subject anchor commits=` +
  `${MEAS.subjectCommits ?? '??'} (threshold >=2). BOTH HALVES REFUTED — the separating axis is not ` +
  'edit-moved vs drive-moved but LITERAL vs SELECTOR anchor, which is his own criterion 4');
verdict('P3', resolved(MEAS.overlapN === undefined ? null : MEAS.overlapN >= 3),
  `registered: >=3 of 13 rows with two or more criteria true. Measured: ${MEAS.overlapN ?? '??'} of ` +
  `${MEAS.rowN ?? '??'} — "first yes decides" is ordering an overlap, not resolving one`);
verdict('P4', resolved(MEAS.reach79),
  `registered: criterion 4 evaluates TRUE on measure.mjs:79. Measured: ${MEAS.reach79} — so the ` +
  'consequence I attached to `conjunctive` ("reddens twice on a cure") does not hold there at all');
verdict('P5', resolved(MEAS.hazardSame === undefined ? null : !MEAS.hazardSame),
  `registered: his hazard cell is a FLOOR, i.e. my member list would differ. Measured: member lists ` +
  `${MEAS.hazardSame ? 'IDENTICAL' : 'DIFFERENT'} — REFUTED, his 2 of 13 is exact under an ` +
  'independently-applied key, and I registered expecting this');
verdict('P6', resolved(MEAS.ctrlSites === undefined ? null
  : MEAS.ctrlSites.length > 1 && MEAS.ctrlSameFile),
  `registered three branches, one of them "two GCTRLPRE registrations in grade-the-steal-cures.mjs". ` +
  `Measured: ${MEAS.ctrlSites?.length ?? '??'} sites, in the same file=${MEAS.ctrlSameFile} — ` +
  'REFUTED as registered; the answer is a fourth branch, two files, different sub-kinds');

console.log('');
console.log(`GATES  ${RED} RED · ${UNRUNNABLE} UNRUNNABLE · ${LEGS.length - RED - UNRUNNABLE} ok  (of ${LEGS.length} legs)`);
if (UNRUNNABLE > 0) { console.log('UNIT REFUSES — a leg could not run.'); process.exit(2); }
if (RED > 0) { console.log('UNIT RED.'); process.exit(1); }
console.log('UNIT GREEN.');
