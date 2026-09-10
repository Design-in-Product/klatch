/**
 * Round 181 — the flag the parser never recognises, and the validator that
 * replaced the crash.
 *
 * Round 179 found one defect wearing three hats: `flagValue` returned `''` for
 * `--channels <id>` (a space, not an `=`), `''` was falsy, and `channelIds`
 * became `undefined` — *no filter* rather than *empty filter*. Measured: 7 of 11
 * channels moved where 1 was approved, exit 0. Round 180 closed it for every
 * value-taking flag, and Daedalus found the same hole in `--undo`, where it
 * pointed worse: `--undo <record> --apply` skipped the undo branch and
 * re-applied the backfill being reversed.
 *
 * That fix fires when `flagValue` returns a defined-but-empty string. It cannot
 * fire when `flagValue` returns `undefined` — which is what it returns for a
 * flag it does not recognise, because unrecognised flags are silently ignored
 * (`backfill-entity-bindings.mts:80-85`). So the organising question of this
 * round is the one Round 180's rule leaves open:
 *
 *   **Does misspelling an approval flag still come back as an answer?**
 *
 * The second half drives `checkUndoRecord` (Round 180, new) through the CLI at
 * inputs its unit tests do not use — a JSON array, a `null`, a future version, a
 * truncated file, a directory — because it is the code that now stands between
 * an operator's mis-aimed `--undo` and `undoEntityBackfill`.
 *
 * Same discipline as Rounds 176/179: the real script as a real subprocess (real
 * argv, real `KLATCH_DB` resolution, real `db.backup()`) against a real
 * file-backed database, verified through this probe's own read-only handle in
 * raw SQL rather than through the code under test. Zero model calls, zero API
 * spend. `klatch.db` is never opened — the fixture is Round 176's builder
 * writing into `.testdata/r181/` (gitignored).
 *
 *   npx tsx scripts/probe-round181-unrecognised-flags-and-undo-record-validation.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r181');
const DB = path.join(DATA, 'klatch.db');
const PRISTINE = path.join(DATA, 'pristine.db');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

const DEFAULT_ENTITY_ID = 'default-entity';

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
    env: { ...process.env, R176_ROLE: '' },
  });
  return { code: r.status ?? -1, out: r.stdout ?? '', err: r.stderr ?? '' };
}

const sha = (f: string) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

const errLine = (err: string, want: RegExp): string =>
  (err.split('\n').find((l) => want.test(l)) ?? err.split('\n').find(Boolean) ?? '').trim().slice(0, 78);

const backupsBeside = () =>
  fs.readdirSync(DATA).filter((f) => f.startsWith('klatch.db.backup-backfill-'));
const recordsBeside = () =>
  fs.readdirSync(DATA).filter((f) => /^klatch\.db\.backfill-.*\.json$/.test(f));

function ro<T>(fn: (db: any) => T): T {
  const db = new Database(DB, { readonly: true, fileMustExist: true });
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

const stillOnDefault = (): number =>
  ro(
    (db) =>
      (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM channels c
               JOIN channel_entities ce ON ce.channel_id = c.id
              WHERE ce.entity_id = ? AND c.source IN ('claude-code','claude-ai')`
          )
          .get(DEFAULT_ENTITY_ID) as { n: number }
      ).n
  );

async function snapshotTo(dest: string): Promise<void> {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(dest + s, { force: true });
  const src = new Database(DB, { readonly: true, fileMustExist: true });
  await src.backup(dest);
  src.close();
}

async function restorePristine(): Promise<void> {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(DB + s, { force: true });
  const src = new Database(PRISTINE, { readonly: true, fileMustExist: true });
  await src.backup(DB);
  src.close();
  for (const f of [...backupsBeside(), ...recordsBeside()])
    fs.rmSync(path.join(DATA, f), { force: true });
}

const FILTERED = /Candidates: (\d+) of (\d+) in scope matched your --channels filter/;
const UNFILTERED = /Candidates: (\d+) — (\d+) would move/;

// ── fixture ───────────────────────────────────────────────────────────────────

console.log('\n=== Round 181 — unrecognised flags, and the undo-record validator ===\n');

fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });

console.log("Building fixture (Round 176's builder, real importSession, file-backed DB)...");
execFileSync('npx', ['tsx', R176], {
  cwd: ROOT,
  env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: DB },
  stdio: 'inherit',
});
const seeded: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(ROOT, '.testdata', 'r176', 'seeded.json'), 'utf8')
);
await snapshotTo(PRISTINE);

const wren = seeded['wren'];
const inScope = stillOnDefault();
measure(`fixture: ${inScope} in-scope candidate channels bound to the default`);

// The control the whole round is measured against: the correctly spelled flag,
// same id, same database. Everything below asks whether a one-character slip
// still lands here or somewhere much larger.
const mControl = cli([DB, `--channels=${wren}`]);
const controlN = FILTERED.exec(mControl.out)?.[1];
check(
  'setup',
  'the correctly spelled --channels=<id> filters to exactly one channel',
  controlN === '1' && mControl.code === 0,
  `${FILTERED.exec(mControl.out)?.[0]} · exit ${mControl.code}`
);

// ── Arm M — flags the parser does not recognise ──────────────────────────────
// `flagValue` finds `--channels` or `--channels=…` and returns `undefined`
// otherwise. Round 180's rule fires on a *defined but empty* value; `undefined`
// is the one input it cannot see, and it is what every misspelling produces.
console.log('\nArm M — a misspelled approval flag');
const mHash = sha(DB);

const misspellings: { arg: string; why: string }[] = [
  { arg: `--channel=${wren}`, why: 'singular — the natural spelling when you are approving one channel' },
  { arg: `--chanels=${wren}`, why: 'a dropped letter' },
  { arg: `--Channels=${wren}`, why: 'capitalised' },
  { arg: `-channels=${wren}`, why: 'one hyphen' },
];
for (const { arg, why } of misspellings) {
  const r = cli([DB, arg]);
  const unfiltered = UNFILTERED.exec(r.out);
  // "Was the operator told?" — the token exactly as typed, and the id inside it.
  // Deliberately not `includes('--channel')`: the dry-run footer prints the hint
  // line "`--channels=<ids>` to move only the ones you approve off this sheet",
  // which matches that substring while telling the operator nothing about what
  // they typed. A first pass of this arm scored that as an echo.
  const echoed = (r.out + r.err).includes(arg) || (r.out + r.err).includes(wren);
  if (FILTERED.test(r.out) || r.code !== 0) {
    check('M1', `\`${arg.split('=')[0]}=<id>\` (${why}) does not silently widen the run`, true,
      `exit ${r.code} · ${FILTERED.exec(r.out)?.[0] ?? errLine(r.err, /./)}`);
  } else {
    open_(
      'M1',
      `\`${arg.split('=')[0]}=<id>\` (${why}) is ignored and the approval list switches off`,
      `The flag is not one \`flagValue\` recognises, so it returns \`undefined\` — *no filter*, the same state as passing no \`--channels\` at all — and Round 180's empty-value rule cannot fire because the value is not empty, it is absent. Measured: ${
        unfiltered?.[0] ?? '(no candidates line)'
      } against a control of ${controlN} of ${inScope}, exit ${r.code}. Neither the token as typed nor the id inside it ${
        echoed ? 'IS echoed' : 'is echoed anywhere in stdout or stderr'
      } — and the dry-run footer then prints "\`--channels=<ids>\` to move only the ones you approve off this sheet", which reads as generic advice to an operator who believes they just did that. Same shape as Round 179's finding 1, reached by a slip Round 180's rule is structurally unable to see.`
    );
  }
}
// The sibling flags, same slip. `--bases` misspelled falls back to
// DEFAULT_APPLY_BASES, which is *wider* than most narrowings an operator types.
const mBases = cli([DB, '--base=none']);
const mBasesLine = /Bases applied: (.*)/.exec(mBases.out)?.[1];
if (mBases.code !== 0 || mBasesLine === 'none') {
  check('M2', '`--base=none` (singular) does not silently fall back to the default bases', true,
    `exit ${mBases.code} · bases applied: ${mBasesLine}`);
} else {
  open_(
    'M2',
    '`--base=<v>` (singular) is ignored and the run uses the default bases',
    `Same \`undefined\` path as M1 on the flag whose whole job is to *narrow* what moves. \`--bases=none\` applies no basis and moves nothing; \`--base=none\` prints "Bases applied: ${mBasesLine}" and plans ${
      UNFILTERED.exec(mBases.out)?.[2] ?? '?'
    } moves, exit ${mBases.code}. The misspelling fails open, toward the wider run.`
  );
}
check('M', 'no arm-M dry run mutated the DB', sha(DB) === mHash, sha(DB) === mHash ? 'sha256 unchanged' : 'FILE CHANGED');

// ── Arm N — what M1 costs with --apply on the line ───────────────────────────
// M1 measured a plan. Round 179's own I1 exists because "plans the whole corpus"
// and "moves the whole corpus" are different claims and only one is the reason
// to care. Measured once, on the likeliest of the four misspellings.
console.log('\nArm N — the misspelling, with --apply');
await restorePristine();
const nBefore = stillOnDefault();
const nRun = cli([DB, '--apply', `--channel=${wren}`]);
const nAfter = stillOnDefault();
const nMoved = nBefore - nAfter;
if (nMoved <= 1 || nRun.code !== 0) {
  check('N1', '`--apply --channel=<id>` moves at most the one channel approved', true,
    `${nMoved} moved, exit ${nRun.code}`);
} else {
  open_(
    'N1',
    'a one-character misspelling of --channels applies to the whole corpus, exit 0',
    `\`--apply --channel=${wren.slice(0, 8)}…\` re-pointed **${nMoved} of ${nBefore}** in-scope channels, not the 1 approved: "${
      /Applied: .*/.exec(nRun.out)?.[0] ?? '(no Applied line)'
    }", exit ${nRun.code}. The approved channel is among them, so nothing in the output distinguishes this from the run the operator wanted — the same indistinguishability Round 179 measured for the space form, which is now refused. ${
      recordsBeside().length
    } undo record written, which is the difference between this and a disaster; the recovery still depends on the operator noticing.`
  );
}
measure(
  `with --apply and a misspelled flag: ${nMoved} of ${nBefore} in-scope channels moved, ${recordsBeside().length} undo record(s) written`
);

// The worst instance of the family, per Daedalus's own Round 180 finding on the
// space form: a misspelled `--undo` does not mean "no record", it means the undo
// branch is skipped — and with `--apply` on the line, the run *re-applies* the
// backfill the operator was reversing.
//
// Re-vehicled 2026-09-10 (Round 182). N2 and N3 used to take their record from
// N1's run. Round 182 refuses N1, so no record was written: N2 printed
// `exit undefined` and failed, and N3's `if (nRecord)` skipped without a word —
// the total dropped from 32 checks to 31 and nothing said so. The invariant
// held; the input stopped being an example of it (Round 176's G4 again). The
// record now comes from a correctly spelled, unfiltered `--apply` — the same
// four-channel record N1 used to leave, so the numbers below stay comparable —
// and a missing record is a FAIL here, never a silent skip.
await restorePristine();
const nSource = cli([DB, '--apply']);
const nRecord = recordsBeside()[0] ? path.join(DATA, recordsBeside()[0]) : '';
check(
  'N2',
  'setup: a correctly spelled --apply writes the record N2/N3 reverse',
  nSource.code === 0 && !!nRecord && nBefore - stillOnDefault() === 4,
  `exit ${nSource.code} · ${nBefore - stillOnDefault()} moved · record ${nRecord ? 'written' : 'MISSING'}`
);
const nUndoOk = nRecord ? cli([DB, `--undo=${nRecord}`]) : null;
check(
  'N2',
  'control: the correctly spelled --undo reverses the run',
  !!nUndoOk && nUndoOk.code === 0 && stillOnDefault() === nBefore,
  `exit ${nUndoOk?.code} · ${stillOnDefault()} of ${nBefore} channels back on the default`
);
if (!nRecord) {
  check('N3', '`--apply --und=<record>` was driven', false, 'no record to aim it at — see N2 setup');
} else {
  const nBackups = backupsBeside().length;
  const nUndoTypo = cli([DB, '--apply', `--und=${nRecord}`]);
  const afterTypo = stillOnDefault();
  if (nUndoTypo.code !== 0 || afterTypo === nBefore) {
    check('N3', '`--apply --und=<record>` (misspelled undo) does not re-apply the backfill', true,
      `exit ${nUndoTypo.code} · ${afterTypo} of ${nBefore} still on the default`);
    // Stronger than the arm could assert when it was written: the refusal now
    // exists, so assert it is the parse-boundary refusal, that it writes no
    // snapshot or second record, and that the remedy is pasteable.
    check('N3', '…and refuses at the parse boundary, writing no snapshot and no record',
      nUndoTypo.code === 1 && /^Refusing to run/m.test(nUndoTypo.err) &&
        backupsBeside().length === nBackups && recordsBeside().length === 1,
      `exit ${nUndoTypo.code} · ${backupsBeside().length - nBackups} new backup(s) · ${recordsBeside().length} record(s)`);
    check('N3', '…and suggests --undo with the record path carried across',
      nUndoTypo.err.includes(`did you mean --undo=${nRecord}?`),
      nUndoTypo.err.includes('did you mean --undo=') ? 'suggestion present, path in full' : 'no suggestion');
  } else {
    open_(
      'N3',
      'a misspelled --undo with --apply re-applies the backfill it was meant to reverse',
      `\`--apply --und=<record>\` printed "${
        /Applied: .*/.exec(nUndoTypo.out)?.[0] ?? '(no Applied line)'
      }", exit ${nUndoTypo.code}, and left ${afterTypo} of ${nBefore} channels on the default — the reversal re-done as a run, reading as success. This is exactly the consequence Daedalus measured for \`--undo <record>\` with a space and closed in Round 180; the equals-sign rule cannot reach it, because the flag name itself is what is wrong. Worst member of the family: the other misspellings widen a run, this one silently inverts the operator's intent.`
    );
  }
}
await restorePristine();

// ── Arm O — Round 180's own refusals, as regressions ─────────────────────────
console.log('\nArm O — the Round 180 refusals (regression)');
const oHash = sha(DB);
const oUndoSpace = cli([DB, '--apply', '--undo', 'some-record.json']);
check(
  'O1',
  '`--undo <record> --apply` (a space) refuses instead of re-applying',
  oUndoSpace.code === 1 && /--undo was given with no value/.test(oUndoSpace.err),
  `exit ${oUndoSpace.code} · "${errLine(oUndoSpace.err, /given with no value/)}"`
);
check(
  'O1',
  'and names the path left sitting in argv',
  oUndoSpace.err.includes('some-record.json'),
  `"${errLine(oUndoSpace.err, /extra argument/)}"`
);
const oUndoEmpty = cli([DB, '--undo=']);
check(
  'O2',
  '`--undo=` (empty) refuses under the same rule',
  oUndoEmpty.code === 1 && /--undo was given with no value/.test(oUndoEmpty.err),
  `exit ${oUndoEmpty.code} · "${errLine(oUndoEmpty.err, /given with no value/)}"`
);
check(
  'O',
  'neither refusal wrote to the DB or left a snapshot',
  sha(DB) === oHash && backupsBeside().length === 0,
  `sha256 ${sha(DB) === oHash ? 'unchanged' : 'CHANGED'} · ${backupsBeside().length} backup(s)`
);

// ── Arm P — checkUndoRecord, driven through the CLI ──────────────────────────
// New code in Round 180, unit-tested against a record a real apply produced. The
// inputs an operator actually mis-aims at `--undo` are not near-miss records —
// they are other files. Each of these must refuse in the tool's voice, name the
// problem, write nothing, and leave nothing behind.
console.log('\nArm P — the undo-record validator, at inputs that are not records');
await restorePristine();
const pApply = cli([DB, '--apply']);
check('P0', 'a clean apply to undo from', pApply.code === 0 && recordsBeside().length === 1,
  `exit ${pApply.code} · ${recordsBeside().length} record`);
const goodRecord = path.join(DATA, recordsBeside()[0]);
const pAppliedState = stillOnDefault();
const pHash = sha(DB);
const pBackupsBefore = backupsBeside().length;

const badRecords: { name: string; write: () => string; wantProblem: RegExp }[] = [
  { name: 'a JSON array', write: () => w('arr.json', '[]'), wantProblem: /not a JSON object/ },
  { name: 'a JSON null', write: () => w('null.json', 'null'), wantProblem: /not a JSON object/ },
  { name: 'a bare string', write: () => w('str.json', '"hello"'), wantProblem: /not a JSON object/ },
  {
    name: 'a future record version',
    write: () => w('v2.json', JSON.stringify({ version: 2, channels: [] })),
    wantProblem: /version is 2, expected 1/,
  },
  {
    name: 'a v1 record with no channels array',
    write: () => w('nochan.json', JSON.stringify({ version: 1 })),
    wantProblem: /no `channels` array/,
  },
  {
    name: 'a channel entry missing toEntityId',
    write: () =>
      w(
        'partial.json',
        JSON.stringify({
          version: 1,
          channels: [{ channelId: wren, fromEntityId: DEFAULT_ENTITY_ID, p2MessageIds: [], p3MessageIds: [] }],
        })
      ),
    wantProblem: /channels\[0\]\.toEntityId is not a string/,
  },
];
function w(name: string, body: string): string {
  const p = path.join(DATA, name);
  fs.writeFileSync(p, body);
  return p;
}
for (const bad of badRecords) {
  const p = bad.write();
  const r = cli([DB, `--undo=${p}`]);
  check(
    'P1',
    `${bad.name} is refused as "not a backfill undo record"`,
    r.code === 1 && /not a backfill undo record: /.test(r.err) && !/TypeError|at Object\./.test(r.err),
    `exit ${r.code} · "${errLine(r.err, /not a backfill undo record/)}"`
  );
  check(
    'P1',
    `…and the named problem is specific: ${bad.wantProblem.source.slice(0, 34)}`,
    bad.wantProblem.test(r.err),
    `"${errLine(r.err, /^ {2}\S/) || '(no problem line)'}"`
  );
}

// Not a shape problem — a parse problem, which refuses one step earlier and
// before the snapshot. Half-written files are what you get from an interrupted
// copy, which is exactly the situation you reach for undo in.
const pTrunc = w('truncated.json', fs.readFileSync(goodRecord, 'utf8').slice(0, 120));
const rTrunc = cli([DB, `--undo=${pTrunc}`]);
check(
  'P2',
  'a truncated record is named as invalid JSON, not as a wrong shape',
  rTrunc.code === 1 && /undo record is not valid JSON: /.test(rTrunc.err),
  `exit ${rTrunc.code} · "${errLine(rTrunc.err, /not valid JSON/)}"`
);
// A directory is the other everyday mis-aim: tab-completing the folder the
// records live in. ENOENT is not the error here — EISDIR is.
const rDir = cli([DB, `--undo=${DATA}`]);
check(
  'P3',
  "a directory is refused in the tool's voice, not as a raw Node error",
  rDir.code === 1 && /cannot read undo record: |no such undo record: /.test(rDir.err) && !/at Object\./.test(rDir.err),
  `exit ${rDir.code} · "${errLine(rDir.err, /undo record/)}"`
);

check(
  'P',
  'none of the refused undo runs touched the database',
  sha(DB) === pHash && stillOnDefault() === pAppliedState,
  `sha256 ${sha(DB) === pHash ? 'unchanged' : 'CHANGED'} · ${stillOnDefault()} channels on the default, as after the apply`
);
check(
  'P',
  'and none of them left a snapshot beside it',
  backupsBeside().length === pBackupsBefore,
  `${backupsBeside().length - pBackupsBefore} new backup file(s) after ${badRecords.length + 3} refused undo runs`
);
// The validator must not have become so strict that the real thing fails.
const pGood = cli([DB, `--undo=${goodRecord}`]);
check(
  'P4',
  'the record a real apply just wrote still passes the validator and reverses',
  pGood.code === 0 && stillOnDefault() === inScope,
  `exit ${pGood.code} · ${/Reverted .*/.exec(pGood.out)?.[0] ?? '(no Reverted line)'}`
);

// ── report ──────────────────────────────────────────────────────────────────
const failed = checks.filter((c) => c.ok === false);
const opens = checks.filter((c) => c.ok === 'open');
console.log(`\n${'='.repeat(78)}`);
console.log(
  `${checks.length} checks · ${failed.length} failed · ${opens.length} open · ${measurements.length} measurements`
);
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
