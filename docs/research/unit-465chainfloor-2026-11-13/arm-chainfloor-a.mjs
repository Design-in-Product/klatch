#!/usr/bin/env node
/**
 * unit-465chainfloor arm A — what my committed arm D publishes when the LIVE foil family is empty.
 *
 * Theseus named this off a read of arm D's literals and explicitly declined to half-drive it. This
 * arm drives it: a scratch tree at **the depth arm D resolves** (it reads
 * `HERE/../lib/attested-rounds.mjs`), holding a foil-emptied copy of the module beside a
 * byte-identical copy of the committed arm.
 *
 * Both inputs come from **named revs**, never the working tree:
 *   - the subject module from `--lib-rev` (the commit that landed cure 5)
 *   - the instrument from `--arm-rev` (the commit that landed arm D)
 * because this unit is about to cure the module, and a subject read from the working tree would be
 * graded post-cure under a pre-cure label.
 *
 * `drive4.armd.out` in unit-465routecure is NOT touched: the copy runs under this unit's scratch and
 * writes its own output there.
 *
 * Usage: node arm-chainfloor-a.mjs [--repo <path>] [--lib-rev <rev>] [--arm-rev <rev>] [--cure-rev <rev>]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = resolve(HERE, 'scratch', 'a');
const LIBPATH = 'docs/research/lib/attested-rounds.mjs';
const ARMPATH = 'docs/research/unit-465routecure-2026-11-13/arm-routecure-d.mjs';

const argv = process.argv.slice(2);
const pick = (f, d) => (argv.indexOf(f) === -1 ? d : argv[argv.indexOf(f) + 1]);
const REPO = resolve(pick('--repo', resolve(HERE, '..', '..', '..')));
const LIB_REV = pick('--lib-rev', '755e489f');
const ARM_REV = pick('--arm-rev', 'd8822cb6');
const CURE_REV = pick('--cure-rev', '755e489f');

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
/** Grade a pre-registered prediction. Held/refuted is recorded, never inferred from a leg colour. */
function pred(id, claim, held) {
  preds.push(id);
  if (held !== true) refuted.push(id);
  legs.push({ id: `pred:${id}`, what: claim, verdict: held === true ? 'HELD' : 'REFUTED', detail: '' });
}

function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 });
  return r.status !== 0 ? null : r.stdout;
}

/**
 * Empty the declared family, anchored on the two EXPORT STATEMENTS rather than on a blanket
 * substitution, and throw if either anchor does not match exactly once — a patch that silently did
 * not land and a guard that is genuinely dead read identically from outside (Theseus's change to
 * my own `selfTestUnder`, adopted here).
 */
function emptyTheFamily(src) {
  const once = (re, label) => {
    const hits = src.match(re);
    if (!hits || hits.length !== 1) {
      throw new Error(`cripple anchor ${label} matched ${hits ? hits.length : 0} times, not 1`);
    }
    return hits[0];
  };
  const foilsBlock = once(/export const S6_FOILS = \{[\s\S]*?\n\};/, 'S6_FOILS');
  const chainLine = once(/export const S6_FOIL_CHAIN = \[[^\]]*\];/, 'S6_FOIL_CHAIN');
  let out = src.replace(foilsBlock, 'export const S6_FOILS = {};');
  out = out.replace(chainLine, 'export const S6_FOIL_CHAIN = [];');
  if (out === src) throw new Error('the cripple did not change the source');
  return out;
}

async function main() {
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(resolve(SCRATCH, 'lib'), { recursive: true });
  mkdirSync(resolve(SCRATCH, 'unit'), { recursive: true });

  const libSrc = git(['show', `${LIB_REV}:${LIBPATH}`]);
  const armSrc = git(['show', `${ARM_REV}:${ARMPATH}`]);
  if (libSrc === null || armSrc === null) {
    console.log('CRASH — a pinned blob is missing; nothing was driven.');
    console.log('VERDICT/2 CRASH legs=0 red=[] refused=[all]');
    process.exit(2);
  }

  const crippledLib = resolve(SCRATCH, 'lib', 'attested-rounds.mjs');
  const crippledSrc = emptyTheFamily(libSrc);
  writeFileSync(crippledLib, crippledSrc);
  const armCopy = resolve(SCRATCH, 'unit', 'arm-routecure-d.mjs');
  writeFileSync(armCopy, armSrc);

  // ---------------------------------------------------------------- A0: the cripple is what I say
  await check('A0', `the cripple landed on BOTH export statements at ${LIBPATH}@${LIB_REV}`, async () => {
    const foilsEmpty = /export const S6_FOILS = \{\};/.test(crippledSrc);
    const chainEmpty = /export const S6_FOIL_CHAIN = \[\];/.test(crippledSrc);
    const noSpelling = !crippledSrc.includes('separatorTolerant:') && !crippledSrc.includes('boundaryFree:');
    return {
      ok: foilsEmpty && chainEmpty && noSpelling,
      detail: `S6_FOILS={} ${foilsEmpty} · S6_FOIL_CHAIN=[] ${chainEmpty} · neither spelling declared ${noSpelling}`,
    };
  });

  await check('A0b', `the instrument copy is BYTE-IDENTICAL to ${ARMPATH}@${ARM_REV}`, async () => {
    const same = armSrc === git(['show', `${ARM_REV}:${ARMPATH}`]);
    return { ok: same, detail: `bytes=${armSrc.length} identical=${same}` };
  });

  // ---------------------------------------------------------------- A1: Theseus's D2, under my reader
  const crippled = await import(pathToFileURL(crippledLib).href);
  const st = await check('A1', 'P1 — the EMPTIED module\'s own selfTest() returns true: all four loops are quantifiers over the declared set', async () => {
    let value;
    let thrown = null;
    try {
      value = crippled.selfTest();
    } catch (e) {
      thrown = e.message;
    }
    return { ok: thrown === null && value === true, detail: thrown ? `THREW: ${thrown}` : `selfTest() → ${value}` };
  });
  pred('P1', 'the emptied live module\'s own selfTest() returns true', st !== undefined && st.ok === true);

  await check('A1b', '…and the prose asserting the family is still present beside the emptied family (Theseus\'s D2b)', async () => {
    const present = crippledSrc.includes('Both foils are in `S6_FOILS`');
    return { ok: present, detail: `the sentence "Both foils are in \`S6_FOILS\`" present=${present}` };
  });

  // ---------------------------------------------------------------- A2: run MY arm against it
  const run = spawnSync(process.execPath, [armCopy, '--repo', REPO, '--cure-rev', CURE_REV], {
    stdio: 'pipe',
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  const out = run.stdout || '';
  writeFileSync(resolve(SCRATCH, 'armd-under-empty-chain.out'), out);
  writeFileSync(resolve(SCRATCH, 'armd-under-empty-chain.err'), run.stderr || '');
  const headline = (out.split('\n').find((l) => l.startsWith('VERDICT/')) || '').trim();
  const legLine = (id) => out.split('\n').find((l) => new RegExp(`^\\S+\\s+${id}\\s`).test(l)) || null;
  const verdictOf = (id) => {
    const l = legLine(id);
    return l ? l.trim().split(/\s+/)[0] : null;
  };

  await check('A2', 'the copied arm RAN against the crippled tree — a headline exists, so nothing below reads an absent output', async () => ({
    ok: headline !== '',
    detail: `exit=${run.status} · headline=${JSON.stringify(headline)} · stderr bytes=${(run.stderr || '').length}`,
  }));

  const d0b = await check('A3', 'P2 — D0b (\'the chain and its witnesses are distinct per link\') is GREEN on an empty array', async () => {
    const v = verdictOf('D0b');
    return { ok: v === 'green', detail: `D0b → ${v} · line=${JSON.stringify(legLine('D0b'))}` };
  });
  pred('P2', 'arm D\'s D0b leg is green under an empty chain', d0b !== undefined && d0b.ok === true);

  const perLink = await check('A4', 'P3 — ZERO per-link legs are emitted: the D1/D1b loop is bounded by CHAIN.length', async () => {
    const ids = out
      .split('\n')
      .map((l) => (l.trim().split(/\s+/)[1] || ''))
      .filter((id) => /^D1b?-/.test(id));
    return { ok: ids.length === 0, detail: `per-link legs=${ids.length} [${ids}]` };
  });
  pred('P3', 'arm D emits zero legs matching /^D1b?-/', perLink !== undefined && perLink.ok === true);

  const noRed = await check('A5', 'P4 — the instrument reports NO RED in the state §4 reaches: red=[]', async () => {
    const m = /red=\[([^\]]*)\]/.exec(headline);
    return { ok: m !== null && m[1] === '', detail: `red=[${m ? m[1] : '?'}] from ${JSON.stringify(headline)}` };
  });
  pred('P4', 'arm D\'s headline carries red=[]', noRed !== undefined && noRed.ok === true);

  const refusals = await check('A6', 'P5 — D3 and D4 are REFUSED, and their detail is the SAME string a non-landing patch yields', async () => {
    const v3 = verdictOf('D3');
    const v4 = verdictOf('D4');
    const bothRefused = v3 === 'REFUSED' && v4 === 'REFUSED';
    const sameAsNonLanding = /leg declared a refusal/.test(out);
    return {
      ok: bothRefused && sameAsNonLanding,
      detail:
        `D3 → ${v3} · D4 → ${v4} · the published detail for both is "leg declared a refusal", which is ` +
        'what selfTestUnder emits for "the edit did not land" — a dead guard and a failed patch are one row',
    };
  });
  pred('P5', 'D3 and D4 are both REFUSED via the edit-did-not-land branch', refusals !== undefined && refusals.ok === true);

  const d7 = await check('A7', 'P6 — D7 (\'the live module is green and the population has not moved\') is GREEN under the cripple', async () => {
    const v = verdictOf('D7');
    return { ok: v === 'green', detail: `D7 → ${v} · line=${JSON.stringify(legLine('D7'))}` };
  });
  pred('P6', 'D7 is green under the cripple — the reassuring leg is true BECAUSE of the vacuity', d7 !== undefined && d7.ok === true);

  const count = await check('A8', 'P7 — legs=8', async () => {
    const m = /legs=(\d+)/.exec(headline);
    return { ok: m !== null && Number(m[1]) === 8, detail: `legs=${m ? m[1] : '?'} (predicted 8: D0 D0b D3 D4 D5 D6 D7 D8)` };
  });
  pred('P7', 'arm D publishes legs=8 under the empty chain', count !== undefined && count.ok === true);

  // ---------------------------------------------------------------- A9: the control that makes A3–A8 mean anything
  await check('A9', 'CONTROL: the same arm copy against an UNCRIPPLED lib publishes the per-link legs it is missing above', async () => {
    const ctl = resolve(SCRATCH, 'ctl');
    mkdirSync(resolve(ctl, 'lib'), { recursive: true });
    mkdirSync(resolve(ctl, 'unit'), { recursive: true });
    writeFileSync(resolve(ctl, 'lib', 'attested-rounds.mjs'), libSrc);
    const ctlArm = resolve(ctl, 'unit', 'arm-routecure-d.mjs');
    writeFileSync(ctlArm, armSrc);
    const r = spawnSync(process.execPath, [ctlArm, '--repo', REPO, '--cure-rev', CURE_REV], {
      stdio: 'pipe',
      encoding: 'utf8',
      maxBuffer: 1 << 28,
    });
    const o = r.stdout || '';
    writeFileSync(resolve(SCRATCH, 'armd-control.out'), o);
    const ids = o
      .split('\n')
      .map((l) => (l.trim().split(/\s+/)[1] || ''))
      .filter((id) => /^D1b?-/.test(id));
    const h = (o.split('\n').find((l) => l.startsWith('VERDICT/')) || '').trim();
    return {
      ok: ids.length === 4,
      detail: `per-link legs=${ids.length} [${ids}] · headline=${JSON.stringify(h)}`,
    };
  });

  await check('A10', 'no gate leg is owed — packages/ and scripts/ clean', async () => {
    const s = git(['status', '--porcelain', 'packages', 'scripts']);
    if (s === null) return 'REFUSED';
    return { ok: s.trim() === '', detail: `git status --porcelain packages scripts → ${JSON.stringify(s)}` };
  });

  console.log('unit-465chainfloor arm A — my own arm D under an emptied foil family');
  console.log(`repo=${REPO}`);
  console.log(`subject  = ${LIBPATH}@${LIB_REV} (crippled: S6_FOILS={} / S6_FOIL_CHAIN=[])`);
  console.log(`instrument = ${ARMPATH}@${ARM_REV} (byte-identical copy, run with --cure-rev ${CURE_REV})`);
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
