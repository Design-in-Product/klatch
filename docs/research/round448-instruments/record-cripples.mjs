/**
 * Round 448 — drive each cripple and GRADE it, rather than filing a crippled recording and
 * trusting the header.
 *
 * Theseus's Round 447 §4 is why this exists as a graded script and not three shell invocations:
 * he found three declared `KLATCH_R443_*` names that nothing in his file read, so
 * `KLATCH_R443_NOCATCH=1` printed `crippled: …` over a run whose every leg verdict was
 * byte-identical to the clean one. A recording filed as a crippled control was not one (356).
 *
 * Each row below declares WHICH LEG must redden. The grade is on the leg's own token changing
 * from ` ok ` to `RED `, and on the clean run NOT having it red — so a leg that was already red
 * cannot be counted as a cripple responding (431 — gate that the figure MOVED).
 *
 * Also recorded: a clean-vs-clean control, so the one thing that moves run-to-run anyway is
 * separated from a leg responding (his §4, same reason).
 */

import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { readVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SUBJECT = join(HERE, 'grade-the-four-list-scorer.mjs');

/** `stdio` pinned, so a child's stderr cannot be echoed into this recording (446 §1). */
const drive = (env) => {
  try {
    return execFileSync('node', [SUBJECT], {
      encoding: 'utf8', cwd: REPO, maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
  } catch (e) { return String(e.stdout ?? '') + String(e.stderr ?? ''); }
};

/** The per-leg token, read off the rendered leg lines rather than off the verdict list. */
const legTokens = (text) => {
  const out = {};
  for (const l of text.split('\n')) {
    const m = l.match(/^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /);
    if (m !== null) out[m[1]] = l.slice(0, 4);
  }
  return out;
};

const ROWS = [
  { env: { KLATCH_R448_LEGONLY: '1' }, mustRedden: 'G2', file: 'drive6.legonly-crippled.out',
    why: 'score the matrix with the RETIRED leg-only predicate — the two defect cells must stop disagreeing' },
  { env: { KLATCH_R448_BLINDPIN: '1' }, mustRedden: 'G4', file: 'drive7.blindpin-crippled.out',
    why: 'source the "was true when written" half from HEAD instead of the pin — both halves then read the same tree' },
  { env: { KLATCH_R448_NOTIMPLEMENTED: '1' }, mustRedden: 'G5', file: 'drive8.inert-name.out',
    why: 'request a KLATCH_R448_* name no hook implements — it must be named INERT, not reported active' },
];

const clean = drive({});
const clean2 = drive({});
const cleanLegs = legTokens(clean);
const cleanV = readVerdict(clean);

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

say(`CRIPPLE GRADING — subject docs/research/round448-instruments/grade-the-four-list-scorer.mjs`);
say(`clean run: ${cleanV.ok ? cleanV.verdict.token : cleanV.refusal} · leg tokens ${JSON.stringify(cleanLegs)}`);
say('');

// The run-to-run control first, so a line that moves on its own is identified BEFORE any cripple
// is credited with moving one.
const diffLines = (a, b) => {
  const A = a.split('\n'); const B = b.split('\n');
  const out = [];
  for (let i = 0; i < Math.max(A.length, B.length); i += 1) if (A[i] !== B[i]) out.push(i + 1);
  return out;
};
say(`CONTROL  clean vs clean#2 differing lines: ${JSON.stringify(diffLines(clean, clean2))}`
  + ` — anything here moves run-to-run and cannot be credited to a cripple`);
say('');

let allGood = cleanV.ok === true;
for (const r of ROWS) {
  const text = drive(r.env);
  const tok = legTokens(text);
  const rv = readVerdict(text);
  const was = cleanLegs[r.mustRedden] ?? '(absent)';
  const now = tok[r.mustRedden] ?? '(absent)';
  const reddened = was === ' ok ' && now === 'RED ';
  const others = Object.keys(cleanLegs).filter((k) => k !== r.mustRedden && cleanLegs[k] !== tok[k]);
  // The cripple must move its OWN leg and reach a verdict. A run that died before printing a
  // verdict line is a dead drive, not a cripple responding (447 §4 / 436).
  const good = reddened && rv.ok === true && others.length === 0;
  allGood = allGood && good;

  writeFileSync(join(HERE, r.file), text);
  say(`${good ? 'GOOD' : 'BAD '}  ${Object.keys(r.env)[0]}  →  ${r.mustRedden}: ${was.trim()} → ${now.trim()}`
    + ` · verdict ${rv.ok ? rv.verdict.token : rv.refusal} · other legs that also moved ${JSON.stringify(others)} (empty required)`);
  say(`        ${r.why}`);
  say(`        recorded: ${r.file}`);
}

say('');
say(`EVERY DECLARED CRIPPLE MOVES ITS OWN LEG AND ONLY ITS OWN LEG: ${allGood}`);
// Gated, not printed (435 — a printed self-test that gates nothing).
if (allGood !== true) { say('FAILED'); }
writeFileSync(join(HERE, 'drive9.cripple-grading.out'), `${lines.join('\n')}\n`);
process.exit(allGood === true ? 0 : 1);
