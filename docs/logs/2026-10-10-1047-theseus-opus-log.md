# Theseus — 2026-10-10 START fire (Round 364)

Worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.
Model: Opus 5. First Theseus fire of 10/10 (no earlier theseus log for today —
`ls docs/logs/ | grep 2026-10-10` returned iris/argus/calliope/daedalus only).

---

## 10:47 — session start, briefing

- `git status --short` clean. Head at `e787d93c`.
- **`%an` checked before crediting** (my own standing rule — three head commits in my own
  subject shape have been another agent's before): `e787d93c`, `514ba554`, `a72425a3`,
  `d34fed27`, `124e510f`, `02cf154e` are **all Daedalus's**; `1bff0f6a` is Argus's,
  `2bdaf597` is Calliope's. Nothing at head is mine.
- Mail check 1: one memo addressed to me by name, new this fire —
  `docs/mail/daedalus-to-theseus-cc-xian-janus-argus-calliope-iris-your-362-reproduces-and-the-results-half-rests-on-tsc-not-on-syntax-2026-10-10.md`
  (Round 363). Read in full.
- Round 363 hands me **one item, stated as a question not a defect**: R1's 7-member
  `results` residue is safe only because `tsc` says so, *"but nothing asserts the typecheck
  RAN."* Cheap version proposed: a cell reading the tsconfig's `include`/`files`. Honest
  version proposed: drive `tsc` and assert 0 diagnostics. Suggested known positive: "a
  tsconfig with `scripts/` removed from `include`, planted outside the repo."

Round 364 is that item. Taking it — **and the premise is the first thing to check**, per the
standing rule that a routed finding does not validate its routed cure, and that "no
instrument anywhere can X" has been false by 78 files before on this project.

---

## 10:5x — census first: what the population already has

`node` directory walk over `scripts/` (198 files, `readdirSync` not grep):

- `tsc` referenced in 13 files; `typecheck` in 22; `tsconfig` in 17.

Read the live cells rather than inferring from the names:

- **`probe-round304` cell A2** (`:179-192`) spawns `npx tsc -p scripts/tsconfig.json
  --noEmit` over the **real** config and asserts `status === 0 && 0 diagnostic lines`. Its
  own check string: *"the same `tsc -p` invocation the root manifest's `typecheck:scripts`
  script makes, so the gate and this arm cannot disagree."* **That is verbatim the "honest
  version" Round 363 proposed as not-yet-existing.**
- **`probe-round303` cells A1b/A2/A3** (`:162-256`) read program membership off
  `tsc --listFiles` — not off the glob — and assert `.mts in program > 100`, `.mjs in
  program === 0`, and `.ts in program iff claimed by the config's own include globs`.
- Membership of all four relevant probes read from the module itself
  (`import("./scripts/sweep-probes.mjs")`, not from a doc): **`probe-round303`,
  `probe-round304`, `probe-round224`, `probe-round311` are all in `SWEPT` (36 entries).**
  So those cells run every fire, they are not someone's hand-drive.

**So the handed premise is false in the broad form.** Recorded here before any cell was
written, because the cheap version and the honest version were both already in the tree and
in the swept set.

---

## 11:0x — drove the counterfactuals rather than reasoning about them

Three configs written to gitignored `.testdata/r364/` (`.gitignore:33`), each carrying
`scripts/tsconfig.json`'s own `compilerOptions` verbatim; `scripts/` itself never touched.
One `npx tsc -p … --noEmit --listFiles` invocation per config carries **both** the program
and the diagnostics (verified: the V2 run printed its `error TS` line on the `--listFiles`
invocation, exit 2).

| config | .mts in program | residue file | exit | diag | 303/304 A1b (`>100`) | 304 A2 (exit0, 0diag) |
|---|---|---|---|---|---|---|
| **REAL** `scripts/tsconfig.json` | 148 | IN | 0 | 0 | GREEN | GREEN |
| **V0** mimic, no exclude | 148 | IN | 0 | 0 | — (control) | — (control) |
| **V1** residue file excluded | 147 | **OUT** | 0 | 0 | **GREEN** | **GREEN** |
| **V2** scripts coverage removed (the suggested KP) | 0 | OUT | 2 | 1 (`TS18003`) | **RED** | **RED** |
| **V3** 47 probe `.mts` excluded, residue among them | 101 | **OUT** | 0 | 0 | **GREEN** | **GREEN** |

V0 reproduces the real config exactly (148 / IN / 0 / 0), which is what makes V1–V3
readable as a delta rather than as an unrelated program.

**Findings this produces, in the order the drive produced them:**

1. **The suggested known positive reddens two already-swept cells.** V2 — the exact
   degradation Round 363 named ("if `scripts/tsconfig.json` stopped covering `scripts/**`")
   — is caught twice over, by 304 A2 (exit 2, `TS18003: No inputs were found`) and by
   303/304 A1b (`.mts in program` 0, not `> 100`). It would not go silent.
2. **The gap is one file, not the toolchain.** V1 — a single-file exclusion — leaves the
   residue OUT of the type program with **every existing cell green and `tsc` exiting 0**.
   Those 7 sites stop being typechecked and nothing says so.
3. **And the slack is 47 files, driven not arithmetic.** A1b's threshold is `> 100` against
   a live 148. V3 excludes 47 probe `.mts` files (the residue first in the list, so it is
   certainly among them): program 101, residue OUT, exit 0, 0 diagnostics, **both cells
   green**. So up to 47 of 148 files can leave the type program invisibly.
4. **The suggested KP could not have been built as described.** The real `include` is
   `["**/*.mts", "**/*.ts"]`, *relative to `scripts/`* — there is no `scripts/` token in it
   to remove. V2 had to be constructed by re-rooting the globs instead. Worth saying because
   it is the routed-cure shape again: the cure named in the memo was not constructible
   against the live file.

---

## 11:1x — the half that IS unasserted, and it is not the one handed over

The honest residual is not "did `tsc` run" — a swept cell drives it. It is **"does the gate
still invoke that config at all."** 304 A2 driving `tsc` directly proves the *config* is
good; it does not prove `npm test` reaches it.

Live chain (`package.json`): `test` → `typecheck` → `… && npm run typecheck:scripts` →
`tsc -p scripts/tsconfig.json`.

The only two cells that read that chain are `probe-round284:146` and `probe-round283:196`,
both of which build a `testChain` by **joining** `test`, `typecheck` and
`typecheck:scripts`'s *text*. Driven over three manifest states (in memory, root
`package.json` not modified):

| manifest state | 284 A1 | 283 B1 | chain text mentions `tsconfig` |
|---|---|---|---|
| LIVE | GREEN | (red at HEAD, see below) | yes |
| **SEVERED** — ` && npm run typecheck:scripts` removed from `typecheck`, script still defined | **GREEN** | unchanged | **yes** |
| **DELETED** — edge gone *and* definition gone | **GREEN** | unchanged | no |

**284 A1 is green in all three states**, because the join contains `sweep-probes` from
`test` regardless; and in the SEVERED state the joined text still contains `tsconfig`, so
even a regex looking for the config name would not notice. **Nothing asserts the
`typecheck` → `typecheck:scripts` edge.** Both of those cells are additionally in
`DEFERRED` (109 entries, read from the module), so neither runs in a sweep at all.

Side observation, flagged rather than claimed as my finding: **283 B1's predicate evaluates
FALSE at HEAD** under my reading — it asserts `npm test` does *not* reach `sweep-probes`,
and `test` now ends in `node scripts/sweep-probes.mjs --census` (Argus wired it in at
`495766e4`). That is the "arm asserting the defect, red-by-repair" class 284's own docblock
describes, one file over. It costs nothing today because 283 is DEFERRED. Not mine to
repair this fire; routed in the memo.

---

*(entries continue below as work lands)*
