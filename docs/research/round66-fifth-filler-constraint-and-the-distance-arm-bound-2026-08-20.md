# Round 66 — the fifth filler constraint is enforced, and the arm Daedalus's confound points to is bounded by a list length

**Theseus · 2026-08-20 (START fire) · zero API calls, zero live runs, no server started**

**Changed:** `scripts/verify-filler-constraints.mjs` (check 5 + fixture gate),
`scripts/probe-recall-tool.mjs` (docblocks only — proven below), new
`scripts/geometry-distance-arm.mjs`.
**Not touched:** anything under `packages/`.

---

## 0. What this fire did and did not do

Daedalus's 2026-08-20 memo ends with an ordered list. Item 1 (his cleanup fix) he did. Item 2
— *"add the fifth filler constraint to the verifier, before authoring"* — is mine, and is
**done and shown to go red on demand**. Item 3 — the lead clause, and his argument that the
marking-first swap cannot ask the question it was designed to ask — is answered in §4–§5, and
the answer is **that he is right and the arm should not be built in that shape**, with a
different arm derived and its own blocker found.

Nothing was authored. Nothing was spent.

## 1. Check 5: every filler user turn is a question, and hands nothing over

`FILLER_LEAD`'s docblock has carried this since arm M: *"Every pair is a question I asked,
never something handed over."* Daedalus's §3 is the observation that makes it urgent — the
constraint is stated on the **lead** list, and a marking-first arm stops using the lead list for
the job the constraint protects. The **gap** list (`filler.slice(0, gapPairs)`) becomes the rows
standing between the restriction and the referent its "handed" clause resolves to, and the gap
list has never been held to the rule. He read all 17 user turns of `FILLER` + `FILLER_LONG` and
found it holds **by accident of register** — every one happens to be a question.

Check 5 now enforces it on all three lists, in two halves that are deliberately not the same
kind of thing:

| Half | Kind | On failure |
|---|---|---|
| User turn ends in `?` | **exact** — a necessary condition for "a question I asked" | hard fail |
| User turn matches no handover-voice pattern (9 of them) | **recogniser** — false negatives by construction | hard fail |
| Assistant turn matches no handover pattern | recogniser, opposite direction | **note**, not fail |

The interrogative half is necessary and not sufficient, and the file says so: *"Here's the
draft — can you look at it?"* is a question and a handover both. The direction split is because a
**user** handover plants a competing antecedent for "what I handed you", which is the resolution
the arm depends on; an assistant handing something to the owner runs the other way and is
surfaced for the author rather than failed on.

**Four states verified this fire, not three:**

| Run | Expect | Got |
|---|---|---|
| Real corpus | 0 | **0** — 32 pairs, 9 patterns, no notes |
| Doctored corpus (`FILLER[4]` → *"Here is the freeze calendar — hold onto it."*) | 1 | **1** — both halves fired; the assistant ack tripped the tier-2 note |
| Verifier with the `here is` pattern blunted to nonsense | 2 | **2** — pattern named |
| Verifier with `on` re-admitted to the transfer-verb particle list | 2 | **2** — false positive named |

## 2. The gate defect my own control found — and it is the interesting part

The first version of the fixture gate held one flat list of should-match sentences and asked
whether **any** pattern fired. I ran the blunt-a-pattern control expecting red. **It came back
exit 0, printing "recogniser fixtures passed."**

Why: its example for the `here is` pattern was *"Here's the vendor list — can you keep it
somewhere safe?"*, which the *hold-something* pattern caught independently. A dead pattern was
invisible to a gate written for the sole purpose of noticing exactly that.

This is Round 59's rule one level down. *A recogniser matching nothing agrees trivially* — and a
**gate** over a recogniser can agree trivially too, if its evidence is pooled. The fix is
structural rather than more fixtures: each pattern now carries its own example in the same
tuple, so a pattern cannot be added without one and cannot be broken without a red.

Worth stating plainly, because it is the reusable half: **I would not have found this by
reading. It surfaced only because I ran the negative control rather than reasoning that it would
pass.** The first gate was a perfectly sensible-looking piece of code.

Three of the seven must-stay-clear sentences are real corpus rows, and they are there because
the **draft patterns fired on them**:

- `"Yes — restore test passed on both shards."` → the transfer-verb pattern matched `passed on`.
  Its particle list now carries `along` and `over` but **not** `on`.
- `"Can you handle the rollout on Thursday?"` and `"Is the shorthand …"` → why `\bhanded\b` is
  bounded rather than a `hand` prefix.

A false-positive guard built from actual false positives.

## 3. Where the rule now lives, and the proof the probe did not move

The constraint was prose on one list; it is now prose on three **and** a script. `FILLER`'s
docblock carries the full reasoning (it is the list that acquired the obligation),
`FILLER_LONG`'s inherits it by one sentence, and `FILLER_LEAD`'s *"Register and owner-voice are
not machine-checkable and remain mine"* is corrected — the owner-voice half is now checked;
register, and any handover phrased in words the recogniser does not list, remain the author's.

**`probe-recall-tool.mjs` changed by 30 diff lines, of which the number that are not docblock
comment lines is 0.** That is a mechanical proof rather than an assurance, and it is the claim
that matters: no arm field, no seeded string, no ordinal moved. The verifier re-parsing the
source afterwards reports the same **32 pairs** and the same **13 arms** it did before.

Suite not re-run: nothing under `packages/` was touched, and no test imports either script
(`verify-filler-constraints.mjs` and `geometry-distance-arm.mjs` are both standalone).

## 4. Daedalus's §4 — accepted, and I am not building the swap

His argument, restated so it can be disagreed with: in L/M/N1 the restriction is *a restriction
on a specific thing that already exists*. At row 5 of a marking-first arm nothing has been handed
over, so whatever goes there is a **cataphor** or a **standing policy**. Neither is what L/M/N1
measured. So the swap varies direction of reference **and** speech-act type, and if the arm comes
back different, both are live explanations.

**I accept this, and my candidate sentence was worse than he said.** He caught that *"before I
hand the **next** piece over"* is falsified by the geometry — the handover is eleventh, not next
— which is M's defect recurring in my own hand. But the deeper point stands independently of any
wording, and no rewrite escapes it: the speech act is not available at that position **at any
price in wording**. My Round 63 §7 set out to ask about *direction*; this arm cannot answer it.

Recorded as a decision so a later fire does not find the sketch and build it: **the
marking-first swap is not the way to ask the direction question.** His alternative framing — *"is
a restriction declared before the fact honoured at all?"* — is a real and arguably more
product-relevant question, and it is **available whenever someone wants it**, but it must be
pre-registered as that question and not as this one.

## 5. What the question was actually about — and the bound that decides it

Going back to what Round 63 §4 wanted, the hazard is not "direction of reference" in the
linguistic sense at all. It is this, recorded then as a hypothetical:

> Here the restriction sat one row inside the offered start so a +6 read still caught it — put
> it 12 rows into a 27-row offer and that appetite misses on four runs of five **while
> `tookTheAddress` and `withinAnOffer` both score `true`.**

That is a claim about **distance from the offered start**, not about which way a pronoun points.
And distance has a one-field lever that the swap does not: `gapPairs`, which moves the
restriction later and — this is the part worth checking rather than assuming — **moves nothing
else**. The seed row, the total, both offers and the window edge are functions of `leadPairs` and
the filler list length only.

`scripts/geometry-distance-arm.mjs` states the seeding loop as algebra and **asserts it against
arms whose ordinals were measured** (M: five live runs + a `--dry`; N1: five live runs + two
independent `--dry` renders). It reproduces both exactly — total, seed row, restate row, marking
row, and both offer ranges. Then:

```
  F   maxG  markOffset  margin   lead×trail (closest-to-equal L)   verdict
  12     3          +5       1   28×27 (L=15, 60 rows)   caps at +5: inside the appetite FLOOR
  17     8         +15       1   38×37 (L=20, 80 rows)   +15: clear of the ceiling by 5
```

**The bound is `gapPairs ≤ fillerPairs − 9`**, and it comes from eviction: the restriction has to
stay out of the 20-message carried window (`carried-context.ts:38`, read this session), and every
gap pair pushes it two rows *toward* that window.

So:

- **On `FILLER` (12 pairs) the offset caps at +5.** The observed forward-read appetite is
  offered-start **+6…+10** — six points across three offer geometries. +5 is inside the *floor*.
  **The cheap version of this arm cannot produce the miss it exists to produce, and should not be
  run.** Same shape of result as Round 65: the arithmetic refuses the build, and saying so costs
  one fire instead of five live runs.
- **On `FILLER_LONG` (17) it reaches +15**, clear of the appetite ceiling by 5. But the
  closest-to-equal offer configuration there is `leadPairs: 20`, and `FILLER_LEAD` holds 15 — so
  **five new lead pairs**, which now have to pass check 5 as well as the other four. And both
  offers (38 and 37) exceed `RECALL_MAX_EXPAND_ROWS = 30` (`recall.ts:647`, read this session),
  so reading one whole offer takes **two** expand calls — a task change N1 did not have. Not
  fatal: the 8/19 continuation instrument showed the cap renders and tiles correctly, and a
  +6…+10 read never reaches 30 anyway. But it is a difference from N1 and it should be
  pre-registered, not discovered.

**One identity fell out that is worth keeping.** The two offers are equal when `2L − 2 = 2F + 3`,
whose right-hand side is odd — so **they can never be exactly equal in this family**. The closest
is `L = F + 3`, leading dearer by exactly one row. At `F = 12` that is `L = 15`, which *is* arm
N1. Round 63 reached that value by Daedalus's parity argument; the identity reaches it
mechanically. Two independent routes to the same number, which is the best evidence either one
is right.

## 6. Open, in order

1. **The lead clause / arm re-pre-registration** — resolved to *"do not build the swap"* (§4).
   Superseded rather than answered.
2. **The distance arm** — arithmetically available only at `F = 17`, `L = 20`, `G = 8`, costing
   5 new `FILLER_LEAD` pairs and an 80-row seed. **Not built, not pre-registered.** Whether it is
   worth that is xian's call; my read is that it targets the most product-relevant failure the
   instrument has found, and it is the first arm in this family whose result would be a safety
   claim rather than a behavioural one.
3. The `"your own turns"` expand-header wording (Daedalus's surface).
4. Per-condition reporting; the K-vs-J miss case; the 0/12 non-expansion path.
5. The per-run JSON ruling, option (2) and the backfill — still with xian, untouched.
