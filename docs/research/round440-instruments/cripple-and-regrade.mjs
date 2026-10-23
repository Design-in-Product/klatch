/**
 * Round 440 vacuity. Each cell cripples ONE key of
 * `census-the-gate-line-grammar-his-cure-must-cover.mjs` and requires the leg aimed at it to MOVE.
 * A leg that cannot be moved by breaking the thing it claims to read is not evidence about the
 * population; it is a sentence that would print either way.
 *
 * Two pieces of discipline this file exists to hold, both learned the hard way:
 *
 * - The mutated copy is **dot-prefixed, pid-stamped, and in the instrument's own directory**, so
 *   the committed file is never written and `HERE`-relative resolution still works. Round 438's
 *   first drive put it in `os.tmpdir()` and every cell refused on an unresolvable relative import
 *   (421). A dot-prefixed untracked file is also absent from `ls-tree`, so it cannot join the
 *   population it drives.
 * - Each cell asserts the **anchor it edits occurs exactly once** before editing, and then that the
 *   FIGURE MOVED — not merely that the edit landed (347/389/422). A cell that only checked the
 *   write would pass against a crippled copy that still printed the original verdict.
 */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SUBJECT = join(HERE, 'census-the-gate-line-grammar-his-cure-must-cover.mjs');
const SRC = readFileSync(SUBJECT, 'utf8');

const verdictOf = (out) => {
  const gl = out.split('\n').find((l) => l.startsWith('GATE:')) ?? null;
  if (gl === null) return { gate: null, red: null, refused: null, raw: null };
  return {
    gate: gl.startsWith('GATE: true'),
    red: (gl.match(/RED: ([^·]*?)(?:\s{2,}\w+:|$)/)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    refused: (gl.match(/REFUSED: (.*)$/)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    raw: gl,
  };
};

function drive(path, env = {}) {
  try {
    return execFileSync('node', [path], {
      cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 900_000,
      env: { ...process.env, ...env },
    });
  } catch (e) { return `${e.stdout ?? ''}${e.stderr ?? ''}`; }
}

// The baseline is driven here rather than read out of drive2.out, so base and cell differ by the
// cripple and by nothing else — including nothing about when they ran (339).
const base = verdictOf(drive(SUBJECT));
console.log(`BASE  ${base.raw}`);

const CELLS = [
  {
    id: 'C1',
    leg: 'G2',
    how: 'the POPULATION key, by env: only `attack` selects, so 1 member instead of 11 and the '
      + 'member list cannot agree with the one parsed out of his drive',
    env: { KLATCH_R440_GRADERRE: 'attack' },
    want: (v) => v.red.includes('G2'),
  },
  {
    id: 'C2',
    leg: 'G9',
    how: 'ONE of G9\'s four label forms is deleted, so the two members that carry `) — FALSE: …` '
      + 'become label-shaped-but-matching-no-form. G9 must redden on its unrecognised count — the '
      + 'state it exists to distinguish from "no label at all"',
    anchor: "    { id: ') — FALSE: …', re: /\\)\\s*—\\s*FALSE:\\s*(.+)$/ },\n",
    to: '',
    want: (v) => v.red.includes('G9'),
  },
  {
    id: 'C3',
    leg: 'G6',
    how: 'G6\'s per-leg reader is re-keyed from `FAIL` to `FALSE` — the token round431/433/435 '
      + 'actually print. This is the one cell whose movement is a MEASUREMENT and not only a '
      + 'vacuity check: if G6 goes GREEN, the 0/3 in the live drive is about the token my Round 438 '
      + 'reader was keyed to and not about the rows being unreadable',
    anchor: "  const PER_LEG = /^\\s*FAIL\\s+(G\\d+)\\b/;\n",
    to: "  const PER_LEG = /^\\s*FALSE\\s+(G\\d+)\\b/;\n",
    want: (v) => !v.red.includes('G6'),
  },
];

const rows = [];
for (const c of CELLS) {
  const copy = join(HERE, `.cripple-${c.id}-${process.pid}.mjs`);
  let occurrences = null;
  let text = SRC;
  if (c.anchor !== undefined) {
    occurrences = SRC.split(c.anchor).length - 1;
    text = SRC.split(c.anchor).join(c.to);
  }
  writeFileSync(copy, text);
  let v;
  try {
    const edited = c.anchor === undefined ? true : readFileSync(copy, 'utf8') !== SRC;
    v = verdictOf(drive(copy, c.env ?? {}));
    const anchorOk = c.anchor === undefined ? true : occurrences === 1 && edited;
    rows.push({
      ...c,
      occurrences,
      moved: v.raw === null ? null
        : JSON.stringify([v.red, v.refused]) !== JSON.stringify([base.red, base.refused]),
      hit: v.raw === null ? null : c.want(v),
      ok: v.raw === null ? null : anchorOk && c.want(v)
        && JSON.stringify([v.red, v.refused]) !== JSON.stringify([base.red, base.refused]),
      raw: v.raw,
    });
  } finally { try { unlinkSync(copy); } catch { /* already gone */ } }
}

for (const r of rows) {
  console.log(`${r.ok === true ? ' ok ' : r.ok === null ? 'REF ' : 'FAIL'}  ${r.id} → ${r.leg}  ${r.how}`);
  console.log(`        anchor occurrences: ${r.occurrences ?? 'n/a (env cripple)'} · figure moved: ${r.moved} · aimed leg hit: ${r.hit}`);
  console.log(`        ${r.raw ?? '(no GATE line — cell produced no verdict)'}`);
}
const bad = rows.filter((r) => r.ok !== true);
console.log('');
console.log(`VACUITY: ${rows.filter((r) => r.ok === true).length}/${rows.length} cells move on the leg aimed at`
  + `${bad.length ? `   FAILED: ${bad.map((r) => r.id).join(', ')}` : ''}`);
console.log(`  subject blob ${execFileSync('git', ['hash-object', SUBJECT], { cwd: REPO, encoding: 'utf8' }).trim().slice(0, 8)}`
  + ` · subject unchanged on disk: ${readFileSync(SUBJECT, 'utf8') === SRC}`);
