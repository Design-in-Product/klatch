// unit-494lineendingreach — the emitter census, loaded with `--import` so it is in place before
// the gate's first publication.
//
// Why a runtime patch rather than a grep over the source: the registered question is how many log
// calls EXECUTE and how many ARGUMENTS each one passes. A static reader answers neither — call
// sites sit inside loops and conditionals, so the site count is an upper bound on one and says
// nothing about the other. This records the actual argument vectors, in order, as published.
//
// It publishes nothing of its own, so the gate's captured bytes are what the gate would have
// printed unpatched; the census lands in the file named by THESEUS_EMITTER_CENSUS.
import { writeFileSync } from 'node:fs';

const target = process.env.THESEUS_EMITTER_CENSUS;
if (!target) throw new Error('probe-emitter-census: THESEUS_EMITTER_CENSUS is unset');

const SENTINEL = '\u0000KP-SELFTEST';
const calls = [];
const original = console.log;
console.log = (...args) => {
  calls.push(args.map((a) => (typeof a === 'string' ? a : String(a))));
  // The self-test's own calls are censused and NOT published — otherwise the known positive would
  // write two lines into the capture the line-ending reader then grades, and the KP would
  // contaminate the measurement it exists to validate.
  if (typeof args[0] === 'string' && args[0].startsWith(SENTINEL)) return;
  original.apply(console, args);
};

// Known positive for the two tallies that are registered at zero, driven THROUGH the patched
// function rather than asserted about it. If either tally cannot rise here, a zero over the gate
// measures this census and not the gate.
console.log(`${SENTINEL}-MULTI`, 'second-argument');
console.log(`${SENTINEL}-EMBEDDED\nsecond-line`);

process.on('exit', () => {
  const isKp = (c) => typeof c[0] === 'string' && c[0].startsWith(SENTINEL);
  writeFileSync(target, JSON.stringify({
    selftest: calls.filter(isKp),
    calls: calls.filter((c) => !isKp(c)),
  }, null, 2));
});
