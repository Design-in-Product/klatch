/**
 * Round 458 — the Round 456 §3 cure, graded.
 *
 * THE DEFECT, restated from the measurement and not from the memo: the three-state discipline
 * (`LEG_TOKENS` = ok/RED/REF) was applied at the LEG and never at the CONJUNCT. The idiom for "did
 * my slice compile" is `re !== null && …`, and `!==` turns a refusal into `false`, which `leg()`
 * publishes as RED. A RED claims a measurement was made and came out bad; the honest token when a
 * slice will not compile is REF. Round 452 cured the two hand-rolled readers that Rounds 450/451
 * slice from SOURCE, so those slices now correctly refuse — and five of my own legs inverted to a
 * false RED against a tree where the reference answer was right.
 *
 * WHAT IS GRADED HERE, and the order matters:
 *   C1  the lib's own `selfTest` is green at HEAD                     (gate on `!== true`, 356)
 *   C2  that `selfTest` CATCHES a crippled `allOf`/`measured`         (the cripple grading)
 *   C3  the scratch copies resolve `REPO_ROOT` to the same path       (443 — depth gate per cell dir)
 *   C4  how many `leg()` conjunctions still launder a refusal         (the census; a FLOOR, see C4)
 *   C5  the five named sites publish REF, not RED, after the cure     (the cure, with its control)
 *
 * C1 alone would be the 356 shape — a printed self-test that gates nothing. C2 is what makes C1
 * mean anything, and C2 needs its own control (a CLEAN copy that passes) or it would be satisfied
 * by a grader that fails everything.
 */
import { readFileSync, writeFileSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  renderTail, selfTest, allOf, measured, _internals,
} from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = join(HERE, '..', 'lib', 'verdict.mjs');
const RESEARCH = join(HERE, '..');

const legs = [];
const preds = [];
const say = (s) => process.stdout.write(`${s}\n`);
// `leg`/`pred` PUSH ONLY and never print a row. The canonical rows are emitted exactly once, by
// `renderTail` at the end. Printing them here as well would put two rows per leg in the recording
// and make the row count disagree with the verdict line's own `legs=N` — which is precisely the
// completeness class Theseus's Round 457 §3 censused (13 recordings whose declared count and
// printed rows disagree). An instrument curing one three-state defect should not emit another.
const leg = (id, ok, what) => { legs.push({ id, ok, what }); };
const pred = (id, landed, what) => { preds.push({ id, landed, what }); };

const git = (args) => execFileSync('git', args, { cwd: RESEARCH, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const REV = git(['rev-parse', 'HEAD']).trim();
say(`REV: ${REV}`);
say(`DIRTY: ${git(['status', '--porcelain']).trim().length > 0}`);
say('');

const libSrc = readFileSync(LIB, 'utf8');

// ── C1 — the lib's self-test is green at HEAD ───────────────────────────────────────────────────
// Gates on `!== true`, not on truthiness: a self-test that returned a string, or 0, or threw and
// was caught into a falsy, must not read as a pass (356).
{
  let r = null;
  let threw = null;
  try { r = selfTest(); } catch (e) { threw = e.message; }
  leg('C1', r === true, `selfTest() returned ${JSON.stringify(r)}${threw === null ? '' : ` (threw: ${threw})`}`);
}

// ── C2 — the cripple grading: does `selfTest` actually CATCH a broken helper? ────────────────────
// Each cripple is a single-token edit to the lib's source, applied to a COPY, which is then
// imported and its `selfTest` run. The required outcome is a THROW. A cripple that passes is a
// hole in `selfTest`, not a success.
//
// Two guards on the grading itself, both learned the hard way:
//   - each cripple's anchor must occur in the source EXACTLY as many times as the cripple expects,
//     asserted before the edit. A cripple whose anchor has drifted edits nothing, the copy stays
//     clean, `selfTest` passes, and the cell reads "selfTest missed it" — a false finding in the
//     direction that looks like a defect (433).
//   - a CLEAN copy must PASS, or a grader that fails every import would score every cripple
//     caught (424 — a known positive needs a control).
const CRIPPLES = [
  // The cell that IS the finding: Kleene's `false AND null = false`, flipped to refusal-dominant.
  { name: 'allOf-refusal-dominant', occurs: 1,
    from: '  if (values.includes(false)) return false;\n  if (values.includes(null)) return null;',
    to: '  if (values.includes(null)) return null;\n  if (values.includes(false)) return false;' },
  // `true AND null = null` flipped to the bug being cured: an unmeasured conjunct earned into ok.
  { name: 'allOf-null-becomes-true', occurs: 1,
    from: '  if (values.includes(null)) return null;\n  return true;',
    to: '  return true;' },
  // Totality removed — the coercion that caused the original defect.
  { name: 'allOf-accepts-non-tristate', occurs: 1,
    from: "      throw new Error(`allOf() got a value outside {true,false,null}: ${JSON.stringify(v)}`);",
    to: '      continue;' },
  // `measured` stops propagating the refusal: the laundering, reintroduced inside the helper that
  // exists to prevent it.
  { name: 'measured-does-not-propagate', occurs: 1,
    from: '  if (value === null) return null;',
    to: '  if (value === null) return false;' },
  // `measured` coerces its predicate's return instead of throwing, so a count or array silently
  // becomes a boolean again.
  { name: 'measured-coerces-return', occurs: 1,
    from: "    throw new Error(`measured() predicate returned a non-tri-state value: ${JSON.stringify(r)}`);",
    to: '    return Boolean(r);' },
];

{
  const rows = [];
  const anchorProblems = [];
  for (const c of CRIPPLES) {
    const n = libSrc.split(c.from).length - 1;
    if (n !== c.occurs) anchorProblems.push(`${c.name}: anchor occurs ${n}×, expected ${c.occurs}`);
  }

  // The scratch copies live in THIS directory, which is at the same depth below the repo root as
  // `lib/` is (`docs/research/<dir>/x.mjs`), so the lib's `REPO_ROOT` — derived from its own module
  // path with three `..` — resolves identically. C3 asserts that rather than assuming it.
  const runCopy = async (name, text) => {
    const p = join(HERE, `.cripple-${name}.mjs`);
    writeFileSync(p, text);
    try {
      const m = await import(`${p}?v=${Date.now()}`);
      try { return { threw: false, ret: m.selfTest() }; } catch (e) { return { threw: true, ret: e.message }; }
    } catch (e) {
      return { threw: true, ret: `IMPORT: ${e.message}` };
    } finally {
      rmSync(p, { force: true });
    }
  };

  // The control first: a byte-identical copy must pass, or nothing below separates.
  const control = await runCopy('control', libSrc);
  const controlPassed = control.threw === false && control.ret === true;

  let caught = 0;
  for (const c of CRIPPLES) {
    const crippled = libSrc.split(c.from).join(c.to);
    const edited = crippled !== libSrc;
    const r = edited ? await runCopy(c.name, crippled) : { threw: false, ret: 'ANCHOR MISSED — nothing edited' };
    if (edited && r.threw) caught += 1;
    rows.push(`${c.name}: edited=${edited} caught=${edited && r.threw}${r.threw ? ` (${String(r.ret).split('\n')[0].slice(0, 72)})` : ` ret=${JSON.stringify(r.ret)}`}`);
  }

  leg('C2', allOf(
    anchorProblems.length === 0,
    controlPassed,
    caught === CRIPPLES.length,
  ), `${caught}/${CRIPPLES.length} cripples caught by selfTest · clean control passes: ${controlPassed}`
    + ` · anchor problems: ${anchorProblems.length === 0 ? 'none' : JSON.stringify(anchorProblems)}`);
  for (const r of rows) say(`     ${r}`);

  // No leftover scratch file may survive this cell. The 10/24 wrap protocol caught a `.g4-*` file
  // reaching origin/main with its own guard green, because that guard keyed on one spelling of
  // "temporary"; this one keys on any dotfile in this directory.
  const leftovers = readdirSync(HERE).filter((f) => f.startsWith('.'));
  leg('C2b', leftovers.length === 0, `dotfile leftovers in this instrument dir: ${JSON.stringify(leftovers)}`);
}

// ── C3 — the scratch copies sit at the depth the lib's REPO_ROOT assumes ────────────────────────
// 443: a scratch copy at the wrong depth refuses every cell, and it refuses them for a reason that
// looks like a finding. Gated per cell directory, read off the lib's own exported internal rather
// than recomputed here (a recomputation would agree with itself).
{
  const libRoot = _internals.REPO_ROOT;
  const asIfHere = join(HERE, '..', '..', '..');
  leg('C3', libRoot === asIfHere,
    `lib REPO_ROOT=${JSON.stringify(libRoot)} · same three-'..' walk from THIS dir=${JSON.stringify(asIfHere)}`
    + ' · so a crippled copy written here resolves the repo identically');
}

// ── C4 — the census: how many `leg()` conjunctions still launder a refusal ──────────────────────
// The detector extracts each `leg(` call's FIRST argument by balanced-paren scanning and asks
// whether that expression text contains a null comparison. It is a real parse of the call, not a
// line grep, because the expressions span lines and a line grep cannot tell a leg's conjunction
// from a correct refusal check elsewhere in the file.
//
// DECLARED BLINDNESS, and it is the honest half of this leg: the detector sees the idiom only
// where it appears AT the leg. Round 451's `T8` carries the same defect with NO null comparison in
// its leg expression at all (`alive.length > 0`) — the laundering happened upstream, in a loop
// where `read446 === 0` was false for a refused slice, so no member entered the population and a
// count was deflated to 0. `T8` was found by hand, not by this detector. So this number is a
// **FLOOR on the class and cannot be read as its size**: it can only move up when the detector is
// widened, never down. Which end it can move is stated because a refusing signal that does not say
// so gets quoted as a count (436).
const LAUNDER = /(?:!==|===)\s*null/;
const censusRows = [];
{
  // SELF-EXCLUSION, by this module's own resolved path rather than by a name pattern (447 — an
  // instrument does not census its own source; 445 — exclude the running file by its own path). Its
  // own `leg()` calls would otherwise inflate the denominator and let the cell grade itself. The
  // exclusion COUNT is asserted below, because a self-exclusion that matches nothing is vacuous and
  // a verdict of `true` would hide that (434).
  const SELF = fileURLToPath(import.meta.url);
  const files = [];
  let selfExcluded = 0;
  for (const d of readdirSync(RESEARCH)) {
    const dir = join(RESEARCH, d);
    if (!d.endsWith('-instruments')) continue;
    let entries = [];
    try { entries = readdirSync(dir); } catch { continue; }
    for (const f of entries) {
      if (!f.endsWith('.mjs') && !f.endsWith('.mts')) continue;
      const abs = join(dir, f);
      if (abs === SELF) { selfExcluded += 1; continue; }
      files.push(abs);
    }
  }

  // Balanced-paren extraction of `leg(<expr>, <detail>)`'s first argument. Splits on the first
  // top-level comma AFTER the id argument, so a conjunction containing commas inside a call
  // (`JSON.stringify(a, null, 2)`) is not truncated at it.
  const legArgsOf = (src) => {
    const out = [];
    const re = /\bleg\(\s*(['"])([^'"]+)\1\s*,/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      let i = m.index + m[0].length;
      let depth = 0;
      let start = i;
      let expr = null;
      for (; i < src.length; i += 1) {
        const ch = src[i];
        if (ch === '(' || ch === '[' || ch === '{') depth += 1;
        else if (ch === ')' || ch === ']' || ch === '}') {
          if (depth === 0 && ch === ')') { expr = src.slice(start, i); break; }
          depth -= 1;
        } else if (ch === ',' && depth === 0) { expr = src.slice(start, i); break; }
      }
      if (expr !== null) out.push({ id: m[2], expr });
    }
    return out;
  };

  let sites = 0;
  let laundering = 0;
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const { id, expr } of legArgsOf(src)) {
      sites += 1;
      if (LAUNDER.test(expr)) {
        laundering += 1;
        censusRows.push(`${f.slice(RESEARCH.length + 1)}  ${id}  ${expr.replace(/\s+/g, ' ').trim().slice(0, 96)}`);
      }
    }
  }

  // KNOWN POSITIVE and CONTROL.
  //
  // MY PRE-REGISTERED KP LIST WAS WRONG, and the detector is what caught it. Drive 1 keyed the KPs
  // on `['W6','T2','T3']` — the ids Round 456 named — and flagged only `W6` and `T3`. `T2` is not a
  // leg-level instance at all: its expression is `bothCompiled && bothReadOwnEra && proseRefused &&
  // propPin`, four plain-looking booleans, with every null comparison upstream in their
  // definitions. I had assumed where the laundering sat instead of reading it, in exactly the
  // direction that flatters the detector. Of the seven sites cured this round, **two** (`W6`, `T3`)
  // launder AT the leg and **five** (`T2`, `T4`, `T5`, `T8`, `P1`) launder upstream.
  //
  // So the KP is now keyed on a site this round does NOT cure — `D3` in round456, which is mine and
  // is deliberately left uncured (see the README: Theseus re-drove 456 at `df5a27cc` and curing it
  // now would move the recording his comparison is keyed on). A KP inside the cured set would go
  // absent the moment the cure landed and the leg would redden on its own success (431).
  //
  // The control is `W7` — `r === true`, a tri-state comparison that is NOT a null comparison. A
  // detector that flagged everything would "find" every KP too (424).
  const flagged = new Set(censusRows.map((r) => r.split(/\s+/)[1]));
  const KP_UNCURED = 'D3';
  const CURED_AT_LEG = ['W6', 'T3', 'T9'];
  const kpFlagged = flagged.has(KP_UNCURED);
  const controlClean = flagged.has('W7') === false;
  // The cure's own regression check: the leg-level sites cured this round must no longer be
  // flagged. This is the half that can only pass after the cure, so it separates cure from no-cure.
  const stillFlagged = CURED_AT_LEG.filter((id) => flagged.has(id));
  // And the detector must have READ something: a parse that returns zero leg sites proves nothing
  // about zero laundering sites (an import is not a call site, 429).
  leg('C4', allOf(sites > 0, kpFlagged, controlClean, stillFlagged.length === 0, selfExcluded === 1),
    `${sites} leg() call sites parsed across ${files.length} instrument files (this cell's own `
    + `source excluded by path, ${selfExcluded} file — gated, not assumed) · ${laundering} launder a `
    + `refusal AT the leg · uncured KP ${KP_UNCURED} flagged: ${kpFlagged} · control W7 unflagged: `
    + `${controlClean} · cured-at-leg still flagged: ${JSON.stringify(stillFlagged)} `
    + `(expected []) · FLOOR, not a count: the five upstream instances this round cured were `
    + 'invisible to this detector and were found by hand');
  for (const r of censusRows) say(`     ${r}`);

  // Pre-registered before the post-cure drive: the count falls from 8 to 5, losing exactly W6, T3
  // and T9. If it lands on any other number the cure touched something it did not declare.
  pred('Q2', laundering === 5,
    `leg-level laundering sites fall 8 → 5 (losing exactly ${JSON.stringify(CURED_AT_LEG)}) · `
    + `measured ${laundering}`);
}

// ── C5 — the cure: the named sites publish REF, not RED ─────────────────────────────────────────
// Driven, not argued. Each of the two cured instruments is re-run as a child process against
// today's tree and its published verdict line is read. The expected outcome was written down in
// Round 456 before this cure existed: the legs that invert must become REF, and `red` must not
// contain them.
//
// The CONTROL that makes this a measurement rather than a restatement: the same two instruments at
// the PINNED pre-cure revision must publish those same ids in `red`. If the pre-cure copy no longer
// reddens, this cell is comparing a cure against nothing (438).
{
  // `expectRef` and `popLeg` were both written down before the post-cure drive. `popLeg` is the
  // subject's OWN population leg: if it is not `ok`, the subject never reached its corpus and its
  // red/refused lists say nothing about what this cell grades, so C5 REFUSES instead of reporting.
  // That gate exists because drive 1 of this cell did not have it and published a false reading —
  // see `C6`.
  const SUBJECTS = [
    { dir: 'round450-instruments', file: 'grade-the-row-guards.mjs', expectRef: ['W6'], popLeg: null },
    {
      dir: 'round451-instruments',
      file: 'settle-the-subset-question-on-real-exemplars.mjs',
      expectRef: ['T2', 'T3', 'T4', 'T5', 'T8'],
      popLeg: 'T1',
    },
  ];
  const verdictOf = (text) => {
    const line = text.split('\n').filter((l) => l.startsWith('VERDICT/1'))[0] ?? null;
    if (line === null) return null;
    const grab = (k) => { const m = line.match(new RegExp(`${k}=\\[([^\\]]*)\\]`)); return m === null ? null : (m[1] === '' ? [] : m[1].split(',')); };
    const legOk = (id) => new RegExp(`^LEG ${id} ok`, 'm').test(text);
    return { line, red: grab('red'), refused: grab('refused'), legOk };
  };
  // `cwd: REPO_ROOT`. Drive 1 of this cell omitted it — see `C6`, which is the finding that came
  // out of the omission.
  const run = (dir, file, cwd = _internals.REPO_ROOT) => {
    try {
      return execFileSync('node', [join(RESEARCH, dir, file)], {
        encoding: 'utf8', cwd, stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000, maxBuffer: 1 << 28,
      });
    } catch (e) {
      // execFileSync echoes child stderr into the parent's own stream as well as capturing it
      // (418). Read stdout only, and treat a non-zero exit as a readable outcome rather than a
      // crash of this cell — an instrument that exits non-zero may still have published a verdict.
      return String(e.stdout ?? '');
    }
  };

  const rows = [];
  let allCured = true;
  let unreadable = false;
  for (const s of SUBJECTS) {
    const v = verdictOf(run(s.dir, s.file));
    if (v === null) {
      unreadable = true;
      rows.push(`${s.dir}: NO VERDICT LINE published — REF, not a reading`);
      continue;
    }
    // The population gate, before any red/refused list is believed.
    if (s.popLeg !== null && v.legOk(s.popLeg) === false) {
      unreadable = true;
      rows.push(`${s.dir}: population leg ${s.popLeg} is NOT ok — the subject never reached its `
        + 'corpus, so its red/refused lists grade nothing. REF.');
      continue;
    }
    const stillRed = s.expectRef.filter((id) => v.red.includes(id));
    const nowRef = s.expectRef.filter((id) => v.refused.includes(id));
    // `red` must be EMPTY, not merely free of the expected ids: a cure that moved the named legs to
    // REF while reddening some other leg is not the declared outcome.
    if (stillRed.length > 0 || nowRef.length !== s.expectRef.length || v.red.length > 0) allCured = false;
    rows.push(`${s.dir}: red=${JSON.stringify(v.red)} refused=${JSON.stringify(v.refused)} · `
      + `expected REF ${JSON.stringify(s.expectRef)} → now REF ${JSON.stringify(nowRef)}, still RED ${JSON.stringify(stillRed)}`);
  }

  leg('C5', unreadable ? null : allCured,
    `${rows.length} cured instrument(s) re-driven against today's tree with cwd pinned to the repo `
    + `root${unreadable ? ' — one was unreadable or never reached its population, so REF not RED' : ''}`);
  for (const r of rows) say(`     ${r}`);

  // ── C6 — the harness defect this cell shipped in drive 1, as a driven counterfactual ──────────
  // Drive 1 called the subjects with no `cwd`, so they inherited this cell's own directory. Round
  // 451's `git()` was bare `execFileSync('git', args)`, and `git ls-tree -r --name-only <rev>` is
  // CWD-SENSITIVE — from a subdirectory it lists only that subdirectory's paths. The subject
  // therefore measured an EMPTY corpus and published `red=[T1,T2,T3,T4,T7,T8]`: six red legs, two
  // of which (`T1`, `T7`) are not in this round's class at all. My harness manufactured the result
  // it was built to measure, and the only reason it was caught is that `T1` is a population leg and
  // its redness made no sense.
  //
  // Both halves are now fixed — the subject pins `-C REPO`, and this cell pins `cwd`. Graded as an
  // A/B over the one variable, with each arm required to REACH a verdict, because two arms that
  // both died would read as agreement (419).
  {
    const s = SUBJECTS[1];
    const pinned = verdictOf(run(s.dir, s.file, _internals.REPO_ROOT));
    const fromHere = verdictOf(run(s.dir, s.file, HERE));
    const bothReached = pinned !== null && fromHere !== null;
    // After the subject's own `-C REPO` fix the two arms must now AGREE — that is the cure. The
    // pre-cure behaviour is recorded in `drive1.precure.out`, which is the evidence that they once
    // disagreed; a counterfactual cannot show a difference that has just been removed.
    const agree = bothReached
      && JSON.stringify(pinned.refused) === JSON.stringify(fromHere.refused)
      && JSON.stringify(pinned.red) === JSON.stringify(fromHere.red);
    const popOkBoth = bothReached && pinned.legOk('T1') && fromHere.legOk('T1');
    leg('C6', bothReached ? allOf(agree, popOkBoth) : null,
      `the subject's verdict is now INDEPENDENT of the caller's cwd: from repo root `
      + `refused=${pinned === null ? 'NO VERDICT' : JSON.stringify(pinned.refused)} red=`
      + `${pinned === null ? 'n/a' : JSON.stringify(pinned.red)} · from this instrument dir `
      + `refused=${fromHere === null ? 'NO VERDICT' : JSON.stringify(fromHere.refused)} red=`
      + `${fromHere === null ? 'n/a' : JSON.stringify(fromHere.red)} · agree: ${agree} · `
      + `population leg T1 ok in BOTH arms: ${popOkBoth} · pre-cure these disagreed, recorded in `
      + 'drive1.precure.out (red=[T1,T2,T3,T4,T7,T8] from a subdirectory)');
  }

  // The pre-registered prediction, scored. Round 456 said these legs invert because a refusal is
  // conjoined away; if that diagnosis was right, the cure moves them to REF and moves nothing into
  // `red`. If they land anywhere else, the diagnosis was wrong, not just the cure.
  pred('Q1', unreadable ? null : allCured,
    'Round 456 §3: the inverting legs are a refusal conjoined into a false RED, so the cure moves '
    + 'each to REF and leaves red EMPTY in both subjects');
}

say('');
say(renderTail({ legs, preds }));
const red = legs.filter((l) => l.ok === false);
process.exitCode = red.length > 0 ? 1 : 0;
