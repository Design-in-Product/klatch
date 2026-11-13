#!/usr/bin/env node
/**
 * unit-465maildurable — grading Theseus's 11/12 §2 durability premise, pricing a sixth source over
 * `docs/mail/`, and measuring the `SOURCE_RECALL_FLOOR` consumer trap.
 *
 * ## Why both arms are sliced out of git and not hand-typed
 *
 * This unit cures its own subject (`docs/research/lib/attested-rounds.mjs`). A baseline read off the
 * working tree would invert the moment the cure lands, and a hand-typed re-implementation of the
 * sixth source would grade a reader that never shipped. So:
 *
 *   - the **baseline** is `git show <BASE_REV>:docs/research/lib/attested-rounds.mjs` verbatim;
 *   - the **S6 arms** are that same text with a declared textual insertion, each anchor pinned to
 *     **exactly one** occurrence — the arm refuses before printing any figure if an anchor is
 *     missing or repeated.
 *
 * `BASE_REV` is this unit's own pre-registration commit, which predates every line of the cure, so
 * this drive reproduces from git at any later rev.
 *
 * ## Why every graded figure is taken at a pinned rev and not at HEAD
 *
 * `HEAD` moves while the fire runs — including by this unit's own commits, which is the exact
 * mechanism under test (a commit subject naming a round attests it). A leg that reads a frozen
 * artefact and a live subject is neither a pin nor a gate. Every graded figure here is taken at
 * `NOW_REV`; a HEAD read is printed as a declared, **ungraded** diagnostic.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRATCH = join(HERE, 'scratch');
const MODPATH = 'docs/research/lib/attested-rounds.mjs';

/** This unit's pre-registration commit: the module's pre-cure state, and the rev every figure is taken at. */
const BASE_REV = '6c9a4348';
const NOW_REV = BASE_REV;
/** The rev `SOURCE_RECALL_FLOOR` is pinned to. Read off the constant, not re-typed, where possible. */
const PINNED_FLOOR_REV = '3ee13880';

const sortNum = (it) => [...it].sort((a, b) => a - b);
const setDiff = (a, b) => sortNum([...a].filter((n) => !b.has(n)));

function git(args) {
  // stderr to 'pipe', not inherited: a child's stderr echoed into this recording contaminates it.
  return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// ---------------------------------------------------------------------------------------------
// The two arms, sliced and extended
// ---------------------------------------------------------------------------------------------

const A_BYSOURCE = `const bySource = { S1: new Set(), S2: new Set(), S3: new Set(), S5: new Set() };`;
const A_S5BRANCH = `  m = /^docs\\/research\\/unit-(\\d+)/.exec(p);
  if (m) return { source: 'S5', round: Number(m[1]) };`;
const A_NONSUBJ = `  const nonSubject = new Set([...dirs, ...tests, ...otherDocs, ...unitRounds]);`;
const A_RETURN = `    unitRounds,`;

/** Replace `needle` with `rep`, refusing unless it occurs EXACTLY once. */
function pinnedReplace(src, needle, rep, label) {
  let n = 0;
  let i = src.indexOf(needle);
  while (i !== -1) { n += 1; i = src.indexOf(needle, i + 1); }
  if (n !== 1) throw new Error(`REFUSED: anchor ${label} occurs ${n} time(s) in ${MODPATH}@${BASE_REV}, want exactly 1`);
  return src.replace(needle, rep);
}

/** The baseline text, plus a sixth source keyed by `mailRe`, inserted LAST so order is unchanged. */
function withMailSource(src, mailRe) {
  let out = pinnedReplace(src, A_BYSOURCE,
    `const bySource = { S1: new Set(), S2: new Set(), S3: new Set(), S5: new Set(), S6: new Set() };`,
    'bySource');
  out = pinnedReplace(out, A_S5BRANCH,
    `${A_S5BRANCH}\n  m = ${mailRe}.exec(p);\n  if (m) return { source: 'S6', round: Number(m[1]) };`,
    'S5branch');
  out = pinnedReplace(out, A_NONSUBJ,
    `  const mailRounds = bySource.S6;\n  const nonSubject = new Set([...dirs, ...tests, ...otherDocs, ...unitRounds, ...mailRounds]);`,
    'nonSubject');
  out = pinnedReplace(out, A_RETURN, `${A_RETURN}\n    mailRounds,`, 'return');
  return out;
}

const MAIL_STRICT = String.raw`/^docs\/mail\/.*round(\d+)/i`;
const MAIL_LOOSE = String.raw`/^docs\/mail\/.*round[ -]?(\d+)/i`;

mkdirSync(SCRATCH, { recursive: true });
const baseSrc = git(['show', `${BASE_REV}:${MODPATH}`]);
const files = {
  base: [join(SCRATCH, 'base.mjs'), baseSrc],
  strict: [join(SCRATCH, 's6strict.mjs'), withMailSource(baseSrc, MAIL_STRICT)],
  loose: [join(SCRATCH, 's6loose.mjs'), withMailSource(baseSrc, MAIL_LOOSE)],
};
for (const [p, text] of Object.values(files)) writeFileSync(p, text);

const base = await import(files.base[0]);
const strict = await import(files.strict[0]);
const loose = await import(files.loose[0]);

// ---------------------------------------------------------------------------------------------
// Leg / prediction bookkeeping
// ---------------------------------------------------------------------------------------------

const legs = [];
const preds = [];
function leg(id, what, fn) {
  let r;
  try { r = fn(); } catch (e) { r = { ok: false, note: `THREW: ${e.message}` }; }
  legs.push({ id, what, ...r });
  const tag = r.refused ? 'REFUSED' : r.ok ? 'ok ' : 'RED';
  console.log(`${tag.padEnd(8)} ${id.padEnd(4)} ${what}`);
  if (r.note) console.log(`${' '.repeat(13)}${r.note}`);
  if (r.why) console.log(`${' '.repeat(13)}why: ${r.why}`);
  return r;
}
function pred(id, claim, held, note) {
  preds.push({ id, claim, held, note });
  const tag = held === 'refused' ? 'REFUSED' : held ? 'HELD' : 'REFUTED';
  console.log(`PRED ${id.padEnd(4)} ${tag.padEnd(8)} ${claim}`);
  if (note) console.log(`${' '.repeat(18)}${note}`);
}

console.log(`# unit-465maildurable · base=${BASE_REV} now=${NOW_REV} floor-pin=${PINNED_FLOOR_REV}`);
console.log(`# module sliced from git, S6 inserted at 4 pinned anchors · generated ${new Date().toISOString()}`);
console.log('');

// ---------------------------------------------------------------------------------------------
// Apparatus: the baseline population, and the sanity check that the slice is the real module
// ---------------------------------------------------------------------------------------------

leg('A1', 'the sliced baseline is the real module: its own selfTest() passes and its KPs are in-tree', () => {
  const st = base.selfTest();
  const missing = base.casePathsPresent(REPO, NOW_REV);
  return {
    ok: st === true && Array.isArray(missing) && missing.length === 0,
    note: `selfTest=${st} · casePathsPresent@${NOW_REV}=[${missing === null ? 'REFUSED' : missing}]`,
  };
});

const clean = base.attestedRounds(REPO, NOW_REV);
if (clean === null) { console.log('REFUSED: baseline population refused at NOW_REV'); process.exit(1); }

leg('A2', 'the two arms differ from the baseline in source, and only by the inserted source', () => {
  const dStrict = files.strict[1] !== files.base[1];
  const dLoose = files.loose[1] !== files.base[1];
  const extra = files.strict[1].length - files.base[1].length;
  return { ok: dStrict && dLoose && files.strict[1] !== files.loose[1], note: `strict≠base=${dStrict} loose≠base=${dLoose} · +${extra} chars` };
});

// ---------------------------------------------------------------------------------------------
// P1 / P2 — the durability premise, graded through the module's own denialRe seam
// ---------------------------------------------------------------------------------------------

/** Denies 9 on ONE of the two affirming rows: only `7f0b63e6`'s subject contains "tasks". */
const DENY_ONE = /tasks[\s\S]*?round\s*(\d+)/i;
/** Denies 9 on BOTH affirming rows: both subjects end "the blind spot hides round 9". */
const DENY_BOTH = /hides\s+round\s*(\d+)/i;

const affirming9 = clean.rows.filter((r) => r.round === 9 && r.denies !== 9);
const one = base.attestedRounds(REPO, NOW_REV, { denialRe: DENY_ONE });
const both = base.attestedRounds(REPO, NOW_REV, { denialRe: DENY_BOTH });

const t1 = leg('T1', 'a synthetic key denying 9 on exactly ONE affirming row leaves 9 in the population', () => {
  if (one === null) return { refused: true, why: 'population refused under the one-row key' };
  const deniers = one.rows.filter((r) => r.denies === 9);
  const stillAffirm = one.rows.filter((r) => r.round === 9 && r.denies !== 9);
  return {
    ok: deniers.length === 1 && one.filtered.has(9) && !one.removed.includes(9),
    note: `affirming rows at base=${affirming9.length} [${affirming9.map((r) => r.hash.slice(0, 8))}] · `
      + `rows denying 9 under the one-row key=${deniers.length} [${deniers.map((r) => r.hash.slice(0, 8))}] · `
      + `rows still affirming=${stillAffirm.length} · 9∈filtered=${one.filtered.has(9)} · removed=[${one.removed}]`,
  };
});
pred('P1', 'the durability premise is FALSE: one future denial does not remove 9',
  t1.refused ? 'refused' : t1.ok, t1.note);

const t2 = leg('T2', 'a synthetic key denying 9 on BOTH affirming rows DOES remove it', () => {
  if (both === null) return { refused: true, why: 'population refused under the both-row key' };
  const deniers = both.rows.filter((r) => r.denies === 9);
  return {
    ok: deniers.length === affirming9.length && deniers.length >= 2 && !both.filtered.has(9) && both.removed.includes(9),
    note: `rows denying 9=${deniers.length} of ${affirming9.length} affirming · 9∈filtered=${both.filtered.has(9)} · removed=[${both.removed}]`,
  };
});
pred('P2', 'removal requires EVERY attestation to be a denial', t2.refused ? 'refused' : t2.ok, t2.note);

// ---------------------------------------------------------------------------------------------
// P3 / P4 — what a strict sixth source buys, as a set difference both ways
// ---------------------------------------------------------------------------------------------

function s6Delta(mod, rev) {
  const a = base.attestedRounds(REPO, rev);
  const b = mod.attestedRounds(REPO, rev);
  if (a === null || b === null) return null;
  return {
    gained: setDiff(b.filtered, a.filtered),
    lost: setDiff(a.filtered, b.filtered),
    mail: sortNum(b.mailRounds),
    beforeN: a.filtered.size,
    afterN: b.filtered.size,
    nonSubjectGained: setDiff(b.nonSubject, a.nonSubject),
  };
}

const dNow = s6Delta(strict, NOW_REV);
const t3 = leg('T3', `strict S6 at ${NOW_REV} adds no member, as a set difference both ways`, () => {
  if (dNow === null) return { refused: true, why: 'a population refused' };
  return {
    ok: dNow.gained.length === 0 && dNow.lost.length === 0,
    note: `|filtered| ${dNow.beforeN} → ${dNow.afterN} · gained=[${dNow.gained}] lost=[${dNow.lost}] · `
      + `S6 claims ${dNow.mail.length} distinct round(s) · nonSubject gains ${dNow.nonSubjectGained.length}: [${dNow.nonSubjectGained.slice(0, 12)}${dNow.nonSubjectGained.length > 12 ? ', …' : ''}]`,
  };
});
pred('P3', 'strict S6 adds zero members at the current rev', t3.refused ? 'refused' : t3.ok, t3.note);

const dPin = s6Delta(strict, PINNED_FLOOR_REV);
const t4 = leg('T4', `strict S6 at ${PINNED_FLOOR_REV} adds exactly [9]`, () => {
  if (dPin === null) return { refused: true, why: 'a population refused at the pinned rev' };
  return {
    ok: String(dPin.gained) === '9' && dPin.lost.length === 0,
    note: `|filtered| ${dPin.beforeN} → ${dPin.afterN} · gained=[${dPin.gained}] lost=[${dPin.lost}]`,
  };
});
pred('P4', 'the pinned-rev figure reproduces: strict S6 adds [9] there', t4.refused ? 'refused' : t4.ok, t4.note);

// ---------------------------------------------------------------------------------------------
// P5 — the loose key, which my own docblock calls wrong without ever measuring it
// ---------------------------------------------------------------------------------------------

const dLoose = s6Delta(loose, NOW_REV);
const t5 = leg('T5', 'the loose key admits a date as a round; the strict key does not', () => {
  if (dLoose === null || dNow === null) return { refused: true, why: 'a population refused' };
  const looseBig = dLoose.mail.filter((n) => n >= 1000);
  const strictBig = dNow.mail.filter((n) => n >= 1000);
  const looseGainedBig = dLoose.gained.filter((n) => n >= 1000);
  return {
    ok: looseBig.length >= 1 && strictBig.length === 0,
    note: `loose S6 claims ${dLoose.mail.length} round(s), ${looseBig.length} of them ≥1000: [${looseBig}] · `
      + `strict claims ${dNow.mail.length}, max=${dNow.mail.length ? Math.max(...dNow.mail) : 'n/a'}, ≥1000: [${strictBig}] · `
      + `loose gained=[${dLoose.gained}] of which ≥1000: [${looseGainedBig}]`,
  };
});
pred('P5', 'the loose key admits ≥1 member ≥1000 and the strict key admits none',
  t5.refused ? 'refused' : t5.ok, t5.note);

// ---------------------------------------------------------------------------------------------
// P6 / P7 — the floor's consumer trap, measured at both revs by one reader
// ---------------------------------------------------------------------------------------------

/**
 * The candidate reader: rounds named by a path **no source pattern claims**, that nothing else
 * attests. Reproduces `unit-465srckeys` leg T7's key (`/round\d+/i` for "names a round",
 * `classifyPath(p).source === null` for "invisible"), as a function of rev rather than a constant.
 */
function unattestedAt(mod, rev) {
  const tree = mod.git(REPO, ['ls-tree', '-r', '--name-only', rev]);
  const pop = mod.attestedRounds(REPO, rev);
  if (tree === null || pop === null) return null;
  const invisible = tree.split('\n').filter((p) => /round\d+/i.test(p) && mod.classifyPath(p).source === null);
  const rounds = new Set(invisible.map((p) => Number(/round(\d+)/i.exec(p)[1])));
  return { paths: invisible.length, rounds: sortNum(rounds), outside: sortNum([...rounds].filter((n) => !pop.filtered.has(n))) };
}

const floor = base.SOURCE_RECALL_FLOOR;
const fPin = unattestedAt(base, floor.rev);
const t6 = leg('T6', 'the floor reader reproduces SOURCE_RECALL_FLOOR exactly at the constant\'s OWN rev', () => {
  if (fPin === null) return { refused: true, why: 'the floor read refused at the pinned rev' };
  return {
    ok: String(fPin.outside) === String(floor.unattestedRounds) && fPin.paths === floor.invisiblePaths,
    note: `@${floor.rev}: paths=${fPin.paths} (pinned ${floor.invisiblePaths}) · distinct rounds=${fPin.rounds.length} · `
      + `outside=[${fPin.outside}] (pinned [${floor.unattestedRounds}])`,
  };
});
pred('P6', 'the pin was right at its own rev', t6.refused ? 'refused' : t6.ok, t6.note);

const fNow = unattestedAt(base, NOW_REV);
const t7 = leg('T7', 'the SAME reader at the current rev returns an empty unattested set — the trap', () => {
  if (fNow === null) return { refused: true, why: 'the floor read refused at the current rev' };
  const wouldBeRed = String(fNow.outside) !== String(floor.unattestedRounds);
  return {
    ok: fNow.outside.length === 0 && wouldBeRed,
    note: `@${NOW_REV}: paths=${fNow.paths} · distinct rounds=${fNow.rounds.length} · outside=[${fNow.outside}] · `
      + `a consumer asserting the pinned [${floor.unattestedRounds}] against this read goes RED=${wouldBeRed}`,
  };
});
pred('P7', 'the constant is false against a current-rev read — the consumer hazard is real',
  t7.refused ? 'refused' : t7.ok, t7.note);

// ---------------------------------------------------------------------------------------------
// P8 / P9 — the set a single future denial COULD remove, and whether S6 covers any of it
// ---------------------------------------------------------------------------------------------

/** Members held by exactly one non-denying subject row and by no non-subject source. */
function atRiskOf(pop) {
  const out = [];
  for (const n of pop.filtered) {
    if (pop.nonSubject.has(n)) continue;
    const affirms = pop.rows.filter((r) => r.round === n && r.denies !== n).length;
    if (affirms === 1) out.push(n);
  }
  return sortNum(out);
}
const atRisk = atRiskOf(clean);
const t8 = leg('T8', 'the real at-risk set is non-empty and does NOT contain 9', () => ({
  ok: atRisk.length >= 1 && !atRisk.includes(9),
  note: `at-risk (1 affirming row, no non-subject source) = ${atRisk.length} member(s): `
    + `[${atRisk.slice(0, 20)}${atRisk.length > 20 ? ', …' : ''}] · 9∈at-risk=${atRisk.includes(9)} `
    + `(9 has ${affirming9.length} affirming rows)`,
}));
pred('P8', 'the rounds one denial could remove are a different set than {9}', t8.ok, t8.note);

const t9 = leg('T9', 'strict S6 protects at least one at-risk member', () => {
  if (dNow === null) return { refused: true, why: 'the S6 population refused' };
  const mail = new Set(dNow.mail);
  const covered = atRisk.filter((n) => mail.has(n));
  return {
    ok: covered.length >= 1,
    note: `|S6strict ∩ at-risk| = ${covered.length} of ${atRisk.length}: `
      + `[${covered.slice(0, 20)}${covered.length > 20 ? ', …' : ''}]`,
  };
});
pred('P9', 'the durability case is non-vacuous — S6 covers ≥1 at-risk member',
  t9.refused ? 'refused' : t9.ok, t9.note);

// ---------------------------------------------------------------------------------------------
// P10 — order safety and behaviour preservation
// ---------------------------------------------------------------------------------------------

const t10 = leg('T10', 'S6 is inserted last and reclassifies ONLY docs/mail/ paths', () => {
  const tree = base.git(REPO, ['ls-tree', '-r', '--name-only', NOW_REV]);
  if (tree === null || dNow === null) return { refused: true, why: 'tree read refused' };
  const moved = [];
  for (const p of tree.split('\n').filter(Boolean)) {
    const a = base.classifyPath(p), b = strict.classifyPath(p);
    if (a.source !== b.source || a.round !== b.round) moved.push([p, a.source, b.source]);
  }
  const offMail = moved.filter(([p]) => !p.startsWith('docs/mail/'));
  const fromNonNull = moved.filter(([, a]) => a !== null);
  return {
    ok: moved.length > 0 && offMail.length === 0 && fromNonNull.length === 0 && dNow.gained.length === 0 && dNow.lost.length === 0,
    note: `${moved.length} path(s) reclassified · outside docs/mail/=${offMail.length} · `
      + `from a non-null source=${fromNonNull.length} [${fromNonNull.slice(0, 3).map(([p]) => p)}] · member set unchanged=${dNow.gained.length === 0 && dNow.lost.length === 0}`,
  };
});
pred('P10', 'behaviour-preserving at the current rev, and nothing else reclassifies',
  t10.refused ? 'refused' : t10.ok, t10.note);

// ---------------------------------------------------------------------------------------------
// T11 — the CURE's own contract. Refuses on a pre-cure drive rather than inferring anything.
// ---------------------------------------------------------------------------------------------

const live = await import(join(REPO, MODPATH));
leg('T11', 'the LIVE module exports a rev-taking floor reader that reproduces this arm\'s own reading', () => {
  if (typeof live.unattestedRoundsAt !== 'function') {
    return { refused: true, why: 'live module exports no unattestedRoundsAt — pre-cure drive' };
  }
  const a = live.unattestedRoundsAt(REPO, floor.rev);
  const b = live.unattestedRoundsAt(REPO, NOW_REV);
  if (a === null || b === null) return { refused: true, why: 'the live reader refused' };
  const okPin = fPin && String(a.outside) === String(fPin.outside) && a.paths === fPin.paths;
  const okNow = fNow && String(b.outside) === String(fNow.outside) && b.paths === fNow.paths;
  return {
    ok: Boolean(okPin && okNow && live.selfTest() === true),
    note: `live@${floor.rev} paths=${a.paths} outside=[${a.outside}] (arm: ${fPin && fPin.paths}/[${fPin && fPin.outside}]) · `
      + `live@${NOW_REV} paths=${b.paths} outside=[${b.outside}] (arm: ${fNow && fNow.paths}/[${fNow && fNow.outside}]) · `
      + `agree pin=${okPin} now=${okNow} · live selfTest=${live.selfTest()}`,
  };
});

leg('T12', 'the LIVE module claims the same S6 set as this arm\'s derived copy, or declares S6 absent', () => {
  const liveMail = new Set();
  const tree = base.git(REPO, ['ls-tree', '-r', '--name-only', NOW_REV]);
  if (tree === null) return { refused: true, why: 'tree read refused' };
  for (const p of tree.split('\n').filter(Boolean)) {
    const c = live.classifyPath(p);
    if (c.source === 'S6') liveMail.add(c.round);
  }
  if (liveMail.size === 0) return { refused: true, why: 'live classifyPath claims no S6 path — S6 not taken (or not taken as S6)' };
  const mine = new Set(dNow ? dNow.mail : []);
  const only = setDiff(liveMail, mine), missing = setDiff(mine, liveMail);
  return { ok: only.length === 0 && missing.length === 0, note: `live S6 rounds=${liveMail.size} · live-only=[${only}] arm-only=[${missing}]` };
});

// ---------------------------------------------------------------------------------------------
// T13 / T14 — ADDITIVE, added after drive2 recorded T11 RED. T11 is NOT re-keyed: re-keying a leg
// after its drive re-scores a graded run. These legs grade the CORRECTED contract instead — the pin
// is a reading of (tree rev, classifier), and the difference is attributable, not just present.
// ---------------------------------------------------------------------------------------------

leg('T13', 'the pin names the classifier it was taken under, and that rev predates S6', () => {
  const pin = live.SOURCE_RECALL_FLOOR[`at${live.SOURCE_RECALL_FLOOR.rev}`];
  if (!pin || typeof pin.classifierRev !== 'string') {
    return { ok: false, note: `pinned reading carries no classifierRev: ${JSON.stringify(pin)}` };
  }
  // The named classifier rev must actually BE pre-S6 — asserted against git, not trusted.
  const srcThere = git(['show', `${pin.classifierRev}:${MODPATH}`]);
  const hasS6 = /source: 'S6'/.test(srcThere);
  const liveHasS6 = /source: 'S6'/.test(git(['show', `HEAD:${MODPATH}`]));
  return {
    ok: !hasS6 && liveHasS6 && pin.invisiblePaths === (fPin && fPin.paths) && String(pin.unattestedRounds) === String(fPin && fPin.outside),
    note: `classifierRev=${pin.classifierRev} declares S6=${hasS6} (want false) · HEAD declares S6=${liveHasS6} · `
      + `pin ${pin.invisiblePaths}/[${pin.unattestedRounds}] vs the arm's five-source read ${fPin && fPin.paths}/[${fPin && fPin.outside}]`,
  };
});

leg('T14', 'the live reader\'s disagreement with the pin is EXACTLY the mail paths S6 now claims', () => {
  if (typeof live.unattestedRoundsAt !== 'function') return { refused: true, why: 'no live reader' };
  const a = live.unattestedRoundsAt(REPO, floor.rev);
  if (a === null || fPin === null) return { refused: true, why: 'a read refused' };
  // How many paths at the pinned rev does S6 claim, and were previously claimed by nothing?
  const tree = base.git(REPO, ['ls-tree', '-r', '--name-only', floor.rev]);
  if (tree === null) return { refused: true, why: 'tree read refused at the pinned rev' };
  const newlyClaimed = tree.split('\n').filter((p) =>
    /round\d+/i.test(p) && base.classifyPath(p).source === null && live.classifyPath(p).source === 'S6');
  const gap = fPin.paths - a.paths;
  // `floor` is the PRE-cure constant (flat shape, from BASE_REV); the witness is read off it, and
  // the live constant's nested shape is read off `live`. Mixing the two shapes would throw here.
  const witnessClaimed = live.classifyPath(floor.witness).source;
  return {
    ok: gap === newlyClaimed.length && gap > 0 && a.outside.length === 0 && witnessClaimed === 'S6',
    note: `five-source=${fPin.paths} six-source=${a.paths} · gap=${gap} · S6 newly claims ${newlyClaimed.length} `
      + `previously-invisible path(s) at ${floor.rev} · live outside=[${a.outside}] · the witness is now claimed by ${witnessClaimed}`,
  };
});

// ---------------------------------------------------------------------------------------------
// Declared, UNGRADED diagnostic: the same two quantities at a live HEAD.
// ---------------------------------------------------------------------------------------------
const headRev = git(['rev-parse', '--short', 'HEAD']).trim();
const fHead = unattestedAt(base, 'HEAD');
console.log('');
console.log(`DIAG (ungraded, live) HEAD=${headRev} · unattested@HEAD paths=${fHead ? fHead.paths : 'REFUSED'} `
  + `outside=[${fHead ? fHead.outside : 'REFUSED'}] · graded figures above are at ${NOW_REV}`);

// ---------------------------------------------------------------------------------------------

const red = legs.filter((l) => !l.refused && !l.ok).map((l) => l.id);
const refused = legs.filter((l) => l.refused).map((l) => l.id);
const refuted = preds.filter((p) => p.held === false).map((p) => p.id);
console.log('');
console.log(`VERDICT/${red.length ? 1 : 0} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=[${red}] refused=[${refused}] preds-refuted=[${refuted}]`);
process.exit(red.length ? 1 : 0);
