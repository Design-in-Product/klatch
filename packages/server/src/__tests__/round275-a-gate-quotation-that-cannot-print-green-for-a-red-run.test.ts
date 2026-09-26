/**
 * Round 275 — the counts we quote to each other are invariant to an uncaught error.
 *
 * Theseus, Round 274 §3: `npm test` went red one run in three on the commit that shipped Round
 * 273, and the red run printed `137 · 2149 · 1` — the SAME triple as the green run, and the same
 * triple that had already been published in a memo as evidence the gate was clean. Only the exit
 * code and one extra `Errors` line distinguished them, and neither was in the quotation.
 *
 * The fixtures below are the real captures: the green one from this tree this fire, the red one
 * transcribed from Round 274 §3. The point of the file is the FIRST test — the two runs produce
 * identical count triples, which is the defect stated as a measurement rather than as a worry.
 */
import { describe, it, expect } from 'vitest';
import { readCounts, renderGate } from '../../../../scripts/lib/gate-line.mts';

/** A green server run on this tree, 2026-09-26. */
const GREEN = `
 Test Files  137 passed (137)
      Tests  2149 passed | 1 skipped (2150)
   Start at  09:20:11
   Duration  41.02s
`;

/** Theseus's red run, Round 274 §3 — `.testdata/r274/npm-test.txt` on his tree. */
const RED = `
 Test Files  137 passed (137)
      Tests  2149 passed | 1 skipped (2150)
     Errors  1 error
   Start at  21:14:52
   Duration  44.61s

Uncaught Exception: setTypeOfService EINVAL   ❯ Socket.setTypeOfService node:net:829:13
  ❯ writeH1 node:internal/deps/undici/undici:7973:16
This error originated in "src/__tests__/round249-the-ownership-guard-drives-its-own-matrix.test.ts"
npm error code 1
`;

describe('the defect, measured', () => {
  it('the red run and the green run print the same counts', () => {
    const green = readCounts(GREEN);
    const red = readCounts(RED);
    expect(red.files).toBe(green.files);
    expect(red.tests).toBe(green.tests);
    // So a quotation built from files+tests alone is literally the same string for both, which
    // is how a red run got published as a clean gate. This is the line to look at.
    expect(`${red.files} / ${red.tests}`).toBe(`${green.files} / ${green.tests}`);
    // The one count that did move.
    expect(green.errors).toBe(0);
    expect(red.errors).toBe(1);
  });
});

describe('renderGate makes the two quotable apart', () => {
  it('a green run leads with ok and its own exit code', () => {
    const line = renderGate('server', 0, GREEN);
    expect(line.startsWith('GATE ok exit=0 server')).toBe(true);
    expect(line).toContain('137 passed (137)');
    expect(line).toContain('2149 passed | 1 skipped (2150)');
    expect(line).toContain('errors: 0');
  });

  it('a red run leads with RED however green the counts look', () => {
    const line = renderGate('server', 1, RED);
    expect(line.startsWith('GATE RED exit=1 server')).toBe(true);
    expect(line).toContain('errors: 1');
    // And it still carries the counts, because they were never the problem.
    expect(line).toContain('2149 passed | 1 skipped (2150)');
  });

  it('the two lines differ — the property the whole module is for', () => {
    expect(renderGate('server', 1, RED)).not.toBe(renderGate('server', 0, GREEN));
  });

  it('a non-zero status cannot render the green token, whatever the text says', () => {
    // The adversarial case: a run that exited 1 but whose captured text is a perfect green
    // summary. That is exactly Theseus's run minus the Errors line, and it must still read RED.
    const line = renderGate('server', 1, GREEN);
    expect(line.startsWith('GATE RED exit=1')).toBe(true);
    expect(line).not.toContain('GATE ok');
  });

  it('a run killed before it printed anything renders RED, not empty', () => {
    // `spawnSync` reports `status: null` for a signal-killed child — the 2400 s fire timeout is
    // exactly this, and a quotation that silently rendered blank counts as ok would be the worst
    // available failure.
    const line = renderGate('server', null, '');
    expect(line.startsWith('GATE RED exit=null (killed)')).toBe(true);
    expect(line).toContain('(no Test Files line)');
    expect(line).toContain('(no Tests line)');
  });

  it('strips vitest colour so a TTY run and a redirected run quote identically', () => {
    const coloured = GREEN.replace('137 passed', '\u001b[32m137 passed\u001b[39m');
    expect(renderGate('server', 0, coloured)).toBe(renderGate('server', 0, GREEN));
  });
});
