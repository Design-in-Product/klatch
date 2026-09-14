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
import { getDb } from '../db/index.js';
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

  it('breaks a created_at tie on the RANDOM UUID — not on which was created first', () => {
    const a = createEntity('Janus', DEFAULT_MODEL, '', '#fff');
    const b = createEntity('Janus', DEFAULT_MODEL, '', '#000');

    // Force the tie rather than racing for it. `createEntity` stamps
    // `new Date().toISOString()` — millisecond granularity — so two back-to-back
    // creates usually land in the same millisecond but not always. The first
    // version of this test just created two and assumed the tie; it passed twice
    // and then failed, because that assumption is a coin flip. Pinning the
    // condition explicitly is the only way to test the tie-break at all.
    getDb()
      .prepare('UPDATE entities SET created_at = ? WHERE id IN (?, ?)')
      .run('2026-09-14T00:00:00.000Z', a.id, b.id);

    // With created_at equal, `ORDER BY e.created_at ASC, e.id ASC` has nothing
    // left but the id — and entity ids are uuidv4. So the winner is the lower
    // random UUID, which is the first-created entity ONLY by chance.
    //
    // Round 206 labelled this tiebreak "deterministic, not correct." That label
    // reads as "oldest-wins, which is at least a rule"; what is actually here is
    // "lowest random UUID wins," which is a rule about nothing. It is the
    // sharpest argument for `sameNameEntityIds` above: the pick cannot be
    // justified, so it has to be disclosed rather than made smarter.
    const lowerUuid = [a.id, b.id].sort()[0];

    const ordered = getAllEntities().filter((e) => e.name.toLowerCase() === 'janus');
    expect(ordered[0].id).toBe(lowerUuid);

    // Stable across repeated resolutions — Theseus's arm E, from this side.
    // Stability is the only property on offer, and it was never the one in doubt.
    for (let i = 0; i < 5; i++) {
      expect(resolveImportEntity({ entityName: 'Janus' }).entityId).toBe(lowerUuid);
    }
  });

  it('prefers the older entity when created_at actually differs', () => {
    const older = createEntity('Terminus', DEFAULT_MODEL, '', '#fff');
    const newer = createEntity('Terminus', DEFAULT_MODEL, '', '#000');

    // The other half of the rule, pinned with the timestamps forced apart so it
    // does not depend on how fast the two creates ran. Deliberately arranged so
    // the OLDER row has the HIGHER uuid — otherwise the assertion passes whether
    // created_at is consulted or not, which is the bug the first draft had.
    const [lo, hi] = [older.id, newer.id].sort();
    getDb()
      .prepare('UPDATE entities SET created_at = ? WHERE id = ?')
      .run('2026-09-14T00:00:00.000Z', hi);
    getDb()
      .prepare('UPDATE entities SET created_at = ? WHERE id = ?')
      .run('2026-09-14T00:00:01.000Z', lo);

    expect(resolveImportEntity({ entityName: 'Terminus' }).entityId).toBe(hi);
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
