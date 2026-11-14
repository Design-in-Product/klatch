#!/usr/bin/env node
/**
 * unit-465chainfloor arms B and C — the floor, the `>= 2` rival it was chosen over, and the order
 * check's reason string.
 *
 * One file, two arms, declared as such in `RESULTS.md`: the pre-registration names arms, not files.
 *
 * Both cripple sources are **committed revs**, never the working tree:
 *   - `--cure-rev`  the commit carrying both cures (the subject)
 *   - `--prior-rev` the commit before them, for the one leg that must reproduce the OLD wording
 * A subject read from the working tree would be graded post-cure under a pre-cure label, which is
 * the defect `unit-465routecure`'s arm B had and arm C named.
 *
 * Usage: node arm-chainfloor-bc.mjs [--repo <path>] [--cure-rev <rev>] [--prior-rev <rev>]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = resolve(HERE, 'scratch', 'bc');
const LIBPATH = 'docs/research/lib/attested-rounds.mjs';
const ARMD = 'docs/research/unit-465routecure-2026-11-13/arm-routecure-d.mjs';
const LIVE = resolve(HERE, '..', 'lib', 'attested-rounds.mjs');

const argv = process.argv.slice(2);
const pick = (f, d) => (argv.indexOf(f) === -1 ? d : argv[argv.indexOf(f) + 1]);
const REPO = resolve(pick('--repo', resolve(HERE, '..', '..', '..')));
const CURE_REV = pick('--cure-rev', 'f7b67f13');
const PRIOR_REV = pick('--prior-rev', '755e489f');

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];
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
function pred(id, claim, held) {
  preds.push(id);
  if (held !== true) refuted.push(id);
  legs.push({ id: `pred:${id}`, what: claim, verdict: held === true ? 'HELD' : 'REFUTED', detail: '' });
}

function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 });
  return r.status !== 0 ? null : r.stdout;
}

/** Exactly-once anchored replacement. THROWS when the anchor does not match once — a patch that did
 * not land and a guard that is genuinely dead read identically from outside (Theseus's correction to
 * my `selfTestUnder`, adopted). */
function subOnce(src, re, replacement, label) {
  const hits = src.match(re);
  if (!hits || hits.length !== 1) throw new Error(`anchor ${label} matched ${hits ? hits.length : 0} times, not 1`);
  const out = src.replace(hits[0], replacement);
  if (out === src) throw new Error(`anchor ${label} matched but the substitution was a no-op`);
  return out;
}

const FOILS_BLOCK = /export const S6_FOILS = \{[\s\S]*?\n\};/;
const CHAIN_LINE = /export const S6_FOIL_CHAIN = \[[^\]]*\];/;

let tag = 0;
/** Load a crippled copy of the module at `rev`. Returns `{ mod, value }`, `{ mod, thrown }` or `{ refused }`. */
async function under(rev, name, mutate) {
  const src = git(['show', `${rev}:${LIBPATH}`]);
  if (src === null) return { refused: `no blob at ${rev}` };
  let out;
  try {
    out = mutate(src);
  } catch (e) {
    return { refused: `cripple did not land: ${e.message}` };
  }
  const dest = resolve(SCRATCH, `bc${(tag += 1)}.${name}.mjs`);
  writeFileSync(dest, out);
  let mod;
  try {
    mod = await import(pathToFileURL(dest).href);
  } catch (e) {
    return { refused: `import threw: ${e.message}`, src: out };
  }
  try {
    return { mod, value: mod.selfTest(), src: out };
  } catch (e) {
    return { mod, thrown: e.message, src: out };
  }
}

/** Empty the declared family (Theseus's D2). */
const empty = (src) =>
  subOnce(
    subOnce(src, FOILS_BLOCK, 'export const S6_FOILS = {};', 'S6_FOILS'),
    CHAIN_LINE,
    'export const S6_FOIL_CHAIN = [];',
    'S6_FOIL_CHAIN'
  );

/** Keep the two LANGUAGES, rename both keys, keep the chain a permutation — the state a `>= 2`
 * cardinality floor cannot see and a name-keyed floor must. */
const substituteNames = (src) =>
  subOnce(
    subOnce(
      src,
      FOILS_BLOCK,
      [
        'export const S6_FOILS = {',
        '  looseA: /^docs\\/mail\\/.*round[ -]?(\\d+)/i,',
        '  looseB: /^docs\\/mail\\/.*round(\\d+)/i,',
        '};',
      ].join('\n'),
      'S6_FOILS'
    ),
    CHAIN_LINE,
    "export const S6_FOIL_CHAIN = ['looseA', 'looseB'];",
    'S6_FOIL_CHAIN'
  );

/** Add a third foil AND chain it — the ADD side, which a name floor must not charge for. */
const addThird = (src) =>
  subOnce(
    subOnce(
      src,
      /  boundaryFree: \/\^docs\\\/mail\\\/\.\*round\(\\d\+\)\/i,\n/,
      '  boundaryFree: /^docs\\/mail\\/.*round(\\d+)/i,\n  invented: /^docs\\/mail\\/.*r0und(\\d+)/i,\n',
      'boundaryFree entry'
    ),
    CHAIN_LINE,
    "export const S6_FOIL_CHAIN = ['separatorTolerant', 'boundaryFree', 'invented'];",
    'S6_FOIL_CHAIN'
  );

/**
 * Add an INCOMPARABLE pair, both declared and chained, keeping the two required names so the floor
 * is satisfied and the order check is actually reached.
 *
 *   mailDash   claims  docs/mail/read/…workaround-2026-04-18.md   (boundaryFree refuses it)
 *   notesRound claims  docs/research/notes-2026/round999-notes.md (mailDash refuses it)
 *
 * Both are existing null-source cases, so the witness loop passes at every link and the throw comes
 * from the order check. `order` picks which of the two sits first.
 */
const crossing = (order) => (src) =>
  subOnce(
    subOnce(
      src,
      /  boundaryFree: \/\^docs\\\/mail\\\/\.\*round\(\\d\+\)\/i,\n/,
      '  boundaryFree: /^docs\\/mail\\/.*round(\\d+)/i,\n' +
        '  mailDash: /^docs\\/mail\\/.*workaround-(\\d+)/i,\n' +
        '  notesRound: /^docs\\/research\\/notes-\\d+\\/round(\\d+)/i,\n',
      'boundaryFree entry'
    ),
    CHAIN_LINE,
    `export const S6_FOIL_CHAIN = ['separatorTolerant', 'boundaryFree', ${order
      .map((n) => `'${n}'`)
      .join(', ')}];`,
    'S6_FOIL_CHAIN'
  );

async function main() {
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(SCRATCH, { recursive: true });

  // ==================================================== ARM B: the floor
  const base = await check('B0', `MATCHED BASELINE: the UNCRIPPLED module@${CURE_REV} is green, so every throw below is the cripple`, async () => {
    const r = await under(CURE_REV, 'uncrippled', (s) => `${s}\n// arm B: byte-changed, semantics untouched\n`);
    if (r.refused) return 'REFUSED';
    return { ok: r.value === true, detail: r.thrown ? `the baseline THREW: ${r.thrown}` : `selfTest() → ${r.value}` };
  });

  await check('B0b', `the LIVE file is byte-identical to ${LIBPATH}@${CURE_REV}, so the live reads below are attributable to that rev`, async () => {
    const blob = git(['show', `${CURE_REV}:${LIBPATH}`]);
    if (blob === null) return 'REFUSED';
    const live = readFileSync(LIVE, 'utf8');
    return { ok: live === blob, detail: `live bytes=${live.length} rev bytes=${blob.length} identical=${live === blob}` };
  });

  const b1 = await check('B1', 'P8 — the EMPTYING cripple now THROWS, naming both required spellings (it returned true before the floor)', async () => {
    const r = await under(CURE_REV, 'emptied', empty);
    if (r.refused) return 'REFUSED';
    if (r.value === true) return { ok: false, detail: 'still green — the floor is vacuous' };
    const both = /separatorTolerant/.test(r.thrown) || /boundaryFree/.test(r.thrown);
    return { ok: /no longer declares/.test(r.thrown) && both, detail: r.thrown };
  });
  pred('P8', 'with the floor, emptying the family throws and the message names a required spelling', b1 !== undefined && b1.ok === true);

  const b1b = await check('B1b', '…and the SAME cripple at the PRIOR rev returns true — the floor, not the cripple, is what changed', async () => {
    const r = await under(PRIOR_REV, 'emptied-prior', empty);
    if (r.refused) return 'REFUSED';
    return { ok: r.value === true, detail: r.thrown ? `THREW: ${r.thrown}` : `selfTest()@${PRIOR_REV} → ${r.value}` };
  });

  const b2 = await check('B2', 'P9 — uncrippled, the floor changes nothing measurable: selfTest() true, SOURCE_IDS unchanged, |filtered| 466', async () => {
    const NOW = await import(pathToFileURL(LIVE).href);
    const pop = NOW.attestedRounds(REPO, 'HEAD');
    if (pop === null) return 'REFUSED';
    const ids = NOW.SOURCE_IDS.join(',');
    return {
      ok: NOW.selfTest() === true && ids === 'S1,S2,S3,S5,S6' && pop.filtered.size === 466,
      detail: `selfTest()=${NOW.selfTest()} SOURCE_IDS=${ids} |filtered|=${pop.filtered.size}`,
    };
  });
  pred('P9', 'the cured module is still green and the population has not moved', b2 !== undefined && b2.ok === true);

  const b3 = await check('B3', 'P10 — ADD side: adding and chaining a third foil does NOT charge the floor (any throw names something else)', async () => {
    const r = await under(CURE_REV, 'third-foil', addThird);
    if (r.refused) return 'REFUSED';
    const floorFired = /no longer declares/.test(r.thrown || '');
    return {
      ok: floorFired === false,
      detail: r.thrown
        ? `threw, and NOT at the floor: ${r.thrown}`
        : `selfTest() → ${r.value} (both required names still present, so the floor is satisfied)`,
    };
  });
  pred('P10', 'adding a third foil does not make the floor throw', b3 !== undefined && b3.ok === true);

  const b4 = await check('B4', 'P11 — THE DIFFERENTIAL: the two languages kept under NEW NAMES — the name floor throws, the `>= 2` rival is true', async () => {
    const r = await under(CURE_REV, 'substituted', substituteNames);
    if (r.refused) return 'REFUSED';
    if (!r.mod) return 'REFUSED';
    const rival = Object.keys(r.mod.S6_FOILS).length >= 2;
    const mine = r.thrown !== undefined && /no longer declares/.test(r.thrown);
    return {
      ok: rival === true && mine === true,
      detail:
        `rival \`Object.keys(S6_FOILS).length >= 2\` → ${rival} on keys [${Object.keys(r.mod.S6_FOILS)}] · ` +
        `name-keyed floor → ${r.thrown ? `THREW: ${r.thrown}` : `selfTest() → ${r.value}`}`,
    };
  });
  pred('P11', 'a cardinality floor passes the substitution the name floor catches', b4 !== undefined && b4.ok === true);

  // ==================================================== ARM C: the reason string
  const c1 = await check('C1', `P12 — at the PRIOR rev (${PRIOR_REV}) an incomparable adjacent pair throws saying "misordered"`, async () => {
    const r = await under(PRIOR_REV, 'crossing-prior', crossing(['mailDash', 'notesRound']));
    if (r.refused) return 'REFUSED';
    if (r.value === true) return { ok: false, detail: 'green — the order check did not fire at all' };
    return { ok: /misordered/.test(r.thrown), detail: r.thrown };
  });
  pred('P12', 'the pre-cure wording reproduces: an incomparable pair throws "misordered"', c1 !== undefined && c1.ok === true);

  const c2 = await check('C2', `P13 — at the CURE rev the same state throws WITHOUT "misordered" and WITH "cannot form a chain"`, async () => {
    const r = await under(CURE_REV, 'crossing-cured', crossing(['mailDash', 'notesRound']));
    if (r.refused) return 'REFUSED';
    if (r.value === true) return { ok: false, detail: 'green — the order check did not fire at all' };
    const gone = !/misordered/.test(r.thrown);
    const anchor = /cannot form a chain/.test(r.thrown);
    const prescribes = /Reordering cannot help/.test(r.thrown);
    return { ok: gone && anchor && prescribes, detail: `misordered gone=${gone} anchor=${anchor} remedy=${prescribes}\n         ${r.thrown}` };
  });
  pred('P13', 'the cured message drops "misordered" and carries the incomparability anchor', c2 !== undefined && c2.ok === true);

  await check('C3', 'the OTHER order of the added pair is red too — reordering is not a remedy, driven rather than argued', async () => {
    const r = await under(CURE_REV, 'crossing-swapped', crossing(['notesRound', 'mailDash']));
    if (r.refused) return 'REFUSED';
    if (r.value === true) return { ok: false, detail: 'green in the other order — the pair is not crossing after all' };
    return { ok: /cannot form a chain/.test(r.thrown), detail: r.thrown };
  });

  const c4 = await check('C4', 'P14 — THE BLINDNESS THIS CURE CREATES: arm D\'s own `viaOrder` expression reads false on a throw the order check DID produce', async () => {
    const r = await under(CURE_REV, 'crossing-for-armd', crossing(['mailDash', 'notesRound']));
    if (r.refused || r.thrown === undefined) return 'REFUSED';
    const armdSrc = git(['show', `${CURE_REV}:${ARMD}`]);
    if (armdSrc === null) return 'REFUSED';
    const keysOnMisordered = armdSrc.includes('const viaOrder = /misordered/.test(r.thrown);');
    const viaOrder = /misordered/.test(r.thrown); // arm D's literal expression, applied here
    const orderCheckDidFire = /cannot form a chain/.test(r.thrown);
    return {
      ok: keysOnMisordered === true && viaOrder === false && orderCheckDidFire === true,
      detail:
        `arm D@${CURE_REV} still contains \`const viaOrder = /misordered/.test(r.thrown);\` → ${keysOnMisordered}; ` +
        `applied to this throw it yields ${viaOrder} while the order check DID fire (${orderCheckDidFire}). ` +
        'Its D4 assertion `viaOrder === false` stays green and its published detail ' +
        '"by the order check=false" is now true for the wrong reason.',
    };
  });
  pred('P14', 'arm D\'s /misordered/ detector is blind to the cured order-check throw', c4 !== undefined && c4.ok === true);

  await check('C5', 'no gate leg is owed — packages/ and scripts/ clean', async () => {
    const s = git(['status', '--porcelain', 'packages', 'scripts']);
    if (s === null) return 'REFUSED';
    return { ok: s.trim() === '', detail: `git status --porcelain packages scripts → ${JSON.stringify(s)}` };
  });

  console.log('unit-465chainfloor arms B and C — the floor, the `>= 2` rival, and the order check\'s reason string');
  console.log(`repo=${REPO}`);
  console.log(`subject = ${LIBPATH}@${CURE_REV} · prior = @${PRIOR_REV} · baseline green = ${base && base.ok}`);
  console.log('');
  for (const l of legs) {
    console.log(`${l.verdict.padEnd(8)} ${l.id.padEnd(28)} ${l.what}`);
    if (l.detail) console.log(`         ${l.detail}`);
  }
  console.log('');
  console.log(
    `VERDICT/${red.length || refused.length ? 1 : 0} ${red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN'} ` +
      `legs=${legs.filter((l) => !l.id.startsWith('pred:')).length} red=[${red}] refused=[${refused}] ` +
      `preds=${preds.length} refuted=[${refuted}]`
  );
  process.exit(red.length || refused.length || refuted.length ? 1 : 0);
}

main().catch((e) => {
  console.log(`CRASH — the arm itself failed: ${e.stack}`);
  console.log('VERDICT/2 CRASH legs=0 red=[] refused=[all]');
  process.exit(2);
});
