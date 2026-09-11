/**
 * Round 191 — restoring the backup the way a person does.
 *
 * Round 190 (`7a0ba775`) made undo's refusal say, on a minted channel as well, "this database is from
 * before the run (a restored backup?)". The CLI header (`backfill-entity-bindings.mts:37`), the scoping
 * doc (`docs/plans/entity-backfill-scoping-2026-09-02.md:273`) and the 9/9 dry-run memo (`:58`) all name
 * "restore the snapshot" as one of two ways back from an apply. None of them says how. Every restore in
 * Rounds 185–189 used the probes' own `copyDb`, which deletes the sidecars and then calls `db.backup()`.
 * That is not what a person types.
 *
 *   **Does `cp <backup> klatch.db` give back the backup?**
 *
 * What the code says, read before this was run:
 * - The database is WAL (`db/index.ts:33`).
 * - The server opens it lazily through `getDb()` and has no shutdown handler (`packages/server/src/index.ts`).
 * - The CLI never closes its writable connection.
 * - Round 176 told xian the CLI can run with `npm run dev` up.
 *
 * Arm S — control: no other connection. apply, then cp.
 * Arm K — a second connection, the server's own `getDb()` under `tsx watch` (the dev server's runner),
 *         open through the apply. Stopped with SIGINT to its process group (Ctrl-C), then cp.
 * Arm D — K's restored file, as the operator's own tools see it: the dry run's `Candidates:` line.
 * Arm A — K's restored file, after the app starts again (`getDb()` in a fresh process, which exits).
 * Arm U — K's file after A: `--undo` with the run's record.
 * Arm L — cp while the second connection is still up.
 * Arm H — K, but the app is used between the apply and the restore: 1500 messages through the route's own
 *         `insertMessage`, one transaction each, past SQLite's autocheckpoint.
 * Arm C — control, the procedure that works: stop, delete `klatch.db-wal` and `klatch.db-shm`, then cp.
 * Arm Z — this probe changed no product file.
 *
 * Every fixture is Round 176's, checkpointed after building, so the main file holds all of it and the WAL
 * none, as in a long-lived database. (The builder alone leaves everything in the WAL; run 1 used that.)
 * States are compared as a hash of the rows undo writes. Each is read two ways: with its WAL, which is
 * what the app sees, and as `klatch.db` by itself, a copy with no sidecars.
 *
 * Substitution, stated: the second connection is the server's `getDb()` module, not the Hono process. The
 * server hardcodes port 3001 (`index.ts:48`), so a real one here could collide with xian's. It also loads
 * `.env` with `override: true` (`index.ts:17`), so a scratch `KLATCH_DB` in the environment would lose
 * to one in `.env`, which this probe does not read. `npm run dev` runs `tsx watch` under `concurrently`;
 * this runs `tsx watch` alone.
 *
 * Zero model calls. `klatch.db` is never opened: fixtures live in `.testdata/r191/` (gitignored).
 *
 *   npx tsx scripts/probe-round191-restoring-the-backup-the-way-a-person-does.mts
 */

import { execFileSync, spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SELF = fileURLToPath(import.meta.url);
const DATA = path.join(ROOT, '.testdata', 'r191');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');
const TSX = path.join(ROOT, 'node_modules', '.bin', 'tsx');

interface View {
  hash: string;
  integrity: string;
  channels: number;
  messages: number;
  entities: number;
  seatsOnDefault: number;
  restamped: number;
}
const count = (db: any, sql: string): number => db.prepare(sql).get().n;
/** The rows undo writes (messages' stamps, bindings with added_at, agents), hashed, and counts to read. */
function viewOf(db: any): View {
  let integrity: string;
  try {
    // One row can carry many newline-separated problems; print the first three and the total.
    const lines = (db.pragma('integrity_check') as { integrity_check: string }[]).flatMap((r) => r.integrity_check.split('\n'));
    integrity = lines.slice(0, 3).join(' | ') + (lines.length > 3 ? ` | … (${lines.length} lines)` : '');
  } catch (e) {
    integrity = 'THREW: ' + (e as Error).message;
  }
  try {
    const rows = [
      ...db.prepare('SELECT id, channel_id, entity_id FROM messages ORDER BY id').all().map((r: object) => 'm ' + JSON.stringify(r)),
      ...db
        .prepare('SELECT channel_id, entity_id, added_at FROM channel_entities ORDER BY channel_id, entity_id')
        .all()
        .map((r: object) => 'ce ' + JSON.stringify(r)),
      ...db.prepare('SELECT id, name FROM entities ORDER BY id').all().map((r: object) => 'e ' + JSON.stringify(r)),
    ].join('\n');
    return {
      hash: createHash('sha256').update(rows).digest('hex').slice(0, 16),
      integrity,
      channels: count(db, 'SELECT COUNT(*) AS n FROM channels'),
      messages: count(db, 'SELECT COUNT(*) AS n FROM messages'),
      entities: count(db, 'SELECT COUNT(*) AS n FROM entities'),
      seatsOnDefault: count(db, "SELECT COUNT(*) AS n FROM channel_entities WHERE entity_id = 'default-entity'"),
      restamped: count(db, "SELECT COUNT(*) AS n FROM messages WHERE role = 'assistant' AND entity_id IS NOT NULL AND entity_id != 'default-entity'"),
    };
  } catch (e) {
    return { hash: 'READ FAILED: ' + (e as Error).message, integrity, channels: -1, messages: -1, entities: -1, seatsOnDefault: -1, restamped: -1 };
  }
}

// ── self-spawned roles ────────────────────────────────────────────────────────
if (process.env.R191_ROLE === 'holder') {
  // The dev server's connection: `getDb()`, opened once, never closed. Commands arrive as files,
  // because `tsx watch` owns stdin.
  const { getDb } = await import('../packages/server/src/db/index.js');
  const q = await import('../packages/server/src/db/queries.js');
  const db = getDb();
  db.prepare('SELECT COUNT(*) AS n FROM channels').get();
  const dir = process.env.R191_DIR!;
  const walFile = path.resolve(process.env.KLATCH_DB!) + '-wal';
  const cmdFile = path.join(dir, 'holder.cmd');
  const replyFile = path.join(dir, 'holder.reply');
  setInterval(() => {
    if (!fs.existsSync(cmdFile)) return;
    const cmd = fs.readFileSync(cmdFile, 'utf8');
    fs.rmSync(cmdFile, { force: true });
    let reply: string;
    try {
      if (cmd === 'view') reply = JSON.stringify(viewOf(db));
      else if (cmd === 'write') {
        // A write the server makes while it runs; the row's value is unchanged, its page is not.
        db.prepare('UPDATE channels SET name = name WHERE rowid = (SELECT MIN(rowid) FROM channels)').run();
        reply = '"wrote"';
      } else if (cmd.startsWith('burst ')) {
        // The app in use: a new chat, then user messages the way POST /messages inserts them
        // (`routes/messages.ts:101`), each its own transaction.
        const n = Number(cmd.slice('burst '.length));
        const ch = q.createChannel('r191 in use', '');
        const body = 'lorem ipsum '.repeat(290);
        let walMax = 0;
        for (let i = 0; i < n; i++) {
          q.insertMessage(ch.id, 'user', `${i} ${body}`, 'complete');
          if (i % 50 === 0 && fs.existsSync(walFile)) walMax = Math.max(walMax, fs.statSync(walFile).size);
        }
        reply = JSON.stringify({
          inserted: n,
          bytesEach: body.length,
          autocheckpoint: db.pragma('wal_autocheckpoint', { simple: true }),
          walMaxSeen: walMax,
          walAfter: fs.existsSync(walFile) ? fs.statSync(walFile).size : 'absent',
        });
      } else reply = '"unknown command"';
    } catch (e) {
      reply = JSON.stringify({ error: (e as Error).message });
    }
    fs.writeFileSync(replyFile + '.tmp', reply);
    fs.renameSync(replyFile + '.tmp', replyFile);
  }, 50);
  fs.writeFileSync(path.join(dir, 'holder.ready'), String(process.pid));
  await new Promise(() => {});
}
if (process.env.R191_ROLE === 'app-restart') {
  // The app starting again on the restored file: open, read, exit.
  try {
    const { getDb } = await import('../packages/server/src/db/index.js');
    console.log(JSON.stringify(viewOf(getDb())));
    process.exit(0);
  } catch (e) {
    console.log(JSON.stringify({ hash: 'OPEN FAILED: ' + (e as Error).message }));
    process.exit(3);
  }
}

// ── harness ───────────────────────────────────────────────────────────────────
interface Check {
  arm: string;
  name: string;
  ok: boolean | 'open';
  detail: string;
}
const checks: Check[] = [];
const measurements: string[] = [];
function check(arm: string, name: string, ok: boolean, detail: string) {
  checks.push({ arm, name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${arm} · ${name} — ${detail}`);
}
function open_(arm: string, name: string, detail: string) {
  checks.push({ arm, name, ok: 'open', detail });
  console.log(`  [OPEN] ${arm} · ${name} — ${detail}`);
}
function measure(text: string) {
  measurements.push(text);
  console.log(`  [MEAS] ${text}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const size = (f: string): number | 'absent' => (fs.existsSync(f) ? fs.statSync(f).size : 'absent');
const sides = (db: string) => ({ db: size(db), wal: size(db + '-wal'), shm: size(db + '-shm') });
function view(file: string): View {
  let db: any;
  try {
    db = new Database(file, { readonly: true, fileMustExist: true });
    return viewOf(db);
  } catch (e) {
    const m = (e as Error).message;
    return { hash: 'OPEN FAILED: ' + m, integrity: m, channels: -1, messages: -1, entities: -1, seatsOnDefault: -1, restamped: -1 };
  } finally {
    db?.close();
  }
}
/**
 * What `klatch.db` holds by itself, without its WAL: a copy with no sidecars, read and deleted. `view()`
 * reads the file together with `-wal`, which is what the app sees, and not what the file contains.
 */
function mainOnly(file: string): View {
  const copy = file + '.main-only';
  for (const s of ['', '-wal', '-shm']) fs.rmSync(copy + s, { force: true });
  fs.copyFileSync(file, copy);
  try {
    return view(copy);
  } finally {
    for (const s of ['', '-wal', '-shm']) fs.rmSync(copy + s, { force: true });
  }
}
const brief = (v: View) =>
  `${v.hash} (channels ${v.channels}, messages ${v.messages}, entities ${v.entities}, default seats ${v.seatsOnDefault}, re-stamped ${v.restamped}, integrity ${v.integrity})`;
const namer = (post: View, backup: View) => (v: View) =>
  v.hash === post.hash ? 'the POST-RUN state' : v.hash === backup.hash ? 'the backup' : 'NEITHER';

/**
 * Round 176's fixture, then checkpointed so the main file holds all of it and the WAL none. A
 * long-lived database has most of its pages in the main file; the builder leaves them all in the WAL.
 */
function build(arm: string): { dir: string; db: string } {
  const dir = path.join(DATA, arm);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });
  const db = path.join(dir, 'klatch.db');
  execFileSync('npx', ['tsx', R176], { cwd: ROOT, env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: db }, stdio: 'ignore' });
  const w = new Database(db, { fileMustExist: true });
  w.pragma('wal_checkpoint(TRUNCATE)');
  w.close();
  const s = sides(db);
  if (s.wal !== 'absent' && s.wal !== 0) throw new Error(`fixture ${arm} not checkpointed: ${JSON.stringify(s)}`);
  if (typeof s.db !== 'number' || s.db <= 4096) throw new Error(`fixture ${arm} main file holds nothing: ${JSON.stringify(s)}`);
  return { dir, db };
}

function cli(args: string[]) {
  const r = spawnSync('npx', ['tsx', CLI, ...args], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, R191_ROLE: '' } });
  return { code: r.status ?? -1, out: r.stdout ?? '', err: r.stderr ?? '' };
}
function apply(db: string) {
  const r = cli([db, '--apply']);
  return {
    ...r,
    backup: /^Backup \(taken before anything was written\): (.+)$/m.exec(r.out)?.[1] ?? '',
    record: /^Undo record: (.+)$/m.exec(r.out)?.[1] ?? '',
  };
}
const candidatesLine = (out: string) => /^Candidates:.*$/m.exec(out)?.[0] ?? '(no Candidates line)';
const labelsIn = (out: string) => out.match(/ALREADY REVERTED|CHANGED SINCE THE RUN|NOT IN THIS DATABASE|REVERTED/g) ?? [];
function appRestart(db: string): { code: number | null; saw: View } {
  const r = spawnSync('npx', ['tsx', SELF], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, R191_ROLE: 'app-restart', KLATCH_DB: db } });
  let saw: any;
  try {
    saw = JSON.parse((r.stdout ?? '').trim().split('\n').pop() || '{}');
  } catch {
    saw = { hash: 'UNPARSED: ' + (r.stdout ?? '').slice(0, 200) + ' / ' + (r.stderr ?? '').slice(-200) };
  }
  return { code: r.status, saw };
}

interface Holder {
  proc: ChildProcess;
  dir: string;
  innerPid: number;
}
async function startHolder(dir: string, db: string): Promise<Holder> {
  // Its own process group, so SIGINT can go to the whole group, the way Ctrl-C in a terminal does.
  const proc = spawn(TSX, ['watch', SELF], {
    cwd: ROOT,
    env: { ...process.env, R191_ROLE: 'holder', R191_DIR: dir, KLATCH_DB: db },
    stdio: 'ignore',
    detached: true,
  });
  const ready = path.join(dir, 'holder.ready');
  for (let i = 0; i < 600 && !fs.existsSync(ready); i++) await sleep(50);
  if (!fs.existsSync(ready)) throw new Error('holder never became ready');
  const h = { proc, dir, innerPid: Number(fs.readFileSync(ready, 'utf8')) };
  holders.push(h);
  return h;
}
async function ask(h: Holder, cmd: string): Promise<any> {
  const reply = path.join(h.dir, 'holder.reply');
  fs.rmSync(reply, { force: true });
  fs.writeFileSync(path.join(h.dir, 'holder.cmd'), cmd);
  for (let i = 0; i < 1200 && !fs.existsSync(reply); i++) await sleep(50);
  if (!fs.existsSync(reply)) return { error: 'no reply' };
  const text = fs.readFileSync(reply, 'utf8');
  fs.rmSync(reply, { force: true });
  return JSON.parse(text);
}
const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
/** Ctrl-C: SIGINT to the group. Reports how it ended and whether any process of it is left. */
async function ctrlC(h: Holder): Promise<{ exit: string; innerLeft: boolean; forced: boolean }> {
  const ended = new Promise<string>((resolve) => h.proc.once('exit', (code, sig) => resolve(`code ${code} signal ${sig}`)));
  process.kill(-h.proc.pid!, 'SIGINT');
  const exit = await Promise.race([ended, sleep(15000).then(() => 'still running after 15s')]);
  for (let i = 0; i < 100 && alive(h.innerPid); i++) await sleep(50);
  const innerLeft = alive(h.innerPid);
  let forced = false;
  if (innerLeft || exit.startsWith('still')) {
    forced = true;
    try {
      process.kill(-h.proc.pid!, 'SIGKILL');
    } catch {}
    try {
      process.kill(h.innerPid, 'SIGKILL');
    } catch {}
  }
  return { exit, innerLeft, forced };
}
const holders: Holder[] = [];
process.on('exit', () => {
  for (const h of holders) {
    try {
      process.kill(-h.proc.pid!, 'SIGKILL');
    } catch {}
    try {
      process.kill(h.innerPid, 'SIGKILL');
    } catch {}
  }
});

console.log('\n=== Round 191 — restoring the backup the way a person does ===\n');
fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });

// ── Arm S — control: no other connection ─────────────────────────────────────
console.log('Arm S — no other connection: apply, then cp the backup over klatch.db');
{
  const s = build('s');
  const dryBefore = cli([s.db]);
  measure(`S: the dry run on the fixture before any apply prints: ${candidatesLine(dryBefore.out)}`);
  const a = apply(s.db);
  const afterApply = sides(s.db);
  const post = view(s.db);
  const backup = view(a.backup);
  check(
    'S0',
    'setup: apply exits 0, keeps a backup, and the run changed the rows (post-run differs from the backup)',
    a.code === 0 && !!a.backup && !!a.record && post.hash !== backup.hash && backup.integrity === 'ok',
    `exit ${a.code} · post-run ${brief(post)} · backup ${brief(backup)} · sidecars after apply ${JSON.stringify(afterApply)}`
  );
  fs.copyFileSync(a.backup, s.db);
  const restored = view(s.db);
  check(
    'S1',
    'with no other connection, cp of the backup over klatch.db gives back the backup, row for row',
    restored.hash === backup.hash && restored.integrity === 'ok',
    `after cp: ${brief(restored)} · sidecars ${JSON.stringify(sides(s.db))}`
  );
  const dryPost = cli([s.db]);
  measure(`S: the dry run on the correctly restored file prints: ${candidatesLine(dryPost.out)}`);
}

// ── Arm K — the dev server's connection open, stopped with Ctrl-C, then cp ─────
console.log('\nArm K — a getDb() connection under tsx watch open through the apply; Ctrl-C; cp');
{
  const k = build('k');
  const h = await startHolder(k.dir, k.db);
  const holderBefore = await ask(h, 'view');
  const a = apply(k.db);
  const afterApply = sides(k.db);
  const holderSees = await ask(h, 'view');
  const post = view(k.db);
  const backup = view(a.backup);
  const name = namer(post, backup);
  const stop = await ctrlC(h);
  const afterStop = sides(k.db);
  check(
    'K0',
    'setup: apply exits 0 with the connection open; the connection sees the run; Ctrl-C ends every process of it without force',
    a.code === 0 && !!a.backup && !!a.record && holderBefore.hash === backup.hash && holderSees.hash === post.hash &&
      post.hash !== backup.hash && !stop.innerLeft && !stop.forced,
    `apply exit ${a.code} · the connection saw ${name(holderBefore)} before and ${name(holderSees)} after · ` +
      `sidecars after apply ${JSON.stringify(afterApply)} · Ctrl-C: ${stop.exit}, inner process left ${stop.innerLeft}, forced ${stop.forced} · ` +
      `sidecars after stop ${JSON.stringify(afterStop)} · klatch.db by itself after stop: ${name(mainOnly(k.db))}`
  );

  fs.copyFileSync(a.backup, k.db);
  const afterCp = sides(k.db);
  const restored = view(k.db);
  const restoredMain = mainOnly(k.db);
  if (restored.hash === backup.hash) {
    check('K1', 'cp of the backup after Ctrl-C gives back the backup', true, `after cp: ${brief(restored)} · sidecars ${JSON.stringify(afterCp)}`);
  } else {
    open_(
      'K1',
      'the restore the CLI names, done with cp after stopping the dev server with Ctrl-C, gives back the run it was meant to undo',
      `after cp the app would read ${name(restored)}: ${brief(restored)}. klatch.db by itself is ${name(restoredMain)}; ` +
        `beside it klatch.db-wal is ${afterCp.wal} bytes, the same as after the stop (${afterStop.wal}). No command printed an error.`
    );
  }

  // ── Arm D — what the operator's own tools show on that file ──────────────
  const dry = cli([k.db]);
  measure(`D: the dry run on K's restored file exits ${dry.code} and prints: ${candidatesLine(dry.out)}`);

  // ── Arm A — the app starts again on that file ─────────────────────────────
  const app = appRestart(k.db);
  const afterApp = sides(k.db);
  measure(
    `A: the app starting again (exit ${app.code}) sees ${name(app.saw)}. After it exits the sidecars are ${JSON.stringify(afterApp)}; ` +
      `with its WAL the file reads ${name(view(k.db))}; klatch.db by itself reads ${name(mainOnly(k.db))}. The backup file is unchanged: ${view(a.backup).hash === backup.hash}.`
  );

  // ── Arm U — undo with the run's record, on that file ──────────────────────
  const u = cli([k.db, `--undo=${a.record}`]);
  const afterUndo = view(k.db);
  measure(`U: --undo with the run's record on that file → exit ${u.code}; labels ${JSON.stringify(labelsIn(u.out))}; the file now reads ${name(afterUndo)} (${brief(afterUndo)})`);
}

// ── Arm L — cp while the connection is still up ──────────────────────────────
console.log('\nArm L — cp while the getDb() connection is still up');
{
  const l = build('l');
  const h = await startHolder(l.dir, l.db);
  const a = apply(l.db);
  const post = view(l.db);
  const backup = view(a.backup);
  const name = namer(post, backup);
  fs.copyFileSync(a.backup, l.db);
  const connSees = await ask(h, 'view');
  const fresh = view(l.db);
  const wrote = await ask(h, 'write');
  const connAfterWrite = await ask(h, 'view');
  const stop = await ctrlC(h);
  const final = view(l.db);
  check(
    'L0',
    'setup: apply exits 0 with the connection open, and the run changed the rows',
    a.code === 0 && !!a.backup && post.hash !== backup.hash && !stop.forced,
    `apply exit ${a.code} · Ctrl-C: ${stop.exit}, forced ${stop.forced}`
  );
  if (connSees.hash === backup.hash && fresh.hash === backup.hash && final.hash === backup.hash) {
    check('L1', 'cp while the server is up gives back the backup, to it and to a new reader, and it stays back', true, `${connSees.hash}/${fresh.hash}/${final.hash}`);
  } else {
    open_(
      'L1',
      'cp while the dev server is still up does not give back the backup',
      `after cp: the open connection reads ${name(connSees)}, a new reader reads ${name(fresh)} (integrity ${fresh.integrity}); ` +
        `after the connection writes (${JSON.stringify(wrote)}) it reads ${name(connAfterWrite)}; after Ctrl-C the app would read ${name(final)} ` +
        `(integrity ${final.integrity}) and klatch.db by itself is ${name(mainOnly(l.db))}; sidecars ${JSON.stringify(sides(l.db))}`
    );
  }
}

// ── Arm H — the app used between the apply and the restore ───────────────────
console.log('\nArm H — K, with the app used between the apply and the restore (1500 messages, past the autocheckpoint)');
{
  const hx = build('h');
  const h = await startHolder(hx.dir, hx.db);
  const a = apply(hx.db);
  const post = view(hx.db);
  const backup = view(a.backup);
  const name = namer(post, backup);
  const walAfterApply = size(hx.db + '-wal');
  const burst = await ask(h, 'burst 1500');
  const used = await ask(h, 'view');
  const stop = await ctrlC(h);
  const afterStop = sides(hx.db);
  const usedMain = mainOnly(hx.db);
  check(
    'H0',
    'setup: apply exits 0 with the connection open; the connection then writes 1500 messages through insertMessage, one transaction each; Ctrl-C without force',
    a.code === 0 && !!a.backup && post.hash !== backup.hash && burst.inserted === 1500 && !stop.forced && used.integrity === 'ok',
    `apply exit ${a.code} · -wal after apply ${walAfterApply} · writes ${JSON.stringify(burst)} · the connection then reads ${brief(used)} · ` +
      `Ctrl-C: ${stop.exit} · sidecars after stop ${JSON.stringify(afterStop)} · klatch.db by itself after stop: ${brief(usedMain)}`
  );

  fs.copyFileSync(a.backup, hx.db);
  const restored = view(hx.db);
  const restoredMain = mainOnly(hx.db);
  if (restored.hash === backup.hash && restored.integrity === 'ok') {
    check('H1', 'cp after the app was used gives back the backup', true, brief(restored));
  } else {
    open_(
      'H1',
      'after the app was used between the apply and the restore, cp gives back neither the backup nor the state it replaced',
      `after cp the app would read ${name(restored)}: ${brief(restored)}. klatch.db by itself is ${name(restoredMain)} (${brief(restoredMain)}); ` +
        `beside it klatch.db-wal is ${size(hx.db + '-wal')} bytes. The state cp replaced: ${brief(used)}.`
    );
  }
  const app = appRestart(hx.db);
  measure(`H: the app starting again on that file → exit ${app.code}, sees ${name(app.saw)}: ${brief(app.saw)}`);
  const u = cli([hx.db, `--undo=${a.record}`]);
  const afterUndo = view(hx.db);
  measure(
    `H: --undo with the run's record on that file → exit ${u.code}; labels ${JSON.stringify(labelsIn(u.out))}; ` +
      `stderr ${JSON.stringify((u.err.split('\n').filter((l) => l && !/Deprecation|trace-deprecation/.test(l))).slice(0, 3))}; the file now reads ${brief(afterUndo)}`
  );

  // From there, is the way back still there? Nothing above opened the apply's backup for writing.
  const backupAfter = view(a.backup);
  fs.rmSync(hx.db + '-wal', { force: true });
  fs.rmSync(hx.db + '-shm', { force: true });
  fs.copyFileSync(a.backup, hx.db);
  const recovered = view(hx.db);
  check(
    'H2',
    "from the corrupt file, after the app and --undo have both failed on it: the apply's backup is untouched, and delete both sidecars, then cp, gives back the backup, row for row",
    backupAfter.hash === backup.hash && backupAfter.integrity === 'ok' && recovered.hash === backup.hash && recovered.integrity === 'ok',
    `backup file now ${name(backupAfter)} (integrity ${backupAfter.integrity}) · after delete + cp: ${brief(recovered)}`
  );
}

// ── Arm C — control: the procedure that works ────────────────────────────────
console.log('\nArm C — stop, delete klatch.db-wal and klatch.db-shm, then cp');
{
  const c = build('c');
  const h = await startHolder(c.dir, c.db);
  const a = apply(c.db);
  const post = view(c.db);
  const backup = view(a.backup);
  await ask(h, 'burst 1500');
  const stop = await ctrlC(h);
  const walBefore = size(c.db + '-wal');
  fs.rmSync(c.db + '-wal', { force: true });
  fs.rmSync(c.db + '-shm', { force: true });
  fs.copyFileSync(a.backup, c.db);
  const restored = view(c.db);
  const dry = cli([c.db]);
  check(
    'C1',
    'with the server stopped and both sidecars deleted first, cp gives back the backup, row for row, even after the app was used (as in H)',
    a.code === 0 && post.hash !== backup.hash && !stop.forced && restored.hash === backup.hash && restored.integrity === 'ok',
    `klatch.db-wal was ${walBefore} bytes when deleted · after cp: ${brief(restored)} · the dry run prints: ${candidatesLine(dry.out)}`
  );
}

// ── Arm Z — this probe changed no product code ───────────────────────────────
const touched = execFileSync('git', ['status', '--porcelain', '--', 'packages', 'scripts/backfill-entity-bindings.mts'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim();
check('Z', 'no product or CLI file differs from HEAD', touched === '', touched || 'clean');

// ── report ──────────────────────────────────────────────────────────────────
const failed = checks.filter((c) => c.ok === false);
const opens = checks.filter((c) => c.ok === 'open');
console.log(`\n${'='.repeat(78)}`);
console.log(`${checks.length} checks · ${failed.length} failed · ${opens.length} open · ${measurements.length} measurements`);
if (failed.length) {
  console.log('\nFAILED:');
  for (const f of failed) console.log(`  ${f.arm} · ${f.name} — ${f.detail}`);
}
if (opens.length) {
  console.log('\nOPEN:');
  for (const o of opens) console.log(`  ${o.arm} · ${o.name}`);
}
console.log(`${'='.repeat(78)}\n`);
process.exit(failed.length ? 1 : 0);
