/**
 * unit-465p12site — arm A
 *
 * Subject: the two items this seat boarded at the end of the 11/14 START fire —
 *   (1) classify the 5 population readers that arm A of unit-465refusalfate measured as existing
 *       and explicitly did NOT classify;
 *   (2) census the `P12` mechanism across the whole 17-member population rather than the 2
 *       hand-verified members in round452.
 *
 * ## Why `A7`'s key is not reused
 *
 * `A7` answered question (2) with an undifferentiated containment match for `of <something>.length`
 * and reported 4 of 5 where the hand-verified figure is 2. It was WITHDRAWN in the same fire. The
 * mechanism has two conjuncts bound to ONE object: the site drops a refusal inside a loop over an
 * enumerated population, AND a published figure's denominator is *that same array*. Conjunct (b) is
 * inexpressible as containment, so this arm resolves the dropping loop's iterated identifier and
 * then requires the denominator to be that identifier.
 *
 * `A7`'s withdrawn key is re-run VERBATIM here as `Q5`, so the withdrawal is graded rather than
 * asserted.
 *
 * ## The resolution problem, declared before it was measured
 *
 * Resolving "the array this loop iterates" from source fails at a function boundary: a drop inside
 * a `.filter` callback or a helper has no enclosing `for...of` at the site. Per the pre-registration
 * this arm publishes a three-way split — RESOLVED / DERIVED (the iterated expression is not a bare
 * identifier) / UNRESOLVED (the nearest enclosing block is a function) — and a site that is not
 * RESOLVED is excluded from BOTH halves of any published `P12` rate, with the excluded count printed
 * beside it. A fall-through "no" bucket would absorb exactly this blindness.
 *
 * ## Pin
 *
 * Sources and population are read at the NAMED rev `5966f86d`, read off `git rev-parse HEAD` before
 * the pre-registration existed — not a bare run-time `HEAD`. At that rev this unit's own arms do not
 * exist, so the instrument is outside its own population BY THE PIN and no exclusion filter is
 * applied; the pin is printed so a reader at a later rev can see why their count differs.
 *
 * Declared limit: brace depth is counted over `stripSource(src, true)` (strings and comments
 * blanked, length preserved — `scripts/lib/strip-source.mjs`), so a brace inside a string cannot
 * confuse the walk. A brace inside a regex literal body is also blanked by that reader. Nothing
 * under `scripts/` is modified; the import is a read.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = '5966f86db3a650b2858448eccb8796f5517e03e2';
const PIN_SHORT = '5966f86d';

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];
const prefused = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) { refused.push(id); console.log(`  REFUSED ${id}  ${detail}`); }
  else if (ok) console.log(`  ok      ${id}  ${detail}`);
  else { red.push(id); console.log(`  RED     ${id}  ${detail}`); }
}
function pred(id, held, detail) {
  preds.push(id);
  if (held === null) { prefused.push(id); console.log(`  PREFUSED ${id}  ${detail}`); }
  else if (held) console.log(`  LANDED  ${id}  ${detail}`);
  else { refuted.push(id); console.log(`  REFUTED ${id}  ${detail}`); }
}

const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

console.log(`          --- pin: ${PIN_SHORT} (${PIN}); every source below is read at this rev`);

// ───────────────────────────── A1–A4: re-derive the population at the pin, arm A's key verbatim

// Verbatim from unit-465refusalfate arm-refusalfate-a.mjs lines 61-93, with `HEAD` replaced by the
// named pin and the THIS_UNIT exclusion dropped (at the pin this unit does not exist — asserted
// below rather than assumed).
const sources = git('ls-tree', '-r', '--name-only', PIN, 'docs/research/', 'scripts/', 'packages/')
  .split('\n')
  .filter((p) => p.endsWith('.mjs') && basename(dirname(p)) !== 'lib');

const srcOf = new Map();
for (const p of sources) srcOf.set(p, git('show', `${PIN}:${p}`));

const LIB_IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*verdict\.mjs['"]/s;
const READERS = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];

const rows = [];
for (const p of sources) {
  const src = srcOf.get(p);
  const m = src.match(LIB_IMPORT);
  const imported = m === null ? [] : m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter((s) => s !== '');
  const importedReaders = imported.filter((n) => READERS.includes(n));
  if (importedReaders.length === 0) continue;
  const calls = READERS.reduce((n, r) => n + (src.match(new RegExp(`\\b${r}\\s*\\(`, 'g')) || []).length, 0);
  const quotedOut = [...src.matchAll(/['"`][^'"`\n]*\.out['"`]/g)].length;
  const enumHow = /readdirSync\s*\(/.test(src) ? 'readdirSync'
    : /ls-tree/.test(src) ? 'ls-tree'
    : /ls-files/.test(src) ? 'ls-files'
    : /globSync\s*\(/.test(src) ? 'globSync' : null;
  rows.push({ p, importedReaders, calls, quotedOut, enumHow });
}

const libConsumers = rows.filter((r) => r.calls > 0);
const recordingConsumers = libConsumers.filter((r) => r.quotedOut > 0);
const walkers = recordingConsumers.filter((r) => r.enumHow !== null);
const population = walkers.map((r) => r.p).sort();

leg('A1', true,
  `population at the pin, arm A's key verbatim: ${libConsumers.length} / ${recordingConsumers.length} / ` +
  `${walkers.length} (this morning at the then-HEAD: 23 / 21 / 17)`);

// This morning's 17, as a FOIL — compared, not used as the population.
const MINE_17 = [
  'docs/research/round448-instruments/census-pred-occupancy.mjs',
  'docs/research/round448-instruments/grade-the-four-list-scorer.mjs',
  'docs/research/round450-instruments/grade-the-row-guards.mjs',
  'docs/research/round451-instruments/settle-the-subset-question-on-real-exemplars.mjs',
  'docs/research/round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs',
  'docs/research/round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs',
  'docs/research/round452-instruments/no-id-class-separates-and-the-liveness-reader-is-cured.mjs',
  'docs/research/round456-instruments/drift-census-over-the-verdict-publishing-population.mjs',
  'docs/research/round457-instruments/grade-recording-completeness-across-the-whole-corpus.mjs',
  'docs/research/round460-instruments/grade-the-pred-gate-landing.mjs',
  'docs/research/round462-instruments/grade-the-pred-half-refusal.mjs',
  'docs/research/round462-instruments/recon.mjs',
  'docs/research/round463-instruments/grade-the-57-of-461-class.mjs',
  'docs/research/round463-instruments/recon.mjs',
  'docs/research/round463-instruments/which-residue-member-postdates.mjs',
  'docs/research/unit-465schemacollide-2026-11-14/arm-schemacollide-a.mjs',
  'docs/research/unit-465schemacollide-2026-11-14/arm-schemacollide-b.mjs',
];
// Daedalus's 12, also a FOIL — needed to say which members are "the 5 additions".
const HIS_12 = MINE_17.filter((p) =>
  !['round450-instruments/grade-the-row-guards.mjs',
    'round451-instruments/settle-the-subset-question-on-real-exemplars.mjs',
    'round460-instruments/grade-the-pred-gate-landing.mjs',
    'unit-465schemacollide-2026-11-14/arm-schemacollide-a.mjs',
    'unit-465schemacollide-2026-11-14/arm-schemacollide-b.mjs'].some((s) => p.endsWith(s)));
const THE_5 = MINE_17.filter((p) => !HIS_12.includes(p));

leg('A2', HIS_12.length === 12 && THE_5.length === 5,
  `the foils partition this morning's 17: his 12 = ${HIS_12.length}, the unclassified additions = ${THE_5.length}`);

const gone = MINE_17.filter((p) => !population.includes(p));
const added = population.filter((p) => !MINE_17.includes(p));
leg('A3', true,
  `population vs this morning's 17 at the pin: now=${population.length} ` +
  `gone=${JSON.stringify(gone.map((p) => p.replace('docs/research/', '')))} ` +
  `added=${JSON.stringify(added.map((p) => p.replace('docs/research/', '')))}`);

leg('A4', !population.some((p) => p.includes('unit-465p12site')),
  `the instrument is outside its own population BY THE PIN, not by a filter: ` +
  `this unit's members in the population = ${population.filter((p) => p.includes('unit-465p12site')).length}`);

pred('Q1', population.length > 17,
  `the population at the pin is larger than this morning's 17 (point prediction 19 or 20): ` +
  `${population.length}${population.length === 19 || population.length === 20 ? ' — inside the point range' : ' — OUTSIDE the point range'}`);

// ───────────────────── A5–A8: site classification over the WHOLE population, incl. the 5 additions

// Verbatim from arm-refusalfate-a.mjs lines 127-128.
const BARE_SKIP = /\.ok\s*(?:!==\s*true|===\s*false|\)|\s*===\s*true)[^\n]*\b(?:continue|return)\b[^\n]*$/;
const OK_TEST = /\.ok\s*(?:!==|===)\s*(?:true|false)|\(\s*!\s*\w+\.ok\b|&&\s*!\s*\w+\.ok\b/;

function sitesOf(p) {
  const lines = srcOf.get(p).split('\n');
  const sites = [];
  lines.forEach((ln, i) => {
    if (!OK_TEST.test(ln)) return;
    const codeOnly = ln.replace(/^\s*(\/\/|\*).*$/, '');
    if (codeOnly === '') return;
    const bare = BARE_SKIP.test(ln) && !/\.refusal/.test(ln);
    sites.push({ n: i + 1, bare, names: /\.refusal/.test(ln), text: ln.trim() });
  });
  return sites;
}

const classified = [];
console.log('          --- site classification over the whole pinned population; (+5) marks a member arm A left unclassified');
for (const p of population) {
  const sites = sitesOf(p);
  const bareSkips = sites.filter((s) => s.bare);
  const refusalMentions = (srcOf.get(p).match(/\.refusal/g) || []).length;
  const cell = bareSkips.length > 0 && refusalMentions > 0 ? 'BOTH'
    : bareSkips.length > 0 ? 'DROP'
    : refusalMentions > 0 ? 'DECLARE' : 'NEITHER';
  classified.push({ p, sites: sites.length, bareSkips, nBare: bareSkips.length, refusalMentions, cell });
  const tag = THE_5.includes(p) ? ' (+5)' : added.includes(p) ? ' (new since 10:47)' : '';
  console.log(`          ${cell.padEnd(8)} ${p.replace('docs/research/', '')}${tag}`);
  console.log(`              sites=${sites.length} bare-skip=${bareSkips.length} .refusal-mentions=${refusalMentions}`);
  for (const s of bareSkips) console.log(`              DROP@${s.n}   ${s.text.slice(0, 110)}`);
}

const cellOf = new Map(classified.map((c) => [c.p, c.cell]));
const tally = (set) => ['DROP', 'DECLARE', 'BOTH', 'NEITHER']
  .map((k) => `${k.toLowerCase()}=${set.filter((p) => cellOf.get(p) === k).length}`).join(' ');

leg('A5', true, `whole pinned population (${population.length}): ${tally(population)}`);
leg('A6', true, `THE 5 ADDITIONS arm A left unclassified, now classified: ${tally(THE_5)}`);
console.log('          --- the 5 additions, member by member');
for (const p of THE_5) {
  const c = classified.find((x) => x.p === p);
  console.log(`          ${c === undefined ? 'ABSENT-AT-PIN' : c.cell.padEnd(8)} ${p.replace('docs/research/', '')}`);
}
leg('A7', true, `his 12 re-run at the pin (this morning: drop=2 declare=7 both=3): ${tally(HIS_12)}`);

pred('Q2', THE_5.some((p) => cellOf.get(p) === 'BOTH'),
  `at least one of the 5 additions lands in BOTH: ` +
  `${JSON.stringify(THE_5.filter((p) => cellOf.get(p) === 'BOTH').map((p) => p.replace('docs/research/', '')))}`);

// ───────────────────────────── A9–A13: the CORRECTED P12 key — resolve the dropping loop's array

const FOR_OF = /\bfor\s*\(\s*(?:const|let|var)\s+(?:\{[^}]*\}|\[[^\]]*\]|\w+)\s+of\s+([^)]+)\)/;
const FN_BOUNDARY = /\bfunction\b|=>\s*\{\s*$|=>\s*\{/;

/**
 * Walk up from `lineIdx` through enclosing blocks over the strings/comments-blanked source. Returns
 * { kind: 'RESOLVED', ident } | { kind: 'DERIVED', expr } | { kind: 'UNRESOLVED', why }.
 *
 * Non-loop, non-function openers (if / try / else / switch) are walked THROUGH, because the drop can
 * sit inside a conditional nested in the loop. The walk stops at the first `for...of` (resolved) or
 * the first function boundary (unresolved) — a drop inside a callback takes its population from a
 * caller a source scan cannot see, which is the declared UNRESOLVED class.
 */
function enclosingLoop(masked, lineIdx) {
  const lines = masked.split('\n');
  // A brace-less one-liner (`for (const p of outs) if (!r.ok) continue;`) puts the loop header ON
  // the site line, where the upward walk cannot see it. Checked first, explicitly.
  const own = lines[lineIdx].match(FOR_OF);
  if (own !== null) {
    const e = own[1].trim();
    return /^[A-Za-z_$][\w$]*$/.test(e)
      ? { kind: 'RESOLVED', ident: e, at: lineIdx + 1, text: lines[lineIdx].trim() }
      : { kind: 'DERIVED', expr: e, at: lineIdx + 1, text: lines[lineIdx].trim() };
  }
  // The site line otherwise contributes nothing: any brace on it belongs to a scope at or below the site.
  // Walking upward, a line whose closes-minus-opens drives the running count negative is the
  // nearest not-yet-closed enclosing opener.
  let depth = 0;
  for (let i = lineIdx - 1; i >= 0; i -= 1) {
    const ln = lines[i];
    const opens = (ln.match(/\{/g) || []).length;
    const closes = (ln.match(/\}/g) || []).length;
    depth += closes - opens;
    if (depth < 0) {
      const m = ln.match(FOR_OF);
      if (m !== null) {
        const expr = m[1].trim();
        return /^[A-Za-z_$][\w$]*$/.test(expr)
          ? { kind: 'RESOLVED', ident: expr, at: i + 1, text: ln.trim() }
          : { kind: 'DERIVED', expr, at: i + 1, text: ln.trim() };
      }
      if (FN_BOUNDARY.test(ln)) return { kind: 'UNRESOLVED', why: 'nearest enclosing block is a function', at: i + 1, text: ln.trim() };
      depth = 0; // an if/try/else opener: keep walking outward
    }
  }
  return { kind: 'UNRESOLVED', why: 'no enclosing block found', at: null, text: '' };
}

/** Is `ident`.length published as a DENOMINATOR (`of ${ident.length}` / `of ' + ident.length`)? */
function publishedDenominator(src, ident) {
  const vis = stripSource(src, false); // comments blanked, strings KEPT — a commented-out denom cannot count
  const esc = ident.replace(/[$]/g, '\\$&');
  const re = new RegExp(`\\bof\\s*(?:\\$\\{\\s*${esc}\\.length|['"\`]\\s*\\+\\s*${esc}\\.length|${esc}\\.length)`);
  const out = [];
  vis.split('\n').forEach((ln, i) => { if (re.test(ln)) out.push({ n: i + 1, text: src.split('\n')[i].trim() }); });
  return out;
}

console.log('          --- the corrected P12 key: resolve each bare-skip site\'s loop array, then bind the denominator to IT');
const siteRows = [];
for (const c of classified) {
  if (c.nBare === 0) continue;
  const src = srcOf.get(c.p);
  const masked = stripSource(src, true);
  console.log(`          ${c.p.replace('docs/research/', '')}`);
  for (const s of c.bareSkips) {
    const res = enclosingLoop(masked, s.n - 1);
    let hits = [];
    if (res.kind === 'RESOLVED') hits = publishedDenominator(src, res.ident);
    const p12 = res.kind === 'RESOLVED' && hits.length > 0;
    siteRows.push({ p: c.p, n: s.n, kind: res.kind, ident: res.ident ?? res.expr ?? null, hits, p12 });
    console.log(`              @${String(s.n).padEnd(4)} ${res.kind.padEnd(10)} ` +
      `${res.kind === 'RESOLVED' ? `loop over \`${res.ident}\` @${res.at}` : res.kind === 'DERIVED' ? `loop over \`${res.expr.slice(0, 50)}\` @${res.at}` : res.why}` +
      `${res.kind === 'RESOLVED' ? ` → published \`of ${res.ident}.length\` × ${hits.length}${p12 ? '  ** P12 **' : ''}` : ''}`);
    for (const h of hits.slice(0, 2)) console.log(`                      denom@${h.n}  ${h.text.slice(0, 110)}`);
  }
}

const nBareTotal = siteRows.length;
const nResolved = siteRows.filter((r) => r.kind === 'RESOLVED').length;
const nDerived = siteRows.filter((r) => r.kind === 'DERIVED').length;
const nUnres = siteRows.filter((r) => r.kind === 'UNRESOLVED').length;
const notResolvedRate = nBareTotal === 0 ? 0 : (nDerived + nUnres) / nBareTotal;

leg('A9', nResolved + nDerived + nUnres === nBareTotal,
  `bare-skip sites across the pinned population partition three ways: total=${nBareTotal} ` +
  `RESOLVED=${nResolved} DERIVED=${nDerived} UNRESOLVED=${nUnres} ` +
  `(not-resolved rate ${(notResolvedRate * 100).toFixed(1)}%)`);

pred('Q4', notResolvedRate >= 0.25,
  `the UNRESOLVED/DERIVED class is at least 25% of bare-skip sites: ` +
  `${(notResolvedRate * 100).toFixed(1)}% (${nDerived + nUnres} of ${nBareTotal})`);

// The refusal precondition, declared in the pre-registration: >60% not-resolved voids the figure.
const CEILING = 0.60;
const voided = notResolvedRate > CEILING;

const p12Sites = siteRows.filter((r) => r.p12);
const p12Members = [...new Set(p12Sites.map((r) => r.p))].sort();

if (voided) {
  leg('A10', null,
    `P12 count over the wider population REFUSED: not-resolved ${(notResolvedRate * 100).toFixed(1)}% ` +
    `exceeds the pre-registered ${CEILING * 100}% ceiling, so the key did not measure its own population`);
} else {
  leg('A10', true,
    `P12 members under the corrected two-conjunct key: ${p12Members.length} of ${population.length} ` +
    `(sites ${p12Sites.length} of ${nResolved} RESOLVED; ${nDerived + nUnres} sites excluded from BOTH halves) ` +
    `${JSON.stringify(p12Members.map((p) => p.replace('docs/research/', '')))}`);
}

const ROUND452_PAIR = [
  'docs/research/round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs',
  'docs/research/round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs',
];
const p12InHis12 = p12Members.filter((p) => HIS_12.includes(p));
pred('Q3', voided ? null : (p12InHis12.length === 2 && ROUND452_PAIR.every((p) => p12InHis12.includes(p))),
  `over his 12 the corrected key reproduces the hand-verified 2, both the round452 pair: ` +
  `${p12InHis12.length} ${JSON.stringify(p12InHis12.map((p) => p.replace('docs/research/', '')))}`);

const p12Outside = p12Members.filter((p) => !HIS_12.includes(p));
pred('Q6', voided ? null : p12Outside.length > 0,
  `at least one P12 carrier outside his 12, so the wider census is strictly more than the 2: ` +
  `${p12Outside.length} ${JSON.stringify(p12Outside.map((p) => p.replace('docs/research/', '')))}`);

// ─────────────────────────────── A14: Q5 — re-run A7's WITHDRAWN key verbatim and grade the withdrawal

// Verbatim from arm-refusalfate-a.mjs lines 174 and 179.
const WITHDRAWN_DENOM = /\bof\s*(?:\$\{|'\s*\+\s*|"\s*\+\s*)[^\n]*\.length/;
const droppersInHis12 = HIS_12.filter((p) => ['DROP', 'BOTH'].includes(cellOf.get(p) ?? ''));
const withdrawnRows = [];
console.log('          --- Q5: A7\'s withdrawn containment key, re-run verbatim over the same 5 dropping members');
for (const p of droppersInHis12) {
  const lines = srcOf.get(p).split('\n');
  const hits = lines.map((ln, i) => ({ n: i + 1, ln }))
    .filter((x) => WITHDRAWN_DENOM.test(x.ln) && /console\.log|leg\(|say\(|`/.test(x.ln));
  withdrawnRows.push({ p, hits: hits.length });
  console.log(`          ${p.replace('docs/research/', '')}  withdrawn-key sites = ${hits.length}`);
}
const withdrawnPositives = withdrawnRows.filter((r) => r.hits > 0).length;
leg('A14', true,
  `A7's withdrawn key, re-run verbatim: ${withdrawnPositives} of ${withdrawnRows.length} ` +
  `(it published "4 of 5"); corrected key over the same members: ` +
  `${voided ? 'REFUSED' : p12Members.filter((p) => droppersInHis12.includes(p)).length} of ${withdrawnRows.length}`);
pred('Q5', withdrawnPositives === 4 && withdrawnRows.length === 5,
  `the withdrawn key reproduces its own 4 of 5, so the withdrawal diagnosed the KEY and not a ` +
  `transcription slip: ${withdrawnPositives} of ${withdrawnRows.length}`);

// ────────────────────────────────────────────────────────────────────────────── gate + verdict

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('A-gate', gate === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(gate)}`);

console.log(
  `VERDICT/0 ${red.length === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} ` +
  `prefused=${JSON.stringify(prefused)}`);
process.exit(red.length === 0 ? 0 : 1);
