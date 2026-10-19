/**
 * Round 417 control — is the `AVAILABLE_MODELS` membership leg in round39's new
 * "floored pending verification" test load-bearing, or decoration?
 *
 * `fallbackEffortLevels` returns the three-level floor for ANY string, so the
 * ladder assertion alone cannot tell a recognised-but-unverified model from a
 * typo. If the membership leg is the only leg that separates the two, the
 * control is real. Driven, not reasoned about.
 */
import { AVAILABLE_MODELS, fallbackEffortLevels, buildFallbackModels } from '../../../packages/shared/src/types.js';

const FLOOR = JSON.stringify(['low', 'medium', 'high']);
const floorsAt3 = (id: string) => JSON.stringify(fallbackEffortLevels(id)) === FLOOR;
const real = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'];
const typos = ['claude-opus-55', 'claude-opus-5-5-', 'claude-sonnet-5.5', 'claude-haiku-5-5-20260101'];

console.log('--- REAL ids (expect inOverlay=true, floorsAt3=true) ---');
for (const id of real) console.log(id, '| inOverlay:', id in AVAILABLE_MODELS, '| floorsAt3:', floorsAt3(id));

console.log('--- TYPO ids (CONTROL: expect inOverlay=FALSE, floorsAt3=true) ---');
for (const id of typos) console.log(id, '| inOverlay:', id in AVAILABLE_MODELS, '| floorsAt3:', floorsAt3(id));

const ladderSeparates = real.every(floorsAt3) !== typos.every(floorsAt3);
const membershipSeparates =
  real.every((i) => i in AVAILABLE_MODELS) && typos.every((i) => !(i in AVAILABLE_MODELS));

console.log('--- verdicts ---');
console.log('LADDER leg alone separates real from typo:', ladderSeparates, '(false => vacuous alone)');
console.log('MEMBERSHIP leg separates real from typo:', membershipSeparates, '(true => control load-bearing)');
console.log('overlay size:', Object.keys(AVAILABLE_MODELS).length, '| fallback set size:', buildFallbackModels().length);

const fb = buildFallbackModels();
for (const id of real) {
  const m = fb.find((x) => x.id === id);
  console.log(id, '| in fallback set:', !!m, '| displayName:', m?.displayName, '| effort:', JSON.stringify(m?.capabilities.effort));
}

// A second control: the five-level models must NOT floor, or the floor
// assertion would be true of every model and say nothing about these three.
const fiveLevel = ['claude-opus-5', 'claude-sonnet-5', 'claude-fable-5-1'];
const fiveLevelDoesNotFloor = fiveLevel.every((id) => !floorsAt3(id));
console.log('CONTROL 2 — known five-level models do NOT floor:', fiveLevelDoesNotFloor);
for (const id of fiveLevel) console.log(' ', id, '| effort:', JSON.stringify(fallbackEffortLevels(id)));

const verdict = !ladderSeparates && membershipSeparates && fiveLevelDoesNotFloor;
console.log('CONTROL VERDICT:', verdict ? 'PASS — membership is the only separating leg, and the floor is not universal' : 'UNEXPECTED — read the lines above');
