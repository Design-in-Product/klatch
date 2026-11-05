// unit-464gentry drive2 — DECLARED POST-HOC, named because P2PINNED came back RED for a reason I
// did not register: `### 2.1g` does not exist at the gate's own PIN (5ba1af73, 2026-11-03 13:07),
// because the entry was authored 24 minutes later. The pin freezes the RECORDINGS, not the entry.
//
// So this drive asks the question P2PINNED was trying to ask, at the only rev that can answer it:
// the commit that introduced the entry. That rev is found mechanically (`log -S`), not recalled.
//
//   node docs/research/unit-464gentry-2026-11-05/drive2-entryrev.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DOC = 'docs/research/LEG-CLASS-CONVENTION.md';
const GATE_PIN = '5ba1af7369e97a3abade0cbd5be4e542e0668971';
const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const g = (a) => execFileSync('git', ['-C', TOP, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const legs = [];
const check = (n, ok, note) => { legs.push({ n, ok, note }); return ok; };

function span(text, startAnchor, endAnchor) {
  const i = text.indexOf(startAnchor);
  if (i < 0) return { err: `start anchor absent: ${startAnchor}` };
  const j = text.indexOf(endAnchor, i + startAnchor.length);
  if (j < 0) return { err: `end anchor absent after start: ${endAnchor}` };
  return { text: text.slice(i, j), i, j };
}

// The introducing rev, derived. `log -S --reverse` over the one path; refuse on an empty listing
// rather than reporting a zero. [[git ls-tree / empty-listing standing instruction, §2.1l]]
const revs = g(['log', '--format=%H', '--reverse', '-S', '### 2.1g', '--', DOC])
  .split('\n').filter(Boolean);
if (revs.length === 0) { console.log('REFUSED — no commit introduces `### 2.1g` in this path'); process.exit(1); }
const ENTRY_REV = revs[0];
const entryRevSubj = g(['log', '--format=%h %ad %s', '--date=format:%Y-%m-%d %H:%M', '-1', ENTRY_REV]).trim();
const pinSubj = g(['log', '--format=%h %ad %s', '--date=format:%Y-%m-%d %H:%M', '-1', GATE_PIN]).trim();

const live = span(readFileSync(DOC, 'utf8'), '### 2.1g', '### 2.1h');
const atEntry = span(g(['show', `${ENTRY_REV}:${DOC}`]), '### 2.1g', '### 2.1h');

// P2bWHY — the registered leg failed because the pin predates the entry. State it as a measurement.
const pinDoc = g(['show', `${GATE_PIN}:${DOC}`]);
check('P2bWHY', !pinDoc.includes('### 2.1g'),
  `the gate's PIN (${pinSubj}) does NOT contain \`### 2.1g\`; the entry arrives at ` +
  `${entryRevSubj} — ${Math.round((Date.parse(g(['log', '--format=%cI', '-1', ENTRY_REV]).trim()) - Date.parse(g(['log', '--format=%cI', '-1', GATE_PIN]).trim())) / 60000)} minutes later. ` +
  `The pin freezes the drive recordings, not the prose the gate reads`);

// P2bFROZEN — is the entry in fact unedited since it was written?
const identical = !live.err && !atEntry.err && live.text === atEntry.text;
check('P2bFROZEN', identical,
  atEntry.err ? `REFUSED at the entry rev — ${atEntry.err}`
    : `tight span at ${ENTRY_REV.slice(0, 8)} is ${atEntry.text.length}B / sha ${sha(atEntry.text)}; ` +
      `live is ${live.text.length}B / sha ${sha(live.text)} — ${identical ? 'byte-identical, so the ' +
      'entry rev IS a usable frozen baseline' : 'DIFFERENT, so the entry has been edited since it was written'}`);

// P2bDIFF — if it moved, say how, rather than reporting a boolean.
if (!identical && !atEntry.err) {
  const a = atEntry.text.split('\n'); const b = live.text.split('\n');
  const changed = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) changed.push(i + 1);
  console.log(`   note  P2bDIFF    ${changed.length} differing lines within the span at span-line ` +
    `${changed.slice(0, 20).join(', ')}${changed.length > 20 ? ' …' : ''}`);
}

console.log(`entry rev (derived) ${ENTRY_REV}`);
for (const l of legs) console.log(`   ${l.ok ? 'ok  ' : 'RED '} ${l.n.padEnd(10)} ${l.note}`);
const ok = legs.every((l) => l.ok);
console.log('');
console.log(`${ok ? 'GREEN' : 'RED'} — ${legs.filter((l) => l.ok).length} of ${legs.length} legs ok`);
process.exit(ok ? 0 : 1);
