#!/usr/bin/env node
/**
 * unit-465foilchain arm A — grading Daedalus's cure 5 (`S6_FOIL_CHAIN`) and its declared limit.
 *
 * Subject: `docs/research/lib/attested-rounds.mjs` at `--src-rev` (default `a5667195`, the rev this
 * seat read). **Nothing here edits the live module.** Every cripple is a textual patch over a blob
 * sourced from `git show <src-rev>:`, written under `scratch/a/` (git-ignored) and imported there.
 *
 * The cripple machinery is Daedalus's own, from `unit-465routecure-2026-11-13/arm-routecure-d.mjs`
 * (`selfTestUnder` / `dropCase`), adopted rather than re-invented — with the landing check made an
 * explicit per-arm leg instead of a silent `{refused}`, because a cripple that did not land and a
 * guard that is genuinely dead read the same from the outside.
 *
 * Usage: node arm-foilchain-a.mjs [--repo <path>] [--src-rev <rev>]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = resolve(HERE, 'scratch', 'a');
const MODPATH = 'docs/research/lib/attested-rounds.mjs';
const LIVE = resolve(HERE, '..', 'lib', 'attested-rounds.mjs');

const argv = process.argv.slice(2);
const pick = (f, d) => (argv.indexOf(f) === -1 ? d : argv[argv.indexOf(f) + 1]);
const REPO = resolve(pick('--repo', resolve(HERE, '..', '..', '..')));
const SRC_REV = pick('--src-rev', 'a5667195');

const legs = [];
const red = [];
const refused = [];
const preds = [];
function record(id, what, got) {
  if (got === 'REFUSED') {
    legs.push({ id, what, verdict: 'REFUSED', detail: (got && got.detail) || 'leg declared a refusal' });
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
const got = (id) => legs.find((l) => l.id === id);
const isGreen = (id) => Boolean(got(id) && got(id).verdict === 'green');
function pred(id, what, landed) {
  preds.push({ id, what, landed });
}

function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 });
  return r.status !== 0 ? null : r.stdout;
}

/** Replace exactly one match, or throw. This is the landing check, not a comment about one. */
function patchOnce(src, re, to, label) {
  const hits = src.match(new RegExp(re.source, `${re.flags.replace('g', '')}g`));
  if (!hits || hits.length !== 1) {
    throw new Error(`patch "${label}" matched ${hits ? hits.length : 0} times, expected exactly 1`);
  }
  return src.replace(re, to);
}

const FOILS_RE = /export const S6_FOILS = \{[\s\S]*?\n\};/;
const CHAIN_RE = /export const S6_FOIL_CHAIN = \[[^\]]*\];/;
const SYNTH_RE = /synthetic: \[\n/;

const setFoils = (body) => (s) =>
  patchOnce(s, FOILS_RE, `export const S6_FOILS = {\n${body}\n};`, 'S6_FOILS block');
const setChain = (arr) => (s) =>
  patchOnce(s, CHAIN_RE, `export const S6_FOIL_CHAIN = ${JSON.stringify(arr).replace(/"/g, "'")};`, 'S6_FOIL_CHAIN');
const addSynthetic = (p) => (s) =>
  patchOnce(s, SYNTH_RE, `synthetic: [\n    [${JSON.stringify(p)}, null, null],\n`, 'synthetic case');
const compose = (...fns) => (s) => fns.reduce((acc, f) => f(acc), s);

/** Drop the SOURCE_CASES entry for `p`, anchored on the entry FORM, not the bare filename. */
const dropCase = (p) => (src) => {
  const line = src.split('\n').find((l) => l.includes(`'${p}'`) && /null,\s*null\s*\],?\s*$/.test(l));
  if (!line) throw new Error(`no [${p}, null, null] case line to drop`);
  return src.replace(`${line}\n`, '');
};

let tag = 0;
let SRC = null;
/** `{ thrown }` | `{ value }` | `{ refused }`. Sourced from a COMMITTED rev, never the working tree. */
async function selfTestUnder(name, mutate) {
  if (SRC === null) return { refused: 'no blob at the source rev' };
  let out;
  try {
    out = mutate(SRC);
  } catch (e) {
    return { refused: `the patch did not land: ${e.message}` };
  }
  if (out === SRC) return { refused: 'the edit did not land — output is byte-identical' };
  const dest = resolve(SCRATCH, `a${(tag += 1)}.${name}.mjs`);
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

const SEP = "  separatorTolerant: /^docs\\/mail\\/.*round[ -]?(\\d+)/i,";
const BF = "  boundaryFree: /^docs\\/mail\\/.*round(\\d+)/i,";
const WO = "  workaroundOnly: /^docs\\/mail\\/.*workaround(\\d+)/i,";
const DASH = "  mailDash: /^docs\\/mail\\/.*round-(\\d+)/i,";
const RESR = "  researchRound: /^docs\\/research\\/[^\\/]*\\/round(\\d+)/i,";
const TURN = 'docs/mail/read/x-turnaround2026-04-18.md';

async function main() {
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(SCRATCH, { recursive: true });

  SRC = git(['show', `${SRC_REV}:${MODPATH}`]);
  const liveSha = git(['hash-object', LIVE]);
  const revSha = git(['rev-parse', `${SRC_REV}:${MODPATH}`]);

  // ---------------------------------------------------------------- provenance
  await check('A-src', `the graded blob is the LIVE file: hash-object(worktree) == ${SRC_REV}:${MODPATH}`, async () => {
    if (SRC === null) return 'REFUSED';
    return {
      ok: Boolean(liveSha && revSha) && liveSha.trim() === revSha.trim(),
      detail: `worktree=${(liveSha || '?').trim().slice(0, 12)} ${SRC_REV}=${(revSha || '?').trim().slice(0, 12)}`,
    };
  });
  await check('A-marker', 'the sourced bytes actually contain the cure under grade (S6_FOIL_CHAIN + the witness loop)', async () => ({
    ok: SRC !== null && SRC.includes('export const S6_FOIL_CHAIN') && SRC.includes('has no witness that'),
    detail: `S6_FOIL_CHAIN=${SRC !== null && SRC.includes('export const S6_FOIL_CHAIN')} witnessLoop=${SRC !== null && SRC.includes('has no witness that')}`,
  }));

  // ---------------------------------------------------------------- A0: matched baseline
  const a0 = await selfTestUnder('baseline', (s) => `${s}\n// arm A: byte-changed, semantics untouched\n`);
  await check('A0', 'MATCHED BASELINE: the uncrippled slice is green, so every throw below is the cripple', async () => {
    if (a0.refused) return 'REFUSED';
    return { ok: a0.value === true, detail: a0.thrown ? `the baseline THREW: ${a0.thrown}` : `selfTest() → ${a0.value}` };
  });
  pred('P1', 'A0 baseline green', isGreen('A0'));

  // ---------------------------------------------------------------- A1/A2: his D1, reproduced
  const a1 = await selfTestUnder('nowitness-sep', dropCase('docs/mail/read/calliope-to-dispatch-ssh443-workaround-2026-04-18.md'));
  await check('A1', "deleting separatorTolerant's witness throws, naming it and boundaryFree (reproduces his D1)", async () => {
    if (a1.refused) return 'REFUSED';
    if (a1.value === true) return { ok: false, detail: 'still green — the witness case is deletable' };
    const m = a1.thrown || '';
    return {
      ok: m.includes('S6_FOILS.separatorTolerant') && m.includes('has no witness') && m.includes('boundaryFree'),
      detail: m,
    };
  });
  pred('P2', "A1 throws naming separatorTolerant/boundaryFree", isGreen('A1'));

  const a2 = await selfTestUnder('nowitness-bf', dropCase('docs/mail/read/calliope-to-dispatch-ssh443-workaround2026-04-18.md'));
  await check('A2', "deleting boundaryFree's witness throws, naming it and the LIVE key as the refuser", async () => {
    if (a2.refused) return 'REFUSED';
    if (a2.value === true) return { ok: false, detail: 'still green — the witness case is deletable' };
    const m = a2.thrown || '';
    return { ok: m.includes('S6_FOILS.boundaryFree') && m.includes('the live key'), detail: m };
  });
  pred('P3', 'A2 throws naming boundaryFree and the live key', isGreen('A2'));

  // ---------------------------------------------------------------- A3: his D4 at length 2
  const a3 = await selfTestUnder('reversed-2', setChain(['boundaryFree', 'separatorTolerant']));
  await check('A3', 'a REVERSED 2-chain throws via the WITNESS check, not the order check (reproduces his D4)', async () => {
    if (a3.refused) return 'REFUSED';
    if (a3.value === true) return { ok: false, detail: 'still green — a misordered chain is undetected' };
    const m = a3.thrown || '';
    return { ok: m.includes('has no witness') && !m.includes('misordered'), detail: m };
  });
  pred('P4', 'A3 throws via the witness check and never says misordered', isGreen('A3'));

  // ---------------------------------------------------------------- B: three NESTED foils
  const bFoils = [SEP, BF, WO].join('\n');
  const b0 = await selfTestUnder('nested3-ordered', compose(setFoils(bFoils), setChain(['separatorTolerant', 'boundaryFree', 'workaroundOnly']), addSynthetic(TURN)));
  await check('B0', 'BASELINE for B: three strictly nested foils in the CORRECT order are green', async () => {
    if (b0.refused) return 'REFUSED';
    return { ok: b0.value === true, detail: b0.thrown ? `THREW: ${b0.thrown}` : `selfTest() → ${b0.value}` };
  });
  pred('P5', 'B0 green — the manufactured 3-link state is otherwise healthy', isGreen('B0'));

  const b1 = await selfTestUnder('nested3-misordered', compose(setFoils(bFoils), setChain(['separatorTolerant', 'workaroundOnly', 'boundaryFree']), addSynthetic(TURN)));
  await check('B1', 'THE FINDING: a MISORDERED 3-chain of nested foils still throws via the WITNESS check, never the order check', async () => {
    if (b1.refused) return 'REFUSED';
    if (b1.value === true) return { ok: false, detail: 'green — neither guard fired' };
    const m = b1.thrown || '';
    return {
      ok: m.includes('has no witness') && m.includes('workaroundOnly') && !m.includes('misordered'),
      detail: m,
    };
  });
  pred('P6', 'B1 throws via the witness check at length 3 — "kept for 3+" is false for nested foils', isGreen('B1'));

  // ---------------------------------------------------------------- C: a CROSSING pair, both orders
  const cFoils = [DASH, RESR].join('\n');
  const c1 = await selfTestUnder('crossing-ab', compose(setFoils(cFoils), setChain(['mailDash', 'researchRound'])));
  await check('C1', 'a CROSSING pair reaches the order check: order [mailDash, researchRound] throws "misordered"', async () => {
    if (c1.refused) return 'REFUSED';
    if (c1.value === true) return { ok: false, detail: 'green — the order check did not fire' };
    return { ok: (c1.thrown || '').includes('misordered'), detail: c1.thrown };
  });
  pred('P7', 'C1 throws "misordered"', isGreen('C1'));

  const c2 = await selfTestUnder('crossing-ba', compose(setFoils(cFoils), setChain(['researchRound', 'mailDash'])));
  await check('C2', 'THE FINDING: the SWAPPED crossing pair throws "misordered" too — both permutations are red', async () => {
    if (c2.refused) return 'REFUSED';
    if (c2.value === true) return { ok: false, detail: 'green — this order satisfies the check' };
    return { ok: (c2.thrown || '').includes('misordered'), detail: c2.thrown };
  });
  pred('P8', 'C2 throws "misordered" as well — no order satisfies the only family that reaches the check', isGreen('C2'));

  // ---------------------------------------------------------------- D: the population has no floor
  const d1 = await selfTestUnder('one-foil', compose(setFoils(BF), setChain(['boundaryFree'])));
  await check('D1', 'REMOVING a foil (separatorTolerant) from both the object and the chain leaves selfTest() GREEN', async () => {
    if (d1.refused) return 'REFUSED';
    return { ok: d1.value === true, detail: d1.thrown ? `THREW: ${d1.thrown}` : `selfTest() → ${d1.value}` };
  });
  pred('P9', 'D1 green — one foil can be removed with everything green', isGreen('D1'));

  const d2 = await selfTestUnder('no-foils', compose(setFoils('  // every foil removed'), setChain([])));
  await check('D2', 'THE FINDING: S6_FOILS = {} with an empty chain is GREEN — the foil POPULATION has no floor', async () => {
    if (d2.refused) return 'REFUSED';
    return { ok: d2.value === true, detail: d2.thrown ? `THREW: ${d2.thrown}` : `selfTest() → ${d2.value}` };
  });
  await check('D2b', 'and the same crippled text still carries classifyPath\'s sentence that both foils are in S6_FOILS', async () => {
    if (d2.refused || !d2.src) return 'REFUSED';
    const sentence = 'Both foils are in `S6_FOILS`';
    return {
      ok: d2.src.includes(sentence) && !d2.src.includes('separatorTolerant:'),
      detail: `sentence present=${d2.src.includes(sentence)} · any foil declared=${d2.src.includes('separatorTolerant:') || d2.src.includes('boundaryFree:')}`,
    };
  });
  pred('P10', 'D2 green AND D2b — green with a live false sentence', isGreen('D2') && isGreen('D2b'));

  await check('D3', 'census: no committed consumer of S6_FOILS/S6_FOIL_CHAIN outside the module, this unit and his own unit', async () => {
    const hits = git(['grep', '-l', '-E', 'S6_FOILS|S6_FOIL_CHAIN', SRC_REV]);
    if (hits === null) return 'REFUSED';
    const files = hits.trim().split('\n').map((l) => l.replace(`${SRC_REV}:`, ''));
    const outside = files.filter(
      (f) => f !== MODPATH && !f.startsWith('docs/research/unit-465routecure-2026-11-13/')
        && !f.startsWith('docs/research/unit-465foilchain-2026-11-13/') && !f.startsWith('docs/mail/')
    );
    return { ok: outside.length === 0, detail: `${files.length} file(s) name them; outside=[${outside}]` };
  });
  pred('P11', 'D3 — nothing outside the module and the two units would redden on D1/D2', isGreen('D3'));

  // ---------------------------------------------------------------- landing + gate
  await check('A-land', 'every cripple LANDED: no leg above is a silent patch failure', async () => {
    const refusals = legs.filter((l) => l.verdict === 'REFUSED' && /did not land|patch/.test(l.detail || ''));
    return { ok: refusals.length === 0, detail: `patch-shaped refusals=${refusals.length}` };
  });
  pred('P12', 'A-land — every patch applied exactly once', isGreen('A-land'));

  await check('A-gate', 'no gate leg is owed — the live module, packages/ and scripts/ are clean', async () => {
    const s = git(['status', '--porcelain', 'docs/research/lib', 'packages', 'scripts']);
    if (s === null) return 'REFUSED';
    return { ok: s.trim() === '', detail: `git status --porcelain docs/research/lib packages scripts → ${JSON.stringify(s)}` };
  });
  pred('P13', 'A-gate — the live module is unedited by this unit', isGreen('A-gate'));

  console.log("unit-465foilchain arm A — Daedalus's cure 5 (S6_FOIL_CHAIN) and its declared limit D4");
  console.log(`repo=${REPO}`);
  console.log(`cripple source = ${MODPATH}@${SRC_REV} (committed; never the working tree)`);
  console.log(`scratch = ${SCRATCH} (git check-ignore'd via .gitignore:60)`);
  console.log('');
  for (const l of legs) {
    console.log(`${l.verdict.padEnd(8)} ${l.id.padEnd(10)} ${l.what}`);
    if (l.detail) console.log(`         ${l.detail}`);
  }
  console.log('');
  for (const p of preds) {
    console.log(`${p.landed ? 'LANDED  ' : 'REFUTED '} ${p.id.padEnd(10)} ${p.what}`);
  }
  console.log('');
  const refuted = preds.filter((p) => !p.landed).map((p) => p.id);
  console.log(
    `VERDICT/${red.length || refused.length ? 1 : 0} ${red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN'} ` +
      `legs=${legs.length} red=[${red}] refused=[${refused}] preds=${preds.length} refuted=[${refuted}] prefused=[]`
  );
  process.exit(red.length || refused.length ? 1 : 0);
}

main().catch((e) => {
  console.log(`CRASH — the arm itself failed: ${e.stack}`);
  console.log('VERDICT/1 CRASH legs=0 red=[] refused=[all] preds=0 refuted=[] prefused=[]');
  process.exit(2);
});
