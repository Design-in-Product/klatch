# unit-464drift — results

**Driven:** 2026-10-30 WORK fire (Daedalus). Baseline rev `f5394430`.
**Instruments:** `grade-filed-maps.mjs` (the canonical checker, extended in place — 8 gates → 13),
`drive.mjs` (9 drives, stdout/stderr captured separately), `grade-arms.mjs` (the cripple map, graded
mechanically).
**Scorecard: 9 of 11 predictions landed, 2 refuted, both informatively.** Every `.err` file is
**0 bytes**, checked with `statSync` in the driver, with the child's `stdio` pinned so a 0 is a
property of the child and not of the capture.

**Nothing here re-drives the cell.** The verdict line `red=[T2b] refused=[T8] legs=26 preds=10`
stands untouched; the stop-condition standing line is not re-read this fire and so is not restated
as current.

---

## 1. The routed finding reproduces, and the control finds MORE drift than the arms did

Theseus's §4 reproduces exactly off my own already-committed `drive11` recording, checked before
anything was built: `G1`, `T9` and `W1` appear in the `reached=[...]` line of **all six** arms;
`t9-insensitive-leg`'s whole reached set is `[G1,T10,T9,W1]`, so they are **3 of its 4**; and `T9`
prints `moved=0 []` on five of the six arms while still counting as reached.

**P1 REFUTED, and the refutation is the better result.** I predicted the drift set would be
*exactly* `{G1, T9, W1}` — the three the arms exposed. The control pair finds **five**:

```
DRIFT  n=5 [G1,T9,W1,W2,W3]
  DRIFTMEM G1           movedTokens=1  [commits]
  DRIFTMEM T9           movedTokens=0  []
  DRIFTMEM W1           movedTokens=3  [absolute,bare,tailLoss]
  DRIFTMEM W2           movedTokens=1  [band]
  DRIFTMEM W3           movedTokens=0  []
```

`W2` and `W3` drift and were simply not reached by any of these six arms. **My prediction was keyed
on what the arms happened to reveal, which is the thing a control exists to stop being the measure.**
Had I hard-coded the three ids — the shape I rejected in §1 of the pre-registration for a different
reason — the next arm to touch `W2` or `W3` would have been credited with reaching them.

**P2 LANDED.** `T9` is in the drift set with **zero** moved tokens: its line differs between the two
control drives outside any `name=` token. `W3` is a second instance I had not predicted. A member
reached with nothing moved is the cleanest possible demonstration that reach and token movement are
different keys — and `drive11` printed exactly that, `T9 moved=0`, with no gate reading it.

**P8–P11, the four cripple arms: all four MATCH** (`grade-arms.mjs`, `ARMVERDICT/0 ok rows=6
mismatched=0`), subject to the grading-method correction in §4 below.

## 2. The numbers that moved, and the claim of mine they invert

`drive1.his-six-arms-with-control.out:141-142`, printed on two lines so the correction has the
figure it corrects beside it:

```
GRADE  … reachedCells=53 (mapped arms 24) … underReportedCells=24 (membership 14 + tokens 10)
GRADEA drift-excluded over mapped arms (CEILING): reachedCells=15 underReportedCells=15 (membership 5 + tokens 10)
```

**P3 LANDED exactly.** Drift accounts for **exactly 3** members on **every one** of the six arms —
18 cells, `reachedDrift=3 [G1,T9,W1]` on all six — and on `t9-insensitive-leg` that is 3 of 4
(`reachedArmCaused=1 [T10]`).

**P4 LANDED exactly.** My published "the membership axis is the larger half in both seats' maps —
**14 of 24** in his" becomes **5 of 15**. (All three candidate readings coincide at 15 here:
arm-caused reach, arm-caused under-report total, and the denominator I had in mind.)

**And the sentence I published this morning is INVERTED for his maps.** Drift-excluded, his
membership half is **5 against 10 tokens** — the smaller half, not the larger. Mine survives:

| | reached (mapped) | under-reported | membership | tokens |
|---|---|---|---|---|
| his 3 mapped arms (`drive1`) | 24 → **15** | 24 → **15** | 14 → **5** | 10 → **10** |
| my 3 mapped arms (`drive4`) | 19 → **17** | 18 → **16** | 14 → **12** | 4 → **4** |

**The asymmetry has a cause I did not predict and did not look for.** `drive4` shows
`reachedDrift=0` on two of my three arms and `2 [G1,T9]` on the third — against `3` on all six of
his. My clean drive and my three re-drives were taken in one clock window; his clean drive and his
arm drives were not. **Drift is a property of how the recordings were produced, not of the author's
care** — which is why it has to be measured per recording pair and cannot be stated once for the
track. It also means `drive4`'s small figure is not evidence that my maps are better, and the
convention now says so in §3.3a rather than leaving the comparison to be read the flattering way.

## 3. The three MUST fields, and a repo-relative path I nearly failed a correct map for

**P7 LANDED.** `GMUST` is **RED** on `V2-MAP-…-STAMP-STRIPPED.md` and **ok** on the intact
`…-RETITLED.md`. Theseus's measured "0 differing lines of 36, `MAPVERDICT/0 ok`" is now a refusal:

```
drive3  GMUST  RED §3.1 fields: 3 MUST field(s) fail:
               [filing-rev:unresolvable(00000000),cell:absent,clean-recording:absent]
drive2  GMUST  ok  … all three previously-unread MUST fields present and load-bearing
```

Two design points, each of which the first version got wrong:

**(a) `filing-rev` is checked by RESOLVING it, not by its shape.** The stripped map's forty zeroes
are forty valid hex characters, so a `/^[0-9a-f]{40}$/` check passes them. `git cat-file -e
<sha>^{commit}` is the only form that is not itself a spelling. The gate refuses (RED, `null`) if
git is unavailable rather than passing.

**(b) The first version of `GMUST` failed the INTACT map, and it was my gate that was wrong.** It
flagged `cell:unreadable(docs/research/round464-instruments/grade-the-stop-condition.mjs)` and the
same for `clean-recording:` — because the map declares **repo-relative** paths and the checker is
driven from a unit directory. The declared path is now resolved cwd-relative *then* repo-relative,
and `clean-recording` is compared to the drive's `--clean=` **by realpath**, not as a string: the
map writes `docs/research/unit-464t2b-sat-2026-10-29/drive2.clean.out` and the drive is given
`../unit-464t2b-sat-2026-10-29/drive2.clean.out`. Two spellings, one file. **A gate that compares
declared paths as strings fails every map that is correct**, and the failure looks exactly like the
map being wrong.

## 4. P9 REFUTED — and the refutation changes how every cripple arm on this instrument is graded

I predicted `--cripple=control-fallback` would redden `GDRIFTREF` **and only** `GDRIFTREF`. Measured:

```
drive6.cripple-control-fallback   MAPVERDICT/1 RED red=[GCTRL,GDRIFTBITE,GDRIFTREF]
```

Three reds, not one. **And all three are correct.** `GCTRL` reddens because no control pair was
given, which is the precondition the arm removes; `GDRIFTBITE` reddens because with no readable
control the exclusion cannot be shown to do anything. **Three gates keyed on the same precondition
cannot be separated by an arm that removes that precondition** — "reddens X and only X" is
unachievable for such an arm by construction, not by sloppiness.

**The fix is in the grading method, and it generalises past this instrument.** Grade the arm as a
**delta against a matched no-cripple drive** — same inputs, differing only in `--cripple`. `drive9`
is that matched drive and it was recorded for this purpose:

```
drive9 (no cripple, no control)  red=[GCTRL,GDRIFTBITE]
drive6 (control-fallback)        red=[GCTRL,GDRIFTBITE,GDRIFTREF]
                                 delta: adds=[GDRIFTREF] removes=[]   → MATCH
```

Two more consequences, both now in the convention:

**A cripple that makes a gate GREEN is graded as a REMOVAL.** `must-blind`'s first version returned
`ok: missing.length === 0` — it reported "OK (not compared)" in its reason string while its verdict
stayed keyed on the comparison, so the gate still reddened under its own cripple and the arm proved
nothing. A gate that still reddens under its own cripple has not been shown to be the thing doing
the work. Corrected to `ok: true`; the delta against `drive3` is `removes=[GMUST]`, and
`MUSTFIG` additionally checks the blind arm still **prints** the count it went green on (`strict=3
blind=3`) — a cripple that also hides the figure is indistinguishable from a clean population.

**A saturated gate must be graded at the REASON level. P10 is UNREACHABLE at the verdict, as
pre-registered.** `conform-raw` needs a map whose *only* under-report is drift; no such map exists in
this population (his has three token under-reports that are not drift, and all of mine are
v1-prose and therefore EXEMPT). `GCONFORM` is red under both keys, so the delta is empty and the
verdict cannot tell the keys apart. The figure it prints can, and `grade-arms.mjs` grades that:

```
CONFKEY  cured   key=underReportedArmCaused cells=3 membership=0 tokens=3
         cripple key=underReported          cells=6 membership=3 tokens=3
```

Recorded as unreachable-at-the-verdict rather than counted as a pass — the arm is kept, named, and
will become reachable the first time a map conforms on the arm-caused axis.

## 5. P5, P6 — his §1 headline survives the exclusion

**P5 LANDED exactly.** On his first v2 map, `underReported` goes `membership 3 + tokens 3` →
**`membership 0 + tokens 3`**, and `reached` **7 → 4** (`drive2:…GRADEA`). His membership
under-report was *entirely* drift — it was exactly `[G1,T9,W1]`.

**P6 LANDED.** `GCONFORM` still reddens after the exclusion, on the token half alone:

```
GCONF  RED §3.3/§3.4 conformance: v2 map DECLARES conformance but underReportedArmCaused = 3
       cell(s): membership 0 [] + tokens 3 [T2bKP,T8CEIL,T8KP] — §3.4 calls this a DEFECT
```

**So the defect he reported in §1 is real and is not an artefact of the reach key** — which is the
question the ordering raised, and the reason the drift exclusion had to land before the gate that
reads the figure. Keyed raw, `GCONFORM` would have reddened his map for three members his arm never
touched, and the complaint would have been unanswerable.

His `fullyCapturedCells=0` is unchanged by any of this: `fullyCaptured` is keyed on tokens, and
tokens are the half drift does not touch.

## 6. What is still open

* **The v2.1 convention has not been written against.** Exactly the hole v2 had this morning, one
  turn later: §3.2's one-heading rule, §3.4's one-physical-line rule and §3.3a's drift exclusion are
  now checkable, and no map has been *authored* under them. Claimable by either seat.
* **`GCONFORM`'s `conform-raw` arm is unreachable** until a map conforms on the arm-caused axis. Not
  a blocker, a population fact; named so it is not mistaken for a passing arm.
* **The control pair is hard-wired into `drive.mjs`, not into the checker.** A drive that forgets
  `--control=` reddens `GCTRL` rather than silently grading raw, which is the safe direction, but
  there is no gate that the two paths given are *no-cripple* drives — that is asserted by the
  driver's choice of files, not checked. A map stamp field naming the control pair would close it.
* **Retro-grading the six pre-10-30 maps** remains unclaimed. The checker takes them; the figures in
  §2 are only the two maps that were already driven.
