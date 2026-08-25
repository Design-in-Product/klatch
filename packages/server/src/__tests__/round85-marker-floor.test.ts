/**
 * Round 85 — the marker false-positive floor classifier, and why it is tested here rather
 * than trusted to its own runtime control.
 *
 * (Filename keeps the round it was created in. The classifier it certifies was
 * reparameterised in Round 87 — five disjoint categories in place of two overlapping opener
 * predicates — and the tests below moved with it.)
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
 * detection lives. This file's job is narrower and complementary: that the categories stay
 * *distinguishable*. A classifier that has collapsed to "everything is an orphan", or to
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
const { classify, tally, runControls, BUCKETS } = buildFloorClassifier(P, CAP, patterns);

const wellFormed = `${P.open}2${P.interiorPrefix}${P.interiorPhrase}${P.interiorSuffix}${P.close}`;
const hardWrapped = wellFormed.slice(0, 40) + '\n' + wellFormed.slice(40);
const midSentence = `all three are the identical \`${wellFormed}\` marker, quoted inline`;
const anchoredUnreadable = `${P.open}2 an interior no current pattern reads${P.close}`;
const quotedOpener = `the record reads "open": "${P.open}" and closes nothing here`;

/** Every shape the classifier is expected to have an opinion about, plus a negative. */
const ALL_SHAPES = [
  wellFormed, hardWrapped, midSentence, anchoredUnreadable, quotedOpener,
  'nothing marker-shaped here',
  `${P.open}`,                                    // opener alone, nothing after it
  `prose ${P.open}`,                              // opener at end of line
  `  ${wellFormed}  `,                            // leading whitespace: trimmed, so still read
  `${wellFormed} ${wellFormed}`,                  // two markers on one line
];

describe('Round 85 — marker floor classifier', () => {
  it('passes its own positive control, the same units the script runs', () => {
    const { passed, results } = runControls();
    // Named in the failure output rather than asserted as a bare boolean, so a CI failure
    // says which category stopped being reachable.
    expect(results.filter((r: { passed: boolean }) => !r.passed).map((r: { name: string }) => r.name)).toEqual([]);
    expect(passed).toBe(true);
  });

  it('lands each shape in exactly one named category', () => {
    // The whole measurement is "opener lines that no pattern reads, and why". If the
    // categories were not separable, every corpus would read either all-clean or all-dirty
    // and the number would carry no information.
    expect(classify(wellFormed)).toMatchObject({ read: 1, severed: 0, unparsed: 0, embedded: 0, residue: 0 });
    expect(classify(hardWrapped)).toMatchObject({ read: 0, severed: 1, unparsed: 0, embedded: 0, residue: 0 });
    expect(classify(anchoredUnreadable)).toMatchObject({ read: 0, severed: 0, unparsed: 1, embedded: 0, residue: 0 });
    expect(classify(midSentence)).toMatchObject({ read: 0, severed: 0, unparsed: 0, embedded: 1, residue: 0 });
    expect(classify(quotedOpener)).toMatchObject({ read: 0, severed: 0, unparsed: 0, embedded: 0, residue: 1 });
    expect(classify('nothing marker-shaped here')).toMatchObject({ read: 0, severed: 0, unparsed: 0, embedded: 0, residue: 0 });
  });

  it('partitions the opener-line population — the categories sum to it, with no double count', () => {
    // This is the property the Round 87 reparameterisation bought and the one that Round 85's
    // two overlapping predicates could not state: every line carrying `P.open` is counted
    // once. Without it, adding a category later could silently double-count and the totals
    // would still look plausible.
    for (const text of ALL_SHAPES) {
      const c = classify(text);
      const sum = BUCKETS.reduce((n: number, b: string) => n + c[b], 0);
      expect(sum).toBe(c.openersAnywhere);
    }
  });

  it('keeps `severed` meaning severed — an embedded marker is intact and must not inflate it', () => {
    // The specific error Round 85's broad column made: it merged 17 lines whose marker text
    // was whole and merely quoted inside a sentence with 6 whose marker text had really been
    // cut, and reported the sum as if all 26 were the wrapping defect being sized.
    expect(classify(midSentence).severed).toBe(0);
    expect(classify(midSentence).embedded).toBe(1);
    // A close on the same line is what distinguishes them, not position alone.
    expect(classify(quotedOpener).embedded).toBe(0);
    expect(classify(quotedOpener).residue).toBe(1);
  });

  it('flags a digitless opener, which cannot be a marker under any interior', () => {
    // Both patterns require `(\d+)` immediately after the opener, so no interior can rescue an
    // occurrence without one. It is the cheapest available "this was never a marker" test and
    // it is what separates a pasted JSON record from a genuinely cut marker.
    expect(classify(quotedOpener).digitless).toMatchObject({ residue: 1 });
    // `recall.ts`'s own `open: '[… ',` is the real instance of this shape in the repo.
    expect(classify(`  open: '${P.open}',`).digitless).toMatchObject({ residue: 1 });
    // A residue line that *does* carry a digit is a different animal — a marker cut by a
    // source-line continuation — and must not be swept in with it.
    const cutInSource = `      '${P.open}2 earlier message(s) in this conversation, ' +`;
    expect(classify(cutInSource)).toMatchObject({ residue: 1 });
    expect(classify(cutInSource).digitless.residue).toBe(0);
  });

  it('derives the Rounds 82-85 columns from the categories, unchanged', () => {
    // Three rounds of published counts have to stay comparable, so the old six are still
    // reported. They are arithmetic over the five now, and this pins the arithmetic.
    expect(classify(wellFormed)).toMatchObject({ openers: 1, matched: 1, orphans: 0, openersAnywhere: 1, orphansAnywhere: 0 });
    expect(classify(hardWrapped)).toMatchObject({ openers: 1, matched: 0, orphans: 1, openersAnywhere: 1, orphansAnywhere: 1 });
    expect(classify(anchoredUnreadable)).toMatchObject({ openers: 1, matched: 0, orphans: 1 });
    expect(classify(midSentence)).toMatchObject({ openers: 0, orphans: 0, openersAnywhere: 1, orphansAnywhere: 1 });
  });

  it('holds `matchedAnywhere === matched` for every shape, because it cannot differ', () => {
    // `GAP_LINE` and `EDGE_LINE` are both `'^' + rx(P.open) + …` on the *trimmed* line, so a
    // line either pattern reads necessarily starts with the opener and the line-start branch
    // necessarily fires too. Round 85 reported the two as independent columns; Theseus's
    // Round 86 §2 showed one was a provable copy of the other. Asserted rather than deleted
    // so that loosening either pattern's anchor — which would make the two genuinely differ —
    // fails here instead of quietly resurrecting a column nobody reads.
    for (const text of ALL_SHAPES) {
      const c = classify(text);
      expect(c.matchedAnywhere).toBe(c.matched);
      // And the broad form stays a superset, which is what makes a broad zero the strong result.
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
    expect(t.read).toBe(1);
    expect(t.openers).toBe(1);
    expect(t.openersAnywhere).toBe(1);
    expect(t.chars).toBe(wellFormed.length + 'plain'.length * 2);
  });

  it('sums categories and digitless across units, and re-derives the legacy columns from the totals', () => {
    // `tally` sums only the independent counts and derives the rest afterwards. If anyone
    // adds a legacy column to the summed list as well, this catches the double count.
    const t = tally([wellFormed, hardWrapped, midSentence, anchoredUnreadable, quotedOpener]);
    expect(t).toMatchObject({ read: 1, severed: 1, unparsed: 1, embedded: 1, residue: 1 });
    expect(t.digitless).toMatchObject({ severed: 0, unparsed: 0, embedded: 0, residue: 1 });
    expect(t).toMatchObject({ openers: 3, matched: 1, orphans: 2, openersAnywhere: 5, orphansAnywhere: 4 });
    expect(BUCKETS.reduce((n: number, b: string) => n + t[b], 0)).toBe(t.openersAnywhere);
  });

  it('accepts a generator, so the widest corpus need not be held in memory at once', () => {
    // `--all-tracked` streams ~30 MB of tracked files through `tally` one at a time. If this
    // ever regresses to requiring an array, that mode starts materialising every PNG and both
    // SQLite backups as decoded strings simultaneously.
    const t = tally((function* () { yield wellFormed; yield 'plain'; })());
    expect(t.units).toBe(2);
    expect(t.read).toBe(1);
  });

  it('reads the header stem as an occurrence count, not a boolean', () => {
    expect(classify(`${P.edgeHeaderStem} and again ${P.edgeHeaderStem}`).stem).toBe(2);
    expect(classify('no stem here').stem).toBe(0);
  });
});
