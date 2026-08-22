/**
 * Round 71 — the probe-side tap, certified against the real wire and the real artifact.
 *
 * Theseus, 2026-08-21 (STOP fire). Daedalus's Round 70 memo §3 split the tier-two capture
 * and handed me the half he would not touch: "the server end is proven and free; the probe
 * end is yours", because `probe-recall-tool.mjs` is an instrument mid-experiment and Round
 * 58's refusal to change one on argument binds him harder than it binds me. The probe end
 * is `scripts/lib/recall-tap.mjs`. This file is what keeps it honest.
 *
 * **Why the certification lives here and not in a `scripts/verify-*.mjs`.** The other
 * verifiers certify pure functions against a producer they can import. This module's
 * load-bearing claim is not pure — it is that *the bytes the real route emits parse into
 * frames that align to the rows the real route wrote*. Every one of those nouns is
 * produced by server code, so the only honest fixture is the server. Daedalus's
 * `round70-tool-input-on-the-sse-wire.test.ts` proved the hop with hand-read frames; this
 * runs the **shipped probe module** over the same hop, so a refactor that breaks the probe
 * goes red in the suite instead of in a five-run opus arm.
 *
 * The harness (the SDK mock, the gate, `driveWithSubscriber`) is Daedalus's from that file,
 * deliberately reused rather than rewritten: two copies of a fixture drift, and his has
 * already been shown to reproduce the race.
 *
 * **What each test is protecting, in one line each:**
 *
 *  1. the Round 68 dropped-expand path is *diagnosed* rather than merely flagged;
 *  2. the Round 69 §2(b) quiet drop — no empty tail at all — is seen for the first time;
 *  3. a genuine `query: ""` is told apart from (1), which is the discriminator: without
 *     this case a verdict function that returned `dropped-expand` unconditionally passes;
 *  4. an accepted expand round-trips, so the tap is not merely "an expand key was present";
 *  5. a lost race reports `lost-race` and **not** `no-calls` — Daedalus §2, the scoring
 *     rule, and the one failure that is otherwise byte-identical to a clean sheet;
 *  6. the tap never throws, because it sits between a billed POST and a settle that would
 *     have succeeded;
 *  7. an ambiguous join attaches nothing rather than guessing, because the two candidates
 *     can differ in exactly the way the tap exists to detect.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import './setup.js';
import { createChannel, createEntity, getMessageArtifacts } from '../db/queries.js';
import { getDb } from '../db/index.js';
import { activeStreams, streamClaude } from '../claude/client.js';
import { RECALL_TOOL_NAME } from '../claude/recall.js';
import { createTestApp } from './app.js';
import { DEFAULT_MODEL } from '@klatch/shared';
import type { Channel, Entity } from '@klatch/shared';
import { v4 as uuidv4 } from 'uuid';

// The modules under test — the ones `probe-recall-tool.mjs` imports, not copies. That is
// the whole point of reaching across the package boundary: a certification that read its
// own copy would certify nothing about the probe (`recall-recogniser.mjs`'s rule, and
// `verify-empty-tail-detector.mjs` follows it too).
//
// `scripts/` is plain JS outside the server's `rootDir`, so tsc has no declarations for it
// and reports TS7016. Suppressed rather than mirrored in a `.d.mts`: a hand-written type
// mirror is a second copy of the contract that can drift from the module while the tests
// keep passing, which is the exact failure mode this file exists to prevent one level down.
// The runtime contract is asserted below instead — every field these tests read is checked
// against a value the real route produced, so a renamed export fails here loudly.
// `@ts-expect-error` rather than `@ts-ignore` so that if `scripts/` ever gains types, the
// build says to delete this line instead of silently keeping it.
// (One line, not wrapped: the directive suppresses errors on the line that *follows* it,
// and tsc reports an import's error on its final line — so a wrapped import silently moves
// the error out from under its own suppression. Found by running it, not by reading it.)
// @ts-expect-error — untyped .mjs, see above
import { readSseEvents, alignTapToCalls, tapSummary, tapWarnings, startRecallTap, TAP_STATUS, TAP_VERDICT } from '../../../../scripts/lib/recall-tap.mjs';
// @ts-expect-error — untyped .mjs, see above
import { readCallKind } from '../../../../scripts/lib/recall-call-kind.mjs';

const h = vi.hoisted(() => ({
  rounds: [] as Array<{ text?: string; tool?: { name: string; input: Record<string, unknown> } }>,
  call: 0,
  gate: null as Promise<void> | null,
}));

vi.mock('@anthropic-ai/sdk', async () => {
  const actual = await vi.importActual<any>('@anthropic-ai/sdk');
  const fakeStream = () => {
    const idx = h.call++;
    const round = h.rounds[idx] ?? {};
    const handlers: Record<string, (arg: any) => void> = {};
    return {
      on: (event: string, cb: (arg: any) => void) => {
        handlers[event] = cb;
      },
      finalMessage: async () => {
        if (idx === 0 && h.gate) await h.gate;
        if (round.text) handlers.text?.(round.text);
        if (round.tool) {
          return {
            stop_reason: 'tool_use',
            content: [
              { type: 'tool_use', id: `tu_${idx}`, name: round.tool.name, input: round.tool.input },
            ],
          };
        }
        return { stop_reason: 'end_turn', content: [{ type: 'text', text: round.text ?? '' }] };
      },
    };
  };
  class MockAnthropic {
    messages = { stream: fakeStream };
    beta = { messages: { stream: fakeStream } };
  }
  return {
    ...actual,
    default: Object.assign(MockAnthropic, {
      APIUserAbortError: actual.default.APIUserAbortError,
      APIError: actual.default.APIError,
      AuthenticationError: actual.default.AuthenticationError,
    }),
  };
});

function say(channelId: string, entityId: string, content: string, at: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', content, 'complete', DEFAULT_MODEL, entityId, at);
  return id;
}

function pendingTurn(channelId: string, entityId: string): string {
  const id = uuidv4();
  getDb()
    .prepare(
      'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, channelId, 'assistant', '', 'streaming', DEFAULT_MODEL, entityId, '2026-08-21T19:00:00.000Z');
  return id;
}

/**
 * Start a turn, attach a real SSE subscriber through the route, then let the turn proceed —
 * and read the body with **the probe's own reader**, not a local one. Daedalus's shape;
 * the one substantive change is that `readSseEvents` is the module under test.
 */
async function driveWithTap(channel: Channel): Promise<{ turn: string; frames: any[] }> {
  const turn = pendingTurn(channel.id, agent.id);
  let release!: () => void;
  h.gate = new Promise<void>((r) => {
    release = r;
  });

  const pending = streamClaude(channel.id, turn, agent);
  const emitter = activeStreams.get(turn);
  expect(emitter, 'emitter is registered synchronously').toBeDefined();

  const res = await createTestApp().request(`/api/messages/${turn}/stream`);
  expect(res.status).toBe(200);

  const deadline = Date.now() + 5000;
  while (emitter!.listenerCount('data') === 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5));
  }
  expect(emitter!.listenerCount('data'), 'the route subscribed before the turn ran').toBeGreaterThan(0);

  release();
  const { events, terminated } = await readSseEvents(res.body!);
  expect(terminated, 'the reader saw the terminator rather than falling off the end').toBe(true);
  await pending;
  return {
    turn,
    frames: events.filter((e: any) => e.type === 'tool_use' && e.toolName === RECALL_TOOL_NAME),
  };
}

/** The artifact side, read exactly the way `probe-recall-tool.mjs:1587` reads it. */
function callsFor(turn: string) {
  return getMessageArtifacts(turn)
    .filter((a) => a.type === 'tool_use' && a.toolName === RECALL_TOOL_NAME)
    .map((a) => readCallKind(a.inputSummary));
}

let agent: Entity;
let oneOnOne: Channel;
let klatch: Channel;

beforeEach(() => {
  h.rounds.length = 0;
  h.call = 0;
  h.gate = null;
  agent = createEntity('Vesper', DEFAULT_MODEL, 'You are Vesper.', '#6366f1');
  oneOnOne = createChannel('vesper-1-1', '', DEFAULT_MODEL, undefined, 'chat', [agent.id]);
  klatch = createChannel('weekly-review', '', DEFAULT_MODEL, undefined, 'klatch', [agent.id]);
  say(oneOnOne.id, agent.id, 'the depot cipher is ochre-marlin-44', '2026-08-15T08:00:00.000Z');
});

describe('Round 71 — the tap resolves what the artifact cannot', () => {
  it('diagnoses a dropped expand that the artifact records as an empty search', async () => {
    h.rounds.push(
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { expand: { conversation: 'vesper-1-1', from: '12', to: '38' } } } },
      { text: 'done' },
    );

    const { turn, frames } = await driveWithTap(klatch);
    const calls = callsFor(turn);

    // The artifact side first, so the test states the problem before it states the fix.
    expect(calls).toHaveLength(1);
    expect(calls[0].inputSummary).toBe('Searched own conversations: ');
    expect(calls[0].noQuery, 'Round 69 flags it and cannot diagnose it').toBe(true);

    const alignment = alignTapToCalls(frames, calls);
    expect(alignment.status).toBe(TAP_STATUS.CAPTURED);
    expect(alignment.verdicts).toEqual([TAP_VERDICT.DROPPED_EXPAND]);
    expect(alignment.inputs[0]).toEqual({ expand: { conversation: 'vesper-1-1', from: '12', to: '38' } });

    const summary = tapSummary(alignment, calls);
    expect(summary.flaggedCalls).toBe(1);
    expect(summary.resolvedByTap).toBe(1);
    expect(summary.unresolvedCalls).toBe(0);
  });

  /**
   * My Round 69 §2(b) finding, and the reason the tap is worth building at all. A dropped
   * expand that *also* carried a query leaves **no empty tail**: it records as an ordinary
   * successful search, Round 69's detector has nothing to fire on, and the row is scored —
   * wrongly — as a keyword search the model meant to run.
   */
  it('sees the quiet drop, which leaves no empty tail and which nothing else can see', async () => {
    h.rounds.push(
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { query: 'depot cipher', expand: { conversation: 'vesper-1-1', from: '12', to: '38' } } } },
      { text: 'done' },
    );

    const { turn, frames } = await driveWithTap(klatch);
    const calls = callsFor(turn);

    expect(calls[0].inputSummary).toBe('Searched own conversations: depot cipher');
    expect(calls[0].kind).toBe('search');
    expect(calls[0].noQuery, 'nothing in the artifact is out of the ordinary').toBe(false);

    const alignment = alignTapToCalls(frames, calls);
    expect(alignment.verdicts).toEqual([TAP_VERDICT.QUIET_DROP]);

    const summary = tapSummary(alignment, calls);
    expect(summary.quietDropCalls).toBe(1);
    // It is not an *unscorable* row. It is an already-scored, already-wrong one, and the
    // warning has to say so or a reader will file it with the empty tails.
    expect(summary.flaggedCalls).toBe(0);
    expect(tapWarnings(summary).join(' ')).toContain('MIS-SCORED');
  });

  /**
   * The discriminator for test 1. `{query: ''}` produces a byte-identical artifact row;
   * only the wire tells them apart. Without this case, a `readTapVerdict` that ignored its
   * input and returned `dropped-expand` would pass the dropped-expand test.
   */
  it('tells a genuine empty search apart from a dropped expand, which is the whole ambiguity', async () => {
    h.rounds.push(
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { query: '' } } },
      { text: 'done' },
    );

    const { turn, frames } = await driveWithTap(klatch);
    const calls = callsFor(turn);

    expect(calls[0].inputSummary, 'byte-identical to the dropped-expand case above')
      .toBe('Searched own conversations: ');
    expect(calls[0].noQuery).toBe(true);

    const alignment = alignTapToCalls(frames, calls);
    expect(alignment.verdicts).toEqual([TAP_VERDICT.TRUE_EMPTY_SEARCH]);
    expect(tapSummary(alignment, calls).droppedExpandCalls).toBe(0);
  });

  it('round-trips an accepted expand, so the verdict is not merely "an expand key was present"', async () => {
    h.rounds.push(
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { expand: { conversation: 'vesper-1-1', from: 1, to: 3 } } } },
      { text: 'done' },
    );

    const { turn, frames } = await driveWithTap(klatch);
    const calls = callsFor(turn);

    expect(calls[0].kind).toBe('expand');
    const alignment = alignTapToCalls(frames, calls);
    expect(alignment.verdicts).toEqual([TAP_VERDICT.ACCEPTED_EXPAND]);
    expect(tapSummary(alignment, calls).incoherentCalls).toBe(0);
  });
});

describe('Round 71 — the tap fails loudly, or not at all', () => {
  /**
   * Daedalus §2. A subscriber that arrives after the turn settles gets one
   * `message_complete` rebuilt from the DB and no `tool_use` frame, because nothing
   * replays them. The observed bytes are identical to a turn that called no tool; the
   * artifact list is the only discriminator, which is why `alignTapToCalls` is the thing
   * that decides the status and `startRecallTap` deliberately does not.
   */
  it('reports a lost race as lost-race and never as "no tool call"', async () => {
    h.rounds.push(
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { expand: { conversation: 'vesper-1-1', from: '12', to: '38' } } } },
      { text: 'done' },
    );

    // No gate: the turn runs to completion before anything subscribes.
    const turn = pendingTurn(klatch.id, agent.id);
    await streamClaude(klatch.id, turn, agent);

    const res = await createTestApp().request(`/api/messages/${turn}/stream`);
    const { events } = await readSseEvents(res.body!);
    const frames = events.filter((e: any) => e.type === 'tool_use');

    const calls = callsFor(turn);
    expect(calls, 'the tool really was called — the artifact proves it').toHaveLength(1);
    expect(frames, 'and not one frame of it survived').toHaveLength(0);

    const alignment = alignTapToCalls(frames, calls);
    expect(alignment.status).toBe(TAP_STATUS.LOST_RACE);
    expect(alignment.verdicts).toEqual([TAP_VERDICT.NO_FRAME]);

    const summary = tapSummary(alignment, calls);
    expect(summary.unresolvedCalls, 'degrades to Round 69 behaviour, exactly').toBe(1);
    expect(summary.resolvedByTap).toBe(0);
    expect(tapWarnings(summary).join(' ')).toContain('LOST THE RACE');

    // The other half of the rule: identical bytes, no artifacts, different status. If
    // these two ever collapse to one value the scoring rule silently stops existing.
    expect(alignTapToCalls([], []).status).toBe(TAP_STATUS.NO_CALLS);
  });

  /**
   * Constraint 1 of Daedalus's §3. The tap sits between a POST that has already been
   * billed and a `settle()` that will succeed regardless, so a throw here discards a paid
   * turn in order to report a missing field.
   */
  it('never rejects, whatever the network does', async () => {
    const thrower = (async () => {
      throw new Error('ECONNRESET');
    }) as unknown as typeof fetch;
    const a = await startRecallTap({
      apiBase: 'http://127.0.0.1:1/api', messageId: 'nope', toolName: RECALL_TOOL_NAME,
      fetchImpl: thrower,
    }).done;
    expect(a.frames).toEqual([]);
    expect(a.reason).toContain('ECONNRESET');

    const notOk = (async () => new Response('nope', { status: 404 })) as unknown as typeof fetch;
    const b = await startRecallTap({
      apiBase: 'http://127.0.0.1:1/api', messageId: 'nope', toolName: RECALL_TOOL_NAME,
      fetchImpl: notOk,
    }).done;
    expect(b.reason).toContain('404');

    // And a failed capture degrades the run rather than failing it: every call keeps the
    // verdict it had before this module existed.
    const calls = [readCallKind('Searched own conversations: ')];
    const alignment = alignTapToCalls([], calls, { captureFailed: true, captureReason: b.reason });
    expect(alignment.status).toBe(TAP_STATUS.FAILED);
    expect(alignment.verdicts).toEqual([TAP_VERDICT.NO_FRAME]);
    expect(tapWarnings(tapSummary(alignment, calls)).join(' ')).toContain('no number below depends on the tap');
  });

  /**
   * Two calls, one summary, one surviving frame — which is what losing the subscribe race
   * by a hair produces. The two candidates are `{query: ''}` and a dropped expand: the
   * exact pair the tap exists to separate. Guessing an offset answers the tap's own
   * question by coin flip, so it attaches nothing.
   */
  it('refuses an ambiguous join instead of guessing which call the frame belongs to', async () => {
    h.rounds.push(
      { text: 'One.', tool: { name: RECALL_TOOL_NAME, input: { query: '' } } },
      { text: 'Two.', tool: { name: RECALL_TOOL_NAME, input: { expand: { conversation: 'vesper-1-1', from: '12', to: '38' } } } },
      { text: 'done' },
    );

    const { turn, frames } = await driveWithTap(klatch);
    const calls = callsFor(turn);

    expect(calls).toHaveLength(2);
    expect(calls[0].inputSummary).toBe(calls[1].inputSummary);
    expect(frames).toHaveLength(2);

    // Full capture is never ambiguous: only k=0 fits.
    expect(alignTapToCalls(frames, calls).status).toBe(TAP_STATUS.CAPTURED);

    // Drop the first frame — which is precisely what a late subscriber loses.
    const late = alignTapToCalls(frames.slice(1), calls);
    expect(late.status).toBe(TAP_STATUS.AMBIGUOUS);
    expect(late.verdicts).toEqual([TAP_VERDICT.NO_FRAME, TAP_VERDICT.NO_FRAME]);
    expect(late.inputs).toEqual([null, null]);

    // A partial capture whose alignment *is* unique still attaches, so the refusal above
    // is about ambiguity and not about partialness.
    const distinct = [readCallKind('Searched own conversations: alpha'), calls[1]];
    const partial = alignTapToCalls(frames.slice(1), distinct);
    expect(partial.status).toBe(TAP_STATUS.PARTIAL);
    expect(partial.offset).toBe(1);
    expect(partial.verdicts).toEqual([TAP_VERDICT.NO_FRAME, TAP_VERDICT.DROPPED_EXPAND]);
  });

  /**
   * Round 72, and it is Daedalus's finding against this file: `readTapVerdict` returned
   * `NO_FRAME` for `kind: 'unknown'` **whether or not a frame was captured**, so one value
   * meant both "the evidence is gone" and "the evidence is in hand and unreadable" — and
   * the console printed the first over the second, telling an operator to hand-adjudicate
   * from an artifact while the run's own JSON held the raw arguments.
   *
   * **The case is reachable from today's producer, which his memo did not claim and I
   * checked rather than assumed.** He framed `unknown` as firing on a future reword. It
   * also fires on *data*: `readExpandArg` (`client.ts:599`) accepts any `string`
   * conversation and any `number` from/to, while `EXPAND_SUMMARY` requires a non-empty
   * name and two integers. `{conversation: '', from: 12, to: 38}` — used here — is such a
   * row, and `from: -1` and `to: 3.5` are two more. No producer change is needed for the
   * false line to print; one call from a model that echoes an address back slightly wrong
   * is enough.
   *
   * **Corrected in Round 74, from Daedalus's §3.** This comment first called the row here
   * "an expand the server accepted and **executed**". It is accepted and then *refused*:
   * `readExpandArg` accepts it, so the call routes to expand rather than search, and
   * `expandConversationRange` trims the name, finds it empty and returns the address error
   * (`claude/recall.ts:688,713`) — pinned since Round 56 by `rejects a half-specified
   * address rather than guessing the rest`. The row that is accepted *and* executed is
   * `from: -1`: it clears the guard, `getEntityTranscriptRange` clamps the low end, and
   * eight real rows come back under a summary the classifier still cannot parse — pinned in
   * `round56-recall-expand.test.ts`, `runs a negative start, clamped, …`. Nothing below
   * changes: both rows classify `unknown`, which is all the tap turns on. What was wrong was
   * the prose explaining why the row matters, and prose is what the next reader reasons from.
   * The stronger row for the tap is arguably `-1` — unreadable *and* eight rows returned —
   * but swapping the fixture would change what this test measures mid-round, so it stays and
   * the executor half is pinned in Daedalus's file instead.
   *
   * What the fix may not do is score the row. `expand` on the wire plus an unparseable
   * summary is not evidence the call routed to search — asserting that would reimplement
   * `readExpandArg` and make the join one source read twice, the Round 58 rule and the
   * error this module was built to avoid. So `resolvedByTap` must not move and
   * `unresolvedCalls` must keep the row; only the reason string changes. Both are asserted
   * below, because a fix that quietly promoted the row to "resolved" would look like an
   * improvement in the console and be a regression in the invariant.
   */
  it('says "captured but unreadable" for a frame it holds, rather than "no frame reached it"', async () => {
    h.rounds.push(
      // Accepted by readExpandArg — `conversation` is a string, `from`/`to` are numbers.
      { text: 'Checking.', tool: { name: RECALL_TOOL_NAME, input: { expand: { conversation: '', from: 12, to: 38 } } } },
      { text: 'done' },
    );

    const { turn, frames } = await driveWithTap(klatch);
    const calls = callsFor(turn);

    // The artifact side first: this is the real producer's own output, not a fixture.
    expect(calls).toHaveLength(1);
    expect(calls[0].inputSummary).toBe('Expanded own conversation:  12–38');
    expect(calls[0].kind, 'the live producer reaches the unknown branch on data alone').toBe('unknown');

    const alignment = alignTapToCalls(frames, calls);
    // The premise of the whole finding: a frame WAS captured for this call.
    expect(alignment.status).toBe(TAP_STATUS.CAPTURED);
    expect(alignment.inputs[0]).toEqual({ expand: { conversation: '', from: 12, to: 38 } });
    expect(alignment.verdicts).toEqual([TAP_VERDICT.UNREADABLE_SUMMARY]);
    expect(alignment.verdicts[0], 'the pre-Round-72 value, which was the defect').not.toBe(TAP_VERDICT.NO_FRAME);

    const summary = tapSummary(alignment, calls);
    // The counts do not move. §1's rule — new information goes in reason strings and
    // additive objects, never into a count another round is compared against.
    expect(summary.flaggedCalls).toBe(1);
    expect(summary.resolvedByTap, 'holding the bytes is not adjudicating the row').toBe(0);
    expect(summary.unresolvedCalls, 'still hand-adjudicate; only the reason changed').toBe(1);
    expect(summary.unreadableSummaryCalls).toBe(1);

    const warnings = tapWarnings(summary).join(' ');
    expect(warnings).toContain('UNREADABLE SUMMARY');
    expect(warnings).toContain('tapInput');
    expect(warnings, 'the false line is gone, not merely outnumbered').not.toContain('no frame reached them');

    // Round 74 — the second defect in Round 72's fix, and it was in this file's own output.
    // The line ended "Producer-side grammar drift is the likely cause", which the *other*
    // half of Round 72 had already disproved as the sole cause: the row exercised by this
    // very test needs no producer change. An operator following that sentence opens
    // `client.ts`'s summary grammar for a case whose cause is in the arguments they are
    // already holding. Both causes must be named, and the argument check must come first,
    // because it is the one reachable today and the one they can run immediately.
    const argAt = warnings.search(/LOOSE ARGUMENT/);
    const driftAt = warnings.search(/grammar/i);
    expect(argAt, 'the reachable-today cause is named').toBeGreaterThan(-1);
    // Not `not.toContain('grammar')`: deleting the drift clause is the lazy fix and would
    // lose a real cause. Both must be present, in this order.
    expect(driftAt, 'grammar drift is kept, and demoted to second').toBeGreaterThan(argAt);
  });

  /**
   * The discriminator for the test above, and the reason it is a separate case: a fix that
   * simply deleted the "no frame reached them" line would pass every assertion there and
   * lose a true warning. Here the frame genuinely did not arrive, so that line must stay —
   * and the two must be able to appear in one run without either suppressing the other.
   */
  it('keeps the genuine no-frame warning, and prints both halves when a run has both', () => {
    const unreadable = readCallKind('Expanded own conversation:  12–38');
    const emptyTail = readCallKind('Searched own conversations: ');
    const calls = [unreadable, emptyTail];

    // One frame, for the first call only — a unique alignment at offset 0, so the second
    // row is genuinely unresolved and the first is captured-but-unreadable.
    const frames = [{ inputSummary: unreadable.inputSummary, toolInput: { expand: { conversation: '', from: 12, to: 38 } } }];

    const alignment = alignTapToCalls(frames, calls);
    expect(alignment.status).toBe(TAP_STATUS.PARTIAL);
    expect(alignment.verdicts).toEqual([TAP_VERDICT.UNREADABLE_SUMMARY, TAP_VERDICT.NO_FRAME]);

    const summary = tapSummary(alignment, calls);
    expect(summary.flaggedCalls, 'both rows are Round 69 flagged').toBe(2);
    expect(summary.resolvedByTap).toBe(0);
    expect(summary.unresolvedCalls).toBe(2);
    expect(summary.unreadableSummaryCalls).toBe(1);

    const warnings = tapWarnings(summary);
    expect(warnings.some((w: string) => w.includes('UNREADABLE SUMMARY'))).toBe(true);
    // Exactly one, not two: the split subtracts rather than double-counting.
    expect(warnings.some((w: string) => w.includes('1 flagged call(s)') && w.includes('no frame reached them'))).toBe(true);
    expect(warnings.join(' '), 'the halves sum to unresolvedCalls, never exceed it').not.toContain('2 flagged call(s)');
  });
});
