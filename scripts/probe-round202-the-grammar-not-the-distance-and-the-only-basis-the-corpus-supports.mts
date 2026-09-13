/**
 * Round 202 — the claim's grammar, not its distance; and the only basis this
 * corpus supports.
 *
 * Built on Theseus's Round 201, all four of his ranked shapes:
 *
 *   1. **Subordinate-clause guard** (his §3). Every false claim in xian's March
 *      corpus sits in a subordinate clause and no real one does — 7/7 and 14/14.
 *      The window bounds *distance*, not falseness, and excludes nothing at all
 *      from an opener shorter than 400 characters; this rule survives the early
 *      rewrite that defeats it. Arms B and C.
 *   2. **The `role-title` basis** (his §4, my shape 4). Of the 14 in-window
 *      claims in the corpus, zero propose a name — `identity-claim` has a recall
 *      ceiling of 0 out of 0 there. Arms D, E and L.
 *   3. **Positive evidence rather than a longer denylist** (his §2) — taken as a
 *      direction, and the determiner is the positive evidence. Arm E.
 *   4. **`you['’]?re`** (his §6). One character. Arm F.
 *
 * And one defect of my own, found while reading the apply path to check a claim
 * I was about to make about it: the plan's per-basis reuse decision was
 * **advisory**. `applyEntityBackfill` re-derived the binding from the name alone,
 * so a row the sheet printed as `MINTED` with a "does not reuse the existing
 * agent" note bound to exactly that agent. Arm G.
 *
 * Expected failures elsewhere, so tomorrow's sweep can diff mechanically rather
 * than investigate:
 *   - `probe-round200` (mine): **22 · 4 failed** — G×2, H2, K2, all asserting a
 *     role claim yields `none`. Round 202 gives those openers a basis. Left
 *     unrewritten; it is Round 200's record.
 *   - `probe-round201` (his): **26 · 3 failed** — D1, E2, E3. D1 and E2 assert
 *     the residual he measured is still open; E3 asserts the apostrophe bug is
 *     still present. Those three failures are the three fixes.
 *
 * Usage: npx tsx scripts/probe-round202-...mts [path/to/corpus.db]
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import {
  guessEntityName,
  GUESS_BASES,
  BASIS_REUSES_BY_NAME,
  IDENTITY_WINDOW_CHARS,
} from '../packages/server/src/import/entity-guess.js';

// ── harness ──────────────────────────────────────────────────────────────────
let checks = 0;
let failed = 0;
let open = 0;
function check(arm: string, name: string, ok: boolean, detail: string): void {
  checks++;
  if (!ok) failed++;
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${arm} · ${name} — ${detail}`);
}
function open_(arm: string, name: string, detail: string): void {
  open++;
  console.log(`  [OPEN] ${arm} · ${name} — ${detail}`);
}
function meas(arm: string, detail: string): void {
  console.log(`  [MEAS] ${arm}: ${detail}`);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, '.testdata', 'r202-probe');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const CORPUS =
  process.argv[2] ?? '/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14';

console.log('='.repeat(78));
console.log("Round 202 — the claim's grammar, not its distance; and the only basis this");
console.log('           corpus supports');
console.log('='.repeat(78));

// ── Arm B — the five words the window only caught by distance ────────────────
/**
 * Theseus's arm D measured these at offsets 511–1,706 in the corpus, where the
 * window excludes them, and showed that writing the same sentence early mints
 * 5 of 5. Here they are early. This is his D1 and E2 inverted.
 */
console.log('\nArm B — the false claims the window only caught by distance, written early');
const EARLY_FALSE = [
  'Anyhow, once you are up to speed we can start.',
  'A few items still open as far as you are aware.',
  "Shipped 0.8.3. Once you're oriented, take a look.",
  'I made a template. Once you are settled in, use it.',
  'Please review all these and when you are ready, reply.',
];
const earlyMinted = EARLY_FALSE.filter((o) => guessEntityName(o).basis !== 'none');
check(
  'B1',
  'none of them mints, at offsets the window does not reach',
  earlyMinted.length === 0,
  `${EARLY_FALSE.length - earlyMinted.length} of ${EARLY_FALSE.length} decline` +
    (earlyMinted.length ? ` — still minting: ${earlyMinted.map((o) => guessEntityName(o).name).join(', ')}` : '')
);
const offsets = EARLY_FALSE.map((o) => o.search(/\byou\b/i));
meas(
  'B2',
  `their claim offsets here are ${offsets.join(', ')} — all inside the ${IDENTITY_WINDOW_CHARS}-char window, ` +
    `so the window is not what refuses them`
);
check(
  'B3',
  'and the same through the second pattern, so it is not one pattern guarded',
  guessEntityName("Ping me once you're Sterling on this.").basis === 'none',
  `"once you're Sterling" → ${JSON.stringify(guessEntityName("Ping me once you're Sterling on this.").name)}`
);

// ── Arm C — the guard is anchored, and the cost is stated ────────────────────
console.log('\nArm C — anchored to the claim, so it refuses conditions and not assignments');
const earlierClause = guessEntityName('Once we are done with setup, you are Daedalus.');
check(
  'C1',
  "a subordinator governing an earlier clause does not refuse this round's claim",
  earlierClause.name === 'Daedalus' && earlierClause.basis === 'identity-claim',
  `"Once we are done with setup, you are Daedalus." → ${earlierClause.basis} ${JSON.stringify(earlierClause.name)}`
);
const nowThat = guessEntityName('Now that you are Daedalus, read the coordination doc.');
check(
  'C2',
  '"now that" is deliberately not in the set — it asserts a present state',
  nowThat.name === 'Daedalus',
  `"Now that you are Daedalus…" → ${nowThat.basis} ${JSON.stringify(nowThat.name)} — the cost Theseus named, not paid`
);
const conditional = ['once', 'when', 'whenever', 'if', 'unless', 'until', 'while', 'after'].filter(
  (w) => guessEntityName(`Ping me ${w} you are Sterling on this.`).basis !== 'none'
);
check(
  'C3',
  'the four words that do all of it in the corpus, plus their siblings',
  conditional.length === 0,
  conditional.length ? `not covered: ${conditional.join(', ')}` : 'all 8 refuse a real-looking name'
);
check(
  'C4',
  'a genuine claim at the furthest real offset in the corpus is untouched',
  guessEntityName(`${'x'.repeat(150)} You are Daedalus, resume the cycle.`).name === 'Daedalus',
  'offset ~151; the furthest real claim measured in the corpus is 158'
);

// ── Arm D — the basis the corpus supports ───────────────────────────────────
console.log('\nArm D — role claims, verbatim from the corpus (Round 201 §4)');
const CORPUS_ROLES: [string, string, string][] = [
  ['ef2a2e35', 'You are my career coach today. Help me apply for this job!', 'career coach'],
  [
    '74bb02d3',
    'You are my Chief Innovation Office (CIO) taking over from your predecessor chat that just reached capacity.',
    'Chief Innovation Office (CIO)',
  ],
  [
    '358c1952',
    'Hello! You are my tech-savvy communications chief here on the Piper Morgan project.',
    'tech-savvy communications chief',
  ],
  [
    'e07e9d56',
    'It is Friday, January 16 at 8:37 PM, and you are the Head of Sapient Resources (HoSR) for the Piper Morgan project.',
    'Head of Sapient Resources (HoSR)',
  ],
  [
    '8ef10002',
    'Good morning! You are my Executive Assistant and Chief of Staff.',
    'Executive Assistant and Chief of Staff',
  ],
  ['adaf6406', 'Hi there. You are my chief of staff.', 'chief of staff'],
  [
    '0111a366',
    'You are my chief architect and you help me maintain our architectural principals and domain driven design.',
    'chief architect',
  ],
  [
    'cff40904',
    'Good morning. You are my Chief of Staff (Executive Assistant) for the Piper Morgan project.',
    'Chief of Staff (Executive Assistant)',
  ],
];
const wrong = CORPUS_ROLES.filter(([, opener, title]) => {
  const g = guessEntityName(opener);
  return g.basis !== 'role-title' || g.name !== title;
});
check(
  'D1',
  'each states its job and the guess is that job, not a word from it',
  wrong.length === 0,
  wrong.length
    ? `wrong: ${wrong.map(([id, o]) => `${id}→${JSON.stringify(guessEntityName(o).name)}`).join(', ')}`
    : `${CORPUS_ROLES.length} of ${CORPUS_ROLES.length} exact, incl. "of" kept inside the title and "(HoSR)" kept`
);
check(
  'D2',
  'the rationale quotes the claim and says which way it binds',
  (() => {
    const r = guessEntityName('You are my chief of staff.').rationale;
    return r.includes('"You are my chief of staff"') && r.includes('a role, not a name');
  })(),
  guessEntityName('You are my chief of staff.').rationale.slice(0, 96) + '…'
);
check(
  'D3',
  'a name still wins — identity-claim is tried first and role-title cannot shadow it',
  guessEntityName('You are Daedalus, my chief architect on this project.').basis ===
    'identity-claim',
  `"You are Daedalus, my chief architect" → ${guessEntityName('You are Daedalus, my chief architect on this project.').basis}`
);
const UNRECOVERED = [
  ['e93d3810', 'You are you Security Operations (Sec Ops) agent and I need to'],
  [
    'a64c9d45',
    'You are taking on a new role on this project, exploratory testing agent or ETA for short.',
  ],
];
meas(
  'D4',
  `2 role-bearing channels are still not recovered — ${UNRECOVERED.map(([id]) => id).join(', ')}: ` +
    `one says "you" for "your" so there is no determiner, the other states the role through a ` +
    `different construction. Recall is 9 of 11 role-bearing channels, not 11 of 11`
);

// ── Arm E — the determiner is the positive evidence (Round 201 §2) ──────────
console.log('\nArm E — what makes the role basis narrow is positive evidence, not a longer list');
const ARM_C_FALSE = [
  'You are welcome here.',
  'You are back!',
  'You are ready to go.',
  'You are new to this.',
  'You are still on the hook.',
  'You are only halfway.',
];
const leaked = ARM_C_FALSE.filter((o) => guessEntityName(o).basis === 'role-title');
check(
  'E1',
  "Round 201 arm C's openers cannot reach this basis — none carries a determiner",
  leaked.length === 0,
  `${ARM_C_FALSE.length - leaked.length} of ${ARM_C_FALSE.length} never reach role-title`
);
const NOT_JOBS = ['You are a genius.', 'You are the best.', 'You are my favourite.'];
const minted = NOT_JOBS.filter((o) => guessEntityName(o).basis !== 'none');
check(
  'E2',
  'a determiner phrase of one word is refused — "a genius" is not a job',
  minted.length === 0,
  minted.length ? `minted: ${minted.map((o) => guessEntityName(o).name).join(', ')}` : '3 of 3 decline'
);
open_(
  'E3',
  'the residual Round 201 §2 named is narrowed, not closed',
  'the determiner plus the two-word minimum refuses every arm-C opener and every one-word phrase, ' +
    'but there is still no positive evidence of *role*-hood — only of noun-phrase-hood. ' +
    `"You are a good friend" yields ${JSON.stringify(guessEntityName('You are a good friend.').name)}. ` +
    'This is why role-title is NOT in DEFAULT_APPLY_BASES: an operator has to ask for it by name, ' +
    'and the dry run shows the quoted claim per row. OPEN until either a positive test for a job ' +
    'title exists or xian rules that the dry-run gate is sufficient'
);

// ── Arm F — the apostrophe (Round 201 §6) ───────────────────────────────────
console.log('\nArm F — one character');
check(
  'F1',
  'a typographic apostrophe no longer loses the claim',
  guessEntityName('You’re Daedalus, the architecture agent.').name === 'Daedalus',
  `"You’re Daedalus" → ${JSON.stringify(guessEntityName('You’re Daedalus, the architecture agent.').name)}`
);
check(
  'F2',
  'and the ASCII form still reads — the pattern widened, it did not move',
  guessEntityName("You're Daedalus, the architecture agent.").name === 'Daedalus',
  `"You're Daedalus" → ${JSON.stringify(guessEntityName("You're Daedalus, the architecture agent.").name)}`
);
check(
  'F3',
  'through the role basis too',
  guessEntityName('You’re my chief of staff.').name === 'chief of staff',
  `"You’re my chief of staff" → ${guessEntityName('You’re my chief of staff.').basis}`
);

// ── Arm G — the sheet and the write must agree (my defect) ──────────────────
console.log('\nArm G — the basis reaches the binding decision, in the plan AND in the apply');
check(
  'G1',
  'every basis has a recorded answer, so a new one cannot skip the question',
  GUESS_BASES.every((b) => Object.prototype.hasOwnProperty.call(BASIS_REUSES_BY_NAME, b)),
  `BASIS_REUSES_BY_NAME = ${JSON.stringify(BASIS_REUSES_BY_NAME)}`
);

fs.mkdirSync(DATA, { recursive: true });

/**
 * Build a two-channel role-collision corpus from scratch.
 *
 * A function, and called twice, because arm G runs `--apply` against its copy —
 * which re-points both channels off `default-entity` and so empties the scope.
 * The first version of this probe shared one file between arms G and H and arm H
 * failed reading `Candidates: 0`: the probe's own fixture, not the claim. Same
 * lesson as Theseus's Round 201 §8 and Round 199's hand-written regex.
 */
function seedRoleCollisionDb(file: string): void {
  for (const f of [file, `${file}-wal`, `${file}-shm`]) fs.rmSync(f, { force: true });
  const db = new Database(file);
  db.exec(`
    CREATE TABLE channels (id TEXT PRIMARY KEY, name TEXT, type TEXT, system_prompt TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, source TEXT, source_metadata TEXT, project_id TEXT);
    CREATE TABLE messages (id TEXT PRIMARY KEY, channel_id TEXT, role TEXT, content TEXT,
      status TEXT DEFAULT 'complete', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      original_timestamp TEXT, original_id TEXT, entity_id TEXT);
    CREATE TABLE entities (id TEXT PRIMARY KEY, name TEXT, model TEXT, system_prompt TEXT,
      color TEXT, handle TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE channel_entities (channel_id TEXT, entity_id TEXT,
      added_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (channel_id, entity_id));
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT, instructions TEXT, memory TEXT,
      source TEXT, source_metadata TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO entities (id, name, model) VALUES ('default-entity', 'Claude', 'claude-opus-5');
  `);
  const ch = db.prepare(
    "INSERT INTO channels (id, name, type, source) VALUES (?, ?, 'chat', 'claude-ai')"
  );
  const bind = db.prepare(
    "INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, 'default-entity')"
  );
  const msg = db.prepare(
    'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const seed = (id: string, title: string, opener: string, replies: number) => {
    ch.run(id, title);
    bind.run(id);
    msg.run(`${id}-u`, id, 'user', opener, null, '2026-01-01T00:00:00.000Z');
    for (let i = 0; i < replies; i++) {
      msg.run(`${id}-a${i}`, id, 'assistant', 'ok', 'default-entity', `2026-01-01T00:0${i}:10.000Z`);
    }
  };
  seed(
    'cc-early',
    '1/2-14: Comms Chief (o)',
    'Hello! You are my tech-savvy communications chief here on the Piper Morgan project.',
    3
  );
  seed(
    'cc-late',
    '1/15-3/13: Comms Chief (o) - content strategy',
    'Hi! You are my tech-savvy Communications Chief here on the Piper Morgan project.',
    5
  );
  db.close();
}

const synth = path.join(DATA, 'role-collision.db');
seedRoleCollisionDb(synth);
const dry = spawnSync('npx', ['tsx', CLI, synth, '--bases=role-title'], {
  cwd: ROOT,
  encoding: 'utf8',
});
const dryOut = `${dry.stdout ?? ''}${dry.stderr ?? ''}`;
check(
  'G2',
  'the sheet tells the operator they get two agents with one name, not one merged agent',
  dryOut.includes('is the name 2 separate agents would carry') &&
    dryOut.includes('these do not merge'),
  `exit ${dry.status}; collision line: ${(dryOut.match(/! ".*/) ?? ['(absent)'])[0].slice(0, 88)}`
);
const apply = spawnSync('npx', ['tsx', CLI, synth, '--bases=role-title', '--apply'], {
  cwd: ROOT,
  encoding: 'utf8',
});
{
  const db = new Database(synth, { readonly: true });
  const bound = db
    .prepare(
      `SELECT ce.channel_id, e.id, e.name FROM channel_entities ce JOIN entities e ON e.id = ce.entity_id
       WHERE ce.channel_id IN ('cc-early','cc-late')`
    )
    .all() as { channel_id: string; id: string; name: string }[];
  const early = bound.find((b) => b.channel_id === 'cc-early');
  const late = bound.find((b) => b.channel_id === 'cc-late');
  check(
    'G3',
    'and the write agrees with the sheet — two entities, neither of them the placeholder',
    !!early &&
      !!late &&
      early.id !== late.id &&
      early.id !== 'default-entity' &&
      late.id !== 'default-entity',
    `exit ${apply.status}; cc-early → ${early?.id.slice(0, 8)} "${early?.name}", cc-late → ${late?.id.slice(0, 8)} "${late?.name}"`
  );
  const placeholderRows = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM messages WHERE role = 'assistant' AND entity_id = 'default-entity'`
      )
      .get() as { n: number }
  ).n;
  check(
    'G4',
    'every assistant row moved off the placeholder',
    placeholderRows === 0,
    `${placeholderRows} assistant rows still stamped default-entity`
  );
  db.close();
}

// ── Arm H — a correct zero must not read like an empty corpus ───────────────
console.log('\nArm H — the zero explains itself');
// A fresh copy: arm G applied to its own, which empties the scope.
const untouched = path.join(DATA, 'role-collision-untouched.db');
seedRoleCollisionDb(untouched);
const narrow = spawnSync('npx', ['tsx', CLI, untouched], { cwd: ROOT, encoding: 'utf8' });
const narrowOut = `${narrow.stdout ?? ''}${narrow.stderr ?? ''}`;
check(
  'H1',
  'a default run over a role-only corpus names the basis it is not applying, and the flag',
  /excluded by basis: \d+ role-title/.test(narrowOut) &&
    narrowOut.includes('--bases=identity-claim,role-title'),
  (narrowOut.match(/excluded by basis:.*/) ?? ['(absent)'])[0].slice(0, 110)
);
meas(
  'H2',
  'role-title is deliberately NOT in DEFAULT_APPLY_BASES — the default apply path is not widened ' +
    'by this round, and the residual in arm E3 sits behind an explicit --bases the operator types'
);

// ── Arm L — the real corpus (reported, not asserted: machine-local) ─────────
console.log('\nArm L — the real corpus (reported, not asserted: it is machine-local)');
if (!fs.existsSync(CORPUS)) {
  meas('L0', `corpus not present at ${CORPUS} — arm L degrades to this line`);
} else {
  const before = crypto.createHash('sha256').update(fs.readFileSync(CORPUS)).digest('hex');
  const copy = path.join(DATA, 'corpus.db');
  fs.copyFileSync(CORPUS, copy);
  const run = (args: string[]) =>
    `${spawnSync('npx', ['tsx', CLI, copy, ...args], { cwd: ROOT, encoding: 'utf8' }).stdout ?? ''}`;
  const def = run([]);
  meas('L1', `default bases: ${(def.match(/Candidates:.*/) ?? [''])[0]}`);
  meas('L2', `and it says why: ${(def.match(/excluded by basis:.*/) ?? ['(absent)'])[0]}`);
  const wide = run(['--bases=identity-claim,role-title']);
  meas('L3', `with role-title: ${(wide.match(/Candidates:.*/) ?? [''])[0]}`);
  meas('L4', `  ${(wide.match(/message rows re-stamped:.*/) ?? [''])[0]}`);
  const names = (wide.match(/new agents \(\d+\):.*/) ?? [''])[0];
  meas('L5', `  ${names}`);
  meas('L6', `  collision: ${(wide.match(/! ".*/) ?? ['(none)'])[0]}`);
  const after = crypto.createHash('sha256').update(fs.readFileSync(CORPUS)).digest('hex');
  check(
    'L7',
    'the source corpus is byte-identical after this probe ran against a copy of it',
    before === after,
    `sha256 ${before.slice(0, 16)} both sides; mtime ${fs.statSync(CORPUS).mtime.toISOString()}`
  );
  open_(
    'L8',
    'the two Comms Chief channels: split or merge is not mine to settle',
    'both openers place them on the same named project in successive date ranges (1/2-14, then ' +
      '1/15-3/13), so they are plausibly one agent continuing — and this round splits them into two ' +
      'same-named entities. The default is the recoverable direction (a wrong merge re-stamps 182 ' +
      'rows onto an identity that was never there; a wrong split is a human merge with full ' +
      'information), and the sheet names both channels. A project-scoped rule would get both cases ' +
      'right and is unimplementable here: all 139 channels have project_id NULL and the projects ' +
      'table is empty. OPEN for xian or Theseus'
  );
  open_(
    'L9',
    "xian's current-corpus question, still unanswered and still blocking the fit",
    'every number in this round and the last three is fitted to a backup dated 2026-03-14 whose ' +
      'mtime is 2026-07-23. Whether it is the current corpus is xian\'s call; it blocks the fit, ' +
      'not the build (carried from Round 200, Theseus\'s §7.2)'
  );
}

console.log(`\n${'='.repeat(78)}`);
console.log(`${checks} checks · ${failed} failed · ${open} open`);
console.log('='.repeat(78));
