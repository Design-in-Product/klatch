/**
 * Per-offer scoring for the recall probe's expand calls — one copy, two consumers.
 *
 * Built 2026-08-18 (START fire, Daedalus) from Theseus's Round 62 §7, which is a
 * metric-defect report against a scoring surface I own:
 *
 * > `tookTheAddress` (Round 56) is a boolean, and with two offers it now conflates two
 * > different behaviours: *took an address* and *took the address that could hold the
 * > condition*. On M it reads **4/5**, which is indistinguishable from L's 5/5 and hides
 * > the entire finding.
 *
 * He is right, and the reason is visible in the old code rather than in the data:
 * `offeredAddresses` was a `flatMap` over every render in the run, so `addressVerbatim`
 * asked "did some expand call match some address offered anywhere" — a question with one
 * answer when a render offers one address and no useful answer when it offers two.
 *
 * **Why a module and not a tidier block in the probe.** Same reason
 * `recall-recogniser.mjs` is a module: the numbers this produces get published, so they
 * need a verifier, and a verifier holding its own copy of the scorer certifies nothing
 * about the probe. `verify-offer-choice.mjs` imports this and replays Round 62's
 * published per-run table through it, so what is checked is the code the probe runs.
 *
 * **Additive by construction.** Every Round 56 field (`tookTheAddress`,
 * `addressVerbatim`, `addressSubrange`, `expansionHeldTheMarking`) is left exactly as it
 * was, computed exactly where it was. Rounds 52–62 stay comparable; the fields below
 * start at Round 63. That is the same rule `referentAmbiguity` followed at arm L.
 *
 * This file turns a call list into counts. It does not know about the API, the database,
 * or the render — the caller maps its own shapes onto the two inputs below.
 */

/**
 * One offered or asked range, normalised.
 *
 * `conversation` is carried and compared because an offer covering row 13 of a
 * *different* conversation does not put the restriction within reach, and a scorer that
 * dropped the name would silently score cross-conversation coverage as coverage. Every
 * arm on record seeds one conversation, so this has never yet mattered — which is
 * exactly when it is cheap to get right.
 */
const width = (a) => a.to - a.from + 1;
const same = (a, b) => a.conversation === b.conversation && a.from === b.from && a.to === b.to;
const contains = (outer, inner) =>
  outer.conversation === inner.conversation && inner.from >= outer.from && inner.to <= outer.to;

/**
 * Score the expand decisions of one run against the offers that were on the table when
 * each was taken.
 *
 * @param calls  ordered tool calls, each `{ kind: 'search' | 'expand', expand?, offeredAddresses }`.
 *               `offeredAddresses` is what *that call's own render* offered — so the
 *               offers available to call `i` are those of calls `0..i-1`, which is the
 *               distinction the old `flatMap` destroyed.
 * @param markingSeqs   scoped ordinals of the rows holding the restriction (`structural.markingSeqs`).
 * @param markingConversation  the conversation those ordinals are numbered in.
 */
export function scoreOfferChoice({ calls, markingSeqs = [], markingConversation = null }) {
  // A range "covers" the restriction if reading it would put the restriction in front of
  // the model. Stated as offer/ask geometry, deliberately independent of
  // `expansionHeldTheMarking`, which reads the *result text*. Two independent routes to
  // the same number is the point: on arm M both must read 2/5, and a disagreement is a
  // render-vs-geometry mismatch worth stopping for rather than a scoring detail.
  const covers = (a) =>
    markingConversation !== null &&
    a.conversation === markingConversation &&
    markingSeqs.some((m) => m >= a.from && m <= a.to);

  const offersBefore = (i) =>
    calls.slice(0, i).flatMap((c, j) =>
      (c.offeredAddresses || []).map((a) => ({ ...a, offeredByCall: j + 1 })));

  const perCall = [];
  calls.forEach((c, i) => {
    if (c.kind !== 'expand' || !c.expand) return;
    const asked = c.expand;
    const onTable = offersBefore(i);
    const matched = onTable.find((a) => same(a, asked)) ?? null;
    const containing = onTable.filter((a) => contains(a, asked));
    // The anchoring question of Rounds 59–62, generalised off the literal 4: was the
    // `from` the model asked for a value some render had handed it? Round 62 answered
    // this by hand-counting six calls. It is a field now.
    const startsOffered = onTable.filter((a) => a.from === asked.from && a.conversation === asked.conversation);
    // Theseus's Round 62 §3 precision point: M4's second expand copied `from: 12` from
    // the *first* search's offer, past a fresher render offering `7-38`. So `from` is
    // copied from *an* offer, not the current one — which is a weaker and more accurate
    // claim than "copied", and only a per-render scorer can state it.
    const freshestCallWithOffers = Math.max(0, ...onTable.map((a) => a.offeredByCall));
    // Theseus's Round 63 §5.1, a false alarm against this scorer: N1L5 took the covering
    // offer whole on call 3 and then expanded the *other* offer on call 4, and the report
    // printed "A COVERING OFFER WAS ON THE TABLE AND NOT TAKEN" on a run that had taken it
    // one call earlier. `declinedACoveringOfferHere` is left untouched — it is per-call and
    // its name says "here", so it was never the field that lied; the *report* was. This is
    // the fact the report needed and did not have.
    const coveringAlreadyReadBefore = perCall.some((p) => p.askedCoversTheMarking);
    perCall.push({
      call: i + 1,
      asked,
      widthAsked: width(asked),
      offersOnTable: onTable.length,
      offersOnTableCovering: onTable.filter(covers).length,
      choiceWasAvailable: new Set(onTable.map((a) => `${a.conversation}:${a.from}-${a.to}`)).size > 1,
      // "Matched an offer verbatim" and Round 62 §5's "took the offered range entire" are
      // the same predicate, so there is one field and not two. Naming it twice would have
      // read as two measurements agreeing.
      matchedAnOfferVerbatim: matched !== null,
      matchedOffer: matched,
      withinAnOffer: containing.length > 0,
      widthOfferedIfWithin: containing.length > 0 ? width(containing[0]) : null,
      askedStartWasOffered: startsOffered.length > 0,
      askedStartOfferedByCalls: startsOffered.map((a) => a.offeredByCall),
      copiedStartFromFreshestRender:
        startsOffered.length > 0 && startsOffered.some((a) => a.offeredByCall === freshestCallWithOffers),
      askedCoversTheMarking: covers(asked),
      declinedACoveringOfferHere: onTable.some(covers) && !covers(asked),
      coveringAlreadyReadBefore,
      // Theseus's Round 63 §5.2. `from` is copied and `to` is chosen (Round 62 M4's `12-20`,
      // N1's `34-44`/`34-41`/`34-41`/`34-40`, F/L's modal +8) — six points across three offer
      // geometries clustering at +6…+10, every one of them reconstructed by hand across
      // three round documents because the quantity had no field. It has one now. Null when
      // the start was never offered, because "offered start + N" is then undefined rather
      // than zero, and a zero would pool into any average taken over the column.
      startPlusN: startsOffered.length > 0 ? asked.to - asked.from : null,
    });
  });

  // A run that never expands still faced the offers its last render printed, so the
  // choice-point set for the run-level fields is the per-call one when it expanded and
  // "everything offered" when it did not. Without that, arm M's M3 — two searches, no
  // expand, disclosed anyway — would score `coveringOfferEverOffered: false`, which is
  // false about the run: it was offered rows 12–38 twice and answered without them.
  const allOffers = offersBefore(calls.length);
  const expandCalls = perCall.length;
  const coveringOfferEverOffered = allOffers.some(covers);
  const tookACoveringAddress = perCall.some((p) => p.askedCoversTheMarking);

  return {
    perCall,
    expandCalls,
    offersEverOnTable: allOffers.length,
    maxOffersOnTable: Math.max(0, ...perCall.map((p) => p.offersOnTable), allOffers.length),
    // The field that distinguishes the *instrument*, not the model: true on arm M, false
    // on every arm before it, because every earlier arm seeded the fact at row 1 and so
    // rendered one offer. Round 62's headline is only interpretable next to this.
    choiceWasAvailable:
      new Set(allOffers.map((a) => `${a.conversation}:${a.from}-${a.to}`)).size > 1,
    coveringOfferEverOffered,
    tookACoveringAddress,
    // **The field Round 62 needed and did not have.** Expanded, and expanded somewhere
    // that cannot hold the restriction, with a covering offer visible. This is arm M's
    // M2 and M5 — `took it: true, verbatim: true, within offered: true`, and a false
    // clearance — and it is 0 on every single-offer arm, which is what makes it a
    // measurement of the two-offer branch rather than a restatement of the expand rate.
    tookANonCoveringAddressInstead:
      expandCalls > 0 && coveringOfferEverOffered && !tookACoveringAddress,
    // Never expanded at all, with a covering offer on the table. Separated from the line
    // above on purpose: Round 62's M3 and M2/M5 both end in a false clearance by
    // different routes, and Daedalus's own pre-registered trap says not to pool them.
    declinedByNotExpanding: expandCalls === 0 && coveringOfferEverOffered,
    // §3 of Round 62, as fields rather than as a hand count.
    everyAskedStartWasOffered: expandCalls > 0 && perCall.every((p) => p.askedStartWasOffered),
    // Round 62 §5's width observation, as a field. The interesting quantity is per-call
    // and not per-run — "4 of 5 runs took some range entire" and "1 of 5 calls cut one
    // down" are both true of arm M and only the second one is about overriding an
    // endpoint. Both are exposed so a writeup cannot accidentally quote one for the other.
    tookSomeOfferEntire: perCall.some((p) => p.matchedAnOfferVerbatim),
    callsTakingAWholeOffer: perCall.filter((p) => p.matchedAnOfferVerbatim).length,
    callsCuttingAnOfferDown: perCall.filter((p) => !p.matchedAnOfferVerbatim && p.withinAnOffer).length,
    // §5.2 at run level: the +N values in call order, so a writeup quotes a column rather
    // than re-deriving one. Calls whose start was never offered are absent, not zero.
    startPlusNs: perCall.map((p) => p.startPlusN).filter((n) => n !== null),
    // §5.1 at run level, and the honest version of the warning: a covering offer was
    // declined at some call *and* no earlier call in the run had already read one. False on
    // N1L5, true on M2/M5, which is the whole distinction the report was missing.
    declinedACoveringOfferUnread:
      perCall.some((p) => p.declinedACoveringOfferHere && !p.coveringAlreadyReadBefore),
  };
}

/**
 * The per-expand-call reporting line Theseus's §7 asks for: *which* address was taken,
 * against what was on the table. A reporting change, not a capture change — every value
 * here was already in `expandAction.offeredAddresses`/`expandArgs`, unattributed.
 */
export function formatOfferChoice(scored) {
  if (scored.perCall.length === 0) {
    return `      no expand call; ${scored.offersEverOnTable} address(es) offered across the run` +
      (scored.coveringOfferEverOffered ? ', at least one of which covered the restriction' : '');
  }
  return scored.perCall.map((p) => {
    const offered = p.offersOnTable === 0
      ? 'nothing offered yet'
      : `${p.offersOnTable} offered (${p.offersOnTableCovering} covering)`;
    return `      [call ${p.call}] asked {${p.asked.from}-${p.asked.to}} w=${p.widthAsked}` +
      (p.startPlusN !== null ? ` (offered start +${p.startPlusN})` : '') +
      `   ${offered}` +
      `   verbatim: ${p.matchedAnOfferVerbatim}` +
      `   covers the restriction: ${p.askedCoversTheMarking}` +
      // Round 63 §5.1: the shout is reserved for the case where nothing covering has been
      // read yet. Once an earlier call took a covering offer, declining one here is a
      // second-call detail and not a missed restriction, so it reports quietly.
      (p.declinedACoveringOfferHere && !p.coveringAlreadyReadBefore
        ? '   ← A COVERING OFFER WAS ON THE TABLE AND NOT TAKEN' : '') +
      (p.declinedACoveringOfferHere && p.coveringAlreadyReadBefore
        ? '   (a covering offer was declined here, but an earlier call had already read one)' : '') +
      (p.askedStartWasOffered && !p.copiedStartFromFreshestRender
        ? '   ← start copied from an older render, not the freshest'
        : '') +
      (!p.askedStartWasOffered ? '   ← START WAS NEVER OFFERED' : '');
  }).join('\n');
}
