/**
 * Offline model fallback — the entity editor must not grey out capabilities the
 * model actually has.
 *
 * When `/api/models` is unreachable, `useModels` builds a local fallback set.
 * That fallback used to give *every* model `['low','medium','high']`, while the
 * server's own offline fallback was model-aware. `EntityManager` gates the
 * effort picker on the discovered ladder and only degrades to "allowed" for a
 * model it doesn't recognise at all — so a present-but-wrong entry is worse
 * than a missing one: with the server down, xhigh and max were disabled on
 * Opus 5, which supports both.
 *
 * Both fallbacks now come from one derivation in `@klatch/shared`. These tests
 * drive the real hook (fetch rejected) through the real component, so they fail
 * if either half regresses.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen, act } from '@testing-library/react';
import { DEFAULT_MODEL, DEFAULT_EFFORT } from '@klatch/shared';
import { EntityManager } from '../components/EntityManager';

// The server is unreachable — this is the whole scenario.
vi.mock('../api/client', () => ({
  fetchModels: vi.fn().mockRejectedValue(new Error('network down')),
}));

/**
 * Render the roster and open the create form. Both steps run inside `act` so
 * the rejected models fetch has settled and the fallback is in state before any
 * assertion reads the picker.
 */
async function openCreateForm() {
  let container!: HTMLElement;
  await act(async () => {
    ({ container } = render(
      <EntityManager
        entities={[]}
        onCreateEntity={() => {}}
        onUpdateEntity={() => {}}
        onDeleteEntity={() => {}}
        onClose={() => {}}
      />,
    ));
  });

  const newAgent = screen
    .getAllByRole('button')
    .find((b) => /new agent|add agent|\+/i.test(b.textContent || ''));
  if (!newAgent) throw new Error('no control to open the create form');
  await act(async () => {
    newAgent.click();
  });

  if (!/effort/i.test(container.textContent || '')) {
    throw new Error('create form did not open — the effort picker is not rendered');
  }
  return container;
}

async function selectModel(label: string) {
  const btn = screen.getAllByRole('button').find((b) => b.textContent?.trim() === label);
  if (!btn) throw new Error(`model "${label}" is not in the offline picker`);
  await act(async () => {
    btn.click();
  });
}

function effortButton(level: string): HTMLButtonElement {
  const btn = screen
    .getAllByRole('button')
    .find((b) => b.textContent?.trim() === level) as HTMLButtonElement | undefined;
  if (!btn) throw new Error(`no effort button labelled "${level}"`);
  return btn;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('EntityManager effort picker with /api/models unreachable', () => {
  it('offers the full ladder on the default model (Opus 5 supports xhigh and max)', async () => {
    await openCreateForm();

    // DEFAULT_MODEL is pre-selected on a new entity; every level of its ladder
    // must be selectable, not just the three the old client copy assumed.
    expect(DEFAULT_MODEL).toBe('claude-opus-5');
    for (const level of ['low', 'medium', 'high', 'xhigh', 'max']) {
      expect(effortButton(level).disabled, `${level} should be selectable on ${DEFAULT_MODEL}`).toBe(false);
    }
  });

  it('still restricts a model that genuinely lacks the upper levels', async () => {
    await openCreateForm();

    // Sonnet 4.6 stops at high — pick it and the top two go dead. This is the
    // control: the fix widened the ladder where it was wrong, it did not
    // disable gating.
    await selectModel('Sonnet');

    expect(effortButton('xhigh').disabled).toBe(true);
    expect(effortButton('max').disabled).toBe(true);
    expect(effortButton('high').disabled).toBe(false);
  });

  it('falls back to DEFAULT_EFFORT for the pre-selected level when the server never answers', async () => {
    await openCreateForm();

    // `recommendedEffort` normally comes from the server; offline it is the
    // shared constant, and the form must still show a selection rather than none.
    const selected = effortButton(DEFAULT_EFFORT);
    expect(selected.className).toMatch(/border-accent/);
  });
});
