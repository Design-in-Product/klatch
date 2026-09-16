/**
 * Round 220 probe — `reassignChannelEntity` driven on xian's March corpus.
 *
 * Daedalus, 2026-09-16 WORK fire. Theseus has named this three fires running:
 *
 *   > **Reassign on the March corpus is still undriven.** Third fire running.
 *   > Still the largest untested surface either of us has named, and it is not
 *   > getting smaller by being mentioned.  (Round 219 §7)
 *
 * He is right, and it is my surface — Round 212 built the endpoint, Round 213
 * (his) drove it over a socket, and both ran against a scratch database seeded
 * by the test. Neither touched real imported data. That matters here more than
 * it usually would, because of what the corpus actually contains:
 *
 *   139 channels · 68 entities · 170 seats · 2652 messages (1270 stamped)
 *   — and **every one of the heaviest channels is seated on `default-entity`
 *   alone**, with 174 / 148 / 122 / 110 / 101 stamped messages.
 *
 * That population *is* the reassign feature's reason to exist: an imported
 * conversation sitting under the generic "Claude" that the user wants to move
 * onto the specific agent it was always with. Every case in the unit suite is a
 * two-seat channel with a handful of messages, built by the test. Nothing had
 * ever moved a hundred real rows.
 *
 * Run:  npx tsx scripts/probe-round220-reassign-on-the-march-corpus.mts
 *
 * ZERO MODEL CALLS. No route, no server, no HTTP — this drives the query layer
 * directly, because the wire is the part Theseus's Round 213 already covered and
 * the data is the part nobody has. Operates on a **copy** under `.testdata/`;
 * the corpus files are checksummed before and after and asserted identical
 * (arm H). Nothing under `packages/` is written — also asserted.
 *
 * Arms:
 *   A  baseline pre-image of the copy                                [measurement]
 *   B  the heaviest real case: 174 stamped rows move with the seat        [check]
 *   C  everything outside the blast radius is unchanged, row by row       [check]
 *   D  the seat count never reaches zero — INSERT before DELETE           [check]
 *   E  at scale: every default-entity seat in the corpus, reassigned      [check]
 *   F  the orphan report on the corpus's only reassignable source         [check]
 *   G  the five refusals, against real ids                                [check]
 *   H  the corpus files are byte-identical; packages/ untouched           [check]
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const CORPUS = path.join(ROOT, '.testdata/r200/march14.db');
const WORKDIR = path.join(ROOT, '.testdata/r220');
const COPY = path.join(WORKDIR, 'march14-reassign.db');

let checks = 0;
let failures = 0;

function check(name: string, ok: boolean, detail?: string) {
  checks++;
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`);
}

function measure(name: string, value: unknown) {
  console.log(`  ..    ${name} = ${typeof value === 'object' ? JSON.stringify(value) : value}`);
}

function md5(file: string): string {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
}

// ── Setup: work on a copy, never the corpus ─────────────────────────────────

if (!fs.existsSync(CORPUS)) {
  console.error(`corpus not found at ${CORPUS} — nothing to drive, exiting 1`);
  process.exit(1);
}

const corpusBefore = md5(CORPUS);
const packagesBefore = execFileSync('git', ['diff', '--stat', '--', 'packages/'], {
  cwd: ROOT,
  encoding: 'utf-8',
});

fs.mkdirSync(WORKDIR, { recursive: true });
for (const suffix of ['', '-wal', '-shm']) {
  const src = CORPUS + suffix;
  if (fs.existsSync(src)) fs.copyFileSync(src, COPY + suffix);
}

process.env.KLATCH_DB = COPY;

const { getDb } = await import('../packages/server/src/db/index.js');
const { reassignChannelEntity } = await import('../packages/server/src/db/queries.js');
const { DEFAULT_ENTITY_ID } = await import('../packages/shared/src/types.js');

const db = getDb();

// ── A. Baseline ─────────────────────────────────────────────────────────────

console.log('\n── A. baseline (the copy, before anything moves) ──');

const count = (sql: string, ...args: unknown[]) =>
  (db.prepare(sql).get(...args) as { n: number }).n;

const baseline = {
  channels: count('SELECT COUNT(*) AS n FROM channels'),
  entities: count('SELECT COUNT(*) AS n FROM entities'),
  seats: count('SELECT COUNT(*) AS n FROM channel_entities'),
  messages: count('SELECT COUNT(*) AS n FROM messages'),
  stamped: count('SELECT COUNT(*) AS n FROM messages WHERE entity_id IS NOT NULL'),
  defaultSeats: count('SELECT COUNT(*) AS n FROM channel_entities WHERE entity_id = ?', DEFAULT_ENTITY_ID),
  defaultStamped: count('SELECT COUNT(*) AS n FROM messages WHERE entity_id = ?', DEFAULT_ENTITY_ID),
  emptyChannels: count(`SELECT COUNT(*) AS n FROM channels c
                         WHERE NOT EXISTS (SELECT 1 FROM channel_entities ce
                                            WHERE ce.channel_id = c.id)`),
};
measure('baseline', baseline);

/** The heaviest single seat in the corpus — arm B's subject, chosen by the data. */
const heaviest = db
  .prepare(
    `SELECT ce.channel_id, ce.entity_id, ce.added_at, c.name AS chan,
            (SELECT COUNT(*) FROM messages m
              WHERE m.channel_id = ce.channel_id AND m.entity_id = ce.entity_id) AS stamped
       FROM channel_entities ce JOIN channels c ON c.id = ce.channel_id
      ORDER BY stamped DESC LIMIT 1`
  )
  .get() as { channel_id: string; entity_id: string; added_at: string; chan: string; stamped: number };
measure('heaviest seat', { chan: heaviest.chan, stamped: heaviest.stamped, added_at: heaviest.added_at });

/** A real target that is NOT seated on that channel. */
const target = db
  .prepare(
    `SELECT id, name FROM entities
      WHERE id != ?
        AND id NOT IN (SELECT entity_id FROM channel_entities WHERE channel_id = ?)
      ORDER BY id LIMIT 1`
  )
  .get(heaviest.entity_id, heaviest.channel_id) as { id: string; name: string };
measure('target entity', target);

/** Full pre-image of every message row, for arm C. */
type MsgRow = Record<string, unknown> & { id: string };
const preMessages = new Map<string, MsgRow>(
  (db.prepare('SELECT * FROM messages').all() as MsgRow[]).map((r) => [r.id, r])
);
const preSeats = (
  db.prepare('SELECT channel_id, entity_id, added_at FROM channel_entities').all() as Record<
    string,
    string
  >[]
).map((r) => `${r.channel_id}|${r.entity_id}|${r.added_at}`);

// ── B. The heaviest real case ───────────────────────────────────────────────

console.log('\n── B. the heaviest real seat, reassigned ──');

const seatsOnChannelBefore = count(
  'SELECT COUNT(*) AS n FROM channel_entities WHERE channel_id = ?',
  heaviest.channel_id
);
check('the channel holds exactly one seat before the move', seatsOnChannelBefore === 1,
  `seats=${seatsOnChannelBefore}`);

const result = reassignChannelEntity(heaviest.channel_id, heaviest.entity_id, target.id);
measure('result', result);

check('outcome is reassigned', result.outcome === 'reassigned', result.outcome);
check(
  `all ${heaviest.stamped} stamped rows moved — not a sample, the whole channel's history`,
  result.messagesReassigned === heaviest.stamped,
  `moved=${result.messagesReassigned} expected=${heaviest.stamped}`
);

const movedSeat = db
  .prepare('SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
  .get(heaviest.channel_id, target.id) as { added_at: string } | undefined;
check('the target now holds the seat', !!movedSeat);
check(
  'and it kept the original added_at — a klatch roster does not reshuffle',
  movedSeat?.added_at === heaviest.added_at,
  `${movedSeat?.added_at} vs ${heaviest.added_at}`
);
check(
  'the source no longer holds it',
  !db
    .prepare('SELECT 1 FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
    .get(heaviest.channel_id, heaviest.entity_id)
);
check(
  'no message in that channel still points at the source',
  count('SELECT COUNT(*) AS n FROM messages WHERE channel_id = ? AND entity_id = ?',
    heaviest.channel_id, heaviest.entity_id) === 0
);

// ── D. The floor ────────────────────────────────────────────────────────────

console.log('\n── D. the seat count never reached zero ──');

const seatsOnChannelAfter = count(
  'SELECT COUNT(*) AS n FROM channel_entities WHERE channel_id = ?',
  heaviest.channel_id
);
check(
  'still exactly one seat after the move — INSERT precedes DELETE inside the txn',
  seatsOnChannelAfter === 1,
  `seats=${seatsOnChannelAfter}`
);
check('and the corpus-wide seat total is unchanged',
  count('SELECT COUNT(*) AS n FROM channel_entities') === baseline.seats);

// ── C. Blast radius ─────────────────────────────────────────────────────────

console.log('\n── C. everything outside the blast radius, row by row ──');

const postMessages = db.prepare('SELECT * FROM messages').all() as MsgRow[];
check('no message was created or destroyed', postMessages.length === preMessages.size,
  `${postMessages.length} vs ${preMessages.size}`);

let changed = 0;
let changedOutsideChannel = 0;
let changedInOtherColumn = 0;
for (const post of postMessages) {
  const pre = preMessages.get(post.id);
  if (!pre) continue;
  for (const col of Object.keys(post)) {
    if (pre[col] === post[col]) continue;
    changed++;
    if (post.channel_id !== heaviest.channel_id) changedOutsideChannel++;
    if (col !== 'entity_id') changedInOtherColumn++;
  }
}
measure('message cells changed', changed);
check(`exactly ${heaviest.stamped} cells changed, all entity_id`, changed === heaviest.stamped,
  `changed=${changed}`);
check('none of them outside the reassigned channel', changedOutsideChannel === 0,
  `outside=${changedOutsideChannel}`);
check('none of them in any column but entity_id', changedInOtherColumn === 0,
  `other=${changedInOtherColumn}`);

const postSeats = (
  db.prepare('SELECT channel_id, entity_id, added_at FROM channel_entities').all() as Record<
    string,
    string
  >[]
).map((r) => `${r.channel_id}|${r.entity_id}|${r.added_at}`);
const seatDiff = [
  ...postSeats.filter((s) => !preSeats.includes(s)),
  ...preSeats.filter((s) => !postSeats.includes(s)),
];
check('exactly two seat rows differ — the one removed and the one added', seatDiff.length === 2,
  JSON.stringify(seatDiff));

check('no entity row was touched',
  count('SELECT COUNT(*) AS n FROM entities') === baseline.entities);
check('no channel row was touched',
  count('SELECT COUNT(*) AS n FROM channels') === baseline.channels);

// ── E. At scale ─────────────────────────────────────────────────────────────

console.log('\n── E. every remaining default-entity seat in the corpus ──');

const scaleTarget = db
  .prepare('SELECT id, name FROM entities WHERE id != ? ORDER BY id DESC LIMIT 1')
  .get(DEFAULT_ENTITY_ID) as { id: string; name: string };
measure('scale target', scaleTarget);

const defaultSeats = db
  .prepare('SELECT channel_id FROM channel_entities WHERE entity_id = ?')
  .all(DEFAULT_ENTITY_ID) as { channel_id: string }[];
measure('default-entity seats to move', defaultSeats.length);

let movedTotal = 0;
let reassigned = 0;
const otherOutcomes: Record<string, number> = {};
for (const seat of defaultSeats) {
  const r = reassignChannelEntity(seat.channel_id, DEFAULT_ENTITY_ID, scaleTarget.id);
  if (r.outcome === 'reassigned') {
    reassigned++;
    movedTotal += r.messagesReassigned;
  } else {
    otherOutcomes[r.outcome] = (otherOutcomes[r.outcome] ?? 0) + 1;
  }
}
measure('reassigned', reassigned);
measure('other outcomes', otherOutcomes);
measure('message rows moved', movedTotal);

// Two checks here were written as tautologies and caught by reading the first
// run's output, not by a mutation. The first was
// `reassigned + others === defaultSeats.length`, which the loop makes true by
// construction — every iteration increments exactly one of the two. The second
// is below. Recording both: this is the third distinct place this fire where a
// control's expectation came from the thing it was controlling.
check('every default-entity seat reassigned, none refused',
  reassigned === defaultSeats.length && Object.keys(otherOutcomes).length === 0,
  `reassigned=${reassigned} of ${defaultSeats.length}, other=${JSON.stringify(otherOutcomes)}`);
check('the rows moved account for every message that was stamped default-entity',
  movedTotal + heaviest.stamped === baseline.defaultStamped,
  `${movedTotal} + ${heaviest.stamped} vs ${baseline.defaultStamped}`);
check('no default-entity seat remains',
  count('SELECT COUNT(*) AS n FROM channel_entities WHERE entity_id = ?', DEFAULT_ENTITY_ID) === 0);
check('no message still stamped default-entity',
  count('SELECT COUNT(*) AS n FROM messages WHERE entity_id = ?', DEFAULT_ENTITY_ID) === 0);
check('the corpus still has every message it started with',
  count('SELECT COUNT(*) AS n FROM messages') === baseline.messages);
check('and the same number of stamped messages',
  count('SELECT COUNT(*) AS n FROM messages WHERE entity_id IS NOT NULL') === baseline.stamped);
// The second tautology: this was written as the same subquery compared to
// itself, which is true for any database whatsoever — including one where all
// 139 channels had just been emptied, the exact failure it was aimed at. It now
// compares against the count taken in arm A, before anything moved.
const emptyNow = count(`SELECT COUNT(*) AS n FROM channels c
                         WHERE NOT EXISTS (SELECT 1 FROM channel_entities ce
                                            WHERE ce.channel_id = c.id)`);
check('no channel lost its last seat', emptyNow === baseline.emptyChannels,
  `empty now=${emptyNow} before=${baseline.emptyChannels}`);

// ── F. The orphan report on this population ─────────────────────────────────

console.log('\n── F. the orphan report, on the corpus’s only bulk source ──');

const defaultStillExists = !!db
  .prepare('SELECT 1 FROM entities WHERE id = ?')
  .get(DEFAULT_ENTITY_ID);
check('default-entity still exists — the orphan check reports, it does not delete',
  defaultStillExists);

// Documented behaviour: `fromEntityOrphaned` is hardcoded false for
// DEFAULT_ENTITY_ID (queries.ts, `fromEntityId !== DEFAULT_ENTITY_ID && …`).
// Every seat moved above came from default-entity, so the flag was false on all
// of them — including the last one, after which default-entity held nothing.
// Driving it here so the limit is a measured fact rather than a reading of the
// source: on this corpus, the orphan report is structurally silent.
const lastSeat = db
  .prepare('SELECT channel_id, entity_id FROM channel_entities WHERE entity_id != ? LIMIT 1')
  .get(scaleTarget.id) as { channel_id: string; entity_id: string } | undefined;
if (lastSeat) {
  const spare = db
    .prepare(
      `SELECT id FROM entities WHERE id NOT IN
        (SELECT entity_id FROM channel_entities WHERE channel_id = ?) LIMIT 1`
    )
    .get(lastSeat.channel_id) as { id: string } | undefined;
  if (spare) {
    const r = reassignChannelEntity(lastSeat.channel_id, lastSeat.entity_id, spare.id);
    measure('a non-default source', { from: lastSeat.entity_id, ...r });
    const stillBound = count('SELECT COUNT(*) AS n FROM channel_entities WHERE entity_id = ?',
      lastSeat.entity_id);
    const stillStamped = count('SELECT COUNT(*) AS n FROM messages WHERE entity_id = ?',
      lastSeat.entity_id);
    check('orphan flag agrees with the post-state it describes',
      r.outcome !== 'reassigned' || r.fromEntityOrphaned === (stillBound === 0 && stillStamped === 0),
      `flag=${r.fromEntityOrphaned} bound=${stillBound} stamped=${stillStamped}`);
  }
}

// ── G. The refusals, against real ids ───────────────────────────────────────

console.log('\n── G. refusals, on real rows rather than fixtures ──');

const live = db
  .prepare('SELECT channel_id, entity_id FROM channel_entities LIMIT 1')
  .get() as { channel_id: string; entity_id: string };

check('same-entity',
  reassignChannelEntity(live.channel_id, live.entity_id, live.entity_id).outcome === 'same-entity');
check('channel-not-found',
  reassignChannelEntity('no-such-channel', live.entity_id, live.entity_id).outcome ===
    'channel-not-found');
check('target-not-found',
  reassignChannelEntity(live.channel_id, live.entity_id, 'no-such-entity').outcome ===
    'target-not-found');

const unbound = db
  .prepare('SELECT id FROM entities WHERE id NOT IN (SELECT entity_id FROM channel_entities WHERE channel_id = ?) LIMIT 1')
  .get(live.channel_id) as { id: string } | undefined;
if (unbound) {
  check('source-not-bound',
    reassignChannelEntity(live.channel_id, unbound.id, live.entity_id).outcome ===
      'source-not-bound');
}

const twoSeat = db
  .prepare(
    `SELECT channel_id FROM channel_entities GROUP BY channel_id HAVING COUNT(*) > 1 LIMIT 1`
  )
  .get() as { channel_id: string } | undefined;
if (twoSeat) {
  const pair = db
    .prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ? LIMIT 2')
    .all(twoSeat.channel_id) as { entity_id: string }[];
  check('target-already-bound',
    reassignChannelEntity(twoSeat.channel_id, pair[0].entity_id, pair[1].entity_id).outcome ===
      'target-already-bound');
} else {
  measure('target-already-bound', 'no multi-seat channel left after arm E — not driven');
}

// ── H. The corpus was never opened for writing ──────────────────────────────

console.log('\n── H. the corpus itself ──');

check('march14.db is byte-identical to how this probe found it', md5(CORPUS) === corpusBefore);
const packagesAfter = execFileSync('git', ['diff', '--stat', '--', 'packages/'], {
  cwd: ROOT,
  encoding: 'utf-8',
});
check('nothing under packages/ was written', packagesAfter === packagesBefore);

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${checks - failures}/${checks} checks · ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
