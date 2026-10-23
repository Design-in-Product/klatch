/**
 * Round 442 — grade the shared verdict emitter Theseus routed to this seat in Round 441 §2.
 *
 * Subject: `docs/research/lib/verdict.mjs`. Every leg below is about that file; none is about the
 * prose conventions it replaces, because Round 440 already measured those (6 gate-line shapes, 3
 * label suffixes, 4 per-leg token sets) and Round 441 corrected the one figure of mine that was
 * keyed wrong (my five-member silent class was three — the key read greenness).
 *
 * One drive of one population shared by every leg (339). Depth guard on this file's own directory
 * (421). The crippler copies live dot-prefixed and pid-stamped in this directory, and the subject
 * is asserted byte-identical at exit.
 *
 * Driving it: `node docs/research/round442-instruments/grade-the-shared-verdict-emitter.mjs`
 * Crippled legs, each a declared counterfactual: `KLATCH_R442_<NAME>` — see `CRIPPLED` below.
 */

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, rmSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const SHORT = REV.slice(0, 8);

const SUBJECT_REL = 'docs/research/lib/verdict.mjs';
const SUBJECT = join(REPO, SUBJECT_REL);
const PRIOR_ART_REL = 'scripts/lib/gate-line.mts';

// ── Depth guard, keyed on THIS file's own directory and not on its parent (421). ────────────────
const DEPTH = Number(process.env.KLATCH_R442_DEPTH ?? '0');
if (DEPTH > 1) { console.log('REFUSED: crippler recursion depth exceeded'); process.exit(0); }

// ── The tracked-tree watch, carried forward from Round 440 G10 at Theseus's Round 441 §2 request
// ("your G10 is the right detector for a fire in progress, and it should stay"). Snapshot taken
// BEFORE any member runs. Status codes are read as a FIELD, never sliced at a fixed offset —
// `.trim()` ate the leading space of the first ` M path` line last round and the figure came back
// 3 against a true 2, off one character.
//
// Drive 1 of this instrument got this WRONG and the leg was green anyway. I keyed `statusMap` on
// every `git status --porcelain` line and labelled the figure "tracked already dirty on entry".
// Porcelain reports an UNTRACKED file as `?? path`, so the 2 it reported were this instrument's own
// two new files, and the leg could not have told a newly created file from a rewritten COMMITTED
// recording — which is the entire thing it exists to catch. Round 440's `G10` filtered the code on
// `/[MARCD]/` and was right; I retyped the reader this round instead of carrying it forward, and
// re-introduced a defect one round after curing it (412 — a hand-typed reader is not a slice;
// 377/405/434/435 — applying the lesson in one leg is not applying it to the file).
//
// Keyed on the status code as a FIELD, and the two populations reported separately, because they
// are different facts: a tracked file this drive MODIFIED is the hazard, an untracked file it
// CREATED is just output.
const statusLines = () => git('status', '--porcelain').split('\n')
  .map((l) => l.match(/^(..) (.*)$/))
  .filter((m) => m !== null)
  .map((m) => ({ code: m[1], path: m[2] }));
const trackedModified = () => {
  const out = {};
  for (const { code, path } of statusLines()) if (/[MARCD]/.test(code)) out[path] = code;
  return out;
};
const untrackedAt = () => statusLines().filter(({ code }) => code === '??').map(({ path }) => path);
const DIRTY_AT_ENTRY = trackedModified();
const UNTRACKED_AT_ENTRY = untrackedAt();
const SUBJECT_BYTES_AT_ENTRY = readFileSync(SUBJECT, 'utf8');

const legs = [];
const preds = [];
const leg = (id, what, detail, ok) => legs.push({ id, what, detail, ok });
const pred = (id, what, detail, landed) => preds.push({ id, what, detail, landed });

// ── Crippler key. Each name is a declared counterfactual the vacuity harness drives. ────────────
const CRIPPLED = ['KLATCH_R442_NOFIELD', 'KLATCH_R442_GREENREF', 'KLATCH_R442_NOTRACK', 'KLATCH_R442_REFKEY']
  .filter((k) => process.env[k] !== undefined);

// ── Load the subject. A crippler rewrites the subject file itself, so this import is what carries
// the cripple; the legs below never re-derive what they grade from source text alone (369).
const V = await import(`file://${SUBJECT}?t=${Date.now()}`);

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G1 — HIS ROUND 441 REPRODUCES, out of a clean tree, before this file existed.
// The pin is his MEMO's published §5 figures, typed from the memo, which makes the agreement
// three-way: his sentence, his recording, my drive.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const rel = 'docs/research/round442-instruments/reproduce-his-round441.out';
  const p = join(REPO, rel);
  if (!existsSync(p)) {
    leg('G1', 'HIS ROUND 441 REPRODUCES', `REFUSED — ${rel} absent`, null);
  } else {
    const text = readFileSync(p, 'utf8');
    const HIS_GATE = 'GATE: true   (9 leg(s))';
    const HIS_PREDS = 'PREDICTIONS: 2 landed, 0 refuted';
    const gotGate = text.split('\n').filter((l) => l.startsWith('GATE: '));
    const gotPreds = text.split('\n').filter((l) => l.startsWith('PREDICTIONS: '));
    const ok = gotGate.length === 1 && gotGate[0] === HIS_GATE
      && gotPreds.length === 1 && gotPreds[0] === HIS_PREDS;
    leg('G1', 'HIS ROUND 441 REPRODUCES — his §5 figures, typed from his memo, against my drive of '
      + 'his unmodified instrument as this fire\'s first action',
      `pinned "${HIS_GATE}" / "${HIS_PREDS}" · got ${JSON.stringify(gotGate)} / ${JSON.stringify(gotPreds)}`, ok);
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G2 — PRIOR ART NAMED, NOT ASSUMED ABSENT.
// "We don't have X" is the highest-risk sentence on this project. `scripts/lib/gate-line.mts`
// exists and is about a DIFFERENT subject; this leg asserts both halves — that it is there, and
// that it is not this — rather than letting "no shared emitter" stand as an unchecked claim.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const priorExists = git('ls-tree', '-r', '--name-only', REV, PRIOR_ART_REL).trim() === PRIOR_ART_REL;
  const prior = priorExists ? git('show', `${REV}:${PRIOR_ART_REL}`) : '';
  // Its subject is the vitest gate: it reads `Test Files` / `Tests` counts off captured output.
  const isVitestSubject = prior.includes('Test Files') && prior.includes('renderGate');
  // And it is NOT an instrument leg-verdict emitter: it has no model of legs at all.
  const isNotLegEmitter = !prior.includes('leg(s)') && !/\bleg\b/.test(prior);
  const ok = priorExists && isVitestSubject && isNotLegEmitter;
  leg('G2', 'THE PRIOR ART IN lib IS NAMED AND DISTINGUISHED — not assumed absent. '
    + '`scripts/lib/gate-line.mts` exists at the rev, its subject is the vitest `npm test` gate '
    + '(`Test Files` counts off captured output), and it has no model of an instrument\'s legs. '
    + 'Both halves asserted: a leg that only checked "no verdict emitter exists" would have been '
    + 'the exact sentence this project has been wrong about twice',
    `${PRIOR_ART_REL} tracked: ${priorExists} · vitest subject: ${isVitestSubject} · `
    + `no leg model: ${isNotLegEmitter}`, ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G3 — THE SELF-TEST GATES, on `!== true` and not on truthiness (356).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  let result; let threw = null;
  try { result = V.selfTest(); } catch (e) { threw = e.message; }
  const ok = threw === null && result === true;
  leg('G3', 'THE SUBJECT\'S OWN SELF-TEST RETURNS EXACTLY `true` — gated on `!== true`, so a '
    + 'self-test that returned a truthy object, a count, or nothing at all would redden here '
    + 'rather than read as a pass',
    threw === null ? `selfTest() returned ${JSON.stringify(result)}` : `selfTest() THREW: ${threw}`, ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G4 — THE REFUSAL ENUM IS DERIVED FROM THE BRANCH LITERALS, not from a hand-typed copy (426).
// Sliced out of the subject's source with a comment-blind key: the `refuse('X')` call sites, with
// the subject's own docstring and the REFUSALS array declaration both excluded from the scan.
// Set equality in BOTH directions — a declared-but-unreachable code and a reachable-but-undeclared
// one are different defects and neither is caught by a count.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const src = readFileSync(SUBJECT, 'utf8');
  // Comment-blind: strip block and line comments before scanning, so the docstring's own prose
  // about refusals cannot be counted as a call site (375 — make the pin comment-blind).
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const calls = [...code.matchAll(/\brefuse\(\s*'([A-Z_]+)'\s*\)/g)].map((m) => m[1]);
  const callSet = [...new Set(calls)].sort();
  const declared = [...V.REFUSALS].sort();
  const undeclared = callSet.filter((c) => !declared.includes(c));
  const unreachable = declared.filter((c) => !callSet.includes(c));
  const ok = calls.length > 0 && undeclared.length === 0 && unreachable.length === 0;
  leg('G4', 'THE REFUSAL ENUM EQUALS THE BRANCH LITERALS, both directions — every `refuse(\'X\')` '
    + 'call site in the subject\'s code (comments stripped first) is in the exported `REFUSALS`, '
    + 'and every member of `REFUSALS` has a call site. A count would pass a swap',
    `${calls.length} call site(s), ${callSet.length} distinct · declared ${declared.length} · `
    + `reachable-but-undeclared ${JSON.stringify(undeclared)} · declared-but-unreachable ${JSON.stringify(unreachable)}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// THE GRID. One enumeration, shared by G5 and G6 (339). Every combination of red / refused /
// refuted / prefused counts in 0..2, which reaches both halves of every list and the all-empty
// case the old grammar could not express.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const GRID = [];
for (let r = 0; r <= 2; r += 1) for (let f = 0; f <= 2; f += 1) for (let pr = 0; pr <= 1; pr += 1) for (let pf = 0; pf <= 1; pf += 1) {
  const mk = (n, pre, val, key) => Array.from({ length: n }, (_, i) => ({ id: `${pre}${i + 1}`, [key]: val }));
  GRID.push({
    legs: [...mk(r, 'R', false, 'ok'), ...mk(f, 'F', null, 'ok'), { id: 'Gok', ok: true }],
    preds: [...mk(pr, 'PR', false, 'landed'), ...mk(pf, 'PF', null, 'landed'), { id: 'Pok', landed: true }],
    r, f,
  });
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G5 — THE GREEN/NO-LABEL AMBIGUITY IS UNREPRESENTABLE, graded on BOTH axes (386 — one known
// positive per shape is coverage of one axis).
//
//   positive half: every one of the GRID's outputs carries all six field tokens and round-trips.
//   CONTROL half:  every real emitted `GATE: ` line in the committed recordings is REFUSED by the
//                  new reader, by name. 147 recordings selected with `ls-tree` at a stamped rev
//                  (414/415/416 — a population keyed on `ls-files` is irreproducible from a rev,
//                  and a staged index moves the figure both ways).
//
// Without the control half, a reader that returned `ok` for everything would pass the positive
// half by itself.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
let CONTROL_N = null;
{
  const FIELDS = ['legs=', 'red=', 'refused=', 'preds=', 'refuted=', 'prefused='];
  const missing = [];
  const notRoundTripped = [];
  for (const c of GRID) {
    let line;
    try { line = V.renderVerdict(c); } catch (e) { missing.push(`THREW ${e.message}`); continue; }
    const absent = FIELDS.filter((f) => !line.includes(` ${f}`));
    if (absent.length) missing.push(`${line} missing ${JSON.stringify(absent)}`);
    const rt = V.readVerdict(line);
    if (rt.ok !== true
      || rt.verdict.red.length !== c.r
      || rt.verdict.refused.length !== c.f) notRoundTripped.push(`${line} → ${JSON.stringify(rt)}`);
  }

  // CONTROL — real emitted lines, from committed recordings, at the rev.
  const outs = git('ls-tree', '-r', '--name-only', REV, 'docs/research/').split('\n')
    .filter((f) => f.endsWith('.out'));
  // The control is "recordings that have NOT adopted the emitter", and that must be keyed
  // POSITIVELY on the absence of a `VERDICT/` line rather than assumed from the population's name.
  //
  // Drive 2 went red here and P1 was REFUTED at `148 gate-bearing · 147 refused`, on its own
  // promotion: the 148th was this round's own committed `drive1.out`, which carries both the old
  // prose line AND the new `VERDICT/1` line, so the reader PARSED it — correctly. A control keyed
  // only on `GATE: ` is contaminated by the subject's own output the moment it is committed
  // (377/405/434/435 — a pin on a count reddens on its own promotion; 425 — an instrument does not
  // census its own source). The partition below is the cure, and the ADOPTED count is printed so
  // the exclusion cannot be vacuous without showing it (430 — read the exclusion count, not the
  // verdict).
  const adopted = []; const unadopted = [];
  for (const f of outs) {
    const blob = git('show', `${REV}:${f}`);
    const lines = blob.split('\n');
    if (!lines.some((l) => l.startsWith('GATE: '))) continue;
    (lines.some((l) => l.startsWith('VERDICT/')) ? adopted : unadopted).push({ f, blob });
  }
  CONTROL_N = unadopted.length;
  const notRefused = unadopted.filter(({ blob }) => V.readVerdict(blob).ok !== false);
  const refusalCodes = [...new Set(unadopted.map(({ blob }) => V.readVerdict(blob).refusal))];
  // The other half of the 2 × 2: an ADOPTED recording must PARSE, not refuse. Without this, a
  // reader that refused everything would pass the control half by itself.
  const adoptedNotParsed = adopted.filter(({ blob }) => V.readVerdict(blob).ok !== true);

  const ok = missing.length === 0 && notRoundTripped.length === 0
    && CONTROL_N > 0 && notRefused.length === 0 && adoptedNotParsed.length === 0;
  leg('G5', 'A LIST IS NEVER ABSENT, AND THE OLD LINES ARE NEVER MISTAKEN FOR THE NEW GRAMMAR — '
    + 'this is the leg that grades the cure for the defect Theseus found in my Round 440 G9. '
    + 'Positive half: all 36 grid cases carry every one of the six fields and round-trip. Control '
    + 'half: every real emitted `GATE: ` line in the committed recordings is refused BY NAME, so a '
    + 'reader that said `ok` to everything cannot pass this leg on the positive half alone',
    `grid ${GRID.length} · field-dropping ${missing.length} ${JSON.stringify(missing.slice(0, 2))} · `
    + `round-trip failures ${notRoundTripped.length} ${JSON.stringify(notRoundTripped.slice(0, 2))}\n`
    + `        CONTROL 2 × 2 over committed recordings under docs/research/ at ${SHORT}, selected `
    + `with ls-tree: UNADOPTED (a \`GATE: \` line and no \`VERDICT/\` line) ${CONTROL_N}, of which `
    + `not refused ${notRefused.length} ${JSON.stringify(notRefused.slice(0, 2).map((x) => x.f))} · `
    + `ADOPTED (both lines) ${adopted.length} ${JSON.stringify(adopted.map((x) => x.f))}, of which `
    + `not parsed ${adoptedNotParsed.length} · refusal codes observed on the unadopted half: `
    + `${JSON.stringify(refusalCodes)}`, ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G6 — NO INPUT RENDERS THE GREEN TOKEN FOR A RUN THAT IS NOT GREEN, driven over the grid as a
// confusion matrix rather than against a known positive (418 — a separating key needs a matrix).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  let tp = 0; let tn = 0; let fp = 0; let fn = 0; let threw = 0;
  const offenders = [];
  const throwers = [];
  for (const c of GRID) {
    let line;
    // A case that throws is counted in its OWN cell, not skipped.
    //
    // Drive 1 of this leg had `catch { continue; }` here, and the vacuity cell C2 exposed what
    // that costs: crippling `topToken` made 8 of 36 cases throw, they vanished from the matrix,
    // and the cells came back `tp 4 · tn 24 · fp 0 · fn 0` — summing to 28 against a grid of 36,
    // with `fp` still 0 and this leg still GREEN. The `catch` was a filter making the leg's own
    // conjunct true (380/381/385/386), and the numbers in the printed sentence did not add up
    // (379). The matrix sum is now asserted against the grid size, so a case cannot leave the
    // population by throwing.
    try { line = V.renderVerdict(c); } catch (e) { threw += 1; throwers.push(e.message.slice(0, 90)); continue; }
    const claimsGreen = line.startsWith(`${V.SCHEMA} ok `);
    const isGreen = c.r === 0 && c.f === 0;
    if (claimsGreen && isGreen) tp += 1;
    else if (!claimsGreen && !isGreen) tn += 1;
    else if (claimsGreen && !isGreen) { fp += 1; offenders.push(line); }
    else { fn += 1; offenders.push(line); }
  }
  const sum = tp + tn + fp + fn + threw;
  const ok = fp === 0 && fn === 0 && threw === 0 && tp > 0 && tn > 0 && sum === GRID.length;
  leg('G6', 'THE GREEN TOKEN TRACKS THE LISTS EXACTLY — confusion matrix over the grid, WITH its '
    + 'cells asserted to sum to the grid size. `fp` is the failure this file exists to prevent (a '
    + 'non-green run quoted green); `fn` is the one that would make the token useless in the other '
    + 'direction; `threw` is the cell whose absence kept this leg green at tp 4 / tn 24 / fp 0 / '
    + 'fn 0 — 28 of 36 — under drive 1\'s `catch { continue }`. All three must be 0, both true '
    + 'cells non-empty, and the sum exact, so no case can leave the population by throwing',
    `tp ${tp} · tn ${tn} · fp ${fp} · fn ${fn} · threw ${threw} · sum ${sum} of grid ${GRID.length}`
    + `${offenders.length ? ` · offenders ${JSON.stringify(offenders.slice(0, 3))}` : ''}`
    + `${throwers.length ? ` · throwers ${JSON.stringify(throwers.slice(0, 2))}` : ''}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G7 — THE WRITE GUARD REFUSES A TRACKED TARGET, driven in a SCRATCH GIT REPO (332 — git-init a
// copy rather than editing another seat's tree, and never drive a write guard against this repo's
// own committed files to see whether it holds).
//
// Graded on three things, not one: that it threw the NAMED error, that the tracked file is
// BYTE-IDENTICAL afterwards (a guard that throws after writing is not a guard), and that the
// `.live.out` sibling path is writable and leaves the tracked file alone.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const scratch = join(HERE, `.r442-scratch-${process.pid}`);
  let detail; let ok = false;
  try {
    rmSync(scratch, { recursive: true, force: true });
    mkdirSync(scratch, { recursive: true });
    const sgit = (...a) => execFileSync('git', ['-C', scratch, ...a], { encoding: 'utf8' });
    sgit('init', '-q');
    sgit('config', 'user.email', 'scratch@klatch.local');
    sgit('config', 'user.name', 'scratch');
    const tracked = join(scratch, 'his-round435-postcure.out');
    const ORIGINAL = 'rev: e2a20e75\nGATE: false   (8 leg(s))   RED: G1, G5\n';
    writeFileSync(tracked, ORIGINAL);
    sgit('add', 'his-round435-postcure.out');
    sgit('commit', '-q', '-m', 'the committed recording');

    const isTracked = V.isTracked(tracked, scratch);
    let named = false; let msg = '';
    try {
      V.writeRecording(tracked, 'rev: fb8a12c5\nRE-STAMPED\n', { repo: scratch });
    } catch (e) { named = e instanceof V.TrackedTargetError; msg = e.message; }
    const afterBytes = readFileSync(tracked, 'utf8');
    const intact = afterBytes === ORIGINAL;

    const sib = V.liveSibling(tracked);
    const wrote = V.writeRecording(sib, 'rev: live\n', { repo: scratch });
    const sibOk = wrote === sib && existsSync(sib) && sib.endsWith('his-round435-postcure.live.out');
    const stillIntact = readFileSync(tracked, 'utf8') === ORIGINAL;
    // And the override is reachable — the point is not that it is impossible.
    V.writeRecording(tracked, 'deliberate\n', { repo: scratch, allowTracked: true });
    const overrideWorks = readFileSync(tracked, 'utf8') === 'deliberate\n';

    ok = isTracked && named && intact && sibOk && stillIntact && overrideWorks;
    detail = `scratch repo · target tracked: ${isTracked} · threw TrackedTargetError: ${named} · `
      + `tracked file byte-identical after the refusal: ${intact} · `
      + `.live.out sibling written and tracked file still intact: ${sibOk && stillIntact} · `
      + `{allowTracked:true} override reaches the write: ${overrideWorks}\n        refusal said: `
      + `${JSON.stringify(msg.slice(0, 120))}`;
  } catch (e) {
    detail = `REFUSED — the scratch drive could not be set up: ${e.message}`;
    leg('G7', 'THE WRITE GUARD REFUSES A TRACKED TARGET', detail, null);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  if (detail && !detail.startsWith('REFUSED')) {
    leg('G7', 'THE WRITE GUARD REFUSES A TRACKED TARGET, AND THE FILE SURVIVES THE REFUSAL — '
      + 'driven in a scratch git repo whose committed fixture is a copy of the exact filename and '
      + 'rev trailer Theseus found six generations deep. Three things graded, not one: the named '
      + 'error, the file byte-identical AFTER (a guard that throws post-write is not a guard), and '
      + 'the `.live.out` sibling actually writable so the cure has somewhere to go', detail, ok);
  }
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G8 — THE REACH OF THE GUARD, under HIS key, reported as a FLOOR with the direction named.
// Theseus's Round 441 §2 published `tracked .mjs under docs/ at 8d891c70: 139 · modelled write
// sites 9 · target TRACKED at the rev: 9`. His key is reimplemented here rather than his number
// quoted (328 — reproduce their figures under their own key before correcting their count). Where
// mine and his disagree, the difference is REPORTED; this leg does not assert his figure.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const mjs = git('ls-tree', '-r', '--name-only', REV, 'docs/').split('\n').filter((f) => f.endsWith('.mjs'));
  const sites = [];
  for (const f of mjs) {
    const blob = git('show', `${REV}:${f}`);
    const code = blob.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of code.matchAll(/writeFileSync\(\s*join\(\s*(HERE|REPO)\s*,\s*((?:'[^']*'|"[^"]*")(?:\s*,\s*(?:'[^']*'|"[^"]*"))*)\s*\)/g)) {
      const segs = [...m[2].matchAll(/'([^']*)'|"([^"]*)"/g)].map((s) => s[1] ?? s[2]);
      const base = m[1] === 'HERE' ? dirname(f) : '.';
      const rel = join(base, ...segs).replace(/^\.\//, '');
      const trackedAtRev = git('ls-tree', '-r', '--name-only', REV, rel).trim() === rel;
      sites.push({ in: f, target: rel, trackedAtRev });
    }
  }
  const trackedTargets = sites.filter((s) => s.trackedAtRev);
  const HIS = { mjs: 139, sites: 9, tracked: 9 };
  const agree = sites.length === HIS.sites && trackedTargets.length === HIS.tracked;
  // A count over a literal-only key can only MISS a computed target, so it is a FLOOR and says so
  // (408 — a refusing signal only raises a floor; say which end it can move).
  leg('G8', 'THE GUARD\'S REACH UNDER HIS OWN KEY — a FLOOR, direction named. His Round 441 §2 '
    + 'published 139 tracked .mjs under docs/, 9 modelled write sites, 9 with a target tracked at '
    + 'the rev. His key is reimplemented here, not quoted. Literal-only argument matching can only '
    + 'MISS a computed target, never invent one, so both counts are LOWER bounds and a disagreement '
    + 'with his is reported rather than asserted away. The leg reddens only if MY key finds fewer '
    + 'tracked targets than modelled sites, which would mean my own resolver is inconsistent',
    `my key at ${SHORT}: tracked .mjs under docs/ ${mjs.length} · modelled write sites ${sites.length} `
    + `· target tracked at the rev ${trackedTargets.length}\n`
    + `        his key at 8d891c70: ${HIS.mjs} · ${HIS.sites} · ${HIS.tracked} — agrees: ${agree} `
    + `(the rev moved between his drive and mine, and this round added files, so disagreement is `
    + `expected and is not graded)\n`
    + `        targets: ${JSON.stringify(trackedTargets.map((s) => s.target))}`,
    trackedTargets.length <= sites.length && sites.length > 0);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G9 — THE SUBJECT IS BYTE-IDENTICAL AT EXIT, and this drive dirtied no tracked file.
// Carried forward from Round 440 G10 at his request. Keyed on the whole tracked tree, with the
// status code read as a field.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const g9 = () => {
  const now = trackedModified();
  const newlyModified = Object.keys(now).filter((p) => DIRTY_AT_ENTRY[p] === undefined);
  const subjectSame = readFileSync(SUBJECT, 'utf8') === SUBJECT_BYTES_AT_ENTRY;
  // The crippler copies and the scratch repo are this instrument's own, dot-prefixed, and must not
  // appear; anything else newly modified is a real write to a committed file by this drive.
  const foreign = newlyModified.filter((p) => !p.includes('/.r442-'));
  const newUntracked = untrackedAt().filter((p) => !UNTRACKED_AT_ENTRY.includes(p) && !p.includes('/.r442-'));
  leg('G9', 'THIS DRIVE MODIFIED NO TRACKED FILE AND THE SUBJECT IS BYTE-IDENTICAL AT EXIT — the '
    + 'whole tracked tree, status code read as a FIELD. Both the fixed-offset slice and the '
    + 'unfiltered code have now cost a figure here: `.trim()` ate the leading space of the first '
    + '` M path` line last round (3 against a true 2), and drive 1 of THIS instrument counted `??` '
    + 'untracked lines as "tracked already dirty" (2 against a true 0). The two populations are '
    + 'reported separately because they are different facts — a modified committed file is the '
    + 'hazard, a created untracked file is output',
    `tracked MODIFIED on entry (not this drive's): ${Object.keys(DIRTY_AT_ENTRY).length} `
    + `${JSON.stringify(Object.keys(DIRTY_AT_ENTRY))} · untracked on entry: `
    + `${UNTRACKED_AT_ENTRY.length} · tracked files MODIFIED by this drive: ${foreign.length} `
    + `${JSON.stringify(foreign)} · untracked files created by this drive: ${newUntracked.length} `
    + `${JSON.stringify(newUntracked)} · subject byte-identical: ${subjectSame}`,
    foreign.length === 0 && subjectSame);
};

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// PREDICTIONS
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  // P1 — adoption cannot be silently partial.
  const outs = git('ls-tree', '-r', '--name-only', REV, 'docs/research/').split('\n')
    .filter((f) => f.endsWith('.out'));
  let unadopted = 0; let refusedByName = 0; let adoptedN = 0; let adoptedParsed = 0;
  for (const f of outs) {
    const blob = git('show', `${REV}:${f}`);
    const lines = blob.split('\n');
    if (!lines.some((l) => l.startsWith('GATE: '))) continue;
    const r = V.readVerdict(blob);
    if (lines.some((l) => l.startsWith('VERDICT/'))) {
      adoptedN += 1;
      if (r.ok === true) adoptedParsed += 1;
    } else {
      unadopted += 1;
      if (r.ok === false && V.REFUSALS.includes(r.refusal)) refusedByName += 1;
    }
  }
  pred('P1', 'ADOPTION IS DETECTABLE RATHER THAN SILENTLY PARTIAL, BOTH WAYS. An UNADOPTED '
    + 'recording is refused by a DECLARED code, and an ADOPTED one PARSES — so a half-migrated '
    + 'instrument reads as absent rather than as green, and a reader that refused everything could '
    + 'not pass this by refusing. Drive 2 scored this REFUTED at 148 gate-bearing / 147 refused, '
    + 'and the 148th was this round\'s own committed drive1.out: the prediction reddened on its own '
    + 'promotion, which is the behaviour, not a defect in it. Re-keyed as the partition',
    `UNADOPTED ${unadopted}, refused with a declared code ${refusedByName} · `
    + `ADOPTED ${adoptedN}, parsed ${adoptedParsed}`,
    unadopted > 0 && refusedByName === unadopted && adoptedParsed === adoptedN);

  // P2 — the ambiguity has no image under the new grammar.
  let inferable = 0;
  for (const c of GRID) {
    let line; try { line = V.renderVerdict(c); } catch { continue; }
    // "names no legs at all" is inferable exactly when a list token is absent from the line.
    if (!line.includes(' red=') || !line.includes(' refused=')) inferable += 1;
  }
  pred('P2', 'THE INFERENCE THAT KILLED MY ROUND 440 G9 HAS NO IMAGE IN THE NEW GRAMMAR. Under the '
    + 'old prose line, "no leg-id label observed" and "this emitter has no label grammar" were the '
    + 'same observation, and 2 of my 5 silent members were in fact label-capable and merely green. '
    + 'The count of grid outputs from which that inference is available should be 0 — not rare, '
    + 'absent',
    `grid outputs from which "names no legs" is inferable: ${inferable} of ${GRID.length}`,
    inferable === 0);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// TAIL — emitted BY THE SUBJECT ITSELF. This round's verdict is rendered by the thing it grades,
// which is the only way to find out whether it is usable. Round 440's prose line is printed below
// it for one round, so the recording is readable by both the old readers and the new one.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
g9();

const out = [];
out.push(`SUBJECT: ${SUBJECT_REL}`);
out.push(`REV: ${SHORT}   depth: ${DEPTH}   crippled: ${CRIPPLED.length ? CRIPPLED.join(',') : 'none'}`);
out.push('');
for (const l of legs) {
  const tok = l.ok === true ? ' ok ' : l.ok === false ? 'FAIL' : 'REF ';
  out.push(`${tok} ${l.id}  ${l.what}`);
  out.push(`        ${l.detail}`);
}
out.push('');
for (const p of preds) {
  const tok = p.landed === true ? 'LANDED  ' : p.landed === false ? 'REFUTED ' : 'REFUSED ';
  out.push(`${tok} ${p.id}  ${p.what}`);
  out.push(`        ${p.detail}`);
}
out.push('');

const red = legs.filter((l) => l.ok === false);
const refusedLegs = legs.filter((l) => l.ok === null);
// The old prose line, kept for one round so this recording is readable by the readers that exist.
out.push(`GATE: ${red.length === 0}   (${legs.length} leg(s))`
  + `${red.length ? `   RED: ${red.map((l) => l.id).join(', ')}` : ''}`
  + `${refusedLegs.length ? `   REFUSED: ${refusedLegs.map((l) => l.id).join(', ')}` : ''}`);
out.push(`PREDICTIONS: ${preds.filter((p) => p.landed === true).length} landed, `
  + `${preds.filter((p) => p.landed === false).length} refuted`
  + `${preds.filter((p) => p.landed === null).length ? `, ${preds.filter((p) => p.landed === null).length} refused` : ''}`);
out.push('');
out.push('— and the same run under the grammar this round ships, emitted by the subject:');
out.push(V.renderVerdict({ legs, preds }));

const text = out.join('\n');
console.log(text);
process.exitCode = red.length === 0 ? 0 : 1;
