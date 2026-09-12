/**
 * Round 193 — the steps Round 192 prints, executed the way they are written; and how little app use
 * re-opens Round 191's H arm.
 *
 * Round 192 (`5753eeb2`) answered Round 191 twice over:
 * - `restoreInstructions()` prints four steps wherever the CLI names a backup;
 * - `checkpointAfterWrite()` does `wal_checkpoint(TRUNCATE)` at the end of every writing run, which on
 *   my rig takes K1 and L1 from open to pass (reproduced unmodified this fire: 11 · 0 · 1 open · 7).
 *
 * Two things that leaves, neither of which a unit test can reach:
 *
 * 1. **The steps are a procedure, and nobody has run them as a procedure.** Daedalus's four tests assert
 *    the text — order, direction, quoting, prose. His own negative control found one of them grepping for
 *    a phrase anywhere rather than anchoring it. The endpoint question is different: paste step 2 and
 *    step 3 into a shell, verbatim, and does the database come back? Arm Q runs them through `/bin/sh`
 *    on a path with a space and an apostrophe in it, which is the case `shellQuote()` exists for.
 *
 * 2. **H is stated as "the app was used", and the only number ever driven is 1500 messages.** Round 191
 *    chose 1500 to cross SQLite's 1000-page autocheckpoint, because before Round 192 that was the only
 *    way to get frames into the WAL *on top of* a main file that already held the run. After Round 192
 *    the checkpoint puts the run in the main file at the apply's exit — so that condition is now reached
 *    by any write at all. Arm B drives 1 message and 20 messages.
 *
 * PREDICTIONS, written before the first run (Round 192's commit says "H1 is unchanged", and my reading
 * is that H is now much wider than the 1500 that found it):
 * - **Q passes.** The steps execute, `shellQuote` survives the apostrophe, and step 4's `Candidates:`
 *   line matches the one from before the apply.
 * - **B1 (one message) already fails a naive `cp`**: the main file is the post-run state at apply exit,
 *   one insert puts frames on top of it, and `cp` leaves them beside a pre-run file. Whether that reads
 *   as NEITHER or as malformed I do not predict — 1554 messages' worth of frames produced malformed;
 *   one message's worth may land on pages the backup also has, and silently lie instead.
 * - **B20 the same**, and the two may differ from each other.
 * - **W1 prints the note** (a non-zero `-wal` before an apply). **W2, the negative control on a
 *   freshly checkpointed solo fixture, prints nothing.**
 * - **N (measured only):** step 4's own dry run takes no checkpoint — `checkpointAfterWrite()` is on the
 *   apply and undo paths only — so it leaves a WAL on the file it just verified.
 *
 * Substitution, stated, and unchanged from Round 191: the second connection is the server's `getDb()`
 * module under `tsx watch`, not the Hono process under `concurrently`. The server hardcodes port 3001
 * (`index.ts:48`) and loads `.env` with `override: true` (`:17`), so a real one here could collide with
 * xian's and could lose a scratch `KLATCH_DB` to a file this probe does not read.
 *
 * Zero model calls. `klatch.db` is never opened: fixtures live in `.testdata/r193/` (gitignored).
 *
 *   npx tsx scripts/probe-round193-the-printed-steps-run-as-written-and-how-little-use-reopens-h.mts
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
const DATA = path.join(ROOT, '.testdata', 'r193');
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
/** The rows undo writes, hashed, and counts to read. Same view as Round 191, so hashes compare across. */
function viewOf(db: any): View {
  let integrity: string;
  try {
    const lines = (db.pragma('integrity_check') as { integrity_check: string }[]).flatMap((r) =>
      r.integrity_check.split('\n')
    );
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
if (process.env.R193_ROLE === 'holder') {
  // The dev server's connection: `getDb()`, opened once, never closed. Commands arrive as files,
  // because `tsx watch` owns stdin.
  const { getDb } = await import('../packages/server/src/db/index.js');
  const q = await import('../packages/server/src/db/queries.js');
  const db = getDb();
  db.prepare('SELECT COUNT(*) AS n FROM channels').get();
  const dir = process.env.R193_DIR!;
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
      else if (cmd.startsWith('burst ')) {
        // The app in use: a new chat, then user messages the way POST /messages inserts them
        // (`routes/messages.ts:101`), each its own transaction.
        const n = Number(cmd.slice('burst '.length));
        const ch = q.createChannel('r193 in use', '');
        const body = 'lorem ipsum '.repeat(290);
        for (let i = 0; i < n; i++) q.insertMessage(ch.id, 'user', `${i} ${body}`, 'complete');
        reply = JSON.stringify({
          inserted: n,
          bytesEach: body.length,
          autocheckpoint: db.pragma('wal_autocheckpoint', { simple: true }),
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
/** What `klatch.db` holds by itself: a copy with no sidecars. `view()` reads the file *with* its WAL. */
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

/**
 * Round 176's fixture, checkpointed after building so the main file holds all of it and the WAL none,
 * as in a long-lived database. `dirName` may contain a space and an apostrophe (arm Q).
 */
function build(dirName: string): { dir: string; db: string } {
  const dir = path.join(DATA, dirName);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });
  const db = path.join(dir, 'klatch.db');
  execFileSync('npx', ['tsx', R176], { cwd: ROOT, env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: db }, stdio: 'ignore' });
  const w = new Database(db, { fileMustExist: true });
  w.pragma('wal_checkpoint(TRUNCATE)');
  w.close();
  const s = sides(db);
  if (s.wal !== 'absent' && s.wal !== 0) throw new Error(`fixture ${dirName} not checkpointed: ${JSON.stringify(s)}`);
  if (typeof s.db !== 'number' || s.db <= 4096) throw new Error(`fixture ${dirName} main file holds nothing: ${JSON.stringify(s)}`);
  return { dir, db };
}

function cli(args: string[]) {
  const r = spawnSync('npx', ['tsx', CLI, ...args], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, R193_ROLE: '' } });
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
/** The numbered lines of `restoreInstructions()`, as printed. Only the prefix is relied on. */
function printedSteps(out: string): Record<string, string> {
  const steps: Record<string, string> = {};
  for (const m of out.matchAll(/^ {2}([1-4])\. (.*)$/gm)) if (!(m[1] in steps)) steps[m[1]] = m[2];
  return steps;
}
/** Run a line the operator would paste, exactly as printed, through a real shell. */
function paste(line: string) {
  const r = spawnSync('/bin/sh', ['-c', line], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status ?? -1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}

interface Holder {
  proc: ChildProcess;
  dir: string;
  innerPid: number;
}
const holders: Holder[] = [];
async function startHolder(dir: string, db: string): Promise<Holder> {
  const proc = spawn(TSX, ['watch', SELF], {
    cwd: ROOT,
    env: { ...process.env, R193_ROLE: 'holder', R193_DIR: dir, KLATCH_DB: db },
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
/** Ctrl-C: SIGINT to the group, the way a terminal does it. */
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

console.log('\n=== Round 193 — the printed steps run as written, and how little use re-opens H ===\n');
fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });

// ── Arm Q — the four steps, pasted into a shell, on a path that needs quoting ──
console.log("Arm Q — the printed steps executed verbatim, on a path with a space and an apostrophe");
{
  const q = build("q it's here");
  const dryBefore = cli([q.db]);
  const before = candidatesLine(dryBefore.out);
  const h = await startHolder(q.dir, q.db);
  const a = apply(q.db);
  const post = view(q.db);
  const backup = view(a.backup);
  check(
    'Q0',
    "setup: the apply runs to exit 0 on a path containing a space and an apostrophe, with the app's connection open",
    a.code === 0 && !!a.backup && !!a.record && post.hash !== backup.hash && backup.integrity === 'ok' && q.db.includes("'") && q.db.includes(' '),
    `path ${q.db} · exit ${a.code} · post-run ${brief(post)} · backup ${brief(backup)} · sidecars after apply ${JSON.stringify(sides(q.db))}`
  );

  const steps = printedSteps(a.out);
  check(
    'Q1',
    'the apply prints all four restore steps, with step 2 deleting the sidecars before step 3 copies, and step 3 copying backup → database',
    Object.keys(steps).length === 4 &&
      /^rm -f /.test(steps['2'] ?? '') &&
      (steps['2'] ?? '').includes('-wal') &&
      (steps['2'] ?? '').includes('-shm') &&
      /^cp /.test(steps['3'] ?? '') &&
      !(steps['1'] ?? '').includes('cp ') &&
      a.out.indexOf('  2. ') < a.out.indexOf('  3. '),
    `steps printed: ${JSON.stringify(steps)}`
  );

  const stop = await ctrlC(h);
  const r2 = paste(steps['2'] ?? 'false');
  const r3 = paste(steps['3'] ?? 'false');
  check(
    'Q2',
    'steps 2 and 3 run in a real shell, exactly as printed, without error — the quoting survives the apostrophe',
    r2.code === 0 && r3.code === 0,
    `step 1 (${steps['1']}) done as Ctrl-C: ${stop.exit}, forced ${stop.forced} · step 2 exit ${r2.code} ${JSON.stringify(r2.out.slice(0, 200))} · step 3 exit ${r3.code} ${JSON.stringify(r3.out.slice(0, 200))}`
  );

  const restored = view(q.db);
  check(
    'Q3',
    'after the printed steps, the database is the backup, row for row',
    restored.hash === backup.hash && restored.integrity === 'ok',
    `after the steps: ${brief(restored)} · sidecars ${JSON.stringify(sides(q.db))}`
  );

  const dryAfter = cli([q.db]);
  const after = candidatesLine(dryAfter.out);
  check(
    'Q4',
    "step 4's own test passes: re-running with no flags prints the same Candidates: line as before the apply",
    after === before && after !== '(no Candidates line)',
    `before the apply: ${JSON.stringify(before)} · after the steps: ${JSON.stringify(after)} · dry run exit ${dryAfter.code}`
  );

  // ── Arm N — what step 4 itself leaves behind ────────────────────────────────
  measure(
    `N: step 4 is a dry run, and the dry run takes no checkpoint (checkpointAfterWrite() is on the apply ` +
      `and undo paths only). After it the sidecars are ${JSON.stringify(sides(q.db))}, and klatch.db by itself reads ` +
      `${mainOnly(q.db).hash === backup.hash ? 'the backup' : 'NOT the backup'}.`
  );
}

// ── Arm B — how little app use re-opens H ─────────────────────────────────────
for (const n of [1, 20]) {
  console.log(`\nArm B${n} — the app writes ${n} message${n === 1 ? '' : 's'} after the apply, then the naive cp`);
  const b = build(`b${n}`);
  const h = await startHolder(b.dir, b.db);
  const a = apply(b.db);
  const walAfterApply = sides(b.db).wal;
  const post = view(b.db);
  const backup = view(a.backup);
  const mainAfterApply = mainOnly(b.db);
  const burst = await ask(h, `burst ${n}`);
  const used = await ask(h, 'view');
  const stop = await ctrlC(h);
  const afterStop = sides(b.db);
  check(
    `B${n}0`,
    `setup: the apply exits 0 with the connection open and Round 192's checkpoint leaves -wal at 0; the app then writes ${n}`,
    a.code === 0 && !!a.backup && !!a.record && post.hash !== backup.hash && walAfterApply === 0 &&
      mainAfterApply.hash === post.hash && burst.inserted === n && !stop.forced,
    `apply exit ${a.code} · -wal after the apply ${walAfterApply} · klatch.db by itself after the apply is ` +
      `${mainAfterApply.hash === post.hash ? 'the POST-RUN state' : 'NOT the post-run state'} · writes ${JSON.stringify(burst)} · ` +
      `the connection then reads ${brief(used)} · Ctrl-C: ${stop.exit}, forced ${stop.forced} · sidecars after stop ${JSON.stringify(afterStop)}`
  );

  fs.copyFileSync(a.backup, b.db);
  const restored = view(b.db);
  const restoredMain = mainOnly(b.db);
  const name =
    restored.hash === backup.hash ? 'the backup' : restored.hash === post.hash ? 'the POST-RUN state' : restored.hash === used.hash ? 'the state cp replaced' : 'NEITHER';
  if (restored.hash === backup.hash && restored.integrity === 'ok') {
    check(`B${n}1`, `after ${n} message${n === 1 ? '' : 's'} of app use, the naive cp still gives back the backup`, true, `after cp: ${brief(restored)}`);
  } else {
    open_(
      `B${n}1`,
      `${n} message${n === 1 ? '' : 's'} of app use after the apply is enough to make the naive cp not give back the backup`,
      `after cp the app would read ${name}: ${brief(restored)}. klatch.db by itself is ` +
        `${restoredMain.hash === backup.hash ? 'the backup' : 'NOT the backup'} (${brief(restoredMain)}); beside it klatch.db-wal is ` +
        `${sides(b.db).wal} bytes. The state cp replaced: ${brief(used)}.`
    );
  }

  const dry = cli([b.db]);
  measure(`B${n}: the dry run on that file exits ${dry.code} and prints: ${candidatesLine(dry.out)}`);

  // The control, on the same file: the printed steps still recover it.
  const steps = printedSteps(a.out);
  const c2 = paste(steps['2'] ?? 'false');
  const c3 = paste(steps['3'] ?? 'false');
  const recovered = view(b.db);
  check(
    `B${n}2`,
    `from that state, the printed steps (delete both sidecars, then cp) still give back the backup, row for row`,
    c2.code === 0 && c3.code === 0 && recovered.hash === backup.hash && recovered.integrity === 'ok',
    `step 2 exit ${c2.code} · step 3 exit ${c3.code} · after: ${brief(recovered)} · the backup file is untouched: ${view(a.backup).hash === backup.hash}`
  );
}

// ── Arm W — the WAL note, and its negative control ────────────────────────────
console.log('\nArm W — the non-empty -wal note, and a control where it must not print');
{
  const NOTE = /^Note: .*-wal is [\d,]+ bytes/m;
  // W1: a database with uncheckpointed writes beside it, the way the dev server leaves one.
  const w = build('w');
  const h = await startHolder(w.dir, w.db);
  const burst = await ask(h, 'burst 20');
  const walBefore = sides(w.db).wal;
  const a = apply(w.db);
  const noted = NOTE.exec(a.out)?.[0] ?? '';
  check(
    'W1',
    'with a non-empty -wal beside the database, the apply reports it, with the byte count, and runs anyway',
    !!noted && a.code === 0 && typeof walBefore === 'number' && walBefore > 0 && noted.includes(walBefore.toLocaleString()),
    `-wal before the apply ${walBefore} bytes · note: ${JSON.stringify(noted)} · apply exit ${a.code}`
  );
  await ctrlC(h);

  // W2: the negative control. A freshly checkpointed fixture, no other connection: no note.
  const w2 = build('w2');
  const before2 = sides(w2.db);
  const a2 = apply(w2.db);
  check(
    'W2',
    'negative control: on a database with no uncheckpointed writes and nothing holding it open, the note does not print',
    !NOTE.test(a2.out) && a2.code === 0,
    `sidecars before ${JSON.stringify(before2)} · apply exit ${a2.code} · note found: ${JSON.stringify(NOTE.exec(a2.out)?.[0] ?? null)}`
  );
  measure(`W: the note this round matches is ${NOTE.source}; W1's full note block is ${JSON.stringify(a.out.split('\n').filter((l) => l.startsWith('Note:') || l.startsWith('  ')).slice(0, 5))}`);
}

// ── Arm Z — this probe changed no product file ────────────────────────────────
{
  const dirty = spawnSync('git', ['status', '--porcelain', '--', 'packages', 'scripts/backfill-entity-bindings.mts'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).stdout.trim();
  check('Z', 'no product or CLI file differs from HEAD', dirty === '', dirty === '' ? 'clean' : dirty);
}

// ── summary ───────────────────────────────────────────────────────────────────
const failed = checks.filter((c) => c.ok === false);
const open = checks.filter((c) => c.ok === 'open');
console.log('\n' + '='.repeat(78));
console.log(`${checks.length} checks · ${failed.length} failed · ${open.length} open · ${measurements.length} measurements`);
if (failed.length) {
  console.log('\nFAILED:');
  for (const c of failed) console.log(`  ${c.arm} · ${c.name}\n    ${c.detail}`);
}
if (open.length) {
  console.log('\nOPEN:');
  for (const c of open) console.log(`  ${c.arm} · ${c.name}`);
}
console.log('='.repeat(78));
process.exit(failed.length ? 1 : 0);
