/**
 * Render the expand continuation sentence — the one branch of the recall surface
 * that has never been in front of a model.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 *
 * `expandConversationRange` caps a call at `RECALL_MAX_EXPAND_ROWS = 30` rows
 * and, when it caps, appends:
 *
 *   "You asked for F–T; this is as far as one call goes. Ask again with
 *    from: N for the rest."
 *
 * (`recall.ts:787-791`.) Theseus flagged on 2026-08-18 that `renderExcerpt`
 * offers the *whole* stretch while `expand` returns `slice(0, 30)` — so an arm
 * can offer an address wider than one call can serve. That is handled, by the
 * sentence above. What was flagged at the same time and is still true: **every
 * offered address on record is 27 rows or fewer** (28 with arm N1, measured
 * 2026-08-19), so no arm has ever provoked the cap, and this sentence has never
 * rendered in any of the 62 rounds.
 *
 * Arm N2 exists to observe truncation, and it would be the first thing to see
 * this text. Building an arm is a fire of its own and needs two more
 * `FILLER_LEAD` pairs (`leadPairs: 17`, leading 32 rows). This script gets the
 * *render* onto the record for free in the meantime, so N2 is designed against
 * an observed string rather than a read one — the Round 57 lesson (a probe keyed
 * to a build's wording goes stale silently) applied before the fact instead of
 * after.
 *
 * ── What it does ─────────────────────────────────────────────────────────────
 *
 * Calls `expandConversationRange` directly against whatever the recall probe
 * last seeded into the scratch DB. No server, no model call, no writes. It picks
 * the longest 1-1 channel it finds and asks for its whole range, which exceeds
 * 30 whenever an N-family arm has been seeded (N1 seeds 60 rows).
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 *   npx tsx scripts/probe-expand-continuation.mts
 *
 * No env prefix, on purpose. `KLATCH_DB` defaults to the same
 * `.testdata/recall-probe.db` the probe computes when it is unset, and is set
 * *in-process before the recall module is imported* — hence the dynamic import
 * below. A static import would bind `getDb()`'s path at module load, and with
 * `KLATCH_DB` unset that path is the real `klatch.db`. Same hazard, and the same
 * shape of fix, as `probe-scratch-server.mjs`.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Channel, Entity } from '../packages/shared/src/types.js';
import { explainTsxRequirement } from './lib/tsx-required.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB = process.env.KLATCH_DB ?? path.join(__dirname, '..', '.testdata', 'recall-probe.db');

// Before the import below, not after. See the usage note.
process.env.KLATCH_DB = DB;

// Round 133: guarded like the other three read-only importers Round 126 guarded. This one was
// missed then and has crashed raw under plain `node` ever since — `ERR_MODULE_NOT_FOUND` naming
// `recall.js` as missing, with a stack trace, which is the exact misattribution the guard abolishes.
// It escaped §(b) because the anchor is spelled by *extension* and this specifier is spelled `.js`,
// which is how TypeScript ESM writes an import of a `.ts` sibling — the same convention
// `serve-scratch.mjs`'s own docblock names as the reason the guard has to exist at all.
let expandConversationRange: any, RECALL_MAX_EXPAND_ROWS: any;
try {
  ({ expandConversationRange, RECALL_MAX_EXPAND_ROWS } = await import(
    '../packages/server/src/claude/recall.js'
  ));
} catch (err) {
  explainTsxRequirement(err, import.meta.url);
}

const db = new Database(DB, { readonly: true });

// The probe seeds one 1-1 channel per arm, named `vesper-1-1-<TAG>`. Take the
// longest, which is the one most likely to exceed the row cap.
const channels = db
  .prepare(
    `select c.id, c.name, count(m.id) as n
       from channels c join messages m on m.channel_id = c.id
      group by c.id order by n desc`,
  )
  .all() as Array<{ id: string; name: string; n: number }>;

if (channels.length === 0) {
  console.error(`no seeded channels in ${DB} — run the recall probe with --dry first`);
  process.exit(1);
}

const target = channels[0];
console.log(`db      ${DB}`);
console.log(`channel ${target.name}  (${target.n} rows, cap is ${RECALL_MAX_EXPAND_ROWS})`);

const entityRow = db
  .prepare(
    `select e.* from entities e
       join channel_entities ce on ce.entity_id = e.id
      where ce.channel_id = ?`,
  )
  .get(target.id) as Entity | undefined;

if (!entityRow) {
  console.error(`channel ${target.name} has no entity attached`);
  process.exit(1);
}

// The `channel` argument is the room the agent is *speaking in*, and expand
// deliberately refuses to reach it — "This does not reach the room you are in
// now." Passing the target channel here returns a not-found, which is correct
// behaviour and was this script's first result. The probe seeds a companion
// `recall-room-<TAG>` for exactly this role, so use it.
const tag = target.name.replace(/^vesper-1-1-/, '');
const roomRow = db
  .prepare(`select * from channels where name = ?`)
  .get(`recall-room-${tag}`) as Channel | undefined;

if (!roomRow) {
  console.error(`no recall-room-${tag} beside ${target.name}; cannot supply a current room`);
  process.exit(1);
}

console.log(`entity  ${entityRow.name}`);
console.log(`room    ${roomRow.name}  (the channel being spoken in, which expand must not reach)`);
console.log('');

// The entity's *own* turns are what positions count, so the addressable range is
// roughly half the row count. Ask for far more than the cap either way.
const to = target.n;
const result = expandConversationRange(entityRow, roomRow, {
  conversation: target.name,
  from: 1,
  to,
});

console.log(`--- expand {conversation: "${target.name}", from: 1, to: ${to}}`);
console.log(
  `matchCount ${result.matchCount}   shownCount ${result.shownCount}   isError ${result.isError}`,
);
console.log('');

// The header is the first paragraph; the excerpts follow after a blank line.
// Only the header is the object of this probe — the excerpt bodies are ordinary
// rendered rows and are already on the record from every prior round.
const header = result.text.split('\n\n')[0];
console.log('--- HEADER AS RENDERED');
console.log(header);
console.log('');

const capped = result.shownCount < result.matchCount;
const CONTINUATION = /this is as far as one call goes\. Ask again with from: (\d+) for the rest\./;
const m = header.match(CONTINUATION);

console.log('--- CHECKS');
console.log(`cap was reached (shown < matched)     : ${capped}`);
console.log(`continuation sentence rendered        : ${m !== null}`);
if (m) {
  const next = Number(m[1]);
  console.log(`continuation resumes at position      : ${next}`);
  console.log(
    `tiles without overlap or gap          : ${next === result.shownCount + 1}` +
      `   (shown ${result.shownCount}, next ${next})`,
  );
}
if (capped !== (m !== null)) {
  console.error('MISMATCH — the cap and the sentence disagree; one of them is wrong');
  process.exit(2);
}
