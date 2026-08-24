/**
 * Round 85 — the marker false-positive floor classifier, and why it is tested here rather
 * than trusted to its own runtime control.
 *
 * `scripts/measure-marker-floor.mjs` runs a positive control before it reports anything, and
 * exits non-zero if the control fails. That protects a *run*. It does not protect the repo:
 * the script is run by hand, by whoever is awake, and the failure mode being guarded is
 * precisely that a wording change lands and nobody notices for a week. `REACHABLE_R54` did
 * exactly that — it did not report a mismatch, it reported **zero**, and zero is a legal
 * value for that field.
 *
 * So the control moves into the suite, where it runs on every `npm test` whether or not
 * anyone measures anything. The classifier lives in `scripts/lib/marker-floor.mjs` and both
 * consumers import it, for the reason `recall-recogniser.mjs` states about itself: a test
 * that checks its own copy of the classifier certifies nothing about the script.
 *
 * **What this file can and cannot catch.** Deriving the patterns from `RECALL_MARKER_PHRASES`
 * makes them track the build by construction, so they can never silently read zero for a
 * marker that is in fact rendered. What that gives up is noticing that the wording *changed* —
 * the classifier follows the change. `round58-recall-marker-phrases.test.ts` is where that
 * detection lives. This file's job is narrower and complementary: that the three categories
 * stay *distinguishable*. A classifier that has collapsed to "everything is an orphan", or to
 * "nothing ever matches", tracks the record perfectly and measures nothing.
 */

import { describe, it, expect } from 'vitest';
import { RECALL_MARKER_PHRASES } from '../claude/recall.js';
import { CARRIED_CONTEXT_MAX_MESSAGE_CHARS } from '../claude/carried-context.js';
// @ts-expect-error — plain ESM helper shared with scripts/, no types by design
import { buildRecogniser } from '../../../../scripts/lib/recall-recogniser.mjs';
// @ts-expect-error — same
import { buildFloorClassifier } from '../../../../scripts/lib/marker-floor.mjs';

const P = RECALL_MARKER_PHRASES;
const CAP = CARRIED_CONTEXT_MAX_MESSAGE_CHARS;
const { patterns } = buildRecogniser(P);
const { classify, tally, runControls } = buildFloorClassifier(P, CAP, patterns);

const wellFormed = `${P.open}2${P.interiorPrefix}${P.interiorPhrase}${P.interiorSuffix}${P.close}`;

describe('Round 85 — marker floor classifier', () => {
  it('passes its own positive control, the same three units the script runs', () => {
    const { passed, results } = runControls();
    // Named in the failure output rather than asserted as a bare boolean, so a CI failure
    // says which category stopped being reachable.
    expect(results.filter((r: { passed: boolean }) => !r.passed).map((r: { name: string }) => r.name)).toEqual([]);
    expect(passed).toBe(true);
  });

  it('keeps the three categories distinguishable, which is the property a floor needs', () => {
    // The whole measurement is "openers that no pattern reads". If matched and orphan were
    // not separable, every corpus would read either all-clean or all-dirty and the number
    // would carry no information.
    expect(classify(wellFormed)).toMatchObject({ openers: 1, matched: 1, orphans: 0 });
    expect(classify(wellFormed.slice(0, 40) + '\n' + wellFormed.slice(40)))
      .toMatchObject({ openers: 1, matched: 0, orphans: 1 });
    expect(classify('nothing marker-shaped here')).toMatchObject({ openers: 0, orphans: 0 });
  });

  it('keeps the two opener predicates from collapsing into one', () => {
    // `openers` is the line-start form Rounds 82-84 published; `openersAnywhere` is strictly
    // broader. The mid-sentence paste is the case that separates them, and it is how prose
    // *about* markers introduces the shape — so if these two ever agree on it, the broad
    // column has stopped carrying information and the narrow one is being read as if it were
    // a floor when it cannot see the commonest case.
    const midSentence = `all three are the identical \`${wellFormed}\` marker, hard-wrapped by`;
    expect(classify(midSentence)).toMatchObject({
      openers: 0, orphans: 0, openersAnywhere: 1, orphansAnywhere: 1,
    });

    // And the broad predicate is genuinely a superset, not a different question: anything the
    // line-start form sees, the broad form sees too.
    for (const t of [wellFormed, wellFormed.slice(0, 40) + '\n' + wellFormed.slice(40), midSentence]) {
      const c = classify(t);
      expect(c.openersAnywhere).toBeGreaterThanOrEqual(c.openers);
      expect(c.orphansAnywhere).toBeGreaterThanOrEqual(c.orphans);
    }
  });

  it('counts a straddle only when the cap actually severs a marker', () => {
    // Under the cap: not a straddle however the marker sits, because nothing is truncated.
    expect(classify(wellFormed).straddles).toBe(0);

    // Opener before the cap, close after it — severed. The marker is placed so that its
    // opening bracket lands a few chars short of the cut.
    const severed = 'x'.repeat(CAP - 4) + wellFormed + 'y'.repeat(100);
    expect(severed.length).toBeGreaterThan(CAP);
    expect(classify(severed).straddles).toBe(1);

    // Same over-cap length, marker entirely past the cut — discarded whole, which is the
    // harmless outcome and must not be counted. This is the assertion that fails if anyone
    // "simplifies" the front-to-back scan into a whole-string search.
    const past = 'x'.repeat(CAP + 50) + wellFormed;
    expect(classify(past).over).toBe(true);
    expect(classify(past).straddles).toBe(0);
  });

  it('uses units, not characters, as the denominator', () => {
    const t = tally([wellFormed, 'plain', 'plain']);
    expect(t.units).toBe(3);
    expect(t.openers).toBe(1);
    expect(t.openersAnywhere).toBe(1);
    expect(t.chars).toBe(wellFormed.length + 'plain'.length * 2);
  });

  it('reads the header stem as an occurrence count, not a boolean', () => {
    expect(classify(`${P.edgeHeaderStem} and again ${P.edgeHeaderStem}`).stem).toBe(2);
    expect(classify('no stem here').stem).toBe(0);
  });
});
