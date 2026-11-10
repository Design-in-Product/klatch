#!/usr/bin/env node
/**
 * unit-465plant — POST-HOC v2. Written after reading `posthoc-run-1.txt`, which surfaced three
 * things, two of them defects in MY OWN instrument rather than properties of the screen:
 *
 *  (a) PRECISION. 12 flags over 21 added declarations — a 57% flag rate. Reading the 12 by hand,
 *      most are not anchors at all: short commit shas (`"72886c0b"`, `"6465346a"`), a path fragment
 *      (`"lib/tree-fingerprint.mts"`, occ=11), a probe's own filename. `occ >= 2` is harmless for a
 *      literal nothing mutates. So the screen is keyed on EVERY added literal when the hazard only
 *      exists for literals passed to a mutation helper. This leg measures the restricted keys.
 *
 *  (b) MY REFUSAL LIMB WAS OVER-BROAD. R6 refused any delta with `0 literal declarations at base`.
 *      346 of 782 deltas died there. But 0 literals at base is a LEGITIMATE state (the file had no
 *      string-literal consts), not an extraction failure — so R6, which I pre-registered as a
 *      virtue, suppressed the measurement over 44% of the population. The 12/21 of run 1 is a figure
 *      over the 28% of deltas my own guard let through.
 *
 *  (c) NEW FILES WERE NEVER SCREENED. 216 deltas refused as `path absent at one side`. For a file
 *      being ADDED that is wrong: base should be empty and every literal in it is newly typed. A new
 *      copier file is the highest-risk case there is, and the screen was silent on all of them.
 *      Deletions, in the same bucket, are correctly skipped — so the bucket needed splitting.
 *
 * Neither (b) nor (c) was pre-registered. Both are reported as instrument defects of mine.
 * `screen-added-declaration.mjs` / `screen-run-1.txt` and `posthoc-precision-and-blindness.mjs` /
 * `posthoc-run-1.txt` are NOT edited; they stay matched source/capture pairs.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
if (!existsSync(join(REPO, 'scripts', 'sweep-probes.mjs'))) { console.log('REFUSED — repo root not found'); process.exit(2); }

const occ = (hay, needle) => (needle === '' ? -1 : hay.split(needle).length - 1);
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const blob = (rev, path) => { try { return git('show', `${rev}:${path}`); } catch { return null; } };

const SIMPLE = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
function parseLiteral(rhs) {
  const q = rhs[0];
  if (q !== "'" && q !== '"' && q !== '`') return { unread: 'not a literal' };
  let out = ''; let i = 1;
  while (i < rhs.length) {
    const c = rhs[i];
    if (c === '\\') {
      const e = rhs[i + 1];
      if (e === undefined) return { unread: 'trailing backslash' };
      if (e in SIMPLE) { out += SIMPLE[e]; i += 2; continue; }
      if (e === '\\' || e === "'" || e === '"' || e === '`') { out += e; i += 2; continue; }
      if (e === 'x') { const h = rhs.slice(i + 2, i + 4); if (!/^[0-9a-fA-F]{2}$/.test(h)) return { unread: 'bad \\x' }; out += String.fromCharCode(parseInt(h, 16)); i += 4; continue; }
      if (e === 'u') { const h = rhs.slice(i + 2, i + 6); if (!/^[0-9a-fA-F]{4}$/.test(h)) return { unread: 'bad \\u' }; out += String.fromCharCode(parseInt(h, 16)); i += 6; continue; }
      return { unread: `unknown escape \\${e}` };
    }
    if (q === '`' && c === '$' && rhs[i + 1] === '{') return { unread: 'interpolation' };
    if (c === q) return i === rhs.length - 1 ? { value: out } : { unread: 'continues past literal' };
    out += c; i++;
  }
  return { unread: 'unterminated' };
}
function literalDecls(src) {
  const decls = new Map();
  const lines = src.split('\n');
  for (let n = 0; n < lines.length; n++) {
    const m = /^const ([A-Za-z_$][\w$]*) = (.*);[ \t]*$/.exec(lines[n]);
    if (!m) continue;
    const p = parseLiteral(m[2]);
    if (!p.unread) decls.set(m[1], { value: p.value, line: n + 1 });
  }
  return decls;
}

/**
 * The two restricted population keys, both computed off the candidate source.
 *  K-once: the name appears on a line that also calls `once(` — the documented mutation helper.
 *  K-used: the name appears anywhere other than its own declaration line — i.e. it is consumed at
 *          all. Deliberately looser, and it over-reports by construction.
 */
function keysFor(src, name, declLine) {
  const lines = src.split('\n');
  let kOnce = false, kUsed = false;
  const re = new RegExp(`\\b${name}\\b`);
  for (let i = 0; i < lines.length; i++) {
    if (i + 1 === declLine) continue;
    if (!re.test(lines[i])) continue;
    kUsed = true;
    if (/\bonce\s*\(/.test(lines[i])) kOnce = true;
  }
  return { kOnce, kUsed };
}

console.log('unit-465plant — POST-HOC v2: the repaired population, and the restricted keys');

const log = git('log', '--format=%H %P', '--no-merges', '--', 'scripts/').trim().split('\n').filter(Boolean);
console.log(`population: ${log.length} non-merge commits touching scripts/ (whole history of scripts/, a rev range)`);

const B = { created: 0, modified: 0, deleted: 0, noLiteralsCand: 0, diffFailed: 0 };
let nAdded = 0;
const flags = [];        // every flagged ADDED literal, unrestricted key
for (const line of log) {
  const parts = line.split(' ');
  const h = parts[0], parents = parts.slice(1);
  if (parents.length === 0) continue;
  const p = parents[0];
  let touched;
  try { touched = git('diff', '--name-only', p, h, '--', 'scripts/').split('\n').map((s) => s.trim()).filter(Boolean); }
  catch { B.diffFailed++; continue; }
  for (const f of touched) {
    const baseSrc = blob(p, f);
    const candSrc = blob(h, f);
    if (candSrc === null) { B.deleted++; continue; }            // (c) deletions: correctly skipped
    if (baseSrc === null) B.created++; else B.modified++;        // (c) creations: base is EMPTY, not absent
    const base = baseSrc === null ? new Map() : literalDecls(baseSrc);
    const cand = literalDecls(candSrc);
    if (cand.size === 0) { B.noLiteralsCand++; continue; }       // (b) a legitimate empty, counted, not "refused"
    for (const [name, cd] of cand) {
      const bd = base.get(name);
      if (bd !== undefined && bd.value === cd.value) continue;
      nAdded++;
      const n = occ(candSrc, cd.value);
      if (n < 2) continue;
      flags.push({ h: h.slice(0, 8), f: f.replace(/^scripts\//, ''), name, line: cd.line, occ: n, value: cd.value, created: baseSrc === null, ...keysFor(candSrc, name, cd.line) });
    }
  }
}

const deltas = B.created + B.modified;
console.log(`\n== the repaired population ==`);
console.log(`  file-deltas with the file present at candidate: ${deltas}  (created ${B.created} · modified ${B.modified})`);
console.log(`  deletions skipped (candidate absent — correctly out of scope): ${B.deleted}`);
console.log(`  candidate has 0 literal declarations (a legitimate empty, counted not refused): ${B.noLiteralsCand}`);
console.log(`  diff failures: ${B.diffFailed}`);
console.log(`  ADDED literal declarations: ${nAdded}`);
console.log(`  run 1 reached 218 graded deltas and 21 ADDED; this reaches ${deltas - B.noLiteralsCand} and ${nAdded}.`);

const nOnce = flags.filter((f) => f.kOnce).length;
const nUsed = flags.filter((f) => f.kUsed).length;
console.log(`\n== precision, unrestricted vs. the two restricted keys ==`);
console.log(`  FLAGGED, unrestricted (every added literal):      ${flags.length} / ${nAdded} added  = ${(100 * flags.length / nAdded).toFixed(1)}%`);
console.log(`  FLAGGED, K-used (name consumed anywhere):         ${nUsed} / ${nAdded}`);
console.log(`  FLAGGED, K-once (name on a line calling once()):  ${nOnce} / ${nAdded}`);
console.log(`  so the unrestricted key reports ${flags.length - nOnce} flag(s) that no once() call can act on.`);

console.log(`\n== every flag, with its keys, so each is checkable rather than taken on a rate ==`);
for (const f of flags) {
  console.log(`  ${f.kOnce ? 'ANCHOR  ' : f.kUsed ? 'used    ' : 'inert   '} ${f.h} ${f.created ? '[NEW FILE] ' : ''}${f.f}`);
  console.log(`      ${f.name} @${f.line} occ=${f.occ}  ${JSON.stringify(f.value).slice(0, 100)}`);
}

const newFileFlags = flags.filter((f) => f.created);
const newFileAnchors = newFileFlags.filter((f) => f.kOnce);
console.log(`\n== what repair (c) recovered — flags inside files being CREATED, invisible to run 1 ==`);
console.log(`  flags on new files: ${newFileFlags.length} · of those anchor-like (K-once): ${newFileAnchors.length}`);
for (const f of newFileAnchors) console.log(`    ${f.h} ${f.f}  ${f.name} @${f.line} occ=${f.occ}`);

console.log(`\n================ VERDICT ================`);
console.log(`REPAIRED POPULATION — ${deltas} deltas vs. run 1's 218 · ${nAdded} added literals vs. run 1's 21`);
console.log(`PRECISION — unrestricted ${flags.length}/${nAdded}; K-once ${nOnce}/${nAdded}. The restricted key is the cure for (a).`);
console.log(`RECOVERED BY (c) — ${newFileFlags.length} flag(s) on created files, ${newFileAnchors.length} of them anchor-like, all invisible to run 1.`);
