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
 *   opener line — a line containing `P.open`. The cheapest possible detector, and the
 *              population the five categories partition.
 *   read     — `GAP_LINE` or `EDGE_LINE` reads the whole trimmed line.
 *   severed  — opener at column zero, no close on the line. A marker that was cut.
 *   unparsed — opener at column zero, close present, read by neither pattern. Drift.
 *   embedded — opener past column zero, close on the same line. Quoted whole inside prose.
 *   residue  — opener past column zero, no close. Undecidable; `digitless` usually settles it.
 *   straddle — a unit over the cap where an opener begins before `CARRIED_CONTEXT_MAX_MESSAGE_CHARS`
 *              and its close falls after, so truncation would sever the marker.
 *   stem     — occurrences of `P.edgeHeaderStem`, the header sentence's invariant fragment.
 *
 * Round 87 replaced Round 85's two opener predicates with these five categories, after Theseus
 * showed (Round 86 §2-3) that one of the six columns was a provable copy of another and that
 * the difference between the other two merged severing with quoting. Every Round 82-85 column
 * is still printed, derived from the five; the reparameterisation costs no comparability.
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
const { tally, runControls, BUCKETS } = buildFloorClassifier(P, CAP, patterns);

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
// `--all-tracked` answers a different question from every other mode: not "what is the floor in
// this corpus" but "have we enumerated the corpora correctly". Rounds 84 and 86 both turned on a
// corpus that was tracked in git the whole time and simply absent from someone's list — the 17
// transcripts, then `backups/klatch.db.backup-2026-03-14`. A third such miss is cheap to make and
// expensive to argue about, so the enumeration stops being a list a human maintains: this reads
// *every* tracked file as raw bytes, no parser, no extension filter. Binary files are read too
// and are not a problem — marker text inside a SQLite page is stored as plain UTF-8 and survives
// the decode, which is the only reason this can stand in for the DB modes at all.
//
// It is deliberately not a floor measurement. `docs/**.md` is in it, and our own memos about
// markers are in `docs/`, so the total is not expected to be zero. What the five categories buy
// here is that a non-zero total is still readable: `read`/`embedded` are us writing about markers,
// and `unparsed` is the cell that must stay zero.
const allTracked = argv.includes('--all-tracked');
const wantTranscripts =
  (dbPaths.length === 0 && !docsRef && !allTracked) || argv.includes('--transcripts');

// ── Reporting ─────────────────────────────────────────────────

function report(label, t) {
  const pct = (n) => (t.units ? ((n / t.units) * 100).toFixed(1) + '%' : '—');
  console.log(`\n── ${label} ──`);
  console.log(`  units            ${t.units}`);
  console.log(`  chars            ${t.chars}  (mean ${t.units ? (t.chars / t.units).toFixed(1) : '—'})`);
  // The five categories are the headline, because they name mechanisms and partition the
  // population; Rounds 82-85's two opener predicates are printed underneath as arithmetic over
  // them, so a reader holding those printouts can still line the cells up. See
  // `lib/marker-floor.mjs` for why the reparameterisation happened.
  const d = t.digitless;
  console.log(`  opener lines     ${t.openersAnywhere}`);
  console.log(`  …read            ${t.read}`);
  console.log(`  …severed         ${t.severed}   (col 0, no close — cut)              digitless ${d.severed}`);
  console.log(`  …unparsed        ${t.unparsed}   (col 0, closed, unread — drift)      digitless ${d.unparsed}`);
  console.log(`  …embedded        ${t.embedded}   (mid-line, closed — quoted whole)    digitless ${d.embedded}`);
  console.log(`  …residue         ${t.residue}   (mid-line, no close — undecidable)   digitless ${d.residue}`);
  console.log(`  header stem      ${t.stem}`);
  console.log(`  over ${CAP} cap  ${t.over}  (${pct(t.over)})`);
  console.log(`  cap straddles    ${t.straddles}`);
  console.log(`  ── as Rounds 82-85 reported it (derived, not remeasured) ──`);
  console.log(`  openers          ${t.openers} at line start   |  ${t.openersAnywhere} anywhere on the line`);
  console.log(`  …matched         ${t.matched}                 |  ${t.matchedAnywhere}`);
  console.log(`  …orphans         ${t.orphans}                 |  ${t.orphansAnywhere}`);
  if (showOrphans && t.unreadLines.length) {
    console.log('  unread opener lines:');
    for (const u of t.unreadLines) console.log(`    ${u.bucket.padEnd(9)} ${u.line}`);
  }
}

// ── Positive control — runs before any corpus is read ─────────

/**
 * The control units live in `lib/marker-floor.mjs` beside the classifier they exercise, so
 * that `round85-marker-floor.test.ts` runs the same set and a drift shows up in CI whether
 * or not anyone runs this script. Here the only decision is what to do about a failure:
 * refuse to report, and exit non-zero.
 */
function positiveControl() {
  const { passed, results } = runControls();
  for (const r of results) {
    const c = r.counts;
    const landed = BUCKETS.filter((b) => c[b] > 0).map((b) => `${b}=${c[b]}`).join(' ') || 'none';
    console.log(
      `  ${r.passed ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(38)} ${landed.padEnd(12)}  |  ` +
      `legacy: openers=${c.openers}/${c.openersAnywhere} matched=${c.matched} ` +
      `orphans=${c.orphans}/${c.orphansAnywhere}  |  stem=${c.stem}`
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
  // `--docs WORKTREE` measures the working tree instead of a ref, which is the *compliance*
  // check rather than a corpus measurement: both Theseus and I have to confirm each round that
  // the memo and research doc we are about to commit added no marker line of their own. Every
  // round so far that has been hand-rolled at the shell, and a hand-rolled step is one whose
  // file list can quietly be wrong — plain `git ls-files` reports only the tracked set and omits
  // the two new files that are the entire point of the check, which is why the untracked half of
  // this glob is spelled out. (Theseus's Round 86 §7 note; adopted here so nobody re-derives it.)
  let files, read;
  if (docsRef === 'WORKTREE') {
    files = execSync('git ls-files --cached --others --exclude-standard -z -- docs', {
      encoding: 'utf8', maxBuffer: 1 << 28,
    }).split('\0').filter((f) => f.endsWith('.md'));
    read = (f) => readFileSync(f, 'utf8');
  } else {
    // Read via `git cat-file` rather than a checkout, so an arbitrary ref can be measured without
    // touching the working tree.
    files = execSync(`git ls-tree -r --name-only ${docsRef} -- docs`, { encoding: 'utf8', maxBuffer: 1 << 28 })
      .trim().split('\n').filter((f) => f.endsWith('.md'));
    read = (f) => execSync(`git cat-file -p ${docsRef}:"${f}"`, { encoding: 'utf8', maxBuffer: 1 << 28 });
  }
  const label = docsRef === 'WORKTREE'
    ? 'docs/**.md in the working tree, tracked + untracked (compliance check)'
    : `docs/**.md at ${docsRef} (proxy corpus — retired, see Round 84 §7.4)`;
  report(label, tally(files.map(read)));
}

for (const path of dbPaths) {
  const contents = await dbCorpus(path);
  if (contents) report(`${path} → messages.content rows`, tally(contents));
}

if (allTracked) {
  // `-z`, not the default: `git ls-files` C-quotes any path with a non-ASCII byte in it, and
  // this repo has several (`QA/Screenshot …‑AM 2.png` carries a narrow no-break space). Parsing
  // the quoted form back would be a second place to get UTF-8 wrong, so ask for it raw. Found by
  // the first run of this mode crashing on exactly that file — which is itself the point of the
  // mode: an enumeration that silently skipped unreadable paths would be the miss it exists to
  // prevent, so it fails loudly instead.
  const files = execSync('git ls-files -z', { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0').filter(Boolean);
  // Tallied one file at a time rather than mapped into an array first: the tracked set includes
  // several megabytes of PNG and two SQLite backups, and holding every decoded string at once is
  // needless when `tally` only ever needs one.
  let bytes = 0;
  const t = tally((function* () {
    for (const f of files) {
      // Newlines unescaped for the same reason transcript `--raw` does it: JSONL and JSON store
      // them as `\n` inside string values, and a line predicate over the escaped form sees one
      // enormous line and reads zero for the wrong reason.
      const text = readFileSync(f, 'utf8').replace(/\\n/g, '\n');
      bytes += Buffer.byteLength(text);
      yield text;
    }
  })());
  report(`every tracked file, raw bytes, no parser (${files.length} files) — enumeration check`, t);
  console.log(`\n  ${bytes} bytes read. This is the widest corpus reachable from inside the`);
  console.log('  sandbox; nothing tracked is outside it. It subsumes the transcript, --docs and');
  console.log('  --db modes for opener-shape purposes, so a corpus omitted from someone\'s list');
  console.log('  is still counted here.');
  if (t.unparsed === 0) {
    console.log('  → unparsed=0 across every tracked byte: no line anywhere in the repo carries a');
    console.log('    complete anchored marker that the current patterns cannot read.');
  }
}
