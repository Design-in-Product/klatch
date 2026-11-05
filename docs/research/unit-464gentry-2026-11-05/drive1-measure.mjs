// unit-464gentry drive1 — P1TIGHT / P2PINNED / P3FLOOR / P4HEADER.
//
// Measures the four non-matrix predictions of PRE-REGISTRATION.md against the live convention and
// against the gate's own PIN. Reads; changes nothing.
//
//   node docs/research/unit-464gentry-2026-11-05/drive1-measure.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DOC = 'docs/research/LEG-CLASS-CONVENTION.md';
const SUBJECT_PIN = '5afca5dd79f84fd54d25069c0ca598bc26ffe462';
const GATE_PIN = '5ba1af7369e97a3abade0cbd5be4e542e0668971';
const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const g = (a) => execFileSync('git', ['-C', TOP, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

const legs = [];
const check = (n, ok, note) => { legs.push({ n, ok, note }); return ok; };

// A span is (start anchor, end anchor) and BOTH must be found and ordered. Refuse otherwise —
// slice(i, -1) is a bigger span, not an error. This helper is the cure's shape, stated once here
// and used by the repair.
function span(text, startAnchor, endAnchor) {
  const i = text.indexOf(startAnchor);
  if (i < 0) return { err: `start anchor absent: ${startAnchor}` };
  const j = text.indexOf(endAnchor, i + startAnchor.length);
  if (j < 0) return { err: `end anchor absent after start: ${endAnchor}` };
  return { text: text.slice(i, j), i, j };
}

const live = readFileSync(DOC, 'utf8');

// --- P1TIGHT: the right span is the entry plus its own MEASURED-BLOCK and nothing else.
const tight = span(live, '### 2.1g', '### 2.1h');
const tightHeads = tight.err ? [] : (tight.text.match(/^### .*$/gm) ?? []);
check('P1TIGHT',
  !tight.err && tightHeads.length === 2 && tight.text.length > 2000 && tight.text.length < 8000,
  tight.err ? `REFUSED — ${tight.err}`
    : `tight span (### 2.1g -> ### 2.1h) is ${tight.text.length} bytes over ${tightHeads.length} ` +
      `### headings [${tightHeads.map((h) => h.slice(4).split(' ')[0]).join(', ')}]`);

// --- the wrong span, for the record and for P3FLOOR.
const wrong = span(live, '### 2.1g', '### 2.1a');
const wrongHeads = wrong.err ? [] : (wrong.text.match(/^### .*$/gm) ?? []);

// --- P2PINNED: is the entry actually frozen since the gate's own pin? Registered blind.
const atPin = g(['show', `${GATE_PIN}:${DOC}`]);
const pinTight = span(atPin, '### 2.1g', '### 2.1h');
const pinnedIdentical = !pinTight.err && !tight.err && pinTight.text === tight.text;
check('P2PINNED', pinnedIdentical,
  pinTight.err ? `REFUSED at the pin — ${pinTight.err} (so the pin cannot supply a frozen span)`
    : `tight span at gate pin ${GATE_PIN.slice(0, 8)} is ${pinTight.text.length} bytes / sha ` +
      `${sha(pinTight.text)}; live is ${tight.text.length} bytes / sha ${sha(tight.text)} — ` +
      `${pinnedIdentical ? 'byte-identical' : 'DIFFERENT'}`);

// --- P3FLOOR: how many of the two spans does `> 2000` separate?
const floorOn = [['wrong', wrong], ['tight', tight]]
  .map(([n, s]) => [n, s.err ? null : s.text.length > 2000]);
const separated = floorOn.filter(([, v]) => v === false).length;
check('P3FLOOR', separated === 0,
  `\`entry.length > 2000\`: ${floorOn.map(([n, v]) => `${n}=${v}`).join(' · ')} — the conjunct ` +
  `separates ${separated} of 2 spans (wrong span ${wrong.err ?? `${wrong.text.length}B over ` +
  `${wrongHeads.length} ### headings`})`);

// --- P4HEADER: the printed note's claim, against the document.
const RE = /^\*\*v1\.5, 2026-11-03\.\*\*/m;
const m = live.match(RE);
const headerLine = live.split('\n')[2] ?? '';
const headerVer = (headerLine.match(/^\*\*(v\d+\.\d+)/) ?? [])[1] ?? '(none)';
const matchLine = m ? live.slice(0, m.index).split('\n').length : -1;
const inHistory = m ? m.index < live.indexOf('### 2.1g') : false;
check('P4HEADER', headerVer !== 'v1.5' && inHistory,
  `regex matches at line ${matchLine} (index ${m ? m.index : -1}), which is ` +
  `${inHistory ? 'ABOVE' : 'below'} ### 2.1g at ${live.indexOf('### 2.1g')} — i.e. in the ` +
  `append-only version history, not the header. Header line 3 announces ${headerVer}, so the ` +
  `printed note "the document header announces v1.5" is ${headerVer === 'v1.5' ? 'true' : 'FALSE'}`);

console.log(`subject pin ${SUBJECT_PIN.slice(0, 8)} · gate pin ${GATE_PIN.slice(0, 8)} · toplevel ${TOP}`);
for (const l of legs) console.log(`   ${l.ok ? 'ok  ' : 'RED '} ${l.n.padEnd(10)} ${l.note}`);
const ok = legs.every((l) => l.ok);
console.log('');
console.log(`${ok ? 'GREEN' : 'RED'} — ${legs.filter((l) => l.ok).length} of ${legs.length} legs ok`);
process.exit(ok ? 0 : 1);
