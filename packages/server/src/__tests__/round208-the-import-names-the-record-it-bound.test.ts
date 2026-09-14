/**
 * Round 208 — the import says which entity it actually bound.
 *
 * Theseus's Round 207 §4, items 2 and 3. Two findings from his arm D, driven
 * through the real route:
 *
 *   1. `ImportDialog.tsx` echoed `confirmedName` on its result line, so the
 *      confirmation read back the user's own input rather than the record it
 *      had just written to. Typing `DAEDALUS` binds an entity stored as
 *      `Daedalus` and the line still said `DAEDALUS`. This is wrong even when
 *      no name in the database is duplicated — it is not an ambiguity bug.
 *   2. The ambiguous response carried **no field** the unambiguous one didn't,
 *      so a client could not offer a picker for a collision it was never told
 *      about.
 *
 * Deliberately NOT a refusal, and that is the whole design point. The backfill
 * plan (Round 206) refuses an ambiguous name because a refused backfill row
 * costs nothing. A refused *import* costs the operator the import, and
 * reuse-by-name is the feature on this path — Theseus measured 548 live
 * sessions across 20 names, 121 of them proposing "Calliope", which *should*
 * land on one Calliope. One stray duplicate would turn 121 imports into 121
 * refusals. So: bind, and say what was bound.
 */

import { describe, it, expect } from 'vitest';
import { resolveImportEntity } from '../import/entity-resolve.js';
import { createEntity, getAllEntities } from '../db/queries.js';
import { DEFAULT_MODEL } from '@klatch/shared';

describe('Round 208 — the resolved name is the stored one, not the typed one', () => {
  it('reports the stored casing when the confirmed name differs by case', () => {
    const stored = createEntity('Daedalus', DEFAULT_MODEL, '', '#fff');

    const resolved = resolveImportEntity({ entityName: 'DAEDALUS' });

    expect(resolved.disposition).toBe('matched-by-name');
    expect(resolved.entityId).toBe(stored.id);
    // The point of the round: what comes back is the record, not the input.
    expect(resolved.entityName).toBe('Daedalus');
    expect(resolved.entityName).not.toBe('DAEDALUS');
  });

  it('reports the name on a mint too, so the caller never has to fall back', () => {
    const resolved = resolveImportEntity({ entityName: '  Theseus  ' });

    expect(resolved.disposition).toBe('minted');
    // Trimmed on the way in, so even here the echo and the record differ.
    expect(resolved.entityName).toBe('Theseus');
  });

  it('reports the name when bound explicitly by id', () => {
    const stored = createEntity('Argus', DEFAULT_MODEL, '', '#fff');

    const resolved = resolveImportEntity({ entityId: stored.id, entityName: 'ignored' });

    expect(resolved.disposition).toBe('bound-existing');
    expect(resolved.entityName).toBe('Argus');
  });

  it('leaves the name undefined when nothing was confirmed', () => {
    const resolved = resolveImportEntity({});

    expect(resolved.disposition).toBe('default');
    expect(resolved.entityName).toBeUndefined();
    expect(resolved.entityId).toBeUndefined();
  });
});

describe('Round 208 — a duplicated name is reported, not refused', () => {
  it('still binds, and names every candidate when more than one carries the name', () => {
    const first = createEntity('Daedalus', DEFAULT_MODEL, '', '#fff');
    const second = createEntity('daedalus', DEFAULT_MODEL, '', '#000');

    const resolved = resolveImportEntity({ entityName: 'Daedalus' });

    // Binds — the import is not refused. This is the asymmetry with the backfill.
    expect(resolved.disposition).toBe('matched-by-name');
    expect(resolved.entityId).toBeDefined();
    // And says it was a pick among several, with both ids on the response.
    expect(resolved.sameNameEntityIds?.slice().sort()).toEqual(
      [first.id, second.id].sort()
    );
  });

  it('omits the field entirely when the name identifies exactly one entity', () => {
    createEntity('Calliope', DEFAULT_MODEL, '', '#fff');

    const resolved = resolveImportEntity({ entityName: 'Calliope' });

    // Presence of the field IS the signal, so the unambiguous case must not
    // carry an empty array — `sameNameEntityIds && ...` has to mean "ask a human".
    expect(resolved.sameNameEntityIds).toBeUndefined();
  });

  it('omits the field on a mint — nothing carried the name at all', () => {
    const resolved = resolveImportEntity({ entityName: 'Nobody' });

    expect(resolved.disposition).toBe('minted');
    expect(resolved.sameNameEntityIds).toBeUndefined();
  });

  it('omits the field when bound by id — the caller already disambiguated', () => {
    const first = createEntity('Iris', DEFAULT_MODEL, '', '#fff');
    createEntity('Iris', DEFAULT_MODEL, '', '#000');

    const resolved = resolveImportEntity({ entityId: first.id });

    expect(resolved.disposition).toBe('bound-existing');
    expect(resolved.entityId).toBe(first.id);
    // There is nothing arbitrary left to report; reporting here would be noise
    // that a picker would have to learn to ignore.
    expect(resolved.sameNameEntityIds).toBeUndefined();
  });

  it('picks the (created_at, id) winner — stable, and NOT necessarily the oldest', () => {
    const a = createEntity('Janus', DEFAULT_MODEL, '', '#fff');
    const b = createEntity('Janus', DEFAULT_MODEL, '', '#000');

    // Round 206 added `ORDER BY e.created_at ASC, e.id ASC` to getAllEntities and
    // labelled it "deterministic, not correct." This test found the label is if
    // anything too kind. These two are created in the same millisecond, so
    // created_at ties and the whole decision falls to `id ASC` — on a **random
    // UUID**. The winner is therefore the lower UUID, which is the first-created
    // entity only by coin flip. Written as a sort rather than as `a` so it pins
    // the rule instead of one run's dice.
    const expected = [a.id, b.id].sort()[0];

    const ordered = getAllEntities().filter((e) => e.name.toLowerCase() === 'janus');
    expect(ordered[0].id).toBe(expected);

    // Stable across repeated resolutions — Theseus's arm E, from this side. That
    // stability is the only property on offer here; it is not oldest-wins, and no
    // refusal stands behind it the way one does in the backfill. Which is the
    // argument for `sameNameEntityIds` above: the pick cannot be justified, so it
    // has to be disclosed.
    for (let i = 0; i < 5; i++) {
      expect(resolveImportEntity({ entityName: 'Janus' }).entityId).toBe(expected);
    }
  });

  it('does not report candidates when reuse-by-name is off — it minted, it did not pick', () => {
    createEntity('chief of staff', DEFAULT_MODEL, '', '#fff');
    createEntity('Chief of Staff', DEFAULT_MODEL, '', '#000');

    const resolved = resolveImportEntity({
      entityName: 'chief of staff',
      reuseByName: false,
    });

    expect(resolved.disposition).toBe('minted');
    expect(resolved.sameNameEntityIds).toBeUndefined();
  });
});
