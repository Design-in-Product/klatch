import type { Channel, Entity } from '@klatch/shared';
import { getEntityTranscript, type TranscriptMessage } from '../db/queries.js';

/**
 * Continuity increment #3, layer (b) — the carried-context seed.
 *
 * An agent walking into a klatch used to arrive blank: history has always been
 * assembled `WHERE channel_id = ?`, so nothing it knew from its own ongoing
 * conversation came with it. `getEntityTranscript` (Round 36) built the union
 * that fixes that; this module is the bounded slice of it that actually reaches
 * the prompt.
 *
 * **Why bounded, and why this shape.** xian approved option (b) — recent-N plus
 * summary — with (c), on-demand deep retrieval, layered on
 * (`janus-to-daedalus-cc-team-xian-approves-compaction-option-b-2026-08-12.md`,
 * relaying his 8/12 answer; sizing in
 * `docs/plans/continuity-3-compaction-sizing-2026-08-10.md`). Option (a),
 * carrying each agent's whole source channel, was excluded on arithmetic: the
 * canonical cast's transcripts run ~48–160K tokens each.
 *
 * This file is the recent-N half. The summary half and the on-demand tool are
 * separate increments — see `docs/plans/continuity-3-carried-context.md`. The
 * seed is deliberately the *floor*: it guarantees an agent is never blank, and
 * it is deterministic per turn, which is the property Theseus argued for —
 * you can read the prompt and tell whether the agent was given a fact, so an
 * AAXT probe can distinguish "didn't know" from "knew and didn't use".
 */

/**
 * Most-recent-N messages carried. Measured against the real March corpus
 * (`backups/klatch.db.backup-2026-03-14`, six imported department-head
 * channels): the 20-message tail runs 11,928–22,310 chars, i.e. ~3–5.5K tokens
 * per agent. Assembly is per-entity — `buildSystemPrompt` is called once per
 * participant in the roundtable loop (`client.ts`), so each agent carries only
 * its own history, and a six-agent klatch pays this per participant rather than
 * six times over in one prompt.
 */
export const CARRIED_CONTEXT_MAX_MESSAGES = 20;

/**
 * Hard ceiling on the assembled block. Normally slack — the measured 20-message
 * tails all fit under it, so the message count is what binds and the cost stays
 * predictable. This exists for the tail: it is what stops an unusually verbose
 * stretch from silently tripling the seed.
 */
export const CARRIED_CONTEXT_MAX_CHARS = 24_000;

/**
 * Per-message ceiling, applied before the block budget.
 *
 * A message-count cap alone is not safe. In the same corpus the median message
 * is 580 chars and p90 is 2,334 — but the largest single message is 64,627,
 * which on its own would consume the entire block budget and evict every other
 * message in the seed. Truncating the outlier is strictly better than losing
 * nineteen messages to it; ~92% of real messages are under this and pass
 * through untouched.
 */
export const CARRIED_CONTEXT_MAX_MESSAGE_CHARS = 4_000;

export interface CarriedContextOptions {
  maxMessages?: number;
  maxChars?: number;
  maxMessageChars?: number;
}

function formatLine(msg: TranscriptMessage, entityName: string, maxMessageChars: number): string {
  const speaker = msg.role === 'assistant' ? entityName : 'user';
  const day = (msg.originalTimestamp || msg.createdAt || '').slice(0, 10);
  const where = day ? `${msg.channelName} · ${day}` : msg.channelName;

  const content = msg.content.length > maxMessageChars
    ? msg.content.slice(0, maxMessageChars) + '\n…(this message truncated for length)'
    : msg.content;

  return `[${where}] ${speaker}: ${content}`;
}

/**
 * Assemble the carried-context block for an entity about to speak in `channel`.
 *
 * Returns `undefined` — not an empty string — when there is nothing to carry,
 * so the caller can distinguish "layer absent" from "layer present but empty"
 * in the prompt-debug surface.
 *
 * **Scoped to klatches.** In the agent's own 1-1 the channel's own history is
 * already the whole of what it knows there, and carrying klatch content *back*
 * into the 1-1 is bidirectionality — open question 2 in
 * `composition-continuity-gap-2026-07-19.md`, which xian has not answered. This
 * builds the direction that was decided and leaves the other alone.
 */
export function buildCarriedContext(
  entity: Entity,
  channel: Channel | undefined,
  options: CarriedContextOptions = {},
): string | undefined {
  if (channel?.type !== 'klatch') return undefined;

  const maxMessages = options.maxMessages ?? CARRIED_CONTEXT_MAX_MESSAGES;
  const maxChars = options.maxChars ?? CARRIED_CONTEXT_MAX_CHARS;
  const maxMessageChars = options.maxMessageChars ?? CARRIED_CONTEXT_MAX_MESSAGE_CHARS;

  const recent = getEntityTranscript(entity.id, {
    excludeChannelId: channel.id,
    limit: maxMessages,
  });
  if (recent.length === 0) return undefined;

  // Fill newest-first so the budget evicts the oldest, then restore chronological
  // order — the same recency bias `getEntityTranscript`'s own LIMIT applies.
  const kept: string[] = [];
  let used = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    const line = formatLine(recent[i], entity.name, maxMessageChars);
    if (used + line.length > maxChars && kept.length > 0) break;
    kept.push(line);
    used += line.length;
  }
  kept.reverse();

  const omitted = recent.length - kept.length;
  const rooms = [...new Set(recent.map((m) => m.channelName))];

  const header =
    'Context carried from your own other conversations.\n\n' +
    'You are in a klatch — a shared room with other agents — and you are the same ' +
    'agent here that you are in your other conversations. What follows is the most ' +
    'recent activity from those conversations, so that you arrive continuous with ' +
    'what you have been doing rather than starting blank. Each line is marked with ' +
    'the conversation it came from.';

  const footer =
    `This is a bounded slice of a longer history — the ${kept.length} most recent ` +
    `message(s) from ${rooms.length} other conversation(s)` +
    (omitted > 0 ? `, with ${omitted} more dropped to stay within budget` : '') +
    '. There is more than this. If you need something specific that is not here, ' +
    'say so rather than assuming it did not happen.';

  return `${header}\n\n${kept.join('\n\n')}\n\n${footer}`;
}
