/**
 * Round 187 — Round 186's binding rule, at the inputs it was argued from.
 *
 * Round 186 (`f0230372`) records the `added_at` of the binding apply made
 * (`toAddedAt`), and reverts a channel only while that binding is still the one
 * seated: `reboundSince = ch.toAddedAt != null && binding.added_at !== ch.toAddedAt`
 * (`entity-backfill.ts`, `undoClassifier`). Daedalus chose this over keying on the
 * record files because "added_at lives in the database, so a snapshot restore
 * carries it along". He named one behaviour he judged but did not drive: an agent
 * taken off a chat and put back in the app now reads as `changed-since`.
 *
 * Arm S — the restore he argued from: apply → undo → re-apply the same agent →
 *         restore the undo's snapshot. Which record settles it, and what does the
 *         refusal of the other one say?
 * Arm P — his judgement, through the app's own guards (`routes/entities.ts`):
 *         Kestrel on, Sable off, Sable back on, Kestrel off. Then undo.
 * Arm L — a record from before `toAddedAt` (his stated limit), on Round 185's N4
 *         sequence, at the CLI. Measured, not scored.
 * Arm G — the two `added_at` fields now decide a refusal (`toAddedAt`) and a
 *         write (`fromAddedAt`). Does the record shape check (`checkUndoRecord`)
 *         read them?
 *
 * Same discipline as Rounds 176–185: the real CLI as a real subprocess against a
 * real file-backed DB built by Round 176's builder, verified through this probe's
 * own read-only handle in raw SQL. App-side writes run the real query functions
 * in a subprocess, behind the route's guards. Zero model calls. `klatch.db` is
 * never opened: fixtures live in `.testdata/r187/` (gitignored).
 *
 *   npx tsx scripts/probe-round187-the-binding-rule-at-the-inputs-it-was-argued-from.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SELF = fileURLToPath(import.meta.url);
const DATA = path.join(ROOT, '.testdata', 'r187');
const DB = path.join(DATA, 'klatch.db');
const PRISTINE = path.join(DATA, 'pristine.db');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

const DEFAULT_ENTITY_ID = 'default-entity';

// ── self-spawned roles: app-side writes, done the way the app does them ───────
if (process.env.R187_ROLE === 'readd') {
  // Take the agent off a 1:1 and put it back. The route refuses removing the last
  // seat (`routes/entities.ts:227`), so a user has to seat someone else first.
  const q = await import('../packages/server/src/db/queries.js');
  const ch = process.env.R187_CHANNEL!;
  const agent = process.env.R187_AGENT!;
  const add = (id: string) => {
    if (q.getChannelEntityCount(ch) >= 5) throw new Error('route would refuse: cap');
    q.assignEntityToChannel(ch, id);
  };
  const remove = (id: string) => {
    if (q.getChannelEntityCount(ch) <= 1) throw new Error('route would refuse: last entity');
    if (!q.removeEntityFromChannel(ch, id)) throw new Error('route would 404: not assigned');
  };
  const kestrel = q.createEntity('Kestrel', 'claude-opus-5', '', '#3366aa');
  add(kestrel.id);
  remove(agent);
  add(agent);
  remove(kestrel.id);
  console.log(JSON.stringify({ kestrelId: kestrel.id }));
  process.exit(0);
}
if (process.env.R187_ROLE === 'reply') {
  // One more turn in a 1:1, written the way `routes/messages.ts` writes it (Round 185's role).
  const q = await import('../packages/server/src/db/queries.js');
  const ch = process.env.R187_CHANNEL!;
  const entities = q.getChannelEntities(ch);
  if (entities.length !== 1) throw new Error(`expected a 1:1, roster has ${entities.length}`);
  const entity = entities[0];
  q.insertMessage(ch, 'user', 'r187: one more question', 'complete');
  const msg = q.insertMessage(ch, 'assistant', '', 'streaming', entity.model, entity.id);
  q.updateMessage(msg.id, 'r187: one more answer', 'complete');
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
    env: { ...process.env, R176_ROLE: '', R187_ROLE: '' },
  });
  return { code: r.status ?? -1, out: r.stdout ?? '', err: r.stderr ?? '' };
}
function role(name: string, env: Record<string, string>): { status: number | null; json: any } {
  const r = spawnSync('npx', ['tsx', SELF], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, R187_ROLE: name, KLATCH_DB: DB, ...env },
  });
  let json: any = {};
  try {
    json = JSON.parse((r.stdout ?? '').trim().split('\n').pop() || '{}');
  } catch {
    json = { unparsed: r.stdout, stderr: r.stderr };
  }
  return { status: r.status, json };
}

// `added_at` is `datetime('now')`, second resolution. Every arm that compares two
// bindings of one agent waits past a second boundary first, and asserts the two
// values differ, so a result is the rule and not Round 186's stated limit.
const tick = () => new Promise((r) => setTimeout(r, 1100));

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

// Same ORDER BY as `getChannelEntities` (`queries.ts:486`).
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
const addedAt = (ch: string, entity: string): string | null =>
  ro(DB, (db) =>
    (db.prepare('SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?').get(ch, entity) as
      | { added_at: string }
      | undefined)?.added_at ?? null
  );
const entityNamed = (name: string): string =>
  ro(DB, (db) => (db.prepare('SELECT id FROM entities WHERE name = ?').get(name) as { id: string }).id);

/** Rows of every table undo writes. */
function dump(file: string): string {
  return ro(file, (db) =>
    [
      ...(db.prepare('SELECT id, channel_id, entity_id FROM messages ORDER BY id').all() as object[]).map((r) => 'm ' + JSON.stringify(r)),
      ...(db.prepare('SELECT channel_id, entity_id FROM channel_entities ORDER BY channel_id, entity_id').all() as object[]).map(
        (r) => 'ce ' + JSON.stringify(r)
      ),
      ...(db.prepare('SELECT id, name FROM entities ORDER BY id').all() as object[]).map((r) => 'e ' + JSON.stringify(r)),
    ].join('\n')
  );
}
/** Bindings with their `added_at`, which `dump` leaves out. */
const bindingsWithTimes = (file: string): string =>
  ro(file, (db) =>
    JSON.stringify(db.prepare('SELECT channel_id, entity_id, added_at FROM channel_entities ORDER BY channel_id, entity_id').all())
  );

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
  fromAddedAt?: string | null;
  toAddedAt?: string | null;
  p2MessageIds: string[];
  p3MessageIds: string[];
}
const readRecord = (file: string): { channels: RecordChannel[] } => JSON.parse(fs.readFileSync(file, 'utf8'));
const entryFor = (file: string, ch: string): RecordChannel | undefined =>
  file ? readRecord(file).channels.find((c) => c.channelId === ch) : undefined;
/** A copy of a record with each channel passed through `edit`, named so `restorePristine` clears it. */
function editedRecord(file: string, tag: string, edit: (c: Record<string, unknown>) => void): string {
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const c of r.channels) edit(c);
  const out = path.join(DATA, `klatch.db.backfill-r187-${tag}.json`);
  fs.writeFileSync(out, JSON.stringify(r, null, 2));
  return out;
}

const recordFrom = (out: string) => /^Undo record: (.+)$/m.exec(out)?.[1] ?? '';
const same = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);

// The CLI prints one line per record channel: `<id[0..8]>  <name>  <LABEL>`.
// Longest label first: "REVERTED" is a substring of "ALREADY REVERTED".
const LABELS = ['ALREADY REVERTED', 'CHANGED SINCE THE RUN', 'NOT IN THIS DATABASE', 'REVERTED'] as const;
function labelFor(out: string, ch: string): string {
  const line = out.split('\n').find((l) => l.trim().startsWith(ch.slice(0, 8) + ' ')) ?? '';
  return LABELS.find((L) => line.includes(L)) ?? '(no line)';
}
/** The channel's line, the line under it, and the summary advice. */
function voiceFor(out: string, ch: string): string[] {
  const lines = cliLines(out);
  const at = lines.findIndex((l) => l.startsWith(ch.slice(0, 8) + ' '));
  return [
    ...(at === -1 ? [] : lines.slice(at, at + 2)),
    ...lines.filter((l) => /left as they are|If a later --apply|Nothing was written/.test(l)),
  ].map((l) => l.replace(DATA, '…'));
}

// ── fixture ───────────────────────────────────────────────────────────────────

console.log('\n=== Round 187 — the binding rule, at the inputs it was argued from ===\n');
fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });
execFileSync('npx', ['tsx', R176], { cwd: ROOT, env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: DB }, stdio: 'ignore' });
const seeded: Record<string, string> = JSON.parse(fs.readFileSync(path.join(ROOT, '.testdata', 'r176', 'seeded.json'), 'utf8'));
await copyDb(DB, PRISTINE);
const R = seeded['reuse'];
const SABLE = entityNamed('Sable');
const pristineDump = dump(DB);
const pristineBindings = bindingsWithTimes(DB);
const label = (s: string | null | '(row gone)') =>
  s === null ? 'NULL' : s === DEFAULT_ENTITY_ID ? 'default' : s === SABLE ? 'Sable' : s === '(row gone)' ? s : s.slice(0, 8);
measure(`fixture: reuse=${R.slice(0, 8)}… (Sable ${SABLE.slice(0, 8)}…, created before any run); reuse assistant stamps ${JSON.stringify(stamps(R).map(label))}`);

// ── Arm S — a snapshot restored after a re-apply ──────────────────────────────
console.log('\nArm S — restore the undo\'s snapshot after a re-apply of the same agent');
await restorePristine();
const sA = cli([DB, '--apply']);
const sRecA = recordFrom(sA.out);
const sBk0 = backupsIn(DATA);
const sUA = cli([DB, `--undo=${sRecA}`]);
const sUASnap = backupsIn(DATA).filter((f) => !sBk0.includes(f));
await tick();
const sB = cli([DB, '--apply', `--channels=${R}`]);
const sRecB = recordFrom(sB.out);
const sa = entryFor(sRecA, R);
const sb = entryFor(sRecB, R);
if (sUASnap.length === 1) await copyDb(path.join(DATA, sUASnap[0]), DB);
const sBinding = addedAt(R, SABLE);
check(
  'S0',
  "setup: apply → undo (its snapshot kept) → apply --channels=<reuse> → restore the undo's snapshot; reuse is on the first run's own binding again",
  sA.code === 0 && sUA.code === 0 && sB.code === 0 && sUASnap.length === 1 && !!sa && !!sb &&
    sa.toEntityId === SABLE && sb.toEntityId === SABLE && !!sa.toAddedAt && !!sb.toAddedAt && sa.toAddedAt !== sb.toAddedAt &&
    same(rosterIds(R), [SABLE]) && sBinding === sa.toAddedAt,
  `exits ${sA.code}/${sUA.code}/${sB.code} · undo left ${sUASnap.length} snapshot(s) · both → ${sa ? label(sa.toEntityId) : '?'}/${sb ? label(sb.toEntityId) : '?'} · ` +
    `toAddedAt A ${sa?.toAddedAt} / B ${sb?.toAddedAt} · binding after restore ${sBinding}`
);

const s1Before = dump(DB);
const s1Bk = backupsIn(DATA);
const s1 = cli([DB, `--undo=${sRecB}`]);
const s1Wrote = dump(DB) !== s1Before;
const s1Snaps = backupsIn(DATA).filter((f) => !s1Bk.includes(f)).length;
check(
  'S1',
  'the newer record, on a database restored to before its run, is refused and writes nothing',
  s1.code === 2 && labelFor(s1.out, R) === 'CHANGED SINCE THE RUN' && !s1Wrote && s1Snaps === 0,
  `exit ${s1.code} · reuse ${labelFor(s1.out, R)} · wrote ${s1Wrote ? 'SOMETHING' : 'nothing'} · ${s1Snaps} snapshot(s) left`
);
const s1Voice = voiceFor(s1.out, R);
const s1SaysLater = /later binding/.test(s1.out);
const bindingIsEarlier = !!sBinding && !!sb?.toAddedAt && sBinding < sb.toAddedAt;
if (s1SaysLater && bindingIsEarlier) {
  open_(
    'S2',
    "after a restore, the refusal names a later binding and a later --apply, and the binding it read is earlier than the record's run",
    `seated binding added_at ${sBinding} < record toAddedAt ${sb?.toAddedAt}. It printed: ${JSON.stringify(s1Voice)}. ` +
      `\`reboundSince\` is \`binding.added_at !== ch.toAddedAt\`: different, not later. The only record that settles this channel is the older one (S3).`
  );
} else {
  check('S2', "the refusal's stated reason agrees with the binding it read", true, `says later: ${s1SaysLater} · binding earlier: ${bindingIsEarlier} · ${JSON.stringify(s1Voice)}`);
}

const s3 = cli([DB, `--undo=${sRecA}`]);
const sChannels = sRecA ? readRecord(sRecA).channels : [];
const s3Labels = sChannels.map((c) => labelFor(s3.out, c.channelId));
const s3Bindings = bindingsWithTimes(DB) === pristineBindings;
check(
  'S3',
  "the older record — the run this database is now in — settles it: pristine row for row, bindings' added_at included",
  s3.code === 0 && sChannels.length > 0 && s3Labels.every((l) => l === 'REVERTED') && dump(DB) === pristineDump && s3Bindings,
  `exit ${s3.code} · ${JSON.stringify(s3Labels)} · rows ${dump(DB) === pristineDump ? 'pristine' : 'DIFFER'} · bindings with added_at ${s3Bindings ? 'pristine' : 'DIFFER'}`
);

// ── Arm P — the agent taken off and put back in the app ───────────────────────
console.log('\nArm P — Sable taken off the chat and put back, in the app');
await restorePristine();
const pA = cli([DB, '--apply', `--channels=${R}`]);
const pRec = recordFrom(pA.out);
const pa = entryFor(pRec, R);
const pRosterAfterApply = rosterIds(R);
const pStampsAfterApply = stamps(R);
await tick();
const pReadd = role('readd', { R187_CHANNEL: R, R187_AGENT: SABLE });
const pBinding = addedAt(R, SABLE);
check(
  'P0',
  "setup: apply --channels=<reuse>, then behind the route's guards Kestrel on, Sable off, Sable on, Kestrel off",
  pA.code === 0 && !!pa?.toAddedAt && pReadd.status === 0 && same(pRosterAfterApply, [SABLE]) && same(rosterIds(R), [SABLE]) &&
    same(stamps(R), pStampsAfterApply) && !!pBinding && pBinding !== pa.toAddedAt,
  `apply exit ${pA.code} · re-add exit ${pReadd.status} · roster ${JSON.stringify(rosterIds(R).map(label))} · stamps ` +
    `${same(stamps(R), pStampsAfterApply) ? 'unchanged' : 'CHANGED'} · binding added_at ${pa?.toAddedAt} → ${pBinding}`
);
const p1Before = dump(DB);
const p1Bk = backupsIn(DATA).length;
const p1 = cli([DB, `--undo=${pRec}`]);
check(
  'P1',
  'the undo leaves it, writes nothing, exits 2, and names the app as a possible cause',
  p1.code === 2 && labelFor(p1.out, R) === 'CHANGED SINCE THE RUN' && dump(DB) === p1Before && backupsIn(DATA).length === p1Bk &&
    /re-added in the app/.test(p1.out),
  `exit ${p1.code} · reuse ${labelFor(p1.out, R)} · wrote ${dump(DB) === p1Before ? 'nothing' : 'SOMETHING'} · snapshots ${p1Bk} → ${backupsIn(DATA).length}`
);
measure(`P's voice: ${JSON.stringify(voiceFor(p1.out, R))}`);
measure(
  `P: everything undo reads besides the binding is the state the run left — roster ${JSON.stringify(rosterIds(R).map(label))} ` +
    `(after apply ${JSON.stringify(pRosterAfterApply.map(label))}), stamps ${same(stamps(R), pStampsAfterApply) ? 'identical' : 'DIFFERENT'}. ` +
    `Records in the folder: ${recordsIn(DATA).length}. Backups in the folder: ${backupsIn(DATA).length}.`
);

// ── Arm L — a record from before toAddedAt, on Round 185's N4 sequence ────────
console.log('\nArm L — a record written before toAddedAt existed (the stated limit)');
await restorePristine();
const lA = cli([DB, '--apply']);
const lRecA = recordFrom(lA.out);
const lUA = cli([DB, `--undo=${lRecA}`]);
const lReply = role('reply', { R187_CHANNEL: R });
const lReplyId: string = lReply.json.assistantId ?? '';
await tick();
const lB = cli([DB, '--apply', `--channels=${R}`]);
const lRecB = recordFrom(lB.out);
const lLegacy = lRecA ? editedRecord(lRecA, 'legacy', (c) => delete c.toAddedAt) : '';
check(
  'L0',
  'setup: apply → undo → a reply → apply --channels=<reuse>; the older record copied without toAddedAt',
  lA.code === 0 && lUA.code === 0 && lReply.status === 0 && lB.code === 0 && !!lLegacy && stampOf(lReplyId) === SABLE &&
    readRecord(lLegacy).channels.every((c) => !('toAddedAt' in c)),
  `exits ${lA.code}/${lUA.code}/reply ${lReply.status}/${lB.code} · reply stamped ${label(stampOf(lReplyId))} after the newer apply`
);
const lU = cli([DB, `--undo=${lLegacy}`]);
const lAfterLegacy = { roster: rosterIds(R).map(label), reply: label(stampOf(lReplyId)) };
const lUB = cli([DB, `--undo=${lRecB}`]);
measure(
  `L: legacy older record → exit ${lU.code}, reuse ${labelFor(lU.out, R)}; roster ${JSON.stringify(lAfterLegacy.roster)}, reply ${lAfterLegacy.reply}. ` +
    `Then the newer record → exit ${lUB.code}, reuse ${labelFor(lUB.out, R)}; roster ${JSON.stringify(rosterIds(R).map(label))}, reply ${label(stampOf(lReplyId))}.`
);

// ── Arm G — the added_at fields and the record shape check ────────────────────
console.log('\nArm G — do the fields that decide a refusal and a write pass through the shape check?');
await restorePristine();
const gA = cli([DB, '--apply', `--channels=${R}`]);
const gRec = recordFrom(gA.out);
const gFromAddedAt = gRec ? entryFor(gRec, R)?.fromAddedAt : undefined;
check('G0', 'setup: apply --channels=<reuse>; the record carries both added_at fields as strings',
  gA.code === 0 && typeof gFromAddedAt === 'string' && typeof entryFor(gRec, R)?.toAddedAt === 'string',
  `apply exit ${gA.code} · fromAddedAt ${gFromAddedAt} · toAddedAt ${gRec ? entryFor(gRec, R)?.toAddedAt : '?'}`);

const g1File = gRec ? editedRecord(gRec, 'g1', (c) => (c.toAddedAt = 12345)) : '';
const g1Before = dump(DB);
const g1 = cli([DB, `--undo=${g1File}`]);
const g1RefusedAtParse = g1.code !== 0 && labelFor(g1.out, R) === '(no line)' && dump(DB) === g1Before;
if (g1RefusedAtParse) {
  check('G1', 'a record whose toAddedAt is a number is refused as malformed, before any channel is read', true,
    `exit ${g1.code} · ${JSON.stringify(cliLines(g1.err).slice(0, 2))}`);
} else {
  open_(
    'G1',
    'a record whose toAddedAt is a number passes the shape check, and its channel is refused as re-bound',
    `exit ${g1.code} · reuse ${labelFor(g1.out, R)} · wrote ${dump(DB) === g1Before ? 'nothing' : 'SOMETHING'} · printed ${JSON.stringify(voiceFor(g1.out, R))}`
  );
}

const g2File = gRec ? editedRecord(gRec, 'g2', (c) => (c.fromAddedAt = 'not a date')) : '';
const g2Before = dump(DB);
const g2 = cli([DB, `--undo=${g2File}`]);
const g2RefusedAtParse = g2.code !== 0 && labelFor(g2.out, R) === '(no line)' && dump(DB) === g2Before;
const g2DefaultAt = addedAt(R, DEFAULT_ENTITY_ID);
if (g2RefusedAtParse) {
  check('G2', 'a record whose fromAddedAt is not a timestamp is refused as malformed, before anything is written', true,
    `exit ${g2.code} · ${JSON.stringify(cliLines(g2.err).slice(0, 2))}`);
} else {
  open_(
    'G2',
    "a record whose fromAddedAt is not a timestamp passes the shape check, and undo writes the value into the default's binding",
    `exit ${g2.code} · reuse ${labelFor(g2.out, R)} · the default's added_at on reuse is now ${JSON.stringify(g2DefaultAt)} (the record ` +
      `as apply wrote it said ${JSON.stringify(gFromAddedAt)}). \`getChannelEntities\` orders a roster by this column.`
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
