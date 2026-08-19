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
 * | "No term a *narrowing retry* would reach for" | **reported, not judged** |
 * | Same register; a question the owner asked | not checkable — human |
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
 * Usage:  node scripts/verify-filler-constraints.mjs [--verbose] [--probe=<path>]
 * Exit:   0 all constraints hold · 1 a hard constraint is violated
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
  console.log(`OK — ${ALL_PAIRS.length} pairs satisfy every mechanically checkable constraint.`);
  console.log(`Register and owner-voice are not checked here and remain the author's.`);
  process.exit(0);
}
console.log(`\n${failures.length} constraint violation(s):`);
for (const f of failures) console.log(`  ✗ ${f}`);
process.exit(1);
