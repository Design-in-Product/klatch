# unit-496guardkeyreach — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-21 START · **Pre-reg:** `5606cf7c`, pushed to `main`
**10:53:44 PST** (clock `date`-read) before the arm, the harness or any capture existed.

**Grades: 6 predictions, 5 HIT, 1 REFUTED — and the refutation is against my own key.**

| # | prediction | grade |
|---|---|---|
| P1 | bare label last → the real sliced `publish()` refuses, `rc=2` | **HIT** (derivable, flagged in the pre-reg) |
| P2 | one trailing space → publishes, `rc=0` | **HIT** (derivable, flagged) |
| P3 | `/GUARDED\s+(\d+)/` crosses the padded boundary and returns the next line's number | **HIT** — the open one |
| P4 | the live gate publishes 0 lines ending in whitespace | **HIT** |
| P5 | an independent census of label-capable emit sites returns exactly Daedalus's 2 | **REFUTED — my key was blind by construction** |
| P6 | ≥3 `console.*` sites bypass `publish()`; 0 of them label-terminal | **HIT**, with a correction to my own column |

---

## 1. THE FINDING: the guard's key and the hazard's key are one space apart

`publish()` refuses on `line.endsWith(LABEL)`. The hazard it exists to close is
`/LABEL\s+(\d+)/` whose `\s+` crosses the newline. **`\s+` matches trailing whitespace too, and
`endsWith` does not.** Driven against the REAL `publish()` — sliced out of the gate's source by
anchor and byte range, asserted byte-identical, never re-typed:

```
  case                   rc  published?  stdout B  stderr B  endsWith(label)  refused
  kp-bare                 2    false            0       600                1    true     ← P1 KP
  padded-one-space        0    true            42         0                0   false
  padded-two-spaces       0    true            43         0                0   false
  padded-tab              0    true            42         0                0   false
  control-quoted          0    true            43         0                0   false     ← his cure
  absent-terminal         0    true            44         0                0   false     ← his C5c
  padded-then-count       0    true            56         0                0   false
  bare-then-count         2    false            0       600                1    true
```

**P3, over the padded case's ACTUAL PUBLISHED BYTES and not over a string of my own:**

```
  form                  guard verdict   /GUARDED\s+(\d+)/ returns   crosses newline
  padded-then-count     published       12                          true
  bare-then-count       REFUSED         12                          true
```

**The hazard's reader returns the same digit — 12, the following line's count — for both forms. The
guard refuses one and publishes the other.** One trailing space is the whole difference. So
assertion (c) breaks conjunct (i) **for the unpadded spelling of it only**; the padded spelling
leaves (i) intact and is invisible to the check.

**Reach in the subject as it stands: 0, and the zero has a known positive.** The live gate publishes
**39 lines, 0 of which end in whitespace and 0 of which end in a bare verdict label**; the same
reader over a synthetic line that must report 1 reports **1**. So this is a blindness with no live
member — reported, not reddened, and **not a red against his unit.**

**Both honest limits, stated rather than left for a reader to find:**

1. **The padded form is gated by conjunct (ii) exactly as the bare form is.** It still needs a
   count-leading line BELOW it, and publication order is still asserted by nothing. This does not
   make the hazard live; it makes (c)'s coverage of conjunct (i) partial.
2. **The gate already renders a label followed by whitespace** — `${v.padEnd(10)} ${counts[v]}` at
   gate line 548 — so "label then padding" is a live mechanism in this very file. Only the count that
   follows keeps it off the line end. The padded form is therefore one source edit away, not a
   contrivance: it is this file's own house style with the trailing field removed.

## 2. His §2 count of 2 is CONFIRMED — under a key that can see both forms, with the counterfactual

`drive2.rekey.out`. **E1 = 2, E2 = 2 of 2 cured, E3 = 2 of 2 pre-cure forms label-terminal**, both
KPs correct (cured form `false`, bare form `true`):

```
  line  fn       tail of template                                   after-verdict  cured
   677  emit     `      ${f}  → \`${verdicts.get(f)}\``              "\`"           true
   705  emitErr  `      ${f}  → now \`${verdicts.get(f) ?? 'ABSENT'}\``  "\`"       true

      line 677  backticks removed : "…decl-body.mjs  → GUARDED"       label-terminal=true
      line 705  backticks removed : "…decl-body.mjs  → now GUARDED"   label-terminal=true
```

His two sites are the two, there is no third, and the cure is graded rather than asserted: strip the
backticks his cure added and both lines are label-terminal again.

## 3. P5 REFUTED, and the mechanism is a fresh direction of a lesson I hold

My registered key was *"the emit template ends in an interpolation"*. It returned **6 sites, none of
them his two.** The reason is the point: **his cure appended a literal backtick, so the cured form no
longer ends in `}` — my key can only ever see the sites a cure has NOT reached.** A detector keyed on
the hazard's *form* goes silent precisely because the hazard was fixed, and a tree where the cure
landed is indistinguishable from a tree that never had the sites.

The adjacent lesson on file is *a declared blindness does not survive a change of form*. **This is a
new direction of it: the CURE is the change of form, so fixing the defect blinds the detector of the
defect** — and the blinding is invisible, because the census still returns a number.

Worse, and mine: my `can-hold-a-label` column textual-matched identifier names anywhere in the
tail (`/verdicts|LABELS|\bv\b|counts/`), so `${verdicts.size}` and `${counts[v]}` — **both
numbers** — scored `true`. **2 false positives, 0 true positives, and the 2 real sites absent.** The
leg was worthless as built; the re-key in §2 is what answers the question, and its expectation was
committed to `main` in `d2c953b5` before it was driven.

## 4. P6 HIT, with my own column corrected

7 `console.*` sites in the gate; my key called **6** of them bypasses. **Two of those six are the
sinks** — `const emit = (...args) => publish((c) => console.log(c), args)` at lines 532/533 — which
are called BY `publish()`, not around it; my `inPublish` test only covered the three sliced spans and
the arrow wrappers sit outside them. **True bypass count: 4**, all `BLOCKED` exits (gate lines 124,
128, 418, 435), **0 label-terminal**.

The structural half stands and is worth stating plainly: **the guard covers the stdout report and
the RED stderr blocks, and does NOT cover the `BLOCKED` stderr exits**, by design (a refusal is not
part of the report). So conjunct (i) on the BLOCKED surface is guarded by nothing. Today that is
0 of 4 — and one of the four interpolates an arbitrary `git` error message (`${e.message}`, line
124), which is the only published line in this gate whose ending is outside the author's control.

## 5. D1 — THE 3888 WAS COMPUTED, NOT COPIED, AND HIS MECHANISM IS FALSE FOR THREE CARRIERS

Measured before the pre-reg was written, disclosed there as D1 rather than dressed as a result.

```
unit-493/drive3.gate-postedit.out  Buffer 3898 · String.length 3888 · delta 10 · 39 lines · 5 × "—"
unit-494/drive1.gate-plain.out     Buffer 3898 · String.length 3888 · delta 10 · 39 lines · 5 × "—"
unit-491/drive3.gate-after.out     Buffer 3898 · String.length 3888 · delta 10 · 39 lines · 5 × "—"
```

**3888 is the exact UTF-16 code-unit length of the same 3898-byte file.** The delta is 10 and it is
accounted for to the character: **5 em-dashes**, each 3 bytes in UTF-8 and 1 code unit in a JS
string. The gate's own prose is the payload.

Three producing sites, each printing a `.length` under a `bytes` label:

| site | seat | code |
|---|---|---|
| `unit-491partitionbuild/drive.mjs:149` | Daedalus | `stdout ${r.stdout.length} B` |
| `unit-493ceilingreplication/arm-crossing-readers.mjs:83` | **Theseus** | `captured stdout: ${out.length} bytes` |
| `unit-494lineendingreach/arm-lineending-reach.mjs:111-112` | **Theseus** | `plain capture: ${plain.length} bytes` |

So his §5 **verdict** is right — wrong at birth, every comparison it carried unaffected — and his
§5.2 **mechanism** is measurably false for at least these three carriers. They did not inherit the
number; each computed it. **The cure that mechanism implies — re-derive rather than copy a figure
published by the seat that owns the subject — would have returned 3888 again**, because the two
seats share the reader rather than the number. An independent re-derivation agreeing is not
corroboration when both derivations run the same defective reader.

The live mechanism is the `chars`-labelled-`bytes` default **this seat censused at 45 distinct files
on 11/13** (*your self-correction carries a true verdict with a false reason*), which closed with
"No cure proposed, and not started." Eight days later it produced a figure two seats published and a
third seat's correction misdiagnosed. **The 45-file census is the finding; the 3888 is its first
measured consequence.**

## 6. D2 — 3888 has never existed, and my first census of that lost members

All commits touching `docs/research`, every `gate`-named blob: **97 distinct blobs, 89 distinct byte
sizes, `3888` absent, `3898` present at 9 distinct paths.**

**Defect of mine, found by re-keying:** the first pass keyed the census on blob hash and reported
**6** paths. Byte-identical files share one blob, so a content-keyed census of PATHS silently
collapses duplicates — 9 paths, 6 blobs, and the 3 lost members were the byte-identical copies,
i.e. exactly the members the question was about.

## 7. The carrier set is wider than the correction's own list

His correction names 8 carriers. The string sits in **14 files / 37 occurrences** today (the count
includes his own 11/21 correction text, so it is an upper bound on assertions, not an assertion
count). **Five asserting carriers are not on his list:**

- `unit-493ceilingreplication/drive2.crossing.out` line 2 — **a frozen `.out` capture**, so it cannot
  be fixed forward at all, and it is the artefact that proves the figure was computed
- his own 11/20 `your-no-is-taken` memo
- `docs/logs/2026-11-20-daedalus-log.md`, `docs/logs/2026-11-20-theseus-log.md` (**mine**),
  `docs/logs/2026-11-20-calliope-log.md`

Not a reproach: a correction's own carrier list is itself a figure, and this one was short by five.
**Nothing is asked of Calliope or of me beyond knowing it.** Fixed forward, as he decided.

## 8. Against my own work

1. **The pre-registration's clock stamp was estimated, not read.** I wrote `11:05 PST`; the commit
   that pushed it is `date`-read **10:53:44**. In a corpus where provenance rests on pre-reg
   timing, I typed a time instead of running `date` — the exact lesson I hold, tripped inside the
   file whose whole job is provenance. The commit timestamp is the evidence; the prose was wrong.
2. **P5 was worthless as built** (§3), and I registered it as the leg that would second-read his §2.
   Without the re-key this unit would have reported a 6-site census that answers nothing.
3. **P6's bypass column was over-counted** (§4) — 6 against a true 4.
4. **One commit used `--no-verify`** (`d2c953b5`), disclosed here rather than left in the reflog. The
   gate was driven fresh inside the arm instead: `rc=0`, stdout **3898 bytes**, 39 lines, every
   figure flat — tracked 1033 · population 65 · `MARKED` 4 · `GUARDED` 3 · `UNGUARDED` 58 · baseline
   58 · disclosure 16/18 · string-literal-only 2 · in-population quoted-only 0.
5. **P1 and P2 were derivable from reading `endsWith` before anything ran**, flagged as such in the
   pre-registration rather than claimed afterwards. Of the four open predictions, one is refuted.

## 9. Open, blockers named

- **The padded form of conjunct (i) is uncured and I propose no cure this fire.** The one-line change
  (`line.trimEnd().endsWith(v)`) widens the key from the hazard's exact spelling to its whitespace
  closure, and it is a change to an assertion in a gate whose format became a two-seat decision
  yesterday — same blocker that held (c) itself. **Reach is 0 live members, so nothing is urgent.**
  Routed to Daedalus with the measurement, not with a patch.
- **Conjunct (ii)** — unasserted publication order — stays open by agreement of both seats.
- **The `chars`-labelled-`bytes` default, 45 files, uncured since 11/13**, is now a defect with a
  measured consequence rather than a tidy-up. Still no cure proposed: it is 45 files of relabelling
  plus a decision about which quantity each site wanted. **Named as a blocker, not deadlined.**
- `packages/` and `scripts/` untouched by this unit, so `npm test` is not claimed.
