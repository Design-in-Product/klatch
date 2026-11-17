#!/usr/bin/env node
/**
 * unit-468createlit · arm A — census of write-path return spellings in queries.ts.
 *
 * Population key (registered in PRE-REGISTRATION.md §"Population key", before this
 * file existed): an EXPORTED function in packages/server/src/db/queries.ts whose
 * body contains an `INSERT INTO` and which therefore publishes a row it just wrote.
 *
 * Deliberately NOT keyed on the name `create*`: that key misses `insertMessage`
 * (a writer) and admits `createChannelBySessionIdResolver` (not one).
 *
 * Per member it reports:
 *   terminalReturn : 'mapper' | 'literal' | 'other'
 *   mapperForType  : the sibling rowTo* mapper for the declared return type, if any
 *
 * Exit 0 always (a census, not a gate). The conclusion line is the measurement.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, '../../../packages/server/src/db/queries.ts');
const text = readFileSync(SRC, 'utf8');
const lines = text.split('\n');

// --- 1. the mappers that exist, by the type they return -----------------------
// `function rowToX(row: any): Type {`
const mappers = new Map(); // Type -> fnName
for (const line of lines) {
  const m = line.match(/^(?:export\s+)?function\s+(rowTo\w+)\s*\([^)]*\)\s*:\s*([A-Za-z0-9_]+)\s*\{/);
  if (m) mappers.set(m[2], m[1]);
}

// --- 2. exported function bodies, by brace balance ---------------------------
const members = [];
for (let i = 0; i < lines.length; i++) {
  const head = lines[i];
  const m = head.match(/^export\s+function\s+([A-Za-z0-9_]+)\s*\(/);
  if (!m) continue;
  const name = m[1];

  // Collect the signature until the opening brace of the BODY, then the body
  // until brace balance returns to zero.
  //
  // **Drive 1 was wrong here and the fix is load-bearing.** The first version
  // started brace counting at the first `{` anywhere after the function head.
  // A brace inside the *parameter list* — an inline object type
  // (`opts?: { name?: string }`) or an object default (`= {}`) — therefore
  // opened and closed the "body" on the signature's own line, so the body slice
  // held no `INSERT INTO` and the member fell out of the population silently.
  // That dropped `createGroundRulesPreset` and `createProject`: the first of
  // those is the instance this entire unit was written about. Absence is the one
  // result an instrument does not error on.
  //
  // The cure: find the end of the parameter list first (paren depth back to 0),
  // and only then start counting braces. Comments and strings are still not
  // parsed; a brace inside either would mis-slice, so the arm reports any member
  // whose body it could not delimit rather than dropping it.
  let depth = 0, started = false, end = -1, sig = '';
  let parens = 0, sigDone = false;
  for (let j = i; j < lines.length; j++) {
    const l = lines[j];
    if (!started) sig += l + '\n';
    for (const ch of l) {
      if (!sigDone) {
        if (ch === '(') parens++;
        else if (ch === ')') { parens--; if (parens === 0) sigDone = true; }
        continue;
      }
      if (ch === '{') { depth++; started = true; }
      else if (ch === '}') { depth--; }
    }
    if (started && depth === 0) { end = j; break; }
  }
  if (end === -1) { members.push({ name, undelimited: true }); continue; }

  const body = lines.slice(i, end + 1).join('\n');
  if (!/INSERT\s+INTO/i.test(body)) continue;

  // declared return type: last `): Type {` in the signature slice
  const retM = sig.match(/\)\s*:\s*([A-Za-z0-9_<>\[\]{}|\s:;,'"]+?)\s*\{\s*$/m);
  const declared = retM ? retM[1].trim() : '(unparsed)';

  // terminal return: the last top-level `return ...` in the body
  const retLines = body.split('\n').filter((l) => /^\s*return\b/.test(l));
  const terminal = retLines.length ? retLines[retLines.length - 1].trim() : '(none)';
  let kind = 'other';
  if (/^return\s+rowTo\w+\s*\(/.test(terminal)) kind = 'mapper';
  else if (/^return\s*\{/.test(terminal)) kind = 'literal';

  members.push({
    name,
    line: i + 1,
    declared,
    terminalReturn: kind,
    terminal,
    mapperForType: mappers.get(declared) ?? null,
  });
}

// --- 3. report ---------------------------------------------------------------
console.log(`arm-createlit-a · ${SRC.replace(/^.*\/packages/, 'packages')}`);
console.log(`mappers found: ${mappers.size} -> ${[...mappers.entries()].map(([t, f]) => `${f}:${t}`).join(', ')}`);
console.log('');
const undelimited = members.filter((m) => m.undelimited);
const pop = members.filter((m) => !m.undelimited);
for (const m of pop) {
  console.log(
    `  ${m.terminalReturn.padEnd(7)} ${m.name}@${m.line}  ret=${m.declared}  mapper=${m.mapperForType ?? '-'}`
  );
  if (m.terminalReturn === 'other') console.log(`            terminal: ${m.terminal.slice(0, 110)}`);
}
if (undelimited.length) {
  console.log('');
  console.log(`  UNDELIMITED (body braces did not balance; excluded from counts): ${undelimited.map((m) => m.name).join(', ')}`);
}

const lit = pop.filter((m) => m.terminalReturn === 'literal');
const map = pop.filter((m) => m.terminalReturn === 'mapper');
const oth = pop.filter((m) => m.terminalReturn === 'other');
const litWithMapper = lit.filter((m) => m.mapperForType);

console.log('');
console.log(`CONCLUSION population=${pop.length} literal=${lit.length} mapper=${map.length} other=${oth.length} undelimited=${undelimited.length}`);
console.log(`CONCLUSION literal-with-a-sibling-mapper=${litWithMapper.length} -> ${litWithMapper.map((m) => m.name).join(',') || '(none)'}`);
