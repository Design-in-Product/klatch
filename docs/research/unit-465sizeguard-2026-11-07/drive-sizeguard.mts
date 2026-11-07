/**
 * unit-465sizeguard driver — does the `wal === 0` size test at the sidecar cleanup
 * site do anything, in the one state it was written for?
 *
 * The 2x2 of PRE-REGISTRATION §3: R = a second connection commits frames inside
 * the tool's open→close window and stays open; C = the size test removed
 * (`KLATCH_U465SG_C1=1`, env-gated in the product source for this unit only).
 *
 *   cell 1 — R off, C off      cell 4 — R off, C on
 *   cell 2 — R on,  C off      cell 3 — R on,  C on
 *   cell 5 — R on,  C off, probe-sized fixture (no padding)   → P7, ungradeable
 *   cell 6 — R on,  C on,  500 pad rows, 10 repeats           → P11
 *   cell 7 — R on,  C on,  no padding, 10 repeats             → P7, graded
 *
 * Two instrument rules this driver obeys because they were paid for elsewhere:
 *
 *  - **`spawn`, and the child's streams are echoed into the recording.** Daedalus's
 *    `unit-465armd` §4 lost a cripple's report twice over — `execFileSync` exposes
 *    stderr only through the thrown error, so a run exiting 0 drops it, and the
 *    probe captures both streams into a local it never echoes. Nothing here is
 *    observed through a stream the recording cannot see.
 *  - **An empty sentinel is reported as "cannot say", never as "did not fire".**
 *    That exact inversion was his defect 3, false on every drive of one arm. The
 *    cripple reports through a pid-scoped file; if the file is empty this driver
 *    says so and refuses to characterise it.
 */
import { spawn } from 'child_process';
import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { applySchema } from '../../../packages/server/src/db/index.js';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const TOOL = path.join(REPO, 'scripts/backfill-entity-bindings.mts');
const cell = String(process.argv[2] ?? '');

type Cell = { race: boolean; cripple: boolean; pad: number; reps: number };
const CELLS: Record<string, Cell> = {
  '1': { race: false, cripple: false, pad: 2000, reps: 1 },
  '2': { race: true, cripple: false, pad: 2000, reps: 1 },
  '3': { race: true, cripple: true, pad: 2000, reps: 1 },
  '4': { race: false, cripple: true, pad: 2000, reps: 1 },
  '5': { race: true, cripple: false, pad: 0, reps: 1 },
  '6': { race: true, cripple: true, pad: 500, reps: 10 },
  // Cell 7 repairs a defect in my own registration. P7 was keyed on cell 5, which
  // is R=on **C=off** — the exact cell PRE-REGISTRATION §6 says cannot prove the
  // window was open, because a commit landing after the cleanup leaves the same
  // non-zero `-wal` behind. So cell 5 recorded `window OPEN` off `commitAt > 0`,
  // which is bookkeeping, not evidence. Only a crippled cell can grade it, and
  // this is that cell at the probe's own fixture size. Added after cells 1–5 were
  // driven and before 6 and 7 were; the drive numbering and RESULTS §5 say so.
  '7': { race: true, cripple: true, pad: 0, reps: 10 },
};
if (!CELLS[cell]) {
  console.error(`usage: drive-sizeguard.mts <${Object.keys(CELLS).join('|')}>`);
  process.exit(2);
}
const C = CELLS[cell];

/**
 * A seeded WAL database with **no sidecars on disk** — the probe's own starting
 * state, padded so the tool's `backup()` leg is long enough to be raced. `pad = 0`
 * is the probe's fixture size exactly, which is what cell 5 exists to price.
 */
function build(pad: number): string {
  const p = path.join(os.tmpdir(), `u465sg-${randomUUID()}.db`);
  const db = new Database(p);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applySchema(db);
  db.prepare(
    `INSERT INTO channels (id,name,system_prompt,source) VALUES ('ch','unbound','','claude-code')`
  ).run();
  db.prepare(
    `INSERT INTO messages (id,channel_id,role,content,status) VALUES ('m','ch','user','hi','complete')`
  ).run();
  db.prepare(
    `INSERT INTO message_artifacts (id,message_id,type,file_name,file_mime_type,file_size_bytes,file_storage_key)
     VALUES ('a','m','file','a.txt','text/plain',3,'storage/a.txt')`
  ).run();
  if (pad > 0) {
    const blob = 'x'.repeat(32 * 1024);
    const ins = db.prepare(
      `INSERT INTO messages (id,channel_id,role,content,status) VALUES (?, 'ch','user',?,'complete')`
    );
    db.transaction(() => {
      for (let i = 0; i < pad; i++) ins.run(`pad-${i}`, blob);
    })();
  }
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  for (const s of ['-wal', '-shm'] as const) fs.rmSync(p + s, { force: true });
  return p;
}

const side = (p: string, s: '-wal' | '-shm') =>
  fs.existsSync(p + s) ? `${s}:${fs.statSync(p + s).size}B` : `${s}:absent`;

/** What a third party opening the file afterwards can actually read. */
function racerRowVisible(p: string): string {
  let d: Database.Database | undefined;
  try {
    d = new Database(p, { readonly: true, fileMustExist: true });
    const n = (
      d.prepare(`select count(*) as n from channels where id = 'racer'`).get() as { n: number }
    ).n;
    return n === 1 ? 'visible' : n === 0 ? 'GONE' : `n=${n}`;
  } catch (err) {
    return `open failed: ${(err as Error).message}`;
  } finally {
    try {
      d?.close();
    } catch {
      /* a handle that will not close does not change the verdict above */
    }
  }
}

async function one(rep: number): Promise<{ windowOpen: boolean; line: string }> {
  const p = build(C.pad);
  const dbBytes = fs.statSync(p).size;
  const sentinel = path.join(os.tmpdir(), `u465sg-sentinel-${process.pid}-${cell}-${rep}.txt`);
  fs.rmSync(sentinel, { force: true });

  const t0 = Date.now();
  let walSeenAt = -1;
  let commitAt = -1;
  let exitAt = -1;
  let racerWalBytes = -1;
  let racer: Database.Database | undefined;

  const child = spawn('npx', ['tsx', TOOL, p, '--apply', '--no-migrate'], {
    cwd: REPO,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ...(C.cripple ? { KLATCH_U465SG_C1: '1', KLATCH_U465SG_SENTINEL: sentinel } : {}),
    },
  });
  let out = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (out += d));
  const exited = new Promise<number>((res) =>
    child.on('exit', (c) => {
      exitAt = Date.now();
      res(c ?? -1);
    })
  );

  if (C.race) {
    // Wait for the tool's **own** `-wal` to appear. It cannot pre-exist — `build()`
    // removed both sidecars — so its appearance is the one filesystem-visible proof
    // that `sidecarsBefore` was captured with `-wal` absent. It is NOT proof that
    // the cleanup has not already run; see PRE-REGISTRATION §6, and cell 3.
    while (walSeenAt < 0) {
      if (fs.existsSync(p + '-wal')) {
        walSeenAt = Date.now();
        break;
      }
      if (exitAt > 0) break;
      await new Promise((r) => setTimeout(r, 2));
    }
    if (walSeenAt > 0) {
      racer = new Database(p);
      racer.pragma('wal_autocheckpoint = 0');
      racer.prepare(
        `INSERT INTO channels (id,name,system_prompt,source) VALUES ('racer','racer','','claude-code')`
      ).run();
      commitAt = Date.now();
      racerWalBytes = fs.existsSync(p + '-wal') ? fs.statSync(p + '-wal').size : -1;
    }
  }

  const code = await exited;
  const walAfter = side(p, '-wal');
  const shmAfter = side(p, '-shm');
  const seenWhileOpen = racerRowVisible(p);
  let seenAfterClose = '(racer never opened)';
  if (racer) {
    try {
      racer.close();
    } catch (err) {
      seenAfterClose = `racer close threw: ${(err as Error).message}; `;
    }
    seenAfterClose = (seenAfterClose.endsWith('; ') ? seenAfterClose : '') + racerRowVisible(p);
  }

  const sentinelText = fs.existsSync(sentinel) ? fs.readFileSync(sentinel, 'utf8').trim() : '';
  const destroyed = /destroyed (\d+)B/.exec(sentinelText);
  const sentinelSays = !C.cripple
    ? '(no cripple in this cell)'
    : sentinelText === ''
      ? 'SENTINEL EMPTY — cannot say whether the cripple fired'
      : sentinelText;

  // Window-open is keyed on what the cripple **destroyed**, not on having seen the
  // `-wal`. In a crippled cell a commit that landed after the cleanup leaves
  // nothing to destroy, which is exactly how a vacuous green announces itself.
  const windowOpen = C.cripple ? destroyed !== null && Number(destroyed[1]) > 0 : commitAt > 0;

  if (rep === 1 || C.reps === 1) {
    console.log(`db bytes:             ${dbBytes.toLocaleString()}`);
    console.log(`race / cripple:       ${C.race ? 'ON' : 'off'} / ${C.cripple ? 'ON' : 'off'}`);
  }
  const line =
    `rep ${rep}: exit ${code}` +
    `  -wal appeared +${walSeenAt > 0 ? walSeenAt - t0 : -1}ms` +
    `  commit +${commitAt > 0 ? commitAt - t0 : -1}ms (${racerWalBytes}B)` +
    `  child exit +${exitAt - t0}ms` +
    `  after ${walAfter} ${shmAfter}` +
    `  racer-row(open) ${seenWhileOpen}` +
    `  racer-row(closed) ${seenAfterClose}` +
    `  refusal-line ${/Refusing to run: --no-migrate/.test(out)}` +
    `  unreadable-line ${/is not a database|could not be read/.test(out)}` +
    `  sentinel ${JSON.stringify(sentinelSays)}` +
    `  window ${windowOpen ? 'OPEN' : 'not-open'}`;
  console.log(line);

  for (const s of ['', '-wal', '-shm'] as const) fs.rmSync(p + s, { force: true });
  for (const f of fs.readdirSync(os.tmpdir())) {
    if (f.startsWith(path.basename(p))) fs.rmSync(path.join(os.tmpdir(), f), { force: true });
  }
  fs.rmSync(sentinel, { force: true });
  return { windowOpen, line };
}

console.log(`unit-465sizeguard drive cell ${cell}`);
let open = 0;
for (let rep = 1; rep <= C.reps; rep++) {
  const r = await one(rep);
  if (r.windowOpen) open++;
}
if (C.reps > 1) console.log(`WINDOW OPEN: ${open}/${C.reps}`);
console.log(`DRIVE ${cell} DONE`);
