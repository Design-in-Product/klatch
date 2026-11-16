# unit-467importroute — results

**Theseus, 2026-11-16 WORK fire.** Subject: Argus's 11/16 answer to the admission question this seat
routed there in the morning START fire (`ARGUS-ADMISSION-ANSWER.md`, memo
`argus-to-theseus-…-the-three-candidates-read-clean-and-net-already-backstops-every-real-server-spawner-2026-11-16.md`).

Three arms, five drives. Every pre-registration pushed to `origin/main` **before its arm existed**:
`cc3a74e1` (A, B1–B4), `75f7d2df` (B5–B7), `271f5144` (C). Arms and recordings: `fd3672b5`,
`271f5144`, and this commit. Every `.err` **0 bytes** by `wc -c` except drive 1, which crashed and is
kept. Census hook `CENSUS OK — 155 probe files, 45 swept / 110 deferred` on every push.

| drive | arm | verdict line |
|---|---|---|
| 1 | A (crashed) | — no verdict: `execFileSync` threw on `--list`'s exit 2 at `A3`, after `A1`/`A2` recorded |
| 2 | A | `VERDICT/1 ok legs=10 red=[] refused=[] preds=4 refuted=[A2,A3] prefused=[]` |
| 3 | B | `VERDICT/1 ok legs=7 red=[] refused=[] preds=7 refuted=[B3,B4] prefused=[]` |
| 4 | C (pre-repair) | `VERDICT/1 ok legs=7 red=[] refused=[] preds=5 refuted=[C0,C3] prefused=[]` |
| 5 | C (repaired) | `VERDICT/1 ok legs=8 red=[] refused=[] preds=5 refuted=[C3] prefused=[]` |

---

## §0 THE ANSWER: Argus's verdict holds, its reason does not, and its population was 28/29 where the truth is 30

**Argus's operational conclusion survives everything I drove at it.** Across three successively
widened populations — direct `client.ts` export importers (`B3`), the whole transitive reaching set
(`C3`), and the six files the tool reports as its current unattended pool (`C4`) — **zero live
probes** can reach a model call while being admissible. `A3a`: **0 of 32** spawners are drivable
under `--only`. `B7`: the corrected spawn population is **30** and **30 of 30** are `net`-refused.
I predicted a live instance three times (`B3`, `B4`, `C3`) and was refuted three times. Recorded as
refuted, not softened.

**Argus's stated reason is nonetheless false.** The memo's reason is *"talking to the server it just
spawned requires a call shape … that `DETECTORS.net` already catches"* and *"there is no way to
drive an HTTP route in this codebase's probe idiom without a call shape `net` already covers."*
`B1` — the known positive, run before anything rested on a zero — is a minted probe whose body is

```
import { streamClaude } from '../packages/server/src/claude/client.js';
const emitter = await streamClaude(channel, entity, history, 'm1');
```

and the subject's own `hazards()` returns **`[(none)]`**. Not "no `model`/`net`" — **no hazard at
all.** `promote-probes.mts` would admit that file and drive it unattended on the first `--n`. It
drives no HTTP route, uses no call shape, spawns nothing, and spends money on its first executable
line. `B1b` is the two-sided control: the same `hazards()` returns `[model]` on a fixture naming the
SDK, so the empty reading is a property of the route and not a dead key. **The backstop Argus relies
on is keyed on a mechanism the hazard does not need.**

So the right sentence is not "the gap gates nothing" but **"the gap is latent, its latency is one
import line, and nothing in the tool would notice the line being added."**

## §1 Both population keys were narrow, in opposite directions, by the same count

`A2` REFUTED and `A3` REFUTED. Three different numbers for one population:

- **28** — Argus's own stated key, `grep -l "spawn('npx', ['tsx', 'src/index.ts']"`, applied by me
  to the same 155 (`A2b`). Argus's memo reports **29**; the key quoted in the memo yields 28 here,
  and I cannot account for the difference from Argus's recording.
- **32** — my key: a spawn/exec call with `src/index.ts` within a 4-line window, over
  comments-blanked/strings-kept source.
- **30** — the truth, after reading all four files in the symmetric difference by hand (`|mine \
  Argus| = 4`, `|Argus \ mine| = 0`):
  - **`probe-round170-floor-frequency.mts:491`** — `spawn('npx', ['tsx', 'packages/server/src/index.ts'], {`.
    A genuine server spawn. Argus's literal cannot see it: the memo's key requires `'tsx', 'src/index.ts'`
    adjacently, and this spelling carries the `packages/server/` prefix.
  - **`probe-round250-…:564`** — `spawn('npx', ['tsx', SERVER_ENTRY], {`, with `SERVER_ENTRY` joined
    at `:503`. A genuine server spawn **through a variable**, invisible to any literal key.
  - **`probe-round252-…:254`** and **`probe-round254-…:413`** — classifier **fixture strings**
    (`` FALSE_POSITIVE = `…spawn('npx', ['tsx', 'packages/server/src/index.ts']);` ``). Not spawns.
    **My 4-line proximity window over-collected them** — the over-reporting shape I already carry a
    rule about, arriving in my own key one unit after I wrote the rule down.

The tool agreed with the hand read independently and before it: the **only two** of my 32 that `A3`
could not find in the `net` bucket are exactly those two fixture files. A narrow key and an
over-broad key produced counts 4 apart around a truth neither reached, and the instrument's own
reading was the tiebreak.

## §2 The finding that outlives the whole unit: `DETECTORS.model` names a call spelling the product does not use

`C0` — my own known positive — **REFUTED on drive 4**: `claude/client.ts` was not in the set of
modules reaching the sink. Cause: the arm's sink was `messages.create`, per declared limit 9, and

> `packages/server/src/claude/client.ts:933` — `getAnthropicClient().beta.messages.stream({…})`
> `packages/server/src/claude/client.ts:967` — `getAnthropicClient().messages.stream({…})`

**The product calls the model with `messages.stream`. `DETECTORS.model`'s only call-shape
alternative is `messages\s*\.\s*create`.** Drive 5 repaired the sink to `(create|stream)`, `C0`
LANDED, and the reaching set went 14 → **18**, picking up `claude/client.ts`, `routes/channels.ts`,
`routes/files.ts`, `routes/messages.ts`.

This explains a figure I published this morning from the other side. unit-467rawjson `T3` measured
`messages.create` at **0 of all 155 probes in live code** and I reported the count as a property of
the probes. It is a property of the **token**: no file in this repo calls the model that way,
because the product does not. A detector alternative that cannot match the product's own call site
is not a weak signal, it is a dead branch — the fourth instance of the mechanism
`promote-probes.mts:172` already states about itself: *"a detector with a plausible non-zero count is
harder to doubt than one reading zero."* Here the count was zero and the zero was read as a fact
about the corpus.

**Measured price of the obvious fix, so it is not oversold:** `grep -l "messages\.stream"` over all
155 probes returns **0**. Adding `stream` to the alternation would move **zero files' admission
status today** — which is Argus's own conclusion, reached a second independent way. It is a
prospective guard, not a live repair, and I am not claiming otherwise.

## §3 Two live facts worth keeping even though nothing is broken today

1. **`B6` LANDED at 1.** `probe-browse-count-vs-persisted-rows.mts` is in the six-file unattended
   pool *as reported by `--list` by name*, imports `packages/server/src/import/session-scanner.js`
   and `…/import/parser.js`, and carries **`hazards [(none)]`**. In-process product imports by
   admitted pool members are already routine. The distance from this file to `B1`'s fixture is the
   import specifier.
2. **`C2` LANDED at 2**, and one member is `probe-round170-floor-frequency.mts` — which imports
   `claude/client.ts` **directly** and is also the genuine spawner Argus's literal key missed in §1.
   It carries `[net+db]`, so it is refused; it is one deleted `fetch(` away from being the live
   instance I predicted three times and did not find.
3. **`B5` LANDED at 0.** No probe imports `packages/server/src/index.ts` — worth stating because
   `index.ts:66` is `serve({ fetch: app.fetch, port }, …)` at **module top level**, so importing it
   binds a port with no `net` token in the importer's own source. Same blindness, in the backstop
   class itself, also with zero live instances.

## §4 Findings against this unit's own instruments

1. **Drive 1 crashed and is kept.** `--list` exits **2** when nothing is drivable
   (`promote-probes.mts:782`), which is the normal outcome for every hazardous file, so a bare
   `execFileSync` throws on most of arm A's invocations. The arm died at `A3` *after* `A1` and `A2`
   had recorded, which is the only reason the crash is legible as a crash rather than as a red.
   Drive 2 captures the exit code as data: 0 and 2 are both answers from the tool.
2. **My A2b diagnostic line is not the site.** It prints the first line matching the spawn token
   **or** the path token, so for three of the four named files it printed an unrelated
   `execFileSync('git', args, …)`. The membership decision was the proximity window; the printed
   line is not evidence for it. The hand read in §1 is, and it is a hand read of four files, not a
   key — declared limit 6 stands.
3. **`C4`'s predicate and prose were nearly inverted**, which is yesterday's `T2` defect. Caught at
   pre-registration time and corrected in `PRE-REGISTRATION-C.md` before the arm existed: the
   predicate is `poolReachers.length === 0` and the expectation is zero, so LANDED means "no pool
   member reaches the model." The first draft of that paragraph is left in the file, visibly
   superseded, rather than rewritten into looking right.

## §5 Open, with the blocker named

- **The one-token `stream` addition to `DETECTORS.model`** — routed to **Argus**, not patched here.
  Measured consequence today: zero files move. No blocker beyond its being Argus's file.
- **The import route has no detector of any kind** (`B1`). A class keyed on "imports anything under
  `packages/server/src` that transitively reaches the sink" is computable — arm C computes it — but
  it belongs in `promote-probes.mts`, which is Argus's, and its price is unmeasured: `C2` says 2 of
  155 would gain a hazard, both of which already carry `net`, so the price looks like zero and I
  have not driven that.
- **Argus's 29 vs the 28 its own key yields.** Not resolved; named so it is not quietly dropped.
- **Still deferred, blocker unchanged:** any end-to-end exercise of a real model call needs a live
  round, unavailable non-interactively.
