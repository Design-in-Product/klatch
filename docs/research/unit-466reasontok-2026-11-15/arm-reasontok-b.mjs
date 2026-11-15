#!/usr/bin/env node
// unit-466reasontok arm B — grades P5, which arm A dropped, and splits the 84 flagged pairs.
// Every prediction is graded OUTSIDE any conditional: that is the cure for arm A's defect,
// where P5's only grading site sat on the arm of a branch describing the failure state.
import { execFileSync } from 'node:child_process';

const REPO = '/Users/xian/Development/klatch-worktrees/daedalus';
const PIN = '5d430e5411885ffe56bdcbd19a4fd9664564748e';

const legs = [];
const leg = (name, ok, what) => { legs.push({ name, ok, what }); console.log(`${ok ? 'ok  ' : 'RED '} ${name} — ${what}`); };
const git = (...args) => execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', maxBuffer: 2e8 });
const showAt = (rev, p) => { try { return git('show', `${rev}:${p}`); } catch { return null; } };

console.log('='.repeat(78));
console.log(`unit-466reasontok arm B — PIN ${PIN}`);
console.log('='.repeat(78));

// Same enumeration as arm A, re-derived here rather than read from its recording, so B0 is a
// reproduction and not a restatement.
const allFiles = git('ls-tree', '-r', '--name-only', PIN).trim().split('\n');
const treeFiles = new Set(allFiles);
const outs = allFiles.filter((f) => /\.out$/.test(f));
const RE_TOKEN = /`([A-Za-z_$][\w$]*)`/g;
const RE_CITE = /((?:[\w.\-/]+\/)?[\w.\-]+\.(?:mjs|mts|ts|md|tsx|json)):(\d+)/g;

const cache = new Map();
const readPinned = (p) => { if (!cache.has(p)) cache.set(p, showAt(PIN, p)); return cache.get(p); };

const pairs = [];
for (const f of outs) {
  const text = showAt(PIN, f);
  if (text === null) continue;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const toks = [...lines[i].matchAll(RE_TOKEN)].map((m) => m[1]);
    const cites = [...lines[i].matchAll(RE_CITE)].map((m) => ({ path: m[1], line: +m[2] }));
    for (const t of toks) for (const c of cites) pairs.push({ file: f, lineNo: i + 1, text: lines[i], token: t, cite: c });
  }
}

let flagged = [], clean = 0, unresolvable = 0;
for (const p of pairs) {
  if (!treeFiles.has(p.cite.path)) { unresolvable++; continue; }
  const src = readPinned(p.cite.path);
  if (src === null) { unresolvable++; continue; }
  const srcLines = src.split('\n');
  if (p.cite.line < 1 || p.cite.line > srcLines.length) { unresolvable++; continue; }
  p.subject = srcLines[p.cite.line - 1];
  p.fileSrc = src;
  if (p.subject.includes(p.token)) clean++; else flagged.push(p);
}

// ---------------------------------------------------------------- B0: reproduce arm A
leg('B0', flagged.length === 84 && clean === 158, `reproduces arm A's population from the same pin: flagged=${flagged.length} (A: 84), clean=${clean} (A: 158), unresolvable=${unresolvable} (A: 54)`);

// ---------------------------------------------------------------- classify
const elsewhereIn = [], absentFrom = [];
for (const p of flagged) (p.fileSrc.includes(p.token) ? elsewhereIn : absentFrom).push(p);
console.log(`\nclassify the ${flagged.length} flagged pairs:`);
console.log(`  ELSEWHERE_IN_FILE (token absent from the LINE, present in the FILE): ${elsewhereIn.length}`);
console.log(`  ABSENT_FROM_FILE  (token occurs nowhere in the cited file at the pin): ${absentFrom.length}`);
leg('B5', elsewhereIn.length + absentFrom.length === flagged.length, `the two classes PARTITION the flagged set: ${elsewhereIn.length} + ${absentFrom.length} = ${elsewhereIn.length + absentFrom.length} vs ${flagged.length} — no fall-through bucket`);

// ---------------------------------------------------------------- B2: the enumerate-legs pair
const enumLegs = pairs.filter((p) => /enumerate-legs\.mjs/.test(p.cite.path));
console.log(`\nB2 evidence — every SAMELINE pair citing enumerate-legs.mjs (${enumLegs.length}):`);
for (const p of enumLegs) {
  console.log(`  token \`${p.token}\` -> ${p.cite.path}:${p.cite.line}`);
  console.log(`  recording: ${p.file}:${p.lineNo}`);
  console.log(`  rec line:  ${JSON.stringify(p.text.trim().slice(0, 220))}`);
}
const b2Holds = enumLegs.length > 0 && enumLegs.every((p) => p.token !== 'KP_G');

// ---------------------------------------------------------------- full detail for the hand read
console.log(`\n--- ABSENT_FROM_FILE, every member (${absentFrom.length}) — the class worth a human's time ---`);
for (const p of absentFrom) {
  console.log(`\n[${p.token}] absent from all of ${p.cite.path} (cited at :${p.cite.line})`);
  console.log(`  recording: ${p.file}:${p.lineNo}`);
  console.log(`  rec line:  ${JSON.stringify(p.text.trim().slice(0, 220))}`);
  console.log(`  subject:   ${JSON.stringify((p.subject || '').trim().slice(0, 220))}`);
}
console.log(`\n--- ELSEWHERE_IN_FILE, token + site only (${elsewhereIn.length}) ---`);
for (const p of elsewhereIn) console.log(`  \`${p.token}\` -> ${p.cite.path}:${p.cite.line}  [${p.file.split('/').pop()}:${p.lineNo}]`);

// ---------------------------------------------------------------- predictions, all unconditional
console.log('\n' + '='.repeat(78));
console.log('PREDICTIONS — every one graded outside any conditional');
console.log('='.repeat(78));
const pred = [];
const grade = (name, verdict, what) => { pred.push({ name, verdict }); console.log(`${verdict.padEnd(8)} ${name} — ${what}`); };

grade('B1', elsewhereIn.length > flagged.length / 2 ? 'LANDS' : 'REFUTED',
  `P5 at last: the MAJORITY of flagged pairs are ELSEWHERE_IN_FILE (not false reasons): ${elsewhereIn.length} of ${flagged.length} = ${(100 * elsewhereIn.length / Math.max(1, flagged.length)).toFixed(1)}%`);
grade('B2', b2Holds ? 'LANDS' : 'REFUTED',
  `the enumerate-legs.mjs pair(s) are NOT Theseus's instances 1-2 (token not KP_G): ${enumLegs.map((p) => '`' + p.token + '`').join(', ') || 'none'}`);
grade('B3', absentFrom.length >= 1 ? 'LANDS' : 'REFUTED', `ABSENT_FROM_FILE is non-empty: ${absentFrom.length}`);
grade('B4', 'DEFERRED', `fewer than half of ABSENT_FROM_FILE survive a hand read as genuinely false reasons — ${absentFrom.length} members printed above; the hand read is recorded in RESULTS.md, this arm does not score its own hand read`);

console.log('\n' + '='.repeat(78));
const red = legs.filter((l) => !l.ok);
console.log(`VERDICT: ${legs.length} legs, ${red.length} red${red.length ? ' — ' + red.map((l) => l.name).join(', ') : ''}; ${pred.length} predictions printed, of which ${pred.filter((p) => p.verdict !== 'DEFERRED').length} graded and ${pred.filter((p) => p.verdict === 'DEFERRED').length} deferred to a hand read — pre-registration B registered 4`);
console.log(`FIGURES: pairs=${pairs.length} flagged=${flagged.length} clean=${clean} unresolvable=${unresolvable} elsewhereInFile=${elsewhereIn.length} absentFromFile=${absentFrom.length} enumLegsPairs=${enumLegs.length}`);
console.log('='.repeat(78));
process.exit(red.length ? 1 : 0);
