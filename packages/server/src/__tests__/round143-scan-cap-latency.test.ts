/**
 * Round 143 — the `lineCap` override, and the density mechanism it exists to price.
 *
 * Daedalus, 2026-09-03 WORK fire. Theseus's Round 142 memo left one item
 * explicitly on this seat: measure the scan-latency cost of raising
 * FINGERPRINT_LINE_CAP. Measuring it against the shipped function rather than a
 * copy required making the cap an optional argument
 * (session-scanner.ts:134). These tests exist so that the override cannot
 * silently change product behavior, and so the mechanism the measurement rests
 * on is pinned rather than remembered.
 *
 * Three things are locked here:
 *
 *   1. **The default is unchanged.** The whole safety argument for adding a
 *      parameter is that no product caller passes it, so browse behaves exactly
 *      as it did before. A default that drifts off 1500 would be invisible in
 *      every other test in the suite — they don't pass a cap either.
 *   2. **The override is real in both directions**, including Infinity, which
 *      the probe's uncapped arm depends on. If Infinity capped, the probe's
 *      "100% of true total" baseline would be a fiction and every percentage in
 *      docs/scan-cap-latency-2026-09-03.md would be wrong.
 *   3. **Front-loaded density is why the cap costs turns disproportionately.**
 *      Theseus measured this on the real corpus (worst case 56.0 evt/turn before
 *      the cut, 15.2 after). A fixture can't prove that real sessions have that
 *      shape, and doesn't try to. It proves the weaker, structural claim the
 *      recommendation actually needs: WHEN density is front-loaded, raising the
 *      cap buys turns superlinearly. That's the mechanism; the corpus supplies
 *      the fact that it fires.
 */

import './setup.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { extractSessionFingerprint } from '../import/session-scanner.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

let tmpDir: string;
let nextFixtureId = 0;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'round143-cap-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeFixture(events: Array<object | string>): string {
  const filePath = path.join(tmpDir, `fixture-${nextFixtureId++}.jsonl`);
  fs.writeFileSync(filePath, events.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join('\n'));
  return filePath;
}

// NOTE: `role` is load-bearing, not decoration. isHumanTurnBoundary
// (parser.ts:257) returns false unless message.role === 'user', while the
// scanner's own event filter doesn't check it. A fixture without `role` counts
// as an event but never as a turn — which is exactly how the first draft of
// these tests measured 0 turns on a 330-turn session.
function userText(text: string): object {
  return { type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } };
}

function assistantText(text: string): object {
  return { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } };
}

/** A tool-result user event — counts as an event, never as a turn boundary. */
function toolResult(): object {
  return { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x' }] } };
}

// ── 1. The default must not move ────────────────────────────

describe('Round 143: adding lineCap did not change the shipped default', () => {
  // Updated 2026-09-04 (xian's ruling: remove the cap, keep a pathological guard).
  // The assertion this replaces pinned the default at 1500 and failed the moment the
  // guard moved — which is what it was for. It is re-pinned rather than deleted: the
  // point was never the number, it was that the shipped default cannot drift silently.
  it('does not cap a session that the old 1500 cap would have clipped', async () => {
    const events: object[] = [userText('first')];
    for (let i = 0; i < 1599; i++) events.push(assistantText(`a${i}`));
    const filePath = writeFixture(events);

    const withoutArg = await extractSessionFingerprint(filePath);
    const withOldCap = await extractSessionFingerprint(filePath, 1500);

    // The whole point of the ruling: this file used to come back a lower bound.
    expect(withoutArg.capped).toBe(false);
    expect(withOldCap.capped).toBe(true);
    expect(withoutArg.messageCount).toBeGreaterThan(withOldCap.messageCount);
  });

  it('still applies the guard at its documented value, so the default cannot drift', async () => {
    const events: object[] = [userText('first')];
    for (let i = 0; i < 50_100; i++) events.push(assistantText(`a${i}`));
    const filePath = writeFixture(events);

    const withoutArg = await extractSessionFingerprint(filePath);
    const withExplicitGuard = await extractSessionFingerprint(filePath, 50_000);

    expect(withoutArg.capped).toBe(true);
    expect(withoutArg).toEqual(withExplicitGuard);
  });

  it('a file under the default cap is unaffected by the parameter existing', async () => {
    const events: object[] = [];
    for (let i = 0; i < 100; i++) events.push(i % 2 === 0 ? userText(`m${i}`) : assistantText(`r${i}`));
    const filePath = writeFixture(events);

    const fp = await extractSessionFingerprint(filePath);
    expect(fp.capped).toBe(false);
    expect(fp.messageCount).toBe(100);
  });
});

// ── 2. The override works in both directions ────────────────

describe('Round 143: lineCap override', () => {
  it('a higher cap reads past 1500 and finds more', async () => {
    const events: object[] = [userText('first')];
    for (let i = 0; i < 2999; i++) events.push(assistantText(`a${i}`));
    const filePath = writeFixture(events);

    const low = await extractSessionFingerprint(filePath, 1500);
    const high = await extractSessionFingerprint(filePath, 5000);

    expect(low.capped).toBe(true);
    expect(high.capped).toBe(false);
    expect(high.messageCount).toBeGreaterThan(low.messageCount);
    expect(high.messageCount).toBe(3000);
  });

  it('a lower cap stops earlier', async () => {
    const events: object[] = [userText('first')];
    for (let i = 0; i < 99; i++) events.push(assistantText(`a${i}`));
    const filePath = writeFixture(events);

    const fp = await extractSessionFingerprint(filePath, 10);
    expect(fp.capped).toBe(true);
    expect(fp.messageCount).toBe(10);
    // The first user message still survives a tiny cap — it's line 1.
    expect(fp.firstUserMessage).toBe('first');
  });

  it('Infinity never caps — the probe\'s uncapped baseline is real', async () => {
    const events: object[] = [userText('first')];
    for (let i = 0; i < 4999; i++) events.push(assistantText(`a${i}`));
    const filePath = writeFixture(events);

    const fp = await extractSessionFingerprint(filePath, Infinity);
    expect(fp.capped).toBe(false);
    expect(fp.messageCount).toBe(5000);
  });
});

// ── 3. The mechanism: front-loaded density ──────────────────

describe('Round 143: front-loaded density makes the cap cost turns superlinearly', () => {
  /**
   * A session that opens with a long tool-heavy autonomous stretch and turns
   * conversational later — the shape Theseus found in every corpus session
   * where turns retained worse than events.
   *
   * Prefix: 1 turn per 50 events. Suffix: 1 turn per 2 events.
   */
  function frontLoadedSession(): object[] {
    const events: object[] = [];
    for (let t = 0; t < 30; t++) {
      events.push(userText(`autonomous turn ${t}`));
      for (let i = 0; i < 49; i++) events.push(toolResult());
    }
    for (let t = 0; t < 300; t++) {
      events.push(userText(`chat turn ${t}`));
      events.push(assistantText(`reply ${t}`));
    }
    return events;
  }

  it('the marginal line past the cap is far more turn-dense than the average line before it', async () => {
    // The fixture is 1500 prefix lines (30 turns) + 600 suffix lines (300
    // turns) = 2100 lines, 330 turns.
    const filePath = writeFixture(frontLoadedSession());

    const at1500 = await extractSessionFingerprint(filePath, 1500);
    const at3000 = await extractSessionFingerprint(filePath, 3000);

    expect(at1500.capped).toBe(true);
    expect(at3000.capped).toBe(false);

    // The denominator here is LINES, not messageCount. The cap counts lines
    // (session-scanner.ts:158) while messageCount deliberately skips
    // tool_result rows (session-scanner.ts:175), so messageCount-per-turn is
    // the wrong ratio for pricing the cap and would make a tool-heavy prefix
    // look turn-dense. That mismatch is the whole reason a fixture is worth
    // having here.
    const turnsInPrefix = at1500.turnCount;             // 30, over 1500 lines
    const turnsInSuffix = at3000.turnCount - turnsInPrefix; // 300, over 600 lines

    const yieldBefore = turnsInPrefix / 1500;
    const yieldAfter = turnsInSuffix / 600;

    expect(turnsInPrefix).toBe(30);
    expect(turnsInSuffix).toBe(300);
    // 0.02 turns/line before the cut vs 0.50 after — a 25x marginal difference.
    // This is the shape that makes raising the cap buy disproportionately many
    // turns rather than a linear share of them.
    expect(yieldAfter / yieldBefore).toBeGreaterThan(10);
  });

  it('the capped turnCount is a lower bound, never an overstatement', async () => {
    const filePath = writeFixture(frontLoadedSession());

    const capped = await extractSessionFingerprint(filePath, 1500);
    const truth = await extractSessionFingerprint(filePath, Infinity);

    // Theseus's argument for the unit change: `turnCount+` can only ever
    // understate. Pin that direction — a cap that could overstate would make
    // the "+" a broken promise the same way `messageCount+` was.
    expect(capped.turnCount).toBeLessThanOrEqual(truth.turnCount);
    expect(truth.turnCount).toBe(330);
  });
});
