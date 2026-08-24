#!/usr/bin/env node
/**
 * measure-marker-floor.mjs — how often the recall marker shapes occur in text that no
 * marker built them, i.e. the false-positive floor of the recogniser's predicates.
 *
 * Written 2026-08-24 (Round 85) by Daedalus. Must run under `tsx`, not `node`, because it
 * imports `RECALL_MARKER_PHRASES`, `CARRIED_CONTEXT_MAX_MESSAGE_CHARS` and the shipped
 * import parser from TypeScript source. Same reason `probe-recall-tool.mjs` says so.
 *
 *   npx tsx scripts/measure-marker-floor.mjs                       # tracked transcripts (default)
 *   npx tsx scripts/measure-marker-floor.mjs --db .testdata/klatch-main.db
 *   npx tsx scripts/measure-marker-floor.mjs --db a.db --db b.db --transcripts
 *
 * ## Why this file exists rather than a fourth scratch script
 *
 * Rounds 82, 83 and 84 each rebuilt this measurement from scratch and each threw the code
 * away. That was the right discipline for adjudicating a disputed number — Theseus rebuilt
 * my Round 83 rather than checking it, and I rebuilt his Round 84 rather than checking it,
 * and both times the rebuild is what made the agreement worth anything. It is the wrong
 * shape for the *next* run, which is blocked only on a corpus nobody has placed yet
 * (`~/klatch-inbound/dbs/klatch-main.db` copied into `.testdata/`, per Theseus's Round 84
 * §7.3). When that file lands, the question should be one command, not ten minutes of
 * reconstruction by whoever is awake.
 *
 * Rebuilding stays available and stays encouraged: nothing here is a substitute for a
 * second independent implementation when a number is *in dispute*. This is for when it
 * isn't, and the corpus is simply new.
 *
 * ## What it measures, and the three definitions it does not re-type
 *
 *   opener   — a line containing `P.open`. The cheapest possible detector.
 *   matched  — an opener line that `GAP_LINE` or `EDGE_LINE` reads in full.
 *   orphan   — an opener line that neither reads. In `docs/**.md` these are, without
 *              exception so far, a real marker hard-wrapped by a human pasting it into prose.
 *   straddle — a unit over the cap where an opener begins before `CARRIED_CONTEXT_MAX_MESSAGE_CHARS`
 *              and its close falls after, so truncation would sever the marker.
 *   stem     — occurrences of `P.edgeHeaderStem`, the header sentence's invariant fragment.
 *
 * `P` comes from `recall.ts`, the cap from `carried-context.ts`, the patterns from
 * `buildRecogniser`. No literal is re-typed here — that is the defect `RECALL_MARKER_PHRASES`
 * was extracted to remove (Round 58), and a measurement tool with its own copy of the
 * vocabulary is the same defect one level out.
 *
 * ## The positive control is not optional and runs first
 *
 * A stale-pattern zero and a clean-corpus zero print identically. That is the exact failure
 * `REACHABLE_R54` produced for a week. So before any corpus is read, three constructed units
 * are pushed through the same `classify` the corpus goes through, and the run **exits
 * non-zero without reporting** if they do not land in the expected categories. A zero from
 * this script is therefore always a measurement.
 *
 * ## The extraction control, which Round 84 did not have
 *
 * In transcript mode the parser retains about 5% of the transcript's bytes as
 * `messages.content` — the rest is tool results, thinking, sidechains and injections, none
 * of which Klatch stores as a message. A predicate that reads 5% of the corpus and reports
 * zero has the two-meanings-of-zero problem one level out: clean corpus, or shape hiding in
 * the 95%? So transcript mode also reports `--raw` accounting: every tracked byte, no
 * parsing, newline-unescaped so the line predicates apply. Measured 2026-08-24 across the
 * 17 tracked transcripts: 4 112 645 bytes, 0 openers. The discard hides nothing.
 *
 * ## Privacy posture — deliberately different from its two neighbours
 *
 * `inspect-klatch-db.mjs` and `compare-klatch-corpora.mjs` both promise they never select
 * `messages.content`. This one must, because the shape it counts lives in the content. The
 * compensating constraint: it **emits counts only, never a message body**. The one place it
 * prints text is `--show-orphans`, which is off by default, prints at most 120 characters of
 * a line that already matched a marker opener, and exists because an orphan you cannot see
 * is an orphan you cannot attribute. DBs are opened `{ readonly: true, fileMustExist: true }`
 * and no migration is ever run; these corpora span several schema eras, so every column is
 * probed with `PRAGMA table_info` before use.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { buildRecogniser } from './lib/recall-recogniser.mjs';
import { buildFloorClassifier } from './lib/marker-floor.mjs';

const { RECALL_MARKER_PHRASES: P } = await import('../packages/server/src/claude/recall.ts');
const { CARRIED_CONTEXT_MAX_MESSAGE_CHARS: CAP } =
  await import('../packages/server/src/claude/carried-context.ts');
const { parseClaudeCodeSessionFromContent } =
  await import('../packages/server/src/import/parser.ts');

const { patterns } = buildRecogniser(P);
const { tally, runControls } = buildFloorClassifier(P, CAP, patterns);

const argv = process.argv.slice(2);
const dbPaths = argv.flatMap((a, i) => (a === '--db' ? [argv[i + 1]] : []));
const showOrphans = argv.includes('--show-orphans');
// `--docs [ref]` measures `docs/**.md` at a git ref, the proxy corpus Rounds 82-84 argued over.
// Retained for one reason only: it is how this instrument's predicates are shown to be the same
// ones those rounds ran. It is not a corpus anyone should draw a new conclusion from — its unit
// is a file, its cap exposure is an order of magnitude off the corpus the cap applies to, and
// Round 84 §7.4 retired it.
const docsRef = argv.includes('--docs') ? (argv[argv.indexOf('--docs') + 1] || 'HEAD') : null;
// Transcripts are the default corpus, and stay on alongside `--db` only if asked, so that a
// run against a real database reports that database's floor rather than a blended one.
const wantTranscripts = (dbPaths.length === 0 && !docsRef) || argv.includes('--transcripts');

// ── Reporting ─────────────────────────────────────────────────

function report(label, t) {
  const pct = (n) => (t.units ? ((n / t.units) * 100).toFixed(1) + '%' : '—');
  console.log(`\n── ${label} ──`);
  console.log(`  units            ${t.units}`);
  console.log(`  chars            ${t.chars}  (mean ${t.units ? (t.chars / t.units).toFixed(1) : '—'})`);
  // Line-start first, because it is the predicate Rounds 82-84 published; the broad column
  // beside it, because a floor measured only at line start misses the commonest way a human
  // puts the shape into prose. See `lib/marker-floor.mjs` for why both are reported.
  console.log(`  openers          ${t.openers} at line start   |  ${t.openersAnywhere} anywhere on the line`);
  console.log(`  …matched         ${t.matched}                 |  ${t.matchedAnywhere}`);
  console.log(`  …orphans         ${t.orphans}                 |  ${t.orphansAnywhere}`);
  console.log(`  header stem      ${t.stem}`);
  console.log(`  over ${CAP} cap  ${t.over}  (${pct(t.over)})`);
  console.log(`  cap straddles    ${t.straddles}`);
  if (showOrphans && t.orphanLines.length) {
    console.log('  orphan lines:');
    for (const l of t.orphanLines) console.log(`    ${l}`);
  }
}

// ── Positive control — runs before any corpus is read ─────────

/**
 * The control units live in `lib/marker-floor.mjs` beside the classifier they exercise, so
 * that `round85-marker-floor.test.ts` runs the same three and a drift shows up in CI whether
 * or not anyone runs this script. Here the only decision is what to do about a failure:
 * refuse to report, and exit non-zero.
 */
function positiveControl() {
  const { passed, results } = runControls();
  for (const r of results) {
    const c = r.counts;
    console.log(
      `  ${r.passed ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(26)} ` +
      `line-start: openers=${c.openers} matched=${c.matched} orphans=${c.orphans}  |  ` +
      `anywhere: openers=${c.openersAnywhere} orphans=${c.orphansAnywhere}  |  stem=${c.stem}`
    );
  }
  if (!passed) {
    console.error(
      '\nPositive control failed. The predicates no longer reach the categories the build ' +
      'renders, so any zero below would be a stale-pattern zero rather than a clean-corpus ' +
      'one. Refusing to report. Re-derive the patterns from RECALL_MARKER_PHRASES.'
    );
    process.exit(2);
  }
}

// ── Corpus: tracked transcripts, through the shipped parser ───

/**
 * The row rule is read off `queries.ts`'s import insert loop, not invented here: a user row
 * exists iff `turn.userText` is truthy, an assistant row iff there is assistant text *or*
 * artifacts. An artifacts-only assistant row is real and contributes an empty content string,
 * so it counts toward the denominator — dropping it would flatter the per-row rate.
 */
function transcriptCorpus() {
  const files = execSync("git ls-files -- '*.jsonl'", { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);

  const rows = [];
  const raws = [];
  const accounting = [];
  for (const f of files) {
    const raw = readFileSync(f, 'utf8');
    raws.push(raw);
    const parsed = parseClaudeCodeSessionFromContent(raw);
    let n = 0, chars = 0;
    for (const turn of parsed.turns) {
      if (turn.userText) { rows.push(turn.userText); n++; chars += turn.userText.length; }
      if (turn.assistantText || (turn.artifacts && turn.artifacts.length > 0)) {
        rows.push(turn.assistantText || ''); n++; chars += (turn.assistantText || '').length;
      }
    }
    accounting.push({ file: f, bytes: Buffer.byteLength(raw), events: parsed.eventCount, rows: n, chars });
  }
  return { rows, raws, accounting };
}

// ── Corpus: a klatch DB's messages.content ────────────────────

/**
 * `better-sqlite3` is imported lazily — only when a `--db` is actually given — so the default
 * transcript run still works in a checkout where the native module failed to build. Pard hit
 * exactly that on 2026-08-12 running `compare-klatch-corpora.mjs` from a bare clone.
 */
async function dbCorpus(path) {
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    const cols = db.prepare('PRAGMA table_info(messages)').all().map((c) => c.name);
    if (!cols.includes('content')) {
      console.error(`  ${path}: messages table has no content column — schema era not supported, skipped.`);
      return null;
    }
    return db.prepare('SELECT content FROM messages').all().map((r) => r.content || '');
  } finally {
    db.close();
  }
}

// ── Run ───────────────────────────────────────────────────────

console.log('Positive control (constructed from RECALL_MARKER_PHRASES, not pasted):');
positiveControl();

if (wantTranscripts) {
  const { rows, raws, accounting } = transcriptCorpus();
  report(`tracked transcripts → messages.content rows (${accounting.length} files)`, tally(rows));

  const bytes = accounting.reduce((n, a) => n + a.bytes, 0);
  const chars = accounting.reduce((n, a) => n + a.chars, 0);
  const contributing = accounting.filter((a) => a.rows > 0);
  console.log(`\n  extraction: ${chars} of ${bytes} transcript bytes retained as content ` +
    `(${((chars / bytes) * 100).toFixed(2)}%), from ${contributing.length} of ${accounting.length} files`);
  if (contributing.length) {
    const top = contributing.slice().sort((a, b) => b.rows - a.rows)[0];
    console.log(`  largest single source: ${top.file} — ${top.rows} rows, ${top.chars} chars ` +
      `(${((top.chars / chars) * 100).toFixed(1)}% of all content)`);
  }

  // The widest corpus: every tracked byte, no parser. Newlines are unescaped because JSONL
  // stores them as `\n` inside string values, and a line predicate run over the escaped form
  // would see one enormous line and read zero for the wrong reason.
  const raw = tally(raws.map((r) => r.replace(/\\n/g, '\n')));
  console.log(`\n  widest check — all ${bytes} raw bytes, unparsed: ` +
    `openers=${raw.openers} matched=${raw.matched} orphans=${raw.orphans} stem=${raw.stem}`);
  if (raw.openers === 0) {
    console.log('  → the ~95% the parser discards contains no marker shape either, so the ' +
      'retention policy is not what produced the row-level zero.');
  }
}

if (docsRef) {
  // Read via `git cat-file` rather than a checkout, so an arbitrary ref can be measured without
  // touching the working tree.
  const files = execSync(`git ls-tree -r --name-only ${docsRef} -- docs`, { encoding: 'utf8' })
    .trim().split('\n').filter((f) => f.endsWith('.md'));
  const units = files.map((f) =>
    execSync(`git cat-file -p ${docsRef}:"${f}"`, { encoding: 'utf8', maxBuffer: 1 << 28 })
  );
  report(`docs/**.md at ${docsRef} (proxy corpus — retired, see Round 84 §7.4)`, tally(units));
}

for (const path of dbPaths) {
  const contents = await dbCorpus(path);
  if (contents) report(`${path} → messages.content rows`, tally(contents));
}
