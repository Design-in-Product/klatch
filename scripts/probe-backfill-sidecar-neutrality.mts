/**
 * Does a backfill run that writes nothing to the target leave anything beside it?
 *
 * ## Why this exists
 *
 * `scripts/backfill-entity-bindings.mts` takes its pre-write snapshot from a
 * **read-only** handle, and the header's claim is that *"a dry run cannot touch
 * the database it is reporting on."* The rows claim held under every state
 * `unit-465migrate` and Theseus's 2026-11-06 round could build for it. The
 * *files* claim did not: opening a WAL-mode database read-only makes SQLite
 * create `-shm`, and a `-wal` if one is absent, because that is how a reader
 * reaches the WAL at all. So a dry run left two files beside an artefact it was
 * promising not to touch (`unit-465migrate` §7.1, reproduced by Theseus), and
 * `unit-465rowdelta` found the `--no-migrate` **refusal** path doing the same —
 * worse, because that path's own last word to the operator is *"Nothing was
 * written."*
 *
 * The cure removes only what that read-only open created, under two guards (the
 * sidecar was absent before the open, and the `-wal` is zero-length). This probe
 * is the guard on the cure, and it is written as a **two-sided** check on
 * purpose: a run that genuinely opens the target for writing must still leave its
 * sidecars, or the "cure" would be a `rm` of live frames dressed as tidiness.
 *
 * One arm per guard, and they are not interchangeable: arm **D** grades the outer
 * one (a `-wal` that was already there), arm **E** the inner one (a `-wal` another
 * process commits to *inside* the window). Arms A–D are all green with the size
 * test removed, which is why it was carried as explicitly ungraded until arm E
 * existed — `unit-465sizeguard-2026-11-07`.
 *
 * Hermetic: temp databases under `os.tmpdir()`, built by the product's own
 * `applySchema`. No ports, no corpus, no model call, no `$HOME` read.
 */
import { execFileSync, spawn } from 'child_process';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { applySchema } from '../packages/server/src/db/index.js';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TOOL = path.join(REPO, 'scripts/backfill-entity-bindings.mts');
const results: ProbeVerdict[] = [];
const made: string[] = [];
/**
 * Arms that did not run. Today this is arm **E**'s not-built path and nothing
 * else: a lost race is a precondition failure, so it is a **hard** skip (a bare
 * string), which `probe-outcome.mts` turns into exit 3 plus a structural
 * `did not run: <label>` line rather than into three failed claims.
 *
 * **For whoever promotes this probe:** the exit-3 pair is only half of what
 * `sweep-probes.mjs` `classify` needs. `BLOCKED` requires the label to be
 * DECLARED by the entry *and* to appear on the run's own `did not run:` line —
 * measured both ways in `unit-465skipE`, and an undeclared exit 3 stays RED. The
 * entry therefore needs
 *
 *     skip: /the race state could not be built/,
 *
 * and without it promotion converts a lost race into a red on a tree where the
 * product behaved perfectly, which is the state Daedalus declined promotion over.
 *
 * Array-initialised, never re-assigned, elements pushed as string literals — the
 * three properties `probe-round224`'s `Q` census holds over every caller of this field.
 */
const skipped: string[] = [];

/**
 * A WAL-mode, current-schema database with **no sidecars on disk** — the state
 * the app leaves after a checkpoint, and the only starting state in which the
 * question has an answer. `seeded` adds the rows that make the migration want to
 * write (an unbound channel, a `type='file'` artifact not yet in `files`).
 */
function build(kind: 'clean' | 'seeded'): string {
  const p = path.join(os.tmpdir(), `klatch-sidecar-${randomUUID()}.db`);
  made.push(p);
  const db = new Database(p);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applySchema(db);
  if (kind === 'seeded') {
    db.prepare(
      `INSERT INTO channels (id, name, system_prompt, source) VALUES ('ch', 'unbound', '', 'claude-code')`
    ).run();
    db.prepare(
      `INSERT INTO messages (id, channel_id, role, content, status) VALUES ('m', 'ch', 'user', 'hi', 'complete')`
    ).run();
    db.prepare(
      `INSERT INTO message_artifacts (id, message_id, type, file_name, file_mime_type, file_size_bytes, file_storage_key)
       VALUES ('a', 'm', 'file', 'a.txt', 'text/plain', 3, 'storage/a.txt')`
    ).run();
  } else {
    db.prepare(
      `INSERT INTO channels (id, name, system_prompt, source) VALUES ('ch', 'bound', '', 'claude-code')`
    ).run();
    db.prepare(
      `INSERT INTO channel_entities (channel_id, entity_id) VALUES ('ch', 'default-entity')`
    ).run();
  }
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  for (const s of ['-wal', '-shm'] as const) fs.rmSync(p + s, { force: true });
  return p;
}

function run(dbPath: string, flags: string[]): { code: number; out: string } {
  try {
    const out = execFileSync('npx', ['tsx', TOOL, dbPath, ...flags], {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024,
    });
    return { code: 0, out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? -1, out: `${e.stdout ?? ''}\n${e.stderr ?? ''}` };
  }
}

const sidecars = (p: string) =>
  (['-wal', '-shm'] as const).filter((s) => fs.existsSync(p + s)).join(' ');

/** One sidecar's presence **and** bytes — `-wal:329632B`, or `absent`. */
const size = (p: string, s: '-wal' | '-shm') =>
  fs.existsSync(p + s) ? `${s}:${fs.statSync(p + s).size}B` : `${s}:absent`;

/**
 * Put a **genuine, valid, non-zero `-wal`** beside the database — not a dummy
 * file. Autocheckpoint off, commit frames, stash the real log's bytes, close
 * (which checkpoints and removes it), then put the stashed bytes back. The header
 * and salt match the database, so a read-only open *recovers* this log rather
 * than rejecting it — which is what makes an arm built on it a measurement of the
 * cleanup guards rather than a measurement of SQLite's error handling.
 *
 * Why it has to be genuine: with a zero-length `-wal` there is nothing for a
 * truncation to destroy, so **no cripple at the cleanup site can move this arm at
 * all** — it is not a weak arm, it is an ungradeable one. Measured, this round:
 * `unit-465armd` drive 2 fired a truncate-in-place cripple against the old
 * zero-length fixture and it reported `-wal 0B -> 0B (destroyed 0B)`. Returns the
 * byte count so the arm can refuse rather than pass if the fixture ever stops
 * carrying the property it exists to carry.
 */
function withNonZeroWal(p: string): number {
  const db = new Database(p);
  db.pragma('journal_mode = WAL');
  db.pragma('wal_autocheckpoint = 0');
  for (let i = 0; i < 40; i++) {
    db.prepare(
      `INSERT INTO channels (id, name, system_prompt, source) VALUES (?, ?, '', 'claude-code')`
    ).run(`pad-${i}`, `pad ${i}`);
  }
  const stash = fs.readFileSync(p + '-wal');
  db.close();
  for (const s of ['-wal', '-shm'] as const) fs.rmSync(p + s, { force: true });
  fs.writeFileSync(p + '-wal', stash);
  return stash.length;
}

const check = (arm: string, label: string, pass: boolean, got: string) => {
  results.push({ arm, check: `${label} — ${got}`, pass });
  console.log(`  [${arm}] ${pass ? 'ok  ' : 'FAIL'} ${label} — ${got}`);
};

console.log('probe-backfill-sidecar-neutrality');

// ── A: the refusal path. --no-migrate over a database the migration would write
//    to: the run exits 1 having written nothing, and must leave nothing behind.
{
  const p = build('seeded');
  const r = run(p, ['--apply', '--no-migrate']);
  check('A', 'refusal exits 1', r.code === 1, `exit ${r.code}`);
  check('A', 'refusal names the rows', /Refusing to run: --no-migrate, and this run would write the rows/.test(r.out), 'reason line');
  check('A', 'no sidecar beside the refused target', sidecars(p) === '', sidecars(p) || '(nothing)');
}

// ── B: the dry run. No flags at all, the review sheet, the claim in the header.
{
  const p = build('seeded');
  const r = run(p, []);
  check('B', 'dry run exits 0', r.code === 0, `exit ${r.code}`);
  check('B', 'no sidecar beside the dry-run target', sidecars(p) === '', sidecars(p) || '(nothing)');
}

// ── C: the other side. A run that is NOT refused opens the target for writing
//    through `getDb()` *after* the cleanup, so its sidecars are live and must
//    survive.
//
//    What this arm does **not** catch: a blanket `rm -f` on both paths at the
//    cleanup site. This comment used to claim *"Without this arm, `rm -f` on both
//    paths would score three green"* — false for this site, and measured twice:
//    Theseus's `unit-465walcell` Y1, and `unit-465armd` drive 3 re-keyed in this
//    tree. A blanket `rm` does score **three** green — A, B *and C* — and only
//    arm D reddens. The mechanism is plain once measured: this cleanup runs
//    *before* `getDb()` reopens the target for writing, so whatever a blanket `rm`
//    removes here, the write open puts straight back.
//
//    The property arm C does hold down is a different and real one: that the
//    cleanup is not **relocated** to after the write open. Move it there and this
//    arm is the one that reddens.
{
  const p = build('clean');
  const r = run(p, ['--apply', '--no-migrate']);
  check('C', 'a clean database is not refused', r.code === 0, `exit ${r.code}`);
  check(
    'C',
    'a writing run keeps its own sidecars',
    sidecars(p) === '-wal -shm',
    sidecars(p) || '(nothing)'
  );
}

// ── D: a `-wal` that was already there, holding committed frames, keeps every
//    byte of them — whatever the path. This is the arm that makes the cleanup a
//    tidy-up rather than a data loss, so it is keyed on **bytes**, not presence,
//    and the two sidecars are checked **separately**.
//
//    Both of those are repairs, measured in `unit-465armd-2026-11-07` after
//    Theseus routed §4.2 of his `unit-465walcell` memo at this arm:
//
//      - The fixture used to be `writeFileSync(p + '-wal', '')` — zero bytes. A
//        truncate-in-place cripple against it reported `destroyed 0B`, so the arm
//        was not weak but *ungradeable*: nothing at this site could move it.
//      - The assertion used to be `sidecars(p) === '-wal -shm'`, a **presence**
//        filter, while this comment claimed the stronger thing. A cure that
//        truncated a pre-existing `-wal` in place would have scored it green.
//      - Keying both sidecars in **one** check does not work either, and that is
//        why there are two: a `-shm` legitimately moves 0 B → 32,768 B here, so a
//        single conjoined byte check reddens on a healthy product (measured, drive
//        4a) and can never speak about the `-wal` on its own.
{
  const p = build('seeded');
  const walBytes = withNonZeroWal(p);
  fs.writeFileSync(p + '-shm', Buffer.alloc(32768));
  // The arm refuses rather than passes if its own fixture stops carrying the
  // property. A green here must mean the frames survived, never that there were
  // none.
  check('D', 'fixture carries committed frames', walBytes > 0, `-wal:${walBytes}B built`);
  const walBefore = size(p, '-wal');
  const shmBefore = size(p, '-shm');
  const r = run(p, ['--apply', '--no-migrate']);
  check('D', 'still refuses', r.code === 1, `exit ${r.code}`);
  check(
    'D',
    'a pre-existing -wal keeps every byte',
    size(p, '-wal') === walBefore,
    `${walBefore} -> ${size(p, '-wal')}`
  );
  check(
    'D',
    'a pre-existing -shm is still there',
    size(p, '-shm') === shmBefore,
    `${shmBefore} -> ${size(p, '-shm')}`
  );
}

// ── E: the race the size test exists for, which is the only state it can fire in.
//    The cleanup's outer test is `!sidecarsBefore['-wal']`, so a non-zero `-wal`
//    here can only have been committed by **another process between this open and
//    this close**. No arm A–D builds that, which is why the size test was carried
//    for two rounds as explicitly ungraded: Theseus's `unit-465walcell` Y2 removed
//    it and all seven arms came back byte-identical, and Daedalus's `unit-465armd`
//    X1 bypasses the guards rather than testing them.
//
//    `unit-465sizeguard-2026-11-07` built the state and the test is **live**: with
//    it removed, the cleanup destroys 8,272 bytes of a live writer's committed
//    frames (drive 3, sentinel `destroyed 8272B`), and the database stops opening
//    for every other reader — `disk I/O error`, not a missing row — until the
//    writer's own connection closes. It is the difference between a tidy-up and
//    corrupting a database somebody else is using.
//
//    **Why the inode, and not the timing.** The window is wide (~43 ms at this
//    fixture size) but it is still a window, and the failure mode is a *green*, not
//    a flake: if the commit landed after the cleanup, the `-wal` is present and
//    non-zero for a reason that has nothing to do with the guard, and a
//    byte-keyed assertion reads exactly as it does on a healthy product. So the
//    state is keyed on **the identity of the file**: SQLite writes into the `-wal`
//    the tool's own open created, so the racer's commit landing in *that inode* is
//    what proves `sidecarsBefore` was captured with it absent and the cleanup had
//    not yet run. A different inode means the racer made its own file after the
//    cleanup, and the arm **refuses rather than passes** — three attempts, then
//    a declared hard skip. That is the third instance of the two-greens-either-side
//    shape this probe's own history is made of, and the first one caught before it
//    shipped.
//
//    **The key is platform-dependent, and this comment used to read as though it
//    were not.** An inode key has exactly one false-green — inode *reuse*, the
//    filesystem handing the unlinked inode back to the next file created in its
//    place, which would read "same inode" for a `-wal` the racer made *after* the
//    cleanup. Daedalus measured it where this probe runs (`unit-465promote`, 500
//    unlink/create trials under `os.tmpdir()`, APFS on `/System/Volumes/Data`):
//    1,000 distinct inodes of 1,000, **0 reuses**, with both controls carried. On
//    ext4, reuse after unlink is ordinary. So the key is sound on the machine this
//    probe is driven on and would need re-measuring, not re-reading, anywhere else.
//
//    **And a lost race is a declared hard skip, not a red** (`unit-465skipE`).
//    Keying on identity converts a lost race from a false green into a non-zero
//    exit, and `sweep-probes.mjs` `classify` makes an *undeclared* non-zero exit
//    RED with no further reading — a red on a tree where the product behaved
//    perfectly. Worse, the two downstream claims used to conjoin `r.built` with
//    their own claim, so in that state they printed a FAIL whose own reason text
//    said the claim held (`-wal:8272B committed -> -wal:8272B`; `visible`). They
//    are not reached in that state now: the not-built path records a hard skip
//    through `probe-outcome.mts`, which exits 3 and prints a structural
//    `did not run: <label>` line. For the sweep to read that as BLOCKED rather
//    than RED the entry must declare the label — see the note by `skipped` below.
{
  const ATTEMPTS = 3;
  type Race = {
    built: boolean;
    why: string;
    racerBytes: number;
    walAfter: string;
    rowSeen: string;
  };

  const raceOnce = async (): Promise<Race> => {
    const p = build('seeded');
    const child = spawn('npx', ['tsx', TOOL, p, '--apply', '--no-migrate'], {
      cwd: REPO,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.resume();
    child.stderr.resume();
    let exited = false;
    const done = new Promise<void>((res) =>
      child.on('exit', () => {
        exited = true;
        res();
      })
    );

    // The tool's own `-wal`: it cannot pre-exist, `build()` removed both sidecars.
    let toolIno = -1;
    while (toolIno < 0 && !exited) {
      try {
        toolIno = fs.statSync(p + '-wal').ino;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1));
      }
    }

    let racer: Database.Database | undefined;
    let racerBytes = -1;
    let commitIno = -3;
    if (toolIno >= 0) {
      racer = new Database(p);
      racer.pragma('wal_autocheckpoint = 0');
      racer.prepare(
        `INSERT INTO channels (id,name,system_prompt,source) VALUES ('racer','racer','','claude-code')`
      ).run();
      try {
        const st = fs.statSync(p + '-wal');
        commitIno = st.ino;
        racerBytes = st.size;
      } catch {
        // Removed between the commit and this stat — which can only be the cleanup
        // running *after* the commit landed, so the state was built and the guard
        // let it through. Not a failure to build.
        commitIno = -2;
      }
    }
    await done;

    const built = toolIno >= 0 && (commitIno === toolIno || commitIno === -2);
    const walAfter = size(p, '-wal');
    let rowSeen = '(not read)';
    try {
      const r = new Database(p, { readonly: true, fileMustExist: true });
      rowSeen =
        (r.prepare(`select count(*) as n from channels where id = 'racer'`).get() as { n: number })
          .n === 1
          ? 'visible'
          : 'GONE';
      r.close();
    } catch (err) {
      rowSeen = `unreadable (${(err as Error).message})`;
    }
    try {
      racer?.close();
    } catch {
      /* the verdicts above are already taken; a handle that will not close changes none of them */
    }
    const why =
      toolIno < 0
        ? 'the tool never created a -wal'
        : commitIno === -2
          ? 'cleanup removed the tool -wal after the commit'
          : commitIno === toolIno
            ? `commit landed in the tool's own -wal (ino ${toolIno})`
            : `commit made its own -wal (ino ${commitIno} != ${toolIno}) — cleanup had already run`;
    return { built, why, racerBytes, walAfter, rowSeen };
  };

  let r = await raceOnce();
  let tries = 1;
  while (!r.built && tries < ATTEMPTS) {
    r = await raceOnce();
    tries++;
  }

  // The state is a **precondition**, not a claim about the product, so it is
  // evidence rather than a check row: under the cure it is enforced by the exit
  // code, and a row emitted only on the branch that makes it true is green by
  // construction. `unit-465skipE` registered that trade before driving — the arm
  // publishes two claims, and the green conclusion line reads 13, not 14.
  console.log(`  [E] state ${r.built ? 'BUILT' : 'NOT BUILT'} — ${r.why} — ${tries} attempt(s)`);

  if (!r.built) {
    // A hard skip: `probe-outcome.mts` forces exit 3 and prints a structural
    // `did not run: <label>` line. The label carries **no attempt count** on
    // purpose — `ATTEMPTS` is a constant above and a number baked into the
    // declared label would drift the moment it changes, while the sweep's `skip:`
    // pattern is matched against this exact line. The count is on the line above.
    skipped.push('the race state could not be built');
  } else {
    check(
      'E',
      'a -wal written inside the window keeps every byte',
      r.racerBytes > 0 && r.walAfter === `-wal:${r.racerBytes}B`,
      `-wal:${r.racerBytes}B committed -> ${r.walAfter}`
    );
    check(
      'E',
      'another process can still read the database it is writing',
      r.rowSeen === 'visible',
      r.rowSeen
    );
  }
}

for (const p of made) {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(p + s, { force: true });
  for (const f of fs.readdirSync(os.tmpdir())) {
    if (f.startsWith(path.basename(p))) fs.rmSync(path.join(os.tmpdir(), f), { force: true });
  }
}

summariseAndExit({ probeName: 'backfill-sidecar-neutrality', results, skipped });
