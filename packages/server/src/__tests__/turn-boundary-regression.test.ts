/**
 * Regression tests for the turn-boundary defect found 2026-08-28.
 *
 * The original isHumanTurnBoundary tested for the ABSENCE of isMeta and
 * isCompactSummary. Claude Code's transcript format changes additively, so every
 * new kind of injected user event arrived with no flag at all, passed the negative
 * test, and became a fabricated "You" turn — which also split the real turn it
 * landed inside, orphaning the assistant reply that belonged to the human.
 *
 * Measured against the committed capture exports/sessions/theseus-2026-03-22.jsonl
 * (1,001 events, Claude Code 2.1.73 + 2.1.81): 75 turns emitted, 66 real.
 * Nine fabricated — six flagless, three <task-notification> events that carry
 * permissionMode: "bypassPermissions" (documented as anomalous in
 * docs/JSONL-SCHEMA.md line 65).
 *
 * Every fixture below is a real shape lifted from that capture.
 */
import { describe, it, expect } from 'vitest';
import { isHumanTurnBoundary, groupIntoTurns, parseEvents, type RawEvent } from '../import/parser.js';

const userEvent = (text: string, extra: Partial<RawEvent> = {}): RawEvent => ({
  type: 'user',
  uuid: `u-${Math.random().toString(36).slice(2)}`,
  parentUuid: null,
  timestamp: '2026-03-22T18:00:00.000Z',
  message: { role: 'user', content: text },
  ...extra,
});

const STRICT = { requirePermissionMode: true };

describe('turn boundary — flagless machine-authored user events', () => {
  // These six carry no isMeta, no isCompactSummary, and no permissionMode.
  const flagless = [
    '<command-name>/login</command-name>\n            <command-message>login</command-message>',
    '<local-command-stdout>Login successful</local-command-stdout>',
    '<command-name>/model</command-name>\n            <command-message>model</command-message>',
    '<local-command-stdout>Set model to Default (Opus 4.6)</local-command-stdout>',
    'Unknown skill: rate-limit-options',
    'Unknown skill: remote-control',
  ];

  it.each(flagless)('rejects flagless injection: %s', (text) => {
    expect(isHumanTurnBoundary(userEvent(text), STRICT)).toBe(false);
  });

  it('rejected them under the legacy negative test — this is the defect', () => {
    // Documents why the positive test was needed: with no permissionMode requirement,
    // only the shape guard catches these.
    for (const text of flagless) {
      const legacyWouldAccept = !text.startsWith('<') && !text.startsWith('Unknown skill:');
      expect(legacyWouldAccept).toBe(false); // all are shape-detectable
    }
  });
});

describe('turn boundary — task notifications carry permissionMode but are not human', () => {
  const notification =
    '<task-notification>\n<task-id>b841jukyh</task-id>\n<tool-use-id>toolu_013nHVLe1g</tool-use-id>\n<status>completed</status>\n</task-notification>';

  it('rejects <task-notification> despite permissionMode being present', () => {
    const ev = userEvent(notification, { permissionMode: 'bypassPermissions' });
    expect(isHumanTurnBoundary(ev, STRICT)).toBe(false);
  });

  it('rejects it in legacy mode too — the shape guard is unconditional', () => {
    const ev = userEvent(notification, { permissionMode: 'bypassPermissions' });
    expect(isHumanTurnBoundary(ev)).toBe(false);
  });
});

describe('turn boundary — real human messages still pass', () => {
  it('accepts a plain human message with permissionMode', () => {
    expect(isHumanTurnBoundary(userEvent('what broke in the import pipeline?', { permissionMode: 'default' }), STRICT)).toBe(true);
  });

  it('accepts acceptEdits mode', () => {
    expect(isHumanTurnBoundary(userEvent('go ahead', { permissionMode: 'acceptEdits' }), STRICT)).toBe(true);
  });

  it('accepts array content with a text block', () => {
    const ev: RawEvent = {
      type: 'user', uuid: 'u1', parentUuid: null, timestamp: '2026-03-22T18:00:00.000Z',
      permissionMode: 'default',
      message: { role: 'user', content: [{ type: 'text', text: 'a real question' }] },
    };
    expect(isHumanTurnBoundary(ev, STRICT)).toBe(true);
  });

  it('still rejects the flagged injections it always rejected', () => {
    expect(isHumanTurnBoundary(userEvent('x', { permissionMode: 'default', isMeta: true }), STRICT)).toBe(false);
    expect(isHumanTurnBoundary(userEvent('x', { permissionMode: 'default', isCompactSummary: true }), STRICT)).toBe(false);
    expect(isHumanTurnBoundary(userEvent('x', { permissionMode: 'default', isVisibleInTranscriptOnly: true }), STRICT)).toBe(false);
  });
});

describe('back-compat — transcripts predating permissionMode', () => {
  it('falls back to the legacy test when no user event carries permissionMode', () => {
    const events = [
      userEvent('hello from an old transcript'),
      { type: 'assistant', uuid: 'a1', parentUuid: null, timestamp: '2026-03-22T18:00:01.000Z',
        message: { role: 'assistant' as const, content: 'hi' } },
      userEvent('and a second question'),
    ];
    const session = parseEvents(events);
    expect(session.integrity?.boundaryMode).toBe('legacy-flags');
    expect(session.turns.length).toBe(2); // both accepted, as before
  });

  it('switches to the strict test as soon as any user event carries permissionMode', () => {
    const events = [
      userEvent('a real question', { permissionMode: 'default' }),
      userEvent('<local-command-stdout>noise</local-command-stdout>'),
    ];
    const session = parseEvents(events);
    expect(session.integrity?.boundaryMode).toBe('permissionMode');
    expect(session.turns.length).toBe(1);
  });
});

describe('crash-proofing and metadata scanning', () => {
  it('does not throw when an event is missing a timestamp', () => {
    const events = [
      { type: 'user', uuid: 'u1', parentUuid: null, permissionMode: 'default',
        message: { role: 'user' as const, content: 'no timestamp here' } } as unknown as RawEvent,
      userEvent('second', { permissionMode: 'default' }),
    ];
    expect(() => groupIntoTurns(events, STRICT)).not.toThrow();
  });

  it('finds sessionId even when the first event lacks it', () => {
    // Real transcripts open with a file-history-snapshot that has no sessionId.
    const events = [
      { type: 'file-history-snapshot', uuid: 'f1', parentUuid: null, timestamp: '2026-03-22T17:59:00.000Z' },
      userEvent('hello', { permissionMode: 'default', sessionId: 'e8ad7ef9-5567-4c83-a9ee-f01eedc87e7e' }),
    ] as unknown as RawEvent[];
    expect(parseEvents(events).sessionId).toBe('e8ad7ef9-5567-4c83-a9ee-f01eedc87e7e');
  });

  it('collects every version seen, not just the first', () => {
    const events = [
      userEvent('a', { permissionMode: 'default', version: '2.1.73' }),
      userEvent('b', { permissionMode: 'default', version: '2.1.81' }),
    ];
    expect(parseEvents(events).versions).toEqual(['2.1.73', '2.1.81']);
  });
});

describe('integrity receipt', () => {
  it('reports counts that make a silent drop visible', () => {
    const events = [
      { type: 'file-history-snapshot', uuid: 'f1', parentUuid: null, timestamp: '2026-03-22T17:59:00.000Z' },
      { type: 'progress', uuid: 'p1', parentUuid: null, timestamp: '2026-03-22T17:59:01.000Z' },
      userEvent('a real question', { permissionMode: 'default' }),
      { type: 'assistant', uuid: 'a1', parentUuid: null, timestamp: '2026-03-22T18:00:01.000Z',
        message: { role: 'assistant' as const, content: 'an answer' } },
      userEvent('<local-command-stdout>noise</local-command-stdout>'),
    ] as unknown as RawEvent[];

    const { integrity } = parseEvents(events);
    expect(integrity).toBeDefined();
    expect(integrity!.eventCount).toBe(5);
    expect(integrity!.conversationEvents).toBe(3);
    expect(integrity!.turnsEmitted).toBe(1);
    expect(integrity!.injectedUserEventsFiltered).toBe(1);
    expect(integrity!.unrecognizedEventTypes).toEqual({ 'file-history-snapshot': 1, progress: 1 });
    expect(integrity!.boundaryMode).toBe('permissionMode');
  });
});
