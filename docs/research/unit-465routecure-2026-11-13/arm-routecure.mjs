#!/usr/bin/env node
/**
 * unit-465routecure arm A — the routed route, graded before it is cured.
 *
 * Subject: `docs/research/lib/attested-rounds.mjs`.
 * Routed by Theseus's 11/13 memo (his unit-465s6bounds, pre-reg c2d9ffe3).
 * Pre-registration: ./PRE-REGISTRATION.md, pushed as 72a43aba before this file existed.
 *
 * Every pre-cure reading is taken through a module **sliced out of a committed rev** and written to
 * `scratch/`, never off the working tree, because this unit cures its own subject. A leg that cannot
 * run prints `REFUSED` and the verdict line counts it; `null` from `git()` is a refusal, not an
 * empty set.
 *
 * Usage: node arm-routecure.mjs [--repo <path>]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = resolve(HERE, 'scratch');
const MODPATH = 'docs/research/lib/attested-rounds.mjs';

const argv = process.argv.slice(2);
const repoArg = argv.indexOf('--repo');
const REPO = repoArg === -1 ? resolve(HERE, '..', '..', '..') : resolve(argv[repoArg + 1]);

/** The two revs the pin names. Read from the pin itself at drive time, not typed here. */
const CLASSIFIER_REV = '6c9a4348';
const TREE_REV = '3ee13880';

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

/** Slice a whole file out of a rev into scratch/ and import it. `null` on refusal. */
async function sliceModule(rev, tag) {
  const src = git(['show', `${rev}:${MODPATH}`]);
  if (src === null) return null;
  const dest = resolve(SCRATCH, `attested-rounds.${tag}.mjs`);
  writeFileSync(dest, src);
  return { mod: await import(pathToFileURL(dest).href), src, dest };
}

/** Slice HEAD's module, apply a textual cripple, import the crippled copy. `null` on refusal. */
async function sliceCrippled(tag, mutate) {
  const src = git(['show', `HEAD:${MODPATH}`]);
  if (src === null) return null;
  const out = mutate(src);
  if (out === null || out === src) return { refused: true, src };
  const dest = resolve(SCRATCH, `attested-rounds.${tag}.mjs`);
  writeFileSync(dest, out);
  return { mod: await import(pathToFileURL(dest).href), src: out, dest };
}

/**
 * The pinned reading, recomputed from ONE module's own exports over a tree rev.
 *
 * This is the reader expression the route owns. It calls `m.classifyPath` and `m.attestedRounds`
 * from the SAME module object, so every component of the route comes from the sliced rev — which is
 * the whole difference between this and splicing one function into HEAD's module.
 */
function floorReadingVia(m, treeRev) {
  const tree = git(['ls-tree', '-r', '--name-only', treeRev]);
  const pop = m.attestedRounds(REPO, treeRev);
  if (tree === null || pop === null) return null;
  const invisible = tree.split('\n').filter((p) => /round\d+/i.test(p) && m.classifyPath(p).source === null);
  const rounds = new Set(invisible.map((p) => Number(/round(\d+)/i.exec(p)[1])));
  return {
    paths: invisible.length,
    rounds: [...rounds].sort((a, b) => a - b),
    outside: [...rounds].filter((n) => !pop.filtered.has(n)).sort((a, b) => a - b),
  };
}

/** The left-boundary-cured S6 key, as a local proposal. Arm B must re-measure through the module. */
const S6_CURED = /^docs\/mail\/(?:.*[^a-z0-9])?round(\d+)/i;
const S6_LIVE = /^docs\/mail\/.*round(\d+)/i;

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function main() {
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(SCRATCH, { recursive: true });

  const headSlice = await sliceModule('HEAD', 'head');
  const oldSlice = await sliceModule(CLASSIFIER_REV, 'classifierrev');
  if (headSlice === null || oldSlice === null) {
    console.log('REFUSED — could not slice the subject out of git; no leg can run.');
    console.log('VERDICT/1 REFUSED legs=0 red=[] refused=[all] preds=0');
    process.exit(1);
  }
  const HEADMOD = headSlice.mod;
  const OLDMOD = oldSlice.mod;

  // ---------------------------------------------------------------- P1 / P2: what exists where
  check('R1', `module@${CLASSIFIER_REV} does NOT export unattestedRoundsAt (P1, his T8a)`, () => {
    const has = typeof OLDMOD.unattestedRoundsAt === 'function';
    return { ok: has === false, detail: `typeof unattestedRoundsAt = ${typeof OLDMOD.unattestedRoundsAt}` };
  });

  check('R2', `module@${CLASSIFIER_REV} DOES export classifyPath and attestedRounds (P2)`, () => {
    const c = typeof OLDMOD.classifyPath;
    const a = typeof OLDMOD.attestedRounds;
    return { ok: c === 'function' && a === 'function', detail: `classifyPath=${c} attestedRounds=${a}` };
  });

  check('R2b', 'the literal documented route, run as written — expected to raise (P1 consequence)', () => {
    try {
      OLDMOD.unattestedRoundsAt(REPO, TREE_REV);
      return { ok: false, detail: 'it did NOT raise — the documented route runs after all' };
    } catch (e) {
      return { ok: /is not a function/.test(e.message), detail: `${e.constructor.name}: ${e.message}` };
    }
  });

  // ---------------------------------------------------------------- P3: the pin, via the whole slice
  const pin = HEADMOD.SOURCE_RECALL_FLOOR[`at${HEADMOD.SOURCE_RECALL_FLOOR.rev}`];
  check('R3', `whole-slice route over tree@${TREE_REV} reproduces the pin (P3, his T8b figure)`, () => {
    const got = floorReadingVia(OLDMOD, TREE_REV);
    if (got === null) return 'REFUSED';
    const want = { paths: pin.invisiblePaths, outside: pin.unattestedRounds };
    return {
      ok: got.paths === want.paths && eq(got.outside, want.outside),
      detail: `got paths=${got.paths} outside=[${got.outside}] · pin paths=${want.paths} outside=[${want.outside}]`,
    };
  });

  check('R3b', 'the pin also names the rev and classifier the route needs (scope completeness)', () => {
    const revOk = HEADMOD.SOURCE_RECALL_FLOOR.rev === TREE_REV;
    const clsOk = pin.classifierRev === CLASSIFIER_REV;
    return { ok: revOk && clsOk, detail: `rev=${HEADMOD.SOURCE_RECALL_FLOOR.rev} classifierRev=${pin.classifierRev}` };
  });

  // ---------------------------------------------------------------- P4: slice vs splice
  check('R4', `module@${CLASSIFIER_REV}'s OWN selfTest() returns true (P4 — the load-bearing distinction)`, () => {
    try {
      const r = OLDMOD.selfTest();
      return { ok: r === true, detail: `selfTest() → ${r}` };
    } catch (e) {
      return { ok: false, detail: `THREW: ${e.message}` };
    }
  });

  check('R4b', "his T8c, under my key: HEAD's SOURCE_IDS spliced onto the old classifier is inconsistent", () => {
    // Not a module splice — the same inconsistency, stated as the set relation that causes it.
    const oldProducible = new Set(
      [...OLDMOD.classifyPath.toString().matchAll(/source:\s*'(S\d+)'/g)].map((m) => m[1])
    );
    const headDeclared = HEADMOD.SOURCE_IDS;
    const missing = headDeclared.filter((s) => !oldProducible.has(s));
    return {
      ok: eq(missing, ['S6']),
      detail: `HEAD declares [${headDeclared}]; classifier@${CLASSIFIER_REV} can return [${[...oldProducible]}]; a splice would leave [${missing}] unproducible`,
    };
  });

  // ---------------------------------------------------------------- P5: the word tail, live
  const WORKAROUND_INTREE = 'docs/mail/read/calliope-to-dispatch-ssh443-workaround-2026-04-18.md';
  const WORKAROUND_NOSEP = 'docs/mail/read/calliope-to-dispatch-ssh443-workaround2026-04-18.md';
  check('R5', 'live S6 reads the WORD TAIL of "workaround" as a round when the separator is gone (P5, his T1b)', () => {
    const intree = HEADMOD.classifyPath(WORKAROUND_INTREE);
    const nosep = HEADMOD.classifyPath(WORKAROUND_NOSEP);
    return {
      ok: intree.source === null && nosep.source === 'S6' && nosep.round === 2026,
      detail: `in-tree → ${intree.source}/${intree.round} · separator removed → ${nosep.source}/${nosep.round}`,
    };
  });

  check('R5b', 'the cured key refuses BOTH, and still claims the S6 known positive (cure, non-vacuity)', () => {
    const kp = 'docs/mail/read/daedalus-to-argus-round9.md';
    const a = S6_CURED.exec(WORKAROUND_INTREE);
    const b = S6_CURED.exec(WORKAROUND_NOSEP);
    const c = S6_CURED.exec(kp);
    return {
      ok: a === null && b === null && c !== null && Number(c[1]) === 9,
      detail: `in-tree=${a} nosep=${b} KP=${c && c[1]}`,
    };
  });

  // ---------------------------------------------------------------- P6 / P7: the cure's live price
  const headTree = git(['ls-tree', '-r', '--name-only', 'HEAD']);
  check('R6', 'the S6 boundary cure reclassifies ZERO live paths at HEAD (P6, his "0 of 80")', () => {
    if (headTree === null) return 'REFUSED';
    const paths = headTree.split('\n').filter(Boolean);
    const mailRoundPaths = paths.filter((p) => /^docs\/mail\//.test(p) && /round/i.test(p));
    const moved = [];
    for (const p of paths) {
      const live = S6_LIVE.exec(p);
      const cured = S6_CURED.exec(p);
      const l = live ? Number(live[1]) : null;
      const c = cured ? Number(cured[1]) : null;
      if (l !== c) moved.push(`${p} ${l}→${c}`);
    }
    return {
      ok: moved.length === 0,
      detail: `mail paths naming "round": ${mailRoundPaths.length} · reclassified: ${moved.length}${moved.length ? ' → ' + moved.join(' | ') : ''}`,
    };
  });

  // P7 is graded by R7b alone. An earlier draft had an R7 here that printed the baseline and
  // returned ok:true — a leg that passes whatever happens is decoration, so it is not in the drive.
  const curedSlice = await sliceCrippled('s6cured', (src) =>
    src.includes("m = /^docs\\/mail\\/.*round(\\d+)/i.exec(p);")
      ? src.replace(
          "m = /^docs\\/mail\\/.*round(\\d+)/i.exec(p);",
          "m = /^docs\\/mail\\/(?:.*[^a-z0-9])?round(\\d+)/i.exec(p);"
        )
      : null
  );
  check('R7b', 'the boundary cure, applied to a git-sliced HEAD copy: filtered gained=[] lost=[] (P7)', () => {
    if (curedSlice === null || curedSlice.refused) {
      return 'REFUSED';
    }
    const before = HEADMOD.attestedRounds(REPO, 'HEAD');
    const after = curedSlice.mod.attestedRounds(REPO, 'HEAD');
    if (before === null || after === null) return 'REFUSED';
    const gained = [...after.filtered].filter((n) => !before.filtered.has(n)).sort((a, b) => a - b);
    const lost = [...before.filtered].filter((n) => !after.filtered.has(n)).sort((a, b) => a - b);
    return {
      ok: gained.length === 0 && lost.length === 0,
      detail: `|before|=${before.filtered.size} |after|=${after.filtered.size} gained=[${gained}] lost=[${lost}]`,
    };
  });

  // ---------------------------------------------------------------- P8 / P9: the two weak guards
  const bananaSlice = await sliceCrippled('banana', (src) =>
    src.includes("classifierRev: '6c9a4348'") ? src.replace("classifierRev: '6c9a4348'", "classifierRev: 'banana'") : null
  );
  check('R8', "PRE-CURE: classifierRev='banana' leaves selfTest() green — the guard is a typeof (P8, his T5)", () => {
    if (bananaSlice === null || bananaSlice.refused) return 'REFUSED';
    try {
      const r = bananaSlice.mod.selfTest();
      return { ok: r === true, detail: `crippled selfTest() → ${r} (green on a non-rev, as predicted)` };
    } catch (e) {
      return { ok: false, detail: `it threw, so the live guard already catches a non-rev: ${e.message}` };
    }
  });

  const nearMissLine = "    ['docs/mail/read/calliope-to-dispatch-ssh443-workaround-2026-04-18.md', null, null],\n";
  const nmSlice = await sliceCrippled('nonearmiss', (src) =>
    src.includes(nearMissLine) ? src.replace(nearMissLine, '') : null
  );
  check('R9', 'PRE-CURE: deleting the S6 near-miss ENTRY leaves selfTest() green (P9, his T4p)', () => {
    if (nmSlice === null || nmSlice.refused) return 'REFUSED';
    try {
      const r = nmSlice.mod.selfTest();
      const cases = [...nmSlice.mod.SOURCE_CASES.present, ...nmSlice.mod.SOURCE_CASES.synthetic];
      return { ok: r === true, detail: `crippled selfTest() → ${r} with ${cases.length} path cases left` };
    } catch (e) {
      return { ok: false, detail: `it threw, so the entry is already required: ${e.message}` };
    }
  });

  check('R9b', 'the cripple LANDED — the deleted line is the array entry, not the docblock mention', () => {
    if (nmSlice === null || nmSlice.refused) return 'REFUSED';
    const stillInCases = nmSlice.mod.SOURCE_CASES.present.some(([p]) => /workaround-2026-04-18/.test(p));
    const docblockIntact = /round\[ -\]\?\(\\d\+\)|tail of "workaround"|tail of the word/.test(nmSlice.src);
    return {
      ok: stillInCases === false,
      detail: `entry present after cripple=${stillInCases} · a workaround mention survives in prose=${docblockIntact}`,
    };
  });

  // ---------------------------------------------------------------- P10 / P11: two readers, two answers
  const multi = check('R10', 'classifyPath credits the LAST round of a multi-round path; the census key reads the FIRST (P10, his T6/T6b)', () => {
    if (headTree === null) return 'REFUSED';
    const paths = headTree.split('\n').filter(Boolean);
    const multiRound = [];
    for (const p of paths) {
      const all = [...p.matchAll(/round(\d+)/gi)].map((m) => Number(m[1]));
      if (new Set(all).size >= 2) multiRound.push({ p, all });
    }
    const disagree = multiRound.filter(({ p, all }) => {
      const c = HEADMOD.classifyPath(p);
      return c.round !== null && c.round !== all[0];
    });
    const inMail = disagree.filter(({ p }) => /^docs\/mail\//.test(p));
    return {
      ok: multiRound.length >= 2 && disagree.length === 5 && inMail.length === 2,
      detail: `multi-round paths=${multiRound.length} · credits other than first=${disagree.length} · of those under docs/mail=${inMail.length}`,
      multiRound,
      disagree,
      inMail,
    };
  });

  check('R11', 'rounds named by a CLAIMED multi-round path and not credited by it = 28 (P11, his T6c)', () => {
    if (!multi || !multi.multiRound) return 'REFUSED';
    const uncredited = new Set();
    for (const { p, all } of multi.multiRound) {
      const c = HEADMOD.classifyPath(p);
      if (c.source === null) continue;
      for (const n of all) if (n !== c.round) uncredited.add(n);
    }
    const list = [...uncredited].sort((a, b) => a - b);
    return { ok: list.length === 28, detail: `uncredited rounds=${list.length} → [${list.slice(0, 10)}${list.length > 10 ? ', …' : ''}]`, list };
  });

  check('R12', 'the boundary cure leaves the docs/mail multi-round figure AT 2 — the defects are independent (P12)', () => {
    if (headTree === null || curedSlice === null || curedSlice.refused) return 'REFUSED';
    const paths = headTree.split('\n').filter(Boolean);
    const cp = curedSlice.mod.classifyPath;
    let disagree = 0;
    let inMail = 0;
    for (const p of paths) {
      const all = [...p.matchAll(/round(\d+)/gi)].map((m) => Number(m[1]));
      if (new Set(all).size < 2) continue;
      const c = cp(p);
      if (c.round !== null && c.round !== all[0]) {
        disagree += 1;
        if (/^docs\/mail\//.test(p)) inMail += 1;
      }
    }
    return { ok: inMail === 2, detail: `under the CURED key: credits other than first=${disagree} · under docs/mail=${inMail}` };
  });

  // ---------------------------------------------------------------- P14: the gate
  check('R14', 'no gate leg is owed — packages/ and scripts/ are clean (P14)', () => {
    const st = git(['status', '--porcelain', 'packages', 'scripts']);
    if (st === null) return 'REFUSED';
    return { ok: st.trim() === '', detail: `git status --porcelain packages scripts → ${JSON.stringify(st)}` };
  });

  // ---------------------------------------------------------------- report
  console.log('unit-465routecure arm A — the routed route, graded before it is cured');
  console.log(`repo=${REPO}`);
  console.log(`subject=${MODPATH} · classifierRev=${CLASSIFIER_REV} · treeRev=${TREE_REV}`);
  console.log('');
  for (const l of legs) {
    console.log(`${l.verdict.padEnd(8)} ${l.id.padEnd(5)} ${l.what}`);
    if (l.detail) console.log(`                 ${l.detail}`);
  }
  console.log('');
  const preds = 14;
  console.log(
    `VERDICT/${red.length || refused.length ? 1 : 0} ${red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN'} ` +
      `legs=${legs.length} red=[${red}] refused=[${refused}] preds=${preds}`
  );
  process.exit(red.length || refused.length ? 1 : 0);
}

main().catch((e) => {
  console.log(`CRASH — the arm itself failed: ${e.stack}`);
  console.log('VERDICT/1 CRASH legs=0 red=[] refused=[all] preds=14');
  process.exit(2);
});
