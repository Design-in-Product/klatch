# Round 70 — the probe-side tap is built, and a wrong join is wrong in both directions at once

**Theseus, 2026-08-21 (STOP fire).**
**Cost: zero API calls, zero live runs, no server started.** Six local runs, two of them the
full suite, three of them negative controls.
**Changed:** `scripts/lib/recall-tap.mjs` (new), `scripts/probe-recall-tool.mjs` (+131/−1),
`packages/server/src/__tests__/round71-probe-tap-joins-the-wire-to-the-artifact.test.ts` (new,
test-only). **No tracked file under `packages/` was modified** — `git diff --stat -- packages/`
empty, checked before committing.

---

## 1. What was assigned, and by whom

Daedalus's 8/21 STOP memo
(`daedalus-to-theseus-cc-xian-team-two-thirds-of-the-tap-was-free-…`) took the sequencing
decision I had left as a recommendation: build the tier-two tap **before** the arm, because the
premise that it "cannot be exercised without spend" holds for less of it than it looks. The tap
has three parts and only one needs a live turn:

1. **client → emitter** — already pinned before this fire (`round52b`).
2. **emitter → SSE frame** — free, and he pinned it this fire after finding
   `routes/messages.ts:383` had **no test at all**: his mutation dropped `toolInput` before
   `JSON.stringify` and *nothing in the other 84 files noticed*.
3. **a real turn emitting in time** — only this needs the arm.

His §3 then split the work and handed me the half he would not touch: *"the server end is proven
and free; the probe end is yours"*, with two constraints asked for rather than assumed —
failure isolation, and the lost-race silence being visible in the **per-run JSON** rather than
only in the console of the fire that produced it. His stated reason for not taking it is
instrument ownership, not effort: `probe-recall-tool.mjs` is mid-experiment and Round 58's
refusal to change an instrument on argument binds him harder than it binds me.

This is that half.

## 2. What the tap is for, restated so the doc stands alone

`createToolUseArtifact` (`db/queries.ts:1526`) persists `input_summary` and nothing else. So two
different calls collapse into one artifact row:

| the model sent | `readExpandArg` | artifact row |
|---|---|---|
| `{expand: {conversation, from: '12', to: '38'}}` | rejects (strings, not numbers) | `Searched own conversations: ` |
| `{query: ''}` | n/a | `Searched own conversations: ` |

Byte-identical. Round 69's detector marks that row for hand adjudication; **it cannot diagnose
it**, and it says so where the field is defined. The wire can: `client.ts:896-903` emits
`toolInput: toolUse.input` **raw**, four lines before `executeTool` at `:905` runs
`readExpandArg`. So a rejected expand is on the wire intact.

## 3. The build

`scripts/lib/recall-tap.mjs` — reader, join, verdicts, run summary. `probe-recall-tool.mjs`
subscribes immediately after the POST and reads the capture after `settle()`.

**Neither `readExpandArg` nor the summary grammar is reimplemented.** Whether an expand was
*accepted* is read from the artifact summary's `kind` (via `recall-call-kind.mjs`, which
`verify-empty-tail-detector.mjs` certifies against the real producer). Whether an expand was
*present* is a key test on the frame's raw `toolInput`. Two independent sources; a local copy of
`readExpandArg` would have made it one source twice and agreed with itself.

The join is **positional, verified by summary equality, and required to be unique**:

- *positional*, because `client.ts` emits (`:896`) and then executes (`:905`) inside one
  sequential loop, so both lists are written in the same order;
- *summary-verified*, because the frame's `inputSummary` comes from the **same**
  `toolUseInputSummary(name, input)` call the artifact will store (`:892` and `:658`) —
  byte-identical by construction, so a disagreement is evidence of drift, not of formatting;
- *unique*, for the reason §5 measures.

## 4. Daedalus's §2 correction, adopted, and it is a correction to me

I had written that "the route already handles a late subscriber, so the race is designed for."
Handled for **liveness**, not for **capture**. `routes/messages.ts:300-320`, read this session:
a subscriber arriving after the turn settles gets one `message_complete` rebuilt from the DB.
**No `tool_use` frames are replayed** — nothing replays them and `toolInput` is persisted
nowhere. A lost race therefore yields a body **byte-indistinguishable from a turn that called no
tool**: the quiet hole the tap exists to close, reproduced one layer up inside the instrument.

The rule that follows is enforced in code rather than written in a docblock a reader skims.
`startRecallTap` deliberately **does not set a status** — it has not been shown the artifact rows
and so *cannot* tell `lost-race` from `no-calls`. `alignTapToCalls` decides, and the two are
distinct values for the same observed bytes. A test asserts both halves, so if they ever collapse
to one value the scoring rule stops existing loudly rather than quietly.

## 5. The finding: a wrong join is wrong in both directions simultaneously

I required the alignment to be unique and wrote that guessing "answers the tap's own question by
coin flip." That was an argument. **Control C ran it**, and the real cost is worse than the phrase
suggests.

Two calls, one shared summary (`Searched own conversations: `), one surviving frame — which is
what losing the subscribe race by a hair produces. Call 1 was a genuine `{query: ''}`; call 2 was
a dropped expand. With the uniqueness check disabled:

```
status  : partial
offset  : 0
verdicts: ["dropped-expand","no-frame"]
```

The frame that came from **call 2** is attached to **call 1**. So one guess produces two wrong
answers at once: the genuine empty search is **falsely diagnosed** as a dropped expand, and the
real dropped expand is **reported as unseen**. Not a coin flip — a coin flip would be right half
the time on one call. Refusing to attach leaves both calls exactly as Round 69 scored them, which
is why refusal is always the safe branch.

## 6. Controls — all three run, none skipped

| control | mutation | result |
|---|---|---|
| **A (production)** | `routes/messages.ts:383` destructures `toolInput` off before `JSON.stringify` — Daedalus's own control | **5 of 7 red**, every one a named `AssertionError` (`expected [ 'no-frame' ] to deeply equal [ 'dropped-expand' ]`), never a crash |
| **B (module)** | `readTapVerdict` ignores `expandPresent` | **1 red — and it is the only test that noticed**, exactly the discriminator case |
| **C (module)** | uniqueness check disabled | **1 red**, plus §5's measured wrong answer |

**Control A's unlooked-for result.** The two tests that stayed green under it are precisely the
two that do not depend on the wire carrying `toolInput` — the lost-race test and the
failure-isolation test. That is not a gap: under a production change that silently strips the
field, the tap **degrades to `no-frame` everywhere and attaches nothing wrong**. The failure
isolation Daedalus asked for as a network property turns out to hold against a schema change too,
and I did not design it to.

**Control B validates a claim about test design, not about code.** The docblock asserts that
without the `{query: ''}` case a verdict function returning `dropped-expand` unconditionally would
pass. Control B is that function. It passed six of seven tests.

## 7. Two things I shipped and then removed

Both were unused surface that would read to a later fire as capability:

- `TAP_STATUS.OFF` — produced by nothing. A dry run `continue`s before the live turn and never
  reaches the module, and there is no `--no-tap` flag, so the value would have advertised a
  switch that does not exist. Replaced with a comment saying why there is no such value.
- `readSseEvents`'s `onEvent` callback — no caller. Unused code is unverified code.

This is the opposite call from Round 69's `unknown` branch, which I kept for a hypothetical and
which turned out reachable from a one-line edit. The difference is direction: `unknown` is a
*fallback* that catches an unforeseen input, whereas `OFF` is a *claim* that a mode exists.

## 8. `unscorableCalls` is deliberately unchanged

Daedalus asked that it "gain the lost-race case as a distinct reason string." Taking the intent
and not the letter, for a reason worth stating: **the tap can only ever reduce unscorability,
never add to it.** An empty-tail row was already unscorable before the tap existed; a lost race
merely fails to resolve it. Folding a lost race into that count would make a Round 69 number
depend on a race and stop Round 69's runs being comparable with Round 70's — a mid-experiment
instrument change of exactly the kind Round 58 refused.

So `unscorableCalls` keeps its Round 69 definition exactly, and the tap-aware figures live in a
new additive `tap` object in the per-run JSON: `unresolvedCalls` (flagged rows the tap could not
adjudicate), `resolvedByTap`, and `quietDropCalls`. His constraint is met — the silence is in the
JSON — via a field that cannot corrupt a published number.

**`quietDropCalls` is not an unscorable count.** It is my Round 69 §2(b) path: a dropped expand
that *also* carried a query leaves **no empty tail at all**, records as
`Searched own conversations: depot cipher`, and reads as an ordinary successful search. Those rows
are **already scored and already wrong**, which is a different and worse category than
"unscorable", and the warning string says `MIS-SCORED` rather than filing them with the empty
tails. This fire is the first time that path has been observable by any instrument.

## 9. Honest limits

- **The probe's ~20 lines of wiring are not exercised.** The module is certified end-to-end
  against the real route; the glue that calls it sits in the live path, and `--dry` `continue`s
  before the live turn, so a dry run reaches none of it. Same limit as Round 69's, and unchanged
  by this fire. What was checked instead: syntax, that every imported name resolves, and that the
  degraded path (`captureFailed`) returns `failed` / all-`no-frame` / `unresolvedCalls: 1` — i.e.
  exactly Round 69's behaviour. **Validate on the first paid run before quoting its numbers.**
- **The race is real and unremovable from the probe side.** Subscribing immediately after the
  POST returns is the earliest a subscriber can exist. Daedalus's two mitigations hold (the
  emitter is registered synchronously at `client.ts:726`; the `tool_use` event follows a model
  preamble, so the window is normally wide), but the tap's job is to make the failure *loud*, not
  to make it impossible.
- **The typecheck suppression is a real cost, stated.** The test imports untyped `.mjs` across the
  package boundary and carries two `@ts-expect-error` directives. A hand-written `.d.mts` mirror
  was the alternative and was rejected: it is a second copy of the contract that can drift while
  the tests keep passing, which is the failure mode this file exists to prevent one level down.
  Every field the tests read is asserted against a value the real route produced, so a renamed
  export fails loudly at runtime. **Found by running it, not by reading it:** the directive
  suppresses the *following line*, and tsc reports an import's error on its **final** line, so a
  wrapped import silently moves its error out from under its own suppression.

## 10. Numbers, verified this fire

- `npm test` — server **1415/1415 (86 files)**, i.e. Daedalus's 1408 plus my 7; client
  **239 passed / 13 skipped**, unchanged.
- `npm run typecheck` — clean across shared, server, client.
- `verify-empty-tail-detector.mjs`, `verify-filler-constraints.mjs`, `verify-offer-choice.mjs` —
  all pass, so the probe edit moved no arm field, no ordinal and no scoring surface.
- `scripts/probe-recall-tool.mjs`: **131 insertions, 1 deletion**, and the single deleted line is
  the POST it replaces with `const posted = await j(...)`. A proof rather than an assurance that
  nothing else in the instrument moved.
- All three control mutations reverted; `git status --porcelain` and
  `git diff --stat -- packages/` checked before committing.

## 11. Open, unchanged by this fire

**The distance arm's go/no-go is xian's** — `F=17, L=20, G=8`, 80 rows, five opus runs. **This
fire removed a risk from an instrument, which is not a reason to run one.** Also open and not
mine: per-condition reporting; the K-vs-J miss case; the 0/12 non-expansion path; the per-run
JSON ruling, option (2), and the backfill.
