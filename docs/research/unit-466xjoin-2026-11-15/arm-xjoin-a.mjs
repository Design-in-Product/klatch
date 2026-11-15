/**
 * unit-466xjoin — arm A
 *
 * Subject: the CROSS-FILE producer/consumer join. `unit-466striplift`'s `A-lim3` put it out of
 * scope by construction (that census keys on one file at a time); the 11/14 defect had its producer
 * and its consumer in different units. See PRE-REGISTRATION.md, pushed at `c40a37c6` before this
 * file existed.
 *
 * `K-prod` is byte-copied from `unit-466striplift` arm C (`K-strip3`) — the only spelling of that
 * key whose token extraction survived audit — and re-run at THIS pin, not read off arm C's
 * recording.
 *
 * `K-cons` keys on the artefact-path STRING LITERAL, not on the read call, because the known
 * positive binds its path to a `const` on one line and reads it on another.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = 'bdaf99b95780d203b091b3d0c53a043ebeb2ab46';
const PIN_SHORT = 'bdaf99b9';
const C_REC_REV = 'e8591df1';
const C_REC = 'docs/research/unit-466striplift-2026-11-15/drive3.armc.out';

// the known positive, named in the pre-registration before this key was written
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

// ═══════════════════════════════════ K-prod — byte-copied from unit-466striplift arm C (K-strip3)

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

// ═══════════════════════════════════════════════════════════════════════ the population, at the pin

const treeAll = git('ls-tree', '-r', '--name-only', PIN)
  .split('\n').map((s) => s.trim()).filter(Boolean);
const treeSet = new Set(treeAll);
const srcAll = treeAll.filter((p) => /\.(mjs|mts)$/.test(p));
const srcResearch = srcAll.filter((p) => p.startsWith('docs/research/'));
const text = new Map();
for (const p of srcAll) text.set(p, git('show', `${PIN}:${p}`).split('\n'));

leg('A1', srcAll.length > 0,
  `population at ${PIN_SHORT}: ${srcAll.length} .mjs/.mts repo-wide, of which ${srcResearch.length} ` +
  `under docs/research (arm C's key was docs/research-scoped at 472)`);

// ═══════════════════════════════════════════════════════════════════════════ K-prod over the corpus

function prodSites(files) {
  const sites = [];
  for (const p of files) {
    (text.get(p) ?? []).forEach((line, i) => {
      if (!Object.keys(SPELL).some((k) => SPELL[k].test(line))) return;
      if (!MAPSTRIP.test(line)) return;
      const toks = tokensOf(line);
      const params = mapParams(line);
      const derived = toks.filter((t) => params.includes(rootOf(t[1])));
      const classes = (derived.length ? derived : toks).map((t) => classOf(t[0], t[2]));
      const worst = classes.reduce((a, b) => (CLASS_RANK[b] > CLASS_RANK[a] ? b : a), 'NONLOSSY_NORMALISE');
      sites.push({ p, dir: posix.dirname(p), line: i + 1, id: `${p}:${i + 1}`, worst });
    });
  }
  return sites;
}
const sitesResearch = prodSites(srcResearch);
const sitesAll = prodSites(srcAll);

const cRec = git('show', `${C_REC_REV}:${C_REC}`);
const cTally = cRec.match(/K-strip3 : (\{[^}]*\})/);
leg('A2', sitesResearch.length >= 60,
  `K-prod at ${PIN_SHORT}: ${sitesResearch.length} site(s) under docs/research, ${sitesAll.length} ` +
  `repo-wide. FROZEN at ${C_REC_REV}, arm C's recording: 60 sites / tally ${cTally ? cTally[1] : 'UNPARSEABLE'}. ` +
  `This is a COUNT-level agreement only — arm C's recording publishes no member list, and my own ` +
  `B-pop-c found two populations agreeing at 60 whose members differed by 17. The member list is ` +
  `printed below, unstripped, for the first time.`);

const prodDirs = new Map(); // dir -> {any:[], lossy:[]}
for (const s of sitesAll) {
  if (!prodDirs.has(s.dir)) prodDirs.set(s.dir, { any: [], lossy: [] });
  prodDirs.get(s.dir).any.push(s.id);
  if (s.worst === 'LOSSY_BASENAME') prodDirs.get(s.dir).lossy.push(s.id);
}

// ═══════════════════════════════════════════════════════════════════════════════════════ K-cons

const LITERAL = /(['"`])((?:[^'"`\\\n]|\\.)*?)\1/g;
const ARTEFACT = /\.(out|md)$/;

const consSites = [];
for (const p of srcAll) {
  const dir = posix.dirname(p);
  (text.get(p) ?? []).forEach((line, i) => {
    for (const m of line.matchAll(LITERAL)) {
      const lit = m[2];
      if (!ARTEFACT.test(lit)) continue;
      let kind, producerDir = null;
      if (lit.includes('${')) kind = 'UNRESOLVED_INTERP';
      else if (!lit.includes('/')) kind = 'SAME_DIR_BARE';
      else if (lit.startsWith('docs/research/') || lit.startsWith('docs/')) {
        producerDir = posix.dirname(lit);
        kind = producerDir === dir ? 'SAME_DIR' : 'CROSS_DIR';
      } else if (lit.startsWith('../') || lit.startsWith('./')) {
        producerDir = posix.normalize(posix.join(dir, lit));
        producerDir = posix.dirname(producerDir);
        kind = producerDir === dir ? 'SAME_DIR' : 'CROSS_DIR';
      } else {
        producerDir = posix.dirname(posix.join(dir, lit));
        kind = producerDir === dir ? 'SAME_DIR' : 'CROSS_DIR';
      }
      const artefactPath = producerDir === null ? null : posix.normalize(
        lit.startsWith('docs/') ? lit : posix.join(dir, lit.replace(/^\.\//, '')));
      consSites.push({
        p, dir, line: i + 1, id: `${p}:${i + 1}`, lit, kind, producerDir, artefactPath,
        committed: artefactPath === null ? null : treeSet.has(artefactPath),
        readCallSameLine: /(readFileSync|readFile|execFileSync|\bgit\(|sgit\(|show)/.test(line),
      });
    }
  });
}

const byKind = {};
for (const c of consSites) byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
const crossDir = consSites.filter((c) => c.kind === 'CROSS_DIR');
const crossPairs = new Map(); // `${consumerFile}→${producerDir}`
for (const c of crossDir) {
  const k = `${c.p}  →  ${c.producerDir}`;
  if (!crossPairs.has(k)) crossPairs.set(k, []);
  crossPairs.get(k).push(c);
}

// ═══════════════════════════════════════════════════════ A3–A5 — the known positive, and the key shape

const kpHits = consSites.filter((c) => c.p === KP_FILE && c.line === KP_LINE);
leg('A3', kpHits.length === 1,
  `KP reached by K-cons: ${KP_FILE}:${KP_LINE} → ${kpHits.length} hit(s)` +
  (kpHits.length ? ` lit="${kpHits[0].lit}" kind=${kpHits[0].kind}` : ' — THE KEY IS BROKEN'));

const kp = kpHits[0];
const kpDirSites = kp && kp.producerDir ? (prodDirs.get(kp.producerDir) ?? { any: [], lossy: [] }) : { any: [], lossy: [] };
leg('A4', !!kp && kp.kind === 'CROSS_DIR' && kp.producerDir === KP_PRODUCER_DIR
  && kpDirSites.any.includes(KP_PRODUCER_SITE),
  `KP join: kind=${kp?.kind} producerDir=${kp?.producerDir} (expected ${KP_PRODUCER_DIR}); ` +
  `that dir's K-prod sites = ${kpDirSites.any.length}, includes the 11/14 publication ` +
  `${KP_PRODUCER_SITE}: ${kpDirSites.any.includes(KP_PRODUCER_SITE)}`);

// the rival key: anchored on a read call on the SAME physical line
const readKeyHits = [];
for (const p of srcAll) {
  (text.get(p) ?? []).forEach((line, i) => {
    if (!/(readFileSync|execFileSync|\bgit\(\s*['"]show|sgit\()/.test(line)) return;
    for (const m of line.matchAll(LITERAL)) if (ARTEFACT.test(m[2])) { readKeyHits.push(`${p}:${i + 1}`); break; }
  });
}
leg('A5', !readKeyHits.includes(`${KP_FILE}:${KP_LINE}`),
  `the rival same-line read-call key reaches ${readKeyHits.length} line(s) and the KP line is NOT ` +
  `among them: ${!readKeyHits.includes(`${KP_FILE}:${KP_LINE}`)} — the path is bound to a const on ` +
  `line ${KP_LINE} and read elsewhere`);

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('A6', gate === '', `gate: git status --porcelain packages scripts docs/research/lib → ${gate === '' ? 'empty' : gate}`);

// ═══════════════════════════════════════════════════════════════════ the figures, then the predictions

const dirsCross = [...new Set(crossDir.map((c) => c.producerDir))];
const dirsWithStrip = dirsCross.filter((d) => (prodDirs.get(d)?.any.length ?? 0) > 0);
const dirsWithLossy = dirsCross.filter((d) => (prodDirs.get(d)?.lossy.length ?? 0) > 0);
const pairsWithStrip = [...crossPairs.keys()].filter((k) => {
  const d = crossPairs.get(k)[0].producerDir; return (prodDirs.get(d)?.any.length ?? 0) > 0;
});
const pairsWithLossy = [...crossPairs.keys()].filter((k) => {
  const d = crossPairs.get(k)[0].producerDir; return (prodDirs.get(d)?.lossy.length ?? 0) > 0;
});
const interpShare = consSites.length ? (byKind.UNRESOLVED_INTERP ?? 0) / consSites.length : 0;
const consFilesK = new Set(consSites.map((c) => c.p)).size;
const consFilesRead = new Set(readKeyHits.map((s) => s.split(':')[0])).size;
const uncommitted = consSites.filter((c) => c.committed === false);

console.log('');
console.log('── K-prod member list (unstripped, corpus-member paths; arm C published none) ──');
for (const s of sitesAll) console.log(`  ${s.worst.padEnd(19)} ${s.id}`);
console.log('');
console.log('── K-cons tally ──');
console.log(`  literals matching an artefact path: ${consSites.length} across ${consFilesK} file(s)`);
for (const k of Object.keys(byKind).sort()) console.log(`    ${k.padEnd(18)} ${byKind[k]}`);
console.log(`  distinct (consumer file → producer dir) CROSS_DIR pairs: ${crossPairs.size}`);
console.log(`  distinct producer dirs consumed cross-dir: ${dirsCross.length}`);
console.log(`    of those, holding >=1 K-prod site:          ${dirsWithStrip.length}`);
console.log(`    of those, holding >=1 LOSSY_BASENAME site:  ${dirsWithLossy.length}`);
console.log(`  named artefacts not committed at the pin: ${uncommitted.length}`);
console.log('');
console.log('── CROSS_DIR pairs (producer-dir strip sites / of which lossy) ──');
for (const k of [...crossPairs.keys()].sort()) {
  const d = crossPairs.get(k)[0].producerDir;
  const ps = prodDirs.get(d) ?? { any: [], lossy: [] };
  console.log(`  ${ps.any.length ? 'STRIP' : '  -  '} ${String(ps.any.length).padStart(2)}/${String(ps.lossy.length).padStart(2)}  ${k}  [lines ${crossPairs.get(k).map((c) => c.line).join(',')}]`);
}
console.log('');

pred('P1', crossPairs.size >= 10 && crossPairs.size <= 60,
  `distinct CROSS_DIR (consumer file → producer dir) pairs = ${crossPairs.size} (pre-registered >=10 and <=60)`);
pred('P2', pairsWithStrip.length / Math.max(1, crossPairs.size) >= 0.5,
  `CROSS_DIR pairs whose producer dir holds >=1 K-prod site: ${pairsWithStrip.length} of ${crossPairs.size} = ` +
  `${(100 * pairsWithStrip.length / Math.max(1, crossPairs.size)).toFixed(1)}% (pre-registered >=50%)`);
pred('P3', pairsWithLossy.length / Math.max(1, crossPairs.size) >= 0.5,
  `CROSS_DIR pairs whose producer dir holds >=1 LOSSY_BASENAME site: ${pairsWithLossy.length} of ` +
  `${crossPairs.size} = ${(100 * pairsWithLossy.length / Math.max(1, crossPairs.size)).toFixed(1)}% (pre-registered >=50%)`);
pred('P4', consFilesRead < consFilesK,
  `rival same-line read-call key reaches ${consFilesRead} distinct consumer file(s) vs K-cons's ${consFilesK}`);
pred('P5', interpShare <= 0.40,
  `CEILING — UNRESOLVED_INTERP share of all K-cons literals: ${byKind.UNRESOLVED_INTERP ?? 0} of ` +
  `${consSites.length} = ${(100 * interpShare).toFixed(1)}% (pre-registered ceiling <=40%). ` +
  `${interpShare <= 0.40 ? 'HELD — the CROSS_DIR figures stand as reported.' : 'FIRED — every CROSS_DIR figure above is REFUSED as an undercount of unknown size.'}`);

console.log('');
console.log(`VERDICT/${red.length} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} prefused=${JSON.stringify(prefused)}`);
process.exit(red.length ? 1 : 0);
