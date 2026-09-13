/**
 * Round 199 — the backfill's first run against a real corpus.
 *
 * Round 198 finished hardening the *refusal* paths: what the tool says when the
 * database is damaged, is a sidecar, is empty, is unreadable. Every round from
 * 191 on has been instrument-hardening against fixtures we built. This round is
 * the first time the tool has been pointed at xian's actual imported
 * conversations, and the headline is not in the refusal paths at all.
 *
 * `/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14` — 139
 * channels, 2,652 messages, 68 entities, `claude-ai` and `claude-code` sources.
 * The approved dry run against a copy of it:
 *
 *     Candidates: 72 — 7 would move, 65 skipped.
 *     new agents (4): Succeeding, Oriented, Taking, You
 *
 * **Seven channels would move and not one of the four names is a name.** They
 * are verb fragments and a pronoun, scraped out of continuation sentences by
 * `IDENTITY_PATTERNS` in `packages/server/src/import/entity-guess.ts`. Precision
 * on the strongest basis, on real data, is 0/7.
 *
 * That corpus is machine-local and holds xian's own conversations, so this probe
 * does not depend on it. Arms G–K reproduce each defect shape on synthetic
 * openers written to match the real ones; arm L reports the real corpus numbers
 * as measurements *if* the file is present, and says so plainly if it is not.
 *
 * Zero model calls. Reads only; the real corpus is opened read-only and copied
 * before anything is pointed at it.
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { guessEntityName } from '../packages/server/src/import/entity-guess.js';

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

/**
 * The real openers, reduced to the clause that drives the guess. Kept short on
 * purpose: the defect lives in one clause, and the rest of each message is
 * xian's business content with no bearing on what the regex does.
 */
const REAL_SHAPES = [
  {
    label: 'succeeding-predecessors',
    role: 'Chief Experience Officer',
    opener:
      'Good afternoon. It is Friday Jan 16 at 5:56 PM. Your are the Chief Experience Officer ' +
      'for a project for which I am the lead and CEO. You are succeeding these predecessor chats:',
    expectVerb: 'Succeeding',
  },
  {
    label: 'taking-over-from',
    role: 'Chief Innovation Officer',
    opener:
      "Good evening, Chief Innovation Officer (CIO)! It's Fri Feb 20 at 6:02 PM. You are taking " +
      'over from your predecessor chat that ran into file-creation errors after a model update.',
    expectVerb: 'Taking',
  },
  {
    label: 'taking-on-a-role',
    role: 'exploratory testing agent',
    opener:
      'Good afternoon. It is Thu Mar 12 at 1:34. You are taking on a new role on this project, ' +
      'exploratory testing agent or ETA for short. Your role slug is `test`.',
    expectVerb: 'Taking',
  },
  {
    label: 'you-are-you-typo',
    role: 'Security Operations',
    opener:
      "Good morning. It's 5:38 AM on Sat Jan 17. You are you Security Operations (Sec Ops) agent " +
      'and I need to to help me investigation an issue.',
    expectVerb: 'You',
  },
];

console.log('='.repeat(78));
console.log('Round 199 — the first real corpus names seven agents, and none of them is a name');
console.log('='.repeat(78));

// ── Arm G — continuation verbs are read as names ─────────────────────────────
console.log('\nArm G — "you are <verb>ing" is the commonest agent opener there is');
{
  for (const s of REAL_SHAPES.filter((x) => x.expectVerb !== 'You')) {
    const g = guessEntityName(s.opener);
    check(
      `G:${s.label}`,
      'the continuation clause is read as an identity claim, at the strongest confidence the tool has',
      g.basis === 'identity-claim' && g.name === s.expectVerb,
      `guess "${g.name}" (basis ${g.basis}) — the session is the ${s.role}, and "${s.expectVerb}" is a verb`
    );
  }
  // The stopword list is the only thing standing between the pattern and this,
  // and it has no continuation verbs in it — only articles, pronouns and the
  // four state verbs someone thought of ("working", "going", "being", "asked").
  const verbs = ['succeeding', 'taking', 'continuing', 'resuming', 'replacing', 'picking'];
  const caught = verbs.filter(
    (v) => guessEntityName(`You are ${v} over from the previous session.`).basis !== 'identity-claim'
  );
  check(
    'G:stopwords',
    'no continuation verb is filtered — the class the list most needs is the class it lacks',
    caught.length === 0,
    `of ${verbs.length} continuation verbs, ${caught.length} are filtered (${caught.join(', ') || 'none'}) — ` +
      `each of the other ${verbs.length - caught.length} becomes a proposed agent name`
  );
}

// ── Arm H — the fall-through reaches past the opening, and the rationale lies ─
console.log('\nArm H — a rejected first match hands the guess to a clause far downstream');
{
  // The real one: "Hello! You are my tech-savvy communications chief ..." —
  // pattern 1 matches "my", which IS a stopword, so it is rejected. The loop
  // then tries the *next pattern* against the whole message, and "Once you're
  // oriented" hundreds of characters later wins.
  const opener =
    'Hello! You are my tech-savvy communications chief here on this project! (I lead the ' +
    'project and am head of product.) It is Friday, January 2 at 12:36 PM. Please start a ' +
    'session log. Here is the ongoing process for determining which ones to publish when and ' +
    "where. Once you're oriented, please review this batch of drafts.";
  const g = guessEntityName(opener);
  const offset = opener.toLowerCase().indexOf("you're oriented");
  check(
    'H1',
    'the stopword is correctly rejected, and the guess then comes from a clause far past the opening',
    g.name === 'Oriented' && g.basis === 'identity-claim',
    `guess "${g.name}" (basis ${g.basis}) — matched at character ${offset} of ${opener.length}, ` +
      `not in the opening at all`
  );
  check(
    'H2',
    "the rationale states as fact something the probe can show is false — it is the operator's only evidence",
    g.rationale.includes('opens by naming itself') && offset > 200,
    `rationale: "${g.rationale}" · the phrase it is about begins at character ${offset}`
  );
  meas(
    'H',
    `the loop in guessEntityName (entity-guess.ts:100-116) iterates patterns, not occurrences: a ` +
      `first-pattern match rejected by looksLikeName() does not advance to the next match of that ` +
      `pattern, it advances to the next pattern against the whole string. So rejecting a stopword ` +
      `widens the search rather than narrowing it.`
  );
}

// ── Arm I — two different agents collapse into one entity ────────────────────
console.log('\nArm I — the names are not merely wrong, they collide');
{
  const guesses = REAL_SHAPES.map((s) => ({ ...s, name: guessEntityName(s.opener).name }));
  const byName = new Map<string, string[]>();
  for (const g of guesses) byName.set(g.name, [...(byName.get(g.name) ?? []), g.role]);
  const collisions = [...byName.entries()].filter(([, roles]) => roles.length > 1);
  check(
    'I1',
    'distinct roles are proposed the same name, so an apply binds them to one entity',
    collisions.length > 0,
    collisions
      .map(([n, roles]) => `"${n}" ← ${roles.join(' + ')}`)
      .join(' · ') || 'no collision',
  );
  check(
    'I2',
    'the collision is not a naming nuisance — it is the wrong answer to the question the product exists to ask',
    byName.size < guesses.length,
    `${guesses.length} sessions → ${byName.size} entities · on the real corpus: 7 channels → 4 agents, ` +
      `with "Taking" covering both a Chief Innovation Officer and an exploratory testing agent ` +
      `(43 messages), and "Oriented" both a Comms Chief and a Chief of Staff (156 messages)`
  );
}

// ── Arm J — the pronoun, and the stopword list's own gap ─────────────────────
console.log('\nArm J — "You are you Security Operations agent"');
{
  const s = REAL_SHAPES.find((x) => x.expectVerb === 'You')!;
  const g = guessEntityName(s.opener);
  check(
    'J1',
    'a typo for "your" proposes the pronoun itself as an agent name',
    g.name === 'You' && g.basis === 'identity-claim',
    `guess "${g.name}" (basis ${g.basis}) — the session is the ${s.role}`
  );
  // `your`, `i`, `it`, `we`, `they`, `he`, `she` are all in NOT_NAMES. `you` is
  // not. This is a one-word fix and the cheapest thing in the round.
  const pronouns = ['your', 'i', 'it', 'we', 'they', 'he', 'she', 'you'];
  const unfiltered = pronouns.filter(
    (p) => guessEntityName(`You are ${p} the operations agent.`).basis === 'identity-claim'
  );
  check(
    'J2',
    'every neighbouring pronoun is filtered and this one is not — a one-word gap in the list',
    unfiltered.length === 1 && unfiltered[0] === 'you',
    `unfiltered pronouns: ${unfiltered.join(', ') || 'none'} of ${pronouns.length}`
  );
}

// ── Arm K — controls: the cases the patterns were written for still work ─────
console.log('\nArm K — controls: nothing above fires on an opener that really does name itself');
{
  const good = guessEntityName('You are Daedalus, the architecture agent on this project.');
  check(
    'K1',
    'a genuine identity line still guesses the name, at the same confidence',
    good.name === 'Daedalus' && good.basis === 'identity-claim',
    `guess "${good.name}" (basis ${good.basis})`
  );
  const article = guessEntityName('You are the architecture agent on this project.');
  check(
    'K2',
    'the stopword list still does the job it was built for',
    article.basis !== 'identity-claim',
    `"You are the architecture agent" → basis ${article.basis}, name "${article.name}"`
  );
  const proj = guessEntityName('Let us pick this up where we left off.', 'klatch');
  check(
    'K3',
    'with no claim at all the weak basis is used and labelled weak — the shape the strong basis should degrade to',
    proj.basis === 'project-name' && proj.name === 'klatch',
    `guess "${proj.name}" (basis ${proj.basis})`
  );
  const none = guessEntityName('Let us pick this up where we left off.');
  check(
    'K4',
    'and with nothing to go on it declines to guess, which is the outcome all seven should have had',
    none.basis === 'none' && none.name === '',
    `basis ${none.basis}, name "${none.name}"`
  );
}

// ── Arm L — the real corpus, if this machine has it ──────────────────────────
console.log('\nArm L — the real corpus (reported, not asserted: it is machine-local)');
{
  const CORPUS = '/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14';
  if (!fs.existsSync(CORPUS)) {
    meas(
      'L',
      `not present on this machine at ${CORPUS} — arms G–K above do not depend on it, and the ` +
        `numbers quoted in this file's header were measured on 2026-09-12 where it is present.`
    );
  } else {
    const db = new Database(CORPUS, { readonly: true, fileMustExist: true });
    const n = (t: string): number =>
      (db.prepare(`select count(*) c from ${t}`).get() as { c: number }).c;
    meas(
      'L1',
      `${path.basename(CORPUS)}: quick_check ${(db.pragma('quick_check') as { quick_check: string }[])[0].quick_check} · ` +
        `${n('channels')} channels · ${n('messages')} messages · ${n('entities')} entities · ` +
        `${fs.statSync(CORPUS).size} bytes`
    );
    // Every in-scope channel's opener, through the same function the CLI uses.
    const rows = db
      .prepare(
        "select id, name, source from channels where source in ('claude-code','claude-ai') order by id"
      )
      .all() as { id: string; name: string; source: string }[];
    const first = db.prepare(
      "select content from messages where channel_id=? and role='user' order by rowid limit 1"
    );
    let claims = 0;
    const names = new Map<string, number>();
    for (const r of rows) {
      const m = first.get(r.id) as { content: string } | undefined;
      const g = guessEntityName(String(m?.content ?? ''));
      if (g.basis === 'identity-claim') {
        claims++;
        names.set(g.name, (names.get(g.name) ?? 0) + 1);
      }
    }
    db.close();
    meas(
      'L2',
      `of ${rows.length} in-scope channels, ${claims} produce an identity-claim guess, and they ` +
        `produce ${names.size} distinct names: ` +
        [...names.entries()].map(([k, v]) => `"${k}"×${v}`).join(', ')
    );
    open_(
      'L3',
      'not one of those names is the name of the agent whose conversation it is',
      `judged by reading them against the channel titles and openers, which name the role in plain ` +
        `words every time ("Chief Experience Officer", "communications chief", "Chief Innovation ` +
        `Officer", "exploratory testing agent", "Chief of Staff", "Security Operations"). This is a ` +
        `judgement, not a computation, so it is OPEN rather than a check — but it is not a close call.`
    );
  }
}

console.log('\n' + '='.repeat(78));
console.log(`${checks} checks · ${failed} failed · ${open} open`);
console.log('='.repeat(78));
if (failed > 0) process.exitCode = 1;
