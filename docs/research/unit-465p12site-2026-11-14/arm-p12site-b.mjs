/**
 * unit-465p12site — arm B
 *
 * Subject: arm A's `A10` published `P12 = 0 of 20` as a GREEN leg where the hand-verified answer is
 * 2. This arm characterises that false negative and re-measures.
 *
 * ## The defect in arm A's key
 *
 * `P12` is a predicate about a **population**. Arm A reduced it to a predicate about an **operand**:
 * it required the published denominator's identifier to be token-identical to the identifier the
 * dropping loop iterates. In `round452…liveness-reader.mjs` the loop iterates `texts` (line 124) and
 * the figure publishes `of outs.length` (line 136), with `texts` derived from `outs` in one step
 * (line 43, `new Map(outs.map(...))`) and `outs` bound from `ls-tree` (line 40). Same population,
 * two names — so the mechanism is present and the key scored it absent.
 *
 * This arm follows the **derivation chain** and accepts a denominator naming any identifier in it,
 * and reports separately whether the chain reaches a binding that is itself an **enumeration**
 * (`ls-tree`/`ls-files`/`readdirSync`/`globSync`), because "whole-population denominator" means the
 * enumeration's own array and not merely some upstream name.
 *
 * ## What this arm does NOT do
 *
 * It does not re-drive, edit, or replace arm A. `drive1.arma.out` stands verbatim with its `0 of 20`
 * in it; the false negative is this unit's evidence, not an embarrassment to be tidied away.
 *
 * Every published `P12` positive carries a **verbatim hand slice printed below**, because the
 * mechanical key in this unit has already been wrong once in the reassuring direction and does not
 * get to publish a member on its own authority.
 *
 * Pin: `5966f86d`, same as arm A. Declared limits: a declaration's right-hand side is joined over at
 * most 4 physical lines (reported if the cap is ever hit); the chain walk runs to depth 3 (reported);
 * both are printed rather than assumed harmless.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = '5966f86db3a650b2858448eccb8796f5517e03e2';
const PIN_SHORT = '5966f86d';
const RHS_LINE_CAP = 4;
const CHAIN_DEPTH = 3;

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

console.log(`          --- pin: ${PIN_SHORT}; rhs line cap ${RHS_LINE_CAP}, chain depth ${CHAIN_DEPTH}`);

// ─────────────────────────────────────────────── population, arm A's key verbatim at the same pin

const sources = git('ls-tree', '-r', '--name-only', PIN, 'docs/research/', 'scripts/', 'packages/')
  .split('\n')
  .filter((p) => p.endsWith('.mjs') && basename(dirname(p)) !== 'lib');
const srcOf = new Map();
for (const p of sources) srcOf.set(p, git('show', `${PIN}:${p}`));

const LIB_IMPORT = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*verdict\.mjs['"]/s;
const READERS = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];
const population = [];
for (const p of sources) {
  const src = srcOf.get(p);
  const m = src.match(LIB_IMPORT);
  const imported = m === null ? [] : m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter((s) => s !== '');
  if (imported.filter((n) => READERS.includes(n)).length === 0) continue;
  if (READERS.reduce((n, r) => n + (src.match(new RegExp(`\\b${r}\\s*\\(`, 'g')) || []).length, 0) === 0) continue;
  if ([...src.matchAll(/['"`][^'"`\n]*\.out['"`]/g)].length === 0) continue;
  if (!/readdirSync\s*\(|ls-tree|ls-files|globSync\s*\(/.test(src)) continue;
  population.push(p);
}
population.sort();
leg('B1', population.length === 20, `population at the pin reproduces arm A's 20: ${population.length}`);

// ──────────────────────────────────────────── the bare-skip sites and their loops, arm A's keys

const BARE_SKIP = /\.ok\s*(?:!==\s*true|===\s*false|\)|\s*===\s*true)[^\n]*\b(?:continue|return)\b[^\n]*$/;
const OK_TEST = /\.ok\s*(?:!==|===)\s*(?:true|false)|\(\s*!\s*\w+\.ok\b|&&\s*!\s*\w+\.ok\b/;
const FOR_OF = /\bfor\s*\(\s*(?:const|let|var)\s+(?:\{[^}]*\}|\[[^\]]*\]|\w+)\s+of\s+([^)]+)\)/;
const FN_BOUNDARY = /\bfunction\b|=>\s*\{/;
const ENUMERATOR = /readdirSync\s*\(|ls-tree|ls-files|globSync\s*\(/;

function enclosingLoop(masked, lineIdx) {
  const lines = masked.split('\n');
  const own = lines[lineIdx].match(FOR_OF);
  if (own !== null) {
    const e = own[1].trim();
    return /^[A-Za-z_$][\w$]*$/.test(e) ? { kind: 'RESOLVED', ident: e, at: lineIdx + 1 } : { kind: 'DERIVED', expr: e, at: lineIdx + 1 };
  }
  let depth = 0;
  for (let i = lineIdx - 1; i >= 0; i -= 1) {
    const ln = lines[i];
    depth += (ln.match(/\}/g) || []).length - (ln.match(/\{/g) || []).length;
    if (depth < 0) {
      const m = ln.match(FOR_OF);
      if (m !== null) {
        const e = m[1].trim();
        return /^[A-Za-z_$][\w$]*$/.test(e) ? { kind: 'RESOLVED', ident: e, at: i + 1 } : { kind: 'DERIVED', expr: e, at: i + 1 };
      }
      if (FN_BOUNDARY.test(ln)) return { kind: 'UNRESOLVED', why: 'nearest enclosing block is a function', at: i + 1 };
      depth = 0;
    }
  }
  return { kind: 'UNRESOLVED', why: 'no enclosing block found', at: null };
}

/** Every `const|let|var IDENT = <rhs>` in the file, rhs joined to the terminating `;` under a cap. */
function declarations(src) {
  const masked = stripSource(src, true);
  const lines = masked.split('\n');
  const out = new Map();
  let capHits = 0;
  lines.forEach((ln, i) => {
    const m = ln.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(.*)$/);
    if (m === null) return;
    let rhs = m[2];
    let j = i;
    while (!rhs.includes(';') && j - i < RHS_LINE_CAP - 1 && j + 1 < lines.length) { j += 1; rhs += ` ${lines[j]}`; }
    if (!rhs.includes(';')) capHits += 1;
    // The ORIGINAL text for the same span, so an enumerator inside a string literal is visible.
    const rawRhs = src.split('\n').slice(i, j + 1).join(' ');
    out.set(m[1], { rhs, rawRhs, at: i + 1 });
  });
  return { decls: out, capHits };
}

/** Transitive closure over declared identifiers mentioned in each RHS, to CHAIN_DEPTH. */
function chainOf(ident, decls) {
  const seen = new Set([ident]);
  let frontier = [ident];
  for (let d = 0; d < CHAIN_DEPTH; d += 1) {
    const next = [];
    for (const name of frontier) {
      const dec = decls.get(name);
      if (dec === undefined) continue;
      for (const tok of dec.rhs.match(/[A-Za-z_$][\w$]*/g) || []) {
        if (decls.has(tok) && !seen.has(tok)) { seen.add(tok); next.push(tok); }
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  return [...seen];
}

/** Published-denominator sites for any identifier in `names`. Comments blanked, strings kept. */
function denomSites(src, names) {
  const vis = stripSource(src, false);
  const raw = src.split('\n');
  const hits = [];
  vis.split('\n').forEach((ln, i) => {
    for (const n of names) {
      const esc = n.replace(/[$]/g, '\\$&');
      const re = new RegExp(`\\bof\\s*(?:\\$\\{\\s*${esc}\\.length|['"\`]\\s*\\+\\s*${esc}\\.length|${esc}\\.length)`);
      if (re.test(ln)) { hits.push({ n: i + 1, ident: n, text: raw[i].trim() }); return; }
    }
  });
  return hits;
}

console.log('          --- each bare-skip site, its loop array, the derivation chain, and the denominator it binds');
const rowsOut = [];
let capHitsTotal = 0;
for (const p of population) {
  const src = srcOf.get(p);
  const masked = stripSource(src, true);
  const lines = src.split('\n');
  const bare = [];
  lines.forEach((ln, i) => {
    if (!OK_TEST.test(ln)) return;
    if (ln.replace(/^\s*(\/\/|\*).*$/, '') === '') return;
    if (BARE_SKIP.test(ln) && !/\.refusal/.test(ln)) bare.push({ n: i + 1, text: ln.trim() });
  });
  if (bare.length === 0) continue;
  const { decls, capHits } = declarations(src);
  capHitsTotal += capHits;
  console.log(`          ${p.replace('docs/research/', '')}`);
  for (const s of bare) {
    const res = enclosingLoop(masked, s.n - 1);
    if (res.kind !== 'RESOLVED') {
      rowsOut.push({ p, n: s.n, kind: res.kind, chain: [], hits: [], enumerated: false, p12: false });
      console.log(`              @${String(s.n).padEnd(4)} ${res.kind.padEnd(10)} ${res.why}`);
      continue;
    }
    const chain = chainOf(res.ident, decls);
    const enumeratedIn = chain.filter((n) => decls.has(n) && ENUMERATOR.test(decls.get(n).rawRhs));
    const hits = denomSites(src, chain);
    const p12 = hits.length > 0 && enumeratedIn.length > 0;
    rowsOut.push({ p, n: s.n, kind: 'RESOLVED', ident: res.ident, chain, enumeratedIn, hits, enumerated: enumeratedIn.length > 0, p12, siteText: s.text, loopAt: res.at });
    console.log(`              @${String(s.n).padEnd(4)} RESOLVED   loop over \`${res.ident}\` @${res.at}`);
    console.log(`                      chain=${JSON.stringify(chain)} enumerated-in=${JSON.stringify(enumeratedIn)}`);
    console.log(`                      denominator sites bound to the chain: ${hits.length}${p12 ? '  ** P12 **' : ''}`);
    for (const h of hits.slice(0, 3)) console.log(`                      denom@${h.n} via \`${h.ident}\`  ${h.text.slice(0, 100)}`);
  }
}

leg('B2', true, `declaration RHS joins that hit the ${RHS_LINE_CAP}-line cap without finding a \`;\`: ${capHitsTotal}`);

const resolved = rowsOut.filter((r) => r.kind === 'RESOLVED');
const bound = resolved.filter((r) => r.hits.length > 0);
const p12Rows = rowsOut.filter((r) => r.p12);
const p12Members = [...new Set(p12Rows.map((r) => r.p))].sort();

leg('B3', true,
  `bare-skip sites: ${rowsOut.length} total · RESOLVED ${resolved.length} · of those, denominator bound ` +
  `to the chain ${bound.length} · chain reaches an enumeration ${resolved.filter((r) => r.enumerated).length}`);

pred('R1', resolved.some((r) => r.ident === 'texts' && r.chain.includes('outs') && r.enumeratedIn?.includes('outs')),
  `the \`texts\` loop resolves to \`outs\` through the chain and \`outs\` is an enumerated binding: ` +
  `${JSON.stringify(resolved.filter((r) => r.ident === 'texts').map((r) => `${basename(r.p)}@${r.n} chain=${r.chain.join('|')}`))}`);

pred('R3', bound.length < resolved.length,
  `the chain walk does NOT bind all ${resolved.length} RESOLVED sites — residue is declared, not zero: ` +
  `bound ${bound.length}, unbound ${resolved.length - bound.length} ` +
  `${JSON.stringify(resolved.filter((r) => r.hits.length === 0).map((r) => `${basename(r.p)}@${r.n} loop=${r.ident}`))}`);

// ────────────────────────────────── hand verification: every published positive gets a verbatim slice

console.log('          --- HAND VERIFICATION: verbatim slices for every P12 positive, read at the pin');
const handOk = [];
for (const r of p12Rows) {
  const lines = srcOf.get(r.p).split('\n');
  const h = r.hits[0];
  console.log(`          ${r.p.replace('docs/research/', '')}`);
  console.log(`              loop   @${r.loopAt}  ${lines[r.loopAt - 1].trim().slice(0, 100)}`);
  console.log(`              drop   @${r.n}  ${r.siteText.slice(0, 100)}`);
  console.log(`              denom  @${h.n}  ${h.text.slice(0, 100)}`);
  // The three must be real lines in the pinned source, and the denominator must not be the loop ident
  // itself (that would be the token-identity case arm A already covered).
  const ok = lines[r.loopAt - 1].includes('of ') && lines[r.n - 1].trim() === r.siteText && lines[h.n - 1].trim() === h.text;
  handOk.push(ok);
  console.log(`              slices match the pinned source: ${ok}`);
}
leg('B4', handOk.every((x) => x),
  `every published P12 positive's three slices (loop, drop, denominator) re-read from the pinned ` +
  `source and match: ${handOk.filter((x) => x).length} of ${handOk.length}`);

const HIS_12_TAILS = [
  'round448-instruments/census-pred-occupancy.mjs',
  'round448-instruments/grade-the-four-list-scorer.mjs',
  'round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs',
  'round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs',
  'round452-instruments/no-id-class-separates-and-the-liveness-reader-is-cured.mjs',
  'round456-instruments/drift-census-over-the-verdict-publishing-population.mjs',
  'round457-instruments/grade-recording-completeness-across-the-whole-corpus.mjs',
  'round462-instruments/grade-the-pred-half-refusal.mjs',
  'round462-instruments/recon.mjs',
  'round463-instruments/grade-the-57-of-461-class.mjs',
  'round463-instruments/recon.mjs',
  'round463-instruments/which-residue-member-postdates.mjs',
];
const inHis12 = (p) => HIS_12_TAILS.some((t) => p.endsWith(t));
const ROUND452_PAIR = [
  'round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs',
  'round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs',
];
const p12InHis12 = p12Members.filter(inHis12);
const unmeasurable = bound.length < 2;

leg('B5', true,
  `CORRECTED P12 over the pinned population: ${p12Members.length} of ${population.length} members ` +
  `${JSON.stringify(p12Members.map((p) => p.replace('docs/research/', '')))} ` +
  `(${rowsOut.length - resolved.length} sites excluded from both halves as not resolvable at the site)`);

pred('R2', unmeasurable ? null : (p12InHis12.length === 2 && ROUND452_PAIR.every((t) => p12InHis12.some((p) => p.endsWith(t)))),
  `over his 12 the chain-following key returns to the hand-verified 2, both the round452 pair: ` +
  `${p12InHis12.length} ${JSON.stringify(p12InHis12.map((p) => p.replace('docs/research/', '')))}`);

// ─────────────────────── R5: arm A's token-identity key, re-run here, over the same population

let tokenIdentityCount = 0;
for (const r of resolved) {
  const hits = denomSites(srcOf.get(r.p), [r.ident]);
  if (hits.length > 0) tokenIdentityCount += 1;
}
leg('B6', true,
  `arm A's token-identity key re-run here over the same ${resolved.length} RESOLVED sites: ` +
  `${tokenIdentityCount} sites bind (chain-following key: ${bound.length})`);
pred('R5', tokenIdentityCount === 0 && bound.length > 0,
  `the two keys disagree on every positive — token identity ${tokenIdentityCount}, chain ${bound.length}: ` +
  `${tokenIdentityCount === 0 && bound.length > 0 ? 'total disagreement, not marginal' : 'NOT total'}`);

// ──────────────────── R4: is the NEITHER cell clean, or does it never test `.ok` at all?

console.log('          --- R4: the NEITHER cell — a fall-through bucket, characterised rather than trusted');
const neither = [];
for (const p of population) {
  const src = srcOf.get(p);
  const lines = src.split('\n');
  const okTests = lines.filter((ln) => OK_TEST.test(ln) && ln.replace(/^\s*(\/\/|\*).*$/, '') !== '').length;
  const mentions = (src.match(/\.refusal/g) || []).length;
  const bareSkips = lines.filter((ln) => BARE_SKIP.test(ln) && !/\.refusal/.test(ln) && OK_TEST.test(ln)).length;
  if (bareSkips === 0 && mentions === 0) {
    const readerCalls = READERS.reduce((n, r) => n + (src.match(new RegExp(`\\b${r}\\s*\\(`, 'g')) || []).length, 0);
    neither.push({ p, okTests, readerCalls });
    console.log(`          ${p.replace('docs/research/', '')}`);
    console.log(`              reader calls=${readerCalls}  \`.ok\` tests=${okTests}  .refusal mentions=0  bare skips=0`);
    console.log(`              → ${okTests === 0 ? 'NEVER TESTS `.ok` — a third fate: the refusal is neither declared nor dropped at a tested site' : 'tests `.ok` but neither skips bare nor names the refusal'}`);
  }
}
const neverTests = neither.filter((n) => n.readerCalls > 0 && n.okTests === 0);
leg('B7', true,
  `NEITHER cell members: ${neither.length}; of those, calling a reader and NEVER testing \`.ok\`: ` +
  `${neverTests.length} ${JSON.stringify(neverTests.map((n) => n.p.replace('docs/research/', '')))}`);
pred('R4', neverTests.length > 0,
  `the NEITHER cell is not clean — at least one member calls a reader and never tests \`.ok\`, so the ` +
  `published cross-tab mislabels a third fate as the absence of a problem: ${neverTests.length} of ${neither.length}`);

// ────────────────────────────────────────────────────────────────────────────── gate + verdict

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('B-gate', gate === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(gate)}`);

console.log(
  `VERDICT/0 ${red.length === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} ` +
  `prefused=${JSON.stringify(prefused)}`);
process.exit(red.length === 0 ? 0 : 1);
