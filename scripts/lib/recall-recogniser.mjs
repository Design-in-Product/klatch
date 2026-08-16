/**
 * The recall-marker recogniser — one copy, two consumers.
 *
 * Extracted from `probe-recall-tool.mjs` on 2026-08-16 (WORK fire) at the same time as the
 * patterns stopped being hand-written and started deriving from `RECALL_MARKER_PHRASES`
 * (`recall.ts:145`).
 *
 * **Why a module and not just a tidier block.** `verify-recogniser-equivalence.mjs` exists to
 * prove that swapping the hand-written patterns for derived ones changes no measurement. A
 * verifier that checks its *own copy* of the new recogniser proves nothing about the probe —
 * it is the same duplicated-literal defect the swap was meant to remove, one level out. So the
 * verifier imports this, and what it certifies is the code the probe actually runs.
 *
 * The probe reads the recall tool's output text; the build writes it. Neither of those jobs
 * lives here. This file only turns rendered text into counts.
 */

/** Escape a literal for embedding in a `RegExp`. `{`, `}` and `"` all occur in the record. */
const rx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param P the frozen `RECALL_MARKER_PHRASES` record, imported by the caller from `recall.ts`
 *          so that this module has no opinion about where the build lives.
 */
export function buildRecogniser(P) {
  /**
   * The clauses of one edge line, split on the separator the build joins them with.
   *
   * **Per-clause, not per-line, and that distinction was found by a control rather than by
   * design.** The first version of the coverage check asked "did some pattern read this edge
   * line". `verify-recogniser-equivalence.mjs`'s negative control then showed that a
   * deliberately reworded *reachable* clause passed it: the line still carried an intact
   * *unreachable* clause, so something matched, so coverage held — while the reachable count
   * silently fell to zero. That is precisely the two-meanings-of-zero defect the check exists
   * to catch, surviving inside the check. Splitting first makes the granularity right.
   *
   * Splitting on `edgeClauseJoin` is safe against the address form, which contains `", "` but
   * not `"; "`. A conversation name containing the separator would over-split; that would
   * show up as an unread clause, i.e. loudly, which is the correct direction to fail.
   */
  const clausesOf = (line) => line.split(P.edgeClauseJoin);

  const GAP_LINE = new RegExp(
    '^' + rx(P.open) + '(\\d+)' +
    rx(P.interiorPrefix + P.interiorPhrase + P.interiorSuffix) + rx(P.close) + '$',
  );
  // Matched with its own pattern rather than a loosened version of GAP_LINE, on purpose:
  // the build's design is two markers with two vocabularies, and a regex that accepted
  // either would make "the interior phrase leaked onto the edge line" — the exact
  // regression the suite guards — invisible here.
  const EDGE_LINE = new RegExp(
    '^' + rx(P.open) + '(\\d+) (' + P.edgeSides.map(rx).join('|') + ')' +
    rx(P.edgeMiddle) + '(.+)' + rx(P.close) + '$',
  );
  // Round 54's reachable clause read `"N that a different search of yours could reach"`.
  // Round 56 replaced it with an address and left the *unreachable* clause untouched. Both
  // wordings are matched, separately rather than by one loosened pattern, because they are
  // different observations and a probe reading a transcript from an earlier build still
  // needs the old one.
  const REACHABLE_R54 = new RegExp('(\\d+)' + rx(P.edgeReachableNoAddress));
  const REACHABLE_R56 = new RegExp(
    '(\\d+)' + rx(P.edgeReachableWithAddress) + rx(P.edgeAddressOpen) + '([^"]*)' +
    rx(P.edgeAddressFrom) + '(\\d+)' + rx(P.edgeAddressTo) + '(\\d+)' + rx(P.edgeAddressClose),
  );
  const UNREACHABLE = new RegExp('(\\d+)' + rx(P.edgeUnreachable));

  /** The clauses of one edge line's clause list that no current pattern reads. */
  const unreadClauses = (clauseList) =>
    clausesOf(clauseList).filter(
      (c) => !REACHABLE_R56.test(c) && !REACHABLE_R54.test(c) && !UNREACHABLE.test(c),
    );

  // ── Declared expectations on the retained patterns (Daedalus's §2, adopted) ──
  //
  // Keeping the Round 54 pattern beside the Round 56 one was the right local move and it
  // creates a new problem one level up: **on the printout, the two zeros are identical.**
  // R54 matches zero forever, correctly, because no current build renders that wording.
  // R56 matches zero if it goes stale. Retention without a declared expectation raises the
  // noise floor that hid the original failure — in three rounds there would be six
  // permanently-zero rows and a seventh zero would be invisible among them.
  //
  // So each retained pattern carries what it is *supposed* to do, and the caller reports
  // violated expectations rather than raw counts. A quiet R54 is silent; a quiet R56 is loud.
  //
  // The expectations are predicates over one render's edge lines, not bare 'zero'/'nonzero'
  // strings, because "R56 should be nonzero" is false for a legitimately all-unreachable
  // edge. What the build guarantees is that an edge line renders at least one clause, so the
  // honest joint expectation is *coverage*: every edge line is read by some current pattern.
  // That is checkable without knowing which clause the geometry should have produced, so it
  // cannot be satisfied by a coincidence.
  const RETAINED_PATTERNS = [
    {
      name: 'reachable clause, Round 54 wording (retired)',
      expect: 'never matches on a current build',
      violated: (clauses) => clauses.some((c) => REACHABLE_R54.test(c)),
      why: 'Round 56 replaced this wording. A match means the build regressed, or this run is reading a transcript from an older build than the source tree.',
    },
    {
      name: 'reachable + unreachable clauses, current wording',
      expect: 'together, they read every clause of every edge line — not merely every line',
      violated: (clauses) => clauses.some((c) => unreadClauses(c).length > 0),
      why: 'Each clause an edge line renders is one of a known set. A clause no pattern reads means the recogniser is blind to it, and every count derived from it is not a measurement. Checked per clause because a line-level check is passed by an intact neighbour while the drifted clause reads zero.',
    },
    {
      name: 'interior phrase confined to the interior marker',
      expect: 'never appears on an edge line',
      violated: (_clauses, lines) => lines.some((l) => l.includes(P.interiorPhrase)),
      why: 'Two markers, two vocabularies. The interior header sentence promises "the lines either side of it are not consecutive", which has no referent where there is only one side.',
    },
  ];

  /** Everything about one rendered tool result that the patterns alone determine. */
  function read(text) {
    const lines = text.split('\n');
    const gapLines = lines.filter((l) => GAP_LINE.test(l.trim()));
    const edgeLines = lines
      .map((l) => l.trim().match(EDGE_LINE))
      .filter(Boolean)
      .map((m) => ({
        total: Number(m[1]),
        side: m[2],
        // Kept verbatim so the expectation predicates read the render rather than a summary
        // of it, and so a violated expectation can print the text that violated it.
        line: m[0],
        clauses: m[3],
        reachable: Number(m[3].match(REACHABLE_R56)?.[1] || m[3].match(REACHABLE_R54)?.[1] || 0),
        // The address the line offered, or null where the build offers none. Kept as a
        // structure rather than a boolean so `to - from + 1 === reachable` can be checked
        // against the render itself, and so a model's call can be compared to it verbatim.
        address: (() => {
          const a = m[3].match(REACHABLE_R56);
          return a ? { conversation: a[2], from: Number(a[3]), to: Number(a[4]) } : null;
        })(),
        unreachable: Number(m[3].match(UNREACHABLE)?.[1] || 0),
        // **Zero has two meanings and this separates them.** `reachable: 0` is legal — an
        // edge can be entirely unreachable. It is also what a recogniser that no longer
        // matches the build returns, which is how the Round 54 pattern reported a false zero
        // for a week. Deriving the patterns from the record makes that unreachable in
        // practice; it is still checked, because "this can't happen now" is the belief that
        // let the first one run. Per clause, for the reason `clausesOf` documents.
        unreadClauses: unreadClauses(m[3]),
        clausesUnrecognised: unreadClauses(m[3]).length > 0,
        // The interior marker's phrase must never appear on an edge line.
        leakedInteriorPhrase: m[0].includes(P.interiorPhrase),
      }));

    return {
      edgeLines: edgeLines.length,
      edgeLineDetail: edgeLines,
      edgeReachable: edgeLines.reduce((n, e) => n + e.reachable, 0),
      edgeUnreachable: edgeLines.reduce((n, e) => n + e.unreachable, 0),
      edgeVocabularyLeak: edgeLines.some((e) => e.leakedInteriorPhrase),
      // Loud where the old design was silent: an edge line whose clauses no pattern read.
      recogniserBlind: edgeLines.some((e) => e.clausesUnrecognised),
      // Round 56's two claims about the address, checked against the render rather than
      // taken from the landing memo: that one is offered at all, and that the range it names
      // is exactly as long as the count beside it (`to - from + 1 === ownCount`).
      addressesOffered: edgeLines.map((e) => e.address).filter(Boolean),
      addressArithmeticOk: edgeLines
        .filter((e) => e.address)
        .every((e) => e.address.to - e.address.from + 1 === e.reachable),
      scopeGapLines: gapLines.length,
      withheldMarked: gapLines.reduce((n, l) => n + Number(l.trim().match(GAP_LINE)[1]), 0),
      // The header sentence is conditional on a marker surviving the char budget, so its
      // presence is a separate observation from the marker's.
      headerExplainsTheEdge: text.split('\n\n')[0].includes(P.edgeHeaderStem),
      headerExplainsTheMarker: text.split('\n\n')[0].includes(P.interiorPhrase),
      // Violated expectations, not raw counts. Empty is the normal result and is what makes
      // a non-empty one worth reading.
      expectationViolations: RETAINED_PATTERNS
        .filter((p) => p.violated(edgeLines.map((e) => e.clauses), edgeLines.map((e) => e.line)))
        .map((p) => ({ name: p.name, expect: p.expect, why: p.why })),
    };
  }

  return { patterns: { GAP_LINE, EDGE_LINE, REACHABLE_R54, REACHABLE_R56, UNREACHABLE }, RETAINED_PATTERNS, read };
}
