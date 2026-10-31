#!/usr/bin/env node
// mapside-reach.mjs — unit-464reach, 2026-10-31 START fire (Theseus).
//
// G3 (priceB) proved the scratch file is EXECUTED, but it proved it through the RECORDING
// side: the dead boundary collapsed `DRIFTMEM movedTokens` to 0, and those come from
// recordings. It says nothing about whether the MAP-side `tokensOf` call sites are reached
// in this configuration. One control cannot grade a seam and a write path.
//
// `why-zero-price` refuted the comfortable explanation: all 19 names the cure exposes on
// V22-MAP.md ARE in the cell's emitted set, so "the cure reaches nothing that matters" is
// not available. Either the map-side figures genuinely do not depend on those names, or no
// map-side `tokensOf` call is reached at all.
//
// This instruments the declaration with a counter keyed POSITIVELY on the payload carrying
// a BACKTICK — map lines do, recording payloads do not — so the two call-site families are
// counted separately instead of being inferred from each other.

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const HIS_DIR = '../unit-464authored-2026-10-31';
const CHECKER_SRC = '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const PROBE = 'grade-filed-maps.TOKCENSUS.mjs';
const DECL = 'const tokensOf = (payload) => {';

const src = readFileSync(CHECKER_SRC, 'utf8');
const declCount = src.split(DECL).length - 1;
if (declCount !== 1) {
  console.log(`FATAL — the declaration anchor occurs ${declCount}x, not once; nothing published`);
  process.exit(2);
}

const INSTRUMENTED = `globalThis.__TOK = { total: 0, withBacktick: 0, noBacktick: 0, tickSamples: [] };
process.on('exit', () => {
  const t = globalThis.__TOK;
  console.log(\`TOKCENSUS total=\${t.total} withBacktick=\${t.withBacktick} noBacktick=\${t.noBacktick}\`);
  for (const s of t.tickSamples) console.log(\`TOKSAMPLE \${JSON.stringify(s)}\`);
});
${DECL}
  {
    const t = globalThis.__TOK;
    t.total += 1;
    if (String(payload).includes('\`')) {
      t.withBacktick += 1;
      if (t.tickSamples.length < 4) t.tickSamples.push(String(payload).slice(0, 90));
    } else {
      t.noBacktick += 1;
    }
  }`;

const probeSrc = src.replace(DECL, INSTRUMENTED);
writeFileSync(PROBE, probeSrc);
console.log(
  `PROBEDIFF ok  declaration anchor replaced exactly ${declCount}x; probe is ` +
    `${probeSrc.length - src.length}B larger than the checker and changes NO regex`,
);
if (probeSrc.split('(?:^|\\s)').length - 1 !== 1) {
  console.log('FATAL — the probe perturbed the boundary; it must not. Nothing published.');
  process.exit(2);
}

// Tuple sliced from his harness.
const hisDrive = readFileSync(`${HIS_DIR}/drive.mjs`, 'utf8');
const lines = hisDrive.split('\n');
const s = lines.findIndex((l) => l.startsWith('const CHECKER = '));
const e = lines.findIndex((l, i) => i > s && /^const CONTROL = \[/.test(l));
// eslint-disable-next-line no-new-func
const argv = new Function(
  `"use strict";\n${lines.slice(s, e + 1).join('\n')}\nreturn ${(hisDrive.match(/^\s*drive1:\s*(\[[^\]]*\]),?\s*$/m) ?? [])[1]};`,
)();

const r = spawnSync('node', [`../unit-464reach-2026-10-31/${PROBE}`, ...argv], {
  cwd: HIS_DIR,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  maxBuffer: 64 * 1024 * 1024,
});
writeFileSync('drive7.tokcensus.out', r.stdout ?? '');
writeFileSync('drive7.tokcensus.err', r.stderr ?? '');
console.log(`--- drive7.tokcensus  exit=${r.status}  err=${statSync('drive7.tokcensus.err').size}B`);

const out = r.stdout ?? '';
for (const l of out.split('\n')) if (/^TOKCENSUS|^TOKSAMPLE/.test(l)) console.log(`   ${l}`);

const m = out.match(/^TOKCENSUS total=(\d+) withBacktick=(\d+) noBacktick=(\d+)/m);
if (m === null) {
  console.log('G4 REFUSED — the probe published no TOKCENSUS line; map-side reach is UNMEASURED');
  process.exit(2);
}
const [, total, tick, notick] = m.map(Number);
console.log(
  `\nG4 ${tick > 0 ? 'ok ' : 'RED'} MAP-SIDE REACH — tokensOf was called ${total}x in this run: ` +
    `${tick}x on a payload containing a backtick (map lines), ${notick}x without (recording payloads). ` +
    (tick > 0
      ? 'The map-side call sites ARE reached, so the cure\'s byte-identical output is NOT a dead code path.'
      : 'NO map-side call was reached in this configuration — the cure cannot move anything here for ' +
        'that reason, and priceA\'s byte-identity says nothing about the cure\'s price.'),
);
