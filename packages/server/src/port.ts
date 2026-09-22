/**
 * The port the server binds, and the one environment lever that moves it.
 *
 * **Why this exists (Theseus, Round 250).** Until 2026-09-22 `index.ts` read
 * `const port = 3001;` — a literal with no override. The database path has had
 * `KLATCH_DB` for as long as probes have needed a scratch DB, and the export
 * corpus got `KLATCH_EXPORT_ROOT` in Round 235 for the same reason; the port was
 * the last shared resource a probe could not avoid clobbering. That is why every
 * check which drives a real server lives in a `scripts/` probe nothing schedules
 * rather than in `npm test`: two servers could not coexist, so the suite could
 * not own one. Round 250 drove it — a real server spawned with `PORT=54029` came
 * up on 3001 anyway — and priced the fix at one line.
 *
 * **3001 remains the default and nothing about `npm run dev` changes.**
 * `packages/client/vite.config.ts` proxies to 3001; unset `PORT` and the server
 * binds exactly what it bound before.
 *
 * **`PORT=0` asks the OS for a free port.** Callers should read the port back
 * from the startup banner (`info.port`), never from what they requested — that
 * is the only value that survives `PORT=0`, and it closes the gap between
 * checking a port is free and binding it.
 *
 * **Unset, empty, or whitespace means unset**, matching `getExportRoot()` in
 * `paths.ts`. Not a hypothetical: the note above `dotenv.config()` in `index.ts`
 * records that Claude for Mac hands this process `ANTHROPIC_API_KEY=""`, so an
 * empty string here is how the environment spells absent.
 *
 * **Anything else throws, and names `PORT`.** Node rejects a bad port itself
 * (`ERR_SOCKET_BAD_PORT`, measured 2026-09-22 for `NaN`, `-1` and `70000`), but
 * its message describes `options.port` and says nothing about an environment
 * variable, which is the part a caller can act on.
 *
 * **Decimal digits only.** `Number()` alone would accept `0x10` as 16 and `1e3`
 * as 1000 — caught by this file's own tests on the first run. A port written as
 * hex in an environment variable is far likelier to be a typo than an intention,
 * and silently binding something other than what the caller wrote is the exact
 * failure mode the lever exists to remove.
 */
export const DEFAULT_PORT = 3001;

/** Trim, and treat empty or whitespace-only as absent. See the note above. */
export function fromEnv(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Resolve a port from an already-normalised environment value.
 *
 * Pass the *first* value that `fromEnv` reports present, in the caller's order of
 * precedence — see `index.ts`, where a `PORT` supplied by whoever spawned the
 * process outranks one read out of `.env`.
 */
export function resolvePort(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_PORT;
  const n = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isInteger(n) || n < 0 || n > 65535) {
    throw new Error(`PORT must be an integer between 0 and 65535; got ${JSON.stringify(raw)}`);
  }
  return n;
}
