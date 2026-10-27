/**
 * Round 462 — recon only. No legs, no verdict line: this file SELECTS the inputs the graded cell
 * will use, and is committed so the selection is reproducible rather than hand-typed.
 *
 * Three questions:
 *   1. Which committed `.out` recordings does the lib's OWN reader refuse with
 *      `PRED_ROW_COUNT_DISAGREEMENT`? (Theseus's 457 §3 figure was 13 at `df5a27cc`. Reproducing it
 *      under HIS key before building anything on my own.)
 *   2. Which recordings are PRED-COMPLETE with at least one PRED row? (the control input)
 *   3. How large is round456's live subject population now? (the declared cost of a whole-cell drive)
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTail, readVerdict, readRows } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, {
  cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});

const REV = git(['rev-parse', 'HEAD']).trim();
const tracked = git(['ls-tree', '-r', REV, '--name-only']).trim().split('\n');
const outs = tracked.filter((p) => p.startsWith('docs/research/') && p.endsWith('.out'));
console.log(`rev ${REV}`);
console.log(`OUTS ${outs.length}`);

const dropped = [];
const complete = [];
const refusals = {};
for (const p of outs) {
  const t = git(['show', `${REV}:${p}`]);
  const r = readTail(t);
  const code = r.ok === true ? 'ok' : String(r.refusal);
  refusals[code] = (refusals[code] ?? 0) + 1;
  if (code === 'PRED_ROW_COUNT_DISAGREEMENT') dropped.push([p, r.verdict.preds]);
  if (code === 'ok' && r.rows.filter((x) => x.kind === 'PRED').length > 0) {
    complete.push([p, r.verdict.preds, r.rows.filter((x) => x.kind === 'PRED').length]);
  }
}
console.log(`REFUSAL CENSUS ${JSON.stringify(refusals)}`);
console.log(`PRED_ROW_COUNT_DISAGREEMENT ${dropped.length}:`);
for (const [p, n] of dropped) console.log(`   preds=${n}  ${p}`);
console.log(`PRED-COMPLETE with >=1 PRED row: ${complete.length}`);
for (const [p, n, m] of complete.slice(0, 12)) console.log(`   preds=${n} rows=${m}  ${p}`);

// round456's live subject population — the cost of a whole-cell drive, measured not guessed.
const mjs = tracked.filter((p) => p.endsWith('.mjs') && p.startsWith('docs/research/'));
let pop = 0;
let checkouts = 0;
for (const p of mjs) {
  const s = git(['show', `${REV}:${p}`]);
  if ((s.includes('renderVerdict(') || s.includes('renderTail(')) && !s.includes('export function renderVerdict')) {
    pop += 1;
    if (/['"`]checkout['"`]/.test(s)) checkouts += 1;
  }
}
console.log(`ROUND456 POPULATION ${pop} member(s), ${checkouts} excluded on a 'checkout' call`);

// The KP's own baseline set, as round456 joins it.
const KPDIR = 'docs/research/round449-instruments';
const sibs = outs.filter((p) => dirname(p) === KPDIR);
console.log(`KP DIR siblings ${sibs.length}`);
for (const p of sibs) {
  const t = git(['show', `${REV}:${p}`]);
  const v = readVerdict(t);
  const r = readRows(t);
  const rows = r.ok === true ? r.rows : [];
  console.log(`   ${v.ok === true ? `preds=${v.verdict.preds} legs=${v.verdict.legs}` : `REFUSED ${v.refusal}`}`
    + `  PREDrows=${rows.filter((x) => x.kind === 'PRED').length} LEGrows=${rows.filter((x) => x.kind === 'LEG').length}`
    + `  ${p.slice(KPDIR.length + 1)}`);
}
