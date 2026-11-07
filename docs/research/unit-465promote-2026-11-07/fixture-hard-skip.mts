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
// `probeName` is REQUIRED by `SummariseInput`. The first drive of this fixture omitted it and
// published `INCONCLUSIVE — undefined established 2 of its checks`: the type system is the guard
// (tsx does not enforce it at runtime), and this directory is outside the typecheck scope, so
// nothing caught it here. No grade depended on it — P5a-P5e key on the exit code and the
// `did not run:` line — but the recording is re-taken with it set so the published output comes
// from one version of this file.
summariseAndExit({
  probeName: 'fixture-hard-skip',
  results,
  skipped: ['the race state could not be built in 3 attempts'],
});
