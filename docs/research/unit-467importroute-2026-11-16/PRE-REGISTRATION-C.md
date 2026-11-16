# unit-467importroute — pre-registration C (added before `arm-importroute-c.mts` exists)

**Pushed to `origin/main` before the arm C file exists.** Arms A (`fd3672b5`) and B (pushed with
this file's predecessor) are landed, so nothing here can be read back onto them.

## What arm B settled, and the one thing it could not

- **`B1` LANDED, and it is the sharpest fact in the unit.** A minted probe whose body is
  `import { streamClaude } from '../packages/server/src/claude/client.js'` + a call carries
  `hazards(…) = [(none)]` — **not merely no `model`/`net`: no hazard at all.** Such a file is fully
  admissible and `promote-probes.mts` would drive it unattended. `B1b` is the two-sided control: the
  same `hazards()` returns `[model]` on a fixture that names the SDK, so the empty reading is a
  property of the import route, not a dead key.
- **`B3` REFUTED at 0, and `B5` LANDED at 0.** No live probe imports `claude/client`'s model exports
  without also carrying `model`/`net`; no live probe imports `packages/server/src/index.ts`.
  **Argus's reach claim survives on both populations** and I record it as surviving.
- **`B6` LANDED at 1.** `probe-browse-count-vs-persisted-rows.mts` — a member of the six the tool
  reports as its *current unattended pool* — imports `packages/server/src/import/session-scanner.js`
  and `…/import/parser.js` and carries `hazards [(none)]`. In-process product imports by admitted
  pool members are not hypothetical; they are already the norm.

What arm B could not settle is its own **declared limit 2**: it keyed on direct import of the two
`client.ts` exports I had read. A probe that imports *any* module which **transitively** reaches
`messages.create` has the same exposure and is outside arm B's population. `B3`'s zero is therefore
a zero over a narrow key, and a zero over a narrow key is the one result that needs the limit lifted
before it can be published as an absence.

## Arm C — compute the reach instead of keying on two names

Build the import graph of `packages/server/src` from the source, find every module that reaches
`messages.create` through it, then ask which of the 155 probes import any of them, and what
`hazards()` says about those probes.

- **`C0` (KNOWN POSITIVE, first)** — the walker finds `claude/client.ts` itself in the reaching set.
  Predicate: `sinkReachers` includes `claude/client.ts`. **I expect to see it**; if it does not, the
  graph walk is broken and every count below it is uninterpretable.
- **`C1`** — the reaching set is larger than `client.ts` alone.
  Predicate: `sinkReachers.length >= 2`. **I expect to see at least 2** — the message routes import
  the client.
- **`C2`** — at least one of the 155 probes imports a transitively model-reaching module.
  Predicate: `probeReachers.length >= 1`. **I expect to see at least one.**
- **`C3`** — at least one such probe carries neither `model` nor `net`.
  Predicate: `cleanReachers.length >= 1`. **I expect to see at least one.** This is `B3` with the
  limit lifted, and it is the prediction that decides whether the gap has a live instance. If it
  reads 0, Argus's reach claim survives the widened population too and I will say so without
  softening it.
- **`C4`** — at least one *member of the current six-file unattended pool* imports a transitively
  model-reaching module.
  Predicate: `poolReachers.length >= 1`. **I expect to see zero** and am registering the predicate in
  the direction that would be the finding, so the label cannot read the wrong way: a LANDED `C4`
  means a file the tool will drive today is one in-process call away from the API. (Predicate and
  expectation point opposite ways here **deliberately and stated**: this is the `T2` defect from
  unit-467rawjson named out loud rather than repeated. The verdict line will read `refuted=[C4]` if
  I am right that it is zero — so the prose below is what a reader must use, not the label.
  Corrected form, to keep the rule I wrote yesterday: **`C4`'s predicate is
  `poolReachers.length === 0` and I expect to see zero**, so LANDED means "no pool member reaches
  the model" and REFUTED means "one does, and that is the live instance.")

## Declared limits

8. **The graph is built from static `from '…'` / `import('…')` specifiers under
   `packages/server/src`, resolved by extension-swapping `.js`→`.ts`.** A module reached through a
   re-export chain this resolver cannot follow, a bare package specifier, or a dynamic path built
   from a variable is outside the graph — so `sinkReachers` is a **floor**, and `C2`/`C3` zeros are
   zeros over that floor. `C0` is the control that the floor is non-empty and correctly seeded.
9. **`messages.create` is the only sink.** A model call made through some other SDK surface is not
   in the sink set.
10. **A probe importing a reaching module is not a probe that calls it.** The call census is printed
    separately, as in arm B (`B2b`), and no prediction keys on an import being a call.
