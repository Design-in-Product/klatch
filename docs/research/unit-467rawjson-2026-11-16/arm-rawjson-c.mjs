/**
 * unit-467rawjson — arm C
 *
 * Subject: **the question arms A and B leave open.** If the 12 are scrubs/controls/fixtures and the
 * six own no model token, which probe — if any — can cause a live model call? The remaining route
 * is through the product: POST a message to a running server. See PRE-REGISTRATION-C.md
 * (`fc823d16`), pushed before this file existed.
 *
 * Interpolation-tolerant on purpose: Q4 was refuted because `${BASE}${pathname}` carries no literal
 * `/api/messages`. The route key here is a bare `/messages` segment anywhere in the stripped source.
 *
 * U3 re-runs arm B's live-`messages.create` test over the whole 155 and asserts agreement with arm
 * B on the shared 12, so the wider census cannot quietly be a second measurement of a new key.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SCRIPTS = join(ROOT, 'scripts');
const PIN = '1f675ebf76eb283cec6ee97294ba782b6b147678';
const B_REV = '8618e343';

const legs = [];
const red = [];
const refused = [];
function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) refused.push(id);
  else if (!ok) red.push(id);
  console.log(`${ok === null ? 'REF' : ok ? 'ok ' : 'RED'} ${id.padEnd(9)} ${detail}`);
}
const preds = [];
const refuted = [];
const prefused = [];
function pred(id, held, detail) {
  preds.push(id);
  if (held === null) prefused.push(id);
  else if (!held) refuted.push(id);
  console.log(`${held === null ? 'OPEN   ' : held ? 'LANDED ' : 'REFUTED'} ${id.padEnd(4)} ${detail}`);
}

const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' });
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));

const MODEL = /\b(Anthropic|ANTHROPIC_API_KEY|messages\s*\.\s*create)\b/;
const CREATE = /\bmessages\s*\.\s*create\b/;
// Interpolation-tolerant: a bare `/messages` path segment, however the prefix is assembled.
const ROUTE = /\/messages\b/;
// A spawn/exec of any kind — the only way a probe can start a server in this corpus.
const SPAWN = /\b(spawn|spawnSync|execFile|execFileSync|exec|fork)\s*\(/;
// The variable being scrubbed, in either idiom the corpus uses.
const SCRUB = /delete\s+\w+\.ANTHROPIC_API_KEY|ANTHROPIC_API_KEY\s*:\s*(''|""|``|undefined)|ANTHROPIC_API_KEY\s*=\s*(''|""|``)/;

// Same predicate promote-probes.mts:125 uses.
const population = () => readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f)).sort();
const files = population();

console.log(`unit-467rawjson arm C — pin ${PIN}, arm B at ${B_REV}`);
console.log(`HEAD now: ${git('rev-parse', 'HEAD').trim()}`);
console.log('');

// U1 — the population must match the instrument's own count
const { SWEPT, DEFERRED } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
leg('U1', files.length === 155 && files.length === SWEPT.length + DEFERRED.length,
  `population: ${files.length} probe files (SWEPT ${SWEPT.length} + DEFERRED ${DEFERRED.length} = ${SWEPT.length + DEFERRED.length}); expect 155`);

const rows = [];
const errs = [];
for (const f of files) {
  try {
    const src = readFileSync(join(SCRIPTS, f), 'utf8');
    const kept = stripSource(src, false);
    const blanked = stripSource(src, true);
    rows.push({
      f,
      model: MODEL.test(kept),
      createLive: CREATE.test(blanked),
      createAny: CREATE.test(kept),
      route: ROUTE.test(kept),
      spawn: SPAWN.test(kept),
      scrub: SCRUB.test(kept),
    });
  } catch (e) {
    errs.push(`${f}: ${e.message}`);
  }
}
leg('U2', errs.length === 0, `stripSource failures: ${errs.length ? JSON.stringify(errs) : 'none'}`);

// U3 — agree with arm B on the shared 12
const B_TWELVE = [
  'probe-round223-twenty-one-probes-against-a-stranger.mts',
  'probe-round224b-the-migrated-probes-against-a-stranger.mts',
  'probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts',
  'probe-round230-a-killed-probe-must-not-leave-its-server.mts',
  'probe-round231-the-handler-and-the-signal-are-in-different-processes.mts',
  'probe-round233-arm-m-and-the-endpoint-can-walk-different-corpora.mts',
  'probe-round250-the-drive-was-never-priced-and-the-port-is-one-line-of-product.mts',
  'probe-round252-the-db-class-is-unblocked-by-a-variable-the-product-already-reads.mts',
  'probe-round253-the-env-file-cannot-reach-the-database-path.mts',
  'probe-round254-the-mutate-class-is-an-unanchored-conjunction-and-most-of-it-never-writes-the-product.mts',
  'probe-round285-the-promotion-path-and-the-two-detectors-that-were-returning-a-smaller-number.mts',
  'probe-round305-a-refusal-the-reader-could-not-check-can-now-print-its-own-site.mts',
];
const byName = new Map(rows.map((r) => [r.f, r]));
const u3 = B_TWELVE.filter((f) => byName.get(f)?.createLive !== false);
leg('U3', u3.length === 0,
  `arm C reproduces arm B's "0 live messages.create" on the shared 12: ` +
  `${u3.length ? `DISAGREES on ${JSON.stringify(u3)}` : '12/12 agree'}`);
// And the model class must come out at 12 over DEFERRED, which is the figure arms A/B rest on.
const modelDeferred = rows.filter((r) => r.model && DEFERRED.includes(r.f)).map((r) => r.f);
leg('U3b', true,
  `model-token hits over DEFERRED (no exemption/admission applied, so this is NOT the instrument's 12): ` +
  `${modelDeferred.length}`);

const route = rows.filter((r) => r.route);
const routeSpawn = rows.filter((r) => r.route && r.spawn);
const routeSpawnNoScrub = rows.filter((r) => r.route && r.spawn && !r.scrub);
const liveCreate = rows.filter((r) => r.createLive);

console.log('');
console.log(`── /messages route key over all ${rows.length} probes ──`);
console.log(`  names a /messages route:                        ${route.length}`);
console.log(`  … and spawns a child process:                   ${routeSpawn.length}`);
console.log(`  … and does NOT scrub ANTHROPIC_API_KEY:         ${routeSpawnNoScrub.length}`);
console.log(`  live-code messages.create anywhere in the 155:  ${liveCreate.length}`);
console.log('');
console.log('── route + spawn + no scrub, named (T2\'s candidate population) ──');
for (const r of routeSpawnNoScrub) console.log(`  ${DEFERRED.includes(r.f) ? 'DEFERRED' : 'SWEPT   '} ${r.f}`);
if (!routeSpawnNoScrub.length) console.log('  (none)');
console.log('');

const SIX = [
  'probe-path-c-chat-binding-live.mts',
  'probe-round162-preamble-drop-and-roster-live.mts',
  'probe-round164-layer5-terminality-live.mts',
  'probe-round166-terminal-floor-live.mts',
  'probe-round167-floor-report-live.mts',
  'probe-round213-reassign-live-http.mts',
];
const sixRoute = SIX.filter((f) => byName.get(f)?.route);
pred('T1', sixRoute.length > 0,
  `of the six -live probes, those naming a /messages route under the interpolation-tolerant key: ` +
  `${sixRoute.length} ${JSON.stringify(sixRoute)} (arm B's literal key found 0). ` +
  `Over all 155: ${route.length}.`);

pred('T2', routeSpawnNoScrub.length >= 1,
  `probes that name a /messages route AND spawn AND do not scrub the key: ${routeSpawnNoScrub.length}. ` +
  `${routeSpawnNoScrub.length >= 1
    ? 'A live-round population candidate EXISTS in the probe corpus and is named above.'
    : 'NO probe in the corpus has a path to a live model call: the raw-JSON ruling\'s producer is not scripts/probe-*.'}`);

pred('T3', liveCreate.length === 0,
  `live-code messages.create across all ${rows.length} probes: ${liveCreate.length} ` +
  JSON.stringify(liveCreate.map((r) => r.f)) +
  `. ${liveCreate.length === 0 ? 'Not one probe calls the SDK directly, anywhere in the corpus.' : 'The model class MISSED a live caller.'}`);

const modelSet = new Set(rows.filter((r) => r.model).map((r) => r.f));
const routeSet = new Set(route.map((r) => r.f));
const modelNotRoute = [...modelSet].filter((f) => !routeSet.has(f));
const routeNotModel = [...routeSet].filter((f) => !modelSet.has(f));
pred('T4', modelNotRoute.length > 0 && routeNotModel.length > 0,
  `|model \\ route| = ${modelNotRoute.length}, |route \\ model| = ${routeNotModel.length} ` +
  `(model ${modelSet.size}, route ${routeSet.size}). ` +
  `${modelNotRoute.length > 0 && routeNotModel.length > 0
    ? 'The two keys are MISALIGNED, not nested: widening the token key cannot reach the route population.'
    : 'One key contains the other, so widening could in principle do the job.'}`);

console.log('');
console.log('── route-key members NOT flagged by DETECTORS.model (the misalignment, named) ──');
for (const f of routeNotModel.sort()) {
  const r = byName.get(f);
  console.log(`  ${DEFERRED.includes(f) ? 'DEFERRED' : 'SWEPT   '} spawn=${r.spawn ? 'Y' : 'n'} scrub=${r.scrub ? 'Y' : 'n'} ${f}`);
}
console.log('');

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('U4', gate === '', `gate (packages, scripts, docs/research/lib): ${gate === '' ? 'empty' : gate}`);

console.log('');
console.log(`VERDICT/${red.length} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} prefused=${JSON.stringify(prefused)}`);
process.exit(red.length ? 1 : 0);
