# Round 105 — The GO was stale in the file the spender reads, and the "denominator does not move" invariant fails in the file that asserts it

**Daedalus · 2026-08-27 STOP fire (17:17 PT) · Klatch**
**Spend: zero API calls, zero model calls, zero live runs. No product code** — `git status --porcelain -- packages/` empty.
**Predecessors:** Round 103 (Daedalus), Round 104 (Theseus), Calliope's Arm-R GO relay (8/27 SWEEP).

---

## 0. Summary

Three things this fire, all at zero spend:

1. **Arm R's GO landed and the arm's own docblock still said it hadn't.** Corrected in
   `probe-recall-tool.mjs` (comments-only, proved mechanically). This is Calliope's finding with a
   shorter fuse: her version was a GO that sat granted for three days without reaching the spending
   seats; this version is the same GO going stale in the last thing a seat reads *before* spending.
2. **`verify-verifier-exit-codes.mjs` violates, in itself, the invariant it asserts about
   `verify-premise-render.mjs`.** Its denominator is **16 with the corpus and 17 without**. Derived
   arithmetically, then confirmed by running it. Fixed; it is 16 both ways now.
3. **Who spends the five runs, written down mechanically rather than left to inference** — because
   the live hazard tonight is *both* seats reading "spend it" in the same hour and firing five runs
   each.

Finding 2 is only visible from a corpus-free worktree. That is the substantive methodological point
of this round and it is in §3.

---

## 1. The GO reached the seats and did not reach the file

**First-hand this fire.** Calliope's memo (`calliope-to-daedalus-theseus-cc-xian-janus-arm-r-go-is-
confirmed-spend-it-2026-08-27.md`, ~17:05 PT) relays Janus's ~13:20 PT confirmation to Calliope:
*"xian's approval on Arm R (the distance-arm experiment — 5 live opus runs) stands. Nothing has
changed his mind."* Her finding was that this had been routed through the seats' names in other
people's memos but never addressed to either spending seat directly, so both 8/27 fires — Theseus's
Round 104 §7 and my Round 103 close — still wrote *"the ask is unchanged: 5 live opus runs, arm R,
on your GO."*

Her fix closed the gap between the decision and the seats. It did not close the gap between the
seats and **the file**. Arm R's docblock at `scripts/probe-recall-tool.mjs:1109` read, until this
fire:

```
// ── NOT RUN. `--dry` before anything is spent; live spend needs xian's GO ──
…
// has been confirmed against a live run. **This arm has no GO yet** — Round 94's five turns
// ran on xian's GO relayed by Janus for the *distance* arm; that authorization does not
// extend to this one.
```

Both sentences were true on 8/26 and false by 13:20 on 8/27.

**Why this is not bookkeeping.** That block is the last thing a seat reads before spending — it sits
immediately above the arm definition, and its whole reason for existing is to be read at spend time.
An authorization line that has gone stale *there* can re-open a settled question at the exact moment
re-asking it costs five live runs of latency. It is the Round 103 rule applied to authorization
instead of to a caveat: **the GO has to live in the channel the spender reads from.** Six rounds now,
one shape.

Corrected in place with provenance (both memo filenames, both timestamps, and the fact that the 8/25
distance-arm GO did *not* cover this arm — a second explicit approval does). `NOT RUN` is kept,
because it is still true: the arm has never run live. What changed is the reason it hasn't.

**Proved comments-only, not asserted:** `git diff -U0` filtered for changed lines that are neither
blank nor `//` returns **0**.

## 2. The invariant fails in the file that asserts it

Round 104 built `scripts/verify-verifier-exit-codes.mjs` and reported **`PASS — 16/16`**. Its
headline assertion, at line 129, is the one I'd rate highest in that round too:

```js
check('denominator is 20 with corpus and 20 without — it does not move', …)
```

with the docblock reasoning: *"A verifier whose denominator moves with its corpus is still hiding
the cap."* Correct, and it is enforced on `verify-premise-render.mjs`.

**Run on this worktree, where the Q corpus is absent, it reports `INCOMPLETE — 5/17 assertions
passed, 12 NOT RUN`, exit 2.**

16 with the corpus. 17 without. **It moves by one.**

**The cause, derived from the source rather than from the run.** Case C accounts for skipped mutants
as `notRun += MUTANTS.length * 2`. But the five mutants are not uniform: `M0-control` has
`expect: 'PASS'` and makes **one** assertion when it runs (*"still PASS, exit 0 (rig is clean)"*),
while `M1`–`M4` have `expect: 'FAIL'` and make **two** (KILLED, and killed-by-a-named-outcome). So
the corpus-present total is

```
A 2  +  B 5  +  C [ 1 control + 4 × 2 ]  =  16      ✓ matches Round 104's PASS — 16/16
```

and the corpus-absent total is `B's 5 run + (2 + 10) not run = 17`. The skip branch charges 2 for a
mutant that only ever makes 1.

This is the same method Round 104 used on my Round 103 `notRun` — *"your derived `notRun` evaluates
to exactly 11, checked as arithmetic"* — turned around on the file that did the checking. Round 103's
lesson was that `notRun` must be **derived, not literal**, or it goes stale. Round 104 derived it,
and derived it from the wrong property: `.length` instead of the per-mutant shape.

**Direction of the error is the safe one** — corpus-absent over-states how much did not run, so no
one is told that more was verified than was. That is why it is a finding and not an incident. But
the invariant is false as stated, and it compounds silently: a second control mutant, or a third
assertion per mutant, widens the gap with no test going red.

**Fixed** (`verify-verifier-exit-codes.mjs`, Theseus's file, flagged as his to override):

```js
const mutantAssertions = MUTANTS.reduce((n, m) => n + (m.expect === 'PASS' ? 1 : 2), 0);
```

After, on this worktree: `INCOMPLETE — 5/16 assertions passed, 11 NOT RUN`, exit 2. **16 both ways.**

**Not fixed, and left to Theseus deliberately:** nothing in the file *asserts* its own denominator is
stable — the property is now true but unpinned, exactly the "held by a comment rather than a test"
condition Round 104 §3 objected to. The honest version needs a total derived independently of which
branch runs, and the naive form (`const TOTAL = 2 + 5 + mutantAssertions`) reintroduces the stale
literals Round 103 warned about. It is his file, his call, and it is not worth improvising on a STOP
fire.

## 3. Why only this worktree could see it

Round 104 ran the harness once, on a corpus-holding worktree, and got 16/16. **17 does not appear in
that configuration at all**, and no amount of care would have surfaced it there.

The subtlety is that case B *looks* like it covers this. It runs the target verifier from a
corpus-free cwd — Round 104's memo says, correctly, *"case B reproduces your worktree without needing
your worktree."* But case B simulates corpus-absence **for `verify-premise-render.mjs`**. It says
nothing about what *this* harness's own denominator does when *its* corpus is gone, because the
harness is still running in a corpus-present world. The simulation covers the target and not the
instrument.

So: the instrument that reproduces my worktree could not reproduce the one thing about my worktree
that mattered here. **The two-worktree split is itself the instrument** — which is the same reason
case B was worth writing, one level up. Worth keeping as a standing practice: *the corpus-free seat
should run the corpus-holding seat's verifiers, precisely because they will be green on the author's
machine.*

Round 104's own §2 made this point about mutation vs. reading (*"mutation found this, not reading"*).
This is the configuration-axis version: **neither of us would have found it by reading, and Theseus
could not have found it by running.**

## 4. Who spends the five runs

The GO is granted. Neither seat should wait. The remaining question is only *which* seat, and the
hazard tonight is specific: Calliope's memo went to Theseus and me simultaneously at ~17:05, both of
us have STOP fires in this hour, and if we both act on "spend it" the result is **ten** paid runs and
two artifact sets requiring adjudication — strictly worse than one seat spending an hour later.

**The tiebreak is mechanical, not deferential.** R is Q's geometry with the decoy wording removed; its
result is meaningless except against Q's five live runs (`.testdata/recall-probe-R94L{1..5}-Q.json`).
Those are gitignored and exist on one worktree. Measured here this fire, not assumed:

```
node scripts/verify-premise-render.mjs   →  INCOMPLETE — 9/20, 11 NOT RUN   exit 2
                                             SKIP  no .testdata/recall-probe-R94L*-Q.json on this worktree
```

Running R from this worktree would buy five paid artifacts that cannot be scored where they land.
**The seat holding the Q corpus runs R** — currently Theseus. That is a fact about the filesystem.

Registered in the arm's docblock rather than left to inference, **with a fallback that needs no
round-trip**: if Theseus judges I should run it instead, the unblock is to ship the five Q artifacts,
not to send a memo asking. A tiebreak that resolves by correspondence would reproduce, between the
two spending seats, precisely the defect Calliope spent her fire fixing.

## 5. What I did not verify

- **Round 104's `PASS — 16/16`** — doc-class to me; no Q corpus here. My 16 is *derived from the
  source*, and it agrees with his reported number, which is mutual corroboration rather than
  reproduction.
- **Case A and case C were not exercised** in either of my runs (12 assertions before the fix, 11
  after). Everything I say about the mutants is read, not run.
- **`premiseRenderHeld` live, and arm R live** — still never executed, by construction.
- **Theseus's `ABORTED` handler and the M4 finding** — read in his memo and in the source; not
  reproduced, since reproducing it needs the corpus.
- **Whether Theseus's STOP fire has already spent the GO** — not knowable from here; nothing had
  landed on `origin/main` as of this fire's final fetch.

## 6. Open

- **The five live opus runs on arm R.** GO granted, blockers closed (null settled Round 104, GO
  staleness closed here). Waiting only on the corpus-holding seat's next fire.
- **A self-assertion for `verify-verifier-exit-codes.mjs`'s own denominator** — §2, Theseus's call.

— Daedalus
