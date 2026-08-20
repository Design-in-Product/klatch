#!/usr/bin/env node
/**
 * Does the probe's filler content still satisfy the constraints its own docblocks state?
 *
 * **Why this exists, 2026-08-18 (STOP).** Arm N needs 10 new `FILLER_LEAD` pairs (N1) or 23
 * (N2) — see `docs/research/arm-n-offer-size-geometry-2026-08-18.md` §3. Every one of those
 * pairs has to satisfy four constraints that today live only as prose in two docblocks
 * (`probe-recall-tool.mjs`, `FILLER` and `FILLER_LEAD`). Prose constraints on a growing corpus
 * are checked by whoever last read the prose, which is the same failure shape as the
 * hand-copied marker substrings that made `REACHABLE_R54` read a false zero: nothing announces
 * a violation, the arm just runs and reports a number.
 *
 * **What it can and cannot check, stated up front because the difference is the whole design.**
 *
 * | Constraint (from the docblocks) | Here |
 * |---|---|
 * | Codeword absent from every filler pair | **checked** — exact, hard failure |
 * | Restriction wording absent from every filler pair | **checked** — hard failure |
 * | `FILLER_LEAD` pairs distinct from `FILLER` pairs | **checked** — hard failure |
 * | No filler pair answers the arm's own `ask` as the tool would run it | **checked** — hard failure |
 * | Every user turn is interrogative, and hands nothing over | **checked** — hard failure |
 * | "No term a *narrowing retry* would reach for" | **reported, not judged** |
 * | Same register | not checkable — human |
 *
 * The last mechanical row is the one worth being precise about. `recallFromOtherConversations`
 * **ANDs** its tokens as case-insensitive *substrings* (`recall.ts:427-430` →
 * `queries.ts:574-589`), so a pair is a false candidate for the literal `ask` only if every one
 * of its tokens appears somewhere in the pair's text. That is exact and is checked as a failure.
 * A *retry* is a query the live model composes, and Round 62 §9 already records that which
 * occurrences a live query matches is not decidable ahead of the run. So retry risk is
 * **surfaced as a shared-term report** and left to the author. Mechanical where the constraint
 * is mechanical, informative where it is judgment — a checker that pretended to rule on the
 * retry case would be asserting something it cannot know.
 *
 * **Reads the probe rather than importing it, deliberately.** The corpora and `ARMS` are pure
 * literals inside `probe-recall-tool.mjs`, which is a live instrument with top-level `await`
 * and network calls. Extracting them into an importable module would be a refactor of the
 * instrument mid-experiment — the exact move `FILLER_LONG`'s docblock refused for the same
 * reason. So this parses the literals out of the source and evaluates them in isolation. The
 * probe is not touched and does not know this file exists.
 *
 * ── The fifth constraint, added 2026-08-20 (START), Theseus ─────────────────
 *
 * `FILLER_LEAD`'s docblock carries a constraint the other two lists do not state: *"Every pair
 * is a question I asked, never something handed over."* It is there because arm L's referent
 * clause resolves by the verb "handed", and `FILLER_LEAD` is the list sitting in front of the
 * handover. The gap list — `FILLER`/`FILLER_LONG`, consumed by `filler.slice(0, gapPairs)` —
 * never needed the protection, because unswapped the restriction points *backward* across the
 * gap and "handed" resolves past it.
 *
 * **A marking-first arm inverts that.** Put the restriction in front of the seed and the gap
 * rows become the thing standing between it and its referent — and the constraint becomes
 * load-bearing on a list that has never been held to it. Daedalus read all 17 user turns of
 * `FILLER` + `FILLER_LONG` on 2026-08-20 and found it holds today *by accident of register*:
 * every one happens to be a question. Nothing was stopping the next-authored pair from breaking
 * it. So the rule moves out of one list's prose and into all three lists' check, before the
 * pairs that would test it get written.
 *
 * **What this check is, precisely.** Two halves, one exact and one a recogniser:
 *
 *   - *Interrogative* — the user turn ends in `?`. Exact, and a **necessary** condition for
 *     "a question I asked". It is not sufficient: "Here's the draft — can you look at it?" is
 *     a question and a handover both.
 *   - *Handover voice* — a lexicon of phrases that transfer an item to the other party. This is
 *     a recogniser, so it has false negatives by construction, and a paraphrase nobody listed
 *     will pass. It is a floor under the constraint, not a decision procedure for it.
 *
 * **The recogniser is asserted against fixtures on every run** (`HANDOVER_FIXTURES` below), not
 * merely pointed at the corpus. Round 59's rule: a recogniser that matches nothing agrees
 * trivially, and this one is expected to match nothing in a clean corpus — which is exactly the
 * shape of a check that has quietly stopped working. If the fixtures ever stop separating, the
 * script dies before it reports on the corpus at all.
 *
 * **User turn hard-fails; assistant turn is a note.** The direction matters: a *user* handover
 * plants a competing antecedent for "what I handed you", which is the resolution the arm
 * depends on. An assistant handing something to the user runs the other way and is a weaker
 * risk, so it is surfaced for the author rather than failed on.
 *
 * Usage:  npx tsx scripts/verify-filler-constraints.mjs [--verbose] [--probe=<path>]
 *         (`node` alone will not do — `recall.ts` is TypeScript and imports `.js` specifiers.)
 * Exit:   0 all constraints hold · 1 a hard constraint is violated · 2 the recogniser's own
 *         fixtures failed, so nothing it says about the corpus can be trusted
 *
 * `--probe` exists so the checker can be pointed at a *doctored copy* and shown to fail. A
 * verifier that has only ever returned green is a verifier whose green means nothing; the
 * negative runs are recorded in the session log alongside the positive one.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OVERRIDE = (process.argv.find((s) => s.startsWith('--probe=')) || '').slice('--probe='.length);
const PROBE = OVERRIDE || path.join(__dirname, 'probe-recall-tool.mjs');
const VERBOSE = process.argv.includes('--verbose');

// `recall.ts` reaches the db module transitively and that module binds its path at load time,
// so point it somewhere harmless before importing. Nothing here opens a connection, but a
// default that resolves to the real `klatch.db` is not a default worth relying on.
process.env.KLATCH_DB = path.join(__dirname, '..', '.testdata', 'verify-filler-constraints.db');
const { tokenizeRecallQuery } = await import('../packages/server/src/claude/recall.ts');

const src = fs.readFileSync(PROBE, 'utf8');

/** Pull `const NAME = <literal>;` out of the source and evaluate it in the given scope. */
function literal(name, open, close, scope = {}) {
  const start = src.indexOf(`const ${name} = ${open}`);
  if (start === -1) throw new Error(`${name} not found in ${PROBE} — did it get renamed?`);
  const from = start + `const ${name} = `.length;
  const end = src.indexOf(`\n${close};`, from);
  if (end === -1) throw new Error(`${name} has no closing "${close};" at column 0`);
  const text = src.slice(from, end + 1 + close.length);
  const keys = Object.keys(scope);
  return new Function(...keys, `return ${text}`)(...keys.map((k) => scope[k]));
}

const FILLER = literal('FILLER', '[', ']');
const FILLER_LONG = literal('FILLER_LONG', '[', ']', { FILLER });
const FILLER_LEAD = literal('FILLER_LEAD', '[', ']');
const ARMS = literal('ARMS', '{', '}');

const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

// ── 1. The two lead-side lists must not share content with the shared one ────
//
// Not tidiness: the `evictedMarking` branch consumes `FILLER` twice already, and the scanner
// and the recogniser both work by content match. Two rows saying the same thing is "a silent
// collision" in this probe's own words — and a duplicated *question* hands the live query a
// second candidate outside the neighbourhood being measured.
{
  const seen = new Map();
  for (const [list, name] of [[FILLER, 'FILLER'], [FILLER_LEAD, 'FILLER_LEAD']]) {
    list.forEach(([q, a], i) => {
      for (const [text, side] of [[q, 'question'], [a, 'answer']]) {
        const key = text.trim().toLowerCase();
        const prior = seen.get(key);
        if (prior) fail(`duplicate ${side}: ${name}[${i}] repeats ${prior} — "${text}"`);
        else seen.set(key, `${name}[${i}]`);
      }
    });
  }
}

// ── 2. No codeword and no restriction wording anywhere in the filler ─────────
//
// Both are hard: a filler pair carrying the codeword makes the buried fact reachable outside
// the burial, and one carrying the restriction's wording makes the marking reachable without
// the excerpt. Either turns a measured null into an artefact of the corpus.
const ALL_PAIRS = [
  ...FILLER.map((p, i) => ['FILLER', i, p]),
  ...FILLER_LEAD.map((p, i) => ['FILLER_LEAD', i, p]),
  ...FILLER_LONG.slice(FILLER.length).map((p, i) => ['FILLER_LONG(own)', i, p]),
];

/** The words a filler pair actually contributes, tokenized exactly as a query would be. */
const wordsOf = (text) => new Set(tokenizeRecallQuery(text).map((t) => t.toLowerCase()));

for (const [key, arm] of Object.entries(ARMS)) {
  if (arm.token) {
    for (const [list, i, [q, a]] of ALL_PAIRS) {
      const hay = `${q} ${a}`.toLowerCase();
      if (hay.includes(arm.token.toLowerCase())) {
        fail(`arm ${key}: codeword "${arm.token}" appears in ${list}[${i}]`);
      }
    }
  }
  // The restriction is the marking the arm measures. Its *distinctive* words — the ones a
  // query could land on — must not be reachable through filler.
  const marking = [arm.markUser, arm.markAck].filter(Boolean).join(' ');
  if (marking) {
    const markTokens = [...wordsOf(marking)];
    for (const [list, i, [q, a]] of ALL_PAIRS) {
      const pair = wordsOf(`${q} ${a}`);
      const shared = markTokens.filter((t) => pair.has(t));
      // A single shared ordinary word is noise ("the" is already a stopword; "that" is not).
      // Three or more is a pair drifting into the marking's register, which is the thing the
      // constraint is actually about.
      if (shared.length >= 3) {
        fail(`arm ${key}: ${list}[${i}] shares ${shared.length} terms with the restriction ` +
             `(${shared.join(', ')}) — "${q}"`);
      } else if (shared.length > 0 && VERBOSE) {
        notes.push(`arm ${key}: ${list}[${i}] shares ${shared.join(', ')} with the restriction`);
      }
    }
  }
}

// ── 3. No filler pair answers the arm's own ask, as the tool would run it ────
//
// Exact, and the exactness is the point. `recallFromOtherConversations` tokenizes, then hands
// the tokens to `search` (`recall.ts:427-430`), which ANDs them as **case-insensitive
// substring** `LIKE` clauses (`queries.ts:574-589`) — not word matches. So the condition below
// is `includes`, not set membership: a pair containing "recovery" is a hit for the token
// "cover", and a token-boundary check would report clean on a corpus the real search lands in.
// Mirroring the matcher rather than approximating it is the whole reason this file can claim
// anything.
for (const [key, arm] of Object.entries(ARMS)) {
  if (!arm.ask) continue;
  const askTokens = tokenizeRecallQuery(arm.ask).map((t) => t.toLowerCase());
  if (askTokens.length === 0) continue;
  for (const [list, i, [q, a]] of ALL_PAIRS) {
    const hay = `${q} ${a}`.toLowerCase();
    if (askTokens.every((t) => hay.includes(t))) {
      fail(`arm ${key}: ${list}[${i}] matches the arm's own ask on all ${askTokens.length} ` +
           `terms — "${q}"`);
    }
  }
}

// ── 4. Retry exposure — reported, never failed ───────────────────────────────
//
// "No term a narrowing retry would reach for" cannot be decided here: the retry is a query the
// live model composes. What *is* decidable is which filler pairs sit closest to the arm's
// vocabulary, which is what an author writing new pairs needs in front of them.
const exposure = [];
for (const [key, arm] of Object.entries(ARMS)) {
  const vocab = wordsOf([arm.ask, arm.seedUser, arm.markUser].filter(Boolean).join(' '));
  for (const [list, i, [q, a]] of ALL_PAIRS) {
    const shared = [...wordsOf(`${q} ${a}`)].filter((t) => vocab.has(t));
    if (shared.length > 0) exposure.push({ arm: key, list, i, shared, q });
  }
}
exposure.sort((x, y) => y.shared.length - x.shared.length);

// ── 5. Owner voice: every user turn is a question, and hands nothing over ────
//
// See the header block for why this now applies to the gap lists and not just `FILLER_LEAD`.
//
// Each entry is [pattern, label]. Word boundaries are deliberate and load-bearing in two
// places: `\bhanded\b` must not fire on "handle" or "shorthand", and the transfer-verb pattern
// must not fire on "restore test passed **on** both shards" — which is why its particle list
// carries `along` and `over` but **not** `on`. That false positive was found by running the
// draft against the live corpus, not by reading it.
//
// **Every pattern carries its own example, and that shape was forced by a control that
// failed.** The first version of this gate held one flat list of should-match sentences and
// asked whether *any* pattern fired. A doctored copy with the `here is` pattern blunted to
// nonsense still exited 0 and still printed "fixtures passed" — because its example, *"Here's
// the vendor list — can you keep it somewhere safe?"*, was independently caught by the
// hold-something pattern. A dead pattern was invisible to a gate written to notice exactly
// that. Per-pattern examples make a pattern impossible to add without an example and
// impossible to break without a red.
const HANDOVER_PATTERNS = [
  [/\bhere(?:'s|’s| is| are)\b/i,                                   'presenting ("here is …")',
   'Here is the freeze calendar for the quarter.'],
  [/\bhanded\b|\bhanding\b|\bhandover\b|\bhand(?:s|ed|ing)?\s+(?:it|this|that|these|those|them|you|over|off)\b/i,
                                                                    'handing over',
   'I am handing you the account details now.'],
  [/\b(?:send|sending|sent|pass|passing|passed|forward|forwarding|forwarded|share|sharing|shared|give|giving|gave|drop|dropping|dropped)\s+(?:you|it|this|that|these|those|them|along|over)\b/i,
                                                                    'transferring an item',
   'Passing this along before the freeze.'],
  [/\battach(?:ed|ing|ment)\b/i,                                    'attachment',
   'I attached the seat numbers.'],
  [/\btake\s+(?:this|these|it|that|those)\b|\bhold\s+on\s?to\b|\bkeep\s+(?:this|these|it|that)\b/i,
                                                                    'asking the other party to hold something',
   'Take this and hold onto it for the rest of the week.'],
  [/\bfor your (?:reference|records|files)\b|\bfyi\b/i,             'for-your-reference framing',
   'The current thresholds, for your reference.'],
  [/\bbelow (?:is|are)\b|\bas follows\b/i,                          'introducing content inline',
   'Below is the runbook diff.'],
  [/\bremember (?:this|that|it)\b|\b(?:make a note of|note (?:this|that|it) down|write (?:this|that|it) down)\b/i,
                                                                    'asking the other party to retain something',
   'Remember this: the fallback host is the old one.'],
  [/\blet me (?:give|send|share|pass|hand)\b/i,                     'announcing a transfer',
   'Let me give you the escalation contact.'],
];

const handoverHits = (text) =>
  HANDOVER_PATTERNS.filter(([re]) => re.test(text)).map(([, label]) => label);

// Sentences that must stay clear. Three of these are real corpus rows and are here because the
// draft patterns fired on them: "passed **on** both shards" is why the transfer-verb particle
// list has no `on`, and "handle"/"shorthand" are why `\bhanded\b` is bounded rather than a
// `hand` prefix. A false-positive guard built from actual false positives, not imagined ones.
const MUST_STAY_CLEAR = [
  'Who is on call for the cutover?',
  'Can you handle the rollout on Thursday?',
  'Yes — restore test passed on both shards.',
  'The autoscaler adds four workers around eight and drains them by ten.',
  'Did anyone pick up the docs backlog?',
  'Security signed it Friday. Nothing outstanding on our side.',
  'Is the shorthand in the changelog still accurate?',
];

// A recogniser is only worth its green if it can be shown to go red. This runs every
// invocation, before the corpus, and a failure here exits 2 rather than reporting on pairs.
{
  const fixtureFailures = [
    ...HANDOVER_PATTERNS
      .filter(([re, , example]) => !re.test(example))
      .map(([, label, example]) => `pattern "${label}" no longer matches its own example: "${example}"`),
    ...MUST_STAY_CLEAR.filter((s) => handoverHits(s).length > 0)
      .map((s) => `should have been clear but matched ${handoverHits(s).join(', ')}: "${s}"`),
  ];
  if (fixtureFailures.length) {
    console.log('handover recogniser FAILED its own fixtures — corpus result withheld:');
    for (const f of fixtureFailures) console.log(`  ✗ ${f}`);
    process.exit(2);
  }
}

for (const [list, i, [q, a]] of ALL_PAIRS) {
  if (!q.trimEnd().endsWith('?')) {
    fail(`${list}[${i}]: user turn is not interrogative — "${q}"`);
  }
  const inQuestion = handoverHits(q);
  if (inQuestion.length) {
    fail(`${list}[${i}]: user turn hands something over (${inQuestion.join('; ')}) — "${q}"`);
  }
  const inAnswer = handoverHits(a);
  if (inAnswer.length) {
    notes.push(`${list}[${i}]: assistant turn reads as a handover (${inAnswer.join('; ')}) — ` +
               `"${a}" — agent→owner, so not failed, but check it against the arm's referent clause`);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`corpora: FILLER ${FILLER.length}, FILLER_LONG ${FILLER_LONG.length} ` +
            `(${FILLER_LONG.length - FILLER.length} own), FILLER_LEAD ${FILLER_LEAD.length}`);
console.log(`arms:    ${Object.keys(ARMS).join(' ')}`);
console.log(`pairs checked: ${ALL_PAIRS.length}\n`);

const top = exposure.slice(0, VERBOSE ? exposure.length : 8);
if (top.length) {
  console.log(`shared-term exposure (highest first) — judgment, not failure:`);
  for (const e of top) {
    console.log(`  ${String(e.shared.length).padStart(2)}  arm ${e.arm}  ${e.list}[${e.i}]  ` +
                `${e.shared.join(', ')}`);
  }
  if (exposure.length > top.length) {
    console.log(`  … ${exposure.length - top.length} more, --verbose to see them`);
  }
  console.log('');
}
for (const n of notes) console.log(`note: ${n}`);

if (failures.length === 0) {
  console.log(`OK — ${ALL_PAIRS.length} pairs satisfy every mechanically checkable constraint,`);
  console.log(`including ${HANDOVER_PATTERNS.length} handover-voice patterns over ` +
              `${ALL_PAIRS.length} user turns (recogniser fixtures passed).`);
  console.log(`Register, and any handover phrased in words the recogniser does not list,`);
  console.log(`remain the author's.`);
  process.exit(0);
}
console.log(`\n${failures.length} constraint violation(s):`);
for (const f of failures) console.log(`  ✗ ${f}`);
process.exit(1);
