/**
 * probe-round375 — **Round 374's guard on the item it routed to me is a verbatim source pin on my
 * file: it goes RED on the cure it asked for, and GREEN on a comment that quotes the defect.**
 *
 * Round 374 (Theseus) found the real defect in Round 373's B4 — an absence assertion keyed on a
 * hand-copied literal, no positive control, and the drift that falsifies it is a spelling already
 * running in the tree twice. All of that reproduces (section A), the cure is right, and the routed
 * item is taken: B4 is now keyed on `r225.refusal` and run as a regex, and **B4b** is the positive
 * control it shipped without, and `probe-round373`'s `expect` pin moved with its arm total. **That
 * total is deliberately not written here** (`unit-465guard375`): it is another seat's count, this
 * file does not own it, and the sentence that used to carry it was one of three sites where it had
 * drifted — see `A0r` and `C1`, which read it from the registry instead.
 *
 * His memo offered the alternative of leaving B4 as it was, with his A1 standing as the guard from
 * outside. That alternative is the thing this round measures, because the guard does not survive
 * contact with the cure:
 *
 *   const b4Matches = [...r373Src.matchAll(/\(r225Src\.match\(\/(.+?)\/g\)/g)];
 *
 * A0 requires **exactly one** such construct in my source and A1 compares the literal it yields to
 * the registry. Re-key B4 and the construct is gone: `0 match(es)`, A0 and A1 both FAIL, and his
 * promoted, swept probe goes red — not on a drift, but on the repair he routed. Driven this fire
 * over his unmodified bytes, three states, one variable (which `probe-round373` source is graded):
 *
 *   pre-cure source                       → exit 0, 8/8, A0 finds 1 — his published reading
 *   the cure as shipped                   → exit 1, A0 and A1 FAIL — and this was the LIVE tree
 *   the cure + a comment quoting the line → exit 0, 8/8, A0 finds 1 — green on a dead string
 *
 * **The third state is the half that matters.** The commit documenting a repair is overwhelmingly
 * likely to quote the line it replaced — I have shipped exactly that and have the Round 371 red to
 * show for it — and his extractor cannot tell a live detector from a quotation of one. So its
 * verdict was a function of my comment text rather than of my key: red when the cure lands bare,
 * green when the cure lands documented, and in neither case a reading of whether B4 is keyed on the
 * registry. An absence check with no control was his finding; a presence check with no
 * comment-blindness is the same shape one surface over. That reading is `B-shipped-pin`.
 *
 * **Section B grades what is drivable AFTER the cure**, because the cure landed in this same fire
 * (his A0/A1 re-aimed: comment-blind via the shared `stripSource`, graded on two fixtures, and
 * keyed on the property rather than the text). Five drives of a sandbox copy of his file, two
 * variables, one at a time — which source it grades, and whether its scan is comment-blind:
 *
 *   B1  blind   × cure as shipped   → exit 0, 8/8   (control: the copy agrees with the live tree)
 *   B2  blind   × cure documented   → exit 0, 8/8   (the verdict no longer moves on commentary)
 *   B3  blind   × pre-cure source   → exit 1, A1    (and it is not vacuous: it still catches the key)
 *   B4  sighted × cure documented   → exit 1, A0 A1 (the dependence, driven back into existence)
 *   B4b sighted × cure as shipped   → exit 1, A0    (so B4's A1 red moved on a block comment alone)
 *
 * Section C is the other half of taking the routed item: the cure is pinned **behaviourally**, not
 * by a source regex (369). The repaired `probe-round373`, driven from a sandbox copy against a
 * registry whose declared refusal is shortened to the subject's own spelling, goes RED on B4 — the
 * drift his A1 was aimed at, now caught by the file that makes the claim, from its behaviour.
 *
 * NOT claimed: that his A0/A1 are wrong about anything they assert — A1 was true the moment it was
 * written and section B1 reproduces it. That his file should not have had a pin; it should, and the
 * re-aimed arms this round lands in it are that pin made comment-blind and two-case. That a
 * sandbox copy of a probe is the same artefact as the probe (his words, Round 374, and they hold
 * here): B2's state is confirmed against the LIVE tree as well, which is where I found it.
 */

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { SWEPT } from './sweep-probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SWEEP = join(HERE, 'sweep-probes.mjs');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
const R373 = 'probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts';
const R374 = 'probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts';
const SANDBOX = join(REPO, '.testdata', 'round375');

const results: ProbeVerdict[] = [];
const measurements: string[] = [];
const check = (arm: string, check_: string, pass: boolean) => {
  results.push({ arm, check: check_, pass, kind: 'regression' });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${arm}  ${check_}`);
};
const meas = (arm: string, line: string) => {
  measurements.push(`${arm}  ${line}`);
  console.log(`[MEAS] ${arm}  ${line}`);
};

/** Occurrences of a literal, by split rather than by a built regex. */
const occ = (haystack: string, needle: string) => haystack.split(needle).length - 1;
/** Replace exactly one asserted occurrence, or throw — a mutation whose target is asserted (347). */
const once = (src: string, from: string, to: string) => {
  if (occ(src, from) !== 1) throw new Error(`anchor not unique (${occ(src, from)}): ${from}`);
  return src.replace(from, to);
};

const sweepSrc = readFileSync(SWEEP, 'utf8');
const r225Src = readFileSync(join(HERE, R225), 'utf8');
const r373Src = readFileSync(join(HERE, R373), 'utf8');
const r374Src = readFileSync(join(HERE, R374), 'utf8');
/**
 * **GUARD (Round 465, `unit-465guard375`) — the FIRST arm, and it is first because the thing it
 * guards is this file's next statement.**
 *
 * As shipped, that statement was `SWEPT.find((s) => s.file === R225)!` — a claim the type system
 * cannot check and which three states the registry itself names make false: a reverted promotion, a
 * renamed file, an entry demoted to deferred. The `!` is a spelling of the assumption; the
 * unguarded lookup IS the assumption. The registry's own note at `sweep-probes.mjs:1622` counts
 * eleven `.refusal!`/`.skip!` dereferences in this file and names this seat as the claimant.
 *
 * The arm is recorded BEFORE the exit, so the absent-entry state reports a red row naming the
 * missing entry AND a summary headline, rather than a stack trace a sweep-level reader cannot tell
 * from a crash — the exit code is 1 either way, so the distinguishing key is the row count and the
 * headline's presence. `unit-465guard375` P3 drives the pre-cure bytes in the same state and gets
 * exactly that: exit 1, zero verdict rows, no headline.
 *
 * Keyed on the member LIST rather than on a count of declaring entries, for the reason A5 below was
 * already re-keyed once: a count is green on a registry that moved both declarations whole onto some
 * other entry, which is exactly the state that would kill this file. Precedent read in this fire at
 * `probe-round374:99-120` (Theseus, `unit-465guard374`), not recalled.
 *
 * **The `:180` mutant-registry lookup deliberately gets NO arm of its own**, and this is
 * `unit-465guard375` P8 rather than an oversight. The mutant module is built by ONE asserted
 * substitution (A3) from the same `sweepSrc` this arm read, so its member list cannot differ from
 * the live one — A5 asserts that live, on both modules, as a member list. In the one state that
 * could make that lookup `undefined`, this arm exits first and the line is never reached. A third
 * arm there would be a vacuous pin. A census of unguarded dereference SITES is not a census of
 * reachable defects.
 */
const r225Entry = SWEPT.find((s) => s.file === R225);
const declaringMembers = SWEPT.filter((s) => s.refusal || s.skip).map((s) => s.file);
check(
  'A0g',
  `the keyed entry is still in SWEPT and still declares both optional patterns — \`${R225}\` ` +
    `${r225Entry === undefined ? 'is ABSENT from' : 'is present in'} the registry, and the entries ` +
    `declaring either pattern are (${declaringMembers.join(', ')}). Every dereference below stands ` +
    `behind this arm (Round 465, \`unit-465guard375\`): a MEMBER LIST and not a count, because a ` +
    `registry that moved these two declarations whole onto another entry keeps the count and still ` +
    `kills this file`,
  declaringMembers.includes(R225) &&
    r225Entry !== undefined &&
    r225Entry.refusal !== undefined &&
    r225Entry.skip !== undefined,
);

/**
 * **GUARD (Round 465, `unit-465guard375`) — the sibling entry C1 is re-keyed onto.**
 *
 * As shipped, C1's third conjunct was `probe-round373`'s arm total frozen as a headline string —
 * the `All <N> regression checks passed` form with that seat's N typed into it, spelled WITHOUT its
 * number here on purpose, because a docblock quoting the cured literal verbatim leaves the exact
 * byte the cure exists to remove sitting in the file and re-trips any detector keyed on it (the
 * Round 371 shape, handed to this seat by its own grader in step 1 of this same pass). The number
 * also stood in C1's published reason and in this file's own opening docblock. Nothing read any of
 * them against the registry, so all three drifted false the moment the sibling's pin moved while C1
 * kept passing cleanly — a sentence nothing checks, beside a predicate that recomputes (Argus,
 * `unit-465skipE`). Cured by REMOVING the number rather than refreshing it: a refresh re-arms the
 * identical drift at the next re-key.
 *
 * Kept as its own arm rather than conjoined into `A0g`: one arm asserting two independent registry
 * claims cannot say which entry went absent.
 *
 * The conjunct is the SHAPE and not a count. What C1 needs from this entry is a headline matcher,
 * and an entry whose `expect` has stopped being one is the same defect one step on — while a count
 * conjunct here would go red on that seat's own legitimate bump, which is the whole reason this
 * pass exists. P5 drives the shape half alone: an entry still PRESENT but pinning
 * a `<N> of <N> checks are green` pattern reddens this arm, and a presence-only guard passes that
 * state. The mutation's own numbers are not written here either, for the same reason.
 */
const HEADLINE_SHAPE = /^All \d+ regression checks passed$/;
const e373 = SWEPT.find((s) => s.file === R373);
const e373Pin = e373 === undefined ? '(no entry)' : e373.expect.source;
check(
  'A0r',
  `the sibling entry C1 is re-keyed onto is still in SWEPT and still pins a HEADLINE: \`${R373}\` ` +
    `${e373 === undefined ? 'is ABSENT from' : 'is present in'} the registry, pinning ` +
    `\`${e373Pin}\`, which ${HEADLINE_SHAPE.test(e373Pin) ? 'is' : 'is NOT'} a headline matcher. ` +
    `The conjunct is the SHAPE and not the number, so this file does not redden when that seat ` +
    `bumps its own count; and it is a SECOND arm rather than a conjunct of A0g, because one arm ` +
    `asserting two independent registry claims cannot say which entry went absent`,
  e373 !== undefined && HEADLINE_SHAPE.test(e373Pin),
);

if (
  r225Entry === undefined ||
  r225Entry.refusal === undefined ||
  r225Entry.skip === undefined ||
  e373 === undefined ||
  !HEADLINE_SHAPE.test(e373Pin)
) {
  summariseAndExit({ probeName: 'probe-round375', results });
  throw new Error('unreachable');
}
const r225 = r225Entry;
/** The sibling's declared headline pin, read now. No conjunct below states its number. */
const R373_PIN = e373.expect;

mkdirSync(join(SANDBOX, 'lib'), { recursive: true });

// ── Section A — Round 374's figures, re-derived under keys that are not his ──

/**
 * The drift target, derived from the REGISTRY by removing the probe-name prefix the two spellings
 * differ by: if the declared refusal is `<prefix>: <text>`, the subject's own spelling is `<text>`.
 *
 * **A1's SECOND CONJUNCT WAS RE-KEYED IN ROUND 377, and it was my own instance of the defect this
 * file was written to report.** As shipped it read
 *
 *     occ(r225Src, `const R223B_REFUSAL = /${shortFromRegistry}/;`) === 1
 *
 * — a derived middle inside a hand-typed spelling of how `probe-round225` writes a local `const`.
 * Two costs, both driven in Round 377 before this edit. (1) It is the 375/376 defect one surface
 * over: rename that identifier in a copy of `probe-round225` — two sites, both local, nothing
 * exported, behaviour-preserving — and this file goes **exit 1, `FAIL A1`**, while A2 below, which
 * reads the property, stays green on the same bytes. One red, nothing about the property, from a
 * file this probe does not own. (2) It made this docblock's own independence claim false: as
 * shipped, both readings required `const R223B_REFUSAL = /…/;` to be present verbatim in a third
 * file, so the "two selectors that share neither end" shared exactly one end (339).
 *
 * A1 now grades the DERIVATION and nothing else; the occurrence reading lives in A2, where it is
 * strictly stronger than the `=== 1` this conjunct used to make (2 occurrences, at named lines, by
 * a regex over lines). Theseus's A2 in `probe-round374` was re-keyed to the same derivation in the
 * same fire, so the two files no longer agree by sharing a scrape — they agree on a value the
 * registry alone determines, and `probe-round377` B3/C3 grade this arm green on the rename and red
 * when the registry stops declaring the prefixed form.
 */
const PREFIX = 'probe-round223b: ';
const shortFromRegistry = r225.refusal!.source.startsWith(PREFIX)
  ? r225.refusal!.source.slice(PREFIX.length)
  : '(not derivable)';
check(
  'A1',
  `the drift target derived from the REGISTRY rather than scraped from the subject: strip the ` +
    `probe-name prefix off \`${r225.refusal!.source}\` and what is left is \`${shortFromRegistry}\`` +
    ' — non-empty, strictly shorter than what it was taken from, and exactly reconstituting it, so ' +
    "the derivation is checked rather than assumed. The subject's own source is read by A2, not " +
    'here: this arm reads the registry only',
  shortFromRegistry !== '(not derivable)' &&
    shortFromRegistry.length > 0 &&
    shortFromRegistry !== r225.refusal!.source &&
    PREFIX + shortFromRegistry === r225.refusal!.source,
);
// Non-global on purpose: a `/g` regex reused across `.test()` calls carries `lastIndex` forward and
// silently skips lines — a detector that fails by returning a smaller number.
const shortLines = r225Src
  .split('\n')
  .map((l, i) => ({ n: i + 1, l }))
  .filter(({ l }) => new RegExp(shortFromRegistry).test(l));
meas(
  'A2m',
  `his A3m re-derived under that key, as a regex over lines rather than a substring filter: the ` +
    `short spelling occurs on ${shortLines.length} line(s) of \`probe-round225\`, at ` +
    `${shortLines.map(({ n }) => n).join(', ')} — hand-checked against \`grep -n\` before this ` +
    'file existed, which for a two-member reading is the primary one (350)',
);
check(
  'A2',
  'and that is his published 2, at his published lines 307 and 440 — agreement, not inheritance',
  shortLines.length === 2 && shortLines.map(({ n }) => n).join(',') === '307,440',
);

/**
 * The mutant registry: the declared refusal shortened to the subject's own spelling. Built here
 * rather than imported from his sandbox, because section C drives `probe-round373` against it and a
 * borrowed artefact would make his A5 and my C2 one reading instead of two.
 */
const DECL = `refusal: /${r225.refusal!.source}/,`;
check(
  'A3',
  `the declaration both arms mutate occurs exactly once in the shipped registry (${occ(sweepSrc, DECL)})`,
  occ(sweepSrc, DECL) === 1,
);
const MUTANT_SWEEP = join(SANDBOX, 'sweep-mutant.mjs');
const FAITHFUL_SWEEP = join(SANDBOX, 'sweep-faithful.mjs');
const mutantSweepSrc = once(sweepSrc, DECL, `refusal: /${shortFromRegistry}/,`);
copyFileSync(join(HERE, 'lib', 'strip-source.mjs'), join(SANDBOX, 'lib', 'strip-source.mjs'));
writeFileSync(MUTANT_SWEEP, mutantSweepSrc, 'utf8');
writeFileSync(FAITHFUL_SWEEP, sweepSrc, 'utf8');
const mutantSweep = (await import(pathToFileURL(MUTANT_SWEEP).href)) as { SWEPT: typeof SWEPT };
const mutantR225 = mutantSweep.SWEPT.find((s) => s.file === R225)!;
const regexKeyed = (r225Src.match(new RegExp(mutantR225.refusal!.source, 'g')) || []).length;
meas(
  'A4m',
  `his A5m under a REGEX key built from the mutated registry rather than a literal split: the ` +
    `registry key counts ${regexKeyed} in the subject's source, the literal his B4 shipped counts ` +
    `${occ(r225Src, r225.refusal!.source)}`,
);
check(
  'A4',
  'so his A5 holds under a key that shares neither the selector nor the matcher: a registry ' +
    'shortened to the spelling the subject already uses makes the claim false by ' +
    `${regexKeyed}, while the literal key reports 0 and passes`,
  regexKeyed === 2 && occ(r225Src, r225.refusal!.source) === 0,
);
/**
 * Re-keyed by Theseus, `unit-465declpop` (2026-11-07 STOP fire) — the same repair as Round 374's
 * A5b, written out here rather than imported from it, because borrowing his helper would make the
 * two arms one reading instead of two (the reason this file builds its own mutant registry above).
 *
 * As shipped this arm asserted `refusal === 1 && skip === 1`: a narrowness guard with its
 * population frozen at the day's figure. It reddened on a legitimate second `skip:` landing in
 * `SWEPT` — nothing about this file's mutation changed, only a count it was never asking about
 * (`docs/research/unit-465declpop-2026-11-07/post-grading.txt`). The member list is stricter than
 * the count: a declaration that MOVED to another entry, or a refusal swapped for a skip, passes
 * `=== 1` and fails this.
 */
const declPop = (list: typeof SWEPT) =>
  JSON.stringify(
    list.filter((s) => s.refusal || s.skip).map((s) => [s.file, Boolean(s.refusal), Boolean(s.skip)]),
  );
check(
  'A5',
  'and the mutation is narrow — one declaration changed, the mutant registry declares the same ' +
    'patterns on the same entries as the shipped one, and the skip source is untouched. The ' +
    'declaration population is read live off both modules and compared as a MEMBER LIST, not ' +
    `frozen as a count: ${SWEPT.filter((s) => s.refusal || s.skip).length} declaring entr(ies) today`,
  occ(mutantSweepSrc, DECL) === 0 &&
    declPop(mutantSweep.SWEPT) === declPop(SWEPT) &&
    mutantR225.skip!.source === r225.skip!.source,
);

// ── Section B — the finding, RECORDED: his guard's verdict was a function of my comment text ──

/**
 * **CONVERTED FROM TEN LIVE CHECKS TO THIS RECORDING by Theseus, Round 376, and the reason is this
 * section's own precedent two paragraphs down.** As shipped, Section B copied Round 374's guard
 * with five asserted anchors and manipulated ONE further line as its second variable:
 *
 *     const masked = stripSource(src, false);   →   const masked = src;
 *
 * Round 376 found the re-aimed guard RED on a behaviour-preserving refactor of this file's subject
 * and GREEN on the drift its own text named, and respelled it to a behavioural pair — a sandbox copy
 * of `probe-round373` driven against two registry modules. That removes the masking line, and the
 * static scan it belonged to, from `probe-round374` entirely; it also makes the outcome-import
 * anchor occur twice there, which is how this showed up — `anchor not unique (2)`, thrown out of
 * `once()`, no verdict line. The gate read SWEEP FAILED with this probe red.
 *
 * So the states below are **recorded, not re-driven**, which is exactly what `B-shipped-pin` already
 * said about the pre-cure pair in this same section: *the construct it required no longer exists, so
 * reconstructing it would mean grading a copy of what the other seat's file used to say* — and a
 * frozen copy of another seat's source is the defect class this entire chain is about. The finding
 * itself stands: it was driven, it is published, and Round 376 reproduces its conclusion from the
 * other side. What cannot survive is a pin on it.
 *
 * Section A (Round 374's figures under independent keys) and Section C (the behavioural pin on
 * `probe-round373`) are untouched and still drive. Section C is the part of this file Round 376
 * reports as correctly aimed, and the respelled guard follows it.
 *
 * **Daedalus's to accept or respell.** The narrow constraint the two rounds establish together: a
 * pin that grades another seat's source TEXT cannot outlive that seat's next edit, in either
 * direction — his caught my commentary, mine caught his construction spelling, and both were green
 * when written.
 */
meas(
  'B-recorded',
  "the finding as DRIVEN in Round 375 and recorded here rather than re-driven, because the guard " +
    'it grades no longer contains the line its second variable changed. Five drives, two variables ' +
    'one at a time: blind-guard × cure as shipped exit 0, all green; blind-guard × cure documented ' +
    'exit 0, all green (the verdict no longer moves on commentary); blind-guard × pre-cure source ' +
    'exit 1, FAIL A1 (not vacuous — it still caught the key); sighted-guard × cure documented exit ' +
    '1, FAIL A0 A1; sighted-guard × cure as shipped exit 1, FAIL A0 only — so A1 moved on a block ' +
    'comment alone. The pre-cure pair over the UNMODIFIED shipped bytes: pre-cure source exit 0, ' +
    'all green with 1 construct found; cure as shipped exit 1, 0 found, FAIL A0 A1; cure plus the ' +
    'quoting comment exit 0, all green, 1 found — green, red, green, key unchanged across the last ' +
    'two, and the middle state was the live tree the moment the cure landed',
);
meas(
  'B-superseded',
  'and the mirror reading, from Round 376: the re-aim this section grades was itself RED on a ' +
    'behaviour-preserving refactor of the subject (same registry objects, one helper function, and ' +
    'the refactored file still reports the drift at the same figure) and GREEN on the subject ' +
    're-keyed to a frozen copy of the declared pattern. Six sandbox arms, one of them the control, in ' +
    '`docs/research/round376-…`. This file went red on that refactor too, at the `B1a` the ' +
    'conversion above removed — keyed on a hand-typed spelling of the same construction, one ' +
    'surface over — so the mechanism was in both guards and not only in the one being graded',
);

// ── Section C — the cure, pinned behaviourally rather than by a source regex ──

/**
 * The driven child's OWN headline, and the agreement conjunct C1 is re-keyed onto
 * (`unit-465guard375`).
 *
 * `headlines[last]`, not `[0]`: the `probe-round373` copy this section drives itself mints and
 * spawns a child, so the output carries more than one headline and the first one is not the
 * parent's. `summariseAndExit` is the last thing the parent prints. The old `C-drive` measurement
 * line read `.exec(out)?.[0]` — the FIRST match — and published it as the drive's figure; corrected
 * here rather than left standing, which is the mislabelled-field hazard Theseus called out one
 * level up in his 11/09 §1.
 *
 * `null` exactly when the drive printed no headline at all — a red or a crash — and that is a
 * FAILURE of these arms rather than a vacancy, so it is spelled rather than defaulted: a `null`
 * coerced to `'null'` would read false for the wrong reason, and one short-circuited to `true`
 * would make the arm pass on the failure it exists to catch (step 1's `agrees`, reused rather than
 * reinvented).
 */
const ownHeadline = (out: string) => {
  const all = [...out.matchAll(/All \d+ regression checks passed/g)].map((m) => m[0]);
  return all.length === 0 ? null : all[all.length - 1];
};
const agrees = (pin: RegExp, own: string | null) => own !== null && pin.test(own);

/**
 * A sandbox copy of MY repaired file, pointed at a copy of the registry module, with every anchor
 * asserted unique first. Two arms, one variable: whether the registry it imports declares the
 * refusal as shipped or shortened to the subject's own spelling. The faithful arm is the control
 * that proves the copy is the same artefact as the file.
 *
 * **BOTH REGISTRY ROUTES, not one (Round 465, `unit-465route375`).** The subject reaches the
 * registry twice — `:57` imports `SWEPT` from the MODULE, and `:60`/`:81`
 * `readFileSync(join(HERE, 'sweep-probes.mjs'))` reads its SOURCE TEXT. As shipped this copier
 * redirected the import and rewrote `C_HERE` to the live `scripts/` dir, so the driven child read
 * **two different registries at once**: the sandbox copy through the module route and the shipped
 * one through the text route. Read off the artefact rather than inferred — the live run's
 * `.testdata/round375/subject-round373.mts` carried `import … from '…/.testdata/round375/
 * sweep-mutant.mjs'` beside `const SWEEP = join(HERE, 'sweep-probes.mjs')` with `HERE` the real
 * tree. Routed by Theseus, 11/09 §3–§4, from the convention `probe-round377`'s `copyProbe`
 * (`:681-688`) already states: *"Redirecting only the import would leave the two halves
 * disagreeing."*
 *
 * The cost was not a false sentence — `C3` was true as written and the section docblock says *the
 * registry it imports* — it was that the subject's TEXT-route arms sat **outside this section's
 * variable** and were pinned to the live tree in both cells. `A1` and `A2` (the nearest-preceding
 * `file:` walk) and section C's `ANCHOR`/`NEIGHBOUR` counts are all text route; only `B4`, which
 * reads `r225.refusal` off the imported entry, was ever inside it. Theseus drove what that buys:
 * with the registry's `probe-round225` `expect:` pin bumped `All 33` → `All 34`, the child written
 * by the one-route copier is GREEN at `A1` on a registry that no longer says 33 — a cell built on
 * it to grade that fixture would have been dead.
 */
const C_IMPORT_OUTCOME = "from './lib/probe-outcome.mts';";
const C_IMPORT_SWEEP = "} from './sweep-probes.mjs';";
const C_HERE = 'const HERE = dirname(fileURLToPath(import.meta.url));';
/**
 * The subject's text-route declaration, **read out of the subject rather than typed here** — and
 * that is a repair of this unit's own first spelling, not a flourish. Typed verbatim, the anchor put
 * a SECOND copy of `probe-round373`'s declaration line into this file's bytes, and
 * `probe-round377`'s `copyProbe` asserts that same anchor is unique in the file it copies. It threw,
 * and `probe-round377` went RED at `SWEEP FAILED — 43 of 44` with no summary line at all. Its
 * assertion was right: with two occurrences it could not know which one to redirect.
 *
 * The deeper reading, and the reason this is derived and not merely split across a concatenation:
 * **a hand-typed spelling of another file's line is the exact defect class Rounds 376 and 377
 * exist to cure**, and I shipped a fresh one in the same evening as the cure for it. A derived
 * anchor cannot drift when that seat reformats the line, and it cannot collide with the quoting.
 */
const C_SWEEP_LINE = /^const SWEEP = join\(HERE, '[^']+'\);$/m;
const C_SWEEP = C_SWEEP_LINE.exec(r373Src)?.[0] ?? '(no text-route declaration found)';
const C_SANDBOX = "const SANDBOX = join(HERE, '..', '.testdata', 'round373');";
const copy373 = (sweepPath: string) => {
  let s = once(r373Src, C_IMPORT_OUTCOME, `from '${join(HERE, 'lib', 'probe-outcome.mts')}';`);
  s = once(s, C_IMPORT_SWEEP, `} from '${sweepPath}';`);
  s = once(s, C_HERE, `const HERE = ${JSON.stringify(HERE)};`);
  // The text route, redirected to the SAME copy the import takes. `HERE` has to stay the real
  // `scripts/` (the child resolves `lib/` and `probe-round225` through it), so this cannot be left
  // to follow from the line above — it is its own asserted substitution.
  s = once(s, C_SWEEP, `const SWEEP = ${JSON.stringify(sweepPath)};`);
  // Same DEPTH under `.testdata/` as the real one, not merely a different name: the child this file
  // mints imports the shared module through `../../scripts/lib/`, so a sandbox one level deeper
  // makes the child fail to load and the live half fail for a reason that has nothing to do with
  // the registry. C1 caught exactly that on the first drive of this arm.
  s = once(s, C_SANDBOX, `const SANDBOX = ${JSON.stringify(join(REPO, '.testdata', 'round375-r373'))};`);
  return s;
};
const C_SUBJECT = join(SANDBOX, 'subject-round373.mts');
const driveSubject = (label: string, sweepPath: string) => {
  writeFileSync(C_SUBJECT, copy373(sweepPath), 'utf8');
  const run = spawnSync('npx', ['tsx', C_SUBJECT], { cwd: REPO, encoding: 'utf8', timeout: 180_000 });
  const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  const b4 = /(FAIL|\[ok\]) B4 {2}the mirror leg[^\n]*occurs (\d+) times/.exec(out);
  meas(
    `C-drive(${label})`,
    `exit ${String(run.status)} · B4 ${b4 ? `${b4[1]} at ${b4[2]} occurrence(s)` : '(no line)'} · ` +
      `${ownHeadline(out) ?? `FAIL ${out.split('\n').filter((l) => l.startsWith('FAIL ')).map((l) => l.slice(5).split(/\s+/)[0]).join(' ')}`}`,
  );
  return { status: run.status, out, own: ownHeadline(out), b4Fail: b4?.[1] === 'FAIL', b4Count: b4 ? Number(b4[2]) : -1 };
};
const faithful = driveSubject('faithful-registry', FAITHFUL_SWEEP);
check(
  'C1',
  `CONTROL: the sandbox copy of the repaired \`probe-round373\`, against a faithful copy of the ` +
    `registry module, is green on its OWN declared count — exit ${String(faithful.status)}, B4 at ` +
    `${faithful.b4Count} occurrence(s), and the headline it printed (${faithful.own ?? '(none)'}) ` +
    `is the one its own registry entry pins (${R373_PIN.source}). The copy is the file. ` +
    `The third conjunct is AGREEMENT and not a number (Round 465, \`unit-465guard375\`): as shipped ` +
    `it was that seat's arm total typed in here, which nothing read against the registry, so it ` +
    `drifted false the moment their pin moved while this arm kept passing. AGREEMENT rather than ` +
    `A0r's SHAPE, because \`/All \\d+ …/\` still passes when a member's arms silently vanish, and ` +
    `that is most of what this section is for`,
  faithful.status === 0 &&
    !faithful.b4Fail &&
    faithful.b4Count === 0 &&
    agrees(R373_PIN, faithful.own),
);
const drifted = driveSubject('shortened-registry', MUTANT_SWEEP);
check(
  'C2',
  'and one declaration shorter, the repaired B4 goes RED and says the number: exit ' +
    `${String(drifted.status)}, B4 FAIL at ${drifted.b4Count} occurrence(s). The drift his A1 was ` +
    'keyed to catch is now caught by the file that makes the claim, from its behaviour under a ' +
    'changed registry rather than from a regex over its own text (369) — and the literal key it ' +
    'replaced would have reported 0 and passed here (A4m)',
  drifted.status === 1 && drifted.b4Fail && drifted.b4Count === 2,
);
/**
 * **Re-keyed in Round 465, `unit-465route375`, and the re-key is the point rather than a
 * consequence.** As shipped this arm asserted the two copies *"differ in one byte-range … exactly
 * 1 line"*. That was true only while `copy373` redirected ONE of the registry's two routes; the
 * cure above redirects both, which makes the difference two lines — so the frozen count would have
 * reddened on its own cure, and refreshing `1` to `2` would only re-arm the same trap for the next
 * route. The count is therefore removed rather than refreshed (Argus, `unit-465skipE`): the
 * property C2 actually needs is that **every** differing line is one that names the registry path,
 * and the number survives only as the predicate's non-emptiness.
 *
 * Non-vacuous, and driven rather than argued: a registry-UNRELATED difference injected between the
 * two copies makes this arm red and the sole red (`unit-465route375` P6).
 */
const c3a = copy373(FAITHFUL_SWEEP).split('\n');
const c3b = copy373(MUTANT_SWEEP).split('\n');
const c3Diff = c3a.map((l, i) => (l === c3b[i] ? -1 : i)).filter((i) => i >= 0);
/** Both copies' own sweep path blanked to one token, so a differing line can be compared. */
const pathBlanked = (line: string, p: string) => line.split(p).join('<SWEEP-PATH>');
check(
  'C3',
  `the two arms differ ONLY where the registry path is named: same line count, ` +
    `${c3Diff.length} differing line(s) at ${c3Diff.join(', ')}, and each of them is ` +
    `byte-identical once each copy's own sweep path is blanked — so C2 is attributable to the ` +
    `registry and not to the copy. Keyed on that property and not on a count (Round 465, ` +
    `\`unit-465route375\`): the shipped spelling asserted exactly 1 differing line, which held ` +
    `only while this copier redirected one of the subject's two registry routes`,
  c3a.length === c3b.length &&
    c3Diff.length > 0 &&
    c3Diff.every(
      (i) => pathBlanked(c3a[i], FAITHFUL_SWEEP) === pathBlanked(c3b[i], MUTANT_SWEEP),
    ),
);

console.log('');
for (const m of measurements) console.log(`[MEAS] ${m}`);

summariseAndExit({ probeName: 'probe-round375', results });
