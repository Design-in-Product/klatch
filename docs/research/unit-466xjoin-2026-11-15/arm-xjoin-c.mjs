/**
 * unit-466xjoin — arm C
 *
 * Subject: **arm B's own commit message.** "The numerator did not move at all" — 21 and 15 in both
 * arms — is a count-level claim about two member lists nobody compared. See PRE-REGISTRATION-C.md
 * (`df541de0`), pushed before this file existed.
 *
 * Both keys are re-derived here in-process; the published counts are read as FROZEN strings off the
 * two recordings at their own revs, so a disagreement reddens instead of being averaged away.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = 'bdaf99b95780d203b091b3d0c53a043ebeb2ab46';
const A_REV = '2c3edaf0';
const A_REC = 'docs/research/unit-466xjoin-2026-11-15/drive1.arma.out';
const B_REV = '88208695';
const B_REC = 'docs/research/unit-466xjoin-2026-11-15/drive2.armb.out';

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

// ═════════════════════════════════════════ K-prod, byte-copied from arms A and B (arm C of striplift)

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
const pairFor = (c) => [new RegExp(`${ID}${c}`, 'g'), new RegExp(`${PAREN}${c}`, 'g')];
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

const treeAll = git('ls-tree', '-r', '--name-only', PIN).split('\n').map((s) => s.trim()).filter(Boolean);
const srcAll = treeAll.filter((p) => /\.(mjs|mts)$/.test(p));
const text = new Map();
for (const p of srcAll) text.set(p, git('show', `${PIN}:${p}`).split('\n'));

const prodDirs = new Map();
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
    if (!prodDirs.has(dir)) prodDirs.set(dir, { any: [], lossy: [] });
    prodDirs.get(dir).any.push(`${p}:${i + 1}`);
    if (worst === 'LOSSY_BASENAME') prodDirs.get(dir).lossy.push(`${p}:${i + 1}`);
  });
}

// ═══════════════════════════════════════════════════════════ both consumer keys, side by side

const LITERAL = /(['"`])((?:[^'"`\\\n]|\\.)*?)\1/g;
const hits = [];
for (const p of srcAll) {
  const dir = posix.dirname(p);
  (text.get(p) ?? []).forEach((line, i) => {
    for (const m of line.matchAll(LITERAL)) {
      const lit = m[2];
      if (!/\.(out|md)$/.test(lit)) continue;
      if (lit.includes('${') || !lit.includes('/')) continue;
      const artefactPath = posix.normalize(lit.startsWith('docs/') ? lit : posix.join(dir, lit.replace(/^\.\//, '')));
      const producerDir = posix.dirname(artefactPath);
      if (producerDir === dir) continue; // CROSS_DIR only, as both arms reported
      hits.push({ p, dir, line: i + 1, lit, producerDir, artefactPath, ext: /\.md$/.test(lit) ? 'md' : 'out',
        inNarrow: /\.out$/.test(lit) && artefactPath.startsWith('docs/research/') });
    }
  });
}
const key = (h) => `${h.p}  →  ${h.producerDir}`;
const isStrip = (d) => (prodDirs.get(d)?.any.length ?? 0) > 0;
const isLossy = (d) => (prodDirs.get(d)?.lossy.length ?? 0) > 0;

const aPairs = new Map(); const bPairs = new Map();
for (const h of hits) {
  if (!aPairs.has(key(h))) aPairs.set(key(h), []);
  aPairs.get(key(h)).push(h);
  if (h.inNarrow) {
    if (!bPairs.has(key(h))) bPairs.set(key(h), []);
    bPairs.get(key(h)).push(h);
  }
}
const aStrip = new Set([...aPairs.keys()].filter((k) => isStrip(aPairs.get(k)[0].producerDir)));
const bStrip = new Set([...bPairs.keys()].filter((k) => isStrip(bPairs.get(k)[0].producerDir)));
const aLossy = new Set([...aPairs.keys()].filter((k) => isLossy(aPairs.get(k)[0].producerDir)));
const bLossy = new Set([...bPairs.keys()].filter((k) => isLossy(bPairs.get(k)[0].producerDir)));

// ── C1 — reproduce the two published counts, read FROZEN off the recordings
const aRec = git('show', `${A_REV}:${A_REC}`);
const bRec = git('show', `${B_REV}:${B_REC}`);
const aPub = aRec.match(/K-prod site: (\d+) of (\d+)/);
const bPub = bRec.match(/K-prod site: (\d+) of (\d+)/);
leg('C1', !!aPub && !!bPub && Number(aPub[1]) === aStrip.size && Number(bPub[1]) === bStrip.size,
  `FROZEN: arm A at ${A_REV} published ${aPub ? aPub[1] : '?'} strip pairs of ${aPub ? aPub[2] : '?'}; ` +
  `arm B at ${B_REV} published ${bPub ? bPub[1] : '?'} of ${bPub ? bPub[2] : '?'}. Re-derived here: ` +
  `A=${aStrip.size} of ${aPairs.size}, B=${bStrip.size} of ${bPairs.size}`);

const onlyA = [...aStrip].filter((k) => !bStrip.has(k));
const onlyB = [...bStrip].filter((k) => !aStrip.has(k));
leg('C2', true,
  `strip-pair symmetric difference: |A\\B|=${onlyA.length} |B\\A|=${onlyB.length} (printed in full below)`);

const lOnlyA = [...aLossy].filter((k) => !bLossy.has(k));
const lOnlyB = [...bLossy].filter((k) => !aLossy.has(k));
leg('C3', true, `lossy-pair symmetric difference: |A\\B|=${lOnlyA.length} |B\\A|=${lOnlyB.length}`);

// ── C4 — what supports each A-strip member: .out, .md, or both
const support = new Map();
for (const k of aStrip) {
  const exts = new Set(aPairs.get(k).map((h) => h.ext));
  support.set(k, exts.has('out') && exts.has('md') ? 'BOTH' : exts.has('out') ? 'out-only' : 'md-only');
}
const tally = { BOTH: 0, 'out-only': 0, 'md-only': 0 };
for (const v of support.values()) tally[v]++;
leg('C4', tally['md-only'] + tally['out-only'] + tally.BOTH === aStrip.size,
  `A-strip support: ${JSON.stringify(tally)} over ${aStrip.size} member(s)`);

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('C5', gate === '', `gate: ${gate === '' ? 'empty' : gate}`);

console.log('');
console.log('── A-strip members, with what supports each ──');
for (const k of [...aStrip].sort()) console.log(`  ${support.get(k).padEnd(9)} ${k}`);
console.log('');
if (onlyA.length) { console.log('── in A-strip, NOT in B-strip ──'); for (const k of onlyA) console.log(`  ${k}`); }
if (onlyB.length) { console.log('── in B-strip, NOT in A-strip ──'); for (const k of onlyB) console.log(`  ${k}`); }
console.log('');

pred('R1', onlyA.length === 0 && onlyB.length === 0,
  `the two strip-pair sets are identical: |A\\B|=${onlyA.length}, |B\\A|=${onlyB.length}. ` +
  `${onlyA.length || onlyB.length ? 'Arm B\'s "the numerator did not move" is FALSE as written and RESULTS.md must say so.' : 'Arm B\'s claim holds at member level, not only at count level.'}`);
pred('R2', tally.BOTH >= 1,
  `A-strip members supported by BOTH a .out and a .md literal: ${tally.BOTH} (md-only: ${tally['md-only']}, out-only: ${tally['out-only']})`);
pred('R3', lOnlyA.length === 0 && lOnlyB.length === 0,
  `the two lossy-pair sets are identical: |A\\B|=${lOnlyA.length}, |B\\A|=${lOnlyB.length}`);

console.log('');
console.log(`VERDICT/${red.length} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} prefused=${JSON.stringify(prefused)}`);
process.exit(red.length ? 1 : 0);
