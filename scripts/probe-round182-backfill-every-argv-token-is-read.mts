/**
 * Round 182 — every token in the backfill CLI's argv is read, or the run refuses.
 *
 * Theseus's Round 181 found the sixth member of a family Rounds 176–180 had been
 * closing one door at a time: a flag the parser does not recognise returns
 * `undefined` from `flagValue`, which is also what "not given" returns, so
 * `--channel=<id>` (singular) planned and applied the whole corpus at exit 0, and
 * `--apply --und=<record>` re-applied the backfill it was meant to reverse.
 * Round 180's empty-value rule cannot see either — the value is not empty, the
 * name is wrong.
 *
 * The fix is one rule at the parse boundary rather than one guard per spelling,
 * so this probe aims at the rule, not the spellings. Driving his findings on the
 * pre-fix script turned up four more inputs that were silently ignored at exit 0,
 * and they are arms here because they are the same rule:
 *
 *   - a second `--bases=` behind the first (`--bases=identity-claim --bases=none`
 *     planned 4 moves where the operator's last word was "none")
 *   - a second `--channels=` behind the first
 *   - `--channels=a, b` typed into a shell, which hands the script `b` as a stray
 *     positional argument that nothing read
 *   - `--undo=<record> --channels=<id>`, where the filter is never read on the undo
 *     path and the whole record is reversed
 *
 * Arm Y is the other half and matters as much: the correctly spelled forms, and
 * Round 180's specific remedies for the space slips, must survive the new rule.
 * A parser strict enough to refuse `--channels <id>` before its own refusal can
 * name the stray id would be a regression dressed as a tightening.
 *
 * **Negative control.** `R182_CLI=<path>` points the probe at another copy of the
 * CLI. Run it against the pre-fix script (`git show a76319a4:scripts/…` saved
 * under `.testdata/`, so its relative imports still resolve) and the arms must
 * fail; if they pass there, they are not measuring the fix.
 *
 * Same discipline as Rounds 176/178/179/181: the real script as a real subprocess
 * against a real file-backed DB built by Round 176's builder, verified through
 * this probe's own read-only handle in raw SQL. Zero model calls.
 *
 *   npx tsx scripts/probe-round182-backfill-every-argv-token-is-read.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r182');
const DB = path.join(DATA, 'klatch.db');
const PRISTINE = path.join(DATA, 'pristine.db');
// A positional path wins over R182_CLI: an env-prefixed command needs approval in
// a non-interactive session, and the negative control has to be runnable there.
const cliOverride = process.argv[2] ?? process.env.R182_CLI;
const CLI = cliOverride
  ? path.resolve(cliOverride)
  : path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

// ── harness ───────────────────────────────────────────────────────────────────

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
const backupsBeside = () =>
  fs.readdirSync(DATA).filter((f) => f.startsWith('klatch.db.backup-backfill-'));
const recordsBeside = () =>
  fs.readdirSync(DATA).filter((f) => /^klatch\.db\.backfill-.*\.json$/.test(f));
// tsx's own DeprecationWarning lands on stderr first under some Node versions;
// it is not the CLI speaking.
const firstLine = (s: string) =>
  (s.split('\n').find((l) => l.trim() && !/DeprecationWarning|--trace-deprecation/.test(l)) ?? '')
    .trim()
    .slice(0, 90);

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
              WHERE ce.entity_id = 'default-entity' AND c.source IN ('claude-code','claude-ai')`
          )
          .get() as { n: number }
      ).n
  );

async function copyDb(from: string, to: string): Promise<void> {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(to + s, { force: true });
  const src = new Database(from, { readonly: true, fileMustExist: true });
  await src.backup(to);
  src.close();
}

const FILTERED = /Candidates: (\d+) of (\d+) in scope matched your --channels filter/;
const UNFILTERED = /Candidates: (\d+) — (\d+) would move/;
const planned = (out: string) => FILTERED.test(out) || UNFILTERED.test(out);

// ── fixture ───────────────────────────────────────────────────────────────────

console.log(`\n=== Round 182 — every argv token is read, or the run refuses ===`);
console.log(`CLI under test: ${path.relative(ROOT, CLI)}\n`);

fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });
execFileSync('npx', ['tsx', R176], {
  cwd: ROOT,
  env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: DB },
  stdio: 'ignore',
});
const seeded: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(ROOT, '.testdata', 'r176', 'seeded.json'), 'utf8')
);
await copyDb(DB, PRISTINE);
const W = seeded['wren'];
const T = seeded['tarn-a'];
const inScope = stillOnDefault();
console.log(`fixture: ${inScope} in-scope channels on the default; wren=${W.slice(0, 8)}…, tarn-a=${T.slice(0, 8)}…`);

// ── Arm S — a flag with the wrong name refuses before anything is read ───────
// Each of these came back as a plan (or an apply) at exit 0 before the fix.
console.log('\nArm S — misspelled and malformed flags');
const sHash = sha(DB);
const misspelt: { token: string; why: string; suggests?: string }[] = [
  { token: `--channel=${W}`, why: 'singular', suggests: `--channels=${W}` },
  { token: `--chanels=${W}`, why: 'a dropped letter', suggests: `--channels=${W}` },
  { token: `--Channels=${W}`, why: 'capitalised', suggests: `--channels=${W}` },
  { token: `-channels=${W}`, why: 'one hyphen', suggests: `--channels=${W}` },
  { token: '--base=none', why: 'singular --bases', suggests: '--bases=none' },
  { token: '--apply=yes', why: '--apply given a value' },
  { token: '--dry-run', why: 'a flag from some other tool' },
];
for (const { token, why, suggests } of misspelt) {
  const r = cli([DB, token]);
  check(
    'S1',
    `\`${token.split('=')[0]}\` (${why}) refuses, exit 1, no plan printed`,
    r.code === 1 && /^Refusing to run/m.test(r.err) && !planned(r.out),
    `exit ${r.code} · "${firstLine(r.err)}"${planned(r.out) ? ' · A PLAN WAS PRINTED' : ''}`
  );
  check(
    'S1',
    '…and echoes the token exactly as typed',
    r.err.includes(token),
    r.err.includes(token) ? 'echoed in full' : 'NOT echoed'
  );
  if (suggests) {
    check(
      'S1',
      `…and suggests a pasteable \`${suggests.split('=')[0]}\` carrying the operator's value`,
      r.err.includes(`did you mean ${suggests}?`),
      r.err.includes(`did you mean ${suggests}?`) ? `"did you mean ${suggests.slice(0, 22)}…?"` : 'no suggestion'
    );
  }
}
check(
  'S',
  'no arm-S run touched the DB or left a snapshot',
  sha(DB) === sHash && backupsBeside().length === 0,
  `sha256 ${sha(DB) === sHash ? 'unchanged' : 'CHANGED'} · ${backupsBeside().length} backup(s)`
);

// ── Arm T — a flag given twice ────────────────────────────────────────────────
// Only the first was ever read. Refused rather than merged or last-wins: the
// operator who types `--bases=identity-claim --bases=none` has said two things.
console.log('\nArm T — a value flag given twice');
const tBases = cli([DB, '--bases=identity-claim', '--bases=none']);
check(
  'T1',
  '`--bases=identity-claim --bases=none` refuses instead of planning with the first',
  tBases.code === 1 && /--bases was already given/.test(tBases.err) && !planned(tBases.out),
  `exit ${tBases.code} · ${UNFILTERED.exec(tBases.out)?.[0] ?? `"${firstLine(tBases.err)}"`}`
);
const tChannels = cli([DB, `--channels=${W}`, `--channels=${T}`]);
check(
  'T2',
  '`--channels=<a> --channels=<b>` refuses instead of dropping the second approval',
  tChannels.code === 1 && tChannels.err.includes(`--channels=${T}`) && !planned(tChannels.out),
  `exit ${tChannels.code} · ${FILTERED.exec(tChannels.out)?.[0] ?? `"${firstLine(tChannels.err)}"`}`
);

// ── Arm U — an argument nothing reads ─────────────────────────────────────────
console.log('\nArm U — stray positional arguments');
// Two argv entries, as a shell delivers `--channels=a, b`. (Round 179's J4 passes
// the same text as ONE entry, which is a different input and stays a filter
// report — that arm is not this one.)
const uSplit = cli([DB, `--channels=${W},`, T]);
check(
  'U1',
  '`--channels=<a>, <b>` split by the shell refuses and names <b> in full',
  uSplit.code === 1 && /unexpected argument/.test(uSplit.err) && uSplit.err.includes(T) && !planned(uSplit.out),
  `exit ${uSplit.code} · ${FILTERED.exec(uSplit.out)?.[0] ?? `"${firstLine(uSplit.err)}"`}`
);
const uExtra = cli([DB, 'second.db']);
check(
  'U2',
  'a second path refuses rather than being ignored',
  uExtra.code === 1 && /unexpected argument/.test(uExtra.err) && !planned(uExtra.out),
  `exit ${uExtra.code} · "${firstLine(uExtra.err)}"`
);
check(
  'U',
  'no arm-U run touched the DB or left a snapshot',
  sha(DB) === sHash && backupsBeside().length === 0,
  `sha256 ${sha(DB) === sHash ? 'unchanged' : 'CHANGED'} · ${backupsBeside().length} backup(s)`
);

// ── Arm V — the same slips with writes on the line ───────────────────────────
console.log('\nArm V — with --apply, and on the undo path');
const vTypo = cli([DB, '--apply', `--channel=${W}`]);
check(
  'V1',
  '`--apply --channel=<id>` moves nothing and writes nothing',
  vTypo.code === 1 && stillOnDefault() === inScope && backupsBeside().length === 0 && recordsBeside().length === 0,
  `exit ${vTypo.code} · ${inScope - stillOnDefault()} moved · ${backupsBeside().length} backup(s), ${recordsBeside().length} record(s)`
);

// Back to pristine whatever V1 did. On the pre-fix script V1 really moves 4, and
// the first negative-control run measured V2–V4 on top of that — V2 exited 2
// because its channel had already moved, and V4's revert count was meaningless.
await copyDb(PRISTINE, DB);
for (const f of [...backupsBeside(), ...recordsBeside()]) fs.rmSync(path.join(DATA, f), { force: true });

// A real two-channel apply, so there is a record to mis-aim an undo at.
const vApply = cli([DB, '--apply', `--channels=${W},${T}`]);
const afterApply = stillOnDefault();
const record = recordsBeside()[0] ? path.join(DATA, recordsBeside()[0]) : '';
check(
  'V2',
  'control: a correctly spelled two-channel apply moves two and writes a record',
  vApply.code === 0 && inScope - afterApply === 2 && !!record,
  `exit ${vApply.code} · ${inScope - afterApply} moved · record ${record ? 'written' : 'MISSING'}`
);

if (record) {
  const backupsBefore = backupsBeside().length;
  const vUnd = cli([DB, '--apply', `--und=${record}`]);
  check(
    'V3',
    '`--apply --und=<record>` refuses — it does not re-apply, and it does not half-undo',
    vUnd.code === 1 && stillOnDefault() === afterApply && recordsBeside().length === 1,
    `exit ${vUnd.code} · ${stillOnDefault()} on the default (was ${afterApply}) · ${recordsBeside().length} record(s)`
  );
  check(
    'V3',
    '…and points at the spelling that works, with the path carried across',
    vUnd.err.includes(`did you mean --undo=${record}?`),
    vUnd.err.includes('did you mean --undo=') ? 'suggestion present' : 'no suggestion'
  );

  // Measured from the state immediately before this run, not from `afterApply`:
  // on the pre-fix script V3 has already re-applied two more channels by now, and
  // the first control run printed "0 reverted" for an undo that reverted 2.
  const beforeNarrow = stillOnDefault();
  const vNarrow = cli([DB, `--undo=${record}`, `--channels=${W}`]);
  const reverted = stillOnDefault() - beforeNarrow;
  check(
    'V4',
    '`--undo=<record> --channels=<one>` refuses instead of reversing the whole record',
    vNarrow.code === 1 && reverted === 0 && /cannot narrow an --undo/.test(vNarrow.err),
    `exit ${vNarrow.code} · ${reverted} channel(s) reverted where 1 was named · "${firstLine(vNarrow.err)}"`
  );
  check(
    'V',
    'none of the refused runs in this arm left a snapshot',
    backupsBeside().length === backupsBefore,
    `${backupsBeside().length - backupsBefore} new backup(s) after 2 refusals`
  );

  const vUndo = cli([DB, `--undo=${record}`]);
  check(
    'V5',
    'control: the correctly spelled --undo still reverses the run',
    vUndo.code === 0 && stillOnDefault() === inScope,
    `exit ${vUndo.code} · ${stillOnDefault()} of ${inScope} back on the default`
  );
}

// ── Arm Y — what must still work ──────────────────────────────────────────────
console.log('\nArm Y — the correct forms, and Round 180\'s remedies, survive the rule');
await copyDb(PRISTINE, DB);
for (const f of [...backupsBeside(), ...recordsBeside()]) fs.rmSync(path.join(DATA, f), { force: true });

const yOne = cli([DB, `--channels=${W}`]);
check('Y1', '`--channels=<id>` plans exactly one', FILTERED.exec(yOne.out)?.[1] === '1' && yOne.code === 0,
  `${FILTERED.exec(yOne.out)?.[0]} · exit ${yOne.code}`);
const yNone = cli([DB, '--bases=none']);
check('Y2', '`--bases=none` applies no basis', /Bases applied: none/.test(yNone.out) && yNone.code === 0,
  `${/Bases applied: .*/.exec(yNone.out)?.[0]} · exit ${yNone.code}`);
const yNoop = cli([DB, '--apply', '--bases=none']);
check('Y3', '`--apply --bases=none` is still "nothing to apply", exit 0', /Nothing to apply/.test(yNoop.out) && yNoop.code === 0,
  `exit ${yNoop.code}`);
// Round 180's space-form remedy names the stray as the value it was meant to be.
// The stray-argument rule must defer to it, not pre-empt it with a generic line.
const ySpace = cli([DB, '--channels', W]);
check(
  'Y4',
  '`--channels <id>` still gets Round 180\'s equals-sign remedy, naming the id',
  ySpace.code === 1 && /Use an equals sign/.test(ySpace.err) && ySpace.err.includes(W) && !/unexpected argument/.test(ySpace.err),
  `exit ${ySpace.code} · "${firstLine(ySpace.err)}"`
);
const yBasesSpace = cli([DB, '--bases', 'none']);
check(
  'Y5',
  '`--bases <v>` still refuses as "given with no values"',
  yBasesSpace.code === 1 && /--bases was given with no values/.test(yBasesSpace.err),
  `exit ${yBasesSpace.code} · "${firstLine(yBasesSpace.err)}"`
);
const yUndoSpace = cli([DB, '--apply', '--undo', 'some-record.json']);
check(
  'Y6',
  '`--apply --undo <record>` still gets Round 180\'s refusal, naming the path',
  yUndoSpace.code === 1 && /--undo was given with no value/.test(yUndoSpace.err) && yUndoSpace.err.includes('some-record.json'),
  `exit ${yUndoSpace.code} · "${firstLine(yUndoSpace.err)}"`
);
check(
  'Y',
  'arm Y left the DB as it found it',
  sha(DB) === sha(PRISTINE) || stillOnDefault() === inScope,
  `${stillOnDefault()} of ${inScope} on the default · ${backupsBeside().length} backup(s)`
);

// ── summary ───────────────────────────────────────────────────────────────────
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length} checks · ${failed.length} failed`);
for (const c of failed) console.log(`  FAILED ${c.arm} · ${c.name}`);
process.exit(failed.length ? 1 : 0);
