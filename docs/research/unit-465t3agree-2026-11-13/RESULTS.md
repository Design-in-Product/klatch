# Unit 465-t3agree — results

Pre-registration `5990d75c`, pushed before this arm existed. Arm `grade-t3-agree.mjs`, drive
recorded in `drive1.out`.

## Verdict

```
VERDICT/1 ok legs=7 red=[] refused=[] preds=4 refuted=[] prefused=[]
```

All five pre-registered predictions held (P1–P2 of `PREREG.md` land as legs `P1`/`P1b`; P3 and
P5 both land under leg `P3`/`P3w`, since the real-state scan that refutes P3's negation is the
same drive that reproduces P5's witness).

## The question

Theseus's 11/13 named-not-endorsed line: `unit-465t3nonempty`'s `T3b` comment claims *"a genuine
disagreement is not gated on non-emptiness, since disagreement already implies it"* — true only
if `agree` (`sameMembers`) compares the two `removed` sets, false if it compares something that
can differ while both are empty. It does not compare `removed` directly — confirmed, it compares
`above(x)` vs `above(y)` (`r.sorted.filter(n => n > 292)`). The open question was whether that gap
is load-bearing: can `agree` read `false` while both `removed` are genuinely empty?

## Finding: no — and the reason is structural, not defensive

`raw` (`nonSubject ∪ subjectRounds`, computed in `attestedRounds()`) is built before `denialRe` is
read anywhere, so it is identical for the as-filed key and the cure at a fixed rev (`P1`/`P1b`,
measured: `|raw|=466` under both at `HEAD`, not merely read off the source). `removed.length===0`
is definitionally `filtered===raw` (`P2`). So if both `removed` are empty, `filtered` is `raw` on
both sides — and since `raw` is shared, `filtered` (hence `sorted`, hence `above()`, hence `agree`)
must be identical too. **`agree=false` with both `removed` empty is unreachable through
`attestedRounds()`** — not untested, structurally impossible given how `raw` and `removed` relate.

Driven across four real `(rev, cripple)` states (`now`/`prior` × `none`/`blind-key`), the one
state that actually disagrees (`prior/blind-key`) shows `nonEmpty=true`, reproducing
`unit-465t3nonempty`'s own `drive2.blind-key.out` (`T3-prior`/`T3b-prior`) exactly (`P3`/`P3w`).

## What the guarantee does NOT cover, named rather than left implicit

Feeding the bare `sameMembers`/`removedNonEmpty` functions two hand-built `{sorted, removed}`
objects that violate the shared-`raw` invariant (`removed:[]` on both, different `sorted`
content above 292) **does** produce `agree=false, nonEmpty=false` (`P4`) — the functions
themselves do not defend against mismatched inputs. The soundness Theseus asked about is a
property of `attestedRounds()` always handing `T3b` two reads that share one `raw`, not a
property `sameMembers`/`removedNonEmpty` enforce on their own. A future caller that feeds `t3b`
two differently-sourced reads (not both from this module, at the same rev) would not be covered
by this finding.

## Disposition

`unit-465t3nonempty`'s `T3b` is correct as shipped; its comment's claim is true, not merely
assumed. Theseus's and Daedalus's thread is closed from this seat with this finding — the
question was named as "yours or mine, whoever reaches it" and nobody else had reached it.
