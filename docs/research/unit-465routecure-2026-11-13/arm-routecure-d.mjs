#!/usr/bin/env node
/**
 * unit-465routecure arm D — the chain cure's own non-vacuity.
 *
 * **Additive.** Arms A/B/C and `drive1`/`drive2`/`drive3`/`drive5` are not edited and arm C is
 * **not re-driven**: it writes `drive5.standing-cell.out` under a fixed name, so re-driving it with
 * a new `--cure-rev` would re-stamp a committed recording. A separate arm is cheaper than a
 * clobbered artefact.
 *
 * Every cripple is sourced from `--cure-rev` (the commit that added `S6_FOIL_CHAIN`), never the
 * working tree and never bare `HEAD` — that was arm B's defect, named in arm C's `C1`.
 *
 * Usage: node arm-routecure-d.mjs [--repo <path>] [--cure-rev <rev>]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = resolve(HERE, 'scratch', 'd');
const MODPATH = 'docs/research/lib/attested-rounds.mjs';
const LIVE = resolve(HERE, '..', 'lib', 'attested-rounds.mjs');

const argv = process.argv.slice(2);
const pick = (f, d) => (argv.indexOf(f) === -1 ? d : argv[argv.indexOf(f) + 1]);
const REPO = resolve(pick('--repo', resolve(HERE, '..', '..', '..')));
const CURE_REV = pick('--cure-rev', '755e489f');

const legs = [];
const red = [];
const refused = [];
function record(id, what, got) {
  if (got === 'REFUSED') {
    legs.push({ id, what, verdict: 'REFUSED', detail: 'leg declared a refusal' });
    refused.push(id);
    return undefined;
  }
  const ok = got && got.ok === true;
  legs.push({ id, what, verdict: ok ? 'green' : 'RED', detail: (got && got.detail) || '' });
  if (!ok) red.push(id);
  return got;
}
async function check(id, what, fn) {
  try {
    return record(id, what, await fn());
  } catch (e) {
    legs.push({ id, what, verdict: 'REFUSED', detail: `threw: ${e.message}` });
    refused.push(id);
    return undefined;
  }
}

function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 });
  return r.status !== 0 ? null : r.stdout;
}

let tag = 0;
/** Cripple the module as committed at CURE_REV. Returns `{ thrown }`, `{ value }` or `{ refused }`. */
async function selfTestUnder(name, mutate) {
  const src = git(['show', `${CURE_REV}:${MODPATH}`]);
  if (src === null) return { refused: 'no blob at the cure rev' };
  const out = mutate(src);
  if (out === null || out === src) return { refused: 'the edit did not land' };
  const dest = resolve(SCRATCH, `d${(tag += 1)}.${name}.mjs`);
  writeFileSync(dest, out);
  let mod;
  try {
    mod = await import(pathToFileURL(dest).href);
  } catch (e) {
    return { refused: `import threw: ${e.message}`, src: out };
  }
  try {
    return { value: mod.selfTest(), src: out, mod };
  } catch (e) {
    return { thrown: e.message, src: out, mod };
  }
}

/** Drop the SOURCE_CASES entry for `p`, anchored on the entry form rather than the bare filename. */
const dropCase = (p) => (src) => {
  const line = src.split('\n').find((l) => l.includes(`'${p}'`) && /null,\s*null\s*\],?\s*$/.test(l));
  return line ? src.replace(`${line}\n`, '') : null;
};

async function main() {
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(SCRATCH, { recursive: true });

  const NOW = await import(pathToFileURL(LIVE).href);
  const CHAIN = NOW.S6_FOIL_CHAIN;
  const cases = [...NOW.SOURCE_CASES.present, ...NOW.SOURCE_CASES.synthetic];

  /** The chain witness for link i: claimed by the foil, refused by its successor (or by the live key). */
  const witnessFor = (i) => {
    const foil = NOW.S6_FOILS[CHAIN[i]];
    const next = CHAIN[i + 1] ? NOW.S6_FOILS[CHAIN[i + 1]] : null;
    const w = cases.find(
      ([p, s]) => s === null && NOW.classifyPath(p).source === null && foil.test(p) && (next === null || !next.test(p))
    );
    return w ? w[0] : null;
  };
  const witnesses = CHAIN.map((_, i) => witnessFor(i));

  // -------------------------------------------------- D0: the matched baseline
  await check('D0', `MATCHED BASELINE: the UNCRIPPLED slice@${CURE_REV} is green, so every throw below is the cripple`, async () => {
    const r = await selfTestUnder('uncrippled', (s) => `${s}\n// arm D: byte-changed, semantics untouched\n`);
    if (r.refused) return 'REFUSED';
    return { ok: r.value === true, detail: r.thrown ? `the baseline THREW: ${r.thrown}` : `selfTest() → ${r.value}` };
  });

  await check('D0b', 'the chain and its witnesses are distinct per link — nested foils, one case each', async () => ({
    ok: witnesses.every(Boolean) && new Set(witnesses).size === witnesses.length,
    detail: CHAIN.map((n, i) => `${n} → ${witnesses[i]}`).join('  ·  '),
  }));

  // -------------------------------------------------- D1/D2: each link's witness is load-bearing
  for (let i = 0; i < CHAIN.length; i += 1) {
    const name = CHAIN[i];
    const w = witnesses[i];
    // eslint-disable-next-line no-await-in-loop
    const r = w ? await selfTestUnder(`nowitness-${name}`, dropCase(w)) : { refused: 'no witness' };
    // eslint-disable-next-line no-await-in-loop
    await check(`D1-${name}`, `deleting link ${i}'s witness makes selfTest() THROW, naming ${name} (the leg arm C had RED)`, async () => {
      if (r.refused) return 'REFUSED';
      if (r.value === true) return { ok: false, detail: `still green — ${w} is deletable` };
      return { ok: new RegExp(name).test(r.thrown || ''), detail: r.thrown };
    });
    // eslint-disable-next-line no-await-in-loop
    await check(`D1b-${name}`, '…and that cripple landed on the ARRAY ENTRY, not on prose naming the same path', async () => {
      if (r.refused || !r.src) return 'REFUSED';
      const entryGone = !new RegExp(`\\['${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`).test(r.src);
      return { ok: entryGone, detail: `entry removed=${entryGone}` };
    });
  }

  // -------------------------------------------------- D3: both at once
  await check('D3', 'deleting EVERY link witness throws — no link is covered by another link\'s case', async () => {
    const r = await selfTestUnder('nowitness-all', (src) =>
      witnesses.reduce((acc, w) => (acc === null ? null : dropCase(w)(acc)), src)
    );
    if (r.refused) return 'REFUSED';
    return { ok: r.value !== true, detail: r.thrown || `still green: ${r.value}` };
  });

  // -------------------------------------------------- D4: the order check is DOMINATED, not a second guard
  await check('D4', 'misordering the chain throws — but via the WITNESS check, so the order check is dominated at length 2', async () => {
    const r = await selfTestUnder('misordered', (s) =>
      s.includes(`export const S6_FOIL_CHAIN = ['${CHAIN[0]}', '${CHAIN[1]}'];`)
        ? s.replace(
            `export const S6_FOIL_CHAIN = ['${CHAIN[0]}', '${CHAIN[1]}'];`,
            `export const S6_FOIL_CHAIN = ['${CHAIN[1]}', '${CHAIN[0]}'];`
          )
        : null
    );
    if (r.refused) return 'REFUSED';
    if (r.value === true) return { ok: false, detail: 'a misordered chain is green — neither guard fires' };
    const viaWitness = /has no witness that/.test(r.thrown);
    const viaOrder = /misordered/.test(r.thrown);
    return {
      ok: viaWitness === true && viaOrder === false,
      detail:
        `${r.thrown}\n         → fired by the witness check=${viaWitness}, by the order check=${viaOrder}. ` +
        'For a 2-link NESTED chain the order check cannot fire: the witness loop runs first and the narrow ' +
        'foil has no path the wide one refuses. It is kept for chains of 3+ or non-nested foils, and this ' +
        'leg is the record that it is dominated today rather than a second independent guard.',
    };
  });

  // -------------------------------------------------- D5: chain coverage is load-bearing
  await check('D5', 'adding a foil WITHOUT adding it to the chain throws, naming the permutation check', async () => {
    const anchor = '  boundaryFree: /^docs\\/mail\\/.*round(\\d+)/i,\n';
    const r = await selfTestUnder('uncovered-foil', (s) =>
      s.includes(anchor) ? s.replace(anchor, `${anchor}  invented: /^docs\\/mail\\/.*r0und(\\d+)/i,\n`) : null
    );
    if (r.refused) return 'REFUSED';
    if (r.value === true) return { ok: false, detail: 'a foil outside the chain is green — the coverage check is vacuous' };
    return { ok: /not a permutation/.test(r.thrown), detail: r.thrown };
  });

  // -------------------------------------------------- D6: the §1 cure is intact under the chain cure
  const repro = await NOW.reproduceFloorReading(REPO);
  await check('D6', 'the pin STILL reproduces through the function after this second cure landed (P13 again)', async () => {
    if (repro === null) return 'REFUSED';
    return {
      ok: repro.ok === true,
      detail: `ok=${repro.ok} got paths=${repro.got.paths} outside=[${repro.got.outside}] · want paths=${repro.want.paths} outside=[${repro.want.outside}]`,
    };
  });

  await check('D7', 'the live module is green and the population has not moved', async () => {
    const st = NOW.selfTest();
    const pop = NOW.attestedRounds(REPO, 'HEAD');
    if (pop === null) return 'REFUSED';
    return { ok: st === true && pop.filtered.size === 466, detail: `selfTest()=${st} |filtered|=${pop.filtered.size}` };
  });

  await check('D8', 'no gate leg is owed — packages/ and scripts/ clean', async () => {
    const s = git(['status', '--porcelain', 'packages', 'scripts']);
    if (s === null) return 'REFUSED';
    return { ok: s.trim() === '', detail: `git status --porcelain packages scripts → ${JSON.stringify(s)}` };
  });

  console.log('unit-465routecure arm D — the chain cure\'s own non-vacuity');
  console.log(`repo=${REPO}`);
  console.log(`cripple source = ${MODPATH}@${CURE_REV} (committed; never the working tree, never bare HEAD)`);
  console.log(`chain = [${CHAIN}]`);
  console.log('');
  for (const l of legs) {
    console.log(`${l.verdict.padEnd(8)} ${l.id.padEnd(26)} ${l.what}`);
    if (l.detail) console.log(`         ${l.detail}`);
  }
  console.log('');
  console.log(
    `VERDICT/${red.length || refused.length ? 1 : 0} ${red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN'} ` +
      `legs=${legs.length} red=[${red}] refused=[${refused}]`
  );
  process.exit(red.length || refused.length ? 1 : 0);
}

main().catch((e) => {
  console.log(`CRASH — the arm itself failed: ${e.stack}`);
  console.log('VERDICT/1 CRASH legs=0 red=[] refused=[all]');
  process.exit(2);
});
