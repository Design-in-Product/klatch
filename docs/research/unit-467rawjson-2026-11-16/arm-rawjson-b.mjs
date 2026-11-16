/**
 * unit-467rawjson — arm B
 *
 * Subject: **arm A's own site column.** `hazardSite` returns the FIRST matching line, so arm A's
 * twelve sites are a one-line slice per file and cannot carry "none of the 12 makes a live call."
 * See PRE-REGISTRATION-B.md (`256d7681`), pushed before this file existed.
 *
 * The 12 are read OFF `drive1.arma.out` (frozen artefact at `0eda091b`), not by re-running the
 * instrument — so S1/S3 can disagree with arm A instead of inheriting from it. `stripSource` is
 * imported from `scripts/lib/strip-source.mjs`; the live-vs-fixture test is `literalOnly()`'s own
 * logic (`promote-probes.mts:208-209`) reused, not retyped.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SCRIPTS = join(ROOT, 'scripts');
const PIN = '1f675ebf76eb283cec6ee97294ba782b6b147678';
const A_REV = '0eda091b';
const A_REC = join(HERE, 'drive1.arma.out');

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

// The detector, quoted verbatim from promote-probes.mts:165 — and asserted against the live source
// by S5 below, so a drift in the instrument reddens instead of being silently out of date.
const MODEL = /\b(Anthropic|ANTHROPIC_API_KEY|messages\s*\.\s*create)\b/;
const CREATE = /\bmessages\s*\.\s*create\b/;
const HTTP_MSG = /\/api\/(channels\/[^'"`\s]*\/)?messages|['"`]\/api\/messages/;

// ── parse the 12 and the INADMISSIBLE set out of arm A's recording
const rec = readFileSync(A_REC, 'utf8');
const section = (start, end) => {
  const i = rec.indexOf(start);
  if (i < 0) return '';
  const j = end ? rec.indexOf(end, i) : -1;
  return rec.slice(i + start.length, j < 0 ? undefined : j);
};
const twelveBlock = section('── the model bucket, named (the 12) ──', '── INADMISSIBLE');
const inaBlock = section('── INADMISSIBLE (spawn closure), named ──', '\nok  A5');
const parseNames = (block) => [...block.matchAll(/^ {2}(probe-\S+\.mts)$/gm)].map((m) => m[1]);
const parseSites = (block) => {
  const out = new Map();
  const lines = block.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const n = /^ {2}(probe-\S+\.mts)$/.exec(lines[i]);
    if (n && lines[i + 1] !== undefined) out.set(n[1], lines[i + 1].trim());
  }
  return out;
};
const TWELVE = parseNames(twelveBlock);
const A_SITES = parseSites(twelveBlock);
const INADMISSIBLE = parseNames(inaBlock);
const SIX = INADMISSIBLE.filter((f) => /-live(-http)?\.mts$/.test(f));

console.log(`unit-467rawjson arm B — pin ${PIN}, arm A recording at ${A_REV}`);
console.log(`HEAD now: ${git('rev-parse', 'HEAD').trim()}`);
console.log('');

leg('S1', TWELVE.length === 12, `parsed ${TWELVE.length} names out of the model bucket in drive1.arma.out (expect 12)`);
leg('S1b', INADMISSIBLE.length === 7 && SIX.length === 6,
  `parsed INADMISSIBLE: ${INADMISSIBLE.length} (expect 7), of which -live-suffixed: ${SIX.length} (expect 6)`);

// S5 — the detector I quote is the detector the instrument runs.
const promoteSrc = readFileSync(join(SCRIPTS, 'promote-probes.mts'), 'utf8');
leg('S5', promoteSrc.includes(String(MODEL)),
  `the quoted detector ${String(MODEL)} appears verbatim in promote-probes.mts: ${promoteSrc.includes(String(MODEL))}`);

/** Every model-branch match in one file, over the two readings the instrument itself uses. */
function readFile12(f) {
  const src = readFileSync(join(SCRIPTS, f), 'utf8');
  const kept = stripSource(src, false).split('\n');   // comments blanked, strings KEPT
  const blanked = stripSource(src, true).split('\n'); // comments AND string bodies blanked
  const hits = [];
  for (let i = 0; i < kept.length; i++) {
    if (!MODEL.test(kept[i])) continue;
    hits.push({
      line: i + 1,
      text: kept[i].trim().slice(0, 160),
      // Surviving `blankStrings: true` means the token is live code, not a string body.
      live: MODEL.test(blanked[i] ?? ''),
      create: CREATE.test(kept[i]),
      createLive: CREATE.test(blanked[i] ?? ''),
    });
  }
  return { src, kept, blanked, hits };
}

const read = new Map();
let s2err = [];
for (const f of TWELVE) {
  try {
    read.set(f, readFile12(f));
  } catch (e) {
    s2err.push(`${f}: ${e.message}`);
  }
}
leg('S2', s2err.length === 0, `files unreadable or stripSource threw: ${s2err.length ? JSON.stringify(s2err) : 'none'}`);

// S3 — arm A's reported site must be among arm B's matches for the same file
const s3 = [];
for (const f of TWELVE) {
  const r = read.get(f);
  if (!r) continue;
  const aSite = A_SITES.get(f) ?? '';
  const m = /^line (\d+): (.*)$/.exec(aSite);
  if (!m) { s3.push(`${f}: arm A site unparseable (${aSite.slice(0, 40)})`); continue; }
  const n = Number(m[1]);
  if (!r.hits.some((h) => h.line === n)) s3.push(`${f}: arm A site line ${n} not among arm B's ${r.hits.length} match line(s)`);
}
leg('S3', s3.length === 0, `arm A sites reproduced by arm B: ${s3.length ? JSON.stringify(s3) : `${TWELVE.length}/${TWELVE.length}`}`);

console.log('');
console.log('── every model-branch match in each of the 12 (L = survives blankStrings:true, i.e. live code) ──');
for (const f of TWELVE) {
  const r = read.get(f);
  if (!r) { console.log(`  ${f}\n      (unreadable)`); continue; }
  const liveN = r.hits.filter((h) => h.live).length;
  console.log(`  ${f} — ${r.hits.length} match(es), ${liveN} live-code`);
  for (const h of r.hits) console.log(`      ${h.live ? 'L' : '.'}${h.create ? (h.createLive ? '!' : 'f') : ' '} line ${h.line}: ${h.text}`);
}
console.log('');

// ── Q1 — is arm A's site a slice?
const multi = TWELVE.filter((f) => (read.get(f)?.hits.length ?? 0) > 1);
pred('Q1', multi.length >= 1,
  `members with a model-branch match on a line OTHER than their arm-A site: ${multi.length} of ${TWELVE.length}. ` +
  `Total matches across the 12: ${TWELVE.reduce((a, f) => a + (read.get(f)?.hits.length ?? 0), 0)} ` +
  `(arm A printed ${TWELVE.length}). ${multi.length ? "Arm A's site column is a SLICE." : "Arm A's site column was a complete reading after all."}`);

// ── Q2 — any live messages.create among the 12?
const liveCreate = [];
for (const f of TWELVE) for (const h of read.get(f)?.hits ?? []) if (h.createLive) liveCreate.push(`${f}:${h.line}`);
const fixtureCreate = [];
for (const f of TWELVE) for (const h of read.get(f)?.hits ?? []) if (h.create && !h.createLive) fixtureCreate.push(`${f}:${h.line}`);
pred('Q2', liveCreate.length === 0,
  `messages.create surviving blankStrings:true (live code): ${liveCreate.length} ${JSON.stringify(liveCreate)}; ` +
  `inside a string literal (fixture): ${fixtureCreate.length} ${JSON.stringify(fixtureCreate)}. ` +
  `${liveCreate.length === 0
    ? 'NOT ONE of the 12 calls the SDK in live code. The `model` class is not the live-round population.'
    : 'The live-call population is NON-EMPTY and arm A\'s site reading was misleading.'}`);

// ── Q3 — do the six own any model token at all?
const sixOwn = [];
for (const f of SIX) {
  const src = readFileSync(join(SCRIPTS, f), 'utf8');
  const kept = stripSource(src, false);
  if (MODEL.test(kept)) sixOwn.push(f);
}
pred('Q3', sixOwn.length === 0,
  `of the six -live probes, those owning a model-branch token in their own (comment-blanked) source: ` +
  `${sixOwn.length} ${JSON.stringify(sixOwn)}. ` +
  `${sixOwn.length === 0
    ? 'They are refused for a SPAWN relation only — DETECTORS.model never saw a call in them.'
    : 'At least one owns a token, so arm A\'s overlap-0 needs another explanation.'}`);

// ── Q4 — do the six reach the model over the product's HTTP route?
const sixHttp = [];
for (const f of SIX) {
  const src = readFileSync(join(SCRIPTS, f), 'utf8');
  const kept = stripSource(src, false);
  if (HTTP_MSG.test(kept)) sixHttp.push(f);
}
pred('Q4', sixHttp.length >= 1,
  `of the six, those naming an /api/...messages path in their own source: ${sixHttp.length} ` +
  JSON.stringify(sixHttp) +
  `. ${sixHttp.length ? 'The live route is the PRODUCT\'S message endpoint, which DETECTORS.model cannot see.' : 'No HTTP message route in their source either — the route is somewhere a third reading has to find.'}`);

// ── Q5 — does round230, the inheritance root, call live?
const R230 = 'probe-round230-a-killed-probe-must-not-leave-its-server.mts';
const r230 = read.get(R230);
const r230Live = (r230?.hits ?? []).filter((h) => h.createLive);
pred('Q5', r230Live.length === 0,
  `${R230}: ${r230 ? `${r230.hits.length} model match(es), ${r230.hits.filter((h) => h.live).length} live-code, ` : '(not among the 12!) '}` +
  `live messages.create: ${r230Live.length}. ` +
  `${r230Live.length === 0 ? 'The root of all six refusals makes no SDK call of its own.' : 'The root does call live.'}`);

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('S4', gate === '', `gate (packages, scripts, docs/research/lib): ${gate === '' ? 'empty' : gate}`);

console.log('');
console.log(`VERDICT/${red.length} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} prefused=${JSON.stringify(prefused)}`);
process.exit(red.length ? 1 : 0);
