// Klatch memory-index compaction: merge related memories into topic files.
// Bodies are preserved VERBATIM (the pattern topic_cripples_and_counterfactuals.md established).
// Refuses the whole run if any validation fails; backs up before mutating.
//
// USAGE, from a Klatch worktree root (backups land in that worktree's gitignored .scratch/):
//   node docs/operations/memory-merge.mjs --dry    # validate + report, write nothing
//   node docs/operations/memory-merge.mjs          # back up, merge, re-verify
// Override the store with KLATCH_MEMORY_DIR. Edit CLUSTERS below for the next pass; the
// clusters already merged are left in place as a record of what this tool did on 2026-11-15
// and will REFUSE on a second run ("target already exists"), which is the intended idempotence.
//
// First run, 2026-11-15 (Daedalus, WORK fire), measured: 23,929 B / 160 entries -> 18,147 B / 119
// (18,561 B after the index preamble was rewritten). 46 memories absorbed into the 5 clusters
// below, 46 of 46 bodies verified byte-present from the backup, 0 dangling links, 0 orphan files.
// The refusal above is load-bearing: re-running without it would have written 5 EMPTY topic files
// and taken the index to 124 entries / 19,751 B.
import fs from 'node:fs';
import path from 'node:path';

// Store location: overridable so another seat's worktree does not need an edit.
const DIR = process.env.KLATCH_MEMORY_DIR
  || path.join(process.env.HOME, '.claude/projects/-Users-xian-Development-klatch/memory');
const INDEX = path.join(DIR, 'MEMORY.md');
// Backups land in the CALLING worktree's gitignored scratch, not a hardcoded one.
const BACKUP_ROOT = path.join(process.cwd(), '.scratch/memory-backup');
const MAX_TOPIC_BYTES = 45000; // largest pre-existing topic file is 38938 B
const DRY = process.argv.includes('--dry');

const CLUSTERS = [
  {
    slug: 'topic_pins_revs_and_frozen_readings',
    title: 'Pins, revs and frozen readings',
    description: "Pinning a subject vs the instrument's own input, what a frozen reading is scoped by (reader as well as rev), prose pins that predate the prose, CROSS-STATE legs, worktree drift and tree-local addresses",
    index: 'Pins, revs and frozen readings',
    hook: "11: subject vs instrument input take different revs, a frozen reading is scoped by its reader too, a gate's pin can predate the prose, and a leg reading frozen AND live is neither",
    members: [
      'feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev',
      'feedback_a_frozen_readings_scope_includes_the_reader_not_only_the_rev',
      'feedback_a_gates_pin_can_predate_the_prose_it_gates',
      'feedback_a_leg_reading_a_frozen_artefact_and_the_live_subject_is_neither_pin_nor_gate',
      'feedback_an_instrument_reading_live_needs_a_pin_and_a_siblings_live_constant_may_be_that_pin',
      'feedback_a_key_compared_against_a_drive_must_read_the_drives_tree',
      'feedback_a_unit_that_cures_its_own_subject_needs_the_baseline_from_git',
      'feedback_cross_state_splits_and_a_pinned_subject_is_still_a_live_read',
      'feedback_a_worktree_can_be_minors_behind_the_pin',
      'feedback_verbatim_source_pin_is_not_a_property_pin',
      'feedback_a_citation_into_node_modules_is_an_address_only_in_the_tree_that_wrote_it',
    ],
  },
  {
    slug: 'topic_git_and_shell_invocation',
    title: 'git and shell invocation',
    description: 'How a git or shell invocation lies to you: cwd-sensitive ls-tree, log -N with a pathspec, a bare-date --since, git add -A over a scratch dir, argv paths resolved against the child cwd, absorbed inner argv, child stderr in recordings, pipes hiding the exit code, a refused clause voiding the chain, a .db sha blind to the WAL, counting with grep, ls-files populations',
    index: 'git and shell invocation',
    hook: '12: a refused clause voids the whole chain, a pipe hides the head and the exit code, ls-tree is cwd-sensitive, and an argv script path resolves against the child cwd',
    members: [
      'feedback_refused_clause_voids_whole_bash_chain',
      'feedback_pipeline_tail_hides_head_and_exit_code',
      'feedback_git_ls_tree_is_cwd_sensitive_so_pin_minus_c',
      'feedback_git_log_minus_n_with_a_pathspec_is_not_a_rev_range',
      'feedback_a_bare_date_since_is_keyed_on_the_drive_clock',
      'feedback_git_add_minus_a_over_a_unit_dir_tracks_the_scratch_in_it',
      'feedback_an_argv_script_path_resolves_against_the_childs_cwd',
      'feedback_an_enclosing_call_absorbs_its_inner_calls_argv',
      'feedback_execfilesync_echoes_child_stderr_into_your_recording',
      'feedback_a_sha_of_the_db_file_is_blind_to_writes_sitting_in_the_wal',
      'feedback_count_with_readdirsync_not_grep',
      'feedback_a_population_keyed_on_ls_files_is_irreproducible_from_any_rev',
    ],
  },
  {
    slug: 'topic_figure_and_count_drift',
    title: 'Figure and count drift',
    description: 'A published figure going stale beside its own cure: a pin on a count reddening on its promotion, a frozen count beside a count-free predicate, a cured figure leaving a live sentence about the old one, numbers that do not add up in your own sentence, an old cell sourced from HEAD inverting, and a truncating recorder contaminating everything derived from it',
    index: 'Figure and count drift',
    hook: '6: a pin on a count reddens on its own promotion, a frozen count drifts invisibly beside a count-free predicate, and a truncating recorder contaminates every figure derived from it',
    members: [
      'feedback_a_pin_on_a_count_reddens_on_its_own_promotion',
      'feedback_a_frozen_count_in_prose_beside_a_countfree_predicate_drifts_invisibly',
      'feedback_a_cured_figure_can_leave_a_live_sentence_about_the_old_one',
      'feedback_add_up_the_numbers_in_your_own_sentence',
      'feedback_an_old_cell_sourced_from_head_inverts_when_the_cure_lands',
      'feedback_a_truncating_recorder_contaminates_every_figure_derived_from_it',
    ],
  },
  {
    slug: 'topic_reason_strings_and_defect_pins',
    title: 'Reason strings and defect pins',
    description: "A right verdict carried by a false reason: a leg's reason string drifting false while its predicate stays true, a leg asserting the defect reddening on its own cure, prose written beside its own cure, a correction that re-trips the detector by quoting the wrong spelling, a sentence keyed on a cell name rather than a measurement, and a closure line that reads as an open item",
    index: 'Reason strings and defect pins',
    hook: "6: a leg's reason drifts false while its predicate stays true, a leg asserting the defect reddens on its own cure, and a correction quoting the wrong spelling re-trips it",
    members: [
      'feedback_a_legs_reason_string_drifts_false_while_its_predicate_stays_true',
      'feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure',
      'feedback_prose_written_beside_its_own_cure_needs_a_pin',
      'feedback_a_correction_that_quotes_the_wrong_spelling_retrips_the_detector',
      'feedback_a_published_sentence_keyed_on_a_cell_name_is_not_keyed_on_a_measurement',
      'feedback_a_closure_line_reads_as_an_open_item',
    ],
  },
  {
    slug: 'topic_census_and_population_keying',
    title: 'Census and population keying',
    description: "Keying a census: census the mechanism not the reported instance, what your reason lines argue from, a bucket's capacity not its why, a declaration-line key blind to a hoisted pattern, an instrument censusing its own source, measuring what the population already has, two keys sharing a denominator, a scope label that is not a censused surface, enumerating the reachable message set, a display field shadowing the join key, and hand reading as primary in a small population",
    index: 'Census and population keying',
    hook: "11: census the mechanism not the instance, a bucket's capacity not its why, and an instrument does not census its own source",
    members: [
      'feedback_census_the_mechanism_not_just_the_reported_instance',
      'feedback_census_what_your_reason_lines_argue_from_not_only_the_classes',
      'feedback_census_a_buckets_capacity_not_its_why',
      'feedback_a_census_keyed_on_the_declaration_line_cannot_see_a_hoisted_pattern',
      'feedback_an_instrument_does_not_census_its_own_source',
      'feedback_measure_what_the_population_already_has',
      'feedback_two_keys_sharing_a_denominator_agree_vacuously',
      'feedback_a_corpus_scope_label_is_not_a_censused_surface',
      'feedback_enumerate_the_reachable_message_set',
      'feedback_a_display_field_can_shadow_the_join_key',
      'feedback_small_population_hand_reading_is_primary',
    ],
  },
];

// ---------- helpers ----------
function splitFrontmatter(text) {
  if (!text.startsWith('---\n')) return { fm: null, body: text };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { fm: null, body: text };
  return { fm: text.slice(4, end), body: text.slice(end + 5) };
}

function fmField(fm, key) {
  const m = fm && fm.match(new RegExp('^' + key + ':\\s*(.*)$', 'm'));
  if (!m) return null;
  let v = m[1].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

const problems = [];
const built = [];
const aliases = new Map(); // slug -> declared `name:` when it differs from the filename

// ---------- validate + build ----------
const onDisk = new Set(fs.readdirSync(DIR).filter((f) => f.endsWith('.md')));
const claimed = new Map();

for (const c of CLUSTERS) {
  if (onDisk.has(c.slug + '.md')) problems.push(`target already exists: ${c.slug}.md`);
  const sections = [];
  let originSessionId = null;
  for (const m of c.members) {
    const file = m + '.md';
    if (!onDisk.has(file)) { problems.push(`missing member: ${file}`); continue; }
    if (m.startsWith('topic_')) { problems.push(`member is itself a topic file: ${file}`); continue; }
    if (claimed.has(m)) { problems.push(`member claimed by two clusters: ${m} (${claimed.get(m)}, ${c.slug})`); continue; }
    claimed.set(m, c.slug);
    const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
    const { fm, body } = splitFrontmatter(raw);
    if (!fm) { problems.push(`no frontmatter: ${file}`); continue; }
    const name = fmField(fm, 'name');
    // 8 of these files declare a `name:` that differs from their filename (kebab-case, or the
// `feedback_` prefix dropped), and inbound [[…]] links exist in BOTH spellings. Not a refusal:
    // record the alias so a link in either spelling still resolves to this section.
    if (name !== m) aliases.set(m, name);
    originSessionId = originSessionId || fmField(fm, 'originSessionId');
    const desc = fmField(fm, 'description') || '';
    // Body verbatim. Drop a leading "# Title" line so the section heading is the only heading.
    let b = body.replace(/^\s*\n/, '');
    b = b.replace(/^# [^\n]*\n+/, '');
    sections.push(`## ${m}\n\n*${desc}*\n\n${b.trim()}\n`);
  }
  const header = [
    '---',
    `name: ${c.slug}`,
    `description: "${c.description.replace(/"/g, '\\"')}"`,
    'metadata:',
    '  node_type: memory',
    '  type: feedback',
    ...(originSessionId ? [`  originSessionId: ${originSessionId}`] : []),
    `  modified: ${new Date().toISOString()}`,
    '---',
    '',
    `# ${c.title}`,
    '',
    'Merged topic file. Each section below is one previously separate memory, body preserved',
    'verbatim. **Absorbed slugs** — a `[[…]]` link to any of these resolves to the section of the',
    'same name in this file:',
    ...c.members.map((m) => (aliases.has(m) ? `- \`${m}\` (also linked as \`${aliases.get(m)}\`)` : `- \`${m}\``)),
    '',
    '---',
    '',
  ].join('\n');
  const text = header + sections.join('\n---\n\n');
  const bytes = Buffer.byteLength(text);
  if (bytes > MAX_TOPIC_BYTES) problems.push(`${c.slug} is ${bytes}B, over the ${MAX_TOPIC_BYTES}B cap — split the cluster`);
  if (sections.length !== c.members.length) problems.push(`${c.slug}: built ${sections.length} sections for ${c.members.length} members`);
  built.push({ cluster: c, text, bytes, sections: sections.length });
}

// ---------- index rewrite (computed, not yet written) ----------
const indexBefore = fs.readFileSync(INDEX, 'utf8');
const beforeBytes = Buffer.byteLength(indexBefore);
const lines = indexBefore.split('\n');
const absorbed = new Set([...claimed.keys()].map((m) => m + '.md'));
const kept = [];
let removed = 0;
for (const line of lines) {
  const m = line.match(/^- \[(.+)\]\(([^)]+)\)/);
  if (m && absorbed.has(m[2])) { removed++; continue; }
  kept.push(line);
}
if (removed !== absorbed.size) problems.push(`removed ${removed} index lines for ${absorbed.size} absorbed memories`);

const topicHeaderIdx = kept.findIndex((l) => l.startsWith('## Topic files'));
if (topicHeaderIdx === -1) problems.push('no "## Topic files" section header found in MEMORY.md');

// Insert new topic lines at the end of the Topic files section (= end of file, trailing blanks kept).
let insertAt = kept.length;
while (insertAt > 0 && kept[insertAt - 1].trim() === '') insertAt--;
if (insertAt <= topicHeaderIdx) problems.push('computed insert point is above the Topic files header');
const newLines = built.map(({ cluster: c }) => `- [${c.index}](${c.slug}.md) — ${c.hook}`);
const after = [...kept.slice(0, insertAt), ...newLines, ...kept.slice(insertAt)].join('\n');
const afterBytes = Buffer.byteLength(after);

// ---------- report ----------
console.log('=== build report ===');
for (const b of built) console.log(`${b.cluster.slug}: ${b.sections} sections, ${b.bytes}B`);
console.log(`absorbed memories: ${absorbed.size}`);
console.log(`index lines removed: ${removed}, topic lines added: ${newLines.length}`);
console.log(`MEMORY.md: ${beforeBytes}B -> ${afterBytes}B (${afterBytes - beforeBytes}B)`);
const entriesBefore = lines.filter((l) => /^- \[(.+)\]\(([^)]+)\)/.test(l)).length;
const entriesAfter = after.split('\n').filter((l) => /^- \[(.+)\]\(([^)]+)\)/.test(l)).length;
console.log(`index entries: ${entriesBefore} -> ${entriesAfter}`);

if (problems.length) {
  console.log('\n=== REFUSED, nothing written ===');
  for (const p of problems) console.log('  ! ' + p);
  process.exit(2);
}
if (DRY) { console.log('\nDRY RUN — validation clean, nothing written.'); process.exit(0); }

// ---------- backup, then mutate ----------
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(BACKUP_ROOT, stamp);
fs.mkdirSync(backup, { recursive: true });
fs.copyFileSync(INDEX, path.join(backup, 'MEMORY.md'));
for (const m of claimed.keys()) fs.copyFileSync(path.join(DIR, m + '.md'), path.join(backup, m + '.md'));
console.log(`\nbackup: ${backup} (${fs.readdirSync(backup).length} files)`);

for (const b of built) fs.writeFileSync(path.join(DIR, b.cluster.slug + '.md'), b.text);
for (const m of claimed.keys()) fs.unlinkSync(path.join(DIR, m + '.md'));
fs.writeFileSync(INDEX, after);

// ---------- post-conditions ----------
const post = [];
const nowOnDisk = new Set(fs.readdirSync(DIR).filter((f) => f.endsWith('.md')));
const idx = fs.readFileSync(INDEX, 'utf8');
const linked = new Set();
for (const line of idx.split('\n')) {
  const m = line.match(/^- \[(.+)\]\(([^)]+)\)/);
  if (!m) continue;
  linked.add(m[2]);
  if (!nowOnDisk.has(m[2])) post.push(`index points at missing file: ${m[2]}`);
}
for (const f of nowOnDisk) if (f !== 'MEMORY.md' && !linked.has(f)) post.push(`file not in index: ${f}`);
for (const m of claimed.keys()) if (nowOnDisk.has(m + '.md')) post.push(`absorbed member still on disk: ${m}`);
for (const [m, slug] of claimed) {
  const t = fs.readFileSync(path.join(DIR, slug + '.md'), 'utf8');
  if (!t.includes('`' + m + '`')) post.push(`${slug} does not name absorbed slug ${m}`);
  if (!t.includes('## ' + m)) post.push(`${slug} has no section for ${m}`);
}
console.log('\n=== post-conditions ===');
if (post.length) { for (const p of post) console.log('  ! ' + p); console.log(`RESTORE FROM: ${backup}`); process.exit(3); }
console.log(`clean: ${linked.size} index entries, ${nowOnDisk.size - 1} memory files, 0 dangling, 0 orphan`);
console.log(`MEMORY.md now ${Buffer.byteLength(idx)}B`);
