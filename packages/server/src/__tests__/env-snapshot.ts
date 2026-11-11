/**
 * Eight test files save, clear or set, and restore a subset of
 * `CLAUDE_CONFIG_DIR` / `KLATCH_EXTRA_SESSION_ROOTS` / `KLATCH_EXPORT_ROOT` /
 * `KLATCH_FINGERPRINT_LINE_CAP` by hand, each with its own copy of the same
 * three-line dance (save, mutate, restore-or-delete). That duplication is how
 * `session-scanner.test.ts` and `round234-...test.ts` ended up isolating only
 * `os.homedir()` and missing `CLAUDE_CONFIG_DIR` entirely (2026-11-10,
 * `docs/research/unit-465cfgdir-2026-11-10/`) — restoring correctly on one
 * axis gives no reason to notice a second one was never saved at all.
 */
export function snapshotEnv(names: readonly string[]): Record<string, string | undefined> {
  return Object.fromEntries(names.map((name) => [name, process.env[name]]));
}

/** Restores exactly what `snapshotEnv` captured — deletes a var that was unset, sets one that wasn't. */
export function restoreEnv(snapshot: Record<string, string | undefined>): void {
  for (const [name, value] of Object.entries(snapshot)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
