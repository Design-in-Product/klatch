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

import { readVerdict, readCorpusRows } from '../lib/verdict.mjs';

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

/**
 * The per-leg token, read off the rendered leg lines rather than off the verdict list — via the
 * lib as of Round 452, and filtered to the CANONICAL row shape.
 *
 * What this replaced: `/^(?: ok |RED |REF ) ([A-Z][A-Z0-9]*)  /` with the token taken as
 * `l.slice(0, 4)`. Two defects in one line. The regex was keyed on the padded, column-aligned
 * spelling the lib dropped on purpose, and its `[A-Z][A-Z0-9]*` id class silently excluded every
 * leg id that is not uppercase-initial. The `slice(0, 4)` is a hard-coded token WIDTH — Round 441
 * §3's third defect was exactly a four-character spelling of a five-character tag grading 3 of 4
 * cells wrong, so `FAIL`/`REFUSED`/`LANDED` would have come back truncated or indistinguishable.
 *
 * Why the id set is DECLARED and not discovered. The first version of this cure filtered on
 * `shape === 'canonical'`, on the reasoning that the subject imports `renderRows`. It read ZERO
 * legs: the subject imports `renderRows` and never calls it, emitting the padded legacy shape by
 * hand, exactly as 446 did. So the legacy branch is the only one that reads this subject — and
 * Round 452 `A2` shows the legacy branch cannot tell a leg row from a table cell, because no
 * character class on the id separates them anywhere in the corpus (leg ids that are lowercase file
 * addresses on one side, table cells spelled `DEFECT`, `REFUTED`, `GRADE` on the other). This
 * subject's own output carries result tables whose second column reads `preds-clean`, `REFUTED`,
 * `prefused`; read as legs they would enter `cleanLegs`, and a cripple that legitimately changed a
 * table would then fail the `others` check for a reason that is not the cripple.
 *
 * So the caller declares the set it grades, which is what the lib's docblock now tells a
 * legacy-shape caller to do. `CLEAN_MUST_PUBLISH` below keys the declaration against the clean run
 * so it cannot go stale silently.
 *
 * Tokens are now the lib's own spellings (`ok`/`RED`/`REF`), not four-character padded slices, so
 * the comparisons below changed with it.
 */
const GRADED_LEG_IDS = /^G[0-9]+$/;
const legTokens = (text) => {
  const out = {};
  for (const r of readCorpusRows(text).rows) {
    if (r.kind !== 'LEG' || !GRADED_LEG_IDS.test(r.id)) continue;
    out[r.id] = r.token;
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

/**
 * The declaration keyed against the clean run, so `GRADED_LEG_IDS` cannot silently go stale and
 * cannot silently read nothing. Round 452's first attempt at this reader returned `{}` and every
 * row then graded `(absent) → (absent)`, i.e. BAD — three cripples reported as not responding when
 * what had actually happened was that the reader read zero legs. A reader that reads nothing must
 * fail LOUDLY and by its own name, not as a verdict about its subject (441).
 */
const CLEAN_MUST_PUBLISH = ROWS.map((r) => r.mustRedden);
const declarationHolds = CLEAN_MUST_PUBLISH.every((id) => cleanLegs[id] !== undefined);

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

say(`CRIPPLE GRADING — subject docs/research/round448-instruments/grade-the-four-list-scorer.mjs`);
say(`clean run: ${cleanV.ok ? cleanV.verdict.token : cleanV.refusal} · leg tokens ${JSON.stringify(cleanLegs)}`);
say(`READER DECLARATION  ${String(GRADED_LEG_IDS)} over the legacy row branch · must publish `
  + `${JSON.stringify(CLEAN_MUST_PUBLISH)} · holds: ${declarationHolds}`
  + `${declarationHolds ? '' : ' ← THE READER READ NOTHING; every row below grades the reader, not the cripple'}`);
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

let allGood = cleanV.ok === true && declarationHolds;
for (const r of ROWS) {
  const text = drive(r.env);
  const tok = legTokens(text);
  const rv = readVerdict(text);
  const was = cleanLegs[r.mustRedden] ?? '(absent)';
  const now = tok[r.mustRedden] ?? '(absent)';
  // Token spellings are the lib's, not four-character padded slices (Round 452).
  const reddened = was === 'ok' && now === 'RED';
  const others = Object.keys(cleanLegs).filter((k) => k !== r.mustRedden && cleanLegs[k] !== tok[k]);
  // The cripple must move its OWN leg and reach a verdict. A run that died before printing a
  // verdict line is a dead drive, not a cripple responding (447 §4 / 436).
  const good = reddened && rv.ok === true && others.length === 0;
  allGood = allGood && good;

  writeFileSync(join(HERE, r.file), text);
  say(`${good ? 'GOOD' : 'BAD '}  ${Object.keys(r.env)[0]}  →  ${r.mustRedden}: ${was} → ${now}`
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
