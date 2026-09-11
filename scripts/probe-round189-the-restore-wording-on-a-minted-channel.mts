/**
 * Round 189 — Round 188's restore wording, on the channels it did not drive.
 *
 * Round 188 (`968d1006`) splits Round 186's "different binding" into two:
 * `boundBeforeRun` (the seated binding of the record's agent is earlier than the
 * run's: a restored backup, use the older record) and `reboundSince` (later: a
 * later --apply or the app, use the newer record). Both live inside
 * `if (binding)` (`entity-backfill.ts:657-683`), so they are only computed when
 * the record's agent is still bound. His tests and Round 187's arm S drove one
 * channel, `reuse`, whose agent (Sable) is matched by name and has one id in
 * every run.
 *
 *   **After the same restore, what does the refusal say on a channel whose agent
 *   the run minted, and whose re-minted id is therefore not in the restored
 *   database at all?**
 *
 * Prediction (written in the session log before this probe was run): the
 * not-bound branch (`:684-699`) gives `changed-since` with neither flag, and the
 * CLI (`backfill-entity-bindings.mts:380-386, 420`) prints "which no longer
 * exists" and "If a later --apply moved one, undo with that run's record first",
 * with no restore line: Round 187's S2 direction, on a minted channel.
 *
 * Arm M — Round 187's S sequence with the second run on `wren` (minted).
 * Arm U — the same with the second run unfiltered: one name-matched channel and
 *         three minted in one refusal.
 * Arm K — control, the direction that is later: the app re-seats `wren` after
 *         the run. What the database holds that tells K from M.
 * Arm E — the agent deleted in the app: a channel with no binding at all.
 * Arm V — timestamps that pass Round 188's shape check but are not times.
 *         Measured, not scored: a record has to be hand-edited to carry them.
 *
 * Same discipline as Rounds 176–187: the real CLI as a real subprocess against a
 * real file-backed DB built by Round 176's builder, verified through this probe's
 * own read-only handle in raw SQL. App-side writes run the real query functions
 * in a subprocess, behind the route's guards. Zero model calls. `klatch.db` is
 * never opened: fixtures live in `.testdata/r189/` (gitignored).
 *
 *   npx tsx scripts/probe-round189-the-restore-wording-on-a-minted-channel.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SELF = fileURLToPath(import.meta.url);
const DATA = path.join(ROOT, '.testdata', 'r189');
const DB = path.join(DATA, 'klatch.db');
const PRISTINE = path.join(DATA, 'pristine.db');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

const DEFAULT_ENTITY_ID = 'default-entity';

// ── self-spawned roles: app-side writes, done the way the app does them ───────
if (process.env.R189_ROLE === 'reseat') {
  // Round 183's re-seat, behind the route's two guards (`routes/entities.ts`).
  const q = await import('../packages/server/src/db/queries.js');
  const ch = process.env.R189_CHANNEL!;
  const from = process.env.R189_FROM!;
  const kestrel = q.createEntity('Kestrel', 'claude-opus-5', '', '#3366aa');
  if (q.getChannelEntityCount(ch) >= 5) throw new Error('route would refuse: cap');
  q.assignEntityToChannel(ch, kestrel.id);
  if (q.getChannelEntityCount(ch) <= 1) throw new Error('route would refuse: last entity');
  if (!q.removeEntityFromChannel(ch, from)) throw new Error('route would 404: not assigned');
  console.log(JSON.stringify({ kestrelId: kestrel.id }));
  process.exit(0);
}
if (process.env.R189_ROLE === 'delete') {
  // `DELETE /entities/:id` (`routes/entities.ts:168-181`): refuses the default,
  // 404s an unknown id, then `deleteEntity`, which drops every binding and seats
  // no one in its place (`queries.ts:467-476`).
  const q = await import('../packages/server/src/db/queries.js');
  const id = process.env.R189_AGENT!;
  if (id === DEFAULT_ENTITY_ID) throw new Error('route would 400: default entity');
  if (!q.getEntity(id)) throw new Error('route would 404: not found');
  console.log(JSON.stringify({ deleted: q.deleteEntity(id) }));
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
    env: { ...process.env, R176_ROLE: '', R189_ROLE: '' },
  });
  return { code: r.status ?? -1, out: r.stdout ?? '', err: r.stderr ?? '' };
}
function role(name: string, env: Record<string, string>): { status: number | null; json: any } {
  const r = spawnSync('npx', ['tsx', SELF], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, R189_ROLE: name, KLATCH_DB: DB, ...env },
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
// bindings waits past a second boundary first and asserts the values differ.
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
const seats = (ch: string): { entity_id: string; added_at: string }[] =>
  ro(DB, (db) =>
    db.prepare('SELECT entity_id, added_at FROM channel_entities WHERE channel_id = ? ORDER BY added_at ASC, rowid ASC').all(ch)
  );
const stamps = (ch: string): (string | null)[] =>
  ro(DB, (db) =>
    (db
      .prepare(`SELECT entity_id FROM messages WHERE channel_id = ? AND role = 'assistant' ORDER BY rowid`)
      .all(ch) as { entity_id: string | null }[]).map((r) => r.entity_id)
  );
const addedAt = (ch: string, entity: string): string | null =>
  ro(DB, (db) =>
    (db.prepare('SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?').get(ch, entity) as
      | { added_at: string }
      | undefined)?.added_at ?? null
  );
const entityExists = (id: string): boolean =>
  ro(DB, (db) => !!db.prepare('SELECT 1 FROM entities WHERE id = ?').get(id));
const entityNamed = (name: string): string =>
  ro(DB, (db) => (db.prepare('SELECT id FROM entities WHERE name = ?').get(name) as { id: string }).id);

/** Rows of every table undo writes, bindings with their `added_at`. */
function dump(file: string): string {
  return ro(file, (db) =>
    [
      ...(db.prepare('SELECT id, channel_id, entity_id FROM messages ORDER BY id').all() as object[]).map((r) => 'm ' + JSON.stringify(r)),
      ...(db.prepare('SELECT channel_id, entity_id, added_at FROM channel_entities ORDER BY channel_id, entity_id').all() as object[]).map(
        (r) => 'ce ' + JSON.stringify(r)
      ),
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
  const out = path.join(DATA, `klatch.db.backfill-r189-${tag}.json`);
  fs.writeFileSync(out, JSON.stringify(r, null, 2));
  return out;
}

const recordFrom = (out: string) => /^Undo record: (.+)$/m.exec(out)?.[1] ?? '';
const same = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);
const countOf = (s: string, re: RegExp) => (s.match(new RegExp(re.source, 'g')) ?? []).length;

// The CLI prints one line per record channel: `<id[0..8]>  <name>  <LABEL>`.
// Longest label first: "REVERTED" is a substring of "ALREADY REVERTED".
const LABELS = ['ALREADY REVERTED', 'CHANGED SINCE THE RUN', 'NOT IN THIS DATABASE', 'REVERTED'] as const;
function labelFor(out: string, ch: string): string {
  const line = out.split('\n').find((l) => l.trim().startsWith(ch.slice(0, 8) + ' ')) ?? '';
  return LABELS.find((L) => line.includes(L)) ?? '(no line)';
}
/** Every reason line and the whole summary advice, ids elided. */
function voice(out: string): string[] {
  return cliLines(out)
    .filter((l) => /seated now:|left as they are|state this record|If a later --apply|restored from a backup|Nothing was written/.test(l))
    .map((l) => l.replace(DATA, '…').replace(/\[[0-9a-f-]{36}\]/g, '[…]'));
}

const LATER_WORDING = /If a later --apply|later binding/;

// Round 191: Round 190's exact sentences, so a pass means the right line on the right channel.
const MINTED_BEFORE_LINE =
  /which no longer exists, and everyone seated on it was seated before this run: this database is from before the run \(a restored backup\?\)\.$/;
const BOUND_BEFORE_LINE =
  /and it is seated by an earlier binding than this run's: this database is from before the run \(a restored backup\?\)\.$/;
const OLDER_ADVICE = /If this database was restored from a backup, the record that fits it is an older run's: undo with that one\./;
/** The reason line printed under a channel's label line, or '' if none. */
function reasonFor(out: string, ch: string): string {
  const lines = out.split('\n');
  const i = lines.findIndex((l) => l.trim().startsWith(ch.slice(0, 8) + ' '));
  const next = i >= 0 ? (lines[i + 1] ?? '').trim() : '';
  return next.startsWith('seated now:') ? next : '';
}

// ── fixture ───────────────────────────────────────────────────────────────────

console.log('\n=== Round 189 — the restore wording, on the channels Round 188 did not drive ===\n');
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
measure(`fixture: wren=${W.slice(0, 8)}… (agent minted by the run), reuse=${R.slice(0, 8)}… (Sable ${SABLE.slice(0, 8)}…, created before any run)`);

/** Apply A → undo A (snapshot kept) → second apply → restore undo A's snapshot. */
async function restoreAfterReapply(secondApply: string[]) {
  await restorePristine();
  const a = cli([DB, '--apply']);
  const recA = recordFrom(a.out);
  const bk0 = backupsIn(DATA);
  const ua = cli([DB, `--undo=${recA}`]);
  const uaSnap = backupsIn(DATA).filter((f) => !bk0.includes(f));
  await tick();
  const b = cli([DB, '--apply', ...secondApply]);
  const recB = recordFrom(b.out);
  if (uaSnap.length === 1) await copyDb(path.join(DATA, uaSnap[0]), DB);
  return { a, recA, ua, uaSnap, b, recB };
}

/** Undo with a record; what it wrote, what it left, what it said. */
function undoWith(rec: string) {
  const before = dump(DB);
  const bk = backupsIn(DATA);
  const r = cli([DB, `--undo=${rec}`]);
  return { ...r, wrote: dump(DB) !== before, snaps: backupsIn(DATA).filter((f) => !bk.includes(f)).length };
}

// ── Arm M — the restore, with the second run on a minted channel ─────────────
console.log('\nArm M — restore after re-applying wren, whose agent the run mints');
const m = await restoreAfterReapply([`--channels=${W}`]);
const ma = entryFor(m.recA, W);
const mb = entryFor(m.recB, W);
const mSeats = seats(W);
check(
  'M0',
  "setup: apply → undo (snapshot kept) → apply --channels=<wren> → restore the undo's snapshot; wren is on the first run's Wren, and the second run's Wren is not in the database",
  m.a.code === 0 && m.ua.code === 0 && m.b.code === 0 && m.uaSnap.length === 1 && !!ma && !!mb &&
    ma.mintedHere && mb.mintedHere && ma.toEntityId !== mb.toEntityId &&
    !!ma.toAddedAt && !!mb.toAddedAt && ma.toAddedAt < mb.toAddedAt &&
    entityExists(ma.toEntityId) && !entityExists(mb.toEntityId) &&
    same(rosterIds(W), [ma.toEntityId]) && addedAt(W, ma.toEntityId) === ma.toAddedAt,
  `exits ${m.a.code}/${m.ua.code}/${m.b.code} · undo left ${m.uaSnap.length} snapshot(s) · minted ${ma?.mintedHere}/${mb?.mintedHere} · ` +
    `Wren ids ${ma?.toEntityId.slice(0, 8)}/${mb?.toEntityId.slice(0, 8)} · toAddedAt A ${ma?.toAddedAt} / B ${mb?.toAddedAt} · ` +
    `after restore: A's Wren ${ma && entityExists(ma.toEntityId) ? 'present' : 'ABSENT'}, B's ${mb && entityExists(mb.toEntityId) ? 'PRESENT' : 'absent'}, seats ${JSON.stringify(mSeats)}`
);

const m1 = undoWith(m.recB);
check(
  'M1',
  'the newer record, on a database restored to before its run, is refused and writes nothing',
  m1.code === 2 && labelFor(m1.out, W) === 'CHANGED SINCE THE RUN' && !m1.wrote && m1.snaps === 0,
  `exit ${m1.code} · wren ${labelFor(m1.out, W)} · wrote ${m1.wrote ? 'SOMETHING' : 'nothing'} · ${m1.snaps} snapshot(s) left`
);

const m1Voice = voice(m1.out);
const mAllSeatsEarlier = mSeats.length > 0 && !!mb?.toAddedAt && mSeats.every((s) => s.added_at < mb.toAddedAt!);
// Closed by Round 190 (`7a0ba775`). Re-vehicled in Round 191: the open branch is now a failure, and the
// pass asserts wren's own reason line and the one advice line, not a restore word anywhere in the output.
// The bound-branch sentence ("it is seated by an earlier binding") would be false here, so it must not print.
check(
  'M2',
  "wren's reason says its agent no longer exists and every seat predates the run; the advice points to the older record; no later-run wording, no \"it is seated\"",
  MINTED_BEFORE_LINE.test(reasonFor(m1.out, W)) &&
    countOf(m1.out, OLDER_ADVICE) === 1 &&
    !LATER_WORDING.test(m1.out) &&
    !BOUND_BEFORE_LINE.test(m1.out) &&
    mAllSeatsEarlier,
  `every seat on wren earlier than the run: ${mAllSeatsEarlier} (${mSeats.map((s) => s.added_at).join(', ')} < ${mb?.toAddedAt}). ` +
    `It printed: ${JSON.stringify(m1Voice)}`
);

const m3 = undoWith(m.recA);
const m3Channels = m.recA ? readRecord(m.recA).channels : [];
const m3Labels = m3Channels.map((c) => labelFor(m3.out, c.channelId));
check(
  'M3',
  "control: the older record — the run this database is now in — settles it, row for row, bindings' added_at included",
  m3.code === 0 && m3Channels.length > 0 && m3Labels.every((l) => l === 'REVERTED') && dump(DB) === pristineDump,
  `exit ${m3.code} · ${JSON.stringify(m3Labels)} · ${dump(DB) === pristineDump ? 'pristine' : 'DIFFERS from pristine'}`
);

// ── Arm U — the second run unfiltered: both reasons in one refusal ────────────
console.log('\nArm U — restore after an unfiltered re-apply: one name-matched channel, three minted');
const u = await restoreAfterReapply([]);
const uChannelsB = u.recB ? readRecord(u.recB).channels : [];
const uGoneB = uChannelsB.filter((c) => !entityExists(c.toEntityId)).map((c) => c.channelId);
const uAllSeatsEarlier = uChannelsB.every((c) => {
  const s = seats(c.channelId);
  return s.length > 0 && !!c.toAddedAt && s.every((x) => x.added_at < c.toAddedAt!);
});
check(
  'U0',
  "setup: apply → undo (snapshot kept) → apply → restore the undo's snapshot; every channel of the second record is seated only by bindings older than the second run",
  u.a.code === 0 && u.ua.code === 0 && u.b.code === 0 && u.uaSnap.length === 1 && uChannelsB.length === 4 &&
    uGoneB.length === 3 && !uGoneB.includes(R) && uAllSeatsEarlier,
  `exits ${u.a.code}/${u.ua.code}/${u.b.code} · second record ${uChannelsB.length} channel(s) · its agent absent after restore on ` +
    `${uGoneB.length} (${uGoneB.includes(R) ? 'reuse among them' : 'not reuse'}) · all seats older than the run: ${uAllSeatsEarlier}`
);

const u1 = undoWith(u.recB);
const u1Labels = uChannelsB.map((c) => labelFor(u1.out, c.channelId));
check(
  'U1',
  'the newer record is refused on every channel and writes nothing',
  u1.code === 2 && u1Labels.every((l) => l === 'CHANGED SINCE THE RUN') && !u1.wrote && u1.snaps === 0,
  `exit ${u1.code} · ${JSON.stringify(u1Labels)} · wrote ${u1.wrote ? 'SOMETHING' : 'nothing'} · ${u1.snaps} snapshot(s) left`
);

// Closed by Round 190. Re-vehicled in Round 191: checked per channel. reuse (Sable, bound) carries the
// earlier-binding line, each minted channel carries the no-longer-exists line, and the summary has
// the older-record advice once and no later-run advice.
const uReasons = Object.fromEntries(uChannelsB.map((c) => [c.channelId, reasonFor(u1.out, c.channelId)]));
const uMintedOk = uGoneB.length === 3 && uGoneB.every((ch) => MINTED_BEFORE_LINE.test(uReasons[ch]));
check(
  'U2',
  'one restore, one direction: reuse gets the earlier-binding line, the three minted channels the no-longer-exists line, one older-record advice, no later-run wording',
  BOUND_BEFORE_LINE.test(uReasons[R] ?? '') && uMintedOk && countOf(u1.out, OLDER_ADVICE) === 1 && !LATER_WORDING.test(u1.out),
  `reuse: ${BOUND_BEFORE_LINE.test(uReasons[R] ?? '') ? 'earlier-binding line' : 'NOT the earlier-binding line'} · ` +
    `minted: ${uGoneB.filter((ch) => MINTED_BEFORE_LINE.test(uReasons[ch])).length} of ${uGoneB.length} with the no-longer-exists line · ` +
    `advice ×${countOf(u1.out, OLDER_ADVICE)} · later wording ${LATER_WORDING.test(u1.out) ? 'PRINTED' : 'absent'}. It printed: ${JSON.stringify(voice(u1.out))}`
);

const u3 = undoWith(u.recA);
check(
  'U3',
  'control: the older record settles it, row for row',
  u3.code === 0 && dump(DB) === pristineDump,
  `exit ${u3.code} · ${dump(DB) === pristineDump ? 'pristine' : 'DIFFERS from pristine'}`
);

// ── Arm K — control: the direction that really is later ──────────────────────
console.log('\nArm K — the app re-seats wren after the run (later, not a restore)');
await restorePristine();
const kA = cli([DB, '--apply', `--channels=${W}`]);
const kRec = recordFrom(kA.out);
const ka = entryFor(kRec, W);
await tick();
const kReseat = role('reseat', { R189_CHANNEL: W, R189_FROM: ka?.toEntityId ?? '' });
const kSeats = seats(W);
check(
  'K0',
  "setup: apply --channels=<wren>, then behind the route's guards Kestrel on, Wren off; Wren still exists",
  kA.code === 0 && !!ka?.toAddedAt && kReseat.status === 0 && kSeats.length === 1 && kSeats[0].entity_id === kReseat.json.kestrelId &&
    entityExists(ka.toEntityId),
  `apply exit ${kA.code} · re-seat exit ${kReseat.status} · seats ${JSON.stringify(kSeats)} · run toAddedAt ${ka?.toAddedAt}`
);
const k1 = undoWith(kRec);
check(
  'K1',
  'the undo leaves it and writes nothing',
  k1.code === 2 && labelFor(k1.out, W) === 'CHANGED SINCE THE RUN' && !k1.wrote && k1.snaps === 0,
  `exit ${k1.code} · wren ${labelFor(k1.out, W)} · wrote ${k1.wrote ? 'SOMETHING' : 'nothing'} · ${k1.snaps} snapshot(s) left`
);
const kLater = kSeats.length > 0 && !!ka?.toAddedAt && kSeats.every((s) => s.added_at > ka.toAddedAt!);
measure(`K's voice: ${JSON.stringify(voice(k1.out))}`);
measure(
  `What tells K from M in the database: in K every seat on wren is later than the run (${kSeats.map((s) => s.added_at).join(', ')} > ${ka?.toAddedAt}: ${kLater}); ` +
    `in M every seat was earlier (${mAllSeatsEarlier}). Neither record's agent is bound in either arm.`
);

// ── Arm E — the agent deleted in the app ─────────────────────────────────────
console.log('\nArm E — the run\'s Wren deleted in the app: a channel with no binding at all');
await restorePristine();
const eA = cli([DB, '--apply', `--channels=${W}`]);
const eRec = recordFrom(eA.out);
const ea = entryFor(eRec, W);
await tick();
const eDel = role('delete', { R189_AGENT: ea?.toEntityId ?? '' });
check(
  'E0',
  'setup: apply --channels=<wren>, then DELETE /entities/<its Wren>; wren has no seat, its rows still carry the deleted id',
  eA.code === 0 && eDel.status === 0 && eDel.json.deleted === true && seats(W).length === 0 && !!ea && !entityExists(ea.toEntityId) &&
    stamps(W).includes(ea.toEntityId),
  `apply exit ${eA.code} · delete exit ${eDel.status} (${JSON.stringify(eDel.json)}) · seats ${seats(W).length} · ` +
    `stamps ${JSON.stringify(stamps(W).map((s) => (s === null ? 'NULL' : s === ea?.toEntityId ? 'deleted Wren' : s.slice(0, 8))))}`
);
const eDumpBefore = dump(DB).split('\n');
const e1 = undoWith(eRec);
const eDumpAfter = dump(DB).split('\n');
const eAdded = eDumpAfter.filter((l) => !eDumpBefore.includes(l));
const eRemoved = eDumpBefore.filter((l) => !eDumpAfter.includes(l));
const eSeatAfter = seats(W);
// Run 1 printed "wrote SOMETHING" beside the CLI's "Nothing was written". The
// difference is `getDb()`'s own migration (`db/index.ts:354-365`): any channel with
// no binding is given the default on every open. Measured as the exact row diff, so
// the write is attributed to what made it and not to undo.
measure(
  `E: undo → exit ${e1.code}, wren ${labelFor(e1.out, W)}. Rows added across the CLI call: ${JSON.stringify(eAdded)}; removed: ${JSON.stringify(eRemoved)}. ` +
    `Wren's seats after: ${JSON.stringify(eSeatAfter)} (run toAddedAt ${ea?.toAddedAt}). It printed: ${JSON.stringify(voice(e1.out))}`
);

// ── Arm V — values Round 188's shape check accepts that are not times ────────
console.log('\nArm V — timestamps of the right shape that are not times');
await restorePristine();
const vA = cli([DB, '--apply', `--channels=${W}`]);
const vRec = recordFrom(vA.out);
const vFuture = vRec ? editedRecord(vRec, 'v-to', (c) => (c.toAddedAt = '9999-99-99 99:99:99')) : '';
// Round 190 closed V (`isSqliteDatetime`). Re-vehicled in Round 191 from measurements to checks: each
// is refused at the record check, in the tool's voice, naming its own field and value, before any
// channel is classified, with nothing written and no snapshot left.
const vRefused = (r: ReturnType<typeof undoWith>, field: string, value: string) => {
  const err = cliLines(r.err);
  return (
    r.code === 1 &&
    err.some((l) => l.startsWith('not a backfill undo record:')) &&
    err.includes(`channels[0].${field} is ${JSON.stringify(value)}, expected null or a YYYY-MM-DD HH:MM:SS timestamp`) &&
    err.some((l) => l.includes('Nothing was written and the snapshot was discarded.')) &&
    labelFor(r.out, W) === '(no line)' &&
    !r.wrote &&
    r.snaps === 0
  );
};
const v1 = undoWith(vFuture);
check(
  'V1',
  'toAddedAt "9999-99-99 99:99:99" on the run\'s own record is refused at the record check: exit 1, field and value named, nothing written',
  vRefused(v1, 'toAddedAt', '9999-99-99 99:99:99'),
  `exit ${v1.code} · wren ${labelFor(v1.out, W)} · wrote ${v1.wrote ? 'SOMETHING' : 'nothing'} · ${v1.snaps} snapshot(s) · stderr ${JSON.stringify(cliLines(v1.err))}`
);
const vFrom = vRec ? editedRecord(vRec, 'v-from', (c) => (c.fromAddedAt = '0000-00-00 00:00:00')) : '';
const v2 = undoWith(vFrom);
check(
  'V2',
  'fromAddedAt "0000-00-00 00:00:00" is refused the same way, so it is never written into the default\'s binding',
  vRefused(v2, 'fromAddedAt', '0000-00-00 00:00:00') && addedAt(W, DEFAULT_ENTITY_ID) === null,
  `exit ${v2.code} · wren ${labelFor(v2.out, W)} · default's added_at on wren ${JSON.stringify(addedAt(W, DEFAULT_ENTITY_ID))} · stderr ${JSON.stringify(cliLines(v2.err))}`
);

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
