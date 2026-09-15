/**
 * Round 214 — the seeded default channel's purpose is dropped by assembly,
 * measured through the seed path rather than read out of the source.
 *
 * Theseus's Round 213 arm M found four hardcoded copies of the default preamble
 * in server code and watched them from `scripts/`, comparing each literal to the
 * shared constant by locating it in the source text. He named the limit himself:
 *
 * > Arm M reads source, it does not execute the seed path. It proves the strings
 * > match today, not that a mismatch would break assembly — that chain is
 * > reasoned from `isDefaultChannelPreamble`, which I read this session, not
 * > measured end to end.
 *
 * This measures the *assembly* half of that chain: it reads the seeded channel
 * purpose out of the database and asserts `buildSystemPrompt` does not open with
 * the boilerplate. The four sites now source `DEFAULT_CHANNEL_PREAMBLE`
 * (`db/index.ts` ×3, `routes/export.ts` ×1).
 *
 * **Scope correction, found by mutation.** An earlier version of this docstring
 * claimed it ran the real schema seed. It does not: `vitest.config.ts` registers
 * `setup.ts` as a global `setupFiles` entry, and that file mocks `db/index.js`
 * and declares its own schema and seed rows. The row read below is `setup.ts`'s.
 * Pointing the `db/index.ts` seed at a different string left this file fully
 * green, which is how the overclaim was caught. The production seed is executed
 * in `round214-real-seed-path.test.ts` instead, via `vi.importActual`.
 *
 * Why this is the defect worth a test rather than the literals being tidy: layer
 * 4 drops the channel's stored purpose *only* when `isDefaultChannelPreamble`
 * recognises it (`claude/client.ts`). Before this round, editing the shared
 * constant without editing the seed left the two disagreeing, and the seeded
 * channel silently resumed carrying "You are a helpful assistant." at char 0
 * above a chosen agent's identity — the Round 161 defect, re-created by a
 * one-line edit, with 1798 tests green.
 *
 * The mutation that matters is therefore *not* "change both" (which is
 * consistent) but "point the seed at a different string", and that is driven in
 * the session log rather than asserted here.
 */

import './setup.js';
import { describe, it, expect, vi } from 'vitest';
import { getDb } from '../db/index.js';
import { buildSystemPrompt } from '../claude/client.js';
import { getChannel, getEntity } from '../db/queries.js';
import {
  DEFAULT_CHANNEL_PREAMBLE,
  DEFAULT_ENTITY_ID,
  DEFAULT_MODEL,
  isDefaultChannelPreamble,
} from '@klatch/shared';
import type { Entity } from '@klatch/shared';

vi.mock('../claude/client.js', async (importOriginal) => {
  // buildSystemPrompt is the subject here, so keep the real module; only the
  // streaming surface needs stubbing for the import to be side-effect free.
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return { ...actual, streamClaude: vi.fn(), activeStreams: new Map(), abortStream: vi.fn(() => false) };
});

describe('Round 214 — the seeded preamble drops, measured end to end', () => {
  it('the fixture seeds a purpose the predicate recognises', () => {
    // Reads the row setup.ts's seed wrote, not the constant. See the scope
    // correction above: this is the test fixture's seed, not db/index.ts's.
    const row = getDb()
      .prepare("SELECT system_prompt FROM channels WHERE id = 'default'")
      .get() as { system_prompt: string } | undefined;

    expect(row, 'the seed did not create the default channel').toBeDefined();
    expect(isDefaultChannelPreamble(row!.system_prompt)).toBe(true);
  });

  it('assembly does not open with the boilerplate for a chosen agent', () => {
    // The Round 161 shape: a real identity at layer 5, the seeded generic
    // purpose at layer 4. Layer 4 must be dropped.
    const channel = getChannel('default');
    expect(channel).toBeDefined();

    const piper: Entity = {
      id: 'e-piper',
      name: 'Piper Morgan',
      model: DEFAULT_MODEL,
      systemPrompt: 'You are Piper Morgan, a product manager.',
      color: '#123456',
    } as Entity;

    const assembled = buildSystemPrompt(piper, channel!.systemPrompt, channel!);

    expect(assembled.startsWith(DEFAULT_CHANNEL_PREAMBLE)).toBe(false);
    expect(assembled).not.toContain(DEFAULT_CHANNEL_PREAMBLE);
    expect(assembled.startsWith('You are Piper Morgan')).toBe(true);
  });

  it('the seeded default entity still assembles to something — layer 5 is terminal', () => {
    // The counterpart Round 164 established: the same string at layer 5 is NOT
    // filtered, because layer 5 is terminal. Pointing the seed at the shared
    // constant must not turn the default entity's own prompt into a no-op.
    const channel = getChannel('default');
    const defaultEntity = getEntity(DEFAULT_ENTITY_ID);
    expect(defaultEntity, 'the seed did not create the default entity').toBeDefined();

    const assembled = buildSystemPrompt(defaultEntity!, channel!.systemPrompt, channel!);

    expect(assembled.trim().length).toBeGreaterThan(0);
    expect(assembled).toContain(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('no copy of the preamble text survives in server source', () => {
    // Arm M's property, kept here so it lives with the suite rather than only in
    // scripts/. Non-circular: it searches for the literal text, so re-hardcoding
    // it anywhere under src/ turns this red even though the constant is unchanged.
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const srcDir = path.join(__dirname, '..');
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
          walk(full);
          continue;
        }
        if (!entry.name.endsWith('.ts')) continue;
        const lines = fs.readFileSync(full, 'utf8').split('\n');
        lines.forEach((line, i) => {
          // Quoted occurrences only — the constant's own definition in shared/,
          // and prose in comments, are not copies that can drift.
          if (!line.includes(DEFAULT_CHANNEL_PREAMBLE)) return;
          const trimmed = line.trim();
          if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('--')) return;
          offenders.push(`${path.relative(srcDir, full)}:${i + 1}: ${trimmed}`);
        });
      }
    };
    walk(srcDir);

    expect(offenders).toEqual([]);
  });
});
