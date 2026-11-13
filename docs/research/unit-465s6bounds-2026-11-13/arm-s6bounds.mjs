/**
 * `unit-465s6bounds-2026-11-13` — grading the three cures in Daedalus's 11/13 START commits.
 *
 * Subject: `docs/research/lib/attested-rounds.mjs` at HEAD. Predictions are in this unit's
 * PRE-REGISTRATION.md, pushed to origin/main as `c2d9ffe3` BEFORE this file existed.
 *
 * Every cripple is built from `git show <rev>:<path>` and written to its own file. No leg edits the
 * live module, and no cripple is built on top of another cripple's text.
 *
 * Run:  node docs/research/unit-465s6bounds-2026-11-13/arm-s6bounds.mjs
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const MOD = 'docs/research/lib/attested-rounds.mjs';

const legs = [];
const refused = [];
const preds = [];
function leg(id, ok, note) {
  legs.push({ id, ok, note });
  console.log(`${ok ? 'ok  ' : 'RED '} ${id}  ${note}`);
}
function refuse(id, why) {
  refused.push(id);
  console.log(`REF  ${id}  ${why}`);
}
function pred(id, held, note) {
  preds.push({ id, held, note });
  console.log(`PRED ${id}  ${held ? 'HELD' : 'REFUTED'}  ${note}`);
}

function git(repo, args) {
  const r = spawnSync('git', ['-C', repo, ...args], { stdio: 'pipe', encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout;
}

/** Slice a file out of git at a rev into this unit's dir, and import it. `null` on refusal. */
async function sliceModule(rev, outName, mutate = (s) => s) {
  const src = git(REPO, ['show', `${rev}:${MOD}`]);
  if (src === null) return null;
  const out = join(HERE, outName);
  writeFileSync(out, mutate(src));
  return import(`file://${out}`);
}

const live = await import(`file://${join(REPO, MOD)}`);
const tree = git(REPO, ['ls-tree', '-r', '--name-only', 'HEAD']);
if (tree === null) {
  console.log('VERDICT/2 REFUSED legs=0 red=[] refused=[tree] — git ls-tree HEAD failed');
  process.exit(2);
}
const paths = tree.split('\n').filter(Boolean);

// ---------------------------------------------------------------------------------------------
// P1 — the strict S6 key reads a word tail; only the separator was excluded.
// ---------------------------------------------------------------------------------------------
const REAL_NEARMISS = 'docs/mail/read/calliope-to-dispatch-ssh443-workaround-2026-04-18.md';
const NOSEP = REAL_NEARMISS.replace('workaround-2026', 'workaround2026');
{
  const real = live.classifyPath(REAL_NEARMISS);
  const nosep = live.classifyPath(NOSEP);
  leg('T1a', real.source === null && real.round === null,
    `the real near-miss is claimed by nothing: ${real.source}/${real.round}`);
  const held = nosep.source === 'S6' && nosep.round === 2026;
  leg('T1b', held, `separator removed → ${nosep.source}/${nosep.round} (want S6/2026)`);
  pred('P1', held, `strict S6 on a word tail: ${nosep.source}/${nosep.round}`);
}

// ---------------------------------------------------------------------------------------------
// P2 — is the word-tail class live under docs/mail/ at HEAD, or prophylactic?
// S6's `.*` is greedy and crosses `/`, so the match it uses is the LAST `round\d+` in the path.
// ---------------------------------------------------------------------------------------------
function lastRoundIdx(p) {
  let idx = -1;
  for (const m of p.matchAll(/round(\d+)/gi)) idx = m.index;
  return idx;
}
function firstRoundNum(p) {
  const m = /round(\d+)/i.exec(p);
  return m ? Number(m[1]) : null;
}
{
  const mail = paths.filter((p) => /^docs\/mail\//.test(p) && /round\d+/i.test(p));
  const tails = mail.filter((p) => {
    const i = lastRoundIdx(p);
    return i > 0 && /[A-Za-z]/.test(p[i - 1]);
  });
  leg('T2', true, `docs/mail paths naming a round: ${mail.length} · of those, word-tail matches: ${tails.length} ${JSON.stringify(tails.slice(0, 3))}`);
  pred('P2', tails.length === 0, `word-tail S6 matches under docs/mail at HEAD: ${tails.length}`);
}

// ---------------------------------------------------------------------------------------------
// P3 — a word-tail round is denial-proof: it lands in nonSubject via mailRounds.
// Driven through the REAL `attestedRounds` over a scratch git repo holding exactly that path, so
// this is a tree read and not an assertion about one.
// ---------------------------------------------------------------------------------------------
{
  let scratch = null;
  try {
    scratch = mkdtempSync(join(tmpdir(), 's6bounds-'));
    mkdirSync(join(scratch, 'docs', 'mail', 'read'), { recursive: true });
    writeFileSync(join(scratch, NOSEP), 'scratch fixture for one leg\n');
    const init = git(scratch, ['init', '-q']);
    const cfg1 = git(scratch, ['config', 'user.email', 'scratch@example.invalid']);
    const cfg2 = git(scratch, ['config', 'user.name', 'scratch']);
    const add = git(scratch, ['add', '-A']);
    // A subject naming NO round, so nothing enters via S4 and the only attestation is the path.
    const ci = git(scratch, ['commit', '-q', '-m', 'scratch fixture: one mail path, no numbers in this subject']);
    if ([init, cfg1, cfg2, add, ci].some((x) => x === null)) {
      refuse('T3', 'scratch repo setup failed; no leg is scored from a half-built fixture');
      pred('P3', false, 'REFUSED — fixture unavailable, not evidence either way');
    } else {
      const pop = live.attestedRounds(scratch, 'HEAD');
      if (pop === null) {
        refuse('T3', 'attestedRounds refused on the scratch repo');
        pred('P3', false, 'REFUSED — reader refused, not evidence either way');
      } else {
        const inNon = pop.nonSubject.has(2026);
        const inFil = pop.filtered.has(2026);
        const viaMail = pop.mailRounds.has(2026);
        const held = inNon && inFil && viaMail;
        leg('T3', held,
          `scratch tree, one word-tail mail path → 2026 ∈ mailRounds=${viaMail} nonSubject=${inNon} filtered=${inFil} · removed=${JSON.stringify(pop.removed)} · |filtered|=${pop.filtered.size}`);
        pred('P3', held, `a word tail becomes a denial-proof member: ${held}`);
      }
    }
  } finally {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------------------------
// P4 — the near-miss case that makes §4's "the rejection is a test" true is deletable, green.
// ---------------------------------------------------------------------------------------------
{
  const mod = await sliceModule('HEAD', 'cripple-p4-no-nearmiss.mjs', (s) => {
    const lines = s.split('\n');
    const i = lines.findIndex((l) => l.includes('ssh443-workaround-2026-04-18.md'));
    if (i < 0) return s; // leaves the leg to notice nothing changed
    lines.splice(i, 1);
    return lines.join('\n');
  });
  if (mod === null) {
    refuse('T4', 'git show HEAD:module failed');
    pred('P4', false, 'REFUSED');
  } else {
    const stillThere = mod.SOURCE_CASES.present.some(([p]) => p.includes('ssh443-workaround'));
    if (stillThere) {
      refuse('T4', 'cripple did not remove the near-miss case — a cripple that did not land grades nothing');
      pred('P4', false, 'REFUSED — cripple did not land');
    } else {
      let got;
      try { got = mod.selfTest(); } catch (e) { got = `THREW: ${e.message}`; }
      const held = got === true;
      leg('T4', held,
        `near-miss case deleted → selfTest() ${JSON.stringify(got)} · cases left=${mod.SOURCE_CASES.present.length + mod.SOURCE_CASES.synthetic.length} (floor is >= 8)`);
      pred('P4', held, `the near-miss is unguarded: selfTest green without it = ${held}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// P5 / P5b — the second-axis guard is a typeof, and it is live rather than dead.
// ---------------------------------------------------------------------------------------------
{
  const mod = await sliceModule('HEAD', 'cripple-p5-classifierrev-banana.mjs',
    (s) => s.replace("classifierRev: '6c9a4348'", "classifierRev: 'banana'"));
  if (mod === null) {
    refuse('T5', 'git show HEAD:module failed');
    pred('P5', false, 'REFUSED');
  } else {
    const landed = mod.SOURCE_RECALL_FLOOR.at3ee13880.classifierRev === 'banana';
    if (!landed) {
      refuse('T5', 'cripple did not land');
      pred('P5', false, 'REFUSED — cripple did not land');
    } else {
      let got;
      try { got = mod.selfTest(); } catch (e) { got = `THREW: ${e.message}`; }
      const held = got === true;
      leg('T5', held, `classifierRev='banana' → selfTest() ${JSON.stringify(got)}`);
      pred('P5', held, `the guard checks type, not value: ${held}`);
    }
  }
}
{
  const mod = await sliceModule('HEAD', 'cripple-p5b-classifierrev-deleted.mjs',
    (s) => s.replace(/\n\s*classifierRev: '6c9a4348',/, ''));
  if (mod === null) {
    refuse('T5b', 'git show HEAD:module failed');
    pred('P5b', false, 'REFUSED');
  } else {
    const landed = mod.SOURCE_RECALL_FLOOR.at3ee13880.classifierRev === undefined;
    if (!landed) {
      refuse('T5b', 'cripple did not land');
      pred('P5b', false, 'REFUSED — cripple did not land');
    } else {
      let got;
      try { got = mod.selfTest(); } catch (e) { got = `THREW: ${e.message}`; }
      const threw = typeof got === 'string' && /classifier/i.test(got);
      leg('T5b', threw, `classifierRev deleted → ${JSON.stringify(got)}`);
      pred('P5b', threw, `the guard is live, not dead: ${threw}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// P6 / P6b — two readers of one path, and whether the class is live.
// ---------------------------------------------------------------------------------------------
{
  const multi = paths.filter((p) => {
    const ns = [...p.matchAll(/round(\d+)/gi)].map((m) => Number(m[1]));
    return new Set(ns).size >= 2;
  });
  const disagree = multi.filter((p) => {
    const c = live.classifyPath(p);
    return c.round !== null && c.round !== firstRoundNum(p);
  });
  const mailMulti = multi.filter((p) => /^docs\/mail\//.test(p));
  leg('T6', true,
    `tree@HEAD paths naming >=2 distinct rounds: ${multi.length} · classifyPath credits a round other than the first: ${disagree.length} ${JSON.stringify(disagree.slice(0, 3))}`);
  pred('P6', disagree.length >= 1, `the two readers of one path disagree on ${disagree.length} live path(s)`);
  leg('T6b', true, `of those, under docs/mail/: ${mailMulti.length} ${JSON.stringify(mailMulti.slice(0, 3))}`);
  pred('P6b', mailMulti.length === 0, `multi-round docs/mail paths at HEAD: ${mailMulti.length}`);

  // The consequence, measured rather than argued: a path CLAIMED by a source for one round hides
  // every other round it names from `unattestedRoundsAt`, which only censuses unclaimed paths.
  const hidden = new Set();
  for (const p of multi) {
    const c = live.classifyPath(p);
    if (c.source === null) continue;
    for (const m of p.matchAll(/round(\d+)/gi)) {
      const n = Number(m[1]);
      if (n !== c.round) hidden.add(n);
    }
  }
  leg('T6c', true,
    `rounds named by a CLAIMED multi-round path but not credited by it: ${hidden.size} ${JSON.stringify([...hidden].sort((a, b) => a - b).slice(0, 8))}`);
}

// ---------------------------------------------------------------------------------------------
// P7 / P7b — was `casePathsPresent` driven in the unit that added an S6 present-case?
// ---------------------------------------------------------------------------------------------
{
  const arm = git(REPO, ['show', 'HEAD:docs/research/unit-465maildurable-2026-11-13/arm-maildurable.mjs']);
  if (arm === null) {
    refuse('T7', 'could not read the other unit\'s arm from git');
    pred('P7', false, 'REFUSED');
  } else {
    const hits = (arm.match(/casePathsPresent/g) || []).length;
    leg('T7', true, `arm-maildurable.mjs mentions casePathsPresent ${hits} time(s)`);
    pred('P7', hits === 0, `the present-case assertion was not driven in that unit: ${hits === 0}`);
  }
  const kp = 'docs/mail/read/daedalus-to-argus-round9.md';
  const present = paths.includes(kp);
  leg('T7b', true, `S6's present-KP in tree@HEAD: ${present}`);
  pred('P7b', present, `the KP path exists: ${present}`);

  // And drive the check the module says a cell must drive, at HEAD, for all present cases.
  const missing = live.casePathsPresent(REPO, 'HEAD');
  if (missing === null) refuse('T7c', 'casePathsPresent refused');
  else leg('T7c', missing.length === 0, `casePathsPresent(HEAD) missing=${JSON.stringify(missing)}`);
}

// ---------------------------------------------------------------------------------------------
// P8 / P9 — reproductions of his T6 and T11, on the two axes of the pin.
// ---------------------------------------------------------------------------------------------
{
  const sliced = await sliceModule('6c9a4348', 'sliced-classifier-6c9a4348.mjs');
  if (sliced === null) {
    refuse('T8', 'git show 6c9a4348:module failed');
    pred('P8', false, 'REFUSED');
  } else {
    const r = sliced.unattestedRoundsAt(REPO, '3ee13880');
    if (r === null) {
      refuse('T8', 'sliced unattestedRoundsAt refused');
      pred('P8', false, 'REFUSED');
    } else {
      const held = r.paths === 207 && JSON.stringify(r.outside) === '[9]';
      const pin = live.SOURCE_RECALL_FLOOR.at3ee13880;
      leg('T8', held,
        `classifier@6c9a4348 over tree@3ee13880 → paths=${r.paths} outside=${JSON.stringify(r.outside)} (pin: ${pin.invisiblePaths}/${JSON.stringify(pin.unattestedRounds)})`);
      pred('P8', held, `his T6 reproduces: ${held}`);
      leg('T8b', sliced.SOURCE_IDS === undefined || !sliced.SOURCE_IDS.includes('S6'),
        `the sliced classifier declares S6: ${sliced.SOURCE_IDS ? sliced.SOURCE_IDS.includes('S6') : 'no SOURCE_IDS export'}`);
    }
  }
  const r2 = live.unattestedRoundsAt(REPO, '3ee13880');
  if (r2 === null) {
    refuse('T9', 'live unattestedRoundsAt refused');
    pred('P9', false, 'REFUSED');
  } else {
    const held = r2.paths === 127 && r2.outside.length === 0;
    leg('T9', held, `classifier@HEAD over tree@3ee13880 → paths=${r2.paths} outside=${JSON.stringify(r2.outside)}`);
    pred('P9', held, `his T11 reproduces: ${held}`);
  }
}

// ---------------------------------------------------------------------------------------------
// P10 / P10b — the at-risk set, at his rev and at HEAD.
// at-risk = in `filtered`, NOT in nonSubject, affirmed by exactly ONE non-denying subject row.
// ---------------------------------------------------------------------------------------------
function atRisk(mod, rev) {
  const pop = mod.attestedRounds(REPO, rev);
  if (pop === null) return null;
  const affirmCount = new Map();
  for (const r of pop.rows) {
    if (r.round !== null && r.denies !== r.round) affirmCount.set(r.round, (affirmCount.get(r.round) || 0) + 1);
  }
  return [...pop.filtered]
    .filter((n) => !pop.nonSubject.has(n) && affirmCount.get(n) === 1)
    .sort((a, b) => a - b);
}
{
  const atHis = atRisk(live, '6c9a4348');
  if (atHis === null) {
    refuse('T10', 'attestedRounds refused at 6c9a4348');
    pred('P10', false, 'REFUSED');
  } else {
    const held = JSON.stringify(atHis) === JSON.stringify([10, 270, 282, 319, 466]);
    leg('T10', held, `at-risk@6c9a4348 = ${JSON.stringify(atHis)} (his T8: [10,270,282,319,466])`);
    pred('P10', held, `his T8 reproduces: ${held}`);
  }
  const atHead = atRisk(live, 'HEAD');
  if (atHead === null) {
    refuse('T10b', 'attestedRounds refused at HEAD');
    pred('P10b', false, 'REFUSED');
  } else {
    const held = !atHead.includes(10) && atHead.length <= 4;
    leg('T10b', held, `at-risk@HEAD = ${JSON.stringify(atHead)} · 10 absent=${!atHead.includes(10)} · size=${atHead.length}`);
    pred('P10b', held, `S6 made 10 denial-proof and the set did not grow: ${held}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Live module's own selfTest, ungated by any cripple, and the gate-leg scope check.
// ---------------------------------------------------------------------------------------------
{
  let got;
  try { got = live.selfTest(); } catch (e) { got = `THREW: ${e.message}`; }
  leg('T11', got === true, `live selfTest() → ${JSON.stringify(got)}`);
}
{
  const dirty = git(REPO, ['status', '--porcelain', 'packages', 'scripts']);
  leg('T12', dirty === '', `git status --porcelain packages scripts → ${JSON.stringify(dirty)} (empty ⇒ no gate leg owed)`);
}

const red = legs.filter((l) => !l.ok).map((l) => l.id);
const refutedPreds = preds.filter((p) => !p.held).map((p) => p.id);
console.log(
  `VERDICT/${red.length ? 1 : 0} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=[${red}] refused=[${refused}] preds=${preds.length} refuted=[${refutedPreds}]`
);
process.exit(red.length ? 1 : 0);
