#!/usr/bin/env node
// unit-464mysites — grader.
//
// Written AFTER PRE-REGISTRATION.md (4d63ff89), HAND-SITES-MINE.tsv (86ff05ac) and
// PRE-REGISTRATION-ADDENDUM.md (298bfe4e) were committed and pushed to main. The commit order is
// the evidence; `git log --diff-filter=A` over each path against this file's add-commit shows it.
//
// Every subject is read through `git cat-file` / `git ls-tree` / `git log` at a NAMED REV. Nothing
// is read from the worktree, and nothing is spawned — spawning a subject would grade this copy's
// tree rather than the subject's selection (my own declared defect 4 on P8R441, 11/04 WORK).
//
// Usage:
//   node grade-mysites.mjs
//   node grade-mysites.mjs --cripple=lineregex        (registered; see P1POS's note)
//   node grade-mysites.mjs --cripple=lengthmeansdetail
//   node grade-mysites.mjs --cripple=sitefromoutput

import { execFileSync } from 'node:child_process';

const CRIPPLE = (process.argv.find((a) => a.startsWith('--cripple=')) ?? '').split('=')[1] ?? null;

const PIN = '0ae48068';
const SUBJECT = 'docs/research/unit-464t2-population-2026-10-28/grade-the-round-population.mjs';
const TSV = 'docs/research/unit-464mysites-2026-11-04/HAND-SITES-MINE.tsv';
const TSV_REV = '86ff05ac'; // the TSV's own add-commit, per the commit log — not the worktree

// --- git, with stderr kept OUT of the recording (execFileSync echoes child stderr otherwise) ----
//
// DRIVE 1 DEFECT, recorded here rather than replaced. drive1.out is kept as the evidence. Driven
// from inside this unit directory instead of the repo root, every `ls-tree`/`log` PATHSPEC resolved
// relative to cwd, matched nothing, and `git` exited 0 with empty output — so P4ENTRIES printed
// `entries=0 trees=0 blobs=0` and went RED with a reason that reads like a measurement. It failed to
// ZERO, not to REFUSE, which is the worse of the two. Every call is now pinned with `-C <toplevel>`,
// and the figure legs refuse rather than report a zero they cannot distinguish from an empty tree.
// (Theseus flagged the same cwd-sensitivity in the v1.5 entry gate the same morning, from the other
// side: there it died with status 128, which is at least loud.)
const RAWGIT = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null; // REFUSAL. Never defaulted, never silently zero.
  }
};
const REPO = (RAWGIT(['rev-parse', '--show-toplevel']) ?? '').trim();
function git(args) {
  if (REPO === '') return null;
  return RAWGIT(['-C', REPO, ...args]);
}
const HEAD = (git(['rev-parse', 'HEAD']) ?? 'UNRESOLVED\n').trim();

// --- legs ------------------------------------------------------------------------------------
const legs = [];
function leg(id, kind, value, why, detail) { legs.push({ id, kind, value, why, detail }); }
function unrun(id, why, detail) { legs.push({ id, kind: 'UNRUN', value: null, why, detail }); }

console.log('=== unit-464mysites — grade-mysites.mjs ===');
console.log(`  cripple      : ${CRIPPLE ?? 'none (subject arm)'}`);
console.log(`  repo root    : ${REPO === '' ? 'UNRESOLVED' : REPO}   (every git call is pinned with -C; see the drive-1 note in source)`);
console.log(`  population pin: ${PIN}`);
console.log(`  live HEAD     : ${HEAD}`);
console.log(`  TSV rev       : ${TSV_REV}  (${TSV})`);
console.log('');

// =================================================================================================
// P1POS — an ARGUMENT-POSITION parser over leg(...) in the subject at the pin.
// =================================================================================================
// Split a call's argument list on TOP-LEVEL commas, string- and template-aware. A line regex
// cannot do this, which is the whole point of the leg.
function splitArgs(src, openParenIdx) {
  const args = [];
  let depth = 0, i = openParenIdx, start = openParenIdx + 1;
  let quote = null, tmplDepth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (quote === '`' && c === '$' && src[i + 1] === '{') { tmplDepth++; i++; continue; }
      if (quote === '`' && c === '}' && tmplDepth > 0) { tmplDepth--; continue; }
      if (c === quote && tmplDepth === 0) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '(' || c === '[' || c === '{') { depth++; continue; }
    if (c === ')' || c === ']' || c === '}') {
      depth--;
      if (depth === 0) { args.push(src.slice(start, i)); return { args, end: i }; }
      continue;
    }
    if (c === ',' && depth === 1) { args.push(src.slice(start, i)); start = i + 1; }
  }
  return null; // unbalanced — refuse rather than return a partial split
}

const subjSrc = git(['cat-file', '-p', `${PIN}:${SUBJECT}`]);
if (subjSrc === null) {
  unrun('P1POS', 'the subject did not resolve at the pin', `${PIN}:${SUBJECT}`);
} else {
  const lineOf = (idx) => subjSrc.slice(0, idx).split('\n').length;
  const g1Idx = subjSrc.indexOf("leg('G1'");
  const openIdx = g1Idx === -1 ? -1 : subjSrc.indexOf('(', g1Idx);
  const split = openIdx === -1 ? null : splitArgs(subjSrc, openIdx);

  if (split === null || split.args.length < 5) {
    unrun('P1POS', 'could not split G1 into at least five top-level arguments',
      `g1Idx=${g1Idx} args=${split === null ? 'REFUSED' : split.args.length}`);
  } else {
    const argOf = (needle) => {
      // Subject reader: argument POSITION.
      if (CRIPPLE === 'lengthmeansdetail' && needle.includes('.length')) return 5;
      if (CRIPPLE === 'lineregex') {
        // "classify by the line the token sits on": same line as `leg(` => predicate, else detail.
        const at = subjSrc.indexOf(needle, g1Idx);
        if (at === -1) return null;
        return lineOf(at) === lineOf(g1Idx) ? 3 : 5;
      }
      for (let k = 0; k < split.args.length; k++) if (split.args[k].includes(needle)) return k + 1;
      return null;
    };
    const posRowsLen = argOf('rows.length');
    const posRowsNull = argOf('rows !== null');
    const posCtl = argOf('dirsNow.length > 0');
    const lineRowsLen = lineOf(subjSrc.indexOf('rows.length', g1Idx));
    const lineG1 = lineOf(g1Idx);

    console.log('--- [MEAS] P1POS argument positions in G1 (1=id 2=kind 3=value/predicate 4=why 5=detail)');
    console.log(`  leg('G1' starts at line ${lineG1} @ ${PIN}; top-level args = ${split.args.length}`);
    console.log(`  rows.length          -> arg ${posRowsLen ?? 'NOT FOUND'}   (line ${lineRowsLen})`);
    console.log(`  rows !== null        -> arg ${posRowsNull ?? 'NOT FOUND'}`);
    console.log(`  dirsNow.length > 0   -> arg ${posCtl ?? 'NOT FOUND'}   [THE CONTROL]`);
    console.log('');

    leg('P1POS', 'GATE', posRowsLen === 5 && posRowsNull === 3,
      "§2.1k reproduces: rows.length is leg()'s DETAIL argument and G1's predicate over the selection is rows !== null",
      `rows.length=arg${posRowsLen ?? 'X'} rows!==null=arg${posRowsNull ?? 'X'} expected 5 and 3`);
    leg('P1CTL', 'CONTROL', posCtl === 3,
      'the control: dirsNow.length > 0 is in the PREDICATE, so the reader is not "every .length is a reason string"',
      `dirsNow.length>0=arg${posCtl ?? 'X'} expected 3`);
  }
}

// =================================================================================================
// P5F2LINE — one citation of his, checked rather than left unchecked.
// =================================================================================================
if (subjSrc !== null) {
  const idx = subjSrc.indexOf("leg('F2'");
  const line = idx === -1 ? null : subjSrc.slice(0, idx).split('\n').length;
  leg('P5F2LINE', 'MEAS', line === 320,
    "F2's line at the pin; his unit's pre-registration cites 321",
    `measured=${line ?? 'NOT FOUND'} registered=320 his=321`);
}

// =================================================================================================
// P2SYM — his §4 census, run on MY table. Read at the TSV's own add-commit.
// =================================================================================================
const tsvSrc = git(['cat-file', '-p', `${TSV_REV}:${TSV}`]);
if (tsvSrc === null) {
  unrun('P2SYM', 'the hand table did not resolve at its own add-commit', `${TSV_REV}:${TSV}`);
} else {
  const all = tsvSrc.split('\n').filter((l) => l.trim().length > 0 && !l.startsWith('#'));
  // Drop the uncommented column header BY NAME. (Theseus's defect 3 this morning: a leg that
  // conjoins a parsing slip with its registered claim cannot say which reddened it.)
  const rows = all.filter((l) => !l.startsWith('site\tclass\t'));
  const dropped = all.length - rows.length;
  const parsed = rows.map((l) => {
    const f = l.split('\t');
    return { site: f[0], cls: f[1], names: f[2], kind: f[3], from: f[4] };
  });

  leg('P2ROWS', 'GATE', parsed.length === 20,
    'the hand table parses to exactly 20 data rows, header dropped by name',
    `rows=${parsed.length} headerLinesDropped=${dropped}`);

  const tab = {};
  for (const r of parsed) {
    tab[r.cls] ??= { yes: 0, no: 0 };
    if (r.names === 'yes') tab[r.cls].yes++; else if (r.names === 'no') tab[r.cls].no++;
  }
  const froms = {};
  for (const r of parsed) froms[r.from] = (froms[r.from] ?? 0) + 1;

  console.log(`--- [MEAS] P2SYM my own 20 reason lines, read at ${TSV_REV}`);
  console.log('              names a consumption site');
  console.log('    class        yes   no  total');
  for (const c of ['R', 'A', 'O']) {
    const t = tab[c] ?? { yes: 0, no: 0 };
    console.log(`    ${c}${' '.repeat(12)}${String(t.yes).padStart(3)}${String(t.no).padStart(5)}${String(t.yes + t.no).padStart(7)}`);
  }
  console.log(`    argues_from: ${Object.entries(froms).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  console.log('');

  const A = tab.A ?? { yes: 0, no: 0 };
  const R = tab.R ?? { yes: 0, no: 0 };
  // SEPARATE legs: a leg red for two reasons cannot say which.
  leg('P2SYMA', 'MEAS', A.no >= 5,
    "the ceiling his §4 established over HIS 8 also holds over MY 7: A rows naming no consumption site",
    `A no-site=${A.no} of ${A.yes + A.no}  floor>=5`);
  leg('P2SYMR', 'MEAS', R.yes >= 8,
    'my R rows naming a consumption site',
    `R site-naming=${R.yes} of ${R.yes + R.no}  floor>=8`);
  leg('P2NOA', 'MEAS', A.yes === 0,
    'the structural claim we agree on, measured on my table rather than carried from his: NO A row names a site',
    `A yes=${A.yes} (his: 0 of 8)`);
}

// =================================================================================================
// P3REACH / P3RESOLVE / P6SHAPE / P7PARAM — the differential, and its reachability guard.
// =================================================================================================
const SEVEN = [
  { shape: 'A', file: 'round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs',
    sig: ["'--diff-filter=A'", "'--format=%h'"] },
  { shape: 'B', file: 'round464-instruments/grade-the-stop-condition.mjs', sig: ["'--reverse'", "'--diff-filter=A'"] },
  { shape: 'B', file: 'unit-464t2-keychoice-2026-10-28/grade-the-surface-predicate.mjs', sig: ["'--reverse'", "'--diff-filter=A'"] },
  { shape: 'B', file: 'unit-464t2-reaim-2026-10-28/grade-the-credit-key.mjs', sig: ["'--reverse'", "'--diff-filter=A'"] },
  { shape: 'B', file: 'unit-464t2-reaim-2026-10-28/recon-credit-provenance.mjs', sig: ["'--reverse'", "'--diff-filter=A'"] },
  { shape: 'B', file: 'unit-464t2-surface-2026-10-28/recon-run-length-and-cure.mjs', sig: ["'--reverse'", "'--diff-filter=A'"] },
  { shape: 'C', file: 'unit-464vac-2026-10-31/grade-cure.mjs', sig: ['..HEAD', "'--reverse'"] },
];

// P3RESOLVE: all seven resolve at the pin, and each one's source actually carries its shape's
// signature — so the shape assignment is matched against source, not taken from my own prose.
const resolved = [];
for (const s of SEVEN) {
  const src = git(['cat-file', '-p', `${PIN}:docs/research/${s.file}`]);
  const ok = src !== null && s.sig.every((t) => src.includes(t));
  resolved.push({ ...s, resolves: src !== null, sigOk: ok });
}
const nResolve = resolved.filter((r) => r.resolves && r.sigOk).length;
console.log('--- [MEAS] P3RESOLVE / P6SHAPE');
for (const r of resolved) {
  console.log(`  shape ${r.shape}  resolves=${r.resolves}  sig=${r.sigOk}  ${r.file}`);
}
const shapeCounts = {};
for (const r of resolved) shapeCounts[r.shape] = (shapeCounts[r.shape] ?? 0) + 1;
console.log(`  distinct shapes = ${Object.keys(shapeCounts).length} · ${Object.entries(shapeCounts).map(([k, v]) => `${k}:${v}`).join(' ')}`);
console.log('');

leg('P3RESOLVE', 'GATE', nResolve === 7,
  'all seven FP-ONLY files resolve at the pin AND carry their shape signature in their own source',
  `resolved+sig=${nResolve} of 7`);
leg('P6SHAPE', 'MEAS', Object.keys(shapeCounts).length === 3 && (shapeCounts.B ?? 0) === 5,
  'FP-ONLY 7 is carried by three selection shapes, one of which carries five — a count of files, not of independent judgements',
  `shapes=${JSON.stringify(shapeCounts)} registered=3 shapes with B=5`);

// --- the three shapes, re-implemented from source. Nothing is spawned. ---------------------------
const SEP = '\u0001';
function shapeB(rev, round) {
  const raw = git(['log', '--diff-filter=A', '--reverse', `--format=%H${SEP}%an`, rev, '--',
    `docs/research/round${round}-instruments/`]);
  if (raw === null) return null;
  const out = raw.split('\n').filter((l) => l.trim().length > 0);
  const site = out.find((l) => l.trim().length > 0) ?? null;
  return { out, site };
}
function shapeA(rev) {
  const raw = git(['log', '--format=%h', '--diff-filter=A', rev, '--',
    'docs/research/round434-instruments/grade-the-two-cures-and-the-prose.mjs']);
  if (raw === null) return null;
  const out = raw.trim().split('\n').filter(Boolean);
  return { out, site: out[0] ?? null };
}
const BASE_REV = 'e6460abafaed4cf9e7c0eb4c0320c06d2cee233e';
const LIVE_REL = 'docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs';
function shapeC(rev) {
  const raw = git(['log', '--format=%H', '--reverse', `${BASE_REV}..${rev}`, '--', LIVE_REL]);
  if (raw === null) return null;
  const out = raw.trim().split('\n').filter(Boolean);
  const first = out[0] ?? null;
  const site = first === null ? null : ((git(['rev-parse', `${first}^`]) ?? '').trim() || null);
  return { out, site };
}
// The cripple that collapses the distinction P3REACH rests on.
const siteOf = (r) => (r === null ? null : (CRIPPLE === 'sitefromoutput' ? JSON.stringify(r.out) : r.site));
const outOf = (r) => (r === null ? null : JSON.stringify(r.out));

// Rounds present at the pin, for shape B's parameter.
const lsRounds = git(['ls-tree', '--name-only', PIN, 'docs/research/']);
const roundNs = (lsRounds ?? '').split('\n')
  .map((p) => p.replace(/\/$/, '').split('/').pop() ?? '')
  .map((n) => (/^round(\d+)-instruments$/.exec(n) ?? [, null])[1])
  .filter((n) => n !== null);

// P7PARAM — the reachability guard. Without a moved output the whole shape's non-move is vacuous.
let bOutMoved = 0, bSiteMoved = 0, bUnrun = 0;
const bMovedList = [];
for (const n of roundNs) {
  const a = shapeB(PIN, n), b = shapeB(HEAD, n);
  if (a === null || b === null) { bUnrun++; continue; }
  const om = outOf(a) !== outOf(b);
  const sm = siteOf(a) !== siteOf(b);
  if (om) { bOutMoved++; bMovedList.push(n); }
  if (sm) bSiteMoved++;
}
console.log(`--- [MEAS] P7PARAM shape B over every round*-instruments dir at ${PIN} -> ${HEAD}`);
console.log(`  instantiations=${roundNs.length}  unrun=${bUnrun}`);
console.log(`  selection OUTPUT moved : ${bOutMoved}${bMovedList.length ? `  (rounds ${bMovedList.join(',')})` : ''}`);
console.log(`  consumed SITE moved    : ${bSiteMoved}`);
console.log('');
leg('P7OUT', 'GATE', bOutMoved >= 1,
  'REACHABILITY: the interval actually touched the selected paths, so a shape-B non-move is not vacuous',
  `outputMoved=${bOutMoved} of ${roundNs.length} floor>=1`);
leg('P7SITE', 'MEAS', bSiteMoved === 0,
  'and the consumed site did not move at any instantiation',
  `siteMoved=${bSiteMoved} of ${roundNs.length} registered=0`);

// P3REACH — per file.
const rows = [];
for (const s of resolved) {
  if (!s.resolves || !s.sigOk) { rows.push({ ...s, verdict: 'UNRUN', note: 'did not resolve / signature absent' }); continue; }
  if (s.shape === 'A') {
    const a = shapeA(PIN), b = shapeA(HEAD);
    if (a === null || b === null) { rows.push({ ...s, verdict: 'UNRUN', note: 'selection refused' }); continue; }
    rows.push({ ...s, outMoved: outOf(a) !== outOf(b), siteMoved: siteOf(a) !== siteOf(b), k: 1, n: 1 });
  } else if (s.shape === 'C') {
    const a = shapeC(PIN), b = shapeC(HEAD);
    if (a === null || b === null) { rows.push({ ...s, verdict: 'UNRUN', note: 'selection refused' }); continue; }
    rows.push({ ...s, outMoved: outOf(a) !== outOf(b), siteMoved: siteOf(a) !== siteOf(b), k: 1, n: 1 });
  } else {
    rows.push({ ...s, outMoved: bOutMoved >= 1, siteMoved: bSiteMoved > 0, k: bOutMoved, n: roundNs.length });
  }
}
console.log(`--- [MEAS] P3REACH per file, ${PIN} -> ${HEAD}`);
console.log('  shape  outputMoved  siteMoved  instantiations  file');
for (const r of rows) {
  if (r.verdict === 'UNRUN') { console.log(`  ${r.shape}      UNRUN (${r.note})  ${r.file}`); continue; }
  console.log(`  ${r.shape}      ${String(r.outMoved).padEnd(11)}  ${String(r.siteMoved).padEnd(9)}  ${r.k}/${r.n}${' '.repeat(14 - String(`${r.k}/${r.n}`).length)}  ${r.file}`);
}
const graded = rows.filter((r) => r.verdict !== 'UNRUN');
const reached = graded.filter((r) => r.outMoved === true && r.siteMoved === false);
console.log(`  REACHED NON-MOVE (output moved AND site stable): ${reached.length} of ${graded.length} graded (${rows.length - graded.length} UNRUN, dropped from BOTH numerator and denominator)`);
console.log('');
leg('P3REACH', 'MEAS', reached.length >= 3,
  'files whose selection output demonstrably MOVED while the consumed site did not — a REACHED non-move, which is not the case §2.1k\'s reachability objection covers',
  `reached=${reached.length} of ${graded.length} graded  floor>=3  unrun=${rows.length - graded.length}`);

// =================================================================================================
// P4LABEL — his §3's correction of a label I published, reproduced rather than accepted.
// =================================================================================================
const lsRaw = git(['ls-tree', PIN, 'docs/research/']);
if (lsRaw === null) {
  unrun('P4LABEL', 'ls-tree of docs/research/ refused at the pin', PIN);
} else {
  const entries = lsRaw.split('\n').filter((l) => l.trim().length > 0).map((l) => {
    const m = /^\d+ (\w+) [0-9a-f]+\t(.+)$/.exec(l);
    return m === null ? null : { type: m[1], name: (m[2].replace(/\/$/, '').split('/').pop() ?? '') };
  }).filter(Boolean);
  const trees = entries.filter((e) => e.type === 'tree').length;
  const blobs = entries.filter((e) => e.type === 'blob').length;
  if (entries.length === 0) {
    // An empty listing is NOT a measurement of zero: `ls-tree` with a pathspec that matches
    // nothing exits 0 and prints nothing. Refuse. (drive1's defect, fixed at the source.)
    unrun('P4ENTRIES', 'ls-tree returned an EMPTY listing — refused rather than reported as zero',
      `rev=${PIN} repo=${REPO || 'UNRESOLVED'}`);
    unrun('P4DIFF', 'not graded: the entry listing refused', `rev=${PIN}`);
  } else {
  console.log(`--- [MEAS] P4LABEL first-level entries under docs/research/ @ ${PIN}`);
  console.log(`  entries=${entries.length}  trees=${trees}  blobs=${blobs}   (my published label said "408 directories"; registered 408/136/272)`);

  // The two population keys, as a SET DIFFERENCE over .mjs files — not retyped from his memo.
  const allFiles = (git(['ls-tree', '-r', '--name-only', PIN, 'docs/research/']) ?? '')
    .split('\n').filter((l) => l.endsWith('.mjs'));
  const firstLevel = (p) => p.split('/')[2] ?? '';
  const hisKey = new Set(allFiles.filter((p) => /^round\d+-instruments$/.test(firstLevel(p))));
  const myKey = new Set(allFiles.filter((p) => /^round/.test(firstLevel(p))));
  const diff = [...myKey].filter((p) => !hisKey.has(p)).concat([...hisKey].filter((p) => !myKey.has(p)));
  console.log(`  .mjs under his key /^round\\d+-instruments$/ : ${hisKey.size}   (his §3: 191)`);
  console.log(`  .mjs under my key  /^round/                  : ${myKey.size}   (his §3: 195)`);
  console.log(`  symmetric difference (${diff.length} members):`);
  for (const p of diff.sort()) console.log(`    ${p}`);
  const hisDirs = new Set(entries.filter((e) => e.type === 'tree' && /^round\d+-instruments$/.test(e.name)).map((e) => e.name));
  console.log(`  dirs under his key: ${hisDirs.size}   (his §3: 91)`);
  console.log('');

  leg('P4ENTRIES', 'MEAS', entries.length === 408 && trees === 136 && blobs === 272,
    'his correction of my "408 directories" label reproduces: 408 first-level ENTRIES = 136 trees + 272 blobs',
    `entries=${entries.length} trees=${trees} blobs=${blobs} registered=408/136/272`);
  leg('P4DIFF', 'MEAS', diff.length === 4,
    'the 195-vs-191 gap is a member list of four, derived as a set difference between the two keys rather than retyped',
    `diff=${diff.length} his=191 mine=${myKey.size} registered=4`);
  }
}

// =================================================================================================
console.log('--- VERDICT ---');
let green = 0, red = 0, un = 0;
for (const l of legs) {
  const v = l.kind === 'UNRUN' || l.value === null ? 'UNRUN' : (l.value ? 'GREEN' : 'RED');
  if (v === 'GREEN') green++; else if (v === 'RED') red++; else un++;
  console.log(`  ${v.padEnd(5)} ${l.id.padEnd(10)} ${l.kind.padEnd(8)} ${l.why}`);
  console.log(`        ${l.detail}`);
}
console.log('');
console.log(`VERDICT ${legs.length} legs · ${green} GREEN · ${red} RED · ${un} UNRUN   cripple=${CRIPPLE ?? 'none'}`);
