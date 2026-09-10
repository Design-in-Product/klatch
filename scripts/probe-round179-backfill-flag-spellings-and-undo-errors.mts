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
 * **Re-vehicled 2026-09-09 (STOP fire), after Round 180 closed all five findings.**
 * Five arms — H1, H3, H4, I1, J1's third check and L2 — were written to recognise
 * *honoured* and could not recognise *refused*, so the fix read as the defect
 * still standing (33 checks · 1 failed · 4 open against fixed code, every arm's
 * own interpolated measurement contradicting its prose). The invariants are
 * unchanged and none was weakened; what changed is which output satisfies them.
 * Same category as Round 176's G4 and arm E. Each re-vehicled arm carries a
 * comment saying what it used to assert and why that stopped being the question.
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

// Re-vehicled after Round 180 (Daedalus). The original arm asked "honoured or
// refused?" and could only recognise *honoured*, so the fix — refusal — read as
// the defect still standing. The invariant was always "an operator error must
// not come back as an answer"; what changed is which output satisfies it.
const hSpace = cli([DB, '--channels', wren]);
check(
  'H1',
  '`--channels <id>` (a space, not `=`) refuses instead of switching the filter off',
  hSpace.code === 1 && /--channels was given with no values/.test(hSpace.err),
  `exit ${hSpace.code} · "${errLine(hSpace.err, /given with no values/)}"`
);
check(
  'H1',
  'no plan is printed at all — the run stops before the corpus is read',
  !FILTERED.test(hSpace.out) && !UNFILTERED.test(hSpace.out),
  UNFILTERED.exec(hSpace.out)?.[0] ?? FILTERED.exec(hSpace.out)?.[0] ?? 'no Candidates line in stdout'
);
// The inverse of the original arm's second check. Round 179 measured the typed
// id appearing 0 times; the remedy for *this* slip is that the ids are sitting
// in argv unread, so naming them is the whole point of the message.
check(
  'H1',
  'the refusal names the id left sitting in argv, in full',
  hSpace.err.includes(wren),
  `"${wren.slice(0, 8)}…" ${hSpace.err.includes(wren) ? 'echoed as the stray argument' : 'NOT echoed'}`
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
check(
  'H3',
  '`--channels=` (typed, then emptied) refuses under the same rule',
  hEmpty.code === 1 && /--channels was given with no values/.test(hEmpty.err),
  `exit ${hEmpty.code} · "${errLine(hEmpty.err, /given with no values/)}"`
);

const hDegenerate = cli([DB, '--channels=,,']);
// Round 179's H4 asserted the `0 of 11` denominator line, which its own note
// called the *mild* acceptable outcome. It is now the strict one: a comma-only
// list is an empty list and refuses like one.
check(
  'H4',
  'a comma-only `--channels=,,` refuses rather than reporting a 0 denominator',
  hDegenerate.code === 1 && /--channels was given with no values/.test(hDegenerate.err),
  `exit ${hDegenerate.code} · "${errLine(hDegenerate.err, /given with no values/)}"`
);
// The two slips share a refusal but not a remedy, and that distinction is
// deliberate (Round 180). An arm that only checked the shared first line would
// pass if the second line were dropped or crossed over.
check(
  'H1/H3/H4',
  'the space form and the empty form give *different* remedies',
  /Use an equals sign/.test(hSpace.err) &&
    !/Use an equals sign/.test(hEmpty.err) &&
    /not the same request as no list/.test(hEmpty.err) &&
    /not the same request as no list/.test(hDegenerate.err),
  `space → "Use an equals sign…"; \`--channels=\` and \`,,\` → "…not the same request as no list"`
);
check(
  'H1/H3/H4',
  'none of the three refusals left a snapshot beside the DB',
  backupsBeside().length === 0,
  `${backupsBeside().length} backup file(s) after 3 refusals`
);
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
// Round 179 measured 7 of 11 channels moving here. `movedCount <= 1` was the
// right bound then; on its own it is now too weak — a run that refused and a run
// that moved the single approved channel both satisfy it, and only one of those
// is what the code does. Assert the refusal itself.
check(
  'I1',
  '`--apply --channels <id>` (space) refuses before writing anything',
  iRun.code === 1 && movedCount === 0 && wrenStillDefault === 1,
  `exit ${iRun.code} · ${movedCount} of ${beforeApply} channels moved · the approved channel is ${
    wrenStillDefault === 1 ? 'still on the default' : 'MOVED'
  }`
);
check(
  'I1',
  'and left neither a backup nor an undo record behind',
  backupsBeside().length === 0 && recordsBeside().length === 0,
  `${backupsBeside().length} backup(s), ${recordsBeside().length} record(s) beside klatch.db`
);
measure(
  `with --apply and a space: ${movedCount} of ${beforeApply} in-scope channels moved (was 7 of 11 in Round 179), ${recordsBeside().length} undo record written`
);
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
// Re-vehicled after Round 180: the matches used to be a parenthesised, 12-char
// truncated list on the header line — which printed the same string twice. They
// are now indented lines *below* the header, `      <full-id>  <name>`. The old
// predicate parsed parens off one line and can no longer see them at all.
const jAmbShown = jAmbiguous.out
  .split('\n')
  .map((l) => /^ {6}(\S+) {2}(.*)$/.exec(l))
  .filter(Boolean) as RegExpExecArray[];
check(
  'J1',
  'both matches are echoed in full, one per line, with the channel name beside them',
  jAmbShown.length === 2 &&
    jAmbShown.map((m) => m[1]).sort().join() === [TWIN_A, TWIN_B].sort().join() &&
    jAmbShown.every((m) => /^kite-(one|two)$/.test(m[2].trim())),
  jAmbShown.map((m) => `${m[1]} ${m[2].trim()}`).join(' | ') || '(no indented match lines)'
);
// The point of the echo is that the operator can act on it. "Distinguishable"
// is the invariant Round 179 wrote; the strict form is that what is printed is
// literally what you paste back — so paste it back and check it resolves.
const jPasteBack = cli([DB, `--channels=${jAmbShown[0]?.[1] ?? 'nothing-was-echoed'}`]);
check(
  'J1',
  'and pasting an echoed id straight back resolves to exactly one channel',
  FILTERED.exec(jPasteBack.out)?.[1] === '1' && jPasteBack.code === 0,
  `${FILTERED.exec(jPasteBack.out)?.[0] ?? '(no candidates line)'} · exit ${jPasteBack.code}`
);

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
check(
  'L1',
  "--undo names a missing record in the tool's own voice",
  lMissing.code === 1 && /^no such undo record: /m.test(lMissing.err),
  `exit ${lMissing.code} · "${errLine(lMissing.err, /no such undo record/)}"`
);

fs.writeFileSync(path.join(DATA, 'not-a-record.json'), '{"ok":true}');
const lShape = cli([DB, '--undo=' + path.join(DATA, 'not-a-record.json')]);
// Round 180's wording is `not a backfill undo record` — one word longer than
// Round 179's predicate, which was written against a message that did not exist
// yet. Matched loosely on purpose: the assertion is the voice and the named
// problem, not the adjective order.
check(
  'L2',
  "--undo names a wrong-shaped record in the tool's own voice, not a TypeError",
  lShape.code === 1 &&
    /not a backfill( undo)? record: /.test(lShape.err) &&
    !/TypeError/.test(lShape.err),
  `exit ${lShape.code} · "${errLine(lShape.err, /not a backfill/)}"`
);
check(
  'L2',
  'and says what is wrong with it, specifically enough to fix',
  /version is undefined|expected 1|channels/.test(lShape.err),
  `"${errLine(lShape.err, /version|channels|expected/) || '(no problem line)'}"`
);
check(
  'L1/L2',
  'a failed undo writes nothing to the database',
  stillOnDefault() === appliedState,
  `${stillOnDefault()} channels still on the default, unchanged by two failed undo runs`
);
// Round 179 measured both of these refusing *after* `db.backup()` had run, so a
// full-size copy of the database was left beside it by a typo. The read and the
// parse now happen before the snapshot; the shape check discards its own.
check(
  'L1/L2',
  'and neither refusal left a snapshot beside the database',
  backupsBeside().length === backupsBeforeUndoErrors,
  `${backupsBeside().length - backupsBeforeUndoErrors} new backup file(s) after two failed undo runs`
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
