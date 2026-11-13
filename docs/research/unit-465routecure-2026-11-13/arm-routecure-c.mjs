#!/usr/bin/env node
/**
 * unit-465routecure arm C — the three legs arm B got wrong, re-driven from the committed cure.
 *
 * **Additive.** `arm-routecure.mjs`, `arm-routecure-b.mjs`, `drive1.precure.out` and
 * `drive2.postcure.out` are not edited. Arm B's three reds and one refusal stay on the record.
 *
 * ## What arm B did wrong, which is the finding this arm exists to name
 *
 * Arm B's `crippleLive()` sourced its cripples from `git show HEAD:…`. The cure was still
 * **uncommitted** when arm B was driven, so HEAD was the **pre-cure** file: three legs crippled the
 * old module, found the old module's guards weak (they were — arm A measured exactly that), and
 * reported it as *the cure failing*. A red from a stale cripple source is **indistinguishable** from
 * a red from a defective cure.
 *
 * The fix is not to read the working tree. It is to cripple from a **named committed rev**, so every
 * input is reproducible from any clone — and to carry `C0`, a matched uncrippled baseline, so a
 * throw can be attributed to the cripple instead of to the slice.
 *
 * Usage: node arm-routecure-c.mjs [--repo <path>] [--cure-rev <rev>] [--precure-rev <rev>]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = resolve(HERE, 'scratch', 'c');
const MODPATH = 'docs/research/lib/attested-rounds.mjs';

const argv = process.argv.slice(2);
const pick = (flag, dflt) => (argv.indexOf(flag) === -1 ? dflt : argv[argv.indexOf(flag) + 1]);
const REPO = resolve(pick('--repo', resolve(HERE, '..', '..', '..')));
const CURE_REV = pick('--cure-rev', '130bb6fc');
const PRECURE_REV = pick('--precure-rev', 'aaf7ba4c');

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
function check(id, what, fn) {
  try {
    return record(id, what, fn());
  } catch (e) {
    legs.push({ id, what, verdict: 'REFUSED', detail: `threw: ${e.message}` });
    refused.push(id);
    return undefined;
  }
}
async function checkA(id, what, fn) {
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
  if (r.status !== 0) return null;
  return r.stdout;
}

/** Cripple the module **as committed at `rev`**, never the working tree, never bare HEAD. */
async function crippleAt(rev, tag, mutate) {
  const src = git(['show', `${rev}:${MODPATH}`]);
  if (src === null) return { refused: 'no such blob' };
  const out = mutate(src);
  if (out === null || out === src) return { refused: 'the edit did not land' };
  const dest = resolve(SCRATCH, `attested-rounds.${tag}.mjs`);
  writeFileSync(dest, out);
  try {
    return { mod: await import(pathToFileURL(dest).href), src: out };
  } catch (e) {
    return { importThrew: e };
  }
}

/** Delete the SOURCE_CASES array entry whose path is `p`, anchored on the entry form. */
const dropCase = (p) => (src) => {
  const line = src.split('\n').find((l) => l.includes(`'${p}'`) && /null,\s*null\s*\],?\s*$/.test(l));
  return line ? src.replace(`${line}\n`, '') : null;
};

async function main() {
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(SCRATCH, { recursive: true });

  // ---------------------------------------------------------------- C1: name arm B's defect
  check('C1', `ARM B'S DEFECT, NAMED: the cure is at ${CURE_REV} and was NOT at the HEAD arm B crippled`, () => {
    const pre = git(['show', `${PRECURE_REV}:${MODPATH}`]);
    const cure = git(['show', `${CURE_REV}:${MODPATH}`]);
    if (pre === null || cure === null) return 'REFUSED';
    const preHas = /export async function reproduceFloorReading/.test(pre);
    const cureHas = /export async function reproduceFloorReading/.test(cure);
    return {
      ok: preHas === false && cureHas === true,
      detail:
        `reproduceFloorReading present at ${PRECURE_REV}=${preHas}, at ${CURE_REV}=${cureHas}. ` +
        `Arm B's crippleLive() read \`git show HEAD:\` while the cure was uncommitted, so its R13e/R18/R19 graded ${PRECURE_REV}.`,
    };
  });

  // ---------------------------------------------------------------- C0: the matched baseline
  const base = await crippleAt(CURE_REV, 'uncrippled', (s) => `${s}\n// arm C: byte-changed, semantics untouched\n`);
  await checkA('C0', 'THE MATCHED BASELINE: the uncrippled slice at the cure rev is GREEN, so a throw below is the cripple', async () => {
    if (base.refused) return 'REFUSED';
    if (base.importThrew) return { ok: false, detail: `the baseline slice would not even import: ${base.importThrew.message}` };
    try {
      const r = base.mod.selfTest();
      return { ok: r === true, detail: `uncrippled slice@${CURE_REV} selfTest() → ${r}` };
    } catch (e) {
      return { ok: false, detail: `the UNCRIPPLED slice throws, so no cripple below is attributable: ${e.message}` };
    }
  });

  // ---------------------------------------------------------------- C2 = arm B's R13e, re-driven
  const wrongRev = await crippleAt(CURE_REV, 'wrongrev', (s) =>
    s.includes("classifierRev: '6c9a4348'") ? s.replace("classifierRev: '6c9a4348'", "classifierRev: '3ee13880'") : null
  );
  await checkA('C2', 'THE VALUE GRADE: a well-formed but WRONG classifierRev makes the route report RED, not throw', async () => {
    if (wrongRev.refused) return 'REFUSED';
    if (wrongRev.importThrew) return { ok: false, detail: `import threw: ${wrongRev.importThrew.message}` };
    let got;
    try {
      got = await wrongRev.mod.reproduceFloorReading(REPO);
    } catch (e) {
      return { ok: false, detail: `the route THREW instead of reporting: ${e.message}` };
    }
    if (got === null) {
      return { ok: true, detail: 'the route REFUSED (null) — a refusal on an unusable slice, never a false reproduction' };
    }
    return {
      ok: got.ok === false,
      detail: `ok=${got.ok} got paths=${got.got.paths} outside=[${got.got.outside}] want paths=${got.want.paths} outside=[${got.want.outside}] · this is exactly what the shape guard in selfTest cannot see`,
    };
  });

  // ---------------------------------------------------------------- C3 = arm B's R18, re-driven
  const banana = await crippleAt(CURE_REV, 'banana', (s) =>
    s.includes("classifierRev: '6c9a4348'") ? s.replace("classifierRev: '6c9a4348'", "classifierRev: 'banana'") : null
  );
  await checkA('C3', "classifierRev='banana' now makes selfTest() THROW, naming the field (P8 post-cure)", async () => {
    if (banana.refused) return 'REFUSED';
    if (banana.importThrew) return { ok: false, detail: `import threw: ${banana.importThrew.message}` };
    try {
      const r = banana.mod.selfTest();
      return { ok: false, detail: `still green: selfTest() → ${r} — the guard is still not even a shape guard` };
    } catch (e) {
      return { ok: /classifierRev is not a rev/.test(e.message), detail: e.message };
    }
  });

  // ---------------------------------------------------------------- C4/C5 = arm B's R19, re-driven
  const cureSrcMod = await crippleAt(CURE_REV, 'readonly', (s) => `${s}\n// arm C: witness lookup copy\n`);
  const witnesses = {};
  if (!cureSrcMod.refused && !cureSrcMod.importThrew) {
    const cases = [...cureSrcMod.mod.SOURCE_CASES.present, ...cureSrcMod.mod.SOURCE_CASES.synthetic];
    for (const [name, re] of Object.entries(cureSrcMod.mod.S6_FOILS)) {
      const w = cases.find(([p, s]) => s === null && re.test(p) && cureSrcMod.mod.classifyPath(p).source === null);
      witnesses[name] = w ? w[0] : null;
    }
  }

  for (const [name, wpath] of Object.entries(witnesses)) {
    // eslint-disable-next-line no-await-in-loop
    const killed = wpath ? await crippleAt(CURE_REV, `nofoil-${name}`, dropCase(wpath)) : { refused: 'no witness' };
    // eslint-disable-next-line no-await-in-loop
    await checkA(`C4-${name}`, `deleting S6_FOILS.${name}'s witness makes selfTest() THROW, naming the foil (P9 post-cure)`, async () => {
      if (killed.refused) return 'REFUSED';
      if (killed.importThrew) return { ok: false, detail: `import threw: ${killed.importThrew.message}` };
      try {
        const r = killed.mod.selfTest();
        return { ok: false, detail: `still green: selfTest() → ${r}; witness ${wpath} is deletable` };
      } catch (e) {
        return { ok: new RegExp(name).test(e.message), detail: e.message };
      }
    });
    // The cripple must have LANDED on the entry, not on a docblock mention of the same path.
    // eslint-disable-next-line no-await-in-loop
    await checkA(`C5-${name}`, `…and that cripple LANDED on the array entry, not on prose naming the same path`, async () => {
      if (killed.refused || killed.importThrew) return 'REFUSED';
      const stillThere = new RegExp(`\\['${wpath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`).test(killed.src);
      const proseSurvives = killed.src.includes(wpath.split('/').pop().replace(/'/g, ''));
      return {
        ok: stillThere === false,
        detail: `entry still present=${stillThere} · a mention of the filename survives in prose=${proseSurvives}`,
      };
    });
  }

  // ---------------------------------------------------------------- C6: the standing live consumer
  const CELL = resolve(REPO, 'docs/research/round464-instruments/grade-the-stop-condition.mjs');
  const PRIOR = resolve(REPO, 'docs/research/unit-465maildurable-2026-11-13/drive4.standing-cell-postcure.out');
  check('C6', 'THE STANDING LIVE CONSUMER, DRIVEN: its verdict line is unchanged by this cure', () => {
    if (!existsSync(CELL) || !existsSync(PRIOR)) return 'REFUSED';
    const r = spawnSync('node', [CELL], { cwd: REPO, stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 });
    const out = `${r.stdout || ''}`;
    writeFileSync(resolve(HERE, 'drive5.standing-cell.out'), out);
    const vline = (s) => (s.split('\n').find((l) => l.startsWith('VERDICT/')) || '').trim();
    const now = vline(out);
    const was = vline(readFileSync(PRIOR, 'utf8'));
    return {
      ok: now !== '' && now === was,
      detail: `now  = ${JSON.stringify(now)}\n         prior = ${JSON.stringify(was)}`,
    };
  });

  // ---------------------------------------------------------------- the gate
  check('C7', 'no gate leg is owed — packages/ and scripts/ clean', () => {
    const st = git(['status', '--porcelain', 'packages', 'scripts']);
    if (st === null) return 'REFUSED';
    return { ok: st.trim() === '', detail: `git status --porcelain packages scripts → ${JSON.stringify(st)}` };
  });

  console.log('unit-465routecure arm C — arm B\'s three reds re-driven from the COMMITTED cure');
  console.log(`repo=${REPO}`);
  console.log(`cripple source = ${MODPATH}@${CURE_REV} · arm B wrongly used bare HEAD (= ${PRECURE_REV}, pre-cure)`);
  console.log(`foil witnesses = ${JSON.stringify(witnesses)}`);
  console.log('');
  for (const l of legs) {
    console.log(`${l.verdict.padEnd(8)} ${l.id.padEnd(24)} ${l.what}`);
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
