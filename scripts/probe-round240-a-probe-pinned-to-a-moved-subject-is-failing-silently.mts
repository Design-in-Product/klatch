/**
 * Round 240 — the sweep Daedalus's Round 239 §4 corollary asked for.
 *
 * His finding: `probe-fingerprint-cache-endpoint` pinned the working tree to
 * commit `dba7699` to keep an A/B clean, and so **every later commit to
 * `session-scanner.ts` disarmed it.** It had been refusing to run since
 * 2026-09-04, one day after it was written. His corollary:
 *
 *   > Worth a sweep: if any other probe pins a commit or a path the product
 *   > has since moved, it is failing silently right now.
 *
 * This is that sweep, built as an instrument rather than performed as a grep,
 * because a grep over 73 probes is a claim I cannot reproduce next round.
 *
 * ── What it actually asks ────────────────────────────────────────────────────
 *
 * For each probe P, mechanically:
 *
 *   1. When was P itself last committed?           (`git log -1 -- P`)
 *   2. Which product source files does P name?     (literal `packages/**` paths)
 *   3. Has any of those moved since (1)?           (`git log <P-commit>..HEAD -- S`)
 *
 * A probe whose subject moved after the probe was last touched is a probe
 * whose assumptions about that subject have not been re-checked by anyone. That
 * is not proof of death — it is the population death is drawn from. Drive the
 * candidates; that step is deliberately NOT automated here, because "the probe
 * still exits 0" is exactly the reading Round 239 §4 warns against.
 *
 * ── What it deliberately does NOT claim ──────────────────────────────────────
 *
 * - It does not claim a stale probe is broken. It claims nobody has checked.
 * - It does not grade. There is no pass/fail on drift; drift is a measurement.
 *   The only hard checks here are on the INSTRUMENT'S OWN correctness (arms
 *   A–D), because an instrument that silently finds nothing is the failure mode
 *   this round exists to catalogue. Round 229's rule: a check that cannot fail
 *   is worth less than no check.
 * - It does not read line-number citations as pins. It separates references in
 *   executable code from references in comments, because the two rot
 *   differently: a stale path in code changes what is measured, a stale line
 *   number in a comment changes only what the reader believes.
 *
 * Usage:  npx tsx scripts/probe-round240-*.mts [--verbose]
 * Writes nothing. Reads git and the working tree only. Zero model calls.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const VERBOSE = process.argv.includes('--verbose');

let failures = 0;
let checks = 0;
const measurements: string[] = [];

function check(arm: string, what: string, pass: boolean, detail: string, kind: 'hard' | 'measurement' = 'hard') {
  checks += 1;
  if (kind === 'measurement') {
    measurements.push(`${arm}: ${what}`);
    console.log(`  [${arm}] MEAS  ${what}\n        ${detail}`);
    return;
  }
  if (!pass) failures += 1;
  console.log(`  [${arm}] ${pass ? 'PASS' : 'FAIL'}  ${what}\n        ${detail}`);
}

const git = (args: string[]) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/**
 * Strips `//` line comments and block comments so a path found afterwards is a
 * path the probe actually resolves, not one it cites in prose. Deliberately
 * naive about strings containing `//` — a URL in a string would lose its tail.
 * Arm C is the control on that: it asserts the stripper leaves a known-code
 * path standing and removes a known-comment one, on this very file.
 */
function stripComments(src: string): string {
  let out = '';
  let i = 0;
  let inBlock = false;
  let inLine = false;
  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (!inBlock && !inLine && two === '/*') { inBlock = true; i += 2; continue; }
    if (inBlock && two === '*/') { inBlock = false; i += 2; continue; }
    if (!inBlock && !inLine && two === '//') { inLine = true; i += 2; continue; }
    if (inLine && src[i] === '\n') { inLine = false; out += '\n'; i += 1; continue; }
    if (!inBlock && !inLine) out += src[i];
    i += 1;
  }
  return out;
}

// NOTE the alternation order: `tsx` MUST precede `ts`. Written the other way
// round, the regex matches `.ts` inside `.tsx` and truncates every client
// component path — which is exactly what the first drive of this instrument
// did, reporting six probes as naming a GONE `ChannelSidebar.ts`. Arm B is the
// control that now catches it. ROUND240-COMMENT-SENTINEL
const SUBJECT_RE = /packages\/[a-z]+\/src\/[A-Za-z0-9_./-]*\.(?:tsx|ts)/g;
const SHA_RE = /\b[0-9a-f]{7,40}\b/g;

type Row = {
  probe: string;
  probeCommit: string;
  probeDate: string;
  subjectsInCode: string[];
  subjectsInComments: string[];
  /** subject -> commits to it since the probe was last committed */
  movedInCode: Array<{ subject: string; n: number; log: string }>;
  movedInComments: Array<{ subject: string; n: number }>;
  shasInCode: string[];
};

// ── Enumerate probes ─────────────────────────────────────────────────────────
// readdirSync, not a glob: a glob has silently dropped files on this project
// before, and this sweep's whole value is that its denominator is complete.
const probeFiles = fs
  .readdirSync(path.join(REPO, 'scripts'))
  .filter((f) => (f.endsWith('.mts') || f.endsWith('.mjs') || f.endsWith('.ts')) && !f.startsWith('.'))
  .filter((f) => !f.includes('round240'))
  .sort();

console.log(`\nRound 240 — probe staleness sweep`);
console.log(`repo: ${REPO}`);
console.log(`HEAD: ${git(['rev-parse', '--short', 'HEAD']).trim()}  ${git(['log', '-1', '--format=%ci']).trim()}`);
console.log(`scripts/ candidates: ${probeFiles.length}\n`);

const rows: Row[] = [];
const noCommit: string[] = [];

for (const f of probeFiles) {
  const rel = `scripts/${f}`;
  const meta = git(['log', '-1', '--format=%H|%ci', '--', rel]).trim();
  if (!meta) { noCommit.push(rel); continue; }
  const [probeCommit, probeDate] = meta.split('|');

  const src = fs.readFileSync(path.join(REPO, rel), 'utf8');
  const code = stripComments(src);

  const all = new Set(src.match(SUBJECT_RE) ?? []);
  const inCode = new Set(code.match(SUBJECT_RE) ?? []);
  const inComments = [...all].filter((s) => !inCode.has(s)).sort();

  const shasInCode = [...new Set(code.match(SHA_RE) ?? [])]
    .filter((s) => {
      // A hex run is only a commit pin if git can resolve it to a commit.
      // stderr is swallowed deliberately: most candidates are byte sizes and
      // fixture UUIDs, and git is loud about each one.
      try {
        return execFileSync('git', ['cat-file', '-t', s], {
          cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
        }).trim() === 'commit';
      } catch { return false; }
    })
    .sort();

  const movedInCode: Row['movedInCode'] = [];
  const movedInComments: Row['movedInComments'] = [];

  for (const subject of [...all].sort()) {
    if (!fs.existsSync(path.join(REPO, subject))) {
      // A named subject that no longer exists on disk is the hardest form of
      // this defect; recorded as n = -1 so it sorts to the top of attention.
      if (inCode.has(subject)) {
        movedInCode.push({ subject: `${subject} (GONE)`, n: -1, log: 'path does not exist on disk' });
      } else {
        movedInComments.push({ subject: `${subject} (GONE)`, n: -1 });
      }
      continue;
    }
    const log = git(['log', '--oneline', `${probeCommit}..HEAD`, '--', subject]).trim();
    const n = log ? log.split('\n').length : 0;
    if (n === 0) continue;
    if (inCode.has(subject)) movedInCode.push({ subject, n, log });
    else movedInComments.push({ subject, n });
  }

  rows.push({
    probe: rel,
    probeCommit: probeCommit.slice(0, 8),
    probeDate: probeDate.slice(0, 10),
    subjectsInCode: [...inCode].sort(),
    subjectsInComments: inComments,
    movedInCode,
    movedInComments,
    shasInCode,
  });
}

// ── Arms A–D: the instrument checks itself ───────────────────────────────────
// Not ceremony. A sweep that finds nothing and a sweep that cannot find
// anything print the same thing, and Round 239's finding is precisely that the
// second kind survives for weeks.

console.log('── Instrument controls ──────────────────────────────────────────\n');

check('A', 'the sweep enumerated every script on disk (readdirSync, not a glob)',
  rows.length + noCommit.length === probeFiles.length,
  `${probeFiles.length} files on disk = ${rows.length} with a commit + ${noCommit.length} uncommitted` +
    (noCommit.length ? `\n        uncommitted: ${noCommit.join(', ')}` : ''));

// Arm B — the subject extractor, driven two-sided against known inputs rather
// than graded against an invented percentage. The first version of this arm
// asserted `withSubjects >= rows.length * 0.5` and went red at 51/108 — a
// threshold I made up, failing on a population that is half shell helpers with
// no product paths in them at all. A check whose threshold is a guess grades
// the guess, not the instrument.
const B_POSITIVE = `
  const p = 'packages/client/src/components/ChannelSidebar.tsx';
  const q = "packages/server/src/import/session-scanner.ts";
`;
// Near-misses that MUST NOT match: wrong extension, and a path inside a
// dependency tree. Without this half, a regex of /packages.*/ would pass.
const B_NEGATIVE = `
  const a = 'packages/server/src/import/session-scanner.js';
  const b = 'node_modules/.pnpm/packages/server/src/x.d.ts';
`;
const bPos = [...new Set(B_POSITIVE.match(SUBJECT_RE) ?? [])].sort();
const bNeg = [...new Set(B_NEGATIVE.match(SUBJECT_RE) ?? [])];
const bPosOk =
  bPos.length === 2 &&
  bPos[0] === 'packages/client/src/components/ChannelSidebar.tsx' &&
  bPos[1] === 'packages/server/src/import/session-scanner.ts';
const bNegOk = bNeg.length === 0 || bNeg.every((m) => !m.startsWith('node_modules'));
check('B', 'subject extractor returns whole .tsx paths and rejects near-misses (two-sided)',
  bPosOk && bNegOk,
  `positive: ${JSON.stringify(bPos)} (want the two full paths, .tsx NOT truncated to .ts); ` +
    `negative: ${JSON.stringify(bNeg)} (want no node_modules path, no .js path). ` +
    `Population for reference: ${withSubjectsCount()}/${rows.length} probes name at least one product path.`);

function withSubjectsCount() {
  return rows.filter((r) => r.subjectsInCode.length + r.subjectsInComments.length > 0).length;
}

// Arm C — the comment stripper, driven against known inputs on this very file.
// A stripper that removed everything would report every probe as clean.
// The first version of this arm used `probe-fingerprint-cache-endpoint` as its
// "comment-only" marker — a string that also appears in arm D's executable
// code, so the arm went red against a stripper that was working correctly. The
// Round 233 arm-G defect inverted: there, a source check matched its own
// docstring; here, a docstring check matched its own source. Both come from
// choosing a marker that occurs in the world rather than minting one.
const selfSrc = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
const selfCode = stripComments(selfSrc);
const CODE_SENTINEL = 'ROUND240' + '-CODE-SENTINEL';       // built at runtime so the literal
const LINE_SENTINEL = 'ROUND240' + '-COMMENT-SENTINEL';    // below is the only whole occurrence
const BLOCK_SENTINEL = 'ROUND240' + '-BLOCK-SENTINEL';
const sentinelInCode = 'ROUND240-CODE-SENTINEL';           // a string literal: must survive
/* ROUND240-BLOCK-SENTINEL — block comment: must not survive */
check('C', 'comment stripper keeps code and removes both comment forms (minted sentinels)',
  selfCode.includes(CODE_SENTINEL) &&
    !selfCode.includes(LINE_SENTINEL) &&
    !selfCode.includes(BLOCK_SENTINEL),
  `code sentinel survives: ${selfCode.includes(CODE_SENTINEL)} (want true, via ${sentinelInCode.length} chars); ` +
    `line-comment sentinel survives: ${selfCode.includes(LINE_SENTINEL)} (want false); ` +
    `block-comment sentinel survives: ${selfCode.includes(BLOCK_SENTINEL)} (want false). ` +
    `${selfSrc.length} → ${selfCode.length} bytes`);

// Arm D — the positive control. Round 239 proved `probe-fingerprint-cache-endpoint`
// was dead by commit drift. The sweep must independently see drift in the file
// Daedalus repaired, or it is not sensitive enough to have found his finding.
// Note the direction: he REPAIRED it this morning, so it should now read clean,
// while its sibling `probe-browse-endpoint-vs-channel-count` (declined, §4)
// should still carry the commit-pin signature.
const cacheProbe = rows.find((r) => r.probe.includes('probe-fingerprint-cache-endpoint'));
const scannerRel = 'packages/server/src/import/session-scanner.ts';
const scannerSinceCacheFix = cacheProbe
  ? git(['log', '--oneline', `${cacheProbe.probeCommit}..HEAD`, '--', scannerRel]).trim()
  : '';
check('D', 'the sweep can see the drift axis Round 239 found (scanner commits vs probe commit)',
  cacheProbe !== undefined,
  cacheProbe
    ? `probe-fingerprint-cache-endpoint last committed ${cacheProbe.probeCommit} (${cacheProbe.probeDate}); ` +
      `${scannerSinceCacheFix ? scannerSinceCacheFix.split('\n').length : 0} scanner commit(s) since. ` +
      `Repaired by Daedalus this morning, so 0 here is the expected, correct reading.`
    : 'probe not found — the sweep lost its own positive control');

// ── The sweep result ─────────────────────────────────────────────────────────

const stale = rows
  .filter((r) => r.movedInCode.length > 0)
  .sort((a, b) => {
    const am = Math.max(...a.movedInCode.map((m) => m.n));
    const bm = Math.max(...b.movedInCode.map((m) => m.n));
    return bm - am;
  });

const staleCommentsOnly = rows.filter((r) => r.movedInCode.length === 0 && r.movedInComments.length > 0);
const pinned = rows.filter((r) => r.shasInCode.length > 0);

console.log('\n── Result ───────────────────────────────────────────────────────\n');

check('E', 'probes whose subject moved after the probe was last touched',
  true,
  `${stale.length}/${rows.length} probes resolve a packages/** path in CODE that has been ` +
    `committed to since the probe itself was last committed. These are the population ` +
    `Round 239's dead probe came from — not a defect list.`,
  'measurement');

check('F', 'probes whose only stale reference is in a comment',
  true,
  `${staleCommentsOnly.length}/${rows.length}. These do not change what is measured; they ` +
    `change what the next reader believes. Round 236's "the header sentence was true for 2h34m" class.`,
  'measurement');

check('G', 'probes carrying a resolvable commit SHA in executable code',
  true,
  `${pinned.length}/${rows.length}: ${pinned.map((p) => `${path.basename(p.probe)} [${p.shasInCode.map((s) => s.slice(0, 7)).join(', ')}]`).join('; ') || '(none)'}`,
  'measurement');

// ── The third pin class: the live session corpus ─────────────────────────────
//
// Round 239 §4 named two pin classes — a commit, and a path. Driving the top
// of the stale list turned up a third that neither of us had named, and it is
// the only one of the three with a GUARANTEED expiry date.
//
// `probe-import-entity-binding.mts` pins seven session filenames by UUID under
// `~/.claude/projects`. Four of the seven are gone. That corpus is not under
// version control, and Claude Code deletes a session file once its **mtime**
// passes 30 days — measured below, not assumed. So a probe that names a
// session UUID is not at risk of rotting; it is scheduled to, 30 days after
// that session was last appended to.
//
// This also corrects my own Round 238 §6 conclusion. I wrote that the corpus
// grows "live, monotonic", from three observers' counts on a single day. Over a
// one-day window growth dominates and that reading was right. As a general
// statement it is wrong: the corpus grows at the head and is truncated at the
// tail. A count taken 30 days apart is not comparable in either direction.

const CORPUS = path.join(os.homedir(), '.claude', 'projects');
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g;

/** A UUID whose hex is mostly one repeated nibble is a hand-written fixture. */
const isSynthetic = (u: string) => {
  const hex = u.replace(/-/g, '');
  return new Set(hex).size <= 3;
};

let corpusFiles = new Map<string, Date>(); // uuid -> mtime
let corpusReadable = true;
try {
  for (const d of fs.readdirSync(CORPUS)) {
    const dp = path.join(CORPUS, d);
    if (!fs.statSync(dp).isDirectory()) continue;
    for (const fn of fs.readdirSync(dp)) {
      if (!fn.endsWith('.jsonl')) continue;
      corpusFiles.set(fn.replace(/\.jsonl$/, ''), fs.statSync(path.join(dp, fn)).mtime);
    }
  }
} catch { corpusReadable = false; }

const now = Date.now();
const ages = [...corpusFiles.values()].map((m) => (now - m.getTime()) / 86_400_000).sort((a, b) => b - a);

// Arm H — the retention cliff. The claim "30 days" must be measured, and the
// measurement must be two-sided: a maximum age alone could just mean the corpus
// is young. The second half is the discriminator — files whose BIRTH is older
// than 30 days exist and survive, which is only possible if the rule is mtime.
let birthOlderThan30 = 0;
let oldestBirthDays = 0;
try {
  for (const d of fs.readdirSync(CORPUS)) {
    const dp = path.join(CORPUS, d);
    if (!fs.statSync(dp).isDirectory()) continue;
    for (const fn of fs.readdirSync(dp)) {
      if (!fn.endsWith('.jsonl')) continue;
      const b = fs.statSync(path.join(dp, fn)).birthtime.getTime();
      const days = (now - b) / 86_400_000;
      if (days > 30) birthOlderThan30 += 1;
      if (days > oldestBirthDays) oldestBirthDays = days;
    }
  }
} catch { /* covered by corpusReadable */ }

check('H', 'the session corpus is truncated on mtime at 30 days (two-sided)',
  corpusReadable && ages.length > 0 && ages[0] <= 30.05 && birthOlderThan30 > 0,
  `${corpusFiles.size} session files; oldest mtime ${ages[0]?.toFixed(2)} d (want <= 30.05); ` +
    `${birthOlderThan30} file(s) BORN more than 30 d ago survive, oldest birth ${oldestBirthDays.toFixed(1)} d. ` +
    `A max-age cliff alone would be consistent with a young corpus; surviving old births prove ` +
    `the rule reads mtime, so appending to a session renews it.`);

// Arm I — the inventory. Every UUID a probe names in executable code, checked
// against the live corpus. Synthetic fixture UUIDs are excluded and the
// exclusion is controlled, because a classifier that called everything
// synthetic would report a clean sweep.
// The first version of this arm classified a UUID as real-or-fixture by hex
// entropy, and it was wrong: `probe-round179`'s four hand-minted twin ids
// (`c0111111-…-aaaaaaaaaaa1`) carry six distinct nibbles and read as real, so
// the sweep reported a probe with "4/4 dead pins" that mints all four itself.
//
// Entropy replaced with the actual question, which is not heuristic at all:
// **a corpus pin is a UUID the probe expects to FIND; a fixture is one it
// creates.** The mechanical proxy is whether the probe resolves a path into
// the live corpus at all. A probe that never names `~/.claude/projects` cannot
// be pinning it, whatever its UUIDs look like.
const CORPUS_CTX_RE = /\.claude['"\s,)/\\]|['"`]-Users-[A-Za-z0-9-]+['"`]|claude['"],\s*['"]projects/;

type Pin = { probe: string; uuid: string; present: boolean; ageDays: number | null };
const pins: Pin[] = [];
const corpusReaders: string[] = [];
for (const f of probeFiles) {
  const rel = `scripts/${f}`;
  const code = stripComments(fs.readFileSync(path.join(REPO, rel), 'utf8'));
  if (!CORPUS_CTX_RE.test(code)) continue;      // cannot be pinning the corpus
  corpusReaders.push(rel);
  for (const u of new Set(code.match(UUID_RE) ?? [])) {
    if (isSynthetic(u)) continue;               // second pass, not the primary test
    const m = corpusFiles.get(u);
    pins.push({ probe: rel, uuid: u, present: m !== undefined, ageDays: m ? (now - m.getTime()) / 86_400_000 : null });
  }
}

const round179 = 'scripts/probe-round179-backfill-flag-spellings-and-undo-errors.mts';
const entityBinding = 'scripts/probe-import-entity-binding.mts';
check('I', 'corpus-pin classifier separates found-ids from minted-ids (two-sided, on known cases)',
  !corpusReaders.includes(round179) && corpusReaders.includes(entityBinding),
  `probe-round179 (mints four twin fixture ids, never reads the corpus) classified a corpus reader: ` +
    `${corpusReaders.includes(round179)} (want false); ` +
    `probe-import-entity-binding (reads ~/.claude/projects by name) classified a corpus reader: ` +
    `${corpusReaders.includes(entityBinding)} (want true). ` +
    `${corpusReaders.length}/${probeFiles.length} scripts resolve into the live corpus at all.`);

const missingPins = pins.filter((p) => !p.present);
const byProbe = new Map<string, Pin[]>();
for (const p of pins) byProbe.set(p.probe, [...(byProbe.get(p.probe) ?? []), p]);

check('J', 'probes pinning live-corpus session UUIDs, and how many of those pins are dead',
  true,
  `${byProbe.size} probe(s) name ${pins.length} real session UUID(s) in code; ` +
    `${missingPins.length} pin(s) resolve to nothing on disk today. ` +
    `Every surviving pin has a known expiry: 30 d after that session was last appended to.`,
  'measurement');

if (byProbe.size) {
  console.log('\n── Corpus pins (third class — scheduled expiry) ─────────────────\n');
  for (const [probe, ps] of [...byProbe.entries()].sort((a, b) =>
    b[1].filter((p) => !p.present).length - a[1].filter((p) => !p.present).length)) {
    const dead = ps.filter((p) => !p.present).length;
    console.log(`  ${dead}/${ps.length} dead  ${path.basename(probe)}`);
    for (const p of ps) {
      console.log(`              ${p.present ? 'live' : '!!  '} ${p.uuid}` +
        (p.present ? `  mtime ${p.ageDays!.toFixed(1)} d old → expires in ${(30 - p.ageDays!).toFixed(1)} d` : '  ABSENT'));
    }
    console.log('');
  }
}

console.log('\n── Stale-in-code, ranked by how far the subject has moved ───────\n');
for (const r of stale) {
  const worst = Math.max(...r.movedInCode.map((m) => m.n));
  console.log(`  ${String(worst).padStart(3)} commit(s)  ${path.basename(r.probe)}`);
  console.log(`              probe last committed ${r.probeCommit} (${r.probeDate})`);
  for (const m of r.movedInCode) {
    console.log(`              ${m.subject} — ${m.n === -1 ? 'GONE' : `${m.n} commit(s) since`}`);
    if (VERBOSE && m.log) for (const l of m.log.split('\n').slice(0, 5)) console.log(`                  ${l}`);
  }
  console.log('');
}

if (staleCommentsOnly.length) {
  console.log('── Stale-in-comment only ────────────────────────────────────────\n');
  for (const r of staleCommentsOnly) {
    console.log(`  ${path.basename(r.probe)} (${r.probeDate}) — ` +
      r.movedInComments.map((m) => `${path.basename(m.subject)} +${m.n}`).join(', '));
  }
  console.log('');
}

console.log('─────────────────────────────────────────────────────────────────');
console.log(`${checks} checks · ${failures} failed · ${measurements.length} MEAS`);
console.log(`\nNEXT: drive the top of the stale list unmodified. Round 239 §4 — a probe that`);
console.log(`cannot start is not a probe that is passing. Exit code proves the apparatus`);
console.log(`runs; only the figures prove it still measures the same thing.\n`);

process.exit(failures > 0 ? 1 : 0);
