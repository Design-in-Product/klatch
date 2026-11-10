#!/usr/bin/env node
/**
 * unit-465anchor-census — the census Daedalus's §5 says neither seat has.
 *
 * For every copier under `scripts/` that asserts an anchor occurs exactly once in a file it copies,
 * count that anchor's occurrences in every candidate subject AND in every copier (including itself).
 * The second column is the mechanism that crashed `probe-round377` on 2026-11-09: an anchor literal
 * written into copier X's bytes, where X is itself a subject of copier Y asserting the same literal.
 *
 * Anchor VALUES are extracted from each copier's own source. None is typed here (R2).
 * A cell that cannot be extracted prints UNREAD with its reason; it is never dropped or filled in.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');

// Refuse loudly rather than report empty cells from the wrong depth.
if (!existsSync(join(SCRIPTS, 'sweep-probes.mjs'))) {
  console.log(`REFUSED — scripts/ not found at ${SCRIPTS} (resolved from ${HERE})`);
  process.exit(2);
}
console.log(`scripts/ resolved to: ${SCRIPTS}`);

const occ = (hay, needle) => (needle === '' ? -1 : hay.split(needle).length - 1);

// ---- 1. the copier population, by source scan for the uniqueness-assertion THROW ----------------
const files = readdirSync(SCRIPTS).filter((f) => f.endsWith('.mts') || f.endsWith('.mjs'));
const src = new Map(files.map((f) => [f, readFileSync(join(SCRIPTS, f), 'utf8')]));

const THROW = /throw new Error\(`anchor not unique/;
const copiers = files.filter((f) =>
  src.get(f).split('\n').some((l) => THROW.test(l)),
);
console.log(`\n== 1. copiers (a line that THROWS on a non-unique anchor; prose mentions excluded) ==`);
console.log(`files scanned: ${files.length}`);
for (const c of copiers) {
  const lines = src.get(c).split('\n');
  const at = lines.findIndex((l) => THROW.test(l)) + 1;
  console.log(`  ${c}  (throw at :${at})`);
}
// Files that MENTION the message but do not throw — reported so the exclusion is visible.
const mentions = files.filter((f) => !copiers.includes(f) && src.get(f).includes('anchor not unique'));
for (const m of mentions) console.log(`  excluded (mentions, no throw): ${m}`);

// ---- 2. anchors per copier: the 2nd argument of each once() call, resolved in that file ----------
const CALL = /\bonce\(\s*([A-Za-z0-9_.$]+)\s*,\s*([A-Za-z0-9_.$]+)\s*,/g;
const anchors = []; // {copier, id, line, rhs, kind, value}

for (const c of copiers) {
  const text = src.get(c);
  const lines = text.split('\n');
  console.log(`\n== 2. once() call sites in ${c} ==`);
  const ids = new Set();
  lines.forEach((l, i) => {
    CALL.lastIndex = 0;
    let m;
    while ((m = CALL.exec(l)) !== null) {
      console.log(`  :${i + 1}  ${l.trim().slice(0, 110)}`);
      ids.add(m[2]);
    }
  });
  for (const id of ids) {
    const declIdx = lines.findIndex((l) => l.startsWith(`const ${id} = `));
    if (declIdx === -1) {
      anchors.push({ copier: c, id, line: null, rhs: null, kind: 'UNREAD', reason: 'no top-level `const <id> = ` declaration in this file (function parameter or imported)' });
      continue;
    }
    const rhs = lines[declIdx].slice(`const ${id} = `.length);
    // hand-typed iff the whole RHS is one quoted string literal and the statement ends on this line
    const lit = /^(['"])((?:\\.|(?!\1)[^\\])*)\1;\s*(\/\/.*)?$/.exec(rhs);
    if (lit) {
      let value;
      try {
        value = JSON.parse(lit[1] === '"' ? `${lit[1]}${lit[2]}${lit[1]}` : JSON.stringify(lit[2]).replace(/\\\\/g, '\\'));
      } catch {
        value = null;
      }
      if (value === null) {
        anchors.push({ copier: c, id, line: declIdx + 1, rhs, kind: 'UNREAD', reason: 'quoted literal would not parse' });
      } else {
        anchors.push({ copier: c, id, line: declIdx + 1, rhs, kind: 'hand-typed', value });
      }
    } else {
      anchors.push({ copier: c, id, line: declIdx + 1, rhs, kind: 'derived', value: null });
    }
  }
}

console.log(`\n== 3. anchors, with the declaration RHS printed verbatim so the classification is checkable ==`);
for (const a of anchors) {
  console.log(`  ${a.copier.slice(0, 18)}… ${a.id} @${a.line ?? '-'} [${a.kind}] ${a.kind === 'UNREAD' ? a.reason : a.rhs.slice(0, 96)}`);
}
const handTyped = anchors.filter((a) => a.kind === 'hand-typed');
const derived = anchors.filter((a) => a.kind === 'derived');
const unread = anchors.filter((a) => a.kind === 'UNREAD');
console.log(`  totals: ${anchors.length} anchors — ${handTyped.length} hand-typed, ${derived.length} derived, ${unread.length} UNREAD`);

// ---- 4. candidate subject files: probe filenames declared in any copier, plus the copiers ---------
const SUBJ = /^const ([A-Za-z0-9_]+) = '(probe-[^']+\.mts)';/;
const subjects = new Map(); // filename -> how it entered the set
for (const c of copiers) {
  for (const l of src.get(c).split('\n')) {
    const m = SUBJ.exec(l);
    if (m && src.has(m[2])) subjects.set(m[2], `${c.slice(0, 18)}… declares it as ${m[1]}`);
  }
}
for (const c of copiers) if (!subjects.has(c)) subjects.set(c, 'is itself a copier');
console.log(`\n== 4. candidate files counted against (superset of the APPLIED pairs; see RESULTS) ==`);
for (const [f, why] of subjects) console.log(`  ${f}  — ${why}`);

// ---- 5. the census: occ(anchor, file) for every hand-typed anchor -------------------------------
console.log(`\n== 5. CENSUS — occ(file, anchor) for each hand-typed anchor ==`);
let collisions = 0;
let ones = 0;
let zeros = 0;
for (const a of handTyped) {
  console.log(`\n  anchor ${a.id} (${a.copier.slice(0, 18)}…:${a.line})`);
  for (const [f] of subjects) {
    const n = occ(src.get(f), a.value);
    const flag = n > 1 ? '  <-- COLLISION (>1)' : '';
    if (n > 1) collisions++;
    else if (n === 1) ones++;
    else zeros++;
    console.log(`    ${String(n).padStart(2)}  ${f}${flag}`);
  }
}
for (const a of derived) console.log(`\n  anchor ${a.id} (${a.copier.slice(0, 18)}…:${a.line}) — DERIVED, not counted: its value is computed from the subject at run time`);
for (const a of unread) console.log(`\n  anchor ${a.id} (${a.copier.slice(0, 18)}…) — UNREAD: ${a.reason}`);

console.log(`\n== 6. HEADLINE ==`);
console.log(`copiers: ${copiers.length} · anchors: ${anchors.length} (${handTyped.length} hand-typed, ${derived.length} derived, ${unread.length} UNREAD) · files: ${subjects.size}`);
console.log(`cells counted: ${collisions + ones + zeros} — ${collisions} at >1 (COLLISION), ${ones} at exactly 1, ${zeros} at 0`);
