#!/usr/bin/env node
// unit-464addarm — the real, SITE-level price of curing `SELECTOR_WIDE` arm [3].
//
// Daedalus's 11/04 START §7 routed me the 8-of-18 `--diff-filter=A` files, with his own limit
// stated in his RESULTS §5: the 8 is a FILE-level co-occurrence, not an attribution. This
// enumerates every arm-[3] MATCH SITE in the 18 files he named, so the spans can be hand read.
//
// STAGE 1 (this blob): the blocking reproduction gate + the global site enumeration + the dump.
// NO CLASSIFIER EXISTS IN THIS BLOB. The hand read (`HAND-ARM3.tsv`) is filed from this dump, in
// its own commit, BEFORE any classifier is written — so the classifier is what gets graded.
// [[feedback_small_population_hand_reading_is_primary]]
//
// THREE PINS, because the key, the sites and the answer key are three different questions:
//   SUBJ_PIN — where arm [3] itself comes from (his committed source)
//   POP_PIN  — where the files come from (the rev his published figure was measured over)
//   REC_PIN  — where his recorded 40/18/8 and the 18 NAMES come from (his committed .out)
// [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
//
// Every key is LIFTED by anchored slice from committed source and evaluated, never retyped. His
// row tokens are indented and flag-padded, so the 18 names are CAPTURED by parsing his .out, not
// transcribed. A failed lift or a failed parse is UNRUNNABLE, not degraded.
// [[feedback_slicing_the_inputs_but_retyping_the_verdict]]
// [[feedback_an_aligned_row_token_is_padded_so_capture_it_dont_type_it]]

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Read from THIS worktree. Worktrees of one repo share the object database, and every read below
// is `git show <pin>:<path>` — against a PIN, never against anyone's working tree. Reading his pin
// from my tree is the same bytes and is reproducible from any clone.
// [[feedback_a_node_modules_citation_is_an_address_only_in_the_tree_that_wrote_it]]
const ROOT = '/Users/xian/Development/klatch-worktrees/theseus';
const SUBJ_PIN = process.env.SUBJ_PIN ?? '268457d1';
const POP_PIN = process.env.POP_PIN ?? '0ae48068';
const REC_PIN = process.env.REC_PIN ?? '3dbae1eb';
const SUBJ_REL = 'docs/research/unit-464presc-2026-11-03/census-presc.mjs';
const REC_REL = 'docs/research/unit-464kpspan-2026-11-04/drive3.negfix-depth1.out';
const HIS_DIR = 'unit-464kpspan-2026-11-04';   // the dir HIS arm excluded (its own)
const SELF_DIR = 'unit-464addarm-2026-11-04';  // and mine, so this unit cannot enter its own population

const argv = process.argv.slice(2);
const CRIPPLE = (argv.find((a) => a.startsWith('--cripple=')) ?? '').replace('--cripple=', '');

// stderr is PIPED, not inherited: a child's stderr inherited into this process would be echoed
// into the recording and read as this instrument's own output.
// [[feedback_execfilesync_echoes_child_stderr_into_your_recording]]
const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gitq = (args) => { try { return git(args); } catch { return null; } };

// Legs STREAM as they are checked, so a run that dies still leaves a diagnostic record — his own
// drive1 lost five already-passing blocking legs to a `die()` before the legs table.
// [[feedback_exit_0_without_a_summary_line_is_not_a_measurement]]
const legs = [];
const emit = (state, name, note) => {
  legs.push({ name, state, note });
  console.log(`  ${state.padEnd(5)} ${name.padEnd(13)} ${note}`);
  return state === 'GREEN';
};
const check = (name, pass, note) => emit(pass ? 'GREEN' : 'RED', name, note);
const die = (why) => { console.error(`UNRUNNABLE: ${why}`); process.exit(2); };

console.log('unit-464addarm — every arm-[3] MATCH SITE in the 18 files, enumerated for hand reading');
console.log(`SUBJ_PIN=${SUBJ_PIN}  POP_PIN=${POP_PIN}  REC_PIN=${REC_PIN}  CRIPPLE=${CRIPPLE || '(none)'}`);
console.log(`instrument blob (worktree copy of this file): ${git(['hash-object', fileURLToPath(import.meta.url)]).trim()}`);
console.log('');
console.log('legs, streaming as they are checked:');

// ───────────────────────────── stage 0: the bootstrap slicer, then CHECK it against the subject's own
//
// Something has to take the first cut, so the bootstrap is hand written — and then checked. The
// SUBJECT's own committed `sliceFrom` is lifted with the bootstrap, evaluated, and re-run over the
// same anchors; every slice must come back BYTE-IDENTICAL.
// [[feedback_a_hand_typed_reader_is_not_a_slice]]
function bootSlice(src, startAnchor, endAnchor, label) {
  const lines = src.split('\n');
  const hits = lines.filter((l) => l === startAnchor).length;
  if (hits !== 1) die(`lift ${label}: start anchor found ${hits} times, need exactly 1`);
  const a = lines.indexOf(startAnchor);
  let b = -1;
  for (let i = a + 1; i < lines.length; i++) if (lines[i] === endAnchor) { b = i; break; }
  if (b < 0) die(`lift ${label}: terminator ${JSON.stringify(endAnchor)} not found after start`);
  return lines.slice(a, b + 1).join('\n');
}

const subjSrc = gitq(['show', `${SUBJ_PIN}:${SUBJ_REL}`]);
if (subjSrc === null) die(`cannot read the subject ${SUBJ_REL} at ${SUBJ_PIN}`);

const LIFTS = [
  ['sliceFrom',     subjSrc, 'function sliceFrom(src, startAnchor, endAnchor, label) {', '}'],
  ['SELECTOR_WIDE', subjSrc, 'const SELECTOR_WIDE = [', '];'],
];
const lifted = {};
const liftReport = [];
for (const [name, src, a, b] of LIFTS) {
  lifted[name] = bootSlice(src, a, b, name);
  liftReport.push(`${name}(${lifted[name].split('\n').length}L)`);
}

// DEFECT OF MINE, drive1, kept in the record: my first version of this block could ONLY go RED.
// The subject's `sliceFrom` closes over `die` (not in a `new Function` scope unless injected) and
// returns `{ text, lines }` (not a string), so my `mine === lifted[name]` compared an object to a
// string and my bare `catch { return false }` swallowed the ReferenceError that said so. A BLOCKING
// leg that cannot go green fails closed rather than laundering anything — but it grades nothing,
// and "the bootstrap disagrees" was a false reason. Both repairs are lifted from how HIS OWN
// passing control does it (`grade-kpspan.mjs:132-145`: inject `die`, accept `.text`), so this is
// his committed semantics and not a threshold fitted to make my own leg pass.
// [[feedback_a_guard_on_identity_does_not_guard_value]]
let K;
try {
  K = new Function('die', `
    ${lifted.sliceFrom}
    ${lifted.SELECTOR_WIDE}
    return { sliceFrom, SELECTOR_WIDE };
  `)(die);
} catch (e) {
  die(`lifted subject fragments do not parse: ${e.message}`);
}

// The subject's OWN slicer, re-run over the same anchors. Byte-identical or the bootstrap is the
// weak link and this run is not entitled to report a figure. A throw is reported as a throw, not
// collapsed into a disagreement.
const bootDisagree = [];
for (const [name, src, a, b] of LIFTS) {
  let theirs;
  try { theirs = K.sliceFrom(src, a, b, name); }
  catch (e) { die(`the subject's own sliceFrom THREW on ${name}: ${e.message}`); }
  const theirText = typeof theirs === 'string' ? theirs : theirs?.text;
  if (theirText !== lifted[name]) bootDisagree.push(name);
}
if (!check('GBOOT', bootDisagree.length === 0,
  `the subject's own committed sliceFrom, lifted and re-run over the same ${LIFTS.length} anchors, ` +
  `agrees BYTE-IDENTICALLY with my hand-written bootstrap on every slice ` +
  `(disagreements: ${bootDisagree.length ? bootDisagree.join(',') : 'none'})`)) {
  die(`bootstrap slicer disagrees with the subject's own slicer on: ${bootDisagree.join(',')}`);
}

check('GLIFT', liftReport.length === LIFTS.length, `${LIFTS.length} fragments lifted (subject at ${SUBJ_PIN}): ${liftReport.join(' ')}`);

const SELECTOR_WIDE = K.SELECTOR_WIDE;
if (!check('GARMS', Array.isArray(SELECTOR_WIDE) && SELECTOR_WIDE.length === 4
    && SELECTOR_WIDE[3] instanceof RegExp && /--format=%/.test(SELECTOR_WIDE[3].source),
    `the lifted key is the published one: SELECTOR_WIDE ${SELECTOR_WIDE?.length} arms, ` +
    `arm [3] = ${SELECTOR_WIDE?.[3]?.source}`)) {
  die('the lifted SELECTOR_WIDE is not the published 4-arm key');
}
const ARM3 = SELECTOR_WIDE[3];

// ───────────── stage 1: his recorded answer key, CAPTURED out of his committed .out — not retyped
const recSrc = gitq(['show', `${REC_PIN}:${REC_REL}`]);
if (recSrc === null) die(`cannot read his recording ${REC_REL} at ${REC_PIN}`);

const recLines = recSrc.split('\n');

// DEFECT OF MINE, drive1, kept in the record: my first parse searched the WHOLE recording for
// `wide-selector files`, and his P6REPRO leg note carries that same label earlier in the file —
// ending `(pub 40)`, so my trailing-number capture returned null and GANSWERKEY went RED for a
// reason that had nothing to do with his recording. A display line shadowed the row I wanted. The
// parse is now anchored on the SECTION (`P5 (MEASUREMENT …`) and reads only inside its block.
// [[feedback_a_display_field_can_shadow_the_join_key]]
// [[feedback_anchor_a_shared_file_insert_on_the_section_not_a_string]]
const p5Start = recLines.findIndex((l) => /^P5 \(MEASUREMENT/.test(l));
if (p5Start < 0) die('his P5 section header is not in the recording — the answer key cannot be captured');
let p5End = recLines.length;
for (let i = p5Start + 1; i < recLines.length; i++) if (recLines[i].trim() === '') { p5End = i; break; }
const p5Block = recLines.slice(p5Start, p5End);

// His three counts, captured out of HIS OWN rows inside that block, never typed into this file.
const numAfter = (re) => {
  const l = p5Block.find((x) => re.test(x));
  const m = l && l.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
};
const hisSel = numAfter(/wide-selector files\s/);
const hisOnly3 = numAfter(/held ONLY by arm \[3\]/);
const hisAdd = numAfter(/…of those, carrying --diff-filter=A/);

// His 18 rows: every `*.mjs` row inside the same block. The `ADD ` flag is padding on an aligned
// row, so it is parsed off rather than assumed by column position.
const hisRows = [];
for (const l of p5Block) {
  if (!/\.mjs\s*$/.test(l)) continue;
  const m = l.match(/^\s+(ADD\s+)?(\S+\.mjs)\s*$/);
  if (!m) die(`his P5 row does not parse: ${JSON.stringify(l)}`);
  hisRows.push({ rel: `docs/research/${m[2]}`, add: Boolean(m[1]) });
}
const hisOnly3Set = new Set(hisRows.map((r) => r.rel));
const hisAddSet = new Set(hisRows.filter((r) => r.add).map((r) => r.rel));

if (!check('GANSWERKEY', hisSel !== null && hisOnly3 !== null && hisAdd !== null
    && hisRows.length === hisOnly3 && hisAddSet.size === hisAdd,
    `his answer key captured from ${REC_REL} at ${REC_PIN}: selector files ${hisSel} · ` +
    `arm-[3]-only ${hisOnly3} (${hisRows.length} rows parsed) · ADD-flagged ${hisAdd} ` +
    `(${hisAddSet.size} flags parsed) — counts and rows are mutually consistent in HIS recording`)) {
  die('his recorded counts and his recorded rows disagree with each other — the answer key is not self-consistent');
}

// ────────────────────────────────────── stage 2: the population, re-derived at POP_PIN from scratch
const tree = git(['ls-tree', '-r', '--name-only', POP_PIN, '--', 'docs/research/']).trim().split('\n').filter(Boolean);
const allMjs = tree.filter((p) => p.endsWith('.mjs'));
const dirOf = (p) => p.split('/')[2];
// His selector population is `popWithPresc`: every .mjs under docs/research/ at POP_PIN except his
// own unit dir. Mine is excluded too, so this unit cannot census its own source.
// [[feedback_an_instrument_does_not_census_its_own_source]]
const pop = allMjs.filter((p) => dirOf(p) !== HIS_DIR && dirOf(p) !== SELF_DIR);

const srcCache = new Map();
const sourceOf = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, gitq(['show', `${POP_PIN}:${rel}`]) ?? '');
  return srcCache.get(rel);
};

const armsOf = (text) => SELECTOR_WIDE.map((r, i) => (r.test(text) ? i : -1)).filter((i) => i >= 0);
const selFilesWide = pop.filter((rel) => SELECTOR_WIDE.some((r) => r.test(sourceOf(rel))));
const only3 = selFilesWide.filter((rel) => {
  const a = armsOf(sourceOf(rel));
  return a.length === 1 && a[0] === 3;
});
const only3Add = only3.filter((rel) => /--diff-filter=A/.test(sourceOf(rel)));

// ───── P1 (BLOCKING): does my population reproduce his, as MEMBER LISTS and not only as counts?
// Two counts that agree over a denominator neither of us re-derived agree vacuously; the member
// list is what makes this a reproduction. [[feedback_compare_member_lists_not_counts]]
const mineOnly3Set = new Set(only3);
const missing = [...hisOnly3Set].filter((r) => !mineOnly3Set.has(r));
const extra = only3.filter((r) => !hisOnly3Set.has(r));
const addMissing = [...hisAddSet].filter((r) => !only3Add.includes(r));
const addExtra = only3Add.filter((r) => !hisAddSet.has(r));
const p1 = pop.length === 310 && selFilesWide.length === hisSel && only3.length === hisOnly3
  && only3Add.length === hisAdd && missing.length === 0 && extra.length === 0
  && addMissing.length === 0 && addExtra.length === 0;
check('P1REPRO', p1,
  `my population at ${POP_PIN} vs his recorded figures: .mjs ${pop.length} (pub 310) · ` +
  `wide-selector files ${selFilesWide.length} (his ${hisSel}) · arm-[3]-only ${only3.length} ` +
  `(his ${hisOnly3}) · ADD ${only3Add.length} (his ${hisAdd}) · ` +
  `arm-[3]-only MEMBER LIST: ${missing.length} of his missing from mine, ${extra.length} of mine ` +
  `not his · ADD MEMBER LIST: ${addMissing.length} missing, ${addExtra.length} extra`);
if (!p1) {
  for (const r of missing) console.log(`        HIS-NOT-MINE  ${r}`);
  for (const r of extra) console.log(`        MINE-NOT-HIS  ${r}`);
  for (const r of addMissing) console.log(`        ADD-HIS-NOT-MINE  ${r}`);
  for (const r of addExtra) console.log(`        ADD-MINE-NOT-HIS  ${r}`);
  die('my population is not his — every figure below would be keyed on a different population ' +
    'from the published sentence');
}

// ─────────────── stage 3: enumerate EVERY arm-[3] match site, globally and non-overlapping
//
// His P5 uses `.test`, which stops at the FIRST match in a file. A file-level verdict built from
// one match cannot say what the file's other matches are. The lazy `{0,240}?` means each match is
// the SHORTEST span from its own start, so a global walk is the honest enumeration.
// [[feedback_enumerate_the_reachable_message_set]]
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;
const sitesIn = (src) => {
  const re = new RegExp(ARM3.source, 'g');
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    re.lastIndex = m.index + Math.max(1, m[0].length);  // non-overlapping, and cannot stall
  }
  return out;
};

// The depth-return fact, computed here as DATA on each site and NOT yet turned into a verdict —
// no classifier exists in this blob. Inside one call the paren/bracket depth never returns to its
// starting depth; a span whose relative depth reaches <= -1 strictly inside has crossed a call
// boundary. Recorded so the hand read can check it, not so it can replace the hand read.
const depthMin = (text) => {
  let d = 0, lo = 0;
  for (let i = 0; i < text.length - 1; i++) {   // strictly inside: the final char cannot count
    const c = text[i];
    if (c === '(' || c === '[' || c === '{') d++;
    else if (c === ')' || c === ']' || c === '}') d--;
    if (d < lo) lo = d;
  }
  return lo;
};

const sites = [];
for (const rel of only3) {
  const src = sourceOf(rel);
  const found = sitesIn(src);
  found.forEach((s, i) => {
    sites.push({
      id: `${rel.replace('docs/research/', '')}#${i + 1}`,
      rel,
      add: only3Add.includes(rel),
      ord: i + 1,
      line: lineOf(src, s.start),
      endLine: lineOf(src, s.end),
      span: s.text,
      spanHasAdd: /--diff-filter=A/.test(s.text),
      depthMin: depthMin(s.text),
    });
  });
  if (found.length === 0) die(`${rel} is in the arm-[3]-only set but a global walk finds 0 matches — ` +
    `the enumerator and the file-level key disagree, which makes the enumeration unusable`);
}

check('P2SITES', sites.length > only3.length,
  `a GLOBAL non-overlapping walk finds ${sites.length} arm-[3] match sites across the ` +
  `${only3.length} files — ${sites.length > only3.length ? 'MORE' : 'NOT more'} than the file ` +
  `count, so a file-level verdict is built from ${sites.length - only3.length} fewer matches than exist`);

// ──────────────────────────────────────────────────────────── the dump the hand read is taken from
console.log('');
console.log(`ENUMERATION — ${sites.length} arm-[3] match sites over ${only3.length} files, for hand reading`);
console.log(`(ADD = the FILE carries --diff-filter=A somewhere; spanADD = THIS SPAN carries it; ` +
  `depthMin = relative paren depth reached strictly inside the span)`);
console.log('');
for (const s of sites) {
  const src = sourceOf(s.rel);
  const all = src.split('\n');
  const from = Math.max(0, s.line - 3), to = Math.min(all.length, s.endLine + 2);
  console.log(`── ${s.id}   lines ${s.line}-${s.endLine}   file:${s.add ? 'ADD' : '---'}  ` +
    `spanADD:${s.spanHasAdd ? 'YES' : 'no '}  depthMin:${s.depthMin}`);
  console.log(`   SPAN: ${JSON.stringify(s.span)}`);
  for (let i = from; i < to; i++) {
    const mark = (i + 1 >= s.line && i + 1 <= s.endLine) ? '>' : ' ';
    console.log(`   ${mark}${String(i + 1).padStart(5)}| ${all[i]}`);
  }
  console.log('');
}

// ─────────────────────────────────────────────────────── a machine-readable skeleton for the TSV
console.log('TSV-SKELETON (site id, file-ADD flag, span-ADD flag, depthMin — CLASS column left blank for the hand read)');
console.log('site_id\tfile_add\tspan_add\tdepth_min\tlines\tCLASS\tNOTE');
for (const s of sites) {
  console.log(`${s.id}\t${s.add ? 'ADD' : '-'}\t${s.spanHasAdd ? 'ADD' : '-'}\t${s.depthMin}\t${s.line}-${s.endLine}\t\t`);
}
console.log('');

const reds = legs.filter((l) => l.state === 'RED');
console.log('tally:');
for (const l of legs) console.log(`  ${l.state} ${l.name}`);
console.log('');
console.log(`STAGE 1 — ${legs.length} legs, ${reds.length} RED. No classifier exists in this blob; ` +
  `P3a/P3b/P4/P5/P6/P7 and the cripple are NOT run here, by design.`);
console.log(`[SUBJ_PIN=${SUBJ_PIN} POP_PIN=${POP_PIN} REC_PIN=${REC_PIN} CRIPPLE=${CRIPPLE || 'none'}]`);
