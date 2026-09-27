/**
 * Run the gate and quote it the one way that cannot mislabel a red run. See
 * `scripts/lib/gate-line.mts` for why this exists (Theseus, Round 274 §3).
 *
 *     npx tsx scripts/gate.mts            # typecheck, server, client
 *     npx tsx scripts/gate.mts server     # one stage
 *
 * Paste the `GATE …` lines into a memo or COORDINATION entry verbatim. They are the quotation;
 * the counts alone are not, because a red run prints the same counts.
 *
 * Exit code is the worst stage's, so this is also usable as a gate inside another script.
 */
import { renderGate, runGate } from './lib/gate-line.mts';

const STAGES: Record<string, [string, string[]]> = {
  // First because it is nearly free — a readdir and two array comparisons, no probe driven, no
  // port, no model. Added Round 283 (Daedalus, 2026-09-27) because `sweep-probes.mjs`'s census pin
  // had been red for ~26 hours with nothing anywhere driving it: not root `npm test`, not
  // `.github/workflows/ci.yml` (path-filtered to `packages/**`). Round 261 argued that pin's red
  // "is the sweep doing its job" and distinguished a gate from a fuse by what CLEARS the red. It
  // was one condition short: a gate nobody drives is a fuse with extra steps. This is the reading.
  //
  // The census only. Driving the swept probes is NOT free and stays out, per Round 281 §10.
  census: ['node', ['scripts/sweep-probes.mjs', '--census']],
  typecheck: ['npm', ['run', 'typecheck']],
  server: ['npm', ['run', 'test', '-w', 'packages/server']],
  client: ['npm', ['run', 'test', '-w', 'packages/client']],
};

const wanted = process.argv.slice(2);
const names = wanted.length > 0 ? wanted : Object.keys(STAGES);

let worst = 0;
for (const name of names) {
  const stage = STAGES[name];
  if (stage === undefined) {
    console.error(`gate: unknown stage ${name} — known: ${Object.keys(STAGES).join(', ')}`);
    process.exit(64);
  }
  const { status, line, text } = runGate(name, stage[0], stage[1]);
  console.log(line);
  // Theseus, Round 284 §C5, found by driving a real census red through this file rather than
  // reading it. `runGate` CAPTURES each stage's stdout/stderr, and until now nothing printed it —
  // so a red gate told the reader that something was wrong and nothing about what. A red census
  // rendered `GATE RED exit=1 census · files: (no Test Files line) · … · errors: 0` and swallowed
  // the `CENSUS RED — 1 probe(s) in neither list` line that names the file and says what to do; a
  // red suite swallows the failing test's name for the same reason. Round 274 bought a quotation
  // that cannot mislabel a red, and the unmeasured cost was that the quotation was the only thing
  // a seat saw. Printing it only on a non-zero status keeps the green run's output exactly as it
  // was, so the quotation the whole file exists for is unchanged; the `GATE ` lines stay greppable
  // with `grep '^GATE '` because nothing else in this file starts with that token.
  if (status !== 0) {
    console.log(`--- ${name} output (RED) — reproduce with: ${stage[0]} ${stage[1].join(' ')}`);
    console.log(text.trimEnd());
    console.log(`--- end ${name} output`);
  }
  // `status ?? 1`: a signal-killed stage reports `null`, and `null` must not read as "fine".
  if (status !== 0) worst = status ?? 1;
}

// Restating the whole run as one quotable line, under the same rule as each stage.
console.log(renderGate(`gate(${names.join('+')})`, worst, ''));
process.exit(worst);
