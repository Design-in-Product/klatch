// zw-scan.mjs — Unit 464-T2, 2026-10-28, Theseus
//
// Daedalus's 10/28 memo §5b reports six lines across three files where a
// zero-width space had been used to stop a `*/` from closing a block comment.
// It works, and that is the problem: a ZWSP is undetectable in every diff view
// and in review, so the only way to know a tree is clean is to scan for it.
//
// This scans everything this fire wrote, plus the standing cell it edited, plus
// the mail directory. The code points are built from charCodeAt rather than
// written as literals so that this file is itself scannable without a false hit.
//
// Verdict is a gate: a non-zero count exits 1.

import { readdirSync, statSync, readFileSync } from 'node:fs';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const DIRS = [
  'docs/research/unit-464t2-reaim-2026-10-28',
  'docs/research/round464-instruments',
  'docs/mail',
];
// ZWSP, ZWNJ, ZWJ, word joiner, BOM/ZWNBSP.
const ZW_CODES = [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff];
const ZW_SET = new Set(ZW_CODES);
const EXT = /\.(mjs|mts|md|out|err|json)$/;

let files = 0;
let zeroWidthLines = 0;
const hits = [];

for (const d of DIRS) {
  let entries;
  try {
    entries = readdirSync(`${REPO}/${d}`);
  } catch (e) {
    console.log(`DIR UNREADABLE ${d}`);
    continue;
  }
  for (const f of entries) {
    const rel = `${d}/${f}`;
    const abs = `${REPO}/${rel}`;
    let st;
    try {
      st = statSync(abs);
    } catch (e) {
      continue;
    }
    if (!st.isFile() || !EXT.test(f)) continue;
    // Exclude this scanner's own source by its own path: a hygiene gate that
    // walks the directory it lives in otherwise reddens on itself.
    if (abs === import.meta.filename) continue;
    files++;
    const lines = readFileSync(abs, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (let k = 0; k < line.length; k++) {
        if (ZW_SET.has(line.charCodeAt(k))) {
          zeroWidthLines++;
          hits.push(`${rel}:${i + 1} U+${line.charCodeAt(k).toString(16).toUpperCase()}`);
          return;
        }
      }
    });
  }
}

console.log(`=== ZW-SCAN/464-T2 ===`);
console.log(`DIRS ${DIRS.join(' ')}`);
console.log(`CODEPOINTS ${ZW_CODES.map((c) => 'U+' + c.toString(16).toUpperCase()).join(' ')}`);
for (const h of hits) console.log(`HIT ${h}`);
// This cell's GATE was always live (`if (!ok) process.exit(1)`), but it printed a
// hardcoded `VERDICT/1` even on the pass path, where it exits 0 — so the printed token
// disagreed with the status on every clean run. Derived from one value now. The
// distinction matters beyond cosmetics: a source scan keyed on the argument of
// `process.exit(...)` classified this cell as ungated, which is the false positive
// recorded in unit-464t2-surface-2026-10-28 (S2, drive6) and the reason the legs there
// are keyed on a live drive rather than on source.
const ok = files > 0 && zeroWidthLines === 0;
const code = ok ? 0 : 1;
console.log(`\nVERDICT/${code} ${ok ? 'ok' : 'RED'} files=${files} zeroWidthLines=${zeroWidthLines}`);
process.exit(code);
