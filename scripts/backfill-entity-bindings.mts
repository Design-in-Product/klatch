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
 * **Restoring the snapshot means stopping the app and deleting the sidecars
 * first, not just copying the file.** This header said "restore the snapshot"
 * for eleven days and never said how. Theseus's Round 191 did it the way a
 * person does — `cp` — with the dev server up: the copy restored *nothing* (the
 * app read the post-run state, row for row, no error anywhere), and once the app
 * had written anything at all it left a **corrupt** database. Round 191 reached
 * that with 1,500 messages; Theseus's Round 193 measured the width after
 * `checkpointAfterWrite()` landed and it is **one** — 1, 20 and 1,500 all end
 * malformed, so the steps are never a long-session precaution. `restoreSteps()`
 * below prints the four steps wherever this script names a backup; the text is
 * `restoreInstructions()` in `entity-backfill.ts`, one source for all of them,
 * and step 4 now quotes the `Candidates:` line a correct restore will print.
 *
 * **Undo reads each channel before it writes it.** Only a channel still in the
 * state the run left it in is reverted; one already reverted is reported as such,
 * and one that changed since the run (a later `--apply` re-minted its agent, or
 * someone re-seated it in the app) is named, with who is seated now, and left.
 * Theseus's Round 183 measured the blind version: an older record undone after a
 * re-apply half-reverted the newer run, a record from another database was
 * reported as "failed part-way", and all three printed the success line a
 * correct undo prints. The counts are now what was written. A run is known by
 * the binding it made, not only by the agent it bound: an agent matched by name
 * has one id for every run, so a later apply of the same agent leaves an older
 * record's channel alone (Round 185). Undo exits 0 only when no channel was left,
 * and a record none of whose channels exist here is refused as belonging to
 * another database.
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
 * **That rule covered every input except the database itself.** Theseus's Round
 * 195 drove the three things this tool tells an operator to do *after* a restore
 * that went wrong — step 4's own re-run, another `--apply`, and `--undo` — on a
 * database a naive `cp` had corrupted, and all three answered badly: a raw
 * `SqliteError` out of `runMigrations` with no sentence in it, a second snapshot
 * left beside the database because the throw skipped `discardSnapshot()`, and —
 * worst — an `--undo` that named its own fresh snapshot as the backup that is
 * "intact" when that file was a page-for-page copy of the corruption. `backup()`
 * copies pages and does not read them, so nothing anywhere said so. Now: a
 * writing run `quick_check`s its snapshot before calling it a way back and
 * refuses if it will not read back; a plan that throws on the dry-run path exits
 * through `unreadable()` with a sentence, the sidecars named, and every
 * `.backup-backfill-*` file beside the database listed **with its own verdict**,
 * newest first — because after a bad restore they differ only by timestamp and
 * the newest is a copy of the damage. `quick_check` and not `integrity_check`:
 * measured, the latter throws on exactly these files.
 *
 * **And a file SQLite will open is still not a way back.** Theseus's Round 197
 * found the one shape of the six a half-finished copy leaves that got through:
 * a **zero-length** file is a *valid empty* SQLite database — `quick_check` and
 * `integrity_check` both return `ok` on it — and it is what a `cp` that died in
 * its first instant leaves, because `cp` truncates the destination before it
 * reads the source. It was listed as sound, it was the newest, so this tool's
 * own rule pointed at it, and following that rule left the database at 0 bytes.
 * The verdict is now a table-count floor (`wayBackVerdict`), not `ok`. Two
 * neighbours of the same slip are closed with it: the copy itself is inside the
 * `try` that `unreadable()` catches, so `klatch.db-wal` — the path tab
 * completion offers next — is answered as *the sidecar, not the database*
 * rather than with a `backup.js` stack; and a **writing** run against a file
 * with no tables refuses instead of building a Klatch schema in it and
 * reporting no work to do.
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

/**
 * This script's own invocation, without the database path — the path is
 * appended and quoted at each site that prints a command, so a pasted line
 * survives a space (`shellQuote`, one source).
 */
const SCRIPT_COMMAND = 'npx tsx scripts/backfill-entity-bindings.mts';

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

// Uncheckpointed writes sitting beside the database, read *before* this script
// opens anything. Measured this round (`.testdata/r192-wal-signal.mjs`): a
// read-only open creates a **zero-length** `-wal` and a 32KB `-shm` and leaves
// both behind on close, so neither file *existing* says anything at all. Only a
// non-zero `-wal` does, and even that says "there are committed frames nothing
// has checkpointed" — something has this database open now, or something exited
// without closing it. It cannot tell those apart.
const walBytes = fs.existsSync(dbPath + '-wal') ? fs.statSync(dbPath + '-wal').size : 0;

// Warned, not refused. The condition Theseus's Round 191 needs is another
// connection open *through* the apply, and this is the closest honest proxy
// available before opening the file: `wal_checkpoint(TRUNCATE)` cannot tell an
// idle connection from none at all (it returned `busy:0` with a reader open, in
// the same measurement), so there is no test that separates a live server from a
// WAL left by a crash. Refusing on the proxy would block a legitimate run on a
// database nothing has open, which is the "bigger than what was asked for"
// direction this script refuses in — one step over.
if ((apply || undoRequested) && walBytes > 0) {
  console.log(
    `Note: ${path.basename(dbPath)}-wal is ${walBytes.toLocaleString()} bytes — this database has writes\n` +
      '  nothing has checkpointed, so something probably has it open (the dev server), or something exited\n' +
      '  without closing it. Stop `npm run dev` first if you can: with another connection open, copying the\n' +
      '  backup back over the database afterwards does not take effect, and can corrupt it (Round 191).\n' +
      '  Running anyway — this is a warning, not a refusal, because a WAL left by a crash looks the same.'
  );
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

/**
 * What SQLite makes of a database file, from a handle this function closes.
 *
 * `quick_check`, not `integrity_check`, and **measured rather than reasoned**:
 * on exactly the file this matters for — the database a naive `cp` corrupted,
 * Theseus's Round 195 — `integrity_check` *throws* `database disk image is
 * malformed`, so the check meant to produce a verdict produces the same
 * uncaught error it was added to prevent. `quick_check(1)` returns the fault as
 * a row instead (`Tree 4 page 24: btreeInitPage() returns error code 11`), in
 * under a millisecond on Round 176's fixture. It is O(db) on a healthy file,
 * which is the price of the one claim it backs.
 *
 * The `finally` is not tidiness. Theseus's own Round 195 probe closed its handle
 * on the success path only, and on these arms most reads throw by design: every
 * throw leaked a connection and poisoned later opens *in the same process* with
 * `disk I/O error`, which reported a correct restore as a failure. Same class of
 * bug as the one the round is about.
 *
 * **`ok` is not the same claim as "a way back", and Round 197 is the proof.**
 * A zero-length file is a *valid empty* SQLite database: it opens, and both
 * `quick_check` and `integrity_check` return `ok` on it. That is exactly what a
 * `cp` that died in its first instant leaves, because `cp` truncates the
 * destination before it reads the source. So this function also reports `bytes`
 * and `tables`, and the callers that make the way-back claim read those — see
 * `wayBackVerdict`. `ok` keeps its narrow meaning: SQLite read the file back.
 */
type Verdict = { ok: boolean; why: string; bytes: number; tables: number };

/** `-1` for both counts means "not established", never "zero". */
function quickCheck(p: string): Verdict {
  if (!fs.existsSync(p)) return { ok: false, why: 'the file is not there', bytes: -1, tables: -1 };
  let bytes = -1;
  try {
    bytes = fs.statSync(p).size;
  } catch {
    /* a stat that fails leaves bytes unestablished; the open below will say why */
  }
  let d: Database.Database | undefined;
  try {
    d = new Database(p, { readonly: true, fileMustExist: true });
    const rows = d.pragma('quick_check(1)') as Array<Record<string, unknown>>;
    const first = rows.length ? String(Object.values(rows[0])[0]) : '(no result)';
    // The banner line SQLite prefixes to a fault ("*** in database main ***")
    // is noise in a one-line verdict; the line under it is the fault.
    const why = first
      .split('\n')
      .filter((l) => !/^\*{3}/.test(l))
      .join('; ');
    const ok = first === 'ok';
    // Only meaningful on a file that read back. `sqlite_master` and not
    // `sqlite_schema`: the older name works on every SQLite this has to run on.
    // A throw here falls to the catch and reports as unreadable, which is the
    // honest verdict for a file whose schema cannot be read.
    const tables = ok
      ? Number(
          (
            d
              .prepare(
                "select count(*) as n from sqlite_master where type = 'table' and name not like 'sqlite_%'"
              )
              .get() as { n: number }
          ).n
        )
      : -1;
    return { ok, why: why || first, bytes, tables };
  } catch (err) {
    // Q5, Theseus's Round 197: an unreadable-by-permission file reports `unable
    // to open database file` — the same wording SQLite gives for several other
    // causes, and the remedy (chmod) is not one the operator is pointed at.
    let why = (err as Error).message;
    if (/unable to open database file/i.test(why)) {
      try {
        fs.accessSync(p, fs.constants.R_OK);
      } catch {
        why += ' — this file exists but is not readable by you (check its permissions)';
      }
    }
    return { ok: false, why, bytes, tables: -1 };
  } finally {
    try {
      d?.close();
    } catch {
      /* a handle that will not close is still better closed-attempted than leaked */
    }
  }
}

/**
 * The verdict printed beside a `.backup-backfill-*` file — the one line that
 * makes the way-back claim.
 *
 * Theseus's Round 197, arms P and Q: of the six shapes a half-finished copy
 * leaves beside a database, five are caught by `ok` alone (truncated at a page
 * boundary, a text file, a directory, no read permission, and the sound one).
 * **Zero length is the sixth, and it is the one that reads as sound.** Worse, it
 * is written last, so the rule this listing prints — *take the newest one that
 * reads as sound* — points at it, and following that rule with all four restore
 * steps leaves the database at 0 bytes with SQLite calling the result sound. He
 * measured the corpus lost that way at 10 channels.
 *
 * The floor is **tables, not bytes**. Every `.backup-backfill-*` file is by
 * construction a copy this tool took of a Klatch database, and a Klatch database
 * has tables; so a candidate with none is not a way back whatever its size, and
 * the rule needs no comparison against a target whose own table count may be
 * unknowable (it is usually damaged when this prints). Zero bytes is named
 * separately inside that verdict because it is the fact an operator can check
 * with `ls`.
 *
 * The sound case carries its shape — table count and size — because Round 195's
 * M6/M7 was three candidate files differing only by timestamp.
 */
function wayBackVerdict(v: Verdict): string {
  if (!v.ok) return `UNREADABLE — ${v.why}`;
  if (v.tables === 0) {
    return (
      `NOT A WAY BACK — ${v.bytes === 0 ? 'the file is empty (0 bytes)' : `${v.bytes.toLocaleString()} bytes, no tables`}. ` +
      `SQLite opens it and calls it sound;\n      a copy that died in its first instant looks exactly like this.`
    );
  }
  return `SQLite reads it as sound — ${v.tables} tables, ${v.bytes.toLocaleString()} bytes`;
}

/**
 * The `.backup-backfill-*` files actually sitting beside this database, newest
 * first, each with its own verdict.
 *
 * Printed on every arm that tells an operator to go back to a backup. Round 195
 * M6/M7: after a bad restore three of these differ only by timestamp, the way
 * back is among them, and the tool pointed at the newest — the only unreadable
 * one. The newest is the *worst* default here, because a snapshot taken after
 * the damage is a copy of the damage.
 *
 * The printed rule — *take the newest one that reads as sound* — is only safe
 * because `wayBackVerdict` and not `Verdict.ok` decides which files get that
 * phrase. Round 197 found the one shape where they disagree.
 */
function waysBack(): string {
  const dir = path.dirname(dbPath);
  const base = path.basename(dbPath);
  let names: string[];
  try {
    names = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith(`${base}.backup-backfill-`) && !/-wal$|-shm$/.test(f))
      .sort()
      .reverse();
  } catch {
    return '';
  }
  if (!names.length) return '\nNo `.backup-backfill-*` file is sitting beside this database.';
  const rows = names.map((n) => {
    return `  ${n}\n      ${wayBackVerdict(quickCheck(path.join(dir, n)))}`;
  });
  return (
    `\nBackups beside this database, newest first (a snapshot taken after the damage is a copy of\nit, so newest is not the answer — take the newest one that reads as sound):\n` +
    rows.join('\n')
  );
}

/** The sidecars, named, because a bad restore is usually one of these left behind. */
const sidecarNote = (): string => {
  const parts = ['-wal', '-shm']
    .map((s) => ({ s, size: fs.existsSync(dbPath + s) ? fs.statSync(dbPath + s).size : undefined }))
    .filter((p) => p.size !== undefined)
    .map((p) => `${path.basename(dbPath)}${p.s} (${p.size!.toLocaleString()} bytes)`);
  return parts.length ? `\nSidecars beside it right now: ${parts.join(', ')}.` : '';
};

// Opening the file is not reading it: SQLite does not touch a page until it
// must, so `new Database()` succeeds on anything on disk and `backup()` is
// where a file that is not a database finds out. Round 197's arm R drove the
// path one tab away — `klatch.db-wal` is what completion offers after
// `klatch.db` — and got `SqliteError: file is not a database` with a raw stack
// out of `better-sqlite3/lib/methods/backup.js:43`, because these three lines
// sat *above* the `try` that `unreadable()` is the catch for. Same class as
// Round 195's M2, through a door Round 196 did not close. `unreadable()`
// already handles `SQLITE_NOTADB`; it just never saw the throw.
const source = new Database(dbPath, { readonly: true, fileMustExist: true });
let sourceTables = -1;
try {
  // Read before the copy, from the handle already open, so the table count
  // below costs no second `quick_check` on a large database. A schema read that
  // throws lands in the same catch as a backup that throws, which is right:
  // both mean this file is not a database this tool can work from.
  sourceTables = Number(
    (
      source
        .prepare(
          "select count(*) as n from sqlite_master where type = 'table' and name not like 'sqlite_%'"
        )
        .get() as { n: number }
    ).n
  );
  await source.backup(snapshotPath);
} catch (err) {
  // Closed before the exit rather than in a `finally`: `unreadable()` ends in
  // `process.exit`, which does not run one. It disposes of whatever partial
  // file the failed copy left (`discardSnapshot`, force, no-throw-if-absent).
  try {
    source.close();
  } catch {
    /* see quickCheck: a handle that will not close is still better attempted */
  }
  unreadable(err as Error);
}
source.close();

// A file this script is about to call a way back has to be one. `backup()`
// copies pages; it does not read them — measured this round: from a corrupt
// source it *succeeds*, and the copy carries the same fault, with no error from
// either end. So a writing run on a damaged database used to take a snapshot,
// print it as the backup "taken before anything was written", print four steps
// whose step 3 copies it over the database, and — on the undo path — call it
// "intact" in the catch (Theseus's Round 195, M3 and M4).
//
// Checked only where the snapshot is a *backup*. A dry run's snapshot is a read
// surface that gets deleted, names no way back, and pays nothing for this.
// Round 197's R3/R4, and the one place this tool can still create the thing it
// is describing. `fs.existsSync` at `:246` separates "no such database" from
// everything else, and an empty file satisfies it — so a run aimed at one
// reported `Candidates: 0 — 0 would move, 0 skipped.` and exit 0, over a corpus
// that does not exist. On a **dry run** that is only misleading (a note, below,
// after the line itself). On a **writing** run it is worse than misleading:
// `db/index.ts` runs the migrations on open, so the apply built an 8-table
// Klatch schema and seated the default entity in a file that held nothing —
// 0 → 4,096 bytes, 1 channel — and then told the operator it had found nothing
// to do. The operator this reaches is the one whose restore just went wrong and
// is typing paths under stress, which is also the operator arm P hands an empty
// file to. Refusing costs nothing real: a backfill over a database with no
// tables has no work in it by definition, and the app, not this script, is what
// creates a Klatch database.
const dbBytes = (() => {
  try {
    return fs.statSync(dbPath).size;
  } catch {
    return -1;
  }
})();
// Zero bytes is the shape an operator can check with `ls`, so name it when it
// is the shape; a non-empty file with no tables is a different animal and the
// sentence should not claim otherwise.
const emptyFileNote = dbBytes === 0 ? ' — it is empty, 0 bytes' : '';

if ((apply || undoRequested) && sourceTables === 0) {
  discardSnapshot();
  console.error(`\nthis file is not a Klatch database: ${dbPath}`);
  console.error(
    `  SQLite opens it${emptyFileNote} and reads it as sound, but it holds no tables, so there is\n` +
      '  nothing here to back up and nothing to backfill. Writing to it would create a Klatch schema in\n' +
      '  a file that never held one, and report that it found no work to do.'
  );
  console.error(
    '  If a restore just went wrong, this is what a copy that died in its first instant leaves.\n' +
      '  Nothing was written and the snapshot was discarded.'
  );
  console.error(waysBack());
  process.exit(1);
}

if (apply || undoRequested) {
  const verdict = quickCheck(snapshotPath);
  if (!verdict.ok) {
    // Which of the two it is changes the remedy, so say which. A damaged source
    // is Round 195's arm; a sound source with an unreadable copy is a failure of
    // the copy itself (no room on the disk, an interrupted write) and the
    // database is still fine.
    const own = quickCheck(dbPath);
    discardSnapshot();
    if (own.ok) {
      console.error(`\ncannot back up this database: ${dbPath}`);
      console.error(`  The database reads as sound, but the copy just taken does not: ${verdict.why}`);
      console.error(
        '  Refusing to write against a backup that cannot be read back. Nothing was written and the\n' +
          '  copy was discarded. Check for room on the disk and run this again.'
      );
    } else {
      console.error(`\ncannot use this database: ${dbPath}`);
      console.error(`  SQLite reads it as damaged: ${own.why}`);
      console.error(
        '  A backup taken from it now is a copy of the damage, so this run would hand you a way back\n' +
          '  that cannot be read. Nothing was written and the snapshot was discarded.'
      );
      const sidecars = sidecarNote();
      if (sidecars) console.error(sidecars);
      console.error(waysBack());
    }
    process.exit(1);
  }
}

// `db/index.ts` resolves its path once, at import time, from KLATCH_DB. Set it
// before the dynamic imports below or it opens the worktree's own klatch.db.
process.env.KLATCH_DB = undoPath ? dbPath : apply ? dbPath : snapshotPath;

const {
  planEntityBackfill,
  applyEntityBackfill,
  undoEntityBackfill,
  checkUndoRecord,
  restoreInstructions,
  shellQuote,
  candidatesLine,
  mintAlongsideNote,
  ambiguousNameNote,
  BACKFILL_SOURCES,
  DEFAULT_APPLY_BASES,
} = await import('../packages/server/src/db/entity-backfill.js');

// One source, three sites. Round 191's failure is that the backup path was
// printed as a way back with no instructions attached; the instructions have to
// travel with the path, at every site that prints one.
const restoreSteps = (expected?: string): string =>
  restoreInstructions(dbPath, snapshotPath, expected, SCRIPT_COMMAND);

/**
 * Every arm that ends with "this database cannot be read", in this script's
 * voice rather than Node's.
 *
 * The header's rule — *"Every refusal speaks in this script's voice … a
 * sentence, not a Node stack"* — covered every input except the database
 * itself. Theseus's Round 195, M2: step 4 tells the operator to re-run this
 * script with no flags to find out whether their restore worked, and on a
 * database a bad restore corrupted that command printed nothing of its own —
 * just `SqliteError: database disk image is malformed` out of `runMigrations`,
 * uncaught. The one arm where these steps matter most was the one arm with no
 * sentence in it.
 */
function unreadable(err: Error): never {
  const msg = err.message;
  // `code` is better evidence than the message, and present on a better-sqlite3
  // error; the message test is the fallback for anything wrapped on the way up.
  const code = String((err as NodeJS.ErrnoException).code ?? '');
  const corrupt =
    /^SQLITE_(CORRUPT|NOTADB)/.test(code) || /malformed|not a database|file is encrypted/i.test(msg);
  // The path one tab away. `klatch.db-wal` is what completion offers after
  // `klatch.db`, and Round 197's R1 is someone taking it: the file is real, it
  // is beside the database, and it is not a database. Diagnosing that as
  // *damage* would be wrong twice over — the remedy is not a restore, and the
  // backup listing below would search beside a file that has never had one.
  // Only when the database it is a sidecar *of* is actually there: a bare file
  // that happens to end in `-wal` is not this mistake.
  const sidecarOf = /^(.*)(-wal|-shm)$/.exec(dbPath);
  if (sidecarOf && fs.existsSync(sidecarOf[1])) {
    discardSnapshot();
    console.error(`\nthis is not the database, it is one of its sidecars: ${dbPath}`);
    console.error(`  SQLite will not read it: ${msg}`);
    console.error(
      `  You probably want the file next to it:\n      ${sidecarOf[1]}\n` +
        `  (${path.basename(sidecarOf[1])}${sidecarOf[2]} is the write-ahead log; tab completion offers it right after the\n` +
        '  database itself.) Nothing was written and the snapshot was discarded.'
    );
    process.exit(1);
  }
  const own = corrupt ? quickCheck(dbPath) : undefined;
  discardSnapshot();
  console.error(`\ncannot read this database: ${dbPath}`);
  console.error(
    corrupt
      ? `  SQLite reads it as damaged: ${own && !own.ok ? own.why : msg}`
      : `  ${msg}`
  );
  if (corrupt) {
    console.error(
      '  A copy made while something still held the database open, without deleting the sidecars\n' +
        '  first, leaves it exactly like this — it is what step 2 of the restore steps exists for.\n' +
        '  Nothing was written and the snapshot was discarded. The way back is a backup that still\n' +
        '  reads as sound, restored with all four steps.'
    );
    const sidecars = sidecarNote();
    if (sidecars) console.error(sidecars);
    console.error(waysBack());
  } else {
    console.error('  Nothing was written and the snapshot was discarded.');
  }
  process.exit(1);
}

/**
 * The `Candidates:` line step 4's dry run will print **if the restore worked** —
 * so the operator can match a string instead of remembering one.
 *
 * Step 4 says *re-run this script with no flags*, and that is the line this has
 * to predict: not the line this run printed. They differ whenever the run
 * carried `--channels` (filtered form, different numbers) or `--bases`, so
 * echoing this run's own line would hand the operator a number their correct
 * restore can never produce — a restore that worked, reported as failed, at the
 * moment they are least able to judge it. Planned fresh against the unflagged
 * defaults instead.
 *
 * Call it only where the database still holds what the backup holds: before any
 * write on the apply path, and before `undoEntityBackfill` on the undo path (the
 * undo's backup is its own pre-state, not the pre-apply state).
 *
 * Never fatal. This is a help string; a plan that throws — a malformed database
 * being exactly the arm where these steps matter most — falls back to the older
 * wording rather than taking the run down with it.
 */
function unflaggedCandidates(): string | undefined {
  try {
    return candidatesLine(planEntityBackfill({ bases: DEFAULT_APPLY_BASES }));
  } catch {
    return undefined;
  }
}

/**
 * End a writing run with the same on-disk state whether or not something else
 * has the database open.
 *
 * That difference is the whole of Round 191's K arm. With no other connection,
 * SQLite checkpoints when the last one closes, so the apply's exit leaves no
 * WAL and a hand copy of the backup works (his S1). With the dev server also
 * holding the file, the close is not the last one, the run's frames stay in
 * `klatch.db-wal`, and the same copy gives back the run instead of the backup —
 * silently. Doing the checkpoint ourselves removes the branch.
 *
 * Measured before writing this (`.testdata/r192-wal-signal.mjs`): a TRUNCATE
 * checkpoint with an idle second connection open returns `busy:0` and empties
 * the WAL; it only reports busy against a connection inside a read transaction,
 * where it is a no-op and this run's output says so. Never fatal, and never in
 * the error path above — the file there may be the malformed one.
 *
 * It does **not** close his H arm: the app writing after the run builds a new
 * WAL, and step 2 of the restore steps is what covers that.
 */
function checkpointAfterWrite(): void {
  try {
    const rows = getDb().pragma('wal_checkpoint(TRUNCATE)') as Array<{
      busy: number;
      log: number;
      checkpointed: number;
    }>;
    const r = rows[0];
    if (r && r.busy !== 0) {
      console.log(
        `\nNote: could not empty ${path.basename(dbPath)}-wal — something is reading the database right now.\n` +
          '  The run is committed either way. Delete the sidecars before copying the backup back (step 2).'
      );
    }
  } catch (err) {
    console.log(`\nNote: could not checkpoint the write-ahead log (${(err as Error).message}).`);
  }
}
const { GUESS_BASES } = await import('../packages/server/src/import/entity-guess.js');
// Already loaded transitively by `entity-backfill.js` above — named here only so
// `checkpointAfterWrite` can reach the connection the writes went through.
const { getDb } = await import('../packages/server/src/db/index.js');

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
  // Computed once, before the undo writes anything, and reused in the catch
  // below: after a part-way undo the database no longer holds what the backup
  // holds, so re-planning there would predict the half-reverted state.
  const undoExpected = unflaggedCandidates();
  console.log(`Backup (taken before anything was written): ${snapshotPath}`);
  console.log(restoreSteps(undoExpected));
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
    // The arm where the steps matter most: Round 191's H is a database a hand
    // copy already corrupted, and undo exits here on it. The backup file itself
    // survived that, so these four steps are the only way back that arm has.
    //
    // "Intact" is now a measured word rather than an assumed one. Theseus's
    // Round 195, M4: on a corrupted database this line named the snapshot this
    // run had just taken — a page-for-page copy of the corruption — and the four
    // steps under it copy that file over the database. The snapshot verdict at
    // the top of the run is what makes the word true here; a damaged database
    // never reaches this catch any more, and a snapshot that would not read back
    // never became a backup.
    console.error(`The backup from before this run is intact at:\n  ${snapshotPath}`);
    console.error('  (SQLite read it as sound when it was taken, before this run wrote anything.)');
    console.error(restoreSteps(undoExpected));
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
      // A re-bound channel lists the record's agent under "seated now", so "no longer
      // seated here" would contradict the line it ends (Round 185, N4 on the fix).
      console.log(
        `            seated now: ${seated}. This record moved it to [${to}]` +
          (s.boundBeforeRun && s.seatedNow.some((e) => e.id === to)
            ? ", and it is seated by an earlier binding than this run's: this database is from before the run (a restored backup?)."
            : s.boundBeforeRun
            ? // A minted agent a restore took with it: "it is seated" would be false here.
              `, which ${s.toEntityExists ? 'is not seated here' : 'no longer exists'}, and everyone seated on it was seated before this run: this database is from before the run (a restored backup?).`
            : s.reboundSince
            ? ", and it is seated again by a later binding than this run's (a later --apply, or re-added in the app)."
            : s.toEntityExists
              ? ', which is no longer seated here.'
              : ', which no longer exists.')
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
    checkpointAfterWrite();
    process.exit(2);
  }
  if (changed || missing) {
    // The advice follows the reason. After a restore the newer record is the one
    // refused, so "undo with that run's record first" sent the operator the wrong
    // way (Theseus's Round 187, S2); that line prints only if some other channel
    // was left.
    const beforeRun = result.channels.filter((s) => s.boundBeforeRun).length;
    console.log(
      `  ${changed + missing} channel(s) left as they are (above). Undo writes only to a channel still in the\n` +
        "  state this record's run left it in." +
        (changed + missing > beforeRun ? " If a later --apply moved one, undo with that run's record first." : '') +
        (beforeRun
          ? "\n  If this database was restored from a backup, the record that fits it is an older run's: undo with that one."
          : '')
    );
  }
  if (result.reverted === 0 && result.entitiesRemoved.length === 0) {
    discardSnapshot();
    console.log('Nothing was written; the snapshot was discarded.');
  }
  // Unconditional, including the nothing-written branch: `getDb()` runs the
  // schema init and migrations on open, so even an undo that reverts no channel
  // has put frames in the WAL.
  checkpointAfterWrite();
  // Exit 0 means every channel in the record is back where the run found it,
  // reverted now or already. A channel left because it changed is an undo that did
  // not do what was asked, whether or not other channels were written beside it.
  // This rule used to sit inside the nothing-written branch above, so a re-seated
  // chat exited 2 in a one-channel record and 0 in a four-channel one (Theseus's
  // Round 185, M2).
  process.exit(changed || missing ? 2 : 0);
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

// The plan is the first thing that opens the database for real — `getDb()` runs
// the schema init and the migrations on the way — so this is where a damaged
// file surfaces on the dry-run path. (A writing run never reaches here on one:
// the snapshot verdict above refuses first.) The dry run pays for no check up
// front and gets its sentence here instead.
let plan;
try {
  plan = planEntityBackfill({ bases, channelIds });
} catch (err) {
  unreadable(err as Error);
}

console.log(`\n${'='.repeat(78)}\n${dbPath}\n${'='.repeat(78)}`);
console.log(
  `\nScope: channels with source in {${BACKFILL_SOURCES.join(', ')}} bound to \`default-entity\`.`
);
console.log(`Bases applied: ${bases.join(', ')}`);
// `candidatesLine` and not a format string here: step 4 of the restore steps
// quotes this line for the operator to match character by character, and two
// copies of the format would diverge into an instruction that reports a correct
// restore as a failure.
console.log(`\n${candidatesLine(plan)}`);

// Round 197's R3, the half of it that stays legal. A writing run over a
// table-less file refuses above; a *dry* run over one is a reasonable thing to
// do by accident and nothing to refuse — but `Candidates: 0 — 0 would move`
// over a file that held nothing reads identically to the same line over a
// corpus that is simply already backfilled, and the two want opposite next
// steps. Said straight after the line it qualifies, because that is the line
// step 4 asks the operator to compare. `sourceTables` is the count read from
// the file *before* this run touched anything.
if (sourceTables === 0) {
  console.log(
    `\nNote: this file held no tables before this run${emptyFileNote} — the zero above is the file,\n` +
      '  not the corpus. If you meant a database you have just restored, check the path; this is what a\n' +
      '  copy that died in its first instant leaves behind.'
  );
}

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
// A zero that is correct still has to be told apart from a zero that means
// nothing is here. On xian's March corpus the default run finds nothing because
// the one basis it applies has no true positive available on that corpus — while
// nine channels state a role and are excluded without a word. Naming the bases
// behind `basis-excluded`, and the flag that would include them, is the
// difference between "there is nothing to do" and "you have not asked yet".
const excludedBases = Object.entries(plan.summary.basisExcluded);
if (excludedBases.length) {
  const widened = [...new Set([...plan.bases, ...excludedBases.map(([b]) => b)])];
  console.log(
    `  excluded by basis: ${excludedBases.map(([b, n]) => `${n} ${b}`).join(', ')}` +
      ` — this run applies {${plan.bases.join(', ')}}. To see them:` +
      ` --bases=${widened.join(',')}`
  );
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
// Named, not left to be noticed. The sheet used to print a colliding name once
// in `new agents (…)` with nothing to say two channels were behind it; Round 199
// found two such pairs on the real corpus, each merging two unrelated agents.
for (const c of plan.summary.collisions) {
  console.log(
    c.mergesIntoOne
      ? `\n  ! "${c.name}" would take ${c.channels.length} channels — ${c.messages} message rows onto one identity:`
      : `\n  ! "${c.name}" is the name ${c.channels.length} separate agents would carry — ${c.messages} message rows, not merged:`
  );
  for (const ch of c.channels) {
    console.log(`      ${ch.id.slice(0, 8)}  ${(ch.name || '(unnamed)').slice(0, 60)}`);
  }
  // Which way the shared name fails depends on whether the basis reuses by name.
  // Saying "these become one new agent" about a `role-title` group would be
  // false: it mints one agent per channel, and the cost is ambiguous labels
  // rather than a merged transcript.
  console.log(
    !c.mergesIntoOne
      ? '    A role is a job, not a person, so these do not merge — you get that many agents with\n' +
          '    the same name. If they are in fact one agent continuing, merge them by hand after.'
      : c.action === 'minted'
        ? '    These become one new agent. That is right if they are the same agent and wrong if they\n' +
          '    are not — the sheet cannot tell, so check the titles above before approving either.'
        : '    These join the same existing agent. Same check.'
  );
}
// Theseus's Round 203 §2, answered as a limit rather than as a better test.
// The collision block above fires on normalized *name equality* and nothing
// else. On xian's March corpus that means one warning (the two Comms Chiefs)
// while the widest role lineage in the file — three Chief-of-Staff chats with
// contiguous date ranges — mints under three wordings of one job and says
// nothing. So `9 would move, 1 collision` reads as more coverage than it is,
// which is the same failure as a bare `0 would move` one level up.
//
// A fuzzier or lineage-aware test is available and is not being built: it would
// be a rule fitted to one corpus, and the sheet's job here is to be honest about
// what it checked rather than to guess at sameness. Printed only when something
// would be minted, because it is a caveat on minting and nothing else.
if (plan.summary.newAgents.length) {
  console.log(
    '\n  What the collision check does and does not cover: it compares names for exact equality,\n' +
      '  ignoring case and surrounding space. Two chats that state the same job in different words\n' +
      '  ("Chief of Staff (Executive Assistant)" and "Executive Assistant and Chief of Staff") mint\n' +
      '  two agents and produce no warning above. Successive chats in one role are common in an\n' +
      '  imported corpus — read the channel names in the per-channel list before approving.'
  );
}
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
  // The guess has always carried *what it was guessed from*, and this sheet has
  // never shown it. `entity-guess.ts` opens by arguing that a confirmation step
  // the user can't evaluate is a rubber stamp — and then the one caller that
  // actually gates an apply printed the name and dropped the reason. Only for
  // rows that would move: the 65 skipped rows have nothing to confirm.
  if (r.action !== 'skipped') console.log(`              ↳ ${r.rationale}`);
  // The one row an operator should look at twice: an entity of this name exists
  // and this plan is deliberately not binding to it. Minting is the safe default
  // and it is also wrong whenever the two really are one agent continuing, so
  // the choice is shown rather than made silently.
  //
  // Both notes moved into `entity-backfill.ts` in Round 210 (`mintAlongsideNote`
  // / `ambiguousNameNote`), so the suite can assert on the text an operator
  // reads. Formatted inline here since Round 205, they were reachable only by
  // spawning this script — which left a probe as their only check, and that
  // check went green when Round 206 changed them (Round 209 §3).
  const mintNote = mintAlongsideNote(r);
  if (mintNote) console.log(mintNote);
  const ambiguousNote = ambiguousNameNote(r);
  if (ambiguousNote) console.log(ambiguousNote);
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
// Reuse this run's plan only when it *is* the unflagged plan — `bases` is the
// exported default array by reference until `--bases` replaces it (above), and
// `plan.filter` is set only when `--channels` was. Otherwise plan again: one
// extra read-only pass, before any write, to avoid printing a number step 4's
// own command cannot produce.
console.log(
  restoreSteps(
    plan.filter === undefined && bases === DEFAULT_APPLY_BASES
      ? candidatesLine(plan)
      : unflaggedCandidates()
  )
);

const result = applyEntityBackfill(plan);
const recordPath = `${dbPath}.backfill-${stamp}.json`;
fs.writeFileSync(recordPath, JSON.stringify(result.record, null, 2));

console.log(
  `Applied: ${result.applied} channel(s) re-pointed, ${result.minted.length} agent(s) minted.`
);
console.log(`Undo record: ${recordPath}`);
console.log(
  // Quoted, both of them. This line was written to be pasted and was the one
  // printed command that had never been driven through a shell — on xian's own
  // corpus path it would need no quotes, and on any path with a space in it the
  // shell splits the line and the undo runs against the wrong argument.
  `  reverse with:  ${SCRIPT_COMMAND} ${shellQuote(dbPath)} --undo=${shellQuote(recordPath)}`
);
checkpointAfterWrite();
