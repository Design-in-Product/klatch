#!/usr/bin/env node
/**
 * grade-the-exit-code.mjs — Unit 464-T2-surface, 2026-10-28, Theseus
 *
 * A defect of my own, found by driving a cell and reading its STATUS rather than its
 * verdict line: `unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs` prints
 *
 *     VERDICT/1 RED legs=9 red=[C3,C6] refused=[] preds=5 refuted=[] prefused=[]
 *
 * and exits **0**. The `/1` is a string literal in a template — it has never been the
 * exit code, and that cell has published RED while exiting 0 every time it ran. Anything
 * keying on `$?` reads every RED as a pass. Daedalus's sibling cells interpolate the
 * code (`VERDICT/${red.length || ref.length ? 1 : 0}`) and exit on it; mine do not.
 *
 * ---------------------------------------------------------------------------------
 * WHY THIS CELL DRIVES INSTEAD OF SCANNING, which is the methodological point
 * ---------------------------------------------------------------------------------
 * My first draft keyed on source: "prints a literal /N and has no `process.exit(...)`
 * whose argument mentions the red/refused sets". That key is wrong in both directions
 * and I caught it on a real file before driving it:
 *
 *   - `zw-scan.mjs` ends `if (!ok) process.exit(1);`. Its gate is LIVE, but no
 *     exit-ARGUMENT regex sees it, because the verdict is in the `if`, not the argument.
 *     The source key calls it silent. FALSE POSITIVE.
 *   - A cell could equally `process.exitCode = 1` inside a loop, or exit on a
 *     reachability guard only (`process.exit(2)`) and look gated while its verdict
 *     runs free. FALSE NEGATIVE.
 *
 * So the graded key is a LIVE DRIVE: run the cell, read the verdict WORD its own line
 * prints (`ok` / `RED` / `REFUSED`) and the process's actual exit status, and assert the
 * two agree. The source scan is kept as a `[MEAS]` with its known false positive named
 * in the output, and `S1` asserts the source key over-reports relative to the drive key —
 * so the weaker instrument's weakness is a measurement rather than a caveat in prose.
 *
 * The driveable set is a DECLARED list, not every `.mjs` under `docs/research/`: a blind
 * sweep would spawn whatever a cell spawns, and some probes in this tree open ports and
 * databases. Every member below runs `git` and nothing else. The cells NOT driven are
 * counted and named in `M2`, so the scope of the answer is on the record instead of
 * reading as "every cell".
 *
 * Cripples (env `CRIPPLE`), each hand-derived BEFORE its drive — see README:
 *   drive-blind        — the drive key reports the printed word as the status
 *   source-as-truth    — legs keyed on the source scan instead of the drive
 *   kp-drop            — drop the known positive from the KP set
 *   population-empty   — declare an empty driveable set
 *   token-blind        — the drive key ignores the printed /N token
 */
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const CRIPPLE = process.env.CRIPPLE ?? null;

function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
}

const REV = (git(['rev-parse', 'HEAD']) ?? 'UNRESOLVED\n').trim();
const SUBJECT = 'docs/research/unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs';
// Pinned by hash, not HEAD~n: the pre-repair blob must not move when anything else lands.
const PRE_REPAIR_REV = '41ae8657e67b6fbfbfbe5497d5d88fe50de6c58e';
const SELF = 'docs/research/unit-464t2-surface-2026-10-28/grade-the-exit-code.mjs';

// Declared driveable set. Every member runs `git` and nothing else — no ports, no DBs,
// no model calls. Checked by reading each one's imports, not assumed from its directory.
//
// drive5 is why this list is what it is. It originally also carried
// `recon-credit-provenance.mjs` and `recon-what-the-credits-are-made-of.mjs`, and `G1`
// reddened: both are recons and print no `VERDICT/` line at all, so neither can be
// measured by a key about verdict-vs-exit agreement. They are out of SCOPE, not green —
// a cell with no verdict has no claim to be honest or silent about. The gate caught my
// own declared set; it is kept exactly as it is so that a future member that stops
// printing a verdict reddens rather than quietly leaving the denominator.
let DRIVEABLE = [
  'docs/research/unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs',
  'docs/research/unit-464t2-reaim-2026-10-28/zw-scan.mjs',
  'docs/research/round464-instruments/grade-the-stop-condition.mjs',
  'docs/research/unit-464t2-keychoice-2026-10-28/grade-the-surface-predicate.mjs',
  'docs/research/unit-464t2-keychoice-2026-10-28/recon2-the-last-round-that-cured-product-source.mjs',
];
if (CRIPPLE === 'population-empty') DRIVEABLE = [];

console.log('=== GRADE/464-T2-surface — the printed /N token against the actual exit status ===');
console.log(`REV ${REV}`);
console.log(`CLOCK ${new Date().toISOString()}`);
console.log(`CRIPPLE ${CRIPPLE ?? 'none (clean)'}`);
console.log('');

// ---------------------------------------------------------------------------
// KEY B (graded): the live drive. Read the verdict WORD the cell prints and the status
// the process actually exits with.
// ---------------------------------------------------------------------------
const VERDICT_LINE_RE = /^VERDICT\/(\d+)\s+(\S+)/;

function driveCell(rel) {
  const r = spawnSync('node', [`${REPO}/${rel}`], {
    stdio: 'pipe',
    encoding: 'utf8',
    timeout: 120000,
  });
  const line = (r.stdout ?? '').split('\n').find((l) => VERDICT_LINE_RE.test(l)) ?? null;
  if (line === null) {
    return { rel, status: r.status, line: null, token: null, word: null, agrees: null };
  }
  const m = VERDICT_LINE_RE.exec(line);
  const token = CRIPPLE === 'token-blind' ? null : Number(m[1]);
  const word = m[2];
  const wantsNonZero = /^(RED|REFUSED)$/.test(word);
  const status = CRIPPLE === 'drive-blind' ? (wantsNonZero ? 1 : 0) : r.status;
  return {
    rel,
    status,
    line,
    token,
    word,
    wantsNonZero,
    // The cell is HONEST when its exit status matches what its own verdict word claims.
    agrees: status === null ? null : wantsNonZero ? status !== 0 : status === 0,
    // And separately: does the PRINTED token match the status it exits with?
    tokenAgrees: token === null || status === null ? null : token === status,
  };
}

const driven = DRIVEABLE.map(driveCell);
console.log('--- KEY B (graded): live drive — printed verdict word vs actual exit status');
for (const d of driven) {
  const flag = d.agrees === null ? 'UNMEAS' : d.agrees ? 'honest' : 'SILENT';
  console.log(
    `  ${flag} ${d.rel.replace('docs/research/', '')}  word=${d.word ?? 'NONE'} status=${d.status} printedToken=${d.token ?? 'n/a'} tokenMatchesStatus=${d.tokenAgrees}`
  );
}
const measured = driven.filter((d) => d.agrees !== null);
const dishonest = measured.filter((d) => d.agrees === false);
const tokenWrong = driven.filter((d) => d.tokenAgrees === false);
console.log(
  `  driven=${driven.length} measured=${measured.length} SILENT=${dishonest.length} printedTokenWrong=${tokenWrong.length}`
);
console.log('');

// ---------------------------------------------------------------------------
// KEY A ([MEAS] only): the source scan my first draft would have shipped, kept so its
// over-reporting is a measured number rather than a sentence of prose.
// ---------------------------------------------------------------------------
const EXIT_ARG_RE = /process\.(?:exit\(|exitCode\s*=\s*)[^;\n]*\b(?:red|refused|ref|status|code)\b/;
const LITERAL_TOKEN_RE = /VERDICT\/\d+\s/;
const DERIVED_TOKEN_RE = /VERDICT\/\$\{/;

function sourceKeyOf(blob) {
  if (blob === null) return null;
  const literal = LITERAL_TOKEN_RE.test(blob);
  const derived = DERIVED_TOKEN_RE.test(blob);
  const exitsOnArg = EXIT_ARG_RE.test(blob);
  return { silent: literal && !derived && !exitsOnArg, literal, derived, exitsOnArg };
}
function sourceKey(rel, rev = REV) {
  return sourceKeyOf(git(['show', `${rev}:${rel}`]));
}

const sourceRows = DRIVEABLE.map((rel) => ({ rel, k: sourceKey(rel) }));
const sourceSilent = sourceRows.filter((r) => r.k && r.k.silent).map((r) => r.rel);
const driveSilent = dishonest.map((d) => d.rel);
const sourceFalsePositives = sourceSilent.filter((p) => !driveSilent.includes(p));
const sourceFalseNegatives = driveSilent.filter((p) => !sourceSilent.includes(p));
console.log('--- KEY A ([MEAS] only): the source scan, and its confusion matrix against Key B');
console.log(`  sourceSaysSilent=${sourceSilent.length} driveSaysSilent=${driveSilent.length}`);
console.log(`  falsePositives=${sourceFalsePositives.length} → ${sourceFalsePositives.map((p) => p.split('/').pop()).join(', ') || '(none)'}`);
console.log(`  falseNegatives=${sourceFalseNegatives.length} → ${sourceFalseNegatives.map((p) => p.split('/').pop()).join(', ') || '(none)'}`);
console.log('');

// ---------------------------------------------------------------------------
// KP / KN for the drive key, sliced out of the tree rather than hand-typed.
// KP: the subject's PRE-REPAIR blob, written to a temp path and driven — a cell that
//     really did print RED and exit 0. A known positive must carry the property itself,
//     not an analogy to it.
// KN: Daedalus's grader at this rev — a cell that really does exit on its verdict.
// ---------------------------------------------------------------------------
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// drive5 tried to build the KP by copying the subject's pre-repair blob into a temp dir
// and driving it. It printed NO verdict line and exited 1: the blob resolves the repo
// root by walking four `dirname`s up from its own `import.meta.url`, so from
// `/tmp/kp-xxxx/` it resolved to a path with no git repo in it, every `git()` returned
// null, and the cell died before its verdict. A scratch copy at the wrong DEPTH refuses
// every cell, and `K1` read that refusal as "the key does not separate" — correctly.
//
// So the KP is SYNTHETIC and self-contained: a cell whose whole body is a verdict line
// and an exit. The property under test is the relationship between the printed verdict
// word and the process's exit status, and a synthetic cell carries that property itself
// rather than standing in for it by analogy. The matching known NEGATIVE is byte-identical
// except for its exit, so the pair differs in exactly the variable the key reads.
function driveSynthetic(name, body) {
  const dir = mkdtempSync(join(tmpdir(), 'kp-exitcode-'));
  const p = join(dir, `${name}.mjs`);
  writeFileSync(p, body);
  const r = spawnSync('node', [p], { stdio: 'pipe', encoding: 'utf8', timeout: 60000 });
  const line = (r.stdout ?? '').split('\n').find((l) => VERDICT_LINE_RE.test(l)) ?? null;
  const m = line ? VERDICT_LINE_RE.exec(line) : null;
  rmSync(dir, { recursive: true, force: true });
  return {
    name,
    status: r.status,
    word: m ? m[2] : null,
    token: m ? Number(m[1]) : null,
    agrees: m === null ? null : /^(RED|REFUSED)$/.test(m[2]) ? r.status !== 0 : r.status === 0,
  };
}
const KP_BODY = "console.log('VERDICT/1 RED legs=1 red=[X1] refused=[]');\n";
const KN_BODY = "console.log('VERDICT/1 RED legs=1 red=[X1] refused=[]');\nprocess.exit(1);\n";
let kp = null;
let knSynthetic = null;
if (CRIPPLE !== 'kp-drop') {
  kp = driveSynthetic('kp-prints-red-exits-zero', KP_BODY);
  knSynthetic = driveSynthetic('kn-prints-red-exits-one', KN_BODY);
}
// The pre-repair blob is still carried, but under the SOURCE key, where it can be read
// without being run — so the historical defect stays pinned to a real artifact.
const preBlob = git(['show', `${PRE_REPAIR_REV}:${SUBJECT}`]);
const preSourceKey = preBlob === null ? null : sourceKeyOf(preBlob);
const kn = driven.find((d) => d.rel.includes('grade-the-surface-predicate')) ?? null;
console.log('--- KP / KN for the drive key');
console.log(
  `  KP synthetic (prints RED, exits 0) ${kp ? `word=${kp.word} status=${kp.status} agrees=${kp.agrees} (want false)` : 'ABSENT'}`
);
console.log(
  `  KN synthetic (prints RED, exits 1) ${knSynthetic ? `word=${knSynthetic.word} status=${knSynthetic.status} agrees=${knSynthetic.agrees} (want true)` : 'ABSENT'}`
);
console.log(
  `  KN real (Daedalus's grader)        ${kn ? `word=${kn.word} status=${kn.status} agrees=${kn.agrees} (want true)` : 'ABSENT'}`
);
console.log(
  `  pre-repair blob under the SOURCE key: ${preSourceKey === null ? 'ABSENT' : `silent=${preSourceKey.silent} literal=${preSourceKey.literal} derived=${preSourceKey.derived}`}`
);
console.log('');

// ---------------------------------------------------------------------------
// LEGS
// ---------------------------------------------------------------------------
const legs = [];
const MEAS_IDS = ['M1', 'M2', 'M3'];
function leg(id, text, value, detail) {
  legs.push({ id, text, value, detail: detail ?? '' });
}
const USE_SOURCE_KEY = CRIPPLE === 'source-as-truth';
const silentSet = USE_SOURCE_KEY ? sourceSilent : driveSilent;

leg(
  'G1',
  'GATE: the declared driveable set is non-empty and every member reached a verdict line — a census that drove nothing, or whose members printed no verdict, must RED here rather than report zero silent cells',
  DRIVEABLE.length > 0 && measured.length === DRIVEABLE.length,
  `declared=${DRIVEABLE.length} measured=${measured.length} noVerdictLine=${driven.filter((d) => d.line === null).map((d) => d.rel.split('/').pop()).join(',') || '(none)'}`
);

leg(
  'K1',
  'the drive key separates a synthetic cell that prints RED and exits 0 from one that prints RED and exits 1 — the two bodies differ in exactly the variable the key reads, so a key that stops separating reddens instead of reporting a smaller number',
  kp === null || knSynthetic === null || kp.agrees === null || knSynthetic.agrees === null
    ? null
    : kp.agrees === false && knSynthetic.agrees === true,
  `KP agrees=${kp?.agrees} (want false); KN-synthetic agrees=${knSynthetic?.agrees} (want true)`
);

leg(
  'K2',
  'the key also separates on a REAL cell, not only on synthetic ones: Daedalus\'s grader prints RED and exits non-zero and is classified honest',
  kn === null || kn.agrees === null ? null : kn.agrees === true,
  `KN-real word=${kn?.word} status=${kn?.status} agrees=${kn?.agrees}`
);

leg(
  'K3',
  'the pre-repair blob of the subject is pinned by hash and still classified SILENT by the SOURCE key, so the historical defect stays anchored to a real artifact even after the live cell is cured',
  preSourceKey === null ? null : preSourceKey.silent === true,
  `preRepairRev=${PRE_REPAIR_REV.slice(0, 8)} silent=${preSourceKey?.silent} literal=${preSourceKey?.literal} derived=${preSourceKey?.derived}`
);

leg(
  'E1',
  'at least one cell in the declared set exits 0 while its own verdict line says RED or REFUSED — the defect this unit reports, measured by driving rather than by reading source',
  measured.length === 0 ? null : silentSet.length > 0,
  `silent=${silentSet.length} → ${silentSet.map((p) => p.split('/').pop()).join(', ') || '(none)'}`
);

leg(
  'E2',
  'the defect is a CLASS and not one instance: strictly more than one cell in the declared set is silent, so repairing only the cell that surfaced it would leave the mechanism live',
  measured.length === 0 ? null : silentSet.length > 1,
  `silent=${silentSet.length}`
);

leg(
  'E3',
  'the standing stop-condition cell — the one whose figure this seat quotes in COORDINATION every fire — is among the silent, which is why this is not a cosmetic finding',
  measured.length === 0
    ? null
    : silentSet.some((p) => p.includes('round464-instruments/grade-the-stop-condition')),
  `silent set contains the standing cell: ${silentSet.some((p) => p.includes('grade-the-stop-condition'))}`
);

leg(
  'S1',
  'the source scan OVER-reports relative to the drive: it has at least one false positive, which is why the legs above are keyed on the drive and the scan is published as a measurement only',
  sourceRows.some((r) => r.k === null) ? null : sourceFalsePositives.length > 0,
  `falsePositives=${sourceFalsePositives.length} → ${sourceFalsePositives.map((p) => p.split('/').pop()).join(', ') || '(none)'}; falseNegatives=${sourceFalseNegatives.length}`
);

leg(
  'S2',
  "zw-scan.mjs specifically is a source-key false positive — its gate IS live (`if (!ok) process.exit(1)`), so the memo sentence that called it a gate was right even though a source scan of exit arguments cannot see it",
  (() => {
    const d = driven.find((x) => x.rel.includes('zw-scan'));
    if (!d || d.agrees === null) return null;
    const s = sourceRows.find((x) => x.rel.includes('zw-scan'));
    if (!s || s.k === null) return null;
    return d.agrees === true && s.k.silent === true;
  })(),
  (() => {
    const d = driven.find((x) => x.rel.includes('zw-scan'));
    const s = sourceRows.find((x) => x.rel.includes('zw-scan'));
    return `drive says honest=${d?.agrees}; source says silent=${s?.k?.silent}`;
  })()
);

leg(
  'T1',
  'in every cell whose printed /N token disagrees with its exit status, the token is a LITERAL rather than an interpolation — so the repair is to derive the token from the same value, not to edit the number',
  tokenWrong.length === 0
    ? null
    : tokenWrong.every((d) => {
        const s = sourceRows.find((x) => x.rel === d.rel);
        return s && s.k !== null && s.k.literal && !s.k.derived;
      }),
  `tokenWrong=${tokenWrong.length} → ${tokenWrong.map((d) => `${d.rel.split('/').pop()}(token=${d.token},status=${d.status})`).join(', ') || '(none)'}`
);

leg(
  'M1',
  '[MEAS] the drive census, no assertion',
  `driven=${driven.length} measured=${measured.length} silentByDrive=${driveSilent.length} printedTokenWrong=${tokenWrong.length}`,
  driven.map((d) => `${d.rel.split('/').pop()}:${d.word}/${d.status}`).join(' ')
);

leg(
  'M2',
  '[MEAS] the SCOPE of the answer — how many verdict-printing research cells were NOT driven, so this reads as a bounded census and not as "every cell in the tree"',
  (() => {
    const tree = git(['ls-tree', '-r', '--name-only', REV]) ?? '';
    const all = tree
      .split('\n')
      .filter((p) => /^docs\/research\/.*\.(mjs|mts)$/.test(p))
      .filter((p) => p !== SELF);
    let printing = 0;
    for (const p of all) {
      const blob = git(['show', `${REV}:${p}`]);
      if (blob !== null && /VERDICT\//.test(blob)) printing++;
    }
    return `verdictPrintingCellsInTree=${printing} declaredDriveable=${DRIVEABLE.length} notDriven=${printing - DRIVEABLE.length}`;
  })(),
  'not driven because a blind sweep would spawn whatever a probe spawns; several open ports and databases'
);

leg(
  'M3',
  '[MEAS] the source scan against the drive, as a confusion matrix rather than a count',
  `sourceSilent=${sourceSilent.length} driveSilent=${driveSilent.length} fp=${sourceFalsePositives.length} fn=${sourceFalseNegatives.length}`,
  `fp: ${sourceFalsePositives.map((p) => p.split('/').pop()).join(',') || '(none)'} | fn: ${sourceFalseNegatives.map((p) => p.split('/').pop()).join(',') || '(none)'}`
);

leg(
  'M0',
  'the [MEAS] exclusion from the refusal set is keyed on a declared id list, and reddens if a declared MEAS leg carries a boolean or an undeclared leg calls itself [MEAS] — otherwise any leg could opt out of the verdict by editing its own first six characters',
  (() => {
    const declaredCarryingBool = MEAS_IDS.filter((id) => {
      const l = legs.find((x) => x.id === id);
      return l && typeof l.value === 'boolean';
    });
    const undeclaredSayingMeas = legs
      .filter((l) => /^\[MEAS\]/.test(l.text) && !MEAS_IDS.includes(l.id))
      .map((l) => l.id);
    return declaredCarryingBool.length === 0 && undeclaredSayingMeas.length === 0;
  })(),
  `MEAS_IDS=[${MEAS_IDS}]`
);

// ---------------------------------------------------------------------------
// PREDICTIONS — pre-registered before this cell's first drive.
// ---------------------------------------------------------------------------
const preds = [];
function predict(id, text, expected, fn) {
  let actual = null;
  try {
    actual = fn();
  } catch {
    actual = null;
  }
  preds.push({ id, text, expected, actual });
}

predict(
  'Q1',
  'exactly 2 cells in the declared set are silent by the drive key: grade-the-credit-key.mjs and round464-instruments/grade-the-stop-condition.mjs. Stated as a prediction because the only two I have READ are those two, and the recons may well be a third and fourth',
  2,
  () => (measured.length === 0 ? null : driveSilent.length)
);

predict(
  'Q2',
  "Daedalus's two cells are both honest, so the convention is not shared and the defect is this seat's alone",
  true,
  () => {
    const his = driven.filter((d) => d.rel.includes('keychoice'));
    if (!his.length || his.some((d) => d.agrees === null)) return null;
    return his.every((d) => d.agrees === true);
  }
);

predict(
  'Q3',
  'the printed /N token is wrong in strictly MORE cells than the exit status is, because a cell can gate correctly (zw-scan) while still printing a literal token',
  true,
  () => (measured.length === 0 ? null : tokenWrong.length > driveSilent.length)
);

// ---------------------------------------------------------------------------
// VERDICT
// ---------------------------------------------------------------------------
const red = legs.filter((l) => l.value === false).map((l) => l.id);
const refused = legs.filter((l) => l.value === null && !MEAS_IDS.includes(l.id)).map((l) => l.id);
const refuted = preds.filter((p) => p.actual !== null && p.actual !== p.expected).map((p) => p.id);
const prefused = preds.filter((p) => p.actual === null).map((p) => p.id);

console.log('--- LEGS ---');
for (const l of legs) {
  const v = MEAS_IDS.includes(l.id) ? 'MEAS' : l.value === null ? 'REF ' : l.value ? ' ok ' : 'RED ';
  console.log(`${v} ${l.id}: ${l.text}`);
  console.log(`      detail: ${typeof l.value === 'string' ? l.value : l.detail}`);
  if (typeof l.value === 'string' && l.detail) console.log(`      also  : ${l.detail}`);
}
console.log('\n--- PREDICTIONS ---');
for (const p of preds) {
  const v = p.actual === null ? 'PREF' : p.actual === p.expected ? 'LAND' : 'REFU';
  console.log(`${v} ${p.id}: ${p.text}`);
  console.log(`      expected=${JSON.stringify(p.expected)} actual=${JSON.stringify(p.actual)}`);
}

const status = red.length > 0 ? 'RED' : refused.length > 0 ? 'REFUSED' : 'ok';
const code = red.length > 0 || refused.length > 0 ? 1 : 0;
console.log(
  `\nVERDICT/${code} ${status} legs=${legs.length} red=[${red}] refused=[${refused}] preds=${preds.length} refuted=[${refuted}] prefused=[${prefused}]`
);
process.exit(code);
