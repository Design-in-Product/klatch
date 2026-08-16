import type { Channel, Entity } from '@klatch/shared';
import {
  countEntityTranscript,
  findEntityTranscriptChannelsByName,
  getEntityTranscriptNeighbourhoods,
  getEntityTranscriptRange,
  type NeighbourhoodMessage,
} from '../db/queries.js';
import {
  CARRIED_CONTEXT_MAX_MESSAGE_CHARS,
  RECALL_TOOL_NAME,
  formatTranscriptLine,
} from './carried-context.js';

export { RECALL_TOOL_NAME };

/**
 * Continuity increment #3, option (c) — on-demand deep retrieval.
 *
 * Layer 6 (`carried-context.ts`) is the floor: the most recent 20 messages from
 * an agent's other conversations, assembled unconditionally, deterministic per
 * turn. It guarantees an agent is never blank. What it cannot do is answer a
 * question about something that happened *below* the window, and its own footer
 * has said so since it shipped — "there is more than this… say so rather than
 * assuming it did not happen". That sentence was the honest placeholder for
 * this file.
 *
 * xian approved (b) with (c) layered on
 * (`janus-to-daedalus-cc-team-xian-approves-compaction-option-b-2026-08-12.md`).
 * The plan doc's own description of (c) is "the same `getEntityTranscript`
 * behind a tool, unbounded" — and this is that, with one deliberate departure
 * recorded below.
 *
 * **The departure: it is not unbounded.** The same measurement that set the
 * per-message cap in layer 6 applies here unchanged — the largest real message
 * in the March corpus is 64,627 chars, more than twice layer 6's *entire* block
 * budget. An unbounded recall that happened to match that message would return
 * it alone and displace everything else the agent was carrying. So the same
 * per-message cap applies, plus a result budget of its own. "Unbounded" was
 * always shorthand for "not bounded by the recent-N window", which this honours:
 * recall reaches the whole transcript, it just does not return all of it at once.
 *
 * **What (c) costs that (b) does not.** Theseus's argument for (b) was
 * determinism — you can read the assembled prompt and tell whether the agent was
 * given a fact, so a probe can distinguish "didn't know" from "knew and didn't
 * use". A tool call breaks that: the material arrives mid-turn and leaves no
 * trace in the system prompt. `createToolUseArtifact` is the compensation — every
 * recall writes a row carrying the query, so the call is still readable after the
 * stream ends. It is a weaker instrument than reading the prompt, and it is
 * stated here rather than glossed.
 */

/** Default number of matching messages returned when the model names no limit. */
export const RECALL_DEFAULT_LIMIT = 10;

/**
 * Ceiling on `limit`, whatever the model asks for.
 *
 * Not defensive tidiness: `limit` is model-supplied, so this is the only thing
 * standing between a hallucinated `limit: 500` and a 500-row read.
 */
export const RECALL_MAX_LIMIT = 30;

/**
 * Char budget for the assembled tool result.
 *
 * Half of layer 6's 24,000. Recall is additive — it lands on top of a prompt
 * that already carries the seed — so the ceiling that matters is the pair, not
 * this number alone. At the per-message cap of 4,000 this is ~3 full-size
 * messages or ~20 median ones (median 580 chars in the March corpus).
 */
export const RECALL_MAX_CHARS = 12_000;

/**
 * Tokens shorter than this are dropped before matching.
 *
 * A two-character substring matches inside most English words ("in", "at"), so
 * ANDing it in filters nothing while making the match look more specific than
 * it was. Dropping the token is honest; the result text says which terms were
 * actually used so the agent is not told it searched for something it did not.
 */
const RECALL_MIN_TOKEN_CHARS = 3;

/**
 * How many messages either side of a match are returned with it.
 *
 * **Measured, not chosen for roundness.** Theseus's 8/14 probe
 * (`docs/research/round50-recall-tool-live-2026-08-14.md`) ran arms D and E,
 * identical but for whether an owner's restriction sat in the same message as
 * the fact or in its own turn immediately after: D withheld 2/2, E disclosed
 * 3/3, and the restriction in E was *reachable by keyword and never reached*,
 * because an agent asked for a codeword searches for the codeword. In a 1-1 the
 * restriction lands one or two positions after the message a query hits —
 * depending on whether the hit is the ask or the answer — so 2 is the smallest
 * radius that covers the measured case rather than the one it was tuned on.
 *
 * It is not a general fix and must not be described as one: a marking five turns
 * later is still lost. See `getEntityTranscriptNeighbourhoods`.
 */
export const RECALL_NEIGHBOUR_RADIUS = 2;

/** Prefix marking a line that actually contained the search terms. */
const MATCH_MARKER = '▸ ';

/** Separator between excerpts that are not contiguous in the source thread. */
const EXCERPT_SEPARATOR = '\n\n---\n\n';

/**
 * Marks turns that sit inside an excerpt in the source room but are not in this
 * entity's transcript.
 *
 * **Why this is not covered by `EXCERPT_SEPARATOR`.** The separator marks a gap
 * created by *distance* — two matches far enough apart that the radius does not
 * bridge them, which the scoped ordinal reports as a jump. A gap created by
 * *scope* is invisible to that ordinal: `ROW_NUMBER` over the scoped set closes
 * over every removed row, so the two rows either side of a withheld turn come
 * back consecutively numbered and render as one continuous exchange. Theseus
 * measured the result on arm G
 * (`docs/research/round51-neighbourhood-retrieval-live-2026-08-14.md` §3): the
 * agent's own "Confirmed. Noted." followed immediately by a bare "Understood.",
 * with the other agent's restriction between them deleted and nothing saying so.
 * An acknowledgement whose antecedent has been removed, in a shape that asserts
 * adjacency.
 *
 * The scope *policy* is right and this does not change it — an agent still
 * cannot read a message it was not party to. What changes is that the excerpt
 * stops claiming those messages were never there. `groupIntoExcerpts`' own
 * standard, applied one level down: rendering a gap as continuity invents an
 * exchange that never happened.
 *
 * **Deliberately does not say who spoke them.** Practically these are other
 * agents' turns, but the only thing true by construction is that the rows failed
 * the entity-transcript predicate — and this line is read by a model that will
 * reason from whatever it is told, so it states the property the query actually
 * establishes and no more.
 */
function scopeGapLine(count: number): string {
  return (
    `[… ${count} message(s) here are part of that conversation but not of your ` +
    `transcript, and were not read …]`
  );
}

/**
 * Marks the boundary of an excerpt — how much of the conversation lies past it.
 *
 * **This reverses a judgement I made on 8/15 and Theseus measured.** Round 52
 * marked interior gaps only, on the reasoning that a turn before the first row
 * or after the last is outside the radius and already covered by the header's
 * `"Nothing outside these excerpts was read."` That sentence has now been
 * present in four arm-F results across two fires
 * (`docs/research/round51-neighbourhood-retrieval-live-2026-08-14.md`,
 * `docs/research/round53-scope-gap-marker-live-2026-08-15.md` finding 3) and all
 * four asserted absence anyway — verbatim *"No restriction was attached to it
 * there"*, a property of a thirty-message thread stated from three lines, with
 * the owner's restriction four rows past the edge. The sentence is present and
 * it is ignored. The first clause of that judgement is false.
 *
 * The second clause was the real argument and it survives: one marker meaning
 * both "turns were removed from inside this" and "the conversation continues
 * past this" would be less informative than either. So this is a *second*
 * marker, distinguishable by wording and by position, not a widening of
 * `scopeGapLine`.
 *
 * **The two counts are separated because the affordance differs, and the line
 * states the affordance rather than the category.** Turns in the entity's own
 * transcript that this search did not return are reachable — a different query
 * finds them. Turns outside the transcript are unreachable at any radius by any
 * query (`getEntityTranscriptNeighbourhoods`), so no amount of searching will
 * produce them. Collapsing them into one number would tell an agent to go
 * looking for something it can never have.
 *
 * Deliberately does **not** reuse `scopeGapLine`'s "not of your transcript".
 * That phrase is what the interior header sentence quotes, and that sentence
 * says "the lines either side of it are not consecutive" — a claim with no
 * referent at an edge, where there is only one side. Two markers with two
 * vocabularies, which is the whole point of it being a second marker.
 *
 * **The specific way this can fail, and it is not the way the interior marker
 * could fail.** The interior marker is rare, so it is salient where it appears.
 * An edge marker renders on nearly every excerpt that is not flush with the
 * start or end of its conversation — which is most of them. Ubiquity is the
 * property that made the header sentence ignorable, and this line has it. What
 * it has that the header does not is a number and a position; whether that is
 * the load-bearing difference is exactly what Theseus's arm F would measure, and
 * it is not measured here. Shipped as a testable proposition, on his ask.
 *
 * **Round 56 amends the reachable clause, and the amendment is Theseus's
 * measurement rather than my second thought.** Arm F came back null 4/5 on the
 * Round 54 build — but the clause *acted*: 2 of 5 runs issued an unprompted
 * query aimed at the hidden restriction
 * (`docs/research/round55-excerpt-edge-marker-live-2026-08-15.md` §2), a shape
 * that appears nowhere in Rounds 50, 51 or 53. Both returned zero rows and both
 * had to — terms are ANDed and the restriction shares no distinctive word with
 * the question that provoked the search. In F/R4 the failed search then served
 * as the warrant for the same false absence claim, which is a worse outcome than
 * the passive version: *"a different search of yours could reach"* named an
 * affordance the agent does not have.
 *
 * So the clause now hands over the address it already knows instead of a number
 * and an instruction to go guessing. The range is in the same scoped ordinal the
 * count is computed in — `ownCount` is exactly `to - from + 1` by construction,
 * which `round56-recall-expand.test.ts` pins — and the conversation is named the
 * way every rendered line already labels it. The unreachable clause is
 * deliberately left saying nothing can reach those turns, because nothing can:
 * they have no ordinal in this entity's numbering to name.
 */
function edgeGapLine(
  side: 'earlier' | 'later',
  ownCount: number,
  outOfScopeCount: number,
  address: { conversation: string; from: number; to: number } | undefined,
): string | undefined {
  const clauses: string[] = [];
  if (ownCount > 0) {
    clauses.push(
      address !== undefined
        ? `${ownCount} you can read — ask for them with expand ` +
          `{conversation: "${address.conversation}", from: ${address.from}, to: ${address.to}}`
        : `${ownCount} that a different search of yours could reach`
    );
  }
  if (outOfScopeCount > 0) {
    clauses.push(`${outOfScopeCount} that no search of yours can reach`);
  }
  if (clauses.length === 0) return undefined;
  const total = ownCount + outOfScopeCount;
  return (
    `[… ${total} ${side} message(s) in this conversation, not shown here: ` +
    `${clauses.join('; ')} …]`
  );
}

/**
 * Function words dropped before matching.
 *
 * **This is load-bearing, not tidying.** Terms are ANDed, so every surviving
 * token must appear in the matching message. A model that asks
 * `"what was the codeword you gave me"` — which the tool description tells it
 * not to do, and which it will sometimes do anyway — would otherwise require
 * `what`, `was`, `the`, `you`, `gave` *and* `codeword` in one message, and the
 * message that actually holds the answer ("the rollback codeword is
 * basalt-heron-72") contains two of the six. The search would return nothing and
 * the agent would report that it looked and found nothing, which is the exact
 * failure mode this whole increment exists to avoid.
 *
 * Deliberately conservative: function words and the vocabulary of *asking*
 * only. Nothing here is plausible as the distinctive term of a real search.
 * Words that could be — `note`, `plan`, `file`, `name` — are left in, because
 * wrongly dropping a content word silently widens the result set, and a search
 * that quietly matches more than it was asked for is harder to notice than one
 * that matches less.
 */
const RECALL_STOPWORDS = new Set([
  'the', 'and', 'but', 'for', 'not', 'you', 'your', 'yours', 'our', 'ours',
  'was', 'were', 'are', 'been', 'being', 'has', 'have', 'had', 'did', 'does',
  'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must',
  'that', 'this', 'these', 'those', 'there', 'here', 'they', 'them', 'their',
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'with', 'from', 'into', 'onto', 'out', 'over', 'under', 'about', 'again',
  'any', 'all', 'some', 'ask', 'asked', 'tell', 'told', 'said', 'say', 'says',
  'please', 'about',
]);

/**
 * Split a model-supplied query into matchable tokens.
 *
 * Deliberately crude, and the crudeness is disclosed to the model in the tool
 * description rather than hidden behind it. Splitting on non-word characters and
 * ANDing the survivors means "the Q3 launch budget" matches a message containing
 * both `launch` and `budget` in any order — which is what a model phrasing a
 * natural-language query actually wants, and what a single whole-string `LIKE`
 * would fail to find.
 *
 * Short tokens go for a different reason than stopwords: a two-character
 * substring matches inside most English words ("in", "at"), so ANDing it filters
 * nothing while making the match look more specific than it was.
 */
export function tokenizeRecallQuery(query: string): string[] {
  return [...new Set(
    query
      .split(/[^\p{L}\p{N}_-]+/u)
      .map((t) => t.trim())
      .filter((t) => t.length >= RECALL_MIN_TOKEN_CHARS)
      .filter((t) => !RECALL_STOPWORDS.has(t.toLowerCase()))
  )];
}

export interface RecallRequest {
  query: string;
  limit?: number;
}

export interface RecallResult {
  /** The text handed back to the model as the tool result. */
  text: string;
  /** True when the request could not be run at all (bad query). */
  isError: boolean;
  /** Total rows matching, ignoring the limit and the char budget. */
  matchCount: number;
  /** Rows actually rendered into `text`. */
  shownCount: number;
  /** The tokens the search actually used, after short ones were dropped. */
  tokens: string[];
}

/**
 * Search an entity's own transcript outside the current room.
 *
 * Scope is the entity and only the entity: `getEntityTranscript(entity.id, …)`
 * is the same membership-based union layer 6 reads, so an agent can reach what
 * it said and what was said to it, and nothing from a room it was never in.
 * That is the retrieval policy, and it is a property of the query rather than a
 * filter applied afterwards.
 */
export function recallFromOtherConversations(
  entity: Entity,
  channel: Channel | undefined,
  request: RecallRequest,
): RecallResult {
  const tokens = tokenizeRecallQuery(request.query || '');

  if (tokens.length === 0) {
    return {
      text:
        `No searchable terms in "${request.query}". This tool matches literal ` +
        `words in your own messages — pass distinctive keywords (a name, a ` +
        `filename, an unusual noun) rather than a question.`,
      isError: true,
      matchCount: 0,
      shownCount: 0,
      tokens,
    };
  }

  const limit = Math.min(
    Math.max(1, Math.floor(request.limit ?? RECALL_DEFAULT_LIMIT)),
    RECALL_MAX_LIMIT,
  );

  const options = {
    ...(channel ? { excludeChannelId: channel.id } : {}),
    search: tokens,
  };

  const matchCount = countEntityTranscript(entity.id, options);
  const rows = getEntityTranscriptNeighbourhoods(entity.id, {
    ...options,
    limit,
    neighbourRadius: RECALL_NEIGHBOUR_RADIUS,
  });

  const termList = tokens.map((t) => `"${t}"`).join(' + ');

  if (rows.length === 0) {
    // A miss on an ANDed query is ambiguous — the material may be absent, or one
    // stray term may have excluded it. The stopword list removes the common
    // noise, but not every non-distinctive word ("gave", "mentioned") is a
    // function word, and dropping content words on suspicion would silently
    // widen the search instead. So the narrowing is *disclosed* and the retry is
    // handed to the caller, who is the one that knows which of its own terms
    // were incidental. Ranked partial matching is the better answer and it
    // belongs with Step 11 (Search), which owns a real index; this is the
    // smallest thing that does not mislead.
    const advice = tokens.length > 1
      ? ` All ${tokens.length} terms had to appear in the same message — if one of ` +
        `them was incidental, search again with only the distinctive ones.`
      : '';
    return {
      text:
        `No messages in your other conversations contain ${termList}.${advice} ` +
        `This matched literal words, so a different phrasing may still find it — ` +
        `and a miss here is not evidence the thing did not happen.`,
      isError: false,
      matchCount: 0,
      shownCount: 0,
      tokens,
    };
  }

  // Excerpts newest-first into the budget so a tight budget drops the *oldest*
  // ones, then restored to chronological order for reading — the same recency
  // bias layer 6 applies, for the same reason.
  //
  // The unit is the excerpt, not the line, and that is the whole point: an
  // excerpt half-shown could drop exactly the neighbouring turn the radius was
  // added to carry, which would reproduce the arm-E failure at the budget
  // boundary instead of at the query.
  const excerpts = groupIntoExcerpts(rows);
  const keptExcerpts: NeighbourhoodMessage[][] = [];
  const strippedLines: string[] = [];
  let shownMatches = 0;
  let strippedExcerpts = 0;
  let used = 0;

  for (let i = excerpts.length - 1; i >= 0; i--) {
    const excerpt = excerpts[i];
    // Measured against the conversation boundary on both sides. The final render
    // may use a neighbouring kept excerpt instead, which changes the *numbers* in
    // an edge line but never whether one is emitted: two excerpts in the same
    // channel are split precisely because rows lie between them, so the count is
    // non-zero under either reference. The residual error is the width of a
    // couple of integers, and it is stated here rather than left to be found.
    const block = renderExcerpt(excerpt, entity.name, undefined, undefined).join('\n\n');

    if (used + block.length <= RECALL_MAX_CHARS) {
      keptExcerpts.push(excerpt);
      used += block.length;
      shownMatches += excerpt.filter((m) => m.isMatch).length;
      continue;
    }

    // Nothing kept yet and the newest excerpt alone overruns: fall back to its
    // match lines only rather than blow the budget. Degrading to the pre-Round-51
    // shape is the right failure — a match with no context is what the tool used
    // to return, and a bounded honest result beats an unbounded complete one.
    //
    // No edge markers on this path, deliberately: the neighbours are gone, so
    // every line is its own boundary and a marker between each pair would say
    // little the `strippedExcerpts` sentence does not already say outright.
    if (keptExcerpts.length === 0) {
      const matchLines = excerpt.filter((m) => m.isMatch);
      for (const m of matchLines) {
        const line = renderLine(m, entity.name);
        if (used + line.length > RECALL_MAX_CHARS && strippedLines.length > 0) break;
        strippedLines.push(line);
        used += line.length;
        shownMatches += 1;
      }
      if (matchLines.length < excerpt.length) strippedExcerpts += 1;
    }
    break;
  }
  keptExcerpts.reverse();

  // Second pass. The edge markers need to know which excerpts survived the
  // budget, so they cannot be rendered during selection: an excerpt the budget
  // dropped is not on the page, and measuring the edge against it would report a
  // boundary the reader cannot see. Same discipline as the header counts — every
  // number describes what is below it in *this* result.
  const kept: string[] = strippedLines.length > 0 ? strippedLines : [];
  let scopeGaps = 0;
  let edgeGaps = 0;
  for (let i = 0; i < keptExcerpts.length; i++) {
    const excerpt = keptExcerpts[i];
    const before = edgeReference(keptExcerpts, i, -1);
    const after = edgeReference(keptExcerpts, i, +1);
    const lines = renderExcerpt(excerpt, entity.name, before, after);
    const interior = countScopeGaps(excerpt);
    kept.push(lines.join('\n\n'));
    scopeGaps += interior;
    edgeGaps += lines.length - excerpt.length - interior;
  }

  // Every number the header states is about what is *below it in this result*,
  // not about what was fetched. An agent told "10 matches" that can only see 3
  // of them will reason as though it has seen the other seven.
  const parts = [`${matchCount} message(s) in your other conversations match ${termList}.`];
  if (shownMatches < matchCount) {
    parts.push(
      `Showing the ${shownMatches} most recent. ${matchCount - shownMatches} older ` +
      `match(es) are not shown — narrow the terms, or ask for a smaller slice of ` +
      `a specific conversation.`
    );
  }
  // The sentence that says what was *not* read. Theseus's ranked option (3), and
  // it is here in its specific form rather than as a hedge: with the radius
  // applied, the tool can state its actual extent instead of warning vaguely
  // that there might be more. The measured failure it addresses is a *hit* read
  // as complete — the result said "1 message matches", showed it, and said
  // nothing about the turns either side, so 3/3 agents treated it as settling
  // the question.
  parts.push(
    `Lines marked ${MATCH_MARKER.trim()} are the matches this result is built around; the ` +
    `unmarked lines are the turns immediately before and after them, included ` +
    `because a condition attached to a ` +
    `fact is often in the next message rather than the same one. Each line names ` +
    `the conversation it came from, and separate excerpts are divided by ---. ` +
    `Nothing outside these excerpts was read.`
  );
  if (strippedExcerpts > 0) {
    parts.push(
      `The surrounding turns were too large to include here, so these matches are ` +
      `shown alone — ask again with a smaller limit to see them in context.`
    );
  }
  parts.push(...gapSentences(scopeGaps, edgeGaps));

  return {
    text: `${parts.join(' ')}\n\n${kept.join(EXCERPT_SEPARATOR)}`,
    isError: false,
    matchCount,
    shownCount: shownMatches,
    tokens,
  };
}

/**
 * The header sentences that explain the two markers, stated only when the marker
 * they explain is actually in the body.
 *
 * Shared by the search path and the expand path because both render through
 * `renderExcerpt` and so can emit both markers. An unconditional sentence would
 * train the agent to look for a line that is usually absent; a sentence that
 * appears on one path and not the other would mean the same line is explained or
 * not depending on how the rows were fetched.
 */
function gapSentences(scopeGaps: number, edgeGaps: number): string[] {
  const sentences: string[] = [];
  if (scopeGaps > 0) {
    sentences.push(
      `Where a line reads "not of your transcript", other turns were spoken in ` +
      `that conversation at that point and are not yours to read — so the lines ` +
      `either side of it are not consecutive, and a message that answers or ` +
      `qualifies one of them may be among the ones withheld.`
    );
  }
  // The last clause is the one this exists for. Theseus measured, eight times
  // across three builds, an agent reading three lines out of a thirty-message
  // thread and stating a property of the thread — "No restriction was attached
  // to it there" — with the restriction four rows outside the excerpt. That is
  // the inference being contradicted, in the same words the failure uses.
  //
  // The middle clause changed in Round 56 and the change is the increment: it
  // used to say the reachable turns were "yours to look for" by searching again,
  // which Theseus measured producing real searches that could not land. It now
  // points at the address the line itself carries.
  if (edgeGaps > 0) {
    sentences.push(
      `A line counting "earlier" or "later" message(s) is the edge of an ` +
      `excerpt: the conversation runs on past it and those turns are not in ` +
      `front of you. Where such a line gives an expand address, call this tool ` +
      `again with exactly that expand argument and it will return those turns — ` +
      `you do not have to guess their wording. Do not read an excerpt as a ` +
      `description of the whole conversation: a condition on something shown ` +
      `here may have been stated in a turn that is only counted.`
    );
  }
  return sentences;
}

/** The address an edge marker hands over, as the model passes it back. */
export interface ExpandRequest {
  conversation: string;
  from: number;
  to: number;
}

/**
 * How many rows one expand call will render, at most.
 *
 * Bounds the *rows*, where the search path bounds characters, because the two
 * are asked for differently: a search asks for matches and gets whatever context
 * they carry, while an expand asks for a stretch by position and can name a
 * stretch of any size. A row cap is the bound the agent can reason about —
 * "positions 12–38 of the 12–120 you asked for" is a sentence it can act on,
 * where a character budget would truncate at a place with no meaning. The char
 * budget still applies underneath it for the same reason it always did.
 */
export const RECALL_MAX_EXPAND_ROWS = 30;

/**
 * Return a stretch of one of the agent's other conversations by position.
 *
 * **This is the second half of Round 54, and it exists because Theseus measured
 * the first half half-working.** The edge marker made the hole visible and
 * provoked a real attempt to fill it — 2 of 5 runs searched for the hidden
 * restriction unprompted, which nothing on this surface had ever produced. Both
 * searches returned nothing and could not have returned anything: keyword terms
 * are ANDed, and an agent asked about a codeword has no way to guess that the
 * restriction says *"keep it between the two of us"*. Round 51's arm-E finding,
 * recurring one level up.
 *
 * The marker already knows which rows it is counting. This lets them be asked
 * for by that address rather than re-found by keyword — the difference between
 * a lookup and a guess.
 *
 * **What this does not do.** It adds no reach. The rows returned are exactly the
 * rows `getEntityTranscript` would return for that channel and range, which is
 * the same membership union everything else in this file reads: a turn spoken by
 * another agent in a shared room has no position in this numbering, so it cannot
 * be addressed here any more than it could be matched by a search. That is the
 * `edgeGapLine` split made real — the reachable count fetches, the unreachable
 * count still cannot, and the result says so in the same words the excerpt did.
 *
 * **The failure this cannot rule out.** Theseus's F/R4 showed a *failed* search
 * being read as a warrant for absence. A successful expansion that happens to
 * contain no restriction could be read the same way, more strongly — the agent
 * would have looked, and this time actually seen. The header therefore states
 * the extent of what was returned and nothing about what it means, and the
 * expandable edges of the expansion itself are marked exactly as any other
 * excerpt's are. Whether that is enough is not decided here; it is arm F's to
 * measure, and it is the reason this ships with the marker rather than instead
 * of it.
 */
export function expandConversationRange(
  entity: Entity,
  channel: Channel | undefined,
  request: ExpandRequest,
): RecallResult {
  const name = (request.conversation ?? '').trim();
  const from = Math.floor(Number(request.from));
  const to = Math.floor(Number(request.to));
  const empty = { matchCount: 0, shownCount: 0, tokens: [] as string[] };

  if (name === '' || !Number.isFinite(from) || !Number.isFinite(to)) {
    return {
      text:
        `To expand a conversation, pass the name exactly as it appears in ` +
        `brackets at the start of a line, and the two positions from an edge ` +
        `marker — for example {conversation: "design-review", from: 12, to: 38}.`,
      isError: true,
      ...empty,
    };
  }

  const options = channel ? { excludeChannelId: channel.id } : {};
  const candidates = findEntityTranscriptChannelsByName(entity.id, name, options);

  if (candidates.length === 0) {
    return {
      text:
        `No conversation of yours outside this room is named "${name}". Use the ` +
        `name exactly as it appears in brackets at the start of a line. This ` +
        `does not reach the room you are in now.`,
      isError: true,
      ...empty,
    };
  }
  // Names are not unique in Klatch, so a name can address two rooms. Answering
  // from one of them would return a real stretch of the wrong conversation under
  // a label the agent has no way to check — the one error a reader cannot catch.
  if (candidates.length > 1) {
    return {
      text:
        `${candidates.length} of your conversations are named "${name}", so ` +
        `positions ${from}–${to} do not identify one stretch. Search for a ` +
        `distinctive term instead — the excerpt it returns will be from one of ` +
        `them and will carry its own edges.`,
      isError: true,
      ...empty,
    };
  }

  const all = getEntityTranscriptRange(entity.id, candidates[0].id, from, to, options);

  if (all.length === 0) {
    return {
      text:
        `"${candidates[0].name}" has nothing of yours at positions ${from}–${to}. ` +
        `Positions count only your own turns in that conversation, so a number ` +
        `past its end returns nothing; the edge marker you took them from names ` +
        `a range that exists.`,
      isError: false,
      ...empty,
    };
  }

  // Forward from the low end, so a capped call and the next call after it tile
  // the requested range instead of overlapping it.
  const rows = all.slice(0, RECALL_MAX_EXPAND_ROWS);
  const excerpts = groupIntoExcerpts(rows);

  const kept: string[] = [];
  let scopeGaps = 0;
  let edgeGaps = 0;
  let used = 0;
  for (let i = 0; i < excerpts.length; i++) {
    const excerpt = excerpts[i];
    const lines = renderExcerpt(
      excerpt,
      entity.name,
      edgeReference(excerpts, i, -1),
      edgeReference(excerpts, i, +1),
    );
    const block = lines.join('\n\n');
    if (used > 0 && used + block.length > RECALL_MAX_CHARS) break;
    kept.push(block);
    used += block.length;
    const interior = countScopeGaps(excerpt);
    scopeGaps += interior;
    edgeGaps += lines.length - excerpt.length - interior;
  }

  // Counted off what was actually rendered, not off what was fetched — the same
  // rule the search header follows, and for the same reason: an agent told it
  // has positions 12–38 when 12–20 are on the page will reason from the other
  // eighteen.
  const shownRows = excerpts
    .slice(0, kept.length)
    .reduce((n, e) => n + e.length, 0);
  const shown = rows.slice(0, shownRows);
  const firstShown = shown[0].ordinal;
  const lastShown = shown[shown.length - 1].ordinal;

  const parts = [
    `Positions ${firstShown}–${lastShown} of "${candidates[0].name}", your own ` +
    `turns in that conversation, in order. Nothing outside this range was read.`,
  ];
  if (shownRows < all.length || lastShown < to) {
    parts.push(
      `You asked for ${from}–${to}; this is as far as one call goes. Ask again ` +
      `with from: ${lastShown + 1} for the rest.`
    );
  }
  parts.push(...gapSentences(scopeGaps, edgeGaps));

  return {
    text: `${parts.join(' ')}\n\n${kept.join(EXCERPT_SEPARATOR)}`,
    isError: false,
    matchCount: all.length,
    shownCount: shownRows,
    tokens: [],
  };
}

/** A matched line, marked; a neighbour, unmarked and indented to the same width. */
function renderLine(msg: NeighbourhoodMessage, entityName: string): string {
  const line = formatTranscriptLine(msg, entityName, CARRIED_CONTEXT_MAX_MESSAGE_CHARS);
  return msg.isMatch ? `${MATCH_MARKER}${line}` : line;
}

/**
 * The row an excerpt's edge is measured against.
 *
 * `undefined` means the conversation itself — the counts run to the start or the
 * end of the channel. A row means the nearest excerpt *actually rendered* in the
 * same conversation, which is the right reference because the reader can see it:
 * saying "12 messages lie before this" when 3 of them are printed above the
 * `---` would be a true statement about the channel and a false one about the
 * page.
 */
type EdgeReference = NeighbourhoodMessage | undefined;

/**
 * One excerpt's lines: interior scope-gap markers, plus an edge marker at each
 * end where the conversation continues past what is shown.
 *
 * The rows of an excerpt are contiguous by construction — `groupIntoExcerpts`
 * splits on a jump in the scoped `ordinal`. `rawOrdinal` is what shows that
 * "contiguous in this agent's transcript" and "contiguous in the room" are
 * different things: a jump in the raw position between two consecutively-scoped
 * rows is exactly the count of turns the scope withheld.
 *
 * The edges use the same arithmetic against a different reference. Between two
 * rendered rows the two ordinals are enough; at an edge there is no second row,
 * which is why `scopedTotal`/`rawTotal` exist. The reference is the neighbouring
 * *rendered* excerpt when there is one and the conversation boundary otherwise —
 * see `EdgeReference`.
 */
function renderExcerpt(
  excerpt: NeighbourhoodMessage[],
  entityName: string,
  before: EdgeReference,
  after: EdgeReference,
): string[] {
  const lines: string[] = [];
  const first = excerpt[0];
  const last = excerpt[excerpt.length - 1];

  // Ordinals are 1-based, so the conversation boundary behaves as a row at
  // position 0 on the left and one past the total on the right. Written that way
  // rather than as two special cases so the subtraction is the same subtraction
  // in all four combinations.
  const ownBefore = first.ordinal - (before ? before.ordinal : 0) - 1;
  const rawBefore = first.rawOrdinal - (before ? before.rawOrdinal : 0) - 1;
  // The address is the reachable stretch itself, in the numbering the count is
  // taken in: the positions strictly between the reference and this excerpt's
  // first row. `to - from + 1 === ownBefore` is the invariant that keeps the
  // number and the range from ever describing different stretches.
  const leading = edgeGapLine('earlier', ownBefore, rawBefore - ownBefore, {
    conversation: first.channelName,
    from: (before ? before.ordinal : 0) + 1,
    to: first.ordinal - 1,
  });
  if (leading !== undefined) lines.push(leading);

  for (let i = 0; i < excerpt.length; i++) {
    const row = excerpt[i];
    const prev = excerpt[i - 1];
    if (prev !== undefined) {
      const withheld = row.rawOrdinal - prev.rawOrdinal - 1;
      if (withheld > 0) lines.push(scopeGapLine(withheld));
    }
    lines.push(renderLine(row, entityName));
  }

  const ownAfter = (after ? after.ordinal : last.scopedTotal + 1) - last.ordinal - 1;
  const rawAfter = (after ? after.rawOrdinal : last.rawTotal + 1) - last.rawOrdinal - 1;
  const trailing = edgeGapLine('later', ownAfter, rawAfter - ownAfter, {
    conversation: last.channelName,
    from: last.ordinal + 1,
    to: (after ? after.ordinal : last.scopedTotal + 1) - 1,
  });
  if (trailing !== undefined) lines.push(trailing);

  return lines;
}

/**
 * The nearest kept excerpt from the *same conversation*, in the given direction.
 *
 * Channel-scoped because the kept list is chronological across conversations, so
 * the array neighbour is routinely a different room — and measuring one room's
 * edge against another's row would produce a confident number about a
 * conversation the reference is not even in.
 */
function edgeReference(
  keptExcerpts: NeighbourhoodMessage[][],
  index: number,
  direction: 1 | -1,
): EdgeReference {
  const channelId = keptExcerpts[index][0].channelId;
  for (let i = index + direction; i >= 0 && i < keptExcerpts.length; i += direction) {
    const candidate = keptExcerpts[i];
    if (candidate[0].channelId !== channelId) continue;
    return direction === -1 ? candidate[candidate.length - 1] : candidate[0];
  }
  return undefined;
}

/** Interior lines only — the count the header's scope-gap sentence is about. */
function countScopeGaps(excerpt: NeighbourhoodMessage[]): number {
  let gaps = 0;
  for (let i = 1; i < excerpt.length; i++) {
    if (excerpt[i].rawOrdinal - excerpt[i - 1].rawOrdinal - 1 > 0) gaps += 1;
  }
  return gaps;
}

/**
 * Split the flat row list into contiguous excerpts.
 *
 * Rows arrive chronological across all channels, so two rows can be adjacent in
 * the array while being a different conversation or twenty turns apart in the
 * same one. Rendering those as one run would invent an exchange that never
 * happened — which matters more here than usual, because the reason for
 * returning neighbours at all is that the agent should read a condition as
 * attached to the fact beside it.
 *
 * Overlapping neighbourhoods merge naturally: two matches three apart share the
 * turns between them, the ordinals are contiguous, and they come out as one
 * excerpt rather than two with a duplicated middle.
 *
 * **Splits on distance only, and that is deliberate.** A discontinuity created
 * by scope leaves `ordinal` contiguous, so it does not — and should not — split
 * an excerpt here: those rows really were consecutive in what this agent could
 * see, and splitting them would say the wrong thing (two separate stretches of
 * conversation) about turns that are one stretch with pieces withheld. It is
 * marked in place instead, by `renderExcerpt`.
 */
function groupIntoExcerpts(rows: NeighbourhoodMessage[]): NeighbourhoodMessage[][] {
  // Bucket by channel first. The rows arrive in one global chronological order,
  // so two conversations active on the same day interleave in the array; walking
  // it linearly would break every excerpt into single rows on the alternation
  // rather than on a real gap. Within a bucket the order is already ascending by
  // ordinal, since the row query and `ROW_NUMBER` sort on the same key.
  const byChannel = new Map<string, NeighbourhoodMessage[]>();
  for (const row of rows) {
    const bucket = byChannel.get(row.channelId);
    if (bucket) bucket.push(row);
    else byChannel.set(row.channelId, [row]);
  }

  const excerpts: NeighbourhoodMessage[][] = [];
  for (const bucket of byChannel.values()) {
    let current: NeighbourhoodMessage[] = [];
    for (const row of bucket) {
      const prev = current[current.length - 1];
      if (prev !== undefined && row.ordinal !== prev.ordinal + 1) {
        excerpts.push(current);
        current = [];
      }
      current.push(row);
    }
    if (current.length > 0) excerpts.push(current);
  }

  // Oldest excerpt first, keyed on each one's newest row — so the caller's
  // budget loop, which walks from the end, drops the oldest excerpts first.
  return excerpts.sort((a, b) => {
    const aEnd = a[a.length - 1];
    const bEnd = b[b.length - 1];
    return (aEnd.createdAt || '').localeCompare(bEnd.createdAt || '') || aEnd.ordinal - bEnd.ordinal;
  });
}

/**
 * The tool description handed to the model.
 *
 * Two things it must say, both learned rather than assumed. First, that matching
 * is literal — Theseus's standing finding across the carried-context work is
 * that an agent reasons confidently from what the prompt implies, so a tool that
 * silently does substring matching while sounding like search will produce
 * "I checked and it never happened" from a phrasing mismatch. Second, what the
 * scope *is*: its own conversations, excluding this room, because an agent that
 * thinks it can search the room it is in will use it instead of reading the
 * history already in front of it.
 *
 * A third clause was added after measurement rather than reasoning. Theseus's
 * 8/14 probe found the tool called 2/2 in an arm where the answer was already in
 * the agent's carried-context block — one run queried the literal token
 * `"teal-osprey-19"`, a string it could only have read off its own prompt. The
 * existing "this does not search the room you are in now" doesn't bite there:
 * the block is not the room. Costs a round per turn rather than being wrong, so
 * the fix is a sentence, not a mechanism.
 *
 * A fourth, in Round 56, describes the second mode. It is placed after the
 * search clauses and phrased as *what to do with an edge marker* rather than as
 * a general capability, because the address is only ever obtained from a result:
 * an agent that reads this as "I can ask for any stretch of any conversation"
 * will invent positions, and an invented range is the one input here that
 * returns real rows from a place nobody asked about.
 */
export const RECALL_TOOL_DESCRIPTION =
  'Search your own earlier conversations — the ones outside this room — for ' +
  'something specific that is not in the context you were given. Use this when ' +
  'you need a detail you believe you discussed before but cannot see: a name, a ' +
  'decision, a number, a filename. If the detail is already in front of you — in ' +
  'this room\'s history or in the summary of your other conversations you were ' +
  'given — you already have it and do not need to search for it. Matching is on ' +
  'literal words, not meaning, and all terms must appear in the same message, so ' +
  'pass distinctive keywords rather than a sentence (good: "basalt heron ' +
  'codeword"; poor: "what was the codeword you gave me"). Each match comes back ' +
  'with the messages immediately before and after it, labelled with the ' +
  'conversation and date — read them, because a condition attached to a fact is ' +
  'often stated in the next message rather than the same one. This does not ' +
  'search the room you are in now — that history is already in front of you. ' +
  'A result may also mark the edge of an excerpt with an expand address — ' +
  'a conversation name and two positions. Pass that address back as `expand` ' +
  'and this returns those turns themselves, so you never have to guess the ' +
  'wording of something you have only been told the count of. Use an address ' +
  'a result gave you rather than positions you reasoned out.';
