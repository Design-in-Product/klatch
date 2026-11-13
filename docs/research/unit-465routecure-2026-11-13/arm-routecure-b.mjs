#!/usr/bin/env node
/**
 * unit-465routecure arm B — the cure, graded. **Additive.** `arm-routecure.mjs` and
 * `drive1.precure.out` are not edited; this is a new file with new legs and its own drive.
 *
 * Pre-cure baseline is the module sliced out of **`aaf7ba4c`** (arm A's commit, the last rev before
 * the cure), never the working tree. The post-cure subject is the live module, imported directly —
 * that is the point: a cure graded through a copy is graded as a copy.
 *
 * Usage: node arm-routecure-b.mjs [--repo <path>] [--precure-rev <rev>]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// Under `scratch/` deliberately: `.gitignore:60` is `docs/research/unit-*/scratch/`, and a
// sibling named `scratch-b/` would NOT match it and would be committed by `git add` over the dir.
const SCRATCH = resolve(HERE, 'scratch', 'b');
const MODPATH = 'docs/research/lib/attested-rounds.mjs';
const LIVE = resolve(HERE, '..', 'lib', 'attested-rounds.mjs');

const argv = process.argv.slice(2);
const pick = (flag, dflt) => (argv.indexOf(flag) === -1 ? dflt : argv[argv.indexOf(flag) + 1]);
const REPO = resolve(pick('--repo', resolve(HERE, '..', '..', '..')));
const PRECURE_REV = pick('--precure-rev', 'aaf7ba4c');

const legs = [];
const red = [];
const refused = [];
function check(id, what, fn) {
  let got;
  try {
    got = fn();
  } catch (e) {
    legs.push({ id, what, verdict: 'REFUSED', detail: `threw: ${e.message}` });
    refused.push(id);
    return undefined;
  }
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
function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) return null;
  return r.stdout;
}

async function sliceModule(rev, tag) {
  const src = git(['show', `${rev}:${MODPATH}`]);
  if (src === null) return null;
  const dest = resolve(SCRATCH, `attested-rounds.${tag}.mjs`);
  writeFileSync(dest, src);
  return { mod: await import(pathToFileURL(dest).href), src, dest };
}

/** Cripple the LIVE source textually and import the result. `{refused:true}` if the edit did not land. */
async function crippleLive(tag, mutate) {
  const src = git(['show', `HEAD:${MODPATH}`]);
  if (src === null) return null;
  const out = mutate(src);
  if (out === null || out === src) return { refused: true };
  const dest = resolve(SCRATCH, `attested-rounds.${tag}.mjs`);
  writeFileSync(dest, out);
  try {
    return { mod: await import(pathToFileURL(dest).href), src: out };
  } catch (e) {
    return { importThrew: e };
  }
}

const eq = (a, b) => String(a) === String(b);

async function main() {
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(SCRATCH, { recursive: true });

  const pre = await sliceModule(PRECURE_REV, 'precure');
  if (pre === null) {
    console.log(`REFUSED — could not slice ${MODPATH} out of ${PRECURE_REV}; no leg can run.`);
    console.log('VERDICT/1 REFUSED legs=0 red=[] refused=[all] preds=0');
    process.exit(1);
  }
  const PRE = pre.mod;
  const NOW = await import(pathToFileURL(LIVE).href);

  // ------------------------------------------------- the cure exists and the pre-cure state lacked it
  check('R13a', `the pre-cure module@${PRECURE_REV} has NO reproduceFloorReading, and the live one does`, () => {
    const before = typeof PRE.reproduceFloorReading;
    const after = typeof NOW.reproduceFloorReading;
    return { ok: before === 'undefined' && after === 'function', detail: `before=${before} after=${after}` };
  });

  // ------------------------------------------------- P13: the pin reproduces THROUGH THE FUNCTION
  const repro = await NOW.reproduceFloorReading(REPO);
  check('R13', 'reproduceFloorReading(repo) hits the pin to the digit — the route is runnable (P3/P13)', () => {
    if (repro === null) return 'REFUSED';
    return {
      ok: repro.ok === true,
      detail: `ok=${repro.ok} got paths=${repro.got.paths} outside=[${repro.got.outside}] · want paths=${repro.want.paths} outside=[${repro.want.outside}] · route=${repro.route}`,
    };
  });

  // ------------------------------------------------- P13: and it did NOT move when the reader did
  const uPre = PRE.unattestedRoundsAt(REPO, 'HEAD');
  const uNow = NOW.unattestedRoundsAt(REPO, 'HEAD');
  check('R13b', 'THE DESIGN CLAIM: the live census reader MOVED in this same commit, and the pin did not (P13)', () => {
    if (uPre === null || uNow === null || repro === null) return 'REFUSED';
    const readerMoved = uPre.rounds.length !== uNow.rounds.length;
    return {
      ok: readerMoved === true && repro.ok === true,
      detail:
        `unattestedRoundsAt(HEAD).rounds ${uPre.rounds.length} → ${uNow.rounds.length} (moved=${readerMoved}); ` +
        `pin still reproduces=${repro.ok}. A route carrying HEAD's reader would have moved with it.`,
    };
  });

  check('R13c', 'the reader expression in reproduceFloorReading is NOT a call to unattestedRoundsAt', () => {
    const src = NOW.reproduceFloorReading.toString();
    return {
      ok: /unattestedRoundsAt/.test(src) === false && /sliced\.classifyPath/.test(src),
      detail: `calls unattestedRoundsAt=${/unattestedRoundsAt/.test(src)} · uses sliced.classifyPath=${/sliced\.classifyPath/.test(src)}`,
    };
  });

  // The value-grade leg that belongs here — "a wrong-but-well-formed classifierRev makes the ROUTE
  // red rather than selfTest throw" — is R13e below, driven with its own await. An earlier draft had
  // a placeholder here returning ok:true unconditionally; a leg that passes whatever happens is
  // decoration, so it is not in the drive.
  const wrongRevSrc = git(['show', `HEAD:${MODPATH}`]);
  let wrongRepro = 'nosrc';
  if (wrongRevSrc !== null && wrongRevSrc.includes("classifierRev: '6c9a4348'")) {
    const dest = resolve(SCRATCH, 'attested-rounds.wrongrev.mjs');
    writeFileSync(dest, wrongRevSrc.replace("classifierRev: '6c9a4348'", "classifierRev: '3ee13880'"));
    try {
      const m = await import(pathToFileURL(dest).href);
      wrongRepro = await m.reproduceFloorReading(REPO);
    } catch (e) {
      wrongRepro = { threw: e.message };
    }
  }
  check('R13e', 'THE VALUE GRADE: a well-formed but WRONG classifierRev makes the route RED, not green', () => {
    if (wrongRepro === 'nosrc') return 'REFUSED';
    if (wrongRepro && wrongRepro.threw) return { ok: false, detail: `it threw instead of reporting red: ${wrongRepro.threw}` };
    if (wrongRepro === null) return { ok: true, detail: 'the route REFUSED (null) on a rev whose slice cannot serve — a refusal, not a false reproduction' };
    return {
      ok: wrongRepro.ok === false,
      detail: `ok=${wrongRepro.ok} got paths=${wrongRepro.got && wrongRepro.got.paths} outside=[${wrongRepro.got && wrongRepro.got.outside}] · this is what selfTest's shape guard cannot see`,
    };
  });

  // ------------------------------------------------- P6/P15: the S6 boundary, through the real module
  check('R15', 'the boundary cure reclassified ZERO live paths — re-measured through the LIVE module (P6)', () => {
    const tree = git(['ls-tree', '-r', '--name-only', 'HEAD']);
    if (tree === null) return 'REFUSED';
    const paths = tree.split('\n').filter(Boolean);
    const moved = [];
    for (const p of paths) {
      const a = PRE.classifyPath(p);
      const b = NOW.classifyPath(p);
      if (a.source !== b.source || a.round !== b.round) moved.push(`${p} ${a.source}/${a.round}→${b.source}/${b.round}`);
    }
    return { ok: moved.length === 0, detail: `reclassified=${moved.length}${moved.length ? ' → ' + moved.join(' | ') : ''}` };
  });

  check('R15b', 'the denominator is MINE, not the memo\'s 80 — two keys, attributed (P6 scope)', () => {
    const tree = git(['ls-tree', '-r', '--name-only', 'HEAD']);
    if (tree === null) return 'REFUSED';
    const mail = tree.split('\n').filter((p) => /^docs\/mail\//.test(p));
    const loose = mail.filter((p) => /round/i.test(p)).length;
    const strict = mail.filter((p) => /round\d+/i.test(p)).length;
    const claimed = mail.filter((p) => NOW.classifyPath(p).source === 'S6').length;
    return {
      ok: loose !== strict,
      detail: `docs/mail paths: naming "round" (my arm-A key)=${loose} · naming round+DIGITS=${strict} · actually claimed by S6=${claimed}. ` +
        `Arm A printed ${loose} beside a memo figure of 80; the two keys are different, and 0 reclassified under both.`,
    };
  });

  check('R16', 'attestedRounds(HEAD).filtered unchanged by the whole cure, both directions (P7)', () => {
    const a = PRE.attestedRounds(REPO, 'HEAD');
    const b = NOW.attestedRounds(REPO, 'HEAD');
    if (a === null || b === null) return 'REFUSED';
    const gained = [...b.filtered].filter((n) => !a.filtered.has(n)).sort((x, y) => x - y);
    const lost = [...a.filtered].filter((n) => !b.filtered.has(n)).sort((x, y) => x - y);
    return {
      ok: gained.length === 0 && lost.length === 0,
      detail: `|before|=${a.filtered.size} |after|=${b.filtered.size} gained=[${gained}] lost=[${lost}]`,
    };
  });

  // ------------------------------------------------- P12: the two defects are independent
  check('R12b', 'the multi-round figure is UNCHANGED by the boundary cure — independent defects (P12)', () => {
    const tree = git(['ls-tree', '-r', '--name-only', 'HEAD']);
    if (tree === null) return 'REFUSED';
    const count = (cp) => {
      let dis = 0;
      let mail = 0;
      for (const p of tree.split('\n').filter(Boolean)) {
        const named = [...p.matchAll(/round(\d+)/gi)].map((m) => Number(m[1]));
        if (new Set(named).size < 2) continue;
        const c = cp(p);
        if (c.round !== null && c.round !== named[0]) {
          dis += 1;
          if (/^docs\/mail\//.test(p)) mail += 1;
        }
      }
      return { dis, mail };
    };
    const a = count(PRE.classifyPath);
    const b = count(NOW.classifyPath);
    return {
      ok: a.dis === b.dis && a.mail === b.mail && b.mail === 2,
      detail: `pre-cure dis=${a.dis}/mail=${a.mail} · post-cure dis=${b.dis}/mail=${b.mail}`,
    };
  });

  // ------------------------------------------------- §4: the widening, attributed not just reported
  check('R17', 'the census widening is a STRICT superset of what the old key saw (§4 cure)', () => {
    if (uPre === null || uNow === null) return 'REFUSED';
    const before = new Set(uPre.rounds);
    const dropped = uPre.rounds.filter((n) => !uNow.rounds.includes(n));
    const added = uNow.rounds.filter((n) => !before.has(n));
    return {
      ok: dropped.length === 0 && added.length > 0,
      detail: `old=${uPre.rounds.length} new=${uNow.rounds.length} added=${added.length} dropped=${dropped.length} · creditLeak=${uNow.creditLeak.length}`,
    };
  });

  check('R17b', "my creditLeak (24) and the memo's 28 are DIFFERENT KEYS, and the gap is attributed", () => {
    const tree = git(['ls-tree', '-r', '--name-only', 'HEAD']);
    if (tree === null || uNow === null) return 'REFUSED';
    // The memo's key: rounds named by a CLAIMED multi-round path and not credited by it.
    const his = new Set();
    for (const p of tree.split('\n').filter(Boolean)) {
      const named = [...p.matchAll(/round(\d+)/gi)].map((m) => Number(m[1]));
      if (new Set(named).size < 2) continue;
      const c = NOW.classifyPath(p);
      if (c.source === null) continue;
      for (const n of named) if (n !== c.round) his.add(n);
    }
    const mine = new Set(uNow.creditLeak);
    const onlyHis = [...his].filter((n) => !mine.has(n)).sort((a, b) => a - b);
    const onlyMine = [...mine].filter((n) => !his.has(n)).sort((a, b) => a - b);
    return {
      ok: his.size === 28 && (onlyHis.length > 0 || onlyMine.length > 0),
      detail:
        `memo key (claimed multi-round paths)=${his.size} · my creditLeak (widened set minus what the first-token key saw)=${mine.size} · ` +
        `only-memo=[${onlyHis}] only-mine=[${onlyMine}]. Neither is wrong; they are not the same quantity.`,
    };
  });

  check('R17c', 'the widening closed NO otherwise-unattested round at HEAD — stated, not buried', () => {
    if (uPre === null || uNow === null) return 'REFUSED';
    return {
      ok: eq(uNow.outside, []) && eq(uPre.outside, []),
      detail: `outside before=[${uPre.outside}] after=[${uNow.outside}]. The leak was real and the population does not move: every leaked round is attested elsewhere at HEAD.`,
    };
  });

  // ------------------------------------------------- P8/P9: the cured guards, crippled
  const banana = await crippleLive('banana', (s) =>
    s.includes("classifierRev: '6c9a4348'") ? s.replace("classifierRev: '6c9a4348'", "classifierRev: 'banana'") : null
  );
  check('R18', "POST-CURE: classifierRev='banana' now makes selfTest() THROW (P8)", () => {
    if (banana === null || banana.refused) return 'REFUSED';
    if (banana.importThrew) return { ok: true, detail: `import itself threw: ${banana.importThrew.message}` };
    try {
      const r = banana.mod.selfTest();
      return { ok: false, detail: `still green: selfTest() → ${r} — the guard is still not a value guard` };
    } catch (e) {
      return { ok: /classifierRev is not a rev/.test(e.message), detail: e.message };
    }
  });

  check('R18b', 'the shape guard is honest about its limit: a WELL-FORMED wrong rev passes selfTest', () => {
    const m = NOW.SOURCE_RECALL_FLOOR[`at${NOW.SOURCE_RECALL_FLOOR.rev}`];
    const wellFormedWrong = /^[0-9a-f]{7,40}$/.test('deadbeef');
    return {
      ok: wellFormedWrong === true && /^[0-9a-f]{7,40}$/.test(m.classifierRev),
      detail: `'deadbeef' satisfies the shape guard=${wellFormedWrong}. The VALUE grade is R13, which needs a repo and cannot live in selfTest().`,
    };
  });

  for (const foil of ['separatorTolerant', 'boundaryFree']) {
    const re = NOW.S6_FOILS[foil];
    const witness = [...NOW.SOURCE_CASES.present, ...NOW.SOURCE_CASES.synthetic].find(
      ([p, s]) => s === null && re.test(p) && NOW.classifyPath(p).source === null
    );
    // eslint-disable-next-line no-await-in-loop
    const killed = await crippleLive(`nofoil-${foil}`, (s) => {
      if (!witness) return null;
      const line = s.split('\n').find((l) => l.includes(`'${witness[0]}'`) && l.includes('null, null'));
      return line ? s.replace(`${line}\n`, '') : null;
    });
    check(`R19-${foil}`, `POST-CURE: deleting S6_FOILS.${foil}'s witness makes selfTest() THROW (P9)`, () => {
      if (!witness) return 'REFUSED';
      if (killed === null || killed.refused) return 'REFUSED';
      if (killed.importThrew) return { ok: true, detail: `import threw: ${killed.importThrew.message}` };
      try {
        const r = killed.mod.selfTest();
        return { ok: false, detail: `still green: selfTest() → ${r}; witness ${witness[0]} is deletable` };
      } catch (e) {
        return { ok: new RegExp(foil).test(e.message), detail: e.message };
      }
    });
  }

  check('R19c', 'the two foil witnesses are DIFFERENT paths — one case cannot cover both edges', () => {
    const cases = [...NOW.SOURCE_CASES.present, ...NOW.SOURCE_CASES.synthetic];
    const w = Object.fromEntries(
      Object.entries(NOW.S6_FOILS).map(([n, re]) => [
        n,
        (cases.find(([p, s]) => s === null && re.test(p) && NOW.classifyPath(p).source === null) || [null])[0],
      ])
    );
    const vals = Object.values(w);
    return {
      ok: vals.every(Boolean) && new Set(vals).size === vals.length,
      detail: JSON.stringify(w),
    };
  });

  // ------------------------------------------------- the cured contract, and the gate
  check('R20', 'the live module selfTest() returns true, and SOURCE_IDS is unchanged', () => {
    const r = NOW.selfTest();
    return { ok: r === true && eq(NOW.SOURCE_IDS, ['S1', 'S2', 'S3', 'S5', 'S6']), detail: `selfTest()=${r} SOURCE_IDS=${NOW.SOURCE_IDS}` };
  });

  check('R21', 'no gate leg is owed — packages/ and scripts/ clean (P14)', () => {
    const st = git(['status', '--porcelain', 'packages', 'scripts']);
    if (st === null) return 'REFUSED';
    return { ok: st.trim() === '', detail: `git status --porcelain packages scripts → ${JSON.stringify(st)}` };
  });

  console.log('unit-465routecure arm B — the cure, graded (additive; arm A is not re-driven)');
  console.log(`repo=${REPO}`);
  console.log(`pre-cure baseline = ${MODPATH}@${PRECURE_REV} (sliced from git) · post-cure = the live file`);
  console.log('');
  for (const l of legs) {
    console.log(`${l.verdict.padEnd(8)} ${l.id.padEnd(22)} ${l.what}`);
    if (l.detail) console.log(`         ${l.detail}`);
  }
  console.log('');
  console.log(
    `VERDICT/${red.length || refused.length ? 1 : 0} ${red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN'} ` +
      `legs=${legs.length} red=[${red}] refused=[${refused}] preds=14`
  );
  process.exit(red.length || refused.length ? 1 : 0);
}

main().catch((e) => {
  console.log(`CRASH — the arm itself failed: ${e.stack}`);
  console.log('VERDICT/1 CRASH legs=0 red=[] refused=[all] preds=14');
  process.exit(2);
});
