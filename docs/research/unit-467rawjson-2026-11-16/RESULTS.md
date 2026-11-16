# RESULTS — unit-467rawjson: the 12 are named, and the class step 1 censused contains zero live callers

**Theseus, 2026-11-16 (START fire).** Step 2 of xian's 2026-09-28 raw-JSON ruling
(`docs/operations/attention-rollup.md:209-211`), claimed by this seat 11/15, **unbuilt 49 days**.
Pin `1f675ebf`. Three arms, every pre-registration pushed to `origin/main` **before its arm
existed**: `43ea780b`, `256d7681`, `fc823d16`; arms + recordings `0eda091b`, `8618e343`, and this
commit. **19 legs, 0 red. 14 predictions, 2 refuted.** All three `.err` files **0 bytes**.

| arm | verdict |
|---|---|
| A | `GREEN legs=8 red=[] preds=5 refuted=["P1"]` |
| B | `GREEN legs=6 red=[] preds=5 refuted=["Q4"]` |
| C | `GREEN legs=5 red=[] preds=4 refuted=[]` |

## §0 THE ANSWER

**The 12 are named** (arm A, `drive1.arma.out`) — and `12 + 6 = 18` is assertable after all. `P1`
**REFUTED**: I predicted overlap, because `promote-probes.mts:722` buckets hazards *before* line
727's admission check can `continue` past them, so a probe owning a `model` token *and* inadmissible
would land in both lists. Overlap measured **0**. Step 1's "the six inherit `[model]` … rather than
owning the call" holds, and `Q3` confirmed it from the other side: **none of the six owns a
model-branch token in its own source at all.** (One correction to step 1's arithmetic: this run's
INADMISSIBLE list is **7**, not 6 — the seventh, `probe-round281`, inherits `[net]`, not `[model]`,
so `12 + 6 = 18` is right *as a model-class figure* and `19` is the whole INADMISSIBLE set.)

**But naming them destroys the population.** The 12, by what their sites actually say:

- **9 fire on `ANTHROPIC_API_KEY`, and every one is a SCRUB or a dummy** —
  `delete env.ANTHROPIC_API_KEY`, `env: { ...process.env, ANTHROPIC_API_KEY: '' }`,
  `'ANTHROPIC_API_KEY=r253-dummy-no-calls-are-made'`.
- **2 are controls asserting the opposite of what they were counted for** —
  `check('Z4', 'CONTROL — 0 model calls: nothing here IMPORTS the Anthropic SDK', …)` in
  `probe-round252:634` and `probe-round254:925`.
- **3 are minted detector FIXTURE strings** — `probe-round250:341`, `probe-round285:160`,
  `probe-round305:131`, the last two being known-positive fixtures *for this very detector*.
- **`messages.create` fires on 0 of 12.**

`Q2` **LANDED**: across the 12, **zero** `messages.create` survive `stripSource(src, true)` — the
only one present at all is `probe-round250`'s minted fixture, which vanishes when string bodies are
blanked. `T3` **LANDED** over the whole corpus: **0 of 155 probes call the SDK in live code.**

**So the class step 1 proposed as the live-round population — `not driven (model): 12` — contains no
live caller, and the ruling's writer cannot be hooked to it.** That is the finding, and it is against
step 1, which quoted the detector's own over-breadth disclaimer as declared limit 2 and then used
the class as the population anyway.

**Where the population actually is** (arm C, `T2` LANDED): probes that reach the model *through the
product* — name a `/messages` route, spawn a child, and do **not** scrub the key. **Three, named:**

```
DEFERRED probe-import-large-session.mts
DEFERRED probe-round213-reassign-live-http.mts
DEFERRED probe-round219-files-cap-live-http.mts
```

## §1 The two keys are disjoint, not nested

`T4` **LANDED**, and harder than registered: **|model \ route| = 12, |route \ model| = 10, over
sets of size 12 and 10.** The intersection is **empty**. `DETECTORS.model` flags **not one** of the
10 probes that name a message route. The misalignment is named by member in `drive3.armc.out`; six
of the ten are the `probe-carried-context-*` family.

**Consequence for the next detector:** widening the token key cannot reach the route population,
because the route population contains no model token to widen *to*. A live-call detector has to be
keyed on the route, not on the SDK's identifiers. This is the shape Daedalus's `reasontok` arm C hit
from the other direction — there widening destroyed the precision a narrow key was silently
supplying; here widening cannot help at all, because the two keys are measuring different things.

## §2 The findings against me, both of which are the same family twice in one unit

**1. `Q4` REFUTED, and the mechanism is my own item 3.** I predicted at least one of the six `-live`
probes names an `/api/…messages` path. **Zero.** Not because they don't, but because
`probe-round213:75` is `` const BASE = `http://127.0.0.1:${PORT}/api` `` and line 163 is
`` fetch(`${BASE}${pathname}`, …) ``. **The literal never exists; the path is assembled.** That is
the interpolated-literal family — my own open item 3, the 127 interpolated literals — arriving as a
blindness in a key I wrote minutes after replacing arm A's hand key for a neighbouring reason. The
interpolation-tolerant key in arm C (`/messages\b` anywhere) finds the member the literal key
missed: `T1` LANDED at 1 of 6, 10 of 155.

**2. `-live` does not mean a live model call, and step 1 said it did.** `probe-round213`'s own
docblock, lines 5-13: it distinguishes a real **socket** from `app.request` on the in-memory Hono
app. Step 1 §2 wrote *"the `-live` suffix on all six is the relevant signal: these are the
carried-context and layer-assembly rounds the ruling was written about."* **That sentence is false
about what the suffix means**, and it is the sentence that made the six look like the ruling's
subject. `P3` LANDED at **12 of 12** from the other direction: not one of the 12 ends `-live.mts`,
so the suffix is not a key for the model class either — in neither direction is the filename load-bearing.

**3. Arm A's site column was a slice, and arm B had to say so before anything could rest on it.**
`Q1` LANDED: **17 model-branch matches across the 12, where arm A printed 12.** `hazardSite` is
`lines.findIndex(...)` — the *first* match. Arm A's twelve sites could not have carried "none of
these calls live"; only arm B's whole-file reading can. 5 of the 12 have a match on a line arm A
never showed.

## §3 A methodological defect in my own pre-registration, recorded because the label is ambiguous

**`T2`'s predicate and the sentence attached to it point opposite ways.** The predicate is
`routeSpawnNoScrub.length >= 1`; the registered prose says *"I am registering it as the one I expect
NOT to see."* The predicate **LANDED**. So what was refuted was my stated expectation, while the
prediction's own grade reads LANDED — and a reader scanning the verdict line (`refuted=[]`) learns
the opposite of what I actually got wrong.

**The rule this seat takes from it:** a prediction's predicate and its registered expectation must
point the same way, or the LANDED/REFUTED label is uninterpretable. "I predict X" and "I expect not
to see X" cannot both be in the same entry. Arms A and B are clean on this; `T2` is not, and the
verdict line understates the unit's refutation count by one as a result.

## §4 What this makes the next step

1. **The seam is the product, not the probe.** `T3` says no probe calls the SDK; the model call
   happens in `packages/server/src/claude/client.ts` when a message is POSTed. A raw-JSON writer
   therefore hooks **the server's reply path**, and the per-run JSON exists in the *server* process —
   not in the probe that drove it. Step 1's "owns-vs-drives split" was the right question asked of
   the wrong population.
2. **The three candidates need a per-file read**, not a key: does each actually POST a message, and
   with what key state. Declared limit 1 of PRE-REGISTRATION-C stands — a route token is not a POST.
3. **`DETECTORS.model`'s blindness to the route population is a finding for the instrument**, not
   just for me: `promote-probes.mts` will drive a probe that POSTs to a live server with an inherited
   key, because no detector sees that route. Routed to Argus and Daedalus by mail rather than patched
   here — the instrument is not this unit's to edit, and R4/S4/U4 assert it wasn't.

**Declared limits, unchanged and load-bearing:** every figure here is a **source reading** at pin
`1f675ebf`; nothing was executed. A token surviving `blankStrings: true` is live *code*, not an
executed *call*. The end-to-end exercise of any writer still needs a live round, which a
non-interactive fire cannot run — a limit on verifying a writer, not on building one, and not a
blocker for steps 1-3 above.

— Theseus
