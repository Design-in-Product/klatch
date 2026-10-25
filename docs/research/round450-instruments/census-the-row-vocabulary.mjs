/**
 * Round 450 census — reproduce Theseus's Round 449 §4 row-vocabulary figure UNDER MY OWN KEY before
 * designing against it (340 — reproduce their figures under their own key, before correcting their
 * count; here: before *relying* on it).
 *
 * His table: `ok` 43, `LANDED` 33, `RED` 14, `OPEN` 11, `REFUSED` 6, `REF` 4, `REFUTED` 4, `FAIL` 2,
 * counted in RECORDINGS (files), not occurrences. I do not have his key, so this is an independent
 * one, and the design question it decides is narrow and stated before the run:
 *
 *   Do historical recordings spell a PREDICTION's outcome with the leg vocabulary (`ok`/`RED`/`REF`)
 *   or with its own (`LANDED`/`REFUTED`/`OPEN`)?
 *
 * because `renderTail` is about to grow prediction rows and the token set is mine to pick. If the
 * corpus and the prose both say LANDED/REFUTED/OPEN, picking ok/RED/REF for preds would invent a
 * ninth and tenth spelling while claiming to cure spelling drift.
 *
 * Population: `.out` files tracked at a STAMPED rev, selected with `ls-tree` (not `ls-files`), so
 * this is reproducible from the rev alone (419). Read from the worktree, which is gated clean for
 * those paths first — if it is not, this refuses rather than reporting a number off an edited tree.
 *
 * Shapes are POSITIVELY keyed and the leftover bucket is keyed too (411/439 — a terminal bucket
 * reached by fall-through absorbs every blindness): a line that looks row-like but matches neither
 * modelled shape lands in UNMODELLED_SHAPE and is reported with exemplars, not dropped.
 */

import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', ['-C', REPO, ...args], {
  encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
}).trimEnd();

const REV = git(['rev-parse', 'HEAD']);
const say = (s) => console.log(s);
say(`REV ${REV}`);

// Gate: every population path must be unmodified in the worktree, or the figure is off a tree the
// rev does not describe.
const dirty = git(['status', '--porcelain', '--', 'docs/research'])
  .split('\n').filter((l) => l !== '' && !l.startsWith('?? '));
if (dirty.length > 0) {
  say(`REFUSED: ${dirty.length} tracked path(s) under docs/research are modified; a census off this`);
  say('tree would not be reproducible from the rev. First dirty entries:');
  for (const d of dirty.slice(0, 5)) say(`  ${d}`);
  process.exit(2);
}

const files = git(['ls-tree', '-r', '--name-only', REV, '--', 'docs/research'])
  .split('\n').filter((p) => p.endsWith('.out'));
say(`population: ${files.length} committed .out file(s) under docs/research at ${REV.slice(0, 8)}`);

// Shape A — the historical, token-first, column-padded row: `[ ok ] G1  detail`.
const TOKEN_FIRST = /^ *(ok|FAIL|RED|REF|REFUSED|REFUTED|LANDED|OPEN) +([A-Za-z0-9_.:-]+)(?: |$)/;
// Shape B — the canonical row `verdict.mjs` emits today: `LEG G1 ok detail`.
const CANONICAL = /^(LEG|PRED) +([A-Za-z0-9_.:-]+) +([A-Za-z0-9_]+)(?: |$)/;
// Shape C — a THIRD historical row grammar, found by the first run of this census and keyed
// positively rather than left inside the leftover bucket: `GRADE A1: true — detail`. The first run
// reported 400 row-like leftovers (its own cap) and the exemplars were almost all this shape plus
// ordinary prose, which is why 400 was never published as a blindness figure: the leftover key
// below is wider than any row grammar and catches English (356/368 — a terminal bucket reached by
// fall-through absorbs every blindness, and a too-wide bucket manufactures one).
const GRADE_LINE = /^ *GRADE +([A-Za-z0-9_.:-]+): +(true|false|null)(?: |$)/;
// A line that LOOKS row-like: starts with a word then an id-ish word. Deliberately wider than the
// three shapes above — what it catches and they do not is reported as a CEILING on my blindness,
// not as a defect count, because prose satisfies it too.
const ROWLIKE = /^ *([A-Za-z][A-Za-z0-9_]*) +([A-Za-z0-9_.:-]+)/;

const filesWith = new Map();   // spelling -> Set(file)
const occurrences = new Map(); // spelling -> count
const byKind = new Map();      // `${prefix}:${token}` -> count   (canonical rows only)
const unmodelled = [];         // exemplars of row-like-but-neither

const bump = (map, k, by = 1) => map.set(k, (map.get(k) ?? 0) + by);
const note = (sp, f) => {
  if (!filesWith.has(sp)) filesWith.set(sp, new Set());
  filesWith.get(sp).add(f);
  bump(occurrences, sp);
};

for (const f of files) {
  let text;
  try { text = readFileSync(join(REPO, f), 'utf8'); } catch { continue; }
  for (const l of text.split('\n')) {
    const c = l.match(CANONICAL);
    if (c !== null) { note(c[3], f); bump(byKind, `${c[1]}:${c[3]}`); continue; }
    const a = l.match(TOKEN_FIRST);
    if (a !== null) { note(a[1], f); bump(byKind, `tokenfirst:${a[1]}`); continue; }
    const g = l.match(GRADE_LINE);
    if (g !== null) { bump(byKind, `GRADE:${g[2]}`); bump(occurrences, '(GRADE-line)'); continue; }
    if (ROWLIKE.test(l) && unmodelled.length < 400) unmodelled.push([f, l]);
  }
}

say('');
say('spelling      files  occurrences');
const ordered = [...filesWith.entries()].sort((x, y) => y[1].size - x[1].size);
for (const [sp, set] of ordered) {
  say(`${sp.padEnd(12)}  ${String(set.size).padStart(5)}  ${String(occurrences.get(sp)).padStart(11)}`);
}
say(`DISTINCT SPELLINGS: ${ordered.length}`);

say('');
say('canonical rows by kind (prefix:token → occurrences):');
const canon = [...byKind.entries()].filter(([k]) => k.startsWith('LEG:') || k.startsWith('PRED:'));
if (canon.length === 0) say('  (none — no recording in the population uses the LEG/PRED grammar)');
for (const [k, n] of canon.sort((x, y) => y[1] - x[1])) say(`  ${k.padEnd(16)} ${n}`);

say('');
// The design question, answered by the data rather than by taste.
const PRED_SPELLINGS = ['LANDED', 'REFUTED', 'OPEN'];
const LEG_SPELLINGS = ['ok', 'RED', 'REF'];
const predFiles = new Set();
for (const sp of PRED_SPELLINGS) for (const f of filesWith.get(sp) ?? []) predFiles.add(f);
say(`PREDICTION vocabulary (LANDED/REFUTED/OPEN) appears in ${predFiles.size} recording(s)`);
for (const sp of [...PRED_SPELLINGS, ...LEG_SPELLINGS]) {
  say(`  ${sp.padEnd(8)} ${String(filesWith.get(sp)?.size ?? 0).padStart(4)} file(s)`);
}

say('');
say(`GRADE-line grammar (shape C): ${occurrences.get('(GRADE-line)') ?? 0} occurrence(s)`);
for (const [k, n] of [...byKind.entries()].filter(([k2]) => k2.startsWith('GRADE:'))) say(`  ${k} ${n}`);
say('');
say(`LEFTOVER (CEILING, not a defect count — this key catches prose): ${unmodelled.length} line(s)`
  + `${unmodelled.length >= 400 ? ' — AT THE CAP, so this is the cap and not the terrain' : ''}`);
for (const [f, l] of unmodelled.slice(0, 8)) say(`  ${f.split('/').pop()}: ${JSON.stringify(l.slice(0, 72))}`);
