/**
 * Round 253 — is `KLATCH_DB` in `.env` inert? Driven, not read.
 *
 * My own Round 251 log recorded this as composed-but-not-driven:
 *
 *   > ESM imports hoist, so `index.ts`'s imports (lines 26-31) evaluate *before*
 *   > `dotenv.config()` (line 25), and `db/index.ts:7` reads `KLATCH_DB` at module
 *   > top level — so a `KLATCH_DB` in `.env` is **inert** today [...] **not driven
 *   > end to end**, because driving it needs a line in the real `.env`.
 *
 * It does not need a line in the *real* `.env`. `findEnv()` in `index.ts` walks
 * UP from `packages/server/src`, so `packages/server/.env` is found first and
 * shadows the repo-root one — and `.gitignore:6` is a bare `.env`, so that path
 * is ignored too (`git check-ignore -v` confirms). That is the whole reason this
 * could be driven this fire and not last.
 *
 * Three arms. Each PRINTS what it observed and asserts the INVARIANT the remedy
 * establishes rather than the defect the remedy removes — Theseus's Round 252 §4
 * rule, which he wrote about two arms of his own that died of their own success.
 * So: red at HEAD, green after the change, and it stays green afterwards instead
 * of becoming a pin on a defect that no longer exists.
 *
 *   A1  a value assigned to process.env AFTER the module is imported is honoured
 *   A2  an explicit caller's KLATCH_DB beats a `.env` line (precedence)
 *   A3  a `.env` line alone reaches the database path (this is the inert one)
 *
 * A3 is the decisive arm and the dangerous one: at HEAD it opens the real
 * `klatch.db` in the worktree root and runs `initSchema()`/`runMigrations()`
 * against it. A byte copy of `klatch.db` and both WAL sidecars is taken before
 * the arm and restored after, with the sha256 re-checked — the same guard
 * Theseus used in Round 252 §8. 0 model calls; every write is under `.testdata/`
 * or the gitignored scratch `.env`.
 */

import { spawn, spawnSync } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SCRATCH = path.join(ROOT, '.testdata', 'r253');
const SCRATCH_ENV = path.join(ROOT, 'packages', 'server', '.env');
const ENTRY = path.join(ROOT, 'packages', 'server', 'src', 'index.ts');
const REAL_DB = path.join(ROOT, 'klatch.db');

type Arm = { id: string; claim: string; ok: boolean; detail: string };
const arms: Arm[] = [];
const record = (id: string, claim: string, ok: boolean, detail: string) => {
  arms.push({ id, claim, ok, detail });
  console.log(`[${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}\n      ${detail}`);
};

const sha = (p: string) =>
  fs.existsSync(p) ? createHash('sha256').update(fs.readFileSync(p)).digest('hex') : null;

// ---------------------------------------------------------------- scratch setup

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

if (fs.existsSync(SCRATCH_ENV)) {
  console.error(`REFUSING: ${SCRATCH_ENV} already exists — not mine to overwrite.`);
  process.exit(2);
}

const cleanup: Array<() => void> = [];
const runCleanup = () => {
  while (cleanup.length) cleanup.pop()!();
};
process.on('exit', runCleanup);

// ------------------------------------------------------------------ arm 1: late

// A child that imports db/index.js and only THEN assigns KLATCH_DB. The import
// is hoisted above the assignment by ESM, which is exactly the shape
// `dotenv.config()` sits in inside index.ts — the assignment lands after the
// module body has already read the environment.
const A1_EARLY = path.join(SCRATCH, 'a1-early.db');
const A1_LATE = path.join(SCRATCH, 'a1-late.db');
const a1Child = path.join(SCRATCH, 'a1-child.mts');
fs.writeFileSync(
  a1Child,
  `import { getDb } from '${path.join(ROOT, 'packages/server/src/db/index.ts').replace(/\\/g, '/')}';\n` +
    `process.env.KLATCH_DB = process.env.R253_LATE!;\n` +
    `const db = getDb();\n` +
    `const rows = db.prepare('PRAGMA database_list').all() as Array<{ file: string }>;\n` +
    `console.log('OPENED=' + rows[0].file);\n`,
);

const a1 = spawnSync('npx', ['tsx', a1Child], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, KLATCH_DB: A1_EARLY, R253_LATE: A1_LATE },
});
const a1Opened = (a1.stdout.match(/OPENED=(.*)/) ?? [])[1]?.trim() ?? '(no OPENED line)';
record(
  'A1',
  'a KLATCH_DB assigned after db/index.js is imported is the one that gets opened',
  a1Opened === A1_LATE,
  `exit=${a1.status} opened=${a1Opened}\n      late=${A1_LATE}\n      early(pre-import)=${A1_EARLY}` +
    (a1.status !== 0 ? `\n      stderr: ${a1.stderr.trim().split('\n').slice(-3).join(' / ')}` : ''),
);

// --------------------------------------------- helper: boot the real entrypoint

function bootServer(label: string, extraEnv: Record<string, string>): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', ENTRY], {
      cwd: ROOT,
      env: { ...process.env, PORT: '0', ...extraEnv },
    });
    let out = '';
    let settled = false;
    const finish = (why: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child.kill('SIGTERM');
      } catch {
        /* already gone */
      }
      // Give it a beat to close its sqlite handle before anyone reads the file.
      setTimeout(() => resolve(`${why} :: ${out.trim().split('\n').slice(-2).join(' / ')}`), 400);
    };
    const timer = setTimeout(() => finish('TIMEOUT'), 25_000);
    child.stdout.on('data', (b) => {
      out += b;
      if (/running on http/.test(out)) finish('BOOTED');
    });
    child.stderr.on('data', (b) => {
      out += b;
    });
    child.on('exit', (code) => finish(`EXITED(${code})`));
    console.log(`      [${label}] booting real entrypoint with PORT=0 ...`);
  });
}

// Both server arms need a shadowing `.env`. Registered for cleanup the moment it
// is written, so an exception between here and the end still removes it.
function writeScratchEnv(lines: string[]) {
  fs.writeFileSync(SCRATCH_ENV, lines.join('\n') + '\n');
  cleanup.push(() => fs.rmSync(SCRATCH_ENV, { force: true }));
}

// ------------------------------------------------------- arm 2: caller vs .env

const A2_CALLER = path.join(SCRATCH, 'a2-caller.db');
const A2_ENVFILE = path.join(SCRATCH, 'a2-envfile.db');
writeScratchEnv([
  '# Round 253 scratch — written and removed by this probe. Gitignored.',
  'ANTHROPIC_API_KEY=r253-dummy-no-calls-are-made',
  `KLATCH_DB=${A2_ENVFILE}`,
]);
const a2Why = await bootServer('A2', { KLATCH_DB: A2_CALLER });
record(
  'A2',
  "an explicit caller's KLATCH_DB beats a KLATCH_DB line in .env",
  fs.existsSync(A2_CALLER) && !fs.existsSync(A2_ENVFILE),
  `${a2Why}\n      caller db created=${fs.existsSync(A2_CALLER)}  .env db created=${fs.existsSync(A2_ENVFILE)}`,
);

// ----------------------------------- arm 3: .env alone — the decisive one

const A3_ENVFILE = path.join(SCRATCH, 'a3-envfile.db');
const SIDECARS = [REAL_DB, `${REAL_DB}-wal`, `${REAL_DB}-shm`];
const before = SIDECARS.map((p) => ({ p, sha: sha(p), existed: fs.existsSync(p) }));
const backupDir = path.join(SCRATCH, 'klatch-db-backup');
fs.mkdirSync(backupDir, { recursive: true });
for (const b of before) if (b.existed) fs.copyFileSync(b.p, path.join(backupDir, path.basename(b.p)));
console.log(`      [A3] klatch.db backed up: sha256 ${before[0].sha?.slice(0, 16)}…`);

fs.rmSync(SCRATCH_ENV, { force: true });
writeScratchEnv([
  '# Round 253 scratch — written and removed by this probe. Gitignored.',
  'ANTHROPIC_API_KEY=r253-dummy-no-calls-are-made',
  `KLATCH_DB=${A3_ENVFILE}`,
]);
// Explicitly absent from the caller's environment — this is the whole arm.
const a3Env = { ...process.env, PORT: '0' };
delete a3Env.KLATCH_DB;
const a3Why = await new Promise<string>((resolve) => {
  const child = spawn('npx', ['tsx', ENTRY], { cwd: ROOT, env: a3Env });
  let out = '';
  let settled = false;
  const finish = (why: string) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    try {
      child.kill('SIGTERM');
    } catch {
      /* already gone */
    }
    setTimeout(() => resolve(`${why} :: ${out.trim().split('\n').slice(-2).join(' / ')}`), 400);
  };
  const timer = setTimeout(() => finish('TIMEOUT'), 25_000);
  child.stdout.on('data', (b) => {
    out += b;
    if (/running on http/.test(out)) finish('BOOTED');
  });
  child.stderr.on('data', (b) => {
    out += b;
  });
  child.on('exit', (code) => finish(`EXITED(${code})`));
  console.log('      [A3] booting real entrypoint, KLATCH_DB absent from the caller ...');
});

const a3Created = fs.existsSync(A3_ENVFILE);

// Restore before reporting, so a failed assertion cannot skip the restore.
const after = SIDECARS.map((p) => ({ p, sha: sha(p), exists: fs.existsSync(p) }));
let restored = 'not needed';
const realTouched = before.some((b, i) => b.sha !== after[i].sha || b.existed !== after[i].exists);
if (realTouched) {
  for (const b of before) {
    const copy = path.join(backupDir, path.basename(b.p));
    if (b.existed) fs.copyFileSync(copy, b.p);
    else fs.rmSync(b.p, { force: true });
  }
  const reSha = SIDECARS.map((p) => sha(p));
  restored = before.every((b, i) => b.sha === reSha[i]) ? 'RESTORED, sha identical' : 'RESTORE FAILED';
}
record(
  'A3',
  'a KLATCH_DB line in .env reaches the database path with no caller value at all',
  a3Created,
  `${a3Why}\n      .env db created=${a3Created}  real klatch.db touched=${realTouched} (${restored})`,
);

// ------------------------------------------------------------------- controls

runCleanup();
const envGone = !fs.existsSync(SCRATCH_ENV);
const gitPackages = spawnSync('git', ['status', '--porcelain', 'packages/'], {
  cwd: ROOT,
  encoding: 'utf8',
}).stdout.trim();
const finalSha = sha(REAL_DB);

// The first version of this control asserted `git status --porcelain packages/`
// was EMPTY, and it went red on the run that proved the remedy works — because
// the remedy is three edits under `packages/`. It could not tell a leak by the
// drive from the operator editing the product the drive exercises. Second
// sighting of Theseus's Round 252 §5.1 shape ("the window cannot tell the drive
// from the operator and should not try"), and his remedy there was discipline;
// here the arm can just be aimed properly instead, because this drive's only
// possible write under `packages/` is the scratch `.env`. So: the tree state is
// PRINTED as diagnostic, and the assertion is scoped to the one path.
const envLeak = /packages\/server\/\.env/.test(gitPackages);

console.log('\n---- controls ----');
console.log(`scratch .env removed          ${envGone}`);
console.log(`no packages/server/.env leak  ${!envLeak}`);
console.log(`git status --porcelain packages/ (diagnostic, not asserted):`);
console.log(gitPackages === '' ? '  (empty)' : gitPackages.replace(/^/gm, '  '));
console.log(`klatch.db sha256 before       ${before[0].sha}`);
console.log(`klatch.db sha256 after        ${finalSha}`);
console.log(`klatch.db unchanged           ${before[0].sha === finalSha}`);

const controlsOk = envGone && !envLeak && before[0].sha === finalSha;
const passed = arms.filter((a) => a.ok).length;
console.log(`\n${passed}/${arms.length} arms passed; controls ${controlsOk ? 'clean' : 'DIRTY'}`);
process.exit(passed === arms.length && controlsOk ? 0 : 1);
