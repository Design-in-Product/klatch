#!/usr/bin/env node
/**
 * Can the marking be reached inside the *first* expand call, and can either cap shorten that
 * call? — the validity condition for Theseus's proposed distance arm.
 *
 * **Why this exists, 2026-08-20 (WORK).** Round 66 §4
 * (`docs/research/round66-fifth-filler-constraint-and-the-distance-arm-bound-2026-08-20.md`)
 * proposes an arm at `F=17, L=20, G=8` that puts the restriction **+15 rows past the offered
 * start**, past the +6…+10 read appetite four N1 runs showed. It flags, without resolving, that
 * at that size **both offers exceed `RECALL_MAX_EXPAND_ROWS`**, so reading one whole takes two
 * calls — *"a task difference from N1 and I'd pre-register it rather than discover it."*
 *
 * That flag hides a harder question, and it is the one that decides whether the arm measures
 * anything: **if a cap truncates the first expand call before row +15, then a run that misses
 * the marking has not shown an appetite miss — it has shown a cap.** The arm's headline result
 * and its most boring artefact would be indistinguishable, which is the Round 59 failure
 * ("a recogniser matching nothing agrees trivially") wearing a different hat.
 *
 * There are two caps on that path and they behave differently:
 *
 * | cap | value | applies | can it shorten call 1? |
 * |---|---|---|---|
 * | `RECALL_MAX_EXPAND_ROWS` | 30 | `all.slice(0, …)`, `recall.ts:748` | yes — to exactly 30 rows |
 * | `RECALL_MAX_CHARS` | 12,000 | `recall.ts:764` | **no** — see below |
 * | `CARRIED_CONTEXT_MAX_MESSAGE_CHARS` | 4,000 | per line, `recall.ts:807` | per-line only, never drops a row |
 *
 * The char cap's break is `if (used > 0 && used + block.length > RECALL_MAX_CHARS) break` — the
 * `used > 0` guard means the **first block is kept whatever its size**, and in a 1-1 with no
 * scope gaps `groupIntoExcerpts` returns the fetched rows as *one* contiguous block. So on this
 * arm's shape the char cap cannot drop a row. That is load-bearing and, until 2026-08-20,
 * `RECALL_MAX_CHARS` was referenced nowhere outside its own module — no test, no probe, no
 * recogniser. `round56-recall-expand.test.ts` item 8 now pins it, and was run as a negative
 * control (guard blunted to `used + block.length > …`: both new tests red, the other 19 green,
 * so nothing else in the suite was covering it). This script states the arithmetic that makes
 * the behaviour matter.
 *
 * **Independent of `scripts/geometry-distance-arm.mjs`, deliberately.** Theseus's script derives
 * the *offset* and its eviction bound. This one starts from the same seeding loop, re-derives
 * the row algebra from scratch (below), cross-checks the two derivations against each other, and
 * then answers the question his does not ask: given the offset, is the marking inside call 1.
 * Two derivations that agree are worth more than one that is read twice — Round 53's lesson,
 * and the reason his script asserts against M and N1 rather than reporting.
 *
 * **The row algebra, re-derived from `probe-recall-tool.mjs`'s `evictedMarking` branch**
 * (`:1218-1240`), reading the `put()` order and nothing else:
 *
 * ```
 *   1 … 2L            lead pairs        (FILLER_LEAD × L)
 *   2L+1, 2L+2        seedUser, seedAck (the handover — the search match)
 *   2L+3 … 2L+2G+2    gap pairs         (filler.slice(0, G))
 *   2L+2G+3           markUser          ← the restriction
 *   2L+2G+4           markAck
 *   2L+2G+5 … 2L+2F+4 remaining filler  (filler.slice(G))
 *   2L+2F+5, 2L+2F+6  restateUser, restateAck
 *
 *   total        = 2L + 2F + 6
 *   excerpt      = 2L-1 … 2L+3          (match at 2L+1, RADIUS 2)
 *   offeredStart = 2L + 4               (from: last.ordinal + 1)
 *   markOffset   = (2L+2G+3) - (2L+4)   = 2G - 1      ← independent of L and F
 *   leading      = 2L - 2               trailing = 2F + 3
 *   eviction     ⇒ 2L+2G+4 ≤ total - WINDOW ⇒ G ≤ F - 9
 * ```
 *
 * `markOffset = 2G − 1` is the whole reason the cheap arm is dead: on `FILLER` (F=12) eviction
 * caps G at 3, so the offset caps at +5, and +5 is *below* the observed appetite floor of +6.
 * Confirmed here against M's and N1's measured ordinals rather than asserted.
 *
 * **What this does not do.** It does not license the arm. It answers one validity question and
 * reports two task differences from N1 in numbers rather than in adjectives. Zero API calls,
 * zero live runs, no server started, nothing under `packages/` imported except three constants
 * and one formatter.
 *
 * Usage:  npx tsx scripts/verify-expand-reachability.mjs [--verbose]
 * Exit:   0 all checks pass · 1 a derivation disagrees with a measured arm
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROBE = path.join(__dirname, 'probe-recall-tool.mjs');
const VERBOSE = process.argv.includes('--verbose');

// Same precaution as `verify-filler-constraints.mjs`: `recall.ts` reaches the db module
// transitively and that module binds its path at load time. Nothing here opens a connection,
// but a default that resolves to the real `klatch.db` is not a default worth relying on.
process.env.KLATCH_DB = path.join(__dirname, '..', '.testdata', 'verify-expand-reachability.db');
const { RECALL_MAX_EXPAND_ROWS, RECALL_MAX_CHARS, RECALL_NEIGHBOUR_RADIUS } = await import(
  '../packages/server/src/claude/recall.ts'
);
const {
  formatTranscriptLine,
  CARRIED_CONTEXT_MAX_MESSAGE_CHARS,
  CARRIED_CONTEXT_MAX_MESSAGES,
} = await import('../packages/server/src/claude/carried-context.ts');

const src = fs.readFileSync(PROBE, 'utf8');

/** Pull `const NAME = <literal>;` out of the probe and evaluate it in the given scope. */
function literal(name, open, close, scope = {}) {
  const start = src.indexOf(`const ${name} = ${open}`);
  if (start === -1) throw new Error(`${name} not found in ${PROBE} — did it get renamed?`);
  const from = start + `const ${name} = `.length;
  const end = src.indexOf(`\n${close};`, from);
  if (end === -1) throw new Error(`${name} has no closing "${close};" at column 0`);
  return new Function(
    ...Object.keys(scope),
    `return ${src.slice(from, end + 1 + close.length)}`,
  )(...Object.values(scope));
}

const FILLER = literal('FILLER', '[', ']');
const FILLER_LONG = literal('FILLER_LONG', '[', ']', { FILLER });
const FILLER_LEAD = literal('FILLER_LEAD', '[', ']');
const ARMS = literal('ARMS', '{', '}');
// Taken from the modules the probe itself imports them from (`RADIUS = RECALL_NEIGHBOUR_RADIUS`
// at `probe-recall-tool.mjs:162`; `WINDOW = 20 // CARRIED_CONTEXT_MAX_MESSAGES` at `:159`),
// rather than regexed out of the probe. A regex over a literal is a hand-copied constant with
// extra steps — the `REACHABLE_R54` failure shape this project has already paid for once.
const WINDOW = CARRIED_CONTEXT_MAX_MESSAGES;
const RADIUS = RECALL_NEIGHBOUR_RADIUS;
// The probe hard-codes its own WINDOW; if that copy ever drifts from the server's, every
// eviction margin computed here would be right about the wrong number.
if (Number(/const WINDOW = (\d+)/.exec(src)?.[1]) !== WINDOW) {
  throw new Error(
    `the probe's WINDOW literal disagrees with CARRIED_CONTEXT_MAX_MESSAGES (${WINDOW}) — ` +
    `eviction margins below would be computed against the wrong window`,
  );
}

const failures = [];
const fail = (m) => failures.push(m);

/** The geometry of an `evictedMarking` arm, from the algebra in the docblock above. */
function geometry({ F, L, G }) {
  const total = 2 * L + 2 * F + 6;
  return {
    F, L, G, total,
    seedRow: 2 * L + 1,
    excerpt: [2 * L + 1 - RADIUS, 2 * L + 1 + RADIUS],
    offeredStart: 2 * L + 4,
    markRow: 2 * L + 2 * G + 3,
    markAckRow: 2 * L + 2 * G + 4,
    markOffset: 2 * G - 1,
    leading: 2 * L - 2,
    trailing: 2 * F + 3,
    // Eviction margin in rows, in the probe's own sense: how far the marking's *ack* sits
    // above the carried window's first row (`total - WINDOW + 1`). 1 means one more row
    // anywhere before it and the marking rides into the prompt, which voids the arm.
    //
    // Reduces to the probe's `margin = 2P - 17` (arm F's docblock, `:622`; N1's, `:772`),
    // where P = F - G is the remaining filler: (2L+2F+6) - WINDOW + 1 - (2L+2G+4) = 2(F-G) - 17
    // at WINDOW=20. Requiring margin ≥ 1 gives F - G ≥ 9, i.e. **G ≤ F - 9** — Round 66 §4's
    // bound, reached here from the row order rather than from that memo.
    evictionMargin: total - WINDOW + 1 - (2 * L + 2 * G + 4),
  };
}

// ── 1. The algebra must reproduce the two arms that have measured ordinals ───
//
// M and N1 both ran live and both published their offers. If this derivation cannot produce
// those numbers it is not a derivation of this probe, and nothing below it means anything.
const MEASURED = [
  // Round 62, live ×5. `docs/research/round62-*.md` — offers 1-6 and 12-38 on a 38-row channel.
  // `evictionMargin` is the probe's own published figure for the arm (`:622`), not mine.
  { key: 'M',  F: 12, L: 4,  G: 1, total: 38, offeredStart: 12, leading: 6,  trailing: 27, evictionMargin: 5 },
  // Round 63, live ×5. Offers 1-28 and 34-60 on a 60-row channel; every first expand at 34.
  { key: 'N1', F: 12, L: 15, G: 1, total: 60, offeredStart: 34, leading: 28, trailing: 27, evictionMargin: 5 },
];

for (const m of MEASURED) {
  const arm = ARMS[m.key];
  if (!arm) fail(`arm ${m.key} is gone from the probe — this fixture is stale, not passing`);
  else {
    // Read the arm's own fields rather than trusting the fixture's copy of them.
    const L = arm.leadPairs || 0;
    const G = arm.gapPairs || 0;
    const F = (arm.fillerOverride === 'long' ? FILLER_LONG : FILLER).length;
    if (L !== m.L || G !== m.G || F !== m.F) {
      fail(`arm ${m.key} moved: probe says F=${F} L=${L} G=${G}, fixture says F=${m.F} L=${m.L} G=${m.G}`);
    }
  }
  const g = geometry(m);
  for (const field of ['total', 'offeredStart', 'leading', 'trailing', 'evictionMargin']) {
    if (g[field] !== m[field]) {
      fail(`arm ${m.key}: derived ${field} ${g[field]}, measured ${m[field]}`);
    }
  }
}

// ── 2. Reachability: is the marking inside the first expand call? ────────────
//
// The trailing offer starts at `offeredStart`; call 1 returns `RECALL_MAX_EXPAND_ROWS` rows
// from there, i.e. offsets 0 … cap-1. A marking at `markOffset` is in call 1 iff
// `markOffset < cap`. This is the check the arm's validity turns on: a marking *outside* call 1
// makes "missed" and "never rendered" the same observation.
const APPETITE = { floor: 6, ceiling: 10 }; // four N1 runs: +10, +7, +7, +6 (N1L5 read whole)

/** Rows of the trailing offer, in order, as `[role, content]` — exact, no extrapolation. */
function trailingRows(g, filler, arm) {
  const rows = [];
  const pairs = filler;
  // The offered start is the *answer* of gap pair 1; its question is the excerpt's last row.
  rows.push(['assistant', pairs[0][1]]);
  for (let i = 1; i < g.G; i++) { rows.push(['user', pairs[i][0]], ['assistant', pairs[i][1]]); }
  rows.push(['user', arm.markUser], ['assistant', arm.markAck]);
  for (let i = g.G; i < pairs.length; i++) { rows.push(['user', pairs[i][0]], ['assistant', pairs[i][1]]); }
  rows.push(['user', arm.restateUser], ['assistant', arm.restateAck]);
  return rows;
}

/** What `renderExcerpt` would put on the page for these rows, in characters. */
function renderedChars(rows) {
  let chars = 0;
  let truncated = 0;
  for (const [role, content] of rows) {
    const line = formatTranscriptLine(
      { role, content, channelName: 'vesper-1-1', originalTimestamp: '2026-08-20T00:00:00Z' },
      'Vesper',
      CARRIED_CONTEXT_MAX_MESSAGE_CHARS,
    );
    if (content.length > CARRIED_CONTEXT_MAX_MESSAGE_CHARS) truncated++;
    chars += line.length + 2; // lines join on a blank line
  }
  return { chars, truncated };
}

const CANDIDATES = [
  { name: 'N1  (ran live ×5, Round 63)', F: 12, L: 15, G: 1,  filler: FILLER,      arm: ARMS.N1 },
  { name: 'distance arm (Round 66 §4)',  F: 17, L: 20, G: 8,  filler: FILLER_LONG, arm: ARMS.N1 },
];

const report = [];
for (const c of CANDIDATES) {
  const g = geometry(c);
  const rows = trailingRows(g, c.filler, c.arm);
  const call1 = rows.slice(0, RECALL_MAX_EXPAND_ROWS);
  const { chars, truncated } = renderedChars(call1);
  const inCall1 = g.markOffset < RECALL_MAX_EXPAND_ROWS;
  const callsToReadWhole = Math.ceil(g.trailing / RECALL_MAX_EXPAND_ROWS);
  const missable = g.markOffset > APPETITE.ceiling;
  report.push({ ...c, g, chars, truncated, inCall1, callsToReadWhole, missable, rows: rows.length });

  if (g.markOffset >= 0 && !inCall1) {
    fail(
      `${c.name}: marking at +${g.markOffset} is past the ${RECALL_MAX_EXPAND_ROWS}-row cap — ` +
      `a miss and a truncation are the same observation, and the arm cannot separate them`,
    );
  }
  // The char cap must not be able to shorten call 1. This is an assertion about `recall.ts`'s
  // `used > 0` guard, checked here as arithmetic and pinned as behaviour in round56's suite.
  if (chars > RECALL_MAX_CHARS) {
    // Not a failure — the guard keeps the block whole — but it is exactly the condition under
    // which a future edit to that guard would silently shorten the arm's first call.
    report[report.length - 1].overChars = true;
  }
  if (g.evictionMargin < 1) {
    fail(`${c.name}: eviction margin ${g.evictionMargin} — the marking is inside the carried window`);
  }
}

// ── Output ──────────────────────────────────────────────────────────────────
console.log(
  `caps: ${RECALL_MAX_EXPAND_ROWS} rows/call · ${RECALL_MAX_CHARS} chars/call · ` +
  `${CARRIED_CONTEXT_MAX_MESSAGE_CHARS} chars/line · window ${WINDOW} · radius ${RADIUS}`,
);
console.log(`appetite from N1's four measured reads: +${APPETITE.floor}…+${APPETITE.ceiling}\n`);

console.log('arm                          rows  offer  mark  in call1?  calls  call1 chars  trunc  missable');
for (const r of report) {
  console.log(
    `${r.name.padEnd(28)}  ${String(r.g.total).padStart(3)}  ` +
    `${String(r.g.trailing).padStart(5)}  ${('+' + r.g.markOffset).padStart(4)}  ` +
    `${(r.inCall1 ? 'yes' : 'NO').padStart(9)}  ${String(r.callsToReadWhole).padStart(5)}  ` +
    `${String(r.chars).padStart(11)}${r.overChars ? '*' : ' '}  ${String(r.truncated).padStart(5)}  ` +
    `${r.missable ? 'yes' : 'no'}`,
  );
}

console.log(`
Reading of the two columns that are task differences from N1:
  · "calls" — how many expand calls it takes to read the trailing offer whole. N1L5 did exactly
    that (34-60, 27 rows, one call). On the distance arm the same behaviour costs two calls, so
    "read it whole" and "read the first 30" are no longer the same act.
  · "call1 chars" — what the first call puts on the page, against a ${RECALL_MAX_CHARS}-char cap.
    A '*' would mean it exceeds that cap and survives only because recall.ts:764 keeps the first
    block whole regardless (\`used > 0 &&\`). No candidate carries one: FILLER_LONG is a longer
    *list*, not longer *rows* (\`[...FILLER, 5 more]\`), so the distance arm reads at N1's texture
    and the extra pairs buy eviction headroom rather than page weight. The cap is 4x clear either
    way, and "trunc" 0 says no line met the ${CARRIED_CONTEXT_MAX_MESSAGE_CHARS}-char per-line cut either.`);

if (VERBOSE) {
  for (const r of report) {
    console.log(`\n${r.name}`);
    console.log(`  total ${r.g.total} · seed ${r.g.seedRow} · excerpt ${r.g.excerpt[0]}-${r.g.excerpt[1]}` +
      ` · offered start ${r.g.offeredStart} · marking ${r.g.markRow}/${r.g.markAckRow}`);
    console.log(`  offers: leading ${r.g.leading} × trailing ${r.g.trailing}` +
      ` · eviction margin ${r.g.evictionMargin} row(s)`);
  }
}

if (failures.length) {
  console.log(`\nFAILED — ${failures.length}`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exit(1);
}

console.log(`
OK — the algebra reproduces M and N1 exactly, and on both candidates the marking lands inside
the first expand call, so a miss is an appetite miss and not a cap artefact.
Nothing here licenses a build.`);
