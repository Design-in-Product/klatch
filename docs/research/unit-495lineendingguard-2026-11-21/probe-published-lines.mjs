#!/usr/bin/env node
/**
 * **P5: is split-on-`\n` load-bearing, or is one line per call good enough?**
 * `unit-495lineendingguard`, 2026-11-21, Daedalus.
 *
 * Theseus's §2 (`unit-494`, 11/20) measured **34 executed `console.log` calls → 38 published lines,
 * 4 chunks containing a newline**, and made split-on-`\n` a condition on the build. This probe
 * re-derives those three figures **under this seat's own emitter**, from the live gate, rather than
 * taking them off his list — the invariance his §3 rightly valued above the figure.
 *
 * **Mechanism: `--import` interception, so the subject is never edited.** Node loads this module
 * before the gate, it wraps `console.log`/`console.error`, tallies, re-dispatches to the original,
 * and prints the tally to **stderr** on exit so the published capture on stdout stays byte-clean.
 * Run as:
 *
 *   node --import ./docs/research/unit-495lineendingguard-2026-11-21/probe-published-lines.mjs \
 *        scripts/verify-decl-body-slicers.mjs
 *
 * **A zero here would measure the reader, not the gate**, so the tally ships with a KNOWN POSITIVE:
 * the same counting code is run over a synthetic two-line chunk before the gate publishes anything,
 * and must report 1 newline-bearing chunk and 2 lines. If the KP reads 0, every figure below is
 * void and the probe says so instead of printing a clean zero.
 */
const LABELS = ['MARKED', 'GUARDED', 'UNGUARDED'];

function tally(chunks) {
  let lines = 0, withNewline = 0, labelTerminal = 0, notFirstLine = 0;
  for (const c of chunks) {
    const parts = String(c).split('\n');
    lines += parts.length;
    if (parts.length > 1) { withNewline += 1; notFirstLine += parts.length - 1; }
    for (const l of parts) if (LABELS.some((v) => l.endsWith(v))) labelTerminal += 1;
  }
  return { calls: chunks.length, lines, withNewline, notFirstLine, labelTerminal };
}

// KNOWN POSITIVE, run before the subject publishes anything.
const kp = tally(['one line', 'two\nlines', '  this line ends in GUARDED']);
const kpOk = kp.calls === 3 && kp.lines === 4 && kp.withNewline === 1
  && kp.notFirstLine === 1 && kp.labelTerminal === 1;

const out = [];
const err = [];
const realLog = console.log.bind(console);
const realErr = console.error.bind(console);
console.log = (...args) => { out.push(args.length === 1 ? args[0] : args.join(' ')); realLog(...args); };
console.error = (...args) => { err.push(args.length === 1 ? args[0] : args.join(' ')); realErr(...args); };

process.on('exit', () => {
  const o = tally(out);
  const e = tally(err);
  const w = (s) => process.stderr.write(`${s}\n`);
  w('');
  w('probe-published-lines — chunks vs LINES, measured through the gate\'s own emitter');
  w(`  KP (synthetic, 3 chunks / 4 lines / 1 newline-bearing / 1 label-terminal): ${kpOk ? 'PASS' : 'FAIL — every figure below is void'}`);
  w(`  stdout: calls ${o.calls} · published lines ${o.lines} · chunks carrying \\n ${o.withNewline}`
    + ` · lines a per-CALL guard cannot see ${o.notFirstLine} · label-terminal ${o.labelTerminal}`);
  w(`  stderr: calls ${e.calls} · published lines ${e.lines} · chunks carrying \\n ${e.withNewline}`
    + ` · lines a per-CALL guard cannot see ${e.notFirstLine} · label-terminal ${e.labelTerminal}`);
  w(`  VERDICT: split-on-\\n is ${o.notFirstLine > 0 ? 'LOAD-BEARING' : 'NOT load-bearing'}`
    + ` — ${o.notFirstLine} of ${o.lines} published stdout lines (`
    + `${((o.notFirstLine / o.lines) * 100).toFixed(1)}%) are not the first line of their chunk.`);
});
