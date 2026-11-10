#!/usr/bin/env node
/**
 * unit-465recall — the recall figure Daedalus's §7 routed with "Blocker: none named ... a join I did
 * not build."
 *
 * The question, in his words: *of the standing hand-typed anchors, how many would the restricted
 * screen have flagged at the commit that typed each?*
 *
 * Three parts, from three different owners, and the seams are the point:
 *   - the POPULATION is v2's 11 hand-typed anchors. Taken from a FRESH run of
 *     `unit-465census-v2-2026-11-10/census-anchors-v2.mjs` (unedited), calibrated against the
 *     headline that run prints.
 *   - the EXTRACTOR and the KEY are Daedalus's, taken as a verbatim SLICE of
 *     `unit-465plant-2026-11-10/posthoc-v2-repaired-population.mjs` (unedited). Both markers are
 *     asserted to occur exactly once. Nothing in his extractor or his `K-once` key is re-typed here.
 *   - the ADDED predicate is inline in his driver loop, not in a sliceable function, so it IS
 *     re-implemented here — and it is therefore GRADED (R4): his instrument is re-run, and this
 *     loop must reproduce every figure that run prints over all 403 commits, or this refuses and
 *     reports no recall figure.
 *
 * R2: no anchor value, declaration line, count or result sha is typed in this file.
 * R7: no probe is driven; history is read with `git show`.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const V2 = join(REPO, 'docs', 'research', 'unit-465census-v2-2026-11-10', 'census-anchors-v2.mjs');
const PLANT = join(REPO, 'docs', 'research', 'unit-465plant-2026-11-10', 'posthoc-v2-repaired-population.mjs');
const MEMO = join(REPO, 'docs', 'mail',
  'daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-the-red-state-is-built-and-it-refutes-the-published-spelling-of-your-screen-and-377s-three-collisions-date-to-the-files-birth-2026-11-10.md');

const refuse = (why) => { console.log(`\nREFUSED — ${why}`); process.exit(2); };
if (!existsSync(join(SCRIPTS, 'sweep-probes.mjs'))) refuse(`scripts/ not found at ${SCRIPTS} (resolved from ${HERE})`);
for (const [what, p] of [['v2', V2], ['plant post-hoc v2', PLANT], ['the routing memo', MEMO]]) {
  if (!existsSync(p)) refuse(`${what} not found at ${p}`);
}

console.log('unit-465recall — recall of the restricted K-once screen over the standing anchor population');
console.log(`repo: ${REPO}`);

// ===== LEG 0 (R3) — slice Daedalus's extractor and key, verbatim, markers asserted unique ========
console.log(`\n== LEG 0 (R3). The extractor and the key, sliced out of his instrument — not re-typed ==`);
const plantSrc = readFileSync(PLANT, 'utf8');
const START = 'const occ = (hay, needle)';
const END = '  return { kOnce, kUsed };\n}';
for (const [label, m] of [['start', START], ['end', END]]) {
  const n = plantSrc.split(m).length - 1;
  console.log(`  ${label} marker occurs ${n} time(s) in his source — ${n === 1 ? 'OK' : 'NOT UNIQUE'}`);
  if (n !== 1) refuse(`slice ${label} marker is not unique in ${PLANT}`);
}
const sliceStart = plantSrc.indexOf(START);
const sliceEnd = plantSrc.indexOf(END) + END.length;
if (sliceEnd <= sliceStart) refuse(`slice end marker precedes start marker`);
const sliced = plantSrc.slice(sliceStart, sliceEnd);
console.log(`  sliced ${sliced.length} bytes, ${sliced.split('\n').length} lines, from his line ` +
  `${plantSrc.slice(0, sliceStart).split('\n').length} to ${plantSrc.slice(0, sliceEnd).split('\n').length}`);
const WANT = ['occ', 'git', 'blob', 'parseLiteral', 'literalDecls', 'keysFor'];
let lib;
try {
  // eslint-disable-next-line no-new-func
  lib = new Function('REPO', 'execFileSync', `${sliced}\n; return { ${WANT.join(', ')} };`)(REPO, execFileSync);
} catch (e) { refuse(`his slice does not evaluate: ${e.message}`); }
for (const k of WANT) if (typeof lib[k] !== 'function') refuse(`sliced binding "${k}" is not a function`);
console.log(`  bindings recovered from the slice: ${WANT.join(', ')} — all functions`);
const { occ, git, blob, literalDecls, keysFor } = lib;

// his ADDED predicate, re-implemented because it is inline in his driver; GRADED in LEG 1.
const addedDecls = (baseSrc, candSrc) => {
  const base = baseSrc === null ? new Map() : literalDecls(baseSrc);
  const cand = literalDecls(candSrc);
  const out = [];
  for (const [name, cd] of cand) {
    const bd = base.get(name);
    if (bd !== undefined && bd.value === cd.value) continue;
    out.push({ name, ...cd });
  }
  return { out, candSize: cand.size };
};

// ===== LEG 1 (R4) — calibrate against HIS OWN fresh run before measuring anything ===============
console.log(`\n== LEG 1 (R4). Calibration: his instrument re-run here, my loop graded against its stdout ==`);
const hisRun = spawnSync(process.execPath, [PLANT], { encoding: 'utf8', cwd: REPO, maxBuffer: 256 * 1024 * 1024 });
console.log(`  his exit code (from spawnSync, not inferred from output): ${hisRun.status}`);
if (hisRun.status !== 0) refuse(`his instrument exited ${hisRun.status}`);
const hisOut = hisRun.stdout;
const grab = (re, what) => { const m = re.exec(hisOut); if (!m) refuse(`could not read "${what}" out of his own stdout`); return Number(m[1]); };
const his = {
  commits: grab(/^population: (\d+) non-merge commits/m, 'commits'),
  deltas: grab(/file-deltas with the file present at candidate: (\d+)/, 'deltas'),
  created: grab(/\(created (\d+) ·/, 'created'),
  modified: grab(/· modified (\d+)\)/, 'modified'),
  deleted: grab(/deletions skipped \(candidate absent — correctly out of scope\): (\d+)/, 'deleted'),
  noLits: grab(/candidate has 0 literal declarations \(a legitimate empty, counted not refused\): (\d+)/, 'noLits'),
  added: grab(/ADDED literal declarations: (\d+)/, 'added'),
  flags: grab(/FLAGGED, unrestricted \(every added literal\): +(\d+) \//, 'flags'),
  kUsed: grab(/FLAGGED, K-used \(name consumed anywhere\): +(\d+) \//, 'kUsed'),
  kOnce: grab(/FLAGGED, K-once \(name on a line calling once\(\)\): +(\d+) \//, 'kOnce'),
  newFlags: grab(/flags on new files: (\d+) ·/, 'newFlags'),
  newAnchors: grab(/· of those anchor-like \(K-once\): (\d+)/, 'newAnchors'),
};

// drive the same population with the sliced extractor + my ADDED predicate
const log = git('log', '--format=%H %P', '--no-merges', '--', 'scripts/').trim().split('\n').filter(Boolean);
const mine = { commits: log.length, created: 0, modified: 0, deleted: 0, noLits: 0, added: 0, flags: 0, kUsed: 0, kOnce: 0, newFlags: 0, newAnchors: 0 };
for (const line of log) {
  const parts = line.split(' ');
  const h = parts[0], parents = parts.slice(1);
  if (parents.length === 0) continue;
  const p = parents[0];
  let touched;
  try { touched = git('diff', '--name-only', p, h, '--', 'scripts/').split('\n').map((s) => s.trim()).filter(Boolean); } catch { continue; }
  for (const f of touched) {
    const baseSrc = blob(p, f);
    const candSrc = blob(h, f);
    if (candSrc === null) { mine.deleted++; continue; }
    if (baseSrc === null) mine.created++; else mine.modified++;
    const { out, candSize } = addedDecls(baseSrc, candSrc);
    if (candSize === 0) { mine.noLits++; continue; }
    for (const d of out) {
      mine.added++;
      const n = occ(candSrc, d.value);
      if (n < 2) continue;
      mine.flags++;
      const k = keysFor(candSrc, d.name, d.line);
      if (k.kUsed) mine.kUsed++;
      if (k.kOnce) mine.kOnce++;
      if (baseSrc === null) { mine.newFlags++; if (k.kOnce) mine.newAnchors++; }
    }
  }
}
mine.deltas = mine.created + mine.modified;
let calBad = 0;
for (const k of ['commits', 'deltas', 'created', 'modified', 'deleted', 'noLits', 'added', 'flags', 'kUsed', 'kOnce', 'newFlags', 'newAnchors']) {
  const ok = mine[k] === his[k];
  if (!ok) calBad++;
  console.log(`  ${k.padEnd(11)} his ${String(his[k]).padStart(4)} · mine ${String(mine[k]).padStart(4)} · ${ok ? 'OK' : 'DIVERGES'}`);
}
if (calBad > 0) refuse(`${calBad} calibration figure(s) diverge from his own run — no recall figure is reported`);
console.log(`  all 12 figures agree with HIS OWN RUN's stdout (not with numbers typed out of his memo).`);

// ===== LEG 2 — the population: v2's hand-typed anchors, from a fresh run ========================
console.log(`\n== LEG 2. Population: a fresh run of v2, calibrated against the headline it prints ==`);
const v2run = spawnSync(process.execPath, [V2], { encoding: 'utf8', cwd: REPO });
console.log(`  v2 exit code: ${v2run.status}`);
if (v2run.status !== 0) refuse(`v2 exited ${v2run.status}`);
const vl = v2run.stdout.split('\n');
const copierFull = [];
for (const l of vl) { const m = /^ {2}(\S+\.mts) {2}\(throw at :(\d+)\)$/.exec(l); if (m) copierFull.push(m[1]); }
const expand = (prefix) => {
  const hit = copierFull.filter((f) => f.startsWith(prefix));
  if (hit.length !== 1) refuse(`copier prefix "${prefix}" matched ${hit.length} full names, not 1`);
  return hit[0];
};
const anchors = [];
for (const l of vl) {
  const m = /^ {2}(\S+)… (\S+) @(\d+|-) \[(hand-typed|derived|UNREAD)\]/.exec(l);
  if (m) anchors.push({ id: m[2], copier: expand(m[1]), line: m[3] === '-' ? null : Number(m[3]), kind: m[4] });
}
const hA = /anchors: (\d+) \((\d+) hand-typed, (\d+) derived, (\d+) UNREAD\)/.exec(vl.find((l) => /^copiers: /.test(l)) ?? '');
if (!hA) refuse(`could not read v2's own anchor headline back out of its stdout`);
const handTyped = anchors.filter((a) => a.kind === 'hand-typed');
console.log(`  parsed anchors ${anchors.length} · headline ${hA[1]} · ${anchors.length === Number(hA[1]) ? 'OK' : 'MISMATCH'}`);
console.log(`  parsed hand-typed ${handTyped.length} · headline ${hA[2]} · ${handTyped.length === Number(hA[2]) ? 'OK' : 'MISMATCH'}`);
if (anchors.length !== Number(hA[1]) || handTyped.length !== Number(hA[2])) refuse(`the parse does not account for v2's own headline`);

// ===== LEG 3 (P1, R5) — the join key: declaration NAME, not the census id =======================
console.log(`\n== LEG 3 (P1/R5). The join key is the declaration NAME; the census id is a display field ==`);
const headRev = git('rev-parse', 'HEAD').trim();
console.log(`  HEAD: ${headRev.slice(0, 8)}`);
let idDiffers = 0, unresolved = 0;
for (const a of handTyped) {
  a.declName = a.id.includes('←') ? a.id.split('←')[1] : a.id;
  if (a.declName !== a.id) idDiffers++;
  const path = `scripts/${a.copier}`;
  a.path = path;
  const src = blob(headRev, path);
  if (src === null) { a.unresolved = 'declaring file absent at HEAD'; unresolved++; continue; }
  const d = literalDecls(src).get(a.declName);
  if (d === undefined) { a.unresolved = `no column-0 literal declaration named ${a.declName} at HEAD`; unresolved++; continue; }
  a.value = d.value;
  a.headLine = d.line;
  a.lineAgrees = a.line === d.line;
  a.headOcc = occ(src, d.value);
  a.headKeys = keysFor(src, a.declName, d.line);
}
console.log(`  census ids that are NOT the declaration name: ${idDiffers} — ` +
  `${handTyped.filter((a) => a.declName !== a.id).map((a) => `${a.id} → ${a.declName}`).join(', ') || '(none)'}`);
console.log(`  UNRESOLVED (R5 — never counted as a miss): ${unresolved}`);
for (const a of handTyped) if (a.unresolved) console.log(`    ${a.id}: ${a.unresolved}`);
const resolved = handTyped.filter((a) => !a.unresolved);
const lineDisagree = resolved.filter((a) => !a.lineAgrees);
console.log(`  declaration line from his extractor vs. v2's reported line: ${resolved.length - lineDisagree.length}/${resolved.length} agree`);
for (const a of lineDisagree) console.log(`    ${a.declName}: v2 @${a.line}, his extractor @${a.headLine}`);
if (lineDisagree.length) refuse(`the two readers disagree on a declaration line — the join is not sound`);

// ===== LEG 4 (P2) — the restricted key at HEAD: what it can see at all =========================
console.log(`\n== LEG 4 (P2). The restricted K-once key at HEAD — the ceiling on recall, before history ==`);
console.log(`  ${'anchor'.padEnd(18)} ${'file'.padEnd(16)} occ  K-used  K-once`);
for (const a of resolved) {
  console.log(`  ${a.declName.padEnd(18)} ${a.copier.slice(0, 16).padEnd(16)} ${String(a.headOcc).padStart(3)}  ` +
    `${String(a.headKeys.kUsed).padEnd(6)}  ${a.headKeys.kOnce}`);
}
const kOnceBlind = resolved.filter((a) => !a.headKeys.kOnce);
console.log(`  K-once CANNOT SEE ${kOnceBlind.length} of ${resolved.length}: ${kOnceBlind.map((a) => a.declName).join(', ') || '(none)'}`);
console.log(`  → ceiling on recall under the restricted key: ${resolved.length - kOnceBlind.length} of ${resolved.length}`);
const headFlagged = resolved.filter((a) => a.headOcc >= 2);
console.log(`  unrestricted screen at HEAD flags ${headFlagged.length} of ${resolved.length}: ${headFlagged.map((a) => a.declName).join(', ')}`);

// ===== LEG 5 (P3, P6, R6) — the join: the commit that typed each declaration ====================
console.log(`\n== LEG 5 (P3/P6/R6). The join — the commit that typed each standing declaration ==`);
const histCache = new Map();
const history = (path) => {
  if (!histCache.has(path)) {
    const out = git('log', '--format=%H %P', '--no-merges', '--reverse', '--', path).trim();
    histCache.set(path, out ? out.split('\n').filter(Boolean) : []);
  }
  return histCache.get(path);
};
// rename detection for the two declaring paths, so a short history is diagnosed not assumed
for (const path of new Set(resolved.map((a) => a.path))) {
  const ns = git('log', '--format=%H', '--name-status', '--follow', '--', path);
  const renames = ns.split('\n').filter((l) => /^R\d*\t/.test(l));
  console.log(`  ${path.replace(/^scripts\//, '').slice(0, 44)}… : ${history(path).length} non-merge commit(s) on the path; ` +
    `renames under --follow: ${renames.length}${renames.length ? ` (${renames.map((r) => r.split('\t').slice(1).join(' → ')).join('; ')})` : ''}`);
}
for (const a of resolved) {
  const revs = history(a.path);
  a.typingEvents = [];
  for (const line of revs) {
    const parts = line.split(' ');
    const h = parts[0], parents = parts.slice(1);
    if (parents.length === 0) continue;
    const p = parents[0];
    const baseSrc = blob(p, a.path);
    const candSrc = blob(h, a.path);
    if (candSrc === null) continue;
    const { out } = addedDecls(baseSrc, candSrc);
    const hit = out.find((d) => d.name === a.declName);
    if (!hit) continue;
    a.typingEvents.push({
      rev: h,
      created: baseSrc === null,
      value: hit.value,
      line: hit.line,
      occ: occ(candSrc, hit.value),
      keys: keysFor(candSrc, a.declName, hit.line),
      sameValueAsHead: hit.value === a.value,
    });
  }
  const withHeadValue = a.typingEvents.filter((e) => e.sameValueAsHead);
  a.typing = withHeadValue.length ? withHeadValue[withHeadValue.length - 1] : null;
  if (!a.typing) a.unread = a.typingEvents.length
    ? `typed ${a.typingEvents.length} time(s) but never with its HEAD value`
    : `no typing commit found on ${a.path}`;
}
const unread = resolved.filter((a) => a.unread);
console.log(`  UNREAD (R6 — excluded from numerator AND denominator): ${unread.length}`);
for (const a of unread) console.log(`    ${a.declName}: ${a.unread}`);
const graded = resolved.filter((a) => !a.unread);
const typingRevs = new Set(graded.map((a) => a.typing.rev));
const atBirth = graded.filter((a) => a.typing.created);
console.log(`  distinct typing commits across ${graded.length} anchor(s): ${typingRevs.size} — ${[...typingRevs].map((r) => r.slice(0, 8)).join(', ')}`);
console.log(`  typed at their declaring file's CREATING commit: ${atBirth.length} of ${graded.length}`);
const multiTyped = graded.filter((a) => a.typingEvents.length > 1);
console.log(`  value changed since first typing (P6): ${multiTyped.length} of ${graded.length}` +
  `${multiTyped.length ? ` — ${multiTyped.map((a) => `${a.declName} (${a.typingEvents.length} typings)`).join(', ')}` : ''}`);

// ===== LEG 6 (P4) — THE RECALL FIGURE, as a member list ========================================
console.log(`\n== LEG 6 (P4). THE RECALL FIGURE — at the commit that typed each, member by member ==`);
console.log(`  ${'anchor'.padEnd(18)} ${'typing rev'.padEnd(10)} birth  occ  K-once  unrestricted  RESTRICTED`);
for (const a of graded) {
  const t = a.typing;
  a.flagUnrestricted = t.occ >= 2;
  a.flagRestricted = t.occ >= 2 && t.keys.kOnce;
  console.log(`  ${a.declName.padEnd(18)} ${t.rev.slice(0, 8).padEnd(10)} ${String(t.created).padEnd(6)} ${String(t.occ).padStart(3)}  ` +
    `${String(t.keys.kOnce).padEnd(6)}  ${String(a.flagUnrestricted).padEnd(12)}  ${a.flagRestricted}`);
}
const recallU = graded.filter((a) => a.flagUnrestricted);
const recallR = graded.filter((a) => a.flagRestricted);
console.log(`\n  RECALL, unrestricted screen: ${recallU.length} of ${graded.length} — ${recallU.map((a) => a.declName).join(', ')}`);
console.log(`  RECALL, restricted K-once:   ${recallR.length} of ${graded.length} — ${recallR.map((a) => a.declName).join(', ')}`);
const headSet = new Set(headFlagged.map((a) => a.declName));
const typSet = new Set(recallR.map((a) => a.declName));
const onlyHead = [...headSet].filter((n) => !typSet.has(n));
const onlyTyp = [...typSet].filter((n) => !headSet.has(n));
console.log(`  vs. the HEAD screen's ${headSet.size}, compared as MEMBER LISTS not counts:`);
console.log(`    in HEAD's set but not at typing: ${onlyHead.join(', ') || '(none)'}`);
console.log(`    at typing but not in HEAD's set: ${onlyTyp.join(', ') || '(none)'}`);
const missed = graded.filter((a) => !a.flagRestricted);
console.log(`  MISSED by the restricted key (${missed.length}), with the reason each was missed:`);
for (const a of missed) {
  const t = a.typing;
  const why = t.occ < 2 && !t.keys.kOnce ? 'occ=1 AND K-once blind'
    : t.occ < 2 ? `occ=${t.occ} (unique in its own file when typed)`
    : 'K-once blind (reaches once() through a parameter)';
  console.log(`    ${a.declName.padEnd(18)} ${why}`);
}

// ===== LEG 7 (P5) — his "7 in 375 / 3 in 377" does not join to this population =================
console.log(`\n== LEG 7 (P5). His §5 birth figures, measured here, then joined to this population ==`);
const birthRevOf = new Map();
for (const a of graded) if (a.typing.created) birthRevOf.set(a.path, a.typing.rev);
const myNames = new Set(resolved.map((a) => a.declName));
const memo = readFileSync(MEMO, 'utf8').split('\n');
for (const [path, rev] of birthRevOf) {
  const parentLine = git('log', '--format=%P', '-1', rev).trim().split(' ')[0];
  const candSrc = blob(rev, path);
  const baseSrc = parentLine ? blob(parentLine, path) : null;
  const { out } = addedDecls(baseSrc, candSrc);
  const flagged = out.filter((d) => occ(candSrc, d.value) >= 2);
  const restricted = flagged.filter((d) => keysFor(candSrc, d.name, d.line).kOnce);
  const short = path.replace(/^scripts\/probe-round(\d+).*/, '$1');
  console.log(`\n  ${path.replace(/^scripts\//, '').slice(0, 40)}… at its birth ${rev.slice(0, 8)}`);
  console.log(`    added literals ${out.length} · flagged (unrestricted) ${flagged.length} · flagged (K-once) ${restricted.length}`);
  console.log(`    K-once members: ${restricted.map((d) => `${d.name}@${d.line} occ=${occ(candSrc, d.value)}`).join(' · ')}`);
  const inPop = restricted.filter((d) => myNames.has(d.name));
  console.log(`    of those, IN this 11-anchor population: ${inPop.length} — ${inPop.map((d) => d.name).join(', ') || '(none)'}`);
  console.log(`    NOT census anchors: ${restricted.length - inPop.length} — ` +
    `${restricted.filter((d) => !myNames.has(d.name)).map((d) => d.name).join(', ') || '(none)'}`);
  // reproduce his memo's own list for this file, parsed out of the memo rather than typed here
  const li = memo.findIndex((l) => l.includes(`probe-round${short}`) && l.includes('AT BIRTH'));
  if (li < 0) { console.log(`    (his memo has no "AT BIRTH" line for round ${short} — nothing to reproduce)`); continue; }
  const names = new Set();
  for (const l of [memo[li], memo[li + 1] ?? '']) {
    if (l !== memo[li] && /AT BIRTH/.test(l)) continue;
    for (const m of l.matchAll(/\b[A-Z][A-Z0-9_]{2,}\b/g)) if (m[0] !== 'AT' && m[0] !== 'BIRTH') names.add(m[0]);
  }
  const hisNames = [...names];
  const mineNames = restricted.map((d) => d.name);
  const bothWays = [hisNames.filter((n) => !mineNames.includes(n)), mineNames.filter((n) => !hisNames.includes(n))];
  console.log(`    his memo's list (parsed from the memo, not typed): ${hisNames.join(', ')}`);
  console.log(`    reproduction: in his list only [${bothWays[0].join(', ')}] · in mine only [${bothWays[1].join(', ')}]`);
}

// ===== VERDICT ==================================================================================
console.log(`\n================ VERDICT ================`);
console.log(`POPULATION — ${handTyped.length} hand-typed anchors from v2; ${resolved.length} resolved, ${unread.length} UNREAD, ${graded.length} graded.`);
console.log(`CEILING    — the restricted K-once key cannot see ${kOnceBlind.length} of ${resolved.length} at HEAD (${kOnceBlind.map((a) => a.declName).join(', ') || 'none'}).`);
console.log(`DENOMINATOR— ${graded.length} anchors sit on ${typingRevs.size} distinct typing commit(s); ${atBirth.length} at a file birth. Not ${graded.length} independent trials.`);
console.log(`RECALL     — unrestricted ${recallU.length}/${graded.length}; RESTRICTED K-once ${recallR.length}/${graded.length}.`);
console.log(`R8 — this is NOT combined with his 14/262 precision figure: different keys, different denominators.`);
