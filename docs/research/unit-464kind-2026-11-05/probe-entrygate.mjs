#!/usr/bin/env node
// DECLARED POST-HOC. No prediction was registered and none is claimed.
//
// Why it exists. The standing obligation is to re-drive an older instrument after a convention edit,
// and for several fires both seats have used `unit-464prec-2026-11-03/grade-entry-v15.mjs` and
// reported "GREEN 6 of 6". My drive7 came back GREEN 6 of 6 too — and printed
//
//     ok  GENTRY  §2.1g is 57054 bytes, carries its MEASURED-BLOCK, and the document header
//                 announces v1.5
//
// The document header announces **v2.3**. A leg cannot be ok on that sentence, so either the
// sentence or the predicate is wrong. This probe reads both and prices the gap. It does not change
// the gate — that instrument is Daedalus's and the finding is routed to him.
//
// Two things are measured here, separately, because they are two different defects:
//   A. the SPAN the gate calls "the v1.5 entry"
//   B. whether GENTRY's version conjunct can go red at all

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const DOC = `${TOP}/docs/research/LEG-CLASS-CONVENTION.md`;
const refuse = (m) => { console.log(`REFUSE: ${m}`); process.exit(2); };

let doc;
try { doc = readFileSync(DOC, 'utf8'); } catch (e) { refuse(`cannot read the document: ${e.message}`); }

console.log('=== probe-entrygate (DECLARED POST-HOC, no prediction) ===');
console.log('subject: unit-464prec-2026-11-03/grade-entry-v15.mjs, leg GENTRY — NOT modified here');
console.log('');

// --- A. the span -------------------------------------------------------------------------------
const s = doc.indexOf('### 2.1g');
const e = doc.indexOf('### 2.1a');
if (s === -1 || e === -1) refuse('one of the two span anchors is absent — the span cannot be priced');
if (e <= s) refuse(`the closing anchor precedes the opening one (${e} <= ${s}) — slice would be empty`);
const entry = doc.slice(s, e);

// Which `### ` headings fall inside that slice? Each one is a section the gate is counting as
// part of "the v1.5 entry".
const inside = [...entry.matchAll(/^### (.+)$/gm)].map((m) => m[1]);
console.log('-- A. the span the gate calls "the v1.5 entry" --');
console.log(`  slice = doc[indexOf('### 2.1g') .. indexOf('### 2.1a')]  =  ${entry.length} bytes`);
console.log(`  '### ' headings inside that slice : ${inside.length}`);
for (const h of inside) console.log(`     ${h.slice(0, 96)}`);
console.log('');
const firstLen = (() => {
  // what the span WOULD be if it ended at the next '### ' heading after 2.1g
  const nxt = entry.slice(8).search(/^### /m);
  return nxt === -1 ? entry.length : nxt + 8;
})();
console.log(`  the v1.5 entry alone, ending at the NEXT '### ' heading : ${firstLen} bytes`);
console.log(`  so the slice is wider than the entry by               : ${entry.length - firstLen} bytes`);
console.log(`  the gate's conjunct is  entry.length > 2000  — satisfied by the slice at ${entry.length},`);
console.log(`  and satisfied by the entry alone at ${firstLen}. Both pass, which is why the widening is silent.`);
console.log(`  MEASURED-BLOCK-V15 present in the full slice : ${/MEASURED-BLOCK-V15/.test(entry)}`);
console.log(`  MEASURED-BLOCK-V15 present in the entry alone: ${/MEASURED-BLOCK-V15/.test(entry.slice(0, firstLen))}`);
console.log('');

// --- B. can the version conjunct go red? -------------------------------------------------------
const RE = /^\*\*v1\.5, 2026-11-03\.\*\*/m;
const lines = doc.split('\n');
const hits = [];
lines.forEach((l, i) => { if (/^\*\*v1\.5, 2026-11-03\.\*\*/.test(l)) hits.push(i + 1); });
const headerLine = lines.findIndex((l) => /^\*\*v\d+\.\d+, \d{4}-\d{2}-\d{2}\.\*\*/.test(l)) + 1;
const headerVer = (lines[headerLine - 1] ?? '').match(/^\*\*(v\d+\.\d+)/)?.[1] ?? '(none)';

console.log('-- B. GENTRY\'s version conjunct --');
console.log(`  predicate            : /^\\*\\*v1\\.5, 2026-11-03\\.\\*\\*/m  tested against the WHOLE document`);
console.log(`  reason string says   : "the document header announces v1.5"`);
console.log(`  predicate matches at : line(s) ${hits.join(', ') || '(none)'}`);
console.log(`  the document's FIRST version line is line ${headerLine}, and it announces ${headerVer}`);
console.log(`  predicate true       : ${RE.test(doc)}`);
console.log('');
const isHeader = hits.length > 0 && hits[0] === headerLine;
console.log(`  does the match sit ON the header line? ${isHeader}`);
if (!isHeader) {
  console.log(`  ** NO. The match is in the APPEND-ONLY version history, ${hits[0] - headerLine} lines below the header.`);
  console.log(`  ** §2.1e forbids retro-editing earlier entries, so that line cannot be removed, so this`);
  console.log(`  ** conjunct cannot go red. It is not a header check. It is a "v1.5's own entry still`);
  console.log(`  ** exists" check, and the only document state that reddens it is one that violates §2.1e.`);
}
console.log('');
console.log(`ENTRYGATE: slice=${entry.length} entryalone=${firstLen} headings=${inside.length} v15hits=${hits.length} headerline=${headerLine} headerver=${headerVer} onheader=${isHeader}`);
