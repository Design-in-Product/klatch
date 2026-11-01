#!/usr/bin/env node
// grade-cure.mjs — unit-464vac, 2026-10-31 STOP fire (Daedalus).
//
// Grades the VACUOUS branch added to `GTYPEDDEF` in the live checker. Five legs, each with a
// counterfactual or a byte comparison, over all 8 scored cells.
//
// THE PRE-CURE BASELINE IS READ FROM GIT, not from the working tree. `measure.mjs` wrote
// `drive*.live.out` BEFORE the checker was edited and those files are committed at
// `PRECURE_REV`; re-driving in this directory would re-stamp them and the comparison would
// then be against my own cure. So every "before" string here comes from `git show`.
//
// C4 is labelled honestly: `TYPEDDEFCOV`'s figures and `vac.json`'s D4 are two READERS of one
// computation (`quotedOfMe`), not two independent computations. It catches a wiring error in
// `quotedCount`; it is not confirmation of the measurement.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, basename, resolve } from 'node:path';

const HERE = resolve('.');
const REPO = resolve('../../..');
const LIVE_REL = 'docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const MY_DIR_REL = 'docs/research/unit-464vac-2026-10-31';

let REFUSALS = 0;
const refuse = (leg, why) => {
  console.log(`${leg} REFUSED — ${why}`);
  REFUSALS += 1;
};
const git = (...a) => {
  const r = spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
};

const vac = JSON.parse(readFileSync('vac.json', 'utf8'));
const CELLS = vac.rows.filter((r) => r.unmeasured === null);
if (CELLS.length !== 8) refuse('C0', `vac.json carries ${CELLS.length} measured cell(s), not 8 — grading nothing`);

// The rev the pre-cure recordings were committed at: the newest commit that touched this
// directory and did NOT touch the checker. Derived, not typed, so a later commit of mine
// cannot silently become the baseline.
const PRECURE_REV = (() => {
  const log = git('log', '--format=%H', '-5', '--', MY_DIR_REL);
  for (const rev of (log ?? '').trim().split('\n').filter(Boolean)) {
    const touched = git('show', '--name-only', '--format=', rev) ?? '';
    if (!touched.split('\n').includes(LIVE_REL)) return rev;
  }
  return null;
})();
if (PRECURE_REV === null) refuse('C0', 'no commit of this directory predates a commit of the checker');
else {
  const checkerNow = readFileSync(resolve(REPO, LIVE_REL), 'utf8');
  const checkerThen = git('show', `${PRECURE_REV}:${LIVE_REL}`) ?? '';
  const changed = checkerNow !== checkerThen;
  console.log(
    `C0  ${changed ? 'ok ' : 'RED'} pre-cure baseline rev ${PRECURE_REV.slice(0, 8)}; the checker in the worktree ` +
      `${changed ? 'DIFFERS from' : 'is IDENTICAL to'} the checker at that rev (${checkerThen.length}B -> ${checkerNow.length}B)`,
  );
  // A grading run in which the subject was never edited grades nothing and must say so.
  if (!changed) refuse('C0', 'the checker is unchanged — there is no cure to grade');
}

const KEY = /^(GTYPEDDEF |TYPED {2}|MAPVERDICT\/)/;
const keyLines = (s) => s.split('\n').filter((l) => KEY.test(l));
const line = (s, pre) => s.split('\n').find((l) => l.startsWith(pre)) ?? null;

const results = [];
for (const row of CELLS) {
  const cell = row.cell;
  const cwd = resolve(REPO, dirname(cell.map));
  const before = git('show', `${PRECURE_REV}:${MY_DIR_REL}/drive${row.tag}.live.out`);
  if (before === null) {
    refuse('C1', `${row.tag}: pre-cure recording unreadable at ${String(PRECURE_REV).slice(0, 8)}`);
    continue;
  }
  const drive = (extraArgs, kind) => {
    const r = spawnSync('node', [resolve(REPO, LIVE_REL), ...cell.argv, ...extraArgs], {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
    });
    writeFileSync(`${HERE}/cure${row.tag}.${kind}.out`, r.stdout ?? '');
    writeFileSync(`${HERE}/cure${row.tag}.${kind}.err`, r.stderr ?? '');
    return r;
  };
  const after = drive([], 'cured');
  const blind = drive(['--cripple=typeddef-vacuity-blind'], 'blind');
  if ((after.stderr ?? '').length > 0 || (blind.stderr ?? '').length > 0) {
    refuse('C1', `${row.tag}: non-empty stderr (cured ${(after.stderr ?? '').length}B, blind ${(blind.stderr ?? '').length}B)`);
    continue;
  }
  results.push({
    tag: row.tag,
    saturated: row.saturated,
    hisPrice: row.hisPrice.length,
    D4num: row.D4num,
    D4den: row.D4den,
    D3: row.D3,
    before,
    beforeKeys: keyLines(before),
    afterKeys: keyLines(after.stdout ?? ''),
    blindKeys: keyLines(blind.stdout ?? ''),
    mapvac: line(after.stdout ?? '', 'MAPVACUOUS/'),
    mapvacBlind: line(blind.stdout ?? '', 'MAPVACUOUS/'),
    cov: line(after.stdout ?? '', 'TYPEDDEFCOV '),
    verdictBefore: line(before, 'MAPVERDICT/'),
    verdictAfter: line(after.stdout ?? '', 'MAPVERDICT/'),
    gtBefore: line(before, 'GTYPEDDEF '),
    gtAfter: line(after.stdout ?? '', 'GTYPEDDEF '),
    gtBlind: line(blind.stdout ?? '', 'GTYPEDDEF '),
    rcAfter: after.status,
  });
}

if (REFUSALS > 0 || results.length !== 8) {
  console.log(`\nREFUSED/${REFUSALS} — ${results.length} of 8 cell(s) drove; no cure figure is published.`);
  process.exit(1);
}

// Which cells the branch should fire on is NOT typed here: it is derived from the measurement
// (`D4num === 0`), so a cell that stops being vacuous moves this expectation with it.
const expectVac = results.filter((r) => r.D4num === 0).map((r) => r.tag);
const gotVac = results.filter((r) => /^MAPVACUOUS\/1 GTYPEDDEF/.test(r.mapvac ?? '')).map((r) => r.tag);
const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

const P = [];
const push = (id, pred, ok, got) => P.push({ id, pred, verdict: ok ? 'LANDS' : 'REFUTED', got });

push('C1', 'MAPVACUOUS/1 GTYPEDDEF on exactly the cells the measurement calls vacuous (D4num == 0), MAPVACUOUS/0 on the rest',
  eq(expectVac.slice().sort(), gotVac.slice().sort()) && results.filter((r) => r.D4num > 0).every((r) => /^MAPVACUOUS\/0 none/.test(r.mapvac ?? '')),
  `expected [${expectVac.join(',')}] (${expectVac.length}), got [${gotVac.join(',')}] (${gotVac.length}); the other ${8 - gotVac.length} print MAPVACUOUS/0`);

push('C2', 'on the 6 NON-vacuous cells all three keyed lines are BYTE-IDENTICAL to the pre-cure recording, so no filed recording disagrees for a non-defect',
  results.filter((r) => r.D4num > 0).every((r) => eq(r.beforeKeys, r.afterKeys)),
  results.filter((r) => r.D4num > 0).map((r) => `${r.tag}:${eq(r.beforeKeys, r.afterKeys) ? 'same' : 'DIFFERS'}`).join(' '));

push('C3', 'on the 2 vacuous cells the GTYPEDDEF line DIFFERS from pre-cure while MAPVERDICT stays byte-identical (green, labelled — not a new RED)',
  results.filter((r) => r.D4num === 0).every((r) => r.gtAfter !== r.gtBefore && r.verdictAfter === r.verdictBefore),
  results.filter((r) => r.D4num === 0).map((r) => `${r.tag}: GTYPEDDEF ${r.gtAfter === r.gtBefore ? 'SAME' : 'differs'}, MAPVERDICT ${r.verdictAfter === r.verdictBefore ? 'identical' : 'MOVED'}`).join(' · '));

push('C4', 'the COUNTERFACTUAL: --cripple=typeddef-vacuity-blind restores the pre-cure GTYPEDDEF line byte-for-byte on the 2 vacuous cells and MAPVACUOUS/0 on all 8',
  results.filter((r) => r.D4num === 0).every((r) => r.gtBlind === r.gtBefore) && results.every((r) => /^MAPVACUOUS\/0 /.test(r.mapvacBlind ?? '')),
  `${results.filter((r) => r.D4num === 0 && r.gtBlind === r.gtBefore).length} of ${expectVac.length} restored verbatim; ` +
    `${results.filter((r) => /^MAPVACUOUS\/0 /.test(r.mapvacBlind ?? '')).length} of 8 print MAPVACUOUS/0 under the cripple`);

push('C5', 'the cure costs ZERO newly-red maps: MAPVERDICT is byte-identical to pre-cure on all 8 cells',
  results.every((r) => r.verdictAfter === r.verdictBefore),
  results.filter((r) => r.verdictAfter !== r.verdictBefore).map((r) => r.tag).join(',') || 'all 8 verdicts byte-identical');

// C6 — TYPEDDEFCOV agrees with vac.json's independently-walked D4. LABELLED: two readers of
// one computation, not two computations. It catches a `quotedCount` wiring error only.
push('C6', "TYPEDDEFCOV's judged/reached matches vac.json's D4 on all 8 cells (ONE computation read two ways — a wiring check, not confirmation)",
  results.every((r) => (r.cov ?? '').includes(`judged ${r.D4num} of ${r.D4den} reached member(s) over ${r.D3} context line(s)`)),
  results.map((r) => `${r.tag.slice(0, 2)}:${(r.cov ?? '').includes(`judged ${r.D4num} of ${r.D4den} reached member(s) over ${r.D3} context line(s)`) ? 'ok' : 'MISMATCH'}`).join(' '));

console.log(`\n=== per cell ===`);
for (const r of results) {
  console.log(
    `${r.D4num === 0 ? 'VACUOUS    ' : 'measuring  '} ${r.tag.padEnd(50)} ` +
      `${r.saturated ? 'saturated    ' : `price=${String(r.hisPrice).padEnd(2)}      `} judged=${r.D4num}/${r.D4den}  rc=${r.rcAfter}  ${(r.mapvac ?? '').slice(0, 58)}`,
  );
}
console.log(`\n=== LEGS ===`);
for (const p of P) console.log(`${p.id}  ${p.verdict.padEnd(9)} ${p.pred}\n      got: ${p.got}`);
const landed = P.filter((p) => p.verdict === 'LANDS').length;
console.log(`\nCUREVERDICT/${landed === P.length ? 0 : 1} ${landed} of ${P.length} legs land · ${REFUSALS} refusal(s) · 8 of 8 cells driven`);
writeFileSync(`${HERE}/cure.json`, JSON.stringify({ precureRev: PRECURE_REV, legs: P, cells: results.map(({ before, ...r }) => r) }, null, 2) + '\n');
process.exit(landed === P.length ? 0 : 1);
