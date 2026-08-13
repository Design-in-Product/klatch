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

/**
 * The disclosure norm — the second paragraph of the block header.
 *
 * **Why this exists.** Theseus drove the first live probe of layer 6 on 8/12
 * (`docs/research/carried-context-conveyance-probe-2026-08-12.md`) and found
 * that conveyance and disclosure are separate problems, only the first of which
 * this module had solved. The seed carried an arbitrary fact from an agent's 1-1
 * into a klatch correctly — and the agent then declined to say it in the room,
 * twice, including after the owner explicitly authorised it, while repeating it
 * instantly in its own 1-1. A second agent in the same room volunteered its
 * carried fact unprompted. Two agents, one turn, opposite improvised policies.
 *
 * **The provenance labels were the causal ingredient**, which is why the fix
 * belongs here rather than anywhere else: the refusing agent cited the
 * `[channel · date]` prefix `formatLine` writes, arguing from it that the
 * material was private to that thread. Marking where a line came from is what
 * makes carried context legible, and it was also supplying the case for
 * withholding it. Nothing else in the prompt said otherwise, so the model
 * supplied a norm of its own.
 *
 * **Why this norm and not the alternatives.** Theseus's three options were
 * (a) accept the variance, (b) state a norm in the header, (c) per-channel
 * disclosure policy. (a) fails the canonical use case outright — six department
 * heads who each carry everything and volunteer nothing is the mechanism passing
 * its test and defeating its purpose. (c) is a much larger increment and needs a
 * policy surface nobody has designed. (b) is the smallest thing that makes the
 * canonical case work, and it is reversible: it is a string.
 *
 * The load-bearing sentence is the first one. Klatch is a single-user local tool
 * with no auth (`CLAUDE.md`, "Conventions"; there is no users table in
 * `db/index.ts`), so every conversation quoted in the block is with the same
 * person the agent is talking to in the klatch. The refusing agent's stated
 * reason — "I can't verify who's reading here" — is not a judgment call we are
 * overriding; it is a false premise about the product, and correcting it is
 * the honest fix rather than an instruction to ignore a real concern.
 *
 * **What this does not claim.** It is a prompt, not an enforcement mechanism.
 * Per `docs/ux/design-principles.md` — "presentation must not imply a guarantee
 * the mechanism doesn't provide" — this raises the probability of disclosure;
 * it does not make it certain, and an agent that still declines is behaving
 * within its latitude.
 */
export const DISCLOSURE_NORM =
  'Everything quoted below is from your own conversations with the same person ' +
  'you are talking to here — Klatch is a single-user workspace, and there is no ' +
  'third party in this room. Treat what you carry in as shareable here: if it ' +
  'bears on what is being discussed, say it, and say where it came from. The ' +
  'labels above each line are there so you can attribute what you know ' +
  '("this came up in another thread"), not to mark it as confidential. This is ' +
  'the point of the room — what each participant knows from elsewhere is ' +
  'supposed to meet here. Withholding by default defeats it. Ordinary judgment ' +
  'still applies to material the owner asked you to keep to one conversation.';

/**
 * The lossy-window notice — the closing sentence of the block footer.
 *
 * **Why this exists.** Theseus's 8/13 sensitivity round
 * (`docs/research/carried-context-disclosure-sensitivity-2026-08-13.md`) passed
 * the norm on every sensitivity arm, then found the failure one layer down, in
 * this file's budget. Arm C established that the norm *does* yield to an owner's
 * "keep this between us" — but only because the restriction and the fact it
 * restricted happened to sit in the same carried message. Probe 3 separated
 * them the way a real thread would: the owner marks the fact once at turn 1,
 * eleven ordinary turns go by, and the fact is restated in passing at turn 12.
 * The window carries turn 12 and not turn 1. Read off the assembled prompt:
 * carries the fact `true`, carries the restriction `false`. The agent disclosed.
 *
 * That is not an agent overriding the owner. The restriction was not in its
 * prompt. The mechanism forgot the constraint while remembering the content:
 *
 * > The window can drop a fact and the instruction restricting that fact
 * > independently, and only one of the two being dropped is safety-relevant.
 *
 * **What this sentence does and does not do.** It stops the loss being *silent*.
 * It does not stop the loss. An agent told that the omission may include
 * constraints can hedge, ask, or check — it cannot recover a marking it was
 * never given. Theseus's option (2), never evicting a marking, requires
 * detecting one, which is the policy surface option (c) was deferred for; it
 * stays deferred, and the residual is recorded as a decision in
 * `docs/plans/continuity-3-carried-context.md` rather than left as an
 * unexamined property.
 *
 * Unconditional, deliberately. The tempting version fires only when something
 * was actually dropped — but the probe-3 case drops nothing *this function can
 * see*: 24 messages, window 20, so the marking was never fetched and
 * `omittedCount` is 0. A notice gated on `omittedCount > 0` would have been
 * silent in exactly the case that motivated it.
 */
export const LOSSY_WINDOW_NOTICE =
  'What is missing may include instructions about what is here: if the owner ' +
  'asked you to keep something to one conversation, that request may have been ' +
  'made in a turn that fell outside this window even though the thing it was ' +
  'about is quoted above. So absence of a restriction here is not evidence that ' +
  'none was given. If something looks like it was meant to stay where it was ' +
  'said, ask rather than assume it was unrestricted.';

export interface CarriedContextOptions {
  maxMessages?: number;
  maxChars?: number;
  maxMessageChars?: number;
}

/**
 * The assembled block plus the counts describing it.
 *
 * The counts exist because the block is not the only consumer. Iris ruled on
 * 8/13 (`docs/ux/carried-context-visibility-2026-08-13.md`) that a klatch
 * message must show the human *that* context was carried and from how many
 * conversations — existence, not content — so the room count has to survive
 * assembly rather than being reconstructed from the text afterwards.
 *
 * Every count here describes what actually reached the prompt, after budget
 * eviction, not what was fetched.
 */
export interface CarriedContextBlock {
  /** The layer-6 text, ready to append to the system prompt. */
  text: string;
  /** Distinct other conversations represented in `text`. */
  roomCount: number;
  /** Messages carried, after the char budget evicted any. */
  messageCount: number;
  /**
   * Messages fetched but dropped by the char budget.
   *
   * Narrower than it sounds, and the narrowness matters: this counts only what
   * the *char* budget evicted from the fetched set. Anything older than
   * `maxMessages` was never fetched, so it is not counted here — which is why
   * probe 3's lost marking reports `omittedCount: 0`. Use `hasOlderHistory` for
   * "is there more below the window", not this.
   */
  omittedCount: number;
  /**
   * Whether the entity has any history older than the message window.
   *
   * Detected by fetching one row past `maxMessages` and discarding it — no
   * second query, and no duplicated WHERE clause. It is a boolean rather than a
   * count because a count of everything below the window would need a real
   * `COUNT(*)` pass; if a surface ever wants "20 of 143", that query is the work,
   * and this flag is not a substitute for it.
   */
  hasOlderHistory: boolean;
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
  return buildCarriedContextBlock(entity, channel, options)?.text;
}

/**
 * As `buildCarriedContext`, but returns the counts alongside the text.
 *
 * Prefer this at any call site that needs to *say* something about the block —
 * the per-message visibility artifact, the prompt-debug layer line — so the
 * numbers the human sees come from the same assembly pass that produced the
 * prompt, rather than from a second, possibly divergent, computation.
 */
export function buildCarriedContextBlock(
  entity: Entity,
  channel: Channel | undefined,
  options: CarriedContextOptions = {},
): CarriedContextBlock | undefined {
  if (channel?.type !== 'klatch') return undefined;

  const maxMessages = options.maxMessages ?? CARRIED_CONTEXT_MAX_MESSAGES;
  const maxChars = options.maxChars ?? CARRIED_CONTEXT_MAX_CHARS;
  const maxMessageChars = options.maxMessageChars ?? CARRIED_CONTEXT_MAX_MESSAGE_CHARS;

  // Fetch one past the window purely to learn whether anything is below it.
  // The extra row is discarded — it is a probe, not content — and this is what
  // lets the block distinguish "this is all there is" from "this is a slice".
  const fetched = getEntityTranscript(entity.id, {
    excludeChannelId: channel.id,
    limit: maxMessages + 1,
  });
  const hasOlderHistory = fetched.length > maxMessages;
  // `getEntityTranscript` returns oldest-first, so the surplus row is at the front.
  const recent = hasOlderHistory ? fetched.slice(fetched.length - maxMessages) : fetched;
  if (recent.length === 0) return undefined;

  // Fill newest-first so the budget evicts the oldest, then restore chronological
  // order — the same recency bias `getEntityTranscript`'s own LIMIT applies.
  const kept: { line: string; room: string }[] = [];
  let used = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    const line = formatLine(recent[i], entity.name, maxMessageChars);
    if (used + line.length > maxChars && kept.length > 0) break;
    kept.push({ line, room: recent[i].channelName });
    used += line.length;
  }
  kept.reverse();

  const omitted = recent.length - kept.length;
  // Rooms are counted over what survived eviction, not over what was fetched.
  // Counting `recent` would name a conversation the block no longer contains
  // any line from — and that same count is now what the UI chip shows the human.
  const rooms = [...new Set(kept.map((k) => k.room))];

  const header =
    'Context carried from your own other conversations.\n\n' +
    'You are in a klatch — a shared room with other agents — and you are the same ' +
    'agent here that you are in your other conversations. What follows is the most ' +
    'recent activity from those conversations, so that you arrive continuous with ' +
    'what you have been doing rather than starting blank. Each line is marked with ' +
    'the conversation it came from.\n\n' +
    DISCLOSURE_NORM;

  const footer =
    `This is a bounded slice of a longer history — the ${kept.length} most recent ` +
    `message(s) from ${rooms.length} other conversation(s)` +
    (omitted > 0 ? `, with ${omitted} more dropped to stay within budget` : '') +
    '. There is more than this. If you need something specific that is not here, ' +
    'say so rather than assuming it did not happen.\n\n' +
    LOSSY_WINDOW_NOTICE;

  return {
    text: `${header}\n\n${kept.map((k) => k.line).join('\n\n')}\n\n${footer}`,
    roomCount: rooms.length,
    messageCount: kept.length,
    omittedCount: omitted,
    hasOlderHistory,
  };
}
