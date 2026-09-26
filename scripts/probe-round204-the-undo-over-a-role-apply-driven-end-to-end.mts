/**
 * Round 204 — the undo over a role apply, driven end to end.
 *
 * Daedalus, 2026-09-13 STOP fire. Theseus's Round 203 §7 named the one thing
 * nobody had done: "the undo path over a role-basis apply is untested from this
 * seat. Nobody has driven undo after a 9-entity, 821-row role apply."
 *
 * Round 202 changed the apply path in a way that bears directly on undo. Before
 * it, every applied row resolved its target by name, so one name meant one
 * entity id. `role-title` sets `reuseByName: false`, so **one apply run can mint
 * two entities carrying the same name** (the two Comms Chiefs on xian's March
 * corpus). Undo's minted-entity removal reads ids out of the record, but the
 * record is written by the same path that changed. That is the seam this probe
 * drives.
 *
 * Arms A–F drive the real corpus through apply → undo and compare the database
 * to itself before and after, column by column, including `channel_entities.
 * added_at` — the field a restore is most likely to get approximately right.
 * Arm G drives the conditional-removal branch (an entity minted by the run and
 * seated elsewhere afterwards is not the run's to delete) on a *role* apply,
 * which is the branch that has only ever been exercised on identity-claim.
 * Arm Z asserts nothing was written outside `.testdata/`.
 *
 * Everything runs against copies. The source backup is hashed before and after.
 *
 * Run: npx tsx scripts/probe-round204-the-undo-over-a-role-apply-driven-end-to-end.mts
 */

import Database from 'better-sqlite3';
import { execFileSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const WORK = path.join(ROOT, '.testdata', 'r204');
const CORPUS = '/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14';
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const BASES = '--bases=identity-claim,role-title';

let checks = 0;
let failed = 0;
let open = 0;
let meas = 0;

const pass = (id: string, why: string, detail = '') => {
  checks++;
  console.log(`  [PASS] ${id} · ${why}${detail ? ` — ${detail}` : ''}`);
};
const fail = (id: string, why: string, detail = '') => {
  checks++;
  failed++;
  console.log(`  [FAIL] ${id} · ${why}${detail ? ` — ${detail}` : ''}`);
};
const check = (id: string, cond: boolean, why: string, detail = '') =>
  cond ? pass(id, why, detail) : fail(id, why, detail);
const open_ = (id: string, why: string) => {
  open++;
  console.log(`  [OPEN] ${id} · ${why}`);
};
const measure = (id: string, what: string) => {
  meas++;
  console.log(`  [MEAS] ${id}: ${what}`);
};

fs.mkdirSync(WORK, { recursive: true });

const sha = (p: string) =>
  crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);

const runCli = (args: string[]) => {
  try {
    return {
      code: 0,
      out: execFileSync('npx', ['tsx', CLI, ...args], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' }),
    };
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

/**
 * The state an undo is supposed to restore, as data rather than as a file hash.
 *
 * Deliberately not `SELECT *` and not a hash of the file: a writing run migrates
 * the schema on the way in (`getDb()` runs migrations), so a file-level or
 * `SELECT *` comparison would report a schema change as a failed undo. These
 * four projections are the ones the backfill writes and are present before and
 * after any migration. `added_at` is in there on purpose — it is the column an
 * undo is likeliest to restore approximately, and the reason
 * `BackfillUndoChannel.fromAddedAt` exists at all.
 */
function stateOf(file: string) {
  const db = new Database(file, { readonly: true, fileMustExist: true });
  const rows = (sql: string) => db.prepare(sql).all() as Record<string, unknown>[];
  const state = {
    bindings: rows(
      'SELECT channel_id, entity_id, added_at FROM channel_entities ORDER BY channel_id, entity_id'
    ),
    stamps: rows(
      'SELECT id, entity_id FROM messages WHERE entity_id IS NOT NULL ORDER BY id'
    ),
    nulls: (db.prepare('SELECT COUNT(*) AS n FROM messages WHERE entity_id IS NULL').get() as {
      n: number;
    }).n,
    entities: rows('SELECT id, name FROM entities ORDER BY id'),
  };
  db.close();
  return {
    ...state,
    digest: crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex').slice(0, 16),
  };
}

/** First difference between two states, as a sentence, or '' if identical. */
function firstDiff(a: ReturnType<typeof stateOf>, b: ReturnType<typeof stateOf>) {
  for (const key of ['bindings', 'stamps', 'entities'] as const) {
    const x = a[key] as Record<string, unknown>[];
    const y = b[key] as Record<string, unknown>[];
    if (x.length !== y.length) return `${key}: ${x.length} rows before, ${y.length} after`;
    for (let i = 0; i < x.length; i++) {
      if (JSON.stringify(x[i]) !== JSON.stringify(y[i]))
        return `${key}[${i}]: ${JSON.stringify(x[i])} → ${JSON.stringify(y[i])}`;
    }
  }
  if (a.nulls !== b.nulls) return `messages with NULL entity_id: ${a.nulls} → ${b.nulls}`;
  return '';
}

/** Close a hand-opened handle the way the CLI's WAL guard requires. */
function closeClean(db: Database.Database, file: string) {
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();
  for (const side of ['-wal', '-shm']) {
    const p = file + side;
    if (fs.existsSync(p) && fs.statSync(p).size === 0) fs.rmSync(p, { force: true });
  }
}

const num = (out: string, re: RegExp) => {
  const m = out.match(re);
  return m ? Number(m[1]) : NaN;
};

console.log('='.repeat(78));
console.log('Round 204 — the undo over a role apply, driven end to end');
console.log('='.repeat(78));

const corpusReachable = fs.existsSync(CORPUS);
const corpusBefore = corpusReachable ? sha(CORPUS) : '';

if (!corpusReachable) {
  console.log(`\nCorpus not reachable at ${CORPUS} — arms A–G measure nothing this run.`);
  open_('A–G', 'the real corpus was not present; the role apply/undo pair was not driven');
} else {
  // -------------------------------------------------------------------------
  console.log('\nArm A — apply the role basis to a copy of the March corpus');
  const DB = path.join(WORK, 'apply-undo.db');
  fs.copyFileSync(CORPUS, DB);
  for (const side of ['-wal', '-shm']) fs.rmSync(DB + side, { force: true });

  // Before-state is read *after* nothing has been written: the CLI migrates on
  // its way in, and these four projections survive migration, so this is a fair
  // baseline for the after-state comparison in arm D.
  const before = stateOf(DB);
  measure(
    'A0',
    `baseline ${before.bindings.length} bindings, ${before.stamps.length} stamped rows, ` +
      `${before.nulls} NULL, ${before.entities.length} entities, digest ${before.digest}`
  );

  const applied = runCli([DB, BASES, '--apply']);
  check('A1', applied.code === 0, 'the role apply exits 0', `code ${applied.code}`);
  const reP2 = /message rows re-stamped: (\d+) P2/;
  const p2 = num(applied.out, reP2);
  const p3 = num(applied.out, /P2 \(were `default-entity`\), (\d+) P3/);
  const appliedN = num(applied.out, /Applied: (\d+) channel\(s\) re-pointed/);
  const mintedN = num(applied.out, /re-pointed, (\d+) agent\(s\) minted/);
  check('A2', appliedN === 9, 'nine channels re-pointed', `${appliedN}`);
  check('A3', mintedN === 9, 'nine agents minted', `${mintedN}`);
  check('A4', p2 === 821 && p3 === 0, 'the sheet is Theseus\'s 821 P2 / 0 P3', `${p2} P2, ${p3} P3`);

  const recordPath = applied.out.match(/Undo record: (.+)/)?.[1]?.trim() ?? '';
  check('A5', recordPath !== '' && fs.existsSync(recordPath), 'an undo record was written', recordPath);

  const afterApply = stateOf(DB);
  measure(
    'A6',
    `after apply: ${afterApply.entities.length} entities (+${afterApply.entities.length - before.entities.length}), ` +
      `${afterApply.stamps.length} stamped (+${afterApply.stamps.length - before.stamps.length})`
  );

  // -------------------------------------------------------------------------
  console.log('\nArm B — the two same-named agents Round 202 mints are two distinct ids');
  const record = JSON.parse(fs.readFileSync(recordPath, 'utf8')) as {
    channels: { channelId: string; fromEntityId: string; toEntityId: string; mintedHere: boolean;
      fromAddedAt?: string | null; p2MessageIds: string[]; p3MessageIds: string[] }[];
  };
  const mintedIds = [...new Set(record.channels.filter((c) => c.mintedHere).map((c) => c.toEntityId))];
  const byId = new Map(afterApply.entities.map((e) => [e.id as string, e.name as string]));
  const names = mintedIds.map((id) => byId.get(id) ?? '(missing)');
  // Normalized, because that is what the collision warning compares. Written
  // against the raw strings first, and it failed: the two Comms Chiefs are
  // stored as `tech-savvy communications chief` and `tech-savvy Communications
  // Chief`. The collision the sheet reports is a normalized one; the two rows
  // the operator ends up looking at differ by case, which B2b states outright.
  const norm = (s: string) => s.trim().toLowerCase();
  const dupNames = names.filter((n, i) => names.findIndex((m) => norm(m) === norm(n)) !== i);
  check('B1', mintedIds.length === 9, 'the record holds nine distinct minted ids', `${mintedIds.length}`);
  check(
    'B2',
    dupNames.length === 1,
    'exactly one name is carried by two of them (the Comms Chiefs)',
    dupNames.join(', ') || '(none)'
  );
  const dupPair = names.filter((n) => norm(n) === norm(dupNames[0] ?? '\u0000'));
  check(
    'B2b',
    dupPair.length === 2 && dupPair[0] !== dupPair[1],
    'and the two agents the operator sees differ only in case',
    dupPair.join(' / ')
  );
  measure('B3', `minted names: ${names.join(' | ')}`);
  check(
    'B4',
    record.channels.every((c) => c.fromEntityId === 'default-entity'),
    'every reverted binding goes back to `default-entity`'
  );
  const recordP2 = record.channels.reduce((n, c) => n + c.p2MessageIds.length, 0);
  check('B5', recordP2 === 821, 'the record carries all 821 P2 ids', `${recordP2}`);
  const withAddedAt = record.channels.filter((c) => c.fromAddedAt).length;
  check(
    'B6',
    withAddedAt === record.channels.length,
    'every channel carries its original added_at',
    `${withAddedAt}/${record.channels.length}`
  );

  // -------------------------------------------------------------------------
  console.log('\nArm C — undo the run');
  const undone = runCli([DB, `--undo=${recordPath}`]);
  check('C1', undone.code === 0, 'the undo exits 0', `code ${undone.code}`);
  const reverted = num(undone.out, /Reverted (\d+) channel\(s\)/);
  const removed = num(undone.out, /Agents removed: (\d+)/);
  check('C2', reverted === 9, 'nine channels reverted', `${reverted}`);
  check('C3', removed === 9, 'nine minted agents removed', `${removed}`);
  check('C4', !/kept because/.test(undone.out), 'nothing was kept back');

  // -------------------------------------------------------------------------
  console.log('\nArm D — the database is what it was, column by column');
  const after = stateOf(DB);
  const diff = firstDiff(before, after);
  check('D1', diff === '', 'bindings, stamps and entities are identical to the baseline', diff || `digest ${after.digest}`);
  check(
    'D2',
    before.digest === after.digest,
    'the state digest matches',
    `${before.digest} vs ${after.digest}`
  );
  // Stated separately from D1 because it is the one an undo can plausibly get
  // wrong while looking right: re-INSERT with the undo's clock instead of the
  // original's is a correct-looking restore that has silently re-dated 72 rows.
  const beforeAdded = new Map(before.bindings.map((b) => [`${b.channel_id}|${b.entity_id}`, b.added_at]));
  const drifted = after.bindings.filter(
    (b) => beforeAdded.get(`${b.channel_id}|${b.entity_id}`) !== b.added_at
  );
  check('D3', drifted.length === 0, 'no restored binding was re-dated', `${drifted.length} drifted`);

  // -------------------------------------------------------------------------
  console.log('\nArm E — undoing twice');
  const again = runCli([DB, `--undo=${recordPath}`]);
  check('E1', again.code === 0, 'the second undo exits 0', `code ${again.code}`);
  check('E2', num(again.out, /Reverted (\d+) channel\(s\)/) === 0, 'it reverts nothing');
  check('E3', num(again.out, /Agents removed: (\d+)/) === 0, 'it removes no agent');
  const afterTwice = stateOf(DB);
  check('E4', afterTwice.digest === before.digest, 'and the database is still the baseline');

  // -------------------------------------------------------------------------
  console.log('\nArm F — re-applying after an undo');
  const reapplied = runCli([DB, BASES, '--apply']);
  const reMinted = num(reapplied.out, /re-pointed, (\d+) agent\(s\) minted/);
  const reP2n = num(reapplied.out, reP2);
  check('F1', reapplied.code === 0, 're-apply exits 0', `code ${reapplied.code}`);
  check('F2', reMinted === 9 && reP2n === 821, 'the same nine agents and 821 rows are available again', `${reMinted} / ${reP2n}`);
  const record2Path = reapplied.out.match(/Undo record: (.+)/)?.[1]?.trim() ?? '';
  const record2 = JSON.parse(fs.readFileSync(record2Path, 'utf8')) as typeof record;
  const minted2 = [...new Set(record2.channels.filter((c) => c.mintedHere).map((c) => c.toEntityId))];
  check(
    'F3',
    minted2.every((id) => !mintedIds.includes(id)),
    'the second run mints fresh ids rather than reviving the deleted ones'
  );
  const undo2 = runCli([DB, `--undo=${record2Path}`]);
  check('F4', num(undo2.out, /Reverted (\d+) channel\(s\)/) === 9, 'and the second run undoes as cleanly as the first');
  check('F5', stateOf(DB).digest === before.digest, 'baseline again after apply → undo → apply → undo');

  // -------------------------------------------------------------------------
  console.log('\nArm G — a minted role agent seated elsewhere is not the undo\'s to delete');
  const G = path.join(WORK, 'kept.db');
  fs.copyFileSync(CORPUS, G);
  for (const side of ['-wal', '-shm']) fs.rmSync(G + side, { force: true });
  const gBefore = stateOf(G);
  const gApplied = runCli([G, BASES, '--apply']);
  const gRecordPath = gApplied.out.match(/Undo record: (.+)/)?.[1]?.trim() ?? '';
  const gRecord = JSON.parse(fs.readFileSync(gRecordPath, 'utf8')) as typeof record;
  const gMinted = [...new Set(gRecord.channels.filter((c) => c.mintedHere).map((c) => c.toEntityId))];
  const touched = new Set(gRecord.channels.map((c) => c.channelId));

  // Seat one minted agent on a channel the run never touched — the "a later
  // import used it" case, staged by hand.
  const gdb = new Database(G);
  const bystander = (
    gdb.prepare('SELECT id FROM channels WHERE id NOT IN (SELECT channel_id FROM channel_entities WHERE entity_id = ?) ORDER BY id').all(gMinted[0]) as { id: string }[]
  ).find((c) => !touched.has(c.id))!.id;
  gdb
    .prepare('INSERT OR IGNORE INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
    .run(bystander, gMinted[0]);
  closeClean(gdb, G);

  const gUndone = runCli([G, `--undo=${gRecordPath}`]);
  check('G1', gUndone.code === 0, 'the undo exits 0 with a survivor present', `code ${gUndone.code}`);
  check('G2', num(gUndone.out, /Reverted (\d+) channel\(s\)/) === 9, 'all nine channels still revert');
  check('G3', num(gUndone.out, /Agents removed: (\d+)/) === 8, 'eight agents removed, not nine');
  check(
    'G4',
    gUndone.out.includes(gMinted[0]),
    'the kept agent is named in the line that says why',
    gMinted[0]
  );
  const gAfter = stateOf(G);
  const survivors = gAfter.entities.filter((e) => gMinted.includes(e.id as string));
  check('G5', survivors.length === 1, 'exactly the seated one survives in `entities`', `${survivors.length}`);
  // The bystander binding is the operator's, not the run's, so it stays; every
  // other difference from the baseline would be an undo failure.
  const gExpectedExtra = 1 + 1; // the bystander binding, and the surviving entity row
  const gDelta =
    gAfter.bindings.length - gBefore.bindings.length + (gAfter.entities.length - gBefore.entities.length);
  check('G6', gDelta === gExpectedExtra, 'nothing else survives the undo', `delta ${gDelta}`);
  check(
    'G7',
    gAfter.stamps.length === gBefore.stamps.length,
    'and every one of the 821 stamps went back',
    `${gAfter.stamps.length} vs ${gBefore.stamps.length}`
  );

  // -------------------------------------------------------------------------
  console.log('\nArm H — the sheet now says what its collision check covers');
  // Theseus's §8.1, taken as a limit stated rather than a fuzzier test built.
  const H = path.join(WORK, 'sheet.db');
  fs.copyFileSync(CORPUS, H);
  for (const side of ['-wal', '-shm']) fs.rmSync(H + side, { force: true });
  const NOTE = 'What the collision check does and does not cover';
  const hRole = runCli([H, BASES]);
  const hDefault = runCli([H]);
  check('H1', hRole.out.includes(NOTE), 'a run that would mint prints the caveat');
  check(
    'H2',
    hRole.out.includes('in different words'),
    'and it names the case the check misses, not just that one exists'
  );
  check(
    'H3',
    !hDefault.out.includes(NOTE),
    'a run that would mint nothing does not print it',
    hDefault.out.match(/Candidates: .*/)?.[0] ?? ''
  );
  check(
    'H4',
    hRole.out.indexOf(NOTE) > hRole.out.indexOf('! "tech-savvy communications chief"'),
    'it reads after the collision block it qualifies'
  );
}

// ---------------------------------------------------------------------------
console.log('\nArm Z — nothing written outside .testdata/');
if (corpusReachable) {
  check('Z1', sha(CORPUS) === corpusBefore, 'the source corpus is byte-identical', corpusBefore);
}
const dirty = execFileSync('git', ['status', '--porcelain', 'packages'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim();
check('Z2', dirty === '', 'nothing under packages/ was touched', dirty.split('\n')[0] ?? '');

console.log('\n' + '='.repeat(78));
console.log(`${checks} checks · ${failed} failed · ${open} open · ${meas} measurements`);
console.log('='.repeat(78));
process.exit(failed ? 1 : 0);
