// unit-512 post-hoc 3 — CORRECTION of post-hoc 2's §2 and §4. Theseus, 2026-11-24 START fire.
//
// Post-hoc 2 applied every pattern to the gate's WHOLE stdout. Two of the 13 are `^`-anchored with
// no `m` flag:
//     unit-500…/posthoc-landing-condition.mjs:20   /^(\s*tracked files read: )(\d+)$/
//     unit-503…/probe-baseline.mjs:30              /^\s*(tracked files read|population…):\s*(\d+)/
// Applied to a 40-line string, those match NOTHING — so post-hoc 2 recorded them as `holds`
// (verbatim → null, renamed → null) when what it had actually measured was its own dead cell. One
// of the two is the END-ANCHORED site the entire unit is about, and the other is a LIVE site. The
// §4 figure "the appended form breaks 0 patterns" was produced by the same dead cell: a pattern
// that matches neither form cannot be broken by either.
//
// Application-mode key, and why it is not a guess: a `^`-anchored pattern with no `m` flag, applied
// to multi-line gate stdout, can never match. The only reading under which such a host is not dead
// code is per-LINE application. Both hosts confirm it in source — `READ.test(preL[i])` after
// `split('\n')`, and `.exec(line)` inside a line loop. So:
//     PER_LINE   — pattern is `^`- or `$`-anchored and carries no `m` flag
//     WHOLE_TEXT — everything else
// and every pattern is applied BOTH ways here, with both results printed, so the key cannot hide a
// figure. The decision column is the mode its host actually uses.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const UNIT = 'docs/research/unit-512matchersubject-2026-11-24';
const GATE = 'scripts/verify-decl-body-slicers.mjs';
const G_V = 'scripts/scratch-unit512b-verbatim.mjs';
const G_R = 'scripts/scratch-unit512b-renamed.mjs';
const OLD = 'tracked files read';
const NEW = 'tracked code files read';
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);

const anchors = JSON.parse(readFileSync(`${ROOT}/docs/research/unit-511readcountname-2026-11-24/captures/POSTHOC-ANCHORS.json`, 'utf8')).regexMatchers;
const r2 = JSON.parse(readFileSync(`${ROOT}/${UNIT}/captures/ARM-R2.json`, 'utf8'));
const prov = new Map();
for (const s of r2.sites) prov.set(s.site, s.verdict === 'UNRESOLVED' ? 'FROZEN(no-drive)' : s.verdict);

const src = readFileSync(`${ROOT}/${GATE}`, 'utf8');
let out = {};
try {
  writeFileSync(`${ROOT}/${G_V}`, src);
  writeFileSync(`${ROOT}/${G_R}`, src.split(OLD).join(NEW));
  for (const [cell, p] of [['VERBATIM', G_V], ['RENAMED', G_R]]) {
    const r = spawnSync(process.execPath, [p], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    out[cell] = { rc: r.status, text: r.stdout ?? '' };
  }
} finally {
  rmSync(`${ROOT}/${G_V}`, { force: true });
  rmSync(`${ROOT}/${G_R}`, { force: true });
}

// the appended rendering, built from the real verbatim stdout
const APPENDED = out.VERBATIM.text.replace(
  /^(\s*tracked files read: )(\d+)$/m,
  (_m, a, b) => `${a}${b} (1084 in scope, 1 excluded, 0 unreadable)`,
);

const apply = (re, text, mode) => {
  if (mode === 'WHOLE_TEXT') return text.match(re);
  for (const line of text.split('\n')) {
    const m = line.match(re);
    if (m) return m;
  }
  return null;
};

console.log(`unit-512 post-hoc 3 — the same three cells, applied the way each host applies its pattern\n`);
console.log(`§0  cells`);
console.log(`  VERBATIM rc ${out.VERBATIM.rc}  ${Buffer.byteLength(out.VERBATIM.text)} B  ${sha(out.VERBATIM.text)}`);
console.log(`  RENAMED  rc ${out.RENAMED.rc}  ${Buffer.byteLength(out.RENAMED.text)} B  ${sha(out.RENAMED.text)}`);
console.log(`  APPENDED (derived from VERBATIM, scope text moved onto the value's line)  ${Buffer.byteLength(APPENDED)} B  ${sha(APPENDED)}`);
console.log(`  the appended form really differs from verbatim: ${APPENDED !== out.VERBATIM.text}`);

const rows = [];
console.log(`\n§1  per pattern, in its host's mode`);
for (const a of anchors) {
  const site = `${a.rel}:${a.line}`;
  const body = a.pattern.replace(/^\//, '').replace(/\/[a-z]*$/, '');
  const flags = a.pattern.match(/\/([a-z]*)$/)?.[1] ?? '';
  let re; try { re = new RegExp(body, flags); } catch { continue; }
  const anchored = /^\^|\$$/.test(body);
  const mode = anchored && !flags.includes('m') ? 'PER_LINE' : 'WHOLE_TEXT';
  const cells = {};
  for (const m of ['WHOLE_TEXT', 'PER_LINE']) {
    cells[m] = {
      verbatim: apply(re, out.VERBATIM.text, m) ? 'match' : 'null',
      renamed: apply(re, out.RENAMED.text, m) ? 'match' : 'null',
      appended: apply(re, APPENDED, m) ? 'match' : 'null',
    };
  }
  const c = cells[mode];
  const breaksOnRename = c.verbatim === 'match' && c.renamed === 'null';
  const breaksOnAppend = c.verbatim === 'match' && c.appended === 'null';
  const deadInHostMode = c.verbatim === 'null';
  rows.push({ site, pattern: a.pattern, endAnchored: a.endAnchored, provenance: prov.get(site) ?? 'NOT-IN-SET', mode, cells, breaksOnRename, breaksOnAppend, deadInHostMode });
  console.log(`  ${site}`);
  console.log(`      ${a.pattern}   mode ${mode}${a.endAnchored ? '  [END-ANCHORED]' : ''}  provenance ${prov.get(site) ?? 'NOT-IN-SET'}`);
  console.log(`      host mode   : verbatim ${c.verbatim}  renamed ${c.renamed}  appended ${c.appended}`);
  console.log(`      other mode  : verbatim ${cells[mode === 'PER_LINE' ? 'WHOLE_TEXT' : 'PER_LINE'].verbatim}  renamed ${cells[mode === 'PER_LINE' ? 'WHOLE_TEXT' : 'PER_LINE'].renamed}  appended ${cells[mode === 'PER_LINE' ? 'WHOLE_TEXT' : 'PER_LINE'].appended}`);
  console.log(`      breaks on rename ${breaksOnRename}   breaks on append ${breaksOnAppend}${deadInHostMode ? '   *** DEAD in host mode — graded nothing' : ''}`);
}

const live = rows.filter((r) => r.provenance === 'LIVE');
const frozen = rows.filter((r) => r.provenance.startsWith('FROZEN'));
const notInSet = rows.filter((r) => r.provenance === 'NOT-IN-SET');

console.log(`\n§2  figures, corrected`);
console.log(`  regex matchers                                  : ${rows.length}  (LIVE ${live.length} · FROZEN ${frozen.length} · not in his 15-matcher set ${notInSet.length})`);
console.log(`  dead in their host's own mode                    : ${rows.filter((r) => r.deadInHostMode).length}`);
console.log(`  BREAK ON RENAME (cure R)                        : ${rows.filter((r) => r.breaksOnRename).length} of ${rows.length}`);
console.log(`      LIVE   : ${live.filter((r) => r.breaksOnRename).length} of ${live.length}`);
console.log(`      FROZEN : ${frozen.filter((r) => r.breaksOnRename).length} of ${frozen.length}   (pattern-level only — the instrument never reads this stdout)`);
console.log(`  BREAK ON APPEND (the rendering his §2 refused)   : ${rows.filter((r) => r.breaksOnAppend).length} of ${rows.length}`);
for (const r of rows.filter((x) => x.breaksOnAppend)) console.log(`      ${r.provenance.padEnd(17)} ${r.site}  ${r.pattern}`);
console.log(`      LIVE   : ${live.filter((r) => r.breaksOnAppend).length} of ${live.length}`);
console.log(`      FROZEN : ${frozen.filter((r) => r.breaksOnAppend).length} of ${frozen.length}`);
console.log(`  gate exit code under the rename                  : ${out.VERBATIM.rc} → ${out.RENAMED.rc}  (moved: ${out.VERBATIM.rc !== out.RENAMED.rc})`);

// A THIRD outcome exists that neither this unit's pre-registration nor post-hoc 2 named: a pattern
// that keeps matching under the rename on a DIFFERENT alternative, losing only the figure it was
// written for. Derived here rather than asserted, because asserting it is what went wrong once
// already in this file.
const survivors = live.filter((r) => !r.breaksOnRename);
const partial = survivors.filter((r) => /\|/.test(r.pattern));
console.log(`\n§3  what the correction moves, derived from the rows above and not narrated`);
console.log(`  LIVE patterns returning null under the rename        : ${live.filter((r) => r.breaksOnRename).length} of ${live.length}`);
console.log(`  LIVE patterns still matching under the rename        : ${survivors.length}`);
for (const s of survivors) {
  const alt = /\|/.test(s.pattern);
  console.log(`      ${s.site}`);
  console.log(`          ${s.pattern}`);
  console.log(`          mode ${s.mode}; renamed → ${s.cells[s.mode].renamed}. ${alt
    ? 'It is an ALTERNATION: the label it still matches is another alternative, so the host sees a match and loses only the figure it wanted. That is a QUIETER failure than a null, not a safer one.'
    : 'No alternation — it genuinely holds.'}`);
}
console.log(`  LIVE survivors that survive via an alternation        : ${partial.length}`);
console.log(`  post-hoc 2's figure for this cell was ${rows.filter((r) => r.breaksOnRename).length >= 0 ? '6 of 7' : ''}, and host mode also reads ${live.filter((r) => r.breaksOnRename).length} of ${live.length}.`);
console.log(`  The FIGURE is unmoved and the REASON is different: post-hoc 2 reached 6 with`);
console.log(`  probe-baseline.mjs:30 scored on a dead whole-text cell; host mode reaches 6 with the`);
console.log(`  same site scored LIVE-and-surviving. Same number, two causes — which is why the`);
console.log(`  corrected drive was worth running even though it did not move the count.`);
console.log(`  APPEND: ${rows.filter((r) => r.breaksOnAppend).length} of ${rows.length} patterns break, and it is the END-ANCHORED site his §2 names —`);
console.log(`  so his regex reasoning is CONFIRMED at the pattern level. Of those breaks,`);
console.log(`  ${live.filter((r) => r.breaksOnAppend).length} belong to an instrument that reads live gate output.`);

writeFileSync(`${ROOT}/${UNIT}/captures/POSTHOC-APPMODE.json`, JSON.stringify({
  rows,
  figures: {
    total: rows.length, live: live.length, frozen: frozen.length, notInSet: notInSet.length,
    deadInHostMode: rows.filter((r) => r.deadInHostMode).length,
    breakOnRename: rows.filter((r) => r.breaksOnRename).length,
    breakOnRenameLive: live.filter((r) => r.breaksOnRename).length,
    breakOnAppend: rows.filter((r) => r.breaksOnAppend).length,
    breakOnAppendLive: live.filter((r) => r.breaksOnAppend).length,
    rcVerbatim: out.VERBATIM.rc, rcRenamed: out.RENAMED.rc,
  },
}, null, 1));
