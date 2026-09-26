/**
 * One canonical way to quote a gate run, so that a red run cannot be quoted as a green one.
 *
 * ## Why this exists
 *
 * Theseus, Round 274 §3. `npm test` went red one run in three on the commit that shipped Round
 * 273, and it printed:
 *
 * ```
 *  Test Files  137 passed (137)
 *       Tests  2149 passed | 1 skipped (2150)
 *      Errors  1 error
 * npm error code 1
 * ```
 *
 * `137 · 2149 · 1` is exactly the triple the green run prints, and exactly the triple that had
 * been quoted in a memo as evidence the gate was clean. **The counts we quote to each other are
 * invariant to this failure.** The run was red, the exit code said so, and nothing in the figures
 * did. Round 223's `0/0 checks passed` finding arriving in how we report gates rather than in a
 * probe — a summary that cannot go red is not a summary.
 *
 * ## The property this file has, stated as a property
 *
 * `renderGate` is a total function from (exit status, captured output) to one line, and for any
 * two runs that differ in status or in error count, the two lines differ. The counts are still
 * there — they are useful — but they are no longer the whole quotation, and the leading token is
 * the one thing that was load-bearing all along.
 *
 * A green run renders `GATE ok exit=0 …`; anything else renders `GATE RED exit=<n> …`. There is
 * no argument that makes a non-zero status print `ok`.
 *
 * ## Why parse rather than just print the status
 *
 * Because the counts are what a reader wants, and telling people "also mention the exit code"
 * is a discipline, not a mechanism — this project has watched that kind of instruction decay
 * five times this month. A single function that emits the whole quotation is the mechanism.
 */

import { spawnSync } from 'child_process';

/** Vitest colours its summary; a quotation must not depend on whether a TTY was attached. */
function plain(text: string | undefined): string {
  // eslint-disable-next-line no-control-regex
  return String(text ?? '').replace(/\u001b\[[0-9;]*m/g, '');
}

function firstMatch(text: string, re: RegExp, fallback: string | null = null): string | null {
  const m = text.match(re);
  return m ? m[1] : fallback;
}

/**
 * Pull the numbers vitest prints. Every one of these is optional on purpose: a run that crashed
 * before printing a summary must still render a line, and it must render a RED one.
 */
export function readCounts(rawText: string | undefined): {
  files: string | null; tests: string | null; errors: number;
} {
  const text = plain(rawText);
  const files = firstMatch(text, /Test Files\s+(.*)$/m)?.trim() ?? null;
  const tests = firstMatch(text, /^\s*Tests\s+(.*)$/m)?.trim() ?? null;
  // `Errors  1 error` is the line the red run had and the green run did not. It is the only part
  // of the summary that moved, so it is quoted explicitly rather than folded into "everything
  // else"; a reader comparing two memos should be able to see which one it was.
  const errors = Number(firstMatch(text, /^\s*Errors\s+(\d+)\s+error/m, '0'));
  return { files, tests, errors };
}

/**
 * The quotation. `status` is the subject's own exit code — `spawnSync`'s `r.status`, never a
 * shell's `$?` after a pipe and never `; true`, both of which have masked a real status on this
 * project inside the last month.
 */
export function renderGate(label: string, status: number | null, rawText: string | undefined): string {
  const { files, tests, errors } = readCounts(rawText);
  const green = status === 0;
  const head = `GATE ${green ? 'ok' : 'RED'} exit=${status === null ? 'null (killed)' : status}`;
  const parts = [
    `${head} ${label}`,
    `files: ${files ?? '(no Test Files line)'}`,
    `tests: ${tests ?? '(no Tests line)'}`,
    `errors: ${errors}`,
  ];
  // ` · ` and not ` | `: vitest's own count strings contain `|` ("2149 passed | 1 skipped"), so a
  // pipe separator makes the line ambiguous to anything that later tries to split it back apart.
  //
  // The check below is what makes the docstring's claim true rather than intended. If a future
  // edit ever lets a non-zero status render the green token, this throws instead of publishing a
  // quotation that is wrong in the one way this file exists to prevent.
  const line = parts.join(' · ');
  if (line.startsWith('GATE ok') !== green) {
    throw new Error(`renderGate would have quoted a run with the wrong token: ${line}`);
  }
  return line;
}

/** Run a gate command and quote it. Returns `{ status, line, text }`; never throws on a red. */
export function runGate(
  label: string, cmd: string, args: string[], opts: Record<string, unknown> = {},
): { status: number | null; line: string; text: string } {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
  const text = (r.stdout ?? '') + (r.stderr ?? '');
  return { status: r.status, line: renderGate(label, r.status, text), text };
}
