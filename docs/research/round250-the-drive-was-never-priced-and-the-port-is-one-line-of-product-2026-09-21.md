# Round 250 — the drive was never priced, and the port is one line of product

**Theseus, 2026-09-21 (STOP fire).**
Instrument: `scripts/probe-round250-the-drive-was-never-priced-and-the-port-is-one-line-of-product.mts`
— 15 regression checks, 6 measurements, exit 0.
Assigned by: Daedalus, Round 249 §4 (the port census) and §6 (the undriven population, noted a
fourth time).

---

## 1 — The item had been open four rounds because nobody had priced it

Daedalus has flagged the same thing in 245 §6, 247 §7 and 249 §6: the stale-in-code probe
population is **graded and undriven**. In 249 §6 he offered to unblock it if it was stuck on
something. It was, and the thing had never been named.

"Drive 49 probes" sounds like a scheduling problem. It is not. **Some of those probes call the
model, some write a database, some bind port 3001, one rewrites product source and runs the test
suite.** Nobody had asked what driving *costs*, so the question stayed shaped as "when will
someone get round to it" — which has no answer, four times running.

Round 250 therefore does two things in this order: classify the population by cost, then drive
the subset that costs nothing.

**The population is 48, not 49.** Re-derived live in this fire by running Round 246's probe
(15 s, exit 0) rather than re-implementing its definition — one source, with arm C as a control
asserting the rows parsed out match the count that probe prints. Both Daedalus's §6 and my own
Round 248 carry "49"; that was the figure at Round 246's HEAD and neither of us re-took it.

---

## 2 — THE FINDING: the port is one literal in product code

Daedalus's §4 line was *"a probe belongs in `npm test` when it can own everything it touches;
it needs a scheduled runner when it needs a real port, a live stranger, or minutes"*, and he
routed a census: how many port-bound probes are bound to *a* port rather than to *that* port.

The census has a redirect rather than a ratio as its answer.

`packages/server/src/index.ts:34` is:

```ts
const port = 3001;
```

No environment override. **The database path the same server reaches IS env-overridable** — in
`packages/server/src/db/index.ts:7-9`, reached from `index.ts` only through the imported `getDb()`
call — and `scripts/serve-scratch.mjs` exists precisely so a probe can point the server at a
throwaway database instead of xian's.

> **Wording corrected 2026-09-22.** As published on 2026-09-21 this sentence read *"eleven lines
> above it, the same **file** honours `KLATCH_DB`."* It does not — `grep -c KLATCH_DB
> packages/server/src/index.ts` is **0**; the read is in `db/index.ts`, a different file. Found by
> Argus's Round 250 sweep, located to its one remaining site in the probe by Daedalus (Round 251
> §4), corrected in Round 252. **No measurement, threshold or verdict in this document changes** —
> the DB path genuinely is overridable and the port genuinely was not, which is what arms D and E
> drove. Recorded rather than silently rewritten, because the claim was requoted in two memos
> before it was checked.

> The DB — a shared resource a probe must not clobber — is overridable.
> The port — the *other* shared resource a probe must not clobber, the one that forces every
> server-driving check out of `npm test` and into an unscheduled probe — is not.

Driven, not read:

| arm | what was done | result |
|---|---|---|
| **D** | spawn the real server with `PORT=54029`, `KLATCH_DB` at a temp file | banner says **3001**; connect 3001 → true; connect 54029 → **false** |
| **E** | replace that one line with `Number(process.env.PORT ?? 3001)`, in place | **two** real Klatch servers at once on 54112/54113, both answering, **3001 quiet throughout** |

Arm E restores the file: sha256 `6270a4d593a0…` before and after, `git status --porcelain
packages/` empty at exit (Z1).

**Census, at this HEAD:** 48/129 enumerated `scripts/` files are port-bound. **37** of them are
bound because they *start the real server* — for those the port was never the probe's choice.
11 spell `3001`/`5173` without starting one. Separately, **27** import a product module
in-process without starting a server at all.

> **Rule: "this probe needs a real port" is almost never a fact about the probe. Check whether
> the port is essential to the SUBJECT before designing a runner around it — a scheduled runner
> is an expensive answer to a question that may be one product literal.**

**Not taken.** `packages/` is not this seat, and changing what the server binds is a routed
decision. Routed to Daedalus with the measurement attached rather than an argument.

---

## 3 — A gating classifier fails in two directions and only one of them is visible

Both directions showed up in run 1, and neither was predicted.

**Over-block.** The `server` marker matched *any* import from `packages/server`, so a probe
importing `session-parser.js` in-process counted as starting a server. **39 of 48 held back; 4
driven.**

**Under-block.** `scripts/round54-revert-probe.mjs` classified hazard-free **and was driven.** It
rewrites `packages/server/src/claude/recall.ts` in place and shells out to vitest. It restored —
but that was its own `finally`, not my safety. (Verified after the fact: `git status --porcelain
packages/` empty, sha256 unchanged.)

> **Rule: an over-blocking gate and an absent gate look identical from outside. The work just
> does not happen, and "blocked" is indistinguishable from "nobody got to it." That is why this
> item read as inertia for four rounds. An under-blocking gate, by contrast, announces itself by
> running something. The dangerous direction is loud; the direction that costs you four rounds
> is silent.**

Repaired, with minted two-sided fixtures rather than anecdotes: `server` now means the entry
only (A6); new `mutate` and `suite` classes (A7); new non-gating `product` class.

**The over-block is now counted, not eliminated.** Of the 28 files in `mutate`, the precise rule
— a product path on the same *line* as a write — matches **0**, and that is not a false-positive
count: `round54-revert-probe.mjs` is a confirmed true positive and the precise rule misses it
too, because it writes `writeFileSync(r.file, …)` with the path three screens up. So the precise
rule has no discriminating power on this population. At least 1 of the 28 really mutates product
source; I have not separated the other 27, and say so rather than dressing it as a bound I did
not earn.

---

## 4 — What the drive found, dated from git

### 4.1 `round54-revert-probe.mjs` — refusing for 36 days, four hours after its guard was written

It exits 1 on **its own guard**:

> R2 one collapsed count instead of two: revert anchor no longer present in
> `packages/server/src/claude/recall.ts` — the probe has stopped measuring this piece.
> Re-anchor it before trusting any row of this run.

Dated, not inferred:

- `68b20058`, **2026-08-16 09:22:59 -0700** — *"probes: make the revert probes fail closed on
  their own anchors"* (the guard).
- `b9a9fd2f`, **2026-08-16 13:26:59 -0700** — Round 58, *"name the gap markers' invariant
  substrings, from one source"* — hoisted the anchored literal into `P.edgeReachableWithAddress`.
- `git merge-base --is-ancestor 68b20058 b9a9fd2f` → the guard came first.

**Four hours and four minutes apart, the same day.** The guard did exactly its job and nothing
was listening for 36 days. This is a stale-in-code grade *confirmed by driving* rather than
inferred from a commit count — which is the entire difference between a graded population and a
driven one.

Not repaired: re-anchoring is a decision about what that probe measures, and Round 58 may have
made the piece unrevertable.

### 4.2 `probe-scan-cost-model-control.mts` — a monitoring probe that is red, on a live signal

Exit 1, 34 checks (9 regression, 25 measurement), **2 failed**:

```
FAIL [A] shipped 50_000 guard still does not bite — largest pm 53,636 (107.3% of guard),
         largest shipped 21,074 (42.1%). A FAIL here is the finding the scanner comment asks
         to be monitored, not a broken probe
FAIL [E] Round 155's endpoint delta reproduced by a different method — 2560 ms summed over PM's
         22 above-cap files at the function level, against 1781 ms measured through a live
         server in Round 155 — 44% apart.
```

Arm A is **the probe saying so itself**: a real corpus file is at 107.3% of the shipped 50,000
guard. That is a product signal, currently unobserved, in a probe nothing schedules.

**I have not dated when it first went red** — that needs the corpus at earlier HEADs and I did
not take it. Stated as unmeasured rather than guessed.

### 4.3 `probe-round240` — exit 1, expected and already documented

Its arm I is the pinned-to-a-live-artifact control identified in Round 244 §3 and deliberately
left red. Reproduces; no new information.

### 4.4 `probe-scan-latency-vs-cap.mts` — exit 0, 72.9 s

The one green in the driven set. A green exit means it still exits 0 today, which is not the same
as healthy (Daedalus, Round 247 §4).

---

## 5 — The drive, and the remainder by blocking class

**3/48 driven to an exit code, 102 s total.** exit 0: 1 · non-zero: 2 · timed out at 120 s: 0.

**45/48 not driven**, by class (a file can appear in more than one):

| class | n | what unblocks it |
|---|---|---|
| `db` | 35 | a `KLATCH_DB` scratch path — the product **already** supports this. Harness change. |
| `mutate` | 28 | loose over-block (§3); at least 1 genuine |
| `server` | 19 | arm E's one line |
| `port` | 19 | arm E's one line |
| `args` | 3 | the driver must know the probe's inputs (§6) |
| `suite` | 2 | runs vitest; needs its own isolation |
| `model` | 2 | **the only class that costs real money, and it is the smallest** |

The shape of the remainder is the useful part: the largest class is unblocked by an environment
variable the product already reads, and the second-largest by one line. Nothing here needed a
scheduled runner to be designed first.

---

## 6 — Three faults in my own instrument, all found by driving it

1. **The classifier's two directions** (§3) — over-block 39, under-block 1, and the under-block
   ran.
2. **A control whose window was wider than its claim.** Arm Z3 (blast radius) snapshotted
   `git status` at the top of the probe and compared at exit, so it spanned arm B's 15 s
   subprocess — and went red on `docs/logs/2026-09-21-1047-theseus-opus-log.md`: **my own session
   log, edited in another process while the probe ran.**
   > **Rule: a control whose window is wider than its claim attributes everything that happened
   > in the window to the thing it is watching.** It reported someone else's edit as the drive's
   > blast radius, in the same colour it would use for a probe that trashed the tree.
   Repaired by narrowing the window to the drive loop — **not** by excluding the file that showed
   up, which is how a check becomes a thing you update to match.
3. **An interpretation written before the measurement existed.** Arm G's prose said *"a third of
   the population turns out to be free"*. It was written while the arm was being built; the run
   said 3/48 — **6%**. My own Round 248 §4 finding about hardcoded totals, in the sentence
   reporting it. Now computed from the run.

And a fourth class the drive taught the driver:

4. **`probe-browse-count-vs-persisted-rows.mts` exited 2 in 0.3 s printing
   `usage: … <session.jsonl>`**, and the driver recorded it as a red.
   > **Rule: "driveable" has a precondition before any hazard — the probe has to know its own
   > inputs. A harness that spawns every file bare reads "you called me wrong" as "the subject is
   > broken", and both print as a non-zero exit.**
   Added as the `args` class, non-transitive (arm A8), with the optional-`--verbose` shape as its
   negative side.

Four rounds, two seats, same ratio: every fault found by driving the instrument, none by reading
it.

---

## 7 — Controls

- `npm test` into a file, not a pipe — figures in the session log.
- `npm run typecheck` 0 errors ×3; standalone strict `tsc` on the new `.mts` **0 errors**.
- Product entry sha256 **identical** before and after arm E's in-place mutation; `git status
  --porcelain packages/` empty (Z1).
- **3001 quiet at exit** (Z2); staged files under `scripts/` counted by `readdirSync`: **0**.
- Blast radius over the **whole repo**, windowed to the drive: **0 entries introduced** (Z3).
- **0 model calls.** No read of `~/.claude/projects` by this probe (the probes it drives may).
- Runs 3, 4, 5 and 6 agree on every figure but the ephemeral port numbers and the driven count,
  which moved 4 → 3 when the `args` class landed between runs.

**Run 5's Z3 went red, and it was right.** I wrote this file while run 5's drive loop was open,
and the narrowed blast-radius window caught it: `?? docs/research/round250-….md`. That is the
operator, not the drive — reported rather than excluded, because a control sensitive enough to
notice a concurrent write by its own author is a control worth keeping. **Run 6 was taken with
hands off the tree and passes 15/15.** The figures quoted above are run 6's.

---

## 8 — Open

- **Routed to Daedalus:** the one-line `PORT` change in `packages/server/src/index.ts`, priced by
  arm E and not taken. It is the cheapest available move on the runner question.
- **Mine, next:** the `db` class (35 files) — the largest, and unblocked by a `KLATCH_DB` scratch
  path the product already reads. That is a harness change in this seat.
- **Open and undated:** when `probe-scan-cost-model-control`'s arm A first went red.
- **Not repaired:** `round54-revert-probe.mjs`'s R2 anchor; re-anchoring changes what it measures.
- **Parked on xian, unchanged:** `440fe16b-46f8-4fbb-9b0d-3285c425aa37`; `files/storage.ts:38`;
  the backfill dry run; `DELETE /entities/:id`.
