/**
 * Round 450 post-commit re-drive. The declarations below are written BEFORE the commit and the
 * diff is read after it, because a reread cannot catch a cell that inverts on its own promotion
 * (437/447 — commit, re-drive, diff the VERDICT map; never draft the slot for a running
 * measurement).
 *
 * MUST MOVE:
 *   - the `rev` stamp, trivially.
 *   - `Q1`'s PARENTHETICAL — the figure including this round's own directory. This round's drives
 *     publish canonical `LEG` rows and are the first recordings in the repo's history to publish a
 *     `PRED` row, so both the count and `withPred` must rise once they are committed. If they do
 *     not, the recordings did not land.
 *
 * MUST NOT MOVE:
 *   - every leg verdict, W1..W9.
 *   - `Q1`'s figure OUTSIDE this round's directory (13/390, PRED 0). This is the pair that makes
 *     the adoption claim non-self-inflating; if the outside figure moves when only my own files
 *     were added, the exclusion is not working (449 §5.6).
 *   - `W9`, which is pinned to a literal pre-round rev rather than to HEAD~1.
 */

import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readTail, writeRecording, TrackedTargetError } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const BEFORE = join(HERE, 'drive7.pre-commit-final.out');

const out = [];
const say = (s) => { out.push(s); console.log(s); };

const before = readFileSync(BEFORE, 'utf8');
const after = execFileSync('node', [join(HERE, 'grade-the-row-guards.mjs')], {
  encoding: 'utf8', cwd: REPO, maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'],
});

say('ROUND 450 POST-COMMIT RE-DRIVE — drive7 (pre-commit) vs a fresh drive at the commit');
say('');

// The verdict MAP, compared through the lib's own reader rather than by eye.
const vb = readTail(before);
const va = readTail(after);
say(`pre-commit  tail: ${vb.ok ? `ok legs=${vb.verdict.legs} red=${JSON.stringify(vb.verdict.red)} `
  + `refused=${JSON.stringify(vb.verdict.refused)} refuted=${JSON.stringify(vb.verdict.refuted)}` : vb.refusal}`);
say(`post-commit tail: ${va.ok ? `ok legs=${va.verdict.legs} red=${JSON.stringify(va.verdict.red)} `
  + `refused=${JSON.stringify(va.verdict.refused)} refuted=${JSON.stringify(va.verdict.refuted)}` : va.refusal}`);

const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const mapsIdentical = vb.ok && va.ok
  && vb.verdict.token === va.verdict.token
  && vb.verdict.legs === va.verdict.legs
  && sameList(vb.verdict.red, va.verdict.red)
  && sameList(vb.verdict.refused, va.verdict.refused)
  && sameList(vb.verdict.refuted, va.verdict.refuted)
  && sameList(vb.verdict.prefused, va.verdict.prefused);
say(`VERDICT MAPS IDENTICAL: ${mapsIdentical}`);
say('');

// Per-row comparison, keyed on the row id, through the reader — so a row that changed its token is
// named rather than summarised.
const rowsOf = (t) => {
  const r = readTail(t);
  const m = new Map();
  if (r.ok) for (const row of r.rows) m.set(`${row.kind} ${row.id}`, row);
  return m;
};
const rb = rowsOf(before);
const ra = rowsOf(after);
const ids = [...new Set([...rb.keys(), ...ra.keys()])].sort();
const tokenMoved = [];
const detailMoved = [];
for (const id of ids) {
  const x = rb.get(id);
  const y = ra.get(id);
  if (x === undefined || y === undefined) { tokenMoved.push(`${id}(present in one run only)`); continue; }
  if (x.token !== y.token) tokenMoved.push(`${id}: ${x.token}→${y.token}`);
  else if (x.what !== y.what) detailMoved.push(id);
}
say(`rows compared: ${ids.length} · TOKENS MOVED: ${JSON.stringify(tokenMoved)}`);
say(`details moved: ${JSON.stringify(detailMoved)}`);
say('');

// The declared expectations, each checked rather than described.
const DECLARED_DETAIL_MOVERS = ['PRED Q1'];
const unexpected = detailMoved.filter((id) => !DECLARED_DETAIL_MOVERS.includes(id));
const declaredButStill = DECLARED_DETAIL_MOVERS.filter((id) => !detailMoved.includes(id));

// And the half of Q1 that must NOT have moved, read out of both runs rather than inferred from
// "the row's detail changed".
const outsideFigure = (t) => {
  const m = t.match(/canonical rows in (\d+)\/(\d+) committed recordings OUTSIDE[^·]*· PRED rows outside: (\d+)/);
  return m === null ? null : `${m[1]}/${m[2]} predrows=${m[3]}`;
};
const ob = outsideFigure(before);
const oa = outsideFigure(after);
const outsideHeld = ob !== null && oa !== null && ob === oa;
say(`Q1 OUTSIDE this round's directory: pre ${ob} · post ${oa} · HELD: ${outsideHeld}`);
if (ob === null || oa === null) say('  (a null here is a slicer refusal, not an agreement — the leg below fails)');

const gate = mapsIdentical && tokenMoved.length === 0 && unexpected.length === 0
  && declaredButStill.length === 0 && outsideHeld;
say('');
say(`UNEXPECTED movers: ${JSON.stringify(unexpected)} · declared movers that did NOT move: `
  + `${JSON.stringify(declaredButStill)}`);
say(`GATE: ${gate}`);

const target = process.argv[2] ?? null;
if (target !== null) {
  try {
    writeRecording(join(HERE, target), `${out.join('\n')}\n`);
    console.log(`recorded → ${target}`);
  } catch (e) {
    if (!(e instanceof TrackedTargetError)) throw e;
    console.log(`REFUSED to re-stamp a committed recording: ${target}`);
    process.exitCode = 3;
  }
}
