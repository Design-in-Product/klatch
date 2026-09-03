/**
 * Round 143 probe — what does raising FINGERPRINT_LINE_CAP actually cost?
 *
 * Daedalus, 2026-09-03 WORK fire. Theseus closed his Round 142 memo
 * (`theseus-to-daedalus-iris-cc-calliope-argus-xian-turncount-is-on-the-wire-and-your-cap-item-is-real-2026-09-03.md`)
 * with an item he explicitly left on this seat:
 *
 *   "What I didn't do: measure the scan-latency cost of raising the cap — it's
 *    the load-bearing unknown for the cap recommendation and it belongs to
 *    whoever owns the scanner."
 *
 * He measured the BENEFIT side and found it superlinear: capped sessions have a
 * front-loaded density gradient (up to 56.0 evt/turn before line 1500, 15.2
 * after), so the turns a size hint wants are mostly PAST the cut. His argument
 * is that raising the cap buys disproportionately many turns. That's only half a
 * decision. This probe measures the other half against the real local corpus.
 *
 * What is actually being measured, and why this shape:
 *
 * The browse scan is SEQUENTIAL. `scanClaudeSessions` awaits
 * `extractSessionFingerprint` one file at a time inside a nested for loop
 * (session-scanner.ts:271). So the number a user waits on is not per-file cost,
 * it's per-file cost x corpus size. A cap change that looks free on one file is
 * multiplied by ~500 here. That multiplication is the whole reason the cost side
 * needed measuring rather than eyeballing.
 *
 * Method:
 *  - Warm the OS page cache with a full read pass BEFORE timing anything.
 *    Otherwise cap 1500 pays cold-cache I/O and every later cap reads from RAM,
 *    which would understate the cost of raising the cap — biased in the exact
 *    direction that flatters the conclusion I'd like to reach.
 *  - Time the SHIPPED function (`extractSessionFingerprint`, cap now an optional
 *    arg) rather than a reimplementation, so this can't drift from the product.
 *  - 3 repeats per cap, report median, so a single scheduler hiccup doesn't set
 *    the number.
 *  - Report turns gained alongside cost, so the trade is visible in one table.
 *
 * Run:  npx tsx scripts/probe-scan-latency-vs-cap.mts
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { extractSessionFingerprint } from '../packages/server/src/import/session-scanner.js';

const CAPS = [1500, 3000, 5000, 10000, 25000, Infinity];
const REPEATS = 3;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function collectCorpus(): string[] {
  const root = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    let files: fs.Dirent[];
    try { files = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const f of files) {
      if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
      const p = path.join(dir, f.name);
      try {
        // Mirror the scanner's own skip rule so the population matches browse.
        if (fs.statSync(p).size < 100) continue;
      } catch { continue; }
      out.push(p);
    }
  }
  return out;
}

async function scanAll(files: string[], cap: number) {
  const t0 = performance.now();
  let turns = 0;
  let events = 0;
  let cappedCount = 0;
  const perFile: number[] = [];
  for (const f of files) {
    const s = performance.now();
    const fp = await extractSessionFingerprint(f, cap);
    perFile.push(performance.now() - s);
    turns += fp.turnCount;
    events += fp.messageCount;
    if (fp.capped) cappedCount++;
  }
  return { totalMs: performance.now() - t0, turns, events, cappedCount, perFile };
}

async function main() {
  const files = collectCorpus();
  if (files.length === 0) {
    console.error('No sessions found under ~/.claude/projects — nothing to measure.');
    process.exit(1);
  }
  const totalBytes = files.reduce((a, f) => a + fs.statSync(f).size, 0);
  console.log(`corpus: ${files.length} sessions, ${(totalBytes / 1e6).toFixed(1)} MB total\n`);

  // Warm the page cache. Not timed, and deliberately reads every byte so that
  // the uncapped arm is not the only one paying disk.
  process.stdout.write('warming page cache (untimed full read pass)... ');
  let warmBytes = 0;
  for (const f of files) warmBytes += fs.readFileSync(f).length;
  console.log(`${(warmBytes / 1e6).toFixed(1)} MB read\n`);

  const rows: Array<{ cap: number; ms: number; turns: number; events: number; capped: number; worst: number }> = [];

  for (const cap of CAPS) {
    const runs: Awaited<ReturnType<typeof scanAll>>[] = [];
    for (let i = 0; i < REPEATS; i++) runs.push(await scanAll(files, cap));
    const ms = median(runs.map((r) => r.totalMs));
    const last = runs[runs.length - 1];
    const worst = Math.max(...last.perFile);
    rows.push({ cap, ms, turns: last.turns, events: last.events, capped: last.cappedCount, worst });
    console.log(
      `cap ${String(cap).padStart(8)}  full-scan ${ms.toFixed(0).padStart(7)} ms  ` +
      `turns ${String(last.turns).padStart(6)}  events ${String(last.events).padStart(7)}  ` +
      `capped ${String(last.cappedCount).padStart(3)}/${files.length}  worst-file ${worst.toFixed(1)} ms`
    );
  }

  const base = rows[0];
  const full = rows[rows.length - 1];
  console.log('\n--- trade, relative to the shipped cap of 1500 ---');
  for (const r of rows.slice(1)) {
    const costX = r.ms / base.ms;
    const turnGain = (r.turns - base.turns) / base.turns;
    console.log(
      `cap ${String(r.cap).padStart(8)}  ` +
      `+${(r.ms - base.ms).toFixed(0)} ms (${costX.toFixed(2)}x)  ` +
      `turns +${(turnGain * 100).toFixed(1)}%  ` +
      `(${(r.turns / full.turns * 100).toFixed(1)}% of true total)`
    );
  }
  console.log(
    `\ntrue totals (uncapped): ${full.turns} turns, ${full.events} events.  ` +
    `Shipped cap sees ${(base.turns / full.turns * 100).toFixed(1)}% of turns, ` +
    `${(base.events / full.events * 100).toFixed(1)}% of events.`
  );
  console.log(
    `\nNOTE: scan is sequential (session-scanner.ts:271), so these are per-browse ` +
    `wall-clock totals for a ${files.length}-session corpus, warm cache.`
  );

  // Warm-cache timings are the optimistic arm: they charge CPU but not disk.
  // The pessimistic arm is a cold cache (first browse after boot), where cost is
  // dominated by bytes pulled off disk. I can't drop the page cache without
  // sudo, so measure the input to that cost instead of guessing it: how many
  // bytes each cap actually consumes.
  console.log('\n--- bytes read per cap (cold-cache proxy) ---');
  for (const cap of CAPS) {
    let bytes = 0;
    for (const f of files) {
      if (cap === Infinity) { bytes += fs.statSync(f).size; continue; }
      const buf = fs.readFileSync(f);
      let lines = 0, i = 0;
      for (; i < buf.length; i++) {
        if (buf[i] === 0x0a) { lines++; if (lines > cap) break; }
      }
      bytes += i;
    }
    console.log(
      `cap ${String(cap).padStart(8)}  ${(bytes / 1e6).toFixed(1).padStart(6)} MB  ` +
      `(${(bytes / totalBytes * 100).toFixed(1)}% of corpus)`
    );
  }

  // The cap is only one of the two levers on browse latency, and it's the one
  // that costs accuracy. The other is the sequential await at
  // session-scanner.ts:271, which costs nothing but a rewrite. If uncapped +
  // concurrent beats capped + sequential, the trade this probe was asked to
  // price doesn't have to be made at all. Measured, not assumed.
  console.log('\n--- concurrency arm: does parallelism dissolve the trade? ---');
  async function scanPooled(cap: number, width: number) {
    const t0 = performance.now();
    let next = 0;
    let turns = 0;
    const worker = async () => {
      for (;;) {
        const i = next++;
        if (i >= files.length) return;
        const fp = await extractSessionFingerprint(files[i], cap);
        turns += fp.turnCount;
      }
    };
    await Promise.all(Array.from({ length: width }, worker));
    return { ms: performance.now() - t0, turns };
  }
  for (const [cap, width] of [[1500, 1], [1500, 8], [Infinity, 8], [Infinity, 16]] as Array<[number, number]>) {
    const runs = [];
    for (let i = 0; i < REPEATS; i++) runs.push(await scanPooled(cap, width));
    const ms = median(runs.map((r) => r.ms));
    console.log(
      `cap ${String(cap).padStart(8)}  concurrency ${String(width).padStart(2)}  ` +
      `${ms.toFixed(0).padStart(6)} ms  turns ${runs[0].turns}  ` +
      `(${(ms / base.ms).toFixed(2)}x vs shipped)`
    );
  }
}

main();
