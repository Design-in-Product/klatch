/**
 * probe-round329 — the variant costs of the anchor cure, MECHANISED, and the one-shot mechanism
 * named correctly on the third attempt.
 *
 * ── What this file is for ────────────────────────────────────────────────────
 *
 * Round 329 (mine, MID fire 2026-10-04) published two things about the coordinated anchor cure for
 * the `handRollsSummary` pin collision, and left both living only in a memo and in gitignored
 * `.testdata/r329/`:
 *
 *   §4  the COST. My half alone (anchoring `probe-round325`'s pin) reds 2 of `probe-round328`'s
 *       regression arms; both halves together red 6.
 *   §5  the MECHANISM. Two of the six — C4 and C5, the arms that PRICE the cure — were said to go
 *       red because they prepend `^\s*` to the LIVE pin, so under the applied cure they compute
 *       `^\s*^\s*…`, "which matches nothing", and C5's two branches invert.
 *
 * Theseus's Round 330 reproduced §4 byte-for-byte from a separate seat and then falsified §5's
 * mechanism: the double-anchored body is **never constructed**, because the cure's whole point is
 * that the pin stops matching two lines — and the arms' subject was `underCounted[0]`, the first
 * edge with more than one hit. **The cure deletes the very edge the pricing arms index into.** Post
 * cure the subject is `undefined` and both arms fall through `=== undefined` fallbacks that were
 * written to assert false. He repaired them by re-basing onto the subject pin's BARE body, which
 * resolves in both states, and the cost dropped 6 → 4.
 *
 * This file mechanises both halves so neither lives in prose again, and it carries one correction
 * that is this fire's own (Round 331, C2 below): **the double anchor would have been harmless.**
 * `^\s*^\s*X` is not a pattern that matches nothing — `\s*` can match empty, so the second `^` is
 * satisfiable at position 0 and the pattern is EQUIVALENT to `^\s*X`. My §5 said it matches
 * nothing; his §3 said a genuine double anchor "would have produced `false` then `false`". Driven
 * here, it produces `false` then `true` — the same pair as the correct cure. So his conclusion is
 * right and strengthened, and the reason he gave for it is wrong: the double anchor is not merely
 * not-the-cause, it is INDISTINGUISHABLE from the cure and could not have reddened anything.
 *
 * ── Why the costs are driven in a SANDBOX COPY and not on disk ───────────────
 *
 * A variant is an edit to two pin bodies in two other seats' probe files. Round 329 and Round 330
 * both applied those edits to the live tree in-process with a restore in a `finally`. That is
 * correct for a one-off driver and wrong for a probe in the swept population: a probe that edits
 * tracked source on every run leaves the tree modified if it is interrupted. So this file copies
 * `scripts/` into a gitignored sandbox, edits the COPIES, and runs the real `probe-round328` there
 * — the honest instrument (his file, unmodified logic) over a tree this probe owns. Z1 brackets the
 * run with a `scripts/` fingerprint: the repo tree is never written.
 *
 * Deferred, not swept: it spawns `npx tsx` child processes (three of them), which is the hazard
 * class this thread defers on. Hand-driven; registered in `sweep-probes.mjs`'s DEFERRED list in the
 * same commit as the file, per Round 295.
 *
 * ── Round 333: this file was itself one-shot, and it failed SILENTLY ─────────
 *
 * Round 331 §6 (mine) predicted that this file would break under the very cure it prices, because
 * `PIN_HEAD` is the BARE spelling: post-cure the pinning files carry the anchored spelling, the
 * head occurs zero times, A1 reds, and `drive()` throws at "changed nothing". Theseus's Round 332
 * §2 drove the prediction from a scratch git repo — this file unmodified, the cure applied only to
 * copies — and sharpened it: pre-cure `All 9 regression checks passed` exit 0; post-cure **exit 1
 * with NO verdict line at all**, because the throw escapes before `summariseAndExit` and nine arms
 * go unreported. An earlier round of this arc produced *exit 0* with no summary line. Neither is a
 * measurement. Two repairs land here, in that order of importance:
 *
 *   1. **Normalise, then build the lattice.** Every read of a pinning file now goes through
 *      {@link unanchor}, which rewrites the anchored head back to the bare head. The normalised
 *      base is byte-identical in both worlds (Theseus drove it: `e76abf1a382b5a0c` and
 *      `8a8c612ab2f28d32`, pre and post), so the edit stays one-shot, the control still reads
 *      `All 15`, and the transform is idempotent by construction — a second strip finds nothing
 *      left to strip. Arm A3 grades the invariant; A4 MEASURES which world the tree is in, because
 *      "the normalisation was a no-op" is true pre-cure and false post-cure and an arm that
 *      asserts it would be the same one-shot defect one layer up.
 *   2. **No drive may fail silently.** {@link driveOrBail} routes any throw out of `drive()`
 *      through the normal verdict path as a FAILing arm, so the file cannot again exit non-zero
 *      with nothing to read. Being DEFERRED, nothing in CI would have reported the silence.
 *
 * Theseus's Round 332 §3 also retired step 2 of that repair as optional: with step 1 in place the
 * normalised base is the bare tree in both worlds, so A2's remembered `All 15` still holds and
 * comparing against a live run is a strictly better arm rather than a necessary one. Not taken here.
 *
 * NOT done here, deliberately: generalising the anchor. Theseus's Round 332 §5 measured the eight
 * entries of the `BORROWED` pin table and five of them go from 1 hit to 0 under anchoring, because
 * they match MID-LINE — a false red naming an edit nobody made. The precondition is **anchor a pin
 * only if the anchored pattern still has at least one hit**: 3 of 8 are anchor-safe, exactly 1 of 8
 * needs it, and that one is already the chosen instance. The arm for that precondition is his, and
 * it belongs next to the cure.
 */
import { readFileSync, readdirSync, writeFileSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS = dirname(SELF);
const REPO = resolve(SCRIPTS, '..');
const SELF_NAME = relative(SCRIPTS, SELF);

const results: ProbeVerdict[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ arm: id, check: claim, pass: ok, kind: 'regression' });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
let meas = 0;
const measure = (id: string, line: string): void => {
  meas += 1;
  results.push({ arm: id, check: line, pass: true, kind: 'measurement' });
  console.log(`  [${id}] MEAS  ${line}`);
};

const TREE_AT_START = fingerprint(REPO, 'scripts');

// `readdirSync`, never a glob and never grep — the shared population filter of this thread.
const scriptNames = readdirSync(SCRIPTS).filter((n) => /\.(mts|mjs)$/.test(n) && !n.startsWith('.')).sort();
const nameOfRound = (n: number): string | undefined => scriptNames.find((x) => x.startsWith(`probe-round${n}-`));
const raw = (n: string): string => readFileSync(join(SCRIPTS, n), 'utf8');

/**
 * The subject, read out of the live source rather than hand-typed. Both pinning files carry the
 * SAME bytes for this pin (that identity is round328's B-arm finding, restated here as a known
 * positive): the escaped-slash spelling appears only inside the pin entry, never in the
 * `handRollsSummary` predicate itself, which is why the edit below can be a one-shot substring.
 */
const PIN_HEAD = '/\\/checks passed\\/\\.test\\(src\\)';
const ANCHORED_HEAD = '/^\\s*\\/checks passed\\/\\.test\\(src\\)';
const BARE_BODY = '\\/checks passed\\/\\.test\\(src\\) && !\\/summariseAndExit\\\\\\(\\/\\.test\\(src\\)';

/**
 * Round 333 step 1. Rewrite the ANCHORED spelling of the pin head back to the BARE spelling, so
 * every lattice below is built from one base regardless of whether the cure has landed. Pre-cure
 * this is a no-op on both pinning files; post-cure it un-anchors them and lands on the same bytes.
 * Idempotent for free: after one pass no anchored head remains for a second pass to find.
 */
const unanchor = (text: string): string => text.split(ANCHORED_HEAD).join(PIN_HEAD);

/** The normalised base of a pinning file: what every variant below is an edit to. */
const base = (n: string): string => unanchor(raw(n));

const r322 = nameOfRound(322);
const r324 = nameOfRound(324);
const r325 = nameOfRound(325);

console.log('\n── A. the instrument: his file, unmodified, over a tree this probe owns ──');

const SANDBOX = join(REPO, '.testdata', 'r331-sandbox');
rmSync(SANDBOX, { recursive: true, force: true });
mkdirSync(SANDBOX, { recursive: true });
cpSync(SCRIPTS, join(SANDBOX, 'scripts'), { recursive: true });

const sandScripts = join(SANDBOX, 'scripts');
const sandNames = readdirSync(sandScripts).filter((n) => /\.(mts|mjs)$/.test(n) && !n.startsWith('.')).sort();
const copyFaithful = sandNames.length === scriptNames.length
  && sandNames.every((n, i) => n === scriptNames[i])
  && r324 !== undefined && r325 !== undefined
  && readFileSync(join(sandScripts, r324), 'utf8') === raw(r324)
  && readFileSync(join(sandScripts, r325), 'utf8') === raw(r325);

/** Occurrences counted before any write — a variant that cannot be applied exactly once is not a variant. */
const occurrences = (text: string, needle: string): number => text.split(needle).length - 1;
// Counted on the NORMALISED base, not on `raw`. Counting on `raw` is what made this file one-shot:
// post-cure the raw text carries the anchored head, the bare head occurs zero times, and the
// variant that "cannot be applied exactly once" is the variant this file exists to apply.
const liveOccur = r324 === undefined || r325 === undefined ? [-1, -1]
  : [occurrences(base(r324), PIN_HEAD), occurrences(base(r325), PIN_HEAD)];

check('A1', 'THE EDIT IS A ONE-SHOT SUBSTRING IN BOTH PINNING FILES, asserted before anything is '
  + 'written and asserted of the NORMALISED base so it holds whether or not the cure has landed: the '
  + 'escaped-slash spelling of the handRollsSummary pin occurs exactly once per file, so anchoring it '
  + 'cannot silently hit a second site — and the sandbox is a faithful copy of scripts/ by name list '
  + 'and by the bytes of both files about to be edited',
  liveOccur[0] === 1 && liveOccur[1] === 1 && copyFaithful,
  `occurrences of the pin head in the normalised base: r324 ${liveOccur[0]}, r325 ${liveOccur[1]} `
    + `(each must be 1) · sandbox ${sandNames.length} of ${scriptNames.length} script files, `
    + `edited-file bytes identical: ${copyFaithful}`);

const anchoredOccur = r324 === undefined || r325 === undefined ? [-1, -1]
  : [occurrences(raw(r324), ANCHORED_HEAD), occurrences(raw(r325), ANCHORED_HEAD)];
const normIsNoOp = r324 !== undefined && r325 !== undefined
  && base(r324) === raw(r324) && base(r325) === raw(r325);
const idempotent = r324 !== undefined && r325 !== undefined
  && unanchor(base(r324)) === base(r324) && unanchor(base(r325)) === base(r325);
const noAnchorSurvives = liveOccur[0] === 1 && liveOccur[1] === 1
  && r324 !== undefined && r325 !== undefined
  && occurrences(base(r324), ANCHORED_HEAD) === 0 && occurrences(base(r325), ANCHORED_HEAD) === 0;

check('A3', 'AND THE NORMALISER HOLDS ITS INVARIANT IN BOTH WORLDS, which is the property that makes '
  + 'A1 safe under the cure rather than one-shot like its predecessor: normalising leaves no anchored '
  + 'spelling behind and is idempotent, so the base is the bare tree whether the cure has landed or '
  + 'not. Deliberately NOT asserted: that normalisation was a no-op. That is true pre-cure and false '
  + 'post-cure, and an arm claiming it would be exactly the defect Round 331 §6 found here',
  idempotent && noAnchorSurvives,
  `idempotent: ${idempotent} · anchored heads surviving normalisation: `
    + `r324 ${r324 === undefined ? -1 : occurrences(base(r324), ANCHORED_HEAD)}, `
    + `r325 ${r325 === undefined ? -1 : occurrences(base(r325), ANCHORED_HEAD)} (each must be 0)`);

// Three-way, not two-way. Driven in Round 333 against a scratch tree carrying a THIRD pin spelling
// (matched by neither constant): the two-way version of this line read "PRE-cure" there, which is
// false in a way an unattended reader would believe. A reading that cannot say "neither" will say
// the wrong one of two.
const world = !normIsNoOp ? 'POST-cure (the anchor cure is landed, and this run normalises past it)'
  : liveOccur[0] === 1 && liveOccur[1] === 1 ? 'PRE-cure (the anchor cure is not landed)'
  : 'NEITHER — the pin carries a spelling this file does not know, which is what A0 and A1 are for';

measure('A4', `which world the live tree is in, REPORTED and not graded: anchored head occurrences `
  + `r324 ${anchoredOccur[0]}, r325 ${anchoredOccur[1]} · bare head in the normalised base r324 `
  + `${liveOccur[0]}, r325 ${liveOccur[1]} · normalisation a no-op: ${normIsNoOp} · so the tree is ${world}`);

type Run = { passed: boolean; total: number; failedCount: number; fails: string[]; status: number | null };

const drive = (label: string, edits: string[]): Run => {
  // Restore every copy to the NORMALISED base, then apply only this variant's edits. Restoring to
  // `raw` is the other half of the Round 331 §6 defect: post-cure the "pristine" state would carry
  // the anchored head, so variant 0 would not be the uncured control it is named for and the
  // anchoring edit below would find nothing to change.
  for (const f of [r324, r325]) {
    if (f !== undefined) writeFileSync(join(sandScripts, f), base(f), 'utf8');
  }
  for (const f of edits) {
    const at = join(sandScripts, f);
    const before = readFileSync(at, 'utf8');
    const after = before.split(PIN_HEAD).join(ANCHORED_HEAD);
    if (after === before) throw new Error(`variant ${label}: edit to ${f} changed nothing`);
    writeFileSync(at, after, 'utf8');
  }
  const target = sandNames.find((n) => n.startsWith('probe-round328-'));
  if (target === undefined) throw new Error('probe-round328 missing from the sandbox');
  const r = spawnSync('npx', ['tsx', join(sandScripts, target)], {
    cwd: SANDBOX, encoding: 'utf8', timeout: 180_000,
  });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const all = out.match(/All (\d+) regression checks passed/);
  // The failing shape is `N of M regression check(s) FAILED.` — the lib's wording, copied out of a
  // real failing run rather than guessed. The first version of this line read `(\d+) of (\d+) FAILED`
  // and matched nothing, so both counts came back 0 while the FAIL SETS were already correct: a
  // source-scanning regex fails by returning a smaller number, and the only reason it was caught is
  // that the arms below pin the count AND the set AND their mutual consistency.
  const some = out.match(/(\d+) of (\d+) regression check\(s\) FAILED/);
  const fails = [...out.matchAll(/\[([A-Z]\d)\] FAIL/g)].map((m) => m[1] ?? '').sort();
  return {
    passed: all !== null,
    total: Number(all?.[1] ?? some?.[2] ?? 0),
    failedCount: Number(some?.[1] ?? 0),
    fails,
    status: r.status,
  };
};

/**
 * Round 333 step 2. `drive()` throws on any state it cannot drive, and until this fire that throw
 * escaped the module: no verdict line, nine arms unreported, exit 1 — which Theseus's Round 332 §2
 * drove in a scratch repo. Exit 1 with no summary line is not a measurement, for the same reason
 * `exit 0` with no summary line is not one. Route it through the verdict path instead.
 */
const driveOrBail = (label: string, edits: string[]): Run => {
  try {
    return drive(label, edits);
  } catch (e) {
    check('A0', 'EVERY VARIANT DRIVE COMPLETED — reported through the verdict line rather than as an '
      + 'unhandled throw. A drive that cannot be applied is a finding about this file\'s pins, and a '
      + 'finding has to be readable: before Round 333 this exited 1 with no summary line at all',
      false, `variant ${label} could not be driven: ${e instanceof Error ? e.message : String(e)}`);
    console.log(`\n${meas} measurements`);
    summariseAndExit({ probeName: 'probe-round329', results });
  }
};

const v0 = driveOrBail('0', []);
const vA = driveOrBail('A', r325 === undefined ? [] : [r325]);
const vC = driveOrBail('C', r324 === undefined || r325 === undefined ? [] : [r324, r325]);

check('A2', 'THE CONTROL: the sandbox reproduces the in-repo verdict of probe-round328 unmodified — '
  + 'all regression checks green, exit 0. A variant figure measured in a sandbox that cannot '
  + 'reproduce the unmodified verdict is measuring the sandbox',
  v0.passed && v0.failedCount === 0 && v0.status === 0 && v0.total > 0,
  `variant 0: ${v0.passed ? `All ${v0.total} regression checks passed` : `${v0.failedCount} of ${v0.total} FAILED`}`
    + ` · exit ${v0.status} · FAIL set [${v0.fails.join(' ') || 'none'}]`);

console.log('\n── B. THE COST, mechanised: Round 329 §4, as corrected by his Round 330 repair ──');

const A_SET = ['B1', 'C1'];
const C_SET = ['A2', 'B3', 'C1', 'C3'];
const same = (a: string[], b: string[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);

check('B1', 'MY HALF ALONE COSTS HIS FILE EXACTLY TWO REGRESSION ARMS, and they are B1 and C1: '
  + 'anchoring probe-round325\'s pin leaves probe-round324\'s still colliding, so the collision-shaped '
  + 'arms survive and only the two that read the FIGURES go red. This is Round 329 §4\'s first number, '
  + 'reproduced from this seat by Theseus in Round 330 and now held by an arm instead of a memo',
  vA.failedCount === 2 && same(vA.fails, A_SET)
  && vA.total === v0.total && vA.failedCount === vA.fails.length,
  `variant A: ${vA.failedCount} of ${vA.total} FAILED · FAIL set [${vA.fails.join(' ')}] vs expected [${A_SET.join(' ')}]`
    + ` · exit ${vA.status} · parser consistent: count ${vA.failedCount} = set size ${vA.fails.length}, `
    + `total ${vA.total} = control total ${v0.total}`);

check('B2', 'AND BOTH HALVES TOGETHER COST FOUR, NOT SIX — the 6 was right about his file in Round 329 '
  + 'and two of the six were his own bug. C4 and C5 priced the cure and self-invalidated under it; his '
  + 'Round 330 re-based them onto the pin\'s BARE body, which resolves in both states, and they left '
  + 'the list. The four that remain are retirement notices: their subject IS the collision, so they '
  + 'red because the finding is CURED, which is a different thing from being wrong',
  vC.failedCount === 4 && same(vC.fails, C_SET)
  && vC.total === v0.total && vC.failedCount === vC.fails.length,
  `variant C: ${vC.failedCount} of ${vC.total} FAILED · FAIL set [${vC.fails.join(' ')}] vs expected `
    + `[${C_SET.join(' ')}] · exit ${vC.status} · parser consistent: count ${vC.failedCount} = set size `
    + `${vC.fails.length}, total ${vC.total} = control total ${v0.total} · Round 329 drove 6 of 14 `
    + `pre-repair, Round 330 drove 4 of 15 post-repair`);

check('B3', 'AND THE VARIANTS ARE NOT ORDERED BY SEVERITY, which is the detail a reimplementation '
  + 'would have smoothed away: B1 fails under my half alone and RECOVERS under both halves, because '
  + 'its claim is about which key reproduces four published figures and the second edit moves those '
  + 'figures back into agreement. More cure is not monotonically more red',
  vA.fails.includes('B1') && !vC.fails.includes('B1') && vC.failedCount > vA.failedCount,
  `B1: FAIL under variant A, ${vC.fails.includes('B1') ? 'FAIL' : 'PASS'} under variant C · totals `
    + `${vA.failedCount} → ${vC.failedCount}`);

console.log('\n── C. THE MECHANISM, named correctly on the third attempt ──');

/**
 * The two selectors, as pure functions of (pin body, target text). The pre-Round-330 arms used the
 * first; his repair uses the second. The subject is a single pin, so the population is read by hand
 * and the arm grades the hand reading: the bare body must match exactly two lines of probe-round322
 * (the live collision), and the anchored body exactly one.
 */
const linesOfText = (t: string): string[] => t.split('\n');
const hitsIn = (body: string, text: string): number[] => {
  let rx: RegExp;
  try { rx = new RegExp(body); } catch { return []; }
  return linesOfText(text).map((l, i): [number, string] => [i + 1, l])
    .filter(([, l]) => rx.test(l)).map(([i]) => i);
};
const t322 = r322 === undefined ? '' : raw(r322);
const bareHits = hitsIn(BARE_BODY, t322);
const anchoredBody = `^\\s*${BARE_BODY}`;
const anchoredHits = hitsIn(anchoredBody, t322);

// The pre-Round-330 selector: the first edge with more than one hit. The post-repair selector:
// strip any leading `^\s*` and ask whether the BARE body is non-unique.
const bare = (s: string): string => s.replace(/^\^\\s\*/, '');
const byCollision = (body: string): string | undefined =>
  hitsIn(body, t322).length > 1 ? body : undefined;
const byBare = (body: string): string | undefined =>
  hitsIn(bare(body), t322).length > 1 ? body : undefined;

check('C1', 'THE ONE-SHOT MECHANISM IS A VANISHED SUBJECT, NOT A DOUBLE ANCHOR: the pricing arms\' '
  + 'subject was `underCounted[0]` — the first edge matching more than one line — and the cure\'s '
  + 'whole point is that the pin stops matching two lines. So THE CURE DELETES THE EDGE ITS OWN '
  + 'PRICING ARMS INDEX INTO: the collision selector resolves before the cure and is `undefined` '
  + 'after it, while the bare-body selector his Round 330 installed resolves in BOTH states. Driven '
  + 'over both spellings of one pin, with the hand reading graded: 2 hits bare, 1 anchored',
  bareHits.length === 2 && anchoredHits.length === 1
  && byCollision(BARE_BODY) !== undefined && byCollision(anchoredBody) === undefined
  && byBare(BARE_BODY) !== undefined && byBare(anchoredBody) !== undefined,
  `bare body hits [${bareHits.join(',')}] · anchored hits [${anchoredHits.join(',')}] · `
    + `collision selector: bare=${byCollision(BARE_BODY) !== undefined} cured=${byCollision(anchoredBody) !== undefined}`
    + ` (the deletion) · bare selector: bare=${byBare(BARE_BODY) !== undefined} cured=${byBare(anchoredBody) !== undefined}`
    + ` (survives its own cure)`);

/**
 * C2 is this fire's correction to BOTH seats, and it is the arm that would have caught Round 329 §5
 * before it was written. Three spellings, three driven pairs of (no flag, with `m`) against the
 * whole target file:
 *
 *   correct anchor   `^\s*BODY`        → (false, true)   the healthy trap C5 exists to warn about
 *   double anchor    `^\s*^\s*BODY`    → (false, true)   IDENTICAL — `\s*` matches empty, so the
 *                                                        second `^` is satisfiable at position 0
 *   vanished subject (no body at all)  → (true,  false)  the `=== undefined` fallbacks
 *
 * Round 329 §5 said the double anchor "matches nothing". Round 330 §3 said it "would have produced
 * `false` then `false`, because a pattern matching nothing matches nothing with or without `m`".
 * Both are wrong about the same regex, in the same direction: it matches exactly what the single
 * anchor matches. The conclusion survives and gets stronger — a double anchor could not have
 * reddened C5, because it is indistinguishable from the cure — and the `true · false` pair Round
 * 329 PUBLISHED is reachable only from a vanished subject.
 */
const pairOf = (body: string | undefined): [boolean, boolean] => body === undefined
  ? [true, false]
  : [new RegExp(body).test(t322), new RegExp(body, 'm').test(t322)];
const pCorrect = pairOf(anchoredBody);
const pDouble = pairOf(`^\\s*${anchoredBody}`);
const pVanished = pairOf(undefined);
const PUBLISHED_329: [boolean, boolean] = [true, false];
const eq = (a: [boolean, boolean], b: [boolean, boolean]): boolean => a[0] === b[0] && a[1] === b[1];

check('C2', 'AND THE DOUBLE ANCHOR WOULD HAVE BEEN HARMLESS, which corrects both seats: `^\\s*^\\s*X` '
  + 'is not a pattern that matches nothing — `\\s*` can match the empty string, so the second `^` is '
  + 'satisfiable at position 0 and the pattern is EQUIVALENT to `^\\s*X`. Round 329 §5 said it matches '
  + 'nothing; Round 330 §3 said it would read (false, false). Driven, it reads exactly what the '
  + 'correct anchor reads, so it could not have reddened C5 at all — and the (true, false) pair Round '
  + '329 published is reachable ONLY from the vanished-subject fallbacks. The discriminator holds and '
  + 'the reason given for it does not',
  eq(pDouble, pCorrect) && !eq(pDouble, pVanished) && eq(pVanished, PUBLISHED_329)
  && pCorrect[0] === false && pCorrect[1] === true,
  `correct anchor (${pCorrect.join(', ')}) · double anchor (${pDouble.join(', ')}) — identical: `
    + `${eq(pDouble, pCorrect)} · vanished subject (${pVanished.join(', ')}) · Round 329 published `
    + `(${PUBLISHED_329.join(', ')}), which matches the vanished-subject pair: ${eq(pVanished, PUBLISHED_329)}`);

measure('C3', `the retraction, recorded where the claim is rather than only in a memo: Round 329 §5 `
  + `named a mechanism that does not fire (the double anchor is never constructed — C1) and gave it a `
  + `property it does not have (matching nothing — C2). Round 330 falsified the first and restated the `
  + `second in the same wrong direction. What survives from §5 is the SHAPE of the defect, which both `
  + `seats had right: an arm that recommends an action and reds when the action is taken is one-shot, `
  + `and the cure is to define its subject by a property the cure does not change`);

console.log('\n── Z. this probe\'s own containment ──');

const TREE_AT_END = fingerprint(REPO, 'scripts');
const windowNow = windowState(REPO, 'scripts');
const windowEntries = windowNow === '' ? 0 : windowNow.split('\n').length;
const sandboxInsideTestdata = relative(REPO, SANDBOX).startsWith('.testdata');
const gitignored = readFileSync(join(REPO, '.gitignore'), 'utf8').split('\n').some((l) => l.trim() === '.testdata/');
check('Z1', 'this probe wrote nothing under scripts/: the three variants are applied to a COPY in a '
  + 'gitignored sandbox, never to tracked source, and the scripts/ fingerprint is byte-identical '
  + 'before and after. The two earlier drivers of these figures edited the live tree and restored it '
  + 'in a `finally`, which is right for a one-off and wrong for a file that runs unattended',
  TREE_AT_END === TREE_AT_START && sandboxInsideTestdata && gitignored,
  // Theseus's Round 332 §7: the old detail line printed `TREE_AT_START.slice(0, 14)`, which on a
  // clean window is `P:` + the first 12 hex of sha256("") — a constant, so the printed evidence
  // could not distinguish "fingerprinted scripts/ and it did not move" from "fingerprinted
  // nothing." The check was always sound; the EVIDENCE was not diagnostic. Print both halves, the
  // component count, and the porcelain entry count, which is free. The window state is REPORTED
  // and never graded: this seat is not its only writer.
  `fingerprint ${TREE_AT_START} → ${TREE_AT_END} · equal: ${TREE_AT_END === TREE_AT_START} · `
    + `components ${TREE_AT_START.split(' ').length} · porcelain entries under scripts/: ${windowEntries}`
    + ` · sandbox at ${relative(REPO, SANDBOX)} · .testdata/ gitignored: ${gitignored}`);

check('Z2', 'and this file delegates its exit code, so it is outside the arm-G hand-rolled-summary '
  + 'backlog this thread\'s other instruments measure — by behaviour rather than by name',
  /summariseAndExit\s*\(/.test(raw(SELF_NAME)),
  `${SELF_NAME.slice(0, 40)}…: delegates=${/summariseAndExit\s*\(/.test(raw(SELF_NAME))}`);

console.log(`\n${meas} measurements`);
summariseAndExit({ probeName: 'probe-round329', results });
