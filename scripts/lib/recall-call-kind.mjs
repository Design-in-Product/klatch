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

  // Neither form. Unreachable against today's producer — and that is the point of having
  // it. The block this replaced fell through to `kind: 'search'` for *anything* that was
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
