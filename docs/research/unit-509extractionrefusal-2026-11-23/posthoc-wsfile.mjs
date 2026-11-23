#!/usr/bin/env node
/**
 * unit-509extractionrefusal — POST-HOC, **not pre-registered**, and the reason it exists is in
 * P5.b's own detail line: the reach figure I registered as housekeeping came back **19 of 7458
 * live tracked paths carry whitespace**, and `git ls-files` returned every one of them
 * **quoted and C-escaped** (`"QA/Screenshot … 11.12.38\342\200\257AM.png"`).
 *
 * The gate reads its own population the same way (`verify-decl-body-slicers.mjs:121`,
 * `git ls-files` with no `-z` and no `core.quotePath=false`, then `.trim()`), and filters it at
 * line 220 with `!EXTS.has(extname(rel))`. For a quoted path `extname` returns `.mjs"` — the
 * closing quote is part of the basename — so the entry does not match any code extension and is
 * skipped. **A tracked code file whose path contains whitespace is not in requirement 1's
 * population at all**, which is a different and larger claim than anything in the registered arm:
 * the arm grades a reader Daedalus specified, this grades the gate that is live.
 *
 * Declared as post-hoc because it was not registered. Had it been, it would have read: *a new
 * hand-rolled unguarded brace-balance slicer in a whitespace-named file does not redden, while the
 * byte-identical file with no whitespace in its name does.* Three legs, one synthetic repository:
 *
 *   W-SPACE   tracked `src/a b.mjs`, naive slicer, NO marker, empty baseline   → ?
 *   W-CTRL    tracked `src/ab.mjs`, byte-identical content, empty baseline     → RED expected
 *   W-CENSUS  the live tree: which tracked paths git quotes, and of those, how many carry a
 *             code extension the gate would otherwise read
 *
 * Also repairs two things the registered arm got wrong about itself, both measured here:
 *   A1  `containment` in the arm carries TWO mechanisms (his over-reporting extraction AND the
 *       strict line model's refusal), so the arm's separation row cannot attribute which defect
 *       separation caught. `containmentLazy` — lazy line model, containment extraction — isolates
 *       the over-report, and is the shape under which his 4-of-4 figure can be reproduced here.
 *   A2  P2.b was mis-specified: it was refuted because the CURE captures the whitespace path
 *       correctly. The true form is the strict-only one, graded below.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { resolve, join, extname } from 'node:path';

const UNIT = import.meta.dirname;
const ROOT = resolve(UNIT, '../../..');
const GATE_REL = 'scripts/verify-decl-body-slicers.mjs';
const BASE_REL = 'scripts/decl-body-slicers.baseline';
const SYN = join(UNIT, 'scratch', 'syn2');
const CAP = join(UNIT, 'captures');

const sha = (b) => createHash('sha256').update(b).digest('hex');
const must = (cond, msg) => { if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`); };
const git = (cwd, args) => spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
const esc = (s) => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/[{}]/g, '\\$&');

const Q = String.fromCharCode(39);
const OPEN = String.fromCharCode(123);
const CLOSE = String.fromCharCode(125);
const ch = (c) => `${Q}${c}${Q}`;

/** A population member that is UNGUARDED: both braces compared, no paren or colon comparison. */
const naiveSlicer = [
  '// unit-509 post-hoc fixture, nothing declared at this site',
  'export function depth(s) {',
  '  let d = 0;',
  '  for (const k of s) {',
  `    if (k === ${ch(OPEN)}) d += 1;`,
  `    if (k === ${ch(CLOSE)}) d -= 1;`,
  '  }',
  '  return d;',
  '}',
  '',
].join('\n');

const gateBytes = readFileSync(join(ROOT, GATE_REL));
const gateSha = sha(gateBytes);
const gateSrc = gateBytes.toString('utf8');

/** The gate's own extension set, sliced rather than typed. */
const EXT_ANCHOR = 'const EXTS = new Set([';
const extAt = gateSrc.indexOf(EXT_ANCHOR);
must(extAt !== -1, `extension anchor not found: ${EXT_ANCHOR}`);
const extLit = gateSrc.slice(extAt + EXT_ANCHOR.length, gateSrc.indexOf(']', extAt));
const EXTS = new Set(extLit.split(',').map((s) => s.trim().replace(new RegExp(Q, 'g'), '')).filter(Boolean));
must(EXTS.size >= 5, `sliced extension set looks wrong: ${JSON.stringify([...EXTS])}`);

/** The gate's own tracked-tree reader, sliced by anchor and re-executed here verbatim in shape. */
const LS_ANCHOR = "execFileSync('git', ['-C', ROOT, 'ls-files']";
must(gateSrc.includes(LS_ANCHOR), `the gate no longer lists tracked files the way this post-hoc assumes: ${LS_ANCHOR}`);
const FILTER_ANCHOR = '!EXTS.has(extname(rel))';
must(gateSrc.includes(FILTER_ANCHOR), `the gate no longer filters by extension the way this post-hoc assumes`);

function buildRepo() {
  rmSync(SYN, { recursive: true, force: true });
  mkdirSync(join(SYN, 'scripts'), { recursive: true });
  mkdirSync(join(SYN, 'src'), { recursive: true });
  must(git(ROOT, ['check-ignore', '-q', SYN]).status === 0, `scratch path is NOT gitignored: ${SYN}`);
  cpSync(join(ROOT, GATE_REL), join(SYN, GATE_REL));
  cpSync(join(ROOT, 'scripts', 'lib'), join(SYN, 'scripts', 'lib'), { recursive: true });
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, 'gate copy is not byte-identical');
  must(git(SYN, ['init', '-q']).status === 0, 'git init failed');
  git(SYN, ['config', 'user.email', 'theseus@local']);
  git(SYN, ['config', 'user.name', 'unit-509 post-hoc']);
  writeFileSync(join(SYN, BASE_REL), '# unit-509 post-hoc: deliberately empty baseline\n');
}

/** Added after H1 was refuted: git's quoting trigger is NON-ASCII, not whitespace. */
const NON_ASCII = `src/a${String.fromCharCode(0xe4)}.mjs`;

function leg(name, rel) {
  for (const p of ['src/a b.mjs', 'src/ab.mjs', NON_ASCII]) {
    git(SYN, ['rm', '--cached', '-q', '--', p]);
    rmSync(join(SYN, p), { force: true });
  }
  writeFileSync(join(SYN, rel), naiveSlicer);
  must(git(SYN, ['add', '-f', '--', rel]).status === 0, `git add failed for ${rel}`);
  const lsRaw = git(SYN, ['ls-files']).stdout.split('\n').filter(Boolean);
  must(sha(readFileSync(join(SYN, GATE_REL))) === gateSha, `gate copy drifted before ${name}`);
  const r = spawnSync(process.execPath, [join(SYN, GATE_REL)], { cwd: SYN, maxBuffer: 1 << 26 });
  writeFileSync(join(CAP, `${name}.out`), r.stdout);
  writeFileSync(join(CAP, `${name}.err`), r.stderr);
  const outText = r.stdout.toString('utf8');
  const pop = outText.match(/population \(compares against both braces\):\s*(\d+)/);
  const unguardedRow = outText.match(new RegExp(`UNGUARDED\\s+(\\d+)`));
  return {
    rel,
    lsRaw,
    lsQuoted: lsRaw.some((l) => l.startsWith('"')),
    gateSeesExt: lsRaw.map((l) => extname(l)),
    extAccepted: lsRaw.map((l) => EXTS.has(extname(l))),
    rc: r.status,
    trackedRead: Number((outText.match(/tracked files read:\s*(\d+)/) || [])[1] ?? -1),
    population: pop ? Number(pop[1]) : null,
    unguarded: unguardedRow ? Number(unguardedRow[1]) : null,
    newRed: /new hand-rolled brace-balance body slicer/.test(r.stderr.toString('utf8')),
    ok: /DECL-BODY SLICERS OK/.test(outText),
  };
}

const L = {};
try {
  buildRepo();
  L['W-SPACE'] = leg('W-SPACE', 'src/a b.mjs');
  L['W-CTRL'] = leg('W-CTRL', 'src/ab.mjs');
  L['W-NONASCII'] = leg('W-NONASCII', NON_ASCII);
} finally {
  rmSync(join(UNIT, 'scratch'), { recursive: true, force: true });
}

/* ------------------------------------------------------------------ W-CENSUS, the live tree */
const readAt = spawnSync('date', ['+%Y-%m-%d %H:%M:%S %Z'], { encoding: 'utf8' }).stdout.trim();
const liveTracked = git(ROOT, ['ls-files']).stdout.split('\n').map((l) => l.trim()).filter(Boolean);
const quoted = liveTracked.filter((l) => l.startsWith('"'));
const unquote = (l) => (l.startsWith('"') && l.endsWith('"') ? l.slice(1, -1) : l);
const quotedCode = quoted.filter((l) => EXTS.has(extname(unquote(l))));
const quotedSkipped = quoted.filter((l) => !EXTS.has(extname(l)));

/* ----------------------------------------------------------------------- A1 / A2 repairs */
const armJson = JSON.parse(readFileSync(join(CAP, 'P1-P5-arm.json'), 'utf8'));
const VOCAB = armJson.vocabulary;
const ARROW = armJson.emitter.arrow;
const TAIL = armJson.emitter.tail;
const RE_STRICT = new RegExp(armJson.readers.strict);
const RE_LAZY = new RegExp(armJson.readers.lazy);
const CELLS = Object.keys(armJson.cells);
const pair = (p, v) => `${p}\t${v}`;
const asSet = (ps) => [...new Set(ps)].sort();
const readStrictPaths = (text) => text.split('\n').map((l) => l.match(RE_STRICT)).filter(Boolean).map((m) => m[1]);
function containmentOn(text, re) {
  const pairs = [];
  let lineCount = 0;
  for (const line of text.split('\n')) {
    const m = line.match(re);
    if (!m) continue;
    lineCount += 1;
    for (const v of VOCAB) if (line.includes(v)) pairs.push(pair(m[1], v));
  }
  return { pairs, lineCount };
}
const errOf = (c) => readFileSync(join(CAP, `${c}.err`), 'utf8');
const coLazy = Object.fromEntries(CELLS.map((c) => [c, containmentOn(errOf(c), RE_LAZY)]));
const truthOf = (c) => asSet(armJson.cells[c].truth);
const sepCoLazy = new Set(CELLS.map((c) => JSON.stringify(asSet(coLazy[c].pairs)))).size;
const sepLazy = new Set(CELLS.map((c) => JSON.stringify(asSet(armJson.cells[c].readers.lazy.pairs)))).size;
const strictPathsWs = Object.fromEntries(CELLS.map((c) =>
  [c, readStrictPaths(errOf(c)).filter((p) => /\s/.test(p)).length]));

const G = [];
const grade = (id, claim, pass, detail) => { G.push({ id, claim, verdict: pass ? 'HIT' : 'REFUTED', detail }); };

grade('H1', 'git quotes the whitespace path in the synthetic repo, and `extname` of the quoted form is NOT a code extension',
  L['W-SPACE'].lsQuoted === true && L['W-SPACE'].extAccepted.every((b) => b === false),
  `${JSON.stringify(L['W-SPACE'].lsRaw)} → extname ${JSON.stringify(L['W-SPACE'].gateSeesExt)}`);
grade('H2', 'a NEW hand-rolled unguarded brace slicer in a whitespace-named file does NOT redden the gate',
  L['W-SPACE'].ok === true && L['W-SPACE'].newRed === false && L['W-SPACE'].rc === 0,
  `rc ${L['W-SPACE'].rc} · OK ${L['W-SPACE'].ok} · population ${L['W-SPACE'].population}`
  + ` · tracked read ${L['W-SPACE'].trackedRead}`);
grade('H3', 'CONTROL: the byte-identical file with no whitespace in its name DOES redden',
  L['W-CTRL'].newRed === true && L['W-CTRL'].rc === 1 && L['W-CTRL'].population === 1,
  `rc ${L['W-CTRL'].rc} · new-slicer red ${L['W-CTRL'].newRed} · population ${L['W-CTRL'].population}`);
grade('H4', 'the two legs differ ONLY in the filename, so the blindness is the quoting and nothing else',
  L['W-SPACE'].population === 0 && L['W-CTRL'].population === 1
  && L['W-SPACE'].trackedRead === L['W-CTRL'].trackedRead,
  `population ${L['W-SPACE'].population} vs ${L['W-CTRL'].population}`
  + ` · tracked read ${L['W-SPACE'].trackedRead} vs ${L['W-CTRL'].trackedRead}`);
grade('H5', 'LIVE REACH: tracked paths git quotes, and how many carry a code extension today',
  true, `${quoted.length} quoted of ${liveTracked.length} tracked at ${readAt}`
  + ` · code-extension (unquoted) ${quotedCode.length}`
  + ` · skipped by the gate's own filter ${quotedSkipped.length}`);
grade('A1', 'containment on the LAZY line model isolates the over-report, and separation is GREEN on it',
  CELLS.every((c) => (c === 'T-COLLIDE'
    ? coLazy[c].pairs.length > coLazy[c].lineCount
    : coLazy[c].pairs.length === coLazy[c].lineCount))
  && sepCoLazy === sepLazy && sepCoLazy === 4,
  `pairs/lines ${JSON.stringify(Object.fromEntries(CELLS.map((c) =>
    [c, `${coLazy[c].pairs.length}/${coLazy[c].lineCount}`])))}`
  + ` · separation containmentLazy ${sepCoLazy} of 4, lazy ${sepLazy} of 4`);
grade('A1.truth', 'containmentLazy is still wrong where it matters: truth reddens it on T-COLLIDE only',
  JSON.stringify(asSet(coLazy['T-COLLIDE'].pairs)) !== JSON.stringify(truthOf('T-COLLIDE'))
  && CELLS.filter((c) => c !== 'T-COLLIDE')
    .every((c) => JSON.stringify(asSet(coLazy[c].pairs)) === JSON.stringify(truthOf(c))),
  JSON.stringify(Object.fromEntries(CELLS.map((c) =>
    [c, JSON.stringify(asSet(coLazy[c].pairs)) === JSON.stringify(truthOf(c))]))));
grade('A2', 'P2.b in its TRUE form: no STRICT-captured path contains whitespace, on any cell',
  Object.values(strictPathsWs).every((n) => n === 0), JSON.stringify(strictPathsWs));

/* -------------------------------------------------------------------------------------------
 * ADDED AFTER H1/H2/H4 AND A1 WERE REFUTED. The refuted grades above are left exactly as they
 * were driven; these follow their refutations rather than replacing them.
 *   H1 was wrong about the MECHANISM: git's quoting trigger is NON-ASCII, not whitespace. The
 *   gate therefore reddens a space-named file correctly (H2/H4 refuted, and the gate is FINE
 *   there). H6–H8 drive the KP H1's refutation actually points at.
 *   A1 was wrong about WHERE: `T-EMBED`'s path carries a vocabulary token too, by construction,
 *   so it is a SECOND over-report cell — which the strict model's refusal had concealed.
 * ----------------------------------------------------------------------------------------- */
const N = L['W-NONASCII'];
grade('H6', 'git QUOTES a non-ASCII tracked path, and `extname` of the quoted form is NOT a code extension',
  N.lsQuoted === true && N.extAccepted.every((b) => b === false),
  `${JSON.stringify(N.lsRaw)} → extname ${JSON.stringify(N.gateSeesExt)} accepted ${JSON.stringify(N.extAccepted)}`);
grade('H7', 'a NEW hand-rolled unguarded brace slicer in a NON-ASCII-named file does NOT redden the gate',
  N.ok === true && N.newRed === false && N.rc === 0 && N.population === 0,
  `rc ${N.rc} · OK ${N.ok} · population ${N.population} · tracked read ${N.trackedRead}`);
grade('H8', 'the W-CTRL control differs from W-NONASCII ONLY in the filename, so the quoting is the whole mechanism',
  L['W-CTRL'].newRed === true && N.newRed === false
  && N.trackedRead === L['W-CTRL'].trackedRead,
  `new-slicer RED ${L['W-CTRL'].newRed} vs ${N.newRed} · tracked read`
  + ` ${L['W-CTRL'].trackedRead} vs ${N.trackedRead} · population ${L['W-CTRL'].population} vs ${N.population}`);
grade('A1.sep', 'A1 in its surviving half: separation is GREEN on PURE over-reporting — his P2.d figure, reproduced here',
  sepCoLazy === sepLazy && sepCoLazy === 4, `containmentLazy ${sepCoLazy} of 4 · lazy ${sepLazy} of 4`);
grade('A1.where', 'A1 corrected: containmentLazy over-reports on TWO cells, and the strict model\'s refusal concealed the second',
  coLazy['T-EMBED'].pairs.length > coLazy['T-EMBED'].lineCount
  && armJson.cells['T-EMBED'].readers.containment.count <= armJson.cells['T-EMBED'].renderedLines,
  `containmentLazy T-EMBED ${coLazy['T-EMBED'].pairs.length}/${coLazy['T-EMBED'].lineCount}`
  + ` · strict-model containment T-EMBED ${armJson.cells['T-EMBED'].readers.containment.count}`
  + `/${armJson.cells['T-EMBED'].renderedLines}`);

const hits = G.filter((g) => g.verdict === 'HIT').length;
const out = {
  unit: 'unit-509extractionrefusal',
  posthoc: true,
  readAt,
  gateSha,
  exts: [...EXTS],
  legs: L,
  liveCensus: {
    tracked: liveTracked.length,
    quoted: quoted.length,
    quotedCodeExtension: quotedCode.length,
    quotedSkippedByFilter: quotedSkipped.length,
    sample: quoted.slice(0, 3),
  },
  containmentLazy: Object.fromEntries(CELLS.map((c) =>
    [c, { pairs: asSet(coLazy[c].pairs), lineCount: coLazy[c].lineCount }])),
  separation: { containmentLazy: `${sepCoLazy} of 4`, lazy: `${sepLazy} of 4` },
  strictCapturedWhitespacePaths: strictPathsWs,
  grades: G,
  summary: `${hits} of ${G.length} HIT`,
};
writeFileSync(join(CAP, 'posthoc-wsfile.json'), `${JSON.stringify(out, null, 2)}\n`);

console.log(`unit-509 POST-HOC (not pre-registered) — read at ${readAt}`);
console.log(`gate sha ${gateSha.slice(0, 8)} · gate EXTS ${JSON.stringify([...EXTS])}\n`);
for (const [n, l] of Object.entries(L)) {
  console.log(`  ${n.padEnd(8)} ${JSON.stringify(l.rel).padEnd(16)} ls-files ${JSON.stringify(l.lsRaw[0])}`);
  console.log(`           extname ${JSON.stringify(l.gateSeesExt)} accepted ${JSON.stringify(l.extAccepted)}`);
  console.log(`           rc ${l.rc} · tracked read ${l.trackedRead} · population ${l.population}`
    + ` · UNGUARDED ${l.unguarded} · new-slicer RED ${l.newRed} · OK ${l.ok}`);
}
console.log(`\nLIVE: ${quoted.length} of ${liveTracked.length} tracked paths are quoted by git ls-files;`
  + ` ${quotedCode.length} carry a code extension once unquoted; ${quotedSkipped.length} are skipped`
  + ' by the gate\'s own extension filter.');
console.log('\nGRADES');
for (const g of G) console.log(`  ${g.verdict.padEnd(8)} ${g.id.padEnd(9)} ${g.claim}\n           ${g.detail}`);
console.log(`\n${out.summary}`);
if (hits !== G.length) process.exitCode = 1;
