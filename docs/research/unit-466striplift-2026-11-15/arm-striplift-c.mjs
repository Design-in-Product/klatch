/**
 * unit-466striplift — arm C
 *
 * Subject: **arm B of this unit.** Arm B's `Q2`/`Q3` published a refutation of arm A's headline off
 * a token extractor that captures a bare `$` from the template-literal `${` sigil. 4 of 38 of its
 * printed token roots are sound. See PRE-REGISTRATION-C.md.
 *
 * `K-strip3` changes token extraction ONLY:
 *   1. every `${` → two spaces in a working copy of the line (columns preserved, no identifier
 *      altered), so the sigil cannot be captured as an identifier;
 *   2. the lazy `[^)]*?` bridge is dropped — the receiver must be the identifier *immediately*
 *      before the strip call, or a parenthesised receiver immediately before it. The bridge is what
 *      let `in` and `anchor` be captured from text unrelated to the strip.
 *
 * The site key (`<ident>.map(` + a strip spelling) is untouched, so the 60-member population cannot
 * move. `C1` asserts that it does not — if the population moved, the comparison with arms A and B
 * is between different things and every figure below is uninterpretable.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = '70e58f2a3ac4c59fea20be77459bf2c177744aa7';
const PIN_SHORT = '70e58f2a';
const B_REC_REV = 'a3c58818';
const B_REC = 'docs/research/unit-466striplift-2026-11-15/drive2.armb.out';

const legs = [];
const red = [];
const refused = [];
function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) refused.push(id);
  else if (!ok) red.push(id);
  console.log(`${ok === null ? 'REF' : ok ? 'ok ' : 'RED'} ${id.padEnd(9)} ${detail}`);
}
const preds = [];
const refuted = [];
const prefused = [];
function pred(id, held, detail) {
  preds.push(id);
  if (held === null) prefused.push(id);
  else if (!held) refuted.push(id);
  console.log(`${held === null ? 'OPEN   ' : held ? 'LANDED ' : 'REFUTED'} ${id.padEnd(4)} ${detail}`);
}
function git(...args) {
  return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// ──────────────────────────────────────────── the site key, byte-identical to arms A and B

const SPELL = {
  R: /\.replace\(\s*[`'"/][^)]*docs\/research[^)]*\)/,
  L: /\.slice\(\s*\w+\.length\s*\)/,
  V: /\brelative\s*\(/,
  B: /\bbasename\s*\(/,
  S: /\.split\(\s*['"`]\/['"`]\s*\)\s*\.\s*pop\s*\(/,
};
const MAPSTRIP = /([A-Za-z_$][\w$.[\]']*)\s*\.\s*map\s*\(/;
const CLASS_RANK = { NONLOSSY_NORMALISE: 0, INVERTIBLE_PREFIX: 1, LOSSY_BASENAME: 2 };
function classOf(code, firstArg) {
  if (code === 'B' || code === 'S') return 'LOSSY_BASENAME';
  if (code === 'R' || code === 'L') return 'INVERTIBLE_PREFIX';
  if (/docs\/research/.test(firstArg ?? '')) return 'INVERTIBLE_PREFIX';
  return 'NONLOSSY_NORMALISE';
}

// K-strip3 ───────────────────────────────────────────────────────────────────────────────────────
// Cure 1: the sigil. `${` becomes two spaces so `$` can never start a captured identifier.
const desigil = (line) => line.replace(/\$\{/g, '  ');
// Cure 2: no bridge. ID = identifier immediately before the call; PAREN = parenthesised receiver
// immediately before the call, first identifier inside captured.
const ID = "([A-Za-z_$][\\w$.[\\]']*)\\s*";
const PAREN = "\\(\\s*([A-Za-z_$][\\w$.[\\]']*)[^()]*\\)\\s*";
function pairFor(callRe) {
  return [new RegExp(`${ID}${callRe}`, 'g'), new RegExp(`${PAREN}${callRe}`, 'g')];
}
const CALL = {
  R: "\\.\\s*replace\\(\\s*[`'\"/][^)]*docs\\/research",
  L: '\\.\\s*slice\\(\\s*\\w+\\.length\\s*\\)',
  S: "\\.\\s*split\\(\\s*['\"`]\\/['\"`]\\s*\\)\\s*\\.\\s*pop\\s*\\(",
};
function tokensOf(raw) {
  const line = desigil(raw);
  const out = [];
  for (const code of ['R', 'L', 'S']) {
    for (const re of pairFor(CALL[code])) for (const m of line.matchAll(re)) out.push([code, m[1]]);
  }
  for (const m of line.matchAll(/\bbasename\s*\(\s*\(?\s*([A-Za-z_$][\w$.[\]']*)/g)) out.push(['B', m[1]]);
  for (const m of line.matchAll(/\brelative\s*\(\s*([^,]+?)\s*,\s*([A-Za-z_$][\w$.[\]']*)/g)) out.push(['V', m[2], m[1]]);
  // de-duplicate: the ID and PAREN alternatives can both fire on one call site
  const seen = new Set();
  return out.filter((t) => { const k = t.join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
}
function mapParams(raw) {
  const line = desigil(raw);
  const i = line.search(/\.\s*map\s*\(/);
  if (i < 0) return [];
  const after = line.slice(line.indexOf('(', i) + 1);
  const arrow = after.indexOf('=>');
  if (arrow < 0) return [];
  return [...after.slice(0, arrow).matchAll(/[A-Za-z_$][\w$]*/g)].map((m) => m[0]);
}
const rootOf = (tok) => (tok.split(/[.[\]]/).filter(Boolean)[0] ?? tok);
const IS_IDENT = /^[A-Za-z_][\w]*$/; // a sound root: no `$` sigil, no `round$`

const treeFiles = git('ls-tree', '-r', '--name-only', PIN, '--', 'docs/research')
  .split('\n').map((s) => s.trim()).filter(Boolean);
const srcPin = treeFiles.filter((p) => /\.(mjs|mts)$/.test(p));
const pinText = new Map();
for (const p of srcPin) pinText.set(p, git('show', `${PIN}:${p}`).split('\n'));

const sites = [];
for (const p of srcPin) {
  const lines = pinText.get(p);
  lines.forEach((line, i) => {
    const spellings = Object.keys(SPELL).filter((k) => SPELL[k].test(line));
    if (spellings.length === 0) return;
    const m = line.match(MAPSTRIP);
    if (!m) return;
    const toks = tokensOf(line);
    const params = mapParams(line);
    const roots = toks.map((t) => rootOf(t[1]));
    const derived = toks.filter((t) => params.includes(rootOf(t[1])));
    const classes = (derived.length ? derived : toks).map((t) => classOf(t[0], t[2]));
    const worst = classes.reduce((a, b) => (CLASS_RANK[b] > CLASS_RANK[a] ? b : a), 'NONLOSSY_NORMALISE');
    sites.push({ p, line: i + 1, id: `${p}:${i + 1}`, ident: m[1], spellings, toks, roots, params, derived, worst, k3: derived.length > 0, text: line.trim() });
  });
}

// ──────────────────────────────────────────── C1 — the population must not have moved

leg('C1', sites.length === 60,
  `the site key is untouched, so the population is unchanged: ${sites.length} site(s) (arms A and B: ` +
  `60). If this moved, arms A/B/C measure different things and every figure below is uninterpretable.`);

const bRec = git('show', `${B_REC_REV}:${B_REC}`);
const bCount = bRec.match(/K-strip enumerates (\d+) site\(s\)/);
leg('C2', !!bCount && Number(bCount[1]) === sites.length,
  `FROZEN at ${B_REC_REV}: arm B's recording states ${bCount ? bCount[1] : 'UNPARSEABLE'}; agrees ` +
  `with the live derivation: ${!!bCount && Number(bCount[1]) === sites.length}`);

// ──────────────────────────────────────────── R1 — are the extracted roots identifiers at all?

const allRoots = sites.flatMap((s) => s.roots);
const bad = allRoots.filter((r) => !IS_IDENT.test(r));
const rootTally = {};
for (const r of allRoots) rootTally[r] = (rootTally[r] ?? 0) + 1;
// arm B's contamination, captured out of its frozen recording rather than re-typed.
const bRootSets = [...bRec.matchAll(/tokRoots=(\[[^\]]*\])/g)].map((m) => m[1]);
const bBad = bRootSets.filter((s) => /\$/.test(s)).length;
console.log(`\n── R1: extracted token roots under K-strip3 (n=${allRoots.length}) ──`);
console.log(`  distinct roots: ${JSON.stringify(Object.entries(rootTally).sort((a, b) => b[1] - a[1]).slice(0, 14))}`);
console.log(`  arm B, from its FROZEN recording: ${bBad} of ${bRootSets.length} printed tokRoots sets contain a '$'`);
pred('R1', bad.length === 0,
  `zero extracted token roots are non-identifiers under K-strip3: ${bad.length} bad of ` +
  `${allRoots.length} ${JSON.stringify([...new Set(bad)].slice(0, 8))}. Arm B's sigil defect is gone.`);

// ──────────────────────────────────────────── R2 / R5 — the hand map, keys asserted again

const HAND = {
  'docs/research/round411-instruments/cure-the-wrapped-call-and-the-body-key.mjs:628': 'MEMBER_PATH',
  'docs/research/round456-instruments/drift-census-over-the-verdict-publishing-population.mjs:361': 'MEMBER_PATH',
  'docs/research/unit-464addarm-2026-11-04/grade-addarm.mjs:451': 'MEMBER_PATH',
  'docs/research/unit-464addarm-2026-11-04/grade-addarm.mjs:478': 'MEMBER_PATH',
  'docs/research/unit-464class-2026-11-02/enumerate-legs.mjs:275': 'NOT_A_MEMBER_PATH',
  'docs/research/unit-464sat-2026-10-31/grepro.mjs:133': 'MEMBER_PATH',
};
const handKeys = Object.keys(HAND).sort();
const byId = new Map(sites.map((s) => [s.id, s]));
leg('C3', handKeys.every((k) => byId.has(k)),
  `every HAND key is still an enumerated site: ${handKeys.filter((k) => byId.has(k)).length} of ` +
  `${handKeys.length}. The hand map cannot drift onto a population that no longer contains it.`);

const r2rows = handKeys.map((k) => {
  const s = byId.get(k);
  const v = s ? (s.k3 ? 'MEMBER_PATH' : 'NOT_A_MEMBER_PATH') : 'NOT ENUMERATED';
  return { k, hand: HAND[k], k3: v, ok: v === HAND[k], s };
});
console.log(`\n── R2: K-strip3 vs HAND on the 6-site residue (arm A's proxy: 1 of 6; arm B: 5 of 6) ──`);
for (const r of r2rows) {
  console.log(`  ${r.ok ? 'agree ' : 'DIFFER'} hand=${r.hand.padEnd(17)} k3=${r.k3.padEnd(17)} ${r.k.replace('docs/research/', '')}`);
  console.log(`         params=${JSON.stringify(r.s.params)} roots=${JSON.stringify(r.s.roots)} derived=${r.s.derived.length}`);
}
pred('R2', r2rows.every((r) => r.ok),
  `K-strip3 agrees with the hand read on all 6 residue sites: ${r2rows.filter((r) => r.ok).length} of 6`);

const el = byId.get('docs/research/unit-464class-2026-11-02/enumerate-legs.mjs:275');
const elRootsSound = el.roots.every((r) => IS_IDENT.test(r));
const elNoParam = el.derived.length === 0;
pred('R5', elRootsSound && elNoParam,
  `enumerate-legs.mjs:275 is still excluded, now for the RIGHT reason — roots are real identifiers ` +
  `${JSON.stringify(el.roots)} (sound=${elRootsSound}), params=${JSON.stringify(el.params)}, and none ` +
  `of the roots is a callback parameter (derived=${el.derived.length}). Arm A excluded it off a name ` +
  `list; arm B off a token (\`in\`) that is not in the line's expression at all.`);

// ──────────────────────────────────────────── R3 — does Q2 collapse?

const aPositives = sites.filter((s) => !HAND[s.id]);
const k3Excludes = aPositives.filter((s) => !s.k3);
const bExcludes = [...bRec.matchAll(/^ {2}(\S+\.mjs:\d+) \[/gm)].map((m) => m[1]);
console.log(`\n── R3: sites arm A called MEMBER_PATH that K-strip3 excludes (arm B excluded 15) ──`);
for (const s of k3Excludes) {
  console.log(`  ${s.id.replace('docs/research/', '')} [${s.ident}] params=${JSON.stringify(s.params)} roots=${JSON.stringify(s.roots)}`);
  console.log(`      ${s.text.slice(0, 150)}`);
}
if (k3Excludes.length === 0) console.log('  (none — the co-located-but-unrelated shape is unique to enumerate-legs.mjs:275)');
pred('R3', k3Excludes.length <= 3,
  `Q2 collapses: K-strip3 excludes ${k3Excludes.length} of arm A's ${aPositives.length} positives ` +
  `(threshold ≤3; arm B reported 15, of which ${bExcludes.length} printed with evidence). ` +
  `${JSON.stringify(k3Excludes.map((s) => s.id.replace('docs/research/', '')))}`);

// ──────────────────────────────────────────── R4 — is arm A's headline restored?

const memberK3 = sites.filter((s) => (HAND[s.id] ? HAND[s.id] === 'MEMBER_PATH' : s.k3));
const lossyK3 = memberK3.filter((s) => s.worst === 'LOSSY_BASENAME');
const pctK3 = memberK3.length === 0 ? 0 : (lossyK3.length / memberK3.length) * 100;
const tallyK3 = {};
for (const s of memberK3) tallyK3[s.worst] = (tallyK3[s.worst] ?? 0) + 1;
console.log(`\n── the corrected tally: HAND over the residue, K-strip3 over the rest (n=${memberK3.length}) ──`);
console.log(`  K-strip3 : ${JSON.stringify(tallyK3)}  → LOSSY ${lossyK3.length}/${memberK3.length} = ${pctK3.toFixed(1)}%`);
console.log(`  arm A    : {"LOSSY_BASENAME":31,...} of 54 = 57.4%   (name proxy, wrong on 5 of its 6 residue sites)`);
console.log(`  arm B    : {"LOSSY_BASENAME":20,...} of 44 = 45.5%   (VOID — sigil defect)`);
pred('R4', pctK3 >= 50,
  `arm A's P1 headline is RESTORED by measurement, not by retraction: LOSSY_BASENAME = ` +
  `${lossyK3.length} of ${memberK3.length} = ${pctK3.toFixed(1)}% (threshold ≥50%). Arm B's 45.5% is ` +
  `superseded and was never a finding about arm A.`);

// ──────────────────────────────────────────── declared limits, reach measured

const moduleLevel = new Map();
for (const p of srcPin) {
  const s = new Set();
  for (const l of pinText.get(p)) {
    const m = l.match(/^(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/);
    if (m) s.add(m[1]);
  }
  moduleLevel.set(p, s);
}
const shadowRisk = sites.filter((s) => s.derived.some((t) => moduleLevel.get(s.p).has(rootOf(t[1]))));
leg('C-lim1', true,
  `DECLARED LIMIT 1, reach MEASURED — K-strip3 has no scope analysis, so a callback parameter ` +
  `shadowing a module-level binding of the same name would be mis-attributed. Sites where a derived ` +
  `token's root is ALSO declared at module level in the same file: ${shadowRisk.length} ` +
  `${JSON.stringify(shadowRisk.map((s) => `${s.id.replace('docs/research/', '')}:${s.derived.map((t) => rootOf(t[1])).join(',')}`))}`);

leg('C-lim2', true,
  `DECLARED LIMIT 2 — the hand map still covers 6 of 60 = 10.0%. K-strip3 is the THIRD key over the ` +
  `same 54 unchecked positives, and three keys agreeing is not a hand read. R3's exclusions are ` +
  `hand-sliced in RESULTS.md; the remaining ${aPositives.length - k3Excludes.length} positives are not.`);

leg('C-lim3', true,
  `DECLARED LIMIT 3 — R4 restores a FIGURE; it does not validate arm A's proxy, which was wrong on ` +
  `5 of its 6 residue sites whatever K-strip3 says about the other 54. A restored headline and a ` +
  `sound key are different claims and this unit makes only the first.`);

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('C-gate', gate === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(gate)}`);

console.log(
  `VERDICT/0 ${red.length === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} ` +
  `prefused=${JSON.stringify(prefused)}`);
process.exit(red.length === 0 ? 0 : 1);
