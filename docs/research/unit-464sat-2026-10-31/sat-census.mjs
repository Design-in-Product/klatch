#!/usr/bin/env node
// sat-census.mjs — unit-464sat, 2026-10-31 WORK fire (Theseus).
//
// How many of the 8 scored maps are SATURATED? i.e. on how many of them is the map-side
// boundary cure's price on `GTYPEDDEF` zero *while the cure demonstrably reaches the map*.
//
// WHY THE ARGV KEY CHANGED, AND IT IS RECORDED RATHER THAN REPLACED.
// `argv-census.mjs` (drive1) keyed on the `# argv:` header and came back **2 of 8**: that
// header is OPTIONAL metadata only two of the five harnesses write, and keying on it
// measured my selector, not the maps. The mandatory content is the (arm, configuration)
// pair, and argv differs across these cells only in `--map=` —
// `unit-464nomoved-2026-10-30/drive.mjs:7` says so in its own words: "Three drives, all
// with the SAME argv except `--map=`". So the key here is the ARM's honest configuration
// tail, and a cell's argv is that tail plus its own `--map=`.
//
// THE HONEST CONFIGURATION IS KEYED POSITIVELY, not by frequency and not by my picking:
//   * no `--cripple=` token at all,
//   * `--clean=` is a CLEAN recording (basename ends `.clean.out`),
//   * exactly two `--control=`, BOTH clean recordings, and DIFFERENT from each other.
// On the committed population that selects exactly one tail per arm family. If it selected
// more than one, or none, the cell REFUSES — a cell is never scored off a tail I chose.
//
// Both drives of every cell run with cwd = the cell's MAP directory. Every unit dir is a
// sibling under docs/research/, so a `../unit-XXX/...` tail resolves identically from any
// of them — asserted per cell, not assumed.
//
// The live checker is NOT edited. The cured copy is unit-464reach-2026-10-31's, re-gated
// here rather than trusted. No cell of the stop-condition instrument is driven or edited.

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, basename, posix } from 'node:path';

const REPO = '../../..';
const BASELINE_REV = readFileSync('baseline.rev', 'utf8').trim();
const CHECKER_REL = 'docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const LIVE = '../unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
const CURED = '../unit-464reach-2026-10-31/grade-filed-maps.CURED.mjs';
const BOUNDARY = '(?:^|\\s)';
const CURED_BOUNDARY = '(?:^|[^A-Za-z0-9_.])';
const MY_DIR = 'unit-464sat-2026-10-31';

let REFUSALS = 0;
const refuse = (leg, why) => {
  console.log(`${leg} REFUSED — ${why}`);
  REFUSALS += 1;
};
const git = (...a) => {
  const r = spawnSync('git', ['-C', REPO, ...a], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  return r.status === 0 ? r.stdout : null;
};

// ===========================================================================
// GCURE — the cured copy differs from the live checker by EXACTLY the one
// character class, and nothing else. Round-tripped, so a second edit anywhere
// in the file cannot pass as "one line differs".
// ===========================================================================
const liveSrc = readFileSync(LIVE, 'utf8');
const curedSrc = readFileSync(CURED, 'utf8');
{
  const a = liveSrc.split('\n');
  const b = curedSrc.split('\n');
  const diffLines = a.length !== b.length ? null : a.map((l, i) => (l === b[i] ? -1 : i + 1)).filter((i) => i > 0);
  const roundTrip = curedSrc.split(CURED_BOUNDARY).join(BOUNDARY);
  const nCured = curedSrc.split(CURED_BOUNDARY).length - 1;
  const ok = diffLines !== null && diffLines.length === 1 && roundTrip === liveSrc && nCured === 1;
  console.log(
    `GCURE ${ok ? 'ok ' : 'RED'} cured copy vs live checker: ` +
      `${diffLines === null ? 'DIFFERENT LINE COUNTS' : `${diffLines.length} line(s) differ [${diffLines.join(',')}]`}, ` +
      `cured boundary occurs ${nCured}x, substituting it back ` +
      `${roundTrip === liveSrc ? 'reproduces the live checker EXACTLY' : 'does NOT reproduce the live checker'}`,
  );
  if (!ok) refuse('GCURE', 'the cured copy is not the live checker plus exactly one character class');
}

// ===========================================================================
// The 8 cells, sliced from my own committed recording (as in drive1).
// ===========================================================================
const cellSrc = git('show', `${BASELINE_REV}:docs/research/unit-464reach-2026-10-31/drive2.out`);
if (cellSrc === null) {
  refuse('CELLS', 'the cell list is unsliceable');
}
const CELLS = [];
for (const l of (cellSrc ?? '').split('\n')) {
  const m = l.match(/^P3ROW (ok |REFUTES) (\S+) \/ (\S+):/);
  if (m !== null) CELLS.push({ map: m[2], arm: m[3] });
}
const declScored = Number(((cellSrc ?? '').split('\n').find((l) => l.startsWith('P3 ')) ?? '').match(/(\d+) rows-bearing/)?.[1]);
if (declScored !== CELLS.length) refuse('CELLS', `sliced ${CELLS.length} cells, source declares ${declScored}`);
console.log(`CELLS  ${CELLS.length} scored cell(s), sliced at ${BASELINE_REV.slice(0, 8)} (source declares ${declScored})`);

// ===========================================================================
// GARGV2 — the honest-configuration tail per arm, off every committed `# argv:`.
// ===========================================================================
const tree = (git('ls-tree', '-r', '--name-only', BASELINE_REV) ?? '').trim().split('\n');
const outs = tree.filter((f) => f.startsWith('docs/research/') && f.endsWith('.out') && !f.includes(MY_DIR));
const isClean = (p) => basename(p).endsWith('.clean.out');

const argvLines = [];
for (const f of outs) {
  const text = git('show', `${BASELINE_REV}:${f}`);
  if (text === null) continue;
  for (const l of text.split('\n')) {
    const m = l.match(/^#\s*argv:\s*(.+)$/);
    if (m !== null) {
      const argv = m[1].trim().split(/\s+/);
      if (argv.every((t) => /^--[a-z]+=/.test(t))) argvLines.push({ argv, from: f });
    }
  }
  // The second committed argv surface: a `TUPLE sliced from <harness>` block, whose args
  // are the indented lines that follow. This is how t2-dir-only's tail reaches the tree —
  // its harness writes no `# argv:` header. Provenance declared, not laundered: the block
  // is in MY OWN unit-464reach recording, sliced there from Daedalus's drive.mjs.
  const lines = text.split('\n');
  const ti = lines.findIndex((l) => /^TUPLE\s+sliced from .* — (\d+) arg\(s\):/.test(l));
  if (ti !== -1) {
    const want = Number(lines[ti].match(/— (\d+) arg\(s\):/)[1]);
    const got = [];
    for (let j = ti + 1; j < lines.length; j += 1) {
      const m2 = lines[j].match(/^\s+(--[a-z]+=\S*)$/);
      if (m2 === null) break;
      got.push(m2[1]);
    }
    if (got.length === want) argvLines.push({ argv: got, from: `${f} (TUPLE)` });
    else console.log(`TUPLE SKIPPED ${f}: block declares ${want} arg(s), ${got.length} parsed`);
  }
}

const honestTails = new Map(); // armName -> Set(tail)
const honestFrom = new Map();
for (const { argv, from } of argvLines) {
  if (argv.some((t) => t.startsWith('--cripple='))) continue;
  const clean = argv.find((t) => t.startsWith('--clean='))?.slice('--clean='.length);
  const ctrl = argv.filter((t) => t.startsWith('--control=')).map((t) => t.slice('--control='.length));
  if (clean === undefined || !isClean(clean)) continue;
  if (ctrl.length !== 2 || !ctrl.every(isClean) || ctrl[0] === ctrl[1]) continue;
  const tail = argv.filter((t) => !t.startsWith('--map=')).join(' ');
  for (const a of argv.filter((t) => t.startsWith('--arm='))) {
    const name = a.slice('--arm='.length).split('=')[0];
    if (!honestTails.has(name)) {
      honestTails.set(name, new Set());
      honestFrom.set(name, new Set());
    }
    honestTails.get(name).add(tail);
    honestFrom.get(name).add(from);
  }
}
console.log(
  `GARGV2 ${argvLines.length} committed argv line(s) over ${outs.length} .out file(s); ` +
    `honest-configuration tails per arm: ` +
    [...honestTails].map(([k, v]) => `${k}=${v.size}`).join(' · '),
);

// ===========================================================================
// The sliced readers, for GREACH. Same slicing discipline as unit-464reach:
// the reader IS the live source bytes at the baseline rev, and the WIDE reader
// is that same text with ONE character class substituted.
// ===========================================================================
const checkerAtRev = git('show', `${BASELINE_REV}:${CHECKER_REL}`);
const sliceFn = (src, anchor, label) => {
  const lines = (src ?? '').split('\n');
  const starts = lines.map((l, i) => (l === anchor ? i : -1)).filter((i) => i >= 0);
  if (starts.length !== 1) {
    refuse('GSLICE', `${label}: anchor occurs ${starts.length}x, not once`);
    return null;
  }
  let end = -1;
  for (let j = starts[0] + 1; j < lines.length; j += 1) if (lines[j] === '};') { end = j; break; }
  if (end === -1) { refuse('GSLICE', `${label}: no terminator`); return null; }
  return lines.slice(starts[0], end + 1).join('\n');
};
const tokText = sliceFn(checkerAtRev, 'const tokensOf = (payload) => {', 'tokensOf');
const secText = sliceFn(checkerAtRev, 'const sectionFor = (mapText, armName) => {', 'sectionFor');
let tokensOf = null; let tokensOfWide = null; let sectionFor = null;
if (tokText !== null) {
  const n = tokText.split(BOUNDARY).length - 1;
  if (n !== 1) refuse('GSLICE', `boundary occurs ${n}x in the sliced tokensOf, not once`);
  else {
    // eslint-disable-next-line no-new-func
    const mk = (t) => new Function(`"use strict";\n${t}\nreturn tokensOf;`)();
    tokensOf = mk(tokText);
    tokensOfWide = mk(tokText.replace(BOUNDARY, CURED_BOUNDARY));
    console.log(`GSLICE ok  tokensOf sliced from ${CHECKER_REL} at ${BASELINE_REV.slice(0, 8)} (${tokText.length}B), boundary present exactly once`);
  }
}
if (secText !== null) {
  // eslint-disable-next-line no-new-func
  sectionFor = new Function(`"use strict";\n${secText}\nreturn sectionFor;`)();
}
// GKP on the sliced reader: reproduce the checker's OWN expectation, sliced from its source.
if (tokensOf !== null) {
  const payload = (() => {
    const recLines = readFileSync('../unit-464t2b-sat-2026-10-29/drive2.clean.out', 'utf8').split('\n');
    for (let i = 0; i < recLines.length; i += 1) {
      const m = recLines[i].slice(4).match(/^ ([A-Za-z][A-Za-z0-9_]*): /);
      if (m !== null && m[1] === 'T2bSAT') return /^ {6}\S/.test(recLines[i + 1] ?? '') ? recLines[i + 1].trim() : null;
    }
    return null;
  })();
  const expLine = (checkerAtRev ?? '').split('\n').find((l) => /kpTokens\.get\('selector'\)\s*===/.test(l)) ?? '';
  const expSel = (expLine.match(/===\s*'([^']*)'/) ?? [])[1];
  const expN = Number((expLine.match(/kpTokens\.size\s*===\s*(\d+)/) ?? [])[1]);
  if (payload === null || expSel === undefined || !Number.isFinite(expN)) {
    refuse('GKP', 'could not slice the KP payload or the checker\'s own expectation');
  } else {
    const got = tokensOf(payload);
    const ok = got.size === expN && got.get('selector') === expSel && /\s/.test(got.get('selector') ?? '');
    console.log(`GKP ${ok ? 'ok ' : 'RED'} sliced reader on the checker's own real slice: ${got.size} tokens (source wants ${expN}), selector=${JSON.stringify(got.get('selector'))} round-trips-whole=${/\s/.test(got.get('selector') ?? '')}`);
    if (!ok) refuse('GKP', 'the sliced reader does not reproduce the checker\'s own expectation');
  }
}

if (REFUSALS > 0) {
  console.log(`\nREFUSED/${REFUSALS} — no saturation figure is published; every cell is UNMEASURED.`);
  process.exit(2);
}

// ===========================================================================
// Per cell: resolve argv, GREACH, drive live + cured, price GTYPEDDEF.
// ===========================================================================
const readGate = (out) => ({
  typeddef: (out.split('\n').find((l) => l.startsWith('GTYPEDDEF ')) ?? null),
  typed: (out.split('\n').find((l) => l.startsWith('TYPED ')) ?? null),
  verdict: (out.split('\n').find((l) => l.startsWith('MAPVERDICT/')) ?? null),
});
const typedSet = (line) => {
  if (line === null) return null;
  const m = line.match(/tokensTyped=\[([^\]]*)\]/);
  if (m === null) return null;
  return m[1] === '' ? [] : m[1].split(',');
};

const results = [];
let driveN = 1;
// Counted POSITIVELY: how many cells actually REACHED the GREACH leg and passed it. The
// first version of P4 counted cells "refused for want of reach" and printed LANDS at 0
// while every cell had refused upstream and GREACH had run on none of them — a leg an
// earlier filter makes unreachable cannot be re-keyed red.
let REACH_PASSED = 0;
for (const cell of CELLS) {
  const cwd = dirname(cell.map); // repo-relative; we spawn from REPO-root-relative paths
  const mapBase = basename(cell.map);
  const tails = honestTails.get(cell.arm);
  if (tails === undefined || tails.size !== 1) {
    console.log(`CELL REFUSED ${mapBase} / ${cell.arm}: ${tails === undefined ? 0 : tails.size} honest-configuration tail(s) — never scored off a tail I chose`);
    results.push({ ...cell, refused: `${tails === undefined ? 0 : tails.size} honest tails` });
    continue;
  }
  const tail = [...tails][0].split(' ');
  // The PATH portion of each flag, which for `--arm=` is what follows the SECOND `=`.
  // First version keyed on `/^--[a-z]+=\.\.\/unit-/` over the whole token and refused all
  // 8 cells — `--arm=t8-unpinned=../unit-…` never matches that, so the gate was reading my
  // regex and not the data. Recorded in drive2.satcensus.out rather than tidied away.
  const pathOf = (t) => {
    const rest = t.slice(t.indexOf('=') + 1);
    return t.startsWith('--arm=') ? rest.slice(rest.indexOf('=') + 1) : rest;
  };
  const notSibling = tail.filter((t) => !/^\.\.\/unit-/.test(pathOf(t)));
  if (notSibling.length > 0) {
    console.log(`CELL REFUSED ${mapBase} / ${cell.arm}: ${notSibling.length} tail path(s) not sibling-relative [${notSibling.join(' ')}], so cwd=${cwd} would not resolve them`);
    results.push({ ...cell, refused: 'tail not sibling-relative' });
    continue;
  }
  const argv = [`--map=${mapBase}`, ...tail];

  // GREACH — the cure must reach THIS map's section, else a zero price is inertness.
  const mapText = readFileSync(`${REPO}/${cell.map}`, 'utf8');
  const sec = sectionFor(mapText, cell.arm);
  if (sec === null) {
    console.log(`CELL REFUSED ${mapBase} / ${cell.arm}: sectionFor returned null`);
    results.push({ ...cell, refused: 'sectionFor null' });
    continue;
  }
  const liveNames = new Set(); const wideNames = new Set();
  for (const l of sec) {
    for (const k of tokensOf(l).keys()) liveNames.add(k);
    for (const k of tokensOfWide(l).keys()) wideNames.add(k);
  }
  const adds = [...wideNames].filter((t) => !liveNames.has(t)).sort();
  const reach = adds.length > 0;
  if (reach) REACH_PASSED += 1;
  console.log(
    `GREACH ${reach ? 'ok ' : 'RED'} ${mapBase} / ${cell.arm}: section ${sec.length} line(s), ` +
      `live ${liveNames.size} name(s), wide ${wideNames.size}, wide adds ${adds.length}`,
  );
  if (!reach) {
    console.log(`CELL REFUSED ${mapBase} / ${cell.arm}: the cure adds no name here — a zero price cannot be told from an inert copy`);
    results.push({ ...cell, refused: 'GREACH: cure adds no name' });
    continue;
  }

  // Two drives, same argv, differing only in which checker binary runs.
  const run = (checker, tag) => {
    const r = spawnSync('node', [checker, ...argv], {
      cwd: `${REPO}/${cwd}`,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
    const n = String(driveN).padStart(2, '0');
    writeFileSync(`drive${n}.${tag}.out`, r.stdout ?? '');
    writeFileSync(`drive${n}.${tag}.err`, r.stderr ?? '');
    driveN += 1;
    return { out: r.stdout ?? '', status: r.status, tag: `drive${n}.${tag}` };
  };
  const tag = `${mapBase.replace(/\.md$/, '')}-${cell.arm}`;
  const a = run(`../${MY_DIR}/../unit-464mapkey-2026-10-30/grade-filed-maps.mjs`, `live-${tag}`);
  const b = run(`../${MY_DIR}/../unit-464reach-2026-10-31/grade-filed-maps.CURED.mjs`, `cured-${tag}`);

  const ga = readGate(a.out); const gb = readGate(b.out);
  const ta = typedSet(ga.typed); const tb = typedSet(gb.typed);
  if (ta === null || tb === null) {
    console.log(`CELL REFUSED ${mapBase} / ${cell.arm}: a drive published no TYPED line (live exit=${a.status} cured exit=${b.status})`);
    results.push({ ...cell, refused: 'no TYPED line published' });
    continue;
  }
  const price = tb.filter((t) => !ta.includes(t));
  const removed = ta.filter((t) => !tb.includes(t));

  // Classify each priced token: is the name real, or his §5 hyphenation-tail artefact?
  // Keyed POSITIVELY on the preceding character of every `name=` occurrence in the
  // section, and the whole histogram is printed so no class hides in a fall-through.
  const classify = (name) => {
    const hist = new Map();
    const re = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=`, 'g');
    for (const l of sec) {
      let m;
      while ((m = re.exec(l)) !== null) {
        const prev = m.index === 0 ? '^' : l[m.index - 1];
        hist.set(prev, (hist.get(prev) ?? 0) + 1);
      }
    }
    const chars = [...hist.keys()];
    const hyphen = chars.filter((c) => c === '-');
    const wordish = chars.filter((c) => /[A-Za-z0-9_.]/.test(c));
    const cls =
      chars.length === 0 ? 'NO-OCCURRENCE-IN-SECTION'
      : hyphen.length === chars.length ? 'HYPHEN-TAIL-ONLY'
      : wordish.length === chars.length ? 'WORDISH-TAIL-ONLY'
      : hyphen.length > 0 ? 'MIXED-INCLUDES-HYPHEN'
      : 'GENUINE-BOUNDARY';
    return { cls, hist: [...hist].map(([c, n]) => `${JSON.stringify(c)}x${n}`).join(' ') };
  };

  const classes = price.map((t) => ({ token: t, ...classify(t) }));
  console.log(
    `CELL ${price.length === 0 ? 'SATURATED    ' : 'NOT-SATURATED'} ${mapBase} / ${cell.arm}: ` +
      `live typed=[${ta.join(',')}] cured typed=[${tb.join(',')}]  PRICE=+[${price.join(',')}] -[${removed.join(',')}]`,
  );
  console.log(`     live  ${ga.typeddef ?? 'NO GTYPEDDEF LINE'}   |   ${ga.verdict ?? 'no verdict'}`);
  console.log(`     cured ${gb.typeddef ?? 'NO GTYPEDDEF LINE'}   |   ${gb.verdict ?? 'no verdict'}`);
  for (const c of classes) console.log(`     PRICECLASS ${c.token}: ${c.cls}  preceding-char histogram over the section: ${c.hist || '(none)'}`);
  results.push({ ...cell, argv, liveTyped: ta, curedTyped: tb, price, removed, classes, adds, secLines: sec.length });
}

// ===========================================================================
// The figure Daedalus's §7 named.
// ===========================================================================
const scored = results.filter((r) => r.refused === undefined);
const sat = scored.filter((r) => r.price.length === 0);
const notSat = scored.filter((r) => r.price.length > 0);
const refusedCells = results.filter((r) => r.refused !== undefined);

console.log(`\n=== SATURATION CENSUS over the 8 scored maps ===`);
for (const r of results) {
  console.log(
    r.refused !== undefined
      ? `  REFUSED      ${basename(r.map)} / ${r.arm}  (${r.refused})`
      : `  ${r.price.length === 0 ? 'SATURATED   ' : 'NOT-SATURATED'} ${basename(r.map)} / ${r.arm}  price=${r.price.length} [${r.price.join(',')}]`,
  );
}
console.log(
  `\nSATCOUNT  ${sat.length} saturated · ${notSat.length} NOT saturated · ${refusedCells.length} REFUSED/UNMEASURED ` +
    `of ${CELLS.length} scored map(s). The refused cells are UNMEASURED, not saturated and not 0.`,
);

const hyphenTokens = notSat.flatMap((r) => r.classes.filter((c) => c.cls === 'HYPHEN-TAIL-ONLY' || c.cls === 'MIXED-INCLUDES-HYPHEN'));
const genuineTokens = notSat.flatMap((r) => r.classes.filter((c) => c.cls === 'GENUINE-BOUNDARY' || c.cls === 'WORDISH-TAIL-ONLY' || c.cls === 'NO-OCCURRENCE-IN-SECTION'));

const P = [];
P.push({ id: 'P1', pred: 'at least one of the 8 is NOT saturated', verdict: scored.length === 0 ? 'UNMEASURED' : notSat.length >= 1 ? 'LANDS' : 'REFUTED', got: `${notSat.length} not saturated of ${scored.length} scored` });
P.push({ id: 'P2', pred: 'at least one priced token is a hyphenation-tail false positive', verdict: notSat.length === 0 ? 'UNMEASURED' : hyphenTokens.length >= 1 ? 'LANDS' : 'REFUTED', got: `${hyphenTokens.length} hyphen-involving of ${hyphenTokens.length + genuineTokens.length} priced token(s)` });
const v2cells = scored.filter((r) => basename(r.map).startsWith('V2-MAP-'));
P.push({ id: 'P3', pred: 'both V2-MAP cells have price 0', verdict: v2cells.length === 0 ? 'UNMEASURED' : v2cells.every((r) => r.price.length === 0) ? 'LANDS' : 'REFUTED', got: `${v2cells.length} V2-MAP cell(s) scored, price(s) [${v2cells.map((r) => r.price.length).join(',')}]` });
// Keyed on the leg PASSING, not on the absence of its refusal.
P.push({
  id: 'P4',
  pred: 'all 8 cells pass GREACH (|wide \\ live| > 0)',
  verdict: REACH_PASSED === CELLS.length ? 'LANDS' : REACH_PASSED === 0 ? 'UNMEASURED' : 'REFUTED',
  got: `${REACH_PASSED} of ${CELLS.length} cell(s) reached the GREACH leg and passed it`,
});
console.log('');
for (const p of P) console.log(`${p.id} ${p.verdict} — ${p.pred}: ${p.got}`);

const errs = readdirSync('.').filter((f) => f.endsWith('.err'));
const nonzero = errs.filter((f) => statSync(f).size > 0);
console.log(`\nERRCOUNT  ${errs.length} .err file(s) in this unit dir, ${nonzero.length} non-empty [${nonzero.join(',')}]  (counted with readdirSync)`);
writeFileSync('sat.json', `${JSON.stringify({ baselineRev: BASELINE_REV, results, predictions: P }, null, 2)}\n`);
console.log(`SATVERDICT/${REFUSALS === 0 ? 0 : 2} ${REFUSALS === 0 ? 'ok ' : 'REFUSED'} ${P.filter((p) => p.verdict === 'LANDS').length} of ${P.length} predictions land`);
