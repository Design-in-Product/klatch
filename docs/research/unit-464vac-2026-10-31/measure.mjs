#!/usr/bin/env node
// measure.mjs — unit-464vac, 2026-10-31 STOP fire (Daedalus).
//
// Can `GTYPEDDEF` carry a VACUOUS branch? Four candidate denominators, measured at the LIVE
// boundary on the 8 scored cells, against Theseus's saturation census.
//
// PROVENANCE, DECLARED NOT LAUNDERED. The 8 cells and their resolved argv are read from
// Theseus's committed `unit-464sat-2026-10-31/sat.json` (`results[]`), not re-selected here.
// His argv key is his instrument's; re-deriving it would grade his selector, not this unit's
// question. If his sat.json is wrong about a cell's configuration, every figure here inherits
// that — and `G0` checks the one way it could be stale rather than wrong.
//
// The LIVE CHECKER IS NOT EDITED. The copy driven for its dump is my own derived
// `unit-464absorb-2026-10-31/grade-filed-maps.INSTRUMENTED.mjs`, and `G2` asserts it
// reproduces the live checker's own GTYPEDDEF / TYPED / MAPVERDICT lines on every cell —
// a derived copy that has drifted from its source cannot measure its source.
//
// Writes only under this unit's directory.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, basename, resolve } from 'node:path';

const HERE = resolve('.');
const REPO = resolve('../../..');
const SAT = '../unit-464sat-2026-10-31/sat.json';
const LIVE_REL = 'docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const INSTR_REL = 'docs/research/unit-464absorb-2026-10-31/grade-filed-maps.INSTRUMENTED.mjs';
const MY_REV = readFileSync('baseline.rev', 'utf8').trim();

let REFUSALS = 0;
const refuse = (leg, why) => {
  console.log(`${leg} REFUSED — ${why}`);
  REFUSALS += 1;
};
const git = (...a) => {
  const r = spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout.trim() : null;
};
const setDiff = (a, b) => [...a].filter((x) => !b.has(x));
const eqSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// ===========================================================================
// G1 — the cell list, from his file, asserted rather than trusted in shape.
// ===========================================================================
const sat = JSON.parse(readFileSync(SAT, 'utf8'));
const CELLS = sat.results ?? [];
const HIS_REV = sat.baselineRev ?? '';
const wellFormed = CELLS.every(
  (c) =>
    typeof c.map === 'string' &&
    Array.isArray(c.argv) &&
    c.argv.some((t) => t.startsWith('--map=')) &&
    c.argv.some((t) => t.startsWith('--arm=')) &&
    Array.isArray(c.price),
);
if (CELLS.length !== 8 || !wellFormed) {
  refuse('G1', `sliced ${CELLS.length} cell(s), well-formed=${wellFormed} — expected 8, all with --map= and >=1 --arm=`);
} else {
  console.log(`G1  ok  8 scored cell(s) read from ${SAT} at his rev ${HIS_REV.slice(0, 8)}; mine is ${MY_REV.slice(0, 8)}`);
}

// ===========================================================================
// G0 — IS HIS ANSWER KEY FRESH AGAINST MY TREE? His census was recorded at his rev; I am
// reading it at mine. A figure keyed on a map that has since changed is stale, not wrong,
// and the two need different handling. Compared by BLOB HASH at both revs, per file, for
// every map plus the live checker and the instrumented copy.
// ===========================================================================
{
  const subjects = [...new Set([...CELLS.map((c) => c.map), LIVE_REL, INSTR_REL])];
  const moved = [];
  const unreadable = [];
  for (const p of subjects) {
    const a = git('rev-parse', `${HIS_REV}:${p}`);
    const b = git('rev-parse', `${MY_REV}:${p}`);
    if (a === null || b === null) unreadable.push(p);
    else if (a !== b) moved.push(`${basename(p)}(${a.slice(0, 8)}->${b.slice(0, 8)})`);
  }
  if (unreadable.length > 0) refuse('G0', `${unreadable.length} subject(s) unreadable at one of the two revs: [${unreadable.map(basename).join(',')}]`);
  else if (moved.length > 0) refuse('G0', `${moved.length} of ${subjects.length} subject(s) CHANGED between his rev and mine: [${moved.join(',')}] — his key is stale against my tree`);
  else console.log(`G0  ok  all ${subjects.length} subject(s) (8 maps + live checker + instrumented copy) byte-identical at ${HIS_REV.slice(0, 8)} and ${MY_REV.slice(0, 8)} — his key is FRESH against my tree`);
}

// ===========================================================================
// G4 — the cripple hook is OFF. The copy driven carries ABSORB_CRIPPLE branches; a drive
// that inherited one from the environment would measure a cripple and call it live.
// ===========================================================================
if (process.env.ABSORB_CRIPPLE !== undefined) refuse('G4', `ABSORB_CRIPPLE is set in this process's environment (${JSON.stringify(process.env.ABSORB_CRIPPLE)}) — refusing to drive`);
else console.log(`G4  ok  ABSORB_CRIPPLE unset in this process; every drive below passes ABSORB_CRIPPLE='' and ABSORB_BOUNDARY='live', and each dump's own recorded cripple is re-checked per cell`);

// ===========================================================================
// Per cell: drive the live checker and the instrumented copy with the SAME argv, assert the
// three published lines agree (G2), then compute the four denominators off the dump.
// ===========================================================================
const KEYLINES = /^(GTYPEDDEF |TYPED {2}|MAPVERDICT\/)/;
const rows = [];
let n = 0;
for (const cell of CELLS) {
  n += 1;
  const tag = `${String(n).padStart(2, '0')}.${basename(cell.map).replace(/\.md$/, '')}-${cell.arm}`;
  const cwd = resolve(REPO, dirname(cell.map));
  const drive = (checkerRel, kind, extraEnv) => {
    const out = `${HERE}/drive${tag}.${kind}.out`;
    const r = spawnSync('node', [resolve(REPO, checkerRel), ...cell.argv], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...extraEnv },
      maxBuffer: 64 * 1024 * 1024,
    });
    writeFileSync(out, r.stdout ?? '');
    writeFileSync(`${HERE}/drive${tag}.${kind}.err`, r.stderr ?? '');
    return { rc: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  };
  const dumpPath = `${HERE}/drive${tag}.dump.json`;
  const live = drive(LIVE_REL, 'live', { ABSORB_CRIPPLE: '', ABSORB_BOUNDARY: 'live' });
  const instr = drive(INSTR_REL, 'instr', { ABSORB_CRIPPLE: '', ABSORB_BOUNDARY: 'live', ABSORB_DUMP: dumpPath });

  const keyOf = (s) => s.split('\n').filter((l) => KEYLINES.test(l));
  const kLive = keyOf(live.stdout);
  const kInstr = keyOf(instr.stdout);
  const agree = kLive.length === 3 && eqSet(kLive, kInstr);
  if (!agree) {
    refuse('G2', `${tag}: the derived copy does not reproduce the live checker's published lines (live ${kLive.length} line(s), instr ${kInstr.length}) — not measuring`);
    rows.push({ cell, tag, unmeasured: 'G2' });
    continue;
  }
  if (live.stderr.length > 0 || instr.stderr.length > 0) {
    refuse('G2', `${tag}: non-empty stderr (live ${live.stderr.length}B, instr ${instr.stderr.length}B)`);
    rows.push({ cell, tag, unmeasured: 'stderr' });
    continue;
  }

  let j;
  try {
    j = JSON.parse(readFileSync(dumpPath, 'utf8'));
  } catch {
    refuse('G2', `${tag}: dump unreadable`);
    rows.push({ cell, tag, unmeasured: 'dump' });
    continue;
  }
  if (j.cripple !== '' || j.boundary !== 'live') {
    refuse('G4', `${tag}: dump records boundary=${j.boundary} cripple=${JSON.stringify(j.cripple)} — not a live, uncrippled drive`);
    rows.push({ cell, tag, unmeasured: 'G4' });
    continue;
  }

  // G3 — GROUPING. rows[] is flat across arms, pushed in arm order, one entry per REACHED
  // member. Recovered by cumulative reached-counts and then ASSERTED, because a grouping
  // that is off by one silently moves a member's figures onto another arm.
  let i = 0;
  const grouped = [];
  let groupingOk = true;
  for (const a of j.arms) {
    const slice = j.rows.slice(i, i + a.reached.length);
    i += a.reached.length;
    if (slice.length !== a.reached.length || !eqSet(slice.map((r) => r.id).slice().sort(), a.reached.slice().sort())) groupingOk = false;
    grouped.push({ arm: a, rows: slice });
  }
  if (i !== j.rows.length || !groupingOk) {
    refuse('G3', `${tag}: ${j.rows.length} row(s) do not partition into ${j.arms.length} arm(s) by reached-count (consumed ${i}, ids match=${groupingOk})`);
    rows.push({ cell, tag, unmeasured: 'G3' });
    continue;
  }

  // The gate's own population: mapped arms only (grade-filed-maps.mjs:1008 filters
  // !refused && !unmapped). The denominators must read the same population the gate does.
  const mapped = grouped.filter((g) => !g.arm.unmapped);
  const members = mapped.flatMap((g) => g.rows.map((r) => ({ ...r, arm: g.arm })));

  const D1 = members.reduce((s, m) => s + setDiff(m.arm.emitted, new Set(m.ownEmits)).length, 0);
  const d2sets = members.map((m) => setDiff(m.arm.quoted, new Set(m.ownEmits)));
  const D2 = d2sets.reduce((s, x) => s + x.length, 0);
  const D2set = [...new Set(d2sets.flat())].sort();
  const D3 = members.reduce((s, m) => s + m.ctxLines, 0);
  const D4num = members.filter((m) => m.quotedOfMe.length > 0).length;
  const D4den = members.length;
  const liveTyped = [...new Set(members.flatMap((m) => m.typed))].sort();
  const hisPrice = cell.price.slice().sort();
  const union = [...new Set([...hisPrice, ...liveTyped])].sort();

  rows.push({
    cell, tag, unmeasured: null,
    mappedArms: mapped.length, totalArms: grouped.length,
    D1, D2, D2set, D3, D4num, D4den, liveTyped, hisPrice, union,
    saturated: hisPrice.length === 0,
    gtyppedLine: kLive.find((l) => l.startsWith('GTYPEDDEF')),
  });
  console.log(
    `CELL ${hisPrice.length === 0 ? 'SATURATED    ' : 'NOT-SATURATED'} ${basename(cell.map).padEnd(42)} / ${cell.arm.padEnd(17)} ` +
      `mapped=${mapped.length}/${grouped.length} members=${D4den}  D1=${D1}  D2=${D2}  D3=${D3}  D4=${D4num}/${D4den}  ` +
      `liveTyped=${liveTyped.length}  hisPrice=${hisPrice.length}`,
  );
}

// ===========================================================================
// Predictions. Suppressed wholesale if anything refused — a figure printed beside a refusal
// is a figure nobody can use.
// ===========================================================================
const good = rows.filter((r) => r.unmeasured === null);
console.log(`\n=== ${good.length} of ${rows.length} cell(s) MEASURED, ${rows.length - good.length} UNMEASURED, ${REFUSALS} refusal(s) ===`);

if (REFUSALS > 0 || good.length !== 8) {
  console.log(`\nREFUSED/${REFUSALS} — no denominator figure is published; the separation question is UNMEASURED this drive.`);
  writeFileSync(`${HERE}/vac.json`, JSON.stringify({ myRev: MY_REV, hisRev: HIS_REV, refusals: REFUSALS, rows }, null, 2) + '\n');
  process.exit(1);
}

const sat1 = good.filter((r) => r.saturated);
const notSat = good.filter((r) => !r.saturated);
const P = [];
const push = (id, pred, verdict, got) => P.push({ id, pred, verdict, got });

// V1 — D1 > 0 everywhere, so a branch keyed on it is dead code.
{
  const zeros = good.filter((r) => r.D1 === 0).map((r) => r.tag);
  push('V1', 'D1 OPP-ARMWIDE > 0 on all 8 cells (so a VACUOUS branch keyed on it never fires)',
    zeros.length === 0 ? 'LANDS' : 'REFUTED',
    `min D1 = ${Math.min(...good.map((r) => r.D1))}, max = ${Math.max(...good.map((r) => r.D1))}, ${zeros.length} cell(s) at 0 [${zeros.join(',')}]`);
}
// V2 — D2set == his price ∪ liveTyped, per cell, both directions.
{
  const bad = good.filter((r) => !eqSet(r.D2set, r.union)).map((r) => `${r.tag}(mine=${r.D2set.length} his∪live=${r.union.length})`);
  push('V2', 'D2 OPP-SECQUOTED, as a SET per cell, equals his price UNION the live tokensTyped (both directions)',
    bad.length === 0 ? 'LANDS' : 'REFUTED',
    bad.length === 0 ? `set-equal on all ${good.length} cell(s)` : `${bad.length} cell(s) disagree: [${bad.join(' ')}]`);
}
// V3 — D3 > 0 everywhere.
{
  const zeros = good.filter((r) => r.D3 === 0).map((r) => r.tag);
  push('V3', 'D3 CTXLINES > 0 on all 8 cells', zeros.length === 0 ? 'LANDS' : 'REFUTED',
    `min D3 = ${Math.min(...good.map((r) => r.D3))}, ${zeros.length} at 0 [${zeros.join(',')}]`);
}
// V4 — THE DECISION. Does any denominator separate the saturated cell from the other 7?
// Separation, operationalised: the saturated cell sits at 0 and every non-saturated cell
// is > 0 — the only shape a `D === 0` branch inside the gate could key on.
{
  const sep = [];
  for (const [name, f] of [['D1', (r) => r.D1], ['D2', (r) => r.D2], ['D3', (r) => r.D3], ['D4num', (r) => r.D4num]]) {
    const satZero = sat1.every((r) => f(r) === 0);
    const othersPos = notSat.every((r) => f(r) > 0);
    sep.push(`${name}:${satZero && othersPos ? 'SEPARATES' : `no(sat=[${sat1.map(f).join(',')}] notSat=[${notSat.map(f).join(',')}])`}`);
  }
  const any = sep.some((s) => s.includes('SEPARATES'));
  push('V4', 'NO live-boundary denominator separates the 1 saturated cell from the 7 non-saturated',
    any ? 'REFUTED' : 'LANDS', sep.join('  '));
}
// V5 — the gate's published coverage overstates itself on at least one cell.
{
  const short = good.filter((r) => r.D4num < r.D4den);
  push('V5', 'on >=1 cell, some reached+mapped member quotes NO token, so "across N mapped arm(s)" overstates coverage',
    short.length >= 1 ? 'LANDS' : 'REFUTED',
    `${short.length} of ${good.length} cell(s) measure fewer members than they reach: [${short.map((r) => `${r.tag} ${r.D4num}/${r.D4den}`).join('  ')}]`);
}
// V6 — but no cell measures nothing, so a strict VACUOUS verdict fires on 0 of 8.
{
  const none = good.filter((r) => r.D4num === 0);
  push('V6', 'no cell has D4num == 0, so a strict all-or-nothing VACUOUS verdict fires on 0 of 8 today',
    none.length === 0 ? 'LANDS' : 'REFUTED',
    `${none.length} cell(s) measure no member at all [${none.map((r) => r.tag).join(',')}]`);
}

console.log(`\n=== PREDICTIONS ===`);
for (const p of P) console.log(`${p.id.padEnd(4)} ${p.verdict.padEnd(9)} ${p.pred}\n       got: ${p.got}`);
const landed = P.filter((p) => p.verdict === 'LANDS').length;
console.log(`\nVACVERDICT/0 ${landed} of ${P.length} predictions land · ${REFUSALS} refusal(s) · ${good.length} of 8 cells measured`);
writeFileSync(`${HERE}/vac.json`, JSON.stringify({ myRev: MY_REV, hisRev: HIS_REV, refusals: REFUSALS, rows, predictions: P }, null, 2) + '\n');
