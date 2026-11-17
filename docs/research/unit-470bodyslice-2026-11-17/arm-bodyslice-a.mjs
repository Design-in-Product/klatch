#!/usr/bin/env node
/**
 * unit-470bodyslice — arm A. Grades the pre-registered predictions P2–P6 for the shared body
 * slicer `scripts/lib/decl-body.mjs`.
 *
 * Invocation (paths are arguments; an env assignment is not permitted in a fire):
 *   node arm-bodyslice-a.mjs <theseus-arm-output> <tracked-files-list>
 *
 * Both inputs are FILES captured in this unit's drives, not live re-derivations, so the figures
 * this arm reports are reproducible from the committed artefacts.
 *
 * The subject is imported, never re-implemented here: a cripple of `scripts/lib/decl-body.mjs`
 * must be able to redden this arm, which it cannot do if the arm carries its own copy.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { declBodies, declHeads, bodyOf } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const red = [];
const refused = [];
const check = (name, ok, note) => {
  console.log(`  ${ok ? 'ok  ' : 'RED '} ${name}  ${note}`);
  if (!ok) red.push(name);
};
const src = (rel) => readFileSync(join(ROOT, rel), 'utf8');

/* ============================================================ A1 — P2, where the 52/56 live */
const armOut = process.argv[2];
const trackedList = process.argv[3];
if (!armOut || !trackedList) {
  console.error('usage: arm-bodyslice-a.mjs <theseus-arm-output> <tracked-files-list>');
  process.exit(2);
}
const unguarded = readFileSync(resolve(process.cwd(), armOut), 'utf8')
  .split('\n').filter((l) => l.trim().startsWith('UNGUARDED '))
  .map((l) => l.trim().slice('UNGUARDED '.length).trim());
const tracked = new Set(
  readFileSync(resolve(process.cwd(), trackedList), 'utf8').split('\n').map((l) => l.trim()),
);

const byRoot = {};
for (const f of unguarded) {
  const k = f.startsWith('docs/research/') ? 'docs/research'
    : f.startsWith('docs/operations/') ? 'docs/operations'
      : f.startsWith('scripts/') ? 'scripts'
        : f.startsWith('packages/') ? 'packages' : 'other';
  byRoot[k] = (byRoot[k] || 0) + 1;
}
const untrackedMembers = unguarded.filter((f) => !tracked.has(f));

console.log('\nA1 — P2: where the unguarded slicers are');
console.log(`  |UNGUARDED| = ${unguarded.length}`);
for (const [k, v] of Object.entries(byRoot).sort((a, b) => b[1] - a[1])) {
  console.log(`      ${k.padEnd(16)} ${v}`);
}
console.log(`  UNTRACKED members (in my worktree, not in the repo): ${untrackedMembers.length}`);
for (const f of untrackedMembers) console.log(`      untracked ${f}`);

// P2 as registered: <=4 under scripts/, >=44 under docs/research/.
check('A1a |scripts/| <= 4', (byRoot.scripts || 0) <= 4, `scripts=${byRoot.scripts || 0}`);
check('A1b |docs/research/| >= 44', (byRoot['docs/research'] || 0) >= 44,
  `docs/research=${byRoot['docs/research'] || 0}`);
// P1's refutation, asserted rather than narrated: the population is worktree-dependent.
check('A1c the untracked members explain the P1 delta exactly (4)', untrackedMembers.length === 4,
  `untracked=${untrackedMembers.length}, his 52 + 4 = my ${unguarded.length}`);

/* ================================================ A2/A3 — P3, the differential on REAL sites */
// A naive slicer, written here as the 52 files write it: first `{` after the head, brace-balanced
// over raw text. This is the DEFECT, reproduced deliberately as the comparison arm.
const naiveBody = (s, name) => {
  const head = new RegExp(
    `^[ \\t]*(?:export\\s+)?(?:async\\s+)?(?:function\\s*)?(?:const\\s+)?${name}\\b`, 'm',
  );
  const m = head.exec(s);
  if (!m) return null;
  const open = s.indexOf('{', m.index);
  if (open === -1) return null;
  let d = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') d++;
    else if (s[i] === '}') { d--; if (d === 0) return s.slice(open, i + 1); }
  }
  return null;
};

const SITES = [
  {
    mechanism: 'JSDoc @type braces',
    file: 'scripts/lib/strip-source.mjs', decl: 'stripSource',
    wants: 'StripSourceInputError',
  },
  {
    mechanism: 'object default / inline options type',
    file: 'packages/server/src/db/queries.ts', decl: 'createGroundRulesPreset',
    wants: 'INSERT INTO',
  },
  {
    mechanism: 'brace-bearing return type (the mirror, found by this unit)',
    file: 'packages/server/src/claude/client.ts', decl: 'assembleSystemPrompt',
    wants: 'floorApplied',
  },
];
// A3: the control — a declaration whose parameter list and return type carry NO brace. Both
// readers must agree, or the cripple leg below cannot show that the guard is what moved.
const CONTROL = {
  mechanism: 'control: no brace before the body',
  file: 'scripts/lib/strip-source.mjs', decl: 'regexLiteralEnd', wants: 'regex',
};

console.log('\nA2 — P3: naive vs shared helper, on three real corpus declarations');
let naiveWrong = 0; let helperRight = 0;
for (const s of SITES) {
  const text = src(s.file);
  const n = naiveBody(text, s.decl);
  const h = bodyOf(text, s.decl);
  const nOk = !!n && n.includes(s.wants);
  const hOk = !!h && h.includes(s.wants);
  if (!nOk) naiveWrong++;
  if (hOk) helperRight++;
  console.log(`  ${s.mechanism}`);
  console.log(`      ${s.file} → ${s.decl}`);
  console.log(`      naive  body=${n === null ? 'null' : `${n.length}ch`} contains('${s.wants}')=${nOk}`);
  console.log(`      helper body=${h === null ? 'null' : `${h.length}ch`} contains('${s.wants}')=${hOk}`);
}
check('A2a naive is wrong on 3 of 3', naiveWrong === 3, `naiveWrong=${naiveWrong}/3`);
check('A2b helper is right on 3 of 3', helperRight === 3, `helperRight=${helperRight}/3`);

const ctext = src(CONTROL.file);
const cn = naiveBody(ctext, CONTROL.decl);
const ch = bodyOf(ctext, CONTROL.decl);
console.log('\nA3 — P4 control: a declaration with no brace before the body');
console.log(`      ${CONTROL.file} → ${CONTROL.decl}`);
console.log(`      naive=${cn === null ? 'null' : `${cn.length}ch`} helper=${ch === null ? 'null' : `${ch.length}ch`}`);
check('A3a both readers agree on the control', !!cn && !!ch && cn === ch,
  `equal=${!!cn && !!ch && cn === ch}`);

/* ============================================= A4 — the .d.mts and the .mjs export the same names */
const expNames = (s, kinds) => {
  const out = new Set();
  const re = new RegExp(`^export\\s+(?:${kinds})\\s+([A-Za-z_$][\\w$]*)`, 'gm');
  let m; while ((m = re.exec(s)) !== null) out.add(m[1]);
  return out;
};
const implNames = expNames(stripSource(src('scripts/lib/decl-body.mjs'), true), 'const|class|function');
const declNames = expNames(stripSource(src('scripts/lib/decl-body.d.mts'), true), 'declare const|declare class|declare function');
const missing = [...implNames].filter((n) => !declNames.has(n));
const extra = [...declNames].filter((n) => !implNames.has(n));
console.log('\nA4 — the declaration and the implementation export the same names');
console.log(`      impl=${[...implNames].join(',')}`);
console.log(`      decl=${[...declNames].join(',')}`);
check('A4a no export missing from the .d.mts', missing.length === 0, `missing=[${missing}]`);
check('A4b no export in the .d.mts that does not exist', extra.length === 0, `extra=[${extra}]`);

/* ================================= A5 — P6: forms the helper refuses or does not match, measured */
const walk = (d, acc = []) => {
  let ents; try { ents = readdirSync(join(ROOT, d), { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const rel = `${d}/${e.name}`;
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'dist'].includes(e.name)) continue;
      walk(rel, acc);
    } else if (['.ts', '.mts', '.mjs'].includes(extname(e.name))) acc.push(rel);
  }
  return acc;
};
const surface = [...walk('scripts/lib'), ...walk('packages/server/src'), ...walk('packages/shared/src')]
  .filter((f) => tracked.has(f) && !f.includes('__tests__'));

let heads = 0; let block = 0; let concise = 0;
const reasons = {};
const noParenArrow = [];
const NOPAREN = /^[ \t]*(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s+)?[A-Za-z_$][\w$]*\s*=>/gm;
for (const f of surface) {
  const text = src(f);
  for (const d of declBodies(text)) {
    heads++;
    if (d.kind === 'block') block++;
    else if (d.kind === 'concise') concise++;
    else reasons[d.reason] = (reasons[d.reason] || 0) + 1;
  }
  const code = stripSource(text, true);
  const re = new RegExp(NOPAREN.source, 'gm');
  let m; while ((m = re.exec(code)) !== null) noParenArrow.push(`${f}:${code.slice(0, m.index).split('\n').length}`);
}
console.log(`\nA5 — P6: the helper over ${surface.length} tracked files of the imported + server surface`);
console.log(`      heads matched: ${heads}  block=${block}  concise=${concise}  refused=${heads - block - concise}`);
for (const [r, n] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) console.log(`      refused: ${r} ×${n}`);
console.log(`      single-identifier arrows the head key does NOT match: ${noParenArrow.length}`);
for (const s of noParenArrow.slice(0, 6)) console.log(`          ${s}`);
check('A5a P6 lands: at least one real form is outside the matched set',
  noParenArrow.length > 0 || (heads - block - concise) > 0,
  `unmatched-arrows=${noParenArrow.length} refused=${heads - block - concise}`);
check('A5b no refusal is the catch-all shape (every refusal carries a named reason)',
  Object.keys(reasons).every((r) => r && r !== 'undefined'), `reasons=${Object.keys(reasons).length}`);

/* ========================== A6 — the mirror: how exposed is the corpus, and are the GUARDED six? */
const guarded = readFileSync(resolve(process.cwd(), armOut), 'utf8')
  .split('\n').filter((l) => l.trim().startsWith('GUARDED '))
  .map((l) => l.trim().slice('GUARDED '.length).trim());
// A necessary condition for handling the return-type region is comparing against, or skipping, a
// `:`. This is a PROXY and is declared as one: it over-credits (a `:` comparison may be for
// something else) and so can only support the claim that the six are exposed, never refute it.
const colonAware = guarded.filter((f) => {
  try { return /[=!]==?\s*['"`]:['"`]|['"`]:['"`]\s*[=!]==?/.test(src(f)); } catch { return false; }
});
// The live exposure, counted with the helper itself: declarations whose span between the parameter
// list's close and the body's open brace contains a brace group.
let retTypeBraced = 0; const retSites = [];
for (const f of surface.filter((x) => x.startsWith('packages/'))) {
  const text = src(f);
  const code = stripSource(text, true);
  for (const d of declBodies(text)) {
    if (d.kind !== 'block' || d.bodyStart === null) continue;
    const between = code.slice(d.parenClose + 1, d.bodyStart);
    if (between.includes('{')) { retTypeBraced++; retSites.push(`${f}:${d.name}`); }
  }
}
console.log('\nA6 — the mirror mechanism: brace-bearing return types');
console.log(`      live sites in packages/ (counted by the helper): ${retTypeBraced}`);
for (const s of retSites.slice(0, 8)) console.log(`          ${s}`);
console.log(`      of the ${guarded.length} files the 469 census called GUARDED, ${colonAware.length} compare against a ':'`);
check('A6a the mirror is live in the product tree', retTypeBraced > 0, `sites=${retTypeBraced}`);
check('A6b none of the GUARDED six handles the return-type region (proxy)',
  colonAware.length === 0, `colonAware=${colonAware.length}/${guarded.length}`);
if (retTypeBraced > 0) {
  refused.push('the 56 unguarded slicers were NOT re-measured against the mirror mechanism; A6a '
    + 'establishes that the exposure exists, not its size across the 56');
}

/* ------------------------------------------------------------------------------- verdict */
console.log(`\n${red.length === 0 ? 'ok' : 'FAIL'} legs=${red.length} red=[${red.join(' | ')}]`
  + (refused.length ? ` refused=[${refused.join(' | ')}]` : ''));
process.exit(red.length === 0 ? 0 : 1);
