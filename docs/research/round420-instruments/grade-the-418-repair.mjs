#!/usr/bin/env node
/**
 * Round 420 — grade the repair Daedalus's Round 419 §4 routed into my Round 418 instrument
 * `installed-sdk-and-sec4-by-shape.mjs`, as a 2 x 2 against the OLD spelling.
 *
 * The charge: the "INSTALLED HERE" label was pinned to an absolute identity (the `theseus` row of
 * a cross-tree table) while the file it labelled was a bare relative path resolved against the
 * reader's cwd. In my tree those are one tree and it read true; in his it printed my version string
 * beside his file's line numbers.
 *
 * TWO DESIGN CHOICES, each answering a failure in the round that produced them:
 *
 * 1. THE OLD CELL IS PINNED BY PROPERTY, NOT BY `HEAD`. His own Round 419
 *    `grade-the-417-repairs.mjs:63` names its variable `prevRev` and assigns it
 *    `git rev-parse HEAD` — so from the commit that landed his repair onward, the "OLD cell" of
 *    his 2 x 2 is the repaired spelling compared with itself, the line inverts to
 *    `threw ENOENT: false`, and nothing gates on it (it is a `say`, not a `gate`). Here the old
 *    spelling is taken from an explicit rev AND the extraction is gated on the old spelling
 *    actually CARRYING THE DEFECT TOKEN before it is allowed to serve as the old cell — a property
 *    pin, not a verbatim rev pin (my Round 357/375 lesson, which is the one his line needed).
 *    If no rev in the file's own history carries the token, the instrument refuses rather than
 *    grading the new spelling against itself.
 *
 * 2. THE DISCRIMINATOR IS A SECOND TREE, DRIVEN. The defect is invisible from the cwd that wrote
 *    it, so both spellings are driven with cwd set to a DIFFERENT worktree — the one whose
 *    installed SDK version differs from this one's. Read-only: node is given another tree as its
 *    cwd and neither spelling writes anything (asserted below by a source key, and the scratch
 *    copies live under this repo's .testdata/).
 *
 * Usage: node grade-the-418-repair.mjs      (any cwd)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const REL = 'docs/research/round418-instruments/installed-sdk-and-sec4-by-shape.mjs';
const NEW = path.join(REPO, REL);
const SCRATCH = path.join(REPO, '.testdata', 'round420-418-counterfactual');
// The rev my Round 418 instruments were published at. Explicit, not HEAD.
const OLD_REV = 'f47edd69';
// The property that makes a spelling the OLD one: the label read across the worktree boundary.
const DEFECT_TOKEN = "rows.find((r) => r.name.startsWith('theseus'))?.v ?? '?'";

const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
  return ok;
};
const predict = (name, expected, actual) => {
  const landed = String(expected) === String(actual);
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name}: expected ${expected}, measured ${actual}`);
  return landed;
};

say('# Round 420 — the Round 419 §4 repair, graded 2 x 2 against the f47edd69 spelling');
say('');
say(`rev stamp:  ${git('rev-parse', 'HEAD').stdout.trim()}`);
say(`old rev:    ${OLD_REV} (${git('log', '-1', '--format=%h %an %s', OLD_REV).stdout.trim().slice(0, 110)})`);
say(`driven at:  ${new Date().toISOString()}`);
say(`cwd:        ${process.cwd()}`);
say('');

// ---------------------------------------------------------------------------
// STEP 1 — extract the old spelling, and gate it on carrying the defect.
// ---------------------------------------------------------------------------
say('='.repeat(78));
say('## 1. The OLD cell, pinned by property rather than by HEAD');
say('');

const oldSrc = git('show', `${OLD_REV}:${REL}`).stdout;
const newSrc = existsSync(NEW) ? readFileSync(NEW, 'utf8') : '';
gate(`the old spelling extracts from ${OLD_REV}`, oldSrc.length > 0, `${oldSrc.split('\n').length} lines`);
gate('the new spelling exists on disk', newSrc.length > 0, `${newSrc.split('\n').length} lines`);

const oldHas = oldSrc.split(DEFECT_TOKEN).length - 1;
const newHas = newSrc.split(DEFECT_TOKEN).length - 1;
say(`  defect token: ${JSON.stringify(DEFECT_TOKEN)}`);
say(`  occurrences — old ${oldHas} | new ${newHas}`);
// This is the leg his `prevRev = HEAD` line does not have. Both halves must hold: the old
// spelling must carry the defect, and the new one must not. Either way round, refuse.
gate('the OLD spelling carries the defect token exactly once', oldHas === 1, `occurs=${oldHas}`);
gate('the NEW spelling does not carry it', newHas === 0, `occurs=${newHas}`);
// And a bare-relative read of the graded file is the other half of the same defect. My first
// spelling of this leg keyed on the PATH STRING — which the repair still contains, inside
// `repoFile('node_modules/...')`, so the leg failed against a correctly repaired file. It is
// re-aimed here at the CALL SHAPE that carries the defect (the path arriving at gradeFile as a
// bare literal, i.e. preceded by a comma), not loosened (Round 357/375). Whitespace-stripped so a
// line break between the two arguments cannot hide it (Round 394).
const strip = (s) => s.replace(/\s+/g, '');
const BARE_ARG = ",'node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.js')";
const ABS_ARG = "repoFile('node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.js')";
const oldBare = strip(oldSrc).split(BARE_ARG).length - 1;
const newBare = strip(newSrc).split(BARE_ARG).length - 1;
say(`  bare-literal-argument shape ${JSON.stringify(BARE_ARG)} — old ${oldBare} | new ${newBare}`);
say(`  repo-rooted shape ${JSON.stringify(ABS_ARG)} — old ${strip(oldSrc).split(strip(ABS_ARG)).length - 1} | new ${strip(newSrc).split(strip(ABS_ARG)).length - 1}`);
gate('the OLD spelling passes the graded file to gradeFile as a bare relative literal',
  oldBare === 1, `occurs=${oldBare}`);
gate('the NEW spelling does not', newBare === 0, `occurs=${newBare}`);
gate('CONTROL the key separates the two shapes (it is not matching the path string alone)',
  oldBare !== newBare);
// Neither spelling may write anything — this instrument drives them with another tree as cwd.
gate('neither spelling writes to disk (no writeFileSync/mkdirSync in either)',
  !/writeFileSync|mkdirSync|appendFileSync|rmSync/.test(oldSrc) && !/writeFileSync|mkdirSync|appendFileSync|rmSync/.test(newSrc));

if (fails.length) { say(''); say(`VERDICT: REFUSED — ${fails.length} gate(s) failed before any drive: ${fails.join('; ')}`); process.exit(1); }

mkdirSync(SCRATCH, { recursive: true });
const OLD_FILE = path.join(SCRATCH, 'old-installed-sdk-and-sec4-by-shape.mjs');
writeFileSync(OLD_FILE, oldSrc);
say(`  old spelling written to ${OLD_FILE}`);

// ---------------------------------------------------------------------------
// STEP 2 — pick the discriminating second tree: one whose installed SDK differs.
// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 2. The discriminator — a tree whose installed SDK version differs from this one\'s');
say('');

const TREES = {
  'main checkout': '/Users/xian/Development/klatch',
  'daedalus': '/Users/xian/Development/klatch-worktrees/daedalus',
  'argus': '/Users/xian/Development/klatch-worktrees/argus',
  'calliope': '/Users/xian/Development/klatch-worktrees/calliope',
  'theseus (this one)': '/Users/xian/Development/klatch-worktrees/theseus',
};
const versionIn = (root) => {
  try { return JSON.parse(readFileSync(path.join(root, 'node_modules/@anthropic-ai/sdk/package.json'), 'utf8')).version; }
  catch { return null; }
};
const real = (p) => { try { return realpathSync(p); } catch { return path.resolve(p); } };
const MY_V = versionIn(REPO);
say(`  this tree (${real(REPO)}): ${MY_V ?? 'UNREADABLE'}`);
const others = Object.entries(TREES)
  .filter(([, root]) => real(root) !== real(REPO) && existsSync(root))
  .map(([name, root]) => ({ name, root, v: versionIn(root) }));
others.forEach((t) => say(`  ${t.name.padEnd(20)} ${String(t.v)}`));
const disc = others.find((t) => t.v !== null && t.v !== MY_V);
gate('a second tree with a DIFFERENT installed SDK version exists to drive from',
  !!disc, disc ? `${disc.name} = ${disc.v} vs mine ${MY_V}` : 'none found');
if (!disc) { say(''); say('VERDICT: REFUSED — without a second tree at a different version the defect is undrivable.'); process.exit(1); }

// ---------------------------------------------------------------------------
// STEP 3 — the 2 x 2: {old, new} x {this tree's cwd, the other tree's cwd}
// ---------------------------------------------------------------------------
say('');
say('='.repeat(78));
say('## 3. The 2 x 2 — {old spelling, new spelling} x {own cwd, other-tree cwd}');
say('');

const LINES_RE = /--- (?:INSTALLED HERE|INSTALLED IN) ([^\n]*?) \((\d+) lines\) ---/;
const HIT418_RE = /event-path guard \(§4 cites :418\): \d+ hit\(s\) at ([\d, ]+|<none>)/;
const drive = (file, cwd) => {
  const r = spawnSync('node', [file], { cwd, encoding: 'utf8', timeout: 180000, maxBuffer: 1 << 26 });
  const text = (r.stdout || '') + (r.stderr || '');
  const lm = LINES_RE.exec(text);
  return {
    status: r.status,
    text,
    label: lm ? lm[1] : null,
    fileLines: lm ? Number(lm[2]) : null,
    hit418: (HIT418_RE.exec(text) || [, null])[1],
    refused: /VERDICT: REFUSED/.test(text),
    threw: /\bENOENT\b|Node\.js v\d/.test(text),
    summary: /^SUMMARY:/m.test(text),
  };
};

const CELLS = [
  ['OLD @ f47edd69', 'own cwd (theseus)', OLD_FILE, REPO],
  ['OLD @ f47edd69', `other cwd (${disc.name})`, OLD_FILE, disc.root],
  ['NEW (repaired)', 'own cwd (theseus)', NEW, REPO],
  ['NEW (repaired)', `other cwd (${disc.name})`, NEW, disc.root],
];
const cells = {};
for (const [which, where, file, cwd] of CELLS) {
  const r = drive(file, cwd);
  cells[`${which}|${where}`] = r;
  say(`  ${which.padEnd(16)} ${where.padEnd(24)} exit ${String(r.status).padStart(3)} | label ${JSON.stringify(r.label)} | file lines ${r.fileLines} | :418 hit at ${r.hit418} | refused ${r.refused} | threw ${r.threw}`);
}

say('');
say('--- what each cell says about the pair (label, line numbers) ---');
const oldOther = cells[`OLD @ f47edd69|other cwd (${disc.name})`];
const newOther = cells[`NEW (repaired)|other cwd (${disc.name})`];
const oldOwn = cells['OLD @ f47edd69|own cwd (theseus)'];
const newOwn = cells['NEW (repaired)|own cwd (theseus)'];

// The defect, stated as a measurement: the old spelling, driven from a tree at a different
// version, labels the OTHER tree's file with THIS tree's version and prints line numbers anyway.
const oldMislabels = oldOther.label !== null && MY_V !== null
  && oldOther.label.includes(MY_V) && oldOther.fileLines !== null && !oldOther.refused;
say(`  OLD, other cwd: label ${JSON.stringify(oldOther.label)} vs that tree's real version ${disc.v}`);
const pA = predict("the OLD spelling labels the other tree's file with THIS tree's version", true, oldMislabels);
const pB = predict('the OLD spelling prints line numbers under that wrong label (does not refuse)',
  true, oldOther.hit418 !== null && oldOther.refused === false);
// --- the property the repair actually has, measured rather than assumed -----
// My first spelling of this leg predicted "from the other tree, the NEW spelling labels with the
// OTHER tree's version or refuses". The grader REFUTED it, and the refutation was mine, not the
// repair's: resolving the graded file against `import.meta.dirname` makes the new spelling
// cwd-INDEPENDENT — it grades the tree the instrument itself lives in, from any cwd, and says
// which. So the defect was never "reads the wrong tree"; it was "the label and the line numbers
// come from DIFFERENT trees". That is the property to key on, and it is decidable without naming
// a tree: a printed (version, line-count) pair is honest iff SOME tree has both.
const linesOfSdkFileIn = (root) => {
  try { return readFileSync(path.join(root, 'node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.js'), 'utf8').split('\n').length; }
  catch { return null; }
};
const inventory = [{ name: 'theseus (this one)', root: REPO, v: MY_V, lines: linesOfSdkFileIn(REPO) }]
  .concat(others.map((t) => ({ ...t, lines: linesOfSdkFileIn(t.root) })));
say('');
say('--- tree inventory: the (version, BetaMessageStream.js line count) pairs that really exist ---');
inventory.forEach((t) => say(`    ${t.name.padEnd(20)} version ${String(t.v).padEnd(10)} lines ${t.lines}`));
const verOfLabel = (l) => { const m = /(\d+\.\d+\.\d+)/.exec(l || ''); return m ? m[1] : null; };
const pairHonest = (cell) => {
  if (cell.refused) return 'REFUSED (no pair printed)';
  const v = verOfLabel(cell.label), L = cell.fileLines;
  if (v === null || L === null) return 'UNMEASURED';
  return inventory.some((t) => t.v === v && t.lines === L) ? 'HONEST' : 'IMPOSSIBLE PAIR';
};
say('');
say('--- is each printed (label version, file line count) pair one that any tree actually has? ---');
for (const k of Object.keys(cells)) {
  say(`    ${k.padEnd(48)} v=${verOfLabel(cells[k].label)} lines=${cells[k].fileLines}  ->  ${pairHonest(cells[k])}`);
}
// The confusion matrix this leg needs: the key must call ONE of these four cells impossible and
// the rest honest. A key that calls all four honest, or all four impossible, grades nothing.
const verdicts = Object.fromEntries(Object.keys(cells).map((k) => [k, pairHonest(cells[k])]));
const nImpossible = Object.values(verdicts).filter((v) => v === 'IMPOSSIBLE PAIR').length;
gate('CONTROL the honesty key separates (it does not call every cell the same)',
  nImpossible > 0 && nImpossible < 4, `impossible=${nImpossible} of 4`);
const pC = predict('the OLD spelling, driven from the other tree, prints a pair NO tree has',
  'IMPOSSIBLE PAIR', verdicts[`OLD @ f47edd69|other cwd (${disc.name})`]);
const pC2 = predict('the OLD spelling is HONEST from the cwd that wrote it (the defect is invisible there)',
  'HONEST', verdicts['OLD @ f47edd69|own cwd (theseus)']);
const pC3 = predict('the NEW spelling prints an honest pair from BOTH cwds',
  'HONEST,HONEST', `${verdicts['NEW (repaired)|own cwd (theseus)']},${verdicts[`NEW (repaired)|other cwd (${disc.name})`]}`);
const pD = predict('the NEW spelling still works unchanged from its own cwd (exit 0 + SUMMARY)',
  true, newOwn.status === 0 && newOwn.summary === true);
// Charge 3: ENOENT from its own directory.
const oldFromOwnDir = drive(OLD_FILE, path.join(REPO, 'docs/research/round418-instruments'));
const newFromOwnDir = drive(NEW, path.join(REPO, 'docs/research/round418-instruments'));
say('');
say(`  OLD, driven from docs/research/round418-instruments: exit ${oldFromOwnDir.status} | threw ${oldFromOwnDir.threw} | SUMMARY ${oldFromOwnDir.summary}`);
say(`  NEW, driven from docs/research/round418-instruments: exit ${newFromOwnDir.status} | threw ${newFromOwnDir.threw} | SUMMARY ${newFromOwnDir.summary}`);
const pE = predict('the OLD spelling threw from its own directory', true, oldFromOwnDir.threw);
const pF = predict('the NEW spelling does not, and prints a SUMMARY', true, newFromOwnDir.threw === false && newFromOwnDir.summary === true);

// The repair must be makeable to fire: a mutant that reintroduces the sentinel must refuse.
say('');
say('--- the guard, broken on a scratch copy (a repair that cannot fire is not a repair) ---');
const MUT_FROM = 'if (hereRow && hereRow.v !== hereV) {';
const occurs = newSrc.split(MUT_FROM).length - 1;
gate('the mutation anchor occurs exactly once in the new spelling', occurs === 1, `occurs=${occurs}`);
if (occurs === 1) {
  // Force the mismatch branch: make the table's version for this tree a value it cannot equal.
  const mutFile = path.join(SCRATCH, 'mutant-forced-tree-mismatch.mjs');
  writeFileSync(mutFile, newSrc.split(MUT_FROM).join('if (hereRow && (hereRow.v = "0.0.0-forced") !== hereV) {'));
  const m = drive(mutFile, REPO);
  say(`  mutant [forced tree/version mismatch]: exit ${m.status} | refused ${m.refused} | SUMMARY suppressed ${!m.summary} | printed a line number ${m.hit418 !== null}`);
  gate('a forced tree/version mismatch makes the new spelling REFUSE and print no line number',
    m.refused === true && m.status === 1 && m.summary === false && m.hit418 === null);
}

say('');
say('='.repeat(78));
const preds = [pA, pB, pC, pC2, pC3, pD, pE, pF];
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.filter(Boolean).length} landed, ${preds.filter((p) => !p).length} refuted`);
say(`SUMMARY: old cell pinned by property at ${OLD_REV} (defect token occurs ${oldHas}× old / ${newHas}× new) | ` +
  `discriminator ${disc.name}@${disc.v} vs this tree@${MY_V} | ` +
  `OLD other-cwd label ${JSON.stringify(oldOther.label)} over a ${oldOther.fileLines}-line file | ` +
  `NEW other-cwd label ${JSON.stringify(newOther.label)} refused=${newOther.refused} | ` +
  `honesty of the four cells: ${Object.values(verdicts).join(' / ')} | ` +
  `charge 1+2 ${pA && pB && pC && pC3 ? 'cleared' : 'NOT CLEARED'} | charge 3 ${pE && pF ? 'cleared' : 'NOT CLEARED'}`);

writeFileSync(path.join(import.meta.dirname, 'grade-the-418-repair.out'), out.join('\n') + '\n');
if (fails.length) process.exit(1);
