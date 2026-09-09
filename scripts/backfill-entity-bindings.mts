/**
 * Entity backfill CLI — the apply pass for xian's 2026-09-02 "backfill, not
 * forward-only" ruling.
 *
 * Scoping and the population split (P1/P2/P3) are in
 * `docs/plans/entity-backfill-scoping-2026-09-02.md`; the logic lives in
 * `packages/server/src/db/entity-backfill.ts` and is unit-tested against an
 * in-memory DB (`packages/server/src/__tests__/round175-entity-backfill.test.ts`).
 * This file is a thin face over it: arguments, a snapshot, and printing.
 *
 * Usage:
 *
 *   # review sheet — reads a snapshot, never opens your DB for writing
 *   npx tsx scripts/backfill-entity-bindings.mts /path/to/klatch.db
 *
 *   # widen the guess bases it would act on (default: identity-claim only)
 *   npx tsx scripts/backfill-entity-bindings.mts /path/to/klatch.db --bases=identity-claim,project-name
 *
 *   # apply, keeping the snapshot beside the DB as a backup
 *   npx tsx scripts/backfill-entity-bindings.mts /path/to/klatch.db --apply
 *
 *   # apply only the channels you approved off the sheet — the ids as printed,
 *   # matched as prefixes, so you can copy what you see
 *   npx tsx scripts/backfill-entity-bindings.mts /path/to/klatch.db --apply --channels=abc123de,4f0a91bc
 *
 *   # put it back
 *   npx tsx scripts/backfill-entity-bindings.mts /path/to/klatch.db --undo=<record.json>
 *
 * **A dry run cannot touch the database it is reporting on.** `getDb()` runs the
 * server's schema init and migrations on whatever it opens — additive and
 * idempotent, but still a write, and a review pass that mutates the thing under
 * review is the wrong shape for a tool whose whole purpose is "look before you
 * commit". So every run takes a `db.backup()` snapshot from a **read-only**
 * handle first, and the dry run plans against the snapshot. `--apply` keeps that
 * same snapshot as the backup and then writes to the real file.
 *
 * Two independent ways back from an apply: restore the snapshot, or run `--undo`
 * against the record. The record is usually the better one — it does not discard
 * whatever the user did after the run. **`--undo` takes its own snapshot too**,
 * for the same reason: you reach for it because something already went wrong,
 * which is the worst moment to have one way back.
 *
 * **An operator mistake is never reported as an empty corpus.** An unknown
 * `--bases` value is refused by name, and `--channels` entries that match no
 * candidate — or match more than one — are echoed and the run refuses rather
 * than applying the subset that did resolve. Theseus's Round 176 found all three
 * returning `Candidates: 0` and exit 0, which reads as "your corpus has nothing
 * to fix."
 *
 * Known, inherited from Theseus's 8/12 note on `inspect-klatch-db.mjs`: opening
 * a WAL database read-only still creates `-wal`/`-shm` sidecars beside it. Both
 * are gitignored.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith('--'));
const positional = argv.filter((a) => !a.startsWith('--'));

function flagValue(name: string): string | undefined {
  const hit = flags.find((f) => f === `--${name}` || f.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

const dbArg = positional[0];
if (!dbArg) {
  console.error(
    'usage: npx tsx scripts/backfill-entity-bindings.mts <klatch.db> [--apply] [--bases=a,b] [--channels=id,id] [--undo=<record.json>]'
  );
  process.exit(1);
}
const dbPath = path.resolve(dbArg);
if (!fs.existsSync(dbPath)) {
  console.error(`no such database: ${dbPath}`);
  process.exit(1);
}

const apply = flags.includes('--apply');
const undoPath = flagValue('undo');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

// The snapshot. Kept beside the DB when it is a backup (apply, undo), thrown
// away after a dry run (there it was only ever a read surface).
const snapshotPath =
  apply || undoPath
    ? `${dbPath}.backup-backfill-${stamp}`
    : path.join(os.tmpdir(), `klatch-backfill-dryrun-${stamp}.db`);

const source = new Database(dbPath, { readonly: true, fileMustExist: true });
await source.backup(snapshotPath);
source.close();

// `db/index.ts` resolves its path once, at import time, from KLATCH_DB. Set it
// before the dynamic imports below or it opens the worktree's own klatch.db.
process.env.KLATCH_DB = undoPath ? dbPath : apply ? dbPath : snapshotPath;

const {
  planEntityBackfill,
  applyEntityBackfill,
  undoEntityBackfill,
  BACKFILL_SOURCES,
  DEFAULT_APPLY_BASES,
} = await import('../packages/server/src/db/entity-backfill.js');
const { GUESS_BASES } = await import('../packages/server/src/import/entity-guess.js');

if (undoPath) {
  console.log(`Backup (taken before anything was written): ${snapshotPath}`);
  const record = JSON.parse(fs.readFileSync(undoPath, 'utf8'));
  const result = undoEntityBackfill(record);
  console.log(
    `Reverted ${result.reverted} channel(s). Agents removed: ${result.entitiesRemoved.length}` +
      (result.entitiesKept.length
        ? `; kept because something bound to them after the run: ${result.entitiesKept.join(', ')}`
        : '')
  );
  process.exit(0);
}

const basesArg = flagValue('bases');
let bases = DEFAULT_APPLY_BASES;
if (basesArg !== undefined) {
  const requested = basesArg.split(',').filter(Boolean);
  // Validated, not cast. An unknown value used to excluded every row and report
  // "0 would move" — a typo dressed as a finding about the corpus.
  const unknown = requested.filter((b) => !GUESS_BASES.includes(b as never));
  if (unknown.length || !requested.length) {
    fs.rmSync(snapshotPath, { force: true });
    for (const side of ['-wal', '-shm']) fs.rmSync(snapshotPath + side, { force: true });
    console.error(
      unknown.length
        ? `unknown --bases value(s): ${unknown.join(', ')}`
        : '--bases was given with no values'
    );
    console.error(`valid bases: ${GUESS_BASES.join(', ')} (note the hyphens)`);
    process.exit(1);
  }
  bases = requested as typeof DEFAULT_APPLY_BASES;
}
const channelsArg = flagValue('channels');
const channelIds = channelsArg ? channelsArg.split(',').filter(Boolean) : undefined;

const plan = planEntityBackfill({ bases, channelIds });

console.log(`\n${'='.repeat(78)}\n${dbPath}\n${'='.repeat(78)}`);
console.log(
  `\nScope: channels with source in {${BACKFILL_SOURCES.join(', ')}} bound to \`default-entity\`.`
);
console.log(`Bases applied: ${bases.join(', ')}`);
console.log(
  plan.filter
    ? `\nCandidates: ${plan.summary.candidates} of ${plan.summary.inScope} in scope matched your ` +
        `--channels filter — ${plan.summary.apply} would move, ${plan.summary.skipped} skipped.`
    : `\nCandidates: ${plan.summary.candidates} — ${plan.summary.apply} would move, ${plan.summary.skipped} skipped.`
);

// Say what the filter did not find, by name. A filter that resolved nothing and
// a corpus with nothing in it print the same row count otherwise.
const filterProblems: string[] = [];
if (plan.filter) {
  for (const id of plan.filter.unmatched) {
    filterProblems.push(`  --channels ${id}: matched no in-scope candidate on this sheet`);
  }
  for (const a of plan.filter.ambiguous) {
    filterProblems.push(
      `  --channels ${a.requested}: ambiguous prefix, matches ${a.matches.length} channels ` +
        `(${a.matches.map((m) => m.slice(0, 12)).join(', ')})`
    );
  }
  if (filterProblems.length) {
    console.log(`\n${filterProblems.length} of your ${plan.filter.requested.length} --channels entries did not resolve:`);
    for (const line of filterProblems) console.log(line);
    console.log(
      '  In scope means: source in {' +
        BACKFILL_SOURCES.join(', ') +
        '} and still bound to `default-entity`. A channel already re-pointed by an\n' +
        '  earlier run will not appear here.'
    );
  }
}
if (Object.keys(plan.summary.skipReasons).length) {
  console.log(`  skipped, by reason: ${JSON.stringify(plan.summary.skipReasons)}`);
}
console.log(
  `  new agents (${plan.summary.newAgents.length}): ${plan.summary.newAgents.join(', ') || '(none)'}`
);
console.log(
  `  reused agents (${plan.summary.reusedAgents.length}): ${plan.summary.reusedAgents.join(', ') || '(none)'}`
);
console.log(
  `  message rows re-stamped: ${plan.summary.p2} P2 (were \`default-entity\`), ` +
    `${plan.summary.p3} P3 (were NULL — invisible to every entity today).`
);
if (Object.keys(plan.excluded).length) {
  console.log(
    `  bound to the default but out of scope, untouched: ${JSON.stringify(plan.excluded)}`
  );
}

console.log('\nPer-channel:');
for (const r of plan.rows) {
  const verdict =
    r.action === 'skipped'
      ? `SKIP (${r.skipReason})`
      : `${r.action.toUpperCase()} → "${r.guessName}"`;
  console.log(
    `  ${r.channelId.slice(0, 8).padEnd(10)}${(r.channelName || '(unnamed)').slice(0, 32).padEnd(34)}` +
      `${(r.source ?? '—').padEnd(12)}${r.guessBasis.padEnd(16)}` +
      `P2=${String(r.p2).padEnd(5)}P3=${String(r.p3).padEnd(5)}${verdict}`
  );
}

if (!apply) {
  fs.rmSync(snapshotPath, { force: true });
  for (const side of ['-wal', '-shm']) fs.rmSync(snapshotPath + side, { force: true });
  console.log(
    '\nDry run — planned against a read-only snapshot, which has been deleted. Your database was\n' +
      'not opened for writing and no agent was minted. Re-run with --apply to move these, or with\n' +
      '--channels=<ids> to move only the ones you approve off this sheet.'
  );
  process.exit(filterProblems.length ? 2 : 0);
}

// Refuse the whole run rather than apply the part that resolved: --channels is a
// list of approvals, and quietly acting on some of them is the mistake the flag
// exists to prevent.
if (filterProblems.length) {
  fs.rmSync(snapshotPath, { force: true });
  for (const side of ['-wal', '-shm']) fs.rmSync(snapshotPath + side, { force: true });
  console.error(
    '\nRefusing to apply: some --channels entries did not resolve (above). Nothing was written and\n' +
      'the snapshot was discarded. Fix or drop those entries and re-run.'
  );
  process.exit(2);
}

if (plan.summary.apply === 0) {
  fs.rmSync(snapshotPath, { force: true });
  console.log('\nNothing to apply. Snapshot discarded.');
  process.exit(0);
}

console.log(`\nBackup (taken before anything was written): ${snapshotPath}`);

const result = applyEntityBackfill(plan);
const recordPath = `${dbPath}.backfill-${stamp}.json`;
fs.writeFileSync(recordPath, JSON.stringify(result.record, null, 2));

console.log(
  `Applied: ${result.applied} channel(s) re-pointed, ${result.minted.length} agent(s) minted.`
);
console.log(`Undo record: ${recordPath}`);
console.log(
  `  reverse with:  npx tsx scripts/backfill-entity-bindings.mts ${dbArg} --undo=${recordPath}`
);
