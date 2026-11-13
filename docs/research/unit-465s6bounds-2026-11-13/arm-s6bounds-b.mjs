/**
 * `unit-465s6bounds-2026-11-13`, arm B — ADDITIVE.
 *
 * `arm-s6bounds.mjs` is NOT edited: it crashed at its T8 and that crash is the finding (the pin's
 * documented reproduction route slices the module at a rev where the reader does not exist). Arm A's
 * script and its `drive1.out`/`drive1.err` stay exactly as recorded.
 *
 * This arm carries only what arm A could not reach or scored as refused:
 *   - T4′  the P4 cripple, re-keyed onto the CASE line rather than the first line containing the
 *          filename. Arm A's cripple deleted the DOCBLOCK mention instead, and its own landing
 *          check refused to score rather than reporting a pass.
 *   - T8′  the reproduction route the pin DESCRIBES, run literally, and then the route it MEANS:
 *          `classifyPath` sliced at `classifierRev` composed with the reader at HEAD.
 *   - T9, T10, T10b, T11, T12 — the legs downstream of the crash.
 *
 * Run:  node docs/research/unit-465s6bounds-2026-11-13/arm-s6bounds-b.mjs
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const MOD = 'docs/research/lib/attested-rounds.mjs';
const CLASSIFIER_REV = '6c9a4348';
const PIN_TREE_REV = '3ee13880';

const legs = [];
const refused = [];
const preds = [];
function leg(id, ok, note) { legs.push({ id, ok, note }); console.log(`${ok ? 'ok  ' : 'RED '} ${id}  ${note}`); }
function refuse(id, why) { refused.push(id); console.log(`REF  ${id}  ${why}`); }
function pred(id, held, note) { preds.push({ id, held, note }); console.log(`PRED ${id}  ${held ? 'HELD' : 'REFUTED'}  ${note}`); }

function git(repo, args) {
  const r = spawnSync('git', ['-C', repo, ...args], { stdio: 'pipe', encoding: 'utf8' });
  return r.status !== 0 ? null : r.stdout;
}
function src(rev) { return git(REPO, ['show', `${rev}:${MOD}`]); }
async function importText(name, text) {
  const out = join(HERE, name);
  writeFileSync(out, text);
  return import(`file://${out}`);
}
/** The text of `export function classifyPath` … up to its closing brace at column 0. */
function classifierSpan(text) {
  const start = text.indexOf('export function classifyPath(p) {');
  if (start < 0) return null;
  const end = text.indexOf('\n}\n', start);
  if (end < 0) return null;
  return text.slice(start, end + 3);
}

const live = await import(`file://${join(REPO, MOD)}`);
const headSrc = src('HEAD');
const baseSrc = src(CLASSIFIER_REV);
if (headSrc === null || baseSrc === null) {
  console.log(`VERDICT/2 REFUSED legs=0 red=[] refused=[slice] — git show failed`);
  process.exit(2);
}

// ---------------------------------------------------------------------------------------------
// T4′ — P4 re-keyed onto the case line. Anchored on the ARRAY ENTRY form, not on the filename.
// ---------------------------------------------------------------------------------------------
{
  const lines = headSrc.split('\n');
  const i = lines.findIndex((l) => /^\s*\['docs\/mail\/read\/calliope-to-dispatch-ssh443-workaround-2026-04-18\.md',/.test(l));
  if (i < 0) {
    refuse('T4p', 'no SOURCE_CASES line matches the near-miss entry form — the anchor, not the subject, has moved');
    pred('P4', false, 'REFUSED — anchor not found');
  } else {
    const mutated = [...lines.slice(0, i), ...lines.slice(i + 1)].join('\n');
    const mod = await importText('cripple-p4b-no-nearmiss-case.mjs', mutated);
    const landed = !mod.SOURCE_CASES.present.some(([p]) => p.includes('ssh443-workaround'));
    if (!landed) {
      refuse('T4p', 'cripple did not land');
      pred('P4', false, 'REFUSED — cripple did not land');
    } else {
      let got;
      try { got = mod.selfTest(); } catch (e) { got = `THREW: ${e.message}`; }
      const held = got === true;
      const n = mod.SOURCE_CASES.present.length + mod.SOURCE_CASES.synthetic.length;
      leg('T4p', held, `S6's near-miss CASE deleted (line ${i + 1}) → selfTest() ${JSON.stringify(got)} · path cases left=${n}, floor is >= 8`);
      pred('P4', held, `the near-miss is unguarded: ${held}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// T8′ — the pin's reproduction route, literally and then as meant.
// The pin says: "slice this module at `classifierRev` and read the tree at `rev`".
// ---------------------------------------------------------------------------------------------
{
  const base = await importText('sliced-classifier-6c9a4348.mjs', baseSrc);
  const hasReader = typeof base.unattestedRoundsAt === 'function';
  leg('T8a', !hasReader,
    `LITERAL route: module sliced at classifierRev=${CLASSIFIER_REV} exports unattestedRoundsAt: ${hasReader} ` +
    `— the pin's documented route ${hasReader ? 'executes' : 'CANNOT execute; arm A crashed here'}`);
  pred('P8', hasReader, `the literal route runs: ${hasReader}`);

  // The route it MEANS: the classifier from `classifierRev`, the reader from HEAD.
  const headClass = classifierSpan(headSrc);
  const baseClass = classifierSpan(baseSrc);
  if (headClass === null || baseClass === null) {
    refuse('T8b', 'could not span classifyPath in one of the two revisions');
  } else {
    const composedSrc = headSrc.replace(headClass, baseClass);
    const composed = await importText('composed-classifier6c9a4348-reader-head.mjs', composedSrc);
    const s6gone = composed.classifyPath('docs/mail/read/daedalus-to-argus-round9.md').source === null;
    if (!s6gone) {
      refuse('T8b', 'the composed module still claims the S6 witness — the swap did not land');
    } else {
      const r = composed.unattestedRoundsAt(REPO, PIN_TREE_REV);
      const pin = live.SOURCE_RECALL_FLOOR[`at${live.SOURCE_RECALL_FLOOR.rev}`];
      if (r === null) {
        refuse('T8b', 'composed reader refused');
      } else {
        const ok = r.paths === pin.invisiblePaths && String(r.outside) === String(pin.unattestedRounds);
        leg('T8b', ok,
          `COMPOSED route (classifier@${CLASSIFIER_REV} + reader@HEAD) over tree@${PIN_TREE_REV} → ` +
          `paths=${r.paths} outside=[${r.outside}] vs pin ${pin.invisiblePaths}/[${pin.unattestedRounds}]`);
      }
      // …and the module the pin tells you to build fails its OWN selfTest, because SOURCE_IDS
      // declares a source its spliced classifier cannot return.
      let st;
      try { st = composed.selfTest(); } catch (e) { st = `THREW: ${e.message}`; }
      leg('T8c', typeof st === 'string' && /S6/.test(st),
        `the composed module's own selfTest(): ${JSON.stringify(st)}`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// T9 — his T11 reproduction: live classifier over the pinned tree rev.
// ---------------------------------------------------------------------------------------------
{
  const r = live.unattestedRoundsAt(REPO, PIN_TREE_REV);
  if (r === null) { refuse('T9', 'live reader refused'); pred('P9', false, 'REFUSED'); }
  else {
    const held = r.paths === 127 && r.outside.length === 0;
    leg('T9', held, `classifier@HEAD over tree@${PIN_TREE_REV} → paths=${r.paths} outside=[${r.outside}] (his T11: 127 / [])`);
    pred('P9', held, `his T11 reproduces: ${held}`);
  }
}

// ---------------------------------------------------------------------------------------------
// T10 / T10b — the at-risk set at his rev and at HEAD.
// ---------------------------------------------------------------------------------------------
function atRisk(rev) {
  const pop = live.attestedRounds(REPO, rev);
  if (pop === null) return null;
  const n = new Map();
  for (const r of pop.rows) if (r.round !== null && r.denies !== r.round) n.set(r.round, (n.get(r.round) || 0) + 1);
  return [...pop.filtered].filter((x) => !pop.nonSubject.has(x) && n.get(x) === 1).sort((a, b) => a - b);
}
{
  const his = atRisk(CLASSIFIER_REV);
  if (his === null) { refuse('T10', 'refused at his rev'); pred('P10', false, 'REFUSED'); }
  else {
    const held = String(his) === String([10, 270, 282, 319, 466]);
    leg('T10', held, `at-risk@${CLASSIFIER_REV} = [${his}] (his T8: [10,270,282,319,466])`);
    pred('P10', held, `his T8 reproduces: ${held}`);
  }
  const now = atRisk('HEAD');
  if (now === null) { refuse('T10b', 'refused at HEAD'); pred('P10b', false, 'REFUSED'); }
  else {
    const held = !now.includes(10) && now.length <= 4;
    leg('T10b', held, `at-risk@HEAD = [${now}] · 10 absent=${!now.includes(10)} · size=${now.length}`);
    pred('P10b', held, `S6 made 10 denial-proof and the set did not grow: ${held}`);
  }
}

// ---------------------------------------------------------------------------------------------
// T11 / T12 — the live module's own selfTest, and the gate-leg scope check.
// ---------------------------------------------------------------------------------------------
{
  let got;
  try { got = live.selfTest(); } catch (e) { got = `THREW: ${e.message}`; }
  leg('T11', got === true, `live selfTest() → ${JSON.stringify(got)}`);
}
{
  const dirty = git(REPO, ['status', '--porcelain', 'packages', 'scripts']);
  leg('T12', dirty === '', `git status --porcelain packages scripts → ${JSON.stringify(dirty)} (empty ⇒ no gate leg owed)`);
}

const red = legs.filter((l) => !l.ok).map((l) => l.id);
console.log(
  `VERDICT/${red.length ? 1 : 0} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
  `preds=${preds.length} refuted=[${preds.filter((p) => !p.held).map((p) => p.id)}]`
);
process.exit(red.length ? 1 : 0);
