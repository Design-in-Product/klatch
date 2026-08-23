/**
 * How a recall tool call was *recorded* — one copy, two consumers.
 *
 * Round 69, Theseus, 2026-08-21 (WORK fire). Extracted from the inline block in
 * `probe-recall-tool.mjs` (the `EXPAND_SUMMARY` regex and the `.replace()` that follows
 * it) at the same time as the empty-tail detector was added, for the reason
 * `recall-recogniser.mjs` gives at the top of its own file: a verifier that checks its
 * own copy of a recogniser certifies nothing about the probe. `verify-empty-tail-detector.mjs`
 * imports **this**, so what it certifies is the code the probe actually runs.
 *
 * ── What this reads, and why that is the only thing available ────────────────
 *
 * `createToolUseArtifact` (`db/queries.ts:1526`) writes `id, message_id, type, tool_name,
 * input_summary, created_at` and nothing else — read this session, not recalled. The raw
 * `toolInput` the model supplied is **not persisted anywhere**. So for a probe that reads
 * settled messages back over REST, the summary string *is* the record of the call, and
 * every classification below is a classification of prose.
 *
 * The producer is `toolUseInputSummary` (`client.ts:614`):
 *
 *     expand ? `Expanded own conversation: ${conversation} ${from}–${to}`
 *            : `Searched own conversations: ${String(toolInput.query ?? '')}`
 *
 * where `expand` is `readExpandArg`'s output — `undefined` unless `conversation` is a
 * string **and** `from`/`to` are both numbers.
 *
 * ── The detector ─────────────────────────────────────────────────────────────
 *
 * `noQuery` is true when the summary is **exactly** the search prefix: an empty tail.
 * That is the recorded signature of a call in which no query text was supplied, and the
 * reason it is worth a named field rather than a `query === ''` check at the call site is
 * that it is the *only* trace a **mis-addressed expand** leaves.
 *
 * A caller that fills the tool call from the malformed-address error's slot form
 * (`{conversation: "<name>", from: <first position>, to: <last position>}`, `recall.ts:698`
 * as of `8362d3c`) emits strings where numbers are typed. `readExpandArg` returns
 * `undefined`, the expand argument is dropped **whole**, `executeTool` routes to
 * `recallFromOtherConversations`, and the row that lands in `message_artifacts` reads
 * `Searched own conversations: ` — an ordinary empty search. Pinned in
 * `round56-recall-expand.test.ts`, "records a slot-shaped expand as a search…".
 *
 * **Necessary, not sufficient, and the file says so where the field is defined.** An empty
 * tail is also what a model that genuinely called with `query: ""` produces. The two are
 * indistinguishable *in the artifact*. They are distinguishable on the wire — the live
 * `tool_use` SSE event carries `toolInput` verbatim (`client.ts:901`, declared at
 * `types.ts:400`, forwarded unmodified by `messages.ts:382`) — but nothing subscribes to
 * that stream in the probe today. See `docs/research/round69-…` §4 for the specified,
 * deliberately-unbuilt tier-2 capture.
 *
 * So the contract is: `noQuery` marks a call whose scoring must be **adjudicated by hand**,
 * not a call that has been diagnosed.
 *
 * ── Why `kind` did not grow a third value ────────────────────────────────────
 *
 * `kind` is consumed by `lib/offer-choice.mjs` and by five branches in the probe, and its
 * two values have been scored the same way since Round 56. Adding `'noQuery'` as a kind
 * would change what those branches see for a case that has occurred in past rounds without
 * being labelled, which is a mid-experiment instrument change of exactly the sort Round 58
 * existed to refuse. `noQuery` is therefore an **additive flag**, and `hitTheAnswer` keeps
 * its Round 56 value (`false`) on an empty query — same rule `referentAmbiguity` followed
 * at arm L and `offerChoice` at Round 63.
 */

/** The producer's two prefixes, spelled here once. */
export const SEARCH_PREFIX = 'Searched own conversations: ';
export const EXPAND_PREFIX = 'Expanded own conversation: ';

/**
 * The expand form, **byte-identical to the regex `probe-recall-tool.mjs` carried before this
 * extraction**, so the swap is provably inert rather than argued to be. En dash, not hyphen.
 */
export const EXPAND_SUMMARY = /^Expanded own conversation:\s+(.+)\s+(\d+)–(\d+)$/;

/**
 * @param {unknown} inputSummary the artifact's `inputSummary`, as stored.
 * @returns {{
 *   inputSummary: string,
 *   kind: 'expand' | 'search' | 'unknown',
 *   query: string,
 *   expand: {conversation: string, from: number, to: number} | null,
 *   noQuery: boolean,
 *   blankQuery: boolean,
 * }}
 */
export function readCallKind(inputSummary) {
  const summary = String(inputSummary ?? '');

  const m = summary.match(EXPAND_SUMMARY);
  if (m) {
    return {
      inputSummary: summary,
      kind: 'expand',
      query: '',
      expand: { conversation: m[1], from: Number(m[2]), to: Number(m[3]) },
      noQuery: false,
      blankQuery: false,
    };
  }

  if (summary.startsWith(SEARCH_PREFIX)) {
    // `\s*` rather than a prefix slice, kept from the probe so the extraction changes no
    // measurement: a query with leading whitespace tokenizes the same either way, and
    // freezing the old behaviour is worth more than tidying it mid-experiment.
    const query = summary.replace(/^Searched own conversations:\s*/, '');
    return {
      inputSummary: summary,
      kind: 'search',
      query,
      expand: null,
      // Exact, and deliberately **not** `query === ''`: the strip above also empties a
      // whitespace-only query, and that one cannot have come from the dropped-expand path
      // in the same way. Kept apart so the near-neighbour does not dilute the signal.
      noQuery: summary === SEARCH_PREFIX,
      blankQuery: query === '' && summary !== SEARCH_PREFIX,
    };
  }

  // Neither form. **Reachable against today's producer** — Round 76 (Theseus, 2026-08-22
  // STOP), correcting this comment's own Round 69 claim that it was not.
  // `toolUseInputSummary` (`client.ts:621`) interpolates the model's raw arguments, and
  // `readExpandArg` (`client.ts:599`) accepts any `string` name with any two `number`
  // positions, while `EXPAND_SUMMARY` demands a non-empty name and two *unsigned integers*.
  // So `{conversation: '', from: 12, to: 38}` lands here — one space short of the match —
  // and so do `from: -1` and `to: 3.5`, all three from the shipped expand mode, with no
  // producer change and no third mode. Pinned through the real producer by
  // `round71-probe-tap-joins-the-wire-to-the-artifact.test.ts` — the test named `says
  // "captured but unreadable" for a frame it holds…`, whose assertion message is "the live
  // producer reaches the unknown branch on data alone" — and byte-exact for the two shapes by
  // `round56-recall-expand.test.ts`'s Round 73 pair at `:1078` and `:1098` — verified this
  // fire by clamping and flooring the renderer as a control, which turns exactly those two
  // red and nothing else.
  //
  // Why this was worth correcting rather than deleting. `tapWarnings` tells an operator
  // that an UNREADABLE SUMMARY row is a model-side loose argument, to be looked up in
  // `tapInput`. This comment told a reader of the classifier that the branch cannot fire
  // against today's producer at all — that any nonzero count is an instrument fault. Two
  // halves of one instrument, routing the same row to opposite files. That is the Round
  // 72/74/75 failure class exactly, and it was found by reading one file deeper rather than
  // one word further in — which is the reason to keep reading, not a sign of convergence.
  //
  // The third-mode rationale is untouched and remains the *second* reason to have the
  // branch: the block this replaced fell through to `kind: 'search'` for *anything* that was
  // not an expand, which means a third recall mode shipping a third summary vocabulary
  // would have been handed to the tokenizer as a query consisting of its own prose and
  // scored as a keyword miss. That is the same confusion the probe's Round 56 comment says
  // the anchored pattern exists to avoid, one mode further out.
  return {
    inputSummary: summary,
    kind: 'unknown',
    query: '',
    expand: null,
    noQuery: false,
    blankQuery: false,
  };
}

/**
 * The one-line warning a run prints when a call left no query behind. Returned rather than
 * logged so the probe owns its own output stream, and so the verifier can assert on it.
 *
 * @param {ReturnType<typeof readCallKind>} call
 * @returns {string | null}
 */
export function callKindWarning(call) {
  if (call.kind === 'unknown') {
    return '← UNRECOGNISED SUMMARY VOCABULARY: not scorable as a search or an expand';
  }
  if (call.noQuery) {
    return '← EMPTY TAIL: no query text was supplied. A dropped (mis-typed) expand argument '
      + 'records exactly this. Adjudicate by hand before scoring as a search miss.';
  }
  if (call.blankQuery) {
    return '← WHITESPACE-ONLY QUERY: zero tokens, and not the empty-tail signature.';
  }
  return null;
}
