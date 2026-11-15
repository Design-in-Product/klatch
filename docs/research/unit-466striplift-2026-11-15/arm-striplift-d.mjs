/**
 * unit-466striplift — arm D
 *
 * Subject: **arm B's `Q5`**, which LANDED and is vacuous for the claim it was written to support.
 * It keyed on "a published JSON array with a duplicate entry" when the hazard is "a duplicate
 * caused by stripping"; none of its 12 printed samples is a basename collision. See
 * PRE-REGISTRATION-D.md.
 *
 * `K-dup` requires the repeated entry to be **filename-shaped**. A hit is then a published member
 * list in which two distinct corpus members are indistinguishable — the `LOSSY_BASENAME` hazard
 * realised in a committed artefact, rather than bounded in principle by arm A's `P5` (853 of 3254
 * corpus files = 26.2% share a basename).
 *
 * If `S1` refuses, that is the stronger result and it is the one published: the hazard would be
 * structural but never yet realised in a published list.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename, extname } from 'node:path';
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

const FILENAME = /^[\w.@+-]+\.(mjs|mts|ts|js|md|out|err|json|db|sh|txt)$/;

// ─────────────────────────────────────────── S2 — the key rejects the three vacuous shapes

const SAMPLES = [
  ['""', ''],
  ['false->false', 'false->false'],
  ['true->true', 'true->true'],
  ['round435-instruments', 'round435-instruments'],
];
const KPS = [['arm-p12site-b.mjs', true], ['RESULTS.md', true], ['drive2.armb.out', true]];
const rejects = SAMPLES.map(([label, v]) => ({ label, ok: !FILENAME.test(v) }));
const admits = KPS.map(([v, want]) => ({ v, ok: FILENAME.test(v) === want }));
console.log(`── S2: K-dup against the shapes that made Q5 vacuous, and against known positives ──`);
for (const r of rejects) console.log(`  reject ${r.ok ? 'ok ' : 'RED'} ${r.label}`);
for (const a of admits) console.log(`  admit  ${a.ok ? 'ok ' : 'RED'} ${a.v}`);
pred('S2', rejects.every((r) => r.ok) && admits.every((a) => a.ok),
  `K-dup rejects all ${rejects.length} vacuous shapes and admits all ${admits.length} known ` +
  `positives, asserted against the literals rather than inspected: ` +
  `rejects=${rejects.filter((r) => r.ok).length}/${rejects.length} ` +
  `admits=${admits.filter((a) => a.ok).length}/${admits.length}`);

// ─────────────────────────────────────────── the scan

const treeFiles = git('ls-tree', '-r', '--name-only', PIN, '--', 'docs/research')
  .split('\n').map((s) => s.trim()).filter(Boolean);
const recFiles = treeFiles.filter((p) => /\.out$/.test(p));
leg('D0', recFiles.length > 0,
  `recordings scanned (*.out at ${PIN_SHORT}): ${recFiles.length}`);

const anyDup = [];
const kdup = [];
for (const p of recFiles) {
  const lines = git('show', `${PIN}:${p}`).split('\n');
  lines.forEach((l, i) => {
    for (const m of l.matchAll(/\[(?:"[^"]*"(?:\s*,\s*)?){2,}\]/g)) {
      let arr;
      try { arr = JSON.parse(m[0]); } catch { continue; }
      const seen = new Set(), rep = new Set();
      for (const e of arr) { if (seen.has(e)) rep.add(e); seen.add(e); }
      if (!rep.size) continue;
      anyDup.push({ p, line: i + 1, rep: [...rep] });
      const fn = [...rep].filter((e) => FILENAME.test(e));
      if (fn.length) kdup.push({ p, line: i + 1, n: arr.length, fn, text: l.trim() });
    }
  });
}

// Arm B's figure, captured from its FROZEN recording rather than re-typed.
const bFig = git('show', `${B_REC_REV}:${B_REC}`).match(/principle: (\d+) array\(s\)/);
leg('D1', !!bFig,
  `arm B's Q5 figure captured out of its frozen recording at ${B_REC_REV}: ` +
  `${bFig ? bFig[1] : 'UNPARSEABLE'} array(s). This arm re-derives the same unsharpened count ` +
  `(${anyDup.length}) as a gate on the scan, not as a finding.`);
leg('D2', bFig && Number(bFig[1]) === anyDup.length,
  `the unsharpened scan reproduces arm B exactly: ${anyDup.length} vs ${bFig ? bFig[1] : '?'} — so ` +
  `any difference below is the KEY, not the scan: ${bFig && Number(bFig[1]) === anyDup.length}`);

console.log(`\n── S1: published arrays with a FILENAME-SHAPED duplicate entry ──`);
for (const d of kdup.slice(0, 20)) {
  console.log(`  ${d.p.replace('docs/research/', '')}:${d.line}  len=${d.n}  repeated=${JSON.stringify(d.fn)}`);
  console.log(`      ${d.text.slice(0, 165)}`);
}
if (kdup.length === 0) console.log('  (none)');

pred('S1', kdup.length >= 1,
  `at least one committed recording publishes a filename-shaped duplicate — the LOSSY_BASENAME ` +
  `hazard realised in an artefact: ${kdup.length} array(s) across ` +
  `${new Set(kdup.map((d) => d.p)).size} recording(s) of ${recFiles.length} scanned`);

pred('S3', kdup.length < anyDup.length,
  `K-dup shrinks the population it sharpens: ${kdup.length} < ${anyDup.length} ` +
  `(${anyDup.length === 0 ? 'n/a' : `${(((anyDup.length - kdup.length) / anyDup.length) * 100).toFixed(1)}% of Q5's hits were not basename collisions`})`);

// ─────────────────────────────────────────── declared limits, reach measured

const byBase = new Map();
for (const p of treeFiles) {
  const b = basename(p);
  if (!byBase.has(b)) byBase.set(b, []);
  byBase.get(b).push(p);
}
const colliding = [...byBase.entries()].filter(([, v]) => v.length > 1);
const collidingFiles = colliding.reduce((a, [, v]) => a + v.length, 0);
const outsideKey = colliding.filter(([b]) => !FILENAME.test(b));
const outsideCount = outsideKey.reduce((a, [, v]) => a + v.length, 0);
leg('D-lim1', true,
  `DECLARED LIMIT 1, reach MEASURED — K-dup is extension-keyed. Of the ${collidingFiles} ` +
  `basename-colliding corpus files (arm A's P5), ${outsideCount} = ` +
  `${((outsideCount / collidingFiles) * 100).toFixed(1)}% have a basename K-dup would not recognise ` +
  `as filename-shaped: ${JSON.stringify(outsideKey.slice(0, 8).map(([b, v]) => `${b} ×${v.length}`))}`);

console.log(`\n── D-lim2: per hit, can the recording's own line distinguish the two members? ──`);
for (const d of kdup.slice(0, 12)) {
  const ctx = d.text;
  const hasPath = /docs\/research\/|round\d+-instruments|unit-46/.test(ctx.replace(/\[[^\]]*\]/g, ''));
  console.log(`  ${d.p.replace('docs/research/', '')}:${d.line} → any dir context outside the array: ${hasPath}`);
}
leg('D-lim2', true,
  `DECLARED LIMIT 2 — a K-dup hit shows two ENTRIES are indistinguishable; it does not prove the ` +
  `underlying paths differed. Printed per hit above (${Math.min(kdup.length, 12)} of ${kdup.length} ` +
  `shown), not asserted in aggregate.`);

leg('D-lim3', true,
  `DECLARED LIMIT 3, named a SECOND time rather than left implied — the scan is JSON-array-keyed, ` +
  `inherited from Q5 and STILL NOT CURED. A member list published as a ' | '- or ', '-joined bare ` +
  `string is invisible to every arm in this unit. BOARDED, not measured.`);

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('D-gate', gate === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(gate)}`);

console.log(
  `VERDICT/0 ${red.length === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} ` +
  `prefused=${JSON.stringify(prefused)}`);
process.exit(red.length === 0 ? 0 : 1);
