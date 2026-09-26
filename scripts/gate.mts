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
  const { status, line } = runGate(name, stage[0], stage[1]);
  console.log(line);
  // `status ?? 1`: a signal-killed stage reports `null`, and `null` must not read as "fine".
  if (status !== 0) worst = status ?? 1;
}

// Restating the whole run as one quotable line, under the same rule as each stage.
console.log(renderGate(`gate(${names.join('+')})`, worst, ''));
process.exit(worst);
