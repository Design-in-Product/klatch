import type { Channel, Entity } from '@klatch/shared';
import {
  countEntityTranscript,
  getEntityTranscriptNeighbourhoods,
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
  const kept: string[] = [];
  let shownMatches = 0;
  let strippedExcerpts = 0;
  let used = 0;

  for (let i = excerpts.length - 1; i >= 0; i--) {
    const excerpt = excerpts[i];
    const lines = excerpt.map((m) => renderLine(m, entity.name));
    const block = lines.join('\n\n');

    if (used + block.length <= RECALL_MAX_CHARS) {
      kept.push(block);
      used += block.length;
      shownMatches += excerpt.filter((m) => m.isMatch).length;
      continue;
    }

    // Nothing kept yet and the newest excerpt alone overruns: fall back to its
    // match lines only rather than blow the budget. Degrading to the pre-Round-51
    // shape is the right failure — a match with no context is what the tool used
    // to return, and a bounded honest result beats an unbounded complete one.
    if (kept.length === 0) {
      const matchLines = excerpt.filter((m) => m.isMatch);
      for (const m of matchLines) {
        const line = renderLine(m, entity.name);
        if (used + line.length > RECALL_MAX_CHARS && kept.length > 0) break;
        kept.push(line);
        used += line.length;
        shownMatches += 1;
      }
      if (matchLines.length < excerpt.length) strippedExcerpts += 1;
    }
    break;
  }
  kept.reverse();

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

  return {
    text: `${parts.join(' ')}\n\n${kept.join(EXCERPT_SEPARATOR)}`,
    isError: false,
    matchCount,
    shownCount: shownMatches,
    tokens,
  };
}

/** A matched line, marked; a neighbour, unmarked and indented to the same width. */
function renderLine(msg: NeighbourhoodMessage, entityName: string): string {
  const line = formatTranscriptLine(msg, entityName, CARRIED_CONTEXT_MAX_MESSAGE_CHARS);
  return msg.isMatch ? `${MATCH_MARKER}${line}` : line;
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
  'search the room you are in now — that history is already in front of you.';
