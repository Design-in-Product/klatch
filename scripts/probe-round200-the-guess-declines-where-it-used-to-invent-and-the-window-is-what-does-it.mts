/**
 * Round 200 — the guess declines where it used to invent, and the window is
 * what does it.
 *
 * Theseus's Round 199 ran the backfill dry run against xian's real March corpus
 * for the first time and got `Candidates: 72 — 7 would move`, with **0 of 7
 * proposed names correct**. He named four defects and four fixes and built none
 * of them, ranking `3 > 2 > 1 > 4`. This round builds 1–3 and the reporting half
 * of D3. Shape 4 (a `role-title` basis) is deliberately not here: it is the one
 * that makes the feature *work*, as against safe, and it is a round of its own.
 *
 * **Where this round departs from his:** his shape 3 offered two forms — bound
 * the search to the opening, *or* iterate occurrences within a pattern before
 * advancing. Arm N measures the second form on its own and it is a **widening**,
 * not a narrowing: it mints five wrong names instead of seven, three of them on
 * channels that are correctly silent today, re-stamping 415 further message rows
 * onto invented identities. Only the positional bound narrows. The built fix
 * does both — document order *inside* a measured window — but the window is what
 * carries it.
 *
 * Arms G–J re-run Round 199's own defect assertions with their sense inverted:
 * where he asserted "the defect is present", this asserts "it is gone".
 * **Running his probe unchanged after this round therefore reports `14 · 7
 * failed · 1 open`** — G×4, H2, J1, J2 — and those seven failures are the fix
 * landing, not a regression. Arm I still passes, but vacuously (the colliding
 * name is now the empty string). His probe is his round's record and I have not
 * rewritten it; re-vehicling it is his call.
 *
 * Usage: npx tsx scripts/probe-round200-...mts [path/to/klatch.db]
 * Arm L is machine-local and reports rather than asserts.
 */

import fs from 'node:fs';
import Database from 'better-sqlite3';
import {
  guessEntityName,
  IDENTITY_WINDOW_CHARS,
} from '../packages/server/src/import/entity-guess.js';

// ── harness ──────────────────────────────────────────────────────────────────
let checks = 0;
let failed = 0;
let open = 0;
let measurements = 0;

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
  measurements++;
  console.log(`  [MEAS] ${arm}: ${detail}`);
}

/**
 * The seven real openers that Round 199's dry run moved, reduced to the clause
 * that drives the guess — the rest of each message is xian's business content
 * with no bearing on what the regex does. Channel ids are the ones the sheet
 * printed, so any of these can be looked up in the corpus.
 */
const THE_SEVEN = [
  {
    channel: '1e2ced26',
    role: 'Chief Experience Officer',
    opener:
      'Good afternoon. It is Friday Jan 16 at 5:56 PM. Your are the Chief Experience Officer ' +
      'for a project for which I am the lead and CEO. You are succeeding these predecessor chats:',
    was: 'Succeeding',
  },
  {
    channel: 'e52e8fa8',
    role: 'Chief Experience Officer',
    opener:
      'Good afternoon. It is Thursday Jan 8. Your are the Chief Experience Officer for a ' +
      'project for which I am the lead and CEO. You are succeeding the chat which originate the role',
    was: 'Succeeding',
  },
  {
    channel: '39bdeda2',
    role: 'Chief Innovation Officer',
    opener:
      'Good evening. It is Thursday March 12, 2026 at 6:02 PM. You are taking over from your ' +
      'predecessor chat that ran into a limit.',
    was: 'Taking',
  },
  {
    channel: 'a64c9d45',
    role: 'exploratory testing agent',
    opener:
      'Good afternoon. It is Thu Mar 12 at 1:34. You are taking on a new role on this project, ' +
      'exploratory testing.',
    was: 'Taking',
  },
  {
    channel: '358c1952',
    role: 'communications chief',
    opener:
      'Hello! You are my tech-savvy communications chief here on the Piper Morgan project. ' +
      'x'.repeat(1699) +
      " Once you're oriented, please review this batch of omnibus logs from the team.",
    was: 'Oriented',
  },
  {
    channel: 'cff40904',
    role: 'Chief of Staff',
    opener:
      'It is Saturday Jan 3 at 11:33 PM Pacific. You are my Chief of Staff (Executive ' +
      'Assistant) for the Piper Morgan project. ' +
      'x'.repeat(540) +
      " Once you're oriented, please start your own fresh session log for today.",
    was: 'Oriented',
  },
  {
    channel: 'e93d3810',
    role: 'Security Operations',
    opener:
      'Good morning. It is 9:28 AM on Sat Jan 17. You are you Security Operations (Sec Ops) ' +
      'agent and I need to investigate a GCP project suspension.',
    was: 'You',
  },
];

console.log('\nArm G — the seven the dry run would have moved');
for (const s of THE_SEVEN) {
  const g = guessEntityName(s.opener);
  check(
    'G',
    `${s.channel} (${s.role}) no longer mints "${s.was}"`,
    g.basis === 'none',
    `basis ${g.basis}, name ${JSON.stringify(g.name)} — the operator names this one, which is the ` +
      `outcome all seven should have had`
  );
}

console.log('\nArm H — the rationale is now checkable rather than merely checkable-sounding');
{
  const g = guessEntityName('You are Daedalus, the architecture agent.');
  check(
    'H1',
    'a real claim is quoted verbatim, so the confirm step has something to judge',
    g.rationale.includes('"You are Daedalus"'),
    JSON.stringify(g.rationale)
  );
  // Round 199 H2: the old text asserted "The session opens by naming itself
  // 'Oriented'" about a phrase 1,699 characters in. There is now no wording that
  // can make that claim, because no match that far in is reachable.
  const far = guessEntityName('Hello! You are my chief of staff. ' + 'x'.repeat(2000) + " Once you're oriented, go.");
  check(
    'H2',
    'the module can no longer describe a mid-message phrase as how the session opens',
    far.basis === 'none' && !far.rationale.includes('Oriented'),
    `basis ${far.basis} — ${JSON.stringify(far.rationale)}`
  );
}

console.log('\nArm I — collisions are reported rather than left to be noticed');
{
  // The plan-level guard is unit-tested against a real DB in
  // round200-entity-guess-real-corpus-defects.test.ts; this arm checks the input
  // that guard exists for — two unrelated roles reaching the same name.
  const a = guessEntityName('You are Scribe, the comms chief.');
  const b = guessEntityName('You are Scribe, the chief of staff.');
  check(
    'I1',
    'two unrelated roles claiming one name still resolve to one entity — by design, and now reported',
    a.name === b.name && a.name === 'Scribe',
    `${JSON.stringify(a.name)} / ${JSON.stringify(b.name)} — reuse-by-name is the rule; the plan's ` +
      `summary.collisions names the channels and the message count so the operator can judge it`
  );
}

console.log('\nArm J — the pronoun gap');
{
  const g = guessEntityName('You are you Security Operations (Sec Ops) agent');
  check('J1', 'a typo for "your" no longer proposes the pronoun as a name', g.basis === 'none', `basis ${g.basis}`);
  const unfiltered = ['you', 'me', 'us', 'them', 'him', 'her', 'i', 'it', 'we', 'they', 'he', 'she']
    .filter((p) => guessEntityName(`You are ${p} on this project`).basis !== 'none');
  check('J2', 'and no neighbouring pronoun is left in the gap', unfiltered.length === 0, `unfiltered: ${unfiltered.join(', ') || 'none'}`);
}

console.log('\nArm K — controls: the fixes must not have turned the guess off');
{
  const k1 = guessEntityName('You are Daedalus, the architecture agent for Klatch.');
  check('K1', 'a genuine identity line still guesses, at the same confidence', k1.name === 'Daedalus' && k1.basis === 'identity-claim', `guess ${JSON.stringify(k1.name)} (${k1.basis})`);

  const k2 = guessEntityName('You are the architecture agent');
  check('K2', 'the stopword list still does the job it was built for', k2.basis === 'none', `basis ${k2.basis}`);

  const k3 = guessEntityName('Can you help me with this?', 'klatch');
  check('K3', 'with no claim at all the weak basis is still used and still labelled weak', k3.basis === 'project-name' && k3.name === 'klatch', `guess ${JSON.stringify(k3.name)} (${k3.basis})`);

  const k4 = guessEntityName('', '');
  check('K4', 'and with nothing to go on it still declines', k4.basis === 'none', `basis ${k4.basis}`);

  // A refusal must move *forward*, not stop. Narrowing that becomes "give up at
  // the first stopword" would be a different regression wearing the same number.
  const k5 = guessEntityName('You are the agent for this project. You are Daedalus.');
  check('K5', 'a rejected stopword still crosses to a real claim inside the window', k5.name === 'Daedalus', `guess ${JSON.stringify(k5.name)} (${k5.basis})`);

  // The cost of the -ing net, bounded: away from a following preposition it must
  // not fire on a real name.
  const k6 = guessEntityName('You are Sterling, the architecture agent.');
  check('K6', 'a real name ending in -ing is still guessed when no preposition follows', k6.name === 'Sterling', `guess ${JSON.stringify(k6.name)}`);

  // Case normalisation, unchanged by the rewrite of the scan.
  const k7 = guessEntityName('you are daedalus here');
  check('K7', 'casing is still normalised so one agent is not two entities', k7.name === 'Daedalus', `guess ${JSON.stringify(k7.name)}`);
}

console.log('\nArm M — the window sits in a gap that was measured, not chosen');
{
  check('M1', 'a claim as far in as the furthest real one (158) is still accepted', guessEntityName('x'.repeat(158) + ' You are Daedalus.').name === 'Daedalus', `window is ${IDENTITY_WINDOW_CHARS}`);
  check('M2', 'a claim past the window is refused', guessEntityName('x'.repeat(IDENTITY_WINDOW_CHARS + 1) + ' You are Daedalus.').basis === 'none', 'the failure this accepts: a long preamble before the identity line costs one field of typing');
  check('M3', 'and the constant lies between the two populations the corpus showed', IDENTITY_WINDOW_CHARS > 158 && IDENTITY_WINDOW_CHARS < 511, `158 < ${IDENTITY_WINDOW_CHARS} < 511 — real claims end at 158, false ones begin at 511`);
}

console.log('\nArm N — why the bound, and not occurrence-iteration alone');
{
  // Round 199's shape 3 offered iteration as an alternative to the bound. These
  // are the five names iteration-without-a-bound produces on the real corpus,
  // measured this round by setting the window to 1e9 and re-running the dry run.
  // Reported rather than asserted: reproducing it needs the corpus and a
  // deliberately broken module.
  meas('N1', 'window disabled, shapes 1+2 in: Candidates: 72 — 5 would move, new agents (5): Up, Ready, Aware, Oriented, Settled');
  meas('N2', 'three of those five — Up (93 rows), Aware (174), Settled (148) — are channels that produce no guess today, so iteration alone adds 415 re-stamped rows to a corpus it was meant to make safer');
  meas('N3', 'old scan semantics, shapes 1+2 in: Candidates: 72 — 2 would move, new agents (1): Oriented — the collision survives the naming fixes, which is why the bound is the load-bearing one');
}

console.log('\nArm L — the real corpus (reported, not asserted: it is machine-local)');
{
  const dbPath = process.argv[2] ?? '/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14';
  if (!fs.existsSync(dbPath)) {
    meas('L1', `no corpus at ${dbPath} — arms G–N above are synthetic and stand on their own`);
  } else {
    const db = new Database(dbPath, { readonly: true });
    // `channels.type` postdates the March schema; Theseus's own probe crashed on
    // exactly this. Ask the file what columns it has rather than assuming.
    const cols = (db.pragma('table_info(channels)') as { name: string }[]).map((c) => c.name);
    const chCount = (db.prepare('SELECT COUNT(*) n FROM channels').get() as { n: number }).n;
    const msgCount = (db.prepare('SELECT COUNT(*) n FROM messages').get() as { n: number }).n;
    meas('L1', `${dbPath.split('/').pop()}: ${chCount} channels · ${msgCount} messages · ${cols.length} channel columns${cols.includes('type') ? '' : ' (pre-`type` schema)'}`);

    const openerStmt = db.prepare(
      `SELECT content FROM messages WHERE channel_id = ? AND role = 'user' ORDER BY rowid ASC LIMIT 1`
    );
    const ids = (db.prepare('SELECT id FROM channels ORDER BY id').all() as { id: string }[]);
    const names = new Set<string>();
    let claims = 0;
    for (const { id } of ids) {
      const opener = (openerStmt.get(id) as { content: string } | undefined)?.content ?? '';
      const g = guessEntityName(opener);
      if (g.basis === 'identity-claim') {
        claims++;
        names.add(g.name);
      }
    }
    db.close();
    meas('L2', `across all ${ids.length} channels, ${claims} produce an identity-claim guess, spanning ${names.size} distinct names: ${[...names].join(', ') || '(none)'}`);
    open_(
      'L3',
      'zero guesses is the correct answer and also a backfill that does nothing',
      'Every one of the seven states its role in plain words — "Chief Innovation Officer", ' +
        '"communications chief", "Security Operations" — in the channel title and the opener. A ' +
        '`role-title` basis (Round 199 shape 4) plausibly gets 7/7 where the strongest current ' +
        'basis now gets 0. Declining beats minting "Taking" twice, so this is not an argument ' +
        'against the fixes — but nobody should read "0 would move" as the feature working. OPEN ' +
        'until shape 4 is built or xian rules it out.'
    );
  }
}

console.log('\n' + '='.repeat(78));
console.log(`${checks} checks · ${failed} failed · ${open} open · ${measurements} measurements`);
console.log('='.repeat(78));
if (failed > 0) process.exitCode = 1;
