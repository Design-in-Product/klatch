/**
 * unit-465rowdelta — drive the registered arms against whatever tree it is run in.
 *
 * usage: node drive-arms.mjs <label> [arm ...]
 *
 * Each arm seeds its own database under `scratch/`, probes it, runs the backfill
 * tool, probes it again, and prints a one-line verdict plus the numbers the
 * verdict is derived from. No arm reads another arm's file.
 *
 * Deliberately a separate process per run: the tool is a script with top-level
 * `process.exit`, and `process.env.KLATCH_DB` is set inside it.
 */
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../../..');
const TOOL = path.join(REPO, 'scripts/backfill-entity-bindings.mts');
const SCRATCH = path.join(HERE, 'scratch');
fs.mkdirSync(SCRATCH, { recursive: true });

const label = process.argv[2] ?? 'unlabelled';
const want = process.argv.slice(3);

function sh(cmd, args, cwd = REPO) {
  // stdout and stderr captured separately and returned, never inherited: an
  // inherited child stderr lands in this recording interleaved with my own lines
  // and cannot be told from them afterwards.
  try {
    const stdout = execFileSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      code: err.status === undefined || err.status === null ? `signal:${err.signal}` : err.status,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

const seed = (out, kind) => sh('npx', ['tsx', path.join(HERE, 'seed.mts'), out, kind]);
const tool = (dbPath, flags) => sh('npx', ['tsx', TOOL, dbPath, ...flags]);

function sha(p) {
  return fs.existsSync(p)
    ? crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16)
    : 'ABSENT';
}

/** Row-level state of a target, read through a read-only handle so probing never migrates. */
function probe(p) {
  if (!fs.existsSync(p)) return { missing: true };
  // Opening a WAL-mode database read-only *creates* `-shm` and an empty `-wal`,
  // so this probe was manufacturing the very state the sidecar arm measures:
  // the tool's cleanup declines to remove sidecars that were there before it
  // opened the file, and before it opened the file, they were there because
  // this function had just been called. Recorded and undone, so the probe is
  // neutral with respect to the thing it is probing.
  const probeFound = Object.fromEntries(
    ['-wal', '-shm'].map((s) => [s, fs.existsSync(p + s)])
  );
  const db = new Database(p, { readonly: true, fileMustExist: true });
  const one = (sql) => {
    try {
      return Object.values(db.prepare(sql).get())[0];
    } catch {
      return 'ERR';
    }
  };
  const state = {
    // The sha of the main file is NOT a fitness key for "unchanged", and the
    // first drive of A1 proved it: the three row writes landed in `-wal` and the
    // main file's bytes never moved, so a sha-only verdict read a run that wrote
    // three rows as having left the target intact. Kept because it is still the
    // right key for the *bytes* claim, and reported beside the WAL's size so the
    // two cannot be confused; the row counts below are what "unchanged" is
    // derived from.
    sha: sha(p),
    bytes: fs.statSync(p).size,
    walBytes: fs.existsSync(p + '-wal') ? fs.statSync(p + '-wal').size : 0,
    channels: one('SELECT COUNT(*) FROM channels'),
    channel_entities: one('SELECT COUNT(*) FROM channel_entities'),
    unbound: one(
      'SELECT COUNT(*) FROM channels c LEFT JOIN channel_entities ce ON c.id = ce.channel_id WHERE ce.channel_id IS NULL'
    ),
    entities: one('SELECT COUNT(*) FROM entities'),
    files: one('SELECT COUNT(*) FROM files'),
    file_refs: one('SELECT COUNT(*) FROM file_refs'),
    legacyModels: one(
      `SELECT COUNT(*) FROM channels WHERE model IN ('claude-opus-4-20250514','claude-sonnet-4-20250514','claude-3-haiku-20240307','claude-3-5-haiku-20241022')`
    ),
    fileIds: (() => {
      try {
        return db
          .prepare('SELECT id FROM files ORDER BY id')
          .all()
          .map((r) => r.id)
          .join(',');
      } catch {
        return 'ERR';
      }
    })(),
  };
  db.close();
  for (const s of ['-wal', '-shm']) {
    if (!probeFound[s] && fs.existsSync(p + s) && fs.statSync(p + s).size === 0) {
      fs.rmSync(p + s, { force: true });
    }
  }
  // The `-shm` is 32 KB even when the `-wal` it indexes is empty, so the
  // zero-length rule above never reaches it. Removed only once the `-wal` this
  // probe created is gone, which is the same pairing rule the tool's own
  // cleanup uses.
  if (!probeFound['-shm'] && !fs.existsSync(p + '-wal')) fs.rmSync(p + '-shm', { force: true });
  return state;
}

/**
 * Did the run change what is *in* the target? Derived from the row counts and
 * the minted ids read through a handle that sees the WAL, which is the only key
 * that survives a write SQLite has not checkpointed yet.
 */
const ROW_KEYS = [
  'channels',
  'channel_entities',
  'unbound',
  'entities',
  'files',
  'file_refs',
  'legacyModels',
  'fileIds',
];
function rowsVerdict(before, after) {
  const moved = ROW_KEYS.filter((k) => before[k] !== after[k]).map(
    (k) => `${k} ${before[k]} -> ${after[k]}`
  );
  return moved.length ? `NO (${moved.join(', ')})` : 'YES';
}

/** Sidecars and leftovers beside a target, which is a separate claim from its contents. */
function beside(p) {
  const dir = path.dirname(p);
  const base = path.basename(p);
  return fs
    .readdirSync(dir)
    .filter((f) => f !== base && f.startsWith(base.replace(/\.db$/, '')))
    .sort()
    .join(' ');
}

function section(name, body) {
  console.log(`\n${'='.repeat(78)}\n== ${name}\n${'='.repeat(78)}`);
  try {
    body();
  } catch (err) {
    console.log(`ARM THREW: ${err && err.message}`);
  }
}

const say = (k, v) => console.log(`  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
const grep = (out, re) => out.split('\n').filter((l) => re.test(l));

/** One arm: fresh target, probe, run, probe. */
function arm(name, kind, flags, extra = {}) {
  const target = path.join(SCRATCH, `${label}-${name}.db`);
  for (const f of fs.readdirSync(SCRATCH)) {
    if (f.startsWith(`${label}-${name}`)) fs.rmSync(path.join(SCRATCH, f), { force: true });
  }
  const s = seed(target, kind);
  if (s.code !== 0) {
    console.log(`SEED FAILED code=${s.code}\n${s.stdout}\n${s.stderr}`);
    return;
  }
  console.log(`  seed: ${s.stdout.trim().split('\n').join(' | ')}`);
  const before = probe(target);
  const r = (extra.argv ?? ((t) => tool(t, flags)))(target);
  const after = probe(target);
  say('flags', flags.join(' ') || '(none)');
  say('exit', r.code);
  say('before', before);
  say('after', after);
  say('target rows unchanged', rowsVerdict(before, after));
  say('target bytes unchanged', before.sha === after.sha ? 'YES' : `NO (${before.sha} -> ${after.sha})`);
  say('beside target', beside(target) || '(nothing)');
  // Anchored on the block's own first token and nothing else. The first version
  // of this key also matched `^  .*row`, which the tool's long-standing
  // "message rows re-stamped:" line satisfies — so it reported "ROWS block
  // lines: 1" on a pre-cure tree that has no ROWS block at all. A containment
  // key over a file full of the word `row` is not a key for this block.
  say('ROWS block present', /^ROWS:/m.test(r.stdout));
  const rowsBlock = r.stdout.split('\n');
  const start = rowsBlock.findIndex((l) => /^ROWS:/.test(l));
  if (start >= 0) {
    const end = rowsBlock.findIndex((l, i) => i > start && l.trim() === '');
    console.log(
      rowsBlock
        .slice(start, end < 0 ? undefined : end)
        .map((l) => `    | ${l}`)
        .join('\n')
    );
  }
  const schemaBlock = grep(r.stdout, /^SCHEMA:/);
  say('SCHEMA block present', schemaBlock.length > 0);
  const refusal = grep(r.stdout + '\n' + r.stderr, /Refusing to run/);
  say('refusal', refusal.length ? refusal.join(' / ') : '(none)');
  say('nothing-to-apply line', grep(r.stdout, /Nothing to apply/).length > 0);
  if (extra.full) {
    console.log('  --- stdout ---');
    console.log(
      r.stdout
        .split('\n')
        .map((l) => `  | ${l}`)
        .join('\n')
    );
    console.log('  --- stderr ---');
    console.log(
      r.stderr
        .split('\n')
        .map((l) => `  ! ${l}`)
        .join('\n')
    );
  }
  return { target, before, after, r };
}

const ARMS = {
  A1: () => arm('A1', 'seeded', ['--apply', '--no-migrate'], { full: true }),
  A2: () => arm('A2', 'seeded', ['--apply'], { full: true }),
  A3: () => arm('A3', 'seeded', [], { full: true }),
  A4: () => arm('A4', 'clean', ['--apply', '--no-migrate'], { full: true }),
  A5: () => arm('A5', 'alias', ['--apply', '--no-migrate'], { full: true }),
  A6: () => {
    // The pristine March backup out of git, not the already-migrated file on main.
    const target = path.join(SCRATCH, `${label}-A6.db`);
    for (const f of fs.readdirSync(SCRATCH)) {
      if (f.startsWith(`${label}-A6`)) fs.rmSync(path.join(SCRATCH, f), { force: true });
    }
    const blob = execFileSync(
      'git',
      ['show', 'c945e8aa:backups/klatch.db.backup-2026-03-14'],
      { cwd: REPO, maxBuffer: 256 * 1024 * 1024 }
    );
    fs.writeFileSync(target, blob);
    const before = probe(target);
    const r = tool(target, ['--apply', '--no-migrate']);
    const after = probe(target);
    say('exit', r.code);
    say('before', before);
    say('after', after);
    say('target rows unchanged', rowsVerdict(before, after));
    say('target bytes unchanged', before.sha === after.sha ? 'YES' : 'NO');
    say('beside target', beside(target) || '(nothing)');
    say('refusal', grep(r.stdout + '\n' + r.stderr, /Refusing to run/).join(' / ') || '(none)');
    console.log('  --- stdout ---');
    console.log(r.stdout.split('\n').map((l) => `  | ${l}`).join('\n'));
    console.log('  --- stderr ---');
    console.log(r.stderr.split('\n').map((l) => `  ! ${l}`).join('\n'));
  },
  A7: () => {
    // --undo needs a record an --apply wrote. Two steps: a clean apply with no
    // --no-migrate to produce one, then the undo with the flag.
    const target = path.join(SCRATCH, `${label}-A7.db`);
    for (const f of fs.readdirSync(SCRATCH)) {
      if (f.startsWith(`${label}-A7`)) fs.rmSync(path.join(SCRATCH, f), { force: true });
    }
    const s = seed(target, 'seeded');
    console.log(`  seed: ${s.stdout.trim()}`);
    // Give it something to move so a record gets written: bind the unbound
    // channel to the default and let the backfill see a candidate.
    const db = new Database(target);
    db.prepare(
      `INSERT OR IGNORE INTO channel_entities (channel_id, entity_id) VALUES ('ch-unbound', 'default-entity')`
    ).run();
    // `identity-claim`'s first pattern, read off `entity-guess.ts:118` this fire
    // rather than guessed: the opening turn has to *assign* the identity. The
    // first version of this arm wrote "I am <name>", which matches none of the
    // four patterns, so the apply moved nothing, wrote no record, and the arm
    // voided for want of an input rather than for anything about the subject.
    // The claim has to be in the channel's *opening* turn, so it replaces `m1`
    // rather than arriving behind it: appending a second message left "hi" as
    // the opener and the guess saw no claim at all.
    db.prepare(
      `UPDATE messages SET content = 'you are Daedalus, picking up where we left off' WHERE id = 'm1'`
    ).run();
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
    for (const suffix of ['-wal', '-shm']) fs.rmSync(target + suffix, { force: true });
    const first = tool(target, ['--apply']);
    say('seeding apply exit', first.code);
    const record = fs
      .readdirSync(SCRATCH)
      .filter((f) => f.startsWith(`.${path.basename(target)}`) || f.includes('.backfill-'))
      .filter((f) => f.includes(path.basename(target, '.db')) || f.startsWith('.backfill-'));
    say('records found', record.join(' ') || '(none)');
    if (!record.length) {
      console.log('  ARM VOID: no undo record was written, so --undo has no input');
      return;
    }
    // Re-seed site 2/3/4 inputs so the undo run has row writes pending again.
    const db2 = new Database(target);
    db2.prepare(`DELETE FROM channel_entities WHERE channel_id = 'ch-unbound'`).run();
    // `file_refs` first: it references `files`, and the other order throws a
    // foreign key failure that reads like a finding about the subject.
    db2.prepare(`DELETE FROM file_refs`).run();
    db2.prepare(`DELETE FROM files`).run();
    db2.pragma('wal_checkpoint(TRUNCATE)');
    db2.close();
    for (const suffix of ['-wal', '-shm']) fs.rmSync(target + suffix, { force: true });
    const before = probe(target);
    const r = tool(target, [`--undo=${path.join(SCRATCH, record[0])}`, '--no-migrate']);
    const after = probe(target);
    say('exit', r.code);
    say('before', before);
    say('after', after);
    say('target rows unchanged', rowsVerdict(before, after));
    say('target bytes unchanged', before.sha === after.sha ? 'YES' : 'NO');
    say('refusal', grep(r.stdout + '\n' + r.stderr, /Refusing to run/).join(' / ') || '(none)');
    console.log('  --- stdout ---');
    console.log(r.stdout.split('\n').map((l) => `  | ${l}`).join('\n'));
    console.log('  --- stderr ---');
    console.log(r.stderr.split('\n').map((l) => `  ! ${l}`).join('\n'));
  },
  // Unregistered, added after P6SNAPSHOT was refuted: the refusal path and the
  // dry run both left `-wal` and `-shm` beside a target they do not write.
  A9: () => {
    const r1 = arm('A9refuse', 'seeded', ['--apply', '--no-migrate']);
    const r2 = arm('A9dry', 'seeded', []);
    const r3 = arm('A9clean', 'clean', ['--apply', '--no-migrate']);
    if (!r1 || !r2 || !r3) return;
    // A writing run that is NOT refused legitimately leaves sidecars — getDb()
    // opens the target for writing after this cure has run, so the arm that
    // would make the cure look universal is the one to drive beside it.
    const r4 = arm('A9wrote', 'seeded', ['--apply']);
    say('refused: beside target', beside(r1.target) || '(nothing)');
    say('dry: beside target', beside(r2.target) || '(nothing)');
    say('clean pass-through: beside target', beside(r3.target) || '(nothing)');
    say('wrote: beside target', r4 ? beside(r4.target) || '(nothing)' : 'n/a');
  },
  // P5DRYINTACT's second half: a dry run against the pristine March backup.
  A10: () => {
    const target = path.join(SCRATCH, `${label}-A10.db`);
    for (const f of fs.readdirSync(SCRATCH)) {
      if (f.startsWith(`${label}-A10`)) fs.rmSync(path.join(SCRATCH, f), { force: true });
    }
    const blob = execFileSync('git', ['show', 'c945e8aa:backups/klatch.db.backup-2026-03-14'], {
      cwd: REPO,
      maxBuffer: 256 * 1024 * 1024,
    });
    fs.writeFileSync(target, blob);
    const beforeSha = sha(target);
    const r = tool(target, []);
    say('exit', r.code);
    say('bytes', fs.statSync(target).size);
    say('target bytes unchanged', beforeSha === sha(target) ? 'YES' : 'NO');
    say('beside target', beside(target) || '(nothing)');
    say('SCHEMA block present', /^SCHEMA:/m.test(r.stdout));
    say('ROWS block present', /^ROWS:/m.test(r.stdout));
  },
  A8: () => {
    // Twice over two independently seeded copies of the same shape: the reported
    // counts must agree and no minted id may appear in the output.
    const one = arm('A8a', 'seeded', ['--apply']);
    const two = arm('A8b', 'seeded', ['--apply']);
    if (!one || !two) return;
    const rows = (r) => grep(r.stdout, /^    [+-]\d/).join(' ; ');
    say('A8a rows', rows(one.r) || '(none)');
    say('A8b rows', rows(two.r) || '(none)');
    say('rows agree', rows(one.r) === rows(two.r) ? 'YES' : 'NO');
    say('A8a file ids', one.after.fileIds);
    say('A8b file ids', two.after.fileIds);
    say('ids differ', one.after.fileIds !== two.after.fileIds ? 'YES' : 'NO');
    const idInOutput = (r, ids) =>
      ids.split(',').filter((id) => id && (r.stdout + r.stderr).includes(id));
    say('A8a ids printed', idInOutput(one.r, one.after.fileIds).join(',') || '(none)');
    say('A8b ids printed', idInOutput(two.r, two.after.fileIds).join(',') || '(none)');
  },
};

console.log(`unit-465rowdelta drive — label=${label}`);
console.log(`tree HEAD: ${sh('git', ['rev-parse', 'HEAD']).stdout.trim()}`);
console.log(`dirty: ${sh('git', ['status', '--porcelain']).stdout.trim().split('\n').length} path(s)`);
for (const [name, fn] of Object.entries(ARMS)) {
  if (want.length && !want.includes(name)) continue;
  section(name, fn);
}
console.log('\ndrive complete');
