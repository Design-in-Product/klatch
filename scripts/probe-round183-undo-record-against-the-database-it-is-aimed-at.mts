/**
 * Round 183 — the undo record is a record. Is it a record of *this* database, now?
 *
 * Rounds 179–182 closed every way an operator's *argument* could go unread, and
 * Round 180's `checkUndoRecord` refuses every file that is not shaped like a
 * record. What neither can see is the everyday mis-aim that *is* a record: an
 * older one, or one from another database. Records accumulate beside the DB as
 * `klatch.db.backfill-<ISO stamp>.json`, so tab completion and `ls` list them
 * oldest first; the approve-off-the-sheet workflow produces more than one; and
 * `--undo` is the one mode that writes without `--apply` (Daedalus flagged that
 * asymmetry himself in his Round 182 memo and left it as a design question).
 *
 * `undoEntityBackfill` (`entity-backfill.ts:554`) reads no current state before
 * it writes: per channel it re-binds `fromEntityId`, unbinds `toEntityId`, and
 * re-stamps the recorded message ids, whatever those rows say now. So the
 * organising question:
 *
 *   **When the record no longer describes the database, does undo notice?**
 *
 * Arm A — a stale record after a re-apply (the tab-completion order).
 * Arm B — the user re-seated the channel in the app after the run.
 * Arm C — a record written against a different database.
 * Arm D — what undo *reports* against what it did.
 * Arm Q — four edges of Round 182's parse rule it was not aimed at.
 *
 * Same discipline as Rounds 176/179/181: the real script as a real subprocess
 * against a real file-backed DB built by Round 176's builder, verified through
 * this probe's own read-only handle in raw SQL. The one exception is arm B's
 * re-seat, which has to be the app's own write — it runs the real
 * `assignEntityToChannel` / `removeEntityFromChannel` in a subprocess, behind the
 * route's own two guards. Zero model calls. `klatch.db` is never opened — fixtures
 * live in `.testdata/r183/` (gitignored).
 *
 *   npx tsx scripts/probe-round183-undo-record-against-the-database-it-is-aimed-at.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SELF = fileURLToPath(import.meta.url);
const DATA = path.join(ROOT, '.testdata', 'r183');
const DB = path.join(DATA, 'klatch.db');
const PRISTINE = path.join(DATA, 'pristine.db');
const OTHER_DIR = path.join(DATA, 'other');
const OTHER = path.join(OTHER_DIR, 'klatch.db');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

const DEFAULT_ENTITY_ID = 'default-entity';

// ── self-spawned role: a re-seat, done the way the app does it ────────────────
// The two route guards, in the route's order (`routes/entities.ts:213` for the
// cap on add, the DELETE handler's last-entity guard for remove), then the same
// query functions the route calls.
if (process.env.R183_ROLE === 'reseat') {
  const q = await import('../packages/server/src/db/queries.js');
  const ch = process.env.R183_CHANNEL!;
  const from = process.env.R183_FROM!;
  const kestrel = q.createEntity('Kestrel', 'claude-opus-5', '', '#3366aa');
  if (q.getChannelEntityCount(ch) >= 5) throw new Error('route would refuse: cap');
  q.assignEntityToChannel(ch, kestrel.id);
  if (q.getChannelEntityCount(ch) <= 1) throw new Error('route would refuse: last entity');
  const removed = q.removeEntityFromChannel(ch, from);
  console.log(JSON.stringify({ kestrelId: kestrel.id, removed }));
  process.exit(0);
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

function cli(args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync('npx', ['tsx', CLI, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, R176_ROLE: '', R183_ROLE: '' },
  });
  return { code: r.status ?? -1, out: r.stdout ?? '', err: r.stderr ?? '' };
}

// The same script through tsx's own binary, with no npx in front. Needed for
// exactly one input class: npm's argument parser refuses a token that starts
// with a non-ASCII dash before the script ever runs (first pass of this probe
// scored npx's refusal as the CLI's). Both are measured; only this one measures
// the script's rule.
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');
function cliDirect(args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync(TSX_BIN, [CLI, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, R176_ROLE: '', R183_ROLE: '' },
  });
  return { code: r.status ?? -1, out: r.stdout ?? '', err: r.stderr ?? '' };
}

const sha = (f: string) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
// tsx's own DeprecationWarning lands on stderr under this Node; it is not the CLI.
const cliLines = (s: string) =>
  s.split('\n').map((l) => l.trim()).filter((l) => l && !/DeprecationWarning|--trace-deprecation/.test(l));
const firstLine = (s: string) => (cliLines(s)[0] ?? '').slice(0, 96);
const backupsIn = (dir: string) =>
  fs.readdirSync(dir).filter((f) => f.startsWith('klatch.db.backup-backfill-'));
const recordsIn = (dir: string) =>
  fs.readdirSync(dir).filter((f) => /^klatch\.db\.backfill-.*\.json$/.test(f)).sort();

function ro<T>(file: string, fn: (db: any) => T): T {
  const db = new Database(file, { readonly: true, fileMustExist: true });
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

const stillOnDefault = (file = DB): number =>
  ro(file, (db) =>
    (db
      .prepare(
        `SELECT COUNT(*) AS n FROM channels c JOIN channel_entities ce ON ce.channel_id = c.id
          WHERE ce.entity_id = ? AND c.source IN ('claude-code','claude-ai')`
      )
      .get(DEFAULT_ENTITY_ID) as { n: number }).n
  );
// Same ORDER BY as `getChannelEntities` (`queries.ts:480`), so this is the order
// the app shows.
const roster = (ch: string): string[] =>
  ro(DB, (db) =>
    (db
      .prepare(
        `SELECT ce.entity_id AS id, COALESCE(e.name, '(no entity row)') AS name
           FROM channel_entities ce LEFT JOIN entities e ON e.id = ce.entity_id
          WHERE ce.channel_id = ? ORDER BY ce.added_at ASC, ce.rowid ASC`
      )
      .all(ch) as { id: string; name: string }[]).map((r) => (r.id === DEFAULT_ENTITY_ID ? 'default' : r.name))
  );
const rosterIds = (ch: string): string[] =>
  ro(DB, (db) =>
    (db
      .prepare('SELECT entity_id FROM channel_entities WHERE channel_id = ? ORDER BY added_at ASC, rowid ASC')
      .all(ch) as { entity_id: string }[]).map((r) => r.entity_id)
  );
const stamps = (ch: string): (string | null)[] =>
  ro(DB, (db) =>
    (db
      .prepare(`SELECT entity_id FROM messages WHERE channel_id = ? AND role = 'assistant' ORDER BY rowid`)
      .all(ch) as { entity_id: string | null }[]).map((r) => r.entity_id)
  );
const entityIds = (): string[] =>
  ro(DB, (db) => (db.prepare('SELECT id FROM entities ORDER BY id').all() as { id: string }[]).map((r) => r.id));
const orphanBindings = (): number =>
  ro(DB, (db) =>
    (db
      .prepare('SELECT COUNT(*) AS n FROM channel_entities WHERE channel_id NOT IN (SELECT id FROM channels)')
      .get() as { n: number }).n
  );
function dump(file: string, withAddedAt = false): string {
  return ro(file, (db) =>
    [
      ...(db.prepare('SELECT id, entity_id FROM messages ORDER BY id').all() as object[]).map((r) => 'm ' + JSON.stringify(r)),
      ...(db
        .prepare(`SELECT channel_id, entity_id${withAddedAt ? ', added_at' : ''} FROM channel_entities ORDER BY channel_id, entity_id`)
        .all() as object[]).map((r) => 'ce ' + JSON.stringify(r)),
      ...(db.prepare('SELECT id, name FROM entities ORDER BY id').all() as object[]).map((r) => 'e ' + JSON.stringify(r)),
    ].join('\n')
  );
}

async function copyDb(from: string, to: string): Promise<void> {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(to + s, { force: true });
  const src = new Database(from, { readonly: true, fileMustExist: true });
  await src.backup(to);
  src.close();
}
async function restorePristine(): Promise<void> {
  await copyDb(PRISTINE, DB);
  for (const f of [...backupsIn(DATA), ...recordsIn(DATA)]) fs.rmSync(path.join(DATA, f), { force: true });
}
function build(file: string): Record<string, string> {
  execFileSync('npx', ['tsx', R176], {
    cwd: ROOT,
    env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: file },
    stdio: 'ignore',
  });
  return JSON.parse(fs.readFileSync(path.join(ROOT, '.testdata', 'r176', 'seeded.json'), 'utf8'));
}

const reverted = (out: string) => Number(/Reverted (\d+) channel/.exec(out)?.[1] ?? NaN);
const claimedRemoved = (out: string) => Number(/Agents removed: (\d+)/.exec(out)?.[1] ?? NaN);
const recordFrom = (out: string) => /^Undo record: (.+)$/m.exec(out)?.[1] ?? '';
const backupFrom = (out: string) => /^Backup \(taken before anything was written\): (.+)$/m.exec(out)?.[1] ?? '';
const FILTERED = /Candidates: (\d+) of (\d+) in scope matched your --channels filter/;
const UNFILTERED = /Candidates: (\d+) — (\d+) would move/;
const planned = (out: string) => FILTERED.test(out) || UNFILTERED.test(out);
const same = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);

// ── fixture ───────────────────────────────────────────────────────────────────

console.log('\n=== Round 183 — the undo record, against the database it is aimed at ===\n');
fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(OTHER_DIR, { recursive: true });
fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });

const seeded = build(DB);
await copyDb(DB, PRISTINE);
const W = seeded['wren'];
const inScope = stillOnDefault();
const pristineEntities = entityIds();
const pristineDump = dump(DB);
measure(`fixture: ${inScope} in-scope channels on the default, ${pristineEntities.length} entity rows; wren=${W.slice(0, 8)}…`);

// ── Arm A — a stale record after a re-apply ──────────────────────────────────
// The sequence an operator approving in batches produces: apply everything,
// change their mind and undo, re-apply just the one they are sure of, then
// decide to undo *that* — and tab-complete to the first record listed.
console.log('\nArm A — the older record, aimed at a database that has moved past it');
await restorePristine();
const aApply1 = cli([DB, '--apply']);
const recA = recordFrom(aApply1.out);
const wrenEntA = rosterIds(W)[0];
const aUndo1 = cli([DB, `--undo=${recA}`]);
const aApply2 = cli([DB, '--apply', `--channels=${W}`]);
const recB = recordFrom(aApply2.out);
const wrenEntB = rosterIds(W)[0];
check(
  'A0',
  'setup: apply (4) → undo → apply --channels=<wren> (1), two records beside the DB',
  aApply1.code === 0 && aUndo1.code === 0 && aApply2.code === 0 && !!recA && !!recB &&
    recordsIn(DATA).length === 2 && inScope - stillOnDefault() === 1,
  `exits ${aApply1.code}/${aUndo1.code}/${aApply2.code} · ${recordsIn(DATA).length} records · ${inScope - stillOnDefault()} moved now`
);
measure(
  `the second apply ${wrenEntB === wrenEntA ? 'REUSED' : 're-minted'} Wren: ${wrenEntA.slice(0, 8)}… then ${wrenEntB.slice(0, 8)}… ` +
    `(undo deleted the first; resolveImportEntity matches by name, so there was nothing to match)`
);
const listed = recordsIn(DATA);
measure(
  `records as \`ls\` and tab completion list them: ${listed.map((f) => (path.join(DATA, f) === recA ? 'A (older)' : 'B (newer)')).join(', ')}`
);

const aEntBefore = entityIds();
const aStampsBefore = stamps(W);
const aStale = cli([DB, `--undo=${recA}`]);
const aEntAfter = entityIds();
const aActuallyRemoved = aEntBefore.filter((id) => !aEntAfter.includes(id)).length;
const aRoster = roster(W);
const aStamps = stamps(W);
const leftBAlone = same(rosterIds(W), [wrenEntB]) && same(aStamps, aStampsBefore);
const label = (s: string | null) =>
  s === null ? 'NULL' : s === DEFAULT_ENTITY_ID ? 'default' : s === wrenEntB ? 'WrenB' : s === wrenEntA ? 'WrenA' : s.slice(0, 8);
if (aStale.code !== 0 || leftBAlone) {
  check('A1', 'an undo aimed at a record the database has moved past does not rewrite the newer run',
    true, `exit ${aStale.code} · wren roster ${JSON.stringify(aRoster)}`);
} else {
  const stillB = aStamps.filter((s) => s === wrenEntB).length;
  open_(
    'A1',
    'the older record, undone after a re-apply, half-reverts the newer run and reports success, exit 0',
    `\`--undo=<A>\` on a database where wren had been re-applied under record B, exit ${aStale.code}. Everything the CLI printed: ${JSON.stringify(
      [...cliLines(aStale.out), ...cliLines(aStale.err)].map((l) => l.replace(DATA, '…'))
    )}. The wren channel (a chat) now has roster ${JSON.stringify(aRoster)}, and the seated Wren is ${
      rosterIds(W).includes(wrenEntB) ? "B's" : 'NOT B\'s'
    } — the placeholder re-bound *beside* it, because \`unbind\` targets A's Wren id, which no longer exists, and \`bind\` is INSERT OR IGNORE. Its ${
      aStamps.length
    } assistant rows went ${JSON.stringify(aStampsBefore.map(label))} → ${JSON.stringify(aStamps.map(label))} (${stillB} still WrenB), so B's Wren is seated on a chat whose transcript no longer belongs to it. Neither before-A, after-A, before-B nor after-B.`
  );
}
if (claimedRemoved(aStale.out) === aActuallyRemoved) {
  check('A2', '"Agents removed: N" is the number of agent rows the run deleted', true, `claimed ${claimedRemoved(aStale.out)}, deleted ${aActuallyRemoved}`);
} else {
  open_(
    'A2',
    '"Agents removed" counts agents it was told about, not agents it deleted',
    `Claimed **${claimedRemoved(aStale.out)}**, deleted **${aActuallyRemoved}** (entity rows ${aEntBefore.length} → ${aEntAfter.length}). \`entitiesRemoved.push(id)\` follows a \`DELETE\` whose \`.changes\` is never read (\`entity-backfill.ts:592-593\`), so record A's two minted ids — deleted by the first undo — are reported removed a second time.`
  );
}
// Recoverable? The newer record is still beside the DB and still correct.
const aUndoB = cli([DB, `--undo=${recB}`]);
check(
  'A3',
  'recovery: undoing record B afterwards returns the database to pristine (messages, bindings, entities)',
  aUndoB.code === 0 && dump(DB) === pristineDump,
  `exit ${aUndoB.code} · ${dump(DB) === pristineDump ? 'row-for-row pristine (added_at aside)' : 'DIFFERS from pristine'} · wren roster ${JSON.stringify(roster(W))}`
);

// ── Arm B — the user re-seated the channel after the run ─────────────────────
// The header says the record "does not discard whatever the user did after the
// run". Round 178 pinned the add case: a second agent added after the apply
// survives undo, sorted behind the restored default. This is the replace case.
console.log('\nArm B — the user re-seated the channel in the app between apply and undo');
await restorePristine();
const bApply = cli([DB, '--apply', `--channels=${W}`]);
const recBR = recordFrom(bApply.out);
const bWren = rosterIds(W)[0];
const reseat = spawnSync('npx', ['tsx', SELF], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, R183_ROLE: 'reseat', R183_CHANNEL: W, R183_FROM: bWren, KLATCH_DB: DB },
});
const reseatOut = JSON.parse(reseat.stdout.trim().split('\n').pop() || '{}') as { kestrelId?: string; removed?: boolean };
check(
  'B0',
  'setup: apply --channels=<wren>, then the app seats Kestrel and removes Wren',
  bApply.code === 0 && !!recBR && reseat.status === 0 && same(roster(W), ['Kestrel']),
  `exit ${bApply.code} · re-seat exit ${reseat.status} · roster ${JSON.stringify(roster(W))}`
);
const bRosterBefore = rosterIds(W);
const bStampsBefore = stamps(W);
const bUndo = cli([DB, `--undo=${recBR}`]);
const bRoster = roster(W);
const kestrelKept = !!reseatOut.kestrelId && entityIds().includes(reseatOut.kestrelId) && rosterIds(W).includes(reseatOut.kestrelId);
check('B1', 'undo does not unseat or delete the agent the user chose', kestrelKept,
  `Kestrel ${kestrelKept ? 'still seated and present' : 'GONE'} · exit ${bUndo.code}`);
// Re-vehicled after Round 184 (Daedalus's repair, agreed). This arm used to
// expect the backfill's Wren removed as "orphaned". It is not orphaned: the
// chat's assistant rows are still stamped to it, and `messages.entity_id` has no
// foreign key (`db/index.ts:103`, added by ALTER), so deleting it would leave
// those rows naming an agent that does not exist. The rows are Wren's
// conversation, so Wren stays. The channel changed after the run, so undo leaves it
// exactly as the user left it, names who is seated now, and does not exit 0.
const bLeftAlone = same(rosterIds(W), bRosterBefore) && same(stamps(W), bStampsBefore);
const bWrenReportedKept = entityIds().includes(bWren) && new RegExp(`kept because [^\\n]*${bWren}`).test(bUndo.out);
const bNamesSeated = /seated now: Kestrel \[/.test(bUndo.out);
check('B1', "…and leaves the re-seated channel as the user left it, keeping the backfill's Wren its rows still name",
  bLeftAlone && bWrenReportedKept && bNamesSeated && bUndo.code !== 0,
  `roster+stamps ${bLeftAlone ? 'unchanged' : 'CHANGED'} · Wren ${bWrenReportedKept ? 'present and reported kept' : 'NOT reported kept'} · ` +
    `${bNamesSeated ? '"seated now: Kestrel" printed' : 'seated-now line MISSING'} · exit ${bUndo.code}`);
measure(
  `after the user replaced Wren with Kestrel, undo left the chat's roster ${JSON.stringify(bRoster)}, exit ${bUndo.code}, "${
    /Reverted .*/.exec(bUndo.out)?.[0] ?? ''
  }". Before Round 184 the placeholder was re-bound beside Kestrel (["default","Kestrel"], exit 0).`
);

// ── Arm C — a record from a different database ───────────────────────────────
// Two databases on one machine is this project's normal state (a worktree's
// klatch.db, the real one, a restored backup). A record from one aimed at the other.
console.log('\nArm C — a record written against another database');
build(OTHER);
const cApply = cli([OTHER, '--apply']);
const otherRecord = recordFrom(cApply.out);
await restorePristine();
const cDump = dump(DB, true);
const cBackups = backupsIn(DATA).length;
const cUndo = cli([DB, `--undo=${otherRecord}`]);
const cUnchanged = dump(DB, true) === cDump;
check(
  'C1',
  "a foreign record writes nothing to this database",
  cUndo.code !== 0 && cUnchanged && orphanBindings() === 0,
  `exit ${cUndo.code} · ${cUnchanged ? 'rows unchanged' : 'ROWS CHANGED'} · ${orphanBindings()} orphan binding(s) · "${firstLine(cUndo.err)}"`
);
const cBackupLeft = backupsIn(DATA).length - cBackups;
if (!/part-way/.test(cUndo.err)) {
  check('C2', 'and the refusal does not claim a partial reversal', true, `"${firstLine(cUndo.err)}"`);
} else {
  open_(
    'C2',
    'a foreign record is reported as "undo failed part-way", with a backup kept for a run that changed nothing',
    `stderr: ${JSON.stringify(cliLines(cUndo.err).map((l) => l.replace(DATA, '…')))}. The first channel's re-bind hits the foreign key on \`channel_entities.channel_id\` inside its own transaction, so zero channels changed — rows verified identical, added_at included — but the CLI's catch is the one written for a throw after earlier channels committed (\`backfill-entity-bindings.mts:312-318\`), so the operator is told the database is in a partial state it is not in, and ${cBackupLeft} backup file(s) are kept beside it "intact" for a recovery that is not needed. No data harm; the wrong diagnosis, at the moment the operator is already recovering from something.`
  );
}

// ── Arm D — what undo reports, against what it did ──────────────────────────
console.log('\nArm D — the second way back, then the first');
await restorePristine();
const dApply = cli([DB, '--apply']);
const dRecord = recordFrom(dApply.out);
const dBackup = backupFrom(dApply.out);
// The header offers two independent ways back. An operator who restores the
// backup and then also runs the undo, to be sure, is using both.
await copyDb(dBackup, DB);
const dEntBefore = entityIds();
const dBefore = dump(DB);
const dUndo = cli([DB, `--undo=${dRecord}`]);
const dDeleted = dEntBefore.filter((id) => !entityIds().includes(id)).length;
check('D1', 'undo after restoring the backup leaves the restored state as it was', dUndo.code === 0 && dump(DB) === dBefore,
  `exit ${dUndo.code} · ${dump(DB) === dBefore ? 'rows unchanged' : 'ROWS CHANGED'}`);
if (reverted(dUndo.out) === 0 && claimedRemoved(dUndo.out) === dDeleted) {
  check('D2', 'and says it reverted nothing', true, /Reverted .*/.exec(dUndo.out)?.[0] ?? '');
} else {
  open_(
    'D2',
    'undo against a database already back at the start reports a full reversal',
    `Printed "${/Reverted .*/.exec(dUndo.out)?.[0]}" on a database the backup had already restored: ${dDeleted} agent rows deleted, 0 bindings changed. \`reverted++\` counts channels iterated, not channels that were on \`toEntityId\` (\`entity-backfill.ts:577-578\`), and "Agents removed" is A2's count. Same root as A1 — undo never reads what it is about to undo — in the one case where the state happens to be harmless, which is what makes the line trustworthy-looking in the case (A1) where it is not.`
  );
}

// ── Arm Q — edges of the Round 182 parse rule ────────────────────────────────
console.log('\nArm Q — edges of Round 182\'s every-token rule');
await restorePristine();
const qHash = sha(DB);

// Smart punctuation: macOS, Notion, Slack and most rendered markdown turn `--`
// into an em dash outside a code block. The token no longer starts with `-`.
// Driven twice: through the documented `npx tsx` (what an operator runs), and
// through tsx directly (what the script's own rule does). The first pass of this
// arm drove only npx and scored npm's refusal as the script's.
const qEmNpx = cli([DB, `—channels=${W}`]);
measure(
  `Q1 via the documented \`npx tsx\`: exit ${qEmNpx.code} · "${firstLine(qEmNpx.err)}" — ${
    /npm error/.test(qEmNpx.err) ? 'npm refuses the token before the script runs; the CLI is never reached' : 'reached the CLI'
  }`
);
const qEm = cliDirect([DB, `—channels=${W}`]);
check('Q1', '`—channels=<id>` (em dash, after the path), CLI reached directly, refuses without planning',
  qEm.code !== 0 && !planned(qEm.out) && !/npm error/.test(qEm.err), `exit ${qEm.code} · "${firstLine(qEm.err)}"`);
const qEn = cliDirect([`–channels=${W}`, DB]);
check('Q2', '`–channels=<id>` (en dash, before the path), CLI reached directly, refuses without planning',
  qEn.code !== 0 && !planned(qEn.out) && !/npm error/.test(qEn.err), `exit ${qEn.code} · "${firstLine(qEn.err)}"`);
measure(
  `Q2's voice, from the script: "${firstLine(qEn.err)}"${
    /unexpected argument/.test(qEn.err) && qEn.err.includes(DB)
      ? ' — the dash token was taken as the database path, so the real database path is what it calls the unexpected argument'
      : ''
  }`
);

// Both slips at once: the wrong name AND a space. Round 180's space remedy names
// the id sitting in argv; Round 182's unknown-flag refusal fires first and does not.
const qBoth = cli([DB, '--channel', W]);
const qBothEchoes = (qBoth.out + qBoth.err).includes(W);
check('Q3', '`--channel <id>` (misspelled and spaced) refuses without planning',
  qBoth.code === 1 && !planned(qBoth.out), `exit ${qBoth.code} · "${firstLine(qBoth.err)}"`);
if (qBothEchoes) {
  check('Q3', '…and names the id left in argv', true, 'id echoed');
} else {
  open_(
    'Q3',
    '`--channel <id>` refuses without naming the id, and its suggestion leads to a second refusal',
    `stderr names \`--channel\` and suggests "${/did you mean [^?]*\?/.exec(qBoth.err)?.[0] ?? '(none)'}" — with no \`=\`, because the token had none — and the id appears nowhere in stdout or stderr. Pasting the suggestion back gives \`--channels <id>\`, which Round 180 then refuses a second time with the equals-sign remedy. Safe in both steps; the id-echo that Rounds 180–182 treat as the actionable half of a refusal is missing only here, because the unknown-flag loop runs before the stray-positional reasoning and never looks at positionals.`
  );
}

// "Did you mean" at edit distance 2 on a four-letter flag.
const qRedo = cli([DB, `--redo=klatch.db.backfill-X.json`]);
const qRedoSuggestion = /did you mean [^?]*\?/.exec(qRedo.err)?.[0] ?? '';
check('Q4', '`--redo=<record>` refuses without writing', qRedo.code === 1 && sha(DB) === qHash,
  `exit ${qRedo.code} · "${qRedoSuggestion || firstLine(qRedo.err)}"`);
measure(
  `Q4: \`--redo=<record>\` (an operator reaching for "re-apply that") is ${qRedoSuggestion ? `answered "${qRedoSuggestion}"` : 'given no suggestion'} — edit distance 2 from \`undo\`. ` +
    `The paste reverses rather than re-does, and --undo is the mode that writes without --apply. Recorded, not scored: the suggestion is not the action.`
);

const qDashDash = cli([DB, '--', `--channels=${W}`]);
check('Q5', '`--` (end-of-options marker) refuses rather than being skipped',
  qDashDash.code === 1 && !planned(qDashDash.out), `exit ${qDashDash.code} · "${firstLine(qDashDash.err)}"`);

const qFlagFirst = cli(['--channels', W, DB]);
check('Q6', '`--channels <id> <db>` (flag first, spaced) refuses without planning',
  qFlagFirst.code !== 0 && !planned(qFlagFirst.out), `exit ${qFlagFirst.code} · "${firstLine(qFlagFirst.err)}"`);
measure(`Q6's voice: "${firstLine(qFlagFirst.err)}"`);

check('Q', 'no arm-Q run touched the DB or left a snapshot', sha(DB) === qHash && backupsIn(DATA).length === 0,
  `sha256 ${sha(DB) === qHash ? 'unchanged' : 'CHANGED'} · ${backupsIn(DATA).length} backup(s)`);

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
