import { DEFAULT_ENTITY_ID } from '@klatch/shared';
import type { Entity } from '@klatch/shared';

/**
 * What a completed Path B import should seat in the composition form.
 *
 * `entityId` present → seat it. Neither field → the import came back with nothing at all
 * (a claude.ai bulk import, a channel with no entity). `unidentified` → the import bound
 * the *placeholder* entity because nothing identified the session; that is not an agent
 * to seat, and the form says so instead.
 */
export interface JitSeat {
  entityId?: string;
  unidentified?: boolean;
}

/**
 * Decide what a Path B import seats, given what the import returned and — when it
 * returned no entity — what the channel it created is bound to.
 *
 * This exists as a function rather than inline in `App.tsx` because Round 171 (Theseus,
 * 2026-09-08) drove the composition form in a browser and found the inline version
 * getting it wrong on the route a user reaches first, with no test in the repo able to
 * catch it. The decision is small and it is load-bearing; it belongs somewhere it can be
 * pinned.
 *
 * @param importedEntityId The `entityId` on the `ImportResponse`, if the import resolved one.
 * @param channelEntities  Entities bound to the imported channel. Consulted only as a
 *   fallback; `null`/`undefined` means the lookup was not made or did not answer.
 */
export function resolveJitSeat(
  importedEntityId: string | undefined,
  channelEntities?: Entity[] | null,
): JitSeat {
  // An entity that arrives *with* the import is an answer — the confirm step resolved it,
  // by minting, by matching a name, or by an explicit choice. That holds even when the
  // answer is the default entity: a user who confirms "Claude" means Claude.
  if (importedEntityId) return { entityId: importedEntityId };

  const bound = channelEntities?.[0]?.id;
  if (!bound) return {};

  // The channel always answers — `createChannel` binds DEFAULT_ENTITY_ID whenever an
  // import resolved no identity (`queries.ts:1280`) — so the channel cannot distinguish
  // an answer from a placeholder and this must. Round 171: the manual import path seated
  // a chip reading "Claude" for a session whose own identity never reached the assembled
  // prompt. A wrong agent asserted confidently is worse than no agent reported honestly.
  if (bound === DEFAULT_ENTITY_ID) return { unidentified: true };

  return { entityId: bound };
}
