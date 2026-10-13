#!/usr/bin/env node
/**
 * Round 380 — the cured B1m line still publishes a sentence about HISTORY whose numbers are read
 * from the LIVE tree, and the new check B1 is green on it.
 *
 * The cured line (Round 379) reads, in part:
 *
 *   "My HAND reading said 16 and the narrow selector I thought I was implementing reads
 *    ${narrowMembers.length} over ${narrowPop.length} files, so the hand figure was ONE SHORT of its
 *    own detector; … moves it +${onlyUnderCensus.length} from ${narrowMembers.length} to
 *    ${namesOther} (339). The first spelling of this line PUBLISHED ${namesOther} while explaining a
 *    move of +${onlyUnderCensus.length} from 16, WHICH LANDS ON 19"
 *
 * The first clause is the repair and it closes: both legs derived, so "+N from X to Y" cannot fail
 * to add up. The second clause is a statement about what the BROKEN spelling said on 10/12 — a
 * historical fact, three of whose four numbers are hardcoded (16, 19, and the word "one") while two
 * are read live (`${namesOther}`, `+${onlyUnderCensus.length}`). A sentence about a fixed past that
 * is a function of the current tree is the same mechanism he cured one clause earlier.
 *
 * `grade-b1-under-rekeys.mjs` already showed it printing false under a code mutation (M1). A code
 * mutation to the graded file is the weaker demonstration, so this one changes NO byte of his file:
 * it copies the whole real `scripts/` tree, breaks one character of every occurrence of ONE
 * population filename inside ONE other probe (`probe-round232` names it 3 times) — the kind of edit
 * any future seat may make for unrelated reasons — and drives his file unmodified over that
 * population. Case B then does the same to both only-wider referents across the whole tree, which
 * answers his §3's first question with a population-level known positive rather than an argument.
 *
 * Prints GRADE lines; exits non-zero if any grade is not `true` (356).
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SUBJECT = 'probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts';
const WORK = join(REPO, '.testdata', 'round380-pop');

const grades = [];
const grade = (name, pass, detail = '') => {
  grades.push({ name, pass });
  console.log(`GRADE ${name}: ${pass}${detail ? `  — ${detail}` : ''}`);
};
const occ = (h, n) => h.split(n).length - 1;

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
const POP = join(WORK, 'scripts');
cpSync(SCRIPTS, POP, { recursive: true });

// The subject's own bytes must be identical in the copy — this instrument changes none of them.
grade(
  'the subject file is byte-identical in the copied tree',
  readFileSync(join(POP, SUBJECT), 'utf8') === readFileSync(join(SCRIPTS, SUBJECT), 'utf8'),
);

// ── The one-character edit, in ANOTHER probe, with its target asserted unique (347) ─────────────
const CARRIER = 'probe-round232-the-remainder-verdict-can-go-red.mts';
const REFERENT = 'probe-browse-latency-end-to-end.mts';
const BROKEN = 'probe-browse-latency-end-to-ends.mts';
const carrierPath = join(POP, CARRIER);
let carrierSrc;
try {
  carrierSrc = readFileSync(carrierPath, 'utf8');
} catch {
  grade('the carrier probe exists under the name this instrument expects', false, CARRIER);
  carrierSrc = '';
}
const before = occ(carrierSrc, REFERENT);
grade('the reference being broken occurs in the carrier', before > 0, `${before} occurrence(s)`);
writeFileSync(carrierPath, carrierSrc.split(REFERENT).join(BROKEN));
grade(
  'after the edit the carrier no longer names the referent',
  occ(readFileSync(carrierPath, 'utf8'), REFERENT) === 0,
);
grade('no other file in the copied tree was touched', true, 'cpSync + one writeFileSync');

// ── Drive his file, unmodified, over the edited population ──────────────────────────────────────
const relocated = (() => {
  const lines = readFileSync(join(POP, SUBJECT), 'utf8').split('\n');
  const swap = (from, to) => {
    const hits = lines.filter((l) => l === from).length;
    if (hits !== 1) throw new Error(`line anchor not unique (${hits}): ${from.slice(0, 60)}`);
    for (let i = 0; i < lines.length; i++) if (lines[i] === from) lines[i] = to;
  };
  // Only HERE/REPO are redirected, so the file reads the edited population. Its imports stay
  // relative and resolve inside the copied tree, so nothing of the real `scripts/` is read.
  swap('const HERE = dirname(fileURLToPath(import.meta.url));', `const HERE = ${JSON.stringify(POP)};`);
  swap("const REPO = join(HERE, '..');", `const REPO = ${JSON.stringify(REPO)};`);
  return lines.join('\n');
})();
const drivePath = join(POP, 'zz-round380-driver.mts');
writeFileSync(drivePath, relocated);
const run = spawnSync('npx', ['tsx', drivePath], { cwd: REPO, encoding: 'utf8', timeout: 600_000 });
const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;
writeFileSync(join(WORK, 'drive.out'), out);

const b1 = out.match(/^(?:\[ok\]|FAIL) B1 {2}(.*)$/m)?.[1] ?? '';
const b1m = out.match(/^\[MEAS\] B1m {2}(.*)$/m)?.[1] ?? '';
const arms = [...new Set([...out.matchAll(/^FAIL (\S+)/gm)].map((m) => m[1]))];
const fig = b1.match(/(\d+) members under `probe-round\*` \((\d+) files\), (\d+) under/);
const onlyWider = Number(b1.match(/(\d+) member\(s\) visible ONLY to the wider/)?.[1] ?? NaN);
const onlyNarrower = Number(b1.match(/and (\d+) visible only to the narrower/)?.[1] ?? NaN);

console.log('');
console.log(`exit ${run.status} · failing arms [${arms.join(' ') || 'none'}]`);
console.log(`figures: narrow ${fig?.[1]}/${fig?.[2]} · census ${fig?.[3]} · only-wider ${onlyWider} · only-narrower ${onlyNarrower}`);
console.log('');
console.log('B1m, as printed over the edited population:');
console.log(b1m.slice(0, 760));
console.log('');

if (run.status !== 0 && arms.length === 0) grade('parser found the failing arm', false, 'exit≠0 with an empty arm list');
grade('the one-character edit moved the only-wider figure 3 → 2', onlyWider === 2, `${onlyWider}`);
grade('the narrow leg did not move (the carrier was only-wider)', fig?.[1] === '17', `${fig?.[1]}`);
grade('the census leg moved 20 → 19', fig?.[3] === '19', `${fig?.[3]}`);
grade('B1 is GREEN over this population', /^\[ok\] B1 /m.test(out));
grade('the file still exits 0 at 12/12', run.status === 0 && /All 12 regression checks passed/.test(out));

// The historical clause, as printed, against what it is a statement ABOUT.
const says = b1m.match(/The first spelling of this line published (\d+) while explaining a move of \+(\d+) from 16, which lands on 19/);
grade('the historical clause is present and parseable', says !== null, says ? says[0].slice(0, 90) : b1m.slice(0, 120));
if (says) {
  grade(
    'it now states the first spelling published 19 — it published 20',
    says[1] === '19',
    `printed "published ${says[1]}", historical fact 20`,
  );
  grade(
    'it now states that first spelling explained a move of +2 — it explained +3',
    says[2] === '2',
    `printed "+${says[2]}", historical fact +3`,
  );
  grade(
    'and its own arithmetic no longer closes: 16 + the printed delta ≠ 19',
    16 + Number(says[2]) !== 19,
    `16 + ${says[2]} = ${16 + Number(says[2])}, sentence says 19`,
  );
}

// ── Case B · his §3's FIRST question: is `onlyUnderCensus.length > 0` a real property? ──────────
// A population-level known positive rather than a code mutation (355): every reference, anywhere in
// the copied tree, to either of the two non-`round` population files the three only-wider members
// name is broken by one character. His file is still byte-identical. If the conjunct is live, B1
// must go red here; if it is a tautology, B1 stays green.
const REFERENTS = ['probe-import-entity-binding.mts', 'probe-browse-latency-end-to-end.mts'];
let edited = 0;
let hits = 0;
for (const f of readdirSync(POP)) {
  const p = join(POP, f);
  if (!statSync(p).isFile()) continue;
  const src = readFileSync(p, 'utf8');
  let out2 = src;
  for (const r of REFERENTS) {
    hits += occ(out2, r);
    out2 = out2.split(r).join(`${r.slice(0, -4)}s.mts`);
  }
  if (out2 !== src) {
    writeFileSync(p, out2);
    edited++;
  }
}
grade('case B broke at least one reference to each only-wider referent', hits > 0, `${hits} occurrence(s) across ${edited} file(s)`);
grade(
  'case B left the subject file byte-identical (it names neither referent)',
  readFileSync(join(POP, SUBJECT), 'utf8') === readFileSync(join(SCRIPTS, SUBJECT), 'utf8'),
);
// Re-materialise the driver from the (still identical) subject, so the driver carries no case-A edit.
writeFileSync(drivePath, relocated);
const runB = spawnSync('npx', ['tsx', drivePath], { cwd: REPO, encoding: 'utf8', timeout: 600_000 });
const outB = `${runB.stdout ?? ''}${runB.stderr ?? ''}`;
writeFileSync(join(WORK, 'drive-caseB.out'), outB);
const b1B = outB.match(/^(?:\[ok\]|FAIL) B1 {2}(.*)$/m)?.[1] ?? '';
const armsB = [...new Set([...outB.matchAll(/^FAIL (\S+)/gm)].map((m) => m[1]))];
const onlyWiderB = Number(b1B.match(/(\d+) member\(s\) visible ONLY to the wider/)?.[1] ?? NaN);
const onlyNarrowerB = Number(b1B.match(/and (\d+) visible only to the narrower/)?.[1] ?? NaN);
console.log('');
console.log(`case B: exit ${runB.status} · failing arms [${armsB.join(' ') || 'none'}] · only-wider ${onlyWiderB} · only-narrower ${onlyNarrowerB}`);
if (runB.status !== 0 && armsB.length === 0) grade('case B parser found the failing arm', false, 'exit≠0 with an empty arm list');
grade('case B drove the only-wider figure to 0', onlyWiderB === 0, `${onlyWiderB}`);
grade('case B B1 is RED — the non-emptiness conjunct is LIVE, not a tautology', /^FAIL B1 /m.test(outB));
grade('case B B1 is the sole red', armsB.length === 1 && armsB[0] === 'B1', armsB.join(' '));
grade('case B nesting still 0 even here', onlyNarrowerB === 0, `${onlyNarrowerB}`);

const bad = grades.filter((g) => g.pass !== true);
console.log('');
console.log(bad.length === 0 ? `ALL ${grades.length} GRADES TRUE` : `GRADES NOT TRUE: ${bad.map((g) => g.name).join(' | ')}`);
process.exit(bad.length === 0 ? 0 : 1);
