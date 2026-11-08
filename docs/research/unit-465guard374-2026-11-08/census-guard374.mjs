/**
 * unit-465guard374 census — P1, P2, P3, P4.
 *
 * Keys the two questions Daedalus's U2 routed, but under THIS seat's key:
 *
 *  1. `.refusal!` / `.skip!` dereferences, counted by OCCURRENCE rather than by matching line, with
 *     LIVE split from comment prose by `lib/strip-source.mjs`, and the two `stripSource` readings
 *     reported SEPARATELY so a template-literal interpolation cannot hide a live site (P2).
 *  2. A non-null-asserted `.find(…)!` over any receiver — not only the bare `SWEPT` import — so a
 *     mutant-registry lookup is in the population rather than outside the selector (P4).
 *
 * Every candidate line is PRINTED. The strength of the figures below is a hand read of that print,
 * not this scanner: a scanner under-reports, and these two selectors are mine.
 *
 * DECLARED, because it is a defect of this instrument and not of its subject: the paren-balanced
 * argument reader in `argEnd` below is a FOURTH private copy of the question Round 257 named as
 * duplicated and Round 258 measured — `lib/skipped-shape-census.mts:98` has one, unexported. It is
 * hand-rolled here rather than shared, and that is routed in RESULTS, not fixed from this seat in
 * this fire.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(HERE, '..', '..', '..', 'scripts');

/** Every `.mts`/`.mjs` under `scripts/`, recursively, sorted — counted with readdirSync, not grep. */
const walk = (dir) => {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(mts|mjs)$/.test(name)) out.push(full);
  }
  return out;
};

const FILES = walk(SCRIPTS);

/** 1-indexed line number of an offset, counted on the ORIGINAL source. */
const lineOf = (src, off) => src.slice(0, off).split('\n').length;
const lineAt = (src, off) => {
  const start = src.lastIndexOf('\n', off - 1) + 1;
  const end = src.indexOf('\n', off);
  return src.slice(start, end === -1 ? src.length : end).trim();
};

/**
 * The index just past the `)` closing a call whose `(` is at `open`, read by paren balance over the
 * MASKED source so that a paren inside a string or comment cannot move the count. `-1` if
 * unbalanced. Length-preservation in `stripSource` is what makes an index from the mask usable
 * against the original.
 */
const argEnd = (masked, open) => {
  let depth = 0;
  for (let i = open; i < masked.length; i += 1) {
    if (masked[i] === '(') depth += 1;
    else if (masked[i] === ')') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
};

const DEREF = /\.(refusal|skip)!/g;
const FIND = /\.find\(/g;

/** Offsets at which `re` matches inside `text`. */
const offsetsIn = (text, re) => {
  const out = [];
  re.lastIndex = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) out.push({ off: m.index, text: m[0] });
  return out;
};

const derefRows = [];
const findRows = [];

for (const full of FILES) {
  const src = readFileSync(full, 'utf8');
  const rel = relative(SCRIPTS, full);
  const keepStrings = stripSource(src, false); // comments blanked, strings + templates KEPT
  const blankStrings = stripSource(src, true); // comments AND string/template bodies blanked

  // --- P1/P2: dereferences, occurrence-counted, under BOTH readings -------------------------
  for (const { off, text } of offsetsIn(src, DEREF)) {
    const inKeep = keepStrings.slice(off, off + text.length) === text;
    const inBlank = blankStrings.slice(off, off + text.length) === text;
    derefRows.push({
      file: rel,
      line: lineOf(src, off),
      off,
      text,
      // LIVE is the `blankStrings=false` reading: comments gone, interpolations still visible.
      live: inKeep,
      visibleWhenStringsBlanked: inBlank,
      src: lineAt(src, off),
    });
  }

  // --- P4: non-null-asserted `.find(…)!`, any receiver ---------------------------------------
  for (const { off } of offsetsIn(src, FIND)) {
    if (blankStrings.slice(off, off + 6) !== '.find(') continue; // the call itself must be live
    const close = argEnd(blankStrings, off + 5);
    if (close === -1) continue;
    if (src[close] !== '!') continue;
    const receiverStart = src.lastIndexOf(' ', off) + 1;
    findRows.push({
      file: rel,
      line: lineOf(src, off),
      receiver: src.slice(receiverStart, off),
      src: lineAt(src, off),
    });
  }
}

const MINE = [
  'probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts',
  'probe-round374b-the-subject-reaches-the-state-itself-on-a-held-port.mts',
];

const live = derefRows.filter((r) => r.live);
const prose = derefRows.filter((r) => !r.live);
const hiddenByStringBlanking = live.filter((r) => !r.visibleWhenStringsBlanked);
const mineLive = live.filter((r) => MINE.includes(r.file));
const mineFind = findRows.filter((r) => MINE.includes(r.file));

const byFile = (rows) => {
  const m = new Map();
  for (const r of rows) m.set(r.file, (m.get(r.file) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

console.log(`POPULATION  ${FILES.length} .mts/.mjs files under scripts/ (readdirSync, recursive)`);
console.log('');
console.log('=== P1/P3 — .refusal!/.skip! dereferences, OCCURRENCE-counted ===');
console.log(`  raw matches:              ${derefRows.length}`);
console.log(`  LIVE (comments blanked):  ${live.length}   across ${byFile(live).length} files`);
console.log(`  comment prose:            ${prose.length}`);
console.log('  LIVE by file:');
for (const [f, n] of byFile(live)) console.log(`    ${String(n).padStart(3)}  ${f}`);
console.log('');
console.log('=== P2 — the two stripSource readings, and what the stricter one hides ===');
console.log(`  LIVE sites invisible under blankStrings=true: ${hiddenByStringBlanking.length}`);
for (const r of hiddenByStringBlanking) console.log(`    ${r.file}:${r.line}  ${r.src}`);
console.log('');
console.log(`=== P1 — THIS SEAT'S TWO FILES: ${mineLive.length} live dereferences ===`);
for (const r of mineLive) {
  console.log(`  ${r.file.slice(0, 22)}…:${String(r.line).padStart(3)}  ${r.text}  | ${r.src}`);
}
console.log('');
console.log('=== P4 — non-null-asserted .find(…)! sites, ANY receiver ===');
console.log(`  total: ${findRows.length}   across ${byFile(findRows).length} files`);
for (const r of findRows) {
  console.log(`  ${r.file}:${r.line}  receiver=${r.receiver || '(none)'}`);
}
console.log('');
console.log(`  of which in this seat's two files: ${mineFind.length}`);
console.log('');
console.log('=== ALL comment-prose matches, printed so the split is auditable ===');
for (const r of prose) console.log(`  ${r.file}:${r.line}  ${r.src.slice(0, 90)}`);
console.log('');
console.log(
  `SUMMARY live=${live.length} files=${byFile(live).length} mine=${mineLive.length} ` +
    `finds=${findRows.length} minefinds=${mineFind.length} hidden=${hiddenByStringBlanking.length}`,
);
