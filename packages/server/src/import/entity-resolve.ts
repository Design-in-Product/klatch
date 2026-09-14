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
  /**
   * Whether `entityName` may bind to an entity that already has that name.
   * Defaults to **true** — the five-sessions-one-Daedalus rule this module opens
   * by arguing for, and every existing caller's behavior.
   *
   * `false` when the name is not a claim about *who*. A `role-title` guess
   * (`entity-guess.ts`) proposes a job — "Chief of Staff" — and two sessions
   * holding one job are two agents, so reusing on that name merges strangers.
   * Round 202: the backfill plan had already decided this per basis and the apply
   * pass then called this function, which re-derived the binding from the name
   * alone. The plan said `minted` and the apply bound by name anyway — the sheet
   * and the write disagreed, which is worse than either rule.
   */
  reuseByName?: boolean;
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
  /**
   * The **stored** name of the entity actually bound — not the string the caller
   * passed. These differ whenever the match was case-insensitive: confirming
   * `DAEDALUS` binds an entity stored as `Daedalus`. Undefined only for 'default'.
   *
   * Round 207 (Theseus, arm D) drove the consequence: the import dialog echoed
   * `confirmedName` back on its result line, so the confirmation read back the
   * user's own input rather than the record it had just written to. A caller
   * that prints this field instead is telling the truth about where the
   * transcript went, and it is the true thing to print even when no name in the
   * database is duplicated.
   */
  entityName?: string;
  /**
   * Every entity carrying the confirmed name, when **more than one** does.
   * Undefined when the name identifies exactly one entity (537 of 548 sessions
   * on the live corpus Theseus measured) — so its presence is exactly the
   * condition "this binding was an arbitrary pick."
   *
   * Set only for 'matched-by-name'. On 'bound-existing' the caller already
   * chose by id, so there is nothing arbitrary left to report; on 'minted'
   * nothing carried the name at all.
   *
   * **Why report rather than refuse.** The backfill plan (Round 206) refuses an
   * ambiguous name, and that is right there: a refused backfill row costs
   * nothing, it simply doesn't move. An import is the other way round — a
   * refusal costs the operator the import, and reuse-by-name is the *feature*
   * on this path (121 Calliope sessions should land on one Calliope). One stray
   * duplicate would turn 121 imports into 121 refusals. So the import binds and
   * says what it did; the confirm step is where a human picks.
   */
  sameNameEntityIds?: string[];
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
    return { entityId: existing.id, entityName: existing.name, disposition: 'bound-existing' };
  }

  const confirmed = (entityName || '').trim();
  if (!confirmed) {
    return { disposition: 'default' };
  }

  const entities: Entity[] = getAllEntities();
  // Keep every entity of that name, not just the first. The binding still takes
  // the first (see `sameNameEntityIds` for why this path reports rather than
  // refuses), but a caller cannot offer a picker for a collision it was never
  // told about, and the old `.find` discarded that fact before anyone could see it.
  const matches =
    params.reuseByName === false
      ? []
      : entities.filter((e) => normalizeName(e.name) === normalizeName(confirmed));
  if (matches.length > 0) {
    // `getAllEntities` orders by (created_at ASC, id ASC) — deterministic under
    // ties, and still arbitrary. Round 206 labelled it exactly that way and the
    // label holds here: on this path the tiebreak is the whole answer, because
    // no refusal stands behind it the way one does in the backfill.
    const match = matches[0];
    return {
      entityId: match.id,
      entityName: match.name,
      disposition: 'matched-by-name',
      ...(matches.length > 1 ? { sameNameEntityIds: matches.map((e) => e.id) } : {}),
    };
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
  return { entityId: minted.id, entityName: minted.name, disposition: 'minted' };
}
