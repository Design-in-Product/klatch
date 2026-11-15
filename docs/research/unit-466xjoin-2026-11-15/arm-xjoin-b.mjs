/**
 * unit-466xjoin — arm B
 *
 * Subject: **arm A of this unit.** Its `P2`/`P3` were refuted at 9.3% / 6.6% against a denominator
 * that included mail memos and repo docs, because `K-cons` matched any literal ending `.out` or
 * `.md`. See PRE-REGISTRATION-B.md, pushed at `05850cdb` before this file existed.
 *
 * Arm A is NOT re-run and NOT edited. Its recording stands verbatim with its three refutations in
 * it. `B3` re-derives arm A's classification in-process rather than parsing its `.out`.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = 'bdaf99b95780d203b091b3d0c53a043ebeb2ab46';
const PIN_SHORT = 'bdaf99b9';
const A_REC_REV = '2c3edaf0';
const A_REC = 'docs/research/unit-466xjoin-2026-11-15/drive1.arma.out';

const KP_FILE = 'docs/research/unit-466rhscap-2026-11-14/arm-rhscap-a.mjs';
const KP_LINE = 47;
const KP_PRODUCER_DIR = 'docs/research/unit-465p12site-2026-11-14';
const KP_PRODUCER_SITE = 'docs/research/unit-465p12site-2026-11-14/arm-p12site-b.mjs:283';

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
  return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
}

// ═══════════════════════════════════ K-prod — byte-copied from arm A, which copied arm C (K-strip3)

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
const desigil = (line) => line.replace(/\$\{/g, '  ');
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

const treeAll = git('ls-tree', '-r', '--name-only', PIN)
  .split('\n').map((s) => s.trim()).filter(Boolean);
const treeSet = new Set(treeAll);
const srcAll = treeAll.filter((p) => /\.(mjs|mts)$/.test(p));
const text = new Map();
for (const p of srcAll) text.set(p, git('show', `${PIN}:${p}`).split('\n'));

const prodDirs = new Map();
const prodSites = [];
for (const p of srcAll) {
  (text.get(p) ?? []).forEach((line, i) => {
    if (!Object.keys(SPELL).some((k) => SPELL[k].test(line))) return;
    if (!MAPSTRIP.test(line)) return;
    const toks = tokensOf(line);
    const params = mapParams(line);
    const derived = toks.filter((t) => params.includes(rootOf(t[1])));
    const classes = (derived.length ? derived : toks).map((t) => classOf(t[0], t[2]));
    const worst = classes.reduce((a, b) => (CLASS_RANK[b] > CLASS_RANK[a] ? b : a), 'NONLOSSY_NORMALISE');
    const dir = posix.dirname(p);
    const id = `${p}:${i + 1}`;
    prodSites.push({ id, dir, worst });
    if (!prodDirs.has(dir)) prodDirs.set(dir, { any: [], lossy: [] });
    prodDirs.get(dir).any.push(id);
    if (worst === 'LOSSY_BASENAME') prodDirs.get(dir).lossy.push(id);
  });
}

// ══════════════════════════════════════════ the two consumer keys, derived side by side in-process

const LITERAL = /(['"`])((?:[^'"`\\\n]|\\.)*?)\1/g;
const WIDE = /\.(out|md)$/;          // arm A's key
const NARROW = /\.out$/;             // arm B: recordings only, and under docs/research

function resolve(p, dir, lit) {
  if (lit.includes('${')) return { kind: 'UNRESOLVED_INTERP', producerDir: null, artefactPath: null };
  if (!lit.includes('/')) return { kind: 'SAME_DIR_BARE', producerDir: null, artefactPath: null };
  let artefactPath;
  if (lit.startsWith('docs/')) artefactPath = posix.normalize(lit);
  else artefactPath = posix.normalize(posix.join(dir, lit.replace(/^\.\//, '')));
  const producerDir = posix.dirname(artefactPath);
  return { kind: producerDir === dir ? 'SAME_DIR' : 'CROSS_DIR', producerDir, artefactPath };
}

const wideHits = [];
for (const p of srcAll) {
  const dir = posix.dirname(p);
  (text.get(p) ?? []).forEach((line, i) => {
    for (const m of line.matchAll(LITERAL)) {
      const lit = m[2];
      if (!WIDE.test(lit)) continue;
      const r = resolve(p, dir, lit);
      wideHits.push({ p, dir, line: i + 1, id: `${p}:${i + 1}`, lit, ...r });
    }
  });
}
const narrowHits = wideHits.filter((h) => NARROW.test(h.lit) && h.artefactPath !== null
  && h.artefactPath.startsWith('docs/research/'));

// ── B1 containment: every narrow hit must be a resolved wide hit (same file, line, literal)
const wideKeys = new Set(wideHits.filter((h) => h.producerDir !== null).map((h) => `${h.id}|${h.lit}`));
const notContained = narrowHits.filter((h) => !wideKeys.has(`${h.id}|${h.lit}`));
leg('B1', notContained.length === 0,
  `containment: ${narrowHits.length} narrow hit(s), ${notContained.length} not present in arm A's ` +
  `resolved hit set${notContained.length ? ` — ${notContained.slice(0, 3).map((h) => h.id).join(', ')}` : ''}`);

// ── B2 the KP survives the narrowing
const kp = narrowHits.find((h) => h.p === KP_FILE && h.line === KP_LINE);
const kpDir = kp ? (prodDirs.get(kp.producerDir) ?? { any: [], lossy: [] }) : { any: [], lossy: [] };
leg('B2', !!kp && kp.kind === 'CROSS_DIR' && kp.producerDir === KP_PRODUCER_DIR
  && kpDir.any.includes(KP_PRODUCER_SITE),
  `KP survives the narrowing: kind=${kp?.kind} producerDir=${kp?.producerDir}; that dir holds ` +
  `${kpDir.any.length} K-prod site(s) incl. ${KP_PRODUCER_SITE}: ${kpDir.any.includes(KP_PRODUCER_SITE)}`);

// ── B3 decompose arm A's padding
const wideCross = wideHits.filter((h) => h.kind === 'CROSS_DIR');
const droppedMd = wideCross.filter((h) => /\.md$/.test(h.lit));
const droppedOutOutside = wideCross.filter((h) => /\.out$/.test(h.lit) && !(h.artefactPath ?? '').startsWith('docs/research/'));
const survivors = wideCross.filter((h) => /\.out$/.test(h.lit) && (h.artefactPath ?? '').startsWith('docs/research/'));
leg('B3', droppedMd.length + droppedOutOutside.length + survivors.length === wideCross.length,
  `arm A's ${wideCross.length} CROSS_DIR literals decompose exactly: ${droppedMd.length} .md + ` +
  `${droppedOutOutside.length} .out outside docs/research + ${survivors.length} surviving = ` +
  `${droppedMd.length + droppedOutOutside.length + survivors.length}`);

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('B4', gate === '', `gate: ${gate === '' ? 'empty' : gate}`);

// ══════════════════════════════════════════════════════════════════════════════ the narrowed figures

const narrowCross = narrowHits.filter((h) => h.kind === 'CROSS_DIR');
const pairs = new Map();
for (const h of narrowCross) {
  const k = `${h.p}  →  ${h.producerDir}`;
  if (!pairs.has(k)) pairs.set(k, []);
  pairs.get(k).push(h);
}
const pairStrip = [...pairs.keys()].filter((k) => (prodDirs.get(pairs.get(k)[0].producerDir)?.any.length ?? 0) > 0);
const pairLossy = [...pairs.keys()].filter((k) => (prodDirs.get(pairs.get(k)[0].producerDir)?.lossy.length ?? 0) > 0);

// Q5 — artefact-level: does the consumed recording publish a BARE basename *.mjs/*.mts token?
const BARE = /(?:^|[^\w/.-])([A-Za-z0-9_.-]+\.(?:mjs|mts))(?![\w/])/;
const artefactCache = new Map();
function publishesBare(path) {
  if (!treeSet.has(path)) return null;
  if (artefactCache.has(path)) return artefactCache.get(path);
  let v = false;
  try {
    const t = git('show', `${PIN}:${path}`);
    for (const line of t.split('\n')) {
      const m = line.match(BARE);
      if (m && !line.includes(`/${m[1]}`)) { v = true; break; }
    }
  } catch { v = null; }
  artefactCache.set(path, v);
  return v;
}
let pairsBare = 0, pairsUncommitted = 0, pairsClean = 0;
const bareRows = [];
for (const k of pairs.keys()) {
  const hits = pairs.get(k);
  const states = hits.map((h) => publishesBare(h.artefactPath));
  if (states.some((s) => s === true)) { pairsBare++; bareRows.push(k); }
  else if (states.every((s) => s === null)) pairsUncommitted++;
  else pairsClean++;
}

console.log('');
console.log('── K-cons-narrow: recordings only (.out under docs/research) ──');
console.log(`  narrow hits: ${narrowHits.length}   CROSS_DIR: ${narrowCross.length}   SAME_DIR: ${narrowHits.length - narrowCross.length}`);
console.log(`  distinct (consumer file → producer dir) CROSS_DIR pairs: ${pairs.size}`);
console.log(`    producer dir holds >=1 K-prod site:         ${pairStrip.length}`);
console.log(`    producer dir holds >=1 LOSSY_BASENAME site: ${pairLossy.length}`);
console.log(`  consumed artefact publishes a bare basename: ${pairsBare} | clean ${pairsClean} | artefact not committed ${pairsUncommitted}`);
console.log('');
console.log('── arm A\'s CROSS_DIR padding, decomposed ──');
console.log(`  .md literals dropped:                       ${droppedMd.length}`);
console.log(`  .out outside docs/research dropped:         ${droppedOutOutside.length}`);
console.log(`  surviving research recordings:              ${survivors.length}  of ${wideCross.length}`);
console.log('');
console.log('── narrowed CROSS_DIR pairs (strip/lossy sites in producer dir, bare-basename in artefact) ──');
for (const k of [...pairs.keys()].sort()) {
  const d = pairs.get(k)[0].producerDir;
  const ps = prodDirs.get(d) ?? { any: [], lossy: [] };
  const bare = bareRows.includes(k) ? 'BARE' : '    ';
  console.log(`  ${ps.any.length ? 'STRIP' : '  -  '} ${String(ps.any.length).padStart(2)}/${String(ps.lossy.length).padStart(2)} ${bare}  ${k}`);
}
console.log('');

pred('Q1', pairs.size >= 20 && pairs.size <= 150,
  `narrowed distinct CROSS_DIR pairs = ${pairs.size} (pre-registered >=20 and <=150)`);
pred('Q2', pairStrip.length / Math.max(1, pairs.size) >= 0.30,
  `producer dir holds >=1 K-prod site: ${pairStrip.length} of ${pairs.size} = ` +
  `${(100 * pairStrip.length / Math.max(1, pairs.size)).toFixed(1)}% (pre-registered >=30%; arm A's padded figure 9.3%)`);
pred('Q3', pairLossy.length / Math.max(1, pairs.size) >= 0.20,
  `producer dir holds >=1 LOSSY_BASENAME site: ${pairLossy.length} of ${pairs.size} = ` +
  `${(100 * pairLossy.length / Math.max(1, pairs.size)).toFixed(1)}% (pre-registered >=20%; arm A's padded figure 6.6%)`);
pred('Q4', (droppedMd.length + droppedOutOutside.length) / Math.max(1, wideCross.length) >= 0.50,
  `share of arm A's CROSS_DIR literals dropped by the narrowing: ` +
  `${droppedMd.length + droppedOutOutside.length} of ${wideCross.length} = ` +
  `${(100 * (droppedMd.length + droppedOutOutside.length) / Math.max(1, wideCross.length)).toFixed(1)}% (pre-registered >=50%)`);
pred('Q5', pairsBare / Math.max(1, pairs.size) >= 0.30,
  `narrowed pairs whose consumed artefact publishes a bare basename: ${pairsBare} of ${pairs.size} = ` +
  `${(100 * pairsBare / Math.max(1, pairs.size)).toFixed(1)}% (pre-registered >=30%). NOT realisation ` +
  `— B-lim2: this is what the artefact publishes, not what the consumer keys on.`);

console.log('');
console.log(`FROZEN comparison, arm A at ${A_REC_REV} (${A_REC}): 227 pairs, 9.3% strip, 6.6% lossy. ` +
  `Arm A stands verbatim; nothing here edits it.`);
console.log(`VERDICT/${red.length} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} prefused=${JSON.stringify(prefused)}`);
process.exit(red.length ? 1 : 0);
