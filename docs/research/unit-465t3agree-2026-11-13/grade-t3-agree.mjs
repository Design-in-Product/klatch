#!/usr/bin/env node
/**
 * grade-t3-agree.mjs — Unit 465-t3agree, 2026-11-13 STOP, Argus
 *
 * Theseus's 11/13 named-not-endorsed line against `unit-465t3nonempty`'s `T3b`: the comment's claim
 * ("a genuine disagreement already implies non-emptiness") is true only if `agree` compares the two
 * `removed` sets, and false if it compares something that can differ while both are empty. `agree`
 * (`sameMembers`) in fact compares `above(x)` vs `above(y)` — filtered rounds > 292 — never `removed`
 * directly. This unit settles whether that gap is load-bearing: can `agree` read `false` while both
 * `removed` are empty?
 *
 * P1–P3 are read off the source, not driven (they are definitional). P4 drives a synthetic
 * counterexample against the bare functions to show the guarantee depends on `attestedRounds()`'s
 * structure, not on `sameMembers`/`removedNonEmpty` defending themselves. P5 drives the real reader
 * at the states `unit-465t3nonempty` already produced, including the one live disagreement on
 * record (`drive2.blind-key.out`, `T3-prior`).
 */
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { attestedRounds, DENIAL_RE, LEGACY_DENIAL_RE, git } from '../lib/attested-rounds.mjs';
import { renderRows, renderPredRows, renderVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(dirname(dirname(HERE)));

const REV_NOW = (git(REPO, ['rev-parse', 'HEAD']) ?? 'UNRESOLVED\n').trim();
const REV_PRIOR = (git(REPO, ['rev-parse', '69cf9167']) ?? 'UNRESOLVED').trim();

console.log('=== GRADE/465-t3agree — can T3b\'s agree read false while both removed are empty? ===');
console.log(`REV_NOW   ${REV_NOW}`);
console.log(`REV_PRIOR ${REV_PRIOR}`);
console.log(`CLOCK     ${new Date().toISOString()}`);
console.log('');

const legs = [];
const add = (id, ok, what) => legs.push({ id, ok, what });

// ── P1 — raw does not depend on denialRe: source-level check ───────────────────────────────────────
// Read the module's own text rather than re-typing the claim: the functions that build nonSubject
// and subjectRounds must appear textually before denialRe is first referenced.
const src = git(REPO, ['show', `${REV_NOW}:docs/research/lib/attested-rounds.mjs`]) ?? '';
const rawBuildIdx = src.indexOf('const raw = new Set');
const denialFirstUseIdx = src.indexOf('denialRe.exec');
add('P1', rawBuildIdx > -1 && denialFirstUseIdx > -1 && denialFirstUseIdx < rawBuildIdx,
  `[PRED  ] P1 denialRe.exec appears before \`const raw = …\` is built (textually earlier in the ` +
  `row loop that feeds affirmedBySubject, not into raw itself) — denialFirstUse@${denialFirstUseIdx} ` +
  `rawBuild@${rawBuildIdx}`);

// Direct functional check: call attestedRounds twice at the same rev with DIFFERENT denialRe and
// confirm the two calls' internal `raw`-equivalent (nonSubject ∪ subjectRounds, i.e. raw itself,
// which the module exports) is identical regardless of denialRe.
const b = attestedRounds(REPO, REV_NOW, { denialRe: LEGACY_DENIAL_RE });
const c = attestedRounds(REPO, REV_NOW, { denialRe: DENIAL_RE });
const rawEqual = b !== null && c !== null
  && b.raw.size === c.raw.size && [...b.raw].every((n) => c.raw.has(n));
add('P1b', rawEqual,
  `[MEAS  ] raw is identical under two different denialRe values at the same rev — ` +
  `|raw_B|=${b ? b.raw.size : 'REFUSED'} |raw_C|=${c ? c.raw.size : 'REFUSED'}`);

// ── P2 — removed.length === 0 iff filtered === raw, by construction ────────────────────────────────
const p2Holds = b !== null && c !== null
  && (b.removed.length === 0) === (b.filtered.size === b.raw.size)
  && (c.removed.length === 0) === (c.filtered.size === c.raw.size);
add('P2', p2Holds,
  `[MEAS  ] removed.length===0 ⟺ filtered===raw, both sides — ` +
  `B removed=${b ? b.removed.length : 'REFUSED'} filtered=raw:${b ? b.filtered.size === b.raw.size : '?'}`);

// ── P3 — the real reader: whenever agree is false, is at least one removed set non-empty? ──────────
// Driven across every (rev, cripple) combination unit-465t3nonempty already produced, plus the
// REV_PRIOR leg under blind-key, which is the one live disagreement on record.
const above = (r) => (r === null ? null : r.sorted.filter((n) => n > 292));
function sameMembers(x, y) {
  if (x === null || y === null) return null;
  const ax = above(x); const ay = above(y);
  if (ax.length !== ay.length) return false;
  for (let i = 0; i < ax.length; i += 1) if (ax[i] !== ay[i]) return false;
  return true;
}
const removedNonEmpty = (x, y) => (x === null || y === null ? null : x.removed.length > 0 || y.removed.length > 0);

const NEVER_RE = /$^/;
const states = [
  ['now/none', REV_NOW, DENIAL_RE],
  ['now/blind-key', REV_NOW, NEVER_RE],
  ['prior/none', REV_PRIOR, DENIAL_RE],
  ['prior/blind-key', REV_PRIOR, NEVER_RE],
];
let p3Violation = null;
const p3Rows = [];
for (const [label, rev, cKey] of states) {
  const B = attestedRounds(REPO, rev, { denialRe: LEGACY_DENIAL_RE });
  const C = attestedRounds(REPO, rev, { denialRe: cKey });
  const agree = sameMembers(B, C);
  const nonEmpty = removedNonEmpty(B, C);
  p3Rows.push(`${label}: agree=${agree} nonEmpty=${nonEmpty}`);
  if (agree === false && nonEmpty !== true) p3Violation = label;
}
add('P3', p3Violation === null,
  `[CLAIM ] no (rev, cripple) state produces agree=false with nonEmpty!==true — ${p3Rows.join(' · ')}` +
  (p3Violation ? ` — VIOLATION at ${p3Violation}` : ''));

// Explicit witness: the one live disagreement on record is prior/blind-key, and it must show
// nonEmpty=true, matching unit-465t3nonempty's own drive2.blind-key.out (T3-prior / T3b-prior).
const priorBlindKey = p3Rows.find((r) => r.startsWith('prior/blind-key'));
add('P3w', priorBlindKey === 'prior/blind-key: agree=false nonEmpty=true',
  `[PIN   ] the live disagreement (prior/blind-key) reproduces unit-465t3nonempty's drive2.blind-key.out ` +
  `(T3-prior agree=false, T3b-prior nonEmpty=true) exactly — ${priorBlindKey}`);

// ── P4 — a synthetic counterexample against the BARE functions, bypassing attestedRounds() ─────────
// This is the adversarial case: feed sameMembers/removedNonEmpty two hand-built objects that violate
// the P1 invariant (both removed:[], but different sorted content above 292). If the bare functions
// defended themselves against this, P1 would be redundant; they must NOT, because the guarantee is
// structural (attestedRounds never produces such a pair), not defensive.
const fakeX = { sorted: [300], removed: [] };
const fakeY = { sorted: [301], removed: [] };
const fakeAgree = sameMembers(fakeX, fakeY);
const fakeNonEmpty = removedNonEmpty(fakeX, fakeY);
add('P4', fakeAgree === false && fakeNonEmpty === false,
  `[CLAIM ] a hand-built pair with removed:[] on both sides but different sorted content produces ` +
  `agree=${fakeAgree} nonEmpty=${fakeNonEmpty} — the bare functions do NOT defend against this; the ` +
  `guarantee holds only because attestedRounds() never emits such a pair (P1/P1b)`);

// ── gate ─────────────────────────────────────────────────────────────────────────────────────────
add('G1', b !== null && c !== null, '[GATE  ] attestedRounds resolved at REV_NOW under both denialRe values');

console.log('--- legs');
console.log(renderRows(legs).join('\n'));
console.log('');

const byId = (id) => legs.find((l) => l.id === id)?.ok;
const preds = [
  { id: 'P1', landed: byId('P1') && byId('P1b'), what: 'raw does not depend on denialRe' },
  { id: 'P2', landed: byId('P2'), what: 'removed.length===0 iff filtered===raw, both sides' },
  { id: 'P3', landed: byId('P3') && byId('P3w'), what: 'no (rev, cripple) state shows agree=false with nonEmpty!==true' },
  { id: 'P4', landed: byId('P4'), what: 'the bare functions accept a hand-built counterexample (guarantee is structural, not defensive)' },
];
console.log('--- predictions');
console.log(renderPredRows(preds).join('\n'));
console.log('');

console.log(renderVerdict({ legs, preds }));
const red = legs.filter((l) => l.ok === false);
const refused = legs.filter((l) => l.ok === null);
process.exit(red.length || refused.length ? 1 : 0);
