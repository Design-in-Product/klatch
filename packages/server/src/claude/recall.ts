import type { Channel, Entity } from '@klatch/shared';
import { countEntityTranscript, getEntityTranscript } from '../db/queries.js';
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
  const rows = getEntityTranscript(entity.id, { ...options, limit });

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

  // Newest-first into the budget so a tight budget drops the *oldest* matches,
  // then restored to chronological order for reading — the same recency bias
  // layer 6 applies, for the same reason.
  const kept: string[] = [];
  let used = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const line = formatTranscriptLine(rows[i], entity.name, CARRIED_CONTEXT_MAX_MESSAGE_CHARS);
    if (used + line.length > RECALL_MAX_CHARS && kept.length > 0) break;
    kept.push(line);
    used += line.length;
  }
  kept.reverse();

  // Every number the header states is about what is *below it in this result*,
  // not about what was fetched. An agent told "10 matches" that can only see 3
  // of them will reason as though it has seen the other seven.
  const parts = [`${matchCount} message(s) in your other conversations match ${termList}.`];
  if (kept.length < matchCount) {
    parts.push(
      `Showing the ${kept.length} most recent. ${matchCount - kept.length} older ` +
      `match(es) are not shown — narrow the terms, or ask for a smaller slice of ` +
      `a specific conversation.`
    );
  }
  parts.push('Each line is marked with the conversation it came from.');

  return {
    text: `${parts.join(' ')}\n\n${kept.join('\n\n')}`,
    isError: false,
    matchCount,
    shownCount: kept.length,
    tokens,
  };
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
 */
export const RECALL_TOOL_DESCRIPTION =
  'Search your own earlier conversations — the ones outside this room — for ' +
  'something specific that is not in the context you were given. Use this when ' +
  'you need a detail you believe you discussed before but cannot see: a name, a ' +
  'decision, a number, a filename. Matching is on literal words, not meaning, ' +
  'and all terms must appear in the same message, so pass distinctive keywords ' +
  'rather than a sentence (good: "basalt heron codeword"; poor: "what was the ' +
  'codeword you gave me"). Results are the most recent matches, each labelled ' +
  'with the conversation and date it came from. This does not search the room ' +
  'you are in now — that history is already in front of you.';
