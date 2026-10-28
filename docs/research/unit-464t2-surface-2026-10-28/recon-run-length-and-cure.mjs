#!/usr/bin/env node
/**
 * recon-run-length-and-cure.mjs — Unit 464-T2-surface, 2026-10-28, Theseus
 *
 * Reconnaissance for three questions Daedalus's 10/28 ~13:2x memo leaves open, each of
 * which the memo's §4 headline ("it fired around round 300; the run is 172 rounds")
 * depends on:
 *
 *   Q-A  THE THIRD KEY. §3 adopts the self-attested key = subject names the round OR the
 *        commit created the round's dir (clause b). §4's figure comes from `recon2`, whose
 *        key is `SUBJECT_ROUND_RE` on the subject ALONE — clause (b) is absent (read at
 *        recon2 line 39/83). Under the adopted key, does the filed 15-day window answer
 *        with a last product-source round after all? `e2759907` both creates
 *        `round417-instruments/` and touches `packages/shared/src/types.ts`, so the
 *        expectation is yes — 417 — against recon2's NONE.
 *
 *   Q-B  IS 172 A COUNT? `recon2`'s FLOOR NOTE calls `consecutive=91` a floor and then
 *        gives "by round NUMBER the run is 172", and the memo states 172 as the run.
 *        172 = 464 - 292 counts every integer in between as a round. In the only region
 *        where that is checkable — the dir span 365..464 — 91 of 100 integers have a dir.
 *        So census what round numbers are ATTESTED anywhere above 292, and bracket the run
 *        instead of quoting either end of it.
 *
 *   Q-C  IS "CURE" MODELLED AT ALL? The condition says rounds "keep CURING DEFECTS in
 *        surfaces that have a standing gate". Every key measured by either seat so far
 *        keys on a commit TOUCHING a file under the surface. 417's credit is, in
 *        Daedalus's own §2 words, "ordinary catalogue work... neither a defect cure";
 *        292's is `fix(reassign-picker): disable candidates already bound...`. If
 *        cure-ness were modelled, does the key choice in Q-A still change the answer?
 *
 * Recon only: no verdict legs, no predictions. Everything here is re-measured under graded
 * legs in `grade-the-run-length.mjs`; this file exists so that the exploratory numbers are
 * on the record at a stamped rev before any leg was written against them.
 *
 * Clocks are pinned absolutely. A bare `--since=2026-10-13` resolves unspecified
 * components against the AMBIENT clock, so the window slides every hour and members fall
 * off its tail (measured in unit-464t2-reaim, drive14 vs drive16: the same cripple
 * separated at 14:57 and did not at 11:0x). Every window here carries HH:MM:SS.
 */
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout;
}

const REV = (git(['rev-parse', 'HEAD']) ?? 'UNRESOLVED\n').trim();
const WINDOW_FILED = '2026-10-13 00:00:00';
const WINDOW_WIDE = '2026-09-13 00:00:00';
const LAST_PRODUCT_ROUND_CLAIMED = 292;
const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;

console.log('=== RECON/464-T2-surface — the run length, the third key, and whether "cure" is modelled ===');
console.log(`REV ${REV}`);
console.log(`CLOCK ${new Date().toISOString()}`);
console.log(`windows pinned: filed="${WINDOW_FILED}" wide="${WINDOW_WIDE}"`);
console.log('');

// ---------------------------------------------------------------------------
// Population: round numbers attested by each independent source, at this rev.
// Selected with `git ls-tree` at the stamped rev rather than `ls`/`git ls-files`, so the
// census is reproducible from the rev alone and not from this checkout's working tree.
// `-C REPO` is pinned because `git ls-tree` is cwd-sensitive: the same command returns
// 400 paths from the repo root and 0 from a subdirectory.
// ---------------------------------------------------------------------------
const tree = git(['ls-tree', '-r', '--name-only', REV]);
if (tree === null) {
  console.log('POPULATION UNRESOLVED — git ls-tree refused; nothing below is measured');
  process.exit(3);
}
const paths = tree.split('\n').filter(Boolean);

const srcDirs = new Set();
const srcTests = new Set();
const srcOtherDocs = new Set();
for (const p of paths) {
  let m = /^docs\/research\/round(\d+)-instruments\//.exec(p);
  if (m) {
    srcDirs.add(Number(m[1]));
    continue;
  }
  m = /(?:^|\/)round(\d+)[^/]*\.test\.tsx?$/.exec(p);
  if (m) {
    srcTests.add(Number(m[1]));
    continue;
  }
  m = /^docs\/research\/[^/]*round(\d+)/.exec(p);
  if (m) srcOtherDocs.add(Number(m[1]));
}

// Subjects over ALL history, not a window: the question "which round numbers exist" is not
// a windowed question, and windowing it is what made 91 look like the whole population.
const subjects = git(['log', '--format=%H\u0001%s', REV]);
const srcSubjects = new Set();
const subjectRows = [];
for (const line of (subjects ?? '').split('\n').filter(Boolean)) {
  const [hash, subject] = line.split('\u0001');
  const m = SUBJECT_ROUND_RE.exec(subject ?? '');
  subjectRows.push({ hash, subject: subject ?? '', round: m ? Number(m[1]) : null });
  if (m) srcSubjects.add(Number(m[1]));
}

const sources = {
  'round-dirs': srcDirs,
  'round-tests': srcTests,
  'other-docs': srcOtherDocs,
  'commit-subjects': srcSubjects,
};
const union = new Set();
for (const s of Object.values(sources)) for (const n of s) union.add(n);

console.log('--- Q-B: what round numbers are ATTESTED, and by what');
for (const [name, set] of Object.entries(sources)) {
  const arr = [...set].sort((a, b) => a - b);
  const above = arr.filter((n) => n > LAST_PRODUCT_ROUND_CLAIMED);
  console.log(
    `  ${name.padEnd(17)} n=${String(arr.length).padStart(4)}  span=${arr.length ? `${arr[0]}..${arr[arr.length - 1]}` : 'EMPTY'}  above ${LAST_PRODUCT_ROUND_CLAIMED}: ${above.length}`
  );
}
const unionArr = [...union].sort((a, b) => a - b);
const unionAbove = unionArr.filter((n) => n > LAST_PRODUCT_ROUND_CLAIMED);
const highest = unionArr.length ? unionArr[unionArr.length - 1] : null;
const dirsArr = [...srcDirs].sort((a, b) => a - b);
const dirsAbove = dirsArr.filter((n) => n > LAST_PRODUCT_ROUND_CLAIMED);
const spanByNumber = highest === null ? null : highest - LAST_PRODUCT_ROUND_CLAIMED;

console.log('');
console.log(`  UNION            n=${String(unionArr.length).padStart(4)}  span=${unionArr.length ? `${unionArr[0]}..${highest}` : 'EMPTY'}  above ${LAST_PRODUCT_ROUND_CLAIMED}: ${unionAbove.length}`);
console.log(`  dir-only figure published as the floor : ${dirsAbove.length}`);
console.log(`  number-span figure published as the run: ${spanByNumber}`);
console.log(`  attested-union figure (this recon)     : ${unionAbove.length}`);
console.log('');

// Density inside the dir span — the only region where "every integer is a round" is
// checkable against evidence.
if (dirsArr.length) {
  const lo = dirsArr[0];
  const hi = dirsArr[dirsArr.length - 1];
  const integers = hi - lo + 1;
  const missingDirs = [];
  for (let n = lo; n <= hi; n++) if (!srcDirs.has(n)) missingDirs.push(n);
  const missingFromUnion = missingDirs.filter((n) => !union.has(n));
  console.log(`  density inside the dir span ${lo}..${hi}: integers=${integers} dirs=${dirsArr.length} missingDirs=${missingDirs.length}`);
  console.log(`    integers with NO dir            : ${missingDirs.join(',') || '(none)'}`);
  console.log(`    of those, attested by NO source : ${missingFromUnion.length} → ${missingFromUnion.join(',') || '(none)'}`);
  console.log(`    so "every integer in the span is a round" is ${missingFromUnion.length === 0 ? 'SUPPORTED' : 'FALSE'} on this evidence`);
}
console.log('');

// ---------------------------------------------------------------------------
// Q-A: three keys over the filed window, product-source surface.
// ---------------------------------------------------------------------------
console.log('--- Q-A: three keys over the FILED 15-day window, product-source surface');

function isProductSource(p) {
  return /^packages\//.test(p) && !/(^|\/)__tests__\//.test(p);
}
// A cure predicate read off the conventional-commit type in the subject. Deliberately
// generous: anything that announces itself as a fix/repair. This is a MODEL of cure-ness,
// not cure-ness; it is published as such and graded by a known positive and a known
// negative rather than trusted.
const CURE_RE = /^(fix|repair|revert)\b|^[a-z]+(\([^)]*\))?!?:\s*(fix|repair)\b|\bfix(es|ed)?\b/i;

function windowRows(since) {
  const raw = git([
    'log',
    `--since=${since}`,
    '--format=%H\u0001%an\u0001%aI\u0001%s',
    '--name-only',
    REV,
  ]);
  if (raw === null) return null;
  const rows = [];
  let cur = null;
  for (const line of raw.split('\n')) {
    if (line.includes('\u0001')) {
      if (cur) rows.push(cur);
      const [hash, author, date, subject] = line.split('\u0001');
      cur = { hash, author, date, subject, files: [] };
    } else if (line.trim() && cur) {
      cur.files.push(line.trim());
    }
  }
  if (cur) rows.push(cur);
  return rows;
}

// clause (b): did this commit CREATE docs/research/roundNNN-instruments/? Measured as
// "the commit touches a path in that dir, and no commit before it did" — resolved from
// the first commit that touched the dir, so an unresolvable creator refuses rather than
// quietly becoming "not a creator".
const dirCreatorCache = new Map();
function dirCreator(round) {
  if (dirCreatorCache.has(round)) return dirCreatorCache.get(round);
  const raw = git([
    'log',
    '--diff-filter=A',
    '--format=%H',
    '--reverse',
    REV,
    '--',
    `docs/research/round${round}-instruments/`,
  ]);
  const first = raw === null ? null : (raw.split('\n').filter(Boolean)[0] ?? null);
  dirCreatorCache.set(round, first);
  return first;
}

for (const since of [WINDOW_FILED, WINDOW_WIDE]) {
  const rows = windowRows(since);
  if (rows === null) {
    console.log(`  window ${since}: UNRESOLVED (git log refused)`);
    continue;
  }
  const ps = rows.filter((r) => r.files.some(isProductSource));
  // key 1 — recon2's: subject label only
  const k1 = ps.filter((r) => SUBJECT_ROUND_RE.test(r.subject)).map((r) => Number(SUBJECT_ROUND_RE.exec(r.subject)[1]));
  // key 2 — the ADOPTED key: subject label OR the commit created some round's dir
  const k2 = [];
  for (const r of ps) {
    const m = SUBJECT_ROUND_RE.exec(r.subject);
    if (m) {
      k2.push({ round: Number(m[1]), via: 'label', row: r });
      continue;
    }
    const created = r.files
      .map((f) => /^docs\/research\/round(\d+)-instruments\//.exec(f))
      .filter(Boolean)
      .map((mm) => Number(mm[1]));
    for (const round of new Set(created)) {
      const creator = dirCreator(round);
      if (creator === null) {
        k2.push({ round, via: 'creator-UNRESOLVED', row: r });
      } else if (creator.startsWith(r.hash) || r.hash.startsWith(creator)) {
        k2.push({ round, via: 'clause-b', row: r });
      }
    }
  }
  // key 3 — adopted key AND the subject announces a cure
  const k3 = k2.filter((e) => CURE_RE.test(e.row.subject));

  const last = (arr) => (arr.length ? Math.max(...arr) : null);
  const k1Last = last(k1);
  const k2Last = last(k2.map((e) => e.round));
  const k3Last = last(k3.map((e) => e.round));
  console.log(`  window ${since}  productSourceCommits=${ps.length}`);
  console.log(`    key1 label-only      (recon2's)   : members=[${[...new Set(k1)].sort((a, b) => a - b).join(',')}] last=${k1Last ?? 'NONE'} consecutive=${k1Last === null ? 'UNMEASURED' : dirsArr.filter((d) => d > k1Last).length}`);
  console.log(`    key2 label OR clause-b (ADOPTED)  : members=[${[...new Set(k2.map((e) => e.round))].sort((a, b) => a - b).join(',')}] last=${k2Last ?? 'NONE'} consecutive=${k2Last === null ? 'UNMEASURED' : dirsArr.filter((d) => d > k2Last).length}`);
  console.log(`    key3 ADOPTED and subject is a CURE: members=[${[...new Set(k3.map((e) => e.round))].sort((a, b) => a - b).join(',')}] last=${k3Last ?? 'NONE'} consecutive=${k3Last === null ? 'UNMEASURED' : dirsArr.filter((d) => d > k3Last).length}`);
  for (const e of k2) {
    console.log(`      edge round ${e.round} via ${e.via}: ${e.row.hash.slice(0, 8)} ${e.row.author} ${e.row.date.slice(0, 16)}`);
    console.log(`        subject: ${e.row.subject}`);
    console.log(`        cure?  : ${CURE_RE.test(e.row.subject)}`);
    console.log(`        product-source files: ${e.row.files.filter(isProductSource).join(', ')}`);
  }
}
console.log('');

// ---------------------------------------------------------------------------
// Q-C: is a cure predicate present in either seat's source at all?
// Static read of both cells plus this seat's own, so "nobody models cure" is measured
// rather than recalled. The population path is sliced OUT of the subject set — an
// instrument does not census its own source.
// ---------------------------------------------------------------------------
console.log('--- Q-C: does any existing key model "cure" at all?');
const CELLS = [
  'docs/research/unit-464t2-keychoice-2026-10-28/grade-the-surface-predicate.mjs',
  'docs/research/unit-464t2-keychoice-2026-10-28/recon2-the-last-round-that-cured-product-source.mjs',
  'docs/research/unit-464t2-keychoice-2026-10-28/recon-what-the-credits-are-made-of.mjs',
  'docs/research/unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs',
  'docs/research/round464-instruments/grade-the-stop-condition.mjs',
];
const CURE_TOKEN_RE = /\bfix\b|\bcure[ds]?\b|\brepair\b|conventional|commitType/i;
for (const rel of CELLS) {
  const blob = git(['show', `${REV}:${rel}`]);
  if (blob === null) {
    console.log(`  ${rel}: ABSENT at this rev — refusing rather than treating as "no cure model"`);
    continue;
  }
  // Only count tokens inside code, not inside the long explanatory docblocks: a comment
  // saying "cures defects" is not a predicate. Keyed on lines that are not comment lines.
  const codeLines = blob
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .filter((l) => CURE_TOKEN_RE.test(l));
  console.log(`  ${rel.split('/').slice(-2).join('/')}: codeLinesMentioningCure=${codeLines.length}`);
  for (const l of codeLines.slice(0, 4)) console.log(`      ${l.trim().slice(0, 110)}`);
}
console.log('');
console.log('RECON COMPLETE — no legs, no predictions; every figure above is re-measured under a graded leg.');
