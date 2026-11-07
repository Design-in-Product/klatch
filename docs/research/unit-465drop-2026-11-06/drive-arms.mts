/**
 * unit-465drop — drive the registered arms.
 *
 * usage: npx tsx drive-arms.mts <arm> [<arm> …]      (or `all`)
 *
 * Each arm re-seeds its own input so no arm inherits a previous arm's writes or
 * sidecars. Every run of the subject is `execFileSync` with stdout and stderr
 * captured **separately** — the tool's refusals go to stderr, and a merged
 * recording cannot say which stream a line came from.
 *
 * ## The cripple discipline, and why it is a byte copy and not `git checkout`
 *
 * The cripples patch `packages/server/src/db/index.ts` in the working tree, because
 * the thing under test is what `applySchema` does and there is no seam to inject
 * at. The patch is **env-gated**, so a patched tree still behaves normally for any
 * child without the variable set — which is what lets the controls run against the
 * same tree as the cripples.
 *
 * Restore is from a byte copy taken **immediately before** the patch, not from
 * `HEAD`. In `unit-465rowdelta` X3 a restore-from-`HEAD` silently discarded a cure
 * that was still only in the working tree; the whole arm graded the wrong file. A
 * pre-action copy cannot do that. The copy's `shasum` and the restored file's
 * `shasum` are both printed, so "restored" is a measurement and not a claim.
 *
 * Nothing here asserts. It prints what it read, including the raw exit code, and
 * RESULTS.md grades it.
 */
import { execFileSync } from 'child_process';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const UNIT = import.meta.dirname;
const SCRATCH = path.join(ROOT, '.testdata/u465drop');
const TOOL = 'scripts/backfill-entity-bindings.mts';
const SUBJECT = path.join(ROOT, 'packages/server/src/db/index.ts');

fs.mkdirSync(SCRATCH, { recursive: true });

type Cripple = 'Y1' | 'Y2' | 'Y3';

/** The tail of `runMigrations`, used as the insertion anchor. Unique in the file. */
const ANCHOR = `    ).run(ch.id, DEFAULT_ENTITY_ID);
  }
}`;

/**
 * The env-gated block the cripples install. Y1's recreate deliberately **reorders**
 * the columns (`created_at` ahead of `content`): a recreate that matched the
 * current text byte for byte would land in `alteredTables` rather than
 * `rebuiltTables`, and the arm is registered against the key Theseus reported.
 */
const CRIPPLE_BLOCK = `
  // ── unit-465drop cripple — env-gated, installed by the unit's driver and
  // restored from a pre-action byte copy. Never committed; see the unit's
  // RESULTS.md for the shasum either side.
  const u465drop = process.env.U465DROP_CRIPPLE;
  if (u465drop === 'Y2') {
    db.exec(\`DROP TABLE IF EXISTS message_artifacts;\`);
  } else if (u465drop === 'Y1') {
    db.exec(\`
      DROP TABLE IF EXISTS message_artifacts;
      CREATE TABLE message_artifacts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        tool_name TEXT,
        input_summary TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        content TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_message_artifacts_message_id ON message_artifacts(message_id);
    \`);
  } else if (u465drop === 'Y3') {
    db.exec(\`DROP INDEX IF EXISTS idx_message_artifacts_message_id;\`);
  }
}`;

const sha = (p: string) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);

let installed = false;
let savedBytes: Buffer | undefined;
let savedSha = '';

/** Install the env-gated cripple block once per driver run. Idempotent. */
function installCripples(): void {
  if (installed) return;
  savedBytes = fs.readFileSync(SUBJECT);
  savedSha = sha(SUBJECT);
  const src = savedBytes.toString('utf8');
  const hits = src.split(ANCHOR).length - 1;
  if (hits !== 1) throw new Error(`anchor found ${hits} times in ${SUBJECT}, refusing to patch`);
  fs.writeFileSync(SUBJECT, src.replace(ANCHOR, ANCHOR.slice(0, -1).trimEnd() + '\n' + CRIPPLE_BLOCK.slice(1)));
  installed = true;
  console.log(`  cripples installed: ${SUBJECT} ${savedSha} -> ${sha(SUBJECT)}`);
}

function restoreSubject(): void {
  if (!installed || !savedBytes) return;
  fs.writeFileSync(SUBJECT, savedBytes);
  installed = false;
  const now = sha(SUBJECT);
  console.log(
    `  subject restored: shasum before=${savedSha} after=${now} ${now === savedSha ? 'IDENTICAL' : '!! DIFFERENT'}`
  );
  console.log(`  grep -c U465DROP_CRIPPLE in subject: ${(fs.readFileSync(SUBJECT, 'utf8').split('U465DROP_CRIPPLE').length - 1)}`);
}

function seed(target: string, kind: string): void {
  const out = execFileSync('npx', ['tsx', path.join(UNIT, 'seed.mts'), target, kind], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(`  seed: ${out.trim().split('\n').filter((l) => l.startsWith('seeded')).join(' ')}`);
}

/** Every file beside the target, so a leftover cannot be missed by asking only about the two expected. */
function beside(target: string): string {
  const dir = path.dirname(target);
  const base = path.basename(target);
  const found = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(base) && f !== base)
    .sort()
    .map((f) => `${f.slice(base.length)}:${fs.statSync(path.join(dir, f)).size}B`);
  return found.length ? found.join(' ') : '(nothing)';
}

/**
 * Row counts plus the object list, so "the table is gone" and "the index is gone"
 * are both read off the file rather than inferred from the exit code.
 *
 * This read-only open creates sidecars of its own — the subject's own §5 defect.
 * Removed here so a *later* `beside()` reads the subject's leftovers and not this
 * instrument's. `beside()` is always called before this, never after.
 */
function counts(target: string): string {
  const d = new Database(target, { readonly: true });
  const n = (t: string) => {
    try {
      return String(d.prepare(`SELECT COUNT(*) FROM "${t}"`).pluck().get());
    } catch {
      return 'ABSENT';
    }
  };
  const idx = (
    d.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`).all(
      'idx_message_artifacts_message_id'
    ) as unknown[]
  ).length
    ? 'present'
    : 'ABSENT';
  const row = `channels=${n('channels')} channel_entities=${n('channel_entities')} messages=${n('messages')} message_artifacts=${n('message_artifacts')} idx_message_artifacts_message_id=${idx}`;
  d.close();
  for (const s of ['-wal', '-shm']) fs.rmSync(target + s, { force: true });
  return row;
}

function run(target: string, extra: string[], cripple?: Cripple): { code: number; out: string; err: string } {
  const args = ['tsx', TOOL, target, '--apply', '--no-migrate', ...extra];
  const env = { ...process.env, ...(cripple ? { U465DROP_CRIPPLE: cripple } : {}) };
  try {
    const out = execFileSync('npx', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });
    return { code: 0, out, err: '' };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? -1, out: err.stdout ?? '', err: err.stderr ?? '' };
  }
}

/** `schemaDelta()`'s answer, field by field, read from the TypeScript source via tsx. */
function delta(target: string, cripple?: Cripple): string {
  return execFileSync('npx', ['tsx', path.join(UNIT, 'delta-print.mts'), target], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...(cripple ? { U465DROP_CRIPPLE: cripple } : {}) },
  });
}

function header(id: string, what: string): void {
  console.log(`\n${'='.repeat(78)}\n${id} — ${what}\n${'='.repeat(78)}`);
}

/** One crippled arm: seed uncrippled, print the delta, run the tool, read the file. */
function crippledArm(id: string, what: string, cripple: Cripple, kind = 'artifact'): void {
  header(id, what);
  installCripples();
  const t = path.join(SCRATCH, `${id.toLowerCase()}.db`);
  // The cripple is passed to the subject's children only, never to `seed()`: Y2
  // removes the table the `artifact` seed has to insert into, so a seed built by
  // the crippled path is not the input the arm registered.
  seed(t, kind);
  console.log(`  counts before: ${counts(t)}`);
  console.log(`  --- schemaDelta(), field by field (${cripple} in the child) ---`);
  console.log(delta(t, cripple));
  const r = run(t, [], cripple);
  console.log(`  exit=${r.code}`);
  console.log(`  counts after: ${counts(t)}`);
  console.log(`  --- stdout ---\n${r.out}\n  --- stderr ---\n${r.err}`);
}

function plainArm(id: string, what: string, kind: string): void {
  header(id, what);
  const t = path.join(SCRATCH, `${id.toLowerCase()}.db`);
  seed(t, kind);
  console.log(`  counts before: ${counts(t)}`);
  console.log(`  --- schemaDelta(), field by field (uncrippled) ---`);
  console.log(delta(t));
  const r = run(t, []);
  console.log(`  exit=${r.code}`);
  console.log(`  beside after: ${beside(t)}`);
  console.log(`  counts after: ${counts(t)}`);
  console.log(`  --- stdout ---\n${r.out}\n  --- stderr ---\n${r.err}`);
}

const arms: Record<string, () => void> = {
  // A1/A3 share a body: the same cripple on the pre-cure and post-cure tree. The
  // driver cannot tell which tree it is on, which is the point — the arm is
  // identical and only the subject changes.
  DROP: () => crippledArm('DROP', 'pure drop of a populated table (Theseus Y2)', 'Y2'),
  RECREATE: () => crippledArm('RECREATE', 'drop AND recreate, reordered columns (Theseus Y1)', 'Y1'),
  INDEX: () => crippledArm('INDEX', 'drop the index only, table left alone', 'Y3'),
  CLEAN: () => plainArm('CLEAN', 'CONTROL: current schema, nothing pending', 'clean'),
  ARTIFACT: () => plainArm('ARTIFACT', 'CONTROL: current schema, one thinking artifact', 'artifact'),
  MARCH: () =>
    plainArm('MARCH', "CONTROL: a copy of the 2026-03-14 backup as it is on disk today", 'march'),
  MARCHGIT: () =>
    plainArm('MARCHGIT', 'CONTROL: the genuine behind-schema March blob, out of c945e8aa', 'marchgit'),
};

const want = process.argv.slice(2);
const order = want.length === 0 || want[0] === 'all' ? Object.keys(arms) : want;
try {
  for (const id of order) {
    const fn = arms[id];
    if (!fn) {
      console.log(`\n!! no such arm: ${id}`);
      continue;
    }
    fn();
  }
} finally {
  // In a `finally` so a throw mid-arm cannot leave the cripple in the tree.
  restoreSubject();
}
