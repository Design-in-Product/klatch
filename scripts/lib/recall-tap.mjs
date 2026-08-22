/**
 * The tier-two capture: read `toolInput` off the live SSE wire, and score it *against*
 * the artifact row rather than instead of it.
 *
 * Round 70, Theseus, 2026-08-21 (STOP fire). Assigned to me by Daedalus's 8/21 STOP memo
 * §3 — "the server end is proven and free; the probe end is yours" — with two constraints
 * he asked for rather than assumed, both of which are structural here rather than
 * intended:
 *
 *   1. **Failure isolation.** Nothing in this file may fail a run. Every path returns a
 *      status; `startRecallTap().done` never rejects. Its worst case is a missing field,
 *      never a lost opus turn. That is what makes "validate on the first paid run" a
 *      safe plan rather than a gamble.
 *   2. **The silence must be visible in the per-run JSON**, not only in the console of the
 *      fire that produced it, because a later fire reads a stored run and not a console.
 *      `tapSummary()` exists for that.
 *
 * ── What this is for ─────────────────────────────────────────────────────────
 *
 * `createToolUseArtifact` (`db/queries.ts:1526`) persists `input_summary` and nothing else,
 * so the summary string is the whole record of a recall call and `lib/recall-call-kind.mjs`
 * classifies prose. Two distinct calls collapse into one artifact row:
 *
 *   - a model that genuinely called with `query: ""`, and
 *   - a model whose `expand` argument was **dropped** by `readExpandArg` (stringified
 *     numbers, or the Round 68 slot copy) and which therefore routed to search,
 *
 * both record `Searched own conversations: ` exactly. Round 69's detector marks that row
 * for hand adjudication; it cannot diagnose it. The live `tool_use` SSE event *can*:
 * `client.ts:896-903` emits `toolInput: toolUse.input` raw, **four lines before**
 * `executeTool` at `:905` runs `readExpandArg`, so a rejected expand is on the wire intact.
 * `types.ts:400` declares the field; `routes/messages.ts:382` forwards emitter events with
 * `JSON.stringify(event)` and no filter. Daedalus pinned that hop this fire
 * (`round70-tool-input-on-the-sse-wire.test.ts`) after finding it had no test at all.
 *
 * ── Why this reads the wire *against* the artifact and never instead of it ────
 *
 * Daedalus's §2, and it is a correction to a claim of mine. `routes/messages.ts:300-320`
 * (read this session) handles a late subscriber for **liveness**, not for **capture**: a
 * subscriber arriving after the turn settles gets one `message_complete` reconstructed
 * from the DB. No `tool_use` frames are replayed — nothing replays them, and `toolInput`
 * is persisted nowhere. So a lost race yields a body byte-indistinguishable from a turn
 * that called no tool: the same quiet hole the tap exists to close, reproduced one layer
 * up inside the instrument.
 *
 * The rule that follows is a scoring rule, and it is enforced by `alignTapToCalls` rather
 * than written in a docblock a reader skims: **artifact present + no `tool_use` frame =
 * the probe lost the race, not "no expand attempted"**. `status: 'lost-race'` is a
 * distinct value from `status: 'no-calls'` for exactly that reason.
 *
 * ── Neither `readExpandArg` nor the summary grammar is reimplemented here ─────
 *
 * The Round 58 rule. Whether an expand was *accepted* is read from the artifact summary's
 * `kind` (via `recall-call-kind.mjs`, which `verify-empty-tail-detector.mjs` certifies
 * against the real producer). Whether an expand was *present* is read from the frame's raw
 * `toolInput`, which is a key test, not a parse. The verdict is the join of two independent
 * sources, and a copy of `readExpandArg` in this file would have made it one source twice.
 */

/** The one field on the frame that carries the model's raw arguments. */
const RAW_INPUT_FIELD = 'toolInput';

/**
 * Alignment / capture outcomes. Exported so the probe and the tests spell them once.
 *
 * `lost-race` and `no-calls` are deliberately *different* values for the same observed
 * bytes (zero `tool_use` frames). The discriminator is the artifact list, which is why
 * nothing in this file can decide the status without being handed the calls.
 */
export const TAP_STATUS = {
  /** Every artifact row has a frame, and the alignment is unique. */
  CAPTURED: 'captured',
  /** Frames captured for a suffix of the calls, unique alignment. Early calls unresolved. */
  PARTIAL: 'partial',
  /** Artifacts exist, zero frames. Daedalus §2 — do not read this as "no tool call". */
  LOST_RACE: 'lost-race',
  /** No artifacts and no frames. The turn called no tool. Nothing to resolve. */
  NO_CALLS: 'no-calls',
  /** Frames exist but no offset aligns them to the artifact summaries. Attach nothing. */
  MISMATCH: 'mismatch',
  /** More than one offset aligns. Attaching would be a coin flip. Attach nothing. */
  AMBIGUOUS: 'ambiguous',
  /** More frames than artifact rows. Structurally impossible for this tool; attach nothing. */
  SURPLUS: 'surplus-frames',
  /** The subscription threw, timed out, or was aborted. Degrade to pre-tap behaviour. */
  FAILED: 'failed',
  // There is deliberately no `OFF`. A dry run `continue`s before the live turn and never
  // reaches this module, and there is no `--no-tap` flag — so a value for "not run" would
  // be produced by nothing and would read to a later fire as a switch that exists.
};

/**
 * Per-call verdicts the tap can reach that the artifact alone cannot.
 *
 * `QUIET_DROP` is the one worth the whole exercise. It is my Round 69 §2(b) finding — a
 * dropped expand that *also* carried a `query` leaves **no empty tail at all**; it records
 * as `Searched own conversations: depot cipher` and reads as an ordinary successful search.
 * Round 69's detector cannot see it, because there is nothing to see. This is the only
 * instrument that can, and it is a **scoring error** rather than an unscorable row: the
 * call was already scored, and scored wrong.
 */
export const TAP_VERDICT = {
  /** Empty tail + an `expand` key on the wire. The Round 68 dropped-expand path, confirmed. */
  DROPPED_EXPAND: 'dropped-expand',
  /** Empty tail + no `expand` key. A genuine `query: ""`. The other half of the ambiguity. */
  TRUE_EMPTY_SEARCH: 'true-empty-search',
  /** Non-empty query + an `expand` key that `readExpandArg` rejected. See above. */
  QUIET_DROP: 'quiet-drop',
  /** Summary says expand, wire says expand. Accepted, and the two sources agree. */
  ACCEPTED_EXPAND: 'accepted-expand',
  /** An ordinary search: no `expand` key anywhere. */
  PLAIN_SEARCH: 'plain-search',
  /** Summary says expand and the wire carries no `expand` key. Should be unreachable. */
  INCOHERENT: 'incoherent',
  /**
   * A frame **was** captured and the artifact summary is in a vocabulary
   * `readCallKind` cannot parse (`kind: 'unknown'`). Round 72, and it is Daedalus's
   * finding against this file: this used to return `NO_FRAME`, so one value carried
   * "nothing was captured" and "everything was captured and none of it is readable"
   * at once, and the console printed the first over the second.
   *
   * The distinction is worth a value because the two demand opposite actions. `NO_FRAME`
   * means the evidence is *gone* — nothing replays `tool_use` frames — so the artifact
   * is all there will ever be. This means the evidence is *present and in the JSON*
   * (`inputs[i]` → `c.tapInput`) and only the artifact-side reading of it failed. The
   * operator told to "adjudicate by hand" needs to know which of those they are holding.
   *
   * It is deliberately **not** scored. Deciding this row routed to search would be a
   * `readExpandArg` reimplementation — the Round 58 rule, and the same one-source-twice
   * error the join exists to avoid. The tap reports what it holds and stops.
   */
  UNREADABLE_SUMMARY: 'unreadable-summary',
  /** No frame reached this call. Unchanged from pre-tap behaviour, and labelled as such. */
  NO_FRAME: 'no-frame',
};

/**
 * Parse an SSE body into events. Split out from the fetch so it can be driven from a real
 * `Response` produced by the real route in a test, with no network and no server.
 *
 * Frames are kept **unfiltered** here and filtered by the caller: `tool_use` is what the
 * tap wants, but `message_complete` is the terminator and `error` is a real outcome, and a
 * reader that dropped them would hang.
 *
 * @param {ReadableStream<Uint8Array>} body
 * @param {{signal?: AbortSignal}} [opts]
 * @returns {Promise<{events: any[], terminated: boolean}>}
 */
export async function readSseEvents(body, opts = {}) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const events = [];
  let buf = '';
  let terminated = false;
  try {
    while (true) {
      if (opts.signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      // The trailing element is a partial line, not an event. Kept, not parsed —
      // the prior art (`probe-carried-context-chip.mjs:89`) does the same and has
      // run live against this exact endpoint.
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        let ev;
        try {
          ev = JSON.parse(line.slice(5).trim());
        } catch {
          // A partial or non-JSON frame. Skipping is right: the alternative is
          // failing a paid run over a chunk boundary.
          continue;
        }
        events.push(ev);
        if (ev.type === 'message_complete' || ev.type === 'error') terminated = true;
      }
      if (terminated) break;
    }
  } finally {
    // Never allowed to throw: a cancel that rejects would propagate out of a `finally`
    // and turn a successful capture into a failed run.
    try { await reader.cancel(); } catch { /* the socket is already gone */ }
  }
  return { events, terminated };
}

/**
 * Subscribe to `GET /messages/:id/stream` and collect the tool-use frames.
 *
 * **Never rejects.** Constraint 1 of Daedalus's §3, and the reason the whole body is inside
 * one `try`: the probe calls this between a POST that has already been billed and a
 * `settle()` that will succeed regardless, so a throw here would discard a paid turn to
 * report a missing field.
 *
 * @param {{
 *   apiBase: string,
 *   messageId: string,
 *   toolName: string,
 *   timeoutMs?: number,
 *   fetchImpl?: typeof fetch,
 * }} opts
 * @returns {{done: Promise<{frames: any[], status: string, reason: string|null, terminated: boolean}>, abort: () => void}}
 */
export function startRecallTap(opts) {
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000;
  const doFetch = opts.fetchImpl ?? fetch;
  let timer = null;

  const done = (async () => {
    const out = { frames: [], status: TAP_STATUS.FAILED, reason: null, terminated: false };
    try {
      timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await doFetch(`${opts.apiBase}/messages/${opts.messageId}/stream`, {
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        out.reason = `stream subscribe → ${res.status}`;
        return out;
      }
      const { events, terminated } = await readSseEvents(res.body, { signal: controller.signal });
      out.terminated = terminated;
      out.frames = events.filter((e) => e.type === 'tool_use' && e.toolName === opts.toolName);
      // Status here is only about *capture*, not about alignment: this function has not
      // been shown the artifact rows and therefore cannot tell `lost-race` from
      // `no-calls`. `alignTapToCalls` decides that. Saying so in code rather than in
      // prose is the point — a `status` set here would be the wrong one half the time.
      out.status = null;
      out.reason = terminated ? null : 'stream ended without message_complete';
      return out;
    } catch (err) {
      out.reason = controller.signal.aborted
        ? `tap aborted after ${timeoutMs}ms or by the probe`
        : `tap threw: ${err?.message ?? String(err)}`;
      return out;
    } finally {
      if (timer) clearTimeout(timer);
    }
  })();

  return { done, abort: () => controller.abort() };
}

/**
 * Join captured frames to artifact-derived calls, or refuse to.
 *
 * The join is **positional, verified by summary equality, and required to be unique**. All
 * three of those are load-bearing, and the reason is the same case in each:
 *
 *   - *Positional*, because `client.ts` emits and then executes inside one sequential loop
 *     (emit `:896`, `createToolUseArtifact` reached at `:905`), so the two lists are written
 *     in the same order.
 *   - *Verified by summary*, because the frame carries `inputSummary` computed by the very
 *     same `toolUseInputSummary(name, input)` call the artifact will store
 *     (`client.ts:892` and `:658`) — byte-identical by construction, so a disagreement is
 *     real evidence of drift and not a formatting difference.
 *   - *Unique*, because a late subscriber loses a **prefix** of the frames, and two calls
 *     can share a summary while differing in exactly the way the tap exists to detect:
 *     `{expand: {from: '12', …}}` and `{query: ''}` both render `Searched own
 *     conversations: `. Guessing an offset between two identical summaries would answer the
 *     tap's own question by coin flip. If more than one offset fits, attach nothing.
 *
 * Refusing to attach is always safe: the call keeps `NO_FRAME` and scores exactly as it did
 * before this file existed.
 *
 * @param {any[]} frames tool_use frames, wire order, already filtered to the recall tool
 * @param {Array<{inputSummary: string}>} calls artifact-derived calls, route-write order
 * @param {{captureFailed?: boolean, captureReason?: string|null}} [capture]
 * @returns {{status: string, reason: string|null, offset: number|null, verdicts: string[], inputs: (any|null)[]}}
 */
export function alignTapToCalls(frames, calls, capture = {}) {
  const none = (status, reason) => ({
    status,
    reason,
    offset: null,
    verdicts: calls.map(() => TAP_VERDICT.NO_FRAME),
    inputs: calls.map(() => null),
  });

  if (capture.captureFailed) {
    return none(TAP_STATUS.FAILED, capture.captureReason ?? 'capture failed');
  }
  if (calls.length === 0) {
    return none(
      TAP_STATUS.NO_CALLS,
      frames.length ? `${frames.length} frame(s) with no artifact row` : null,
    );
  }
  if (frames.length === 0) {
    // Daedalus §2. This is the sentence the whole scoring rule is: it is *not*
    // "no expand attempted", and the two are byte-identical on the wire.
    return none(
      TAP_STATUS.LOST_RACE,
      `${calls.length} artifact row(s) and no tool_use frame — the probe lost the `
      + 'subscribe race. Nothing replays tool_use frames and toolInput is persisted '
      + 'nowhere, so this is silence, not evidence of absence.',
    );
  }
  if (frames.length > calls.length) {
    return none(
      TAP_STATUS.SURPLUS,
      `${frames.length} frame(s) for ${calls.length} artifact row(s)`,
    );
  }

  const offsets = [];
  for (let k = 0; k + frames.length <= calls.length; k++) {
    if (frames.every((f, i) => f.inputSummary === calls[k + i].inputSummary)) offsets.push(k);
  }
  if (offsets.length === 0) {
    return none(TAP_STATUS.MISMATCH, 'no offset aligns frame summaries to artifact summaries');
  }
  if (offsets.length > 1) {
    return none(
      TAP_STATUS.AMBIGUOUS,
      `${offsets.length} offsets align (${offsets.join(', ')}) — repeated summaries make the `
      + 'join a coin flip, and the two candidates can differ in exactly the way the tap '
      + 'exists to detect. Attaching nothing.',
    );
  }

  const offset = offsets[0];
  const verdicts = calls.map(() => TAP_VERDICT.NO_FRAME);
  const inputs = calls.map(() => null);
  for (let i = 0; i < frames.length; i++) {
    inputs[offset + i] = frames[i][RAW_INPUT_FIELD] ?? null;
    verdicts[offset + i] = readTapVerdict(calls[offset + i], frames[i][RAW_INPUT_FIELD]);
  }

  const full = frames.length === calls.length;
  return {
    status: full ? TAP_STATUS.CAPTURED : TAP_STATUS.PARTIAL,
    reason: full ? null
      : `${frames.length} of ${calls.length} call(s) captured, aligned at offset ${offset}`,
    offset,
    verdicts,
    inputs,
  };
}

/**
 * The verdict for one call, from two independent sources.
 *
 * `call.kind` / `call.noQuery` come from the *artifact* summary, i.e. from what
 * `readExpandArg` decided. `toolInput` is what the model actually sent, captured before
 * that decision was taken. Neither is derived from the other, which is the only reason the
 * join says anything: a reimplementation of `readExpandArg` here would have produced two
 * views of one source and agreed with itself.
 *
 * @param {{kind: string, noQuery: boolean, query: string}} call
 * @param {unknown} toolInput
 */
export function readTapVerdict(call, toolInput) {
  if (toolInput === null || toolInput === undefined) return TAP_VERDICT.NO_FRAME;
  // A key test, not a parse. `expand: null` or `expand: {}` still counts as *present*:
  // the model reached for the argument and did not get it, which is the thing being
  // counted. Whether it was well-formed is precisely what `kind` already answers.
  const expandPresent = typeof toolInput === 'object' && 'expand' in toolInput;

  if (call.kind === 'expand') {
    return expandPresent ? TAP_VERDICT.ACCEPTED_EXPAND : TAP_VERDICT.INCOHERENT;
  }
  // Neither `expand` nor `search`, and `toolInput` is non-null by the guard above — so
  // this is `kind: 'unknown'` *with* a frame in hand. Round 72: this used to fall through
  // to `NO_FRAME` and tell the operator the evidence had not arrived while holding it.
  if (call.kind !== 'search') return TAP_VERDICT.UNREADABLE_SUMMARY;
  if (call.noQuery) {
    return expandPresent ? TAP_VERDICT.DROPPED_EXPAND : TAP_VERDICT.TRUE_EMPTY_SEARCH;
  }
  return expandPresent ? TAP_VERDICT.QUIET_DROP : TAP_VERDICT.PLAIN_SEARCH;
}

/**
 * The run-level record the per-run JSON carries, and the console prints.
 *
 * Constraint 2 of Daedalus's §3: the lost-race silence has to be legible to a fire that
 * reads a stored run months later and never saw this console. Every field below is a
 * *reason a number should not be quoted*, not a dependent variable, and `notADv` says so
 * inside the artifact itself so a later reader cannot mistake it for one.
 *
 * @param {{status: string, reason: string|null, verdicts: string[]}} alignment
 * @param {Array<{noQuery: boolean, kind: string}>} calls
 */
export function tapSummary(alignment, calls) {
  const count = (v) => alignment.verdicts.filter((x) => x === v).length;
  // Round 69's `unscorableCalls` predicate, spelled again here rather than imported,
  // because this must keep meaning "the rows Round 69 flagged" even if that predicate
  // later moves. The count itself is *not* recomputed for the probe — the probe keeps
  // its own, unchanged, so Round 69's number stays comparable across rounds.
  const flagged = calls
    .map((c, i) => ({ i, flagged: c.noQuery || c.kind === 'unknown' }))
    .filter((x) => x.flagged);
  // Round 72, and §1's rule applied to §2's fix: `UNREADABLE_SUMMARY` is a *new reason
  // string*, not a new resolution. The tap holding the bytes is not the tap adjudicating
  // the row — it declined to, deliberately — so `resolvedByTap` must not move, or the
  // "the tap can only ever reduce unscorability" invariant becomes a claim instead of a
  // guarantee. Spelled as an explicit predicate rather than `!== NO_FRAME` because the
  // next verdict added would otherwise inherit "resolved" by default.
  const adjudicated = (v) => v !== TAP_VERDICT.NO_FRAME && v !== TAP_VERDICT.UNREADABLE_SUMMARY;
  const resolved = flagged.filter((x) => adjudicated(alignment.verdicts[x.i]));

  return {
    notADv: 'instrument health, not a dependent variable — see lib/recall-tap.mjs',
    status: alignment.status,
    reason: alignment.reason,
    offset: alignment.offset,
    verdicts: alignment.verdicts,
    /** Round 69 rows the tap could adjudicate. The tap can only ever *reduce* this. */
    flaggedCalls: flagged.length,
    resolvedByTap: resolved.length,
    unresolvedCalls: flagged.length - resolved.length,
    /** The Round 69 §2(b) path. Not an unscorable row — an *already mis-scored* one. */
    quietDropCalls: count(TAP_VERDICT.QUIET_DROP),
    droppedExpandCalls: count(TAP_VERDICT.DROPPED_EXPAND),
    trueEmptySearches: count(TAP_VERDICT.TRUE_EMPTY_SEARCH),
    incoherentCalls: count(TAP_VERDICT.INCOHERENT),
    /**
     * Additive, Round 72. A subset of `unresolvedCalls` — every row with this verdict has
     * `kind: 'unknown'` and is therefore already in `flagged`, so the two split cleanly:
     * `unresolvedCalls - unreadableSummaryCalls` is the count that genuinely saw no frame.
     * No existing count changes value.
     */
    unreadableSummaryCalls: count(TAP_VERDICT.UNREADABLE_SUMMARY),
  };
}

/**
 * Console lines for a run. Returned rather than logged, the same contract
 * `callKindWarning` keeps: the probe owns its output stream and a test can assert on this.
 *
 * @param {ReturnType<typeof tapSummary>} summary
 * @returns {string[]}
 */
export function tapWarnings(summary) {
  const out = [];
  if (summary.status === TAP_STATUS.LOST_RACE) {
    out.push('← TAP LOST THE RACE: tool calls happened and no tool_use frame was captured. '
      + 'This is silence, NOT "no expand attempted" — nothing replays those frames. '
      + 'Score every call in this run from the artifact alone.');
  }
  if (summary.status === TAP_STATUS.FAILED) {
    out.push(`← TAP FAILED (${summary.reason}). Run degraded to pre-Round-70 scoring; `
      + 'no call was harmed and no number below depends on the tap.');
  }
  if (summary.status === TAP_STATUS.AMBIGUOUS || summary.status === TAP_STATUS.MISMATCH
      || summary.status === TAP_STATUS.SURPLUS) {
    out.push(`← TAP NOT JOINED (${summary.status}): ${summary.reason}. Attached nothing, `
      + 'deliberately — a wrong join answers the tap\'s own question by coin flip.');
  }
  if (summary.quietDropCalls > 0) {
    out.push(`← ${summary.quietDropCalls} QUIET DROP(S): a call carried an expand argument `
      + 'that was rejected AND a non-empty query, so it recorded as an ordinary successful '
      + 'search and left no empty tail. These rows are MIS-SCORED, not unscorable. '
      + 'Hand-adjudicate before quoting any per-call number for this arm.');
  }
  if (summary.incoherentCalls > 0) {
    out.push(`← ${summary.incoherentCalls} INCOHERENT CALL(S): the artifact says expand and `
      + 'the wire carries no expand key. Should be unreachable; treat as instrument drift.');
  }
  // Round 74, and it is a defect in Round 72's own fix: this line used to end
  // "Producer-side grammar drift is the likely cause." Round 72's *other* half had already
  // disproved that as the sole cause — the branch fires on a LOOSE ARGUMENT with today's
  // producer unchanged, because `readExpandArg` accepts any string name and any number
  // position where `EXPAND_SUMMARY` needs a non-empty name and non-negative integers. An
  // operator sent to the summary grammar goes to the wrong file for the case that is
  // reachable now. Both causes are named, argument-first, because that is the order in
  // which they can be checked and the order of their likelihood today.
  //
  // The discriminator is stated rather than computed: applying it here would mean reading
  // `tapInput.expand` and deciding whether the arguments are well-formed, which is the
  // `readExpandArg` reimplementation the whole join exists to refuse (Round 58). The tap
  // hands the operator the bytes and the test to run on them, and stops.
  if (summary.unreadableSummaryCalls > 0) {
    out.push(`← ${summary.unreadableSummaryCalls} UNREADABLE SUMMARY: the tap CAPTURED a `
      + 'frame for these calls and the artifact summary is in a vocabulary the classifier '
      + 'does not recognise, so the tap declined to adjudicate rather than guess. The raw '
      + 'arguments the model sent ARE in this run\'s JSON (`tapInput`) — adjudicate from '
      + 'those, not from the summary. Two causes produce this and they need different '
      + 'responses. Check `tapInput.expand` FIRST: a LOOSE ARGUMENT the model sent (an '
      + 'empty or blank conversation name, a negative or fractional position) renders into '
      + 'a summary the classifier cannot parse with no producer change at all. Only if '
      + 'those arguments are well-formed has the producer\'s summary grammar drifted.');
  }
  // The remainder, and the subtraction is the point: before Round 72 this line printed
  // "no frame reached them" over rows whose frame the same run had just captured and
  // stored. Both halves stay visible and they still sum to `unresolvedCalls`.
  const noFrame = summary.unresolvedCalls - (summary.unreadableSummaryCalls ?? 0);
  if (noFrame > 0) {
    out.push(`← ${noFrame} flagged call(s) the tap could not adjudicate `
      + '(no frame reached them). Unchanged from Round 69: adjudicate by hand.');
  }
  return out;
}
