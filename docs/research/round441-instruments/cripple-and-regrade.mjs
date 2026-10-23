/**
 * Round 441 — vacuity. Each cell cripples ONE thing the instrument claims to be reading and
 * asserts that a NAMED FIGURE moves, not merely that the verdict flipped: a guard that fires
 * beside a figure that still prints is the shape this chain keeps rediscovering (353/422), and an
 * edit asserted to have landed is not an edit asserted to have mattered (347/389/422).
 *
 * Two cells are driven through the subject's own key parameters, which exist precisely so the
 * defect can be DRIVEN rather than described. Two mutate a dot-prefixed, pid-stamped COPY in this
 * directory — never the subject, and never any committed file (355, and this fire's own §3).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SUBJECT = join(HERE, 'key-the-silent-class-from-source.mjs');
const SRC = readFileSync(SUBJECT, 'utf8');

function drive(file, env) {
  try {
    return execFileSync('node', [file], {
      encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, ...env },
    });
  } catch (e) { return `${e.stdout ?? ''}${e.stderr ?? ''}`; }
}

// Readers over a drive's output. Each returns null when the figure is absent, so a missing figure
// is a refusal rather than a silent zero (393).
const gateOf = (o) => o.split('\n').find((l) => l.startsWith('GATE: ')) ?? null;
// The subject pads its verdict tag to FIVE characters (` ok  `, `FAIL `, `REF  `) and then writes a
// separator space. The first version of this reader spelled the green tag with four (` ok `), so it
// read `null` for every leg of the GREEN baseline while reading `FAIL`/`REF` correctly — and three
// of four cells were graded VACUOUS off a comparison `null → FAIL` that nothing could satisfy. One
// character, in a reader, grading someone else's figure (and his own G10 died of the same thing one
// round earlier, on `.trim()`).
const legState = (o, id) => {
  const l = o.split('\n').find((x) => new RegExp(`^(?: ok  |FAIL |REF  ) ${id}  `).test(x));
  return l === undefined ? null : l.slice(0, 5).trim();
};
const figure = (o, re) => o.match(re)?.[1] ?? null;

const base = drive(SUBJECT, {});
const CELLS = [];

// ── C1 — the quote-style model. round433 emits its gate line by single-quote concatenation; a
// backtick-only key misses it and must show up as a FALSE NEGATIVE in G4's matrix, with tp DOWN.
{
  const out = drive(SUBJECT, { KLATCH_R441_QUOTES: 'backtick-only' });
  // Where the cripple actually lands was itself a finding of this run: it does not reach G4's
  // matrix, because losing round433's emit site makes G3's own "declared emitter with no emit site"
  // check fire first and G4 then refuses on a red hand reading. So the figure to require is G3's
  // per-member emit-site count for round433 falling 1 → 0, which is exactly the 398 shape — the
  // member becomes INVISIBLE to the scanner rather than mis-read by it.
  const sitesOf = (o) => figure(o, /\n\s+capable\s+round433 · (\d+) emit site\(s\)/)
    ?? figure(o, /\n\s+\S+\s+round433 · (\d+) emit site\(s\)/);
  const sBase = sitesOf(base);
  const sCell = sitesOf(out);
  CELLS.push({
    id: 'C1',
    aimed: 'G3 → G4',
    what: 'the quote-style model: KLATCH_R441_QUOTES=backtick-only, the key I would have written '
      + 'first. round433 emits its gate line by single-quote concatenation, so under that key its '
      + 'emit-site count must fall 1 → 0 — the member goes INVISIBLE rather than mis-read, which '
      + 'is the 398 shape by name — G3 must name it as a declared emitter with no emit site, and '
      + 'G4 must then REFUSE rather than publish a matrix over a red hand reading',
    moved: sBase === '1' && sCell === '0'
      && /DECLARED EMITTER WITH NO EMIT SITE: \[[^\]]*round433/.test(out)
      && legState(base, 'G3') === 'ok' && legState(out, 'G3') === 'FAIL'
      && legState(out, 'G4') === 'REF',
    detail: `round433 emit sites ${sBase} → ${sCell}`
      + ` · G3 ${legState(base, 'G3')} → ${legState(out, 'G3')}`
      + ` · G4 ${legState(base, 'G4')} → ${legState(out, 'G4')}`
      + ` · named as a declared emitter with no emit site: ${/DECLARED EMITTER WITH NO EMIT SITE: \[[^\]]*round433/.test(out)}`,
  });
}

// ── C2 — the population key. Moving the round cut must move the population SIZE and break the
// agreement with his published grader count, not just flip a boolean.
{
  const out = drive(SUBJECT, { KLATCH_R441_MYROUND: '433' });
  const nBase = figure(base, /population (\d+) graders/);
  const nCell = figure(out, /population (\d+) graders/);
  CELLS.push({
    id: 'C2',
    aimed: 'G2',
    what: 'the population key: the round cut moved to 433. The grader COUNT must move and the '
      + 'agreement with his published tail must fail — a leg that stayed green under a different '
      + 'population was never reading the population (414)',
    moved: nBase !== null && nCell !== null && nCell !== nBase
      && legState(out, 'G2') === 'FAIL' && legState(base, 'G2') === 'ok',
    detail: `G2 ${legState(base, 'G2')} → ${legState(out, 'G2')} · population ${nBase} → ${nCell}`
      + ` · KEY CRIPPLED reported: ${/KEY CRIPPLED/.test(out)}`,
  });
}

// ── C3 — the hand reading G4 is graded against. Flip round432's declaration to `false` in a COPY.
// G4 must report a FALSE NEGATIVE on round432 and G5's capable-among-his-five count must drop,
// which is what shows G5 is keyed on G4's output rather than on a re-typed conclusion (428).
{
  const anchor = `'docs/research/round432-instruments/grade-the-two-cures.mjs':\n    { capable: true,`;
  const occ = SRC.split(anchor).length - 1;
  const copy = join(HERE, `.cripple-c3-${process.pid}.mjs`);
  let out = null;
  if (occ === 1) {
    writeFileSync(copy, SRC.replace(anchor, anchor.replace('capable: true', 'capable: false')));
    out = drive(copy, {});
    unlinkSync(copy);
  }
  const capBase = figure(base, /label-CAPABLE from source: (\d+)/);
  const capCell = out === null ? null : figure(out, /label-CAPABLE from source: (\d+)/);
  CELLS.push({
    id: 'C3',
    aimed: 'G4 → G5',
    what: 'the hand reading itself: round432 re-declared `capable: false` in a pid-stamped copy. '
      + 'The detector still reads it as capable, so G4 must name it a FALSE POSITIVE — the first '
      + 'version of this cell asserted a false NEGATIVE and was grading the wrong direction of its '
      + 'own matrix — and G5 must then lose its capable-among-his-five figure entirely, which is '
      + 'what shows G5 reads G4 rather than re-typing a conclusion (428)',
    moved: occ === 1 && out !== null && /FALSE POSITIVES: \[[^\]]*round432/.test(out)
      && ((capCell === null && legState(out, 'G5') === 'REF')
        || (capBase !== null && capCell !== null && Number(capCell) < Number(capBase))),
    detail: occ !== 1 ? `REFUSED — anchor occurs ${occ}× in the subject, not once`
      : `anchor occurs 1× · G4 ${legState(base, 'G4')} → ${legState(out, 'G4')}`
        + ` · G5 ${legState(base, 'G5')} → ${legState(out, 'G5')}`
        + ` · capable-among-his-five ${capBase} → ${capCell ?? 'REFUSED (G5 keyed on a red G4)'}`
        + ` · round432 named a false positive: ${/FALSE POSITIVES: \[[^\]]*round432/.test(out)}`,
  });
}

// ── C4 — the write-site model. Restrict the census to `join(REPO, …)` targets in a COPY. The
// tracked-target COUNT must fall and the coverage of his own two paths must break, which is the
// conjunct that makes G7 a census rather than a list (355).
{
  const anchor = 'join\\(\\s*(HERE|REPO)\\s*,';
  const occ = SRC.split(anchor).length - 1;
  const copy = join(HERE, `.cripple-c4-${process.pid}.mjs`);
  let out = null;
  if (occ === 1) {
    writeFileSync(copy, SRC.replace(anchor, 'join\\(\\s*(REPO)\\s*,'));
    out = drive(copy, {});
    unlinkSync(copy);
  }
  const nBase = figure(base, /target TRACKED at the rev: (\d+)/);
  const nCell = out === null ? null : figure(out, /target TRACKED at the rev: (\d+)/);
  const covBase = figure(base, /covered by this census: (\w+)/);
  const covCell = out === null ? null : figure(out, /covered by this census: (\w+)/);
  CELLS.push({
    id: 'C4',
    aimed: 'G7 → G8',
    what: 'the write-site model: the census restricted to `join(REPO, …)` in a pid-stamped copy, '
      + 'dropping every `HERE`-relative target. The tracked-target COUNT must fall and the '
      + 'coverage of the two paths his own G10 found must break — a census that still covered them '
      + 'under a crippled model was not keyed on the model',
    moved: occ === 1 && out !== null && nBase !== null && nCell !== null
      && Number(nCell) < Number(nBase) && covBase === 'true' && covCell !== 'true',
    detail: occ !== 1 ? `REFUSED — anchor occurs ${occ}× in the subject, not once`
      : `anchor occurs 1× · G7 ${legState(base, 'G7')} → ${legState(out, 'G7')}`
        + ` · G8 ${legState(base, 'G8')} → ${legState(out, 'G8')}`
        + ` · tracked targets ${nBase} → ${nCell} · covers his two: ${covBase} → ${covCell}`,
  });
}

// ── The subject must be byte-identical at exit, and no committed file may have been touched.
const after = readFileSync(SUBJECT, 'utf8');
const dirty = execFileSync('git', ['-C', join(HERE, '..', '..', '..'), 'diff', '--name-only', 'HEAD'],
  { encoding: 'utf8' }).split('\n').filter((l) => l !== '');

const lines = [];
lines.push('Round 441 — vacuity: every cell must move a NAMED FIGURE, not just the verdict');
lines.push('');
lines.push(`baseline  ${gateOf(base)}`);
lines.push('');
for (const c of CELLS) {
  lines.push(`${c.moved ? 'MOVED  ' : 'VACUOUS'} ${c.id}  aimed at ${c.aimed} — ${c.what}`);
  lines.push(`        ${c.detail}`);
}
lines.push('');
lines.push(`VACUITY: ${CELLS.filter((c) => c.moved).length}/${CELLS.length} cell(s) moved their figure`);
lines.push(`  subject byte-identical at exit: ${after === SRC} · tracked files dirty vs HEAD: ${dirty.length} ${JSON.stringify(dirty)}`);
console.log(lines.join('\n'));
process.exitCode = CELLS.every((c) => c.moved) && after === SRC && dirty.length === 0 ? 0 : 1;
