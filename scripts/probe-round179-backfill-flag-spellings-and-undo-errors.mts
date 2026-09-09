/**
 * Round 179 — the surfaces Round 178 *created*, driven as an operator would.
 *
 * Round 176 found four defects in the backfill CLI's operator-error paths and
 * Daedalus closed all four in Round 178 (`--channels` prefix matching, a filter
 * report that names what it did not find, a validated `--bases`, undo restoring
 * `added_at`, and `--undo` taking its own snapshot). Round 176's probe, rerun
 * this fire with its two stale lines repaired, is **51 checks · 0 failed · 1
 * open** — the fixes hold at the layer the defects were found.
 *
 * This round is the other half of that job: **new code has new edges.** Round
 * 176 could only pin behaviour that existed when it was written. The prefix
 * matcher, the `--bases` validator, the refuse-the-whole-run rule and undo's
 * snapshot are all four days old and none of them has been driven by anything
 * except the diff's own author and the probe that predates them.
 *
 * The organising question is the one Round 178 answered for three flags and not
 * for the fourth: **can an operator mistake still come back as an answer?**
 *
 * Same discipline as Round 176: the real script as a real subprocess (real
 * argv, real `KLATCH_DB` resolution, real `db.backup()`) against a real
 * file-backed database, verified through the probe's own read-only handle in
 * raw SQL rather than through the code under test. Zero model calls, zero API
 * spend. `klatch.db` is never opened — the fixture is Round 176's builder
 * writing into `.testdata/r179/` (gitignored).
 *
 * Two channels are added to that fixture by hand, with ids chosen to collide on
 * an 8-character prefix. uuids will not collide on request, and an ambiguity
 * arm that only fires when the build gets lucky is not an arm.
 *
 *   npx tsx scripts/probe-round179-backfill-flag-spellings-and-undo-errors.mts
 */

import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DATA = path.join(ROOT, '.testdata', 'r179');
const DB = path.join(DATA, 'klatch.db');
const PRISTINE = path.join(DATA, 'pristine.db');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const R176 = path.join(ROOT, 'scripts', 'probe-round176-backfill-cli-end-to-end.mts');

const DEFAULT_ENTITY_ID = 'default-entity';

// Twin ids: same first 12 characters, so an 8-char prefix off the sheet is
// genuinely ambiguous. TWIN_OUT shares its prefix with exactly one in-scope
// channel and is itself out of scope — the case where a prefix must resolve
// rather than refuse.
const TWIN_A = 'c0111111-1111-4111-8111-aaaaaaaaaaa1';
const TWIN_B = 'c0111111-1111-4111-8111-aaaaaaaaaaa2';
const SOLO_IN = 'd0222222-2222-4222-8222-bbbbbbbbbbb1';
const TWIN_OUT = 'd0222222-2222-4222-8222-bbbbbbbbbbb2';

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

/** The tool's own stderr line, past node's deprecation chatter. */
const errLine = (err: string, want: RegExp): string =>
  (err.split('\n').find((l) => want.test(l)) ?? err.split('\n').find(Boolean) ?? '').trim().slice(0, 70);

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

/** Channels still bound to the default, in scope — the population a run moves. */
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

/** Fixture back to as-built, and the litter of the previous arm swept. */
async function restorePristine(): Promise<void> {
  for (const s of ['', '-wal', '-shm']) fs.rmSync(DB + s, { force: true });
  const src = new Database(PRISTINE, { readonly: true, fileMustExist: true });
  await src.backup(DB);
  src.close();
  for (const f of [...backupsBeside(), ...recordsBeside()])
    fs.rmSync(path.join(DATA, f), { force: true });
}

// ── fixture ───────────────────────────────────────────────────────────────────

console.log('\n=== Round 179 — flag spellings, the prefix matcher, and undo error paths ===\n');

fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(path.join(ROOT, '.testdata', 'r176'), { recursive: true });

console.log("Building fixture (Round 176's builder, real importSession, file-backed DB)...");
execFileSync('npx', ['tsx', R176], {
  cwd: ROOT,
  env: { ...process.env, R176_ROLE: 'build', KLATCH_DB: DB },
  stdio: 'inherit',
});
// The builder writes its map to Round 176's own directory regardless of KLATCH_DB.
const seeded: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(ROOT, '.testdata', 'r176', 'seeded.json'), 'utf8')
);

// The four hand-made channels. Raw SQL on purpose: `importSession` mints uuids,
// and this fixture needs ids that collide.
{
  const db = new Database(DB);
  const addChannel = (id: string, name: string, source: string, opener: string) => {
    db.prepare('INSERT INTO channels (id, name, source) VALUES (?, ?, ?)').run(id, name, source);
    db.prepare(
      `INSERT INTO messages (id, channel_id, role, content, entity_id)
       VALUES (?, ?, 'user', ?, NULL)`
    ).run(crypto.randomUUID(), id, opener);
    db.prepare(
      `INSERT INTO messages (id, channel_id, role, content, entity_id)
       VALUES (?, ?, 'assistant', ?, ?)`
    ).run(crypto.randomUUID(), id, 'answer', DEFAULT_ENTITY_ID);
    db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run(
      id,
      DEFAULT_ENTITY_ID
    );
  };
  addChannel(TWIN_A, 'kite-one', 'claude-code', 'You are Kite, the first.');
  addChannel(TWIN_B, 'kite-two', 'claude-code', 'You are Kite, the second.');
  addChannel(SOLO_IN, 'lark-in', 'claude-code', 'You are Lark, in scope.');
  addChannel(TWIN_OUT, 'lark-out', 'klatch', 'You are Lark, out of scope.');
  db.close();
}
await snapshotTo(PRISTINE);

const inScope = stillOnDefault();
measure(`fixture: ${inScope} in-scope candidate channels bound to the default`);
check(
  'setup',
  'the colliding ids are both in scope',
  ro((db) =>
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM channels c JOIN channel_entities ce ON ce.channel_id = c.id
          WHERE c.id IN (?, ?) AND ce.entity_id = ? AND c.source IN ('claude-code','claude-ai')`
      )
      .get(TWIN_A, TWIN_B, DEFAULT_ENTITY_ID).n === 2
  ),
  `${TWIN_A.slice(0, 8)} matches two candidates; ${SOLO_IN.slice(0, 8)} matches one candidate and one out-of-scope channel`
);

const FILTERED = /Candidates: (\d+) of (\d+) in scope matched your --channels filter/;
const UNFILTERED = /Candidates: (\d+) — (\d+) would move/;

// ── Arm H — the two spellings of a flag ──────────────────────────────────────
// `--bases` and `--channels` are both comma lists read by the same `flagValue`.
// Round 178 taught one of them to refuse an empty value. The question is what
// the other one does with the same operator slip.
console.log('\nArm H — `--flag value` (a space) and `--flag=` (empty)');
const hHash = sha(DB);
const wren = seeded['wren'];

const hSpace = cli([DB, '--channels', wren]);
const hSpaceFiltered = FILTERED.test(hSpace.out);
if (hSpaceFiltered) {
  check('H1', '`--channels <id>` (space) is honoured or refused', true, hSpace.out.match(FILTERED)![0]);
} else {
  open_(
    'H1',
    '`--channels <id>` with a space silently plans the WHOLE corpus',
    `\`--channels\` and the id as separate argv words makes \`flagValue\` return '' (backfill-entity-bindings.mts:68), '' is falsy at :146, and \`channelIds\` becomes \`undefined\` — which means *no filter*. Measured: ${
      UNFILTERED.exec(hSpace.out)?.[0] ?? '(no candidates line)'
    }, exit ${hSpace.code}, for an operator who approved one channel. The id is swallowed as \`positional[1]\` and never echoed. This is the mirror of the fix Round 178 shipped: an operator error read as an answer — except here the answer is bigger than what was asked for, not smaller.`
  );
}
check(
  'H1',
  'the swallowed id is nowhere in the output',
  !hSpace.out.includes(wren) || hSpaceFiltered,
  hSpaceFiltered ? 'filter honoured, moot' : `the id the operator typed (${wren.slice(0, 8)}) appears 0 times in stdout`
);

// The control: the sibling flag, same slip, and Round 178's own fix in it.
const hBasesSpace = cli([DB, '--bases', 'none']);
check(
  'H2',
  '`--bases <value>` (space) is refused by name — the sibling flag is protected',
  hBasesSpace.code === 1 && /--bases was given with no values/.test(hBasesSpace.err),
  `exit ${hBasesSpace.code} · "${hBasesSpace.err.split('\n').filter(Boolean).slice(-2)[0]?.trim().slice(0, 60)}"`
);

const hEmpty = cli([DB, '--channels=']);
if (FILTERED.test(hEmpty.out)) {
  check('H3', '`--channels=` (empty) is honoured or refused', true, hEmpty.out.match(FILTERED)![0]);
} else {
  open_(
    'H3',
    '`--channels=` with no value silently plans the whole corpus',
    `Same falsy-'' path as H1, reached by typing the flag and deleting its value: ${
      UNFILTERED.exec(hEmpty.out)?.[0] ?? '(no candidates line)'
    }, exit ${hEmpty.code}. \`--bases=\` on the same line is refused with "given with no values" — the two flags disagree about what an empty list means.`
  );
}

const hDegenerate = cli([DB, '--channels=,,']);
const hDegMatch = FILTERED.exec(hDegenerate.out);
check(
  'H4',
  'a comma-only --channels list at least states its denominator',
  hDegMatch?.[1] === '0' && !!hDegMatch?.[2],
  hDegMatch?.[0] ?? hDegenerate.out.slice(-160)
);
if (!/did not resolve|no values/.test(hDegenerate.out + hDegenerate.err)) {
  open_(
    'H4',
    'a comma-only --channels list reports 0 candidates and exits 0',
    `\`--channels=,,\` survives \`.filter(Boolean)\` as an empty array, which is truthy, so the filter is applied and matches nothing: "${
      hDegMatch?.[0] ?? '?'
    }", exit ${hDegenerate.code}, nothing echoed as unresolved. Milder than H1/H3 — the "of ${inScope} in scope" wording does tell the reader a filter ran — but the empty list itself is never named, and \`--bases\` refuses the same input.`
  );
}
check('H', 'no arm-H run mutated the DB', sha(DB) === hHash, sha(DB) === hHash ? 'sha256 unchanged' : 'FILE CHANGED');

// ── Arm I — what H1 costs when --apply is on the line ────────────────────────
// H1 measured a plan. This measures the write, because "plans the whole corpus"
// and "moves the whole corpus" are different claims and only one of them is the
// reason to care.
console.log('\nArm I — the same slip, with --apply');
await restorePristine();
const beforeApply = stillOnDefault();
const iRun = cli([DB, '--apply', '--channels', wren]);
const afterApply = stillOnDefault();
const movedCount = beforeApply - afterApply;
const wrenStillDefault = ro((db) =>
  db
    .prepare('SELECT COUNT(*) AS n FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
    .get(wren, DEFAULT_ENTITY_ID)
).n;
if (movedCount <= 1) {
  check('I1', 'approving one channel moves at most one channel', true, `${movedCount} moved (exit ${iRun.code})`);
} else {
  open_(
    'I1',
    'approving one channel with a space moves the whole corpus',
    `\`--apply --channels ${wren.slice(0, 8)}…\` (space, not \`=\`) re-pointed **${movedCount} channels**, not the 1 approved: "${
      /Applied: .*/.exec(iRun.out)?.[0] ?? '(no Applied line)'
    }", exit ${iRun.code}. The approved channel did move (${
      wrenStillDefault === 0 ? 'yes' : 'no'
    }), so nothing in the output distinguishes this from the run the operator wanted. The undo record covers it — ${
      recordsBeside().length
    } record(s) written — which is the difference between this and a disaster, but the recovery is the operator noticing.`
  );
}
measure(`with --apply and a space: ${movedCount} of ${beforeApply} in-scope channels moved, ${recordsBeside().length} undo record written`);
await restorePristine();

// ── Arm J — the prefix matcher, on ids built to collide ──────────────────────
console.log('\nArm J — prefix matching');
const jHash = sha(DB);

const jAmbiguous = cli([DB, `--channels=${TWIN_A.slice(0, 8)}`]);
check(
  'J1',
  'an ambiguous prefix is refused, by name, with its matches',
  /ambiguous prefix, matches 2 channels/.test(jAmbiguous.out) &&
    jAmbiguous.out.includes(TWIN_A.slice(0, 12)) &&
    jAmbiguous.out.includes(TWIN_B.slice(0, 12)),
  (/ {2}--channels .*ambiguous.*/.exec(jAmbiguous.out)?.[0] ?? jAmbiguous.out.slice(-200)).trim()
);
check(
  'J1',
  'an ambiguous prefix matches neither, rather than guessing',
  FILTERED.exec(jAmbiguous.out)?.[1] === '0' && jAmbiguous.code === 2,
  `${FILTERED.exec(jAmbiguous.out)?.[0]} · exit ${jAmbiguous.code}`
);

// The matches are echoed so the operator can pick one of them. Whether they
// can depends on the echo being long enough to tell them apart — and ids that
// are ambiguous are by construction ids that share a prefix.
const jAmbLine = / {2}--channels [^\n]*ambiguous prefix[^\n]*/.exec(jAmbiguous.out)?.[0] ?? '';
const jAmbShown = /\(([^)]*)\)/.exec(jAmbLine)?.[1]?.split(', ') ?? [];
if (jAmbShown.length === 2 && jAmbShown[0] !== jAmbShown[1]) {
  check('J1', 'the echoed matches are distinguishable from each other', true, jAmbLine.trim());
} else {
  open_(
    'J1',
    'the ambiguity report prints both matches identically, so it cannot be acted on',
    `The refusal is right and the message names the problem, but it truncates each match to 12 characters (backfill-entity-bindings.mts:172, \`m.slice(0, 12)\`). Two ids ambiguous on 8 characters usually share 12: here it prints "${jAmbLine.trim()}" — the same string twice, for two different channels. The operator is told to choose and shown nothing to choose between; the remedy the message implies (paste a longer id) is the one thing the output does not enable. Printing enough characters to make the matches unique — or the names beside them — closes it.`
  );
}

const jExact = cli([DB, `--channels=${TWIN_A}`]);
check(
  'J2',
  'a full id that is a prefix of nothing else resolves outright',
  FILTERED.exec(jExact.out)?.[1] === '1' && jExact.code === 0,
  `${FILTERED.exec(jExact.out)?.[0]} · exit ${jExact.code}`
);

const jScope = cli([DB, `--channels=${SOLO_IN.slice(0, 8)}`]);
check(
  'J3',
  'a prefix shared with an OUT-of-scope channel resolves to the in-scope one',
  FILTERED.exec(jScope.out)?.[1] === '1' && jScope.code === 0,
  `${SOLO_IN.slice(0, 8)} also prefixes ${TWIN_OUT.slice(0, 12)} (source klatch) → ${
    FILTERED.exec(jScope.out)?.[0]
  }, exit ${jScope.code}`
);

// The likeliest paste error there is: a comma list typed with spaces after the
// commas. Round 176 found this class silent; it must now be loud.
const jSpaced = cli([DB, `--channels=${seeded['wren']}, ${seeded['tarn-a']}`]);
check(
  'J4',
  'a space after the comma is reported, not silently dropped',
  jSpaced.out.includes(` ${seeded['tarn-a']}: matched no in-scope candidate`) && jSpaced.code === 2,
  `exit ${jSpaced.code} · ${
    /did not resolve/.test(jSpaced.out) ? 'echoed in the "did not resolve" block' : 'NOT echoed'
  }`
);

// Deliberately one of the hand-made ids, not a seeded uuid. The first run of
// this arm used `wren`, whose 8-character prefix that build happened to render
// as eight digits — upper-casing it changed nothing and the arm passed for a
// reason unrelated to case. An arm whose input depends on the build's luck is
// not an arm; `d0222222` has a letter in it by construction.
const jUpperId = SOLO_IN.slice(0, 8).toUpperCase();
const jUpper = cli([DB, `--channels=${jUpperId}`]);
check(
  'J5',
  'an upper-cased id is reported unmatched, not silently zero',
  jUpper.out.includes(`--channels ${jUpperId}: matched no in-scope candidate`) && jUpper.code === 2,
  `${jUpperId} (lower-case matches 1) → exit ${jUpper.code}`
);

const jLong = cli([DB, `--channels=${wren}00`]);
check(
  'J6',
  'an over-long id is reported unmatched',
  jLong.out.includes('matched no in-scope candidate') && jLong.code === 2,
  `exit ${jLong.code}`
);

// The rule Round 178 chose: a list of approvals is refused whole, not applied
// in part. This is the arm that says it in writes.
const jPartial = cli([DB, '--apply', `--channels=${seeded['wren']},not-a-real-id`]);
check(
  'J7',
  'one bad entry refuses the whole apply',
  jPartial.code === 2 && /Refusing to apply/.test(jPartial.err),
  `exit ${jPartial.code} · "${errLine(jPartial.err, /Refusing to apply/)}"`
);
check(
  'J7',
  'the refused apply wrote nothing and left nothing behind',
  sha(DB) === jHash && backupsBeside().length === 0 && recordsBeside().length === 0,
  `sha256 ${sha(DB) === jHash ? 'unchanged' : 'CHANGED'} · ${backupsBeside().length} backup(s), ${
    recordsBeside().length
  } record(s) beside the DB`
);
check(
  'J7',
  'the good half of the list was not applied',
  ro((db) =>
    db
      .prepare('SELECT COUNT(*) AS n FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
      .get(seeded['wren'], DEFAULT_ENTITY_ID)
  ).n === 1,
  'the approved channel is still on the default — an all-or-nothing list behaved that way'
);
check('J', 'no arm-J run mutated the DB', sha(DB) === jHash, sha(DB) === jHash ? 'sha256 unchanged' : 'FILE CHANGED');

// ── Arm K — the --bases validator, in its own right ──────────────────────────
console.log('\nArm K — --bases validation');
const kHash = sha(DB);

const kMixed = cli([DB, '--bases=identity-claim,bogus']);
check(
  'K1',
  'a mixed list names only the bad value',
  kMixed.code === 1 &&
    /unknown --bases value\(s\): bogus/.test(kMixed.err) &&
    !/identity-claim,/.test(/unknown --bases value\(s\): .*/.exec(kMixed.err)?.[0] ?? ''),
  `exit ${kMixed.code} · "${/unknown --bases value\(s\): .*/.exec(kMixed.err)?.[0]}"`
);
check(
  'K1',
  'the refusal prints the valid list',
  /valid bases: identity-claim, project-name, none/.test(kMixed.err),
  (/valid bases: .*/.exec(kMixed.err)?.[0] ?? '(absent)').slice(0, 80)
);
const kUpper = cli([DB, '--bases=IDENTITY-CLAIM']);
check(
  'K2',
  'an upper-cased basis is refused, not silently excluding everything',
  kUpper.code === 1 && /unknown --bases value/.test(kUpper.err),
  `exit ${kUpper.code}`
);
check(
  'K3',
  'a refused --bases leaves no snapshot beside the DB',
  backupsBeside().length === 0,
  `${backupsBeside().length} backup file(s) beside klatch.db after 3 refusals`
);
check('K', 'no arm-K run mutated the DB', sha(DB) === kHash, sha(DB) === kHash ? 'sha256 unchanged' : 'FILE CHANGED');

// ── Arm L — undo's own error paths, now that undo takes a snapshot ───────────
// Round 176 argued `--undo` should snapshot because you reach for it when
// something has already gone wrong. It does now. That makes undo's *failure*
// modes worth driving: they run after the snapshot is taken.
console.log('\nArm L — undo error paths');
await restorePristine();

const lApply = cli([DB, '--apply']);
check('L0', 'a clean apply to undo from', lApply.code === 0 && recordsBeside().length === 1, `exit ${lApply.code} · ${recordsBeside().length} record`);
const recordPath = path.join(DATA, recordsBeside()[0]);
const appliedState = stillOnDefault();
const backupsBeforeUndoErrors = backupsBeside().length;

const lMissing = cli([DB, '--undo=' + path.join(DATA, 'no-such-record.json')]);
const lMissingSpoke = /no such (undo )?record|not a backfill record|usage:/i.test(lMissing.err);
if (lMissingSpoke) {
  check('L1', '--undo names a missing record in the tool\'s own voice', true, lMissing.err.trim().split('\n')[0]?.slice(0, 80));
} else {
  open_(
    'L1',
    '--undo of a missing record is a raw Node stack trace, and it leaves a backup behind',
    `\`--undo=<missing>\` prints "${
      /Error: ENOENT[^\n]*/.exec(lMissing.err)?.[0]?.slice(0, 70) ?? lMissing.err.split('\n')[0]
    }" with a stack, exit ${lMissing.code} — where the same script says \`no such database: <path>\` for a bad positional (backfill-entity-bindings.mts:80). It also took its snapshot first (:96), so a full-size copy of the database is left beside it with nothing to clean it up: ${
      backupsBeside().length - backupsBeforeUndoErrors
    } new backup file(s) after this one run.`
  );
}

fs.writeFileSync(path.join(DATA, 'not-a-record.json'), '{"ok":true}');
const lShape = cli([DB, '--undo=' + path.join(DATA, 'not-a-record.json')]);
const lShapeSpoke = /not a backfill record|missing .*channels|usage:/i.test(lShape.err);
if (lShapeSpoke) {
  check('L2', '--undo names a wrong-shaped record in the tool\'s own voice', true, lShape.err.trim().split('\n')[0]?.slice(0, 80));
} else {
  open_(
    'L2',
    '--undo of a well-formed JSON file that is not a record throws from inside the module',
    `A JSON file the operator points at by mistake — the sheet, another tool's output — reaches \`undoEntityBackfill\` unvalidated (backfill-entity-bindings.mts:114-115) and throws "${
      /TypeError: [^\n]*/.exec(lShape.err)?.[0]?.slice(0, 60) ?? '?'
    }" from entity-backfill.ts, exit ${lShape.code}. Same snapshot-then-crash shape as L1.`
  );
}
check(
  'L1/L2',
  'a failed undo writes nothing to the database',
  stillOnDefault() === appliedState && sha(DB) === sha(DB),
  `${stillOnDefault()} channels still on the default, unchanged by two failed undo runs`
);

// The backward-replay claim: a record written before `fromAddedAt` existed must
// still replay. Tested by removing the field, which is what such a record is.
const rec = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
const withAddedAt = rec.channels.filter((c: any) => c.fromAddedAt).length;
measure(`undo record: ${rec.channels.length} channel(s), ${withAddedAt} carrying fromAddedAt`);
const legacy = {
  ...rec,
  channels: rec.channels.map((c: any) => {
    const { fromAddedAt, ...rest } = c;
    return rest;
  }),
};
const legacyPath = path.join(DATA, 'legacy-record.json');
fs.writeFileSync(legacyPath, JSON.stringify(legacy, null, 2));
const lLegacy = cli([DB, `--undo=${legacyPath}`]);
check(
  'L3',
  'a record with no fromAddedAt still replays (the COALESCE claim)',
  lLegacy.code === 0 && /Reverted \d+ channel\(s\)/.test(lLegacy.out),
  `exit ${lLegacy.code} · ${/Reverted .*/.exec(lLegacy.out)?.[0]}`
);
check(
  'L3',
  'and it restores the default binding rather than violating NOT NULL',
  stillOnDefault() === inScope,
  `${stillOnDefault()} of ${inScope} in-scope channels back on the default`
);
const legacyAddedAt = ro((db) =>
  db
    .prepare('SELECT added_at FROM channel_entities WHERE channel_id = ? AND entity_id = ?')
    .get(seeded['wren'], DEFAULT_ENTITY_ID)
) as { added_at: string } | undefined;
check(
  'L3',
  'the replayed row carries a real timestamp (the undo clock, as documented)',
  !!legacyAddedAt?.added_at,
  `added_at = ${legacyAddedAt?.added_at ?? 'NULL'}`
);

// Undo's snapshot, checked for content rather than for existence: it must hold
// the state undo was about to overwrite.
const undoBackup = /^Backup \(taken before anything was written\): (.+)$/m.exec(lLegacy.out)?.[1];
let undoBackupHoldsPreUndo = false;
if (undoBackup && fs.existsSync(undoBackup)) {
  const b = new Database(undoBackup, { readonly: true, fileMustExist: true });
  undoBackupHoldsPreUndo =
    (
      b
        .prepare(
          `SELECT COUNT(*) AS n FROM channels c JOIN channel_entities ce ON ce.channel_id = c.id
            WHERE ce.entity_id = ? AND c.source IN ('claude-code','claude-ai')`
        )
        .get(DEFAULT_ENTITY_ID) as { n: number }
    ).n === appliedState;
  b.close();
}
check(
  'L4',
  "undo's snapshot holds the pre-undo state, not the post-undo state",
  undoBackupHoldsPreUndo,
  `snapshot shows ${appliedState} channels on the default (the applied state undo was about to reverse); live DB now shows ${stillOnDefault()}`
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
