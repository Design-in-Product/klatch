/**
 * Round 245 — `scripts/lib/mint-transcript.mts` under `npm test`.
 *
 * ## Why a server test covers a file in `scripts/`
 *
 * Round 243 §8 left `scripts/lib/*.mts` as "no `npm test` coverage, driven only by probes", and
 * Theseus's Round 244 §9 added that no staleness sweep has ever enumerated the directory either.
 * Measured before building: `scripts/lib` holds **13 modules, 5 covered / 8 uncovered** — and the
 * five that are covered are covered from right here, by direct relative import out of
 * `packages/server/src/__tests__` (`round85`, `round89`, `round71`). The mechanism was never
 * missing. What was missing is that the two `.mts` modules had not used it.
 *
 * ## What this file pins, and why it has to be the REAL parser
 *
 * `mintTranscript` exists to stand in for a Claude Code transcript. A stand-in is only valid while
 * the thing it stands in for still accepts it — and its docstring makes that claim explicitly:
 * *"The shape is the one the real parser accepts, verified against it rather than against the
 * docs."* That verification was a one-time act in Round 243, inside a probe, against a parser that
 * has changed since and will change again. A fixture generator checked against a hand-written
 * expectation of the parser certifies nothing about the parser — the same argument
 * `recall-recogniser.mjs` makes about itself, and the reason `round85` imports the script rather
 * than copying it.
 *
 * So the contract asserted here is the one the probes actually rely on: **turns in = turns out, of
 * the product's own `parseClaudeCodeSession`**, with an integrity receipt that shows the events
 * were counted as conversation rather than swallowed. If `isHumanTurnBoundary` tightens, or
 * `isConversationEvent` learns a new exclusion, every probe standing on minted rows starts
 * measuring a different population — and today nothing would say so. This file says so.
 *
 * ## What it cannot catch
 *
 * That the minted shape still resembles what Claude Code writes *now*. Both sides of this test
 * live in this repo, so a drift in the real format moves neither. That detection belongs to the
 * corpus surveys (Round 242 §4, the `attachment` survey in `ImportIntegrity`), not here. This
 * file's narrower job: the fixture and the parser cannot drift apart from each other unnoticed.
 */

import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseClaudeCodeSession } from '../import/parser.js';
import { mintTranscript } from '../../../../scripts/lib/mint-transcript.mts';

// One temp root for the file, removed at the end. `os.tmpdir()` is outside any Claude Code corpus
// root by construction, so the module's own write guard is never the thing under test here — it
// gets its own describe block below, with a synthetic root.
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round245-'));

afterAll(() => {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
});

describe('the minted transcript survives the real parser, turn for turn', () => {
  // 1 is the median real session (Round 242: 518 of 535 are exactly one turn) and the size at
  // which a "does it have more than one row" check silently becomes vacuous; 7 is the size
  // Round 243 arm F used; 2 is the smallest size at which fanout is representable at all.
  for (const turns of [1, 2, 7]) {
    it(`mints ${turns} turn(s) and the parser emits exactly ${turns}`, async () => {
      const id = `r245-parser-${turns}`;
      const minted = mintTranscript({ id, turns, dir: path.join(TMP_ROOT, id) });

      expect(minted.turns).toBe(turns);
      expect(fs.existsSync(minted.path)).toBe(true);

      const parsed = await parseClaudeCodeSession(minted.path);

      // The contract every minted-row probe stands on.
      expect(parsed.turns).toHaveLength(turns);
      expect(parsed.integrity?.turnsEmitted).toBe(turns);

      // …and the receipt that shows they were counted, not recovered from something lossy.
      // A parser that dropped half the events and re-derived the turns from the rest would
      // satisfy the line above; these are what make it not that.
      expect(parsed.integrity?.eventCount).toBe(turns * 2);
      expect(parsed.integrity?.conversationEvents).toBe(turns * 2);
      expect(parsed.integrity?.sidechainEvents).toBe(0);
      expect(parsed.integrity?.injectedUserEventsFiltered).toBe(0);
      expect(parsed.integrity?.skippedLines).toBe(0);
      expect(parsed.integrity?.skippedContentBearing.total).toBe(0);
      expect(parsed.integrity?.unrecognizedEventTypes).toEqual({});
    });
  }

  it('gives each turn a distinct question, answer, and assistant identity', async () => {
    // Round 243's own defect, generalised: a check that only counts rows passes when every row is
    // the same row. The import binds one message per assistant event, so if the minted events
    // shared a uuid or a text the fanout probes would be inspecting one thing N times.
    const turns = 7;
    const id = 'r245-distinct';
    const minted = mintTranscript({ id, turns, dir: path.join(TMP_ROOT, id) });
    const parsed = await parseClaudeCodeSession(minted.path);

    expect(new Set(parsed.turns.map((t) => t.userText)).size).toBe(turns);
    expect(new Set(parsed.turns.map((t) => t.assistantText)).size).toBe(turns);
    expect(new Set(parsed.turns.map((t) => t.originalId)).size).toBe(turns);
    expect(new Set(parsed.turns.map((t) => t.assistantOriginalId)).size).toBe(turns);
    expect(new Set(parsed.turns.map((t) => t.timestamp)).size).toBe(turns);
  });

  it('keeps turns in minted order past 100, which is what the zero-padding is for', async () => {
    // `mint-transcript.mts:116` pads the uuid stem to 3 "so timestamps stay sortable past 100
    // turns — a flat timestamp sort is what groupIntoTurns uses". The padding is on the uuid; the
    // ordering actually rides on the mm:ss arithmetic beside it, and nothing had ever run this
    // module past 7 turns. Drive the stated claim at a size where it could fail.
    const turns = 101;
    const id = 'r245-order';
    const minted = mintTranscript({ id, turns, dir: path.join(TMP_ROOT, id) });
    const parsed = await parseClaudeCodeSession(minted.path);

    expect(parsed.turns).toHaveLength(turns);
    const asked = parsed.turns.map((t) => Number(/^Question (\d+)/.exec(t.userText)?.[1]));
    expect(asked).toEqual([...Array(turns).keys()]);
    // Independently of the text: the timestamps the sort actually used are strictly increasing.
    const stamps = parsed.turns.map((t) => t.timestamp);
    expect([...stamps].sort()).toEqual(stamps);
  });

  it('records the model it was asked for, so a cast probe reads its own setpoint', async () => {
    const id = 'r245-model';
    const minted = mintTranscript({
      id,
      turns: 2,
      dir: path.join(TMP_ROOT, id),
      model: 'claude-haiku-4-5-20251001',
    });
    const parsed = await parseClaudeCodeSession(minted.path);
    expect(parsed.model).toBe('claude-haiku-4-5-20251001');
    expect(parsed.turns.every((t) => t.model === 'claude-haiku-4-5-20251001')).toBe(true);
  });
});

describe('the write guard is structural — it refuses before it writes', () => {
  // Round 243 arm G drove five evasion shapes against the LIVE corpus root. Repeating that under
  // `npm test` would make the suite's behaviour depend on the machine's home directory, so the
  // root here is synthetic and passed in. That is the same guard: `forbiddenRoots` defaults to
  // the live root and is compared the same way.
  const FAKE_ROOT = path.join(TMP_ROOT, 'fake-corpus', 'projects');

  const shapes: Array<[string, string]> = [
    ['the root itself', FAKE_ROOT],
    ['a project directory inside it', path.join(FAKE_ROOT, '-Users-test-proj')],
    ['a nested subagents directory', path.join(FAKE_ROOT, '-Users-test-proj', 'abc', 'subagents')],
    ['a path that re-enters via ..', path.join(FAKE_ROOT, 'x', '..', 'y')],
    ['a trailing separator', path.join(FAKE_ROOT, '-Users-test-proj') + path.sep],
  ];

  for (const [label, dir] of shapes) {
    it(`throws for ${label}`, () => {
      expect(() => mintTranscript({ id: 'r245-guard', turns: 1, dir, forbiddenRoots: [FAKE_ROOT] }))
        .toThrow(/refusing to mint/i);
    });
  }

  it('leaves nothing behind when it refuses', () => {
    // The point of a structural guard rather than an after-the-fact check: the directory it was
    // asked to write into must not even come into existence.
    expect(fs.existsSync(FAKE_ROOT)).toBe(false);
  });

  it('still mints when the target is merely NEAR the root, not inside it', () => {
    // The prefix comparison has to be path-segment-aware: `…/projects-elsewhere` starts with
    // `…/projects` as a string and is not inside it. A guard that refuses this is over-broad, and
    // over-broad guards get relaxed by whoever hits them next.
    const near = FAKE_ROOT + '-elsewhere';
    const minted = mintTranscript({ id: 'r245-near', turns: 1, dir: near, forbiddenRoots: [FAKE_ROOT] });
    expect(fs.existsSync(minted.path)).toBe(true);
  });

  it('refuses a turn count below one instead of minting an empty file', () => {
    const dir = path.join(TMP_ROOT, 'r245-zero');
    expect(() => mintTranscript({ id: 'r245-zero', turns: 0, dir })).toThrow(RangeError);
    expect(fs.existsSync(dir)).toBe(false);
  });
});
