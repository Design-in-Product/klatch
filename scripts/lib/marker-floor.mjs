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
   * Every line carrying `P.open` lands in exactly one of five named categories.
   *
   * **Why this replaced two opener predicates (Round 87, Theseus's Round 86 §3).** Round 85
   * reported the same corpus under a line-start predicate and a contains-anywhere predicate,
   * and argued that both were needed because either alone was a trap. The columns were right
   * and the parameterisation was wrong, for two reasons found within a day of each other:
   *
   * 1. **One of the six numbers could not vary.** `GAP_LINE` and `EDGE_LINE` are both
   *    `'^' + rx(P.open) + …` — anchored on the *trimmed* line. So a line the recogniser reads
   *    necessarily starts with the opener, and the narrow branch necessarily fires too:
   *    `matchedAnywhere ≡ matched` for every possible input, not merely for every corpus tried.
   *    A column that is provably a copy of another column is noise in exactly the way
   *    `recall-recogniser.mjs` describes for permanently-zero rows.
   * 2. **The remaining difference merged two unlike failures and one non-failure.** The 20
   *    broad-only lines in `docs/**.md` at 2026-08-24 HEAD are not one pattern. 17 carry an
   *    intact `P.close` on the same line — the marker text is whole and merely surrounded by
   *    prose. 6 (the narrow orphans) start at column zero with no close — something really was
   *    cut. Only the second is the hard-wrap defect this arm has been sizing, and only the
   *    second can happen in a rendered tool result: the build never quotes a marker inside a
   *    sentence, a human writing about markers does it constantly.
   *
   * So the categories are disjoint and named for their mechanism:
   *
   *   read      — `GAP_LINE` or `EDGE_LINE` reads the whole trimmed line. A marker.
   *   severed   — opener at column zero, no close on the line. A marker that was cut: a human
   *               pasted it into prose and an editor hard-wrapped it, or truncation split it.
   *               This is the false negative the cap-straddle count predicts in advance.
   *   unparsed  — opener at column zero, close present, and neither pattern reads it. Complete
   *               on the line and unreadable anyway, which is what recogniser drift looks like.
   *               Zero in every corpus measured so far; it has a control because a category
   *               that is only ever zero is the one whose detector can rot unnoticed.
   *   embedded  — opener past column zero, close on the same line. A whole marker quoted inside
   *               a sentence. A recogniser false negative, but nothing was severed.
   *   residue   — opener past column zero, no close. The honest bucket: an embedded marker that
   *               also wrapped, or a bare mention of the opener that was never a marker at all.
   *               `digitless` separates these better than any position rule does.
   *
   * `digitless` counts, per category, the lines where no digit immediately follows the opener.
   * Both patterns require `(\d+)` there, so a digitless occurrence **cannot** be a marker under
   * any interior. It is the cheapest available "this was never a marker" test, and it is the
   * one that showed 2 of the 3 residue lines to be a pasted JSON record quoting the `open`
   * field as a bare string literal.
   *
   * **The six Round 82-85 numbers are still reported, derived rather than recomputed** (see
   * `withDerived`). Three rounds of published counts stay comparable without reinterpretation,
   * and the arithmetic that makes them comparable is written down once instead of being
   * re-argued from a table each time.
   *
   * None of this is derived from the build's renderer, on purpose: a detector that asked the
   * build "is this yours" would only ever find the build's own output and could not measure a
   * floor.
   */
  const BUCKETS = ['read', 'severed', 'unparsed', 'embedded', 'residue'];
  /** `read` is excluded: a line the recogniser read has a digit by construction. */
  const UNREAD_BUCKETS = ['severed', 'unparsed', 'embedded', 'residue'];

  /**
   * The six Round 82-85 columns, as arithmetic over the five categories.
   *
   * `matchedAnywhere` is `read` for the structural reason above, and is emitted rather than
   * dropped so that a reader holding a Round 82-85 printout can line the two up cell for cell.
   */
  function withDerived(c) {
    const anchored = c.read + c.severed + c.unparsed;
    const anywhere = anchored + c.embedded + c.residue;
    return {
      ...c,
      openers: anchored,
      matched: c.read,
      orphans: c.severed + c.unparsed,
      openersAnywhere: anywhere,
      matchedAnywhere: c.read,
      orphansAnywhere: anywhere - c.read,
    };
  }

  function classify(text) {
    const c = { read: 0, severed: 0, unparsed: 0, embedded: 0, residue: 0 };
    const digitless = { severed: 0, unparsed: 0, embedded: 0, residue: 0 };
    // Every line carrying the opener that the recogniser did not read, labelled with the
    // category it landed in. Round 85 collected the line-start ones only; the mid-sentence
    // ones are precisely the population Round 86 had to hand-classify to make its case, so
    // withholding them from `--show-orphans` made the instrument harder to argue with than
    // it needed to be.
    const unreadLines = [];
    for (const line of text.split('\n')) {
      if (!line.includes(P.open)) continue;
      const t = line.trim();
      if (GAP_LINE.test(t) || EDGE_LINE.test(t)) { c.read++; continue; }

      const at = t.indexOf(P.open);
      const closed = t.indexOf(P.close, at + P.open.length) !== -1;
      const bucket = at === 0 ? (closed ? 'unparsed' : 'severed')
                              : (closed ? 'embedded' : 'residue');
      c[bucket]++;
      if (!/[0-9]/.test(t.charAt(at + P.open.length))) digitless[bucket]++;
      unreadLines.push({ bucket, line: t.slice(0, 120) });
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

    return withDerived({
      ...c,
      digitless,
      unreadLines,
      straddles,
      stem: text.split(P.edgeHeaderStem).length - 1,
      over: text.length > CAP,
      chars: text.length,
    });
  }

  /**
   * Only the independent counts are summed; the six legacy columns are re-derived from the
   * totals afterwards. Summing them directly would give the same answer today — they are all
   * linear in the buckets — and would silently stop doing so the first time one of them
   * acquires a non-linear definition.
   */
  const SUMMED = ['chars', 'straddles', 'stem', ...BUCKETS];

  /** Sum `classify` over many units. Units, not characters, are the denominator. */
  function tally(units) {
    const t = { units: 0, over: 0 };
    for (const k of SUMMED) t[k] = 0;
    const digitless = { severed: 0, unparsed: 0, embedded: 0, residue: 0 };
    const unreadLines = [];
    for (const u of units) {
      const c = classify(u);
      t.units++;
      for (const k of SUMMED) t[k] += c[k];
      for (const k of UNREAD_BUCKETS) digitless[k] += c.digitless[k];
      t.over += c.over ? 1 : 0;
      unreadLines.push(...c.unreadLines);
    }
    return withDerived({ ...t, digitless, unreadLines });
  }

  /**
   * One constructed unit per category, plus a negative, and where each must land.
   *
   * Assembled from `P` rather than pasted — a pasted control drifts with the build exactly as
   * the Round 54 pattern did, and would then certify a stale classifier as healthy. Each unit
   * targets a different category, so a classifier that has collapsed to "everything is an
   * orphan" or "nothing matches" fails visibly rather than passing on one lucky row.
   *
   * The categories that read zero on every corpus so far — `unparsed`, `residue` — are the ones
   * that most need a control, for the reason `measure-marker-floor.mjs` gives about stale-pattern
   * zeros: a bucket nothing ever lands in is indistinguishable from a bucket nothing *can* land
   * in, and only a constructed positive tells the two apart.
   */
  function controls() {
    const wellFormed =
      `${P.open}2${P.interiorPrefix}${P.interiorPhrase}${P.interiorSuffix}${P.close}`;
    return [
      {
        name: 'well-formed marker',
        text: wellFormed,
        ok: (c) => c.read === 1 && c.matched === 1 && c.openers === 1 && c.orphans === 0,
      },
      {
        // The one shape every line-start orphan in `docs/**.md` has turned out to be: a real
        // marker a human pasted into prose and an editor hard-wrapped.
        name: 'severed — marker hard-wrapped',
        text: wellFormed.slice(0, 40) + '\n' + wellFormed.slice(40),
        ok: (c) => c.severed === 1 && c.read === 0 && c.openers === 1 && c.orphans === 1,
      },
      {
        // Recogniser drift, constructed: anchored at column zero, closed on the line, complete
        // in every respect a human would check, and read by neither pattern. Zero in the corpus;
        // if this control ever fails, the two patterns have loosened to the point where the
        // floor is measuring the wrong thing.
        name: 'unparsed — anchored, closed, unreadable',
        text: `${P.open}2 an interior no current pattern reads${P.close}`,
        ok: (c) => c.unparsed === 1 && c.read === 0 && c.severed === 0 &&
                   c.openers === 1 && c.orphans === 1 && c.digitless.unparsed === 0,
      },
      {
        // The case the line-start predicate is blind to, and 17 of the 20 lines that Round 85's
        // broad column found. Whole marker, intact close, quoted inside a sentence. It must not
        // land in `severed`: nothing here was cut, and letting it inflate the severed count is
        // precisely how Round 85's broad column overstated the wrapping defect.
        name: 'embedded — marker quoted mid-sentence',
        text: `all three are the identical \`${wellFormed}\` marker, quoted inline`,
        ok: (c) => c.embedded === 1 && c.severed === 0 && c.openers === 0 &&
                   c.openersAnywhere === 1 && c.orphansAnywhere === 1,
      },
      {
        // The bucket that says "cannot tell, and probably never was a marker". A pasted JSON
        // record quoting the `open` field: past column zero, no close, no digit after the
        // opener. `digitless` is what settles it, so the control asserts that too.
        name: 'residue — opener quoted with no digit',
        text: `the record reads "open": "${P.open}" and closes nothing on this line`,
        ok: (c) => c.residue === 1 && c.embedded === 0 && c.severed === 0 &&
                   c.digitless.residue === 1 && c.openers === 0,
      },
      {
        name: 'ordinary prose',
        text: 'An ordinary paragraph that names no marker and quotes no phrase.',
        ok: (c) => BUCKETS.every((b) => c[b] === 0) && c.openersAnywhere === 0 && c.stem === 0,
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

  return { classify, tally, controls, runControls, BUCKETS, UNREAD_BUCKETS };
}
