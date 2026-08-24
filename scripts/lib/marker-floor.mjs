/**
 * The marker false-positive floor classifier — one copy, two consumers.
 *
 * Extracted 2026-08-24 (Round 85) at the moment `measure-marker-floor.mjs` gained a test,
 * for the reason `recall-recogniser.mjs` gives at the top of its own file: a test that checks
 * its *own copy* of the classifier proves nothing about the script. So the test imports this,
 * and what it certifies is the code the measurement actually runs.
 *
 * This module turns text into counts. It does not know where corpora come from, and it holds
 * no marker vocabulary of its own — `P` and the cap are passed in by the caller, which imports
 * them from `recall.ts` and `carried-context.ts`. A measurement tool with a private copy of
 * the vocabulary is the duplicated-literal defect Round 58 removed, one level out.
 */

/**
 * @param P    the frozen `RECALL_MARKER_PHRASES` record from `recall.ts`
 * @param CAP  `CARRIED_CONTEXT_MAX_MESSAGE_CHARS` from `carried-context.ts`
 * @param pats `{ GAP_LINE, EDGE_LINE }` from `buildRecogniser(P)`
 */
export function buildFloorClassifier(P, CAP, { GAP_LINE, EDGE_LINE }) {
  /**
   * Everything about one unit of corpus — a doc file, a transcript row, a `messages.content`.
   *
   * **Two opener predicates, both reported, and the difference is not cosmetic.**
   *
   * `openers` is the line-start form: the trimmed line *begins* with `P.open`. This is the
   * predicate Rounds 82, 83 and 84 all ran — verified 2026-08-24 by reproducing their published
   * counts with it and with nothing else (`docs/**.md` at `9558902^`: 7 openers / 4 matched /
   * 3 orphans; at that day's HEAD: 10 / 4 / 6). It is kept as the headline so this instrument's
   * numbers are comparable to that arm without reinterpretation.
   *
   * `openersAnywhere` is the strictly broader form: the line *contains* `P.open` at any offset.
   * It exists because the line-start predicate cannot see a marker pasted mid-sentence — inside
   * backticks, most often — and that is a real way for the shape to enter prose. On the same
   * corpus it reads 22/4/18 and 30/4/26 where the line-start form reads 7/4/3 and 10/4/6.
   *
   * Both are reported because either alone is a trap. Quoting only the broad count silently
   * contradicts three rounds of published numbers; quoting only the narrow one reports a floor
   * measured by a predicate that misses the most common way a human introduces the shape. Where
   * a corpus reads zero on `openersAnywhere` it reads zero on `openers` by construction, and
   * that is the strong form of a clean result.
   *
   * Neither is derived from the build's renderer, on purpose: a detector that asked the build
   * "is this yours" would only ever find the build's own output and could not measure a floor.
   */
  function classify(text) {
    let openers = 0, matched = 0, orphans = 0;
    let openersAnywhere = 0, matchedAnywhere = 0, orphansAnywhere = 0;
    const orphanLines = [];
    for (const line of text.split('\n')) {
      if (!line.includes(P.open)) continue;
      const t = line.trim();
      const read = GAP_LINE.test(t) || EDGE_LINE.test(t);

      openersAnywhere++;
      if (read) matchedAnywhere++; else orphansAnywhere++;

      if (t.startsWith(P.open)) {
        openers++;
        if (read) matched++;
        else { orphans++; orphanLines.push(t.slice(0, 120)); }
      }
    }
    // Straddle: scanned from the front, because only an opener *before* the cut can be severed
    // by it. An opener after the cut is discarded whole — a different and harmless outcome that
    // would inflate this count if it were included.
    let straddles = 0;
    if (text.length > CAP) {
      for (let i = 0; (i = text.indexOf(P.open, i)) !== -1 && i < CAP; i += P.open.length) {
        const close = text.indexOf(P.close, i);
        if (close === -1 || close + P.close.length > CAP) straddles++;
      }
    }
    return {
      openers, matched, orphans, orphanLines, straddles,
      openersAnywhere, matchedAnywhere, orphansAnywhere,
      stem: text.split(P.edgeHeaderStem).length - 1,
      over: text.length > CAP,
      chars: text.length,
    };
  }

  const SUMMED = [
    'chars', 'openers', 'matched', 'orphans',
    'openersAnywhere', 'matchedAnywhere', 'orphansAnywhere',
    'straddles', 'stem',
  ];

  /** Sum `classify` over many units. Units, not characters, are the denominator. */
  function tally(units) {
    const t = { units: 0, over: 0 };
    for (const k of SUMMED) t[k] = 0;
    const orphanLines = [];
    for (const u of units) {
      const c = classify(u);
      t.units++;
      for (const k of SUMMED) t[k] += c[k];
      t.over += c.over ? 1 : 0;
      orphanLines.push(...c.orphanLines);
    }
    return { ...t, orphanLines };
  }

  /**
   * The three constructed units the positive control runs, and where each must land.
   *
   * Assembled from `P` rather than pasted — a pasted control drifts with the build exactly as
   * the Round 54 pattern did, and would then certify a stale classifier as healthy. Each unit
   * targets a different category, so a classifier that has collapsed to "everything is an
   * orphan" or "nothing matches" fails visibly rather than passing on one lucky row.
   */
  function controls() {
    const wellFormed =
      `${P.open}2${P.interiorPrefix}${P.interiorPhrase}${P.interiorSuffix}${P.close}`;
    return [
      {
        name: 'well-formed marker',
        text: wellFormed,
        ok: (c) => c.openers === 1 && c.matched === 1 && c.orphans === 0,
      },
      {
        // The one shape every orphan in `docs/**.md` has turned out to be: a real marker a
        // human pasted into prose and an editor hard-wrapped.
        name: 'same marker hard-wrapped',
        text: wellFormed.slice(0, 40) + '\n' + wellFormed.slice(40),
        ok: (c) => c.openers === 1 && c.matched === 0 && c.orphans === 1,
      },
      {
        // The case the line-start predicate is blind to by design, and the reason both
        // predicates are reported. A marker quoted mid-sentence — inside backticks, as prose
        // about markers almost always does it — is invisible to `openers` and must show up in
        // `openersAnywhere`. If this control ever passes on the narrow count, the two
        // predicates have collapsed into one and the broad column has stopped meaning anything.
        name: 'marker pasted mid-sentence',
        text: `all three are the identical \`${wellFormed}\` marker, hard-wrapped by`,
        ok: (c) => c.openers === 0 && c.openersAnywhere === 1 && c.orphansAnywhere === 1,
      },
      {
        name: 'ordinary prose',
        text: 'An ordinary paragraph that names no marker and quotes no phrase.',
        ok: (c) => c.openers === 0 && c.openersAnywhere === 0 && c.orphans === 0 && c.stem === 0,
      },
    ];
  }

  /** `{ passed, results }` — the caller decides whether to print, warn, or exit. */
  function runControls() {
    const results = controls().map((c) => {
      const counts = classify(c.text);
      return { name: c.name, counts, passed: c.ok(counts) };
    });
    return { passed: results.every((r) => r.passed), results };
  }

  return { classify, tally, controls, runControls };
}
