/**
 * Round 201 — the window holds this corpus and not the class, and the corpus
 * has no names in it.
 *
 * Round 199 (mine) ran the backfill dry run against xian's real March corpus
 * and got `Candidates: 72 — 7 would move` with 0 of 7 names correct. Round 200
 * (Daedalus) built shapes 1–3 and the reporting half of D3; both corpora now
 * read `0 would move`. Everything in his memo reproduces from this seat — the
 * numbers are in arm A and arm L below.
 *
 * This round is two things:
 *
 * 1. **Round 199's probe, re-vehicled.** His round inverts mine: arms G/H/J of
 *    `probe-round199` assert "the defect is present" and therefore report `14 ·
 *    7 failed · 1 open` against the fix, and arm I passes *vacuously* (its
 *    colliding name is now the empty string). He left re-vehicling to me. Arms
 *    A, B and F here are that suite, aimed at the fix instead of the defect.
 *
 * 2. **Where the fix's protection comes from, measured.** The window is a
 *    *positional* bound. It excludes the six false claims in this corpus
 *    because they sit at offsets 511–1,706. It excludes nothing at offset 0 —
 *    and arm C shows that 18 of 20 plainly-not-a-name openers written at offset
 *    0 still mint a name at the strongest confidence the tool has, including
 *    (arm D) four of the five words Round 200's own arm N named. The class the
 *    window was aimed at is still open; this corpus just does not contain a
 *    member of it near the start of a message.
 *
 *    Arm E offers the discriminator the corpus actually supports: every one of
 *    the 7 false claims sits in a subordinate clause ("**once** you are up to
 *    speed", "as far as you are aware", "**when** you are ready") and not one
 *    of the 14 real claims does. 14/14 and 7/7, position-independent.
 *
 *    Arm L is the finding I did not expect. Of the 14 in-window identity claims
 *    in the whole corpus, **zero propose a name** — every one is a *role*
 *    claim ("You are my tech-savvy communications chief", "you are the Head of
 *    Sapient Resources"). The `identity-claim` basis does not merely have poor
 *    precision here; it has **no true positive available to it**. That is the
 *    measurement behind Daedalus's §7 read, and it makes shape 4 the basis
 *    rather than a fallback.
 *
 * Nothing outside `.testdata/` is written. The real corpus is opened read-only
 * and hashed before and after. Zero model calls.
 *
 * Usage: npx tsx scripts/probe-round201-...mts [path/to/corpus.db]
 * Arms E-corpus and L are machine-local and degrade to one line when absent.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import {
  guessEntityName,
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
const DATA = path.join(ROOT, '.testdata', 'r201');
const CLI = path.join(ROOT, 'scripts', 'backfill-entity-bindings.mts');
const CORPUS =
  process.argv[2] ?? '/Users/xian/Development/klatch/backups/klatch.db.backup-2026-03-14';

const IDENTITY_PATTERN_SOURCES = [
  String.raw`\byou\s+are\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b`,
  String.raw`\byou'?re\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b`,
  String.raw`\bacting\s+as\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\b`,
  String.raw`\bthis\s+is\s+([A-Za-z][A-Za-z0-9'’-]{1,30})\s+(?:resuming|continuing|picking\s+up)\b`,
];

console.log('='.repeat(78));
console.log('Round 201 — the window holds this corpus and not the class, and the corpus');
console.log('           has no names in it');
console.log('='.repeat(78));

// ── Arm A — Round 199's defects, asserted absent ─────────────────────────────
/**
 * The four openers from the real corpus, reduced to the clause that drove the
 * guess. Same text as Round 199's `REAL_SHAPES`; the assertion is inverted.
 */
const REAL_SHAPES = [
  {
    label: 'succeeding-predecessors',
    role: 'Chief Experience Officer',
    was: 'Succeeding',
    opener:
      'Good afternoon. It is Friday Jan 16 at 5:56 PM. Your are the Chief Experience Officer ' +
      'for a project for which I am the lead and CEO. You are succeeding these predecessor chats:',
  },
  {
    label: 'taking-over-from',
    role: 'Chief Innovation Officer',
    was: 'Taking',
    opener:
      "Good evening, Chief Innovation Officer (CIO)! It's Fri Feb 20 at 6:02 PM. You are taking " +
      'over from your predecessor chat that ran into file-creation errors after a model update.',
  },
  {
    label: 'taking-on-a-role',
    role: 'exploratory testing agent',
    was: 'Taking',
    opener:
      'Good afternoon. It is Thu Mar 12 at 1:34. You are taking on a new role on this project, ' +
      'exploratory testing agent or ETA for short. Your role slug is `test`.',
  },
  {
    label: 'you-are-you-typo',
    role: 'Security Operations',
    was: 'You',
    opener:
      "Good morning. It's 5:38 AM on Sat Jan 17. You are you Security Operations (Sec Ops) agent " +
      'and I need to to help me investigation an issue.',
  },
];

console.log('\nArm A — Round 199 re-vehicled: the four defects, asserted gone');
{
  for (const s of REAL_SHAPES) {
    const g = guessEntityName(s.opener);
    check(
      `A:${s.label}`,
      `no longer mints "${s.was}"`,
      g.basis === 'none' && g.name === '',
      `basis ${g.basis}, name "${g.name}" — the session is the ${s.role}; the operator names it`
    );
  }

  // D1's list, from Round 199's arm G. All six were unfiltered then.
  const verbs = ['succeeding', 'taking', 'continuing', 'resuming', 'replacing', 'picking'];
  const unfiltered = verbs.filter(
    (v) => guessEntityName(`You are ${v} over from your predecessor chat.`).basis !== 'none'
  );
  check(
    'A:continuation-verbs',
    'every continuation verb Round 199 named is filtered',
    unfiltered.length === 0,
    `${verbs.length - unfiltered.length} of ${verbs.length} filtered${unfiltered.length ? ` — still open: ${unfiltered.join(', ')}` : ''}`
  );

  // D4's list, from Round 199's arm J.
  const pronouns = ['you', 'your', 'i', 'it', 'we', 'they', 'he', 'she'];
  const leaks = pronouns.filter(
    (p) => guessEntityName(`You are ${p} Security Operations agent.`).basis !== 'none'
  );
  check(
    'A:pronoun-gap',
    'the one-word gap in the pronoun list is closed',
    leaks.length === 0,
    `${pronouns.length - leaks.length} of ${pronouns.length} filtered${leaks.length ? ` — still open: ${leaks.join(', ')}` : ''}`
  );

  // D2: the rationale is the confirm step's only evidence on a path with no
  // confirm step. Round 199 showed it asserting "opens by naming itself" about
  // a phrase 269 characters in. It is a quote now — so the check is that the
  // quote is really present in the opener, which a paraphrase cannot promise.
  const named = guessEntityName('You are Daedalus, the architecture agent for this project.');
  const quoted = /"([^"]+)"/.exec(named.rationale)?.[1] ?? '';
  check(
    'A:rationale-is-a-quote',
    'the rationale quotes text the operator can find in the message',
    quoted.length > 0 &&
      'You are Daedalus, the architecture agent for this project.'.includes(quoted),
    `rationale ${JSON.stringify(named.rationale)} — quoted span ${JSON.stringify(quoted)}`
  );
}

// ── Arm B — controls: the guess is not simply switched off ───────────────────
console.log('\nArm B — controls: a real claim still guesses, at the same confidence');
{
  const cases: [string, string, string][] = [
    ['B:named', 'You are Daedalus, the architecture agent for this project.', 'Daedalus'],
    ['B:lowercase', 'you are calliope, our writer.', 'Calliope'],
    ['B:-ing-name', 'You are Sterling, the architecture agent.', 'Sterling'],
  ];
  for (const [id, opener, want] of cases) {
    const g = guessEntityName(opener);
    check(id, 'still guessed', g.basis === 'identity-claim' && g.name === want, `guess "${g.name}" (${g.basis})`);
  }
  const weak = guessEntityName('Please look at the build failure.', 'klatch');
  check('B:weak-fallback', 'the weak basis is still used and still labelled weak', weak.basis === 'project-name' && weak.name === 'klatch', `guess "${weak.name}" (${weak.basis})`);
  const nothing = guessEntityName('Please look at the build failure.');
  check('B:declines', 'with nothing to go on it declines', nothing.basis === 'none', `basis ${nothing.basis}`);

  const pad = (n: number) => 'x'.repeat(n) + '. ';
  const inside = guessEntityName(`${pad(140)}You are Daedalus, the architecture agent.`);
  const outside = guessEntityName(`${pad(IDENTITY_WINDOW_CHARS)}You are Daedalus, the architecture agent.`);
  check('B:window-near-edge', 'a claim as far in as the furthest real one is still accepted', inside.name === 'Daedalus', `window is ${IDENTITY_WINDOW_CHARS}; claim at ~142`);
  check('B:window-past-edge', 'a claim past the window is refused', outside.basis === 'none', `the accepted cost: a long preamble before the identity line is one field of typing`);
}

// ── Arm C — the residual: at offset 0 the window excludes nothing ────────────
/**
 * Twenty openers a person could plausibly write, none of which names an agent,
 * all with the claim at offset 0. The window cannot help here by construction,
 * so `NOT_NAMES` is the only thing between the pattern and a minted identity —
 * and a denylist is being asked to enumerate the English language.
 */
const NOT_A_NAME_OPENERS = [
  'You are welcome to ask me anything as we go.',
  'You are new here, so let me give you some background on the project.',
  'You are back! Let us pick up where we left off yesterday.',
  'You are joining a project that has been running since January.',
  'You are helping me write the launch announcement today.',
  'You are reading a long brief; take your time with it.',
  'You are probably wondering what this is about.',
  'You are allowed to ask clarifying questions at any point.',
  'You are best placed to judge this, so tell me what you think.',
  'You are such a help with this kind of thing.',
  'You are still the same agent from before, just in a new window.',
  'You are only going to see part of the file.',
  'You are just getting started, so here is the context.',
  'You are very good at this sort of analysis.',
  'You are required to follow the house style guide.',
  'You are aware of the Q1 plan already.',
  'You are ready? Great, here is the brief.',
  'You are up first on the agenda today.',
  'You are settled now, so let us begin.',
  'You are oriented enough to start.',
];

console.log('\nArm C — the window is a positional bound, and at offset 0 there is no position to bound');
{
  const minted = NOT_A_NAME_OPENERS.map((o) => ({ o, g: guessEntityName(o) })).filter(
    (r) => r.g.basis === 'identity-claim'
  );
  check(
    'C1',
    'plainly-not-a-name openers at offset 0 still mint an identity at the strongest confidence',
    minted.length > 0,
    `${minted.length} of ${NOT_A_NAME_OPENERS.length} mint: ${minted.slice(0, 8).map((r) => `"${r.g.name}"`).join(', ')}${minted.length > 8 ? ', …' : ''}`
  );
  const survivors = NOT_A_NAME_OPENERS.filter((o) => guessEntityName(o).basis === 'none');
  meas(
    'C2',
    `the ${NOT_A_NAME_OPENERS.length - minted.length} that do decline do so via the -ing + preposition net, not the denylist: ${survivors.map((o) => JSON.stringify(o.split(' ').slice(0, 4).join(' '))).join(', ')} — the net Round 200 added is the part of the fix that generalizes`
  );
  check(
    'C3',
    'and the rationale reports one of these as the session opening turn',
    minted.length > 0 && /opening turn says/.test(minted[0].g.rationale),
    `e.g. ${JSON.stringify(minted[0]?.g.rationale ?? '(none)')} — true as a quote, which is the mitigation Round 200 added; the name column still says "${minted[0]?.g.name}"`
  );
  meas(
    'C4',
    `for any opener shorter than ${IDENTITY_WINDOW_CHARS} characters the window excludes nothing at all — it is not a filter on these, it is a filter on where they sit`
  );
}

// ── Arm D — the five words Round 200's own arm N named ───────────────────────
console.log("\nArm D — Round 200's arm N named five words; four are not filtered, only far away");
{
  // Arm N of probe 200: window out, shapes 1+2 in → `Up, Ready, Aware, Oriented, Settled`.
  const N_WORDS = ['up', 'ready', 'aware', 'oriented', 'settled'];
  const results = N_WORDS.map((w) => {
    const opener = `Hi! Once you are ${w} we can begin; there is a lot to get through today.`;
    return { w, at: opener.indexOf('you are'), g: guessEntityName(opener) };
  });
  const minting = results.filter((r) => r.g.basis === 'identity-claim');
  check(
    'D1',
    "the words the window excluded by distance mint names when the same sentence is written early",
    minting.length > 0,
    `${minting.length} of ${N_WORDS.length} at offset ${results[0].at}: ${minting.map((r) => `"${r.g.name}"`).join(', ')}`
  );
  const rePhrased = N_WORDS.map((w) => guessEntityName(`Hi! Once you're ${w} we can begin.`));
  check(
    'D2',
    'and the same through the second pattern, so it is not one pattern misbehaving',
    rePhrased.filter((g) => g.basis === 'identity-claim').length === minting.length,
    `you're-form: ${rePhrased.filter((g) => g.basis === 'identity-claim').length} of ${N_WORDS.length} mint`
  );
  meas(
    'D3',
    `in xian's corpus these same five sit at offsets 511, 538, 638, 693 and 894–1,706, so the window excludes every one of them. Their nearest approach to the window is 111 characters of one person's preamble — arm E is a rule that does not depend on that distance`
  );
}

// ── Arm E — the discriminator the corpus supports: the subordinate clause ────
const SUBORD =
  /\b(once|when|whenever|if|after|until|before|while|unless|as far as|as soon as|now that|in case|assuming|provided|since|though|although|because|so that|make sure)\s*$/i;

console.log('\nArm E — every false claim is in a subordinate clause and no real one is');
{
  const falseClaims = [
    'Anyhow, once you are up to speed we can start on the M0 milestone.',
    'Tell me which action item is still open as far as you are aware.',
    'Once you are settled in, I will provide you with the blog post template.',
    'Please review all these and when you are ready we will do a few things.',
    "Models, canonical queries, 0.8.3. Once you're oriented, take the next batch.",
  ];
  const realClaims = REAL_SHAPES.map((s) => s.opener).concat([
    'You are my tech-savvy communications chief here on the Piper Morgan project!',
    'Good evening! Friday, January 16 at 8:37 PM, and you are the Head of Sapient Resources.',
  ]);
  const inSubordinate = (text: string) => {
    for (const src of IDENTITY_PATTERN_SOURCES) {
      for (const m of text.matchAll(new RegExp(src, 'gi'))) {
        if (SUBORD.test(text.slice(Math.max(0, m.index! - 40), m.index!).replace(/\s+/g, ' ')))
          return true;
      }
    }
    return false;
  };
  // Counted, not asserted-and-narrated: the first draft of this check hardcoded
  // its own detail line as "5/5 … 0/6" and reported that while failing. The
  // numbers below are computed from the same predicate the check uses.
  const falseSub = falseClaims.filter(inSubordinate).length;
  const realSub = realClaims.filter(inSubordinate).length;
  check(
    'E1',
    'a one-token lookbehind separates the two populations on the synthetic shapes',
    falseSub === falseClaims.length && realSub === 0,
    `${falseSub}/${falseClaims.length} false claims are subordinate, ${realSub}/${realClaims.length} real ones are`
  );
  check(
    'E2',
    'and the module does not use it: the false clauses written early still mint',
    falseClaims.filter((t) => guessEntityName(t).basis === 'identity-claim').length > 0,
    `${falseClaims.filter((t) => guessEntityName(t).basis === 'identity-claim').length} of ${falseClaims.length} mint at offset ≤ 80: ${falseClaims.map((t) => guessEntityName(t).name).filter(Boolean).join(', ')}`
  );

  /**
   * Found by writing a fixture with the apostrophe my editor produces. Pattern 2
   * is `\byou'?re\b` — ASCII apostrophe only — while the *candidate* character
   * class on every pattern is `[A-Za-z0-9'’-]`, which does include `’`. So the
   * module was written with typographic apostrophes in mind for names and not
   * for the contraction that introduces them.
   *
   * This one fails in the module's preferred direction (a blank, not a wrong
   * name) and is a one-character fix. It is here because a corpus exported from
   * a phone, a Word document or anything with smart quotes on would take that
   * blank silently, and because it is the reason arm E1 failed on its first run.
   */
  const straight = guessEntityName("You're Daedalus, the architecture agent.");
  const curly = guessEntityName('You’re Daedalus, the architecture agent.');
  check(
    'E3',
    'a typographic apostrophe in "you’re" loses the claim entirely',
    straight.basis === 'identity-claim' && curly.basis === 'none',
    `"You're Daedalus" → "${straight.name}" (${straight.basis}); "You’re Daedalus" → "${curly.name}" (${curly.basis}) — pattern 2 is \\byou'?re\\b, ASCII only, while the candidate class already accepts ’`
  );
}

// ── Arm F — the collision warning reaches the operator's sheet ───────────────
/**
 * Round 200 tests `plan.summary.collisions` at the plan. This seat's question is
 * whether it reaches the sheet a person reads before typing `--apply`, so this
 * builds a two-channel corpus that collides under the *current* code and runs
 * the real CLI at it.
 */
console.log('\nArm F — and the collision warning reaches the sheet, not just the plan');
{
  fs.rmSync(path.join(DATA, 'collide'), { recursive: true, force: true });
  fs.mkdirSync(path.join(DATA, 'collide'), { recursive: true });
  const dbPath = path.join(DATA, 'collide', 'klatch.db');
  process.env.KLATCH_DB = dbPath;
  const { getDb } = await import('../packages/server/src/db/index.js');
  const { DEFAULT_ENTITY_ID } = await import('@klatch/shared');
  const db = getDb();
  const seed = (id: string, name: string, opener: string, replies: number) => {
    db.prepare('INSERT INTO channels (id, name, type, source, project_id) VALUES (?, ?, ?, ?, ?)').run(
      id, name, 'chat', 'claude-ai', null
    );
    db.prepare('INSERT INTO channel_entities (channel_id, entity_id) VALUES (?, ?)').run(id, DEFAULT_ENTITY_ID);
    const ins = db.prepare(
      'INSERT INTO messages (id, channel_id, role, content, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    ins.run(`${id}-u0`, id, 'user', opener, null, '2026-03-01T00:00:00.000Z');
    for (let i = 0; i < replies; i++)
      ins.run(`${id}-a${i}`, id, 'assistant', 'reply', DEFAULT_ENTITY_ID, '2026-03-02T00:00:00.000Z');
  };
  seed('c-comms', '1/2-14: Comms Chief (o)', 'You are Scribe, the comms chief.', 34);
  seed('c-staff', '1/3-2/6: Chief of Staff (o4.5)', 'You are Scribe, the chief of staff.', 122);
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.close();

  const r = spawnSync('npx', ['tsx', CLI, dbPath], { cwd: ROOT, encoding: 'utf8' });
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  check(
    'F1',
    'two unrelated channels taking one name are warned about above the table',
    /would take 2 channels/.test(out) && /156 message rows/.test(out),
    (/^\s*!.*$/m.exec(out)?.[0] ?? '(no warning line)').trim()
  );
  check(
    'F2',
    'the warning names both channels by title, which is what the operator judges on',
    /Comms Chief/.test(out) && /Chief of Staff/.test(out),
    `exit ${r.status}; both titles present: ${/Comms Chief/.test(out) && /Chief of Staff/.test(out)}`
  );
  check(
    'F3',
    'the rationale now reaches the sheet too — Round 199 found it carried and dropped',
    /opening turn says/.test(out),
    (/opening turn says[^\n]*/.exec(out)?.[0] ?? '(absent)').slice(0, 90)
  );
  // The silence control: 72 channels sharing `no-guess` is not a collision.
  check(
    'F4',
    'and it is silent when the shared outcome is a decline rather than a name',
    !/""\s+would take/.test(out),
    'no collision is reported for the empty name — collisions are built from rows that would move'
  );
}

// ── Arm L — the real corpus ──────────────────────────────────────────────────
console.log('\nArm L — the real corpus (reported, not asserted: it is machine-local)');
{
  if (!fs.existsSync(CORPUS)) {
    meas('L', `${CORPUS} absent on this machine — arms A–F above are synthetic and stand without it`);
  } else {
    const before = crypto.createHash('sha256').update(fs.readFileSync(CORPUS)).digest('hex');
    const db = new Database(CORPUS, { readonly: true });
    const rows = db
      .prepare(
        `SELECT c.id, c.name,
          (SELECT m.content FROM messages m WHERE m.channel_id=c.id AND m.role='user'
             ORDER BY m.created_at, m.rowid LIMIT 1) AS opener
         FROM channels c`
      )
      .all() as { id: string; name: string; opener: string | null }[];
    const openers = rows.filter((r) => (r.opener ?? '').trim());

    type Hit = { at: number; cand: string; claim: string; sub: string | null; title: string };
    const hits: Hit[] = [];
    for (const r of openers) {
      const op = (r.opener as string).trim();
      for (const src of IDENTITY_PATTERN_SOURCES) {
        for (const m of op.matchAll(new RegExp(src, 'gi'))) {
          const before40 = op.slice(Math.max(0, m.index! - 40), m.index!).replace(/\s+/g, ' ');
          hits.push({
            at: m.index!,
            cand: m[1],
            claim: m[0].replace(/\s+/g, ' '),
            sub: SUBORD.exec(before40)?.[1] ?? null,
            title: String(r.name).slice(0, 40),
          });
        }
      }
    }
    const inWin = hits.filter((h) => h.at < IDENTITY_WINDOW_CHARS);
    const outWin = hits.filter((h) => h.at >= IDENTITY_WINDOW_CHARS);

    meas('L1', `${path.basename(CORPUS)}: ${rows.length} channels, ${openers.length} with an opening user turn, ${hits.length} raw pattern hits across ${new Set(hits.map((h) => h.title)).size} channels`);
    meas('L2', `${inWin.length} hits inside the ${IDENTITY_WINDOW_CHARS}-char window (offsets ${inWin.map((h) => h.at).sort((a, b) => a - b).join(', ')}), ${outWin.length} outside (${outWin.map((h) => h.at).sort((a, b) => a - b).join(', ')})`);
    meas('L3', `subordinate-clause test: ${inWin.filter((h) => h.sub).length}/${inWin.length} of the in-window hits are subordinate, ${outWin.filter((h) => h.sub).length}/${outWin.length} of the out-of-window ones are — the same separation the window gets, without depending on distance`);

    const capitalized = inWin.filter((h) => /^[A-Z]/.test(h.cand));
    meas('L4', `of the ${inWin.length} in-window claims, ${capitalized.length} propose a capitalized candidate. The candidates are: ${[...new Set(inWin.map((h) => h.cand.toLowerCase()))].join(', ')}`);

    const cliOut = spawnSync('npx', ['tsx', CLI, CORPUS], { cwd: ROOT, encoding: 'utf8' });
    meas('L5', `the CLI dry run against this corpus: ${/^Candidates:.*$/m.exec((cliOut.stdout ?? '') + (cliOut.stderr ?? ''))?.[0] ?? '(no line)'}`);

    const after = crypto.createHash('sha256').update(fs.readFileSync(CORPUS)).digest('hex');
    check('L6', 'the corpus is byte-identical after this probe ran against it', before === after, `sha256 ${before.slice(0, 16)} both sides`);

    open_(
      'L7',
      'the identity-claim basis has no true positive available on this corpus',
      `not one of the ${inWin.length} in-window claims proposes a name — every one is a *role* claim ("You are my tech-savvy communications chief", "you are the Head of Sapient Resources", "You are my chief architect"). Round 199 measured the basis at 0 of 7 precision; this is the other half of it, a recall ceiling of 0 out of 0. Declining is the right answer and there is nothing here for this basis to find, ever. Shape 4 (a role-title basis) is therefore not a fallback behind identity-claim — on imported claude-ai sessions it is the only basis the corpus supports. OPEN until shape 4 is built or xian rules it out. Note also: the module's stated reason for not filtering on capitalization ("sessions open with 'you are Daedalus' and 'you are daedalus' about equally often") has n=0 evidence here in either direction — this corpus contains no name claim of either casing.`
    );
  }
}

console.log('\n' + '='.repeat(78));
console.log(`${checks} checks · ${failed} failed · ${open} open`);
console.log('='.repeat(78));
