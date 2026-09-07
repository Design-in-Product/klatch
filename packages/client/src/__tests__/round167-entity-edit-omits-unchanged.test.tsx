/**
 * Round 167 item 4 (2026-09-07) — the guard that keeps the two halves of the
 * Round 166 ruling apart.
 *
 * From Theseus's endpoint drive
 * (`docs/research/round167-the-floor-holds-at-the-endpoint-and-four-open-items-2026-09-07.md`):
 *
 * > The two halves of your ruling are held apart by client-side code only. PATCH
 * > substitutes, the import writers preserve — and an imported blank is reachable
 * > by the very route that substitutes.
 *
 * Round 166 ruled that `PATCH /entities/:id` substitutes `DEFAULT_CHANNEL_PREAMBLE`
 * for a cleared prompt (a user clearing a field is erasure, not selection), while
 * `import/entity-resolve.ts` and `import/klatch-import.ts` deliberately mint and
 * preserve `''` (an imported agent's identity is its transcript — inventing a role
 * prompt at import time is the drift `PREMISE.md` warns about).
 *
 * Both rulings stand. What holds them apart is that `EntityForm`'s **update**
 * branch sends changed fields only, so a name-only edit of an imported agent
 * sends `{ name }` and the server never sees the blank. Its **create** branch,
 * eleven lines below, sends every field unconditionally. The server cannot tell
 * "user cleared the field" from "client sent it unchanged" — there is no signal
 * on the wire for it — so the entire protection is this dirty-field check.
 *
 * That makes the ordinary simplification ("both branches build the same object")
 * a silent data change: every imported agent would be boilerplated on its next
 * unrelated edit. These tests are the tripwire. If you are here because one of
 * them failed after a refactor, the refactor is the bug.
 *
 * STABILITY: synchronous `fireEvent`, per the convention in
 * `composition-path-c-continue-existing-role.test.tsx`.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityManager } from '../components/EntityManager';
import { DEFAULT_CHANNEL_PREAMBLE } from '@klatch/shared';
import type { Entity } from '@klatch/shared';

vi.mock('../hooks/useModels', () => ({
  useModels: () => ({
    models: [
      { id: 'claude-opus-5', displayName: 'Claude Opus 5', maxOutputTokens: 16384, capabilities: { thinking: true, effort: ['low', 'medium', 'high', 'xhigh', 'max'], compaction: false } },
    ],
    loading: false,
    defaultModel: 'claude-opus-5',
    aliases: {},
    source: 'fallback',
  }),
  getModelLabel: (id: string) => id,
}));

/** An agent as writer six mints it: named, and deliberately promptless. */
function imported(): Entity {
  return {
    id: 'e-imported',
    name: 'Promptless',
    handle: undefined,
    model: 'claude-opus-5',
    effort: 'high',
    systemPrompt: '',
    color: '#3b82f6',
    createdAt: '2026-09-01T00:00:00Z',
  } as Entity;
}

function renderManager(entity: Entity) {
  const onUpdateEntity = vi.fn();
  const onCreateEntity = vi.fn();
  render(
    <EntityManager
      entities={[entity]}
      onCreateEntity={onCreateEntity}
      onUpdateEntity={onUpdateEntity}
      onDeleteEntity={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByTitle('Edit agent'));
  return { onUpdateEntity, onCreateEntity };
}

describe('Round 167 item 4 — the edit dialog sends changed fields only', () => {
  it('a name-only edit of an imported agent does not send systemPrompt at all', () => {
    const { onUpdateEntity } = renderManager(imported());

    fireEvent.change(screen.getByPlaceholderText('Agent name'), { target: { value: 'Promptless Renamed' } });
    fireEvent.click(screen.getByText('Save'));

    expect(onUpdateEntity).toHaveBeenCalledTimes(1);
    const [id, updates] = onUpdateEntity.mock.calls[0];
    expect(id).toBe('e-imported');
    expect(updates).toEqual({ name: 'Promptless Renamed' });
    // The load-bearing assertion. Present-but-`''` would 200 and store the
    // boilerplate, because the route cannot distinguish it from a clear.
    expect('systemPrompt' in updates).toBe(false);
  });

  it('the blank renders as an empty field — `??` does not catch `\'\'`', () => {
    // Iris's prefill ruling reads `entity?.systemPrompt ?? DEFAULT_CHANNEL_PREAMBLE`,
    // and `??` passes `''` through. Pinned because the *other* obvious tidy-up
    // here — switching to `||` so the field shows something — would make
    // `systemPrompt.trim() !== entity.systemPrompt` true on open and start
    // sending the boilerplate on every save.
    renderManager(imported());
    // The role prompt is the form's only textarea; the labels here aren't
    // `htmlFor`-associated, so query by tag rather than by accessible name.
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    expect(textarea.value).not.toBe(DEFAULT_CHANNEL_PREAMBLE);
  });

  it('an unchanged save sends nothing rather than an empty update', () => {
    const { onUpdateEntity } = renderManager(imported());
    fireEvent.click(screen.getByText('Save'));
    expect(onUpdateEntity).not.toHaveBeenCalled();
  });

  it('deliberately editing the prompt still sends it', () => {
    // The dirty check must not be so conservative that a real edit is dropped.
    const { onUpdateEntity } = renderManager(imported());
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'You are Promptless, and now you know it.' } });
    fireEvent.click(screen.getByText('Save'));

    expect(onUpdateEntity).toHaveBeenCalledTimes(1);
    expect(onUpdateEntity.mock.calls[0][1]).toEqual({ systemPrompt: 'You are Promptless, and now you know it.' });
  });

  it('an agent with a real prompt is likewise untouched by a name-only edit', () => {
    // Not import-specific: the property is "send what changed", and the blank
    // case is just where violating it is destructive.
    const piper = { ...imported(), id: 'e-piper', name: 'Piper Morgan', systemPrompt: 'You are Piper Morgan.' } as Entity;
    const { onUpdateEntity } = renderManager(piper);

    fireEvent.change(screen.getByPlaceholderText('Agent name'), { target: { value: 'Piper M.' } });
    fireEvent.click(screen.getByText('Save'));

    expect(onUpdateEntity.mock.calls[0][1]).toEqual({ name: 'Piper M.' });
  });
});
