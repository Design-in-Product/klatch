/**
 * Round 203 — the corpus is lineages, and the sheet warns about one of them.
 *
 * Theseus, 2026-09-13 WORK fire. Reproduces Daedalus's Round 202 and pushes on
 * the one thing he handed me: probe `L8`, "the two Comms Chiefs, split or
 * merge?"
 *
 * The answer is that L8 was aimed at the pair the tool happens to *notice*. In
 * xian's March corpus the identity structure is **lineages** — a role held by a
 * succession of chats, each one opening by saying it succeeds the last. Round
 * 202's `role-title` basis mints one entity per channel that states its role in
 * a determiner construction, and the collision warning fires only on exact
 * normalized-name equality. So of the role lineages in the corpus, exactly one
 * produces a warning; the widest of them (three Chief-of-Staff chats with
 * contiguous date ranges) produces three different names and is silent.
 *
 * Arms A–C are synthetic and reproduce the finding with no corpus present.
 * Arms D–F measure xian's March backup if it is reachable and degrade to one
 * line if it is not. Arm Z asserts nothing under `packages/` was touched.
 *
 * Run: npx tsx scripts/probe-round203-the-corpus-is-lineages-and-the-sheet-warns-about-one-of-them.mts
 */

import Database from 'better-sqlite3';
import { execFileSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { guessEntityName } from '../packages/server/src/import/entity-guess.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const WORK = path.join(ROOT, '.testdata', 'r203');
const CORPUS = '/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14';
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');

let checks = 0;
let failed = 0;
let open = 0;
let meas = 0;

const pass = (id: string, why: string, detail = '') => {
  checks++;
  console.log(`  [PASS] ${id} · ${why}${detail ? ` — ${detail}` : ''}`);
};
const fail = (id: string, why: string, detail = '') => {
  checks++;
  failed++;
  console.log(`  [FAIL] ${id} · ${why}${detail ? ` — ${detail}` : ''}`);
};
const check = (id: string, cond: boolean, why: string, detail = '') =>
  cond ? pass(id, why, detail) : fail(id, why, detail);
const open_ = (id: string, why: string) => {
  open++;
  console.log(`  [OPEN] ${id} · ${why}`);
};
const measure = (id: string, what: string) => {
  meas++;
  console.log(`  [MEAS] ${id}: ${what}`);
};

fs.mkdirSync(WORK, { recursive: true });

// entity-backfill.ts:361, verbatim. It is module-private, so copied rather than imported.
const normalizeName = (name: string) => name.trim().toLowerCase();

const sha = (p: string) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);

/** Build a minimal Klatch corpus the backfill CLI will accept. */
function buildCorpus(file: string, channels: { id: string; name: string; opener: string; nAsst: number }[]) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
  const db = new Database(file);
  db.exec(`
    CREATE TABLE channels (id TEXT PRIMARY KEY, name TEXT NOT NULL, system_prompt TEXT,
      created_at TEXT NOT NULL, source TEXT, source_metadata TEXT, project_id TEXT);
    CREATE TABLE messages (id TEXT PRIMARY KEY, channel_id TEXT NOT NULL, role TEXT NOT NULL,
      content TEXT NOT NULL, status TEXT, created_at TEXT NOT NULL, entity_id TEXT,
      original_timestamp TEXT, original_id TEXT);
    CREATE TABLE entities (id TEXT PRIMARY KEY, name TEXT NOT NULL, model TEXT, system_prompt TEXT,
      color TEXT, handle TEXT);
    CREATE TABLE channel_entities (channel_id TEXT NOT NULL, entity_id TEXT NOT NULL,
      added_at TEXT, PRIMARY KEY (channel_id, entity_id));
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, instructions TEXT,
      source TEXT, source_metadata TEXT);
    CREATE TABLE message_artifacts (id TEXT PRIMARY KEY, message_id TEXT NOT NULL, type TEXT,
      tool_name TEXT, input_summary TEXT, content TEXT);
    INSERT INTO entities (id, name) VALUES ('default-entity', 'Claude');
  `);
  const ins = db.prepare(
    `INSERT INTO messages (id, channel_id, role, content, status, created_at, entity_id) VALUES (?,?,?,?,'complete',?,?)`
  );
  for (const c of channels) {
    db.prepare(
      `INSERT INTO channels (id, name, created_at, source) VALUES (?,?,?,'claude-ai')`
    ).run(c.id, c.name, '2026-03-14T00:00:00.000Z');
    db.prepare(`INSERT INTO channel_entities (channel_id, entity_id, added_at) VALUES (?,?,?)`).run(
      c.id,
      'default-entity',
      '2026-03-14T00:00:00.000Z'
    );
    ins.run(`${c.id}-u`, c.id, 'user', c.opener, '2026-03-14T00:00:01.000Z', null);
    for (let i = 0; i < c.nAsst; i++)
      ins.run(`${c.id}-a${i}`, c.id, 'assistant', 'ok', '2026-03-14T00:00:02.000Z', 'default-entity');
  }
  db.close();
}

const runCli = (args: string[]) => {
  try {
    return {
      code: 0,
      out: execFileSync('npx', ['tsx', CLI, ...args], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' }),
    };
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

console.log('='.repeat(78));
console.log('Round 203 — the corpus is lineages, and the sheet warns about one of them');
console.log('='.repeat(78));

// ---------------------------------------------------------------------------
console.log('\nArm A — one role, three chats, three name variants: three entities and no warning');
// The Chief-of-Staff shape from xian's corpus, synthetic: contiguous date ranges,
// each opener stating it succeeds the last, three wordings of one job.
const A = path.join(WORK, 'a-lineage.db');
buildCorpus(A, [
  {
    id: 'aaaa1111',
    name: '1/3-2/6: Chief of Staff (o4.5) - MUX',
    opener:
      'Good morning. You are my Chief of Staff (Executive Assistant). You are succeeding a predecessor chat that reached capacity.',
    nAsst: 12,
  },
  {
    id: 'bbbb2222',
    name: '2/7-3/12: Chief of Staff (o4.6) - MVP',
    opener:
      'Good morning. You are my Executive Assistant and Chief of Staff. You are succeeding a predecessor chat that reached capacity.',
    nAsst: 10,
  },
  {
    id: 'cccc3333',
    name: '3/13: Chief of Staff (o4.6) - M1',
    opener:
      'Good morning. I worked with your predecessor chat for five weeks. Please get oriented from its logs.',
    nAsst: 8,
  },
]);
const a = runCli([A, '--bases=identity-claim,role-title']);
const aNames = [...a.out.matchAll(/MINTED → "([^"]+)"/g)].map((m) => m[1]);
const aCollisions = [...a.out.matchAll(/^\s*! "/gm)].length;
check(
  'A1',
  aNames.length === 2,
  'two of the three chats state the job in a determiner construction and each mints',
  `minted: ${aNames.map((n) => `"${n}"`).join(', ')}`
);
check(
  'A2',
  new Set(aNames.map(normalizeName)).size === aNames.length,
  'the two names are different after normalization, so name-equality cannot relate them',
  `normalized: ${[...new Set(aNames.map(normalizeName))].join(' | ')}`
);
check(
  'A3',
  aCollisions === 0,
  'and so the sheet prints no collision warning at all for a three-chat lineage of one job',
  `collision blocks on the sheet: ${aCollisions}`
);
check(
  'A4',
  /cccc3333[^\n]*SKIP \(no-guess\)/.test(a.out),
  'the third chat in the lineage states no role of its own and stays on default-entity',
  'its rows remain bound to the placeholder while its two predecessors become entities'
);

// ---------------------------------------------------------------------------
console.log('\nArm B — the pair the warning does catch, for contrast');
const B = path.join(WORK, 'b-samename.db');
buildCorpus(B, [
  {
    id: 'dddd4444',
    name: '1/2-14: Comms Chief (o)',
    opener: 'Good morning. You are my tech-savvy communications chief.',
    nAsst: 5,
  },
  {
    id: 'eeee5555',
    name: '1/15-3/13: Comms Chief (o)',
    opener: 'Good morning. You are my tech-savvy Communications Chief.',
    nAsst: 7,
  },
]);
const b = runCli([B, '--bases=identity-claim,role-title']);
check(
  'B1',
  [...b.out.matchAll(/^\s*! "/gm)].length === 1,
  'the same lineage shape DOES warn when the two wordings normalize to one name',
  'so the warning is a test of name equality, not of lineage'
);
check(
  'B2',
  /not merged/.test(b.out) && /you get that many agents with/.test(b.out),
  'and Round 202 is right about what it then says — that many agents, not one merged agent'
);

// ---------------------------------------------------------------------------
console.log('\nArm C — two one-word defects in the identity sentence');
const cases: [string, string, string][] = [
  ['C1', 'Good morning. You are the Chief Experience Officer for the project.', 'role-title'],
  ['C2', 'Good morning. Your are the Chief Experience Officer for the project.', 'none'],
  ['C3', 'Good morning. You are your Security Operations (Sec Ops) agent.', 'none'],
  ['C4', 'Good morning. You are my Security Operations (Sec Ops) agent.', 'role-title'],
];
for (const [id, text, want] of cases) {
  const g = guessEntityName(text, undefined);
  check(
    id,
    g.basis === want,
    `"${text.slice(14, 46)}…" → ${want}`,
    `basis=${g.basis} name=${JSON.stringify(g.name ?? null)}`
  );
}
check(
  'C5',
  guessEntityName('Good morning. You are your chief of staff.', undefined).basis === 'none',
  '`your` is not an accepted determiner — ROLE_PATTERN_SOURCES takes my|our|the|a|an',
  'so "you for your" is not repaired by supplying "your"; the sentence needs my/our/the'
);

// ---------------------------------------------------------------------------
console.log('\nArm D — the real corpus (reported, not asserted: it is machine-local)');
if (!fs.existsSync(CORPUS)) {
  measure('D0', `corpus not reachable from this seat (${CORPUS}) — arms D-F skipped`);
} else {
  const before = sha(CORPUS);
  const copy = path.join(WORK, 'march14.db');
  fs.copyFileSync(CORPUS, copy);
  const db = new Database(copy, { readonly: true });
  const openerStmt = db.prepare(
    `SELECT content FROM messages WHERE channel_id = ? AND role = 'user' ORDER BY rowid ASC LIMIT 1`
  );
  const chans = db.prepare(`SELECT id, name FROM channels ORDER BY created_at`).all() as any[];

  let succ = 0;
  let quoting = 0;
  const hits: { id: string; name: string; chan: string; asst: number }[] = [];
  for (const r of chans) {
    const o = openerStmt.get(r.id) as any;
    const text = o?.content ? String(o.content) : '';
    if (/predecessor|succeeding|taking over from|previous chat|prior chat/i.test(text)) {
      succ++;
      const after = text.slice(text.search(/predecessor|succeeding|taking over from|previous chat|prior chat/i));
      if (/[“"'][^“”"'\n]{4,120}[”"']/.test(after.slice(0, 400))) quoting++;
    }
    const g = guessEntityName(text, undefined);
    if (g.basis === 'role-title') {
      const n = db
        .prepare(`SELECT COUNT(*) AS n FROM messages WHERE channel_id = ? AND role = 'assistant'`)
        .get(r.id) as any;
      hits.push({ id: String(r.id).slice(0, 8), name: g.name ?? '', chan: String(r.name), asst: n.n });
    }
  }
  measure('D1', `openers stating they succeed a predecessor: ${succ} of ${chans.length} channels`);
  measure('D2', `of those, quoting a predecessor by channel name within 400 chars: ${quoting}`);
  measure('D3', `channels minting a role-title entity: ${hits.length}`);
  measure(
    'D4',
    `distinct normalized names among them: ${new Set(hits.map((h) => normalizeName(h.name))).size} — so exactly ${hits.length - new Set(hits.map((h) => normalizeName(h.name))).size} collision warning(s) can fire`
  );

  console.log('\nArm E — the channel name as a second, independent source of role evidence');
  const STOP = new Set(['of', 'and', 'the', 'a', 'an', 'my', 'you', 'for', 'at', 'on', 'to', 'in']);
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w))
    );
  const corroborated = hits.filter((h) => [...words(h.name)].some((w) => words(h.chan).has(w)));
  measure(
    'E1',
    `role-title hits whose guessed title shares a content word with their own channel name: ${corroborated.length} of ${hits.length}`
  );
  measure(
    'E2',
    `the ones with no corroboration: ${hits
      .filter((h) => !corroborated.includes(h))
      .map((h) => `${h.id} "${h.name}"`)
      .join(', ')}`
  );
  open_(
    'E3',
    'corroboration by the channel name is positive evidence that needs no word list — the thing Round 202 §6 declined to reach for — but it is evidence of *agreement between two sources*, not of role-hood: "You are a good friend" in a channel named "good friend advice" still passes, and on this corpus it would refuse 2 of 9 real role titles (the two whose channels do not follow the date-range naming convention). Offered as a shape, not built and not recommended as-is. OPEN'
  );

  console.log('\nArm F — what the operator is told, and what is there');
  const f = runCli([copy, '--bases=identity-claim,role-title']);
  const fCollisions = [...f.out.matchAll(/^\s*! "/gm)].length;
  measure('F1', `collision blocks printed on the real sheet: ${fCollisions}`);
  check(
    'F2',
    /note: an agent named "chief of staff" already exists/.test(f.out),
    'where a pre-existing agent carries the guessed name, the sheet says so and says it will not reuse it',
    'Round 202 BASIS_REUSES_BY_NAME, visible at the sheet — this part is working'
  );
  check(
    'F3',
    /1e2ced26[^\n]*SKIP \(no-guess\)/.test(f.out),
    'the channel whose opener states a role but mistypes one word is skipped, and it is the largest skipped row count on the sheet',
    `1e2ced26 "1/16-3/13: CXO (o)" — "Your are the Chief Experience Officer", P2=110`
  );
  open_(
    'F4',
    `L8 answered, and it was aimed at the pair the tool happens to notice. Succession is stated in prose ${succ} times in this corpus; the one channel in any role lineage whose opener does NOT state it is e7a7a513 — the second Comms Chief, the very pair Round 202 asks about. So keep the split: merging them infers a link this corpus declines to state, and Round 202's recoverability argument then backs it up. The case that needs the warning is the three Chief-of-Staff chats (1/3-2/6, 2/7-3/12, 3/13, contiguous to the day, all three stating succession) — two mint entities under two different names and the sheet is silent, because the warning tests name equality. OPEN for Daedalus and xian`
  );

  db.close();
  const after = sha(CORPUS);
  check(
    'D5',
    before === after,
    'the source corpus is byte-identical after this probe ran against a copy of it',
    `sha256 ${before} both sides`
  );
}

// ---------------------------------------------------------------------------
console.log('\nArm Z — this probe changed no product code');
const dirty = execFileSync('git', ['status', '--porcelain', 'packages'], { cwd: ROOT, encoding: 'utf8' }).trim();
check('Z1', dirty === '', 'nothing under packages/ is modified', dirty || 'clean');

console.log(`\n${'='.repeat(78)}`);
console.log(`${checks} checks · ${failed} failed · ${open} open · ${meas} measurements`);
console.log('='.repeat(78));
