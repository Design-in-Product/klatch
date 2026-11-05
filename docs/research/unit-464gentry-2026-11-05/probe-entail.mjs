// unit-464gentry probe-entail — DECLARED POST-HOC, named rather than folded into drive3.
//
// Why it exists: drive3 came back 6 of 6 as registered, and in doing so showed that only TWO of
// the repaired leg's five conjuncts ever reddened — FROZEN (3 arms) and HIST (1 arm). SPAN, SHAPE
// and BLOCK never fired. A conjunct with no known positive is the defect I was sent to fix, in a
// new place. [[feedback_one_kp_per_shape_is_coverage_of_one_axis]]
//
// So: two more arms aimed at the three silent conjuncts, and an explicit entailment claim about
// why no arm can ever redden SHAPE or BLOCK *alone*.
//
//   node docs/research/unit-464gentry-2026-11-05/probe-entail.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const U = 'docs/research/unit-464gentry-2026-11-05/';
const SCRATCH = U + 'scratch-entail/';
const SUBJECT = 'docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs';
const SUBJECT_PIN = '5afca5dd79f84fd54d25069c0ca598bc26ffe462';
const DOC = 'docs/research/LEG-CLASS-CONVENTION.md';
const ENTRY_REV = 'a3607d5a045cdccea7dd97b91b0250d4d1923eaa';
const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const g = (a) => execFileSync('git', ['-C', TOP, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });

rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });
const PARAM_FROM = "const DOC = 'docs/research/LEG-CLASS-CONVENTION.md';";
const PARAM_TO = "const DOC = process.env.GENTRY_DOC ?? 'docs/research/LEG-CLASS-CONVENTION.md';";
const PRE = SCRATCH + 'pre-repair.grade-entry-v15.mjs';
writeFileSync(PRE, g(['show', `${SUBJECT_PIN}:${SUBJECT}`]).replace(PARAM_FROM, PARAM_TO));

const live = readFileSync(DOC, 'utf8');
const arms = {
  // aimed at SPAN: the start anchor itself is gone, so no span can be established.
  A6STARTGONE: (d) => d.replace(/^### 2\.1g .*$/m, '(heading deleted by A6STARTGONE)'),
  // aimed at SHAPE and BLOCK: the entry's own MEASURED-BLOCK heading is renamed, so it stops being
  // excluded from the end-candidates and becomes the end itself.
  A7BLOCKGONE: (d) => d.replace(/^### MEASURED-BLOCK-V15$/m, '### MB-V15-RENAMED-BY-A7'),
};
const REGISTERED_POSTHOC = { A6STARTGONE: ['RED', 'RED'], A7BLOCKGONE: ['ok', 'RED'] };

function drive(instrument, docPath) {
  const r = spawnSync('node', [instrument], {
    cwd: TOP, encoding: 'utf8', env: { ...process.env, GENTRY_DOC: docPath }, maxBuffer: 1 << 28,
  });
  const out = r.stdout ?? '';
  const line = out.split('\n').find((l) => /\bGENTRY\b/.test(l));
  return {
    verdict: line ? (/^ {3}ok/.test(line) ? 'ok' : 'RED') : `NO GENTRY LINE (rc=${r.status})`,
    note: line ? line.replace(/^ {3}(ok|RED) +GENTRY +/, '') : (r.stderr ?? '').trim().split('\n')[0],
    failed: (line?.match(/FAILED: (.*)$/) ?? [])[1] ?? '(none)',
  };
}

console.log('--- two post-hoc arms aimed at the three conjuncts drive3 never reddened ---');
const seen = new Set();
for (const [arm, fn] of Object.entries(arms)) {
  const mutated = fn(live);
  if (mutated === live) { console.log(`   VOID ${arm} — mutation was a no-op`); continue; }
  const p = SCRATCH + `${arm}.LEG-CLASS-CONVENTION.md`;
  writeFileSync(p, mutated);
  const pre = drive(PRE, p); const post = drive(SUBJECT, p);
  const [rp, rq] = REGISTERED_POSTHOC[arm];
  const hit = pre.verdict === rp && post.verdict === rq;
  post.failed.split(', ').forEach((c) => c !== '(none)' && seen.add(c));
  console.log(`   ${hit ? 'ok  ' : 'MISS'} ${arm.padEnd(12)} pre=${String(pre.verdict).padEnd(4)} post=${String(post.verdict).padEnd(4)}` +
    `  registered pre=${rp} post=${rq}  · conjuncts failed post: ${post.failed}`);
  console.log(`        pre  note: ${pre.note}`);
  console.log(`        post note: ${post.note}`);
}

// --- the entailment claim, read off the subject's own output rather than argued -------------------
// If FROZEN holds, the live span is byte-equal to the span at ENTRY_REV. SHAPE and BLOCK are then
// properties OF THAT BASELINE, so FROZEN's truth forces theirs. To read the baseline's shape I
// drive the subject against the ENTRY_REV document itself and take the note it prints — importing
// the module in-process would execute the whole gate and exit.
const A8 = SCRATCH + 'A8ATENTRYREV.LEG-CLASS-CONVENTION.md';
writeFileSync(A8, g(['show', `${ENTRY_REV}:${DOC}`]));
const atRev = drive(SUBJECT, A8);
// Keyed on the subject's VERDICT-BEARING field (its `FAILED:` list), not on the prose of its note.
// The first form of this probe tested the note text — and when I repaired that very note three
// minutes later, this reader silently inverted and printed "does NOT contain MEASURED-BLOCK-V15"
// directly beneath its own evidence saying "found in the span". Recorded in probe-entail.out and
// drive5.entail-after-note-repair.out. [[feedback_guard_the_published_string_not_the_arrays_it_came_from]]
const failedAtRev = atRev.failed === '(none)' ? [] : atRev.failed.split(', ');
const shapeOk = !failedAtRev.includes('SHAPE');
const blockOk = !failedAtRev.includes('BLOCK');
const entailed = atRev.verdict === 'ok' && shapeOk && blockOk;
console.log('');
console.log(`A8ATENTRYREV — the repaired gate driven against the document AS IT WAS when the entry`);
console.log(`   was written (${ENTRY_REV.slice(0, 8)}): GENTRY=${atRev.verdict}`);
console.log(`        note: ${atRev.note}`);
console.log(`ENTAILMENT — on that baseline the subject reports SHAPE ${shapeOk ? 'ok' : 'FAILED'} and ` +
  `BLOCK ${blockOk ? 'ok' : 'FAILED'} (failed list: ${atRev.failed}),`);
console.log(`   so FROZEN=true ${entailed ? 'FORCES' : 'does NOT force'} SHAPE=true and BLOCK=true, and FROZEN is`);
console.log(`   unevaluable unless SPAN resolved. Independently reddenable conjuncts: FROZEN, HIST.`);
console.log(`   Conjuncts observed red across drive3 + this probe: ${[...seen].sort().join(', ')}`);
console.log('');
console.log(`SPAN/SHAPE/BLOCK are ATTRIBUTION, not detection: they name which way the entry moved`);
console.log(`once FROZEN has already failed. That is worth keeping and is not worth counting as`);
console.log(`five conjuncts in any future report of this leg.`);
