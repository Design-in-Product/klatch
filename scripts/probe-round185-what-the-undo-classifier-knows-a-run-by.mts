/**
 * Round 185 — what Round 184's undo classifier knows a run by.
 *
 * Round 184 (`d8bb1a78`) makes undo read each record channel inside the
 * transaction that writes it, and write only a channel classified `revert`:
 * still bound to the record's `toEntityId` (`entity-backfill.ts`, `undoClassifier`).
 * Round 183's arm A1 (an older record undone after a re-apply) now exits 2 and
 * writes nothing. But A1's second apply *re-minted* Wren, a new uuid, because the
 * first undo had deleted the old one. So the record's agent id and the database's
 * disagreed, and that disagreement is what the classifier saw.
 *
 *   **When a later run moves the channel to the same agent id, can the classifier
 *   still tell the runs apart? And does the catch Round 184 rewrote keep the
 *   promise it now makes?**
 *
 * Arm N — the A1 sequence on the `reuse` channel, whose agent (Sable) existed
 *         before any run, so both applies match it by name and bind the same id.
 *         Two controls first, so whatever the finding is, it is attributable.
 * Arm F — a real SQLite error part-way through undo (a trigger that aborts one
 *         UPDATE on the third record channel), then "Run the same --undo again".
 * Arm M — a mixed record: one channel re-seated in the app, three not. The exit.
 *
 * Same discipline as Rounds 176/179/181/183: the real CLI as a real subprocess
 * against a real file-backed DB built by Round 176's builder, verified through
 * this probe's own read-only handle in raw SQL. The app-side writes (a re-seat,
 * one more reply) run the real query functions in a subprocess, in the order the
 * routes call them. Zero model calls. `klatch.db` is never opened: fixtures live
 * in `.testdata/r185/` (gitignored).
 *
 *   npx tsx scripts/probe-round185-what-the-undo-classifier-knows-a-run-by.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SELF = fileURLToPath(import.meta.url);
const DATA = path.join(ROOT, '.testdata', 'r185');
const DB = path.join(DATA, 'klatch.db');
const PRISTINE = path.join(DATA, 'pristine.db');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

const DEFAULT_ENTITY_ID = 'default-entity';

// ── self-spawned roles: app-side writes, done the way the app does them ───────
if (process.env.R185_ROLE === 'reseat') {
  // Round 183's re-seat: the route's two guards, then the route's query functions.
  const q = await import('../packages/server/src/db/queries.js');
  const ch = process.env.R185_CHANNEL!;
  const from = process.env.R185_FROM!;
  const kestrel = q.createEntity('Kestrel', 'claude-opus-5', '', '#3366aa');
  if (q.getChannelEntityCount(ch) >= 5) throw new Error('route would refuse: cap');
  q.assignEntityToChannel(ch, kestrel.id);
  if (q.getChannelEntityCount(ch) <= 1) throw new Error('route would refuse: last entity');
  const removed = q.removeEntityFromChannel(ch, from);
  console.log(JSON.stringify({ kestrelId: kestrel.id, removed }));
  process.exit(0);
}
if (process.env.R185_ROLE === 'reply') {
  // One more turn in a 1:1, written the way `routes/messages.ts:101-103` writes it:
  // the user row, then an assistant row stamped to the seated agent, then the
  // stream's completion (`updateMessage`). No model is called; the text is fixed.
  const q = await import('../packages/server/src/db/queries.js');
  const ch = process.env.R185_CHANNEL!;
  const entities = q.getChannelEntities(ch);
  if (entities.length !== 1) throw new Error(`expected a 1:1, roster has ${entities.length}`);
  const entity = entities[0];
  q.insertMessage(ch, 'user', 'r185: one more question', 'complete');
  const msg = q.insertMessage(ch, 'assistant', '', 'streaming', entity.model, entity.id);
  q.updateMessage(msg.id, 'r185: one more answer', 'complete');
  console.log(JSON.stringify({ assistantId: msg.id, entityId: entity.id }));
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
    env: { ...process.env, R176_ROLE: '', R185_ROLE: '' },
  });
  return { code: r.status ?? -1, out: r.stdout ?? '', err: r.stderr ?? '' };
}
function role(name: string, env: Record<string, string>): { status: number | null; json: any } {
  const r = spawnSync('npx', ['tsx', SELF], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, R185_ROLE: name, KLATCH_DB: DB, ...env },
  });
  let json: any = {};
  try {
    json = JSON.parse((r.stdout ?? '').trim().split('\n').pop() || '{}');
  } catch {
    json = { unparsed: r.stdout, stderr: r.stderr };
  }
  return { status: r.status, json };
}

// tsx's own DeprecationWarning lands on stderr under this Node; it is not the CLI.
const cliLines = (s: string) =>
  s.split('\n').map((l) => l.trim()).filter((l) => l && !/DeprecationWarning|--trace-deprecation/.test(l));
const backupsIn = (dir: string) => fs.readdirSync(dir).filter((f) => f.startsWith('klatch.db.backup-backfill-'));
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
function rw(file: string, sql: string): void {
  const db = new Database(file, { fileMustExist: true });
  try {
    db.exec(sql);
  } finally {
    db.close();
  }
}

// Same ORDER BY as `getChannelEntities` (`queries.ts:480`).
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
const stampOf = (id: string): string | null | '(row gone)' =>
  ro(DB, (db) => {
    const r = db.prepare('SELECT entity_id FROM messages WHERE id = ?').get(id) as { entity_id: string | null } | undefined;
    return r ? r.entity_id : '(row gone)';
  });
const entityIds = (): string[] =>
  ro(DB, (db) => (db.prepare('SELECT id FROM entities ORDER BY id').all() as { id: string }[]).map((r) => r.id));
const entityNamed = (name: string): string =>
  ro(DB, (db) => (db.prepare('SELECT id FROM entities WHERE name = ?').get(name) as { id: string }).id);

/** Rows of every table undo writes. `except` drops one channel's rows, for arms that add to it. */
function dump(file: string, except?: string): string {
  return ro(file, (db) =>
    [
      ...(db.prepare('SELECT id, channel_id, entity_id FROM messages ORDER BY id').all() as { id: string; channel_id: string; entity_id: string | null }[])
        .filter((r) => r.channel_id !== except)
        .map((r) => 'm ' + JSON.stringify(r)),
      ...(db.prepare('SELECT channel_id, entity_id FROM channel_entities ORDER BY channel_id, entity_id').all() as { channel_id: string }[])
        .filter((r) => r.channel_id !== except)
        .map((r) => 'ce ' + JSON.stringify(r)),
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

interface RecordChannel {
  channelId: string;
  toEntityId: string;
  mintedHere: boolean;
  p2MessageIds: string[];
  p3MessageIds: string[];
}
const readRecord = (file: string): { channels: RecordChannel[] } => JSON.parse(fs.readFileSync(file, 'utf8'));
const entryFor = (file: string, ch: string): RecordChannel | undefined =>
  file ? readRecord(file).channels.find((c) => c.channelId === ch) : undefined;

const reverted = (out: string) => Number(/Reverted (\d+) channel/.exec(out)?.[1] ?? NaN);
const claimedRemoved = (out: string) => Number(/Agents removed: (\d+)/.exec(out)?.[1] ?? NaN);
const recordFrom = (out: string) => /^Undo record: (.+)$/m.exec(out)?.[1] ?? '';
const same = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);

// The CLI prints one line per record channel: `<id[0..8]>  <name>  <LABEL>`.
// Longest label first: "REVERTED" is a substring of "ALREADY REVERTED".
const LABELS = ['ALREADY REVERTED', 'CHANGED SINCE THE RUN', 'NOT IN THIS DATABASE', 'REVERTED'] as const;
function labelFor(out: string, ch: string): string {
  const line = out.split('\n').find((l) => l.trim().startsWith(ch.slice(0, 8) + ' ')) ?? '';
  return LABELS.find((L) => line.includes(L)) ?? '(no line)';
}

// ── fixture ───────────────────────────────────────────────────────────────────

console.log('\n=== Round 185 — what the undo classifier knows a run by ===\n');
fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });
execFileSync('npx', ['tsx', R176], { cwd: ROOT, env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: DB }, stdio: 'ignore' });
const seeded: Record<string, string> = JSON.parse(fs.readFileSync(path.join(ROOT, '.testdata', 'r176', 'seeded.json'), 'utf8'));
await copyDb(DB, PRISTINE);
const W = seeded['wren'];
const R = seeded['reuse'];
const SABLE = entityNamed('Sable');
const pristineDump = dump(DB);
const pristineDumpExceptR = dump(DB, R);
const pristineStampsR = stamps(R);
const label = (s: string | null | '(row gone)') =>
  s === null ? 'NULL' : s === DEFAULT_ENTITY_ID ? 'default' : s === SABLE ? 'Sable' : s === '(row gone)' ? s : s.slice(0, 8);
measure(
  `fixture: ${entityIds().length} entity rows; reuse=${R.slice(0, 8)}… (Sable ${SABLE.slice(0, 8)}…, created before any run), wren=${W.slice(0, 8)}…; ` +
    `reuse assistant stamps ${JSON.stringify(pristineStampsR.map(label))}`
);

/** The reuse channel as the newer run's undo should leave it: on the default, every assistant row (the reply included) stamped as before the runs, nothing else changed. */
const settledAfterReply = (): boolean =>
  same(rosterIds(R), [DEFAULT_ENTITY_ID]) &&
  same(stamps(R), [...pristineStampsR, DEFAULT_ENTITY_ID]) &&
  dump(DB, R) === pristineDumpExceptR;

// ── Arm N — the same agent id, two runs ───────────────────────────────────────
console.log('\nArm N — an older record, when the later run bound the same agent id');

// N0/N1: Round 183's A1 sequence, on the channel whose agent is not re-minted.
await restorePristine();
const n0A = cli([DB, '--apply']);
const n0RecA = recordFrom(n0A.out);
const n0UA = cli([DB, `--undo=${n0RecA}`]);
const n0B = cli([DB, '--apply', `--channels=${R}`]);
const n0RecB = recordFrom(n0B.out);
const n0a = entryFor(n0RecA, R);
const n0b = entryFor(n0RecB, R);
check(
  'N0',
  'setup: apply → undo → apply --channels=<reuse>; both records move reuse to the same Sable id, matched by name, not minted',
  n0A.code === 0 && n0UA.code === 0 && n0B.code === 0 && !!n0a && !!n0b &&
    n0a.toEntityId === SABLE && n0b.toEntityId === SABLE && !n0a.mintedHere && !n0b.mintedHere,
  `exits ${n0A.code}/${n0UA.code}/${n0B.code} · A→${n0a ? label(n0a.toEntityId) : '(absent)'} · B→${n0b ? label(n0b.toEntityId) : '(absent)'} · mintedHere ${n0a?.mintedHere}/${n0b?.mintedHere}`
);
const n1Stale = cli([DB, `--undo=${n0RecA}`]);
const n1UB = cli([DB, `--undo=${n0RecB}`]);
check(
  'N1',
  'control: with nothing written between the runs, undoing the older record then the newer one ends pristine',
  n1Stale.code === 0 && n1UB.code === 0 && dump(DB) === pristineDump,
  `older: exit ${n1Stale.code}, reuse ${labelFor(n1Stale.out, R)} · newer: exit ${n1UB.code}, reuse ${labelFor(n1UB.out, R)} · ` +
    `${dump(DB) === pristineDump ? 'row-for-row pristine' : 'DIFFERS from pristine'}`
);

// N2: the same sequence plus one more reply between the runs, undone with the
// right record only. What the correct path produces, so N4/N5 are compared to it.
await restorePristine();
const n2A = cli([DB, '--apply']);
const n2UA = cli([DB, `--undo=${recordFrom(n2A.out)}`]);
const n2Reply = role('reply', { R185_CHANNEL: R });
const n2B = cli([DB, '--apply', `--channels=${R}`]);
const n2UB = cli([DB, `--undo=${recordFrom(n2B.out)}`]);
check(
  'N2',
  'control: a reply between the runs, then the newer record alone, settles reuse on the default with the reply on the default',
  n2A.code === 0 && n2UA.code === 0 && n2Reply.status === 0 && n2B.code === 0 && n2UB.code === 0 &&
    labelFor(n2UB.out, R) === 'REVERTED' && settledAfterReply(),
  `exits ${n2A.code}/${n2UA.code}/reply ${n2Reply.status}/${n2B.code}/${n2UB.code} · reuse ${labelFor(n2UB.out, R)} · ` +
    `stamps ${JSON.stringify(stamps(R).map(label))} · rest of DB ${dump(DB, R) === pristineDumpExceptR ? 'pristine' : 'DIFFERS'}`
);

// N3–N6: the same, but the operator reaches for the older record first (the
// order `ls` and tab completion list them, Round 183).
await restorePristine();
const n3A = cli([DB, '--apply']);
const n3RecA = recordFrom(n3A.out);
const n3UA = cli([DB, `--undo=${n3RecA}`]);
const n3Reply = role('reply', { R185_CHANNEL: R });
const replyId: string = n3Reply.json.assistantId ?? '';
const n3B = cli([DB, '--apply', `--channels=${R}`]);
const n3RecB = recordFrom(n3B.out);
const n3a = entryFor(n3RecA, R);
const n3b = entryFor(n3RecB, R);
check(
  'N3',
  'setup: the reply was stamped to the seated default, so the newer record carries it and the older does not',
  n3A.code === 0 && n3UA.code === 0 && n3Reply.status === 0 && n3B.code === 0 &&
    n3Reply.json.entityId === DEFAULT_ENTITY_ID && !!n3a && !!n3b &&
    n3b.p2MessageIds.includes(replyId) && !n3a.p2MessageIds.includes(replyId) && stampOf(replyId) === SABLE,
  `reply stamped ${label(n3Reply.json.entityId ?? null)} at write, ${label(stampOf(replyId))} after the newer apply · ` +
    `in newer record ${!!n3b?.p2MessageIds.includes(replyId)} · in older ${!!n3a?.p2MessageIds.includes(replyId)}`
);

const n4Backups = backupsIn(DATA);
const n4RosterBefore = rosterIds(R);
const n4StampsBefore = stamps(R);
const n4 = cli([DB, `--undo=${n3RecA}`]);
const n4Snap = backupsIn(DATA).filter((f) => !n4Backups.includes(f));
const n4LeftAlone = same(rosterIds(R), n4RosterBefore) && same(stamps(R), n4StampsBefore);
if (n4.code !== 0 && n4LeftAlone) {
  check('N4', 'an older record does not write a channel a later run re-applied (A1, with the agent id held constant)', true,
    `exit ${n4.code} · reuse ${labelFor(n4.out, R)} · roster and stamps unchanged`);
} else {
  open_(
    'N4',
    'an older record writes a channel a later run re-applied, when that run bound the same agent id, and exits 0',
    `\`--undo=<older>\` after the newer apply: exit ${n4.code}, reuse ${labelFor(n4.out, R)}, "${/Reverted .*/.exec(n4.out)?.[0] ?? ''}". ` +
      `reuse roster ${JSON.stringify(n4RosterBefore.map(label))} → ${JSON.stringify(rosterIds(R).map(label))}; assistant stamps ` +
      `${JSON.stringify(n4StampsBefore.map(label))} → ${JSON.stringify(stamps(R).map(label))}. The reply the newer run moved is not in the older ` +
      `record, so it is left stamped ${label(stampOf(replyId))} on a chat whose only seat is the default. The classifier's \`revert\` test is ` +
      `"still bound to toEntityId", and both runs bound the same id, so the older record passes it. A1 exits 2 only because its second apply re-minted.`
  );
}

const n5 = cli([DB, `--undo=${n3RecB}`]);
const n5Voice = cli5Voice(n5.out, R);
if (n5.code === 0 && settledAfterReply()) {
  check('N5', 'the newer record still reverses its own run afterwards', true, `exit ${n5.code} · reuse ${labelFor(n5.out, R)}`);
} else {
  open_(
    'N5',
    "after that, the newer record — the right one — is refused for the channel it moved",
    `\`--undo=<newer>\`: exit ${n5.code}, reuse ${labelFor(n5.out, R)}. It printed: ${JSON.stringify(n5Voice)}. The advice names the record the ` +
      `operator is already using. Reply row still ${label(stampOf(replyId))}; roster ${JSON.stringify(rosterIds(R).map(label))}.`
  );
}

function cli5Voice(out: string, ch: string): string[] {
  const lines = cliLines(out);
  const at = lines.findIndex((l) => l.startsWith(ch.slice(0, 8) + ' '));
  return [
    ...(at === -1 ? [] : lines.slice(at, at + 2)),
    ...lines.filter((l) => /left as they are|If a later --apply|Nothing was written/.test(l)),
  ].map((l) => l.replace(DATA, '…'));
}

// Recovery: the snapshot the older-record undo took is the state after the newer apply.
if (n4Snap.length === 1) {
  await copyDb(path.join(DATA, n4Snap[0]), DB);
  const n6 = cli([DB, `--undo=${n3RecB}`]);
  check(
    'N6',
    "recovery: restore the snapshot the older-record undo took, then undo with the newer record — settles as N2 did",
    n6.code === 0 && labelFor(n6.out, R) === 'REVERTED' && settledAfterReply(),
    `exit ${n6.code} · reuse ${labelFor(n6.out, R)} · stamps ${JSON.stringify(stamps(R).map(label))}`
  );
} else {
  check('N6', "recovery: the older-record undo left exactly one snapshot to restore", false, `${n4Snap.length} new snapshot(s)`);
}

// ── Arm F — a database error part-way through undo ────────────────────────────
// Round 184 rewrote the catch: "Channels before the failing one may already be
// reverted. Run the same --undo again to see where each channel stands: undo reads
// a channel before writing it and never writes one twice." A trigger that aborts
// one UPDATE is a real SQLite error, from inside the real transaction, at a
// channel chosen rather than hoped for.
console.log('\nArm F — a database error part-way through, then the same --undo again');
await restorePristine();
const fApply = cli([DB, '--apply']);
const fRec = recordFrom(fApply.out);
const fChannels = fRec ? readRecord(fRec).channels : [];
const victim = fChannels[2];
const victimRow = victim?.p2MessageIds[0] ?? '';
const fStampsBefore = fChannels.map((c) => stamps(c.channelId));
rw(
  DB,
  `CREATE TRIGGER r185_fault BEFORE UPDATE OF entity_id ON messages WHEN OLD.id = '${victimRow}'
     BEGIN SELECT RAISE(ABORT, 'r185 injected fault'); END;`
);
const fBackups = backupsIn(DATA);
const f1 = cli([DB, `--undo=${fRec}`]);
const fSnap = backupsIn(DATA).filter((f) => !fBackups.includes(f));
const triggerStill = ro(DB, (db) => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'trigger' AND name = 'r185_fault'").get());
check(
  'F0',
  'setup: apply (4); the undo stopped on the injected fault, on the third record channel',
  fApply.code === 0 && fChannels.length === 4 && !!victimRow && /r185 injected fault/.test(f1.err) && triggerStill,
  `apply exit ${fApply.code} · ${fChannels.length} record channel(s) · fault ${/r185 injected fault/.test(f1.err) ? 'reported' : 'NOT reported'} · trigger ${triggerStill ? 'still installed' : 'GONE'}`
);
const firstTwoReverted = fChannels.slice(0, 2).every((c) => same(rosterIds(c.channelId), [DEFAULT_ENTITY_ID]));
const lastTwoWhole = fChannels
  .slice(2)
  .every((c, i) => same(rosterIds(c.channelId), [c.toEntityId]) && same(stamps(c.channelId), fStampsBefore[i + 2]));
check(
  'F1',
  "the throw leaves the channels before it reverted and the failing channel whole; exit 1, the snapshot kept, and the operator told to re-run",
  f1.code === 1 && firstTwoReverted && lastTwoWhole && fSnap.length === 1 &&
    /undo stopped on a database error/.test(f1.err) && /Run the same --undo again/.test(f1.err),
  `exit ${f1.code} · channels 1–2 ${firstTwoReverted ? 'reverted' : 'NOT reverted'} · 3–4 ${lastTwoWhole ? 'untouched' : 'CHANGED'} · ${fSnap.length} snapshot(s) kept`
);
measure(`F1's voice: ${JSON.stringify(cliLines(f1.err).map((l) => l.replace(DATA, '…')))}`);

rw(DB, 'DROP TRIGGER r185_fault;');
const fEntBefore2 = entityIds();
const f2 = cli([DB, `--undo=${fRec}`]);
const f2Labels = fChannels.map((c) => labelFor(f2.out, c.channelId));
const f2Removed = fEntBefore2.filter((id) => !entityIds().includes(id)).length;
check(
  'F2',
  'the same --undo again reports where each channel stands, writes only the two not yet reverted, removes what the first run could not, and ends pristine',
  f2.code === 0 && same(f2Labels, ['ALREADY REVERTED', 'ALREADY REVERTED', 'REVERTED', 'REVERTED']) &&
    reverted(f2.out) === 2 && claimedRemoved(f2.out) === f2Removed && dump(DB) === pristineDump,
  `exit ${f2.code} · ${JSON.stringify(f2Labels)} · "${/Reverted .*/.exec(f2.out)?.[0] ?? ''}" (deleted ${f2Removed}) · ` +
    `${dump(DB) === pristineDump ? 'row-for-row pristine' : 'DIFFERS from pristine'}`
);
const fBackups3 = backupsIn(DATA).length;
const fDump3 = dump(DB);
const f3 = cli([DB, `--undo=${fRec}`]);
check(
  'F3',
  'a third run finds every channel already reverted: writes nothing, discards its snapshot, exit 0',
  f3.code === 0 && fChannels.every((c) => labelFor(f3.out, c.channelId) === 'ALREADY REVERTED') &&
    reverted(f3.out) === 0 && claimedRemoved(f3.out) === 0 && /Nothing was written; the snapshot was discarded/.test(f3.out) &&
    backupsIn(DATA).length === fBackups3 && dump(DB) === fDump3,
  `exit ${f3.code} · "${/Reverted .*/.exec(f3.out)?.[0] ?? ''}" · snapshots ${fBackups3} → ${backupsIn(DATA).length}`
);

// ── Arm M — a mixed record ────────────────────────────────────────────────────
console.log('\nArm M — one channel re-seated in the app, three not');
await restorePristine();
const mApply = cli([DB, '--apply']);
const mRec = recordFrom(mApply.out);
const mChannels = mRec ? readRecord(mRec).channels : [];
const mWren = rosterIds(W)[0];
const mReseat = role('reseat', { R185_CHANNEL: W, R185_FROM: mWren });
const mRosterBefore = rosterIds(W);
const mStampsBefore = stamps(W);
check(
  'M0',
  'setup: apply (4), then the app replaces Wren with Kestrel on the wren chat',
  mApply.code === 0 && mChannels.length === 4 && mChannels.some((c) => c.channelId === W) && mReseat.status === 0 &&
    same(mRosterBefore, [mReseat.json.kestrelId]),
  `apply exit ${mApply.code} · ${mChannels.length} record channel(s) · re-seat exit ${mReseat.status}`
);
const m = cli([DB, `--undo=${mRec}`]);
const others = mChannels.filter((c) => c.channelId !== W);
const othersReverted = others.every(
  (c) => labelFor(m.out, c.channelId) === 'REVERTED' && same(rosterIds(c.channelId), [DEFAULT_ENTITY_ID])
);
check(
  'M1',
  "a mixed record reverts the three still in the run's state and leaves the re-seated chat as the user left it",
  othersReverted && labelFor(m.out, W) === 'CHANGED SINCE THE RUN' && same(rosterIds(W), mRosterBefore) &&
    same(stamps(W), mStampsBefore) && reverted(m.out) === others.length && /1 channel\(s\) left as they are/.test(m.out),
  `others ${othersReverted ? 'REVERTED' : 'NOT all reverted'} · wren ${labelFor(m.out, W)} · "${/Reverted .*/.exec(m.out)?.[0] ?? ''}"`
);
if (m.code !== 0) {
  check('M2', 'an undo that left a channel it was asked to revert does not exit 0', true, `exit ${m.code}`);
} else {
  open_(
    'M2',
    'an undo that left a channel exits 2 alone and 0 in company',
    `exit ${m.code}, after printing "1 channel(s) left as they are". The CLI's own rule, beside its exit: "anything left because it changed is ` +
      `an undo that did not do what was asked, and must not exit 0". It sits inside \`if (result.reverted === 0 && …)\`, so it holds only ` +
      `when nothing else was written. Round 183's B (the same re-seat, in a one-channel record) exits 2. No data harm; the exit code is ` +
      `the one part of the output a script or a glance at \`$?\` reads.`
  );
}
measure(`M's stdout: ${JSON.stringify(cliLines(m.out).map((l) => l.replace(DATA, '…')))}`);

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
