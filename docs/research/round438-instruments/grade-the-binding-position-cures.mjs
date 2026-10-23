/**
 * Round 438 — his Round 437 §1, graded. Three findings, two cured, one taken as a correction to the
 * docblock that described its own key wrongly.
 *
 * Every verdict is driven at the real entry point (`conventionOf` over a whole function source), and
 * the pre-cure side is `precure-refusal-convention.sliced.mjs` — the committed blob of the module at
 * `e797a859`, cut with `git show` and asserted against `git rev-parse <rev>:<path>` by `G1`. Not a
 * re-typed copy (412), and not the live module read twice.
 *
 * ## What each leg is pointed at
 *
 * `G2`–`G5` are 2 x 2 movement readings with controls BOTH ways: a row the finding names must move
 * ADMITTED → refused, a same-shape row under another name must refuse on BOTH sides (so the cure is
 * not "refuse more"), and a genuine reference must stay ADMITTED on both (so it is not "refuse
 * everything"). A known positive alone would not separate those (418).
 *
 * `G6` asserts a residual I did NOT cure is still exactly where he said it is, in the direction he
 * said — the leg goes red if his Finding 3 silently stopped reproducing, which would mean the
 * docblock I just wrote about it is false.
 *
 * `G7` is the FORWARD leg his §3 asks for: it reads the verdict of the two instruments that grade
 * the module against the cures already in it, rather than asserting a defect is still live. Driven
 * as children with `KLATCH_DRIVE_DEPTH` incremented.
 *
 * `G9` is the corruption gate from his §4: the module actually graded must be HEAD's blob unless a
 * declaration says otherwise. A crippled or pre-commit module reddens the gate instead of being
 * graded silently and published as a defect in the module.
 *
 * ## Vacuity, declared rather than implied
 *
 * `G2`–`G6` are driven against a crippled copy by `cripple-and-regrade.mjs` and each is required to
 * MOVE. `G1`, `G7`, `G8`, `G9`, `G10` read the git tree, other instruments' output or the
 * environment, so no crippling of the module can move them: their vacuity is unmeasured this round
 * and that is a gap, not coverage.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const DIRTY = git('status', '--porcelain').trim() !== '';

// His 437 §4. Children carry the depth incremented; legs that drive a population refuse above 0.
const DEPTH = Number.parseInt(process.env.KLATCH_DRIVE_DEPTH ?? '0', 10) || 0;
const CHILD = {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 1 << 28,
  timeout: 600_000,
  env: { ...process.env, KLATCH_DRIVE_DEPTH: String(DEPTH + 1) },
};

const MOD = 'docs/research/round430-instruments/refusal-convention.mjs';
const SLICE = 'docs/research/round438-instruments/precure-refusal-convention.sliced.mjs';
const REV_438 = 'e797a859'; // what the module was BEFORE this round

// His §4, the corruption half: the module path is overridable so a crippler mutates a COPY.
const MOD_PATH = process.env.KLATCH_REFUSAL_MOD ?? join(REPO, MOD);
const MOD_BLOB = git('hash-object', MOD_PATH).trim();
const HEAD_BLOB = git('rev-parse', `HEAD:${MOD}`).trim();
// The declaration is a FLAG as well as an env var: a pre-commit cure drive is launched by hand, and
// `--expect-dirty-module` on the command line is visible in the shell history that produced the
// recording in a way an exported variable is not.
const DECLARED = process.env.KLATCH_REFUSAL_MOD !== undefined
  || process.env.KLATCH_EXPECT_DIRTY_MOD === '1'
  || process.argv.includes('--expect-dirty-module');

const LIVE = await import(MOD_PATH);
const PRE = await import(join(REPO, SLICE));

const legs = [];
const preds = [];
// `null` is REFUSED — the leg measured nothing and says so. Counted as neither green nor red (436).
const leg = (id, claim, detail, ok) => legs.push({ id, claim, detail, ok });
const pred = (id, claim, detail, landed) => preds.push({ id, claim, detail, landed });

const BODY = (ret) => `
  const CONST = 'ZZZZ';
  if (src === undefined) return { refused: 'no input' };
  if (src === '') return null;
  return ${ret};
`;
const SUBJ = (ret) => `function read(src) {${BODY(ret)}}`;
const adm = (c) => (c === null || c === undefined ? null : c.refused === undefined);
const both = (ret) => ({ ret, pre: adm(PRE.conventionOf(SUBJ(ret))), live: adm(LIVE.conventionOf(SUBJ(ret))) });

// ---------------------------------------------------------------------------------------------
// G1 — the pre-cure side is the TREE's blob, not a hand copy.
// ---------------------------------------------------------------------------------------------
{
  const sliceBlob = git('hash-object', join(REPO, SLICE)).trim();
  const treeBlob = git('rev-parse', `${REV_438}:${MOD}`).trim();
  leg('G1', `the pre-cure side is the committed module at ${REV_438}, read with git`,
    `slice blob ${sliceBlob.slice(0, 8)} · tree blob at ${REV_438} ${treeBlob.slice(0, 8)} · equal: `
    + `${sliceBlob === treeBlob}`,
    sliceBlob === treeBlob);
}

// ---------------------------------------------------------------------------------------------
// G2 — his FINDING 1 at the endpoint. Four spellings, each with a same-shape control under another
// name and two genuine-reference controls. The gate is the whole matrix, not the four movers.
// ---------------------------------------------------------------------------------------------
const F1 = [
  ['function expression name', '{ span: function src() { return 1; } }', '{ span: function q() { return 1; } }'],
  ['generator expression name', '{ span: function* src() { return 1; } }', '{ span: function* q() { return 1; } }'],
  ['async function expr name', '{ span: async function src() { return 1; } }', '{ span: async function q() { return 1; } }'],
  ['class expression name', '{ span: class src { m() { return 1; } } }', '{ span: class q { m() { return 1; } } }'],
];
const REFS = [
  ['plain reference', '{ span: src }'],
  ['member call on it', '{ span: src.slice(0, 1) }'],
  ['anonymous class, extends, body mentions it', '{ span: class extends Object { m() { return src; } } }'],
];
{
  const movers = F1.map(([label, hit]) => ({ label, ...both(hit) }));
  const ctls = F1.map(([label, , q]) => ({ label: `${label} (other name)`, ...both(q) }));
  const refs = REFS.map(([label, r]) => ({ label, ...both(r) }));
  const moved = movers.filter((m) => m.pre === true && m.live === false);
  const ctlOk = ctls.filter((c) => c.pre === false && c.live === false);
  const refOk = refs.filter((r) => r.pre === true && r.live === true);
  leg('G2', "FINDING 1 CURED — a function or class expression's own name, spelled like the input, "
    + 'no longer reads as a reference',
    `${moved.length}/${F1.length} spellings moved ADMITTED → refused `
    + `(${movers.map((m) => `${m.label}: ${m.pre}→${m.live}`).join(' · ')}) · `
    + `${ctlOk.length}/${ctls.length} same-shape controls under another name refused on BOTH sides · `
    + `${refOk.length}/${refs.length} genuine references ADMITTED on both`,
    moved.length === F1.length && ctlOk.length === ctls.length && refOk.length === refs.length);
}

// ---------------------------------------------------------------------------------------------
// G3 — his FINDING 1 located at the masker, not inferred from the endpoint. The binding occurrence
// is blanked, the masker stays length-preserving, and the control's binding is blanked too: the cure
// is keyed on the POSITION, not on the name matching the input.
// ---------------------------------------------------------------------------------------------
{
  const rows = [...F1.map(([l, hit]) => [l, hit, 'src']), ...F1.map(([l, , q]) => [`${l} (other name)`, q, 'q'])];
  const r = rows.map(([label, ret, name]) => {
    const pre = PRE.maskKeyPositions(ret);
    const live = LIVE.maskKeyPositions(ret);
    const at = ret.indexOf(`${name} `) >= 0 ? ret.indexOf(`${name} `) : ret.indexOf(name, ret.indexOf(':'));
    return {
      label,
      preKept: pre.slice(at, at + name.length) === name,
      liveBlank: live.slice(at, at + name.length) === ' '.repeat(name.length),
      len: live.length === ret.length,
    };
  });
  const ok = r.filter((x) => x.preKept && x.liveBlank && x.len);
  leg('G3', 'FINDING 1 LOCATED AT THE MASKER — the binding name is blanked, length-preserving, and '
    + 'blanked for a control name too',
    `${ok.length}/${r.length} rows: kept pre-cure, blanked live, length preserved · `
    + `failures: [${r.filter((x) => !(x.preKept && x.liveBlank && x.len)).map((x) => x.label).join(', ') || 'none'}]`,
    ok.length === r.length);
}

// ---------------------------------------------------------------------------------------------
// G4 — his FINDING 2 at the endpoint, his own six-row table. The two rows that move are the
// class-body ones; the comma-delimited counterpart refuses in BOTH orders on BOTH sides, which is
// what makes the cause the DELIMITER and not the position and not the name.
// ---------------------------------------------------------------------------------------------
const F2 = [
  ['class, input first', '{ span: class { src() { return 1; } a() { return 2; } } }', 'refuse-both'],
  ['class, input second', '{ span: class { a() { return 1; } src() { return 2; } } }', 'move'],
  ['class, input second, `;`', '{ span: class { a() { return 1; }; src() { return 2; } } }', 'move'],
  ['class, input absent', '{ span: class { a() { return 1; } q() { return 2; } } }', 'refuse-both'],
  ['object, input first', '{ span: { src() { return 1; }, a() { return 2; } } }', 'refuse-both'],
  ['object, input second', '{ span: { a() { return 1; }, src() { return 2; } } }', 'refuse-both'],
];
{
  const r = F2.map(([label, ret, want]) => {
    const v = both(ret);
    const got = v.pre === true && v.live === false ? 'move'
      : v.pre === false && v.live === false ? 'refuse-both'
        : v.pre === true && v.live === true ? 'admit-both' : `${v.pre}→${v.live}`;
    return { label, want, got, ok: got === want };
  });
  const ok = r.filter((x) => x.ok);
  leg('G4', 'FINDING 2 CURED — a class body whose members are separated by nothing or by `;` no '
    + 'longer gets exactly one try, and the comma-delimited counterpart is unchanged',
    `${ok.length}/${r.length} rows as specified BEFORE the drive · `
    + `${r.map((x) => `${x.label}: ${x.got}${x.ok ? '' : ` (want ${x.want})`}`).join(' · ')}`,
    ok.length === r.length);
}

// ---------------------------------------------------------------------------------------------
// G5 — FINDING 2 at the masker. Same two members, order swapped: pre-cure only the FIRST name can be
// blanked, live both can. Read off the masker's output text, not off the endpoint verdict.
// ---------------------------------------------------------------------------------------------
{
  const A = '{ span: class { a() { return 1; } src() { return 2; } } }';
  const B = '{ span: class { src() { return 1; } a() { return 2; } } }';
  const blanked = (text, mod) => {
    const m = mod.maskKeyPositions(text);
    return ['a', 'src'].filter((n) => {
      const at = text.indexOf(`${n}(`);
      return at >= 0 && m.slice(at, at + n.length) === ' '.repeat(n.length);
    });
  };
  const preA = blanked(A, PRE);
  const liveA = blanked(A, LIVE);
  const preB = blanked(B, PRE);
  const liveB = blanked(B, LIVE);
  const ok = JSON.stringify(preA) === JSON.stringify(['a'])
    && JSON.stringify(liveA) === JSON.stringify(['a', 'src'])
    && JSON.stringify(preB) === JSON.stringify(['src'])
    && JSON.stringify(liveB) === JSON.stringify(['a', 'src']);
  leg('G5', 'FINDING 2 LOCATED AT THE MASKER — pre-cure exactly the first member is blanked, live '
    + 'every member is, in both orders',
    `order [a, src]: pre [${preA.join(', ')}] → live [${liveA.join(', ')}] · `
    + `order [src, a]: pre [${preB.join(', ')}] → live [${liveB.join(', ')}]`,
    ok);
}

// ---------------------------------------------------------------------------------------------
// G6 — his FINDING 3, NOT cured, asserted to be exactly where he said it is. If this leg goes red
// the residual stopped reproducing and the docblock I wrote about it this round is false.
// ---------------------------------------------------------------------------------------------
{
  const asi = '{ f: () => { src(1)\n  { let x = 1; } } }';
  const semi = '{ f: () => { src(1); } }';
  const nomention = '{ q: () => { other(1)\n  { let x = 1; } } }';
  const r = {
    asiPre: PRE.mentionsParam(asi, ['src']),
    asiLive: LIVE.mentionsParam(asi, ['src']),
    semiLive: LIVE.mentionsParam(semi, ['src']),
    ctlLive: LIVE.mentionsParam(nomention, ['src']),
  };
  const ok = r.asiPre === false && r.asiLive === false && r.semiLive === true && r.ctlLive === false;
  leg('G6', 'FINDING 3 is a NAMED RESIDUAL, not a cure — a call closing onto a block statement '
    + 'through ASI still reads as not-a-mention, in the over-refusal direction',
    `ASI row mentionsParam: pre ${r.asiPre} → live ${r.asiLive} (unchanged, as declared) · `
    + `the \`;\` control ${r.semiLive} (holds) · a row mentioning nothing ${r.ctlLive}`,
    ok);
}

// ---------------------------------------------------------------------------------------------
// G11 — the `;` half of Finding 2's cure, which the vacuity drive showed does NO work on any of the
// legs above: cell B crippled it and nothing moved. Every row in his table is a method-headed
// member, and those are re-armed by the reset-after-a-successful-head instead.
//
// The shape only `;` can reach is a member whose head is NOT a method head, so the single try is
// consumed and no mask succeeds to re-arm it: a class FIELD. `class { f = 1; src() {…} }` moves
// ADMITTED → refused and the `;` branch is the only thing that can explain it.
//
// And the residual that pair exposes, measured rather than reasoned: with NO delimiter, a member
// whose head is an identifier without parens, or a numeric literal, still consumes the one try and
// every member after it is unreachable. A computed key does NOT — `[` opens a frame before the
// colon-free leg is reached, so the try survives it. Direction under-refusal, and the cure is a
// frame-kind model, which is his Finding 3's cure and not this round's.
// ---------------------------------------------------------------------------------------------
{
  const rows = [
    ['field, `;`, then the input', '{ span: class { f = 1; src() { return 2; } } }', 'move'],
    ['numeric head, no delimiter', '{ span: class { 1() { return 1; } src() { return 2; } } }', 'admit-both'],
    ['field, no delimiter', '{ span: class { f = 1 src() { return 2; } } }', 'admit-both'],
    ['computed head, no delimiter', '{ span: class { [k]() { return 1; } src() { return 2; } } }', 'refuse-both'],
    ['numeric head, input absent', '{ span: class { 1() { return 1; } q() { return 2; } } }', 'refuse-both'],
  ];
  const r = rows.map(([label, ret, want]) => {
    const v = both(ret);
    const got = v.pre === true && v.live === false ? 'move'
      : v.pre === false && v.live === false ? 'refuse-both'
        : v.pre === true && v.live === true ? 'admit-both' : `${v.pre}→${v.live}`;
    return { label, want, got, ok: got === want };
  });
  const ok = r.filter((x) => x.ok);
  leg('G11', 'the `;` branch does work no other branch does — a class FIELD re-arms the leg — and '
    + 'the undelimited non-method head is a DECLARED residual, not a cure',
    `${ok.length}/${r.length} rows as specified BEFORE the drive · `
    + `${r.map((x) => `${x.label}: ${x.got}${x.ok ? '' : ` (want ${x.want})`}`).join(' · ')}`,
    ok.length === r.length);
}

// ---------------------------------------------------------------------------------------------
// G7 — the FORWARD leg (his §3). Read the verdict of the instruments that grade the module against
// the cures ALREADY in it. A finding-leg keyed on the live module asserts the finding has not been
// taken; this one asserts the opposite, so it survives its own cure landing.
// ---------------------------------------------------------------------------------------------
{
  const drive = (p) => {
    let out;
    try { out = execFileSync('node', [p], CHILD); }
    catch (e) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
    const gate = out.split('\n').filter((l) => l.startsWith('GATE:'));
    return { green: gate.length > 0 && gate.every((l) => l.includes('true')), gate: gate.join(' | ') };
  };
  const mine = drive('docs/research/round436-instruments/grade-the-cures-against-a-runtime-oracle.mjs');
  const r430 = drive('docs/research/round430-instruments/grade-the-convention-gate.mjs');
  leg('G7', 'the instruments that grade the module FORWARD stay green under this round\'s cures',
    `round436 grader: ${mine.gate || '(no GATE line)'} · round430 gate: ${r430.gate || '(no GATE line)'}`,
    mine.green && r430.green);
}

// ---------------------------------------------------------------------------------------------
// G8 — the whole corpus `conventionOf` is actually used on. A cure measured only on hand-written
// rows has an unmeasured blast radius; this drives every return-shape in the round430 corpus reader
// and requires the pre-cure and live verdicts to differ on NOTHING outside the two findings' rows.
// ---------------------------------------------------------------------------------------------
{
  const corpus = git('ls-tree', '-r', '--name-only', REV, '--', 'scripts/lib').trim().split('\n')
    .filter((p) => p.endsWith('.mjs'));
  const rows = corpus.map((p) => {
    const text = readFileSync(join(REPO, p), 'utf8');
    return { p, pre: adm(PRE.conventionOf(text)), live: adm(LIVE.conventionOf(text)) };
  });
  const moved = rows.filter((r) => r.pre !== r.live);
  leg('G8', 'the cures move no verdict on the live corpus — a blast-radius measurement, not a pin',
    `${rows.length} file(s) under scripts/lib at ${REV.slice(0, 8)} driven through conventionOf · `
    + `verdicts that moved: ${moved.length} [${moved.map((m) => `${m.p}: ${m.pre}→${m.live}`).join(', ') || 'none'}]`,
    rows.length > 0 && moved.length === 0);
}

// ---------------------------------------------------------------------------------------------
// G9 — his §4's corruption gate. The module graded must be HEAD's blob unless a declaration says
// otherwise, so a drive over a crippled or uncommitted module reddens instead of reporting.
// ---------------------------------------------------------------------------------------------
{
  const clean = MOD_BLOB === HEAD_BLOB;
  leg('G9', 'the module graded is HEAD\'s blob, or a declaration says why it is not',
    `graded blob ${MOD_BLOB.slice(0, 8)} · HEAD blob ${HEAD_BLOB.slice(0, 8)} · equal ${clean} · `
    + `declared ${DECLARED}`
    + `${process.env.KLATCH_REFUSAL_MOD === undefined ? '' : ' (KLATCH_REFUSAL_MOD — a crippled copy)'}`
    + `${process.env.KLATCH_EXPECT_DIRTY_MOD === '1' || process.argv.includes('--expect-dirty-module') ? ' (declared pre-commit cure drive)' : ''}`,
    clean || DECLARED);
}

// ---------------------------------------------------------------------------------------------
// G10 — the population, with his §4's depth guard and a derived round key.
// ---------------------------------------------------------------------------------------------
{
  const OWN = Number.parseInt((HERE.match(/round(\d+)-instruments/) ?? [])[1] ?? 'x', 10);
  const roundOf = (p) => Number.parseInt((p.match(/round(\d+)-instruments/) ?? [])[1] ?? 'x', 10);
  const laterOrSelf = (p) => Number.isInteger(roundOf(p)) && roundOf(p) >= OWN;
  const named = git('grep', '-l', '--', 'refusal-convention.mjs', REV, '--', 'docs/research')
    .trim().split('\n').map((l) => l.replace(`${REV}:`, ''))
    .filter((p) => p.endsWith('.mjs'));
  const inPop = named.filter((p) => !laterOrSelf(p));
  const graders = inPop.filter((p) => /grade|attack/.test(p));
  const refused = DEPTH > 0 || !Number.isInteger(OWN);
  const results = refused ? [] : graders.map((p) => {
    let out;
    try { out = execFileSync('node', [p], CHILD); }
    catch (e) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
    const gl = out.split('\n').filter((l) => l.startsWith('GATE:'));
    // The per-member FAIL ids are recorded, not just red-vs-green: a saturated verdict hides a
    // reason-level cause (433), and "round436 is red" is not a reading of WHY.
    const fails = [...new Set(out.split('\n').filter((l) => /^\s*(FAIL|FALSE)\s+G\d+/.test(l))
      .map((l) => (l.match(/G\d+/) ?? [''])[0]))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    // Three states, not two. A member with NO `GATE:` line has not failed — it is UNGRADEABLE by
    // this leg, and calling it red is a finding manufactured by a selector that cannot refuse (436).
    // `/grade|attack/` over-selects on exactly this: `cripple-and-regrade.mjs` matches `grade` and
    // prints `VACUITY:`, never `GATE:`. Its own first drive put two such files in the red list with
    // an empty failing-leg set, which is what a fall-through terminal bucket looks like (411).
    return {
      p,
      verdict: gl.length === 0 ? 'ungradeable' : gl.every((l) => l.includes('true')) ? 'green' : 'red',
      fails,
    };
  });
  const roundName = (p) => p.split('/')[2].replace('-instruments', '');
  const uniqRed = refused ? null
    : [...new Set(results.filter((r) => r.verdict === 'red').map((r) => roundName(r.p)))].sort();
  const ungradeable = refused ? [] : results.filter((r) => r.verdict === 'ungradeable');
  const why = refused ? '' : results.filter((r) => r.verdict === 'red')
    .map((r) => `${roundName(r.p)}/${r.p.split('/')[3]} [${r.fails.join(', ')}]`).join(' · ');
  leg('G10', 'the population of instruments naming the module is driven live, not recalled',
    refused
      ? `REFUSED at KLATCH_DRIVE_DEPTH=${DEPTH}: a population figure measured inside another `
        + 'instrument\'s drive is not this leg\'s figure (437 §4)'
      : `${named.length} file(s) name the module at ${REV.slice(0, 8)}, `
        + `${named.length - inPop.length} excluded as round >= ${OWN}, population ${inPop.length}, `
        + `${graders.length} selected by name, of which ${ungradeable.length} UNGRADEABLE (no GATE `
        + `line: ${ungradeable.map((r) => r.p).join(', ') || 'none'}) and `
        + `${graders.length - ungradeable.length} graded · red: [${uniqRed.join(', ')}] · why: ${why}`,
    refused ? null : graders.length - ungradeable.length > 0);
  pred('P2', 'the population\'s reds under my cures are exactly [round431, round433, round435, '
    + 'round437] — round435 for the four live-keyed legs he declined to re-key, round437 because its '
    + 'finding-legs assert MY findings are still live',
    refused ? `UNMEASURED at depth ${DEPTH}` : `red: [${uniqRed.join(', ')}]`,
    refused ? null : JSON.stringify(uniqRed) === JSON.stringify(['round431', 'round433', 'round435', 'round437']));
}

// ---------------------------------------------------------------------------------------------
// P1 — declared in the source before the drive, and kept as written (405).
// ---------------------------------------------------------------------------------------------
{
  let out;
  try {
    out = execFileSync('node', ['docs/research/round437-instruments/grade-his-cure-and-the-live-keyed-finding-leg.mjs'], CHILD);
  } catch (e) { out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
  writeFileSync(join(HERE, 'his-round437-postcure.out'), out);
  const gate = out.split('\n').find((l) => l.startsWith('GATE:')) ?? '';
  const perLeg = [...new Set(out.split('\n').filter((l) => /^\s*FAIL\s+G\d+/.test(l))
    .map((l) => (l.match(/G\d+/) ?? [''])[0]))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  pred('P1', 'his Round 437 grader reddens on exactly G1, G2, G3 and G4 — G2/G3/G4 because they '
    + 'assert Findings 1 and 2 are live and I have taken both, and G1 because my §4 repair adds a '
    + 'stamp line to my grader\'s output that his whole-file diff has no rev model for. G5 (his '
    + 'Finding 3) stays green: I left it named rather than cured',
    `his GATE: ${gate || '(not found)'} · red legs off his per-leg FAIL lines: [${perLeg.join(', ')}]`,
    JSON.stringify(perLeg) === JSON.stringify(['G1', 'G2', 'G3', 'G4']));
}

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
const red = legs.filter((l) => l.ok === false);
const refusedLegs = legs.filter((l) => l.ok === null);
for (const l of legs) {
  console.log(`${l.ok === true ? ' ok ' : l.ok === null ? 'REF ' : 'FAIL'}  ${l.id}  ${l.claim}`);
  console.log(`        ${l.detail}`);
}
console.log('');
for (const p of preds) {
  console.log(`${p.landed === true ? 'LANDED  ' : p.landed === null ? 'REFUSED ' : 'REFUTED '}${p.id}  ${p.claim}`);
  console.log(`        ${p.detail}`);
}
console.log('');
console.log(`GATE: ${red.length === 0}   (${legs.length} leg(s))${red.length ? `   RED: ${red.map((l) => l.id).join(', ')}` : ''}`
  + `${refusedLegs.length ? `   REFUSED: ${refusedLegs.map((l) => l.id).join(', ')}` : ''}`);
console.log(`PREDICTIONS: ${preds.filter((p) => p.landed === true).length} landed, `
  + `${preds.filter((p) => p.landed === false).length} refuted`
  + `${preds.filter((p) => p.landed === false).length ? `: ${preds.filter((p) => p.landed === false).map((p) => p.id).join(', ')}` : ''}`
  + `${preds.filter((p) => p.landed === null).length ? `, ${preds.filter((p) => p.landed === null).length} refused: ${preds.filter((p) => p.landed === null).map((p) => p.id).join(', ')}` : ''}`);
console.log(`  rev ${REV.slice(0, 8)} · slice at ${REV_438} · worktree ${DIRTY ? 'DIRTY' : 'clean'}`);
console.log(`  module blob ${MOD_BLOB.slice(0, 8)} (${MOD_BLOB === HEAD_BLOB ? '== HEAD' : `!= HEAD:${HEAD_BLOB.slice(0, 8)}`})`
  + `${DECLARED ? ' · declared' : ''} · depth ${DEPTH}`);
