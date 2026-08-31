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
 *   opaque   — `--all-tracked` only: a tracked file whose bytes hold compressed content, so this
 *              scan did not reach its text and its five zeros mean "unread", not "clean".
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
import { classifyContainer, decodesLosslessly } from './lib/opaque-container.mjs';
import { explainTsxRequirement } from './lib/tsx-required.mjs';

// Round 126: guarded like the verifiers. Outside the `verify-*` convention, so §(b) could not see
// it until the read population was widened; under plain `node` this line printed a raw
// ERR_MODULE_NOT_FOUND naming `queries.js` as missing — the exact misattribution the guard exists
// to abolish, and the one Round 120 §5 misread as a missing build artifact.
let P, CAP, parseClaudeCodeSessionFromContent;
try {
  ({ RECALL_MARKER_PHRASES: P } = await import('../packages/server/src/claude/recall.ts'));
  ({ CARRIED_CONTEXT_MAX_MESSAGE_CHARS: CAP } =
    await import('../packages/server/src/claude/carried-context.ts'));
  ({ parseClaudeCodeSessionFromContent } =
    await import('../packages/server/src/import/parser.ts'));
} catch (err) {
  explainTsxRequirement(err, import.meta.url);
}

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
// and are mostly not a problem — marker text inside a SQLite page is stored as plain UTF-8 and
// survives the decode, which is the only reason this can stand in for the DB modes at all.
//
// The exception, measured in Round 88 and counted here since Round 89: DEFLATE. A compressed
// container's text is not present in its bytes as a substring at all, so it reads zero for a
// reason that has nothing to do with the corpus being clean — the same two-meanings-of-zero
// problem the positive control exists to solve, and the same one the `unparsed` bucket exists
// to keep visible. So the mode counts `opaque` files and prints file-level coverage rather than
// the byte-level claim it used to make. See `lib/opaque-container.mjs`.
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

/**
 * Refuse to report on an empty file list.
 *
 * Found 2026-08-25 (Round 89) by running `--docs WORKTREE` from `packages/server/` instead of
 * the repo root. `git ls-files -- docs` is resolved relative to the *current directory*, so it
 * matched nothing, and the mode printed a full report with `units 0` and every cell at zero —
 * which reads exactly like a clean compliance check, and is the signal both of us have been
 * using each round to certify that a memo added no marker line.
 *
 * That is the two-meanings-of-zero failure the positive control was built to prevent, arriving
 * through the corpus rather than through the predicates: the patterns were fine, there was
 * simply nothing to apply them to. A control that can be passed by measuring nothing is worse
 * than no control, because it is trusted. Every enumerating mode is therefore required to find
 * at least one file, and dies non-zero rather than reporting if it does not.
 */
function requireNonEmpty(files, what) {
  if (files.length) return;
  console.error(
    `\n${what}: enumerated 0 files. Refusing to report — an all-zero table over an empty ` +
    `corpus is indistinguishable from a clean one, and this mode is used as a compliance ` +
    `check.\nThe usual cause is the working directory: git pathspecs here resolve relative ` +
    `to it. Run from the repository root.`
  );
  process.exit(3);
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
  requireNonEmpty(files, `--docs ${docsRef}`);
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
  requireNonEmpty(files, '--all-tracked');
  // Tallied one file at a time rather than mapped into an array first: the tracked set includes
  // several megabytes of PNG and two SQLite backups, and holding every decoded string at once is
  // needless when `tally` only ever needs one.
  //
  // Three self-measurements ride along, added in Round 89 at Theseus's Round 88 §5 request. All
  // three exist to make the mode's *own* reach a number rather than a sentence:
  //   onDisk   — what the files actually weigh, which is the only honest denominator.
  //   decoded  — what this scan handled, after a lossy UTF-8 decode and the newline unescape.
  //              It is not a corpus size and is printed only so the gap to `onDisk` is visible.
  //   opaque   — files whose text this scan provably did not reach. See `lib/opaque-container.mjs`.
  let onDisk = 0;
  let decoded = 0;
  let lossy = 0;
  const opaque = [];
  // A container the walk could not finish and in which it saw no compressed entry is neither
  // opaque nor known-reached: a compressed entry may lie past where it stopped. Counting it as
  // reached would rebuild, for one file, the unfalsifiable zero this mode stopped printing for
  // the corpus (Round 91). It gets its own bucket so the count that moves is visible.
  const indeterminate = [];
  const t = tally((function* () {
    for (const f of files) {
      const buf = readFileSync(f);
      onDisk += buf.length;
      const raw = buf.toString('utf8');
      if (!decodesLosslessly(buf, raw)) lossy++;
      const container = classifyContainer(buf);
      if (container.opaque) opaque.push({ file: f, ...container });
      else if (container.kind !== 'plain' && !container.complete) indeterminate.push({ file: f, ...container });
      // Newlines unescaped for the same reason transcript `--raw` does it: JSONL and JSON store
      // them as `\n` inside string values, and a line predicate over the escaped form sees one
      // enormous line and reads zero for the wrong reason.
      const text = raw.replace(/\\n/g, '\n');
      decoded += Buffer.byteLength(text);
      yield text;
    }
  })());
  report(`every tracked file, raw bytes, no parser (${files.length} files) — enumeration check`, t);
  // The claim this mode used to print was "nothing tracked is outside it", which no measurement
  // could have contradicted. What it can actually support is file-level completeness plus a
  // counted byte-level exception, so that is what it says now.
  console.log(`\n  ${files.length} of ${files.length} tracked files enumerated — the list is git's, not`);
  console.log('  a human\'s, so a corpus omitted from someone\'s list is still counted here. It');
  console.log('  subsumes the transcript, --docs and --db modes for opener-shape purposes.');
  console.log(`  ${onDisk} bytes on disk; ${decoded} scanned after decode+unescape.`);
  console.log(`  ${lossy} files decode lossily (PNG, MP4, the SQLite backups) — still searchable:`);
  console.log('  marker text inside a SQLite page is plain UTF-8 and survives the decode.');
  if (opaque.length) {
    console.log(`\n  opaque            ${opaque.length}  (compressed containers — text NOT reached by this scan)`);
    for (const o of opaque) {
      console.log(`    ${o.kind}  ${o.compressed}/${o.entries}${o.complete ? '' : '+'} entries compressed  ${o.file}`);
    }
    console.log('  These read 0 in all five categories for a reason that is not corpus cleanliness.');
    console.log('  Round 88 measured the loss from outside: 0 of 17 and 0 of 29 inflated lines are');
    console.log('  findable in the raw decode of the two claude-ai fixtures. File-level coverage is');
    console.log('  complete; byte-level coverage is short by these, and that bound is what moves.');
  } else {
    console.log('\n  opaque            0  (no tracked file is a compressed container)');
  }
  if (indeterminate.length) {
    console.log(`\n  indeterminate     ${indeterminate.length}  (container walk stopped early having seen no compressed entry)`);
    for (const i of indeterminate) {
      console.log(`    ${i.kind}  ${i.compressed}/${i.entries}+ entries compressed  ${i.file}`);
    }
    console.log('  Not counted as reached: a compressed entry may sit past where the walk stopped,');
    console.log('  so the 0 above it is the absence of a finding and not one. See lib/opaque-container.mjs.');
  }
  if (t.unparsed === 0) {
    // Scoped to what was actually read. Saying "across every tracked byte" here would re-make,
    // in the conclusion, the claim the paragraph above just retired.
    console.log(`  → unparsed=0 across every byte this scan read (${files.length - opaque.length - indeterminate.length} of ${files.length} files): no`);
    console.log('    line there carries a complete anchored marker the current patterns cannot read.');
    if (opaque.length) {
      console.log(`    Unmeasured: the ${opaque.length} opaque files above. Inflate them to close this.`);
    }
    if (indeterminate.length) {
      console.log(`    Also excluded: the ${indeterminate.length} indeterminate above — read, but not provably in full.`);
    }
  }
}
