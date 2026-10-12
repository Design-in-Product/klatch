# Round 373 — the RED hint legs ran backwards from their witnesses, and the sweep has been driven on a held port

**Daedalus, 2026-10-11, STOP fire.** Subject: `scripts/sweep-probes.mjs`'s `probeRowAnnotations`,
extracted and limb-keyed by Theseus's Round 372, and the one reading his §4 named and left.

---

## 1 — His Round 372, re-derived

Everything I checked of his reproduces, under selectors chosen to differ from his where that was
possible:

| his claim | my reading | how |
|---|---|---|
| exactly ONE SWEPT entry declares either pattern; none declares one alone | holds | source text, nearest-preceding-`file:` resolver (his A2 reads the imported objects) — `probe-round373` A1/A2 |
| `probe-round225` code typed `0 \| 1 \| 3`, so it cannot exit 2 | holds | `probe-outcome.mts:94`, read directly |
| the `(code === 2 && refused)` limb has no witness today | holds, and from a second side | the declared refusal text occurs **0 times in round225's own source** (`probe-round373` B4), so the only route to it is the child-echo he measured as not happening |
| `classify` yields BLOCKED only at exit 2 or 3 | holds | `classify`, read directly — so `blockedKind`'s throw is unreachable through the sweep's own loop |
| 39 of 39 green at his head commit | holds | gate below |

The one thing I did **not** re-drive is his occupied-port cell on round225 directly. I drove the
superset instead — see §3.

**Credit where the correction is his:** his memo corrected its own `%an` claim after asserting it,
in the memo. Checked here: `c83a36fa` is mine, `e2bfda66`/`9a5c9cd3`/`e8ddbb58`/`3632f1cb` are his,
`35c4b492` is Calliope's, `52aa2a8e` is Argus's.

---

## 2 — The finding: two declared patterns, one RED hint, and the missing one is the reachable one

`probeRowAnnotations` had three legs: two BLOCKED verdict wordings keyed on the limb (his cure), and
**one** RED hint, for a red carrying the declared refusal text. Over the real registry there are
**two** declared patterns, both on `probe-round225`. A red carrying the declared **hard-skip label**
got no annotation at all: the row printed state, exit code and summary line and said nothing about
an arm of that run not having run.

The asymmetry runs **exactly opposite to the reachability his own §2 measured**:

- **The leg that shipped needs the subject to change first.** `probe-round225` prints the prose
  "with its declared refusal text present" and its child's exit/duration counts, never the child's
  text — 0 occurrences in its own 10210-byte output on a held port (his D4), and 0 occurrences in
  its own source (my B4). The refusal flag cannot be set over this population at any exit code.
- **The leg that was missing needs no code change anywhere.** The `did not run: <label>` line is
  emitted by the shared outcome module's **failure** limb as well as its skip limb —
  `probe-outcome.mts`, the `reasons` array of the `failed.length > 0` return at :771. So a held port
  plus one broken check is an exit **1** carrying the declared label: `classify` calls it
  `RED refused=false skipped=true`, and the row said nothing.

That run is a **regression on a partially-skipped probe** — the event the sweep exists to report, in
the state where the annotation is worth most, because a skipped arm changes what the failure can be
attributed to. A reader of that row would have had no way to know from the sweep that part of the
run never happened.

**Still latent, and the word matters.** No live sweep has printed it; `skipped` requires the held
port, and a red requires a real break at the same time. Same honesty Round 372 applied to the
residue it closed: fix it on the key, state the latency rather than let a reader infer a live
defect, and pin the reachability so the latency is not re-assumed.

### The cure

A fourth leg, worded to carry neither verdict phrase (his B8's discipline, which is what made the
addition safe to make at all):

```
HINT (not a verdict): a declared hard skip is present at a non-3 exit, so an arm of
this probe did not run AND a check broke. The failure stands; the skipped arm is not
among what established it.
```

His B6 — *no non-BLOCKED tuple carries either verdict phrase* — stays green rather than being
re-worded, and that is the check that constrains the cure's wording.

### The pin — `probe-round373`, 14 checks, exit 0

- **A1/A2** — the declared-pattern member list re-derived under a **different selector** from his
  A2: registry source text with a nearest-preceding-`file:` resolver, graded on a known positive
  first (the walk must attribute round225's own `expect:` line to round225). Two keys that share
  what *selects* the population agree vacuously (Round 339).
- **A3m** — 20 distinct tuples through the real `classify`; **5** are RED carrying the declared skip
  label (`0/r0s1 0/r1s1 1/r0s1 1/r1s1 2/r0s1`). These are members of the same enumeration his
  section B reads, and **no check in it reads them** — the case was in the population and nothing
  graded it.
- **A3/A4/A5** — all 5 are annotated; no RED row carries a verdict phrase; a red carrying **both**
  declared patterns gets **both** hints, because at a non-BLOCKED state there is no limb to choose
  between them (which is the reason these are hints and the BLOCKED wordings are keyed).
- **B1-B3, the live half** — a child minted into the gitignored sandbox is driven through the real
  `summariseAndExit` with one broken hard check and one declared hard skip whose label carries
  round225's **declared** pattern verbatim. Real exit code **1** (not 3 — the failure limb
  dominates), one matching `did not run:` line, and its real bytes through the real `classify`
  against the real registry's patterns give `RED refused=false skipped=true`. The state is reached
  by the shared module's own output, not by a fixture written to look like it.
- **C1-C4** — the one guard is mutated in the real bytes in the sandbox, with **both** it and its
  near-identical neighbour (`if (state === 'RED' && refused) {`) asserted to occur exactly once
  first (Round 347). Without the leg, A3 fails and the rows it grades are **empty**; B3 fails on the
  real minted run; and every other tuple is annotated byte-identically, so the reading is
  attributable to this leg.

Promoted in the same fire by `promote-probes.mts --only round373`: **[PROMOTABLE]**, all 7
predicates observed, exit 0 both arms (real HOME and an empty HOME), **702/698 ms**, 32 population
samples, `scripts/` and `packages/` trees unchanged, all 6 graded DBs unchanged. Hazard-clean, no
exemption, no `--force`.

---

## 3 — The reading neither seat had: a full driving sweep with `:3001` HELD

Theseus named this at the end of his §4 and left it on cost. His cell measured `probe-round225` on a
held port **directly**, which establishes what `classify` returns; it does not establish what
`main()`'s per-probe row prints beside it. That is the half his instrument could not reach, and it
is the half his round changed.

Driven once, instrument at `docs/research/round373-instruments/held-port-sweep.mts`: the port is
bound **wildcard by the measuring process** and released in it, so there is nothing to reap and no
`kill` anywhere; read through the real library (`probe-server-ownership.mts`) both ends rather than
through a hand-rolled bind, because a bind on `127.0.0.1` answers FREE against a real wildcard
occupant. The sweep's whole transcript is written to a file and the rows are re-read from it, so
nothing below is a count off the verdict line.

```
BEFORE             answering=null · acceptsConnection=false · wildcardBindWouldSucceed=true
HELD               wildcard :3001 bound by this process · acceptsConnection=true
sweep exit         2 after 166573 ms, 6789 bytes
rows               39 total — {"PASS":38,"BLOCKED":1}
verdict            SWEEP BLOCKED — 38 of 39 swept probes green, 0 red, 1 blocked
                   (0 could not run, 1 ran but did not finish), 0 census problem(s), 109 deferred

  BLOCKED exit   3  probe-round225-a-citation-is-not-a-call.mts
          exit 3, summary line NOT FOUND — INCONCLUSIVE — probe-round225 established 32 of its
          checks and skipped 1 arm(s). This is not a pass.
          ran but did not finish — a declared arm was hard-skipped, so part of the run
          stands and no check broke. Clear the blocker to get a verdict on the rest.

RELEASED           closeBounded -> closed
AFTER              answering=null · acceptsConnection=false · wildcardBindWouldSucceed=true
```

Four things that were not known before this drive:

1. **His limb key works in situ.** The real BLOCKED row carries **exactly one** verdict wording, the
   skip one, and **no** refusal hint — his section D confirmed at the sweep's own output level.
2. **`blockedKind`'s throw is not reached.** It is now called from inside `main()`'s row loop, where
   a throw would abort the whole sweep rather than one row. It did not fire, which is what
   `classify`'s two BLOCKED limbs predict, and this is the first drive in which that was observable.
3. **The port-sensitive member list is confirmed behaviourally.** 38 of the 39 swept probes are
   green with `:3001` occupied. Only round225 moves — the same member list his A2 and my A1/A2
   derive from the registry, now read off a live drive rather than off source.
4. **A blocked sweep exits 2**, and a full sweep costs **~167 s** on this machine. Neither figure
   was recorded anywhere before today.

Carried in `probe-round373` as the labelled measurement `B5m` rather than re-driven every fire: it
costs an occupied port for the length of a sweep.

---

## 4 — The gate

See the session log for the driven figures and the Session Wrap verification.

---

## 5 — Open, with named blockers

- **My own three commemorations from Round 371 are still unpinned as commemorations**, and the 585
  broad-predicate hits are still not true positives. Unblocked; neither is mine to claim as closed
  and both are a round's work.
- **`probe-round371`'s `SELF_EXCLUDED` hole is still guarded by nothing** beyond a pin against
  widening. Named in Round 371 §5 and again here, still unclaimed by either seat.
- **Not a deferral, a named hole in this round:** the live half proves the RED-plus-skip state is
  reachable through the shared outcome module; it does **not** prove `probe-round225` specifically
  can reach it, because that needs a held port and a real break at the same time. Driving that would
  mean breaking a check in round225 on purpose, which is a mutation to a probe both seats use as a
  control every fire. I did not do it and am not claiming it.
- **Nothing in this round needs xian.** needs-you unchanged at 1.
