// unit-464gentry drive3 — P5MATRIX. Six arms x two instrument versions, scored on the GENTRY
// output line alone.
//
// The baseline arm is the PINNED PRE-REPAIR instrument from git, not my memory of what it said.
// Both arms receive the IDENTICAL one-line parameterisation (DOC <- process.env.GENTRY_DOC) so the
// transformation cancels between them; the diff between the pinned bytes and the scratch baseline
// is printed, so it is visible rather than asserted.
// [[feedback_a_unit_that_cures_its_own_subject_needs_the_baseline_from_git]]
//
// Each arm is a mutated COPY of the convention; the tracked document is never written.
// Both versions run with cwd = repo root, so their relative paths and `git` calls resolve.
// [[feedback_a_scratch_copy_at_the_wrong_depth_refuses_every_cell]]
//
//   node docs/research/unit-464gentry-2026-11-05/drive3-matrix.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const U = 'docs/research/unit-464gentry-2026-11-05/';
const SCRATCH = U + 'scratch/';
const SUBJECT = 'docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs';
const SUBJECT_PIN = '5afca5dd79f84fd54d25069c0ca598bc26ffe462';
const DOC = 'docs/research/LEG-CLASS-CONVENTION.md';
const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const g = (a) => execFileSync('git', ['-C', TOP, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });

rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });

// --- the two instrument versions ---------------------------------------------------------------
const PARAM_FROM = "const DOC = 'docs/research/LEG-CLASS-CONVENTION.md';";
const PARAM_TO = "const DOC = process.env.GENTRY_DOC ?? 'docs/research/LEG-CLASS-CONVENTION.md';";
const pinnedSrc = g(['show', `${SUBJECT_PIN}:${SUBJECT}`]);
if (!pinnedSrc.includes(PARAM_FROM)) {
  console.log(`REFUSED — the pinned pre-repair source does not contain the exact line to substitute:\n  ${PARAM_FROM}`);
  process.exit(1);
}
const baseSrc = pinnedSrc.replace(PARAM_FROM, PARAM_TO);
const PRE = SCRATCH + 'pre-repair.grade-entry-v15.mjs';
writeFileSync(SCRATCH + 'pinned.grade-entry-v15.mjs', pinnedSrc);
writeFileSync(PRE, baseSrc);
const paramDiff = spawnSync('diff', ['-u', SCRATCH + 'pinned.grade-entry-v15.mjs', PRE],
  { cwd: TOP, encoding: 'utf8' }).stdout;
const diffBody = paramDiff.split('\n').filter((l) => /^[+-][^+-]/.test(l));
console.log('--- the one-line parameterisation applied to the pinned baseline, verbatim ---');
console.log(paramDiff.trimEnd() || '(no diff)');
console.log(`changed lines: ${diffBody.length} (want 2: one -, one +)`);
if (diffBody.length !== 2) { console.log('REFUSED — baseline differs from the pin by more than the declared line'); process.exit(1); }

// --- the six arms -------------------------------------------------------------------------------
const live = readFileSync(DOC, 'utf8');
const entryStart = live.indexOf('### 2.1g');
const mutate = {
  // control
  A0NULL: (d) => d,
  // one published digit inside §2.1g altered. Located inside the entry span, not document-wide.
  A1FIGURE: (d) => {
    const head = d.slice(0, entryStart);
    const tail = d.slice(entryStart);
    const m = tail.match(/four of the five/);
    if (!m) return { err: 'A1FIGURE: the target phrase is not inside §2.1g' };
    return head + tail.replace('four of the five', 'three of the five');
  },
  // §2.1g's body truncated under 2000 bytes, both headings left in place.
  A2SHRINK: (d) => {
    const i = d.indexOf('### 2.1g');
    const b = d.indexOf('### MEASURED-BLOCK-V15');
    if (i < 0 || b < 0 || b < i) return { err: 'A2SHRINK: anchors not ordered' };
    return d.slice(0, i) + d.slice(i, i + 200) + '\n\n' + d.slice(b);
  },
  // the heading the REPAIRED span ends on, deleted.
  A3ENDGONE: (d) => d.replace(/^### 2\.1h .*$/m, '(heading deleted by A3ENDGONE)'),
  // the heading the PRE-REPAIR span ended on, deleted.
  A4OLDANCHOR: (d) => d.replace(/^### 2\.1a .*$/m, '(heading deleted by A4OLDANCHOR)'),
  // v1.5's own append-only version-history entry, deleted.
  A5HISTGONE: (d) => d.replace(/^\*\*v1\.5, 2026-11-03\.\*\*/m, '**vX.X, 2026-11-03.**'),
};
const REGISTERED = {
  A0NULL: ['ok', 'ok'], A1FIGURE: ['ok', 'RED'], A2SHRINK: ['ok', 'RED'],
  A3ENDGONE: ['ok', 'RED'], A4OLDANCHOR: ['ok', 'ok'], A5HISTGONE: ['RED', 'RED'],
};

// Score on the GENTRY line alone; record the other legs and report any refusal rather than
// absorbing it. [[feedback_a_catch_continue_drops_cases_from_a_matrix]]
function drive(instrument, docPath) {
  const r = spawnSync('node', [instrument], {
    cwd: TOP, encoding: 'utf8', env: { ...process.env, GENTRY_DOC: docPath }, maxBuffer: 1 << 28,
  });
  const out = (r.stdout ?? '') + (r.status === null ? `\n(no exit status: ${r.error?.message})` : '');
  const line = out.split('\n').find((l) => /\bGENTRY\b/.test(l));
  const others = out.split('\n')
    .map((l) => l.match(/^ {3}(ok|RED) +(G[A-Z0-9]+) /)).filter(Boolean)
    .filter((m) => m[2] !== 'GENTRY').map((m) => `${m[2]}=${m[1]}`);
  return {
    verdict: line ? (/^ {3}ok/.test(line) ? 'ok' : 'RED') : `NO GENTRY LINE (rc=${r.status})`,
    note: line ? line.replace(/^ {3}(ok|RED) +GENTRY +/, '') : (r.stderr ?? '').trim().split('\n')[0],
    others, rc: r.status, stderr: (r.stderr ?? '').trim(),
  };
}

const rows = [];
for (const [arm, fn] of Object.entries(mutate)) {
  const mutated = fn(live);
  if (typeof mutated !== 'string') { rows.push({ arm, err: mutated.err }); continue; }
  if (arm !== 'A0NULL' && mutated === live) { rows.push({ arm, err: 'mutation was a no-op — the arm did not change the document' }); continue; }
  const p = SCRATCH + `${arm}.LEG-CLASS-CONVENTION.md`;
  writeFileSync(p, mutated);
  rows.push({ arm, pre: drive(PRE, p), post: drive(SUBJECT, p), bytes: mutated.length });
}

console.log('\n--- P5MATRIX: GENTRY verdict per arm, per instrument version ---');
let agree = 0; const voids = [];
for (const r of rows) {
  if (r.err) { voids.push(`${r.arm}: ${r.err}`); console.log(`   VOID ${r.arm.padEnd(12)} ${r.err}`); continue; }
  const [rp, rq] = REGISTERED[r.arm];
  const hit = r.pre.verdict === rp && r.post.verdict === rq;
  if (hit) agree++;
  console.log(`   ${hit ? 'ok  ' : 'MISS'} ${r.arm.padEnd(12)} pre=${String(r.pre.verdict).padEnd(4)} post=${String(r.post.verdict).padEnd(4)}` +
    `  registered pre=${rp} post=${rq}  · doc ${r.bytes}B · other legs pre[${r.pre.others.join(' ')}] post[${r.post.others.join(' ')}]`);
  console.log(`        post note: ${r.post.note}`);
}
const nonNull = rows.filter((r) => !r.err && r.arm !== 'A0NULL' && r.arm !== 'A5HISTGONE');
const preCaught = nonNull.filter((r) => r.pre.verdict === 'RED').length;
const postCaught = nonNull.filter((r) => r.post.verdict === 'RED').length;

console.log('');
console.log(`P5MATRIX ${agree === rows.length && voids.length === 0 ? 'GREEN' : 'RED'} — ${agree} of ${rows.length} arms match their registered cell` +
  `${voids.length ? ` · ${voids.length} VOID` : ''}`);
console.log(`DISCRIMINATION — of the ${nonNull.length} corruptions outside the two controls, the ` +
  `pre-repair leg catches ${preCaught} and the repaired leg catches ${postCaught}`);
process.exit(agree === rows.length && voids.length === 0 ? 0 : 1);
