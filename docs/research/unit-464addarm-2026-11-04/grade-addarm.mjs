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
      start: s.start,
      end: s.end,
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

// ═════════════════════════════════════ stage 4: the classifier (addendum 1), and what grades it
//
// ADDENDUM 1: his unit is the FILE (too wide, his own stated limit); mine was the SPAN (too narrow
// — arm [3]'s match STARTS at `--format=`, and this corpus puts git's flags before it). The unit
// that decides is the enclosing CALL.

// The enclosing call, by a mechanical bracket-depth scan — not by eye and not by line.
const enclosingCall = (src, start, end) => {
  let d = 0, open = -1;
  for (let i = start - 1; i >= 0; i--) {
    const c = src[i];
    if (c === ')' || c === ']' || c === '}') d++;
    else if (c === '(' || c === '[' || c === '{') { if (d === 0) { open = i; break; } d--; }
  }
  if (open < 0) return null;
  let d2 = 0, close = -1;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') d2++;
    else if (c === ')' || c === ']' || c === '}') { d2--; if (d2 === 0) { close = i; break; } }
  }
  if (close < 0 || close < end) return null;
  return src.slice(open, close + 1);
};

// The classifier, as the addendum's BRANCH LITERALS. `R` is the FALL-THROUGH, so it absorbs every
// blindness above it and P6 is what measures how much.
// [[feedback_derive_the_verdict_predicate_from_the_branch_literals]]
// [[feedback_a_fall_through_terminal_bucket_absorbs_every_blindness]]
const classOf = (site, addText) => {
  if (site.depthMin <= -1) return 'W';
  if (/--diff-filter=A/.test(addText)) return 'A';
  return 'R';
};
// CRIPPLE=wholefile degrades the ADD test's unit from the CALL back to the FILE — his unit, one
// level up. A switch on the key, not the subject.
// DEFECT OF MINE, drive2, kept in the record: my first version of this fell back to `?? site.span`
// when `enclosingCall` returned null — and the sites never recorded `start`/`end` at all, so the
// scan ran on `undefined`, returned null for all 20, and EVERY site silently got the span-level
// unit the addendum exists to replace. P3aCALL printed 7 over-credits against my hand read's 1 and
// looked like a measurement. A fallback to the exact unit under repair is not a fallback, so the
// null case is now UNRUNNABLE instead of silent. [[topic_refusal_and_sentinels]]
const addTextFor = (site) => {
  if (CRIPPLE === 'wholefile') return sourceOf(site.rel);
  const src = sourceOf(site.rel);
  const call = enclosingCall(src, site.start, site.end);
  if (call === null) die(`no enclosing call found for ${site.id} (chars ${site.start}-${site.end}) — ` +
    `falling back to the SPAN here would silently restore the very unit addendum 1 replaces`);
  return call;
};

// ───── P7 (BLOCKING): one witness per class, and a refused negative. Each carries the property.
// KP-A and KP-R are HIS OWN committed literals, lifted from his instrument — not analogies, and
// not retyped. [[feedback_a_known_positive_must_carry_the_property_not_an_analogy]]
const kpSrc = gitq(['show', `${REC_PIN}:docs/research/unit-464kpspan-2026-11-04/grade-kpspan.mjs`]);
if (kpSrc === null) die(`cannot read his instrument at ${REC_PIN} to lift KP-A and KP-R`);
const liftDecl = (name) => {
  const hits = kpSrc.split('\n').filter((l) => new RegExp(`^const ${name} = `).test(l));
  if (hits.length !== 1) die(`lift ${name}: declaration line found ${hits.length} times, need exactly 1`);
  try { return new Function(`${hits[0]}\nreturn ${name};`)(); }
  catch (e) { die(`lift ${name}: does not evaluate: ${e.message}`); }
};
const KP_A = liftDecl('ADD_LINE');
const KP_R = liftDecl('REC_LINE');
// KP-W: two CLOSED calls inside the 240-char window — `--format=%h` in the first, the quoted `--`
// in the second. The span must cross a call boundary, which is what depthMin <= -1 means.
const KP_W = "const a = g(['log','--format=%h']); const b = h(['diff','--']);";
// KN: `--format=%h` with NO quoted `--` within 240 chars. Must yield ZERO sites.
const KN = "const a = g(['log','--format=%h']).trim();";

const classifyText = (text) => {
  const found = sitesIn(text);
  return found.map((s) => {
    const site = { start: s.start, end: s.end, span: s.text, depthMin: depthMin(s.text) };
    const addText = CRIPPLE === 'wholefile' ? text : (enclosingCall(text, s.start, s.end) ?? s.text);
    return { ...site, cls: classOf(site, addText) };
  });
};
const wA = classifyText(KP_A), wR = classifyText(KP_R), wW = classifyText(KP_W), wN = classifyText(KN);
const p7 = wA.length === 1 && wA[0].cls === 'A' && wR.length === 1 && wR[0].cls === 'R'
  && wW.length === 1 && wW[0].cls === 'W' && wN.length === 0;
check('P7WITNESS', p7,
  `one witness per class plus a refused negative: KP-A (HIS committed ADD_LINE, lifted) ` +
  `${wA.length} site(s) class ${wA.map((x) => x.cls).join(',') || '-'} (need 1/A) · ` +
  `KP-R (HIS committed REC_LINE, lifted) ${wR.length}/${wR.map((x) => x.cls).join(',') || '-'} (need 1/R) · ` +
  `KP-W (two closed calls in-window) ${wW.length}/${wW.map((x) => x.cls).join(',') || '-'} ` +
  `(need 1/W, depthMin ${wW[0]?.depthMin ?? 'n/a'}) · KN (no quoted \`--\` in window) ` +
  `${wN.length} sites (need 0)`);
if (!p7) die('the classifier cannot separate the three classes and refuse the negative — no figure ' +
  'below it is reportable');

// ───────────────────────────────────────────── classify the 20 real sites, and the three ADD units
for (const s of sites) {
  s.callText = addTextFor(s);
  s.callHasAdd = /--diff-filter=A/.test(s.callText);
  s.cls = classOf(s, s.callText);
}

// P3a AS ORIGINALLY REGISTERED — keyed on the SPAN. Reported at its own figure and declared
// MISKEYED in the same breath; its GREEN is not claimed as a result.
// [[feedback_a_published_sentence_keyed_on_a_cell_name_is_not_keyed_on_a_measurement]]
const addFiles = only3.filter((r) => only3Add.includes(r));
const nonAddFiles = only3.filter((r) => !only3Add.includes(r));
const spanAttributed = addFiles.filter((r) => sites.some((s) => s.rel === r && s.spanHasAdd));
check('P3aSPAN', spanAttributed.length < addFiles.length,
  `P3a AS REGISTERED (span-keyed, and MISKEYED): of his ${addFiles.length} ADD files, ` +
  `${spanAttributed.length} have a site whose own SPAN carries --diff-filter=A. Threshold met ` +
  `(<${addFiles.length}) — but by an ARTEFACT of arm [3]'s match starting at \`--format=\`, not by ` +
  `a fact about his flag. Repaired as P3aCALL per addendum 1; this leg grades nothing`);

// P3a-CALL — the repair. The over-credit of his file-level flag.
const callAttributed = addFiles.filter((r) => sites.some((s) => s.rel === r && s.callHasAdd));
const overCredited = addFiles.filter((r) => !callAttributed.includes(r));
check('P3aCALL', overCredited.length >= 1,
  `P3a-CALL: of his ${addFiles.length} ADD files, ${callAttributed.length} have an arm-[3] site ` +
  `whose ENCLOSING CALL carries --diff-filter=A. OVER-CREDIT = ${overCredited.length}` +
  (overCredited.length ? ` → ${overCredited.map((r) => r.replace('docs/research/', '')).join(', ')}` : ''));

// ───── the hand read, loaded from its own committed blob at the commit that filed it
const HAND_REL = 'docs/research/unit-464addarm-2026-11-04/HAND-ARM3.tsv';
const HAND_PIN = (gitq(['log', '-1', '--format=%H', '--', HAND_REL]) ?? '').trim();
if (!HAND_PIN) die(`the hand read ${HAND_REL} has no commit — it must be filed BEFORE this classifier runs`);
const handSrc = gitq(['show', `${HAND_PIN}:${HAND_REL}`]);
if (handSrc === null) die(`cannot read the hand read at its own pin ${HAND_PIN}`);
const hand = new Map();
for (const l of handSrc.split('\n')) {
  if (l.startsWith('#') || l.startsWith('site_id') || l.trim() === '') continue;
  const c = l.split('\t');
  if (c.length < 7) continue;
  hand.set(c[0], { file_add: c[1], span_add: c[2], call_add: c[3], depth_min: Number(c[4]), cls: c[6] });
}
if (!check('GHANDPIN', hand.size === sites.length,
    `hand read loaded from its OWN committed blob at ${HAND_PIN.slice(0, 8)} (not the worktree copy): ` +
    `${hand.size} rows for ${sites.length} sites`)) {
  die('the hand read does not cover every enumerated site');
}

// P3b-CALL — the under-credit: non-ADD files the HAND READ calls stable.
const underCredited = nonAddFiles.filter((r) => sites.some((s) => s.rel === r && hand.get(s.id)?.cls === 'A'));
check('P3bCALL', underCredited.length >= 1,
  `P3b-CALL: of the ${nonAddFiles.length} non-ADD files, ${underCredited.length} carry a site the ` +
  `HAND READ calls stable — a stable anchor his flag is blind to. UNDER-CREDIT = ` +
  `${underCredited.length}` +
  (underCredited.length ? ` → ${underCredited.map((r) => r.replace('docs/research/', '')).join(', ')}` : ''));

// P4 — the window artefact, registered as possibly 0 and reported either way.
const wSites = sites.filter((s) => s.depthMin <= -1);
check('P4WINDOW', wSites.length >= 1,
  `P4: arm-[3] sites whose span CROSSED a call boundary (depthMin <= -1): ${wSites.length} of ` +
  `${sites.length}. ${wSites.length === 0
    ? 'ZERO — registered as possibly 0, and this is that case: the 240-char window CAN fuse two ' +
      'calls (KP-W proves the branch alive) but this corpus does not exercise it. A real negative, ' +
      'reported as one.'
    : wSites.map((s) => s.id).join(', ')}`);

// ───── P6 — the CLASSIFIER graded against the HAND READ. A RED here is the classifier's defect.
const disagree = sites.filter((s) => hand.get(s.id).cls !== s.cls);
check('P6AGREE', disagree.length === 0,
  `P6 — classifier vs HAND READ over ${sites.length} sites: ${sites.length - disagree.length} agree, ` +
  `${disagree.length} disagree. The hand read is the measurement; a disagreement is the ` +
  `CLASSIFIER's defect` +
  (disagree.length ? ` → ${disagree.map((s) => `${s.id} [hand ${hand.get(s.id).cls} / clf ${s.cls}]`).join(' · ')}` : ''));

// ───── P5 — THE REAL PRICE. A MEASUREMENT with no threshold, computed off the HAND READ.
const handClsIn = (rel) => sites.filter((s) => s.rel === rel).map((s) => hand.get(s.id).cls);
const retaining = only3.filter((r) => handClsIn(r).includes('R'));
const fpOnly = only3.filter((r) => !handClsIn(r).includes('R'));
const clfFpOnly = only3.filter((r) => !sites.filter((s) => s.rel === r).some((s) => s.cls === 'R'));
const handTally = { R: 0, A: 0, O: 0, W: 0 };
for (const s of sites) handTally[hand.get(s.id).cls] = (handTally[hand.get(s.id).cls] ?? 0) + 1;

console.log('');
console.log('P5 (MEASUREMENT, no threshold registered) — THE REAL SITE-LEVEL PRICE OF NARROWING ARM [3]:');
console.log(`    arm-[3]-only files (his ceiling)             ${only3.length} of ${selFilesWide.length}  (${(100 * only3.length / selFilesWide.length).toFixed(0)}%)`);
console.log(`    hand-read site classes                       R ${handTally.R} · A ${handTally.A} · O ${handTally.O} · W ${handTally.W}  (of ${sites.length})`);
console.log(`    R-RETAINING files — WRONGLY dropped by a cure  ${retaining.length} of ${selFilesWide.length}  (${(100 * retaining.length / selFilesWide.length).toFixed(0)}%)`);
console.log(`    FP-ONLY files — CORRECTLY dropped by a cure    ${fpOnly.length} of ${selFilesWide.length}  (${(100 * fpOnly.length / selFilesWide.length).toFixed(0)}%)`);
console.log(`    his ADD set and my FP-ONLY set, as MEMBER LISTS (same size is not the same set):`);
console.log(`      |ADD| ${addFiles.length}   |FP-ONLY| ${fpOnly.length}   ADD-not-FP ${addFiles.filter((r) => !fpOnly.includes(r)).length}   FP-not-ADD ${fpOnly.filter((r) => !addFiles.includes(r)).length}`);
for (const r of addFiles.filter((x) => !fpOnly.includes(x))) console.log(`      ADD-but-R-RETAINING  ${r.replace('docs/research/', '')}`);
for (const r of fpOnly.filter((x) => !addFiles.includes(x))) console.log(`      FP-but-NOT-ADD       ${r.replace('docs/research/', '')}`);
console.log('');
console.log('    per-file (hand-read classes, newest-first within file):');
for (const r of only3) {
  const cs = handClsIn(r);
  console.log(`      ${cs.includes('R') ? 'R-RETAIN' : 'FP-ONLY '}  ${only3Add.includes(r) ? 'ADD' : '---'}  ` +
    `[${cs.join(',')}]  ${r.replace('docs/research/', '')}`);
}
console.log('');

// ───────────────────────────────────── the cripple's own threshold, as a FIGURE that must move
if (CRIPPLE === 'wholefile') {
  console.log(`CRIPPLE=wholefile — the ADD test's unit degraded from the CALL back to the FILE:`);
  console.log(`    P3a-CALL numerator (ADD files attributed)    ${callAttributed.length}`);
  console.log(`    classifier FP-ONLY files                     ${clfFpOnly.length}`);
  console.log('');
}
console.log(`FIGURES-FOR-THE-CRIPPLE-DELTA  P3aCALL_numerator=${callAttributed.length} ` +
  `classifier_FP_ONLY=${clfFpOnly.length} classifier_A_sites=${sites.filter((s) => s.cls === 'A').length} ` +
  `classifier_R_sites=${sites.filter((s) => s.cls === 'R').length}`);
console.log('');

const reds = legs.filter((l) => l.state === 'RED');
console.log('tally:');
for (const l of legs) console.log(`  ${l.state} ${l.name}`);
console.log('');
console.log(`STAGE 2 — ${legs.length} legs, ${reds.length} RED. P5 is a MEASUREMENT and carries no ` +
  `verdict; P3aSPAN is reported and declared MISKEYED; P6's RED, if any, is the classifier's defect ` +
  `and the hand read stands.`);
console.log(`[SUBJ_PIN=${SUBJ_PIN} POP_PIN=${POP_PIN} REC_PIN=${REC_PIN} CRIPPLE=${CRIPPLE || 'none'}]`);
