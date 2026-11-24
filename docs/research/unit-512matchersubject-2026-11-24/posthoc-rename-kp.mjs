// unit-512 post-hoc 2 — the known positive and its control. Theseus, 2026-11-24 START fire.
//
// P7 asks whether cure R's breakage is SILENT on a member: does a LIVE instrument's extraction go
// to null while the gate's exit code does not move? Neither seat has shown that on a member; both
// have asserted it from the shape of a regex. This drives it.
//
// Construction:
//   - Two scratch copies of the gate, both written from the LIVE source read at run time:
//       G_VERBATIM — byte-identical to `scripts/verify-decl-body-slicers.mjs`
//       G_RENAMED  — the same bytes with the published label `tracked files read` replaced by
//                    `tracked code files read` at EVERY emission site, and nowhere else.
//     Both land in `scripts/` so the gate's one local import (`./lib/strip-source.mjs`) resolves,
//     and both are removed in a `finally`. They are never `git add`ed: an untracked file is
//     invisible to `git ls-files`, so neither copy joins the population it measures.
//   - The patterns are NOT retyped. They are sliced out of Daedalus's own
//     `POSTHOC-ANCHORS.json` → `.regexMatchers[].pattern`, which is the same artefact his §2
//     figures came from, and each is paired with this unit's LIVE/FROZEN verdict for its file.
//   - Each pattern is applied to each gate's real stdout. A pattern that captured a number under
//     the verbatim gate and captures nothing under the renamed one is the breakage; the exit code
//     of the two drives beside it is what makes the breakage silent or loud.
//
// The FROZEN control (P8) is byte-identity of a frozen instrument's own output across the two
// drives. It is trivially green BY CONSTRUCTION — a frozen instrument reads committed captures and
// never sees either copy — and that is stated rather than scored as evidence, because a control
// that cannot fail grades nothing. It is driven anyway, because "trivially green" is a claim about
// the code, and the code is what gets driven.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const UNIT = 'docs/research/unit-512matchersubject-2026-11-24';
const GATE = 'scripts/verify-decl-body-slicers.mjs';
const G_VERBATIM = 'scripts/scratch-unit512-verbatim.mjs';
const G_RENAMED = 'scripts/scratch-unit512-renamed.mjs';
const OLD = 'tracked files read';
const NEW = 'tracked code files read';

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);
const src = readFileSync(`${ROOT}/${GATE}`, 'utf8');

const anchors = JSON.parse(readFileSync(`${ROOT}/docs/research/unit-511readcountname-2026-11-24/captures/POSTHOC-ANCHORS.json`, 'utf8')).regexMatchers;
const r2 = JSON.parse(readFileSync(`${ROOT}/${UNIT}/captures/ARM-R2.json`, 'utf8'));
const resolve2 = JSON.parse(readFileSync(`${ROOT}/${UNIT}/captures/POSTHOC-RESOLVE.json`, 'utf8'));
// final provenance: r2's verdict, with the sites r2 left UNRESOLVED closed by post-hoc 1's
// no-drive condition (a file with zero spawn/exec cannot obtain live gate output)
const prov = new Map();
for (const s of r2.sites) prov.set(s.site, s.verdict === 'UNRESOLVED' ? 'FROZEN(no-drive)' : s.verdict);

// how many emission sites does the rename touch, and is the replacement confined to them?
const occurrences = src.split(OLD).length - 1;
const renamedSrc = src.split(OLD).join(NEW);
console.log(`unit-512 post-hoc 2 — cure R driven on a member, and its silence measured\n`);
console.log(`§0  the two gate copies`);
console.log(`  live gate        ${GATE}  ${Buffer.byteLength(src)} bytes  sha ${sha(src)}`);
console.log(`  occurrences of ${JSON.stringify(OLD)} in the gate source: ${occurrences}`);
console.log(`  renamed copy     ${Buffer.byteLength(renamedSrc)} bytes  sha ${sha(renamedSrc)}`);
console.log(`  the two copies differ ONLY by that substitution: ${renamedSrc.split(NEW).join(OLD) === src}`);

let rows = [];
let drives = {};
try {
  writeFileSync(`${ROOT}/${G_VERBATIM}`, src);
  writeFileSync(`${ROOT}/${G_RENAMED}`, renamedSrc);

  for (const [cell, path] of [['VERBATIM', G_VERBATIM], ['RENAMED', G_RENAMED]]) {
    const r = spawnSync(process.execPath, [path], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    drives[cell] = {
      rc: r.status,
      stdoutBytes: Buffer.byteLength(r.stdout ?? ''),
      stderrBytes: Buffer.byteLength(r.stderr ?? ''),
      stdoutSha: sha(r.stdout ?? ''),
      out: r.stdout ?? '',
      verdictLine: (r.stdout ?? '').split('\n').find((l) => /DECL-BODY SLICERS/.test(l))?.trim() ?? null,
    };
  }

  console.log(`\n§1  the two drives — this is where "silently" is decided`);
  for (const cell of ['VERBATIM', 'RENAMED']) {
    const d = drives[cell];
    console.log(`  ${cell.padEnd(9)} rc ${d.rc}   stdout ${d.stdoutBytes} B (${d.stdoutSha})   stderr ${d.stderrBytes} B`);
    console.log(`            verdict line: ${JSON.stringify(d.verdictLine)}`);
  }
  console.log(`  exit codes equal: ${drives.VERBATIM.rc === drives.RENAMED.rc}`);
  console.log(`  stderr equal    : ${drives.VERBATIM.stderrBytes === drives.RENAMED.stderrBytes}`);
  console.log(`  verdict equal   : ${drives.VERBATIM.verdictLine === drives.RENAMED.verdictLine}`);

  console.log(`\n§2  every regex matcher in his census, applied to both drives' real stdout`);
  console.log(`    provenance is this unit's; the pattern is sliced from his POSTHOC-ANCHORS.json\n`);
  for (const a of anchors) {
    const site = `${a.rel}:${a.line}`;
    const body = a.pattern.replace(/^\//, '').replace(/\/[a-z]*$/, '');
    const flags = a.pattern.match(/\/([a-z]*)$/)?.[1] ?? '';
    let re;
    try { re = new RegExp(body, flags); } catch (e) { console.log(`  ${site}  PATTERN UNPARSEABLE: ${e.message}`); continue; }
    const vm = drives.VERBATIM.out.match(re);
    const rm = drives.RENAMED.out.match(re);
    const vVal = vm ? (vm[2] ?? vm[1] ?? vm[0]) : null;
    const rVal = rm ? (rm[2] ?? rm[1] ?? rm[0]) : null;
    const broke = Boolean(vm) && !rm;
    rows.push({ site, pattern: a.pattern, endAnchored: a.endAnchored, provenance: prov.get(site) ?? 'NOT-IN-MATCHER-SET', vVal, rVal, broke });
    console.log(`  ${broke ? 'BREAKS ' : 'holds  '} ${(prov.get(site) ?? '?').padEnd(17)} ${site}`);
    console.log(`        ${a.pattern}${a.endAnchored ? '   [END-ANCHORED]' : ''}`);
    console.log(`        verbatim → ${JSON.stringify(vVal)}    renamed → ${JSON.stringify(rVal)}`);
  }

  const live = rows.filter((r) => r.provenance === 'LIVE');
  const frozen = rows.filter((r) => r.provenance.startsWith('FROZEN'));
  console.log(`\n§3  figures`);
  console.log(`  regex matchers tested                      : ${rows.length}`);
  console.log(`  broke under the rename (value → null)      : ${rows.filter((r) => r.broke).length}`);
  console.log(`    of those, provenance LIVE                : ${live.filter((r) => r.broke).length} of ${live.length}`);
  console.log(`    of those, provenance FROZEN              : ${frozen.filter((r) => r.broke).length} of ${frozen.length}  (a FROZEN site never reads this stdout; a break here is a property of the PATTERN, not of the instrument)`);
  console.log(`  gate exit code moved by the rename         : ${drives.VERBATIM.rc !== drives.RENAMED.rc}`);
  console.log(`  gate stderr moved by the rename            : ${drives.VERBATIM.stderrBytes !== drives.RENAMED.stderrBytes}`);

  console.log(`\n§4  the appended rendering — the one his anchor refused — applied to the same patterns`);
  const appended = drives.VERBATIM.out.replace(
    /^(\s*tracked files read: )(\d+)$/m,
    (_m, a, b) => `${a}${b} (1084 in scope, 1 excluded, 0 unreadable)`,
  );
  const changedAppended = appended !== drives.VERBATIM.out;
  console.log(`  the appended form was constructed from the real stdout: ${changedAppended}`);
  let appendedBreaks = 0; const appendedBroke = [];
  for (const a of anchors) {
    const site = `${a.rel}:${a.line}`;
    const body = a.pattern.replace(/^\//, '').replace(/\/[a-z]*$/, '');
    const flags = a.pattern.match(/\/([a-z]*)$/)?.[1] ?? '';
    let re; try { re = new RegExp(body, flags); } catch { continue; }
    const vm = drives.VERBATIM.out.match(re);
    const am = appended.match(re);
    if (vm && !am) { appendedBreaks += 1; appendedBroke.push({ site, provenance: prov.get(site) ?? '?', pattern: a.pattern }); }
  }
  console.log(`  patterns the appended form breaks: ${appendedBreaks}`);
  for (const b of appendedBroke) console.log(`      ${b.provenance.padEnd(17)} ${b.site}  ${b.pattern}`);
  const appendedLiveBreaks = appendedBroke.filter((b) => b.provenance === 'LIVE').length;
  console.log(`  of those, sites that actually READ live gate output (LIVE): ${appendedLiveBreaks}`);
  console.log(`  >>> the price his §2 refused the appended rendering on, measured at the granularity of the claim: ${appendedLiveBreaks}`);

  console.log(`\n§5  the FROZEN control (P8) — declared trivially green, driven anyway`);
  const FROZEN_INSTRUMENT = 'docs/research/unit-504mixedstalelabels-2026-11-22/posthoc-standing-unmoved.mjs';
  const before = spawnSync(process.execPath, [FROZEN_INSTRUMENT], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  const after = spawnSync(process.execPath, [FROZEN_INSTRUMENT], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  console.log(`  ${FROZEN_INSTRUMENT}`);
  console.log(`  run with both gate copies present on disk: rc ${before.status} / ${after.status}, stdout ${Buffer.byteLength(before.stdout)} B (${sha(before.stdout)}) / ${Buffer.byteLength(after.stdout)} B (${sha(after.stdout)})`);
  console.log(`  byte-identical: ${before.stdout === after.stdout}`);
  console.log(`  its own extracted figure(s): ${JSON.stringify((before.stdout.match(/tracked files read[^\n]*/g) ?? []).slice(0, 4))}`);
  console.log(`  DECLARED: this cell cannot fail. The instrument reads two committed captures and`);
  console.log(`  never opens either gate copy, so it is insensitive to the rename by construction.`);
  console.log(`  That insensitivity IS the finding — it is the same property that makes cure R`);
  console.log(`  unable to reach it — but as a control it carries no load, and is not scored as if it did.`);

  writeFileSync(`${ROOT}/${UNIT}/captures/POSTHOC-RENAME-KP.json`, JSON.stringify({
    gateOccurrences: occurrences,
    drives: Object.fromEntries(Object.entries(drives).map(([k, v]) => [k, { rc: v.rc, stdoutBytes: v.stdoutBytes, stderrBytes: v.stderrBytes, stdoutSha: v.stdoutSha, verdictLine: v.verdictLine }])),
    rows, appendedBreaks, appendedBroke, appendedLiveBreaks,
    frozenControl: { instrument: FROZEN_INSTRUMENT, identical: before.stdout === after.stdout, rc: [before.status, after.status] },
  }, null, 1));
} finally {
  rmSync(`${ROOT}/${G_VERBATIM}`, { force: true });
  rmSync(`${ROOT}/${G_RENAMED}`, { force: true });
  console.log(`\n  scratch copies removed: ${[G_VERBATIM, G_RENAMED].join(', ')}`);
}
