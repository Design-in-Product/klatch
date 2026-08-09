/**
 * Resolving an import to the entity that owns it.
 *
 * This is the "confirm" half of xian's 2026-08-08 identity answer (the guess
 * half is `entity-guess.ts`). The caller passes what the user actually
 * confirmed; this turns that into an entity id for `importSession`.
 *
 * The reuse-by-name rule is what makes the common case work: confirming the
 * name "Daedalus" on five separate imported sessions produces **one** Daedalus
 * whose transcript spans all five, rather than five look-alike entities. That
 * is the behavior xian assumed by default ("I am assuming it is one entity"),
 * and it falls out of matching on the confirmed name instead of minting
 * unconditionally.
 */

import { getAllEntities, createEntity, getEntity } from '../db/queries.js';
import { ENTITY_COLORS, DEFAULT_MODEL } from '@klatch/shared';
import type { Entity } from '@klatch/shared';

export interface ResolveEntityParams {
  /** An existing entity chosen explicitly by the user. Wins over `entityName`. */
  entityId?: string;
  /** The confirmed name. Reused if an entity already has it; minted otherwise. */
  entityName?: string;
  /** Model for a newly minted entity. Defaults to the app default. */
  model?: string;
}

export type ResolveDisposition =
  /** Bound to an existing entity the user picked by id. */
  | 'bound-existing'
  /** Matched an existing entity by confirmed name — the five-sessions-one-agent case. */
  | 'matched-by-name'
  /** No entity of that name existed; minted a new one. */
  | 'minted'
  /** Nothing confirmed; caller should fall back to the default entity. */
  | 'default';

export interface ResolvedEntity {
  /** Undefined only when disposition is 'default'. */
  entityId?: string;
  disposition: ResolveDisposition;
}

/** Case- and whitespace-insensitive, so "daedalus" and "Daedalus " are one agent. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Pick a color for a newly minted entity by round-robin over the existing
 * count, so a batch of imports doesn't produce five identically-colored agents.
 */
function nextColor(existingCount: number): string {
  return ENTITY_COLORS[existingCount % ENTITY_COLORS.length];
}

/**
 * Resolve the entity an import should bind to.
 *
 * @throws Error when `entityId` names an entity that doesn't exist — a bad
 *   explicit id is a caller bug, and binding a transcript to the wrong agent
 *   is the expensive-to-undo direction (splitting an interleaved transcript is
 *   a per-message judgment call), so this fails loudly rather than falling back.
 */
export function resolveImportEntity(params: ResolveEntityParams): ResolvedEntity {
  const { entityId, entityName, model } = params;

  if (entityId) {
    const existing = getEntity(entityId);
    if (!existing) {
      throw new Error(`Entity not found: ${entityId}`);
    }
    return { entityId: existing.id, disposition: 'bound-existing' };
  }

  const confirmed = (entityName || '').trim();
  if (!confirmed) {
    return { disposition: 'default' };
  }

  const entities: Entity[] = getAllEntities();
  const match = entities.find((e) => normalizeName(e.name) === normalizeName(confirmed));
  if (match) {
    return { entityId: match.id, disposition: 'matched-by-name' };
  }

  // System prompt is deliberately empty. An imported agent's identity is its
  // transcript, not a role prompt written at import time — inventing one here
  // would be the drift PREMISE.md warns about (entities as prompt-defined
  // personas). The transcript arrives with the channel; the prompt stays blank
  // until a human chooses to add one.
  const minted = createEntity(
    confirmed,
    model || DEFAULT_MODEL,
    '',
    nextColor(entities.length)
  );
  return { entityId: minted.id, disposition: 'minted' };
}
