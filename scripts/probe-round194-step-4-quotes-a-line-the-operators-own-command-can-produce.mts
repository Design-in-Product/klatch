/**
 * Round 194 — step 4 checks itself, and it quotes the line the operator's own
 * command will print.
 *
 * Theseus's Round 193, "two things to weigh": step 4 of the printed restore
 * steps asked the operator to compare a `Candidates:` line **by eye** against
 * one the apply printed a hundred lines earlier. The apply knows that line. It
 * can print it into the steps, turning the one step a person can get wrong while
 * doing everything else right into a string match.
 *
 * The trap this probe exists for. Step 4 says *re-run this script with no
 * flags*, so the line it quotes has to be the line a **no-flag** run produces —
 * not the line this run printed. Those differ whenever the run carried
 * `--channels` (filtered form: `Candidates: 1 of 8 in scope matched your
 * --channels filter — …`) or `--bases`. Quoting this run's own line would hand
 * the operator a string their correct restore can never produce: a restore that
 * worked, reported as failed, at the moment they are least able to judge it.
 * Arms F and B are that case driven end to end.
 *
 * Arm U is the undo path, where the backup is the run's *own* pre-state — the
 * post-apply state, not the pre-apply one — so the quoted line is a different
 * line again, and has to be computed before the undo writes.
 *
 * Zero model calls. `klatch.db` is never opened: fixtures are Round 176's,
 * built under `.testdata/r194/` (gitignored).
 */

import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r194');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

let pass = 0;
let fail = 0;
let open = 0;
const failures: string[] = [];
function check(id: string, what: string, ok: boolean, detail: string): void {
  if (ok) pass++;
  else {
    fail++;
    failures.push(`${id} · ${what}\n    ${detail}`);
  }
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${id} · ${what} — ${detail}`);
}
function meas(id: string, detail: string): void {
  console.log(`  [MEAS] ${id}: ${detail}`);
}
function open_(id: string, what: string, detail: string): void {
  open++;
  console.log(`  [OPEN] ${id} · ${what} — ${detail}`);
}

/** Round 176's fixture, checkpointed so the main file holds all of it. */
function build(dirName: string): string {
  const dir = path.join(DATA, dirName);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });
  const db = path.join(dir, 'klatch.db');
  execFileSync('npx', ['tsx', R176], {
    cwd: ROOT,
    env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: db },
    stdio: 'ignore',
  });
  const w = new Database(db, { fileMustExist: true });
  w.pragma('wal_checkpoint(TRUNCATE)');
  w.close();
  return db;
}

function cli(args: string[]) {
  const r = spawnSync('npx', ['tsx', CLI, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status ?? -1, out: (r.stdout ?? '') + (r.stderr ?? '') };
}
/** The run's own verdict: a `Candidates:` at column 0. */
const ownLine = (out: string) => /^Candidates:.*$/m.exec(out)?.[0] ?? '(none)';
/**
 * The line step 4 quotes. Indented past the numbered-step prefix on purpose, so
 * that `ownLine` above still finds exactly one thing — this probe reading both
 * out of one stream is the check that the indentation does its job.
 */
const quoted = (out: string) => /^ {4,}(Candidates:.*)$/m.exec(out)?.[1] ?? '(none)';
const backupOf = (out: string) =>
  /^Backup \(taken before anything was written\): (.+)$/m.exec(out)?.[1] ?? '';
const recordOf = (out: string) => /^Undo record: (.+)$/m.exec(out)?.[1] ?? '';

/**
 * Steps 1–3, done as a person would: nothing holds the file, so stop is a no-op.
 *
 * Reports an absent backup rather than throwing. The first version of this probe
 * crashed here because arm F picked a channel the plan would **skip** — the run
 * then had nothing to apply, discarded its snapshot and correctly printed no
 * backup path at all. A probe that dies on its own fixture choice reads like a
 * product failure in the log.
 */
function restoreByHand(db: string, backup: string): boolean {
  if (!backup || !fs.existsSync(backup)) return false;
  fs.rmSync(`${db}-wal`, { force: true });
  fs.rmSync(`${db}-shm`, { force: true });
  fs.copyFileSync(backup, db);
  return true;
}

console.log('=== Round 194 — step 4 quotes a line the operator\'s own command can produce ===\n');

// ── Arm S — the unflagged apply, the simple case ─────────────────────────────
console.log('Arm S — an unflagged apply: step 4 quotes the run\'s own line, and step 4 run proves it');
{
  const db = build('s');
  const before = cli([db]);
  const applied = cli([db, '--apply']);
  check('S0', 'setup: dry run then apply, both exit 0', before.code === 0 && applied.code === 0,
    `dry ${before.code} · apply ${applied.code}`);
  check('S1', 'step 4 quotes a line, and it is the line the pre-apply dry run printed',
    quoted(applied.out) !== '(none)' && quoted(applied.out) === ownLine(before.out),
    `quoted "${quoted(applied.out)}" · pre-apply dry run "${ownLine(before.out)}"`);
  check('S2', 'exactly one column-0 Candidates line in the apply\'s output — the quote is indented',
    (applied.out.match(/^Candidates:/gm) ?? []).length === 1,
    `column-0 matches: ${(applied.out.match(/^Candidates:/gm) ?? []).length}`);

  const restored = restoreByHand(db, backupOf(applied.out));
  const after = cli([db]);
  check('S3', 'step 4 executed: after the printed steps, a no-flag dry run prints exactly the quoted line',
    restored && ownLine(after.out) === quoted(applied.out) && after.code === 0,
    `restored ${restored} · after the steps "${ownLine(after.out)}" · quoted "${quoted(applied.out)}" · exit ${after.code}`);
}

// ── Arm F — the filtered apply, the arm the design exists for ────────────────
console.log('\nArm F — an apply carrying --channels: the quote must be the no-flag line, not this run\'s');
{
  const db = build('f');
  const before = cli([db]);
  // An id off the review sheet, the way the approve-by-id round trip works —
  // and specifically one the plan would MOVE. A SKIP row leaves the run with
  // nothing to apply, so it discards its snapshot and prints no backup, which is
  // correct behaviour and the wrong fixture for this arm.
  const id = /^ {2}([0-9a-f]{8}) .*(?:MINTED|MATCHED-BY-NAME)/m.exec(before.out)?.[1] ?? '';
  const applied = cli([db, '--apply', `--channels=${id}`]);
  check('F0', 'setup: a one-id filtered apply on a row that moves exits 0 and names a backup',
    id !== '' && applied.code === 0 && backupOf(applied.out) !== '',
    `--channels=${id} · exit ${applied.code} · own line "${ownLine(applied.out)}"`);
  check('F1', 'this run\'s own line is the filtered form and is NOT what step 4 quotes',
    ownLine(applied.out).includes('in scope matched your --channels filter') &&
      quoted(applied.out) !== '(none)' &&
      quoted(applied.out) !== ownLine(applied.out),
    `own "${ownLine(applied.out)}" · quoted "${quoted(applied.out)}"`);
  check('F2', 'step 4 quotes the unfiltered line the pre-apply dry run printed',
    quoted(applied.out) === ownLine(before.out),
    `quoted "${quoted(applied.out)}" · unflagged dry run "${ownLine(before.out)}"`);

  const restored = restoreByHand(db, backupOf(applied.out));
  const after = cli([db]);
  check('F3', 'step 4 executed: the no-flag dry run after the restore matches the quote, and does NOT match this run\'s own line',
    restored && ownLine(after.out) === quoted(applied.out) && ownLine(after.out) !== ownLine(applied.out),
    `restored ${restored} · after the steps "${ownLine(after.out)}" · quoted "${quoted(applied.out)}" · this run's own "${ownLine(applied.out)}"`);
  meas('F', `quoting this run's own line would have told the operator to expect "${ownLine(applied.out)}" from a command that prints "${ownLine(after.out)}"`);
}

// ── Arm B — the same shape via --bases ───────────────────────────────────────
console.log('\nArm B — an apply carrying --bases: the quote is still the default-bases line');
{
  const db = build('b');
  const before = cli([db]);
  const applied = cli([db, '--apply', '--bases=identity-claim,project-name']);
  check('B0', 'setup: a widened-bases apply exits 0', applied.code === 0, `exit ${applied.code}`);
  check('B1', 'step 4 quotes the default-bases line, not the widened one',
    quoted(applied.out) === ownLine(before.out),
    `quoted "${quoted(applied.out)}" · default-bases dry run "${ownLine(before.out)}" · this run's own "${ownLine(applied.out)}"`);
  if (ownLine(applied.out) === ownLine(before.out)) {
    open_('B2', 'the widened run and the default run print the same line on this fixture, so B1 is weaker than F2',
      `both "${ownLine(before.out)}" — the fixture has no project-name-only candidate, so --bases changes nothing here. F covers the divergent case.`);
  } else {
    check('B2', 'the widened run\'s own line does differ, so B1 discriminates',
      quoted(applied.out) !== ownLine(applied.out),
      `own "${ownLine(applied.out)}" · quoted "${quoted(applied.out)}"`);
  }
}

// ── Arm U — the undo path, where the backup is a different state again ───────
console.log('\nArm U — --undo: the quote is the POST-apply line, computed before the undo writes');
{
  const db = build('u');
  const before = cli([db]);
  const applied = cli([db, '--apply']);
  const postApply = cli([db]);
  const undone = cli([db, `--undo=${recordOf(applied.out)}`]);
  check('U0', 'setup: apply then undo, both exit 0', applied.code === 0 && undone.code === 0,
    `apply ${applied.code} · undo ${undone.code}`);
  check('U1', 'the undo quotes the post-apply line — what ITS backup holds — not the pre-apply one',
    quoted(undone.out) === ownLine(postApply.out) && ownLine(postApply.out) !== ownLine(before.out),
    `quoted "${quoted(undone.out)}" · post-apply dry run "${ownLine(postApply.out)}" · pre-apply "${ownLine(before.out)}"`);

  const restored = restoreByHand(db, backupOf(undone.out));
  const after = cli([db]);
  check('U2', 'step 4 executed on the undo\'s backup: the no-flag dry run matches the quote',
    restored && ownLine(after.out) === quoted(undone.out),
    `restored ${restored} · after the steps "${ownLine(after.out)}" · quoted "${quoted(undone.out)}"`);
}

// ── Arm Z — what this round touched ──────────────────────────────────────────
console.log('\nArm Z — files changed');
{
  const dirty = spawnSync('git', ['status', '--porcelain', 'packages', 'scripts'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).stdout.trim();
  meas('Z', dirty === '' ? 'no product or CLI file differs from HEAD' : `changed this round:\n    ${dirty.split('\n').join('\n    ')}`);
}

console.log(`\n${'='.repeat(78)}`);
console.log(`${pass + fail} checks · ${fail} failed · ${open} open`);
if (failures.length) {
  console.log('\nFAILED:');
  for (const f of failures) console.log(`  ${f}`);
}
console.log('='.repeat(78));
process.exit(fail ? 1 : 0);
