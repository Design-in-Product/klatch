/**
 * Round 168 (2026-09-07) — the one open item from Theseus's endpoint drive of
 * Round 167's floor report
 * (`docs/research/round168-the-floor-reports-itself-and-the-path-c-gesture-2026-09-07.md`,
 * arm F).
 *
 * The pair held and the predicate survived; what arm F found instead was a
 * divergence the pair could not have caught, because it is between *sites*
 * rather than between states. The three layer-reporting call sites had drifted
 * to two wordings for the ACTIVE case — `channels.ts` (prompt-debug) explained
 * itself, "…substituted so the prompt is not zero-length"; the two `aaxt.ts`
 * sites stopped at "…substituted". INACTIVE was byte-identical across all three.
 * So the *same floor state* read differently depending on which endpoint you
 * asked. Theseus flagged it and declined to rule, correctly: it is a contract
 * question, not a measurement.
 *
 * The ruling, in two parts:
 *
 * 1. **One source.** The text now lives in `FLOOR_REPORT`, next to the
 *    `assembleSystemPrompt` that computes `floorApplied`. Three copies are what
 *    made the drift possible; deleting the copies makes it impossible rather
 *    than currently-absent. The longer wording won — it is the more informative
 *    one, and it is what the endpoint under test already emitted, so aligning
 *    upward changed bytes only at the two `aaxt.ts` sites, which are
 *    source-compared and not endpoint-pinned (arm F says this in its own output).
 *
 * 2. **The prefix is the contract; the prose is not.** A consumer may key on
 *    `ACTIVE` / `INACTIVE`. Nothing may key on the sentence after the em-dash —
 *    improving that sentence is what Round 162 did for layer 4 and what Round
 *    167 did for the floor, and freezing it would make the next such improvement
 *    a breaking change. That is the line these tests pin: the verdict token is
 *    stable and machine-readable, the explanation is free to get better.
 *
 * Note on coverage, kept explicit so silence does not read as verification: the
 * two `aaxt.ts` sites still cannot be driven without model spend, so what pins
 * them is the shared constant plus this file's identity check — not an endpoint
 * measurement. The defect class is closed structurally, not observationally.
 */

import './setup.js';
import { describe, it, expect } from 'vitest';
import { createTestApp } from './app.js';
import { createChannel, createEntity, assignEntityToChannel } from '../db/queries.js';
import { FLOOR_REPORT } from '../claude/client.js';
import { DEFAULT_CHANNEL_PREAMBLE } from '@klatch/shared';

describe('Round 168 — the floor report has one source and a stable prefix', () => {
  it('exposes exactly the two verdicts, each led by its machine-readable token', () => {
    // The half of the string consumers are allowed to depend on.
    expect(FLOOR_REPORT.active.startsWith('ACTIVE')).toBe(true);
    expect(FLOOR_REPORT.inactive.startsWith('INACTIVE')).toBe(true);
    // `startsWith('ACTIVE')` must not also match the negative case — 'INACTIVE'
    // contains 'ACTIVE', so the *prefix* test is the load-bearing one and a
    // `.includes()` consumer would read every room as floored.
    expect(FLOOR_REPORT.inactive.startsWith('ACTIVE')).toBe(false);
    expect(FLOOR_REPORT.inactive.includes('ACTIVE')).toBe(true);
  });

  it('keeps the ACTIVE report self-explaining — the Round 162 property', () => {
    // Why the longer wording won: a reader who does not know the constant must
    // be able to tell where the 28 bytes came from from the report alone.
    expect(FLOOR_REPORT.active).toContain('DEFAULT_CHANNEL_PREAMBLE');
    expect(FLOOR_REPORT.active).toContain('not zero-length');
  });

  it('prompt-debug emits the shared constant verbatim, not a local copy', async () => {
    // If anyone re-inlines the string at this site, this fails on the first
    // character of divergence rather than at some later endpoint comparison.
    const ch = createChannel('floored', DEFAULT_CHANNEL_PREAMBLE);
    const ent = createEntity('Promptless', 'claude-opus-5', '', '#3b82f6');
    assignEntityToChannel(ch.id, ent.id);

    const body = await (await createTestApp().request(`/api/channels/${ch.id}/prompt-debug?entityId=${ent.id}`)).json();
    expect(body.assembledLength).toBe(28);
    expect(body.layers['7_floor']).toBe(FLOOR_REPORT.active);
  });

  it('prompt-debug emits the shared INACTIVE constant for the boilerplate-as-identity agent', async () => {
    // Theseus's pair, now asserted on the *whole* string rather than a
    // substring: same 28 bytes as the case above, opposite verdict, and the
    // report a new user's seeded default agent gets.
    const ch = createChannel('identity-is-boilerplate', DEFAULT_CHANNEL_PREAMBLE);
    const ent = createEntity('Echo', 'claude-opus-5', DEFAULT_CHANNEL_PREAMBLE, '#3b82f6');
    assignEntityToChannel(ch.id, ent.id);

    const body = await (await createTestApp().request(`/api/channels/${ch.id}/prompt-debug?entityId=${ent.id}`)).json();
    expect(body.assembledLength).toBe(28);
    expect(body.layers['7_floor']).toBe(FLOOR_REPORT.inactive);
  });
});
