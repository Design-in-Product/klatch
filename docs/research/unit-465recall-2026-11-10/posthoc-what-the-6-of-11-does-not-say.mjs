#!/usr/bin/env node
/**
 * unit-465recall — POST-HOC, written after reading `recall-run-1.txt`. Not pre-registered, and
 * labelled that way in the unit. `recall-at-typing-commit.mjs` / `recall-run-1.txt` are NOT edited;
 * they stay a matched source/capture pair.
 *
 * Run 1 lands "RECALL, restricted K-once: 6 of 11" and "RECALL, unrestricted: 6 of 11". Three things
 * about that pair of figures are not in it, and two of them weaken it:
 *
 *  (a) THE TWO KEYS AGREE VACUOUSLY ON THIS NUMERATOR. The restriction only differs on `SB374` /
 *      `SB375`, and both are `occ=1` — so they are already 0 under the shared `occ >= 2` conjunct.
 *      This population cannot grade the K-once restriction at all: the restriction's cost here is
 *      0 for a reason that has nothing to do with the restriction being right.
 *
 *  (b) THE 5 MISSES ARE NOT 5 MISSED HAZARDS. The screen asks about the DECLARING file. The hazard
 *      is non-uniqueness in the TARGET. So the miss set has to be cross-tabbed against which
 *      anchors actually collide anywhere, and at the anchor granularity rather than the cell one.
 *
 *  (c) HIS 14/262 PRECISION NUMERATOR IS NOT 14 INDEPENDENT CATCHES. Run 1 shows 10 of the 14
 *      K-once flags are on created files, and both copier births are created files. This leg counts
 *      the distinct commits behind all 14.
 *
 * Same discipline as run 1: his extractor and key are a verbatim SLICE, markers asserted unique.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const V2 = join(REPO, 'docs', 'research', 'unit-465census-v2-2026-11-10', 'census-anchors-v2.mjs');
const PLANT = join(REPO, 'docs', 'research', 'unit-465plant-2026-11-10', 'posthoc-v2-repaired-population.mjs');
const refuse = (why) => { console.log(`\nREFUSED — ${why}`); process.exit(2); };
if (!existsSync(join(REPO, 'scripts', 'sweep-probes.mjs'))) refuse('repo root not found');
if (!existsSync(V2) || !existsSync(PLANT)) refuse('v2 or his post-hoc instrument not found');

const plantSrc = readFileSync(PLANT, 'utf8');
const START = 'const occ = (hay, needle)';
const END = '  return { kOnce, kUsed };\n}';
for (const [l, m] of [['start', START], ['end', END]]) if (plantSrc.split(m).length - 1 !== 1) refuse(`slice ${l} marker not unique`);
const sliced = plantSrc.slice(plantSrc.indexOf(START), plantSrc.indexOf(END) + END.length);
const WANT = ['occ', 'git', 'blob', 'literalDecls', 'keysFor'];
// eslint-disable-next-line no-new-func
const lib = new Function('REPO', 'execFileSync', `${sliced}\n; return { ${WANT.join(', ')} };`)(REPO, execFileSync);
for (const k of WANT) if (typeof lib[k] !== 'function') refuse(`sliced binding "${k}" missing`);
const { occ, git, blob, literalDecls, keysFor } = lib;
const addedDecls = (baseSrc, candSrc) => {
  const base = baseSrc === null ? new Map() : literalDecls(baseSrc);
  const out = [];
  for (const [name, cd] of literalDecls(candSrc)) {
    const bd = base.get(name);
    if (bd !== undefined && bd.value === cd.value) continue;
    out.push({ name, ...cd });
  }
  return out;
};

console.log('unit-465recall — POST-HOC: what "6 of 11" does not say');
console.log(`slice OK: ${sliced.split('\n').length} lines of his extractor and key, markers unique`);

// ---- the census, fresh, with its cells ---------------------------------------------------------
const v2run = spawnSync(process.execPath, [V2], { encoding: 'utf8', cwd: REPO });
if (v2run.status !== 0) refuse(`v2 exited ${v2run.status}`);
const vl = v2run.stdout.split('\n');
const copierFull = [];
for (const l of vl) { const m = /^ {2}(\S+\.mts) {2}\(throw at :(\d+)\)$/.exec(l); if (m) copierFull.push(m[1]); }
const expand = (p) => { const h = copierFull.filter((f) => f.startsWith(p)); if (h.length !== 1) refuse(`prefix ${p} → ${h.length}`); return h[0]; };
const anchors = [];
for (const l of vl) {
  const m = /^ {2}(\S+)… (\S+) @(\d+|-) \[(hand-typed|derived|UNREAD)\]/.exec(l);
  if (m) anchors.push({ id: m[2], declName: m[2].includes('←') ? m[2].split('←')[1] : m[2], copier: expand(m[1]), kind: m[4] });
}
const cells = [];
let cur = null;
for (const l of vl) {
  const h = /^ {2}anchor (\S+) \((\S+)…:(\d+)\)$/.exec(l);
  if (h) { cur = /— DERIVED|— UNREAD/.test(l) ? null : h[1]; continue; }
  if (/^ {2}anchor /.test(l)) { cur = null; continue; }
  const c = /^ {4} *(-?\d+) {2}(\S+)/.exec(l);
  if (c && cur) cells.push({ id: cur, file: c[2], n: Number(c[1]) });
  if (/^== /.test(l)) cur = null;
}
const hC = /cells counted: (\d+) — (\d+) at >1/.exec(vl.find((l) => /^cells counted: /.test(l)) ?? '');
if (!hC) refuse('could not read v2 cell headline');
if (cells.length !== Number(hC[1]) || cells.filter((c) => c.n > 1).length !== Number(hC[2])) {
  refuse(`cell parse ${cells.length}/${cells.filter((c) => c.n > 1).length} vs headline ${hC[1]}/${hC[2]}`);
}
console.log(`census parse calibrated against v2's own headline: ${cells.length} cells, ${hC[2]} collisions — OK`);
const handTyped = anchors.filter((a) => a.kind === 'hand-typed');

// ---- re-derive the flagged-at-typing set (same method as run 1, same slice) --------------------
const headRev = git('rev-parse', 'HEAD').trim();
for (const a of handTyped) {
  a.path = `scripts/${a.copier}`;
  const headSrc = blob(headRev, a.path);
  a.value = literalDecls(headSrc).get(a.declName)?.value;
  if (a.value === undefined) refuse(`${a.declName} has no literal declaration at HEAD`);
  let typing = null;
  for (const line of git('log', '--format=%H %P', '--no-merges', '--reverse', '--', a.path).trim().split('\n').filter(Boolean)) {
    const [h, ...ps] = line.split(' ');
    if (!ps.length) continue;
    const candSrc = blob(h, a.path);
    if (candSrc === null) continue;
    const hit = addedDecls(blob(ps[0], a.path), candSrc).find((d) => d.name === a.declName);
    if (!hit || hit.value !== a.value) continue;
    typing = { rev: h, occ: occ(candSrc, hit.value), keys: keysFor(candSrc, a.declName, hit.line) };
  }
  if (!typing) refuse(`${a.declName}: no typing commit (run 1 found one — the two readers disagree)`);
  a.flagU = typing.occ >= 2;
  a.flagR = typing.occ >= 2 && typing.keys.kOnce;
  a.kOnce = typing.keys.kOnce;
}

// ---- (a) the declared vacuity -----------------------------------------------------------------
console.log(`\n== (a) Can this population grade the K-once restriction? ==`);
const differ = handTyped.filter((a) => a.flagU !== a.flagR);
const keyDiffers = handTyped.filter((a) => !a.kOnce);
console.log(`  anchors where the two keys' VERDICTS differ: ${differ.length} — ${differ.map((a) => a.declName).join(', ') || '(none)'}`);
console.log(`  anchors where the KEY itself differs (K-once false): ${keyDiffers.length} — ${keyDiffers.map((a) => a.declName).join(', ')}`);
for (const a of keyDiffers) console.log(`    ${a.declName}: K-once false, but occ>=2 is ${a.flagU} — so the restriction is masked by the shared conjunct`);
console.log(`  VERDICT (a): ${differ.length === 0
  ? 'NO. The restriction changes no verdict here, and it changes none for a reason unrelated to its merit: every member the key differs on is already 0 under occ>=2. Reporting "restricted recall 6 of 11" as evidence FOR the restriction would be a vacuous agreement.'
  : 'the restriction is gradeable on this population — see the differing members above'}`);

// ---- (b) the cross-tab: declaring-file flag vs. where the anchor actually collides -------------
console.log(`\n== (b) The 5 misses, cross-tabbed against where each anchor actually collides ==`);
for (const a of handTyped) {
  const mine = cells.filter((c) => c.id === a.id);
  a.ownCell = mine.find((c) => c.file === a.copier)?.n ?? null;
  a.externalColl = mine.filter((c) => c.file !== a.copier && c.n > 1);
}
console.log(`  ${'anchor'.padEnd(18)} own-file occ  collisions in OTHER files  flagged at typing`);
for (const a of handTyped) {
  console.log(`  ${a.declName.padEnd(18)} ${String(a.ownCell).padStart(11)}  ` +
    `${String(a.externalColl.length).padStart(24)}  ${a.flagR}`);
}
const tab = { yy: [], yn: [], ny: [], nn: [] };
for (const a of handTyped) {
  const k = (a.externalColl.length > 0 ? 'y' : 'n') + (a.flagR ? 'y' : 'n');
  tab[k].push(a.declName);
}
console.log(`\n  2x2 — rows: has a collision in a file OTHER than its declaring file · cols: flagged at typing`);
console.log(`              flagged      not flagged`);
console.log(`  external      ${String(tab.yy.length).padEnd(11)}  ${tab.yn.length}`);
console.log(`  none          ${String(tab.ny.length).padEnd(11)}  ${tab.nn.length}`);
console.log(`    external+flagged     : ${tab.yy.join(', ') || '(none)'}`);
console.log(`    external+MISSED      : ${tab.yn.join(', ') || '(none)'}`);
console.log(`    no-external+flagged  : ${tab.ny.join(', ') || '(none)'}`);
console.log(`    no-external+missed   : ${tab.nn.join(', ') || '(none)'}`);
const margin = tab.yy.length + tab.yn.length;
console.log(`  The empty cell is "external collision, missed" = ${tab.yn.length}. Its row margin is ${margin}.`);
console.log(`  So that zero rests on ${margin} observation(s) — it is a FORCED empty, not a demonstrated property.`);
const collAnchors = handTyped.filter((a) => cells.some((c) => c.id === a.id && c.n > 1));
const collFlagged = collAnchors.filter((a) => a.flagR);
console.log(`  At ANCHOR granularity: ${collFlagged.length} of ${collAnchors.length} anchors with ANY collision cell are flagged.`);
console.log(`  At CELL granularity, the same screen has one row per anchor and the census has one per cell:`);
const collCells = cells.filter((c) => c.n > 1);
const cellsOnOwn = collCells.filter((c) => handTyped.find((a) => a.id === c.id)?.copier === c.file);
console.log(`    ${collCells.length} collision cells · ${cellsOnOwn.length} on the anchor's own declaring file · ${collCells.length - cellsOnOwn.length} not.`);
console.log(`  R8: ${collFlagged.length}/${collAnchors.length}, ${cellsOnOwn.length}/${collCells.length} and 6/11 are THREE different figures over three denominators. Not fused.`);

// ---- (c) the concentration behind his 14 ------------------------------------------------------
console.log(`\n== (c) His 14 K-once flags: how many distinct commits are behind them? ==`);
const log = git('log', '--format=%H %P', '--no-merges', '--', 'scripts/').trim().split('\n').filter(Boolean);
const kOnceFlags = [];
for (const line of log) {
  const [h, ...ps] = line.split(' ');
  if (!ps.length) continue;
  let touched;
  try { touched = git('diff', '--name-only', ps[0], h, '--', 'scripts/').split('\n').map((s) => s.trim()).filter(Boolean); } catch { continue; }
  for (const f of touched) {
    const candSrc = blob(h, f);
    if (candSrc === null) continue;
    const baseSrc = blob(ps[0], f);
    for (const d of addedDecls(baseSrc, candSrc)) {
      const n = occ(candSrc, d.value);
      if (n < 2) continue;
      if (!keysFor(candSrc, d.name, d.line).kOnce) continue;
      kOnceFlags.push({ rev: h.slice(0, 8), file: f.replace(/^scripts\//, ''), name: d.name, occ: n, created: baseSrc === null });
    }
  }
}
const byRev = new Map();
for (const f of kOnceFlags) byRev.set(f.rev, (byRev.get(f.rev) ?? 0) + 1);
console.log(`  K-once flags re-derived here: ${kOnceFlags.length} (run 1 graded this count against his own run: 14)`);
console.log(`  distinct commits behind them: ${byRev.size}`);
for (const [rev, n] of [...byRev].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${rev}  ${String(n).padStart(2)} flag(s)  ${kOnceFlags.filter((f) => f.rev === rev)[0].created ? '[NEW FILE] ' : ''}${kOnceFlags.filter((f) => f.rev === rev).map((f) => f.name).join(', ')}`);
}
const top = [...byRev.values()].sort((a, b) => b - a);
console.log(`  the largest single commit contributes ${top[0]} of ${kOnceFlags.length}; the top two contribute ${(top[0] ?? 0) + (top[1] ?? 0)}.`);

console.log(`\n================ POST-HOC VERDICT ================`);
console.log(`(a) This population CANNOT grade the K-once restriction: ${differ.length} verdict difference(s) over ${keyDiffers.length} key difference(s), all masked by occ>=2.`);
console.log(`(b) The 5 misses include ${tab.nn.length} anchor(s) with no collision cell anywhere. "external collision & missed" is ${tab.yn.length} on a row margin of ${margin} — forced, not demonstrated.`);
console.log(`(c) His ${kOnceFlags.length} K-once flags come from ${byRev.size} commit(s); the top two account for ${(top[0] ?? 0) + (top[1] ?? 0)}.`);
