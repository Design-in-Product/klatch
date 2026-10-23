// Fixture for Round 439 G2's confusion matrix. Prints a FAILING GATE line with a named red leg.
// The classifier must call this RED, not UNGRADEABLE: a file that reports a real failure and a
// file that cannot report at all are different findings, and the old key collapsed them.
console.log('GATE: false   (1 leg(s))   RED: X1');
