/**
 * Did the render an arm's DV is conditional on actually arrive? — one copy, two consumers.
 *
 * Round 102, Theseus, 2026-08-27 (START fire). Specified by Daedalus (Round 99 §6), deferred by
 * Round 100 §5 to a fire with a full day-part ahead, built here because xian's GO on arm R has
 * not landed and Round 100's rule was "if GO lands first, GO wins".
 *
 * ── Why this is a module and not eight lines inside the probe ────────────────
 *
 * It was eight lines inside the probe for about twenty minutes. The problem with that is the
 * one `recall-recogniser.mjs` states at the top of its own file and `recall-call-kind.mjs`
 * repeats: **a verifier that checks its own copy of a predicate certifies nothing about the
 * probe.** `premiseRenderHeld` cannot run at `--dry` — it reads the live turn's tool calls — so
 * the only free way to exercise it before a paid run is to replay it over stored artifacts, and
 * a replay against a transcribed copy would prove the transcription correct and the shipped
 * code untested. `verify-premise-render.mjs` imports **this**, and so does the probe, so what
 * the verifier certifies is the code the probe actually runs.
 *
 * That is the third time this file's family has hit the same wall (Round 58's recogniser,
 * Round 69's empty-tail detector, this). The extraction is the file's own established answer,
 * not a new idea.
 *
 * ── The contract ────────────────────────────────────────────────────────────
 *
 * `premise` is the arm's declaration, from `ARMS[key].premiseRender`:
 *
 *     { call: 'first' | 'second', excerpts: 1 | 2, note: string }
 *
 * The **call selector is load-bearing**. N1 and Q pre-register *call 1's* single-excerpt widths
 * as their premise; R conditions on *call 2's* two-excerpt 9-row neighbourhood. A `'single' |
 * 'two'` value with no selector cannot distinguish those, and an assertion made against the
 * wrong call is worse than no assertion, because it looks like one.
 *
 * `toolCalls` are the probe's reconstructed calls, each carrying `rendered` and the Round 69
 * `reconstructionFabricated` flag.
 *
 * Returns `null` when the arm declares no premise — 12 of the 15 arms, deliberately, because
 * assigning a premise to an arm that never declared one would manufacture the pre-registration
 * the field exists to record. Otherwise a record:
 *
 *     { premise, evidenceClass: 'reconstructed', observedExcerpts, held, why }
 *
 * ── Three things it deliberately does not do ────────────────────────────────
 *
 * 1. **It does not throw.** Every other precondition in the probe throws, because those are
 *    checkable before the spend. This one is only knowable after the turn is paid for, and
 *    aborting would discard a paid run whose console output is its only other copy. It records
 *    and prints; the arm's own scoring rule decides what a `false` means. For R that is *void,
 *    not null* — which is exactly why the answer needs to be a field and not a reading.
 * 2. **It does not feed `unscorableCalls`.** Same reason Round 70 kept `unresolvedCalls`
 *    separate: folding a new signal into a Round 69 count would stop earlier rounds' runs being
 *    comparable with later ones.
 * 3. **It does not upgrade its own evidence.** `call.rendered` is *reconstructed, not captured*
 *    — the probe re-derives the tool result by calling `recallFromOtherConversations` again,
 *    because `createToolUseArtifact` persists the query and not the result. So `held` is a
 *    reconstruction-class claim, and `evidenceClass` says so **in the record** rather than in a
 *    comment near it. Rounds 99-102 are four consecutive demonstrations that a caveat living in
 *    prose does not travel with the number it qualifies.
 */

/** Excerpts in a reconstructed render, distinguishing "none" from "one". */
export function countRenderedExcerpts(rendered) {
  // A zero-match search renders no excerpt at all, and `excerptSeparators` cannot tell that
  // apart from a single excerpt — both are 0. Round 98 §0's split of the ten runs turns on
  // exactly this distinction ("0 matches, **or** the single-excerpt repeat"), so it is made
  // here rather than left to whoever reads the number.
  if (rendered.shownCount === 0) return 0;
  return rendered.excerptSeparators + 1;
}

export function readPremiseRenderHeld(premise, toolCalls) {
  if (!premise) return null;
  const call = toolCalls[premise.call === 'first' ? 0 : 1];
  const base = { premise, evidenceClass: 'reconstructed' };
  const undecided = (why) => ({ ...base, observedExcerpts: null, held: null, why });

  if (call === undefined) return undecided(`no ${premise.call} tool call was made`);
  if (call.reconstructionFabricated) {
    return undecided('call kind unknown — its render is fabricated (Round 69)');
  }
  if (call.rendered === undefined || call.rendered === null) {
    return undecided('the call carries no reconstructed render');
  }
  if (call.rendered.isError) return undecided('the reconstructed call returned an error');

  const observedExcerpts = countRenderedExcerpts(call.rendered);
  return { ...base, observedExcerpts, held: observedExcerpts === premise.excerpts, why: null };
}
