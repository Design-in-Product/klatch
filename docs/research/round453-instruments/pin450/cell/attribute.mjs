// Attribution cell for Round 453 §2 — driven, not argued.
//
// Claim: Round 450's commit `fd7c346d` ("rows get the three guards the verdict line has had since
// 444") is what kills Round 449's `resolve-the-variable-write-targets.mjs`. The same commit carries
// the `DUPLICATE_ROW_ID` guard Daedalus's Round 452 §5 found had killed Round 446. One commit, two
// victims, one round apart.
//
// This cell does NOT re-run the whole 449 instrument — that instrument resolves a repo root three
// levels up and censuses a population, neither of which survives relocation to a scratch depth
// (447: a scratch copy at the wrong depth refuses every cell). It isolates the mechanism instead:
// the ONE call that now throws, driven against both libs.
//
// It is a 2x2, not a single cell. Without the newline-free CONTROL row, "the old lib accepted it"
// could just mean the old lib accepted anything.
//
//   arm        detail                     expectation
//   PRE-450    contains a newline         accepted   <- the victim's own shape
//   PRE-450    no newline                 accepted   <- control: the old lib is not vacuously open
//   HEAD       contains a newline         THROWS     <- the guard
//   HEAD       no newline                 accepted   <- control: the guard is not refusing everything
//
// Both libs are reached through `../lib/verdict.mjs` from a sibling `cell/` dir, so the import
// specifier is the real one and the depth matches a round-instrument dir exactly.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// the victim's real detail shape: 449 line 823-842 builds a leg detail with embedded "\n        "
const WITH_NEWLINE = 'THE EXTRACTOR READS CALL SITES, NOT TOKENS\n        population 171 file(s)';
const NO_NEWLINE = 'THE EXTRACTOR READS CALL SITES, NOT TOKENS · population 171 file(s)';

const PRE = join(HERE, '..', 'lib', 'verdict.mjs');
const LIVE = join(HERE, '..', '..', '..', 'lib', 'verdict.mjs');

/** Does this lib copy even contain the guard? Keyed on source, printed, so the arms cannot be
 *  silently identical (338: identical runs read as no effect when both are the same file). */
const hasGuard = (p) => /detail contains a newline/.test(readFileSync(p, 'utf8'));

async function cell(libPath, detail) {
  const m = await import(libPath);
  try {
    const out = m.renderRows([{ id: 'W1', ok: true, what: detail }]);
    return { threw: false, lines: out.length };
  } catch (e) {
    return { threw: true, msg: e.message.slice(0, 60) };
  }
}

const rows = [];
for (const [arm, libPath] of [['PRE-450', PRE], ['HEAD', LIVE]]) {
  for (const [kind, detail] of [['newline', WITH_NEWLINE], ['no-newline', NO_NEWLINE]]) {
    rows.push({ arm, kind, guard: hasGuard(libPath), ...(await cell(libPath, detail)) });
  }
}

console.log(`pin ${'fd7c346d'}^ · PRE-450 lib carries the newline guard: ${hasGuard(PRE)} · HEAD lib carries it: ${hasGuard(LIVE)}`);
console.log('');
for (const r of rows) {
  console.log(`${r.arm.padEnd(8)} ${r.kind.padEnd(11)} ${r.threw ? `THREW  ${r.msg}` : `accepted (${r.lines} row line(s))`}`);
}

// the 2x2 read as a separation, gated — and the ARMS must differ, or the cell measured nothing
const get = (a, k) => rows.find((r) => r.arm === a && r.kind === k);
const checks = {
  'PRE-450 accepts the victim shape': get('PRE-450', 'newline').threw === false,
  'HEAD refuses the victim shape': get('HEAD', 'newline').threw === true,
  'PRE-450 control accepted': get('PRE-450', 'no-newline').threw === false,
  'HEAD control accepted': get('HEAD', 'no-newline').threw === false,
  'the two arms are not the same file': hasGuard(PRE) === false && hasGuard(LIVE) === true,
};
console.log('');
for (const [k, v] of Object.entries(checks)) console.log(`${v ? 'ok ' : 'RED'} ${k}`);
const red = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
console.log(`\nATTRIBUTION/1 ${red.length === 0 ? 'ok' : 'RED'} cells=4 red=[${red.join(' | ')}]`);
