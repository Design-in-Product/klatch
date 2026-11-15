#!/usr/bin/env node
// unit-466reasontok arm A — Theseus's boarded item 3: a general screen for false-reason legs.
// A leg whose printed reason names an identifier that does not occur in the subject line it
// reasons about. Driven against committed recordings at a pin that predates this unit.
//
// Every figure RESULTS.md publishes is printed here. Intermediates are printed beside their
// verdicts on purpose: printing the intermediate is the only thing that caught any of the three
// false-reason legs this screen is meant to generalise.
import { execFileSync } from 'node:child_process';

const REPO = '/Users/xian/Development/klatch-worktrees/daedalus';
const PIN = '5d430e5411885ffe56bdcbd19a4fd9664564748e';
const UNIT = 'docs/research/unit-466reasontok-2026-11-15';

const legs = [];
const leg = (name, ok, what) => { legs.push({ name, ok, what }); console.log(`${ok ? 'ok  ' : 'RED '} ${name} — ${what}`); };

// `-C` pinned explicitly: ls-tree is cwd-sensitive and a pathspec resolves against the child's cwd.
const git = (...args) => execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', maxBuffer: 2e8 });
const showAt = (rev, path) => { try { return git('show', `${rev}:${path}`); } catch { return null; } };

console.log('='.repeat(78));
console.log(`unit-466reasontok arm A — PIN ${PIN}`);
console.log('='.repeat(78));

// ---------------------------------------------------------------- A0: two-sided, matched
const known = 'docs/research/lib/attested-rounds.mjs';
const a0a = git('ls-tree', '-r', '--name-only', PIN, '--', known).trim();
const a0b = git('ls-tree', '-r', '--name-only', PIN, '--', `${UNIT}/PRE-REGISTRATION-A.md`).trim();
leg('A0a', a0a === known, `ls-tree at the pin FINDS a known corpus file: ${JSON.stringify(a0a)}`);
leg('A0b', a0b === '', `ls-tree at the pin does NOT find this unit's pre-registration (committed after the pin): ${JSON.stringify(a0b)}`);

// ---------------------------------------------------------------- population
const allFiles = git('ls-tree', '-r', '--name-only', PIN).trim().split('\n');
const outs = allFiles.filter((f) => /\.out$/.test(f));
const treeFiles = new Set(allFiles);
console.log(`\npopulation: ${outs.length} committed *.out recordings at the pin, ${allFiles.length} files in tree`);

const RE_TOKEN = /`([A-Za-z_$][\w$]*)`/g;
const RE_CITE = /((?:[\w.\-/]+\/)?[\w.\-]+\.(?:mjs|mts|ts|md|tsx|json)):(\d+)/g;

// ---------------------------------------------------------------- enumerate pairs
const sameline = [];
const window3 = [];
const cache = new Map();
const readPinned = (p) => { if (!cache.has(p)) cache.set(p, showAt(PIN, p)); return cache.get(p); };

for (const f of outs) {
  const text = showAt(PIN, f);
  if (text === null) continue;
  const lines = text.split('\n');
  // per-line token and citation sets, computed once, reused by both keys
  const toks = lines.map((l) => [...l.matchAll(RE_TOKEN)].map((m) => m[1]));
  const cites = lines.map((l) => [...l.matchAll(RE_CITE)].map((m) => ({ path: m[1], line: +m[2] })));
  for (let i = 0; i < lines.length; i++) {
    for (const t of toks[i]) for (const c of cites[i]) sameline.push({ file: f, lineNo: i + 1, text: lines[i], token: t, cite: c });
    // WINDOW3: a token on line i paired with a citation within +/-3 lines, excluding same-line
    for (const t of toks[i]) {
      for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
        if (j === i) continue;
        for (const c of cites[j]) window3.push({ file: f, lineNo: i + 1, token: t, cite: c, dist: j - i });
      }
    }
  }
}
const samelineLines = new Set(sameline.map((p) => `${p.file}:${p.lineNo}`)).size;
const samelineRecordings = new Set(sameline.map((p) => p.file)).size;
console.log(`\nSAMELINE: ${sameline.length} (token,site) pairs on ${samelineLines} recording lines in ${samelineRecordings} recordings`);
console.log(`WINDOW3 (+/-3 lines, same-line excluded): ${window3.length} pairs — UPPER BOUND, a proximity window pairs tokens with citations that are not their subject`);

// ---------------------------------------------------------------- resolve + screen
let unresolvable = 0, screenable = 0, flagged = 0, clean = 0;
const unresolvableBy = { noFileInTree: 0, noBlob: 0, lineOutOfRange: 0 };
const flaggedPairs = [], cleanPairs = [];
for (const p of sameline) {
  if (!treeFiles.has(p.cite.path)) { unresolvable++; unresolvableBy.noFileInTree++; p.why = 'noFileInTree'; continue; }
  const src = readPinned(p.cite.path);
  if (src === null) { unresolvable++; unresolvableBy.noBlob++; p.why = 'noBlob'; continue; }
  const srcLines = src.split('\n');
  if (p.cite.line < 1 || p.cite.line > srcLines.length) { unresolvable++; unresolvableBy.lineOutOfRange++; p.why = 'lineOutOfRange'; continue; }
  screenable++;
  p.subject = srcLines[p.cite.line - 1];
  if (p.subject.includes(p.token)) { clean++; cleanPairs.push(p); } else { flagged++; flaggedPairs.push(p); }
}
const unresolvableRate = sameline.length ? unresolvable / sameline.length : 0;
console.log(`\nresolve: screenable ${screenable}, unresolvable ${unresolvable} (${(unresolvableRate * 100).toFixed(1)}%) — ${JSON.stringify(unresolvableBy)}`);
console.log(`screen:  FLAGGED ${flagged} (token absent from the cited line), clean ${clean}`);

// ---------------------------------------------------------------- the ceiling, declared before the drive
const CEILING = 0.40;
const ceilingFired = unresolvableRate > CEILING;
console.log(`\nCEILING (>40% unresolvable): ${ceilingFired ? 'FIRED' : 'held'} at ${(unresolvableRate * 100).toFixed(1)}%`);

// ---------------------------------------------------------------- KP+/KP-, two-sided, on the screen itself
// Built from the population, then hand-checked and named in RESULTS.md. Two-sided on purpose:
// a one-sided KP grades one direction of the screen only.
const kpPlus = cleanPairs[0];
const kpMinus = flaggedPairs[0];
if (kpPlus) {
  const ok = kpPlus.subject.includes(kpPlus.token) === true;
  leg('KP+', ok, `screen does NOT flag a pair whose token IS in the cited line — \`${kpPlus.token}\` in ${kpPlus.cite.path}:${kpPlus.cite.line}`);
  console.log(`      KP+ subject line: ${JSON.stringify(kpPlus.subject.trim().slice(0, 150))}`);
  console.log(`      KP+ recording:    ${kpPlus.file}:${kpPlus.lineNo}`);
} else leg('KP+', false, 'no clean pair exists to serve as a positive control — the screen is ungraded in that direction');
if (kpMinus) {
  const ok = kpMinus.subject.includes(kpMinus.token) === false;
  leg('KP-', ok, `screen DOES flag a pair whose token is NOT in the cited line — \`${kpMinus.token}\` vs ${kpMinus.cite.path}:${kpMinus.cite.line}`);
  console.log(`      KP- subject line: ${JSON.stringify(kpMinus.subject.trim().slice(0, 150))}`);
  console.log(`      KP- recording:    ${kpMinus.file}:${kpMinus.lineNo}`);
} else leg('KP-', false, 'no flagged pair exists to serve as a negative control — the screen is ungraded in that direction');

// ---------------------------------------------------------------- P3: are HIS instances in reach?
// His instances 1 and 2 both reason about unit-464class/enumerate-legs.mjs:275 off a token
// (`KP_G`, then `in`). If the screen's literal key can reach them, a SAMELINE pair must exist
// in his unit's recordings citing that file.
const HIS = 'docs/research/unit-466striplift-2026-11-15/';
const hisRecordings = outs.filter((f) => f.startsWith(HIS));
const hisPairs = sameline.filter((p) => p.file.startsWith(HIS));
const hisEnumLegs = sameline.filter((p) => /enumerate-legs\.mjs/.test(p.cite.path));
const kpgAnywhere = sameline.filter((p) => p.token === 'KP_G');
console.log(`\nP3 evidence:`);
console.log(`  his unit's committed recordings in the population: ${hisRecordings.length}`);
console.log(`  SAMELINE pairs drawn from his unit's recordings:   ${hisPairs.length}`);
console.log(`  SAMELINE pairs citing enumerate-legs.mjs anywhere: ${hisEnumLegs.length}`);
console.log(`  SAMELINE pairs whose token is \`KP_G\` anywhere:     ${kpgAnywhere.length}`);
for (const p of hisPairs.slice(0, 10)) console.log(`    his pair: \`${p.token}\` -> ${p.cite.path}:${p.cite.line}  [${p.file.split('/').pop()}:${p.lineNo}]`);

// ---------------------------------------------------------------- flagged detail, all of it
console.log(`\n--- every FLAGGED pair (${flagged}) ---`);
for (const p of flaggedPairs) {
  console.log(`FLAG \`${p.token}\` absent from ${p.cite.path}:${p.cite.line}`);
  console.log(`     recording: ${p.file}:${p.lineNo}`);
  console.log(`     rec line:  ${JSON.stringify(p.text.trim().slice(0, 180))}`);
  console.log(`     subject:   ${JSON.stringify(p.subject.trim().slice(0, 180))}`);
}
console.log(`\n--- every CLEAN pair (${clean}) ---`);
for (const p of cleanPairs) console.log(`clean \`${p.token}\` in ${p.cite.path}:${p.cite.line}  [${p.file.split('/').pop()}:${p.lineNo}]`);

console.log(`\n--- every UNRESOLVABLE pair (${unresolvable}) ---`);
for (const p of sameline.filter((x) => x.why)) console.log(`${p.why}  \`${p.token}\` -> ${p.cite.path}:${p.cite.line}  [${p.file.split('/').pop()}:${p.lineNo}]`);

// ---------------------------------------------------------------- predictions
const pred = [];
const grade = (name, verdict, what) => { pred.push({ name, verdict, what }); console.log(`${verdict.padEnd(8)} ${name} — ${what}`); };
console.log('\n' + '='.repeat(78));
console.log('PREDICTIONS');
console.log('='.repeat(78));

if (ceilingFired) {
  grade('P1', 'VOID', `ceiling fired at ${(unresolvableRate * 100).toFixed(1)}% > 40% — no yield figure published, by my own pre-registered terms`);
  grade('P5', 'VOID', 'ceiling fired — flagged-pair composition not published');
} else {
  grade('P1', flagged >= 1 ? 'LANDS' : 'REFUTED', `SAMELINE yield >=1 flagged pair: flagged=${flagged}`);
}
grade('P2', unresolvableRate >= 0.20 ? 'LANDS' : 'REFUTED', `>=20% of SAMELINE cited sites unresolvable at the pin: ${(unresolvableRate * 100).toFixed(1)}%`);
const p3Holds = hisEnumLegs.length === 0 && kpgAnywhere.length === 0;
grade('P3', p3Holds ? 'LANDS' : 'REFUTED', `his instances 1-2 NOT in the SAMELINE population: pairs citing enumerate-legs.mjs=${hisEnumLegs.length}, pairs with token KP_G=${kpgAnywhere.length}`);
grade('P4', window3.length >= 2 * sameline.length ? 'LANDS' : 'REFUTED', `WINDOW3 >= 2x SAMELINE: ${window3.length} vs ${sameline.length} (${(window3.length / Math.max(1, sameline.length)).toFixed(1)}x)`);

console.log('\n' + '='.repeat(78));
const red = legs.filter((l) => !l.ok);
console.log(`VERDICT: ${legs.length} legs, ${red.length} red${red.length ? ' — ' + red.map((l) => l.name).join(', ') : ''}; ${pred.length} predictions graded`);
console.log(`FIGURES: recordings=${outs.length} samelinePairs=${sameline.length} samelineLines=${samelineLines} samelineRecordings=${samelineRecordings} window3=${window3.length} screenable=${screenable} unresolvable=${unresolvable} flagged=${flagged} clean=${clean} unresolvableRate=${(unresolvableRate * 100).toFixed(1)}%`);
console.log('='.repeat(78));
process.exit(red.length ? 1 : 0);
