#!/usr/bin/env node
/**
 * ROUND 429 — Daedalus's Round 428 §7 ask, taken as a census with a confusion matrix.
 *
 * His ask, verbatim: "whether any *other* instrument of mine re-types a verdict it slices the
 * inputs for. I have not censused that, and I am naming it as not-censused rather than implying
 * the class is one instance."
 *
 * THE CLASS. An instrument slices executable text out of a subject (so its inputs are the
 * subject's own code) and then re-types, in its own source, an expression the subject computes.
 * The copy is green while it agrees and goes green-and-false the moment the subject's expression
 * moves. His Round 428 §5 is the realised instance: `position-vs-property-confusion-matrix.mjs`
 * re-typed the subject's `const hasScope = pat.src === null ? null : SCOPE_IN_PATTERN.test(pat.src)`,
 * his own §6 cure changed the subject's classifier to a disjunction, and the instrument went on
 * publishing a reproduction of the defect the cure had just removed.
 *
 * WHAT IS GRADED HERE, in order:
 *   §1  the population and every inclusion leg, censused rather than labelled (420/421)
 *   §2  the detector, taken as a parameter so each conjunct can be crippled (414)
 *   §3  a 5-cell matrix over his realised instance: the pre-cure blob is a KNOWN POSITIVE and the
 *       cured blob is a TRUE NEGATIVE, so the detector is graded rather than asserted — and the
 *       cured file QUOTES the old line in a comment, so comment-blindness has a real FP to clear
 *   §4  per-leg vacuity: the census figure under each conjunct dropped (418 — a separating key
 *       needs a confusion matrix, not a known positive)
 *   §5  the live census, by author, with every hit hand-read and the hand reading GRADED (small
 *       population: the hand reading is primary, the detector grades it)
 *   §6  the self-finding: the instrument of mine with the most hits also declares a pin rev that
 *       nothing reads
 *
 * REFUSALS. Every published figure is a named const that evaluates to `null` when its population
 * or its slice refused, and each SUMMARY sentence interpolates the bare identifier its gate reads
 * (426 §1 / 428 §1). The population is selected with `git ls-tree` at a stamped rev, never
 * `ls-files` (414/415/416), and SELF is excluded by its own path (425).
 *
 * Drive: node docs/research/round429-instruments/does-any-other-instrument-retype-a-verdict-it-slices.mjs
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(import.meta.dirname, '../../..');
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const gates = [];
const preds = [];
const gate = (name, ok, detail = '') => {
  gates.push({ name, ok: ok === true });
  say(`  [GATE] ${ok === true ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  return ok === true;
};
const predict = (name, expected, actual) => {
  const landed = JSON.stringify(expected) === JSON.stringify(actual);
  preds.push({ name, landed });
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  return landed;
};
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, p) => { try { return git('show', `${rev}:${p}`); } catch { return null; } };

const SELF = path.relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');
const REV = git('rev-parse', 'HEAD').trim();
const DIRTY = git('status', '--porcelain').trim() !== '';

say('# Round 429 — does any other instrument re-type a verdict it slices the inputs for?');
say('');
say(`REPO: ${REPO}`);
say(`REV (population selected with \`git ls-tree\` at this rev, not \`ls-files\`): ${REV}`);
say(`worktree dirty at open: ${DIRTY}`);
say(`SELF: ${SELF}  (tracked at REV: ${show(REV, SELF) !== null})`);
say(`driven at: ${new Date().toISOString()}`);
say('');

// ─────────────────────────────────────────────────────────────────────────────────────────────────
say('## 1. The population, and every inclusion leg censused rather than labelled');
say('');

const POP = git('ls-tree', '-r', REV, '--name-only').split('\n')
  .filter((p) => /^docs\/research\/.*\.mjs$/.test(p) && p !== SELF);
gate('the population is non-empty and selected at a stamped rev', POP.length > 0, `${POP.length} instruments under docs/research/`);
gate('SELF is excluded by its own path, so this instrument does not census its own source (425)',
  !POP.includes(SELF), `SELF ${show(REV, SELF) === null ? 'is not yet tracked at REV' : 'is tracked at REV'} and is filtered either way`);

const srcOf = (p) => readFileSync(path.join(REPO, p), 'utf8');

/** Full-line comments only. A trailing comment after code is NOT removed — named blindness,
 *  and it can only ADD hits, so the census figure is a ceiling under this leg and the KP below
 *  is what proves the stripping does not eat real code. */
const stripFullLineComments = (src) => {
  const lines = [];
  let inBlock = false;
  for (const line of src.split('\n')) {
    const t = line.trim();
    if (inBlock) { if (t.includes('*/')) inBlock = false; lines.push(''); continue; }
    if (t.startsWith('/*')) { if (!t.includes('*/')) inBlock = true; lines.push(''); continue; }
    if (t.startsWith('//') || t.startsWith('*')) { lines.push(''); continue; }
    lines.push(line);
  }
  return lines.join('\n');
};
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const bareOf = (src, commentBlind) => norm(commentBlind ? stripFullLineComments(src) : src);

// INCLUSION LEG 1 — "slices executable text". The precondition of the class: the instrument builds
// a callable out of text it read from another file.
const SLICE_TOKEN = 'new Function(';
const CAND = POP.filter((p) => srcOf(p).includes(SLICE_TOKEN));
gate(`INCLUSION LEG 1 — \`${SLICE_TOKEN}\` present: the instrument builds a callable out of sliced text`,
  CAND.length > 0 && CAND.length < POP.length,
  `${CAND.length} candidates of ${POP.length} · EXCLUDED BY THIS LEG: ${POP.length - CAND.length}`);
say('        DIRECTION OF ERROR: an instrument that slices by regex-match only, or that re-implements');
say('        a subject verdict with no slice at all, is invisible to this leg. The census below is a');
say('        FLOOR, not a total.');

// INCLUSION LEG 2 — the subject. Resolved from path-shaped string literals that exist at REV.
const PATH_RE = /'(docs\/[^']+\.(?:mjs|ts|mts))'|'(packages\/[^']+\.(?:ts|mts|tsx))'/g;
const subjectsOf = (p, src) => [...new Set([...src.matchAll(PATH_RE)].map((m) => m[1] || m[2]))]
  .filter((s) => s !== p && existsSync(path.join(REPO, s)));

const CAND_ROWS = CAND.map((p) => {
  const src = srcOf(p);
  const introducer = git('log', '--diff-filter=A', '--format=%an', '--', p).trim().split('\n').filter(Boolean).pop() ?? null;
  return { p, src, author: introducer, subjects: subjectsOf(p, src) };
});
const UNRESOLVED = CAND_ROWS.filter((r) => r.subjects.length === 0).map((r) => r.p);
gate('INCLUSION LEG 2 — every candidate is either RESOLVED to at least one subject or reported as '
  + 'UNRESOLVED; none falls through into a silent zero (411)',
  CAND_ROWS.every((r) => r.subjects.length > 0 || UNRESOLVED.includes(r.p)),
  `resolved ${CAND_ROWS.length - UNRESOLVED.length} · UNRESOLVED ${UNRESOLVED.length}${UNRESOLVED.length ? ': ' + UNRESOLVED.map((p) => p.split('/').pop()).join(', ') : ''}`);
gate('CONTROL: the author column is not uniform — if every candidate read as one author the '
  + '"his vs mine" split below would be vacuous',
  new Set(CAND_ROWS.map((r) => r.author)).size > 1,
  [...new Set(CAND_ROWS.map((r) => r.author))].join(' · '));

say('');
for (const r of CAND_ROWS) {
  say(`  ${r.author === null ? '(author?)' : r.author.padEnd(18)} subjects=${String(r.subjects.length).padEnd(2)} ${r.p}`);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
say('');
say('## 2. The detector, taken as a parameter so each conjunct can be crippled (414)');
say('');

const MIN_RHS = 24;
const VERDICTISH = /\.test\(|===|!==|\?|includes\(|\.some\(|\.every\(/;
const CONST_RE = /^\s*const (\w+) = ([\s\S]*?);\s*$/gm;

/** Every `const NAME = RHS;` in a source, normalised. Long enough to be an expression rather
 *  than a token, which is what makes a containment hit mean something. */
const constsOf = (src, minLen) => {
  const acc = [];
  for (const m of src.matchAll(CONST_RE)) {
    const rhs = norm(m[2]);
    if (rhs.length >= minLen) acc.push({ name: m[1], rhs });
  }
  return acc;
};

/**
 * KEY. `spreadOf` is injected so the rarity leg can be pointed at a different population (or at
 * none) without re-typing the key. Returns one row per hit.
 *   commentBlind — full-line comments removed from the INSTRUMENT before containment
 *   maxSpread    — the RHS may occur in at most this many files of the population (null = off)
 *   verdictish   — the RHS must look like a classification, not a path or a factory (false = off)
 */
const detect = (instrSrc, subjects, { commentBlind, maxSpread, verdictish, spreadOf, minLen = MIN_RHS }) => {
  const bare = bareOf(instrSrc, commentBlind);
  const hits = [];
  for (const [label, subjSrc] of subjects) {
    for (const k of constsOf(subjSrc, minLen)) {
      if (!bare.includes(k.rhs)) continue;
      if (verdictish && !VERDICTISH.test(k.rhs)) continue;
      const n = maxSpread === null ? null : spreadOf(k.rhs);
      if (maxSpread !== null && n > maxSpread) continue;
      hits.push({ subject: label, name: k.name, rhs: k.rhs, spread: n });
    }
  }
  return hits;
};

const BARE_POP = new Map(POP.map((p) => [p, bareOf(srcOf(p), true)]));
const spreadLive = (rhs) => [...BARE_POP.values()].filter((b) => b.includes(rhs)).length;
const FULL = { commentBlind: true, maxSpread: 2, verdictish: true, spreadOf: spreadLive };

say(`  the key is ONE function with four named conjuncts: minLen=${MIN_RHS} maxSpread=${FULL.maxSpread} `
  + `verdictish=${String(FULL.verdictish)} commentBlind=${String(FULL.commentBlind)}`);
say('  Every cell in §3 and every row in §4 drives THAT function with a different parameter set,');
say('  rather than a re-typed copy of it (428 §5 — the lesson he took, applied to my own grader).');
say('  Whether the parameterisation is real, rather than four names over one behaviour, is not');
say('  asserted here — §4 measures it.');

// ─────────────────────────────────────────────────────────────────────────────────────────────────
say('');
say('## 3. The matrix over his realised instance — a known positive AND a false positive to clear');
say('');

const INSTR = 'docs/research/round425-instruments/position-vs-property-confusion-matrix.mjs';
const SUBJ = 'docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs';
gate('his realised instance and its subject are both present at REV',
  show(REV, INSTR) !== null && show(REV, SUBJ) !== null, `${INSTR.split('/').pop()} ← ${SUBJ.split('/').pop()}`);

/** Both revs derived BY PROPERTY — never typed, never `HEAD~1` (420/422). */
const revsOf = (p) => git('log', '--format=%H', '--', p).trim().split('\n').filter(Boolean);
const newestWithout = (p, token) => revsOf(p).find((r) => !(show(r, p) ?? '').includes(token)) ?? null;
const CURE_TOKEN = 'classifierOf(';
const SIX_TOKEN = 'pat.srcs.some(';
const PRE_CURE = newestWithout(INSTR, CURE_TOKEN);
const PRE_SIX = newestWithout(SUBJ, SIX_TOKEN);
gate(`a rev of his instrument predates the §5 cure (newest rev not carrying \`${CURE_TOKEN}\`)`,
  PRE_CURE !== null, PRE_CURE === null ? 'REFUSED (null)' : PRE_CURE.slice(0, 8));
gate(`a rev of the subject predates the §6 cure (newest rev not carrying \`${SIX_TOKEN}\`)`,
  PRE_SIX !== null, PRE_SIX === null ? 'REFUSED (null)' : PRE_SIX.slice(0, 8));
gate('…and neither derived rev is the rev this grader lands in (cure and grader do not share a '
  + 'commit — 420/422, checked rather than assumed)',
  PRE_CURE !== REV && PRE_SIX !== REV, `PRE_CURE=${String(PRE_CURE).slice(0, 8)} PRE_SIX=${String(PRE_SIX).slice(0, 8)} REV=${REV.slice(0, 8)}`);

const INSTR_OLD = PRE_CURE === null ? null : show(PRE_CURE, INSTR);
const INSTR_LIVE = show(REV, INSTR);
const SUBJ_OLD = PRE_SIX === null ? null : show(PRE_SIX, SUBJ);
const SUBJ_LIVE = show(REV, SUBJ);

/** The thing the class is about, sliced out of each subject blob rather than typed here. */
const HASSCOPE_RE = /^ {2}const hasScope = ([\s\S]*?);$/m;
const hasScopeOf = (src) => { const m = src === null ? null : src.match(HASSCOPE_RE); return m === null ? null : norm(m[1]); };
const HS_OLD = hasScopeOf(SUBJ_OLD);
const HS_LIVE = hasScopeOf(SUBJ_LIVE);
gate('the subject\'s `hasScope` classifier was sliced out of BOTH subject blobs, not typed here',
  HS_OLD !== null && HS_LIVE !== null, `pre-§6: ${String(HS_OLD).slice(0, 60)} · live: ${String(HS_LIVE).slice(0, 48)}`);
gate('KNOWN POSITIVE for the slice: the two classifiers DIFFER — if they read identical the matrix '
  + 'below would be comparing a blob with itself',
  HS_OLD !== null && HS_LIVE !== null && HS_OLD !== HS_LIVE);
gate('…and the pre-§6 classifier is long enough and verdict-shaped enough to be visible to the key '
  + 'at all (a KP must carry the property, not an analogy — 355/364)',
  HS_OLD !== null && HS_OLD.length >= MIN_RHS && VERDICTISH.test(HS_OLD), `${String(HS_OLD).length} chars`);

const cell = (instrSrc, subjSrc, opts) => {
  if (instrSrc === null || subjSrc === null) return null;
  return detect(instrSrc, [['subject', subjSrc]], { ...FULL, ...opts }).map((h) => h.name);
};
const flagsHasScope = (names) => names === null ? null : names.includes('hasScope');

const C1 = cell(INSTR_OLD, SUBJ_OLD, {});                      // TP  — the realised defect
const C2 = cell(INSTR_LIVE, SUBJ_LIVE, {});                    // TN  — the cure
const C3 = cell(INSTR_LIVE, SUBJ_OLD, { commentBlind: false }); // FP  — the cured file quotes the old line
const C4 = cell(INSTR_LIVE, SUBJ_OLD, {});                      // control for C3 — only blindness differs
const C5 = cell(INSTR_OLD, SUBJ_LIVE, {});                      // drift blindness

say('');
say('  | instrument blob | subject blob | comment-blind | expect |');
say('  |---|---|---|---|');
say(`  | pre-cure ${String(PRE_CURE).slice(0, 8)} | pre-§6 ${String(PRE_SIX).slice(0, 8)} | yes | C1 TRUE POSITIVE — flags \`hasScope\` |`);
say(`  | live     ${REV.slice(0, 8)} | live          | yes | C2 TRUE NEGATIVE — the cure, no flag |`);
say(`  | live     ${REV.slice(0, 8)} | pre-§6 ${String(PRE_SIX).slice(0, 8)} | NO  | C3 FALSE POSITIVE — the cure's own comment quotes the old line |`);
say(`  | live     ${REV.slice(0, 8)} | pre-§6 ${String(PRE_SIX).slice(0, 8)} | yes | C4 control for C3 — same inputs, blindness alone flipped |`);
say(`  | pre-cure ${String(PRE_CURE).slice(0, 8)} | live          | yes | C5 DRIFT BLINDNESS — the defect, after the copy went stale |`);
say('');

predict('C1 TRUE POSITIVE: the pre-cure instrument, read against the subject blob it was copied from, '
  + 'flags `hasScope` — the class is detectable at all', true, flagsHasScope(C1));
predict('C2 TRUE NEGATIVE: the cured instrument against the live subject does NOT flag — the detector '
  + 'is not a blanket yes', false, flagsHasScope(C2));
predict('C3 FALSE POSITIVE: WITHOUT comment-blindness the CURED file flags, because its own comment '
  + 'quotes the line it removed (357/375/383 — a correction that quotes the old spelling re-trips '
  + 'the detector)', true, flagsHasScope(C3));
predict('C4 CONTROL for C3: the identical inputs with comment-blindness restored do NOT flag — so C3 '
  + 'is the blindness leg and not the subject rev', false, flagsHasScope(C4));
predict('C5 DRIFT BLINDNESS: the defective instrument read against the MOVED subject does NOT flag — '
  + 'the detector sees copies that still AGREE, so a copy that has already gone stale is invisible '
  + 'to it', false, flagsHasScope(C5));

const SEPARATES = flagsHasScope(C1) === true && flagsHasScope(C2) === false
  && flagsHasScope(C3) === true && flagsHasScope(C4) === false && flagsHasScope(C5) === false;
gate('THE DISCRIMINATOR (§3): the key flags the realised instance, clears the cure, is re-tripped by '
  + 'the cure\'s own comment unless it is comment-blind, and is blind to an already-drifted copy',
  SEPARATES, `C1=${flagsHasScope(C1)} C2=${flagsHasScope(C2)} C3=${flagsHasScope(C3)} C4=${flagsHasScope(C4)} C5=${flagsHasScope(C5)}`);
gate('CONTROL: the matrix is not vacuous — at least one cell TRUE and at least one FALSE',
  [C1, C2, C3, C4, C5].some((c) => flagsHasScope(c) === true) && [C1, C2, C3, C4, C5].some((c) => flagsHasScope(c) === false));

// ─────────────────────────────────────────────────────────────────────────────────────────────────
say('');
say('## 4. Per-leg vacuity — the census figure under each conjunct dropped');
say('');

const censusWith = (opts) => {
  const rows = CAND_ROWS.map((r) => ({
    p: r.p, author: r.author,
    hits: detect(r.src, r.subjects.map((s) => [s, srcOf(s)]), { ...FULL, ...opts }),
  }));
  return { rows, total: rows.reduce((n, r) => n + r.hits.length, 0) };
};
const FULL_CENSUS = censusWith({});
const LEGS = [
  ['all four conjuncts (the published key)', {}],
  ['WITHOUT the rarity leg (maxSpread off)', { maxSpread: null }],
  ['WITHOUT the verdict-shape leg', { verdictish: false }],
  ['WITHOUT comment-blindness', { commentBlind: false }],
  ['WITHOUT the 24-char floor (minLen 1)', { minLen: 1 }],
];
const LEG_TABLE = LEGS.map(([label, opts]) => ({ label, total: censusWith(opts).total }));
for (const r of LEG_TABLE) say(`  ${String(r.total).padStart(5)}  ${r.label}`);
say('');
const base = LEG_TABLE[0].total;

// EACH LEG GETS A DISPOSITION, and the disposition is derived rather than claimed. Three are
// possible and the gate is that every leg has exactly one — a leg with none is an ungraded
// conjunct, and that is a finding about this instrument, not something to leave unsaid (411 —
// positively key the last bucket, never reach it by fall-through).
const LEG_CELL_GRADED = { 'WITHOUT comment-blindness': 'cells C3/C4 in §3' };
const dispositionOf = (r) => {
  if (r.total !== base) return `MOVES the live census (${Math.abs(r.total - base)} hits)`;
  if (LEG_CELL_GRADED[r.label]) return `inert on the live census, GRADED NON-VACUOUS by ${LEG_CELL_GRADED[r.label]}`;
  return 'INERT AND UNGRADED — declared decoration, not load-bearing';
};
const DISPOSED = LEG_TABLE.slice(1).map((r) => ({ ...r, d: dispositionOf(r) }));
for (const r of DISPOSED) say(`  ${r.label.replace(/^WITHOUT (the )?/, '').padEnd(34)} ${r.d}`);
say('');
const UNGRADED = DISPOSED.filter((r) => r.d.startsWith('INERT AND UNGRADED'));
gate('EVERY leg has a disposition, derived from the table above and not claimed: it either moves '
  + 'the live census, or a named cell in §3 grades it, or it is reported here as inert and ungraded',
  DISPOSED.length === LEGS.length - 1 && DISPOSED.every((r) => r.d.length > 0),
  `${DISPOSED.filter((r) => r.d.startsWith('MOVES')).length} move · `
  + `${DISPOSED.filter((r) => r.d.startsWith('inert')).length} cell-graded · ${UNGRADED.length} ungraded`);
predict('and the honest count of ungraded conjuncts in my own key is published rather than rounded '
  + 'to zero: the 24-char floor admits nothing this population would otherwise have offered, so it '
  + 'is prophylactic and this round does not grade it', 1, UNGRADED.length);
const RARITY_ROW = DISPOSED.find((r) => r.label.includes('rarity')) ?? null;
const VERDICT_ROW = DISPOSED.find((r) => r.label.includes('verdict-shape')) ?? null;
gate('COMPARATIVE, not a magic multiple: the rarity leg removes MORE hits than any other single '
  + 'leg — it is the one holding back the shared harness that all of these instruments carry by copy',
  RARITY_ROW !== null && VERDICT_ROW !== null
    && RARITY_ROW.total - base > VERDICT_ROW.total - base
    && DISPOSED.every((r) => r.total - base <= RARITY_ROW.total - base),
  `rarity removes ${RARITY_ROW === null ? '?' : RARITY_ROW.total - base} · verdict-shape removes `
  + `${VERDICT_ROW === null ? '?' : VERDICT_ROW.total - base} · base ${base}`);
gate('CONTROL for the whole §4 table: the parameterisation is real — at least two parameter sets '
  + 'give DIFFERENT figures, so `detect` is four conjuncts and not four names over one behaviour',
  new Set(LEG_TABLE.map((r) => r.total)).size > 1, LEG_TABLE.map((r) => r.total).join(' / '));

// ─────────────────────────────────────────────────────────────────────────────────────────────────
say('');
say('## 5. The live census, by author — his ask answered');
say('');

const BY_AUTHOR = new Map();
for (const r of FULL_CENSUS.rows) {
  const k = r.author ?? '(author?)';
  BY_AUTHOR.set(k, (BY_AUTHOR.get(k) ?? 0) + r.hits.length);
}
for (const r of FULL_CENSUS.rows) {
  if (r.hits.length === 0) continue;
  say(`  ${r.p}`);
  say(`    introduced by ${r.author} · ${r.hits.length} hit${r.hits.length === 1 ? '' : 's'}`);
  for (const h of r.hits) {
    say(`      \`${h.name}\` (text occurs in ${h.spread} files of ${POP.length}) ← ${h.subject}`);
    say(`        ${h.rhs.slice(0, 118)}`);
  }
}
say('');
for (const [a, n] of [...BY_AUTHOR].sort((x, y) => y[1] - x[1])) say(`  ${String(n).padStart(3)} hits — instruments introduced by ${a}`);

const HIS_FILES = FULL_CENSUS.rows.filter((r) => r.author === 'Daedalus (Klatch)' && r.hits.length > 0);
const MY_FILES = FULL_CENSUS.rows.filter((r) => r.author === 'Theseus (Klatch)' && r.hits.length > 0);
const HIS_HITS = HIS_FILES.reduce((n, r) => n + r.hits.length, 0);
const MY_HITS = MY_FILES.reduce((n, r) => n + r.hits.length, 0);
const popOk = POP.length > 0 && CAND_ROWS.length > 0 && SEPARATES === true;
const HIS_FIGURE = popOk ? `${HIS_HITS} hit${HIS_HITS === 1 ? '' : 's'} in ${HIS_FILES.length} of his instruments` : null;
const MY_FIGURE = popOk ? `${MY_HITS} hit${MY_HITS === 1 ? '' : 's'} in ${MY_FILES.length} of mine` : null;
gate('the two published figures are REFUSABLE and refuse together with the discriminator above — '
  + 'neither is printed when the key was not shown to separate (353/393/395)',
  (HIS_FIGURE === null) === (SEPARATES !== true) && (MY_FIGURE === null) === (SEPARATES !== true),
  `his: ${HIS_FIGURE ?? 'REFUSED'} · mine: ${MY_FIGURE ?? 'REFUSED'}`);

say('');
say('  THE HAND READING, written after the hit list was produced and GRADED by the key (small');
say('  population: the hand reading is primary — 338). Each row quotes the matched text.');
say('');

/** The hand reading, as (file, const name, verdict). Graded against the key below. */
const HAND = [
  ['docs/research/round413-instruments/attack-g7-and-grade-the-branch-layer.mjs', 'got', 'REAL',
    'his §G3 verdict "is this a ternary" is `t !== null && t.refused === undefined`, re-typed from '
    + 'round412:518. He SLICES my `topLevelTernary` (writes a prefix file and imports it), so the '
    + 'inputs are mine and the verdict is his copy — the class exactly. Mitigation, stated: `got` '
    + 'is a loop-local in my file and is not exported, so he could not have sliced it as a value.'],
  ['docs/research/round408-instruments/stratify-the-live-interval.mjs', '*', 'REAL (MINE)',
    '11 of his Round 407 key\'s expressions are transcribed into my file. DECLARED as verbatim, '
    + 'which is right (328 — reproduce their figures under their own key), and NOT PINNED: see §6.'],
];
for (const [f, n, v, why] of HAND) {
  say(`  ${v.padEnd(12)} ${n.padEnd(4)} ${f.split('/').slice(-2).join('/')}`);
  say(`               ${why.replace(/(.{104}) /g, '$1\n               ')}`);
}
say('');
const handFiles = new Set(HAND.map(([f]) => f));
const keyFiles = new Set(FULL_CENSUS.rows.filter((r) => r.hits.length > 0).map((r) => r.p));
predict('the hand reading and the key name the SAME files — a hand reading the detector does not '
  + 'reproduce is an opinion (338)', [...handFiles].sort(), [...keyFiles].sort());
predict('…and no hit was classified as coincidental: every row of the key is REAL under the hand '
  + 'reading, so the key\'s precision on this population is 1', true,
  HAND.every(([, , v]) => v.startsWith('REAL')));

// ─────────────────────────────────────────────────────────────────────────────────────────────────
say('');
say('## 6. The self-finding — the file with 11 of the 12 hits reads its pin rev, but never the file it pinned');
say('');

const MINE = 'docs/research/round408-instruments/stratify-the-live-interval.mjs';
const MINE_SRC = show(REV, MINE);
gate('my Round 408 instrument is present at REV', MINE_SRC !== null, MINE);
const PIN_DECL = MINE_SRC === null ? null : (MINE_SRC.match(/^const (HIS_REV) = '([0-9a-f]+)';/m) ?? null);
gate('it declares a pin rev for the transcription, sliced out of its own source rather than typed here',
  PIN_DECL !== null, PIN_DECL === null ? 'REFUSED (null)' : `${PIN_DECL[1]} = ${PIN_DECL[2]}`);

/** Reads of the identifier, excluding its own declaration line and every full-line comment. */
const readsOf = (src, ident) => bareOf(src, true).split('\n').join(' ')
  .split(new RegExp(`\\b${ident}\\b`)).length - 1;
const PIN_NAME = PIN_DECL === null ? null : PIN_DECL[1];
const PIN_REV = PIN_DECL === null ? null : PIN_DECL[2];
const PIN_OCCURS = PIN_NAME === null || MINE_SRC === null ? null : readsOf(MINE_SRC, PIN_NAME);
const PIN_READS = PIN_OCCURS === null ? null : PIN_OCCURS - 1; // minus the declaration itself
gate(`CONTROL for the reader: an identifier that IS read in that file counts more than once `
  + `(a reader that answers 0 for everything measures nothing)`,
  MINE_SRC !== null && readsOf(MINE_SRC, 'HIS_FIGURES') > 1,
  `HIS_FIGURES occurs ${MINE_SRC === null ? '?' : readsOf(MINE_SRC, 'HIS_FIGURES')}x · ${PIN_NAME} occurs ${PIN_OCCURS}x`);

// REVISION, LEFT VISIBLE. My first version of this section predicted `HIS_REV` was assigned once
// and read ZERO times, and it was REFUTED here: 5 reads. The reason is worth more than the fix —
// I had grepped for `771daaf4\|HIS_SELF`, read the output as covering `HIS_REV`, and reasoned from
// it instead of running the count for the identifier I was actually making a claim about
// (329-331/367/409 — run the regex, in the engine that will run it, for the thing you are keying on).
// The rev is live and load-bearing elsewhere in that file. So the finding is NARROWER, and it is
// the narrow version that is true: the rev is used to fetch HIS CORPUS and one probe file, and
// never to fetch the file the transcribed block was transcribed FROM.
const PINNED_PATHS = MINE_SRC === null ? null
  : [...new Set([...bareOf(MINE_SRC, true).matchAll(/\$\{HIS_REV\}:([^`'"\s]+)/g)].map((m) => m[1]))];
gate(`\`${PIN_NAME}\` is read ${PIN_READS}x — NOT the zero my first reading of it claimed (see the `
  + `revision note in source). The rev is live in that file.`, PIN_READS !== null && PIN_READS > 0,
  `${PIN_READS} reads`);

/** Does the transcription still agree — at his pinned rev, and live? */
const HIS407 = 'docs/research/round407-instruments/census-the-fixture-as-string-class.mjs';
gate('KNOWN POSITIVE for the path enumerator, in the real call shape: it finds at least one path '
  + `fetched at \`${PIN_NAME}\` (408 — a hand-typed KP is not a slice)`,
  PINNED_PATHS !== null && PINNED_PATHS.length > 0,
  PINNED_PATHS === null ? 'REFUSED (null)' : PINNED_PATHS.join(' · '));
predict('THE FINDING, in its narrow and true form: of every path fetched at the pinned rev, NONE is '
  + 'the file the transcribed block was transcribed from — so the rev pins the corpus and not the '
  + 'transcription, and "transcribed VERBATIM at <rev>" has no gate behind it (357/375 — a verbatim '
  + 'source pin is not a property pin)', false, PINNED_PATHS === null ? null : PINNED_PATHS.includes(HIS407));
const agreeAt = (rev) => {
  const s = rev === REV ? show(REV, HIS407) : show(rev, HIS407);
  if (s === null || MINE_SRC === null) return null;
  return detect(MINE_SRC, [[HIS407, s]], FULL).length;
};
const AT_PIN = PIN_REV === null ? null : agreeAt(PIN_REV);
const AT_LIVE = agreeAt(REV);
const SAME_BLOB = PIN_REV === null ? null : show(PIN_REV, HIS407) === show(REV, HIS407);
gate('his Round 407 file is readable at BOTH the pinned rev and REV', AT_PIN !== null && AT_LIVE !== null,
  `at ${String(PIN_REV)}: ${AT_PIN} · at REV: ${AT_LIVE}`);
const DRIFTED = AT_PIN === null || AT_LIVE === null ? null : AT_PIN !== AT_LIVE;
predict('the transcription has NOT drifted: the same count agrees at his pinned rev and at REV, so '
  + 'this is LATENT, not a realised defect', false, DRIFTED);
predict('AND THE WEAKNESS OF THAT READING, published rather than left for him to find: his Round 407 '
  + 'blob is BYTE-IDENTICAL at the pinned rev and at REV, so the pair above is one blob read twice — '
  + 'it shows the transcription agrees, and shows nothing at all about what happens when his file '
  + 'moves. That is the direction nothing in my file watches (341/399 — a one-instance fixture '
  + 'cannot grade a resolver)', true, SAME_BLOB);

const SELF_FINDING = PIN_READS === null || AT_PIN === null || AT_LIVE === null || PINNED_PATHS === null ? null
  : `${PIN_NAME} is read ${PIN_READS}x but fetches ${PINNED_PATHS.length} path(s), none of them the `
    + `transcribed file · ${AT_LIVE} of ${AT_LIVE} transcribed expressions still agree, measured here `
    + `for the first time and by nothing in that file`;

// ─────────────────────────────────────────────────────────────────────────────────────────────────
say('');
say('='.repeat(96));
const failed = gates.filter((g) => !g.ok);
const refuted = preds.filter((p) => !p.landed);
const GATE = failed.length === 0;
say(`GATE: ${GATE}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
if (failed.length) for (const f of failed) say(`  FAILED GATE: ${f.name}`);
if (refuted.length) for (const r of refuted) say(`  REFUTED: ${r.name}`);
say('');
say('SUMMARY:');
say(`  his Round 428 §7 ask (is the class one instance?): ${HIS_FIGURE === null ? 'REFUSED' : `NO — ${HIS_FIGURE}`}`);
say(`  and the same key over my own instruments: ${MY_FIGURE === null ? 'REFUSED' : MY_FIGURE}`);
say(`  the self-finding behind those 11: ${SELF_FINDING === null ? 'REFUSED' : SELF_FINDING}`);
say(`  scope, censused not labelled: ${CAND_ROWS.length} of ${POP.length} instruments carry \`${SLICE_TOKEN}\`; `
  + `${POP.length - CAND_ROWS.length} excluded by that leg, ${UNRESOLVED.length} candidate(s) UNRESOLVED — the figures above are a FLOOR`);
process.exit(GATE && refuted.length === 0 ? 0 : 1);
