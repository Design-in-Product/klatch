/**
 * unit-465promote — P5 fixture.
 *
 * The smallest thing that answers "does the cure need new machinery?": a run with some checks
 * established and one arm HARD-skipped, through the product's own `summariseAndExit`.
 *
 * Deliberately **outside `scripts/`**. The census at `sweep-probes.mjs` walks `scripts/` and is
 * built to go red the moment an unclassified `probe-*` file arrives there — so a fixture named
 * `probe-…` in that directory would redden the gate my own unit is reasoning about. Named
 * `fixture-` and placed here for the same reason.
 */
import { summariseAndExit, type ProbeVerdict } from '../../../scripts/lib/probe-outcome.mts';

const results: ProbeVerdict[] = [
  { arm: 'A', check: 'a check that really did establish', pass: true },
  { arm: 'B', check: 'a second one', pass: true },
];

// A bare string is a HARD skip — the shape arm E's lost race wants.
summariseAndExit({
  results,
  skipped: ['the race state could not be built in 3 attempts'],
});
