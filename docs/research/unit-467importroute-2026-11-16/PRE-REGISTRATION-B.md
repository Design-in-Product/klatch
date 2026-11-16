# unit-467importroute — pre-registration B (added before `arm-importroute-b.mts` exists)

**Pushed to `origin/main` before the arm B file exists.** `PRE-REGISTRATION.md` (`cc3a74e1`) already
carries `B1`–`B4`; this file adds `B5`–`B7`, which arm A's result and one source read made worth
registering. Arm A is already landed and pushed (`fd3672b5`), so nothing here can be read back onto it.

## What arm A changed

`A2` and `A3` both REFUTED, and the finding runs **both** ways:

- My spawn key reads **32**; Argus reported **29**; **Argus's own stated key** —
  `grep -l "spawn('npx', ['tsx', 'src/index.ts']"`, quoted from `ARGUS-ADMISSION-ANSWER.md` — reads
  **28** when I apply it to the same 155.
- Hand-read of the four files in mine and not Argus's: **`probe-round170-floor-frequency.mts:491`**
  (`spawn('npx', ['tsx', 'packages/server/src/index.ts'], {`) and
  **`probe-round250-…:564`** (`spawn('npx', ['tsx', SERVER_ENTRY], {`, with `SERVER_ENTRY` joined at
  `:503`) are **genuine server spawns** that Argus's single-spelling literal cannot see — one for a
  path prefix, one for a variable. **`probe-round252-…:254`** and **`probe-round254-…:413`** are
  classifier **fixture strings** (`FALSE_POSITIVE = \`…spawn('npx', ['tsx', 'packages/server/src/index.ts']);\``)
  that my 4-line proximity window over-collected — the over-reporting shape I already carry a rule
  about, arriving in my own key one unit later.
- So the population is **30**, neither 28 nor 29 nor 32, and **`A3a` reads 0 of 32 drivable**:
  Argus's operational verdict survives the correction to its own population. The two genuine
  spawners the narrow key missed are both already `net`-refused.

## The source read that motivates B5

`packages/server/src/index.ts:66` is `serve({ fetch: app.fetch, port }, (info) => {…})` at **module
top level**, not inside a function. So *importing* that module binds a port. A probe that does so
carries no `createServer`/`listen`/`fetch`/`request` token of its own, which means `DETECTORS.net`
cannot see it either — the same blindness Argus's answer names for `model`, in the class Argus's
answer relies on as the backstop.

## Predictions

- **`B5`** — no live probe imports `packages/server/src/index.ts`.
  Predicate: `appImporters.length === 0`. **I expect to see zero.** A probe wanting the app would
  import `routes` or build its own Hono instance. If this reads non-zero, that file binds a port on
  import with no `net` token in its own source, and the finding is against the backstop class
  itself rather than against `model`.
- **`B6`** — at least one of the six files `--list` currently reports as the unattended candidate
  pool imports something from `packages/server/src`.
  Predicate: `poolImporters.length >= 1`. **I expect to see at least one** — Argus checked the six
  for *spawns* only, and `probe-round218-hono-routes-introspection.mts` is in the pool by name.
- **`B7`** — the corrected spawn population is 30 and every member is `net`-refused.
  Predicate: `trueSpawners.length === 30 && netRefusedTrue.length === 30`, where `trueSpawners` is
  arm A's 32 minus the two hand-read fixture files plus nothing (the two are the only members whose
  `net` membership arm A could not confirm). **I expect to see 30 and 30.** This is the one leg that
  closes arm A's refutations into a figure either seat can quote.

## Declared limits, in addition to `PRE-REGISTRATION.md`'s five

6. **`B7`'s 30 rests on a hand read of four files, not on a key.** The two exclusions are named,
   their fixture-variable names quoted, and the tool's own `net` bucket agrees with the exclusion
   independently — but a hand read of four is a hand read, and a fifth narrow spelling anywhere in
   the 155 would move the figure again. The number is a floor on the population and an exact count
   only of *what both keys plus one hand read have reached*.
7. **`B5`/`B6` key on an import specifier string, not on module resolution.** A probe that reaches
   the app through a re-export, a dynamic `import()` built from a variable, or a path this key spells
   differently is outside the population, in the same way `probe-round250`'s `SERVER_ENTRY` was
   outside Argus's.
