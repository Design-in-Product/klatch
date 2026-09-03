/**
 * Round 140 probe — how big is the entity backfill, actually?
 *
 * Daedalus, 2026-09-02 STOP fire. Answers Ask 1 in
 * `docs/mail/calliope-to-daedalus-cc-team-xian-decided-backfill-2026-09-02.md`:
 *
 *   "worth checking directly whether that same logic can run retroactively over
 *    the 72, or whether backfill needs its own pass ... xian's next question
 *    will be 'how long,' so a number (even a rough one) is the useful reply."
 *
 * Run:  npx tsx scripts/probe-backfill-entity-sizing.mts <path-to-klatch.db> [...]
 *
 * **Strictly read-only.** Opens every DB `readonly: true`, never runs initDb or
 * any migration, and selects `messages.content` for exactly one row per channel
 * (the opening human turn) because that string is the guess input — the whole
 * question is what `guessEntityName` would propose from it. Pass `--no-openers`
 * to suppress echoing any of that text; the counts still work.
 *
 * Caveat inherited from Theseus's 8/12 note on `inspect-klatch-db.mjs`:
 * readonly applies to the *database*, not the directory. SQLite still creates
 * `-wal`/`-shm` sidecars beside a WAL-mode DB. Both are gitignored.
 *
 * WHAT IT MEASURES, and why each number is separate from the others.
 *
 * A backfill is not one UPDATE. Reading the import write path
 * (`queries.ts: importSession`) and the entity-scoped read path
 * (`queries.ts: entityTranscriptWhere`) together, the binding lives in two
 * places and the rows split into three populations:
 *
 *   P1  `channel_entities` rows pointing at `default-entity`.
 *       This is what the UI shows and what the *user* half of the entity
 *       transcript keys off (the EXISTS clause). Re-pointing this alone makes
 *       the channel look repaired.
 *
 *   P2  assistant `messages` rows stamped `entity_id = 'default-entity'`.
 *       `importSession` stamps the bound entity onto every assistant row
 *       (`boundEntityId`), so pre-confirm imports carry the default here too.
 *       These currently match `entityTranscriptWhere`'s first disjunct for the
 *       DEFAULT entity — i.e. they are all pooled into one agent's transcript.
 *
 *   P3  assistant `messages` rows with `entity_id IS NULL`.
 *       `messages.entity_id` was added by `ALTER TABLE ... ADD COLUMN entity_id
 *       TEXT` (`db/index.ts:103`) with no default, so anything imported before
 *       that migration has NULL. Predicted consequence, from the WHERE clause:
 *
 *           (m.entity_id = ?  OR (m.role = 'user' AND m.entity_id IS NULL AND EXISTS(...)))
 *
 *       an assistant row with NULL `entity_id` satisfies *neither* disjunct.
 *       It is invisible to `getEntityTranscript` for every entity, including
 *       the default. Re-pointing P1 does not reach it. If P3 is non-empty, that
 *       is a second reason the carried-context content measured short on 8/12,
 *       independent of which entity the channels are bound to — and it means
 *       "backfill" that only fixes the binding leaves the agent's own answers
 *       out of its own transcript.
 *
 * P3 is a prediction from the code, not a claim about xian's DB. This script
 * exists to find out whether the population is empty. Report what it prints.
 *
 * WHAT IT ALSO MEASURES: the 80-char ceiling.
 *
 * `session-scanner.ts:106` caps the guess input at FINGERPRINT_MAX_CHARS = 80.
 * A backfill reading from the DB has the *whole* opening turn, so it can find
 * identity claims the live import path structurally cannot see. The script runs
 * `guessEntityName` twice per channel — once on the full opener, once on the
 * scanner's 80-char truncation — and reports where the two disagree. That
 * difference is the argument for backfill being better than "just re-import."
 *
 * WHAT IT DOES NOT ANSWER. The guess is a guess. `entity-guess.ts` is explicit
 * that a confirm step the user cannot evaluate is a rubber stamp, and xian's
 * 8/08 answer was guess-AND-confirm, not guess-alone. Nothing here proposes
 * applying anything. The output is a review sheet.
 */

import Database from 'better-sqlite3';
import { guessEntityName } from '../packages/server/src/import/entity-guess.js';

const DEFAULT_ENTITY_ID = 'default-entity';

/** Mirrors session-scanner.ts:106. Kept as a literal so drift is visible here. */
const FINGERPRINT_MAX_CHARS = 80;

const argv = process.argv.slice(2);
const showOpeners = !argv.includes('--no-openers');
const paths = argv.filter((a) => !a.startsWith('--'));

if (paths.length === 0) {
  console.error(
    'usage: npx tsx scripts/probe-backfill-entity-sizing.mts [--no-openers] <klatch.db> [<klatch.db>...]'
  );
  process.exit(1);
}

/** Columns present on a table, or null if the table is absent. */
function columnsOf(db: any, table: string): Set<string> | null {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.length ? new Set(rows.map((r) => r.name)) : null;
}

/**
 * Reproduce what the scanner would have handed `guessEntityName` at import
 * time. Truncation is the scanner's exact expression, not an approximation:
 * slice to CAP-1, trim the tail, append the ellipsis.
 */
function asScannerSaw(text: string): string {
  const t = text.trim();
  return t.length > FINGERPRINT_MAX_CHARS
    ? t.slice(0, FINGERPRINT_MAX_CHARS - 1).trimEnd() + '…'
    : t;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

for (const dbPath of paths) {
  console.log(`\n${'='.repeat(78)}\n${dbPath}\n${'='.repeat(78)}`);

  let db: any;
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  } catch (err) {
    console.log(`  UNREADABLE: ${err instanceof Error ? err.message : String(err)}`);
    continue;
  }

  const chanCols = columnsOf(db, 'channels');
  const msgCols = columnsOf(db, 'messages');
  const ceCols = columnsOf(db, 'channel_entities');
  if (!chanCols || !msgCols || !ceCols) {
    console.log('  SKIP: not a Klatch schema (missing channels/messages/channel_entities)');
    db.close();
    continue;
  }
  if (!msgCols.has('entity_id')) {
    console.log('  NOTE: `messages.entity_id` absent — DB predates db/index.ts:103. P2/P3 unmeasurable.');
  }
  const hasProjects = !!columnsOf(db, 'projects') && chanCols.has('project_id');
  const hasSource = chanCols.has('source');

  // ---- P1: channels bound to the default entity -----------------------------
  const boundToDefault = db
    .prepare(
      `SELECT c.id AS id,
              c.name AS name
              ${hasSource ? ', c.source AS source' : ''}
              ${hasProjects ? ', (SELECT p.name FROM projects p WHERE p.id = c.project_id) AS project_name' : ''}
         FROM channels c
         JOIN channel_entities ce ON ce.channel_id = c.id
        WHERE ce.entity_id = ?
        ORDER BY c.id`
    )
    .all(DEFAULT_ENTITY_ID) as {
    id: string;
    name: string;
    source?: string | null;
    project_name?: string | null;
  }[];

  const totalChannels = (db.prepare('SELECT COUNT(*) AS n FROM channels').get() as { n: number }).n;
  const totalEntities = (db.prepare('SELECT COUNT(*) AS n FROM entities').get() as { n: number }).n;

  // How many of those carry a second, non-default binding already? Re-pointing
  // is a different operation from adding, and a channel with two entities is
  // not the shape the 72 were described as having.
  const multiBound = db
    .prepare(
      `SELECT ce.channel_id AS id, COUNT(*) AS n
         FROM channel_entities ce
        WHERE ce.channel_id IN (SELECT channel_id FROM channel_entities WHERE entity_id = ?)
        GROUP BY ce.channel_id
       HAVING n > 1`
    )
    .all(DEFAULT_ENTITY_ID) as { id: string; n: number }[];

  console.log(
    `\n  Census: ${totalChannels} channels, ${totalEntities} entities, ` +
      `${boundToDefault.length} channel(s) bound to \`${DEFAULT_ENTITY_ID}\` (P1)` +
      (multiBound.length ? `, of which ${multiBound.length} also carry another entity` : '')
  );

  if (boundToDefault.length === 0) {
    console.log('  Nothing to backfill on this DB.');
    db.close();
    continue;
  }

  // ---- P2 / P3: assistant message rows --------------------------------------
  if (msgCols.has('entity_id')) {
    const ids = boundToDefault.map((c) => c.id);
    const holes = ids.map(() => '?').join(',');
    const p2 = (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM messages
            WHERE role = 'assistant' AND entity_id = ? AND channel_id IN (${holes})`
        )
        .get(DEFAULT_ENTITY_ID, ...ids) as { n: number }
    ).n;
    const p3 = (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM messages
            WHERE role = 'assistant' AND entity_id IS NULL AND channel_id IN (${holes})`
        )
        .get(...ids) as { n: number }
    ).n;
    const p3Global = (
      db.prepare(
        `SELECT COUNT(*) AS n FROM messages WHERE role = 'assistant' AND entity_id IS NULL`
      ).get() as { n: number }
    ).n;
    const userRows = (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM messages
            WHERE role = 'user' AND channel_id IN (${holes})`
        )
        .get(...ids) as { n: number }
    ).n;

    console.log(
      `  Rows in those channels: ${p2} assistant stamped \`${DEFAULT_ENTITY_ID}\` (P2), ` +
        `${p3} assistant NULL (P3), ${userRows} user (unstamped by design).`
    );
    console.log(
      `  P3 across the whole DB: ${p3Global} assistant row(s) with NULL entity_id.`
    );
    if (p3 > 0) {
      console.log(
        `  ⚠ P3 is NON-EMPTY. Predicted from entityTranscriptWhere: those ${p3} assistant\n` +
          `    row(s) match neither disjunct and are invisible to getEntityTranscript for\n` +
          `    EVERY entity, default included. Re-pointing channel_entities does not reach\n` +
          `    them. Verify by running the transcript query before trusting this line.`
      );
    } else {
      console.log('  P3 is empty here — the NULL-assistant prediction does not bite on this DB.');
    }
  }

  // ---- What would the guess propose? ---------------------------------------
  const openerStmt = db.prepare(
    `SELECT content FROM messages
      WHERE channel_id = ? AND role = 'user'
      ORDER BY rowid ASC LIMIT 1`
  );

  type Row = {
    channel: string;
    name: string;
    source: string;
    fullName: string;
    fullBasis: string;
    liveName: string;
    liveBasis: string;
  };
  const rows: Row[] = [];

  for (const ch of boundToDefault) {
    const openerRow = openerStmt.get(ch.id) as { content: string } | undefined;
    const opener = openerRow?.content ?? '';
    const project = ch.project_name ?? undefined;
    const full = guessEntityName(opener, project);
    const live = guessEntityName(asScannerSaw(opener), project);
    rows.push({
      channel: ch.id.slice(0, 8),
      name: ch.name ?? '(unnamed)',
      source: ch.source ?? '(none)',
      fullName: full.name || '—',
      fullBasis: full.basis,
      liveName: live.name || '—',
      liveBasis: live.basis,
    });
    if (showOpeners && full.basis === 'identity-claim' && live.basis !== 'identity-claim') {
      console.log(
        `\n  [80-char ceiling] channel ${ch.id.slice(0, 8)} "${ch.name}":\n` +
          `    full opener guesses "${full.name}" (identity-claim);\n` +
          `    the scanner's 80 chars guess "${live.name || '—'}" (${live.basis}).\n` +
          `    scanner saw: ${JSON.stringify(asScannerSaw(opener))}`
      );
    }
  }

  // ---- Aggregate ------------------------------------------------------------
  const basisHist = (key: 'fullBasis' | 'liveBasis') => {
    const h: Record<string, number> = {};
    for (const r of rows) h[r[key]] = (h[r[key]] ?? 0) + 1;
    return h;
  };
  const byName: Record<string, number> = {};
  for (const r of rows) byName[r.fullName] = (byName[r.fullName] ?? 0) + 1;

  // Would the proposed name collide with an entity that already exists? That is
  // reuse-by-name (resolveImportEntity: 'matched-by-name'), not a mint.
  const existing = db.prepare('SELECT name FROM entities').all() as { name: string }[];
  const existingNorm = new Set(existing.map((e) => e.name.trim().toLowerCase()));
  const distinct = Object.keys(byName).filter((n) => n !== '—');
  const wouldMatch = distinct.filter((n) => existingNorm.has(n.trim().toLowerCase()));
  const wouldMint = distinct.filter((n) => !existingNorm.has(n.trim().toLowerCase()));

  console.log('\n  Guess basis (full opener vs. what the live scanner would have seen):');
  console.log(`    full  : ${JSON.stringify(basisHist('fullBasis'))}`);
  console.log(`    live80: ${JSON.stringify(basisHist('liveBasis'))}`);
  const ceilingLoss = rows.filter(
    (r) => r.fullBasis === 'identity-claim' && r.liveBasis !== 'identity-claim'
  ).length;
  console.log(
    `    channels where the 80-char cap loses an identity-claim: ${ceilingLoss} of ${rows.length}`
  );

  console.log(
    `\n  Distinct proposed names: ${distinct.length} ` +
      `(${wouldMatch.length} reuse an existing entity, ${wouldMint.length} would mint)`
  );
  console.log(`    reuse : ${wouldMatch.join(', ') || '(none)'}`);
  console.log(`    mint  : ${wouldMint.join(', ') || '(none)'}`);
  const noGuess = rows.filter((r) => r.fullName === '—').length;
  console.log(`    channels with no guess at all (human must name): ${noGuess}`);

  console.log('\n  Per-channel review sheet:');
  console.log(
    `    ${pad('chan', 9)}${pad('channel name', 34)}${pad('source', 12)}${pad('guess (full)', 18)}basis`
  );
  for (const r of rows) {
    console.log(
      `    ${pad(r.channel, 9)}${pad(r.name, 34)}${pad(r.source, 12)}${pad(r.fullName, 18)}${r.fullBasis}` +
        (r.fullName !== r.liveName ? `   [live80 → ${r.liveName} / ${r.liveBasis}]` : '')
    );
  }

  console.log(
    '\n  Reminder: nothing above is a decision. `entity-guess.ts` is explicit that a\n' +
      '  confirmation the user cannot evaluate is a rubber stamp; xian\'s 8/08 answer was\n' +
      '  guess AND confirm. This sheet is the input to that confirm, not a substitute.'
  );

  db.close();
}
