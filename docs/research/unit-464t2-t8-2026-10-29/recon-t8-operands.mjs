#!/usr/bin/env node
// RECON (not graded) — what are T8's two operands made of, and which of them can move?
//
// T8 in docs/research/round464-instruments/grade-the-stop-condition.mjs asserts
//   consecutiveSelfOnly === consecutiveUnion
// and published RED at `dir 2 vs union 0` on 2026-10-29 after Daedalus re-keyed the
// counting population from the (terminated) round-directory surface onto the attested
// surface. His memo §2 calls the resulting free variable "LIVE, not latent".
//
// This recon asks a narrower question than "is the RED correct": it asks whether the
// comparison has TWO moving operands. `consecutiveUnion = count(attested > max(unionCure))`,
// and if `max(unionCure)` is the maximum of the very population being counted over, that
// operand is 0 for a structural reason and T8 reduces to "is the dir arm non-zero".
//
// Nothing is asserted here. Figures are sliced out of HIS recordings with his own anchors,
// and the population comes from HIS shared reader — not re-typed.

import { readFileSync, existsSync } from 'node:fs';
import { attestedRounds, dirRounds, selfTest as attestedSelfTest } from '../lib/attested-rounds.mjs';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const REV = process.env.RECON_REV ?? 'HEAD';

const say = (...a) => console.log(...a);

say('=== RECON/unit-464t2-t8 — T8\'s operands ===');
say(`REPO ${REPO}`);
say(`CLOCK ${new Date().toISOString()}`);

// ---------------------------------------------------------------------------
// 1. The population, from HIS reader. Not a hand-typed copy.
// ---------------------------------------------------------------------------
let selfTestOk = null;
try { selfTestOk = attestedSelfTest() === true; } catch (e) { selfTestOk = `threw: ${e.message}`; }
const attested = attestedRounds(REPO, REV);
const dirs = dirRounds(REPO, REV);

say('\n--- population (his lib) ---');
say(`  lib selfTest      : ${selfTestOk}`);
say(`  attested          : n=${attested === null ? 'REFUSED' : attested.sorted.length} max=${attested === null ? 'REFUSED' : Math.max(...attested.sorted)}`);
say(`  dir surface       : n=${dirs === null ? 'REFUSED' : dirs.length} max=${dirs === null ? 'REFUSED' : Math.max(...dirs)}`);

// ---------------------------------------------------------------------------
// 2. T8's published operands, sliced out of HIS recording with HIS anchors.
//    Each anchor is counted, so a drifted/duplicated anchor is visible rather
//    than silently taking the first hit.
// ---------------------------------------------------------------------------
const RECORDINGS = {
  'his drive2 (clean, attested population)':
    'docs/research/unit-464t2-rekey-2026-10-29/drive2.stop-clean.out',
  'his drive3 (cripple population-dir-only)':
    'docs/research/unit-464t2-rekey-2026-10-29/drive3.cripple-population-dir-only.out',
  'his stop.baseline (pre-action, dir population)':
    'docs/research/unit-464t2-rekey-2026-10-29/stop.baseline.out',
  'my drive1 (reproduction at my HEAD)':
    'docs/research/unit-464t2-t8-2026-10-29/drive1.repro-clean.out',
};

const RE_T8_DETAIL = /^      detail: dir (\d+|null) vs union (\d+|null); last dir=(\d+|null) union=(\d+|null)$/gm;
const RE_T8_VERDICT = /^(RED|ok | ok|MEAS) {1,2}T8:/gm;
const RE_UNION_CURE = /^  union cure set: ([\d,]+)$/gm;
const RE_COUNTING = /^COUNTING POPULATION key=(\w+) n=(\d+) max=(\d+)$/gm;
const RE_VERDICT = /^VERDICT\/(\d+) (\w+) legs=(\d+) red=\[([^\]]*)\]/gm;

const countAll = (re, s) => [...s.matchAll(re)];

const parsed = {};
say('\n--- T8 operands, sliced from his recordings ---');
for (const [label, rel] of Object.entries(RECORDINGS)) {
  const path = `${REPO}/${rel}`;
  if (!existsSync(path)) { say(`  ${label}: MISSING ${rel}`); continue; }
  const txt = readFileSync(path, 'utf8');
  const d = countAll(RE_T8_DETAIL, txt);
  const u = countAll(RE_UNION_CURE, txt);
  const c = countAll(RE_COUNTING, txt);
  const v = countAll(RE_VERDICT, txt);
  const rec = {
    anchorHits: { t8detail: d.length, unionCure: u.length, counting: c.length, verdict: v.length },
    dir: d.length === 1 ? d[0][1] : null,
    union: d.length === 1 ? d[0][2] : null,
    lastDir: d.length === 1 ? d[0][3] : null,
    lastUnion: d.length === 1 ? d[0][4] : null,
    unionCure: u.length === 1 ? u[0][1].split(',').map(Number) : null,
    popKey: c.length === 1 ? c[0][1] : null,
    popN: c.length === 1 ? Number(c[0][2]) : null,
    popMax: c.length === 1 ? Number(c[0][3]) : null,
    verdict: v.length === 1 ? `${v[0][2]} red=[${v[0][4]}]` : null,
  };
  parsed[label] = rec;
  say(`  ${label}`);
  say(`    anchors seen      : ${JSON.stringify(rec.anchorHits)}`);
  say(`    population        : key=${rec.popKey} n=${rec.popN} max=${rec.popMax}`);
  say(`    T8 operands       : dir=${rec.dir} union=${rec.union}  (last dir=${rec.lastDir} union=${rec.lastUnion})`);
  say(`    union cure set max: ${rec.unionCure === null ? 'unsliced' : Math.max(...rec.unionCure)}  (n=${rec.unionCure === null ? '-' : rec.unionCure.length})`);
  say(`    verdict           : ${rec.verdict}`);
  if (rec.lastUnion !== null && rec.popMax !== null) {
    say(`    CEILING?          : lastUnion(${rec.lastUnion}) === popMax(${rec.popMax}) -> ${Number(rec.lastUnion) === rec.popMax}`);
  }
}

// ---------------------------------------------------------------------------
// 3. Containment: is the union cure set a superset of the dir cure set?
//    Read off HIS source construction, and checked against his printed sets.
// ---------------------------------------------------------------------------
say('\n--- one-sidedness ---');
const src = readFileSync(`${REPO}/docs/research/round464-instruments/grade-the-stop-condition.mjs`, 'utf8');
const seedsFromDir = /const curedByUnionKey = new Set\(curedByDirKey\);/.test(src);
const onlyAdds = (() => {
  // every mutation of curedByUnionKey in the source, by method name
  const muts = [...src.matchAll(/curedByUnionKey\.(\w+)\(/g)].map((m) => m[1]);
  return { muts, addsOnly: muts.every((m) => m === 'add' || m === 'has') };
})();
say(`  seeded from the dir cure set : ${seedsFromDir}`);
say(`  mutations of the union set   : ${JSON.stringify(onlyAdds.muts)} addsOnly=${onlyAdds.addsOnly}`);
say(`  => union ⊇ dir, so lastUnion >= lastDir, so consecutiveUnion <= consecutiveDir ALWAYS`);

// ---------------------------------------------------------------------------
// 4. The counterfactual that says which end can move. If a synthetic attested
//    round lands ABOVE the union key's last and the union key does not credit it,
//    does the union operand leave 0?
// ---------------------------------------------------------------------------
say('\n--- counterfactual: can the union operand leave 0? ---');
if (attested !== null) {
  const pop = attested.sorted;
  const lastUnion = 467; // his published figure; re-derived below from the slice too
  const sliced = parsed['his drive2 (clean, attested population)'];
  const lastUnionSliced = sliced && sliced.lastUnion !== null ? Number(sliced.lastUnion) : null;
  const consec = (last, p) => p.filter((r) => r > last).length;
  say(`  lastUnion (hand) ${lastUnion} / (sliced) ${lastUnionSliced}  — agree=${lastUnion === lastUnionSliced}`);
  say(`  live   : count(attested > ${lastUnionSliced}) = ${consec(lastUnionSliced, pop)}`);
  for (const synth of [468, 470, 500]) {
    const pop2 = [...pop, synth].sort((a, b) => a - b);
    say(`  +round ${synth} attested, NOT credited: count(attested > ${lastUnionSliced}) = ${consec(lastUnionSliced, pop2)}`);
  }
  const popMax = Math.max(...pop);
  say(`  so the union operand is 0 BECAUSE lastUnion(${lastUnionSliced}) >= max(attested)(${popMax}): ${lastUnionSliced >= popMax}`);
  say(`  it leaves 0 exactly when an attested round above ${lastUnionSliced} exists that the union key does not credit`);
}

// ---------------------------------------------------------------------------
// 5. The reachable verdict map for T8, over the 2x2 of (dir arm, union arm).
// ---------------------------------------------------------------------------
say('\n--- T8 reachable verdicts (2x2) ---');
say('  dir | union | T8    | reachable at this rev?');
for (const dir of [0, 2]) {
  for (const union of [0, 1]) {
    const t8 = dir === union ? 'ok ' : 'RED';
    const reach = union === 0 ? 'yes (live)' : 'needs an uncredited attested round above the union last';
    say(`  ${String(dir).padStart(3)} | ${String(union).padStart(5)} | ${t8}   | ${reach}`);
  }
}

say('\nRECON done — no assertions made.');
