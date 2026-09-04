/**
 * Round 145 — does hoisting the dedup lookup out of the browse loop actually
 * flatten the curve Theseus measured?
 *
 * Theseus's arm P (`docs/browse-latency-end-to-end-2026-09-03.md`) measured the
 * per-call `findChannelByOriginalSessionId` at 508 lookups:
 *
 *     0 channels → 11 ms · 100 → 19 ms · 500 → 56 ms · 2000 → 201 ms
 *
 * That is O(files × channels): each call falls back to an unindexed
 * `json_extract` scan with a JSON parse per row. This probe re-runs his arm
 * against BOTH the per-call function and the new
 * `createChannelBySessionIdResolver()`, on the same scratch DB, same lookup
 * count, same seeding — so the two columns are directly comparable and his
 * numbers are the control.
 *
 * The claim under test is not "faster" (any batching is faster). It is that the
 * resolver's cost stops depending on channel count in the way the per-call one
 * does — the per-call column should grow ~superlinearly in K while the resolver
 * column grows only with the single build scan.
 *
 * Writes nothing outside `.testdata/`. Never opens the repo's klatch.db.
 *
 *   npx tsx scripts/probe-dedup-resolver-scaling.mts
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const REPO = path.resolve(import.meta.dirname, '..');
const DB = path.join(REPO, '.testdata', 'probe-dedup-resolver.db');
const LOOKUPS = 508; // Theseus's corpus size, so the columns line up with arm P
const REPEATS = 5;   // median of 5 — these are small numbers and jittery
const CHANNEL_COUNTS = [0, 100, 500, 2000];

const ms = (n: number) => `${n.toFixed(1)} ms`;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// ── Scratch DB ───────────────────────────────────────────────────────────────

fs.mkdirSync(path.dirname(DB), { recursive: true });
if (fs.existsSync(DB)) fs.rmSync(DB);
process.env.KLATCH_DB = DB;

const { getDb } = await import(path.join(REPO, 'packages/server/src/db/index.ts'));
const { findChannelByOriginalSessionId, createChannelBySessionIdResolver } =
  await import(path.join(REPO, 'packages/server/src/db/queries.ts'));

const db = getDb();
if (!DB.includes('.testdata')) {
  console.error('refusing to run against a non-scratch DB');
  process.exit(1);
}

// The ids we look up. Synthetic and non-matching, so every per-call lookup runs
// the full scan — the worst case, and the common case for a user browsing
// sessions they have not imported. (A matching id would short-circuit on the
// primary-key pass and hide the cost entirely.)
const lookupIds = Array.from({ length: LOOKUPS }, (_, i) => `browsed-session-${i}`);

const seed = db.prepare(
  "INSERT INTO channels (id, name, system_prompt, model, mode, type, created_at, source, source_metadata) VALUES (?, ?, '', 'claude-opus-5', 'chat', 'chat', ?, 'claude-code', ?)",
);

const baseline = (db.prepare('SELECT COUNT(*) c FROM channels').get() as any).c as number;
let seeded = baseline;

console.log(`\nRound 145 — dedup lookup scaling, ${LOOKUPS} lookups, median of ${REPEATS}`);
console.log(`node ${process.version} · ${os.cpus()[0]?.model ?? 'unknown cpu'}\n`);
console.log('| channels | per-call | resolver (build + lookups) | speedup |');
console.log('|---|---|---|---|');

const results: Array<{ k: number; perCall: number; resolver: number; build: number }> = [];

for (const K of CHANNEL_COUNTS) {
  const want = K - (seeded - baseline);
  if (want > 0) {
    db.transaction((n: number) => {
      for (let i = 0; i < n; i++) {
        seed.run(`probe-seed-${seeded + i}`, `probe seed ${seeded + i}`,
          new Date().toISOString(),
          JSON.stringify({ originalSessionId: `no-such-session-${seeded + i}` }));
      }
    })(want);
    seeded += want;
  }

  const perCallRuns: number[] = [];
  const resolverRuns: number[] = [];
  const buildRuns: number[] = [];

  for (let r = 0; r < REPEATS; r++) {
    let t0 = performance.now();
    for (const id of lookupIds) findChannelByOriginalSessionId(id);
    perCallRuns.push(performance.now() - t0);

    t0 = performance.now();
    const resolve = createChannelBySessionIdResolver();
    const built = performance.now() - t0;
    for (const id of lookupIds) resolve(id);
    resolverRuns.push(performance.now() - t0);
    buildRuns.push(built);
  }

  const perCall = median(perCallRuns);
  const resolver = median(resolverRuns);
  const build = median(buildRuns);
  results.push({ k: K, perCall, resolver, build });

  console.log(`| ${K} | ${ms(perCall)} | ${ms(resolver)} (${ms(build)} build) | ${(perCall / resolver).toFixed(1)}x |`);
}

// ── Correctness cross-check: same answers, not just faster ───────────────────
//
// A performance probe that silently changed behaviour would be worse than no
// probe. Seed some ids that DO match and confirm both paths agree on all 508.

const matching = lookupIds.slice(0, 50);
db.transaction(() => {
  matching.forEach((sid, i) => {
    seed.run(`real-${i}`, `real ${i}`, new Date().toISOString(),
      JSON.stringify({ originalSessionId: sid }));
  });
})();

const resolve = createChannelBySessionIdResolver();
let mismatches = 0;
let hits = 0;
for (const id of lookupIds) {
  const a = findChannelByOriginalSessionId(id)?.id;
  const b = resolve(id)?.id;
  if (a !== b) mismatches++;
  if (a) hits++;
}

console.log(`\nCorrectness: ${lookupIds.length} ids, ${hits} hits, ${mismatches} mismatches ` +
  `(${mismatches === 0 ? 'PASS' : 'FAIL'})`);

// ── Read of the shape ────────────────────────────────────────────────────────

const first = results[0];
const last = results[results.length - 1];
const perLookup = (t: number) => `${(t / LOOKUPS * 1000).toFixed(0)} µs`;

// Deliberately NOT reported as a growth ratio for the resolver: its 0-channel
// reading is ~0.02 ms, so any ratio off that base is an artifact of dividing by
// noise, not a finding. Absolute cost and per-lookup cost are the honest units.
console.log(`\nPer-call: ${ms(first.perCall)} → ${ms(last.perCall)} across ${first.k}–${last.k} channels ` +
  `(${perLookup(first.perCall)} → ${perLookup(last.perCall)} per lookup). Cost is O(files × channels).`);
console.log(`Resolver: ${ms(first.resolver)} → ${ms(last.resolver)} over the same range, ` +
  `essentially all of it the single build scan (${ms(first.build)} → ${ms(last.build)}). ` +
  `Cost is O(files + channels) — it still grows with the corpus, once, not per file.`);
console.log(`At ${last.k} channels the browse scan's dedup line goes ${ms(last.perCall)} → ${ms(last.resolver)}.`);
console.log(`\nScratch DB: ${path.relative(REPO, DB)} (${(db.prepare('SELECT COUNT(*) c FROM channels').get() as any).c} channels). ` +
  `Repo klatch.db never opened.\n`);

process.exit(mismatches === 0 ? 0 : 1);
