#!/usr/bin/env node
// unit-464presc — is `history-keyed > movable` unmeasurable in the WHOLE tree?
//
// The search is INVERTED relative to unit-464outside. That unit asked "which legs are CROSS-STATE,
// and do any of them carry a selector?", which inherits every blindness of my class key (its own §3
// reports 87 of 126 UNMODELLED at depth 5). This asks, selector-first:
//
//   does ANY leg site in the tree carry a recency-SELECTOR anchor beside a MOVABLE anchor?
//
// That is the witness property for `history-keyed > movable`, and it is testable on the leg's closed
// text without first deciding CROSS-STATE vs GATE — so it is blind neither to my class key's
// coverage nor to the authorship selector that scoped the published census to 19 dirs.
//
// Population: EVERY `.mjs` under `docs/research/` at the PIN, read via `git ls-tree`/`git show` so
// the surface is reproducible from a rev rather than from this worktree's filesystem.
// [[feedback_a_population_keyed_on_ls_files_is_irreproducible_from_any_rev]]
//
// Site enumeration and the anchor-kind classifier are LIFTED from my own committed source at the
// pin and evaluated — never retyped — so the sites are the published census's sites and the kinds
// are the convention's own published kinds. A failed lift is UNRUNNABLE, not degraded.
// [[feedback_slicing_the_inputs_but_retyping_the_verdict]]
//
// Cripple: `--cripple=mysurface` re-keys the POPULATION back to the 19-dir authorship-selected
// surface. A switch on the key, not the subject — nothing under docs/research/ is written.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = '/Users/xian/Development/klatch-worktrees/daedalus';
const PIN = process.env.PIN ?? '0ae48068';
const SELF_DIR = 'unit-464presc-2026-11-03';
const argv = process.argv.slice(2);
const CRIPPLE = (argv.find((a) => a.startsWith('--cripple=')) ?? '').replace('--cripple=', '');
const DEPTH = Number((argv.find((a) => a.startsWith('--depth=')) ?? '--depth=1').replace('--depth=', ''));
const MAX_TEXT = 200_000;

const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gitq = (args) => { try { return git(args); } catch { return null; } };

const legs = [];
const check = (name, pass, note) => { legs.push({ name, pass, note }); return pass; };
const die = (why) => { console.error(`UNRUNNABLE: ${why}`); process.exit(2); };

console.log('unit-464presc — selector-first witness census over the WHOLE tree');
console.log(`PIN=${PIN}  CRIPPLE=${CRIPPLE || '(none)'}  DEPTH=${DEPTH}`);
console.log(`instrument blob (worktree copy of this file): ${git(['hash-object', fileURLToPath(import.meta.url)]).trim()}`);
console.log('');

// ──────────────────────────────────────────────── stage 0: lift my own predicates from the pin
const ENUM_REL = 'docs/research/unit-464class-2026-11-02/enumerate-legs.mjs';
const CLASS_REL = 'docs/research/unit-464class-2026-11-02/classify-and-grade.mjs';
const PREC_REL = 'docs/research/unit-464prec-2026-11-03/grade-prec.mjs';

const enumSrc = gitq(['show', `${PIN}:${ENUM_REL}`]);
const classSrc = gitq(['show', `${PIN}:${CLASS_REL}`]);
const precSrc = gitq(['show', `${PIN}:${PREC_REL}`]);
if (enumSrc === null) die(`cannot read ${ENUM_REL} at ${PIN}`);
if (classSrc === null) die(`cannot read ${CLASS_REL} at ${PIN}`);
if (precSrc === null) die(`cannot read ${PREC_REL} at ${PIN}`);

// Anchored slicing: a verbatim start line plus a column-0 terminator, then the slice is asserted
// non-empty and asserted to PARSE. A present anchor is not an intact span.
// [[feedback_a_present_anchor_does_not_mean_an_intact_span]]
function sliceFrom(src, startAnchor, endAnchor, label) {
  const lines = src.split('\n');
  const hits = lines.filter((l) => l === startAnchor).length;
  if (hits !== 1) die(`lift ${label}: start anchor found ${hits} times, need exactly 1`);
  const a = lines.findIndex((l) => l === startAnchor);
  let b = -1;
  for (let i = a + 1; i < lines.length; i++) if (lines[i] === endAnchor) { b = i; break; }
  if (b < 0) die(`lift ${label}: terminator ${JSON.stringify(endAnchor)} not found after start`);
  return { text: lines.slice(a, b + 1).join('\n'), lines: b - a + 1 };
}

const LIFTS = [
  ['blankNonCode', enumSrc, 'function blankNonCode(src) {', '}'],
  ['lineOf', enumSrc, "const lineOf = (src, idx) => { let n = 1; for (let k = 0; k < idx; k++) if (src[k] === '\\n') n++; return n; };", null],
  ['IDIOMS', enumSrc, 'const IDIOMS = [', '];'],
  ['spans', enumSrc, 'function spans(src, blanked, idiom, rel) {', '}'],
  ['enclosingIf', enumSrc, 'function enclosingIf(src, blanked, at) {', '}'],
  ['declarationsOf', classSrc, 'function declarationsOf(src) {', '}'],
  ['KIND_AXISB', precSrc, 'const KIND_AXISB = {', '};'],
  ['kindOf', precSrc, 'const kindOf = (line) => {', '};'],
];

const lifted = {};
const liftReport = [];
for (const [label, src, start, end] of LIFTS) {
  if (end === null) {
    const n = src.split('\n').filter((l) => l === start).length;
    if (n !== 1) die(`lift ${label}: single-line anchor found ${n} times, need exactly 1`);
    lifted[label] = start;
    liftReport.push({ label, lines: 1 });
  } else {
    const { text, lines } = sliceFrom(src, start, end, label);
    lifted[label] = text;
    liftReport.push({ label, lines });
  }
}

let K;
try {
  K = new Function(`
    'use strict';
    const problems = [];
    ${lifted.blankNonCode}
    ${lifted.lineOf}
    ${lifted.IDIOMS}
    ${lifted.spans}
    ${lifted.enclosingIf}
    ${lifted.declarationsOf}
    ${lifted.KIND_AXISB}
    ${lifted.kindOf}
    return { blankNonCode, lineOf, IDIOMS, spans, enclosingIf, declarationsOf, KIND_AXISB, kindOf, problems };
  `)();
} catch (e) {
  die(`lifted fragments do not parse: ${e.message}`);
}

check('GLIFT', LIFTS.every(([l]) => typeof lifted[l] === 'string' && lifted[l].length > 0)
  && typeof K.kindOf === 'function' && typeof K.spans === 'function'
  && Array.isArray(K.IDIOMS) && K.IDIOMS.length === 3
  && K.KIND_AXISB.selector === 'history-keyed' && K.KIND_AXISB.live === 'movable',
  `${LIFTS.length} fragments lifted from my 3 committed files at ${PIN} and evaluated: ` +
  `${liftReport.map((r) => `${r.label}(${r.lines}L)`).join(' ')}; ` +
  `KIND_AXISB maps selector->history-keyed and live->movable, 3 site idioms`);

// The axis-B value of each lifted anchor kind, taken from the lifted map rather than restated.
const MOVABLE_KINDS = Object.keys(K.KIND_AXISB).filter((k) => K.KIND_AXISB[k] === 'movable');
const SELECTOR_KINDS = Object.keys(K.KIND_AXISB).filter((k) => K.KIND_AXISB[k] === 'history-keyed');
check('GAXISBARMS', MOVABLE_KINDS.length >= 1 && SELECTOR_KINDS.length >= 1,
  `the witness property is read off the lifted map, not retyped: movable kinds = [${MOVABLE_KINDS}], ` +
  `history-keyed kinds = [${SELECTOR_KINDS}]`);

// ─────────────── the WIDE detectors: mine, DECLARED, so a narrow zero can be told from a real one
//
// `kindOf`'s selector arm is `/\['log', '-1'/` — an array-literal call style that is MINE. A tree
// where other authors write `gitIn(root, 'log', '-1', …)` would read 0 under it while being full of
// selectors. These wide forms exist to measure that gap, not to replace the narrow ones.
const SELECTOR_WIDE = [
  /['"`]log['"`][\s\S]{0,80}?['"`]-1['"`][\s\S]{0,240}?['"`]--['"`]/,
  /\batRecency\b/,
  /['"`]rev-list['"`][\s\S]{0,120}?['"`]--['"`]/,
  /--format=%[hH][\s\S]{0,240}?['"`]--['"`]/,
];
const MOVABLE_WIDE = [
  /['"`]HEAD['"`]/,
  /HEAD:/,
  /readFileSync\(join\(LIVE/,
  /\bcell\(/,
  /process\.cwd\(\)/,
];

// ───────────────────────────────────────────────────── stage 1: the population, read from the pin
const tree = git(['ls-tree', '-r', '--name-only', PIN, '--', 'docs/research/']).trim().split('\n').filter(Boolean);
const allMjs = tree.filter((p) => p.endsWith('.mjs'));
const dirOf = (p) => p.split('/')[2];
const allDirs = [...new Set(tree.map(dirOf).filter(Boolean))].sort();

const familyOf = (d) => /^unit-464/.test(d) ? 'unit-464'
  : /^round\d+/.test(d) ? 'roundNNN'
  : /^unit-/.test(d) ? 'unit-other'
  : 'other';

// TWO dir denominators, because they are different questions and the relayed 136 is the second one.
// `allDirs` is every directory under docs/research/; `mjsDirs` is every directory that holds an
// instrument. Most round directories hold only recordings, so the two differ by a factor of three.
const mjsDirs = [...new Set(allMjs.map(dirOf))].sort();

const famDirs = {}, famMjsDirs = {}, famFiles = {};
for (const d of allDirs) (famDirs[familyOf(d)] ??= []).push(d);
for (const d of mjsDirs) (famMjsDirs[familyOf(d)] ??= []).push(d);
for (const p of allMjs) (famFiles[familyOf(dirOf(p))] ??= []).push(p);

// HIS selector — my own line 181 from the published census — applied here, not its result retyped.
const unit464Dirs = (famDirs['unit-464'] ?? []);
const mineAll = unit464Dirs.filter((d) => {
  if (d === SELF_DIR) return false;
  const authors = (gitq(['log', '--diff-filter=A', '--format=%an', PIN, '--', `docs/research/${d}`]) ?? '')
    .trim().split('\n').filter(Boolean);
  const oldest = authors[authors.length - 1] || '(none)';   // newest-first ⇒ last is oldest
  return /^Daedalus/.test(oldest);
});
// `mineAll` is what the authorship selector ADMITS. The surface actually CENSUSED excludes the
// census's own directory — enumerate-legs.mjs does this at its `mineDirs` line, and the relayed
// "19 dirs · 52 .mjs" is the admitted set, one dir and two files larger than what was read.
const censusSurface = mineAll.filter((d) => d !== 'unit-464class-2026-11-02');
const censusFiles = allMjs.filter((p) => censusSurface.includes(dirOf(p)));
const admittedFiles = allMjs.filter((p) => mineAll.includes(dirOf(p)));

console.log('population at the pin, by family:');
console.log(`  family        all-dirs  dirs-with-.mjs   .mjs`);
for (const fam of ['unit-464', 'roundNNN', 'unit-other', 'other']) {
  console.log(`  ${fam.padEnd(12)} ${String((famDirs[fam] ?? []).length).padStart(8)} ${String((famMjsDirs[fam] ?? []).length).padStart(15)} ${String((famFiles[fam] ?? []).length).padStart(6)}`);
}
console.log(`  ${'TOTAL'.padEnd(12)} ${String(allDirs.length).padStart(8)} ${String(mjsDirs.length).padStart(15)} ${String(allMjs.length).padStart(6)}`);
console.log(`  authorship ADMITS      ${String(mineAll.length).padStart(2)} dirs · ${String(admittedFiles.length).padStart(3)} .mjs   (the relayed "census surface")`);
console.log(`  actually CENSUSED      ${String(censusSurface.length).padStart(2)} dirs · ${String(censusFiles.length).padStart(3)} .mjs   = ` +
  `${(100 * censusFiles.length / allMjs.length).toFixed(1)}% of the tree's instruments ` +
  `(the census excludes its own directory, 1 dir / ${admittedFiles.length - censusFiles.length} .mjs)`);
console.log('');

const popFiles = (CRIPPLE === 'mysurface' ? censusFiles : allMjs).filter((p) => dirOf(p) !== SELF_DIR);
console.log(`POPULATION THIS ARM: ${popFiles.length} .mjs over ${new Set(popFiles.map(dirOf)).size} dirs ` +
  `(this unit's own directory excluded either way)`);
console.log('');

const srcCache = new Map();
const sourceOf = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, gitq(['show', `${PIN}:${rel}`]) ?? '');
  return srcCache.get(rel);
};
const declCache = new Map();
const declsFor = (rel) => {
  if (!declCache.has(rel)) declCache.set(rel, K.declarationsOf(sourceOf(rel)));
  return declCache.get(rel);
};

// ────────────────────────────────── stage 2: closed text per leg site, then the anchor kinds in it
const closedTextOf = (rel, predicate) => {
  if (!predicate) return '';
  const decls = declsFor(rel);
  let text = predicate;
  const seen = new Set();
  let frontier = [predicate];
  for (let level = 0; level < DEPTH; level++) {
    const next = [];
    for (const chunk of frontier) {
      for (const id of new Set(chunk.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? [])) {
        if (seen.has(id) || !decls.has(id)) continue;
        seen.add(id);
        const rhs = decls.get(id);
        if (text.length + rhs.length > MAX_TEXT) continue;
        text += '\n' + rhs;
        next.push(rhs);
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  return text;
};

// The witness classifier. NARROW arms are the lifted `kindOf` applied line by line; WIDE arms are
// my declared regexes over the same text. Both are reported for every site.
const classifySite = (text) => {
  const kinds = new Set();
  for (const line of text.split('\n')) {
    const k = K.kindOf(line);
    if (k) kinds.add(k);
  }
  const narrowSel = SELECTOR_KINDS.some((k) => kinds.has(k));
  const narrowMov = MOVABLE_KINDS.some((k) => kinds.has(k));
  const wideSel = SELECTOR_WIDE.some((r) => r.test(text));
  const wideMov = MOVABLE_WIDE.some((r) => r.test(text));
  return {
    kinds: [...kinds], narrowSel, narrowMov, wideSel, wideMov,
    narrowWitness: narrowSel && narrowMov,
    wideWitness: wideSel && wideMov,
    anyKind: kinds.size > 0,
  };
};

// ─────── stage 3 (BLOCKING, P3): the witness arm on a CONSTRUCTED known positive, passed as TEXT
//
// Theseus's two legs are known positives for SELECTOR DETECTION. Neither carries a `movable`
// conjunct — he hand-read both as immovable + history-keyed — so the witness arm has NO known
// positive anywhere in this tree, and a zero from an arm that has never fired is not a measurement.
// [[feedback_a_known_positive_must_carry_the_property_not_an_analogy]]
// The KP is text, not a file: writing it under docs/research/ would put it in the population and
// turn the very zero being measured into a one.
// [[feedback_an_instrument_does_not_census_its_own_source]]
const KP_TEXT = [
  "check('GKPWITNESS', atRecencyHead === cellNow,",
  "  const atRecencyHead = g(['log', '-1', '--format=%H', '--', SUBJECT]);",
  "  const cellNow = cell(readFileSync(join(LIVE, 'map.tsv'), 'utf8'));",
].join('\n');
const KP = classifySite(KP_TEXT);
check('GKP', KP.narrowWitness && KP.wideWitness,
  `the CONSTRUCTED known positive — a selector anchor beside a movable anchor — is classed a witness ` +
  `by both arms: narrow=${KP.narrowWitness} (kinds [${KP.kinds}]) wide=${KP.wideWitness}. ` +
  `Without this leg a tree-wide 0 would be an arm that never fired`);
if (!KP.narrowWitness || !KP.wideWitness) die('the witness arm does not fire on its own constructed KP');

// A matched negative: the SAME text with the selector anchor removed must NOT be a witness.
const KP_NEG = classifySite(KP_TEXT.split('\n').filter((l) => !/'log', '-1'/.test(l) && !/atRecency/.test(l)).join('\n'));
check('GKPNEG', !KP_NEG.narrowWitness && !KP_NEG.wideWitness,
  `the matched negative — same text, selector anchor deleted — is NOT a witness ` +
  `(narrow=${KP_NEG.narrowWitness} wide=${KP_NEG.wideWitness}), so the arm is not firing on everything`);

// ──────────────────────────────────────────── stage 4: enumerate every leg site in the population
const sites = [];
const fileRows = [];
for (const rel of popFiles) {
  const src = sourceOf(rel);
  if (!src) continue;
  const blanked = K.blankNonCode(src);
  let n = 0;
  for (const idiom of K.IDIOMS) {
    for (const h of K.spans(src, blanked, idiom, rel)) {
      n++;
      const predicate = idiom.kind === 'REFUSE-SITE' ? h.guard : h.span;
      const text = closedTextOf(rel, predicate);
      sites.push({ rel, dir: dirOf(rel), fam: familyOf(dirOf(rel)), line: h.line, id: h.id, idiom: idiom.idiom,
        span: predicate ?? '', closed: text, ...classifySite(text) });
    }
  }
  fileRows.push({
    rel, fam: familyOf(dirOf(rel)), sites: n,
    selNarrow: SELECTOR_KINDS.some((k) => src.split('\n').some((l) => K.kindOf(l) === k)),
    selWide: SELECTOR_WIDE.some((r) => r.test(src)),
  });
}

// ───────────────────────────────────────────────────────────────────── the figures
const byFam = (fam) => sites.filter((s) => s.fam === fam);
const FAMS = ['unit-464', 'roundNNN', 'unit-other', 'other'];
console.log('leg sites and anchor-kind reach, by family:');
console.log(`  family        files  sites  kindOf-nonnull  sel(narrow)  sel(wide)  mov(narrow)`);
for (const fam of FAMS) {
  const fs = fileRows.filter((f) => f.fam === fam);
  const ss = byFam(fam);
  if (fs.length === 0) continue;
  console.log(`  ${fam.padEnd(12)} ${String(fs.length).padStart(5)} ${String(ss.length).padStart(6)} ` +
    `${String(ss.filter((s) => s.anyKind).length).padStart(15)} ${String(ss.filter((s) => s.narrowSel).length).padStart(12)} ` +
    `${String(ss.filter((s) => s.wideSel).length).padStart(10)} ${String(ss.filter((s) => s.narrowMov).length).padStart(12)}`);
}
console.log(`  ${'TOTAL'.padEnd(12)} ${String(fileRows.length).padStart(5)} ${String(sites.length).padStart(6)} ` +
  `${String(sites.filter((s) => s.anyKind).length).padStart(15)} ${String(sites.filter((s) => s.narrowSel).length).padStart(12)} ` +
  `${String(sites.filter((s) => s.wideSel).length).padStart(10)} ${String(sites.filter((s) => s.narrowMov).length).padStart(12)}`);
console.log('');

const selFilesNarrow = fileRows.filter((f) => f.selNarrow);
const selFilesWide = fileRows.filter((f) => f.selWide);
console.log(`files carrying a selector idiom: narrow ${selFilesNarrow.length} · wide ${selFilesWide.length} of ${fileRows.length}`);
for (const f of selFilesWide) console.log(`    ${f.selNarrow ? 'both ' : 'WIDE '} ${f.rel.replace('docs/research/', '')}`);
console.log('');

const narrowWitnesses = sites.filter((s) => s.narrowWitness);
const wideWitnesses = sites.filter((s) => s.wideWitness);
console.log(`WITNESSES to \`history-keyed > movable\` (a selector anchor beside a movable anchor in one leg):`);
console.log(`  narrow (lifted kindOf, both arms)  ${narrowWitnesses.length}`);
console.log(`  wide   (declared regexes)          ${wideWitnesses.length}`);
// Provenance per candidate, so each one can be graded rather than counted. A match that lands only
// in text pulled in by the closure expansion — or inside a PROSE argument of a reporting call — is
// not a conjunct of the leg's predicate. [[feedback_a_proximity_window_consumer_key_over_reports]]
const firstMatch = (text, res) => {
  for (const r of res) { const m = text.match(r); if (m) return m[0].replace(/\s+/g, ' ').slice(0, 90); }
  return null;
};
const PROSE_ARG = /^[A-Za-z0-9_]+\s*\(\s*\n?\s*['"`][A-Za-z0-9_]+['"`]\s*,\s*\n?\s*`/;
for (const s of wideWitnesses.slice(0, 40)) {
  const selInSpan = SELECTOR_WIDE.some((r) => r.test(s.span));
  const movInSpan = MOVABLE_WIDE.some((r) => r.test(s.span));
  console.log(`    ${s.rel.replace('docs/research/', '')}:${s.line} ${s.id ?? '(no literal id)'} ` +
    `narrow=${s.narrowWitness} kinds=[${s.kinds}]`);
  console.log(`        sel  in-span=${selInSpan}  via=${firstMatch(s.closed, SELECTOR_WIDE)}`);
  console.log(`        mov  in-span=${movInSpan}  via=${firstMatch(s.closed, MOVABLE_WIDE)}`);
  console.log(`        both-in-span=${selInSpan && movInSpan}  prose-arg-call=${PROSE_ARG.test(s.span)}  ` +
    `span=${s.span.length}B closed=${s.closed.length}B`);
}
console.log('');

// A candidate whose two arms are BOTH inside the predicate span is the only kind that can be a
// conjunct pair. Everything else is the expansion's reach or a report call's prose.
const inSpanWitnesses = wideWitnesses.filter((s) =>
  SELECTOR_WIDE.some((r) => r.test(s.span)) && MOVABLE_WIDE.some((r) => r.test(s.span)));
console.log(`candidates with BOTH arms inside the predicate span: ${inSpanWitnesses.length} of ${wideWitnesses.length}`);
for (const s of inSpanWitnesses) console.log(`    ${s.rel.replace('docs/research/', '')}:${s.line} ${s.id}`);
console.log('');

// ───────────── P5: Theseus's two constructed legs, by name — is my detector able to see his work?
const HIS_REL = 'docs/research/unit-464conj-2026-11-03/occupy-conj-history.mjs';
const hisSites = sites.filter((s) => s.rel === HIS_REL);
const hisKP = ['GFIXEDCTRL', 'GC2MOVED'].map((id) => {
  const s = hisSites.find((x) => x.id === id);
  return { id, found: !!s, line: s?.line ?? null, narrowSel: s?.narrowSel ?? null, wideSel: s?.wideSel ?? null, kinds: s?.kinds ?? [] };
});
console.log(`Theseus's two constructed legs in ${HIS_REL.replace('docs/research/', '')}:`);
for (const h of hisKP) console.log(`    ${h.id.padEnd(12)} site found=${h.found} line=${h.line} selector narrow=${h.narrowSel} wide=${h.wideSel} kinds=[${h.kinds}]`);
console.log('');

const bothSitesFound = hisKP.every((h) => h.found);
const bothSelNarrow = hisKP.every((h) => h.narrowSel === true);
const bothSelWide = hisKP.every((h) => h.wideSel === true);
check('GHISSITES', bothSitesFound,
  `both of his constructed leg sites are enumerated by the lifted site walker: ` +
  `${hisKP.map((h) => `${h.id}=${h.found}`).join(' ')}`);
check('GHISSELWIDE', bothSelWide,
  `my WIDE selector arm sees both of his constructed selector legs: ${hisKP.map((h) => `${h.id}=${h.wideSel}`).join(' ')}`);
check('GHISSELNARROW', bothSelNarrow,
  `the CONVENTION'S OWN lifted selector arm sees both of his constructed selector legs: ` +
  `${hisKP.map((h) => `${h.id}=${h.narrowSel}`).join(' ')} — a FALSE here is a defect of my published ` +
  `classifier, not of his legs, and makes every narrow zero a floor`);

check('GSELARMFIRED', selFilesWide.length > 0,
  `the selector detector's positive arm fires on this surface at all: ${selFilesWide.length} file(s) wide, ` +
  `${selFilesNarrow.length} narrow — so a witness count of 0 is a measured zero and not a dead detector`);

const roundSel = selFilesWide.filter((f) => f.fam === 'roundNNN');
const roundSites = byFam('roundNNN');
check('GROUNDREACHED', roundSites.length > 0,
  `the NEWLY censused roundNNN family is reached at all: ${roundSites.length} leg sites over ` +
  `${fileRows.filter((f) => f.fam === 'roundNNN').length} files, ${roundSites.filter((s) => s.anyKind).length} with a ` +
  `kindOf-classified anchor — if this were 0 the family would be counted, not censused, a second time`);

// ───────────────────────────────────────────────────────────────────── verdicts
// Compared on HIS denominator — dirs that hold an instrument — not on every directory under
// docs/research/. [[feedback_reproduce_their_figures_under_their_own_key]]
const P1 = {
  u464dirs: (famMjsDirs['unit-464'] ?? []).length, u464files: (famFiles['unit-464'] ?? []).length,
  rndDirs: (famMjsDirs['roundNNN'] ?? []).length, rndFiles: (famFiles['roundNNN'] ?? []).length,
  totDirs: mjsDirs.length, totFiles: allMjs.length,
  censDirs: mineAll.length, censFiles: admittedFiles.length,
};
const P1_EXPECT = { u464dirs: 37, u464files: 106, rndDirs: 91, rndFiles: 191, totDirs: 136, totFiles: 308, censDirs: 19, censFiles: 52 };
const P1_DEPART = Object.keys(P1_EXPECT).filter((k) => P1[k] !== P1_EXPECT[k]);

const P2 = roundSel.length >= 1;
const P3 = KP.narrowWitness && KP.wideWitness && !KP_NEG.narrowWitness && !KP_NEG.wideWitness;
const P4 = narrowWitnesses.length === 0 && wideWitnesses.length === 0;
const P5 = bothSitesFound && bothSelWide;
const P6 = CRIPPLE === 'mysurface'
  ? { reached: null, note: 'this IS the crippled arm; the delta is computed against the baseline recording' }
  : { reached: null, note: 'baseline arm' };

console.log('PREDICTIONS');
const verdict = (p) => (p === true ? 'LANDS' : p === false ? 'REFUTED' : 'UNGRADED');
console.log(`  P1 census reproduction        ${P1_DEPART.length === 0 ? 'LANDS' : 'DEPARTS'} — ` +
  `${P1_DEPART.length} of 8 figures depart` +
  (P1_DEPART.length ? `: ${P1_DEPART.map((k) => `${k} ${P1[k]} vs relayed ${P1_EXPECT[k]}`).join(', ')}` : ''));
console.log(`  P2 selector on the NEW surface ${verdict(P2)} — roundNNN selector-bearing files = ${roundSel.length} (threshold ≥ 1)`);
console.log(`  P3 witness arm fires on its KP ${verdict(P3)} — BLOCKING`);
console.log(`  P4 tree-wide real witnesses = 0 ${verdict(P4)} — narrow ${narrowWitnesses.length} · wide ${wideWitnesses.length}` +
  (P2 ? '' : '  [READ WITH P2: roundNNN selector arm unreached, so this is UNGRADED on that family]'));
console.log(`  P5 his two legs are visible     ${verdict(P5)} — sites ${bothSitesFound}, wide ${bothSelWide}, ` +
  `NARROW (the convention's own) ${bothSelNarrow}`);
console.log(`  P6 cripple moves a FIGURE       ${P6.note}`);
console.log('');

console.log('LEGS');
for (const l of legs) console.log(`  ${l.pass ? 'GREEN' : 'RED  '} ${l.name.padEnd(16)} ${l.note}`);
const red = legs.filter((l) => !l.pass);
console.log('');
console.log(`SUMMARY  legs ${legs.length} · green ${legs.length - red.length} · red ${red.length}` +
  (red.length ? ` [${red.map((l) => l.name).join(' ')}]` : ''));
console.log(`FIGURES  pop_files=${popFiles.length} pop_dirs=${new Set(popFiles.map(dirOf)).size} sites=${sites.length} ` +
  `sel_files_wide=${selFilesWide.length} sel_files_narrow=${selFilesNarrow.length} ` +
  `witnesses_narrow=${narrowWitnesses.length} witnesses_wide=${wideWitnesses.length} ` +
  `kindof_nonnull_sites=${sites.filter((s) => s.anyKind).length}`);
if (K.problems.length) console.log(`PROBLEMS from the lifted walker: ${K.problems.length}`);
