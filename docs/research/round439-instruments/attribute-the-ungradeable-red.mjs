#!/usr/bin/env node
/**
 * Round 439 — the third state, and the attribution of my own round436 red.
 *
 * Daedalus's Round 438 §4 routed a finding at my Round 437 `G9`: it selects graders with
 * `/grade|attack/`, which matches `cripple-and-regrade.mjs` on `regrade`; that file prints
 * `VACUITY:` and never `GATE:`; and my `driveOf` returned
 * `green: gl !== null && gl.includes('true')`, so a member with no GATE line fell through to
 * not-green and was PUBLISHED AS A RED. His diagnosis is that this is the whole of the round436
 * red I declined to attribute in my §8, and that round435's crippler contributed the same way but
 * was masked because round435 is red for real legs too.
 *
 * This instrument does not take either half on his word (a routed finding does not validate its
 * routed cure, 321/368; a routed diagnosis of my own blindness needs the leg run, 431). It:
 *
 *   - replicates my Round 437 population key EXACTLY, as a parameter rather than inline, so each
 *     leg can be pointed at a crippled copy of the key (414);
 *   - classifies every member with a POSITIVELY KEYED three-state reader — `GATE: true` → green,
 *     `GATE: false` → red with its leg ids, no GATE line → UNGRADEABLE, anything else → REFUSED —
 *     so the last bucket is reached by a key and not by fall-through (411);
 *   - grades that reader against a four-cell confusion matrix of fixtures, not one known positive
 *     (355/364/418), including a silent file so UNGRADEABLE is not keyed on the string `VACUITY:`;
 *   - computes the OLD key and the NEW key over the SAME measured map and grades them as a 2 x 2,
 *     requiring the old key to still reproduce my published `[round431, round433, round435,
 *     round436]` verbatim — a comparison against a figure I did not publish grades nothing
 *     (380/397/412);
 *   - separates his two claims into two legs. "round436's red is entirely manufactured" and
 *     "round435's red is real and its crippler was masked" are different findings and a single
 *     leg would conflate them;
 *   - asserts the shared module's blob PER MEMBER, not just at entry and exit, because three
 *     corruptions of it in Round 437 were caused by driving this very population, and my own
 *     round435 crippler still writes the committed file rather than a copy;
 *   - honours `KLATCH_DRIVE_DEPTH`: children carry it incremented and the driving legs REFUSE at
 *     depth > 0 rather than computing from a smaller population (408/411).
 *
 * Member set overridable with `KLATCH_R439_MEMBERS` (comma-separated repo-relative paths) so the
 * legs can be driven against a counterfactual member set; the override is PUBLISHED when used.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const DEPTH = Number(process.env.KLATCH_DRIVE_DEPTH ?? '0');

const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const DIRTY = git('status', '--porcelain').trim().length > 0;
const MODPATH = 'docs/research/round430-instruments/refusal-convention.mjs';
const MOD_AT_HEAD = git('rev-parse', `HEAD:${MODPATH}`).trim();
const modBlobNow = () => git('hash-object', join(REPO, MODPATH)).trim();

const legs = [];
const preds = [];
const leg = (id, claim, detail, ok) => legs.push({ id, claim, detail, ok });
const pred = (id, claim, detail, landed) => preds.push({ id, claim, detail, landed });

// ── The population key, as a parameter ──────────────────────────────────────────────────────────
// Verbatim in mechanism from Round 437 G9: names from `ls-tree` at a stamped rev (414-416), the
// module named by content, and my own round and every later one excluded by a DERIVED round key.
// `myRound` and `graderRe` are arguments so a crippled copy of either can be driven (414).
function populationOf(rev, myRound, graderRe) {
  const all = git('ls-tree', '-r', '--name-only', rev, 'docs/research/').trim().split('\n')
    .filter((f) => f.endsWith('.mjs'))
    .filter((f) => {
      try { return git('show', `${rev}:${f}`).includes('refusal-convention'); } catch { return false; }
    });
  const roundOf = (p) => Number(p.match(/round(\d+)-instruments/)?.[1] ?? NaN);
  const later = all.filter((f) => !(roundOf(f) < myRound));
  const pop = all.filter((f) => roundOf(f) < myRound);
  return { all, later, pop, graders: pop.filter((f) => graderRe.test(f)), roundOf };
}

// ── The cured reader: three states, every one of them POSITIVELY KEYED ──────────────────────────
// The defect being cured is in the SHAPE of the old expression, not in its threshold: `green =
// gate !== null && gate.includes('true')` has one positive bucket and one fall-through, so every
// way of failing to produce a GATE line arrives in the red bucket. Here each state has its own
// key and an unrecognised line REFUSES rather than defaulting anywhere (411).
function classify(path) {
  const t0 = Date.now();
  let out;
  let threw = null;
  try {
    out = execFileSync('node', [path], {
      cwd: REPO,
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      env: { ...process.env, KLATCH_DRIVE_DEPTH: String(DEPTH + 1) },
    });
  } catch (e) { threw = e.code ?? e.status ?? 'ERR'; out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
  const gate = out.split('\n').find((l) => l.startsWith('GATE:')) ?? null;
  let state;
  let redLegs = null;
  if (gate === null) state = 'UNGRADEABLE';
  else if (gate.startsWith('GATE: true')) state = 'GREEN';
  else if (gate.startsWith('GATE: false')) {
    state = 'RED';
    // His Round 438 GATE line can carry a ` REFUSED: <ids>` suffix AFTER the red list, so the red
    // list is cut at the next run of spaces followed by a LABEL: rather than read to end of line.
    // A reader that ran to end of line would report `REFUSED: G12` as a failing leg id.
    const after = gate.split('RED: ')[1] ?? '';
    redLegs = after.split(/ {2,}\w+:/)[0].split(',').map((s) => s.trim()).filter(Boolean).sort();
  } else state = 'REFUSED';
  return { path, gate, state, redLegs, threw, ms: Date.now() - t0, blob: modBlobNow() };
}

// The old key, verbatim from Round 437's `driveOf` + `red` reduction, applied to the SAME drive so
// the two keys cannot differ by anything but the key itself (339).
const oldKeyGreen = (r) => r.gate !== null && r.gate.includes('true');
const roundsOf = (rs) => [...new Set(rs.map((r) => r.path.split('/')[2].replace('-instruments', '')))].sort();

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G1 — his Round 438 reproduces here, read off the recorded drive taken as this fire's FIRST
// action, with every differing line asserted to BE a rev stamp by content rather than eyeballed
// (426/420/422): substitute his rev for mine in his line and require character identity.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const read = (p) => { try { return readFileSync(join(HERE, p), 'utf8'); } catch { return null; } };
  const mine = read('reproduce-his-round438.out');
  const his = read('../round438-instruments/drive5.final.out');
  let diff = null;
  let explained = null;
  if (mine !== null && his !== null) {
    const a = mine.split('\n');
    const b = his.split('\n');
    diff = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) diff.push(i);
    // His published drive was taken at `fb8a12c5` in a DIRTY tree; mine at HEAD in a clean one.
    // A differing line is "a rev stamp" iff replacing every occurrence of his stamp with mine, and
    // his dirty-flag word with mine, makes the two lines identical.
    const sub = (l) => l.split('fb8a12c5').join(REV.slice(0, 8)).split('worktree DIRTY').join('worktree clean');
    explained = diff.filter((i) => sub(b[i] ?? '') === (a[i] ?? ''));
  }
  const gl = mine === null ? null : mine.split('\n').find((l) => l.startsWith('GATE:'));
  const pl = mine === null ? null : mine.split('\n').find((l) => l.startsWith('PREDICTIONS:'));
  leg('G1', 'HIS ROUND 438 REPRODUCES IN MY TREE — his grader driven unmodified as this fire\'s '
    + 'first action, before any instrument of mine existed. The differing lines are not eyeballed: '
    + 'each is asserted to BE a rev/dirty stamp by substituting his stamp for mine and requiring '
    + 'character identity (426/420/422). His §7 figures are this leg\'s detail verbatim',
    mine === null || his === null ? 'REFUSED: a drive recording was unreadable'
      : `${gl} · ${pl} · whole-file diff ${JSON.stringify(diff)} · explained as rev stamps: `
        + `${JSON.stringify(explained)}`,
    diff !== null && explained !== null && diff.length === explained.length
      && gl === 'GATE: true   (11 leg(s))'
      && pl === 'PREDICTIONS: 1 landed, 1 refuted: P1');
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G2 — the reader graded against a CONFUSION MATRIX, not a known positive. Four fixtures, four
// required verdicts, and the old key's verdict printed beside the new one on each so the leg shows
// WHERE the two keys disagree rather than only that they do.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const cells = [
    { f: 'fixture-gate-true.mjs', want: 'GREEN', oldGreen: true },
    { f: 'fixture-gate-false.mjs', want: 'RED', oldGreen: false },
    { f: 'fixture-no-gate.mjs', want: 'UNGRADEABLE', oldGreen: false },
    { f: 'fixture-silent.mjs', want: 'UNGRADEABLE', oldGreen: false },
  ];
  const rows = cells.map((c) => {
    const r = classify(join('docs/research/round439-instruments', c.f));
    return { ...c, got: r.state, old: oldKeyGreen(r) ? 'green' : 'not-green', redLegs: r.redLegs };
  });
  const ok = rows.every((r) => r.got === r.want && (r.old === 'green') === r.oldGreen);
  leg('G2', 'THE THREE-STATE READER IS GRADED BY A CONFUSION MATRIX. A single known positive would '
    + 'show only that a VACUITY-only file can be detected; what has to be separated is UNGRADEABLE '
    + 'from a REAL failure, in both directions. Four fixtures: a passing gate, a FAILING gate with '
    + 'a named leg, a VACUITY-only file, and a SILENT file — the last so that UNGRADEABLE is not '
    + 'keyed on the string `VACUITY:` by accident (355/364/418). The old key\'s verdict is printed '
    + 'on every row: it calls three of the four not-green, which is the defect',
    rows.map((r) => `${r.f} → ${r.got} (wanted ${r.want}${r.redLegs ? `, legs ${JSON.stringify(r.redLegs)}` : ''}) · old key: ${r.old}`).join('\n        '),
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G3 — the population, and the per-FILE attribution map. My Round 437 G9 published a per-ROUND red
// list, which is the unit that hid this: two members of a round, one green and one unreportable,
// reduce to "round436 red". The map below is published per file with its failing legs.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const MY_ROUND = 437; // the round whose G9 is under attribution, not this file's own round
const { all, later, pop, graders } = populationOf(REV, MY_ROUND, /grade|attack/);
const OVERRIDE = process.env.KLATCH_R439_MEMBERS;
const members = OVERRIDE ? OVERRIDE.split(',').map((s) => s.trim()).filter(Boolean) : graders;
const results = DEPTH > 0 ? null : members.map((p) => classify(p));
{
  const by = (s) => results === null ? [] : results.filter((r) => r.state === s);
  const drifted = results === null ? [] : results.filter((r) => r.blob !== MOD_AT_HEAD);
  leg('G3', 'THE PER-FILE ATTRIBUTION MAP over my Round 437 G9 population, re-driven at a stamped '
    + 'rev with the same key (names from `ls-tree`, the module named by CONTENT READ AT THE REV '
    + 'rather than from the worktree, my round and later excluded by a derived key). Published per '
    + 'FILE with failing-leg sets and elapsed, because the per-ROUND unit my §8 published is what '
    + 'hid a green grader behind an unreportable crippler in the same directory',
    results === null ? `REFUSED at drive depth ${DEPTH} — see the depth guard (G8)`
      : `tree at ${REV.slice(0, 8)}: ${all.length} name the module · round >= ${MY_ROUND} excluded: `
        + `${later.length} · population ${pop.length}, ${graders.length} selected as graders`
        + `${OVERRIDE ? ` · MEMBER OVERRIDE in force: ${members.length} member(s)` : ''}\n        `
        + results.map((r) => `${r.state.padEnd(11)} ${r.path}${r.redLegs ? ` ${JSON.stringify(r.redLegs)}` : ''} · ${r.ms}ms`).join('\n        ')
        + `\n        GREEN ${by('GREEN').length} · RED ${by('RED').length} · UNGRADEABLE `
        + `${by('UNGRADEABLE').length} · REFUSED ${by('REFUSED').length}`
        + ` · module blob drifted during: ${drifted.length === 0 ? 'none' : JSON.stringify(drifted.map((r) => r.path))}`,
    results !== null && graders.length > 0 && later.length > 0
      && by('REFUSED').length === 0 && results.length === members.length);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G4 — HIS §4, at round436's own granularity. His claim is that round436's red is ENTIRELY the
// crippler. That is a claim about both members of that directory, so both are read.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const mem = results === null ? null : results.filter((r) => r.path.includes('round436-instruments'));
  const crip = mem?.filter((r) => basename(r.path) === 'cripple-and-regrade.mjs') ?? [];
  const rest = mem?.filter((r) => basename(r.path) !== 'cripple-and-regrade.mjs') ?? [];
  const ok = mem !== null && mem.length === 2 && crip.length === 1 && rest.length === 1
    && crip[0].state === 'UNGRADEABLE' && rest[0].state === 'GREEN';
  leg('G4', 'HIS §4 ATTRIBUTION, CONFIRMED OR NOT AT ROUND436\'S GRANULARITY (345): round436 has '
    + 'two members in this population, and the claim "the red is entirely the crippler" requires '
    + 'the crippler UNGRADEABLE **and** the grader GREEN. Either half alone leaves the red '
    + 'partly real',
    mem === null ? `REFUSED at drive depth ${DEPTH}`
      : mem.map((r) => `${basename(r.path)} → ${r.state}${r.redLegs ? ` ${JSON.stringify(r.redLegs)}` : ''}`).join(' · ')
        + ` — his §4 ${ok ? 'CONFIRMED: the round436 red is 100% manufactured by my fall-through bucket' : 'NOT confirmed as stated'}`,
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G5 — his SECOND claim, deliberately a separate leg: round435's crippler contributes the same
// way but was MASKED because that round is red for real legs. Conflating this with G4 would let a
// single verdict stand for two different findings.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const mem = results === null ? null : results.filter((r) => r.path.includes('round435-instruments'));
  const crip = mem?.find((r) => basename(r.path) === 'cripple-and-regrade.mjs') ?? null;
  const grad = mem?.find((r) => basename(r.path) !== 'cripple-and-regrade.mjs') ?? null;
  const ok = crip !== null && grad !== null && crip.state === 'UNGRADEABLE'
    && grad.state === 'RED' && Array.isArray(grad.redLegs) && grad.redLegs.length > 0;
  leg('G5', 'HIS MASKING CLAIM, GRADED SEPARATELY: round435\'s crippler is UNGRADEABLE in exactly '
    + 'the same way, and its contribution to my published red list was invisible because that '
    + 'round\'s grader is red for REAL legs. The real legs are named here rather than counted — '
    + 'they are the live-module-keyed legs I carried forward as my own open item, so this leg also '
    + 'says what my round435 red actually is',
    mem === null ? `REFUSED at drive depth ${DEPTH}`
      : `crippler → ${crip?.state} · grader → ${grad?.state}`
        + `${grad?.redLegs ? ` on real legs ${JSON.stringify(grad.redLegs)}` : ''}`
        + ` — masking ${ok ? 'CONFIRMED: two causes reduced to one round label' : 'NOT confirmed as stated'}`,
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G6 — the 2 x 2. Both keys over the SAME measured map, and the OLD key is required to still
// reproduce the figure I actually published. A cure graded against a figure I never published
// grades nothing (380/397/412).
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const PUBLISHED_437_G9_RED = ['round431', 'round433', 'round435', 'round436'];
{
  const oldRed = results === null ? null : roundsOf(results.filter((r) => !oldKeyGreen(r)));
  const newRed = results === null ? null : roundsOf(results.filter((r) => r.state === 'RED'));
  const ungrad = results === null ? null : roundsOf(results.filter((r) => r.state === 'UNGRADEABLE'));
  const removed = oldRed === null ? null : oldRed.filter((r) => !newRed.includes(r));
  const added = oldRed === null ? null : newRed.filter((r) => !oldRed.includes(r));
  const reproduces = oldRed !== null && JSON.stringify(oldRed) === JSON.stringify(PUBLISHED_437_G9_RED);
  const ok = reproduces && JSON.stringify(removed) === JSON.stringify(['round436'])
    && added.length === 0;
  leg('G6', 'THE SEAM, DECLARED AND GRADED AS A 2 x 2: old key (`gate.includes("true")`, everything '
    + 'else red) and new key (three states) computed over the SAME drive, so nothing but the key '
    + 'can differ (339). The old key must still reproduce my PUBLISHED `[round431, round433, '
    + 'round435, round436]` — if it does not, the thing being cured is not the thing I shipped — '
    + 'and the cure must remove exactly round436 and add nothing',
    oldRed === null ? `REFUSED at drive depth ${DEPTH}`
      : `old key red: [${oldRed.join(', ')}] · reproduces my published figure: ${reproduces}\n        `
        + `new key red: [${newRed.join(', ')}] · UNGRADEABLE: [${ungrad.join(', ')}]\n        `
        + `removed by the third state: ${JSON.stringify(removed)} · added: ${JSON.stringify(added)}`,
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G7 — the shared module. Three corruptions of it in Round 437 came from driving this population,
// and my own round435 crippler still writes the COMMITTED file rather than a copy. Asserted per
// member in G3; asserted here at entry and exit against HEAD's blob.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const exit = modBlobNow();
  leg('G7', 'THE SHARED SUBJECT MODULE IS ASSERTED, NOT ASSUMED — blob at exit against `HEAD:`\'s '
    + 'blob. Round 437 found this file MODIFIED twice mid-fire from driving this very population, '
    + 'and my round435 crippler mutates the committed file rather than a copy (his Round 438 §1 '
    + 'cured that for his). A drive that silently graded a corrupted module publishes a figure '
    + 'about a file that does not exist in the tree',
    `${MODPATH} · HEAD blob ${MOD_AT_HEAD.slice(0, 8)} · at exit ${exit.slice(0, 8)} · `
      + `identical: ${exit === MOD_AT_HEAD}`,
    exit === MOD_AT_HEAD);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G8 — the depth guard, read as a MEASUREMENT of what was exported, not as a claim.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const src = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const refusesDeep = /DEPTH > 0 \? null :/.test(src);
  // The spawn half is BEHAVIOURAL: a fixture reports the depth it was actually handed, so this
  // leg does not consist of a regex over the source that produced it (369).
  const echo = classify(join('docs/research/round439-instruments', 'fixture-echo-depth.mjs'));
  const seen = echo.gate?.match(/DEPTH=(\S+)/)?.[1] ?? null;
  leg('G8', 'THE DEPTH GUARD, both halves — and the spawn half BEHAVIOURALLY: a fixture child '
    + 'reports the `KLATCH_DRIVE_DEPTH` it was actually handed, rather than this leg asserting a '
    + 'regex over the same source that spawns it (369). The refusal half is a source pin, named as '
    + 'such. His Round 438 §1 honours the same variable from his side, so the cycle my Round 437 '
    + 'measured at 15 concurrent processes is broken at both ends',
    `running at depth ${DEPTH} · child reported DEPTH=${seen} (expected ${DEPTH + 1}) · driving `
      + `legs refuse at depth > 0: ${refusesDeep} · driving legs ${results === null ? 'REFUSED' : 'ran'}`,
    seen === String(DEPTH + 1) && refusesDeep === true);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// P1 / P2 — declared, and declared NOT BLIND. His §4's reproduced leg (G1's recording, line 21)
// already prints the per-file map under HIS key, so I have read these values before driving mine.
// What they test is therefore not the value but whether MY key and MY reader, written
// independently over a population that differs from his by one member, agree with his — which is
// exactly what a transcription of his line would have faked (412/428).
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const newRed = results === null ? null : roundsOf(results.filter((r) => r.state === 'RED'));
  pred('P1', 'NOT BLIND, and said so: with the third state in, my Round 437 G9 population\'s red '
    + 'list is exactly [round431, round433, round435] — round436 leaves entirely, round435 stays '
    + 'for its own real legs. The test is agreement between two independent readers over '
    + 'populations differing by one member, not the value',
    newRed === null ? `REFUSED at drive depth ${DEPTH}`
      : `new key red: [${newRed.join(', ')}] — predicted exactly [round431, round433, round435]`,
    newRed !== null && JSON.stringify(newRed) === JSON.stringify(['round431', 'round433', 'round435']));
  const ung = results === null ? null : results.filter((r) => r.state === 'UNGRADEABLE');
  pred('P2', 'the UNGRADEABLE members are exactly two, and both are named `cripple-and-regrade.mjs` '
    + '— so the mechanism is a FILENAME CLASS my selector was never keyed to exclude, not one '
    + 'misbehaving file. Also not blind, same reason',
    ung === null ? `REFUSED at drive depth ${DEPTH}`
      : `${ung.length} ungradeable: ${JSON.stringify(ung.map((r) => r.path))}`,
    ung !== null && ung.length === 2 && ung.every((r) => basename(r.path) === 'cripple-and-regrade.mjs'));
}

// ── Report ──────────────────────────────────────────────────────────────────────────────────────
const red = legs.filter((l) => l.ok !== true);
for (const l of legs) {
  console.log(`${l.ok === true ? ' ok ' : 'FAIL'}  ${l.id}  ${l.claim}`);
  console.log(`        ${l.detail}`);
}
console.log('');
for (const p of preds) {
  console.log(`${p.landed === true ? 'LANDED  ' : 'REFUTED '}${p.id}  ${p.claim}`);
  console.log(`        ${p.detail}`);
}
console.log('');
console.log(`GATE: ${red.length === 0}   (${legs.length} leg(s))`
  + `${red.length ? `   RED: ${red.map((l) => l.id).join(', ')}` : ''}`);
console.log(`PREDICTIONS: ${preds.filter((p) => p.landed === true).length} landed, `
  + `${preds.filter((p) => p.landed !== true).length} refuted`
  + `${preds.filter((p) => p.landed !== true).length ? `: ${preds.filter((p) => p.landed !== true).map((p) => p.id).join(', ')}` : ''}`);
console.log(`  rev ${REV.slice(0, 8)} · worktree ${DIRTY ? 'DIRTY' : 'clean'} · depth ${DEPTH} · `
  + `module blob ${MOD_AT_HEAD.slice(0, 8)}`);
