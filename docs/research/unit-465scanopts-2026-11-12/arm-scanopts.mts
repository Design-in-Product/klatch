/**
 * unit-465scanopts — ARM
 *
 * Pre-registration: docs/research/unit-465scanopts-2026-11-12/PRE-REGISTRATION.md
 * Committed and pushed as 2b49937a BEFORE this file existed.
 *
 * Claim under test: `session-scanner.ts` counts turns with
 * `isHumanTurnBoundary(event)` — no `opts` — while the import computes
 * `requirePermissionMode` per file and passes it in. `requirePermissionMode`
 * only ADDS a rejection, so the import's boundary set is a subset of the
 * scanner's on any session carrying `permissionMode`.
 *
 * Every figure is read off the live tree at run time (R7). Nothing in the
 * pre-registration is restated here as a result.
 *
 * EXIT CODE TRACKS THE APPARATUS ONLY (R8). A refuted prediction does not
 * redden this arm; a refusal or a crash does. The two tallies print as two
 * separate headline lines.
 *
 * Read-only. Touches no database. Usage:
 *   npx tsx docs/research/unit-465scanopts-2026-11-12/arm-scanopts.mts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { extractSessionFingerprint } from '../../../packages/server/src/import/session-scanner.js';
import {
  isConversationEvent,
  isHumanTurnBoundary,
  parseEvents,
  readJsonlFile,
  type RawEvent,
} from '../../../packages/server/src/import/parser.js';

const REPO = path.resolve(import.meta.dirname, '../../..');
const SCANNER = path.join(REPO, 'packages/server/src/import/session-scanner.ts');
const PARSER = path.join(REPO, 'packages/server/src/import/parser.ts');
const PROBE = 'scripts/probe-browse-count-vs-persisted-rows.mts';

const refusals: string[] = [];
function refuse(id: string, why: string) {
  refusals.push(`${id}: ${why}`);
  console.log(`  REFUSE ${id} — ${why}`);
}

type Grade = 'HELD' | 'REFUTED' | 'PARTIAL' | 'NOT GRADED';
const grades: Array<{ id: string; grade: Grade; note: string }> = [];
function grade(id: string, g: Grade, note: string) {
  grades.push({ id, grade: g, note });
  console.log(`  ${g.padEnd(9)} ${id} — ${note}`);
}

function occurrences(haystack: string, needle: string): number {
  let n = 0;
  let i = 0;
  for (;;) {
    const j = haystack.indexOf(needle, i);
    if (j === -1) return n;
    n++;
    i = j + needle.length;
  }
}

// ── Refusals on the subject's shape, before any figure ────────────────────────

console.log('=== REFUSAL GATE (R1-R4) ===');

if (!fs.existsSync(SCANNER)) refuse('R1', `${SCANNER} missing`);
if (!fs.existsSync(PARSER)) refuse('R3', `${PARSER} missing`);

const scannerSrc = fs.existsSync(SCANNER) ? fs.readFileSync(SCANNER, 'utf-8') : '';
const parserSrc = fs.existsSync(PARSER) ? fs.readFileSync(PARSER, 'utf-8') : '';

const R1_NEEDLE = 'if (isHumanTurnBoundary(event)) turnCount++;';
const r1 = occurrences(scannerSrc, R1_NEEDLE);
if (r1 !== 1) refuse('R1', `scanner's opt-less call site occurs ${r1}x, expected exactly 1`);
else console.log(`  ok R1 — scanner's opt-less call site occurs exactly 1x`);

// R2 — RE-KEYED 2026-11-12, after the original spelling refused on this unit's
// own cure. It was `occurrences(scannerSrc, 'requirePermissionMode') === 0`.
// That is a word-presence proxy for the property I actually care about, and the
// corrected comment this unit wrote into session-scanner.ts NAMES the option in
// prose — so the cure tripped the refusal, recorded in
// recording-arm-scanopts-refused-on-own-cure.txt. The re-key reads the CALL
// SITE instead of a word, which is strictly stronger than the count it replaces:
// a comment mentioning the option no longer matters, and a call site that starts
// passing it is caught even if the identifier is spelled some other way.
const callSites: number[] = [];
for (let i = 0; ; ) {
  const j = scannerSrc.indexOf('isHumanTurnBoundary(', i);
  if (j === -1) break;
  callSites.push(j);
  i = j + 1;
}
const withOpts = callSites.filter((j) => !scannerSrc.startsWith('isHumanTurnBoundary(event))', j));
if (callSites.length === 0) refuse('R2', 'no isHumanTurnBoundary call site found in the scanner at all');
else if (withOpts.length !== 0)
  refuse('R2', `${withOpts.length} of ${callSites.length} scanner call sites are not the bare \`isHumanTurnBoundary(event))\` — the scanner may now pass the option`);
else
  console.log(
    `  ok R2 — all ${callSites.length} scanner call site(s) are the bare \`isHumanTurnBoundary(event))\`: the option is not passed`,
  );

const R3_NEEDLE = 'const requirePermissionMode = rawEvents.some(';
const r3 = occurrences(parserSrc, R3_NEEDLE);
if (r3 !== 1) refuse('R3', `parser's per-file computation occurs ${r3}x, expected exactly 1`);
else console.log(`  ok R3 — parser's per-file requirePermissionMode computation occurs exactly 1x`);

const FILES = [
  'exports/sessions/theseus-2026-03-22.jsonl',
  'packages/server/src/__tests__/fixtures/real-shapes-2.1.241.jsonl',
  'packages/server/src/__tests__/fixtures/real-shapes-2.1.81.jsonl',
  'research/1f171719-1bab-4650-b61d-d5938807cc8d.jsonl',
  'packages/server/src/__tests__/fixtures/simple-session.jsonl',
  'packages/server/src/__tests__/fixtures/tool-heavy-session.jsonl',
  'packages/server/src/__tests__/fixtures/subagent-session.jsonl',
];
for (const f of FILES) {
  if (!fs.existsSync(path.join(REPO, f))) refuse('R4', `fixture missing: ${f}`);
}
if (!refusals.some((r) => r.startsWith('R4'))) console.log(`  ok R4 — all ${FILES.length} fixtures present`);

if (refusals.length > 0) {
  console.log(`\nREFUSALS: ${refusals.length} — no figure printed.`);
  for (const r of refusals) console.log(`  ${r}`);
  process.exit(1);
}

// ── Measurement ───────────────────────────────────────────────────────────────

console.log('\n=== MEASUREMENT ===');

type Row = {
  file: string;
  usesPm: boolean;
  pmUserEvents: number;
  scannerTurns: number;
  importTurns: number;
  delta: number;
  capped: boolean;
};
const rows: Row[] = [];

for (const f of FILES) {
  const abs = path.join(REPO, f);
  const fp = await extractSessionFingerprint(abs);
  const { events } = await readJsonlFile(abs);
  const raw = events as RawEvent[];

  // R6 — two independent readings of the same session property.
  const usesPm = raw.some((e) => e.type === 'user' && e.permissionMode !== undefined);
  const pmUserEvents = raw.filter((e) => e.type === 'user' && e.permissionMode !== undefined).length;
  if (!usesPm && pmUserEvents > 0) {
    refuse('R6', `${f}: some() says no permissionMode but ${pmUserEvents} user events carry it`);
  }

  const parsed = parseEvents(events);
  const importTurns = parsed.turns.length;

  // R5 — turn count must equal the boundary count under the file's own option.
  const conv = raw.filter(isConversationEvent);
  const boundariesStrict = conv.filter((e) =>
    isHumanTurnBoundary(e, { requirePermissionMode: usesPm }),
  ).length;
  if (boundariesStrict !== importTurns) {
    refuse('R5', `${f}: boundaries-under-opts ${boundariesStrict} != parseEvents turns ${importTurns}`);
  }

  // Sanity: the scanner's reading, recomputed from the same events under the
  // legacy branch, should match what the streaming scanner reported. Recorded
  // beside the figure rather than conjoined with the claim.
  const boundariesLegacy = conv.filter((e) => isHumanTurnBoundary(e)).length;

  rows.push({
    file: f,
    usesPm,
    pmUserEvents,
    scannerTurns: fp.turnCount,
    importTurns,
    delta: fp.turnCount - importTurns,
    capped: fp.capped,
  });

  console.log(
    `  ${f}\n` +
      `      usesPermissionMode=${usesPm}  pmUserEvents=${pmUserEvents}  capped=${fp.capped}\n` +
      `      scanner turnCount = ${fp.turnCount}   (legacy boundaries recomputed = ${boundariesLegacy})\n` +
      `      import turns      = ${importTurns}   (strict boundaries recomputed = ${boundariesStrict})\n` +
      `      DELTA             = ${fp.turnCount - importTurns}`,
  );
  if (boundariesLegacy !== fp.turnCount) {
    console.log(
      `      note: streaming scanner (${fp.turnCount}) != legacy recomputation (${boundariesLegacy}) — ` +
        `recorded, not refused; the scanner's pre-filter and isConversationEvent are not the same filter`,
    );
  }
}

if (refusals.length > 0) {
  console.log(`\nREFUSALS: ${refusals.length} — figures above are printed but NOT graded.`);
  for (const r of refusals) console.log(`  ${r}`);
  process.exit(1);
}

// ── Grading ───────────────────────────────────────────────────────────────────

console.log('\n=== GRADING ===');

// P1
const subject = rows.find((r) => r.file === 'exports/sessions/theseus-2026-03-22.jsonl')!;
if (subject.delta >= 6 && subject.delta <= 7) {
  grade('P1', 'HELD', `theseus-2026-03-22 delta = ${subject.delta}, in the predicted {6,7}`);
} else if (subject.delta >= 1 && subject.delta <= 20) {
  grade('P1', 'PARTIAL', `delta = ${subject.delta} — direction right, outside the predicted {6,7}`);
} else {
  grade('P1', 'REFUTED', `delta = ${subject.delta} — not a strictly-positive divergence in [1,20]`);
}

// P2
const negatives = rows.filter((r) => r.delta < 0);
if (negatives.length === 0) {
  grade('P2', 'HELD', `no file under-reports: min delta = ${Math.min(...rows.map((r) => r.delta))} over ${rows.length} files`);
} else {
  grade('P2', 'REFUTED', `${negatives.length} file(s) under-report: ${negatives.map((r) => `${r.file}=${r.delta}`).join(', ')}`);
}

// P3 — control
const controls = rows.filter((r) => !r.usesPm);
const controlBreaks = controls.filter((r) => r.delta !== 0);
if (controls.length === 0) {
  grade('P3', 'NOT GRADED', 'no zero-permissionMode file in the population — control arm is empty');
} else if (controlBreaks.length === 0) {
  grade('P3', 'HELD', `all ${controls.length} zero-permissionMode files have delta exactly 0`);
} else {
  grade('P3', 'REFUTED', `${controlBreaks.length} of ${controls.length} controls diverge: ${controlBreaks.map((r) => `${r.file}=${r.delta}`).join(', ')}`);
}

// P4 — run the existing probe on the subject file and read its own verdict strings.
// stdout and stderr captured separately so the child's stderr cannot leak into
// this recording as if it were the arm's own output.
let probeOut = '';
let probeErr = '';
let probeRc = 0;
try {
  probeOut = execFileSync(
    'npx',
    ['tsx', PROBE, 'exports/sessions/theseus-2026-03-22.jsonl'],
    { cwd: REPO, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
} catch (e: any) {
  probeOut = e?.stdout ?? '';
  probeErr = e?.stderr ?? '';
  probeRc = e?.status ?? -1;
}
const probeSaysAgree = probeOut.includes('(== parser boundaries)');
const probeSaysDrift = probeOut.includes('predicate drift');
console.log(`  probe rc=${probeRc}  stderr_bytes=${Buffer.byteLength(probeErr, 'utf-8')}`);
for (const line of probeOut.split('\n')) {
  if (/turnCount|predicate drift|turn boundaries|boundaries scanner missed/.test(line)) {
    console.log(`      probe| ${line.trim()}`);
  }
}
if (probeRc !== 0) {
  grade('P4', 'NOT GRADED', `probe exited rc=${probeRc}; its verdict strings are not trustworthy`);
} else if (subject.delta === 0) {
  grade('P4', 'NOT GRADED', 'P1 delta is 0, so there is no divergence for the probe to be blind to');
} else if (probeSaysAgree && !probeSaysDrift) {
  grade('P4', 'HELD', `probe reports "(== parser boundaries)" and no drift line while the real delta is ${subject.delta} — its agreement is vacuous (both keys omit opts)`);
} else {
  grade('P4', 'REFUTED', `probe agree=${probeSaysAgree} drift=${probeSaysDrift} — it is not blind in the way predicted`);
}

// P5 — census the false claim across the three source dirs. The arm's own file
// lives under docs/research/ and is therefore outside the censused surface.
function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mts|mjs|js)$/.test(e.name)) out.push(p);
  }
  return out;
}
const SURFACE = ['packages/server/src', 'scripts', 'packages/client/src'];
const claimSites: string[] = [];
for (const d of SURFACE) {
  for (const p of walk(path.join(REPO, d))) {
    const src = fs.readFileSync(p, 'utf-8');
    if (!src.includes('isVisibleInTranscriptOnly')) continue;
    if (/isHumanTurnBoundary does not check|scanner also drops/.test(src)) {
      claimSites.push(path.relative(REPO, p));
    }
  }
}
const checksIt = parserSrc.includes('if (event.isVisibleInTranscriptOnly) return false;');
console.log(`  parser.ts checks isVisibleInTranscriptOnly: ${checksIt}`);
console.log(`  claim sites (${claimSites.length}): ${claimSites.join(', ') || '(none)'}`);
if (!checksIt) {
  grade('P5', 'REFUTED', 'parser.ts does NOT check isVisibleInTranscriptOnly — the comments are true');
} else if (claimSites.length === 2) {
  grade('P5', 'HELD', `parser.ts checks it, and 2 live sites still assert otherwise: ${claimSites.join(', ')}`);
} else {
  grade('P5', 'PARTIAL', `parser.ts checks it, but the census found ${claimSites.length} sites, not the predicted 2: ${claimSites.join(', ') || '(none)'}`);
}

// P6
const P6_SENTENCE = 'so the browse screen\n        // and the import agree by construction rather than by coincidence.';
const p6Present = scannerSrc.includes(P6_SENTENCE);
const p1Held = grades.find((g) => g.id === 'P1')!.grade;
console.log(`  session-scanner.ts "agree by construction" sentence present verbatim: ${p6Present}`);
if (!p6Present) {
  grade('P6', 'NOT GRADED', 'the sentence is not present verbatim at the pinned spelling — nothing to grade');
} else if (p1Held === 'HELD' || p1Held === 'PARTIAL') {
  grade('P6', 'HELD', `the sentence is live and the delta is ${subject.delta} — it is false for permissionMode sessions`);
} else {
  grade('P6', 'REFUTED', 'the sentence is live and P1 found no divergence');
}

// ── Two headline lines, kept apart (R8) ───────────────────────────────────────

const tally = (g: Grade) => grades.filter((x) => x.grade === g).length;
console.log('\n=== HEADLINE ===');
console.log(`APPARATUS: ${refusals.length} refusals of 8 declared — ${refusals.length === 0 ? 'all green' : 'RED'}`);
console.log(
  `PREDICTIONS: ${tally('HELD')} held · ${tally('PARTIAL')} partial · ` +
    `${tally('REFUTED')} refuted · ${tally('NOT GRADED')} not graded  (of ${grades.length})`,
);
console.log('\n=== FIGURES, KEPT APART ===');
console.log(`  files measured: ${rows.length}`);
console.log(`  permissionMode sessions: ${rows.filter((r) => r.usesPm).length}`);
console.log(`  sessions with a non-zero delta: ${rows.filter((r) => r.delta !== 0).length}`);
console.log(`  largest delta: ${Math.max(...rows.map((r) => r.delta))}`);
console.log(`  (these are three counts, not a rate; they share no denominator)`);

process.exit(refusals.length === 0 ? 0 : 1);
