/**
 * Round 463 — recon only. No legs, no verdict line.
 *
 * Daedalus's Round 462 §4 decomposed his lifted `parse`'s 57 DROPPED recordings as
 * `13 reached-the-PRED-gate + 44 refused-upstream {ROW_GRAMMAR_ABSENT:44}` and published the 44 as
 * "PRED-dropping but refused upstream", making the lib's 13 a FLOOR and 57 of 461 "the figure".
 *
 * This file measures, under the lib's own reader and not a re-typing, what the 44 actually are:
 *
 *   1. the whole refusal census over the committed `.out` corpus at a stamped rev;
 *   2. for the `ROW_GRAMMAR_ABSENT` members — do they declare `preds>0`? do they print ANY line in
 *      the canonical row grammar, in either vocabulary? i.e. is their zero-PRED-rows observation
 *      PRED-specific at all, or is the whole row grammar absent;
 *   3. for the 13 — do their LEG rows agree with their own `legs=N`? (the separation that would make
 *      "PRED-specific" mean something for the 13 and not for the 44).
 *
 * Selection is `git ls-tree` at a stamped rev with `-C` pinned, not `ls-files` and not a cwd-
 * sensitive call: the population must be reproducible from the rev alone.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTail, readVerdict, readRows } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (a) => execFileSync('git', ['-C', REPO, ...a], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});

const REV = git(['rev-parse', 'HEAD']).trim();
const outs = git(['ls-tree', '-r', REV, '--name-only']).trim().split('\n')
  .filter((p) => p.startsWith('docs/research/') && p.endsWith('.out'));
console.log(`rev ${REV}`);
console.log(`OUTS ${outs.length}`);

const text = new Map();
const buckets = {};
const rga = [];
const pred13 = [];
for (const p of outs) {
  const t = git(['show', `${REV}:${p}`]);
  text.set(p, t);
  const r = readTail(t);
  const code = r.ok === true ? 'ok' : String(r.refusal);
  buckets[code] = (buckets[code] ?? 0) + 1;
  if (code === 'ROW_GRAMMAR_ABSENT') rga.push(p);
  if (code === 'PRED_ROW_COUNT_DISAGREEMENT') pred13.push(p);
}
console.log(`REFUSAL CENSUS ${JSON.stringify(buckets)}`);

let declPredGt0 = 0;
let anyLegLine = 0;
let anyPredLine = 0;
const sample = [];
for (const p of rga) {
  const t = text.get(p);
  const v = readVerdict(t);
  const rr = readRows(t);
  const legLines = (t.match(/^LEG /gm) ?? []).length;
  const predLines = (t.match(/^PRED /gm) ?? []).length;
  if (v.ok === true && v.verdict.preds > 0) declPredGt0 += 1;
  if (legLines > 0) anyLegLine += 1;
  if (predLines > 0) anyPredLine += 1;
  if (sample.length < 8) {
    sample.push(`   ${v.ok === true ? `legs=${v.verdict.legs} preds=${v.verdict.preds}` : `V:${v.refusal}`}`
      + ` | rawLEG=${legLines} rawPRED=${predLines}`
      + ` | ${rr.ok === true ? `canonrows=${rr.rows.length}` : `R:${rr.refusal}`}`
      + ` | ${p.split('/').slice(-2).join('/')}`);
  }
}
console.log(`ROW_GRAMMAR_ABSENT ${rga.length} · declaring preds>0: ${declPredGt0}`
  + ` · with any raw 'LEG ' line: ${anyLegLine} · any raw 'PRED ' line: ${anyPredLine}`);
for (const s of sample) console.log(s);

let legOk13 = 0;
for (const p of pred13) {
  const t = text.get(p);
  const v = readVerdict(t);
  const rr = readRows(t);
  if (v.ok === true && rr.ok === true
    && rr.rows.filter((x) => x.kind === 'LEG').length === v.verdict.legs) legOk13 += 1;
}
console.log(`PRED_ROW_COUNT_DISAGREEMENT ${pred13.length} · LEG rows == legs=N in ${legOk13} of ${pred13.length}`);
