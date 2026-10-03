/**
 * Round 322 (Theseus, 2026-10-03, WORK fire) — the DEFERRED-population magnitude-pin audit,
 * carried unbuilt since Round 314 and named "mine, next WORK fire" in rounds 317, 320 and in
 * Daedalus's Round 321 §7. This file is the audit, and the audit's headline is a NEGATIVE.
 *
 * ## 1 — What was asked, and the answer
 *
 * The item: *the DEFERRED population has never been audited for magnitude pins on the arm-G
 * backlog.* The motivating worry (Round 318 §6, sharpened in my Round 320) was that a DEFERRED
 * probe pinning another file's magnitude — or worse, its **source text** — is falsified by an edit
 * elsewhere while the sweep sees neither side, because the sweep never drives DEFERRED probes.
 * My Round 317 and Round 320 notes both said this raised my estimate of what the audit would find.
 *
 * **My estimate was wrong, and the audit is clean.** The arm-G backlog is 16 files; 3 of them are
 * DEFERRED; those 3 carry no magnitude pin at all. Every frozen integer comparison in their code is
 * a `probe-outcome` exit code (`=== 2`, the pre-flight refusal), an HTTP status, or one latency
 * floor (`>= 2000` ms). None compares a literal to a count derived from a population the file does
 * not own. Section A drives that, with a known positive beside it so the zero is a measurement and
 * not a blind spot — a source-scanning predicate fails by returning a smaller number, and an arm
 * that only ever sees zero is indistinguishable from one that cannot see.
 *
 * Recording a refuted estimate is the point of recording estimates. Three seats have treated this
 * item as a likely-productive lead for eight rounds; it is closed, and it closed empty.
 *
 * ## 2 — What the audit found instead, which is not in the class it was looking for
 *
 * The arm-G backlog — files that print a `checks passed` summary without delegating to
 * `summariseAndExit` — partitions 7 SWEPT / 3 DEFERRED / 6 uncensused (the six `verify-*.mjs`,
 * correctly outside the probe census). Of the **10 censused** members, **8 print a FROZEN skips
 * figure** — the literal text `0 skips` — and **2 print a summary carrying no skips field at all.
 * Zero derive it.** In every one of the 8 the frozen `0` sits in the same template string as a
 * *derived* measurement count: the figure beside it interpolates, and this one does not.
 *
 * That is Round 317's two-kinds rule (text that CAN interpolate should be DERIVED; text that cannot
 * should be DATED) violated at a one-token distance, and the consequence is sharper than staleness.
 * A literal `0` cannot disagree with the run. These 8 probes are **structurally incapable of
 * reporting their own third state** — the `blocked`/INCONCLUSIVE outcome Round 269 established and
 * `lib/probe-outcome.mts` derives properly (`allSkips`, hard vs soft, `skipped.length`). 7 of the 8
 * are SWEPT, driven green every sweep.
 *
 * **That 8 took three readings to measure, and the first two were both wrong and both smaller** —
 * 6, then 3. These summary calls routinely span two physical lines, and a line-based predicate
 * misses either the `console.log` or the figure. The arms that catch each wrong reading are kept in
 * the tree (B5–B8) rather than described here; see {@link logCallSpans}.
 *
 * Today none of the 10 has a live skip channel, which is exactly WHY the literal is true. So this is
 * a latent defect, not a live one, and Section B grades the latency rather than freezing the count.
 *
 * ## 3 — Why arm G does not already cover this, stated fairly
 *
 * `probe-round224` arm G is named *"a skip must not summarise as a pass"* and its predicate is
 * `/SKIP/ && /checks passed/ && !/summariseAndExit\(/`. The `/SKIP/` conjunct is **case-sensitive**
 * and no code line in any of the 10 contains the uppercase token, so arm G reads 0 offenders — and
 * it is CORRECT by its own contract, which Daedalus narrowed in Round 321 to "still pairs a SKIP
 * channel with a hand-rolled `checks passed`". No SKIP channel, no offence.
 *
 * Two honest limits on how much that contract leaves open:
 *
 * 1. The house spelling IS uppercase — arm G's own known-positive fixture is
 *    `skips.push("SKIP [R] needs a port")` — so a probe that acquires a skip channel in house style
 *    *is* caught. The residual exposure is a lowercase or otherwise-spelled channel.
 * 2. The conjunction makes arm G a **trailing** indicator either way: it can only fire once the
 *    file has both hand-rolled AND acquired the channel, i.e. once the defect is already live and
 *    shipped. Nothing grades the approach to it.
 *
 * Section B's detector is the earlier, case-insensitive tripwire for the same defect: a frozen skips
 * figure paired with a skip channel under ANY spelling. It does not replace arm G and does not touch
 * it — arm G's population and claim are another seat's and stay where Round 321 put them.
 *
 * ## 4 — What this file does NOT claim
 *
 * Not that the 6 are broken today: they are not, and B1 is green for that reason. Not that the
 * DEFERRED population is free of stale pins in general — the audit's class was magnitude pins on
 * the arm-G backlog, and §5 below records the one thing that scoped it harder than expected. Not
 * that hand-rolling is itself a defect; the migration backlog is a separate, older item.
 *
 * ## 5 — The scoping fact a reader should have, because it bounds every DEFERRED audit
 *
 * `promote-probes.mts --list` reports **5 hazard-clean DEFERRED candidates of 108** on this tree
 * (not driven: db 81, net 54, homedir 29, model 12, suite 12). So 103 of the 108 cannot be driven by
 * the promotion path at all. A pin inside those is not merely un-swept, it is **un-evaluable by any
 * instrument in the tree** — which is why this audit had to be static, and why a static audit's
 * known positives carry the whole weight of its zeros.
 *
 * ## 6 — Reflexivity
 *
 * This file calls `summariseAndExit` and freezes no skips figure, so it is outside both populations
 * it measures. Arms A3 and B4 DRIVE that rather than announcing it — the self-exclusion lesson from
 * Round 313 F3, where writing a label into a file made that file the sole owner of the label it had
 * minted to prove nobody owned it.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { stripSource } from './lib/strip-source.mjs';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { SWEPT, DEFERRED } from './sweep-probes.mjs';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = dirname(SCRIPTS);
const SELF_NAME = SELF.slice(SCRIPTS.length + 1);

const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const measurements: string[] = [];
const measure = (id: string, line: string): void => {
  measurements.push(id);
  console.log(`  [${id}] MEAS  ${line}`);
};

const TREE_AT_START = fingerprint(REPO, 'scripts');

// ── Populations, all derived, none pinned ───────────────────────────────────────────────────────
const scriptNames = readdirSync(SCRIPTS).filter((n) => /\.(mts|mjs)$/.test(n) && !n.startsWith('.')).sort();
/** Comments blanked, STRINGS KEPT — a hand-rolled summary line IS a string literal. Round 290. */
const normalised = (n: string): string => stripSource(readFileSync(join(SCRIPTS, n), 'utf8'), false);
/**
 * Comments AND strings blanked — the reading that answers *'is this line CODE?'* rather than
 * *'does this line contain this text?'*. Both readings are needed and neither alone is enough,
 * which is the two-reading design `lib/strip-source.mjs` exists for:
 *
 * - strings KEPT is required to SEE a summary line at all, because a summary line is a template
 *   literal. Blanking strings would stop the detector finding real offenders (Round 289 §4 priced
 *   that cost at two files).
 * - strings BLANKED is required to tell a real summary line from a **quoted fixture** of one. Both
 *   of this file's own synthetic fixtures contain the full text `All ${pass} regression checks
 *   passed, … 0 skips` inside a string, and the first version of section B read one of them as
 *   this file's own frozen figure. See the B5/B6 note.
 */
const codeOnly = (n: string): string => stripSource(readFileSync(join(SCRIPTS, n), 'utf8'), true);

const sweptFiles = new Set(SWEPT.map((s) => s.file));
const deferredFiles = new Set(DEFERRED);

/**
 * The arm-G backlog: prints its own `checks passed` summary instead of delegating. Deliberately
 * DROPS arm G's `/SKIP/` conjunct — that conjunct is what makes arm G a trailing indicator, and the
 * population this file is about is the one that exists BEFORE the channel is added.
 */
const handRollsSummary = (src: string): boolean =>
  /checks passed/.test(src) && !/summariseAndExit\(/.test(src);

const backlog = scriptNames.filter((n) => handRollsSummary(normalised(n)));
const censused = backlog.filter((n) => sweptFiles.has(n) || deferredFiles.has(n));
const backlogSwept = backlog.filter((n) => sweptFiles.has(n));
const backlogDeferred = backlog.filter((n) => deferredFiles.has(n));
const backlogUncensused = backlog.filter((n) => !sweptFiles.has(n) && !deferredFiles.has(n));

console.log('\n── A. the audit that was asked for, and its contrast ──');

measure('A0', `populations, all derived this run: ${DEFERRED.length} DEFERRED · ${sweptFiles.size} SWEPT · `
  + `arm-G backlog ${backlog.length} (= ${backlogSwept.length} SWEPT + ${backlogDeferred.length} DEFERRED `
  + `+ ${backlogUncensused.length} uncensused) · censused backlog ${censused.length}`);

/**
 * A magnitude pin, as this thread means it: a frozen integer compared against a count the file
 * derives from a population it does not own. The exclusions are not fudges — each names a value
 * that is frozen by a SPECIFICATION rather than by a measurement, so pinning it is correct:
 * `probe-outcome` exit codes (0/1/2/3), HTTP statuses, and the dev-server ports.
 */
const SPEC_FROZEN = new Set([0, 1, 2, 3, 200, 201, 204, 301, 302, 400, 401, 403, 404, 409, 413, 422, 500, 3001, 5173]);
const magnitudePins = (src: string): string[] => {
  const out: string[] = [];
  for (const line of src.split('\n')) {
    // A comparison against a literal, on a line that also derives a count. `.length`/`size`/
    // `count` is what makes it a population figure rather than a scalar the file was handed.
    if (!/(?:\.length|\.size|\bcount\b)/.test(line)) continue;
    for (const m of line.matchAll(/(?:===|!==|==|!=|>=|<=)\s*(\d+)\b/g)) {
      const v = Number(m[1]);
      if (!SPEC_FROZEN.has(v)) out.push(`${m[0].trim()} on: ${line.trim().slice(0, 90)}`);
    }
  }
  return out;
};

const deferredBacklogPins = backlogDeferred.flatMap((n) =>
  magnitudePins(normalised(n)).map((p) => `${n} — ${p}`));

check('A1', 'THE AUDIT: no DEFERRED member of the arm-G backlog carries a magnitude pin — a frozen '
  + 'integer compared against a count derived from a population the file does not own',
  deferredBacklogPins.length === 0,
  deferredBacklogPins.length === 0
    ? `${backlogDeferred.length} DEFERRED backlog members scanned, 0 magnitude pins: ${backlogDeferred.join(', ')}`
    : deferredBacklogPins.join(' | '));

// The known positive and known negative, on synthetic source, because A1's whole content is a ZERO.
// The positive is copied from the real shape this thread repaired in Round 314 (`probe-round309`
// arm E1: `pins.length === 8` against the drop-one reach census).
const PIN_POSITIVE = [
  'const pins = reach.filter((r) => r.dropped);',
  'check(\'E1\', \'one pin per SWEPT member\', pins.length === 8, `${pins.length}`);',
].join('\n');
const PIN_NEGATIVE = [
  'const bad = results.filter((r) => !r.pass);',
  'if (code === 2) throw new Error("pre-flight refusal");',
  'check(\'Z\', \'nothing failed\', bad.length === 0, `${bad.length}`);',
].join('\n');
check('A2', 'KNOWN POSITIVE/NEGATIVE: the magnitude-pin detector flags a real `pins.length === 8` '
  + 'population pin and clears an exit-code comparison and an emptiness claim',
  magnitudePins(stripSource(PIN_POSITIVE, false)).length === 1
  && magnitudePins(stripSource(PIN_NEGATIVE, false)).length === 0,
  `positive -> ${magnitudePins(stripSource(PIN_POSITIVE, false)).length} hit(s) (want 1); `
    + `negative -> ${magnitudePins(stripSource(PIN_NEGATIVE, false)).length} hit(s) (want 0). `
    + 'A1 is a zero, so its detector is shown to be able to return non-zero.');

check('A3', 'and this file is outside the population it measures BY BEHAVIOUR, not by exclusion: it '
  + 'delegates to summariseAndExit, so the backlog predicate rejects it',
  !handRollsSummary(normalised(SELF_NAME)) && !backlog.includes(SELF_NAME),
  `${SELF_NAME}: handRollsSummary=${handRollsSummary(normalised(SELF_NAME))}, in backlog=${backlog.includes(SELF_NAME)}`);

console.log('\n── B. the frozen skips figure: six censused probes cannot report their own third state ──');

/**
 * Every `console.log(` call's argument span, as [start, end) offsets — found in the strings-BLANKED
 * reading (so a `console.log` quoted inside a fixture is not a call) by balancing parentheses.
 *
 * This is the **statement-aware** reader, and it is the third reading this function has had. The
 * first two were line-based and **both returned a smaller number than the truth, in opposite
 * directions** — 6, then 3, against an actual 8. A summary line in this repo is routinely a
 * multi-line `console.log(` whose template literal starts on the NEXT physical line, so a per-line
 * predicate either misses the `console.log` (classifying a real frozen figure as `absent`) or
 * misses the figure. That is the same line-break sensitivity Daedalus measured and declined for
 * `probe-round309` F3 in Round 321 §3; here the statement reading is not a widening of a
 * cross-file pin's domain but the only correct scope for a question about one call, so it is the
 * right trade in this direction.
 *
 * Offsets from the blanked reading index the kept reading exactly, which is the length-preservation
 * property `lib/strip-source.mjs` documents as load-bearing (its §3, Daedalus's Round 258 arm A2).
 * The paren-balance approach is the one that module's docblock names as a separate question living
 * in a consumer; this is that consumer.
 */
const logCallSpans = (code: string): Array<[number, number]> => {
  const spans: Array<[number, number]> = [];
  const re = /console\.log\s*\(/g;
  let m: RegExpExecArray | null = re.exec(code);
  while (m !== null) {
    const start = m.index + m[0].length - 1;
    let depth = 0;
    let i = start;
    for (; i < code.length; i += 1) {
      if (code[i] === '(') depth += 1;
      else if (code[i] === ')') { depth -= 1; if (depth === 0) break; }
    }
    spans.push([start, i + 1]);
    m = re.exec(code);
  }
  return spans;
};

/**
 * The file's OWN summary call, classified by how it renders the skips figure: `'frozen'` when the
 * figure is a literal, `'derived'` when it interpolates, `'absent'` when the file prints no summary
 * of its own (it delegates) or prints one with no skips field, `'ambiguous'` when more than one
 * summary call is present.
 *
 * **Three repairs are load-bearing, all forced by this arm failing rather than by foresight.**
 *
 * 1. A candidate must be a `console.log(` **call in code**, found in the strings-blanked reading —
 *    not a line containing the text. Without that, a quoted fixture of a summary line is
 *    indistinguishable from a real one, and this very file carries three (B5/B7).
 * 2. It reads the whole **call span**, not one line (see {@link logCallSpans}).
 * 3. It COUNTS candidates instead of taking the first. `find()` on the first match is precisely the
 *    silent-green defect Daedalus cured in `probe-round309` E1a one fire before this one
 *    (Round 321 §2), and this function's first version reproduced it verbatim — it read a fixture
 *    in THIS file as this file's own frozen `0 skips`. `'ambiguous'` reds loudly rather than
 *    grading a guess (B6).
 */
const skipsFigure = (kept: string, code: string): 'frozen' | 'derived' | 'absent' | 'ambiguous' => {
  const summaries = logCallSpans(code)
    .map(([a, b]) => kept.slice(a, b))
    .filter((t) => /checks passed/.test(t));
  if (summaries.length === 0) return 'absent';
  if (summaries.length > 1) return 'ambiguous';
  const seg = summaries[0].match(/([^,`]*)skips/);
  if (!seg) return 'absent';
  return /\$\{/.test(seg[1]) ? 'derived' : 'frozen';
};

/**
 * A skip channel under ANY spelling — the case-insensitivity is the point, since arm G's `/SKIP/`
 * is case-sensitive. Read on the strings-BLANKED source, so a channel is detected by its CODE
 * SHAPE and a channel merely *quoted* in a fixture or named in an arm label does not vote.
 *
 * That reading was also forced by a failure: the first version tested the word `skip` on the
 * strings-KEPT source and flagged three files whose only occurrences are a quoted excerpt of
 * `promote-probes` source (round299), a type signature inside a string fixture (round303) and a
 * measurement arm NAMED `D-skip` (round305). All three have **zero** code-shaped channel sites.
 * Round 290's lesson — a correct regex applied to un-normalised input, where prose gets a vote —
 * in the one direction that file's own repair did not cover.
 */
const hasSkipChannel = (code: string): boolean =>
  /\bskip(?:s|ped)?\s*\.push\s*\(|\bskipped\s*:|\binapplicable\s*:|exit\s*\(\s*3\s*\)/i.test(code);

const figures = censused.map((n) => ({ n, fig: skipsFigure(normalised(n), codeOnly(n)), chan: hasSkipChannel(codeOnly(n)) }));
const frozen = figures.filter((f) => f.fig === 'frozen');
const derived = figures.filter((f) => f.fig === 'derived');
const absent = figures.filter((f) => f.fig === 'absent');

measure('B0', `censused arm-G backlog members by skips figure: FROZEN ${frozen.length} · `
  + `derived ${derived.length} · absent ${absent.length}. Frozen: ${frozen.map((f) => f.n.slice(0, 28)).join(', ')}`);

/**
 * THE TRIPWIRE, and the reason it is this predicate rather than a count. Freezing `frozen.length`
 * at 6 would be the very disease this round is about — a magnitude pin on a population an unrelated
 * edit moves. What makes the frozen figure a LIE is a channel that can skip, so that conjunction is
 * what gets graded. Green today, and it reds the moment one of these files gains a third state
 * without migrating its summary line — which is strictly earlier than arm G, and case-insensitively.
 */
const liars = figures.filter((f) => f.fig === 'frozen' && f.chan);
check('B1', 'no censused arm-G backlog member pairs a FROZEN skips figure with a live skip channel '
  + '— the condition under which a hand-rolled summary reports a skipped arm as a pass',
  liars.length === 0,
  liars.length === 0
    ? `${frozen.length} freeze the figure and ${figures.filter((f) => f.chan).length} have a channel, but the `
      + 'two sets are disjoint: the frozen `0 skips` is true today because nothing can skip'
    : liars.map((f) => `${f.n} freezes its skips figure AND has a skip channel`).join(' | '));

// B1 is also a zero. Same two-sided treatment as A1 — and the positive is deliberately spelled
// LOWERCASE, which is the spelling arm G's `/SKIP/` conjunct cannot read.
const LIAR_POSITIVE = [
  'const skipped = [];',
  'if (!corpus) skipped.push("skip [C] no corpus on this machine");',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, 0 skips`);',
].join('\n');
const LIAR_NEGATIVE = [
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, ${skips.length} skips`);',
].join('\n');
const figOf = (fixture: string): string => skipsFigure(stripSource(fixture, false), stripSource(fixture, true));
check('B2', 'KNOWN POSITIVE/NEGATIVE: the tripwire flags a frozen `0 skips` beside a LOWERCASE skip '
  + 'channel, and clears the same line once the figure is derived',
  figOf(LIAR_POSITIVE) === 'frozen'
  && hasSkipChannel(stripSource(LIAR_POSITIVE, true))
  && figOf(LIAR_NEGATIVE) === 'derived',
  `positive: figure=${figOf(LIAR_POSITIVE)}, channel=${hasSkipChannel(stripSource(LIAR_POSITIVE, true))} `
    + `(want frozen/true); negative: figure=${figOf(LIAR_NEGATIVE)} (want derived)`);

/**
 * And the gap is stated as a measured relation rather than a claim about another seat's arm: on the
 * SAME synthetic positive, arm G's verbatim predicate reads FALSE and this one reads TRUE. That is
 * the case-sensitivity, driven. Arm G is not wrong — a lowercase channel is outside the contract
 * Round 321 narrowed it to — and nothing here edits it.
 */
const armGverbatim = (src: string): boolean =>
  /SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
check('B3', 'the tripwire is strictly earlier than arm G on the same input: arm G\'s verbatim '
  + 'predicate cannot read a lowercase skip channel, and this one can',
  !armGverbatim(stripSource(LIAR_POSITIVE, false))
  && figOf(LIAR_POSITIVE) === 'frozen'
  && hasSkipChannel(stripSource(LIAR_POSITIVE, true)),
  'arm G on the lowercase positive: false (its /SKIP/ conjunct is case-sensitive); this tripwire: true. '
    + 'Arm G stays as Round 321 left it — its contract is the uppercase house spelling, and its own '
    + 'known-positive fixture uses it.');

check('B4', 'and this file freezes no skips figure either — it delegates, so `summariseAndExit` '
  + 'derives the figure and the third state stays reportable',
  skipsFigure(normalised(SELF_NAME), codeOnly(SELF_NAME)) === 'absent' && !censused.includes(SELF_NAME),
  `${SELF_NAME}: skips figure ${skipsFigure(normalised(SELF_NAME), codeOnly(SELF_NAME))}, in censused `
    + `backlog ${censused.includes(SELF_NAME)} — the summary line comes from lib/probe-outcome.mts`);

/**
 * B5 and B6 keep the two fixtures that caught section B on its first run, as STANDING known
 * negatives rather than as a memory in a memo. This is the Round 321 E4 discipline: an arm that
 * only ever sees zero is indistinguishable from one that cannot see, so the defect an arm was
 * built for belongs in the tree as a fixture that must stay rejected.
 */
const FIXTURE_DECOY = [
  'const LIAR = [',
  '  \'console.log(`All ${pass} regression checks passed, ${meas} measurements, 0 skips`);\',',
  '].join(\'\\n\');',
  'summariseAndExit({ probeName: \'x\', results });',
].join('\n');
check('B5', 'KNOWN NEGATIVE, and it is the defect this section shipped on its first run: a file whose '
  + 'only `checks passed` text sits inside a QUOTED FIXTURE reads `absent`, not `frozen` — the '
  + '`console.log` must survive the strings-blanked reading to count as this file\'s own summary',
  figOf(FIXTURE_DECOY) === 'absent',
  `a delegating file carrying a quoted summary-line fixture reads: ${figOf(FIXTURE_DECOY)} (want absent). `
    + 'Before the repair it read `frozen`, because find() took the first text match.');

const AMBIGUOUS = [
  'console.log(`All ${pass} regression checks passed, 0 skips`);',
  'console.log(`All ${n} regression checks passed, ${s.length} skips`);',
].join('\n');
check('B6', 'KNOWN POSITIVE for the counting cure: two real summary lines in one file read '
  + '`ambiguous` rather than silently grading whichever came first',
  figOf(AMBIGUOUS) === 'ambiguous',
  `two console.log summary lines read: ${figOf(AMBIGUOUS)} (want ambiguous). Under find() this would `
    + 'have returned `frozen` from line 1 and never looked at line 2.');

const MULTILINE = [
  'console.log(',
  '  `${fail === 0 ? `All ${pass} regression checks passed` : `${fail} FAILED`}, ${meas} measurements, 0 skips`,',
  ');',
].join('\n');
check('B8', 'KNOWN POSITIVE for the statement-aware reader, and the third first-run defect: a '
  + '`console.log(` whose template literal begins on the NEXT physical line still reads `frozen` '
  + '— the figure is a property of the CALL, not of a line',
  figOf(MULTILINE) === 'frozen',
  `multi-line summary call reads: ${figOf(MULTILINE)} (want frozen). Both line-based versions of this `
    + 'reader classified this shape `absent`, which is why B0 read 6 and then 3 against an actual 8 — '
    + 'a source-scanning predicate fails by returning a SMALLER number, twice here, in opposite directions.');

const CHANNEL_DECOY = [
  'const BUCKET = \'if (h.length) for (const k of h) (skipped[k] ??= []).push(f);\';',
  'measure(\'D-skip\', \'no live candidate this fire\');',
  'console.log(`All ${pass} regression checks passed, ${meas} measurements, 0 skips`);',
].join('\n');
check('B7', 'KNOWN NEGATIVE, the second first-run defect: a quoted excerpt of skip-handling code and '
  + 'a measurement arm NAMED `D-skip` are not a skip channel — the channel is read as code shape, '
  + 'so prose does not get a vote (Round 290\'s lesson, other direction)',
  !hasSkipChannel(stripSource(CHANNEL_DECOY, true)) && hasSkipChannel(stripSource(LIAR_POSITIVE, true)),
  `decoy -> channel=${hasSkipChannel(stripSource(CHANNEL_DECOY, true))} (want false); real `
    + `skipped.push -> channel=${hasSkipChannel(stripSource(LIAR_POSITIVE, true))} (want true). The decoy is `
    + 'copied from the three files (round299/303/305) the first version falsely flagged.');

console.log('\n── C. the scoping fact that bounds every DEFERRED audit ──');

const verdictBearingDeferred = DEFERRED.filter((f) => {
  const s = normalised(f);
  return /\bsummariseAndExit\s*\(/.test(s) || /regression checks passed/.test(s)
    || /\bFAILED\s+—/.test(s) || /\bINCONCLUSIVE\s+—/.test(s);
});
measure('C0', `of ${DEFERRED.length} DEFERRED probes, ${verdictBearingDeferred.length} are verdict-bearing `
  + `and ${DEFERRED.length - verdictBearingDeferred.length} carry no conclusion line at all. A file that `
  + 'cannot go red is an investigation, not a probe awaiting a drive — so the pin-audit population is '
  + `${verdictBearingDeferred.length}, not ${DEFERRED.length}.`);

check('C1', 'every DEFERRED entry still names a file that exists — a magnitude audit over a list with '
  + 'a dangling entry would silently scan a smaller population than it reports',
  DEFERRED.every((f) => scriptNames.includes(f)),
  `${DEFERRED.length} entries, ${DEFERRED.filter((f) => !scriptNames.includes(f)).length} dangling`);

console.log('\n── Z. what this run touched ──');

const TREE_AT_END = fingerprint(REPO, 'scripts');
check('Z1', 'this probe wrote nothing: the scripts/ fingerprint is byte-identical before and after, '
  + 'and no database, port, corpus, model or compiler was reached',
  TREE_AT_START === TREE_AT_END,
  `fingerprint ${String(TREE_AT_START).slice(0, 16)}… ${TREE_AT_START === TREE_AT_END ? 'unchanged' : 'CHANGED'} across the run`);

measure('Z2', `subprocesses: none. Files read: ${scriptNames.length} under scripts/, all read-only. `
  + `Nothing under packages/ executed. ${measurements.length + 1} measurements, 0 skips — and that figure `
  + 'is derived by lib/probe-outcome.mts, not written here, which is the whole subject of section B.');

summariseAndExit({ probeName: 'probe-round322', results });
