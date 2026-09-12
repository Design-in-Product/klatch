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

/** Single-quote a path for a shell line the operator is meant to paste. */
function shellQuote(p: string): string {
  return `'${p.replace(/'/g, `'\\''`)}'`;
}

/**
 * How to put a backup back by hand — printed wherever this tool names a backup
 * as a way back.
 *
 * Three places offered "restore the snapshot" and **none of them said how**
 * (the CLI header, the scoping doc, the 9/9 dry-run memo). Theseus's Round 191
 * did it the way a person does — `cp` — and measured what the omission costs:
 *
 * - with another connection open through the apply, `cp` of the backup over
 *   `klatch.db` **restores nothing**. The app goes on reading the post-run
 *   state, row for row, with no error from any command;
 * - if the app was also used between the apply and the copy, the copy left a
 *   **corrupt** database in both runs (`database disk image is malformed`):
 *   the app would not open it and `--undo` failed on it.
 *
 * The mechanism is the WAL. `cp` replaces the database file and leaves
 * `klatch.db-wal` beside it, and SQLite pairs a database with the `-wal` of the
 * same name. Nobody hit it before because with no other connection the apply's
 * exit leaves no WAL, which is the condition every earlier probe ran under.
 *
 * So the steps are the fix's whole content, and they live here — next to the
 * undo logic and reachable by the unit tests — rather than in three copies in
 * the CLI, which is the drift Round 169 ruled on one level up. The prefix of
 * each numbered line is what a caller may rely on; the prose is not.
 */
export function restoreInstructions(dbPath: string, backupPath: string): string {
  return (
    'To put that file back by hand, stop the app and delete the sidecars first. A plain copy while\n' +
    'something still holds the database open restores nothing — the app goes on reading the run — and\n' +
    'after further use it can leave a database SQLite calls malformed (Theseus\'s Round 191):\n' +
    '  1. stop `npm run dev`, and anything else holding this database open\n' +
    `  2. rm -f ${shellQuote(dbPath + '-wal')} ${shellQuote(dbPath + '-shm')}\n` +
    `  3. cp ${shellQuote(backupPath)} ${shellQuote(dbPath)}\n` +
    '  4. re-run this script with no flags: the `Candidates:` line should read as it did before the run'
  );
}

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

/**
 * What a `channelIds` filter actually resolved to.
 *
 * Present only when a filter was supplied. Exists because `Candidates: 0` and
 * `Candidates: 0 of 72` are different facts and the first one reads like the
 * second's opposite: a filter that matched nothing looks exactly like a corpus
 * with nothing to fix. Theseus's Round 176 G2/G5 — the same "a placeholder the
 * caller cannot tell from an answer" shape that `resolves-to-default` guards,
 * mirrored.
 */
export interface BackfillFilterReport {
  /** Ids as the operator typed them. */
  requested: string[];
  /** Requested ids that matched no in-scope candidate. */
  unmatched: string[];
  /**
   * Requested prefixes that matched more than one in-scope candidate.
   *
   * Matches carry their channel name, and their full id, because the refusal has
   * to be actionable: Theseus's Round 179 found the CLI truncating matches to 12
   * characters, and two ids ambiguous on 8 characters usually agree on 12 — the
   * message told the operator to choose and printed the same string twice. What
   * distinguishes two candidates is the rest of the id, or their names.
   */
  ambiguous: { requested: string; matches: { id: string; name: string | null }[] }[];
  /** Full channel ids the filter resolved to. */
  resolved: string[];
}

export interface BackfillPlan {
  rows: BackfillPlanRow[];
  /** Bases this plan would apply. Echoed so a stored plan explains itself. */
  bases: GuessBasis[];
  /** Set when `channelIds` was supplied. See `BackfillFilterReport`. */
  filter?: BackfillFilterReport;
  summary: {
    /** Channels in scope (source filter + bound to the default). */
    candidates: number;
    /**
     * Channels in scope *before* any `channelIds` filter. Equal to `candidates`
     * when no filter was supplied; the denominator in "3 of 72" when one was.
     */
    inScope: number;
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
   *
   * **Matched as prefixes**, because the review sheet prints 8 characters and
   * the round trip is "copy what you see, hand it back". An entry that matches
   * more than one candidate is ambiguous and matches *none* of them — see
   * `BackfillFilterReport`. Full ids work unchanged (an exact match always wins,
   * even if it is also a prefix of some other id).
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

  // Resolve the operator's ids against the in-scope candidates before planning,
  // so what a filter did and did not find is reportable rather than inferable
  // from a row count.
  let filter: BackfillFilterReport | undefined;
  let selected: Set<string> | undefined;
  if (options.channelIds) {
    const requested = options.channelIds;
    const unmatched: string[] = [];
    const ambiguous: BackfillFilterReport['ambiguous'] = [];
    const resolved = new Set<string>();
    for (const want of requested) {
      const exact = candidates.find((c) => c.id === want);
      if (exact) {
        resolved.add(exact.id);
        continue;
      }
      const hits = candidates.filter((c) => c.id.startsWith(want));
      if (hits.length === 0) unmatched.push(want);
      else if (hits.length > 1)
        ambiguous.push({
          requested: want,
          matches: hits.map((c) => ({ id: c.id, name: c.name ?? null })),
        });
      else resolved.add(hits[0].id);
    }
    filter = { requested, unmatched, ambiguous, resolved: [...resolved] };
    selected = resolved;
  }

  const rows: BackfillPlanRow[] = [];
  for (const ch of candidates) {
    if (selected && !selected.has(ch.id)) continue;

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
    filter,
    summary: {
      candidates: rows.length,
      inScope: candidates.length,
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
  /**
   * `channel_entities.added_at` on the default binding this run deleted.
   *
   * Undo re-INSERTs that row, and without this it would carry the undo's clock
   * instead of the original's. That column is the roster ordering key
   * (`queries.ts:485`, `ORDER BY ce.added_at ASC`), so on a channel that gained
   * a second entity between apply and undo the restored default would sort last
   * rather than back where it was. Theseus's Round 176.
   *
   * Optional: records written before this field existed replay with the undo's
   * clock, which is the old behaviour, not a new failure.
   */
  fromAddedAt?: string | null;
  /**
   * `channel_entities.added_at` on the binding this run made to `toEntityId`.
   *
   * What tells this run's binding from a later one to the same agent. An agent
   * matched by name has one id for every run, so "still bound to `toEntityId`"
   * cannot tell an older record from a newer one (Theseus's Round 185, N4).
   * Undo reverts only a binding whose `added_at` still matches.
   *
   * Optional: records written before this field existed keep the old rule.
   */
  toAddedAt?: string | null;
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
  const addedAtOf = db.prepare(
    'SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?'
  );

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

      // Read before the DELETE below removes the row it lives on.
      const fromAddedAt =
        (addedAtOf.get(row.channelId, DEFAULT_ENTITY_ID) as { added_at: string } | undefined)
          ?.added_at ?? null;

      bind.run(row.channelId, toEntityId);
      // The bind always inserts here: a channel carrying any other binding is
      // skipped as `multi-bound` by the plan, so this row is this run's own.
      const toAddedAt =
        (addedAtOf.get(row.channelId, toEntityId) as { added_at: string } | undefined)
          ?.added_at ?? null;
      unbind.run(row.channelId, DEFAULT_ENTITY_ID);
      for (const m of assistant) stamp.run(toEntityId, m.id);

      return {
        channelId: row.channelId,
        fromEntityId: DEFAULT_ENTITY_ID,
        toEntityId,
        mintedHere: resolved.disposition === 'minted',
        fromAddedAt,
        toAddedAt,
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

export type UndoRecordCheck =
  | { ok: true; record: BackfillUndoRecord }
  | { ok: false; problem: string };

/**
 * Decide whether parsed JSON is a backfill undo record, before anything is
 * written.
 *
 * `undoEntityBackfill` assumes its argument's shape — it iterates
 * `record.channels` directly — so handing it any other JSON object used to throw
 * `TypeError: record.channels is not iterable` from inside the module, with a
 * stack trace in place of an operator-facing sentence (Theseus's Round 179,
 * finding 5). The check lives here rather than in the CLI so it is unit-tested
 * against real records and so any other caller of `undoEntityBackfill` can reach
 * it.
 *
 * Deliberately shallow on the message-id arrays: it confirms they are arrays,
 * not that every element is a live row. A record naming a since-deleted message
 * is a legitimate record (the UPDATE matches nothing), not a malformed one.
 */
export function checkUndoRecord(value: unknown): UndoRecordCheck {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, problem: 'not a JSON object' };
  }
  const r = value as Record<string, unknown>;
  if (r.version !== 1) {
    return {
      ok: false,
      problem: `version is ${JSON.stringify(r.version)}, expected 1`,
    };
  }
  if (!Array.isArray(r.channels)) {
    return { ok: false, problem: 'no `channels` array' };
  }
  for (const [i, raw] of (r.channels as unknown[]).entries()) {
    if (typeof raw !== 'object' || raw === null) {
      return { ok: false, problem: `channels[${i}] is not an object` };
    }
    const ch = raw as Record<string, unknown>;
    for (const key of ['channelId', 'fromEntityId', 'toEntityId']) {
      if (typeof ch[key] !== 'string') {
        return { ok: false, problem: `channels[${i}].${key} is not a string` };
      }
    }
    for (const key of ['p2MessageIds', 'p3MessageIds']) {
      if (!Array.isArray(ch[key])) {
        return { ok: false, problem: `channels[${i}].${key} is not an array` };
      }
    }
    // Not shallow here, unlike the id arrays: these two decide a refusal and a
    // write. `toAddedAt` is what `revert` compares, and `fromAddedAt` is written
    // into the roster ordering column. Apply copies both from `datetime('now')`,
    // so any other value was not written by a run — a number passed through and
    // was refused as re-bound, and "not a date" was written into a default's
    // binding (Theseus's Round 187, G1/G2). Absent and null stay legitimate: they
    // are records from before each field existed.
    for (const key of ['fromAddedAt', 'toAddedAt']) {
      const at = ch[key];
      if (at != null && !(typeof at === 'string' && isSqliteDatetime(at))) {
        return {
          ok: false,
          problem: `channels[${i}].${key} is ${JSON.stringify(at)}, expected null or a YYYY-MM-DD HH:MM:SS timestamp`,
        };
      }
    }
  }
  return { ok: true, record: value as BackfillUndoRecord };
}

/** The fixed-width form `datetime('now')` writes, so string order is time order. */
const SQLITE_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

/**
 * That form, and a real time in it. The shape alone passed `0000-00-00 00:00:00`,
 * which undo then wrote into a default's binding (Theseus's Round 189, V2). A
 * round trip through `Date` refuses anything that normalizes to another string —
 * the same test as SQLite's `datetime(x) IS x`, except that SQLite also passes
 * hour `24`, which `datetime('now')` never writes.
 */
function isSqliteDatetime(at: string): boolean {
  if (!SQLITE_DATETIME.test(at)) return false;
  const t = Date.parse(`${at.replace(' ', 'T')}Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 19).replace('T', ' ') === at;
}

/**
 * Where one record channel stands in the database undo is pointed at, now.
 *
 * - `revert` — still bound to the agent the run moved it to. Undo writes it.
 * - `already-reverted` — back on `fromEntityId`, and every recorded row is in
 *   its pre-run state (P2 on the default, P3 NULL). Writing would change nothing.
 * - `changed-since` — neither: something moved it after the run. A later apply
 *   re-minted its agent or bound the same one again, or the user re-seated it in
 *   the app. Undo leaves it.
 * - `not-in-database` — no such channel. Usually a record from another database.
 */
export type UndoDisposition = 'revert' | 'already-reverted' | 'changed-since' | 'not-in-database';

export interface UndoChannelState {
  channelId: string;
  channelName: string | null;
  disposition: UndoDisposition;
  /** Who is seated on the channel now, in roster order. */
  seatedNow: { id: string; name: string }[];
  /** Whether the agent this record moved the channel to still exists. */
  toEntityExists: boolean;
  /**
   * Seated on the record's agent, but by a later binding than the run's own: a
   * later apply bound the same agent again, or it was taken off and put back in
   * the app. Always false for a record without `toAddedAt`.
   */
  reboundSince: boolean;
  /**
   * The database is from before this run, usually a restored backup, and the
   * record that fits it is an older run's. Either the record's agent is seated by
   * an *earlier* binding than the run's own (Theseus's Round 187, S2), or — for an
   * agent the run minted, which a restore removes — neither the record's agent nor
   * its `fromEntityId` is seated and every seat is older than the run (Round 189,
   * M2/U2). Always false for a record without `toAddedAt`.
   */
  boundBeforeRun: boolean;
}

/**
 * The classifier undo and its preview share. Theseus's Round 183: undo used to
 * write every record channel without reading it first, so a record the database
 * had moved past was applied over whatever was there. An older record undone
 * after a re-apply re-bound the placeholder *beside* the newer run's agent (the
 * unbind targeted an id the first undo had deleted, and the bind is INSERT OR
 * IGNORE) and re-stamped that agent's transcript back to the default; a record
 * from another database threw on the foreign key and was reported as a partial
 * failure. All of it printed the same success line as a correct undo.
 *
 * The rule: a channel is written only if it is still in the state this record's
 * run left it in. Anything else is named and left, not merged — which of the
 * run's writes and the later ones to keep is not something to guess.
 */
function undoClassifier(db: ReturnType<typeof getDb>) {
  const channelRow = db.prepare('SELECT name FROM channels WHERE id = ?');
  const seated = db.prepare(
    `SELECT e.id, e.name FROM channel_entities ce JOIN entities e ON e.id = ce.entity_id
      WHERE ce.channel_id = ? ORDER BY ce.added_at ASC, ce.rowid ASC`
  );
  const bound = db.prepare('SELECT 1 FROM channel_entities WHERE channel_id = ? AND entity_id = ?');
  const bindingAddedAt = db.prepare(
    'SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?'
  );
  const entityExists = db.prepare('SELECT 1 FROM entities WHERE id = ?');
  const stampOf = db.prepare('SELECT entity_id FROM messages WHERE id = ?');
  const seatLatest = db.prepare('SELECT MAX(added_at) AS latest FROM channel_entities WHERE channel_id = ?');

  return (ch: BackfillUndoChannel): UndoChannelState => {
    const channel = channelRow.get(ch.channelId) as { name: string | null } | undefined;
    const toEntityExists = !!entityExists.get(ch.toEntityId);
    if (!channel) {
      return {
        channelId: ch.channelId,
        channelName: null,
        disposition: 'not-in-database',
        seatedNow: [],
        toEntityExists,
        reboundSince: false,
        boundBeforeRun: false,
      };
    }
    const seatedNow = seated.all(ch.channelId) as { id: string; name: string }[];

    let disposition: UndoDisposition;
    let reboundSince = false;
    let boundBeforeRun = false;
    const binding = bindingAddedAt.get(ch.channelId, ch.toEntityId) as { added_at: string } | undefined;
    if (binding) {
      // Bound to the run's agent is not the same as bound by the run. An agent
      // matched by name has one id for every run, so apply → undo → apply binds
      // the same id twice, and the older record used to pass here and write the
      // channel: rows the newer run moved stayed stamped to an agent the undo had
      // just unseated, and the newer record was then refused (Theseus's Round 185,
      // N4/N5). The stamps cannot settle it — a reply the app wrote while the agent
      // sat there carries the same stamp as one a later run moved — so the binding's
      // own `added_at` does. Second resolution: two applies of one channel inside one
      // second still look like one run, which is the rule before this field existed.
      //
      // Which way it moved is the reason, and the reason is the advice. Later is a
      // later apply or the app, and the newer record is the one to use. Earlier is
      // a database from before this run, and the older record is the one to use.
      // `added_at` is fixed-width `datetime('now')` (and `checkUndoRecord` holds
      // the record's side to that form), so string order is time order. It used to
      // test only "different", so after a restore it blamed a later run that never
      // happened (Theseus's Round 187, S2).
      if (ch.toAddedAt != null && binding.added_at !== ch.toAddedAt) {
        if (binding.added_at < ch.toAddedAt) boundBeforeRun = true;
        else reboundSince = true;
      }
      // Reverting re-binds `fromEntityId`; if it is not here, the bind would throw
      // on the foreign key. A record naming an agent this database never had is
      // not this database's record, whatever its channel ids say.
      disposition =
        !reboundSince && !boundBeforeRun && entityExists.get(ch.fromEntityId) ? 'revert' : 'changed-since';
    } else {
      // A recorded row that has since been deleted is not a change: the record
      // legitimately outlives its rows (Round 180), and the UPDATE would match
      // nothing either way.
      const preRun = (ids: string[], expected: string | null) =>
        ids.every((id) => {
          const row = stampOf.get(id) as { entity_id: string | null } | undefined;
          return !row || row.entity_id === expected;
        });
      const fromSeated = !!bound.get(ch.channelId, ch.fromEntityId);
      disposition =
        fromSeated && preRun(ch.p2MessageIds, ch.fromEntityId) && preRun(ch.p3MessageIds, null)
          ? 'already-reverted'
          : 'changed-since';
      // The same direction, for a channel whose run minted its agent. A re-apply
      // mints a new id, so after a restore the record's agent is not here at all and
      // the branch above never runs (Theseus's Round 189, M2/U2). The seats still
      // say which way: every writer but undo stamps `datetime('now')`, so a seat
      // older than the run was there before it. Undo is the exception, and it
      // re-seats only a run's `fromEntityId` — which is why that one being seated
      // decides nothing here (undone, then its rows disturbed, is older too). With
      // neither agent seated and every seat older, the database is from before the
      // run. No seats at all has no direction (MAX is NULL).
      if (disposition === 'changed-since' && !fromSeated && ch.toAddedAt != null) {
        const { latest } = seatLatest.get(ch.channelId) as { latest: string | null };
        boundBeforeRun = latest != null && latest < ch.toAddedAt;
      }
    }
    return {
      channelId: ch.channelId,
      channelName: channel.name,
      disposition,
      seatedNow,
      toEntityExists,
      reboundSince,
      boundBeforeRun,
    };
  };
}

/** Classify every channel in a record against the database, writing nothing. */
export function planEntityUndo(record: BackfillUndoRecord): UndoChannelState[] {
  const classify = undoClassifier(getDb());
  return record.channels.map(classify);
}

export interface UndoResult {
  /** Channels this run actually wrote — not channels the record named. */
  reverted: number;
  /** Every record channel, in record order, as classified at the moment of writing. */
  channels: UndoChannelState[];
  /** Minted entities this run deleted (counted from the DELETE, not from the record). */
  entitiesRemoved: string[];
  /** Minted entities still present and still seated or stamped somewhere. */
  entitiesKept: string[];
}

/**
 * Reverse a run from its record.
 *
 * Each channel is classified (`undoClassifier`) inside the same transaction that
 * writes it, so nothing can move between the look and the write, and only
 * `revert` channels are written. Running it twice, or after the backup has been
 * restored, reverts nothing and says so.
 *
 * Entity removal is conditional on purpose: an entity minted by the backfill and
 * then used by a later import is not this run's to delete. The check is against
 * present state (`channel_entities` and stamped `messages`), not against the
 * record, because the record cannot know what happened afterwards. An entity
 * that no longer exists is neither removed nor kept — it is not reported at all,
 * because this run did nothing to it (Round 183: a second undo used to report
 * the first one's deletions again).
 */
export function undoEntityBackfill(record: BackfillUndoRecord): UndoResult {
  const db = getDb();
  const classify = undoClassifier(db);
  // COALESCE, not a bare `?`: `added_at` is NOT NULL DEFAULT datetime('now'),
  // and binding NULL to the column would violate the constraint rather than
  // fall through to the default. Records without `fromAddedAt` therefore replay
  // with the undo's clock, which is what they did before the field existed.
  const bind = db.prepare(
    `INSERT OR IGNORE INTO channel_entities (channel_id, entity_id, added_at)
     VALUES (?, ?, COALESCE(?, datetime('now')))`
  );
  const unbind = db.prepare(
    'DELETE FROM channel_entities WHERE channel_id = ? AND entity_id = ?'
  );
  const stamp = db.prepare('UPDATE messages SET entity_id = ? WHERE id = ?');

  let reverted = 0;
  const channels: UndoChannelState[] = [];
  for (const ch of record.channels) {
    const back = db.transaction((): UndoChannelState => {
      const state = classify(ch);
      if (state.disposition !== 'revert') return state;
      bind.run(ch.channelId, ch.fromEntityId, ch.fromAddedAt ?? null);
      // `revert` means this binding was read a moment ago in this transaction,
      // so the DELETE finds exactly one row. Counted from `.changes` anyway: the
      // number printed is the number of channels written, by construction.
      if (unbind.run(ch.channelId, ch.toEntityId).changes) reverted++;
      for (const id of ch.p2MessageIds) stamp.run(ch.fromEntityId, id);
      for (const id of ch.p3MessageIds) stamp.run(null, id);
      return state;
    });
    channels.push(back());
  }

  const entitiesRemoved: string[] = [];
  const entitiesKept: string[] = [];
  const mintedIds = [...new Set(record.channels.filter((c) => c.mintedHere).map((c) => c.toEntityId))];
  const entityExists = db.prepare('SELECT 1 FROM entities WHERE id = ?');
  const bindingCount = db.prepare(
    'SELECT COUNT(*) AS n FROM channel_entities WHERE entity_id = ?'
  );
  const stampCount = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE entity_id = ?');
  const deleteEntity = db.prepare('DELETE FROM entities WHERE id = ?');
  for (const id of mintedIds) {
    if (!entityExists.get(id)) continue;
    const bound = (bindingCount.get(id) as { n: number }).n;
    const stamped = (stampCount.get(id) as { n: number }).n;
    if (bound === 0 && stamped === 0) {
      if (deleteEntity.run(id).changes) entitiesRemoved.push(id);
    } else {
      entitiesKept.push(id);
    }
  }

  return { reverted, channels, entitiesRemoved, entitiesKept };
}
