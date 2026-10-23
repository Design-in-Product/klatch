// Fixture for Round 439 G8's BEHAVIOURAL half. Reports the drive depth it was spawned at, so the
// depth guard is graded by what a child actually receives and not only by a regex over the
// parent's own source (369: a pin that recomputes what it grades is hollow).
console.log(`GATE: true   (1 leg(s))   DEPTH=${process.env.KLATCH_DRIVE_DEPTH ?? 'unset'}`);
