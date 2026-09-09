/**
 * Entity backfill — re-point already-imported channels off the shared default
 * entity and onto the agent each one actually is.
 *
 * **Why this exists.** xian ruled "backfill, not forward-only" on 2026-09-02
 * (`docs/mail/calliope-to-daedalus-cc-team-xian-decided-backfill-2026-09-02.md`).
 * Every session imported before the confirm step shipped bound to
 * `DEFAULT_ENTITY_ID`, so continuity #3's carried context is wiring-correct and
 * content-wrong: "this agent's recent activity elsewhere" pools every imported
 * conversation onto one placeholder. The scoping pass is
 * `docs/plans/entity-backfill-scoping-2026-09-02.md`; this module is its
 * §4(b) "apply pass", which that document recorded as **not built**.
 *
 * **The binding lives in two places.** Scoping §2, verified again here against
 * `importSession` (`queries.ts`) and `entityTranscriptWhere` (`queries.ts`):
 *
 *   P1  `channel_entities` rows pointing at the default. What the UI shows, and
 *       what the *user* half of the entity transcript keys off (the EXISTS).
 *   P2  assistant `messages` rows stamped `entity_id = 'default-entity'`, which
 *       `importSession` writes for every assistant turn it imports.
 *   P3  assistant `messages` rows with `entity_id IS NULL` — imported before
 *       `ALTER TABLE messages ADD COLUMN entity_id` (`db/index.ts:103`). These
 *       satisfy *neither* disjunct of `entityTranscriptWhere` and are invisible
 *       to every entity, the default included.
 *
 * **A backfill that re-points P1 and stops looks repaired in the UI and leaves
 * the agent's own answers pooled on the placeholder.** That is the trap the
 * scoping doc named, so both writes happen in the same per-channel transaction
 * or neither does.
 *
 * **Nothing here decides anything.** `planEntityBackfill` is read-only and
 * mints nothing; `applyEntityBackfill` writes only what a plan already
 * enumerated. The default basis filter is `identity-claim` only — the strong
 * signal `entity-guess.ts` was built to trust — because 72 guesses is too many
 * to confirm one at a time and too many to wave through in one click
 * (scoping §4(c)). Widening it is the operator's explicit choice.
 */

import { getDb } from './index.js';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';
import { guessEntityName, type GuessBasis } from '../import/entity-guess.js';
import { resolveImportEntity } from '../import/entity-resolve.js';

/**
 * The channel sources a backfill touches.
 *
 * This is the predicate the "72" was measured with — see
 * `docs/plans/composition-continuity-gap-2026-07-19.md:140`, which records the
 * count as `source IN ('claude-code','claude-ai')` joined to `channel_entities`,
 * after two earlier figures ("~49", "65") turned out to be untraceable. Cite the
 * predicate with the number.
 *
 * Deliberately excludes `native` (a real 1-1 the user started, where the default
 * entity is the correct binding and #general lives) and `klatch` (channels
 * imported from a Klatch package, which carry their own entity list and were not
 * part of the population xian ruled on). Both are counted and reported by
 * `planEntityBackfill` rather than silently dropped.
 */
export const BACKFILL_SOURCES = ['claude-code', 'claude-ai'] as const;

/** Bases strong enough to apply without a human looking at each one. */
export const DEFAULT_APPLY_BASES: GuessBasis[] = ['identity-claim'];

export type BackfillAction =
  /** An entity with this name already exists; the channel re-points to it. */
  | 'matched-by-name'
  /** No entity of this name exists; applying mints one. */
  | 'minted'
  /** Left alone. See `skipReason`. */
  | 'skipped';

export type BackfillSkipReason =
  /** `guessEntityName` found nothing to propose. A human has to name it. */
  | 'no-guess'
  /** The guess's basis is outside the run's basis filter (default: identity-claim only). */
  | 'basis-excluded'
  /**
   * The channel carries a second, non-default entity. Which agent the assistant
   * rows belong to is then a per-message judgement, not a re-point.
   */
  | 'multi-bound'
  /**
   * The guess resolves to the default entity itself — the seeded agent is named
   * "Claude" (`db/index.ts:351`), so a session that opens "You are Claude"
   * matches it by name. Applying would be a no-op reported as a success, which
   * is the Round 171/173 failure shape one layer over: a placeholder that cannot
   * be told from an answer.
   */
  | 'resolves-to-default';

export interface BackfillPlanRow {
  channelId: string;
  channelName: string;
  source: string | null;
  projectName: string | null;
  /** Proposed name. Empty when basis is 'none'. */
  guessName: string;
  guessBasis: GuessBasis;
  /** `entity-guess.ts`'s own one-liner, so the operator can judge the guess. */
  rationale: string;
  action: BackfillAction;
  skipReason?: BackfillSkipReason;
  /** Set only when the plan would reuse an entity that already exists. */
  targetEntityId?: string;
  /** `channel_entities` rows to re-point (1 for every candidate). */
  p1: number;
  /** Assistant rows stamped `default-entity` in this channel. */
  p2: number;
  /** Assistant rows with NULL `entity_id` in this channel — invisible today. */
  p3: number;
}

export interface BackfillPlan {
  rows: BackfillPlanRow[];
  /** Bases this plan would apply. Echoed so a stored plan explains itself. */
  bases: GuessBasis[];
  summary: {
    /** Channels in scope (source filter + bound to the default). */
    candidates: number;
    apply: number;
    skipped: number;
    /** Distinct names that would mint a new agent. */
    newAgents: string[];
    /** Distinct names that would reuse an existing agent. */
    reusedAgents: string[];
    p2: number;
    p3: number;
    skipReasons: Record<string, number>;
  };
  /** Bound to the default but outside `BACKFILL_SOURCES`. Reported, not touched. */
  excluded: Record<string, number>;
}

export interface PlanOptions {
  /** Guess bases to apply. Defaults to `DEFAULT_APPLY_BASES`. */
  bases?: GuessBasis[];
  /**
   * Restrict to these channel ids. This is how a human confirm round trips:
   * review the full plan, hand back the ids you approve, apply only those.
   */
  channelIds?: string[];
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Build the plan. Reads only — no entity is minted, no row is written.
 *
 * A row's `action` is decided against the entities that exist *now*, so two
 * channels guessing the same new name both read 'minted' while
 * `summary.newAgents` counts the name once. That is the reuse-by-name rule from
 * `entity-resolve.ts` reported at plan time: five sessions saying "Daedalus"
 * make one Daedalus, not five.
 */
export function planEntityBackfill(options: PlanOptions = {}): BackfillPlan {
  const db = getDb();
  const bases = options.bases ?? DEFAULT_APPLY_BASES;
  const sourceHoles = BACKFILL_SOURCES.map(() => '?').join(',');

  const candidates = db
    .prepare(
      `SELECT c.id AS id, c.name AS name, c.source AS source,
              (SELECT p.name FROM projects p WHERE p.id = c.project_id) AS project_name
         FROM channels c
         JOIN channel_entities ce ON ce.channel_id = c.id
        WHERE ce.entity_id = ? AND c.source IN (${sourceHoles})
        ORDER BY c.id`
    )
    .all(DEFAULT_ENTITY_ID, ...BACKFILL_SOURCES) as {
    id: string;
    name: string;
    source: string | null;
    project_name: string | null;
  }[];

  // Channels bound to the default that this run will not touch, by source. Named
  // so "we left 31 channels alone" is a stated scope rather than a silent one.
  const excluded: Record<string, number> = {};
  for (const row of db
    .prepare(
      `SELECT COALESCE(c.source, 'native') AS source, COUNT(*) AS n
         FROM channels c
         JOIN channel_entities ce ON ce.channel_id = c.id
        WHERE ce.entity_id = ? AND (c.source IS NULL OR c.source NOT IN (${sourceHoles}))
        GROUP BY COALESCE(c.source, 'native')`
    )
    .all(DEFAULT_ENTITY_ID, ...BACKFILL_SOURCES) as { source: string; n: number }[]) {
    excluded[row.source] = row.n;
  }

  const openerStmt = db.prepare(
    `SELECT content FROM messages
      WHERE channel_id = ? AND role = 'user'
      ORDER BY rowid ASC LIMIT 1`
  );
  const countStmt = db.prepare(
    `SELECT COUNT(*) AS n FROM messages
      WHERE channel_id = ? AND role = 'assistant' AND entity_id = ?`
  );
  const nullCountStmt = db.prepare(
    `SELECT COUNT(*) AS n FROM messages
      WHERE channel_id = ? AND role = 'assistant' AND entity_id IS NULL`
  );
  const otherBindingStmt = db.prepare(
    `SELECT COUNT(*) AS n FROM channel_entities
      WHERE channel_id = ? AND entity_id != ?`
  );

  const existing = db.prepare('SELECT id, name FROM entities').all() as {
    id: string;
    name: string;
  }[];
  const byName = new Map(existing.map((e) => [normalizeName(e.name), e.id]));

  const rows: BackfillPlanRow[] = [];
  for (const ch of candidates) {
    if (options.channelIds && !options.channelIds.includes(ch.id)) continue;

    const opener = (openerStmt.get(ch.id) as { content: string } | undefined)?.content ?? '';
    const guess = guessEntityName(opener, ch.project_name ?? undefined);
    const p2 = (countStmt.get(ch.id, DEFAULT_ENTITY_ID) as { n: number }).n;
    const p3 = (nullCountStmt.get(ch.id) as { n: number }).n;
    const otherBindings = (otherBindingStmt.get(ch.id, DEFAULT_ENTITY_ID) as { n: number }).n;

    const base: BackfillPlanRow = {
      channelId: ch.id,
      channelName: ch.name,
      source: ch.source,
      projectName: ch.project_name,
      guessName: guess.name,
      guessBasis: guess.basis,
      rationale: guess.rationale,
      action: 'skipped',
      p1: 1,
      p2,
      p3,
    };

    const targetId = guess.name ? byName.get(normalizeName(guess.name)) : undefined;

    let skipReason: BackfillSkipReason | undefined;
    if (otherBindings > 0) skipReason = 'multi-bound';
    else if (!guess.name) skipReason = 'no-guess';
    else if (!bases.includes(guess.basis)) skipReason = 'basis-excluded';
    else if (targetId === DEFAULT_ENTITY_ID) skipReason = 'resolves-to-default';

    if (skipReason) {
      rows.push({ ...base, skipReason, targetEntityId: targetId });
    } else {
      rows.push({
        ...base,
        action: targetId ? 'matched-by-name' : 'minted',
        targetEntityId: targetId,
      });
    }
  }

  const apply = rows.filter((r) => r.action !== 'skipped');
  const skipReasons: Record<string, number> = {};
  for (const r of rows) {
    if (r.skipReason) skipReasons[r.skipReason] = (skipReasons[r.skipReason] ?? 0) + 1;
  }

  return {
    rows,
    bases,
    summary: {
      candidates: rows.length,
      apply: apply.length,
      skipped: rows.length - apply.length,
      newAgents: [...new Set(apply.filter((r) => r.action === 'minted').map((r) => r.guessName))],
      reusedAgents: [
        ...new Set(apply.filter((r) => r.action === 'matched-by-name').map((r) => r.guessName)),
      ],
      p2: apply.reduce((n, r) => n + r.p2, 0),
      p3: apply.reduce((n, r) => n + r.p3, 0),
      skipReasons,
    },
    excluded,
  };
}

export interface BackfillUndoChannel {
  channelId: string;
  fromEntityId: string;
  toEntityId: string;
  /**
   * True when this run created `toEntityId`. Undo may remove it, but only after
   * checking it is orphaned — a later import could have bound to it in between.
   */
  mintedHere: boolean;
  /** Assistant rows that were stamped `fromEntityId` before the run (P2). */
  p2MessageIds: string[];
  /** Assistant rows that were NULL before the run (P3). Restored to NULL. */
  p3MessageIds: string[];
}

export interface BackfillUndoRecord {
  version: 1;
  createdAt: string;
  bases: GuessBasis[];
  channels: BackfillUndoChannel[];
}

export interface ApplyResult {
  record: BackfillUndoRecord;
  /** Channels re-pointed. */
  applied: number;
  /** Entities created by this run. */
  minted: string[];
}

/**
 * Apply a plan. One transaction per channel, so a failure part-way through
 * leaves earlier channels correctly moved and later ones untouched, and the
 * returned record describes exactly what moved.
 *
 * The record is the reversal artifact the scoping doc asked for: it stores the
 * message ids, not a predicate, because after the run P2 and P3 rows are
 * indistinguishable — both carry the new entity id, and only the record
 * remembers which ones were NULL.
 */
export function applyEntityBackfill(plan: BackfillPlan): ApplyResult {
  const db = getDb();
  const record: BackfillUndoRecord = {
    version: 1,
    createdAt: new Date().toISOString(),
    bases: plan.bases,
    channels: [],
  };
  const minted: string[] = [];

  const selectAssistant = db.prepare(
    `SELECT id, entity_id FROM messages
      WHERE channel_id = ? AND role = 'assistant'
        AND (entity_id = ? OR entity_id IS NULL)`
  );
  const bind = db.prepare(
    'INSERT OR IGNORE INTO channel_entities (channel_id, entity_id) VALUES (?, ?)'
  );
  const unbind = db.prepare(
    'DELETE FROM channel_entities WHERE channel_id = ? AND entity_id = ?'
  );
  const stamp = db.prepare('UPDATE messages SET entity_id = ? WHERE id = ?');

  for (const row of plan.rows) {
    if (row.action === 'skipped') continue;

    const move = db.transaction(() => {
      // Resolve inside the transaction so a mint cannot survive a failed move.
      const resolved = resolveImportEntity({ entityName: row.guessName });
      const toEntityId = resolved.entityId;
      if (!toEntityId) {
        // resolveImportEntity only returns 'default' for a blank name, which the
        // plan already excluded. Refuse rather than write the placeholder back.
        throw new Error(`backfill: no entity resolved for channel ${row.channelId}`);
      }

      const assistant = selectAssistant.all(row.channelId, DEFAULT_ENTITY_ID) as {
        id: string;
        entity_id: string | null;
      }[];
      const p2MessageIds = assistant.filter((m) => m.entity_id !== null).map((m) => m.id);
      const p3MessageIds = assistant.filter((m) => m.entity_id === null).map((m) => m.id);

      bind.run(row.channelId, toEntityId);
      unbind.run(row.channelId, DEFAULT_ENTITY_ID);
      for (const m of assistant) stamp.run(toEntityId, m.id);

      return {
        channelId: row.channelId,
        fromEntityId: DEFAULT_ENTITY_ID,
        toEntityId,
        mintedHere: resolved.disposition === 'minted',
        p2MessageIds,
        p3MessageIds,
      } satisfies BackfillUndoChannel;
    });

    const entry = move();
    record.channels.push(entry);
    if (entry.mintedHere && !minted.includes(entry.toEntityId)) minted.push(entry.toEntityId);
  }

  return { record, applied: record.channels.length, minted };
}

export interface UndoResult {
  reverted: number;
  /** Minted entities removed because nothing else referenced them. */
  entitiesRemoved: string[];
  /** Minted entities kept because something bound to them after the run. */
  entitiesKept: string[];
}

/**
 * Reverse a run from its record.
 *
 * Entity removal is conditional on purpose: an entity minted by the backfill and
 * then used by a later import is not this run's to delete. The check is against
 * present state (`channel_entities` and stamped `messages`), not against the
 * record, because the record cannot know what happened afterwards.
 */
export function undoEntityBackfill(record: BackfillUndoRecord): UndoResult {
  const db = getDb();
  const bind = db.prepare(
    'INSERT OR IGNORE INTO channel_entities (channel_id, entity_id) VALUES (?, ?)'
  );
  const unbind = db.prepare(
    'DELETE FROM channel_entities WHERE channel_id = ? AND entity_id = ?'
  );
  const stamp = db.prepare('UPDATE messages SET entity_id = ? WHERE id = ?');

  let reverted = 0;
  for (const ch of record.channels) {
    const back = db.transaction(() => {
      bind.run(ch.channelId, ch.fromEntityId);
      unbind.run(ch.channelId, ch.toEntityId);
      for (const id of ch.p2MessageIds) stamp.run(ch.fromEntityId, id);
      for (const id of ch.p3MessageIds) stamp.run(null, id);
    });
    back();
    reverted++;
  }

  const entitiesRemoved: string[] = [];
  const entitiesKept: string[] = [];
  const mintedIds = [...new Set(record.channels.filter((c) => c.mintedHere).map((c) => c.toEntityId))];
  const bindingCount = db.prepare(
    'SELECT COUNT(*) AS n FROM channel_entities WHERE entity_id = ?'
  );
  const stampCount = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE entity_id = ?');
  for (const id of mintedIds) {
    const bound = (bindingCount.get(id) as { n: number }).n;
    const stamped = (stampCount.get(id) as { n: number }).n;
    if (bound === 0 && stamped === 0) {
      db.prepare('DELETE FROM entities WHERE id = ?').run(id);
      entitiesRemoved.push(id);
    } else {
      entitiesKept.push(id);
    }
  }

  return { reverted, entitiesRemoved, entitiesKept };
}
