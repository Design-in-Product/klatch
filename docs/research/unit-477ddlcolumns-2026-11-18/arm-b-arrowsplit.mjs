/**
 * unit-477ddlcolumns — arm B: P7 and P8.
 *
 * WHY THIS EXISTS. My `unit-475arrowrefusal` §1 said, of the 534-member arrow
 * refusal class: *"Every one is a concise-bodied arrow with a return type."*
 * That sentence is true of the **288 ambiguous subset** it was written about and
 * false of the class. Theseus registered a prediction off it (his P4), measured
 * **11 block-bodied members** in his 26 files, and refuted himself — noting that
 * the refutation was already in my own memo, which reported `block 4013 → 4267`
 * in the same document. The corpus-wide split is mine to produce because I own
 * the reader.
 *
 * HOW. A CROSS-TAB, not a difference of two totals. Both readers run over the
 * same tree in one process:
 *
 *   PRE-CURE  — the `scripts/lib/decl-body.mjs` blob at `7e8b4ab1^`
 *   CURED     — the tracked module at HEAD
 *
 * and every declaration is keyed on `(kind_before, kind_after)`. Two totals can
 * only say the net moved; a cross-tab says which cells it moved between, which
 * is the whole of P8.
 *
 * THE PRE-CURE BLOB IS MATERIALISED FROM GIT AT DRIVE TIME, NOT VENDORED.
 * `git show` writes it to an UNTRACKED path, for two reasons. (1) A committed
 * copy of a pre-cure `decl-body.mjs` is itself an unguarded brace slicer, and
 * `verify-decl-body-slicers` would redden on it — which is exactly what happened
 * to Theseus's vendored `strip-source.mjs` in his 11/18 unit, one day after that
 * detector caught mine. (2) A blob read from git cannot drift from the commit it
 * claims to be.
 *
 * Its single import, `./strip-source.mjs`, is re-pointed at the tracked module.
 * That is sound and not an assumption: `git log 7e8b4ab1^..HEAD --
 * scripts/lib/strip-source.mjs` is EMPTY, verified in this fire, so HEAD's
 * module already IS the pre-cure module. The rewrite is declared here and
 * asserted below.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PRECURE_REV = '7e8b4ab1^';
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);

let fails = 0;
const check = (/** @type {string} */ label, /** @type {boolean} */ ok, /** @type {string} */ note = '') => {
  console.log(`  ${ok ? 'green' : 'RED  '}  ${label}${note ? ` — ${note}` : ''}`);
  if (!ok) fails++;
};

/* --- materialise the pre-cure reader, untracked --- */

const blobRaw = execFileSync('git', ['-C', ROOT, 'show', `${PRECURE_REV}:scripts/lib/decl-body.mjs`], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});
const stripAbs = resolve(ROOT, 'scripts/lib/strip-source.mjs');
const blob = blobRaw.replace(
  "import { stripSource } from './strip-source.mjs';",
  `import { stripSource } from ${JSON.stringify(stripAbs)}; // unit-477 arm B: re-pointed at the tracked module. Sound because \`git log ${PRECURE_REV}..HEAD -- scripts/lib/strip-source.mjs\` is empty.`
);
const PRECURE_PATH = resolve(HERE, '.tmp-precure-decl-body.mjs');
writeFileSync(PRECURE_PATH, blob);

console.log(`unit-477 arm B — the arrow class's concise/block split (P7) and the cure's non-additivity (P8)`);
console.log(`pre-cure reader: ${PRECURE_REV}:scripts/lib/decl-body.mjs → ${PRECURE_PATH} (untracked)`);

const pre = await import(PRECURE_PATH);
const cur = await import(resolve(ROOT, 'scripts/lib/decl-body.mjs'));

check(
  'the rewrite touched exactly one line and the blob is otherwise the git blob',
  blobRaw.split('\n').length === blob.split('\n').length &&
    blobRaw.replace(/^import \{ stripSource \}.*$/m, '') === blob.replace(/^import \{ stripSource \}.*$/m, ''),
  `${blobRaw.length} B → ${blob.length} B`
);
check(
  'the two readers are genuinely different modules',
  readFileSync(resolve(ROOT, 'scripts/lib/decl-body.mjs'), 'utf8') !== blobRaw,
  'if these were identical every cell below would be a diagonal and the arm would say "no effect"'
);

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .filter((f) => EXTS.has(extname(f)));

/* ----------------------------------------------------- the cross-tab */

/** `${before}→${after}` -> count */
const cells = new Map();
/** reason_before -> after-kind -> count, for the refused rows only */
const byReason = new Map();
/** the 534 class's members, with their cured kind */
const classMembers = [];
/** declarations that were NOT refused before and changed kind anyway — P8's subject */
const nonRefusedMovers = [];

let heads = 0;
for (const rel of tracked) {
  let src;
  try {
    src = readFileSync(resolve(ROOT, rel), 'utf8');
  } catch {
    continue;
  }
  // `declHeads` is read from the CURED module for both sides on purpose: the
  // cure did not touch head detection, and using each reader's own head list
  // would make the two sides disagree about the POPULATION as well as the
  // verdict, which is two variables in one cell.
  for (const h of cur.declHeads(src)) {
    heads++;
    const b = pre.declBodyAt(src, h.parenOpen, { isArrow: h.isArrow });
    const a = cur.declBodyAt(src, h.parenOpen, { isArrow: h.isArrow });
    const key = `${b.kind}→${a.kind}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
    if (b.kind === 'refused') {
      if (!byReason.has(b.reason)) byReason.set(b.reason, new Map());
      const m = byReason.get(b.reason);
      m.set(a.kind, (m.get(a.kind) ?? 0) + 1);
      if (b.reason === 'return-type-annotation-on-an-arrow-declaration') {
        classMembers.push({ file: rel, name: h.name, after: a.kind, afterReason: a.reason ?? null });
      }
    } else if (b.kind !== a.kind) {
      nonRefusedMovers.push({ file: rel, name: h.name, before: b.kind, after: a.kind });
    }
  }
}

console.log(`\nA1 — population: ${tracked.length} tracked files, ${heads} declaration heads (cured head reader, both sides)`);

console.log(`\nA2 — CROSS-TAB of kind_before → kind_after`);
for (const [k, n] of [...cells.entries()].sort((x, y) => y[1] - x[1])) {
  console.log(`  ${String(n).padStart(5)}  ${k}`);
}

console.log(`\nA3 — refused-before rows, by reason, with where they landed`);
for (const [reason, m] of [...byReason.entries()].sort(
  (x, y) => [...y[1].values()].reduce((a, b) => a + b, 0) - [...x[1].values()].reduce((a, b) => a + b, 0)
)) {
  const total = [...m.values()].reduce((a, b) => a + b, 0);
  const parts = [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}=${n}`);
  console.log(`  ${String(total).padStart(5)}  ${reason}  →  ${parts.join(' · ')}`);
}

/* ------------------------------------------------------------- P7 */

const concise = classMembers.filter((m) => m.after === 'concise').length;
const block = classMembers.filter((m) => m.after === 'block').length;
const stillRefused = classMembers.filter((m) => m.after === 'refused');
console.log(`\nA4 — P7: the 534 class's split under the cured reader`);
console.log(`  class size: ${classMembers.length}`);
console.log(`  concise:    ${concise}  (${((concise / classMembers.length) * 100).toFixed(1)}%)`);
console.log(`  block:      ${block}  (${((block / classMembers.length) * 100).toFixed(1)}%)`);
console.log(`  refused:    ${stillRefused.length}${stillRefused.length ? ` — ${stillRefused.map((m) => m.afterReason).join(', ')}` : ''}`);
check('P7: the class reproduces at 534', classMembers.length === 534, `measured ${classMembers.length}`);
check(
  'P7: block-bodied members are 249 ± 5, i.e. the class is NOT all concise-bodied',
  block >= 244 && block <= 254,
  `measured ${block}`
);
check(
  'P7: and it IS still majority concise, so the sentence was half right',
  concise > block,
  `concise ${concise} vs block ${block}`
);
console.log(`  first 12 block-bodied members (the class my §1 sentence said did not exist):`);
for (const m of classMembers.filter((x) => x.after === 'block').slice(0, 12)) {
  console.log(`    ${m.file} :: ${m.name}`);
}

/* ------------------------------------------------------------- P8 */

console.log(`\nA5 — P8: was the cure purely additive?`);
console.log(`  declarations refused before and resolved after: ${classMembers.length + (byReason.get('no-body-brace-after-the-return-type') ? [...byReason.get('no-body-brace-after-the-return-type').entries()].filter(([k]) => k !== 'refused').reduce((a, [, n]) => a + n, 0) : 0)}`);
console.log(`  declarations NOT refused before that changed kind: ${nonRefusedMovers.length}`);
for (const m of nonRefusedMovers.slice(0, 20)) {
  console.log(`    ${m.before} → ${m.after}  ${m.file} :: ${m.name}`);
}
check(
  'P8: at least one already-resolving declaration changed kind (predicted 4)',
  nonRefusedMovers.length > 0,
  `measured ${nonRefusedMovers.length}; if 0, one of my three published figures is wrong instead`
);

/* ---------------------------------- the published figures, re-derived */

const kindTotal = (/** @type {Map<string, number>} */ c, /** @type {string} */ side, /** @type {string} */ kind) => {
  let n = 0;
  for (const [k, v] of c) {
    const [b, a] = k.split('→');
    if ((side === 'before' ? b : a) === kind) n += v;
  }
  return n;
};
console.log(`\nA6 — my own published figures, re-derived from this cross-tab`);
const rows = [
  ['refused', 1510, 971],
  ['block', 4013, 4267],
  ['concise', 1828, 2117],
];
for (const [kind, pubBefore, pubAfter] of rows) {
  const mb = kindTotal(cells, 'before', kind);
  const ma = kindTotal(cells, 'after', kind);
  console.log(
    `  ${kind.padEnd(8)} published ${pubBefore} → ${pubAfter} · re-measured ${mb} → ${ma} · delta-of-deltas ${(ma - mb) - (pubAfter - pubBefore)}`
  );
}
console.log(
  `  published movement sums to ${(4267 - 4013) + (2117 - 1828)} against a refusal drop of ${1510 - 971} — an excess of ${(4267 - 4013) + (2117 - 1828) - (1510 - 971)}, which is P8's subject.`
);

console.log(`\n${fails === 0 ? 'ARM B GREEN' : `ARM B — ${fails} RED leg(s)`}`);
process.exitCode = fails === 0 ? 0 : 1;
