/**
 * Round 178 — the operator-error paths of the entity-backfill CLI, after the
 * fixes for Theseus's Round 176 findings.
 *
 * Round 176 drove the CLI end to end and found six open items, three of which
 * share one shape: an operator mistake — a copied id, a typo, an underscore
 * where a hyphen belongs — comes back as `Candidates: 0` and **exit 0**, which
 * reads as *"your corpus has nothing to fix."* Round 176's own words: that is
 * the `resolves-to-default` failure mirrored, a *nothing-to-do* the caller
 * cannot tell from an answer.
 *
 * Theseus's probe (`probe-round176-backfill-cli-end-to-end.mts`) is the
 * regression instrument for the fixes and is the primary evidence — run it
 * first. This one exists for the part his does **not** cover: it pins the
 * behaviour that *replaced* each defect (what the refusal prints, what it exits
 * with, what it leaves on disk) rather than only that the defect is gone, and
 * it separates the two cases his G4 arm now conflates — an unresolvable filter
 * (an operator error, which must refuse) from a plan that legitimately moves
 * nothing (not an error, which must still exit 0).
 *
 * Same discipline as Round 176: the real script as a real subprocess against a
 * real file-backed DB, verified through the probe's own read-only handle. The
 * fixture is Round 176's, built by spawning that probe's own `build` role, so
 * the two instruments are measuring the same corpus. Zero model calls.
 *
 *   npx tsx scripts/probe-round178-backfill-operator-error-paths.mts
 */

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r176');
const DB = path.join(DATA, 'klatch.db');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

interface Check {
  arm: string;
  name: string;
  ok: boolean;
  detail: string;
}
const checks: Check[] = [];
function check(arm: string, name: string, ok: boolean, detail: string) {
  checks.push({ arm, name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${arm} · ${name} — ${detail}`);
}

function cli(args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync('npx', ['tsx', CLI, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, R176_ROLE: '' },
  });
  return { code: r.status ?? -1, out: r.stdout ?? '', err: r.stderr ?? '' };
}

const sha = (f: string) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const beside = (pattern: string) =>
  fs.existsSync(DATA) ? fs.readdirSync(DATA).filter((f) => f.includes(pattern)) : [];

function ro<T>(fn: (db: any) => T): T {
  const db = new Database(DB, { readonly: true, fileMustExist: true });
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

// ── fixture ───────────────────────────────────────────────────────────────────
// Rebuilt from scratch through Round 176's own builder, so a fixture left
// mid-experiment by an earlier run cannot be mistaken for a clean one.

fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });
const build = spawnSync('npx', ['tsx', R176], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: DB },
});
if (build.status !== 0) {
  console.error(`fixture build failed (exit ${build.status})\n${build.stderr}`);
  process.exit(1);
}

console.log(`\n${'='.repeat(78)}\nRound 178 — backfill CLI operator-error paths\n${DB}\n${'='.repeat(78)}`);

const pristine = sha(DB);
const sheet = cli([DB]);
const sheetIds = [...sheet.out.matchAll(/^ {2}([0-9a-f]{8}) /gm)].map((m) => m[1]);
check('setup', 'the review sheet prints 8-character ids', sheetIds.length > 0, `${sheetIds.length} rows, e.g. ${sheetIds.slice(0, 3).join(', ')}`);
// Only the rows that would move — the sheet lists skips too, and "I approved it
// and nothing happened" has a legitimate reading for those.
const movableIds = [...sheet.out.matchAll(/^ {2}([0-9a-f]{8}) .* → "/gm)].map((m) => m[1]);
check('setup', 'some of them would move', movableIds.length >= 2, `${movableIds.length} of ${sheetIds.length} rows carry a verdict that moves`);

// ── Arm P — the sheet's ids are the ids --channels takes (R176 G5) ────────────
console.log('\nArm P — the approve-by-id round trip, with the ids as printed');

const approved = movableIds.slice(0, 2);
const pDry = cli([DB, `--channels=${approved.join(',')}`]);
check('P', 'a dry run on sheet ids finds them', /Candidates: 2 of \d+ in scope matched/.test(pDry.out) && /2 would move/.test(pDry.out), (/Candidates: .*/.exec(pDry.out)?.[0] ?? '(no candidates line)').slice(0, 90));
check('P', 'the denominator is stated, not implied', / of \d+ in scope matched your --channels filter/.test(pDry.out), 'the count carries what it is a count of');
check('P', 'a dry run on sheet ids exits 0', pDry.code === 0, `exit ${pDry.code}`);

const pApply = cli([DB, '--apply', `--channels=${approved[0]}`]);
check('P', 'apply on a sheet id moves exactly that channel', pApply.code === 0 && /Applied: 1 channel\(s\)/.test(pApply.out), `exit ${pApply.code} · ${/Applied: .*/.exec(pApply.out)?.[0] ?? pApply.err.slice(0, 120)}`);
const movedOff = ro((db) =>
  db
    .prepare(
      `SELECT COUNT(*) AS n FROM channel_entities
        WHERE channel_id LIKE ? AND entity_id = 'default-entity'`
    )
    .get(`${approved[0]}%`)
) as { n: number };
check('P', 'the approved channel really left the default', movedOff.n === 0, `default bindings on ${approved[0]}: ${movedOff.n}`);

// Put it back before the error arms, so their "nothing changed" is meaningful.
const record = beside('.backfill-').find((f) => f.endsWith('.json'));
check('P', 'undo record written', !!record, record ?? '(none)');
if (!record) {
  console.error('\ncannot continue without an undo record — the apply arm did not produce one');
  process.exit(1);
}
const pUndo = cli([DB, `--undo=${path.join(DATA, record)}`]);
check('P', 'undo takes a snapshot of its own (R176 arm E)', /Backup \(taken before anything was written\)/.test(pUndo.out), (/Backup .*/.exec(pUndo.out)?.[0] ?? '(no backup line)').slice(0, 100));
check('P', "the undo's own backup is on disk, not just announced", beside('.backup-backfill-').length >= 1, `${beside('.backup-backfill-').length} backup file(s) beside the DB`);
for (const f of [...beside('.backup-backfill-'), ...beside('.backfill-')]) fs.rmSync(path.join(DATA, f), { force: true });

// ── Arm Q — operator errors are refused by name, not answered ─────────────────
console.log('\nArm Q — an operator mistake is never reported as an empty corpus');
const beforeErrors = sha(DB);

const qUnknownId = cli([DB, '--apply', '--channels=not-a-real-id']);
check('Q1', 'an unknown --channels id is echoed back', /not-a-real-id/.test(qUnknownId.out), (/--channels not-a-real-id.*/.exec(qUnknownId.out)?.[0] ?? qUnknownId.out.slice(-160)).slice(0, 120));
check('Q1', 'and it exits non-zero rather than reading as success', qUnknownId.code !== 0, `exit ${qUnknownId.code}`);
check('Q1', 'and nothing was written', sha(DB) === beforeErrors, sha(DB) === beforeErrors ? 'sha256 unchanged' : 'FILE CHANGED');
check('Q1', 'and no backup was left behind', beside('.backup-backfill-').length === 0, `${beside('.backup-backfill-').length} beside the DB`);

// The whole point of --channels is that it is a list of approvals. Acting on
// the half that resolved is the mistake the flag exists to prevent.
const qPartial = cli([DB, '--apply', `--channels=${approved[0]},not-a-real-id`]);
check('Q2', 'a partly-unresolvable approval list refuses the whole run', qPartial.code !== 0 && /Refusing to apply/.test(qPartial.err), `exit ${qPartial.code} · ${(qPartial.err.split('\n').find((l) => l.includes('Refusing')) ?? '').slice(0, 80)}`);
check('Q2', 'the resolvable half was not quietly applied', sha(DB) === beforeErrors, sha(DB) === beforeErrors ? 'sha256 unchanged' : 'FILE CHANGED');

const qAmbiguous = cli([DB, '--channels=ffffffffff']);
check('Q3', 'an id matching nothing is reported even on a dry run', qAmbiguous.code === 2 && /matched no in-scope candidate/.test(qAmbiguous.out), `exit ${qAmbiguous.code}`);

const qBadBasis = cli([DB, '--bases=identity_claim']);
check('Q4', 'an unknown --bases value is refused by name', qBadBasis.code === 1 && /unknown --bases value/.test(qBadBasis.err), `exit ${qBadBasis.code} · ${(qBadBasis.err.split('\n')[0] ?? '').slice(0, 70)}`);
check('Q4', 'and the valid values are printed', /valid bases: identity-claim, project-name, none/.test(qBadBasis.err), (qBadBasis.err.split('\n')[1] ?? '').slice(0, 70));
check('Q4', 'and no snapshot was left behind', beside('backup-backfill').length === 0, `${beside('backup-backfill').length} beside the DB`);

// ── Arm R — a real nothing-to-do still exits 0 ────────────────────────────────
// Separating this from arm Q is the point: "you made a mistake" and "there is
// nothing to do" must not print the same thing, and must not print each
// other's. R176's G4 asserted the exit-0 path using an unknown id as its
// vehicle, which is now an operator error; this is the same invariant with an
// input that is genuinely not an error.
console.log('\nArm R — a plan that legitimately moves nothing is not an error');

const rNoop = cli([DB, '--apply', '--bases=none']);
check('R', 'every candidate skips, and the run exits 0', rNoop.code === 0, `exit ${rNoop.code}${rNoop.code ? ` · ${rNoop.err.slice(0, 160)}` : ''}`);
check('R', 'it says nothing to apply', /Nothing to apply\. Snapshot discarded\./.test(rNoop.out), (/Nothing to apply.*/.exec(rNoop.out)?.[0] ?? rNoop.out.slice(-120)).slice(0, 90));
check('R', 'the snapshot is discarded', beside('backup-backfill').length === 0, `${beside('backup-backfill').length} backup(s) beside the DB`);
check('R', 'candidates are still reported, so "0 would move" has a denominator', /Candidates: \d+ — 0 would move/.test(rNoop.out), (/Candidates: .*/.exec(rNoop.out)?.[0] ?? '').slice(0, 80));
check('R', 'nothing was written', sha(DB) === beforeErrors, sha(DB) === beforeErrors ? 'sha256 unchanged' : 'FILE CHANGED');

check('R', 'the whole run left the fixture as Round 176 built it', sha(DB) === pristine || sha(DB) === beforeErrors, sha(DB) === pristine ? 'byte-identical to as-built' : 'unchanged since the apply/undo round trip in arm P');

// ── summary ───────────────────────────────────────────────────────────────────
const failed = checks.filter((c) => !c.ok);
console.log(`\n${'='.repeat(78)}`);
console.log(`${checks.length} checks · ${failed.length} failed`);
if (failed.length) {
  console.log('\nFAILED:');
  for (const c of failed) console.log(`  ${c.arm} · ${c.name} — ${c.detail}`);
}
console.log('='.repeat(78));
process.exit(failed.length ? 1 : 0);
