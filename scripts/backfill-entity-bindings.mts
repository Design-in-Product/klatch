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
 * **Undo reads each channel before it writes it.** Only a channel still in the
 * state the run left it in is reverted; one already reverted is reported as such,
 * and one that changed since the run (a later `--apply` re-minted its agent, or
 * someone re-seated it in the app) is named, with who is seated now, and left.
 * Theseus's Round 183 measured the blind version: an older record undone after a
 * re-apply half-reverted the newer run, a record from another database was
 * reported as "failed part-way", and all three printed the success line a
 * correct undo prints. The counts are now what was written. Undo that writes
 * nothing exits 0 only when everything was already reverted, and a record none
 * of whose channels exist here is refused as belonging to another database.
 *
 * **An operator mistake is never reported as an empty corpus, and never as a
 * wider run than was asked for.** An unknown `--bases` value is refused by name,
 * and `--channels` entries that match no candidate — or match more than one —
 * are echoed and the run refuses rather than applying the subset that did
 * resolve. Theseus's Round 176 found all three returning `Candidates: 0` and exit
 * 0, which reads as "your corpus has nothing to fix."
 *
 * `--channels` **needs its equals sign.** `--channels <id>` used to leave the
 * approval list empty, and an empty list was indistinguishable from no list at
 * all: Theseus's Round 179 measured 7 of 11 channels moving where 1 was
 * approved, exit 0. An empty list now refuses (with the `=` named), because the
 * direction of that failure — bigger than what was asked for — is the worst one
 * this tool has. **So does `--undo`**, which had the same hole for a worse reason:
 * `--undo <record> --apply` re-applied the backfill the operator was reversing.
 * Every value-taking flag here now refuses an empty value rather than reading it
 * as an absent one.
 *
 * **Every token in argv is read, or the run refuses** — before the database is
 * opened. The empty-value rule could not see a flag with the wrong *name*:
 * `--channel=<id>` (singular) returned `undefined`, which is also "not given",
 * and Theseus's Round 181 measured it applying the whole corpus at exit 0, and
 * `--apply --und=<record>` re-applying the backfill being reversed. So a flag
 * this script does not know is refused (with a pasteable "did you mean"), as is
 * a value flag given twice, `--apply` given a value, a stray argument after the
 * path (`--channels=a, b` in a shell), and `--channels`/`--bases` beside
 * `--undo`, which never reads them.
 *
 * **Every refusal speaks in this script's voice and disposes of its snapshot.**
 * A missing or malformed `--undo` record is a sentence, not a Node stack, and is
 * checked before the snapshot is taken. The one deliberate exception is a throw
 * from inside `undoEntityBackfill`: undo commits per channel, so the backup is
 * kept and its path reprinted.
 *
 * Known, inherited from Theseus's 8/12 note on `inspect-klatch-db.mjs`: opening
 * a WAL database read-only still creates `-wal`/`-shm` sidecars beside it. Both
 * are gitignored.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';

const USAGE =
  'usage: npx tsx scripts/backfill-entity-bindings.mts <klatch.db> [--apply] [--bases=a,b] [--channels=id,id] [--undo=<record.json>]';

// Every token in argv is read, or the run refuses. Round 180's rule refuses a
// value-taking flag with an *empty* value; it could not see a flag with the wrong
// *name*, because `flagValue` returns `undefined` for a name it does not know and
// `undefined` is also "not given". Theseus's Round 181: `--channel=<id>` (the
// singular) planned and applied the whole corpus, 4 of 8 moved where 1 was
// approved, exit 0; `--apply --und=<record>` re-applied the backfill it was meant
// to reverse. Driving that turned up the rest of the family, all exit 0 on the
// same fixture: a second `--bases=none` dropped behind the first (4 would move
// instead of 0), a second `--channels=` dropped, `--channels=a, b` losing `b` to
// the shell as a stray argument, `--apply=yes` running dry. One rule at the parse
// boundary closes all of them rather than one guard per spelling.
const VALUE_FLAGS = ['bases', 'channels', 'undo'];
const KNOWN_FLAGS = ['apply', ...VALUE_FLAGS];

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return row[b.length];
}

// The suggestion carries the operator's own value across, so it can be pasted
// back as-is — and so the id they typed appears in the refusal, in full.
//
// Including a value typed after a *space*: `--channel <id>` (wrong name and no
// `=`) used to suggest a bare `--channels`, which does not echo the id and, pasted
// back, draws Round 180's equals-sign refusal on a second try (Theseus's Round
// 183, Q3). The next token is taken as the value only when it is not a flag and
// is not the only positional — `--channel <db>` must not suggest `--channels=<db>`.
function didYouMean(token: string, next: string | undefined, positionals: number): string {
  const eq = token.indexOf('=');
  const typed = (eq === -1 ? token : token.slice(0, eq)).replace(/^-+/, '').toLowerCase();
  const near = KNOWN_FLAGS.find((k) => editDistance(typed, k) <= 2);
  if (!near) return '';
  if (near === 'apply') return ' — did you mean --apply?';
  if (eq !== -1) return ` — did you mean --${near}${token.slice(eq)}?`;
  if (next !== undefined && !next.startsWith('-') && positionals >= 2) {
    return ` — did you mean --${near}=${next}? (with an equals sign; "${next}" was read as a separate argument)`;
  }
  return ` — did you mean --${near}=<value>?`;
}

const argv = process.argv.slice(2);
const flags: string[] = [];
const positional: string[] = [];
const argProblems: string[] = [];
const positionalCount = argv.filter((t) => !t.startsWith('-')).length;
for (const [i, token] of argv.entries()) {
  if (!token.startsWith('-')) {
    positional.push(token);
    continue;
  }
  const name = /^--([a-z]+)(?:=|$)/.exec(token)?.[1];
  if (!name || !KNOWN_FLAGS.includes(name)) {
    argProblems.push(`  ${token}: not a flag this script knows${didYouMean(token, argv[i + 1], positionalCount)}`);
  } else if (name === 'apply' && token !== '--apply') {
    argProblems.push(`  ${token}: --apply takes no value — pass it bare`);
  } else if (VALUE_FLAGS.includes(name) && flags.some((f) => /^--([a-z]+)/.exec(f)?.[1] === name)) {
    // Only the first was ever read. Which one the operator meant is not
    // something to guess: `--bases=identity-claim --bases=none` is two requests.
    argProblems.push(`  ${token}: --${name} was already given — pass it once`);
  } else {
    flags.push(token);
  }
}
if (argProblems.length) {
  console.error(
    `Refusing to run: ${argProblems.length === 1 ? 'an argument' : `${argProblems.length} arguments`} ` +
      'would have been ignored, and an ignored flag changes what this run covers.'
  );
  for (const line of argProblems) console.error(line);
  console.error(USAGE);
  process.exit(1);
}

function flagValue(name: string): string | undefined {
  const hit = flags.find((f) => f === `--${name}` || f.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

const dbArg = positional[0];
if (!dbArg) {
  console.error(USAGE);
  process.exit(1);
}
// One path, nothing after it. `--channels=a, b` hands the shell two words and `b`
// used to vanish here. A bare value flag (`--channels <id>`) is left to its own
// refusal below, which names the stray as the value it was meant to be.
const strays = positional.slice(1);
if (strays.length && !VALUE_FLAGS.some((n) => flags.includes(`--${n}`))) {
  console.error(`Refusing to run: unexpected argument(s) after the database path: ${strays.map((s) => `"${s}"`).join(', ')}`);
  console.error(
    '  This script reads one path. Channel ids go inside the list with no spaces: --channels=<id>,<id>'
  );
  process.exit(1);
}
const dbPath = path.resolve(dbArg);
if (!fs.existsSync(dbPath)) {
  console.error(`no such database: ${dbPath}`);
  process.exit(1);
}

const apply = flags.includes('--apply');
const undoArg = flagValue('undo');
// Asked for, as distinct from usable — the same distinction `--channels` needs
// below, and for a worse reason. `--undo <record>` (a space) made `undoArg` `''`,
// `''` is falsy, and the undo branch was skipped entirely: on its own that is a
// dry run where a reversal was asked for, and *with* `--apply` on the same line it
// re-applies the backfill the operator was trying to undo. Found driving Round
// 179's finding 5, not reported by it.
const undoRequested = undoArg !== undefined;
if (undoRequested && !undoArg!.length) {
  const stray = positional[1];
  console.error('--undo was given with no value: no record to reverse.');
  console.error(
    `  Use an equals sign: --undo=<record.json>` +
      (stray ? ` — "${stray}" was read as an extra argument.` : '.')
  );
  process.exit(1);
}
// The same rule, by mode. `--undo` reverses a whole record; `--channels` and
// `--bases` narrow a *forward* plan and are never read on the undo path, so
// `--undo=<record> --channels=<id>` reads as "put back that one" and reverses
// every channel the record holds. (`--apply` beside `--undo` is only redundant —
// undo writes either way — so it is let through.)
if (undoRequested) {
  const unread = ['channels', 'bases'].filter((n) => flagValue(n) !== undefined);
  if (unread.length) {
    console.error(
      `Refusing to run: ${unread.map((n) => `--${n}`).join(' and ')} cannot narrow an --undo.`
    );
    console.error(
      '  --undo reverses every channel in the record it is given. Drop ' +
        (unread.length === 1 ? 'the filter' : 'the filters') +
        ' to reverse the whole run; there is no partial undo.'
    );
    process.exit(1);
  }
}
const undoPath = undoRequested ? undoArg! : undefined;
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

// The snapshot. Kept beside the DB when it is a backup (apply, undo), thrown
// away after a dry run (there it was only ever a read surface).
const snapshotPath =
  apply || undoRequested
    ? `${dbPath}.backup-backfill-${stamp}`
    : path.join(os.tmpdir(), `klatch-backfill-dryrun-${stamp}.db`);

// Every refusal below this point has to clean up after itself. A snapshot of a
// 100MB database left beside it by a typo is litter the operator did not ask for,
// and three of the four disposal sites were already identical copies of this.
function discardSnapshot(): void {
  fs.rmSync(snapshotPath, { force: true });
  for (const side of ['-wal', '-shm']) fs.rmSync(snapshotPath + side, { force: true });
}

// Read and shape-check the undo record *before* the snapshot, so a missing or
// wrong-shaped file refuses without leaving a copy of the database behind. Both
// used to surface as raw Node errors — `ENOENT` with a stack, or
// `TypeError: record.channels is not iterable` from inside the module — after the
// snapshot had already been written (Theseus's Round 179, finding 5).
let undoRecordJson: unknown;
if (undoPath) {
  let raw: string;
  try {
    raw = fs.readFileSync(undoPath, 'utf8');
  } catch (err) {
    // "no such undo record", deliberately parallel to this script's own
    // `no such database: <path>` — the line Theseus named as the voice the undo
    // paths should have been speaking in.
    const e = err as NodeJS.ErrnoException;
    console.error(
      e.code === 'ENOENT'
        ? `no such undo record: ${undoPath}`
        : `cannot read undo record: ${undoPath}`
    );
    if (e.code !== 'ENOENT') console.error(`  ${e.message}`);
    console.error(
      '  The record is the `.backfill-<stamp>.json` file an --apply run printed beside your database.'
    );
    process.exit(1);
  }
  try {
    undoRecordJson = JSON.parse(raw);
  } catch (err) {
    console.error(`undo record is not valid JSON: ${undoPath}`);
    console.error(`  ${(err as Error).message}`);
    process.exit(1);
  }
}

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
  checkUndoRecord,
  BACKFILL_SOURCES,
  DEFAULT_APPLY_BASES,
} = await import('../packages/server/src/db/entity-backfill.js');
const { GUESS_BASES } = await import('../packages/server/src/import/entity-guess.js');

if (undoPath) {
  const checked = checkUndoRecord(undoRecordJson);
  if (!checked.ok) {
    discardSnapshot();
    console.error(`not a backfill undo record: ${undoPath}`);
    console.error(`  ${checked.problem}`);
    console.error(
      '  Expected the `.backfill-<stamp>.json` file an --apply run wrote beside your database.\n' +
        '  Nothing was written and the snapshot was discarded.'
    );
    process.exit(1);
  }
  console.log(`Backup (taken before anything was written): ${snapshotPath}`);
  let result;
  try {
    result = undoEntityBackfill(checked.record);
  } catch (err) {
    // The snapshot is *kept* here, unlike every other refusal: undo writes one
    // transaction per channel, so a throw part-way through may leave earlier
    // channels reverted. "May", not "does": Round 183 measured this catch telling
    // an operator their database was half-reverted when no channel had been
    // written. That case (a record from another database) no longer reaches a
    // write; for anything else, undo reads each channel before writing it, so the
    // same command run again reports exactly where each one stands.
    console.error(`\nundo stopped on a database error: ${(err as Error).message}`);
    console.error(
      '  Channels before the failing one may already be reverted. Run the same --undo again to see\n' +
        '  where each channel stands: undo reads a channel before writing it and never writes one twice.'
    );
    console.error(`The backup from before this run is intact at:\n  ${snapshotPath}`);
    process.exit(1);
  }

  // Every channel, as undo found it. The success line below used to count the
  // record's channels, not the channels written, so a correct undo, an undo aimed
  // at a database that had moved past the record, and an undo run after the backup
  // was restored all printed `Reverted 4 channel(s). Agents removed: 2` (Round 183).
  const LABEL = {
    revert: 'REVERTED',
    'already-reverted': 'ALREADY REVERTED — nothing to do',
    'changed-since': 'CHANGED SINCE THE RUN — left as it is',
    'not-in-database': 'NOT IN THIS DATABASE',
  } as const;
  const total = checked.record.channels.length;
  const count = (d: keyof typeof LABEL) => result.channels.filter((s) => s.disposition === d).length;
  console.log(
    `\nRecord written ${checked.record.createdAt}, ${total} channel(s). Each was read before anything was written to it:`
  );
  for (const [i, s] of result.channels.entries()) {
    const name = s.disposition === 'not-in-database' ? '—' : s.channelName || '(unnamed)';
    console.log(`  ${s.channelId.slice(0, 8).padEnd(10)}${name.slice(0, 32).padEnd(34)}${LABEL[s.disposition]}`);
    if (s.disposition === 'changed-since') {
      const to = checked.record.channels[i].toEntityId;
      const seated = s.seatedNow.map((e) => `${e.name || '(unnamed)'} [${e.id}]`).join(', ') || 'nobody';
      console.log(
        `            seated now: ${seated}. This record moved it to [${to}]` +
          (s.toEntityExists ? ', which is no longer seated here.' : ', which no longer exists.')
      );
    }
  }

  console.log(
    `\nReverted ${result.reverted} channel(s). Agents removed: ${result.entitiesRemoved.length}` +
      (result.entitiesKept.length
        ? `; kept because something still seats or stamps them: ${result.entitiesKept.join(', ')}`
        : '')
  );

  const missing = count('not-in-database');
  const changed = count('changed-since');
  if (total > 0 && missing === total) {
    // Round 183's arm C: the data was safe (the foreign key stopped the first
    // bind), but the operator heard "failed part-way". Now nothing is attempted.
    discardSnapshot();
    console.error(
      `\nNone of the ${total} channel(s) in this record exist in this database, so it was not written against it.\n` +
        `  Database: ${dbPath}\n` +
        '  Nothing was written and the snapshot was discarded. Check which database the record came from.'
    );
    process.exit(2);
  }
  if (changed || missing) {
    console.log(
      `  ${changed + missing} channel(s) left as they are (above). Undo writes only to a channel still in the\n` +
        '  state this record\'s run left it in. If a later --apply moved one, undo with that run\'s record.'
    );
  }
  if (result.reverted === 0 && result.entitiesRemoved.length === 0) {
    discardSnapshot();
    console.log('Nothing was written; the snapshot was discarded.');
    // Everything already reverted is a clean answer; anything left because it
    // changed is an undo that did not do what was asked, and must not exit 0.
    process.exit(changed || missing ? 2 : 0);
  }
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
    discardSnapshot();
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
// `undefined` means no filter; an *empty* filter must never mean the same thing.
// `--channels <id>` (a space instead of an `=`) made `flagValue` return `''`, `''`
// is falsy, and the whole approval list silently switched off — Theseus measured
// 7 of 11 channels moving instead of the 1 approved, exit 0, the id appearing
// nowhere in the output (Round 179, findings 1–3). `--bases` above already
// refuses this; the rule is the same one, and it covers `--channels=` and
// `--channels=,,` with it.
if (channelsArg !== undefined && !channelsArg.split(',').filter(Boolean).length) {
  discardSnapshot();
  console.error('--channels was given with no values: nothing would be approved.');
  // `--channels` with no `=` at all is the space slip specifically, and it has a
  // different remedy from an empty or comma-only list: the ids are sitting in
  // argv, unread. Name them.
  if (flags.includes('--channels')) {
    const stray = positional[1];
    console.error(
      '  Use an equals sign: --channels=<id>,<id>. A space after --channels switches the approval' +
        '\n  list off entirely rather than filling it' +
        (stray ? `, and "${stray}" was read as an extra argument.` : '.')
    );
  } else {
    console.error(
      '  Pass the ids you approved off the sheet (--channels=<id>,<id>), or drop the flag to plan\n' +
        '  the whole corpus. An empty list is not the same request as no list.'
    );
  }
  process.exit(1);
}
const channelIds =
  channelsArg !== undefined ? channelsArg.split(',').filter(Boolean) : undefined;

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
    // Full ids and names, not a truncation. Ids ambiguous on 8 characters usually
    // agree on 12, so the old `slice(0, 12)` printed the same string twice and
    // told the operator to choose between two things it had made identical
    // (Theseus's Round 179, finding 4). What disambiguates them is the rest of
    // the id — which is also exactly what you paste back.
    filterProblems.push(
      // Wording held to Round 179's string deliberately: Theseus's J1 asserts on
      // "matches N channels", and the fix here is the list below, not a rename.
      `  --channels ${a.requested}: ambiguous prefix, matches ${a.matches.length} channels ` +
        `— pass one of these in full:\n` +
        a.matches.map((m) => `      ${m.id}  ${m.name || '(unnamed)'}`).join('\n')
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
  discardSnapshot();
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
  discardSnapshot();
  console.error(
    '\nRefusing to apply: some --channels entries did not resolve (above). Nothing was written and\n' +
      'the snapshot was discarded. Fix or drop those entries and re-run.'
  );
  process.exit(2);
}

if (plan.summary.apply === 0) {
  discardSnapshot();
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
